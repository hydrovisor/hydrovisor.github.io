// Auswertung des KI-Eval (UC4-AK3, Konzept 8.2 bewertung_eval, 11.3 Default, 12.6, 13.5 M0; Plan 14).
// Rein: Referenz als Text, Läufe als Werte; Datum des Berichts in der übergebenen Zeitzone.
import { kalendertag, type Zeitzone } from '../zeit.ts';
import { KI_FELDER, type KiFeld } from './schema.ts';

export type Bewertung = 'richtig' | 'falsch' | 'fehlend' | 'erfunden';
export const NICHT_AUF_DER_TUETE = 'nicht auf der Tüte';
const KOPF = 'sorte_zeile_id,feld,soll';
const ZAHLENFELDER: readonly KiFeld[] = ['keimtemperatur', 'keimdauer', 'kulturdauer', 'aussaatfenster'];
const KOSTEN_WARNUNG_USD = 0.05;

export interface Referenzzeile {
  sorteZeileId: string;
  feld: KiFeld;
  soll: string;
}

export interface Lauf {
  sorteZeileId: string;
  modell: string;
  texte: Record<KiFeld, string | null> | null;
  verworfen: readonly string[];
  dauerMs: number;
  eingabeTokens: number;
  ausgabeTokens: number;
  fehler?: string;
}

export interface Preise {
  [modell: string]: { eingabeJeMio: number; ausgabeJeMio: number };
}

export interface ModellAuswertung {
  modell: string;
  bewertungen: Record<string, Record<KiFeld, Bewertung>>;
  richtig: number;
  felder: number;
  quoteGesamt: number;
  quoteJeFeld: Record<KiFeld, number>;
  schwelle80: Record<KiFeld, boolean>;
  m0: boolean;
  dauerMedianMs: number;
  dauerMaxMs: number;
  kostenJeTueteUsd: number;
}

export interface Auswertung {
  tueten: string[];
  modelle: ModellAuswertung[];
}

/** eine CSV-Zeile mit Anführungszeichen nach RFC 4180 */
function zellen(zeile: string): string[] {
  const ergebnis: string[] = [];
  let aktuell = '';
  let inZitat = false;
  for (let i = 0; i < zeile.length; i++) {
    const z = zeile[i];
    if (inZitat) {
      if (z === '"' && zeile[i + 1] === '"') {
        aktuell += '"';
        i++;
      } else if (z === '"') inZitat = false;
      else aktuell += z;
    } else if (z === '"') inZitat = true;
    else if (z === ',') {
      ergebnis.push(aktuell);
      aktuell = '';
    } else aktuell += z;
  }
  ergebnis.push(aktuell);
  return ergebnis;
}

/** Referenz lesen; unbekanntes Feld, doppelte Zeile oder falscher Kopf → Fehler mit Zeilennummer (Kopf = Zeile 1) */
export function referenzLesen(csv: string): Referenzzeile[] {
  const zeilen = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
  if ((zeilen[0] ?? '').trim() !== KOPF) throw new Error(`Zeile 1: Kopf «${KOPF}» erwartet`);
  const ergebnis: Referenzzeile[] = [];
  const gesehen = new Set<string>();
  zeilen.slice(1).forEach((zeile, i) => {
    const nr = i + 2;
    if (zeile.trim() === '') return;
    const [sorteZeileId = '', feld = '', ...rest] = zellen(zeile);
    const soll = rest.join(',').trim();
    if (!(KI_FELDER as readonly string[]).includes(feld.trim()))
      throw new Error(`Zeile ${nr}: unbekanntes Feld «${feld}»`);
    if (sorteZeileId.trim() === '' || soll === '') throw new Error(`Zeile ${nr}: zeile_id oder Soll fehlt`);
    const schluessel = `${sorteZeileId.trim()}|${feld.trim()}`;
    if (gesehen.has(schluessel))
      throw new Error(`Zeile ${nr}: ${sorteZeileId.trim()} ${feld.trim()} doppelt`);
    gesehen.add(schluessel);
    ergebnis.push({ sorteZeileId: sorteZeileId.trim(), feld: feld.trim() as KiFeld, soll });
  });
  return ergebnis;
}

