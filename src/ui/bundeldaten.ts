// Teile des Offline-Bündels für Messen, Kalibrieren und Heute (Plan 12): lesen, nie rechnen. Die Lesehilfen
// liegen seit Plan 13 in src/domain/teile.ts, damit die Edge Function push-taeglich sie teilt (R5.1).
import type { Buendel } from '../domain/datenpfad/buendel.ts';
import type { Kalibrierdaten } from '../domain/kalibrierung/stand.ts';
import {
  kalibrierdatenAus,
  messgeraetAus,
  messungenAus,
  zustandAus,
  type Messgeraet,
} from '../domain/teile.ts';

export type { Messgeraet };

/** erstes Messgerät im Bündel (A3) */
export function messgeraet(b: Buendel | undefined): Messgeraet | undefined {
  return messgeraetAus(b?.teile);
}

export function kalibrierdaten(b: Buendel | undefined): Kalibrierdaten {
  return kalibrierdatenAus(b?.teile);
}

export function messungenIm(b: Buendel | undefined) {
  return messungenAus(b?.teile);
}

/** Füllzustand und Prüfstatus eines Platzes aus den Sichten im Bündel */
export function zustandVon(
  b: Buendel | undefined,
  platzId: string,
): { fuellzustand?: 'leer' | 'loesung'; status?: string } {
  return zustandAus(b?.teile, platzId);
}

/** aktueller Zeitpunkt für Ereignis-Handler; Date.now() nur in der Oberfläche (CLAUDE.md) */
export function jetzt(): Date {
  return new Date(Date.now());
}
