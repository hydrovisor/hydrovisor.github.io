// Teile für «Phasen nachführen und Phasenfragen» (Plan 35 Testliste): Regal R mit Wissen aus tests/fixtures/saeen.ts
// (ohne den Satz in 2.3), dazu Dauern und Wechselmerkmale aller Phasen in v_sollwert, drei weitere Sorten der Welle 1
// und Sätze mit Pflanzungen, deren Ort in v_pflanzung_zustand steht. Phasenantworten am Satz (Tabelle ereignis, typ
// phase_antwort); die Phase der Pflanzungen und den Bündelteil ereignis_satz rechnet phaseNachrechnen() aus
// tests/fixtures/sichten.ts nach. Gemeinsam für Unit und E2E. Ohne Personendaten.
//
// Werte, auf die die Tests rechnen (Dauern in Tagen min/typ/max, A2: Fixture-Werte, nicht W0):
// - Salat (Lollo Rossa, Eichblatt, Eissalat): Keimung 2/4/7 (aus saeen.ts), Anzucht 10/12/14 mit Merkmal «Wurzeln
//   unter dem Schwamm sichtbar», Wachstum 20/30/40; Kopf endet in Wachstum.
// - Tomate (Ochsenherz): Keimung 5/7/10, Anzucht 21/25/28 (TZ7) mit Merkmal «Vier echte Laubblätter», Wachstum
//   20/30/40, Blüte 10/14/21, Fruchtbildung und Reife 40/60/90.
// - Chili (Cayenne): Keimung 7/10/14, Anzucht 28/35/42, Wachstum 20/30/40, Blüte 10/14/21, Fruchtbildung 50/70/100.
// - Petersilie (Mooskrause): Keimung 10/14/21 (statt 14/21/28 aus saeen.ts, damit der typische Keimtag der Welle 1
//   vor dem 26.1. liegt, A2), Anzucht 21/28/35, Wachstum 30/40/60.
// - Schnittlauch: Keimung 7/10/14, Anzucht 21/28/35, Wachstum 30/40/60. Nüsslisalat: Keimung 7/10/14, Anzucht
//   14/21/28, Wachstum 20/30/40. Rucola: Keimung 2/3/5 (saeen.ts), Anzucht 7/10/14, Wachstum 14/21/28.
// - Keimung endet mit dem Merkmal «Keimblätter offen».
// - Welle 1 (Konzept 14.1): 13 Sätze, gesät und erfasst 7.1.2027: 4 × Ochsenherz und Lollo Rossa, Eissalat in A1,
//   4 × Cayenne, Schnittlauch, Petersilie in A3, Nüsslisalat als Direktsaat in 3.1.
// - Bündelung (Uhr 10.2.2027): Lollo Rossa (61) und Eichblatt (62) gesät 7.1. auf 4.4, Anzucht seit 11.1. (Frage
//   23.1.); Eichblatt (63) gesät 21.1. auf 4.4, Anzucht seit 25.1. (Frage 6.2.); Ochsenherz (64) gesät 7.1. auf 4.2,
//   Anzucht seit 14.1. (Frage 8.2.); Lollo Rossa (65) gesät 7.1. auf 4.4 ohne aktive Pflanzung (alle ausgefallen).
// - Rückdatiert (TZ8): Lollo Rossa (70) und Ochsenherz (71), gesät 1.1., erfasst 12.1. 10:00 Zürich, in A1.
import { platzId, uid, type Teile } from './regal.ts';
import { saatTeile, SORTE } from './saeen.ts';
import { phaseNachrechnen, pflanzSichtenNachrechnen, sichtenNachrechnen } from './sichten.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };
const gueltig = { gueltig_bis: null };

/** weitere Sorten der Welle 1 */
export const SORTE_W1 = {
  eissalat: uid('26', 11),
  schnittlauch: uid('26', 12),
  nuesslisalat: uid('26', 13),
} as const;

export { SORTE };

