// Folgen des Umsetzens in bestehenden Modulen (Plan 33 Testliste «Erweiterungen bestehender Dateien»; R6.1, UC5-AK16,
// Plan 25 Befund 17, Bündel). Eigene Datei des Testentwicklers statt Änderungen an anzucht-kapazitaet.test.ts,
// duplizieren.test.ts und buendel-laden.test.ts; die bestehenden Fälle bleiben unverändert. Injizierte Uhr
// 2027-01-19T08:00:00Z, Zeitzone Europe/Zurich.
//
// Vertrag (Plan 33 «Betroffene Dateien», vom Testentwickler präzisiert):
//   stationsBelegung(teile, anlageId, tag, geplant, heute?): mit `heute` zählt eine aktive Pflanzung auf einer Station,
//     deren Umsetzdatum (geplant, sonst Saat + «Umsetzen ab») am oder vor `heute` liegt, an `heute` weiter als belegt
//     (A26); ohne `heute` wie bisher.
//   topfPrognose(teile, netztopfId, umsetzenAm, direktsaat): für eine stehende Pflanzung mit nicht storniertem Ereignis
//     umsetzen (Bündelteil ereignis_pflanzung) ist der Kalendertag dieses Ereignisses der Bezug für «Ernte möglich ab»
//     (A27); ohne umsetzen bleibt Saat + «Umsetzen ab».
//   BUENDEL_TEILE: ereignis_pflanzung zusätzlich mit verschieben, umsetzen, tausch, umsetzdatum_geaendert, ernte;
//     ereignis_platz zusätzlich mit kurzpruefung; neue Sicht v_zielbereich mit Ordnung ['platz_id'].
import { describe, expect, it } from 'vitest';
import { BUENDEL_TEILE } from '../../src/daten/buendel.ts';
import { freieStationsloecher, stationsBelegung } from '../../src/domain/anzucht/kapazitaet.ts';
import { topfPrognose } from '../../src/domain/pflanzung/belegung.ts';
import { duplizierTeile, pflanzungAnlegen, pflanzungId, satzAnlegen } from '../fixtures/duplizieren.ts';
import { ANLAGE_R, netztopfId, uid, type Teile } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';
import { umsetzSichtenNachrechnen } from '../fixtures/sichten.ts';
import { L, umgesetzt, umsetzTeile } from '../fixtures/umsetzen.ts';

const J = new Date('2027-01-19T08:00:00Z');
const belegung = (t: Teile, tag: string, heute?: string) =>
  (stationsBelegung as (...a: unknown[]) => { 50: number; 80: number })(t, ANLAGE_R, tag, [], heute);

describe('R6.1 Station verlassen', () => {
  it('R6.1 Pflanzung nach ihrem Umsetzdatum noch auf der Station zählt bis zum Umsetzen (Station verlassen)', () => {
    const t = umsetzTeile();
    // 30.1.: Lollo Rossa (geplant 28.1., Reserve Saat + 21 = 28.1.), Rucola (5.1. + 14 = 19.1.) und Ochsenherz
    // (geplant 28.1.) stehen noch auf der Station
    expect(belegung(t, '2027-01-30')).toEqual({ 50: 0, 80: 0 });
    expect(belegung(t, '2027-01-30', '2027-01-30')).toEqual({ 50: 11, 80: 1 });
    // am 19.1. ist Rucola fällig und steht noch: mit heute belegt, ohne heute schon frei
    expect(belegung(t, '2027-01-19')).toEqual({ 50: 6, 80: 1 });
    expect(belegung(t, '2027-01-19', '2027-01-19')).toEqual({ 50: 11, 80: 1 });
    // weit nach heute zählt die überfällige Pflanzung nicht mehr
    expect(belegung(t, '2027-02-06', '2027-01-30')).toEqual({ 50: 0, 80: 0 });
  });

  it('R6.1 nach dem Umsetzen ist der Stationsplatz frei', () => {
    const t = umsetzTeile();
    const loecher44 = (x: Teile) =>
      freieStationsloecher(x, ANLAGE_R, 50)
        .filter((l) => l.kennung === '4.4')
        .map((l) => l.lochNr);
    expect(loecher44(t)).toEqual([12, 13]);
    // umsetzen wie aus umsetzVorgang() (Wie geplant): 4.4 Loch 1 bis 5 nach 2.3.1 bis 2.3.5
    const nach = structuredClone(t);
    for (let k = 1; k <= 5; k += 1) umgesetzt(nach, L[k] as string, `2.3.${k}`, J.toISOString(), ['4.4', k]);
    umsetzSichtenNachrechnen(nach);
    expect(loecher44(nach)).toEqual([1, 2, 3, 4, 5, 12, 13]);
    expect(belegung(nach, '2027-01-19', '2027-01-19')).toEqual({ 50: 6, 80: 1 });
  });
});

