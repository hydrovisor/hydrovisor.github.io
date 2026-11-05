// Stationsschritt der Keimprüfung (Plan 24 Testliste; R6.1, Plan 23 A7 und A10). Injizierte Uhr 2027-01-11T08:00:00Z,
// Zeitzone Europe/Zurich, heute = 2027-01-11. Regal R: Stationen 4.1 (D6, 6 × 5 cm), 4.2 und 4.3 (S8, je 4 × 8 cm),
// 4.4 und 4.5 (S5, je 13 × 5 cm); Teile aus tests/fixtures/keimung.ts.
//
// Vertrag (Plan 24 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   freieStationsloecher(teile, anlageId, groesse): freie Löcher der Stationen (feste Dosis) dieser Grösse; frei = keine
//     aktive Pflanzung auf platz_id und loch_nr. Reihenfolge nach Konzept 5.8 («Salat … auf 4.4, bei Bedarf 4.5 und
//     4.1»): Stationen mit mehr Löchern zuerst, bei gleicher Zahl nach Kennung (4.4 vor 4.5 vor 4.1; 4.2 vor 4.3);
//     innerhalb einer Station Loch aufsteigend.
//   stationsVorbelegung(teile, { anlageId, artId, zieltoepfe, schonAufStation, gekeimt }, heute):
//     Höchstzahl 5 cm Z + 1, 8 cm Z, ohne Zieltöpfe alle gekeimten; schon gestellte zählen mit. Zuerst Schwämme mit
//     Zieltopf, dann die übrigen in der gegebenen Folge, auf die freien Löcher in der Reihenfolge oben.
//     Über der Höchstzahl: reserve, reserveBis = heute + 7. Unter der Höchstzahl ohne freies Loch: ohnePlatz,
//     inBoxBis = heute + 4. Ohne solche Fälle fehlen reserveBis bzw. inBoxBis.
//   stationsBelegung (b): ein Satz in der Box zählt nicht mehr als «in der Box», sobald eine seiner Pflanzungen auf
//     einer Station steht (Plan 23 A10).
import { describe, expect, it } from 'vitest';
import {
  freieStationsloecher,
  stationsBelegung,
  stationsVorbelegung,
} from '../../src/domain/anzucht/kapazitaet.ts';
import { keimEingabePruefen, type KeimEingabe } from '../../src/domain/pflanzung/keimung.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ereignisDazu, KEIM_JETZT, KEIM_SATZ, keimTeile, P } from '../fixtures/keimung.ts';
import { platzId } from '../fixtures/regal.ts';
import { ANLAGE_R, aufStation, SORTE, STATION_5CM } from '../fixtures/saeen.ts';
import { pflanzSichtenNachrechnen } from '../fixtures/sichten.ts';

const HEUTE = '2027-01-11';
const SALAT = 'lactuca_sativa';
const TOMATE = 'solanum_lycopersicum';

const loch = (kennung: string, lochNr: number) => ({ platzId: platzId(kennung), lochNr });
const plaetze = (z: { platzId: string; lochNr: number }[]) => z.map((x) => [x.platzId, x.lochNr]);
const auf = (kennung: string, ...loecher: number[]) => loecher.map((n) => [platzId(kennung), n]);

/** Rucola (Satz 50) belegt die gegebenen Stationslöcher */
function belegt(loecher: [string, number][]) {
  const t = keimTeile();
  aufStation(t, { satzNr: 50, sorteId: SORTE.rucola, saatdatum: '2027-01-02', loecher });
  return pflanzSichtenNachrechnen(t);
}

const gekeimt = (...l: [string, boolean][]) =>
  l.map(([pflanzungId, mitZieltopf]) => ({ pflanzungId, mitZieltopf }));

