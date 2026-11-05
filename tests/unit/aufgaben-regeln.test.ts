// Auslöser-Matrix R5.2 Stufe 1 (Plan 27 Tabelle «R5.2 nach Stufen», 06_tests.md Abschnitt 6): je Zeile ein Fall
// «fällig» und ein Fall «nicht fällig», Grenzen beidseitig. Injizierte Uhr (Standard Di 12.1.2027 09:00 Zürich),
// Zeitzone Europe/Zurich, Fixture tests/unit/aufgaben-fixture.ts. Vertrag im Kopf von aufgaben-schluessel.test.ts.
//
// Zusätzlich festgelegt (A, wo die Plantabelle offen ist):
// - Belüftung prüfen: fällig am Kalendertag der Kurzprüfung mit Abweichung (pumpe oder luftzone, ok = false); der Platz
//   der Abweichung ohne hinweis, die übrigen Gefässe derselben Luftpumpe mit hinweis 'mitmarkiert'; erledigt für alle,
//   sobald am Platz der Abweichung eine spätere Kurzprüfung desselben Punkts ok ist.
// - Wärme prüfen: fällig am Folgetag der letzten Messung des Orts mit temperatur > 24.0; erledigt durch eine spätere
//   Messung.
// - Lösung wechseln bei Nachfüllsumme ≥ Betriebsvolumen: faelligAm = min(regulärer Termin, heute).
// - Ansatz für Umsetzen: Reservierungen auf Netztöpfe mit heim_platz_id = Platz.
// - Würfel feucht: aktive Pflanzung an der Box = v_pflanzung_zustand.status 'aktiv' und platz_id = Box, oder platz_id
//   null bei einem Satz mit anzuchtort_platz_id = Box (ohne Ortsereignis steht die Pflanzung am Anzuchtort).
// - pH-Kontrolle ohne echte Kalibrierung und ohne echte Kontrolle: keine Aufgabe (zuerst Erstkalibrierung).
// - Titel der Satzaufgaben mit Sorte: 'Keimung prüfen · Lollo Rossa', 'Umsetzen · Lollo Rossa',
//   'Reservierung prüfen · Lollo Rossa', 'Abdeckung entfernen · Koriander'.
import { describe, expect, it } from 'vitest';
import {
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  type Aufgabe,
  type AufgabenEinstellungen,
} from '../../src/domain/aufgaben.ts';
import {
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  ansatzDazu,
  boxDazu,
  erledigtDazu,
  fertig,
  gefaessDazu,
  geraetEreignisDazu,
  jetztAm,
  kalibrierungDazu,
  keimungDazu,
  kurzpruefungDazu,
  leer,
  messungDazu,
  netztopfDazu,
  pflanzEreignisDazu,
  phKontrolleDazu,
  platzEreignisDazu,
  platzId,
  reservierungDazu,
  satzDazu,
  satzId,
  schluessel,
  statusSetzen,
  umsetzenDazu,
  verschiebenDazu,
  von,
  zh,
  type GefaessVorgabe,
  type Teile,
} from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT, e?: AufgabenEinstellungen) =>
  faelligeAufgaben(t, e ?? einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT, e?: AufgabenEinstellungen) =>
  alleAufgaben(t, e ?? einstellungenAus(t), jetzt, ZONE);
const schluesselVon = (l: readonly Aufgabe[]) => l.map((a) => a.schluessel);
/** Schlüssel der Aufgaben eines Typs an einem Platz (Code) oder Bezug */
const an = (l: readonly Aufgabe[], typ: string, bezug: string) =>
  schluesselVon(von(l, typ, bezug.startsWith('R-') || bezug.startsWith('X-') ? platzId(bezug) : bezug));

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

/** Gefäss mit Lösung: Neuansatz am Tag `begonnen` 09:00 Zürich */
function mitLoesung(t: Teile, g: GefaessVorgabe, begonnen = '2027-01-02'): Teile {
  gefaessDazu(t, g);
  ansatzDazu(t, g.code, { begonnen: zh(begonnen) });
  return t;
}

describe('R5.2 Gefäss prüfen', () => {
  it('R5.2 Gefäss prüfen fällig: in Prüfung seit dem Erfassen, Schlüssel am Tag des Ankers', () => {
    const t = leer();
    gefaessDazu(t, {
      code: 'R-2.2',
      betriebsart: 'dwc',
      status: 'in_pruefung',
      erfasst: zh('2027-01-08', '11:00'),
    });
    fertig(t);
    const a = einzig(von(faellig(t), 'gefaess_pruefen', platzId('R-2.2')), 'Gefäss prüfen');
    expect(a).toMatchObject({
      schluessel: schluessel('gefaess_pruefen', platzId('R-2.2'), '2027-01-08'),
      titel: 'Gefäss prüfen',
      faelligAm: '2027-01-08',
      tageUeberfaellig: 4,
      gewicht: 'routine',
    });
    expect(a.morgen.erlaubt).toBe(true);
  });

  it('R5.2 Gefäss prüfen nicht fällig: nach Schritt 3 (in Betrieb, Volumen offen) und in Betrieb', () => {
    for (const status of ['in_betrieb_volumen_offen', 'in_betrieb'] as const) {
      const t = leer();
      gefaessDazu(t, { code: 'R-2.2', betriebsart: 'dwc', status: 'in_pruefung', erfasst: zh('2027-01-08') });
      statusSetzen(t, 'R-2.2', status);
      fertig(t);
      expect(von(alle(t), 'gefaess_pruefen')).toEqual([]);
    }
  });
});

