// AK «Zähltest», «Idempotenz», «Versionierung», «Teilfreigabe», «Abbruch» [SQL] (Issue #10, Plan 10 Testliste;
// 03_import_w0.md Abschnitte 8, 10; Konzept 8.1 Regel 4, 8.4, 9.5; R5.2). Vitest gegen die lokale Datenbank
// (supabase start, vorher supabase db reset), Prüfung nur über SQL auf Tabellen und Sichten (Plan 10, Abweichung
// von 06_tests.md Abschnitt 1). Uhr injiziert: jetzt1 = 24.11.2026 09:00, jetzt2 = 25.11.2026 09:00 Europe/Zurich.
// Jeder Test läuft in einer äusseren Transaktion mit dem kern des Skripts und endet mit rollback; nur die
// Abbruch- und Trockenlauf-Tests nutzen die Hülle und vergleichen einen Schnappschuss vorher und nachher.
//
// Vorausgesetzt (zusätzlich zu den Unit-Tests, siehe tests/unit/w0-abbildung.test.ts):
//   scripts/seed/ladeskript.ts
//     ladeskript(plan, lauf): { vorbereitung; kern; berichtAbfrage; vollstaendig }
//       vorbereitung   legt die Berichtstabelle an (temporär, wiederholbar in derselben Sitzung und Transaktion)
//       kern           alle Schritte ohne Transaktionssteuerung (8.2), inkl. Zähltest; Fehler = Ausnahme
//       berichtAbfrage eine select-Anweisung mit genau einer Zeile, Spalte bericht (jsonb) = SeedBericht
//       vollstaendig   vorbereitung; begin; kern; commit; berichtAbfrage (bei trocken: Ausnahme seed_trockenlauf)
//   scripts/seed/ausfuehren.ts
//     interface Ausfuehrer { ausfuehren(skript: string): Promise<SeedBericht>; schliessen(): Promise<void> }
//     ausfuehrerLokal(url: string): Ausfuehrer     wirft sofort, wenn der Host nicht 127.0.0.1 oder localhost ist
//     ausfuehrerDev(token: string): Ausfuehrer     wirft sofort, wenn DEV_PROJEKT nicht jalvmzgvxvidgmoxuglp ist
//     seedLauf(dateien: W0Dateien, ausfuehrer: Ausfuehrer, lauf): Promise<SeedBericht>
//       prüft zuerst (pruefen, modus freigegeben); bei Verstössen Error mit Datei, zeile_id, Regel und Wert in
//       der Meldung, ohne ausfuehrer.ausfuehren aufzurufen; sonst ladeplan → ladeskript → ausfuehren(vollstaendig)
//   SeedBericht (scripts/seed/bericht.ts), JSON:
//     { dateien: { datei; tabelle; geladen; geaendert; geschlossen }[]   // geschlossen = ohne Nachfolger
//       nichtGeladen: { artId; grund }[]; fehlendeDateien: string[];
//       konflikte: { art: 'gegenprobe' | 'app'; zeileId; text }[]; vollstaendigkeit: unknown[] }
//   quelldatei in der Datenbank = Pfad relativ zum Repository (z. B. data/wissensbasis/freigegeben/profilwert.csv).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { ladeskript } from '../../scripts/seed/ladeskript.ts';
import { ausfuehrerDev, ausfuehrerLokal, seedLauf } from '../../scripts/seed/ausfuehren.ts';
import {
  PFAD,
  dateienAus,
  entfernen,
  kopie,
  muss,
  spalteAnhaengen,
  zeile,
  type Dateien,
} from '../unit/w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];
type Ausfuehrer = Parameters<typeof seedLauf>[1];
type Db = postgres.Sql;

interface BerichtDatei {
  datei: string;
  tabelle: string;
  geladen: number;
  geaendert: number;
  geschlossen: number;
}
interface SeedBericht {
  dateien: BerichtDatei[];
  nichtGeladen: { artId: string; grund: string }[];
  fehlendeDateien: string[];
  konflikte: { art: string; zeileId: string; text: string }[];
  vollstaendigkeit: unknown[];
}

