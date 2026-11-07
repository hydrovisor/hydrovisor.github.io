// «Nach Stromausfall» (Plan 30 Testliste; UC8 Ablauf 8, R5.1, R5.2 letzte Zeilen, R5.4, G2, G5; Abweichung 2 und
// A9, A10 im Plan): Folgeaufgaben an der Anlage und je Gefäss, Grenze 6 h ausschliesslich, Erledigung durch
// «Erledigt» oder die passende Erfassung. Uhr Di 12.1.2027 09:00 Zürich; Fixture tests/unit/rundgang-fixture.ts.
import { describe, expect, it } from 'vitest';
import {
  MORGEN_STROM,
  STROM_GRENZE_STUNDEN,
  STROM_TYPEN,
  stromausfallVorgang,
} from '../../src/domain/aufgaben-stromausfall.ts';
import {
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  nurEcht,
  type Aufgabe,
} from '../../src/domain/aufgaben.ts';
import { aufschubVorgang, erledigtVorgang } from '../../src/domain/aufgaben-aufschub.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  ZONE,
  bereichEreignisDazu,
  jetztAm,
  platzId,
  regal,
  schluessel,
  stromausfallDazu,
  uid,
  vorgangDazu,
  zh,
  type Teile,
} from './rundgang-fixture.ts';
import { kurzpruefungDazu, messungDazu, statusSetzen, fertig } from './aufgaben-fixture.ts';

const STROM = ['strom_pumpen', 'strom_ac10_licht', 'strom_wassertemperatur', 'strom_wurzeln', 'strom_messen'];
const istStrom = (a: Aufgabe) => STROM.includes(a.typ);

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const strom = (l: readonly Aufgabe[]) => l.filter(istStrom);
const codes = (l: readonly Aufgabe[], typ: string) =>
  l
    .filter((a) => a.typ === typ)
    .map((a) => a.ort?.code ?? a.bezug)
    .sort();

/** Gefässe der Anlage R mit Lösung (2.2 ist leer) */
const MIT_LOESUNG = ['R-1.1', 'R-2.1', 'R-3.1', 'R-3.2', 'R-3.3', 'R-4.4', 'R-4.5'];

/** Regal mit einem Stromausfall in Anlage R von `beginn` bis `ende` (Ortszeit Zürich) */
function mitAusfall(beginn: [string, string], ende: [string, string], o: { anlage?: 'R' | 'X' } = {}): Teile {
  const t = regal();
  stromausfallDazu(t, { beginn: zh(...beginn), ende: zh(...ende), ...o });
  return fertig(t);
}

/** 8 h: 11.1. 23:00 bis 12.1. 07:00 */
const ACHT_STUNDEN = () => mitAusfall(['2027-01-11', '23:00'], ['2027-01-12', '07:00']);

