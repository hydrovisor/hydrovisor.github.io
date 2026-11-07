// Kontext der Passungs-Empfehlung aus den Teilen des Bündels (Konzept R2.2 Zweck Passung, R2.3, R3.1 bis R3.3; Plan 36).
// Rein: `jetzt` und Zeitzone als Parameter, Kalendertage in Zürich (G2). Gerechnet wird am Umsetzdatum (UC5-AK11):
// Sollbereich der Sorte in ihrer Phase an diesem Tag gegen den Zielbereich des Gefässes an diesem Tag.
import { deckeltyp, gefaessAm, zeilen, type PlatzZeile } from '../anlage/teile.ts';
import type { Betriebsart } from '../anlage/anlegen.ts';
import { inHundertstel, type Band } from '../bewertung/bewertung.ts';
import { artDerSorte, umsetzenAbTage } from '../pflanzung/belegung.ts';
import { zieltoepfe, type SorteWahl } from '../pflanzung/saeen.ts';
import { phaseAm } from '../phasen/prognose.ts';
import { phasenfolge, type Kulturform, type Phase } from '../phasen/profil.ts';
import { sollbereich } from '../phasen/sollbereich.ts';
import type { Teile } from '../teile.ts';
import { randloecher } from '../vorlagen/lochbild.ts';
import { kalendertag, tagPlus, type Zeitzone } from '../zeit.ts';
import { leitkultur } from '../zielbereich-leitkultur.ts';
import { uEcVon, zielbereichPassung } from '../zielbereich-passung.ts';
import { schnittmenge, type ZaehlendePflanzung } from '../zielbereich.ts';
import { passung, sortiert, type LeitkulturBezug, type Passung, type PassungKontext } from './passung.ts';

export interface Kandidat {
  sorteId: string;
  kulturform: Kulturform;
}

