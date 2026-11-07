// Datenzugriff von push-taeglich gegen die Beschreibung des Bündels (Plan 31 Lösungsweg 1 und Testliste «Deno
// daten_test.ts»; Konzept R5.1, G1; UC8-AK10; Prüfer #27 H4: zwei Listen laufen auseinander). Läuft mit `deno test
// --allow-read --allow-env supabase/functions` ohne Netz: eine Attrappe des Supabase-Clients zeichnet je Abfrage
// Tabelle, Spalten, Filter, Ordnung und Bereich auf und liefert Zeilen aus dem Speicher (Filter is, eq, in werden
// angewandt, range schneidet wie PostgREST).
// Vorausgesetzt (Plan 31 Schnittstellen):
// - src/domain/datenpfad/buendel-teile.ts exportiert BUENDEL_TEILE und SEITE (verschoben aus src/daten/buendel.ts).
// - src/domain/datenpfad/buendel.ts exportiert teileKuerzen(teile) (rein, fehlende Teile bleiben fehlend).
// - supabaseDaten(db).teile(stichtag) lädt jeden Teil aus AUFGABEN_TEILE mit Tabelle (teil.tabelle ?? name), Spalten,
//   Filtern (ohneStorno → is storniert_am null, gueltig → is gueltig_bis null, typen → in typ, fensterTage → gte
//   gilt_ab fensterBeginn), Ordnung je Spalte aufsteigend und Seiten zu SEITE, danach teileKuerzen().
// - laufendeTimer(von, bis) fragt naehrloesungsansatz mit status laufend, ohne Storno und von < timer_ende ≤ bis ab (A).
import { AUFGABEN_TEILE } from '../../../src/domain/aufgaben.ts';
import { fensterBeginn, teileKuerzen } from '../../../src/domain/datenpfad/buendel.ts';
import { BUENDEL_TEILE, SEITE } from '../../../src/domain/datenpfad/buendel-teile.ts';
import { supabaseDaten } from './daten.ts';

const ZONE = 'Europe/Zurich';
const STICHTAG = new Date('2027-01-12T06:00:00.000Z');

