// Schreibweg der Einstellungen (Plan 32; Prüfer Runde 1 Befunde 1 bis 3): Update der einzigen Zeile nach id, Lesen
// der Telefonnummer nur online mit eigenem Lesetext. Routine: Tests vom Lead.
import { describe, expect, it, vi } from 'vitest';
import {
  erstelleEinstellungSchreiben,
  TEXT_NICHT_GELESEN,
  type EinstellungAdapter,
} from '../../src/daten/schreiben.ts';
import { TEXT_KEIN_NETZ } from '../../src/domain/datenpfad/fehler.ts';

vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));

const ID = '34000000-0000-4000-8000-000000000001';
const KEIN_NETZ = { message: 'TypeError: Failed to fetch', code: '', status: 0 };

function adapter(antwort: { data: unknown; error: unknown }): EinstellungAdapter & { aufrufe: unknown[][] } {
  const aufrufe: unknown[][] = [];
  return {
    aufrufe,
    aendern: async (t, id, felder) => {
      aufrufe.push(['aendern', t, id, felder]);
      return antwort as never;
    },
    lesen: async (t, id, spalten) => {
      aufrufe.push(['lesen', t, id, spalten]);
      return antwort as never;
    },
  };
}

describe('Einstellungen schreiben (Plan 32)', () => {
  it('Erfolg: Update nach id, danach Bündel neu laden', async () => {
    const a = adapter({ data: [{ id: ID }], error: null });
    const nachErfolg = vi.fn();
    const w = erstelleEinstellungSchreiben(a, { nachErfolg });
    expect(await w.aendern('einstellung', ID, { push_zeit: '06:30' })).toEqual({
      status: 'gespeichert',
      zeile: { id: ID },
    });
    expect(a.aufrufe).toEqual([['aendern', 'einstellung', ID, { push_zeit: '06:30' }]]);
    expect(nachErfolg).toHaveBeenCalledTimes(1);
  });

  it('kein Netz: nicht gespeichert mit dem Text des Datenpfads, kein Neuladen', async () => {
    const nachErfolg = vi.fn();
    const w = erstelleEinstellungSchreiben(adapter({ data: null, error: KEIN_NETZ }), { nachErfolg });
    const r = await w.aendern('messgeraet', ID, { u_ec: 0.1, u_ph: 0.1 });
    expect(r).toMatchObject({
      status: 'nicht_gespeichert',
      fehler: { text: TEXT_KEIN_NETZ, wiederholbar: true },
    });
    expect(nachErfolg).not.toHaveBeenCalled();
  });

  it('keine Zeile zurück (RLS oder falsche id): abgelehnt, nicht wiederholbar', async () => {
    const w = erstelleEinstellungSchreiben(adapter({ data: [], error: null }), {});
    expect(await w.aendern('einstellung', ID, { thema: 'dunkel' })).toMatchObject({
      status: 'nicht_gespeichert',
      fehler: { art: 'abgelehnt', wiederholbar: false },
    });
  });

  it('Lesen: gelesen mit Zeile, ohne Neuladen; bei Fehler eigener Lesetext statt «nicht gespeichert»', async () => {
    const nachErfolg = vi.fn();
    const ok = erstelleEinstellungSchreiben(
      adapter({ data: [{ id: ID, telefon_vertretung: 'Platzhalter' }], error: null }),
      {
        nachErfolg,
      },
    );
    expect(await ok.lesen('einstellung', ID, 'id,telefon_vertretung')).toEqual({
      status: 'gelesen',
      zeile: { id: ID, telefon_vertretung: 'Platzhalter' },
    });
    expect(nachErfolg).not.toHaveBeenCalled();
    const fehler = erstelleEinstellungSchreiben(adapter({ data: null, error: KEIN_NETZ }), {});
    expect(await fehler.lesen('einstellung', ID, 'id,telefon_vertretung')).toEqual({
      status: 'nicht_gelesen',
      text: TEXT_NICHT_GELESEN,
    });
    const leer = erstelleEinstellungSchreiben(adapter({ data: [], error: null }), {});
    expect((await leer.lesen('einstellung', ID, 'id')).status).toBe('nicht_gelesen');
  });
});
