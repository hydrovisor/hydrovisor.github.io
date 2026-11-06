// Teile für «UC6 Rest» (Plan 38 Testliste): Ernte, Kulturende, Schossen, Ausfall, Endzustand und Wiederherstellen,
// Sollbereich und Pflanzenansicht. Regal R mit Wissen und Phasendauern aus tests/fixtures/phasen.ts (ohne den Satz in
// 2.3), dazu art_kulturform, v_sollwert für Wachstum (pH, EC, Wassertemperatur mit Herkunft und Evidenzklasse),
// v_ec_wasser und Sätze mit Ereignissen wie aus den früheren Masken (keimung, Stationseintritt verschieben,
// phase_antwort am Satz, umsetzen). Die Sichten rechnet ernteSichtenNachrechnen() nach (umsetzSichtenNachrechnen() aus
// tests/fixtures/sichten.ts, dazu der Bündelteil ereignis_pflanzung mit schossen_handlung, beobachtung und
// kultur_entscheid wie src/daten/buendel.ts nach Plan 38). Gemeinsam für Unit und E2E; sichten.ts bleibt unverändert.
// Ohne Personendaten.
//
// Abweichung von Plan 38 «Betroffene Dateien» (Testvertrag): kultur_entscheid (am Satz, pflanzung_id null) liegt im
// Bündelteil ereignis_pflanzung, nicht in ereignis_satz. Der geschützte Test tests/unit/phasen-buendel.test.ts verlangt
// für ereignis_satz genau ['phase_antwort']; ereignis_pflanzung filtert nur nach typ, liefert also auch Zeilen am Satz.
//
// Werte, auf die die Tests rechnen (Uhr ERNTE_JETZT 2027-03-18T08:00:00Z = Zürich 18.3. 09:00 = Saat + 70):
// - Lollo Rossa schnitt (Nr. 90) in A1, gesät 7.1., 3 Schwämme (ohne Stationsrest 2), am 11.1. gekeimt und auf 4.4
//   Loch 1 bis 3, Anzucht ab 15.1.; Pflanzung 1 und 2 am 28.1. nach 2.3.1 und 2.3.2 umgesetzt, Wachstum ab 28.1.;
//   Pflanzung 3 bleibt ohne Zieltopf auf 4.4 Loch 3 (Stationsrest). art_kulturform lactuca_sativa schnitt: mehrfach,
//   Ernte ab 21 (→ 18.2.), Intervall 7, Schnitte max. 4, Kulturdauer max. 70 (→ 18.3.).
// - Eissalat kopf (Nr. 91) in A1, gesät 7.1., 1 Schwamm, 28.1. nach 2.3.3; lactuca_sativa kopf: einmalig, Ernte ab 35
//   (→ 4.3.), ohne Kulturdauer max.
// - Basilikum Genoveser dauerkultur_blatt (Nr. 92) in A3, gesät 7.1., 4.2. nach 2.3.6; ocimum_basilicum: Schossen
//   auskneifen; mehrfach, Ernte ab 28 (→ 4.3.), Intervall 14, Kulturdauer max. 150.
// - Pak Choi Mei Qing kopf (Nr. 93) in A1, gesät 7.1., 28.1. nach 2.1.1; brassica_rapa_chinensis: Schossen
//   ernten_beenden; einmalig, Ernte ab 30 (→ 27.2.).
// - Schnittlauch dauerkultur_blatt (Nr. 94) in A3, gesät 7.1., 4.2. nach 2.1.2; allium_schoenoprasum: Schossen
//   bluete_nutzen; mehrfach, Ernte ab 30 (→ 6.3.), Intervall 21, Kulturdauer max. 365.
// - Tomate Ochsenherz dauerkultur_frucht (Nr. 95) in A1, gesät 31.12.2026, mit Topf 2.2.1 auf 4.2 Loch 1, 4.2. nach
//   2.2.1 umgesetzt, Wachstum ab 4.2. (typisch 30 → Frage 6.3.); solanum_lycopersicum ohne Schossen-Handlung;
//   mehrfach, Ernte ab 30 (→ 6.3.), Intervall 7, Kulturdauer max. 180.
// - Eichblatt kopf (Nr. 96) in A2, gesät 10.3., 2 Schwämme in der Box (noch nicht geprüft), Zieltöpfe 2.1.3 und 2.1.4
//   (Umsetzen geplant 31.3.).
// - Lactuca sativa hat in dieser Fixture keine Schossen-Handlung (Fall «ohne Handlung der Art», A8; Fixture-Wert).
// - v_sollwert Wachstum (Herkunft Art, Klasse B1, Vermerk keine): Lollo Rossa pH 6.0–6.5, EC 0.8–1.2 Zuwachs,
//   18–22 °C; Eissalat pH 5.8–6.6, EC 1.0–1.4 gesamt, 16–22 °C; Basilikum pH 5.5–6.5, EC 1.0–1.6 gesamt, 18–24 °C;
//   Pak Choi pH 6.0–7.0, EC 1.2–1.8 gesamt; Schnittlauch pH 6.0–6.8, EC 1.0–1.6 gesamt; Tomate pH 5.8–6.3, EC
//   1.4–2.0 gesamt (Pak Choi, Schnittlauch, Tomate je 18–24 °C).
// - ECWasser der Anlage R 0.4 (v_ec_wasser und ec_wasser_annahme gleich, damit der Spiegel in sichten.ts dasselbe
//   rechnet): 2.3 heute pH 6.0–6.5, EC 1.2–1.4, 18–22 °C, 4 zählende; ohne Lollo Rossa pH 5.8–6.5, EC 1.0–1.4,
//   18–22 °C, 2 zählende.
// - mitY: Anlage Y (Datenart test) mit Direktsaat Lollo Rossa schnitt (Nr. 97) in Y-2.3, gesät 1.2. (→ Ernte 22.2.).
import { ANLAGE_R, netztopfId, platzId, uid, vereinen, weitereAnlage, type Teile } from './regal.ts';
import { pflanzungId, reservierungId, satzAnlegen } from './keimung.ts';
import { dauerSetzen, merkmalSetzen, phasenTeile, SORTE, SORTE_W1 } from './phasen.ts';
import { PACKUNG } from './saeen.ts';
import { umsetzSichtenNachrechnen, vorgangAnwenden } from './sichten.ts';
import type { Vorgang } from '../../src/domain/datenpfad/erfassung.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };
const gueltig = { gueltig_bis: null };

