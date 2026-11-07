// Zeitwahl, Wertlogik (Plan 142; ZW-AK1). Routine: Tests vom Lead.
import { describe, expect, it } from 'vitest';
import {
  indexAusScroll,
  nachbar,
  werteListe,
  zeitText,
  zeitZerlegen,
} from '../../src/ui/bausteine/zeitwahl-wert.ts';

describe('Zeitwahl Wertlogik', () => {
  it('ZW-AK1 zerlegt «HH:MM», «H:MM» und «HH:MM:SS»; Ungültiges ergibt undefined', () => {
    expect(zeitZerlegen('06:00')).toEqual({ stunde: 6, minute: 0 });
    expect(zeitZerlegen('7:05')).toEqual({ stunde: 7, minute: 5 });
    expect(zeitZerlegen('21:30:00')).toEqual({ stunde: 21, minute: 30 });
    for (const t of ['', '7', '7:5', '24:00', '12:60', 'ab:cd', '07:00:0'])
      expect(zeitZerlegen(t), t).toBeUndefined();
  });

  it('ZW-AK1 setzt «HH:MM» mit führender Null zusammen', () => {
    expect(zeitText({ stunde: 6, minute: 5 })).toBe('06:05');
    expect(zeitText({ stunde: 22, minute: 0 })).toBe('22:00');
  });

  it('ZW-AK1 Stunden von min bis max, Minuten im Schritt 5', () => {
    expect(werteListe(5, 22, 1)).toEqual(Array.from({ length: 18 }, (_, i) => i + 5));
    expect(werteListe(0, 59, 5)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  });

  it('ZW-AK1 ein Wert ausserhalb des Rasters wird einsortiert und bleibt wählbar', () => {
    expect(werteListe(0, 59, 5, 3)).toEqual([0, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(werteListe(5, 22, 1, 4).slice(0, 2)).toEqual([4, 5]);
    expect(werteListe(0, 59, 5, 30)).toHaveLength(12);
  });

  it('ZW-AK1 Pfeil auf/ab geht zum Nachbarn und bleibt an den Grenzen stehen', () => {
    const minuten = werteListe(0, 59, 5);
    expect(nachbar(minuten, 30, 1)).toBe(35);
    expect(nachbar(minuten, 30, -1)).toBe(25);
    expect(nachbar(minuten, 55, 1)).toBe(55);
    expect(nachbar(minuten, 0, -1)).toBe(0);
    expect(nachbar(minuten, 7, 1)).toBe(0);
  });

  it('ZW-AK1 die Scrollposition ergibt den Wert in der Mitte (gerundet, geklemmt)', () => {
    expect(indexAusScroll(0, 48, 12)).toBe(0);
    expect(indexAusScroll(48 * 3, 48, 12)).toBe(3);
    expect(indexAusScroll(48 * 3 + 23, 48, 12)).toBe(3);
    expect(indexAusScroll(48 * 3 + 25, 48, 12)).toBe(4);
    expect(indexAusScroll(-30, 48, 12)).toBe(0);
    expect(indexAusScroll(48 * 40, 48, 12)).toBe(11);
    expect(indexAusScroll(100, 0, 12)).toBe(0);
  });
});
