// Runde 1 im Paket I0-04 Datenpfad (#11): rote Tests zu den Prüferbefunden R1-1, R1-2, R1-3, R1-4, R1-9, R1-11
// und R1-S2 (Plan 11; Konzept 11.4; 04_architektur.md 4.1, 4.2). Fake-Adapter wie in schreiben.test.ts und
// buendel-laden.test.ts; feste Uhr über den Zeitkontext, nie die Systemzeit.
import { describe, expect, it, vi } from 'vitest';
import {
  BUENDEL_TEILE,
  erstelleBuendelLaden,
  type Buendeladapter,
  type Buendelspeicher,
} from '../../src/daten/buendel.ts';
import { erstelleSchreiben, type Schreibadapter } from '../../src/daten/schreiben.ts';
import type { Buendel } from '../../src/domain/datenpfad/buendel.ts';
import { ereignisDatenPruefen } from '../../src/domain/datenpfad/ereignisdaten.ts';
import {
  MIT_GILT_AB,
  MIT_ZEITACHSE,
  vorgangPruefen,
  zeileVorbereiten,
  type Erfassungstabelle,
  type Schritt,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';
import { fehlerEinordnen } from '../../src/domain/datenpfad/fehler.ts';

// ohne echten Supabase-Client: die Tests rufen nur die Fabriken mit Fake-Adaptern auf
vi.mock('../../src/daten/supabase.ts', () => ({
  supabase: {},
  SUPABASE_URL: 'http://127.0.0.1:54321',
}));

const KONTEXT: Zeitkontext = { jetzt: new Date('2026-11-25T07:07:00.000Z'), zeitzone: 'Europe/Zurich' };
const VERSION = '0.1.0+abc1234';
const NUTZER = '00000000-0000-4000-8000-0000000000e2';
const BINDUNG = { appVersion: VERSION, nutzerId: NUTZER };
const EREIGNIS = '0b0b0b0b-0000-4000-8000-000000000003';
const MESSUNG = '0b0b0b0b-0000-4000-8000-000000000004';
const POSITION = '0b0b0b0b-0000-4000-8000-000000000005';
const AUFRUF = '0b0b0b0b-0000-4000-8000-000000000006';
const K_FAKTOR = '0b0b0b0b-0000-4000-8000-000000000007';
const ANLAGE = '0b0b0b0b-0000-4000-8000-000000000008';
const TEXT_NICHT_GEFUNDEN = 'Nicht gespeichert: Eintrag nicht gefunden oder kein Zugang für dieses Konto';

type Neu = Extract<Schritt, { art: 'neu' }>;
type Antwort = Awaited<ReturnType<Schreibadapter['einfuegen']>>;
/** Antwort in der Form von supabase-js, mit HTTP-Status auf der Antwort (R1-2) */
const antwort = (data: unknown, error: unknown = null, status?: number): Antwort =>
  (status === undefined ? { data, error } : { data, error, status }) as unknown as Antwort;

type Einfuegen = (tabelle: string, zeile: Record<string, unknown>, signal: AbortSignal) => Promise<Antwort>;
type Lesen = (tabelle: string, clientId: string, signal: AbortSignal) => Promise<Antwort>;
type Stornieren = (
  tabelle: string,
  clientId: string,
  felder: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<Antwort>;

/** Fake-Adapter: einfuegen speichert und liefert die Zeile, lesen liefert keine, stornieren eine geänderte Zeile */
function adapterNachbilden() {
  const einfuegen = vi.fn<Einfuegen>(async (_t, zeile) => antwort([{ id: 'srv-1', ...zeile }]));
  const lesen = vi.fn<Lesen>(async () => antwort([]));
  const stornieren = vi.fn<Stornieren>(async (_t, clientId, felder) =>
    antwort([{ client_id: clientId, ...felder }]),
  );
  const adapter = { einfuegen, lesen, stornieren } as unknown as Schreibadapter;
  return { einfuegen, lesen, stornieren, adapter };
}

const schreibenMit = (adapter: Schreibadapter, nachErfolg: () => void = () => {}) =>
  erstelleSchreiben(adapter, { appVersion: VERSION, nachErfolg });

const ereignis = (typ: string, daten: unknown): Neu => ({
  art: 'neu',
  tabelle: 'ereignis',
  felder: { client_id: EREIGNIS, typ, datenart: 'test', daten },
});

const phKontrolle = (felder: Record<string, unknown> = {}): Neu => ({
  art: 'neu',
  tabelle: 'messung',
  felder: { client_id: MESSUNG, messart: 'ph_kontrolle', datenart: 'test', ph: 7.02, ...felder },
});

/** Duplikat: einfuegen liefert 0 Zeilen, lesen die vorhandene Zeile */
function duplikat(vorhanden: Record<string, unknown>) {
  const fake = adapterNachbilden();
  fake.einfuegen.mockResolvedValueOnce(antwort([]));
  fake.lesen.mockResolvedValueOnce(antwort([{ id: 'srv-1', ...vorhanden }]));
  return fake;
}

const zeitpunkt = (wert: unknown) => new Date(wert as string).getTime();

describe('R1-1 Rücklesen vergleicht jsonb tief und ohne Reihenfolge der Schlüssel', () => {
  it('UC9-AK8 TO2 R1-1 daten { kategorie, text } zurück als { text, kategorie }: gespeichert', async () => {
    const fake = duplikat({
      client_id: EREIGNIS,
      typ: 'beobachtung',
      datenart: 'test',
      daten: { text: 'Blattränder braun', kategorie: 'tipburn' },
    });
    const ergebnis = await schreibenMit(fake.adapter)(
      ereignis('beobachtung', { kategorie: 'tipburn', text: 'Blattränder braun' }),
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [EREIGNIS] });
    expect(fake.lesen).toHaveBeenCalledTimes(1);
  });

  it('UC9-AK8 TO2 R1-1 ein anderer Wert in daten ergibt abweichend', async () => {
    const fake = duplikat({
      client_id: EREIGNIS,
      typ: 'beobachtung',
      datenart: 'test',
      daten: { text: 'Blattränder braun', kategorie: 'mehltau' },
    });
    const ergebnis = await schreibenMit(fake.adapter)(
      ereignis('beobachtung', { kategorie: 'tipburn', text: 'Blattränder braun' }),
      KONTEXT,
    );
    expect(ergebnis.status).toBe('abweichend');
  });

  it('UC9-AK8 TO2 R1-1 verschachtelte Objekte in anderer Schlüsselfolge: gespeichert', async () => {
    const fake = duplikat({
      client_id: EREIGNIS,
      typ: 'kurzpruefung',
      datenart: 'test',
      daten: {
        ok: false,
        ausnahmen: [{ grund: { text: 'tropft', stufe: 2 }, punkt: 'pumpe' }, { punkt: 'licht' }],
        punkt: 'pumpe',
      },
    });
    const ergebnis = await schreibenMit(fake.adapter)(
      ereignis('kurzpruefung', {
        punkt: 'pumpe',
        ok: false,
        ausnahmen: [{ punkt: 'pumpe', grund: { stufe: 2, text: 'tropft' } }, { punkt: 'licht' }],
      }),
      KONTEXT,
    );
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [EREIGNIS] });
  });

  it('UC9-AK8 TO2 R1-1 ein anderer Wert tief im verschachtelten Objekt ergibt abweichend', async () => {
    const fake = duplikat({
      client_id: EREIGNIS,
      typ: 'kurzpruefung',
      datenart: 'test',
      daten: {
        punkt: 'pumpe',
        ok: false,
        ausnahmen: [{ punkt: 'pumpe', grund: { stufe: 3, text: 'tropft' } }],
      },
    });
    const ergebnis = await schreibenMit(fake.adapter)(
      ereignis('kurzpruefung', {
        punkt: 'pumpe',
        ok: false,
        ausnahmen: [{ grund: { text: 'tropft', stufe: 2 }, punkt: 'pumpe' }],
      }),
      KONTEXT,
    );
    expect(ergebnis.status).toBe('abweichend');
  });

  it('UC9-AK8 TO2 R1-1 Arrays mit anderer Reihenfolge ergeben abweichend', async () => {
    const fake = duplikat({
      client_id: EREIGNIS,
      typ: 'kurzpruefung',
      datenart: 'test',
      daten: { punkt: 'pumpe', ausnahmen: [{ punkt: 'licht' }, { punkt: 'pumpe' }] },
    });
    const ergebnis = await schreibenMit(fake.adapter)(
      ereignis('kurzpruefung', { punkt: 'pumpe', ausnahmen: [{ punkt: 'pumpe' }, { punkt: 'licht' }] }),
      KONTEXT,
    );
    expect(ergebnis.status).toBe('abweichend');
  });
});

