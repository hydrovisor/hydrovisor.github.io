// Gemeinsame Typen des W0-Imports (03_import_w0.md, Plan 10). Rein, ohne Browser- oder Node-Abhängigkeit (G1).

export type Zeile = Record<string, string | null>;

/** Gelesene CSV-Datei; datei ist der Pfad relativ zum Repository (z. B. data/stammdaten/sorten.csv) */
export interface CsvTabelle {
  datei: string;
  spalten: string[];
  zeilen: Zeile[];
}

/** Pfad relativ zum Repository → Tabelle; eine fehlende Datei gilt als «nicht geliefert» (A1) */
export type W0Dateien = Record<string, CsvTabelle | undefined>;

export type Regel =
  'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9' | 'V10' | 'V11' | 'V12' | 'V13';

/** Verstoss bricht das Laden ab und nennt Datei, zeile_id, Regel und Wert (Abschnitt 7) */
export interface Verstoss {
  datei: string;
  zeileId: string | null;
  regel: Regel;
  wert: string | null;
  text: string;
}

/** Konflikt der Gegenprobe: Meldung für Tim, lädt trotzdem (Konzept 9.4) */
export interface Konflikt {
  datei: string;
  zeileId: string;
  artId: string;
  text: string;
}

export function verstossText(v: Verstoss): string {
  return `${v.datei} ${v.zeileId ?? '–'} ${v.regel} ${v.wert ?? '–'}: ${v.text}`;
}
