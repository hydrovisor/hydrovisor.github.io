// W242-AK2 [SQL] (Issue #242, W0 Runde 11; 03_import_w0.md Abschnitt 8): Nach dem scharfen Seed aus data/ stehen
// die in Runde 11 freigegebenen Werte in art_kulturform (gültige Zeilen); ernteintervall_d und schnitte_max nur bei
// ernteart mehrfach; kulturdauer_typisch_d ≤ kulturdauer_max_d. Vitest gegen die lokale Datenbank (supabase start);
// der Seed läuft mit dem kern des Ladeskripts in einer Transaktion und endet mit rollback, unabhängig vom lokalen Stand.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit bebad6f), die Tests sind deshalb sofort grün (A).
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-11-18T08:00:00Z');

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

/** scharfer Seed aus data/ (wie npm run seed -- --ziel lokal) in der Transaktion des Tests */
async function seedAusData(tx: Db): Promise<void> {
  const { dateien, verstoesse } = dateienLesen(WURZEL);
  expect(verstoesse).toEqual([]);
  expect(pruefen(dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const seed = ladeskript(plan, { jetzt: JETZT, commit: 'test242', gesamtfreigabe: false, trocken: false });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
}

interface Kulturform {
  art_id: string;
  kulturform: string;
  ernteart: string;
  ernteintervall_d: number | null;
  schnitte_max: number | null;
  kulturdauer_max_d: number | null;
  kulturdauer_typisch_d: number | null;
}

async function gueltigeKulturformen(tx: Db): Promise<Kulturform[]> {
  return tx<Kulturform[]>`
    select art_id, kulturform::text as kulturform, ernteart::text as ernteart, ernteintervall_d, schnitte_max,
           kulturdauer_max_d, kulturdauer_typisch_d
      from public.art_kulturform
     where gueltig_bis is null
     order by art_id, kulturform`;
}

/** Runde 11 (lead_entscheide_runde-11.md): Art, Kulturform, Spalte, Wert */
const RUNDE11: [string, string, keyof Kulturform, number][] = [
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'kulturdauer_max_d', 730],
  ['brassica_rapa_chinensis', 'kopf', 'kulturdauer_max_d', 60],
  ['capsicum_annuum', 'dauerkultur_frucht', 'ernteintervall_d', 7],
  ['lactuca_sativa', 'schnitt', 'ernteintervall_d', 7],
  // #277 (Korrektur C, Tims Entscheid 28.11.2026): 42 Tage zählten ab Umsetzen; neue Fassung 56 Tage ab Saat
  // (42 + 14 Tage Plantag), die Fassung 42 schliesst der Seed (tests/seed/w0-korrektur-1128.test.ts)
  ['lactuca_sativa', 'schnitt', 'kulturdauer_max_d', 56],
  ['lactuca_sativa', 'schnitt', 'schnitte_max', 2],
  ['ocimum_basilicum', 'dauerkultur_blatt', 'ernteintervall_d', 21],
  ['ocimum_basilicum', 'schnitt', 'ernteintervall_d', 21],
  ['petroselinum_crispum', 'dauerkultur_blatt', 'ernteintervall_d', 7],
  ['solanum_lycopersicum', 'dauerkultur_frucht', 'kulturdauer_max_d', 364],
  ['spinacia_oleracea', 'schnitt', 'ernteintervall_d', 7],
  ['spinacia_oleracea', 'schnitt', 'schnitte_max', 3],
  ['valerianella_locusta', 'kopf', 'kulturdauer_max_d', 66],
];

describe('W242-AK2 W0 Runde 11 nach dem Seed in art_kulturform', () => {
  it('W242-AK2 die 13 Werte der Runde 11 stehen in den gültigen Zeilen von art_kulturform', async () => {
    expect(RUNDE11).toHaveLength(13);
    await inTransaktion(async (tx) => {
      await seedAusData(tx);
      const formen = await gueltigeKulturformen(tx);
      for (const [artId, kulturform, spalte, wert] of RUNDE11) {
        const treffer = formen.filter((f) => f.art_id === artId && f.kulturform === kulturform);
        expect(treffer, `${artId}.${kulturform}`).toHaveLength(1);
        expect(treffer[0]?.[spalte], `${artId}.${kulturform}.${spalte}`).toBe(wert);
      }
    });
  });

  it('W242-AK2 Intervall und Schnitte nur bei mehrfach, Kulturdauer typisch ≤ max', async () => {
    await inTransaktion(async (tx) => {
      await seedAusData(tx);
      const formen = await gueltigeKulturformen(tx);
      expect(formen.length).toBeGreaterThan(0);
      for (const f of formen) {
        const name = `${f.art_id}.${f.kulturform}`;
        if (f.ernteintervall_d !== null || f.schnitte_max !== null) expect(f.ernteart, name).toBe('mehrfach');
        if (f.kulturdauer_typisch_d !== null && f.kulturdauer_max_d !== null)
          expect(f.kulturdauer_typisch_d, name).toBeLessThanOrEqual(f.kulturdauer_max_d);
      }
      // alle Mehrfachformen der Runde 11 tragen ein Intervall
      for (const [artId, kulturform, spalte] of RUNDE11) {
        if (spalte !== 'ernteintervall_d') continue;
        const f = formen.find((x) => x.art_id === artId && x.kulturform === kulturform);
        expect(f?.ernteart, `${artId}.${kulturform}`).toBe('mehrfach');
      }
    });
  });
});
