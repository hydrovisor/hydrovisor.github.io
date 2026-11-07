// Eingabe der Messmaske aus gespeicherten Werten (Plan 113 Punkt 14, Prüfer Runde 1 Befund 7; Rundgang-AK3
// «Jetzt korrigieren»): eingabeAus() setzt den Text je Feld aus Hundertsteln mit den Dezimalen aus FELDREGEL (pH 1,
// EC 2, °C 1); Felder ohne Wert bleiben leer, Werte ausserhalb der Felder werden nicht übernommen.
import { describe, expect, it } from 'vitest';
import { eingabeAus } from '../../src/domain/messung/eingabe.ts';

describe('Rundgang-AK3 eingabeAus', () => {
  it('Rundgang-AK3 eingabeAus: pH 690 → 6.9, EC 120 → 1.20, °C 2000 → 20.0', () => {
    const e = eingabeAus(['ph', 'ec', 'temperatur'], { ph: 690, ec: 120, temperatur: 2000 });
    expect(e.text).toEqual({ ph: '6.9', ec: '1.20', temperatur: '20.0' });
    expect(e.felder).toEqual(['ph', 'ec', 'temperatur']);
    expect(e.aktiv).toBe('ph');
  });

  it('Rundgang-AK3 eingabeAus: fehlende Werte bleiben leer', () => {
    expect(eingabeAus(['ph', 'ec', 'temperatur'], { ph: 690 }).text).toEqual({
      ph: '6.9',
      ec: '',
      temperatur: '',
    });
    expect(eingabeAus(['ph', 'ec', 'temperatur'], {}).text).toEqual({ ph: '', ec: '', temperatur: '' });
  });

  it('Rundgang-AK3 eingabeAus: nur die Felder der Maske', () => {
    // Messstelle W ohne pH: ein gespeicherter pH-Wert erscheint nicht
    const e = eingabeAus(['ec', 'temperatur'], { ph: 690, ec: 50, temperatur: 1850 });
    expect(e.text).toEqual({ ph: '', ec: '0.50', temperatur: '18.5' });
  });
});
