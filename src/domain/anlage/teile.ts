// Zeilen der Anlage aus dem Bündel (Plan 20): Anlagen, Bereiche, Plätze, Gefässe, Anzuchtorte. Rein.

export type Teile = Record<string, readonly unknown[]> | undefined;

export interface AnlageZeile {
  id: string;
  kuerzel: string;
  name: string;
  datenart: 'echt' | 'demo' | 'test';
  aktiv: boolean;
  storniert_am: string | null;
}
export interface BereichZeile {
  id: string;
  anlage_id: string;
  nummer: number;
  name: string;
  storniert_am: string | null;
}
export interface PlatzZeile {
  id: string;
  anlage_id: string;
  bereich_id: string | null;
  kennung: string;
  rolle: 'gefaess' | 'anzuchtort' | 'messstelle' | 'lager';
  aktiv: boolean;
  storniert_am: string | null;
}
export interface GefaessZeile {
  id: string;
  platz_id: string;
  gefaessmodell_id: string;
  betriebsart: string;
  betriebsvolumen_l: number | string;
  intervall_messen_d: number | null;
  intervall_wechseln_d: number | null;
  gueltig_bis: string | null;
  storniert_am: string | null;
}
export interface AnzuchtortZeile {
  platz_id: string;
  typ: 'box_licht' | 'box_dunkel';
  storniert_am: string | null;
}

export const zeilen = <T>(teile: Teile, name: string) => (teile?.[name] ?? []) as readonly T[];
const offen = <T extends { storniert_am: string | null }>(l: readonly T[]) =>
  l.filter((z) => z.storniert_am === null);

/** aktive, nicht stornierte Anlagen: echte zuerst, dann nach Kürzel */
export function anlagenAus(teile: Teile): AnlageZeile[] {
  const rang = { echt: 0, demo: 1, test: 2 } as const;
  return offen(zeilen<AnlageZeile>(teile, 'anlage'))
    .filter((a) => a.aktiv)
    .sort((a, b) => rang[a.datenart] - rang[b.datenart] || a.kuerzel.localeCompare(b.kuerzel));
}

export function plaetzeAus(teile: Teile, anlageId: string): PlatzZeile[] {
  return offen(zeilen<PlatzZeile>(teile, 'platz')).filter((p) => p.aktiv && p.anlage_id === anlageId);
}

export function bereicheAus(teile: Teile, anlageId: string): BereichZeile[] {
  return offen(zeilen<BereichZeile>(teile, 'bereich')).filter((b) => b.anlage_id === anlageId);
}

/** aktives Gefäss je Platz */
export function gefaessAm(teile: Teile, platzId: string): GefaessZeile | undefined {
  return offen(zeilen<GefaessZeile>(teile, 'gefaess')).find(
    (g) => g.platz_id === platzId && g.gueltig_bis === null,
  );
}

export function anzuchtortAm(teile: Teile, platzId: string): AnzuchtortZeile | undefined {
  return offen(zeilen<AnzuchtortZeile>(teile, 'anzuchtort')).find((a) => a.platz_id === platzId);
}

export function gefaessStatus(teile: Teile, gefaessId: string): string | undefined {
  return zeilen<{ gefaess_id: string; status: string }>(teile, 'v_gefaess_status').find(
    (s) => s.gefaess_id === gefaessId,
  )?.status;
}

/** Kennungen numerisch sortieren: 1.2 vor 1.10, A1 vor A2 */
export function nachKennung(a: { kennung: string }, b: { kennung: string }): number {
  return a.kennung.localeCompare(b.kennung, 'de', { numeric: true });
}
