// Teile des Bündels für den Zielbereich nach Zweck, die Leitkultur und das Stadium (Plan 34 Testliste, A2; Konzept
// R2.1 bis R2.3, R4.3). Regal R aus tests/fixtures/regal.ts ohne den Betrieb (Sätze, Pflanzungen, Ansätze, Messungen),
// dazu Arten, Sorten, Kulturformen und v_sollwert in Bündelform. Ohne Personendaten; Sorten sind Handelsnamen.
//
// Werte, auf die die Tests rechnen (Uhr ZB_JETZT 2027-01-18T08:00:00Z = Zürich Mo 18.1. 09:00, heute + 3 = 21.1.):
// - 2.3 DWC 9 l (D2, Töpfe 2.3.1 bis 2.3.6): Satz 1 Lollo Rossa (Kopf, gesät 1.12.2026) mit 3 Pflanzungen in Wachstum
//   in 2.3.1 bis 2.3.3, umgesetzt am 28.12.2026 (Option umgesetztAm); Satz 2 Eichblatt (Kopf, gesät 12.1.) mit
//   3 Pflanzungen in Keimung in A1, reserviert auf 2.3.4 bis 2.3.6 mit umsetzen_geplant_am 21.1. (Option umsetzenAm).
// - v_sollwert (Testdaten, keine Fachwerte; A2):
//   Salat (Lollo Rossa, Eichblatt): Keimung pH 5.8–6.5, EC 0.6–0.9; Anzucht pH 5.8–6.5, EC 0.8–1.2; Wachstum pH 5.8–6.5,
//     EC 1.0–1.4, Wassertemperatur 18–24 °C.
//   Tomate (Ochsenherz): Anzucht pH 5.8–6.3, EC 1.0–1.6; Wachstum pH 5.8–6.3, EC 1.5–1.8; Blüte pH 5.8–6.3, EC 2.0–3.0;
//     Fruchtbildung und Reife pH 5.8–6.3, EC 2.0–3.5.
//   Basilikum (Genoveser): Anzucht pH 5.8–6.5, EC 0.9–1.6; Wachstum und Blüte pH 5.8–6.5, EC 1.0–1.6.
//   Rucola: Anzucht pH 6.0–6.5, EC 0.3–0.7 Zuwachs; Wachstum pH 6.0–6.5, EC 0.5–0.9 Zuwachs (mit ECWasser 0.5:
//     0.8–1.2 bzw. 1.0–1.4). Spinat (Matador): Keimung ohne Werte; Wachstum pH 6.0–7.0, EC 1.2–1.8.
// - Kulturdauer typisch (art_kulturform): Salat Kopf 56, Salat Schnitt 90, Salat Babyleaf 30, Tomate Dauerkultur Frucht
//   150, Basilikum Dauerkultur Blatt 120, Rucola Babyleaf 30, Spinat Babyleaf 30. Wasserbedarf je Pflanze (art): Salat
//   0.25, Tomate 1.0, Basilikum 0.3, Rucola 0.1, Spinat 0.1 l (Rucola und Spinat im Gleichstand bis Stufe 2).
// - v_ec_wasser der Anlage 0.5; Messgerät u_EC 0.10, u_pH 0.10. v_fuellzustand aus fuellzustandNachrechnen().
import { ANLAGE_R, netztopfId, platzId, regalTeile, uid, type Teile } from './regal.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };
const gueltig = { gueltig_bis: null };

/** Mo 18.1.2027 09:00 Zürich */
export const ZB_JETZT = new Date('2027-01-18T08:00:00Z');
/** heute + 3 zur Uhr ZB_JETZT */
export const PLUS_3 = '2027-01-21';

export const ZB_SORTE = {
  lollo: uid('26', 1),
  eichblatt: uid('26', 2),
  ochsenherz: uid('26', 3),
  genoveser: uid('26', 4),
  rucola: uid('26', 5),
  matador: uid('26', 6),
} as const;
export type SorteName = keyof typeof ZB_SORTE;

export const ART = {
  salat: 'lactuca_sativa',
  tomate: 'solanum_lycopersicum',
  basilikum: 'ocimum_basilicum',
  rucola: 'eruca_vesicaria',
  spinat: 'spinacia_oleracea',
} as const;

