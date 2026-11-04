// Schema der Saattüte und Prüfung der KI-Antwort (Issue #14, Plan 14 Testliste; Konzept 11.3, UC4 Ablauf 2,
// UC4-AK1; 04_architektur.md 6). Reine Funktionen, keine Uhr, kein Netz.
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   src/domain/ki/schema.ts
//     KI_FELDER (= Enum ki_feld), TuetenFelder (12 Eigenschaften), TUETEN_SCHEMA (JSON-Schema, type object,
//     alle 12 Eigenschaften required und nullable, additionalProperties false), antwortPruefen(text), feldTexte(f)
//   Nullable heisst im Schema: type als Liste mit 'null' oder anyOf mit { type: 'null' }.
//   antwortPruefen nennt in verworfen die Namen der verworfenen Eigenschaften (fremde und ungültige).
import { describe, expect, it } from 'vitest';
import {
  KI_FELDER,
  TUETEN_SCHEMA,
  antwortPruefen,
  feldTexte,
  type TuetenFelder,
} from '../../src/domain/ki/schema.ts';
import { Constants } from '../../src/daten/datenbank.types.ts';

const EIGENSCHAFTEN = [
  'name',
  'art',
  'keimart',
  'keimtemperatur_min_c',
  'keimtemperatur_max_c',
  'keimdauer_min_d',
  'keimdauer_max_d',
  'kulturdauer_min_d',
  'kulturdauer_max_d',
  'aussaat_von_monat',
  'aussaat_bis_monat',
  'hersteller',
];

const GUELTIG: TuetenFelder = {
  name: 'Rote Probe',
  art: 'Lactuca sativa',
  keimart: 'licht',
  keimtemperatur_min_c: 15,
  keimtemperatur_max_c: 20,
  keimdauer_min_d: 7,
  keimdauer_max_d: 14,
  kulturdauer_min_d: 50,
  kulturdauer_max_d: 70,
  aussaat_von_monat: 3,
  aussaat_bis_monat: 8,
  hersteller: 'Beispiel Saaten',
};

const LEER: TuetenFelder = {
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
};

type Teil = { type?: unknown; anyOf?: unknown[]; enum?: unknown[] };

function erlaubtNull(p: unknown): boolean {
  const o = p as Teil;
  if (Array.isArray(o.type)) return o.type.includes('null');
  if (o.type === 'null') return true;
  if (Array.isArray(o.enum) && o.enum.includes(null)) return true;
  return Array.isArray(o.anyOf) && o.anyOf.some(erlaubtNull);
}

function enumWerte(p: unknown): unknown[] {
  const o = p as Teil;
  return [...(o.enum ?? []), ...(o.anyOf ?? []).flatMap(enumWerte)];
}

const schema = TUETEN_SCHEMA as {
  type?: unknown;
  properties?: Record<string, unknown>;
  required?: unknown;
  additionalProperties?: unknown;
};
const eigenschaften = () => Object.keys(schema.properties ?? {});

function geprueft(o: Record<string, unknown> | string) {
  const r = antwortPruefen(typeof o === 'string' ? o : JSON.stringify(o));
  if (!r.ok) throw new Error(`erwartet ok, erhalten ${r.grund}`);
  return r;
}

describe('UC4-AK1 Schema der Tüte', () => {
  it('UC4-AK1 Schema hat genau die zwölf Tütenfelder, alle nullable, additionalProperties false', () => {
    expect(schema.type).toBe('object');
    expect(eigenschaften().sort()).toEqual([...EIGENSCHAFTEN].sort());
    expect([...(schema.required as string[])].sort()).toEqual([...EIGENSCHAFTEN].sort());
    expect(schema.additionalProperties).toBe(false);
    for (const name of EIGENSCHAFTEN) {
      expect(erlaubtNull(schema.properties?.[name]), name).toBe(true);
    }
    const keimart = enumWerte(schema.properties?.['keimart']).filter((w) => w !== null);
    expect([...new Set(keimart)].sort()).toEqual(['dunkel', 'indifferent', 'licht']);
  });

  it('UC4-AK1 Schema kennt kein ph, ec oder phase', () => {
    for (const name of eigenschaften()) {
      expect(name).not.toMatch(/^(ph|ec|phase)(_|$)/);
    }
    expect(JSON.stringify(TUETEN_SCHEMA)).not.toMatch(/"(ph|ec|phase)"/);
  });
});

