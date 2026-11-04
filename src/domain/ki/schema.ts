// Schema der Saattüte und Prüfung der KI-Antwort (Konzept 11.3, UC4 Ablauf 2, UC4-AK1; 04_architektur.md 6; Plan 14).
// Zwölf Eigenschaften, je Feld null statt «nicht gefunden»; kein pH, EC oder Phase (R1.3). Structured Outputs kennen
// keine Zahlengrenzen, deshalb prüft antwortPruefen die Bereiche selbst (A3).
export const KI_FELDER = [
  'name',
  'art',
  'keimart',
  'keimtemperatur',
  'keimdauer',
  'kulturdauer',
  'aussaatfenster',
  'hersteller',
] as const;
export type KiFeld = (typeof KI_FELDER)[number];

export type Keimart = 'licht' | 'dunkel' | 'indifferent';
const KEIMARTEN: readonly Keimart[] = ['licht', 'dunkel', 'indifferent'];

export interface TuetenFelder {
  name: string | null;
  art: string | null;
  keimart: Keimart | null;
  keimtemperatur_min_c: number | null;
  keimtemperatur_max_c: number | null;
  keimdauer_min_d: number | null;
  keimdauer_max_d: number | null;
  kulturdauer_min_d: number | null;
  kulturdauer_max_d: number | null;
  aussaat_von_monat: number | null;
  aussaat_bis_monat: number | null;
  hersteller: string | null;
}
type Eigenschaft = keyof TuetenFelder;

const TEXT = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const ZAHL = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const GANZ = { anyOf: [{ type: 'integer' }, { type: 'null' }] };

const EIGENSCHAFTEN: Record<Eigenschaft, Record<string, unknown>> = {
  name: { ...TEXT, description: 'Sortenname, wie gedruckt' },
  art: { ...TEXT, description: 'Art oder Gemüse, deutsch oder botanisch, wie gedruckt' },
  keimart: {
    anyOf: [{ type: 'string', enum: [...KEIMARTEN] }, { type: 'null' }],
    description: 'Lichtkeimer, Dunkelkeimer oder ohne Angabe zum Licht (indifferent)',
  },
  keimtemperatur_min_c: { ...ZAHL, description: 'Keimtemperatur unten in °C' },
  keimtemperatur_max_c: { ...ZAHL, description: 'Keimtemperatur oben in °C; Einzelwert = min' },
  keimdauer_min_d: { ...GANZ, description: 'Keimdauer unten in Tagen' },
  keimdauer_max_d: { ...GANZ, description: 'Keimdauer oben in Tagen; Einzelwert = min' },
  kulturdauer_min_d: { ...GANZ, description: 'Kulturdauer bis zur Ernte unten in Tagen' },
  kulturdauer_max_d: { ...GANZ, description: 'Kulturdauer oben in Tagen; Einzelwert = min' },
  aussaat_von_monat: { ...GANZ, description: 'erster Monat der Aussaat (1 bis 12)' },
  aussaat_bis_monat: { ...GANZ, description: 'letzter Monat der Aussaat (1 bis 12)' },
  hersteller: { ...TEXT, description: 'Hersteller oder Saatgutfirma, wie gedruckt' },
};
const NAMEN = Object.keys(EIGENSCHAFTEN) as Eigenschaft[];

export const TUETEN_SCHEMA: Readonly<Record<string, unknown>> = Object.freeze({
  type: 'object',
  properties: EIGENSCHAFTEN,
  required: NAMEN,
  additionalProperties: false,
});

export type Pruefung =
  | { ok: true; felder: TuetenFelder; verworfen: readonly string[] }
  | { ok: false; grund: 'kein_json' | 'kein_objekt' };

