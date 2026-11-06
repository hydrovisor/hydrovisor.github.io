// Satz duplizieren (UC5 «Satz duplizieren», R11.1 bis R11.3; Plan 25): Auswahl der letzten Sätze, Vorbelegung der
// Säen-Eingabe aus einem Satz mit Freiprüfung der Zieltöpfe am Umsetzdatum, Hinweis «belegt bis …; frei gleicher
// Grösse», Satzgrösse für einen festen Takt. Rein: jetzt und Zeitzone als Parameter (G1, G2).
import { nachKennung, zeilen, type Teile } from '../anlage/teile.ts';
import type { Zeitzone } from '../zeit.ts';
import { kalendertag, tagKurz, tagPlus } from '../zeit.ts';
import { artDerSorte, artKulturform, topfPrognose, umsetzenAbTage, type TopfPrognose } from './belegung.ts';
import {
  boxenAus,
  boxFuer,
  kulturformen,
  KULTURFORM_NAME,
  zielgefaesse,
  type Kulturtyp,
  type SaatEingabe,
  type SatzEingabe,
} from './saeen.ts';

export interface SatzKopieWahl {
  satzId: string;
  sorteId: string;
  name: string;
  kulturform: string;
  saatdatum: string;
  zielKennung?: string;
  zieltoepfe: number;
  text: string;
}

export interface Satzgroesse {
  loecher: number;
  standzeitTage: number;
  pflanzen: number;
  text: string;
}

export interface DuplikatVorschlag {
  eingabe: SaatEingabe;
  ziel?: { platzId: string; kennung: string; direktsaat: boolean };
  umsetzenAm?: string;
  toepfe: TopfPrognose[];
  hinweise: string[];
  satzgroesse?: Satzgroesse;
}

interface SatzZeile {
  id: string;
  sorte_id: string;
  kulturform: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  anzahl_schwaemme: number;
  samen_je_schwamm: number;
  saatdatum: string;
  gilt_ab: string;
  storniert_am: string | null;
}
interface SorteZeile {
  sorte_id: string;
  name: string;
  art_id: string;
  kulturtyp: Kulturtyp;
  gueltig_bis?: string | null;
}
interface PlatzZeile {
  id: string;
  anlage_id: string;
  kennung: string;
}
interface TopfOrt {
  netztopf_id: string;
  kennung: string;
  platz_id: string;
  loch_nr: number | null;
}

const HINWEIS_OHNE_UMSETZEN = 'Umsetzdatum fehlt in der Wissensbasis, Ziel später';
const HOECHSTENS_FREI = 6;
const TAKT_TAGE = 14;

const sorteGueltig = (teile: Teile, sorteId: string) =>
  zeilen<SorteZeile>(teile, 'sorte').find((s) => s.sorte_id === sorteId && (s.gueltig_bis ?? null) === null);
const platzVon = (teile: Teile, id: string | null) =>
  id ? zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === id) : undefined;
const ortDesSatzes = (teile: Teile, s: SatzZeile) =>
  platzVon(teile, s.anzuchtort_platz_id ?? s.direktsaat_platz_id);
const topfOrte = (teile: Teile) =>
  new Map(zeilen<TopfOrt>(teile, 'v_netztopf_platz').map((n) => [n.netztopf_id, n]));

/**
 * Töpfe des Originals (A3): aktive Reservierungen seiner Pflanzungen und Töpfe, in denen sie stehen oder standen;
 * Zielgefäss = Gefäss mit den meisten Töpfen, bei Gleichstand nach Kennung.
 */
function toepfeDesOriginals(teile: Teile, satzId: string): { platz?: PlatzZeile; toepfe: string[] } {
  const pflanzungen = new Set(
    zeilen<{ id: string; satz_id: string; storniert_am?: string | null }>(teile, 'pflanzung')
      .filter((p) => p.satz_id === satzId && (p.storniert_am ?? null) === null)
      .map((p) => p.id),
  );
  const ids = new Set<string>();
  for (const r of zeilen<{ pflanzung_id: string; netztopf_id: string }>(teile, 'v_reservierung_aktiv'))
    if (pflanzungen.has(r.pflanzung_id)) ids.add(r.netztopf_id);
  for (const z of zeilen<{ pflanzung_id: string; netztopf_id: string | null }>(teile, 'v_pflanzung_zustand'))
    if (pflanzungen.has(z.pflanzung_id) && z.netztopf_id) ids.add(z.netztopf_id);
  const orte = topfOrte(teile);
  const jePlatz = new Map<string, string[]>();
  for (const id of ids) {
    const o = orte.get(id);
    if (!o || o.loch_nr === null) continue;
    jePlatz.set(o.platz_id, [...(jePlatz.get(o.platz_id) ?? []), id]);
  }
  const kandidaten = [...jePlatz]
    .map(([platzId, toepfe]) => ({ platz: platzVon(teile, platzId), toepfe }))
    .filter((k): k is { platz: PlatzZeile; toepfe: string[] } => !!k.platz)
    .sort((a, b) => b.toepfe.length - a.toepfe.length || nachKennung(a.platz, b.platz));
  const erster = kandidaten[0];
  return erster ? erster : { toepfe: [] };
}

