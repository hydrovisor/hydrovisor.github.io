// Runde 1 I0-07 (#12): Unterscheidungsfall «als unsicher markiert» (R10.3, R4.7, Sicht v_messung_unsicher mit coalesce).
// Markierung am 12.1. mit seit_kalibrierung_id = X (Kalibrierung 1.1. 09:00 Zürich): sie wirkt bis zur nächsten
// Kalibrierung nach X; gibt es keine, nur bis zum Ereignis selbst. Injizierte Zeitpunkte als UTC-ISO, Europe/Zurich.
import { describe, expect, it } from 'vitest';
import {
  istUnsicher,
  type GeraeteEreignis,
  type Kalibrierdaten,
  type KalibrierZeile,
} from '../../src/domain/kalibrierung/stand.ts';

const ZUERICH = 'Europe/Zurich';
const GERAET = '0c0c0c0c-0000-4000-8000-000000000211';
const X = '0c0c0c0c-0000-4000-8000-000000000811';
const NEU = '0c0c0c0c-0000-4000-8000-000000000812';

function kal(id: string, giltAb: string): KalibrierZeile {
  return { id, messgeraet_id: GERAET, datenart: 'echt', gilt_ab: giltAb, storniert_am: null };
}

// X: 1.1. 09:00 Zürich; neue Kalibrierung 15.1. 09:00 Zürich
const KAL_X = kal(X, '2027-01-01T08:00:00.000Z');
const KAL_NEU = kal(NEU, '2027-01-15T08:00:00.000Z');

// Markierung 12.1. 09:00 Zürich
const MARKIERUNG: GeraeteEreignis = {
  typ: 'als_unsicher_markiert',
  messgeraet_id: GERAET,
  gilt_ab: '2027-01-12T08:00:00.000Z',
  storniert_am: null,
  daten: { datenart: 'echt', seit_kalibrierung_id: X },
};

const mitNeuer: Kalibrierdaten = {
  kalibrierungen: [KAL_X, KAL_NEU],
  ereignisse: [MARKIERUNG],
  festeTermine: [],
};
const ohneNeue: Kalibrierdaten = { kalibrierungen: [KAL_X], ereignisse: [MARKIERUNG], festeTermine: [] };

const unsicher = (d: Kalibrierdaten, giltAb: string) =>
  istUnsicher({ messgeraetId: GERAET, datenart: 'echt', giltAb: new Date(giltAb) }, d, ZUERICH);

// Messungen jeweils 10:00 Zürich = 09:00Z
const MESSUNG_10_1 = '2027-01-10T09:00:00.000Z';
const MESSUNG_13_1 = '2027-01-13T09:00:00.000Z';
const MESSUNG_16_1 = '2027-01-16T09:00:00.000Z';

describe('R10.3 und R4.7 «als unsicher markiert»: Ende der Wirkung', () => {
  it('R10.3 R4.7 mit neuer Kalibrierung am 15.1.: Messung 13.1. (nach der Markierung, vor der neuen Kalibrierung) unsicher', () => {
    expect(unsicher(mitNeuer, MESSUNG_13_1)).toBe(true);
  });

  it('R10.3 R4.7 ohne neue Kalibrierung: Messung 13.1. (nach der Markierung) nicht unsicher', () => {
    // X ist am 13.1. erst 12 Tage alt; ohne nächste Kalibrierung wirkt die Markierung nur bis zum Ereignis selbst
    expect(unsicher(ohneNeue, MESSUNG_13_1)).toBe(false);
  });

  it('R4.7 mit neuer Kalibrierung am 15.1.: Messung 10.1. (zwischen X und Markierung) unsicher', () => {
    expect(unsicher(mitNeuer, MESSUNG_10_1)).toBe(true);
  });

  it('R4.7 ohne neue Kalibrierung: Messung 10.1. (zwischen X und Markierung) unsicher', () => {
    expect(unsicher(ohneNeue, MESSUNG_10_1)).toBe(true);
  });

  it('R4.7 mit neuer Kalibrierung am 15.1.: Messung 16.1. (nach der neuen Kalibrierung) nicht unsicher', () => {
    expect(unsicher(mitNeuer, MESSUNG_16_1)).toBe(false);
  });
});