type Dauer = [number | null, number | null, number | null];
type Phase = 'keimung' | 'anzucht' | 'wachstum' | 'bluete' | 'fruchtbildung_reife';

export const MERKMAL = {
  keimung: 'Keimblätter offen',
  salatAnzucht: 'Wurzeln unter dem Schwamm sichtbar',
  tomateAnzucht: 'Vier echte Laubblätter',
  wachstum: 'Erste Blütenknospe',
  bluete: 'Erste Frucht angesetzt',
} as const;

const SALAT: [Phase, Dauer, string?][] = [
  ['anzucht', [10, 12, 14], MERKMAL.salatAnzucht],
  ['wachstum', [20, 30, 40]],
];
const FRUCHT_TOMATE: [Phase, Dauer, string?][] = [
  ['anzucht', [21, 25, 28], MERKMAL.tomateAnzucht],
  ['wachstum', [20, 30, 40], MERKMAL.wachstum],
  ['bluete', [10, 14, 21], MERKMAL.bluete],
  ['fruchtbildung_reife', [40, 60, 90]],
];
const FRUCHT_CHILI: [Phase, Dauer, string?][] = [
  ['anzucht', [28, 35, 42], MERKMAL.tomateAnzucht],
  ['wachstum', [20, 30, 40], MERKMAL.wachstum],
  ['bluete', [10, 14, 21], MERKMAL.bluete],
  ['fruchtbildung_reife', [50, 70, 100]],
];

/** Dauern je Sorte ab Anzucht (Keimung aus saeen.ts, ausser wo hier überschrieben) */
const PHASEN_JE_SORTE: [string, [Phase, Dauer, string?][], Dauer?][] = [
  [SORTE.lollo, SALAT],
  [SORTE.eichblatt, SALAT],
  [SORTE_W1.eissalat, SALAT, [2, 4, 7]],
  [SORTE.ochsenherz, FRUCHT_TOMATE],
  [SORTE.cayenne, FRUCHT_CHILI],
  [
    SORTE.mooskrause,
    [
      ['anzucht', [21, 28, 35]],
      ['wachstum', [30, 40, 60]],
    ],
    [10, 14, 21],
  ],
  [
    SORTE_W1.schnittlauch,
    [
      ['anzucht', [21, 28, 35]],
      ['wachstum', [30, 40, 60]],
    ],
    [7, 10, 14],
  ],
  [
    SORTE_W1.nuesslisalat,
    [
      ['anzucht', [14, 21, 28]],
      ['wachstum', [20, 30, 40]],
    ],
    [7, 10, 14],
  ],
  [
    SORTE.rucola,
    [
      ['anzucht', [7, 10, 14]],
      ['wachstum', [14, 21, 28]],
    ],
  ],
];

const sollwertZeile = (sorteId: string, phase: Phase, groesse: string, w: Zeile): Zeile => ({
  sorte_id: sorteId,
  phase,
  groesse,
  wert_min: null,
  wert_typ: null,
  wert_max: null,
  text_wert: null,
  herkunft_ebene: 'art',
  ...w,
});

/** Dauer einer Phase setzen (ersetzt die vorhandene Zeile); null = Wert fehlt */
export function dauerSetzen(t: Teile, sorteId: string, phase: Phase, [min, typ, max]: Dauer): void {
  t['v_sollwert'] = (t['v_sollwert'] ?? []).filter(
    (z) => !(z['sorte_id'] === sorteId && z['phase'] === phase && z['groesse'] === 'dauer'),
  );
  t['v_sollwert'].push(
    sollwertZeile(sorteId, phase, 'dauer', { wert_min: min, wert_typ: typ, wert_max: max }),
  );
}

/** Wechselmerkmal einer Phase setzen oder (undefined) entfernen */
export function merkmalSetzen(t: Teile, sorteId: string, phase: Phase, text: string | undefined): void {
  t['v_sollwert'] = (t['v_sollwert'] ?? []).filter(
    (z) => !(z['sorte_id'] === sorteId && z['phase'] === phase && z['groesse'] === 'wechselmerkmal'),
  );
  if (text !== undefined)
    t['v_sollwert'].push(sollwertZeile(sorteId, phase, 'wechselmerkmal', { text_wert: text }));
}

