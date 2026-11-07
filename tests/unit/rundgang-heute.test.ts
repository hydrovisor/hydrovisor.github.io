// Heute-Karten (Plan 30 Testliste; UC8 Ablauf 1 bis 3, R5.1, 05_masken.md 3.1; Übergaben aus I1b-02, Befund 11):
// Ortskarten in Laufweg-Reihenfolge aus faelligeAufgaben(), Hervorhebung «Ausserhalb» ohne Umsortieren, Startzeit
// für UC8-AK9. Uhr Di 12.1.2027 09:00 Zürich; Fixture tests/unit/rundgang-fixture.ts.
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { ausserhalbOrte, heuteKarten, startzeitMedian } from '../../src/domain/rundgang/heute.ts';
import { ANLAGE, JETZT, RUNDGANG_ORTE, ZONE, platzId, regal, zh, type Teile } from './rundgang-fixture.ts';
import { fertig, messungDazu } from './aufgaben-fixture.ts';

const faellig = (t: Teile) => faelligeAufgaben(t, einstellungenAus(t), JETZT, ZONE);
const nurR = (l: readonly Aufgabe[]) => l.filter((a) => a.anlageId === ANLAGE.R);

describe('Heute-Karten', () => {
  it('UC8 Ortskarten in Laufweg-Reihenfolge, Anzuchtorte zuerst; «Ausserhalb» oben ohne Umsortieren', () => {
    const t = regal();
    const karten = heuteKarten(t, nurR(faellig(t)));
    expect(karten.map((k) => k.code)).toEqual(RUNDGANG_ORTE);
    expect(karten.map((k) => k.platzId)).toEqual(RUNDGANG_ORTE.map((c) => platzId(c)));
    expect(karten.every((k) => !k.ausserhalb)).toBe(true);
    expect(ausserhalbOrte(karten)).toEqual([]);

    // 1.1 und 2.1 mit letzter Messung «Ausserhalb»: Hervorhebung in Kartenreihenfolge, Karten bleiben stehen
    const aus = regal();
    messungDazu(aus, 'R-2.1', { gilt: zh('2027-01-10', '10:00'), ausserhalb: true });
    messungDazu(aus, 'R-1.1', { gilt: zh('2027-01-10', '10:00'), ausserhalb: true });
    fertig(aus);
    const mit = heuteKarten(aus, nurR(faellig(aus)));
    expect(mit.map((k) => k.code)).toEqual(RUNDGANG_ORTE);
    expect(mit.filter((k) => k.ausserhalb).map((k) => k.code)).toEqual(['R-2.1', 'R-1.1']);
    expect(ausserhalbOrte(mit)).toEqual(['R-2.1', 'R-1.1']);

    // ohne Laufweg: Anzuchtorte vor Gefässen, Ebene der Anzuchtorte zuerst, dann 3, 2, 1
    const ohne = regal({ laufweg: null });
    expect(heuteKarten(ohne, nurR(faellig(ohne))).map((k) => k.code)).toEqual([
      'R-A1',
      'R-4.4',
      'R-4.5',
      'R-3.1',
      'R-3.2',
      'R-3.3',
      'R-2.1',
      'R-1.1',
    ]);

    // eigener Laufweg wirkt: 4.5 vor 4.4, 1.1 vor 2.1
    const eigen = regal({ laufweg: ['A1', '4.5', '4.4', '3.3', '3.2', '3.1', '1.1', '2.1'] });
    expect(heuteKarten(eigen, nurR(faellig(eigen))).map((k) => k.code)).toEqual([
      'R-A1',
      'R-4.5',
      'R-4.4',
      'R-3.3',
      'R-3.2',
      'R-3.1',
      'R-1.1',
      'R-2.1',
    ]);
  });

  it('UC8 Ortskarte trägt die Satzaufgaben am Anzuchtort des Satzes (Befund 11)', () => {
    const t = regal();
    const aufgaben = nurR(faellig(t));
    const satz = aufgaben.filter((a) => a.bezugArt === 'satz' && a.typ !== 'umsetzen');
    expect(satz.map((a) => a.typ)).toContain('keimung_pruefen');
    const a1 = heuteKarten(t, aufgaben).find((k) => k.code === 'R-A1');
    expect(a1).toBeDefined();
    const schluessel = new Set(a1?.aufgaben.map((a) => a.schluessel));
    for (const a of satz) expect(schluessel.has(a.schluessel), a.schluessel).toBe(true);
    expect(a1?.aufgaben.map((a) => a.typ)).toEqual(
      expect.arrayContaining(['wuerfel_feucht', 'keimung_pruefen']),
    );
    // Aufgaben einer Karte gehören zu ihrem Ort, jede genau einmal
    const alle = heuteKarten(t, aufgaben).flatMap((k) => k.aufgaben.map((a) => a.schluessel));
    expect(new Set(alle).size).toBe(alle.length);
    for (const k of heuteKarten(t, aufgaben))
      for (const a of k.aufgaben) expect(a.ort?.platzId, a.schluessel).toBe(k.platzId);
  });

  it('UC8 Aufgaben ohne Ort (Messgerät) und Umsetzen stehen in keiner Karte', () => {
    const t = regal();
    const aufgaben = nurR(faellig(t));
    // Vorbedingung: beide gibt es am 12.1.
    expect(aufgaben.some((a) => a.typ === 'ph_kontrolle' && a.bezugArt === 'messgeraet')).toBe(true);
    expect(aufgaben.some((a) => a.typ === 'umsetzen')).toBe(true);
    const inKarten = heuteKarten(t, aufgaben).flatMap((k) => k.aufgaben);
    expect(inKarten.some((a) => a.bezugArt === 'messgeraet')).toBe(false);
    expect(inKarten.some((a) => a.typ === 'umsetzen')).toBe(false);
    // alle übrigen Aufgaben der Anlage stehen in einer Karte
    const uebrige = aufgaben.filter((a) => a.bezugArt !== 'messgeraet' && a.typ !== 'umsetzen');
    expect(inKarten.map((a) => a.schluessel).sort()).toEqual(uebrige.map((a) => a.schluessel).sort());
  });

  it('UC8-AK9 startzeitMedian aus 5 Werten; weniger als 5 Werte ergeben den Median der vorhandenen', () => {
    expect(startzeitMedian([900, 1200, 700, 1000, 800])).toBe(900);
    expect(startzeitMedian([2100, 400, 900])).toBe(900);
    expect(startzeitMedian([1200, 700])).toBe(950);
    expect(startzeitMedian([1500])).toBe(1500);
    expect(startzeitMedian([])).toBeUndefined();
  });
});
