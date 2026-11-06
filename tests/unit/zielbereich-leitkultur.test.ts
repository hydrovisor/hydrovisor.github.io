// Leitkultur und Herstellerstadium des Ansatzes (Plan 34 Testliste zielbereich-leitkultur.test.ts; Konzept R2.3, R4.3,
// R4.5; UC7 Rechenbasis 1; Fachregeln G1, G2). Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone
// Europe/Zurich; Teile aus tests/fixtures/zielbereich.ts.
//
// Vertrag (Plan 34 «Schnittstellen und Datenfluss», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/zielbereich-leitkultur.ts
//     leitkultur(teile, platzId, zaehlende):
//       { art: 'art'; artId; grund: 'einzige' | 'kulturdauer' | 'wasserbedarf' | 'netztoepfe' | 'gewaehlt' }
//       | { art: 'wahl_noetig'; kandidaten: artId[] } | { art: 'keine' }
//       kandidaten = Arten im Gleichstand der letzten Stufe (bei wahl_noetig).
//     stadiumEingabe(teile, platzId, zweck, leitkulturArtId | undefined, zaehlende, jetzt, zeitzone):
//       StadiumEingabe | undefined   (Eingabe für herstellerstadium() aus src/domain/rechner.ts)
//       Station → { ort: 'station', aeltesterEintrittAm }; Anzuchtbox → { ort: 'anzuchtbox' } (auch ohne zählende, A);
//       sonst { ort: 'zielgefaess', direktsaat, phaseLeitkultur, umgesetztAm? }; Zweck ohne → undefined.
//     ansatzGrundlage(teile, platzId, jetzt, zeitzone):
//       { zweck; zaehlende; schnittmenge; leitkultur; stadiumVorschlag?: Stadium; gerechnetFuer; pflanzungIds }
import { describe, expect, it } from 'vitest';
import type { Phase } from '../../src/domain/phasen/profil.ts';
import { herstellerstadium } from '../../src/domain/rechner.ts';
import { kalendertag, ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzZweck, zaehlendePflanzungen, type ZaehlendePflanzung } from '../../src/domain/zielbereich.ts';
import { ansatzGrundlage, leitkultur, stadiumEingabe } from '../../src/domain/zielbereich-leitkultur.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import {
  ART,
  artVon,
  ereignisDazu,
  netztopfId,
  pflanzungId,
  platzId,
  RESERVIERT_23,
  satzDazu,
  STEHEND_23,
  ZB_JETZT,
  ZB_SORTE,
  zielbereichTeile,
  type SorteName,
} from '../fixtures/zielbereich.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const P11 = platzId('1.1');
const P23 = platzId('2.3');
const sortiert = (l: readonly string[]) => [...l].sort();

let n = 0;
/** zählende Pflanzungen einer Sorte direkt gebaut; je Pflanzung ein eigener Topf, ausser `topf` ist gesetzt */
function zp(
  sorte: SorteName,
  kulturform: string,
  anzahl = 1,
  e: { phase?: Phase; rolle?: ZaehlendePflanzung['rolle']; topf?: string } = {},
): ZaehlendePflanzung[] {
  return Array.from({ length: anzahl }, () => {
    n += 1;
    return {
      pflanzungId: uid('5a', n),
      satzId: uid('5b', Object.keys(ZB_SORTE).indexOf(sorte) + 1),
      sorteId: ZB_SORTE[sorte],
      artId: artVon(sorte),
      kulturform,
      phase: e.phase ?? 'wachstum',
      rolle: e.rolle ?? 'stehend',
      netztopfId: e.topf ?? uid('5c', n),
    } as ZaehlendePflanzung;
  });
}

const leer = () => zielbereichTeile({ leer: true });

