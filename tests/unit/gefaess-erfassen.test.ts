// Assistent «Gefäss erfassen» (Plan 21 Testliste; UC3-AK2, UC3-AK9, TO2). Injizierte Uhr 2026-12-10T08:00:00Z,
// Zeitzone Europe/Zurich, Teile des Bündels aus tests/fixtures/regal.ts; Sichten nachgerechnet mit
// tests/fixtures/sichten.ts.
//
// Vertrag für src/domain/anlage/erfassen.ts (vom Testentwickler festgelegt, wo Plan 21 offen ist):
//
//   export interface Intervalle { messenD: number; nachfuellenD: number | null; wechselnD: number | null }
//   export const INTERVALLE: Readonly<Record<Betriebsart, Intervalle>>   // Betriebsart aus ./anlegen.ts
//   export function positionen(bereichNummer: number): number[]          // 1: [1,2]; 2,3: [1..3]; 4: [1..5]; sonst [1..9]
//   export interface Topf { kennung: string; lochNr: number; groesseMm: number }
//   export function toepfe(kennung: string,
//     deckeltyp: { topfdurchmesser_mm: number; loecher_je_reihe: readonly number[] }, festeDosis: boolean): Topf[]
//   export type Rolle = 'gefaess' | 'anzuchtort' | 'messstelle'
//   export type ErfassenEingabe =
//     | { rolle: 'gefaess'; anlageId: string; bereichId: string; position: number; betriebsart: Betriebsart;
//         festeDosis: boolean; luftpumpe: 'P1' | 'P2' | 'P3' | 'P4' | null; gefaessmodellId: string;
//         betriebsvolumenL: number; deckeltypId: string; intervalle: Intervalle }
//     | { rolle: 'anzuchtort'; anlageId: string; bereichId: string | null; kennung: string;
//         typ: 'box_licht' | 'box_dunkel'; position: 'vorne' | 'hinten'; platzzahl: number }
//     | { rolle: 'messstelle'; anlageId: string }
//   export interface ErfassenVorschlag {
//     kennung?: string; code?: string;                       // '2.3', 'R-2.3'; ohne freie Position undefined
//     position?: number | 'vorne' | 'hinten';                // Gefäss: nächste freie Position; Box: vorne/hinten
//     betriebsart?: Betriebsart; intervalle?: Intervalle; betriebsvolumenL?: number;
//     typ?: 'box_licht' | 'box_dunkel'; platzzahl?: number; bereichId?: string | null;
//     toepfe: Topf[];                                        // leer ohne Deckel
//     hinweise: string[];                                    // z. B. «Tasche mit dem Etikett auf die neue Box umstecken»
//   }
//   export function erfassenVorschlag(teile: Teile, anlageId: string, teil: { rolle: Rolle; bereichId?: string;
//     position?: number; betriebsart?: Betriebsart; gefaessmodellId?: string; deckeltypId?: string;
//     festeDosis?: boolean }): ErfassenVorschlag
//   export function erfassenPruefen(teile: Teile, eingabe: ErfassenEingabe): Verstoss[]
//     // Verstoss aus ../datenpfad/erfassung.ts; feld: 'kennung' | 'betriebsvolumen' | 'topfgroesse' | 'feste_dosis'
//   export function erfassenVorgang(teile: Teile, eingabe: ErfassenEingabe, ids: () => string, jetzt: Date): Vorgang
//     // je neue Zeile felder.client_id === felder.id === ids(); Reihenfolge platz, etikett, gefaess, netztopf…,
//     // ereignis; beim übernommenen Platz (A4): kein platz, kein etikett, Storno und geschlossene Kopie der
//     // alten Belegung vor der neuen.
import { describe, expect, it } from 'vitest';
import {
  erfassenPruefen,
  erfassenVorgang,
  erfassenVorschlag,
  INTERVALLE,
  positionen,
  toepfe,
  type ErfassenEingabe,
} from '../../src/domain/anlage/erfassen.ts';
import { gefaessAnsicht } from '../../src/domain/anlage/gefaess.ts';
import { regalbild } from '../../src/domain/anlage/uebersicht.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  ANLAGE_R,
  deckelId,
  DECKELTYPEN,
  gefaessId,
  leeresRegal,
  modellId,
  platzId,
  regalTeile,
  uid,
  vereinen,
  weitereAnlage,
  type Teile,
} from '../fixtures/regal.ts';
import { sichtenNachrechnen, vorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');
const Z = 'Europe/Zurich';
const BEREICH = (n: number) => uid('2e', n);

/** deterministische Client-UUIDs */
const folge = (praefix = '40') => {
  let n = 0;
  return () => uid(praefix, ++n);
};

const neu = (v: Vorgang, tabelle?: string) =>
  v
    .filter(
      (s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu' && (!tabelle || s.tabelle === tabelle),
    )
    .map((s) => s.felder as Record<string, unknown>);

/** Gefäss 2.3 in Ebene 2 mit Rako 9 l, Deckel D2 (6 × 8 cm), DWC */
const gefaess23 = (anlageId = ANLAGE_R): Extract<ErfassenEingabe, { rolle: 'gefaess' }> => ({
  rolle: 'gefaess',
  anlageId,
  bereichId: BEREICH(2),
  position: 3,
  betriebsart: 'dwc',
  festeDosis: false,
  luftpumpe: 'P2',
  gefaessmodellId: modellId('rako'),
  betriebsvolumenL: 9,
  deckeltypId: deckelId('D2'),
  intervalle: { messenD: 2, nachfuellenD: 2, wechselnD: 14 },
});

/** Status eines Gefässes als entfernt markieren (Sicht und Ereignis) */
function entfernt(teile: Teile, kennung: string): Teile {
  teile['ereignis']?.push({
    id: uid('34', 1),
    client_id: uid('34', 1),
    typ: 'entfernt',
    platz_id: platzId(kennung),
    daten: {},
    gilt_ab: '2026-12-08T09:00:00Z',
    storniert_am: null,
  });
  return sichtenNachrechnen(teile);
}

describe('Eingabe prüfen (R9.3)', () => {
  it('UC3-AK2 doppelte Kennung unter den aktiven Gefässen der Anlage abgelehnt', () => {
    const teile = regalTeile(JETZT);
    expect(erfassenPruefen(teile, gefaess23()).map((v) => v.feld)).toEqual(['kennung']);
    // auch eine belegte Anzuchtbox zählt
    const box: ErfassenEingabe = {
      rolle: 'anzuchtort',
      anlageId: ANLAGE_R,
      bereichId: BEREICH(4),
      kennung: 'A1',
      typ: 'box_licht',
      position: 'vorne',
      platzzahl: 25,
    };
    expect(erfassenPruefen(teile, box).map((v) => v.feld)).toEqual(['kennung']);
    expect(erfassenPruefen(leeresRegal(), gefaess23())).toEqual([]);
  });

  it('UC3-AK2 Kennung eines entfernten Gefässes und gleiche Kennung in anderer Anlage erlaubt', () => {
    const teile = entfernt(regalTeile(JETZT), '2.2');
    expect(erfassenPruefen(teile, { ...gefaess23(), position: 2 })).toEqual([]);
    // T hat ein aktives 2.3; in R ist 2.3 frei
    expect(erfassenPruefen(vereinen(leeresRegal(), weitereAnlage('T', 'echt')), gefaess23())).toEqual([]);
  });

  it('UC3-AK2 Betriebsvolumen gleich und über L × B × H abgelehnt, knapp darunter erlaubt', () => {
    // Rako 30 × 20 × 12 innen 270 × 180 × 110 mm = 5 346 000 mm³ = 5.346 l; ganzzahlig in ml gerechnet (G3)
    const halb = { ...gefaess23(), gefaessmodellId: modellId('halb') };
    const teile = leeresRegal();
    expect(erfassenPruefen(teile, { ...halb, betriebsvolumenL: 5.346 }).map((v) => v.feld)).toEqual([
      'betriebsvolumen',
    ]);
    expect(erfassenPruefen(teile, { ...halb, betriebsvolumenL: 6 }).map((v) => v.feld)).toEqual([
      'betriebsvolumen',
    ]);
    expect(erfassenPruefen(teile, { ...halb, betriebsvolumenL: 5.345 })).toEqual([]);
    expect(erfassenPruefen(teile, { ...halb, betriebsvolumenL: 3 })).toEqual([]);
  });

  it('UC3-AK2 Topfgrösse 50 und 80 erlaubt, 60 abgelehnt', () => {
    const teile = leeresRegal();
    teile['deckeltyp']?.push({
      id: uid('2f', 60),
      client_id: uid('2f', 60),
      name: 'D60',
      topfdurchmesser_mm: 60,
      loecher_je_reihe: [2, 2],
      storniert_am: null,
    });
    expect(erfassenPruefen(teile, { ...gefaess23(), deckeltypId: deckelId('D2') })).toEqual([]);
    expect(erfassenPruefen(teile, { ...gefaess23(), deckeltypId: deckelId('D6') })).toEqual([]);
    expect(erfassenPruefen(teile, { ...gefaess23(), deckeltypId: uid('2f', 60) }).map((v) => v.feld)).toEqual(
      ['topfgroesse'],
    );
  });

  it('Messstelle W: zweite W abgelehnt', () => {
    const w: ErfassenEingabe = { rolle: 'messstelle', anlageId: ANLAGE_R };
    expect(erfassenPruefen(regalTeile(JETZT), w).map((v) => v.feld)).toEqual(['kennung']);
    expect(erfassenPruefen(leeresRegal(), w)).toEqual([]);
    const v = erfassenVorgang(leeresRegal(), w, folge(), JETZT);
    expect(v.map((s) => s.tabelle)).toEqual(['platz', 'etikett']);
    expect(neu(v, 'platz')[0]).toMatchObject({ kennung: 'W', rolle: 'messstelle', bereich_id: null });
    expect(neu(v, 'etikett')[0]).toMatchObject({ code: 'R-W', format: '70x42_3' });
  });

  it('feste Dosis nur bei Konstantpegel', () => {
    const teile = leeresRegal();
    expect(erfassenPruefen(teile, { ...gefaess23(), festeDosis: true }).map((v) => v.feld)).toEqual([
      'feste_dosis',
    ]);
    const station = {
      ...gefaess23(),
      bereichId: BEREICH(4),
      position: 4,
      betriebsart: 'konstantpegel' as const,
      festeDosis: true,
      gefaessmodellId: modellId('leni'),
      betriebsvolumenL: 2.3,
      deckeltypId: deckelId('S5'),
    };
    expect(erfassenPruefen(teile, station)).toEqual([]);
  });
});

describe('Vorschlag und Töpfe', () => {
  it('Vorschlag: nächste freie Position, Betriebsart aus dem Bereich, Intervalle je Betriebsart (DWC 2/2/14, Kratky belüftet 7/–/–)', () => {
    expect(INTERVALLE.dwc).toEqual({ messenD: 2, nachfuellenD: 2, wechselnD: 14 });
    expect(INTERVALLE.konstantpegel).toEqual({ messenD: 2, nachfuellenD: 2, wechselnD: 14 });
    expect(INTERVALLE.kratky_belueftet).toEqual({ messenD: 7, nachfuellenD: null, wechselnD: null });
    expect(INTERVALLE.kratky).toEqual({ messenD: 7, nachfuellenD: null, wechselnD: null });
    expect([1, 2, 3, 4, 5].map(positionen)).toEqual([
      [1, 2],
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ]);

    const leer = leeresRegal();
    const e2 = erfassenVorschlag(leer, ANLAGE_R, {
      rolle: 'gefaess',
      bereichId: BEREICH(2),
      gefaessmodellId: modellId('rako'),
      deckeltypId: deckelId('D2'),
    });
    expect(e2).toMatchObject({
      kennung: '2.1',
      code: 'R-2.1',
      position: 1,
      betriebsart: 'dwc',
      intervalle: { messenD: 2, nachfuellenD: 2, wechselnD: 14 },
      betriebsvolumenL: 9,
    });
    expect(e2.toepfe.map((t) => t.kennung)).toEqual(['2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.1.5', '2.1.6']);
    expect(erfassenVorschlag(leer, ANLAGE_R, { rolle: 'gefaess', bereichId: BEREICH(3) })).toMatchObject({
      betriebsart: 'kratky_belueftet',
      intervalle: { messenD: 7, nachfuellenD: null, wechselnD: null },
      toepfe: [],
    });
    // im Regal R ist in Ebene 2 nach dem Entfernen von 2.2 nur Position 2 frei
    const r = entfernt(regalTeile(JETZT), '2.2');
    expect(erfassenVorschlag(r, ANLAGE_R, { rolle: 'gefaess', bereichId: BEREICH(2) })).toMatchObject({
      kennung: '2.2',
      position: 2,
    });
  });

  it('Station 4.4 mit S5: 13 Töpfe 4.4.1 bis 4.4.13 zu 50 mm', () => {
    const s5 = DECKELTYPEN['S5'] ?? { topfdurchmesser_mm: 50, loecher_je_reihe: [] };
    for (const festeDosis of [false, true]) {
      const t = toepfe('4.4', s5, festeDosis);
      expect(t).toHaveLength(13);
      expect(t[0]).toEqual({ kennung: '4.4.1', lochNr: 1, groesseMm: 50 });
      expect(t[12]).toEqual({ kennung: '4.4.13', lochNr: 13, groesseMm: 50 });
      expect(t.every((x) => x.groesseMm === 50)).toBe(true);
    }
  });

  it('Station 4.2 mit S8 (feste Dosis, 80 mm): keine eigenen Töpfe', () => {
    const s8 = DECKELTYPEN['S8'] ?? { topfdurchmesser_mm: 80, loecher_je_reihe: [] };
    expect(toepfe('4.2', s8, true)).toEqual([]);
    // ohne feste Dosis trägt ein 80-mm-Deckel eigene Töpfe
    expect(toepfe('4.2', s8, false).map((t) => t.kennung)).toEqual(['4.2.1', '4.2.2', '4.2.3', '4.2.4']);
    const teile = leeresRegal();
    const v = erfassenVorgang(
      teile,
      {
        ...gefaess23(),
        bereichId: BEREICH(4),
        position: 2,
        betriebsart: 'konstantpegel',
        festeDosis: true,
        luftpumpe: 'P4',
        gefaessmodellId: modellId('leni'),
        betriebsvolumenL: 2.3,
        deckeltypId: deckelId('S8'),
      },
      folge(),
      JETZT,
    );
    expect(neu(v, 'netztopf')).toEqual([]);
    expect(neu(v, 'gefaess')[0]).toMatchObject({ feste_dosis: true, betriebsart: 'konstantpegel' });
  });
});

describe('Vorgang des Assistenten', () => {
  it('Vorgang in Fremdschlüssel-Reihenfolge, je Zeile client_id = id', () => {
    const v = erfassenVorgang(leeresRegal(), gefaess23(), folge(), JETZT);
    expect(v.map((s) => s.tabelle)).toEqual([
      'platz',
      'etikett',
      'gefaess',
      'netztopf',
      'netztopf',
      'netztopf',
      'netztopf',
      'netztopf',
      'netztopf',
      'ereignis',
    ]);
    expect(v.every((s) => s.art === 'neu')).toBe(true);
    const zeilen = neu(v);
    for (const z of zeilen) expect(z['client_id']).toBe(z['id']);
    expect(new Set(zeilen.map((z) => z['id'])).size).toBe(zeilen.length);

    const [platz] = neu(v, 'platz');
    expect(platz).toMatchObject({
      anlage_id: ANLAGE_R,
      bereich_id: BEREICH(2),
      kennung: '2.3',
      rolle: 'gefaess',
      position: 3,
    });
    expect(neu(v, 'etikett')[0]).toMatchObject({ code: 'R-2.3', platz_id: platz?.['id'], format: '70x42_3' });
    expect(neu(v, 'gefaess')[0]).toMatchObject({
      platz_id: platz?.['id'],
      gefaessmodell_id: modellId('rako'),
      deckeltyp_id: deckelId('D2'),
      betriebsart: 'dwc',
      feste_dosis: false,
      luftpumpe: 'P2',
      betriebsvolumen_l: 9,
      intervall_messen_d: 2,
      intervall_nachfuellen_d: 2,
      intervall_wechseln_d: 14,
      gueltig_von: JETZT.toISOString(),
    });
    const toepfe = neu(v, 'netztopf');
    expect(toepfe.map((t) => [t['kennung'], t['heim_loch_nr'], t['groesse_mm']])).toEqual([
      ['2.3.1', 1, 80],
      ['2.3.2', 2, 80],
      ['2.3.3', 3, 80],
      ['2.3.4', 4, 80],
      ['2.3.5', 5, 80],
      ['2.3.6', 6, 80],
    ]);
    expect(toepfe.every((t) => t['heim_platz_id'] === platz?.['id'] && t['anlage_id'] === ANLAGE_R)).toBe(
      true,
    );
    expect(vorgangPruefen(v)).toEqual([]);
  });

  it('UC3-AK9 Vorgang des Assistenten schreibt gefaess_erfasst mit gilt_ab = Speicherzeit und keinen Ansatz', () => {
    const v = erfassenVorgang(leeresRegal(), gefaess23(), folge(), JETZT);
    const ereignisse = neu(v, 'ereignis');
    expect(ereignisse).toHaveLength(1);
    expect(ereignisse[0]).toMatchObject({
      typ: 'gefaess_erfasst',
      platz_id: neu(v, 'platz')[0]?.['id'],
      gilt_ab: JETZT.toISOString(),
      daten: {},
    });
    expect(
      v.some((s) => ['naehrloesungsansatz', 'ansatz_position', 'ansatz_schritt'].includes(s.tabelle)),
    ).toBe(false);
  });

  it('UC3-AK9 Kachel und Maske zeigen «leer · bereit» nach dem Erfassen und «Lösung» nach dem ersten Neuansatz', () => {
    const v = erfassenVorgang(leeresRegal(), gefaess23(), folge(), JETZT);
    const t = vorgangAnwenden(leeresRegal(), v, JETZT);
    const platz = neu(v, 'platz')[0]?.['id'];
    expect(t['v_fuellzustand']?.find((f) => f['platz_id'] === platz)?.['fuellzustand']).toBe('leer');
    const kachel = () =>
      regalbild(t, ANLAGE_R, JETZT, Z)
        .flatMap((z) => z.orte)
        .find((o) => o.code === 'R-2.3');
    expect(kachel()?.zeilen).toEqual(['leer · bereit']);
    expect(kachel()?.badge).toBe('nicht geprüft');
    expect(gefaessAnsicht(t, 'R-2.3', JETZT, Z)).toMatchObject({
      loesung: 'leer · bereit',
      pruefstatus: 'nicht geprüft',
    });

    // erster Neuansatz eine Stunde später
    t['naehrloesungsansatz']?.push({
      id: uid('21', 9),
      platz_id: platz,
      typ: 'neuansatz',
      status: 'abgeschlossen',
      begonnen_am: '2026-12-10T09:00:00Z',
      volumen_l: 9,
      storniert_am: null,
    });
    sichtenNachrechnen(t);
    const spaeter = new Date('2026-12-10T10:00:00Z');
    expect(t['v_fuellzustand']?.find((f) => f['platz_id'] === platz)?.['fuellzustand']).toBe('loesung');
    expect(gefaessAnsicht(t, 'R-2.3', spaeter, Z)?.loesung).toBe('Lösung 0/14 Tage');
    expect(
      regalbild(t, ANLAGE_R, spaeter, Z)
        .flatMap((z) => z.orte)
        .find((o) => o.code === 'R-2.3')?.zeilen,
    ).toEqual(['Lösung 0/14 Tage']);
  });

  it('Anzuchtbox A3: anzuchtort box_dunkel vorne, Etikett 55x25, kein gefaess_erfasst', () => {
    const teile = regalTeile(JETZT);
    teile['platz'] = (teile['platz'] ?? []).filter((p) => p['kennung'] !== 'A3');
    teile['anzuchtort'] = (teile['anzuchtort'] ?? []).filter((a) => a['platz_id'] !== platzId('A3'));
    teile['etikett'] = (teile['etikett'] ?? []).filter((e) => e['code'] !== 'R-A3');
    const vorschlag = erfassenVorschlag(teile, ANLAGE_R, { rolle: 'anzuchtort' });
    expect(vorschlag).toMatchObject({
      kennung: 'A3',
      code: 'R-A3',
      typ: 'box_dunkel',
      position: 'vorne',
      platzzahl: 25,
    });
    // im leeren Regal zuerst A1, Lichtkeimer vorne
    expect(erfassenVorschlag(leeresRegal(), ANLAGE_R, { rolle: 'anzuchtort' })).toMatchObject({
      kennung: 'A1',
      typ: 'box_licht',
      position: 'vorne',
    });

    const eingabe: ErfassenEingabe = {
      rolle: 'anzuchtort',
      anlageId: ANLAGE_R,
      bereichId: BEREICH(4),
      kennung: 'A3',
      typ: 'box_dunkel',
      position: 'vorne',
      platzzahl: 25,
    };
    expect(erfassenPruefen(teile, eingabe)).toEqual([]);
    const v = erfassenVorgang(teile, eingabe, folge(), JETZT);
    expect(v.map((s) => s.tabelle)).toEqual(['platz', 'etikett', 'anzuchtort']);
    const [platz] = neu(v, 'platz');
    expect(platz).toMatchObject({ kennung: 'A3', rolle: 'anzuchtort' });
    expect(neu(v, 'etikett')[0]).toMatchObject({ code: 'R-A3', format: '55x25' });
    expect(neu(v, 'anzuchtort')[0]).toMatchObject({
      platz_id: platz?.['id'],
      typ: 'box_dunkel',
      position: 'vorne',
      platzzahl: 25,
    });
    expect(neu(v).every((z) => z['client_id'] === z['id'])).toBe(true);
  });

  it('neues Gefäss am Platz eines entfernten: Platz und Etikett übernommen, alte Belegung storniert und geschlossen kopiert, Hinweis Tasche', () => {
    const teile = entfernt(regalTeile(JETZT), '2.2');
    const vorschlag = erfassenVorschlag(teile, ANLAGE_R, { rolle: 'gefaess', bereichId: BEREICH(2) });
    expect(vorschlag.hinweise).toContain('Tasche mit dem Etikett auf die neue Box umstecken');
    expect(
      erfassenVorschlag(leeresRegal(), ANLAGE_R, { rolle: 'gefaess', bereichId: BEREICH(2) }).hinweise,
    ).toEqual([]);

    const eingabe = { ...gefaess23(), position: 2 };
    const v = erfassenVorgang(teile, eingabe, folge(), JETZT);
    expect(v.some((s) => s.tabelle === 'platz' || s.tabelle === 'etikett')).toBe(false);
    // Storno der alten Belegung vor jeder neuen Gefässzeile (Teilindex gefaess_aktiv_je_platz)
    const storno = v.findIndex(
      (s) => s.art === 'storno' && s.tabelle === 'gefaess' && s.clientId === gefaessId('2.2'),
    );
    const ersteNeue = v.findIndex((s) => s.art === 'neu' && s.tabelle === 'gefaess');
    expect(storno).toBeGreaterThanOrEqual(0);
    expect(storno).toBeLessThan(ersteNeue);

    const alt = regalTeile(JETZT)['gefaess']?.find((g) => g['id'] === gefaessId('2.2'));
    const gefaesse = neu(v, 'gefaess');
    expect(gefaesse).toHaveLength(2);
    const kopie = gefaesse.find((g) => g['gueltig_bis'] !== null && g['gueltig_bis'] !== undefined);
    const neue = gefaesse.find((g) => g['gueltig_bis'] === null || g['gueltig_bis'] === undefined);
    expect(kopie).toMatchObject({
      platz_id: platzId('2.2'),
      gueltig_von: alt?.['gueltig_von'],
      gueltig_bis: JETZT.toISOString(),
      deckeltyp_id: alt?.['deckeltyp_id'],
      betriebsvolumen_l: alt?.['betriebsvolumen_l'],
    });
    expect(neue).toMatchObject({
      platz_id: platzId('2.2'),
      gueltig_von: JETZT.toISOString(),
      deckeltyp_id: deckelId('D2'),
    });
    expect(neu(v, 'ereignis').map((e) => [e['typ'], e['platz_id']])).toEqual([
      ['gefaess_erfasst', platzId('2.2')],
    ]);

    // keine doppelte Topfkennung unter den aktiven Töpfen der Anlage
    const t = vorgangAnwenden(teile, v, JETZT);
    const aktiv = (t['netztopf'] ?? []).filter((n) => n['storniert_am'] === null && n['aktiv'] !== false);
    const kennungen = aktiv.map((n) => n['kennung']);
    expect(new Set(kennungen).size).toBe(kennungen.length);
    expect(kennungen).toEqual(expect.arrayContaining(['2.2.1', '2.2.6']));
    expect(aktiv.find((n) => n['kennung'] === '2.2.1')?.['heim_platz_id']).toBe(platzId('2.2'));

    // genau eine offene Belegung, Status «in Prüfung», Füllzustand «leer»
    const offen = (t['gefaess'] ?? []).filter(
      (g) => g['platz_id'] === platzId('2.2') && g['storniert_am'] === null && g['gueltig_bis'] === null,
    );
    expect(offen).toHaveLength(1);
    expect(t['v_gefaess_status']?.find((s) => s['gefaess_id'] === offen[0]?.['id'])?.['status']).toBe(
      'in_pruefung',
    );
    expect(t['v_fuellzustand']?.find((f) => f['platz_id'] === platzId('2.2'))?.['fuellzustand']).toBe('leer');
  });

  it('TO2 gleiche Eingabe ergibt dieselben client_id', () => {
    const a = erfassenVorgang(leeresRegal(), gefaess23(), folge('41'), JETZT);
    const b = erfassenVorgang(leeresRegal(), gefaess23(), folge('41'), JETZT);
    expect(b).toEqual(a);
    expect(neu(b).map((z) => z['client_id'])).toEqual(neu(a).map((z) => z['client_id']));
    // die Eingabe wird nicht verändert (Schnappschuss)
    const e = gefaess23();
    const kopie = structuredClone(e);
    erfassenVorgang(leeresRegal(), e, folge(), JETZT);
    expect(e).toEqual(kopie);
  });
});
