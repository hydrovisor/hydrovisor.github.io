// UX7 (Issue #229): «vorher» in der Messmaske übernehmen. Reine Funktion im Eingabemodul, Rechnung in Hundertsteln.
import { describe, expect, it } from 'vitest';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  messwerteHundertstel,
  vorherUebernehmen,
  type Groesse,
} from '../../src/domain/messung/eingabe.ts';

const ALLE: readonly Groesse[] = ['ph', 'ec', 'temperatur'];

describe('UX7-AK1 «vorher» übernehmen', () => {
  it('UX7-AK1 setzt das aktive, leere Feld auf den Vorwert und aktiviert das nächste', () => {
    const e = vorherUebernehmen(eingabeStart(ALLE), 'ph', 610);
    expect(e.text.ph).toBe('6.1');
    expect(e.aktiv).toBe('ec');
    const e2 = vorherUebernehmen(e, 'ec', 142);
    expect(e2.text.ec).toBe('1.42');
    expect(e2.aktiv).toBe('temperatur');
    const e3 = vorherUebernehmen(e2, 'temperatur', 1970);
    expect(e3.text.temperatur).toBe('19.7');
    // letztes Feld bleibt aktiv
    expect(e3.aktiv).toBe('temperatur');
    expect(messwerteHundertstel(e3)).toEqual({ ph: 610, ec: 142, temperatur: 1970 });
  });

  it('UX7-AK1 rundet auf die Dezimalen des Felds (pH 6.05 → 6.1, °C 19.74 → 19.7)', () => {
    expect(vorherUebernehmen(eingabeStart(ALLE), 'ph', 605).text.ph).toBe('6.1');
    const temp = feldWaehlen(eingabeStart(ALLE), 'temperatur');
    expect(vorherUebernehmen(temp, 'temperatur', 1974).text.temperatur).toBe('19.7');
  });

  it('UX7-AK1 ohne Vorwert gibt es keine Übernahme', () => {
    const start = eingabeStart(ALLE);
    expect(vorherUebernehmen(start, 'ph', undefined)).toBe(start);
    expect(vorherUebernehmen(start, 'ph', Number.NaN)).toBe(start);
  });

  it('UX7-AK1 nur im aktiven Feld und nur, solange es leer ist', () => {
    const start = eingabeStart(ALLE);
    // anderes Feld als das aktive
    expect(vorherUebernehmen(start, 'ec', 142)).toBe(start);
    // schon getippt: der Tipp auf das Feld überschreibt nichts
    const getippt = eingabeTippen(start, '6');
    expect(vorherUebernehmen(getippt, 'ph', 610)).toBe(getippt);
  });

  it('UX7-AK1 Vorwert ausserhalb der Feldgrenzen wird nicht übernommen', () => {
    const start = eingabeStart(ALLE);
    expect(vorherUebernehmen(start, 'ph', 1500)).toBe(start);
    expect(vorherUebernehmen(feldWaehlen(start, 'ec'), 'ec', 1200)).toEqual(feldWaehlen(start, 'ec'));
  });

  it('UX7-AK1 der übernommene Wert bleibt mit ± änderbar', () => {
    const e = vorherUebernehmen(feldWaehlen(eingabeStart(ALLE), 'temperatur'), 'temperatur', 1970);
    expect(eingabeTippen(e, 'plus').text.temperatur).toBe('19.8');
  });
});