function artSetzen(t: Teile, art: string, felder: Record<string, unknown>) {
  t['art'] = (t['art'] ?? []).map((a) => (a['art_id'] === art ? { ...a, ...felder } : a));
}
function kulturdauerSetzen(t: Teile, art: string, kulturform: string, dauer: number | null) {
  t['art_kulturform'] = (t['art_kulturform'] ?? []).map((k) =>
    k['art_id'] === art && k['kulturform'] === kulturform ? { ...k, kulturdauer_typisch_d: dauer } : k,
  );
}
function gewaehlt(t: Teile, platz: string, art: string, giltAb: string, storniertAm?: string): string {
  return ereignisDazu(t, 'ereignis_platz', {
    typ: 'leitkultur_gewaehlt',
    platzId: platz,
    giltAb,
    daten: { art_id: art },
    ...(storniertAm ? { storniertAm } : {}),
  });
}

/** Zweck, zählende, Leitkultur und Stadiumeingabe wie ansatzGrundlage() */
function stadiumAm(t: Teile, platz: string, jetzt = J) {
  const zweck = ansatzZweck(t, platz, jetzt, Z);
  const z = zaehlendePflanzungen(t, platz, zweck, jetzt, Z);
  const lk = leitkultur(t, platz, z);
  const eingabe = stadiumEingabe(t, platz, zweck, lk.art === 'art' ? lk.artId : undefined, z, jetzt, Z);
  return {
    zweck,
    leitkultur: lk,
    eingabe,
    stadium: eingabe ? herstellerstadium(eingabe, jetzt, Z) : undefined,
  };
}