describe('R1-2 HTTP-Status auf der Antwort, nicht im error', () => {
  const einmal = async (status: number, error: Record<string, unknown>) => {
    const fake = adapterNachbilden();
    fake.einfuegen.mockResolvedValueOnce(antwort(null, error, status));
    const nachErfolg = vi.fn();
    const ergebnis = await schreibenMit(fake.adapter, nachErfolg)(phKontrolle(), KONTEXT);
    expect(nachErfolg).not.toHaveBeenCalled();
    return ergebnis;
  };

  it('R1-2 502 mit HTML-Fehlerseite ergibt nicht_gespeichert, server, wiederholbar', async () => {
    const ergebnis = await einmal(502, { message: '<html><body>502 Bad Gateway</body></html>' });
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('server');
    expect(ergebnis.fehler.wiederholbar).toBe(true);
    expect(ergebnis.bestaetigt).toBe(0);
  });

  it('R1-2 503 mit PGRST002 (Schema-Cache) ergibt server', async () => {
    const ergebnis = await einmal(503, {
      code: 'PGRST002',
      message: 'Could not query the database for the schema cache. Retrying.',
    });
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('server');
    expect(ergebnis.fehler.wiederholbar).toBe(true);
  });

  it('R1-2 401 mit «JWT expired» ergibt anmeldung', async () => {
    const ergebnis = await einmal(401, { message: 'JWT expired' });
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('anmeldung');
    expect(ergebnis.fehler.wiederholbar).toBe(true);
  });

  it('R1-2 Bündel-Lader: eine Seite mit Status 503 auf der Antwort ergibt fehler server', async () => {
    const db = datenbank();
    db.seite.mockImplementation(async (teil, bereich) =>
      teil.name === 'messung'
        ? antwort(null, { message: 'Service Unavailable' }, 503)
        : antwort((db.inhalt.get(teil.name) ?? []).slice(bereich.von, bereich.bis + 1)),
    );
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis.status).toBe('fehler');
    if (ergebnis.status !== 'fehler') return;
    expect(ergebnis.fehler.art).toBe('server');
    expect(ersetzen).not.toHaveBeenCalled();
  });
});