function gleich(ist: unknown, soll: unknown, was: string): void {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: erwartet ${b}, erhalten ${a}`);
}

function wahr(bedingung: boolean, was: string): void {
  if (!bedingung) throw new Error(was);
}

// ---------------------------------------------------------------------------------------------------------
// Attrappe des Supabase-Clients
// ---------------------------------------------------------------------------------------------------------

type Zeile = Record<string, unknown>;
type Op = [string, ...unknown[]];
interface Abfrage {
  tabelle: string;
  ops: Op[];
}

class FakeDb {
  abfragen: Abfrage[] = [];
  constructor(private tabellen: Record<string, Zeile[]>) {}

  from(tabelle: string) {
    const abfrage: Abfrage = { tabelle, ops: [] };
    this.abfragen.push(abfrage);
    const zeilen = () => {
      let z = [...(this.tabellen[tabelle] ?? [])];
      for (const [name, spalte, wert] of abfrage.ops) {
        if (name === 'is' && wert === null) z = z.filter((r) => (r[String(spalte)] ?? null) === null);
        if (name === 'eq') z = z.filter((r) => r[String(spalte)] === wert);
        if (name === 'in') z = z.filter((r) => (wert as unknown[]).includes(r[String(spalte)]));
      }
      const bereich = abfrage.ops.find((o) => o[0] === 'range');
      if (bereich) z = z.slice(Number(bereich[1]), Number(bereich[2]) + 1);
      const limit = abfrage.ops.find((o) => o[0] === 'limit');
      if (limit) z = z.slice(0, Number(limit[1]));
      return z;
    };
    const kette: Record<string, unknown> = {};
    for (const name of [
      'select',
      'is',
      'eq',
      'neq',
      'in',
      'gt',
      'gte',
      'lt',
      'lte',
      'not',
      'or',
      'filter',
      'match',
      'order',
      'range',
      'limit',
      'insert',
      'update',
      'upsert',
      'abortSignal',
    ])
      kette[name] = (...args: unknown[]) => {
        abfrage.ops.push([name, ...args]);
        return kette;
      };
    kette['maybeSingle'] = () => Promise.resolve({ data: zeilen()[0] ?? null, error: null });
    kette['single'] = () => Promise.resolve({ data: zeilen()[0] ?? null, error: null });
    kette['then'] = (ok: (w: unknown) => unknown, nein?: (f: unknown) => unknown) =>
      Promise.resolve({ data: zeilen(), error: null, count: zeilen().length }).then(ok, nein);
    return kette;
  }

  rpc(name: string, args?: unknown) {
    this.abfragen.push({ tabelle: `rpc:${name}`, ops: [['rpc', args]] });
    return Promise.resolve({ data: [], error: null });
  }
}

const op = (a: Abfrage, name: string) => a.ops.filter((o) => o[0] === name);
const hat = (a: Abfrage, name: string, ...args: unknown[]) =>
  op(a, name).some((o) => JSON.stringify(o.slice(1, 1 + args.length)) === JSON.stringify(args));

// ---------------------------------------------------------------------------------------------------------
// Daten
// ---------------------------------------------------------------------------------------------------------

const PLATZ = '0c000000-0000-4000-8000-000000000001';
const id = (n: number) => `0e200000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ansatz = (n: number, typ: string, tag: string, status = 'abgeschlossen'): Zeile => ({
  id: id(n),
  platz_id: PLATZ,
  typ,
  status,
  begonnen_am: `${tag}T08:00:00.000Z`,
  storniert_am: null,
});

/** Neuansatz 1.1., Nachfüllen 3.1., Neuansatz 5.1., Nachfüllen 7.1., pH-Korrektur 8.1. (laufend) am selben Platz */
const ANSAETZE: Zeile[] = [
  ansatz(1, 'neuansatz', '2027-01-01'),
  ansatz(2, 'nachfuellen', '2027-01-03'),
  ansatz(3, 'neuansatz', '2027-01-05'),
  ansatz(4, 'nachfuellen', '2027-01-07'),
  ansatz(5, 'ph_korrektur', '2027-01-08', 'laufend'),
];

function tabellen(): Record<string, Zeile[]> {
  const t: Record<string, Zeile[]> = {};
  for (const teil of BUENDEL_TEILE) t[teil.tabelle ?? teil.name] ??= [];
  t['einstellung'] = [
    {
      id: '0a500000-0000-4000-8000-000000000001',
      push_zeit: '07:00:00',
      zeitzone: ZONE,
      email_rueckfall: false,
      vorlauf_n: 2,
      feste_kalibriertermine: [],
    },
  ];
  t['naehrloesungsansatz'] = ANSAETZE.map((z) => ({ ...z }));
  // 1500 Messungen: zwei Seiten zu 1000
  t['messung'] = Array.from({ length: 1500 }, (_, i) => ({
    id: `0e100000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    platz_id: PLATZ,
    gilt_ab: '2027-01-10T08:00:00.000Z',
    storniert_am: null,
  }));
  t['ereignis'] = [
    {
      id: id(101),
      typ: 'stromausfall',
      platz_id: null,
      storniert_am: null,
      gilt_ab: '2027-01-12T05:00:00.000Z',
    },
    {
      id: id(102),
      typ: 'kurzpruefung',
      platz_id: PLATZ,
      storniert_am: null,
      gilt_ab: '2027-01-11T08:00:00.000Z',
    },
    {
      id: id(103),
      typ: 'sonde_gereinigt',
      platz_id: null,
      storniert_am: null,
      gilt_ab: '2027-01-11T08:00:00.000Z',
    },
    { id: id(104), typ: 'keimung', platz_id: null, storniert_am: null, gilt_ab: '2027-01-11T08:00:00.000Z' },
  ];
  return t;
}

const datenMit = (db: FakeDb) => supabaseDaten(db as unknown as Parameters<typeof supabaseDaten>[0]);

// ---------------------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'UC8-AK10 daten.ts liest jeden Teil aus AUFGABEN_TEILE mit Tabelle, Spalten, Filtern, Typen und Fenster aus BUENDEL_TEILE, seitenweise zu 1000',
  async () => {
    gleich(SEITE, 1000, 'SEITE');
    const db = new FakeDb(tabellen());
    const teile = await datenMit(db).teile(STICHTAG);
    for (const name of AUFGABEN_TEILE) {
      const teil = BUENDEL_TEILE.find((t) => t.name === name);
      if (!teil) throw new Error(`${name} fehlt in BUENDEL_TEILE`);
      wahr(Array.isArray(teile[name]), `Teil ${name} geladen`);
      const tabelle = teil.tabelle ?? teil.name;
      const passend = db.abfragen.filter(
        (a) =>
          a.tabelle === tabelle &&
          hat(a, 'select', teil.spalten) &&
          (teil.typen === undefined
            ? op(a, 'in').every((o) => o[1] !== 'typ')
            : hat(a, 'in', 'typ', teil.typen)),
      );
      wahr(passend.length > 0, `${name}: Abfrage auf ${tabelle} mit Spalten ${teil.spalten} fehlt`);
      for (const a of passend) {
        gleich(hat(a, 'is', 'storniert_am', null), teil.ohneStorno === true, `${name}: ohne Storno`);
        gleich(hat(a, 'is', 'gueltig_bis', null), teil.gueltig === true, `${name}: gültige Fassung`);
        if (teil.fensterTage !== undefined)
          wahr(
            hat(a, 'gte', 'gilt_ab', fensterBeginn(STICHTAG, teil.fensterTage, ZONE)),
            `${name}: Fenster ${teil.fensterTage} Tage`,
          );
        gleich(
          op(a, 'order').map((o) => o[1]),
          [...teil.ordnung],
          `${name}: Ordnung`,
        );
        gleich(
          op(a, 'order').every((o) => JSON.stringify(o[2] ?? { ascending: true }).includes('true')),
          true,
          `${name}: aufsteigend`,
        );
      }
      gleich(
        op(passend[0] as Abfrage, 'range')[0]?.slice(1),
        [0, SEITE - 1],
        `${name}: erste Seite 0 bis 999`,
      );
    }
    // Seiten: messung mit 1500 Zeilen in zwei Abfragen
    const messung = db.abfragen.filter((a) => a.tabelle === 'messung' && op(a, 'range').length > 0);
    gleich(
      messung.map((a) => op(a, 'range')[0]?.slice(1)),
      [
        [0, 999],
        [1000, 1999],
      ],
      'Seiten von messung',
    );
    gleich(teile['messung']?.length, 1500, 'alle Messungen');
  },
);

Deno.test(
  'UC8-AK10 ereignis_platz enthält den Typ stromausfall; naehrloesungsansatz nach teileKuerzen gleich wie im Bündel',
  async () => {
    const teilPlatz = BUENDEL_TEILE.find((t) => t.name === 'ereignis_platz');
    wahr(
      teilPlatz?.typen?.includes('stromausfall') === true,
      'BUENDEL_TEILE: ereignis_platz mit stromausfall',
    );
    const db = new FakeDb(tabellen());
    const teile = await datenMit(db).teile(STICHTAG);
    gleich(
      (teile['ereignis_platz'] as Zeile[]).map((z) => z['typ']).sort(),
      ['kurzpruefung', 'stromausfall'],
      'ereignis_platz nach Typen',
    );
    gleich(
      (teile['ereignis'] as Zeile[]).map((z) => z['typ']),
      ['sonde_gereinigt'],
      'ereignis (Gerät) nach Typen',
    );
    const nachId = (l: readonly unknown[] | undefined) =>
      [...((l ?? []) as Zeile[])].map((z) => String(z['id'])).sort();
    const erwartet = teileKuerzen({ naehrloesungsansatz: ANSAETZE.map((z) => ({ ...z })) });
    gleich(
      nachId(teile['naehrloesungsansatz']),
      nachId(erwartet['naehrloesungsansatz']),
      'gleich wie teileKuerzen',
    );
    // Kürzung wirkt: alter Neuansatz 1.1. und Nachfüllen 3.1. vor dem letzten Neuansatz fallen weg
    gleich(nachId(teile['naehrloesungsansatz']), [id(3), id(4), id(5)], 'gekürzte Ansätze');
  },
);

Deno.test(
  'TP5 laufendeTimer fragt nur laufende Ansätze ohne Storno mit von < timer_ende ≤ bis ab',
  async () => {
    const db = new FakeDb(tabellen());
    const von = new Date('2027-01-20T09:45:00.000Z');
    const bis = new Date('2027-01-20T10:00:00.000Z');
    await datenMit(db).laufendeTimer(von, bis);
    const iso = (w: unknown) => {
      const d = w instanceof Date ? w : new Date(String(w));
      return Number.isNaN(d.getTime()) ? String(w) : d.toISOString();
    };
    const a = db.abfragen.find(
      (x) => x.tabelle === 'naehrloesungsansatz' && hat(x, 'eq', 'status', 'laufend'),
    );
    if (!a)
      throw new Error(
        `keine Abfrage auf naehrloesungsansatz mit status laufend: ${JSON.stringify(db.abfragen)}`,
      );
    wahr(hat(a, 'is', 'storniert_am', null), 'ohne Storno');
    wahr(
      op(a, 'gt').some((o) => o[1] === 'timer_ende' && iso(o[2]) === von.toISOString()),
      'timer_ende > von',
    );
    wahr(
      op(a, 'lte').some((o) => o[1] === 'timer_ende' && iso(o[2]) === bis.toISOString()),
      'timer_ende ≤ bis',
    );
  },
);
