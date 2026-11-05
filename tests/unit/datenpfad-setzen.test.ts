// Schritt «setzen» im Schreibweg (Plan 22 A2, TO2): nur etikett.gedruckt_am, nur solange leer; die erste Bestätigung
// bleibt stehen. Fake-Adapter für den Ablauf, nachgebildeter supabase-js-Client für den Supabase-Adapter (wie
// tests/unit/schreiben.test.ts). Feste Uhr über den Zeitkontext.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 22 offen ist):
//   src/domain/datenpfad/erfassung.ts
//     Schritt | { art: 'setzen'; tabelle: 'etikett'; clientId: string; felder: { gedruckt_am: string } }
//     SETZBAR: nur etikett.gedruckt_am (Form frei)
//     vorgangPruefen: setzen auf andere Tabellen oder Felder, ohne Felder oder ohne clientId ergibt Verstösse
//   src/daten/schreiben.ts
//     Schreibadapter.setzen(tabelle, clientId, felder, signal): Promise<Antwort>
//     Supabase: update(felder).eq('client_id', id).is('gedruckt_am', null).select('client_id')
//     0 Zeilen → lesen: vorhanden mit gesetztem Feld = bestätigt, sonst nicht_gespeichert mit TEXT_NICHT_GEFUNDEN
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vorgangPruefen, type Schritt, type Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';
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

const KONTEXT: Zeitkontext = { jetzt: new Date('2026-12-14T08:00:00.000Z'), zeitzone: 'Europe/Zurich' };
const VERSION = '0.1.0+abc1234';
const ETIKETT_1 = '32000000-0000-4000-8000-000000000003';
const ETIKETT_2 = '32000000-0000-4000-8000-000000000005';

type Antwort = Awaited<ReturnType<Schreibadapter['einfuegen']>>;
const antwort = (data: unknown): Antwort => ({ data, error: null, status: 200 }) as unknown as Antwort;

const gedruckt = (clientId: string): Schritt =>
  ({
    art: 'setzen',
    tabelle: 'etikett',
    clientId,
    felder: { gedruckt_am: KONTEXT.jetzt.toISOString() },
  }) as unknown as Schritt;

function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

/** Fake-Server: Etiketten mit gedruckt_am; setzen ändert nur leere, lesen liefert die Zeile */
function fakeServer(start: Record<string, string | null>) {
  const zeilen = new Map(Object.entries(start));
  const setzen = vi.fn(async (_t: string, clientId: string, felder: Record<string, unknown>) => {
    if (!zeilen.has(clientId) || zeilen.get(clientId) !== null) return antwort([]);
    zeilen.set(clientId, String(felder['gedruckt_am']));
    return antwort([{ client_id: clientId }]);
  });
  const lesen = vi.fn(async (_t: string, clientId: string) =>
    antwort(zeilen.has(clientId) ? [{ client_id: clientId, gedruckt_am: zeilen.get(clientId) }] : []),
  );
  const einfuegen = vi.fn(async () => antwort([]));
  const stornieren = vi.fn(async () => antwort([]));
  const adapter = { einfuegen, lesen, stornieren, setzen } as unknown as Schreibadapter;
  return { zeilen, setzen, lesen, einfuegen, stornieren, adapter };
}

afterEach(() => {
  supa.ketten.length = 0;
  supa.antworten.length = 0;
});

