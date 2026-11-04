// Neues age-Schlüsselpaar für das Backup (I0-11, #16). Nur Tim in der eigenen Konsole.
//   node scripts/backup-schluessel-neu.mjs
// Der private Schlüssel erscheint nie auf dem Bildschirm und landet nie auf der Platte: Er geht nur in die
// Zwischenablage, Tim legt ihn im Passwortmanager ab und fügt ihn zur Kontrolle wieder ein. Erst wenn die Kontrolle
// stimmt, setzt das Skript den öffentlichen Schlüssel als Secret BACKUP_AGE_PUBLIC_KEY in der Umgebung backup.
// Ältere Stände bleiben mit dem alten Schlüssel verschlüsselt.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { generateX25519Identity, identityToRecipient } from 'age-encryption';

if (!process.stdin.isTTY) {
  console.error('Nur in einer echten Konsole ausführen.');
  process.exit(1);
}

function zwischenablage(text) {
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', 'Set-Clipboard -Value ([Console]::In.ReadToEnd())'],
    {
      input: text,
      stdio: ['pipe', 'ignore', 'ignore'],
    },
  );
}

function zwischenablageLesen() {
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
          aufloesen(wert.trim());
          return;
        }
        if (z === '\u0003') {
          zwischenablage(' ');
          process.stdout.write('\nAbgebrochen. Nichts wurde gesetzt.\n');
          process.exit(1);
        }
        if (z === '\u007f' || z === '\b') {
          if (wert) process.stdout.write('\b \b');
          wert = wert.slice(0, -1);
        } else if (z === '\u0016') {
          const e = zwischenablageLesen();
          wert += e;
          process.stdout.write('*'.repeat(e.length));
        } else if (z >= ' ') {
          wert += z;
          process.stdout.write('*');
        }
      }
    };
    ein.on('data', lesen);
  });
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ja = (
  await rl.question('Neues Schlüsselpaar für das Backup erzeugen? Zum Bestätigen «ja» eingeben: ')
).trim();
rl.close();
if (ja !== 'ja') {
  console.log('Abgebrochen. Nichts wurde gesetzt.');
  process.exit(0);
}

const identitaet = await generateX25519Identity();
const empfaenger = await identityToRecipient(identitaet);

try {
  zwischenablage(identitaet);
  console.log(
    '\nSchritt 1 von 2: Der PRIVATE Schlüssel liegt in der Zwischenablage (74 Zeichen, beginnt mit AGE-SECRET-KEY-1).',
  );
  console.log(
    'Lege im Passwortmanager einen neuen Eintrag an, zum Beispiel «Hydrovisor Backup age-Schlüssel»,',
  );
  console.log('und füge ihn dort mit Ctrl-V als Passwort ein. Speichern.');
  console.log('Ohne diesen Schlüssel lässt sich kein Backup mehr öffnen.');
  // Verdeckt warten: Fügt Tim hier versehentlich den Schlüssel ein, erscheint er nicht auf dem Bildschirm
  await verdeckt('Wenn der Eintrag gespeichert ist, hier nur Enter drücken (nichts einfügen): ');

  for (;;) {
    console.log(
      '\nSchritt 2 von 2: Kopiere den Schlüssel jetzt AUS DEM PASSWORTMANAGER und füge ihn hier ein.',
    );
    zwischenablage(' ');
    const kontrolle = await verdeckt('Schlüssel aus dem Passwortmanager einfügen (Ctrl-V), dann Enter: ');
    if (kontrolle === identitaet) break;
    console.log(
      `Stimmt nicht (${kontrolle.length} Zeichen). Der Schlüssel liegt wieder in der Zwischenablage; korrigiere den Eintrag im Passwortmanager.`,
    );
    zwischenablage(identitaet);
    await verdeckt('Wenn der Eintrag korrigiert ist, hier nur Enter drücken (nichts einfügen): ');
  }

  const ordner = join(homedir(), 'hydrovisor-age');
  mkdirSync(ordner, { recursive: true });
  writeFileSync(join(ordner, 'backup-oeffentlich.txt'), `${empfaenger}\n`);
  execFileSync(
    'gh',
    [
      'secret',
      'set',
      'BACKUP_AGE_PUBLIC_KEY',
      '--env',
      'backup',
      '--repo',
      'hydrovisor/hydrovisor.github.io',
    ],
    { input: empfaenger, stdio: ['pipe', 'ignore', 'inherit'] },
  );
  console.log('\nGeprüft: Der Schlüssel im Passwortmanager stimmt.');
  console.log(
    'Ist der Zwischenablage-Verlauf eingeschaltet (Win+V), lösch dort jetzt den Eintrag AGE-SECRET-KEY-1…',
  );
  console.log('BACKUP_AGE_PUBLIC_KEY ist in der Umgebung backup gesetzt; der öffentliche Teil liegt in');
  console.log(`${join(ordner, 'backup-oeffentlich.txt')}.`);
  console.log('Fertig. Der Lead startet jetzt das Backup neu.');
} finally {
  zwischenablage(' ');
}
