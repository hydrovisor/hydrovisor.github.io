// W0-Dateien unter einer Wurzel lesen (Vorgabe: Repository). Eine fehlende Datei gilt als «nicht geliefert» (A1).
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { csvLesen } from '../../src/domain/w0/csv.ts';
import { DATEI, KANDIDATEN_ORDNER } from '../../src/domain/w0/schema.ts';
import type { Verstoss, W0Dateien } from '../../src/domain/w0/typen.ts';

export interface Gelesen {
  dateien: W0Dateien;
  verstoesse: Verstoss[];
}

function lesen(wurzel: string, pfade: Record<string, string>): Gelesen {
  const dateien: W0Dateien = {};
  const verstoesse: Verstoss[] = [];
  for (const [schluessel, pfad] of Object.entries(pfade)) {
    const voll = join(wurzel, pfad);
    if (!existsSync(voll)) continue;
    const t = csvLesen(schluessel, readFileSync(voll, 'utf8'));
    if (Array.isArray(t)) verstoesse.push(...t);
    else dateien[schluessel] = t;
  }
  return { dateien, verstoesse };
}

/** freigegebene Dateien und Stammdaten (Abschnitt 1) */
export function dateienLesen(wurzel: string): Gelesen {
  return lesen(wurzel, Object.fromEntries(Object.values(DATEI).map((p) => [p, p])));
}

/** Kandidatendateien (Abschnitt 3) unter dem Pfad der freigegebenen Datei, damit das Schema greift (A14) */
export function kandidatenLesen(wurzel: string): Gelesen {
  const freigegeben = Object.values(DATEI).filter((p) => p.startsWith('data/wissensbasis/freigegeben/'));
  return lesen(wurzel, Object.fromEntries(freigegeben.map((p) => [p, `${KANDIDATEN_ORDNER}${basename(p)}`])));
}
