// UX5 Keimung prüfen je Anzuchtbox (Issue #227, Plan 227 Testliste; UX5-AK1, UX5-AK2; R5.1, R5.2, R5.3, R6.1,
// R12.2, G1, G2, G5). Injizierte Uhr 2027-01-11T08:00:00Z (Zürich 11.1. 09:00), Zeitzone Europe/Zurich, ids als Zähler.
// Teile aus tests/fixtures/keimung.ts: keimTeile({ zweiterSatz, dritterSatz }) mit drei fälligen Sätzen in R-A1
// (80 Lollo Rossa, 6 Schwämme, Zieltöpfe 2.3.1 bis 2.3.5; 81 Lollo Rossa, 6 Schwämme ohne Zieltopf; 82 Eichblatt,
// 4 Schwämme ohne Zieltopf), Stationen 4.4 und 4.5 frei; dazu «Würfel feucht» in derselben Ortskarte.
//
// Vertrag (Plan 227 «Signaturen und Datenfluss», src/domain/pflanzung/keimbox.ts):
//   KeimBox { schluessel: 'keimbox|<platzId>'; platzId; code; aufgaben; titel: 'Keimung prüfen · n Sätze'; grund;
//             morgenErlaubt }
//   HeuteZeile = { art: 'aufgabe'; aufgabe } | { art: 'keimbox'; box }
//   heuteZeilen(aufgaben): Boxzeile ab 2 keimung_pruefen am selben Anzuchtort, an der Stelle der ersten; sonst gleiche
//     Objekte in gleicher Reihenfolge; Direktsaat (Ort gefaess) nie gebündelt
//   keimBoxSaetze(faellig, platzId): bezug der fälligen keimung_pruefen am Ort in der Reihenfolge von faellig
//   KeimBoxWahl { keimtempEingehalten; abweichung: Record<satzId, Record<pflanzungId, number | 'offen'>> }
//   keimBoxVorgang(teile, saetze, wahl, ids, jetzt, zeitzone): { vorgang; je: { satzId; eingabe; vorgang; vorschlag? }[];
//     uebersprungen; verstoesse: { satzId; grund }[] } — je Satz wie die Maske je Satz, gegen teileNach() des vorherigen
//   folgeAnzeige(folge, faellig): Box-Ziel { name: 'keimung-box'; code } und Box-Titel, wenn die Box des Satzes eine
//     Boxzeile hat; sonst folge unverändert
//   fertigText() aus src/ui/masken/keimungErgebnis.ts (aus Keimung.tsx herausgelöst, wörtlich)
// Ohne Personendaten.
import { describe, expect, it } from 'vitest';
import type { Folgeaufgabe } from '../../src/domain/aufgaben-folge.ts';
import { aufschubVorgang } from '../../src/domain/aufgaben-aufschub.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { einstellungenAus, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  folgeAnzeige,
  heuteZeilen,
  keimBoxSaetze,
  keimBoxVorgang,
  type KeimBoxWahl,
} from '../../src/domain/pflanzung/keimbox.ts';
import {
  HINWEIS_NICHT_ECHT,
  keimAnsicht,
  keimEingabePruefen,
  keimStationsvorschlag,
  keimVorgang,
  type KeimEingabe,
} from '../../src/domain/pflanzung/keimung.ts';
import { saatRueckgaengig } from '../../src/domain/pflanzung/saeen.ts';
import { teileNach } from '../../src/domain/phasen/ende.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { fertigText } from '../../src/ui/masken/keimungErgebnis.ts';
import {
  KEIM_JETZT,
  KEIM_SATZ,
  KEIM_SATZ_2,
  KEIM_SATZ_3,
  keimTeile,
  keimungDazu,
  pflanzungId,
  satzAnlegen,
} from '../fixtures/keimung.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';
import { pflanzSichtenNachrechnen, vorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = KEIM_JETZT;
const A1 = platzId('A1');
const DREI = [KEIM_SATZ, KEIM_SATZ_2, KEIM_SATZ_3];

const dreiSaetze = (e: { datenart?: 'echt' | 'demo' | 'test'; jetzt?: Date } = {}) =>
  keimTeile({ zweiterSatz: true, dritterSatz: true, ...e });

/** Teile, wie die Domäne sie liest (auch der Stand nach teileNach()) */
type Stand = Parameters<typeof keimAnsicht>[0];

const faellig = (t: Teile, jetzt = JETZT) => verteilteAufgaben(t, einstellungenAus(t), jetzt, ZEITZONE);
const ortskarte = (aufgaben: readonly Aufgabe[], ort = A1) => aufgaben.filter((a) => a.ort?.platzId === ort);
const keimAufgaben = (aufgaben: readonly Aufgabe[]) => aufgaben.filter((a) => a.typ === 'keimung_pruefen');

/** ids als Zähler; zwei Zähler mit demselben Präfix liefern dieselbe Folge */
function zaehler(praefix = '3f'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

const alleGekeimt = (keimtemp: boolean | undefined = true): KeimBoxWahl => ({
  keimtempEingehalten: keimtemp,
  abweichung: {},
});

/** Eingabe, die die Maske je Satz (Keimung.tsx) ohne Änderung an den Steppern baut: alle Samen, Station aus dem Vorschlag */
function maskenEingabe(
  t: Stand,
  satzId: string,
  keimtemp: boolean | undefined,
  werte: Record<string, number | 'offen'> = {},
): KeimEingabe {
  const a = keimAnsicht(t, satzId, JETZT, ZEITZONE);
  if (!a) throw new Error(`Satz ${satzId} nicht bekannt`);
  const ohneStation: KeimEingabe = {
    satzId,
    keimtempEingehalten: keimtemp,
    werte: a.schwaemme
      .filter((s) => s.zustand === 'offen')
      .map((s) => ({ pflanzungId: s.pflanzungId, gekeimt: werte[s.pflanzungId] ?? s.samen })),
    station: [],
  };
  const vorschlag = keimStationsvorschlag(t, ohneStation, JETZT, ZEITZONE);
  return {
    ...ohneStation,
    station: (vorschlag?.zuweisung ?? []).map((z) => ({
      pflanzungId: z.pflanzungId,
      platzId: z.platzId,
      lochNr: z.lochNr,
    })),
  };
}

/** die Sätze nacheinander wie in der Maske je Satz gespeichert: je keimVorgang gegen teileNach() des vorherigen */
function verkettet(
  t: Teile,
  saetze: readonly string[],
  keimtemp: boolean | undefined,
  werte: Record<string, Record<string, number | 'offen'>> = {},
): { vorgang: Schritt[]; je: { satzId: string; eingabe: KeimEingabe; vorgang: Vorgang; vorher: Stand }[] } {
  const ids = zaehler();
  let stand: Stand = t;
  const vorgang: Schritt[] = [];
  const je: { satzId: string; eingabe: KeimEingabe; vorgang: Vorgang; vorher: Stand }[] = [];
  for (const satzId of saetze) {
    const eingabe = maskenEingabe(stand, satzId, keimtemp, werte[satzId] ?? {});
    const v = keimVorgang(stand, eingabe, ids, JETZT, ZEITZONE);
    je.push({ satzId, eingabe, vorgang: v, vorher: stand });
    vorgang.push(...v);
    stand = teileNach(stand, v, JETZT, ZEITZONE);
  }
  return { vorgang, je };
}

const neue = (v: Vorgang) => v.filter((s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu');
const ereignisse = (v: Vorgang, typ: string) =>
  neue(v)
    .filter((s) => s.tabelle === 'ereignis' && s.felder['typ'] === typ)
    .map((s) => s.felder);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;
const pflanzungenVon = (satzNr: number, m: number) =>
  Array.from({ length: m }, (_, i) => pflanzungId(satzNr, i + 1));

// ---------------------------------------------------------------------------------------------------------------
// UX5-AK1 Heute fasst «Keimung prüfen» je Anzuchtbox zusammen; die Rechnung bleibt je Satz
// ---------------------------------------------------------------------------------------------------------------

describe('UX5-AK1 heuteZeilen: Boxzeile je Anzuchtbox', () => {
  it('UX5-AK1 heuteZeilen fasst 3 fällige «Keimung prüfen» in R-A1 zu einer Boxzeile «Keimung prüfen · 3 Sätze» an der Stelle der ersten zusammen; «Würfel feucht» derselben Karte bleibt eine eigene Zeile in ihrer Reihenfolge', () => {
    const karte = ortskarte(faellig(dreiSaetze()));
    // Vorbedingung: Würfel feucht, dann drei Keimprüfungen je Satz
    expect(karte.map((a) => a.typ)).toEqual([
      'wuerfel_feucht',
      'keimung_pruefen',
      'keimung_pruefen',
      'keimung_pruefen',
    ]);
    const zeilen = heuteZeilen(karte);
    expect(zeilen.map((z) => z.art)).toEqual(['aufgabe', 'keimbox']);
    const [wuerfel, boxzeile] = zeilen;
    if (wuerfel?.art !== 'aufgabe' || boxzeile?.art !== 'keimbox') throw new Error('Zeilenart');
    expect(wuerfel.aufgabe).toBe(karte[0]);
    expect(boxzeile.box.titel).toBe('Keimung prüfen · 3 Sätze');
    expect(boxzeile.box.schluessel).toBe(`keimbox|${A1}`);
    expect(boxzeile.box.platzId).toBe(A1);
    expect(boxzeile.box.code).toBe('R-A1');
    expect(boxzeile.box.aufgaben.map((a) => a.bezug)).toEqual(DREI);
    expect(boxzeile.box.morgenErlaubt).toBe(true);
  });

  it('UX5-AK1 die Aufgaben der Boxzeile sind dieselben Objekte wie in verteilteAufgaben (Schlüssel, faelligAm, anzeigeAb, datenart, morgen, titel je Satz); die Eingabeliste bleibt unverändert', () => {
    const karte = ortskarte(faellig(dreiSaetze()));
    const vorher = structuredClone(karte);
    const zeilen = heuteZeilen(karte);
    const box = zeilen.find((z) => z.art === 'keimbox');
    if (box?.art !== 'keimbox') throw new Error('keine Boxzeile');
    const keim = keimAufgaben(karte);
    expect(box.box.aufgaben).toHaveLength(3);
    box.box.aufgaben.forEach((a, i) => expect(a).toBe(keim[i]));
    // je Satz unverändert aus der Rechnung
    expect(box.box.aufgaben.map((a) => a.schluessel)).toEqual(
      DREI.map((s) => `keimung_pruefen|${s}|2027-01-11`),
    );
    for (const a of box.box.aufgaben) {
      expect(a.faelligAm).toBe('2027-01-11');
      expect(a.anzeigeAb).toBe('2027-01-11');
      expect(a.datenart).toBe('echt');
      expect(a.morgen).toEqual({ erlaubt: true, verschoben: 0 });
    }
    expect(box.box.aufgaben.map((a) => a.titel)).toEqual([
      'Keimung prüfen · Lollo Rossa',
      'Keimung prüfen · Lollo Rossa',
      'Keimung prüfen · Eichblatt',
    ]);
    // nichts an der Eingabe verändert, keine Kopie in der Liste ersetzt
    expect(karte).toEqual(vorher);
    expect(karte.filter((a) => a.typ === 'keimung_pruefen')).toHaveLength(3);
  });

  it('UX5-AK1 verteilteAufgaben liefert mit und ohne Bündelung je Satz eine keimung_pruefen-Aufgabe (Rechnung unberührt)', () => {
    const t = dreiSaetze();
    const erste = faellig(t);
    heuteZeilen(erste);
    const zweite = faellig(t);
    expect(zweite).toEqual(erste);
    expect(keimAufgaben(zweite).map((a) => a.bezug)).toEqual(DREI);
    expect(new Set(keimAufgaben(zweite).map((a) => a.schluessel)).size).toBe(3);
  });

  it('UX5-AK1 ein einzelner fälliger Satz bleibt eine gewöhnliche Zeile; zwei Boxen ergeben zwei Boxzeilen; Direktsaat im Gefäss wird nicht gebündelt', () => {
    // ein Satz: keine Boxzeile
    const einzeln = ortskarte(faellig(keimTeile()));
    const zeilenEinzeln = heuteZeilen(einzeln);
    expect(zeilenEinzeln.map((z) => z.art)).toEqual(einzeln.map(() => 'aufgabe'));
    zeilenEinzeln.forEach((z, i) => expect(z.art === 'aufgabe' ? z.aufgabe : undefined).toBe(einzeln[i]));

    // zwei Boxen: A1 (80, 81) und A3 (83, 84)
    const t = keimTeile({ zweiterSatz: true });
    satzAnlegen(t, { nr: 83, box: 'A3', schwaemme: 2, samen: 2, zieltoepfe: [] });
    satzAnlegen(t, { nr: 84, box: 'A3', schwaemme: 2, samen: 2, zieltoepfe: [] });
    pflanzSichtenNachrechnen(t);
    const alle = faellig(t);
    const boxen = heuteZeilen(alle).flatMap((z) => (z.art === 'keimbox' ? [z.box] : []));
    expect(boxen.map((b) => [b.code, b.titel, b.aufgaben.map((a) => a.bezug)])).toEqual([
      ['R-A1', 'Keimung prüfen · 2 Sätze', [KEIM_SATZ, KEIM_SATZ_2]],
      ['R-A3', 'Keimung prüfen · 2 Sätze', [uid('27', 83), uid('27', 84)]],
    ]);
    // jede übrige Aufgabe bleibt einzeln, in ihrer Reihenfolge
    const uebrige = heuteZeilen(alle).flatMap((z) => (z.art === 'aufgabe' ? [z.aufgabe] : []));
    expect(uebrige).toEqual(alle.filter((a) => a.typ !== 'keimung_pruefen'));

    // Direktsaat: zwei Sätze im Gefäss 3.1 bleiben je Satz
    const d = keimTeile({ direktsaat: true });
    satzAnlegen(d, { nr: 85, direktsaat: '3.1', schwaemme: 2, samen: 2, zieltoepfe: [] });
    pflanzSichtenNachrechnen(d);
    const direkt = faellig(d);
    expect(keimAufgaben(direkt).map((a) => a.ort?.rolle)).toEqual(['gefaess', 'gefaess']);
    expect(heuteZeilen(direkt).some((z) => z.art === 'keimbox')).toBe(false);
  });

  it('UX5-AK1 ein mit «Morgen» verschobener Satz fehlt in der Boxzeile (n = 2); morgenErlaubt ist falsch, sobald eine Aufgabe nach Keimdauer max kein «Morgen» mehr hat', () => {
    // «Morgen» für Satz 82 (R5.3 je Satz: ein Aufschub mit seinem Schlüssel)
    const t = dreiSaetze();
    const a82 = keimAufgaben(faellig(t)).find((a) => a.bezug === KEIM_SATZ_3);
    if (!a82) throw new Error('Satz 82 nicht fällig');
    const morgen = aufschubVorgang(a82, 'morgen', uid('3a', 1), JETZT, ZEITZONE);
    expect(morgen).toHaveLength(1);
    const nach = vorgangAnwenden(t, morgen, JETZT);
    const box = heuteZeilen(ortskarte(faellig(nach))).find((z) => z.art === 'keimbox');
    if (box?.art !== 'keimbox') throw new Error('keine Boxzeile');
    expect(box.box.titel).toBe('Keimung prüfen · 2 Sätze');
    expect(box.box.aufgaben.map((a) => a.bezug)).toEqual([KEIM_SATZ, KEIM_SATZ_2]);

    // Satz 82 gesät 4.1.: Saat + Keimdauer max 7 = 11.1., «Morgen» nicht mehr erlaubt (R5.2 «bis max»)
    const spaet = dreiSaetze();
    const s82 = (spaet['satz'] ?? []).find((s) => s['id'] === KEIM_SATZ_3);
    if (!s82) throw new Error('Satz 82 fehlt');
    s82['saatdatum'] = '2027-01-04';
    pflanzSichtenNachrechnen(spaet);
    const karte = ortskarte(faellig(spaet));
    expect(keimAufgaben(karte).find((a) => a.bezug === KEIM_SATZ_3)?.morgen.erlaubt).toBe(false);
    const boxSpaet = heuteZeilen(karte).find((z) => z.art === 'keimbox');
    if (boxSpaet?.art !== 'keimbox') throw new Error('keine Boxzeile');
    expect(boxSpaet.box.aufgaben).toHaveLength(3);
    expect(boxSpaet.box.morgenErlaubt).toBe(false);
  });

  it('UX5-AK1 grund nennt die Sorten mit Anzahl und die älteste Fälligkeit', () => {
    const box = heuteZeilen(ortskarte(faellig(dreiSaetze()))).find((z) => z.art === 'keimbox');
    if (box?.art !== 'keimbox') throw new Error('keine Boxzeile');
    const g = box.box.grund;
    expect(g).toContain('Lollo Rossa × 2');
    expect(g).toContain('Eichblatt × 1');
    expect(g.indexOf('Lollo Rossa × 2')).toBeLessThan(g.indexOf('Eichblatt × 1'));
    expect(g).toContain('heute fällig');

    // Satz 82 seit 8.1. fällig (gesät 4.1.): die älteste Fälligkeit steht im Grund, Eichblatt zuerst
    const spaet = dreiSaetze();
    const s82 = (spaet['satz'] ?? []).find((s) => s['id'] === KEIM_SATZ_3);
    if (!s82) throw new Error('Satz 82 fehlt');
    s82['saatdatum'] = '2027-01-04';
    pflanzSichtenNachrechnen(spaet);
    const boxSpaet = heuteZeilen(ortskarte(faellig(spaet))).find((z) => z.art === 'keimbox');
    if (boxSpaet?.art !== 'keimbox') throw new Error('keine Boxzeile');
    const gs = boxSpaet.box.grund;
    expect(gs).toContain('seit 3 Tagen überfällig');
    expect(gs).not.toContain('heute fällig');
    expect(gs.indexOf('Eichblatt × 1')).toBeLessThan(gs.indexOf('Lollo Rossa × 2'));
  });

  it('UX5-AK1 keimBoxSaetze liefert die Sätze der Box in der Reihenfolge von Heute', () => {
    expect(keimBoxSaetze(faellig(dreiSaetze()), A1)).toEqual(DREI);
    // der älteste fällige Satz zuerst (A12)
    const spaet = dreiSaetze();
    const s82 = (spaet['satz'] ?? []).find((s) => s['id'] === KEIM_SATZ_3);
    if (!s82) throw new Error('Satz 82 fehlt');
    s82['saatdatum'] = '2027-01-04';
    pflanzSichtenNachrechnen(spaet);
    expect(keimBoxSaetze(faellig(spaet), A1)).toEqual([KEIM_SATZ_3, KEIM_SATZ, KEIM_SATZ_2]);
    // anderer Ort, keine Keimprüfung
    expect(keimBoxSaetze(faellig(dreiSaetze()), platzId('A3'))).toEqual([]);
    // nur Keimprüfungen, kein «Würfel feucht»
    expect(keimBoxSaetze(faellig(keimTeile()), A1)).toEqual([KEIM_SATZ]);
  });

  it('UX5-AK1 folgeAnzeige: Folgeaufgabe «Keimung prüfen» eines Satzes in einer Box mit 2 fälligen Sätzen führt nach keimung-box mit Box-Titel; mit einem Satz unverändert', () => {
    const folge = (satz: string, titel: string): Folgeaufgabe => ({
      schluessel: `keimung_pruefen|${satz}|2027-01-11`,
      titel,
      ort: 'R-A1',
      ziel: { name: 'keimung', satz },
    });
    const zwei = faellig(keimTeile({ zweiterSatz: true }));
    const r = folgeAnzeige(folge(KEIM_SATZ_2, 'Keimung prüfen · Lollo Rossa'), zwei);
    expect(r.ziel).toEqual({ name: 'keimung-box', code: 'R-A1' });
    expect(r.titel).toBe('Keimung prüfen · 2 Sätze');
    expect(r.ort).toBe('R-A1');

    // nur ein fälliger Satz: unverändert
    const eins = faellig(keimTeile());
    const f = folge(KEIM_SATZ, 'Keimung prüfen · Lollo Rossa');
    expect(folgeAnzeige(f, eins)).toMatchObject({ titel: f.titel, ort: f.ort, ziel: f.ziel });

    // andere Aufgabe: unverändert
    const messen: Folgeaufgabe = {
      schluessel: 'messen|x|2027-01-11',
      titel: 'Messen',
      ort: 'R-3.1',
      ziel: { name: 'messen', code: 'R-3.1' },
    };
    expect(folgeAnzeige(messen, zwei)).toMatchObject({ titel: 'Messen', ort: 'R-3.1', ziel: messen.ziel });
  });

  it('UX5-AK1 TZ Keimung prüfen fällig am Tag nach 23:30 Zürich: Boxzeile erst am Kalendertag in Zürich', () => {
    // 10.1. 22:30 UTC = 10.1. 23:30 Zürich: noch keine Keimprüfung fällig
    const abends = new Date('2027-01-10T22:30:00Z');
    const vorher = heuteZeilen(ortskarte(faellig(dreiSaetze({ jetzt: abends }), abends)));
    expect(vorher.some((z) => z.art === 'keimbox')).toBe(false);
    // 10.1. 23:30 UTC = 11.1. 00:30 Zürich: Boxzeile mit 3 Sätzen
    const nachts = new Date('2027-01-10T23:30:00Z');
    const nachher = heuteZeilen(ortskarte(faellig(dreiSaetze({ jetzt: nachts }), nachts)));
    const box = nachher.find((z) => z.art === 'keimbox');
    expect(box?.art === 'keimbox' ? box.box.titel : undefined).toBe('Keimung prüfen · 3 Sätze');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UX5-AK2 Speichern für mehrere Sätze: je Satz dieselben Zeilen wie die Maske je Satz, ein Vorgang
// ---------------------------------------------------------------------------------------------------------------

describe('UX5-AK2 keimBoxVorgang', () => {
  it('UX5-AK2 ein Satz ohne Abweichung: keimBoxVorgang ist gleich keimVorgang mit der Eingabe der Maske je Satz (alle Samen, keimtemp, Station aus keimStationsvorschlag; gleiche ids-Folge, gleiches jetzt)', () => {
    const t = dreiSaetze();
    const eingabe = maskenEingabe(t, KEIM_SATZ, true);
    expect(eingabe.station).toHaveLength(6);
    const erwartet = keimVorgang(t, eingabe, zaehler(), JETZT, ZEITZONE);
    expect(erwartet.length).toBeGreaterThan(0);

    const r = keimBoxVorgang(t, [KEIM_SATZ], alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(r.verstoesse).toEqual([]);
    expect(r.uebersprungen).toEqual([]);
    expect(r.vorgang).toEqual(erwartet);
    expect(r.je).toHaveLength(1);
    expect(r.je[0]?.satzId).toBe(KEIM_SATZ);
    expect(r.je[0]?.eingabe).toEqual(eingabe);
    expect(r.je[0]?.vorgang).toEqual(erwartet);
    expect(r.je[0]?.vorschlag?.zuweisung.map((z) => z.lochNr)).toEqual([1, 2, 3, 4, 5, 6]);
    // gilt_ab = jetzt
    for (const s of neue(r.vorgang)) expect(s.felder['gilt_ab']).toBe(JETZT.toISOString());
  });

  it('UX5-AK2 drei Sätze: keimBoxVorgang ist gleich der Verkettung von keimVorgang je Satz, jeder gegen teileNach des vorherigen Satzes; ein Vorgang', () => {
    const t = dreiSaetze();
    const erwartet = verkettet(t, DREI, true);
    const r = keimBoxVorgang(t, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(r.verstoesse).toEqual([]);
    expect(r.uebersprungen).toEqual([]);
    expect(r.je.map((j) => j.satzId)).toEqual(DREI);
    r.je.forEach((j, i) => {
      expect(j.eingabe, j.satzId).toEqual(erwartet.je[i]?.eingabe);
      expect(j.vorgang, j.satzId).toEqual(erwartet.je[i]?.vorgang);
    });
    // ein Vorgang = Verkettung in Satzfolge
    expect(r.vorgang).toEqual(erwartet.vorgang);
    expect(r.vorgang).toEqual(r.je.flatMap((j) => [...j.vorgang]));
    // 16 offene Schwämme, alle mit allen Samen, alle auf eine Station
    expect(ereignisse(r.vorgang, 'keimung')).toHaveLength(16);
    expect(ereignisse(r.vorgang, 'verschieben')).toHaveLength(16);
    expect(ereignisse(r.vorgang, 'abschluss')).toEqual([]);
    // innerhalb eines Satzes: keimung vor verschieben (wie keimVorgang)
    for (const j of r.je) {
      const typen = neue(j.vorgang).map((s) => s.felder['typ']);
      expect(typen.lastIndexOf('keimung')).toBeLessThan(typen.indexOf('verschieben'));
    }
  });

  it('UX5-AK2 keine Station doppelt belegt: alle verschieben haben verschiedene (nach_platz_id, nach_loch_nr), keimEingabePruefen je Satz ohne Verstoss', () => {
    const t = dreiSaetze();
    const r = keimBoxVorgang(t, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    const ziele = ereignisse(r.vorgang, 'verschieben').map((f) => {
      const d = daten(f);
      return `${String(d['nach_platz_id'])}|${String(d['nach_loch_nr'])}`;
    });
    expect(ziele).toHaveLength(16);
    expect(new Set(ziele).size).toBe(16);
    // Satz 80 (zuerst, mit Zieltöpfen) auf 4.4 Loch 1 bis 6
    const satz80 = ereignisse(r.je[0]?.vorgang ?? [], 'verschieben').map((f) => daten(f));
    expect(satz80.map((d) => [d['nach_platz_id'], d['nach_loch_nr']])).toEqual(
      [1, 2, 3, 4, 5, 6].map((n) => [platzId('4.4'), n]),
    );
    // Satz 81 nach Satz 80: nicht mehr auf 4.4 Loch 1 bis 6
    const satz81 = ereignisse(r.je[1]?.vorgang ?? [], 'verschieben').map((f) => daten(f));
    expect(satz81).toHaveLength(6);
    for (const d of satz81)
      expect(d['nach_platz_id'] === platzId('4.4') && Number(d['nach_loch_nr']) <= 6).toBe(false);
    // jede Eingabe gegen den Stand nach den vorherigen Sätzen gültig
    let stand: Stand = t;
    for (const j of r.je) {
      expect(keimEingabePruefen(stand, j.eingabe, JETZT, ZEITZONE), j.satzId).toEqual([]);
      stand = teileNach(stand, j.vorgang, JETZT, ZEITZONE);
    }
  });

  it('UX5-AK2 Abweichung Schwamm 4 in Satz 81 auf 0: keimung 0 und abschluss keimt_nicht nur dort, die übrigen Schwämme mit allen Samen', () => {
    const t = dreiSaetze();
    const schwamm4 = pflanzungId(81, 4);
    // Schwamm 4 der Maske ist im Satz ohne Zieltopf die vierte Pflanzung
    expect(keimAnsicht(t, KEIM_SATZ_2, JETZT, ZEITZONE)?.schwaemme.find((s) => s.nr === 4)?.pflanzungId).toBe(
      schwamm4,
    );
    const wahl: KeimBoxWahl = { keimtempEingehalten: true, abweichung: { [KEIM_SATZ_2]: { [schwamm4]: 0 } } };
    const r = keimBoxVorgang(t, DREI, wahl, zaehler(), JETZT, ZEITZONE);
    expect(r.verstoesse).toEqual([]);
    expect(r.vorgang).toEqual(verkettet(t, DREI, true, { [KEIM_SATZ_2]: { [schwamm4]: 0 } }).vorgang);

    const keimung = ereignisse(r.vorgang, 'keimung');
    expect(keimung).toHaveLength(16);
    for (const f of keimung) {
      const d = daten(f);
      expect(d['samen_gesaet']).toBe(2);
      expect(d['samen_gekeimt'], String(f['pflanzung_id'])).toBe(f['pflanzung_id'] === schwamm4 ? 0 : 2);
    }
    const abschluss = ereignisse(r.vorgang, 'abschluss');
    expect(abschluss.map((f) => [f['pflanzung_id'], daten(f)['grund']])).toEqual([[schwamm4, 'keimt_nicht']]);
    // Schwamm 4 geht nicht auf die Station
    expect(ereignisse(r.vorgang, 'verschieben').some((f) => f['pflanzung_id'] === schwamm4)).toBe(false);
    // Sätze 80 und 82 unverändert «Alle gekeimt»
    const satz80 = r.je.find((j) => j.satzId === KEIM_SATZ)?.eingabe.werte;
    const satz82 = r.je.find((j) => j.satzId === KEIM_SATZ_3)?.eingabe.werte;
    expect(satz80).toEqual(pflanzungenVon(80, 6).map((p) => ({ pflanzungId: p, gekeimt: 2 })));
    expect(satz82).toEqual(pflanzungenVon(82, 4).map((p) => ({ pflanzungId: p, gekeimt: 2 })));
  });

  it('UX5-AK2 Keimtemperatur «Nein» gilt für jeden Satz: alle keimung mit keimtemp_eingehalten false', () => {
    const t = dreiSaetze();
    const r = keimBoxVorgang(t, DREI, alleGekeimt(false), zaehler(), JETZT, ZEITZONE);
    expect(r.verstoesse).toEqual([]);
    const keimung = ereignisse(r.vorgang, 'keimung');
    expect(keimung).toHaveLength(16);
    for (const f of keimung) expect(daten(f)['keimtemp_eingehalten']).toBe(false);
    for (const j of r.je) expect(j.eingabe.keimtempEingehalten).toBe(false);
    expect(r.vorgang).toEqual(verkettet(t, DREI, false).vorgang);
  });

  it('UX5-AK2 Satz mit allen Schwämmen «offen» wird übersprungen, ohne Verstoss; ein Verstoss in einem Satz macht den ganzen Vorgang leer', () => {
    const t = dreiSaetze();
    const offen = Object.fromEntries(pflanzungenVon(82, 4).map((p) => [p, 'offen' as const]));
    const r = keimBoxVorgang(
      t,
      DREI,
      { keimtempEingehalten: true, abweichung: { [KEIM_SATZ_3]: offen } },
      zaehler(),
      JETZT,
      ZEITZONE,
    );
    expect(r.verstoesse).toEqual([]);
    expect(r.uebersprungen).toEqual([KEIM_SATZ_3]);
    expect(r.je.map((j) => j.satzId)).toEqual([KEIM_SATZ, KEIM_SATZ_2]);
    expect(ereignisse(r.vorgang, 'keimung')).toHaveLength(12);
    expect(
      neue(r.vorgang).some((s) => pflanzungenVon(82, 4).includes(String(s.felder['pflanzung_id']))),
    ).toBe(false);

    // Satz ohne offenen Schwamm (veralteter Stand): übersprungen (A8)
    const geprueft = dreiSaetze();
    for (const p of pflanzungenVon(82, 4))
      keimungDazu(geprueft, p, { gekeimt: 2, giltAb: '2027-01-11T07:00:00.000Z' });
    pflanzSichtenNachrechnen(geprueft);
    const r2 = keimBoxVorgang(geprueft, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(r2.verstoesse).toEqual([]);
    expect(r2.uebersprungen).toContain(KEIM_SATZ_3);
    expect(ereignisse(r2.vorgang, 'keimung')).toHaveLength(12);

    // Verstoss in Satz 81 (3 Samen von 2): alles oder nichts
    const falsch = keimBoxVorgang(
      t,
      DREI,
      { keimtempEingehalten: true, abweichung: { [KEIM_SATZ_2]: { [pflanzungId(81, 1)]: 3 } } },
      zaehler(),
      JETZT,
      ZEITZONE,
    );
    expect(falsch.vorgang).toEqual([]);
    expect(falsch.verstoesse.map((v) => v.satzId)).toContain(KEIM_SATZ_2);
    expect(falsch.verstoesse.every((v) => v.grund.length > 0)).toBe(true);

    // ohne Keimtemperatur: Verstoss, leerer Vorgang
    const ohneTemp = keimBoxVorgang(t, DREI, alleGekeimt(undefined), zaehler(), JETZT, ZEITZONE);
    expect(ohneTemp.vorgang).toEqual([]);
    expect(ohneTemp.verstoesse.length).toBeGreaterThan(0);
  });

  it('UX5-AK2 vorherige_pruefung_am je Satz wie bei keimVorgang', () => {
    // Satz 81 am 9.1. geprüft, alle Schwämme mit 0 (bleiben offen): Folgeprüfung 11.1.
    const t = dreiSaetze();
    for (const p of pflanzungenVon(81, 6))
      keimungDazu(t, p, { gekeimt: 0, giltAb: '2027-01-09T08:00:00.000Z' });
    pflanzSichtenNachrechnen(t);
    expect(keimBoxSaetze(faellig(t), A1)).toContain(KEIM_SATZ_2);
    const r = keimBoxVorgang(t, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(r.verstoesse).toEqual([]);
    expect(r.vorgang).toEqual(verkettet(t, DREI, true).vorgang);
    for (const j of r.je)
      for (const f of ereignisse(j.vorgang, 'keimung'))
        expect(daten(f)['vorherige_pruefung_am'] ?? null, j.satzId).toBe(
          j.satzId === KEIM_SATZ_2 ? '2027-01-09' : null,
        );
  });

  it('UX5-AK2 vorgangPruefen ohne Verstoss; saatRueckgaengig storniert alle Zeilen in umgekehrter Folge', () => {
    const t = dreiSaetze();
    const r = keimBoxVorgang(t, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(r.vorgang.length).toBe(32);
    expect(vorgangPruefen(r.vorgang)).toEqual([]);
    // alle client_id verschieden (ein Upsert je Zeile, Konzept 11.4)
    const ids = neue(r.vorgang).map((s) => s.felder.client_id);
    expect(new Set(ids).size).toBe(ids.length);
    const zurueck = saatRueckgaengig(r.vorgang);
    expect(zurueck).toHaveLength(r.vorgang.length);
    expect(zurueck.map((s) => (s.art === 'storno' ? [s.tabelle, s.clientId, s.grund] : []))).toEqual(
      [...ids].reverse().map((id) => ['ereignis', id, 'rueckgaengig']),
    );
  });

  it('UX5-AK2 Datenart demo: Vorgang gleich, Keimrate nicht gezählt (fertigText «Keimrate zählt nur in echten Anlagen»)', () => {
    const echt = keimBoxVorgang(dreiSaetze(), DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    const demoTeile = dreiSaetze({ datenart: 'demo' });
    const demo = keimBoxVorgang(demoTeile, DREI, alleGekeimt(true), zaehler(), JETZT, ZEITZONE);
    expect(demo.verstoesse).toEqual([]);
    expect(demo.vorgang).toEqual(echt.vorgang);
    // Bestätigung je Satz wie in der Maske je Satz (G5)
    for (const j of demo.je) {
      const a = keimAnsicht(demoTeile, j.satzId, JETZT, ZEITZONE);
      if (!a) throw new Error(`Satz ${j.satzId}`);
      expect(a.datenart).toBe('demo');
      const f = fertigText(demoTeile, a, j.eingabe, demo.vorgang);
      expect(f.zeilen).toContain(HINWEIS_NICHT_ECHT);
      expect(f.zeilen.join(' ')).not.toMatch(/Keimrate der Packung/);
    }
  });
});
