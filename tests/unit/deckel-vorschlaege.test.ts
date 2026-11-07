// Vorschläge der Deckeltypen aus dem Konzept 5.4 (#125). Lead-Test.
import { describe, expect, it } from 'vitest';
import {
  DECKEL_VORSCHLAEGE,
  deckelVorschlagEingabe,
  deckelVorschlagText,
  offeneDeckelVorschlaege,
} from '../../src/domain/vorlagen/deckel-vorschlaege.ts';
import { deckeltypPruefen } from '../../src/domain/vorlagen/deckeltyp.ts';
import { lochzahl } from '../../src/domain/vorlagen/lochbild.ts';

describe('Deckel-Vorschläge (#125)', () => {
  it('V01-AK1 sieben Typen mit Plätzen und Lochzahl nach Konzept 5.3 und 5.4', () => {
    const je = Object.fromEntries(
      DECKEL_VORSCHLAEGE.map((v) => [v.name, [lochzahl(v.reihen), v.topfCm, v.fuer.join(' ')]]),
    );
    expect(je).toEqual({
      D1: [4, 8, '1.1 1.2'],
      D2: [6, 8, '2.1 2.3'],
      D4: [2, 8, '2.2'],
      D3: [8, 5, '3.1 3.3'],
      D6: [6, 5, '3.2 4.1'],
      S8: [4, 8, '4.2 4.3'],
      S5: [13, 5, '4.4 4.5'],
    });
  });

  it('V01-AK1 Reihen aller Typen fest: D6 und S5 nach Konzept 5.4, die übrigen nach dem 3D-Modell, von Tim bestätigt (#136)', () => {
    expect(Object.fromEntries(DECKEL_VORSCHLAEGE.map((v) => [v.name, v.reihen.join(', ')]))).toEqual({
      D1: '2, 2',
      D2: '3, 3',
      D4: '1, 1',
      D3: '4, 4',
      D6: '2, 2, 2',
      S8: '1, 1, 1, 1',
      S5: '1, 2, 1, 2, 1, 2, 1, 2, 1',
    });
    expect(DECKEL_VORSCHLAEGE.filter((v) => v.reihenAngenommen).map((v) => v.name)).toEqual([]);
  });

  it('V01-AK1 offen sind die Typen ohne gleichnamigen Deckel; «Demo D1» zählt nicht, Gross- und Kleinschreibung egal', () => {
    const offen = offeneDeckelVorschlaege([{ name: 'Demo D1' }, { name: ' d2 ' }, { name: 'S5' }]);
    expect(offen.map((v) => v.name)).toEqual(['D1', 'D4', 'D3', 'D6', 'S8']);
    expect(offeneDeckelVorschlaege(DECKEL_VORSCHLAEGE)).toEqual([]);
  });

  it('V01-AK1 jeder Vorschlag ergibt eine gültige Eingabe mit Service-Öffnung', () => {
    for (const v of DECKEL_VORSCHLAEGE) {
      const e = deckelVorschlagEingabe(v);
      expect(deckeltypPruefen(e, []), v.name).toEqual([]);
      expect(e.serviceOeffnung).toBe(true);
    }
  });

  it('V01-AK1 Text «2, 2 · 4 Löcher · 8 cm · für 1.1, 1.2»', () => {
    const d1 = DECKEL_VORSCHLAEGE.find((v) => v.name === 'D1');
    expect(d1 && deckelVorschlagText(d1)).toBe('2, 2 · 4 Löcher · 8 cm · für 1.1, 1.2');
  });
});
