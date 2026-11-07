// Aufgaben-Rechnung (Plan 27; Konzept 7.4 R5.1 bis R5.5, 11.3; UC8): rechnet aus den Bündelteilen die Aufgaben mit dem
// Schlüssel typ|bezug|faellig_am. Keine Aufgabe wird gespeichert (R5.1); Client (Vite) und Edge Function (Deno)
// importieren dasselbe Modul und liefern für denselben Stand dieselbe Liste (UC8-AK10). Rein: stichtag und Zeitzone als
// Parameter (G1, G2), relative Importe mit .ts, keine Browser- oder Node-API.
import { anlagenAus, nachKennung, zeilen, type Teile } from './anlage/teile.ts';
import type { Datenart } from './kalibrierung/stand.ts';
import {
  ERLEDIGT_KNOPF,
  TYPEN,
  UEBERSPRINGEN,
  anzeigeAb,
  morgenErlaubt,
  pegelOkHeute,
  verschoben,
  type AufschubZeile,
} from './aufgaben-aufschub.ts';
import { rohaufgaben } from './aufgaben-regeln.ts';
import { STROM_TYPEN, type StromTyp } from './aufgaben-stromausfall.ts';
import { kalendertag, tagKurz, tageZwischen, type Zeitzone } from './zeit.ts';

export { aufgabenSchluessel, schluesselLesen } from './aufgaben-aufschub.ts';

export type AufgabenTyp =
  | 'gefaess_pruefen'
  | 'messen_nachfuellen'
  | 'messen'
  | 'nachfuellen_kratky'
  | 'loesung_wechseln'
  | 'ansatz'
  | 'kontrolle_folgetag'
  | 'kurzpruefung'
  | 'belueftung_pruefen'
  | 'wurzeln_pruefen'
  | 'waerme_pruefen'
  | 'kalibrieren'
  | 'ph_kontrolle'
  | 'wuerfel_feucht'
  | 'deckel_oeffnen'
  | 'abdeckung_entfernen'
  | 'keimung_pruefen'
  | 'umsetzen'
  | 'station_echte_blaetter'
  | 'reservierung_pruefen'
  | 'reinigen';
/** alle Typen mit Stufe 2 «Nach Stromausfall» (Plan 30); AufgabenTyp bleibt die Tabelle R5.2 Stufe 1 */
export type AufgabenArt = AufgabenTyp | StromTyp;
export type Gewicht = 'ausserhalb' | 'wechsel' | 'routine';
export type BezugArt = 'platz' | 'satz' | 'messgeraet' | 'anlage';

export interface AufgabenOrt {
  platzId: string;
  /** Kürzel und Kennung, z. B. 'R-1.1' */
  code: string;
  kennung: string;
  rolle: 'gefaess' | 'anzuchtort';
  bereichId: string | null;
}

/** Aufgabe aus einer Regel, vor der Wirkung von «Morgen», «Überspringen» und «Pegel ok» */
export interface Rohaufgabe {
  schluessel: string;
  typ: AufgabenArt;
  bezug: string;
  bezugArt: BezugArt;
  faelligAm: string;
  anlageId: string;
  datenart: Datenart;
  ort?: AufgabenOrt;
  titel: string;
  gewicht: Gewicht;
  hinweis?: string;
  /** letzter erlaubter Anzeigetag nach «Morgen» bei { bis } (Keimdauer max, Saat + umsetzen_bis + 7) */
  morgenBis?: string;
  /** Messen bei Kratky ohne Pumpe: kein festes Intervall im Sinn von R5.3 */
  ohneUeberspringen?: boolean;
  /** R5.6: darf 1 bis 2 Tage vorgezogen werden (Wechsel nach Intervall, Ansatz für Umsetzen; Plan 113) */
  vorziehbar?: true;
  /** R5.6: frühester Tag beim Vorziehen (Wechsel mit «mit 1. echte Blätter»: Stationstag; Plan 113 Nachtrag 10) */
  fruehestens?: string;
}

