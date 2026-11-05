// Nachbesserung Runde 1 zu I1b-01 (Plan 26, Prüferbefunde 1, 3, 4, 8): Tests des Leads, die Dateien des
// Testentwicklers bleiben unverändert. Injizierte Uhr 12.1.2027 18:00 Zürich.
import { describe, expect, it } from 'vitest';
import { bewerten } from '../../src/domain/bewertung/bewertung.ts';
import { hinweise } from '../../src/domain/bewertung/hinweise.ts';
import { bewertungsband, type Sollband } from '../../src/domain/bewertung/sollband.ts';
import type { Groesse } from '../../src/domain/messung/eingabe.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzHinzu, JETZT, messTeile } from '../fixtures/messen.ts';
import { platzId, uid } from '../fixtures/regal.ts';

const BAND: Sollband = {
  ph: { min: 600, max: 650 },
  ec: { min: 80, max: 120 },
  temperatur: { min: 1800, max: 2200 },
  herkunft: 'pflanzungen',
};
const VOR_7_TAGEN = '2027-01-05T17:00:00.000Z';

function kratky(werte: Partial<Record<Groesse, number>>, vorher: Partial<Record<Groesse, number>> = {}) {
  return hinweise(
    {
      betriebsart: 'kratky_belueftet',
      werte,
      bewertungen: bewerten(werte, BAND, { uEc: 10, uPh: 10 }),
      sollband: BAND,
      vorher: Object.fromEntries(
        Object.entries(vorher).map(([g, w]) => [g, { wert: w, giltAb: VOR_7_TAGEN }]),
      ),
      ansaetze: [],
      uPh: 10,
    },
    JETZT,
    ZEITZONE,
  ).hinweise.map((h) => h.ausloeser);
}

describe('R10.4 Beobachtungsband Kratky (Runde 1 Befunde 1, 4)', () => {
  it('R10.4 pH 6.7 knapp mit Vorwert: Trend als Massnahme, ohne Alarm', () => {
    const r = hinweise(
      {
        betriebsart: 'kratky_belueftet',
        werte: { ph: 670 },
        bewertungen: { ph: 'knapp' },
        sollband: BAND,
        vorher: { ph: { wert: 660, giltAb: VOR_7_TAGEN } },
        ansaetze: [],
      },
      JETZT,
      ZEITZONE,
    );
    expect(r.hinweise.map((h) => h.ausloeser)).toEqual(['ph_trend']);
    expect(r.hinweise[0]?.massnahme).toBe('Trend beobachten: vorher 6.6, jetzt 6.7');
    expect(r.hinweise[0]?.ton).toBe('info');
    expect(r.alarm).toBe(false);
    // ohne Vorwert kein Trend
    expect(kratky({ ph: 670 })).toEqual([]);
    // über 6.8 der Eisenhinweis statt des Trends
    expect(kratky({ ph: 690 }, { ph: 680 })).toContain('eisen');
    expect(kratky({ ph: 690 }, { ph: 680 })).not.toContain('ph_trend');
  });

  it('R10.4 Kratky unter dem Sollband: «pH vorsichtig anheben» erst unter 5.5', () => {
    expect(kratky({ ph: 550 })).not.toContain('ph_tief');
    expect(kratky({ ph: 549 })).toContain('ph_tief');
    expect(kratky({ ph: 560 }, { ph: 580 })).toEqual(['ph_trend']);
  });

  it('R10.4 Anstieg innerhalb von u_pH gibt keinen Hinweis (A)', () => {
    // 6.0 → 6.1 in 2 Tagen ergäbe 0.35 je Woche, liegt aber nur bei u_pH
    const r = hinweise(
      {
        betriebsart: 'kratky_belueftet',
        werte: { ph: 610 },
        bewertungen: { ph: 'gruen' },
        sollband: BAND,
        vorher: { ph: { wert: 600, giltAb: '2027-01-10T17:00:00.000Z' } },
        ansaetze: [],
        uPh: 10,
      },
      JETZT,
      ZEITZONE,
    );
    expect(r.hinweise.map((h) => h.ausloeser)).not.toContain('ph_anstieg');
  });
});