describe('UC5-AK16 Plan 25 Befund 17', () => {
  it('UC5-AK16 Vorgänger mit Ereignis umsetzen: Bezug ist der Umsetztag (Plan 25 Befund 17)', () => {
    // Lollo Rossa Kopf gesät 7.1. (Salat hier Umsetzen ab 14), steht in 2.3.1; Ernte ab 28 Tage nach dem Umsetzen
    const t = duplizierTeile();
    satzAnlegen(t, {
      nr: 70,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: '2027-01-07',
      schwaemme: 1,
    });
    pflanzungAnlegen(t, 70, 1, { topf: '2.3.1' });
    const U = '2027-02-20';
    // ohne umsetzen: Bezug 7.1. + 14 = 21.1., Ende 18.2. < 20.2.: Nachfolge
    expect(topfPrognose(t, netztopfId('2.3.1'), U, false)).toMatchObject({
      frei: true,
      grund: 'nachfolge',
      belegtBis: '2027-02-18',
    });
    // tatsächlich umgesetzt am 25.1.: Ende 25.1. + 28 = 22.2. ≥ 20.2.: belegt
    const umsetzen = {
      id: uid('3f', 9001),
      client_id: uid('3f', 9001),
      typ: 'umsetzen',
      pflanzung_id: pflanzungId(70, 1),
      netztopf_id: netztopfId('2.3.1'),
      satz_id: null,
      platz_id: null,
      daten: {},
      gilt_ab: '2027-01-25T09:00:00.000Z',
      storniert_am: null as string | null,
    };
    t['ereignis'] = [...(t['ereignis'] ?? []), umsetzen];
    t['ereignis_pflanzung'] = [umsetzen];
    const p = topfPrognose(t, netztopfId('2.3.1'), U, false);
    expect(p).toMatchObject({ frei: false, grund: 'belegt', belegtBis: '2027-02-22' });
    expect(p?.vorgaenger[0]).toMatchObject({ art: 'steht', ernteart: 'einmalig', endeAm: '2027-02-22' });
    // storniert: wieder Saat + «Umsetzen ab»
    umsetzen.storniert_am = '2027-01-25T10:00:00.000Z';
    expect(topfPrognose(t, netztopfId('2.3.1'), U, false)).toMatchObject({
      frei: true,
      belegtBis: '2027-02-18',
    });
  });
});

describe('Bündel für Umsetzen und Verschieben', () => {
  it('Bündelteil ereignis_pflanzung enthält verschieben, umsetzen, tausch, umsetzdatum_geaendert, ernte; ereignis_platz kurzpruefung; Sicht v_zielbereich', () => {
    const teil = (name: string) => BUENDEL_TEILE.find((x) => x.name === name);
    const pflanzung = teil('ereignis_pflanzung');
    expect(pflanzung?.tabelle).toBe('ereignis');
    for (const typ of [
      'keimung',
      'abschluss',
      'wiederherstellen',
      'verschieben',
      'umsetzen',
      'tausch',
      'umsetzdatum_geaendert',
      'ernte',
    ])
      expect(pflanzung?.typen, typ).toContain(typ);
    const platz = teil('ereignis_platz');
    for (const typ of [
      'gefaess_erfasst',
      'gefaesspruefung',
      'box_deckel_tausch',
      'entfernt',
      'geleert',
      'ruhe',
    ])
      expect(platz?.typen, typ).toContain(typ);
    expect(platz?.typen).toContain('kurzpruefung');
    expect(teil('v_zielbereich')).toMatchObject({ name: 'v_zielbereich', ordnung: ['platz_id'] });
    expect(teil('v_zielbereich')?.tabelle).toBeUndefined();
    // die bisherigen Sichten bleiben
    for (const name of ['v_netztopf_platz', 'v_reservierung_aktiv', 'reservierung', 'v_pflanzung_zustand'])
      expect(teil(name), name).toBeDefined();
    expect(new Set(BUENDEL_TEILE.map((x) => x.name)).size).toBe(BUENDEL_TEILE.length);
  });
});
