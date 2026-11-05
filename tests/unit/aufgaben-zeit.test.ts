// Zeitregeln der Aufgaben-Rechnung (Plan 27 Testliste «Zeit»; G1, G2, 06_tests.md Abschnitt 5 TZ1 bis TZ4 und TZ9;
// UC8-AK2, AK5, AK6). Injizierte Uhr, Zeitzone Europe/Zurich mit der Sommerzeit-Umstellung am 28.3.2027 (02:00 MEZ →
// 03:00 MESZ, 01:00 UTC). Fixture tests/unit/aufgaben-fixture.ts; Vertrag im Kopf von aufgaben-schluessel.test.ts.
//
// Abweichung vom Testnamen im Plan: «Stichtag 28.3. 02:30 UTC und 23:30 UTC» läge um 23:30 UTC schon am 29.3. in
// Zürich; geprüft werden 00:30 UTC (01:30 MEZ, vor der Umstellung) und 21:30 UTC (23:30 MESZ) am selben Kalendertag.
import { describe, expect, it } from 'vitest';
import {
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  naechsteAufgabe,
  type Aufgabe,
} from '../../src/domain/aufgaben.ts';
import {
  MESSGERAET,
  ZONE,
  ansatzDazu,
  fertig,
  gefaessDazu,
  jetztAm,
  kalibrierungDazu,
  kurzpruefungDazu,
  leer,
  messungDazu,
  platzId,
  schluessel,
  von,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt: Date) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt: Date) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const schluesselVon = (l: readonly Aufgabe[]) => l.map((a) => a.schluessel);

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

describe('UC8-AK2 Kalendertage in Zürich', () => {
  /** 1.1 DWC mit Lösung seit 20.3., Wurzeln am 25.3. geprüft, letzte Messung 26.3. 23:30 Zürich (22:30 UTC) */
  function maerz(): Teile {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-03-20') });
    kurzpruefungDazu(t, 'R-1.1', zh('2027-03-25'), 'wurzeln');
    messungDazu(t, 'R-1.1', { gilt: zh('2027-03-26', '23:30') });
    return fertig(t);
  }

  it('UC8-AK2 Fälligkeit über die Sommerzeit 28.3.2027: Messung 26.3. 23:30 Zürich → fällig 28.3., 29.3. ohne Doppel', () => {
    const t = maerz();
    expect(zh('2027-03-26', '23:30')).toBe('2027-03-26T22:30:00.000Z');
    expect(von(faellig(t, jetztAm('2027-03-27', '23:59')), 'messen_nachfuellen')).toEqual([]);
    const s = schluessel('messen_nachfuellen', platzId('R-1.1'), '2027-03-28');
    for (const [tag, zeit, ueber] of [
      ['2027-03-28', '00:30', 0],
      ['2027-03-28', '03:30', 0],
      ['2027-03-28', '23:30', 0],
      ['2027-03-29', '00:30', 1],
      ['2027-03-29', '09:00', 1],
    ] as const) {
      const l = von(faellig(t, jetztAm(tag, zeit)), 'messen_nachfuellen');
      expect(schluesselVon(l)).toEqual([s]);
      expect(einzig(l, `${tag} ${zeit}`).tageUeberfaellig).toBe(ueber);
    }
    // Kurzprüfung täglich: je Kalendertag genau ein Schlüssel, auch am Tag mit 23 Stunden
    for (const tag of ['2027-03-27', '2027-03-28', '2027-03-29'])
      expect(schluesselVon(von(faellig(t, jetztAm(tag, '12:00')), 'kurzpruefung'))).toEqual([
        schluessel('kurzpruefung', platzId('R-1.1'), tag),
      ]);
  });

  it('UC8-AK2 Stichtag 28.3. 00:30 UTC (01:30 MEZ) und 21:30 UTC (23:30 MESZ) liefern dieselben Kalendertage', () => {
    const t = maerz();
    const frueh = faellig(t, new Date('2027-03-28T00:30:00.000Z'));
    const spaet = faellig(t, new Date('2027-03-28T21:30:00.000Z'));
    expect(schluesselVon(frueh)).toEqual(schluesselVon(spaet));
    expect(frueh.map((a) => [a.faelligAm, a.anzeigeAb, a.tageUeberfaellig])).toEqual(
      spaet.map((a) => [a.faelligAm, a.anzeigeAb, a.tageUeberfaellig]),
    );
    expect(schluesselVon(von(frueh, 'kurzpruefung'))).toEqual([
      schluessel('kurzpruefung', platzId('R-1.1'), '2027-03-28'),
    ]);
  });

  it('G2 Stichtag 23:59 und 00:01 Zürich liegen auf verschiedenen Kalendertagen, gleiche UTC-Stunde', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
    kurzpruefungDazu(t, 'R-1.1', zh('2027-01-08'), 'wurzeln');
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10', '12:00') });
    fertig(t);
    // 11.1. 23:59 Zürich = 22:59 UTC, 12.1. 00:01 Zürich = 23:01 UTC am 11.1.
    const vorher = new Date('2027-01-11T22:59:00.000Z');
    const nachher = new Date('2027-01-11T23:01:00.000Z');
    expect(vorher.toISOString().slice(0, 10)).toBe(nachher.toISOString().slice(0, 10));
    expect(von(faellig(t, vorher), 'messen_nachfuellen')).toEqual([]);
    expect(schluesselVon(von(faellig(t, nachher), 'messen_nachfuellen'))).toEqual([
      schluessel('messen_nachfuellen', platzId('R-1.1'), '2027-01-12'),
    ]);
    expect(schluesselVon(von(faellig(t, vorher), 'kurzpruefung'))).toEqual([
      schluessel('kurzpruefung', platzId('R-1.1'), '2027-01-11'),
    ]);
    expect(schluesselVon(von(faellig(t, nachher), 'kurzpruefung'))).toEqual([
      schluessel('kurzpruefung', platzId('R-1.1'), '2027-01-12'),
    ]);
  });
});