describe('R5.2 Messen und nachfüllen, Messen', () => {
  it('R5.2 Messen und nachfüllen fällig: DWC, Konstantpegel und Station, letzte Messung vor 2 Tagen', () => {
    const t = leer();
    mitLoesung(t, { code: 'R-1.1', betriebsart: 'dwc' });
    mitLoesung(t, { code: 'R-4.1', betriebsart: 'konstantpegel' });
    mitLoesung(t, { code: 'R-4.4', betriebsart: 'konstantpegel', festeDosis: true, volumenL: 2.3 });
    for (const code of ['R-1.1', 'R-4.1', 'R-4.4']) messungDazu(t, code, { gilt: zh('2027-01-10', '18:00') });
    fertig(t);
    const l = faellig(t);
    for (const code of ['R-1.1', 'R-4.1', 'R-4.4']) {
      expect(an(l, 'messen_nachfuellen', code)).toEqual([
        schluessel('messen_nachfuellen', platzId(code), HEUTE),
      ]);
      expect(an(l, 'messen', code)).toEqual([]);
    }
    expect(einzig(von(l, 'messen_nachfuellen', platzId('R-1.1')), '1.1').titel).toBe('Messen und nachfüllen');
  });

  it('R5.2 Messen und nachfüllen nicht fällig: Messung gestern → fällig morgen', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' });
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-11', '07:00') });
    fertig(t);
    expect(von(faellig(t), 'messen_nachfuellen')).toEqual([]);
    expect(an(alle(t), 'messen_nachfuellen', 'R-1.1')).toEqual([
      schluessel('messen_nachfuellen', platzId('R-1.1'), '2027-01-13'),
    ]);
  });

  it('R5.2 Messen und nachfüllen: der letzte Neuansatz zählt als Messgrundlage (A2)', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' });
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-03') });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-11') });
    fertig(t);
    expect(von(faellig(t), 'messen_nachfuellen')).toEqual([]);
    expect(an(alle(t), 'messen_nachfuellen', 'R-1.1')).toEqual([
      schluessel('messen_nachfuellen', platzId('R-1.1'), '2027-01-13'),
    ]);
  });

  it('R5.2 Messen (Kratky) fällig: letzte Messung vor 7 Tagen', () => {
    const t = mitLoesung(
      leer(),
      { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' },
      '2026-12-28',
    );
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-05'), fuellstand: 'ueber_drittel' });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen', platzId('R-3.1')), 'Messen 3.1');
    expect(a).toMatchObject({ schluessel: schluessel('messen', platzId('R-3.1'), HEUTE), titel: 'Messen' });
    expect(a.hinweis).toBeUndefined();
    expect(von(alle(t), 'messen_nachfuellen')).toEqual([]);
  });

  it('R5.2 Messen (Kratky) nicht fällig: letzte Messung vor 6 Tagen', () => {
    const t = mitLoesung(
      leer(),
      { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' },
      '2026-12-28',
    );
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-06'), fuellstand: 'ueber_drittel' });
    fertig(t);
    expect(von(faellig(t), 'messen')).toEqual([]);
    expect(an(alle(t), 'messen', 'R-3.1')).toEqual([schluessel('messen', platzId('R-3.1'), '2027-01-13')]);
  });

  it('R5.2 Messen Hinweis «zuerst umrühren» nur bei Kratky ohne Pumpe', () => {
    const t = leer();
    mitLoesung(t, { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' }, '2026-12-28');
    mitLoesung(t, { code: 'R-3.3', betriebsart: 'kratky' }, '2026-12-28');
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-05'), fuellstand: 'ueber_drittel' });
    messungDazu(t, 'R-3.3', { gilt: zh('2027-01-05'), fuellstand: 'ueber_drittel' });
    fertig(t);
    const l = faellig(t);
    expect(einzig(von(l, 'messen', platzId('R-3.3')), '3.3').hinweis).toBe('zuerst umrühren');
    expect(einzig(von(l, 'messen', platzId('R-3.1')), '3.1').hinweis).toBeUndefined();
  });
});

describe('R5.2 Nachfüllen Kratky', () => {
  const kratky = () =>
    mitLoesung(leer(), { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' }, '2026-12-28');

  it('R5.2 Nachfüllen Kratky fällig: Messung heute mit «unter ⅓»', () => {
    const t = kratky();
    messungDazu(t, 'R-3.1', { gilt: zh(HEUTE, '08:00'), fuellstand: 'unter_drittel' });
    fertig(t);
    const a = einzig(von(faellig(t), 'nachfuellen_kratky', platzId('R-3.1')), 'Nachfüllen 3.1');
    expect(a).toMatchObject({
      schluessel: schluessel('nachfuellen_kratky', platzId('R-3.1'), HEUTE),
      titel: 'Nachfüllen Kratky',
    });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Nachfüllen Kratky nicht fällig: Messung heute mit «über ⅓» (UC7-AK8)', () => {
    const t = kratky();
    messungDazu(t, 'R-3.1', { gilt: zh(HEUTE, '08:00'), fuellstand: 'ueber_drittel' });
    fertig(t);
    expect(von(alle(t), 'nachfuellen_kratky')).toEqual([]);
  });

  it('R5.2 Nachfüllen Kratky nicht fällig: «unter ⅓» mit Ansatz nachfuellen danach', () => {
    const t = kratky();
    messungDazu(t, 'R-3.1', { gilt: zh(HEUTE, '08:00'), fuellstand: 'unter_drittel' });
    ansatzDazu(t, 'R-3.1', { begonnen: zh(HEUTE, '08:20'), typ: 'nachfuellen', nachgefuelltL: 3 });
    fertig(t);
    expect(von(alle(t, jetztAm(HEUTE, '08:30')), 'nachfuellen_kratky')).toEqual([]);
  });
});

describe('R5.2 Lösung wechseln', () => {
  it('R5.2 Lösung wechseln fällig: letzter Neuansatz + 14', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2026-12-29');
    fertig(t);
    const a = einzig(von(faellig(t), 'loesung_wechseln', platzId('R-1.1')), 'Wechsel 1.1');
    expect(a).toMatchObject({
      schluessel: schluessel('loesung_wechseln', platzId('R-1.1'), HEUTE),
      titel: 'Lösung wechseln',
      gewicht: 'wechsel',
    });
  });

  it('R5.2 Lösung wechseln nicht fällig: letzter Neuansatz + 13', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2026-12-30');
    fertig(t);
    expect(von(faellig(t), 'loesung_wechseln')).toEqual([]);
    expect(an(alle(t), 'loesung_wechseln', 'R-1.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-13'),
    ]);
  });

  it('R5.2 Lösung wechseln: abgebrochener Neuansatz zählt nicht', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2026-12-29');
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-05'), status: 'abgebrochen' });
    fertig(t);
    expect(an(faellig(t), 'loesung_wechseln', 'R-1.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), HEUTE),
    ]);
  });

  it('R5.2 Lösung wechseln fällig: Nachfüllsumme ≥ Betriebsvolumen (9 l), heute', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc', volumenL: 9 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-05'), typ: 'nachfuellen', nachgefuelltL: 5 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-08'), typ: 'nachfuellen', nachgefuelltL: 4 });
    fertig(t);
    expect(an(faellig(t), 'loesung_wechseln', 'R-1.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), HEUTE),
    ]);
  });

  it('R5.2 Lösung wechseln nicht fällig: Nachfüllsumme 8.5 l unter dem Betriebsvolumen 9 l', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc', volumenL: 9 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-05'), typ: 'nachfuellen', nachgefuelltL: 5 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-08'), typ: 'nachfuellen', nachgefuelltL: 3.5 });
    fertig(t);
    expect(von(faellig(t), 'loesung_wechseln')).toEqual([]);
    expect(an(alle(t), 'loesung_wechseln', 'R-1.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-16'),
    ]);
  });

  it('R5.2 Lösung wechseln: naechster_wechsel_am nach dem Neuansatz gilt einmalig (Neuansatz + 10)', () => {
    const t = mitLoesung(leer(), {
      code: 'R-2.1',
      betriebsart: 'konstantpegel',
      volumenL: 3,
      naechsterWechselAm: '2027-01-12',
    });
    fertig(t);
    expect(an(faellig(t), 'loesung_wechseln', 'R-2.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-2.1'), '2027-01-12'),
    ]);
    // nach dem Wechsel gilt wieder das Intervall: 12.1. + 14
    ansatzDazu(t, 'R-2.1', { begonnen: zh(HEUTE, '08:00') });
    fertig(t);
    expect(von(faellig(t), 'loesung_wechseln')).toEqual([]);
    expect(an(alle(t), 'loesung_wechseln', 'R-2.1')).toEqual([
      schluessel('loesung_wechseln', platzId('R-2.1'), '2027-01-26'),
    ]);
  });

  it('R5.2 Lösung wechseln: naechster_wechsel_am vor dem Neuansatz oder am selben Tag zählt nicht', () => {
    for (const vorgabe of ['2027-01-01', '2027-01-02']) {
      const t = mitLoesung(leer(), {
        code: 'R-2.1',
        betriebsart: 'konstantpegel',
        volumenL: 3,
        naechsterWechselAm: vorgabe,
      });
      fertig(t);
      expect(an(alle(t), 'loesung_wechseln', 'R-2.1')).toEqual([
        schluessel('loesung_wechseln', platzId('R-2.1'), '2027-01-16'),
      ]);
    }
  });

  it('R5.2 Lösung wechseln nicht bei Kratky (kein Wechselintervall)', () => {
    const t = mitLoesung(
      leer(),
      { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' },
      '2026-12-01',
    );
    fertig(t);
    expect(von(alle(t), 'loesung_wechseln')).toEqual([]);
  });
});

