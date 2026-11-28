// W14-AK1 [Unit] (Issue #266, W0 Runde 14; Plan docs/plaene/266.md, 03_import_w0.md Abschnitt 7, V1 bis V13): Der
// Validator über die echten Dateien in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; die 7 in Runde 14
// freigegebenen Zeilen (data/wissensbasis/kandidaten/berichte/lead_entscheide_runde-14.md) stehen mit genau diesen
// Werten und freigegeben_am 2026-11-22 in freigegeben/art.csv; keine Zeile vom Stand vor Runde 14 (Commit 7cee924,
// Zeilenzahl und Prüfsumme als Konstante) ist geändert oder entfernt; die verbleibenden Klasse-D-Lücken erzeugen
// keine Zeile; umsetzen_ab_d ≤ umsetzen_bis_d für Randen; jede Quelle der neuen Zeilen steht in quelle.csv.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit 55d94c8), die Tests sind deshalb sofort grün.
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { repository } from './w0-fixture.ts';
import { PFAD, tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

/**
 * Ausgangsstand der Runde 14: art.csv auf Commit 7cee924 (main am 22.11.2026, Konzept v1.11). Zeilenzahl und
 * Prüfsumme einmalig am 22.11.2026 aus `git show 7cee924:data/wissensbasis/freigegeben/art.csv` mit pruefsumme()
 * unten berechnet (dieselbe Funktion wie in w0-runde13.test.ts); der Test braucht so keine Git-Historie (Job unit
 * checkt flach aus). Alle 161 Zeilen tragen dort freigegeben_am 2026-11-12, 2026-11-18, 2026-11-19 oder 2026-11-21.
 */
const AUSGANGSSTAND = {
  commit: '7cee924',
  // #277: vorher 161 Zeilen und '3de47f35d802' (mit den zwei korrigierten Zeilen)
  zeilen: 159,
  pruefsumme: '1f8d8e3b6ea011',
  runde14Datum: '2026-11-22',
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

const RUNDE14: Record<string, NeueZeile> = {
  'ak.allium_schoenoprasum.dauerkultur_blatt.ernte_ab_d': {
    wert: '28',
    quelleId: 'agrowtronics-schnittlauch-2021',
  },
  'ak.allium_schoenoprasum.dauerkultur_blatt.ernteintervall_d': {
    wert: '14',
    quelleId: 'agrowtronics-schnittlauch-2021',
  },
  'ak.allium_schoenoprasum.schnitt.ernte_ab_d': { wert: '28', quelleId: 'agrowtronics-schnittlauch-2021' },
  'ak.allium_schoenoprasum.schnitt.ernteintervall_d': {
    wert: '14',
    quelleId: 'agrowtronics-schnittlauch-2021',
  },
  'ak.beta_vulgaris_cicla.schnitt.schnitte_max': { wert: '10', quelleId: 'risegardens-library-mangold' },
  'ak.spinacia_oleracea.schnitt.ernte_ab_d': { wert: '30', quelleId: 'smgardener-spinat-kratky-2022' },
  'art.beta_vulgaris_conditiva.umsetzen_bis_d': {
    wert: '25',
    quelleId: 'actasci-randen-mudas-floating-2005',
  },
};

/** Lücken nach Runde 14 (Tabelle «Verbleibende Lücken» in lead_entscheide_runde-14.md, Klasse D): keine Zeile */
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

describe('W14-AK1 W0 Runde 14 in data/wissensbasis/freigegeben', () => {
  const d = repository();
  const art = tabelle(d, PFAD.art).zeilen;

  it('W14-AK1 Validator V1 bis V13 über die echten Dateien meldet keinen Verstoss', () => {
    expect(Object.keys(d)).toContain(PFAD.art);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });

  it('W14-AK1 die 7 Zeilen der Runde 14 stehen mit genau diesen Werten, Quellen und freigegeben_am 2026-11-22 in art.csv', () => {
    expect(Object.keys(RUNDE14)).toHaveLength(7);
    for (const [zeileId, { wert, quelleId }] of Object.entries(RUNDE14)) {
      const treffer = art.filter((z) => z['zeile_id'] === zeileId);
      expect(treffer, zeileId).toHaveLength(1);
      const { artId, kulturform, feld } = teile(zeileId);
      expect(treffer[0]?.['art_id'], zeileId).toBe(artId);
      expect(treffer[0]?.['kulturform'] ?? '', zeileId).toBe(kulturform);
      expect(treffer[0]?.['feld'], zeileId).toBe(feld);
      expect(treffer[0]?.['wert'], zeileId).toBe(wert);
      expect(treffer[0]?.['quelle_id'], zeileId).toBe(quelleId);
      expect(treffer[0]?.['freigegeben_am'], zeileId).toBe(AUSGANGSSTAND.runde14Datum);
    }
  });

  it('W14-AK1 genau die 7 Zeilen der Runde 14 tragen freigegeben_am 2026-11-22', () => {
    const neu = art
      .filter((z) => z['freigegeben_am'] === AUSGANGSSTAND.runde14Datum)
      .map((z) => z['zeile_id']);
    expect([...neu].sort()).toEqual(Object.keys(RUNDE14).sort());
  });

  it('W14-AK1 Zeilen mit freigegeben_am vor 2026-11-22 entsprechen dem Stand 7cee924 (keine geändert oder entfernt)', () => {
    const spalten = tabelle(d, PFAD.art).spalten;
    // Teilmenge vor Runde 14: spätere Runden mit nur neuen Zeilen ändern sie nicht; eine korrigierte alte Zeile
    // trägt ein neues Datum, fällt heraus und macht den Test bewusst rot
    // #277: die zwei korrigierten Zeilen sind ausgenommen (KORRIGIERT_277)
    const vorRunde14 = art.filter(
      (z) =>
        (z['freigegeben_am'] ?? '') < AUSGANGSSTAND.runde14Datum && !KORRIGIERT_277.has(z['zeile_id'] ?? ''),
    );
    expect(vorRunde14).toHaveLength(AUSGANGSSTAND.zeilen);
    expect(pruefsumme(spalten, vorRunde14), `Stand ${AUSGANGSSTAND.commit}`).toBe(AUSGANGSSTAND.pruefsumme);
  });

  it('W14-AK1 verbleibende Klasse-D-Lücken erzeugen keine Zeile (z. B. Schnittlauch Schnitt kulturdauer_max_d)', () => {
    expect(KLASSE_D_OHNE_ZEILE).toContain('ak.allium_schoenoprasum.schnitt.kulturdauer_max_d');
    // keine Lücke ist zugleich eine Zeile der Runde 14
    for (const id of KLASSE_D_OHNE_ZEILE) expect(Object.keys(RUNDE14), id).not.toContain(id);
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

  it('W14-AK1 Randen: umsetzen_ab_d 9 ≤ umsetzen_bis_d 25', () => {
    const randen = (feld: string): number[] =>
      art
        .filter((z) => z['art_id'] === 'beta_vulgaris_conditiva' && z['feld'] === feld)
        .map((z) => Number(z['wert']));
    const ab = randen('umsetzen_ab_d');
    const bis = randen('umsetzen_bis_d');
    expect(ab).toEqual([9]);
    expect(bis).toEqual([25]);
    expect(Math.max(...ab)).toBeLessThanOrEqual(Math.min(...bis));
  });

  it('W14-AK1 jede quelle_id der neuen Zeilen steht in freigegeben/quelle.csv', () => {
    const quellen = new Set(tabelle(d, PFAD.quelle).zeilen.map((z) => z['quelle_id']));
    for (const [zeileId, { quelleId }] of Object.entries(RUNDE14))
      expect(quellen.has(quelleId), zeileId).toBe(true);
  });
});