function grundform(wert: string): string {
  return wert
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/[^a-z0-9-]/g, '');
}

/** Normalform für den Vergleich: Kleinschreibung, Umlaute, ohne Leerraum und Satzzeichen; Zahlen bei Bereichen */
export function normalform(feld: KiFeld, wert: string): string {
  if (ZAHLENFELDER.includes(feld)) {
    const zahlen = wert.match(/\d+(?:[.,]\d+)?/g);
    if (zahlen) return zahlen.map((z) => z.replace(',', '.')).join('-');
  }
  const g = grundform(wert);
  return feld === 'keimart' ? g.replace(/keimer$/, '') : g;
}

/** Bewertung eines Felds (8.2 bewertung_eval); Alternativen im Soll mit «|» (A2) */
export function feldBewerten(feld: KiFeld, soll: string, ist: string | null): Bewertung {
  const vorhanden = ist !== null && ist.trim() !== '';
  if (grundform(soll) === grundform(NICHT_AUF_DER_TUETE)) return vorhanden ? 'erfunden' : 'richtig';
  if (!vorhanden) return 'fehlend';
  const n = normalform(feld, ist);
  return soll.split('|').some((s) => normalform(feld, s) === n) ? 'richtig' : 'falsch';
}

function median(werte: readonly number[]): number {
  if (werte.length === 0) return 0;
  const s = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mitte] ?? 0) : ((s[mitte - 1] ?? 0) + (s[mitte] ?? 0)) / 2;
}

const jeFeld = <T>(f: (feld: KiFeld) => T) =>
  Object.fromEntries(KI_FELDER.map((feld) => [feld, f(feld)])) as Record<KiFeld, T>;

export function auswerten(
  referenz: readonly Referenzzeile[],
  laeufe: readonly Lauf[],
  preise: Preise,
): Auswertung {
  const soll = new Map(referenz.map((r) => [`${r.sorteZeileId}|${r.feld}`, r.soll]));
  const tueten = [...new Set(laeufe.map((l) => l.sorteZeileId))];
  const modelle = [...new Set(laeufe.map((l) => l.modell))];
  return {
    tueten,
    modelle: modelle.map((modell) => {
      const eigene = laeufe.filter((l) => l.modell === modell);
      const bewertungen: Record<string, Record<KiFeld, Bewertung>> = {};
      const zaehler = jeFeld(() => ({ richtig: 0, bewertet: 0 }));
      for (const l of eigene) {
        const b = {} as Record<KiFeld, Bewertung>;
        for (const feld of KI_FELDER) {
          const s = soll.get(`${l.sorteZeileId}|${feld}`);
          if (s === undefined) continue;
          b[feld] = feldBewerten(feld, s, l.texte?.[feld] ?? null);
          zaehler[feld].bewertet += 1;
          if (b[feld] === 'richtig') zaehler[feld].richtig += 1;
        }
        bewertungen[l.sorteZeileId] = b;
      }
      const richtig = KI_FELDER.reduce((n, f) => n + zaehler[f].richtig, 0);
      const felder = KI_FELDER.reduce((n, f) => n + zaehler[f].bewertet, 0);
      const quoteJeFeld = jeFeld((f) => (zaehler[f].bewertet ? zaehler[f].richtig / zaehler[f].bewertet : 0));
      const preis = preise[modell] ?? { eingabeJeMio: 0, ausgabeJeMio: 0 };
      const kosten = eigene.map(
        (l) => (l.eingabeTokens * preis.eingabeJeMio + l.ausgabeTokens * preis.ausgabeJeMio) / 1e6,
      );
      return {
        modell,
        bewertungen,
        richtig,
        felder,
        quoteGesamt: felder ? richtig / felder : 0,
        quoteJeFeld,
        schwelle80: jeFeld((f) => quoteJeFeld[f] >= 0.8),
        m0:
          eigene.length > 0 &&
          eigene.every((l) =>
            (['name', 'art', 'keimart'] as const).every(
              (f) => bewertungen[l.sorteZeileId]?.[f] === 'richtig',
            ),
          ),
        dauerMedianMs: median(eigene.map((l) => l.dauerMs)),
        dauerMaxMs: Math.max(0, ...eigene.map((l) => l.dauerMs)),
        kostenJeTueteUsd: kosten.length ? kosten.reduce((a, b) => a + b, 0) / kosten.length : 0,
      };
    }),
  };
}

