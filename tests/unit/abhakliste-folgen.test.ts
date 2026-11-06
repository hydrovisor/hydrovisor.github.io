// Folgen des Lösungswechsels und der pH-Korrektur (Plan 29 Testliste abhakliste-folgen; Loesungswechsel-AK4, UC8-AK5,
// TZ9, UC9-AK7; Konzept R10.3, R5.2, R4.14). Injizierte Uhr, Zeitzone Europe/Zurich.
// Beispiele aus UC8-AK5: Neuansatz am 10.01. → «Kontrollmessung am Folgetag» am 11.01.; ein am 12.01. rückdatiert
// erfasster Wechsel vom 10.01. ergibt keine Kontrollmessung (TZ9). UC9-AK7: «pH-Minus gegeben» startet den Timer
// 15 min und erzeugt «Nachmessen».
//
// Vertrag (Plan 29 «Signaturen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/abhakliste/folgen.ts
//     kontrollmessungFolgetag(ansatz: AnsatzZeile & { gilt_ab; erfasst_am? }, zeitzone): 'JJJJ-MM-TT' | undefined
//       nur Neuansatz, nicht storniert, nicht abgebrochen, nicht nacherfasst (erfasst_am − gilt_ab > 2 h);
//       Kalendertag in Zürich von begonnen_am + 1.
//     offeneNachmessungen(ansaetze: (AnsatzZeile & { timer_ende })[], messungen: { id; messart; ansatz_id;
//       storniert_am }[], jetzt): { platzId; ansatzId; faelligAb }[]  (faelligAb = timer_ende als ISO-Text oder Date)
//   src/domain/abhakliste/vorgaenge.ts
//     phKorrekturVorgang(e: { platzId; phVorher: Hundertstel; volumenL: number (l); sollMl: Zehntel; istMl: Zehntel;
//       ids: () => string }, jetzt, zeitzone): Vorgang
//       → neu naehrloesungsansatz { id = client_id, platz_id, typ 'ph_korrektur', begonnen_am = gilt_ab = jetzt,
//         timer_ende = jetzt + 15 min, ph_vorher, volumen_l, ist_ersteinstellung false } ohne Zustandsfelder ausser
//         timer_ende, danach neu ansatz_position { ansatz_id, produkt_id 'ph_minus', soll_ml, ist_ml, bezugsvolumen_l }
//         in ml; vorgangPruefen(...) = [].
import { describe, expect, it } from 'vitest';
import { kontrollmessungFolgetag, offeneNachmessungen } from '../../src/domain/abhakliste/folgen.ts';
import { phKorrekturVorgang } from '../../src/domain/abhakliste/vorgaenge.ts';
import { istVeraltet, type AnsatzZeile } from '../../src/domain/bewertung/verlauf.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';

const PLATZ = '2b000000-0000-4000-8000-000000000005';
const ANSATZ = '29000000-0000-4000-8000-000000000001';

type Ansatz = AnsatzZeile & { gilt_ab: string; erfasst_am?: string; timer_ende?: string | null };

function ansatz(extra: Partial<Ansatz> = {}): Ansatz {
  return {
    id: ANSATZ,
    platz_id: PLATZ,
    typ: 'neuansatz',
    status: 'abgeschlossen',
    // 10.1.2027 18:30 Zürich
    begonnen_am: '2027-01-10T17:30:00.000Z',
    gilt_ab: '2027-01-10T17:30:00.000Z',
    erfasst_am: '2027-01-10T18:40:00.000Z',
    kontrollmessung_id: null,
    endmessung_id: null,
    storniert_am: null,
    ...extra,
  };
}

const ms = (x: unknown) => new Date(x as string).getTime();

