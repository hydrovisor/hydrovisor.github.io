// B3 aus #216: Satz-Storno nur nach dem Storno seiner Pflanzungen (Issue #219, Plan 219 Testliste NB1-AK11, A11;
// Issue A1; R8.1; UC5 U4; Konzept 8.1 Regel 2, 11.4). Injizierte Uhr 7.1.2027 09:00 Zürich, Zeitzone
// Europe/Zurich; Regal R und Wissen aus tests/fixtures/saeen.ts; schreiben() mit Speicher-Adapter ohne Netz.
// Keine Personendaten.
//
// Vertrag: saatRueckgaengig(vorgang) storniert alle Zeilen des Vorgangs in umgekehrter Reihenfolge (Grund
// rueckgaengig); schreiben() bricht beim ersten Fehler ab. Kein anderer Schritt in src/ storniert die Tabelle satz.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Schritt, Vorgang, Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';
import {
  saatEingabePruefen,
  saatRueckgaengig,
  saatVorgang,
  type SaatEingabe,
} from '../../src/domain/pflanzung/saeen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import { netztopfId, platzId, uid } from '../fixtures/regal.ts';
import { ANLAGE_R, saatTeile, SORTE } from '../fixtures/saeen.ts';

// schreiben.ts bindet den Supabase-Client und das Bündel; im Unit-Test ohne Netz und IndexedDB
vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

const JETZT = new Date('2027-01-07T08:00:00Z');
const Z = ZEITZONE;
const ZEIT: Zeitkontext = { jetzt: JETZT, zeitzone: Z };
const BEGONNEN = new Date('2027-01-07T07:58:30Z');

function neueIds(praefix: string): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
type Storno = Extract<Schritt, { art: 'storno' }>;
const neue = (v: Vorgang, tabelle: string) =>
  v.filter((s): s is Neu => s.art === 'neu' && s.tabelle === tabelle).map((s) => s.felder);
const toepfe = (...k: string[]) => k.map((x) => netztopfId(x));

/** zwei Sätze Salat in A1 mit Zieltöpfen in 2.1 (Reservierungen) */
const zweiSaetze = (): SaatEingabe => ({
  anlageId: ANLAGE_R,
  einstieg: 'scan',
  begonnenAm: BEGONNEN,
  saatdatum: '2027-01-07',
  zielPlatzId: platzId('2.1'),
  saetze: [
    {
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      boxPlatzId: platzId('A1'),
      zieltopfIds: toepfe('2.1.1', '2.1.2', '2.1.3'),
    },
    {
      sorteId: SORTE.eichblatt,
      kulturform: 'kopf',
      boxPlatzId: platzId('A1'),
      zieltopfIds: toepfe('2.1.4', '2.1.5'),
    },
  ],
});

/** zwei Sätze Direktsaat in 3.1 */
const direktsaat = (): SaatEingabe => ({
  anlageId: ANLAGE_R,
  einstieg: 'scan',
  begonnenAm: BEGONNEN,
  saatdatum: '2027-01-07',
  zielPlatzId: platzId('3.1'),
  saetze: [
    { sorteId: SORTE.rucola, kulturform: 'babyleaf', zieltopfIds: toepfe('3.1.1', '3.1.2', '3.1.3') },
    { sorteId: SORTE.eichblatt, kulturform: 'babyleaf', zieltopfIds: toepfe('3.1.4') },
  ],
});

function vorgang(e: SaatEingabe, praefix: string): Vorgang {
  const t = saatTeile(JETZT);
  expect(saatEingabePruefen(t, e, JETZT, Z)).toEqual([]);
  const v = saatVorgang(t, e, neueIds(praefix), JETZT, Z);
  expect(v.length).toBeGreaterThan(0);
  return v;
}

/** Index des Stornos je client_id in der Rückgängig-Folge */
function stornoIndex(r: Vorgang): Map<string, number> {
  const m = new Map<string, number>();
  r.forEach((s, i) => {
    if (s.art === 'storno') m.set(s.clientId, i);
  });
  return m;
}

