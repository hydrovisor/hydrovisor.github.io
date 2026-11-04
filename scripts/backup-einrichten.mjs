// Einrichtung des Backups (I0-11, Issue #16, Plan 16 Handgriff 3): Tim startet das Skript einmal in seiner eigenen
// Konsole, nachdem deploy.yml die Migration 20261104150000_backup_rollen.sql in der Produktion ausgeliefert hat.
//   1. Zufallspasswort (32 Bytes) und daraus ein SCRAM-Hash; die SQL-Zeile «alter role backup_leser with login
//      password '<SCRAM-Hash>'» kommt in die Zwischenablage, Tim führt sie im SQL-Editor der Produktion aus.
//   2. Session-Pooler-Host (Supabase › Connect), Verbindung als backup_leser prüfen, SUPABASE_DB_URL_BACKUP setzen.
//   3. Legacy JWT Secret der Produktion verdeckt abfragen, Storage-Token (Rolle backup_speicher_leser, Ablauf
//      30.6.2027) signieren, gegen den Storage prüfen und SUPABASE_STORAGE_TOKEN_BACKUP setzen. Ohne Geheimnis
//      läuft das Backup ohne Fotos weiter (Warnung in backup.yml).
// Secrets gehen über die Standardeingabe an «gh secret set --env backup». Kein Wert erscheint auf der Konsole oder in
// einer Datei; beide lassen sich jederzeit mit diesem Skript neu setzen, deshalb gehören sie nicht in den
// Passwortmanager. Bricht ohne Konsole ab (kein Agent, kein «echo ja |»).
// Aufruf im Ordner des Repositorys: node scripts/backup-einrichten.mjs
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import postgres from 'postgres';
import { scramVerifier, speicherToken } from './backup-regeln.mjs';

const ABLAUF = new Date('2027-06-30T23:59:59+02:00');

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Abbruch: Das Skript läuft nur in einer eigenen Konsole.');
  process.exit(1);
}

