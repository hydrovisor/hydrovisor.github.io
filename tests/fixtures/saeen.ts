// Teile des Bündels für «Säen» (Plan 23 Testliste): Regal R aus tests/fixtures/regal.ts plus Wissen in Bündelform
// (art, sorte, saatempfehlung, v_sollwert mit Keimwerten), Packungen (saatgut, v_keimrate), v_netztopf_platz und
// einstellung. Echte art_id der Startbelegung (lactuca_sativa, solanum_lycopersicum, capsicum_annuum,
// petroselinum_crispum, eruca_vesicaria); Sortennamen ohne Personendaten. Gemeinsam für Unit und E2E.
//
// Werte, auf die die Tests rechnen:
// - Lollo Rossa (Salat, Lichtkeimer, Keimdauer 2/4/7, Umsetzen ab 21 d): jüngste Packung 0.9 (ältere 0.6), Empfehlung
//   der Art für kopf 1 Samen, Obergrenze 3, 1 Pflanze stehen lassen. Der Satz in 2.3 aus regalTeile() ist Lollo Rossa.
// - Eichblatt (Salat, Lichtkeimer): Packung 0.7.
// - Ochsenherz (Tomate, Lichtkeimer nach E3, Keimdauer 5/7/10, Umsetzen ab 28 d): Packung 0.85, Empfehlung 1/2/1.
// - Cayenne (Chili, Dunkelkeimer, Keimdauer 7/10/14, Umsetzen ab 35 d): Packung 0.7, Empfehlung 2/3/1.
// - Mooskrause (Petersilie, Dunkelkeimer, ohne «Umsetzen ab»): Packung ohne Angabe, Standard der Art 0.65,
//   Empfehlung schnitt 15 Samen, Obergrenze 15, 10 Pflanzen stehen lassen.
// - Rucola (Keimart indifferent, Keimdauer 2/3/5, Umsetzen ab 14 d): Packung ohne Angabe, Standard 0.9.
import { ANLAGE_R, platzId, regalTeile, uid, type Teile } from './regal.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };
const gueltig = { gueltig_bis: null };

export const SORTE = {
  lollo: uid('26', 1),
  eichblatt: uid('26', 2),
  ochsenherz: uid('26', 3),
  cayenne: uid('26', 4),
  mooskrause: uid('26', 5),
  rucola: uid('26', 6),
} as const;

export const PACKUNG = {
  lollo: uid('29', 1),
  lolloAlt: uid('29', 11),
  eichblatt: uid('29', 2),
  ochsenherz: uid('29', 3),
  cayenne: uid('29', 4),
  mooskrause: uid('29', 5),
  rucola: uid('29', 6),
} as const;

/** Satz aus regalTeile(): Lollo Rossa in A1 gesät, drei Pflanzungen auf 2.3 Loch 1 bis 3 */
export const SATZ_IN_23 = uid('27', 1);

const ARTEN: Zeile[] = [
  {
    art_id: 'lactuca_sativa',
    name_de: 'Salat',
    kulturformen_erlaubt: ['babyleaf', 'schnitt', 'kopf'],
    kulturform_vorgabe: 'kopf',
    umsetzen_ab_d: 21,
    umsetzen_bis_d: 28,
    standard_keimfaehigkeit: 0.8,
  },
  {
    art_id: 'solanum_lycopersicum',
    name_de: 'Tomate',
    kulturformen_erlaubt: ['dauerkultur_frucht'],
    kulturform_vorgabe: 'dauerkultur_frucht',
    umsetzen_ab_d: 28,
    umsetzen_bis_d: 35,
    standard_keimfaehigkeit: 0.85,
  },
  {
    art_id: 'capsicum_annuum',
    name_de: 'Chili',
    kulturformen_erlaubt: ['dauerkultur_frucht'],
    kulturform_vorgabe: 'dauerkultur_frucht',
    umsetzen_ab_d: 35,
    umsetzen_bis_d: 42,
    standard_keimfaehigkeit: 0.7,
  },
  {
    art_id: 'petroselinum_crispum',
    name_de: 'Petersilie',
    kulturformen_erlaubt: ['schnitt', 'dauerkultur_blatt'],
    kulturform_vorgabe: 'schnitt',
    umsetzen_ab_d: null,
    umsetzen_bis_d: null,
    standard_keimfaehigkeit: 0.65,
  },
  {
    art_id: 'eruca_vesicaria',
    name_de: 'Rucola',
    kulturformen_erlaubt: ['babyleaf', 'schnitt'],
    kulturform_vorgabe: 'babyleaf',
    umsetzen_ab_d: 14,
    umsetzen_bis_d: 21,
    standard_keimfaehigkeit: 0.9,
  },
];

