// Keimung prüfen: Ansicht, Eingabe, Zusammenfassung, Vorgang, Wiederherstellen und Aufgaben (Plan 24 Testliste; UC6-AK2,
// R1.7, R8.1, R8.2, R12.2, UC6, G5, TZ, TO2). Injizierte Uhr 2027-01-11T08:00:00Z, Zeitzone Europe/Zurich; Teile aus
// tests/fixtures/keimung.ts (Satz Lollo Rossa in A1, gesät 7.1., 6 Schwämme à 2 Samen, Packung P1 0.85, Zieltöpfe
// 2.3.1 bis 2.3.5 an Schwamm 1 bis 5, Schwamm 6 Reserve); Sichten nach dem Vorgang über pflanzVorgangAnwenden().
//
// Vertrag (Plan 24 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   keimAnsicht(teile, satzId, jetzt, zeitzone): KeimAnsicht | undefined (unbekannter Satz → undefined)
//   keimEingabePruefen(teile, eingabe, jetzt, zeitzone): Verstoss[] (leer = gültig); station [] ist gültig (die
//     gekeimten Schwämme bleiben in der Box)
//   keimZusammenfassung(teile, eingabe), keimVorgang(teile, eingabe, ids, jetzt, zeitzone) (bei Verstössen [])
//   wiederherstellenVorgang(teile, pflanzungId, ids, jetzt, zeitzone): { vorgang; hinweis? } (nicht erlaubt → [])
//   keimAufgaben(teile, jetzt, zeitzone), keimungOffen(teile, satzId, jetzt, zeitzone)
//   Ereignisse liest die Domäne aus dem Bündelteil ereignis_pflanzung (keimung, abschluss, wiederherstellen), die
//   früheren Reservierungen (auch beendete) aus dem Bündelteil reservierung (Tabelle, ohne Storno).
//   Offen sind nur Pflanzungen in der Phase keimung (Sätze, deren Pflanzungen schon in Anzucht oder Wachstum sind,
//   erzeugen keine Keimaufgabe).
import { describe, expect, it } from 'vitest';
import { gefaessAnsicht } from '../../src/domain/anlage/gefaess.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  keimAnsicht,
  keimAufgaben,
  keimEingabePruefen,
  keimungOffen,
  keimVorgang,
  keimZusammenfassung,
  wiederherstellenVorgang,
  type KeimEingabe,
} from '../../src/domain/pflanzung/keimung.ts';
import { zieltoepfe } from '../../src/domain/pflanzung/saeen.ts';
import { keimbilanz } from '../../src/domain/saatmenge/saatmenge.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  ereignisDazu,
  KEIM_JETZT,
  KEIM_PACKUNG,
  KEIM_SATZ,
  keimTeile,
  keimungDazu,
  P,
  pflanzungId,
  reservierungId,
  satzAnlegen,
} from '../fixtures/keimung.ts';
import { netztopfId, platzId, uid, type Teile } from '../fixtures/regal.ts';
import { aufStation, SORTE } from '../fixtures/saeen.ts';
import { pflanzSichtenNachrechnen, pflanzVorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = KEIM_JETZT;
const SPAETER = new Date('2027-01-12T08:00:00Z');
const Z = ZEITZONE;

function neueIds(praefix = '5b'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);
const ereignisse = (v: Vorgang, typ?: string) => neue(v).filter((f) => typ === undefined || f['typ'] === typ);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;

/** Werte in Schwammfolge für die angegebenen Pflanzungen (Standard P1 bis P6) */
function eingabe(
  werte: (number | 'offen')[],
  e: Partial<KeimEingabe> = {},
  pflanzungen: readonly string[] = P.slice(1, 7),
): KeimEingabe {
  return {
    satzId: KEIM_SATZ,
    keimtempEingehalten: true,
    werte: werte.map((w, i) => ({ pflanzungId: pflanzungen[i] as string, gekeimt: w })),
    station: [],
    ...e,
  };
}

const ansicht = (t: Teile, jetzt = JETZT) => {
  const a = keimAnsicht(t, KEIM_SATZ, jetzt, Z);
  if (!a) throw new Error('keimAnsicht ohne Ergebnis');
  return a;
};
const vorgang = (t: Teile, e: KeimEingabe, jetzt = JETZT) => keimVorgang(t, e, neueIds(), jetzt, Z);
const pruefen = (t: Teile, e: KeimEingabe) => keimEingabePruefen(t, e, JETZT, Z);
const aktiveToepfe = (t: Teile) =>
  (t['v_reservierung_aktiv'] ?? []).map((r) => r['netztopf_id'] as string).sort();

/** Satz nach der Prüfung mit 2, 2, 1, 2, 0, 2 (Schwamm 5 keimt nicht), ohne Station */
function nachKeimtNicht(): { t: Teile; v: Vorgang; abschlussId: string } {
  const t0 = keimTeile();
  const v = vorgang(t0, eingabe([2, 2, 1, 2, 0, 2]));
  const abschluss = ereignisse(v, 'abschluss')[0];
  return { t: pflanzVorgangAnwenden(t0, v, JETZT), v, abschlussId: String(abschluss?.['id']) };
}

describe('UC6-AK2 Keimung je Schwamm', () => {
  it('UC6-AK2 6 Schwämme à 2 Samen, Eingaben 2, 2, 1, 2, 0, 2: 9 von 12 Samen (75 %), 1 Schwamm keimt nicht', () => {
    const t = keimTeile();
    const a = ansicht(t);
    expect(a).toMatchObject({
      satzId: KEIM_SATZ,
      sorte: 'Lollo Rossa',
      kulturform: 'kopf',
      ort: { platzId: platzId('A1'), kennung: 'A1', code: 'R-A1', direktsaat: false },
      saatdatum: '2027-01-07',
      tagSeitSaat: 4,
      keimdauer: { min: 2, typ: 4, max: 7 },
      datenart: 'echt',
    });
    expect(a.schwaemme.map((s) => [s.nr, s.pflanzungId, s.samen, s.zustand, s.zieltopf?.kennung])).toEqual([
      [1, P[1], 2, 'offen', '2.3.1'],
      [2, P[2], 2, 'offen', '2.3.2'],
      [3, P[3], 2, 'offen', '2.3.3'],
      [4, P[4], 2, 'offen', '2.3.4'],
      [5, P[5], 2, 'offen', '2.3.5'],
      [6, P[6], 2, 'offen', undefined],
    ]);
    const e = eingabe([2, 2, 1, 2, 0, 2]);
    expect(pruefen(t, e)).toEqual([]);
    const z = keimZusammenfassung(t, e);
    expect(z).toMatchObject({
      gesaet: 12,
      gekeimt: 9,
      keimtNicht: 1,
      freieZieltoepfe: ['2.3.5'],
      offen: 0,
      nachsaeen: [],
    });
    expect(z.anteil).toBeCloseTo(0.75, 10);
    expect(z.text).toContain('9 von 12 Samen (75 %)');
    expect(z.text).toContain('1 Schwamm keimt nicht');
    expect(z.text).toContain('Zieltopf 2.3.5 wird frei');
    // unbekannter Satz
    expect(keimAnsicht(t, uid('27', 99), JETZT, Z)).toBeUndefined();
  });

  it('UC6-AK2 Schwamm mit 0 erhält Abschluss keimt_nicht, seine Reservierung endet und der Zieltopf ist wieder frei', () => {
    const t0 = keimTeile();
    const loch5 = (t: Teile) => zieltoepfe(t, platzId('2.3'), new Map()).find((z) => z.lochNr === 5)?.zustand;
    expect(loch5(t0)).toBe('reserviert');
    const v = vorgang(t0, eingabe([2, 2, 1, 2, 0, 2]));
    const abschluesse = ereignisse(v, 'abschluss');
    expect(abschluesse).toHaveLength(1);
    expect(abschluesse[0]?.['pflanzung_id']).toBe(P[5]);
    expect(daten(abschluesse[0])['grund']).toBe('keimt_nicht');

    const t = pflanzVorgangAnwenden(t0, v, JETZT);
    expect(aktiveToepfe(t)).toEqual(['2.3.1', '2.3.2', '2.3.3', '2.3.4'].map((k) => netztopfId(k)).sort());
    expect((t['v_reservierung_aktiv'] ?? []).map((r) => r['pflanzung_id'])).not.toContain(P[5]);
    expect(loch5(t)).toBe('frei');
    const zustand = (t['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === P[5]);
    expect(zustand?.['status']).toBe('keimt_nicht');
    // in der Ansicht: Schwamm 5 keimt nicht, wiederherstellbar, Tag des Abschlusses
    const s5 = ansicht(t).schwaemme.find((s) => s.pflanzungId === P[5]);
    expect(s5).toMatchObject({
      nr: 5,
      zustand: 'keimt_nicht',
      gekeimt: 0,
      abschluss: { ereignisId: abschluesse[0]?.['id'], tag: '2027-01-11', wiederherstellbar: true },
    });
  });

  it('UC6-AK2 Keimtemperatur nein: Keimung gespeichert, Bilanz der Packung unverändert', () => {
    const t0 = keimTeile();
    const e = eingabe([2, 2, 1, 2, 0, 2], { keimtempEingehalten: false });
    expect(pruefen(t0, e)).toEqual([]);
    const v = vorgang(t0, e);
    const keimungen = ereignisse(v, 'keimung');
    expect(keimungen).toHaveLength(6);
    for (const k of keimungen) expect(daten(k)['keimtemp_eingehalten']).toBe(false);
    expect(keimbilanz(t0, KEIM_PACKUNG.p1)).toEqual({ gesaet: 0, gekeimt: 0 });
    expect(keimbilanz(t0, KEIM_PACKUNG.p1, v)).toEqual({ gesaet: 0, gekeimt: 0 });
    const t = pflanzVorgangAnwenden(t0, v, JETZT);
    expect(keimbilanz(t, KEIM_PACKUNG.p1)).toEqual({ gesaet: 0, gekeimt: 0 });
    expect((t['v_keimrate'] ?? []).find((r) => r['saatgut_id'] === KEIM_PACKUNG.p1)).toMatchObject({
      gesaet: 0,
      gekeimt: 0,
    });
  });

  it('UC6-AK2 Keimtemperatur ja: Samen zählen für die Packung der Pflanzung', () => {
    const t0 = keimTeile();
    const v = vorgang(t0, eingabe([2, 2, 1, 2, 0, 2]));
    expect(keimbilanz(t0, KEIM_PACKUNG.p1, v)).toEqual({ gesaet: 12, gekeimt: 9 });
    const t = pflanzVorgangAnwenden(t0, v, JETZT);
    expect(keimbilanz(t, KEIM_PACKUNG.p1)).toEqual({ gesaet: 12, gekeimt: 9 });
    expect((t['v_keimrate'] ?? []).find((r) => r['saatgut_id'] === KEIM_PACKUNG.p1)).toMatchObject({
      gesaet: 12,
      gekeimt: 9,
    });
    // die Packung der Sorte mit dem jüngsten Kauf (0.9) bleibt unberührt
    expect(keimbilanz(t, uid('29', 1))).toEqual({ gesaet: 0, gekeimt: 0 });
  });

  it('UC6-AK2 je eingetragenem Schwamm ein Ereignis keimung mit samen_gesaet, samen_gekeimt, keimtemp_eingehalten; übersprungene ohne Ereignis', () => {
    const t = keimTeile();
    const e = eingabe([2, 'offen', 1, 2, 0, 'offen']);
    expect(pruefen(t, e)).toEqual([]);
    const v = vorgang(t, e);
    expect(vorgangPruefen(v)).toEqual([]);
    const keimungen = ereignisse(v, 'keimung');
    expect(keimungen.map((k) => k['pflanzung_id'])).toEqual([P[1], P[3], P[4], P[5]]);
    expect(keimungen.map((k) => daten(k)['samen_gekeimt'])).toEqual([2, 1, 2, 0]);
    for (const k of keimungen) {
      expect(daten(k)).toMatchObject({ samen_gesaet: 2, keimtemp_eingehalten: true });
      // erste Prüfung des Satzes: vorherige_pruefung_am nicht gesetzt (A5)
      expect(daten(k)['vorherige_pruefung_am'] ?? null).toBeNull();
    }
    expect(v.every((s) => s.tabelle === 'ereignis')).toBe(true);
    // Teilergebnis: zwei Schwämme bleiben offen
    expect(keimZusammenfassung(t, e)).toMatchObject({ gesaet: 8, gekeimt: 5, offen: 2, keimtNicht: 1 });
  });

  it('UC6-AK2 ohne Angabe zur Keimtemperatur abgelehnt, ohne Schritte', () => {
    const t = keimTeile();
    const ohne = eingabe([2, 2, 1, 2, 0, 2], { keimtempEingehalten: undefined });
    expect(pruefen(t, ohne).length).toBeGreaterThan(0);
    expect(vorgang(t, ohne)).toEqual([]);
    // ohne einen einzigen Wert ebenso
    const leer = eingabe(['offen', 'offen', 'offen', 'offen', 'offen', 'offen']);
    expect(pruefen(t, leer).length).toBeGreaterThan(0);
    expect(vorgang(t, leer)).toEqual([]);
  });
});

describe('R8.1 und R12.2 Vorgang', () => {
  it('R8.1 Schwämme mit Zieltopf zuerst nach Topfkennung, dann nach id', () => {
    // Zieltopf 2.3.6 an Pflanzung 2, 2.3.2 an Pflanzung 4; die übrigen Reserve
    const t = keimTeile({ zieltoepfe: [] });
    t['satz'] = [];
    t['pflanzung'] = [];
    t['reservierung'] = [];
    t['v_pflanzung_zustand'] = [];
    satzAnlegen(t, {
      nr: 80,
      box: 'A1',
      schwaemme: 6,
      samen: 2,
      zuordnung: [
        [2, '2.3.6'],
        [4, '2.3.2'],
      ],
    });
    pflanzSichtenNachrechnen(t);
    expect(ansicht(t).schwaemme.map((s) => [s.nr, s.pflanzungId, s.zieltopf?.kennung])).toEqual([
      [1, P[4], '2.3.2'],
      [2, P[2], '2.3.6'],
      [3, P[1], undefined],
      [4, P[3], undefined],
      [5, P[5], undefined],
      [6, P[6], undefined],
    ]);
    expect(ansicht(t).schwaemme[0]?.zieltopf?.netztopfId).toBe(netztopfId('2.3.2'));
  });

  it('R8.1 Vorgang in Reihenfolge keimung, abschluss, verschieben mit id = client_id und gilt_ab = jetzt', () => {
    const t = keimTeile();
    const station = [P[1], P[2], P[3], P[4], P[6]].map((p, i) => ({
      pflanzungId: p as string,
      platzId: platzId('4.4'),
      lochNr: i + 1,
    }));
    const e = eingabe([2, 2, 1, 2, 0, 2], { station });
    expect(pruefen(t, e)).toEqual([]);
    const v = vorgang(t, e);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v).map((f) => [f['typ'], f['pflanzung_id']])).toEqual([
      ['keimung', P[1]],
      ['keimung', P[2]],
      ['keimung', P[3]],
      ['keimung', P[4]],
      ['keimung', P[5]],
      ['abschluss', P[5]],
      ['keimung', P[6]],
      ['verschieben', P[1]],
      ['verschieben', P[2]],
      ['verschieben', P[3]],
      ['verschieben', P[4]],
      ['verschieben', P[6]],
    ]);
    for (const f of neue(v)) {
      expect(f['id']).toBe(f.client_id);
      expect(Date.parse(String(f['gilt_ab']))).toBe(JETZT.getTime());
    }
    const ids = neue(v).map((f) => f.client_id);
    expect(new Set(ids).size).toBe(ids.length);
    // Stationseintritt: von der Box auf 4.4, ohne Netztopf (A8)
    ereignisse(v, 'verschieben').forEach((f, i) => {
      expect(daten(f)).toMatchObject({
        von_platz_id: platzId('A1'),
        nach_platz_id: platzId('4.4'),
        nach_loch_nr: i + 1,
      });
      expect(f['netztopf_id'] ?? null).toBeNull();
    });
    // danach in v_pflanzung_zustand auf 4.4
    const nach = pflanzVorgangAnwenden(t, v, JETZT);
    const z1 = (nach['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === P[1]);
    expect(z1).toMatchObject({ platz_id: platzId('4.4'), loch_nr: 1, status: 'aktiv' });
    expect(ansicht(nach).schwaemme.find((s) => s.pflanzungId === P[1])).toMatchObject({
      zustand: 'erledigt',
      gekeimt: 2,
      station: { platzId: platzId('4.4'), kennung: '4.4', lochNr: 1 },
    });
  });

  it('R12.2 vorherige_pruefung_am = Tag der letzten Keimprüfung des Satzes, bei der ersten nicht gesetzt', () => {
    // erste Prüfung am 9.1. 23:30 UTC = 10.1. 00:30 Zürich für Schwamm 1 bis 4 (TZ); 5 und 6 offen
    const t = keimTeile();
    for (const p of [P[1], P[2], P[3], P[4]])
      keimungDazu(t, p as string, { gekeimt: 2, giltAb: '2027-01-09T23:30:00.000Z' });
    pflanzSichtenNachrechnen(t);
    expect(
      ansicht(t)
        .schwaemme.filter((s) => s.zustand === 'offen')
        .map((s) => s.pflanzungId),
    ).toEqual([P[5], P[6]]);
    const v = vorgang(t, eingabe([2, 1], {}, [P[5] as string, P[6] as string]));
    const keimungen = ereignisse(v, 'keimung');
    expect(keimungen).toHaveLength(2);
    for (const k of keimungen) expect(daten(k)['vorherige_pruefung_am']).toBe('2027-01-10');
  });
});

describe('R1.7 und R8.2 Wiederherstellen', () => {
  it('R1.7 Wiederherstellen schreibt wiederherstellen mit ereignis_id = id des Abschlusses', () => {
    const { t, abschlussId } = nachKeimtNicht();
    const { vorgang: w, hinweis } = wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), SPAETER, Z);
    expect(hinweis).toBeUndefined();
    expect(vorgangPruefen(w)).toEqual([]);
    const neu = neue(w);
    expect(neu).toHaveLength(1);
    expect(neu[0]).toMatchObject({ typ: 'wiederherstellen', pflanzung_id: P[5] });
    expect(neu[0]?.['id']).toBe(neu[0]?.client_id);
    expect(daten(neu[0])['ereignis_id']).toBe(abschlussId);
    expect(w.every((s) => s.art === 'neu')).toBe(true);
    // danach ist die Reservierung wieder aktiv und der Schwamm aktiv
    const nach = pflanzVorgangAnwenden(t, w, SPAETER);
    expect(aktiveToepfe(nach)).toContain(netztopfId('2.3.5'));
    expect((nach['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === P[5])?.['status']).toBe(
      'aktiv',
    );
  });

  it('R1.7 Wiederherstellen am 7. Kalendertag erlaubt, am 8. nicht (TZ)', () => {
    const { t } = nachKeimtNicht();
    // Abschluss am 11.1. (Zürich); 18.1. 23:30 Zürich = 22:30 UTC → Tag 7; 19.1. 00:30 Zürich = 18.1. 23:30 UTC → Tag 8
    const tag7 = new Date('2027-01-18T22:30:00Z');
    const tag8 = new Date('2027-01-18T23:30:00Z');
    expect(wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), tag7, Z).vorgang).toHaveLength(1);
    expect(wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), tag8, Z).vorgang).toEqual([]);
    expect(ansicht(t, tag7).schwaemme.find((s) => s.pflanzungId === P[5])?.abschluss?.wiederherstellbar).toBe(
      true,
    );
    expect(ansicht(t, tag8).schwaemme.find((s) => s.pflanzungId === P[5])?.abschluss?.wiederherstellbar).toBe(
      false,
    );
  });

  it('R1.7 Wiederherstellen nur für keimt_nicht ohne bestehendes Wiederherstellen', () => {
    const { t } = nachKeimtNicht();
    // aktiver Schwamm: nichts wiederherzustellen
    expect(wiederherstellenVorgang(t, P[1] as string, neueIds('5c'), SPAETER, Z).vorgang).toEqual([]);
    // Ausfall ist ein anderer Endzustand (I2)
    ereignisDazu(t, {
      typ: 'abschluss',
      pflanzungId: P[6] as string,
      daten: { grund: 'ausfall' },
      giltAb: '2027-01-11T09:00:00.000Z',
    });
    pflanzSichtenNachrechnen(t);
    expect(wiederherstellenVorgang(t, P[6] as string, neueIds('5c'), SPAETER, Z).vorgang).toEqual([]);
    // schon wiederhergestellt: kein zweites Mal
    const { vorgang: w } = wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), SPAETER, Z);
    expect(w).toHaveLength(1);
    const nach = pflanzVorgangAnwenden(t, w, SPAETER);
    expect(wiederherstellenVorgang(nach, P[5] as string, neueIds('5d'), SPAETER, Z).vorgang).toEqual([]);
  });

  it('R8.2 Wiederherstellen bei inzwischen vergebenem Zieltopf storniert die alte Reservierung mit Hinweis', () => {
    const { t } = nachKeimtNicht();
    // ein neuer Satz reserviert 2.3.5 nach dem Abschluss
    satzAnlegen(t, {
      nr: 81,
      box: 'A1',
      schwaemme: 1,
      samen: 1,
      saatdatum: '2027-01-11',
      zieltoepfe: ['2.3.5'],
    });
    pflanzSichtenNachrechnen(t);
    const auf235 = (x: Teile) =>
      (x['v_reservierung_aktiv'] ?? []).filter((r) => r['netztopf_id'] === netztopfId('2.3.5'));
    expect(auf235(t).map((r) => r['pflanzung_id'])).toEqual([pflanzungId(81, 1)]);

    const { vorgang: w, hinweis } = wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), SPAETER, Z);
    expect(hinweis).toMatch(/Zieltopf 2\.3\.5 inzwischen vergeben: Schwamm 5 ohne Zieltopf/);
    expect(w).toContainEqual({
      art: 'storno',
      tabelle: 'reservierung',
      clientId: reservierungId(80, 5),
      grund: 'korrektur',
    });
    expect(neue(w).map((f) => f['typ'])).toEqual(['wiederherstellen']);
    const nach = pflanzVorgangAnwenden(t, w, SPAETER);
    // nie zwei aktive Reservierungen auf einem Topf
    expect(auf235(nach).map((r) => r['pflanzung_id'])).toEqual([pflanzungId(81, 1)]);
    expect((nach['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === P[5])?.['status']).toBe(
      'aktiv',
    );
    expect(ansicht(nach, SPAETER).schwaemme.find((s) => s.pflanzungId === P[5])?.zieltopf).toBeUndefined();
  });

  it('UC6 wiederhergestellter Schwamm ist offen und vorbelegt', () => {
    const { t } = nachKeimtNicht();
    const { vorgang: w } = wiederherstellenVorgang(t, P[5] as string, neueIds('5c'), SPAETER, Z);
    const nach = pflanzVorgangAnwenden(t, w, SPAETER);
    const s5 = ansicht(nach, SPAETER).schwaemme.find((s) => s.pflanzungId === P[5]);
    expect(s5).toMatchObject({ nr: 5, zustand: 'offen', samen: 2, zieltopf: { kennung: '2.3.5' } });
    expect(s5?.abschluss).toBeUndefined();
    // neu eingetragen: die letzte Keimprüfung ersetzt die Keimung mit 0 (A9)
    const neu = eingabe([2], {}, [P[5] as string]);
    expect(keimEingabePruefen(nach, neu, SPAETER, Z)).toEqual([]);
    const v = keimVorgang(nach, neu, neueIds('5d'), SPAETER, Z);
    expect(ereignisse(v, 'abschluss')).toEqual([]);
    expect(daten(ereignisse(v, 'keimung')[0])['vorherige_pruefung_am']).toBe('2027-01-11');
    expect(keimbilanz(pflanzVorgangAnwenden(nach, v, SPAETER), KEIM_PACKUNG.p1)).toEqual({
      gesaet: 12,
      gekeimt: 11,
    });
  });
});

