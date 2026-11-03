// Prellfilter des Ziffernblocks (design-system/components/NumPad.md, Konzept 6.3): keine Sperre,
// nur ein zweiter Tipp auf dieselbe Taste innert höchstens 80 ms wird verworfen.
export const PRELLZEIT_MS = 80;

export interface Prellzustand {
  taste: string;
  zeit: number;
}

/** Zählt der Tipp? `jetzt` in ms (Zeitstempel des Ereignisses); liefert den neuen Zustand mit */
export function prellfilter(
  vorher: Prellzustand | null,
  taste: string,
  jetzt: number,
  prellzeit = PRELLZEIT_MS,
): { zaehlt: boolean; zustand: Prellzustand } {
  const geprellt = vorher !== null && vorher.taste === taste && jetzt - vorher.zeit < prellzeit;
  // ein verworfener Tipp verlängert das Fenster nicht, sonst blieben schnelle Wiederholungen hängen
  return geprellt ? { zaehlt: false, zustand: vorher } : { zaehlt: true, zustand: { taste, zeit: jetzt } };
}
