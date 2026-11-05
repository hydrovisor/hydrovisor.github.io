// Trendzeile, «veraltet» und Spur der Messmaske (Plan 26 Testliste; UC9-AK5; R10.2, R10.3; A11 bis A14, A19).
// Injizierte Uhr jetzt = 12.1.2027 18:00 Zürich, Teile aus tests/fixtures/messen.ts.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `trendZeile(groesse, vorher, neu, veraltet)`: `text` = «vorher 1.30» (pH und °C eine Dezimale, EC zwei), der
//   Pfeil steht nur in `pfeil`, nie im Text; ohne `vorher` undefined. Bei `veraltet` enthält `text` zusätzlich das
//   Wort «veraltet» und `pfeil` fehlt.
// - `spurLage(wert, vorher, band)`: Prozent der Spurbreite (0 bis 100), Skala = Band ± eine Bandbreite; fehlender
//   Wert ergibt fehlendes Feld (undefined).
// - `messkontext(...).vorher[g]` = { wert (Hundertstel), giltAb (ISO, gleicher Zeitpunkt wie messung.gilt_ab),
//   veraltet }.
import { describe, expect, it } from 'vitest';
import { istVeraltet, spurLage, trendZeile, type AnsatzZeile } from '../../src/domain/bewertung/verlauf.ts';
import { messergebnis } from '../../src/domain/messung/ergebnis.ts';
import { messkontext } from '../../src/domain/messung/messkontext.ts';
import { ortAufloesen } from '../../src/domain/ort.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { JETZT, MESSUNG, messTeile, mitNachfuellen23 } from '../fixtures/messen.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';

const P23 = platzId('2.3');
const MESSUNG_10 = { id: MESSUNG.m23, platz_id: P23, gilt_ab: '2027-01-10T17:00:00.000Z', ansatz_id: null };

function ansatz(typ: AnsatzZeile['typ'], begonnenAm: string, extra: Partial<AnsatzZeile> = {}): AnsatzZeile {
  return {
    id: uid('21', 50),
    platz_id: P23,
    typ,
    status: 'abgeschlossen',
    begonnen_am: begonnenAm,
    kontrollmessung_id: null,
    endmessung_id: null,
    storniert_am: null,
    ...extra,
  };
}

function kontext23(teile: Teile = messTeile()) {
  const ort = ortAufloesen('R-2.3', teile);
  if (!ort) throw new Error('Ort R-2.3 fehlt');
  return messkontext(teile, ort, JETZT, ZEITZONE);
}

describe('UC9-AK5 Trendpfeil EC (R10.2)', () => {
  it('UC9-AK5 EC 1.35 nach 1.30 ohne Pfeil', () => {
    const t = trendZeile('ec', 130, 135, false);
    expect(t?.text).toBe('vorher 1.30');
    expect(t?.pfeil).toBeUndefined();
  });

  it('UC9-AK5 EC 1.40 nach 1.30 zeigt «↗»', () => {
    const t = trendZeile('ec', 130, 140, false);
    expect(t?.text).toBe('vorher 1.30');
    expect(t?.pfeil).toBe('↗');
  });
});

describe('R10.2 Trendzeile', () => {
  it('R10.2 pH 6.2 nach 6.0 «↗», 6.1 nach 6.0 ohne Pfeil', () => {
    expect(trendZeile('ph', 600, 620, false)).toEqual({ text: 'vorher 6.0', pfeil: '↗' });
    const ohne = trendZeile('ph', 600, 610, false);
    expect(ohne?.text).toBe('vorher 6.0');
    expect(ohne?.pfeil).toBeUndefined();
    expect(trendZeile('ph', 600, 580, false)?.pfeil).toBe('↘');
  });

  it('R10.2 EC 1.20 nach 1.30 «↘»', () => {
    expect(trendZeile('ec', 130, 120, false)).toEqual({ text: 'vorher 1.30', pfeil: '↘' });
    expect(trendZeile('ec', 130, 121, false)?.pfeil).toBeUndefined();
  });

  it('R10.2 °C mit einer Dezimale, Pfeil ab 1.0 °C', () => {
    expect(trendZeile('temperatur', 2050, 2150, false)).toEqual({ text: 'vorher 20.5', pfeil: '↗' });
    expect(trendZeile('temperatur', 2050, 2140, false)?.pfeil).toBeUndefined();
  });

  it('R10.2 ohne neuen Wert nur «vorher …»', () => {
    const t = trendZeile('ec', 120, undefined, false);
    expect(t?.text).toBe('vorher 1.20');
    expect(t?.pfeil).toBeUndefined();
  });

  it('R10.2 ohne vorherige Messung keine Trendzeile', () => {
    expect(trendZeile('ec', undefined, 135, false)).toBeUndefined();
    expect(trendZeile('ph', undefined, undefined, false)).toBeUndefined();
    // 2.1 hat keine Messung im Bündel
    const teile = messTeile();
    const ort = ortAufloesen('R-2.1', teile);
    if (!ort) throw new Error('Ort R-2.1 fehlt');
    const k = messkontext(teile, ort, JETZT, ZEITZONE);
    expect(k.vorher).toEqual({});
    expect(messergebnis({ ec: 135 }, k, JETZT, ZEITZONE).trend.ec).toBeUndefined();
  });

  it('R10.2 stornierte Messung zählt nicht als vorher', () => {
    // die stornierte Messung vom 11.1. 10:00 (6.4, 1.60, 21.5) ist die jüngste, zählt aber nicht
    const k = kontext23();
    expect(k.vorher.ph?.wert).toBe(610);
    expect(k.vorher.ec?.wert).toBe(120);
    expect(k.vorher.temperatur?.wert).toBe(2100);
    const r = messergebnis({ ec: 135 }, k, JETZT, ZEITZONE);
    expect(r.trend.ec).toEqual({ text: 'vorher 1.20', pfeil: '↗' });
  });
});

