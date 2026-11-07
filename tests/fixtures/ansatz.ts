// Teile des Bündels für den Lösungswechsel und die pH-Korrektur (Plan 29 Testliste; Loesungswechsel-AK3, AK5,
// Rundgang-AK3; Konzept R4.1, R4.2, R4.6, R4.7, R4.14). Regal R aus tests/fixtures/messen.ts mit Kalibrierung.
// Ohne Personendaten. Gemeinsam für tests/e2e/abhakliste.spec.ts und tests/e2e/ph-korrektur.spec.ts.
//
// Werte, auf die die Tests rechnen:
// - 2.3 DWC, 9 l, Salate (Lollo Rossa, 3 Pflanzungen, Wachstum); v_zielbereich pH 6.0–6.5, EC 1.0–1.4, 18–22 °C.
// - Kalibrierung vom 11.1.2027 (echt), feste Termine wie messTeile(): gültig bis 31.1.
// - W-Messung 0.50 am 11.1., v_ec_wasser 0.5.
// - k aus dem Becherversuch: 0.300 je Komponente (gilt ab 2.1.2027); drei stabile Neuansätze nach dem Becherversuch
//   in 1.1, 2.1, 2.2 (Ist 10.5 / 7.0 / 3.5 ml auf 9 l, Wasser 0.5 → ECSoll_ist 1.20, Kontrolle 1.20): Teil-Dosis
//   100 %. Rechnung 2.3 nach R4.2 und UC7-AK1: Grow 10.5, Micro 7.0, Bloom 3.5 ml.
// - laufenderWechsel(t, bisNr): Kopf eines Neuansatzes in 2.3 (laufend, begonnen 12.1. 18:31 Zürich, wie aus einem
//   anderen Gerät), Frischwassermessung 0.50 / 20.0 °C und die Schritte 0 bis bisNr mit erledigt_am nach
//   WECHSEL_ZEITEN; timer_ende wie die Datenbank (erledigt_am(t − 1) + 15 min der höchsten Timerzeile).
import { JETZT as MESSEN_JETZT, MESSGERAET, messTeile, mitKalibrierung, SORTE } from './messen.ts';
import { platzId, uid, type Teile } from './regal.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };

/** 12.1.2027 18:00 Zürich (wie die Messmaske) */
export const JETZT = MESSEN_JETZT;
/** Uhrzeit am 12.1.2027 in Zürich als Date */
export const um = (hhmm: string, sekunden = 0): Date => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return new Date(Date.UTC(2027, 0, 12, h - 1, m, sekunden));
};

export const LAUFEND = uid('29', 1);
export const FRISCHWASSER = uid('29', 2);
export const W_MESSUNG = uid('29', 3);

/** erledigt_am der Zeilen 0 bis 17 des laufenden Wechsels (Zürich) */
export const WECHSEL_ZEITEN = [
  '18:30',
  '18:31',
  '18:33',
  '18:35',
  '18:36',
  '18:42',
  '18:43',
  '18:44',
  '18:45',
  '18:46',
  '18:47',
  '19:02',
  '19:05',
  '19:20',
  '19:22',
  '19:25',
  '19:40',
  '19:42',
] as const;

const SCHRITT = [
  'kalibrierung_pruefen',
  'absaugen',
  'frischwasser',
  'frischwasser_messen',
  'gerechnet_fuer',
  'micro',
  'spuelen',
  'grow',
  'spuelen',
  'bloom',
  'umruehren',
  'timer',
  'ph_einstellen',
  'timer',
  'kontrollmessung',
  'restdosis',
  'timer',
  'endmessung',
] as const;

/** Soll je Dosierzeile in ml (Teil-Dosis 100 %) */
const SOLL: Readonly<Record<number, number>> = { 5: 7.0, 7: 10.5, 9: 3.5 };

const K_BECHER = '2027-01-02T09:00:00.000Z';

