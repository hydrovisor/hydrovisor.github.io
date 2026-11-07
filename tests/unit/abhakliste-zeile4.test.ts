// Zeile 4 der Abhakliste nennt, was oben fehlt (#123; R2.3 Leitkultur bei Gleichstand, RF7 ohne Zielbereich). Lead-Test.
import { describe, expect, it } from 'vitest';
import { zeile4Sperre } from '../../src/domain/abhakliste/zeilen.ts';

describe('zeile4Sperre (#123)', () => {
  it('R2.3 Gleichstand: «Zuerst oben die Leitkultur wählen», auch ohne Rechnung', () => {
    expect(zeile4Sperre('wahl_noetig', false)).toBe('Zuerst oben die Leitkultur wählen');
    expect(zeile4Sperre('wahl_noetig', true)).toBe('Zuerst oben die Leitkultur wählen');
  });

  it('RF7 ohne Zielbereich und ohne Rechnung: «Zuerst oben Ziel-EC eingeben»', () => {
    expect(zeile4Sperre('art', false)).toBe('Zuerst oben Ziel-EC eingeben');
    expect(zeile4Sperre('keine', false)).toBe('Zuerst oben Ziel-EC eingeben');
  });

  it('mit Rechnung und Leitkultur: nicht gesperrt', () => {
    expect(zeile4Sperre('art', true)).toBeUndefined();
    expect(zeile4Sperre('keine', true)).toBeUndefined();
  });
});