const SORTEN: [SorteName, string, string][] = [
  ['lollo', 'Lollo Rossa', ART.salat],
  ['eichblatt', 'Eichblatt', ART.salat],
  ['ochsenherz', 'Ochsenherz', ART.tomate],
  ['genoveser', 'Genoveser', ART.basilikum],
  ['rucola', 'Rucola', ART.rucola],
  ['matador', 'Matador', ART.spinat],
];
export const artVon = (s: SorteName) => SORTEN.find(([n]) => n === s)?.[2] as string;

const ARTEN: [string, string, number | null][] = [
  [ART.salat, 'Salat', 0.25],
  [ART.tomate, 'Tomate', 1.0],
  [ART.basilikum, 'Basilikum', 0.3],
  [ART.rucola, 'Rucola', 0.1],
  [ART.spinat, 'Spinat', 0.1],
];

const KULTURFORMEN: [string, string, number | null][] = [
  [ART.salat, 'kopf', 56],
  [ART.salat, 'schnitt', 90],
  [ART.salat, 'babyleaf', 30],
  [ART.tomate, 'dauerkultur_frucht', 150],
  [ART.basilikum, 'dauerkultur_blatt', 120],
  [ART.rucola, 'babyleaf', 30],
  [ART.spinat, 'babyleaf', 30],
];

/** sorte, phase, groesse, min, max, ec_basis_quelle */
const SOLL: [SorteName, string, string, number, number, string?][] = [
  ...(['lollo', 'eichblatt'] as const).flatMap(
    (s): [SorteName, string, string, number, number, string?][] => [
      [s, 'keimung', 'ph', 5.8, 6.5],
      [s, 'keimung', 'ec', 0.6, 0.9, 'gesamt'],
      [s, 'anzucht', 'ph', 5.8, 6.5],
      [s, 'anzucht', 'ec', 0.8, 1.2, 'gesamt'],
      [s, 'wachstum', 'ph', 5.8, 6.5],
      [s, 'wachstum', 'ec', 1.0, 1.4, 'gesamt'],
      [s, 'wachstum', 'wassertemp', 18, 24],
    ],
  ),
  ['ochsenherz', 'anzucht', 'ph', 5.8, 6.3],
  ['ochsenherz', 'anzucht', 'ec', 1.0, 1.6, 'gesamt'],
  ['ochsenherz', 'wachstum', 'ph', 5.8, 6.3],
  ['ochsenherz', 'wachstum', 'ec', 1.5, 1.8, 'gesamt'],
  ['ochsenherz', 'bluete', 'ph', 5.8, 6.3],
  ['ochsenherz', 'bluete', 'ec', 2.0, 3.0, 'gesamt'],
  ['ochsenherz', 'fruchtbildung_reife', 'ph', 5.8, 6.3],
  ['ochsenherz', 'fruchtbildung_reife', 'ec', 2.0, 3.5, 'gesamt'],
  ['genoveser', 'anzucht', 'ph', 5.8, 6.5],
  ['genoveser', 'anzucht', 'ec', 0.9, 1.6, 'gesamt'],
  ['genoveser', 'wachstum', 'ph', 5.8, 6.5],
  ['genoveser', 'wachstum', 'ec', 1.0, 1.6, 'gesamt'],
  ['genoveser', 'bluete', 'ph', 5.8, 6.5],
  ['genoveser', 'bluete', 'ec', 1.0, 1.6, 'gesamt'],
  ['rucola', 'anzucht', 'ph', 6.0, 6.5],
  ['rucola', 'anzucht', 'ec', 0.3, 0.7, 'zuwachs'],
  ['rucola', 'wachstum', 'ph', 6.0, 6.5],
  ['rucola', 'wachstum', 'ec', 0.5, 0.9, 'zuwachs'],
  ['matador', 'wachstum', 'ph', 6.0, 7.0],
  ['matador', 'wachstum', 'ec', 1.2, 1.8, 'gesamt'],
];

let laufnummer = 0;
const naechste = (praefix: string) => {
  laufnummer += 1;
  return uid(praefix, laufnummer);
};

