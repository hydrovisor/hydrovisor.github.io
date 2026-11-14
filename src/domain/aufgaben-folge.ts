// Reihenfolge von Heute und «Nächste Aufgabe» (Plan 224 Entscheide 5 und 6; UX2-AK1, R5.1, R5.2): die Route je
// Aufgabentyp, die flache Folge von Heute (Aufgaben ohne Ort, Ortskarten im Laufweg, dann Umsetzen) und die Aufgabe, die
// nach einer eben gespeicherten Erfassung folgt. Rein: jetzt und Zeitzone als Parameter (G1, G2).
import type { Teile } from './anlage/teile.ts';
import { umsetzAufgaben } from './anzucht/umsetzen.ts';
import { aufgabenSchluessel, schluesselLesen } from './aufgaben-aufschub.ts';
import { verteilteAufgaben } from './aufgaben-verteilung.ts';
import { einstellungenAus, type Aufgabe, type AufgabenArt } from './aufgaben.ts';
import { ortAufloesen } from './ort.ts';
import { heuteKarten } from './rundgang/heute.ts';
import type { Zeitzone } from './zeit.ts';

/** Ziel einer Aufgabe; Teilmenge der Routen der Oberfläche mit denselben Feldern */
export type AufgabenZiel =
  | { name: 'messen'; code: string }
  | { name: 'pruefen'; code: string }
  | { name: 'ansatz'; code: string }
  | { name: 'gefaess'; code: string }
  | { name: 'keimung'; satz: string }
  | { name: 'umsetzen'; satz: string; wie?: 'geplant' }
  | { name: 'kalibrieren' }
  // Plan 225: Kurzprüfung eines Orts und Nachfüllen Kratky; «von» führt nach dem Speichern zurück zur Maske Gefäss
  | { name: 'kurzpruefung'; code: string; von?: 'gefaess' }
  | { name: 'nachfuellen'; code: string; von?: 'gefaess' };

export interface HeuteEintrag {
  schluessel: string;
  titel: string;
  /** Code des Orts (R-2.1), beim Umsetzen die Kennung der Station */
  ort?: string;
  ziel?: AufgabenZiel;
}

export interface Folgeaufgabe {
  schluessel: string;
  titel: string;
  ort?: string;
  ziel: AufgabenZiel;
}

/** in eigener Anzeige: Umsetzen (Liste aus umsetzAufgaben()), Kalibrieren (Kopf «Messgerät») */
export const ANDERSWO: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>(['umsetzen', 'kalibrieren']);

type Maske = 'messen' | 'pruefen' | 'ansatz' | 'gefaess' | 'kurzpruefung' | 'nachfuellen';

/** Maske am Ort je Typ; Typen ohne Eintrag haben nur eine Taste in Heute */
const AM_ORT: Partial<Record<AufgabenArt, Maske>> = {
  messen_nachfuellen: 'messen',
  messen: 'messen',
  kontrolle_folgetag: 'messen',
  waerme_pruefen: 'messen',
  gefaess_pruefen: 'pruefen',
  loesung_wechseln: 'ansatz',
  ansatz: 'ansatz',
  // Plan 225: Kurzprüfung und Belüftung führen in die Kurzprüfung des Orts, Nachfüllen Kratky in den Nachfüllschritt,
  // die Station zum Neuansatz (R4.5); «Wurzeln prüfen» erledigt Heute mit einer Taste, «Öffnen» führt zum Gefäss
  kurzpruefung: 'kurzpruefung',
  belueftung_pruefen: 'kurzpruefung',
  wurzeln_pruefen: 'gefaess',
  nachfuellen_kratky: 'nachfuellen',
  station_echte_blaetter: 'ansatz',
};

/**
 * Erfassungsmasken: nur sie kommen als «Nächste Aufgabe» in Frage (A6). Die Kurzprüfung erledigt Heute mit einem
 * Tipper und gehört nicht dazu (Plan 225 A10).
 */
const EIGENE_MASKE: ReadonlySet<AufgabenZiel['name']> = new Set<AufgabenZiel['name']>([
  'messen',
  'pruefen',
  'ansatz',
  'keimung',
  'umsetzen',
  'nachfuellen',
]);

/** Route je Aufgabentyp (Tabelle in Plan 224 Entscheid 6); undefined, wenn die Aufgabe nur eine Taste in Heute hat */
export function aufgabeZiel(a: Aufgabe): AufgabenZiel | undefined {
  if (a.typ === 'keimung_pruefen') return { name: 'keimung', satz: a.bezug };
  if (a.typ === 'ph_kontrolle') return { name: 'kalibrieren' };
  // Reservierung prüfen wird durch Umsetzen oder Ausfall erledigt (Konzept R5.2); beide tragen den Satz als Bezug
  if (a.typ === 'reservierung_pruefen' || a.typ === 'umsetzen') return { name: 'umsetzen', satz: a.bezug };
  const maske = AM_ORT[a.typ];
  const code = a.ort?.code;
  return maske && code ? { name: maske, code } : undefined;
}

