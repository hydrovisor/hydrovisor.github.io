// Freiprüfung eines Topfs an einem Umsetzdatum (R1.2, R1.7, R8.2, R11.1, R11.2; Plan 25): Vorgänger im Topf, ihr
// voraussichtliches Ende und die Nachfolge-Regel. Rein: nur Kalendertage als Text 'JJJJ-MM-TT', keine Uhr. Eigenes
// Modul, damit saeen.ts und duplizieren.ts es ohne Kreisimport nutzen.
import { zeilen, type Teile } from '../anlage/teile.ts';
import { kalendertag, tagPlus, ZEITZONE } from '../zeit.ts';

export type Ernteart = 'einmalig' | 'mehrfach';

export interface Vorgaenger {
  pflanzungId: string;
  satzId: string;
  /** steht im Topf (auch Direktsaat mit Reservierung) oder kommt über eine Reservierung aus der Anzucht */
  art: 'steht' | 'kommt';
  ernteart?: Ernteart;
  endeAm?: string;
}

export interface TopfPrognose {
  netztopfId: string;
  kennung: string;
  platzId: string;
  lochNr: number;
  groesseMm: number;
  frei: boolean;
  grund: 'leer' | 'nachfolge' | 'belegt' | 'reserviert';
  /** grösstes Ende der Vorgänger; fehlt ohne Vorgänger oder wenn ein Ende unbekannt ist */
  belegtBis?: string;
  vorgaenger: Vorgaenger[];
}

interface SatzZeile {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  direktsaat_platz_id: string | null;
  storniert_am: string | null;
}
interface ZustandZeile {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
  loch_nr: number | null;
}
interface ReservierungZeile {
  pflanzung_id: string;
  netztopf_id: string;
  umsetzen_geplant_am: string | null;
  umsetzen_vorgabe_am: string;
}
interface ArtKulturformZeile {
  art_id: string;
  kulturform: string;
  ernteart: Ernteart | null;
  ernte_ab_d: number | string | null;
  kulturdauer_max_d: number | string | null;
  kulturdauer_typisch_d?: number | string | null;
  gueltig_bis?: string | null;
}

const zahl = (w: number | string | null | undefined) =>
  w === null || w === undefined ? undefined : Number(w);

const satzVon = (teile: Teile, pflanzungId: string): SatzZeile | undefined => {
  const satzId = zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').find(
    (p) => p.id === pflanzungId,
  )?.satz_id;
  return zeilen<SatzZeile>(teile, 'satz').find((s) => s.id === satzId);
};

/** Art der Sorte (gültige Fassung) */
export function artDerSorte(teile: Teile, sorteId: string): string | undefined {
  return zeilen<{ sorte_id: string; art_id: string; gueltig_bis?: string | null }>(teile, 'sorte').find(
    (s) => s.sorte_id === sorteId && (s.gueltig_bis ?? null) === null,
  )?.art_id;
}

/** «Umsetzen ab» der Art in Tagen ab Saat */
export function umsetzenAbTage(teile: Teile, artId: string | undefined): number | undefined {
  return zahl(
    zeilen<{ art_id: string; umsetzen_ab_d: number | null; gueltig_bis?: string | null }>(teile, 'art').find(
      (a) => a.art_id === artId && (a.gueltig_bis ?? null) === null,
    )?.umsetzen_ab_d,
  );
}

/** gültige Zeile art_kulturform */
export function artKulturform(
  teile: Teile,
  artId: string | undefined,
  kulturform: string,
): ArtKulturformZeile | undefined {
  return zeilen<ArtKulturformZeile>(teile, 'art_kulturform').find(
    (z) => z.art_id === artId && z.kulturform === kulturform && (z.gueltig_bis ?? null) === null,
  );
}

/**
 * Voraussichtliches Ende einer Pflanzung (R1.2, R11.1): einmalig Bezugstag + «Ernte möglich ab» (Bezug: geplanter
 * Umsetztag, bei Direktsaat die Saat, sonst Saat + «Umsetzen ab», A1, A5); mehrfach Saat + Kulturdauer max. Ohne Zeile
 * in art_kulturform {}, ohne nötiges Feld nur { ernteart }.
 */
export function voraussichtlichesEnde(
  teile: Teile,
  pflanzungId: string,
  bezugUmsetzen?: string,
): { ernteart?: Ernteart; endeAm?: string } {
  const satz = satzVon(teile, pflanzungId);
  if (!satz) return {};
  const artId = artDerSorte(teile, satz.sorte_id);
  const ak = artKulturform(teile, artId, satz.kulturform);
  if (!ak?.ernteart) return {};
  const ernteart = ak.ernteart;
  if (ernteart === 'mehrfach') {
    const max = zahl(ak.kulturdauer_max_d);
    return max === undefined ? { ernteart } : { ernteart, endeAm: tagPlus(satz.saatdatum, max) };
  }
  const ab = zahl(ak.ernte_ab_d);
  if (ab === undefined) return { ernteart };
  const umsetzen = umsetzenAbTage(teile, artId);
  const bezug =
    bezugUmsetzen ??
    (satz.direktsaat_platz_id
      ? satz.saatdatum
      : umsetzen === undefined
        ? undefined
        : tagPlus(satz.saatdatum, umsetzen));
  return bezug === undefined ? { ernteart } : { ernteart, endeAm: tagPlus(bezug, ab) };
}