describe('UC8-AK5 Kontrollmessung am Folgetag (TZ9)', () => {
  /** 1.1 DWC, Neuansatz 10.1. 09:00 Zürich, erfasst zum Zeitpunkt `erfasst` */
  function neuansatz(erfasst = zh('2027-01-10', '09:30')): Teile {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-10'), erfasst });
    return t;
  }
  const KONTROLLE = schluessel('kontrolle_folgetag', platzId('R-1.1'), '2027-01-11');

  it('UC8-AK5 Neuansatz 10.1. erfasst 10.1. → «Kontrollmessung am Folgetag» für den 11.1.', () => {
    const t = fertig(neuansatz());
    expect(von(faellig(t, jetztAm('2027-01-10', '18:00')), 'kontrolle_folgetag')).toEqual([]);
    const a = einzig(von(faellig(t, jetztAm('2027-01-11')), 'kontrolle_folgetag'), 'Kontrollmessung');
    expect(a).toMatchObject({
      schluessel: KONTROLLE,
      titel: 'Kontrollmessung am Folgetag',
      faelligAm: '2027-01-11',
      gewicht: 'routine',
    });
    expect(a.morgen.erlaubt).toBe(false);
  });

  it('UC8-AK5 TZ9 Lösungswechsel vom 10.1. erfasst 12.1. → keine Kontrollmessung, Wechsel fällig 24.1.', () => {
    const t = fertig(neuansatz(zh('2027-01-12', '10:00')));
    const l = alle(t, jetztAm('2027-01-12', '11:00'));
    expect(von(l, 'kontrolle_folgetag')).toEqual([]);
    expect(schluesselVon(von(l, 'loesung_wechseln'))).toEqual([
      schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-24'),
    ]);
  });

  it('UC8-AK5 TZ9 Grenze: erfasst 11.1. 23:30 Zürich → Kontrollmessung; erfasst 12.1. 00:30 Zürich → keine', () => {
    const knapp = fertig(neuansatz(zh('2027-01-11', '23:30')));
    expect(schluesselVon(von(alle(knapp, jetztAm('2027-01-11', '23:45')), 'kontrolle_folgetag'))).toEqual([
      KONTROLLE,
    ]);
    const spaet = fertig(neuansatz(zh('2027-01-12', '00:30')));
    expect(von(alle(spaet, jetztAm('2027-01-12', '01:00')), 'kontrolle_folgetag')).toEqual([]);
  });

  it('UC8-AK5 TZ9 ohne erfasst_am zählt client_zeit, sonst gilt_ab', () => {
    const t = neuansatz(zh('2027-01-12', '10:00'));
    const ansatz = t['naehrloesungsansatz']?.[0];
    if (ansatz) delete ansatz['erfasst_am'];
    fertig(t);
    expect(von(alle(t, jetztAm('2027-01-12', '11:00')), 'kontrolle_folgetag')).toEqual([]);
    if (ansatz) delete ansatz['client_zeit'];
    expect(schluesselVon(von(alle(t, jetztAm('2027-01-11')), 'kontrolle_folgetag'))).toEqual([KONTROLLE]);
  });

  it('UC8-AK5 Messung am 11.1. erledigt die Kontrollmessung; eine Messung am 10.1. nach dem Ansatz nicht', () => {
    const am10 = neuansatz();
    messungDazu(am10, 'R-1.1', { gilt: zh('2027-01-10', '23:30'), messart: 'end_ansatz' });
    fertig(am10);
    expect(schluesselVon(von(faellig(am10, jetztAm('2027-01-11')), 'kontrolle_folgetag'))).toEqual([
      KONTROLLE,
    ]);

    const am11 = neuansatz();
    messungDazu(am11, 'R-1.1', { gilt: zh('2027-01-11', '00:30'), messart: 'kontrolle_folgetag' });
    fertig(am11);
    expect(von(alle(am11, jetztAm('2027-01-11', '09:00')), 'kontrolle_folgetag')).toEqual([]);
    // überfällig bleibt sie mit ihrem Schlüssel stehen, bis gemessen ist
    const offen = fertig(neuansatz());
    expect(
      einzig(von(faellig(offen, jetztAm('2027-01-13')), 'kontrolle_folgetag'), 'Kontrolle'),
    ).toMatchObject({
      schluessel: KONTROLLE,
      tageUeberfaellig: 2,
    });
  });
});

