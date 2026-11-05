// Etikettenbogen R9.1 / LabelSheet (Plan 22 Testliste): Masse gleich tokens.json, Startfeld, Überlauf, Feldkanten
// mit Druckversatz, Prüfung der Eingaben (A6). Rein, ohne Uhr.
//
// Vertrag für src/domain/etikett/bogen.ts (vom Testentwickler festgelegt, wo Plan 22 offen ist):
//
//   export const BOGEN: {
//     breiteMm: 210; hoeheMm: 297; spalten: 3; zeilen: 7;
//     feldBreiteMm: 70; feldHoeheMm: 42.3; randObenMm: 0.45; randLinksMm: 0;
//   }
//   export function bogenSeiten<T>(etiketten: readonly T[], startfeld: number): (T | null)[][]
//     // je Seite genau 21 Felder; Seite 1 beginnt mit startfeld − 1 leeren Feldern (null); Überlauf ab Feld 1
//     // der nächsten Seite; Restfelder der letzten Seite null
//   export function feldKante(index: number, versatz: { x: number; y: number }): { xMm: number; yMm: number }
//     // index 0 bis 20 (Feld 1 = Index 0), zeilenweise von links oben; linke obere Kante relativ zum
//     // Seitenursprung einschliesslich Versatz
//   export function druckEingabePruefen(e: { startfeld: number; versatzX: number; versatzY: number }): Verstoss[]
//     // startfeld ganzzahlig 1 bis 21; Versatz −5.0 bis +5.0 mm in Schritten von 0.1 mm; feld = Name der Eingabe
import { describe, expect, it } from 'vitest';
import tokensJson from '../../design-system/tokens.json?raw';
import { BOGEN, bogenSeiten, druckEingabePruefen, feldKante } from '../../src/domain/etikett/bogen.ts';

interface Token {
  name: string;
  value: string | number;
}
const druck = (JSON.parse(tokensJson) as { print: { tokens: Token[] } }).print.tokens;
const token = (name: string) => {
  const t = druck.find((x) => x.name === name);
  if (!t) throw new Error(`Token ${name} fehlt`);
  return typeof t.value === 'number' ? t.value : Number.parseFloat(t.value);
};

const etiketten = (n: number) => Array.from({ length: n }, (_, i) => `E${i + 1}`);

describe('R9.1 Bogen 3 × 7', () => {
  it('R9.1 Bogenmasse gleich tokens.json (label-width, label-height, sheet-margin-top, sheet-margin-left, sheet-columns, sheet-rows)', () => {
    expect(BOGEN.feldBreiteMm).toBe(token('label-width'));
    expect(BOGEN.feldHoeheMm).toBe(token('label-height'));
    expect(BOGEN.randObenMm).toBe(token('sheet-margin-top'));
    expect(BOGEN.randLinksMm).toBe(token('sheet-margin-left'));
    expect(BOGEN.spalten).toBe(token('sheet-columns'));
    expect(BOGEN.zeilen).toBe(token('sheet-rows'));
    expect(BOGEN.breiteMm).toBe(210);
    expect(BOGEN.hoeheMm).toBe(297);
    // 3 × 70 mm füllen die Breite, 7 × 42.3 mm plus Rand oben und unten die Höhe
    expect(BOGEN.spalten * BOGEN.feldBreiteMm + 2 * BOGEN.randLinksMm).toBeCloseTo(210, 6);
    expect(BOGEN.zeilen * BOGEN.feldHoeheMm + 2 * BOGEN.randObenMm).toBeCloseTo(297, 6);
  });

  it('R9.1 Startfeld 5: Felder 1 bis 4 leer, 18 Etiketten füllen Seite 1 und 1 Feld auf Seite 2', () => {
    const seiten = bogenSeiten(etiketten(18), 5);
    expect(seiten).toHaveLength(2);
    expect(seiten.map((s) => s.length)).toEqual([21, 21]);
    const [s1 = [], s2 = []] = seiten;
    expect(s1.slice(0, 4)).toEqual([null, null, null, null]);
    expect(s1.slice(4)).toEqual(etiketten(17));
    expect(s2[0]).toBe('E18');
    expect(s2.slice(1).every((f) => f === null)).toBe(true);
  });

  it('R9.1 Startfeld 1 mit 21 Etiketten: genau eine Seite', () => {
    const seiten = bogenSeiten(etiketten(21), 1);
    expect(seiten).toHaveLength(1);
    expect(seiten[0]).toEqual(etiketten(21));
    // 22 Etiketten: zweite Seite ab Feld 1
    const mehr = bogenSeiten(etiketten(22), 1);
    expect(mehr).toHaveLength(2);
    expect(mehr[1]?.[0]).toBe('E22');
    // Startfeld 21 mit einem Etikett: eine Seite, nur das letzte Feld belegt
    const letzte = bogenSeiten(etiketten(1), 21);
    expect(letzte).toHaveLength(1);
    expect(letzte[0]?.filter((f) => f !== null)).toEqual(['E1']);
    expect(letzte[0]?.[20]).toBe('E1');
  });

  it('R9.1 Feldkante Feld 21 bei Versatz 0.5/−0.3 mm', () => {
    const k = feldKante(20, { x: 0.5, y: -0.3 });
    expect(k.xMm).toBeCloseTo(2 * 70 + 0.5, 6);
    expect(k.yMm).toBeCloseTo(0.45 + 6 * 42.3 - 0.3, 6);
    const erste = feldKante(0, { x: 0, y: 0 });
    expect(erste.xMm).toBeCloseTo(0, 6);
    expect(erste.yMm).toBeCloseTo(0.45, 6);
    // Feld 5 (Index 4): Spalte 2, Zeile 2
    const f5 = feldKante(4, { x: 0, y: 0 });
    expect(f5.xMm).toBeCloseTo(70, 6);
    expect(f5.yMm).toBeCloseTo(0.45 + 42.3, 6);
  });

  it('R9.1 Startfeld 0, 22 und 2.5 abgelehnt; Versatz 5.1 abgelehnt, −5.0 erlaubt', () => {
    const ok = { startfeld: 1, versatzX: 0, versatzY: 0 };
    expect(druckEingabePruefen(ok)).toEqual([]);
    expect(druckEingabePruefen({ ...ok, startfeld: 21 })).toEqual([]);
    for (const startfeld of [0, 22, 2.5])
      expect(
        druckEingabePruefen({ ...ok, startfeld }).map((v) => v.feld),
        `Startfeld ${startfeld}`,
      ).toEqual(['startfeld']);
    expect(druckEingabePruefen({ ...ok, versatzX: 5.1 }).map((v) => v.feld)).toEqual(['versatzX']);
    expect(druckEingabePruefen({ ...ok, versatzY: -5.1 }).map((v) => v.feld)).toEqual(['versatzY']);
    expect(druckEingabePruefen({ ...ok, versatzX: -5.0, versatzY: 5.0 })).toEqual([]);
    expect(druckEingabePruefen({ ...ok, versatzX: 1.0, versatzY: -0.5 })).toEqual([]);
    // Schritte von 0.1 mm
    expect(druckEingabePruefen({ ...ok, versatzX: 0.25 }).map((v) => v.feld)).toEqual(['versatzX']);
    expect(druckEingabePruefen({ ...ok, versatzX: 0.3 })).toEqual([]);
  });
});
