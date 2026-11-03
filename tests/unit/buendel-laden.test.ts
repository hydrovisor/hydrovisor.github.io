// Offline-Bündel laden (Plan 11 Testliste, Datenfluss «Lesen», Teile des Bündels, Ü3; 04_architektur.md 4.2).
// Fake-Adapter für ist_tim und die Seiten, Speicher als Fake; feste Uhr über den Zeitkontext.
import { describe, expect, it, vi } from 'vitest';
import {
  BUENDEL_TEILE,
  erstelleBuendelLaden,
  type Buendeladapter,
  type Buendelspeicher,
} from '../../src/daten/buendel.ts';
import type { Buendel } from '../../src/domain/datenpfad/buendel.ts';
import type { Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';

const KONTEXT: Zeitkontext = { jetzt: new Date('2026-11-25T07:07:00.000Z'), zeitzone: 'Europe/Zurich' };
const NUTZER = '00000000-0000-4000-8000-0000000000e2';
const BINDUNG = { appVersion: '0.1.0+abc1234', nutzerId: NUTZER };
const SEITE = 1000; // max_rows in supabase/config.toml

type Teil = (typeof BUENDEL_TEILE)[number];
type Bereich = { von: number; bis: number };
type Antwort = Awaited<ReturnType<Buendeladapter['seite']>>;
type Seite = (teil: Teil, bereich: Bereich, kontext: Zeitkontext, signal: AbortSignal) => Promise<Antwort>;
const antwort = (data: unknown, error: unknown = null) => ({ data, error }) as unknown as Antwort;

const zeilen = (anzahl: number, praefix: string) =>
  Array.from({ length: anzahl }, (_, i) => ({ id: `${praefix}-${String(i).padStart(5, '0')}` }));

/** Datenbank im Speicher: je Teil eine Liste; seite() liefert den Ausschnitt von..bis (inklusive) wie range() */
/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

function datenbank(mengen: Record<string, number> = {}, istTim = true) {
  const inhalt = new Map(BUENDEL_TEILE.map((t) => [t.name, zeilen(mengen[t.name] ?? 1, t.name)]));
  const istTimAufruf = vi.fn<(signal: AbortSignal) => Promise<Antwort>>(async () => antwort(istTim));
  const seite = vi.fn<Seite>(async (teil, bereich) =>
    antwort((inhalt.get(teil.name) ?? []).slice(bereich.von, bereich.bis + 1)),
  );
  const adapter = { istTim: istTimAufruf, seite } as unknown as Buendeladapter;
  return { inhalt, istTim: istTimAufruf, seite, adapter };
}

function speicherNachbilden() {
  const ersetzen = vi.fn<(buendel: Buendel) => Promise<void>>(async () => {});
  return { ersetzen, speicher: { ersetzen } as unknown as Buendelspeicher };
}

const aufrufeFuer = (seite: ReturnType<typeof datenbank>['seite'], name: string) =>
  seite.mock.calls.filter(([teil]) => teil.name === name).map(([, bereich]) => bereich);

describe('Teile des Bündels', () => {
  it('enthält die Teile Anlage, Wissen und Betrieb aus dem Plan', () => {
    const namen = BUENDEL_TEILE.map((t) => t.name);
    for (const name of [
      'anlage',
      'bereich',
      'platz',
      'etikett',
      'gefaess',
      'gefaessmodell',
      'deckeltyp',
      'anzuchtort',
      'netztopf',
      'v_gefaess_status',
      'v_fuellzustand',
      'sorte',
      'art',
      'art_kulturform',
      'kulturgruppe',
      'v_sollwert',
      'saatempfehlung',
      'duengerschema',
      'produkt',
      'wissenseintrag',
      'satz',
      'pflanzung',
      'v_pflanzung_zustand',
      'v_reservierung_aktiv',
      'messung',
      'v_messung_unsicher',
      'naehrloesungsansatz',
      'kalibrierung',
      'v_kalibrierung_faellig',
      'messgeraet',
      'aufschub',
      'einstellung',
    ])
      expect(namen, name).toContain(name);
    expect(new Set(namen).size).toBe(namen.length);
  });

  it('Ü3 einstellung mit expliziter Spaltenliste ohne telefon_vertretung', () => {
    const einstellung = BUENDEL_TEILE.find((t) => t.name === 'einstellung');
    expect(einstellung).toBeDefined();
    const spalten = da(einstellung, 'Teil einstellung')
      .spalten.split(',')
      .map((s) => s.trim());
    expect(spalten).not.toContain('*');
    expect(spalten).not.toContain('telefon_vertretung');
    expect(da(einstellung, 'Teil einstellung').spalten).not.toMatch(/telefon/);
    // was Heute und die Regeln brauchen, bleibt
    for (const noetig of ['id', 'thema', 'zeitzone', 'min_client_version'])
      expect(spalten, noetig).toContain(noetig);
  });

  it('Ü3 der Adapter erhält für einstellung die Spaltenliste ohne telefon_vertretung', async () => {
    const db = datenbank();
    const { speicher } = speicherNachbilden();
    await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    const teile = db.seite.mock.calls.map(([teil]) => teil).filter((t) => t.name === 'einstellung');
    expect(teile.length).toBeGreaterThan(0);
    for (const t of teile) expect(t.spalten).not.toMatch(/telefon_vertretung|\*/);
  });
});

describe('buendelLaden', () => {
  it('lädt alle Teile und ersetzt das Bündel einmal; stand = jetzt aus dem Parameter', async () => {
    const db = datenbank({ messgeraet: 1 });
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);

    expect(ergebnis.status).toBe('geladen');
    if (ergebnis.status !== 'geladen') return;
    const b = ergebnis.buendel;
    expect(b).toMatchObject({ id: 'aktuell', format: 1, nutzerId: NUTZER, appVersion: BINDUNG.appVersion });
    expect(new Date(b.stand).getTime()).toBe(KONTEXT.jetzt.getTime());
    expect(b.stand).toMatch(/Z$/);
    for (const teil of BUENDEL_TEILE) expect(b.teile[teil.name], teil.name).toBeDefined();
    expect(b.teile['messgeraet']).toHaveLength(1);
    expect(ersetzen).toHaveBeenCalledTimes(1);
    expect(ersetzen).toHaveBeenCalledWith(b);
    expect(db.istTim).toHaveBeenCalledTimes(1);
  });

  it('2500 Zeilen ergeben 3 Seiten zu 1000, 1000 und 500 Zeilen, alle im Bündel', async () => {
    const db = datenbank({ v_sollwert: 2500 });
    const { speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);

    expect(aufrufeFuer(db.seite, 'v_sollwert')).toEqual([
      { von: 0, bis: SEITE - 1 },
      { von: SEITE, bis: 2 * SEITE - 1 },
      { von: 2 * SEITE, bis: 3 * SEITE - 1 },
    ]);
    expect(ergebnis.status).toBe('geladen');
    if (ergebnis.status !== 'geladen') return;
    const geladen = ergebnis.buendel.teile['v_sollwert'] as { id: string }[];
    expect(geladen).toHaveLength(2500);
    expect(new Set(geladen.map((z) => z.id)).size).toBe(2500);
  });

  it('genau 1000 Zeilen: eine zweite, leere Seite beendet das Laden', async () => {
    const db = datenbank({ v_sollwert: SEITE });
    const { speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(aufrufeFuer(db.seite, 'v_sollwert')).toEqual([
      { von: 0, bis: SEITE - 1 },
      { von: SEITE, bis: 2 * SEITE - 1 },
    ]);
    expect(ergebnis.status === 'geladen' && ergebnis.buendel.teile['v_sollwert']).toHaveLength(SEITE);
  });

  it('eine unvolle erste Seite: nur ein Aufruf je Teil', async () => {
    const db = datenbank({ messgeraet: 1 });
    const { speicher } = speicherNachbilden();
    await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(aufrufeFuer(db.seite, 'messgeraet')).toEqual([{ von: 0, bis: SEITE - 1 }]);
  });

  it('scheitert ein Teil, wird nichts geschrieben und der Fehler eingeordnet', async () => {
    const db = datenbank({ v_sollwert: 2500 });
    const echt = da(db.seite.getMockImplementation(), 'Fake seite');
    db.seite.mockImplementation(async (teil, bereich, k, s) =>
      teil.name === 'v_sollwert' && bereich.von === SEITE
        ? antwort(null, { message: 'TypeError: Failed to fetch', code: '', status: 0 })
        : echt(teil, bereich, k, s),
    );
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis.status).toBe('fehler');
    if (ergebnis.status !== 'fehler') return;
    expect(ergebnis.fehler.art).toBe('kein_netz');
    expect(ersetzen).not.toHaveBeenCalled();
  });

  it('wirft ein Teil eine Ausnahme, wird ebenfalls nichts geschrieben', async () => {
    const db = datenbank();
    db.seite.mockImplementation(async (teil, bereich) => {
      if (teil.name === 'messung') throw new TypeError('Failed to fetch');
      return antwort(zeilen(1, teil.name).slice(bereich.von, bereich.bis + 1));
    });
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis.status).toBe('fehler');
    expect(ersetzen).not.toHaveBeenCalled();
  });

  it('ist_tim = false ergibt kein_zugang, ohne Teile zu laden und ohne zu schreiben', async () => {
    const db = datenbank({}, false);
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis).toEqual({ status: 'kein_zugang' });
    expect(db.seite).not.toHaveBeenCalled();
    expect(ersetzen).not.toHaveBeenCalled();
  });

  it('ist_tim ohne Netz ergibt fehler kein_netz ohne Schreiben', async () => {
    const db = datenbank();
    db.istTim.mockResolvedValueOnce(
      antwort(null, { message: 'TypeError: Failed to fetch', code: '', status: 0 }),
    );
    const { ersetzen, speicher } = speicherNachbilden();
    const ergebnis = await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    expect(ergebnis.status).toBe('fehler');
    if (ergebnis.status !== 'fehler') return;
    expect(ergebnis.fehler.art).toBe('kein_netz');
    expect(db.seite).not.toHaveBeenCalled();
    expect(ersetzen).not.toHaveBeenCalled();
  });

  it('der Zeitkontext geht an jede Seite (Fenster der Messungen ab fensterBeginn)', async () => {
    const db = datenbank();
    const { speicher } = speicherNachbilden();
    await erstelleBuendelLaden(db.adapter, speicher, BINDUNG)(KONTEXT);
    const messung = db.seite.mock.calls.filter(([teil]) => teil.name === 'messung');
    expect(messung.length).toBeGreaterThan(0);
    for (const [, , kontext] of messung) expect(kontext).toEqual(KONTEXT);
  });
});