describe('Datenpfad setzen (A2)', () => {
  it('Datenpfad setzen: gedruckt_am über update mit Filter client_id und gedruckt_am is null', async () => {
    supa.antworten.push({ data: [{ client_id: ETIKETT_1 }], error: null, status: 200 });
    const ergebnis = await schreiben(gedruckt(ETIKETT_1), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [ETIKETT_1] });

    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'etikett'),
      'Abfrage auf etikett',
    );
    const update = da(
      kette.aufrufe.find((a) => a.methode === 'update'),
      'update',
    );
    const [felder] = update.argumente as [Record<string, unknown>];
    expect(Date.parse(String(felder['gedruckt_am']))).toBe(KONTEXT.jetzt.getTime());
    expect(Object.keys(felder)).not.toContain('storniert_am');
    expect(kette.aufrufe).toContainEqual({ methode: 'eq', argumente: ['client_id', ETIKETT_1] });
    expect(kette.aufrufe).toContainEqual({ methode: 'is', argumente: ['gedruckt_am', null] });
    expect(kette.aufrufe.some((a) => a.methode === 'select')).toBe(true);
    expect(kette.aufrufe.some((a) => a.methode === 'abortSignal')).toBe(true);
    expect(kette.aufrufe.some((a) => ['upsert', 'insert', 'delete'].includes(a.methode))).toBe(false);
  });

  it('Datenpfad setzen: TO2 Wiederholung mit 0 Zeilen und schon gesetztem Feld gilt als bestätigt', async () => {
    const server = fakeServer({ [ETIKETT_1]: null, [ETIKETT_2]: '2026-12-01T09:00:00.000Z' });
    const nachErfolg = vi.fn();
    const s = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg });
    const vorgang = [gedruckt(ETIKETT_1), gedruckt(ETIKETT_2)];
    expect(await s(vorgang, KONTEXT)).toEqual({ status: 'gespeichert', clientIds: [ETIKETT_1, ETIKETT_2] });
    // die erste Bestätigung bleibt stehen
    expect(server.zeilen.get(ETIKETT_2)).toBe('2026-12-01T09:00:00.000Z');
    expect(server.zeilen.get(ETIKETT_1)).toBe(KONTEXT.jetzt.toISOString());
    // Wiederholung: beide 0 Zeilen, beide gelesen und bestätigt
    const spaeter = { ...KONTEXT, jetzt: new Date('2026-12-14T09:00:00.000Z') };
    expect(await s(vorgang, spaeter)).toEqual({ status: 'gespeichert', clientIds: [ETIKETT_1, ETIKETT_2] });
    expect(server.zeilen.get(ETIKETT_1)).toBe(KONTEXT.jetzt.toISOString());
    expect(server.setzen).toHaveBeenCalledTimes(4);
    expect(server.lesen).toHaveBeenCalledTimes(3);
    const [tabelle, clientId, felder] = da(server.setzen.mock.calls[0], 'Aufruf setzen');
    expect([tabelle, clientId]).toEqual(['etikett', ETIKETT_1]);
    expect(felder).toMatchObject({ gedruckt_am: KONTEXT.jetzt.toISOString() });
    expect(nachErfolg).toHaveBeenCalledTimes(2);
    expect(server.einfuegen).not.toHaveBeenCalled();
    expect(server.stornieren).not.toHaveBeenCalled();
  });

  it('Datenpfad setzen: nicht vorhanden ergibt «Nicht gespeichert: Eintrag nicht gefunden …»', async () => {
    const server = fakeServer({ [ETIKETT_1]: null });
    const nachErfolg = vi.fn();
    const s = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg });
    const ergebnis = await s([gedruckt(ETIKETT_1), gedruckt(ETIKETT_2)], KONTEXT);
    expect(ergebnis).toMatchObject({
      status: 'nicht_gespeichert',
      bestaetigt: 1,
      fehler: { art: 'abgelehnt', wiederholbar: false, text: TEXT_NICHT_GEFUNDEN },
    });
    expect(TEXT_NICHT_GEFUNDEN).toMatch(/^Nicht gespeichert: Eintrag nicht gefunden/);
    expect(nachErfolg).not.toHaveBeenCalled();
  });

  it('Datenpfad setzen: andere Tabelle oder anderes Feld abgelehnt, ohne Anfrage', async () => {
    const falsch = [
      { art: 'setzen', tabelle: 'messung', clientId: ETIKETT_1, felder: { gedruckt_am: 'x' } },
      { art: 'setzen', tabelle: 'etikett', clientId: ETIKETT_1, felder: { code: 'R-9.9' } },
      {
        art: 'setzen',
        tabelle: 'etikett',
        clientId: ETIKETT_1,
        felder: { gedruckt_am: KONTEXT.jetzt.toISOString(), storniert_am: KONTEXT.jetzt.toISOString() },
      },
      { art: 'setzen', tabelle: 'etikett', clientId: ETIKETT_1, felder: {} },
      {
        art: 'setzen',
        tabelle: 'etikett',
        clientId: '',
        felder: { gedruckt_am: KONTEXT.jetzt.toISOString() },
      },
    ] as unknown as Schritt[];
    for (const schritt of falsch) {
      expect(vorgangPruefen([schritt]).length, JSON.stringify(schritt)).toBeGreaterThan(0);
      const server = fakeServer({ [ETIKETT_1]: null });
      const s = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: vi.fn() });
      const ergebnis = await s([gedruckt(ETIKETT_2), schritt], KONTEXT);
      expect(ergebnis, JSON.stringify(schritt)).toMatchObject({
        status: 'nicht_gespeichert',
        bestaetigt: 0,
        fehler: { art: 'abgelehnt', wiederholbar: false },
      });
      expect(server.setzen).not.toHaveBeenCalled();
      expect(server.lesen).not.toHaveBeenCalled();
    }
    // der erlaubte Schritt besteht die Prüfung
    expect(vorgangPruefen([gedruckt(ETIKETT_1)])).toEqual([]);
    expect(supa.ketten).toHaveLength(0);
  });
});
