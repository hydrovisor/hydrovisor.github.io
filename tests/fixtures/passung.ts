// Teile des Bündels für die Passungs-Empfehlung (Plan 36 Testliste; Konzept R2.2 Zweck Passung, R3.1 bis R3.4). Baut
// additiv auf zielbereichTeile() aus tests/fixtures/zielbereich.ts auf (Anlage R, Bestand in 2.3) und ergänzt die
// Stammwerte der Passung, die Phasendauern und v_netztopf_platz. Ohne Personendaten; Sorten sind Handelsnamen. Werte
// sind Testdaten, keine Fachwerte (wie Plan 34 A2). Gemeinsam für Unit und E2E.
//
// Werte, auf die die Tests rechnen (Uhr ZB_JETZT = Mo 18.1.2027 09:00 Zürich):
// - Bereiche 1 bis 4 («Ebene n»): lichtstunden 15, nutzbare_hoehe_mm 450, 200, 150, 150. 2.3 DWC 9 l D2 (6 × 80 mm,
//   Ebene 2); 3.1 und 3.3 Kratky belüftet 9 l D3 (8 × 50 mm, Ebene 3); 1.1 DWC D1 (Ebene 1). Alle Gefässe in Betrieb.
// - Phasendauern (v_sollwert dauer, wert_typ) für alle Sorten: Keimung 6, Anzucht 21 (TZ5). Saat 1.1. → 7.1. Anzucht,
//   28.1. Wachstum. Eichblatt (gesät 12.1.) → 18.1. Anzucht, 8.2. Wachstum; Lollo Rossa (gesät 1.12.2026) ab 28.12.
//   Wachstum.
// - art (Stammwerte der Passung):
//   Salat: beide, Kulturgruppe salat, Umsetzen ab 21, Wuchshöhe 40 mm, rosette, tagneutral, Pythium gering,
//     Kulturformen babyleaf, schnitt, kopf (Vorgabe kopf).
//   Tomate: dwc, fruchtgemuese, Umsetzen ab 28, Wuchshöhe 1800, aufrecht, tagneutral, Pythium mittel, Wasser 1.0 l.
//   Basilikum: beide, kraeuter, Umsetzen ab 28, Wuchshöhe 450, buschig, tagneutral, Pythium hoch; dauerkultur_blatt
//     mit Entspitzen.
//   Rucola: beide, rauke, Umsetzen ab 14, Wuchshöhe 200, rosette, Pythium gering (Vorgabe babyleaf).
//   Spinat: beide, spinat, Umsetzen ab 21, Wuchshöhe 300, rosette, langtag mit kritischer Tageslänge 13 h, Pythium
//     hoch, Kulturformen babyleaf (Vorgabe, Kulturdauer 30), kopf (Kulturdauer 45); licht_h max. in Wachstum 14.
//   Mangold (neu, Sorte «Rhubarb Chard»): beide, mangold, Umsetzen ab 21, Wuchshöhe 450, aufrecht, tagneutral,
//     Pythium gering, Kulturformen babyleaf (Vorgabe, 30), dauerkultur_blatt ohne Entspitzen (120); Wachstum pH 6.0–6.8,
//     EC 1.0–1.6, Anzucht pH 6.0–6.8, EC 0.8–1.2.
//   Wasserbedarf je Pflanze wie zielbereich.ts (Salat 0.25, Tomate 1.0, Basilikum 0.3, Rucola 0.1, Spinat 0.1), Mangold
//     0.3.
// - Sorten mit kulturtyp (blatt, Tomate frucht); ohne eigene Wuchshöhe und Wuchsform (gilt die Art).
// - Kulturgruppen salat, fruchtgemuese, kraeuter, rauke, spinat, mangold.
import { netztopfPlatz } from './saeen.ts';
import { uid, type Teile } from './regal.ts';
import { ART as ZB_ART, ZB_SORTE, zielbereichTeile, type ZielbereichOptionen } from './zielbereich.ts';