/** Grösse anwendbar einer Phase setzen (ja oder entfaellt) */
export function anwendbarSetzen(t: Teile, sorteId: string, phase: Phase, wert: 'ja' | 'entfaellt'): void {
  t['v_sollwert'] = (t['v_sollwert'] ?? []).filter(
    (z) => !(z['sorte_id'] === sorteId && z['phase'] === phase && z['groesse'] === 'anwendbar'),
  );
  t['v_sollwert'].push(sollwertZeile(sorteId, phase, 'anwendbar', { text_wert: wert }));
}

/** Regal R mit Wissen und Dauern aller Phasen, ohne Sätze */
export function phasenTeile(jetzt: Date): Teile {
  const t = saatTeile(jetzt, { ohneSatzIn23: true });
  t['art'] = [
    ...(t['art'] ?? []),
    ...[
      ['allium_schoenoprasum', 'Schnittlauch', ['dauerkultur_blatt'], 'dauerkultur_blatt'],
      ['valerianella_locusta', 'Nüsslisalat', ['babyleaf', 'kopf'], 'babyleaf'],
    ].map(([art, name, formen, vorgabe], i) => ({
      id: uid('35', 20 + i),
      art_id: art,
      name_de: name,
      kulturformen_erlaubt: formen,
      kulturform_vorgabe: vorgabe,
      umsetzen_ab_d: 28,
      umsetzen_bis_d: 35,
      standard_keimfaehigkeit: 0.7,
      ...gueltig,
    })),
  ];
  t['sorte'] = [
    ...(t['sorte'] ?? []),
    ...[
      [SORTE_W1.eissalat, 'Eissalat', 'lactuca_sativa'],
      [SORTE_W1.schnittlauch, 'Schnittlauch', 'allium_schoenoprasum'],
      [SORTE_W1.nuesslisalat, 'Nüsslisalat', 'valerianella_locusta'],
    ].map(([sorteId, name, art], i) => ({
      id: uid('25', 20 + i),
      sorte_id: sorteId,
      name,
      art_id: art,
      kulturtyp: 'blatt',
      ...gueltig,
    })),
  ];
  for (const [sorteId, phasen, keimung] of PHASEN_JE_SORTE) {
    if (keimung) dauerSetzen(t, sorteId, 'keimung', keimung);
    merkmalSetzen(t, sorteId, 'keimung', MERKMAL.keimung);
    for (const [phase, dauer, merkmal] of phasen) {
      dauerSetzen(t, sorteId, phase, dauer);
      if (merkmal) merkmalSetzen(t, sorteId, phase, merkmal);
    }
  }
  t['reservierung'] = [];
  t['ereignis_pflanzung'] = [];
  t['ereignis_satz'] = [];
  t['wissenseintrag'] = [];
  return t;
}

export const satzId = (nr: number) => uid('27', nr);
/** Pflanzung i (1 bis n) des Satzes nr */
export const pflanzungVon = (nr: number, i = 1) => uid('28', nr * 100 + i);

export interface PhasenSatzDef {
  nr: number;
  sorteId: string;
  kulturform: string;
  saatdatum: string;
  /** Anzuchtbox (Kennung); Standard A1 */
  box?: string;
  /** Kennung des Direktsaat-Gefässes statt der Box */
  direktsaat?: string;
  /** Platz der Pflanzungen in v_pflanzung_zustand (Station oder Gefäss); ohne = am Anzuchtort */
  platz?: string;
  /** Zahl der Pflanzungen; Standard 2 */
  pflanzungen?: number;
  /** Erfassungszeitpunkt des Satzes (client_zeit, erfasst_am); Standard Saattag 12:00 Zürich */
  erfasstAm?: string;
  /** Status aller Pflanzungen; Standard aktiv */
  status?: string;
}

