// W250-AK2 [SQL] (Issue #250, W0 Runde 12; 03_import_w0.md Abschnitt 8): Nach dem scharfen Seed aus data/ stehen
// die in Runde 12 freigegebenen Werte in art_kulturform (gültige Zeilen), insbesondere ernte_ab_d für Basilikum und
// Petersilie Dauerkultur, sodass der Erntekalender für sie die erste Ernte rechnen kann; Klasse-D-Lücken bleiben null.
// Vitest gegen die lokale Datenbank (supabase start); der Seed läuft mit dem kern des Ladeskripts in einer
// Transaktion und endet mit rollback, unabhängig vom lokalen Stand.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit bda995e), die Tests sind deshalb sofort grün (Plan 250 A2).
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
const JETZT = new Date('2026-11-19T08:00:00Z');

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
  const seed = ladeskript(plan, { jetzt: JETZT, commit: 'test250', gesamtfreigabe: false, trocken: false });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
}

interface Kulturform {
  art_id: string;
  kulturform: string;
  ernteart: string;
  ernte_ab_d: number | null;
  ernteintervall_d: number | null;
  schnitte_max: number | null;
  kulturdauer_max_d: number | null;
  kulturdauer_typisch_d: number | null;
}

async function gueltigeKulturformen(tx: Db): Promise<Kulturform[]> {
  return tx<Kulturform[]>`
    select art_id, kulturform::text as kulturform, ernteart::text as ernteart, ernte_ab_d, ernteintervall_d,
           schnitte_max, kulturdauer_max_d, kulturdauer_typisch_d
      from public.art_kulturform
     where gueltig_bis is null
     order by art_id, kulturform`;
}

/** Runde 12 (lead_entscheide_runde-12.md): Art, Kulturform, Spalte, Wert */
const RUNDE12: [string, string, keyof Kulturform, number][] = [
  ['beta_vulgaris_cicla', 'schnitt', 'ernte_ab_d', 19],
  ['lactuca_sativa', 'babyleaf', 'ernte_ab_d', 9],
  ['lactuca_sativa', 'babyleaf', 'kulturdauer_max_d', 30],
  ['lactuca_sativa', 'kopf', 'kulturdauer_max_d', 45],
  ['lactuca_sativa', 'schnitt', 'ernte_ab_d', 23],
  ['ocimum_basilicum', 'dauerkultur_blatt', 'ernte_ab_d', 18],
  ['petroselinum_crispum', 'dauerkultur_blatt', 'ernte_ab_d', 28],
];

/** Klasse-D-Lücken ohne Quelle nach Runde 12 (Auswahl): Spalte bleibt null */
const OHNE_WERT: [string, string, keyof Kulturform][] = [
  ['allium_schoenoprasum', 'schnitt', 'ernte_ab_d'],
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'ernte_ab_d'],
  ['beta_vulgaris_conditiva', 'schnitt', 'ernte_ab_d'],
  ['spinacia_oleracea', 'schnitt', 'ernte_ab_d'],
  ['ocimum_basilicum', 'dauerkultur_blatt', 'kulturdauer_max_d'],
];

describe('W250-AK2 W0 Runde 12 nach dem Seed in art_kulturform', () => {
  it('W250-AK2 die 7 Werte der Runde 12 stehen in den gültigen Zeilen von art_kulturform', async () => {
    expect(RUNDE12).toHaveLength(7);
    await inTransaktion(async (tx) => {
      await seedAusData(tx);
      const formen = await gueltigeKulturformen(tx);
      for (const [artId, kulturform, spalte, wert] of RUNDE12) {
        const treffer = formen.filter((f) => f.art_id === artId && f.kulturform === kulturform);
        expect(treffer, `${artId}.${kulturform}`).toHaveLength(1);
        expect(treffer[0]?.[spalte], `${artId}.${kulturform}.${spalte}`).toBe(wert);
      }
    });
  });

  it('W250-AK2 Basilikum und Petersilie Dauerkultur: mehrfach mit ernte_ab_d, damit der Erntekalender einen Termin rechnet', async () => {
    await inTransaktion(async (tx) => {
      await seedAusData(tx);
      const formen = await gueltigeKulturformen(tx);
      for (const artId of ['ocimum_basilicum', 'petroselinum_crispum']) {
        const f = formen.find((x) => x.art_id === artId && x.kulturform === 'dauerkultur_blatt');
        expect(f?.ernteart, artId).toBe('mehrfach');
        expect(f?.ernte_ab_d, artId).toBeGreaterThan(0);
        // Intervall aus Runde 11 bleibt erhalten (21 bzw. 7)
        expect(f?.ernteintervall_d, artId).toBe(artId === 'ocimum_basilicum' ? 21 : 7);
      }
    });
  });

  it('W250-AK2 Klasse-D-Lücken ohne Quelle bleiben null, Kulturdauer typisch ≤ max', async () => {
    await inTransaktion(async (tx) => {
      await seedAusData(tx);
      const formen = await gueltigeKulturformen(tx);
      for (const [artId, kulturform, spalte] of OHNE_WERT) {
        const f = formen.find((x) => x.art_id === artId && x.kulturform === kulturform);
        expect(f, `${artId}.${kulturform}`).toBeDefined();
        expect(f?.[spalte], `${artId}.${kulturform}.${spalte}`).toBeNull();
      }
      for (const f of formen) {
        const name = `${f.art_id}.${f.kulturform}`;
        if (f.ernteintervall_d !== null || f.schnitte_max !== null) expect(f.ernteart, name).toBe('mehrfach');
        if (f.kulturdauer_typisch_d !== null && f.kulturdauer_max_d !== null)
          expect(f.kulturdauer_typisch_d, name).toBeLessThanOrEqual(f.kulturdauer_max_d);
      }
    });
  });
});