type Zeile = Record<string, unknown>;
const gueltig = { gueltig_bis: null };

export const ART = { ...ZB_ART, mangold: 'beta_vulgaris' } as const;
export const SORTE = { ...ZB_SORTE, mangold: uid('26', 7) } as const;
export type PassungSorte = keyof typeof SORTE;

/** nutzbare Höhe je Bereich 1 bis 4 (Konzept 5.2) */
export const NUTZBARE_HOEHE = [450, 200, 150, 150];
export const LICHTSTUNDEN = 15;

interface Artdef {
  art_id: string;
  name_de: string;
  kulturgruppe_id: string;
  systemeignung: 'dwc' | 'kratky' | 'beide' | null;
  umsetzen_ab_d: number | null;
  wasserbedarf_je_pflanze_l: number | null;
  wuchshoehe_max_mm: number | null;
  wuchsform: string | null;
  photoperiode: string | null;
  kritische_tageslaenge_h: number | null;
  pythium: string | null;
  kulturformen_erlaubt: string[];
  kulturform_vorgabe: string;
}

const ARTEN: Artdef[] = [
  {
    art_id: ART.salat,
    name_de: 'Salat',
    kulturgruppe_id: 'salat',
    systemeignung: 'beide',
    umsetzen_ab_d: 21,
    wasserbedarf_je_pflanze_l: 0.25,
    wuchshoehe_max_mm: 40,
    wuchsform: 'rosette',
    photoperiode: 'tagneutral',
    kritische_tageslaenge_h: null,
    pythium: 'gering',
    kulturformen_erlaubt: ['babyleaf', 'schnitt', 'kopf'],
    kulturform_vorgabe: 'kopf',
  },
  {
    art_id: ART.tomate,
    name_de: 'Tomate',
    kulturgruppe_id: 'fruchtgemuese',
    systemeignung: 'dwc',
    umsetzen_ab_d: 28,
    wasserbedarf_je_pflanze_l: 1.0,
    wuchshoehe_max_mm: 1800,
    wuchsform: 'aufrecht',
    photoperiode: 'tagneutral',
    kritische_tageslaenge_h: null,
    pythium: 'mittel',
    kulturformen_erlaubt: ['dauerkultur_frucht'],
    kulturform_vorgabe: 'dauerkultur_frucht',
  },
  {
    art_id: ART.basilikum,
    name_de: 'Basilikum',
    kulturgruppe_id: 'kraeuter',
    systemeignung: 'beide',
    umsetzen_ab_d: 28,
    wasserbedarf_je_pflanze_l: 0.3,
    wuchshoehe_max_mm: 450,
    wuchsform: 'buschig',
    photoperiode: 'tagneutral',
    kritische_tageslaenge_h: null,
    pythium: 'hoch',
    kulturformen_erlaubt: ['dauerkultur_blatt'],
    kulturform_vorgabe: 'dauerkultur_blatt',
  },
  {
    art_id: ART.rucola,
    name_de: 'Rucola',
    kulturgruppe_id: 'rauke',
    systemeignung: 'beide',
    umsetzen_ab_d: 14,
    wasserbedarf_je_pflanze_l: 0.1,
    wuchshoehe_max_mm: 200,
    wuchsform: 'rosette',
    photoperiode: 'tagneutral',
    kritische_tageslaenge_h: null,
    pythium: 'gering',
    kulturformen_erlaubt: ['babyleaf', 'schnitt'],
    kulturform_vorgabe: 'babyleaf',
  },
  {
    art_id: ART.spinat,
    name_de: 'Spinat',
    kulturgruppe_id: 'spinat',
    systemeignung: 'beide',
    umsetzen_ab_d: 21,
    wasserbedarf_je_pflanze_l: 0.1,
    wuchshoehe_max_mm: 300,
    wuchsform: 'rosette',
    photoperiode: 'langtag',
    kritische_tageslaenge_h: 13,
    pythium: 'hoch',
    kulturformen_erlaubt: ['babyleaf', 'kopf'],
    kulturform_vorgabe: 'babyleaf',
  },
  {
    art_id: ART.mangold,
    name_de: 'Mangold',
    kulturgruppe_id: 'mangold',
    systemeignung: 'beide',
    umsetzen_ab_d: 21,
    wasserbedarf_je_pflanze_l: 0.3,
    wuchshoehe_max_mm: 450,
    wuchsform: 'aufrecht',
    photoperiode: 'tagneutral',
    kritische_tageslaenge_h: null,
    pythium: 'gering',
    kulturformen_erlaubt: ['babyleaf', 'dauerkultur_blatt'],
    kulturform_vorgabe: 'babyleaf',
  },
];

