// Zustellung je Tag in #/push (Plan 31 Schritt 10, A11; UC8-AK8, EK5). Lead-Test zu src/domain/push/zustellung.ts.
import { describe, expect, it } from 'vitest';
import { ek5Anteil, letzteTage, type ZustellungTag } from '../../src/domain/push/zustellung.ts';

function tag(datum: string, teil: Partial<ZustellungTag> = {}): ZustellungTag {
  return {
    datum_lokal: datum,
    soll: `${datum}T06:00:00+00:00`,
    gesendet_am: `${datum}T06:03:00+00:00`,
    verspaetung_min: 3,
    angezeigt_am: `${datum}T06:03:10+00:00`,
    email_gesendet_am: null,
    aufgaben: 4,
    am_faelligkeitstag: 3,
    vor_faelligkeitstag: 0,
    ...teil,
  };
}

describe('Zustellung (EK5)', () => {
  it('EK5 Anteil zählt am_faelligkeitstag nur an Tagen mit angezeigter Push, Nenner alle Aufgaben', () => {
    const tage = [tag('2027-01-08'), tag('2027-01-09', { angezeigt_am: null }), tag('2027-01-10')];
    expect(ek5Anteil(tage)).toEqual({ anteil: 6 / 12, zaehler: 6, nenner: 12 });
  });

  it('R5.6-AK11 EK5 zählt vorgezogene Zeilen als rechtzeitig, nur mit angezeigter Push (Plan 118 A4)', () => {
    // 4 Aufgaben, 3 am Fälligkeitstag, 1 nach R5.6 vorgezogen: 100 %, nicht 75 %
    const angezeigt = tag('2027-01-13', { aufgaben: 4, am_faelligkeitstag: 3, vor_faelligkeitstag: 1 });
    expect(ek5Anteil([angezeigt])).toEqual({ anteil: 1, zaehler: 4, nenner: 4 });
    const nicht = tag('2027-01-14', {
      aufgaben: 4,
      am_faelligkeitstag: 3,
      vor_faelligkeitstag: 1,
      angezeigt_am: null,
    });
    expect(ek5Anteil([angezeigt, nicht])).toEqual({ anteil: 4 / 8, zaehler: 4, nenner: 8 });
    // überfällige Zeile (weder am noch vor dem Fälligkeitstag) bleibt im Nenner ohne Zähler
    expect(
      ek5Anteil([tag('2027-01-15', { aufgaben: 3, am_faelligkeitstag: 1, vor_faelligkeitstag: 1 })]),
    ).toEqual({
      anteil: 2 / 3,
      zaehler: 2,
      nenner: 3,
    });
    // ältere Antwort ohne Spalte (null) zählt wie 0
    expect(ek5Anteil([tag('2027-01-16', { vor_faelligkeitstag: null })])).toEqual({
      anteil: 3 / 4,
      zaehler: 3,
      nenner: 4,
    });
  });

  it('EK5 ohne Aufgaben kein Anteil', () => {
    expect(ek5Anteil([tag('2027-01-08', { aufgaben: 0, am_faelligkeitstag: 0 })])).toBeUndefined();
    expect(ek5Anteil([])).toBeUndefined();
  });

  it('UC8-AK8 letzteTage: neueste zuerst, höchstens 14, ohne Datum entfällt', () => {
    const tage = Array.from({ length: 20 }, (_, i) => tag(`2027-01-${String(i + 1).padStart(2, '0')}`));
    tage.push(tag('x', { datum_lokal: null }));
    const letzte = letzteTage(tage);
    expect(letzte).toHaveLength(14);
    expect(letzte[0]?.datum_lokal).toBe('2027-01-20');
    expect(letzte[13]?.datum_lokal).toBe('2027-01-07');
  });
});
