// Rundung, Messmittel und Rundungsabweichung des Düngerrechners (Plan 28 Testliste; UC7-AK9, RF1, RF11; R4.4, R4.11,
// G4). Erwartungen aus Konzept 7.3 R4.11 und R4.12, UC7-AK9 und 06_tests.md Abschnitt 4, nicht aus dem Code.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 28 offen ist):
// - `rechner-zahlen.ts` exportiert `bruch(zaehler, nenner = 1): Bruch` zum Bauen exakter Werte und
//   `alsZahl(b: Bruch): number` (Näherung für Vergleiche); die Darstellung von `Bruch` bleibt dem Lead (A3).
// - Ein `Bruch` trägt die Einheit der zugehörigen Ganzzahl: Mengen in Zehnteln ml, EC in Hundertsteln mS/cm,
//   Dosis in Hundertsteln ml/L, k in Tausendsteln. `rundeMenge(bruch(145, 2))` ist also 7.25 ml.
// - `messmittel(...).text` = «10.5 ml, 20-ml-Spritze»; über drei Aufzügen `spritzeMl = null`, Text mit «Messbecher».
// - `mlText(105)` = «10.5 ml» (immer eine Dezimale), `literText(27)` = «2.7 l», `ecText(120)` = «1.20 mS/cm»,
//   mit `{ vorzeichen: true }` «+0.01 mS/cm» oder «−0.01 mS/cm» (Minuszeichen U+2212 wie Konzept R4.11).
import { describe, expect, it } from 'vitest';
import {
  alsZahl,
  bruch,
  ecText,
  literText,
  messmittel,
  mlText,
  rundeMenge,
  rundungsabweichungEc,
} from '../../src/domain/rechner-zahlen.ts';

const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;

describe('rundeMenge (R4.11)', () => {
  it('UC7-AK9 RF11 7.25 ml werden 7.5 ml', () => {
    expect(rundeMenge(bruch(145, 2))).toBe(75);
  });

  it('UC7-AK12 RF11 kaufmännisch auf 0.5 ml: 7.25 ml ergibt 7.5 ml, 7.24 ml ergibt 7.0 ml', () => {
    expect(rundeMenge(bruch(725, 10))).toBe(75);
    expect(rundeMenge(bruch(724, 10))).toBe(70);
  });

  it('UC7-AK9 unter 5 ml auf 0.1 ml: 4.95 → 5.0, 4.94 → 4.9, 2.625 → 2.6 (G4)', () => {
    expect(rundeMenge(bruch(495, 10))).toBe(50);
    expect(rundeMenge(bruch(494, 10))).toBe(49);
    expect(rundeMenge(bruch(2625, 100))).toBe(26);
    expect(rundeMenge(bruch(2650, 100))).toBe(27);
  });

  it('UC7-AK9 ab 5 ml auf 0.5 ml: 5.00 → 5.0, 5.06 → 5.0, 5.24 → 5.0, 5.25 → 5.5', () => {
    expect(rundeMenge(bruch(50))).toBe(50);
    expect(rundeMenge(bruch(506, 10))).toBe(50);
    expect(rundeMenge(bruch(524, 10))).toBe(50);
    expect(rundeMenge(bruch(525, 10))).toBe(55);
    expect(rundeMenge(bruch(5375, 100))).toBe(55);
  });

  it('UC7-AK9 halbe Schritte exakt aus Brüchen: 7/3 · 1/3 · 9 · 0.75 = 5.25 ml → 5.5 ml (UC7-AK1 Micro 75 %)', () => {
    // 5.25 ml = 52.5 Zehntel als Bruch 7 · 9 · 75 · 10 / (3 · 3 · 100)
    expect(rundeMenge(bruch(7 * 9 * 75 * 10, 3 * 3 * 100))).toBe(55);
    // 1.15 ml (RF8) → 1.2 ml; 2.25 ml und 0.75 ml (RF10) → 2.3 und 0.8 ml
    expect(rundeMenge(bruch(23, 2))).toBe(12);
    expect(rundeMenge(bruch(45, 2))).toBe(23);
    expect(rundeMenge(bruch(15, 2))).toBe(8);
  });

  it('UC7-AK7 keine Komponente auf 0: 0.02 ml → 0.1 ml, 0 bleibt 0 (R4.4, A4)', () => {
    expect(rundeMenge(bruch(2, 10))).toBe(1);
    expect(rundeMenge(bruch(1, 1000))).toBe(1);
    expect(rundeMenge(bruch(0))).toBe(0);
  });
});

