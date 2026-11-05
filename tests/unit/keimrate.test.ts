// Keimrate der Packung (Plan 24 Testliste; UC6-AK10, R12.2, G5). Neue Datei statt tests/unit/saatmenge.test.ts aus #23.
// Teile aus tests/fixtures/keimung.ts (Packung P1 0.85 und P2 0.6, beide Lollo Rossa; Uhr 2027-01-11T08:00:00Z,
// Zeitzone Europe/Zurich). Rechenwerte in Node nachgeprüft: 8.5 / 22 = 0.38636…, 8.5 / 1010 = 0.0084…,
// 1008.5 / 1010 = 0.9985…, 5 / 10 = 0.5 genau.
//
// Vertrag (Plan 24 «Domänenfunktionen»):
//   keimrateGeglaettet({ gesaet, gekeimt, pPackung?, pArt? }): { p; roh; herkunft; saatgutPruefen }
//     ab 10 Samen p = (gekeimt + 10 · p_Basis) / (gesät + 10), p_Basis = Packung, sonst Art; darunter p = p_Basis;
//     begrenzt 0.3 bis 0.98; roh = gekeimt / gesät nur bei gesät > 0; «Saatgut prüfen» bei gesät ≥ 10 und roh < 0.5
//   keimbilanz(teile, saatgutId, neu?): { gesaet; gekeimt } wie v_keimrate (je Pflanzung die jüngste nicht stornierte
//     Keimung, nur mit keimtemp_eingehalten, nur Datenart echt, Packung = satz.saatgut_id), mit den Schritten von neu
import { describe, expect, it } from 'vitest';
import { keimVorgang, type KeimEingabe } from '../../src/domain/pflanzung/keimung.ts';
import { keimbilanz, keimrateGeglaettet } from '../../src/domain/saatmenge/saatmenge.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { KEIM_JETZT, KEIM_PACKUNG, KEIM_SATZ, keimTeile, keimungDazu, P } from '../fixtures/keimung.ts';
import { uid } from '../fixtures/regal.ts';
import { pflanzSichtenNachrechnen, pflanzVorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = KEIM_JETZT;

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5e', n);
  };
}

const alle = (gekeimt: number, keimtemp = true): KeimEingabe => ({
  satzId: KEIM_SATZ,
  keimtempEingehalten: keimtemp,
  werte: P.slice(1, 7).map((p) => ({ pflanzungId: p, gekeimt })),
  station: [],
});

const rate = (t: Record<string, Record<string, unknown>[]>, saatgutId: string) =>
  t['v_keimrate']?.find((r) => r['saatgut_id'] === saatgutId);