describe('R1-3 gilt_ab', () => {
  it('R1-3 MIT_GILT_AB: die Tabellen von MIT_ZEITACHSE und k_faktor', () => {
    expect(MIT_GILT_AB).toBeInstanceOf(Set);
    expect([...MIT_GILT_AB].sort()).toEqual([...MIT_ZEITACHSE, 'k_faktor'].sort());
    expect(MIT_GILT_AB.size).toBe(10);
  });

  it('R1-3 k_faktor ohne gilt_ab: gilt_ab = jetzt, ohne client_zeit', () => {
    const schritt: Neu = { art: 'neu', tabelle: 'k_faktor', felder: { client_id: K_FAKTOR, k: 0.88 } };
    const zeile = zeileVorbereiten(schritt, KONTEXT, VERSION);
    expect(zeitpunkt(zeile['gilt_ab'])).toBe(KONTEXT.jetzt.getTime());
    expect(zeile).not.toHaveProperty('client_zeit');
    expect(zeile['app_version']).toBe(VERSION);
  });

  it('R1-3 k_faktor behält ein mitgegebenes gilt_ab', () => {
    const schritt: Neu = {
      art: 'neu',
      tabelle: 'k_faktor',
      felder: { client_id: K_FAKTOR, k: 0.88, gilt_ab: '2026-11-20T06:00:00.000Z' },
    };
    const zeile = zeileVorbereiten(schritt, KONTEXT, VERSION);
    expect(zeile['gilt_ab']).toBe('2026-11-20T06:00:00.000Z');
    expect(zeile).not.toHaveProperty('client_zeit');
  });

  it('R1-3 gilt_ab: null wird zu jetzt (messung und k_faktor)', () => {
    for (const tabelle of ['messung', 'k_faktor'] as const) {
      const schritt: Neu = { art: 'neu', tabelle, felder: { client_id: K_FAKTOR, gilt_ab: null } };
      const zeile = zeileVorbereiten(schritt, KONTEXT, VERSION);
      expect(zeitpunkt(zeile['gilt_ab']), tabelle).toBe(KONTEXT.jetzt.getTime());
    }
  });

  it('R1-3 anlage hat kein gilt_ab: ein mitgegebenes wird entfernt', () => {
    const schritt: Neu = {
      art: 'neu',
      tabelle: 'anlage',
      felder: { client_id: ANLAGE, gilt_ab: '2026-11-20T06:00:00.000Z' },
    };
    const zeile = zeileVorbereiten(schritt, KONTEXT, VERSION);
    expect(zeile).not.toHaveProperty('gilt_ab');
    expect(zeile).not.toHaveProperty('client_zeit');
  });

  it('R1-3 23502 (Pflichtfeld fehlt) ergibt abgelehnt mit Grund in Worten', () => {
    const fehler = fehlerEinordnen({ status: 400, code: '23502' });
    expect(fehler.art).toBe('abgelehnt');
    expect(fehler.wiederholbar).toBe(false);
    expect(fehler.text.startsWith('Nicht gespeichert: ')).toBe(true);
    expect(fehler.text).not.toContain('Fehler 23502');
    expect(fehler.text).not.toContain('23502');
  });
});

