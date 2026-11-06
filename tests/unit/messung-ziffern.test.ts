// Ziffernblock mit Prellfilter und Übergang zur Ergebniszone (Plan 26 Testliste; UC9-AK3 Eingabeteil mit Zeiten;
// U1, U13; G3; A21). Zeitstempel in ms wie event.timeStamp im Baustein NumPad.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `messwerteHundertstel(e)`: nur Felder aus `e.felder` mit Text; Wert als Ganzzahl in Hundertsteln; leeres Feld
//   fehlt als Schlüssel.
// - `feldVollstaendig(e, feld)`: wahr, wenn alle Dezimalen nach FELDREGEL getippt sind (pH «6.2», EC «1.25»,
//   °C «20.5»).
// - `eingabeAbgeschlossen(vorher, nachher, taste)`: wahr, wenn die Taste das letzte Feld von `felder` vollständig
//   machte, oder bei «weiter» auf dem letzten Feld mit mindestens einem Wert; sonst falsch.
import { describe, expect, it } from 'vitest';
import {
  eingabeAbgeschlossen,
  eingabeStart,
  eingabeTippen,
  feldVollstaendig,
  feldWaehlen,
  messwerte,
  messwerteHundertstel,
  type Groesse,
  type Messeingabe,
  type Taste,
} from '../../src/domain/messung/eingabe.ts';
import { prellfilter, type Prellzustand } from '../../src/ui/bausteine/prellfilter.ts';

const ALLE: readonly Groesse[] = ['ph', 'ec', 'temperatur'];

/** Tipps mit Zeitstempel über Prellfilter und Eingabe, wie der Baustein NumPad sie weitergibt */
function tippenMitZeit(e: Messeingabe, folge: [Taste, number][]): Messeingabe {
  let zustand: Prellzustand | null = null;
  let stand = e;
  for (const [taste, ms] of folge) {
    const r = prellfilter(zustand, taste, ms);
    zustand = r.zustand;
    if (r.zaehlt) stand = eingabeTippen(stand, taste);
  }
  return stand;
}

/** tippt der Reihe nach */
const tippen = (e: Messeingabe, tasten: Taste[]) => tasten.reduce((s, t) => eingabeTippen(s, t), e);

/** tippt der Reihe nach und meldet für jede Taste, ob danach die Ergebniszone erscheint */
function ablauf(e: Messeingabe, tasten: Taste[]): { stand: Messeingabe; abgeschlossen: boolean[] } {
  const abgeschlossen: boolean[] = [];
  let stand = e;
  for (const t of tasten) {
    const neu = eingabeTippen(stand, t);
    abgeschlossen.push(eingabeAbgeschlossen(stand, neu, t));
    stand = neu;
  }
  return { stand, abgeschlossen };
}

describe('UC9-AK3 Eingabe über Prellfilter und Ziffernblock', () => {
  it('UC9-AK3 «6», «7» im pH-Feld ergibt 6.7', () => {
    const e = tippenMitZeit(eingabeStart(ALLE), [
      ['6', 0],
      ['7', 300],
    ]);
    expect(e.text.ph).toBe('6.7');
    expect(messwerteHundertstel(e)).toEqual({ ph: 670 });
  });

  it('UC9-AK3 «2», «0», «5» bei °C ergibt 20.5', () => {
    const e = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'temperatur'), [
      ['2', 0],
      ['0', 200],
      ['5', 400],
    ]);
    expect(e.text.temperatur).toBe('20.5');
    expect(messwerteHundertstel(e)).toEqual({ temperatur: 2050 });
  });

  it('UC9-AK3 «1, 1, 2» innert 0.6 s über Prellfilter und Eingabe ergibt EC 1.12', () => {
    const e = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'ec'), [
      ['1', 0],
      ['1', 300],
      ['2', 600],
    ]);
    expect(e.text.ec).toBe('1.12');
    expect(messwerteHundertstel(e).ec).toBe(112);
    expect(messwerte(e).ec_eingabe).toBe('1.12');
  });

  it('UC9-AK3 «+0.1» zweimal innert 0.5 s über Prellfilter und Eingabe ergibt +0.2', () => {
    const start = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'ec'), [
      ['1', 0],
      ['1', 300],
      ['2', 600],
    ]);
    const e = tippenMitZeit(feldWaehlen(start, 'ec'), [
      ['plus', 1000],
      ['plus', 1250],
    ]);
    expect(e.text.ec).toBe('1.32');
    expect(messwerteHundertstel(e).ec).toBe(132);
  });
});

