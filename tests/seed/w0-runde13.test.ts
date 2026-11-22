// W13-AK2 [SQL] (Issue #258, W0 Runde 13; Plan docs/plaene/258.md, 03_import_w0.md Abschnitt 8): Nach dem scharfen
// Seed aus data/ stehen die Umsetztage der Runde 13 in art und die Erntewerte in art_kulturform (gültige Fassungen);
// Basilikum umsetzen_bis_d bleibt leer (Randen seit Runde 14, #266: 25). K-mangold-02 (Konzept 9.3 Regel 1, 9.4): Mangold Schnitt
// ernte_ab_d ist 28; nach einem Vorlauf mit dem Stand vor Runde 13 (Fassung 19) schliesst der Seed die alte Fassung.
// Der Erntekalender rechnet mit den geseedeten Werten: ersteErnteAb() = Saat + umsetzen_ab_d + ernte_ab_d.
// Vitest gegen die lokale Datenbank (supabase start); der Seed läuft mit dem kern des Ladeskripts in einer
// Transaktion und endet mit rollback, unabhängig vom lokalen Stand.
// Datenpaket: Die Daten sind vor den Tests freigegeben (Commits b0b8f4c, 59b1e02), die Tests sind deshalb sofort grün.
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
const JETZT_VORLAUF = new Date('2026-11-19T08:00:00Z');
const JETZT = new Date('2026-11-21T08:00:00Z');
const MANGOLD_ERNTE_AB = 'ak.beta_vulgaris_cicla.schnitt.ernte_ab_d';

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

/** Stand vor Runde 13 für Mangold Schnitt ernte_ab_d nachgestellt: Fassung 19 vom 2026-11-19 (Runde 12) */
function mitMangoldRunde12(dateien: W0Dateien): W0Dateien {
  const art = dateien['data/wissensbasis/freigegeben/art.csv'];
  const z = art?.zeilen.find((x) => x['zeile_id'] === MANGOLD_ERNTE_AB);
  expect(z, MANGOLD_ERNTE_AB).toBeDefined();
  if (z) {
    z['wert'] = '19';
    z['freigegeben_am'] = '2026-11-19';
  }
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
  kulturdauer_max_d: number | null;
  gueltig_bis: string | null;
}

async function gueltigeArten(tx: Db): Promise<ArtZeile[]> {
  return tx<ArtZeile[]>`
    select art_id, umsetzen_ab_d, umsetzen_bis_d, gueltig_bis::text as gueltig_bis
      from public.art where gueltig_bis is null order by art_id`;
}

async function kulturformen(tx: Db, nurGueltige: boolean): Promise<Kulturform[]> {
  const alle = await tx<Kulturform[]>`
    select art_id, kulturform::text as kulturform, ernteart::text as ernteart, ernte_ab_d, ernteintervall_d,
           kulturdauer_max_d, gueltig_bis::text as gueltig_bis
      from public.art_kulturform
     order by art_id, kulturform, gueltig_ab`;
  return nurGueltige ? alle.filter((f) => f.gueltig_bis === null) : alle;
}

/** Runde 13 in art: Art, umsetzen_ab_d, umsetzen_bis_d (null = Klasse-D-Lücke) */
const UMSETZEN: [string, number, number | null][] = [
  ['ocimum_basilicum', 14, null],
  ['petroselinum_crispum', 21, 35],
  ['allium_schoenoprasum', 28, 42],
  ['beta_vulgaris_cicla', 21, 28],
  ['beta_vulgaris_conditiva', 9, 25],
];

/** Runde 13 in art_kulturform: Art, Kulturform, Spalte, Wert */
const ERNTE: [string, string, keyof Kulturform, number][] = [
  ['beta_vulgaris_cicla', 'schnitt', 'ernteintervall_d', 14],
  ['beta_vulgaris_cicla', 'schnitt', 'ernte_ab_d', 28],
  ['solanum_lycopersicum', 'dauerkultur_frucht', 'ernteintervall_d', 7],
  ['spinacia_oleracea', 'babyleaf', 'kulturdauer_max_d', 46],
];

