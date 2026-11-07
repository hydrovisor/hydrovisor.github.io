// Vorschläge für Deckel und Platten aus dem Konzept 5.4 (Hardware nach dem 3D-Modell V12.10, Erratum E2; #125). Der Name
// bezeichnet das Lochbild, nicht den Platz: ein Typ gilt für mehrere Plätze und ist tauschbar. Rein, ohne Zeitbezug.
//
// Fest im Konzept: Name, Plätze, Lochzahl und Topfgrösse (5.3 Tabelle, 5.4), dazu die Reihen von D6 («2, 2, 2») und S5
// («1, 2, 1, 2, 1, 2, 1, 2, 1»). Bei D1, D2, D3, D4 und S8 nennt das Konzept nur die Lochzahl; die Reihen sind eine
// Annahme (A) nach den Demo-Deckeln, darum `reihenAngenommen` und der Hinweis im Formular. S8 «4 Löcher 8 cm in einer
// Reihe»: Die Wanne Leni Flori 36 steht längs in der Regaltiefe und ist 13.5 cm breit (5.3); die Reihe läuft also von
// vorne nach hinten, als «Löcher je Reihe» 1, 1, 1, 1 wie die Reihen von S5 (Prüfer #125 Befund 1). Service-Öffnung:
// «Jedes Gefäss hat vorne eine Service-Öffnung» (5.4).
import type { DeckeltypEingabe } from './deckeltyp.ts';
import { lochzahl } from './lochbild.ts';
import { nameDoppelt } from './name.ts';

export interface DeckelVorschlag {
  name: string;
  /** Löcher je Reihe von vorne nach hinten */
  reihen: readonly number[];
  topfCm: 5 | 8;
  /** Plätze, die den Typ nach dem Konzept nutzen */
  fuer: readonly string[];
  /** Reihen nicht im Konzept, nur die Lochzahl (A) */
  reihenAngenommen: boolean;
}

export const DECKEL_VORSCHLAEGE: readonly DeckelVorschlag[] = [
  { name: 'D1', reihen: [2, 2], topfCm: 8, fuer: ['1.1', '1.2'], reihenAngenommen: true },
  { name: 'D2', reihen: [3, 3], topfCm: 8, fuer: ['2.1', '2.3'], reihenAngenommen: true },
  { name: 'D4', reihen: [1, 1], topfCm: 8, fuer: ['2.2'], reihenAngenommen: true },
  { name: 'D3', reihen: [4, 4], topfCm: 5, fuer: ['3.1', '3.3'], reihenAngenommen: true },
  { name: 'D6', reihen: [2, 2, 2], topfCm: 5, fuer: ['3.2', '4.1'], reihenAngenommen: false },
  { name: 'S8', reihen: [1, 1, 1, 1], topfCm: 8, fuer: ['4.2', '4.3'], reihenAngenommen: true },
  {
    name: 'S5',
    reihen: [1, 2, 1, 2, 1, 2, 1, 2, 1],
    topfCm: 5,
    fuer: ['4.4', '4.5'],
    reihenAngenommen: false,
  },
];

/** Vorschläge ohne gleichnamigen aktiven Deckel (gleiche Regel wie «Einen Deckel … gibt es schon»; Demo-Deckel heissen
 * «Demo D1» und zählen nicht) */
export function offeneDeckelVorschlaege(bestand: readonly { name: string }[]): DeckelVorschlag[] {
  return DECKEL_VORSCHLAEGE.filter((v) => !nameDoppelt(v.name, bestand));
}

/** «2, 2 · 4 Löcher · 8 cm · für 1.1, 1.2» */
export function deckelVorschlagText(v: DeckelVorschlag): string {
  return `${v.reihen.join(', ')} · ${String(lochzahl(v.reihen))} Löcher · ${String(v.topfCm)} cm · für ${v.fuer.join(', ')}`;
}

/** Eingabe für «Deckel erfassen»; Tim vergleicht und speichert selbst */
export function deckelVorschlagEingabe(v: DeckelVorschlag): DeckeltypEingabe {
  return {
    name: v.name,
    topfdurchmesserCm: v.topfCm,
    loecherJeReihe: v.reihen.join(', '),
    serviceOeffnung: true,
  };
}
