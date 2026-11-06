// Teile des Bündels für die Messmaske (Plan 26 Testliste; UC9, R2.2, R2.5, R4.5, R10.1 bis R10.5): Regal R aus
// tests/fixtures/regal.ts plus Kulturgruppen, Arten, Sorten, Pflanzungen, v_zielbereich, v_ec_wasser, Messungen
// und Ansätze in Bündelform. Gemeinsam für Unit (tests/unit/messung-*.test.ts, bewertung*.test.ts) und E2E
// (tests/e2e/messen-maske.spec.ts). Ohne Personendaten; Kulturgruppen und Sorten sind Gattungs- und Handelsnamen.
//
// Werte, auf die die Tests rechnen (jetzt = 12.1.2027 18:00 Zürich):
// - Messgerät u_EC 0.10, u_pH 0.10 (Hundertstel 10 und 10); keine Kalibrierung (Banner «Noch nie kalibriert»),
//   mitKalibrierung() fügt eine echte vom 11.1. hinzu.
// - 2.3 DWC: Salate (Lollo Rossa, 3 Pflanzungen, Wachstum); v_zielbereich pH 6.0–6.5, EC 1.0–1.4 (als Text «1.000»
//   und «1.400» wie numeric aus PostgREST möglich), 18–22 °C. Messungen 8.1. (6.0, 1.25, 20.0), 10.1. (6.1, 1.20,
//   20.5), 11.1. 08:00 nur 21.0 °C, 11.1. 10:00 storniert (6.4, 1.60). Neuansatz vom 31.12.2026 mit Schnappschuss
//   pH 5.8–6.3, EC 1.0–1.4, 18–22 (aus regalTeile()).
// - 3.1 Kratky belüftet: Salate (Eichblatt, 2 Pflanzungen); v_zielbereich pH 6.0–6.5, EC 0.8–1.2, 18–22 °C;
//   Messung 5.1. (6.5, 1.00, 19.0, über ⅓).
// - 3.2 Kratky belüftet: Blattgemüse (Spinat Matador, 2 Pflanzungen); v_zielbereich pH 6.0–6.5, EC 0.8–1.2,
//   15–20 °C; Messung 10.1. (6.2, 1.00, 18.5).
// - 4.4 Station (feste_dosis): keine Pflanzungen, kein v_zielbereich, kein Ansatz; v_ec_wasser der Anlage 0.5.
// - 2.1 DWC: keine Pflanzungen, kein Ansatz, kein v_zielbereich (ohne Sollband).
import { ANLAGE_R, platzId, regalTeile, uid, type Teile } from './regal.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };
const gueltig = { gueltig_bis: null };

export const JETZT = new Date('2027-01-12T17:00:00Z');
export const MESSGERAET = uid('23', 1);

export const KULTURGRUPPE = {
  salate: { kulturgruppe_id: 'salate', name: 'Salate' },
  blattgemuese: { kulturgruppe_id: 'blattgemuese', name: 'Blattgemüse' },
  kraeuter: { kulturgruppe_id: 'kraeuter', name: 'Kräuter' },
} as const;

export const SORTE = {
  lollo: uid('26', 1),
  eichblatt: uid('26', 2),
  spinat: uid('26', 3),
  basilikum: uid('26', 4),
} as const;

export const MESSUNG = {
  m23alt: uid('24', 11),
  m23: uid('24', 12),
  m23temp: uid('24', 13),
  m23storniert: uid('24', 14),
  m31: uid('24', 21),
  m32: uid('24', 22),
} as const;

/** Neuansatz in 2.3 aus regalTeile() */
export const ANSATZ_23 = uid('21', 1);

const ARTEN: Zeile[] = [
  { art_id: 'lactuca_sativa', name_de: 'Salat', kulturgruppe_id: 'salate' },
  { art_id: 'spinacia_oleracea', name_de: 'Spinat', kulturgruppe_id: 'blattgemuese' },
  { art_id: 'ocimum_basilicum', name_de: 'Basilikum', kulturgruppe_id: 'kraeuter' },
];

const SORTEN: Zeile[] = [
  { sorte_id: SORTE.lollo, name: 'Lollo Rossa', art_id: 'lactuca_sativa' },
  { sorte_id: SORTE.eichblatt, name: 'Eichblatt', art_id: 'lactuca_sativa' },
  { sorte_id: SORTE.spinat, name: 'Matador', art_id: 'spinacia_oleracea' },
  { sorte_id: SORTE.basilikum, name: 'Genoveser', art_id: 'ocimum_basilicum' },
];

