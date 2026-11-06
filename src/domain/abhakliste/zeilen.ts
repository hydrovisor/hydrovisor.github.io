// Zeilen 0 bis 17 der Abhakliste Lösungswechsel (Konzept R4.6, R4.4, R4.7, R4.11; Plan 29 A9, A10). Rein.
// Mengen in Zehnteln ml, Volumen in Hundertsteln l, pH in Hundertsteln.
import type { Kalibrierstand } from '../kalibrierung/stand.ts';
import type { NeuansatzErgebnis } from '../rechner.ts';
import type { RestdosisErgebnis } from '../rechner-korrektur.ts';
import { messmittel, type Messmittel } from '../rechner-zahlen.ts';
import type { Komponente } from '../einstellungen/einstellungen.ts';
import { kalendertag, tageZwischen, type Zeitzone } from '../zeit.ts';

/** gleich dem Enum `ansatz_schritt_typ` der Datenbank */
export type SchrittTyp =
  | 'kalibrierung_pruefen'
  | 'absaugen'
  | 'frischwasser'
  | 'frischwasser_messen'
  | 'gerechnet_fuer'
  | 'micro'
  | 'spuelen'
  | 'grow'
  | 'bloom'
  | 'umruehren'
  | 'timer'
  | 'ph_einstellen'
  | 'kontrollmessung'
  | 'restdosis'
  | 'endmessung'
  | 'abbruch';

export type Messfeld = 'ph' | 'ec' | 'temperatur';

export interface Teilschritt {
  komponente: Komponente;
  name: string;
  sollMl: number;
}

export interface ZeileDef {
  nr: number;
  schritt: SchrittTyp;
  titel: string;
  sollMl?: number;
  messmittel?: Messmittel;
  aufzuege: number;
  timerMin?: number;
  messfelder?: Messfeld[];
  hinweis?: string;
  /** Name der Zugabe (Micro, Grow, Bloom) für die Rückfrage */
  zugabe?: string;
  /** Zeile 15: Micro, Grow, Bloom (A10) */
  teilschritte?: Teilschritt[];
  /** Komponente der Zeilen 5, 7, 9 */
  komponente?: Komponente;
}

/** Wartezeit der Zeilen 11, 13 und 16 (R4.6, A21) */
export const TIMER_MIN = 15;
/** Messzeilen mit Messung im Ablauf */
export const MESSZEILEN: Readonly<Record<number, Messfeld[]>> = {
  3: ['ec', 'temperatur'],
  14: ['ph', 'ec', 'temperatur'],
  17: ['ph', 'ec', 'temperatur'],
};
/** Zugaben der Zeilen 5, 7, 9 in der Reihenfolge der Abhakliste */
export const ZUGABEN: readonly { nr: number; komponente: Komponente; name: string; schritt: SchrittTyp }[] = [
  { nr: 5, komponente: 'micro_hard_water', name: 'Micro', schritt: 'micro' },
  { nr: 7, komponente: 'grow', name: 'Grow', schritt: 'grow' },
  { nr: 9, komponente: 'bloom', name: 'Bloom', schritt: 'bloom' },
];
const KALIBRIER_VORLAUF_TAGE = 3;

function tagText(tag: string): string {
  const [, m, d] = tag.split('-');
  return `${d ?? ''}.${m ?? ''}.`;
}

function literText(volumen: number): string {
  const l = volumen / 100;
  return Number.isInteger(l) ? String(l) : l.toFixed(1);
}

/** Zeile 0: Hinweis, wenn die Kalibrierung innert 3 Tagen abläuft und kein fester Termin davor liegt (R4.6) */
function kalibrierZeile(
  kalibrierung: Kalibrierstand,
  festeTermine: readonly string[],
  jetzt: Date,
  zeitzone: Zeitzone,
): Pick<ZeileDef, 'titel' | 'hinweis'> {
  const HINWEIS = 'zuerst kalibrieren, 10 min';
  if (kalibrierung.art === 'erstkalibrierung') return { titel: 'Kalibrierung fehlt', hinweis: HINWEIS };
  const titel = `Kalibrierung gültig bis ${tagText(kalibrierung.faelligAm)}`;
  if (kalibrierung.art === 'ueberfaellig') return { titel, hinweis: HINWEIS };
  const heute = kalendertag(jetzt, zeitzone);
  const rest = tageZwischen(heute, kalibrierung.faelligAm);
  if (rest > KALIBRIER_VORLAUF_TAGE) return { titel };
  const terminDavor = festeTermine.some((t) => t >= heute && t <= kalibrierung.faelligAm);
  return terminDavor ? { titel } : { titel, hinweis: HINWEIS };
}