describe('R10.3 veraltet', () => {
  it('R10.3 Messung vor Nachfüllen ist veraltet', () => {
    expect(istVeraltet(MESSUNG_10, [ansatz('nachfuellen', '2027-01-11T11:00:00.000Z')])).toBe(true);
    expect(istVeraltet(MESSUNG_10, [ansatz('neuansatz', '2027-01-11T11:00:00.000Z')])).toBe(true);
    // Ansatz vor der Messung oder an einem anderen Platz
    expect(istVeraltet(MESSUNG_10, [ansatz('nachfuellen', '2027-01-09T11:00:00.000Z')])).toBe(false);
    expect(
      istVeraltet(MESSUNG_10, [
        ansatz('nachfuellen', '2027-01-11T11:00:00.000Z', { platz_id: platzId('2.2') }),
      ]),
    ).toBe(false);
    expect(istVeraltet(MESSUNG_10, [])).toBe(false);
  });

  it('R10.3 Kontroll- und Endmessung des Neuansatzes sind nicht veraltet', () => {
    const spaeter = '2027-01-11T11:00:00.000Z';
    expect(istVeraltet(MESSUNG_10, [ansatz('neuansatz', spaeter, { kontrollmessung_id: MESSUNG.m23 })])).toBe(
      false,
    );
    expect(istVeraltet(MESSUNG_10, [ansatz('neuansatz', spaeter, { endmessung_id: MESSUNG.m23 })])).toBe(
      false,
    );
    const a = ansatz('neuansatz', spaeter);
    expect(istVeraltet({ ...MESSUNG_10, ansatz_id: a.id }, [a])).toBe(false);
  });

  it('R10.3 stornierter oder abgebrochener Ansatz macht nicht veraltet', () => {
    const spaeter = '2027-01-11T11:00:00.000Z';
    expect(
      istVeraltet(MESSUNG_10, [ansatz('nachfuellen', spaeter, { storniert_am: '2027-01-11T11:05:00.000Z' })]),
    ).toBe(false);
    expect(istVeraltet(MESSUNG_10, [ansatz('neuansatz', spaeter, { status: 'abgebrochen' })])).toBe(false);
    expect(istVeraltet(MESSUNG_10, [ansatz('neuansatz', spaeter, { status: 'laufend' })])).toBe(true);
  });

  it('R10.3 Teilwechsel macht nicht veraltet (Wortlaut Konzept)', () => {
    const spaeter = '2027-01-11T11:00:00.000Z';
    expect(istVeraltet(MESSUNG_10, [ansatz('teilwechsel', spaeter)])).toBe(false);
    expect(istVeraltet(MESSUNG_10, [ansatz('ph_korrektur', spaeter)])).toBe(false);
  });

  it('R10.3 veraltete Messung: Trendzeile mit Kennzeichen, ohne Pfeil', () => {
    const t = trendZeile('ec', 120, 140, true);
    expect(t?.text).toContain('vorher 1.20');
    expect(t?.text).toContain('veraltet');
    expect(t?.pfeil).toBeUndefined();
    // über die Fixture: Nachfüllen am 11.1. 12:00 nach allen Messungen in 2.3
    const k = kontext23(mitNachfuellen23(messTeile()));
    expect(k.vorher.ec?.veraltet).toBe(true);
    expect(k.vorher.temperatur?.veraltet).toBe(true);
    const r = messergebnis({ ec: 140 }, k, JETZT, ZEITZONE);
    expect(r.trend.ec?.text).toContain('veraltet');
    expect(r.trend.ec?.pfeil).toBeUndefined();
    // ohne Nachfüllen nicht veraltet
    expect(kontext23().vorher.ec?.veraltet).toBe(false);
  });
});

describe('R10.2 Spur', () => {
  it('R10.2 Spur: Band in der Mitte, Wert ausserhalb am Rand', () => {
    // Band 1.00–1.40, Skala 0.60–1.80
    const s = spurLage(135, 120, { min: 100, max: 140 });
    expect(s.von).toBeCloseTo(100 / 3, 5);
    expect(s.bis).toBeCloseTo(200 / 3, 5);
    expect(s.neu).toBeCloseTo(62.5, 5);
    expect(s.vorher).toBeCloseTo(50, 5);
    const hoch = spurLage(200, undefined, { min: 100, max: 140 });
    expect(hoch.neu).toBe(100);
    expect(hoch.vorher).toBeUndefined();
    expect(spurLage(30, 300, { min: 100, max: 140 })).toMatchObject({ neu: 0, vorher: 100 });
    const leer = spurLage(undefined, undefined, { min: 600, max: 650 });
    expect(leer.neu).toBeUndefined();
    expect(leer.von).toBeCloseTo(100 / 3, 5);
  });
});
