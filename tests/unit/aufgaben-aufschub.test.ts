// «Morgen», «Überspringen», «Pegel ok», «Erledigt» (Plan 27 Abschnitt «Morgen, Überspringen, Pegel ok, Erledigt»;
// R5.3, 8.1 Regel 2, 11.4; UC8-AK3, AK4, AK12). Injizierte Uhr (Standard Di 12.1.2027 09:00 Zürich), Zeitzone
// Europe/Zurich, Fixture tests/unit/aufgaben-fixture.ts. Vertrag im Kopf von aufgaben-schluessel.test.ts.
//
// Zusätzlich festgelegt (A, wo der Plan offen ist):
// - morgen.erlaubt mit Grenze ({ tage }, { bis }): erlaubt, solange heute + 1 ≤ Grenze (Lösung wechseln: faelligAm + 3).
// - grund nach zwei oder mehr «Morgen»: 'seit <x> Tagen verschoben' (x = heute − faelligAm).
// - abdeckung_entfernen hat in MORGEN den Wert 'ja' wie deckel_oeffnen (Plantabelle: eine Zeile).
// - aufschubVorgang() liefert einen Schritt { art: 'neu', tabelle: 'aufschub', felder } mit felder ⊇ { id, client_id,
//   aufgabe_schluessel, art, gesetzt_am, gilt_ab, datenart }; «Morgen» beim Umsetzen stattdessen ein Ereignis
//   umsetzdatum_geaendert am Satz mit daten { von: umsetzenGeplantAm, nach: Kalendertag(jetzt) + 1, grund: 'morgen' }.
// - erledigtVorgang() liefert ein Ereignis aufgabe_erledigt mit platz_id (bzw. satz_id), daten { aufgabe_schluessel },
//   war_faellig_am = faelligAm, aufgabe_schluessel, gilt_ab = jetzt; für deckel_oeffnen leer (8.1 Regel 2).
import { describe, expect, it } from 'vitest';
import {
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  type Aufgabe,
  type AufgabenTyp,
} from '../../src/domain/aufgaben.ts';
import {
  ERLEDIGT_KNOPF,
  MORGEN,
  UEBERSPRINGEN,
  anzeigeAb,
  aufschubVorgang,
  erledigtVorgang,
  verschoben,
  type AufschubZeile,
} from '../../src/domain/aufgaben-aufschub.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  ansatzDazu,
  aufschubDazu,
  boxDazu,
  fertig,
  gefaessDazu,
  grundstand,
  jetztAm,
  kalibrierungDazu,
  keimungDazu,
  kurzpruefungDazu,
  leer,
  messungDazu,
  netztopfDazu,
  phKontrolleDazu,
  platzEreignisDazu,
  platzId,
  reservierungDazu,
  satzDazu,
  satzId,
  schluessel,
  von,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const schluesselVon = (l: readonly Aufgabe[]) => l.map((a) => a.schluessel);

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

