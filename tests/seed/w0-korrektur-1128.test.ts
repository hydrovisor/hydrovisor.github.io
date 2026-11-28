// W277-AK2 [SQL] (Issue #277, W0-Korrekturen C und F; Plan docs/plaene/277.md, Konzept v1.11 9.3 und 9.4, Entscheid
// 0029, 03_import_w0.md Abschnitt 8): Nach dem scharfen Seed aus data/ tragen die gültigen Zeilen von art_kulturform
// Schnittsalat kulturdauer_max_d 56 und Nüsslisalat Kopf ernte_ab_d 51; nach einem Vorlauf mit dem alten Stand (42
// bzw. 29) schliesst der Seed die alte Fassung (gueltig_bis gesetzt, genau eine gültige Zeile je Kulturform).
// Erntekalender und Kulturende rechnen mit den geseedeten Werten (voraussichtlichesEnde(), R1.2, R11.1):
// Nüsslisalat Kopf (einmalig) bei Direktsaat 7.1.2027 + 51 = 27.2.2027; Schnittsalat (mehrfach) Saat 7.1.2027 +
// kulturdauer_max_d 56 = 4.3.2027. Basilikum Schnitt ernte_ab_d bleibt 50.
// Vitest gegen die lokale Datenbank (supabase start); der Seed läuft mit dem kern des Ladeskripts in einer
// Transaktion und endet mit rollback, unabhängig vom lokalen Stand.
// Rot bis zum Datenschritt des Lead (scripts/w0/lead_entscheide_korrektur_1128.py): data/ trägt noch 42 und 29.
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import type { Teile } from '../../src/domain/anlage/teile.ts';
import { voraussichtlichesEnde } from '../../src/domain/pflanzung/belegung.ts';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import type { W0Dateien } from '../../src/domain/w0/typen.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { tagPlus } from '../../src/domain/zeit.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';

type Db = postgres.Sql;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT_VORLAUF = new Date('2026-11-22T08:00:00Z');
const JETZT = new Date('2026-11-28T08:00:00Z');

/** zeile_id, Wert und freigegeben_am der alten Fassung (Stand main 049561c) */
const ALT: [string, string, string][] = [
  ['ak.lactuca_sativa.schnitt.kulturdauer_max_d', '42', '2026-11-18'],
  ['ak.valerianella_locusta.kopf.ernte_ab_d', '29', '2026-11-12'],
];

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