interface Sortendef {
  id: string;
  name: string;
  art_id: string;
  kulturtyp: 'blatt' | 'frucht' | 'knolle';
  keimart: 'licht' | 'dunkel' | 'indifferent';
  keimdauer: [number, number, number];
  keimtemp: [number, number, number];
}

const SORTEN: Sortendef[] = [
  {
    id: SORTE.lollo,
    name: 'Lollo Rossa',
    art_id: 'lactuca_sativa',
    kulturtyp: 'blatt',
    keimart: 'licht',
    keimdauer: [2, 4, 7],
    keimtemp: [15, 18, 20],
  },
  {
    id: SORTE.eichblatt,
    name: 'Eichblatt',
    art_id: 'lactuca_sativa',
    kulturtyp: 'blatt',
    keimart: 'licht',
    keimdauer: [2, 4, 7],
    keimtemp: [15, 18, 20],
  },
  {
    id: SORTE.ochsenherz,
    name: 'Ochsenherz',
    art_id: 'solanum_lycopersicum',
    kulturtyp: 'frucht',
    keimart: 'licht',
    keimdauer: [5, 7, 10],
    keimtemp: [20, 24, 28],
  },
  {
    id: SORTE.cayenne,
    name: 'Cayenne',
    art_id: 'capsicum_annuum',
    kulturtyp: 'frucht',
    keimart: 'dunkel',
    keimdauer: [7, 10, 14],
    keimtemp: [22, 26, 30],
  },
  {
    id: SORTE.mooskrause,
    name: 'Mooskrause',
    art_id: 'petroselinum_crispum',
    kulturtyp: 'blatt',
    keimart: 'dunkel',
    keimdauer: [14, 21, 28],
    keimtemp: [18, 20, 24],
  },
  {
    id: SORTE.rucola,
    name: 'Rucola',
    art_id: 'eruca_vesicaria',
    kulturtyp: 'blatt',
    keimart: 'indifferent',
    keimdauer: [2, 3, 5],
    keimtemp: [12, 18, 24],
  },
];

const EMPFEHLUNGEN: [string, string, number, number, number][] = [
  // art_id, kulturform, samen_je_schwamm, obergrenze_samen, pflanzen_stehen_lassen
  ['lactuca_sativa', 'kopf', 1, 3, 1],
  ['lactuca_sativa', 'babyleaf', 3, 4, 3],
  ['lactuca_sativa', 'schnitt', 3, 4, 3],
  ['solanum_lycopersicum', 'dauerkultur_frucht', 1, 2, 1],
  ['capsicum_annuum', 'dauerkultur_frucht', 2, 3, 1],
  ['petroselinum_crispum', 'schnitt', 15, 15, 10],
  ['eruca_vesicaria', 'babyleaf', 3, 4, 3],
];

const PACKUNGEN: [string, string, number | null, number, string][] = [
  // id, sorte_id, keimfaehigkeit_packung, rate_geglaettet, erfasst_am
  [PACKUNG.lolloAlt, SORTE.lollo, 0.6, 0.6, '2026-03-01T10:00:00Z'],
  [PACKUNG.lollo, SORTE.lollo, 0.9, 0.9, '2026-11-20T10:00:00Z'],
  [PACKUNG.eichblatt, SORTE.eichblatt, 0.7, 0.7, '2026-11-20T10:00:00Z'],
  [PACKUNG.ochsenherz, SORTE.ochsenherz, 0.85, 0.85, '2026-11-20T10:00:00Z'],
  [PACKUNG.cayenne, SORTE.cayenne, 0.7, 0.7, '2026-11-20T10:00:00Z'],
  [PACKUNG.mooskrause, SORTE.mooskrause, null, 0.65, '2026-11-20T10:00:00Z'],
  [PACKUNG.rucola, SORTE.rucola, null, 0.9, '2026-11-20T10:00:00Z'],
];

