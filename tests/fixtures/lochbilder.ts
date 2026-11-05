// Die sieben Deckel- und Plattentypen und die Zuordnung der 13 Gefässe (Plan 19 «Lochbilder der sieben Typen»;
// Konzept 5.3, 5.4; UC2; Erratum E2). Reihen von D1 bis D4 nach Annahme A1 des Plans, gleich wie Demo S1
// (tests/fixtures/demo/s1-regal.json). Gemeinsam für Unit und E2E; ohne Personendaten.

export interface Lochbildtyp {
  name: 'D1' | 'D2' | 'D4' | 'D3' | 'D6' | 'S8' | 'S5';
  topfdurchmesserCm: 5 | 8;
  topfdurchmesserMm: 50 | 80;
  /** Eingabe im Feld «Löcher je Reihe» (von vorne nach hinten) */
  eingabe: string;
  reihen: number[];
  /**
   * erwartete Lochnummern je Reihe, Reihe 1 = vorne (Gangkante), jeweils von links nach rechts; spaltenweise
   * nummeriert (Konzept v1.4 5.4, Erratum E9): Loch 1 vorne links, erst die linke Spalte von vorne nach hinten,
   * dann die nächste Spalte (Spalte = Stelle des Lochs in seiner Reihe von links)
   */
  nummern: number[][];
}

export const LOCHBILDER: readonly Lochbildtyp[] = [
  {
    name: 'D1',
    topfdurchmesserCm: 8,
    topfdurchmesserMm: 80,
    eingabe: '2, 2',
    reihen: [2, 2],
    nummern: [
      [1, 3],
      [2, 4],
    ],
  },
  {
    name: 'D2',
    topfdurchmesserCm: 8,
    topfdurchmesserMm: 80,
    eingabe: '3, 3',
    reihen: [3, 3],
    nummern: [
      [1, 3, 5],
      [2, 4, 6],
    ],
  },
  {
    name: 'D4',
    topfdurchmesserCm: 8,
    topfdurchmesserMm: 80,
    eingabe: '1, 1',
    reihen: [1, 1],
    nummern: [[1], [2]],
  },
  {
    name: 'D3',
    topfdurchmesserCm: 5,
    topfdurchmesserMm: 50,
    eingabe: '4, 4',
    reihen: [4, 4],
    nummern: [
      [1, 3, 5, 7],
      [2, 4, 6, 8],
    ],
  },
  {
    name: 'D6',
    topfdurchmesserCm: 5,
    topfdurchmesserMm: 50,
    eingabe: '2, 2, 2',
    reihen: [2, 2, 2],
    nummern: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  },
  {
    name: 'S8',
    topfdurchmesserCm: 8,
    topfdurchmesserMm: 80,
    eingabe: '4',
    reihen: [4],
    nummern: [[1, 2, 3, 4]],
  },
  {
    name: 'S5',
    topfdurchmesserCm: 5,
    topfdurchmesserMm: 50,
    eingabe: '1, 2, 1, 2, 1, 2, 1, 2, 1',
    reihen: [1, 2, 1, 2, 1, 2, 1, 2, 1],
    nummern: [[1], [2, 10], [3], [4, 11], [5], [6, 12], [7], [8, 13], [9]],
  },
];

/** die 13 Gefässe mit Ebene und Deckel- oder Plattentyp (Konzept 5.3, 5.4; UC2) */
export const GEFAESSE: readonly { kennung: string; ebene: 1 | 2 | 3 | 4; deckel: Lochbildtyp['name'] }[] = [
  { kennung: '1.1', ebene: 1, deckel: 'D1' },
  { kennung: '1.2', ebene: 1, deckel: 'D1' },
  { kennung: '2.1', ebene: 2, deckel: 'D2' },
  { kennung: '2.2', ebene: 2, deckel: 'D4' },
  { kennung: '2.3', ebene: 2, deckel: 'D2' },
  { kennung: '3.1', ebene: 3, deckel: 'D3' },
  { kennung: '3.2', ebene: 3, deckel: 'D6' },
  { kennung: '3.3', ebene: 3, deckel: 'D3' },
  { kennung: '4.1', ebene: 4, deckel: 'D6' },
  { kennung: '4.2', ebene: 4, deckel: 'S8' },
  { kennung: '4.3', ebene: 4, deckel: 'S8' },
  { kennung: '4.4', ebene: 4, deckel: 'S5' },
  { kennung: '4.5', ebene: 4, deckel: 'S5' },
];

export function lochbildtyp(name: Lochbildtyp['name']): Lochbildtyp {
  const typ = LOCHBILDER.find((t) => t.name === name);
  if (!typ) throw new Error(`Lochbildtyp ${name} fehlt`);
  return typ;
}
