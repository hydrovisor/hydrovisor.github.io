// Einstellungen (Plan 32; UC0-AK3, UC0-AK4; R4.1, R4.4, R5.5): Prüfungen und Rechnungen, rein.
// Werte kommen als Text aus Eingabefeldern (Schreibtisch, Systemtastatur erlaubt) oder als Zahl aus dem Bündel.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Teile } from '../teile.ts';

export type Pruefung<T> = { ok: true; wert: T } | { ok: false; fehler: string };

const zahl = (text: string): number | undefined => {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
};

/** R5.5: Push-Zeit «hh:mm» von 05:00 bis 22:00, Grenzen eingeschlossen */
export function pushZeitPruefen(text: string): Pruefung<string> {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  const fehler = { ok: false as const, fehler: 'Push-Zeit nur 05:00 bis 22:00' };
  if (!m) return fehler;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return fehler;
  const minuten = h * 60 + min;
  if (minuten < 5 * 60 || minuten > 22 * 60) return fehler;
  return { ok: true, wert: `${String(h).padStart(2, '0')}:${m[2]}` };
}

/** Vorlauf n: 0 bis 14 Tage, ganze Zahl */
export function vorlaufPruefen(text: string): Pruefung<number> {
  const n = zahl(text);
  if (n === undefined || !Number.isInteger(n) || n > 14)
    return { ok: false, fehler: 'Vorlauf nur 0 bis 14 Tage' };
  return { ok: true, wert: n };
}

/** R4.4: Kanne 1 bis 12 l in Schritten zu 0.1 l */
export function kannePruefen(text: string): Pruefung<number> {
  const l = zahl(text);
  const fehler = { ok: false as const, fehler: 'Kannengrösse nur 1 bis 12 l' };
  if (l === undefined || l < 1 || l > 12) return fehler;
  if (Math.abs(Math.round(l * 10) - l * 10) > 1e-9)
    return { ok: false, fehler: 'Kannengrösse auf 0.1 l genau' };
  return { ok: true, wert: Math.round(l * 10) / 10 };
}

/** Gesamtdosis des Stadiums Wachstum 1.8 + 1.2 + 0.6 ml/L (Düngeplan V1.6; Plan 32 A1, A2) */
export const WACHSTUM = { grow: 1.8, micro_hard_water: 1.2, bloom: 0.6 } as const;
export type Komponente = keyof typeof WACHSTUM;
export const KOMPONENTEN: readonly Komponente[] = ['grow', 'micro_hard_water', 'bloom'];
const D_WACHSTUM = WACHSTUM.grow + WACHSTUM.micro_hard_water + WACHSTUM.bloom;

/** Menge auf 0.5 ml (CLAUDE.md «Zahlen»), in Zehnteln gerechnet */
export function aufHalbe(ml: number): number {
  return Math.round(Math.round(ml * 10) / 5) / 2;
}

const ml = (x: number) => x.toFixed(1);

/** R4.4 Rechenbeispiel beim Ändern der Kanne: «2.3 halbe Dosis je Kanne: vorher x ml, neu y ml» */
export function kannenBeispiel(alt: number, neu: number): string {
  const halbe = (kanne: number) => aufHalbe((D_WACHSTUM * kanne) / 2);
  return `2.3 halbe Dosis je Kanne: vorher ${ml(halbe(alt))} ml, neu ${ml(halbe(neu))} ml`;
}

/** R4.1: k_wirksam = Σ k_i · a_i mit a_i = Anteil der Komponente an D (Wachstum, A2) */
export function kWirksam(k: Readonly<Record<Komponente, number>>): number {
  return KOMPONENTEN.reduce((s, c) => s + k[c] * (WACHSTUM[c] / D_WACHSTUM), 0);
}

export type KPruefung =
  | { art: 'ok'; kWirksam: number }
  | { art: 'rueckfrage'; kWirksam: number; prozent: number; text: string }
  | { art: 'abgelehnt'; kWirksam?: number; fehler: string };