/** Messung in Bündelform (Spalten wie public.messung, ohne Bewertung) */
export function messungZeile(e: {
  id: string;
  kennung: string;
  giltAb: string;
  ph?: number | null;
  ec?: number | null;
  temperatur?: number | null;
  fuellstand?: 'ueber_drittel' | 'unter_drittel' | null;
  betriebsart?: string;
  storniertAm?: string | null;
  ansatzId?: string | null;
}): Zeile {
  return {
    id: e.id,
    client_id: e.id,
    platz_id: platzId(e.kennung),
    messgeraet_id: MESSGERAET,
    messart: 'aufgabe',
    ph: e.ph ?? null,
    ec: e.ec ?? null,
    ec_eingabe: e.ec == null ? null : e.ec.toFixed(2),
    ec_dezimalen: e.ec == null ? null : 2,
    temperatur: e.temperatur ?? null,
    fuellstand: e.fuellstand ?? null,
    bewertung_ph: null,
    bewertung_ec: null,
    bewertung_temp: null,
    schnappschuss: { betriebsart: e.betriebsart ?? 'dwc', u_ec: 0.1, u_ph: 0.1 },
    ansatz_id: e.ansatzId ?? null,
    gilt_ab: e.giltAb,
    storniert_am: e.storniertAm ?? null,
  };
}

/** Ansatz in Bündelform (Spalten wie public.naehrloesungsansatz, soweit die Maske sie liest) */
export function ansatzZeile(e: {
  id: string;
  kennung: string;
  typ: 'neuansatz' | 'nachfuellen' | 'ph_korrektur' | 'teilwechsel';
  begonnenAm: string;
  status?: 'laufend' | 'abgeschlossen' | 'abgebrochen';
  stadium?: string | null;
  kontrollmessungId?: string | null;
  endmessungId?: string | null;
  storniertAm?: string | null;
  zielbereich?: Record<string, number>;
}): Zeile {
  return {
    id: e.id,
    client_id: e.id,
    platz_id: platzId(e.kennung),
    typ: e.typ,
    status: e.status ?? 'abgeschlossen',
    begonnen_am: e.begonnenAm,
    stadium_gewaehlt: e.stadium ?? null,
    volumen_l: 9,
    nachgefuellt_l: e.typ === 'nachfuellen' ? 2 : null,
    schnappschuss: e.zielbereich ? { zielbereich: e.zielbereich } : {},
    kontrollmessung_id: e.kontrollmessungId ?? null,
    endmessung_id: e.endmessungId ?? null,
    gilt_ab: e.begonnenAm,
    storniert_am: e.storniertAm ?? null,
  };
}

/** Ansatz an die Teile anhängen */
export function ansatzHinzu(t: Teile, e: Parameters<typeof ansatzZeile>[0]): void {
  (t['naehrloesungsansatz'] ??= []).push(ansatzZeile(e));
}

/**
 * Satz mit aktiven Pflanzungen: `kennung` = aktueller Platz (v_pflanzung_zustand.platz_id), `direktsaat` = Satz im
 * Direktsaat-Gefäss ohne Ortsereignis (platz_id leer, Platz aus satz.direktsaat_platz_id).
 */
export function pflanzungenHinzu(
  t: Teile,
  e: {
    satzNr: number;
    sorteId: string;
    anzahl: number;
    kennung?: string;
    direktsaat?: string;
    phase?: string;
  },
): void {
  const satzId = uid('27', e.satzNr);
  (t['satz'] ??= []).push({
    id: satzId,
    client_id: satzId,
    sorte_id: e.sorteId,
    kulturform: 'kopf',
    anzuchtort_platz_id: e.direktsaat ? null : platzId('A1'),
    direktsaat_platz_id: e.direktsaat ? platzId(e.direktsaat) : null,
    anzahl_schwaemme: e.anzahl,
    samen_je_schwamm: 1,
    saatdatum: '2026-12-10',
    gilt_ab: '2026-12-10T10:00:00.000Z',
    ...o,
  });
  for (let i = 1; i <= e.anzahl; i += 1) {
    const id = uid('28', e.satzNr * 100 + i);
    (t['pflanzung'] ??= []).push({
      id,
      client_id: id,
      satz_id: satzId,
      gilt_ab: '2026-12-10T10:00:00.000Z',
      ...o,
    });
    (t['v_pflanzung_zustand'] ??= []).push({
      pflanzung_id: id,
      satz_id: satzId,
      phase: e.phase ?? 'wachstum',
      phase_seit: '2027-01-02T10:00:00.000Z',
      status: 'aktiv',
      netztopf_id: null,
      platz_id: e.kennung ? platzId(e.kennung) : null,
      loch_nr: e.kennung ? i : null,
    });
  }
}

/** Zeile aus v_zielbereich (Form der Sicht) */
export function zielbereichZeile(
  kennung: string,
  w: { ph: [unknown, unknown]; ec: [unknown, unknown]; temp: [unknown, unknown]; anzahl: number },
): Zeile {
  return {
    platz_id: platzId(kennung),
    ph_min: w.ph[0],
    ph_max: w.ph[1],
    ec_min: w.ec[0],
    ec_max: w.ec[1],
    temp_min: w.temp[0],
    temp_max: w.temp[1],
    zaehlende_pflanzungen: w.anzahl,
  };
}

