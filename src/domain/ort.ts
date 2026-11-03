// Ort aus dem Etikett-Code (R9.1: Kürzel + «-» + Kennung; R9.2 Teil: nur aktive Plätze aktiver Anlagen; Plan 12).
// Rein: liest nur die Teile des Bündels in der Form von PostgREST.
import type { Datenart } from './kalibrierung/stand.ts';

export type Betriebsart = string;

export interface Ort {
  code: string;
  platzId: string;
  kennung: string;
  rolle: 'gefaess' | 'messstelle' | 'anzuchtort' | 'lager';
  anlageId: string;
  datenart: Datenart;
  betriebsart?: Betriebsart;
  intervallMessenD?: number;
}

interface AnlageZeile {
  id: string;
  kuerzel: string;
  datenart: Datenart;
  aktiv: boolean;
  storniert_am: string | null;
}
interface PlatzZeile {
  id: string;
  anlage_id: string;
  kennung: string;
  rolle: Ort['rolle'];
  aktiv: boolean;
  storniert_am: string | null;
}
interface GefaessZeile {
  platz_id: string;
  betriebsart: string;
  intervall_messen_d: number | null;
  gueltig_bis: string | null;
  storniert_am: string | null;
}

const zeilen = <T>(teile: Record<string, readonly unknown[]>, name: string) =>
  (teile[name] ?? []) as readonly T[];

function alleOrte(teile: Record<string, readonly unknown[]>): Ort[] {
  const anlagen = new Map(
    zeilen<AnlageZeile>(teile, 'anlage')
      .filter((a) => a.aktiv && a.storniert_am === null)
      .map((a) => [a.id, a]),
  );
  const gefaesse = zeilen<GefaessZeile>(teile, 'gefaess').filter(
    (g) => g.gueltig_bis === null && g.storniert_am === null,
  );
  const orte: Ort[] = [];
  for (const p of zeilen<PlatzZeile>(teile, 'platz')) {
    const anlage = anlagen.get(p.anlage_id);
    if (!anlage || !p.aktiv || p.storniert_am !== null) continue;
    const ort: Ort = {
      code: `${anlage.kuerzel}-${p.kennung}`,
      platzId: p.id,
      kennung: p.kennung,
      rolle: p.rolle,
      anlageId: anlage.id,
      datenart: anlage.datenart,
    };
    const g = gefaesse.find((x) => x.platz_id === p.id);
    if (g) {
      ort.betriebsart = g.betriebsart;
      if (g.intervall_messen_d !== null) ort.intervallMessenD = g.intervall_messen_d;
    }
    orte.push(ort);
  }
  return orte;
}

export function ortAufloesen(code: string, teile: Record<string, readonly unknown[]>): Ort | undefined {
  return code ? alleOrte(teile).find((o) => o.code === code) : undefined;
}

/** aktive Gefässe mit Belegung und Messstellen, nach Code sortiert (A7) */
export function messbareOrte(teile: Record<string, readonly unknown[]>): Ort[] {
  return alleOrte(teile)
    .filter((o) => o.rolle === 'messstelle' || (o.rolle === 'gefaess' && o.betriebsart !== undefined))
    .sort((a, b) => a.code.localeCompare(b.code));
}
