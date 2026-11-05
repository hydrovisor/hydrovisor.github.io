// Keimung prüfen in der Datenbank (Plan 24 Testliste, SQL zusätzlich zu den AK; R1.7, R6.1, R8.2, R12.2, G5) gegen die
// lokale Datenbank (supabase start), wie tests/seed/saeen.test.ts. Jeder Test läuft in einer äusseren Transaktion
// und endet mit rollback: Test-Wissensstand mit dem kern des Seeds, Szenario S1 (Anlage X, Datenart demo) über
// demoSkript mit fester Uhr, dazu sechs Netztöpfe 80 mm für X-2.3. Gesät wird «Zwei» (kopf) in X-A1 mit drei
// Zieltöpfen über saatVorgang() am 7.1.; die Keimprüfung am 11.1. über keimVorgang(), das Wiederherstellen am 12.1.
// über wiederherstellenVorgang(). Zeilen gehen über zeileVorbereiten() in der Reihenfolge des Vorgangs in die
// Datenbank (JSON-Parameter als $1::text::json, sonst kodiert postgres.js doppelt; Lehre aus PR #88). erfasst_am setzt
// der Test auf die feste Uhr. Für die Keimrate stellt ein Test die Anlage X auf Datenart echt (nur in der Transaktion).
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { zeileVorbereiten, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  keimAnsicht,
  keimVorgang,
  wiederherstellenVorgang,
  type KeimEingabe,
} from '../../src/domain/pflanzung/keimung.ts';
import { saatVorgang, type SaatEingabe } from '../../src/domain/pflanzung/saeen.ts';
import { keimbilanz, keimrateGeglaettet } from '../../src/domain/saatmenge/saatmenge.ts';
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
const SAAT = new Date('2027-01-07T08:00:00Z');
const KEIM = new Date('2027-01-11T08:00:00Z');
const WIEDER = new Date('2027-01-12T08:00:00Z');
const ZEITZONE = 'Europe/Zurich';
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
    jetzt: SAAT,
    commit: 'keimung-test',
    gesamtfreigabe: false,
    trocken: false,
  });
  await tx.unsafe(seed.vorbereitung);
  await tx.unsafe(seed.kern);
  const s1 = fixturesLesen().filter((f) => f.name === 's1-regal.json');
  expect(s1).toHaveLength(1);
  await tx.unsafe(demoSkript(s1, { jetzt: SAAT, zeitzone: ZEITZONE }).kern);
}

interface Lage {
  platz23: string;
  platz44: string;
  boxA1: string;
  toepfe: string[];
  zwei: string;
}

async function lageAufbauen(tx: Db): Promise<Lage> {
  await s1Laden(tx);
  const platz = async (kennung: string) => {
    const [z] = await tx<{ id: string }[]>`
      select id from public.platz where anlage_id = ${ANLAGE_X}::uuid and kennung = ${kennung} and storniert_am is null`;
    if (!z) throw new Error(`Platz ${kennung} fehlt in S1`);
    return z.id;
  };
  const platz23 = await platz('2.3');
  const toepfe: string[] = [];
  for (let loch = 1; loch <= 6; loch += 1) {
    const [z] = await tx<{ id: string }[]>`
      insert into public.netztopf (client_id, anlage_id, kennung, groesse_mm, heim_platz_id, heim_loch_nr, app_version)
      values (gen_random_uuid(), ${ANLAGE_X}::uuid, ${`2.3.${loch}`}, 80, ${platz23}::uuid, ${loch}, 'keimung-test')
      returning id`;
    toepfe.push(z?.id ?? '');
  }
  const [zwei] = await tx<{ sorte_id: string }[]>`
    select sorte_id from public.sorte where name = 'Zwei' and gueltig_bis is null`;
  if (!zwei) throw new Error('Sorte Zwei fehlt im Test-Wissensstand');
  return { platz23, platz44: await platz('4.4'), boxA1: await platz('A1'), toepfe, zwei: zwei.sorte_id };
}

