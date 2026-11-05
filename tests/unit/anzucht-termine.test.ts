// Termine eines neuen Satzes (Plan 23 Testliste; UC5-AK5, R1.6, TZ8, TZ). Injizierte Uhr, Zeitzone Europe/Zurich.
//
// Vertrag (Plan 23 «Domänenfunktionen»; Fälligkeiten nach use_cases_f4.md R5.2 und Konzept 7.5):
//   saatTermine(satz: { satzId; saatdatum; boxTyp?: 'box_licht' | 'box_dunkel'; direktsaat; keimart? },
//     keimdauer: { min?; typ? }, umsetzenAm: string | undefined, jetzt: Date, zeitzone)
//     : { termine: { typ: 'deckel_oeffnen' | 'abdeckung_entfernen' | 'keimung_pruefen' | 'umsetzen'; bezug: string;
//         faelligAm: string }[]; rueckdatiert: boolean }
//   Deckel öffnen (nur Dunkelkeimer-Box) und Abdeckung entfernen (nur Direktsaat Dunkelkeimer) = Saat + Keimdauer min;
//   Keimung prüfen = Saat + typische Keimdauer; Umsetzen am Umsetzdatum (nicht bei Direktsaat). Termine vor dem
//   Erfassungstag (Kalendertag Zürich von jetzt) liegen auf dem Erfassungstag (A15).
import { describe, expect, it } from 'vitest';
import { saatTermine } from '../../src/domain/anzucht/termine.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { uid } from '../fixtures/regal.ts';

const SATZ = uid('27', 70);
const dunkelBox = (saatdatum: string) => ({
  satzId: SATZ,
  saatdatum,
  boxTyp: 'box_dunkel' as const,
  direktsaat: false,
});
const lichtBox = (saatdatum: string) => ({
  satzId: SATZ,
  saatdatum,
  boxTyp: 'box_licht' as const,
  direktsaat: false,
});

const nachTyp = (r: ReturnType<typeof saatTermine>) =>
  Object.fromEntries(r.termine.map((t) => [t.typ, t.faelligAm])) as Record<string, string | undefined>;

describe('UC5-AK5 Rückdatierung (R1.6)', () => {
  it('UC5-AK5 Saat rückdatiert 1.1., erfasst 12.1.: kein Termin vor dem 12.1. (TZ8)', () => {
    const r = saatTermine(
      dunkelBox('2027-01-01'),
      { min: 4, typ: 6 },
      '2027-01-11',
      new Date('2027-01-12T08:00:00Z'),
      ZEITZONE,
    );
    expect(r.termine.map((t) => t.typ).sort()).toEqual(['deckel_oeffnen', 'keimung_pruefen', 'umsetzen']);
    for (const t of r.termine) expect(t.faelligAm, t.typ).toBe('2027-01-12');
    expect(r.rueckdatiert).toBe(true);
  });

  it('UC5-AK5 Termine ab dem Erfassungstag bleiben unverändert', () => {
    // Saat 10.1., Deckel 11.1. (vor dem 12.1.) → 12.1.; Keimung 14.1. und Umsetzen 31.1. bleiben
    const r = saatTermine(
      dunkelBox('2027-01-10'),
      { min: 1, typ: 4 },
      '2027-01-31',
      new Date('2027-01-12T08:00:00Z'),
      ZEITZONE,
    );
    expect(nachTyp(r)).toEqual({
      deckel_oeffnen: '2027-01-12',
      keimung_pruefen: '2027-01-14',
      umsetzen: '2027-01-31',
    });
  });

  it('UC5-AK5 Saat heute: Deckel öffnen nur bei Dunkelkeimer-Box, Keimung prüfen Saat + typische Keimdauer', () => {
    const jetzt = new Date('2027-01-07T08:00:00Z');
    const dunkel = saatTermine(dunkelBox('2027-01-07'), { min: 7, typ: 10 }, '2027-02-11', jetzt, ZEITZONE);
    expect(nachTyp(dunkel)).toEqual({
      deckel_oeffnen: '2027-01-14',
      keimung_pruefen: '2027-01-17',
      umsetzen: '2027-02-11',
    });
    expect(dunkel.rueckdatiert).toBe(false);
    const licht = saatTermine(lichtBox('2027-01-07'), { min: 2, typ: 4 }, '2027-01-28', jetzt, ZEITZONE);
    expect(nachTyp(licht)).toEqual({ keimung_pruefen: '2027-01-11', umsetzen: '2027-01-28' });
  });

  it('UC5-AK5 Erfassungstag ist der Kalendertag Zürich (TZ)', () => {
    // erfasst 11.1. 23:30 UTC = 12.1. 00:30 Zürich
    const r = saatTermine(
      lichtBox('2027-01-01'),
      { min: 2, typ: 6 },
      '2027-01-22',
      new Date('2027-01-11T23:30:00Z'),
      ZEITZONE,
    );
    expect(nachTyp(r)).toEqual({ keimung_pruefen: '2027-01-12', umsetzen: '2027-01-22' });
    expect(r.rueckdatiert).toBe(true);
  });
});

describe('R1.6 und R6.1 Termine je Anzuchtort', () => {
  it('R6.1 Direktsaat Dunkelkeimer: Abdeckung entfernen statt Deckel öffnen', () => {
    const jetzt = new Date('2027-01-07T08:00:00Z');
    const dunkel = saatTermine(
      { satzId: SATZ, saatdatum: '2027-01-07', direktsaat: true, keimart: 'dunkel' },
      { min: 7, typ: 10 },
      '2027-01-07',
      jetzt,
      ZEITZONE,
    );
    // Direktsaat: kein «Umsetzen» (Plan 23 Risiken)
    expect(nachTyp(dunkel)).toEqual({ abdeckung_entfernen: '2027-01-14', keimung_pruefen: '2027-01-17' });
    const licht = saatTermine(
      { satzId: SATZ, saatdatum: '2027-01-07', direktsaat: true, keimart: 'licht' },
      { min: 2, typ: 4 },
      '2027-01-07',
      jetzt,
      ZEITZONE,
    );
    expect(nachTyp(licht)).toEqual({ keimung_pruefen: '2027-01-11' });
  });

  it('R1.6 rueckdatiert gesetzt nur bei Saat vor dem Erfassungstag', () => {
    const heute = saatTermine(
      lichtBox('2027-01-12'),
      { min: 2, typ: 4 },
      '2027-02-02',
      new Date('2027-01-12T08:00:00Z'),
      ZEITZONE,
    );
    expect(heute.rueckdatiert).toBe(false);
    const frueher = saatTermine(
      lichtBox('2027-01-01'),
      { min: 2, typ: 4 },
      '2027-01-22',
      new Date('2027-01-12T08:00:00Z'),
      ZEITZONE,
    );
    expect(frueher.rueckdatiert).toBe(true);
  });
});
