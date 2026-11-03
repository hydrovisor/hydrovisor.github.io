// Migrationen nach hydrovisor-dev über die Management-API (Entscheid 0006), aufgerufen von dev-migration.yml.
// Die CLI erreicht die Datenbank direkt nur über IPv6, das GitHub-Runner nicht haben; die API läuft über HTTPS.
// Jede noch nicht eingetragene Datei aus supabase/migrations läuft in einer Transaktion zusammen mit ihrem
// Eintrag in supabase_migrations.schema_migrations (wie die CLI). Aufruf: node scripts/dev-migration.mjs [--trocken]
import { readdir, readFile } from 'node:fs/promises';

const DEV = 'jalvmzgvxvidgmoxuglp';
const projekt = process.env.DEV_PROJEKT;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const trocken = process.argv.includes('--trocken');

if (projekt !== DEV) throw new Error(`Ziel ist nicht hydrovisor-dev: ${projekt}`);
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN fehlt');

async function sql(query) {
  const antwort = await fetch(`https://api.supabase.com/v1/projects/${DEV}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await antwort.text();
  if (!antwort.ok) throw new Error(`Management-API ${antwort.status}: ${text}`);
  return text ? JSON.parse(text) : [];
}

const TAG = '$hv_migration$';
const literal = (wert) => {
  if (wert.includes(TAG)) throw new Error(`Text enthält ${TAG}`);
  return `${TAG}${wert}${TAG}`;
};

const dateien = (await readdir('supabase/migrations')).filter((d) => /^\d{14}_.+\.sql$/.test(d)).sort();

await sql(`create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);`);
const eingetragen = new Set(
  (await sql('select version from supabase_migrations.schema_migrations')).map((z) => z.version),
);
const offen = dateien.filter((d) => !eingetragen.has(d.slice(0, 14)));

console.log(`Eingetragen: ${eingetragen.size}, offen: ${offen.length}`);
for (const datei of offen) console.log(`${trocken ? 'würde einspielen' : 'spiele ein'}: ${datei}`);
if (trocken) process.exit(0);

for (const datei of offen) {
  const inhalt = await readFile(`supabase/migrations/${datei}`, 'utf8');
  const version = datei.slice(0, 14);
  const name = datei.slice(15, -4);
  await sql(`begin;
${inhalt}
;
insert into supabase_migrations.schema_migrations (version, statements, name)
values (${literal(version)}, array[${literal(inhalt)}], ${literal(name)});
commit;`);
  console.log(`eingespielt: ${datei}`);
}