describe('UC8-AK6 Messgerät kalibrieren (TZ1 bis TZ4)', () => {
  /** Anlage R ohne Orte, Kalibrierung am 1.1. 09:00 Zürich; ohne feste Termine */
  function kalibriert(): Teile {
    const t = leer();
    kalibrierungDazu(t, zh('2027-01-01'));
    return fertig(t);
  }
  const KAL = (tag: string) => schluessel('kalibrieren', MESSGERAET, tag);

  it('UC8-AK6 TZ2 Kalibrierung vor 30 Tagen → «Messgerät kalibrieren», tageUeberfaellig 0', () => {
    const a = einzig(von(faellig(kalibriert(), jetztAm('2027-01-31')), 'kalibrieren'), 'Kalibrieren');
    expect(a).toMatchObject({
      schluessel: KAL('2027-01-31'),
      titel: 'Messgerät kalibrieren',
      faelligAm: '2027-01-31',
      tageUeberfaellig: 0,
      datenart: 'echt',
      gewicht: 'routine',
    });
    expect(a.morgen.erlaubt).toBe(true);
  });

  it('UC8-AK6 TZ3 vor 31 Tagen → tageUeberfaellig 1, grund «seit 1 Tag überfällig»', () => {
    const a = einzig(von(faellig(kalibriert(), jetztAm('2027-02-01')), 'kalibrieren'), 'Kalibrieren');
    expect(a).toMatchObject({
      schluessel: KAL('2027-01-31'),
      titel: 'Messgerät kalibrieren',
      tageUeberfaellig: 1,
      grund: 'seit 1 Tag überfällig',
    });
    expect(einzig(von(faellig(kalibriert(), jetztAm('2027-02-03')), 'kalibrieren'), 'K').grund).toBe(
      'seit 3 Tagen überfällig',
    );
  });

  it('UC8-AK6 TZ4 nie kalibriert → titel «Erstkalibrierung», faelligAm heute', () => {
    const t = fertig(leer());
    for (const tag of ['2027-01-12', '2027-01-13']) {
      const a = einzig(von(faellig(t, jetztAm(tag)), 'kalibrieren'), `Erstkalibrierung ${tag}`);
      expect(a).toMatchObject({
        schluessel: KAL(tag),
        titel: 'Erstkalibrierung',
        faelligAm: tag,
        tageUeberfaellig: 0,
      });
    }
  });

  it('UC8-AK6 TZ1 Tag 29 → keine Aufgabe, aber naechsteAufgabe nennt Tag 30', () => {
    const t = kalibriert();
    const jetzt = jetztAm('2027-01-30');
    expect(von(faellig(t, jetzt), 'kalibrieren')).toEqual([]);
    expect(schluesselVon(von(alle(t, jetzt), 'kalibrieren'))).toEqual([KAL('2027-01-31')]);
    const n = naechsteAufgabe(t, einstellungenAus(t), jetzt, ZONE);
    expect(n?.schluessel).toBe(KAL('2027-01-31'));
    expect(n?.anzeigeAb).toBe('2027-01-31');
  });
});