/** Teile wie das Bündel sie lädt; ereignis_pflanzung und reservierung nach Plan 24 */
async function teileLesen(tx: Db): Promise<Teile> {
  const teile: Teile = {};
  const quellen: Record<string, [string, string]> = {
    anlage: ['anlage', 'storniert_am is null'],
    bereich: ['bereich', 'storniert_am is null'],
    platz: ['platz', 'storniert_am is null'],
    etikett: ['etikett', 'storniert_am is null'],
    gefaess: ['gefaess', 'storniert_am is null'],
    gefaessmodell: ['gefaessmodell', 'storniert_am is null'],
    deckeltyp: ['deckeltyp', 'storniert_am is null'],
    anzuchtort: ['anzuchtort', 'storniert_am is null'],
    netztopf: ['netztopf', 'storniert_am is null'],
    satz: ['satz', 'storniert_am is null'],
    pflanzung: ['pflanzung', 'storniert_am is null'],
    reservierung: ['reservierung', 'storniert_am is null'],
    saatgut: ['saatgut', 'storniert_am is null'],
    sorte: ['sorte', 'gueltig_bis is null'],
    art: ['art', 'gueltig_bis is null'],
    art_kulturform: ['art_kulturform', 'gueltig_bis is null'],
    saatempfehlung: ['saatempfehlung', 'gueltig_bis is null'],
    einstellung: ['einstellung', 'true'],
    ereignis_pflanzung: [
      'ereignis',
      "storniert_am is null and pflanzung_id is not null and typ in ('keimung', 'abschluss', 'wiederherstellen')",
    ],
    v_sollwert: ['v_sollwert', 'true'],
    v_keimrate: ['v_keimrate', 'true'],
    v_gefaess_status: ['v_gefaess_status', 'true'],
    v_fuellzustand: ['v_fuellzustand', 'true'],
    v_pflanzung_zustand: ['v_pflanzung_zustand', 'true'],
    v_reservierung_aktiv: ['v_reservierung_aktiv', 'true'],
    v_netztopf_platz: ['v_netztopf_platz', 'true'],
  };
  for (const [name, [tabelle, bedingung]] of Object.entries(quellen)) {
    const [z] = await tx.unsafe<{ zeilen: unknown[] }[]>(
      `select coalesce(json_agg(t), '[]'::json) as zeilen from public.${tabelle} t where ${bedingung}`,
    );
    teile[name] = z?.zeilen ?? [];
  }
  return teile;
}

function neueIds(praefix: string): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${praefix}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;

/** Zeilen des Vorgangs wie schreiben(): neue Zeilen über zeileVorbereiten, Storno setzt storniert_am */
async function schreiben(tx: Db, vorgang: Vorgang, jetzt: Date): Promise<void> {
  const uhr = { jetzt, zeitzone: ZEITZONE };
  for (const s of vorgang) {
    if (s.art === 'storno') {
      await tx.unsafe(
        `update public.${s.tabelle} set storniert_am = $1::timestamptz where client_id = $2::uuid and storniert_am is null`,
        [jetzt.toISOString(), s.clientId],
      );
      continue;
    }
    expect(s.art).toBe('neu');
    const zeile = { ...zeileVorbereiten(s as Neu, uhr, 'keimung-test'), erfasst_am: jetzt.toISOString() };
    const spalten = Object.keys(zeile)
      .map((k) => `"${k}"`)
      .join(', ');
    await tx.unsafe(
      `insert into public.${s.tabelle} (${spalten})
       select ${spalten} from json_populate_record(null::public.${s.tabelle}, $1::text::json)`,
      [JSON.stringify(zeile)],
    );
  }
}

interface Stand {
  lage: Lage;
  satzId: string;
  saatgutId: string | null;
  /** Pflanzungen in Schwammfolge; die erste trägt den Zieltopf lage.toepfe[0] */
  schwaemme: { pflanzungId: string; samen: number; zieltopf?: string }[];
}

/** «Zwei» in X-A1 mit drei Zieltöpfen in X-2.3 säen */
async function gesaet(tx: Db): Promise<Stand> {
  const lage = await lageAufbauen(tx);
  const eingabe = {
    anlageId: ANLAGE_X,
    einstieg: 'scan',
    begonnenAm: new Date(SAAT.getTime() - 60_000),
    saatdatum: '2027-01-07',
    zielPlatzId: lage.platz23,
    saetze: [
      {
        sorteId: lage.zwei,
        kulturform: 'kopf',
        boxPlatzId: lage.boxA1,
        zieltopfIds: lage.toepfe.slice(0, 3),
      },
    ],
  } as SaatEingabe;
  const saat = saatVorgang(await teileLesen(tx), eingabe, neueIds('5a'), SAAT, ZEITZONE);
  expect(saat.length).toBeGreaterThan(0);
  await schreiben(tx, saat, SAAT);
  const satz = saat.find((s): s is Neu => s.art === 'neu' && s.tabelle === 'satz')?.felder;
  const satzId = String(satz?.['id']);
  const ansicht = keimAnsicht(await teileLesen(tx), satzId, KEIM, ZEITZONE);
  expect(ansicht).toBeDefined();
  const schwaemme = (ansicht?.schwaemme ?? []).map((s) => ({
    pflanzungId: s.pflanzungId,
    samen: s.samen,
    ...(s.zieltopf ? { zieltopf: s.zieltopf.netztopfId } : {}),
  }));
  expect(schwaemme.length).toBeGreaterThanOrEqual(3);
  expect(schwaemme.slice(0, 3).every((s) => s.zieltopf)).toBe(true);
  return { lage, satzId, saatgutId: (satz?.['saatgut_id'] as string | null) ?? null, schwaemme };
}