/** echte Kalibrierung vom 11.1.2027 (gültig bis zum festen Termin 31.1.): kein Banner «unsicher» */
export function mitKalibrierung(t: Teile): Teile {
  t['kalibrierung'] = [
    {
      id: uid('42', 1),
      client_id: uid('42', 1),
      messgeraet_id: MESSGERAET,
      datenart: 'echt',
      gilt_ab: '2027-01-11T07:00:00.000Z',
      gegenprobe_ec: 1.41,
      nach_reinigung: false,
      ...o,
    },
  ];
  return t;
}

/** Nachfüllen in 2.3 am 11.1. 12:00 Zürich, nach allen Messungen in 2.3: die letzte Messung ist veraltet */
export function mitNachfuellen23(t: Teile): Teile {
  ansatzHinzu(t, {
    id: uid('21', 30),
    kennung: '2.3',
    typ: 'nachfuellen',
    begonnenAm: '2027-01-11T11:00:00.000Z',
  });
  return t;
}

/** Regal R für die Messmaske am 12.1.2027 */
export function messTeile(): Teile {
  const t = regalTeile(JETZT);
  t['messgeraet'] = [{ id: MESSGERAET, modell: 'Aquamaster P160 Pro2', u_ec: 0.1, u_ph: 0.1 }];
  t['kulturgruppe'] = Object.values(KULTURGRUPPE).map((k, i) => ({
    id: uid('40', i + 1),
    ...k,
    leitkultur_art_id: 'lactuca_sativa',
  }));
  t['art'] = ARTEN.map((a, i) => ({ id: uid('41', i + 1), ...a, ...gueltig }));
  t['sorte'] = SORTEN.map((s, i) => ({ id: uid('25', i + 1), ...s, kulturtyp: 'samenfest', ...gueltig }));
  // Satz 1 (Lollo Rossa in 2.3, drei Pflanzungen) bleibt aus regalTeile()
  pflanzungenHinzu(t, { satzNr: 2, sorteId: SORTE.eichblatt, anzahl: 2, kennung: '3.1' });
  pflanzungenHinzu(t, { satzNr: 3, sorteId: SORTE.spinat, anzahl: 2, kennung: '3.2' });
  t['v_ec_wasser'] = [{ anlage_id: ANLAGE_R, ec: 0.5, gemessen_am: null, herkunft: 'annahme' }];
  t['v_zielbereich'] = [
    zielbereichZeile('2.3', { ph: [6.0, 6.5], ec: ['1.000', '1.400'], temp: [18, 22], anzahl: 3 }),
    zielbereichZeile('3.1', { ph: [6.0, 6.5], ec: [0.8, 1.2], temp: [18, 22], anzahl: 2 }),
    zielbereichZeile('3.2', { ph: [6.0, 6.5], ec: [0.8, 1.2], temp: [15, 20], anzahl: 2 }),
  ];
  // Ansatz aus regalTeile() um die Spalten ergänzen, die die Maske liest
  t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) => ({
    stadium_gewaehlt: null,
    nachgefuellt_l: null,
    kontrollmessung_id: null,
    endmessung_id: null,
    client_id: a['id'],
    ...a,
  }));
  t['messung'] = [
    messungZeile({
      id: MESSUNG.m23alt,
      kennung: '2.3',
      giltAb: '2027-01-08T17:00:00.000Z',
      ph: 6.0,
      ec: 1.25,
      temperatur: 20.0,
    }),
    messungZeile({
      id: MESSUNG.m23,
      kennung: '2.3',
      giltAb: '2027-01-10T17:00:00.000Z',
      ph: 6.1,
      ec: 1.2,
      temperatur: 20.5,
    }),
    messungZeile({
      id: MESSUNG.m23temp,
      kennung: '2.3',
      giltAb: '2027-01-11T07:00:00.000Z',
      temperatur: 21.0,
    }),
    messungZeile({
      id: MESSUNG.m23storniert,
      kennung: '2.3',
      giltAb: '2027-01-11T09:00:00.000Z',
      ph: 6.4,
      ec: 1.6,
      temperatur: 21.5,
      storniertAm: '2027-01-11T09:05:00.000Z',
    }),
    messungZeile({
      id: MESSUNG.m31,
      kennung: '3.1',
      giltAb: '2027-01-05T17:00:00.000Z',
      ph: 6.5,
      ec: 1.0,
      temperatur: 19.0,
      fuellstand: 'ueber_drittel',
      betriebsart: 'kratky_belueftet',
    }),
    messungZeile({
      id: MESSUNG.m32,
      kennung: '3.2',
      giltAb: '2027-01-10T17:00:00.000Z',
      ph: 6.2,
      ec: 1.0,
      temperatur: 18.5,
      fuellstand: 'ueber_drittel',
      betriebsart: 'kratky_belueftet',
    }),
  ];
  t['kalibrierung'] = [];
  t['einstellung'] = [
    {
      id: uid('34', 1),
      thema: 'hell',
      zeitzone: 'Europe/Zurich',
      feste_kalibriertermine: ['2027-01-01', '2027-01-31', '2027-02-24', '2027-03-24'],
      stationsgrenze_ab: '2027-02-04',
    },
  ];
  return t;
}
