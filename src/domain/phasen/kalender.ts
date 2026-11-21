// Erntekalender (UC15, Plan 232; Konzept v1.8 6.1, Entscheid 0026): je aktivem Satz Phasenabschnitte über acht Wochen
// ab Montag der laufenden Woche, Erntefenster, Kennzeichen und Sortierung. Rein: `jetzt` und Zeitzone als Parameter,
// Kalendertage in Zürich (G1, G2). Keine eigene Terminrechnung: das Modul setzt nur zusammen aus phasenStand(),
// phaseAm(), ernteStand(), voraussichtlichesEnde() und ersteErnteAb() (R1.5, R1.7, R11.1; Plan 254).
import { zeilen, type Teile } from '../anlage/teile.ts';
import { ersteErnteAb, umsetzTag, voraussichtlichesEnde, type Ernteart } from '../pflanzung/belegung.ts';
import { KULTURFORM_NAME } from '../pflanzung/saeen.ts';
import { kalendertag, tagKurz, tagPlus, type Zeitzone } from '../zeit.ts';
import { ernteStand, ortVon } from './ernte.ts';
import { phasenStand, pflanzungVonSatz } from './fragen.ts';
import { PHASE_NAME, type Phase } from './profil.ts';
import { phaseAm } from './prognose.ts';

/** Länge des Fensters in Kalendertagen (8 Wochen) */
export const FENSTER_TAGE = 56;

export type PhasenBuchstabe = 'K' | 'A' | 'W' | 'B' | 'F';
export const PHASE_BUCHSTABE: Readonly<Record<Phase, PhasenBuchstabe>> = {
  keimung: 'K',
  anzucht: 'A',
  wachstum: 'W',
  bluete: 'B',
  fruchtbildung_reife: 'F',
};

export type KalenderKennzeichen = 'Phase unbestätigt' | 'Termine noch offen';

export interface KalenderFenster {
  /** Montag der laufenden Woche in der Zeitzone */
  von: string;
  /** von + 55 */
  bis: string;
  heute: string;
  /** 8 Montage ab `von` */
  wochen: string[];
}

export interface PhasenAbschnitt {
  phase: Phase;
  buchstabe: PhasenBuchstabe;
  von: string;
  bis: string;
  art: 'bestaetigt' | 'prognose';
}

export type ErnteTerminArt = 'ernte_ab' | 'schnitt' | 'ende';
export interface ErnteTermin {
  art: ErnteTerminArt;
  tag: string;
}

export interface Erntefenster {
  ernteart?: Ernteart;
  /**
   * erste Ernte: ernteStand().moeglichAb ohne Teilernte; vor dem Umsetzen einmalig voraussichtlichesEnde().endeAm,
   * mehrfach ersteErnteAb() (Plan 254)
   */
  ernteAb?: string;
  /** nur mehrfach nach mindestens einer Teilernte: ernteStand().moeglichAb (letzte Teilernte + Intervall) */
  naechsterSchnitt?: string;
  teilernten: number;
  /** voraussichtlichesEnde().endeAm */
  endeAm?: string;
}

export interface NaechstesEreignis {
  art: 'wechsel' | ErnteTerminArt;
  tag: string;
  /** bei art = wechsel: Phase, in die gewechselt wird */
  phase?: Phase;
  unbestaetigt: boolean;
}

export interface KalenderZeile {
  satzId: string;
  /** Ziel von «Pflanze öffnen» (pflanzungVonSatz) */
  pflanzungId: string;
  sorte: string;
  art: string;
  kulturform: string;
  kulturformName: string;
  ort: string;
  saatdatum: string;
  tagSeitSaat: number;
  phase: Phase;
  phasenText: string;
  letztePhase: boolean;
  naechsterWechsel?: { phase: Phase; fruehestens?: string; typisch?: string; spaetestens?: string };
  abschnitte: PhasenAbschnitt[];
  ernte: Erntefenster;
  marken: ErnteTermin[];
  spaeter?: ErnteTermin;
  naechstes?: NaechstesEreignis;
  kennzeichen: KalenderKennzeichen[];
  kurz: string;
}

