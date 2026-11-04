// Gerätespeicher der Einrichtungs-Checkliste (Plan 18 A3, A4): Endzeit des Einweich-Timers und Merker
// «Einrichtung abgeschlossen». Keine fachliche Erfassung; ohne Speicher gilt «nicht gestartet».
const ENDE = 'hydrovisor-einweichen-ende';
const ABGESCHLOSSEN = 'hydrovisor-einrichtung-abgeschlossen';

function lesen(schluessel: string): string | null {
  try {
    return window.localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}

function schreiben(schluessel: string, wert: string): void {
  try {
    window.localStorage.setItem(schluessel, wert);
  } catch {
    // ohne Speicher läuft der Timer nur bis zum Neuladen
  }
}

export function einweichenEndeLesen(): number | undefined {
  const wert = Number(lesen(ENDE));
  return Number.isFinite(wert) && wert > 0 ? wert : undefined;
}

export function einweichenStarten(ende: number): void {
  schreiben(ENDE, String(ende));
}

export function abschlussGemerkt(): boolean {
  return lesen(ABGESCHLOSSEN) === 'ja';
}

export function abschlussMerken(): void {
  schreiben(ABGESCHLOSSEN, 'ja');
}
