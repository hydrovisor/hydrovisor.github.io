// Phasenprognose eines Satzes an einem Kalendertag (Plan 36 Testliste phasen-prognose.test.ts; Konzept R1.1, R1.5,
// R3.1, TZ5; Fachregeln G1, G2). Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone Europe/Zurich; Teile aus
// tests/fixtures/passung.ts (Dauern typisch: Keimung 6, Anzucht 21).
//
// Vertrag (Plan 36 «Schnittstellen»):
//   src/domain/phasen/prognose.ts
//     interface SatzBezug { satzId?: string; sorteId: string; kulturform: string; saatdatum: string; direktsaat: boolean }
//     phaseAm(teile, satz, tag: 'JJJJ-MM-TT', jetzt, zeitzone): Phase
//   Beginn der bestätigten Phase = Kalendertag (Zürich) des jüngsten phase_antwort {antwort: ja} des Satzes bis jetzt,
//   sonst Keimung ab Saatdatum; beginn + typ = erster Tag der nächsten Phase; entfaellt übersprungen; ohne typ bleibt die
//   Phase; nach dem Profilende die letzte Phase; vor dem Beginn die bestätigte Phase.
import { describe, expect, it } from 'vitest';
import { phasenStand } from '../../src/domain/phasen/fragen.ts';
import { phaseAm, type SatzBezug } from '../../src/domain/phasen/prognose.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { type Teile } from '../fixtures/regal.ts';
import {
  dauerSetzen,
  ereignisDazu,
  passungTeile,
  satzDazu,
  satzId,
  SORTE,
  sollwert,
  ZB_JETZT,
} from '../fixtures/passung.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;

const neuerSatz = (e: Partial<SatzBezug> = {}): SatzBezug => ({
  sorteId: SORTE.lollo,
  kulturform: 'kopf',
  saatdatum: '2027-01-01',
  direktsaat: false,
  ...e,
});

/** gespeicherter Satz Lollo Rossa (Nr. 20), gesät am saatdatum, in der Box */
function gespeichert(t: Teile, saatdatum = '2027-01-01', nr = 20): SatzBezug {
  satzDazu(t, { nr, sorte: 'lollo', saatdatum, phase: 'keimung', anzahl: 1 });
  return neuerSatz({ satzId: satzId(nr), saatdatum });
}

const antwort = (t: Teile, satz: string, phase: string, giltAb: string, ja = 'ja', storniertAm?: string) =>
  ereignisDazu(t, 'ereignis_satz', {
    typ: 'phase_antwort',
    satzId: satz,
    giltAb,
    daten: { phase, antwort: ja },
    ...(storniertAm ? { storniertAm } : {}),
  });

