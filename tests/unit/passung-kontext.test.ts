// Kontext der Passung aus den Teilen des Bündels (Plan 36 Testliste passung-kontext.test.ts; Konzept R2.2 Zweck
// Passung, R2.3, R3.1 bis R3.3, R11.2; UC5-AK2, UC5-AK11). Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone
// Europe/Zurich; Teile aus tests/fixtures/passung.ts. Werte in Hundertsteln.
//
// Vertrag (Plan 36 «Schnittstellen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/passung/kontext.ts
//     passungKontext(teile, { sorteId, kulturform }, zielPlatzId, saatdatum, jetzt, zeitzone): PassungKontext | undefined
//       kandidat.phase = Phase, deren Band verwendet wird (A5: nächste Phase mit Band); Direktsaat wachstum (A1)
//       gefaess.wassertempMax7d, kandidat.temp, zielbereich.temp in Hundertsteln (22 °C = 2200)
//       leitkultur: LeitkulturBezug | undefined (wahl_noetig und keine → undefined)
//     sortenPassung(teile, sorten, zielPlatzId, saatdatum, jetzt, zeitzone): SortePassung[]
//       je Sorte { …SorteWahl, kulturform, umsetzenAm, passung, rang }, sortiert nach Stufe und Rang; ohne
//       umsetzen_ab_d umsetzenAm = Saatdatum und passung.hinweise mit «Umsetzdatum fehlt …» (A6)
//     gefaessPassung(teile, satzId, zielPlatzId, jetzt, zeitzone): Passung | undefined
import { describe, expect, it } from 'vitest';
import { gefaessPassung, passungKontext, sortenPassung } from '../../src/domain/passung/kontext.ts';
import { passung } from '../../src/domain/passung/passung.ts';
import { sortenAuswahl } from '../../src/domain/pflanzung/saeen.ts';
import type { Kulturform } from '../../src/domain/phasen/profil.ts';
import { randloecher } from '../../src/domain/vorlagen/lochbild.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import {
  ART,
  messungDazu,
  passungTeile,
  platzId,
  satzDazu,
  satzId,
  SORTE,
  stammSetzen,
  ZB_JETZT,
} from '../fixtures/passung.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const HEUTE = '2027-01-18';
const P23 = platzId('2.3');
const P21 = platzId('2.1');
const P11 = platzId('1.1');
const P31 = platzId('3.1');
const P33 = platzId('3.3');

const kontext = (t: Teile, sorte: keyof typeof SORTE, kulturform: Kulturform, ziel: string, saat = HEUTE) => {
  const k = passungKontext(t, { sorteId: SORTE[sorte], kulturform }, ziel, saat, J, Z);
  if (!k) throw new Error('Kontext erwartet');
  return k;
};

/** Genoveser gesät 5.1., steht in 2.1.3: heute Anzucht (EC 0.9–1.6), ab 1.2. Wachstum (EC 1.0–1.6) */
function mitBasilikum(t: Teile): Teile {
  satzDazu(t, {
    nr: 40,
    sorte: 'genoveser',
    kulturform: 'dauerkultur_blatt',
    saatdatum: '2027-01-05',
    phase: 'anzucht',
    anzahl: 1,
    stehend: { toepfe: ['2.1.3'] },
  });
  return t;
}