/** Ereignis an einer Pflanzung, einem Satz oder einem Platz wie eine Zeile der Tabelle ereignis */
export function ereignisDazu(
  t: Teile,
  teil: 'ereignis_pflanzung' | 'ereignis_satz' | 'ereignis_platz',
  e: {
    typ: string;
    giltAb: string;
    pflanzungId?: string;
    satzId?: string;
    netztopfId?: string;
    platzId?: string;
    daten?: Record<string, unknown>;
    storniertAm?: string;
  },
): string {
  const id = naechste('3e');
  (t[teil] ??= []).push({
    id,
    client_id: id,
    typ: e.typ,
    pflanzung_id: e.pflanzungId ?? null,
    satz_id: e.satzId ?? null,
    netztopf_id: e.netztopfId ?? null,
    platz_id: e.platzId ?? null,
    daten: e.daten ?? {},
    gilt_ab: e.giltAb,
    erfasst_am: e.giltAb,
    storniert_am: e.storniertAm ?? null,
  });
  return id;
}

export interface SatzDef {
  nr: number;
  sorte: SorteName;
  kulturform?: string;
  saatdatum: string;
  /** bestätigte Phase (v_pflanzung_zustand.phase) */
  phase: string;
  anzahl: number;
  status?: string;
  /** stehend in diesen Töpfen (Kennungen wie 2.3.1), mit umsetzen am umgesetztAm (ISO) */
  stehend?: { toepfe: string[]; umgesetztAm?: string };
  /** auf einer Station ab Loch 1, Eintritt über verschieben am eintrittAm (ISO) */
  station?: { kennung: string; eintrittAm: string };
  /** Direktsaat in diesem Gefäss (platz_id leer, Platz aus satz.direktsaat_platz_id) */
  direktsaat?: string;
  /** reserviert auf diese Töpfe mit umsetzen_geplant_am */
  reserviert?: { toepfe: string[]; umsetzenAm: string };
  /** Direktsaat: Reservierungen auf diese Zieltöpfe mit umsetzen_geplant_am = Saattag, wie saeen.ts (Plan 34 Runde 1) */
  direktsaatToepfe?: string[];
}

export const satzId = (nr: number) => uid('27', nr);
export const pflanzungId = (nr: number, i: number) => uid('28', nr * 100 + i);
export const reservierungId = (nr: number, i: number) => uid('30', nr * 100 + i);

/** Satz mit Pflanzungen, Zustand, Orts- und Umsetzereignissen und Reservierungen; gibt die Pflanzungen zurück */
export function satzDazu(t: Teile, d: SatzDef): string[] {
  const id = satzId(d.nr);
  (t['satz'] ??= []).push({
    id,
    client_id: id,
    sorte_id: ZB_SORTE[d.sorte],
    saatgut_id: null,
    kulturform: d.kulturform ?? 'kopf',
    anzuchtort_platz_id: d.direktsaat ? null : platzId('A1'),
    direktsaat_platz_id: d.direktsaat ? platzId(d.direktsaat) : null,
    anzahl_schwaemme: d.anzahl,
    samen_je_schwamm: 1,
    saatdatum: d.saatdatum,
    gilt_ab: `${d.saatdatum}T09:00:00.000Z`,
    ...o,
  });
  const ids: string[] = [];
  for (let i = 1; i <= d.anzahl; i += 1) {
    const p = pflanzungId(d.nr, i);
    ids.push(p);
    (t['pflanzung'] ??= []).push({
      id: p,
      client_id: p,
      satz_id: id,
      gilt_ab: `${d.saatdatum}T09:00:00.000Z`,
      ...o,
    });
    const topf = d.stehend?.toepfe[i - 1];
    const heim = topf ? topf.split('.').slice(0, 2).join('.') : undefined;
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: p,
      satz_id: id,
      phase: d.phase,
      phase_seit: `${d.saatdatum}T10:00:00.000Z`,
      status: d.status ?? 'aktiv',
      netztopf_id: topf ? netztopfId(topf) : null,
      platz_id: heim ? platzId(heim) : d.station ? platzId(d.station.kennung) : null,
      loch_nr: topf ? Number(topf.split('.')[2]) : d.station ? i : null,
    });
    if (topf && heim && d.stehend?.umgesetztAm)
      ereignisDazu(t, 'ereignis_pflanzung', {
        typ: 'umsetzen',
        pflanzungId: p,
        netztopfId: netztopfId(topf),
        giltAb: d.stehend.umgesetztAm,
        daten: {
          von_platz_id: platzId('4.4'),
          von_loch_nr: i,
          nach_platz_id: platzId(heim),
          nach_loch_nr: Number(topf.split('.')[2]),
        },
      });
    if (d.station)
      ereignisDazu(t, 'ereignis_pflanzung', {
        typ: 'verschieben',
        pflanzungId: p,
        giltAb: d.station.eintrittAm,
        daten: { von_platz_id: platzId('A1'), nach_platz_id: platzId(d.station.kennung), nach_loch_nr: i },
      });
    const ziel = d.reserviert?.toepfe[i - 1] ?? (d.direktsaat ? d.direktsaatToepfe?.[i - 1] : undefined);
    // Direktsaat reserviert mit dem Saattag; umgesetzt wird nie, die Reservierung bleibt aktiv (saeen.ts)
    const am = d.reserviert?.umsetzenAm ?? d.saatdatum;
    if (ziel) {
      const r = {
        id: reservierungId(d.nr, i),
        client_id: reservierungId(d.nr, i),
        pflanzung_id: p,
        netztopf_id: netztopfId(ziel),
        umsetzen_vorgabe_am: am,
        umsetzen_geplant_am: am,
        gilt_ab: `${d.saatdatum}T09:00:00.000Z`,
        ...o,
      };
      (t['reservierung'] ??= []).push(r);
      (t['v_reservierung_aktiv'] ??= []).push({ ...r });
    }
  }
  return ids;
}