describe('R1-4 Storno', () => {
  const storno = (tabelle: Erfassungstabelle, clientId: string): Schritt => ({
    art: 'storno',
    tabelle,
    clientId,
    grund: 'fehleingabe',
  });

  it('R1-4 storno_grund geht für Tabellen mit Zeitachse an den Adapter', async () => {
    const fake = adapterNachbilden();
    const ergebnis = await schreibenMit(fake.adapter)(storno('messung', MESSUNG), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });
    const [, , felder] = fake.stornieren.mock.calls[0] ?? [];
    expect(felder).toEqual({ storniert_am: KONTEXT.jetzt.toISOString(), storno_grund: 'fehleingabe' });
  });

  it('R1-4 ansatz_position: nur storniert_am, kein storno_grund', async () => {
    const fake = adapterNachbilden();
    const ergebnis = await schreibenMit(fake.adapter)(storno('ansatz_position', POSITION), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [POSITION] });
    expect(fake.stornieren).toHaveBeenCalledTimes(1);
    const [tabelle, clientId, felder] = fake.stornieren.mock.calls[0] ?? [];
    expect(tabelle).toBe('ansatz_position');
    expect(clientId).toBe(POSITION);
    expect(felder).toEqual({ storniert_am: KONTEXT.jetzt.toISOString() });
    expect(felder).not.toHaveProperty('storno_grund');
  });

  it('R1-4 vorgangPruefen: Storno auf etikett_aufruf ist ein Verstoss (kein storniert_am)', async () => {
    const verstoesse = vorgangPruefen([storno('etikett_aufruf', AUFRUF)]);
    expect(verstoesse.length).toBeGreaterThan(0);
    const fake = adapterNachbilden();
    const ergebnis = await schreibenMit(fake.adapter)(storno('etikett_aufruf', AUFRUF), KONTEXT);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    expect(fake.stornieren).not.toHaveBeenCalled();
  });

  it('R1-4 0 Zeilen beim Storno, Rücklesen mit gesetztem storniert_am: gespeichert (Wiederholung)', async () => {
    const fake = adapterNachbilden();
    fake.stornieren.mockResolvedValueOnce(antwort([]));
    fake.lesen.mockResolvedValueOnce(
      antwort([
        { client_id: MESSUNG, storniert_am: '2026-11-25T07:06:00+00:00', storno_grund: 'fehleingabe' },
      ]),
    );
    const nachErfolg = vi.fn();
    const ergebnis = await schreibenMit(fake.adapter, nachErfolg)(storno('messung', MESSUNG), KONTEXT);
    expect(ergebnis).toEqual({ status: 'gespeichert', clientIds: [MESSUNG] });
    expect(fake.lesen).toHaveBeenCalledTimes(1);
    expect(fake.lesen.mock.calls[0]?.slice(0, 2)).toEqual(['messung', MESSUNG]);
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('R1-4 0 Zeilen beim Storno, Rücklesen ohne Zeile: abgelehnt, nicht wiederholbar', async () => {
    const fake = adapterNachbilden();
    fake.stornieren.mockResolvedValueOnce(antwort([]));
    fake.lesen.mockResolvedValueOnce(antwort([]));
    const nachErfolg = vi.fn();
    const ergebnis = await schreibenMit(fake.adapter, nachErfolg)(storno('messung', MESSUNG), KONTEXT);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('abgelehnt');
    expect(ergebnis.fehler.wiederholbar).toBe(false);
    expect(ergebnis.fehler.text).toBe(TEXT_NICHT_GEFUNDEN);
    expect(ergebnis.bestaetigt).toBe(0);
    expect(nachErfolg).not.toHaveBeenCalled();
  });

  it('R1-4 0 Zeilen beim Storno, Zeile mit storniert_am = null: abgelehnt mit demselben Text', async () => {
    const fake = adapterNachbilden();
    fake.stornieren.mockResolvedValueOnce(antwort([]));
    fake.lesen.mockResolvedValueOnce(antwort([{ client_id: MESSUNG, storniert_am: null }]));
    const ergebnis = await schreibenMit(fake.adapter)(storno('messung', MESSUNG), KONTEXT);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    if (ergebnis.status !== 'nicht_gespeichert') return;
    expect(ergebnis.fehler.art).toBe('abgelehnt');
    expect(ergebnis.fehler.wiederholbar).toBe(false);
    expect(ergebnis.fehler.text).toBe(TEXT_NICHT_GEFUNDEN);
  });
});

