// schreiben() mit Client-UUID und Upsert ohne Überschreiben (Plan 11 Testliste, Datenfluss, Idempotenz;
// Konzept 11.4 Punkte 1, 5, 6; 04_architektur.md 4.1). Fake-Adapter für den Ablauf, nachgebildeter supabase-js-Client
// für den Supabase-Adapter. Feste Uhr über den Zeitkontext.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Schritt, Vorgang, Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';
import {
  erstelleSchreiben,
  neueClientId,
  schreiben,
  type Schreibadapter,
} from '../../src/daten/schreiben.ts';

// Nachgebildeter Supabase-Client: jede Methode der Abfragekette wird protokolliert, await liefert die nächste Antwort
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
// Nach dem Erfolg lädt die App das Bündel neu; im Unit-Test ohne IndexedDB und Netz
vi.mock('../../src/daten/buendel.ts', () => ({
  buendelLaden: vi.fn(async () => ({ status: 'kein_zugang' })),
  buendelLesen: vi.fn(async () => undefined),
  buendelLeeren: vi.fn(async () => undefined),
}));

type Antwort = Awaited<ReturnType<Schreibadapter['einfuegen']>>;

const KONTEXT: Zeitkontext = { jetzt: new Date('2026-11-25T07:07:00.000Z'), zeitzone: 'Europe/Zurich' };
const VERSION = '0.1.0+abc1234';
const MESSGERAET = '11111111-2222-4333-8444-555555555555';
const SATZ = '0b0b0b0b-0000-4000-8000-000000000001';
const PFLANZUNG = '0b0b0b0b-0000-4000-8000-000000000002';
const EREIGNIS = '0b0b0b0b-0000-4000-8000-000000000003';
const MESSUNG = '0b0b0b0b-0000-4000-8000-000000000004';

