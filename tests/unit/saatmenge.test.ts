// Saatmenge und Keimrate (Plan 23 Testliste; UC5-AK9, R12.1, R12.2, G5). Teile aus tests/fixtures/saeen.ts.
//
// Vertrag (Plan 23 «Domänenfunktionen»):
//   keimrate(teile, saatgutId: string | undefined)
//     : { p: number; herkunft: 'beobachtet' | 'packung' | 'art' } | undefined
//     p = v_keimrate.rate_geglaettet begrenzt auf 0.3 bis 0.98; herkunft «beobachtet» ab 10 gesäten Samen,
//     sonst «packung» mit keimfaehigkeit_packung, sonst «art».
//   saatmenge({ p, zieltoepfe, empfehlung?: { samenJeSchwamm, obergrenzeSamen, pflanzenStehenLassen },
//     direktsaat, platzzahl }): { samenJeSchwamm: number; schwaemme: number; schwammKeimrate: number | undefined }
//   Gleitkomma (Plan 23 Risiken): ln 0.1 / ln(1 − 0.9) = 1.0000000000000002; verlangt ist s = 1.
import { describe, expect, it } from 'vitest';
import { keimrate, saatmenge } from '../../src/domain/saatmenge/saatmenge.ts';
import { uid } from '../fixtures/regal.ts';
import { PACKUNG, saatTeile } from '../fixtures/saeen.ts';

const OHNE_STEHEN = (samen: number, ober: number) => ({
  samenJeSchwamm: samen,
  obergrenzeSamen: ober,
  pflanzenStehenLassen: 1,
});

const menge = (
  p: number | undefined,
  zieltoepfe: number,
  empfehlung = OHNE_STEHEN(1, 3),
  direktsaat = false,
) => saatmenge({ p, zieltoepfe, empfehlung, direktsaat, platzzahl: 25 });

/** v_keimrate einer Packung ersetzen */
function mitRate(packung: string, zeile: { gesaet: number; gekeimt: number; rate_geglaettet: number }) {
  const t = saatTeile();
  t['v_keimrate'] = (t['v_keimrate'] ?? []).map((z) =>
    z['saatgut_id'] === packung ? { saatgut_id: packung, ...zeile } : z,
  );
  return t;
}

describe('UC5-AK9 Saatmenge nach R12.1', () => {
  it('UC5-AK9 Keimrate 0.9, vier Zieltöpfe: 1 Samen je Schwamm, 5 Schwämme', () => {
    const m = menge(0.9, 4);
    expect(m.samenJeSchwamm).toBe(1);
    expect(m.schwaemme).toBe(5);
    expect(m.schwammKeimrate).toBeCloseTo(0.9, 2);
  });

  it('UC5-AK9 Keimrate 0.7: 2 Samen, Schwamm-Keimrate 0.91, 5 Schwämme', () => {
    const m = menge(0.7, 4);
    expect(m.samenJeSchwamm).toBe(2);
    expect(m.schwammKeimrate).toBeCloseTo(0.91, 2);
    expect(m.schwaemme).toBe(5);
  });

  it('UC5-AK9 Keimrate 0.5 mit Obergrenze 3: 3 Samen, Schwamm-Keimrate 0.875, 5 Schwämme', () => {
    const m = menge(0.5, 4, OHNE_STEHEN(1, 3));
    expect(m.samenJeSchwamm).toBe(3);
    expect(m.schwammKeimrate).toBeCloseTo(0.875, 3);
    expect(m.schwaemme).toBe(5);
  });

  it('UC5-AK9 Petersilie mit Saatempfehlung 15 Samen, 1 Zieltopf: 15 Samen, 1 Schwamm', () => {
    const m = menge(0.65, 1, { samenJeSchwamm: 15, obergrenzeSamen: 15, pflanzenStehenLassen: 10 });
    expect(m.samenJeSchwamm).toBe(15);
    expect(m.schwaemme).toBe(1);
  });
});

