// Gefässprüfung R9.3, Aufgabe «Gefäss prüfen» und Einrichtungs-Checkliste (Plan 21 Testliste; UC3-AK4, A2, A7,
// A11). Injizierte Uhr 2026-12-10T08:00:00Z, Zeitzone Europe/Zurich, Teile aus tests/fixtures/regal.ts und
// tests/fixtures/einrichtung.ts; Sichten nachgerechnet mit tests/fixtures/sichten.ts.
//
// Vertrag für src/domain/etikett/pruefung.ts (vom Testentwickler festgelegt, wo Plan 21 offen ist):
//
//   export interface Pruefeintrag { schritt: number; ok: boolean; giltAb: string; volumenGezaehltL?: number }
//   export interface Pruefstand {
//     naechsterSchritt: 1 | 2 | 3 | 4 | null;  // kleinster Schritt 1 bis 3 ohne ok seit dem Anker, dann 4, danach null
//     protokoll: Pruefeintrag[];               // alle nicht stornierten Prüfereignisse am Platz, älteste zuerst
//     geprueftAm?: string;                     // gilt_ab von Schritt 4 (ok) seit dem Anker
//   }
//   export function pruefStand(teile: Teile, platzId: string): Pruefstand
//     // Anker: letztes gefaess_erfasst oder ein späterer box_deckel_tausch (wie v_gefaess_status)
//   export function kennungPruefen(getippt: string, erwartet: string): { ok: boolean; text: string }
//     // «Richtiges Gefäss: 2.3» oder «Etikett zeigt 2.2, erwartet 2.3»
//   export function pruefschrittVorgang(platzId: string, schritt: 1 | 2 | 3, ok: boolean, id: string,
//     jetzt: Date): Vorgang                    // ein Ereignis gefaesspruefung { schritt, ok }, client_id = id = id
//   export function volumenVorschlag(gezaehltL: number, betriebsvolumenL: number):
//     { volumenL: number; text: string } | undefined   // nur bei |g − b| × 10 > b in ganzen ml
//   export function pruefschritt4Vorgang(teile: Teile, platzId: string, gezaehltL: number, uebernehmen: boolean,
//     ids: () => string, jetzt: Date): Vorgang
//   export interface Pruefaufgabe { platzId: string; code: string; kennung: string; titel: 'Gefäss prüfen' }
//   export function pruefAufgaben(teile: Teile, anlageIds?: readonly string[]): Pruefaufgabe[]
//     // Gefässe mit Status in_pruefung echter Anlagen, dazu die der Anlagen in anlageIds; nach Kennung sortiert
//
// Erweiterung von src/domain/anlage/gefaess.ts: pruefstatus «in Betrieb, geprüft am 1.11.» (Tag in Zürich) bei
//   in_betrieb; Nebenknopf «Prüfen» bei in_pruefung (siehe gefaess-aendern.test.ts).
// Erweiterung von src/domain/einrichtung/checkliste.ts (Punktziel):
//   | { art: 'gefaess-neu'; rolle?: 'messstelle' } | { art: 'pruefen'; code: string }
//   Punkt 4 ohne W → { art: 'gefaess-neu', rolle: 'messstelle' }; Punkt 6 → { art: 'gefaess-neu' };
//   Punkt 8 → { art: 'pruefen', code } des ersten Gefässes «in Prüfung» nach Kennung.
import { describe, expect, it } from 'vitest';
import { aenderungVorgang, leerenVorgang } from '../../src/domain/anlage/aendern.ts';
import { entfernenVorgang } from '../../src/domain/anlage/entfernen.ts';
import { erfassenVorgang } from '../../src/domain/anlage/erfassen.ts';
import { gefaessAnsicht, type Gefaessansicht } from '../../src/domain/anlage/gefaess.ts';
import { regalbild, statusBadge } from '../../src/domain/anlage/uebersicht.ts';
import { ereignisDatenPruefen, type EreignisTyp } from '../../src/domain/datenpfad/ereignisdaten.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { einrichtungsStand } from '../../src/domain/einrichtung/checkliste.ts';
import {
  kennungPruefen,
  pruefAufgaben,
  pruefschritt4Vorgang,
  pruefschrittVorgang,
  pruefStand,
  volumenVorschlag,
} from '../../src/domain/etikett/pruefung.ts';
import { einrichtungsTeile } from '../fixtures/einrichtung.ts';
import {
  ANLAGE_R,
  deckelId,
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

const folge = (praefix = '45') => {
  let n = 0;
  return () => uid(praefix, ++n);
};
const neu = (v: Vorgang, tabelle?: string) =>
  v
    .filter(
      (s): s is Extract<Schritt, { art: 'neu' }> => s.art === 'neu' && (!tabelle || s.tabelle === tabelle),
    )
    .map((s) => s.felder as Record<string, unknown>);
const minuten = (n: number) => new Date(JETZT.getTime() + n * 60_000);

type Ansicht = Gefaessansicht & { nebenknoepfe?: { art: string; text: string }[] };
const ansicht = (teile: Teile, code: string) => gefaessAnsicht(teile, code, JETZT, Z) as Ansicht | undefined;
const offeneBelegung = (t: Teile, kennung: string) =>
  (t['gefaess'] ?? []).find(
    (g) => g['platz_id'] === platzId(kennung) && g['storniert_am'] === null && g['gueltig_bis'] === null,
  );
const status = (t: Teile, kennung: string) =>
  t['v_gefaess_status']?.find((s) => s['gefaess_id'] === offeneBelegung(t, kennung)?.['id'])?.['status'];

/** Ereignis direkt in die Teile legen und die Sichten nachrechnen */
function ereignis(t: Teile, n: number, typ: string, kennung: string, gilt: Date, daten = {}): Teile {
  t['ereignis']?.push({
    id: uid('46', n),
    client_id: uid('46', n),
    typ,
    platz_id: platzId(kennung),
    daten,
    gilt_ab: gilt.toISOString(),
    storniert_am: null,
  });
  return sichtenNachrechnen(t);
}

/** 3.3 nach den Prüfschritten 1 bis 3 */
function geprueft33(): Teile {
  let t = regalTeile(JETZT);
  for (const schritt of [1, 2, 3] as const)
    t = vorgangAnwenden(
      t,
      pruefschrittVorgang(platzId('3.3'), schritt, true, uid('47', schritt), minuten(schritt)),
      minuten(schritt),
    );
  return t;
}

describe('Testhilfe', () => {
  it('nachgerechnete Sichten gleichen den festen Sichten der Fixture', () => {
    const fest = regalTeile(JETZT);
    const nach = sichtenNachrechnen(regalTeile(JETZT));
    expect(nach['v_gefaess_status']).toEqual(fest['v_gefaess_status']);
    expect(nach['v_fuellzustand']).toEqual(fest['v_fuellzustand']);
  });
});

describe('Schritt 4: Volumen (UC3-AK4)', () => {
  it('UC3-AK4 gefüllt 8.0 l statt 9 l: Vorschlag «Betriebsvolumen auf 8.0 l ändern»', () => {
    expect(volumenVorschlag(8.0, 9)).toEqual({ volumenL: 8, text: 'Betriebsvolumen auf 8.0 l ändern' });
  });

  it('UC3-AK4 8.5 l: kein Vorschlag', () => {
    expect(volumenVorschlag(8.5, 9)).toBeUndefined();
    expect(volumenVorschlag(9, 9)).toBeUndefined();
  });

  it('UC3-AK4 Grenze genau 10 % (8.1 l) ohne Vorschlag, 10.0 l mit Vorschlag', () => {
    // |8100 − 9000| × 10 = 9000, nicht grösser als 9000 (in Gleitkomma wäre 8.1 × 1000 = 8100.000000000001)
    expect(volumenVorschlag(8.1, 9)).toBeUndefined();
    expect(volumenVorschlag(9.9, 9)).toBeUndefined();
    expect(volumenVorschlag(10.0, 9)).toEqual({ volumenL: 10, text: 'Betriebsvolumen auf 10.0 l ändern' });
    expect(volumenVorschlag(2.0, 2.3)?.text).toBe('Betriebsvolumen auf 2.0 l ändern');
  });

  it('pruefschritt4Vorgang mit Übernahme: Ereignis Schritt 4 und neue Belegung', () => {
    const teile = geprueft33();
    expect(status(teile, '3.3')).toBe('in_betrieb_volumen_offen');
    const jetzt = minuten(30);
    const v = pruefschritt4Vorgang(teile, platzId('3.3'), 8.0, true, folge(), jetzt);
    expect(neu(v, 'ereignis').map((e) => [e['typ'], e['platz_id'], e['daten'], e['gilt_ab']])).toEqual([
      [
        'gefaesspruefung',
        platzId('3.3'),
        { schritt: 4, ok: true, volumen_gezaehlt_l: 8 },
        jetzt.toISOString(),
      ],
    ]);
    // neue Belegung wie beim Ändern des Volumens: Storno vor der neuen Zeile, Kopie mit gueltig_von
    const storno = v.findIndex(
      (s) => s.art === 'storno' && s.tabelle === 'gefaess' && s.clientId === gefaessId('3.3'),
    );
    expect(storno).toBeGreaterThanOrEqual(0);
    expect(storno).toBeLessThan(v.findIndex((s) => s.art === 'neu' && s.tabelle === 'gefaess'));
    expect(neu(v, 'gefaess').find((g) => g['gueltig_bis'] === null)).toMatchObject({
      betriebsvolumen_l: 8,
      gueltig_von: jetzt.toISOString(),
    });
    expect(
      v.some(
        (s) => s.art === 'neu' && ['box_deckel_tausch', 'gefaess_erfasst'].includes(String(s.felder['typ'])),
      ),
    ).toBe(false);

    const t = vorgangAnwenden(teile, v, jetzt);
    expect(status(t, '3.3')).toBe('in_betrieb');
    expect(pruefStand(t, platzId('3.3'))).toMatchObject({
      naechsterSchritt: null,
      geprueftAm: jetzt.toISOString(),
    });
    expect(ansicht(t, 'R-3.3')?.pruefstatus).toBe('in Betrieb, geprüft am 10.12.');
    expect(ansicht(t, 'R-3.3')?.merkmale).toBe('Kratky belüftet · 8 l');

    // ohne Übernahme nur das Ereignis
    const ohne = pruefschritt4Vorgang(teile, platzId('3.3'), 8.5, false, folge('48'), jetzt);
    expect(ohne.map((s) => s.tabelle)).toEqual(['ereignis']);
    expect(neu(ohne)[0]?.['daten']).toEqual({ schritt: 4, ok: true, volumen_gezaehlt_l: 8.5 });
  });
});

describe('Prüfschritte 1 bis 3', () => {
  it('pruefStand: nächster Schritt nach Ereignissen seit dem Anker, Schritte vor box_deckel_tausch zählen nicht', () => {
    let t = regalTeile(JETZT);
    expect(pruefStand(t, platzId('3.3'))).toMatchObject({ naechsterSchritt: 1, protokoll: [] });
    expect((ansicht(t, 'R-3.3')?.nebenknoepfe ?? []).map((k) => k.text)).toContain('Prüfen');

    t = vorgangAnwenden(
      t,
      pruefschrittVorgang(platzId('3.3'), 1, true, uid('47', 1), minuten(1)),
      minuten(1),
    );
    expect(pruefStand(t, platzId('3.3')).naechsterSchritt).toBe(2);
    t = vorgangAnwenden(
      t,
      pruefschrittVorgang(platzId('3.3'), 2, false, uid('47', 2), minuten(2)),
      minuten(2),
    );
    expect(pruefStand(t, platzId('3.3')).naechsterSchritt).toBe(2);
    t = vorgangAnwenden(
      t,
      pruefschrittVorgang(platzId('3.3'), 2, true, uid('47', 3), minuten(3)),
      minuten(3),
    );
    t = vorgangAnwenden(
      t,
      pruefschrittVorgang(platzId('3.3'), 3, true, uid('47', 4), minuten(4)),
      minuten(4),
    );
    const stand = pruefStand(t, platzId('3.3'));
    expect(stand.naechsterSchritt).toBe(4);
    expect(stand.protokoll.map((p) => [p.schritt, p.ok])).toEqual([
      [1, true],
      [2, false],
      [2, true],
      [3, true],
    ]);
    expect(stand.geprueftAm).toBeUndefined();
    // nach Schritt 3: «in Betrieb (Volumen offen)», Badge mit Wort
    expect(status(t, '3.3')).toBe('in_betrieb_volumen_offen');
    expect(statusBadge('in_betrieb_volumen_offen')).toBe('Volumen offen');
    expect(statusBadge('in_betrieb')).toBeUndefined();
    expect(
      regalbild(t, ANLAGE_R, JETZT, Z)
        .flatMap((z) => z.orte)
        .find((o) => o.code === 'R-3.3')?.badge,
    ).toBe('Volumen offen');

    // 2.1 ist vollständig geprüft; nach einem Deckeltausch beginnt die Prüfung neu, das Protokoll bleibt
    const r = regalTeile(JETZT);
    expect(pruefStand(r, platzId('2.1'))).toMatchObject({
      naechsterSchritt: null,
      geprueftAm: '2026-11-01T08:00:00.000Z',
    });
    expect(ansicht(r, 'R-2.1')?.pruefstatus).toBe('in Betrieb, geprüft am 1.11.');
    const getauscht = ereignis(r, 1, 'box_deckel_tausch', '2.1', minuten(-60));
    const nachTausch = pruefStand(getauscht, platzId('2.1'));
    expect(nachTausch.naechsterSchritt).toBe(1);
    expect(nachTausch.geprueftAm).toBeUndefined();
    expect(nachTausch.protokoll).toHaveLength(4);
  });

  it('Schritt 1 falsche Kennung: ok false, Aufgabe bleibt', () => {
    expect(kennungPruefen('3.3', '3.3')).toEqual({ ok: true, text: 'Richtiges Gefäss: 3.3' });
    expect(kennungPruefen('2.2', '2.3')).toEqual({ ok: false, text: 'Etikett zeigt 2.2, erwartet 2.3' });
    const pruefung = kennungPruefen('2.2', '3.3');
    expect(pruefung.ok).toBe(false);
    const v = pruefschrittVorgang(platzId('3.3'), 1, pruefung.ok, uid('47', 9), JETZT);
    expect(neu(v)).toEqual([
      {
        client_id: uid('47', 9),
        id: uid('47', 9),
        typ: 'gefaesspruefung',
        platz_id: platzId('3.3'),
        gilt_ab: JETZT.toISOString(),
        daten: { schritt: 1, ok: false },
      },
    ]);
    const t = vorgangAnwenden(regalTeile(JETZT), v, JETZT);
    expect(pruefStand(t, platzId('3.3')).naechsterSchritt).toBe(1);
    expect(pruefAufgaben(t).map((a) => a.code)).toEqual(['R-3.3']);
    expect(status(t, '3.3')).toBe('in_pruefung');
  });
});

describe('Aufgabe «Gefäss prüfen» (A7)', () => {
  it('pruefAufgaben nur «in Prüfung», nicht ruhend oder entfernt, nur echte Anlagen ohne Auswahl', () => {
    const r = regalTeile(JETZT);
    expect(pruefAufgaben(r)).toEqual([
      { platzId: platzId('3.3'), code: 'R-3.3', kennung: '3.3', titel: 'Gefäss prüfen' },
    ]);
    // 2.1 und 2.2 nach Deckeltausch wieder in Prüfung, 2.2 danach ruhend, 3.3 entfernt
    let t = ereignis(r, 1, 'box_deckel_tausch', '2.1', minuten(-60));
    t = ereignis(t, 2, 'box_deckel_tausch', '2.2', minuten(-60));
    expect(pruefAufgaben(t).map((a) => a.code)).toEqual(['R-2.1', 'R-2.2', 'R-3.3']);
    t = ereignis(t, 3, 'ruhe', '2.2', minuten(-30), { gesetzt: true });
    t = ereignis(t, 4, 'entfernt', '3.3', minuten(-30));
    expect(status(t, '2.2')).toBe('ruht');
    expect(status(t, '3.3')).toBe('entfernt');
    expect(pruefAufgaben(t).map((a) => a.code)).toEqual(['R-2.1']);

    // Demo X und Test Y nur, wenn gewählt (Datenart, 8.1 Regel 7)
    const x = weitereAnlage('X', 'demo');
    const y = weitereAnlage('Y', 'test');
    const mit = vereinen(regalTeile(JETZT), x, y);
    mit['v_gefaess_status']?.push(
      { gefaess_id: x['gefaess']?.[0]?.['id'], status: 'in_pruefung' },
      { gefaess_id: y['gefaess']?.[0]?.['id'], status: 'in_pruefung' },
    );
    expect(pruefAufgaben(mit).map((a) => a.code)).toEqual(['R-3.3']);
    const yId = String(y['anlage']?.[0]?.['id']);
    expect(pruefAufgaben(mit, [yId]).map((a) => a.code)).toEqual(['R-3.3', 'Y-2.3']);
  });
});

describe('Einrichtungs-Checkliste (Punktziele)', () => {
  it('Checkliste Punkt 6 und 8 öffnen Assistent und erstes Gefäss in Prüfung; Punkt 4 ohne W den Assistenten mit Rolle Messstelle', () => {
    const punkt = (teile: Record<string, readonly unknown[]>, nr: number) =>
      einrichtungsStand(teile, JETZT).punkte.find((p) => p.nr === nr)?.ziel;
    expect(punkt(einrichtungsTeile(3), 4)).toEqual({ art: 'gefaess-neu', rolle: 'messstelle' });
    // mit W bleibt Punkt 4 die Messung
    expect(punkt(einrichtungsTeile(4), 4)).toEqual({ art: 'messen', code: 'R-W' });
    expect(punkt(einrichtungsTeile(5), 6)).toEqual({ art: 'gefaess-neu' });
    expect(punkt(einrichtungsTeile(7), 8)).toEqual({ art: 'pruefen', code: 'R-2.3' });
    // im Regal R: erstes Gefäss in Prüfung nach Kennung
    expect(punkt(regalTeile(JETZT), 8)).toEqual({ art: 'pruefen', code: 'R-3.3' });
    const t = ereignis(regalTeile(JETZT), 1, 'box_deckel_tausch', '2.1', minuten(-60));
    expect(punkt(t, 8)).toEqual({ art: 'pruefen', code: 'R-2.1' });
  });
});

describe('Ereignisdaten', () => {
  it('Ereignisdaten aller Vorgänge bestehen ereignisDatenPruefen', () => {
    const r = regalTeile(JETZT);
    const vorgaenge: Vorgang[] = [
      erfassenVorgang(
        leeresRegal(),
        {
          rolle: 'gefaess',
          anlageId: ANLAGE_R,
          bereichId: uid('2e', 2),
          position: 3,
          betriebsart: 'dwc',
          festeDosis: false,
          luftpumpe: 'P2',
          gefaessmodellId: modellId('rako'),
          betriebsvolumenL: 9,
          deckeltypId: deckelId('D2'),
          intervalle: { messenD: 2, nachfuellenD: 2, wechselnD: 14 },
        },
        folge('49'),
        JETZT,
      ),
      pruefschrittVorgang(platzId('3.3'), 1, true, uid('49', 50), JETZT),
      pruefschrittVorgang(platzId('3.3'), 3, false, uid('49', 51), JETZT),
      pruefschritt4Vorgang(geprueft33(), platzId('3.3'), 8, true, folge('4a'), JETZT),
      aenderungVorgang(r, platzId('2.1'), { deckeltypId: deckelId('D4') }, folge('4b'), JETZT),
      aenderungVorgang(r, platzId('2.3'), { intervalle: { wechselnD: 10 } }, folge('4c'), JETZT),
      leerenVorgang(platzId('2.3'), uid('49', 52), JETZT),
      entfernenVorgang(platzId('2.1'), uid('49', 53), JETZT),
    ];
    const typen = new Set<string>();
    for (const v of vorgaenge) {
      expect(vorgangPruefen(v)).toEqual([]);
      for (const e of neu(v, 'ereignis')) {
        typen.add(String(e['typ']));
        expect(ereignisDatenPruefen(e['typ'] as EreignisTyp, e['daten'] as Record<string, unknown>)).toEqual(
          [],
        );
        expect(e['platz_id']).toBeTruthy();
        expect(e['gilt_ab']).toBe(JETZT.toISOString());
      }
    }
    expect([...typen].sort()).toEqual([
      'box_deckel_tausch',
      'entfernt',
      'gefaess_erfasst',
      'gefaesspruefung',
      'geleert',
    ]);
  });
});
