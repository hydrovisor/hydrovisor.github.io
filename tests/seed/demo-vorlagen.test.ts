// Demo-Vorlagen (einmal-Zeilen) beim Laden nachführen (#130) [SQL] gegen die lokale Datenbank (supabase start). Jeder
// Test läuft in einer äusseren Transaktion und endet mit rollback. Ausgangslage wie auf hydrovisor-dev vor #128: eine
// offene Zeile «Demo S8» mit der alten Fassung `{4}`. Routine: Tests vom Lead.
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { demoSkript, idFuer } from '../../scripts/demo/regeln.ts';
import { fixturesLesen } from '../../scripts/demo.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-12-14T08:00:00Z');
const UHR = { jetzt: JETZT, zeitzone: 'Europe/Zurich' };
const ALT_S8 = 'f1300000-0000-4000-8000-000000000008';

afterAll(async () => {
  await sql.end();
});

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

async function wissenLaden(tx: Db): Promise<void> {
  const { dateien, verstoesse } = dateienLesen(join(WURZEL, 'tests', 'fixtures', 'wissen'));
  expect(verstoesse).toEqual([]);
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const seed = ladeskript(plan, {
    jetzt: JETZT,
    commit: 'demo-vorlagen-test',
    gesamtfreigabe: false,
    trocken: false,
  });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
}

const s1 = () => fixturesLesen().filter((f) => f.name === 's1-regal.json');

const deckel = (tx: Db, name: string) =>
  tx<{ id: string; reihen: number[]; storniert: boolean }[]>`
    select id::text, loecher_je_reihe::int[] as reihen, storniert_am is not null as storniert
    from public.deckeltyp where name = ${name} order by erfasst_am, id`;

describe('Demo-Vorlagen beim Laden nachführen (#130)', () => {
  it('DV-AK1 abweichende offene Fassung von «Demo S8» wird storniert und neu angelegt; 4.2 und 4.3 zeigen auf die neue', async () => {
    await inTransaktion(async (tx) => {
      await wissenLaden(tx);
      await tx.unsafe(`insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version, erfasst_am)
        values ('${ALT_S8}', 'Demo S8', 80, '{4}', 'demo', '2026-11-01T08:00:00Z')`);
      await tx.unsafe(demoSkript(s1(), UHR).kern);
      const zeilen = await deckel(tx, 'Demo S8');
      expect(zeilen.map((z) => [z.id === ALT_S8, z.reihen, z.storniert])).toEqual([
        [true, [4], true],
        [false, [1, 1, 1, 1], false],
      ]);
      const ziel = await tx<{ deckel: string }[]>`
        select distinct g.deckeltyp_id::text as deckel from public.gefaess g
        where g.platz_id = any(${[idFuer('X-4.2'), idFuer('X-4.3')]}::uuid[]) and g.storniert_am is null`;
      expect(ziel).toEqual([{ deckel: zeilen[1]?.id }]);
    });
  });

  it('DV-AK2 gleiche Fassung bleibt: zweimal laden storniert keine Vorlage und legt keine doppelt an', async () => {
    await inTransaktion(async (tx) => {
      await wissenLaden(tx);
      await tx.unsafe(demoSkript(s1(), UHR).kern);
      const zaehlen = () =>
        tx<{ tabelle: string; offen: number; storniert: number }[]>`
          select 'deckeltyp' as tabelle, count(*) filter (where storniert_am is null)::int as offen,
                 count(*) filter (where storniert_am is not null)::int as storniert
          from public.deckeltyp where name like 'Demo %'
          union all
          select 'gefaessmodell', count(*) filter (where storniert_am is null)::int,
                 count(*) filter (where storniert_am is not null)::int
          from public.gefaessmodell where name like 'Demo %'`;
      const erst = await zaehlen();
      expect(erst).toEqual([
        { tabelle: 'deckeltyp', offen: 7, storniert: 0 },
        { tabelle: 'gefaessmodell', offen: 3, storniert: 0 },
      ]);
      await tx.unsafe(demoSkript(s1(), UHR).kern);
      expect(await zaehlen()).toEqual(erst);
    });
  });
});