describe('UC5-AK11 gerechnet am Umsetzdatum', () => {
  it('UC5-AK11 Sollbereich der Phase am Umsetzdatum, nicht von heute', () => {
    const t = passungTeile();
    // Lollo Rossa gesät 18.1., Umsetzen ab 21 → 8.2.: Anzucht (24.1. bis 13.2.), heute wäre Keimung (EC 0.6–0.9)
    const k = kontext(t, 'lollo', 'kopf', P21);
    expect(k.kandidat.phase).toBe('anzucht');
    expect(k.kandidat.ec).toEqual({ min: 80, max: 120 });
    expect(k.kandidat.ph).toEqual({ min: 580, max: 650 });
    const [sp] = sortenPassung(
      t,
      sortenAuswahl(t).filter((s) => s.sorteId === SORTE.lollo),
      P21,
      HEUTE,
      J,
      Z,
    );
    expect(sp?.umsetzenAm).toBe('2027-02-08');
  });

  it('UC5-AK11 Zielbereich des Gefässes am Umsetzdatum, nicht von heute', () => {
    const t = mitBasilikum(passungTeile());
    // Umsetzen 8.2.: Basilikum in Wachstum → Zielbereich EC 1.0–1.6
    const k = kontext(t, 'lollo', 'kopf', P21);
    expect(k.zielbereich.ec).toEqual({ min: 100, max: 160 });
    expect(k.zielbereich.zaehlende).toBe(1);
    // Nacherfassung gesät 1.1., Umsetzen 22.1.: Basilikum noch in Anzucht → EC 0.9–1.6
    expect(kontext(t, 'lollo', 'kopf', P21, '2027-01-01').zielbereich.ec).toEqual({ min: 90, max: 160 });
  });

  it('UC5-AK11 Direktsaat rechnet mit dem Saattag', () => {
    const t = passungTeile();
    const k = kontext(t, 'lollo', 'kopf', P31);
    // Direktsaat: Phase Wachstum (A1), Bänder der Wachstumsphase
    expect(k.kandidat.phase).toBe('wachstum');
    expect(k.kandidat.ec).toEqual({ min: 100, max: 140 });
    expect(k.kandidat.temp).toEqual({ min: 1800, max: 2400 });
    const [sp] = sortenPassung(
      t,
      sortenAuswahl(t).filter((s) => s.sorteId === SORTE.lollo),
      P31,
      HEUTE,
      J,
      Z,
    );
    expect(sp?.umsetzenAm).toBe(HEUTE);
  });
});

describe('UC5-AK2 reservierte zählen', () => {
  it('UC5-AK2 reservierter Topf zählt in der Passung zur Schnittmenge: Matador für 2.3 mit Lollo (steht) und Eichblatt (reserviert) ist Nicht empfohlen mit P2', () => {
    const t = passungTeile();
    const k = kontext(t, 'matador', 'babyleaf', P23);
    // Umsetzen 8.2.: Lollo Rossa und Eichblatt in Wachstum, 6 zählende
    expect(k.zielbereich.zaehlende).toBe(6);
    expect(k.zielbereich.ec).toEqual({ min: 100, max: 140 });
    expect(k.kandidat.ec).toEqual({ min: 120, max: 180 });
    expect(k.mitbewohnerArten).toEqual([{ artId: ART.salat, pythium: 'gering' }]);
    expect(k.uEc).toBe(10);
    const p = passung(k);
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toContain('P2');
    expect(p.restbreiteEc).toBe(20);
  });
});

