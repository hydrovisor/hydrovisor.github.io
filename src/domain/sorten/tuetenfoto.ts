// Tütenfotos je Sorte und Seite (Issue #207, Plan 207; Konzept 8.1 Regeln 2 und 3, 11.3, 11.4; Plan 37 A16).
// Rein: keine Browser-API. Es gilt je Sorte und Seite die jüngste nicht stornierte Zeile; ersetzen = Storno plus neue
// Zeile. Der Ordner im Pfad zählt nicht für die Zuordnung (bei «Packung zu …» liegt das Foto unter einer fremden
// sorte_id, Plan 37 A16).
import type { Schritt } from '../datenpfad/erfassung.ts';

export type TuetenfotoSeite = 'vorne' | 'hinten';

export interface TuetenfotoZeile {
  id: string;
  client_id: string;
  sorte_id: string;
  saatgut_id: string | null;
  seite: TuetenfotoSeite | string;
  pfad: string;
  erfasst_am: string;
  storniert_am: string | null;
}

export interface Tuetenfoto {
  pfad: string;
  clientId: string;
}

export type AktuelleTuetenfotos = Partial<Record<TuetenfotoSeite, Tuetenfoto>>;

const SEITEN: readonly TuetenfotoSeite[] = ['vorne', 'hinten'];

/** b jünger als a: nach erfasst_am als Zeitpunkt, bei Gleichstand die grössere id (Plan 207 A6) */
function juenger(b: TuetenfotoZeile, a: TuetenfotoZeile): boolean {
  const zb = Date.parse(b.erfasst_am);
  const za = Date.parse(a.erfasst_am);
  if (zb !== za) return zb > za;
  return b.id > a.id;
}

export function aktuelleTuetenfotos(
  zeilen: readonly TuetenfotoZeile[],
  sorteId: string,
): AktuelleTuetenfotos {
  const ergebnis: AktuelleTuetenfotos = {};
  for (const seite of SEITEN) {
    let beste: TuetenfotoZeile | undefined;
    for (const z of zeilen) {
      if (z.sorte_id !== sorteId || z.seite !== seite || z.storniert_am !== null) continue;
      if (!beste || juenger(z, beste)) beste = z;
    }
    if (beste) ergebnis[seite] = { pfad: beste.pfad, clientId: beste.client_id };
  }
  return ergebnis;
}

/** Ergänzen: eine neue Zeile; Ersetzen: Storno der gültigen Zeile derselben Seite, dann die neue Zeile */
export function tuetenfotoVorgang(eingabe: {
  sorteId: string;
  seite: TuetenfotoSeite;
  pfad: string;
  clientId: string;
  ersetzt?: string | undefined;
}): Schritt[] {
  const schritte: Schritt[] = [];
  if (eingabe.ersetzt)
    schritte.push({ art: 'storno', tabelle: 'tuetenfoto', clientId: eingabe.ersetzt, grund: 'korrektur' });
  schritte.push({
    art: 'neu',
    tabelle: 'tuetenfoto',
    felder: {
      client_id: eingabe.clientId,
      sorte_id: eingabe.sorteId,
      saatgut_id: null,
      seite: eingabe.seite,
      pfad: eingabe.pfad,
    },
  });
  return schritte;
}
