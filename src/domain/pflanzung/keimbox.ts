// Keimung prüfen je Anzuchtbox (Plan 227, UX5-AK1, UX5-AK2): bündelt die fertige Aufgabenliste für die Anzeige und baut
// den Vorgang für alle fälligen Sätze einer Box. Die Aufgaben-Rechnung bleibt je Satz (R5.1 bis R5.3); hier wird nur
// gruppiert. Der Vorgang rechnet die Sätze nacheinander, jeder gegen den Stand nach dem vorherigen (teileNach()), mit
// denselben Funktionen wie die Maske je Satz: je Satz entstehen dieselben Zeilen. Rein: jetzt und Zeitzone als
// Parameter (G1, G2).
import type { Teile } from '../anlage/teile.ts';
import type { AufgabenZiel, Folgeaufgabe } from '../aufgaben-folge.ts';
import type { Aufgabe } from '../aufgaben.ts';
import type { Vorgang } from '../datenpfad/erfassung.ts';
import { teileNach } from '../phasen/ende.ts';
import type { Zeitzone } from '../zeit.ts';
import {
  keimAnsicht,
  keimEingabePruefen,
  keimStationsvorschlag,
  keimVorgang,
  type KeimEingabe,
} from './keimung.ts';

/** Sammelzeile «Keimung prüfen · n Sätze» einer Anzuchtbox in Heute */
export interface KeimBox {
  /** keimbox|<platzId> */
  schluessel: string;
  platzId: string;
  /** Code der Box, etwa «R-A1» */
  code: string;
  /** die Aufgaben je Satz aus der Rechnung, dieselben Objekte in ihrer Reihenfolge */
  aufgaben: Aufgabe[];
  titel: string;
  /** Sorten mit Anzahl und die älteste Fälligkeit (A6) */
  grund: string;
  /** «Morgen» nur, wenn jeder Satz es erlaubt (A7) */
  morgenErlaubt: boolean;
}

export type HeuteZeile = { art: 'aufgabe'; aufgabe: Aufgabe } | { art: 'keimbox'; box: KeimBox };

/** Wahl in der Maske je Box: eine Keimtemperatur, Abweichungen je Satz und Pflanzung; ohne Eintrag «Alle gekeimt» */
export interface KeimBoxWahl {
  keimtempEingehalten: boolean | undefined;
  abweichung: Readonly<Record<string, Readonly<Record<string, number | 'offen'>>>>;
}

export interface KeimBoxSatz {
  satzId: string;
  eingabe: KeimEingabe;
  vorgang: Vorgang;
  vorschlag?: ReturnType<typeof keimStationsvorschlag>;
}

export interface KeimBoxErgebnis {
  /** Verkettung der Vorgänge je Satz; leer, sobald ein Satz einen Verstoss hat (alles oder nichts) */
  vorgang: Vorgang;
  je: KeimBoxSatz[];
  /** Sätze ohne offenen Schwamm oder mit allen Schwämmen «offen» (A8) */
  uebersprungen: string[];
  verstoesse: { satzId: string; grund: string }[];
}

export type AnzeigeZiel = AufgabenZiel | { name: 'keimung-box'; code: string };

const TITEL_VORSATZ = /^Keimung prüfen · /;

export function keimBoxTitel(n: number): string {
  return `Keimung prüfen · ${n} Sätze`;
}

const inBox = (a: Aufgabe) => a.typ === 'keimung_pruefen' && a.ort?.rolle === 'anzuchtort';

function boxAus(aufgaben: Aufgabe[]): KeimBox {
  const ort = aufgaben[0]?.ort;
  const sorten = new Map<string, number>();
  for (const a of aufgaben) {
    const sorte = a.titel.replace(TITEL_VORSATZ, '');
    sorten.set(sorte, (sorten.get(sorte) ?? 0) + 1);
  }
  // älteste Fälligkeit: der Grund der Aufgabe, die am längsten fällig ist
  const aelteste = aufgaben.reduce<Aufgabe | undefined>(
    (alt, a) => (alt === undefined || a.faelligAm < alt.faelligAm ? a : alt),
    undefined,
  );
  return {
    schluessel: `keimbox|${ort?.platzId ?? ''}`,
    platzId: ort?.platzId ?? '',
    code: ort?.code ?? '',
    aufgaben,
    titel: keimBoxTitel(aufgaben.length),
    grund: [[...sorten].map(([s, n]) => `${s} × ${n}`).join(', '), aelteste?.grund ?? '']
      .filter(Boolean)
      .join(' · '),
    morgenErlaubt: aufgaben.every((a) => a.morgen.erlaubt),
  };
}

/**
 * Zeilen für Heute: ab zwei fälligen «Keimung prüfen» an derselben Anzuchtbox eine Boxzeile an der Stelle der ersten;
 * alle anderen Aufgaben bleiben dieselben Objekte in ihrer Reihenfolge. Direktsaat im Gefäss wird nicht gebündelt (A3).
 */
