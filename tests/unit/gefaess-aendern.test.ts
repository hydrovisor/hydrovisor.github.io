// Gefäss ändern, Box- oder Deckeltausch, Leeren, Entfernen und Wiederherstellen (Plan 21 Testliste; UC3-AK3,
// UC3-AK6, A1, A8, A10). Injizierte Uhr 2026-12-10T08:00:00Z, Zeitzone Europe/Zurich, Teile aus
// tests/fixtures/regal.ts; Sichten nachgerechnet mit tests/fixtures/sichten.ts.
//
// Vertrag für src/domain/anlage/aendern.ts (vom Testentwickler festgelegt, wo Plan 21 offen ist):
//
//   export function lochbildGleich(a: Lochbild, b: Lochbild): boolean
//     // Lochbild = { topfdurchmesser_mm: number; loecher_je_reihe: readonly number[] }; gleich = gleiche Lochzahl
//     // und gleiche Topfgrösse (A8), die Aufteilung in Reihen zählt nicht
//   export interface PflanzeAmPlatz { art: 'pflanzung' | 'reservierung'; pflanzungId: string; satzId: string }
//   export function pflanzenAmPlatz(teile: Teile, platzId: string): PflanzeAmPlatz[]
//   export function deckeltauschPruefen(teile: Teile, platzId: string, deckeltypId: string): Verstoss[]
//     // feld 'deckel'; grund «Deckeltausch gesperrt: im Gefäss stehen Pflanzen» mit den Sorten der Sätze
//   export interface Aenderung {
//     intervalle?: Partial<Intervalle>;   // Intervalle aus ./erfassen.ts
//     naechsterWechselAm?: string | null; betriebsvolumenL?: number; betriebsart?: Betriebsart;
//     festeDosis?: boolean; luftpumpe?: 'P1' | 'P2' | 'P3' | 'P4' | null; gefaessmodellId?: string; deckeltypId?: string;
//   }
//   export function aenderungPruefen(teile: Teile, platzId: string, aenderung: Aenderung): Verstoss[]
//     // feld 'deckel' | 'betriebsvolumen' | 'intervall_wechseln_d' | 'feste_dosis'
//   export function aenderungVorgang(teile: Teile, platzId: string, aenderung: Aenderung, ids: () => string,
//     jetzt: Date): Vorgang
//     // nur Intervalle: Storno (Grund 'korrektur') plus Zeile mit gleichem gueltig_von;
//     // Volumen, Betriebsart, Box, Deckel: Storno, geschlossene Kopie (gueltig_bis = jetzt), neue Zeile ab jetzt;
//     // Box oder Deckel zusätzlich Ereignis box_deckel_tausch; anderes Lochbild: Storno der Töpfe ohne Loch, neue Töpfe
//   export function leerenVorgang(platzId: string, id: string, jetzt: Date): Vorgang   // Ereignis geleert
//
// Vertrag für src/domain/anlage/entfernen.ts:
//
//   export interface Hindernis { satzId: string; sorte: string; art: 'pflanzung' | 'reservierung' }
//   export function entfernenPruefen(teile: Teile, platzId: string): Hindernis[]   // je Satz und Art einmal; [] = frei
//   export function entfernenVorgang(platzId: string, id: string, jetzt: Date): Vorgang   // Ereignis entfernt
//   export function wiederherstellbar(entferntAm: string, jetzt: Date, zeitzone: Zeitzone): boolean
//     // bis und mit 7. Kalendertag nach dem Entfernen in der Zeitzone
//
// Erweiterung von src/domain/anlage/gefaess.ts (Gefaessansicht):
//   nebenknoepfe: { art: 'pruefen' | 'aendern' | 'leeren' | 'wiederherstellen'; text: string }[]
//     // Texte «Prüfen», «Ändern», «Leeren» (nur bei Lösung), «Wiederherstellen» (bis 7 Tage nach dem Entfernen)
//   entfernt?: string   // «Gefäss 2.3 entfernt am 10.12.» (R9.2, Tag in Zürich)
// Erweiterung von src/domain/anlage/uebersicht.ts: statusBadge('in_betrieb_volumen_offen') = 'Volumen offen',
//   statusBadge('entfernt') = 'entfernt'.
import { describe, expect, it } from 'vitest';
import {
  aenderungPruefen,
  aenderungVorgang,
  deckeltauschPruefen,
  leerenVorgang,
  lochbildGleich,
  pflanzenAmPlatz,
} from '../../src/domain/anlage/aendern.ts';
import { entfernenPruefen, entfernenVorgang, wiederherstellbar } from '../../src/domain/anlage/entfernen.ts';
import { INTERVALLE } from '../../src/domain/anlage/erfassen.ts';
import { gefaessAnsicht, type Gefaessansicht } from '../../src/domain/anlage/gefaess.ts';
import { regalbild, statusBadge } from '../../src/domain/anlage/uebersicht.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  ANLAGE_R,
  deckelId,
  DECKELTYPEN,
  gefaessId,
  modellId,
  netztopfId,
  platzId,
  regalTeile,
  uid,
  type Teile,
} from '../fixtures/regal.ts';
import { vorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');
const Z = 'Europe/Zurich';

const folge = (praefix = '42') => {
  let n = 0;
  return () => uid(praefix, ++n);
};
const neu = (v: Vorgang, tabelle?: string) =>
  v
    .filter(
      (s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu' && (!tabelle || s.tabelle === tabelle),
    )
    .map((s) => s.felder as Record<string, unknown>);
const stornos = (v: Vorgang, tabelle: string) =>
  v.filter((s): s is Extract<Schritt, { art: 'storno' }> => s.art === 'storno' && s.tabelle === tabelle);

/** Gefaessansicht mit den Erweiterungen aus Plan 21 */
type Ansicht = Gefaessansicht & {
  nebenknoepfe?: { art: string; text: string }[];
  entfernt?: string;
};
const ansicht = (teile: Teile, code: string, jetzt = JETZT) =>
  gefaessAnsicht(teile, code, jetzt, Z) as Ansicht | undefined;
const knoepfe = (teile: Teile, code: string, jetzt = JETZT) =>
  (ansicht(teile, code, jetzt)?.nebenknoepfe ?? []).map((k) => k.text);

const offeneBelegungen = (t: Teile, kennung: string) =>
  (t['gefaess'] ?? []).filter(
    (g) => g['platz_id'] === platzId(kennung) && g['storniert_am'] === null && g['gueltig_bis'] === null,
  );
const status = (t: Teile, gefaess: Record<string, unknown> | undefined) =>
  t['v_gefaess_status']?.find((s) => s['gefaess_id'] === gefaess?.['id'])?.['status'];
const alt = (kennung: string) => regalTeile(JETZT)['gefaess']?.find((g) => g['id'] === gefaessId(kennung));

/** zweiter Satz mit einer Pflanzung in A1 und einer Reservierung auf den Topf 2.2.1 */
function mitReservierung(): Teile {
  const t = regalTeile(JETZT);
  t['satz']?.push({
    id: uid('27', 2),
    sorte_id: uid('26', 1),
    kulturform: 'kopf',
    anzuchtort_platz_id: platzId('A1'),
    direktsaat_platz_id: null,
    saatdatum: '2026-12-05',
    gilt_ab: '2026-12-05T08:00:00Z',
    storniert_am: null,
  });
  t['pflanzung']?.push({
    id: uid('28', 9),
    satz_id: uid('27', 2),
    gilt_ab: '2026-12-05T08:00:00Z',
    storniert_am: null,
  });
  t['v_pflanzung_zustand']?.push({
    pflanzung_id: uid('28', 9),
    satz_id: uid('27', 2),
    phase: 'keimung',
    status: 'aktiv',
    netztopf_id: null,
    platz_id: null,
    loch_nr: null,
  });
  t['v_reservierung_aktiv'] = [
    {
      id: uid('35', 1),
      client_id: uid('35', 1),
      pflanzung_id: uid('28', 9),
      netztopf_id: netztopfId('2.2.1'),
      umsetzen_vorgabe_am: '2026-12-17',
      umsetzen_geplant_am: '2026-12-17',
      gilt_ab: '2026-12-05T08:00:00Z',
      storniert_am: null,
    },
  ];
  return t;
}

describe('Entfernen (UC3 Entfernen)', () => {
  it('UC3-AK3 Entfernen mit aktiver Pflanzung gesperrt, Sätze genannt', () => {
    const teile = regalTeile(JETZT);
    expect(entfernenPruefen(teile, platzId('2.3'))).toEqual([
      { satzId: uid('27', 1), sorte: 'Lollo Rossa', art: 'pflanzung' },
    ]);
    expect(entfernenPruefen(teile, platzId('2.1'))).toEqual([]);
  });

  it('UC3-AK3 Entfernen mit aktiver Reservierung auf einen Topf des Platzes gesperrt', () => {
    const teile = mitReservierung();
    expect(entfernenPruefen(teile, platzId('2.2'))).toEqual([
      { satzId: uid('27', 2), sorte: 'Lollo Rossa', art: 'reservierung' },
    ]);
    // ohne Reservierung ist 2.2 frei
    teile['v_reservierung_aktiv'] = [];
    expect(entfernenPruefen(teile, platzId('2.2'))).toEqual([]);
  });

  it('UC3-AK3 nach dem Entfernen Status «entfernt» und Verlauf in der Maske Gefäss abrufbar', () => {
    const teile = regalTeile(JETZT);
    teile['v_pflanzung_zustand'] = [];
    expect(entfernenPruefen(teile, platzId('2.3'))).toEqual([]);
    const v = entfernenVorgang(platzId('2.3'), uid('42', 1), JETZT);
    expect(neu(v)).toEqual([
      {
        client_id: uid('42', 1),
        id: uid('42', 1),
        typ: 'entfernt',
        platz_id: platzId('2.3'),
        gilt_ab: JETZT.toISOString(),
        daten: {},
      },
    ]);
    expect(vorgangPruefen(v)).toEqual([]);

    const t = vorgangAnwenden(teile, v, JETZT);
    expect(status(t, offeneBelegungen(t, '2.3')[0])).toBe('entfernt');
    expect(statusBadge('entfernt')).toBe('entfernt');
    expect(
      regalbild(t, ANLAGE_R, JETZT, Z)
        .flatMap((z) => z.orte)
        .find((o) => o.code === 'R-2.3')?.badge,
    ).toBe('entfernt');
    const a = ansicht(t, 'R-2.3');
    expect(a?.entfernt).toBe('Gefäss 2.3 entfernt am 10.12.');
    // Messungen und Ansatz hängen am Platz und bleiben im Verlauf
    expect(a?.verlauf.map((z) => z.ph)).toEqual(['6.40', '6.20', '6.00', '–']);
    expect(knoepfe(t, 'R-2.3')).toContain('Wiederherstellen');
    expect(knoepfe(t, 'R-2.3', new Date('2026-12-18T08:00:00Z'))).not.toContain('Wiederherstellen');
  });

  it('Wiederherstellen am 7. Tag möglich, am 8. nicht (Kalendertage Zürich, 28.3.2027 Sommerzeit)', () => {
    // entfernt am 21.3.2027 um 23:30 in Zürich (22:30 UTC, noch Winterzeit)
    const entferntAm = '2027-03-21T22:30:00Z';
    expect(wiederherstellbar(entferntAm, new Date('2027-03-21T23:00:00Z'), Z)).toBe(true);
    // 28.3. 23:30 Sommerzeit = 21:30 UTC: 7. Kalendertag
    expect(wiederherstellbar(entferntAm, new Date('2027-03-28T21:30:00Z'), Z)).toBe(true);
    // 29.3. 00:30 Sommerzeit = 28.3. 22:30 UTC: genau 7 × 24 h, aber schon der 8. Kalendertag
    expect(wiederherstellbar(entferntAm, new Date('2027-03-28T22:30:00Z'), Z)).toBe(false);
  });
});

describe('Pflanzen am Platz', () => {
  it('Pflanzen am Platz: Ortsereignis, Direktsaat ohne Ortsereignis und Reservierungen auf Töpfe des Platzes', () => {
    const teile = mitReservierung();
    expect(pflanzenAmPlatz(teile, platzId('2.3')).map((p) => [p.art, p.pflanzungId])).toEqual([
      ['pflanzung', uid('28', 1)],
      ['pflanzung', uid('28', 2)],
      ['pflanzung', uid('28', 3)],
    ]);
    expect(pflanzenAmPlatz(teile, platzId('2.2'))).toEqual([
      { art: 'reservierung', pflanzungId: uid('28', 9), satzId: uid('27', 2) },
    ]);
    // Direktsaat in 3.1 ohne Ortsereignis (platz_id leer)
    teile['satz']?.push({
      id: uid('27', 3),
      sorte_id: uid('26', 1),
      anzuchtort_platz_id: null,
      direktsaat_platz_id: platzId('3.1'),
      saatdatum: '2026-12-01',
      storniert_am: null,
    });
    teile['v_pflanzung_zustand']?.push({
      pflanzung_id: uid('28', 20),
      satz_id: uid('27', 3),
      phase: 'keimung',
      status: 'aktiv',
      netztopf_id: null,
      platz_id: null,
      loch_nr: null,
    });
    expect(pflanzenAmPlatz(teile, platzId('3.1')).map((p) => p.satzId)).toEqual([uid('27', 3)]);
    expect(pflanzenAmPlatz(teile, platzId('2.1'))).toEqual([]);
  });
});

describe('Ändern (UC3 Ändern, A1)', () => {
  it('Intervall ändern: Storno plus Zeile mit gleichem gueltig_von, genau eine offene Belegung', () => {
    const teile = regalTeile(JETZT);
    const aenderung = { intervalle: { wechselnD: 10 } };
    expect(aenderungPruefen(teile, platzId('2.3'), aenderung)).toEqual([]);
    const v = aenderungVorgang(teile, platzId('2.3'), aenderung, folge(), JETZT);
    expect(v.map((s) => [s.art, s.tabelle])).toEqual([
      ['storno', 'gefaess'],
      ['neu', 'gefaess'],
    ]);
    expect(stornos(v, 'gefaess')[0]).toMatchObject({ clientId: gefaessId('2.3'), grund: 'korrektur' });
    const [zeile] = neu(v, 'gefaess');
    expect(zeile).toMatchObject({
      platz_id: platzId('2.3'),
      intervall_wechseln_d: 10,
      intervall_messen_d: 2,
      intervall_nachfuellen_d: 2,
      gueltig_von: alt('2.3')?.['gueltig_von'],
      gueltig_bis: null,
      betriebsvolumen_l: 9,
      deckeltyp_id: deckelId('D2'),
      gefaessmodell_id: modellId('rako'),
      luftpumpe: 'P2',
    });
    expect(zeile?.['client_id']).toBe(zeile?.['id']);
    expect(zeile?.['id']).not.toBe(gefaessId('2.3'));

    const t = vorgangAnwenden(teile, v, JETZT);
    const offen = offeneBelegungen(t, '2.3');
    expect(offen).toHaveLength(1);
    expect(offen[0]?.['intervall_wechseln_d']).toBe(10);
    expect(status(t, offen[0])).toBe('in_betrieb');
    expect(ansicht(t, 'R-2.3')?.loesung).toBe('Lösung 12/10 Tage');
  });

  it('Volumen ändern: geschlossene Kopie und neue Belegung ab jetzt, kein gefaess_erfasst', () => {
    const teile = regalTeile(JETZT);
    const v = aenderungVorgang(teile, platzId('2.3'), { betriebsvolumenL: 8 }, folge(), JETZT);
    expect(stornos(v, 'gefaess').map((s) => s.clientId)).toEqual([gefaessId('2.3')]);
    expect(v.some((s) => s.tabelle === 'ereignis')).toBe(false);
    const gefaesse = neu(v, 'gefaess');
    expect(gefaesse).toHaveLength(2);
    expect(gefaesse.find((g) => g['gueltig_bis'] !== null)).toMatchObject({
      gueltig_von: alt('2.3')?.['gueltig_von'],
      gueltig_bis: JETZT.toISOString(),
      betriebsvolumen_l: 9,
    });
    expect(gefaesse.find((g) => g['gueltig_bis'] === null)).toMatchObject({
      gueltig_von: JETZT.toISOString(),
      betriebsvolumen_l: 8,
      intervall_wechseln_d: 14,
    });

    const t = vorgangAnwenden(teile, v, JETZT);
    const offen = offeneBelegungen(t, '2.3');
    expect(offen).toHaveLength(1);
    // Prüfstatus und Füllzustand bleiben (gueltig_von der Kopie erhalten)
    expect(status(t, offen[0])).toBe('in_betrieb');
    expect(t['v_fuellzustand']?.find((f) => f['platz_id'] === platzId('2.3'))?.['fuellzustand']).toBe(
      'loesung',
    );
    expect(ansicht(t, 'R-2.3')?.merkmale).toBe('DWC · 8 l');
  });

  it('Betriebsart Kratky belüftet: Wechselintervall leer', () => {
    const teile = regalTeile(JETZT);
    const aenderung = { betriebsart: 'kratky_belueftet' as const, intervalle: INTERVALLE.kratky_belueftet };
    expect(aenderungPruefen(teile, platzId('2.1'), aenderung)).toEqual([]);
    const v = aenderungVorgang(teile, platzId('2.1'), aenderung, folge(), JETZT);
    expect(neu(v, 'gefaess').find((g) => g['gueltig_bis'] === null)).toMatchObject({
      betriebsart: 'kratky_belueftet',
      intervall_messen_d: 7,
      intervall_nachfuellen_d: null,
      intervall_wechseln_d: null,
      gueltig_von: JETZT.toISOString(),
    });
    // DWC ohne Wechselintervall verletzt den Check der Tabelle gefaess
    expect(
      aenderungPruefen(teile, platzId('2.1'), { intervalle: { wechselnD: null } }).map((f) => f.feld),
    ).toEqual(['intervall_wechseln_d']);
  });

  it('Leeren nur bei Lösung, schreibt geleert', () => {
    const teile = regalTeile(JETZT);
    expect(knoepfe(teile, 'R-2.3')).toEqual(expect.arrayContaining(['Ändern', 'Leeren']));
    expect(knoepfe(teile, 'R-2.1')).not.toContain('Leeren');
    expect(knoepfe(teile, 'R-2.1')).toContain('Ändern');
    const v = leerenVorgang(platzId('2.3'), uid('42', 5), JETZT);
    expect(neu(v)).toEqual([
      {
        client_id: uid('42', 5),
        id: uid('42', 5),
        typ: 'geleert',
        platz_id: platzId('2.3'),
        gilt_ab: JETZT.toISOString(),
        daten: {},
      },
    ]);
    const t = vorgangAnwenden(teile, v, JETZT);
    expect(t['v_fuellzustand']?.find((f) => f['platz_id'] === platzId('2.3'))?.['fuellzustand']).toBe('leer');
    expect(ansicht(t, 'R-2.3')?.loesung).toBe('leer · bereit');
    expect(knoepfe(t, 'R-2.3')).not.toContain('Leeren');
  });
});

describe('Box- oder Deckeltausch (R8.3, A8)', () => {
  /** zweiter Deckel mit gleichem Lochbild wie D2 (6 × 8 cm), anders in Reihen geteilt */
  function mitD2b(): Teile {
    const t = regalTeile(JETZT);
    t['deckeltyp']?.push({
      id: uid('2f', 20),
      client_id: uid('2f', 20),
      name: 'D2b',
      topfdurchmesser_mm: 80,
      loecher_je_reihe: [3, 3],
      service_oeffnung: true,
      storniert_am: null,
    });
    return t;
  }
  const d = (name: string) => DECKELTYPEN[name] ?? { topfdurchmesser_mm: 80, loecher_je_reihe: [] };

  it('UC3-AK6 Deckeltausch auf anderes Lochbild mit Pflanzen gesperrt', () => {
    const teile = regalTeile(JETZT);
    const verstoesse = deckeltauschPruefen(teile, platzId('2.3'), deckelId('D4'));
    expect(verstoesse.map((f) => f.feld)).toEqual(['deckel']);
    expect(verstoesse[0]?.grund).toContain('Deckeltausch gesperrt: im Gefäss stehen Pflanzen');
    expect(verstoesse[0]?.grund).toContain('Lollo Rossa');
    expect(
      aenderungPruefen(teile, platzId('2.3'), { deckeltypId: deckelId('D4') }).map((f) => f.feld),
    ).toEqual(['deckel']);
    // gleiche Lochzahl, andere Topfgrösse ist ein anderes Lochbild
    expect(lochbildGleich(d('D6'), { topfdurchmesser_mm: 80, loecher_je_reihe: [2, 2, 2] })).toBe(false);
    expect(lochbildGleich(d('D2'), d('D4'))).toBe(false);
    // auch eine Reservierung auf einen Topf des Platzes sperrt
    expect(deckeltauschPruefen(mitReservierung(), platzId('2.2'), deckelId('D2')).map((f) => f.feld)).toEqual(
      ['deckel'],
    );
  });

  it('UC3-AK6 gleiches Lochbild mit Pflanzen erlaubt', () => {
    const teile = mitD2b();
    expect(lochbildGleich(d('D2'), { topfdurchmesser_mm: 80, loecher_je_reihe: [3, 3] })).toBe(true);
    expect(deckeltauschPruefen(teile, platzId('2.3'), uid('2f', 20))).toEqual([]);
    const v = aenderungVorgang(teile, platzId('2.3'), { deckeltypId: uid('2f', 20) }, folge(), JETZT);
    expect(stornos(v, 'gefaess').map((s) => s.clientId)).toEqual([gefaessId('2.3')]);
    expect(stornos(v, 'netztopf')).toEqual([]);
    expect(neu(v, 'netztopf')).toEqual([]);
    expect(neu(v, 'ereignis').map((e) => [e['typ'], e['platz_id'], e['gilt_ab']])).toEqual([
      ['box_deckel_tausch', platzId('2.3'), JETZT.toISOString()],
    ]);
    const t = vorgangAnwenden(teile, v, JETZT);
    const offen = offeneBelegungen(t, '2.3');
    expect(offen).toHaveLength(1);
    expect(offen[0]?.['deckeltyp_id']).toBe(uid('2f', 20));
    expect(status(t, offen[0])).toBe('in_pruefung');

    // Boxtausch mit Pflanzen erlaubt; das Volumen muss in die neue Box passen
    expect(
      aenderungPruefen(teile, platzId('2.3'), { gefaessmodellId: modellId('halb') }).map((f) => f.feld),
    ).toEqual(['betriebsvolumen']);
    expect(
      aenderungPruefen(teile, platzId('2.3'), { gefaessmodellId: modellId('halb'), betriebsvolumenL: 3 }),
    ).toEqual([]);
    const box = aenderungVorgang(
      teile,
      platzId('2.3'),
      { gefaessmodellId: modellId('halb'), betriebsvolumenL: 3 },
      folge('43'),
      JETZT,
    );
    expect(neu(box, 'ereignis').map((e) => e['typ'])).toEqual(['box_deckel_tausch']);
    expect(neu(box, 'gefaess').find((g) => g['gueltig_bis'] === null)).toMatchObject({
      gefaessmodell_id: modellId('halb'),
      betriebsvolumen_l: 3,
    });
  });

  it('UC3-AK6 anderes Lochbild ohne Pflanzen: box_deckel_tausch, überzählige Töpfe storniert, neue Töpfe angelegt', () => {
    const teile = regalTeile(JETZT);
    // 2.1: D2 (6 Löcher) → D4 (2 Löcher): Töpfe 2.1.3 bis 2.1.6 ohne Loch
    expect(deckeltauschPruefen(teile, platzId('2.1'), deckelId('D4'))).toEqual([]);
    const weniger = aenderungVorgang(teile, platzId('2.1'), { deckeltypId: deckelId('D4') }, folge(), JETZT);
    expect(neu(weniger, 'ereignis').map((e) => [e['typ'], e['platz_id']])).toEqual([
      ['box_deckel_tausch', platzId('2.1')],
    ]);
    expect(stornos(weniger, 'netztopf').map((s) => [s.clientId, s.grund])).toEqual(
      ['2.1.3', '2.1.4', '2.1.5', '2.1.6'].map((k) => [netztopfId(k), 'korrektur']),
    );
    expect(neu(weniger, 'netztopf')).toEqual([]);
    const t1 = vorgangAnwenden(teile, weniger, JETZT);
    expect(status(t1, offeneBelegungen(t1, '2.1')[0])).toBe('in_pruefung');
    expect(
      (t1['netztopf'] ?? [])
        .filter((n) => n['heim_platz_id'] === platzId('2.1') && n['storniert_am'] === null)
        .map((n) => n['kennung']),
    ).toEqual(['2.1.1', '2.1.2']);

    // 2.2: D4 (2 Löcher) → D2 (6 Löcher): neue Töpfe 2.2.3 bis 2.2.6
    const mehr = aenderungVorgang(teile, platzId('2.2'), { deckeltypId: deckelId('D2') }, folge('44'), JETZT);
    expect(stornos(mehr, 'netztopf')).toEqual([]);
    const toepfe = neu(mehr, 'netztopf');
    expect(toepfe.map((n) => [n['kennung'], n['heim_loch_nr'], n['groesse_mm'], n['heim_platz_id']])).toEqual(
      [3, 4, 5, 6].map((l) => [`2.2.${l}`, l, 80, platzId('2.2')]),
    );
    expect(toepfe.every((n) => n['client_id'] === n['id'] && n['anlage_id'] === ANLAGE_R)).toBe(true);
    // Reihenfolge der Fremdschlüssel: Belegung vor den Töpfen und dem Ereignis
    const tabellen = mehr.map((s) => s.tabelle);
    expect(tabellen.lastIndexOf('gefaess')).toBeLessThan(tabellen.indexOf('netztopf'));
    expect(vorgangPruefen(mehr)).toEqual([]);
    const t2 = vorgangAnwenden(teile, mehr, JETZT);
    expect(status(t2, offeneBelegungen(t2, '2.2')[0])).toBe('in_pruefung');
  });
});
