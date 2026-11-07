// Passungs-Empfehlung (Konzept R3.1 bis R3.3, 8.1 Regel 8; Plan 36): Entscheidungstabelle R3.2 als reine Funktion auf
// einem fertigen Kontext. Werte in Hundertsteln (pH 6.0 = 600, EC 1.2 = 120, 22 °C = 2200), Höhen in mm, Licht in h.
// Eine Zeile ohne nötigen Stammwert ist nicht prüfbar (A2): sie steht in nichtGeprueft und wertet weder ab noch auf.
import type { Betriebsart } from '../anlage/anlegen.ts';
import type { Band } from '../bewertung/bewertung.ts';
import { dezimal } from '../phasen/sollbereich.ts';
import type { Kulturform, Phase } from '../phasen/profil.ts';
import {
  bandmitte,
  bandSchnitt,
  istLeer,
  MINDESTBREITE_PH,
  mindestbreiteEc,
  restbreite,
} from '../zielbereich-passung.ts';

export type GrundCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9' | 'P10' | 'P11';
export type Einstufung = 'empfohlen' | 'moeglich' | 'nicht_empfohlen';
type Pythium = 'hoch' | 'mittel' | 'gering';

/** Bezug auf die Leitkultur des Gefässes (R2.3); Name weicht vom Typ Leitkultur in zielbereich-leitkultur.ts ab */
export interface LeitkulturBezug {
  artId: string;
  name: string;
  kulturgruppeId: string;
  kulturdauerTypischD?: number;
  wuchshoeheMm?: number;
  ec?: Band;
}

export interface PassungKontext {
  kandidat: {
    sorteId: string;
    name: string;
    artId: string;
    kulturgruppeId: string;
    kulturform: Kulturform;
    /** Phase, deren Sollbereich gilt */
    phase: Phase;
    systemeignung?: 'dwc' | 'kratky' | 'beide';
    ph?: Band;
    ec?: Band;
    temp?: Band;
    lichtMaxH?: number;
    photoperiode?: 'langtag' | 'kurztag' | 'tagneutral';
    kritischeTageslaengeH?: number;
    kulturdauerTypischD?: number;
    entspitzen: boolean;
    wuchshoeheMm?: number;
    wuchsform?: 'aufrecht' | 'buschig' | 'haengend' | 'rosette';
    pythium?: Pythium;
    wasserbedarfL?: number;
  };
  gefaess: {
    platzId: string;
    kennung: string;
    betriebsart: Betriebsart;
    lochGroesseMm: 50 | 80;
    betriebsvolumenL: number;
    lochzahl: number;
    freieLoecher: number[];
    randloecher: number[];
    bereich: { name: string; lichtstundenH?: number; nutzbareHoeheMm?: number };
    wassertempMax7d?: number;
  };
  /** aus der Schnittmenge ok oder leer; ohne_band: alle Bänder fehlen */
  zielbereich: { ph?: Band; ec?: Band; temp?: Band; zaehlende: number };
  leitkultur?: LeitkulturBezug;
  /** je Art einmal, ohne den Kandidaten */
  mitbewohnerArten: { artId: string; pythium?: Pythium }[];
  uEc: number;
}

export interface Passung {
  einstufung: Einstufung;
  /** höchstens zwei, in Tabellenreihenfolge */
  gruende: GrundCode[];
  texte: string[];
  hinweise: string[];
  nichtGeprueft: GrundCode[];
  restbreiteEc: number;
  abstandMitten: number;
}

export const EINSTUFUNG_NAME: Readonly<Record<Einstufung, string>> = {
  empfohlen: 'Empfohlen',
  moeglich: 'Möglich',
  nicht_empfohlen: 'Nicht empfohlen',
};

const HINWEIS_HAENGEND = 'Hängend: an die gangseitige Längskante setzen';
const HINWEIS_LITER_DWC = 'Wenig Liter je Pflanze: Wasserstand öfter prüfen';
/** P10: Mittenabstand über 0.2 bei anderer Kulturgruppe */
const MITTENABSTAND_MAX = 20;
/** P5: Wuchshöhe + 10 cm Reserve */
const HOEHE_RESERVE_MM = 100;
/** P4: kurze Kulturen bis 40 Tage sind von der Lichtzeile ausgenommen */
const KURZE_KULTUR_D = 40;