describe('R5.2 Ansatz für Umsetzen oder Direktsaat', () => {
  /** 1.2 leer mit Töpfen 1.2.1 und 1.2.2, Satz 5 in A1 mit zwei Schwämmen */
  function leerMitToepfen(): { t: Teile; p: string[] } {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    gefaessDazu(t, { code: 'R-1.2', betriebsart: 'dwc', luftpumpe: 'P1' });
    netztopfDazu(t, 'R-1.2.1');
    netztopfDazu(t, 'R-1.2.2');
    const p = satzDazu(t, { nr: 5, sorte: 'lollo', box: 'R-A1', saat: '2026-12-26' });
    return { t, p };
  }

  it('R5.2 Ansatz fällig: leer mit Reservierung, umsetzen_geplant_am heute', () => {
    const { t, p } = leerMitToepfen();
    reservierungDazu(t, p[0] ?? '', 'R-1.2.1', HEUTE);
    fertig(t);
    const a = einzig(von(faellig(t), 'ansatz', platzId('R-1.2')), 'Ansatz 1.2');
    expect(a).toMatchObject({
      schluessel: schluessel('ansatz', platzId('R-1.2'), HEUTE),
      titel: 'Ansatz für Umsetzen',
      gewicht: 'wechsel',
    });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Ansatz nicht fällig: Umsetzdatum auf morgen verschoben; frühestes Datum aller Reservierungen zählt', () => {
    const { t, p } = leerMitToepfen();
    reservierungDazu(t, p[0] ?? '', 'R-1.2.1', '2027-01-14');
    reservierungDazu(t, p[1] ?? '', 'R-1.2.2', '2027-01-13');
    fertig(t);
    expect(von(faellig(t), 'ansatz')).toEqual([]);
    expect(an(alle(t), 'ansatz', 'R-1.2')).toEqual([schluessel('ansatz', platzId('R-1.2'), '2027-01-13')]);
  });

  it('R5.2 Ansatz nicht fällig: Gefäss mit Lösung oder Reservierung beendet (umgesetzt)', () => {
    const { t, p } = leerMitToepfen();
    reservierungDazu(t, p[0] ?? '', 'R-1.2.1', HEUTE);
    ansatzDazu(t, 'R-1.2', { begonnen: zh(HEUTE, '07:00') });
    fertig(t);
    expect(von(alle(t), 'ansatz')).toEqual([]);

    const zwei = leerMitToepfen();
    reservierungDazu(zwei.t, zwei.p[0] ?? '', 'R-1.2.1', HEUTE);
    umsetzenDazu(zwei.t, zwei.p[0] ?? '', 'R-1.2.1', zh('2027-01-11'));
    fertig(zwei.t);
    expect(von(alle(zwei.t), 'ansatz')).toEqual([]);
  });

  it('R5.2 Ansatz fällig: Direktsaat am Saattag', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-2.3', betriebsart: 'dwc', luftpumpe: 'P2' });
    satzDazu(t, { nr: 6, sorte: 'lollo', direktsaat: 'R-2.3', saat: HEUTE });
    fertig(t);
    const a = einzig(von(faellig(t), 'ansatz', platzId('R-2.3')), 'Ansatz 2.3');
    expect(a).toMatchObject({
      schluessel: schluessel('ansatz', platzId('R-2.3'), HEUTE),
      titel: 'Ansatz für Direktsaat',
      gewicht: 'wechsel',
    });
    // Direktsaat erzeugt kein «Umsetzen»
    expect(von(alle(t), 'umsetzen')).toEqual([]);
  });
});