const antwort = (data: unknown, error: unknown = null): Antwort => ({ data, error }) as unknown as Antwort;
type Einfuegen = (tabelle: string, zeile: Record<string, unknown>, signal: AbortSignal) => Promise<Antwort>;
type Lesen = (tabelle: string, clientId: string, signal: AbortSignal) => Promise<Antwort>;
type Stornieren = (
  tabelle: string,
  clientId: string,
  felder: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<Antwort>;
/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

const zeitpunkt = (wert: unknown) => new Date(wert as string).getTime();

const phKontrolle = (felder: Record<string, unknown> = {}): Schritt => ({
  art: 'neu',
  tabelle: 'messung',
  felder: {
    client_id: MESSUNG,
    messgeraet_id: MESSGERAET,
    messart: 'ph_kontrolle',
    platz_id: null,
    datenart: 'test',
    ph: 7.02,
    ...felder,
  },
});

const pflanzvorgang: Vorgang = [
  { art: 'neu', tabelle: 'satz', felder: { client_id: SATZ, sorte_id: SATZ, anzahl: 4 } },
  { art: 'neu', tabelle: 'pflanzung', felder: { client_id: PFLANZUNG, satz_id: SATZ } },
  {
    art: 'neu',
    tabelle: 'ereignis',
    felder: { client_id: EREIGNIS, typ: 'aussaat', satz_id: SATZ, daten: { saatdatum: '2026-11-25' } },
  },
];

/** Server im Speicher: Upsert ohne Überschreiben je client_id, wie on conflict (client_id) do nothing returning */
function serverNachbilden() {
  const zeilen = new Map<string, Record<string, unknown>>();
  const einfuegen = vi.fn<Einfuegen>(async (_t, zeile) => {
    const id = zeile['client_id'] as string;
    if (zeilen.has(id)) return antwort([]);
    const gespeichert = { id: `srv-${id}`, erfasst_am: '2026-11-25T07:07:01.123+00:00', ...zeile };
    zeilen.set(id, gespeichert);
    return antwort([gespeichert]);
  });
  const lesen = vi.fn<Lesen>(async (_t, clientId) =>
    antwort(zeilen.has(clientId) ? [zeilen.get(clientId)] : []),
  );
  const stornieren = vi.fn<Stornieren>(async (_t, clientId, felder) =>
    antwort([{ client_id: clientId, ...felder }]),
  );
  const adapter = { einfuegen, lesen, stornieren } as unknown as Schreibadapter;
  return { zeilen, einfuegen, lesen, stornieren, adapter };
}

afterEach(() => {
  vi.useRealTimers();
  supa.ketten.length = 0;
  supa.antworten.length = 0;
});

describe('neueClientId', () => {
  it('liefert eine UUID v4, jedes Mal eine andere', () => {
    const a = neueClientId();
    const b = neueClientId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
});

describe('schreiben mit Fake-Adapter', () => {
  it('schreibt die Schritte in der gegebenen Reihenfolge mit vorbereiteten Zeilen', async () => {
    const server = serverNachbilden();
    const nachErfolg = vi.fn();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg })(
      pflanzvorgang,
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [SATZ, PFLANZUNG, EREIGNIS] });
    expect(server.einfuegen.mock.calls.map((c) => c[0])).toEqual(['satz', 'pflanzung', 'ereignis']);
    for (const [, zeile] of server.einfuegen.mock.calls) {
      expect(zeile['app_version']).toBe(VERSION);
      expect(zeitpunkt(zeile['client_zeit'])).toBe(KONTEXT.jetzt.getTime());
      expect(zeitpunkt(zeile['gilt_ab'])).toBe(KONTEXT.jetzt.getTime());
      expect(zeile).not.toHaveProperty('erfasst_am');
    }
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('nimmt einen einzelnen Schritt statt eines Vorgangs', async () => {
    const server = serverNachbilden();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: () => {} })(
      phKontrolle(),
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });
    expect(server.zeilen.get(MESSUNG)?.['ph']).toBe(7.02);
  });

  it('bricht beim ersten Fehler ab (bestaetigt = k−1); die Wiederholung mit denselben IDs ergibt gespeichert', async () => {
    const server = serverNachbilden();
    const echt = da(server.einfuegen.getMockImplementation(), 'Fake einfuegen');
    server.einfuegen.mockImplementationOnce(echt).mockImplementationOnce(async () => {
      throw new TypeError('Failed to fetch');
    });
    const nachErfolg = vi.fn();
    const schreibe = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg });

    const erster = await schreibe(pflanzvorgang, KONTEXT);
    expect(erster.status).toBe('nicht_gespeichert');
    if (erster.status !== 'nicht_gespeichert') return;
    expect(erster.bestaetigt).toBe(1);
    expect(erster.fehler.art).toBe('kein_netz');
    expect(erster.fehler.wiederholbar).toBe(true);
    expect(server.einfuegen).toHaveBeenCalledTimes(2);
    expect(nachErfolg).not.toHaveBeenCalled();

    const zweiter = await schreibe(pflanzvorgang, KONTEXT);
    expect(zweiter).toEqual({ status: 'gespeichert', clientIds: [SATZ, PFLANZUNG, EREIGNIS] });
    expect([...server.zeilen.keys()].sort()).toEqual([SATZ, PFLANZUNG, EREIGNIS].sort());
    expect(server.einfuegen.mock.calls.slice(2).map((c) => c[1]['client_id'])).toEqual([
      SATZ,
      PFLANZUNG,
      EREIGNIS,
    ]);
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('ein Fehler als Antwort (error statt Ausnahme) bricht ebenso ab', async () => {
    const server = serverNachbilden();
    server.einfuegen.mockResolvedValueOnce(
      antwort(null, { code: '23514', message: 'new row violates check constraint', status: 400 }),
    );
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: () => {} })(
      pflanzvorgang,
      KONTEXT,
    );
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.bestaetigt).toBe(0);
    expect(ergebnis.fehler.art).toBe('abgelehnt');
    expect(server.einfuegen).toHaveBeenCalledTimes(1);
  });

  it('leere Antwort (Duplikat), Rücklesen mit gleichem Inhalt: gespeichert, auch mit anderen Serverformaten', async () => {
    const server = serverNachbilden();
    server.einfuegen.mockResolvedValueOnce(antwort([]));
    server.lesen.mockResolvedValueOnce(
      antwort([
        {
          id: 'srv-1',
          client_id: MESSUNG,
          messgeraet_id: MESSGERAET,
          messart: 'ph_kontrolle',
          platz_id: null,
          datenart: 'test',
          ph: 7.02,
          // Server schreibt Zeitpunkte als +00:00, die erste Sendung hatte eine andere app_version und client_zeit (A5)
          gilt_ab: '2026-11-25T07:07:00+00:00',
          client_zeit: '2026-11-25T07:06:40+00:00',
          app_version: '0.1.0+0000000',
          erfasst_am: '2026-11-25T07:06:41.5+00:00',
          nacherfasst: false,
          storniert_am: null,
          storno_grund: null,
        },
      ]),
    );
    const nachErfolg = vi.fn();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg })(
      phKontrolle(),
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });
    expect(server.lesen).toHaveBeenCalledWith('messung', MESSUNG, expect.anything());
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('leere Antwort, Rücklesen mit anderem Inhalt: abweichend mit der vorhandenen Zeile', async () => {
    const server = serverNachbilden();
    const vorhanden = {
      id: 'srv-1',
      client_id: MESSUNG,
      messgeraet_id: MESSGERAET,
      messart: 'ph_kontrolle',
      platz_id: null,
      datenart: 'test',
      ph: 6.5,
      gilt_ab: '2026-11-25T07:07:00+00:00',
      app_version: VERSION,
    };
    server.einfuegen.mockResolvedValueOnce(antwort([]));
    server.lesen.mockResolvedValueOnce(antwort([vorhanden]));
    const nachErfolg = vi.fn();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg })(
      phKontrolle(),
      KONTEXT,
    );
    expect(ergebnis.status).toBe('abweichend');
    if (ergebnis.status !== 'abweichend') return;
    expect(ergebnis.clientId).toBe(MESSUNG);
    expect(ergebnis.vorhanden['ph']).toBe(6.5);
    expect(nachErfolg).not.toHaveBeenCalled();
  });

  it('ein Verstoss in den Ereignisdaten ruft den Adapter nicht auf', async () => {
    const server = serverNachbilden();
    const nachErfolg = vi.fn();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg })(
      [
        {
          art: 'neu',
          tabelle: 'ereignis',
          felder: {
            client_id: EREIGNIS,
            typ: 'beobachtung',
            satz_id: SATZ,
            daten: { kategorie: 'mehltau', farbe: 'weiss' },
          },
        },
      ],
      KONTEXT,
    );
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('abgelehnt');
    expect(ergebnis.fehler.wiederholbar).toBe(false);
    expect(ergebnis.bestaetigt).toBe(0);
    expect(server.einfuegen).not.toHaveBeenCalled();
    expect(server.lesen).not.toHaveBeenCalled();
    expect(server.stornieren).not.toHaveBeenCalled();
    expect(nachErfolg).not.toHaveBeenCalled();
  });

  it('Storno: storniert_am = jetzt und storno_grund an den Adapter', async () => {
    const server = serverNachbilden();
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: () => {} })(
      [{ art: 'storno', tabelle: 'messung', clientId: MESSUNG, grund: 'fehleingabe' }],
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });
    expect(server.stornieren).toHaveBeenCalledTimes(1);
    const [tabelle, clientId, felder] = da(server.stornieren.mock.calls[0], 'Aufruf stornieren');
    expect(tabelle).toBe('messung');
    expect(clientId).toBe(MESSUNG);
    expect(felder['storno_grund']).toBe('fehleingabe');
    expect(zeitpunkt(felder['storniert_am'])).toBe(KONTEXT.jetzt.getTime());
    expect(server.einfuegen).not.toHaveBeenCalled();
  });

  it('Korrektur: zuerst die neue Zeile, dann das Storno der alten (A8)', async () => {
    const server = serverNachbilden();
    const reihenfolge: string[] = [];
    server.einfuegen.mockImplementation(async (_t, zeile) => {
      reihenfolge.push(`neu ${zeile['client_id'] as string}`);
      return antwort([zeile]);
    });
    server.stornieren.mockImplementation(async (_t, clientId) => {
      reihenfolge.push(`storno ${clientId}`);
      return antwort([{ client_id: clientId }]);
    });
    const alt = '0b0b0b0b-0000-4000-8000-0000000000a1';
    const ergebnis = await erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg: () => {} })(
      [
        phKontrolle({ ersetzt_id: 'srv-alt' }),
        { art: 'storno', tabelle: 'messung', clientId: alt, grund: 'korrektur' },
      ],
      KONTEXT,
    );
    expect(ergebnis.status).toBe('gespeichert');
    expect(reihenfolge).toEqual([`neu ${MESSUNG}`, `storno ${alt}`]);
  });

  it('nachErfolg genau einmal und nur bei Erfolg', async () => {
    const server = serverNachbilden();
    const nachErfolg = vi.fn();
    const schreibe = erstelleSchreiben(server.adapter, { appVersion: VERSION, nachErfolg });
    server.einfuegen.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await schreibe(phKontrolle(), KONTEXT);
    expect(nachErfolg).not.toHaveBeenCalled();
    await schreibe(pflanzvorgang, KONTEXT);
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('das Zeitlimit von 15 s bricht ab und ergibt unklar (A3)', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const einfuegen = vi.fn(
      (_t: string, _z: Record<string, unknown>, s: AbortSignal) =>
        new Promise<Antwort>((_erfuellen, ablehnen) => {
          signal = s;
          s.addEventListener('abort', () =>
            ablehnen(new DOMException('This operation was aborted', 'AbortError')),
          );
        }),
    );
    const adapter = { einfuegen, lesen: vi.fn(), stornieren: vi.fn() } as unknown as Schreibadapter;
    const nachErfolg = vi.fn();
    const laufend = erstelleSchreiben(adapter, { appVersion: VERSION, nachErfolg })(phKontrolle(), KONTEXT);

    await vi.advanceTimersByTimeAsync(14_999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const ergebnis = await laufend;
    expect(signal?.aborted).toBe(true);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('unklar');
    expect(ergebnis.fehler.wiederholbar).toBe(true);
    expect(ergebnis.fehler.text).toBe('Kein Netz, nicht gespeichert, erneut senden');
    expect(nachErfolg).not.toHaveBeenCalled();
  });
});

