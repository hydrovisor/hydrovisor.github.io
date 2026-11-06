// Bewertung je Wert in Hundertsteln (Plan 26 Testliste; UC9-AK4, UC9-AK10, UC9-AK11 Bewertungsteil; R10.1, R10.2,
// R10.4; G3). Injizierte Uhr jetzt = 12.1.2027 18:00 Zürich, Teile aus tests/fixtures/messen.ts.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - src/domain/bewertung/bewertung.ts: `inHundertstel(wert: number | string)` = Math.round(Number(wert) · 100);
//   `knappZone(grenze, uEc)`, `bewerteEc(wert, band, uEc)`, `bewertePh(wert, band, uPh)`,
//   `bewerteTemperatur(wert, band)` und `bewerten(werte, sollband, { uEc, uPh })` alles in Hundertsteln;
//   Rückgabe 'gruen' | 'knapp' | 'ausserhalb'; `bewerten` liefert nur Schlüssel der übergebenen Werte.
//   `TON` = { gruen: 'ok', knapp: 'warn', ausserhalb: 'danger' }.
// - src/domain/bewertung/sollband.ts: Band und Sollband in Hundertsteln, auch die Temperatur (18 °C = 1800).
// - src/domain/messung/messkontext.ts und ergebnis.ts: `messkontext(teile, ort, jetzt, zeitzone)` und
//   `messergebnis(werte, kontext, jetzt, zeitzone)` nach den Signaturen des Plans; `trend.ph.text` beginnt mit
//   «vorher 6.5» (eine Dezimale bei pH).
import { describe, expect, it } from 'vitest';
import {
  bewerteEc,
  bewertePh,
  bewerten,
  bewerteTemperatur,
  inHundertstel,
  knappZone,
  TON,
} from '../../src/domain/bewertung/bewertung.ts';
import { bewertungsband, type Sollband } from '../../src/domain/bewertung/sollband.ts';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  messwerteHundertstel,
  type Messeingabe,
  type Taste,
} from '../../src/domain/messung/eingabe.ts';
import { messergebnis } from '../../src/domain/messung/ergebnis.ts';
import { messkontext } from '../../src/domain/messung/messkontext.ts';
import { ortAufloesen, type Ort } from '../../src/domain/ort.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { JETZT, messTeile } from '../fixtures/messen.ts';
import { platzId, type Teile } from '../fixtures/regal.ts';

const EC_BAND = { min: 100, max: 140 };
const PH_BAND = { min: 600, max: 650 };
const U = 10;

function ort(teile: Teile, kennung: string): Ort {
  const o = ortAufloesen(`R-${kennung}`, teile);
  if (!o) throw new Error(`Ort R-${kennung} fehlt`);
  return o;
}

/** Ergebnis für Werte in Hundertsteln an einem Ort der Fixture */
function ergebnisIn(kennung: string, werte: Parameters<typeof messergebnis>[0], teile = messTeile()) {
  const k = messkontext(teile, ort(teile, kennung), JETZT, ZEITZONE);
  return messergebnis(werte, k, JETZT, ZEITZONE);
}

describe('UC9-AK10 EC in Hundertsteln (R10.1)', () => {
  it('UC9-AK10 1.0–1.4, DWC, u_EC 0.10: 1.40 Im grünen Bereich', () => {
    expect(bewerteEc(140, EC_BAND, U)).toBe('gruen');
  });

  it('UC9-AK10 1.41 Knapp daneben', () => {
    expect(bewerteEc(141, EC_BAND, U)).toBe('knapp');
  });

  it('UC9-AK10 1.51 Knapp daneben (Zone 11 Hundertstel)', () => {
    expect(knappZone(140, U)).toBe(11);
    expect(bewerteEc(151, EC_BAND, U)).toBe('knapp');
  });

  it('UC9-AK10 1.52 Ausserhalb', () => {
    expect(bewerteEc(152, EC_BAND, U)).toBe('ausserhalb');
  });

  it('UC9-AK10 0.90 Knapp daneben', () => {
    expect(knappZone(100, U)).toBe(10);
    expect(bewerteEc(90, EC_BAND, U)).toBe('knapp');
  });

  it('UC9-AK10 0.89 Ausserhalb', () => {
    expect(bewerteEc(89, EC_BAND, U)).toBe('ausserhalb');
  });

  it('UC9-AK10 über die Fixture: 2.3 mit 1.41 und 1.52 aus dem Ziffernblock', () => {
    expect(ergebnisIn('2.3', { ec: 141 }).bewertungen.ec).toBe('knapp');
    expect(ergebnisIn('2.3', { ec: 152 }).bewertungen.ec).toBe('ausserhalb');
    expect(ergebnisIn('2.3', { ec: 140 }).bewertungen.ec).toBe('gruen');
  });
});