/** Erntekalender: Art, Kulturform, Tage ab Saat bis zur ersten Ernte (umsetzen_ab_d + ernte_ab_d) */
const ERSTE_ERNTE: [string, string, number][] = [
  ['ocimum_basilicum', 'dauerkultur_blatt', 14 + 18],
  ['petroselinum_crispum', 'dauerkultur_blatt', 21 + 28],
  ['beta_vulgaris_cicla', 'schnitt', 21 + 28],
];

const SAAT = '2027-01-11';

/** minimale Teile für ersteErnteAb(): geseedete art und art_kulturform, je Art eine Sorte, ein Satz, eine Pflanzung */
function teileFuer(arten: ArtZeile[], formen: Kulturform[], artId: string, kulturform: string): Teile {
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
        direktsaat_platz_id: null,
        storniert_am: null,
      },
    ],
    pflanzung: [{ id: 'pflanzung-1', satz_id: 'satz-1' }],
  };
}

describe('W13-AK2 W0 Runde 13 nach dem Seed in art und art_kulturform', () => {
  it('W13-AK2 Umsetztage der Runde 13 stehen in den gültigen Zeilen von art, Basilikum ohne umsetzen_bis_d', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test258');
      const arten = await gueltigeArten(tx);
      for (const [artId, ab, bis] of UMSETZEN) {
        const a = arten.filter((x) => x.art_id === artId);
        expect(a, artId).toHaveLength(1);
        expect(a[0]?.umsetzen_ab_d, `${artId}.umsetzen_ab_d`).toBe(ab);
        expect(a[0]?.umsetzen_bis_d ?? null, `${artId}.umsetzen_bis_d`).toBe(bis);
      }
    });
  });

  it('W13-AK2 Erntewerte der Runde 13 stehen in den gültigen Zeilen von art_kulturform (Mangold ernte_ab_d 28)', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test258');
      const formen = await kulturformen(tx, true);
      for (const [artId, kulturform, spalte, wert] of ERNTE) {
        const treffer = formen.filter((f) => f.art_id === artId && f.kulturform === kulturform);
        expect(treffer, `${artId}.${kulturform}`).toHaveLength(1);
        expect(treffer[0]?.[spalte], `${artId}.${kulturform}.${spalte}`).toBe(wert);
      }
    });
  });

  it('W13-AK2 K-mangold-02: nach einem Vorlauf mit der Fassung 19 schliesst der Seed sie, gültig ist 28', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, mitMangoldRunde12(ausData()), JETZT_VORLAUF, 'test258-vorlauf');
      const vorher = (await kulturformen(tx, true)).find(
        (f) => f.art_id === 'beta_vulgaris_cicla' && f.kulturform === 'schnitt',
      );
      expect(vorher?.ernte_ab_d).toBe(19);

      await seed(tx, ausData(), JETZT, 'test258');
      const mangold = (await kulturformen(tx, false)).filter(
        (f) => f.art_id === 'beta_vulgaris_cicla' && f.kulturform === 'schnitt',
      );
      const gueltig = mangold.filter((f) => f.gueltig_bis === null);
      expect(gueltig).toHaveLength(1);
      expect(gueltig[0]?.ernte_ab_d).toBe(28);
      const geschlossen = mangold.filter((f) => f.ernte_ab_d === 19);
      expect(geschlossen).toHaveLength(1);
      expect(geschlossen[0]?.gueltig_bis).not.toBeNull();
    });
  });

  it('W13-AK2 Erntekalender: ersteErnteAb() mit den geseedeten Werten ist Saat + umsetzen_ab_d + ernte_ab_d', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test258');
      const arten = await gueltigeArten(tx);
      const formen = await kulturformen(tx, true);
      for (const [artId, kulturform, tage] of ERSTE_ERNTE) {
        const teile = teileFuer(arten, formen, artId, kulturform);
        expect(ersteErnteAb(teile, 'pflanzung-1', undefined, JETZT, ZEITZONE), `${artId}.${kulturform}`).toBe(
          tagPlus(SAAT, tage),
        );
      }
    });
  });
});