/** Bereiche je Zahlenfeld (A3) */
const BEREICH: Partial<Record<Eigenschaft, { min: number; max: number; ganz: boolean }>> = {
  keimtemperatur_min_c: { min: 0, max: 45, ganz: false },
  keimtemperatur_max_c: { min: 0, max: 45, ganz: false },
  keimdauer_min_d: { min: 1, max: 400, ganz: true },
  keimdauer_max_d: { min: 1, max: 400, ganz: true },
  kulturdauer_min_d: { min: 1, max: 400, ganz: true },
  kulturdauer_max_d: { min: 1, max: 400, ganz: true },
  aussaat_von_monat: { min: 1, max: 12, ganz: true },
  aussaat_bis_monat: { min: 1, max: 12, ganz: true },
};
const PAARE: readonly [Eigenschaft, Eigenschaft][] = [
  ['keimtemperatur_min_c', 'keimtemperatur_max_c'],
  ['keimdauer_min_d', 'keimdauer_max_d'],
  ['kulturdauer_min_d', 'kulturdauer_max_d'],
];

const leer = (): TuetenFelder => ({
  name: null,
  art: null,
  keimart: null,
  keimtemperatur_min_c: null,
  keimtemperatur_max_c: null,
  keimdauer_min_d: null,
  keimdauer_max_d: null,
  kulturdauer_min_d: null,
  kulturdauer_max_d: null,
  aussaat_von_monat: null,
  aussaat_bis_monat: null,
  hersteller: null,
});

/** Ein Wert des Felds oder undefined, wenn er nicht passt (dann null und verworfen) */
function wert(name: Eigenschaft, roh: unknown): string | number | null | undefined {
  if (roh === null || roh === undefined) return null;
  if (name === 'keimart') return KEIMARTEN.includes(roh as Keimart) ? (roh as Keimart) : undefined;
  const bereich = BEREICH[name];
  if (bereich) {
    if (typeof roh !== 'number' || !Number.isFinite(roh)) return undefined;
    if (bereich.ganz && !Number.isInteger(roh)) return undefined;
    return roh >= bereich.min && roh <= bereich.max ? roh : undefined;
  }
  if (typeof roh !== 'string') return undefined;
  const text = roh.trim();
  return text === '' ? null : text;
}

/** Antworttext prüfen: nur Schemafelder gelten, fremde und ungültige Felder werden verworfen (04-6, TK1) */
export function antwortPruefen(text: string): Pruefung {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, grund: 'kein_json' };
  }
  if (roh === null || typeof roh !== 'object' || Array.isArray(roh))
    return { ok: false, grund: 'kein_objekt' };
  const objekt = roh as Record<string, unknown>;
  const felder = leer();
  const verworfen: string[] = Object.keys(objekt).filter((k) => !(NAMEN as string[]).includes(k));
  const setzen = felder as unknown as Record<Eigenschaft, string | number | null>;
  for (const name of NAMEN) {
    const w = wert(name, objekt[name]);
    if (w === undefined) verworfen.push(name);
    else setzen[name] = w;
  }
  for (const [min, max] of PAARE) {
    const a = felder[min];
    const b = felder[max];
    if (a !== null && b !== null && (a as number) > (b as number)) {
      setzen[min] = null;
      setzen[max] = null;
      verworfen.push(min, max);
    }
  }
  return { ok: true, felder, verworfen };
}

function bereichText(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min === null || max === null || min === max) return String(min ?? max);
  return `${min}-${max}`;
}

/** Abbildung der zwölf Eigenschaften auf die acht Werte von ki_feld (Konzept 8.2): «18-22», min = max → «20» */
export function feldTexte(f: TuetenFelder): Record<KiFeld, string | null> {
  return {
    name: f.name,
    art: f.art,
    keimart: f.keimart,
    keimtemperatur: bereichText(f.keimtemperatur_min_c, f.keimtemperatur_max_c),
    keimdauer: bereichText(f.keimdauer_min_d, f.keimdauer_max_d),
    kulturdauer: bereichText(f.kulturdauer_min_d, f.kulturdauer_max_d),
    aussaatfenster: bereichText(f.aussaat_von_monat, f.aussaat_bis_monat),
    hersteller: f.hersteller,
  };
}