function messung(e: {
  id: string;
  kennung: string;
  messart: string;
  giltAb: string;
  ph?: number | null;
  ec?: number | null;
  temperatur?: number | null;
  ansatzId?: string | null;
}): Zeile {
  return {
    id: e.id,
    client_id: e.id,
    platz_id: platzId(e.kennung),
    messgeraet_id: MESSGERAET,
    messart: e.messart,
    ph: e.ph ?? null,
    ec: e.ec ?? null,
    ec_eingabe: e.ec == null ? null : e.ec.toFixed(2),
    ec_dezimalen: e.ec == null ? null : 2,
    temperatur: e.temperatur ?? null,
    fuellstand: null,
    bewertung_ph: null,
    bewertung_ec: null,
    bewertung_temp: null,
    schnappschuss: { betriebsart: 'dwc', u_ec: 0.1, u_ph: 0.1 },
    ansatz_id: e.ansatzId ?? null,
    gilt_ab: e.giltAb,
    ...o,
  };
}

function kopf(e: { id: string; kennung: string; begonnenAm: string; status: string }): Zeile {
  return {
    id: e.id,
    client_id: e.id,
    platz_id: platzId(e.kennung),
    typ: 'neuansatz',
    status: e.status,
    begonnen_am: e.begonnenAm,
    abgeschlossen_am: null,
    timer_ende: null,
    stadium_vorschlag: 'wachstum',
    stadium_gewaehlt: 'wachstum',
    gerechnet_fuer: [],
    schnappschuss: {
      zielbereich: { ph_min: 6.0, ph_max: 6.5, ec_min: 1.0, ec_max: 1.4, temp_min: 18, temp_max: 22 },
      betriebsart: 'dwc',
      k: { grow: 0.3, micro_hard_water: 0.3, bloom: 0.3 },
    },
    ec_wasser: 0.5,
    ziel_ec_vorschlag: 1.2,
    ziel_ec_gewaehlt: 1.2,
    dosis_hersteller_ml_l: 3.6,
    dosis_verwendet_ml_l: 2.33,
    skaliert: true,
    teil_dosis: 1.0,
    ec_erwartet_teildosis: 1.2,
    ec_erwartet_final: null,
    k_vorschlag: null,
    volumen_l: 9,
    nachgefuellt_l: null,
    ph_vorher: null,
    ph_nachher: null,
    ist_ersteinstellung: false,
    kontrollmessung_id: null,
    endmessung_id: null,
    dauer_s: null,
    gilt_ab: e.begonnenAm,
    ...o,
  };
}

