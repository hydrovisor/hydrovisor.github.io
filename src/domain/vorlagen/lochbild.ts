// Lochbild eines Deckels oder einer Platte (Plan 19, Plan 81; UC2; Konzept 5.4, 8.1 Regel 9; R3.3): Löcher je Reihe
// von vorne nach hinten, Loch 1 vorne links, spaltenweise nummeriert (Konzept v1.4, E9): erst die linke Spalte von
// vorne nach hinten, dann die nächste. Spalte = Stelle des Lochs in seiner Reihe von links (A). Rein, ohne Zeitbezug.
import type { Verstoss } from '../datenpfad/erfassung.ts';

/** höchstens 20 Reihen (Check in deckeltyp) und höchstens 20 Löcher je Reihe (Plan 19 A4) */
export const MAX_REIHEN = 20;
export const MAX_LOECHER_JE_REIHE = 20;

export interface Loch {
  nr: number;
  /** 1 = vorne (Gangkante) */
  reihe: number;
  /** 1 = links */
  spalte: number;
  /** erste oder letzte Reihe, erstes oder letztes Loch einer Reihe (8.1 Regel 9) */
  randloch: boolean;
  /** vorderste Reihe (8.1 Regel 9, R3.3) */
  gangkante: boolean;
}

export type Lochbildeingabe = { ok: true; reihen: number[] } | { ok: false; verstoesse: Verstoss[] };

const FELD = 'loecher_je_reihe';
const BEISPIEL = 'z. B. «2, 2, 2»';

/**
 * liest «Löcher je Reihe»: Zahlen getrennt durch Komma, Bindestrich oder Leerzeichen (Plan 19 A3);
 * jede Reihe 1 bis 20 Löcher, 1 bis 20 Reihen
 */
export function loecherJeReiheLesen(text: string): Lochbildeingabe {
  const roh = text.trim();
  if (roh === '')
    return { ok: false, verstoesse: [{ feld: FELD, grund: `Gib die Löcher je Reihe ein, ${BEISPIEL}` }] };
  // ein Komma oder Bindestrich trennt genau einmal; zwei hintereinander ergeben eine leere Reihe
  const teile = roh.split(/\s*[,-]\s*|\s+/);
  const verstoesse: Verstoss[] = [];
  if (teile.some((t) => t === ''))
    verstoesse.push({ feld: FELD, grund: `Jede Reihe braucht eine Zahl, ${BEISPIEL}` });
  else if (!teile.every((t) => /^\d+$/.test(t)))
    verstoesse.push({ feld: FELD, grund: `Nur ganze Zahlen von 1 bis ${MAX_LOECHER_JE_REIHE}, ${BEISPIEL}` });
  else {
    const reihen = teile.map(Number);
    if (reihen.some((n) => n < 1 || n > MAX_LOECHER_JE_REIHE))
      verstoesse.push({ feld: FELD, grund: `Jede Reihe hat 1 bis ${MAX_LOECHER_JE_REIHE} Löcher` });
    if (reihen.length > MAX_REIHEN)
      verstoesse.push({
        feld: FELD,
        grund: `Höchstens ${MAX_REIHEN} Reihen, eingegeben sind ${reihen.length}`,
      });
    if (verstoesse.length === 0) return { ok: true, reihen };
  }
  return { ok: false, verstoesse };
}

export function lochzahl(reihen: readonly number[]): number {
  return reihen.reduce((summe, n) => summe + n, 0);
}

/** alle Löcher in der Reihenfolge der Nummern: Spalte für Spalte, in jeder Spalte von vorne nach hinten */
export function lochbild(reihen: readonly number[]): Loch[] {
  const loecher: Loch[] = [];
  const breiteste = Math.max(0, ...reihen);
  for (let spalte = 1; spalte <= breiteste; spalte++) {
    reihen.forEach((anzahl, i) => {
      if (spalte > anzahl) return;
      const reihe = i + 1;
      loecher.push({
        nr: loecher.length + 1,
        reihe,
        spalte,
        randloch: reihe === 1 || reihe === reihen.length || spalte === 1 || spalte === anzahl,
        gangkante: reihe === 1,
      });
    });
  }
  return loecher;
}

export function randloecher(reihen: readonly number[]): number[] {
  return lochbild(reihen)
    .filter((l) => l.randloch)
    .map((l) => l.nr);
}

/** Anzeige wie die Eingabe, z. B. «2, 2, 2» */
export function lochbildText(reihen: readonly number[]): string {
  return reihen.join(', ');
}
