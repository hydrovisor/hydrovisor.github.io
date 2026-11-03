// Eingabe der Messmaske über den eigenen Ziffernblock (Plan 12 Testliste und Regeln «Eingabe», «Leeres Feld»;
// Use Cases F4 UC9 AK2, U1, U2, U3, U13; G3; design-system/components/NumPad.md).
// Dezimalpunkt automatisch: pH 1 Vorkomma + 1 Dezimale (A12), EC 1 + 2, °C 2 + 1; Rechnung in Hundertsteln.
// Der Prellfilter gehört zum Baustein (DS-01) und ist hier nicht Gegenstand.
import { describe, expect, it } from 'vitest';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  messwerte,
  speichernMoeglich,
  type Groesse,
  type Messeingabe,
  type Taste,
} from '../../src/domain/messung/eingabe.ts';

const ALLE: readonly Groesse[] = ['ph', 'ec', 'temperatur'];

/** tippt die Tasten der Reihe nach */
function tippen(e: Messeingabe, ...tasten: Taste[]): Messeingabe {
  return tasten.reduce((stand, taste) => eingabeTippen(stand, taste), e);
}

/** Feld wählen und tippen */
const imFeld = (e: Messeingabe, feld: Groesse, ...tasten: Taste[]) => tippen(feldWaehlen(e, feld), ...tasten);

describe('UC9-AK2 leere Felder', () => {
  it('UC9-AK2 leeres Feld wird null, Speichern erst ab einem Wert', () => {
    const start = eingabeStart(ALLE);
    expect(start.felder).toEqual(ALLE);
    expect(start.aktiv).toBe('ph');
    expect(start.text).toEqual({ ph: '', ec: '', temperatur: '' });
    expect(speichernMoeglich(start)).toBe(false);
    expect(messwerte(start)).toEqual({
      ph: null,
      ec: null,
      temperatur: null,
      ec_eingabe: null,
      ec_dezimalen: null,
    });
    const mitWert = tippen(start, '6', '7');
    expect(speichernMoeglich(mitWert)).toBe(true);
    expect(messwerte(mitWert)).toMatchObject({ ph: 6.7, ec: null, temperatur: null, ec_eingabe: null });
  });

  it('UC9-AK2 nur EC eingegeben: ph und temperatur null', () => {
    const e = imFeld(eingabeStart(ALLE), 'ec', '1', '2', '5');
    expect(speichernMoeglich(e)).toBe(true);
    expect(messwerte(e)).toEqual({
      ph: null,
      ec: 1.25,
      temperatur: null,
      ec_eingabe: '1.25',
      ec_dezimalen: 2,
    });
  });

  it('UC9-AK2 W ohne pH-Feld', () => {
    const start = eingabeStart(['ec', 'temperatur']);
    expect(start.felder).toEqual(['ec', 'temperatur']);
    expect(start.felder).not.toContain('ph');
    expect(start.aktiv).toBe('ec');
    expect(speichernMoeglich(start)).toBe(false);
    const e = tippen(start, '0', '4', '5');
    expect(e.aktiv).toBe('temperatur');
    expect(messwerte(e)).toMatchObject({ ph: null, ec: 0.45, temperatur: null, ec_eingabe: '0.45' });
    expect(speichernMoeglich(e)).toBe(true);
  });

  it('UC9-AK2 leeren des einzigen Werts sperrt Speichern wieder', () => {
    const e = imFeld(eingabeStart(ALLE), 'ec', '1', '2');
    expect(speichernMoeglich(e)).toBe(true);
    const leer = eingabeTippen(e, 'leeren');
    expect(messwerte(leer).ec).toBeNull();
    expect(speichernMoeglich(leer)).toBe(false);
  });
});

describe('UC9-AK3 (Eingabeteil) Dezimalpunkt und ±', () => {
  it('UC9-AK3 (Eingabeteil) «6», «7» im pH-Feld → 6.7 und Fokus auf EC', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7');
    expect(e.text.ph).toBe('6.7');
    expect(messwerte(e).ph).toBe(6.7);
    expect(e.aktiv).toBe('ec');
  });

  it('UC9-AK3 (Eingabeteil) «2», «0», «5» bei °C → 20.5', () => {
    const e = imFeld(eingabeStart(ALLE), 'temperatur', '2', '0', '5');
    expect(e.text.temperatur).toBe('20.5');
    expect(messwerte(e).temperatur).toBe(20.5);
  });

  it('UC9-AK3 (Eingabeteil) «1», «1», «2» bei EC → 1.12', () => {
    const e = imFeld(eingabeStart(ALLE), 'ec', '1', '1', '2');
    expect(e.text.ec).toBe('1.12');
    expect(messwerte(e)).toMatchObject({ ec: 1.12, ec_eingabe: '1.12', ec_dezimalen: 2 });
    expect(e.aktiv).toBe('temperatur');
  });

  it('UC9-AK3 (Eingabeteil) «+0.1» zweimal → +0.2 ohne Rundungsrest', () => {
    const e = imFeld(eingabeStart(ALLE), 'ec', '1', '1', '2');
    const plus = tippen(feldWaehlen(e, 'ec'), 'plus', 'plus');
    // in Gleitkomma wäre 1.12 + 0.1 + 0.1 = 1.3200000000000003
    expect(messwerte(plus).ec).toBe(1.32);
    expect(messwerte(plus).ec_eingabe).toBe('1.32');
    expect(plus.text.ec).toBe('1.32');
    const zurueck = tippen(plus, 'minus', 'minus');
    expect(messwerte(zurueck).ec).toBe(1.12);
  });
});

