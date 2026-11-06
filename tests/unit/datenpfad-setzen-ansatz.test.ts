// Schritt «setzen» für den Neuansatz (Plan 29 Abschnitt SETZBAR und Testliste; Plan 22 A2; Konzept 8.1 Regel 2, 11.4,
// R4.7, TO2): nur ec_erwartet_final und k_vorschlag, je nur solange leer. Alle anderen Spalten von
// naehrloesungsansatz, besonders die sechs Zustandsfelder, werden vor dem Senden abgelehnt. Fake-Adapter für den
// Ablauf, nachgebildeter supabase-js-Client für den Supabase-Adapter (wie tests/unit/datenpfad-setzen.test.ts).
//
// Vertrag (Plan 29, vom Testentwickler festgelegt, wo der Plan offen ist):
//   src/domain/datenpfad/erfassung.ts
//     SETZBAR.naehrloesungsansatz = ['ec_erwartet_final', 'k_vorschlag']; SETZBAR.etikett bleibt ['gedruckt_am']
//     Schritt setzen lässt tabelle 'naehrloesungsansatz' mit felder { ec_erwartet_final?: number; k_vorschlag?: number }
//   src/daten/schreiben.ts unverändert: update(felder).eq('client_id', id).is(<feld>, null) je Feld; 0 Zeilen und das
//   Feld steht schon → bestätigt; Zeile fehlt → «Nicht gespeichert: Eintrag nicht gefunden …».
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SETZBAR,
  vorgangPruefen,
  type Schritt,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';
import {
  erstelleSchreiben,
  schreiben,
  TEXT_NICHT_GEFUNDEN,
  type Schreibadapter,
} from '../../src/daten/schreiben.ts';

const supa = vi.hoisted(() => {
  type Aufruf = { methode: string; argumente: unknown[] };
  const ketten: { tabelle: string; aufrufe: Aufruf[] }[] = [];
  const antworten: unknown[] = [];
  const kette = (tabelle: string) => {
    const eintrag = { tabelle, aufrufe: [] as Aufruf[] };
    ketten.push(eintrag);
    const stellvertreter: unknown = new Proxy(
      {},
      {
        get(_ziel, methode) {
          if (methode === 'then') {
            const antwort = antworten.shift() ?? { data: [], error: null, status: 200 };
            return (erfuellen: (w: unknown) => unknown, ablehnen?: (g: unknown) => unknown) =>
              Promise.resolve(antwort).then(erfuellen, ablehnen);
          }
          return (...argumente: unknown[]) => {
            eintrag.aufrufe.push({ methode: String(methode), argumente });
            return stellvertreter;
          };
        },
      },
    );
    return stellvertreter;
  };
  const client = { from: (tabelle: string) => kette(tabelle), schema: () => client };
  return { ketten, antworten, client };
});

vi.mock('../../src/daten/supabase.ts', () => ({
  supabase: supa.client,
  SUPABASE_URL: 'http://127.0.0.1:54321',
}));
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

// 12.1.2027 19:12 Zürich (Abschluss nach Zeile 17)
const KONTEXT: Zeitkontext = { jetzt: new Date('2027-01-12T18:12:00.000Z'), zeitzone: 'Europe/Zurich' };
const VERSION = '0.1.0+abc1234';
const ANSATZ = '29000000-0000-4000-8000-000000000001';
const ANDERER = '29000000-0000-4000-8000-000000000002';

type Antwort = Awaited<ReturnType<Schreibadapter['einfuegen']>>;
const antwort = (data: unknown): Antwort => ({ data, error: null, status: 200 }) as unknown as Antwort;

const setzen = (clientId: string, felder: Record<string, unknown>): Schritt =>
  ({ art: 'setzen', tabelle: 'naehrloesungsansatz', clientId, felder }) as unknown as Schritt;

function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

