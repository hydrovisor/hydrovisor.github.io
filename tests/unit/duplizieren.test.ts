// Satz duplizieren mit Freiprüfung der Zieltöpfe (Plan 25 Testliste; UC5-AK16, R11.1, R11.2, R11.3, R8.2, TZ, TO2).
// Injizierte Uhr 2027-02-18T08:00:00Z (W4), Zeitzone Europe/Zurich; Regal R und Wissen aus tests/fixtures/saeen.ts,
// art_kulturform und Sätze aus tests/fixtures/duplizieren.ts. Salat setzt dort 14 Tage nach der Saat um: ein
// Duplikat vom 18.2. hat das Umsetzdatum U = 4.3.
//
// Vertrag (Plan 25 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   belegung.ts
//     voraussichtlichesEnde(teile, pflanzungId, bezugUmsetzen?): { ernteart?; endeAm? }
//       einmalig: Bezug + ernte_ab_d; Bezug = bezugUmsetzen, sonst Direktsaat saatdatum, sonst
//       saatdatum + art.umsetzen_ab_d (A1, A5); mehrfach: saatdatum + kulturdauer_max_d; ohne Zeile {}; ohne Feld
//       nur { ernteart }.
//     topfPrognose(teile, netztopfId, umsetzenAm, direktsaat): TopfPrognose | undefined
//       { netztopfId; kennung; platzId; lochNr; groesseMm; frei; grund: leer|nachfolge|belegt|reserviert;
//         belegtBis?; vorgaenger: { pflanzungId; satzId; art: steht|kommt; ernteart?; endeAm? }[] }
//       belegtBis nur, wenn ein Vorgänger besteht und alle Enden bekannt sind (grösstes Ende).
//   duplizieren.ts
//     duplizierbareSaetze(teile, anlageId, hoechstens = 3): SatzKopieWahl[] (neueste zuerst)
//       text «<Sorte> · <Kulturform> · gesät T.M. · <Gefäss>, <n> Töpfe» (mit Zielgefäss)
//     satzDuplizieren(teile, satzId, begonnenAm, jetzt, zeitzone): DuplikatVorschlag | undefined
//       toepfe: TopfPrognose der Töpfe des Originals nach Kennung; ziel auch bei «Ziel später»;
//       eingabe.einstieg 'duplizieren', eingabe.saetze[0].kopiertVon = Original; ohne freie Töpfe zieltopfIds [] und
//       pflanzenOhneZiel = Zahl der Töpfe des Originals; Hinweise:
//         «<Gefäss> belegt bis voraussichtlich T.M.; frei gleicher Grösse: a, b» bzw. «<Gefäss> belegt, Ende
//         unbekannt; frei gleicher Grösse: …», «frei gleicher Grösse: keine», mehr als sechs: die ersten sechs und
//         «, …»
//         «Kulturform <Name> nicht mehr erlaubt, Vorgabe <Name>»
//         «Anzuchtbox <alt> nicht mehr vorhanden, Box <neu> nach Keimart»
//         «Zielgefäss <Kennung> nicht wählbar»
//         «Umsetzdatum fehlt in der Wissensbasis, Ziel später» (wie Säen)
//     freiGleicherGroesse(teile, anlageId, { platzId; groesseMm; direktsaat; umsetzenAm; ohne }): string[]
//       alle freien Kennungen (nicht gekürzt): zuerst das Gefäss selbst nach Loch, dann die übrigen Zielgefässe
//       gleicher Art (Anzucht oder Direktsaat) nach Kennung; das Kürzen auf sechs macht belegtHinweis().
//     belegtHinweis(zielKennung, nichtFrei, frei): string
//     satzgroesse(teile, { platzId; groesseMm; artId; kulturform; direktsaat }): Satzgroesse | undefined
//       { loecher; standzeitTage; pflanzen; text «Fester Takt alle 14 Tage: n Pflanzen je Folgesatz
//         (l Löcher × 14 / s Tage)» }
//   saeen.ts
//     zieltoepfe(teile, platzId, ausgewaehlt, umsetzenAm?, direktsaat?): Zieltopf[] mit belegtBis? (Nachfolge)
//     saatEingabePruefen: Grund «Topf 2.3.1 ist belegt» / «Topf 2.3.1 ist reserviert» am Umsetzdatum des Satzes
//     saatVorgang: satz.kopiert_von = kopiertVon ?? null; pflanzvorgang.einstieg 'duplizieren' (rückdatiert
//       'nacherfassung')
import { describe, expect, it } from 'vitest';
import type { Schritt, Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { topfPrognose, voraussichtlichesEnde } from '../../src/domain/pflanzung/belegung.ts';
import {
  belegtHinweis,
  duplizierbareSaetze,
  freiGleicherGroesse,
  satzDuplizieren,
  satzgroesse,
} from '../../src/domain/pflanzung/duplizieren.ts';
import {
  saatEingabePruefen,
  saatVorgang,
  zieltoepfe,
  type SaatEingabe,
} from '../../src/domain/pflanzung/saeen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  artSetzen,
  dauerhaftBelegen,
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  pflanzungId,
  reservieren,
  satzAnlegen,
  satzId,
  toepfeVon,
} from '../fixtures/duplizieren.ts';
import {
  gefaessId,
  netztopfId,
  platzId,
  uid,
  vereinen,
  weitereAnlage,
  type Teile,
} from '../fixtures/regal.ts';
import { ANLAGE_R, SORTE } from '../fixtures/saeen.ts';

const JETZT = JETZT_W4;
const Z = ZEITZONE;
const BEGONNEN = new Date('2027-02-18T07:59:00Z');
/** Umsetzdatum eines Salat-Duplikats vom 18.2. (Saat + 14) */
const U = '2027-03-04';
const ORIGINAL = satzId(70);

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5b', n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang, tabelle?: string) =>
  v
    .filter((s): s is Neu => s.art === 'neu' && (tabelle === undefined || s.tabelle === tabelle))
    .map((s) => s.felder);
const toepfe = (...kennungen: string[]) => kennungen.map((k) => netztopfId(k));