describe('R2.4 Mischentscheid (Runde 1 Befund 3)', () => {
  it('R2.4 Leitkultur oder Kompromiss: Schnappschuss des Ansatzes vor der Sicht, pH und EC höchstens knapp', () => {
    const teile = messTeile();
    ansatzHinzu(teile, {
      id: uid('21', 60),
      kennung: '2.3',
      typ: 'neuansatz',
      begonnenAm: '2027-01-11T10:00:00.000Z',
      zielbereich: { ph_min: 5.9, ph_max: 6.4, ec_min: 1.1, ec_max: 1.3, temp_min: 18, temp_max: 22 },
    });
    const a = (teile['naehrloesungsansatz'] ?? []).find((x) => x['id'] === uid('21', 60));
    if (!a) throw new Error('Ansatz fehlt');
    a['mischentscheid'] = 'kompromiss';
    const sb = bewertungsband(teile, platzId('2.3'), JETZT);
    expect(sb).toMatchObject({ ph: { min: 590, max: 640 }, ec: { min: 110, max: 130 }, herkunft: 'ansatz' });
    expect(sb?.hoechstensKnapp).toBe(true);
    if (!sb) throw new Error('Sollband fehlt');
    expect(bewerten({ ph: 620, ec: 120, temperatur: 2000 }, sb, { uEc: 10, uPh: 10 })).toEqual({
      ph: 'knapp',
      ec: 'knapp',
      temperatur: 'gruen',
    });
    // andere Phase: Schnappschuss ohne Kappung
    a['mischentscheid'] = 'andere_phase';
    expect(bewertungsband(teile, platzId('2.3'), JETZT)?.hoechstensKnapp).toBeUndefined();
    // kein Entscheid: weiter v_zielbereich
    a['mischentscheid'] = 'keiner';
    expect(bewertungsband(teile, platzId('2.3'), JETZT)?.herkunft).toBe('pflanzungen');
  });
});

describe('Nachbesserung Runde 2 (Prüferbefunde 1, 2, 3, 4, 7)', () => {
  const KOMPROMISS: Sollband = { ...BAND, ph: { min: 600, max: 650 }, hoechstensKnapp: true };

  it('R10.4 nach Nachfüllen zwischen den Messungen kein Trend', () => {
    const r = hinweise(
      {
        betriebsart: 'kratky_belueftet',
        werte: { ph: 590 },
        bewertungen: { ph: 'knapp' },
        sollband: BAND,
        vorher: { ph: { wert: 640, giltAb: VOR_7_TAGEN } },
        ansaetze: [
          {
            id: uid('21', 70),
            platz_id: platzId('3.1'),
            typ: 'nachfuellen',
            status: 'abgeschlossen',
            begonnen_am: '2027-01-08T10:00:00.000Z',
            kontrollmessung_id: null,
            endmessung_id: null,
            storniert_am: null,
          },
        ],
      },
      JETZT,
      ZEITZONE,
    );
    expect(r.hinweise.map((h) => h.ausloeser)).not.toContain('ph_trend');
  });

  it('R2.4 Kappung allein löst keinen Korrekturhinweis aus', () => {
    const werte = { ph: 660, ec: 115 };
    const bewertungen = bewerten(werte, KOMPROMISS, { uEc: 10, uPh: 10 });
    expect(bewertungen).toEqual({ ph: 'knapp', ec: 'knapp' });
    const r = hinweise(
      {
        betriebsart: 'dwc',
        werte,
        bewertungen,
        sollband: KOMPROMISS,
        vorher: {},
        ansaetze: [],
        uPh: 10,
        uEc: 10,
      },
      JETZT,
      ZEITZONE,
    );
    expect(r.hinweise).toEqual([]);
    expect(r.alarm).toBe(false);
    // 6.7 liegt auch ungekappt daneben: Hinweis bleibt
    const daneben = hinweise(
      {
        betriebsart: 'dwc',
        werte: { ph: 670 },
        bewertungen: bewerten({ ph: 670 }, KOMPROMISS, { uEc: 10, uPh: 10 }),
        sollband: KOMPROMISS,
        vorher: {},
        ansaetze: [],
        uPh: 10,
        uEc: 10,
      },
      JETZT,
      ZEITZONE,
    );
    expect(daneben.hinweise.map((h) => h.ausloeser)).toEqual(['ph_hoch']);
  });

  it('R2.4 abgebrochener Ansatz zählt nicht; Temperatur aus der Sicht, wenn der Schnappschuss keine hat', () => {
    const teile = messTeile();
    ansatzHinzu(teile, {
      id: uid('21', 61),
      kennung: '3.2',
      typ: 'neuansatz',
      begonnenAm: '2027-01-11T10:00:00.000Z',
      zielbereich: { ph_min: 5.9, ph_max: 6.4, ec_min: 1.1, ec_max: 1.3 },
    });
    const a = (teile['naehrloesungsansatz'] ?? []).find((x) => x['id'] === uid('21', 61));
    if (!a) throw new Error('Ansatz fehlt');
    a['mischentscheid'] = 'leitkultur';
    const sb = bewertungsband(teile, platzId('3.2'), JETZT);
    expect(sb).toMatchObject({ herkunft: 'ansatz', temperatur: { min: 1500, max: 2000 } });
    a['status'] = 'abgebrochen';
    expect(bewertungsband(teile, platzId('3.2'), JETZT)?.herkunft).toBe('pflanzungen');
  });

  it('Eisenhinweis nennt den Sollwert wie die übrigen Bandhinweise', () => {
    const r = hinweise(
      {
        betriebsart: 'kratky_belueftet',
        werte: { ph: 690 },
        bewertungen: { ph: 'ausserhalb' },
        sollband: BAND,
        vorher: {},
        ansaetze: [],
      },
      JETZT,
      ZEITZONE,
    );
    expect(r.hinweise.find((h) => h.ausloeser === 'eisen')?.sollwert).toBe('Sollwert deiner Anlage 6.0–6.5.');
  });
});