describe('Nach Stromausfall', () => {
  it('R5.2 Nach Stromausfall fällig: Pumpen und AC10/Licht an der Anlage, Wassertemperatur je Gefäss mit Lösung am Tag des Endes', () => {
    const l = faellig(ACHT_STUNDEN());
    for (const typ of ['strom_pumpen', 'strom_ac10_licht']) {
      const an = l.filter((a) => a.typ === typ);
      expect(an, typ).toHaveLength(1);
      expect(an[0]).toMatchObject({
        schluessel: schluessel(typ, ANLAGE.R, '2027-01-12'),
        bezug: ANLAGE.R,
        bezugArt: 'anlage',
        faelligAm: '2027-01-12',
        anlageId: ANLAGE.R,
        datenart: 'echt',
      });
      expect(an[0]?.ort).toBeUndefined();
    }
    expect(l.find((a) => a.typ === 'strom_pumpen')?.titel).toBe('Pumpen prüfen nach Stromausfall');
    expect(l.find((a) => a.typ === 'strom_ac10_licht')?.titel).toBe('AC10-Zeitplan und Licht prüfen');

    const wasser = l.filter((a) => a.typ === 'strom_wassertemperatur');
    expect(wasser.map((a) => a.ort?.code).sort()).toEqual(MIT_LOESUNG);
    for (const a of wasser) {
      expect(a).toMatchObject({
        bezugArt: 'platz',
        faelligAm: '2027-01-12',
        titel: 'Wassertemperatur messen',
      });
      expect(a.schluessel).toBe(schluessel('strom_wassertemperatur', a.bezug, '2027-01-12'));
    }
    // leeres Gefäss 2.2 und Anlage X ohne Folgeaufgabe
    expect(strom(l).some((a) => a.ort?.code === 'R-2.2' || a.anlageId === ANLAGE.X)).toBe(false);
  });

  it('R5.2 Nach Stromausfall fällig am Kalendertag des Endes in Zürich: Ende 11.1. 23:30 → 11.1., Ende 12.1. 00:30 → 12.1.', () => {
    const vorMitternacht = mitAusfall(['2027-01-11', '20:00'], ['2027-01-11', '23:30']);
    const pumpenGestern = faellig(vorMitternacht).find((a) => a.typ === 'strom_pumpen');
    expect(pumpenGestern).toMatchObject({ faelligAm: '2027-01-11', tageUeberfaellig: 1 });
    const nachMitternacht = mitAusfall(['2027-01-11', '20:00'], ['2027-01-12', '00:30']);
    expect(faellig(nachMitternacht).find((a) => a.typ === 'strom_pumpen')?.faelligAm).toBe('2027-01-12');
  });

  it('R5.2 Nach Stromausfall DWC über 6 h: am Folgetag Wurzeln und Messung; genau 6:00 h ohne Folgetag', () => {
    expect(STROM_GRENZE_STUNDEN).toBe(6);
    const ueber = ACHT_STUNDEN();
    // heute noch nicht fällig, aber am Folgetag (13.1.) für 1.1 DWC
    expect(codes(faellig(ueber), 'strom_wurzeln')).toEqual([]);
    for (const typ of ['strom_wurzeln', 'strom_messen']) {
      const a = alle(ueber).filter((x) => x.typ === typ);
      expect(
        a.map((x) => x.ort?.code),
        typ,
      ).toEqual(['R-1.1']);
      expect(a[0]?.faelligAm).toBe('2027-01-13');
      expect(a[0]?.schluessel).toBe(schluessel(typ, platzId('R-1.1'), '2027-01-13'));
    }
    expect(codes(faellig(ueber, jetztAm('2027-01-13')), 'strom_wurzeln')).toEqual(['R-1.1']);
    expect(codes(faellig(ueber, jetztAm('2027-01-13')), 'strom_messen')).toEqual(['R-1.1']);
    expect(alle(ueber).find((a) => a.typ === 'strom_wurzeln')?.titel).toBe(
      'Wurzeln prüfen nach Stromausfall',
    );
    expect(alle(ueber).find((a) => a.typ === 'strom_messen')?.titel).toBe('Messen nach Stromausfall');

    // Grenze ausschliesslich: 6:00 h nichts, 6:01 h Folgetag
    const genau = mitAusfall(['2027-01-12', '01:00'], ['2027-01-12', '07:00']);
    expect(codes(alle(genau), 'strom_wurzeln')).toEqual([]);
    expect(codes(alle(genau), 'strom_messen')).toEqual([]);
    expect(codes(faellig(genau), 'strom_wassertemperatur')).toEqual(MIT_LOESUNG);
    const knapp = mitAusfall(['2027-01-12', '00:59'], ['2027-01-12', '07:00']);
    expect(codes(alle(knapp), 'strom_wurzeln')).toEqual(['R-1.1']);
    expect(codes(alle(knapp), 'strom_messen')).toEqual(['R-1.1']);
  });

  it('R5.2 Nach Stromausfall Kratky über 6 h ohne Folgetag-Aufgaben', () => {
    const l = alle(ACHT_STUNDEN());
    for (const typ of ['strom_wurzeln', 'strom_messen'])
      for (const code of ['R-3.1', 'R-3.2', 'R-3.3', 'R-2.1', 'R-4.4', 'R-4.5'])
        expect(
          l.some((a) => a.typ === typ && a.ort?.code === code),
          `${typ} ${code}`,
        ).toBe(false);
    // die Wassertemperatur gilt auch für Kratky
    expect(codes(faellig(ACHT_STUNDEN()), 'strom_wassertemperatur')).toEqual(
      expect.arrayContaining(['R-3.1', 'R-3.2', 'R-3.3']),
    );
  });

  it('R5.2 Nach Stromausfall nicht bei Füllzustand leer und nicht bei ruht (R5.4)', () => {
    const t = regal();
    statusSetzen(t, 'R-1.1', 'ruht');
    statusSetzen(t, 'R-3.3', 'ruht');
    stromausfallDazu(t, { beginn: zh('2027-01-11', '23:00'), ende: zh('2027-01-12', '07:00') });
    const l = alle(fertig(t));
    expect(codes(l, 'strom_wassertemperatur')).toEqual(['R-2.1', 'R-3.1', 'R-3.2', 'R-4.4', 'R-4.5']);
    // 1.1 ruht: kein Folgetag; 2.2 leer: nichts
    expect(codes(l, 'strom_wurzeln')).toEqual([]);
    expect(codes(l, 'strom_messen')).toEqual([]);
    expect(strom(l).some((a) => a.ort?.code === 'R-2.2')).toBe(false);
    // an der Anlage bleiben Pumpen und AC10/Licht
    expect(codes(l, 'strom_pumpen')).toEqual([ANLAGE.R]);

    // Gegenprobe ohne Ruhe: 1.1 mit Folgetag
    expect(codes(alle(ACHT_STUNDEN()), 'strom_wurzeln')).toEqual(['R-1.1']);
  });

  it('R5.2 Nach Stromausfall erledigt durch «Erledigt» (aufgabe_erledigt mit Schlüssel, anlage_id bzw. platz_id)', () => {
    const t = ACHT_STUNDEN();
    const l = faellig(t);
    const pumpen = l.find((a) => a.typ === 'strom_pumpen') as Aufgabe;
    const wasser11 = l.find((a) => a.typ === 'strom_wassertemperatur' && a.ort?.code === 'R-1.1') as Aufgabe;
    for (const a of strom(l)) expect(a.erledigtKnopf, a.schluessel).toBe(true);

    const anAnlage = erledigtVorgang(pumpen, uid('f1', 'erledigt-pumpen'), jetztAm(HEUTE, '10:00'));
    expect(anAnlage).toHaveLength(1);
    expect(anAnlage[0]).toMatchObject({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: uid('f1', 'erledigt-pumpen'),
        typ: 'aufgabe_erledigt',
        anlage_id: ANLAGE.R,
        aufgabe_schluessel: pumpen.schluessel,
        war_faellig_am: '2027-01-12',
        daten: { aufgabe_schluessel: pumpen.schluessel },
      },
    });
    const felder = (anAnlage[0] as { felder: Record<string, unknown> }).felder;
    expect(felder['platz_id'] ?? null).toBeNull();
    expect(vorgangPruefen(anAnlage)).toEqual([]);

    const amPlatz = erledigtVorgang(wasser11, uid('f1', 'erledigt-wasser'), jetztAm(HEUTE, '10:00'));
    expect(amPlatz[0]).toMatchObject({
      felder: {
        typ: 'aufgabe_erledigt',
        platz_id: platzId('R-1.1'),
        aufgabe_schluessel: wasser11.schluessel,
      },
    });

    vorgangDazu(t, [...anAnlage, ...amPlatz]);
    const nachher = faellig(t, jetztAm(HEUTE, '10:05'));
    expect(nachher.some((a) => a.schluessel === pumpen.schluessel)).toBe(false);
    expect(nachher.some((a) => a.schluessel === wasser11.schluessel)).toBe(false);
    // die übrigen bleiben
    expect(codes(nachher, 'strom_ac10_licht')).toEqual([ANLAGE.R]);
    expect(codes(nachher, 'strom_wassertemperatur')).toEqual(MIT_LOESUNG.filter((c) => c !== 'R-1.1'));
  });

  it('R5.2 Nach Stromausfall erledigt durch passende Erfassung: Messung mit Temperatur, Kurzprüfung wurzeln, Sammel-Tipp licht und pumpe', () => {
    const t = ACHT_STUNDEN();
    // Messung mit Temperatur in 1.1 heute erledigt nur die Wassertemperatur von 1.1
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-12', '10:00'), temperatur: 19.5 });
    // Messung in 2.1 vor dem Fälligkeitstag zählt nicht
    messungDazu(t, 'R-2.1', { gilt: zh('2027-01-11', '20:00'), temperatur: 19.5 });
    fertig(t);
    const nachMessung = faellig(t, jetztAm(HEUTE, '10:05'));
    expect(codes(nachMessung, 'strom_wassertemperatur')).toEqual(MIT_LOESUNG.filter((c) => c !== 'R-1.1'));

    // Sammel-Tipp licht: erst mit allen Bereichen der Anlage erledigt
    for (const ebene of [1, 2, 3]) bereichEreignisDazu(t, ebene, 'licht', zh('2027-01-12', '10:10'));
    fertig(t);
    expect(codes(faellig(t, jetztAm(HEUTE, '10:15')), 'strom_ac10_licht')).toEqual([ANLAGE.R]);
    bereichEreignisDazu(t, 4, 'licht', zh('2027-01-12', '10:12'));
    fertig(t);
    expect(codes(faellig(t, jetztAm(HEUTE, '10:15')), 'strom_ac10_licht')).toEqual([]);

    // Kurzprüfung pumpe: erst mit allen Gefässen mit Luftpumpe erledigt
    const mitPumpe = ['R-1.1', 'R-2.1', 'R-2.2', 'R-3.1', 'R-3.2', 'R-4.4', 'R-4.5'];
    for (const code of mitPumpe.filter((c) => c !== 'R-4.5'))
      kurzpruefungDazu(t, code, zh('2027-01-12', '10:20'), 'pumpe');
    fertig(t);
    expect(codes(faellig(t, jetztAm(HEUTE, '10:25')), 'strom_pumpen')).toEqual([ANLAGE.R]);
    kurzpruefungDazu(t, 'R-4.5', zh('2027-01-12', '10:21'), 'pumpe');
    fertig(t);
    expect(codes(faellig(t, jetztAm(HEUTE, '10:25')), 'strom_pumpen')).toEqual([]);

    // Folgetag: jede Messung erledigt strom_messen, Kurzprüfung wurzeln erledigt strom_wurzeln
    const morgen = jetztAm('2027-01-13', '10:00');
    expect(codes(faellig(t, morgen), 'strom_messen')).toEqual(['R-1.1']);
    expect(codes(faellig(t, morgen), 'strom_wurzeln')).toEqual(['R-1.1']);
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-13', '08:00') });
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-13', '08:05'), 'wurzeln');
    fertig(t);
    expect(codes(faellig(t, morgen), 'strom_messen')).toEqual([]);
    expect(codes(faellig(t, morgen), 'strom_wurzeln')).toEqual([]);
  });

  it('R5.2 Nach Stromausfall «Morgen» nie erlaubt; Gewicht ausserhalb', () => {
    expect([...STROM_TYPEN].sort()).toEqual([...STROM].sort());
    expect(MORGEN_STROM).toEqual({
      strom_pumpen: 'nein',
      strom_ac10_licht: 'nein',
      strom_wassertemperatur: 'nein',
      strom_wurzeln: 'nein',
      strom_messen: 'nein',
    });
    const t = ACHT_STUNDEN();
    const l = strom(alle(t));
    expect(new Set(l.map((a) => a.typ))).toEqual(new Set(STROM));
    for (const a of l) {
      expect(a.morgen.erlaubt, a.schluessel).toBe(false);
      expect(a.gewicht, a.schluessel).toBe('ausserhalb');
      expect(a.ueberspringen, a.schluessel).toBe(false);
      expect(a.pegelOk, a.schluessel).toBe(false);
      expect(aufschubVorgang(a, 'morgen', uid('f2', a.schluessel), JETZT, ZONE)).toEqual([]);
    }
  });

  it('R5.2 Nach Stromausfall storniertes Ereignis erzeugt nichts', () => {
    const t = regal();
    stromausfallDazu(t, {
      beginn: zh('2027-01-11', '23:00'),
      ende: zh('2027-01-12', '07:00'),
      storniert: true,
    });
    expect(strom(alle(fertig(t)))).toEqual([]);
    // ohne Stromausfall ebenfalls nichts
    expect(strom(alle(regal()))).toEqual([]);
  });

  it('G2 Nach Stromausfall Ende 28.3.2027 01:30 bis 04:00 Zürich (Sommerzeit): Dauer 1:30 h, Fälligkeit 28.3.', () => {
    const t = mitAusfall(['2027-03-28', '01:30'], ['2027-03-28', '04:00']);
    const tag = jetztAm('2027-03-28', '09:00');
    expect(codes(faellig(t, tag), 'strom_pumpen')).toEqual([ANLAGE.R]);
    expect(faellig(t, tag).find((a) => a.typ === 'strom_pumpen')?.faelligAm).toBe('2027-03-28');
    expect(codes(alle(t, tag), 'strom_wurzeln')).toEqual([]);

    // Uhrzeit springt um 02:00 auf 03:00: 27.3. 23:30 bis 28.3. 06:00 sind 5:30 h (nicht 6:30 h) → kein Folgetag
    const wand = mitAusfall(['2027-03-27', '23:30'], ['2027-03-28', '06:00']);
    expect(codes(alle(wand, tag), 'strom_wurzeln')).toEqual([]);
    // 27.3. 22:59 bis 28.3. 06:00 sind 6:01 h → Folgetag 29.3.
    const lang = mitAusfall(['2027-03-27', '22:59'], ['2027-03-28', '06:00']);
    const wurzeln = alle(lang, tag).filter((a) => a.typ === 'strom_wurzeln');
    expect(wurzeln.map((a) => a.ort?.code)).toEqual(['R-1.1']);
    expect(wurzeln[0]?.faelligAm).toBe('2027-03-29');
  });

  it('G5 Nach Stromausfall Demo-Anlage: Aufgaben mit datenart demo; nurEcht entfernt sie', () => {
    const t = mitAusfall(['2027-01-11', '23:00'], ['2027-01-12', '07:00'], { anlage: 'X' });
    const l = strom(alle(t));
    expect(l.length).toBeGreaterThan(0);
    for (const a of l) {
      expect(a.anlageId, a.schluessel).toBe(ANLAGE.X);
      expect(a.datenart, a.schluessel).toBe('demo');
    }
    expect(codes(l, 'strom_pumpen')).toEqual([ANLAGE.X]);
    expect(codes(l, 'strom_wassertemperatur')).toEqual(['X-1.1']);
    expect(codes(l, 'strom_wurzeln')).toEqual(['X-1.1']);
    expect(strom(nurEcht(alle(t)))).toEqual([]);
  });

  it('R5.1 stromausfallVorgang: Ereignis mit anlage_id, daten {beginn, ende}; Ende vor Beginn oder Beginn in der Zukunft ergibt leeren Vorgang', () => {
    const id = uid('f3', 'strom');
    const beginn = jetztAm(HEUTE, '02:00');
    const v = stromausfallVorgang({ anlageId: ANLAGE.R, beginn, ende: JETZT }, id, JETZT);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'ereignis',
      felder: { client_id: id, typ: 'stromausfall', anlage_id: ANLAGE.R },
    });
    const daten = (v[0] as { felder: { daten: { beginn: string; ende: string } } }).felder.daten;
    expect(Date.parse(daten.beginn)).toBe(beginn.getTime());
    expect(Date.parse(daten.ende)).toBe(JETZT.getTime());
    expect(vorgangPruefen(v)).toEqual([]);

    // in die Teile übernommen: 7 h → Folgeaufgaben heute
    const t = vorgangDazu(regal(), v);
    expect(codes(faellig(t), 'strom_pumpen')).toEqual([ANLAGE.R]);
    expect(codes(alle(t), 'strom_wurzeln')).toEqual(['R-1.1']);

    // Ende vor Beginn
    expect(
      stromausfallVorgang({ anlageId: ANLAGE.R, beginn: JETZT, ende: jetztAm(HEUTE, '08:59') }, id, JETZT),
    ).toEqual([]);
    // Beginn in der Zukunft
    expect(
      stromausfallVorgang(
        { anlageId: ANLAGE.R, beginn: jetztAm(HEUTE, '09:01'), ende: jetztAm(HEUTE, '09:30') },
        id,
        JETZT,
      ),
    ).toEqual([]);
    // Gegenprobe: Beginn eine Minute vor jetzt ist erlaubt
    expect(
      stromausfallVorgang({ anlageId: ANLAGE.R, beginn: jetztAm(HEUTE, '08:59'), ende: JETZT }, id, JETZT),
    ).toHaveLength(1);
  });
});