/**
 * Reihenfolge von Heute als flache Liste: Aufgaben ohne Ort, die Ortskarten aus heuteKarten() im Laufweg, dann die
 * Umsetzaufgaben; ohne Kalibrieren und ohne das Umsetzen der Aufgaben-Rechnung.
 */
export function heuteFolge(
  teile: Teile,
  faellig: readonly Aufgabe[],
  jetzt: Date,
  zeitzone: Zeitzone,
): HeuteEintrag[] {
  const liste = faellig.filter((a) => !ANDERSWO.has(a.typ));
  const eintrag = (a: Aufgabe): HeuteEintrag => {
    const ziel = aufgabeZiel(a);
    return {
      schluessel: a.schluessel,
      titel: a.titel,
      ...(a.ort ? { ort: a.ort.code } : {}),
      ...(ziel ? { ziel } : {}),
    };
  };
  return [
    ...liste.filter((a) => !a.ort).map(eintrag),
    ...heuteKarten(teile, liste).flatMap((k) => k.aufgaben.map(eintrag)),
    ...umsetzAufgaben(teile, jetzt, zeitzone).map((u): HeuteEintrag => ({
      schluessel: aufgabenSchluessel('umsetzen', u.satzId, u.faelligAm),
      titel: `Umsetzen ${u.sorte}`,
      ...(u.ort ? { ort: u.ort } : {}),
      ziel: u.wieGeplant
        ? { name: 'umsetzen', satz: u.satzId, wie: 'geplant' }
        : { name: 'umsetzen', satz: u.satzId },
    })),
  ];
}

/** Maske und Bezug (Platz oder Satz) eines Ziels; `wie` zählt nicht */
function kennungVon(ziel: AufgabenZiel, teile: Teile): string {
  if (ziel.name === 'kalibrieren') return ziel.name;
  if (ziel.name === 'keimung' || ziel.name === 'umsetzen') return `${ziel.name}|${ziel.satz}`;
  return `${ziel.name}|${(teile ? ortAufloesen(ziel.code, teile)?.platzId : undefined) ?? ziel.code}`;
}

/** dasselbe aus dem Schlüssel typ|bezug|tag, auch wenn die Aufgabe nicht mehr fällig ist */
function kennungAusSchluessel(schluessel: string): string | undefined {
  const s = schluesselLesen(schluessel);
  if (!s) return undefined;
  if (s.typ === 'keimung_pruefen') return `keimung|${s.bezug}`;
  if (s.typ === 'umsetzen' || s.typ === 'reservierung_pruefen') return `umsetzen|${s.bezug}`;
  const maske = AM_ORT[s.typ];
  return maske ? `${maske}|${s.bezug}` : undefined;
}

/**
 * Die Aufgabe nach der eben erledigten (UX2-AK1). `bezug.ziel` ist die Maske, in der gespeichert wurde, `bezug.vorher`
 * die Schlüsselfolge von Heute beim Öffnen dieser Maske: die Antwort ist der erste noch offene Eintrag mit eigener
 * Maske nach der Stelle des Bezugs, sonst von vorne (A7), sonst ein seither neuer Eintrag; ein seither neuer Eintrag
 * am Ort des Bezugs geht allen vor. Ohne Bezug der erste
 * Eintrag mit eigener Maske; ohne Kandidat undefined.
 */
export function folgeAufgabe(
  teile: Teile,
  jetzt: Date,
  zeitzone: Zeitzone,
  bezug?: { ziel: AufgabenZiel; vorher: readonly string[] },
): Folgeaufgabe | undefined {
  const faellig = verteilteAufgaben(teile, einstellungenAus(teile), jetzt, zeitzone);
  const eigene = bezug ? kennungVon(bezug.ziel, teile) : undefined;
  const kandidaten = heuteFolge(teile, faellig, jetzt, zeitzone).filter(
    (e): e is Folgeaufgabe =>
      e.ziel !== undefined && EIGENE_MASKE.has(e.ziel.name) && kennungVon(e.ziel, teile) !== eigene,
  );
  if (!bezug) return kandidaten[0];
  const stelle = bezug.vorher.findIndex((s) => kennungAusSchluessel(s) === eigene);
  if (stelle < 0) return kandidaten[0];
  // eine Aufgabe, die seit dem Öffnen am selben Ort entstanden ist, geht vor: nach der Kratky-Messung «unter ⅓»
  // folgt das Nachfüllen desselben Gefässes (Plan 225 Entscheid 7)
  const ort = 'code' in bezug.ziel ? bezug.ziel.code : undefined;
  const amOrt = kandidaten.find(
    (k) =>
      ort !== undefined && 'code' in k.ziel && k.ziel.code === ort && !bezug.vorher.includes(k.schluessel),
  );
  if (amOrt) return amOrt;
  const offen = new Map(kandidaten.map((k) => [k.schluessel, k]));
  for (const s of [...bezug.vorher.slice(stelle + 1), ...bezug.vorher.slice(0, stelle)]) {
    const k = offen.get(s);
    if (k) return k;
  }
  return kandidaten.find((k) => !bezug.vorher.includes(k.schluessel));
}