describe('R2.3 Leitkultur in vier Stufen', () => {
  it('R2.3 Leitkultur ist die Art mit der längsten typischen Kulturdauer ihrer Kulturform (Tomate vor Basilikum in 1.1)', () => {
    const t = leer();
    satzDazu(t, {
      nr: 10,
      sorte: 'ochsenherz',
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2026-11-20',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['1.1.1'], umgesetztAm: '2026-12-20T08:00:00.000Z' },
    });
    satzDazu(t, {
      nr: 11,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-11-15',
      phase: 'wachstum',
      anzahl: 2,
      stehend: { toepfe: ['1.1.2', '1.1.3'], umgesetztAm: '2026-12-20T08:00:00.000Z' },
    });
    // eine ältere Fassung der Kulturform (gueltig_bis gesetzt) zählt nicht
    (t['art_kulturform'] ??= []).push({
      id: uid('44', 99),
      art_id: ART.basilikum,
      kulturform: 'dauerkultur_blatt',
      ernteart: 'einmalig',
      kulturdauer_typisch_d: 200,
      kulturdauer_max_d: null,
      gueltig_bis: '2027-01-01T00:00:00.000Z',
    });
    const z = zaehlendePflanzungen(t, P11, 'bewertung', J, Z);
    expect(leitkultur(t, P11, z)).toEqual({ art: 'art', artId: ART.tomate, grund: 'kulturdauer' });
  });

  it('R2.3 eine Art allein ist Leitkultur; ohne zählende keine', () => {
    const t = zielbereichTeile();
    expect(leitkultur(t, P23, zaehlendePflanzungen(t, P23, 'bewertung', J, Z))).toEqual({
      art: 'art',
      artId: ART.salat,
      grund: 'einzige',
    });
    // stehende Lollo Rossa und einziehende Eichblatt: dieselbe Art
    expect(leitkultur(t, P23, zaehlendePflanzungen(t, P23, 'umsetzen', J, Z))).toEqual({
      art: 'art',
      artId: ART.salat,
      grund: 'einzige',
    });
    expect(leitkultur(t, platzId('2.1'), [])).toEqual({ art: 'keine' });
  });

  it('R2.3 Gleichstand Kulturdauer → höchster Wasserbedarf je Pflanze', () => {
    const t = zielbereichTeile();
    const z = [...zp('rucola', 'babyleaf', 3), ...zp('matador', 'babyleaf', 1)];
    artSetzen(t, ART.spinat, { wasserbedarf_je_pflanze_l: 0.2 });
    expect(leitkultur(t, P11, z)).toEqual({ art: 'art', artId: ART.spinat, grund: 'wasserbedarf' });
    artSetzen(t, ART.rucola, { wasserbedarf_je_pflanze_l: 0.25 });
    expect(leitkultur(t, P11, z)).toEqual({ art: 'art', artId: ART.rucola, grund: 'wasserbedarf' });
  });

  it('R2.3 Gleichstand Kulturdauer und Wasserbedarf → meiste Netztöpfe', () => {
    const t = zielbereichTeile();
    expect(leitkultur(t, P11, [...zp('rucola', 'babyleaf', 2), ...zp('matador', 'babyleaf', 1)])).toEqual({
      art: 'art',
      artId: ART.rucola,
      grund: 'netztoepfe',
    });
    expect(leitkultur(t, P11, [...zp('rucola', 'babyleaf', 1), ...zp('matador', 'babyleaf', 3)])).toEqual({
      art: 'art',
      artId: ART.spinat,
      grund: 'netztoepfe',
    });
    // zwei Pflanzungen im selben Topf zählen als ein Topf: Gleichstand
    const gleich = leitkultur(t, P11, [
      ...zp('rucola', 'babyleaf', 2, { topf: netztopfId('1.1.1') }),
      ...zp('matador', 'babyleaf', 1, { topf: netztopfId('1.1.2') }),
    ]);
    expect(gleich.art).toBe('wahl_noetig');
  });

  it('R2.3 Gleichstand in allen Stufen ohne Wahl → wahl_noetig mit beiden Arten', () => {
    const t = zielbereichTeile();
    const r = leitkultur(t, P11, [...zp('rucola', 'babyleaf'), ...zp('matador', 'babyleaf')]);
    expect(r.art).toBe('wahl_noetig');
    if (r.art === 'wahl_noetig') expect(sortiert(r.kandidaten)).toEqual(sortiert([ART.rucola, ART.spinat]));
  });

  it('R2.3 Gleichstand → Tims Wahl leitkultur_gewaehlt: jüngstes gültiges Ereignis am Platz', () => {
    const z = [...zp('rucola', 'babyleaf'), ...zp('matador', 'babyleaf')];
    const t = zielbereichTeile();
    gewaehlt(t, P11, ART.rucola, '2027-01-10T08:00:00.000Z');
    expect(leitkultur(t, P11, z)).toEqual({ art: 'art', artId: ART.rucola, grund: 'gewaehlt' });
    gewaehlt(t, P11, ART.spinat, '2027-01-15T08:00:00.000Z');
    expect(leitkultur(t, P11, z)).toEqual({ art: 'art', artId: ART.spinat, grund: 'gewaehlt' });
    // storniertes Ereignis zählt nicht: die ältere Wahl gilt
    const s = zielbereichTeile();
    gewaehlt(s, P11, ART.rucola, '2027-01-10T08:00:00.000Z');
    gewaehlt(s, P11, ART.spinat, '2027-01-15T08:00:00.000Z', '2027-01-15T08:01:00.000Z');
    expect(leitkultur(s, P11, z)).toEqual({ art: 'art', artId: ART.rucola, grund: 'gewaehlt' });
    // nur ein storniertes: Wahl nötig
    const u = zielbereichTeile();
    gewaehlt(u, P11, ART.spinat, '2027-01-15T08:00:00.000Z', '2027-01-15T08:01:00.000Z');
    expect(leitkultur(u, P11, z).art).toBe('wahl_noetig');
    // Wahl an einem anderen Platz zählt nicht
    const v = zielbereichTeile();
    gewaehlt(v, platzId('1.2'), ART.spinat, '2027-01-15T08:00:00.000Z');
    expect(leitkultur(v, P11, z).art).toBe('wahl_noetig');
  });

  it('R2.3 Wahl einer Art ausserhalb des Gleichstands wird ignoriert', () => {
    // Basilikum als Babyleaf ohne Kulturdauer: nicht im Gleichstand von Rucola und Spinat
    const z = [...zp('rucola', 'babyleaf'), ...zp('matador', 'babyleaf'), ...zp('genoveser', 'babyleaf')];
    const t = zielbereichTeile();
    gewaehlt(t, P11, ART.basilikum, '2027-01-15T08:00:00.000Z');
    const r = leitkultur(t, P11, z);
    expect(r.art).toBe('wahl_noetig');
    if (r.art === 'wahl_noetig') expect(sortiert(r.kandidaten)).toEqual(sortiert([ART.rucola, ART.spinat]));
    // eine Art, die gar nicht zählt, ebenso
    const u = zielbereichTeile();
    gewaehlt(u, P11, ART.tomate, '2027-01-15T08:00:00.000Z');
    expect(leitkultur(u, P11, z).art).toBe('wahl_noetig');
  });

  it('R2.3 fehlende Kulturdauer zählt als kürzeste, fehlender Wasserbedarf als tiefster (A11)', () => {
    const t = zielbereichTeile();
    // Basilikum als Babyleaf hat keine Zeile in art_kulturform
    expect(leitkultur(t, P11, [...zp('genoveser', 'babyleaf', 3), ...zp('rucola', 'babyleaf')])).toEqual({
      art: 'art',
      artId: ART.rucola,
      grund: 'kulturdauer',
    });
    // Zeile vorhanden, Wert leer
    const u = zielbereichTeile();
    kulturdauerSetzen(u, ART.spinat, 'babyleaf', null);
    expect(leitkultur(u, P11, [...zp('matador', 'babyleaf', 3), ...zp('rucola', 'babyleaf')])).toEqual({
      art: 'art',
      artId: ART.rucola,
      grund: 'kulturdauer',
    });
    const w = zielbereichTeile();
    artSetzen(w, ART.spinat, { wasserbedarf_je_pflanze_l: null });
    expect(leitkultur(w, P11, [...zp('matador', 'babyleaf', 3), ...zp('rucola', 'babyleaf')])).toEqual({
      art: 'art',
      artId: ART.rucola,
      grund: 'wasserbedarf',
    });
  });

  it('R2.3 mehrere Kulturformen einer Art am Platz: die längste Kulturdauer zählt (A11)', () => {
    const t = zielbereichTeile();
    kulturdauerSetzen(t, ART.basilikum, 'dauerkultur_blatt', 80);
    // Salat Kopf 56 allein unterliegt Basilikum 80
    expect(leitkultur(t, P11, [...zp('lollo', 'kopf'), ...zp('genoveser', 'dauerkultur_blatt')])).toEqual({
      art: 'art',
      artId: ART.basilikum,
      grund: 'kulturdauer',
    });
    // mit Salat Schnitt 90 gewinnt Salat
    expect(
      leitkultur(t, P11, [
        ...zp('lollo', 'kopf'),
        ...zp('eichblatt', 'schnitt'),
        ...zp('genoveser', 'dauerkultur_blatt'),
      ]),
    ).toEqual({ art: 'art', artId: ART.salat, grund: 'kulturdauer' });
  });
});

