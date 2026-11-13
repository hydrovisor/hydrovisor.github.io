// npm run demo -- --laden | --loeschen [--ziel lokal|dev] (Plan 15, Konzept 8.5, 06_tests.md Abschnitt 10).
// lokal: DB_URL aus «supabase status -o env», nur 127.0.0.1 oder localhost; dev: nur in dev-seed.yml
// (Management-API, Ziel fest hydrovisor-dev). Ein anderes Ziel, auch die Produktion, bricht ab.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZEITZONE } from '../src/domain/zeit.ts';
import { DEV_PROJEKT } from './seed/ausfuehren.ts';
import { benoetigteSorten, demoSkript, loeschSkript, type Fixture, type Zeile } from './demo/regeln.ts';

const argumente = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const i = argumente.indexOf(name);
  return i >= 0 ? argumente[i + 1] : undefined;
};
const ziel = option('--ziel') ?? 'lokal';
const laden = argumente.includes('--laden');
const loeschen = argumente.includes('--loeschen');
const repository = fileURLToPath(new URL('..', import.meta.url));
export const FIXTURES = join(repository, 'tests', 'fixtures', 'demo');

function befehl(programm: string, args: string[], erben = false): string {
  return execFileSync(programm, args, {
    cwd: repository,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: erben ? 'inherit' : 'pipe',
  });
}

/** Fixtures in der Reihenfolge der Dateinamen (s1 … s9, y) */
export function fixturesLesen(ordner = FIXTURES): Fixture[] {
  return readdirSync(ordner)
    .filter((d) => d.endsWith('.json'))
    .sort()
    .map((d) => ({
      name: d,
      zeilen: (JSON.parse(readFileSync(join(ordner, d), 'utf8')) as { zeilen: Zeile[] }).zeilen,
    }));
}

type Abfrage = (skript: string) => Promise<unknown[]>;

/** Zeilen der letzten Anweisung (postgres.js liefert bei mehreren Anweisungen eine Liste von Ergebnissen) */
function letzte(ergebnis: unknown): unknown[] {
  if (!Array.isArray(ergebnis)) return [];
  return ergebnis.some(Array.isArray) ? ((ergebnis.findLast(Array.isArray) as unknown[]) ?? []) : ergebnis;
}

async function abfrageLokal(): Promise<{ abfrage: Abfrage; schliessen: () => Promise<void> }> {
  let url = process.env['DB_URL'];
  if (!url) {
    const env = befehl('npx', ['--yes', 'supabase@3.0.0', 'status', '-o', 'env']);
    const zeile = env.split('\n').find((z) => z.startsWith('DB_URL='));
    if (!zeile) throw new Error('DB_URL fehlt in «supabase status -o env»; läuft «supabase start»?');
    url = zeile.slice('DB_URL='.length).replace(/^"|"$/g, '').trim();
  }
  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost')
    throw new Error(`Ziel lokal nur 127.0.0.1 oder localhost, nicht ${host}`);
  const { default: postgres } = await import('postgres');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  return {
    async abfrage(skript) {
      try {
        return letzte(await sql.unsafe(skript));
      } catch (e) {
        await sql.unsafe('rollback').catch(() => undefined);
        throw e;
      }
    },
    schliessen: () => sql.end(),
  };
}

