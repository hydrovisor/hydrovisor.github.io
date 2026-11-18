// Eigene wiederkehrende Aufgaben in push-taeglich (Issue #249, Plan 249 Testliste EA-AK4 und Lösungsweg 5, A10, A17;
// Konzept R5.1, R5.5, 8.1 Regel 7; UC8-AK10). Läuft mit `deno test --allow-read --allow-env supabase/functions` ohne
// Netz: eine Attrappe des Supabase-Clients (wie daten_test.ts) zeichnet je Abfrage Tabelle und Filter auf und liefert
// Zeilen aus dem Speicher (is, eq, in werden angewandt, range schneidet wie PostgREST).
// Erwartet:
// - daten.ts lädt die Teile aus AUFGABEN_TEILE und AUFGABEN_TEILE_ZUSATZ; der Teil eigene_aufgabe kommt ohne Filter
//   storniert_am, damit stornierte Vorgänger für die Kette über ersetzt_id sichtbar bleiben (A10).
// - Die Push-Rechnung (faelligeAufgaben → nurEcht → titelNachGewicht) zählt eine fällige echte eigene Aufgabe als
//   Routine, eine an der Demo-Anlage nicht.
// Keine Personendaten.
import {
  AUFGABEN_TEILE,
  AUFGABEN_TEILE_ZUSATZ,
  einstellungenAus,
  faelligeAufgaben,
  nurEcht,
  titelNachGewicht,
} from '../../../src/domain/aufgaben.ts';
import { BUENDEL_TEILE } from '../../../src/domain/datenpfad/buendel-teile.ts';
import { supabaseDaten } from './daten.ts';

const ZONE = 'Europe/Zurich';
/** Di 12.1.2027 07:00 Zürich */
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
// Attrappe des Supabase-Clients (wie daten_test.ts)
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
// Daten: Anlage R (echt) und X (demo); Kette an R (Vorgänger storniert, Nachfolger aktiv) und eine Aufgabe an X
// ---------------------------------------------------------------------------------------------------------

const ANLAGE_R = '0a000000-0000-4000-8000-000000000001';
const ANLAGE_X = '0a000000-0000-4000-8000-000000000002';
const VORGAENGER = '0f000000-0000-4000-8000-000000000001';
const NACHFOLGER = '0f000000-0000-4000-8000-000000000002';
const DEMO = '0f000000-0000-4000-8000-000000000003';

const definition = (z: Partial<Zeile> & { id: string }): Zeile => ({
  client_id: z.id,
  anlage_id: ANLAGE_R,
  name: 'Zelt und Luftsteine reinigen',
  intervall_d: 30,
  letzte_erledigung: null,
  erfasst_am: '2027-01-10T08:00:00.000Z',
  app_version: 'test',
  ersetzt_id: null,
  storniert_am: null,
  ...z,
});

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
  t['anlage'] = [
    { id: ANLAGE_R, kuerzel: 'R', name: 'Indoor-Regal', datenart: 'echt', aktiv: true, storniert_am: null },
    { id: ANLAGE_X, kuerzel: 'X', name: 'Demo-Regal', datenart: 'demo', aktiv: true, storniert_am: null },
  ];
  // Vorgänger am 10.1. erfasst, am 11.1. durch den Nachfolger (Intervall 28) ersetzt und storniert
  t['eigene_aufgabe'] = [
    definition({ id: VORGAENGER, storniert_am: '2027-01-11T09:00:00.000Z' }),
    definition({
      id: NACHFOLGER,
      intervall_d: 28,
      ersetzt_id: VORGAENGER,
      erfasst_am: '2027-01-11T09:00:00.000Z',
    }),
    definition({ id: DEMO, anlage_id: ANLAGE_X, name: 'Luftfilter wechseln' }),
  ];
  return t;
}

const datenMit = (db: FakeDb) => supabaseDaten(db as unknown as Parameters<typeof supabaseDaten>[0]);

// ---------------------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------------------

