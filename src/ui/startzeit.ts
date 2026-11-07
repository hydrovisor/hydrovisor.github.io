// Startzeit bis Heute (Plan 30 A12, UC8-AK9): beim ersten Rendern der Aufgaben mit Bündel performance.now() in einen
// Ring der letzten 5 Werte im localStorage (keine Personendaten); Info zeigt den Median.
const SCHLUESSEL = 'hv-startzeit';
let gemerkt = false;

export function startzeitMerken(): void {
  if (gemerkt || typeof performance === 'undefined') return;
  gemerkt = true;
  try {
    const alt = startzeiten();
    localStorage.setItem(SCHLUESSEL, JSON.stringify([...alt, Math.round(performance.now())].slice(-5)));
  } catch {
    // ohne localStorage keine Messung
  }
}

export function startzeiten(): number[] {
  try {
    const roh: unknown = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? '[]');
    return Array.isArray(roh) ? roh.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}