const band = (b: Band) => `${dezimal(b.min)} bis ${dezimal(b.max)}`;
const grad = (h: number) => String(h / 100);

/** trifft: true, trifft nicht: false, nicht prüfbar: undefined */
type Pruefung = (k: PassungKontext) => boolean | undefined;
interface Tabellenzeile {
  code: GrundCode;
  stufe: Exclude<Einstufung, 'empfohlen'>;
  trifft: Pruefung;
  text: (k: PassungKontext) => string;
}

/** 8.1 Regel 8: dwc → DWC und Konstantpegel, kratky → beide Kratky, beide → alle */
function eignungDeckt(eignung: 'dwc' | 'kratky' | 'beide', betriebsart: Betriebsart): boolean {
  if (eignung === 'beide') return true;
  const kratky = betriebsart === 'kratky' || betriebsart === 'kratky_belueftet';
  return eignung === 'kratky' ? kratky : !kratky;
}

/** P2 je Grösse: Schnittmenge Kandidat ∩ Zielbereich schmaler als die Mindestbreite, leer eingeschlossen */
function zuSchmal(k: PassungKontext): { ph?: Band; ec?: Band } | undefined {
  const ph = bandSchnitt(k.kandidat.ph, k.zielbereich.ph);
  const ec = bandSchnitt(k.kandidat.ec, k.zielbereich.ec);
  if (!ph && !ec) return undefined;
  return {
    ...(ph && restbreite(ph) < MINDESTBREITE_PH ? { ph } : {}),
    ...(ec && restbreite(ec) < mindestbreiteEc(k.uEc) ? { ec } : {}),
  };
}

function p2Text(k: PassungKontext): string {
  const s = zuSchmal(k) ?? {};
  if (s.ph)
    return istLeer(s.ph)
      ? `pH: keine Schnittmenge mit ${band(k.zielbereich.ph as Band)}`
      : `pH bleibt ${band(s.ph)}, schmaler als ${dezimal(MINDESTBREITE_PH)}`;
  const ec = s.ec as Band;
  return istLeer(ec)
    ? `EC: keine Schnittmenge mit ${band(k.zielbereich.ec as Band)}`
    : `EC bleibt ${band(ec)}, schmaler als ${dezimal(mindestbreiteEc(k.uEc))}`;
}

const babyleafOderKurz = (k: PassungKontext) =>
  k.kandidat.kulturform === 'babyleaf' ||
  (k.kandidat.kulturdauerTypischD !== undefined && k.kandidat.kulturdauerTypischD <= KURZE_KULTUR_D);

function p4(k: PassungKontext): boolean | undefined {
  if (babyleafOderKurz(k)) return false;
  const licht = k.gefaess.bereich.lichtstundenH;
  const { lichtMaxH, photoperiode, kritischeTageslaengeH } = k.kandidat;
  const mitPhotoperiode = photoperiode !== undefined && kritischeTageslaengeH !== undefined;
  if (licht === undefined || (lichtMaxH === undefined && !mitPhotoperiode)) return undefined;
  return (
    (lichtMaxH !== undefined && licht > lichtMaxH) ||
    (photoperiode === 'langtag' && kritischeTageslaengeH !== undefined && kritischeTageslaengeH < licht)
  );
}

function p5(k: PassungKontext): boolean | undefined {
  const { kulturform, entspitzen, wuchsform, wuchshoeheMm } = k.kandidat;
  if (
    kulturform === 'babyleaf' ||
    kulturform === 'schnitt' ||
    (kulturform === 'dauerkultur_blatt' && entspitzen) ||
    wuchsform === 'haengend'
  )
    return false;
  const hoehe = k.gefaess.bereich.nutzbareHoeheMm;
  if (wuchshoeheMm === undefined || hoehe === undefined) return undefined;
  return wuchshoeheMm + HOEHE_RESERVE_MM > hoehe;
}

function p6(k: PassungKontext): boolean | undefined {
  const temp = k.kandidat.temp;
  if (!temp) return undefined;
  const w = k.gefaess.wassertempMax7d;
  const schnitt = bandSchnitt(k.zielbereich.temp, temp);
  return (w !== undefined && w > temp.max) || (schnitt !== undefined && istLeer(schnitt));
}