export interface Erntekalender {
  fenster: KalenderFenster;
  zeilen: KalenderZeile[];
}

interface Satz {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  storniert_am?: string | null;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
}
interface Reservierung {
  pflanzung_id: string;
  umsetzen_geplant_am: string | null;
  umsetzen_vorgabe_am: string;
}

const TERMIN_FOLGE: Readonly<Record<NaechstesEreignis['art'], number>> = {
  wechsel: 0,
  ernte_ab: 1,
  schnitt: 2,
  ende: 3,
};

/** Fenster: Montag der laufenden Woche (Kalendertag in der Zeitzone) bis 55 Tage danach */
export function kalenderFenster(jetzt: Date, zeitzone: Zeitzone): KalenderFenster {
  const heute = kalendertag(jetzt, zeitzone);
  const [j, m, d] = heute.split('-').map(Number) as [number, number, number];
  const wochentag = new Date(Date.UTC(j, m - 1, d)).getUTCDay();
  const von = tagPlus(heute, -((wochentag + 6) % 7));
  return {
    von,
    bis: tagPlus(von, FENSTER_TAGE - 1),
    heute,
    wochen: Array.from({ length: FENSTER_TAGE / 7 }, (_, i) => tagPlus(von, i * 7)),
  };
}

/** Phasenabschnitte im Fenster ab dem Saattag (A2): je Tag phaseAm(), gleiche Phase und Art zusammengefasst */
function abschnitteVon(
  teile: Teile,
  satz: Satz,
  bestaetigtePhase: Phase,
  fenster: KalenderFenster,
  jetzt: Date,
  zeitzone: Zeitzone,
): PhasenAbschnitt[] {
  const bezug = {
    satzId: satz.id,
    sorteId: satz.sorte_id,
    kulturform: satz.kulturform,
    saatdatum: satz.saatdatum,
    direktsaat: satz.direktsaat_platz_id !== null,
  };
  const abschnitte: PhasenAbschnitt[] = [];
  const start = satz.saatdatum > fenster.von ? satz.saatdatum : fenster.von;
  for (let tag = start; tag <= fenster.bis; tag = tagPlus(tag, 1)) {
    const phase = phaseAm(teile, bezug, tag, jetzt, zeitzone);
    // bestätigt: Tag vor heute in der bestätigten Phase (Keimung ab Saat zählt als bestätigt, A3)
    const art: PhasenAbschnitt['art'] =
      tag < fenster.heute && phase === bestaetigtePhase ? 'bestaetigt' : 'prognose';
    const letzter = abschnitte.at(-1);
    if (letzter && letzter.phase === phase && letzter.art === art && tagPlus(letzter.bis, 1) === tag)
      letzter.bis = tag;
    else abschnitte.push({ phase, buchstabe: PHASE_BUCHSTABE[phase], von: tag, bis: tag, art });
  }
  return abschnitte;
}