describe('Nach dem Wechsel (R10.3)', () => {
  it('Loesungswechsel-AK4 nach dem Wechsel ist der letzte Messwert davor veraltet, Frischwasser-, Kontroll- und Endmessung nicht', () => {
    const a = ansatz({
      kontrollmessung_id: '24000000-0000-4000-8000-000000000014',
      endmessung_id: '24000000-0000-4000-8000-000000000017',
    });
    const davor = {
      id: '24000000-0000-4000-8000-000000000001',
      platz_id: PLATZ,
      gilt_ab: '2027-01-09T17:00:00.000Z',
      ansatz_id: null,
    };
    // begonnen_am ist der Haken von Zeile 1; die Frischwassermessung (Zeile 3) liegt danach und trägt ansatz_id
    const frischwasser = {
      id: '24000000-0000-4000-8000-000000000003',
      platz_id: PLATZ,
      gilt_ab: '2027-01-10T17:37:00.000Z',
      ansatz_id: ANSATZ,
    };
    const kontrolle = {
      id: '24000000-0000-4000-8000-000000000014',
      platz_id: PLATZ,
      gilt_ab: '2027-01-10T18:22:00.000Z',
      ansatz_id: ANSATZ,
    };
    const ende = {
      id: '24000000-0000-4000-8000-000000000017',
      platz_id: PLATZ,
      gilt_ab: '2027-01-10T18:42:00.000Z',
      ansatz_id: ANSATZ,
    };
    expect(istVeraltet(davor, [a])).toBe(true);
    expect(istVeraltet(frischwasser, [a])).toBe(false);
    expect(istVeraltet(kontrolle, [a])).toBe(false);
    expect(istVeraltet(ende, [a])).toBe(false);
    // ein abgebrochener Wechsel macht nichts veraltet
    expect(istVeraltet(davor, [{ ...a, status: 'abgebrochen' }])).toBe(false);
  });

  it('Loesungswechsel-AK4 Neuansatz am 10.1. ergibt Kontrollmessung am Folgetag 11.1.', () => {
    expect(kontrollmessungFolgetag(ansatz(), ZEITZONE)).toBe('2027-01-11');
    // 10.1. 23:30 Zürich = 22:30 UTC: der Folgetag zählt in Zürich
    const spaet = ansatz({
      begonnen_am: '2027-01-10T22:30:00.000Z',
      gilt_ab: '2027-01-10T22:30:00.000Z',
      erfasst_am: '2027-01-10T23:20:00.000Z',
    });
    expect(kontrollmessungFolgetag(spaet, ZEITZONE)).toBe('2027-01-11');
    // ein laufender Neuansatz hat die Kontrollmessung ebenfalls (ab dem Beginn)
    expect(kontrollmessungFolgetag(ansatz({ status: 'laufend' }), ZEITZONE)).toBe('2027-01-11');
  });

  it('Loesungswechsel-AK4 TZ9 rückdatiert erfasster Wechsel ergibt keine Kontrollmessung', () => {
    const nacherfasst = ansatz({ erfasst_am: '2027-01-12T08:00:00.000Z' });
    expect(kontrollmessungFolgetag(nacherfasst, ZEITZONE)).toBeUndefined();
    // knapp unter 2 h nach gilt_ab gilt noch nicht als nacherfasst
    expect(kontrollmessungFolgetag(ansatz({ erfasst_am: '2027-01-10T19:29:00.000Z' }), ZEITZONE)).toBe(
      '2027-01-11',
    );
  });

  it('Loesungswechsel-AK4 TZ9 Grenze wie die Spalte nacherfasst (> 2 hours): genau 2:00 nach gilt_ab noch Kontrollmessung, 2:01 keine', () => {
    // gilt_ab 10.1. 18:30 Zürich
    expect(kontrollmessungFolgetag(ansatz({ erfasst_am: '2027-01-10T19:30:00.000Z' }), ZEITZONE)).toBe(
      '2027-01-11',
    );
    expect(
      kontrollmessungFolgetag(ansatz({ erfasst_am: '2027-01-10T19:31:00.000Z' }), ZEITZONE),
    ).toBeUndefined();
    // eine Millisekunde über 2 h gilt bereits als nacherfasst
    expect(
      kontrollmessungFolgetag(ansatz({ erfasst_am: '2027-01-10T19:30:00.001Z' }), ZEITZONE),
    ).toBeUndefined();
  });

  it('Loesungswechsel-AK4 storniert, abgebrochen oder kein Neuansatz ergibt keine Kontrollmessung', () => {
    expect(
      kontrollmessungFolgetag(ansatz({ storniert_am: '2027-01-10T19:00:00.000Z' }), ZEITZONE),
    ).toBeUndefined();
    expect(kontrollmessungFolgetag(ansatz({ status: 'abgebrochen' }), ZEITZONE)).toBeUndefined();
    expect(kontrollmessungFolgetag(ansatz({ typ: 'nachfuellen' }), ZEITZONE)).toBeUndefined();
    expect(kontrollmessungFolgetag(ansatz({ typ: 'ph_korrektur' }), ZEITZONE)).toBeUndefined();
  });
});