export const ERNTE_JETZT = new Date('2027-03-18T08:00:00Z');
/** Uhr am Kalendertag in Zürich, 09:00 Winterzeit (08:00 UTC) */
export const um = (tag: string) => new Date(`${tag}T08:00:00Z`);

export const NR = {
  lollo: 90,
  eissalat: 91,
  basilikum: 92,
  pakchoi: 93,
  schnittlauch: 94,
  tomate: 95,
  eichblatt: 96,
  lolloY: 97,
} as const;
export const SATZ = Object.fromEntries(Object.entries(NR).map(([k, n]) => [k, uid('27', n)])) as Record<
  keyof typeof NR,
  string
>;

export const SORTE_E = {
  basilikum: uid('26', 21),
  pakchoi: uid('26', 22),
} as const;
export { SORTE, SORTE_W1 };

/** Pflanzungen: LOLLO[1], LOLLO[2] in 2.3, LOLLO[3] Stationsrest auf 4.4 */
export const LOLLO = [0, 1, 2, 3].map((i) => pflanzungId(NR.lollo, i));
export const EISSALAT = pflanzungId(NR.eissalat, 1);
export const BASILIKUM = pflanzungId(NR.basilikum, 1);
export const PAKCHOI = pflanzungId(NR.pakchoi, 1);
export const SCHNITTLAUCH = pflanzungId(NR.schnittlauch, 1);
export const TOMATE = pflanzungId(NR.tomate, 1);
export const EICHBLATT = [0, 1, 2].map((i) => pflanzungId(NR.eichblatt, i));
export const LOLLO_Y = pflanzungId(NR.lolloY, 1);
/** Reservierung des Eichblatts k (1 → 2.1.3, 2 → 2.1.4) */
export const eichblattReservierung = (k: number) => reservierungId(NR.eichblatt, k);

