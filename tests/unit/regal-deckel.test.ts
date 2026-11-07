// Nachgebildete Anlage R (tests/fixtures/regal.ts) gegen die Deckel-Vorschläge aus dem Konzept 5.4 (#131): gleiche
// Löcher je Reihe und Topfgrösse, damit E2E und Unit dieselben Lochbilder sehen wie Demo S1 und die App. Routine: Test
// vom Lead.
import { describe, expect, it } from 'vitest';
import { DECKEL_VORSCHLAEGE } from '../../src/domain/vorlagen/deckel-vorschlaege.ts';
import { DECKELTYPEN } from '../fixtures/regal.ts';

describe('Anlage R: Deckeltypen', () => {
  it('RD-AK1 jeder Deckeltyp von R hat Löcher je Reihe und Topfgrösse wie DECKEL_VORSCHLAEGE', () => {
    expect(Object.keys(DECKELTYPEN).sort()).toEqual(DECKEL_VORSCHLAEGE.map((v) => v.name).sort());
    for (const v of DECKEL_VORSCHLAEGE)
      expect(DECKELTYPEN[v.name], v.name).toEqual({
        topfdurchmesser_mm: v.topfCm * 10,
        loecher_je_reihe: v.reihen,
      });
  });
});