/** Kratky belüftet in 3.1 (Anlage R oder X), Lösung seit 28.12.2026, Messung am Tag `gemessen` */
function kratky31(gemessen = '2027-01-05', code = 'R-3.1'): Teile {
  const t = leer();
  gefaessDazu(t, { code, betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
  ansatzDazu(t, code, { begonnen: zh('2026-12-28') });
  messungDazu(t, code, { gilt: zh(gemessen), fuellstand: 'ueber_drittel' });
  return t;
}

/** DWC 1.1 mit Lösung seit 2.1., Messung am Tag `gemessen` (Messen und nachfüllen = gemessen + 2) */
function dwc11(gemessen = '2027-01-10'): Teile {
  const t = leer();
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'R-1.1', { gilt: zh(gemessen) });
  return t;
}

const MESSEN_31 = (tag: string) => schluessel('messen', platzId('R-3.1'), tag);
const MN_11 = (tag: string) => schluessel('messen_nachfuellen', platzId('R-1.1'), tag);

describe('UC8-AK3 «Morgen»', () => {
  it('UC8-AK3 «Morgen» verschiebt «Messen 3.1» (Kratky belüftet) um einen Tag: anzeigeAb = heute + 1, Schlüssel gleich', () => {
    const t = kratky31();
    fertig(t);
    const vorher = einzig(von(faellig(t), 'messen', platzId('R-3.1')), 'Messen 3.1');
    expect(vorher.morgen).toEqual({ erlaubt: true, verschoben: 0 });
    aufschubDazu(t, { schluessel: MESSEN_31(HEUTE), art: 'morgen', gesetztAm: HEUTE });
    fertig(t);
    expect(von(faellig(t), 'messen')).toEqual([]);
    const morgen = einzig(von(faellig(t, jetztAm('2027-01-13')), 'messen'), 'Messen 3.1 am 13.1.');
    expect(morgen).toMatchObject({
      schluessel: MESSEN_31(HEUTE),
      faelligAm: HEUTE,
      anzeigeAb: '2027-01-13',
      tageUeberfaellig: 1,
    });
    expect(morgen.morgen).toEqual({ erlaubt: true, verschoben: 1 });
  });

  it('UC8-AK3 übernächste Fälligkeit rechnet ab der tatsächlichen Messung, nicht ab dem verschobenen Tag', () => {
    const t = kratky31();
    aufschubDazu(t, { schluessel: MESSEN_31(HEUTE), art: 'morgen', gesetztAm: HEUTE });
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-14', '08:00'), fuellstand: 'ueber_drittel' });
    fertig(t);
    const stichtag = jetztAm('2027-01-14', '09:00');
    expect(von(faellig(t, stichtag), 'messen')).toEqual([]);
    expect(schluesselVon(von(alle(t, stichtag), 'messen', platzId('R-3.1')))).toEqual([
      MESSEN_31('2027-01-21'),
    ]);
  });

  it('UC8-AK3 drittes «Morgen» für Messen Kratky nicht erlaubt (max 2), nach zwei Morgen «intervall_anpassen»', () => {
    const t = kratky31('2027-01-03');
    aufschubDazu(t, { schluessel: MESSEN_31('2027-01-10'), art: 'morgen', gesetztAm: '2027-01-10' });
    aufschubDazu(t, { schluessel: MESSEN_31('2027-01-10'), art: 'morgen', gesetztAm: '2027-01-11' });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen'), 'Messen 3.1');
    expect(a).toMatchObject({ schluessel: MESSEN_31('2027-01-10'), anzeigeAb: HEUTE, tageUeberfaellig: 2 });
    expect(a.morgen).toEqual({ erlaubt: false, verschoben: 2, hinweis: 'intervall_anpassen' });
    expect(a.grund).toBe('seit 2 Tagen verschoben');
    expect(aufschubVorgang(a, 'morgen', 'f0000000-0000-4000-8000-000000000001', JETZT, ZONE)).toEqual([]);
  });
});

describe('UC8-AK4 «Messen und nachfüllen» und «Pegel ok»', () => {
  it('UC8-AK4 «Messen und nachfüllen» DWC: morgen.erlaubt = false, pegelOk = true', () => {
    const t = fertig(dwc11());
    const a = einzig(von(faellig(t), 'messen_nachfuellen'), 'Messen 1.1');
    expect(a.morgen).toEqual({ erlaubt: false, verschoben: 0 });
    expect(a.pegelOk).toBe(true);
    expect(a.ueberspringen).toBe(false);
    expect(aufschubVorgang(a, 'morgen', 'f0000000-0000-4000-8000-000000000002', JETZT, ZONE)).toEqual([]);
    // Pegel ok nur bei messen_nachfuellen
    const kratky = einzig(von(faellig(fertig(kratky31())), 'messen'), 'Messen 3.1');
    expect(kratky.pegelOk).toBe(false);
    expect(aufschubVorgang(kratky, 'pegel_ok', 'f0000000-0000-4000-8000-000000000003', JETZT, ZONE)).toEqual(
      [],
    );
  });

  it('UC8-AK4 nach «Pegel ok» heute ist «Morgen» erlaubt; Pegel ok allein blendet nicht aus', () => {
    const t = dwc11();
    aufschubDazu(t, { schluessel: MN_11(HEUTE), art: 'pegel_ok', gesetztAm: HEUTE });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen_nachfuellen'), 'Messen 1.1');
    expect(a).toMatchObject({ schluessel: MN_11(HEUTE), anzeigeAb: HEUTE, pegelOk: false });
    expect(a.morgen).toEqual({ erlaubt: true, verschoben: 0 });
    // Pegel ok eines anderen Schlüssels wirkt nicht
    const fremd = dwc11();
    aufschubDazu(fremd, { schluessel: MN_11('2027-01-11'), art: 'pegel_ok', gesetztAm: HEUTE });
    fertig(fremd);
    expect(einzig(von(faellig(fremd), 'messen_nachfuellen'), 'Messen 1.1').morgen.erlaubt).toBe(false);
  });

  it('UC8-AK4 nach Pegel ok und zwei «Morgen» in Folge kein drittes', () => {
    const t = dwc11('2027-01-08');
    for (const tag of ['2027-01-10', '2027-01-11']) {
      aufschubDazu(t, { schluessel: MN_11('2027-01-10'), art: 'pegel_ok', gesetztAm: tag });
      aufschubDazu(t, { schluessel: MN_11('2027-01-10'), art: 'morgen', gesetztAm: tag });
    }
    aufschubDazu(t, { schluessel: MN_11('2027-01-10'), art: 'pegel_ok', gesetztAm: HEUTE });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen_nachfuellen'), 'Messen 1.1');
    expect(a.morgen).toEqual({ erlaubt: false, verschoben: 2, hinweis: 'intervall_anpassen' });

    // nach einem Morgen und Pegel ok heute ist das zweite noch erlaubt
    const eins = dwc11('2027-01-09');
    aufschubDazu(eins, { schluessel: MN_11('2027-01-11'), art: 'pegel_ok', gesetztAm: '2027-01-11' });
    aufschubDazu(eins, { schluessel: MN_11('2027-01-11'), art: 'morgen', gesetztAm: '2027-01-11' });
    aufschubDazu(eins, { schluessel: MN_11('2027-01-11'), art: 'pegel_ok', gesetztAm: HEUTE });
    fertig(eins);
    expect(einzig(von(faellig(eins), 'messen_nachfuellen'), 'Messen 1.1').morgen).toEqual({
      erlaubt: true,
      verschoben: 1,
    });
  });

  it('UC8-AK4 Pegel ok von gestern zählt heute nicht', () => {
    const t = dwc11('2027-01-09');
    aufschubDazu(t, { schluessel: MN_11('2027-01-11'), art: 'pegel_ok', gesetztAm: '2027-01-11' });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen_nachfuellen'), 'Messen 1.1');
    expect(a.morgen.erlaubt).toBe(false);
    expect(a.pegelOk).toBe(true);
  });
});

describe('UC8-AK12 «Überspringen»', () => {
  it('UC8-AK12 «Überspringen» nur für messen (Kratky belüftet), wurzeln_pruefen, ph_kontrolle; für messen_nachfuellen leerer Vorgang', () => {
    expect([...UEBERSPRINGEN].sort()).toEqual(['messen', 'ph_kontrolle', 'wurzeln_pruefen']);
    const liste = faellig(grundstand());
    const mit = liste.filter((a) => a.ueberspringen).map((a) => a.typ);
    expect([...new Set(mit)].sort()).toEqual(['messen', 'ph_kontrolle', 'wurzeln_pruefen']);
    const mn = einzig(von(liste, 'messen_nachfuellen', platzId('R-1.1')), 'Messen 1.1');
    expect(mn.ueberspringen).toBe(false);
    expect(aufschubVorgang(mn, 'ueberspringen', 'f0000000-0000-4000-8000-000000000004', JETZT, ZONE)).toEqual(
      [],
    );
  });

  it('UC8-AK12 nach Überspringen am 12.1. ist «Messen 3.1» am 19.1. fällig (heute + 7)', () => {
    const t = kratky31();
    aufschubDazu(t, { schluessel: MESSEN_31(HEUTE), art: 'ueberspringen', gesetztAm: HEUTE });
    fertig(t);
    expect(von(faellig(t), 'messen')).toEqual([]);
    expect(schluesselVon(von(alle(t), 'messen', platzId('R-3.1')))).toEqual([MESSEN_31('2027-01-19')]);
    // eine spätere echte Messung zählt wieder
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-15'), fuellstand: 'ueber_drittel' });
    fertig(t);
    expect(schluesselVon(von(alle(t, jetztAm('2027-01-15', '10:00')), 'messen'))).toEqual([
      MESSEN_31('2027-01-22'),
    ]);
  });

  it('UC8-AK12 Überspringen pH-Kontrolle → heute + 7', () => {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    phKontrolleDazu(t, zh('2027-01-05'));
    aufschubDazu(t, {
      schluessel: schluessel('ph_kontrolle', MESSGERAET, HEUTE),
      art: 'ueberspringen',
      gesetztAm: HEUTE,
    });
    fertig(t);
    expect(von(faellig(t), 'ph_kontrolle')).toEqual([]);
    expect(schluesselVon(von(alle(t), 'ph_kontrolle'))).toEqual([
      schluessel('ph_kontrolle', MESSGERAET, '2027-01-19'),
    ]);
  });

  it('UC8-AK12 Überspringen Wurzeln prüfen → heute + 7; storniertes Überspringen wirkt nicht', () => {
    const t = dwc11();
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-04'), 'wurzeln');
    aufschubDazu(t, {
      schluessel: schluessel('wurzeln_pruefen', platzId('R-1.1'), '2027-01-11'),
      art: 'ueberspringen',
      gesetztAm: HEUTE,
    });
    fertig(t);
    expect(schluesselVon(von(alle(t), 'wurzeln_pruefen'))).toEqual([
      schluessel('wurzeln_pruefen', platzId('R-1.1'), '2027-01-19'),
    ]);
    const s = dwc11();
    kurzpruefungDazu(s, 'R-1.1', zh('2027-01-04'), 'wurzeln');
    aufschubDazu(s, {
      schluessel: schluessel('wurzeln_pruefen', platzId('R-1.1'), '2027-01-11'),
      art: 'ueberspringen',
      gesetztAm: HEUTE,
      storniert: true,
    });
    fertig(s);
    expect(schluesselVon(von(faellig(s), 'wurzeln_pruefen'))).toEqual([
      schluessel('wurzeln_pruefen', platzId('R-1.1'), '2027-01-11'),
    ]);
  });
});

describe('R5.3 Grenzen von «Morgen»', () => {
  it('R5.3 Tabelle MORGEN je Typ', () => {
    const erwartet: Record<AufgabenTyp, unknown> = {
      gefaess_pruefen: 'ja',
      messen_nachfuellen: 'nein',
      messen: { max: 2 },
      nachfuellen_kratky: 'nein',
      loesung_wechseln: { tage: 3 },
      ansatz: 'nein',
      kontrolle_folgetag: 'nein',
      kurzpruefung: 'nein',
      belueftung_pruefen: 'nein',
      wurzeln_pruefen: { max: 1 },
      waerme_pruefen: 'nein',
      kalibrieren: 'ja',
      ph_kontrolle: 'ja',
      wuerfel_feucht: 'nein',
      deckel_oeffnen: 'ja',
      abdeckung_entfernen: 'ja',
      keimung_pruefen: { bis: 'keimdauer_max' },
      umsetzen: { bis: 'umsetzen_bis_7' },
      station_echte_blaetter: 'nein',
      reservierung_pruefen: 'ja',
      reinigen: 'ja',
    };
    expect(MORGEN).toEqual(erwartet);
  });

  it('R5.3 nach zwei Morgen «seit x Tagen verschoben» und intervall_anpassen', () => {
    // Gefäss prüfen hat «Morgen» ohne Grenze: auch nach zwei Morgen erlaubt, aber mit Hinweis
    const t = leer();
    gefaessDazu(t, { code: 'R-2.2', betriebsart: 'dwc', status: 'in_pruefung', erfasst: zh('2027-01-09') });
    const s = schluessel('gefaess_pruefen', platzId('R-2.2'), '2027-01-09');
    aufschubDazu(t, { schluessel: s, art: 'morgen', gesetztAm: '2027-01-09' });
    aufschubDazu(t, { schluessel: s, art: 'morgen', gesetztAm: '2027-01-11' });
    fertig(t);
    const a = einzig(von(faellig(t), 'gefaess_pruefen'), 'Gefäss prüfen');
    expect(a).toMatchObject({ anzeigeAb: HEUTE, tageUeberfaellig: 3, grund: 'seit 3 Tagen verschoben' });
    expect(a.morgen).toEqual({ erlaubt: true, verschoben: 2, hinweis: 'intervall_anpassen' });
    // nach einem Morgen noch kein Hinweis
    const eins = leer();
    gefaessDazu(eins, {
      code: 'R-2.2',
      betriebsart: 'dwc',
      status: 'in_pruefung',
      erfasst: zh('2027-01-09'),
    });
    aufschubDazu(eins, { schluessel: s, art: 'morgen', gesetztAm: '2027-01-11' });
    fertig(eins);
    const b = einzig(von(faellig(eins), 'gefaess_pruefen'), 'Gefäss prüfen');
    expect(b.morgen).toEqual({ erlaubt: true, verschoben: 1 });
    expect(b.grund).not.toBe('seit 3 Tagen verschoben');
  });

  it('R5.3 Lösung wechseln höchstens 3 Tage', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2026-12-29') }); // Wechsel fällig 12.1.
    fertig(t);
    const erlaubt = (tag: string) =>
      einzig(von(faellig(t, jetztAm(tag)), 'loesung_wechseln'), `Wechsel ${tag}`).morgen.erlaubt;
    expect(erlaubt('2027-01-12')).toBe(true);
    expect(erlaubt('2027-01-14')).toBe(true);
    expect(erlaubt('2027-01-15')).toBe(false);
  });

  it('R5.3 Wurzeln prüfen: «Morgen» einmal', () => {
    const t = dwc11();
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-05'), 'wurzeln'); // fällig 12.1.
    fertig(t);
    expect(einzig(von(faellig(t), 'wurzeln_pruefen'), 'Wurzeln').morgen.erlaubt).toBe(true);
    aufschubDazu(t, {
      schluessel: schluessel('wurzeln_pruefen', platzId('R-1.1'), HEUTE),
      art: 'morgen',
      gesetztAm: HEUTE,
    });
    fertig(t);
    const a = einzig(von(faellig(t, jetztAm('2027-01-13')), 'wurzeln_pruefen'), 'Wurzeln 13.1.');
    expect(a.morgen).toEqual({ erlaubt: false, verschoben: 1 });
  });

  it('R5.3 Keimung prüfen: «Morgen» bis Saat + Keimdauer max', () => {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    satzDazu(t, { nr: 20, sorte: 'lollo', box: 'R-A1', saat: '2027-01-08' }); // fällig 12.1., max 15.1.
    fertig(t);
    const erlaubt = (tag: string) =>
      einzig(von(faellig(t, jetztAm(tag)), 'keimung_pruefen'), `Keimung ${tag}`).morgen.erlaubt;
    expect(erlaubt('2027-01-12')).toBe(true);
    expect(erlaubt('2027-01-14')).toBe(true);
    expect(erlaubt('2027-01-15')).toBe(false);
  });

  it('R5.3 storniertes Morgen zählt nicht', () => {
    const t = kratky31();
    aufschubDazu(t, { schluessel: MESSEN_31(HEUTE), art: 'morgen', gesetztAm: HEUTE, storniert: true });
    fertig(t);
    const a = einzig(von(faellig(t), 'messen'), 'Messen 3.1');
    expect(a.anzeigeAb).toBe(HEUTE);
    expect(a.morgen).toEqual({ erlaubt: true, verschoben: 0 });
  });

  it('R5.3 anzeigeAb und verschoben über die Aufschub-Zeilen eines Schlüssels', () => {
    const roh = einzig(von(alle(fertig(kratky31())), 'messen'), 'Messen 3.1');
    const zeile = (
      n: number,
      art: AufschubZeile['art'],
      gesetztAm: string,
      s = roh.schluessel,
    ): AufschubZeile => ({
      id: `f0000000-0000-4000-8000-00000000010${n}`,
      client_id: `f0000000-0000-4000-8000-00000000010${n}`,
      aufgabe_schluessel: s,
      art,
      gesetzt_am: gesetztAm,
      gilt_ab: zh(gesetztAm, '10:00'),
      storniert_am: null,
    });
    expect(anzeigeAb(roh, [])).toBe(HEUTE);
    expect(verschoben(roh, [])).toBe(0);
    const zwei = [zeile(1, 'morgen', '2027-01-12'), zeile(2, 'morgen', '2027-01-13')];
    expect(anzeigeAb(roh, zwei)).toBe('2027-01-14');
    expect(verschoben(roh, zwei)).toBe(2);
    // andere Arten, andere Schlüssel und Stornos zählen nicht
    const fremd = [
      zeile(3, 'pegel_ok', '2027-01-13'),
      zeile(4, 'ueberspringen', '2027-01-13'),
      zeile(5, 'morgen', '2027-01-13', MESSEN_31('2027-01-11')),
      { ...zeile(6, 'morgen', '2027-01-13'), storniert_am: zh('2027-01-13', '11:00') },
    ];
    expect(anzeigeAb(roh, fremd)).toBe(HEUTE);
    expect(verschoben(roh, fremd)).toBe(0);
  });
});

