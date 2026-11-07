// Aufgaben-Rechnung, Teil Aufschub (Plan 27; R5.1, R5.3, 8.1 Regel 2, 11.4): Tabellen je Aufgabentyp (Reihenfolge der
// Tabelle R5.2, «Morgen», «Überspringen», «Erledigt»), Schlüssel typ|bezug|faellig_am, Wirkung der Zeilen der Tabelle
// `aufschub` und die Vorgänge für schreiben(). Rein: jetzt und Zeitzone als Parameter (G1, G2).
import type { Datenart } from './kalibrierung/stand.ts';
import type { Schritt, Vorgang } from './datenpfad/erfassung.ts';
import { kalendertag, tagPlus, type Zeitzone } from './zeit.ts';
import type { Aufgabe, AufgabenArt, AufgabenTyp, Rohaufgabe } from './aufgaben.ts';
import { MORGEN_STROM, STROM_LISTE, STROM_TYPEN, type StromTyp } from './aufgaben-stromausfall.ts';

/** Typen in der Reihenfolge der Tabelle R5.2 (Sortierung am selben Ort) */
export const TYPEN: readonly AufgabenArt[] = [
  'gefaess_pruefen',
  'messen_nachfuellen',
  'messen',
  'nachfuellen_kratky',
  'loesung_wechseln',
  'ansatz',
  'kontrolle_folgetag',
  'kurzpruefung',
  'belueftung_pruefen',
  'wurzeln_pruefen',
  'waerme_pruefen',
  'kalibrieren',
  'ph_kontrolle',
  'wuerfel_feucht',
  'deckel_oeffnen',
  'abdeckung_entfernen',
  'keimung_pruefen',
  'umsetzen',
  'station_echte_blaetter',
  'reservierung_pruefen',
  'reinigen',
  // Stufe 2 «Nach Stromausfall» (Plan 30)
  ...STROM_LISTE,
];

export interface AufschubZeile {
  id: string;
  client_id?: string | null;
  aufgabe_schluessel: string;
  art: 'morgen' | 'ueberspringen' | 'pegel_ok';
  gesetzt_am: string;
  gilt_ab: string;
  storniert_am: string | null;
}

export type MorgenRegel =
  'nein' | 'ja' | { max: number } | { tage: number } | { bis: 'keimdauer_max' | 'umsetzen_bis_7' };

/** Spalte «Morgen» der Tabelle R5.2 */
export const MORGEN: Record<AufgabenTyp, MorgenRegel> = {
  gefaess_pruefen: 'ja',
  messen_nachfuellen: 'nein',
  messen: { max: 2 },
  nachfuellen_kratky: 'nein',
  loesung_wechseln: { tage: 3 },
  ansatz: 'nein',
  kontrolle_folgetag: 'nein',
  kurzpruefung: 'nein',
  belueftung_pruefen: 'nein',
  wurzeln_pruefen: { max: 1 },
  waerme_pruefen: 'nein',
  kalibrieren: 'ja',
  ph_kontrolle: 'ja',
  wuerfel_feucht: 'nein',
  deckel_oeffnen: 'ja',
  abdeckung_entfernen: 'ja',
  keimung_pruefen: { bis: 'keimdauer_max' },
  umsetzen: { bis: 'umsetzen_bis_7' },
  station_echte_blaetter: 'nein',
  reservierung_pruefen: 'ja',
  reinigen: 'ja',
};

/** «Überspringen» nur bei festem Intervall (R5.3): Messen Kratky belüftet, Wurzeln prüfen, pH-Kontrolle */
export const UEBERSPRINGEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'messen',
  'wurzeln_pruefen',
  'ph_kontrolle',
]);

/** Knopf «Erledigt» nur ohne eigene Erfassung (8.1 Regel 2: ein eigener Ereignistyp geht vor) */
export const ERLEDIGT_KNOPF: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>(['wuerfel_feucht', 'reinigen']);

const TAG = /^\d{4}-\d{2}-\d{2}$/;

