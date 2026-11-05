// Säen (UC5, R1.2, R6.1, R8.1, R8.2, R12; Plan 23): Sortenauswahl, Zielgefässe und Zieltöpfe, Box nach Keimart,
// Vorschlag mit Stationsvorschau, Eingabeprüfung, Vorgang und Rückgängig. Rein: jetzt und Zeitzone als Parameter.
import {
  anlagenAus,
  anzuchtortAm,
  gefaessAm,
  gefaessStatus,
  nachKennung,
  plaetzeAus,
  zeilen,
  type Teile,
} from '../anlage/teile.ts';
import { keimdauerTyp, stationsVorschau, type GeplanterSatz } from '../anzucht/kapazitaet.ts';
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import { keimrate, keimrateArt, saatmenge, type Empfehlung, type Keimrate } from '../saatmenge/saatmenge.ts';
import { kalendertag, tagPlus, tageZwischen, versatz, type Zeitzone } from '../zeit.ts';
import { topfPrognose } from './belegung.ts';

export type Kulturform =
  'keimling' | 'babyleaf' | 'schnitt' | 'kopf' | 'dauerkultur_blatt' | 'dauerkultur_frucht';
export type Kulturtyp = 'blatt' | 'knolle' | 'frucht';

/** Kulturformen je Kulturtyp der Sorte (R1.2) */
const FORMEN_JE_TYP: Record<Kulturtyp, readonly Kulturform[]> = {
  frucht: ['dauerkultur_frucht'],
  blatt: ['keimling', 'babyleaf', 'schnitt', 'kopf', 'dauerkultur_blatt'],
  knolle: ['babyleaf', 'kopf'],
};

export const KULTURFORM_NAME: Record<string, string> = {
  keimling: 'Keimling',
  babyleaf: 'Babyleaf',
  schnitt: 'Schnitt',
  kopf: 'Kopf',
  dauerkultur_blatt: 'Dauerkultur Blatt',
  dauerkultur_frucht: 'Dauerkultur Frucht',
};

const DIREKTSAAT_BETRIEBSARTEN = new Set(['kratky', 'kratky_belueftet']);
/** Saatdatum höchstens so viele Tage zurück (A14) */
export const SAAT_RUECK_MAX = 30;
const HINWEIS_OHNE_UMSETZEN = 'Umsetzdatum fehlt in der Wissensbasis, Ziel später';

interface SorteZeile {
  sorte_id: string;
  name: string;
  art_id: string;
  kulturtyp: Kulturtyp;
  gueltig_bis?: string | null;
  storniert_am?: string | null;
}
interface ArtZeile {
  art_id: string;
  name_de?: string;
  kulturformen_erlaubt: string[];
  kulturform_vorgabe: string | null;
  umsetzen_ab_d: number | null;
  standard_keimfaehigkeit?: number | string | null;
  gueltig_bis?: string | null;
}
interface SatzZeile {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  gilt_ab: string;
  storniert_am: string | null;
}
interface SaatgutZeile {
  id: string;
  sorte_id: string;
  erfasst_am?: string;
  kaufdatum?: string;
  storniert_am: string | null;
}
interface EmpfehlungZeile {
  ebene: 'art' | 'sorte';
  art_id: string | null;
  sorte_id: string | null;
  kulturform: string;
  samen_je_schwamm: number;
  obergrenze_samen: number;
  pflanzen_stehen_lassen: number;
  gueltig_bis?: string | null;
}
interface SollwertZeile {
  sorte_id: string;
  phase: string;
  groesse: string;
  wert_min: number | string | null;
  wert_typ: number | string | null;
  wert_max: number | string | null;
  text_wert: string | null;
}
interface NetztopfPlatzZeile {
  netztopf_id: string;
  kennung: string;
  platz_id: string;
  loch_nr: number | null;
}
interface NetztopfZeile {
  id: string;
  groesse_mm: number;
  aktiv?: boolean;
  storniert_am: string | null;
}
interface ZustandZeile {
  pflanzung_id: string;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
  loch_nr: number | null;
}

const gueltig = <T extends { gueltig_bis?: string | null; storniert_am?: string | null }>(l: readonly T[]) =>
  l.filter((z) => (z.gueltig_bis ?? null) === null && (z.storniert_am ?? null) === null);

const zahl = (w: number | string | null | undefined) =>
  w === null || w === undefined ? undefined : Number(w);

