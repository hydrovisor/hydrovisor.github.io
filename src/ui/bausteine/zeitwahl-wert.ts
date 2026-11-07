// Wertlogik der Zeitwahl (design-system/components/Zeitwahl.md, Plan 142): rein, ohne Browser.

export interface Uhrzeit {
  stunde: number;
  minute: number;
}

/** «HH:MM» oder «H:MM» (auch «HH:MM:SS» aus der Datenbank) zerlegen; ungültig → undefined */
export function zeitZerlegen(wert: string): Uhrzeit | undefined {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(wert.trim());
  if (!m) return undefined;
  const stunde = Number(m[1]);
  const minute = Number(m[2]);
  if (stunde > 23 || minute > 59) return undefined;
  return { stunde, minute };
}

/** zweistellig mit führender Null */
export const zweistellig = (n: number): string => String(n).padStart(2, '0');

/** «HH:MM» */
export const zeitText = (z: Uhrzeit): string => `${zweistellig(z.stunde)}:${zweistellig(z.minute)}`;

/**
 * Werte von `von` bis `bis` im Schritt `schritt`; ein `aktuell` ausserhalb des Rasters wird einsortiert, damit das
 * Öffnen der Maske einen gespeicherten Wert nicht verändert (Plan 142 A2).
 */
export function werteListe(von: number, bis: number, schritt: number, aktuell?: number): number[] {
  const liste: number[] = [];
  for (let w = von; w <= bis; w += Math.max(1, schritt)) liste.push(w);
  if (aktuell !== undefined && !liste.includes(aktuell)) {
    liste.push(aktuell);
    liste.sort((a, b) => a - b);
  }
  return liste;
}

/** nächster Wert in der Richtung (−1 auf, +1 ab); an den Grenzen bleibt er stehen; unbekannt → erster Wert */
export function nachbar(liste: number[], aktuell: number, richtung: -1 | 1): number {
  const i = liste.indexOf(aktuell);
  if (i < 0) return liste[0] ?? aktuell;
  return liste[Math.min(liste.length - 1, Math.max(0, i + richtung))] ?? aktuell;
}

/** Index der Zeile in der Mitte aus der Scrollposition (Zeilenhöhe in px), geklemmt auf die Liste */
export function indexAusScroll(scrollTop: number, zeilenhoehe: number, anzahl: number): number {
  if (anzahl <= 0 || zeilenhoehe <= 0) return 0;
  return Math.min(anzahl - 1, Math.max(0, Math.round(scrollTop / zeilenhoehe)));
}