describe('UC6-AK10 Keimrate nach der Keimprüfung', () => {
  it('UC6-AK10 0 von 12 bei Packung 0.85: geglättete Rate 8.5 / 22 = 0.39 innerhalb 0.3 bis 0.98', () => {
    const r = keimrateGeglaettet({ gesaet: 12, gekeimt: 0, pPackung: 0.85 });
    expect(r.p).toBeCloseTo(8.5 / 22, 10);
    expect(Number((r.p ?? 0).toFixed(2))).toBe(0.39);
    expect(r.p).toBeGreaterThanOrEqual(0.3);
    expect(r.p).toBeLessThanOrEqual(0.98);
    expect(r.herkunft).toBe('beobachtet');
    // Packungsangabe vor dem Standard der Art
    expect(keimrateGeglaettet({ gesaet: 12, gekeimt: 0, pPackung: 0.85, pArt: 0.5 }).p).toBeCloseTo(
      8.5 / 22,
      10,
    );
  });

  it('UC6-AK10 Rohrate 0 bei 12 Samen: Hinweis «Saatgut prüfen»', () => {
    const r = keimrateGeglaettet({ gesaet: 12, gekeimt: 0, pPackung: 0.85 });
    expect(r.roh).toBe(0);
    expect(r.saatgutPruefen).toBe(true);
    // 9 von 12 (0.75) ohne Hinweis
    expect(keimrateGeglaettet({ gesaet: 12, gekeimt: 9, pPackung: 0.85 }).saatgutPruefen).toBe(false);
  });

  it('UC6-AK10 0 Samen gesät: keine Division durch null, Packungsangabe gilt', () => {
    const r = keimrateGeglaettet({ gesaet: 0, gekeimt: 0, pPackung: 0.85 });
    expect(r.p).toBe(0.85);
    expect(Number.isFinite(r.p)).toBe(true);
    expect(r.roh).toBeUndefined();
    expect(r.herkunft).toBe('packung');
    expect(r.saatgutPruefen).toBe(false);
  });

  it('UC6-AK10 Satz 1 mit P1, Satz 2 mit P2: Keimprüfung von Satz 1 zählt bei P1, P2 unverändert', () => {
    const t0 = keimTeile({ zweiterSatz: true });
    const v = keimVorgang(t0, alle(0), neueIds(), JETZT, ZEITZONE);
    expect(v.length).toBeGreaterThan(0);
    expect(keimbilanz(t0, KEIM_PACKUNG.p1, v)).toEqual({ gesaet: 12, gekeimt: 0 });
    expect(keimbilanz(t0, KEIM_PACKUNG.p2, v)).toEqual({ gesaet: 0, gekeimt: 0 });
    const t = pflanzVorgangAnwenden(t0, v, JETZT);
    expect(keimbilanz(t, KEIM_PACKUNG.p1)).toEqual({ gesaet: 12, gekeimt: 0 });
    expect(keimbilanz(t, KEIM_PACKUNG.p2)).toEqual({ gesaet: 0, gekeimt: 0 });
    expect(rate(t, KEIM_PACKUNG.p2)).toMatchObject({ gesaet: 0, gekeimt: 0, rate_geglaettet: 0.6 });
    const p1 = rate(t, KEIM_PACKUNG.p1);
    expect(p1).toMatchObject({ gesaet: 12, gekeimt: 0 });
    // dieselbe Rate wie die Sicht (die Sicht ohne Begrenzung, hier innerhalb)
    const b = keimbilanz(t, KEIM_PACKUNG.p1);
    expect(keimrateGeglaettet({ ...b, pPackung: 0.85 }).p).toBeCloseTo(Number(p1?.['rate_geglaettet']), 10);
  });
});

