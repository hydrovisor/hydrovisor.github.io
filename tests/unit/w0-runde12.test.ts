// W250-AK1 [Unit] (Issue #250, W0 Runde 12; 03_import_w0.md Abschnitt 7, V1 bis V13): Der Validator über die echten
// Dateien in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; die 7 in Runde 12 freigegebenen Zeilen
// (data/wissensbasis/kandidaten/berichte/lead_entscheide_runde-12.md) stehen mit genau diesen Werten in
// freigegeben/art.csv; keine Zeile vom Stand vor Runde 12 (Commit c1fdb5c, Zeilenzahl und Prüfsumme als Konstante) ist geändert oder entfernt; Klasse-D-Lücken ohne Quelle erzeugen
// keine Zeile; Kulturdauer typisch ≤ max.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit bda995e), die Tests sind deshalb sofort grün (Plan 250 A2).
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { repository } from './w0-fixture.ts';
import { PFAD, tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

/**
 * Ausgangsstand der Runde 12: art.csv auf Commit c1fdb5c (origin/main am 19.11.2026, Konzept v1.9 #248).
 * Zeilenzahl und Prüfsumme einmalig am 19.11.2026 aus `git show c1fdb5c:data/wissensbasis/freigegeben/art.csv` mit
 * pruefsumme() unten berechnet; der Test braucht so keine Git-Historie (Job unit checkt flach aus). Alle 143 Zeilen
 * tragen dort freigegeben_am 2026-11-12 oder 2026-11-18 (vor der Runde 12 am 2026-11-19).
 */
const AUSGANGSSTAND = {
  commit: 'c1fdb5c',
  zeilen: 143,
  pruefsumme: 'c8babb89a1a29',
  runde12Datum: '2026-11-19',
} as const;

const RUNDE12: Record<string, string> = {
  'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d': '19',
  'ak.lactuca_sativa.babyleaf.ernte_ab_d': '21',
  'ak.lactuca_sativa.babyleaf.kulturdauer_max_d': '30',
  'ak.lactuca_sativa.kopf.kulturdauer_max_d': '45',
  'ak.lactuca_sativa.schnitt.ernte_ab_d': '23',
  'ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d': '18',
  'ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d': '28',
};

/** Runde 13 (#258) K-mangold-02: ersetzt die Runde-12-Zeile durch eine neue Fassung mit freigegeben_am 2026-11-21 */
const ERSETZT_RUNDE13: Record<string, string> = {
  'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d': '28',
};

/** Lücken aus Issue #250, die nach Runde 12 offen bleiben (Klasse D, keine geprüfte Quelle): keine Zeile */
// Runde 13 (#258) belegt Tomate dauerkultur_frucht ernteintervall_d, Mangold schnitt ernteintervall_d und Spinat
// babyleaf kulturdauer_max_d; diese drei Felder stehen deshalb nicht mehr in der Liste.
const KLASSE_D_OHNE_ZEILE: string[] = [
  'ak.solanum_lycopersicum.dauerkultur_frucht.schnitte_max',
  'ak.capsicum_annuum.dauerkultur_frucht.schnitte_max',
  'ak.capsicum_annuum.dauerkultur_frucht.kulturdauer_max_d',
  'ak.ocimum_basilicum.dauerkultur_blatt.schnitte_max',
  'ak.ocimum_basilicum.dauerkultur_blatt.kulturdauer_max_d',
  'ak.ocimum_basilicum.schnitt.schnitte_max',
  'ak.ocimum_basilicum.schnitt.kulturdauer_max_d',
  'ak.petroselinum_crispum.dauerkultur_blatt.schnitte_max',
  'ak.petroselinum_crispum.dauerkultur_blatt.kulturdauer_max_d',
  'ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d',
  'ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d',
  'ak.allium_schoenoprasum.dauerkultur_blatt.schnitte_max',
  'ak.allium_schoenoprasum.schnitt.ernte_ab_d',
  'ak.allium_schoenoprasum.schnitt.ernteintervall_d',
  'ak.allium_schoenoprasum.schnitt.schnitte_max',
  'ak.allium_schoenoprasum.schnitt.kulturdauer_max_d',
  'ak.spinacia_oleracea.schnitt.ernte_ab_d',
  'ak.spinacia_oleracea.schnitt.kulturdauer_max_d',
  'ak.spinacia_oleracea.kopf.kulturdauer_max_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernte_ab_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernteintervall_d',
  'ak.beta_vulgaris_conditiva.schnitt.schnitte_max',
  'ak.beta_vulgaris_conditiva.schnitt.kulturdauer_max_d',
  'ak.beta_vulgaris_cicla.schnitt.schnitte_max',
  'ak.beta_vulgaris_cicla.schnitt.kulturdauer_max_d',
];

/** Felder je Art und Kulturform aus den ak.*-Zeilen von art.csv */
function kulturformen(zeilen: Zeile[]): Map<string, Record<string, string>> {
  const m = new Map<string, Record<string, string>>();
  for (const z of zeilen) {
    const id = z['zeile_id'] ?? '';
    if (!id.startsWith('ak.')) continue;
    const schluessel = `${z['art_id'] ?? ''}.${z['kulturform'] ?? ''}`;
    const felder = m.get(schluessel) ?? {};
    felder[z['feld'] ?? ''] = z['wert'] ?? '';
    m.set(schluessel, felder);
  }
  return m;
}

/** cyrb53: einfache, deterministische 53-Bit-Prüfsumme als Hex (kein node:crypto in den Unit-Tests) */
function cyrb53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** Prüfsumme über die nach zeile_id sortierten Datenzeilen, je Zeile alle Spalten in Dateireihenfolge (null als '') */
function pruefsumme(spalten: string[], zeilen: Zeile[]): string {
  const sortiert = [...zeilen].sort((a, b) => {
    const x = a['zeile_id'] ?? '';
    const y = b['zeile_id'] ?? '';
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return cyrb53(sortiert.map((z) => JSON.stringify(spalten.map((sp) => z[sp] ?? ''))).join('\n'));
}

describe('W250-AK1 W0 Runde 12 in data/wissensbasis/freigegeben', () => {
  const d = repository();
  const art = tabelle(d, PFAD.art).zeilen;

  it('W250-AK1 Validator V1 bis V13 über die echten Dateien meldet keinen Verstoss', () => {
    expect(Object.keys(d)).toContain(PFAD.art);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });

  it('W250-AK1 die 7 Zeilen der Runde 12 stehen mit genau diesen Werten in art.csv', () => {
    expect(Object.keys(RUNDE12)).toHaveLength(7);
    for (const [zeileId, wert] of Object.entries(RUNDE12)) {
      const treffer = art.filter((z) => z['zeile_id'] === zeileId);
      expect(treffer, zeileId).toHaveLength(1);
      const [, artId, kulturform, feld] = zeileId.split('.');
      expect(treffer[0]?.['art_id'], zeileId).toBe(artId);
      expect(treffer[0]?.['kulturform'], zeileId).toBe(kulturform);
      expect(treffer[0]?.['feld'], zeileId).toBe(feld);
      // Runde 13 (#258) K-mangold-02: Mangold Schnitt ernte_ab_d gilt seit Runde 13 als 28
      expect(treffer[0]?.['wert'], zeileId).toBe(ERSETZT_RUNDE13[zeileId] ?? wert);
    }
  });

  it('W250-AK1 Basilikum und Petersilie Dauerkultur sowie Salat Schnitt sind mehrfach geerntet und haben ernte_ab_d', () => {
    const formen = kulturformen(art);
    for (const schluessel of [
      'ocimum_basilicum.dauerkultur_blatt',
      'petroselinum_crispum.dauerkultur_blatt',
      'lactuca_sativa.schnitt',
      'beta_vulgaris_cicla.schnitt',
    ]) {
      expect(formen.get(schluessel)?.['ernteart'], schluessel).toBe('mehrfach');
      expect(Number(formen.get(schluessel)?.['ernte_ab_d']), schluessel).toBeGreaterThan(0);
    }
  });

  it('W250-AK1 Zeilen mit freigegeben_am vor 2026-11-19 entsprechen dem Stand c1fdb5c (unverändert, keine entfernt), Runde 12 trägt 2026-11-19', () => {
    const spalten = tabelle(d, PFAD.art).spalten;
    // Teilmenge vor Runde 12: spätere Runden mit nur neuen Zeilen ändern sie nicht; eine korrigierte alte Zeile
    // trägt ein neues Datum, fällt heraus und macht den Test bewusst rot
    const vorRunde12 = art.filter((z) => (z['freigegeben_am'] ?? '') < AUSGANGSSTAND.runde12Datum);
    expect(vorRunde12).toHaveLength(AUSGANGSSTAND.zeilen);
    expect(pruefsumme(spalten, vorRunde12), `Stand ${AUSGANGSSTAND.commit}`).toBe(AUSGANGSSTAND.pruefsumme);
    for (const [zeileId, wert] of Object.entries(RUNDE12)) {
      // Runde 13 (#258) K-mangold-02: die ersetzte Fassung 19 vom 2026-11-19 steht nicht mehr in art.csv
      if (ERSETZT_RUNDE13[zeileId] !== undefined) continue;
      const z = art.find((x) => x['zeile_id'] === zeileId);
      expect(z?.['wert'], zeileId).toBe(wert);
      expect(z?.['freigegeben_am'], zeileId).toBe(AUSGANGSSTAND.runde12Datum);
    }
  });

  it('W250-AK1 Klasse-D-Lücken ohne Quelle erzeugen keine Zeile (z. B. Schnittlauch Schnitt ernte_ab_d)', () => {
    expect(KLASSE_D_OHNE_ZEILE).toContain('ak.allium_schoenoprasum.schnitt.ernte_ab_d');
    const ids = new Set(art.map((z) => z['zeile_id']));
    for (const id of KLASSE_D_OHNE_ZEILE) expect(ids.has(id), id).toBe(false);
  });

  it('W250-AK1 V11 Intervall und Schnitte nur bei mehrfach, Kulturdauer typisch ≤ max', () => {
    let verglichen = 0;
    for (const [schluessel, felder] of kulturformen(art)) {
      if (felder['ernteintervall_d'] !== undefined || felder['schnitte_max'] !== undefined)
        expect(felder['ernteart'], schluessel).toBe('mehrfach');
      const typ = felder['kulturdauer_typisch_d'];
      const max = felder['kulturdauer_max_d'];
      if (typ === undefined || max === undefined) continue;
      verglichen += 1;
      expect(Number(typ), schluessel).toBeLessThanOrEqual(Number(max));
    }
    // Salat Kopf (typ 35, max 45) ist seit Runde 12 verglichen
    expect(kulturformen(art).get('lactuca_sativa.kopf')?.['kulturdauer_max_d']).toBe('45');
    expect(verglichen).toBeGreaterThan(0);
  });
});