describe('R2.3 Stadium aus der Leitkultur', () => {
  it('R2.3 ältester stehender Satz der Leitkultur bestimmt das Stadium (zwei Sätze Salat, der ältere in Wachstum Tag 20 → wachstum)', () => {
    const t = leer();
    satzDazu(t, {
      nr: 20,
      sorte: 'lollo',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 2,
      stehend: { toepfe: ['2.3.1', '2.3.2'], umgesetztAm: '2026-12-29T08:00:00.000Z' },
    });
    satzDazu(t, {
      nr: 21,
      sorte: 'eichblatt',
      saatdatum: '2027-01-01',
      phase: 'anzucht',
      anzahl: 2,
      stehend: { toepfe: ['2.3.3', '2.3.4'], umgesetztAm: '2027-01-15T08:00:00.000Z' },
    });
    const s = stadiumAm(t, P23);
    expect(s.zweck).toBe('bewertung');
    expect(s.eingabe).toMatchObject({ ort: 'zielgefaess', direktsaat: false, phaseLeitkultur: 'wachstum' });
    if (s.eingabe?.ort === 'zielgefaess' && s.eingabe.umgesetztAm)
      expect(kalendertag(s.eingabe.umgesetztAm, Z)).toBe('2026-12-29');
    expect(s.stadium).toBe('wachstum');
  });

  it('R2.3 1. echte Blätter nur, wenn kein Satz der Leitkultur in Wachstum steht', () => {
    const mit = (wachstum: boolean, anderArt = false) => {
      const t = leer();
      // ältester Satz: Eichblatt in Anzucht, Tag 3 nach dem Umsetzen
      satzDazu(t, {
        nr: 22,
        sorte: 'eichblatt',
        saatdatum: '2026-12-01',
        phase: 'anzucht',
        anzahl: 2,
        stehend: { toepfe: ['2.3.1', '2.3.2'], umgesetztAm: '2027-01-15T08:00:00.000Z' },
      });
      if (wachstum)
        satzDazu(t, {
          nr: 23,
          sorte: anderArt ? 'rucola' : 'lollo',
          kulturform: anderArt ? 'babyleaf' : 'kopf',
          saatdatum: '2026-12-10',
          phase: 'wachstum',
          anzahl: 2,
          stehend: { toepfe: ['2.3.3', '2.3.4'], umgesetztAm: '2026-12-29T08:00:00.000Z' },
        });
      return stadiumAm(t, P23);
    };
    const mitWachstum = mit(true);
    expect(mitWachstum.leitkultur).toMatchObject({ art: 'art', artId: ART.salat });
    expect(mitWachstum.stadium).toBe('wachstum');
    expect(mitWachstum.eingabe).toMatchObject({
      ort: 'zielgefaess',
      direktsaat: false,
      phaseLeitkultur: 'wachstum',
    });
    if (mitWachstum.eingabe?.ort === 'zielgefaess') expect(mitWachstum.eingabe.umgesetztAm).toBeUndefined();
    expect(mit(false).stadium).toBe('echte_blaetter');
    // ein Satz einer anderen Art (Rucola, kürzer als Salat) in Wachstum ändert nichts
    const andere = mit(true, true);
    expect(andere.leitkultur).toMatchObject({ art: 'art', artId: ART.salat });
    expect(andere.stadium).toBe('echte_blaetter');
  });

  it('R2.3 Ansatz für Umsetzen ohne stehende Leitkultur: Leitkultur der einziehenden mit 1. echte Blätter (leeres 1.1, Tomate zieht ein)', () => {
    const tomate = (t: Teile) =>
      satzDazu(t, {
        nr: 24,
        sorte: 'ochsenherz',
        kulturform: 'dauerkultur_frucht',
        saatdatum: '2026-12-20',
        phase: 'anzucht',
        anzahl: 1,
        station: { kennung: '4.2', eintrittAm: '2027-01-02T08:00:00.000Z' },
        reserviert: { toepfe: ['1.1.1'], umsetzenAm: '2027-01-20' },
      });
    const t = leer();
    tomate(t);
    const s = stadiumAm(t, P11);
    expect(s.zweck).toBe('umsetzen');
    expect(s.leitkultur).toMatchObject({ art: 'art', artId: ART.tomate });
    expect(s.eingabe).toMatchObject({ ort: 'zielgefaess', direktsaat: false, phaseLeitkultur: 'anzucht' });
    if (s.eingabe?.ort === 'zielgefaess' && s.eingabe.umgesetztAm)
      expect(kalendertag(s.eingabe.umgesetztAm, Z)).toBe('2027-01-20');
    expect(s.stadium).toBe('echte_blaetter');

    // mit stehendem Basilikum in Wachstum: Leitkultur bleibt die einziehende Tomate (A10)
    const b = leer();
    tomate(b);
    satzDazu(b, {
      nr: 25,
      sorte: 'genoveser',
      kulturform: 'dauerkultur_blatt',
      saatdatum: '2026-11-15',
      phase: 'wachstum',
      anzahl: 2,
      stehend: { toepfe: ['1.1.2', '1.1.3'], umgesetztAm: '2026-12-20T08:00:00.000Z' },
    });
    const mitBasilikum = stadiumAm(b, P11);
    expect(mitBasilikum.leitkultur).toMatchObject({ art: 'art', artId: ART.tomate });
    expect(mitBasilikum.stadium).toBe('echte_blaetter');
  });

  it('R2.3 Ansatz für Umsetzen mit stehender Leitkultur in Wachstum: deren Stadium (2.3 am 4.3.: Eichblatt Wachstum, Lollo F zieht ein)', () => {
    const am4 = new Date('2027-03-04T07:00:00Z');
    const t = leer();
    satzDazu(t, {
      nr: 26,
      sorte: 'eichblatt',
      saatdatum: '2027-01-10',
      phase: 'wachstum',
      anzahl: 3,
      stehend: { toepfe: ['2.3.1', '2.3.2', '2.3.3'], umgesetztAm: '2027-02-05T08:00:00.000Z' },
    });
    satzDazu(t, {
      nr: 27,
      sorte: 'lollo',
      saatdatum: '2027-02-08',
      phase: 'anzucht',
      anzahl: 3,
      station: { kennung: '4.4', eintrittAm: '2027-02-12T08:00:00.000Z' },
      reserviert: { toepfe: ['2.3.4', '2.3.5', '2.3.6'], umsetzenAm: '2027-03-04' },
    });
    const s = stadiumAm(t, P23, am4);
    expect(s.zweck).toBe('umsetzen');
    expect(s.leitkultur).toEqual({ art: 'art', artId: ART.salat, grund: 'einzige' });
    expect(s.eingabe).toMatchObject({ ort: 'zielgefaess', direktsaat: false, phaseLeitkultur: 'wachstum' });
    expect(s.stadium).toBe('wachstum');
  });
});