/**
 * Original: Lollo Rossa (Kulturform nach Wahl) gesät 7.1. in A1, 4 Samen je Schwamm, 5 Schwämme; zwei Pflanzungen
 * stehen in 2.3.1 und 2.3.2, drei sind überzählig.
 */
function mitOriginal(kulturform: 'schnitt' | 'kopf', t: Teile = duplizierTeile()): Teile {
  satzAnlegen(t, {
    nr: 70,
    sorteId: SORTE.lollo,
    kulturform,
    saatdatum: '2027-01-07',
    box: 'A1',
    samen: 4,
    schwaemme: 5,
  });
  pflanzungAnlegen(t, 70, 1, { topf: '2.3.1' });
  pflanzungAnlegen(t, 70, 2, { topf: '2.3.2' });
  for (const k of [3, 4, 5]) pflanzungAnlegen(t, 70, k, { status: 'ueberzaehlig' });
  return t;
}

const duplizieren = (t: Teile, id = ORIGINAL, jetzt = JETZT) => satzDuplizieren(t, id, BEGONNEN, jetzt, Z);
const belegtTexte = (h: readonly string[]) => h.filter((x) => x.includes('belegt'));

describe('UC5-AK16 Satz duplizieren: Übernahme und Freiprüfung (R11.1, R11.2)', () => {
  it('UC5-AK16 übernimmt Sorte, Kulturform, Anzuchtort, Samen je Schwamm, Schwammzahl und Zielgefäss', () => {
    const t = mitOriginal('schnitt');
    const v = duplizieren(t);
    expect(v).toBeDefined();
    expect(v?.eingabe).toMatchObject({
      anlageId: ANLAGE_R,
      einstieg: 'duplizieren',
      saatdatum: '2027-02-18',
      zielPlatzId: platzId('2.3'),
    });
    expect(v?.eingabe.begonnenAm.getTime()).toBe(BEGONNEN.getTime());
    expect(v?.eingabe.saetze).toHaveLength(1);
    const [s] = v?.eingabe.saetze ?? [];
    expect(s).toMatchObject({
      sorteId: SORTE.lollo,
      kulturform: 'schnitt',
      boxPlatzId: platzId('A1'),
      samenJeSchwamm: 4,
      schwaemme: 5,
      kopiertVon: ORIGINAL,
    });
    // Schnitt: Saat 7.1. + Kulturdauer max. 56 = 4.3. ≤ U 4.3. → beide Töpfe als Nachfolge übernommen
    expect([...(s?.zieltopfIds ?? [])].sort()).toEqual(toepfe('2.3.1', '2.3.2').sort());
    expect(v?.ziel).toEqual({ platzId: platzId('2.3'), kennung: '2.3', direktsaat: false });
    expect(v?.umsetzenAm).toBe(U);
    expect(v?.toepfe.map((p) => [p.kennung, p.frei, p.grund, p.belegtBis])).toEqual([
      ['2.3.1', true, 'nachfolge', U],
      ['2.3.2', true, 'nachfolge', U],
    ]);
    expect(belegtTexte(v?.hinweise ?? [])).toEqual([]);
    // die Packung des Originals zählt nicht; unbekannter oder stornierter Satz: undefined
    expect(duplizieren(t, satzId(99))).toBeUndefined();
    const storniert = mitOriginal('schnitt');
    for (const z of storniert['satz'] ?? []) z['storniert_am'] = '2027-01-08T10:00:00.000Z';
    expect(duplizieren(storniert)).toBeUndefined();
  });

  it('UC5-AK16 einmalige Ernte vor dem Umsetzdatum: Zieltopf übernommen als Nachfolge', () => {
    // Kopf: Bezug Umsetzen 7.1. + 14 = 21.1., Ernte ab 28 → E 18.2. < U 4.3.
    const t = mitOriginal('kopf');
    expect(voraussichtlichesEnde(t, pflanzungId(70, 1))).toEqual({
      ernteart: 'einmalig',
      endeAm: '2027-02-18',
    });
    const p = topfPrognose(t, netztopfId('2.3.1'), U, false);
    expect(p).toMatchObject({
      netztopfId: netztopfId('2.3.1'),
      kennung: '2.3.1',
      platzId: platzId('2.3'),
      lochNr: 1,
      groesseMm: 80,
      frei: true,
      grund: 'nachfolge',
      belegtBis: '2027-02-18',
    });
    expect(p?.vorgaenger).toEqual([
      {
        pflanzungId: pflanzungId(70, 1),
        satzId: ORIGINAL,
        art: 'steht',
        ernteart: 'einmalig',
        endeAm: '2027-02-18',
      },
    ]);
    const v = duplizieren(t);
    expect([...(v?.eingabe.saetze[0]?.zieltopfIds ?? [])].sort()).toEqual(toepfe('2.3.1', '2.3.2').sort());
    expect(v?.eingabe.zielPlatzId).toBe(platzId('2.3'));
    expect(belegtTexte(v?.hinweise ?? [])).toEqual([]);
  });

  it('UC5-AK16 einmalige Ernte am Umsetzdatum: nicht frei, Ziel später mit Hinweis', () => {
    // Ernte ab 42 → E 21.1. + 42 = 4.3. = U: nicht «vor dem Umsetzdatum»
    const t = mitOriginal('kopf');
    kulturformSetzen(t, 'lactuca_sativa', 'kopf', { ernte_ab_d: 42 });
    expect(topfPrognose(t, netztopfId('2.3.1'), U, false)).toMatchObject({
      frei: false,
      grund: 'belegt',
      belegtBis: U,
    });
    // ein Tag später umgesetzt wäre frei
    expect(topfPrognose(t, netztopfId('2.3.1'), '2027-03-05', false)).toMatchObject({
      frei: true,
      grund: 'nachfolge',
    });
    const v = duplizieren(t);
    const s = v?.eingabe.saetze[0];
    expect(s?.zieltopfIds).toEqual([]);
    expect(s?.pflanzenOhneZiel).toBe(2);
    expect(s?.schwaemme).toBe(5);
    expect(v?.eingabe.zielPlatzId).toBeUndefined();
    // Deckel in Schritt 2 trotzdem: Ziel bleibt bekannt
    expect(v?.ziel).toEqual({ platzId: platzId('2.3'), kennung: '2.3', direktsaat: false });
    const hinweis = belegtTexte(v?.hinweise ?? []);
    expect(hinweis).toHaveLength(1);
    expect(hinweis[0]).toMatch(/^2\.3 belegt bis voraussichtlich 4\.3\.; frei gleicher Grösse: 2\.3\.3, /);
  });

  it('UC5-AK16 Ernte möglich ab zählt ab Umsetzen, bei Direktsaat ab Saat', () => {
    const t = mitOriginal('kopf');
    // Anzucht: ab Umsetzen (Saat 7.1. + 14 = 21.1.) + 28 = 18.2., nicht Saat + 28 = 4.2. (A1)
    expect(voraussichtlichesEnde(t, pflanzungId(70, 1)).endeAm).toBe('2027-02-18');
    // mit geplantem Umsetztag der Reservierung (Vorgänger «kommt»): 25.1. + 28 = 22.2.
    expect(voraussichtlichesEnde(t, pflanzungId(70, 1), '2027-01-25').endeAm).toBe('2027-02-22');
    // Direktsaat Rucola Babyleaf in 3.1, Saat 21.1. + Ernte ab 35 = 25.2.
    satzAnlegen(t, {
      nr: 80,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-01-21',
      direktsaat: '3.1',
    });
    pflanzungAnlegen(t, 80, 1, { topf: '3.1.1' });
    expect(voraussichtlichesEnde(t, pflanzungId(80, 1))).toEqual({
      ernteart: 'einmalig',
      endeAm: '2027-02-25',
    });
    // mehrfach: Saat + Kulturdauer max. (unabhängig vom Umsetzen)
    const schnitt = mitOriginal('schnitt');
    expect(voraussichtlichesEnde(schnitt, pflanzungId(70, 1))).toEqual({ ernteart: 'mehrfach', endeAm: U });
  });

  it('UC5-AK16 Schnitt: Kulturdauer max. am Umsetzdatum erreicht: Zieltopf übernommen', () => {
    const t = mitOriginal('schnitt');
    expect(topfPrognose(t, netztopfId('2.3.2'), U, false)).toMatchObject({
      frei: true,
      grund: 'nachfolge',
      belegtBis: U,
    });
    expect(duplizieren(t)?.eingabe.saetze[0]?.zieltopfIds).toHaveLength(2);
  });

  it('UC5-AK16 Schnitt: Kulturdauer max. einen Tag nach dem Umsetzdatum: Ziel später', () => {
    const t = mitOriginal('schnitt');
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: 57 });
    expect(topfPrognose(t, netztopfId('2.3.1'), U, false)).toMatchObject({
      frei: false,
      grund: 'belegt',
      belegtBis: '2027-03-05',
    });
    const v = duplizieren(t);
    expect(v?.eingabe.saetze[0]?.zieltopfIds).toEqual([]);
    expect(v?.eingabe.zielPlatzId).toBeUndefined();
    expect(belegtTexte(v?.hinweise ?? [])[0]).toMatch(/^2\.3 belegt bis voraussichtlich 5\.3\.; /);
  });

  it('UC5-AK16 Mehrfachernte vor Kulturdauer max. gibt nichts frei', () => {
    const t = mitOriginal('schnitt');
    // Teilernte am 11.2. (Ereignis ernte {art: teil}) verschiebt nichts (R11.2)
    (t['ereignis'] ??= []).push({
      id: uid('33', 900),
      client_id: uid('33', 900),
      typ: 'ernte',
      pflanzung_id: pflanzungId(70, 1),
      platz_id: platzId('2.3'),
      daten: { art: 'teil' },
      gilt_ab: '2027-02-11T09:00:00.000Z',
      storniert_am: null,
    });
    for (const umsetzen of ['2027-03-03', '2027-02-25']) {
      expect(topfPrognose(t, netztopfId('2.3.1'), umsetzen, false), umsetzen).toMatchObject({
        frei: false,
        grund: 'belegt',
        belegtBis: U,
      });
      expect(zieltoepfe(t, platzId('2.3'), new Map(), umsetzen, false)[0]?.zustand, umsetzen).toBe('belegt');
    }
  });

  it('UC5-AK16 Hinweis «2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: 2.3.5, 2.3.6»', () => {
    // Original Kopf mit E 4.3.; 2.3.3, 2.3.4 und alle übrigen 8-cm-Gefässe dauerhaft belegt (Tomate, Ende unbekannt)
    const t = mitOriginal('kopf');
    kulturformSetzen(t, 'lactuca_sativa', 'kopf', { ernte_ab_d: 42 });
    dauerhaftBelegen(t, 90, SORTE.ochsenherz, [
      '2.3.3',
      '2.3.4',
      ...toepfeVon('1.1', 4),
      ...toepfeVon('1.2', 4),
      ...toepfeVon('2.1', 6),
      ...toepfeVon('2.2', 2),
    ]);
    const v = duplizieren(t);
    expect(belegtTexte(v?.hinweise ?? [])).toEqual([
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: 2.3.5, 2.3.6',
    ]);
    // dieselbe Formel direkt
    const nichtFrei = v?.toepfe.filter((p) => !p.frei) ?? [];
    expect(nichtFrei.map((p) => p.kennung)).toEqual(['2.3.1', '2.3.2']);
    expect(belegtHinweis('2.3', nichtFrei, ['2.3.5', '2.3.6'])).toBe(
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: 2.3.5, 2.3.6',
    );
  });

  it('UC5-AK16 frei gleicher Grösse: keine, und höchstens sechs Kennungen', () => {
    const t = mitOriginal('kopf');
    kulturformSetzen(t, 'lactuca_sativa', 'kopf', { ernte_ab_d: 42 });
    // ohne weitere Belegung: zuerst 2.3, dann die übrigen Anzucht-Zielgefässe nach Kennung, keine Kratky-Töpfe
    const frei = freiGleicherGroesse(t, ANLAGE_R, {
      platzId: platzId('2.3'),
      groesseMm: 80,
      direktsaat: false,
      umsetzenAm: U,
      ohne: new Set(),
    });
    expect(frei.slice(0, 6)).toEqual(['2.3.3', '2.3.4', '2.3.5', '2.3.6', '1.1.1', '1.1.2']);
    expect(frei.length).toBeGreaterThan(6);
    expect(frei.some((k) => k.startsWith('3.') || k.startsWith('4.'))).toBe(false);
    expect(frei).not.toContain('2.3.1');
    expect(belegtTexte(duplizieren(t)?.hinweise ?? [])).toEqual([
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: 2.3.3, 2.3.4, 2.3.5, 2.3.6, 1.1.1, 1.1.2, …',
    ]);
    // «ohne» nimmt Töpfe heraus
    expect(
      freiGleicherGroesse(t, ANLAGE_R, {
        platzId: platzId('2.3'),
        groesseMm: 80,
        direktsaat: false,
        umsetzenAm: U,
        ohne: new Set([netztopfId('2.3.3')]),
      })[0],
    ).toBe('2.3.4');
    // alle 8-cm-Töpfe der Anlage belegt: «keine»
    dauerhaftBelegen(t, 90, SORTE.ochsenherz, [
      ...['2.3.3', '2.3.4', '2.3.5', '2.3.6'],
      ...toepfeVon('1.1', 4),
      ...toepfeVon('1.2', 4),
      ...toepfeVon('2.1', 6),
      ...toepfeVon('2.2', 2),
    ]);
    expect(belegtTexte(duplizieren(t)?.hinweise ?? [])).toEqual([
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: keine',
    ]);
    // Formel direkt: sieben Kennungen → sechs und «…»
    const nichtFrei = duplizieren(t)?.toepfe.filter((p) => !p.frei) ?? [];
    expect(belegtHinweis('2.3', nichtFrei, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe(
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: a, b, c, d, e, f, …',
    );
    expect(belegtHinweis('2.3', nichtFrei, ['a', 'b', 'c', 'd', 'e', 'f'])).toBe(
      '2.3 belegt bis voraussichtlich 4.3.; frei gleicher Grösse: a, b, c, d, e, f',
    );
  });

  it('UC5-AK16 teilweise frei: freie Töpfe übernommen, Hinweis nennt das späteste Ende der belegten', () => {
    // Original Schnitt (E 4.3., frei) mit zwei Pflanzungen in 2.3.1, 2.3.2 und zwei geernteten in 2.3.3, 2.3.4;
    // dort stehen jetzt Eichblatt Kopf vom 28.1. (E 11.2. + 28 = 11.3.) und vom 21.1. (E 4.2. + 28 = 4.3.)
    const t = mitOriginal('schnitt');
    pflanzungAnlegen(t, 70, 6, { topf: '2.3.3', status: 'geerntet' });
    pflanzungAnlegen(t, 70, 7, { topf: '2.3.4', status: 'geerntet' });
    satzAnlegen(t, { nr: 81, sorteId: SORTE.eichblatt, kulturform: 'kopf', saatdatum: '2027-01-28' });
    pflanzungAnlegen(t, 81, 1, { topf: '2.3.3' });
    satzAnlegen(t, { nr: 82, sorteId: SORTE.eichblatt, kulturform: 'kopf', saatdatum: '2027-01-21' });
    pflanzungAnlegen(t, 82, 1, { topf: '2.3.4' });

    const v = duplizieren(t);
    const s = v?.eingabe.saetze[0];
    expect([...(s?.zieltopfIds ?? [])].sort()).toEqual(toepfe('2.3.1', '2.3.2').sort());
    expect(s?.schwaemme).toBe(5);
    expect(v?.eingabe.zielPlatzId).toBe(platzId('2.3'));
    expect(v?.toepfe.map((p) => [p.kennung, p.frei, p.belegtBis])).toEqual([
      ['2.3.1', true, U],
      ['2.3.2', true, U],
      ['2.3.3', false, '2027-03-11'],
      ['2.3.4', false, U],
    ]);
    const hinweis = belegtTexte(v?.hinweise ?? []);
    expect(hinweis).toHaveLength(1);
    // übernommene Töpfe nicht unter «frei gleicher Grösse»
    expect(hinweis[0]).toMatch(
      /^2\.3 belegt bis voraussichtlich 11\.3\.; frei gleicher Grösse: 2\.3\.5, 2\.3\.6, 1\.1\.1/,
    );
  });

  it('UC5-AK16 Vorgänger noch in der Anzucht: Topf reserviert, nicht übernommen (R8.2)', () => {
    // Original Kopf vom 10.1., noch auf der Station 4.4, Reservierungen auf 2.3.1 und 2.3.2, geplant 31.1.;
    // E = 31.1. + 28 = 28.2. läge vor U, der Topf bleibt trotzdem reserviert
    const t = duplizierTeile();
    satzAnlegen(t, {
      nr: 70,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: '2027-01-10',
      schwaemme: 2,
    });
    const a = pflanzungAnlegen(t, 70, 1, { station: ['4.4', 1] });
    const b = pflanzungAnlegen(t, 70, 2, { station: ['4.4', 2] });
    reservieren(t, 1, a, '2.3.1', '2027-01-24', '2027-01-31');
    reservieren(t, 2, b, '2.3.2', '2027-01-24', '2027-01-31');
    const p = topfPrognose(t, netztopfId('2.3.1'), U, false);
    expect(p).toMatchObject({ frei: false, grund: 'reserviert', belegtBis: '2027-02-28' });
    expect(p?.vorgaenger).toEqual([
      { pflanzungId: a, satzId: ORIGINAL, art: 'kommt', ernteart: 'einmalig', endeAm: '2027-02-28' },
    ]);
    const v = duplizieren(t);
    expect(v?.eingabe.saetze[0]?.zieltopfIds).toEqual([]);
    expect(v?.eingabe.saetze[0]?.pflanzenOhneZiel).toBe(2);
    expect(v?.ziel?.kennung).toBe('2.3');
    expect(belegtTexte(v?.hinweise ?? [])[0]).toMatch(/^2\.3 belegt/);
  });

  it('UC5-AK16 höchstens eine Nachfolge-Reservierung je belegtem Topf (R11.2)', () => {
    // Schnitt vom 7.1. (E 4.3.) steht in 2.3.1 und 2.3.2; auf 2.3.1 liegt schon die Nachfolge-Reservierung
    // eines Eichblatt-Satzes in der Box
    const t = mitOriginal('schnitt');
    satzAnlegen(t, {
      nr: 83,
      sorteId: SORTE.eichblatt,
      kulturform: 'kopf',
      saatdatum: '2027-02-11',
      schwaemme: 1,
    });
    const folge = pflanzungAnlegen(t, 83, 1);
    reservieren(t, 3, folge, '2.3.1', U);
    const p = topfPrognose(t, netztopfId('2.3.1'), U, false);
    expect(p).toMatchObject({ frei: false, grund: 'reserviert', belegtBis: '2027-04-01' });
    expect(p?.vorgaenger.map((x) => x.art).sort()).toEqual(['kommt', 'steht']);
    expect(topfPrognose(t, netztopfId('2.3.2'), U, false)).toMatchObject({ frei: true, grund: 'nachfolge' });
    const zustand = zieltoepfe(t, platzId('2.3'), new Map(), U, false).map((z) => [z.kennung, z.zustand]);
    expect(zustand.slice(0, 2)).toEqual([
      ['2.3.1', 'reserviert'],
      ['2.3.2', 'frei'],
    ]);
    const e = (topf: string): SaatEingabe => ({
      anlageId: ANLAGE_R,
      einstieg: 'heute',
      begonnenAm: BEGONNEN,
      saatdatum: '2027-02-18',
      zielPlatzId: platzId('2.3'),
      saetze: [
        { sorteId: SORTE.lollo, kulturform: 'kopf', boxPlatzId: platzId('A1'), zieltopfIds: toepfe(topf) },
      ],
    });
    expect(saatEingabePruefen(t, e('2.3.1'), JETZT, Z)).toContainEqual({
      feld: 'ziel',
      grund: 'Topf 2.3.1 ist reserviert',
    });
    expect(saatEingabePruefen(t, e('2.3.2'), JETZT, Z)).toEqual([]);
    // das Duplikat übernimmt nur 2.3.2
    expect(duplizieren(t)?.eingabe.saetze[0]?.zieltopfIds).toEqual(toepfe('2.3.2'));
  });

  it('UC5-AK16 fehlende Ernte- oder Kulturdauer-Daten: nicht frei, «Ende unbekannt»', () => {
    // ohne Zeile in art_kulturform
    const ohneZeile = mitOriginal('schnitt');
    kulturformSetzen(ohneZeile, 'lactuca_sativa', 'schnitt', null);
    expect(voraussichtlichesEnde(ohneZeile, pflanzungId(70, 1))).toEqual({});
    const p = topfPrognose(ohneZeile, netztopfId('2.3.1'), U, false);
    expect(p).toMatchObject({ frei: false, grund: 'belegt' });
    expect(p?.belegtBis).toBeUndefined();
    const v = duplizieren(ohneZeile);
    expect(v?.eingabe.saetze[0]?.zieltopfIds).toEqual([]);
    expect(belegtTexte(v?.hinweise ?? [])[0]).toMatch(
      /^2\.3 belegt, Ende unbekannt; frei gleicher Grösse: 2\.3\.3/,
    );
    // mehrfach ohne Kulturdauer max.
    const ohneMax = mitOriginal('schnitt');
    kulturformSetzen(ohneMax, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: null });
    expect(voraussichtlichesEnde(ohneMax, pflanzungId(70, 1))).toEqual({ ernteart: 'mehrfach' });
    expect(topfPrognose(ohneMax, netztopfId('2.3.1'), '2027-12-31', false)?.frei).toBe(false);
    // einmalig ohne Ernte ab
    const ohneErnte = mitOriginal('kopf');
    kulturformSetzen(ohneErnte, 'lactuca_sativa', 'kopf', { ernte_ab_d: null });
    expect(voraussichtlichesEnde(ohneErnte, pflanzungId(70, 1))).toEqual({ ernteart: 'einmalig' });
    expect(topfPrognose(ohneErnte, netztopfId('2.3.1'), '2027-12-31', false)?.frei).toBe(false);
  });

  /** Rucola Babyleaf direkt in 3.1 gesät am 21.1.: Pflanzung 1 steht in 3.1.1, Pflanzung 2 nur über die
   * Reservierung auf 3.1.2 (Direktsaat-Reservierungen enden nicht mit dem Umsetzen, A4) */
  function direktsaat(status: string): Teile {
    const t = duplizierTeile();
    kulturformSetzen(t, 'eruca_vesicaria', 'babyleaf', { ernte_ab_d: 20 }); // E 10.2. < 18.2.
    satzAnlegen(t, {
      nr: 70,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-01-21',
      direktsaat: '3.1',
      samen: 3,
      schwaemme: 2,
    });
    const a = pflanzungAnlegen(t, 70, 1, { topf: '3.1.1', status });
    const b = pflanzungAnlegen(t, 70, 2, { status });
    reservieren(t, 1, a, '3.1.1', '2027-01-21');
    reservieren(t, 2, b, '3.1.2', '2027-01-21');
    return t;
  }

  it('UC5-AK16 Direktsaat: Topf nur frei, wenn er heute leer ist', () => {
    const t = direktsaat('aktiv');
    const heute = '2027-02-18';
    for (const k of ['3.1.1', '3.1.2']) {
      const p = topfPrognose(t, netztopfId(k), heute, true);
      expect(p, k).toMatchObject({ frei: false, grund: 'belegt', belegtBis: '2027-02-10' });
      expect(
        p?.vorgaenger.map((x) => x.art),
        k,
      ).toEqual(['steht']);
    }
    expect(topfPrognose(t, netztopfId('3.1.5'), heute, true)).toMatchObject({
      frei: true,
      grund: 'leer',
      vorgaenger: [],
    });
    const v = duplizieren(t);
    expect(v?.umsetzenAm).toBe(heute);
    expect(v?.ziel).toEqual({ platzId: platzId('3.1'), kennung: '3.1', direktsaat: true });
    expect(v?.eingabe.saetze[0]).toMatchObject({
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      zieltopfIds: [],
    });
    // frei gleicher Grösse: 5-cm-Töpfe, zuerst 3.1, dann die übrigen Direktsaat-Gefässe
    expect(belegtTexte(v?.hinweise ?? [])[0]).toMatch(
      /^3\.1 belegt bis voraussichtlich 10\.2\.; frei gleicher Grösse: 3\.1\.3, 3\.1\.4, 3\.1\.5, 3\.1\.6, 3\.1\.7, 3\.1\.8, …$/,
    );
    const frei = freiGleicherGroesse(t, ANLAGE_R, {
      platzId: platzId('3.1'),
      groesseMm: 50,
      direktsaat: true,
      umsetzenAm: heute,
      ohne: new Set(),
    });
    expect(frei.slice(0, 7)).toEqual(['3.1.3', '3.1.4', '3.1.5', '3.1.6', '3.1.7', '3.1.8', '3.2.1']);
    expect(frei.some((k) => /^[12]\./.test(k) || k.startsWith('4.'))).toBe(false);
  });

  it('UC5-AK16 geerntete Direktsaat mit offener Reservierung gilt als leer', () => {
    const t = direktsaat('geerntet');
    expect(topfPrognose(t, netztopfId('3.1.1'), '2027-02-18', true)).toMatchObject({
      frei: true,
      grund: 'leer',
      vorgaenger: [],
    });
    const v = duplizieren(t);
    expect(v?.eingabe.zielPlatzId).toBe(platzId('3.1'));
    const s = v?.eingabe.saetze[0];
    expect([...(s?.zieltopfIds ?? [])].sort()).toEqual(toepfe('3.1.1', '3.1.2').sort());
    expect(s?.kopiertVon).toBe(ORIGINAL);
    expect(belegtTexte(v?.hinweise ?? [])).toEqual([]);
    expect(saatEingabePruefen(t, v?.eingabe as SaatEingabe, JETZT, Z)).toEqual([]);
  });

  it('UC5-AK16 ohne Umsetzen ab oder ohne wählbares Zielgefäss: Ziel später mit Hinweis', () => {
    // Petersilie (ohne «Umsetzen ab») stand in 2.2.1
    const t = duplizierTeile();
    satzAnlegen(t, {
      nr: 70,
      sorteId: SORTE.mooskrause,
      kulturform: 'schnitt',
      saatdatum: '2027-01-07',
      box: 'A3',
    });
    pflanzungAnlegen(t, 70, 1, { topf: '2.2.1' });
    const v = duplizieren(t);
    expect(v?.umsetzenAm).toBeUndefined();
    expect(v?.eingabe.zielPlatzId).toBeUndefined();
    expect(v?.eingabe.saetze[0]).toMatchObject({
      boxPlatzId: platzId('A3'),
      zieltopfIds: [],
      pflanzenOhneZiel: 1,
    });
    expect(v?.hinweise).toContain('Umsetzdatum fehlt in der Wissensbasis, Ziel später');

    // Gefäss 2.3 entfernt: kein Zielgefäss
    const entfernt = mitOriginal('schnitt');
    for (const s of entfernt['v_gefaess_status'] ?? [])
      if (s['gefaess_id'] === gefaessId('2.3')) s['status'] = 'entfernt';
    const w = duplizieren(entfernt);
    expect(w?.eingabe.zielPlatzId).toBeUndefined();
    expect(w?.eingabe.saetze[0]?.zieltopfIds).toEqual([]);
    expect(w?.hinweise).toContain('Zielgefäss 2.3 nicht wählbar');
  });

  it('UC5-AK16 zieltoepfe mit Umsetzdatum: Nachfolge-Topf frei mit belegtBis, ohne Umsetzdatum belegt wie bisher', () => {
    const t = mitOriginal('schnitt');
    const ohne = zieltoepfe(t, platzId('2.3'), new Map());
    expect(ohne.map((z) => z.zustand)).toEqual(['belegt', 'belegt', 'frei', 'frei', 'frei', 'frei']);
    for (const z of ohne) expect(z.belegtBis).toBeUndefined();
    const mit = zieltoepfe(t, platzId('2.3'), new Map([[netztopfId('2.3.2'), 1]]), U, false);
    expect(mit.map((z) => [z.lochNr, z.zustand, z.belegtBis])).toEqual([
      [1, 'frei', U],
      [2, 'gewaehlt', U],
      [3, 'frei', undefined],
      [4, 'frei', undefined],
      [5, 'frei', undefined],
      [6, 'frei', undefined],
    ]);
    expect(mit[1]?.marke).toBe(1);
    // einen Tag zu früh: belegt
    expect(zieltoepfe(t, platzId('2.3'), new Map(), '2027-03-03', false)[0]?.zustand).toBe('belegt');
  });

  it('UC5-AK16 saatEingabePruefen nimmt den Nachfolge-Topf an und lehnt ihn ab, wenn das Umsetzdatum vor dem Ende liegt', () => {
    // Schnitt E 4.3.: Saat 18.2. → U 4.3. frei; Saat 17.2. → U 3.3. belegt
    const t = mitOriginal('schnitt');
    const e = (saatdatum: string): SaatEingabe => ({
      anlageId: ANLAGE_R,
      einstieg: 'heute',
      begonnenAm: BEGONNEN,
      saatdatum,
      zielPlatzId: platzId('2.3'),
      saetze: [
        { sorteId: SORTE.lollo, kulturform: 'kopf', boxPlatzId: platzId('A1'), zieltopfIds: toepfe('2.3.1') },
      ],
    });
    expect(saatEingabePruefen(t, e('2027-02-18'), JETZT, Z)).toEqual([]);
    expect(saatEingabePruefen(t, e('2027-02-17'), JETZT, Z)).toContainEqual({
      feld: 'ziel',
      grund: 'Topf 2.3.1 ist belegt',
    });
    expect(saatVorgang(t, e('2027-02-17'), neueIds(), JETZT, Z)).toEqual([]);
    const v = saatVorgang(t, e('2027-02-18'), neueIds(), JETZT, Z);
    expect(neue(v, 'reservierung').map((r) => [r['netztopf_id'], r['umsetzen_vorgabe_am']])).toEqual([
      [netztopfId('2.3.1'), U],
    ]);
  });

  it('UC5-AK16 saatVorgang schreibt kopiert_von und Einstieg duplizieren, rückdatiert nacherfassung', () => {
    // Kopf E 18.2.: auch rückdatiert auf 16.2. (U 2.3.) bleiben die Töpfe frei
    const t = mitOriginal('kopf');
    const vorschlag = duplizieren(t);
    expect(vorschlag).toBeDefined();
    const eingabe = vorschlag?.eingabe as SaatEingabe;
    const v = saatVorgang(t, eingabe, neueIds(), JETZT, Z);
    expect(neue(v, 'pflanzvorgang')[0]?.['einstieg']).toBe('duplizieren');
    const [satz, ...mehr] = neue(v, 'satz');
    expect(mehr).toEqual([]);
    expect(satz).toMatchObject({
      sorte_id: SORTE.lollo,
      kulturform: 'kopf',
      kopiert_von: ORIGINAL,
      anzuchtort_platz_id: platzId('A1'),
      samen_je_schwamm: 4,
      anzahl_schwaemme: 5,
      saatdatum: '2027-02-18',
    });
    expect(neue(v, 'pflanzung')).toHaveLength(5);
    expect(neue(v, 'reservierung').map((r) => r['umsetzen_vorgabe_am'])).toEqual([U, U]);

    const rueck = saatVorgang(t, { ...eingabe, saatdatum: '2027-02-16' }, neueIds(), JETZT, Z);
    expect(neue(rueck, 'pflanzvorgang')[0]?.['einstieg']).toBe('nacherfassung');
    expect(neue(rueck, 'satz')[0]?.['kopiert_von']).toBe(ORIGINAL);
    expect(neue(rueck, 'reservierung').map((r) => r['umsetzen_vorgabe_am'])).toEqual([
      '2027-03-02',
      '2027-03-02',
    ]);

    // gewöhnliches Säen: kopiert_von null
    const ohne: SaatEingabe = {
      ...eingabe,
      einstieg: 'heute',
      saetze: eingabe.saetze.map((s) => {
        const k = { ...s };
        delete k.kopiertVon;
        return k;
      }),
    };
    expect(neue(saatVorgang(t, ohne, neueIds(), JETZT, Z), 'satz')[0]?.['kopiert_von']).toBeNull();
  });
});

