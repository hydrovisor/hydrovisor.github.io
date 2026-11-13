// Vorrat einer Sorte: «Kein Saatgut mehr» und «Wieder vorrätig» (Issue #215, Plan 215 Testliste Unit; VR1-AK2 bis
// VR1-AK4, TO2; G1, R8.1, R12.2, R3.2; Konzept 8.1 Regeln 2 und 3, 11.4). Reine Funktionen mit fester Uhr
// JETZT = 15.1.2027 10:00 Zürich; schreiben() mit Speicher-Adapter wie TF1-AK2. Erfundene Sorten und UUIDs,
// keine Personendaten.
//
// Vorausgesetzt (Plan 215, Domäne und Datenfluss):
//   src/domain/sorten/vorrat.ts
//     type VorratTyp = 'aufgebraucht' | 'vorraetig'
//     interface VorratEreignisZeile { id; client_id; sorte_id; saatgut_id; typ; gilt_ab; erfasst_am; storniert_am }
//     interface PackungZeit { sorte_id; erfasst_am; storniert_am }
//     interface VorratStand { vorraetig: boolean; seit?: string }
//     vorratStand(ereignisse, packungen, sorteId, jetzt) → das jüngste nicht stornierte Ereignis bis jetzt (gilt_ab,
//       dann erfasst_am, dann id; auf die Mikrosekunde); «aufgebraucht» gilt nicht mehr, wenn danach (erfasst_am
//       gegen erfasst_am) eine nicht stornierte Packung der Sorte bis jetzt erfasst ist (A5)
//     vorratAus(teile, sorteId, jetzt) liest vorrat_ereignis und saatgut, fehlende Teile gelten als leer
//     vorratVerlauf(ereignisse, sorteId, jetzt) → { typ; giltAb }[], das jüngste zuerst
//     vorratVorgang({ sorteId; typ; clientId; jetzt }) → ein Schritt neu in vorrat_ereignis mit gilt_ab = jetzt
//   src/domain/sorten/saatgut.ts saatgutListe(t, jetzt?), SaatgutZeile.aufgebraucht, Status und Filter
//     «aufgebraucht», saatgutZahlen() mit drittem Feld, nachtragReihe() nur vorrätige Sorten ohne Foto
//   src/domain/pflanzung/saeen.ts sortenAuswahl(teile, jetzt?) nur vorrätige Sorten
//   src/domain/datenpfad/erfassung.ts MIT_ZEITACHSE mit vorrat_ereignis;
//   src/domain/datenpfad/buendel-teile.ts vorrat_ereignis (ohneStorno) direkt nach tuetenfoto
import { describe, expect, it, vi } from 'vitest';
import {
  vorratAus,
  vorratStand,
  vorratVerlauf,
  vorratVorgang,
  type PackungZeit,
  type VorratEreignisZeile,
  type VorratTyp,
} from '../../src/domain/sorten/vorrat.ts';
import {
  nachtragReihe,
  nachtragStarten,
  saatgutGruppen,
  saatgutListe,
  saatgutZahlen,
  type SaatgutFilter,
  type SaatgutZeile,
} from '../../src/domain/sorten/saatgut.ts';
import { sortenAuswahl } from '../../src/domain/pflanzung/saeen.ts';
import {
  MIT_GILT_AB,
  MIT_ZEITACHSE,
  vorgangPruefen,
  zeileVorbereiten,
  type Schritt,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';
import { BUENDEL_TEILE } from '../../src/domain/datenpfad/buendel-teile.ts';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import type { Teile } from '../../src/domain/teile.ts';
import { saatTeile, SORTE as SAAT_SORTE } from '../fixtures/saeen.ts';

// schreiben.ts bindet den Supabase-Client und das Bündel; im Unit-Test ohne Netz und IndexedDB
vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

const ZUERICH = 'Europe/Zurich';
// 15.1.2027 10:00 Zürich
const JETZT = new Date('2027-01-15T09:00:00.000Z');
const ZEIT: Zeitkontext = { jetzt: JETZT, zeitzone: ZUERICH };

const id = (n: number) => `21500000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SORTE = id(10);
const ANDERE_SORTE = id(11);

function ereignis(
  n: number,
  typ: VorratTyp,
  giltAb: string,
  extra: Partial<VorratEreignisZeile> = {},
): VorratEreignisZeile {
  return {
    id: id(500 + n),
    client_id: id(300 + n),
    sorte_id: SORTE,
    saatgut_id: null,
    typ,
    gilt_ab: giltAb,
    erfasst_am: giltAb,
    storniert_am: null,
    ...extra,
  };
}

function packung(erfasstAm: string, extra: Partial<PackungZeit> = {}): PackungZeit {
  return { sorte_id: SORTE, erfasst_am: erfasstAm, storniert_am: null, ...extra };
}

const stand = (e: readonly VorratEreignisZeile[], p: readonly PackungZeit[] = [], jetzt = JETZT) =>
  vorratStand(e, p, SORTE, jetzt);

// ---------------------------------------------------------------------
// VR1-AK2 Stand aus den Ereignissen
// ---------------------------------------------------------------------

describe('VR1-AK2 vorratStand', () => {
  it('VR1-AK2 ohne Ereignis ist die Sorte vorrätig, auch ohne Teil vorrat_ereignis über vorratAus()', () => {
    expect(stand([])).toEqual({ vorraetig: true });
    expect(stand([], [packung('2027-01-10T08:00:00.000Z')])).toEqual({ vorraetig: true });
    // ohne Teil vorrat_ereignis und ohne Teil saatgut
    expect(vorratAus({}, SORTE, JETZT)).toEqual({ vorraetig: true });
    expect(
      vorratAus({ sorte: [{ sorte_id: SORTE, name: 'Testsorte', gueltig_bis: null }] }, SORTE, JETZT),
    ).toEqual({ vorraetig: true });
    // vorratAus liest vorrat_ereignis und saatgut aus den Teilen
    const t: Teile = { vorrat_ereignis: [ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z')] };
    expect(vorratAus(t, SORTE, JETZT)).toEqual({ vorraetig: false, seit: '2027-01-10T08:00:00.000Z' });
    expect(
      vorratAus(
        {
          ...t,
          saatgut: [{ id: id(20), client_id: id(21), ...packung('2027-01-11T08:00:00.000Z') }],
        },
        SORTE,
        JETZT,
      ),
    ).toEqual({ vorraetig: true });
  });

  it('VR1-AK2 das jüngste nicht stornierte Ereignis bis jetzt gilt; Ereignisse anderer Sorten zählen nicht', () => {
    const auf = ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z');
    const vor = ereignis(2, 'vorraetig', '2027-01-12T08:00:00.000Z');
    expect(stand([auf, vor])).toEqual({ vorraetig: true });

    // umgekehrt: zuerst wieder vorrätig, dann aufgebraucht
    const vorFrueh = ereignis(3, 'vorraetig', '2027-01-10T08:00:00.000Z');
    const aufSpaet = ereignis(4, 'aufgebraucht', '2027-01-12T08:00:00.000Z');
    expect(stand([vorFrueh, aufSpaet])).toEqual({ vorraetig: false, seit: '2027-01-12T08:00:00.000Z' });

    // dreimal: aufgebraucht, vorrätig, aufgebraucht
    const nochmals = ereignis(5, 'aufgebraucht', '2027-01-14T08:00:00.000Z');
    expect(stand([auf, vor, nochmals])).toEqual({ vorraetig: false, seit: '2027-01-14T08:00:00.000Z' });

    // anderer Sorte: jünger, zählt nicht
    const fremd = ereignis(6, 'aufgebraucht', '2027-01-14T08:00:00.000Z', { sorte_id: ANDERE_SORTE });
    expect(stand([auf, vor, fremd])).toEqual({ vorraetig: true });
    expect(stand([fremd])).toEqual({ vorraetig: true });
    expect(vorratStand([auf, vor, fremd], [], ANDERE_SORTE, JETZT)).toEqual({
      vorraetig: false,
      seit: '2027-01-14T08:00:00.000Z',
    });
  });

  it('VR1-AK2 storniertes Ereignis zählt nicht: ein storniertes jüngeres vorraetig lässt das ältere aufgebraucht gelten', () => {
    const auf = ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z');
    const vorStorniert = ereignis(2, 'vorraetig', '2027-01-12T08:00:00.000Z', {
      storniert_am: '2027-01-12T09:00:00.000Z',
    });
    expect(stand([auf, vorStorniert])).toEqual({ vorraetig: false, seit: '2027-01-10T08:00:00.000Z' });
    // nur stornierte Ereignisse: vorrätig
    const aufStorniert = { ...auf, storniert_am: '2027-01-10T09:00:00.000Z' };
    expect(stand([aufStorniert])).toEqual({ vorraetig: true });
    expect(stand([aufStorniert, vorStorniert])).toEqual({ vorraetig: true });
  });

  it('VR1-AK2 Ereignis nach jetzt zählt nicht; gilt_ab = jetzt zählt (Grenze ≤)', () => {
    const danach = ereignis(1, 'aufgebraucht', new Date(JETZT.getTime() + 1).toISOString());
    expect(stand([danach])).toEqual({ vorraetig: true });
    const genau = ereignis(2, 'aufgebraucht', JETZT.toISOString());
    expect(stand([genau])).toEqual({ vorraetig: false, seit: JETZT.toISOString() });
    // ein künftiges «vorraetig» hebt ein gültiges «aufgebraucht» noch nicht auf
    const auf = ereignis(3, 'aufgebraucht', '2027-01-10T08:00:00.000Z');
    const vorKuenftig = ereignis(4, 'vorraetig', '2027-01-16T08:00:00.000Z');
    expect(stand([auf, vorKuenftig])).toEqual({ vorraetig: false, seit: '2027-01-10T08:00:00.000Z' });
    // am Tag danach gilt es
    expect(stand([auf, vorKuenftig], [], new Date('2027-01-16T08:00:00.000Z'))).toEqual({ vorraetig: true });
  });

  it('VR1-AK2 neue Packung nach aufgebraucht macht wieder vorrätig (erfasst_am gegen erfasst_am, bis jetzt, nicht storniert, gleiche Sorte)', () => {
    const auf = ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z');
    expect(stand([auf], [packung('2027-01-11T08:00:00.000Z')])).toEqual({ vorraetig: true });

    const bleibt = { vorraetig: false, seit: '2027-01-10T08:00:00.000Z' };
    // Packung vor dem Ereignis
    expect(stand([auf], [packung('2027-01-09T08:00:00.000Z')])).toEqual(bleibt);
    // gleicher Zeitpunkt reicht nicht
    expect(stand([auf], [packung('2027-01-10T08:00:00.000Z')])).toEqual(bleibt);
    // storniert
    expect(
      stand([auf], [packung('2027-01-11T08:00:00.000Z', { storniert_am: '2027-01-11T09:00:00.000Z' })]),
    ).toEqual(bleibt);
    // nach jetzt erfasst
    expect(stand([auf], [packung('2027-01-15T09:00:00.001Z')])).toEqual(bleibt);
    // Packung genau zu jetzt zählt
    expect(stand([auf], [packung(JETZT.toISOString())])).toEqual({ vorraetig: true });
    // andere Sorte
    expect(stand([auf], [packung('2027-01-11T08:00:00.000Z', { sorte_id: ANDERE_SORTE })])).toEqual(bleibt);
  });

  it('VR1-AK2 Packung zählt gegen erfasst_am des Ereignisses, nicht gegen gilt_ab (A5, Serverzeiten)', () => {
    // nacherfasst: gilt ab 10.1., erfasst am 12.1.
    const auf = ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z', {
      erfasst_am: '2027-01-12T08:00:00.000Z',
    });
    // Packung am 11.1. erfasst: nach gilt_ab, aber vor erfasst_am → bleibt aufgebraucht
    expect(stand([auf], [packung('2027-01-11T08:00:00.000Z')])).toEqual({
      vorraetig: false,
      seit: '2027-01-10T08:00:00.000Z',
    });
    expect(stand([auf], [packung('2027-01-12T08:00:01.000Z')])).toEqual({ vorraetig: true });
    // Mikrosekunden: eine Packung eine Mikrosekunde nach dem Ereignis zählt, gleiche Mikrosekunde nicht
    const mikro = ereignis(2, 'aufgebraucht', '2027-01-13T08:00:00.123456+00:00');
    expect(stand([mikro], [packung('2027-01-13T08:00:00.123457+00:00')])).toEqual({ vorraetig: true });
    expect(stand([mikro], [packung('2027-01-13T08:00:00.123456+00:00')])).toEqual({
      vorraetig: false,
      seit: '2027-01-13T08:00:00.123456+00:00',
    });
  });

  it('VR1-AK2 nach einer neuen Packung macht ein späteres aufgebraucht wieder aufgebraucht', () => {
    const auf = ereignis(1, 'aufgebraucht', '2027-01-10T08:00:00.000Z');
    const neuePackung = packung('2027-01-11T08:00:00.000Z');
    const aufWieder = ereignis(2, 'aufgebraucht', '2027-01-13T08:00:00.000Z');
    expect(stand([auf, aufWieder], [neuePackung])).toEqual({
      vorraetig: false,
      seit: '2027-01-13T08:00:00.000Z',
    });
  });

  it('VR1-AK2 Reihenfolge der Erfassung egal: vertauschte Ereignisse und Packungen ergeben denselben Stand', () => {
    const e = [
      ereignis(1, 'aufgebraucht', '2027-01-08T08:00:00.000Z'),
      ereignis(2, 'vorraetig', '2027-01-09T08:00:00.000Z'),
      ereignis(3, 'aufgebraucht', '2027-01-12T08:00:00.000Z'),
      ereignis(4, 'vorraetig', '2027-01-13T08:00:00.000Z', { storniert_am: '2027-01-13T09:00:00.000Z' }),
      ereignis(5, 'vorraetig', '2027-01-16T08:00:00.000Z'),
    ];
    const p = [packung('2027-01-10T08:00:00.000Z'), packung('2027-01-11T08:00:00.000Z')];
    const erwartet = { vorraetig: false, seit: '2027-01-12T08:00:00.000Z' };
    expect(stand(e, p)).toEqual(erwartet);
    expect(stand([...e].reverse(), [...p].reverse())).toEqual(erwartet);
    const [e0, e1, e2, e3, e4] = e as [
      VorratEreignisZeile,
      VorratEreignisZeile,
      VorratEreignisZeile,
      VorratEreignisZeile,
      VorratEreignisZeile,
    ];
    expect(stand([e2, e4, e0, e3, e1], p)).toEqual(erwartet);
  });

  it('VR1-AK2 Gleichstand bei gilt_ab: erfasst_am, dann id; Mikrosekunden zählen; Zeitpunkte nicht als Text', () => {
    const gleich = '2027-01-12T08:00:00.000Z';
    // gleiches gilt_ab, später erfasst gewinnt
    const a = ereignis(1, 'aufgebraucht', gleich, { erfasst_am: '2027-01-12T08:00:05.000Z' });
    const b = ereignis(2, 'vorraetig', gleich, { erfasst_am: '2027-01-12T08:00:01.000Z' });
    expect(stand([a, b])).toEqual({ vorraetig: false, seit: gleich });
    expect(stand([b, a])).toEqual({ vorraetig: false, seit: gleich });

    // gleiches gilt_ab und erfasst_am: die grössere id gewinnt
    const c = ereignis(3, 'aufgebraucht', gleich, { id: id(902) });
    const d = ereignis(4, 'vorraetig', gleich, { id: id(901) });
    expect(stand([c, d])).toEqual({ vorraetig: false, seit: gleich });
    expect(stand([d, c])).toEqual({ vorraetig: false, seit: gleich });
    const c2 = { ...c, id: id(901) };
    const d2 = { ...d, id: id(902) };
    expect(stand([c2, d2])).toEqual({ vorraetig: true });
    expect(stand([d2, c2])).toEqual({ vorraetig: true });

    // Mikrosekunden in gilt_ab: .123457 ist jünger als .123456 (Date.parse schneidet ab)
    const m1 = ereignis(5, 'vorraetig', '2027-01-12T08:00:00.123457+00:00', {
      erfasst_am: '2027-01-12T08:00:00.200000+00:00',
      id: id(801),
    });
    const m2 = ereignis(6, 'aufgebraucht', '2027-01-12T08:00:00.123456+00:00', {
      erfasst_am: '2027-01-12T08:00:00.200000+00:00',
      id: id(802),
    });
    expect(stand([m1, m2])).toEqual({ vorraetig: true });
    expect(stand([m2, m1])).toEqual({ vorraetig: true });
    // Mikrosekunden in erfasst_am bei gleichem gilt_ab
    const m3 = ereignis(7, 'aufgebraucht', gleich, {
      erfasst_am: '2027-01-12T08:00:00.123457+00:00',
      id: id(701),
    });
    const m4 = ereignis(8, 'vorraetig', gleich, {
      erfasst_am: '2027-01-12T08:00:00.123456+00:00',
      id: id(702),
    });
    expect(stand([m3, m4])).toEqual({ vorraetig: false, seit: gleich });
    expect(stand([m4, m3])).toEqual({ vorraetig: false, seit: gleich });

    // «2027-01-12T09:00+01:00» ist als Text grösser, als Zeitpunkt aber älter als 08:30Z
    const aelter = ereignis(9, 'aufgebraucht', '2027-01-12T09:00:00+01:00');
    const juenger = ereignis(10, 'vorraetig', '2027-01-12T08:30:00.000Z');
    expect(stand([aelter, juenger])).toEqual({ vorraetig: true });
    expect(stand([juenger, aelter])).toEqual({ vorraetig: true });
  });

  it('VR1-AK2 vorratVerlauf liefert die nicht stornierten Ereignisse bis jetzt, das jüngste zuerst', () => {
    const e = [
      ereignis(1, 'aufgebraucht', '2027-01-08T08:00:00.000Z'),
      ereignis(3, 'aufgebraucht', '2027-01-12T08:00:00.000Z'),
      ereignis(2, 'vorraetig', '2027-01-09T08:00:00.000Z'),
      ereignis(4, 'vorraetig', '2027-01-13T08:00:00.000Z', { storniert_am: '2027-01-13T09:00:00.000Z' }),
      ereignis(5, 'vorraetig', '2027-01-16T08:00:00.000Z'),
      ereignis(6, 'vorraetig', '2027-01-14T08:00:00.000Z', { sorte_id: ANDERE_SORTE }),
    ];
    expect(vorratVerlauf(e, SORTE, JETZT)).toEqual([
      { typ: 'aufgebraucht', giltAb: '2027-01-12T08:00:00.000Z' },
      { typ: 'vorraetig', giltAb: '2027-01-09T08:00:00.000Z' },
      { typ: 'aufgebraucht', giltAb: '2027-01-08T08:00:00.000Z' },
    ]);
    expect(vorratVerlauf([...e].reverse(), SORTE, JETZT)).toEqual(vorratVerlauf(e, SORTE, JETZT));
    expect(vorratVerlauf([], SORTE, JETZT)).toEqual([]);
    expect(vorratVerlauf(e, ANDERE_SORTE, JETZT)).toEqual([
      { typ: 'vorraetig', giltAb: '2027-01-14T08:00:00.000Z' },
    ]);
  });
});

// ---------------------------------------------------------------------
// VR1-AK3 Schreibweg: ein Ereignis, nichts storniert
// ---------------------------------------------------------------------

describe('VR1-AK3 vorratVorgang und Schreibweg', () => {
  it('VR1-AK3 Kein Saatgut mehr und Wieder vorrätig ergeben je genau einen Schritt neu in vorrat_ereignis mit client_id, sorte_id, typ, gilt_ab = jetzt und saatgut_id null', () => {
    for (const typ of ['aufgebraucht', 'vorraetig'] as const) {
      const v = vorratVorgang({ sorteId: SORTE, typ, clientId: id(401), jetzt: JETZT });
      expect(v).toEqual([
        {
          art: 'neu',
          tabelle: 'vorrat_ereignis',
          felder: {
            client_id: id(401),
            sorte_id: SORTE,
            saatgut_id: null,
            typ,
            gilt_ab: JETZT.toISOString(),
          },
        },
      ]);
      expect(vorgangPruefen(v)).toEqual([]);
    }
  });

  it('VR1-AK3 kein Schritt storniert oder setzt etwas, keine Tabelle saatgut, pflanzung, ereignis', () => {
    for (const typ of ['aufgebraucht', 'vorraetig'] as const) {
      const v: readonly Schritt[] = vorratVorgang({ sorteId: SORTE, typ, clientId: id(402), jetzt: JETZT });
      expect(v).toHaveLength(1);
      for (const s of v) {
        expect(s.art).toBe('neu');
        expect(s.tabelle).toBe('vorrat_ereignis');
        expect(['saatgut', 'pflanzung', 'ereignis', 'satz', 'tuetenfoto']).not.toContain(s.tabelle);
      }
    }
  });

  it('VR1-AK3 vorrat_ereignis ist im Bündel mit ohneStorno direkt nach tuetenfoto und in MIT_ZEITACHSE', () => {
    const i = BUENDEL_TEILE.findIndex((t) => t.name === 'vorrat_ereignis');
    expect(i).toBeGreaterThanOrEqual(0);
    const teil = BUENDEL_TEILE[i];
    expect(teil?.ohneStorno).toBe(true);
    expect(teil?.gueltig).toBeUndefined();
    expect(teil?.fensterTage).toBeUndefined();
    expect(teil?.tabelle).toBeUndefined();
    expect(BUENDEL_TEILE[i - 1]?.name).toBe('tuetenfoto');

    expect(MIT_ZEITACHSE.has('vorrat_ereignis')).toBe(true);
    expect(MIT_GILT_AB.has('vorrat_ereignis')).toBe(true);
    // zeileVorbereiten behält das gilt_ab des Vorgangs und setzt client_zeit aus dem Kontext
    const [schritt] = vorratVorgang({ sorteId: SORTE, typ: 'aufgebraucht', clientId: id(403), jetzt: JETZT });
    if (schritt?.art !== 'neu') throw new Error('Schritt neu erwartet');
    const spaeter = new Date('2027-01-15T09:05:00.000Z');
    const zeile = zeileVorbereiten(schritt, { jetzt: spaeter, zeitzone: ZUERICH }, '0.1.0+test');
    expect(zeile['gilt_ab']).toBe(JETZT.toISOString());
    expect(zeile['client_zeit']).toBe(spaeter.toISOString());
    expect(zeile['app_version']).toBe('0.1.0+test');
  });

  it('VR1-AK3 TO2 derselbe Vorgang zweimal über erstelleSchreiben ergibt eine Zeile und gespeichert', async () => {
    // Server im Speicher: Upsert ohne Überschreiben je client_id, Storno nur solange storniert_am leer ist
    const zeilen = new Map<string, Record<string, unknown>>();
    const einfuegen = vi.fn(async (_t: string, z: Record<string, unknown>) => {
      const cid = String(z['client_id']);
      if (zeilen.has(cid)) return { data: [], error: null };
      const neu = {
        ...z,
        storniert_am: null,
        storno_grund: null,
        erfasst_am: '2027-01-15T09:00:01.000+00:00',
      };
      zeilen.set(cid, neu);
      return { data: [neu], error: null };
    });
    const lesen = vi.fn(async (_t: string, cid: string) => ({
      data: zeilen.has(cid) ? [zeilen.get(cid)] : [],
      error: null,
    }));
    const stornieren = vi.fn(async (_t: string, cid: string, felder: Record<string, unknown>) => {
      const z = zeilen.get(cid);
      if (!z || z['storniert_am'] !== null) return { data: [], error: null };
      Object.assign(z, felder);
      return { data: [z], error: null };
    });
    const adapter = { einfuegen, lesen, stornieren, setzen: vi.fn() } as unknown as Schreibadapter;
    const nachErfolg = vi.fn();
    const schreibe = erstelleSchreiben(adapter, { appVersion: '0.1.0+test', nachErfolg });

    const vorgang = vorratVorgang({ sorteId: SORTE, typ: 'aufgebraucht', clientId: id(404), jetzt: JETZT });
    expect(await schreibe(vorgang, ZEIT)).toEqual({ status: 'gespeichert', clientIds: [id(404)] });
    // zweites Senden später (anderes kontext.jetzt): nicht «abweichend», keine zweite Zeile
    const spaeter: Zeitkontext = { jetzt: new Date('2027-01-15T09:02:00.000Z'), zeitzone: ZUERICH };
    expect(await schreibe(vorgang, spaeter)).toEqual({ status: 'gespeichert', clientIds: [id(404)] });

    expect([...zeilen.keys()]).toEqual([id(404)]);
    const z = zeilen.get(id(404));
    expect(z).toMatchObject({
      client_id: id(404),
      sorte_id: SORTE,
      saatgut_id: null,
      typ: 'aufgebraucht',
      gilt_ab: JETZT.toISOString(),
      client_zeit: JETZT.toISOString(),
      app_version: '0.1.0+test',
      storniert_am: null,
    });
    for (const [tabelle] of einfuegen.mock.calls) expect(tabelle).toBe('vorrat_ereignis');
    expect(stornieren).not.toHaveBeenCalled();
    expect(nachErfolg).toHaveBeenCalledTimes(2);

    // ein Storno über den Schreibweg (Fehlerfassung) sendet storno_grund (Tabelle mit Zeitachse)
    const storno: Schritt = {
      art: 'storno',
      tabelle: 'vorrat_ereignis',
      clientId: id(404),
      grund: 'fehleingabe',
    };
    expect(await schreibe([storno], ZEIT)).toEqual({ status: 'gespeichert', clientIds: [id(404)] });
    expect(stornieren.mock.calls[0]?.[2]).toEqual({
      storniert_am: JETZT.toISOString(),
      storno_grund: 'fehleingabe',
    });
  });
});

// ---------------------------------------------------------------------
// VR1-AK4 Saatgut-Liste, Filter, Fotos nachtragen und Säen
// ---------------------------------------------------------------------

const ROXETTE = id(1);
const BABYLEAF = id(2);
const MISOME = id(3);
const LOLLO = id(4);
const KUENFTIG = id(5);
const gueltig = { gueltig_bis: null };

function foto(n: number, sorteId: string) {
  return {
    id: id(100 + n),
    client_id: id(200 + n),
    sorte_id: sorteId,
    saatgut_id: null,
    seite: 'vorne',
    pfad: `${sorteId}/${id(600 + n)}.jpg`,
    erfasst_am: '2027-01-05T10:00:00.000Z',
    storniert_am: null,
    app_version: 'test',
  };
}

function packungZeile(n: number, sorteId: string, erfasstAm: string) {
  return {
    id: id(700 + n),
    client_id: id(750 + n),
    sorte_id: sorteId,
    kaufdatum: null,
    bestand_korn: null,
    keimfaehigkeit_packung: null,
    erfasst_am: erfasstAm,
    storniert_am: null,
  };
}

/**
 * Salat: Roxette (Foto, vollständig), Babyleaf (ohne Foto, aufgebraucht und wieder vorrätig), Lollo (Foto,
 * aufgebraucht); Pak Choi: Misome (ohne Foto, aufgebraucht); Nüsslisalat: Künftig (ohne Foto, «aufgebraucht» erst
 * nach JETZT).
 */
function teile(): Teile {
  return {
    art: [
      { art_id: 'lactuca_sativa', name_de: 'Salat', name_wiss: 'Lactuca sativa', ...gueltig },
      { art_id: 'brassica_rapa_chinensis', name_de: 'Pak Choi', name_wiss: 'Brassica rapa', ...gueltig },
      {
        art_id: 'valerianella_locusta',
        name_de: 'Nüsslisalat',
        name_wiss: 'Valerianella locusta',
        ...gueltig,
      },
    ],
    sorte: [
      { sorte_id: ROXETTE, name: 'Roxette', art_id: 'lactuca_sativa', kulturtyp: 'blatt', ...gueltig },
      {
        sorte_id: BABYLEAF,
        name: 'Babyleaf-Mischung',
        art_id: 'lactuca_sativa',
        kulturtyp: 'blatt',
        ...gueltig,
      },
      { sorte_id: LOLLO, name: 'Lollo Rossa Loka', art_id: 'lactuca_sativa', kulturtyp: 'blatt', ...gueltig },
      { sorte_id: MISOME, name: 'Misome', art_id: 'brassica_rapa_chinensis', kulturtyp: 'blatt', ...gueltig },
      {
        sorte_id: KUENFTIG,
        name: 'Testsorte Künftig',
        art_id: 'valerianella_locusta',
        kulturtyp: 'blatt',
        ...gueltig,
      },
    ],
    v_vollstaendigkeit: [
      { sorte_id: ROXETTE, fehlende_groessen: 0, pruefauftraege: 0, vollstaendig: true },
      { sorte_id: LOLLO, fehlende_groessen: 0, pruefauftraege: 0, vollstaendig: true },
      { sorte_id: MISOME, fehlende_groessen: 2, pruefauftraege: 1, vollstaendig: false },
    ],
    tuetenfoto: [foto(1, ROXETTE), foto(2, LOLLO)],
    saatgut: [
      packungZeile(1, ROXETTE, '2026-12-01T10:00:00.000Z'),
      packungZeile(2, MISOME, '2026-12-01T10:00:00.000Z'),
      packungZeile(3, LOLLO, '2026-12-01T10:00:00.000Z'),
    ],
    vorrat_ereignis: [
      ereignis(11, 'aufgebraucht', '2027-01-10T08:00:00.000Z', { sorte_id: MISOME }),
      ereignis(12, 'aufgebraucht', '2027-01-11T08:00:00.000Z', { sorte_id: LOLLO }),
      ereignis(13, 'aufgebraucht', '2027-01-05T08:00:00.000Z', { sorte_id: BABYLEAF }),
      ereignis(14, 'vorraetig', '2027-01-06T08:00:00.000Z', { sorte_id: BABYLEAF }),
      ereignis(15, 'aufgebraucht', '2027-01-20T08:00:00.000Z', { sorte_id: KUENFTIG }),
    ],
  };
}

const zeile = (liste: readonly SaatgutZeile[], sorteId: string) => liste.find((s) => s.sorteId === sorteId);
const ids = (gruppen: { sorten: readonly SaatgutZeile[] }[]) =>
  gruppen.flatMap((g) => g.sorten.map((s) => s.sorteId)).sort();

describe('VR1-AK4 Saatgut-Liste und Säen', () => {
  it('VR1-AK4 saatgutListe mit jetzt: aufgebrauchte Sorte hat Status aufgebraucht, übrige wie bisher', () => {
    const liste = saatgutListe(teile(), JETZT);
    expect(liste).toHaveLength(5);
    expect(zeile(liste, MISOME)).toMatchObject({
      artName: 'Pak Choi',
      aufgebraucht: true,
      status: 'aufgebraucht',
      vollstaendig: false,
      ohneFoto: true,
    });
    expect(zeile(liste, LOLLO)).toMatchObject({
      aufgebraucht: true,
      status: 'aufgebraucht',
      vollstaendig: true,
      ohneFoto: false,
      fotoPfad: `${LOLLO}/${id(602)}.jpg`,
    });
    expect(zeile(liste, ROXETTE)).toMatchObject({
      aufgebraucht: false,
      status: 'vollständig',
      ohneFoto: false,
    });
    // aufgebraucht und wieder vorrätig
    expect(zeile(liste, BABYLEAF)).toMatchObject({
      aufgebraucht: false,
      status: 'Recherche offen',
      ohneFoto: true,
    });
    // «aufgebraucht» erst nach jetzt: noch vorrätig
    expect(zeile(liste, KUENFTIG)).toMatchObject({ aufgebraucht: false, status: 'Recherche offen' });
    // ohne jetzt gibt es keine obere Zeitgrenze (A7): auch das künftige Ereignis zählt
    expect(zeile(saatgutListe(teile()), KUENFTIG)).toMatchObject({
      aufgebraucht: true,
      status: 'aufgebraucht',
    });
    // ohne Teil vorrat_ereignis ist jede Sorte vorrätig
    const ohne = { ...teile() } as Record<string, unknown>;
    delete ohne['vorrat_ereignis'];
    expect(saatgutListe(ohne as Teile, JETZT).every((s) => !s.aufgebraucht)).toBe(true);
  });

  it('VR1-AK4 Filter Vorrätig ohne aufgebrauchte, Aufgebraucht nur aufgebrauchte, Ohne Foto nur vorrätige ohne Foto; leere Gruppen fallen weg', () => {
    const liste = saatgutListe(teile(), JETZT);
    const vorraetig = saatgutGruppen(liste, 'vorraetig');
    expect(ids(vorraetig)).toEqual([ROXETTE, BABYLEAF, KUENFTIG].sort());
    expect(vorraetig.map((g) => g.gemuese)).toEqual(['Nüsslisalat', 'Salat']);

    const aufgebraucht = saatgutGruppen(liste, 'aufgebraucht');
    expect(ids(aufgebraucht)).toEqual([MISOME, LOLLO].sort());
    expect(aufgebraucht.map((g) => g.gemuese)).toEqual(['Pak Choi', 'Salat']);
    for (const g of aufgebraucht) for (const s of g.sorten) expect(s.status).toBe('aufgebraucht');

    const ohneFoto = saatgutGruppen(liste, 'ohne_foto');
    // Misome hat kein Foto, ist aber aufgebraucht: fehlt; Pak Choi fällt weg
    expect(ids(ohneFoto)).toEqual([BABYLEAF, KUENFTIG].sort());
    expect(ohneFoto.map((g) => g.gemuese)).toEqual(['Nüsslisalat', 'Salat']);

    for (const f of ['vorraetig', 'ohne_foto', 'aufgebraucht'] as SaatgutFilter[])
      expect(saatgutGruppen([], f)).toEqual([]);
  });

  it('VR1-AK4 saatgutZahlen stimmt mit den drei gefilterten Gruppen überein', () => {
    const liste = saatgutListe(teile(), JETZT);
    const zahlen = saatgutZahlen(liste);
    expect(zahlen).toEqual({ vorraetig: 3, ohneFoto: 2, aufgebraucht: 2 });
    const anzahl = (f: SaatgutFilter) => saatgutGruppen(liste, f).reduce((n, g) => n + g.sorten.length, 0);
    expect(zahlen.vorraetig).toBe(anzahl('vorraetig'));
    expect(zahlen.ohneFoto).toBe(anzahl('ohne_foto'));
    expect(zahlen.aufgebraucht).toBe(anzahl('aufgebraucht'));
    expect(saatgutZahlen([])).toEqual({ vorraetig: 0, ohneFoto: 0, aufgebraucht: 0 });
  });

  it('VR1-AK4 nachtragReihe und nachtragStarten enthalten keine aufgebrauchte Sorte', () => {
    const liste = saatgutListe(teile(), JETZT);
    expect(nachtragReihe(liste)).toEqual([
      { sorteId: KUENFTIG, name: 'Testsorte Künftig', artName: 'Nüsslisalat' },
      { sorteId: BABYLEAF, name: 'Babyleaf-Mischung', artName: 'Salat' },
    ]);
    const start = nachtragStarten(liste);
    expect(start.reihe.map((e) => e.sorteId)).not.toContain(MISOME);
    expect(start.reihe).toHaveLength(2);
  });

  it('VR1-AK4 sortenAuswahl mit jetzt enthält nur vorrätige Sorten; Wie letztes Mal entfällt, wenn diese Sorte aufgebraucht ist', () => {
    // Fixture Säen: Satz Lollo Rossa in 2.3 → Lollo Rossa trägt «Wie letztes Mal»
    const saatJetzt = new Date('2027-01-07T08:00:00Z');
    const basis = saatTeile(saatJetzt);
    const ohneEreignis = sortenAuswahl(basis, saatJetzt);
    expect(ohneEreignis[0]?.sorteId).toBe(SAAT_SORTE.lollo);
    expect(ohneEreignis[0]?.wieLetztesMal).toBeDefined();
    const alle = ohneEreignis.map((s) => s.sorteId);
    expect(alle).toContain(SAAT_SORTE.eichblatt);

    // Eichblatt aufgebraucht: fehlt, Lollo Rossa bleibt zuerst
    const eichblattWeg: Teile = {
      ...basis,
      vorrat_ereignis: [
        ereignis(21, 'aufgebraucht', '2027-01-05T08:00:00.000Z', { sorte_id: SAAT_SORTE.eichblatt }),
      ],
    };
    const ohneEichblatt = sortenAuswahl(eichblattWeg, saatJetzt);
    expect(ohneEichblatt.map((s) => s.sorteId)).toEqual(alle.filter((s) => s !== SAAT_SORTE.eichblatt));
    expect(ohneEichblatt[0]?.sorteId).toBe(SAAT_SORTE.lollo);
    expect(ohneEichblatt[0]?.wieLetztesMal).toBeDefined();

    // Lollo Rossa aufgebraucht: fehlt, keine Sorte trägt «Wie letztes Mal»
    const lolloWeg: Teile = {
      ...basis,
      vorrat_ereignis: [
        ereignis(22, 'aufgebraucht', '2027-01-05T08:00:00.000Z', { sorte_id: SAAT_SORTE.lollo }),
      ],
    };
    const ohneLollo = sortenAuswahl(lolloWeg, saatJetzt);
    expect(ohneLollo.map((s) => s.sorteId)).not.toContain(SAAT_SORTE.lollo);
    expect(ohneLollo).toHaveLength(alle.length - 1);
    expect(ohneLollo.some((s) => s.wieLetztesMal !== undefined)).toBe(false);

    // Ereignis nach jetzt zählt nicht
    const kuenftig: Teile = {
      ...basis,
      vorrat_ereignis: [
        ereignis(23, 'aufgebraucht', '2027-01-08T08:00:00.000Z', { sorte_id: SAAT_SORTE.lollo }),
      ],
    };
    expect(sortenAuswahl(kuenftig, saatJetzt).map((s) => s.sorteId)).toContain(SAAT_SORTE.lollo);
    // ohne Teil vorrat_ereignis und ohne jetzt: alle Sorten wie bisher
    expect(sortenAuswahl(basis).map((s) => s.sorteId)).toEqual(alle);
  });

  it('VR1-AK4 neue Packung bringt die Sorte in Liste und Säen zurück', () => {
    // Saatgut-Liste: neue Packung für Misome nach dem «aufgebraucht»
    const t = teile();
    const mitPackung: Teile = {
      ...t,
      saatgut: [...(t['saatgut'] ?? []), packungZeile(9, MISOME, '2027-01-12T08:00:00.000Z')],
    };
    const liste = saatgutListe(mitPackung, JETZT);
    expect(zeile(liste, MISOME)).toMatchObject({ aufgebraucht: false, status: 'Recherche offen' });
    expect(ids(saatgutGruppen(liste, 'vorraetig'))).toContain(MISOME);
    expect(ids(saatgutGruppen(liste, 'aufgebraucht'))).toEqual([LOLLO]);
    expect(nachtragReihe(liste).map((e) => e.sorteId)).toContain(MISOME);

    // Säen: Lollo Rossa aufgebraucht, danach eine neue Packung
    const saatJetzt = new Date('2027-01-07T08:00:00Z');
    const basis = saatTeile(saatJetzt);
    const weg: Teile = {
      ...basis,
      vorrat_ereignis: [
        ereignis(24, 'aufgebraucht', '2027-01-05T08:00:00.000Z', { sorte_id: SAAT_SORTE.lollo }),
      ],
    };
    expect(sortenAuswahl(weg, saatJetzt).map((s) => s.sorteId)).not.toContain(SAAT_SORTE.lollo);
    const zurueck: Teile = {
      ...weg,
      saatgut: [
        ...(basis['saatgut'] ?? []),
        { ...packungZeile(10, SAAT_SORTE.lollo, '2027-01-06T08:00:00.000Z') },
      ],
    };
    const auswahl = sortenAuswahl(zurueck, saatJetzt);
    expect(auswahl[0]?.sorteId).toBe(SAAT_SORTE.lollo);
    expect(auswahl[0]?.wieLetztesMal).toBeDefined();
  });
});