// ---------------------------------------------------------------------------------------------------------------
// Auswahl

/** R1.2: erlaubt = Kulturformen der Art geschnitten mit dem Kulturtyp; Vorgabe der Art, sonst die erste erlaubte */
export function kulturformen(
  art: { kulturformen_erlaubt: readonly string[]; kulturform_vorgabe: string | null },
  kulturtyp: Kulturtyp,
): { erlaubt: Kulturform[]; vorgabe: Kulturform } {
  const typ = FORMEN_JE_TYP[kulturtyp] ?? [];
  const erlaubt = art.kulturformen_erlaubt.filter((k): k is Kulturform =>
    (typ as readonly string[]).includes(k),
  );
  const vorgabe =
    art.kulturform_vorgabe && (erlaubt as string[]).includes(art.kulturform_vorgabe)
      ? (art.kulturform_vorgabe as Kulturform)
      : (erlaubt[0] as Kulturform);
  return { erlaubt, vorgabe };
}

export interface Spanne {
  min?: number;
  typ?: number;
  max?: number;
}

export interface SorteWahl {
  sorteId: string;
  name: string;
  artId: string;
  artName?: string;
  kulturtyp: Kulturtyp;
  kulturformen: Kulturform[];
  vorgabe: Kulturform;
  keimart?: string;
  keimdauer: Spanne;
  keimtemp: Spanne;
  /** Sorte des jüngsten Satzes («Wie letztes Mal») mit dessen Kulturform */
  wieLetztesMal?: Kulturform;
}

function keimwert(teile: Teile, sorteId: string, groesse: string): SollwertZeile | undefined {
  return zeilen<SollwertZeile>(teile, 'v_sollwert').find(
    (s) => s.sorte_id === sorteId && s.phase === 'keimung' && s.groesse === groesse,
  );
}
function spanne(z: SollwertZeile | undefined): Spanne {
  const s: Spanne = {};
  const min = zahl(z?.wert_min);
  const typ = zahl(z?.wert_typ);
  const max = zahl(z?.wert_max);
  if (min !== undefined) s.min = min;
  if (typ !== undefined) s.typ = typ;
  if (max !== undefined) s.max = max;
  return s;
}

const sorteZeile = (teile: Teile, sorteId: string) =>
  gueltig(zeilen<SorteZeile>(teile, 'sorte')).find((s) => s.sorte_id === sorteId);
const artZeile = (teile: Teile, artId: string | undefined) =>
  gueltig(zeilen<ArtZeile>(teile, 'art')).find((a) => a.art_id === artId);

function sorteWahl(teile: Teile, s: SorteZeile): SorteWahl {
  const art = artZeile(teile, s.art_id);
  const formen = kulturformen(
    {
      kulturformen_erlaubt: art?.kulturformen_erlaubt ?? [],
      kulturform_vorgabe: art?.kulturform_vorgabe ?? null,
    },
    s.kulturtyp,
  );
  const keimart = keimwert(teile, s.sorte_id, 'keimart')?.text_wert ?? undefined;
  return {
    sorteId: s.sorte_id,
    name: s.name,
    artId: s.art_id,
    ...(art?.name_de ? { artName: art.name_de } : {}),
    kulturtyp: s.kulturtyp,
    kulturformen: formen.erlaubt,
    vorgabe: formen.vorgabe,
    ...(keimart ? { keimart } : {}),
    keimdauer: spanne(keimwert(teile, s.sorte_id, 'dauer')),
    keimtemp: spanne(keimwert(teile, s.sorte_id, 'keimtemp')),
  };
}

/** jüngster nicht stornierter Satz */
function letzterSatz(teile: Teile): SatzZeile | undefined {
  return zeilen<SatzZeile>(teile, 'satz')
    .filter((s) => s.storniert_am === null)
    .sort((a, b) => b.saatdatum.localeCompare(a.saatdatum) || Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab))
    .at(0);
}