describe('R11.3 Satzgrösse', () => {
  const ziel23 = {
    platzId: platzId('2.3'),
    groesseMm: 80,
    artId: 'lactuca_sativa',
    kulturform: 'schnitt',
    direktsaat: false,
  };

  it('R11.3 Satzgrösse 2.3: 6 Löcher × 14 / 42 Tage = 2 Pflanzen je Folgesatz', () => {
    const t = duplizierTeile();
    // Standzeit = Kulturdauer typisch 56 − Umsetzen ab 14 = 42
    expect(satzgroesse(t, ziel23)).toEqual({
      loecher: 6,
      standzeitTage: 42,
      pflanzen: 2,
      text: 'Fester Takt alle 14 Tage: 2 Pflanzen je Folgesatz (6 Löcher × 14 / 42 Tage)',
    });
    expect(duplizieren(mitOriginal('schnitt'))?.satzgroesse).toEqual(satzgroesse(t, ziel23));
  });

  it('R11.3 Rundung kaufmännisch, mindestens 1', () => {
    const t = duplizierTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: 70 }); // Standzeit 56
    expect(satzgroesse(t, ziel23)).toMatchObject({ loecher: 6, standzeitTage: 56, pflanzen: 2 }); // 1.5 → 2
    const ziel22 = { ...ziel23, platzId: platzId('2.2') };
    expect(satzgroesse(t, ziel22)).toMatchObject({ loecher: 2, pflanzen: 1 }); // 0.5 → 1
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: 84 }); // Standzeit 70
    expect(satzgroesse(t, ziel22)).toMatchObject({ loecher: 2, standzeitTage: 70, pflanzen: 1 }); // 0.4 → 1
    // Direktsaat: Standzeit = Kulturdauer typisch; 3.1 mit 8 Töpfen 5 cm, Rucola Babyleaf 35 → 3.2 → 3
    expect(
      satzgroesse(t, {
        platzId: platzId('3.1'),
        groesseMm: 50,
        artId: 'eruca_vesicaria',
        kulturform: 'babyleaf',
        direktsaat: true,
      }),
    ).toMatchObject({ loecher: 8, standzeitTage: 35, pflanzen: 3 });
  });

  it('R11.3 ohne Kulturdauer typisch oder Standzeit ≤ 0 kein Hinweis', () => {
    const t = duplizierTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: null });
    expect(satzgroesse(t, ziel23)).toBeUndefined();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: 14 });
    expect(satzgroesse(t, ziel23)).toBeUndefined();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: 10 });
    expect(satzgroesse(t, ziel23)).toBeUndefined();
    // ohne «Umsetzen ab» bei Anzucht ebenfalls kein Hinweis
    const ohneUmsetzen = duplizierTeile();
    artSetzen(ohneUmsetzen, 'lactuca_sativa', { umsetzen_ab_d: null });
    expect(satzgroesse(ohneUmsetzen, ziel23)).toBeUndefined();
    // und im Vorschlag des Duplikats fehlt die Satzgrösse
    const t2 = mitOriginal('schnitt');
    kulturformSetzen(t2, 'lactuca_sativa', 'schnitt', { kulturdauer_typisch_d: null });
    expect(duplizieren(t2)?.satzgroesse).toBeUndefined();
  });
});

