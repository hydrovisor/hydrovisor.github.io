// Kürzel einer Anlage (UC1-AK6, R9.1; Trigger anlage_kuerzel_fest): nach dem ersten Etikettendruck fest. Rein.
import { plaetzeAus, zeilen, type Teile } from './teile.ts';

export const KUERZEL_MUSTER = /^[A-Z]{1,3}$/;

/**
 * falsch, sobald ein Etikett eines Platzes der Anlage gedruckt ist, auch ein später storniertes: ein Storno macht den
 * Druck nicht ungeschehen (wie der Trigger anlage_kuerzel_fest; Runde 1, Befund 2). Das Bündel kennt stornierte
 * Etiketten nicht (Plan 20 A8); dann lehnt die Datenbank die Änderung ab.
 */
export function kuerzelAenderbar(teile: Teile, anlageId: string): boolean {
  const plaetze = new Set(plaetzeAus(teile, anlageId).map((p) => p.id));
  // auch inaktive Plätze: ein gedrucktes Etikett bleibt gedruckt
  for (const p of zeilen<{ id: string; anlage_id: string }>(teile, 'platz'))
    if (p.anlage_id === anlageId) plaetze.add(p.id);
  return !zeilen<{ platz_id: string; gedruckt_am: string | null }>(teile, 'etikett').some(
    (e) => e.gedruckt_am !== null && plaetze.has(e.platz_id),
  );
}
