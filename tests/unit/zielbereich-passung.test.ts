// Zielbereich für den Zweck «Passung» und Band-Hilfen (Plan 36 Testliste zielbereich-passung.test.ts; Konzept R2.1,
// R2.2 Zeile Passung, R2.4, R3.2 Mindestbreiten; Fachregeln G1, G2, G6, R10.1). Injizierte Uhr ZB_JETZT (Mo 18.1.2027
// 09:00 Zürich), Zeitzone Europe/Zurich; Teile aus tests/fixtures/passung.ts. Keine Wiederholung der Fälle aus
// zielbereich.test.ts; Randwerte je Band-Hilfe für den Mutationstest über src/domain/zielbereich*.ts.
//
// Vertrag (Plan 36 «Schnittstellen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/zielbereich-passung.ts
//     bandSchnitt(a?, b?): Band | undefined     max der Minima, min der Maxima; eine Seite fehlt → undefined
//     istLeer(b): boolean                         min > max
//     restbreite(b): number                       max(0, max − min) in Hundertsteln
//     bandmitte(b): number                        Math.round((min + max) / 2) in Hundertsteln
//     mindestbreiteEc(uEc): number                max(30, 2 · uEc), uEc in Hundertsteln
//     MINDESTBREITE_PH = 30
//     uEcVon(teile): number                       messgeraet.u_ec der ersten Zeile ohne storniert_am in Hundertsteln,
//                                                 sonst 10 (G6)
//     zaehlendeFuerPassung(teile, platzId, stichtag, jetzt, zeitzone, ohne?): ZaehlendePflanzung[]
//     zielbereichPassung(teile, platzId, stichtag, jetzt, zeitzone, ohne?):
//       { platzId; stichtag; zaehlende: ZaehlendePflanzung[]; schnittmenge: Schnittmenge }
//   src/domain/zielbereich.ts (neu exportiert)
//     reservierteImGefaess(teile, platzId): ZaehlendePflanzung[]   rolle 'einziehend', netztopfId, umsetzenAm,
//                                                                  phase = spätere von bestätigter Phase und Anzucht
import { describe, expect, it } from 'vitest';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  bandmitte,
  bandSchnitt,
  istLeer,
  MINDESTBREITE_PH,
  mindestbreiteEc,
  restbreite,
  uEcVon,
  zaehlendeFuerPassung,
  zielbereichPassung,
} from '../../src/domain/zielbereich-passung.ts';
import {
  reservierteImGefaess,
  zaehlendePflanzungen,
  type ZaehlendePflanzung,
} from '../../src/domain/zielbereich.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import {
  netztopfId,
  passungTeile,
  platzId,
  PLUS_3,
  RESERVIERT_23,
  satzDazu,
  STEHEND_23,
  ZB_JETZT,
} from '../fixtures/passung.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const P23 = platzId('2.3');
const P21 = platzId('2.1');
const P11 = platzId('1.1');
const P31 = platzId('3.1');
const sortiert = (l: readonly string[]) => [...l].sort();
const ids = (z: readonly ZaehlendePflanzung[]) => sortiert(z.map((p) => p.pflanzungId));
const phaseVon = (z: readonly ZaehlendePflanzung[], id: string) => z.find((p) => p.pflanzungId === id)?.phase;
const b = (min: number, max: number) => ({ min, max });

