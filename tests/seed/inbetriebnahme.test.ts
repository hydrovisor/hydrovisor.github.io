// Inbetriebnahme-AK2 [SQL] (Plan 22 Testliste, A10; use_cases_f4.md Ablauf «Inbetriebnahme», EK1; 06_tests.md 9
// «Abläufe» und 10 S1) gegen die lokale Datenbank (supabase start), wie tests/seed/demo.test.ts. Jeder Test läuft in
// einer äusseren Transaktion und endet mit rollback: zuerst der Test-Wissensstand mit dem kern des Seeds, dann nur
// das Szenario S1 (s1-regal.json) über demoSkript mit fester Uhr.
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
const ANLAGE_X = idFuer('X');

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

async function s1Laden(tx: Db): Promise<void> {
  const { dateien, verstoesse } = dateienLesen(join(WURZEL, 'tests', 'fixtures', 'wissen'));
  expect(verstoesse).toEqual([]);
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const seed = ladeskript(plan, {
    jetzt: JETZT,
    commit: 'inbetriebnahme-test',
    gesamtfreigabe: false,
    trocken: false,
  });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
  const s1 = fixturesLesen().filter((f) => f.name === 's1-regal.json');
  expect(s1).toHaveLength(1);
  await tx.unsafe(demoSkript(s1, UHR).kern);
}

describe('Inbetriebnahme-AK2 Szenario S1 (Anlage X)', () => {
  it('Inbetriebnahme-AK2 S1: 13 Gefässe «in Betrieb (Volumen offen)» oder «in Betrieb» mit Prüfprotokoll Schritte 1 bis 3', async () => {
    await inTransaktion(async (tx) => {
      await s1Laden(tx);
      const zeilen = await tx<{ kennung: string; status: string; schritte: number[] }[]>`
        select p.kennung, s.status::text as status,
               coalesce(array(
                 select distinct (e.daten ->> 'schritt')::int
                   from public.ereignis e
                  where e.platz_id = p.id and e.typ = 'gefaesspruefung' and e.storniert_am is null
                    and (e.daten ->> 'ok')::boolean
                    and (e.daten ->> 'schritt')::int between 1 and 3
                  order by 1), '{}') as schritte
          from public.gefaess g
          join public.platz p on p.id = g.platz_id
          join public.v_gefaess_status s on s.gefaess_id = g.id
         where p.anlage_id = ${ANLAGE_X}::uuid and g.gueltig_bis is null and g.storniert_am is null
         order by p.kennung`;
      expect(zeilen).toHaveLength(13);
      for (const z of zeilen) {
        expect(['in_betrieb', 'in_betrieb_volumen_offen'], z.kennung).toContain(z.status);
        expect(z.schritte, z.kennung).toEqual([1, 2, 3]);
      }
      expect(zeilen.map((z) => z.kennung)).toEqual([
        '1.1',
        '1.2',
        '2.1',
        '2.2',
        '2.3',
        '3.1',
        '3.2',
        '3.3',
        '4.1',
        '4.2',
        '4.3',
        '4.4',
        '4.5',
      ]);
    });
  });

  it('Inbetriebnahme-AK2 S1: 84 Löcher, 44 auf Ebene 1 bis 3, 40 Stationsplätze, davon 32 mit 5 cm', async () => {
    await inTransaktion(async (tx) => {
      await s1Laden(tx);
      const [z] = await tx<{ alle: number; ebene13: number; ebene4: number; ebene4_5cm: number }[]>`
        with loecher as (
          select b.nummer,
                 d.topfdurchmesser_mm,
                 (select coalesce(sum(n), 0) from unnest(d.loecher_je_reihe) as n)::int as anzahl
            from public.gefaess g
            join public.platz p on p.id = g.platz_id
            join public.bereich b on b.id = p.bereich_id
            join public.deckeltyp d on d.id = g.deckeltyp_id
           where p.anlage_id = ${ANLAGE_X}::uuid and g.gueltig_bis is null and g.storniert_am is null
        )
        select coalesce(sum(anzahl), 0)::int as alle,
               coalesce(sum(anzahl) filter (where nummer between 1 and 3), 0)::int as ebene13,
               coalesce(sum(anzahl) filter (where nummer = 4), 0)::int as ebene4,
               coalesce(sum(anzahl) filter (where nummer = 4 and topfdurchmesser_mm = 50), 0)::int as ebene4_5cm
          from loecher`;
      expect(z).toEqual({ alle: 84, ebene13: 44, ebene4: 40, ebene4_5cm: 32 });
    });
  });

  it('Inbetriebnahme-AK2 S1: 4 Anzuchtboxen mit Etikett-Code X-A1 bis X-A4 im Format 55x25', async () => {
    await inTransaktion(async (tx) => {
      await s1Laden(tx);
      const boxen = await tx<{ kennung: string; typ: string; code: string; format: string }[]>`
        select p.kennung, a.typ::text as typ, e.code, e.format::text as format
          from public.anzuchtort a
          join public.platz p on p.id = a.platz_id
          join public.etikett e on e.platz_id = p.id and e.storniert_am is null
         where p.anlage_id = ${ANLAGE_X}::uuid and a.storniert_am is null
         order by p.kennung`;
      expect(boxen).toEqual([
        { kennung: 'A1', typ: 'box_licht', code: 'X-A1', format: '55x25' },
        { kennung: 'A2', typ: 'box_licht', code: 'X-A2', format: '55x25' },
        { kennung: 'A3', typ: 'box_dunkel', code: 'X-A3', format: '55x25' },
        { kennung: 'A4', typ: 'box_dunkel', code: 'X-A4', format: '55x25' },
      ]);
      // jedes Gefäss, jede Box und W tragen genau ein Etikett mit dem Code aus Kürzel und Kennung (R9.1)
      const [etiketten] = await tx<{ orte: number; mit_etikett: number; falsch: number }[]>`
        select count(distinct p.id)::int as orte,
               count(distinct e.platz_id)::int as mit_etikett,
               count(*) filter (where e.code <> 'X-' || p.kennung)::int as falsch
          from public.platz p
          left join public.etikett e on e.platz_id = p.id and e.storniert_am is null
         where p.anlage_id = ${ANLAGE_X}::uuid and p.storniert_am is null`;
      expect(etiketten).toEqual({ orte: 18, mit_etikett: 18, falsch: 0 });
    });
  });
});
