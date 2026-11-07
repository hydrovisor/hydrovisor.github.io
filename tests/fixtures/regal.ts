// Teile des Bündels (Form von PostgREST) für das Regal R nach Konzept 5.2 (Plan 20): 4 Bereiche, 13 Gefässe
// (davon 5 Stationen auf Ebene 4), Anzuchtboxen A1 bis A4, Messstelle W. Dazu eine Lösung, Messungen, ein Ansatz mit
// Positionen und ein Satz in 2.3. Ohne Personendaten. Gemeinsam für Unit und E2E.
// Plan 21: Vorlagen mit Innenmassen, Deckel mit Lochbild (Konzept 5.3, 5.4), Netztöpfe je Loch (ohne S8, A5),
// Etiketten je Platz, Ereignisse gefaess_erfasst, Gefässprüfung und Ruhe passend zu v_gefaess_status; leeresRegal().

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

/** Vorlagen der Boxen mit Innenmassen in mm (A: Innenmasse geschätzt; Betriebsvolumen wie bisher) */
const MODELLE: Record<Ortdef['modell'], Zeile> = {
  rako: {
    id: uid('2d', 1),
    client_id: uid('2d', 1),
    name: 'Rako 40 × 30 × 22',
    form: 'rechteckig',
    innen_l_mm: 365,
    innen_b_mm: 265,
    innen_h_mm: 200,
    nennvolumen_l: 19,
    betriebsvolumen_l: 9,
    ...o,
  },
  // 270 × 180 × 110 mm = 5 346 000 mm³ = 5.346 l (Grenze für UC3-AK2)
  halb: {
    id: uid('2d', 2),
    client_id: uid('2d', 2),
    name: 'Rako 30 × 20 × 12',
    form: 'rechteckig',
    innen_l_mm: 270,
    innen_b_mm: 180,
    innen_h_mm: 110,
    nennvolumen_l: 5,
    betriebsvolumen_l: 3,
    ...o,
  },
  leni: {
    id: uid('2d', 3),
    client_id: uid('2d', 3),
    name: 'Leni Flori 36',
    form: 'oval',
    innen_l_mm: 350,
    innen_b_mm: 120,
    innen_h_mm: 100,
    nennvolumen_l: 3.7,
    betriebsvolumen_l: 2.3,
    ...o,
  },
};
export const modellId = (modell: Ortdef['modell']) => MODELLE[modell]['id'] as string;

/**
 * Deckel und Platten nach Konzept 5.3 und 5.4: Löcher je Reihe von vorne nach hinten und Topfdurchmesser.
 * D6 und S5 stehen so im Konzept; die Aufteilung in Reihen von D1, D2, D3, D4 und S8 ist angenommen (A), gleich wie
 * `DECKEL_VORSCHLAEGE` (src/domain/vorlagen/deckel-vorschlaege.ts) und Demo S1 (#131). Lochzahl und Grösse folgen
 * Konzept 5.3 (D1 4 × 8, D2 6 × 8, D3 8 × 5, D4 2 × 8, S8 4 × 8 in einer Reihe längs in der Regaltiefe).
 */
export const DECKELTYPEN: Record<string, { topfdurchmesser_mm: 50 | 80; loecher_je_reihe: number[] }> = {
  D1: { topfdurchmesser_mm: 80, loecher_je_reihe: [2, 2] },
  D2: { topfdurchmesser_mm: 80, loecher_je_reihe: [3, 3] },
  D3: { topfdurchmesser_mm: 50, loecher_je_reihe: [4, 4] },
  D4: { topfdurchmesser_mm: 80, loecher_je_reihe: [1, 1] },
  D6: { topfdurchmesser_mm: 50, loecher_je_reihe: [2, 2, 2] },
  S8: { topfdurchmesser_mm: 80, loecher_je_reihe: [1, 1, 1, 1] },
  S5: { topfdurchmesser_mm: 50, loecher_je_reihe: [1, 2, 1, 2, 1, 2, 1, 2, 1] },
};
const DECKEL = ['D1', 'D2', 'D3', 'D4', 'D6', 'S8', 'S5'];
export const deckelId = (name: string) => uid('2f', DECKEL.indexOf(name) + 1);
const lochzahl = (name: string) => (DECKELTYPEN[name]?.loecher_je_reihe ?? []).reduce((a, b) => a + b, 0);