export function heuteZeilen(aufgaben: readonly Aufgabe[]): HeuteZeile[] {
  const jeBox = new Map<string, Aufgabe[]>();
  for (const a of aufgaben) {
    if (!inBox(a) || !a.ort) continue;
    jeBox.set(a.ort.platzId, [...(jeBox.get(a.ort.platzId) ?? []), a]);
  }
  const gezeigt = new Set<string>();
  const zeilen: HeuteZeile[] = [];
  for (const a of aufgaben) {
    const gruppe = inBox(a) && a.ort ? jeBox.get(a.ort.platzId) : undefined;
    if (!gruppe || gruppe.length < 2 || !a.ort) {
      zeilen.push({ art: 'aufgabe', aufgabe: a });
      continue;
    }
    if (gezeigt.has(a.ort.platzId)) continue;
    gezeigt.add(a.ort.platzId);
    zeilen.push({ art: 'keimbox', box: boxAus(gruppe) });
  }
  return zeilen;
}

/** Sätze der fälligen «Keimung prüfen» an diesem Anzuchtort, in der Reihenfolge von Heute (A12) */
export function keimBoxSaetze(faellig: readonly Aufgabe[], platzId: string): string[] {
  return faellig.filter((a) => inBox(a) && a.ort?.platzId === platzId).map((a) => a.bezug);
}

/**
 * Ein Vorgang für alle Sätze der Box (04 4.1): je Satz die Eingabe der Maske je Satz (offene Schwämme mit allen Samen
 * oder der Abweichung, die Keimtemperatur der Box, die Station aus keimStationsvorschlag()) und keimVorgang() gegen den
 * Stand nach den vorherigen Sätzen, damit kein Stationsloch doppelt vergeben wird.
 */
export function keimBoxVorgang(
  teile: Teile,
  saetze: readonly string[],
  wahl: KeimBoxWahl,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): KeimBoxErgebnis {
  let stand: Teile = teile;
  const je: KeimBoxSatz[] = [];
  const uebersprungen: string[] = [];
  const verstoesse: { satzId: string; grund: string }[] = [];
  for (const satzId of saetze) {
    const ansicht = keimAnsicht(stand, satzId, jetzt, zeitzone);
    if (!ansicht) {
      verstoesse.push({ satzId, grund: 'Satz nicht bekannt' });
      continue;
    }
    const abweichung = wahl.abweichung[satzId] ?? {};
    const werte = ansicht.schwaemme
      .filter((s) => s.zustand === 'offen')
      .map((s) => ({ pflanzungId: s.pflanzungId, gekeimt: abweichung[s.pflanzungId] ?? s.samen }));
    if (werte.every((w) => w.gekeimt === 'offen')) {
      uebersprungen.push(satzId);
      continue;
    }
    const ohneStation: KeimEingabe = {
      satzId,
      keimtempEingehalten: wahl.keimtempEingehalten,
      werte,
      station: [],
    };
    const vorschlag = keimStationsvorschlag(stand, ohneStation, jetzt, zeitzone);
    const eingabe: KeimEingabe = {
      ...ohneStation,
      station: (vorschlag?.zuweisung ?? []).map((z) => ({
        pflanzungId: z.pflanzungId,
        platzId: z.platzId,
        lochNr: z.lochNr,
      })),
    };
    const fehler = keimEingabePruefen(stand, eingabe, jetzt, zeitzone);
    if (fehler.length > 0) {
      verstoesse.push(...fehler.map((f) => ({ satzId, grund: f.grund })));
      continue;
    }
    const vorgang = keimVorgang(stand, eingabe, ids, jetzt, zeitzone);
    je.push({ satzId, eingabe, vorgang, ...(vorschlag ? { vorschlag } : {}) });
    stand = teileNach(stand, vorgang, jetzt, zeitzone);
  }
  return {
    vorgang: verstoesse.length > 0 ? [] : je.flatMap((j) => [...j.vorgang]),
    je,
    uebersprungen,
    verstoesse,
  };
}

/**
 * Anzeige der Folgeaufgabe: «Keimung prüfen» eines Satzes, dessen Box in Heute eine Boxzeile hat, führt in die Maske je
 * Box mit deren Titel; alles andere bleibt unverändert.
 */
export function folgeAnzeige(
  folge: Folgeaufgabe,
  faellig: readonly Aufgabe[],
): { titel: string; ort?: string; ziel: AnzeigeZiel } {
  if (folge.ziel.name === 'keimung') {
    const satz = folge.ziel.satz;
    for (const z of heuteZeilen(faellig))
      if (z.art === 'keimbox' && z.box.aufgaben.some((a) => a.bezug === satz))
        return { titel: z.box.titel, ort: z.box.code, ziel: { name: 'keimung-box', code: z.box.code } };
  }
  return { titel: folge.titel, ...(folge.ort ? { ort: folge.ort } : {}), ziel: folge.ziel };
}
