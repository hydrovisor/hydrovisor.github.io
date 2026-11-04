// AK «Demo löschen» [SQL] (Issue #15, Plan 15; 06_tests.md Abschnitte 9 und 10; Konzept 8.5) gegen die lokale
// Datenbank (supabase start). Jeder Test läuft in einer äusseren Transaktion und endet mit rollback: zuerst der
// Test-Wissensstand (Sorten, Messgerät) mit dem kern des Seeds, dann echte Vergleichszeilen, dann der kern der Demo.
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { demoSkript, idFuer, type Fixture } from '../../scripts/demo/regeln.ts';
import { fixturesLesen } from '../../scripts/demo.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-11-24T08:00:00Z');
const UHR = { jetzt: JETZT, zeitzone: 'Europe/Zurich' };
const ECHT = 'f1500000-0000-4000-8000-0000000000';

afterAll(async () => {
  await sql.end();
});

class Zurueck extends Error {}
/** Äussere Transaktion, endet immer mit rollback */
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
  const skript = ladeskript(plan, {
    jetzt: JETZT,
    commit: 'demo-test',
    gesamtfreigabe: false,
    trocken: false,
  });
  await tx.unsafe(skript.vorbereitung);
  await tx.unsafe(skript.kern);
}

/** echte Anlage RT mit Platz, Gefäss, Messung, Ansatz, Ereignis, dazu echte Kalibrierung und pH-Kontrolle */
async function echteZeilen(tx: Db): Promise<void> {
  await tx.unsafe(`
    insert into public.anlage (id, name, kuerzel, datenart, app_version) values ('${ECHT}01', 'Echtes Regal', 'RT', 'echt', 'test');
    insert into public.platz (id, anlage_id, kennung, rolle, app_version) values ('${ECHT}02', '${ECHT}01', '2.3', 'gefaess', 'test');
    insert into public.gefaessmodell (id, name, form, innen_l_mm, innen_b_mm, innen_h_mm, betriebsvolumen_l, app_version)
      values ('${ECHT}11', 'Echte Box', 'rechteckig', 400, 300, 170, 9, 'test');
    insert into public.deckeltyp (id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
      values ('${ECHT}12', 'Echter Deckel', 80, '{2,2}', 'test');
    insert into public.gefaess (id, platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, betriebsvolumen_l, intervall_messen_d, intervall_wechseln_d, app_version)
      values ('${ECHT}03', '${ECHT}02', '${ECHT}11', '${ECHT}12', 'dwc', 9, 2, 14, 'test');
    insert into public.messung (id, client_id, platz_id, messgeraet_id, messart, ph, gilt_ab, app_version)
      select '${ECHT}04', '${ECHT}04', '${ECHT}02', (select id from public.messgeraet order by id limit 1), 'rundgang', 6.1, now(), 'test';
    insert into public.messung (id, client_id, messgeraet_id, messart, ph, datenart, gilt_ab, app_version)
      select '${ECHT}05', '${ECHT}05', (select id from public.messgeraet order by id limit 1), 'ph_kontrolle', 7.0, 'echt', now(), 'test';
    insert into public.kalibrierung (id, client_id, messgeraet_id, datenart, gilt_ab, app_version)
      select '${ECHT}06', '${ECHT}06', (select id from public.messgeraet order by id limit 1), 'echt', now(), 'test';
    insert into public.naehrloesungsansatz (id, client_id, platz_id, typ, begonnen_am, volumen_l, gilt_ab, app_version)
      values ('${ECHT}07', '${ECHT}07', '${ECHT}02', 'neuansatz', now(), 9, now(), 'test');
    insert into public.ereignis (id, client_id, typ, platz_id, gilt_ab, app_version)
      values ('${ECHT}08', '${ECHT}08', 'gefaess_erfasst', '${ECHT}02', now(), 'test');`);
}