/** Netztöpfe je Loch mit Heimplatz (Konzept 5.4); 4.2 und 4.3 (S8, feste Dosis, 80 mm) ohne eigene Töpfe (A5) */
const TOEPFE = GEFAESSE.filter((g) => g.deckel !== 'S8').flatMap((g) =>
  Array.from({ length: lochzahl(g.deckel) }, (_, i) => ({
    gefaess: g,
    loch: i + 1,
    kennung: `${g.kennung}.${i + 1}`,
  })),
);
export const netztopfId = (kennung: string) => uid('31', TOEPFE.findIndex((t) => t.kennung === kennung) + 1);

const BETRIEBSART_BEREICH = ['dwc', 'dwc', 'kratky_belueftet', 'konstantpegel'];
/** Luftpumpen nach Konzept 5.2 */
const PUMPE: Record<string, string> = {
  '1.1': 'P1',
  '1.2': 'P1',
  '2.1': 'P2',
  '2.2': 'P2',
  '2.3': 'P2',
  '3.1': 'P3',
  '3.2': 'P3',
  '3.3': 'P3',
  '4.1': 'P4',
  '4.2': 'P4',
  '4.3': 'P4',
  '4.4': 'P4',
  '4.5': 'P3',
};

/** Anlage R, Bereiche mit Standard-Betriebsart, Vorlagen für Box und Deckel, Messgerät */
function stammdaten(): Teile {
  return {
    anlage: [
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
    ],
    bereich: [1, 2, 3, 4].map((n) => ({
      id: uid('2e', n),
      anlage_id: ANLAGE_R,
      nummer: n,
      name: `Ebene ${n}`,
      standard_betriebsart: BETRIEBSART_BEREICH[n - 1],
      ...o,
    })),
    gefaessmodell: Object.values(MODELLE).map((m) => ({ ...m })),
    deckeltyp: DECKEL.map((name, i) => ({
      id: uid('2f', i + 1),
      client_id: uid('2f', i + 1),
      name,
      ...DECKELTYPEN[name],
      service_oeffnung: true,
      ...o,
    })),
    messgeraet: [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.05, u_ph: 0.05 }],
  };
}

/** Anlage R mit Bereichen und Vorlagen, ohne Plätze, Gefässe, Anzuchtorte und W (Start des Assistenten) */
export function leeresRegal(): Teile {
  return {
    ...stammdaten(),
    platz: [],
    etikett: [],
    gefaess: [],
    anzuchtort: [],
    netztopf: [],
    ereignis: [],
    v_gefaess_status: [],
    v_fuellzustand: [],
    satz: [],
    pflanzung: [],
    v_pflanzung_zustand: [],
    v_reservierung_aktiv: [],
    messung: [],
    v_messung_unsicher: [],
    naehrloesungsansatz: [],
    ansatz_position: [],
  };
}