/** Fake-Server: Ansätze mit ec_erwartet_final und k_vorschlag; setzen ändert nur leere Felder */
function fakeServer(start: Record<string, { ec_erwartet_final: number | null; k_vorschlag: number | null }>) {
  const zeilen = new Map(Object.entries(start).map(([id, z]) => [id, { ...z }]));
  const setzenFn = vi.fn(async (_t: string, clientId: string, felder: Record<string, unknown>) => {
    const z = zeilen.get(clientId) as Record<string, unknown> | undefined;
    if (!z || Object.keys(felder).some((f) => z[f] !== null)) return antwort([]);
    Object.assign(z, felder);
    return antwort([{ client_id: clientId }]);
  });
  const lesen = vi.fn(async (_t: string, clientId: string) =>
    antwort(zeilen.has(clientId) ? [{ client_id: clientId, ...zeilen.get(clientId) }] : []),
  );
  const einfuegen = vi.fn(async () => antwort([]));
  const stornieren = vi.fn(async () => antwort([]));
  const adapter = { einfuegen, lesen, stornieren, setzen: setzenFn } as unknown as Schreibadapter;
  return { zeilen, setzen: setzenFn, lesen, einfuegen, stornieren, adapter };
}

afterEach(() => {
  supa.ketten.length = 0;
  supa.antworten.length = 0;
});