export interface SortePassung extends SorteWahl {
  kulturform: Kulturform;
  umsetzenAm: string;
  passung: Passung;
  rang: number;
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => String(x ?? '');
const gueltig = (z: Zeile) => (z['gueltig_bis'] ?? null) === null && (z['storniert_am'] ?? null) === null;
const zahl = (x: unknown) => (x === null || x === undefined || x === '' ? undefined : Number(x));
/** Feld nur setzen, wenn der Wert vorhanden ist (exactOptionalPropertyTypes) */
const mit = <K extends string, V>(k: K, v: V | undefined) =>
  v === undefined ? {} : ({ [k]: v } as Record<K, V>);

const HINWEIS_OHNE_UMSETZEN = 'Umsetzdatum fehlt in der Wissensbasis, Ziel später';
const DIREKTSAAT = new Set(['kratky', 'kratky_belueftet']);
/** Wärme P6: Messungen der letzten 7 Kalendertage */
const WAERME_TAGE = 7;

const artZeile = (teile: Teile, artId: string | undefined) =>
  teil(teile, 'art').find((a) => a['art_id'] === artId && gueltig(a));
const sorteZeile = (teile: Teile, sorteId: string) =>
  teil(teile, 'sorte').find((s) => s['sorte_id'] === sorteId && gueltig(s));
const kulturformZeile = (teile: Teile, artId: string | undefined, kulturform: string) =>
  teil(teile, 'art_kulturform').find(
    (z) => z['art_id'] === artId && z['kulturform'] === kulturform && gueltig(z),
  );

/** Phase mit Band (A5): hat die Phase weder pH- noch EC-Band, die nächste Phase der Folge mit Band */
function phaseMitBand(teile: Teile, k: Kandidat, phase: Phase, platzId: string): Phase {
  const mitBand = (p: Phase) => {
    const s = sollbereich(teile, k.sorteId, p, platzId);
    return s.ph !== undefined || s.ec !== undefined;
  };
  if (mitBand(phase)) return phase;
  const folge = phasenfolge(teile, k.sorteId, k.kulturform).map((p) => p.phase);
  return folge.slice(folge.indexOf(phase) + 1).find(mitBand) ?? phase;
}

/** Wuchshöhe und Wuchsform: Sorte vor Art */
function wuchs(teile: Teile, sorteId: string): { hoehe?: number; form?: string } {
  const s = sorteZeile(teile, sorteId);
  const a = artZeile(teile, text(s?.['art_id']));
  const hoehe = zahl(s?.['wuchshoehe_max_mm']) ?? zahl(a?.['wuchshoehe_max_mm']);
  const form = (s?.['wuchsform'] ?? a?.['wuchsform'] ?? undefined) as string | undefined;
  return { ...mit('hoehe', hoehe), ...mit('form', form ?? undefined) };
}

function kandidatVon(
  teile: Teile,
  k: Kandidat,
  phase: Phase,
  platzId: string,
): PassungKontext['kandidat'] | undefined {
  const sorte = sorteZeile(teile, k.sorteId);
  if (!sorte) return undefined;
  const artId = text(sorte['art_id']);
  const art = artZeile(teile, artId);
  const kf = kulturformZeile(teile, artId, k.kulturform);
  const soll = sollbereich(teile, k.sorteId, phase, platzId);
  const licht = teil(teile, 'v_sollwert').find(
    (s) => s['sorte_id'] === k.sorteId && s['phase'] === phase && s['groesse'] === 'licht_h',
  );
  const w = wuchs(teile, k.sorteId);
  return {
    sorteId: k.sorteId,
    name: text(sorte['name']),
    artId,
    kulturgruppeId: text(art?.['kulturgruppe_id']),
    kulturform: k.kulturform,
    phase,
    ...mit('systemeignung', (art?.['systemeignung'] ?? undefined) as 'dwc' | 'kratky' | 'beide' | undefined),
    ...mit('ph', soll.ph),
    ...mit('ec', soll.ec),
    ...mit('temp', soll.temp),
    ...mit('lichtMaxH', zahl(licht?.['wert_max'])),
    ...mit(
      'photoperiode',
      (art?.['photoperiode'] ?? undefined) as 'langtag' | 'kurztag' | 'tagneutral' | undefined,
    ),
    ...mit('kritischeTageslaengeH', zahl(art?.['kritische_tageslaenge_h'])),
    ...mit('kulturdauerTypischD', zahl(kf?.['kulturdauer_typisch_d'])),
    entspitzen: kf?.['entspitzen'] === true,
    ...mit('wuchshoeheMm', w.hoehe),
    ...mit('wuchsform', w.form as 'aufrecht' | 'buschig' | 'haengend' | 'rosette' | undefined),
    ...mit('pythium', (art?.['pythium'] ?? undefined) as 'hoch' | 'mittel' | 'gering' | undefined),
    ...mit('wasserbedarfL', zahl(art?.['wasserbedarf_je_pflanze_l'])),
  };
}

/** Maximum der Wassertemperatur am Platz in den letzten 7 Kalendertagen, nicht storniert (Hundertstel) */
function wassertempMax7d(teile: Teile, platzId: string, jetzt: Date, zeitzone: Zeitzone): number | undefined {
  const ab = tagPlus(kalendertag(jetzt, zeitzone), -WAERME_TAGE);
  const werte = teil(teile, 'messung')
    .filter(
      (m) =>
        m['platz_id'] === platzId &&
        (m['storniert_am'] ?? null) === null &&
        zahl(m['temperatur']) !== undefined &&
        kalendertag(new Date(text(m['gilt_ab'])), zeitzone) >= ab,
    )
    .map((m) => inHundertstel(m['temperatur'] as number | string));
  return werte.length > 0 ? Math.max(...werte) : undefined;
}

/** Leitkultur der zählenden ohne den Kandidaten (R2.3, A4, A16) */
function leitkulturBezug(
  teile: Teile,
  platzId: string,
  zaehlende: readonly ZaehlendePflanzung[],
): LeitkulturBezug | undefined {
  const l = leitkultur(teile, platzId, zaehlende);
  if (l.art !== 'art') return undefined;
  const eigene = zaehlende.filter((p) => p.artId === l.artId);
  const art = artZeile(teile, l.artId);
  const dauern = [...new Set(eigene.map((p) => p.kulturform))]
    .map((kf) => zahl(kulturformZeile(teile, l.artId, kf)?.['kulturdauer_typisch_d']))
    .filter((d): d is number => d !== undefined);
  const satzIds = new Set(eigene.map((p) => p.satzId));
  const aeltester = teil(teile, 'satz')
    .filter((s) => satzIds.has(text(s['id'])))
    .sort(
      (a, b) =>
        text(a['saatdatum']).localeCompare(text(b['saatdatum'])) ||
        text(a['gilt_ab']).localeCompare(text(b['gilt_ab'])) ||
        text(a['id']).localeCompare(text(b['id'])),
    )[0];
  const s = schnittmenge(teile, platzId, eigene);
  return {
    artId: l.artId,
    name: text(art?.['name_de']),
    kulturgruppeId: text(art?.['kulturgruppe_id']),
    ...mit('kulturdauerTypischD', dauern.length > 0 ? Math.max(...dauern) : undefined),
    ...mit('wuchshoeheMm', aeltester ? wuchs(teile, text(aeltester['sorte_id'])).hoehe : undefined),
    ...mit('ec', s.art === 'ok' ? s.ec : undefined),
  };
}

type GefaessTeil = Omit<PassungKontext, 'kandidat'>;

/** gefässabhängiger Teil am Umsetzdatum: Gefäss, Zielbereich, Leitkultur, Mitbewohner, u_EC */
function gefaessTeil(
  teile: Teile,
  platzId: string,
  umsetzenAm: string,
  direktsaat: boolean,
  ohne: readonly string[],
  jetzt: Date,
  zeitzone: Zeitzone,
): GefaessTeil | undefined {
  const g = gefaessAm(teile, platzId);
  const platz = zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === platzId);
  if (!g || !platz) return undefined;
  const deckel = deckeltyp(teile, text(g.deckeltyp_id));
  const reihen = [...(deckel?.loecher_je_reihe ?? [])];
  const bereich = teil(teile, 'bereich').find((b) => b['id'] === platz.bereich_id);
  const zb = zielbereichPassung(teile, platzId, umsetzenAm, jetzt, zeitzone, ohne);
  const s = zb.schnittmenge;
  const baender: { ph?: Band; ec?: Band; temp?: Band } =
    s.art === 'ok'
      ? { ph: s.ph, ec: s.ec, temp: s.temperatur }
      : s.art === 'leer'
        ? { ...mit('ph', s.ph), ...mit('ec', s.ec) }
        : {};
  const pythium = new Map(
    zb.zaehlende.map((p) => [
      p.artId,
      (artZeile(teile, p.artId)?.['pythium'] ?? undefined) as string | undefined,
    ]),
  );
  const temp = wassertempMax7d(teile, platzId, jetzt, zeitzone);
  const leit = leitkulturBezug(teile, platzId, zb.zaehlende);
  return {
    gefaess: {
      platzId,
      kennung: platz.kennung,
      betriebsart: g.betriebsart as Betriebsart,
      lochGroesseMm: Number(deckel?.topfdurchmesser_mm) === 50 ? 50 : 80,
      betriebsvolumenL: Number(g.betriebsvolumen_l),
      lochzahl: reihen.reduce((a, b) => a + b, 0),
      freieLoecher: zieltoepfe(teile, platzId, new Map(), umsetzenAm, direktsaat)
        .filter((z) => z.zustand === 'frei')
        .map((z) => z.lochNr),
      randloecher: randloecher(reihen),
      bereich: {
        name: text(bereich?.['name']),
        ...mit('lichtstundenH', zahl(bereich?.['lichtstunden'])),
        ...mit('nutzbareHoeheMm', zahl(bereich?.['nutzbare_hoehe_mm'])),
      },
      ...mit('wassertempMax7d', temp),
    },
    zielbereich: { ...baender, zaehlende: zb.zaehlende.length },
    ...mit('leitkultur', leit),
    mitbewohnerArten: [...pythium].map(([artId, p]) => ({
      artId,
      ...mit('pythium', p as 'hoch' | 'mittel' | 'gering' | undefined),
    })),
    uEc: uEcVon(teile),
  };
}