describe('schreiben mit dem Supabase-Adapter', () => {
  it('Upsert mit onConflict client_id und ignoreDuplicates, Rückgabe der Zeile', async () => {
    supa.antworten.push({ data: [{ client_id: MESSUNG, ph: 7.02 }], error: null, status: 201 });
    const ergebnis = await schreiben(phKontrolle(), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });

    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'messung'),
      'Abfrage auf messung',
    );
    const upsert = da(
      kette.aufrufe.find((a) => a.methode === 'upsert'),
      'upsert',
    );
    const [zeile, optionen] = upsert.argumente as [Record<string, unknown>, Record<string, unknown>];
    expect(zeile['client_id']).toBe(MESSUNG);
    expect(zeile['ph']).toBe(7.02);
    expect(optionen).toMatchObject({ onConflict: 'client_id', ignoreDuplicates: true });
    expect(kette.aufrufe.some((a) => a.methode === 'select')).toBe(true);
    expect(kette.aufrufe.some((a) => a.methode === 'abortSignal')).toBe(true);
    expect(kette.aufrufe.some((a) => a.methode === 'insert' || a.methode === 'update')).toBe(false);
  });

  it('Storno ändert nur, wenn storniert_am is null', async () => {
    supa.antworten.push({ data: [{ client_id: MESSUNG }], error: null, status: 200 });
    await schreiben({ art: 'storno', tabelle: 'messung', clientId: MESSUNG, grund: 'rueckgaengig' }, KONTEXT);

    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'messung'),
      'Abfrage auf messung',
    );
    const update = da(
      kette.aufrufe.find((a) => a.methode === 'update'),
      'update',
    );
    const [felder] = update.argumente as [Record<string, unknown>];
    expect(felder['storno_grund']).toBe('rueckgaengig');
    expect(zeitpunkt(felder['storniert_am'])).toBe(KONTEXT.jetzt.getTime());
    expect(Object.keys(felder).sort()).toEqual(['storniert_am', 'storno_grund']);
    expect(kette.aufrufe).toContainEqual({ methode: 'eq', argumente: ['client_id', MESSUNG] });
    expect(kette.aufrufe).toContainEqual({ methode: 'is', argumente: ['storniert_am', null] });
  });
});