describe('setzen am Neuansatz (Plan 29 SETZBAR, Plan 22 A2)', () => {
  it('Loesungswechsel-AK4 SETZBAR erlaubt am Neuansatz genau ec_erwartet_final und k_vorschlag; etikett bleibt bei gedruckt_am', () => {
    expect(SETZBAR['naehrloesungsansatz']).toEqual(['ec_erwartet_final', 'k_vorschlag']);
    expect(SETZBAR['etikett']).toEqual(['gedruckt_am']);
    expect(vorgangPruefen([setzen(ANSATZ, { ec_erwartet_final: 1.22 })])).toEqual([]);
    expect(vorgangPruefen([setzen(ANSATZ, { k_vorschlag: 0.31 })])).toEqual([]);
    expect(vorgangPruefen([setzen(ANSATZ, { ec_erwartet_final: 1.22, k_vorschlag: 0.31 })])).toEqual([]);
  });

  it('Loesungswechsel-AK4 status, timer_ende, abgeschlossen_am, volumen_l und die übrigen Zustandsfelder werden vor dem Senden abgelehnt (8.1 Regel 2)', async () => {
    const falsch: Record<string, unknown>[] = [
      { status: 'abgeschlossen' },
      { timer_ende: KONTEXT.jetzt.toISOString() },
      { abgeschlossen_am: KONTEXT.jetzt.toISOString() },
      { volumen_l: 9 },
      { dauer_s: 4260 },
      { kontrollmessung_id: ANDERER },
      { endmessung_id: ANDERER },
      { ec_erwartet_final: 1.22, status: 'abgeschlossen' },
      {},
    ];
    for (const felder of falsch) {
      const schritt = setzen(ANSATZ, felder);
      expect(vorgangPruefen([schritt]).length, JSON.stringify(felder)).toBeGreaterThan(0);
      const server = fakeServer({ [ANSATZ]: { ec_erwartet_final: null, k_vorschlag: null } });
      const s = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: vi.fn() });
      const ergebnis = await s([schritt], KONTEXT);
      expect(ergebnis, JSON.stringify(felder)).toMatchObject({
        status: 'nicht_gespeichert',
        bestaetigt: 0,
        fehler: { art: 'abgelehnt', wiederholbar: false },
      });
      expect(server.setzen).not.toHaveBeenCalled();
    }
    // ohne client_id ebenfalls abgelehnt
    expect(vorgangPruefen([setzen('', { ec_erwartet_final: 1.22 })]).length).toBeGreaterThan(0);
  });

  it('Loesungswechsel-AK4 Supabase: update mit Filter client_id und «noch leer» je gesetzter Spalte', async () => {
    supa.antworten.push({ data: [{ client_id: ANSATZ }], error: null, status: 200 });
    const ergebnis = await schreiben(setzen(ANSATZ, { ec_erwartet_final: 1.22, k_vorschlag: 0.31 }), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [ANSATZ] });
    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'naehrloesungsansatz'),
      'Abfrage auf naehrloesungsansatz',
    );
    const update = da(
      kette.aufrufe.find((a) => a.methode === 'update'),
      'update',
    );
    expect(update.argumente[0]).toEqual({ ec_erwartet_final: 1.22, k_vorschlag: 0.31 });
    expect(kette.aufrufe).toContainEqual({ methode: 'eq', argumente: ['client_id', ANSATZ] });
    expect(kette.aufrufe).toContainEqual({ methode: 'is', argumente: ['ec_erwartet_final', null] });
    expect(kette.aufrufe).toContainEqual({ methode: 'is', argumente: ['k_vorschlag', null] });
    expect(kette.aufrufe.some((a) => ['upsert', 'insert', 'delete'].includes(a.methode))).toBe(false);
  });

  it('Loesungswechsel-AK4 TO2 nur solange leer: die Wiederholung ändert nichts und gilt als bestätigt; ein fehlender Ansatz ist «nicht gespeichert»', async () => {
    const server = fakeServer({
      [ANSATZ]: { ec_erwartet_final: null, k_vorschlag: null },
      [ANDERER]: { ec_erwartet_final: 1.18, k_vorschlag: null },
    });
    const s = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: vi.fn() });
    const vorgang = [setzen(ANSATZ, { ec_erwartet_final: 1.22, k_vorschlag: 0.31 })];
    expect(await s(vorgang, KONTEXT)).toEqual({ status: 'gespeichert', clientIds: [ANSATZ] });
    expect(server.zeilen.get(ANSATZ)).toEqual({ ec_erwartet_final: 1.22, k_vorschlag: 0.31 });
    // Wiederholung (Antwort verloren): 0 Zeilen, gelesen, beide Felder gesetzt → bestätigt, Werte unverändert
    expect(await s(vorgang, KONTEXT)).toEqual({ status: 'gespeichert', clientIds: [ANSATZ] });
    expect(server.zeilen.get(ANSATZ)).toEqual({ ec_erwartet_final: 1.22, k_vorschlag: 0.31 });
    expect(server.lesen).toHaveBeenCalledTimes(1);
    // ein schon gesetzter Wert wird nicht überschrieben
    await s([setzen(ANDERER, { ec_erwartet_final: 1.3 })], KONTEXT);
    expect(server.zeilen.get(ANDERER)?.ec_erwartet_final).toBe(1.18);
    // nicht vorhanden
    const fehlt = await s([setzen('29000000-0000-4000-8000-000000000009', { k_vorschlag: 0.31 })], KONTEXT);
    expect(fehlt).toMatchObject({
      status: 'nicht_gespeichert',
      fehler: { art: 'abgelehnt', wiederholbar: false, text: TEXT_NICHT_GEFUNDEN },
    });
    expect(server.einfuegen).not.toHaveBeenCalled();
    expect(server.stornieren).not.toHaveBeenCalled();
  });

  it('Loesungswechsel-AK4 etikett.gedruckt_am bleibt setzbar (Plan 22), andere Tabellen nicht', () => {
    const gedruckt = {
      art: 'setzen',
      tabelle: 'etikett',
      clientId: ANSATZ,
      felder: { gedruckt_am: KONTEXT.jetzt.toISOString() },
    } as unknown as Schritt;
    expect(vorgangPruefen([gedruckt])).toEqual([]);
    const messung = {
      art: 'setzen',
      tabelle: 'messung',
      clientId: ANSATZ,
      felder: { ec_erwartet_final: 1.22 },
    } as unknown as Schritt;
    expect(vorgangPruefen([messung]).length).toBeGreaterThan(0);
  });
});