describe('R6.1 Vorbelegung der Stationsplätze', () => {
  it('R6.1 5 cm: höchstens Zieltöpfe + 1 Schwämme auf die Station, Zieltopf-Schwämme zuerst', () => {
    const r = stationsVorbelegung(
      keimTeile(),
      {
        anlageId: ANLAGE_R,
        artId: SALAT,
        zieltoepfe: 3,
        schonAufStation: 0,
        gekeimt: gekeimt(
          [P[6] as string, false],
          [P[1] as string, true],
          [P[2] as string, true],
          [P[4] as string, false],
          [P[3] as string, true],
        ),
      },
      HEUTE,
    );
    expect(r.zuweisung.map((z) => z.pflanzungId)).toEqual([P[1], P[2], P[3], P[6]]);
    expect(plaetze(r.zuweisung)).toEqual(auf('4.4', 1, 2, 3, 4));
    expect(r.reserve).toEqual([P[4]]);
    expect(r.ohnePlatz).toEqual([]);
    expect(r.inBoxBis).toBeUndefined();
  });

  it('R6.1 8 cm: genau die Zieltöpfe', () => {
    const r = stationsVorbelegung(
      keimTeile(),
      {
        anlageId: ANLAGE_R,
        artId: TOMATE,
        zieltoepfe: 2,
        schonAufStation: 0,
        gekeimt: gekeimt([P[3] as string, false], [P[1] as string, true], [P[2] as string, true]),
      },
      HEUTE,
    );
    expect(r.zuweisung.map((z) => z.pflanzungId)).toEqual([P[1], P[2]]);
    expect(plaetze(r.zuweisung)).toEqual(auf('4.2', 1, 2));
    expect(r.reserve).toEqual([P[3]]);
  });

  it('R6.1 ohne Zieltöpfe alle gekeimten', () => {
    const fuenf = P.slice(1, 6).map((p): [string, boolean] => [p, false]);
    const r = stationsVorbelegung(
      keimTeile(),
      { anlageId: ANLAGE_R, artId: SALAT, zieltoepfe: 0, schonAufStation: 0, gekeimt: gekeimt(...fuenf) },
      HEUTE,
    );
    expect(r.zuweisung.map((z) => z.pflanzungId)).toEqual(P.slice(1, 6));
    expect(plaetze(r.zuweisung)).toEqual(auf('4.4', 1, 2, 3, 4, 5));
    expect(r.reserve).toEqual([]);
    expect(r.reserveBis).toBeUndefined();
  });

  it('R6.1 schon gestellte Schwämme zählen mit', () => {
    // zwei Schwämme desselben Satzes stehen schon auf 4.4 Loch 1 und 2; Z = 3 → höchstens 4, also noch 2
    const t = keimTeile();
    ereignisDazu(t, {
      typ: 'verschieben',
      pflanzungId: P[1] as string,
      daten: { von_platz_id: platzId('A1'), nach_platz_id: platzId('4.4'), nach_loch_nr: 1 },
      giltAb: '2027-01-10T08:00:00.000Z',
    });
    ereignisDazu(t, {
      typ: 'verschieben',
      pflanzungId: P[2] as string,
      daten: { von_platz_id: platzId('A1'), nach_platz_id: platzId('4.4'), nach_loch_nr: 2 },
      giltAb: '2027-01-10T08:00:00.000Z',
    });
    pflanzSichtenNachrechnen(t);
    const r = stationsVorbelegung(
      t,
      {
        anlageId: ANLAGE_R,
        artId: SALAT,
        zieltoepfe: 3,
        schonAufStation: 2,
        gekeimt: gekeimt([P[3] as string, true], [P[4] as string, false], [P[5] as string, false]),
      },
      HEUTE,
    );
    expect(r.zuweisung.map((z) => z.pflanzungId)).toEqual([P[3], P[4]]);
    expect(plaetze(r.zuweisung)).toEqual(auf('4.4', 3, 4));
    expect(r.reserve).toEqual([P[5]]);
  });

  it('R6.1 belegte Löcher werden nicht vorbelegt', () => {
    const t = belegt([
      ['4.4', 1],
      ['4.4', 2],
      ['4.4', 3],
    ]);
    const frei5 = freieStationsloecher(t, ANLAGE_R, 50);
    expect(frei5.map((l) => [l.kennung, l.lochNr])).toEqual([
      ...Array.from({ length: 10 }, (_, i) => ['4.4', i + 4]),
      ...Array.from({ length: 13 }, (_, i) => ['4.5', i + 1]),
      ...Array.from({ length: 6 }, (_, i) => ['4.1', i + 1]),
    ]);
    expect(frei5[0]).toEqual({ platzId: platzId('4.4'), kennung: '4.4', lochNr: 4 });
    expect(freieStationsloecher(t, ANLAGE_R, 80).map((l) => [l.kennung, l.lochNr])).toEqual([
      ['4.2', 1],
      ['4.2', 2],
      ['4.2', 3],
      ['4.2', 4],
      ['4.3', 1],
      ['4.3', 2],
      ['4.3', 3],
      ['4.3', 4],
    ]);
    const r = stationsVorbelegung(
      t,
      {
        anlageId: ANLAGE_R,
        artId: SALAT,
        zieltoepfe: 1,
        schonAufStation: 0,
        gekeimt: gekeimt([P[1] as string, true], [P[2] as string, false]),
      },
      HEUTE,
    );
    expect(plaetze(r.zuweisung)).toEqual(auf('4.4', 4, 5));
  });

  it('R6.1 Station voll: Hinweis bleibt bis heute + 4 in der Box', () => {
    // alle 32 Plätze 5 cm belegt ausser 4.1 Loch 6
    const t = belegt(STATION_5CM.filter(([k, n]) => !(k === '4.1' && n === 6)));
    expect(freieStationsloecher(t, ANLAGE_R, 50)).toEqual([
      { platzId: platzId('4.1'), kennung: '4.1', lochNr: 6 },
    ]);
    const r = stationsVorbelegung(
      t,
      {
        anlageId: ANLAGE_R,
        artId: SALAT,
        zieltoepfe: 3,
        schonAufStation: 0,
        gekeimt: gekeimt([P[1] as string, true], [P[2] as string, true], [P[3] as string, true]),
      },
      HEUTE,
    );
    expect(r.zuweisung).toEqual([{ pflanzungId: P[1], ...loch('4.1', 6) }]);
    expect(r.ohnePlatz).toEqual([P[2], P[3]]);
    expect(r.inBoxBis).toBe('2027-01-15');
    expect(r.reserve).toEqual([]);
    expect(r.reserveBis).toBeUndefined();
  });

  it('R6.1 Reserve über der Höchstzahl bis heute + 7', () => {
    const r = stationsVorbelegung(
      keimTeile(),
      {
        anlageId: ANLAGE_R,
        artId: SALAT,
        zieltoepfe: 1,
        schonAufStation: 0,
        gekeimt: gekeimt(
          [P[1] as string, false],
          [P[2] as string, false],
          [P[3] as string, true],
          [P[4] as string, false],
        ),
      },
      HEUTE,
    );
    expect(r.zuweisung.map((z) => z.pflanzungId)).toEqual([P[3], P[1]]);
    expect(r.reserve).toEqual([P[2], P[4]]);
    expect(r.reserveBis).toBe('2027-01-18');
    expect(r.inBoxBis).toBeUndefined();
    expect(r.ohnePlatz).toEqual([]);
  });
});