function p6Text(k: PassungKontext): string {
  const w = k.gefaess.wassertempMax7d;
  const temp = k.kandidat.temp as Band;
  return w !== undefined && w > temp.max
    ? `Wasser zu warm (${grad(w)} °C)`
    : `Wassertemperatur: keine Schnittmenge mit ${grad((k.zielbereich.temp as Band).min)} bis ${grad((k.zielbereich.temp as Band).max)} °C`;
}

function p8(k: PassungKontext): boolean | undefined {
  const eigen = k.kandidat.kulturdauerTypischD;
  const leit = k.leitkultur?.kulturdauerTypischD;
  return eigen === undefined || leit === undefined ? undefined : eigen > leit;
}

function p9(k: PassungKontext): boolean | undefined {
  const eigen = k.kandidat.wuchshoeheMm;
  const leit = k.leitkultur?.wuchshoeheMm;
  if (eigen === undefined || leit === undefined) return undefined;
  const randFrei = k.gefaess.freieLoecher.some((l) => k.gefaess.randloecher.includes(l));
  return eigen * 3 < leit && !randFrei;
}

function p10(k: PassungKontext): boolean | undefined {
  const eigen = k.kandidat.ec;
  const leit = k.leitkultur?.ec;
  if (!eigen || !leit || !k.leitkultur) return undefined;
  const mitte = bandmitte(leit);
  const enthaelt = eigen.min <= mitte && mitte <= eigen.max;
  const andereGruppe = k.kandidat.kulturgruppeId !== k.leitkultur.kulturgruppeId;
  return !enthaelt || (andereGruppe && Math.abs(bandmitte(eigen) - mitte) > MITTENABSTAND_MAX);
}

const literJePflanze = (k: PassungKontext) => k.gefaess.betriebsvolumenL / k.gefaess.lochzahl;

function p11(k: PassungKontext): boolean | undefined {
  if (k.gefaess.betriebsart !== 'kratky_belueftet') return false;
  const bedarf = k.kandidat.wasserbedarfL;
  // ohne Deckel keine Lochzahl: nicht prüfbar (A2; Sicherheit Runde 1 Befund 4)
  return bedarf === undefined || k.gefaess.lochzahl === 0 ? undefined : literJePflanze(k) < bedarf;
}

/** Tabelle R3.2 in Prüfreihenfolge; P1 bis P6 Nicht empfohlen, P7 bis P11 Möglich */
const ZEILEN: readonly Tabellenzeile[] = [
  {
    code: 'P1',
    stufe: 'nicht_empfohlen',
    trifft: (k) =>
      k.kandidat.systemeignung === undefined
        ? undefined
        : !eignungDeckt(k.kandidat.systemeignung, k.gefaess.betriebsart),
    text: (k) => (k.kandidat.systemeignung === 'dwc' ? 'nicht für Kratky' : 'nicht für DWC'),
  },
  {
    code: 'P2',
    stufe: 'nicht_empfohlen',
    trifft: (k) => {
      const s = zuSchmal(k);
      return s === undefined ? undefined : s.ph !== undefined || s.ec !== undefined;
    },
    text: p2Text,
  },
  {
    code: 'P3',
    stufe: 'nicht_empfohlen',
    trifft: (k) => k.gefaess.freieLoecher.length === 0,
    text: (k) => `kein freies ${String(k.gefaess.lochGroesseMm / 10)}-cm-Loch`,
  },
  {
    code: 'P4',
    stufe: 'nicht_empfohlen',
    trifft: p4,
    text: (k) => `Schossgefahr bei ${String(k.gefaess.bereich.lichtstundenH)} h Licht`,
  },
  {
    code: 'P5',
    stufe: 'nicht_empfohlen',
    trifft: p5,
    text: (k) =>
      `zu hoch für ${k.gefaess.bereich.name} (${String((k.gefaess.bereich.nutzbareHoeheMm as number) / 10)} cm)`,
  },
  { code: 'P6', stufe: 'nicht_empfohlen', trifft: p6, text: p6Text },
  {
    code: 'P7',
    stufe: 'moeglich',
    trifft: (k) =>
      k.kandidat.pythium === undefined
        ? undefined
        : k.kandidat.pythium === 'hoch' &&
          k.mitbewohnerArten.some((a) => a.artId !== k.kandidat.artId && a.pythium === 'hoch'),
    text: () => 'beide pythiumanfällig',
  },
  { code: 'P8', stufe: 'moeglich', trifft: p8, text: () => 'bleibt länger als die Leitkultur' },
  { code: 'P9', stufe: 'moeglich', trifft: p9, text: () => 'wird beschattet' },
  {
    code: 'P10',
    stufe: 'moeglich',
    trifft: p10,
    text: (k) =>
      `EC-Mitte ${dezimal(bandmitte(k.kandidat.ec as Band))} gegen ${dezimal(bandmitte(k.leitkultur?.ec as Band))}`,
  },
  { code: 'P11', stufe: 'moeglich', trifft: p11, text: () => 'zu wenig Liter je Pflanze' },
];

