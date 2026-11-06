// UC12-AK1 [SQL] (Issue #40, Plan 40 Testliste; R7.2, 03_import_w0.md 8.7): Jede Kombination aus Art und Phase der
// Startbelegung hat mindestens eine Wissenskarte, sonst bricht die Gesamtfreigabe ab. Vitest gegen die lokale
// Datenbank (supabase start, vorher supabase db reset); jeder Fall läuft in einer Transaktion und endet mit rollback.
// Fixture-Wissen aus tests/fixtures/wissen (die CSV bleibt unverändert, seed.test.ts zählt 3 Karten); fehlende Karten
// legt der Test im Speicher dazu.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { berichtMarkdown, type SeedBericht } from '../../scripts/seed/bericht.ts';
import {
  WISSEN_LUECKEN_MELDUNG,
  WISSEN_LUECKEN_SQL,
  WISSEN_PRUEFUNG_SQL,
} from '../../scripts/seed/wissen-abdeckung.ts';
import { PFAD, dateienAus, entfernen, kopie, muss, type Dateien } from '../unit/w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];
type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-11-24T08:00:00Z');

afterAll(async () => {
  await sql.end();
});

function wissen(): Dateien {
  const roh: Record<string, string> = {};
  const basis = join(WURZEL, 'tests/fixtures/wissen');
  for (const datei of readdirSync(basis, { recursive: true, encoding: 'utf8' }))
    if (datei.endsWith('.csv')) roh[datei.replace(/\\/g, '/')] = readFileSync(join(basis, datei), 'utf8');
  return dateienAus(roh, '');
}

function skript(d: Dateien, gesamtfreigabe = false) {
  const dateien = d as unknown as W0Dateien;
  expect(pruefen(dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  return ladeskript(plan, { jetzt: JETZT, commit: 'test40', gesamtfreigabe, trocken: false });
}

/** Kern des Skripts in der Transaktion des Tests, danach der Bericht */
async function laden(tx: Db, d: Dateien): Promise<SeedBericht> {
  const s = skript(d);
  await tx.unsafe(s.vorbereitung);
  await tx.unsafe(s.kern);
  const [z] = await tx.unsafe(s.berichtAbfrage);
  const wert = muss(z, 'Bericht')['bericht'];
  return (typeof wert === 'string' ? JSON.parse(wert) : wert) as SeedBericht;
}

const luecken = async (tx: Db) =>
  (await tx.unsafe(WISSEN_LUECKEN_SQL)).map((z) => `${String(z['art_id'])}/${String(z['phase'])}`);

class Zurueck extends Error {}
async function inTransaktion(f: (tx: Db) => Promise<void>): Promise<void> {
  try {
    await sql.begin(async (tx) => {
      await f(tx as unknown as Db);
      throw new Zurueck('rollback');
    });
  } catch (e) {
    if (!(e instanceof Zurueck)) throw e;
  }
}

/** eine Karte je Art und Phase auf Ebene Art (Kopie der Fixture-Karte, eigene zeile_id) */
function karteDazu(d: Dateien, art: string, phase: string): void {
  kopie(d, PFAD.wissenseintrag, 'we.test_art_a.wachstum.1', {
    zeile_id: `we.${art}.${phase}.test40`,
    ebene: 'art',
    bezug: art,
    phase,
    text: `Testkarte ${art} ${phase}, erfunden.`,
  });
}

/** Fixture-Wissen mit Karten für alle Lücken des ersten Laufs */
async function vollstaendig(tx: Db): Promise<{ d: Dateien; ergaenzt: string[] }> {
  await laden(tx, wissen());
  const ergaenzt = await luecken(tx);
  const d = wissen();
  for (const l of ergaenzt) {
    const [art, phase] = l.split('/') as [string, string];
    karteDazu(d, art, phase);
  }
  return { d, ergaenzt };
}

describe('UC12-AK1 Wissenskarten je Art und Phase der Startbelegung', () => {
  it('UC12-AK1 jede Art und Phase der Startbelegung hat eine Karte, sonst bricht die Gesamtfreigabe ab', async () => {
    await inTransaktion(async (tx) => {
      const { d, ergaenzt } = await vollstaendig(tx);
      // das Fixture-Wissen hat nur 2 Karten je Art oder Gruppe: es fehlen welche, darunter Testart A in Anzucht
      expect(ergaenzt).toContain('test_art_a/anzucht');
      // Karte auf Ebene Art (Testart A Wachstum) und Kulturgruppe (test_frucht Blüte) decken ab
      expect(ergaenzt).not.toContain('test_art_a/wachstum');
      expect(ergaenzt).not.toContain('test_art_a/bluete');
      // mit allen Karten keine Lücke, die Prüfung der Gesamtfreigabe läuft durch
      const bericht = await laden(tx, d);
      expect(bericht.wissenLuecken).toEqual([]);
      expect(await luecken(tx)).toEqual([]);
      await tx.unsafe(WISSEN_PRUEFUNG_SQL);
    });
    // eine Karte weniger: Abbruch mit Art und Phase in der Meldung
    const fehler = await inTransaktion(async (tx) => {
      const { d } = await vollstaendig(tx);
      entfernen(d, PFAD.wissenseintrag, 'we.test_art_a.anzucht.test40');
      const bericht = await laden(tx, d);
      expect(bericht.wissenLuecken).toEqual([{ artId: 'test_art_a', phase: 'anzucht' }]);
      expect(berichtMarkdown(bericht, { ziel: 'lokal', commit: 'test40', trocken: false })).toContain(
        '- test_art_a / anzucht',
      );
      await tx.unsafe(WISSEN_PRUEFUNG_SQL);
    }).then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(fehler).toBeInstanceOf(Error);
    expect((fehler as Error).message).toContain(`${WISSEN_LUECKEN_MELDUNG} test_art_a/anzucht`);
  });

  it('UC12-AK1 eine Karte auf Ebene Kulturgruppe deckt alle Arten der Gruppe; Phasen mit «entfällt» brauchen keine', async () => {
    await inTransaktion(async (tx) => {
      await laden(tx, wissen());
      const l = await luecken(tx);
      // test_frucht Blüte: Testart A (anwendbar) gedeckt; Testart B hat Blüte «entfällt»
      expect(l.filter((x) => x.endsWith('/bluete'))).toEqual([]);
      expect(l.filter((x) => x.endsWith('/fruchtbildung_reife') && !x.startsWith('test_art_a/'))).toEqual([]);
    });
  });

  it('UC12-AK1 eine stornierte Packung zählt nicht zur Startbelegung', async () => {
    await inTransaktion(async (tx) => {
      await laden(tx, wissen());
      const vorher = await luecken(tx);
      expect(vorher.some((x) => x.startsWith('test_art_a/'))).toBe(true);
      await tx.unsafe(`update public.saatgut g set storniert_am = now()
                         from public.sorte s where s.sorte_id = g.sorte_id and s.art_id = 'test_art_a'`);
      const nachher = await luecken(tx);
      expect(nachher.some((x) => x.startsWith('test_art_a/'))).toBe(false);
      expect(nachher).toEqual(vorher.filter((x) => !x.startsWith('test_art_a/')));
    });
  });

  it('UC12-AK1 die Gesamtfreigabe enthält die Prüfung der Wissenskarten, die Teilfreigabe nicht', () => {
    expect(skript(wissen(), true).kern).toContain(WISSEN_PRUEFUNG_SQL);
    expect(skript(wissen(), false).kern).not.toContain(WISSEN_LUECKEN_MELDUNG);
  });
});