/** Erntefenster aus ernteStand() und voraussichtlichesEnde() der massgebenden Pflanzung (A4, A5) */
function erntefensterVon(
  teile: Teile,
  aktive: readonly Zustand[],
  jetzt: Date,
  zeitzone: Zeitzone,
): Erntefenster {
  const staende = aktive.map((z) => ({ z, s: ernteStand(teile, z.pflanzung_id, jetzt, zeitzone) }));
  // wie ernteAufgaben(): früheste «Ernte möglich», sonst die erste nach id
  const mitTermin = staende
    .filter((x) => x.s?.moeglichAb !== undefined)
    .sort(
      (a, b) =>
        (a.s?.moeglichAb ?? '').localeCompare(b.s?.moeglichAb ?? '') ||
        a.z.pflanzung_id.localeCompare(b.z.pflanzung_id),
    );
  const wahl = mitTermin[0] ?? staende[0];
  if (!wahl) return { teilernten: 0 };
  const stand = wahl.s;
  const pflanzungId = wahl.z.pflanzung_id;
  // Bezug wie topfPrognose(): Umsetztag, sonst geplanter bzw. vorgegebener Umsetztag der Reservierung
  const reservierung = zeilen<Reservierung>(teile, 'v_reservierung_aktiv').find(
    (r) => r.pflanzung_id === pflanzungId,
  );
  const bezug =
    umsetzTag(teile, pflanzungId, zeitzone) ??
    reservierung?.umsetzen_geplant_am ??
    reservierung?.umsetzen_vorgabe_am ??
    undefined;
  const ende = voraussichtlichesEnde(teile, pflanzungId, bezug);
  const ernteart = stand?.ernteart ?? ende.ernteart;
  const teilernten = stand?.teilernten ?? 0;
  const fenster: Erntefenster = { teilernten, ...(ernteart ? { ernteart } : {}) };
  if (ernteart === 'einmalig') {
    const ab = stand?.moeglichAb ?? ende.endeAm;
    if (ab) fenster.ernteAb = ab;
  } else if (ernteart === 'mehrfach') {
    if (stand?.moeglichAb)
      if (teilernten > 0) fenster.naechsterSchnitt = stand.moeglichAb;
      else fenster.ernteAb = stand.moeglichAb;
    else if (teilernten === 0) {
      // vor dem Umsetzen: erste Ernte als Prognose aus der Domänenfunktion (Issue #254, Plan 254)
      const ab = ersteErnteAb(teile, pflanzungId, bezug, jetzt, zeitzone);
      if (ab) fenster.ernteAb = ab;
    }
  }
  if (ende.endeAm) fenster.endeAm = ende.endeAm;
  return fenster;
}

/** Erntetermine in fester Folge (einmalig: Ende = Ernte, daher nur «ernte_ab») */
function erntetermine(e: Erntefenster): ErnteTermin[] {
  const t: ErnteTermin[] = [];
  if (e.ernteAb) t.push({ art: 'ernte_ab', tag: e.ernteAb });
  if (e.naechsterSchnitt) t.push({ art: 'schnitt', tag: e.naechsterSchnitt });
  if (e.endeAm && e.ernteart !== 'einmalig') t.push({ art: 'ende', tag: e.endeAm });
  return t.sort((a, b) => a.tag.localeCompare(b.tag) || TERMIN_FOLGE[a.art] - TERMIN_FOLGE[b.art]);
}

function kurzText(
  naechsterWechsel: KalenderZeile['naechsterWechsel'],
  unbestaetigt: boolean,
  ernte: Erntefenster,
  heute: string,
  offen: boolean,
): string {
  if (offen) return 'Ernte und Ende ohne Termin';
  const teile: string[] = [];
  const typisch = naechsterWechsel?.typisch;
  if (naechsterWechsel && typisch) {
    const name = PHASE_NAME[naechsterWechsel.phase];
    teile.push(
      unbestaetigt
        ? `${name} fällig seit ${tagKurz(typisch)}`
        : typisch === heute
          ? `${name} ab heute`
          : `${name} ab ${tagKurz(typisch)}`,
    );
  }
  if (ernte.naechsterSchnitt)
    teile.push(
      ernte.naechsterSchnitt < heute
        ? `nächster Schnitt möglich seit ${tagKurz(ernte.naechsterSchnitt)}`
        : `nächster Schnitt ab ${tagKurz(ernte.naechsterSchnitt)}`,
    );
  else if (ernte.ernteAb)
    teile.push(
      ernte.ernteAb < heute
        ? `Ernte möglich seit ${tagKurz(ernte.ernteAb)}`
        : `Ernte ab ${tagKurz(ernte.ernteAb)}`,
    );
  else teile.push('Ernte offen');
  return teile.join(' · ');
}

