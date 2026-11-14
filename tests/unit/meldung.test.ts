// Rückgängig-Vorgang je Aktion in Heute (Issue #224, Plan 224 Entscheid 3, Testliste; U4 und TO2; R5.1, R5.3;
// Konzept 6.3, 8.1 Regel 2, 11.4). rueckgaengigVorgang() ist rein: aus dem Vorgang einer Aktion der Storno aller
// neuen Zeilen in umgekehrter Reihenfolge mit Grund «rueckgaengig»; saatRueckgaengig() liefert dasselbe. schreiben()
// mit Adapter-Attrappe ohne Netz wie tests/unit/datenpfad-runde1.test.ts; feste Uhr Di 12.1.2027 09:00 Zürich.
// Keine Personendaten.
import { describe, expect, it, vi } from 'vitest';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import { aufschubVorgang, deckelVorgang, erledigtVorgang } from '../../src/domain/aufgaben-aufschub.ts';
import type { Aufgabe } from '../../src/domain/aufgaben.ts';
import {
  rueckgaengigVorgang,
  type Schritt,
  type Vorgang,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';
import { saatRueckgaengig } from '../../src/domain/pflanzung/saeen.ts';
import { uid } from '../fixtures/regal.ts';
import { aufgabe } from './rundgang-fixture.ts';

// schreiben.ts bindet den Supabase-Client und das Bündel; im Unit-Test ohne Netz und IndexedDB
vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

const Z = 'Europe/Zurich';
const JETZT = new Date('2027-01-12T08:00:00.000Z');
const SPAETER = new Date('2027-01-12T08:00:20.000Z');
const ID = uid('e9', 1);

type Storno = Extract<Schritt, { art: 'storno' }>;
const storno = (tabelle: Storno['tabelle'], clientId: string): Storno => ({
  art: 'storno',
  tabelle,
  clientId,
  grund: 'rueckgaengig',
});

/** Aufgabe mit allen Knöpfen, die der Typ anbieten kann */
const mitKnoepfen = (a: Aufgabe): Aufgabe => ({
  ...a,
  morgen: { erlaubt: true, verschoben: 0 },
  ueberspringen: true,
  pegelOk: a.typ === 'messen_nachfuellen',
});

describe('U4 rueckgaengigVorgang() je Aktion in Heute', () => {
  const faelle: [string, () => Vorgang, Storno['tabelle']][] = [
    [
      'Erledigt (Würfel feucht)',
      () => erledigtVorgang(aufgabe('wuerfel_feucht', 'R-A1'), ID, JETZT),
      'ereignis',
    ],
    ['Deckel geöffnet', () => deckelVorgang(aufgabe('deckel_oeffnen', 'R-A3'), ID, JETZT), 'ereignis'],
    [
      'Morgen',
      () => aufschubVorgang(mitKnoepfen(aufgabe('loesung_wechseln', 'R-2.1')), 'morgen', ID, JETZT, Z),
      'aufschub',
    ],
    [
      'Überspringen',
      () => aufschubVorgang(mitKnoepfen(aufgabe('messen', 'R-3.1')), 'ueberspringen', ID, JETZT, Z),
      'aufschub',
    ],
    [
      'Pegel ok',
      () => aufschubVorgang(mitKnoepfen(aufgabe('messen_nachfuellen', 'R-1.1')), 'pegel_ok', ID, JETZT, Z),
      'aufschub',
    ],
  ];

  for (const [name, vorgang, tabelle] of faelle)
    it(`U4 rueckgaengigVorgang storniert die Zeile von «${name}» in ${tabelle} mit Grund rueckgaengig`, () => {
      const v = vorgang();
      expect(v, 'Vorbedingung: genau eine neue Zeile').toHaveLength(1);
      expect(rueckgaengigVorgang(v)).toEqual([storno(tabelle, ID)]);
    });

  it('U4 rueckgaengigVorgang storniert jeden neuen Schritt in umgekehrter Reihenfolge mit Grund rueckgaengig', () => {
    const a = uid('e9', 11);
    const b = uid('e9', 12);
    const c = uid('e9', 13);
    const v: Vorgang = Object.freeze([
      { art: 'neu', tabelle: 'satz', felder: { id: a, client_id: a } },
      { art: 'storno', tabelle: 'ereignis', clientId: uid('e9', 14), grund: 'korrektur' },
      { art: 'neu', tabelle: 'pflanzung', felder: { id: b, client_id: b } },
      { art: 'neu', tabelle: 'ereignis', felder: { id: c, client_id: c, typ: 'phase_antwort' } },
    ] satisfies Schritt[]);
    const zurueck = rueckgaengigVorgang(v);
    expect(zurueck).toEqual([storno('ereignis', c), storno('pflanzung', b), storno('satz', a)]);
    // rein: der Vorgang bleibt unverändert
    expect(v.map((s) => s.art)).toEqual(['neu', 'storno', 'neu', 'neu']);
    expect(rueckgaengigVorgang([])).toEqual([]);
  });

  it('U4 saatRueckgaengig liefert dasselbe wie rueckgaengigVorgang', () => {
    const v: Vorgang = [
      { art: 'neu', tabelle: 'pflanzvorgang', felder: { id: uid('e9', 21), client_id: uid('e9', 21) } },
      { art: 'neu', tabelle: 'satz', felder: { id: uid('e9', 22), client_id: uid('e9', 22) } },
      { art: 'neu', tabelle: 'reservierung', felder: { id: uid('e9', 23), client_id: uid('e9', 23) } },
    ];
    expect(rueckgaengigVorgang(v)).toEqual(saatRueckgaengig(v));
    const erledigt = erledigtVorgang(aufgabe('wuerfel_feucht', 'R-A1'), ID, JETZT);
    expect(rueckgaengigVorgang(erledigt)).toEqual(saatRueckgaengig(erledigt));
  });
});

describe('TO2 derselbe Rückgängig-Vorgang bei Wiederholung', () => {
  type Antwort = Awaited<ReturnType<Schreibadapter['einfuegen']>>;
  const antwort = (data: unknown): Antwort => ({ data, error: null }) as unknown as Antwort;

  it('TO2 derselbe Rückgängig-Vorgang bei Wiederholung: gleiche clientId, schreiben() meldet beim zweiten Mal gespeichert ohne neue Zeile', async () => {
    const zeilen = new Map<string, Record<string, unknown>>([[ID, { client_id: ID, storniert_am: null }]]);
    const einfuegen = vi.fn(async () => antwort([]));
    const lesen = vi.fn(async (_t: string, clientId: string) =>
      antwort([zeilen.get(clientId)].filter(Boolean)),
    );
    const stornieren = vi.fn(async (_t: string, clientId: string, felder: Record<string, unknown>) => {
      const z = zeilen.get(clientId);
      // nur ändern, wenn noch nicht storniert (Filter storniert_am is null)
      if (!z || z['storniert_am'] !== null) return antwort([]);
      Object.assign(z, felder);
      return antwort([{ ...z }]);
    });
    const adapter = { einfuegen, lesen, stornieren } as unknown as Schreibadapter;
    const schreiben = erstelleSchreiben(adapter, { appVersion: '0.1.0+test', nachErfolg: () => {} });

    // beim Melden fertig gebaut, bei jedem Tipp auf «Rückgängig machen» derselbe Vorgang
    const rueck = rueckgaengigVorgang(erledigtVorgang(aufgabe('wuerfel_feucht', 'R-A1'), ID, JETZT));
    const k1: Zeitkontext = { jetzt: JETZT, zeitzone: Z };
    const k2: Zeitkontext = { jetzt: SPAETER, zeitzone: Z };
    const erstes = await schreiben(rueck, k1);
    const zweites = await schreiben(rueck, k2);

    expect(erstes).toEqual({ status: 'gespeichert', clientIds: [ID] });
    expect(zweites).toEqual({ status: 'gespeichert', clientIds: [ID] });
    expect(einfuegen).not.toHaveBeenCalled();
    expect(stornieren.mock.calls.map((c) => c[1])).toEqual([ID, ID]);
    // die erste Zeit bleibt stehen, keine neue Zeile
    expect(zeilen.size).toBe(1);
    expect(zeilen.get(ID)).toMatchObject({ storniert_am: JETZT.toISOString(), storno_grund: 'rueckgaengig' });
  });
});
