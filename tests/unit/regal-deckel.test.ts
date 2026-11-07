// Nachgebildete Anlage R (tests/fixtures/regal.ts) gegen die Deckel-Vorschläge aus dem Konzept 5.4 (#131): S8 mit
// denselben Reihen wie Vorschlag und Demo S1; alle Typen mit derselben Lochzahl und Topfgrösse. Die Reihen von D1 bis D4
// bleiben bis zu Tims Bestätigung am echten Deckel eine Annahme (A) der Testdaten. Routine: Test vom Lead.
import { describe, expect, it } from 'vitest';
import { DECKEL_VORSCHLAEGE } from '../../src/domain/vorlagen/deckel-vorschlaege.ts';
import { DECKELTYPEN } from '../fixtures/regal.ts';

const summe = (reihen: readonly number[]) => reihen.reduce((a, b) => a + b, 0);

describe('Anlage R: Deckeltypen', () => {
  it('RD-AK1 S8 hat Löcher je Reihe 1, 1, 1, 1 wie der Vorschlag S8', () => {
    const s8 = DECKEL_VORSCHLAEGE.find((v) => v.name === 'S8');
    expect(DECKELTYPEN['S8']).toEqual({ topfdurchmesser_mm: 80, loecher_je_reihe: [1, 1, 1, 1] });
    expect(DECKELTYPEN['S8']?.loecher_je_reihe).toEqual(s8?.reihen);
  });

  it('RD-AK2 jeder Deckeltyp von R hat Lochzahl und Topfgrösse wie DECKEL_VORSCHLAEGE', () => {
    expect(Object.keys(DECKELTYPEN).sort()).toEqual(DECKEL_VORSCHLAEGE.map((v) => v.name).sort());
    for (const v of DECKEL_VORSCHLAEGE) {
      const d = DECKELTYPEN[v.name];
      expect([d?.topfdurchmesser_mm, summe(d?.loecher_je_reihe ?? [])], v.name).toEqual([
        v.topfCm * 10,
        summe(v.reihen),
      ]);
    }
  });
});