/** gültige Sorten: «Wie letztes Mal» zuerst, dann nach Name */
export function sortenAuswahl(teile: Teile): SorteWahl[] {
  const gesehen = new Set<string>();
  const sorten = gueltig(zeilen<SorteZeile>(teile, 'sorte')).filter((s) => {
    if (gesehen.has(s.sorte_id)) return false;
    gesehen.add(s.sorte_id);
    return true;
  });
  const alle = sorten.map((s) => sorteWahl(teile, s)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const letzter = letzterSatz(teile);
  const erste = letzter ? alle.find((s) => s.sorteId === letzter.sorte_id) : undefined;
  if (!erste || !letzter) return alle;
  const form = (erste.kulturformen as string[]).includes(letzter.kulturform)
    ? (letzter.kulturform as Kulturform)
    : erste.vorgabe;
  return [{ ...erste, wieLetztesMal: form }, ...alle.filter((s) => s !== erste)];
}

// ---------------------------------------------------------------------------------------------------------------
// Zielgefässe und Zieltöpfe

export interface Zielgefaess {
  platzId: string;
  kennung: string;
  code: string;
  direktsaat: boolean;
  reihen: number[];
  hinweis?: string;
}

interface DeckelZeile {
  id: string;
  loecher_je_reihe: number[];
}

/** aktive Gefässe ohne feste Dosis, nicht entfernt; Kratky als Direktsaat (A5); ruht und in Prüfung mit Hinweis */
export function zielgefaesse(teile: Teile, anlageId: string): Zielgefaess[] {
  const kuerzel = anlagenAus(teile).find((a) => a.id === anlageId)?.kuerzel ?? '';
  const deckel = zeilen<DeckelZeile>(teile, 'deckeltyp');
  const ziele: Zielgefaess[] = [];
  for (const p of [...plaetzeAus(teile, anlageId)].sort(nachKennung)) {
    if (p.rolle !== 'gefaess') continue;
    const g = gefaessAm(teile, p.id);
    if (!g || g.feste_dosis) continue;
    const status = gefaessStatus(teile, g.id);
    if (status === 'entfernt') continue;
    const hinweis =
      status === 'ruht'
        ? `Gefäss ${p.kennung} ruht`
        : status === 'in_pruefung'
          ? `Gefäss ${p.kennung} ist in Prüfung`
          : undefined;
    ziele.push({
      platzId: p.id,
      kennung: p.kennung,
      code: `${kuerzel}-${p.kennung}`,
      direktsaat: DIREKTSAAT_BETRIEBSARTEN.has(g.betriebsart),
      reihen: [...(deckel.find((d) => d.id === g.deckeltyp_id)?.loecher_je_reihe ?? [])],
      ...(hinweis ? { hinweis } : {}),
    });
  }
  return ziele;
}

export type TopfZustand = 'frei' | 'belegt' | 'reserviert' | 'gewaehlt';

export interface Zieltopf {
  lochNr: number;
  netztopfId: string;
  kennung: string;
  groesseMm: number;
  zustand: TopfZustand;
  marke?: number;
  /** Nachfolge-Topf (Plan 25): frei am Umsetzdatum, bis dahin belegt bis zu diesem Tag */
  belegtBis?: string;
}

function belegungImGefaess(teile: Teile, platzId: string) {
  const zustand = zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').filter((z) => z.status === 'aktiv');
  const toepfe = new Set(zustand.map((z) => z.netztopf_id).filter((x): x is string => !!x));
  const loecher = new Set(zustand.filter((z) => z.platz_id === platzId).map((z) => z.loch_nr));
  const reserviert = new Set(
    zeilen<{ netztopf_id: string }>(teile, 'v_reservierung_aktiv').map((r) => r.netztopf_id),
  );
  return { toepfe, loecher, reserviert };
}

/**
 * Töpfe eines Gefässes nach Loch: belegt (aktive Pflanzung), reserviert (aktive Reservierung), gewählt, frei. Mit
 * Umsetzdatum (Plan 25, R11.1, R11.2) entscheidet topfPrognose(): ein Nachfolge-Topf ist frei mit belegtBis.
 */
export function zieltoepfe(
  teile: Teile,
  platzId: string,
  ausgewaehlt: ReadonlyMap<string, number>,
  umsetzenAm?: string,
  direktsaat?: boolean,
): Zieltopf[] {
  const groesse = new Map(
    zeilen<NetztopfZeile>(teile, 'netztopf')
      .filter((n) => n.storniert_am === null && n.aktiv !== false)
      .map((n) => [n.id, Number(n.groesse_mm)]),
  );
  const b = belegungImGefaess(teile, platzId);
  return zeilen<NetztopfPlatzZeile>(teile, 'v_netztopf_platz')
    .filter((n) => n.platz_id === platzId && n.loch_nr !== null && groesse.has(n.netztopf_id))
    .sort((a, c) => Number(a.loch_nr) - Number(c.loch_nr))
    .map((n) => {
      const marke = ausgewaehlt.get(n.netztopf_id);
      const p = umsetzenAm ? topfPrognose(teile, n.netztopf_id, umsetzenAm, direktsaat === true) : undefined;
      if (p) {
        const zustand: TopfZustand = p.frei
          ? marke !== undefined
            ? 'gewaehlt'
            : 'frei'
          : p.grund === 'reserviert'
            ? 'reserviert'
            : 'belegt';
        return {
          lochNr: Number(n.loch_nr),
          netztopfId: n.netztopf_id,
          kennung: n.kennung,
          groesseMm: groesse.get(n.netztopf_id) ?? 0,
          zustand,
          ...(zustand === 'gewaehlt' && marke !== undefined ? { marke } : {}),
          ...(p.grund === 'nachfolge' && p.belegtBis ? { belegtBis: p.belegtBis } : {}),
        };
      }
      const zustand: TopfZustand =
        b.toepfe.has(n.netztopf_id) || b.loecher.has(n.loch_nr)
          ? 'belegt'
          : b.reserviert.has(n.netztopf_id)
            ? 'reserviert'
            : marke !== undefined
              ? 'gewaehlt'
              : 'frei';
      return {
        lochNr: Number(n.loch_nr),
        netztopfId: n.netztopf_id,
        kennung: n.kennung,
        groesseMm: groesse.get(n.netztopf_id) ?? 0,
        zustand,
        ...(zustand === 'gewaehlt' && marke !== undefined ? { marke } : {}),
      };
    });
}

// ---------------------------------------------------------------------------------------------------------------
// Box

export interface BoxWahl {
  platzId: string;
  kennung: string;
  typ: 'box_licht' | 'box_dunkel';
  platzzahl: number;
  hinweis?: string;
}

interface AnzuchtortVoll {
  platz_id: string;
  typ: 'box_licht' | 'box_dunkel';
  platzzahl?: number;
  position?: string | null;
  storniert_am: string | null;
}

/** Boxen der Anlage, vorne zuerst, dann nach Kennung */
export function boxenAus(teile: Teile, anlageId: string): BoxWahl[] {
  return plaetzeAus(teile, anlageId)
    .filter((p) => p.rolle === 'anzuchtort')
    .map((p) => ({ p, a: anzuchtortAm(teile, p.id) as AnzuchtortVoll | undefined }))
    .filter((x): x is { p: (typeof x)['p']; a: AnzuchtortVoll } => !!x.a)
    .sort(
      (x, y) =>
        Number(x.a.position === 'hinten') - Number(y.a.position === 'hinten') || nachKennung(x.p, y.p),
    )
    .map(({ p, a }) => ({
      platzId: p.id,
      kennung: p.kennung,
      typ: a.typ,
      platzzahl: Number(a.platzzahl ?? 25),
    }));
}

const KEIMART_NAME: Record<string, string> = { licht: 'Lichtkeimer', dunkel: 'Dunkelkeimer' };

/** Box nach Keimart (licht und indifferent → Lichtbox, dunkel → Dunkelbox); eine vorgewählte Box gilt mit Hinweis */
export function boxFuer(
  teile: Teile,
  anlageId: string,
  keimart: string | undefined,
  vorgewaehlt?: string,
): BoxWahl {
  const boxen = boxenAus(teile, anlageId);
  const keine: BoxWahl = {
    platzId: '',
    kennung: '',
    typ: 'box_licht',
    platzzahl: 0,
    hinweis: 'Keine Anzuchtbox erfasst',
  };
  const typ = keimart === 'dunkel' ? 'box_dunkel' : 'box_licht';
  const empfohlen = boxen.find((b) => b.typ === typ);
  const gewaehlt = vorgewaehlt ? boxen.find((b) => b.platzId === vorgewaehlt) : undefined;
  if (!gewaehlt) return empfohlen ?? boxen[0] ?? keine;
  const passt = keimart === undefined || keimart === 'indifferent' || gewaehlt.typ === typ;
  if (passt || !empfohlen) return gewaehlt;
  return { ...gewaehlt, hinweis: `${KEIMART_NAME[keimart] ?? keimart}: Box ${empfohlen.kennung} empfohlen` };
}

// ---------------------------------------------------------------------------------------------------------------
// Vorschlag

export interface SatzEingabe {
  sorteId: string;
  kulturform: string;
  boxPlatzId?: string;
  zieltopfIds: string[];
  /** «Ziel später»: gewünschte Pflanzenzahl (A7), Vorgabe 1 */
  pflanzenOhneZiel?: number;
  samenJeSchwamm?: number;
  schwaemme?: number;
  /** Original bei «Satz duplizieren» (satz.kopiert_von, Plan 25) */
  kopiertVon?: string;
}

export interface SaatEingabe {
  anlageId: string;
  einstieg: 'heute' | 'gefaess' | 'scan' | 'duplizieren';
  begonnenAm: Date;
  saatdatum: string;
  zielPlatzId?: string;
  saetze: SatzEingabe[];
}

export interface SatzVorschlag {
  sorteId: string;
  name: string;
  artId: string;
  kulturform: string;
  direktsaat: boolean;
  box?: BoxWahl;
  saatgutId?: string;
  keimrate?: Keimrate;
  empfehlung?: Empfehlung;
  zieltoepfe: number;
  vorschlag: { samenJeSchwamm: number; schwaemme: number; schwammKeimrate: number | undefined };
  samenJeSchwamm: number;
  schwaemme: number;
  keimart?: string;
  keimdauer: Spanne;
  keimtemp: Spanne;
  /** Vorgabe für umsetzen_vorgabe_am; Direktsaat der Saattag */
  umsetzenAm?: string;
}

/** jüngste nicht stornierte Packung der Sorte (A6) */
function packungVon(teile: Teile, sorteId: string): string | undefined {
  return zeilen<SaatgutZeile>(teile, 'saatgut')
    .filter((s) => s.sorte_id === sorteId && s.storniert_am === null)
    .sort((a, b) => (b.erfasst_am ?? b.kaufdatum ?? '').localeCompare(a.erfasst_am ?? a.kaufdatum ?? ''))
    .at(0)?.id;
}

/** Saatempfehlung: Ebene Sorte vor Art, je Kulturform */
function empfehlungFuer(
  teile: Teile,
  sorteId: string,
  artId: string,
  kulturform: string,
): Empfehlung | undefined {
  const alle = gueltig(zeilen<EmpfehlungZeile>(teile, 'saatempfehlung')).filter(
    (e) => e.kulturform === kulturform,
  );
  const e =
    alle.find((x) => x.ebene === 'sorte' && x.sorte_id === sorteId) ??
    alle.find((x) => x.ebene === 'art' && x.art_id === artId);
  return e
    ? {
        samenJeSchwamm: Number(e.samen_je_schwamm),
        obergrenzeSamen: Number(e.obergrenze_samen),
        pflanzenStehenLassen: Number(e.pflanzen_stehen_lassen),
      }
    : undefined;
}

const zielIstDirektsaat = (teile: Teile, e: SaatEingabe) =>
  !!e.zielPlatzId &&
  DIREKTSAAT_BETRIEBSARTEN.has(gefaessAm(teile, e.zielPlatzId)?.betriebsart ?? '') &&
  !gefaessAm(teile, e.zielPlatzId)?.feste_dosis;

function satzVorschlag(teile: Teile, e: SaatEingabe, s: SatzEingabe): SatzVorschlag | undefined {
  const sorte = sorteZeile(teile, s.sorteId);
  if (!sorte) return undefined;
  const wahl = sorteWahl(teile, sorte);
  const art = artZeile(teile, sorte.art_id);
  const direktsaat = zielIstDirektsaat(teile, e) && s.zieltopfIds.length > 0;
  const gefunden = direktsaat ? undefined : boxFuer(teile, e.anlageId, wahl.keimart, s.boxPlatzId);
  const box = gefunden?.platzId ? gefunden : undefined;
  const saatgutId = packungVon(teile, s.sorteId);
  // ohne Packung (oder ohne Zeile in v_keimrate) gilt der Standard der Art (R12.2, Prüfer Runde 1 Befund 1)
  const rate = keimrate(teile, saatgutId) ?? keimrateArt(art?.standard_keimfaehigkeit);
  const empfehlung = empfehlungFuer(teile, s.sorteId, sorte.art_id, s.kulturform);
  const zieltoepfe = s.zieltopfIds.length > 0 ? s.zieltopfIds.length : Math.max(1, s.pflanzenOhneZiel ?? 1);
  const vorschlag = saatmenge({
    p: rate?.p,
    zieltoepfe,
    ...(empfehlung ? { empfehlung } : {}),
    direktsaat,
    platzzahl: box?.platzzahl ?? 25,
  });
  const umsetzenAb = zahl(art?.umsetzen_ab_d);
  const umsetzenAm = direktsaat
    ? e.saatdatum
    : umsetzenAb === undefined
      ? undefined
      : tagPlus(e.saatdatum, umsetzenAb);
  return {
    sorteId: s.sorteId,
    name: sorte.name,
    artId: sorte.art_id,
    kulturform: s.kulturform,
    direktsaat,
    ...(box ? { box } : {}),
    ...(saatgutId ? { saatgutId } : {}),
    ...(rate ? { keimrate: rate } : {}),
    ...(empfehlung ? { empfehlung } : {}),
    zieltoepfe,
    vorschlag,
    samenJeSchwamm: s.samenJeSchwamm ?? vorschlag.samenJeSchwamm,
    schwaemme: direktsaat ? zieltoepfe : (s.schwaemme ?? vorschlag.schwaemme),
    ...(wahl.keimart ? { keimart: wahl.keimart } : {}),
    keimdauer: wahl.keimdauer,
    keimtemp: wahl.keimtemp,
    ...(umsetzenAm ? { umsetzenAm } : {}),
  };
}

const stationsgrenze = (teile: Teile) =>
  zeilen<{ stationsgrenze_ab?: string | null }>(teile, 'einstellung')[0]?.stationsgrenze_ab ?? '9999-12-31';

/** Vorschlag je Satz (R12), Stationsvorschau und Warnungen (R6.1) und Hinweise, alles ohne Sperre */
export function saatVorschlag(
  teile: Teile,
  eingabe: SaatEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): { saetze: SatzVorschlag[]; vorschau: ReturnType<typeof stationsVorschau>; hinweise: string[] } {
  const saetze = eingabe.saetze
    .map((s) => satzVorschlag(teile, eingabe, s))
    .filter((s): s is SatzVorschlag => !!s);
  const hinweise = new Set<string>();
  // R1.6, A15: Termine vor heute liegen auf heute
  if (eingabe.saatdatum < kalendertag(jetzt, zeitzone))
    hinweise.add('Nacherfassung: fällige Schritte vor heute erscheinen heute');
  for (const s of saetze) {
    if (!s.direktsaat && !s.umsetzenAm) hinweise.add(HINWEIS_OHNE_UMSETZEN);
    if (!s.keimrate) hinweise.add(`${s.name}: Keimrate unbekannt`);
    if (!s.empfehlung) hinweise.add(`${s.name}: Keine Saatempfehlung`);
    if (s.box?.hinweis) hinweise.add(s.box.hinweis);
    if (!s.direktsaat && s.keimdauer.typ === undefined && keimdauerTyp(teile, s.sorteId) === undefined)
      hinweise.add(`${s.name}: Keimdauer fehlt, keine Stationsvorschau`);
  }
  const geplant: GeplanterSatz[] = saetze.map((s) => ({
    sorte: s.name,
    artId: s.artId,
    saatdatum: eingabe.saatdatum,
    keimdauerTyp: s.keimdauer.typ ?? keimdauerTyp(teile, s.sorteId),
    umsetzenAm: s.umsetzenAm,
    schwaemme: s.schwaemme,
    zieltoepfe: s.direktsaat
      ? s.zieltoepfe
      : (eingabe.saetze.find((x) => x.sorteId === s.sorteId)?.zieltopfIds.length ?? 0),
    direktsaat: s.direktsaat,
  }));
  const vorschau = stationsVorschau(teile, eingabe.anlageId, geplant, {
    stationsgrenzeAb: stationsgrenze(teile),
  });
  for (const w of vorschau.warnungen) hinweise.delete(w.text);
  return { saetze, vorschau, hinweise: [...hinweise] };
}

// ---------------------------------------------------------------------------------------------------------------
// Prüfung

/** Verstösse gegen R1.2, R8.2, R6.1 und die Datumsgrenzen (A14); leer = gültig */
export function saatEingabePruefen(
  teile: Teile,
  eingabe: SaatEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): Verstoss[] {
  const v: Verstoss[] = [];
  const heute = kalendertag(jetzt, zeitzone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.saatdatum)) v.push({ feld: 'saatdatum', grund: 'Saatdatum fehlt' });
  else if (eingabe.saatdatum > heute) v.push({ feld: 'saatdatum', grund: 'Saatdatum liegt in der Zukunft' });
  else if (tageZwischen(eingabe.saatdatum, heute) > SAAT_RUECK_MAX)
    v.push({ feld: 'saatdatum', grund: `Saatdatum mehr als ${SAAT_RUECK_MAX} Tage zurück` });
  if (eingabe.saetze.length === 0) v.push({ feld: 'saetze', grund: 'Keine Sorte gewählt' });

  const direktsaat = zielIstDirektsaat(teile, eingabe);
  const ziel = eingabe.zielPlatzId
    ? zielgefaesse(teile, eingabe.anlageId).find((z) => z.platzId === eingabe.zielPlatzId)
    : undefined;
  if (eingabe.zielPlatzId && !ziel) v.push({ feld: 'ziel', grund: 'Zielgefäss nicht wählbar' });
  const verwendet = new Set<string>();

  for (const s of eingabe.saetze) {
    const sorte = sorteZeile(teile, s.sorteId);
    if (!sorte) {
      v.push({ feld: 'sorte', grund: 'Sorte unbekannt' });
      continue;
    }
    const art = artZeile(teile, sorte.art_id);
    const formen = kulturformen(
      {
        kulturformen_erlaubt: art?.kulturformen_erlaubt ?? [],
        kulturform_vorgabe: art?.kulturform_vorgabe ?? null,
      },
      sorte.kulturtyp,
    );
    if (!(formen.erlaubt as string[]).includes(s.kulturform))
      v.push({ feld: 'kulturform', grund: `${sorte.name}: Kulturform nicht erlaubt` });
    if (s.zieltopfIds.length === 0) {
      if (direktsaat) v.push({ feld: 'ziel', grund: `${sorte.name}: Direktsaat braucht Zieltöpfe` });
      if ((s.pflanzenOhneZiel ?? 1) < 1)
        v.push({ feld: 'pflanzen', grund: `${sorte.name}: Pflanzenzahl fehlt` });
    } else if (!direktsaat && zahl(art?.umsetzen_ab_d) === undefined) {
      v.push({ feld: 'ziel', grund: `${sorte.name}: ${HINWEIS_OHNE_UMSETZEN}` });
    }
    // Zieltöpfe am Umsetzdatum dieses Satzes (Plan 25, R11.2); ohne Umsetzdatum wie Plan 23
    const umsetzenAb = zahl(art?.umsetzen_ab_d);
    const umsetzenAm = direktsaat
      ? eingabe.saatdatum
      : umsetzenAb === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(eingabe.saatdatum)
        ? undefined
        : tagPlus(eingabe.saatdatum, umsetzenAb);
    const toepfe = ziel ? zieltoepfe(teile, ziel.platzId, new Map(), umsetzenAm, direktsaat) : [];
    for (const id of s.zieltopfIds) {
      const topf = toepfe.find((t) => t.netztopfId === id);
      if (!topf) v.push({ feld: 'ziel', grund: 'Zieltopf nicht im Zielgefäss' });
      else if (topf.zustand !== 'frei')
        v.push({ feld: 'ziel', grund: `Topf ${topf.kennung} ist ${topf.zustand}` });
      else if (!direktsaat && topf.groesseMm !== 80)
        v.push({ feld: 'ziel', grund: `Topf ${topf.kennung}: Anzucht braucht einen 8-cm-Zieltopf` });
      if (verwendet.has(id)) v.push({ feld: 'ziel', grund: 'Derselbe Zieltopf ist zweimal gewählt' });
      verwendet.add(id);
    }
    if (!direktsaat || s.zieltopfIds.length === 0) {
      const box = boxFuer(teile, eingabe.anlageId, undefined, s.boxPlatzId);
      if (!box.platzId || (s.boxPlatzId && box.platzId !== s.boxPlatzId))
        v.push({ feld: 'box', grund: `${sorte.name}: Anzuchtbox fehlt` });
    }
    if (s.samenJeSchwamm !== undefined && (!Number.isInteger(s.samenJeSchwamm) || s.samenJeSchwamm < 1))
      v.push({ feld: 'samen_je_schwamm', grund: `${sorte.name}: mindestens 1 Samen je Schwamm` });
    if (s.schwaemme !== undefined && (!Number.isInteger(s.schwaemme) || s.schwaemme < 1 || s.schwaemme > 100))
      v.push({ feld: 'anzahl_schwaemme', grund: `${sorte.name}: 1 bis 100 Schwämme` });
    if (s.schwaemme !== undefined && s.schwaemme < s.zieltopfIds.length)
      v.push({ feld: 'anzahl_schwaemme', grund: `${sorte.name}: weniger Schwämme als Zieltöpfe` });
  }
  return v;
}