describe('Nachmessen nach der pH-Korrektur (R4.14, R5.2)', () => {
  // 12.1.2027 18:00 Zürich
  const JETZT = new Date('2027-01-12T17:00:00.000Z');
  const ENDE = '2027-01-12T17:15:00.000Z';
  const korrektur = (extra: Partial<Ansatz> = {}): Ansatz =>
    ansatz({
      typ: 'ph_korrektur',
      status: 'laufend',
      begonnen_am: JETZT.toISOString(),
      gilt_ab: JETZT.toISOString(),
      timer_ende: ENDE,
      ...extra,
    });
  const nachmessen = (storniert: string | null = null) => ({
    id: '24000000-0000-4000-8000-000000000041',
    messart: 'nachmessen',
    ansatz_id: ANSATZ,
    storniert_am: storniert,
  });
  type A = Parameters<typeof offeneNachmessungen>[0];
  type M = Parameters<typeof offeneNachmessungen>[1];
  const offen = (a: Ansatz[], m: unknown[], jetzt = JETZT) =>
    offeneNachmessungen(a as unknown as A, m as unknown as M, jetzt).map((x) => ({
      platzId: x.platzId,
      ansatzId: x.ansatzId,
      faelligAb: ms(x.faelligAb),
    }));

  it('UC9-AK7 offenes Nachmessen ist fällig ab timer_ende und erledigt durch eine Messung nachmessen mit derselben ansatz_id', () => {
    expect(offen([korrektur()], [])).toEqual([{ platzId: PLATZ, ansatzId: ANSATZ, faelligAb: ms(ENDE) }]);
    expect(offen([korrektur()], [nachmessen()])).toEqual([]);
    // eine stornierte Messung erledigt nichts, eine Messung eines anderen Ansatzes auch nicht
    expect(offen([korrektur()], [nachmessen('2027-01-12T17:20:00.000Z')])).toHaveLength(1);
    expect(
      offen([korrektur()], [{ ...nachmessen(), ansatz_id: '29000000-0000-4000-8000-000000000002' }]),
    ).toHaveLength(1);
    // stornierte pH-Korrektur und Neuansatz ergeben kein Nachmessen
    expect(offen([korrektur({ storniert_am: '2027-01-12T17:05:00.000Z' })], [])).toEqual([]);
    expect(offen([ansatz({ timer_ende: ENDE, status: 'laufend' })], [])).toEqual([]);
  });

  it('UC9-AK7 «pH-Minus gegeben» schreibt timer_ende = jetzt + 15 min beim Insert und erzeugt Nachmessen ab diesem Zeitpunkt', () => {
    let n = 0;
    const ids = () => `29000000-0000-4000-8000-00000000010${(n += 1)}`;
    const vorgang = phKorrekturVorgang(
      { platzId: PLATZ, phVorher: 690, volumenL: 9, sollMl: 29, istMl: 29, ids },
      JETZT,
      ZEITZONE,
    );
    expect(vorgangPruefen(vorgang)).toEqual([]);
    const neu = vorgang.filter((s) => s.art === 'neu');
    const kopfIndex = neu.findIndex((s) => s.tabelle === 'naehrloesungsansatz');
    const posIndex = neu.findIndex((s) => s.tabelle === 'ansatz_position');
    expect(kopfIndex).toBeGreaterThanOrEqual(0);
    expect(posIndex).toBeGreaterThan(kopfIndex);
    const kopf = (neu[kopfIndex] as { felder: Record<string, unknown> }).felder;
    expect(kopf).toMatchObject({
      platz_id: PLATZ,
      typ: 'ph_korrektur',
      ph_vorher: 6.9,
      volumen_l: 9,
      ist_ersteinstellung: false,
    });
    expect(kopf['id']).toBe(kopf['client_id']);
    expect(ms(kopf['timer_ende'])).toBe(JETZT.getTime() + 15 * 60_000);
    expect(ms(kopf['begonnen_am'])).toBe(JETZT.getTime());
    for (const feld of [
      'status',
      'abgeschlossen_am',
      'dauer_s',
      'kontrollmessung_id',
      'endmessung_id',
      'ph_nachher',
    ])
      expect(kopf, feld).not.toHaveProperty(feld);
    const position = (neu[posIndex] as { felder: Record<string, unknown> }).felder;
    expect(position).toMatchObject({
      ansatz_id: kopf['id'],
      produkt_id: 'ph_minus',
      soll_ml: 2.9,
      ist_ml: 2.9,
      bezugsvolumen_l: 9,
    });
    // die Zeile, wie sie die Datenbank speichert (status laufend als Default), ergibt Nachmessen ab Uhr + 15 min
    const gespeichert = { ...kopf, status: 'laufend', storniert_am: null } as unknown as Ansatz;
    expect(offen([gespeichert], [])).toEqual([
      { platzId: PLATZ, ansatzId: kopf['id'], faelligAb: JETZT.getTime() + 15 * 60_000 },
    ]);
  });
});