function befehl(programm, args, eingabe) {
  return execFileSync(programm, args, {
    encoding: 'utf8',
    input: eingabe,
    shell: process.platform === 'win32' && programm !== 'powershell.exe',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function zwischenablage(text) {
  befehl(
    'powershell.exe',
    ['-NoProfile', '-Command', 'Set-Clipboard -Value ([Console]::In.ReadToEnd())'],
    text,
  );
}

async function frage(text) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(text)).trim();
  } finally {
    rl.close();
  }
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

function verdeckt(text) {
  return new Promise((aufloesen) => {
    process.stdout.write(text);
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
          aufloesen(wert.trim());
          return;
        }
        if (z === '\u0003') {
          zwischenablage(' ');
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

function secretSetzen(name, wert) {
  befehl('gh', ['secret', 'set', name, '--env', 'backup'], wert);
  console.log(`${name} in der Umgebung backup gesetzt.`);
}

if ((await frage('Backup für die Produktion einrichten? Zum Bestätigen «ja» eingeben: ')) !== 'ja') {
  console.log('Abgebrochen.');
  process.exit(1);
}

const ref = befehl('gh', ['variable', 'get', 'SUPABASE_PROJECT_REF_PROD']);
const supabaseUrl = befehl('gh', ['variable', 'get', 'VITE_SUPABASE_URL']).replace(/\/+$/, '');
const apikey = befehl('gh', ['variable', 'get', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
if (!/^[a-z]{20}$/.test(ref))
  throw new Error('Repository-Variable SUPABASE_PROJECT_REF_PROD fehlt oder ist ungültig');
if (ref === 'jalvmzgvxvidgmoxuglp') throw new Error('SUPABASE_PROJECT_REF_PROD zeigt auf hydrovisor-dev');

try {
  // 1. Passwort für backup_leser: nur der SCRAM-Hash verlässt das Skript
  const passwort = randomBytes(32).toString('base64url');
  const verifier = scramVerifier(passwort, randomBytes(16), 4096);
  zwischenablage(`alter role backup_leser with login password '${verifier}';`);
  console.log('\nSchritt 1 von 3: Die SQL-Zeile für backup_leser liegt in der Zwischenablage.');
  console.log(
    'Öffne im Supabase-Dashboard das Produktionsprojekt › SQL Editor, füge sie ein und führe sie aus.',
  );
  console.log('Erwartet: «Success. No rows returned».');
  await frage('Danach Enter drücken: ');
  zwischenablage(' ');

  // 2. Verbindung über den Session-Pooler (GitHub-Runner haben kein IPv6 für die direkte Verbindung)
  console.log('\nSchritt 2 von 3: Session-Pooler-Host.');
  console.log('Im Dashboard der Produktion oben auf «Connect» › «Session pooler»; kopiere den Host');
  console.log('(endet auf .pooler.supabase.com) oder die ganze Verbindungszeile.');
  const eingabe = await frage('Host oder Verbindungszeile einfügen, dann Enter: ');
  const host = (/@([^:/?\s]+)/.exec(eingabe)?.[1] ?? eingabe).trim();
  if (!/^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(host)) throw new Error(`Kein Pooler-Host: ${host}`);
  const dbUrl = `postgresql://backup_leser.${ref}:${passwort}@${host}:5432/postgres?sslmode=require`;
  const sql = postgres(dbUrl, { max: 1, prepare: false, connect_timeout: 20, onnotice: () => undefined });
  try {
    const [zeile] =
      await sql`select current_user as rolle, rolbypassrls as bypass from pg_roles where rolname = current_user`;
    if (zeile?.rolle !== 'backup_leser')
      throw new Error(`Angemeldet als ${zeile?.rolle}, nicht backup_leser`);
    console.log(
      `Verbindung geprüft: backup_leser, Modus ${zeile.bypass ? 'BYPASSRLS' : 'Zeilensicherheit (backup_lesen)'}.`,
    );
  } catch (e) {
    throw new Error(
      `Anmeldung als backup_leser gescheitert (SQL-Zeile ausgeführt?): ${e instanceof Error ? e.message : e}`,
      { cause: e },
    );
  } finally {
    await sql.end();
  }
  secretSetzen('SUPABASE_DB_URL_BACKUP', dbUrl);

  // 3. Storage-Token (nur Bucket saattueten)
  console.log('\nSchritt 3 von 3: Storage-Token für die Tütenfotos.');
  console.log(
    'Im Dashboard der Produktion: Project Settings › JWT Keys › Reiter «Legacy JWT Secret» › «Reveal», kopieren.',
  );
  console.log(
    'Gibt es dort kein Legacy JWT Secret, drück nur Enter: Dann sichert das Backup vorerst keine Fotos.',
  );
  const geheimnis = await verdeckt('Legacy JWT Secret einfügen (Eingabe bleibt verdeckt), dann Enter: ');
  if (!geheimnis) {
    console.log('Kein Geheimnis: Storage-Token nicht gesetzt. Das Datenbank-Backup läuft trotzdem.');
  } else {
    const token = speicherToken(geheimnis, new Date(), ABLAUF);
    const antwort = await fetch(`${supabaseUrl}/storage/v1/object/list/saattueten`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1 }),
    });
    if (!antwort.ok)
      throw new Error(`Storage lehnt den Token ab (HTTP ${antwort.status}); stimmt das Legacy JWT Secret?`);
    console.log('Storage-Token geprüft (Liste des Buckets saattueten gelesen).');
    secretSetzen('SUPABASE_STORAGE_TOKEN_BACKUP', token);
  }
  console.log(
    '\nFertig. Die Zwischenablage ist geleert. Melde dem Lead «Backup eingerichtet»; er startet backup.yml.',
  );
} finally {
  zwischenablage(' ');
}
