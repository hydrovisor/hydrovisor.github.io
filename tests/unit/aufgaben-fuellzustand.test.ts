// Füllzustand und Prüfstatus in der Aufgaben-Rechnung (Plan 27 «Füllzustand und Status»; R5.4, R5.3, UC8-AK13,
// UC3-AK7). Injizierte Uhr (Standard Di 12.1.2027 09:00 Zürich), Zeitzone Europe/Zurich, Fixture
// tests/unit/aufgaben-fixture.ts. Vertrag im Kopf von aufgaben-schluessel.test.ts.
//
// Abweichung vom Testnamen im Plan: «ruht → keine Pflegeaufgaben, Gefäss prüfen bleibt» ist mit einem einzigen
// Prüfstatus je Gefäss (v_gefaess_status: ruht oder in_pruefung) nicht herstellbar; geprüft wird stattdessen, dass
// «Reinigen» (wie «Gefäss prüfen» keine Pflegeaufgabe) bei ruht bleibt.
import { describe, expect, it } from 'vitest';
import { alleAufgaben, einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import {
  HEUTE,
  JETZT,
  ZONE,
  ansatzDazu,
  belegungAendern,
  boxDazu,
  fertig,
  gefaessDazu,
  jetztAm,
  kurzpruefungDazu,
  leer,
  messungDazu,
  netztopfDazu,
  platzEreignisDazu,
  platzId,
  platzInaktiv,
  reservierungDazu,
  satzDazu,
  schluessel,
  statusSetzen,
  verschiebenDazu,
  keimungDazu,
  von,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const amPlatz = (l: readonly Aufgabe[], code: string) => l.filter((a) => a.bezug === platzId(code));
const typenAm = (l: readonly Aufgabe[], code: string) => amPlatz(l, code).map((a) => a.typ);

const PFLEGE_BEI_LEER = [
  'messen_nachfuellen',
  'messen',
  'nachfuellen_kratky',
  'loesung_wechseln',
  'kontrolle_folgetag',
  'kurzpruefung',
  'wurzeln_pruefen',
  'station_echte_blaetter',
];

/**
 * 1.1 DWC: Neuansatz 20.12.2026, Messung 11.1. 07:00 mit 25 °C, Neuansatz 11.1. 08:00 (Kontrollmessung 12.1. offen);
 * 3.1 Kratky belüftet: Neuansatz 20.12.2026, Neuansatz heute 06:00, Messung heute 07:00 unter ⅓. Mit `geleert` nach dem
 * letzten Neuansatz (1.1 am 11.1. 18:00, 3.1 heute 06:30) sind beide leer, sonst mit Lösung (voller Pflegeumfang).
 */
function vollerPflegeumfang(geleert: boolean): Teile {
  const t = leer();
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  gefaessDazu(t, { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
  for (const code of ['R-1.1', 'R-3.1']) {
    ansatzDazu(t, code, { begonnen: zh('2026-12-20') });
    messungDazu(t, code, { gilt: zh('2026-12-21'), fuellstand: 'ueber_drittel' });
  }
  messungDazu(t, 'R-1.1', { gilt: zh('2027-01-11', '07:00'), temperatur: 25.0 });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-11', '08:00') });
  ansatzDazu(t, 'R-3.1', { begonnen: zh(HEUTE, '06:00') });
  if (geleert) {
    platzEreignisDazu(t, 'R-1.1', 'geleert', zh('2027-01-11', '18:00'));
    platzEreignisDazu(t, 'R-3.1', 'geleert', zh(HEUTE, '06:30'));
  }
  messungDazu(t, 'R-3.1', { gilt: zh(HEUTE, '07:00'), fuellstand: 'unter_drittel' });
  return fertig(t);
}

describe('UC8-AK13 Füllzustand leer', () => {
  it('UC8-AK13 Füllzustand leer → keine kurzpruefung, messen_nachfuellen, nachfuellen_kratky, loesung_wechseln, kontrolle_folgetag', () => {
    // Gegenprobe mit Lösung: dieselben Orte haben die Aufgaben
    const voll = alle(vollerPflegeumfang(false));
    expect(typenAm(voll, 'R-1.1')).toEqual(
      expect.arrayContaining([
        'messen_nachfuellen',
        'loesung_wechseln',
        'kontrolle_folgetag',
        'kurzpruefung',
      ]),
    );
    expect(typenAm(voll, 'R-3.1')).toEqual(
      expect.arrayContaining(['messen', 'nachfuellen_kratky', 'kontrolle_folgetag', 'kurzpruefung']),
    );

    const t = vollerPflegeumfang(true);
    expect(t['v_fuellzustand']?.map((z) => z['fuellzustand'])).toEqual(['leer', 'leer']);
    for (const liste of [alle(t), alle(t, jetztAm('2027-01-20'))])
      for (const code of ['R-1.1', 'R-3.1'])
        expect(typenAm(liste, code).filter((typ) => PFLEGE_BEI_LEER.includes(typ))).toEqual([]);
    // Reinigen bleibt (keine Pflegeaufgabe nach R5.4)
    expect(typenAm(faellig(t), 'R-1.1')).toContain('reinigen');
    expect(typenAm(faellig(t), 'R-3.1')).toContain('reinigen');
  });

  it('UC8-AK13 leer mit Reservierung → nur «Ansatz für Umsetzen»', () => {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    gefaessDazu(t, { code: 'R-1.2', betriebsart: 'dwc', luftpumpe: 'P1' });
    netztopfDazu(t, 'R-1.2.1');
    const [p] = satzDazu(t, { nr: 30, sorte: 'lollo', box: 'R-A1', saat: '2026-12-26', schwaemme: 1 });
    keimungDazu(t, p ?? '', 2, zh('2026-12-30'));
    reservierungDazu(t, p ?? '', 'R-1.2.1', HEUTE);
    fertig(t);
    const l = amPlatz(faellig(t), 'R-1.2');
    expect(l.map((a) => a.schluessel)).toEqual([schluessel('ansatz', platzId('R-1.2'), HEUTE)]);
    expect(l[0]?.titel).toBe('Ansatz für Umsetzen');
    expect(typenAm(alle(t, jetztAm('2027-01-20')), 'R-1.2')).toEqual(['ansatz']);
  });

  it('UC8-AK13 ruht → keine Pflegeaufgaben, Reinigen bleibt', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    gefaessDazu(t, { code: 'R-1.2', betriebsart: 'dwc', luftpumpe: 'P1' });
    for (const code of ['R-1.1', 'R-1.2']) {
      ansatzDazu(t, code, { begonnen: zh('2026-12-20') });
      messungDazu(t, code, { gilt: zh('2027-01-11', '07:00'), temperatur: 25.0 });
      platzEreignisDazu(t, code, 'ruhe', zh('2027-01-11', '08:00'), { gesetzt: true });
      statusSetzen(t, code, 'ruht');
    }
    platzEreignisDazu(t, 'R-1.2', 'geleert', zh('2027-01-11', '10:00'));
    // Abweichung der Pumpe P1 in 1.1 markiert die ruhende 1.2 nicht mit
    kurzpruefungDazu(t, 'R-1.1', zh(HEUTE, '07:00'), 'pumpe', false);
    fertig(t);
    for (const liste of [alle(t), alle(t, jetztAm('2027-01-20'))]) {
      expect(typenAm(liste, 'R-1.1')).toEqual([]);
      expect(typenAm(liste, 'R-1.2')).toEqual(['reinigen']);
    }
  });

  it('UC8-AK13b Wechsel überfällig lässt «Messen und nachfüllen» stehen; Neuansatz heute lässt es entfallen', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2026-12-29') }); // Wechsel fällig 12.1.
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-13') });
    fertig(t);
    const stichtag = jetztAm('2027-01-15', '07:00');
    expect(typenAm(faellig(t, stichtag), 'R-1.1')).toEqual(
      expect.arrayContaining(['messen_nachfuellen', 'loesung_wechseln']),
    );
    expect(von(faellig(t, stichtag), 'messen_nachfuellen').map((a) => a.schluessel)).toEqual([
      schluessel('messen_nachfuellen', platzId('R-1.1'), '2027-01-15'),
    ]);

    // Wechsel heute erledigt: Neuansatz 08:00 → kein Messen und nachfüllen, kein Wechsel, Kontrollmessung morgen
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-15', '08:00') });
    fertig(t);
    const danach = faellig(t, jetztAm('2027-01-15', '09:00'));
    expect(von(danach, 'messen_nachfuellen')).toEqual([]);
    expect(von(danach, 'loesung_wechseln')).toEqual([]);
    expect(
      von(alle(t, jetztAm('2027-01-15', '09:00')), 'kontrolle_folgetag').map((a) => a.schluessel),
    ).toEqual([schluessel('kontrolle_folgetag', platzId('R-1.1'), '2027-01-16')]);
  });
});

describe('R5.4 Lösung, Status und Platz', () => {
  it('R5.4 Lösung ohne zählende Pflanzung behält Messen und Wechsel', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2026-12-29') });
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10') });
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-08'), 'wurzeln');
    fertig(t);
    expect(t['v_pflanzung_zustand']).toEqual([]);
    expect(typenAm(faellig(t), 'R-1.1')).toEqual(['messen_nachfuellen', 'loesung_wechseln', 'kurzpruefung']);
  });

  it('R5.4 Station ohne Lösung: keine Station auf 1. echte Blätter trotz Pflanzen', () => {
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    gefaessDazu(t, { code: 'R-4.4', betriebsart: 'konstantpegel', festeDosis: true, volumenL: 2.3 });
    const [p] = satzDazu(t, { nr: 31, sorte: 'lollo', box: 'R-A1', saat: '2026-12-20', schwaemme: 1 });
    keimungDazu(t, p ?? '', 2, zh('2026-12-24'));
    verschiebenDazu(t, p ?? '', 'R-4.4', zh('2026-12-28'));
    fertig(t);
    expect(typenAm(alle(t), 'R-4.4').filter((typ) => PFLEGE_BEI_LEER.includes(typ))).toEqual([]);
  });

  it('R5.4 entfernt oder Platz inaktiv → keine Aufgabe', () => {
    const t = leer();
    for (const code of ['R-1.1', 'R-1.2']) {
      gefaessDazu(t, { code, betriebsart: 'dwc', luftpumpe: 'P1' });
      ansatzDazu(t, code, { begonnen: zh('2026-12-20') });
      platzEreignisDazu(t, code, 'geleert', zh('2027-01-10'));
    }
    statusSetzen(t, 'R-1.1', 'entfernt');
    platzInaktiv(t, 'R-1.2');
    fertig(t);
    expect(amPlatz(alle(t), 'R-1.1')).toEqual([]);
    expect(amPlatz(alle(t), 'R-1.2')).toEqual([]);
  });
});

describe('UC3-AK7 Wechselintervall', () => {
  it('UC3-AK7 Wechselintervall 14 → 10 Tage verschiebt «Lösung wechseln» auf letzten Neuansatz + 10 (neue Belegung, Neuansatz bleibt)', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
    fertig(t);
    expect(von(alle(t), 'loesung_wechseln').map((a) => a.schluessel)).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-16'),
    ]);
    belegungAendern(t, 'R-1.1', { intervallWechselnD: 10 }, zh('2027-01-05'));
    fertig(t);
    expect(t['v_fuellzustand']?.[0]?.['fuellzustand']).toBe('loesung');
    expect(von(faellig(t), 'loesung_wechseln').map((a) => a.schluessel)).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-12'),
    ]);
  });
});
