// Teile des Bündels (Form von PostgREST) für das Regal R nach Konzept 5.2 (Plan 20): 4 Bereiche, 13 Gefässe
// (davon 5 Stationen auf Ebene 4), Anzuchtboxen A1 bis A4, Messstelle W. Dazu eine Lösung, Messungen, ein Ansatz mit
// Positionen und ein Satz in 2.3. Ohne Personendaten. Gemeinsam für Unit und E2E.

type Zeile = Record<string, unknown>;
export type Teile = Record<string, Zeile[]>;

const o = { storniert_am: null };
const pad = (n: number) => String(n).padStart(4, '0');
/** feste UUID je Präfix und Nummer */
export const uid = (praefix: string, n: number) => `${praefix}000000-0000-4000-8000-00000000${pad(n)}`;

export const ANLAGE_R = uid('2a', 1);

interface Ortdef {
  kennung: string;
  bereich: number;
  modell: 'rako' | 'halb' | 'leni';
  deckel: string;
  betriebsart: string;
  wechsel: number | null;
}

/** 13 Gefässe nach Konzept 5.2 und UC2 (Deckel) */
export const GEFAESSE: Ortdef[] = [
  { kennung: '1.1', bereich: 1, modell: 'rako', deckel: 'D1', betriebsart: 'dwc', wechsel: 14 },
  { kennung: '1.2', bereich: 1, modell: 'rako', deckel: 'D1', betriebsart: 'dwc', wechsel: 14 },
  { kennung: '2.1', bereich: 2, modell: 'rako', deckel: 'D2', betriebsart: 'dwc', wechsel: 14 },
  { kennung: '2.2', bereich: 2, modell: 'rako', deckel: 'D4', betriebsart: 'dwc', wechsel: 14 },
  { kennung: '2.3', bereich: 2, modell: 'rako', deckel: 'D2', betriebsart: 'dwc', wechsel: 14 },
  {
    kennung: '3.1',
    bereich: 3,
    modell: 'rako',
    deckel: 'D3',
    betriebsart: 'kratky_belueftet',
    wechsel: null,
  },
  {
    kennung: '3.2',
    bereich: 3,
    modell: 'rako',
    deckel: 'D6',
    betriebsart: 'kratky_belueftet',
    wechsel: null,
  },
  {
    kennung: '3.3',
    bereich: 3,
    modell: 'rako',
    deckel: 'D3',
    betriebsart: 'kratky_belueftet',
    wechsel: null,
  },
  { kennung: '4.1', bereich: 4, modell: 'halb', deckel: 'D6', betriebsart: 'konstantpegel', wechsel: 14 },
  { kennung: '4.2', bereich: 4, modell: 'leni', deckel: 'S8', betriebsart: 'konstantpegel', wechsel: 14 },
  { kennung: '4.3', bereich: 4, modell: 'leni', deckel: 'S8', betriebsart: 'konstantpegel', wechsel: 14 },
  { kennung: '4.4', bereich: 4, modell: 'leni', deckel: 'S5', betriebsart: 'konstantpegel', wechsel: 14 },
  { kennung: '4.5', bereich: 4, modell: 'leni', deckel: 'S5', betriebsart: 'konstantpegel', wechsel: 14 },
];
const BOXEN = [
  { kennung: 'A1', typ: 'box_licht' },
  { kennung: 'A2', typ: 'box_licht' },
  { kennung: 'A3', typ: 'box_dunkel' },
  { kennung: 'A4', typ: 'box_dunkel' },
];

export const platzId = (kennung: string, anlage = ANLAGE_R) => {
  const alle = [...GEFAESSE.map((g) => g.kennung), ...BOXEN.map((b) => b.kennung), 'W'];
  return uid(anlage === ANLAGE_R ? '2b' : '3b', alle.indexOf(kennung) + 1);
};
export const gefaessId = (kennung: string) => uid('2c', GEFAESSE.findIndex((g) => g.kennung === kennung) + 1);

const MODELLE: Record<Ortdef['modell'], Zeile> = {
  rako: { id: uid('2d', 1), name: 'Rako 40 × 30 × 22', form: 'rechteckig', betriebsvolumen_l: 9, ...o },
  halb: { id: uid('2d', 2), name: 'Rako 30 × 20 × 12', form: 'rechteckig', betriebsvolumen_l: 3, ...o },
  leni: { id: uid('2d', 3), name: 'Leni Flori 36', form: 'oval', betriebsvolumen_l: 2.3, ...o },
};
const DECKEL = ['D1', 'D2', 'D3', 'D4', 'D6', 'S8', 'S5'];

