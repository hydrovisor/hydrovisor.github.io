// Zahlen des Düngerrechners (UC7; Konzept R4.11, G3, G4; Plan 28): exakte Brüche aus Ganzzahlen, Rundung der Mengen,
// Messmittel, Rundungsabweichung und Texte. Rein. Ein Bruch trägt die Einheit der zugehörigen Ganzzahl: Mengen in
// Zehnteln ml, EC in Hundertsteln mS/cm, Dosis in Hundertsteln ml/L, k in Tausendsteln, Volumen in Hundertsteln l.
// Gerechnet wird exakt; gerundet wird genau einmal am Ende (A3), sonst kippen die halben Schritte (RF8, RF10, RF11).
import type { Komponente } from './einstellungen/einstellungen.ts';

export interface Bruch {
  readonly z: number;
  readonly n: number;
}

function ggt(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x || 1;
}

export function bruch(zaehler: number, nenner = 1): Bruch {
  if (!Number.isInteger(zaehler) || !Number.isInteger(nenner) || nenner === 0)
    throw new Error(`Bruch braucht Ganzzahlen: ${zaehler}/${nenner}`);
  const v = nenner < 0 ? -1 : 1;
  const t = ggt(zaehler, nenner);
  return { z: (v * zaehler) / t, n: (v * nenner) / t };
}

const B = (x: Bruch | number): Bruch => (typeof x === 'number' ? bruch(x) : x);

export const plus = (a: Bruch | number, b: Bruch | number): Bruch => {
  const x = B(a);
  const y = B(b);
  return bruch(x.z * y.n + y.z * x.n, x.n * y.n);
};
export const minus = (a: Bruch | number, b: Bruch | number): Bruch => {
  const y = B(b);
  return plus(a, { z: -y.z, n: y.n });
};
export const mal = (a: Bruch | number, b: Bruch | number): Bruch => {
  const x = B(a);
  const y = B(b);
  // kreuzweise kürzen, damit die Zahlen klein bleiben
  const g1 = ggt(x.z, y.n);
  const g2 = ggt(y.z, x.n);
  return bruch((x.z / g1) * (y.z / g2), (x.n / g2) * (y.n / g1));
};
export const durch = (a: Bruch | number, b: Bruch | number): Bruch => {
  const y = B(b);
  if (y.z === 0) throw new Error('Division durch 0');
  return mal(a, bruch(y.n, y.z));
};
/** −1, 0 oder 1 */
export const vergleich = (a: Bruch | number, b: Bruch | number): number => Math.sign(minus(a, b).z);
export const summe = (werte: readonly (Bruch | number)[]): Bruch =>
  werte.reduce<Bruch>((s, w) => plus(s, w), bruch(0));
export const min = (a: Bruch, b: Bruch): Bruch => (vergleich(a, b) <= 0 ? a : b);
export const max = (a: Bruch, b: Bruch): Bruch => (vergleich(a, b) >= 0 ? a : b);

export function alsZahl(b: Bruch): number {
  return b.z / b.n;
}

/** Kaufmännisch nach Betrag: halbe Schritte vom Nullpunkt weg (R4.11, R10.1) */
export function runde(b: Bruch | number): number {
  const x = B(b);
  const betrag = Math.abs(x.z);
  const ganz = Math.floor((2 * betrag + x.n) / (2 * x.n));
  return Math.sign(x.z) * ganz;
}

/**
 * Menge in Zehnteln ml nach R4.11: roh unter 5 ml auf 0.1 ml, sonst auf 0.5 ml, kaufmännisch; die Schwelle gilt für den
 * ungerundeten Wert (G4). Roh > 0 ergibt mindestens 0.1 ml (R4.4 «keine Komponente auf 0», A4).
 */
export function rundeMenge(roh: Bruch): number {
  if (roh.z <= 0) return 0;
  const zehntel = vergleich(roh, 50) < 0 ? runde(roh) : 5 * runde(durch(roh, 5));
  return Math.max(1, zehntel);
}

export type Mengen = Readonly<Record<Komponente, number>>;
export type MengenBruch = Readonly<Record<Komponente, Bruch>>;
export type KSatz = Readonly<Record<Komponente, number>>;

export interface Messmittel {
  spritzeMl: number | null;
  aufzuege: number;
  text: string;
}

export const SPRITZEN_STANDARD: readonly number[] = [1, 5, 20, 60];
const AUFZUEGE_MAX = 3;

/** Kleinste Spritze, die die Menge in einem Aufzug fasst; sonst die grösste mit bis zu 3 Aufzügen; sonst Messbecher */
export function messmittel(zehntelMl: number, spritzen: readonly number[] = SPRITZEN_STANDARD): Messmittel {
  const liste = [...spritzen].filter((s) => s > 0).sort((a, b) => a - b);
  const ml = mlText(zehntelMl);
  const passend = liste.find((s) => zehntelMl <= s * 10);
  if (passend !== undefined) return { spritzeMl: passend, aufzuege: 1, text: `${ml}, ${passend}-ml-Spritze` };
  const groesste = liste[liste.length - 1];
  if (groesste !== undefined) {
    const aufzuege = Math.ceil(zehntelMl / (groesste * 10));
    if (aufzuege <= AUFZUEGE_MAX)
      return { spritzeMl: groesste, aufzuege, text: `${ml}, ${aufzuege} × ${groesste}-ml-Spritze` };
    return { spritzeMl: null, aufzuege, text: `${ml}, Messbecher` };
  }
  return { spritzeMl: null, aufzuege: 1, text: `${ml}, Messbecher` };
}

/**
 * Abweichung der EC durch die Rundung in Hundertsteln: Σ k_i · (gerundet_i − roh_i) / V. Mengen in Zehnteln ml,
 * k in Tausendsteln, V in Hundertsteln l: (k / 1000) · (Δ / 10 ml) / (V / 100 l) mS/cm = k · Δ / (100 · V) mS/cm.
 */
export function rundungsabweichungEc(roh: MengenBruch, gerundet: Mengen, k: KSatz, volumen: number): number {
  const teile = (Object.keys(roh) as Komponente[]).map((c) => mal(k[c], minus(gerundet[c], roh[c])));
  return runde(durch(summe(teile), volumen));
}

export function mlText(zehntel: number): string {
  return `${(zehntel / 10).toFixed(1)} ml`;
}

export function literText(zehntel: number): string {
  return `${(zehntel / 10).toFixed(1)} l`;
}

/** «1.20 mS/cm»; mit Vorzeichen «+0.01 mS/cm» oder «−0.01 mS/cm» (U+2212 wie Konzept R4.11) */
export function ecText(hundertstel: number, optionen: { vorzeichen?: boolean } = {}): string {
  const betrag = (Math.abs(hundertstel) / 100).toFixed(2);
  const zeichen = hundertstel < 0 ? '−' : optionen.vorzeichen && hundertstel > 0 ? '+' : '';
  return `${zeichen}${betrag} mS/cm`;
}