/** Platz der Anlage Y aus weitereAnlage('Y', 'test'): 2.3 */
export const PLATZ_Y23 = uid('3b', 'Y'.charCodeAt(0) * 10 + 1);
export const ANLAGE_Y = uid('3a', 'Y'.charCodeAt(0));

export const WISSEN_SCHOSSEN_BASILIKUM = 'Blütenansatz mit zwei Blattpaaren darunter auskneifen.';

let nr = 0;
/** Ereignis wie eine Zeile der Tabelle ereignis (gilt_ab ISO); gibt die id zurück. Danach ernteSichtenNachrechnen(). */
export function ereignisDazu(
  t: Teile,
  e: {
    typ: string;
    giltAb: string;
    pflanzungId?: string;
    satzId?: string;
    netztopfId?: string;
    platzId?: string;
    daten?: Record<string, unknown>;
    id?: string;
  },
): string {
  nr += 1;
  const id = e.id ?? uid('4e', nr);
  (t['ereignis'] ??= []).push({
    id,
    client_id: id,
    typ: e.typ,
    pflanzung_id: e.pflanzungId ?? null,
    satz_id: e.satzId ?? null,
    netztopf_id: e.netztopfId ?? null,
    platz_id: e.platzId ?? null,
    daten: e.daten ?? {},
    gilt_ab: e.giltAb,
    client_zeit: e.giltAb,
    erfasst_am: e.giltAb,
    ersetzt_id: null,
    ...o,
  });
  return id;
}

/** Teilernte oder Abernten an einer Pflanzung am Kalendertag (09:00 Zürich Winterzeit, sonst giltAb) */
export function ernteDazu(t: Teile, pflanzung: string, art: 'teil' | 'ab', tagOderZeit: string): string {
  const giltAb = tagOderZeit.length === 10 ? `${tagOderZeit}T08:00:00.000Z` : tagOderZeit;
  return ereignisDazu(t, { typ: 'ernte', pflanzungId: pflanzung, giltAb, daten: { art } });
}

/** Kulturentscheid am Satz */
export function kulturEntscheidDazu(
  t: Teile,
  satzId: string,
  entscheid: 'beenden' | 'verlaengern',
  tag: string,
): string {
  return ereignisDazu(t, {
    typ: 'kultur_entscheid',
    satzId,
    giltAb: `${tag}T08:00:00.000Z`,
    daten: entscheid === 'verlaengern' ? { entscheid, tage: 14 } : { entscheid },
  });
}

/** Abschluss an einer Pflanzung */
export function abschlussDazu(
  t: Teile,
  pflanzung: string,
  grund: 'geerntet' | 'ausfall' | 'keimt_nicht' | 'ueberzaehlig',
  tag: string,
  text?: string,
): string {
  return ereignisDazu(t, {
    typ: 'abschluss',
    pflanzungId: pflanzung,
    giltAb: `${tag}T08:00:00.000Z`,
    daten: text ? { grund, text } : { grund },
  });
}

/** Stationseintritt aus der Box (keimung + verschieben) */
function aufDieStation(
  t: Teile,
  pflanzung: string,
  e: { box: string; station: string; loch: number; tag: string; topf?: string },
): void {
  const giltAb = `${e.tag}T08:00:00.000Z`;
  ereignisDazu(t, {
    typ: 'keimung',
    pflanzungId: pflanzung,
    giltAb,
    daten: { samen_gesaet: 1, samen_gekeimt: 1, keimtemp_eingehalten: true },
  });
  ereignisDazu(t, {
    typ: 'verschieben',
    pflanzungId: pflanzung,
    ...(e.topf ? { netztopfId: netztopfId(e.topf) } : {}),
    giltAb,
    daten: { von_platz_id: platzId(e.box), nach_platz_id: platzId(e.station), nach_loch_nr: e.loch },
  });
}