/** Wissen und Packungen als Teile (Bündelform) */
export function saatWissen(): Teile {
  const sollwert = (s: Sortendef, groesse: string, w: Zeile) => ({
    sorte_id: s.id,
    phase: 'keimung',
    groesse,
    wert_min: null,
    wert_typ: null,
    wert_max: null,
    text_wert: null,
    herkunft_ebene: 'art',
    ...w,
  });
  return {
    art: ARTEN.map((a, i) => ({ id: uid('35', i + 1), ...a, ...gueltig })),
    sorte: SORTEN.map((s, i) => ({
      id: uid('25', i + 1),
      sorte_id: s.id,
      name: s.name,
      art_id: s.art_id,
      kulturtyp: s.kulturtyp,
      ...gueltig,
    })),
    saatempfehlung: EMPFEHLUNGEN.map(([art, kulturform, samen, ober, stehen], i) => ({
      id: uid('36', i + 1),
      ebene: 'art',
      art_id: art,
      sorte_id: null,
      kulturform,
      samen_je_schwamm: samen,
      obergrenze_samen: ober,
      pflanzen_stehen_lassen: stehen,
      klasse_saatmenge: 'C',
      ...gueltig,
    })),
    v_sollwert: SORTEN.flatMap((s) => [
      sollwert(s, 'keimart', { text_wert: s.keimart }),
      sollwert(s, 'dauer', { wert_min: s.keimdauer[0], wert_typ: s.keimdauer[1], wert_max: s.keimdauer[2] }),
      sollwert(s, 'keimtemp', { wert_min: s.keimtemp[0], wert_typ: s.keimtemp[1], wert_max: s.keimtemp[2] }),
    ]),
    saatgut: PACKUNGEN.map(([id, sorte, packung, , erfasst]) => ({
      id,
      client_id: id,
      sorte_id: sorte,
      kaufdatum: erfasst.slice(0, 10),
      bestand_korn: 100,
      keimfaehigkeit_packung: packung,
      erfasst_am: erfasst,
      ...o,
    })),
    v_keimrate: PACKUNGEN.map(([id, , , rate]) => ({
      saatgut_id: id,
      gesaet: 0,
      gekeimt: 0,
      rate_geglaettet: rate,
    })),
    einstellung: [
      {
        id: uid('34', 1),
        thema: 'hell',
        zeitzone: 'Europe/Zurich',
        feste_kalibriertermine: ['2027-01-01', '2027-01-31', '2027-02-24', '2027-03-24'],
        stationsgrenze_ab: '2027-02-04',
      },
    ],
  };
}

/** v_netztopf_platz wie die Sicht: aktueller Platz = Heimplatz (keine Ortsereignisse in der Fixture) */
export function netztopfPlatz(t: Teile): Zeile[] {
  return (t['netztopf'] ?? [])
    .filter((n) => n['storniert_am'] === null && n['aktiv'] !== false)
    .map((n) => ({
      netztopf_id: n['id'],
      kennung: n['kennung'],
      platz_id: n['heim_platz_id'],
      loch_nr: n['heim_loch_nr'],
      ausser_heim: false,
    }));
}

/**
 * Regal R zum Säen am 7.1.2027. `ohneSatzIn23`: ohne den Satz in 2.3 (alle sechs Töpfe frei, keine
 * «Wie letztes Mal»-Sorte), wie es Plan 23 für UC5-AK1 verlangt.
 */
export function saatTeile(
  jetzt = new Date('2027-01-07T08:00:00Z'),
  { ohneSatzIn23 = false }: { ohneSatzIn23?: boolean } = {},
): Teile {
  const t = regalTeile(jetzt);
  const w = saatWissen();
  for (const [name, zeilen] of Object.entries(w)) t[name] = zeilen;
  if (ohneSatzIn23) {
    t['satz'] = [];
    t['pflanzung'] = [];
    t['v_pflanzung_zustand'] = [];
  } else {
    for (const s of t['satz'] ?? []) s['saatgut_id'] = PACKUNG.lolloAlt;
  }
  t['v_netztopf_platz'] = netztopfPlatz(t);
  t['v_reservierung_aktiv'] = [];
  return t;
}