describe('R6.1 Prüfung des Stationsschritts', () => {
  const alle = (station: KeimEingabe['station']): KeimEingabe => ({
    satzId: KEIM_SATZ,
    keimtempEingehalten: true,
    werte: P.slice(1, 7).map((p) => ({ pflanzungId: p, gekeimt: 2 })),
    station,
  });
  const pruefen = (t: ReturnType<typeof keimTeile>, e: KeimEingabe) =>
    keimEingabePruefen(t, e, KEIM_JETZT, ZEITZONE);
  const s = (pflanzung: string | undefined, kennung: string, lochNr: number) => ({
    pflanzungId: pflanzung as string,
    ...loch(kennung, lochNr),
  });

  it('R6.1 doppeltes oder falsches Loch abgelehnt', () => {
    const t = keimTeile();
    // gültig: sechs Schwämme auf 4.4 Loch 1 bis 6 (Z = 5 → höchstens 6)
    expect(pruefen(t, alle(P.slice(1, 7).map((p, i) => s(p, '4.4', i + 1))))).toEqual([]);
    // dasselbe Loch zweimal
    expect(pruefen(t, alle([s(P[1], '4.4', 1), s(P[2], '4.4', 1)])).length).toBeGreaterThan(0);
    // 8-cm-Loch für Salat
    expect(pruefen(t, alle([s(P[1], '4.2', 1)])).length).toBeGreaterThan(0);
    // kein Stationsplatz (Gefäss ohne feste Dosis)
    expect(pruefen(t, alle([s(P[1], '2.1', 1)])).length).toBeGreaterThan(0);
    // Loch ausserhalb des Deckels
    expect(pruefen(t, alle([s(P[1], '4.4', 14)])).length).toBeGreaterThan(0);
    // belegtes Loch
    expect(pruefen(belegt([['4.4', 1]]), alle([s(P[1], '4.4', 1)])).length).toBeGreaterThan(0);
    // über der Höchstzahl: ein Zieltopf → höchstens 2 auf 5 cm
    const einZiel = keimTeile({ zieltoepfe: ['2.3.1'] });
    expect(pruefen(einZiel, alle([s(P[1], '4.4', 1), s(P[2], '4.4', 2)]))).toEqual([]);
    expect(
      pruefen(einZiel, alle([s(P[1], '4.4', 1), s(P[2], '4.4', 2), s(P[3], '4.4', 3)])).length,
    ).toBeGreaterThan(0);
  });
});

describe('R6.1 Kapazität (b) nach dem Stationseintritt', () => {
  it('R6.1 Satz mit Stationseintritt zählt in der Belegung nur noch auf der Station', () => {
    const t = keimTeile();
    // vorher: 6 Schwämme in A1, Z = 5 → Bedarf min(6, 5 + 1) = 6 ab dem Keimtag 11.1.
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-12', [])[50]).toBe(6);
    // Schwamm 1 bis 5 auf 4.4, Schwamm 6 (Reserve) bleibt in der Box
    for (let i = 1; i <= 5; i += 1)
      ereignisDazu(t, {
        typ: 'verschieben',
        pflanzungId: P[i] as string,
        daten: { von_platz_id: platzId('A1'), nach_platz_id: platzId('4.4'), nach_loch_nr: i },
        giltAb: '2027-01-11T08:00:00.000Z',
      });
    pflanzSichtenNachrechnen(t);
    expect(
      (t['v_pflanzung_zustand'] ?? [])
        .filter((z) => z['platz_id'] === platzId('4.4'))
        .map((z) => z['loch_nr']),
    ).toEqual([1, 2, 3, 4, 5]);
    // nachher: nur die 5 auf der Station, die Reserve in der Box zählt nicht mehr
    expect(stationsBelegung(t, ANLAGE_R, '2027-01-12', [])[50]).toBe(5);
  });
});
