// Vorlage Box erfassen (Plan 19; UC2 «Ablauf Box»; Konzept 5.3; R9.3 Betriebsvolumen kleiner als L · B · H).
// Rein, ohne Zeitbezug. Volumen ganzzahlig: Hundertstel Liter gegen mm³ (1 l = 1 000 000 mm³).
import type { Schritt, Verstoss } from '../datenpfad/erfassung.ts';
import type { GefaessmodellZeile } from './bestand.ts';
import { nameDoppelt, nameLeer } from './name.ts';

export type Form = 'rechteckig' | 'oval';

/** Felder als Text wie im Formular; Füllhöhe nur für den Vorschlag, ohne Spalte (Plan 19 A5) */
export interface GefaessmodellEingabe {
  name: string;
  form: Form;
  laengeMm: string;
  breiteMm: string;
  hoeheMm: string;
  nennvolumenL: string;
  betriebsvolumenL: string;
  fuellhoeheMm: string;
}

export interface Innenmasse {
  laengeMm: number;
  breiteMm: number;
  hoeheMm: number;
}

/** smallint in der Datenbank */
const MAX_MM = 32767;
/** numeric(5,2) in der Datenbank */
const MAX_LITER = 999.99;

export type Vorschlag = { liter: number } | { grund: 'oval' | 'fuellhoehe_fehlt' | 'fuellhoehe_zu_gross' };

/** Dezimalpunkt oder Dezimalkomma (Plan 19 A7); keine Zahl → null */
export function dezimalLesen(text: string): number | null {
  const roh = text.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(roh) ? Number(roh) : null;
}

/** ganze Millimeter 1 bis 32767; sonst null */
export function mmLesen(text: string): number | null {
  const roh = text.trim();
  if (!/^\d+$/.test(roh)) return null;
  const mm = Number(roh);
  return mm >= 1 && mm <= MAX_MM ? mm : null;
}

/**
 * Vorschlag Betriebsvolumen aus Länge × Breite × Füllhöhe, nur rechteckig (UC2); abgerundet auf 0.1 l, damit er
 * nie über dem Rauminhalt bis zur Füllhöhe liegt (Plan 19 A5)
 */
export function betriebsvolumenVorschlag(
  form: Form,
  laengeMm: number,
  breiteMm: number,
  fuellhoeheMm: number | null,
  hoeheMm: number,
): Vorschlag {
  if (form === 'oval') return { grund: 'oval' };
  if (fuellhoeheMm === null || fuellhoeheMm <= 0) return { grund: 'fuellhoehe_fehlt' };
  if (fuellhoeheMm >= hoeheMm) return { grund: 'fuellhoehe_zu_gross' };
  // Zehntel Liter = mm³ / 100 000
  return { liter: Math.floor((laengeMm * breiteMm * fuellhoeheMm) / 100_000) / 10 };
}

/** R9.3: Betriebsvolumen > 0 und kleiner als L · B · H; ganzzahlig in Hundertstel Liter */
export function volumenPruefen(masse: Innenmasse, betriebsvolumenL: number): Verstoss | null {
  const raum = masse.laengeMm * masse.breiteMm * masse.hoeheMm;
  const hundertstel = Math.round(betriebsvolumenL * 100);
  if (hundertstel <= 0)
    return { feld: 'betriebsvolumen_l', grund: 'Das Betriebsvolumen muss über 0 l liegen' };
  if (hundertstel * 10_000 >= raum)
    return {
      feld: 'betriebsvolumen_l',
      grund: `Das Betriebsvolumen muss kleiner als Länge × Breite × Höhe sein (${(raum / 1_000_000).toFixed(2)} l)`,
    };
  return null;
}

function literLesen(text: string, feld: string, was: string, pflicht: boolean): Verstoss | number | null {
  if (text.trim() === '')
    return pflicht ? { feld, grund: `Gib das ${was} in Litern ein, z. B. «9» oder «2.3»` } : null;
  const liter = dezimalLesen(text);
  if (liter === null || liter <= 0)
    return { feld, grund: `Das ${was} ist eine Zahl über 0, z. B. «9» oder «2.3»` };
  if (liter > MAX_LITER || !/^\d+([.,]\d{1,2})?$/.test(text.trim()))
    return { feld, grund: `Das ${was} hat höchstens zwei Nachkommastellen und liegt unter 1000 l` };
  return liter;
}

const MASSFELDER = [
  ['laengeMm', 'innen_l_mm', 'Länge'],
  ['breiteMm', 'innen_b_mm', 'Breite'],
  ['hoeheMm', 'innen_h_mm', 'Höhe'],
] as const;

export function gefaessmodellPruefen(
  eingabe: GefaessmodellEingabe,
  /** aktive Vorlagen derselben Art; bei Korrektur oder Wiederholung ohne die eigene Zeile */
  bestand: readonly Pick<GefaessmodellZeile, 'name'>[],
): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  if (nameLeer(eingabe.name))
    verstoesse.push({ feld: 'name', grund: 'Gib einen Namen ein, z. B. «Rako 40 × 30 × 17»' });
  else if (nameDoppelt(eingabe.name, bestand))
    verstoesse.push({ feld: 'name', grund: `Eine Box «${eingabe.name.trim()}» gibt es schon` });
  if (eingabe.form !== 'rechteckig' && eingabe.form !== 'oval')
    verstoesse.push({ feld: 'form', grund: 'Wähle die Form rechteckig oder oval' });
  const masse: Partial<Record<(typeof MASSFELDER)[number][0], number>> = {};
  for (const [schluessel, feld, was] of MASSFELDER) {
    const mm = mmLesen(eingabe[schluessel]);
    if (mm === null) verstoesse.push({ feld, grund: `${was} in ganzen mm, 1 bis ${MAX_MM}` });
    else masse[schluessel] = mm;
  }
  const nenn = literLesen(eingabe.nennvolumenL, 'nennvolumen_l', 'Nennvolumen', false);
  if (nenn !== null && typeof nenn === 'object') verstoesse.push(nenn);
  const betrieb = literLesen(eingabe.betriebsvolumenL, 'betriebsvolumen_l', 'Betriebsvolumen', true);
  if (betrieb !== null && typeof betrieb === 'object') verstoesse.push(betrieb);
  else if (
    typeof betrieb === 'number' &&
    masse.laengeMm !== undefined &&
    masse.breiteMm !== undefined &&
    masse.hoeheMm !== undefined
  ) {
    const v = volumenPruefen(
      { laengeMm: masse.laengeMm, breiteMm: masse.breiteMm, hoeheMm: masse.hoeheMm },
      betrieb,
    );
    if (v) verstoesse.push(v);
  }
  return verstoesse;
}

/** neue Zeile gefaessmodell; vorher gefaessmodellPruefen. Die Füllhöhe wird nicht gespeichert. */
export function gefaessmodellSchritt(eingabe: GefaessmodellEingabe, clientId: string): Schritt {
  return {
    art: 'neu',
    tabelle: 'gefaessmodell',
    felder: {
      client_id: clientId,
      name: eingabe.name.trim(),
      form: eingabe.form,
      innen_l_mm: mmLesen(eingabe.laengeMm),
      innen_b_mm: mmLesen(eingabe.breiteMm),
      innen_h_mm: mmLesen(eingabe.hoeheMm),
      nennvolumen_l: eingabe.nennvolumenL.trim() === '' ? null : dezimalLesen(eingabe.nennvolumenL),
      betriebsvolumen_l: dezimalLesen(eingabe.betriebsvolumenL),
    },
  };
}
