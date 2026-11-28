// W13-AK1 [Unit] (Issue #258, W0 Runde 13; Plan docs/plaene/258.md, 03_import_w0.md Abschnitt 7, V1 bis V13): Der
// Validator über die echten Dateien in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; die 12 in Runde 13
// freigegebenen Zeilen (data/wissensbasis/kandidaten/berichte/lead_entscheide_runde-13.md) stehen mit genau diesen
// Werten und freigegeben_am 2026-11-21 in freigegeben/art.csv; keine Zeile vom Stand vor Runde 13 (Commit 3e31c0b,
// Zeilenzahl und Prüfsumme als Konstante) ist geändert oder entfernt; die verbleibenden Klasse-D-Lücken erzeugen
// keine Zeile; umsetzen_ab_d ≤ umsetzen_bis_d je Art; jede Quelle der neuen Zeilen steht in quelle.csv.
// Runde 1 des Prüfers (K-mangold-02, Konzept 9.3 Regel 1): Mangold Schnitt ernte_ab_d 28 ersetzt die Fassung 19 aus
// Runde 12; die alte Zeile ist aus art.csv entfernt (Korrektur als neue Zeile nach Konzept 9.4).
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit b0b8f4c), die Tests sind deshalb sofort grün.
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { repository } from './w0-fixture.ts';
import { csvLesen } from '../../src/domain/w0/csv.ts';
import { PFAD, tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

/**
 * Ausgangsstand der Runde 13: art.csv auf Commit 3e31c0b (main am 21.11.2026, Erntekalender #254) ohne die durch
 * K-mangold-02 ersetzte Zeile ak.beta_vulgaris_cicla.schnitt.ernte_ab_d (Wert 19, freigegeben_am 2026-11-19).
 * Zeilenzahl und Prüfsumme einmalig am 21.11.2026 aus `git show 3e31c0b:data/wissensbasis/freigegeben/art.csv` mit
 * pruefsumme() unten berechnet, nachdem diese eine Zeile entfernt war; der Test braucht so keine Git-Historie (Job unit
 * checkt flach aus). Alle 149 Zeilen
 * tragen dort freigegeben_am 2026-11-12, 2026-11-18 oder 2026-11-19 (vor der Runde 13 am 2026-11-21).
 */
const AUSGANGSSTAND = {
  commit: '3e31c0b',
  // #277: vorher 149 Zeilen und '18e0f3dfec0aa2' (mit den zwei korrigierten Zeilen)
  zeilen: 147,
  pruefsumme: '1b2d83682248a',
  runde13Datum: '2026-11-21',
} as const;

/**
 * #277 (W0-Korrekturen C und F, 28.11.2026): Die zwei Zeilen tragen seit der Korrektur neue Werte (56 bzw. 51) und
 * freigegeben_am 2026-11-28 und fallen aus der Teilmenge vor dieser Runde. Sie sind deshalb auch im Ausgangsstand
 * ausgenommen; Zeilenzahl und Prüfsumme am 28.11.2026 aus demselben Commit ohne diese zwei Zeilen neu berechnet
 * (Vorgehen wie bei K-mangold-02 in w0-runde13.test.ts). Ihren neuen Stand prüft tests/unit/w0-korrektur-1128.test.ts.
 */
const KORRIGIERT_277 = new Set([
  'ak.lactuca_sativa.schnitt.kulturdauer_max_d',
  'ak.valerianella_locusta.kopf.ernte_ab_d',
]);

interface NeueZeile {
  wert: string;
  quelleId: string;
}

const RUNDE13: Record<string, NeueZeile> = {
  // K-mangold-02: ersetzt die Fassung 19 aus Runde 12
  'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d': {
    wert: '28',
    quelleId: 'horticulturae-mangold-meerwasser-2022',
  },
  'ak.solanum_lycopersicum.dauerkultur_frucht.ernteintervall_d': {
    wert: '7',
    quelleId: 'jksus-tomate-salinitaet-hydroponik-2023',
  },
  'ak.beta_vulgaris_cicla.schnitt.ernteintervall_d': {
    wert: '14',
    quelleId: 'horticulturae-mangold-meerwasser-2022',
  },
  'ak.spinacia_oleracea.babyleaf.kulturdauer_max_d': {
    wert: '46',
    quelleId: 'agriculture-spinat-rauke-floating-2021',
  },
  'art.ocimum_basilicum.umsetzen_ab_d': { wert: '14', quelleId: 'plos-one-basilikum-saemlingsumgebung-2022' },
  'art.petroselinum_crispum.umsetzen_ab_d': {
    wert: '21',
    quelleId: 'horttech-34-saatdichte-petersilie-2024',
  },
  'art.petroselinum_crispum.umsetzen_bis_d': { wert: '35', quelleId: 'plos-one-dill-petersilie-2021' },
  'art.allium_schoenoprasum.umsetzen_ab_d': { wert: '28', quelleId: 'simplyhydro-schnittlauch' },
  'art.allium_schoenoprasum.umsetzen_bis_d': { wert: '42', quelleId: 'simplyhydro-schnittlauch' },
  'art.beta_vulgaris_cicla.umsetzen_ab_d': { wert: '21', quelleId: 'horticulturae-mangold-meerwasser-2022' },
  'art.beta_vulgaris_cicla.umsetzen_bis_d': { wert: '28', quelleId: 'hortsci-mangold-nft-2025' },
  'art.beta_vulgaris_conditiva.umsetzen_ab_d': { wert: '9', quelleId: 'hortbras-randen-babyleaf-nft-2014' },
};

/** Lücken nach Runde 13 (Tabelle «Verbleibende Lücken» in lead_entscheide_runde-13.md, Klasse D): keine Zeile */
const KLASSE_D_OHNE_ZEILE: string[] = [
  'ak.solanum_lycopersicum.dauerkultur_frucht.schnitte_max',
  'ak.capsicum_annuum.dauerkultur_frucht.schnitte_max',
  'ak.capsicum_annuum.dauerkultur_frucht.kulturdauer_max_d',
  'art.ocimum_basilicum.umsetzen_bis_d',
  'ak.ocimum_basilicum.dauerkultur_blatt.schnitte_max',
  'ak.ocimum_basilicum.dauerkultur_blatt.kulturdauer_max_d',
  'ak.ocimum_basilicum.schnitt.schnitte_max',
  'ak.ocimum_basilicum.schnitt.kulturdauer_max_d',
  'ak.petroselinum_crispum.dauerkultur_blatt.schnitte_max',
  'ak.petroselinum_crispum.dauerkultur_blatt.kulturdauer_max_d',
  'ak.allium_schoenoprasum.dauerkultur_blatt.schnitte_max',
  'ak.allium_schoenoprasum.schnitt.schnitte_max',
  'ak.allium_schoenoprasum.schnitt.kulturdauer_max_d',
  'ak.spinacia_oleracea.schnitt.kulturdauer_max_d',
  'ak.spinacia_oleracea.kopf.kulturdauer_max_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernte_ab_d',
  'ak.beta_vulgaris_conditiva.schnitt.ernteintervall_d',
  'ak.beta_vulgaris_conditiva.schnitt.schnitte_max',
  'ak.beta_vulgaris_conditiva.schnitt.kulturdauer_max_d',
  'ak.beta_vulgaris_cicla.schnitt.kulturdauer_max_d',
];

/** In Runde 12 wegen Verlagssperre verworfen, in Runde 13 über die Lesekopie neu geprüft (Abschnitt «Gesperrte Volltexte») */
const LESEKOPIE_NEU_GEPRUEFT: [string, string][] = [
  ['ak.beta_vulgaris_cicla.schnitt.ernte_ab_d', '28'],
  ['ak.beta_vulgaris_cicla.schnitt.ernteintervall_d', '14'],
  ['ak.spinacia_oleracea.schnitt.ernte_ab_d', '34'],
  ['ak.spinacia_oleracea.babyleaf.kulturdauer_max_d', '46'],
];

const KANDIDATEN_PFAD = 'data/wissensbasis/kandidaten/art.csv';
const KANDIDATEN_ROH = import.meta.glob<string>('/data/wissensbasis/kandidaten/art.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function kandidaten(): Zeile[] {
  const text = KANDIDATEN_ROH[`/${KANDIDATEN_PFAD}`];
  if (text === undefined) throw new Error(`${KANDIDATEN_PFAD} fehlt`);
  const t = csvLesen(KANDIDATEN_PFAD, text);
  if (Array.isArray(t)) throw new Error(`${KANDIDATEN_PFAD} nicht lesbar: ${JSON.stringify(t)}`);
  return (t as unknown as { zeilen: Zeile[] }).zeilen;
}

/** art_id, kulturform ('' bei art.*) und feld aus einer zeile_id der Form art.<art>.<feld> oder ak.<art>.<form>.<feld> */
function teile(zeileId: string): { artId: string; kulturform: string; feld: string } {
  const t = zeileId.split('.');
  if (t[0] === 'art') return { artId: t[1] ?? '', kulturform: '', feld: t[2] ?? '' };
  return { artId: t[1] ?? '', kulturform: t[2] ?? '', feld: t[3] ?? '' };
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

describe('W13-AK1 W0 Runde 13 in data/wissensbasis/freigegeben', () => {
  const d = repository();
  const art = tabelle(d, PFAD.art).zeilen;

  it('W13-AK1 Validator V1 bis V13 über die echten Dateien meldet keinen Verstoss', () => {
    expect(Object.keys(d)).toContain(PFAD.art);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });

  it('W13-AK1 die 12 Zeilen der Runde 13 stehen mit genau diesen Werten, Quellen und freigegeben_am 2026-11-21 in art.csv', () => {
    expect(Object.keys(RUNDE13)).toHaveLength(12);
    for (const [zeileId, { wert, quelleId }] of Object.entries(RUNDE13)) {
      const treffer = art.filter((z) => z['zeile_id'] === zeileId);
      expect(treffer, zeileId).toHaveLength(1);
      const { artId, kulturform, feld } = teile(zeileId);
      expect(treffer[0]?.['art_id'], zeileId).toBe(artId);
      expect(treffer[0]?.['kulturform'] ?? '', zeileId).toBe(kulturform);
      expect(treffer[0]?.['feld'], zeileId).toBe(feld);
      expect(treffer[0]?.['wert'], zeileId).toBe(wert);
      expect(treffer[0]?.['quelle_id'], zeileId).toBe(quelleId);
      expect(treffer[0]?.['freigegeben_am'], zeileId).toBe(AUSGANGSSTAND.runde13Datum);
    }
  });

  it('W13-AK1 genau die 12 Zeilen der Runde 13 tragen freigegeben_am 2026-11-21', () => {
    const neu = art
      .filter((z) => z['freigegeben_am'] === AUSGANGSSTAND.runde13Datum)
      .map((z) => z['zeile_id']);
    expect([...neu].sort()).toEqual(Object.keys(RUNDE13).sort());
  });

  it('W13-AK1 Zeilen mit freigegeben_am vor 2026-11-21 entsprechen dem Stand 3e31c0b (ohne die ersetzte Mangold-Zeile, sonst unverändert)', () => {
    const spalten = tabelle(d, PFAD.art).spalten;
    // Teilmenge vor Runde 13: spätere Runden mit nur neuen Zeilen ändern sie nicht; eine korrigierte alte Zeile
    // trägt ein neues Datum, fällt heraus und macht den Test bewusst rot
    // #277: die zwei korrigierten Zeilen sind ausgenommen (KORRIGIERT_277)
    const vorRunde13 = art.filter(
      (z) =>
        (z['freigegeben_am'] ?? '') < AUSGANGSSTAND.runde13Datum && !KORRIGIERT_277.has(z['zeile_id'] ?? ''),
    );
    expect(vorRunde13).toHaveLength(AUSGANGSSTAND.zeilen);
    expect(pruefsumme(spalten, vorRunde13), `Stand ${AUSGANGSSTAND.commit}`).toBe(AUSGANGSSTAND.pruefsumme);
  });

  it('W13-AK1 verbleibende Klasse-D-Lücken erzeugen keine Zeile (z. B. Basilikum umsetzen_bis_d, Regel D8)', () => {
    expect(KLASSE_D_OHNE_ZEILE).toContain('art.ocimum_basilicum.umsetzen_bis_d');
    const ids = new Set(art.map((z) => z['zeile_id']));
    for (const id of KLASSE_D_OHNE_ZEILE) {
      expect(ids.has(id), id).toBe(false);
      // auch keine Zeile mit abweichender zeile_id für dasselbe Feld
      const { artId, kulturform, feld } = teile(id);
      const gleichesFeld = art.filter(
        (z) => z['art_id'] === artId && (z['kulturform'] ?? '') === kulturform && z['feld'] === feld,
      );
      expect(gleichesFeld, id).toEqual([]);
    }
  });

  it('W13-AK1 umsetzen_ab_d ≤ umsetzen_bis_d je Art, wo beide gesetzt sind', () => {
    const fenster = new Map<string, { ab: number[]; bis: number[] }>();
    for (const z of art) {
      const feld = z['feld'];
      if (feld !== 'umsetzen_ab_d' && feld !== 'umsetzen_bis_d') continue;
      const artId = z['art_id'] ?? '';
      const f = fenster.get(artId) ?? { ab: [], bis: [] };
      (feld === 'umsetzen_ab_d' ? f.ab : f.bis).push(Number(z['wert']));
      fenster.set(artId, f);
    }
    let verglichen = 0;
    for (const [artId, { ab, bis }] of fenster) {
      if (ab.length === 0 || bis.length === 0) continue;
      verglichen += 1;
      expect(Math.max(...ab), artId).toBeLessThanOrEqual(Math.min(...bis));
    }
    // Petersilie (21/35), Schnittlauch (28/42) und Mangold (21/28) sind seit Runde 13 verglichen
    for (const artId of ['petroselinum_crispum', 'allium_schoenoprasum', 'beta_vulgaris_cicla'])
      expect(fenster.get(artId)?.bis.length, artId).toBeGreaterThan(0);
    expect(verglichen).toBeGreaterThanOrEqual(3);
  });

  it('W13-AK1 jede quelle_id der neuen Zeilen steht in freigegeben/quelle.csv', () => {
    const quellen = new Set(tabelle(d, PFAD.quelle).zeilen.map((z) => z['quelle_id']));
    for (const [zeileId, { quelleId }] of Object.entries(RUNDE13))
      expect(quellen.has(quelleId), zeileId).toBe(true);
  });

  it('W13-AK1 K-mangold-02: die ersetzte Fassung 19 von Mangold Schnitt ernte_ab_d steht nicht mehr in art.csv', () => {
    const mangold = art.filter(
      (z) =>
        z['art_id'] === 'beta_vulgaris_cicla' && z['kulturform'] === 'schnitt' && z['feld'] === 'ernte_ab_d',
    );
    expect(mangold.map((z) => [z['wert'], z['freigegeben_am']])).toEqual([
      ['28', AUSGANGSSTAND.runde13Datum],
    ]);
    expect(
      art.some((z) => z['zeile_id'] === 'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d' && z['wert'] === '19'),
    ).toBe(false);
  });

  it('W13-AK1 Befund 7: die Kandidaten der Runde 12 mit Verlagssperre sind über die Lesekopie neu geprüft und bestätigt', () => {
    const k = kandidaten();
    for (const [zeileId, wert] of LESEKOPIE_NEU_GEPRUEFT) {
      const neu = k.filter(
        (z) =>
          z['zeile_id'] === zeileId &&
          z['wert'] === wert &&
          (z['fundstelle'] ?? '').startsWith('Lesekopie 21.11.2026 (Artikelseite im Browser)'),
      );
      expect(neu, zeileId).toHaveLength(1);
      expect(neu[0]?.['quellenpruefung'], zeileId).toBe('bestaetigt');
      expect(neu[0]?.['abgerufen_am'], zeileId).toBe(AUSGANGSSTAND.runde13Datum);
    }
  });
});
