// Zeilen der Anlage aus dem Bündel (Plan 20): Anlagen, Bereiche, Plätze, Gefässe, Anzuchtorte. Rein.

export type Teile = Record<string, readonly unknown[]> | undefined;

export interface AnlageZeile {
  id: string;
  kuerzel: string;
  name: string;
  datenart: 'echt' | 'demo' | 'test';
  aktiv: boolean;
  storniert_am: string | null;
  /** Konzept 8.2; fehlt in älteren Bündeln und Fixtures, dann gilt die Vorgabe 'indoor' (Plan 212) */
  standort?: 'indoor' | 'outdoor';
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
  // Plan 21: alle Spalten der Belegung für die Kopie beim Ändern
  client_id?: string | null;
  deckeltyp_id?: string;
  feste_dosis?: boolean;
  luftpumpe?: string | null;
  intervall_nachfuellen_d?: number | null;
  naechster_wechsel_am?: string | null;
  gueltig_von?: string;
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

// Plan 21: Vorlagen, Netztöpfe, Ereignisse am Platz

export interface GefaessmodellZeile {
  id: string;
  name: string;
  form: string;
  innen_l_mm: number;
  innen_b_mm: number;
  innen_h_mm: number;
  betriebsvolumen_l: number | string;
  storniert_am: string | null;
}
export interface DeckeltypZeile {
  id: string;
  name: string;
  topfdurchmesser_mm: number;
  loecher_je_reihe: readonly number[];
  storniert_am: string | null;
}
export interface NetztopfZeile {
  id: string;
  client_id?: string | null;
  anlage_id: string;
  kennung: string;
  groesse_mm: number;
  heim_platz_id: string;
  heim_loch_nr: number;
  aktiv: boolean;
  storniert_am: string | null;
}
export interface EreignisZeile {
  id: string;
  typ: string;
  platz_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am: string | null;
}

export function gefaessmodell(teile: Teile, id: string): GefaessmodellZeile | undefined {
  return zeilen<GefaessmodellZeile>(teile, 'gefaessmodell').find(
    (m) => m.id === id && m.storniert_am === null,
  );
}

export function deckeltyp(teile: Teile, id: string): DeckeltypZeile | undefined {
  return zeilen<DeckeltypZeile>(teile, 'deckeltyp').find((d) => d.id === id && d.storniert_am === null);
}

/** aktive Netztöpfe mit diesem Heimplatz */
export function toepfeAm(teile: Teile, platzId: string): NetztopfZeile[] {
  return zeilen<NetztopfZeile>(teile, 'netztopf').filter(
    (n) => n.storniert_am === null && n.aktiv !== false && n.heim_platz_id === platzId,
  );
}

/**
 * Ereignisse am Platz, nicht storniert. Das Bündel lädt die Platz-Ereignisse als Teil `ereignis_platz`
 * (Plan 21 A13), die Geräte-Ereignisse als `ereignis`; beide aus derselben Tabelle, nach id entdoppelt.
 */
export function ereignisseAm(teile: Teile, platzId: string, typ?: string): EreignisZeile[] {
  const gesehen = new Set<string>();
  const ergebnis: EreignisZeile[] = [];
  for (const e of [
    ...zeilen<EreignisZeile>(teile, 'ereignis'),
    ...zeilen<EreignisZeile>(teile, 'ereignis_platz'),
  ]) {
    if (gesehen.has(e.id)) continue;
    gesehen.add(e.id);
    if (e.storniert_am === null && e.platz_id === platzId && (typ === undefined || e.typ === typ))
      ergebnis.push(e);
  }
  return ergebnis;
}

/** Kürzel der Anlage eines Platzes */
export function kuerzelVon(teile: Teile, anlageId: string): string {
  return zeilen<AnlageZeile>(teile, 'anlage').find((a) => a.id === anlageId)?.kuerzel ?? '';
}

/** Zeitpunkt-Vergleich für ISO-Texte */
export const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : Number.NaN);