export interface Aufgabe {
  /** typ|bezug|faellig_am */
  schluessel: string;
  typ: AufgabenArt;
  bezug: string;
  bezugArt: BezugArt;
  /** 'JJJJ-MM-TT' Zürich, ursprüngliche Fälligkeit */
  faelligAm: string;
  /** faelligAm oder nach «Morgen» der Folgetag */
  anzeigeAb: string;
  /** heute − faelligAm, nie negativ */
  tageUeberfaellig: number;
  anlageId: string;
  datenart: Datenart;
  ort?: AufgabenOrt;
  titel: string;
  grund: string;
  gewicht: Gewicht;
  morgen: { erlaubt: boolean; verschoben: number; hinweis?: 'intervall_anpassen' };
  ueberspringen: boolean;
  /** Knopf «Pegel ok» anbieten (nur messen_nachfuellen ohne Pegel ok heute) */
  pegelOk: boolean;
  erledigtKnopf: boolean;
  /** «zuerst umrühren», «Umsetzen überfällig», «mitmarkiert», «mit 1. echte Blätter», «vorgezogen» (R5.6) */
  hinweis?: string;
  /** R5.6: darf 1 bis 2 Tage vorgezogen werden (Plan 113) */
  vorziehbar?: true;
  /** R5.6: frühester Tag beim Vorziehen (Plan 113 Nachtrag 10) */
  fruehestens?: string;
}

export interface AufgabenEinstellungen {
  /** einstellung.vorlauf_n (Stufe 2, hier durchgereicht) */
  vorlaufN: number;
  festeKalibriertermine: readonly string[];
}

/** Namen der Bündelteile, die die Regeln lesen; fehlende Teile zählen als leer */
export const AUFGABEN_TEILE: readonly string[] = [
  'anlage',
  'platz',
  'gefaess',
  'anzuchtort',
  'netztopf',
  'v_gefaess_status',
  'v_fuellzustand',
  'v_nachfuellsumme',
  'sorte',
  'art',
  'v_sollwert',
  'satz',
  'pflanzung',
  'v_pflanzung_zustand',
  'v_reservierung_aktiv',
  'reservierung',
  'ereignis_pflanzung',
  'messung',
  'naehrloesungsansatz',
  'kalibrierung',
  'messgeraet',
  'aufschub',
  'ereignis',
  'ereignis_platz',
  'einstellung',
];

export function fehlendeTeile(teile: Teile): string[] {
  return AUFGABEN_TEILE.filter((n) => teile?.[n] === undefined);
}

export function einstellungenAus(teile: Teile): AufgabenEinstellungen {
  const e = zeilen<{ vorlauf_n?: number | null; feste_kalibriertermine?: readonly string[] | null }>(
    teile,
    'einstellung',
  )[0];
  return {
    vorlaufN: Number(e?.vorlauf_n ?? 2),
    festeKalibriertermine: [...(e?.feste_kalibriertermine ?? [])],
  };
}

const RANG_TYP = new Map(TYPEN.map((t, i) => [t, i]));
const RANG_ROLLE = { anzuchtort: 1, gefaess: 2 } as const;

function anzahlText(n: number, was: string): string {
  return `seit ${n} ${n === 1 ? 'Tag' : 'Tagen'} ${was}`;
}

function mitAufschub(roh: Rohaufgabe, aufschuebe: readonly AufschubZeile[], heute: string): Aufgabe {
  const { morgenBis, ohneUeberspringen, ...rest } = roh;
  const anzahl = verschoben(roh, aufschuebe);
  const ueber = Math.max(0, tageZwischen(roh.faelligAm, heute));
  const grund =
    anzahl >= 2
      ? anzahlText(ueber, 'verschoben')
      : ueber > 0
        ? anzahlText(ueber, 'überfällig')
        : roh.faelligAm === heute
          ? 'heute fällig'
          : `fällig ${tagKurz(roh.faelligAm)}`;
  return {
    ...rest,
    anzeigeAb: anzeigeAb(roh, aufschuebe),
    tageUeberfaellig: ueber,
    grund,
    morgen: {
      erlaubt: morgenErlaubt(roh, morgenBis, aufschuebe, heute),
      verschoben: anzahl,
      ...(anzahl >= 2 ? { hinweis: 'intervall_anpassen' as const } : {}),
    },
    ueberspringen: UEBERSPRINGEN.has(roh.typ) && ohneUeberspringen !== true,
    pegelOk: roh.typ === 'messen_nachfuellen' && !pegelOkHeute(roh, aufschuebe, heute),
    erledigtKnopf: ERLEDIGT_KNOPF.has(roh.typ) || STROM_TYPEN.has(roh.typ as StromTyp),
  };
}