const ECHTE_TABELLEN = [
  'anlage',
  'platz',
  'gefaess',
  'messung',
  'kalibrierung',
  'naehrloesungsansatz',
  'ereignis',
];

async function echteAnzahl(tx: Db): Promise<number> {
  let n = 0;
  for (const t of ECHTE_TABELLEN) {
    const [z] = await tx.unsafe(`select count(*)::int as n from public.${t} where id::text like '${ECHT}%'`);
    n += Number(z?.['n'] ?? 0);
  }
  return n;
}

/** Zeilen der Fixtures je Tabelle, die über ihre deterministische ID in der Datenbank stehen (ohne einmal-Zeilen) */
async function demoZeilen(tx: Db, fixtures: Fixture[]): Promise<Record<string, number>> {
  const ids = new Map<string, string[]>();
  for (const z of fixtures.flatMap((f) => f.zeilen))
    if (!z.einmal) ids.set(z.tabelle, [...(ids.get(z.tabelle) ?? []), idFuer(z.ref)]);
  const ergebnis: Record<string, number> = {};
  for (const [tabelle, liste] of ids) {
    const [z] = await tx.unsafe(
      `select count(*)::int as n from public.${tabelle} where id = any($1::uuid[])`,
      [liste],
    );
    ergebnis[tabelle] = Number(z?.['n'] ?? 0);
  }
  return ergebnis;
}

/** Zeilenzahl jeder Tabelle im Schema public */
async function zeilenzahlen(tx: Db): Promise<Record<string, number>> {
  const tabellen = await tx<{ t: string }[]>`
    select tablename as t from pg_tables where schemaname = 'public' order by tablename`;
  const ergebnis: Record<string, number> = {};
  for (const { t } of tabellen) {
    const [z] = await tx.unsafe(`select count(*)::int as n from public.${t}`);
    ergebnis[t] = Number(z?.['n'] ?? 0);
  }
  return ergebnis;
}