describe('R5.3 Vorgänge über schreiben()', () => {
  it('R5.3 aufschubVorgang schreibt client_id = id, gesetzt_am Kalendertag Zürich, datenart der Anlage', () => {
    const t = fertig(kratky31('2027-01-05', 'X-3.1'));
    const a = einzig(von(faellig(t), 'messen', platzId('X-3.1')), 'Messen X-3.1');
    expect(a.datenart).toBe('demo');
    const id = 'f0000000-0000-4000-8000-000000000201';
    // 23:30 UTC = 00:30 Zürich am Folgetag
    const jetzt = new Date('2027-01-12T23:30:00.000Z');
    const v = aufschubVorgang(a, 'morgen', id, jetzt, ZONE);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'aufschub',
      felder: {
        id,
        client_id: id,
        aufgabe_schluessel: schluessel('messen', platzId('X-3.1'), HEUTE),
        art: 'morgen',
        gesetzt_am: '2027-01-13',
        gilt_ab: jetzt.toISOString(),
        datenart: 'demo',
      },
    });
    const ueber = aufschubVorgang(a, 'ueberspringen', id, JETZT, ZONE);
    expect(ueber[0]).toMatchObject({
      art: 'neu',
      tabelle: 'aufschub',
      felder: { client_id: id, art: 'ueberspringen', gesetzt_am: HEUTE, datenart: 'demo' },
    });
    const mn = einzig(von(faellig(fertig(dwc11())), 'messen_nachfuellen'), 'Messen 1.1');
    expect(aufschubVorgang(mn, 'pegel_ok', id, JETZT, ZONE)).toEqual([
      expect.objectContaining({
        art: 'neu',
        tabelle: 'aufschub',
        felder: expect.objectContaining({
          client_id: id,
          aufgabe_schluessel: MN_11(HEUTE),
          art: 'pegel_ok',
          gesetzt_am: HEUTE,
          datenart: 'echt',
        }),
      }),
    ]);
  });

  it('R5.3 «Morgen» beim Umsetzen schreibt umsetzdatum_geaendert am Satz statt einer Aufschub-Zeile', () => {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
    netztopfDazu(t, 'R-1.1.1');
    const [p] = satzDazu(t, { nr: 21, sorte: 'lollo', box: 'R-A1', saat: '2026-12-20', schwaemme: 1 });
    keimungDazu(t, p ?? '', 2, zh('2026-12-24'));
    reservierungDazu(t, p ?? '', 'R-1.1.1', HEUTE);
    fertig(t);
    const a = einzig(von(faellig(t), 'umsetzen'), 'Umsetzen');
    const id = 'f0000000-0000-4000-8000-000000000202';
    const v = aufschubVorgang(a, 'morgen', id, JETZT, ZONE, { satzId: satzId(21), umsetzenGeplantAm: HEUTE });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: id,
        typ: 'umsetzdatum_geaendert',
        satz_id: satzId(21),
        daten: { von: HEUTE, nach: '2027-01-13', grund: 'morgen' },
        gilt_ab: JETZT.toISOString(),
      },
    });
    expect(v.some((s) => s.art === 'neu' && s.tabelle === 'aufschub')).toBe(false);
  });

  it('R5.3 erledigtVorgang nur für wuerfel_feucht und reinigen, mit war_faellig_am und aufgabe_schluessel', () => {
    expect([...ERLEDIGT_KNOPF].sort()).toEqual(['reinigen', 'wuerfel_feucht']);
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    satzDazu(t, { nr: 22, sorte: 'lollo', box: 'R-A1', saat: '2027-01-11' });
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
    platzEreignisDazu(t, 'R-1.1', 'geleert', zh('2027-01-11', '10:00'));
    fertig(t);
    const liste = faellig(t);
    const id = 'f0000000-0000-4000-8000-000000000203';
    const wuerfel = einzig(von(liste, 'wuerfel_feucht'), 'Würfel feucht');
    expect(erledigtVorgang(wuerfel, id, JETZT)).toEqual([
      {
        art: 'neu',
        tabelle: 'ereignis',
        felder: expect.objectContaining({
          id,
          client_id: id,
          typ: 'aufgabe_erledigt',
          platz_id: platzId('R-A1'),
          daten: { aufgabe_schluessel: schluessel('wuerfel_feucht', platzId('R-A1'), HEUTE) },
          war_faellig_am: HEUTE,
          aufgabe_schluessel: schluessel('wuerfel_feucht', platzId('R-A1'), HEUTE),
          gilt_ab: JETZT.toISOString(),
        }),
      },
    ]);
    const reinigen = einzig(von(liste, 'reinigen'), 'Reinigen');
    expect(erledigtVorgang(reinigen, id, JETZT)[0]).toMatchObject({
      tabelle: 'ereignis',
      felder: {
        typ: 'aufgabe_erledigt',
        platz_id: platzId('R-1.1'),
        war_faellig_am: '2027-01-11',
        aufgabe_schluessel: schluessel('reinigen', platzId('R-1.1'), '2027-01-11'),
      },
    });
    for (const a of liste.filter((x) => !['wuerfel_feucht', 'reinigen'].includes(x.typ))) {
      expect(a.erledigtKnopf).toBe(false);
      expect(erledigtVorgang(a, id, JETZT)).toEqual([]);
    }
    expect(wuerfel.erledigtKnopf).toBe(true);
    expect(reinigen.erledigtKnopf).toBe(true);
  });

  it('8.1 Regel 2 Erledigt für deckel_oeffnen liefert leeren Vorgang', () => {
    const deckel = einzig(von(faellig(grundstand()), 'deckel_oeffnen'), 'Deckel öffnen');
    expect(deckel.erledigtKnopf).toBe(false);
    expect(erledigtVorgang(deckel, 'f0000000-0000-4000-8000-000000000204', JETZT)).toEqual([]);
    expect(ERLEDIGT_KNOPF.has('deckel_oeffnen')).toBe(false);
  });

  it('R5.3 Aufschub-Zeile trägt die Datenart der Anlage auch für Aufgaben am Satz', () => {
    const t = leer();
    t['anlage'] = (t['anlage'] ?? []).map((a) => (a['id'] === ANLAGE.R ? { ...a, datenart: 'test' } : a));
    boxDazu(t, 'R-A3', 'box_dunkel');
    satzDazu(t, { nr: 23, sorte: 'koriander', box: 'R-A3', saat: '2027-01-09' });
    fertig(t);
    const deckel = einzig(von(faellig(t), 'deckel_oeffnen'), 'Deckel öffnen');
    expect(deckel.datenart).toBe('test');
    const v = aufschubVorgang(deckel, 'morgen', 'f0000000-0000-4000-8000-000000000205', JETZT, ZONE);
    expect(v[0]).toMatchObject({ tabelle: 'aufschub', felder: { datenart: 'test', art: 'morgen' } });
  });
});
