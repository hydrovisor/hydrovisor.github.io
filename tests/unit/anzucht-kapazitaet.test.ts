// Kapazität der Stationen und der Anzuchtbox (Plan 23 Testliste; UC5-AK15, R6.1, TZ). Injizierte Uhr
// 2027-01-07T08:00:00Z, Zeitzone Europe/Zurich; Regal R aus tests/fixtures/saeen.ts ohne den Satz in 2.3.
// Stationen von Regal R: 4.1 (D6, 6 × 5 cm), 4.2 und 4.3 (S8, je 4 × 8 cm), 4.4 und 4.5 (S5, je 13 × 5 cm)
// = 32 Plätze 5 cm und 8 Plätze 8 cm.
//
// Vertrag (Plan 23 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   GeplanterSatz = { sorte: string (Name für die Texte); artId; saatdatum; keimdauerTyp; umsetzenAm; schwaemme;
//     zieltoepfe; direktsaat }
//   stationsBelegung(teile, anlageId, tag, geplant) zählt (a) aktive Pflanzungen auf einem Stationsplatz bis
//     vor ihr geplantes Umsetzdatum (am Umsetzdatum ist der Platz frei), ohne Reservierung bis vor
//     Saat + umsetzen_ab_d; (b) Sätze in einer Box ab Saat + typische Keimdauer; (c) die geplanten Sätze genauso.
//   stationsVorschau: je Keimtag eine Zeile; frei = Plätze − Belegung einschliesslich der geplanten Sätze.
//   Warnung «zu_wenig_platz» vergleicht den Bedarf eines Satzes mit den Plätzen, die ohne ihn frei sind.
import { describe, expect, it } from 'vitest';
import {
  ARTEN_80MM,
  boxBelegung,
  fruehestesSaatdatum,
  stationsBedarf,
  stationsBelegung,
  stationsGroesse,
  stationsPlaetze,
  stationsVorschau,
  type GeplanterSatz,
} from '../../src/domain/anzucht/kapazitaet.ts';
import { kalendertag, ZEITZONE } from '../../src/domain/zeit.ts';
import { gefaessId, netztopfId, platzId } from '../fixtures/regal.ts';
import {
  ANLAGE_R,
  aufStation,
  inDerBox,
  reservierung,
  saatTeile,
  SORTE,
  STATION_5CM,
} from '../fixtures/saeen.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');
const GRENZE = { stationsgrenzeAb: '2027-02-04' };
const leer = () => saatTeile(JETZT, { ohneSatzIn23: true });

const salat = (e: Partial<GeplanterSatz> = {}): GeplanterSatz => ({
  sorte: 'Lollo Rossa',
  artId: 'lactuca_sativa',
  saatdatum: '2027-01-07',
  keimdauerTyp: 4,
  umsetzenAm: '2027-01-28',
  schwaemme: 7,
  zieltoepfe: 5,
  direktsaat: false,
  ...e,
});

const tomate = (e: Partial<GeplanterSatz> = {}): GeplanterSatz => ({
  sorte: 'Ochsenherz',
  artId: 'solanum_lycopersicum',
  saatdatum: '2027-02-04',
  keimdauerTyp: 7,
  umsetzenAm: '2027-03-04',
  schwaemme: 6,
  zieltoepfe: 5,
  direktsaat: false,
  ...e,
});

/** 28 Pflanzungen Salat auf 5-cm-Plätzen, gesät 30.12.2026: ohne Reservierung auf der Station bis 20.1. (21 d) */
function vollerStation() {
  const t = leer();
  aufStation(t, {
    satzNr: 50,
    sorteId: SORTE.lollo,
    saatdatum: '2026-12-30',
    loecher: STATION_5CM.slice(0, 28),
  });
  return t;
}

const warnungen = (v: ReturnType<typeof stationsVorschau>, art: string) =>
  v.warnungen.filter((w) => w.art === art);