/** R4.1: harte Grenze 0.2 ≤ k_wirksam ≤ 0.45; Änderung über 20 % gegen bisher braucht eine Rückfrage */
export function kSatzPruefen(
  eingabe: Readonly<Record<Komponente, string>>,
  bisher: Readonly<Record<Komponente, number>>,
): KPruefung {
  // k je Komponente in Tausendsteln wie die Spalte numeric(4,3); k_wirksam exakt als Ganzzahl
  // n6 = 3·g + 2·m + 1·b = 6000 · k_wirksam (Anteile 3 : 2 : 1 aus 1.8 : 1.2 : 0.6; Runde 2 Befund 1)
  const k = {} as Record<Komponente, number>;
  for (const c of KOMPONENTEN) {
    const t = eingabe[c].trim().replace(',', '.');
    const wert = zahl(t);
    if (wert === undefined || wert <= 0 || wert >= 1)
      return { art: 'abgelehnt', fehler: 'k je Komponente zwischen 0 und 1 mS/cm je ml/L' };
    if ((t.split('.')[1] ?? '').length > 3)
      return { art: 'abgelehnt', fehler: 'k mit höchstens drei Dezimalen' };
    k[c] = wert;
  }
  const n6 = (x: Readonly<Record<Komponente, number>>) =>
    3 * Math.round(x.grow * 1000) + 2 * Math.round(x.micro_hard_water * 1000) + Math.round(x.bloom * 1000);
  const neu6 = n6(k);
  const neu = neu6 / 6000;
  if (neu6 < 1200 || neu6 > 2700)
    return { art: 'abgelehnt', kWirksam: neu, fehler: 'k wirksam nur 0.20 bis 0.45: nicht übernehmbar' };
  const alt6 = n6(bisher);
  const prozent = Math.round((Math.abs(neu6 - alt6) / alt6) * 1000) / 10;
  // «über 20 %» exakt: 5 · |Δ| > bisher; der gerundete Wert nur für den Text
  if (5 * Math.abs(neu6 - alt6) > alt6)
    return {
      art: 'rueckfrage',
      kWirksam: neu,
      prozent,
      text: `k ändert sich um ${String(prozent)} % gegen bisher. Übernehmen?`,
    };
  return { art: 'ok', kWirksam: neu };
}

/** Messgerät: u_EC 0 bis 1 (drei Dezimalen), u_pH 0 bis 1 (zwei Dezimalen) */
export function messgeraetPruefen(uEc: string, uPh: string): Pruefung<{ u_ec: number; u_ph: number }> {
  const dezimalen = (text: string) => (text.trim().replace(',', '.').split('.')[1] ?? '').length;
  const ec = zahl(uEc);
  const ph = zahl(uPh);
  if (ec === undefined || ec > 1 || dezimalen(uEc) > 3)
    return { ok: false, fehler: 'u_EC nur 0 bis 1 mit höchstens drei Dezimalen' };
  if (ph === undefined || ph > 1 || dezimalen(uPh) > 2)
    return { ok: false, fehler: 'u_pH nur 0 bis 1 mit höchstens zwei Dezimalen' };
  return { ok: true, wert: { u_ec: ec, u_ph: ph } };
}

/** Pflegebudget: Minuten je Werktag 0 bis 600, Stunden je Woche 0 bis 99.9 */
export function pflegebudgetPruefen(
  minuten: string,
  stunden: string,
): Pruefung<{ pflegebudget_min_werktag: number; pflegebudget_h_woche: number }> {
  const m = zahl(minuten);
  const h = zahl(stunden);
  if (m === undefined || !Number.isInteger(m) || m > 600)
    return { ok: false, fehler: 'Minuten je Werktag nur 0 bis 600' };
  if (h === undefined || h > 99.9) return { ok: false, fehler: 'Stunden je Woche nur 0 bis 99.9' };
  return { ok: true, wert: { pflegebudget_min_werktag: m, pflegebudget_h_woche: Math.round(h * 10) / 10 } };
}