describe('R12.1 Grenzen', () => {
  it('R12.1 q ≥ 0.99 ergibt m = Zieltöpfe', () => {
    // p 0.95, 2 Samen (2 Pflanzen stehen lassen): q = 0.9975; ohne die Regel wäre m = ⌈7 / 0.9975⌉ = 8
    const m = menge(0.95, 7, { samenJeSchwamm: 2, obergrenzeSamen: 3, pflanzenStehenLassen: 2 });
    expect(m.samenJeSchwamm).toBe(2);
    expect(m.schwammKeimrate).toBeGreaterThanOrEqual(0.99);
    expect(m.schwaemme).toBe(7);
  });

  it('R12.1 m höchstens Platzzahl der Box 25', () => {
    // p 0.3, Obergrenze 1: q 0.3, ⌈20 / 0.3⌉ = 67 → 25
    expect(menge(0.3, 20, OHNE_STEHEN(1, 1)).schwaemme).toBe(25);
    expect(
      saatmenge({ p: 0.3, zieltoepfe: 20, empfehlung: OHNE_STEHEN(1, 1), direktsaat: false, platzzahl: 12 })
        .schwaemme,
    ).toBe(12);
  });

  it('R12.1 Direktsaat: m = Zieltöpfe, Ausgleich nur über s bis zur Obergrenze', () => {
    const anzucht = menge(0.7, 3, OHNE_STEHEN(1, 3));
    const direkt = menge(0.7, 3, OHNE_STEHEN(1, 3), true);
    expect(direkt.schwaemme).toBe(3);
    expect(direkt.samenJeSchwamm).toBeGreaterThanOrEqual(anzucht.samenJeSchwamm);
    expect(direkt.samenJeSchwamm).toBeLessThanOrEqual(3);
    // auch bei schlechter Keimrate keine zusätzlichen Schwämme
    expect(menge(0.3, 3, OHNE_STEHEN(1, 2), true)).toMatchObject({ schwaemme: 3, samenJeSchwamm: 2 });
  });

  it('R12.1 p 0.98 ergibt s 1, nie 0', () => {
    const m = menge(0.98, 4);
    expect(m.samenJeSchwamm).toBe(1);
    expect(m.schwaemme).toBe(5);
  });

  it('R12.1 ln-Grenzfall p 0.9 ergibt s 1, nicht 2 (Gleitkomma)', () => {
    // im Gleitkomma nicht genau 1 (V8: 0.9999999999999998, 1 − 0.9 = 0.09999999999999998)
    expect(Math.log(0.1) / Math.log(1 - 0.9)).not.toBe(1);
    expect(menge(0.9, 1).samenJeSchwamm).toBe(1);
    expect(menge(0.9, 9).samenJeSchwamm).toBe(1);
    // 9 / 0.9 ist im Gleitkomma 10.000000000000002: m bleibt 10
    expect(menge(0.9, 9).schwaemme).toBe(10);
  });
});

describe('R12.2 Keimrate der Packung', () => {
  it('R12.2 p begrenzt auf 0.3 bis 0.98', () => {
    expect(
      keimrate(mitRate(PACKUNG.lollo, { gesaet: 40, gekeimt: 40, rate_geglaettet: 0.995 }), PACKUNG.lollo)?.p,
    ).toBe(0.98);
    expect(
      keimrate(mitRate(PACKUNG.lollo, { gesaet: 40, gekeimt: 0, rate_geglaettet: 0.2 }), PACKUNG.lollo)?.p,
    ).toBe(0.3);
    expect(keimrate(saatTeile(), PACKUNG.eichblatt)?.p).toBe(0.7);
  });

  it('R12.2 Herkunft: beobachtet ab 10 Samen, sonst Packung, sonst Art', () => {
    expect(keimrate(saatTeile(), PACKUNG.lollo)).toEqual({ p: 0.9, herkunft: 'packung' });
    // 0 von 12, p_Packung 0.85 → 8.5 / 22 = 0.39 (R12.2)
    expect(
      keimrate(mitRate(PACKUNG.lollo, { gesaet: 12, gekeimt: 0, rate_geglaettet: 8.5 / 22 }), PACKUNG.lollo),
    ).toEqual({ p: 8.5 / 22, herkunft: 'beobachtet' });
    expect(
      keimrate(mitRate(PACKUNG.lollo, { gesaet: 9, gekeimt: 9, rate_geglaettet: 0.9 }), PACKUNG.lollo)
        ?.herkunft,
    ).toBe('packung');
    // Packung ohne Angabe: Standard der Art
    expect(keimrate(saatTeile(), PACKUNG.mooskrause)).toEqual({ p: 0.65, herkunft: 'art' });
    // ohne Packung keine Keimrate
    expect(keimrate(saatTeile(), undefined)).toBeUndefined();
    expect(keimrate(saatTeile(), uid('29', 99))).toBeUndefined();
  });

  it('R12.2 Demo-Keimung zählt nicht (v_keimrate ohne Demo-Zeilen, G5)', () => {
    // Keimungsereignisse einer Demo-Anlage liegen im Bündel, v_keimrate zählt sie nicht (gesät 0)
    const t = saatTeile();
    t['ereignis'] = [
      ...(t['ereignis'] ?? []),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: uid('37', i + 1),
        client_id: uid('37', i + 1),
        typ: 'keimung',
        pflanzung_id: uid('38', i + 1),
        platz_id: null,
        daten: { samen_gesaet: 1, samen_gekeimt: 0, keimtemp_eingehalten: true, datenart: 'demo' },
        gilt_ab: '2027-01-05T08:00:00Z',
        storniert_am: null,
      })),
    ];
    expect(keimrate(t, PACKUNG.lollo)).toEqual({ p: 0.9, herkunft: 'packung' });
  });
});