describe('UC6 Eingabe und Varianten', () => {
  it('UC6 erledigte Schwämme sind nicht änderbar', () => {
    const t0 = keimTeile();
    const t = pflanzVorgangAnwenden(t0, vorgang(t0, eingabe([2, 2, 1, 2, 'offen', 'offen'])), JETZT);
    expect(ansicht(t).schwaemme.map((s) => s.zustand)).toEqual([
      'erledigt',
      'erledigt',
      'erledigt',
      'erledigt',
      'offen',
      'offen',
    ]);
    const nochmal = eingabe([1], {}, [P[1] as string]);
    expect(pruefen(t, nochmal).length).toBeGreaterThan(0);
    expect(vorgang(t, nochmal)).toEqual([]);
    // Pflanzung eines anderen Satzes ebenso
    const fremd = keimTeile({ zweiterSatz: true });
    const andere = eingabe([1], {}, [pflanzungId(81, 1)]);
    expect(pruefen(fremd, andere).length).toBeGreaterThan(0);
  });

  it('UC6 Wert über samen_je_schwamm oder unter 0 abgelehnt', () => {
    const t = keimTeile();
    for (const w of [3, -1, 1.5]) {
      const e = eingabe([2, 2, 2, 2, 2, w]);
      expect(pruefen(t, e).length, String(w)).toBeGreaterThan(0);
      expect(vorgang(t, e), String(w)).toEqual([]);
    }
    expect(pruefen(t, eingabe([2, 2, 2, 2, 2, 0]))).toEqual([]);
    expect(pruefen(t, eingabe([2, 2, 2, 2, 2, 2]))).toEqual([]);
  });

  it('UC6 Direktsaat: kein Stationsschritt, Hinweis Nachsäen mit Loch', () => {
    const t = keimTeile({ direktsaat: true });
    const vier = P.slice(1, 5);
    expect(ansicht(t).ort).toMatchObject({ kennung: '3.1', code: 'R-3.1', direktsaat: true });
    const e = eingabe([2, 2, 2, 0], {}, vier);
    expect(pruefen(t, e)).toEqual([]);
    const mitStation = eingabe(
      [2, 2, 2, 0],
      { station: [{ pflanzungId: P[1] as string, platzId: platzId('4.4'), lochNr: 1 }] },
      vier,
    );
    expect(pruefen(t, mitStation).length).toBeGreaterThan(0);
    expect(keimZusammenfassung(t, e).nachsaeen).toContain('Nachsäen in 3.1: Loch 4');
    const v = vorgang(t, e);
    expect(ereignisse(v, 'verschieben')).toEqual([]);
    expect(ereignisse(v, 'abschluss').map((f) => f['pflanzung_id'])).toEqual([P[4]]);
    expect(ereignisse(v, 'keimung')).toHaveLength(4);
  });

  it('UC6 Demo-Anlage: Hinweis «Keimrate zählt nur in echten Anlagen» (G5)', () => {
    const t = keimTeile({ datenart: 'demo' });
    const a = ansicht(t);
    expect(a.datenart).toBe('demo');
    expect(a.hinweise).toContain('Keimrate zählt nur in echten Anlagen');
    const v = vorgang(t, eingabe([2, 2, 1, 2, 0, 2]));
    expect(ereignisse(v, 'keimung')).toHaveLength(6);
    expect(keimbilanz(t, KEIM_PACKUNG.p1, v)).toEqual({ gesaet: 0, gekeimt: 0 });
    // in der echten Anlage kein solcher Hinweis
    expect(ansicht(keimTeile()).hinweise).not.toContain('Keimrate zählt nur in echten Anlagen');
  });

  it('UC6 keimAufgaben: Satz am Saat + typische Keimdauer fällig, vorher nicht', () => {
    const t = keimTeile();
    const fuer = (jetzt: Date) => keimAufgaben(t, jetzt, Z).filter((a) => a.satzId === KEIM_SATZ);
    // 10.1. 09:00 Zürich: noch nicht (7.1. + 4 = 11.1.)
    expect(fuer(new Date('2027-01-10T08:00:00Z'))).toEqual([]);
    const [aufgabe, ...mehr] = fuer(JETZT);
    expect(mehr).toEqual([]);
    expect(aufgabe).toMatchObject({ satzId: KEIM_SATZ, ort: 'R-A1', faelligAm: '2027-01-11' });
    expect(aufgabe?.text).toContain('Lollo Rossa');
    // nach der vollständigen Prüfung keine Aufgabe mehr
    const fertig = pflanzVorgangAnwenden(t, vorgang(t, eingabe([2, 2, 1, 2, 0, 2])), JETZT);
    expect(keimAufgaben(fertig, JETZT, Z).filter((a) => a.satzId === KEIM_SATZ)).toEqual([]);
  });

  it('UC6 keimAufgaben ohne Sätze, deren Pflanzungen die Phase Keimung verlassen haben', () => {
    const t = keimTeile();
    // Rucola seit 30.12. auf der Station in Phase Anzucht, ohne Keimungsereignis (wie Fixtures früherer Pakete)
    aufStation(t, { satzNr: 50, sorteId: SORTE.rucola, saatdatum: '2026-12-30', loecher: [['4.4', 10]] });
    pflanzSichtenNachrechnen(t);
    const saetze = keimAufgaben(t, JETZT, Z).map((a) => a.satzId);
    expect(saetze).toContain(KEIM_SATZ);
    expect(saetze).not.toContain(uid('27', 50));
  });

  it('UC6 keimungOffen für Box mit offenen oder ungestellten Schwämmen', () => {
    const t0 = keimTeile();
    expect(keimungOffen(t0, KEIM_SATZ, JETZT, Z)).toBe(true);
    const knopf = (t: Teile) =>
      (
        gefaessAnsicht(t, 'R-A1', JETZT, Z)?.pflanzen.find((p) => p.satzId === KEIM_SATZ) as
          { keimung?: boolean } | undefined
      )?.keimung;
    expect(knopf(t0)).toBe(true);
    // alle eingetragen, aber ohne Stationsplatz: weiter offen (gekeimte Schwämme in der Box)
    const ohneStation = pflanzVorgangAnwenden(t0, vorgang(t0, eingabe([2, 2, 2, 2, 2, 2])), JETZT);
    expect(keimungOffen(ohneStation, KEIM_SATZ, JETZT, Z)).toBe(true);
    expect(knopf(ohneStation)).toBe(true);
    // alle eingetragen und auf 4.4 gestellt (5 Zieltöpfe → höchstens 6 auf 5 cm): nicht mehr offen
    const station = P.slice(1, 7).map((p, i) => ({ pflanzungId: p, platzId: platzId('4.4'), lochNr: i + 1 }));
    const e = eingabe([2, 2, 2, 2, 2, 2], { station });
    expect(pruefen(t0, e)).toEqual([]);
    const fertig = pflanzVorgangAnwenden(t0, vorgang(t0, e), JETZT);
    expect(keimungOffen(fertig, KEIM_SATZ, JETZT, Z)).toBe(false);
    expect(knopf(fertig)).toBeFalsy();
  });

  it('TO2 gleiche Eingabe und IDs ergeben gleiche Schritte', () => {
    const t = keimTeile();
    const station = [{ pflanzungId: P[1] as string, platzId: platzId('4.4'), lochNr: 1 }];
    const e = eingabe([2, 2, 1, 2, 0, 2], { station });
    const eins = vorgang(t, e);
    const zwei = vorgang(t, e);
    expect(eins.length).toBeGreaterThan(0);
    expect(zwei).toEqual(eins);
    const ids = neue(eins).map((f) => f.client_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
