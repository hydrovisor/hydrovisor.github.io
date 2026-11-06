// Phasenfragen, Karte «Phasen nachführen», Vorgänge und Verlauf (Plan 35 Testliste; R1.1, R1.2, R1.5, R1.6, UC6-AK7,
// TZ8, U4, TO2, A3 bis A18). Injizierte Uhr, Zeitzone Europe/Zurich; Fixture tests/fixtures/phasen.ts, Sichten aus
// tests/fixtures/sichten.ts (phaseNachrechnen, phasenVorgangAnwenden).
//
// Verträge (Plan 35 «Domänenfunktionen»; Formen vom Testentwickler festgelegt, wo der Plan offen ist):
//   src/domain/phasen/profil.ts
//     PROFILENDE: Record<Kulturform, Phase>; phasenfolge(teile, sorteId, kulturform): PhasenSchritt[] mit
//     { phase, dauer: { min?, typ?, max? }, wechselmerkmal? } (Merkmal der Phase, mit dem sie endet)
//   src/domain/phasen/fragen.ts
//     PHASENLOGIK_AB: string (ISO-Tag)
//     phasenKarten(teile, jetzt, zeitzone, phasenlogikAb): { nachfuehren?: NachfuehrKarte; fragen: Fragekarte[] }
//       NachfuehrKarte = { titel: 'Phasen nachführen (n Sätze)'; zeilen: NachfuehrZeile[] }
//       NachfuehrZeile = { satzId; sorte; ort; phaseHeute: Phase;
//                          wechsel: { phase; am; erwartetAm; grenze: { von; bis } }[] }
//         phase = neue Phase des Wechsels, am = vorbelegter Wechseltag (= erwartetAm), grenze für den Stepper:
//         von = vorbelegter Tag des vorigen Wechsels bzw. Beginn der laufenden Phase (Saat), bis = heute
//       Fragekarte = { titel: '<Art> · <Kennung des Orts> · gesät <T.M.>'; art; ort; saatdatum; faelligAm;
//                      frage?: string; zeilen: Fragezeile[] }
//         faelligAm = frühester Fragetag der Zeilen; frage = gemeinsames Wechselmerkmal aller Zeilen (A13), sonst fehlt es
//       Fragezeile = { satzId; sorte; kulturform; von: Phase; nach: Phase; uebergang: 'Anzucht → Wachstum'; text;
//                      pruefen: boolean; frage: string; faelligAm }
//         frage = Wechselmerkmal der laufenden Phase, ohne Merkmal «Phase gewechselt?»
//     antwortVorgang(teile, antworten: { satzId; antwort; ausloesendePflanzungId? }[], ids, jetzt, zeitzone,
//       phasenlogikAb): Vorgang (leer bei Verstoss: unbekannter Satz, letzte Phase des Profils)
//     nachfuehrVorgang(teile, zeilen: { satzId; wechsel: { phase; am }[] }[], ids, jetzt, zeitzone, phasenlogikAb)
//       : Vorgang (leer bei Verstoss: Phase nicht die nächste der Folge, Tag vor der Saat bzw. vor dem vorigen
//       Wechsel, Tag nach heute)
//     korrekturVorgang(teile, satzId, neuerTag, ids, jetzt, zeitzone): Vorgang (Storno korrektur, dann neue Zeile)
//     phasenRueckgaengig(vorgang, teile): Vorgang (Stornos rueckgaengig in umgekehrter Reihenfolge; nach einer Korrektur
//       zusätzlich eine neue Zeile mit den Daten und dem gilt_ab der alten)
//     phasenVerlauf(teile, satzId, zeitzone): { tag; text; korrektur; nachgefuehrt }[] neueste zuerst, Texte
//       «21.1. Wachstum: Ja», «19.1. Wachstum: Noch nicht», «11.1. Anzucht: Ja (nachgeführt)»,
//       «Korrektur am 22.1.: Wachstum ab 20.1.» (tag der Korrektur = Kalendertag von client_zeit)
//     pflanzungVonSatz(teile, satzId): erste aktive Pflanzung nach id
// Ereignisse liest die Domäne aus dem Bündelteil ereignis_satz und filtert typ und Storno selbst (wie keimung.ts).
import { describe, expect, it } from 'vitest';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  antwortVorgang,
  korrekturVorgang,
  nachfuehrVorgang,
  PHASENLOGIK_AB,
  phasenKarten,
  phasenRueckgaengig,
  phasenStand,
  phasenVerlauf,
  pflanzungVonSatz,
} from '../../src/domain/phasen/fragen.ts';
import { phasenfolge, PROFILENDE } from '../../src/domain/phasen/profil.ts';
import { kalendertag, ZEITZONE } from '../../src/domain/zeit.ts';
import {
  antwortDazu,
  anwendbarSetzen,
  BUENDEL_JETZT,
  buendelTeile,
  MERKMAL,
  phasenNachrechnen,
  phasenSatz,
  phasenTeile,
  pflanzungVon,
  RUECK_JETZT,
  rueckdatiertTeile,
  satzId,
  SORTE,
  WELLE1,
  WELLE1_JETZT,
  welle1Teile,
} from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { phasenVorgangAnwenden } from '../fixtures/sichten.ts';