describe('R10.1 Knapp-Zone und Grenzen', () => {
  it('R10.1 knappZone: max aus 8 % abgerundet, 10 und u_EC (u_EC 0.15 ergibt 15)', () => {
    expect(knappZone(140, 15)).toBe(15);
    expect(knappZone(140, 10)).toBe(11);
    // 8 % von 3.00 = 24; 8 % von 1.99 = 15.92 → 15
    expect(knappZone(300, 10)).toBe(24);
    expect(knappZone(199, 10)).toBe(15);
    expect(knappZone(80, 5)).toBe(10);
    expect(Number.isInteger(knappZone(199, 10))).toBe(true);
    // mit u_EC 0.15 bleibt 1.55 knapp, 1.56 ausserhalb
    expect(bewerteEc(155, EC_BAND, 15)).toBe('knapp');
    expect(bewerteEc(156, EC_BAND, 15)).toBe('ausserhalb');
  });

  it('R10.1 Grenzen eingeschlossen grün', () => {
    expect(bewerteEc(100, EC_BAND, U)).toBe('gruen');
    expect(bewerteEc(140, EC_BAND, U)).toBe('gruen');
    expect(bewerteEc(120, EC_BAND, U)).toBe('gruen');
    expect(bewertePh(600, PH_BAND, U)).toBe('gruen');
    expect(bewertePh(650, PH_BAND, U)).toBe('gruen');
    expect(bewerteTemperatur(1800, { min: 1800, max: 2200 })).toBe('gruen');
    expect(bewerteTemperatur(2200, { min: 1800, max: 2200 })).toBe('gruen');
  });

  it('R10.1 TON verbindet Bewertung und Design System', () => {
    expect(TON).toEqual({ gruen: 'ok', knapp: 'warn', ausserhalb: 'danger' });
  });
});

describe('G3 Hundertstel ohne Gleitkommarest', () => {
  it('G3 Werte aus dem Bündel als Text «1.40» und Zahl 1.4 ergeben 140', () => {
    expect(inHundertstel('1.40')).toBe(140);
    expect(inHundertstel(1.4)).toBe(140);
    expect(inHundertstel('1.400')).toBe(140);
    // 1.41 · 100 = 140.99999999999997 in Gleitkomma
    expect(inHundertstel(1.41)).toBe(141);
    expect(inHundertstel('6.7')).toBe(670);
    expect(inHundertstel(20.5)).toBe(2050);
    expect(inHundertstel(0.29)).toBe(29);
  });

  it('G3 0.1 + 0.2 als Eingabe ergibt 30 Hundertstel ohne Gleitkommarest', () => {
    const tippen = (e: Messeingabe, ...t: Taste[]) => t.reduce((s, x) => eingabeTippen(s, x), e);
    const e = tippen(feldWaehlen(eingabeStart(['ph', 'ec', 'temperatur']), 'ec'), '0', '1', '0');
    const plus = tippen(feldWaehlen(e, 'ec'), 'plus', 'plus');
    expect(messwerteHundertstel(plus).ec).toBe(30);
    expect(bewerteEc(messwerteHundertstel(plus).ec ?? -1, { min: 30, max: 50 }, U)).toBe('gruen');
  });
});

describe('UC9-AK4 pH und Temperatur (R10.2)', () => {
  it('UC9-AK4 pH 6.8 in 2.3 (6.0–6.5, DWC) Ausserhalb mit Hinweis Eisenaufnahme', () => {
    expect(bewertePh(680, PH_BAND, U)).toBe('ausserhalb');
    const r = ergebnisIn('2.3', { ph: 680 });
    expect(r.ohneBewertung).toBe(false);
    expect(r.bewertungen.ph).toBe('ausserhalb');
    const eisen = r.hinweise.find((h) => h.ausloeser === 'ph_hoch');
    expect(eisen?.folge).toContain('Eisen wird schlechter aufgenommen');
    expect(r.alarm).toBe(true);
  });

  it('UC9-AK4 pH 6.7 und 5.8 Knapp daneben', () => {
    expect(bewertePh(670, PH_BAND, U)).toBe('knapp');
    expect(bewertePh(580, PH_BAND, U)).toBe('knapp');
    expect(ergebnisIn('2.3', { ph: 670 }).bewertungen.ph).toBe('knapp');
    expect(ergebnisIn('2.3', { ph: 580 }).bewertungen.ph).toBe('knapp');
    // gleich weit daneben, aber über 0.20: ausserhalb
    expect(bewertePh(579, PH_BAND, U)).toBe('ausserhalb');
  });

  it('UC9-AK4 pH 6.6 Im grünen Bereich, weil 0.1 nicht über u_pH liegt', () => {
    expect(bewertePh(660, PH_BAND, U)).toBe('gruen');
    expect(bewertePh(590, PH_BAND, U)).toBe('gruen');
    expect(ergebnisIn('2.3', { ph: 660 }).bewertungen.ph).toBe('gruen');
    // mit u_pH 0.05 wäre 6.6 knapp
    expect(bewertePh(660, PH_BAND, 5)).toBe('knapp');
  });

  it('UC9-AK4 Station 5.8–6.3: 6.4 grün, 6.5 Knapp daneben, 6.6 Ausserhalb', () => {
    const station = { min: 580, max: 630 };
    expect(bewertePh(640, station, U)).toBe('gruen');
    expect(bewertePh(650, station, U)).toBe('knapp');
    expect(bewertePh(660, station, U)).toBe('ausserhalb');
    // dieselben Werte über die Station 4.4 der Fixture (fester Bereich R4.5)
    expect(ergebnisIn('4.4', { ph: 640 }).bewertungen.ph).toBe('gruen');
    expect(ergebnisIn('4.4', { ph: 650 }).bewertungen.ph).toBe('knapp');
    expect(ergebnisIn('4.4', { ph: 660 }).bewertungen.ph).toBe('ausserhalb');
  });

  it('UC9-AK4 21 °C in 3.2 (Spinat 15–20) Knapp daneben, in 2.3 Im grünen Bereich', () => {
    expect(bewerteTemperatur(2100, { min: 1500, max: 2000 })).toBe('knapp');
    expect(bewerteTemperatur(2100, { min: 1800, max: 2200 })).toBe('gruen');
    expect(ergebnisIn('3.2', { temperatur: 2100 }).bewertungen.temperatur).toBe('knapp');
    expect(ergebnisIn('2.3', { temperatur: 2100 }).bewertungen.temperatur).toBe('gruen');
    // Abweichung bis 2 °C knapp, darüber ausserhalb
    expect(bewerteTemperatur(2200, { min: 1500, max: 2000 })).toBe('knapp');
    expect(bewerteTemperatur(2210, { min: 1500, max: 2000 })).toBe('ausserhalb');
    expect(bewerteTemperatur(1300, { min: 1500, max: 2000 })).toBe('knapp');
    expect(bewerteTemperatur(1290, { min: 1500, max: 2000 })).toBe('ausserhalb');
  });
});

