// Wiederherstellungsprobe (I0-11, Issue #16, Plan 16 «Datenfluss»; Konzept 11.7, 13.5 M0).
// Lädt einen Stand aus hydrovisor/hydrovisor-backup, entschlüsselt ihn im Speicher, prüft das Storage-Manifest und
// spielt die Daten in EINER Transaktion ein, die immer mit HV_PROBE abbricht und deshalb zurückrollt. Das Ziel bleibt
// unverändert; der Bericht enthält nur Tabellennamen, Zahlen, Storage-Ergebnis und Migrationsstand.
//
//   node scripts/wiederherstellungsprobe.mjs [--stand backup-JJJJ-MM-TT] [--ziel dev|lokal] [--identitaet <datei>]
//                                            [--archiv <datei.age>]
//
// --ziel dev (Standard, nur Tim): verlangt eine Konsole und fragt verdeckt nach dem privaten age-Schlüssel und dem
//   Access-Token von hydrovisor-dev (Referenz fest wie in dev-migration.mjs). --identitaet ist dort nicht erlaubt.
// --ziel lokal (Lead, Testschlüssel): DB_URL aus «supabase status -o env», nur 127.0.0.1 oder localhost.
import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { Decrypter } from 'age-encryption';
import postgres from 'postgres';
import {
  berichtMarkdown,
  dumpBereinigen,
  manifestPruefen,
  meldungKuerzen,
  probeErgebnisLesen,
  probeSql,
  tarLesen,
  vergleichen,
  zaehlungLesen,
} from './backup-regeln.mjs';

const DEV = 'jalvmzgvxvidgmoxuglp';
const BACKUP_REPO = 'hydrovisor/hydrovisor-backup';

function argument(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const ziel = argument('--ziel') ?? 'dev';
const standArg = argument('--stand');
const identitaetDatei = argument('--identitaet');
const archivDatei = argument('--archiv');

if (ziel !== 'dev' && ziel !== 'lokal') throw new Error(`--ziel nur dev oder lokal, nicht ${ziel}`);
if (standArg && !/^backup-\d{4}-\d{2}-\d{2}$/.test(standArg))
  throw new Error(`--stand ungültig: ${standArg}`);
if (ziel === 'dev') {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Abbruch: Die Probe nach hydrovisor-dev läuft nur in einer eigenen Konsole.');
    process.exit(1);
  }
  if (identitaetDatei) throw new Error('--identitaet nur mit --ziel lokal (Testschlüssel)');
}

function befehl(programm, args) {
  return execFileSync(programm, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });
}

/** Eingefügte Geheimnisse nicht in der Zwischenablage lassen (Windows; den Verlauf mit Win+V leert Tim selbst) */
function zwischenablageLeeren() {
  if (process.platform !== 'win32') return;
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', "Set-Clipboard -Value ' '"], {
      stdio: 'ignore',
    });
  } catch {
    // ohne PowerShell bleibt die Zwischenablage, wie sie ist
  }
}

/**
 * Zustand des Ziels als Nachweis, dass die Probe nichts festgeschrieben hat: Zeilen je Basistabelle in public,
 * abgeschaltete eigene Trigger, aufschiebbare Fremdschlüssel (Prüfer Fachlogik und Sicherheit, Runde 1).
 */
const ZUSTAND_SQL = `select json_build_object(
  'zeilen', (select json_object_agg(c.relname,
      (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p')),
  'trigger_aus', (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relnamespace = 'public'::regnamespace and not t.tgisinternal and t.tgenabled = 'D'),
  'aufschiebbar', (select count(*) from pg_constraint
    where connamespace = 'public'::regnamespace and contype = 'f' and condeferrable),
  'kanarie', to_regclass('public.hv_probe_kanarie')::text
)::text as zustand`;

