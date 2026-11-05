// UC5-AK6 [SQL] (Plan 23 Testliste; R8.1, R8.2, Konzept 8.2) gegen die lokale Datenbank (supabase start), wie
// tests/seed/inbetriebnahme.test.ts. Jeder Test läuft in einer äusseren Transaktion und endet mit rollback: Test-
// Wissensstand mit dem kern des Seeds (Sorten «Zwei» und «Vier» mit Packung aus sorten.csv), Szenario S1 (Anlage X)
// über demoSkript mit fester Uhr, dazu sechs Netztöpfe 80 mm für X-2.3. Dann liest der Test die Teile wie das
// Bündel, rechnet saatVorgang() und fügt die Zeilen über zeileVorbereiten() in der Reihenfolge des Vorgangs ein.
// erfasst_am setzt der Test auf die feste Uhr (die Datenbank stünde sonst auf der echten Zeit).
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { zeileVorbereiten, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { saatVorgang, type SaatEingabe } from '../../src/domain/pflanzung/saeen.ts';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { dateienLesen } from '../../scripts/seed/dateien.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { demoSkript, idFuer } from '../../scripts/demo/regeln.ts';
import { fixturesLesen } from '../../scripts/demo.ts';

type Db = postgres.Sql;
type Teile = Record<string, unknown[]>;

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));
const JETZT = new Date('2027-01-07T08:00:00Z');
const ZEITZONE = 'Europe/Zurich';
const UHR = { jetzt: JETZT, zeitzone: ZEITZONE };
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
    commit: 'saeen-test',
    gesamtfreigabe: false,
    trocken: false,
  });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
  const s1 = fixturesLesen().filter((f) => f.name === 's1-regal.json');
  expect(s1).toHaveLength(1);
  await tx.unsafe(demoSkript(s1, UHR).kern);
}

interface Lage {
  platz23: string;
  boxA1: string;
  toepfe: string[];
  zwei: string;
  vier: string;
}

/** S1 plus sechs Netztöpfe 80 mm auf X-2.3 (Loch 1 bis 6) */
async function lageAufbauen(tx: Db): Promise<Lage> {
  await s1Laden(tx);
  const platz = async (kennung: string) => {
    const [z] = await tx<{ id: string }[]>`
      select id from public.platz where anlage_id = ${ANLAGE_X}::uuid and kennung = ${kennung} and storniert_am is null`;
    if (!z) throw new Error(`Platz ${kennung} fehlt in S1`);
    return z.id;
  };
  const platz23 = await platz('2.3');
  const boxA1 = await platz('A1');
  const toepfe: string[] = [];
  for (let loch = 1; loch <= 6; loch += 1) {
    const [z] = await tx<{ id: string }[]>`
      insert into public.netztopf (client_id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
      values (gen_random_uuid(), ${ANLAGE_X}::uuid, ${`2.3.${loch}`}, 80, ${platz23}::uuid, ${loch}, 'saeen-test')
      returning id`;
    toepfe.push(z?.id ?? '');
  }
  const sorte = async (name: string) => {
    const [z] = await tx<{ sorte_id: string }[]>`
      select sorte_id from public.sorte where name = ${name} and gueltig_bis is null`;
    if (!z) throw new Error(`Sorte ${name} fehlt im Test-Wissensstand`);
    return z.sorte_id;
  };
  return { platz23, boxA1, toepfe, zwei: await sorte('Zwei'), vier: await sorte('Vier') };
}