function abfrageDev(): { abfrage: Abfrage; schliessen: () => Promise<void> } {
  if (process.env['DEV_PROJEKT'] !== DEV_PROJEKT)
    throw new Error(`Ziel dev nur hydrovisor-dev (DEV_PROJEKT = ${DEV_PROJEKT})`);
  const token = process.env['SUPABASE_ACCESS_TOKEN'];
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN fehlt');
  return {
    async abfrage(skript) {
      const antwort = await fetch(`https://api.supabase.com/v1/projects/${DEV_PROJEKT}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: skript }),
      });
      const text = await antwort.text();
      if (!antwort.ok) throw new Error(`Management-API ${antwort.status}: ${text}`);
      return letzte(text ? JSON.parse(text) : []);
    },
    schliessen: async () => undefined,
  };
}

/** aktive Sorten (gueltig_bis is null) unter den verlangten Schlüsseln */
function aktiveSortenSkript(schluessel: string[]): string {
  const liste = schluessel.map((s) => `'${s.replaceAll("'", "''")}'`).join(', ');
  return (
    'select (select count(*)::int from public.sorte where gueltig_bis is null) as aktiv,' +
    ' coalesce((select array_agg(distinct k.sorte_key) from public.sorte s' +
    '   join public.sorte_schluessel k on k.id = s.sorte_id' +
    `   where s.gueltig_bis is null and k.sorte_key in (${liste})), '{}') as vorhanden;`
  );
}

/**
 * Echtes Wissen (W0) sichern (Plan 199, A6): fehlen Sorten der Fixtures und ist das Wissen lokal leer, lädt
 * «npm run seed -- --ziel lokal» das W0 aus der Repository-Wurzel; sonst Abbruch mit den fehlenden Schlüsseln.
 * Vorhandenes Wissen wird nie überschrieben; in dev lädt die Demo nie selbst Wissen.
 */
async function wissenSichern(abfrage: Abfrage, fixtures: Fixture[]): Promise<void> {
  const schluessel = benoetigteSorten(fixtures);
  if (schluessel.length === 0) return;
  const fehlend = async (): Promise<{ aktiv: number; fehlt: string[] }> => {
    const [stand] = (await abfrage(aktiveSortenSkript(schluessel))) as {
      aktiv: number;
      vorhanden: string[];
    }[];
    const vorhanden = new Set(stand?.vorhanden ?? []);
    return { aktiv: stand?.aktiv ?? 0, fehlt: schluessel.filter((s) => !vorhanden.has(s)) };
  };
  let stand = await fehlend();
  if (stand.fehlt.length === 0) return;
  if (stand.aktiv === 0 && ziel === 'lokal') {
    console.log('Wissen leer: lade zuerst das W0 (npm run seed -- --ziel lokal)');
    befehl('npm', ['run', 'seed', '--', '--ziel', 'lokal'], true);
    stand = await fehlend();
    if (stand.fehlt.length === 0) return;
  }
  throw new Error(
    `Demo braucht diese Sorten aus W0, sie fehlen oder sind geschlossen: ${stand.fehlt.join(', ')}. ` +
      (ziel === 'lokal'
        ? 'Zuerst «npm run seed -- --ziel lokal» ausführen.'
        : 'Zuerst W0 scharf laden: gh workflow run dev-seed.yml -f zweig=main -f trockenlauf=false.'),
  );
}

async function hauptprogramm(): Promise<void> {
  if (laden === loeschen) throw new Error('--laden oder --loeschen angeben');
  if (ziel !== 'lokal' && ziel !== 'dev') throw new Error(`--ziel lokal oder dev, nicht ${ziel}`);
  const { abfrage, schliessen } = ziel === 'lokal' ? await abfrageLokal() : abfrageDev();
  try {
    let skript = loeschSkript();
    if (laden) {
      const fixtures = fixturesLesen();
      await wissenSichern(abfrage, fixtures);
      const demo = demoSkript(fixtures, { jetzt: new Date(), zeitzone: ZEITZONE });
      console.log(`${demo.zeilen} Zeilen aus ${FIXTURES}`);
      skript = demo.vollstaendig;
    }
    const [zeile] = (await abfrage(skript)) as { bericht?: unknown }[];
    console.log(
      `Demo ${laden ? 'geladen' : 'gelöscht'} (${ziel}): ${JSON.stringify(zeile?.bericht ?? null)}`,
    );
  } finally {
    await schliessen();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  hauptprogramm().catch((e: unknown) => {
    console.log(`::error::${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  });
}