/** Keimprüfung am 11.1.: erster Schwamm 0, die übrigen alle Samen; optional Stationsplätze */
async function geprueft(
  tx: Db,
  stand: Stand,
  station: KeimEingabe['station'] = [],
): Promise<{ vorgang: Vorgang; abschlussId: string }> {
  const eingabe: KeimEingabe = {
    satzId: stand.satzId,
    keimtempEingehalten: true,
    werte: stand.schwaemme.map((s, i) => ({ pflanzungId: s.pflanzungId, gekeimt: i === 0 ? 0 : s.samen })),
    station,
  };
  const vorgang = keimVorgang(await teileLesen(tx), eingabe, neueIds('5b'), KEIM, ZEITZONE);
  expect(vorgang.length).toBeGreaterThan(0);
  await schreiben(tx, vorgang, KEIM);
  const abschluss = vorgang.find(
    (s): s is Neu => s.art === 'neu' && s.tabelle === 'ereignis' && s.felder['typ'] === 'abschluss',
  );
  return { vorgang, abschlussId: String(abschluss?.felder['id']) };
}

async function wiederhergestellt(tx: Db, stand: Stand): Promise<void> {
  const erste = stand.schwaemme[0]?.pflanzungId ?? '';
  const { vorgang } = wiederherstellenVorgang(await teileLesen(tx), erste, neueIds('5c'), WIEDER, ZEITZONE);
  expect(vorgang.length).toBeGreaterThan(0);
  await schreiben(tx, vorgang, WIEDER);
}

const aktiveReservierungen = async (tx: Db, stand: Stand) =>
  (
    await tx<{ pflanzung_id: string }[]>`
      select ra.pflanzung_id from public.v_reservierung_aktiv ra
        join public.pflanzung pf on pf.id = ra.pflanzung_id
       where pf.satz_id = ${stand.satzId}::uuid`
  )
    .map((r) => r.pflanzung_id)
    .sort();

const zustand = async (tx: Db, pflanzungId: string) => {
  const [z] = await tx<{ status: string; platz_id: string | null; loch_nr: number | null }[]>`
    select status, platz_id, loch_nr from public.v_pflanzung_zustand where pflanzung_id = ${pflanzungId}::uuid`;
  return z;
};

describe('R8.2 und R1.7 Reservierung und Zustand in der Datenbank', () => {
  it('R8.2 v_reservierung_aktiv ohne die Reservierung nach keimt_nicht', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      const mitZiel = stand.schwaemme.filter((s) => s.zieltopf).map((s) => s.pflanzungId);
      expect(await aktiveReservierungen(tx, stand)).toEqual([...mitZiel].sort());
      await geprueft(tx, stand);
      expect(await aktiveReservierungen(tx, stand)).toEqual(mitZiel.slice(1).sort());
      // der Topf des ersten Schwamms ist ohne aktive Reservierung
      const [frei] = await tx<{ n: number }[]>`
        select count(*)::int as n from public.v_reservierung_aktiv where netztopf_id = ${stand.lage.toepfe[0] ?? ''}::uuid`;
      expect(frei?.n).toBe(0);
    });
  });

  it('R8.2 v_reservierung_aktiv wieder mit der Reservierung nach wiederherstellen', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      const mitZiel = stand.schwaemme.filter((s) => s.zieltopf).map((s) => s.pflanzungId);
      const { abschlussId } = await geprueft(tx, stand);
      await wiederhergestellt(tx, stand);
      expect(await aktiveReservierungen(tx, stand)).toEqual([...mitZiel].sort());
      const [w] = await tx<{ ereignis_id: string; pflanzung_id: string }[]>`
        select daten ->> 'ereignis_id' as ereignis_id, pflanzung_id from public.ereignis
         where typ = 'wiederherstellen' and storniert_am is null`;
      expect(w).toEqual({ ereignis_id: abschlussId, pflanzung_id: stand.schwaemme[0]?.pflanzungId });
    });
  });

  it('R1.7 v_pflanzung_zustand Status keimt_nicht, nach Wiederherstellen aktiv', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      const erste = stand.schwaemme[0]?.pflanzungId ?? '';
      expect((await zustand(tx, erste))?.status).toBe('aktiv');
      await geprueft(tx, stand);
      expect((await zustand(tx, erste))?.status).toBe('keimt_nicht');
      expect((await zustand(tx, stand.schwaemme[1]?.pflanzungId ?? ''))?.status).toBe('aktiv');
      await wiederhergestellt(tx, stand);
      expect((await zustand(tx, erste))?.status).toBe('aktiv');
    });
  });
});

