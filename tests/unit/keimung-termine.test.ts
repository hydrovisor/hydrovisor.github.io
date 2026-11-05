// Termin «Keimung prüfen» mit Folgeprüfung (Plan 24 Testliste; R5.2 Zeile «Keimung prüfen», Plan 23 Befund 13, TZ).
// Zeitzone Europe/Zurich; tests/unit/anzucht-termine.test.ts (saatTermine) bleibt unverändert.
//
// Vertrag (Plan 24 «Domänenfunktionen»):
//   keimPruefTermin({ satzId, saatdatum, keimdauer: { typ?, max? }, erfasstAm, letztePruefung?, offen }, zeitzone)
//     : { faelligAm?; grund: 'erste' | 'teilergebnis' | 'ueber_max' | 'fertig' }
//   erste Prüfung = Saat + typische Keimdauer, nicht vor dem Kalendertag des Erfassungszeitpunkts (wie saatTermine());
//   nach einer Prüfung mit offenen Schwämmen: Prüftag + 2, solange ≤ Saat + Keimdauer max; ohne offene kein Termin.
import { describe, expect, it } from 'vitest';
import { keimPruefTermin } from '../../src/domain/anzucht/termine.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { uid } from '../fixtures/regal.ts';

const SATZ = uid('27', 80);
const lollo = (e: Partial<Parameters<typeof keimPruefTermin>[0]> = {}) => ({
  satzId: SATZ,
  saatdatum: '2027-01-07',
  keimdauer: { typ: 4, max: 7 },
  erfasstAm: new Date('2027-01-07T08:00:00Z'),
  offen: 6,
  ...e,
});

describe('R5.2 Keimung prüfen', () => {
  it('R5.2 erster Termin Saat + typische Keimdauer ab dem Erfassungszeitpunkt des Satzes, nicht ab jetzt', () => {
    expect(keimPruefTermin(lollo(), ZEITZONE)).toEqual({ faelligAm: '2027-01-11', grund: 'erste' });
    // nacherfasst am 7.1. mit Saat 1.1.: 1.1. + 4 = 5.1. liegt vor dem Erfassungstag → 7.1.
    expect(keimPruefTermin(lollo({ saatdatum: '2027-01-01' }), ZEITZONE)).toEqual({
      faelligAm: '2027-01-07',
      grund: 'erste',
    });
    // derselbe Satz, später erfasst: der Termin folgt dem Erfassungstag
    expect(
      keimPruefTermin(
        lollo({ saatdatum: '2027-01-01', erfasstAm: new Date('2027-01-09T08:00:00Z') }),
        ZEITZONE,
      ).faelligAm,
    ).toBe('2027-01-09');
  });

  it('R5.2 Teilergebnis: Folgeprüfung am Prüftag + 2', () => {
    expect(keimPruefTermin(lollo({ letztePruefung: '2027-01-11', offen: 2 }), ZEITZONE)).toEqual({
      faelligAm: '2027-01-13',
      grund: 'teilergebnis',
    });
  });

  it('R5.2 Folgeprüfung nur bis Saat + Keimdauer max, danach ueber_max', () => {
    // Saat 7.1. + max 7 = 14.1.
    expect(keimPruefTermin(lollo({ letztePruefung: '2027-01-12', offen: 1 }), ZEITZONE)).toEqual({
      faelligAm: '2027-01-14',
      grund: 'teilergebnis',
    });
    const ueber = keimPruefTermin(lollo({ letztePruefung: '2027-01-13', offen: 1 }), ZEITZONE);
    expect(ueber.grund).toBe('ueber_max');
    expect(ueber.faelligAm).toBeUndefined();
  });

  it('R5.2 ohne offene Schwämme kein Termin', () => {
    const fertig = keimPruefTermin(lollo({ letztePruefung: '2027-01-11', offen: 0 }), ZEITZONE);
    expect(fertig.grund).toBe('fertig');
    expect(fertig.faelligAm).toBeUndefined();
  });

  it('TZ Prüftag 23:30 UTC zählt als nächster Kalendertag in Zürich', () => {
    // erfasst am 6.1. 23:30 UTC = 7.1. 00:30 Zürich: Saat 1.1. + 4 = 5.1. → Erfassungstag 7.1., nicht 6.1.
    expect(
      keimPruefTermin(
        lollo({ saatdatum: '2027-01-01', erfasstAm: new Date('2027-01-06T23:30:00Z') }),
        ZEITZONE,
      ),
    ).toEqual({ faelligAm: '2027-01-07', grund: 'erste' });
    // 6.1. 22:30 UTC = 6.1. 23:30 Zürich → 6.1.
    expect(
      keimPruefTermin(
        lollo({ saatdatum: '2027-01-01', erfasstAm: new Date('2027-01-06T22:30:00Z') }),
        ZEITZONE,
      ).faelligAm,
    ).toBe('2027-01-06');
  });
});