describe('UC5 Duplizieren: Auswahl und Rückfälle', () => {
  it('UC5 duplizierbare Sätze: jüngster je Sorte und Kulturform, höchstens drei, nur die Anlage, nur gültige Sorten, stornierte nicht', () => {
    const t = vereinen(mitOriginal('schnitt'), weitereAnlage('T', 'echt'));
    // Lollo Schnitt zweimal am 21.1. (der spätere gilt_ab gewinnt), Lollo Kopf 14.1., Tomate 10.1.,
    // Rucola Direktsaat 28.1.; Eichblatt 1.2. storniert; Petersilie 10.2. mit ungültiger Sorte;
    // Rucola 17.2. in der Anlage T
    satzAnlegen(t, {
      nr: 71,
      sorteId: SORTE.lollo,
      kulturform: 'schnitt',
      saatdatum: '2027-01-21',
      giltAb: '2027-01-21T07:00:00.000Z',
    });
    satzAnlegen(t, {
      nr: 72,
      sorteId: SORTE.lollo,
      kulturform: 'schnitt',
      saatdatum: '2027-01-21',
      giltAb: '2027-01-21T14:00:00.000Z',
    });
    satzAnlegen(t, { nr: 73, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-14' });
    satzAnlegen(t, {
      nr: 74,
      sorteId: SORTE.ochsenherz,
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2027-01-10',
    });
    satzAnlegen(t, {
      nr: 75,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-01-28',
      direktsaat: '3.1',
    });
    satzAnlegen(t, {
      nr: 76,
      sorteId: SORTE.eichblatt,
      kulturform: 'kopf',
      saatdatum: '2027-02-01',
      storniert: '2027-02-01T12:00:00.000Z',
    });
    satzAnlegen(t, {
      nr: 77,
      sorteId: SORTE.mooskrause,
      kulturform: 'schnitt',
      saatdatum: '2027-02-10',
      box: 'A3',
    });
    for (const s of t['sorte'] ?? [])
      if (s['sorte_id'] === SORTE.mooskrause) s['gueltig_bis'] = '2027-02-01T00:00:00.000Z';
    satzAnlegen(t, {
      nr: 78,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-02-17',
      direktsaatPlatzId: uid('3b', 'T'.charCodeAt(0) * 10 + 1),
    });

    expect(duplizierbareSaetze(t, ANLAGE_R).map((s) => s.satzId)).toEqual([
      satzId(75),
      satzId(72),
      satzId(73),
    ]);
    expect(duplizierbareSaetze(t, ANLAGE_R, 10).map((s) => s.satzId)).toEqual([
      satzId(75),
      satzId(72),
      satzId(73),
      satzId(74),
    ]);

    // Text mit Zielgefäss und Topfzahl
    const nurOriginal = mitOriginal('schnitt');
    const [wahl, ...weitere] = duplizierbareSaetze(nurOriginal, ANLAGE_R);
    expect(weitere).toEqual([]);
    expect(wahl).toMatchObject({
      satzId: ORIGINAL,
      sorteId: SORTE.lollo,
      name: 'Lollo Rossa',
      kulturform: 'schnitt',
      saatdatum: '2027-01-07',
      zielKennung: '2.3',
      zieltoepfe: 2,
      text: 'Lollo Rossa · Schnitt · gesät 7.1. · 2.3, 2 Töpfe',
    });
    expect(duplizierbareSaetze(duplizierTeile(), ANLAGE_R)).toEqual([]);
  });

  it('UC5 Duplizieren mit nicht mehr erlaubter Kulturform: Vorgabe mit Hinweis', () => {
    const t = mitOriginal('schnitt');
    for (const s of t['satz'] ?? []) s['kulturform'] = 'keimling';
    const v = duplizieren(t);
    expect(v?.eingabe.saetze[0]?.kulturform).toBe('kopf');
    expect(v?.hinweise).toContain('Kulturform Keimling nicht mehr erlaubt, Vorgabe Kopf');
    expect(v?.eingabe.saetze[0]?.kopiertVon).toBe(ORIGINAL);
  });

  it('UC5 Duplizieren mit fehlender Box: Box nach Keimart mit Hinweis', () => {
    const t = mitOriginal('schnitt');
    for (const s of t['satz'] ?? []) s['anzuchtort_platz_id'] = platzId('A2');
    for (const a of t['anzuchtort'] ?? [])
      if (a['platz_id'] === platzId('A2')) a['storniert_am'] = '2027-02-01T10:00:00.000Z';
    const v = duplizieren(t);
    // Lollo Rossa ist Lichtkeimer → A1
    expect(v?.eingabe.saetze[0]?.boxPlatzId).toBe(platzId('A1'));
    expect(v?.hinweise).toContain('Anzuchtbox A2 nicht mehr vorhanden, Box A1 nach Keimart');
    // vorhandene Box bleibt ohne Hinweis
    const mitA2 = mitOriginal('schnitt');
    for (const s of mitA2['satz'] ?? []) s['anzuchtort_platz_id'] = platzId('A2');
    const w = duplizieren(mitA2);
    expect(w?.eingabe.saetze[0]?.boxPlatzId).toBe(platzId('A2'));
    expect((w?.hinweise ?? []).filter((h) => h.startsWith('Anzuchtbox'))).toEqual([]);
  });

  it('TZ Saatdatum des Duplikats ist der Kalendertag Zürich (jetzt 2027-02-17T23:30:00Z ergibt 18.2.)', () => {
    const t = mitOriginal('schnitt');
    const v = duplizieren(t, ORIGINAL, new Date('2027-02-17T23:30:00Z'));
    expect(v?.eingabe.saatdatum).toBe('2027-02-18');
    expect(v?.umsetzenAm).toBe(U);
    // 22:30 UTC ist 23:30 in Zürich, noch der 17.2.: U 3.3., Schnitt E 4.3. → nicht frei
    const frueher = duplizieren(t, ORIGINAL, new Date('2027-02-17T22:30:00Z'));
    expect(frueher?.eingabe.saatdatum).toBe('2027-02-17');
    expect(frueher?.umsetzenAm).toBe('2027-03-03');
    expect(frueher?.eingabe.saetze[0]?.zieltopfIds).toEqual([]);
  });

  it('TO2 gleiche Eingabe und IDs ergeben gleiche Schritte mit kopiert_von', () => {
    const t = mitOriginal('schnitt');
    const eins = duplizieren(t);
    const zwei = duplizieren(t);
    expect(zwei).toEqual(eins);
    const e = eins?.eingabe as SaatEingabe;
    const v1 = saatVorgang(t, e, neueIds(), JETZT, Z);
    const v2 = saatVorgang(t, e, neueIds(), JETZT, Z);
    expect(v1.length).toBeGreaterThan(0);
    expect(v2).toEqual(v1);
    expect(neue(v1, 'satz')[0]?.['kopiert_von']).toBe(ORIGINAL);
    const ids = neue(v1).map((f) => f.client_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
