// Format und Anzeige des Offline-Bündels (Plan 11 «Speicherort und Format»; 04_architektur.md 4.2; Konzept 11.4 TO6).
// Rein: jetzt und Zeitzone als Parameter.
import { kalendertag, tagesbeginn, uhrzeit, type Zeitzone } from '../zeit.ts';

export const BUENDEL_FORMAT = 1;

export interface Buendel {
  id: 'aktuell';
  format: 1;
  /** Beginn des Ladens, ISO in UTC; angezeigt in Zürich */
  stand: string;
  appVersion: string;
  nutzerId: string;
  /** Zeilen je Teil in der Form von PostgREST (snake_case) */
  teile: Record<string, readonly unknown[]>;
}

/** ein gespeichertes Bündel nur annehmen, wenn Format und Nutzer passen; sonst gilt «kein Bündel» */
export function buendelPruefen(wert: unknown, nutzerId: string): Buendel | undefined {
  if (!wert || typeof wert !== 'object') return undefined;
  const b = wert as Partial<Buendel>;
  if (b.id !== 'aktuell' || b.format !== BUENDEL_FORMAT || b.nutzerId !== nutzerId) return undefined;
  if (typeof b.stand !== 'string' || Number.isNaN(Date.parse(b.stand))) return undefined;
  if (!b.teile || typeof b.teile !== 'object' || Array.isArray(b.teile)) return undefined;
  if (!Object.values(b.teile).every(Array.isArray)) return undefined;
  return b as Buendel;
}

export const HINWEIS_KEIN_BUENDEL = 'Noch keine Daten auf dem Gerät';

/**
 * «Stand: hh:mm», solange in dieser Sitzung kein frisches Laden gelungen ist (D3);
 * ist der Stand nicht von heute, mit Datum «Stand: TT.MM. hh:mm» (A2).
 */
export function standAnzeige(
  lage: { buendel?: Buendel | undefined; frisch: boolean },
  jetzt: Date,
  zeitzone: Zeitzone,
): { stand?: string; hinweis?: string } {
  if (lage.frisch) return {};
  if (!lage.buendel) return { hinweis: HINWEIS_KEIN_BUENDEL };
  const stand = new Date(lage.buendel.stand);
  const tag = kalendertag(stand, zeitzone);
  const zeit = uhrzeit(stand, zeitzone);
  if (tag === kalendertag(jetzt, zeitzone)) return { stand: `Stand: ${zeit}` };
  const [, monat, t] = tag.split('-');
  return { stand: `Stand: ${t}.${monat}. ${zeit}` };
}

/** Beginn des Fensters «die letzten n Tage»: 00:00 Zürich des Kalendertags heute minus n, als ISO */
export function fensterBeginn(jetzt: Date, tage: number, zeitzone: Zeitzone): string {
  const [j, m, d] = kalendertag(jetzt, zeitzone).split('-').map(Number) as [number, number, number];
  const tag = new Date(Date.UTC(j, m - 1, d - tage)).toISOString().slice(0, 10);
  return tagesbeginn(tag, zeitzone).toISOString();
}

/** je Ort (platz_id) nur der zuletzt begonnene Ansatz (04 4.2 «letzter Ansatz je Ort») */
export function letzterJeOrt<T extends { platz_id: string | null; begonnen_am: string }>(
  zeilen: readonly T[],
): T[] {
  const je = new Map<string | null, T>();
  for (const z of zeilen) {
    const bisher = je.get(z.platz_id);
    if (!bisher || Date.parse(z.begonnen_am) > Date.parse(bisher.begonnen_am)) je.set(z.platz_id, z);
  }
  return [...je.values()];
}
