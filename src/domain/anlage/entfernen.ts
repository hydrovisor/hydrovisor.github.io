// Gefäss entfernen und wiederherstellen (UC3 Entfernen, Konzept 8.1; Plan 21 A10). Rein.
import type { Vorgang } from '../datenpfad/erfassung.ts';
import { kalendertag, tageZwischen, type Zeitzone } from '../zeit.ts';
import { pflanzenAmPlatz, sortenDer } from './aendern.ts';
import type { Teile } from './teile.ts';

export interface Hindernis {
  satzId: string;
  sorte: string;
  art: 'pflanzung' | 'reservierung';
}

/** Sätze, die zuerst umzusetzen oder zu beenden sind; leer = Entfernen erlaubt (UC3-AK3) */
export function entfernenPruefen(teile: Teile, platzId: string): Hindernis[] {
  const ergebnis: Hindernis[] = [];
  for (const p of pflanzenAmPlatz(teile, platzId))
    if (!ergebnis.some((h) => h.satzId === p.satzId && h.art === p.art))
      ergebnis.push({ satzId: p.satzId, sorte: sortenDer(teile, [p.satzId])[0] ?? 'Satz', art: p.art });
  return ergebnis;
}

/** Ereignis entfernt; Belegung, Messungen und Verlauf bleiben am Platz */
export function entfernenVorgang(platzId: string, id: string, jetzt: Date): Vorgang {
  return [
    {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: id,
        id,
        typ: 'entfernt',
        platz_id: platzId,
        gilt_ab: jetzt.toISOString(),
        daten: {},
      },
    },
  ];
}

/** bis und mit 7. Kalendertag nach dem Entfernen in der Zeitzone (G2) */
export function wiederherstellbar(entferntAm: string, jetzt: Date, zeitzone: Zeitzone): boolean {
  return tageZwischen(kalendertag(new Date(entferntAm), zeitzone), kalendertag(jetzt, zeitzone)) <= 7;
}
