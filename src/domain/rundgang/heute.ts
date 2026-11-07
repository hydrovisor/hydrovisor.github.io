// Heute-Karten (Plan 30; UC8 Ablauf 1 bis 3, 05_masken.md 3.1): die fälligen Aufgaben je Ort in Laufweg-Reihenfolge
// des Rundgangs, «Ausserhalb» oben hervorgehoben ohne Umsortieren. Umsetzen bleibt in der eigenen Liste (Plan 33),
// Aufgaben ohne Ort (Messgerät, Anlage) stehen nicht in Karten. Rein.
import { anlagenAus, type Teile } from '../anlage/teile.ts';
import type { Aufgabe, AufgabenOrt } from '../aufgaben.ts';
import { ortsfolge } from './plan.ts';

export interface Ortskarte {
  platzId: string;
  code: string;
  ausserhalb: boolean;
  aufgaben: Aufgabe[];
}

export function heuteKarten(teile: Teile, aufgaben: readonly Aufgabe[]): Ortskarte[] {
  const jeOrt = new Map<string, Aufgabe[]>();
  for (const a of aufgaben) {
    if (!a.ort || a.typ === 'umsetzen') continue;
    jeOrt.set(a.ort.platzId, [...(jeOrt.get(a.ort.platzId) ?? []), a]);
  }
  const karten: Ortskarte[] = [];
  for (const anlage of anlagenAus(teile)) {
    const orte = [...jeOrt.values()]
      .map((l) => l[0]?.ort as AufgabenOrt)
      .filter((o) => (jeOrt.get(o.platzId)?.[0]?.anlageId ?? '') === anlage.id);
    for (const g of ortsfolge(teile, anlage.id, orte))
      for (const o of g.orte) {
        const l = jeOrt.get(o.platzId) ?? [];
        karten.push({
          platzId: o.platzId,
          code: o.code,
          ausserhalb: l.some((a) => a.gewicht === 'ausserhalb'),
          aufgaben: l,
        });
      }
  }
  return karten;
}

/** Codes der Karten mit «Ausserhalb» in Kartenreihenfolge */
export function ausserhalbOrte(karten: readonly Ortskarte[]): string[] {
  return karten.filter((k) => k.ausserhalb).map((k) => k.code);
}

/** Median der Startzeiten in ms (UC8-AK9, Info); undefined ohne Wert */
export function startzeitMedian(werte: readonly number[]): number | undefined {
  if (werte.length === 0) return undefined;
  const s = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mitte] : ((s[mitte - 1] ?? 0) + (s[mitte] ?? 0)) / 2;
}