/** art_id, kulturform, kulturdauer_typisch_d, entspitzen */
const KULTURFORMEN: [string, string, number | null, boolean][] = [
  [ART.salat, 'kopf', 56, false],
  [ART.salat, 'schnitt', 90, false],
  [ART.salat, 'babyleaf', 30, false],
  [ART.tomate, 'dauerkultur_frucht', 150, false],
  [ART.basilikum, 'dauerkultur_blatt', 120, true],
  [ART.rucola, 'babyleaf', 30, false],
  [ART.rucola, 'schnitt', 60, false],
  [ART.spinat, 'babyleaf', 30, false],
  [ART.spinat, 'kopf', 45, false],
  [ART.mangold, 'babyleaf', 30, false],
  [ART.mangold, 'dauerkultur_blatt', 120, false],
];

const SORTEN: [PassungSorte, string, string, 'blatt' | 'frucht'][] = [
  ['lollo', 'Lollo Rossa', ART.salat, 'blatt'],
  ['eichblatt', 'Eichblatt', ART.salat, 'blatt'],
  ['ochsenherz', 'Ochsenherz', ART.tomate, 'frucht'],
  ['genoveser', 'Genoveser', ART.basilikum, 'blatt'],
  ['rucola', 'Rucola', ART.rucola, 'blatt'],
  ['matador', 'Matador', ART.spinat, 'blatt'],
  ['mangold', 'Rhubarb Chard', ART.mangold, 'blatt'],
];

const KULTURGRUPPEN = ['salat', 'fruchtgemuese', 'kraeuter', 'rauke', 'spinat', 'mangold'];

/** Zeile v_sollwert in Bündelform */
export function sollwert(
  sorte: PassungSorte,
  phase: string,
  groesse: string,
  w: { min?: number | null; typ?: number | null; max?: number | null; text?: string; basis?: string },
): Zeile {
  return {
    sorte_id: SORTE[sorte],
    phase,
    groesse,
    wert_min: w.min ?? null,
    wert_typ: w.typ ?? null,
    wert_max: w.max ?? null,
    text_wert: w.text ?? null,
    herkunft_ebene: 'art',
    evidenzklasse: 'B',
    vermerk: 'keine',
    ec_basis_quelle: w.basis ?? null,
  };
}

/** Phasendauer (typisch) einer Sorte in v_sollwert ersetzen oder entfernen (typ undefined) */
export function dauerSetzen(t: Teile, sorte: PassungSorte, phase: string, typ: number | undefined): Teile {
  t['v_sollwert'] = (t['v_sollwert'] ?? []).filter(
    (z) => !(z['sorte_id'] === SORTE[sorte] && z['phase'] === phase && z['groesse'] === 'dauer'),
  );
  if (typ !== undefined) t['v_sollwert'].push(sollwert(sorte, phase, 'dauer', { typ }));
  return t;
}

/** Feld einer gültigen Stammzeile (art, art_kulturform, sorte, bereich) setzen */
export function stammSetzen(
  t: Teile,
  teil: 'art' | 'art_kulturform' | 'sorte' | 'bereich',
  wo: (z: Zeile) => boolean,
  felder: Zeile,
): Teile {
  for (const z of t[teil] ?? []) if (wo(z)) Object.assign(z, felder);
  return t;
}