/** umsetzen in den Topf mit Kennung (Heimplatz), von Station und Loch */
export function umsetzenDazu(
  t: Teile,
  pflanzung: string,
  topf: string,
  tag: string,
  von: [string, number],
): string {
  const [a, b, l] = topf.split('.');
  return ereignisDazu(t, {
    typ: 'umsetzen',
    pflanzungId: pflanzung,
    netztopfId: netztopfId(topf),
    giltAb: `${tag}T09:00:00.000Z`,
    daten: {
      von_platz_id: platzId(von[0]),
      von_loch_nr: von[1],
      nach_platz_id: platzId(`${a}.${b}`),
      nach_loch_nr: Number(l),
    },
  });
}

/** Topf innerhalb des Gefässes auf ein anderes Loch verschieben */
export function verschiebenDazu(
  t: Teile,
  pflanzung: string,
  topf: string,
  nach: [string, number],
  tag: string,
): string {
  const [a, b] = topf.split('.');
  return ereignisDazu(t, {
    typ: 'verschieben',
    pflanzungId: pflanzung,
    netztopfId: netztopfId(topf),
    giltAb: `${tag}T08:00:00.000Z`,
    daten: {
      von_platz_id: platzId(`${a}.${b}`),
      nach_platz_id: platzId(nach[0]),
      nach_loch_nr: nach[1],
    },
  });
}

/** phase_antwort {phase, antwort: ja} am Satz */
export function phaseDazu(t: Teile, satzId: string, phase: string, tag: string): string {
  return ereignisDazu(t, {
    typ: 'phase_antwort',
    satzId,
    giltAb: `${tag}T10:00:00.000Z`,
    daten: { phase, antwort: 'ja', nachgefuehrt: false },
  });
}

type Band3 = [number, number];
/** v_sollwert-Zeile einer Grösse in der Phase Wachstum */
export function sollwertZeile(
  sorteId: string,
  groesse: 'ph' | 'ec' | 'wassertemp',
  [min, max]: Band3,
  w: Zeile = {},
): Zeile {
  return {
    sorte_id: sorteId,
    phase: 'wachstum',
    groesse,
    wert_min: min,
    wert_typ: null,
    wert_max: max,
    text_wert: null,
    ec_basis_quelle: groesse === 'ec' ? 'gesamt' : null,
    herkunft_ebene: 'art',
    quelle_id: null,
    evidenzklasse: 'B1',
    vermerk: 'keine',
    ...w,
  };
}

/** Sollwertzeile (Sorte, Phase Wachstum, Grösse) ändern; `null` entfernt sie */
export function sollwertSetzen(t: Teile, sorteId: string, groesse: string, felder: Zeile | null): void {
  const passt = (z: Zeile) =>
    z['sorte_id'] === sorteId && z['phase'] === 'wachstum' && z['groesse'] === groesse;
  if (felder === null) {
    t['v_sollwert'] = (t['v_sollwert'] ?? []).filter((z) => !passt(z));
    return;
  }
  for (const z of t['v_sollwert'] ?? []) if (passt(z)) Object.assign(z, felder);
}

/** Felder einer art_kulturform-Zeile ändern; `null` entfernt die Zeile */
export function kulturformSetzen(t: Teile, artId: string, kulturform: string, felder: Zeile | null): void {
  const alle = t['art_kulturform'] ?? [];
  if (felder === null) {
    t['art_kulturform'] = alle.filter((z) => !(z['art_id'] === artId && z['kulturform'] === kulturform));
    return;
  }
  for (const z of alle) if (z['art_id'] === artId && z['kulturform'] === kulturform) Object.assign(z, felder);
}

const ART_KULTURFORM: [
  string,
  string,
  'einmalig' | 'mehrfach',
  number,
  number | null,
  number | null,
  number | null,
][] = [
  // art_id, kulturform, ernteart, ernte_ab_d, ernteintervall_d, schnitte_max, kulturdauer_max_d
  ['lactuca_sativa', 'schnitt', 'mehrfach', 21, 7, 4, 70],
  ['lactuca_sativa', 'kopf', 'einmalig', 35, null, null, null],
  ['ocimum_basilicum', 'dauerkultur_blatt', 'mehrfach', 28, 14, null, 150],
  ['brassica_rapa_chinensis', 'kopf', 'einmalig', 30, null, null, null],
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'mehrfach', 30, 21, null, 365],
  ['solanum_lycopersicum', 'dauerkultur_frucht', 'mehrfach', 30, 7, null, 180],
];

