// Teil «ereignis» des Offline-Bündels für «unsicher» im Client (Plan 12 Lösungsweg 2, Datenfluss «Bündel»;
// R10.3, R4.7; 04_architektur.md 4.2). Nachgebildeter supabase-js-Client protokolliert die Abfragekette;
// Fake-Adapter und Fake-Speicher wie in buendel-laden.test.ts; feste Uhr über den Zeitkontext.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUENDEL_TEILE,
  erstelleBuendelLaden,
  supabaseBuendeladapter,
  type Buendeladapter,
  type Buendelspeicher,
} from '../../src/daten/buendel.ts';
import type { Buendel } from '../../src/domain/datenpfad/buendel.ts';
import type { Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';

// Nachgebildeter Supabase-Client: jede Methode der Abfragekette wird protokolliert, await liefert eine leere Seite
const supa = vi.hoisted(() => {
  type Aufruf = { methode: string; argumente: unknown[] };
  const ketten: { tabelle: string; aufrufe: Aufruf[] }[] = [];
  const kette = (tabelle: string) => {
    const eintrag = { tabelle, aufrufe: [] as Aufruf[] };
    ketten.push(eintrag);
    const stellvertreter: unknown = new Proxy(
      {},
      {
        get(_ziel, methode) {
          if (methode === 'then')
            return (erfuellen: (w: unknown) => unknown, ablehnen?: (g: unknown) => unknown) =>
              Promise.resolve({ data: [], error: null, status: 200 }).then(erfuellen, ablehnen);
          return (...argumente: unknown[]) => {
            eintrag.aufrufe.push({ methode: String(methode), argumente });
            return stellvertreter;
          };
        },
      },
    );
    return stellvertreter;
  };
  const client = { from: (tabelle: string) => kette(tabelle), rpc: (name: string) => kette(`rpc:${name}`) };
  return { ketten, client };
});

vi.mock('../../src/daten/supabase.ts', () => ({
  supabase: supa.client,
  SUPABASE_URL: 'http://127.0.0.1:54321',
}));

const KONTEXT: Zeitkontext = { jetzt: new Date('2027-01-20T09:00:00.000Z'), zeitzone: 'Europe/Zurich' };
const NUTZER = '00000000-0000-4000-8000-0000000000e2';
const BINDUNG = { appVersion: '0.1.0+abc1234', nutzerId: NUTZER };
const TYPEN = ['als_unsicher_markiert', 'sonde_gereinigt'];

type Teil = (typeof BUENDEL_TEILE)[number];
type Antwort = Awaited<ReturnType<Buendeladapter['seite']>>;

/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

const ereignisTeil = (): Teil =>
  da(
    BUENDEL_TEILE.find((t) => t.name === 'ereignis'),
    'Teil ereignis',
  );

beforeEach(() => {
  supa.ketten.length = 0;
});

describe('Teil ereignis', () => {
  it('R10.3 Bündel lädt ereignis nur mit sonde_gereinigt und als_unsicher_markiert, ohne Storno', async () => {
    const teil = ereignisTeil();
    expect([...(teil.typen ?? [])].sort()).toEqual(TYPEN);
    expect(teil.ohneStorno).toBe(true);
    expect(teil.fensterTage).toBeUndefined();

    // Adapter-Attrappe: der Supabase-Adapter setzt die Filter in der Abfrage
    await supabaseBuendeladapter.seite(teil, { von: 0, bis: 999 }, KONTEXT, new AbortController().signal);
    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'ereignis'),
      'Abfrage auf ereignis',
    );
    const aufrufe = kette.aufrufe;
    const filterIn = aufrufe.filter((a) => a.methode === 'in');
    expect(filterIn).toHaveLength(1);
    const [spalte, werte] = da(filterIn[0], 'Filter in').argumente as [string, string[]];
    expect(spalte).toBe('typ');
    expect([...werte].sort()).toEqual(TYPEN);
    expect(aufrufe).toContainEqual({ methode: 'is', argumente: ['storniert_am', null] });
    // ohne Zeitfenster: kein Filter auf gilt_ab
    expect(aufrufe.filter((a) => a.methode === 'gte')).toEqual([]);
    expect(aufrufe).toContainEqual({ methode: 'range', argumente: [0, 999] });
  });

  it('R10.3 andere Teile erhalten keinen Filter auf typ', async () => {
    const messgeraet = da(
      BUENDEL_TEILE.find((t) => t.name === 'messgeraet'),
      'Teil messgeraet',
    );
    await supabaseBuendeladapter.seite(
      messgeraet,
      { von: 0, bis: 999 },
      KONTEXT,
      new AbortController().signal,
    );
    const kette = da(
      supa.ketten.find((k) => k.tabelle === 'messgeraet'),
      'Abfrage auf messgeraet',
    );
    expect(kette.aufrufe.filter((a) => a.methode === 'in')).toEqual([]);
  });

  it('R10.3 die Ereignisse landen im Bündel unter teile.ereignis', async () => {
    const ereignisse = [
      {
        id: 'e1',
        typ: 'sonde_gereinigt',
        messgeraet_id: 'g1',
        gilt_ab: '2027-01-10T14:00:00.000Z',
        storniert_am: null,
        daten: { datenart: 'echt' },
      },
    ];
    const seite = vi.fn(
      async (t: Teil) =>
        ({ data: t.name === 'ereignis' ? ereignisse : [], error: null }) as unknown as Antwort,
    );
    const adapter = {
      istTim: vi.fn(async () => ({ data: true, error: null }) as unknown as Antwort),
      seite,
    } as unknown as Buendeladapter;
    const ersetzen = vi.fn<(buendel: Buendel) => Promise<void>>(async () => {});
    const ergebnis = await erstelleBuendelLaden(
      adapter,
      { ersetzen } as unknown as Buendelspeicher,
      BINDUNG,
    )(KONTEXT);
    expect(ergebnis.status).toBe('geladen');
    if (ergebnis.status !== 'geladen') return;
    expect(ergebnis.buendel.teile['ereignis']).toEqual(ereignisse);
    const teile = seite.mock.calls.map(([t]) => t).filter((t) => t.name === 'ereignis');
    expect(teile.length).toBeGreaterThan(0);
    for (const t of teile) expect([...(t.typen ?? [])].sort()).toEqual(TYPEN);
  });
});