/** Default (11.3): höhere Trefferquote; liegen die besten höchstens 1 Feld auseinander, die kleinere Median-Dauer;
 *  ein Modell ohne M0 nur, wenn keines M0 erfüllt (A7) */
export function defaultWaehlen(a: Auswertung): string {
  const mitM0 = a.modelle.filter((m) => m.m0);
  const kandidaten = mitM0.length > 0 ? mitM0 : a.modelle;
  const bestes = Math.max(...kandidaten.map((m) => m.richtig));
  const knapp = kandidaten.filter((m) => m.richtig >= bestes - 1);
  knapp.sort((x, y) => x.dauerMedianMs - y.dauerMedianMs || y.richtig - x.richtig);
  return knapp[0]?.modell ?? '';
}

function datum(stand: Date, zeitzone: Zeitzone): string {
  const [j, m, d] = kalendertag(stand, zeitzone).split('-').map(Number);
  return `${d}.${m}.${j}`;
}

const prozent = (anteil: number) => `${Math.round(anteil * 100)} %`;
const sekunden = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** Bericht für den Issue-Kommentar; ohne Schlüssel, Bilddaten oder volle Antworten */
export function berichtMarkdown(a: Auswertung, stand: Date, zeitzone: Zeitzone): string {
  const zeilen = [
    `UC4-AK3 [Eval] KI-Eval an ${a.tueten.length} Tüten, Stand ${datum(stand, zeitzone)}`,
    '',
    '| Modell | richtig | Quote | M0 (Name, Art, Keimart) | Median | Max | Kosten je Tüte |',
    '|---|---|---|---|---|---|---|',
    ...a.modelle.map(
      (m) =>
        `| ${m.modell} | ${m.richtig} von ${m.felder} | ${prozent(m.quoteGesamt)} | ${m.m0 ? 'erfüllt' : 'nicht erfüllt'} | ${sekunden(m.dauerMedianMs)} | ${sekunden(m.dauerMaxMs)} | ${m.kostenJeTueteUsd.toFixed(4)} USD |`,
    ),
    '',
    `| Feld | ${a.modelle.map((m) => m.modell).join(' | ')} |`,
    `|---|${a.modelle.map(() => '---|').join('')}`,
    ...KI_FELDER.map(
      (f) =>
        `| ${f} | ${a.modelle.map((m) => `${prozent(m.quoteJeFeld[f])}${m.schwelle80[f] ? '' : ' (unter 80 %)'}`).join(' | ')} |`,
    ),
    '',
    'Abweichungen je Tüte:',
    ...a.modelle.flatMap((m) =>
      a.tueten.flatMap((t) => {
        const b = m.bewertungen[t];
        if (!b) return [];
        const falsch = KI_FELDER.filter((f) => b[f] !== undefined && b[f] !== 'richtig').map(
          (f) => `${f} ${b[f]}`,
        );
        return falsch.length ? [`- ${m.modell}, ${t}: ${falsch.join(', ')}`] : [];
      }),
    ),
  ];
  if (zeilen[zeilen.length - 1] === 'Abweichungen je Tüte:') zeilen.push('- keine');
  for (const m of a.modelle)
    if (m.kostenJeTueteUsd > KOSTEN_WARNUNG_USD)
      zeilen.push(
        '',
        `**Warnung:** ${m.modell} kostet ${m.kostenJeTueteUsd.toFixed(4)} USD je Tüte, über 0.05 USD (RR8).`,
      );
  zeilen.push(
    '',
    `Default nach 11.3: ${defaultWaehlen(a)}. Die Schwelle 80 % je Feld gilt verbindlich erst mit 22 Tüten (I2-05).`,
  );
  return zeilen.join('\n');
}
