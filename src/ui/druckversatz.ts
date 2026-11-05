// Druckversatz je Gerät (Plan 22 A6): Ergebnis des Testbogens, gespeichert im localStorage; ohne Speicher 0/0.
const SCHLUESSEL = 'hydrovisor-druckversatz';

export interface Druckversatz {
  x: number;
  y: number;
}

export function druckversatzLesen(): Druckversatz {
  try {
    const roh = JSON.parse(window.localStorage.getItem(SCHLUESSEL) ?? 'null') as Partial<Druckversatz> | null;
    const zahl = (w: unknown) => (typeof w === 'number' && Number.isFinite(w) ? w : 0);
    return { x: zahl(roh?.x), y: zahl(roh?.y) };
  } catch {
    return { x: 0, y: 0 };
  }
}

export function druckversatzMerken(v: Druckversatz): void {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(v));
  } catch {
    // ohne Speicher gilt der Versatz nur für diese Druckansicht (Adresse)
  }
}