describe('R3.1 R2.2 Kontext aus dem Bündel', () => {
  it('R3.1 umsetzenAm = Saat + umsetzen_ab_d; ohne umsetzen_ab_d Stichtag = Saatdatum mit Hinweis', () => {
    const t = passungTeile();
    const liste = sortenPassung(t, sortenAuswahl(t), P21, HEUTE, J, Z);
    const am = (s: string) => liste.find((x) => x.sorteId === s)?.umsetzenAm;
    expect(am(SORTE.ochsenherz)).toBe('2027-02-15');
    expect(am(SORTE.rucola)).toBe('2027-02-01');
    expect(am(SORTE.lollo)).toBe('2027-02-08');
    stammSetzen(t, 'art', (a) => a['art_id'] === ART.salat, { umsetzen_ab_d: null, umsetzen_bis_d: null });
    const ohne = sortenPassung(t, sortenAuswahl(t), P21, HEUTE, J, Z).find((x) => x.sorteId === SORTE.lollo);
    expect(ohne?.umsetzenAm).toBe(HEUTE);
    expect(ohne?.passung.hinweise.some((h) => h.includes('Umsetzdatum fehlt'))).toBe(true);
  });

  it('R2.2 Kandidat ohne Band in anzucht nimmt die nächste Phase mit Band', () => {
    const t = passungTeile();
    // Matador gesät 18.1., Umsetzen 8.2. in Anzucht ohne Band → Wachstum pH 6.0–7.0, EC 1.2–1.8 (A5)
    const k = kontext(t, 'matador', 'babyleaf', P11);
    expect(k.kandidat.phase).toBe('wachstum');
    expect(k.kandidat.ph).toEqual({ min: 600, max: 700 });
    expect(k.kandidat.ec).toEqual({ min: 120, max: 180 });
    // leeres Gefäss: kein Zielbereich, keine Leitkultur, keine Mitbewohner
    expect(k.zielbereich).toEqual({ zaehlende: 0 });
    expect(k.leitkultur).toBeUndefined();
    expect(k.mitbewohnerArten).toEqual([]);
  });

  it('R3.2 freie Löcher und Randlöcher aus Deckel und topfPrognose', () => {
    const t = passungTeile();
    // Lollo Rossa in 2.3 einmalig, Ernte ab 30 Tagen nach dem Umsetzen (28.12.) → Ende 27.1.
    stammSetzen(t, 'art_kulturform', (z) => z['art_id'] === ART.salat && z['kulturform'] === 'kopf', {
      ernte_ab_d: 30,
    });
    const nach = kontext(t, 'lollo', 'kopf', P23);
    // Umsetzen 8.2.: 2.3.1 bis 2.3.3 Nachfolge (frei), 2.3.4 bis 2.3.6 reserviert
    expect(nach.gefaess.freieLoecher).toEqual([1, 2, 3]);
    expect(nach.gefaess.randloecher).toEqual(randloecher([2, 2, 2]));
    expect(nach.gefaess).toMatchObject({
      platzId: P23,
      kennung: '2.3',
      betriebsart: 'dwc',
      lochGroesseMm: 80,
      betriebsvolumenL: 9,
      lochzahl: 6,
      bereich: { name: 'Ebene 2', lichtstundenH: 15, nutzbareHoeheMm: 200 },
    });
    // gesät 1.1., Umsetzen 22.1.: Lollo steht noch, kein freies Loch → P3
    const vor = kontext(t, 'lollo', 'kopf', P23, '2027-01-01');
    expect(vor.gefaess.freieLoecher).toEqual([]);
    expect(passung(vor).gruende).toContain('P3');
    expect(passung(nach).gruende).not.toContain('P3');
    // Direktsaat in 3.3 (Kratky belüftet, D3 8 × 50 mm, Ebene 3)
    const kratky = kontext(t, 'rucola', 'babyleaf', P33);
    expect(kratky.gefaess).toMatchObject({
      kennung: '3.3',
      betriebsart: 'kratky_belueftet',
      lochGroesseMm: 50,
      lochzahl: 8,
      freieLoecher: [1, 2, 3, 4, 5, 6, 7, 8],
      bereich: { name: 'Ebene 3', lichtstundenH: 15, nutzbareHoeheMm: 150 },
    });
    expect(kratky.gefaess.randloecher).toEqual(randloecher([2, 2, 2, 2]));
  });

  it('R3.2 Wärme: Maximum der Messungen der letzten 7 Kalendertage, ältere zählen nicht', () => {
    const t = passungTeile();
    expect(kontext(t, 'lollo', 'kopf', P23).gefaess.wassertempMax7d).toBeUndefined();
    messungDazu(t, { platzId: P23, giltAb: '2027-01-17T08:00:00.000Z', temperatur: 21.0 });
    // 10.1. 23:30 UTC = 11.1. 00:30 Zürich: zählt (heute − 7 = 11.1.)
    messungDazu(t, {
      platzId: P23,
      giltAb: '2027-01-10T23:30:00.000Z',
      temperatur: 24.0,
      messart: 'aufgabe',
    });
    // 10.1. 22:30 UTC = 10.1. 23:30 Zürich: zu alt
    messungDazu(t, { platzId: P23, giltAb: '2027-01-10T22:30:00.000Z', temperatur: 26.0 });
    messungDazu(t, {
      platzId: P23,
      giltAb: '2027-01-15T08:00:00.000Z',
      temperatur: 30.0,
      storniertAm: '2027-01-15T09:00:00.000Z',
    });
    messungDazu(t, { platzId: P21, giltAb: '2027-01-16T08:00:00.000Z', temperatur: 28.0 });
    messungDazu(t, { platzId: P23, giltAb: '2027-01-16T08:00:00.000Z', temperatur: null });
    expect(kontext(t, 'lollo', 'kopf', P23).gefaess.wassertempMax7d).toBe(2400);
    expect(kontext(t, 'lollo', 'kopf', P21).gefaess.wassertempMax7d).toBe(2800);
  });

  it('R3.2 Wuchshöhe der Sorte vor der Art; Stammwerte aus art, art_kulturform und v_sollwert', () => {
    const t = passungTeile();
    stammSetzen(t, 'sorte', (s) => s['sorte_id'] === SORTE.lollo, {
      wuchshoehe_max_mm: 180,
      wuchsform: 'haengend',
    });
    const lollo = kontext(t, 'lollo', 'kopf', P31);
    expect(lollo.kandidat).toMatchObject({
      sorteId: SORTE.lollo,
      name: 'Lollo Rossa',
      artId: ART.salat,
      kulturgruppeId: 'salat',
      kulturform: 'kopf',
      systemeignung: 'beide',
      wuchshoeheMm: 180,
      wuchsform: 'haengend',
      photoperiode: 'tagneutral',
      kulturdauerTypischD: 56,
      entspitzen: false,
      pythium: 'gering',
      wasserbedarfL: 0.25,
    });
    expect(passung(lollo).hinweise.some((h) => h.includes('an die gangseitige Längskante'))).toBe(true);
    expect(kontext(t, 'eichblatt', 'kopf', P31).kandidat).toMatchObject({
      wuchshoeheMm: 40,
      wuchsform: 'rosette',
    });
    // Spinat als Kopf: licht_h max. der Phase, Langtag, kritische Tageslänge, Kulturdauer der Kulturform
    const spinat = kontext(t, 'matador', 'kopf', P33);
    expect(spinat.kandidat).toMatchObject({
      kulturform: 'kopf',
      lichtMaxH: 14,
      photoperiode: 'langtag',
      kritischeTageslaengeH: 13,
      kulturdauerTypischD: 45,
      wuchshoeheMm: 300,
      pythium: 'hoch',
      wasserbedarfL: 0.1,
    });
    const p = passung(spinat);
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P4', 'P5']);
    // Tomate dwc in Kratky belüftet; Basilikum mit Entspitzen
    expect(kontext(t, 'ochsenherz', 'dauerkultur_frucht', P33).kandidat.systemeignung).toBe('dwc');
    expect(kontext(t, 'genoveser', 'dauerkultur_blatt', P33).kandidat.entspitzen).toBe(true);
    // u_EC aus dem Messgerät
    t['messgeraet'] = [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.2, u_ph: 0.1 }];
    expect(kontext(t, 'lollo', 'kopf', P31).uEc).toBe(20);
  });

  it('passungKontext ohne Gefäss am Platz ist undefined', () => {
    const t = passungTeile();
    for (const p of [platzId('A1'), platzId('W'), uid('2b', 999)])
      expect(passungKontext(t, { sorteId: SORTE.lollo, kulturform: 'kopf' }, p, HEUTE, J, Z)).toBeUndefined();
  });
});