/** Regal R mit 4 Bereichen, 13 Gefässen, 4 Anzuchtboxen, W. `jetzt` bestimmt die Zeitstempel relativ. */
export function regalTeile(jetzt = new Date('2026-12-10T08:00:00Z')): Teile {
  const vor = (tage: number, stunden = 0) =>
    new Date(jetzt.getTime() - (tage * 24 + stunden) * 3600_000).toISOString();
  const t: Teile = stammdaten();
  const position = (kennung: string) => Number(kennung.split('.')[1]);
  t['platz'] = [
    ...GEFAESSE.map((g) => ({
      id: platzId(g.kennung),
      client_id: platzId(g.kennung),
      anlage_id: ANLAGE_R,
      bereich_id: uid('2e', g.bereich),
      kennung: g.kennung,
      rolle: 'gefaess',
      position: position(g.kennung),
      aktiv: true,
      ...o,
    })),
    ...BOXEN.map((b) => ({
      id: platzId(b.kennung),
      client_id: platzId(b.kennung),
      anlage_id: ANLAGE_R,
      bereich_id: uid('2e', 4),
      kennung: b.kennung,
      rolle: 'anzuchtort',
      position: null,
      aktiv: true,
      ...o,
    })),
    {
      id: platzId('W'),
      client_id: platzId('W'),
      anlage_id: ANLAGE_R,
      bereich_id: null,
      kennung: 'W',
      rolle: 'messstelle',
      position: null,
      aktiv: true,
      ...o,
    },
  ];
  // Etikett je Platz (Code aus Kürzel und Kennung), noch nicht gedruckt; Anzuchtboxen 55 × 25 (Konzept 5.4)
  t['etikett'] = (t['platz'] as { id: string; kennung: string; rolle: string }[]).map((p, i) => ({
    id: uid('32', i + 1),
    client_id: uid('32', i + 1),
    code: `R-${p.kennung}`,
    platz_id: p.id,
    format: p.rolle === 'anzuchtort' ? '55x25' : '70x42_3',
    gedruckt_am: null,
    ...o,
  }));
  t['gefaess'] = GEFAESSE.map((g) => ({
    id: gefaessId(g.kennung),
    client_id: gefaessId(g.kennung),
    platz_id: platzId(g.kennung),
    gefaessmodell_id: MODELLE[g.modell]['id'],
    deckeltyp_id: deckelId(g.deckel),
    betriebsart: g.betriebsart,
    // Stationen 4.1 bis 4.5 als Konstantpegel mit fester Dosis (R4.5)
    feste_dosis: g.betriebsart === 'konstantpegel',
    luftpumpe: PUMPE[g.kennung] ?? null,
    betriebsvolumen_l: MODELLE[g.modell]['betriebsvolumen_l'],
    intervall_messen_d: 2,
    intervall_nachfuellen_d: g.betriebsart.startsWith('kratky') ? null : 2,
    intervall_wechseln_d: g.wechsel,
    naechster_wechsel_am: null,
    gueltig_von: vor(40),
    gueltig_bis: null,
    ...o,
  }));
  t['netztopf'] = TOEPFE.map((tp, i) => ({
    id: uid('31', i + 1),
    client_id: uid('31', i + 1),
    anlage_id: ANLAGE_R,
    kennung: tp.kennung,
    groesse_mm: DECKELTYPEN[tp.gefaess.deckel]?.topfdurchmesser_mm,
    heim_platz_id: platzId(tp.gefaess.kennung),
    heim_loch_nr: tp.loch,
    aktiv: true,
    ...o,
  }));
  // Ereignisse passend zu v_gefaess_status: alle vor 40 Tagen erfasst; ausser 3.3 am Tag danach geprüft
  // (Schritte 1 bis 4); 1.2 ruht seit 5 Tagen
  let n = 0;
  const ereignis = (typ: string, kennung: string, gilt: string, daten: Record<string, unknown> = {}) => {
    n += 1;
    return {
      id: uid('33', n),
      client_id: uid('33', n),
      typ,
      platz_id: platzId(kennung),
      daten,
      gilt_ab: gilt,
      ...o,
    };
  };
  t['ereignis'] = [
    ...GEFAESSE.map((g) => ereignis('gefaess_erfasst', g.kennung, vor(40))),
    ...GEFAESSE.filter((g) => g.kennung !== '3.3').flatMap((g) =>
      [1, 2, 3, 4].map((schritt) =>
        ereignis(
          'gefaesspruefung',
          g.kennung,
          vor(39),
          schritt === 4
            ? { schritt, ok: true, volumen_gezaehlt_l: MODELLE[g.modell]['betriebsvolumen_l'] }
            : { schritt, ok: true },
        ),
      ),
    ),
    ereignis('ruhe', '1.2', vor(5), { gesetzt: true }),
  ];
  t['anzuchtort'] = BOXEN.map((b, i) => ({
    id: uid('20', i + 1),
    client_id: uid('20', i + 1),
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
  t['v_reservierung_aktiv'] = [];
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
