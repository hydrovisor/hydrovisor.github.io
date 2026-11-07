// Zeitpunkt der Sammel-Push (Plan 13 Schnittstellen `src/domain/push/zeitpunkt.ts`; R5.5, G2, 11.3, TP4):
// fällig ⇔ Uhrzeit in Zürich ≥ Push-Zeit am Zürcher Kalendertag; Wiederholung bis Push-Zeit + 4 h (TTL).
// Feste Uhr als UTC-ISO, Zeitzone als Parameter.
// Vorausgesetzt: die Push-Zeit kommt als 'HH:MM' oder 'HH:MM:SS' (time aus PostgREST); beide gleichwertig.
import { describe, expect, it } from 'vitest';
import {
  KURZPRUEFUNG_ZEIT,
  kurzpruefungFaellig,
  sammelFaellig,
  timerFaellig,
  wiederholungErlaubt,
} from '../../src/domain/push/zeitpunkt.ts';
import { ZONE } from './push-fixture.ts';

const z = (iso: string) => new Date(iso);

describe('sammelFaellig', () => {
  it('G2 07:00 Zürich am 27.3.2027 (06:00Z) fällig, 05:59Z nicht', () => {
    expect(sammelFaellig(z('2027-03-27T06:00:00.000Z'), ZONE, '07:00')).toEqual({
      faellig: true,
      datumLokal: '2027-03-27',
    });
    expect(sammelFaellig(z('2027-03-27T05:59:00.000Z'), ZONE, '07:00')).toEqual({
      faellig: false,
      datumLokal: '2027-03-27',
    });
  });

  it('G2 28.3.2027 05:00Z fällig (Sommerzeit), 04:59Z nicht', () => {
    expect(sammelFaellig(z('2027-03-28T05:00:00.000Z'), ZONE, '07:00:00')).toEqual({
      faellig: true,
      datumLokal: '2027-03-28',
    });
    expect(sammelFaellig(z('2027-03-28T04:59:00.000Z'), ZONE, '07:00:00').faellig).toBe(false);
  });

  it('G2 23:30Z am 31.12. gehört zum 1.1.', () => {
    expect(sammelFaellig(z('2026-12-31T23:30:00.000Z'), ZONE, '07:00')).toEqual({
      faellig: false,
      datumLokal: '2027-01-01',
    });
  });

  it('G2 späte Push-Zeit 22:00: 21:00Z im Winter fällig, 20:55Z nicht', () => {
    expect(sammelFaellig(z('2027-01-20T21:00:00.000Z'), ZONE, '22:00').faellig).toBe(true);
    expect(sammelFaellig(z('2027-01-20T20:55:00.000Z'), ZONE, '22:00').faellig).toBe(false);
  });

  it('TP4 nur der Parameter zeitzone zählt: 06:00Z ist in New York vor, in Zürich nach 07:00', () => {
    expect(sammelFaellig(z('2027-03-27T06:00:00.000Z'), 'America/New_York', '07:00').faellig).toBe(false);
    expect(sammelFaellig(z('2027-03-27T06:00:00.000Z'), ZONE, '07:00').faellig).toBe(true);
  });
});

describe('wiederholungErlaubt', () => {
  it('R5.5 wiederholungErlaubt bis 11:00 bei Push-Zeit 07:00', () => {
    expect(wiederholungErlaubt(z('2027-01-20T06:05:00.000Z'), ZONE, '07:00')).toBe(true);
    expect(wiederholungErlaubt(z('2027-01-20T09:55:00.000Z'), ZONE, '07:00')).toBe(true);
    expect(wiederholungErlaubt(z('2027-01-20T10:05:00.000Z'), ZONE, '07:00')).toBe(false);
  });

  it('R5.5 wiederholungErlaubt in der Sommerzeit nach Ortszeit: 28.3.2027 08:55Z ja, 09:05Z nein', () => {
    expect(wiederholungErlaubt(z('2027-03-28T08:55:00.000Z'), ZONE, '07:00')).toBe(true);
    expect(wiederholungErlaubt(z('2027-03-28T09:05:00.000Z'), ZONE, '07:00')).toBe(false);
  });
});

// I1b-06 (Plan 31 Schnittstellen `zeitpunkt.ts`, Testliste «Vitest»; R5.5, G2, Annahmen 4 und 5):
// kurzpruefungFaellig ⇔ 20:00 ≤ Ortszeit ≤ 21:59; timerFaellig ⇔ timer_ende ≤ jetzt und jetzt − timer_ende < 15 min.
describe('kurzpruefungFaellig und timerFaellig (I1b-06)', () => {
  it('TP7 KURZPRUEFUNG_ZEIT ist 20:00', () => {
    expect(KURZPRUEFUNG_ZEIT).toBe('20:00');
  });

  it('TP7 kurzpruefungFaellig 19:59 nein, 20:00 ja, 21:59 ja, 22:00 nein', () => {
    expect(kurzpruefungFaellig(z('2027-01-20T18:59:00.000Z'), ZONE)).toEqual({
      faellig: false,
      datumLokal: '2027-01-20',
    });
    expect(kurzpruefungFaellig(z('2027-01-20T19:00:00.000Z'), ZONE)).toEqual({
      faellig: true,
      datumLokal: '2027-01-20',
    });
    expect(kurzpruefungFaellig(z('2027-01-20T20:59:00.000Z'), ZONE).faellig).toBe(true);
    expect(kurzpruefungFaellig(z('2027-01-20T21:00:00.000Z'), ZONE).faellig).toBe(false);
  });

  it('TP7 kurzpruefungFaellig in der Sommerzeit: 28.3.2027 18:00Z ja, 17:59Z nein', () => {
    expect(kurzpruefungFaellig(z('2027-03-28T18:00:00.000Z'), ZONE)).toEqual({
      faellig: true,
      datumLokal: '2027-03-28',
    });
    expect(kurzpruefungFaellig(z('2027-03-28T17:59:00.000Z'), ZONE).faellig).toBe(false);
  });

  it('TP5 timerFaellig Grenze genau timer_ende und 15 min', () => {
    const ende = z('2027-01-20T10:00:00.000Z');
    expect(timerFaellig(ende, z('2027-01-20T09:59:59.000Z'))).toBe(false);
    expect(timerFaellig(ende, ende)).toBe(true);
    expect(timerFaellig(ende, z('2027-01-20T10:14:59.000Z'))).toBe(true);
    expect(timerFaellig(ende, z('2027-01-20T10:15:00.000Z'))).toBe(false);
  });

  it('TP4 timerFaellig über die Umstellung: 01:59:30 MEZ, Lauf 03:00 MESZ ist 30 s später', () => {
    expect(timerFaellig(z('2027-03-28T00:59:30.000Z'), z('2027-03-28T01:00:00.000Z'))).toBe(true);
  });
});