/** Anlage (echt vor demo vor test, dann Kürzel), Messgerät vor Anzuchtorten vor Gefässen, Kennung, Tabelle R5.2 */
function sortieren(aufgaben: Aufgabe[], teile: Teile): Aufgabe[] {
  const rangAnlage = new Map(anlagenAus(teile).map((a, i) => [a.id, i]));
  const gruppe = (a: Aufgabe) => (a.ort ? RANG_ROLLE[a.ort.rolle] : 0);
  return aufgaben.sort(
    (a, b) =>
      (rangAnlage.get(a.anlageId) ?? 0) - (rangAnlage.get(b.anlageId) ?? 0) ||
      gruppe(a) - gruppe(b) ||
      nachKennung({ kennung: a.ort?.kennung ?? '' }, { kennung: b.ort?.kennung ?? '' }) ||
      (RANG_TYP.get(a.typ) ?? 0) - (RANG_TYP.get(b.typ) ?? 0) ||
      a.faelligAm.localeCompare(b.faelligAm) ||
      a.schluessel.localeCompare(b.schluessel),
  );
}

/** alle Aufgaben mit ihrer Fälligkeit, auch künftige; sortiert; ohne Datenartfilter */
export function alleAufgaben(
  teile: Teile,
  einstellungen: AufgabenEinstellungen,
  stichtag: Date,
  zeitzone: Zeitzone,
): Aufgabe[] {
  const heute = kalendertag(stichtag, zeitzone);
  const aufschuebe = zeilen<AufschubZeile>(teile, 'aufschub').filter(
    (a) => (a.storniert_am ?? null) === null,
  );
  const gesehen = new Set<string>();
  const aufgaben: Aufgabe[] = [];
  for (const roh of rohaufgaben(teile, einstellungen, stichtag, zeitzone, aufschuebe)) {
    if (gesehen.has(roh.schluessel)) continue;
    gesehen.add(roh.schluessel);
    aufgaben.push(mitAufschub(roh, aufschuebe, heute));
  }
  return sortieren(aufgaben, teile);
}

/** anzeigeAb ≤ heute (R5.1); Client und Edge Function liefern für gleiche Eingaben gleiche Listen */
export function faelligeAufgaben(
  teile: Teile,
  einstellungen: AufgabenEinstellungen,
  stichtag: Date,
  zeitzone: Zeitzone,
): Aufgabe[] {
  const heute = kalendertag(stichtag, zeitzone);
  return alleAufgaben(teile, einstellungen, stichtag, zeitzone).filter((a) => a.anzeigeAb <= heute);
}

/** früheste Aufgabe nach heute für «Heute nichts zu tun · nächste: …» */
export function naechsteAufgabe(
  teile: Teile,
  einstellungen: AufgabenEinstellungen,
  stichtag: Date,
  zeitzone: Zeitzone,
): Aufgabe | undefined {
  const heute = kalendertag(stichtag, zeitzone);
  const spaeter = alleAufgaben(teile, einstellungen, stichtag, zeitzone).filter((a) => a.anzeigeAb > heute);
  const erster = spaeter.map((a) => a.anzeigeAb).sort()[0];
  return spaeter.find((a) => a.anzeigeAb === erster);
}

/** nur echte Aufgaben für Push und Zählungen (G5, 8.1 Regel 7) */
export function nurEcht(aufgaben: readonly Aufgabe[]): Aufgabe[] {
  return aufgaben.filter((a) => a.datenart === 'echt');
}

/** Zählung für den Push-Titel «1 Ausserhalb · 2 Wechsel · 9 Routine» (R5.5) */
export function titelNachGewicht(aufgaben: readonly Aufgabe[]): {
  ausserhalb: number;
  wechsel: number;
  routine: number;
} {
  const zahl = { ausserhalb: 0, wechsel: 0, routine: 0 };
  for (const a of aufgaben) zahl[a.gewicht] += 1;
  return zahl;
}