/** Regal R mit 4 Bereichen, 13 Gefässen, 4 Anzuchtboxen, W. `jetzt` bestimmt die Zeitstempel relativ. */
export function regalTeile(jetzt = new Date('2026-12-10T08:00:00Z')): Teile {
  const vor = (tage: number, stunden = 0) =>
    new Date(jetzt.getTime() - (tage * 24 + stunden) * 3600_000).toISOString();
  const t: Teile = {};
  t['anlage'] = [
    {
      id: ANLAGE_R,
      kuerzel: 'R',
      name: 'Indoor-Regal',
      datenart: 'echt',
      aktiv: true,
      standort: 'indoor',
      ec_wasser_annahme: 0.5,
      ...o,
    },
  ];
  t['bereich'] = [1, 2, 3, 4].map((n) => ({
    id: uid('2e', n),
    anlage_id: ANLAGE_R,
    nummer: n,
    name: `Ebene ${n}`,
    ...o,
  }));
  t['gefaessmodell'] = Object.values(MODELLE);
  t['deckeltyp'] = DECKEL.map((name, i) => ({ id: uid('2f', i + 1), name, ...o }));
  t['platz'] = [
    ...GEFAESSE.map((g) => ({
      id: platzId(g.kennung),
      anlage_id: ANLAGE_R,
      bereich_id: uid('2e', g.bereich),
      kennung: g.kennung,
      rolle: 'gefaess',
      aktiv: true,
      ...o,
    })),
    ...BOXEN.map((b) => ({
      id: platzId(b.kennung),
      anlage_id: ANLAGE_R,
      bereich_id: uid('2e', 4),
      kennung: b.kennung,
      rolle: 'anzuchtort',
      aktiv: true,
      ...o,
    })),
    {
      id: platzId('W'),
      anlage_id: ANLAGE_R,
      bereich_id: null,
      kennung: 'W',
      rolle: 'messstelle',
      aktiv: true,
      ...o,
    },
  ];
  t['gefaess'] = GEFAESSE.map((g) => ({
    id: gefaessId(g.kennung),
    platz_id: platzId(g.kennung),
    gefaessmodell_id: MODELLE[g.modell]['id'],
    deckeltyp_id: uid('2f', DECKEL.indexOf(g.deckel) + 1),
    betriebsart: g.betriebsart,
    // Stationen 4.1 bis 4.5 als Konstantpegel mit fester Dosis (R4.5)
    feste_dosis: g.betriebsart === 'konstantpegel',
    betriebsvolumen_l: MODELLE[g.modell]['betriebsvolumen_l'],
    intervall_messen_d: 2,
    intervall_wechseln_d: g.wechsel,
    gueltig_bis: null,
    ...o,
  }));
  t['anzuchtort'] = BOXEN.map((b, i) => ({
    id: uid('20', i + 1),
    platz_id: platzId(b.kennung),
    typ: b.typ,
    platzzahl: 25,
    // A1 und A3 vorne, A2 und A4 hinten (Konzept 5.8)
    position: i % 2 === 0 ? 'vorne' : 'hinten',
    ...o,
  }));
  // 3.3 noch in Prüfung, 1.2 ruht, die übrigen in Betrieb
  t['v_gefaess_status'] = GEFAESSE.map((g) => ({
    gefaess_id: gefaessId(g.kennung),
    status: g.kennung === '3.3' ? 'in_pruefung' : g.kennung === '1.2' ? 'ruht' : 'in_betrieb',
  }));
  // 2.3 mit Lösung seit 12 Tagen, sonst leer
  const ansatz = uid('21', 1);
  t['v_fuellzustand'] = GEFAESSE.map((g) => ({
    platz_id: platzId(g.kennung),
    fuellzustand: g.kennung === '2.3' ? 'loesung' : 'leer',
    letzter_ansatz: g.kennung === '2.3' ? vor(12) : null,
  }));
  t['naehrloesungsansatz'] = [
    {
      id: ansatz,
      platz_id: platzId('2.3'),
      typ: 'neuansatz',
      status: 'abgeschlossen',
      begonnen_am: vor(12),
      volumen_l: 9,
      schnappschuss: {
        zielbereich: { ph_min: 5.8, ph_max: 6.3, ec_min: 1.0, ec_max: 1.4, temp_min: 18, temp_max: 22 },
      },
      gilt_ab: vor(12),
      ...o,
    },
  ];
  t['ansatz_position'] = [
    ['grow', 21.0],
    ['micro_hard_water', 14.0],
    ['bloom', 7.0],
  ].map(([produkt, ml], i) => ({
    id: uid('22', i + 1),
    ansatz_id: ansatz,
    produkt_id: produkt,
    soll_ml: ml,
    ist_ml: ml,
    bezugsvolumen_l: 9,
    ...o,
  }));
  t['produkt'] = [
    { produkt_id: 'grow', name: 'Grow' },
    { produkt_id: 'micro_hard_water', name: 'Micro' },
    { produkt_id: 'bloom', name: 'Bloom' },
  ];
  t['messgeraet'] = [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.05, u_ph: 0.05 }];
  const messung = (n: number, tage: number, ph: number, ec: number, bewertung: string) => ({
    id: uid('24', n),
    platz_id: platzId('2.3'),
    messgeraet_id: uid('23', 1),
    messart: 'rundgang',
    ph,
    ec,
    temperatur: 20.5,
    fuellstand: null,
    bewertung_ph: bewertung,
    bewertung_ec: bewertung,
    bewertung_temp: 'gruen',
    schnappschuss: { betriebsart: 'dwc' },
    gilt_ab: vor(tage),
    ...o,
  });
  t['messung'] = [
    messung(1, 4, 6.0, 1.21, 'gruen'),
    messung(2, 2, 6.2, 1.32, 'gruen'),
    messung(3, 0, 6.4, 1.45, 'knapp'),
  ];
  t['v_messung_unsicher'] = [];
  // ein Satz Salat in 2.3: gesät vor 30 Tagen, Phase Wachstum
  t['sorte'] = [{ id: uid('25', 1), sorte_id: uid('26', 1), name: 'Lollo Rossa', art_id: 'salat' }];
  t['satz'] = [
    {
      id: uid('27', 1),
      sorte_id: uid('26', 1),
      kulturform: 'kopf',
      anzuchtort_platz_id: platzId('A1'),
      direktsaat_platz_id: null,
      anzahl_schwaemme: 4,
      samen_je_schwamm: 2,
      saatdatum: vor(30).slice(0, 10),
      gilt_ab: vor(30),
      ...o,
    },
  ];
  t['pflanzung'] = [1, 2, 3].map((n) => ({
    id: uid('28', n),
    satz_id: uid('27', 1),
    gilt_ab: vor(30),
    ...o,
  }));
  t['v_pflanzung_zustand'] = [1, 2, 3].map((n) => ({
    pflanzung_id: uid('28', n),
    satz_id: uid('27', 1),
    phase: 'wachstum',
    phase_seit: vor(10),
    status: 'aktiv',
    netztopf_id: null,
    platz_id: platzId('2.3'),
    loch_nr: n,
  }));
  return t;
}