function zeileVon(
  teile: Teile,
  satz: Satz,
  fenster: KalenderFenster,
  jetzt: Date,
  zeitzone: Zeitzone,
): KalenderZeile | undefined {
  const pflanzungId = pflanzungVonSatz(teile, satz.id);
  if (pflanzungId === undefined) return undefined;
  const stand = phasenStand(teile, satz.id, jetzt, zeitzone);
  if (!stand) return undefined;
  const aktive = zeilen<Zustand>(teile, 'v_pflanzung_zustand')
    .filter((z) => z.satz_id === satz.id && z.status === 'aktiv')
    .sort((a, b) => a.pflanzung_id.localeCompare(b.pflanzung_id));
  const sorteZeile = zeilen<{ sorte_id: string; art_id: string; name: string; gueltig_bis?: string | null }>(
    teile,
    'sorte',
  ).find((s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null);
  const artName =
    zeilen<{ art_id: string; name_de?: string; gueltig_bis?: string | null }>(teile, 'art').find(
      (a) => a.art_id === sorteZeile?.art_id && (a.gueltig_bis ?? null) === null,
    )?.name_de ?? '';

  const heute = fenster.heute;
  const ernte = erntefensterVon(teile, aktive, jetzt, zeitzone);
  const termine = erntetermine(ernte);
  const marken = termine.filter((t) => t.tag >= fenster.von && t.tag <= fenster.bis);
  const spaeter = termine.find((t) => t.tag > fenster.bis);

  const typisch = stand.naechste?.typisch;
  const unbestaetigt = typisch !== undefined && typisch < heute;
  const offen = typisch === undefined && termine.length === 0;
  const kennzeichen: KalenderKennzeichen[] = [
    ...(unbestaetigt ? (['Phase unbestätigt'] as const) : []),
    ...(offen ? (['Termine noch offen'] as const) : []),
  ];

  const kandidaten: NaechstesEreignis[] = [
    ...(stand.naechste && typisch
      ? [{ art: 'wechsel' as const, tag: typisch, phase: stand.naechste.phase, unbestaetigt }]
      : []),
    ...termine.map((t) => ({ art: t.art, tag: t.tag, unbestaetigt: false })),
  ];
  const naechstes = unbestaetigt
    ? kandidaten[0]
    : kandidaten.sort((a, b) => a.tag.localeCompare(b.tag) || TERMIN_FOLGE[a.art] - TERMIN_FOLGE[b.art])[0];

  return {
    satzId: satz.id,
    pflanzungId,
    sorte: sorteZeile?.name ?? 'Sorte',
    art: artName,
    kulturform: satz.kulturform,
    kulturformName: KULTURFORM_NAME[satz.kulturform] ?? satz.kulturform,
    ort: ortVon(teile, satz, aktive),
    saatdatum: satz.saatdatum,
    tagSeitSaat: stand.tagSeitSaat,
    phase: stand.phase,
    phasenText: stand.text,
    letztePhase: stand.naechste === undefined,
    ...(stand.naechste ? { naechsterWechsel: stand.naechste } : {}),
    abschnitte: abschnitteVon(teile, satz, stand.phase, fenster, jetzt, zeitzone),
    ernte,
    marken,
    ...(spaeter ? { spaeter } : {}),
    ...(naechstes ? { naechstes } : {}),
    kennzeichen,
    kurz: kurzText(stand.naechste, unbestaetigt, ernte, heute, offen),
  };
}

const gruppe = (z: KalenderZeile) => (z.naechstes === undefined ? 2 : z.naechstes.unbestaetigt ? 0 : 1);

/** Kalender aller aktiven Sätze, sortiert: unbestätigte Wechsel, dann nach Datum, ohne Termin zuletzt (AK5) */
export function erntekalender(teile: Teile, jetzt: Date, zeitzone: Zeitzone): Erntekalender {
  const fenster = kalenderFenster(jetzt, zeitzone);
  const liste = zeilen<Satz>(teile, 'satz')
    .filter((s) => (s.storniert_am ?? null) === null)
    .map((s) => zeileVon(teile, s, fenster, jetzt, zeitzone))
    .filter((z): z is KalenderZeile => z !== undefined)
    .sort(
      (a, b) =>
        gruppe(a) - gruppe(b) ||
        (a.naechstes?.tag ?? '').localeCompare(b.naechstes?.tag ?? '') ||
        a.ort.localeCompare(b.ort, 'de', { numeric: true }) ||
        a.sorte.localeCompare(b.sorte, 'de') ||
        a.satzId.localeCompare(b.satzId),
    );
  return { fenster, zeilen: liste };
}
