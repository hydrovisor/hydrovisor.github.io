// Typen zu backup-regeln.mjs (tsconfig ohne allowJs; Plan 16 «Schnittstellen»).

export declare const PROBE_MARKE: 'HV_PROBE';

export interface StorageEintrag {
  name: string;
  id: string | null;
  metadata: { size: number } | null;
}

export declare function listeAufloesen(
  eintraege: StorageEintrag[],
  praefix: string,
): { dateien: { pfad: string; bytes: number }[]; ordner: string[] };

export declare function manifestZeile(pfad: string, bytes: number, sha256: string): string;

export declare function manifestPruefen(
  manifest: string,
  dateien: Map<string, Uint8Array>,
): { ok: boolean; fehlend: string[]; abweichend: string[] };

export declare function zaehlungLesen(csv: string): Map<string, number>;

export declare function dumpBereinigen(sql: string): string;

export declare function probeSql(daten: string, tabellen: string[]): string;

export declare function probeErgebnisLesen(fehlermeldung: string): Map<string, number> | null;

export interface Abweichung {
  tabelle: string;
  erwartet: number;
  ist: number | null;
}

export interface Vergleich {
  gleich: number;
  abweichungen: Abweichung[];
}

export declare function vergleichen(erwartet: Map<string, number>, ist: Map<string, number>): Vergleich;

export declare function berichtMarkdown(
  stand: string,
  vergleich: Vergleich,
  storage: { dateien: number; ok: boolean } | null,
  migrationen: { gleich: boolean; nurBackup: string[]; nurDev: string[] },
): string;

export declare function tarLesen(daten: Uint8Array): Map<string, Uint8Array>;

export declare function meldungKuerzen(text: string): string;

export declare function scramVerifier(passwort: string, salz: Uint8Array, iterationen: number): string;

export declare function speicherToken(geheimnis: string, jetzt: Date, ablauf: Date): string;

export declare const LEER_SHA256: string;

export declare function sigV4(e: {
  methode: string;
  url: string;
  region: string;
  dienst: string;
  zugangId: string;
  geheimnis: string;
  jetzt: Date;
  header?: Record<string, string>;
  inhaltHash?: string;
}): Record<string, string>;

export declare function s3ListeLesen(xml: string): {
  dateien: { pfad: string; bytes: number }[];
  weiter: string | null;
};

export declare function s3Kodieren(text: string): string;

export declare function s3Url(basis: string, segmente: string[], abfrage?: Record<string, string>): string;