async function zustand(ausfuehrer) {
  const [zeile] = await ausfuehrer.abfrage(ZUSTAND_SQL);
  const roh = JSON.parse(String(zeile.zustand));
  const zeilen = Object.fromEntries(Object.entries(roh.zeilen ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify({ ...roh, zeilen });
}

/** Verdeckte Eingabe ohne Echo (Einfügen erlaubt); Ctrl+C bricht ab */
// Zwischenablage lesen für Ctrl-V in der verdeckten Eingabe (Windows); sonst leer.
function zwischenablageLesen() {
  if (process.platform !== 'win32') return '';
  try {
    return execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function verdeckt(frage) {
  return new Promise((aufloesen) => {
    process.stdout.write(frage);
    const ein = process.stdin;
    let wert = '';
    ein.setRawMode(true);
    ein.resume();
    ein.setEncoding('utf8');
    const lesen = (teil) => {
      for (const z of teil) {
        if (z === '\r' || z === '\n') {
          ein.setRawMode(false);
          ein.pause();
          ein.off('data', lesen);
          process.stdout.write('\n');
          zwischenablageLeeren();
          aufloesen(wert.trim());
          return;
        }
        if (z === '\u0003') {
          process.stdout.write('\nAbgebrochen.\n');
          process.exit(1);
        }
        if (z === '\u007f' || z === '\b') {
          if (wert) process.stdout.write('\b \b');
          wert = wert.slice(0, -1);
        } else if (z === '\u0016') {
          // Ctrl-V kommt im Raw-Modus als Steuerzeichen an; die Zwischenablage selbst lesen (nur Windows)
          const eingefuegt = zwischenablageLesen();
          wert += eingefuegt;
          process.stdout.write('*'.repeat(eingefuegt.length));
        } else if (z >= ' ') {
          wert += z;
          process.stdout.write('*');
        }
      }
    };
    ein.on('data', lesen);
  });
}

// ---------------------------------------------------------------------
// Ausführer: dev über die Management-API, lokal über postgres (nur Loopback)
// ---------------------------------------------------------------------
function ausfuehrerDev(token) {
  return {
    async abfrage(query) {
      const antwort = await fetch(`https://api.supabase.com/v1/projects/${DEV}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const text = await antwort.text();
      if (!antwort.ok) {
        let meldung = text;
        try {
          meldung = String(JSON.parse(text).message ?? text);
        } catch {
          // Rohtext
        }
        throw new Error(`Management-API ${antwort.status}: ${meldung}`);
      }
      return text ? JSON.parse(text) : [];
    },
    schliessen: async () => undefined,
  };
}

function ausfuehrerLokal() {
  let url = process.env.DB_URL;
  if (!url) {
    const zeile = befehl('npx', ['--yes', 'supabase@3.0.0', 'status', '-o', 'env'])
      .split('\n')
      .find((z) => z.startsWith('DB_URL='));
    if (!zeile) throw new Error('DB_URL fehlt in «supabase status -o env»; läuft «supabase start»?');
    url = zeile.slice('DB_URL='.length).replace(/^"|"$/g, '').trim();
  }
  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost')
    throw new Error(`Ziel lokal nur 127.0.0.1 oder localhost, nicht ${host}`);
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  return {
    async abfrage(query) {
      try {
        return await sql.unsafe(query);
      } catch (e) {
        await sql.unsafe('rollback').catch(() => undefined);
        throw e;
      }
    },
    schliessen: () => sql.end(),
  };
}

/** Erste Zeile einer Fehlermeldung, Werte geschwärzt */
function kurzeMeldung(e) {
  return meldungKuerzen(e instanceof Error ? e.message : String(e));
}

// ---------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------
const temp = await mkdtemp(join(tmpdir(), 'hv-probe-'));
let ausfuehrer;
let bestanden = false;
try {
  // 1. Stand holen
  let stand = standArg;
  let archiv;
  if (archivDatei) {
    archiv = new Uint8Array(await readFile(archivDatei));
    stand ??= (/backup-\d{4}-\d{2}-\d{2}/.exec(archivDatei) ?? ['lokal'])[0];
  } else {
    stand ??= JSON.parse(
      befehl('gh', ['release', 'view', '--repo', BACKUP_REPO, '--json', 'tagName']),
    ).tagName;
    if (!/^backup-\d{4}-\d{2}-\d{2}$/.test(stand)) throw new Error(`Unerwarteter Stand: ${stand}`);
    console.log(`Lade ${stand} aus ${BACKUP_REPO} ...`);
    befehl('gh', [
      'release',
      'download',
      stand,
      '--repo',
      BACKUP_REPO,
      '--pattern',
      '*.tar.gz.age',
      '--dir',
      temp,
    ]);
    const datei = (await readdir(temp)).find((d) => d.endsWith('.tar.gz.age'));
    if (!datei) throw new Error(`Kein verschlüsseltes Archiv in ${stand}`);
    archiv = new Uint8Array(await readFile(join(temp, datei)));
  }
  console.log(`Stand ${stand}, verschlüsselt ${archiv.length} Bytes`);

  // 2. Entschlüsseln im Speicher
  const identitaet = identitaetDatei
    ? (await readFile(identitaetDatei, 'utf8')).split(/\r?\n/).find((z) => z.startsWith('AGE-SECRET-KEY-'))
    : await verdeckt('Privaten age-Schlüssel (AGE-SECRET-KEY-…) einfügen, dann Enter: ');
  if (!identitaet || !identitaet.startsWith('AGE-SECRET-KEY-'))
    throw new Error('Kein age-Schlüssel (AGE-SECRET-KEY-…)');
  const entschluessler = new Decrypter();
  entschluessler.addIdentity(identitaet);
  const tar = gunzipSync(await entschluessler.decrypt(archiv, 'uint8array'));
  const inhalt = tarLesen(new Uint8Array(tar.buffer, tar.byteOffset, tar.length));
  const datei = (name) => inhalt.get(`sicherung/${name}`);
  const textAus = (name) => {
    const d = datei(name);
    if (!d) throw new Error(`sicherung/${name} fehlt im Stand`);
    return Buffer.from(d).toString('utf8');
  };

  // 3. Storage-Manifest
  let storage = null;
  const manifest = datei('storage/manifest.csv');
  if (manifest) {
    const fotos = new Map();
    for (const [name, wert] of inhalt)
      if (name.startsWith('sicherung/storage/saattueten/'))
        fotos.set(name.slice('sicherung/storage/saattueten/'.length), wert);
    const text = Buffer.from(manifest).toString('utf8');
    const pruefung = manifestPruefen(text, fotos);
    storage = { dateien: text.split(/\r?\n/).filter((z) => z.trim()).length, ok: pruefung.ok };
    console.log(
      `Storage: ${storage.dateien} Dateien im Manifest, fehlend ${pruefung.fehlend.length}, abweichend ${pruefung.abweichend.length}`,
    );
  } else {
    console.log('Storage: im Stand nicht gesichert');
  }

  const erwartet = zaehlungLesen(textAus('zaehlung.csv'));
  const migrationenBackup = textAus('migrationen.txt')
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter(Boolean);
  const daten = dumpBereinigen(textAus('daten.sql'));

  // 4. Ziel
  if (ziel === 'dev') {
    const token = await verdeckt('Access-Token für hydrovisor-dev (sbp_…) einfügen, dann Enter: ');
    if (!token.startsWith('sbp_')) throw new Error('Access-Token beginnt nicht mit sbp_');
    ausfuehrer = ausfuehrerDev(token);
  } else {
    ausfuehrer = ausfuehrerLokal();
  }

  // 5. Migrationsstand
  const migrationenZiel = (
    await ausfuehrer.abfrage('select version from supabase_migrations.schema_migrations order by version')
  ).map((z) => String(z.version));
  const nurBackup = migrationenBackup.filter((v) => !migrationenZiel.includes(v));
  const nurDev = migrationenZiel.filter((v) => !migrationenBackup.includes(v));
  const migrationen = { gleich: nurBackup.length === 0 && nurDev.length === 0, nurBackup, nurDev };
  if (nurDev.length) console.log(`Warnung: ${nurDev.length} Migrationen nur im Ziel (${nurDev.join(', ')})`);
  if (nurBackup.length) {
    console.log(`Abbruch: Im Ziel fehlen Migrationen des Stands: ${nurBackup.join(', ')}`);
    console.log('Zuerst dev-migration.yml mit main laufen lassen (startet der Lead).');
    process.exitCode = 1;
  } else {
    // 6. Probe in einer Transaktion, die immer zurückrollt
    const tabellen = (
      await ausfuehrer.abfrage(`select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p') order by c.relname`)
    ).map((z) => String(z.name));
    const sql = probeSql(daten, tabellen);
    console.log(
      `Probe: ${erwartet.size} Tabellen im Stand, ${tabellen.length} im Ziel, ${sql.length} Zeichen SQL`,
    );
    // Kanarienlauf über denselben Weg: Bildet der Ausführer keine Transaktion, bliebe die Tabelle bestehen
    try {
      await ausfuehrer.abfrage(
        `create table public.hv_probe_kanarie (); do $hv$ begin raise exception '${'HV_PROBE'} {}'; end $hv$;`,
      );
    } catch {
      // erwartet: HV_PROBE
    }
    const [kanarie] = await ausfuehrer.abfrage(`select to_regclass('public.hv_probe_kanarie')::text as k`);
    if (kanarie?.k) {
      await ausfuehrer.abfrage('drop table public.hv_probe_kanarie');
      throw new Error(
        'Der Ausführer bildet keine Transaktion (Kanarie blieb bestehen); Probe nicht gestartet',
      );
    }
    const vorher = await zustand(ausfuehrer);

    let ist = null;
    let ohneAbbruch = false;
    try {
      await ausfuehrer.abfrage(sql);
      ohneAbbruch = true;
    } catch (e) {
      ist = probeErgebnisLesen(e instanceof Error ? e.message : String(e));
      if (!ist) console.log(`Probe gescheitert: ${kurzeMeldung(e)}`);
    }
    const unveraendert = !ohneAbbruch && (await zustand(ausfuehrer)) === vorher;
    if (!unveraendert) {
      console.log('ACHTUNG: Das Ziel ist möglicherweise verändert (Zeilen, Trigger oder Fremdschlüssel).');
      console.log('Melde das sofort dem Lead; er prüft hydrovisor-dev und setzt es zurück.');
      ist = null;
    }
    if (ist) {
      const vergleich = vergleichen(erwartet, ist);
      const bericht = `${berichtMarkdown(stand, vergleich, storage, migrationen)}\nZiel nach der Probe unverändert: ja (Zeilen je Tabelle, Trigger, Fremdschlüssel)\n`;
      console.log(`\n${bericht}`);
      await mkdir('reports', { recursive: true });
      const pfad = join('reports', `wiederherstellungsprobe-${stand}.md`);
      await writeFile(pfad, bericht);
      console.log(`Bericht: ${pfad}`);
      bestanden = /\| Urteil \| bestanden \|/.test(bericht);
    }
    process.exitCode = bestanden ? 0 : 1;
  }
} finally {
  await ausfuehrer?.schliessen();
  await rm(temp, { recursive: true, force: true });
}