const istDirektsaat = (teile: Teile, platzId: string) => {
  const g = gefaessAm(teile, platzId);
  return !!g && DIREKTSAAT.has(g.betriebsart) && !g.feste_dosis;
};

/** Umsetzdatum eines neuen Satzes: Direktsaat der Saattag, sonst Saat + «Umsetzen ab»; fehlt es, das Saatdatum (A6) */
function umsetzdatum(teile: Teile, sorteId: string, saatdatum: string, direktsaat: boolean) {
  const ab = umsetzenAbTage(teile, artDerSorte(teile, sorteId));
  return {
    umsetzenAm: direktsaat || ab === undefined ? saatdatum : tagPlus(saatdatum, ab),
    fehlt: !direktsaat && ab === undefined,
  };
}

function kontextAus(
  teile: Teile,
  k: Kandidat,
  platzId: string,
  saatdatum: string,
  umsetzenAm: string,
  direktsaat: boolean,
  teilGefaess: GefaessTeil,
  jetzt: Date,
  zeitzone: Zeitzone,
): PassungKontext | undefined {
  const geschaetzt = direktsaat
    ? 'wachstum'
    : phaseAm(
        teile,
        { sorteId: k.sorteId, kulturform: k.kulturform, saatdatum, direktsaat },
        umsetzenAm,
        jetzt,
        zeitzone,
      );
  const kandidat = kandidatVon(teile, k, phaseMitBand(teile, k, geschaetzt, platzId), platzId);
  return kandidat ? { kandidat, ...teilGefaess } : undefined;
}