describe('R5.2 Kurzprüfung', () => {
  const mit11 = () => mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });

  it('R5.2 Kurzprüfung fällig: Ort mit Lösung ohne Kurzprüfung heute; gestern 23:30 zählt nicht', () => {
    const t = mit11();
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-11', '23:30'), 'pumpe');
    fertig(t);
    const a = einzig(von(faellig(t), 'kurzpruefung', platzId('R-1.1')), 'Kurzprüfung 1.1');
    expect(a).toMatchObject({
      schluessel: schluessel('kurzpruefung', platzId('R-1.1'), HEUTE),
      titel: 'Kurzprüfung',
      tageUeberfaellig: 0,
      gewicht: 'routine',
    });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Kurzprüfung nicht fällig: Kurzprüfung heute (00:30 Zürich)', () => {
    const t = mit11();
    kurzpruefungDazu(t, 'R-1.1', zh(HEUTE, '00:30'), 'licht');
    fertig(t);
    expect(von(faellig(t), 'kurzpruefung')).toEqual([]);
  });

  it('R5.2 Kurzprüfung täglich mit neuem Schlüssel, nie überfällig', () => {
    const t = mit11();
    fertig(t);
    const morgen = jetztAm('2027-01-13');
    expect(an(faellig(t, morgen), 'kurzpruefung', 'R-1.1')).toEqual([
      schluessel('kurzpruefung', platzId('R-1.1'), '2027-01-13'),
    ]);
    expect(einzig(von(faellig(t, morgen), 'kurzpruefung'), 'Kurzprüfung').tageUeberfaellig).toBe(0);
  });
});

describe('R5.2 Belüftung prüfen', () => {
  /** 2.1 (P2), 3.1, 3.2, 3.3 (P3), 4.5 (Station an P3), alle mit Lösung */
  function pumpen(): Teile {
    const t = leer();
    mitLoesung(t, { code: 'R-2.1', betriebsart: 'konstantpegel', luftpumpe: 'P2', volumenL: 3 });
    for (const code of ['R-3.1', 'R-3.2', 'R-3.3'])
      mitLoesung(t, { code, betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
    mitLoesung(t, {
      code: 'R-4.5',
      betriebsart: 'konstantpegel',
      luftpumpe: 'P3',
      festeDosis: true,
      volumenL: 2.3,
    });
    return t;
  }

  it('R5.2 Belüftung prüfen fällig: Abweichung pumpe in 3.1 → 3.1, 3.2, 3.3, 4.5 (Pumpe P3) markiert, 2.1 nicht', () => {
    const t = pumpen();
    kurzpruefungDazu(t, 'R-3.1', zh(HEUTE, '08:00'), 'pumpe', false);
    fertig(t);
    const l = von(faellig(t), 'belueftung_pruefen');
    expect(l.map((a) => a.ort?.kennung)).toEqual(['3.1', '3.2', '3.3', '4.5']);
    expect(l.map((a) => a.schluessel)).toEqual(
      ['R-3.1', 'R-3.2', 'R-3.3', 'R-4.5'].map((c) => schluessel('belueftung_pruefen', platzId(c), HEUTE)),
    );
    expect(l.map((a) => a.hinweis)).toEqual([undefined, 'mitmarkiert', 'mitmarkiert', 'mitmarkiert']);
    for (const a of l) {
      expect(a).toMatchObject({ titel: 'Belüftung prüfen', gewicht: 'ausserhalb' });
      expect(a.morgen.erlaubt).toBe(false);
    }
  });

  it('R5.2 Belüftung prüfen nicht fällig: Abweichung luftzone in 2.1 markiert nicht 3.x; nächste Kurzprüfung ok löscht', () => {
    const t = pumpen();
    kurzpruefungDazu(t, 'R-2.1', zh(HEUTE, '08:00'), 'luftzone', false);
    fertig(t);
    expect(an(faellig(t), 'belueftung_pruefen', 'R-2.1')).toEqual([
      schluessel('belueftung_pruefen', platzId('R-2.1'), HEUTE),
    ]);
    expect(von(faellig(t), 'belueftung_pruefen').map((a) => a.ort?.kennung)).toEqual(['2.1']);

    const p = pumpen();
    kurzpruefungDazu(p, 'R-3.1', zh(HEUTE, '08:00'), 'pumpe', false);
    kurzpruefungDazu(p, 'R-3.1', zh(HEUTE, '08:40'), 'pumpe', true);
    fertig(p);
    expect(von(alle(p, jetztAm(HEUTE, '08:45')), 'belueftung_pruefen')).toEqual([]);
  });

  it('R5.2 Belüftung prüfen nicht bei anderen Punkten der Kurzprüfung', () => {
    const t = pumpen();
    kurzpruefungDazu(t, 'R-3.1', zh(HEUTE, '08:00'), 'licht', false);
    fertig(t);
    expect(von(alle(t), 'belueftung_pruefen')).toEqual([]);
  });
});

describe('R5.2 Wurzeln prüfen', () => {
  it('R5.2 Wurzeln prüfen fällig: letzte Kurzprüfung Wurzeln + 7', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2026-12-29');
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-05'), 'wurzeln');
    fertig(t);
    const a = einzig(von(faellig(t), 'wurzeln_pruefen', platzId('R-1.1')), 'Wurzeln 1.1');
    expect(a).toMatchObject({
      schluessel: schluessel('wurzeln_pruefen', platzId('R-1.1'), HEUTE),
      titel: 'Wurzeln prüfen',
      ueberspringen: true,
    });
  });

  it('R5.2 Wurzeln prüfen nicht fällig: letzte Kurzprüfung Wurzeln + 6', () => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2026-12-29');
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-06'), 'wurzeln');
    fertig(t);
    expect(von(faellig(t), 'wurzeln_pruefen')).toEqual([]);
    expect(an(alle(t), 'wurzeln_pruefen', 'R-1.1')).toEqual([
      schluessel('wurzeln_pruefen', platzId('R-1.1'), '2027-01-13'),
    ]);
  });

  it('R5.2 Wurzeln prüfen ohne frühere Prüfung: Neuansatz + 7 (A5)', () => {
    const fruehe = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2027-01-05');
    fertig(fruehe);
    expect(an(faellig(fruehe), 'wurzeln_pruefen', 'R-1.1')).toEqual([
      schluessel('wurzeln_pruefen', platzId('R-1.1'), HEUTE),
    ]);
    const spaete = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' }, '2027-01-06');
    fertig(spaete);
    expect(von(faellig(spaete), 'wurzeln_pruefen')).toEqual([]);
  });
});