describe('R12.2 Glättung und Bilanz', () => {
  it('R12.2 unter 10 Samen gilt die Packungsangabe, ohne Packung der Standard der Art', () => {
    expect(keimrateGeglaettet({ gesaet: 9, gekeimt: 0, pPackung: 0.85, pArt: 0.8 })).toMatchObject({
      p: 0.85,
      herkunft: 'packung',
    });
    expect(keimrateGeglaettet({ gesaet: 9, gekeimt: 0, pPackung: null, pArt: 0.8 })).toMatchObject({
      p: 0.8,
      herkunft: 'art',
    });
    // ab 10 Samen mit dem Standard der Art als Basis: (5 + 8) / 20 = 0.65
    expect(keimrateGeglaettet({ gesaet: 10, gekeimt: 5, pPackung: null, pArt: 0.8 }).p).toBeCloseTo(0.65, 10);
    const ohne = keimrateGeglaettet({ gesaet: 4, gekeimt: 2 });
    expect(ohne.p).toBeUndefined();
    expect(ohne.herkunft).toBeUndefined();
    expect(ohne.roh).toBe(0.5);
  });

  it('R12.2 Begrenzung 0.3 und 0.98', () => {
    // 8.5 / 1010 = 0.0084 → 0.3; 1008.5 / 1010 = 0.9985 → 0.98
    expect(keimrateGeglaettet({ gesaet: 1000, gekeimt: 0, pPackung: 0.85 }).p).toBe(0.3);
    expect(keimrateGeglaettet({ gesaet: 1000, gekeimt: 1000, pPackung: 0.85 }).p).toBe(0.98);
    expect(keimrateGeglaettet({ gesaet: 0, gekeimt: 0, pPackung: 0.1 }).p).toBe(0.3);
    expect(keimrateGeglaettet({ gesaet: 0, gekeimt: 0, pPackung: 1 }).p).toBe(0.98);
  });

  it('R12.2 Rohrate 0.5 bei 10 Samen: kein Hinweis (Grenze)', () => {
    expect(keimrateGeglaettet({ gesaet: 10, gekeimt: 5, pPackung: 0.85 })).toMatchObject({
      roh: 0.5,
      saatgutPruefen: false,
    });
    expect(keimrateGeglaettet({ gesaet: 10, gekeimt: 4, pPackung: 0.85 }).saatgutPruefen).toBe(true);
  });

  it('R12.2 4 von 9 Samen: kein Hinweis (unter 10)', () => {
    const r = keimrateGeglaettet({ gesaet: 9, gekeimt: 4, pPackung: 0.85 });
    expect(r.roh).toBeCloseTo(4 / 9, 10);
    expect(r.saatgutPruefen).toBe(false);
  });

  it('R12.2 keimbilanz zählt je Pflanzung nur die letzte Keimprüfung', () => {
    const t = keimTeile();
    // Schwamm 1: erst 0, dann 2 von 2
    keimungDazu(t, P[1] as string, { gekeimt: 0, giltAb: '2027-01-10T08:00:00.000Z' });
    keimungDazu(t, P[1] as string, { gekeimt: 2, giltAb: '2027-01-11T08:00:00.000Z' });
    // Schwamm 2: erst 2 von 2 mit Keimtemperatur, danach ohne: die jüngste zählt, also nichts (wie v_keimrate)
    keimungDazu(t, P[2] as string, { gekeimt: 2, giltAb: '2027-01-10T08:00:00.000Z' });
    keimungDazu(t, P[2] as string, { gekeimt: 1, keimtemp: false, giltAb: '2027-01-11T08:00:00.000Z' });
    pflanzSichtenNachrechnen(t);
    expect(keimbilanz(t, KEIM_PACKUNG.p1)).toEqual({ gesaet: 2, gekeimt: 2 });
    expect(rate(t, KEIM_PACKUNG.p1)).toMatchObject({ gesaet: 2, gekeimt: 2 });
  });

  it('R12.2 keimbilanz ohne stornierte Keimungen und ohne Demo-Anlagen (G5)', () => {
    const t = keimTeile();
    keimungDazu(t, P[1] as string, { gekeimt: 2, giltAb: '2027-01-11T08:00:00.000Z' });
    pflanzSichtenNachrechnen(t);
    // eine stornierte Keimung im Bündelteil zählt nicht
    (t['ereignis_pflanzung'] ??= []).push({
      id: uid('3e', 900),
      client_id: uid('3e', 900),
      typ: 'keimung',
      pflanzung_id: P[2],
      daten: { samen_gesaet: 2, samen_gekeimt: 2, keimtemp_eingehalten: true },
      gilt_ab: '2027-01-11T08:00:00.000Z',
      storniert_am: '2027-01-11T08:05:00.000Z',
    });
    expect(keimbilanz(t, KEIM_PACKUNG.p1)).toEqual({ gesaet: 2, gekeimt: 2 });

    const demo = keimTeile({ datenart: 'demo' });
    keimungDazu(demo, P[1] as string, { gekeimt: 2, giltAb: '2027-01-11T08:00:00.000Z' });
    pflanzSichtenNachrechnen(demo);
    expect(keimbilanz(demo, KEIM_PACKUNG.p1)).toEqual({ gesaet: 0, gekeimt: 0 });
    expect(rate(demo, KEIM_PACKUNG.p1)).toMatchObject({ gesaet: 0, gekeimt: 0 });
  });
});