/** Messmittel in ml, durch Komma oder Leerzeichen getrennt, je 0.1 bis 999.9, aufsteigend ohne Doppel */
export function messmittelPruefen(text: string): Pruefung<number[]> {
  const teile = text
    .split(/[;\s]+|,\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const werte = teile.map(zahl);
  // höchstens eine Dezimale wie die Spalte numeric(5,1) (Befund 9)
  const zuGenau = teile.some((t) => (t.replace(',', '.').split('.')[1] ?? '').length > 1);
  if (zuGenau || werte.length === 0 || werte.some((w) => w === undefined || w < 0.1 || w > 999.9))
    return { ok: false, fehler: 'Messmittel als ml-Werte, etwa «1 5 20 60»' };
  const sortiert = [...new Set(werte as number[])].sort((a, b) => a - b);
  return { ok: true, wert: sortiert };
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile | undefined, name: string) => (t?.[name] ?? []) as readonly Zeile[];

const QUELLE: Readonly<Record<string, string>> = {
  startwert: 'Startwert',
  becherversuch: 'Becherversuch',
  vorschlag_uebernommen: 'Vorschlag übernommen',
  zurueckgesetzt: 'zurückgesetzt',
};

/** «gültig ab» und Quelle je Komponente für die Anzeige (UC0, R4.1; Befund 4); ohne Zeile «Startwert 0.3» */
export function kHerkunftAus(teile: Teile | undefined, zeitzone: string): Record<Komponente, string> {
  const r = { grow: 'Startwert', micro_hard_water: 'Startwert', bloom: 'Startwert' };
  const zeit = (z: Zeile) => Date.parse(String(z['gilt_ab']));
  for (const c of KOMPONENTEN) {
    const z = teil(teile, 'k_faktor')
      .filter((x) => x['produkt_id'] === c && (x['storniert_am'] ?? null) === null)
      .sort((a, b) => zeit(b) - zeit(a))[0];
    if (!z) continue;
    const tag = new Intl.DateTimeFormat('de-CH', {
      timeZone: zeitzone,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(new Date(String(z['gilt_ab'])));
    r[c] = `gültig ab ${tag} · ${QUELLE[String(z['quelle'])] ?? String(z['quelle'])}`;
  }
  return r;
}

/** gültiges k je Komponente: jüngste nicht stornierte Zeile, sonst Startwert 0.3 (Tabellenkommentar k_faktor) */
export function kAus(teile: Teile | undefined): Record<Komponente, number> {
  const k = { grow: 0.3, micro_hard_water: 0.3, bloom: 0.3 };
  const zeit = (z: Zeile) => Date.parse(String(z['gilt_ab']));
  for (const c of KOMPONENTEN) {
    const z = teil(teile, 'k_faktor')
      .filter((x) => x['produkt_id'] === c && (x['storniert_am'] ?? null) === null)
      .sort((a, b) => zeit(b) - zeit(a))[0];
    if (z) k[c] = Number(z['wert']);
  }
  return k;
}

/** neue Zeilen in k_faktor für jede geänderte Komponente (Quelle Becherversuch, Plan 32 A3) */
export function kVorgang(
  neu: Readonly<Record<Komponente, number>>,
  bisher: Readonly<Record<Komponente, number>>,
  ids: () => string,
  jetzt: Date,
): Schritt[] {
  return KOMPONENTEN.filter((c) => Math.round(neu[c] * 1000) !== Math.round(bisher[c] * 1000)).map((c) => {
    const id = ids();
    return {
      art: 'neu',
      tabelle: 'k_faktor',
      felder: {
        client_id: id,
        id,
        produkt_id: c,
        wert: Math.round(neu[c] * 1000) / 1000,
        gilt_ab: jetzt.toISOString(),
        quelle: 'becherversuch',
      },
    };
  });
}

/** Ruhe je Gefäss: Ereignis ruhe {gesetzt} (Plan 32) */
export function ruheVorgang(platzId: string, gesetzt: boolean, id: string, jetzt: Date): Schritt {
  return {
    art: 'neu',
    tabelle: 'ereignis',
    felder: {
      client_id: id,
      id,
      typ: 'ruhe',
      platz_id: platzId,
      gilt_ab: jetzt.toISOString(),
      daten: { gesetzt },
    },
  };
}
