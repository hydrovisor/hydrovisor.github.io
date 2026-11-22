// W14-AK2 [SQL] (Issue #266, W0 Runde 14; Plan docs/plaene/266.md, 03_import_w0.md Abschnitt 8): Nach dem scharfen
// Seed aus data/ stehen die Werte der Runde 14 in den gültigen Zeilen von art (Randen umsetzen_bis_d 25) und
// art_kulturform (Schnittlauch ernte_ab_d 28 und ernteintervall_d 14 in beiden Kulturformen, Spinat Schnitt
// ernte_ab_d 30, Mangold Schnitt schnitte_max 10); die verbleibenden Klasse-D-Lücken bleiben null.
// Der Erntekalender rechnet mit den geseedeten Werten: ersteErnteAb() = Saat + umsetzen_ab_d + ernte_ab_d nach dem
// Umsetzen (Schnittlauch Saat + 28 + 28), bei Direktsaat Saat + ernte_ab_d (Spinat Schnitt Saat + 30).
// Vitest gegen die lokale Datenbank (supabase start); der Seed läuft mit dem kern des Ladeskripts in einer
// Transaktion und endet mit rollback, unabhängig vom lokalen Stand.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commit 55d94c8), die Tests sind deshalb sofort grün.
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import type { Teile } from '../../src/domain/anlage/teile.ts';
import { ersteErnteAb } from '../../src/domain/pflanzung/belegung.ts';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import type { W0Dateien } from '../../src/domain/w0/typen.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { tagPlus, ZEITZONE } from '../../src/domain/zeit.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2026-11-22T08:00:00Z');

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

/** frisch gelesene W0-Dateien aus data/, ohne Verstoss */
function ausData(): W0Dateien {
  const { dateien, verstoesse } = dateienLesen(WURZEL);
  expect(verstoesse).toEqual([]);
  expect(pruefen(dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  return dateien;
}

/** scharfer Seed (wie npm run seed -- --ziel lokal) in der Transaktion des Tests */
async function seed(tx: Db, dateien: W0Dateien, jetzt: Date, commit: string): Promise<void> {
  const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
  const s = ladeskript(plan, { jetzt, commit, gesamtfreigabe: false, trocken: false });
  await tx.unsafe(s.vorbereitung);
  await tx.unsafe(s.kern);
}

interface ArtZeile {
  art_id: string;
  umsetzen_ab_d: number | null;
  umsetzen_bis_d: number | null;
  gueltig_bis: string | null;
}

interface Kulturform {
  art_id: string;
  kulturform: string;
  ernteart: string;
  ernte_ab_d: number | null;
  ernteintervall_d: number | null;
  schnitte_max: number | null;
  kulturdauer_max_d: number | null;
  gueltig_bis: string | null;
}

async function gueltigeArten(tx: Db): Promise<ArtZeile[]> {
  return tx<ArtZeile[]>`
    select art_id, umsetzen_ab_d, umsetzen_bis_d, gueltig_bis::text as gueltig_bis
      from public.art where gueltig_bis is null order by art_id`;
}

async function gueltigeKulturformen(tx: Db): Promise<Kulturform[]> {
  return tx<Kulturform[]>`
    select art_id, kulturform::text as kulturform, ernteart::text as ernteart, ernte_ab_d, ernteintervall_d,
           schnitte_max, kulturdauer_max_d, gueltig_bis::text as gueltig_bis
      from public.art_kulturform
     where gueltig_bis is null
     order by art_id, kulturform`;
}

/** Runde 14 in art_kulturform: Art, Kulturform, Spalte, Wert */
const RUNDE14: [string, string, keyof Kulturform, number][] = [
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'ernte_ab_d', 28],
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'ernteintervall_d', 14],
  ['allium_schoenoprasum', 'schnitt', 'ernte_ab_d', 28],
  ['allium_schoenoprasum', 'schnitt', 'ernteintervall_d', 14],
  ['beta_vulgaris_cicla', 'schnitt', 'schnitte_max', 10],
  ['spinacia_oleracea', 'schnitt', 'ernte_ab_d', 30],
];