describe('UC5-AK15 Kapazität der Station', () => {
  it('UC5-AK15 Satz ab Stationsgrenze mit 17 Zieltöpfen (5 cm) warnt «Satz … belegt 18 von höchstens 16 Plätzen»', () => {
    const v = stationsVorschau(
      leer(),
      ANLAGE_R,
      [salat({ saatdatum: '2027-02-04', umsetzenAm: '2027-02-25', schwaemme: 20, zieltoepfe: 17 })],
      GRENZE,
    );
    const w = warnungen(v, 'stationsgrenze');
    expect(w).toHaveLength(1);
    expect(w[0]?.text).toContain('Satz Lollo Rossa belegt 18 von höchstens 16 Plätzen');
    // 18 von 32 sind frei: keine Warnung «zu wenig Platz»
    expect(warnungen(v, 'zu_wenig_platz')).toEqual([]);
  });

  it('UC5-AK15 Satz am Tag vor der Stationsgrenze warnt nicht', () => {
    const v = stationsVorschau(
      leer(),
      ANLAGE_R,
      [salat({ saatdatum: '2027-02-03', umsetzenAm: '2027-02-24', schwaemme: 20, zieltoepfe: 17 })],
      GRENZE,
    );
    expect(v.warnungen).toEqual([]);
  });

  it('UC5-AK15 Tomate mit 5 Zieltöpfen ab Stationsgrenze: belegt 5 von höchstens 4', () => {
    const v = stationsVorschau(leer(), ANLAGE_R, [tomate()], GRENZE);
    const w = warnungen(v, 'stationsgrenze');
    expect(w).toHaveLength(1);
    expect(w[0]?.text).toContain('Satz Ochsenherz belegt 5 von höchstens 4 Plätzen');
    expect(warnungen(v, 'zu_wenig_platz')).toEqual([]);
    // 4 Zieltöpfe bleiben unter der Grenze
    expect(stationsVorschau(leer(), ANLAGE_R, [tomate({ zieltoepfe: 4 })], GRENZE).warnungen).toEqual([]);
  });

  it('UC5-AK15 mehr Schwämme als freie Plätze: Warnung ohne Sperre mit frühestem Saatdatum mit genug Platz', () => {
    const t = vollerStation();
    // Keimtag 11.1.: 4 Plätze 5 cm frei, Bedarf min(7, 5 + 1) = 6
    const v = stationsVorschau(t, ANLAGE_R, [salat()], GRENZE);
    const w = warnungen(v, 'zu_wenig_platz');
    expect(w).toHaveLength(1);
    expect(w[0]?.text).toContain('Zu wenig Platz auf der Station am 11.1.');
    expect(w[0]?.text).toContain('Lollo Rossa braucht 6, frei 4 (5 cm)');
    // die 28 Pflanzungen verlassen die Station am 20.1.: Saat 16.1. + 4 Tage Keimdauer
    expect(w[0]?.text).toContain('Genug Platz bei Saat am 16.1.');
    expect(fruehestesSaatdatum(t, ANLAGE_R, salat(), [])).toBe('2027-01-16');
  });

  it('UC5-AK15 Stationsvorschau am Saat + typische Keimdauer: frei x von 32 (5 cm), y von 8 (8 cm)', () => {
    const v = stationsVorschau(leer(), ANLAGE_R, [salat({ keimdauerTyp: 6 })], GRENZE);
    expect(v.zeilen).toEqual([
      {
        tag: '2027-01-13',
        frei50: 26,
        plaetze50: 32,
        frei80: 8,
        plaetze80: 8,
        text: 'Station am 13.1.: frei 26 von 32 (5 cm), 8 von 8 (8 cm)',
      },
    ]);
    expect(v.warnungen).toEqual([]);
  });
});