/** weitere Anlage (zweite echte T oder Demo X / Test Y) mit einem Gefäss 2.3 und W */
export function weitereAnlage(kuerzel: string, datenart: 'echt' | 'demo' | 'test'): Teile {
  const id = uid('3a', kuerzel.charCodeAt(0));
  return {
    anlage: [{ id, kuerzel, name: `Anlage ${kuerzel}`, datenart, aktiv: true, standort: 'indoor', ...o }],
    platz: [
      {
        id: uid('3b', kuerzel.charCodeAt(0) * 10 + 1),
        anlage_id: id,
        bereich_id: null,
        kennung: '2.3',
        rolle: 'gefaess',
        aktiv: true,
        ...o,
      },
      {
        id: uid('3b', kuerzel.charCodeAt(0) * 10 + 2),
        anlage_id: id,
        bereich_id: null,
        kennung: 'W',
        rolle: 'messstelle',
        aktiv: true,
        ...o,
      },
    ],
    gefaess: [
      {
        id: uid('3c', kuerzel.charCodeAt(0)),
        platz_id: uid('3b', kuerzel.charCodeAt(0) * 10 + 1),
        gefaessmodell_id: uid('2d', 1),
        deckeltyp_id: uid('2f', 2),
        betriebsart: 'dwc',
        betriebsvolumen_l: 9,
        intervall_messen_d: 2,
        intervall_wechseln_d: 14,
        gueltig_bis: null,
        ...o,
      },
    ],
  };
}

/** Teile zusammenführen (Zeilen anhängen) */
export function vereinen(...alle: Teile[]): Teile {
  const t: Teile = {};
  for (const teile of alle)
    for (const [name, zeilen] of Object.entries(teile)) t[name] = [...(t[name] ?? []), ...zeilen];
  return t;
}