/**
 * Kalendertag des letzten nicht stornierten Ereignisses umsetzen einer stehenden Pflanzung (Plan 33 A27, Plan 25
 * Befund 17): Bezug für «Ernte möglich ab» statt Saat + «Umsetzen ab». Zeitzone der Anlage nach G1 (A).
 */
function umsetzTag(teile: Teile, pflanzungId: string, zeitzone: string): string | undefined {
  const e = zeilen<{
    typ: string;
    pflanzung_id: string | null;
    gilt_ab: string;
    storniert_am: string | null;
  }>(teile, 'ereignis_pflanzung')
    .filter((x) => x.typ === 'umsetzen' && x.pflanzung_id === pflanzungId && x.storniert_am === null)
    .sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab))[0];
  return e ? kalendertag(new Date(e.gilt_ab), zeitzone) : undefined;
}

/**
 * Prognose eines Topfs am Umsetzdatum (R11.1, R11.2, R8.2): leer ohne Vorgänger; Nachfolge, wenn nur Vorgänger
 * stehen, jedes Ende bekannt ist und gilt einmalig E < U, mehrfach E ≤ U, und der neue Satz keine Direktsaat ist (A9);
 * reserviert, wenn eine Pflanzung aus der Anzucht kommt; sonst belegt. undefined: Topf nicht aktiv oder ohne Loch.
 */
export function topfPrognose(
  teile: Teile,
  netztopfId: string,
  umsetzenAm: string,
  direktsaat: boolean,
  /** Zeitzone für den Umsetztag (G1; Runde 1 Befund 11) */
  zeitzone: string = ZEITZONE,
): TopfPrognose | undefined {
  const topf = zeilen<{ id: string; groesse_mm: number; aktiv?: boolean; storniert_am: string | null }>(
    teile,
    'netztopf',
  ).find((n) => n.id === netztopfId && n.storniert_am === null && n.aktiv !== false);
  const ort = zeilen<{ netztopf_id: string; kennung: string; platz_id: string; loch_nr: number | null }>(
    teile,
    'v_netztopf_platz',
  ).find((n) => n.netztopf_id === netztopfId);
  if (!topf || !ort || ort.loch_nr === null || ort.loch_nr === undefined) return undefined;
  const lochNr = Number(ort.loch_nr);

  const zustand = zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand');
  const statusVon = new Map(zustand.map((z) => [z.pflanzung_id, z.status]));
  const aktiv = (pflanzungId: string) => (statusVon.get(pflanzungId) ?? 'aktiv') === 'aktiv';
  const vorgaenger: Vorgaenger[] = [];
  const gesehen = new Set<string>();
  const dazu = (pflanzungId: string, art: Vorgaenger['art'], bezug?: string) => {
    if (gesehen.has(pflanzungId)) return;
    gesehen.add(pflanzungId);
    const satz = satzVon(teile, pflanzungId);
    const ende = voraussichtlichesEnde(teile, pflanzungId, bezug);
    vorgaenger.push({
      pflanzungId,
      satzId: satz?.id ?? '',
      art,
      ...(ende.ernteart ? { ernteart: ende.ernteart } : {}),
      ...(ende.endeAm ? { endeAm: ende.endeAm } : {}),
    });
  };
  // steht: im Topf (Netztopf oder Platz und Loch)
  for (const z of zustand)
    if (
      z.status === 'aktiv' &&
      (z.netztopf_id === netztopfId || (z.platz_id === ort.platz_id && Number(z.loch_nr) === lochNr))
    )
      dazu(z.pflanzung_id, 'steht', umsetzTag(teile, z.pflanzung_id, zeitzone));
  // Reservierungen: Direktsaat steht (A4), Anzucht kommt; nur aktive Pflanzungen
  const reservierungen = zeilen<ReservierungZeile>(teile, 'v_reservierung_aktiv').filter(
    (r) => r.netztopf_id === netztopfId && aktiv(r.pflanzung_id),
  );
  for (const r of reservierungen)
    if (satzVon(teile, r.pflanzung_id)?.direktsaat_platz_id) dazu(r.pflanzung_id, 'steht');
  for (const r of reservierungen)
    if (!gesehen.has(r.pflanzung_id))
      dazu(r.pflanzung_id, 'kommt', r.umsetzen_geplant_am ?? r.umsetzen_vorgabe_am);

  const enden = vorgaenger.map((v) => v.endeAm);
  const alleBekannt = vorgaenger.length > 0 && enden.every((e) => e !== undefined);
  const belegtBis = alleBekannt ? (enden as string[]).sort().at(-1) : undefined;
  const nachfolge =
    !direktsaat &&
    alleBekannt &&
    vorgaenger.every(
      (v) =>
        v.art === 'steht' &&
        v.endeAm !== undefined &&
        (v.ernteart === 'mehrfach' ? v.endeAm <= umsetzenAm : v.endeAm < umsetzenAm),
    );
  const grund: TopfPrognose['grund'] =
    vorgaenger.length === 0
      ? 'leer'
      : vorgaenger.some((v) => v.art === 'kommt')
        ? 'reserviert'
        : nachfolge
          ? 'nachfolge'
          : 'belegt';
  return {
    netztopfId,
    kennung: ort.kennung,
    platzId: ort.platz_id,
    lochNr,
    groesseMm: Number(topf.groesse_mm),
    frei: grund === 'leer' || grund === 'nachfolge',
    grund,
    ...(belegtBis ? { belegtBis } : {}),
    vorgaenger: [
      ...vorgaenger.filter((v) => v.art === 'steht'),
      ...vorgaenger.filter((v) => v.art === 'kommt'),
    ],
  };
}