describe('R6.1 Stationsbedarf und Belegung', () => {
  it('R6.1 Bedarf 5 cm = min(Schwämme, Zieltöpfe + 1), 8 cm = Zieltöpfe', () => {
    expect(stationsBedarf({ groesseMm: 50, schwaemme: 7, zieltoepfe: 5, direktsaat: false })).toBe(6);
    expect(stationsBedarf({ groesseMm: 50, schwaemme: 5, zieltoepfe: 4, direktsaat: false })).toBe(5);
    expect(stationsBedarf({ groesseMm: 50, schwaemme: 4, zieltoepfe: 4, direktsaat: false })).toBe(4);
    expect(stationsBedarf({ groesseMm: 80, schwaemme: 7, zieltoepfe: 5, direktsaat: false })).toBe(5);
    // ohne Zieltöpfe («Ziel später»): alle Schwämme (A7)
    expect(stationsBedarf({ groesseMm: 50, schwaemme: 3, zieltoepfe: 0, direktsaat: false })).toBe(3);
    // Topfgrösse der Art (A9)
    expect(stationsGroesse('solanum_lycopersicum')).toBe(80);
    expect(stationsGroesse('capsicum_annuum')).toBe(80);
    expect(stationsGroesse('ocimum_basilicum')).toBe(80);
    expect(stationsGroesse('lactuca_sativa')).toBe(50);
    expect([...ARTEN_80MM].sort()).toEqual(['capsicum_annuum', 'ocimum_basilicum', 'solanum_lycopersicum']);
  });

  it('R6.1 Direktsaat belegt keinen Stationsplatz', () => {
    expect(stationsBedarf({ groesseMm: 50, schwaemme: 3, zieltoepfe: 3, direktsaat: true })).toBe(0);
    const direkt = salat({ direktsaat: true, schwaemme: 3, zieltoepfe: 3, umsetzenAm: '2027-01-07' });
    expect(stationsBelegung(leer(), ANLAGE_R, '2027-01-12', [direkt])).toEqual({ 50: 0, 80: 0 });
    const v = stationsVorschau(vollerStation(), ANLAGE_R, [direkt], GRENZE);
    expect(warnungen(v, 'zu_wenig_platz')).toEqual([]);
  });

  it('R6.1 Pflanzung auf 4.4 verlässt die Station am geplanten Umsetzdatum', () => {
    const t = leer();
    // ohne Reservierung bliebe sie bis 20.1. (Saat 30.12. + 21 d); geplant ist der 15.1.
    const [pflanzung = ''] = aufStation(t, {
      satzNr: 51,
      sorteId: SORTE.lollo,
      saatdatum: '2026-12-30',
      loecher: [['4.4', 1]],
    });
    reservierung(t, {
      nr: 1,
      pflanzungId: pflanzung,
      netztopfId: netztopfId('2.1.1'),
      vorgabe: '2027-01-20',
      geplant: '2027-01-15',
    });
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-14', [])).toEqual({ 50: 1, 80: 0 });
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-15', [])).toEqual({ 50: 0, 80: 0 });
    // ohne Reservierung: bis vor Saat + umsetzen_ab_d
    const ohne = leer();
    aufStation(ohne, { satzNr: 51, sorteId: SORTE.lollo, saatdatum: '2026-12-30', loecher: [['4.4', 1]] });
    expect(stationsBelegung(ohne, ANLAGE_R, '2027-01-19', [])).toEqual({ 50: 1, 80: 0 });
    expect(stationsBelegung(ohne, ANLAGE_R, '2027-01-20', [])).toEqual({ 50: 0, 80: 0 });
  });

  it('R6.1 Satz in der Box zählt ab Keimtag', () => {
    const t = leer();
    // Lollo Rossa, Saat 5.1., typische Keimdauer 4 (v_sollwert): Keimtag 9.1., 5 Schwämme ohne Zieltopf
    inDerBox(t, { satzNr: 52, sorteId: SORTE.lollo, saatdatum: '2027-01-05', schwaemme: 5 });
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-08', [])).toEqual({ 50: 0, 80: 0 });
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-09', [])).toEqual({ 50: 5, 80: 0 });
    // bis vor Saat + 21 d = 26.1.
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-25', [])).toEqual({ 50: 5, 80: 0 });
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-26', [])).toEqual({ 50: 0, 80: 0 });
  });

  it('R6.1 Sätze desselben Vorgangs zählen gegeneinander', () => {
    const eins = salat({ schwaemme: 20, zieltoepfe: 17 });
    const zwei = salat({ sorte: 'Eichblatt', schwaemme: 20, zieltoepfe: 17 });
    // je allein: 18 von 32, keine Warnung
    expect(warnungen(stationsVorschau(leer(), ANLAGE_R, [eins], GRENZE), 'zu_wenig_platz')).toEqual([]);
    // zusammen 36 > 32
    const v = stationsVorschau(leer(), ANLAGE_R, [eins, zwei], GRENZE);
    expect(warnungen(v, 'zu_wenig_platz').length).toBeGreaterThanOrEqual(1);
    expect(stationsBelegung(leer(), ANLAGE_R, '2027-01-11', [eins, zwei])).toEqual({ 50: 36, 80: 0 });
  });

  it('R6.1 halbe Station aus den Plätzen der Anlage gerechnet', () => {
    expect(stationsPlaetze(leer(), ANLAGE_R)).toEqual({ 50: 32, 80: 8 });
    // ohne 4.5 (13 × 5 cm): 19 Plätze, höchstens 9 je Satz
    const t = leer();
    t['gefaess'] = (t['gefaess'] ?? []).filter((g) => g['id'] !== gefaessId('4.5'));
    expect(stationsPlaetze(t, ANLAGE_R)).toEqual({ 50: 19, 80: 8 });
    const v = stationsVorschau(
      t,
      ANLAGE_R,
      [salat({ saatdatum: '2027-02-04', umsetzenAm: '2027-02-25', schwaemme: 12, zieltoepfe: 9 })],
      GRENZE,
    );
    expect(warnungen(v, 'stationsgrenze')[0]?.text).toContain('belegt 10 von höchstens 9 Plätzen');
  });

  it('R6.1 Box über 25 Würfel: Hinweis ohne Sperre', () => {
    const t = leer();
    inDerBox(t, { satzNr: 53, sorteId: SORTE.lollo, saatdatum: '2027-01-05', schwaemme: 3 });
    expect(boxBelegung(t, platzId('A1'), 24)).toEqual({ belegt: 27, platzzahl: 25 });
    expect(boxBelegung(t, platzId('A2'), 24)).toEqual({ belegt: 24, platzzahl: 25 });
  });

  it('R6.1 ohne typische Keimdauer keine Vorschau, Hinweis', () => {
    const v = stationsVorschau(leer(), ANLAGE_R, [salat({ keimdauerTyp: undefined })], GRENZE);
    expect(v.zeilen).toEqual([]);
  });

  it('R6.1 Saatdatum 4.2.2027 = stationsgrenze_ab zählt (TZ)', () => {
    // 3.2. 23:30 UTC ist in Zürich schon der 4.2.
    const saatdatum = kalendertag(new Date('2027-02-03T23:30:00Z'), ZEITZONE);
    expect(saatdatum).toBe('2027-02-04');
    const v = stationsVorschau(
      leer(),
      ANLAGE_R,
      [salat({ saatdatum, umsetzenAm: '2027-02-25', schwaemme: 20, zieltoepfe: 17 })],
      GRENZE,
    );
    expect(warnungen(v, 'stationsgrenze')).toHaveLength(1);
  });
});