describe('R10.2 Temperatur ohne Band', () => {
  it('R10.2 Temperatur ohne Band: Standard 18–22', () => {
    const teile = messTeile();
    const z = (teile['v_zielbereich'] ?? []).find((r) => r['platz_id'] === platzId('2.3'));
    if (!z) throw new Error('v_zielbereich 2.3 fehlt');
    z['temp_min'] = null;
    z['temp_max'] = null;
    const sb = bewertungsband(teile, platzId('2.3'), JETZT);
    expect(sb?.temperatur).toEqual({ min: 1800, max: 2200 });
    expect(sb?.herkunft).toBe('pflanzungen');
    expect(ergebnisIn('2.3', { temperatur: 2300 }, teile).bewertungen.temperatur).toBe('knapp');
    expect(ergebnisIn('2.3', { temperatur: 2050 }, teile).bewertungen.temperatur).toBe('gruen');
  });
});

describe('bewerten() über alle Grössen', () => {
  it('UC9-AK4 bewerten liefert nur die eingegebenen Grössen', () => {
    const sollband: Sollband = {
      ph: PH_BAND,
      ec: EC_BAND,
      temperatur: { min: 1800, max: 2200 },
      herkunft: 'pflanzungen',
    };
    expect(bewerten({ ph: 680, ec: 141, temperatur: 2050 }, sollband, { uEc: U, uPh: U })).toEqual({
      ph: 'ausserhalb',
      ec: 'knapp',
      temperatur: 'gruen',
    });
    expect(bewerten({ ec: 125 }, sollband, { uEc: U, uPh: U })).toEqual({ ec: 'gruen' });
  });
});

describe('UC9-AK11 Kratky belüftet (R10.4, Bewertungsteil)', () => {
  it('UC9-AK11 3.1 Kratky belüftet (6.0–6.5): 6.6 Im grünen Bereich mit Trendzeile', () => {
    const r = ergebnisIn('3.1', { ph: 660 });
    expect(r.bewertungen.ph).toBe('gruen');
    expect(r.trend.ph?.text).toMatch(/^vorher 6\.5/);
  });

  it('UC9-AK11 6.7 Knapp daneben ohne Alarm', () => {
    const r = ergebnisIn('3.1', { ph: 670 });
    expect(r.bewertungen.ph).toBe('knapp');
    expect(r.alarm).toBe(false);
    // dieselbe Abweichung in 2.3 (DWC) schlägt Alarm
    expect(ergebnisIn('2.3', { ph: 670 }).alarm).toBe(true);
  });

  it('UC9-AK11 6.9 Ausserhalb mit Eisenhinweis und Massnahme pH-Minus', () => {
    const r = ergebnisIn('3.1', { ph: 690 });
    expect(r.bewertungen.ph).toBe('ausserhalb');
    expect(r.alarm).toBe(false);
    const eisen = r.hinweise.find((h) => h.ausloeser === 'eisen');
    expect(eisen?.folge).toContain('Eisen- und Mangansperre');
    expect(eisen?.massnahme).toContain('pH schrittweise senken');
  });
});
