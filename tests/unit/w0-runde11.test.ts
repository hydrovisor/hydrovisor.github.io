// W242-AK1 [Unit] (Issue #242, W0 Runde 11; 03_import_w0.md Abschnitt 7, V11): Der Validator über die echten Dateien
// in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; die 14 in Runde 11 freigegebenen Zeilen
// (data/wissensbasis/kandidaten/berichte/lead_entscheide_runde-11.md) stehen mit genau diesen Werten in
// freigegeben/art.csv; Intervall und Schnitte nur bei Ernteart mehrfach; Kulturdauer typisch ≤ max.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit bebad6f), die Tests sind deshalb sofort grün (A).
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { repository } from './w0-fixture.ts';
import { PFAD, tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

const RUNDE11: Record<string, string> = {
  'ak.allium_schoenoprasum.dauerkultur_blatt.kulturdauer_max_d': '730',
  'ak.brassica_rapa_chinensis.kopf.kulturdauer_max_d': '60',
  'ak.capsicum_annuum.dauerkultur_frucht.ernteintervall_d': '7',
  'ak.capsicum_annuum.dauerkultur_frucht.kulturdauer_max_d': '364',
  'ak.lactuca_sativa.schnitt.ernteintervall_d': '7',
  'ak.lactuca_sativa.schnitt.kulturdauer_max_d': '42',
  'ak.lactuca_sativa.schnitt.schnitte_max': '2',
  'ak.ocimum_basilicum.dauerkultur_blatt.ernteintervall_d': '21',
  'ak.ocimum_basilicum.schnitt.ernteintervall_d': '21',
  'ak.petroselinum_crispum.dauerkultur_blatt.ernteintervall_d': '7',
  'ak.solanum_lycopersicum.dauerkultur_frucht.kulturdauer_max_d': '364',
  'ak.spinacia_oleracea.schnitt.ernteintervall_d': '7',
  'ak.spinacia_oleracea.schnitt.schnitte_max': '3',
  'ak.valerianella_locusta.kopf.kulturdauer_max_d': '66',
};

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

describe('W242-AK1 W0 Runde 11 in data/wissensbasis/freigegeben', () => {
  const d = repository();
  const art = tabelle(d, PFAD.art).zeilen;

  it('W242-AK1 Validator V1 bis V13 über die echten Dateien meldet keinen Verstoss', () => {
    expect(Object.keys(d)).toContain(PFAD.art);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });

  it('W242-AK1 die 14 Zeilen der Runde 11 stehen mit genau diesen Werten in art.csv', () => {
    expect(Object.keys(RUNDE11)).toHaveLength(14);
    for (const [zeileId, wert] of Object.entries(RUNDE11)) {
      const treffer = art.filter((z) => z['zeile_id'] === zeileId);
      expect(treffer, zeileId).toHaveLength(1);
      const [, artId, kulturform, feld] = zeileId.split('.');
      expect(treffer[0]?.['art_id'], zeileId).toBe(artId);
      expect(treffer[0]?.['kulturform'], zeileId).toBe(kulturform);
      expect(treffer[0]?.['feld'], zeileId).toBe(feld);
      expect(treffer[0]?.['wert'], zeileId).toBe(wert);
    }
  });

  it('W242-AK1 V11 ernteintervall_d und schnitte_max nur bei Kulturformen mit Ernteart mehrfach', () => {
    const formen = kulturformen(art);
    let mitMehrfachwerten = 0;
    for (const [schluessel, felder] of formen) {
      if (felder['ernteintervall_d'] === undefined && felder['schnitte_max'] === undefined) continue;
      mitMehrfachwerten += 1;
      expect(felder['ernteart'], schluessel).toBe('mehrfach');
    }
    // Runde 11 allein liefert 6 Kulturformen mit Intervall oder Schnitten
    expect(mitMehrfachwerten).toBeGreaterThanOrEqual(6);
  });

  it('W242-AK1 je Kulturform kulturdauer_typisch_d ≤ kulturdauer_max_d, wo beide gesetzt sind', () => {
    let verglichen = 0;
    for (const [schluessel, felder] of kulturformen(art)) {
      const typ = felder['kulturdauer_typisch_d'];
      const max = felder['kulturdauer_max_d'];
      if (typ === undefined || max === undefined) continue;
      verglichen += 1;
      expect(Number(typ), schluessel).toBeLessThanOrEqual(Number(max));
    }
    expect(verglichen).toBeGreaterThan(0);
  });
});