/** Stationsplätze 5 cm in fester Reihenfolge: 4.1 (D6, 6), 4.4 (S5, 13), 4.5 (S5, 13) */
export const STATION_5CM: [string, number][] = [
  ...Array.from({ length: 6 }, (_, i): [string, number] => ['4.1', i + 1]),
  ...Array.from({ length: 13 }, (_, i): [string, number] => ['4.4', i + 1]),
  ...Array.from({ length: 13 }, (_, i): [string, number] => ['4.5', i + 1]),
];

/**
 * Ein Satz mit Pflanzungen auf der Station (aktiv, Phase Anzucht) an den gegebenen Löchern; ohne Reservierung
 * verlässt er die Station nach R6.1 (A10) am Saatdatum + umsetzen_ab_d der Art.
 */
export function aufStation(
  t: Teile,
  e: { satzNr: number; sorteId: string; saatdatum: string; loecher: [string, number][]; box?: string },
): string[] {
  const satzId = uid('27', e.satzNr);
  const gilt = `${e.saatdatum}T11:00:00.000Z`;
  (t['satz'] ??= []).push({
    id: satzId,
    client_id: satzId,
    sorte_id: e.sorteId,
    saatgut_id: null,
    kulturform: 'kopf',
    anzuchtort_platz_id: platzId(e.box ?? 'A1'),
    direktsaat_platz_id: null,
    anzahl_schwaemme: e.loecher.length,
    samen_je_schwamm: 1,
    saatdatum: e.saatdatum,
    gilt_ab: gilt,
    ...o,
  });
  const ids = e.loecher.map((_, i) => uid('28', e.satzNr * 100 + i + 1));
  ids.forEach((id, i) => {
    const [kennung, loch] = e.loecher[i] as [string, number];
    (t['pflanzung'] ??= []).push({ id, client_id: id, satz_id: satzId, gilt_ab: gilt, ...o });
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: id,
      satz_id: satzId,
      phase: 'anzucht',
      phase_seit: gilt,
      status: 'aktiv',
      netztopf_id: null,
      platz_id: platzId(kennung),
      loch_nr: loch,
    });
  });
  return ids;
}

/** Satz in der Box (noch nicht gekeimt): Pflanzungen ohne Ort (v_pflanzung_zustand ohne platz_id) */
export function inDerBox(
  t: Teile,
  e: { satzNr: number; sorteId: string; saatdatum: string; schwaemme: number; box?: string },
): string[] {
  const satzId = uid('27', e.satzNr);
  const gilt = `${e.saatdatum}T11:00:00.000Z`;
  (t['satz'] ??= []).push({
    id: satzId,
    client_id: satzId,
    sorte_id: e.sorteId,
    saatgut_id: null,
    kulturform: 'kopf',
    anzuchtort_platz_id: platzId(e.box ?? 'A1'),
    direktsaat_platz_id: null,
    anzahl_schwaemme: e.schwaemme,
    samen_je_schwamm: 1,
    saatdatum: e.saatdatum,
    gilt_ab: gilt,
    ...o,
  });
  const ids = Array.from({ length: e.schwaemme }, (_, i) => uid('28', e.satzNr * 100 + i + 1));
  for (const id of ids) {
    (t['pflanzung'] ??= []).push({ id, client_id: id, satz_id: satzId, gilt_ab: gilt, ...o });
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: id,
      satz_id: satzId,
      phase: 'keimung',
      phase_seit: null,
      status: 'aktiv',
      netztopf_id: null,
      platz_id: null,
      loch_nr: null,
    });
  }
  return ids;
}

/** aktive Reservierung wie eine Zeile aus v_reservierung_aktiv */
export function reservierung(
  t: Teile,
  e: { nr: number; pflanzungId: string; netztopfId: string; vorgabe: string; geplant?: string },
): void {
  const id = uid('30', e.nr);
  (t['v_reservierung_aktiv'] ??= []).push({
    id,
    client_id: id,
    pflanzung_id: e.pflanzungId,
    netztopf_id: e.netztopfId,
    umsetzen_vorgabe_am: e.vorgabe,
    umsetzen_geplant_am: e.geplant ?? e.vorgabe,
    gilt_ab: '2027-01-01T11:00:00.000Z',
    ...o,
  });
}

export { ANLAGE_R };