describe('R5.2 Wärme prüfen', () => {
  const mitTemperatur = (grad: number) => {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc' });
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-11', '18:00'), temperatur: grad });
    return fertig(t);
  };

  it('R5.2 Wärme prüfen fällig: gestern 24.1 °C → heute', () => {
    const a = einzig(von(faellig(mitTemperatur(24.1)), 'waerme_pruefen', platzId('R-1.1')), 'Wärme 1.1');
    expect(a).toMatchObject({
      schluessel: schluessel('waerme_pruefen', platzId('R-1.1'), HEUTE),
      titel: 'Wärme prüfen',
      gewicht: 'ausserhalb',
    });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Wärme prüfen nicht fällig: gestern 24.0 °C', () => {
    expect(von(alle(mitTemperatur(24.0)), 'waerme_pruefen')).toEqual([]);
  });

  it('R5.2 Wärme prüfen erledigt: Messung heute', () => {
    const t = mitTemperatur(25.0);
    messungDazu(t, 'R-1.1', { gilt: zh(HEUTE, '08:00'), temperatur: 22.0 });
    fertig(t);
    expect(von(alle(t), 'waerme_pruefen')).toEqual([]);
  });
});

describe('R5.2 Messgerät kalibrieren und pH-Kontrolle', () => {
  const OHNE: AufgabenEinstellungen = { vorlaufN: 2, festeKalibriertermine: [] };

  it('R5.2 Kalibrieren fällig: fester Termin vor letzte + 30', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    fertig(t);
    expect(
      an(faellig(t, JETZT, { vorlaufN: 2, festeKalibriertermine: [HEUTE] }), 'kalibrieren', MESSGERAET),
    ).toEqual([schluessel('kalibrieren', MESSGERAET, HEUTE)]);
    expect(von(faellig(t, JETZT, OHNE), 'kalibrieren')).toEqual([]);
    // dieselben Termine aus der Tabelle einstellung über einstellungenAus()
    t['einstellung'] = [{ id: 'e', vorlauf_n: 2, feste_kalibriertermine: [HEUTE] }];
    expect(an(faellig(t), 'kalibrieren', MESSGERAET)).toEqual([schluessel('kalibrieren', MESSGERAET, HEUTE)]);
  });

  it('R5.2 Kalibrieren fällig: sofort nach «Sonde gereinigt»', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    geraetEreignisDazu(t, 'sonde_gereinigt', zh('2027-01-10', '18:00'));
    fertig(t);
    const a = einzig(von(faellig(t, JETZT, OHNE), 'kalibrieren'), 'Kalibrieren');
    expect(a).toMatchObject({
      schluessel: schluessel('kalibrieren', MESSGERAET, '2027-01-10'),
      bezugArt: 'messgeraet',
      titel: 'Messgerät kalibrieren',
      tageUeberfaellig: 2,
    });
    expect(a.morgen.erlaubt).toBe(true);
  });

  it('R5.2 Kalibrieren: Demo-Kalibrierung zählt nicht für die echte Fälligkeit (G5)', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-05'), 'demo');
    fertig(t);
    expect(einzig(von(faellig(t, JETZT, OHNE), 'kalibrieren'), 'Kalibrieren')).toMatchObject({
      titel: 'Erstkalibrierung',
      faelligAm: HEUTE,
    });
  });

  it('R5.2 pH-Kontrolle fällig: Kontrolle + 7', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    phKontrolleDazu(t, zh('2027-01-05'));
    fertig(t);
    const a = einzig(von(faellig(t), 'ph_kontrolle'), 'pH-Kontrolle');
    expect(a).toMatchObject({
      schluessel: schluessel('ph_kontrolle', MESSGERAET, HEUTE),
      titel: 'pH-Kontrolle',
      bezugArt: 'messgeraet',
      ueberspringen: true,
    });
    expect(a.morgen.erlaubt).toBe(true);
  });

  it('R5.2 pH-Kontrolle fällig: letzte Kalibrierung + 7, wenn sie jünger als die Kontrolle ist', () => {
    const t = leer();
    phKontrolleDazu(t, zh('2027-01-02'));
    kalibrierungDazu(t, zh('2027-01-05'));
    fertig(t);
    expect(an(faellig(t), 'ph_kontrolle', MESSGERAET)).toEqual([
      schluessel('ph_kontrolle', MESSGERAET, HEUTE),
    ]);
  });

  it('R5.2 pH-Kontrolle nicht fällig: Kontrolle + 6', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    phKontrolleDazu(t, zh('2027-01-06'));
    fertig(t);
    expect(von(faellig(t), 'ph_kontrolle')).toEqual([]);
    expect(an(alle(t), 'ph_kontrolle', MESSGERAET)).toEqual([
      schluessel('ph_kontrolle', MESSGERAET, '2027-01-13'),
    ]);
  });

  it('RR14 Test-Kontrolle (datenart test) zählt nicht', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    phKontrolleDazu(t, zh('2027-01-05'));
    phKontrolleDazu(t, zh('2027-01-06'), 'test');
    phKontrolleDazu(t, zh('2027-01-07'), 'demo');
    kalibrierungDazu(t, zh('2027-01-08'), 'test');
    fertig(t);
    expect(an(faellig(t), 'ph_kontrolle', MESSGERAET)).toEqual([
      schluessel('ph_kontrolle', MESSGERAET, HEUTE),
    ]);
  });

  it('RR14 ohne echte Kalibrierung und ohne echte Kontrolle keine pH-Kontrolle (zuerst Erstkalibrierung)', () => {
    const t = leer();
    phKontrolleDazu(t, zh('2027-01-01'), 'demo');
    fertig(t);
    expect(von(alle(t), 'ph_kontrolle')).toEqual([]);
  });
});

