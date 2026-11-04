// Kopie des Buckets saattueten für das nächtliche Backup (I0-11, Issue #16, Plan 16 «backup-storage.mjs»).
// Nur lesend mit dem Token der Rolle backup_speicher_leser: POST /storage/v1/object/list/saattueten und
// GET /storage/v1/object/authenticated/saattueten/<pfad>. Schreibt <ziel>/saattueten/… und <ziel>/manifest.csv.
// Ohne npm-Abhängigkeit, weil backup.yml kein npm ci ausführt. Lädt es weniger Dateien als gelistet, endet es mit Exit 1.
// Aufruf: node scripts/backup-storage.mjs --ziel <ordner> [--mindestens <n>]   Umgebung: STORAGE_TOKEN, SUPABASE_URL, SUPABASE_APIKEY
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { listeAufloesen, manifestZeile } from './backup-regeln.mjs';

const BUCKET = 'saattueten';
const SEITE = 1000;
const VERSUCHE = 3;

const i = process.argv.indexOf('--ziel');
const ziel = i >= 0 ? process.argv[i + 1] : undefined;
const token = process.env.STORAGE_TOKEN;
const basis = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const apikey = process.env.SUPABASE_APIKEY;
if (!ziel) throw new Error('--ziel <ordner> fehlt');
if (!token || !basis || !apikey) throw new Error('STORAGE_TOKEN, SUPABASE_URL oder SUPABASE_APIKEY fehlt');

// Ein gültiger Token einer anderen Rolle (z. B. anon) listet still 0 Dateien. Deshalb Rolle und Ablauf vorab prüfen
// und mit --mindestens die Zahl der Fotos aus ki_feldprotokoll.fotopfad als Untergrenze setzen (backup.yml).
const nutzlast = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8') || '{}');
if (nutzlast.role !== 'backup_speicher_leser')
  throw new Error(`Storage-Token mit falscher Rolle: ${nutzlast.role}`);
const restTage = (nutzlast.exp * 1000 - Date.now()) / 86_400_000;
if (!(restTage > 0))
  throw new Error('Storage-Token abgelaufen; mit scripts/backup-einrichten.mjs neu setzen');
if (restTage < 30)
  console.log(
    `::warning::Storage-Token läuft in ${Math.floor(restTage)} Tagen ab (scripts/backup-einrichten.mjs)`,
  );
const m = process.argv.indexOf('--mindestens');
const mindestensText = m >= 0 ? (process.argv[m + 1] ?? '') : '0';
if (!/^\d+$/.test(mindestensText))
  throw new Error(`--mindestens <zahl> ungültig: ${JSON.stringify(mindestensText)}`);
const mindestens = Number(mindestensText);
if (!Number.isSafeInteger(mindestens) || mindestens < 0) throw new Error('--mindestens <zahl> ungültig');

const kopf = { Authorization: `Bearer ${token}`, apikey };

async function mitWiederholung(was, aufruf) {
  let letzter;
  for (let versuch = 1; versuch <= VERSUCHE; versuch += 1) {
    try {
      return await aufruf();
    } catch (e) {
      letzter = e;
      console.log(`${was}: Versuch ${versuch} gescheitert (${e instanceof Error ? e.message : e})`);
      if (versuch < VERSUCHE) await new Promise((r) => setTimeout(r, 1000 * versuch));
    }
  }
  throw letzter;
}

async function liste(praefix) {
  const eintraege = [];
  for (let offset = 0; ; offset += SEITE) {
    const seite = await mitWiederholung(`Liste ${praefix || '/'}`, async () => {
      const antwort = await fetch(`${basis}/storage/v1/object/list/${BUCKET}`, {
        method: 'POST',
        headers: { ...kopf, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: praefix,
          limit: SEITE,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        }),
      });
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return antwort.json();
    });
    eintraege.push(...seite);
    if (seite.length < SEITE) return eintraege;
  }
}

async function laden(pfad) {
  return mitWiederholung(`Datei ${pfad}`, async () => {
    const url = `${basis}/storage/v1/object/authenticated/${BUCKET}/${pfad.split('/').map(encodeURIComponent).join('/')}`;
    const antwort = await fetch(url, { headers: kopf });
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
    return new Uint8Array(await antwort.arrayBuffer());
  });
}

// Alle Dateien rekursiv auflisten (Ordner {sorte_id}, Dateien {uuid}.jpg)
const dateien = [];
const offen = [''];
while (offen.length > 0) {
  const praefix = offen.shift();
  const teil = listeAufloesen(await liste(praefix), praefix);
  dateien.push(...teil.dateien);
  offen.push(...teil.ordner);
}

const manifest = [];
let geladen = 0;
for (const datei of dateien) {
  try {
    const inhalt = await laden(datei.pfad);
    const pfad = join(ziel, BUCKET, ...datei.pfad.split('/'));
    await mkdir(dirname(pfad), { recursive: true });
    await writeFile(pfad, inhalt);
    manifest.push(
      manifestZeile(datei.pfad, inhalt.length, createHash('sha256').update(inhalt).digest('hex')),
    );
    geladen += 1;
  } catch (e) {
    console.log(`::error::Datei nicht geladen: ${datei.pfad} (${e instanceof Error ? e.message : e})`);
  }
}

await mkdir(ziel, { recursive: true });
await writeFile(join(ziel, 'manifest.csv'), manifest.length ? `${manifest.join('\n')}\n` : '');
console.log(`Storage ${BUCKET}: ${geladen} von ${dateien.length} Dateien gesichert`);
if (geladen < dateien.length) process.exit(1);
if (dateien.length < mindestens) {
  console.log(
    `::error::Nur ${dateien.length} Dateien gelistet, aber ${mindestens} Fotos in ki_feldprotokoll`,
  );
  process.exit(1);
}
