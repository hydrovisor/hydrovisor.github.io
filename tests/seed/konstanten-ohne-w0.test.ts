// W178-AK1 [SQL] (Issue #178, Entscheid 0017): Der scharfe Seed mit dem Stand des Repositorys ohne die
// W0-Dateien unter data/wissensbasis/freigegeben/ (seit #188 im Test ausgeblendet) lädt genau die Seed-Konstanten: ein Messgerät, eine Zeile
// einstellung mit den festen Kalibrierterminen, keine Art und keine Sorte; ein zweiter Lauf ändert nichts. Gegen die
// lokale Datenbank (supabase start) wie tests/seed/inbetriebnahme.test.ts; jeder Test endet mit rollback.
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-11-12T08:00:00Z');

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

/** Seed wie deploy.yml mit seed_scharf: Dateien aus dem Repository, kein --trocken, keine Gesamtfreigabe */
async function seedScharf(tx: Db, commit: string): Promise<void> {
  const { dateien: alle, verstoesse } = dateienLesen(WURZEL);
  expect(verstoesse).toEqual([]);
  // Seit #188 liegt W0 unter freigegeben/; der Fall «ohne W0» blendet diese Dateien aus (Sorten bleiben, laden aber ohne Art nicht)
  const dateien = Object.fromEntries(
    Object.entries(alle).filter(([pfad]) => !pfad.startsWith('data/wissensbasis/freigegeben/')),
  ) as typeof alle;
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const seed = ladeskript(plan, { jetzt: JETZT, commit, gesamtfreigabe: false, trocken: false });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
}

async function zaehlen(tx: Db): Promise<Record<string, number>> {
  const [z] = await tx<Record<string, number>[]>`
    select (select count(*)::int from public.messgeraet) as messgeraet,
           (select count(*)::int from public.einstellung) as einstellung,
           (select count(*)::int from public.art) as art,
           (select count(*)::int from public.sorte) as sorte,
           (select count(*)::int from public.saatgut) as saatgut,
           (select count(*)::int from public.herkunft) as herkunft,
           (select count(*)::int from public.produkt) as produkt,
           (select count(*)::int from public.k_faktor) as k_faktor,
           (select count(*)::int from public.pflichtgroesse) as pflichtgroesse,
           (select count(*)::int from public.kulturform_profilende) as kulturform_profilende,
           (select count(*)::int from public.auswertung_fenster) as auswertung_fenster,
           (select count(*)::int from public.ereignis) as ereignis`;
  return z ?? {};
}

describe('W178-AK1 scharfer Seed ohne W0', () => {
  it('W178-AK1 lädt ein Messgerät und eine Einstellung mit den festen Kalibrierterminen, keine Art und keine Sorte; ein zweiter Lauf ändert nichts', async () => {
    await inTransaktion(async (tx) => {
      // nach supabase db reset wie die Produktion heute: ohne Messgerät und Einstellung
      const vorher = await zaehlen(tx);
      expect(vorher['einstellung']).toBe(0);
      expect(vorher['messgeraet']).toBe(0);

      await seedScharf(tx, 'w178-1');
      const nachher = await zaehlen(tx);
      expect(nachher['einstellung']).toBe(1);
      expect(nachher['messgeraet']).toBe(1);
      // ohne art.csv kein Sortenstamm (Entscheid 0007), also nichts Neues an Wissen
      expect(nachher['art']).toBe(vorher['art']);
      expect(nachher['sorte']).toBe(vorher['sorte']);
      expect(nachher['saatgut']).toBe(vorher['saatgut']);
      expect(nachher['herkunft']).toBe(vorher['herkunft']);
      // ohne W0 keine Ereignisse «sollwert_geaendert»
      expect(nachher['ereignis']).toBe(vorher['ereignis']);

      const [e] = await tx<{ termine: string[]; grenze: string }[]>`
        select feste_kalibriertermine::text[] as termine, stationsgrenze_ab::text as grenze from public.einstellung`;
      expect(e?.termine).toEqual(seedKonstanten.einstellung.festeKalibriertermine);
      expect(e?.grenze).toBe(seedKonstanten.einstellung.stationsgrenzeAb);
      const geraete = await tx<{ modell: string }[]>`select modell from public.messgeraet`;
      expect(geraete.map((g) => g.modell)).toContain(seedKonstanten.messgeraet.modell);

      // idempotent: der zweite Lauf legt in keiner der gezählten Tabellen etwas an, auch nicht bei den Konstanten
      await seedScharf(tx, 'w178-2');
      expect(await zaehlen(tx)).toEqual(nachher);
    });
  });
});