describe('U1 Ziffernblock', () => {
  it('U1 «8», «.», «5» bei °C → 8.5', () => {
    const e = imFeld(eingabeStart(ALLE), 'temperatur', '8', '.', '5');
    expect(e.text.temperatur).toBe('8.5');
    expect(messwerte(e).temperatur).toBe(8.5);
  });

  it('U1 «weiter» springt zum nächsten Feld', () => {
    const start = eingabeStart(ALLE);
    const ec = eingabeTippen(start, 'weiter');
    expect(ec.aktiv).toBe('ec');
    expect(messwerte(ec).ph).toBeNull();
    expect(eingabeTippen(ec, 'weiter').aktiv).toBe('temperatur');
  });

  it('U1 Rücktaste löscht die letzte Stelle', () => {
    const e = imFeld(eingabeStart(ALLE), 'ec', '1', '2');
    expect(messwerte(e).ec).toBe(1.2);
    const weg = eingabeTippen(e, 'zurueck');
    expect(messwerte(weg).ec).toBe(1);
    expect(weg.aktiv).toBe('ec');
    const neu = tippen(weg, '5', '0');
    expect(messwerte(neu)).toMatchObject({ ec: 1.5, ec_eingabe: '1.50' });
    const alles = tippen(feldWaehlen(neu, 'ec'), 'zurueck', 'zurueck', 'zurueck', 'zurueck');
    expect(messwerte(alles).ec).toBeNull();
  });

  it('U1 «leeren», dann Rücktaste stellt den Wert wieder her', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7');
    const geleert = eingabeTippen(feldWaehlen(e, 'ph'), 'leeren');
    expect(geleert.text.ph).toBe('');
    expect(messwerte(geleert).ph).toBeNull();
    const wieder = eingabeTippen(geleert, 'zurueck');
    expect(wieder.text.ph).toBe('6.7');
    expect(messwerte(wieder).ph).toBe(6.7);
  });

  it('U1 Tippen auf eine Kachel wählt das Feld, die Werte der anderen Felder bleiben', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7', '1', '2', '0');
    expect(e.aktiv).toBe('temperatur');
    const zurueckZuPh = feldWaehlen(e, 'ph');
    expect(zurueckZuPh.aktiv).toBe('ph');
    expect(messwerte(zurueckZuPh)).toMatchObject({ ph: 6.7, ec: 1.2 });
  });
});

describe('U3 harte Grenzen', () => {
  it('U3 pH über 14, EC ab 10, °C über 50 nicht eingebbar', () => {
    // pH 9.9 (eine Vorkommastelle), EC 9.99, °C: «9» ja, «99» nein
    const e = tippen(eingabeStart(ALLE), '9', '9', '9', '9', '9', '9', '9', '9');
    const w = messwerte(e);
    expect(w.ph).toBe(9.9);
    expect(w.ec).toBe(9.99);
    expect(w.temperatur).toBe(9);
    // °C «5», «1» → 51 nicht angenommen; «0» → 50; «5» → 50.5 nicht angenommen; «0» → 50.0
    const t = imFeld(eingabeStart(ALLE), 'temperatur', '5', '1', '0', '5', '0');
    expect(messwerte(t).temperatur).toBe(50);
    expect(t.text.temperatur).toBe('50.0');
  });

  it('U3 ± stoppt an den Grenzen', () => {
    const oben = imFeld(eingabeStart(ALLE), 'temperatur', '4', '9', '9');
    const plus = tippen(feldWaehlen(oben, 'temperatur'), 'plus', 'plus', 'plus');
    expect(messwerte(plus).temperatur).toBe(50);
    const unten = imFeld(eingabeStart(ALLE), 'temperatur', '0', '.', '1');
    const minus = tippen(feldWaehlen(unten, 'temperatur'), 'minus', 'minus', 'minus');
    expect(messwerte(minus).temperatur).toBe(0);
    const ec = tippen(feldWaehlen(imFeld(eingabeStart(ALLE), 'ec', '0', '0', '5'), 'ec'), 'minus');
    const ecWert = messwerte(ec).ec;
    expect(ecWert).not.toBeNull();
    expect(ecWert ?? -1).toBeGreaterThanOrEqual(0);
    const ph = tippen(feldWaehlen(tippen(eingabeStart(ALLE), '9', '9'), 'ph'), 'plus', 'plus');
    expect(messwerte(ph).ph ?? 99).toBeLessThanOrEqual(14);
  });

  it('U3 ± auf leerem Feld ohne Wirkung', () => {
    const start = eingabeStart(ALLE);
    const e = tippen(start, 'plus', 'minus', 'plus');
    expect(e.text.ph).toBe('');
    expect(messwerte(e).ph).toBeNull();
    expect(speichernMoeglich(e)).toBe(false);
  });
});

describe('G3 Hundertstel', () => {
  it('G3 Werte intern in Hundertsteln: 6.7 + 0.1 = 6.8 exakt', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7');
    const plus = eingabeTippen(feldWaehlen(e, 'ph'), 'plus');
    expect(messwerte(plus).ph).toBe(6.8);
    expect(plus.text.ph).toBe('6.8');
    // 0.1 + 0.2 in Gleitkomma wäre 0.30000000000000004
    const ec = tippen(feldWaehlen(imFeld(eingabeStart(ALLE), 'ec', '0', '1', '0'), 'ec'), 'plus', 'plus');
    expect(messwerte(ec).ec).toBe(0.3);
    expect(messwerte(ec).ec_eingabe).toBe('0.30');
  });
});