/** Nährlösungsansatz am Platz (Spalten wie public.naehrloesungsansatz, soweit die Domäne sie liest); gibt die id */
export function ansatzDazu(
  t: Teile,
  e: {
    kennung: string;
    begonnenAm: string;
    typ?: 'neuansatz' | 'nachfuellen' | 'ph_korrektur' | 'teilwechsel';
    status?: 'laufend' | 'abgeschlossen' | 'abgebrochen';
    storniertAm?: string;
  },
): string {
  const id = naechste('21');
  (t['naehrloesungsansatz'] ??= []).push({
    id,
    client_id: id,
    platz_id: platzId(e.kennung),
    typ: e.typ ?? 'neuansatz',
    status: e.status ?? 'abgeschlossen',
    begonnen_am: e.begonnenAm,
    volumen_l: 9,
    nachgefuellt_l: e.typ === 'nachfuellen' ? 2 : null,
    leitkultur_art_id: null,
    gerechnet_fuer: [],
    schnappschuss: {},
    gilt_ab: e.begonnenAm,
    storniert_am: e.storniertAm ?? null,
  });
  fuellzustandNachrechnen(t);
  return id;
}

/** Ereignis «geleert» am Platz (Teil ereignis_platz) */
export function geleertDazu(t: Teile, kennung: string, giltAb: string, storniertAm?: string): string {
  const id = ereignisDazu(t, 'ereignis_platz', {
    typ: 'geleert',
    platzId: platzId(kennung),
    giltAb,
    ...(storniertAm ? { storniertAm } : {}),
  });
  fuellzustandNachrechnen(t);
  return id;
}

/** v_fuellzustand wie die Sicht: Lösung nach dem jüngsten gültigen, nicht abgebrochenen Neuansatz ohne späteres geleert */
export function fuellzustandNachrechnen(t: Teile): Teile {
  const plaetze = (t['platz'] ?? []).filter((p) => p['rolle'] === 'gefaess').map((p) => p['id'] as string);
  t['v_fuellzustand'] = plaetze.map((p) => {
    const ansatz = (t['naehrloesungsansatz'] ?? [])
      .filter(
        (a) =>
          a['platz_id'] === p &&
          a['typ'] === 'neuansatz' &&
          a['status'] !== 'abgebrochen' &&
          (a['storniert_am'] ?? null) === null,
      )
      .map((a) => String(a['begonnen_am']))
      .sort()
      .at(-1);
    const geleert = (t['ereignis_platz'] ?? [])
      .filter((e) => e['platz_id'] === p && e['typ'] === 'geleert' && (e['storniert_am'] ?? null) === null)
      .map((e) => String(e['gilt_ab']))
      .sort()
      .at(-1);
    const loesung =
      ansatz !== undefined && (geleert === undefined || Date.parse(ansatz) > Date.parse(geleert));
    return { platz_id: p, fuellzustand: loesung ? 'loesung' : 'leer', letzter_ansatz: ansatz ?? null };
  });
  return t;
}

