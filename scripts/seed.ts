// npm run seed -- --ziel lokal|dev|produktion [--trocken] [--gesamtfreigabe] [--wurzel <ordner>]
// (03_import_w0.md Abschnitt 8, Plan 10, Entscheid 0007). lokal: DB_URL aus «supabase status -o env»;
// dev: nur in dev-seed.yml (Management-API); produktion: nur in deploy.yml mit SEED_DB_URL.
import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verstossText } from '../src/domain/w0/typen.ts';
import {
  ausfuehrerDev,
  ausfuehrerLokal,
  ausfuehrerProduktion,
  seedLauf,
  type Ausfuehrer,
} from './seed/ausfuehren.ts';
import { berichtMarkdown } from './seed/bericht.ts';
import { dateienLesen } from './seed/dateien.ts';

const argumente = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const i = argumente.indexOf(name);
  return i >= 0 ? argumente[i + 1] : undefined;
};
const ziel = option('--ziel');
const trocken = argumente.includes('--trocken');
const gesamtfreigabe = argumente.includes('--gesamtfreigabe');
const repository = fileURLToPath(new URL('..', import.meta.url));
const wurzel = resolve(option('--wurzel') ?? repository);

function befehl(programm: string, args: string[]): string {
  return execFileSync(programm, args, {
    cwd: repository,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

function commit(): string {
  // dev-seed.yml lädt data/ aus einem Paketzweig: Commit des Laufs und Commit der Daten (8.3, Prüferbefund 5)
  const daten = process.env['SEED_DATEN_SHA'];
  if (process.env['GITHUB_SHA'])
    return daten && daten !== process.env['GITHUB_SHA']
      ? `${process.env['GITHUB_SHA']}+data@${daten}`
      : process.env['GITHUB_SHA'];
  const sha = befehl('git', ['rev-parse', 'HEAD']).trim();
  return befehl('git', ['status', '--porcelain', '--', 'data']).trim() ? `${sha}+lokal` : sha;
}

function lokaleDbUrl(): string {
  if (process.env['DB_URL']) return process.env['DB_URL'];
  const env = befehl('npx', ['--yes', 'supabase@3.0.0', 'status', '-o', 'env']);
  const zeile = env.split('\n').find((z) => z.startsWith('DB_URL='));
  if (!zeile) throw new Error('DB_URL fehlt in «supabase status -o env»; läuft «supabase start»?');
  return zeile.slice('DB_URL='.length).replace(/^"|"$/g, '').trim();
}

function ausfuehrer(): Ausfuehrer {
  switch (ziel) {
    case 'lokal':
      return ausfuehrerLokal(lokaleDbUrl());
    case 'dev':
      return ausfuehrerDev(process.env['SUPABASE_ACCESS_TOKEN'] ?? '');
    case 'produktion': {
      const url = process.env['SEED_DB_URL'];
      if (!url) throw new Error('SEED_DB_URL fehlt');
      return ausfuehrerProduktion(url);
    }
    default:
      throw new Error('--ziel lokal, dev oder produktion angeben');
  }
}

const gelesen = dateienLesen(wurzel);
if (gelesen.verstoesse.length > 0) {
  for (const v of gelesen.verstoesse) console.log(`::error::${verstossText(v)}`);
  process.exit(1);
}
const aus = ausfuehrer();
const sha = commit();
try {
  const bericht = await seedLauf(gelesen.dateien, aus, {
    jetzt: new Date(),
    commit: sha,
    gesamtfreigabe,
    trocken,
  });
  const text = berichtMarkdown(bericht, { ziel: ziel ?? '', commit: sha, trocken });
  console.log(text);
  writeFileSync(resolve(repository, 'seed-bericht.md'), text);
  if (process.env['GITHUB_STEP_SUMMARY']) appendFileSync(process.env['GITHUB_STEP_SUMMARY'], `${text}\n`);
} catch (e) {
  console.log(`::error::${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
} finally {
  await aus.schliessen();
}