describe('R2.1 Band-Hilfen', () => {
  it('R2.1 bandSchnitt 0.8–1.2 ∩ 0.9–1.6 = 0.9–1.2, Restbreite 0.3', () => {
    const s = bandSchnitt(b(80, 120), b(90, 160));
    expect(s).toEqual(b(90, 120));
    expect(restbreite(s as NonNullable<typeof s>)).toBe(30);
    expect(istLeer(s as NonNullable<typeof s>)).toBe(false);
    // symmetrisch
    expect(bandSchnitt(b(90, 160), b(80, 120))).toEqual(b(90, 120));
    // ein Band ganz im anderen
    expect(bandSchnitt(b(50, 200), b(100, 140))).toEqual(b(100, 140));
    expect(bandSchnitt(b(100, 140), b(50, 200))).toEqual(b(100, 140));
  });

  it('R2.1 bandSchnitt berührend 6.0–6.0 hat Restbreite 0 und ist nicht leer', () => {
    const s = bandSchnitt(b(580, 600), b(600, 650));
    expect(s).toEqual(b(600, 600));
    expect(istLeer(b(600, 600))).toBe(false);
    expect(restbreite(b(600, 600))).toBe(0);
    // Breite 0 auf beiden Seiten
    expect(bandSchnitt(b(600, 600), b(600, 600))).toEqual(b(600, 600));
  });

  it('R2.1 bandSchnitt 1.5–1.8 ∩ 0.8–1.2 ist leer (min > max), Restbreite 0', () => {
    const s = bandSchnitt(b(150, 180), b(80, 120));
    expect(s).toEqual(b(150, 120));
    expect(istLeer(s as NonNullable<typeof s>)).toBe(true);
    expect(restbreite(s as NonNullable<typeof s>)).toBe(0);
    // genau eine Hundertstel daneben ist leer, nicht negativ
    expect(istLeer(b(121, 120))).toBe(true);
    expect(restbreite(b(121, 120))).toBe(0);
    expect(restbreite(b(100, 101))).toBe(1);
    expect(restbreite(b(100, 140))).toBe(40);
  });

  it('R2.1 bandSchnitt mit undefined auf einer Seite ist undefined', () => {
    expect(bandSchnitt(undefined, b(100, 140))).toBeUndefined();
    expect(bandSchnitt(b(100, 140), undefined)).toBeUndefined();
    expect(bandSchnitt(undefined, undefined)).toBeUndefined();
  });

  it('R2.4 bandmitte 1.0–1.4 → 1.2, 1.5–1.8 → 1.65, 1.0–1.3 → 1.15 (Hundertstel 115)', () => {
    expect(bandmitte(b(100, 140))).toBe(120);
    expect(bandmitte(b(150, 180))).toBe(165);
    expect(bandmitte(b(100, 130))).toBe(115);
    // Breite 0: die Grenze selbst; halbe Hundertstel gerundet (Math.round)
    expect(bandmitte(b(600, 600))).toBe(600);
    expect(bandmitte(b(101, 102))).toBe(102);
    expect(bandmitte(b(100, 101))).toBe(101);
  });
});

describe('R3.2 Mindestbreiten und u_EC', () => {
  it('R3.2 mindestbreiteEc max(0.3, 2 · u_EC): 0.10 → 0.30, 0.20 → 0.40, 0.05 → 0.30', () => {
    expect(mindestbreiteEc(10)).toBe(30);
    expect(mindestbreiteEc(20)).toBe(40);
    expect(mindestbreiteEc(5)).toBe(30);
    // Grenze: 2 · 0.15 = 0.30 genau, 2 · 0.16 = 0.32
    expect(mindestbreiteEc(15)).toBe(30);
    expect(mindestbreiteEc(16)).toBe(32);
    expect(mindestbreiteEc(0)).toBe(30);
  });

  it('R3.2 MINDESTBREITE_PH 0.3', () => {
    expect(MINDESTBREITE_PH).toBe(30);
  });

  it('R3.2 uEcVon aus messgeraet, ohne Gerät 0.10, storniertes Gerät zählt nicht', () => {
    expect(uEcVon(passungTeile())).toBe(10);
    expect(uEcVon({ messgeraet: [{ id: uid('23', 1), u_ec: 0.05, u_ph: 0.05 }] })).toBe(5);
    expect(uEcVon({ messgeraet: [{ id: uid('23', 1), u_ec: '0.20', u_ph: 0.1 }] })).toBe(20);
    expect(uEcVon({ messgeraet: [] })).toBe(10);
    expect(uEcVon({})).toBe(10);
    const storniert: Teile = {
      messgeraet: [
        { id: uid('23', 1), u_ec: 0.3, u_ph: 0.1, storniert_am: '2027-01-02T08:00:00Z' },
        { id: uid('23', 2), u_ec: 0.15, u_ph: 0.1, storniert_am: null },
      ],
    };
    expect(uEcVon(storniert)).toBe(15);
    // nur stornierte: Standard
    expect(
      uEcVon({
        messgeraet: [{ id: uid('23', 1), u_ec: 0.3, u_ph: 0.1, storniert_am: '2027-01-02T08:00:00Z' }],
      }),
    ).toBe(10);
  });
});