describe('R5.2 Würfel feucht', () => {
  /** A1 mit Satz 7 (zwei Schwämme), A2 leer */
  function boxen(): { t: Teile; p: string[] } {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    boxDazu(t, 'R-A2', 'box_licht');
    const p = satzDazu(t, { nr: 7, sorte: 'lollo', box: 'R-A1', saat: '2027-01-10' });
    return { t, p };
  }

  it('R5.2 Würfel feucht fällig: Box mit Satz', () => {
    const { t } = boxen();
    fertig(t);
    const a = einzig(von(faellig(t), 'wuerfel_feucht'), 'Würfel feucht');
    expect(a).toMatchObject({
      schluessel: schluessel('wuerfel_feucht', platzId('R-A1'), HEUTE),
      titel: 'Würfel feucht',
      erledigtKnopf: true,
      ueberspringen: false,
    });
    expect(a.ort).toMatchObject({ code: 'R-A1', rolle: 'anzuchtort' });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Würfel feucht nicht fällig: Box leer oder alle Schwämme auf der Station', () => {
    const { t, p } = boxen();
    gefaessDazu(t, { code: 'R-4.4', betriebsart: 'konstantpegel', festeDosis: true, volumenL: 2.3 });
    p.forEach((id, i) => verschiebenDazu(t, id, 'R-4.4', zh('2027-01-11'), i + 1));
    fertig(t);
    expect(von(alle(t), 'wuerfel_feucht')).toEqual([]);
  });

  it('R5.2 Würfel feucht erledigt: aufgabe_erledigt heute oder Kurzprüfung wuerfel_feucht heute; morgen neuer Schlüssel', () => {
    const { t } = boxen();
    erledigtDazu(t, 'R-A1', schluessel('wuerfel_feucht', platzId('R-A1'), HEUTE), zh(HEUTE, '08:00'));
    fertig(t);
    expect(von(faellig(t), 'wuerfel_feucht')).toEqual([]);
    expect(an(faellig(t, jetztAm('2027-01-13')), 'wuerfel_feucht', 'R-A1')).toEqual([
      schluessel('wuerfel_feucht', platzId('R-A1'), '2027-01-13'),
    ]);

    const k = boxen().t;
    kurzpruefungDazu(k, 'R-A1', zh(HEUTE, '08:00'), 'wuerfel_feucht');
    fertig(k);
    expect(von(faellig(k), 'wuerfel_feucht')).toEqual([]);
  });
});

describe('R5.2 Deckel öffnen und Abdeckung entfernen', () => {
  function dunkel(saat = '2027-01-09', erfasst?: string): Teile {
    const t = leer();
    boxDazu(t, 'R-A3', 'box_dunkel');
    satzDazu(t, { nr: 8, sorte: 'koriander', box: 'R-A3', saat, ...(erfasst ? { erfasst } : {}) });
    return t;
  }

  it('R5.2 Deckel öffnen fällig: A3 (Dunkelkeimer), Saat + Keimdauer min', () => {
    const t = fertig(dunkel());
    const a = einzig(von(faellig(t), 'deckel_oeffnen'), 'Deckel öffnen');
    expect(a).toMatchObject({
      schluessel: schluessel('deckel_oeffnen', platzId('R-A3'), HEUTE),
      titel: 'Deckel öffnen',
      bezugArt: 'platz',
      erledigtKnopf: false,
    });
    expect(a.morgen.erlaubt).toBe(true);
    expect(von(faellig(fertig(dunkel('2027-01-10'))), 'deckel_oeffnen')).toEqual([]);
  });

  it('R5.2 Deckel öffnen nicht fällig: A1 (Lichtkeimer)', () => {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    satzDazu(t, { nr: 9, sorte: 'lollo', box: 'R-A1', saat: '2027-01-01' });
    satzDazu(t, { nr: 10, sorte: 'koriander', box: 'R-A1', saat: '2027-01-01' });
    fertig(t);
    expect(von(alle(t), 'deckel_oeffnen')).toEqual([]);
  });

  it('R5.2 Deckel öffnen: frühester Satz der Box zählt, nicht vor dem Erfassungstag (A15)', () => {
    const t = dunkel();
    satzDazu(t, { nr: 11, sorte: 'koriander', box: 'R-A3', saat: '2027-01-08' });
    fertig(t);
    expect(an(faellig(t), 'deckel_oeffnen', 'R-A3')).toEqual([
      schluessel('deckel_oeffnen', platzId('R-A3'), '2027-01-11'),
    ]);
    // rückdatiert gesät am 2.1., erfasst heute: Saat + 3 = 5.1. liegt auf dem Erfassungstag
    const r = fertig(dunkel('2027-01-02', zh(HEUTE, '08:00')));
    expect(an(alle(r), 'deckel_oeffnen', 'R-A3')).toEqual([
      schluessel('deckel_oeffnen', platzId('R-A3'), HEUTE),
    ]);
  });

  it('R5.2 Deckel öffnen erledigt: deckel_geoeffnet am Platz seit der Saat oder Keimung erfasst', () => {
    const t = dunkel();
    platzEreignisDazu(t, 'R-A3', 'deckel_geoeffnet', zh(HEUTE, '07:00'));
    fertig(t);
    expect(von(alle(t), 'deckel_oeffnen')).toEqual([]);

    const vorher = dunkel();
    platzEreignisDazu(vorher, 'R-A3', 'deckel_geoeffnet', zh('2027-01-08'));
    fertig(vorher);
    expect(an(faellig(vorher), 'deckel_oeffnen', 'R-A3')).toEqual([
      schluessel('deckel_oeffnen', platzId('R-A3'), HEUTE),
    ]);

    const gekeimt = dunkel();
    keimungDazu(gekeimt, (gekeimt['pflanzung'] ?? [])[0]?.['id'] as string, 1, zh('2027-01-11'));
    fertig(gekeimt);
    expect(von(alle(gekeimt), 'deckel_oeffnen')).toEqual([]);
  });

  it('R5.2 Abdeckung entfernen: Direktsaat Dunkelkeimer am Satz; erledigt durch abdeckung_entfernt', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-2.3', betriebsart: 'dwc', luftpumpe: 'P2' });
    satzDazu(t, { nr: 12, sorte: 'koriander', direktsaat: 'R-2.3', saat: '2027-01-09' });
    satzDazu(t, { nr: 13, sorte: 'lollo', direktsaat: 'R-2.3', saat: '2027-01-09' });
    fertig(t);
    const a = einzig(von(faellig(t), 'abdeckung_entfernen'), 'Abdeckung entfernen');
    expect(a).toMatchObject({
      schluessel: schluessel('abdeckung_entfernen', satzId(12), HEUTE),
      bezugArt: 'satz',
      titel: 'Abdeckung entfernen · Koriander',
    });
    expect(a.ort).toMatchObject({ code: 'R-2.3', rolle: 'gefaess' });
    expect(von(alle(t), 'deckel_oeffnen')).toEqual([]);

    pflanzEreignisDazu(t, { typ: 'abdeckung_entfernt', satzId: satzId(12), gilt: zh(HEUTE, '08:00') });
    fertig(t);
    expect(von(alle(t), 'abdeckung_entfernen')).toEqual([]);
  });
});

