// W277-AK1 [Unit] (Issue #277, W0-Korrekturen C und F nach dem Belegungsplan-Abgleich vom 28.11.2026; Plan
// docs/plaene/277.md, Konzept v1.11 9.3 und 9.4, Entscheid 0029, 03_import_w0.md Abschnitt 7, V1 bis V13): Der
// Validator über die echten Dateien in data/ (wie npm run w0:pruefen) meldet keinen Verstoss; in freigegeben/art.csv
// stehen ak.lactuca_sativa.schnitt.kulturdauer_max_d = 56 (C, Tims Entscheid: 42 Tage ab Umsetzen + 14 Tage Plantag)
// und ak.valerianella_locusta.kopf.ernte_ab_d = 51 (F, Lead nach Entscheid 0018: 29 Tage ab Umsetzen + 22 Tage
// Anzucht) mit freigegeben_am 2026-11-28, Quelle, Kurzzitat und Evidenzklasse der alten Zeile und der Ableitung in
// fundstelle; Basilikum Schnitt ernte_ab_d bleibt 50 (Quellenprüfer 28.11.2026: «bestaetigt», ab Umsetzen); keine
// andere Zeile ist geändert (Stand main 049561c, Zeilenzahl und Prüfsumme als Konstante).
// Rot bis zum Datenschritt des Lead (scripts/w0/lead_entscheide_korrektur_1128.py): art.csv trägt noch 42 und 29.
import { describe, expect, it } from 'vitest';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { csvLesen } from '../../src/domain/w0/csv.ts';
import { repository } from './w0-fixture.ts';
import { PFAD, tabelle, type Zeile } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

const KORREKTUR_DATUM = '2026-11-28';

/**
 * Ausgangsstand: Dateien in data/wissensbasis/freigegeben auf Commit 049561c (main am 28.11.2026). Zeilenzahl und
 * Prüfsumme einmalig am 28.11.2026 aus `git show 049561c:data/wissensbasis/freigegeben/<datei>.csv` mit pruefsumme()
 * unten berechnet (dieselbe Funktion wie in w0-runde13.test.ts); bei art.csv ohne die zwei korrigierten Zeilen (168
 * Zeilen, davon 166 unverändert). Der Test braucht so keine Git-Historie (Job unit checkt flach aus).
 */
const AUSGANGSSTAND = {
  commit: '049561c',
  art: { zeilen: 166, pruefsumme: '1b3446426690c8' },
  andere: {
    [PFAD.profilwert]: { zeilen: 381, pruefsumme: 'd01ba457792f8' },
    [PFAD.quelle]: { zeilen: 113, pruefsumme: 'b968398b3933e' },
    [PFAD.kulturgruppe]: { zeilen: 6, pruefsumme: '136f279f3faf77' },
    [PFAD.saatempfehlung]: { zeilen: 17, pruefsumme: '744523c0c062e' },
  } as Record<string, { zeilen: number; pruefsumme: string }>,
} as const;

interface Korrektur {
  alt: string;
  neu: string;
  /** Ableitung in fundstelle: alt + Tage bis Umsetzen = neu (Tage ab Saat) */
  ableitung: RegExp;
  quelleId: string;
  /** Anfang der Fundstelle der alten Zeile (Abschnitt der Quelle) */
  fundstelleAlt: string;
  kurzzitat: string;
  evidenzklasse: string;
}

const KORREKTUREN: Record<string, Korrektur> = {
  // C (Tims Entscheid): Standzeit 42 Tage ab Umsetzen, Plantag 14 Tage nach der Saat (Konzept 14.1)
  'ak.lactuca_sativa.schnitt.kulturdauer_max_d': {
    alt: '42',
    neu: '56',
    ableitung: /42\b[^=]*\+[^=]*\b14\b[^=]*=\s*56\b/,
    quelleId: 'jas-lettuce-cut-and-come-again-2017',
    fundstelleAlt: 'S. 72, Abschnitt 4 Discussion',
    kurzzitat: 'total of two first harvest 406.7 g/tray for a six week growing period',
    evidenzklasse: 'A',
  },
  // F (Lead nach Entscheid 0018, Plan 277 A2): 29 Tage ab Umsetzen nach 22 Tagen Anzucht, Direktsaat in der Anlage
  'ak.valerianella_locusta.kopf.ernte_ab_d': {
    alt: '29',
    neu: '51',
    ableitung: /29\b[^=]*\+[^=]*\b22\b[^=]*=\s*51\b/,
    quelleId: 'plants-valerianella-salinity-2023',
    fundstelleAlt: 'Abschnitt 4.3',
    kurzzitat: 'the commercial stage (29 days after transplanting, 5 November)',
    evidenzklasse: 'A',
  },
};