describe('R4.3 Eingaben für herstellerstadium()', () => {
  /** ein Satz Lollo Rossa in 2.3, umgesetzt `am`, bestätigte Phase `phase` */
  function einSatz(phase: Phase, am: string): Teile {
    const t = leer();
    satzDazu(t, {
      nr: 30,
      sorte: 'lollo',
      saatdatum: '2026-12-15',
      phase,
      anzahl: 2,
      stehend: { toepfe: ['2.3.1', '2.3.2'], umgesetztAm: am },
    });
    return t;
  }
  const TAG8 = new Date('2027-01-19T08:00:00Z');

  it('R4.3 Stadium Zielgefäss Tag 7 nach dem Umsetzen echte_blaetter, Tag 8 in Anzucht echte_blaetter, Tag 8 in Wachstum wachstum', () => {
    const wachstum = einSatz('wachstum', '2027-01-11T08:00:00.000Z');
    expect(stadiumAm(wachstum, P23, J).stadium).toBe('echte_blaetter');
    expect(stadiumAm(wachstum, P23, TAG8).stadium).toBe('wachstum');
    const eingabe = stadiumAm(wachstum, P23, J).eingabe;
    if (eingabe?.ort === 'zielgefaess' && eingabe.umgesetztAm)
      expect(kalendertag(eingabe.umgesetztAm, Z)).toBe('2027-01-11');
    const anzucht = einSatz('anzucht', '2027-01-11T08:00:00.000Z');
    expect(stadiumAm(anzucht, P23, J).stadium).toBe('echte_blaetter');
    expect(stadiumAm(anzucht, P23, TAG8).stadium).toBe('echte_blaetter');
  });

  it('R4.3 TZ Tage seit dem Umsetzen nach Kalendertag in Zürich; storniertes Umsetzen zählt nicht', () => {
    // 10.1. 23:30 UTC = 11.1. 00:30 Zürich
    const t = einSatz('wachstum', '2027-01-10T23:30:00.000Z');
    expect(stadiumAm(t, P23, J).stadium).toBe('echte_blaetter');
    expect(stadiumAm(t, P23, TAG8).stadium).toBe('wachstum');
    // ein späteres, storniertes Umsetzen am 17.1.
    ereignisDazu(t, 'ereignis_pflanzung', {
      typ: 'umsetzen',
      pflanzungId: pflanzungId(30, 1),
      netztopfId: netztopfId('2.3.1'),
      giltAb: '2027-01-17T08:00:00.000Z',
      storniertAm: '2027-01-17T08:05:00.000Z',
      daten: { von_platz_id: platzId('4.4'), von_loch_nr: 1, nach_platz_id: P23, nach_loch_nr: 1 },
    });
    expect(stadiumAm(t, P23, TAG8).stadium).toBe('wachstum');
  });

  it('R4.3 Stadium Blüte → vorbluete, Fruchtbildung → bluete_frucht, nie reife', () => {
    const phasen: [Phase, string][] = [
      ['bluete', 'vorbluete'],
      ['fruchtbildung_reife', 'bluete_frucht'],
      ['wachstum', 'wachstum'],
    ];
    for (const [phase, stadium] of phasen) {
      const t = leer();
      satzDazu(t, {
        nr: 31,
        sorte: 'ochsenherz',
        kulturform: 'dauerkultur_frucht',
        saatdatum: '2026-11-01',
        phase,
        anzahl: 1,
        stehend: { toepfe: ['1.1.1'], umgesetztAm: '2026-12-01T08:00:00.000Z' },
      });
      const s = stadiumAm(t, P11);
      expect(s.eingabe).toMatchObject({ ort: 'zielgefaess', direktsaat: false, phaseLeitkultur: phase });
      expect(s.stadium).toBe(stadium);
      expect(s.stadium).not.toBe('reife');
    }
  });

  it('R4.3 Stadium Direktsaat ab dem Saattag wachstum', () => {
    const t = leer();
    satzDazu(t, {
      nr: 32,
      sorte: 'rucola',
      kulturform: 'babyleaf',
      saatdatum: '2027-01-18',
      phase: 'keimung',
      anzahl: 3,
      direktsaat: '3.2',
    });
    const s = stadiumAm(t, platzId('3.2'));
    expect(s.zweck).toBe('direktsaat');
    expect(s.leitkultur).toEqual({ art: 'art', artId: ART.rucola, grund: 'einzige' });
    expect(s.eingabe).toMatchObject({ ort: 'zielgefaess', direktsaat: true });
    expect(s.stadium).toBe('wachstum');
  });

  it('R4.3 Stadium Station: Eintritt des ältesten Satzes Tag 14 wurzeln_keimung, Tag 15 echte_blaetter', () => {
    const t = leer();
    const P44 = platzId('4.4');
    const [p1, p2] = satzDazu(t, {
      nr: 33,
      sorte: 'lollo',
      saatdatum: '2026-12-28',
      phase: 'anzucht',
      anzahl: 2,
      station: { kennung: '4.4', eintrittAm: '2027-01-04T08:00:00.000Z' },
    }) as [string, string];
    // jüngerer Satz mit späterem Eintritt
    satzDazu(t, {
      nr: 34,
      sorte: 'rucola',
      kulturform: 'babyleaf',
      saatdatum: '2027-01-05',
      phase: 'anzucht',
      anzahl: 2,
      station: { kennung: '4.4', eintrittAm: '2027-01-10T08:00:00.000Z' },
    });
    // stornierter früherer Eintritt und späteres Verschieben innerhalb der Station
    ereignisDazu(t, 'ereignis_pflanzung', {
      typ: 'verschieben',
      pflanzungId: p1,
      giltAb: '2027-01-01T08:00:00.000Z',
      storniertAm: '2027-01-01T08:05:00.000Z',
      daten: { von_platz_id: platzId('A1'), nach_platz_id: P44, nach_loch_nr: 1 },
    });
    ereignisDazu(t, 'ereignis_pflanzung', {
      typ: 'verschieben',
      pflanzungId: p2,
      giltAb: '2027-01-08T08:00:00.000Z',
      daten: { von_platz_id: P44, nach_platz_id: P44, nach_loch_nr: 5 },
    });
    const tag14 = stadiumAm(t, P44, J);
    expect(tag14.eingabe?.ort).toBe('station');
    if (tag14.eingabe?.ort === 'station')
      expect(kalendertag(tag14.eingabe.aeltesterEintrittAm, Z)).toBe('2027-01-04');
    expect(tag14.stadium).toBe('wurzeln_keimung');
    expect(stadiumAm(t, P44, new Date('2027-01-19T08:00:00Z')).stadium).toBe('echte_blaetter');
  });

  it('R4.3 Stadium Anzuchtbox anfeuchten, ohne zählende kein Vorschlag', () => {
    const t = zielbereichTeile();
    const PA1 = platzId('A1');
    const box = stadiumAm(t, PA1);
    expect(box.eingabe).toEqual({ ort: 'anzuchtbox' });
    expect(box.stadium).toBe('anfeuchten');
    const P21 = platzId('2.1');
    const ohne = stadiumAm(t, P21);
    expect(ohne.zweck).toBe('ohne');
    expect(ohne.eingabe).toBeUndefined();
    const g = ansatzGrundlage(t, P21, J, Z);
    expect(g.zweck).toBe('ohne');
    expect(g.stadiumVorschlag).toBeUndefined();
    expect(g.pflanzungIds).toEqual([]);
    expect(g.leitkultur).toEqual({ art: 'keine' });
    expect(g.gerechnetFuer).toBe('niemand, Ziel-EC und Stadium von Hand');
  });
});