/** Satz mit Pflanzungen und Zeilen in v_pflanzung_zustand anlegen; gibt die Pflanzungs-IDs zurück */
export function phasenSatz(t: Teile, d: PhasenSatzDef): string[] {
  const id = satzId(d.nr);
  const gilt = `${d.saatdatum}T11:00:00.000Z`;
  const erfasst = d.erfasstAm ?? gilt;
  (t['satz'] ??= []).push({
    id,
    client_id: id,
    sorte_id: d.sorteId,
    saatgut_id: null,
    kulturform: d.kulturform,
    anzuchtort_platz_id: d.direktsaat ? null : platzId(d.box ?? 'A1'),
    direktsaat_platz_id: d.direktsaat ? platzId(d.direktsaat) : null,
    anzahl_schwaemme: d.pflanzungen ?? 2,
    samen_je_schwamm: 1,
    saatdatum: d.saatdatum,
    gilt_ab: gilt,
    client_zeit: erfasst,
    erfasst_am: erfasst,
    ...o,
  });
  const ids = Array.from({ length: d.pflanzungen ?? 2 }, (_, i) => pflanzungVon(d.nr, i + 1));
  // Löcher am Platz fortlaufend nach den schon belegten
  const belegt = d.platz
    ? (t['v_pflanzung_zustand'] ?? []).filter((z) => z['platz_id'] === platzId(d.platz ?? '')).length
    : 0;
  ids.forEach((p, i) => {
    (t['pflanzung'] ??= []).push({
      id: p,
      client_id: p,
      satz_id: id,
      gilt_ab: gilt,
      client_zeit: erfasst,
      ...o,
    });
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: p,
      satz_id: id,
      phase: 'keimung',
      phase_seit: null,
      status: d.status ?? 'aktiv',
      netztopf_id: null,
      platz_id: d.platz ? platzId(d.platz) : null,
      loch_nr: d.platz ? belegt + i + 1 : null,
    });
  });
  return ids;
}

let antwortNr = 0;
/** Phasenantwort am Satz wie aus einer früheren Erfassung (gilt_ab Tag 12:00 Zürich, Winterzeit) */
export function antwortDazu(
  t: Teile,
  a: {
    nr: number;
    phase: Phase;
    antwort?: 'ja' | 'noch_nicht' | 'problem';
    tag: string;
    erwartetAm?: string;
    nachgefuehrt?: boolean;
    id?: string;
  },
): string {
  antwortNr += 1;
  const id = a.id ?? uid('3f', antwortNr);
  const gilt = `${a.tag}T11:00:00.000Z`;
  (t['ereignis'] ??= []).push({
    id,
    client_id: id,
    typ: 'phase_antwort',
    satz_id: satzId(a.nr),
    pflanzung_id: null,
    daten: {
      phase: a.phase,
      antwort: a.antwort ?? 'ja',
      ...(a.erwartetAm ? { erwartet_am: a.erwartetAm } : {}),
      nachgefuehrt: a.nachgefuehrt ?? false,
    },
    gilt_ab: gilt,
    client_zeit: gilt,
    erfasst_am: gilt,
    ersetzt_id: null,
    ...o,
  });
  return id;
}

/** Sichten nachrechnen: Gefässe, Pflanzungen, Phase und ereignis_satz */
export function phasenNachrechnen(t: Teile): Teile {
  return phaseNachrechnen(pflanzSichtenNachrechnen(sichtenNachrechnen(t)));
}

export const WELLE1_JETZT = new Date('2027-01-26T08:00:00Z');
export const WELLE1_SAAT = '2027-01-07';
/** Satz-Nummern der Welle 1 */
export const WELLE1 = {
  tomaten: [41, 42, 43, 44],
  chili: [45, 46, 47, 48],
  lollo: 49,
  eissalat: 50,
  schnittlauch: 51,
  petersilie: 52,
  nuesslisalat: 53,
} as const;