/** im leeren Gefäss gelten nur P1 und P3 bis P6 (R3.2; P2 entfällt ohne Zielbereich, A3) */
const IM_LEEREN: ReadonlySet<GrundCode> = new Set(['P1', 'P3', 'P4', 'P5', 'P6']);

function passtText(k: PassungKontext): string {
  const ph = bandSchnitt(k.kandidat.ph, k.zielbereich.ph) ?? k.kandidat.ph;
  const ec = bandSchnitt(k.kandidat.ec, k.zielbereich.ec) ?? k.kandidat.ec;
  const teile = [...(ph ? [`pH ${band(ph)}`] : []), ...(ec ? [`EC ${band(ec)}`] : [])];
  return teile.length > 0 ? `passt: ${teile.join(', ')}` : 'passt';
}

export function passung(k: PassungKontext): Passung {
  const leer = k.zielbereich.zaehlende === 0;
  const zeilen = ZEILEN.filter((z) => !leer || IM_LEEREN.has(z.code));
  const ergebnis = zeilen.map((z) => ({ z, trifft: z.trifft(k) }));
  const nichtGeprueft = ergebnis.filter((e) => e.trifft === undefined).map((e) => e.z.code);
  const treffer = ergebnis.filter((e) => e.trifft === true).map((e) => e.z);
  const stufe: Einstufung = treffer[0]?.stufe ?? 'empfohlen';
  const gruende = treffer.filter((z) => z.stufe === stufe).slice(0, 2);
  const ecSchnitt = bandSchnitt(k.kandidat.ec, k.zielbereich.ec) ?? k.kandidat.ec;
  const bezug = k.leitkultur?.ec ?? k.zielbereich.ec;
  const hinweise = [
    ...(k.kandidat.wuchsform === 'haengend' ? [HINWEIS_HAENGEND] : []),
    ...(k.gefaess.betriebsart !== 'kratky_belueftet' &&
    k.kandidat.wasserbedarfL !== undefined &&
    k.gefaess.lochzahl > 0 &&
    literJePflanze(k) < k.kandidat.wasserbedarfL
      ? [HINWEIS_LITER_DWC]
      : []),
  ];
  return {
    einstufung: stufe,
    gruende: gruende.map((z) => z.code),
    texte: stufe === 'empfohlen' ? [passtText(k)] : gruende.map((z) => z.text(k)),
    hinweise,
    nichtGeprueft,
    restbreiteEc: ecSchnitt ? restbreite(ecSchnitt) : 0,
    abstandMitten: k.kandidat.ec && bezug ? Math.abs(bandmitte(k.kandidat.ec) - bandmitte(bezug)) : 0,
  };
}

/** «Nicht empfohlen · nicht für Kratky · kein freies 8-cm-Loch» */
export function passungText(p: Passung): string {
  return [EINSTUFUNG_NAME[p.einstufung], ...p.texte].join(' · ');
}

const STUFE_RANG: Readonly<Record<Einstufung, number>> = { empfohlen: 0, moeglich: 1, nicht_empfohlen: 2 };

/** je Stufe Restbreite EC absteigend, Mittenabstand aufsteigend, Name; Rang 1-basiert über alle Stufen */
export function sortiert<T extends { passung: Passung; name: string }>(
  l: readonly T[],
): (T & { rang: number })[] {
  return [...l]
    .sort(
      (a, b) =>
        STUFE_RANG[a.passung.einstufung] - STUFE_RANG[b.passung.einstufung] ||
        b.passung.restbreiteEc - a.passung.restbreiteEc ||
        a.passung.abstandMitten - b.passung.abstandMitten ||
        a.name.localeCompare(b.name, 'de'),
    )
    .map((x, i) => ({ ...x, rang: i + 1 }));
}
