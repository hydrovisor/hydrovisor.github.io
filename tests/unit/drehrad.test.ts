// Drehrad und Zeitwahl, Wertlogik (Pläne 142 und 147; ZW-AK1, ZR-AK1) und Licht bis 24:00 in der Anlage (ZR-AK2).
// Routine: Tests vom Lead.
import { describe, expect, it } from 'vitest';
import { anlagePruefen, anlageVorgang, STANDARD_BEREICHE } from '../../src/domain/anlage/anlegen.ts';
import {
  indexAusScroll,
  kopienZahl,
  mittlereZeile,
  nachbar,
  werteListe,
  zeitText,
  zeitZerlegen,
  zielZeile,
} from '../../src/ui/bausteine/drehrad-wert.ts';

describe('Drehrad Wertlogik', () => {
  it('ZW-AK1 zerlegt «HH:MM», «H:MM» und «HH:MM:SS»; Ungültiges ergibt undefined', () => {
    expect(zeitZerlegen('06:00')).toEqual({ stunde: 6, minute: 0 });
    expect(zeitZerlegen('7:05')).toEqual({ stunde: 7, minute: 5 });
    expect(zeitZerlegen('21:30:00')).toEqual({ stunde: 21, minute: 30 });
    for (const t of ['', '7', '7:5', '25:00', '12:60', 'ab:cd', '07:00:0'])
      expect(zeitZerlegen(t), t).toBeUndefined();
  });

  it('ZR-AK1 24:00 ist gültig (auch 24:00:00), 24:05 nicht; Stunde 24 gibt es nur mit 00', () => {
    expect(zeitZerlegen('24:00')).toEqual({ stunde: 24, minute: 0 });
    expect(zeitZerlegen('24:00:00')).toEqual({ stunde: 24, minute: 0 });
    expect(zeitZerlegen('24:05')).toBeUndefined();
    expect(zeitText({ stunde: 24, minute: 30 })).toBe('24:00');
    expect(zeitText({ stunde: 6, minute: 5 })).toBe('06:05');
  });

  it('ZW-AK1 Stunden von min bis max, Minuten im Schritt 5; Wert ausserhalb des Rasters wird einsortiert', () => {
    expect(werteListe(5, 22, 1)).toEqual(Array.from({ length: 18 }, (_, i) => i + 5));
    expect(werteListe(0, 24, 1)).toHaveLength(25);
    expect(werteListe(0, 59, 5)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(werteListe(0, 59, 5, 3).slice(0, 3)).toEqual([0, 3, 5]);
    expect(werteListe(0, 59, 5, 30)).toHaveLength(12);
  });

  it('ZR-AK1 Zahlenliste mit Schritt 0.5 ohne Rundungsfehler (Lichtstunden 0 bis 24)', () => {
    const l = werteListe(0, 24, 0.5);
    expect(l).toHaveLength(49);
    expect(l.slice(0, 4)).toEqual([0, 0.5, 1, 1.5]);
    expect(l.at(-1)).toBe(24);
    expect(l).toContain(15.5);
    expect(werteListe(0, 24, 0.5, 15.25)).toContain(15.25);
    expect(werteListe(1, 300, 1)).toHaveLength(300);
  });

  it('ZR-AK1 Nachbar dreht durch: nach 55 folgt 00, vor 00 kommt 55; unbekannt ergibt den ersten Wert', () => {
    const minuten = werteListe(0, 59, 5);
    expect(nachbar(minuten, 30, 1)).toBe(35);
    expect(nachbar(minuten, 30, -1)).toBe(25);
    expect(nachbar(minuten, 55, 1)).toBe(0);
    expect(nachbar(minuten, 0, -1)).toBe(55);
    expect(nachbar(werteListe(0, 24, 1), 24, 1)).toBe(0);
    expect(nachbar(minuten, 7, 1)).toBe(0);
    expect(nachbar([], 7, 1)).toBe(7);
  });

  it('ZR-AK1 Ziel in der nächsten Kopie (kurzer Weg über das Ende), Rücksprung in die mittlere Kopie', () => {
    expect(kopienZahl(12)).toBe(5);
    expect(kopienZahl(300)).toBe(3);
    // 12 Minuten, 5 Kopien: mittlere Kopie beginnt bei Zeile 24
    expect(zielZeile(3, 12, 5)).toBe(27);
    // von 55 (Zeile 35) nach 00: eine Zeile weiter (36), nicht 11 zurück
    expect(zielZeile(0, 12, 5, 35)).toBe(36);
    // von 00 (Zeile 24) nach 55: eine Zeile zurück (23)
    expect(zielZeile(11, 12, 5, 24)).toBe(23);
    expect(mittlereZeile(36, 12, 5)).toBe(24);
    expect(mittlereZeile(23, 12, 5)).toBe(35);
    expect(mittlereZeile(59, 12, 5)).toBe(35);
  });

  it('ZW-AK1 die Scrollposition ergibt die Zeile in der Mitte (gerundet, geklemmt)', () => {
    expect(indexAusScroll(0, 48, 12)).toBe(0);
    expect(indexAusScroll(48 * 3 + 23, 48, 12)).toBe(3);
    expect(indexAusScroll(48 * 3 + 25, 48, 12)).toBe(4);
    expect(indexAusScroll(-30, 48, 12)).toBe(0);
    expect(indexAusScroll(48 * 40, 48, 12)).toBe(11);
    expect(indexAusScroll(100, 0, 12)).toBe(0);
  });
});

describe('Anlage: Licht bis 24:00', () => {
  const eingabe = {
    name: 'Indoor-Regal',
    kuerzel: 'R',
    standort: 'indoor' as const,
    lichtVon: '06:00',
    lichtBis: '24:00',
    luefter: '',
    bereiche: [...STANDARD_BEREICHE],
  };

  it('ZR-AK2 Licht bis 24:00 ist gültig, Licht ab 24:00 und Licht bis 24:30 nicht', () => {
    expect(anlagePruefen(eingabe, {})).toEqual([]);
    expect(anlagePruefen({ ...eingabe, lichtVon: '24:00' }, {}).map((f) => f.feld)).toEqual(['licht']);
    expect(anlagePruefen({ ...eingabe, lichtBis: '24:30' }, {}).map((f) => f.feld)).toEqual(['licht']);
  });

  it('ZR-AK2 der Vorgang schreibt licht_bis 24:00:00 und keine Karbonathärte', () => {
    let n = 0;
    const [anlage] = anlageVorgang(eingabe, () => `id-${++n}`);
    expect(anlage?.art === 'neu' ? anlage.felder : {}).toMatchObject({
      licht_von: '06:00:00',
      licht_bis: '24:00:00',
      karbonathaerte_dh: null,
    });
  });
});