Deno.test(
  'EA-AK4 daten.ts lädt den Teil eigene_aufgabe aus AUFGABEN_TEILE_ZUSATZ ohne Filter storniert_am',
  async () => {
    wahr(AUFGABEN_TEILE_ZUSATZ.includes('eigene_aufgabe'), 'AUFGABEN_TEILE_ZUSATZ enthält eigene_aufgabe');
    wahr(!AUFGABEN_TEILE.includes('eigene_aufgabe'), 'AUFGABEN_TEILE bleibt ohne eigene_aufgabe (A17)');
    const teil = BUENDEL_TEILE.find((t) => t.name === 'eigene_aufgabe');
    if (!teil) throw new Error('eigene_aufgabe fehlt in BUENDEL_TEILE');
    gleich(teil.ohneStorno ?? false, false, 'BUENDEL_TEILE: eigene_aufgabe ohne ohneStorno (A10)');

    const db = new FakeDb(tabellen());
    const teile = await datenMit(db).teile(STICHTAG);
    const abfragen = db.abfragen.filter((a) => a.tabelle === (teil.tabelle ?? teil.name));
    wahr(abfragen.length > 0, 'Abfrage auf eigene_aufgabe fehlt');
    for (const a of abfragen) {
      wahr(hat(a, 'select', teil.spalten), 'eigene_aufgabe: Spalten aus BUENDEL_TEILE');
      gleich(hat(a, 'is', 'storniert_am', null), false, 'eigene_aufgabe: kein Filter storniert_am');
      gleich(
        op(a, 'order').map((o) => o[1]),
        [...teil.ordnung],
        'eigene_aufgabe: Ordnung',
      );
    }
    gleich(
      ((teile['eigene_aufgabe'] ?? []) as Zeile[]).map((z) => String(z['id'])).sort(),
      [VORGAENGER, NACHFOLGER, DEMO].sort(),
      'eigene_aufgabe mit dem stornierten Vorgänger geladen',
    );

    // jeder Teil der beiden Listen wird geladen
    for (const name of [...AUFGABEN_TEILE, ...AUFGABEN_TEILE_ZUSATZ])
      wahr(Array.isArray(teile[name]), `Teil ${name} geladen`);
  },
);

Deno.test(
  'EA-AK4 die Push-Rechnung zählt eine fällige echte eigene Aufgabe als Routine, die Demo-Aufgabe nicht',
  async () => {
    const db = new FakeDb(tabellen());
    const teile = (await datenMit(db).teile(STICHTAG)) as Parameters<typeof faelligeAufgaben>[0];
    const alle = faelligeAufgaben(teile, einstellungenAus(teile), STICHTAG, ZONE);
    const eigene = alle.filter((a) => a.typ === ('eigene_aufgabe' as typeof a.typ));
    // je aktive Definition genau eine Aufgabe; die Kette rechnet ab dem Erfassungstag des Vorgängers (10.1.)
    gleich(
      eigene.map((a) => [a.bezug, a.faelligAm, a.datenart]).sort(),
      [
        [NACHFOLGER, '2027-01-10', 'echt'],
        [DEMO, '2027-01-10', 'demo'],
      ].sort(),
      'eigene Aufgaben in der Push-Rechnung',
    );
    const echt = nurEcht(alle);
    const echteEigene = echt.filter((a) => a.typ === ('eigene_aufgabe' as typeof a.typ));
    gleich(
      echteEigene.map((a) => [a.schluessel, a.gewicht]),
      [[`eigene_aufgabe|${NACHFOLGER}|2027-01-10`, 'routine']],
      'nurEcht: nur die eigene Aufgabe an R, Gewicht Routine',
    );
    gleich(titelNachGewicht(echteEigene), { ausserhalb: 0, wechsel: 0, routine: 1 }, 'Routine im Push-Titel');
    gleich(
      titelNachGewicht(echt).routine,
      titelNachGewicht(echt.filter((a) => !echteEigene.includes(a))).routine + 1,
      'die eigene Aufgabe zählt genau einmal als Routine',
    );
  },
);