describe('U13 Prellfilter', () => {
  it('U13 zweiter Tipp derselben Taste nach 50 ms verworfen', () => {
    const e = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'ec'), [
      ['1', 0],
      ['1', 50],
    ]);
    expect(e.text.ec).toBe('1');
    // eine andere Taste nach 50 ms zählt
    const anders = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'ec'), [
      ['1', 0],
      ['2', 50],
    ]);
    expect(anders.text.ec).toBe('1.2');
    // dieselbe Taste nach 80 ms zählt wieder
    const spaeter = tippenMitZeit(feldWaehlen(eingabeStart(ALLE), 'ec'), [
      ['1', 0],
      ['1', 80],
    ]);
    expect(spaeter.text.ec).toBe('1.1');
  });
});

describe('U1 Übergang zur Ergebniszone (A21)', () => {
  it('U1 eingabeAbgeschlossen: dritter Wert vollständig ergibt Ergebniszone; «weiter» auf dem letzten Feld mit einem Wert auch; leere Eingabe nicht', () => {
    const voll = ablauf(eingabeStart(ALLE), ['6', '2', '1', '2', '5', '2', '0', '5']);
    expect(voll.abgeschlossen).toEqual([false, false, false, false, false, false, false, true]);
    expect(messwerteHundertstel(voll.stand)).toEqual({ ph: 620, ec: 125, temperatur: 2050 });

    // nur pH, dann «weiter» bis °C (EC bleibt leer) und noch einmal «weiter» auf dem letzten Feld
    const teil = ablauf(eingabeStart(ALLE), ['6', '2', 'weiter']);
    expect(teil.stand.aktiv).toBe('temperatur');
    expect(teil.abgeschlossen).toEqual([false, false, false]);
    const weiter = eingabeTippen(teil.stand, 'weiter');
    expect(eingabeAbgeschlossen(teil.stand, weiter, 'weiter')).toBe(true);

    // leere Eingabe: «weiter» auf dem letzten Feld öffnet die Ergebniszone nicht
    const leer = ablauf(eingabeStart(ALLE), ['weiter', 'weiter', 'weiter']);
    expect(leer.abgeschlossen).toEqual([false, false, false]);
  });

  it('U1 eine Ziffer, die das letzte Feld noch nicht vollständig macht, öffnet die Ergebniszone nicht', () => {
    const e = ablauf(feldWaehlen(eingabeStart(ALLE), 'temperatur'), ['2', '0']);
    expect(e.abgeschlossen).toEqual([false, false]);
    // Rücktaste auf dem vollständigen letzten Feld auch nicht
    const voll = ablauf(feldWaehlen(eingabeStart(ALLE), 'temperatur'), ['2', '0', '5', 'zurueck']);
    expect(voll.abgeschlossen).toEqual([false, false, true, false]);
  });

  it('U1 W mit zwei Feldern: Ergebniszone nach dem zweiten Wert', () => {
    const w = ablauf(eingabeStart(['ec', 'temperatur']), ['0', '4', '5', '1', '8', '5']);
    expect(w.abgeschlossen).toEqual([false, false, false, false, false, true]);
    expect(messwerteHundertstel(w.stand)).toEqual({ ec: 45, temperatur: 1850 });
  });

  it('U1 feldVollstaendig nach FELDREGEL', () => {
    const e = tippen(eingabeStart(ALLE), ['6', '2', '1', '2']);
    expect(feldVollstaendig(e, 'ph')).toBe(true);
    expect(feldVollstaendig(e, 'ec')).toBe(false);
    expect(feldVollstaendig(e, 'temperatur')).toBe(false);
    const mehr = tippen(e, ['5', '2', '0']);
    expect(feldVollstaendig(mehr, 'ec')).toBe(true);
    expect(feldVollstaendig(mehr, 'temperatur')).toBe(false);
    expect(feldVollstaendig(eingabeTippen(mehr, '5'), 'temperatur')).toBe(true);
    expect(feldVollstaendig(eingabeTippen(eingabeStart(ALLE), '6'), 'ph')).toBe(false);
  });
});

describe('G3 Werte als Ganzzahl', () => {
  it('G3 messwerteHundertstel: «6.7» ergibt 670, leeres Feld fehlt', () => {
    const e = tippen(eingabeStart(ALLE), ['6', '7']);
    const w = messwerteHundertstel(e);
    expect(w).toEqual({ ph: 670 });
    expect('ec' in w).toBe(false);
    expect('temperatur' in w).toBe(false);
    // W hat kein pH-Feld: auch ein Text dort zählt nicht
    const ohnePh = { ...eingabeStart(['ec', 'temperatur']), text: { ph: '6.7', ec: '1.41', temperatur: '' } };
    expect(messwerteHundertstel(ohnePh)).toEqual({ ec: 141 });
    expect(Number.isInteger(messwerteHundertstel(ohnePh).ec)).toBe(true);
  });
});