const AB_FRUEH = '2026-12-01';
const um = (tag: string) => new Date(`${tag}T08:00:00Z`);
const zaehler = () => {
  let n = 0;
  return () => `3a000000-0000-4000-8000-${String((n += 1)).padStart(12, '0')}`;
};
type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu');
const daten = (s: Neu | undefined) => (s?.felder['daten'] ?? {}) as Record<string, unknown>;
const fuerSatz = (v: Vorgang, nr: number) => neue(v).filter((s) => s.felder['satz_id'] === satzId(nr));
const alleSaetze = (k: ReturnType<typeof phasenKarten>) => [
  ...(k.nachfuehren?.zeilen.map((z) => z.satzId) ?? []),
  ...k.fragen.flatMap((f) => f.zeilen.map((z) => z.satzId)),
];
const phaseVon = (t: Teile, pflanzung: string) =>
  (t['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === pflanzung)?.['phase'];

/** gemeinsame Prüfung jedes geschriebenen phase_antwort */
function amSatz(s: Neu | undefined): void {
  expect(s?.tabelle).toBe('ereignis');
  expect(s?.felder['typ']).toBe('phase_antwort');
  expect(s?.felder['satz_id']).toBeTruthy();
  expect(s?.felder['pflanzung_id'] ?? null).toBeNull();
  expect(s?.felder['id']).toBe(s?.felder['client_id']);
}

/** Vorgang aus der Karte «Phasen nachführen» mit den vorbelegten Daten */
const uebernehmen = (k: ReturnType<typeof phasenKarten>) =>
  (k.nachfuehren?.zeilen ?? []).map((z) => ({
    satzId: z.satzId,
    wechsel: z.wechsel.map((w) => ({ phase: w.phase, am: w.am })),
  }));

describe('R1.6 Phasen nachführen', () => {
  it('UC6-AK7 Welle 1 mit 13 Sätzen (Saat 7.1.), Phasenlogik ab 26.1.: genau eine Karte «Phasen nachführen» mit 13 Sätzen, keine Einzelfrage vor dem 26.1.', () => {
    const t = welle1Teile();
    const k = phasenKarten(t, WELLE1_JETZT, ZEITZONE, '2027-01-26');
    expect(k.nachfuehren?.titel).toBe('Phasen nachführen (13 Sätze)');
    expect(k.nachfuehren?.zeilen).toHaveLength(13);
    expect(new Set(k.nachfuehren?.zeilen.map((z) => z.satzId)).size).toBe(13);
    // jeder Satz der Welle hat einen typischen Keimtag vor dem 26.1. und damit keine Einzelfrage
    expect(k.fragen).toEqual([]);
    for (const z of k.nachfuehren?.zeilen ?? [])
      for (const w of z.wechsel) expect(w.am < '2027-01-26').toBe(true);
    // am Folgetag mit derselben Lage weiterhin genau eine Karte, keine Frage mit Datum vor dem 26.1.
    const morgen = new Date('2027-01-27T08:00:00Z');
    const k2 = phasenKarten(welle1Teile(morgen), morgen, ZEITZONE, '2027-01-26');
    expect(k2.nachfuehren?.zeilen).toHaveLength(13);
    for (const f of k2.fragen) expect(f.faelligAm >= '2027-01-26', f.titel).toBe(true);
  });

  it('TZ8 Saat rückdatiert 1.1., erfasst 12.1.: Karte «Phasen nachführen», keine Frage vor 12.1.', () => {
    const t = rueckdatiertTeile();
    const k = phasenKarten(t, RUECK_JETZT, ZEITZONE, AB_FRUEH);
    expect(k.nachfuehren?.titel).toBe('Phasen nachführen (2 Sätze)');
    expect(k.nachfuehren?.zeilen.map((z) => z.satzId).sort()).toEqual([satzId(70), satzId(71)]);
    expect(k.fragen.flatMap((f) => f.zeilen.map((z) => z.satzId))).toEqual([]);
    // Lollo Rossa: Keimung 2/4/7 → Wechsel am 5.1., vor dem Erfassungstag
    expect(k.nachfuehren?.zeilen.find((z) => z.satzId === satzId(70))?.wechsel).toMatchObject([
      { phase: 'anzucht', am: '2027-01-05', erwartetAm: '2027-01-05' },
    ]);
    const morgen = new Date('2027-01-13T08:00:00Z');
    const k2 = phasenKarten(rueckdatiertTeile(morgen), morgen, ZEITZONE, AB_FRUEH);
    expect(k2.nachfuehren?.zeilen).toHaveLength(2);
    for (const f of k2.fragen) expect(f.faelligAm >= '2027-01-12').toBe(true);
  });

  it('R1.6 Zeile zeigt Phase heute aus Saat plus typischen Dauern und vorbelegte Wechseldaten', () => {
    const k = phasenKarten(welle1Teile(), WELLE1_JETZT, ZEITZONE, '2027-01-26');
    const zeile = (nr: number) => k.nachfuehren?.zeilen.find((z) => z.satzId === satzId(nr));
    // Lollo Rossa: 7.1. + 4 = 11.1. Anzucht, + 12 = 23.1. Wachstum (Kopf endet in Wachstum)
    expect(zeile(WELLE1.lollo)).toMatchObject({
      sorte: 'Lollo Rossa',
      phaseHeute: 'wachstum',
      wechsel: [
        {
          phase: 'anzucht',
          am: '2027-01-11',
          erwartetAm: '2027-01-11',
          grenze: { von: '2027-01-07', bis: '2027-01-26' },
        },
        {
          phase: 'wachstum',
          am: '2027-01-23',
          erwartetAm: '2027-01-23',
          grenze: { von: '2027-01-11', bis: '2027-01-26' },
        },
      ],
    });
    // Ochsenherz: 7.1. + 7 = 14.1. Anzucht; 14.1. + 25 = 8.2. liegt nach heute
    expect(zeile(WELLE1.tomaten[0])).toMatchObject({
      sorte: 'Ochsenherz',
      phaseHeute: 'anzucht',
      wechsel: [{ phase: 'anzucht', am: '2027-01-14' }],
    });
    expect(zeile(WELLE1.tomaten[0])?.wechsel).toHaveLength(1);
    // Petersilie (Fixture-Keimung 10/14/21): 21.1.
    expect(zeile(WELLE1.petersilie)).toMatchObject({
      phaseHeute: 'anzucht',
      wechsel: [{ am: '2027-01-21' }],
    });
    // Direktsaat Nüsslisalat: 7.1. + 10 = 17.1.
    expect(zeile(WELLE1.nuesslisalat)).toMatchObject({
      phaseHeute: 'anzucht',
      wechsel: [{ am: '2027-01-17' }],
    });
  });

  it('R1.6 [Alle übernehmen] schreibt je Satz und Wechsel phase_antwort ja mit nachgefuehrt, erwartet_am und gilt_ab 12:00 Zürich', () => {
    const t = welle1Teile();
    const k = phasenKarten(t, WELLE1_JETZT, ZEITZONE, '2027-01-26');
    const v = nachfuehrVorgang(t, uebernehmen(k), zaehler(), WELLE1_JETZT, ZEITZONE, '2027-01-26');
    // 13 Sätze, Lollo Rossa und Eissalat mit zwei Wechseln
    expect(neue(v)).toHaveLength(15);
    expect(v).toHaveLength(15);
    expect(vorgangPruefen(v)).toEqual([]);
    for (const s of neue(v)) {
      amSatz(s);
      expect(daten(s)).toMatchObject({ antwort: 'ja', nachgefuehrt: true });
    }
    const lollo = fuerSatz(v, WELLE1.lollo);
    expect(lollo.map((s) => [daten(s)['phase'], daten(s)['erwartet_am'], s.felder['gilt_ab']])).toEqual([
      ['anzucht', '2027-01-11', '2027-01-11T11:00:00.000Z'],
      ['wachstum', '2027-01-23', '2027-01-23T11:00:00.000Z'],
    ]);
    // danach: Phase nachgerechnet, keine Karte und keine Frage mehr
    const danach = phasenVorgangAnwenden(t, v, WELLE1_JETZT);
    expect(phaseVon(danach, pflanzungVon(WELLE1.lollo))).toBe('wachstum');
    expect(phaseVon(danach, pflanzungVon(WELLE1.tomaten[0]))).toBe('anzucht');
    const k2 = phasenKarten(danach, WELLE1_JETZT, ZEITZONE, '2027-01-26');
    expect(k2.nachfuehren).toBeUndefined();
    expect(k2.fragen).toEqual([]);
  });

  it('R1.6 geändertes Datum und «Ohne letzten Wechsel» gehen in den Vorgang; Stepper-Grenzen werden eingehalten', () => {
    const jetzt = new Date('2027-01-20T08:00:00Z');
    const t = rueckdatiertTeile(jetzt);
    const k = phasenKarten(t, jetzt, ZEITZONE, AB_FRUEH);
    // Lollo Rossa am 20.1.: Anzucht 5.1., Wachstum 17.1.
    expect(k.nachfuehren?.zeilen.find((z) => z.satzId === satzId(70))?.wechsel.map((w) => w.am)).toEqual([
      '2027-01-05',
      '2027-01-17',
    ]);
    const nach = (wechsel70: { phase: 'anzucht' | 'wachstum' | 'keimung' | 'bluete'; am: string }[]) =>
      nachfuehrVorgang(
        t,
        [
          { satzId: satzId(70), wechsel: wechsel70 },
          { satzId: satzId(71), wechsel: [{ phase: 'anzucht', am: '2027-01-08' }] },
        ],
        zaehler(),
        jetzt,
        ZEITZONE,
        AB_FRUEH,
      );
    // ohne den letzten Wechsel, Anzucht einen Tag später
    const v = nach([{ phase: 'anzucht', am: '2027-01-06' }]);
    expect(v).toHaveLength(2);
    const [lollo] = fuerSatz(v, 70);
    expect(daten(lollo)).toMatchObject({ phase: 'anzucht', erwartet_am: '2027-01-05', nachgefuehrt: true });
    expect(lollo?.felder['gilt_ab']).toBe('2027-01-06T11:00:00.000Z');
    // Grenzen: nicht nach heute, nicht vor der Saat, nicht vor dem vorigen Wechsel
    expect(nach([{ phase: 'anzucht', am: '2027-01-21' }])).toEqual([]);
    expect(nach([{ phase: 'anzucht', am: '2026-12-31' }])).toEqual([]);
    expect(
      nach([
        { phase: 'anzucht', am: '2027-01-10' },
        { phase: 'wachstum', am: '2027-01-09' },
      ]),
    ).toEqual([]);
  });

  it('R1.6 nach dem Nachführen keine Frage vor dem Stichtag, nächste Frage ab dem letzten Wechsel', () => {
    const t = rueckdatiertTeile();
    const k = phasenKarten(t, RUECK_JETZT, ZEITZONE, AB_FRUEH);
    const danach = phasenVorgangAnwenden(
      t,
      nachfuehrVorgang(t, uebernehmen(k), zaehler(), RUECK_JETZT, ZEITZONE, AB_FRUEH),
      RUECK_JETZT,
    );
    const heute = phasenKarten(danach, RUECK_JETZT, ZEITZONE, AB_FRUEH);
    expect(heute.nachfuehren).toBeUndefined();
    expect(heute.fragen).toEqual([]);
    // Lollo Rossa: Anzucht ab 5.1. (nachgeführt), typisch + 12 = 17.1.
    expect(phasenStand(danach, satzId(70), RUECK_JETZT, ZEITZONE)).toMatchObject({
      phase: 'anzucht',
      beginn: '2027-01-05',
      frageAm: '2027-01-17',
    });
    const am17 = new Date('2027-01-17T08:00:00Z');
    const fragen = phasenKarten(danach, am17, ZEITZONE, AB_FRUEH).fragen.flatMap((f) => f.zeilen);
    expect(fragen.map((z) => [z.satzId, z.faelligAm])).toEqual([[satzId(70), '2027-01-17']]);

    // liegt der nächste typische Tag zwischen Stichtag und heute, ist es eine normale Frage
    const jetzt = new Date('2027-01-20T08:00:00Z');
    const t20 = rueckdatiertTeile(jetzt);
    const nur = nachfuehrVorgang(
      t20,
      [
        { satzId: satzId(70), wechsel: [{ phase: 'anzucht', am: '2027-01-06' }] },
        { satzId: satzId(71), wechsel: [{ phase: 'anzucht', am: '2027-01-08' }] },
      ],
      zaehler(),
      jetzt,
      ZEITZONE,
      AB_FRUEH,
    );
    const k20 = phasenKarten(phasenVorgangAnwenden(t20, nur, jetzt), jetzt, ZEITZONE, AB_FRUEH);
    expect(k20.nachfuehren).toBeUndefined();
    expect(k20.fragen.flatMap((f) => f.zeilen).map((z) => [z.satzId, z.faelligAm])).toEqual([
      [satzId(70), '2027-01-18'],
    ]);
  });

  it('R1.6 Stichtag: PHASENLOGIK_AB ist ein ISO-Tag vor dem Testbetrieb', () => {
    expect(PHASENLOGIK_AB).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PHASENLOGIK_AB <= '2027-01-07').toBe(true);
  });
});

describe('R1.5 Phasenfragen', () => {
  it('R1.5 Bündelung: zwei Salatsätze in 4.4 vom 7.1. eine Karte, Eichblatt vom 21.1. eine zweite, Tomate in 4.2 eine dritte', () => {
    const k = phasenKarten(buendelTeile(), BUENDEL_JETZT, ZEITZONE, AB_FRUEH);
    expect(k.nachfuehren).toBeUndefined();
    expect(k.fragen.map((f) => [f.titel, f.zeilen.length, f.faelligAm])).toEqual([
      ['Salat · 4.4 · gesät 7.1.', 2, '2027-01-23'],
      ['Salat · 4.4 · gesät 21.1.', 1, '2027-02-06'],
      ['Tomate · 4.2 · gesät 7.1.', 1, '2027-02-08'],
    ]);
    const [salat] = k.fragen;
    expect(salat?.zeilen.map((z) => z.satzId).sort()).toEqual([satzId(61), satzId(62)]);
    expect(salat?.zeilen.map((z) => z.sorte).sort()).toEqual(['Eichblatt', 'Lollo Rossa']);
    // gleiches Merkmal: einmal im Kartenkopf
    expect(salat?.frage).toMatch(new RegExp(`^${MERKMAL.salatAnzucht}\\??$`));
    for (const z of salat?.zeilen ?? [])
      expect(z).toMatchObject({
        von: 'anzucht',
        nach: 'wachstum',
        uebergang: 'Anzucht → Wachstum',
        faelligAm: '2027-01-23',
        // 10.2. ist Tag 30 der Anzucht, über der Höchstdauer 14
        text: 'Tag 30 von 10–14',
        pruefen: true,
      });
    expect(k.fragen[2]?.zeilen[0]).toMatchObject({ satzId: satzId(64), sorte: 'Ochsenherz', pruefen: false });
  });

  it('R1.5 ohne Wechselmerkmal lautet die Frage «Phase gewechselt?»', () => {
    const t = phasenTeile(BUENDEL_JETZT);
    phasenSatz(t, {
      nr: 68,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-01-07',
      platz: '4.5',
    });
    antwortDazu(t, { nr: 68, phase: 'anzucht', tag: '2027-01-10' });
    const [karte] = phasenKarten(phasenNachrechnen(t), BUENDEL_JETZT, ZEITZONE, AB_FRUEH).fragen;
    expect(karte?.zeilen[0]?.frage).toBe('Phase gewechselt?');
  });

  it('R1.5 [Alle Ja] mit einer Ausnahme «Noch nicht» schreibt je Satz ein Ereignis am Satz, ohne pflanzung_id, mit war_faellig_am und aufgabe_schluessel', () => {
    const t = buendelTeile();
    const v = antwortVorgang(
      t,
      [
        { satzId: satzId(61), antwort: 'ja' },
        { satzId: satzId(62), antwort: 'noch_nicht' },
      ],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    expect(v).toHaveLength(2);
    expect(vorgangPruefen(v)).toEqual([]);
    for (const nr of [61, 62]) {
      const [s] = fuerSatz(v, nr);
      amSatz(s);
      expect(s?.felder['gilt_ab']).toBe(BUENDEL_JETZT.toISOString());
      expect(s?.felder['war_faellig_am']).toBe('2027-01-23');
      expect(s?.felder['aufgabe_schluessel']).toBe(`phase_bestaetigen|${satzId(nr)}|2027-01-23`);
      expect(daten(s)).toMatchObject({
        phase: 'wachstum',
        antwort: nr === 61 ? 'ja' : 'noch_nicht',
        erwartet_am: '2027-01-23',
        nachgefuehrt: false,
      });
    }
    const danach = phasenVorgangAnwenden(t, v, BUENDEL_JETZT);
    expect(phaseVon(danach, pflanzungVon(61))).toBe('wachstum');
    expect(phaseVon(danach, pflanzungVon(62))).toBe('anzucht');
    expect(phasenStand(danach, satzId(62), BUENDEL_JETZT, ZEITZONE)?.frageAm).toBe('2027-02-12');
  });

  it('R1.5 kein Rückfall: Ja für eine frühere oder übersprungene Phase ergibt einen leeren Vorgang', () => {
    const t = buendelTeile();
    const nach = (wechsel: { phase: 'keimung' | 'anzucht' | 'wachstum' | 'bluete'; am: string }[]) =>
      nachfuehrVorgang(t, [{ satzId: satzId(64), wechsel }], zaehler(), BUENDEL_JETZT, ZEITZONE, AB_FRUEH);
    // Ochsenherz in Anzucht seit 14.1.: zurück nach Keimung oder Anzucht, oder Wachstum überspringen
    expect(nach([{ phase: 'keimung', am: '2027-02-01' }])).toEqual([]);
    expect(nach([{ phase: 'anzucht', am: '2027-02-01' }])).toEqual([]);
    expect(nach([{ phase: 'bluete', am: '2027-02-09' }])).toEqual([]);
    // Lollo Rossa nach dem Ja in Wachstum (Profilende Kopf): kein weiteres Ja
    const ja = antwortVorgang(
      t,
      [{ satzId: satzId(61), antwort: 'ja' }],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    const danach = phasenVorgangAnwenden(t, ja, BUENDEL_JETZT);
    expect(
      antwortVorgang(
        danach,
        [{ satzId: satzId(61), antwort: 'ja' }],
        zaehler(),
        BUENDEL_JETZT,
        ZEITZONE,
        AB_FRUEH,
      ),
    ).toEqual([]);
    // unbekannter Satz
    expect(
      antwortVorgang(
        t,
        [{ satzId: satzId(99), antwort: 'ja' }],
        zaehler(),
        BUENDEL_JETZT,
        ZEITZONE,
        AB_FRUEH,
      ),
    ).toEqual([]);
  });

  it('R1.2 Profilende: keimling endet in anzucht, Kopf in wachstum, keine Frage in der letzten Phase', () => {
    expect(PROFILENDE).toEqual({
      keimling: 'anzucht',
      babyleaf: 'wachstum',
      kopf: 'wachstum',
      schnitt: 'wachstum',
      dauerkultur_blatt: 'wachstum',
      dauerkultur_frucht: 'fruchtbildung_reife',
    });
    const t = buendelTeile();
    expect(phasenfolge(t, SORTE.lollo, 'keimling').map((p) => p.phase)).toEqual(['keimung', 'anzucht']);
    const kopf = phasenfolge(t, SORTE.lollo, 'kopf');
    expect(kopf.map((p) => p.phase)).toEqual(['keimung', 'anzucht', 'wachstum']);
    expect(kopf[1]).toMatchObject({
      phase: 'anzucht',
      dauer: { min: 10, typ: 12, max: 14 },
      wechselmerkmal: MERKMAL.salatAnzucht,
    });
    expect(phasenfolge(t, SORTE.ochsenherz, 'dauerkultur_frucht').map((p) => p.phase)).toEqual([
      'keimung',
      'anzucht',
      'wachstum',
      'bluete',
      'fruchtbildung_reife',
    ]);

    // Keimling in Anzucht seit 11.1.: am 10.2. weit über der Höchstdauer, aber ohne Frage und ohne «prüfen»
    phasenSatz(t, {
      nr: 66,
      sorteId: SORTE.lollo,
      kulturform: 'keimling',
      saatdatum: '2027-01-07',
      platz: '4.5',
    });
    antwortDazu(t, { nr: 66, phase: 'anzucht', tag: '2027-01-11' });
    const mit = phasenNachrechnen(t);
    const stand = phasenStand(mit, satzId(66), BUENDEL_JETZT, ZEITZONE);
    expect(stand).toMatchObject({ phase: 'anzucht', pruefen: false });
    expect(stand?.naechste).toBeUndefined();
    expect(stand?.frageAm).toBeUndefined();
    expect(alleSaetze(phasenKarten(mit, BUENDEL_JETZT, ZEITZONE, AB_FRUEH))).not.toContain(satzId(66));
    // Kopf in Wachstum: ebenso
    const ja = antwortVorgang(
      mit,
      [{ satzId: satzId(61), antwort: 'ja' }],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    const spaeter = new Date('2027-04-30T08:00:00Z');
    const danach = phasenVorgangAnwenden(mit, ja, BUENDEL_JETZT);
    expect(phasenStand(danach, satzId(61), spaeter, ZEITZONE)).toMatchObject({
      phase: 'wachstum',
      pruefen: false,
    });
    expect(alleSaetze(phasenKarten(danach, spaeter, ZEITZONE, AB_FRUEH))).not.toContain(satzId(61));
  });

  it('R1.1 entfällt: Phase mit anwendbar = entfaellt wird übersprungen', () => {
    const t = phasenTeile(um('2027-01-09'));
    anwendbarSetzen(t, SORTE.rucola, 'anzucht', 'entfaellt');
    anwendbarSetzen(t, SORTE.rucola, 'wachstum', 'ja');
    expect(phasenfolge(t, SORTE.rucola, 'babyleaf').map((p) => p.phase)).toEqual(['keimung', 'wachstum']);
    phasenSatz(t, { nr: 69, sorteId: SORTE.rucola, kulturform: 'babyleaf', saatdatum: '2027-01-05' });
    const mit = phasenNachrechnen(t);
    // Rucola Keimung 2/3/5 ab 5.1.: Frage am 8.1., Wechsel nach Wachstum
    expect(phasenStand(mit, satzId(69), um('2027-01-09'), ZEITZONE)?.naechste?.phase).toBe('wachstum');
    const v = antwortVorgang(
      mit,
      [{ satzId: satzId(69), antwort: 'ja' }],
      zaehler(),
      um('2027-01-09'),
      ZEITZONE,
      AB_FRUEH,
    );
    expect(daten(neue(v)[0])['phase']).toBe('wachstum');
  });

  it('R1.5 Fruchtgemüse: ausloesende_pflanzung_id nur bei Übergang nach bluete oder fruchtbildung_reife', () => {
    const t = buendelTeile();
    // Ochsenherz 64 in Anzucht: Übergang nach Wachstum ohne auslösende Pflanze
    const anzucht = antwortVorgang(
      t,
      [{ satzId: satzId(64), antwort: 'ja', ausloesendePflanzungId: pflanzungVon(64, 2) }],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    expect(anzucht).toHaveLength(1);
    expect(daten(neue(anzucht)[0])['phase']).toBe('wachstum');
    expect(daten(neue(anzucht)[0])).not.toHaveProperty('ausloesende_pflanzung_id');
    // Ochsenherz 67 in Wachstum seit 15.1.: Übergang nach Blüte mit auslösender Pflanze
    phasenSatz(t, {
      nr: 67,
      sorteId: SORTE.ochsenherz,
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2026-11-20',
      platz: '4.3',
    });
    antwortDazu(t, { nr: 67, phase: 'anzucht', tag: '2026-11-27' });
    antwortDazu(t, { nr: 67, phase: 'wachstum', tag: '2027-01-15' });
    const mit = phasenNachrechnen(t);
    const bluete = antwortVorgang(
      mit,
      [{ satzId: satzId(67), antwort: 'ja', ausloesendePflanzungId: pflanzungVon(67, 2) }],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    expect(daten(neue(bluete)[0])).toMatchObject({
      phase: 'bluete',
      ausloesende_pflanzung_id: pflanzungVon(67, 2),
    });
    amSatz(neue(bluete)[0]);
    expect(vorgangPruefen(bluete)).toEqual([]);
  });

  it('R1.5 Phasenstand stimmt mit v_pflanzung_zustand überein (Fixture sichten.ts)', () => {
    const t = buendelTeile();
    // eine stornierte Bestätigung, die die Domäne selbst ausfiltern muss (auch wenn sie im Bündelteil steht)
    const storno = antwortDazu(t, { nr: 62, phase: 'wachstum', tag: '2027-02-01' });
    const zeile = (t['ereignis'] ?? []).find((e) => e['id'] === storno);
    if (zeile) zeile['storniert_am'] = '2027-02-01T12:00:00.000Z';
    antwortDazu(t, { nr: 64, phase: 'wachstum', tag: '2027-02-09' });
    const mit = phasenNachrechnen(t);
    mit['ereignis_satz'] = [...(mit['ereignis_satz'] ?? []), { ...zeile }];
    const welle = welle1Teile();
    for (const [teile, jetzt] of [
      [mit, BUENDEL_JETZT],
      [welle, WELLE1_JETZT],
    ] as const)
      for (const z of teile['v_pflanzung_zustand'] ?? []) {
        if (z['status'] !== 'aktiv') continue;
        const stand = phasenStand(teile, String(z['satz_id']), jetzt, ZEITZONE);
        expect(stand?.phase, String(z['pflanzung_id'])).toBe(z['phase']);
        const satz = (teile['satz'] ?? []).find((s) => s['id'] === z['satz_id']);
        const beginn = z['phase_seit']
          ? kalendertag(new Date(String(z['phase_seit'])), ZEITZONE)
          : String(satz?.['saatdatum']);
        expect(stand?.beginn, String(z['pflanzung_id'])).toBe(beginn);
      }
    expect(phasenStand(mit, satzId(62), BUENDEL_JETZT, ZEITZONE)?.phase).toBe('anzucht');
    expect(phasenStand(mit, satzId(64), BUENDEL_JETZT, ZEITZONE)?.phase).toBe('wachstum');
  });

  it('R1.5 Satz ohne aktive Pflanzung erscheint in keiner Karte', () => {
    const k = phasenKarten(buendelTeile(), BUENDEL_JETZT, ZEITZONE, AB_FRUEH);
    expect(alleSaetze(k)).not.toContain(satzId(65));
    expect(pflanzungVonSatz(buendelTeile(), satzId(65))).toBeUndefined();
    // Welle 1 mit einem ausgefallenen Satz: 12 Sätze in der Karte
    const t = welle1Teile();
    for (const z of t['v_pflanzung_zustand'] ?? [])
      if (z['satz_id'] === satzId(WELLE1.lollo)) z['status'] = 'ausfall';
    const k2 = phasenKarten(t, WELLE1_JETZT, ZEITZONE, '2027-01-26');
    expect(k2.nachfuehren?.titel).toBe('Phasen nachführen (12 Sätze)');
    expect(alleSaetze(k2)).not.toContain(satzId(WELLE1.lollo));
  });

  it('R1.5 Link zur Pflanzenansicht: erste aktive Pflanzung des Satzes', () => {
    expect(pflanzungVonSatz(buendelTeile(), satzId(61))).toBe(pflanzungVon(61, 1));
  });
});

describe('R1.5 Korrektur, Verlauf, Rückgängig', () => {
  const JETZT = new Date('2027-01-22T09:00:00Z');
  /** Satz 67 Lollo Rossa auf 4.4: Anzucht 11.1. (nachgeführt), Wachstum «Noch nicht» 19.1., Wachstum Ja 21.1. */
  function verlaufTeile(): { t: Teile; ja: string } {
    const t = phasenTeile(JETZT);
    phasenSatz(t, {
      nr: 67,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: '2027-01-07',
      platz: '4.4',
    });
    antwortDazu(t, {
      nr: 67,
      phase: 'anzucht',
      tag: '2027-01-11',
      erwartetAm: '2027-01-11',
      nachgefuehrt: true,
    });
    antwortDazu(t, {
      nr: 67,
      phase: 'wachstum',
      antwort: 'noch_nicht',
      tag: '2027-01-19',
      erwartetAm: '2027-01-23',
    });
    const ja = antwortDazu(t, { nr: 67, phase: 'wachstum', tag: '2027-01-21', erwartetAm: '2027-01-23' });
    return { t: phasenNachrechnen(t), ja };
  }

  it('R1.5 Korrektur: Storno korrektur plus neue Zeile mit ersetzt_id; Verlauf zeigt «Korrektur am …»', () => {
    const { t, ja } = verlaufTeile();
    expect(phasenVerlauf(t, satzId(67), ZEITZONE)).toEqual([
      { tag: '2027-01-21', text: '21.1. Wachstum: Ja', korrektur: false, nachgefuehrt: false },
      { tag: '2027-01-19', text: '19.1. Wachstum: Noch nicht', korrektur: false, nachgefuehrt: false },
      { tag: '2027-01-11', text: '11.1. Anzucht: Ja (nachgeführt)', korrektur: false, nachgefuehrt: true },
    ]);
    const v = korrekturVorgang(t, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE);
    expect(v).toHaveLength(2);
    expect(v[0]).toEqual({ art: 'storno', tabelle: 'ereignis', clientId: ja, grund: 'korrektur' });
    const neu = neue(v)[0];
    amSatz(neu);
    expect(neu?.felder['ersetzt_id']).toBe(ja);
    expect(neu?.felder['gilt_ab']).toBe('2027-01-20T11:00:00.000Z');
    expect(daten(neu)).toEqual({
      phase: 'wachstum',
      antwort: 'ja',
      erwartet_am: '2027-01-23',
      nachgefuehrt: false,
    });
    expect(vorgangPruefen(v)).toEqual([]);

    const danach = phasenVorgangAnwenden(t, v, JETZT);
    expect(phasenStand(danach, satzId(67), JETZT, ZEITZONE)).toMatchObject({
      phase: 'wachstum',
      beginn: '2027-01-20',
    });
    const verlauf = phasenVerlauf(danach, satzId(67), ZEITZONE);
    expect(verlauf[0]).toEqual({
      tag: '2027-01-22',
      text: 'Korrektur am 22.1.: Wachstum ab 20.1.',
      korrektur: true,
      nachgefuehrt: false,
    });
    expect(verlauf.map((z) => z.text)).not.toContain('21.1. Wachstum: Ja');
    expect(verlauf).toHaveLength(3);

    // Grenzen: nicht vor dem Beginn der vorigen Phase (11.1.), nicht nach heute
    expect(korrekturVorgang(t, satzId(67), '2027-01-10', zaehler(), JETZT, ZEITZONE)).toEqual([]);
    expect(korrekturVorgang(t, satzId(67), '2027-01-23', zaehler(), JETZT, ZEITZONE)).toEqual([]);
    expect(korrekturVorgang(t, satzId(67), '2027-01-11', zaehler(), JETZT, ZEITZONE)).toHaveLength(2);
  });

  it('U4 Rückgängig storniert alle Zeilen des Vorgangs in umgekehrter Reihenfolge', () => {
    const t = buendelTeile();
    const v = antwortVorgang(
      t,
      [
        { satzId: satzId(61), antwort: 'ja' },
        { satzId: satzId(62), antwort: 'noch_nicht' },
      ],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    const danach = phasenVorgangAnwenden(t, v, BUENDEL_JETZT);
    const ids = neue(v).map((s) => s.felder.client_id);
    expect(phasenRueckgaengig(v, danach)).toEqual(
      [...ids]
        .reverse()
        .map((clientId) => ({ art: 'storno', tabelle: 'ereignis', clientId, grund: 'rueckgaengig' })),
    );
    const zurueck = phasenVorgangAnwenden(danach, phasenRueckgaengig(v, danach), BUENDEL_JETZT);
    expect(phaseVon(zurueck, pflanzungVon(61))).toBe('anzucht');

    // nach einer Korrektur: Storno der neuen Zeile und die alte Zeile neu
    const { t: tv, ja } = verlaufTeile();
    const alt = (tv['ereignis'] ?? []).find((e) => e['id'] === ja);
    const k = korrekturVorgang(tv, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE);
    const nachK = phasenVorgangAnwenden(tv, k, JETZT);
    const r = phasenRueckgaengig(k, nachK);
    const neuId = neue(k)[0]?.felder.client_id;
    expect(r[0]).toEqual({ art: 'storno', tabelle: 'ereignis', clientId: neuId, grund: 'rueckgaengig' });
    const wieder = neue(r);
    expect(wieder).toHaveLength(1);
    amSatz(wieder[0]);
    expect(wieder[0]?.felder.client_id).not.toBe(ja);
    expect(wieder[0]?.felder.client_id).not.toBe(neuId);
    expect(wieder[0]?.felder['gilt_ab']).toBe(alt?.['gilt_ab']);
    expect(daten(wieder[0])).toEqual(alt?.['daten']);
    const zurueckK = phasenVorgangAnwenden(nachK, r, JETZT);
    expect(phasenStand(zurueckK, satzId(67), JETZT, ZEITZONE)?.beginn).toBe('2027-01-21');
  });

  it('TO2 gleicher Vorgang bei Wiederholung (gleiche client_id)', () => {
    const t = buendelTeile();
    const antworten = [
      { satzId: satzId(61), antwort: 'ja' as const },
      { satzId: satzId(62), antwort: 'noch_nicht' as const },
    ];
    const erster = antwortVorgang(t, antworten, zaehler(), BUENDEL_JETZT, ZEITZONE, AB_FRUEH);
    const zweiter = antwortVorgang(t, antworten, zaehler(), BUENDEL_JETZT, ZEITZONE, AB_FRUEH);
    expect(zweiter).toEqual(erster);
    // id und client_id kommen aus ids()
    const ids = zaehler();
    expect(neue(erster).map((s) => s.felder.client_id)).toEqual([ids(), ids()]);
    for (const s of neue(erster)) expect(s.felder['id']).toBe(s.felder.client_id);
  });
});