describe('R2.2 Zweck Passung: wer zählt am Stichtag', () => {
  it('R2.2 Passung zählt stehende und alle reservierten mit Phase am Stichtag', () => {
    const t = passungTeile();
    const am21 = zaehlendeFuerPassung(t, P23, PLUS_3, J, Z);
    expect(ids(am21)).toEqual(sortiert([...STEHEND_23, ...RESERVIERT_23]));
    for (const p of STEHEND_23) {
      expect(phaseVon(am21, p)).toBe('wachstum');
      expect(am21.find((x) => x.pflanzungId === p)?.rolle).toBe('stehend');
    }
    // Eichblatt gesät 12.1.: Anzucht ab 18.1., Wachstum ab 8.2. (phaseAm)
    for (const p of RESERVIERT_23) {
      expect(phaseVon(am21, p)).toBe('anzucht');
      expect(am21.find((x) => x.pflanzungId === p)?.rolle).toBe('einziehend');
    }
    const am20_2 = zaehlendeFuerPassung(t, P23, '2027-02-20', J, Z);
    for (const p of RESERVIERT_23) expect(phaseVon(am20_2, p)).toBe('wachstum');
    // Grenze der Prognose: 7.2. noch Anzucht, 8.2. Wachstum
    expect(phaseVon(zaehlendeFuerPassung(t, P23, '2027-02-07', J, Z), RESERVIERT_23[0] as string)).toBe(
      'anzucht',
    );
    expect(phaseVon(zaehlendeFuerPassung(t, P23, '2027-02-08', J, Z), RESERVIERT_23[0] as string)).toBe(
      'wachstum',
    );
  });

  it('R2.2 Passung: reservierte mit umsetzen_geplant_am nach dem Stichtag zählen trotzdem (anders als Zweck umsetzen mit heute + 3)', () => {
    const t = passungTeile({ umsetzenAm: '2027-02-15' });
    const passung = zaehlendeFuerPassung(t, P23, PLUS_3, J, Z);
    expect(ids(passung)).toEqual(sortiert([...STEHEND_23, ...RESERVIERT_23]));
    expect(passung.find((p) => p.pflanzungId === RESERVIERT_23[0])?.umsetzenAm).toBe('2027-02-15');
    expect(ids(zaehlendePflanzungen(t, P23, 'umsetzen', J, Z))).toEqual(sortiert(STEHEND_23));
  });

  it('R2.2 Passung: stehende wechseln die Phase am Stichtag nach der Prognose (Basilikum heute anzucht, am 10.2. wachstum)', () => {
    const t = passungTeile();
    // Genoveser gesät 5.1.: Anzucht 11.1. bis 31.1., Wachstum ab 1.2.; steht in 2.1.1
    const [basilikum] = satzDazu(t, {
      nr: 3,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2027-01-05',
      phase: 'anzucht',
      anzahl: 1,
      stehend: { toepfe: ['2.1.1'], umgesetztAm: '2027-01-15T08:00:00.000Z' },
    }) as [string];
    expect(phaseVon(zaehlendeFuerPassung(t, P21, '2027-01-18', J, Z), basilikum)).toBe('anzucht');
    expect(phaseVon(zaehlendeFuerPassung(t, P21, '2027-01-31', J, Z), basilikum)).toBe('anzucht');
    expect(phaseVon(zaehlendeFuerPassung(t, P21, '2027-02-01', J, Z), basilikum)).toBe('wachstum');
    expect(phaseVon(zaehlendeFuerPassung(t, P21, '2027-02-10', J, Z), basilikum)).toBe('wachstum');
    expect(zaehlendeFuerPassung(t, P21, '2027-02-10', J, Z)[0]?.rolle).toBe('stehend');
  });

  it('R2.2 Passung: Direktsaat-Pflanzung zählt in wachstum', () => {
    const t = passungTeile();
    const gesaet = satzDazu(t, {
      nr: 4,
      sorte: 'rucola',
      kulturform: 'babyleaf',
      saatdatum: '2027-01-15',
      phase: 'keimung',
      anzahl: 2,
      direktsaat: '3.1',
      direktsaatToepfe: ['3.1.1', '3.1.2'],
    });
    const z = zaehlendeFuerPassung(t, P31, '2027-01-18', J, Z);
    // je Pflanzung einmal, nicht zusätzlich als reservierte (Direktsaat reserviert mit dem Saattag)
    expect(ids(z)).toEqual(sortiert(gesaet));
    for (const p of z) {
      expect(p.rolle).toBe('gesaet');
      expect(p.phase).toBe('wachstum');
    }
    // auch an einem Stichtag, an dem die Prognose Keimung liefern würde
    for (const p of zaehlendeFuerPassung(t, P31, '2027-01-16', J, Z)) expect(p.phase).toBe('wachstum');
  });

  it('R2.2 Passung: ohne nimmt die Pflanzungen des eigenen Satzes heraus', () => {
    const t = passungTeile();
    expect(ids(zaehlendeFuerPassung(t, P23, PLUS_3, J, Z, RESERVIERT_23))).toEqual(sortiert(STEHEND_23));
    expect(ids(zaehlendeFuerPassung(t, P23, PLUS_3, J, Z, STEHEND_23))).toEqual(sortiert(RESERVIERT_23));
    expect(ids(zaehlendeFuerPassung(t, P23, PLUS_3, J, Z, []))).toHaveLength(6);
    expect(zielbereichPassung(t, P23, PLUS_3, J, Z, [...STEHEND_23, ...RESERVIERT_23]).schnittmenge).toEqual({
      art: 'ohne_band',
    });
  });

  it('R2.2 Passung: Platz ohne Rolle gefaess liefert leer', () => {
    const t = passungTeile();
    // Sämlinge in der Anzuchtbox A1 mit Ort A1
    satzDazu(t, {
      nr: 5,
      sorte: 'lollo',
      saatdatum: '2027-01-10',
      phase: 'anzucht',
      anzahl: 2,
      station: { kennung: 'A1', eintrittAm: '2027-01-14T08:00:00.000Z' },
    });
    expect(zaehlendeFuerPassung(t, platzId('A1'), PLUS_3, J, Z)).toEqual([]);
    expect(zaehlendeFuerPassung(t, platzId('W'), PLUS_3, J, Z)).toEqual([]);
    expect(zielbereichPassung(t, platzId('A1'), PLUS_3, J, Z).schnittmenge).toEqual({ art: 'ohne_band' });
  });

  it('R2.2 Passung: eine Pflanzung zählt nur einmal, auch wenn sie steht und noch reserviert ist', () => {
    const t = passungTeile();
    const r = {
      id: uid('30', 901),
      client_id: uid('30', 901),
      pflanzung_id: STEHEND_23[0],
      netztopf_id: netztopfId('2.3.1'),
      umsetzen_vorgabe_am: '2026-12-28',
      umsetzen_geplant_am: '2026-12-28',
      gilt_ab: '2026-12-01T09:00:00.000Z',
      storniert_am: null,
    };
    t['reservierung']?.push(r);
    t['v_reservierung_aktiv']?.push({ ...r });
    const z = zaehlendeFuerPassung(t, P23, PLUS_3, J, Z);
    expect(z).toHaveLength(6);
    expect(z.filter((p) => p.pflanzungId === STEHEND_23[0])).toHaveLength(1);
    expect(z.find((p) => p.pflanzungId === STEHEND_23[0])?.rolle).toBe('stehend');
  });
});

