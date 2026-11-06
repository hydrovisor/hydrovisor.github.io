// Sollband der Bewertung und Messkontext eines Orts (Plan 26 Testliste; R2.2 Zweck «Bewertung», R2.5, R4.5, R10.2;
// UC9 Ablauf 1; A1 bis A3, A11, A17). Injizierte Uhr jetzt = 12.1.2027 18:00 Zürich, Teile aus
// tests/fixtures/messen.ts.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `bewertungsband(teile, platzId, jetzt)`: Sollband in Hundertsteln (auch °C), `herkunft` 'station' |
//   'pflanzungen' | 'ansatz'; undefined ohne Quelle.
// - `alsSchnappschuss(s)`: Einheiten wie im Tabellenkommentar (pH 6, EC 1.4, °C 18 als Zahl).
// - `messkontext(teile, ort, jetzt, zeitzone)`: `art` = Betriebsart des Gefässes, 'station' bei feste_dosis,
//   'messstelle' bei W; `kopfzeile` = «<Kulturgruppen> · <Betriebsart>» mit DWC als «DWC»; `kratkyZeile` nur bei
//   Kratky; `uEc` und `uPh` in Hundertsteln; `ansaetze` nur vom Platz; `ohneBewertung` im Ergebnis ohne Sollband.
import { describe, expect, it } from 'vitest';
import { alsSchnappschuss, bewertungsband } from '../../src/domain/bewertung/sollband.ts';
import { messergebnis } from '../../src/domain/messung/ergebnis.ts';
import { messkontext } from '../../src/domain/messung/messkontext.ts';
import { ortAufloesen } from '../../src/domain/ort.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzHinzu, JETZT, messTeile } from '../fixtures/messen.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';

function kontext(kennung: string, teile: Teile = messTeile()) {
  const ort = ortAufloesen(`R-${kennung}`, teile);
  if (!ort) throw new Error(`Ort R-${kennung} fehlt`);
  return messkontext(teile, ort, JETZT, ZEITZONE);
}

const ohneZielbereich = (teile: Teile, kennung: string) => {
  teile['v_zielbereich'] = (teile['v_zielbereich'] ?? []).filter((z) => z['platz_id'] !== platzId(kennung));
  return teile;
};

describe('R2.2 Sollband der Bewertung', () => {
  it('R2.2 Sollband 2.3 aus v_zielbereich', () => {
    const sb = bewertungsband(messTeile(), platzId('2.3'), JETZT);
    expect(sb).toEqual({
      ph: { min: 600, max: 650 },
      ec: { min: 100, max: 140 },
      temperatur: { min: 1800, max: 2200 },
      herkunft: 'pflanzungen',
    });
    if (!sb) throw new Error('Sollband fehlt');
    expect(alsSchnappschuss(sb)).toEqual({
      ph_min: 6,
      ph_max: 6.5,
      ec_min: 1,
      ec_max: 1.4,
      temp_min: 18,
      temp_max: 22,
    });
    expect(bewertungsband(messTeile(), platzId('3.2'), JETZT)?.temperatur).toEqual({ min: 1500, max: 2000 });
  });

  it('R4.5 Station 4.4: pH 5.8–6.3, EC 0.8–1.1 bei ECWasser 0.5 ohne Ansatz, 1.3–1.7 nach Ansatz echte_blaetter', () => {
    const ohne = bewertungsband(messTeile(), platzId('4.4'), JETZT);
    expect(ohne).toEqual({
      ph: { min: 580, max: 630 },
      ec: { min: 80, max: 110 },
      temperatur: { min: 1800, max: 2200 },
      herkunft: 'station',
    });
    const teile = messTeile();
    ansatzHinzu(teile, {
      id: uid('21', 40),
      kennung: '4.4',
      typ: 'neuansatz',
      begonnenAm: '2027-01-10T10:00:00.000Z',
      stadium: 'echte_blaetter',
    });
    const mit = bewertungsband(teile, platzId('4.4'), JETZT);
    expect(mit?.ec).toEqual({ min: 130, max: 170 });
    expect(mit?.ph).toEqual({ min: 580, max: 630 });
    // ein stornierter jüngerer Neuansatz in wurzeln_keimung ändert nichts
    ansatzHinzu(teile, {
      id: uid('21', 41),
      kennung: '4.4',
      typ: 'neuansatz',
      begonnenAm: '2027-01-11T10:00:00.000Z',
      stadium: 'wurzeln_keimung',
      storniertAm: '2027-01-11T10:05:00.000Z',
    });
    expect(bewertungsband(teile, platzId('4.4'), JETZT)?.ec).toEqual({ min: 130, max: 170 });
    // ECWasser aus v_ec_wasser
    const w = messTeile();
    w['v_ec_wasser'] = [{ anlage_id: (w['anlage'] ?? [])[0]?.['id'], ec: 0.45, herkunft: 'messung' }];
    expect(bewertungsband(w, platzId('4.4'), JETZT)?.ec).toEqual({ min: 75, max: 105 });
  });

  it('R2.2 ohne zählende Pflanzungen Schnappschuss des letzten Neuansatzes', () => {
    // 2.3 ohne Zeile in v_zielbereich: Neuansatz vom 31.12. mit pH 5.8–6.3, EC 1.0–1.4, 18–22
    const sb = bewertungsband(ohneZielbereich(messTeile(), '2.3'), platzId('2.3'), JETZT);
    expect(sb).toEqual({
      ph: { min: 580, max: 630 },
      ec: { min: 100, max: 140 },
      temperatur: { min: 1800, max: 2200 },
      herkunft: 'ansatz',
    });
  });

  it('R2.2 leere Schnittmenge (min > max) fällt auf den Schnappschuss', () => {
    const teile = messTeile();
    const z = (teile['v_zielbereich'] ?? []).find((r) => r['platz_id'] === platzId('2.3'));
    if (!z) throw new Error('v_zielbereich 2.3 fehlt');
    z['ph_min'] = 6.5;
    z['ph_max'] = 6.0;
    const sb = bewertungsband(teile, platzId('2.3'), JETZT);
    expect(sb?.herkunft).toBe('ansatz');
    expect(sb?.ph).toEqual({ min: 580, max: 630 });
  });

  it('R2.2 ohne Quelle kein Sollband', () => {
    expect(bewertungsband(messTeile(), platzId('2.1'), JETZT)).toBeUndefined();
    const k = kontext('2.1');
    expect(k.sollband).toBeUndefined();
    const r = messergebnis({ ph: 620, ec: 125, temperatur: 2050 }, k, JETZT, ZEITZONE);
    expect(r.ohneBewertung).toBe(true);
    expect(r.bewertungen).toEqual({});
    expect(r.spur).toEqual({});
    // ein stornierter Neuansatz mit Schnappschuss ist keine Quelle
    const teile = messTeile();
    ansatzHinzu(teile, {
      id: uid('21', 42),
      kennung: '2.1',
      typ: 'neuansatz',
      begonnenAm: '2027-01-10T10:00:00.000Z',
      storniertAm: '2027-01-10T10:05:00.000Z',
      zielbereich: { ph_min: 5.8, ph_max: 6.3, ec_min: 1, ec_max: 1.4, temp_min: 18, temp_max: 22 },
    });
    expect(bewertungsband(teile, platzId('2.1'), JETZT)).toBeUndefined();
  });
});