// ---------------------------------------------------------------------------------------------------------------
// Vorgang

/** 12:00 in der Zeitzone an einem Kalendertag (gilt_ab einer Rückdatierung, A14) */
function mittag(tag: string, zeitzone: Zeitzone): Date {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  const utc = Date.UTC(j, m - 1, d, 12);
  return new Date(utc - versatz(new Date(utc), zeitzone));
}

const neu = (tabelle: Schritt['tabelle'], id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle,
  felder: { client_id: id, id, ...felder },
});

/**
 * Ein Vorgang in der Reihenfolge der Fremdschlüssel (04 4.1): pflanzvorgang, je Satz satz, pflanzung (m Zeilen),
 * reservierung (an den ersten Z Pflanzungen). id = client_id aus ids(). Bei Verstössen leer.
 */
export function saatVorgang(
  teile: Teile,
  eingabe: SaatEingabe,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  if (saatEingabePruefen(teile, eingabe, jetzt, zeitzone).length > 0) return [];
  const { saetze } = saatVorschlag(teile, eingabe, jetzt, zeitzone);
  if (saetze.length !== eingabe.saetze.length) return [];
  const heute = kalendertag(jetzt, zeitzone);
  const nacherfassung = eingabe.saatdatum < heute;
  const giltAb = (nacherfassung ? mittag(eingabe.saatdatum, zeitzone) : jetzt).toISOString();

  const pflanzvorgangId = ids();
  const schritte: Schritt[] = [
    neu('pflanzvorgang', pflanzvorgangId, {
      begonnen_am: eingabe.begonnenAm.toISOString(),
      gespeichert_am: jetzt.toISOString(),
      einstieg: nacherfassung ? 'nacherfassung' : eingabe.einstieg,
      anzahl_pflanzungen: saetze.reduce((a, s) => a + s.schwaemme, 0),
    }),
  ];
  saetze.forEach((s, i) => {
    const e = eingabe.saetze[i] as SatzEingabe;
    const satzId = ids();
    schritte.push(
      neu('satz', satzId, {
        sorte_id: s.sorteId,
        saatgut_id: s.saatgutId ?? null,
        kulturform: s.kulturform,
        anzuchtort_platz_id: s.direktsaat ? null : (s.box?.platzId ?? null),
        direktsaat_platz_id: s.direktsaat ? (eingabe.zielPlatzId ?? null) : null,
        kopiert_von: e.kopiertVon ?? null,
        anzahl_schwaemme: s.schwaemme,
        samen_je_schwamm: s.samenJeSchwamm,
        schwaemme_vorschlag: s.vorschlag.schwaemme,
        samen_vorschlag: s.vorschlag.samenJeSchwamm,
        saatdatum: eingabe.saatdatum,
        gilt_ab: giltAb,
      }),
    );
    const pflanzungen = Array.from({ length: s.schwaemme }, () => ids());
    for (const id of pflanzungen)
      schritte.push(
        neu('pflanzung', id, { satz_id: satzId, pflanzvorgang_id: pflanzvorgangId, gilt_ab: giltAb }),
      );
    e.zieltopfIds.forEach((topf, k) => {
      schritte.push(
        neu('reservierung', ids(), {
          pflanzung_id: pflanzungen[k],
          netztopf_id: topf,
          umsetzen_vorgabe_am: s.umsetzenAm,
          umsetzen_geplant_am: s.umsetzenAm,
          gilt_ab: giltAb,
        }),
      );
    });
  });
  return schritte;
}

/** Rückgängig (U4): Storno aller Zeilen in umgekehrter Reihenfolge, Grund rueckgaengig */
export function saatRueckgaengig(vorgang: Vorgang): Vorgang {
  return [...vorgang]
    .reverse()
    .filter((s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu')
    .map((s) => ({ art: 'storno', tabelle: s.tabelle, clientId: s.felder.client_id, grund: 'rueckgaengig' }));
}