describe('npm run demo gegen die lokale Datenbank', () => {
  const fixtures = fixturesLesen();
  const skript = demoSkript(fixtures, UHR);
  const erwartet: Record<string, number> = {};
  for (const z of fixtures.flatMap((f) => f.zeilen))
    if (!z.einmal) erwartet[z.tabelle] = (erwartet[z.tabelle] ?? 0) + 1;

  it('Demo löschen (`06_tests.md` Abschnitt 9): lädt S1 bis S9 und Y vollständig, löscht sie mit datenart_loeschen() auf 0 Zeilen, echte Zeilen bleiben', async () => {
    await inTransaktion(async (tx) => {
      await wissenLaden(tx);
      await echteZeilen(tx);
      expect(await echteAnzahl(tx)).toBe(8);

      await tx.unsafe(skript.kern);
      expect(await demoZeilen(tx, fixtures)).toEqual(erwartet);
      const anlagen = await tx<{ kuerzel: string; datenart: string }[]>`
        select kuerzel, datenart::text as datenart from public.anlage where storniert_am is null order by kuerzel`;
      expect(anlagen).toEqual([
        { kuerzel: 'RT', datenart: 'echt' },
        { kuerzel: 'X', datenart: 'demo' },
        { kuerzel: 'Y', datenart: 'test' },
        { kuerzel: 'Z', datenart: 'demo' },
      ]);

      await tx.unsafe("select public.datenart_loeschen('demo'); select public.datenart_loeschen('test');");
      const nachher = await demoZeilen(tx, fixtures);
      expect(
        Object.values(nachher).every((n) => n === 0),
        JSON.stringify(nachher),
      ).toBe(true);
      const [rest] = await tx.unsafe(`
        select (select count(*) from public.anlage where datenart <> 'echt')::int as anlagen,
               (select count(*) from public.kalibrierung where datenart <> 'echt')::int as kalibrierungen,
               (select count(*) from public.messung where datenart in ('demo', 'test'))::int as ph_kontrollen,
               (select count(*) from public.ereignis where daten ->> 'datenart' in ('demo', 'test'))::int as ereignisse,
               (select count(*) from public.pflanzvorgang)::int as pflanzvorgaenge,
               (select count(*) from public.etikett where code ~ '^[XYZ]-')::int as etiketten`);
      expect(rest).toEqual({
        anlagen: 0,
        kalibrierungen: 0,
        ph_kontrollen: 0,
        ereignisse: 0,
        pflanzvorgaenge: 0,
        etiketten: 0,
      });
      expect(await echteAnzahl(tx)).toBe(8);
    });
  });

  it('Demo löschen (`06_tests.md` Abschnitt 9): zweimal laden ergibt dieselben Zeilenzahlen in allen Tabellen', async () => {
    await inTransaktion(async (tx) => {
      await wissenLaden(tx);
      await tx.unsafe(skript.kern);
      const erst = await zeilenzahlen(tx);
      await tx.unsafe(demoSkript(fixtures, { ...UHR, jetzt: new Date(JETZT.getTime() + 86_400_000) }).kern);
      expect(await zeilenzahlen(tx)).toEqual(erst);
      expect(erst['platz']).toBeGreaterThanOrEqual(28);
    });
  });

  it('Sichten nach dem Laden: Füllzustand, Prüfstatus, Phasen und Reservierungen wie in den Szenarien', async () => {
    await inTransaktion(async (tx) => {
      await wissenLaden(tx);
      await tx.unsafe(skript.kern);
      const ort = (r: string) => idFuer(r);
      const fuell = await tx<{ platz_id: string; fuellzustand: string }[]>`
        select platz_id::text, fuellzustand from public.v_fuellzustand`;
      const zustand = (r: string) => fuell.find((f) => f.platz_id === ort(r))?.fuellzustand;
      expect(zustand('X-2.3')).toBe('loesung'); // S2
      expect(zustand('X-2.2')).toBe('leer'); // S7
      expect(['Z-1.1', 'Z-1.2', 'Z-2.1', 'Z-2.2'].map(zustand)).toEqual([
        'loesung',
        'loesung',
        'loesung',
        'loesung',
      ]); // S9

      const [status] = await tx<{ in_betrieb: number; offen: number }[]>`
        select count(*) filter (where s.status = 'in_betrieb')::int as in_betrieb,
               count(*) filter (where s.status = 'in_betrieb_volumen_offen')::int as offen
          from public.v_gefaess_status s join public.gefaess g on g.id = s.gefaess_id
          join public.platz p on p.id = g.platz_id where p.anlage_id = ${ort('X')}::uuid`;
      expect(status).toEqual({ in_betrieb: 12, offen: 1 }); // S1

      const phasen = await tx<{ phase: string; n: number }[]>`
        select z.phase::text as phase, count(*)::int as n from public.v_pflanzung_zustand z
          where z.satz_id = any(${[ort('X-s2-a'), ort('X-s2-b'), ort('X-s8-satz')]}::uuid[]) group by 1 order by 1`;
      expect(phasen).toEqual([
        { phase: 'keimung', n: 6 }, // S8
        { phase: 'wachstum', n: 4 }, // S2
      ]);

      const [s8] =
        await tx`select saatdatum::text as saatdatum from public.satz where id = ${ort('X-s8-satz')}::uuid`;
      expect(s8?.['saatdatum']).toBe('2026-11-19'); // Saat vor 5 Tagen

      const reserviert = await tx<{ id: string }[]>`select id::text from public.v_reservierung_aktiv`;
      expect(reserviert.map((r) => r.id).sort()).toEqual(
        ['X-s6-rs1', 'X-s6-rs2', 'Z-reservierung-3.1', 'Z-reservierung-3.2'].map(ort).sort(),
      ); // S6 Spinat auf belegte Töpfe von Nüsslisalat, S9 Kratky-Direktsaat heute
    });
  });
});