describe('R2.3 Leitkultur in der Passung', () => {
  it('R2.3 LeitkulturBezug aus leitkultur(): Kulturdauer, Wuchshöhe, EC-Band als Schnittmenge ihrer zählenden (A4); wahl_noetig und keine → undefined (A16)', () => {
    const t = passungTeile();
    // 2.3: Salat allein (Lollo steht, Eichblatt reserviert), am 8.2. beide in Wachstum
    expect(kontext(t, 'matador', 'babyleaf', P23).leitkultur).toEqual({
      artId: ART.salat,
      name: 'Salat',
      kulturgruppeId: 'salat',
      kulturdauerTypischD: 56,
      wuchshoeheMm: 40,
      ec: { min: 100, max: 140 },
    });
    // Wuchshöhe der Sorte des ältesten Satzes (Lollo Rossa, gesät 1.12.2026) vor der Art
    stammSetzen(t, 'sorte', (s) => s['sorte_id'] === SORTE.lollo, { wuchshoehe_max_mm: 220 });
    stammSetzen(t, 'sorte', (s) => s['sorte_id'] === SORTE.eichblatt, { wuchshoehe_max_mm: 120 });
    expect(kontext(t, 'matador', 'babyleaf', P23).leitkultur?.wuchshoeheMm).toBe(220);

    // 2.1: Tomate (Wachstum EC 1.5–1.8) und Basilikum (Wachstum EC 1.0–1.6): Leitkultur Tomate, Band nur der Tomate
    satzDazu(t, {
      nr: 41,
      sorte: 'ochsenherz',
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2026-11-20',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['2.1.1'] },
    });
    satzDazu(t, {
      nr: 42,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['2.1.2'] },
    });
    expect(kontext(t, 'lollo', 'kopf', P21).leitkultur).toEqual({
      artId: ART.tomate,
      name: 'Tomate',
      kulturgruppeId: 'fruchtgemuese',
      kulturdauerTypischD: 150,
      wuchshoeheMm: 1800,
      ec: { min: 150, max: 180 },
    });
    // die Mitbewohner je Art einmal
    expect(
      [...kontext(t, 'lollo', 'kopf', P21).mitbewohnerArten].sort((a, b) => a.artId.localeCompare(b.artId)),
    ).toEqual([
      { artId: ART.basilikum, pythium: 'hoch' },
      { artId: ART.tomate, pythium: 'mittel' },
    ]);

    // 1.1: Rucola und Spinat im Gleichstand (Kulturdauer 30, Wasser 0.1 l, je ein Topf) → wahl_noetig
    for (const [nr, sorte, topf] of [
      [43, 'rucola', '1.1.1'],
      [44, 'matador', '1.1.2'],
    ] as const)
      satzDazu(t, {
        nr,
        sorte,
        kulturform: 'babyleaf',
        saatdatum: '2026-12-15',
        phase: 'wachstum',
        anzahl: 1,
        stehend: { toepfe: [topf] },
      });
    const gleich = kontext(t, 'lollo', 'kopf', P11);
    expect(gleich.leitkultur).toBeUndefined();
    expect(gleich.zielbereich.zaehlende).toBe(2);
    // keine zählenden
    expect(kontext(t, 'lollo', 'kopf', platzId('1.2')).leitkultur).toBeUndefined();
  });

  it('R2.3 Leitkultur wird ohne den Kandidaten bestimmt', () => {
    const t = passungTeile();
    // 2.1: Lollo Rossa steht in 2.1.1; Basilikum (gesät 20.12., heute Wachstum) ist auf 2.1.2 reserviert
    satzDazu(t, {
      nr: 45,
      sorte: 'lollo',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['2.1.1'] },
    });
    satzDazu(t, {
      nr: 46,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-12-20',
      phase: 'anzucht',
      anzahl: 1,
      reserviert: { toepfe: ['2.1.2'], umsetzenAm: HEUTE },
    });
    // ohne den eigenen Satz ist Salat (56 Tage) Leitkultur; Basilikum (120 Tage) bleibt länger → P8, Möglich
    const p = gefaessPassung(t, satzId(46), P21, J, Z);
    expect(p?.einstufung).toBe('moeglich');
    expect(p?.gruende).toEqual(['P8']);
  });

  it('gefaessPassung rechnet für den Satz mit heute, seiner Kulturform und ohne die eigenen Pflanzungen', () => {
    const t = passungTeile();
    // Satz Eichblatt (Nr. 2) ist auf 2.3.4 bis 2.3.6 reserviert; gegen 2.3 ohne die eigenen drei Pflanzungen
    const p = gefaessPassung(t, satzId(2), P23, J, Z);
    expect(p).toBeDefined();
    // heute Anzucht EC 0.8–1.2 gegen Lollo Rossa in Wachstum 1.0–1.4 (ohne die eigenen) → Restbreite 0.2, P2 zuerst
    expect(p?.restbreiteEc).toBe(20);
    expect(p?.gruende[0]).toBe('P2');
    // Satz Basilikum als Dauerkultur Blatt: Entspitzen gilt, keine Höhenzeile auf Ebene 3
    satzDazu(t, {
      nr: 47,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-12-20',
      phase: 'anzucht',
      anzahl: 1,
    });
    const b = gefaessPassung(t, satzId(47), P33, J, Z);
    expect(b?.gruende).not.toContain('P5');
    expect(b?.einstufung).toBe('empfohlen');
    // unbekannter Satz oder Platz ohne Gefäss
    expect(gefaessPassung(t, uid('27', 999), P23, J, Z)).toBeUndefined();
    expect(gefaessPassung(t, satzId(2), platzId('A1'), J, Z)).toBeUndefined();
  });
});