export interface ZielbereichOptionen {
  /** umsetzen_geplant_am der drei reservierten Eichblatt (Vorgabe heute + 3 = 21.1.) */
  umsetzenAm?: string;
  /** Umsetzen der drei stehenden Lollo Rossa (Vorgabe 28.12.2026 09:00 Zürich) */
  umgesetztAm?: string;
  /** ohne den Bestand in 2.3 (leeres Regal mit Wissen) */
  leer?: boolean;
}

/** Regal R mit Wissen und dem Bestand in 2.3 (siehe Kopf) */
export function zielbereichTeile(e: ZielbereichOptionen = {}): Teile {
  const t = regalTeile(ZB_JETZT);
  t['art'] = ARTEN.map(([art, name, wasser], i) => ({
    id: uid('41', i + 1),
    art_id: art,
    name_de: name,
    wasserbedarf_je_pflanze_l: wasser,
    ...gueltig,
  }));
  t['art_kulturform'] = KULTURFORMEN.map(([art, kulturform, dauer], i) => ({
    id: uid('44', i + 1),
    art_id: art,
    kulturform,
    ernteart: 'einmalig',
    kulturdauer_typisch_d: dauer,
    kulturdauer_max_d: null,
    ...gueltig,
  }));
  t['sorte'] = SORTEN.map(([s, name, art], i) => ({
    id: uid('25', i + 1),
    sorte_id: ZB_SORTE[s],
    name,
    art_id: art,
    kulturtyp: 'samenfest',
    ...gueltig,
  }));
  t['v_sollwert'] = SOLL.map(([s, phase, groesse, min, max, basis]) => ({
    sorte_id: ZB_SORTE[s],
    phase,
    groesse,
    wert_min: min,
    wert_typ: null,
    wert_max: max,
    text_wert: null,
    herkunft_ebene: 'art',
    evidenzklasse: 'B',
    vermerk: 'keine',
    ec_basis_quelle: basis ?? null,
  }));
  t['v_ec_wasser'] = [{ anlage_id: ANLAGE_R, ec: 0.5, gemessen_am: null, herkunft: 'annahme' }];
  t['messgeraet'] = [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.1, u_ph: 0.1 }];
  t['v_gefaess_status'] = (t['v_gefaess_status'] ?? []).map((g) => ({ ...g, status: 'in_betrieb' }));
  for (const name of [
    'satz',
    'pflanzung',
    'v_pflanzung_zustand',
    'reservierung',
    'v_reservierung_aktiv',
    'ereignis_pflanzung',
    'ereignis_satz',
    'ereignis_platz',
    'naehrloesungsansatz',
    'ansatz_position',
    'messung',
    'v_messung_unsicher',
    'v_zielbereich',
    'k_faktor',
  ])
    t[name] = [];
  // gefaess_erfasst, Prüfung und Ruhe als Platz-Ereignisse
  t['ereignis_platz'] = (t['ereignis'] ?? []).map((z: Zeile) => ({ ...z }));
  t['ereignis'] = [];
  if (!e.leer) {
    satzDazu(t, {
      nr: 1,
      sorte: 'lollo',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 3,
      stehend: {
        toepfe: ['2.3.1', '2.3.2', '2.3.3'],
        umgesetztAm: e.umgesetztAm ?? '2026-12-28T08:00:00.000Z',
      },
    });
    satzDazu(t, {
      nr: 2,
      sorte: 'eichblatt',
      saatdatum: '2027-01-12',
      phase: 'keimung',
      anzahl: 3,
      reserviert: { toepfe: ['2.3.4', '2.3.5', '2.3.6'], umsetzenAm: e.umsetzenAm ?? PLUS_3 },
    });
  }
  return fuellzustandNachrechnen(t);
}

/** die drei stehenden Lollo Rossa und die drei reservierten Eichblatt in 2.3 */
export const STEHEND_23 = [1, 2, 3].map((i) => pflanzungId(1, i));
export const RESERVIERT_23 = [1, 2, 3].map((i) => pflanzungId(2, i));

export { netztopfId, platzId };
