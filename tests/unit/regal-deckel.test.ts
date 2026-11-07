// Nachgebildete Anlage R (tests/fixtures/regal.ts) gegen die Deckel-Vorschläge aus dem Konzept 5.4: S8 mit denselben
// Reihen wie Vorschlag und Demo S1 (#131); alle Typen mit derselben Lochzahl und Topfgrösse; seit Tims Bestätigung der
// Reihen am 7.11.2026 (#136) alle Typen mit denselben Löchern je Reihe. Routine: Test vom Lead.
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

  it('RD-AK3 jeder Deckeltyp von R hat dieselben Löcher je Reihe und Topfgrösse wie DECKEL_VORSCHLAEGE (#136)', () => {
    for (const v of DECKEL_VORSCHLAEGE)
      expect(DECKELTYPEN[v.name], v.name).toEqual({
        topfdurchmesser_mm: v.topfCm * 10,
        loecher_je_reihe: [...v.reihen],
      });
  });
});
