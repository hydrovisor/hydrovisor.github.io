// Abo-Abgleich beim Start und Speichern des Push-Abos (Plan 13 «Client», Dateien `src/daten/push.ts` und
// `src/daten/schreiben.ts`; 11.3: fehlt der Endpoint in push_abo oder ist er inaktiv, neu speichern mit
// aktiv = true; Plan 11 A10: Upsert auf endpoint, idempotent, gleiche Fehlereinordnung wie schreiben()).
// Adapter-Attrappen statt Netz; der nachgebildete supabase-js-Client protokolliert die Abfragekette.
// Vorausgesetzt (Plan 13 nennt nur die Namen):
// - schreiben.ts: `AboEingabe = { endpoint; p256dh; auth_schluessel; geraet }` (alles string);
//   `AboAdapter = { upsert(zeile: Record<string, unknown>, signal: AbortSignal): Promise<Antwort> }`;
//   `erstelleAboSchreiben(adapter, { appVersion }): (abo: AboEingabe) => Promise<{ status: 'gespeichert' }
//   | { status: 'nicht_gespeichert'; fehler: Schreibfehler }>`; die Zeile enthält die AboEingabe, aktiv true,
//   letzter_fehler null und app_version; `supabaseAboAdapter` setzt upsert(zeile, { onConflict: 'endpoint' })
//   auf push_abo ohne ignoreDuplicates (ein erneutes Abo setzt aktiv wieder auf true).
// - push.ts: `aboAbgleichen({ pushManager, abos, aboSchreiben, geraet })` mit pushManager.getSubscription()
//   (PushSubscription mit endpoint und toJSON().keys.p256dh/auth), abos = Teil push_abo des Bündels.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fehlerEinordnen } from '../../src/domain/datenpfad/fehler.ts';
import { aboAbgleichen } from '../../src/daten/push.ts';
import {
  erstelleAboSchreiben,
  supabaseAboAdapter,
  type AboAdapter,
  type AboEingabe,
} from '../../src/daten/schreiben.ts';

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
              Promise.resolve({ data: [], error: null, status: 201 }).then(erfuellen, ablehnen);
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

const ENDPOINT = 'https://push.example.invalid/geraet-1';
const GERAET = 'Android · Chrome 131';
const EINGABE: AboEingabe = {
  endpoint: ENDPOINT,
  p256dh: 'BPtest',
  auth_schluessel: 'authtest',
  geraet: GERAET,
};

const abonnement = (endpoint = ENDPOINT) => ({
  endpoint,
  toJSON: () => ({ endpoint, keys: { p256dh: 'BPtest', auth: 'authtest' } }),
});

const pushManager = (abo: ReturnType<typeof abonnement> | null) => ({
  getSubscription: vi.fn(async () => abo),
});

beforeEach(() => {
  supa.ketten.length = 0;
});

describe('aboAbgleichen', () => {
  it('11.3 Abgleich: Endpoint fehlt in push_abo → Upsert auf endpoint mit aktiv true', async () => {
    const aboSchreiben = vi.fn<(abo: AboEingabe) => Promise<{ status: 'gespeichert' }>>(async () => ({
      status: 'gespeichert',
    }));
    await aboAbgleichen({
      pushManager: pushManager(abonnement()),
      abos: [{ endpoint: 'https://push.example.invalid/anderes', aktiv: true }],
      aboSchreiben,
      geraet: GERAET,
    });
    expect(aboSchreiben).toHaveBeenCalledTimes(1);
    expect(aboSchreiben).toHaveBeenCalledWith(EINGABE);
  });

  it('11.3 Abgleich: Endpoint inaktiv in push_abo → neu speichern', async () => {
    const aboSchreiben = vi.fn(async () => ({ status: 'gespeichert' as const }));
    await aboAbgleichen({
      pushManager: pushManager(abonnement()),
      abos: [{ endpoint: ENDPOINT, aktiv: false }],
      aboSchreiben,
      geraet: GERAET,
    });
    expect(aboSchreiben).toHaveBeenCalledTimes(1);
  });

  it('11.3 gleicher aktiver Endpoint → kein Schreiben', async () => {
    const aboSchreiben = vi.fn(async () => ({ status: 'gespeichert' as const }));
    await aboAbgleichen({
      pushManager: pushManager(abonnement()),
      abos: [{ endpoint: ENDPOINT, aktiv: true }],
      aboSchreiben,
      geraet: GERAET,
    });
    expect(aboSchreiben).not.toHaveBeenCalled();
  });

  it('11.3 ohne Browser-Abo bleibt die Datenbank unverändert', async () => {
    const aboSchreiben = vi.fn(async () => ({ status: 'gespeichert' as const }));
    await aboAbgleichen({ pushManager: pushManager(null), abos: [], aboSchreiben, geraet: GERAET });
    expect(aboSchreiben).not.toHaveBeenCalled();
  });
});

describe('aboSchreiben', () => {
  it('Plan 11 A10 aboSchreiben wiederholt ohne Doppel', async () => {
    // Attrappe mit Unique auf endpoint wie push_abo (endpoint text not null unique)
    const tabelle = new Map<string, Record<string, unknown>>();
    const upsert = vi.fn(async (zeile: Record<string, unknown>) => {
      tabelle.set(String(zeile['endpoint']), { ...tabelle.get(String(zeile['endpoint'])), ...zeile });
      return { data: [zeile], error: null, status: 201 };
    });
    const aboSchreiben = erstelleAboSchreiben({ upsert } as AboAdapter, { appVersion: '0.1.0+abc1234' });
    expect(await aboSchreiben(EINGABE)).toEqual({ status: 'gespeichert' });
    expect(await aboSchreiben(EINGABE)).toEqual({ status: 'gespeichert' });
    expect(tabelle.size).toBe(1);
    expect(tabelle.get(ENDPOINT)).toMatchObject({
      ...EINGABE,
      aktiv: true,
      letzter_fehler: null,
      app_version: '0.1.0+abc1234',
    });
    // keine Datenart demo oder test aus dem Client: Default echt der Spalte (A1)
    expect(tabelle.get(ENDPOINT)?.['datenart'] ?? 'echt').toBe('echt');
  });

  it('Plan 11 A10 aboSchreiben ordnet Fehler wie schreiben() ein', async () => {
    const roh = { name: 'TypeError', message: 'TypeError: Failed to fetch', status: 0 };
    const upsert = vi.fn(async () => ({ data: null, error: roh }));
    const aboSchreiben = erstelleAboSchreiben({ upsert } as AboAdapter, { appVersion: '0.1.0+abc1234' });
    expect(await aboSchreiben(EINGABE)).toEqual({
      status: 'nicht_gespeichert',
      fehler: fehlerEinordnen(roh),
    });
  });

  it('Plan 11 A10 supabaseAboAdapter: Upsert auf push_abo mit onConflict endpoint, ohne ignoreDuplicates', async () => {
    const zeile = { ...EINGABE, aktiv: true, letzter_fehler: null, app_version: '0.1.0+abc1234' };
    await supabaseAboAdapter.upsert(zeile, new AbortController().signal);
    const kette = supa.ketten.find((k) => k.tabelle === 'push_abo');
    expect(kette, 'Abfrage auf push_abo').toBeDefined();
    const upsert = kette?.aufrufe.find((a) => a.methode === 'upsert');
    expect(upsert?.argumente[0]).toEqual(zeile);
    expect(upsert?.argumente[1]).toMatchObject({ onConflict: 'endpoint' });
    expect((upsert?.argumente[1] as { ignoreDuplicates?: boolean } | undefined)?.ignoreDuplicates).not.toBe(
      true,
    );
  });
});
