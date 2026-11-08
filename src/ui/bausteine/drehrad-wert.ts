// Wertlogik der Drehräder (design-system/components/Drehrad.md und Zeitwahl.md, Pläne 142 und 147): rein, ohne
// Browser. Die Räder drehen durch (zyklisch, «wrap selector wheel»): nach dem letzten Wert folgt der erste.

export interface Uhrzeit {
  stunde: number;
  minute: number;
}

/**
 * «HH:MM» oder «H:MM» (auch «HH:MM:SS» aus der Datenbank) zerlegen; 24:00 ist gültig (Ende des Tages, Licht bis),
 * 24:05 nicht; ungültig → undefined
 */
export function zeitZerlegen(wert: string): Uhrzeit | undefined {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(wert.trim());
  if (!m) return undefined;
  const stunde = Number(m[1]);
  const minute = Number(m[2]);
  if (minute > 59 || stunde > 24 || (stunde === 24 && minute !== 0)) return undefined;
  return { stunde, minute };
}

/** zweistellig mit führender Null */
export const zweistellig = (n: number): string => String(n).padStart(2, '0');

/** «HH:MM»; Stunde 24 gibt es nur mit Minute 00 (Plan 147) */
export const zeitText = (z: Uhrzeit): string =>
  `${zweistellig(z.stunde)}:${zweistellig(z.stunde === 24 ? 0 : z.minute)}`;

/**
 * Werte von `von` bis `bis` im Schritt `schritt` (auch 0.5) ohne Rundungsfehler; ein `aktuell` ausserhalb des
 * Rasters wird einsortiert, damit das Öffnen der Maske einen gespeicherten Wert nicht verändert (Plan 142 A2).
 */
export function werteListe(von: number, bis: number, schritt: number, aktuell?: number): number[] {
  const s = schritt > 0 ? schritt : 1;
  const anzahl = Math.floor((bis - von) / s + 1e-9) + 1;
  const liste = Array.from({ length: Math.max(0, anzahl) }, (_, i) => Math.round((von + i * s) * 1e6) / 1e6);
  if (aktuell !== undefined && Number.isFinite(aktuell) && !liste.includes(aktuell)) {
    liste.push(aktuell);
    liste.sort((a, b) => a - b);
  }
  return liste;
}

/** nächster Wert in der Richtung (−1 auf, +1 ab); dreht durch: nach dem letzten folgt der erste; unbekannt → erster */
export function nachbar(liste: number[], aktuell: number, richtung: -1 | 1): number {
  const n = liste.length;
  const i = liste.indexOf(aktuell);
  if (n === 0) return aktuell;
  if (i < 0) return liste[0] ?? aktuell;
  return liste[(i + richtung + n) % n] ?? aktuell;
}

/** Index der Zeile in der Mitte aus der Scrollposition (Zeilenhöhe in px), geklemmt auf `anzahl` Zeilen */
export function indexAusScroll(scrollTop: number, zeilenhoehe: number, anzahl: number): number {
  if (anzahl <= 0 || zeilenhoehe <= 0) return 0;
  return Math.min(anzahl - 1, Math.max(0, Math.round(scrollTop / zeilenhoehe)));
}

/** Anzahl Kopien der Werte im Rad, damit es in beide Richtungen durchdreht; lange Listen weniger (DOM) */
export const kopienZahl = (anzahl: number): number => (anzahl >= 50 ? 3 : 5);

/**
 * Zeile, auf die das Rad für den Wert mit Index `index` dreht: die Kopie, die der aktuellen Zeile `jetzt` am
 * nächsten liegt (kurzer Weg, auch über das Ende); `jetzt` undefined → mittlere Kopie
 */
export function zielZeile(index: number, anzahl: number, kopien: number, jetzt?: number): number {
  const mitte = Math.floor(kopien / 2) * anzahl + index;
  if (jetzt === undefined) return mitte;
  let beste = mitte;
  for (let k = 0; k < kopien; k++) {
    const z = k * anzahl + index;
    if (Math.abs(z - jetzt) < Math.abs(beste - jetzt)) beste = z;
  }
  return beste;
}

/** Zeile derselben Werts in der mittleren Kopie (nach dem Einrasten springt das Rad unsichtbar dorthin zurück) */
export const mittlereZeile = (zeile: number, anzahl: number, kopien: number): number =>
  Math.floor(kopien / 2) * anzahl + (((zeile % anzahl) + anzahl) % anzahl);