export function aufgabenSchluessel(typ: AufgabenArt, bezug: string, faelligAm: string): string {
  return `${typ}|${bezug}|${faelligAm}`;
}

export function schluesselLesen(
  s: string,
): { typ: AufgabenArt; bezug: string; faelligAm: string } | undefined {
  const teile = s.split('|');
  if (teile.length !== 3) return undefined;
  const [typ, bezug, faelligAm] = teile as [string, string, string];
  if (!(TYPEN as readonly string[]).includes(typ) || !TAG.test(faelligAm)) return undefined;
  return { typ: typ as AufgabenArt, bezug, faelligAm };
}

const vonArt = (aufschuebe: readonly AufschubZeile[], art: AufschubZeile['art'], schluessel: string) =>
  aufschuebe.filter((a) => a.art === art && a.aufgabe_schluessel === schluessel && a.storniert_am === null);

/** Anzahl «Morgen» zu diesem Schlüssel */
export function verschoben(
  roh: Pick<Rohaufgabe, 'schluessel'>,
  aufschuebe: readonly AufschubZeile[],
): number {
  return vonArt(aufschuebe, 'morgen', roh.schluessel).length;
}

/** Anzeigedatum: ursprüngliche Fälligkeit, nach «Morgen» der Tag nach dem letzten Drücken */
export function anzeigeAb(
  roh: Pick<Rohaufgabe, 'schluessel' | 'faelligAm'>,
  aufschuebe: readonly AufschubZeile[],
): string {
  const letzter = vonArt(aufschuebe, 'morgen', roh.schluessel)
    .map((a) => a.gesetzt_am)
    .sort()
    .at(-1);
  if (letzter === undefined) return roh.faelligAm;
  const folge = tagPlus(letzter, 1);
  return folge > roh.faelligAm ? folge : roh.faelligAm;
}

/** «Pegel ok» zu diesem Schlüssel heute gesetzt (gilt einen Tag, UC8-AK4) */
export function pegelOkHeute(
  roh: Pick<Rohaufgabe, 'schluessel'>,
  aufschuebe: readonly AufschubZeile[],
  heute: string,
): boolean {
  return vonArt(aufschuebe, 'pegel_ok', roh.schluessel).some((a) => a.gesetzt_am === heute);
}

/** Darf «Morgen» heute gedrückt werden? `grenze` = letzter erlaubter Anzeigetag bei { bis } */
export function morgenErlaubt(
  roh: Pick<Rohaufgabe, 'schluessel' | 'typ' | 'faelligAm'>,
  grenze: string | undefined,
  aufschuebe: readonly AufschubZeile[],
  heute: string,
): boolean {
  const regel: MorgenRegel = STROM_TYPEN.has(roh.typ as StromTyp)
    ? MORGEN_STROM[roh.typ as StromTyp]
    : MORGEN[roh.typ as AufgabenTyp];
  const anzahl = verschoben(roh, aufschuebe);
  const morgen = tagPlus(heute, 1);
  if (regel === 'ja') return true;
  if (regel === 'nein')
    // Messen und nachfüllen: nach «Pegel ok» heute, höchstens 2 × in Folge (A7)
    return roh.typ === 'messen_nachfuellen' && pegelOkHeute(roh, aufschuebe, heute) && anzahl < 2;
  if ('max' in regel) return anzahl < regel.max;
  if ('tage' in regel) return morgen <= tagPlus(roh.faelligAm, regel.tage);
  return grenze === undefined || morgen <= grenze;
}

/**
 * Letzte Erfassung oder jüngeres «Überspringen» zu typ|bezug als Kalendertag (R5.3, A8): Grundlage der
 * Intervallregeln, damit die nächste Fälligkeit nach dem Überspringen heute + Intervall ist.
 */
export function erfassungOderUebersprungen(
  typ: AufgabenArt,
  bezug: string,
  letzte: string | undefined,
  aufschuebe: readonly AufschubZeile[],
): string | undefined {
  const vorsatz = `${typ}|${bezug}|`;
  const tage = aufschuebe
    .filter(
      (a) => a.art === 'ueberspringen' && a.storniert_am === null && a.aufgabe_schluessel.startsWith(vorsatz),
    )
    .map((a) => a.gesetzt_am);
  if (letzte !== undefined) tage.push(letzte);
  return tage.sort().at(-1);
}