const DB_URL = process.env['DB_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = postgres(DB_URL, { max: 1, onnotice: () => undefined });
const WURZEL = fileURLToPath(new URL('../..', import.meta.url));

const JETZT1 = new Date('2026-11-24T08:00:00Z');
const JETZT2 = new Date('2026-11-25T08:00:00Z');
const LAUF1 = { jetzt: JETZT1, commit: 'test1', gesamtfreigabe: false, trocken: false };
const TIM = '00000000-0000-4000-8000-0000000000aa';

const VERSIONIERT = [
  'art',
  'art_kulturform',
  'sorte',
  'profilwert',
  'saatempfehlung',
  'duengerschema',
  'wissenseintrag',
];
const SCHNAPPSCHUSS = [
  'quelle',
  'art_schluessel',
  'kulturgruppe',
  'art',
  'art_kulturform',
  'kulturform_profilende',
  'herkunft',
  'sorte_schluessel',
  'sorte',
  'profilwert',
  'pflichtgroesse',
  'saatempfehlung',
  'produkt',
  'duengerschema',
  'wissenseintrag',
  'k_faktor',
  'saatgut',
  'messgeraet',
  'einstellung',
  'auswertung_fenster',
  'ereignis',
];

// ---------------------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------------------

function lesen(ordner: string): Dateien {
  const roh: Record<string, string> = {};
  const basis = join(WURZEL, ordner);
  for (const datei of readdirSync(basis, { recursive: true, encoding: 'utf8' })) {
    if (datei.endsWith('.csv')) roh[datei.replace(/\\/g, '/')] = readFileSync(join(basis, datei), 'utf8');
  }
  return dateienAus(roh, '');
}
const wissen = (): Dateien => lesen('tests/fixtures/wissen');
function startbelegung(): Dateien {
  const sorten = dateienAus({ [PFAD.sorten]: readFileSync(join(WURZEL, PFAD.sorten), 'utf8') }, '');
  return { ...lesen('tests/fixtures/seed/startbelegung'), ...sorten };
}
function setze(d: Dateien, pfad: string, zeileId: string, werte: Record<string, string | null>): Dateien {
  Object.assign(zeile(d, pfad, zeileId), werte);
  return d;
}

// ---------------------------------------------------------------------------------------------------------
// Lauf und Abfragen
// ---------------------------------------------------------------------------------------------------------

function planFuer(d: Dateien) {
  const dateien = d as unknown as W0Dateien;
  return ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
}

function alsBericht(wert: unknown): SeedBericht {
  return (typeof wert === 'string' ? JSON.parse(wert) : wert) as SeedBericht;
}

/** Ein Lauf mit dem kern des Skripts in der Transaktion des Tests */
async function kernLauf(tx: Db, d: Dateien, jetzt: Date, commit: string): Promise<SeedBericht> {
  expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  const skript = ladeskript(planFuer(d), { jetzt, commit, gesamtfreigabe: false, trocken: false });
  await tx.unsafe(skript.vorbereitung);
  await tx.unsafe(skript.kern);
  const [z] = await tx.unsafe(skript.berichtAbfrage);
  return alsBericht(muss(z, 'Zeile der Berichtsabfrage')['bericht']);
}

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

async function fehlerText(p: Promise<unknown>): Promise<string> {
  const e = await p.then(
    () => null,
    (x: unknown) => x,
  );
  expect(e, 'Lauf hätte abbrechen sollen').toBeInstanceOf(Error);
  return (e as Error).message;
}

async function anzahl(db: Db, tabelle: string, bedingung = 'true'): Promise<number> {
  const [z] = await db.unsafe(`select count(*)::int as n from public.${tabelle} where ${bedingung}`);
  return Number(muss(z, tabelle)['n']);
}

/** Gültige Fassungen je Datei und Zieltabelle; undefined für Tabellen ohne Bezug zur Datei */
async function gueltig(db: Db, datei: string, tabelle: string): Promise<number | undefined> {
  if (VERSIONIERT.includes(tabelle))
    return anzahl(db, tabelle, `gueltig_bis is null and quelldatei = '${datei}'`);
  if (tabelle === 'herkunft' && datei === PFAD.art) {
    return anzahl(db, 'herkunft', `gueltig_bis is null and tabelle in ('art', 'art_kulturform')`);
  }
  if (tabelle === 'herkunft' && datei === PFAD.sorten) {
    return anzahl(db, 'herkunft', `gueltig_bis is null and tabelle = 'sorte'`);
  }
  return undefined;
}

async function zeilenzahlen(db: Db): Promise<Record<string, number>> {
  const teile = SCHNAPPSCHUSS.map((t) => `select '${t}' as tabelle, count(*)::int as n from public.${t}`);
  const zeilen = await db.unsafe(teile.join(' union all '));
  return Object.fromEntries(zeilen.map((z) => [String(z['tabelle']), Number(z['n'])]));
}

/** Zeilenzahl und grösste erfasst_am aller Wissens- und Konstantentabellen sowie ereignis */
async function schnappschuss(db: Db): Promise<Record<string, string>> {
  const teile = SCHNAPPSCHUSS.map(
    (t) => `select '${t}' as tabelle, count(*)::int as n, max(erfasst_am)::text as letzte from public.${t}`,
  );
  const zeilen = await db.unsafe(teile.join(' union all '));
  return Object.fromEntries(zeilen.map((z) => [String(z['tabelle']), `${z['n']}|${z['letzte']}`]));
}

function eintrag(b: SeedBericht, datei: string, tabelle: string): BerichtDatei {
  return muss(
    b.dateien.find((x) => x.datei === datei && x.tabelle === tabelle),
    `Bericht ${datei} → ${tabelle}`,
  );
}
function sortiert(liste: BerichtDatei[]): BerichtDatei[] {
  return [...liste].sort((a, b) => `${a.datei}|${a.tabelle}`.localeCompare(`${b.datei}|${b.tabelle}`));
}

beforeAll(async () => {
  // Ausgangslage: supabase db reset, keine Zeilen der Fixtures
  const n = await anzahl(sql, 'art_schluessel', `art_id like 'test_art_%'`);
  if (n > 0) throw new Error('Datenbank enthält Fixture-Zeilen; vorher supabase db reset ausführen');
});
afterAll(async () => {
  await sql.end();
});

// ---------------------------------------------------------------------------------------------------------
// Zähltest (8.6)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Zähltest', () => {
  it('Zähltest je Datei: Dateizeilen nach Auswahl gleich gültige Fassungen', async () => {
    const d = wissen();
    const plan = planFuer(d);
    await inTransaktion(async (tx) => {
      await kernLauf(tx, d, JETZT1, 'test1');
      const geprueft: string[] = [];
      for (const e of plan.erwartet) {
        const n = await gueltig(tx, e.datei, e.tabelle);
        if (n === undefined) continue;
        expect(n, `${e.datei} → ${e.tabelle}`).toBe(e.anzahl);
        geprueft.push(`${e.datei} → ${e.tabelle}`);
      }
      expect(geprueft).toEqual(
        expect.arrayContaining(
          [
            [PFAD.art, 'art'],
            [PFAD.art, 'art_kulturform'],
            [PFAD.art, 'herkunft'],
            [PFAD.profilwert, 'profilwert'],
            [PFAD.saatempfehlung, 'saatempfehlung'],
            [PFAD.sorten, 'sorte'],
            [PFAD.sorten, 'profilwert'],
            [PFAD.duengerschema, 'duengerschema'],
            [PFAD.wissenseintrag, 'wissenseintrag'],
          ].map(([datei, tabelle]) => `${datei} → ${tabelle}`),
        ),
      );
      // Unabhängig aus der Fixture gezählt (test_art_d nur Artmerkmale und Keimungswerte)
      expect(await gueltig(tx, PFAD.art, 'art')).toBe(4);
      expect(await gueltig(tx, PFAD.art, 'art_kulturform')).toBe(5);
      expect(await gueltig(tx, PFAD.art, 'herkunft')).toBe(72);
      expect(await gueltig(tx, PFAD.profilwert, 'profilwert')).toBe(107);
      expect(await gueltig(tx, PFAD.saatempfehlung, 'saatempfehlung')).toBe(4);
      expect(await gueltig(tx, PFAD.sorten, 'sorte')).toBe(4);
      expect(await gueltig(tx, PFAD.sorten, 'profilwert')).toBe(2);
      expect(await gueltig(tx, PFAD.sorten, 'herkunft')).toBe(2);
      expect(await gueltig(tx, PFAD.duengerschema, 'duengerschema')).toBe(6);
      expect(await gueltig(tx, PFAD.wissenseintrag, 'wissenseintrag')).toBe(3);
      expect(await anzahl(tx, 'saatgut')).toBe(4);
      expect(await anzahl(tx, 'kulturgruppe')).toBe(2);
      expect(await anzahl(tx, 'quelle', `quelle_id in ('test-fixture', 'tuete-sorte-test-a-eins')`)).toBe(2);
    });
  });

  it('Zähltest sorten.csv: 22 Sorten und 22 Packungen', async () => {
    await inTransaktion(async (tx) => {
      const b = await kernLauf(tx, startbelegung(), JETZT1, 'test1');
      expect(await gueltig(tx, PFAD.sorten, 'sorte')).toBe(22);
      expect(await anzahl(tx, 'sorte_schluessel')).toBe(22);
      expect(await anzahl(tx, 'saatgut', 'storniert_am is null')).toBe(22);
      expect(await anzahl(tx, 'saatgut', 'sorte_id is not null')).toBe(22);
      expect(await gueltig(tx, PFAD.art, 'art')).toBe(11);
      expect(await anzahl(tx, 'kulturgruppe')).toBe(6);
      // je Sorte genau eine Packung
      const [z] = await tx.unsafe('select count(distinct sorte_id)::int as n from public.saatgut');
      expect(Number(z?.['n'])).toBe(22);
      // Mangold und Randen als blatt (W6)
      const blatt = await tx.unsafe(
        `select s.zeile_id from public.sorte s where s.gueltig_bis is null and s.kulturtyp = 'blatt'
            and s.art_id in ('beta_vulgaris_cicla', 'beta_vulgaris_conditiva') order by 1`,
      );
      expect(blatt.map((x) => x['zeile_id'])).toEqual([
        'sorte-mangold-bright-lights',
        'sorte-randen-bull-s-blood',
      ]);
      // Teillieferung: fehlende Dateien stehen im Bericht (A1)
      expect(b.fehlendeDateien).toEqual(
        expect.arrayContaining([
          PFAD.profilwert,
          PFAD.saatempfehlung,
          PFAD.duengerschema,
          PFAD.wissenseintrag,
        ]),
      );
    });
  });

  it('Zähltest Abweichung bricht ab und rollt den ganzen Lauf zurück', async () => {
    const plan = planFuer(wissen());
    const e = muss(
      plan.erwartet.find((x) => x.datei === PFAD.profilwert && x.tabelle === 'profilwert'),
      'erwartet profilwert',
    );
    const soll = e.anzahl;
    e.anzahl = soll + 1;
    const skript = ladeskript(plan, LAUF1);
    const vorher = await schnappschuss(sql);
    const aus = ausfuehrerLokal(DB_URL);
    try {
      const text = await fehlerText(aus.ausfuehren(skript.vollstaendig));
      expect(text).toContain('profilwert');
      expect(text).toContain(String(soll + 1));
      expect(text).toContain(String(soll));
    } finally {
      await aus.schliessen();
    }
    expect(await schnappschuss(sql)).toEqual(vorher);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Idempotenz (8.3, 10)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Idempotenz', () => {
  it('Idempotenz zweiter Lauf mit unveränderten Dateien ändert keine Zeile und schreibt kein Ereignis', async () => {
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      const vorher = await zeilenzahlen(tx);
      const b = await kernLauf(tx, wissen(), JETZT2, 'test2');
      expect(await zeilenzahlen(tx)).toEqual(vorher);
      for (const t of VERSIONIERT) {
        expect(await anzahl(tx, t, `commit = 'test2'`), t).toBe(0);
        expect(await anzahl(tx, t, 'gueltig_bis is not null'), t).toBe(0);
      }
      expect(await anzahl(tx, 'herkunft', 'gueltig_bis is not null')).toBe(0);
      expect(await anzahl(tx, 'ereignis', `app_version like 'seed@%'`)).toBe(0);
      expect(b.dateien.length).toBeGreaterThan(0);
      for (const x of b.dateien) {
        expect([x.geladen, x.geaendert, x.geschlossen], `${x.datei} → ${x.tabelle}`).toEqual([0, 0, 0]);
      }
    });
  });

  it('Idempotenz Seed-Konstanten, Saatgut und k-Startwerte nur einmal', async () => {
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      await kernLauf(tx, wissen(), JETZT2, 'test2');
      expect(await anzahl(tx, 'messgeraet')).toBe(1);
      expect(await anzahl(tx, 'messgeraet', `modell = 'Aquamaster P160 Pro2'`)).toBe(1);
      expect(await anzahl(tx, 'einstellung')).toBe(1);
      expect(await anzahl(tx, 'produkt')).toBe(4);
      expect(await anzahl(tx, 'pflichtgroesse')).toBe(30);
      expect(await anzahl(tx, 'pflichtgroesse', 'mindestens_art')).toBe(13);
      expect(await anzahl(tx, 'kulturform_profilende')).toBe(6);
      expect(await anzahl(tx, 'auswertung_fenster')).toBe(1);
      expect(
        await anzahl(
          tx,
          'auswertung_fenster',
          `name = 'testbetrieb' and von = '2027-01-07 00:00 Europe/Zurich'::timestamptz
             and bis = '2027-04-01 00:00 Europe/Zurich'::timestamptz`,
        ),
      ).toBe(1);
      expect(await anzahl(tx, 'k_faktor')).toBe(3);
      expect(
        await anzahl(
          tx,
          'k_faktor',
          `quelle = 'startwert' and wert = 0.3 and gilt_ab = '${JETZT1.toISOString()}'::timestamptz
             and produkt_id in ('grow', 'micro_hard_water', 'bloom')`,
        ),
      ).toBe(3);
      expect(await anzahl(tx, 'saatgut')).toBe(4);
      const [z] = await tx.unsafe('select count(distinct sorte_id)::int as n from public.saatgut');
      expect(Number(z?.['n'])).toBe(4);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------
// Versionierung (8.3, 8.5; Konzept 8.1 Regel 4; R5.2)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Versionierung', () => {
  it('Versionierung geänderter EC-Wert: genau eine geschlossene und eine neue Fassung und ein Ereignis sollwert_geaendert', async () => {
    const ZID = 'pw.test_art_a.wachstum.ec';
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      const vorher = await zeilenzahlen(tx);
      const b = await kernLauf(
        tx,
        setze(wissen(), PFAD.profilwert, ZID, { wert_max: '1.9' }),
        JETZT2,
        'test2',
      );

      const fassungen = await tx`
        select gueltig_ab, gueltig_bis, commit, wert_max, ec_max_quelle, quelldatei
          from public.profilwert where zeile_id = ${ZID} order by gueltig_ab`;
      expect(fassungen).toHaveLength(2);
      const [alt, neu] = [muss(fassungen[0], 'alt'), muss(fassungen[1], 'neu')];
      expect(Number(alt['wert_max'])).toBe(1.8);
      expect((alt['gueltig_bis'] as Date).toISOString()).toBe(JETZT2.toISOString());
      expect((neu['gueltig_ab'] as Date).toISOString()).toBe(JETZT2.toISOString());
      expect(neu['gueltig_bis']).toBeNull();
      expect(neu['commit']).toBe('test2');
      expect(neu['quelldatei']).toBe(PFAD.profilwert);
      expect(Number(neu['wert_max'])).toBe(1.9);
      expect(Number(neu['ec_max_quelle'])).toBe(1.9);

      // sonst nichts geschlossen oder neu
      for (const t of VERSIONIERT) {
        const n = t === 'profilwert' ? 1 : 0;
        expect(await anzahl(tx, t, `gueltig_bis = '${JETZT2.toISOString()}'::timestamptz`), t).toBe(n);
        expect(await anzahl(tx, t, `commit = 'test2'`), t).toBe(n);
      }
      const nachher = await zeilenzahlen(tx);
      expect(nachher['profilwert']).toBe(Number(vorher['profilwert']) + 1);

      const ereignisse = await tx`
        select art_id, sorte_id, app_version, gilt_ab, daten from public.ereignis where typ = 'sollwert_geaendert'`;
      expect(ereignisse).toHaveLength(1);
      const ev = muss(ereignisse[0], 'Ereignis');
      expect(ev['art_id']).toBe('test_art_a');
      expect(ev['sorte_id']).toBeNull();
      expect(ev['app_version']).toBe('seed@test2');
      expect((ev['gilt_ab'] as Date).toISOString()).toBe(JETZT2.toISOString());
      expect((ev['daten'] as Record<string, unknown>)['profilwert_zeile_id']).toBe(ZID);

      expect(eintrag(b, PFAD.profilwert, 'profilwert').geaendert).toBe(1);
    });
  });

  it('Versionierung Zeile nicht mehr in der Datei: gueltig_bis gesetzt, nichts gelöscht', async () => {
    const ZID = 'pw.test_art_a.keimung.keimart';
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      const vorher = await zeilenzahlen(tx);
      const d = wissen();
      entfernen(d, PFAD.profilwert, ZID);
      const b = await kernLauf(tx, d, JETZT2, 'test2');

      const fassungen = await tx`select gueltig_bis from public.profilwert where zeile_id = ${ZID}`;
      expect(fassungen).toHaveLength(1);
      expect((muss(fassungen[0], ZID)['gueltig_bis'] as Date).toISOString()).toBe(JETZT2.toISOString());
      const nachher = await zeilenzahlen(tx);
      for (const t of SCHNAPPSCHUSS.filter((x) => x !== 'ereignis')) {
        expect(nachher[t], t).toBe(vorher[t]);
      }
      expect(await anzahl(tx, 'profilwert', `gueltig_bis is not null`)).toBe(1);

      const ereignisse = await tx`
        select art_id, app_version, daten from public.ereignis where typ = 'sollwert_geaendert'`;
      expect(ereignisse).toHaveLength(1);
      expect(ereignisse[0]?.['art_id']).toBe('test_art_a');
      expect((ereignisse[0]?.['daten'] as Record<string, unknown>)['profilwert_zeile_id']).toBe(ZID);
      expect(eintrag(b, PFAD.profilwert, 'profilwert').geschlossen).toBe(1);
    });
  });

  it('Versionierung erster Lauf ohne Ereignis, jede Fassung mit quelldatei, zeile_id, commit, freigegeben_am', async () => {
    await inTransaktion(async (tx) => {
      const b = await kernLauf(tx, wissen(), JETZT1, 'test1');
      expect(await anzahl(tx, 'ereignis', `typ = 'sollwert_geaendert'`)).toBe(0);
      const ab = `'${JETZT1.toISOString()}'::timestamptz`;
      for (const t of VERSIONIERT) {
        expect(await anzahl(tx, t), t).toBeGreaterThan(0);
        expect(
          await anzahl(
            tx,
            t,
            `quelldatei is null or quelldatei = 'app' or zeile_id is null or commit <> 'test1'
               or gueltig_ab <> ${ab} or gueltig_bis is not null`,
          ),
          t,
        ).toBe(0);
      }
      for (const [t, bedingung] of [
        ['art', 'true'],
        ['art_kulturform', 'true'],
        ['saatempfehlung', 'true'],
        ['profilwert', `ebene <> 'sorte'`],
      ] as const) {
        expect(await anzahl(tx, t, `${bedingung} and freigegeben_am is null`), t).toBe(0);
      }
      // Saatempfehlung aus der Datei: bestaetigt_am = freigegeben_am (4.5)
      expect(await anzahl(tx, 'saatempfehlung', 'bestaetigt_am is distinct from freigegeben_am')).toBe(0);
      expect(eintrag(b, PFAD.profilwert, 'profilwert')).toMatchObject({
        geladen: 107,
        geaendert: 0,
        geschlossen: 0,
      });
    });
  });

  it('Versionierung App-Fassung bleibt und erscheint als Konflikt im Bericht', async () => {
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      const [s] = await tx`select id from public.sorte_schluessel where sorte_key = 'sorte-test-a-eins'`;
      const sorteId = String(muss(s, 'sorte-test-a-eins')['id']);

      // Tim schreibt einen Tütenwert über den Schreibweg der App (UC4)
      await tx`insert into auth.users (id) values (${TIM}) on conflict (id) do nothing`;
      await tx`insert into public.zugang (user_id, app_version) values (${TIM}, 'test') on conflict (user_id) do nothing`;
      await tx`set local role authenticated`;
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: TIM, role: 'authenticated' })}, true)`;
      const daten = JSON.stringify({
        sorte_id: sorteId,
        groesse: 'keimtemp',
        wert_min: 19,
        wert_typ: 21,
        wert_max: 23,
      });
      await tx`select public.wissen_app_schreiben('tuetenwert', ${daten}::jsonb)`;
      await tx`reset role`;

      const d = setze(wissen(), PFAD.sorten, 'sorte-test-a-eins', { keimtemperatur_tuete: '17-25' });
      const b = await kernLauf(tx, d, JETZT2, 'test2');

      const gueltige = await tx`
        select quelldatei, wert_min, wert_max from public.profilwert
         where ebene = 'sorte' and sorte_id = ${sorteId} and groesse = 'keimtemp' and gueltig_bis is null`;
      expect(gueltige).toHaveLength(1);
      expect(gueltige[0]?.['quelldatei']).toBe('app');
      expect(Number(gueltige[0]?.['wert_min'])).toBe(19);
      expect(Number(gueltige[0]?.['wert_max'])).toBe(23);
      expect(await anzahl(tx, 'profilwert', `commit = 'test2'`)).toBe(0);
      expect(JSON.stringify(b.konflikte)).toContain('sorte-test-a-eins');
    });
  });
});

// ---------------------------------------------------------------------------------------------------------
// Teilfreigabe (8.4; Konzept 9.5; R1.3, R1.4)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Teilfreigabe', () => {
  it('Teilfreigabe Art ohne Phase bluete lädt nur Artmerkmale und Keimungswerte, v_sollwert vererbt mit Klasse D', async () => {
    await inTransaktion(async (tx) => {
      await kernLauf(tx, wissen(), JETZT1, 'test1');
      expect(await anzahl(tx, 'art', `art_id = 'test_art_d' and gueltig_bis is null`)).toBe(1);
      expect(
        await anzahl(
          tx,
          'herkunft',
          `tabelle = 'art' and zeile_id = 'art.test_art_d' and gueltig_bis is null`,
        ),
      ).toBe(10);
      expect(await anzahl(tx, 'art_kulturform', `art_id = 'test_art_d'`)).toBe(0);
      expect(await anzahl(tx, 'herkunft', `zeile_id like 'ak.test_art_d.%'`)).toBe(0);
      expect(await anzahl(tx, 'saatempfehlung', `art_id = 'test_art_d'`)).toBe(0);
      const pw = await tx`
        select phase::text || '.' || groesse::text as g from public.profilwert
         where ebene = 'art' and art_id = 'test_art_d' order by 1`;
      expect(pw.map((z) => z['g'])).toEqual(['keimung.dauer', 'keimung.keimart', 'keimung.keimtemp']);

      const [s] = await tx`select id from public.sorte_schluessel where sorte_key = 'sorte-test-d-vier'`;
      const sorteId = String(muss(s, 'sorte-test-d-vier')['id']);
      const wachstum = await tx`
        select groesse::text as groesse, herkunft_ebene::text as ebene, evidenzklasse
          from public.v_sollwert where sorte_id = ${sorteId} and phase = 'wachstum' order by 1`;
      expect(wachstum.map((z) => z['groesse'])).toEqual(
        expect.arrayContaining(['anwendbar', 'dauer', 'ec', 'ph', 'wassertemp']),
      );
      for (const z of wachstum) {
        expect(['kulturgruppe', 'standard'], String(z['groesse'])).toContain(z['ebene']);
        expect(z['evidenzklasse'], String(z['groesse'])).toBe('D');
      }
      const keimart = await tx`
        select herkunft_ebene::text as ebene, evidenzklasse, text_wert from public.v_sollwert
         where sorte_id = ${sorteId} and phase = 'keimung' and groesse = 'keimart'`;
      expect(keimart[0]).toMatchObject({ ebene: 'art', evidenzklasse: 'B2', text_wert: 'licht' });
    });
  });

  it('Teilfreigabe Bericht nennt nicht geladene Art mit Grund', async () => {
    await inTransaktion(async (tx) => {
      const b = await kernLauf(tx, wissen(), JETZT1, 'test1');
      expect(b.nichtGeladen.map((x) => x.artId)).toEqual(['test_art_d']);
      expect(muss(b.nichtGeladen[0], 'test_art_d').grund).toMatch(/Phase bluete ohne anwendbar/);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------
// Abbruch (2.2, 4.6, 7, 8.2, 10; Konzept 9.2)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Abbruch', () => {
  async function ohneWirkung(d: Dateien, erwartet: RegExp[], lauf = LAUF1): Promise<void> {
    const vorher = await schnappschuss(sql);
    const aus = ausfuehrerLokal(DB_URL);
    try {
      const text = await fehlerText(seedLauf(d as unknown as W0Dateien, aus, lauf));
      for (const muster of erwartet) expect(text).toMatch(muster);
    } finally {
      await aus.schliessen();
    }
    expect(await schnappschuss(sql)).toEqual(vorher);
  }

  it('Abbruch unbekannte Spalte: kein SQL gesendet, Datenbank unverändert', async () => {
    const d = wissen();
    spalteAnhaengen(d, PFAD.profilwert, 'notiz', 'x');
    const attrappe = {
      ausfuehren: vi.fn(async () => {
        throw new Error('Ausführer darf nicht aufgerufen werden');
      }),
      schliessen: vi.fn(async () => undefined),
    };
    const vorher = await schnappschuss(sql);
    const text = await fehlerText(
      seedLauf(d as unknown as W0Dateien, attrappe as unknown as Ausfuehrer, LAUF1),
    );
    expect(text).toMatch(/V1/);
    expect(text).toContain('notiz');
    expect(text).toContain(PFAD.profilwert);
    expect(attrappe.ausfuehren).not.toHaveBeenCalled();
    expect(await schnappschuss(sql)).toEqual(vorher);
  });

  it('Abbruch unbekannter Artname in sorten.csv: Datenbank unverändert', async () => {
    await ohneWirkung(setze(wissen(), PFAD.sorten, 'sorte-test-b-zwei', { art: 'Gurke' }), [
      /V2/,
      /Gurke/,
      /sorte-test-b-zwei/,
    ]);
  });

  it('Abbruch Ebene standard mit Grösse ec: Datenbank unverändert', async () => {
    const d = wissen();
    kopie(d, PFAD.profilwert, 'pw.test_blatt.wachstum.ec', {
      zeile_id: 'pw.standard.wachstum.ec',
      ebene: 'standard',
      bezug: 'standard',
    });
    await ohneWirkung(d, [/V8/, /pw\.standard\.wachstum\.ec/]);
  });

  it('Abbruch --gesamtfreigabe mit unvollständiger Sorte rollt zurück', async () => {
    // test_art_d ist nicht voll geladen: die Sorte sorte-test-d-vier bleibt unvollständig (v_vollstaendigkeit)
    await ohneWirkung(wissen(), [/vollst/i], { ...LAUF1, gesamtfreigabe: true });
  });

  it('Abbruch geänderte Quelle oder Konstante ohne Versionsspalten', async () => {
    const quelle = await fehlerText(
      inTransaktion(async (tx) => {
        await kernLauf(tx, wissen(), JETZT1, 'test1');
        await kernLauf(
          tx,
          setze(wissen(), PFAD.quelle, 'test-fixture', { titel: 'Anderer Titel' }),
          JETZT2,
          'test2',
        );
      }),
    );
    expect(quelle).toContain('test-fixture');

    const konstante = await fehlerText(
      inTransaktion(async (tx) => {
        await kernLauf(tx, wissen(), JETZT1, 'test1');
        await tx`update public.pflichtgroesse set mindestens_art = not mindestens_art
                  where phase = 'keimung' and groesse = 'bbch'`;
        await kernLauf(tx, wissen(), JETZT2, 'test2');
      }),
    );
    expect(konstante).toContain('pflichtgroesse');
    expect(konstante).toContain('bbch');
  });
});

// ---------------------------------------------------------------------------------------------------------
// Trockenlauf und Ziele (Plan 10, Lösungsweg 3 und 4, A16)
// ---------------------------------------------------------------------------------------------------------

describe('Seed Trockenlauf und Ziele', () => {
  it('Trockenlauf meldet die Änderungen und schreibt nichts', async () => {
    let schreiblauf: SeedBericht | undefined;
    await inTransaktion(async (tx) => {
      schreiblauf = await kernLauf(tx, wissen(), JETZT1, 'test1');
    });
    const vorher = await schnappschuss(sql);
    const aus = ausfuehrerLokal(DB_URL);
    const trocken = alsBericht(
      await seedLauf(wissen() as unknown as W0Dateien, aus, { ...LAUF1, trocken: true }).finally(() =>
        aus.schliessen(),
      ),
    );
    expect(await schnappschuss(sql)).toEqual(vorher);
    const erwartet = muss(schreiblauf, 'Bericht des Schreiblaufs');
    expect(sortiert(trocken.dateien)).toEqual(sortiert(erwartet.dateien));
    expect(trocken.nichtGeladen).toEqual(erwartet.nichtGeladen);
    expect(eintrag(trocken, PFAD.profilwert, 'profilwert').geladen).toBe(107);
  });

  it('W0-Seed-Ziel dev nur mit Projekt jalvmzgvxvidgmoxuglp', () => {
    const vorher = process.env['DEV_PROJEKT'];
    const netz = vi.fn();
    vi.stubGlobal('fetch', netz);
    try {
      process.env['DEV_PROJEKT'] = 'anderes-projekt';
      expect(() => ausfuehrerDev('token')).toThrow();
      delete process.env['DEV_PROJEKT'];
      expect(() => ausfuehrerDev('token')).toThrow();
      process.env['DEV_PROJEKT'] = 'jalvmzgvxvidgmoxuglp';
      expect(() => ausfuehrerDev('token')).not.toThrow();
      expect(netz).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      if (vorher === undefined) delete process.env['DEV_PROJEKT'];
      else process.env['DEV_PROJEKT'] = vorher;
    }
  });

  it('W0-Seed-Ziel lokal nur mit Host 127.0.0.1 oder localhost', async () => {
    for (const url of [
      'postgresql://postgres:postgres@db.example.invalid:5432/postgres',
      'postgresql://postgres:postgres@10.0.0.5:54322/postgres',
      'postgresql://postgres:postgres@127.0.0.1.example.invalid:54322/postgres',
    ]) {
      expect(() => ausfuehrerLokal(url), url).toThrow();
    }
    for (const url of [
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      'postgresql://postgres:postgres@localhost:54322/postgres',
    ]) {
      const aus = ausfuehrerLokal(url);
      await aus.schliessen();
    }
  });
});