describe('R1-11 Ereignisdaten', () => {
  it('R1-11 gefaesspruefung: schritt 1 bis 4 gültig, 0 und 5 Verstoss', () => {
    for (const schritt of [1, 2, 3, 4])
      expect(ereignisDatenPruefen('gefaesspruefung', { schritt }), `schritt ${schritt}`).toEqual([]);
    for (const schritt of [0, 5])
      expect(
        ereignisDatenPruefen('gefaesspruefung', { schritt }).length,
        `schritt ${schritt}`,
      ).toBeGreaterThan(0);
  });

  it('R1-11 vorgangPruefen: daten als Array, Text oder fehlend ist ein Verstoss', () => {
    for (const daten of [[], ['tipburn'], 'tipburn', undefined])
      expect(vorgangPruefen([ereignis('beobachtung', daten)]).length, JSON.stringify(daten)).toBeGreaterThan(
        0,
      );
  });

  it('R1-11 vorgangPruefen: {} ist für Typen ohne Schlüssel gültig', () => {
    expect(vorgangPruefen([ereignis('deckel_geoeffnet', {})])).toEqual([]);
  });

  it('R1-11 schreiben ruft den Adapter bei daten als Array nicht auf', async () => {
    const fake = adapterNachbilden();
    const ergebnis = await schreibenMit(fake.adapter)(ereignis('beobachtung', []), KONTEXT);
    expect(ergebnis.status).toBe('nicht_gespeichert');
    expect(fake.einfuegen).not.toHaveBeenCalled();
  });
});

