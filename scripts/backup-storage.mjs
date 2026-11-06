// Kopie des Buckets saattueten für das nächtliche Backup (I0-11, Issue #16, Plan 16 «backup-storage.mjs»; Issue #69,
// Entscheid 0013). Zwei Wege, beide nur lesend:
//   S3 (Vorrang): S3-Zugangsschlüssel des Storage, nur ListObjectsV2 und GetObject, SigV4 aus backup-regeln.mjs.
//     Umgebung: S3_ZUGANG_ID, S3_GEHEIMNIS, S3_REGION, SUPABASE_URL (Endpunkt <SUPABASE_URL>/storage/v1/s3).
//   Token: Token der Rolle backup_speicher_leser (braucht das Legacy JWT Secret, das die Produktion nicht hat).
//     Umgebung: STORAGE_TOKEN, SUPABASE_URL, SUPABASE_APIKEY.
// Schreibt <ziel>/saattueten/… und <ziel>/manifest.csv. Ohne npm-Abhängigkeit, weil backup.yml kein npm ci ausführt.
// Lädt es weniger Dateien als gelistet oder listet es weniger als --mindestens, endet es mit Exit 1.
// Aufruf: node scripts/backup-storage.mjs --ziel <ordner> [--mindestens <n>]
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { LEER_SHA256, listeAufloesen, manifestZeile, s3ListeLesen, s3Url, sigV4 } from './backup-regeln.mjs';

const BUCKET = 'saattueten';
const SEITE = 1000;
const VERSUCHE = 3;
/** Obergrenze der Listenseiten (1000 je Seite): Schutz gegen eine endlose Fortsetzung (Prüfer Sicherheit, Befund 2) */
const SEITEN_MAX = 100;

const i = process.argv.indexOf('--ziel');
const ziel = i >= 0 ? process.argv[i + 1] : undefined;
const basis = process.env.SUPABASE_URL?.replace(/\/+$/, '');
if (!ziel) throw new Error('--ziel <ordner> fehlt');
if (!basis) throw new Error('SUPABASE_URL fehlt');

const m = process.argv.indexOf('--mindestens');
const mindestensText = m >= 0 ? (process.argv[m + 1] ?? '') : '0';
if (!/^\d+$/.test(mindestensText))
  throw new Error(`--mindestens <zahl> ungültig: ${JSON.stringify(mindestensText)}`);
const mindestens = Number(mindestensText);
if (!Number.isSafeInteger(mindestens) || mindestens < 0) throw new Error('--mindestens <zahl> ungültig');

const s3 = {
  zugangId: process.env.S3_ZUGANG_ID ?? '',
  geheimnis: process.env.S3_GEHEIMNIS ?? '',
  region: process.env.S3_REGION ?? '',
};
const mitS3 = s3.zugangId !== '' && s3.geheimnis !== '' && s3.region !== '';

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

const pfadKodiert = (pfad) => pfad.split('/').map(encodeURIComponent).join('/');

// ---------------------------------------------------------------------
// Weg S3 (Entscheid 0013)
// ---------------------------------------------------------------------

const s3Basis = `${basis}/storage/v1/s3`;

function s3Kopf(url) {
  return sigV4({
    methode: 'GET',
    url,
    region: s3.region,
    dienst: 's3',
    zugangId: s3.zugangId,
    geheimnis: s3.geheimnis,
    jetzt: new Date(),
    header: { 'x-amz-content-sha256': LEER_SHA256 },
  });
}

async function alleDateienS3() {
  const dateien = [];
  const gesehen = new Set();
  let weiter = null;
  for (let seiten = 1; ; seiten += 1) {
    if (seiten > SEITEN_MAX) throw new Error(`Mehr als ${SEITEN_MAX} Listenseiten`);
    const url = s3Url(s3Basis, [BUCKET], {
      'list-type': '2',
      'max-keys': String(SEITE),
      ...(weiter ? { 'continuation-token': weiter } : {}),
    });
    const seite = await mitWiederholung('Liste S3', async () => {
      const antwort = await fetch(url, { headers: s3Kopf(url) });
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return s3ListeLesen(await antwort.text());
    });
    dateien.push(...seite.dateien);
    if (!seite.weiter) return dateien;
    if (gesehen.has(seite.weiter)) throw new Error('Fortsetzung wiederholt sich');
    if (seite.dateien.length === 0) throw new Error('Leere Listenseite mit Fortsetzung');
    gesehen.add(seite.weiter);
    weiter = seite.weiter;
  }
}

async function ladenS3(pfad) {
  return mitWiederholung(`Datei ${pfad}`, async () => {
    const url = s3Url(s3Basis, [BUCKET, ...pfad.split('/')]);
    const antwort = await fetch(url, { headers: s3Kopf(url) });
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
    return new Uint8Array(await antwort.arrayBuffer());
  });
}

// ---------------------------------------------------------------------
// Weg Token (I0-11)
// ---------------------------------------------------------------------

function tokenKopf() {
  const token = process.env.STORAGE_TOKEN;
  const apikey = process.env.SUPABASE_APIKEY;
  if (!token || !apikey) throw new Error('S3_* oder STORAGE_TOKEN und SUPABASE_APIKEY fehlen');
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
  return { Authorization: `Bearer ${token}`, apikey };
}

async function listeToken(kopf, praefix) {
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

async function alleDateienToken(kopf) {
  // Alle Dateien rekursiv auflisten (Ordner {sorte_id}, Dateien {uuid}.jpg)
  const dateien = [];
  const offen = [''];
  while (offen.length > 0) {
    const praefix = offen.shift();
    const teil = listeAufloesen(await listeToken(kopf, praefix), praefix);
    dateien.push(...teil.dateien);
    offen.push(...teil.ordner);
  }
  return dateien;
}

function ladenToken(kopf) {
  return (pfad) =>
    mitWiederholung(`Datei ${pfad}`, async () => {
      const antwort = await fetch(`${basis}/storage/v1/object/authenticated/${BUCKET}/${pfadKodiert(pfad)}`, {
        headers: kopf,
      });
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return new Uint8Array(await antwort.arrayBuffer());
    });
}

// ---------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------

let dateien;
let laden;
if (mitS3) {
  console.log('Storage über die S3-Schnittstelle (nur ListObjectsV2 und GetObject)');
  dateien = await alleDateienS3();
  laden = ladenS3;
} else {
  const kopf = tokenKopf();
  dateien = await alleDateienToken(kopf);
  laden = ladenToken(kopf);
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