const nachSaat = (a: SatzZeile, b: SatzZeile) =>
  b.saatdatum.localeCompare(a.saatdatum) || Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab);

/** Sätze der Anlage zum Duplizieren: jüngster je Sorte und Kulturform, neueste zuerst, nur gültige Sorten (A12) */
export function duplizierbareSaetze(teile: Teile, anlageId: string, hoechstens = 3): SatzKopieWahl[] {
  const saetze = zeilen<SatzZeile>(teile, 'satz')
    .filter((s) => s.storniert_am === null && ortDesSatzes(teile, s)?.anlage_id === anlageId)
    .filter((s) => sorteGueltig(teile, s.sorte_id))
    .sort(nachSaat);
  const gesehen = new Set<string>();
  const ergebnis: SatzKopieWahl[] = [];
  for (const s of saetze) {
    const schluessel = `${s.sorte_id}|${s.kulturform}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    const name = sorteGueltig(teile, s.sorte_id)?.name ?? 'Sorte';
    const o = toepfeDesOriginals(teile, s.id);
    const form = KULTURFORM_NAME[s.kulturform] ?? s.kulturform;
    const ziel = o.platz
      ? ` · ${o.platz.kennung}, ${o.toepfe.length} ${o.toepfe.length === 1 ? 'Topf' : 'Töpfe'}`
      : '';
    ergebnis.push({
      satzId: s.id,
      sorteId: s.sorte_id,
      name,
      kulturform: s.kulturform,
      saatdatum: s.saatdatum,
      ...(o.platz ? { zielKennung: o.platz.kennung } : {}),
      zieltoepfe: o.toepfe.length,
      text: `${name} · ${form} · gesät ${tagKurz(s.saatdatum)}${ziel}`,
    });
  }
  return ergebnis.slice(0, hoechstens);
}

/**
 * Freie Töpfe gleicher Grösse am Umsetzdatum: zuerst das Gefäss selbst nach Loch, dann die übrigen Zielgefässe gleicher
 * Art (Anzucht oder Direktsaat) nach Kennung; ohne die Töpfe in `ohne`. Ungekürzt (A11).
 */
export function freiGleicherGroesse(
  teile: Teile,
  anlageId: string,
  e: {
    platzId: string;
    groesseMm: number;
    direktsaat: boolean;
    umsetzenAm: string;
    ohne: ReadonlySet<string>;
  },
): string[] {
  const gefaesse = zielgefaesse(teile, anlageId).filter((z) => z.direktsaat === e.direktsaat);
  const folge = [
    ...gefaesse.filter((z) => z.platzId === e.platzId),
    ...gefaesse.filter((z) => z.platzId !== e.platzId),
  ];
  const orte = [...topfOrte(teile).values()];
  const frei: string[] = [];
  for (const g of folge)
    for (const o of orte
      .filter((x) => x.platz_id === g.platzId && x.loch_nr !== null && !e.ohne.has(x.netztopf_id))
      .sort((a, b) => Number(a.loch_nr) - Number(b.loch_nr))) {
      const p = topfPrognose(teile, o.netztopf_id, e.umsetzenAm, e.direktsaat);
      if (p && p.groesseMm === e.groesseMm && p.frei) frei.push(p.kennung);
    }
  return frei;
}

/** «2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: 2.3.5, 2.3.6» (höchstens sechs, dann «…») */
export function belegtHinweis(
  zielKennung: string,
  nichtFrei: readonly TopfPrognose[],
  frei: readonly string[],
): string {
  const enden = nichtFrei.map((p) => p.belegtBis);
  const bekannt = enden.length > 0 && enden.every((x) => x !== undefined);
  const bis = bekannt ? (enden as string[]).sort().at(-1) : undefined;
  const liste =
    frei.length === 0
      ? 'keine'
      : `${frei.slice(0, HOECHSTENS_FREI).join(', ')}${frei.length > HOECHSTENS_FREI ? ', …' : ''}`;
  const kopf = bis
    ? `${zielKennung} belegt bis voraussichtlich ${tagKurz(bis)}`
    : `${zielKennung} belegt, Ende unbekannt`;
  return `${kopf}; frei gleicher Grösse: ${liste}`;
}

/**
 * R11.3: Pflanzen je Folgesatz = Löcher × 14 / Standzeit, kaufmännisch gerundet, mindestens 1; Standzeit = Kulturdauer
 * typisch − «Umsetzen ab», bei Direktsaat Kulturdauer typisch (A2). Fehlt ein Wert oder ist die Standzeit ≤ 0: undefined.
 */
export function satzgroesse(
  teile: Teile,
  e: { platzId: string; groesseMm: number; artId: string; kulturform: string; direktsaat: boolean },
): Satzgroesse | undefined {
  const groessen = new Map(
    zeilen<{ id: string; groesse_mm: number; aktiv?: boolean; storniert_am: string | null }>(
      teile,
      'netztopf',
    )
      .filter((n) => n.storniert_am === null && n.aktiv !== false)
      .map((n) => [n.id, Number(n.groesse_mm)]),
  );
  const loecher = [...topfOrte(teile).values()].filter(
    (o) => o.platz_id === e.platzId && o.loch_nr !== null && groessen.get(o.netztopf_id) === e.groesseMm,
  ).length;
  const typisch = artKulturform(teile, e.artId, e.kulturform)?.kulturdauer_typisch_d;
  if (typisch === null || typisch === undefined || loecher === 0) return undefined;
  const ab = umsetzenAbTage(teile, e.artId);
  if (!e.direktsaat && ab === undefined) return undefined;
  const standzeitTage = Number(typisch) - (e.direktsaat ? 0 : (ab as number));
  if (standzeitTage <= 0) return undefined;
  const pflanzen = Math.max(1, Math.round((loecher * TAKT_TAGE) / standzeitTage));
  return {
    loecher,
    standzeitTage,
    pflanzen,
    text: `Fester Takt alle ${TAKT_TAGE} Tage: ${pflanzen} ${pflanzen === 1 ? 'Pflanze' : 'Pflanzen'} je Folgesatz (${loecher} Löcher × ${TAKT_TAGE} / ${standzeitTage} Tage)`,
  };
}

function keimartVon(teile: Teile, sorteId: string): string | undefined {
  return (
    zeilen<{ sorte_id: string; phase: string; groesse: string; text_wert: string | null }>(
      teile,
      'v_sollwert',
    ).find((s) => s.sorte_id === sorteId && s.phase === 'keimung' && s.groesse === 'keimart')?.text_wert ??
    undefined
  );
}

/**
 * Vorbelegung der Säen-Eingabe aus einem Satz (R11.1): Sorte, Kulturform, Anzuchtort, Samen je Schwamm, Schwammzahl und
 * Zielgefäss; Zieltöpfe nur, wenn sie am Umsetzdatum des neuen Satzes voraussichtlich frei sind, sonst «Ziel später»
 * mit Hinweis. undefined: Satz unbekannt oder storniert, Sorte nicht gültig.
 */
export function satzDuplizieren(
  teile: Teile,
  satzId: string,
  begonnenAm: Date,
  jetzt: Date,
  zeitzone: Zeitzone,
): DuplikatVorschlag | undefined {
  const satz = zeilen<SatzZeile>(teile, 'satz').find((s) => s.id === satzId && s.storniert_am === null);
  if (!satz) return undefined;
  const sorte = sorteGueltig(teile, satz.sorte_id);
  const ort = ortDesSatzes(teile, satz);
  if (!sorte || !ort) return undefined;
  const anlageId = ort.anlage_id;
  const hinweise: string[] = [];
  const saatdatum = kalendertag(jetzt, zeitzone);
  const artId = artDerSorte(teile, satz.sorte_id) ?? sorte.art_id;

  // Kulturform (R1.2)
  const art = zeilen<{ art_id: string; kulturformen_erlaubt: string[]; kulturform_vorgabe: string | null }>(
    teile,
    'art',
  ).find((a) => a.art_id === artId);
  const formen = kulturformen(
    {
      kulturformen_erlaubt: art?.kulturformen_erlaubt ?? [],
      kulturform_vorgabe: art?.kulturform_vorgabe ?? null,
    },
    sorte.kulturtyp,
  );
  let kulturform = satz.kulturform;
  if (!(formen.erlaubt as string[]).includes(kulturform)) {
    kulturform = formen.vorgabe;
    hinweise.push(
      `Kulturform ${KULTURFORM_NAME[satz.kulturform] ?? satz.kulturform} nicht mehr erlaubt, Vorgabe ${KULTURFORM_NAME[kulturform] ?? kulturform}`,
    );
  }

  // Zielgefäss und Töpfe des Originals (A3)
  const original = toepfeDesOriginals(teile, satz.id);
  const ziele = zielgefaesse(teile, anlageId);
  const zielPlatz =
    original.platz ?? (satz.direktsaat_platz_id ? platzVon(teile, satz.direktsaat_platz_id) : undefined);
  const zielG = zielPlatz ? ziele.find((z) => z.platzId === zielPlatz.id) : undefined;
  if (zielPlatz && !zielG) hinweise.push(`Zielgefäss ${zielPlatz.kennung} nicht wählbar`);
  const direktsaat = zielG?.direktsaat === true;

  // Box: die des Originals, wenn noch vorhanden, sonst nach Keimart (nicht bei Direktsaat)
  let boxPlatzId: string | undefined;
  if (!direktsaat) {
    const boxen = boxenAus(teile, anlageId);
    if (satz.anzuchtort_platz_id && boxen.some((b) => b.platzId === satz.anzuchtort_platz_id))
      boxPlatzId = satz.anzuchtort_platz_id;
    else {
      const box = boxFuer(teile, anlageId, keimartVon(teile, satz.sorte_id));
      if (box.platzId) boxPlatzId = box.platzId;
      const alt = platzVon(teile, satz.anzuchtort_platz_id);
      if (alt && box.platzId)
        hinweise.push(`Anzuchtbox ${alt.kennung} nicht mehr vorhanden, Box ${box.kennung} nach Keimart`);
    }
  }

  // Umsetzdatum des neuen Satzes (Plan 23 R8.2): Direktsaat der Saattag
  const umsetzenAb = umsetzenAbTage(teile, artId);
  const umsetzenAm = direktsaat
    ? saatdatum
    : umsetzenAb === undefined
      ? undefined
      : tagPlus(saatdatum, umsetzenAb);
  if (zielG && umsetzenAm === undefined) hinweise.push(HINWEIS_OHNE_UMSETZEN);

  const orte = topfOrte(teile);
  const toepfe =
    zielG && umsetzenAm
      ? original.toepfe
          .filter((id) => orte.get(id)?.platz_id === zielG.platzId)
          .map((id) => topfPrognose(teile, id, umsetzenAm, direktsaat))
          .filter((p): p is TopfPrognose => !!p)
          .sort((a, b) => nachKennung(a, b))
      : [];
  const frei = toepfe.filter((p) => p.frei);
  const nichtFrei = toepfe.filter((p) => !p.frei);
  if (zielG && umsetzenAm && nichtFrei.length > 0) {
    const liste = freiGleicherGroesse(teile, anlageId, {
      platzId: zielG.platzId,
      groesseMm: (nichtFrei[0] as TopfPrognose).groesseMm,
      direktsaat,
      umsetzenAm,
      ohne: new Set(frei.map((p) => p.netztopfId)),
    });
    hinweise.push(belegtHinweis(zielG.kennung, nichtFrei, liste));
  }

  const zieltopfIds = frei.map((p) => p.netztopfId);
  const s: SatzEingabe = {
    sorteId: satz.sorte_id,
    kulturform,
    ...(boxPlatzId ? { boxPlatzId } : {}),
    zieltopfIds,
    ...(zieltopfIds.length === 0 ? { pflanzenOhneZiel: Math.max(1, original.toepfe.length) } : {}),
    samenJeSchwamm: Number(satz.samen_je_schwamm),
    // Direktsaat: Schwämme = Zieltöpfe wie in Säen (A10, Runde 1 Befund 1)
    ...(direktsaat ? {} : { schwaemme: Number(satz.anzahl_schwaemme) }),
    kopiertVon: satz.id,
  };
  const zielPlatzId = zielG && (zieltopfIds.length > 0 || direktsaat) ? zielG.platzId : undefined;
  const groesse = toepfe[0]?.groesseMm;
  const sg =
    zielG && groesse !== undefined
      ? satzgroesse(teile, { platzId: zielG.platzId, groesseMm: groesse, artId, kulturform, direktsaat })
      : undefined;
  return {
    eingabe: {
      anlageId,
      einstieg: 'duplizieren',
      begonnenAm,
      saatdatum,
      ...(zielPlatzId ? { zielPlatzId } : {}),
      saetze: [s],
    },
    ...(zielG ? { ziel: { platzId: zielG.platzId, kennung: zielG.kennung, direktsaat } } : {}),
    ...(umsetzenAm ? { umsetzenAm } : {}),
    toepfe,
    hinweise,
    ...(sg ? { satzgroesse: sg } : {}),
  };
}