describe('UC4-AK1 Prüfung der Antwort', () => {
  it('UC4-AK1 gültige Antwort wird vollständig angenommen', () => {
    const r = geprueft({ ...GUELTIG });
    expect(r.felder).toEqual(GUELTIG);
    expect(r.verworfen).toEqual([]);
  });

  it('UC4-AK1 ph, ec und phase in der Antwort werden verworfen', () => {
    const r = geprueft({ ...GUELTIG, ph: 6.0, ec: 1.2, phase: 'wachstum' });
    expect(r.felder).toEqual(GUELTIG);
    expect(Object.keys(r.felder).sort()).toEqual([...EIGENSCHAFTEN].sort());
    expect([...r.verworfen].sort()).toEqual(['ec', 'ph', 'phase']);
  });

  it('UC4-AK1 keimart «hell» wird null und verworfen', () => {
    const r = geprueft({ ...GUELTIG, keimart: 'hell' });
    expect(r.felder).toEqual({ ...GUELTIG, keimart: null });
    expect(r.verworfen).toContain('keimart');
  });

  it('UC4-AK1 Keimtemperatur 60 °C wird null und verworfen', () => {
    const r = geprueft({ ...GUELTIG, keimtemperatur_max_c: 60 });
    expect(r.felder.keimtemperatur_max_c).toBeNull();
    expect(r.felder.keimtemperatur_min_c).toBe(15);
    expect(r.felder.name).toBe('Rote Probe');
    expect(r.verworfen).toContain('keimtemperatur_max_c');
  });

  it('UC4-AK1 min grösser max: beide null, verworfen', () => {
    const r = geprueft({ ...GUELTIG, keimdauer_min_d: 14, keimdauer_max_d: 7 });
    expect(r.felder.keimdauer_min_d).toBeNull();
    expect(r.felder.keimdauer_max_d).toBeNull();
    expect(r.felder.kulturdauer_min_d).toBe(50);
    expect(r.verworfen).toEqual(expect.arrayContaining(['keimdauer_min_d', 'keimdauer_max_d']));
  });

  it('UC4-AK1 Monat 13 wird null', () => {
    const r = geprueft({ ...GUELTIG, aussaat_bis_monat: 13 });
    expect(r.felder.aussaat_bis_monat).toBeNull();
    expect(r.felder.aussaat_von_monat).toBe(3);
    expect(r.verworfen).toContain('aussaat_bis_monat');
  });

  it('UC4-AK1 Typfehler (Zahl als Text) setzt nur dieses Feld auf null', () => {
    const r = geprueft({ ...GUELTIG, kulturdauer_max_d: 'siebzig' });
    expect(r.felder).toEqual({ ...GUELTIG, kulturdauer_max_d: null });
    expect(r.verworfen).toContain('kulturdauer_max_d');
  });

  it('04-6 kein JSON → kein_json, kein Objekt → kein_objekt', () => {
    expect(antwortPruefen('{"name": "Rote Probe", "art": "Lactuca sa')).toEqual({
      ok: false,
      grund: 'kein_json',
    });
    expect(antwortPruefen('Hier sind die Felder:')).toEqual({ ok: false, grund: 'kein_json' });
    expect(antwortPruefen('[1, 2]')).toEqual({ ok: false, grund: 'kein_objekt' });
    expect(antwortPruefen('null')).toEqual({ ok: false, grund: 'kein_objekt' });
    expect(antwortPruefen('"Rote Probe"')).toEqual({ ok: false, grund: 'kein_objekt' });
  });
});

describe('11.3 Abbildung auf ki_feld', () => {
  it('11.3 feldTexte: 18/22 → «18-22», 20/20 → «20», beide null → null; Aussaat 3/8 → «3-8»', () => {
    const t = feldTexte({
      ...GUELTIG,
      keimtemperatur_min_c: 18,
      keimtemperatur_max_c: 22,
      keimdauer_min_d: 7,
      keimdauer_max_d: 14,
      kulturdauer_min_d: 60,
      kulturdauer_max_d: 80,
    });
    expect(t).toEqual({
      name: 'Rote Probe',
      art: 'Lactuca sativa',
      keimart: 'licht',
      keimtemperatur: '18-22',
      keimdauer: '7-14',
      kulturdauer: '60-80',
      aussaatfenster: '3-8',
      hersteller: 'Beispiel Saaten',
    });
    expect(feldTexte({ ...LEER, keimtemperatur_min_c: 20, keimtemperatur_max_c: 20 }).keimtemperatur).toBe(
      '20',
    );
    expect(feldTexte(LEER)).toEqual({
      name: null,
      art: null,
      keimart: null,
      keimtemperatur: null,
      keimdauer: null,
      kulturdauer: null,
      aussaatfenster: null,
      hersteller: null,
    });
  });

  it('11.3 KI_FELDER entspricht dem Enum ki_feld', () => {
    expect([...KI_FELDER]).toEqual([...Constants.public.Enums.ki_feld]);
  });
});