/** Klasse-D-Lücken nach Runde 14 (Auswahl): Spalte bleibt null */
const OHNE_WERT: [string, string, keyof Kulturform][] = [
  ['allium_schoenoprasum', 'dauerkultur_blatt', 'schnitte_max'],
  ['allium_schoenoprasum', 'schnitt', 'kulturdauer_max_d'],
  ['spinacia_oleracea', 'schnitt', 'kulturdauer_max_d'],
  ['beta_vulgaris_cicla', 'schnitt', 'kulturdauer_max_d'],
  ['beta_vulgaris_conditiva', 'schnitt', 'ernte_ab_d'],
];

const SAAT = '2027-01-11';

/** minimale Teile für ersteErnteAb(): geseedete art und art_kulturform, je Art eine Sorte, ein Satz, eine Pflanzung */
function teileFuer(
  arten: ArtZeile[],
  formen: Kulturform[],
  artId: string,
  kulturform: string,
  direktsaatPlatzId: string | null,
): Teile {
  return {
    art: arten,
    art_kulturform: formen,
    sorte: [{ sorte_id: `sorte_${artId}`, art_id: artId, gueltig_bis: null }],
    satz: [
      {
        id: 'satz-1',
        sorte_id: `sorte_${artId}`,
        kulturform,
        saatdatum: SAAT,
        direktsaat_platz_id: direktsaatPlatzId,
        storniert_am: null,
      },
    ],
    pflanzung: [{ id: 'pflanzung-1', satz_id: 'satz-1' }],
  };
}

describe('W14-AK2 W0 Runde 14 nach dem Seed in art und art_kulturform', () => {
  it('W14-AK2 Randen: umsetzen_bis_d 25 (umsetzen_ab_d 9) steht in der gültigen Zeile von art', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test266');
      const randen = (await gueltigeArten(tx)).filter((a) => a.art_id === 'beta_vulgaris_conditiva');
      expect(randen).toHaveLength(1);
      expect(randen[0]?.umsetzen_ab_d).toBe(9);
      expect(randen[0]?.umsetzen_bis_d).toBe(25);
    });
  });

  it('W14-AK2 Erntewerte der Runde 14 stehen in den gültigen Zeilen von art_kulturform', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test266');
      const formen = await gueltigeKulturformen(tx);
      for (const [artId, kulturform, spalte, wert] of RUNDE14) {
        const treffer = formen.filter((f) => f.art_id === artId && f.kulturform === kulturform);
        expect(treffer, `${artId}.${kulturform}`).toHaveLength(1);
        expect(treffer[0]?.ernteart, `${artId}.${kulturform}`).toBe('mehrfach');
        expect(treffer[0]?.[spalte], `${artId}.${kulturform}.${spalte}`).toBe(wert);
      }
    });
  });

  it('W14-AK2 verbleibende Klasse-D-Lücken bleiben null', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test266');
      const formen = await gueltigeKulturformen(tx);
      for (const [artId, kulturform, spalte] of OHNE_WERT) {
        const treffer = formen.filter((f) => f.art_id === artId && f.kulturform === kulturform);
        expect(treffer, `${artId}.${kulturform}`).toHaveLength(1);
        expect(treffer[0]?.[spalte] ?? null, `${artId}.${kulturform}.${spalte}`).toBeNull();
      }
    });
  });

  it('W14-AK2 Erntekalender: Schnittlauch nach dem Umsetzen Saat + 28 + 28, beide Kulturformen', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test266');
      const arten = await gueltigeArten(tx);
      const formen = await gueltigeKulturformen(tx);
      for (const kulturform of ['dauerkultur_blatt', 'schnitt']) {
        const teile = teileFuer(arten, formen, 'allium_schoenoprasum', kulturform, null);
        expect(ersteErnteAb(teile, 'pflanzung-1', undefined, JETZT, ZEITZONE), kulturform).toBe(
          tagPlus(SAAT, 28 + 28),
        );
      }
    });
  });

  it('W14-AK2 Erntekalender: Spinat Schnitt bei Direktsaat Saat + 30', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test266');
      const arten = await gueltigeArten(tx);
      const formen = await gueltigeKulturformen(tx);
      const teile = teileFuer(arten, formen, 'spinacia_oleracea', 'schnitt', 'platz-1');
      expect(ersteErnteAb(teile, 'pflanzung-1', undefined, JETZT, ZEITZONE)).toBe(tagPlus(SAAT, 30));
    });
  });
});