describe('R2.2 reservierteImGefaess', () => {
  it('R2.2 reservierteImGefaess liefert alle aktiven Reservierungen auf Heimtöpfe im Gefäss, storniert, umgesetzt und Direktsaat nicht', () => {
    const t = passungTeile({ umsetzenAm: '2027-03-01' });
    const r = reservierteImGefaess(t, P23);
    expect(ids(r)).toEqual(sortiert(RESERVIERT_23));
    for (const [i, p] of RESERVIERT_23.entries()) {
      const x = r.find((y) => y.pflanzungId === p);
      expect(x).toMatchObject({
        rolle: 'einziehend',
        netztopfId: netztopfId(`2.3.${String(i + 4)}`),
        umsetzenAm: '2027-03-01',
        // spätere von bestätigter Phase (keimung) und Anzucht
        phase: 'anzucht',
      });
    }
    expect(reservierteImGefaess(t, P21)).toEqual([]);
    expect(reservierteImGefaess(t, P11)).toEqual([]);

    // storniert: Reservierung mit storniert_am
    const s = passungTeile();
    (s['v_reservierung_aktiv'] ?? []).forEach((x, i) => {
      if (i === 0) x['storniert_am'] = '2027-01-17T08:00:00Z';
    });
    expect(reservierteImGefaess(s, P23)).toHaveLength(2);

    // beendet (keimt nicht): Zustand nicht aktiv
    const u = passungTeile();
    const z = (u['v_pflanzung_zustand'] ?? []).find((x) => x['pflanzung_id'] === RESERVIERT_23[1]);
    if (z) z['status'] = 'keimt_nicht';
    expect(ids(reservierteImGefaess(u, P23))).toEqual(
      sortiert([RESERVIERT_23[0], RESERVIERT_23[2]] as string[]),
    );

    // Direktsaat: Reservierungen mit dem Saattag zählen nicht
    const d = passungTeile();
    satzDazu(d, {
      nr: 6,
      sorte: 'rucola',
      kulturform: 'babyleaf',
      saatdatum: '2027-01-15',
      phase: 'keimung',
      anzahl: 2,
      direktsaat: '3.1',
      direktsaatToepfe: ['3.1.1', '3.1.2'],
    });
    expect(reservierteImGefaess(d, P31)).toEqual([]);
  });

  it('R2.2 reservierteImGefaess: Zieltopf mit Heimplatz anderswo zählt nicht; je Pflanzung einmal; bestätigte Phase Wachstum bleibt', () => {
    const t = passungTeile();
    // zwei Reservierungen derselben Pflanzung im Gefäss 2.1
    const [a, c] = satzDazu(t, {
      nr: 7,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-12-20',
      phase: 'wachstum',
      anzahl: 2,
      reserviert: { toepfe: ['2.1.1', '1.1.1'], umsetzenAm: '2027-01-25' },
    }) as [string, string];
    const zweite = {
      id: uid('30', 902),
      client_id: uid('30', 902),
      pflanzung_id: a,
      netztopf_id: netztopfId('2.1.2'),
      umsetzen_vorgabe_am: '2027-01-26',
      umsetzen_geplant_am: '2027-01-26',
      gilt_ab: '2026-12-20T09:00:00.000Z',
      storniert_am: null,
    };
    t['v_reservierung_aktiv']?.push(zweite);
    const r21 = reservierteImGefaess(t, P21);
    expect(r21.map((p) => p.pflanzungId)).toEqual([a]);
    expect(r21[0]?.phase).toBe('wachstum');
    expect(reservierteImGefaess(t, P11).map((p) => p.pflanzungId)).toEqual([c]);
  });

  it('R2.2 zaehlendePflanzungen umsetzen bleibt heute + 3 (Regression zu Plan 34)', () => {
    const t = passungTeile();
    const [frueh] = satzDazu(t, {
      nr: 8,
      sorte: 'lollo',
      saatdatum: '2026-12-31',
      phase: 'anzucht',
      anzahl: 1,
      reserviert: { toepfe: ['2.1.1'], umsetzenAm: PLUS_3 },
    }) as [string];
    const [spaet] = satzDazu(t, {
      nr: 9,
      sorte: 'eichblatt',
      saatdatum: '2027-01-04',
      phase: 'anzucht',
      anzahl: 1,
      reserviert: { toepfe: ['2.1.2'], umsetzenAm: '2027-01-22' },
    }) as [string];
    expect(ids(reservierteImGefaess(t, P21))).toEqual(sortiert([frueh, spaet]));
    expect(ids(zaehlendePflanzungen(t, P21, 'umsetzen', J, Z))).toEqual([frueh]);
    expect(ids(zaehlendePflanzungen(t, P21, 'bewertung', J, Z))).toEqual([]);
    expect(ids(zaehlendeFuerPassung(t, P21, PLUS_3, J, Z))).toEqual(sortiert([frueh, spaet]));
    // Phase der einziehenden im Zweck umsetzen wie bisher (spätere von bestätigter Phase und Anzucht)
    expect(zaehlendePflanzungen(t, P21, 'umsetzen', J, Z)[0]).toMatchObject({
      rolle: 'einziehend',
      phase: 'anzucht',
      netztopfId: netztopfId('2.1.1'),
      umsetzenAm: PLUS_3,
    });
  });
});

