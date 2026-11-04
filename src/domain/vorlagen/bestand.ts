// Vorlagen aus dem Bündel, Nutzung durch Gefässe, Löschen und Korrigieren (Plan 19; UC2 «Varianten»;
// Konzept 8.1 Regel 2 und 3). Rein: Zeilen in der Form von PostgREST (numeric als Text).
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';

export type Vorlagenart = 'gefaessmodell' | 'deckeltyp';

export interface GefaessmodellZeile {
  id: string;
  client_id: string | null;
  name: string;
  form: 'rechteckig' | 'oval';
  innen_l_mm: number;
  innen_b_mm: number;
  innen_h_mm: number;
  nennvolumen_l: number | null;
  betriebsvolumen_l: number;
}

export interface DeckeltypZeile {
  id: string;
  client_id: string | null;
  name: string;
  topfdurchmesser_mm: 50 | 80;
  loecher_je_reihe: number[];
  service_oeffnung: boolean;
}

type Teile = Readonly<Record<string, readonly unknown[] | undefined>> | undefined;
type Roh = Record<string, unknown>;

function zeilen(teile: Teile, name: string): Roh[] {
  return ((teile?.[name] ?? []) as Roh[]).filter((z) => z && z['storniert_am'] == null);
}

function zahl(wert: unknown): number {
  return typeof wert === 'number' ? wert : Number(wert);
}

const nachName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'de-CH', { numeric: true });

/** nicht stornierte Vorlagen, nach Name; numeric als Zahl */
export function vorlagenAusTeilen(teile: Teile): {
  modelle: GefaessmodellZeile[];
  deckel: DeckeltypZeile[];
} {
  const modelle = zeilen(teile, 'gefaessmodell')
    .map((z): GefaessmodellZeile => ({
      id: String(z['id']),
      client_id: (z['client_id'] as string | null | undefined) ?? null,
      name: String(z['name']),
      form: z['form'] === 'oval' ? 'oval' : 'rechteckig',
      innen_l_mm: zahl(z['innen_l_mm']),
      innen_b_mm: zahl(z['innen_b_mm']),
      innen_h_mm: zahl(z['innen_h_mm']),
      nennvolumen_l: z['nennvolumen_l'] == null ? null : zahl(z['nennvolumen_l']),
      betriebsvolumen_l: zahl(z['betriebsvolumen_l']),
    }))
    .sort(nachName);
  const deckel = zeilen(teile, 'deckeltyp')
    .map((z): DeckeltypZeile => ({
      id: String(z['id']),
      client_id: (z['client_id'] as string | null | undefined) ?? null,
      name: String(z['name']),
      topfdurchmesser_mm: zahl(z['topfdurchmesser_mm']) === 80 ? 80 : 50,
      loecher_je_reihe: ((z['loecher_je_reihe'] as unknown[] | null) ?? []).map(zahl),
      service_oeffnung: z['service_oeffnung'] !== false,
    }))
    .sort(nachName);
  return { modelle, deckel };
}

const SPALTE: Record<Vorlagenart, string> = {
  gefaessmodell: 'gefaessmodell_id',
  deckeltyp: 'deckeltyp_id',
};

/**
 * Kennungen der Plätze, deren nicht stornierte Gefäss-Zeilen auf die Vorlage zeigen, auch geschlossene Belegungen
 * (Plan 19 A8); sortiert, jede einmal
 */
export function nutzendePlaetze(teile: Teile, art: Vorlagenart, id: string): string[] {
  const kennungen = new Map(zeilen(teile, 'platz').map((p) => [String(p['id']), String(p['kennung'])]));
  const genutzt = new Set<string>();
  for (const g of zeilen(teile, 'gefaess')) {
    if (g[SPALTE[art]] !== id) continue;
    const kennung = kennungen.get(String(g['platz_id']));
    if (kennung !== undefined) genutzt.add(kennung);
  }
  return [...genutzt].sort((a, b) => a.localeCompare(b, 'de-CH', { numeric: true }));
}

/** Löschen = Storno (8.1 Regel 3); nur für ungenutzte Vorlagen, das prüft die Maske mit nutzendePlaetze */
export function loeschVorgang(art: Vorlagenart, clientId: string): Vorgang {
  return [{ art: 'storno', tabelle: art, clientId, grund: 'fehleingabe' }];
}

/** Korrektur = Storno der alten Zeile plus neue Zeile in einem Vorgang (8.1 Regel 2) */
export function korrekturVorgang(art: Vorlagenart, alteClientId: string, neu: Schritt): Vorgang {
  return [{ art: 'storno', tabelle: art, clientId: alteClientId, grund: 'korrektur' }, neu];
}
