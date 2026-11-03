// Nachbesserung Runde 1 (Prüferbefunde 2 und 3, Issue #10): Zähltest mit stornierter Seed-Packung, Hinweise für
// geänderte Packung und abweichendes Messgerät (A7). Vom Lead ergänzt, nicht vom Testentwickler. Prüfart [SQL]
// über Vitest gegen die lokale Datenbank wie tests/seed/seed.test.ts (Entscheid 0007); jeder Test endet mit rollback.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import type { W0Dateien } from '../../src/domain/w0/typen.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { alsBericht, type SeedBericht } from '../../scripts/seed/bericht.ts';
import { dateienAus, PFAD, zeile, type Dateien } from '../unit/w0-hilfen.ts';

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT1 = new Date('2026-11-24T08:00:00Z');
const JETZT2 = new Date('2026-11-25T08:00:00Z');

function wissen(): Dateien {
  const basis = join(WURZEL, 'tests/fixtures/wissen');
  const roh: Record<string, string> = {};
  for (const datei of readdirSync(basis, { recursive: true, encoding: 'utf8' })) {
    if (datei.endsWith('.csv')) roh[datei.replace(/\\/g, '/')] = readFileSync(join(basis, datei), 'utf8');
  }
  return dateienAus(roh, '');
}

async function lauf(tx: postgres.Sql, d: Dateien, jetzt: Date, commit: string): Promise<SeedBericht> {
  const dateien = d as unknown as W0Dateien;
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const s = ladeskript(plan, { jetzt, commit, gesamtfreigabe: false, trocken: false });
  await tx.unsafe(s.vorbereitung);
  await tx.unsafe(s.kern);
  const [z] = await tx.unsafe(s.berichtAbfrage);
  return alsBericht(z?.['bericht']);
}

class Zurueck extends Error {}
async function inTransaktion(f: (tx: postgres.Sql) => Promise<void>): Promise<void> {
  try {
    await sql.begin(async (tx) => {
      await f(tx as unknown as postgres.Sql);
      throw new Zurueck('rollback');
    });
  } catch (e) {
    if (!(e instanceof Zurueck)) throw e;
  }
}

afterAll(async () => {
  await sql.end();
});

describe('Seed Nachbesserung', () => {
  it('Zähltest zählt eine von Tim stornierte Seed-Packung weiter und bricht nicht ab', async () => {
    await inTransaktion(async (tx) => {
      await lauf(tx, wissen(), JETZT1, 'test1');
      await tx`update public.saatgut set storniert_am = now()
                where sorte_id = (select id from public.sorte_schluessel where sorte_key = 'sorte-test-a-eins')`;
      const b = await lauf(tx, wissen(), JETZT2, 'test2');
      expect(b.dateien.length).toBeGreaterThan(0);
      const [z] = await tx`select count(*)::int as n from public.saatgut`;
      expect(Number(z?.['n'])).toBe(4);
    });
  });

  it('Idempotenz geänderte Packung in der Datei: nichts geladen, Hinweis im Bericht (A7)', async () => {
    await inTransaktion(async (tx) => {
      await lauf(tx, wissen(), JETZT1, 'test1');
      const d = wissen();
      zeile(d, PFAD.sorten, 'sorte-test-a-eins')['bestand_korn'] = '15';
      const b = await lauf(tx, d, JETZT2, 'test2');
      const [z] =
        await tx`select bestand_korn from public.saatgut s join public.sorte_schluessel k on k.id = s.sorte_id
                            where k.sorte_key = 'sorte-test-a-eins'`;
      expect(Number(z?.['bestand_korn'])).toBe(20);
      expect((b.hinweise ?? []).join(' ')).toMatch(/Packung sorte-test-a-eins/);
    });
  });

  it('Idempotenz abweichendes Messgerät bleibt und erscheint als Hinweis (A7)', async () => {
    await inTransaktion(async (tx) => {
      await lauf(tx, wissen(), JETZT1, 'test1');
      await tx`update public.messgeraet set u_ec = 0.05`;
      const b = await lauf(tx, wissen(), JETZT2, 'test2');
      const [z] = await tx`select count(*)::int as n, min(u_ec)::text as u from public.messgeraet`;
      expect(z).toMatchObject({ n: 1, u: '0.050' });
      expect((b.hinweise ?? []).join(' ')).toMatch(/Messgerät weicht/);
    });
  });
});