function teilschritteAus(restdosis: RestdosisErgebnis | undefined): Teilschritt[] {
  return ZUGABEN.map((z) => ({
    komponente: z.komponente,
    name: z.name,
    sollMl: restdosis?.mengen[z.komponente] ?? 0,
  }));
}

export function zeilenAus(
  e: {
    rechnung: NeuansatzErgebnis | undefined;
    ersterAnsatz: boolean;
    volumen: number;
    kalibrierung: Kalibrierstand;
    festeTermine: readonly string[];
    phZiel: number;
    restdosis?: RestdosisErgebnis;
    gerechnetFuer?: string;
  },
  jetzt: Date,
  zeitzone: Zeitzone,
): ZeileDef[] {
  const zugabe = (z: (typeof ZUGABEN)[number]): ZeileDef => {
    const soll = e.rechnung?.mengenTeil[z.komponente];
    const mm = soll === undefined ? undefined : (e.rechnung?.messmittel[z.komponente] ?? messmittel(soll));
    return {
      nr: z.nr,
      schritt: z.schritt,
      titel: mm ? `${z.name} ${mm.text}` : z.name,
      ...(soll === undefined ? {} : { sollMl: soll }),
      ...(mm ? { messmittel: mm } : {}),
      aufzuege: mm?.aufzuege ?? 1,
      zugabe: z.name,
      komponente: z.komponente,
    };
  };
  const [micro, grow, bloom] = ZUGABEN as [
    (typeof ZUGABEN)[number],
    (typeof ZUGABEN)[number],
    (typeof ZUGABEN)[number],
  ];
  const teile = teilschritteAus(e.restdosis);
  const restSumme = teile.reduce((s, t) => s + t.sollMl, 0);
  const mitRest = teile.filter((t) => t.sollMl > 0);
  const timer = (nr: number): ZeileDef => ({
    nr,
    schritt: 'timer',
    titel: `${String(TIMER_MIN)} min warten`,
    aufzuege: 1,
    timerMin: TIMER_MIN,
  });
  const ph = (e.phZiel / 100).toFixed(2);
  return [
    {
      nr: 0,
      schritt: 'kalibrierung_pruefen',
      aufzuege: 1,
      ...kalibrierZeile(e.kalibrierung, e.festeTermine, jetzt, zeitzone),
    },
    { nr: 1, schritt: 'absaugen', titel: 'Alte Lösung absaugen', aufzuege: 1 },
    {
      nr: 2,
      schritt: 'frischwasser',
      titel: `Frischwasser ${literText(e.volumen)} l, temperiert`,
      aufzuege: 1,
      ...(e.ersterAnsatz ? { hinweis: 'Kannen zählen' } : {}),
    },
    {
      nr: 3,
      schritt: 'frischwasser_messen',
      titel: 'Frischwasser messen',
      aufzuege: 1,
      messfelder: [...(MESSZEILEN[3] ?? [])],
    },
    {
      nr: 4,
      schritt: 'gerechnet_fuer',
      titel: e.gerechnetFuer ? `Gerechnet für: ${e.gerechnetFuer}` : 'Gerechnet für: prüfen',
      aufzuege: 1,
    },
    zugabe(micro),
    { nr: 6, schritt: 'spuelen', titel: 'Messbecher spülen', aufzuege: 1 },
    zugabe(grow),
    { nr: 8, schritt: 'spuelen', titel: 'Messbecher spülen', aufzuege: 1 },
    zugabe(bloom),
    { nr: 10, schritt: 'umruehren', titel: 'Umrühren', aufzuege: 1 },
    timer(11),
    { nr: 12, schritt: 'ph_einstellen', titel: `pH einstellen auf ${ph}`, aufzuege: 1 },
    timer(13),
    {
      nr: 14,
      schritt: 'kontrollmessung',
      titel: 'Kontrollmessung',
      aufzuege: 1,
      messfelder: [...(MESSZEILEN[14] ?? [])],
    },
    {
      nr: 15,
      schritt: 'restdosis',
      titel:
        restSumme > 0
          ? `Restdosis ${mitRest.map((t) => `${t.name} ${(t.sollMl / 10).toFixed(1)} ml`).join(', ')}`
          : 'Restdosis: keine',
      sollMl: restSumme,
      aufzuege: Math.max(1, mitRest.length),
      teilschritte: mitRest,
    },
    timer(16),
    {
      nr: 17,
      schritt: 'endmessung',
      titel: 'Endmessung',
      aufzuege: 1,
      messfelder: [...(MESSZEILEN[17] ?? [])],
    },
  ];
}