describe('messmittel (R4.11, Konzept 5.6)', () => {
  it('UC7-AK9 10.5 ml: 20-ml-Spritze; 53.5 ml: 60-ml-Spritze', () => {
    expect(messmittel(105)).toEqual({ spritzeMl: 20, aufzuege: 1, text: '10.5 ml, 20-ml-Spritze' });
    expect(messmittel(535)).toEqual({ spritzeMl: 60, aufzuege: 1, text: '53.5 ml, 60-ml-Spritze' });
  });

  it('UC7-AK9 Grenzen 1.0 / 1.1 / 5.0 / 5.1 / 20.0 / 20.5 ml: kleinste Spritze, die in einem Aufzug fasst', () => {
    expect(messmittel(10).spritzeMl).toBe(1);
    expect(messmittel(11).spritzeMl).toBe(5);
    expect(messmittel(50).spritzeMl).toBe(5);
    expect(messmittel(51).spritzeMl).toBe(20);
    expect(messmittel(200).spritzeMl).toBe(20);
    expect(messmittel(205).spritzeMl).toBe(60);
    expect(messmittel(10).text).toBe('1.0 ml, 1-ml-Spritze');
    expect(messmittel(1).aufzuege).toBe(1);
  });

  it('UC7-AK9 Grenzen 60.0 / 60.5 / 180.0 / 180.5 ml: Aufzüge der 60-ml-Spritze höchstens 3, darüber Messbecher', () => {
    expect(messmittel(600)).toMatchObject({ spritzeMl: 60, aufzuege: 1 });
    expect(messmittel(605)).toMatchObject({ spritzeMl: 60, aufzuege: 2 });
    expect(messmittel(1200)).toMatchObject({ spritzeMl: 60, aufzuege: 2 });
    expect(messmittel(1205)).toMatchObject({ spritzeMl: 60, aufzuege: 3 });
    expect(messmittel(1800)).toMatchObject({ spritzeMl: 60, aufzuege: 3 });
    const becher = messmittel(1805);
    expect(becher.spritzeMl).toBeNull();
    expect(becher.text).toContain('Messbecher');
  });

  it('UC7-AK9 Messmittel aus den Einstellungen: eigene Liste 1, 10, 50 ml (A5)', () => {
    expect(messmittel(105, [1, 10, 50]).spritzeMl).toBe(50);
    expect(messmittel(80, [1, 10, 50]).spritzeMl).toBe(10);
    expect(messmittel(100, [1, 10, 50]).spritzeMl).toBe(10);
    expect(messmittel(10, [1, 10, 50]).spritzeMl).toBe(1);
  });
});

describe('Rundungsabweichung und Texte (R4.11)', () => {
  it('UC7-AK12 RF1 Rundungsabweichung −0.13 ml auf 7 l: Anzeige «−0.01 mS/cm»', () => {
    // RF1: D 7/3 ml/L auf 7 l, Anteile 1/2, 1/3, 1/6 → roh 49/6, 49/9, 49/18 ml (in Zehnteln · 10)
    const roh = { grow: bruch(490, 6), micro_hard_water: bruch(490, 9), bloom: bruch(490, 18) };
    const gerundet = { grow: 80, micro_hard_water: 55, bloom: 27 };
    const summeRoh = alsZahl(roh.grow) + alsZahl(roh.micro_hard_water) + alsZahl(roh.bloom);
    expect(162 - summeRoh).toBeCloseTo(-1.333, 2);
    const abw = rundungsabweichungEc(roh, gerundet, K, 700);
    expect(abw).toBe(-1);
    expect(ecText(abw, { vorzeichen: true })).toBe('−0.01 mS/cm');
  });

  it('UC7-AK9 Rundungsabweichung mit Vorzeichen «+»: UC7-AK1 75 % (+0.35 ml auf 9 l) ergibt «+0.01 mS/cm»', () => {
    // roh 7.875, 5.25, 2.625 ml → 8.0, 5.5, 2.6 ml
    const roh = { grow: bruch(7875, 100), micro_hard_water: bruch(5250, 100), bloom: bruch(2625, 100) };
    const gerundet = { grow: 80, micro_hard_water: 55, bloom: 26 };
    const abw = rundungsabweichungEc(roh, gerundet, K, 900);
    expect(abw).toBe(1);
    expect(ecText(abw, { vorzeichen: true })).toBe('+0.01 mS/cm');
  });

  it('UC7-AK9 Rundungsabweichung 0 bei exakten Mengen (UC7-AK1 100 %: 10.5 / 7.0 / 3.5 ml)', () => {
    const roh = { grow: bruch(105), micro_hard_water: bruch(70), bloom: bruch(35) };
    expect(rundungsabweichungEc(roh, { grow: 105, micro_hard_water: 70, bloom: 35 }, K, 900)).toBe(0);
  });

  it('UC7-AK9 Texte: «10.5 ml», «7.0 ml», «2.7 l», «1.20 mS/cm»', () => {
    expect(mlText(105)).toBe('10.5 ml');
    expect(mlText(70)).toBe('7.0 ml');
    expect(literText(27)).toBe('2.7 l');
    expect(ecText(120)).toBe('1.20 mS/cm');
  });
});