/** Regal R für den Wechsel in 2.3: Kalibrierung, W-Messung, k aus dem Becherversuch, drei stabile Neuansätze */
export function ansatzTeile(): Teile {
  const t = mitKalibrierung(messTeile());
  t['produkt'] = [
    { produkt_id: 'grow', name: 'Grow' },
    { produkt_id: 'micro_hard_water', name: 'Micro' },
    { produkt_id: 'bloom', name: 'Bloom' },
    { produkt_id: 'ph_minus', name: 'pH-Minus' },
  ];
  t['k_faktor'] = ['grow', 'micro_hard_water', 'bloom'].map((produkt, i) => ({
    id: uid('43', i + 1),
    client_id: uid('43', i + 1),
    produkt_id: produkt,
    wert: 0.3,
    gilt_ab: K_BECHER,
    quelle: 'becherversuch',
    ...o,
  }));
  (t['messung'] ??= []).push(
    messung({
      id: W_MESSUNG,
      kennung: 'W',
      messart: 'w',
      giltAb: '2027-01-11T08:00:00.000Z',
      ec: 0.5,
      temperatur: 18.0,
    }),
  );
  t['v_ec_wasser'] = [
    { anlage_id: uid('2a', 1), ec: 0.5, gemessen_am: '2027-01-11T08:00:00.000Z', herkunft: 'w' },
  ];
  // drei stabile Neuansätze nach dem Becherversuch (je ECSoll_ist 1.20, Kontrolle 1.20)
  ['1.1', '2.1', '2.2'].forEach((kennung, i) => {
    const id = uid('29', 10 + i);
    const kontrolle = uid('29', 20 + i);
    const beginn = new Date(Date.UTC(2027, 0, 3 + 2 * i, 17, 0)).toISOString();
    (t['naehrloesungsansatz'] ??= []).push({
      ...kopf({ id, kennung, begonnenAm: beginn, status: 'abgeschlossen' }),
      kontrollmessung_id: kontrolle,
      ec_erwartet_final: 1.2,
    });
    (t['messung'] ??= []).push(
      messung({
        id: kontrolle,
        kennung,
        messart: 'kontrolle_ansatz',
        giltAb: new Date(Date.UTC(2027, 0, 3 + 2 * i, 17, 50)).toISOString(),
        ph: 6.2,
        ec: 1.2,
        temperatur: 20.0,
        ansatzId: id,
      }),
    );
    (t['ansatz_position'] ??= []).push(
      ...[
        ['grow', 10.5],
        ['micro_hard_water', 7.0],
        ['bloom', 3.5],
      ].map(([produkt, ml], j) => ({
        id: uid('22', 100 + i * 10 + j),
        client_id: uid('22', 100 + i * 10 + j),
        ansatz_id: id,
        produkt_id: produkt,
        soll_ml: ml,
        ist_ml: ml,
        bezugsvolumen_l: 9,
        ...o,
      })),
    );
  });
  t['ansatz_schritt'] = [];
  t['v_ph_wirkung'] = [{ wirkung_ml_je_l_je_0_1: null }];
  // Plan 34: der Zielbereich des Neuansatzes kommt aus v_sollwert der zählenden Pflanzungen (R2.1, R2.2), nicht mehr
  // aus v_zielbereich; Lollo Rossa in Wachstum wie v_zielbereich von 2.3 (pH 6.0–6.5, EC 1.0–1.4, 18–22 °C)
  t['v_sollwert'] = [
    ['ph', 6.0, 6.5, null],
    ['ec', 1.0, 1.4, 'gesamt'],
    ['wassertemp', 18, 22, null],
  ].map(([groesse, min, max, basis]) => ({
    sorte_id: SORTE.lollo,
    phase: 'wachstum',
    groesse,
    wert_min: min,
    wert_typ: null,
    wert_max: max,
    text_wert: null,
    herkunft_ebene: 'art',
    evidenzklasse: 'B',
    vermerk: 'keine',
    ec_basis_quelle: basis,
  }));
  return t;
}

/** Kopf, Frischwassermessung und Schritte 0 bis `bisNr` eines laufenden Wechsels in 2.3 (aus einem anderen Gerät) */
export function laufenderWechsel(t: Teile, bisNr: number): Teile {
  const zeit = (nr: number) => um(WECHSEL_ZEITEN[nr] as string).toISOString();
  const k = kopf({ id: LAUFEND, kennung: '2.3', begonnenAm: zeit(1), status: 'laufend' });
  // timer_ende wie ansatz_zustand_nachrechnen(): höchste Timerzeile t mit erledigtem Vorgänger
  const timer = [16, 13, 11].find((nr) => nr - 1 <= bisNr);
  if (timer !== undefined)
    k['timer_ende'] = new Date(Date.parse(zeit(timer - 1)) + 15 * 60_000).toISOString();
  (t['naehrloesungsansatz'] ??= []).push(k);
  (t['messung'] ??= []).push(
    messung({
      id: FRISCHWASSER,
      kennung: '2.3',
      messart: 'frischwasser',
      giltAb: zeit(3),
      ec: 0.5,
      temperatur: 20.0,
      ansatzId: LAUFEND,
    }),
  );
  for (let nr = 0; nr <= bisNr; nr += 1) {
    const soll = SOLL[nr] ?? null;
    (t['ansatz_schritt'] ??= []).push({
      id: uid('4a', 100 + nr),
      client_id: uid('4a', 100 + nr),
      ansatz_id: LAUFEND,
      nr,
      schritt: SCHRITT[nr],
      erledigt_am: zeit(nr),
      soll_ml: soll,
      ist_ml: soll,
      ph_minus_ml: nr === 12 ? 1.0 : null,
      ...o,
    });
  }
  return t;
}
