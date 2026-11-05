// Etikettenbogen A4 3 × 7 (R9.1, design-system/components/LabelSheet.md, Plan 22): Masse wie tokens.json Gruppe
// Druck, Seiten mit Startfeld, Feldkanten mit Druckversatz, Prüfung der Druckeingaben (A6). Rein.
import type { Verstoss } from '../datenpfad/erfassung.ts';

export const BOGEN = {
  breiteMm: 210,
  hoeheMm: 297,
  spalten: 3,
  zeilen: 7,
  feldBreiteMm: 70,
  feldHoeheMm: 42.3,
  randObenMm: 0.45,
  randLinksMm: 0,
} as const;

export const FELDER_JE_SEITE = BOGEN.spalten * BOGEN.zeilen;

/** Versatz X/Y je −5.0 bis +5.0 mm in Schritten von 0.1 mm (A6) */
export const VERSATZ_MAX_MM = 5;

/**
 * Seiten mit je 21 Feldern: Seite 1 beginnt mit startfeld − 1 leeren Feldern, der Überlauf ab Feld 1 der nächsten
 * Seite; Restfelder der letzten Seite leer (null).
 */
export function bogenSeiten<T>(etiketten: readonly T[], startfeld: number): (T | null)[][] {
  const felder: (T | null)[] = [...Array<T | null>(Math.max(0, startfeld - 1)).fill(null), ...etiketten];
  const seiten: (T | null)[][] = [];
  for (let i = 0; i < Math.max(felder.length, 1); i += FELDER_JE_SEITE) {
    const seite = felder.slice(i, i + FELDER_JE_SEITE);
    while (seite.length < FELDER_JE_SEITE) seite.push(null);
    seiten.push(seite);
  }
  return seiten;
}

/** linke obere Kante von Feld index (0 bis 20, zeilenweise von links oben) relativ zum Seitenursprung */
export function feldKante(index: number, versatz: { x: number; y: number }): { xMm: number; yMm: number } {
  const spalte = index % BOGEN.spalten;
  const zeile = Math.floor(index / BOGEN.spalten);
  return {
    xMm: BOGEN.randLinksMm + spalte * BOGEN.feldBreiteMm + versatz.x,
    yMm: BOGEN.randObenMm + zeile * BOGEN.feldHoeheMm + versatz.y,
  };
}

const zehntel = (w: number) => Math.abs(w * 10 - Math.round(w * 10)) < 1e-9;

export function druckEingabePruefen(e: {
  startfeld: number;
  versatzX: number;
  versatzY: number;
}): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  if (!Number.isInteger(e.startfeld) || e.startfeld < 1 || e.startfeld > FELDER_JE_SEITE)
    verstoesse.push({ feld: 'startfeld', grund: 'Startfeld 1 bis 21' });
  for (const feld of ['versatzX', 'versatzY'] as const) {
    const w = e[feld];
    if (!Number.isFinite(w) || Math.abs(w) > VERSATZ_MAX_MM + 1e-9 || !zehntel(w))
      verstoesse.push({ feld, grund: 'Druckversatz −5.0 bis +5.0 mm, in Schritten von 0.1 mm' });
  }
  return verstoesse;
}
