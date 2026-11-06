// Verlauf der Messwerte eines Platzes (Plan 26; R10.2 Trendzeile und Spur, R10.3 «veraltet» und Sprung-Rückfrage;
// A11 bis A14, A16, A19). Rein: `jetzt` als Parameter, Vergleiche in ganzen Hundertsteln (G3).
import type { Groesse } from '../messung/eingabe.ts';
import { alsText, type Band, type Hundertstel } from './bewertung.ts';

export interface AnsatzZeile {
  id: string;
  platz_id: string;
  typ: 'neuansatz' | 'nachfuellen' | 'ph_korrektur' | 'teilwechsel';
  status: string;
  begonnen_am: string;
  kontrollmessung_id: string | null;
  endmessung_id: string | null;
  storniert_am: string | null;
}

const ms = (iso: string) => Date.parse(iso);

/**
 * R10.3: eine Messung ist veraltet, wenn danach am selben Platz ein gültiger Neuansatz oder ein Nachfüllen begann,
 * zu dem sie nicht gehört (A14: Teilwechsel und pH-Korrektur nicht).
 */
export function istVeraltet(
  messung: { id: string; platz_id: string | null; gilt_ab: string; ansatz_id: string | null },
  ansaetze: readonly AnsatzZeile[],
): boolean {
  return ansaetze.some(
    (a) =>
      a.platz_id === messung.platz_id &&
      a.storniert_am === null &&
      a.status !== 'abgebrochen' &&
      (a.typ === 'neuansatz' || a.typ === 'nachfuellen') &&
      ms(a.begonnen_am) > ms(messung.gilt_ab) &&
      messung.ansatz_id !== a.id &&
      a.kontrollmessung_id !== messung.id &&
      a.endmessung_id !== messung.id,
  );
}

/** Schwelle für den Trendpfeil: EC 0.10, pH 0.20 (R10.2), °C 1.0 (A12) */
const PFEIL_AB: Readonly<Record<Groesse, Hundertstel>> = { ec: 10, ph: 20, temperatur: 100 };

export function trendZeile(
  groesse: Groesse,
  vorher: Hundertstel | undefined,
  neu: Hundertstel | undefined,
  veraltet: boolean,
): { text: string; pfeil?: '↗' | '↘' } | undefined {
  if (vorher === undefined) return undefined;
  const text = `vorher ${alsText(groesse, vorher)}`;
  if (veraltet) return { text: `${text} · veraltet` };
  if (neu === undefined) return { text };
  const delta = neu - vorher;
  if (Math.abs(delta) < PFEIL_AB[groesse]) return { text };
  return { text, pfeil: delta > 0 ? '↗' : '↘' };
}

/** gültige Ansätze, die nach `seit` und bis `jetzt` begannen */
function ansaetzeSeit(ansaetze: readonly AnsatzZeile[], seit: string, jetzt: Date): AnsatzZeile[] {
  return ansaetze.filter(
    (a) => a.storniert_am === null && ms(a.begonnen_am) > ms(seit) && ms(a.begonnen_am) <= jetzt.getTime(),
  );
}

const BEZEICHNUNG: Readonly<Record<Groesse, string>> = { ph: 'pH', ec: 'EC', temperatur: '°C' };

/**
 * R10.3 Rückfrage vor dem Speichern: EC-Sprung über 0.30 ohne Nachfüllen oder Wechsel → «Richtiges Gefäss?»;
 * sonst EC über 0.80 oder pH über 1.00 ohne Wechsel → «Ungewöhnlicher Sprung» (A16; Grenzen streng).
 */
export function sprungPruefen(
  e: {
    werte: Partial<Record<Groesse, Hundertstel>>;
    vorher: Partial<Record<Groesse, { wert: Hundertstel; giltAb: string }>>;
    ansaetze: readonly AnsatzZeile[];
    hierWaechst: string;
  },
  jetzt: Date,
): { art: 'gefaess' | 'wert'; groesse: Groesse; text: string } | undefined {
  const wechsel = (seit: string) =>
    ansaetzeSeit(e.ansaetze, seit, jetzt).some((a) => a.typ === 'neuansatz' || a.typ === 'teilwechsel');
  const nachfuellen = (seit: string) =>
    ansaetzeSeit(e.ansaetze, seit, jetzt).some((a) => a.typ === 'nachfuellen');

  const ec = e.werte.ec;
  const ecVorher = e.vorher.ec;
  if (ec !== undefined && ecVorher && Math.abs(ec - ecVorher.wert) > 30) {
    if (!wechsel(ecVorher.giltAb) && !nachfuellen(ecVorher.giltAb))
      return {
        art: 'gefaess',
        groesse: 'ec',
        text: e.hierWaechst
          ? `Richtiges Gefäss? Hier wächst: ${e.hierWaechst}`
          : 'Richtiges Gefäss? Hier wächst nichts',
      };
  }
  const grenzen: [Groesse, Hundertstel][] = [
    ['ec', 80],
    ['ph', 100],
  ];
  for (const [g, grenze] of grenzen) {
    const neu = e.werte[g];
    const vorher = e.vorher[g];
    if (neu === undefined || !vorher || Math.abs(neu - vorher.wert) <= grenze) continue;
    if (wechsel(vorher.giltAb)) continue;
    return {
      art: 'wert',
      groesse: g,
      text: `Ungewöhnlicher Sprung: ${BEZEICHNUNG[g]} ${alsText(g, vorher.wert)} → ${alsText(g, neu)}. Stimmt der Wert?`,
    };
  }
  return undefined;
}

/** R10.2 Spur: Skala = Band ± eine Bandbreite, Werte in Prozent der Breite, ausserhalb an den Rand geklemmt (A19) */
export function spurLage(
  wert: Hundertstel | undefined,
  vorher: Hundertstel | undefined,
  band: Band,
): { von: number; bis: number; vorher?: number; neu?: number } {
  const breite = Math.max(band.max - band.min, 10);
  const unten = band.min - breite;
  const skala = band.max + breite - unten;
  const lage = (x: Hundertstel) => Math.min(100, Math.max(0, ((x - unten) / skala) * 100));
  return {
    von: lage(band.min),
    bis: lage(band.max),
    ...(vorher !== undefined ? { vorher: lage(vorher) } : {}),
    ...(wert !== undefined ? { neu: lage(wert) } : {}),
  };
}