const SOLLWERTE: [string, Band3, Band3, string, Band3][] = [
  // sorte, pH, EC, ec_basis_quelle, Wassertemperatur
  [SORTE.lollo, [6.0, 6.5], [0.8, 1.2], 'zuwachs', [18, 22]],
  [SORTE_W1.eissalat, [5.8, 6.6], [1.0, 1.4], 'gesamt', [16, 22]],
  [SORTE_E.basilikum, [5.5, 6.5], [1.0, 1.6], 'gesamt', [18, 24]],
  [SORTE_E.pakchoi, [6.0, 7.0], [1.2, 1.8], 'gesamt', [18, 24]],
  [SORTE_W1.schnittlauch, [6.0, 6.8], [1.0, 1.6], 'gesamt', [18, 24]],
  [SORTE.ochsenherz, [5.8, 6.3], [1.4, 2.0], 'gesamt', [18, 24]],
];

export interface ErnteOptionen {
  jetzt?: Date;
  /** Lollo-Pflanzung 3 bleibt auf 4.4 (Vorgabe ja) */
  stationsrest?: boolean;
  /** Anlage Y mit Direktsaat Lollo Rossa (Vorgabe nein) */
  mitY?: boolean;
}

/** Regal R mit den Sätzen 90 bis 96 (siehe Kopf); Sichten nachgerechnet */
export function ernteTeile(e: ErnteOptionen = {}): Teile {
  nr = 0;
  const jetzt = e.jetzt ?? ERNTE_JETZT;
  let t = phasenTeile(jetzt);
  for (const a of t['anlage'] ?? []) if (a['id'] === ANLAGE_R) a['ec_wasser_annahme'] = 0.4;
  t['v_ec_wasser'] = [
    { anlage_id: ANLAGE_R, ec: 0.4, gemessen_am: '2027-03-01T08:00:00.000Z', herkunft: 'messung' },
  ];
  t['kulturgruppe'] = [
    { kulturgruppe_id: 'salate', name: 'Salate', ...gueltig },
    { kulturgruppe_id: 'kraeuter', name: 'Kräuter', ...gueltig },
    { kulturgruppe_id: 'blattgemuese', name: 'Blattgemüse', ...gueltig },
  ];
  const gruppe: Record<string, string> = {
    lactuca_sativa: 'salate',
    allium_schoenoprasum: 'kraeuter',
    valerianella_locusta: 'salate',
  };
  for (const a of t['art'] ?? []) {
    a['kulturgruppe_id'] ??= gruppe[String(a['art_id'])] ?? null;
    a['schossen_handlung'] = a['art_id'] === 'allium_schoenoprasum' ? 'bluete_nutzen' : null;
  }
  t['art'] = [
    ...(t['art'] ?? []),
    {
      id: uid('35', 30),
      art_id: 'ocimum_basilicum',
      name_de: 'Basilikum',
      kulturgruppe_id: 'kraeuter',
      kulturformen_erlaubt: ['dauerkultur_blatt'],
      kulturform_vorgabe: 'dauerkultur_blatt',
      umsetzen_ab_d: 28,
      umsetzen_bis_d: 35,
      standard_keimfaehigkeit: 0.8,
      schossen_handlung: 'auskneifen',
      ...gueltig,
    },
    {
      id: uid('35', 31),
      art_id: 'brassica_rapa_chinensis',
      name_de: 'Pak Choi',
      kulturgruppe_id: 'blattgemuese',
      kulturformen_erlaubt: ['babyleaf', 'kopf'],
      kulturform_vorgabe: 'kopf',
      umsetzen_ab_d: 21,
      umsetzen_bis_d: 28,
      standard_keimfaehigkeit: 0.85,
      schossen_handlung: 'ernten_beenden',
      ...gueltig,
    },
  ];
  t['sorte'] = [
    ...(t['sorte'] ?? []),
    {
      id: uid('25', 30),
      sorte_id: SORTE_E.basilikum,
      name: 'Genoveser',
      art_id: 'ocimum_basilicum',
      kulturtyp: 'blatt',
      ...gueltig,
    },
    {
      id: uid('25', 31),
      sorte_id: SORTE_E.pakchoi,
      name: 'Mei Qing',
      art_id: 'brassica_rapa_chinensis',
      kulturtyp: 'blatt',
      ...gueltig,
    },
  ];
  for (const s of [SORTE_E.basilikum, SORTE_E.pakchoi]) {
    dauerSetzen(t, s, 'keimung', [3, 5, 8]);
    merkmalSetzen(t, s, 'keimung', 'Keimblätter offen');
    dauerSetzen(t, s, 'anzucht', [14, 21, 28]);
    dauerSetzen(t, s, 'wachstum', [30, 40, 60]);
  }
  t['v_sollwert'] = [
    ...(t['v_sollwert'] ?? []),
    ...SOLLWERTE.flatMap(([sorte, ph, ec, basis, temp]) => [
      sollwertZeile(sorte, 'ph', ph),
      sollwertZeile(sorte, 'ec', ec, { ec_basis_quelle: basis }),
      sollwertZeile(sorte, 'wassertemp', temp),
    ]),
  ];
  t['art_kulturform'] = ART_KULTURFORM.map(([art, form, ernteart, ab, intervall, schnitte, max], i) => ({
    id: uid('37', 40 + i),
    art_id: art,
    kulturform: form,
    ernteart,
    ernte_ab_d: ab,
    ernteintervall_d: intervall,
    schnitte_max: schnitte,
    kulturdauer_max_d: max,
    kulturdauer_typisch_d: null,
    entspitzen: false,
    ...gueltig,
  }));
  t['wissenseintrag'] = [
    {
      id: uid('38', 40),
      ebene: 'art',
      art_id: 'ocimum_basilicum',
      kulturgruppe_id: null,
      phase: null,
      typ: 'schossen',
      text: WISSEN_SCHOSSEN_BASILIKUM,
      gueltig_bis: null,
    },
  ];

  // Lollo Rossa schnitt: 2 in 2.3, einer als Stationsrest auf 4.4
  const rest = e.stationsrest ?? true;
  const lollo = satzAnlegen(t, {
    nr: NR.lollo,
    sorteId: SORTE.lollo,
    saatgutId: PACKUNG.lollo,
    kulturform: 'schnitt',
    box: 'A1',
    schwaemme: rest ? 3 : 2,
    samen: 1,
    saatdatum: '2027-01-07',
    zieltoepfe: ['2.3.1', '2.3.2'],
  });
  lollo.forEach((p, i) => aufDieStation(t, p, { box: 'A1', station: '4.4', loch: i + 1, tag: '2027-01-11' }));
  phaseDazu(t, SATZ.lollo, 'anzucht', '2027-01-15');
  umsetzenDazu(t, LOLLO[1] as string, '2.3.1', '2027-01-28', ['4.4', 1]);
  umsetzenDazu(t, LOLLO[2] as string, '2.3.2', '2027-01-28', ['4.4', 2]);
  phaseDazu(t, SATZ.lollo, 'wachstum', '2027-01-28');

  // Eissalat kopf in 2.3.3
  satzAnlegen(t, {
    nr: NR.eissalat,
    sorteId: SORTE_W1.eissalat,
    saatgutId: null,
    kulturform: 'kopf',
    box: 'A1',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2027-01-07',
    zieltoepfe: ['2.3.3'],
  });
  aufDieStation(t, EISSALAT, { box: 'A1', station: '4.4', loch: 4, tag: '2027-01-11' });
  phaseDazu(t, SATZ.eissalat, 'anzucht', '2027-01-15');
  umsetzenDazu(t, EISSALAT, '2.3.3', '2027-01-28', ['4.4', 4]);
  phaseDazu(t, SATZ.eissalat, 'wachstum', '2027-01-28');

  // Basilikum dauerkultur_blatt in 2.3.6
  satzAnlegen(t, {
    nr: NR.basilikum,
    sorteId: SORTE_E.basilikum,
    saatgutId: null,
    kulturform: 'dauerkultur_blatt',
    box: 'A3',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2027-01-07',
    zieltoepfe: ['2.3.6'],
  });
  aufDieStation(t, BASILIKUM, { box: 'A3', station: '4.5', loch: 1, tag: '2027-01-14' });
  phaseDazu(t, SATZ.basilikum, 'anzucht', '2027-01-18');
  umsetzenDazu(t, BASILIKUM, '2.3.6', '2027-02-04', ['4.5', 1]);
  phaseDazu(t, SATZ.basilikum, 'wachstum', '2027-02-04');

  // Pak Choi kopf in 2.1.1
  satzAnlegen(t, {
    nr: NR.pakchoi,
    sorteId: SORTE_E.pakchoi,
    saatgutId: null,
    kulturform: 'kopf',
    box: 'A1',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2027-01-07',
    zieltoepfe: ['2.1.1'],
  });
  aufDieStation(t, PAKCHOI, { box: 'A1', station: '4.5', loch: 2, tag: '2027-01-10' });
  phaseDazu(t, SATZ.pakchoi, 'anzucht', '2027-01-14');
  umsetzenDazu(t, PAKCHOI, '2.1.1', '2027-01-28', ['4.5', 2]);
  phaseDazu(t, SATZ.pakchoi, 'wachstum', '2027-01-28');

  // Schnittlauch dauerkultur_blatt in 2.1.2
  satzAnlegen(t, {
    nr: NR.schnittlauch,
    sorteId: SORTE_W1.schnittlauch,
    saatgutId: null,
    kulturform: 'dauerkultur_blatt',
    box: 'A3',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2027-01-07',
    zieltoepfe: ['2.1.2'],
  });
  aufDieStation(t, SCHNITTLAUCH, { box: 'A3', station: '4.5', loch: 3, tag: '2027-01-17' });
  phaseDazu(t, SATZ.schnittlauch, 'anzucht', '2027-01-17');
  umsetzenDazu(t, SCHNITTLAUCH, '2.1.2', '2027-02-04', ['4.5', 3]);
  phaseDazu(t, SATZ.schnittlauch, 'wachstum', '2027-02-04');

  // Tomate dauerkultur_frucht in 2.2.1 (mit dem Topf auf die Station, Konzept 8.1 Regel 10)
  satzAnlegen(t, {
    nr: NR.tomate,
    sorteId: SORTE.ochsenherz,
    saatgutId: PACKUNG.ochsenherz,
    kulturform: 'dauerkultur_frucht',
    box: 'A1',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2026-12-31',
    zieltoepfe: ['2.2.1'],
  });
  aufDieStation(t, TOMATE, { box: 'A1', station: '4.2', loch: 1, tag: '2027-01-07', topf: '2.2.1' });
  phaseDazu(t, SATZ.tomate, 'anzucht', '2027-01-12');
  umsetzenDazu(t, TOMATE, '2.2.1', '2027-02-04', ['4.2', 1]);
  phaseDazu(t, SATZ.tomate, 'wachstum', '2027-02-04');

  // Eichblatt kopf in A2, Zieltöpfe 2.1.3 und 2.1.4
  satzAnlegen(t, {
    nr: NR.eichblatt,
    sorteId: SORTE.eichblatt,
    saatgutId: PACKUNG.eichblatt,
    kulturform: 'kopf',
    box: 'A2',
    schwaemme: 2,
    samen: 1,
    saatdatum: '2027-03-10',
    zieltoepfe: ['2.1.3', '2.1.4'],
  });
  for (const r of t['reservierung'] ?? [])
    if (r['id'] === eichblattReservierung(1) || r['id'] === eichblattReservierung(2)) {
      r['umsetzen_vorgabe_am'] = '2027-03-31';
      r['umsetzen_geplant_am'] = '2027-03-31';
    }

  if (e.mitY) {
    t = vereinen(t, weitereAnlage('Y', 'test'));
    (t['satz'] ??= []).push({
      id: SATZ.lolloY,
      client_id: SATZ.lolloY,
      sorte_id: SORTE.lollo,
      saatgut_id: null,
      kulturform: 'schnitt',
      anzuchtort_platz_id: null,
      direktsaat_platz_id: PLATZ_Y23,
      anzahl_schwaemme: 1,
      samen_je_schwamm: 3,
      saatdatum: '2027-02-01',
      gilt_ab: '2027-02-01T11:00:00.000Z',
      client_zeit: '2027-02-01T11:00:00.000Z',
      erfasst_am: '2027-02-01T11:00:00.000Z',
      ...o,
    });
    (t['pflanzung'] ??= []).push({
      id: LOLLO_Y,
      client_id: LOLLO_Y,
      satz_id: SATZ.lolloY,
      gilt_ab: '2027-02-01T11:00:00.000Z',
      client_zeit: '2027-02-01T11:00:00.000Z',
      ...o,
    });
    ereignisDazu(t, {
      typ: 'keimung',
      pflanzungId: LOLLO_Y,
      giltAb: '2027-02-04T08:00:00.000Z',
      daten: { samen_gesaet: 3, samen_gekeimt: 3, keimtemp_eingehalten: true },
    });
    phaseDazu(t, SATZ.lolloY, 'anzucht', '2027-02-05');
    phaseDazu(t, SATZ.lolloY, 'wachstum', '2027-02-20');
  }
  return ernteSichtenNachrechnen(t);
}