describe('R5.2 Keimung prüfen', () => {
  function lollo(saat: string): { t: Teile; p: string[] } {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    const p = satzDazu(t, { nr: 14, sorte: 'lollo', box: 'R-A1', saat });
    return { t, p };
  }

  it('R5.2 Keimung prüfen fällig: Saat + typische Keimdauer', () => {
    const { t } = lollo('2027-01-08');
    fertig(t);
    const a = einzig(von(faellig(t), 'keimung_pruefen'), 'Keimung prüfen');
    expect(a).toMatchObject({
      schluessel: schluessel('keimung_pruefen', satzId(14), HEUTE),
      bezugArt: 'satz',
      titel: 'Keimung prüfen · Lollo Rossa',
    });
    expect(a.ort).toMatchObject({ code: 'R-A1' });
    expect(von(faellig(fertig(lollo('2027-01-09').t)), 'keimung_pruefen')).toEqual([]);
  });

  it('R5.2 Keimung prüfen fällig: Teilergebnis + 2', () => {
    const { t, p } = lollo('2027-01-04');
    keimungDazu(t, p[0] ?? '', 2, zh('2027-01-09'));
    fertig(t);
    expect(an(faellig(t), 'keimung_pruefen', satzId(14))).toEqual([
      schluessel('keimung_pruefen', satzId(14), '2027-01-11'),
    ]);
  });

  it('R5.2 Keimung prüfen nicht fällig: nach Keimdauer max oder alle Schwämme gekeimt', () => {
    const ueber = lollo('2027-01-01');
    keimungDazu(ueber.t, ueber.p[0] ?? '', 2, zh('2027-01-07'));
    fertig(ueber.t);
    expect(von(alle(ueber.t), 'keimung_pruefen')).toEqual([]);

    const fertigGekeimt = lollo('2027-01-04');
    for (const id of fertigGekeimt.p) keimungDazu(fertigGekeimt.t, id, 2, zh('2027-01-08'));
    fertig(fertigGekeimt.t);
    expect(von(alle(fertigGekeimt.t), 'keimung_pruefen')).toEqual([]);
  });
});