describe('NB1-AK11 saatRueckgaengig', () => {
  it('NB1-AK11 jede Pflanzung und Reservierung wird vor ihrem Satz storniert (zwei Sätze, mit Reservierung und Direktsaat)', () => {
    for (const [e, praefix] of [
      [zweiSaetze(), '5b'],
      [direktsaat(), '5c'],
    ] as const) {
      const v = vorgang(e, praefix);
      const saetze = neue(v, 'satz');
      const pflanzungen = neue(v, 'pflanzung');
      const reservierungen = neue(v, 'reservierung');
      expect(saetze).toHaveLength(2);
      expect(reservierungen.length).toBeGreaterThan(0);
      if (praefix === '5c') for (const s of saetze) expect(s['direktsaat_platz_id']).toBe(platzId('3.1'));

      const r = saatRueckgaengig(v);
      // jede neue Zeile genau einmal storniert, Grund rueckgaengig
      expect(r).toHaveLength(v.length);
      for (const s of r) {
        expect(s.art).toBe('storno');
        expect((s as Storno).grund).toBe('rueckgaengig');
      }
      const index = stornoIndex(r);
      expect(index.size).toBe(v.length);

      for (const satz of saetze) {
        const satzId = String(satz['client_id']);
        const satzIndex = index.get(satzId);
        expect(satzIndex, `Satz ${satzId} nicht storniert`).toBeDefined();
        expect(r[satzIndex ?? -1]?.tabelle).toBe('satz');
        const eigene = pflanzungen.filter((p) => p['satz_id'] === satzId).map((p) => String(p['client_id']));
        expect(eigene.length).toBeGreaterThan(0);
        const eigeneReservierungen = reservierungen
          .filter((x) => eigene.includes(String(x['pflanzung_id'])))
          .map((x) => String(x['client_id']));
        for (const id of [...eigene, ...eigeneReservierungen]) {
          const i = index.get(id);
          expect(i, `Storno ${id} fehlt`).toBeDefined();
          expect(i ?? Infinity).toBeLessThan(satzIndex ?? -1);
        }
        // jede Reservierung vor ihrer Pflanzung
        for (const x of reservierungen.filter((y) => eigene.includes(String(y['pflanzung_id']))))
          expect(index.get(String(x['client_id'])) ?? Infinity).toBeLessThan(
            index.get(String(x['pflanzung_id'])) ?? -1,
          );
      }
      // der Pflanzvorgang zuletzt
      expect(r.at(-1)?.tabelle).toBe('pflanzvorgang');
    }
  });

  it('NB1-AK11 scheitert ein Storno, sendet schreiben() das Satz-Storno nicht', async () => {
    const v = vorgang(zweiSaetze(), '5d');
    const r = saatRueckgaengig(v);
    const gesendet: { tabelle: string; clientId: string }[] = [];
    const stornieren = vi.fn(async (tabelle: string, clientId: string, felder: Record<string, unknown>) => {
      gesendet.push({ tabelle, clientId });
      // das zweite Storno scheitert am Netz
      if (gesendet.length === 2) return { data: null, error: { message: 'Failed to fetch' } };
      return { data: [{ client_id: clientId, ...felder }], error: null };
    });
    const adapter = {
      einfuegen: vi.fn(),
      lesen: vi.fn(async () => ({ data: [], error: null })),
      stornieren,
      setzen: vi.fn(),
    } as unknown as Schreibadapter;
    const nachErfolg = vi.fn();
    const schreibe = erstelleSchreiben(adapter, { appVersion: '0.1.0+test', nachErfolg });

    const ergebnis = await schreibe(r, ZEIT);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    expect(gesendet).toHaveLength(2);
    // die ersten beiden Schritte sind Reservierungen oder Pflanzungen, nie ein Satz
    expect(gesendet.map((g) => g.tabelle)).toEqual(r.slice(0, 2).map((s) => s.tabelle));
    expect(gesendet.some((g) => g.tabelle === 'satz')).toBe(false);
    expect(stornieren.mock.calls.some(([tabelle]) => tabelle === 'satz')).toBe(false);
    expect(nachErfolg).not.toHaveBeenCalled();

    // scheitert das Storno einer Pflanzung direkt vor dem Satz, erreicht das Satz-Storno den Adapter ebenfalls nicht
    const vorSatz = r.findIndex((s) => s.tabelle === 'satz') - 1;
    expect(r[vorSatz]?.tabelle).toBe('pflanzung');
    gesendet.length = 0;
    const scheitertVorSatz = {
      ...adapter,
      stornieren: vi.fn(async (tabelle: string, clientId: string) => {
        gesendet.push({ tabelle, clientId });
        if (gesendet.length === vorSatz + 1) return { data: null, error: { message: 'Failed to fetch' } };
        return { data: [{ client_id: clientId }], error: null };
      }),
    } as unknown as Schreibadapter;
    const zweites = await erstelleSchreiben(scheitertVorSatz, { appVersion: '0.1.0+test', nachErfolg })(
      r,
      ZEIT,
    );
    expect(zweites.status).toBe('nicht_gespeichert');
    expect(gesendet).toHaveLength(vorSatz + 1);
    expect(gesendet.some((g) => g.tabelle === 'satz')).toBe(false);
  });

  it('NB1-AK11 kein anderer Schritt in src/ storniert die Tabelle satz', () => {
    const dateien: string[] = [];
    const sammeln = (ordner: string) => {
      for (const name of readdirSync(ordner)) {
        const pfad = join(ordner, name);
        if (statSync(pfad).isDirectory()) sammeln(pfad);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) dateien.push(pfad);
      }
    };
    sammeln('src');
    expect(dateien.length).toBeGreaterThan(50);

    // ein Storno mit fester Tabelle satz: Objekt mit art 'storno' und tabelle 'satz' (in beliebiger Reihenfolge) oder
    // eine Hilfsfunktion storno('satz', …)
    const muster = [
      /art:\s*'storno'[^{}]*tabelle:\s*'satz'/,
      /tabelle:\s*'satz'[^{}]*art:\s*'storno'/,
      /\bstorno\w*\(\s*'satz'/,
      /from\(\s*'satz'\s*\)[\s\S]{0,200}storniert_am/,
    ];
    const treffer = dateien.filter((d) => {
      const text = readFileSync(d, 'utf8');
      return muster.some((m) => m.test(text));
    });
    expect(treffer).toEqual([]);

    // einziger Weg zum Satz-Storno: saatRueckgaengig storniert die Zeilen des eigenen Vorgangs in umgekehrter Folge
    const saeen = readFileSync('src/domain/pflanzung/saeen.ts', 'utf8');
    const rueck = saeen.slice(saeen.indexOf('export function saatRueckgaengig('));
    expect(rueck).toMatch(/\.reverse\(\)/);
    expect(rueck).toMatch(/art:\s*'storno',\s*tabelle:\s*s\.tabelle/);
  });
});