// Bündel: Datenbank im Speicher wie in buendel-laden.test.ts
type Teil = (typeof BUENDEL_TEILE)[number];
type Bereich = { von: number; bis: number };
type Seite = (teil: Teil, bereich: Bereich, kontext: Zeitkontext, signal: AbortSignal) => Promise<Antwort>;

function datenbank(inhaltJeTeil: Record<string, unknown[]> = {}) {
  const inhalt = new Map<string, unknown[]>(
    BUENDEL_TEILE.map((t) => [t.name, inhaltJeTeil[t.name] ?? [{ id: `${t.name}-00000` }]]),
  );
  const istTim = vi.fn<(signal: AbortSignal) => Promise<Antwort>>(async () => antwort(true));
  const seite = vi.fn<Seite>(async (teil, bereich) =>
    antwort((inhalt.get(teil.name) ?? []).slice(bereich.von, bereich.bis + 1)),
  );
  const adapter = { istTim, seite } as unknown as Buendeladapter;
  return { inhalt, istTim, seite, adapter };
}

function speicherNachbilden() {
  const ersetzen = vi.fn<(buendel: Buendel) => Promise<void>>(async () => {});
  return { ersetzen, speicher: { ersetzen } as unknown as Buendelspeicher };
}

describe('R1-9 Bündel-Fenster', () => {
  it('R1-9 v_messung_unsicher nur für geladene Messungen', async () => {
    const db = datenbank({
      messung: [{ id: 'm1' }, { id: 'm2' }],
      v_messung_unsicher: [{ messung_id: 'm1' }, { messung_id: 'm2' }, { messung_id: 'm3' }],
    });
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis.status).toBe('geladen');
    if (ergebnis.status !== 'geladen') return;
    const unsicher = (ergebnis.buendel.teile['v_messung_unsicher'] ?? []) as { messung_id: string }[];
    expect(unsicher.map((z) => z.messung_id).sort()).toEqual(['m1', 'm2']);
    expect(ersetzen).toHaveBeenCalledTimes(1);
    const geschrieben = ersetzen.mock.calls[0]?.[0];
    const imSpeicher = (geschrieben?.teile['v_messung_unsicher'] ?? []) as { messung_id: string }[];
    expect(imSpeicher.map((z) => z.messung_id).sort()).toEqual(['m1', 'm2']);
  });
});

describe('R1-S2 Bündel und Nutzer', () => {
  it('R1-S2 nochGueltig = false: kein ersetzen, kein_zugang', async () => {
    const db = datenbank();
    const { ersetzen, speicher } = speicherNachbilden();
    const nochGueltig = vi.fn(async () => false);
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG, nochGueltig)(KONTEXT);
    expect(ergebnis).toEqual({ status: 'kein_zugang' });
    expect(nochGueltig).toHaveBeenCalled();
    expect(ersetzen).not.toHaveBeenCalled();
  });

  it('R1-S2 nochGueltig = true: Bündel wird ersetzt', async () => {
    const db = datenbank();
    const { ersetzen, speicher } = speicherNachbilden();
    const nochGueltig = vi.fn(async () => true);
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG, nochGueltig)(KONTEXT);
    expect(ergebnis.status).toBe('geladen');
    expect(ersetzen).toHaveBeenCalledTimes(1);
  });
});