/** Teile wie das Bündel sie lädt (Betrieb ohne Storno, Wissen in der gültigen Fassung, Sichten) */
async function teileLesen(tx: Db): Promise<Teile> {
  const teile: Teile = {};
  const quellen: Record<string, string> = {
    anlage: 'storniert_am is null',
    bereich: 'storniert_am is null',
    platz: 'storniert_am is null',
    etikett: 'storniert_am is null',
    gefaess: 'storniert_am is null',
    gefaessmodell: 'storniert_am is null',
    deckeltyp: 'storniert_am is null',
    anzuchtort: 'storniert_am is null',
    netztopf: 'storniert_am is null',
    satz: 'storniert_am is null',
    pflanzung: 'storniert_am is null',
    saatgut: 'storniert_am is null',
    sorte: 'gueltig_bis is null',
    art: 'gueltig_bis is null',
    art_kulturform: 'gueltig_bis is null',
    saatempfehlung: 'gueltig_bis is null',
    einstellung: 'true',
    v_sollwert: 'true',
    v_keimrate: 'true',
    v_gefaess_status: 'true',
    v_fuellzustand: 'true',
    v_pflanzung_zustand: 'true',
    v_reservierung_aktiv: 'true',
    v_netztopf_platz: 'true',
  };
  for (const [name, bedingung] of Object.entries(quellen)) {
    const [z] = await tx.unsafe<{ zeilen: unknown[] }[]>(
      `select coalesce(json_agg(t), '[]'::json) as zeilen from public.${name} t where ${bedingung}`,
    );
    teile[name] = z?.zeilen ?? [];
  }
  return teile;
}

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `5a000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;

/** Zeilen des Vorgangs einfügen wie schreiben(): zeileVorbereiten, Spalten aus den Feldern */
async function einfuegen(tx: Db, vorgang: Vorgang): Promise<void> {
  for (const s of vorgang) {
    expect(s.art).toBe('neu');
    const zeile = { ...zeileVorbereiten(s as Neu, UHR, 'saeen-test'), erfasst_am: JETZT.toISOString() };
    const spalten = Object.keys(zeile)
      .map((k) => `"${k}"`)
      .join(', ');
    await tx.unsafe(
      `insert into public.${s.tabelle} (${spalten})
       select ${spalten} from json_populate_record(null::public.${s.tabelle}, $1::json)`,
      [JSON.stringify(zeile)],
    );
  }
}

/** zwei Sätze in X-A1: «Zwei» (kopf) mit 3 Zieltöpfen in X-2.3, «Vier» (schnitt) mit «Ziel später», 2 Pflanzen */
function eingabe(lage: Lage, saatdatum = '2027-01-07'): SaatEingabe {
  return {
    anlageId: ANLAGE_X,
    einstieg: 'scan',
    begonnenAm: new Date(JETZT.getTime() - 95_000),
    saatdatum,
    zielPlatzId: lage.platz23,
    saetze: [
      {
        sorteId: lage.zwei,
        kulturform: 'kopf',
        boxPlatzId: lage.boxA1,
        zieltopfIds: lage.toepfe.slice(0, 3),
      },
      {
        sorteId: lage.vier,
        kulturform: 'schnitt',
        boxPlatzId: lage.boxA1,
        zieltopfIds: [],
        pflanzenOhneZiel: 2,
      },
    ],
  } as SaatEingabe;
}

async function gesaet(tx: Db, saatdatum?: string): Promise<{ lage: Lage; vorgang: Vorgang }> {
  const lage = await lageAufbauen(tx);
  const vorgang = saatVorgang(await teileLesen(tx), eingabe(lage, saatdatum), neueIds(), JETZT, ZEITZONE);
  expect(vorgang.length).toBeGreaterThan(0);
  await einfuegen(tx, vorgang);
  return { lage, vorgang };
}

const ids = (v: Vorgang, tabelle: string) =>
  v.filter((s): s is Neu => s.art === 'neu' && s.tabelle === tabelle).map((s) => s.felder.client_id);

describe('UC5-AK6 Pflanzung, Satz und Reservierung in der Datenbank', () => {
  it('UC5-AK6 jede Pflanzung speichert Satz und Pflanzvorgang, Rang und Einstufung leer, Gründe leer bis I2-4', async () => {
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx);
      const zeilen = await tx<
        {
          satz_id: string | null;
          pflanzvorgang_id: string | null;
          rang: number | null;
          einstufung: string | null;
          gruende: string[];
        }[]
      >`
        select pf.satz_id, pf.pflanzvorgang_id, pf.rang, pf.einstufung::text as einstufung, pf.gruende
          from public.pflanzung pf where pf.client_id = any(${ids(vorgang, 'pflanzung')}::uuid[])`;
      expect(zeilen.length).toBe(ids(vorgang, 'pflanzung').length);
      const [vorgangId] = ids(vorgang, 'pflanzvorgang');
      for (const z of zeilen) {
        expect(ids(vorgang, 'satz')).toContain(z.satz_id);
        expect(z.pflanzvorgang_id).toBe(vorgangId);
        expect(z.rang).toBeNull();
        expect(z.einstufung).toBeNull();
        expect(z.gruende).toEqual([]);
      }
    });
  });

  it('UC5-AK6 Zieltopf nur in der Reservierung, Anzuchtort am Satz', async () => {
    await inTransaktion(async (tx) => {
      const { lage, vorgang } = await gesaet(tx);
      const saetze = await tx<
        { sorte_id: string; anzuchtort_platz_id: string | null; direktsaat_platz_id: string | null }[]
      >`
        select sorte_id, anzuchtort_platz_id, direktsaat_platz_id
          from public.satz where client_id = any(${ids(vorgang, 'satz')}::uuid[])`;
      expect(saetze).toHaveLength(2);
      for (const s of saetze) {
        expect(s.anzuchtort_platz_id).toBe(lage.boxA1);
        expect(s.direktsaat_platz_id).toBeNull();
      }
      // pflanzung hat keine Spalte für den Zieltopf (Konzept 8.2)
      const [spalten] = await tx<{ n: number }[]>`
        select count(*)::int as n from information_schema.columns
         where table_schema = 'public' and table_name = 'pflanzung' and column_name in ('netztopf_id', 'zieltopf_id')`;
      expect(spalten?.n).toBe(0);
      const res = await tx<{ netztopf_id: string; sorte_id: string }[]>`
        select r.netztopf_id, s.sorte_id
          from public.reservierung r
          join public.pflanzung pf on pf.id = r.pflanzung_id
          join public.satz s on s.id = pf.satz_id
         where r.client_id = any(${ids(vorgang, 'reservierung')}::uuid[])
         order by r.netztopf_id`;
      expect(res.map((r) => r.netztopf_id).sort()).toEqual(lage.toepfe.slice(0, 3).sort());
      for (const r of res) expect(r.sorte_id).toBe(lage.zwei);
      // aktiv in der Sicht
      const [aktiv] = await tx<{ n: number }[]>`
        select count(*)::int as n from public.v_reservierung_aktiv
         where client_id = any(${ids(vorgang, 'reservierung')}::uuid[])`;
      expect(aktiv?.n).toBe(3);
    });
  });

  it('UC5-AK6 Pflanzung ohne Zieltopf (Ziel später) ist gültig und hat keine Reservierung', async () => {
    await inTransaktion(async (tx) => {
      const { lage, vorgang } = await gesaet(tx);
      const [z] = await tx<{ pflanzungen: number; reservierungen: number; status: string[] }[]>`
        select count(distinct pf.id)::int as pflanzungen, count(r.id)::int as reservierungen,
               array_agg(distinct vz.status) as status
          from public.satz s
          join public.pflanzung pf on pf.satz_id = s.id
          join public.v_pflanzung_zustand vz on vz.pflanzung_id = pf.id
          left join public.reservierung r on r.pflanzung_id = pf.id
         where s.client_id = any(${ids(vorgang, 'satz')}::uuid[]) and s.sorte_id = ${lage.vier}::uuid`;
      expect(z?.pflanzungen).toBeGreaterThanOrEqual(2);
      expect(z?.reservierungen).toBe(0);
      expect(z?.status).toEqual(['aktiv']);
    });
  });

  it('UC5-AK6 Pflanzvorgang speichert Dauer und Einstieg', async () => {
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx);
      const [pv] = await tx<{ dauer_s: number; einstieg: string; anzahl: number; gezaehlt: number }[]>`
        select pv.dauer_s, pv.einstieg::text as einstieg, pv.anzahl_pflanzungen as anzahl,
               (select count(*)::int from public.pflanzung pf where pf.pflanzvorgang_id = pv.id) as gezaehlt
          from public.pflanzvorgang pv where pv.client_id = ${ids(vorgang, 'pflanzvorgang')[0] ?? ''}::uuid`;
      expect(pv).toEqual({ dauer_s: 95, einstieg: 'scan', anzahl: pv?.gezaehlt, gezaehlt: pv?.gezaehlt });
      expect(pv?.anzahl).toBe(ids(vorgang, 'pflanzung').length);
    });
  });

  it('UC5-AK6 Einstufung nimmt nur empfohlen, moeglich, nicht_empfohlen an, Gründe sind eine Liste von Codes', async () => {
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx);
      const [erste = ''] = ids(vorgang, 'pflanzung');
      const t = tx as unknown as postgres.TransactionSql;
      for (const einstufung of ['empfohlen', 'moeglich', 'nicht_empfohlen'])
        await t.savepoint(async (sp) => {
          await sp`update public.pflanzung set einstufung = ${einstufung}::public.einstufung,
                     gruende = ${['zu_eng', 'leitkultur']}::text[] where client_id = ${erste}::uuid`;
        });
      await expect(
        t.savepoint(async (sp) => {
          await sp.unsafe(
            `update public.pflanzung set einstufung = 'gut' where client_id = '${erste}'::uuid`,
          );
        }),
      ).rejects.toThrow();
      const [z] = await tx<{ einstufung: string; gruende: string[] }[]>`
        select einstufung::text as einstufung, gruende from public.pflanzung where client_id = ${erste}::uuid`;
      expect(z).toEqual({ einstufung: 'nicht_empfohlen', gruende: ['zu_eng', 'leitkultur'] });
    });
  });
});

describe('R8.1 und R8.2 in der Datenbank', () => {
  it('R8.2 umsetzen_geplant_am gleich Vorgabe nach dem Einfügen (Trigger)', async () => {
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx);
      const zeilen = await tx<{ vorgabe: string; geplant: string }[]>`
        select umsetzen_vorgabe_am::text as vorgabe, umsetzen_geplant_am::text as geplant
          from public.reservierung where client_id = any(${ids(vorgang, 'reservierung')}::uuid[])`;
      expect(zeilen).toHaveLength(3);
      // Testart B: Umsetzen ab 10 Tagen → 17.1.
      for (const z of zeilen) expect(z).toEqual({ vorgabe: '2027-01-17', geplant: '2027-01-17' });
    });
  });

  it('R8.1 satz.saatdatum = Kalendertag von gilt_ab, nacherfasst bei Rückdatierung', async () => {
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx);
      const heute = await tx<{ saatdatum: string; tag: string; nacherfasst: boolean }[]>`
        select saatdatum::text as saatdatum, public.kalendertag(gilt_ab)::text as tag, nacherfasst
          from public.satz where client_id = any(${ids(vorgang, 'satz')}::uuid[])`;
      expect(heute).toEqual([
        { saatdatum: '2027-01-07', tag: '2027-01-07', nacherfasst: false },
        { saatdatum: '2027-01-07', tag: '2027-01-07', nacherfasst: false },
      ]);
    });
    await inTransaktion(async (tx) => {
      const { vorgang } = await gesaet(tx, '2027-01-05');
      const frueher = await tx<{ saatdatum: string; tag: string; nacherfasst: boolean; einstieg: string }[]>`
        select s.saatdatum::text as saatdatum, public.kalendertag(s.gilt_ab)::text as tag, s.nacherfasst,
               (select pv.einstieg::text from public.pflanzvorgang pv
                 where pv.client_id = ${ids(vorgang, 'pflanzvorgang')[0] ?? ''}::uuid) as einstieg
          from public.satz s where s.client_id = any(${ids(vorgang, 'satz')}::uuid[])`;
      expect(frueher).toHaveLength(2);
      for (const z of frueher)
        expect(z).toEqual({
          saatdatum: '2027-01-05',
          tag: '2027-01-05',
          nacherfasst: true,
          einstieg: 'nacherfassung',
        });
    });
  });
});