describe('sortenPassung', () => {
  it('sortenPassung baut den Gefässteil einmal und liefert jede Sorte mit Rang', () => {
    const t = passungTeile();
    const sorten = sortenAuswahl(t);
    const liste = sortenPassung(t, sorten, P23, HEUTE, J, Z);
    expect(liste).toHaveLength(sorten.length);
    expect(liste.map((s) => s.rang)).toEqual(sorten.map((_, i) => i + 1));
    const stufe = { empfohlen: 0, moeglich: 1, nicht_empfohlen: 2 } as const;
    const stufen = liste.map((s) => stufe[s.passung.einstufung]);
    expect(stufen).toEqual([...stufen].sort((a, b) => a - b));
    // je Sorte dieselbe Passung wie ein einzelner Kontext, in der Vorgabe-Kulturform
    for (const s of liste) {
      const wahl = sorten.find((x) => x.sorteId === s.sorteId);
      expect(s.kulturform).toBe(wahl?.vorgabe);
      const k = passungKontext(t, { sorteId: s.sorteId, kulturform: s.kulturform }, P23, HEUTE, J, Z);
      expect(s.passung).toEqual(passung(k as NonNullable<typeof k>));
    }
    // gewählte Kulturform statt der Vorgabe
    const kopf = sortenPassung(
      t,
      sorten.map((s) => (s.sorteId === SORTE.matador ? { ...s, kulturform: 'kopf' as const } : s)),
      P23,
      HEUTE,
      J,
      Z,
    ).find((s) => s.sorteId === SORTE.matador);
    expect(kopf?.kulturform).toBe('kopf');
    const k = passungKontext(t, { sorteId: SORTE.matador, kulturform: 'kopf' }, P23, HEUTE, J, Z);
    expect(kopf?.passung).toEqual(passung(k as NonNullable<typeof k>));
  });

  it('sortenPassung im leeren Kratky-Gefäss 3.3: Tomate als einzige Nicht empfohlen mit P1 zuerst', () => {
    const t = passungTeile();
    const liste = sortenPassung(t, sortenAuswahl(t), P33, HEUTE, J, Z);
    const ne = liste.filter((s) => s.passung.einstufung === 'nicht_empfohlen');
    expect(ne.map((s) => s.sorteId)).toEqual([SORTE.ochsenherz]);
    expect(ne[0]?.passung.gruende[0]).toBe('P1');
    expect(ne[0]?.rang).toBe(liste.length);
    expect(liste.filter((s) => s.passung.einstufung === 'empfohlen')).toHaveLength(liste.length - 1);
  });
});