const BASILIKUM = 'ak.ocimum_basilicum.schnitt.ernte_ab_d';

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

/** Felder je Art und Kulturform aus den ak.*-Zeilen von art.csv */
function kulturform(art: Zeile[], artId: string, form: string): Record<string, string> {
  const felder: Record<string, string> = {};
  for (const z of art)
    if (z['art_id'] === artId && z['kulturform'] === form) felder[z['feld'] ?? ''] = z['wert'] ?? '';
  return felder;
}

describe('W277-AK1 W0-Korrekturen C und F in data/wissensbasis/freigegeben', () => {
  const d = repository();
  const art = tabelle(d, PFAD.art).zeilen;

  it('W277-AK1 Validator V1 bis V13 über die echten Dateien meldet keinen Verstoss', () => {
    expect(Object.keys(d)).toContain(PFAD.art);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });

  it('W277-AK1 C: Schnittsalat kulturdauer_max_d 56 (statt 42) mit freigegeben_am 2026-11-28 und der Quelle der alten Zeile', () => {
    const id = 'ak.lactuca_sativa.schnitt.kulturdauer_max_d';
    const k = KORREKTUREN[id];
    const treffer = art.filter((z) => z['zeile_id'] === id);
    expect(treffer, id).toHaveLength(1);
    expect(treffer[0]?.['wert'], id).toBe(k?.neu);
    expect(treffer[0]?.['freigegeben_am'], id).toBe(KORREKTUR_DATUM);
    expect(treffer[0]?.['quelle_id'], id).toBe(k?.quelleId);
  });

  it('W277-AK1 F: Nüsslisalat Kopf ernte_ab_d 51 (statt 29) mit freigegeben_am 2026-11-28 und der Quelle der alten Zeile', () => {
    const id = 'ak.valerianella_locusta.kopf.ernte_ab_d';
    const k = KORREKTUREN[id];
    const treffer = art.filter((z) => z['zeile_id'] === id);
    expect(treffer, id).toHaveLength(1);
    expect(treffer[0]?.['wert'], id).toBe(k?.neu);
    expect(treffer[0]?.['freigegeben_am'], id).toBe(KORREKTUR_DATUM);
    expect(treffer[0]?.['quelle_id'], id).toBe(k?.quelleId);
  });

  it('W277-AK1 Korrekturzeilen: Art, Kulturform, Feld, Kurzzitat und Evidenzklasse der alten Zeile, fundstelle mit Ableitung', () => {
    for (const [id, k] of Object.entries(KORREKTUREN)) {
      const z = art.find((x) => x['zeile_id'] === id);
      expect(z, id).toBeDefined();
      const [, artId, form, feld] = id.split('.');
      expect(z?.['art_id'], id).toBe(artId);
      expect(z?.['kulturform'], id).toBe(form);
      expect(z?.['feld'], id).toBe(feld);
      expect(z?.['kurzzitat'], id).toBe(k.kurzzitat);
      expect(z?.['evidenzklasse'], id).toBe(k.evidenzklasse);
      const fundstelle = z?.['fundstelle'] ?? '';
      expect(fundstelle, id).toContain(k.fundstelleAlt);
      expect(fundstelle, id).toContain('Ableitung');
      expect(fundstelle, `${id}: ${k.alt} + Tage bis Umsetzen = ${k.neu}`).toMatch(k.ableitung);
    }
  });

  it('W277-AK1 Basilikum Schnitt ernte_ab_d bleibt 50 mit freigegeben_am 2026-11-12 (Nachkontrolle bestätigt)', () => {
    const treffer = art.filter((z) => z['zeile_id'] === BASILIKUM);
    expect(treffer).toHaveLength(1);
    expect(treffer[0]?.['wert']).toBe('50');
    expect(treffer[0]?.['freigegeben_am']).toBe('2026-11-12');
    expect(treffer[0]?.['quelle_id']).toBe('adv-hort-sci-27-basilikum-nft-2013');
  });

  it('W277-AK1 genau die zwei Korrekturzeilen tragen freigegeben_am 2026-11-28', () => {
    const neu = art.filter((z) => z['freigegeben_am'] === KORREKTUR_DATUM).map((z) => z['zeile_id']);
    expect([...neu].sort()).toEqual(Object.keys(KORREKTUREN).sort());
  });

  it('W277-AK1 alle übrigen Zeilen von art.csv entsprechen dem Stand 049561c (keine geändert, entfernt oder neu)', () => {
    const spalten = tabelle(d, PFAD.art).spalten;
    const uebrige = art.filter((z) => KORREKTUREN[z['zeile_id'] ?? ''] === undefined);
    expect(uebrige).toHaveLength(AUSGANGSSTAND.art.zeilen);
    expect(pruefsumme(spalten, uebrige), `Stand ${AUSGANGSSTAND.commit}`).toBe(AUSGANGSSTAND.art.pruefsumme);
  });

  it('W277-AK1 profilwert.csv, quelle.csv, kulturgruppe.csv und saatempfehlung.csv sind unverändert gegenüber 049561c', () => {
    for (const [pfad, stand] of Object.entries(AUSGANGSSTAND.andere)) {
      const t = tabelle(d, pfad);
      expect(t.zeilen, pfad).toHaveLength(stand.zeilen);
      expect(pruefsumme(t.spalten, t.zeilen), `${pfad} Stand ${AUSGANGSSTAND.commit}`).toBe(stand.pruefsumme);
    }
  });

  it('W277-AK1 jede quelle_id der Korrekturzeilen steht in freigegeben/quelle.csv', () => {
    const quellen = new Set(tabelle(d, PFAD.quelle).zeilen.map((z) => z['quelle_id']));
    for (const [id, { quelleId }] of Object.entries(KORREKTUREN))
      expect(quellen.has(quelleId), id).toBe(true);
  });

  it('W277-AK1 Schnittsalat: V11 (Intervall und Schnitte nur bei mehrfach) und ernte_ab_d 23 < kulturdauer_max_d 56', () => {
    const f = kulturform(art, 'lactuca_sativa', 'schnitt');
    expect(f['ernteart']).toBe('mehrfach');
    expect(f['ernteintervall_d']).toBe('7');
    expect(f['schnitte_max']).toBe('2');
    expect(f['kulturdauer_max_d']).toBe('56');
    expect(Number(f['ernte_ab_d'])).toBeLessThan(Number(f['kulturdauer_max_d']));
    if (f['kulturdauer_typisch_d'] !== undefined)
      expect(Number(f['kulturdauer_typisch_d'])).toBeLessThanOrEqual(Number(f['kulturdauer_max_d']));
  });

  it('W277-AK1 Nüsslisalat Kopf: einmalig ohne Intervall und Schnitte (V11), typisch 51 ≤ max 66, ernte_ab_d 51 < max 66', () => {
    const f = kulturform(art, 'valerianella_locusta', 'kopf');
    expect(f['ernteart']).toBe('einmalig');
    expect(f['ernteintervall_d']).toBeUndefined();
    expect(f['schnitte_max']).toBeUndefined();
    expect(f['ernte_ab_d']).toBe('51');
    expect(f['kulturdauer_typisch_d']).toBe('51');
    expect(f['kulturdauer_max_d']).toBe('66');
    expect(Number(f['kulturdauer_typisch_d'])).toBeLessThanOrEqual(Number(f['kulturdauer_max_d']));
    expect(Number(f['ernte_ab_d'])).toBeLessThan(Number(f['kulturdauer_max_d']));
  });

  it('W277-AK1 Kandidaten: #3 ist mit dem neuen Wert freigegeben (2026-11-28), die alte Fassung #2 ist verworfen', () => {
    const k = kandidaten();
    for (const [id, { neu, alt, quelleId }] of Object.entries(KORREKTUREN)) {
      const neuK = k.filter((z) => z['kandidat_id'] === `${id}#3`);
      expect(neuK, `${id}#3`).toHaveLength(1);
      expect(neuK[0]?.['zeile_id'], `${id}#3`).toBe(id);
      expect(neuK[0]?.['wert'], `${id}#3`).toBe(neu);
      expect(neuK[0]?.['quelle_id'], `${id}#3`).toBe(quelleId);
      expect(neuK[0]?.['status'], `${id}#3`).toBe('freigegeben');
      expect(neuK[0]?.['freigegeben_am'], `${id}#3`).toBe(KORREKTUR_DATUM);
      const altK = k.filter((z) => z['kandidat_id'] === `${id}#2`);
      expect(altK, `${id}#2`).toHaveLength(1);
      expect(altK[0]?.['wert'], `${id}#2`).toBe(alt);
      expect(altK[0]?.['status'], `${id}#2`).toBe('verworfen');
      // genau ein freigegebener Kandidat je zeile_id
      expect(
        k.filter((z) => z['zeile_id'] === id && z['status'] === 'freigegeben').map((z) => z['kandidat_id']),
        id,
      ).toEqual([`${id}#3`]);
    }
  });
});