/**
 * Vorgang für «Morgen», «Überspringen» oder «Pegel ok» (R5.3, 11.4): eine Zeile in `aufschub`; leer, wenn die Aufgabe
 * den Knopf nicht anbietet. «Morgen» beim Umsetzen verschiebt stattdessen das geplante Datum am Satz.
 */
export function aufschubVorgang(
  aufgabe: Aufgabe,
  art: 'morgen' | 'ueberspringen' | 'pegel_ok',
  id: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  satz?: { satzId: string; umsetzenGeplantAm: string },
): Vorgang {
  const angeboten =
    art === 'morgen'
      ? aufgabe.morgen.erlaubt
      : art === 'ueberspringen'
        ? aufgabe.ueberspringen
        : aufgabe.pegelOk;
  if (!angeboten) return [];
  const tag = kalendertag(jetzt, zeitzone);
  if (art === 'morgen' && aufgabe.typ === 'umsetzen') {
    const s = satz ?? { satzId: aufgabe.bezug, umsetzenGeplantAm: aufgabe.faelligAm };
    const schritt: Schritt = {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: 'umsetzdatum_geaendert',
        satz_id: s.satzId,
        daten: { von: s.umsetzenGeplantAm, nach: tagPlus(tag, 1), grund: 'morgen' },
        gilt_ab: jetzt.toISOString(),
      },
    };
    return [schritt];
  }
  const datenart: Datenart = aufgabe.datenart;
  return [
    {
      art: 'neu',
      tabelle: 'aufschub',
      felder: {
        id,
        client_id: id,
        aufgabe_schluessel: aufgabe.schluessel,
        art,
        gesetzt_am: tag,
        gilt_ab: jetzt.toISOString(),
        datenart,
      },
    },
  ];
}

/**
 * Vorgang für «Erledigt»: Ereignis aufgabe_erledigt mit Schlüssel und ursprünglicher Fälligkeit (Termintreue); bei den
 * Aufgaben «Nach Stromausfall» an der Anlage mit anlage_id statt platz_id (Plan 30)
 */
export function erledigtVorgang(aufgabe: Aufgabe, id: string, jetzt: Date): Vorgang {
  if (!ERLEDIGT_KNOPF.has(aufgabe.typ) && !STROM_TYPEN.has(aufgabe.typ as StromTyp)) return [];
  return [
    {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: 'aufgabe_erledigt',
        ...(aufgabe.bezugArt === 'anlage' ? { anlage_id: aufgabe.bezug } : { platz_id: aufgabe.bezug }),
        daten: { aufgabe_schluessel: aufgabe.schluessel },
        war_faellig_am: aufgabe.faelligAm,
        aufgabe_schluessel: aufgabe.schluessel,
        gilt_ab: jetzt.toISOString(),
      },
    },
  ];
}

/**
 * «Deckel geöffnet» bzw. «Abdeckung entfernt» aus der Aufgabe (A9, 8.1 Regel 2): der eigene Ereignistyp statt
 * aufgabe_erledigt, am Platz der Box bzw. am Direktsaat-Satz; für andere Typen leer.
 */
export function deckelVorgang(aufgabe: Aufgabe, id: string, jetzt: Date): Vorgang {
  const box = aufgabe.typ === 'deckel_oeffnen';
  if (!box && aufgabe.typ !== 'abdeckung_entfernen') return [];
  return [
    {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: box ? 'deckel_geoeffnet' : 'abdeckung_entfernt',
        ...(box ? { platz_id: aufgabe.bezug } : { satz_id: aufgabe.bezug }),
        daten: {},
        war_faellig_am: aufgabe.faelligAm,
        aufgabe_schluessel: aufgabe.schluessel,
        gilt_ab: jetzt.toISOString(),
      },
    },
  ];
}