const offen = (z: Zeile) => z['storniert_am'] === null || z['storniert_am'] === undefined;
const EREIGNIS_PFLANZUNG = new Set([
  'keimung',
  'abschluss',
  'wiederherstellen',
  'verschieben',
  'umsetzen',
  'tausch',
  'umsetzdatum_geaendert',
  'ernte',
  // Plan 38
  'schossen_handlung',
  'beobachtung',
]);

/**
 * Sichten wie umsetzSichtenNachrechnen() (verändert `t`), dazu die Bündelteile nach Plan 38 (nicht storniert):
 * ereignis_pflanzung mit schossen_handlung und beobachtung an der Pflanzung und kultur_entscheid am Satz (siehe Kopf),
 * ereignis_satz unverändert nur phase_antwort; v_pflanzung_zustand.phase aus der letzten phase_antwort {ja} am Satz.
 */
export function ernteSichtenNachrechnen(t: Teile): Teile {
  umsetzSichtenNachrechnen(t);
  const ereignisse = (t['ereignis'] ?? []).filter(offen);
  t['ereignis_pflanzung'] = ereignisse
    .filter(
      (e) =>
        (EREIGNIS_PFLANZUNG.has(String(e['typ'])) && e['pflanzung_id']) ||
        (e['typ'] === 'kultur_entscheid' && e['satz_id']),
    )
    .map((e) => ({ ...e }));
  t['ereignis_satz'] = ereignisse.filter((e) => e['typ'] === 'phase_antwort').map((e) => ({ ...e }));
  return t;
}

/**
 * Datenbank-Spiegel: Vorgang wie schreiben() und die Datenbank anwenden (client_zeit und erfasst_am = jetzt) und die
 * Sichten nachrechnen; Gegenprobe zu teileNach() aus src/domain/phasen/ende.ts.
 */
export function ernteVorgangAnwenden(teile: Teile, vorgang: Vorgang, jetzt: Date): Teile {
  const iso = jetzt.toISOString();
  const mitZeit: Vorgang = vorgang.map((s) =>
    s.art === 'neu' ? { ...s, felder: { client_zeit: iso, erfasst_am: iso, ...s.felder } } : s,
  );
  return ernteSichtenNachrechnen(vorgangAnwenden(teile, mitZeit, jetzt));
}

export { netztopfId, platzId };