describe('TZ5 phaseAm aus typischen Dauern', () => {
  it('TZ5 phaseAm: Saat 1.1., Keimung typ 6, Anzucht typ 21 → 6.1. keimung, 7.1. anzucht, 27.1. anzucht, 28.1. wachstum', () => {
    const t = passungTeile();
    const s = gespeichert(t);
    expect(phaseAm(t, s, '2027-01-01', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2027-01-06', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2027-01-07', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-27', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-28', J, Z)).toBe('wachstum');
  });

  it('TZ5 phaseAm über den Jahreswechsel (Saat 20.12., Umsetzen 10.1.)', () => {
    const t = passungTeile();
    const s = gespeichert(t, '2026-12-20', 21);
    expect(phaseAm(t, s, '2026-12-25', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2026-12-26', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-10', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-15', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-16', J, Z)).toBe('wachstum');
  });

  it('phaseAm für neuen Satz ohne satzId rechnet ab Saatdatum', () => {
    const t = passungTeile();
    // Antworten anderer Sätze zählen nicht
    antwort(t, satzId(2), 'wachstum', '2027-01-02T08:00:00.000Z');
    const s = neuerSatz({ saatdatum: '2027-01-18' });
    expect(phaseAm(t, s, '2027-01-18', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2027-01-23', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2027-01-24', J, Z)).toBe('anzucht');
    // Umsetzen ab 21: 8.2. Anzucht, Wachstum ab 14.2.
    expect(phaseAm(t, s, '2027-02-08', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-02-13', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-02-14', J, Z)).toBe('wachstum');
  });

  it('phaseAm nach dem Profilende liefert die letzte Phase (babyleaf → wachstum)', () => {
    const t = passungTeile();
    const baby = neuerSatz({ sorteId: SORTE.rucola, kulturform: 'babyleaf' });
    expect(phaseAm(t, baby, '2027-01-28', J, Z)).toBe('wachstum');
    expect(phaseAm(t, baby, '2027-06-30', J, Z)).toBe('wachstum');
    // Dauerkultur Frucht läuft bis Fruchtbildung und Reife; ohne Dauer für Wachstum bleibt sie in Wachstum
    const tomate = neuerSatz({ sorteId: SORTE.ochsenherz, kulturform: 'dauerkultur_frucht' });
    expect(phaseAm(t, tomate, '2027-06-30', J, Z)).toBe('wachstum');
    t['v_sollwert']?.push(
      sollwert('ochsenherz', 'wachstum', 'dauer', { typ: 30 }),
      sollwert('ochsenherz', 'bluete', 'dauer', { typ: 20 }),
    );
    // 1.1. + 6 + 21 = 28.1. Wachstum, + 30 = 27.2. Blüte, + 20 = 19.3. Fruchtbildung und Reife (Profilende)
    expect(phaseAm(t, tomate, '2027-02-26', J, Z)).toBe('wachstum');
    expect(phaseAm(t, tomate, '2027-02-27', J, Z)).toBe('bluete');
    expect(phaseAm(t, tomate, '2027-03-19', J, Z)).toBe('fruchtbildung_reife');
    expect(phaseAm(t, tomate, '2027-12-31', J, Z)).toBe('fruchtbildung_reife');
  });

  it('phaseAm ohne typ bleibt in der Phase bis zum Profilende', () => {
    const t = dauerSetzen(passungTeile(), 'lollo', 'anzucht', undefined);
    const s = neuerSatz();
    expect(phaseAm(t, s, '2027-01-07', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-05-01', J, Z)).toBe('anzucht');
    // ohne Dauer für Keimung bleibt der Satz in Keimung
    const k = dauerSetzen(passungTeile(), 'lollo', 'keimung', undefined);
    expect(phaseAm(k, s, '2027-03-01', J, Z)).toBe('keimung');
  });

  it('R1.1 Phase mit anwendbar = entfaellt wird übersprungen', () => {
    const t = passungTeile();
    t['v_sollwert']?.push(sollwert('lollo', 'anzucht', 'anwendbar', { text: 'entfaellt' }));
    const s = neuerSatz();
    expect(phaseAm(t, s, '2027-01-06', J, Z)).toBe('keimung');
    expect(phaseAm(t, s, '2027-01-07', J, Z)).toBe('wachstum');
    expect(phaseAm(t, s, '2027-01-28', J, Z)).toBe('wachstum');
  });
});

describe('R1.5 bestätigte Phase', () => {
  it('R1.5 bestätigte Phase wachstum am 10.1. überstimmt die Prognose; Tag vor dem Beginn liefert die bestätigte Phase', () => {
    const t = passungTeile();
    const s = gespeichert(t);
    antwort(t, satzId(20), 'anzucht', '2027-01-05T08:00:00.000Z');
    antwort(t, satzId(20), 'wachstum', '2027-01-10T08:00:00.000Z');
    expect(phaseAm(t, s, '2027-01-10', J, Z)).toBe('wachstum');
    expect(phaseAm(t, s, '2027-01-18', J, Z)).toBe('wachstum');
    // keine Rückrechnung vor den Beginn der bestätigten Phase
    expect(phaseAm(t, s, '2027-01-09', J, Z)).toBe('wachstum');
    expect(phaseAm(t, s, '2027-01-02', J, Z)).toBe('wachstum');
  });

  it('R1.5 bestätigte Anzucht verschiebt die Prognose: Beginn 3.1. + 21 → Wachstum ab 24.1.', () => {
    const t = passungTeile();
    const s = gespeichert(t);
    antwort(t, satzId(20), 'anzucht', '2027-01-03T08:00:00.000Z');
    expect(phaseAm(t, s, '2027-01-23', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-24', J, Z)).toBe('wachstum');
  });

  it('R1.5 nur antwort ja zählt; stornierte Antworten und Antworten nach jetzt zählen nicht', () => {
    const t = passungTeile();
    const s = gespeichert(t);
    antwort(t, satzId(20), 'anzucht', '2027-01-03T08:00:00.000Z', 'noch_nicht');
    antwort(t, satzId(20), 'wachstum', '2027-01-08T08:00:00.000Z', 'ja', '2027-01-09T08:00:00.000Z');
    antwort(t, satzId(20), 'wachstum', '2027-01-20T08:00:00.000Z');
    // wie ohne Antwort: Prognose ab Saat 1.1.
    expect(phaseAm(t, s, '2027-01-07', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-27', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-28', J, Z)).toBe('wachstum');
  });

  it('TZ phase_antwort um 23:30 UTC zählt am Folgetag in Zürich', () => {
    const t = passungTeile();
    const s = gespeichert(t);
    // 2.1. 23:30 UTC = 3.1. 00:30 Zürich → Beginn Anzucht 3.1., Wachstum ab 24.1.
    antwort(t, satzId(20), 'anzucht', '2027-01-02T23:30:00.000Z');
    expect(phaseAm(t, s, '2027-01-23', J, Z)).toBe('anzucht');
    expect(phaseAm(t, s, '2027-01-24', J, Z)).toBe('wachstum');
  });

  it('phaseAm liest phase_antwort wie phasenStand (gleicher Satz, gleiche Phase heute)', () => {
    const t = passungTeile();
    const heute = '2027-01-18';
    // Satz 1 Lollo Rossa (gesät 1.12.2026) ohne Antwort, Satz 2 Eichblatt (gesät 12.1.) ohne Antwort
    const lollo = neuerSatz({ satzId: satzId(1), saatdatum: '2026-12-01' });
    const eichblatt = neuerSatz({ satzId: satzId(2), sorteId: SORTE.eichblatt, saatdatum: '2027-01-12' });
    expect(phaseAm(t, eichblatt, heute, J, Z)).toBe('anzucht');
    // phasenStand kennt nur die bestätigte Phase; ohne Antwort Keimung, mit Antwort dieselbe wie phaseAm
    antwort(t, satzId(1), 'wachstum', '2026-12-28T08:00:00.000Z');
    antwort(t, satzId(2), 'anzucht', '2027-01-17T08:00:00.000Z');
    for (const s of [lollo, eichblatt])
      expect(phaseAm(t, s, heute, J, Z)).toBe(phasenStand(t, s.satzId as string, J, Z)?.phase);
    expect(phaseAm(t, lollo, heute, J, Z)).toBe('wachstum');
    expect(phaseAm(t, eichblatt, heute, J, Z)).toBe('anzucht');
  });
});