/** Kontext für eine Sorte, die am `saatdatum` gesät und am Umsetzdatum ins Zielgefäss kommt; ohne Gefäss undefined */
export function passungKontext(
  teile: Teile,
  kandidat: Kandidat,
  zielPlatzId: string,
  saatdatum: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): PassungKontext | undefined {
  const direktsaat = istDirektsaat(teile, zielPlatzId);
  const { umsetzenAm } = umsetzdatum(teile, kandidat.sorteId, saatdatum, direktsaat);
  const g = gefaessTeil(teile, zielPlatzId, umsetzenAm, direktsaat, [], jetzt, zeitzone);
  return g
    ? kontextAus(teile, kandidat, zielPlatzId, saatdatum, umsetzenAm, direktsaat, g, jetzt, zeitzone)
    : undefined;
}

/** Einstufung je Sorte für ein Zielgefäss, sortiert mit Rang (R3.2); der Gefässteil je Umsetzdatum einmal */
export function sortenPassung(
  teile: Teile,
  sorten: readonly (SorteWahl & { kulturform?: Kulturform })[],
  zielPlatzId: string,
  saatdatum: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): SortePassung[] {
  const direktsaat = istDirektsaat(teile, zielPlatzId);
  const teileJeTag = new Map<string, GefaessTeil | undefined>();
  const liste: Omit<SortePassung, 'rang'>[] = [];
  for (const s of sorten) {
    const kulturform = s.kulturform ?? s.vorgabe;
    const { umsetzenAm, fehlt } = umsetzdatum(teile, s.sorteId, saatdatum, direktsaat);
    if (!teileJeTag.has(umsetzenAm))
      teileJeTag.set(
        umsetzenAm,
        gefaessTeil(teile, zielPlatzId, umsetzenAm, direktsaat, [], jetzt, zeitzone),
      );
    const g = teileJeTag.get(umsetzenAm);
    if (!g) return [];
    const k = kontextAus(
      teile,
      { sorteId: s.sorteId, kulturform },
      zielPlatzId,
      saatdatum,
      umsetzenAm,
      direktsaat,
      g,
      jetzt,
      zeitzone,
    );
    if (!k) continue;
    const p = passung(k);
    liste.push({
      ...s,
      kulturform,
      umsetzenAm,
      passung: fehlt ? { ...p, hinweise: [...p.hinweise, HINWEIS_OHNE_UMSETZEN] } : p,
    });
  }
  return sortiert(liste);
}

/** Umsetzen ohne Zieltopf (R6.2, A7): Satz gegen das Gefäss heute, in seiner Kulturform, ohne die eigenen Pflanzungen */
export function gefaessPassung(
  teile: Teile,
  satzId: string,
  zielPlatzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Passung | undefined {
  const satz = teil(teile, 'satz').find((s) => s['id'] === satzId && (s['storniert_am'] ?? null) === null);
  if (!satz) return undefined;
  const heute = kalendertag(jetzt, zeitzone);
  const eigene = teil(teile, 'pflanzung')
    .filter((p) => p['satz_id'] === satzId)
    .map((p) => text(p['id']));
  const g = gefaessTeil(teile, zielPlatzId, heute, false, eigene, jetzt, zeitzone);
  if (!g) return undefined;
  const k: Kandidat = { sorteId: text(satz['sorte_id']), kulturform: text(satz['kulturform']) as Kulturform };
  const phase = phaseAm(
    teile,
    {
      satzId,
      sorteId: k.sorteId,
      kulturform: k.kulturform,
      saatdatum: text(satz['saatdatum']),
      direktsaat: false,
    },
    heute,
    jetzt,
    zeitzone,
  );
  const kandidat = kandidatVon(teile, k, phaseMitBand(teile, k, phase, zielPlatzId), zielPlatzId);
  return kandidat ? passung({ kandidat, ...g }) : undefined;
}