export interface PassungOptionen extends ZielbereichOptionen {
  /** ohne die Phasendauern (Prognose ohne Typ) */
  ohneDauern?: boolean;
}

/** Regal R mit Bestand in 2.3 (wie zielbereichTeile) und den Stammwerten der Passung (siehe Kopf) */
export function passungTeile(e: PassungOptionen = {}): Teile {
  const t = zielbereichTeile(e);
  t['art'] = ARTEN.map((a, i) => ({
    id: uid('41', i + 1),
    ...a,
    standard_keimfaehigkeit: 0.8,
    umsetzen_bis_d: a.umsetzen_ab_d === null ? null : a.umsetzen_ab_d + 7,
    ...gueltig,
  }));
  t['art_kulturform'] = KULTURFORMEN.map(([art, kulturform, dauer, entspitzen], i) => ({
    id: uid('44', i + 1),
    art_id: art,
    kulturform,
    ernteart: 'einmalig',
    ernte_ab_d: null,
    kulturdauer_typisch_d: dauer,
    kulturdauer_max_d: null,
    entspitzen,
    ...gueltig,
  }));
  t['sorte'] = SORTEN.map(([s, name, art, kulturtyp], i) => ({
    id: uid('25', i + 1),
    sorte_id: SORTE[s],
    name,
    art_id: art,
    kulturtyp,
    wuchshoehe_max_mm: null,
    wuchsform: null,
    ...gueltig,
  }));
  t['kulturgruppe'] = KULTURGRUPPEN.map((k, i) => ({
    id: uid('45', i + 1),
    kulturgruppe_id: k,
    name: k,
  }));
  t['bereich'] = (t['bereich'] ?? []).map((b) => ({
    ...b,
    lichtstunden: LICHTSTUNDEN,
    nutzbare_hoehe_mm: NUTZBARE_HOEHE[Number(b['nummer']) - 1] ?? null,
  }));
  t['v_sollwert'] = [
    ...(t['v_sollwert'] ?? []),
    sollwert('matador', 'wachstum', 'licht_h', { min: 10, max: 14 }),
    sollwert('mangold', 'anzucht', 'ph', { min: 6.0, max: 6.8 }),
    sollwert('mangold', 'anzucht', 'ec', { min: 0.8, max: 1.2, basis: 'gesamt' }),
    sollwert('mangold', 'wachstum', 'ph', { min: 6.0, max: 6.8 }),
    sollwert('mangold', 'wachstum', 'ec', { min: 1.0, max: 1.6, basis: 'gesamt' }),
    ...(e.ohneDauern
      ? []
      : SORTEN.flatMap(([s]) => [
          sollwert(s, 'keimung', 'dauer', { min: 4, typ: 6, max: 8 }),
          sollwert(s, 'anzucht', 'dauer', { min: 18, typ: 21, max: 28 }),
        ])),
  ];
  t['v_netztopf_platz'] = netztopfPlatz(t);
  return t;
}

/** Messung am Platz (Spalten wie public.messung, soweit die Passung sie liest) */
export function messungDazu(
  t: Teile,
  e: { platzId: string; giltAb: string; temperatur: number | null; storniertAm?: string; messart?: string },
): string {
  const id = uid('24', (t['messung'] ?? []).length + 101);
  (t['messung'] ??= []).push({
    id,
    client_id: id,
    platz_id: e.platzId,
    messgeraet_id: uid('23', 1),
    messart: e.messart ?? 'rundgang',
    ph: 6.0,
    ec: 1.2,
    temperatur: e.temperatur,
    fuellstand: null,
    gilt_ab: e.giltAb,
    storniert_am: e.storniertAm ?? null,
  });
  return id;
}

export {
  ereignisDazu,
  netztopfId,
  pflanzungId,
  platzId,
  PLUS_3,
  RESERVIERT_23,
  satzDazu,
  satzId,
  STEHEND_23,
  ZB_JETZT,
} from './zielbereich.ts';