describe('R12.2 Keimrate in der Datenbank', () => {
  it('R12.2 v_keimrate gleich keimbilanz() für denselben Stand', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      expect(stand.saatgutId).not.toBeNull();
      await tx`update public.anlage set datenart = 'echt' where id = ${ANLAGE_X}::uuid`;
      await geprueft(tx, stand);
      const teile = await teileLesen(tx);
      const [sicht] = await tx<{ gesaet: number; gekeimt: number; rate: number | null }[]>`
        select gesaet::int as gesaet, gekeimt::int as gekeimt, rate_geglaettet::float8 as rate
          from public.v_keimrate where saatgut_id = ${stand.saatgutId ?? ''}::uuid`;
      const gesaetSumme = stand.schwaemme.reduce((a, s) => a + s.samen, 0);
      expect(sicht?.gesaet).toBe(gesaetSumme);
      expect(sicht?.gekeimt).toBe(gesaetSumme - (stand.schwaemme[0]?.samen ?? 0));
      const bilanz = keimbilanz(teile, stand.saatgutId ?? '');
      expect(bilanz).toEqual({ gesaet: sicht?.gesaet, gekeimt: sicht?.gekeimt });
      // die geglättete Rate der Domäne entspricht der Sicht (begrenzt auf 0.3 bis 0.98)
      const [basis] = await tx<{ p_packung: number | null; p_art: number | null }[]>`
        select sg.keimfaehigkeit_packung::float8 as p_packung, ar.standard_keimfaehigkeit::float8 as p_art
          from public.saatgut sg
          join public.sorte so on so.sorte_id = sg.sorte_id and so.gueltig_bis is null
          left join public.art ar on ar.art_id = so.art_id and ar.gueltig_bis is null
         where sg.id = ${stand.saatgutId ?? ''}::uuid`;
      const p = keimrateGeglaettet({ ...bilanz, pPackung: basis?.p_packung, pArt: basis?.p_art }).p;
      const erwartet =
        sicht?.rate === null || sicht?.rate === undefined
          ? undefined
          : Math.min(0.98, Math.max(0.3, sicht.rate));
      if (erwartet === undefined) expect(p).toBeUndefined();
      else expect(p).toBeCloseTo(erwartet, 9);
    });
  });

  it('R12.2 Keimung in einer Demo-Anlage fehlt in v_keimrate', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      expect(stand.saatgutId).not.toBeNull();
      await geprueft(tx, stand);
      const [ereignisse] = await tx<{ n: number }[]>`
        select count(*)::int as n from public.ereignis e
          join public.pflanzung pf on pf.id = e.pflanzung_id
         where e.typ = 'keimung' and e.storniert_am is null and pf.satz_id = ${stand.satzId}::uuid`;
      expect(ereignisse?.n).toBe(stand.schwaemme.length);
      const [sicht] = await tx<{ gesaet: number; gekeimt: number }[]>`
        select gesaet::int as gesaet, gekeimt::int as gekeimt from public.v_keimrate
         where saatgut_id = ${stand.saatgutId ?? ''}::uuid`;
      expect(sicht).toEqual({ gesaet: 0, gekeimt: 0 });
      expect(keimbilanz(await teileLesen(tx), stand.saatgutId ?? '')).toEqual({ gesaet: 0, gekeimt: 0 });
    });
  });
});

describe('R6.1 Stationseintritt in der Datenbank', () => {
  it('R6.1 Stationseintritt setzt platz_id und loch_nr in v_pflanzung_zustand', async () => {
    await inTransaktion(async (tx) => {
      const stand = await gesaet(tx);
      // die gekeimten Schwämme 2 und 3 (mit Zieltopf) auf X-4.4 Loch 1 und 2
      const [, zwei, drei] = stand.schwaemme;
      const station = [
        { pflanzungId: zwei?.pflanzungId ?? '', platzId: stand.lage.platz44, lochNr: 1 },
        { pflanzungId: drei?.pflanzungId ?? '', platzId: stand.lage.platz44, lochNr: 2 },
      ];
      const { vorgang } = await geprueft(tx, stand, station);
      expect(vorgang.filter((s) => s.art === 'neu' && s.felder['typ'] === 'verschieben').length).toBe(2);
      expect(await zustand(tx, zwei?.pflanzungId ?? '')).toEqual({
        status: 'aktiv',
        platz_id: stand.lage.platz44,
        loch_nr: 1,
      });
      expect(await zustand(tx, drei?.pflanzungId ?? '')).toEqual({
        status: 'aktiv',
        platz_id: stand.lage.platz44,
        loch_nr: 2,
      });
      // ohne Stationseintritt bleibt der Ort leer (Anzuchtort des Satzes)
      const rest = stand.schwaemme.slice(3);
      for (const s of rest) expect((await zustand(tx, s.pflanzungId))?.platz_id ?? null).toBeNull();
    });
  });
});
