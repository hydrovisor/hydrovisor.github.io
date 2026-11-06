// Töpfe und Deckelbelegung (Plan 33; R8.3, R6.2, R1-2 aus #90): wo steht ein Netztopf, welche Pflanzungen stehen
// darin, wie sieht der Deckel eines Platzes aus. Rein: liest nur Teile des Bündels.
import {
  deckeltyp,
  gefaessAm,
  zeilen,
  type NetztopfZeile,
  type PlatzZeile,
  type Teile,
} from '../anlage/teile.ts';

interface NetztopfPlatz {
  netztopf_id: string;
  kennung: string;
  platz_id: string | null;
  loch_nr: number | null;
  ausser_heim?: boolean;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
  loch_nr: number | null;
  netztopf_id: string | null;
}

export interface TopfOrt {
  netztopfId: string;
  kennung: string;
  groesseMm: number;
  platzId: string;
  lochNr: number;
  heimPlatzId: string;
  heimLochNr: number;
  ausserHeim: boolean;
}

export interface DeckelLoch {
  lochNr: number;
  /** Topf, der in diesem Loch steht, sonst der abwesende Heimtopf */
  netztopfId?: string;
  /** Kennung des Topfs, der dort steht */
  kennung?: string;
  zustand: 'frei' | 'belegt' | 'reserviert';
  sorte?: string;
  satzId?: string;
  pflanzungId?: string;
  /** Topf ausser Heimplatz: «2.3.4 auf 2.3.1» */
  fremd?: string;
  /** Heimloch, dessen Topf anderswo steht: «2.1.2 auf 4.2.1» */
  abwesend?: string;
  /** 8-cm-Topf auf der Station: «→ 2.1» */
  ziel?: string;
}

const aktiveToepfe = (teile: Teile) =>
  zeilen<NetztopfZeile>(teile, 'netztopf').filter((n) => n.storniert_am === null && n.aktiv !== false);

const platzKennung = (teile: Teile, platzId: string | null | undefined) =>
  zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';

/** Station = Gefäss mit fester Dosis (R4.5) */
export function istStation(teile: Teile, platzId: string): boolean {
  return gefaessAm(teile, platzId)?.feste_dosis === true;
}

export function topfOrt(teile: Teile, netztopfId: string): TopfOrt | undefined {
  const n = aktiveToepfe(teile).find((x) => x.id === netztopfId);
  if (!n) return undefined;
  const p = zeilen<NetztopfPlatz>(teile, 'v_netztopf_platz').find((x) => x.netztopf_id === netztopfId);
  const platzId = p?.platz_id ?? n.heim_platz_id;
  const lochNr = Number(p?.loch_nr ?? n.heim_loch_nr);
  return {
    netztopfId,
    kennung: n.kennung,
    groesseMm: Number(n.groesse_mm),
    platzId,
    lochNr,
    heimPlatzId: n.heim_platz_id,
    heimLochNr: Number(n.heim_loch_nr),
    ausserHeim: platzId !== n.heim_platz_id || lochNr !== Number(n.heim_loch_nr),
  };
}

/** aktive Pflanzungen im Topf: netztopf_id, Platz und Loch des Topfs, Direktsaat über ihre aktive Reservierung */
export function pflanzungenImTopf(teile: Teile, netztopfId: string): string[] {
  const ort = topfOrt(teile, netztopfId);
  if (!ort) return [];
  const direkt = new Set(
    zeilen<{ id: string; direktsaat_platz_id: string | null }>(teile, 'satz')
      .filter((s) => s.direktsaat_platz_id)
      .map((s) => s.id),
  );
  const reserviert = new Set(
    zeilen<{ pflanzung_id: string; netztopf_id: string }>(teile, 'v_reservierung_aktiv')
      .filter((r) => r.netztopf_id === netztopfId)
      .map((r) => r.pflanzung_id),
  );
  const ergebnis: string[] = [];
  for (const z of zeilen<Zustand>(teile, 'v_pflanzung_zustand')) {
    if (z.status !== 'aktiv') continue;
    const drin =
      z.netztopf_id === netztopfId ||
      (z.platz_id === ort.platzId && Number(z.loch_nr) === ort.lochNr && z.platz_id !== null) ||
      (z.platz_id === null && direkt.has(z.satz_id) && reserviert.has(z.pflanzung_id));
    if (drin && !ergebnis.includes(z.pflanzung_id)) ergebnis.push(z.pflanzung_id);
  }
  return ergebnis;
}

/** Topfdurchmesser des Deckels am Platz (50 oder 80), ohne Gefäss undefined */
export function lochGroesse(teile: Teile, platzId: string): 50 | 80 | undefined {
  const g = gefaessAm(teile, platzId);
  const d = g?.deckeltyp_id ? deckeltyp(teile, g.deckeltyp_id) : undefined;
  if (!d) return undefined;
  return Number(d.topfdurchmesser_mm) === 80 ? 80 : 50;
}

/** gleiche Topfgrösse wie das Lochbild des Ziels (R8.3, UC6-AK4) */
export function topfPasst(teile: Teile, netztopfId: string, zielPlatzId: string): boolean {
  const ort = topfOrt(teile, netztopfId);
  return ort !== undefined && lochGroesse(teile, zielPlatzId) === ort.groesseMm;
}

/** Zahl der Löcher des Deckels am Platz */
export function lochZahl(teile: Teile, platzId: string): number {
  const g = gefaessAm(teile, platzId);
  const d = g?.deckeltyp_id ? deckeltyp(teile, g.deckeltyp_id) : undefined;
  return d ? d.loecher_je_reihe.reduce((a, b) => a + Number(b), 0) : 0;
}