describe('UC9 Messkontext', () => {
  it('UC9 Kopfzeile «Salate · DWC», Kratky belüftet «nach einem Pumpintervall messen», Kratky «zuerst umrühren»', () => {
    const k23 = kontext('2.3');
    expect(k23.art).toBe('dwc');
    expect(k23.kopfzeile).toBe('Salate · DWC');
    expect(k23.kratkyZeile).toBeUndefined();
    expect(k23.uEc).toBe(10);
    expect(k23.uPh).toBe(10);
    expect(k23.sollband?.herkunft).toBe('pflanzungen');

    const k31 = kontext('3.1');
    expect(k31.art).toBe('kratky_belueftet');
    expect(k31.kratkyZeile).toBe('nach einem Pumpintervall messen');

    const teile = messTeile();
    for (const g of teile['gefaess'] ?? []) if (g['platz_id'] === platzId('3.1')) g['betriebsart'] = 'kratky';
    const ohnePumpe = kontext('3.1', teile);
    expect(ohnePumpe.art).toBe('kratky');
    expect(ohnePumpe.kratkyZeile).toBe('zuerst umrühren');

    expect(kontext('4.4').art).toBe('station');
    expect(kontext('W').art).toBe('messstelle');
  });

  it('UC9 vorher je Grösse aus der letzten Messung mit diesem Wert', () => {
    const k = kontext('2.3');
    // pH und EC vom 10.1., °C von der jüngeren Messung am 11.1. ohne pH und EC
    expect(k.vorher.ph).toMatchObject({ wert: 610, veraltet: false });
    expect(Date.parse(k.vorher.ph?.giltAb ?? '')).toBe(Date.parse('2027-01-10T17:00:00.000Z'));
    expect(k.vorher.ec).toMatchObject({ wert: 120, veraltet: false });
    expect(k.vorher.temperatur).toMatchObject({ wert: 2100 });
    expect(Date.parse(k.vorher.temperatur?.giltAb ?? '')).toBe(Date.parse('2027-01-11T07:00:00.000Z'));
    // nur Messungen des eigenen Platzes
    expect(kontext('3.1').vorher.ph?.wert).toBe(650);
    // Ansätze nur vom Platz
    expect(k.ansaetze.map((a) => a.platz_id)).toEqual([platzId('2.3')]);
  });

  it('UC9 Messung älter als das 14-Tage-Fenster ergibt kein vorher (A11)', () => {
    const teile = messTeile();
    teile['messung'] = (teile['messung'] ?? []).map((m) =>
      m['platz_id'] === platzId('3.2') ? { ...m, gilt_ab: '2026-12-20T17:00:00.000Z' } : m,
    );
    expect(kontext('3.2', teile).vorher).toEqual({});
  });
});