describe('R2.1 zielbereichPassung', () => {
  it('R2.1 zielbereichPassung: ok mit begrenzt, leer bei Tomate und Salat, ohne_band im leeren Gefäss', () => {
    const t = passungTeile();
    // 2.3 am 21.1.: Lollo Wachstum EC 1.0–1.4, Eichblatt Anzucht EC 0.8–1.2 → 1.0–1.2
    const z = zielbereichPassung(t, P23, PLUS_3, J, Z);
    expect(z.platzId).toBe(P23);
    expect(z.stichtag).toBe(PLUS_3);
    expect(z.zaehlende).toHaveLength(6);
    expect(z.schnittmenge).toMatchObject({
      art: 'ok',
      ph: { min: 580, max: 650 },
      ec: { min: 100, max: 120 },
      temperatur: { min: 1800, max: 2400 },
    });
    if (z.schnittmenge.art !== 'ok') throw new Error('ok erwartet');
    expect(STEHEND_23).toContain(z.schnittmenge.begrenzt.ecMin);
    expect(RESERVIERT_23).toContain(z.schnittmenge.begrenzt.ecMax);

    // 2.3 am 20.2.: alle in Wachstum → 1.0–1.4
    expect(zielbereichPassung(t, P23, '2027-02-20', J, Z).schnittmenge).toMatchObject({
      art: 'ok',
      ec: { min: 100, max: 140 },
    });

    // 2.1: Tomate Wachstum 1.5–1.8 und Salat Wachstum 1.0–1.4 → leer
    satzDazu(t, {
      nr: 10,
      sorte: 'ochsenherz',
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2026-11-20',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['2.1.1'] },
    });
    satzDazu(t, {
      nr: 11,
      sorte: 'lollo',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['2.1.2'] },
    });
    expect(zielbereichPassung(t, P21, PLUS_3, J, Z).schnittmenge.art).toBe('leer');

    // leeres Gefäss 1.1
    const leer = zielbereichPassung(t, P11, PLUS_3, J, Z);
    expect(leer.zaehlende).toEqual([]);
    expect(leer.schnittmenge).toEqual({ art: 'ohne_band' });
  });

  it('R2.2 zielbereichPassung rechnet am Stichtag, nicht heute (stehender Basilikum heute Anzucht, am 10.2. Wachstum)', () => {
    const t = passungTeile();
    satzDazu(t, {
      nr: 12,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2027-01-05',
      phase: 'anzucht',
      anzahl: 1,
      stehend: { toepfe: ['2.1.3'] },
    });
    // Anzucht EC 0.9–1.6, Wachstum EC 1.0–1.6
    expect(zielbereichPassung(t, P21, '2027-01-18', J, Z).schnittmenge).toMatchObject({
      art: 'ok',
      ec: { min: 90, max: 160 },
    });
    expect(zielbereichPassung(t, P21, '2027-02-10', J, Z).schnittmenge).toMatchObject({
      art: 'ok',
      ec: { min: 100, max: 160 },
    });
    // ohne Wassertemperatur-Band: Standard 18–22 °C wie schnittmenge()
    expect(zielbereichPassung(t, P21, '2027-02-10', J, Z).schnittmenge).toMatchObject({
      temperatur: { min: 1800, max: 2200 },
    });
  });
});