describe('R2.3 ansatzGrundlage', () => {
  it('R2.3 ansatzGrundlage 2.3 mit Umsetzen in 3 Tagen: Zweck umsetzen, 6 Pflanzungen, Zielbereich 1.0 bis 1.2, Leitkultur Salat, Stadium wachstum', () => {
    const t = zielbereichTeile();
    const g = ansatzGrundlage(t, P23, J, Z);
    expect(g.zweck).toBe('umsetzen');
    expect(g.zaehlende).toHaveLength(6);
    expect(sortiert(g.pflanzungIds)).toEqual(sortiert([...STEHEND_23, ...RESERVIERT_23]));
    expect(g.schnittmenge.art).toBe('ok');
    if (g.schnittmenge.art === 'ok') expect(g.schnittmenge.ec).toEqual({ min: 100, max: 120 });
    expect(g.leitkultur).toEqual({ art: 'art', artId: ART.salat, grund: 'einzige' });
    expect(g.stadiumVorschlag).toBe('wachstum');
    expect(g.gerechnetFuer).toBe('3 × Salat Wachstum, 3 reserviert Salat Anzucht');
  });

  it('R2.3 ansatzGrundlage 2.3: stehende Leitkultur vor 4 Tagen umgesetzt → echte_blaetter (Einwurzeln, R4.3)', () => {
    const t = zielbereichTeile({ umgesetztAm: '2027-01-14T08:00:00.000Z' });
    expect(ansatzGrundlage(t, P23, J, Z).stadiumVorschlag).toBe('echte_blaetter');
  });
});