/** Stand vor #277 nachgestellt: Schnittsalat kulturdauer_max_d 42, Nüsslisalat Kopf ernte_ab_d 29 */
function mitAltemStand(dateien: W0Dateien): W0Dateien {
  const art = dateien['data/wissensbasis/freigegeben/art.csv'];
  for (const [id, wert, datum] of ALT) {
    const z = art?.zeilen.find((x) => x['zeile_id'] === id);
    expect(z, id).toBeDefined();
    if (z) {
      z['wert'] = wert;
      z['freigegeben_am'] = datum;
    }
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
  schnitte_max: number | null;
  kulturdauer_max_d: number | null;
  kulturdauer_typisch_d: number | null;
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
           schnitte_max, kulturdauer_max_d, kulturdauer_typisch_d, gueltig_bis::text as gueltig_bis
      from public.art_kulturform
     order by art_id, kulturform, gueltig_ab`;
  return nurGueltige ? alle.filter((f) => f.gueltig_bis === null) : alle;
}

const SAAT = '2027-01-07';

/** minimale Teile für voraussichtlichesEnde(): geseedete art und art_kulturform, eine Sorte, ein Satz, eine Pflanzung */
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

describe('W277-AK2 W0-Korrekturen C und F nach dem Seed in art_kulturform', () => {
  it('W277-AK2 die gültigen Zeilen tragen Schnittsalat kulturdauer_max_d 56 und Nüsslisalat Kopf ernte_ab_d 51', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test277');
      const formen = await kulturformen(tx, true);
      const salat = formen.filter((f) => f.art_id === 'lactuca_sativa' && f.kulturform === 'schnitt');
      expect(salat).toHaveLength(1);
      expect(salat[0]?.ernteart).toBe('mehrfach');
      expect(salat[0]?.kulturdauer_max_d).toBe(56);
      const nuessli = formen.filter((f) => f.art_id === 'valerianella_locusta' && f.kulturform === 'kopf');
      expect(nuessli).toHaveLength(1);
      expect(nuessli[0]?.ernteart).toBe('einmalig');
      expect(nuessli[0]?.ernte_ab_d).toBe(51);
      // übrige Werte derselben Kulturformen unverändert
      expect(salat[0]?.ernteintervall_d).toBe(7);
      expect(salat[0]?.schnitte_max).toBe(2);
      expect(nuessli[0]?.kulturdauer_max_d).toBe(66);
      expect(nuessli[0]?.kulturdauer_typisch_d).toBe(51);
    });
  });

  it('W277-AK2 nach einem Vorlauf mit dem alten Stand (42 bzw. 29) schliesst der Seed die alte Fassung, je Kulturform genau eine gültige Zeile', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, mitAltemStand(ausData()), JETZT_VORLAUF, 'test277-vorlauf');
      const vorher = await kulturformen(tx, true);
      expect(
        vorher.find((f) => f.art_id === 'lactuca_sativa' && f.kulturform === 'schnitt')?.kulturdauer_max_d,
      ).toBe(42);
      expect(
        vorher.find((f) => f.art_id === 'valerianella_locusta' && f.kulturform === 'kopf')?.ernte_ab_d,
      ).toBe(29);

      await seed(tx, ausData(), JETZT, 'test277');
      const alle = await kulturformen(tx, false);

      const salat = alle.filter((f) => f.art_id === 'lactuca_sativa' && f.kulturform === 'schnitt');
      const salatGueltig = salat.filter((f) => f.gueltig_bis === null);
      expect(salatGueltig).toHaveLength(1);
      expect(salatGueltig[0]?.kulturdauer_max_d).toBe(56);
      const salatAlt = salat.filter((f) => f.kulturdauer_max_d === 42);
      expect(salatAlt).toHaveLength(1);
      expect(salatAlt[0]?.gueltig_bis).not.toBeNull();

      const nuessli = alle.filter((f) => f.art_id === 'valerianella_locusta' && f.kulturform === 'kopf');
      const nuessliGueltig = nuessli.filter((f) => f.gueltig_bis === null);
      expect(nuessliGueltig).toHaveLength(1);
      expect(nuessliGueltig[0]?.ernte_ab_d).toBe(51);
      const nuessliAlt = nuessli.filter((f) => f.ernte_ab_d === 29);
      expect(nuessliAlt).toHaveLength(1);
      expect(nuessliAlt[0]?.gueltig_bis).not.toBeNull();
    });
  });

  it('W277-AK2 Erntekalender: Nüsslisalat Kopf Direktsaat 7.1.2027 + ernte_ab_d 51 = 27.2.2027', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test277');
      const teile = teileFuer(
        await gueltigeArten(tx),
        await kulturformen(tx, true),
        'valerianella_locusta',
        'kopf',
        'platz-1',
      );
      expect(tagPlus(SAAT, 51)).toBe('2027-02-27');
      expect(voraussichtlichesEnde(teile, 'pflanzung-1')).toEqual({
        ernteart: 'einmalig',
        endeAm: '2027-02-27',
      });
    });
  });

  it('W277-AK2 Kulturende: Schnittsalat Saat 7.1.2027 + kulturdauer_max_d 56 = 4.3.2027', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test277');
      const teile = teileFuer(
        await gueltigeArten(tx),
        await kulturformen(tx, true),
        'lactuca_sativa',
        'schnitt',
        null,
      );
      expect(tagPlus(SAAT, 56)).toBe('2027-03-04');
      expect(voraussichtlichesEnde(teile, 'pflanzung-1')).toEqual({
        ernteart: 'mehrfach',
        endeAm: '2027-03-04',
      });
    });
  });

  it('W277-AK2 Basilikum Schnitt ernte_ab_d bleibt 50 (Nachkontrolle bestätigt, keine neue Fassung)', async () => {
    await inTransaktion(async (tx) => {
      await seed(tx, ausData(), JETZT, 'test277');
      const basilikum = (await kulturformen(tx, false)).filter(
        (f) => f.art_id === 'ocimum_basilicum' && f.kulturform === 'schnitt',
      );
      expect(basilikum).toHaveLength(1);
      expect(basilikum[0]?.gueltig_bis).toBeNull();
      expect(basilikum[0]?.ernte_ab_d).toBe(50);
    });
  });
});