/** Welle 1 nach Konzept 14.1: 13 Sätze, gesät und erfasst 7.1.2027, ohne Phasenantwort */
export function welle1Teile(jetzt = WELLE1_JETZT): Teile {
  const t = phasenTeile(jetzt);
  const s = (nr: number, sorteId: string, kulturform: string, ort: { box?: string; direktsaat?: string }) =>
    phasenSatz(t, { nr, sorteId, kulturform, saatdatum: WELLE1_SAAT, ...ort });
  for (const nr of WELLE1.tomaten) s(nr, SORTE.ochsenherz, 'dauerkultur_frucht', { box: 'A1' });
  for (const nr of WELLE1.chili) s(nr, SORTE.cayenne, 'dauerkultur_frucht', { box: 'A3' });
  s(WELLE1.lollo, SORTE.lollo, 'kopf', { box: 'A1' });
  s(WELLE1.eissalat, SORTE_W1.eissalat, 'kopf', { box: 'A1' });
  s(WELLE1.schnittlauch, SORTE_W1.schnittlauch, 'dauerkultur_blatt', { box: 'A3' });
  s(WELLE1.petersilie, SORTE.mooskrause, 'schnitt', { box: 'A3' });
  s(WELLE1.nuesslisalat, SORTE_W1.nuesslisalat, 'babyleaf', { direktsaat: '3.1' });
  return phasenNachrechnen(t);
}

export const BUENDEL_JETZT = new Date('2027-02-10T08:00:00Z');

/**
 * Bündelung: Sätze 61 bis 65 (siehe Kopf). `ohneSpaete`: ohne 63 und 65 (für Uhren vor dem 25.1., E2E am 23.1.).
 */
export function buendelTeile(
  jetzt = BUENDEL_JETZT,
  { ohneSpaete = false }: { ohneSpaete?: boolean } = {},
): Teile {
  const t = phasenTeile(jetzt);
  phasenSatz(t, { nr: 61, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-07', platz: '4.4' });
  antwortDazu(t, { nr: 61, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
  phasenSatz(t, {
    nr: 62,
    sorteId: SORTE.eichblatt,
    kulturform: 'kopf',
    saatdatum: '2027-01-07',
    platz: '4.4',
  });
  antwortDazu(t, { nr: 62, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
  if (!ohneSpaete) {
    phasenSatz(t, {
      nr: 63,
      sorteId: SORTE.eichblatt,
      kulturform: 'kopf',
      saatdatum: '2027-01-21',
      platz: '4.4',
    });
    antwortDazu(t, { nr: 63, phase: 'anzucht', tag: '2027-01-25', erwartetAm: '2027-01-25' });
  }
  phasenSatz(t, {
    nr: 64,
    sorteId: SORTE.ochsenherz,
    kulturform: 'dauerkultur_frucht',
    saatdatum: '2027-01-07',
    platz: '4.2',
  });
  antwortDazu(t, { nr: 64, phase: 'anzucht', tag: '2027-01-14', erwartetAm: '2027-01-14' });
  if (!ohneSpaete) {
    phasenSatz(t, {
      nr: 65,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: '2027-01-07',
      platz: '4.4',
      status: 'ausfall',
    });
    antwortDazu(t, { nr: 65, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
  }
  return phasenNachrechnen(t);
}

export const RUECK_JETZT = new Date('2027-01-12T09:00:00Z');

/** TZ8: Lollo Rossa (70) und Ochsenherz (71), gesät 1.1., erfasst 12.1. 10:00 Zürich, in A1 */
export function rueckdatiertTeile(jetzt = RUECK_JETZT): Teile {
  const t = phasenTeile(jetzt);
  const erfasstAm = '2027-01-12T09:00:00.000Z';
  phasenSatz(t, { nr: 70, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-01', erfasstAm });
  phasenSatz(t, {
    nr: 71,
    sorteId: SORTE.ochsenherz,
    kulturform: 'dauerkultur_frucht',
    saatdatum: '2027-01-01',
    erfasstAm,
  });
  return phasenNachrechnen(t);
}
