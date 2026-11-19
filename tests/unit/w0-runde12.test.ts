// W250-AK1 [Unit] (Issue #250, W0 Runde 12; 03_import_w0.md Abschnitt 7, V1 bis V13): Der Validator über die echten
// Dateien in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; die 7 in Runde 12 freigegebenen Zeilen
// (data/wissensbasis/kandidaten/berichte/lead_entscheide_runde-12.md) stehen mit genau diesen Werten in
// freigegeben/art.csv; keine Zeile von origin/main ist geändert oder entfernt; Klasse-D-Lücken ohne Quelle erzeugen
// keine Zeile; Kulturdauer typisch ≤ max.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit bda995e), die Tests sind deshalb sofort grün (Plan 250 A2).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { csvLesen } from '../../src/domain/w0/csv.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { repository } from './w0-fixture.ts';
import { PFAD, tabelle, type Tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

const WURZEL = fileURLToPath(new URL('../..', import.meta.url));

const RUNDE12: Record<string, string> = {
  'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d': '19',
  'ak.lactuca_sativa.babyleaf.ernte_ab_d': '9',
  'ak.lactuca_sativa.babyleaf.kulturdauer_max_d': '30',
  'ak.lactuca_sativa.kopf.kulturdauer_max_d': '45',
  'ak.lactuca_sativa.schnitt.ernte_ab_d': '23',
  'ak.ocimum_basilicum.dauerkultur_blatt.ernte_ab_d': '18',
  'ak.petroselinum_crispum.dauerkultur_blatt.ernte_ab_d': '28',
};

/** Lücken aus Issue #250, die nach Runde 12 offen bleiben (Klasse D, keine geprüfte Quelle): keine Zeile */
const KLASSE_D_OHNE_ZEILE: string[] = [
  'ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d',
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
  'ak.spinacia_oleracea.babyleaf.kulturdauer_max_d',
  'ak.spinacia_oleracea.kopf.kulturdauer_max_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernte_ab_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernteintervall_d',
  'ak.beta_vulgaris_conditiva.schnitt.schnitte_max',
  'ak.beta_vulgaris_conditiva.schnitt.kulturdauer_max_d',
  'ak.beta_vulgaris_cicla.schnitt.ernteintervall_d',
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

/** art.csv auf origin/main (Prüftor checkt mit fetch-depth 0 aus) */
function artAufMain(): Tabelle {
  const text = execFileSync('git', ['show', `origin/main:${PFAD.art}`], { cwd: WURZEL, encoding: 'utf8' });
  const t = csvLesen(PFAD.art, text);
  if (Array.isArray(t)) throw new Error(`art.csv auf origin/main nicht lesbar: ${JSON.stringify(t)}`);
  return t as unknown as Tabelle;
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
      expect(treffer[0]?.['wert'], zeileId).toBe(wert);
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

  it('W250-AK1 keine Zeile von origin/main ist geändert oder entfernt, nur neue Zeilen', () => {
    const vorher = artAufMain().zeilen;
    expect(vorher.length).toBeGreaterThan(0);
    const jetzt = new Map(art.map((z) => [z['zeile_id'] ?? '', z]));
    for (const alt of vorher) {
      const id = alt['zeile_id'] ?? '';
      expect(jetzt.has(id), id).toBe(true);
      expect(jetzt.get(id), id).toEqual(alt);
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