/** Sortenname zum Satz */
export function sorteDesSatzes(teile: Teile, satzId: string): string | undefined {
  const sorteId = zeilen<{ id: string; sorte_id: string }>(teile, 'satz').find(
    (s) => s.id === satzId,
  )?.sorte_id;
  return zeilen<{ sorte_id: string; name: string; gueltig_bis?: string | null }>(teile, 'sorte').find(
    (s) => s.sorte_id === sorteId && (s.gueltig_bis ?? null) === null,
  )?.name;
}

/** Deckel eines Platzes je Loch in Lochfolge (Plan 33): Topf, Belegung, fremd, abwesend, Ziel auf der Station */
export function deckelBelegung(teile: Teile, platzId: string): DeckelLoch[] {
  const zahl = lochZahl(teile, platzId);
  if (zahl === 0) return [];
  const station = istStation(teile, platzId);
  const toepfe = new Map(aktiveToepfe(teile).map((n) => [n.id, n]));
  const stehend = new Map<number, NetztopfPlatz>();
  for (const p of zeilen<NetztopfPlatz>(teile, 'v_netztopf_platz'))
    if (p.platz_id === platzId && p.loch_nr !== null && toepfe.has(p.netztopf_id))
      stehend.set(Number(p.loch_nr), p);
  const heim = new Map<number, NetztopfZeile>();
  for (const n of toepfe.values()) if (n.heim_platz_id === platzId) heim.set(Number(n.heim_loch_nr), n);
  const zustaende = zeilen<Zustand>(teile, 'v_pflanzung_zustand').filter((z) => z.status === 'aktiv');
  const reserviert = new Set(
    zeilen<{ netztopf_id: string }>(teile, 'v_reservierung_aktiv').map((r) => r.netztopf_id),
  );

  return Array.from({ length: zahl }, (_, i) => i + 1).map((lochNr) => {
    const loch: DeckelLoch = { lochNr, zustand: 'frei' };
    const topf = stehend.get(lochNr);
    const heimTopf = heim.get(lochNr);
    let pflanzungId: string | undefined;
    let topfId: string | undefined;
    // auf der Station zählen nur Zieltöpfe von anderswo; die Plätze der Station selbst sind Löcher ohne Topf (A)
    const eigenerStationstopf =
      station && topf !== undefined && toepfe.get(topf.netztopf_id)?.heim_platz_id === platzId;
    if (topf && !eigenerStationstopf) {
      topfId = topf.netztopf_id;
      const n = toepfe.get(topf.netztopf_id);
      loch.netztopfId = topf.netztopf_id;
      loch.kennung = topf.kennung;
      const ausser = n !== undefined && (n.heim_platz_id !== platzId || Number(n.heim_loch_nr) !== lochNr);
      if (ausser && n) {
        if (station) loch.ziel = `→ ${platzKennung(teile, n.heim_platz_id)}`;
        else loch.fremd = `${topf.kennung} auf ${platzKennung(teile, platzId)}.${lochNr}`;
      }
      pflanzungId = pflanzungenImTopf(teile, topf.netztopf_id)[0];
    } else if (heimTopf && !station) {
      // der Heimtopf steht anderswo
      const ort = topfOrt(teile, heimTopf.id);
      loch.netztopfId = heimTopf.id;
      if (ort) loch.abwesend = `${heimTopf.kennung} auf ${platzKennung(teile, ort.platzId)}.${ort.lochNr}`;
    }
    pflanzungId ??= zustaende.find(
      (z) => z.platz_id === platzId && Number(z.loch_nr) === lochNr,
    )?.pflanzung_id;
    if (pflanzungId) {
      const z = zustaende.find((x) => x.pflanzung_id === pflanzungId);
      loch.zustand = 'belegt';
      loch.pflanzungId = pflanzungId;
      if (z) {
        loch.satzId = z.satz_id;
        const sorte = sorteDesSatzes(teile, z.satz_id);
        if (sorte) loch.sorte = sorte;
      }
    } else if ((topfId && reserviert.has(topfId)) || (!topf && heimTopf && reserviert.has(heimTopf.id)))
      loch.zustand = 'reserviert';
    return loch;
  });
}

/** Löcher je Reihe des Deckels am Platz (für die Grafik) */
export function deckelReihen(teile: Teile, platzId: string): number[] {
  const g = gefaessAm(teile, platzId);
  const d = g?.deckeltyp_id ? deckeltyp(teile, g.deckeltyp_id) : undefined;
  return d ? d.loecher_je_reihe.map(Number) : [];
}

/** zugänglicher Zustand eines Lochs: Kennung, Sorte, Zustand, «ausser Heimplatz», Ziel, abwesend */
export function lochName(l: DeckelLoch): string {
  return [
    l.kennung,
    l.sorte,
    l.zustand === 'frei' && l.abwesend ? undefined : l.zustand,
    l.fremd ? 'ausser Heimplatz' : undefined,
    l.ziel,
    l.abwesend,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** sichtbarer Kurztext im Loch (Plan 33, Status nie nur über Farbe) */
export function lochText(l: DeckelLoch): string | undefined {
  if (l.ziel) return l.ziel.replace('→ ', '→');
  if (l.abwesend && l.kennung === undefined) return 'weg';
  const nr = l.kennung?.split('.').at(-1);
  if (l.fremd && nr) return `↔${nr}`;
  return nr;
}

/** Darstellung des Lochs im Baustein Deckel */
export function lochArt(l: DeckelLoch): 'fremd' | 'abwesend' | undefined {
  if (l.fremd) return 'fremd';
  if (l.abwesend && l.kennung === undefined) return 'abwesend';
  return undefined;
}