describe('R5.2 Umsetzen und Reservierung prüfen', () => {
  /** Satz 15 Lollo Rossa in A1, gesät 20.12.2026 (umsetzen_bis 21: Saat + 21 + 7 = 17.1.), Reservierungen auf 1.1 */
  function reserviert(geplant = HEUTE): { t: Teile; p: string[] } {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    mitLoesung(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    netztopfDazu(t, 'R-1.1.1');
    netztopfDazu(t, 'R-1.1.2');
    const p = satzDazu(t, { nr: 15, sorte: 'lollo', box: 'R-A1', saat: '2026-12-20' });
    p.forEach((id, i) => {
      keimungDazu(t, id, 2, zh('2026-12-24'));
      reservierungDazu(t, id, `R-1.1.${i + 1}`, geplant);
    });
    return { t, p };
  }

  it('R5.2 Umsetzen fällig: geplantes Datum', () => {
    const { t } = reserviert();
    fertig(t);
    const a = einzig(von(faellig(t), 'umsetzen'), 'Umsetzen');
    expect(a).toMatchObject({
      schluessel: schluessel('umsetzen', satzId(15), HEUTE),
      bezugArt: 'satz',
      titel: 'Umsetzen · Lollo Rossa',
    });
    expect(a.hinweis).toBeUndefined();
    expect(a.morgen.erlaubt).toBe(true);
    expect(von(faellig(fertig(reserviert('2027-01-13').t)), 'umsetzen')).toEqual([]);
  });

  it('R5.2 Umsetzen: ab Saat + bis + 7 «Umsetzen überfällig» ohne Morgen, am Tag davor mit Morgen', () => {
    const { t } = reserviert();
    fertig(t);
    const davor = einzig(von(faellig(t, jetztAm('2027-01-16')), 'umsetzen'), 'Umsetzen 16.1.');
    expect(davor.hinweis).toBeUndefined();
    expect(davor.morgen.erlaubt).toBe(true);
    const grenze = einzig(von(faellig(t, jetztAm('2027-01-17')), 'umsetzen'), 'Umsetzen 17.1.');
    expect(grenze).toMatchObject({ hinweis: 'Umsetzen überfällig', faelligAm: HEUTE, tageUeberfaellig: 5 });
    expect(grenze.morgen.erlaubt).toBe(false);
  });

  it('R5.2 Umsetzen nicht fällig: umgesetzt (Reservierungen beendet) oder ohne Reservierung', () => {
    const { t, p } = reserviert();
    p.forEach((id, i) => umsetzenDazu(t, id, `R-1.1.${i + 1}`, zh(HEUTE, '08:00')));
    fertig(t);
    expect(von(alle(t), 'umsetzen')).toEqual([]);
    expect(von(alle(t, jetztAm('2027-01-20')), 'reservierung_pruefen')).toEqual([]);

    const ohne = leer();
    boxDazu(ohne, 'R-A1', 'box_licht');
    satzDazu(ohne, { nr: 16, sorte: 'lollo', box: 'R-A1', saat: '2026-12-20' });
    fertig(ohne);
    expect(von(alle(ohne), 'umsetzen')).toEqual([]);
    expect(von(alle(ohne, jetztAm('2027-01-20')), 'reservierung_pruefen')).toEqual([]);
  });

  it('R5.2 Reservierung prüfen fällig: Saat + bis + 7 ohne Umsetzen; am Tag davor nicht', () => {
    const { t } = reserviert();
    fertig(t);
    const a = einzig(von(faellig(t, jetztAm('2027-01-17')), 'reservierung_pruefen'), 'Reservierung prüfen');
    expect(a).toMatchObject({
      schluessel: schluessel('reservierung_pruefen', satzId(15), '2027-01-17'),
      bezugArt: 'satz',
      titel: 'Reservierung prüfen · Lollo Rossa',
    });
    expect(a.morgen.erlaubt).toBe(true);
    expect(von(faellig(t, jetztAm('2027-01-16')), 'reservierung_pruefen')).toEqual([]);
  });
});

describe('R5.2 Station auf 1. echte Blätter', () => {
  /** Station 4.4 mit Lösung seit 2.1. (Wechsel 16.1.), Satz 17 aus A1 an den Tagen `eintritt` auf die Station */
  function station(eintritt: string[], festeDosis = true): Teile {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    mitLoesung(t, {
      code: 'R-4.4',
      betriebsart: 'konstantpegel',
      luftpumpe: 'P4',
      festeDosis,
      volumenL: 2.3,
    });
    const p = satzDazu(t, {
      nr: 17,
      sorte: 'lollo',
      box: 'R-A1',
      saat: '2026-12-20',
      schwaemme: eintritt.length,
    });
    p.forEach((id, i) => {
      keimungDazu(t, id, 2, zh('2026-12-24'));
      verschiebenDazu(t, id, 'R-4.4', zh(eintritt[i] ?? HEUTE), i + 1);
    });
    return fertig(t);
  }

  it('R5.2 Station 1. echte Blätter fällig: frühester Eintritt + 15 (Wechsel 4 Tage danach bleibt getrennt)', () => {
    const t = station(['2027-01-01', '2026-12-28']);
    const a = einzig(von(faellig(t), 'station_echte_blaetter'), 'Station');
    expect(a).toMatchObject({
      schluessel: schluessel('station_echte_blaetter', platzId('R-4.4'), HEUTE),
      titel: 'Station auf 1. echte Blätter',
    });
    expect(a.morgen.erlaubt).toBe(false);
    const wechsel = einzig(von(alle(t), 'loesung_wechseln', platzId('R-4.4')), 'Wechsel 4.4');
    expect(wechsel.faelligAm).toBe('2027-01-16');
    expect(wechsel.hinweis).toBeUndefined();
  });

  it('R5.2 Station 1. echte Blätter nicht fällig: Wechsel in 3 oder 2 Tagen → zusammengelegt mit Hinweis', () => {
    for (const eintritt of ['2026-12-29', '2026-12-30']) {
      const t = station([eintritt]);
      expect(von(alle(t), 'station_echte_blaetter')).toEqual([]);
      const wechsel = einzig(von(alle(t), 'loesung_wechseln', platzId('R-4.4')), 'Wechsel 4.4');
      expect(wechsel).toMatchObject({ faelligAm: '2027-01-16', hinweis: 'mit 1. echte Blätter' });
    }
  });

  it('R5.2 Station 1. echte Blätter nicht fällig: Neuansatz ab der Fälligkeit oder Gefäss ohne feste Dosis', () => {
    const t = station(['2026-12-28']);
    ansatzDazu(t, 'R-4.4', { begonnen: zh(HEUTE, '08:00') });
    fertig(t);
    expect(von(alle(t), 'station_echte_blaetter')).toEqual([]);
    expect(von(alle(station(['2026-12-28'], false)), 'station_echte_blaetter')).toEqual([]);
  });
});

describe('R5.2 Reinigen, freie Löcher abdecken', () => {
  function geleert(): Teile {
    const t = mitLoesung(leer(), { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    platzEreignisDazu(t, 'R-1.1', 'gereinigt', zh('2027-01-05'));
    platzEreignisDazu(t, 'R-1.1', 'geleert', zh('2027-01-11', '10:00'));
    return t;
  }

  it('R5.2 Reinigen fällig: nach geleert (Kalendertag des Leerens); ein früheres gereinigt zählt nicht', () => {
    const t = fertig(geleert());
    const a = einzig(von(faellig(t), 'reinigen'), 'Reinigen');
    expect(a).toMatchObject({
      schluessel: schluessel('reinigen', platzId('R-1.1'), '2027-01-11'),
      titel: 'Reinigen, freie Löcher abdecken',
      erledigtKnopf: true,
      tageUeberfaellig: 1,
    });
    expect(a.morgen.erlaubt).toBe(true);
  });

  it('R5.2 Reinigen nicht fällig: nach gereinigt oder aufgabe_erledigt mit dem Schlüssel', () => {
    const t = geleert();
    platzEreignisDazu(t, 'R-1.1', 'gereinigt', zh('2027-01-11', '12:00'));
    fertig(t);
    expect(von(alle(t), 'reinigen')).toEqual([]);

    const e = geleert();
    erledigtDazu(
      e,
      'R-1.1',
      schluessel('reinigen', platzId('R-1.1'), '2027-01-11'),
      zh('2027-01-11', '12:00'),
    );
    fertig(e);
    expect(von(alle(e), 'reinigen')).toEqual([]);
  });
});
