// Phasenprofil einer Sorte und Kulturform (Plan 35; R1.1, R1.2): Folge der Phasen bis zum Profilende, Dauern und
// Wechselmerkmale aus v_sollwert. Rein.
import { zeilen, type Teile } from '../anlage/teile.ts';
import type { Dauer } from './termine.ts';

export type Phase = 'keimung' | 'anzucht' | 'wachstum' | 'bluete' | 'fruchtbildung_reife';
export type Kulturform =
  'keimling' | 'babyleaf' | 'kopf' | 'schnitt' | 'dauerkultur_blatt' | 'dauerkultur_frucht';

export const PHASEN: readonly Phase[] = ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'];

export const PHASE_NAME: Readonly<Record<Phase, string>> = {
  keimung: 'Keimung',
  anzucht: 'Anzucht',
  wachstum: 'Wachstum',
  bluete: 'Blüte',
  fruchtbildung_reife: 'Fruchtbildung und Reife',
};

/** R1.2: letzte Phase je Kulturform */
export const PROFILENDE: Readonly<Record<Kulturform, Phase>> = {
  keimling: 'anzucht',
  babyleaf: 'wachstum',
  kopf: 'wachstum',
  schnitt: 'wachstum',
  dauerkultur_blatt: 'wachstum',
  dauerkultur_frucht: 'fruchtbildung_reife',
};

export interface PhasenSchritt {
  phase: Phase;
  dauer: Dauer;
  /** Merkmal, mit dem die Phase endet */
  wechselmerkmal?: string;
}

interface Sollwert {
  sorte_id: string;
  phase: string;
  groesse: string;
  wert_min: number | string | null;
  wert_typ: number | string | null;
  wert_max: number | string | null;
  text_wert: string | null;
}

const zahl = (w: number | string | null | undefined) =>
  w === null || w === undefined || w === '' ? undefined : Number(w);

/** Folge der Phasen bis zum Profilende; Phasen mit anwendbar = entfaellt fallen weg (R1.1) */
export function phasenfolge(teile: Teile, sorteId: string, kulturform: string): PhasenSchritt[] {
  const ende = PROFILENDE[kulturform as Kulturform] ?? 'wachstum';
  const werte = zeilen<Sollwert>(teile, 'v_sollwert').filter((s) => s.sorte_id === sorteId);
  const wert = (phase: Phase, groesse: string) =>
    werte.find((s) => s.phase === phase && s.groesse === groesse);
  const folge: PhasenSchritt[] = [];
  for (const phase of PHASEN.slice(0, PHASEN.indexOf(ende) + 1)) {
    if (wert(phase, 'anwendbar')?.text_wert === 'entfaellt') continue;
    const d = wert(phase, 'dauer');
    const dauer: Dauer = {};
    const min = zahl(d?.wert_min);
    const typ = zahl(d?.wert_typ);
    const max = zahl(d?.wert_max);
    if (min !== undefined) dauer.min = min;
    if (typ !== undefined) dauer.typ = typ;
    if (max !== undefined) dauer.max = max;
    const merkmal = wert(phase, 'wechselmerkmal')?.text_wert;
    folge.push({ phase, dauer, ...(merkmal ? { wechselmerkmal: merkmal } : {}) });
  }
  return folge;
}
