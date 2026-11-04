// Backup-Regeln (I0-11, Issue #16, Plan 16 «Schnittstellen»; Konzept 11.7): reine Funktionen für die Storage-Kopie
// (backup-storage.mjs), die Wiederherstellungsprobe (wiederherstellungsprobe.mjs) und die Einrichtung
// (backup-einrichten.mjs). Ohne Ein- und Ausgabe und ohne npm-Abhängigkeit, weil backup.yml kein npm ci ausführt.
// Typen: backup-regeln.d.mts. Die Uhr ist nur in speicherToken ein Parameter; sonst kein zeitabhängiger Code.
import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';

/** Bezeichner einer Tabelle in public; alles andere wird nie in SQL eingesetzt */
const BEZEICHNER = /^[a-z_][a-z0-9_]*$/;

/** Marke der Zählung in der Ausnahme, die die Probe immer zurückrollt */
export const PROBE_MARKE = 'HV_PROBE';

function bezeichnerPruefen(name) {
  if (!BEZEICHNER.test(name)) throw new Error(`Ungültiger Tabellenname: ${JSON.stringify(name)}`);
  return name;
}

function sha256Hex(daten) {
  return createHash('sha256').update(daten).digest('hex');
}

function base64url(daten) {
  return Buffer.from(daten).toString('base64url');
}

// ---------------------------------------------------------------------
// Storage (Bucket saattueten, {sorte_id}/{uuid}.jpg)
// ---------------------------------------------------------------------

/**
 * Antwort von POST /storage/v1/object/list/<bucket> in Dateien und Ordner trennen. Ordner haben id null.
 * @param {{name: string; id: string | null; metadata: {size: number} | null}[]} eintraege
 * @param {string} praefix Ordner der Abfrage, leer für die Wurzel
 */
export function listeAufloesen(eintraege, praefix) {
  const dateien = [];
  const ordner = [];
  for (const eintrag of eintraege) {
    // Kein Pfadtrenner (auch \ für Windows) und kein . oder ..: der Name wird ein Pfad unter dem Zielordner
    if (!eintrag.name || /[/\\]/.test(eintrag.name) || eintrag.name === '.' || eintrag.name === '..')
      throw new Error(`Ungültiger Name in der Storage-Liste: ${JSON.stringify(eintrag.name)}`);
    const pfad = praefix ? `${praefix}/${eintrag.name}` : eintrag.name;
    if (eintrag.id === null) ordner.push(pfad);
    else dateien.push({ pfad, bytes: Number(eintrag.metadata?.size ?? 0) });
  }
  return { dateien, ordner };
}

/** Zeile des Manifests «pfad;bytes;sha256» */
export function manifestZeile(pfad, bytes, sha256) {
  if (/[;\r\n]/.test(pfad)) throw new Error(`Pfad mit ; oder Zeilenumbruch: ${JSON.stringify(pfad)}`);
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error(`Ungültige Grösse: ${bytes}`);
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error(`Ungültiger SHA-256: ${sha256}`);
  return `${pfad};${bytes};${sha256}`;
}

/**
 * Manifest gegen die Dateien aus dem Archiv prüfen (Anzahl, Bytes, SHA-256).
 * @param {string} manifest
 * @param {Map<string, Uint8Array>} dateien Pfad relativ zum Bucket
 */
export function manifestPruefen(manifest, dateien) {
  const fehlend = [];
  const abweichend = [];
  for (const roh of manifest.split(/\r?\n/)) {
    const zeile = roh.trim();
    if (!zeile) continue;
    const teile = zeile.split(';');
    if (teile.length !== 3) throw new Error(`Ungültige Manifestzeile: ${JSON.stringify(zeile)}`);
    const [pfad, bytes, sha] = teile;
    const inhalt = dateien.get(pfad);
    if (!inhalt) fehlend.push(pfad);
    else if (inhalt.length !== Number(bytes) || sha256Hex(inhalt) !== sha) abweichend.push(pfad);
  }
  return { ok: fehlend.length === 0 && abweichend.length === 0, fehlend, abweichend };
}

// ---------------------------------------------------------------------
// Wiederherstellungsprobe
// ---------------------------------------------------------------------

/** zaehlung.csv («tabelle;zeilen», Kopfzeile und Leerzeilen erlaubt) als Map */
export function zaehlungLesen(csv) {
  const zaehlung = new Map();
  for (const roh of csv.split(/\r?\n/)) {
    const zeile = roh.trim();
    if (!zeile || zeile === 'tabelle;zeilen') continue;
    const teile = zeile.split(';');
    if (teile.length !== 2 || !BEZEICHNER.test(teile[0]) || !/^\d+$/.test(teile[1]))
      throw new Error(`Ungültige Zeile in zaehlung.csv: ${JSON.stringify(zeile)}`);
    zaehlung.set(teile[0], Number(teile[1]));
  }
  return zaehlung;
}

/**
 * psql-Befehle \restrict und \unrestrict (pg_dump 17.6+) entfernen. Andere psql-Befehle und COPY … FROM stdin kennt
 * die Management-API nicht; dann bricht die Probe ab, statt still weniger einzuspielen. Zeilen mit
 * pg_catalog.setval(…) fallen weg: setval ist nicht transaktional und bliebe trotz HV_PROBE im Ziel (Prüfer
 * Fachlogik, Runde 1); die Zählung hängt nicht davon ab.
 */
export function dumpBereinigen(sql) {
  const zeilen = sql.split('\n');
  const behalten = [];
  for (const zeile of zeilen) {
    if (/^\s*\\(restrict|unrestrict)(\s|$)/.test(zeile)) continue;
    if (/^\s*SELECT\s+pg_catalog\.setval\(/i.test(zeile)) continue;
    if (/^\s*\\/.test(zeile)) throw new Error(`psql-Befehl im Dump: ${zeile.slice(0, 40)}`);
    if (/^\s*COPY\s.*\bFROM\s+stdin\b/i.test(zeile))
      throw new Error('COPY … FROM stdin im Dump; die Daten müssen als INSERT gesichert sein');
    behalten.push(zeile);
  }
  return behalten.join('\n');
}

/**
 * Probe als ein Text, der als eine einzige (implizite) Transaktion läuft: Trigger und Fremdschlüssel aus, alle
 * Basistabellen in public leeren, Daten einspielen, je Tabelle zählen und immer mit HV_PROBE abbrechen. Die
 * Ausnahme rollt alles zurück; der Text enthält kein begin und kein commit.
 * @param {string} daten bereinigter Daten-Dump
 * @param {string[]} tabellen alle Basistabellen in public des Ziels
 */
export function probeSql(daten, tabellen) {
  if (tabellen.length === 0) throw new Error('Keine Tabellen für die Probe');
  const namen = tabellen.map(bezeichnerPruefen);
  // Ein Transaktionsbefehl im Dump würde die Probe festschreiben; geprüft je Zeile, damit Text in Werten nicht stört
  if (/^\s*(begin|commit|rollback|end|start\s+transaction|end\s+transaction|abort)\s*(;|$)/im.test(daten))
    throw new Error('Transaktionsbefehl im Dump');
  const zaehlen = namen
    .map((t) => `  select count(*) into n from public.${t}; z := z || jsonb_build_object('${t}', n);`)
    .join('\n');
  return [
    // In hosted Supabase darf postgres session_replication_role nicht setzen (hydrovisor-dev, 42501). Rückfall in
    // derselben Transaktion: eigene Trigger aus, Fremdschlüssel aufgeschoben (nie geprüft, weil nie festgeschrieben).
    // postgres besitzt alle Tabellen in public; HV_PROBE rollt auch diese Änderungen zurück.
    'do $hv_vorbereitung$',
    'declare',
    '  r record;',
    'begin',
    '  begin',
    "    set local session_replication_role = 'replica';",
    '  exception when insufficient_privilege then',
    '    for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace',
    "             where n.nspname = 'public' and c.relkind in ('r', 'p') loop",
    "      execute format('alter table public.%I disable trigger user', r.relname);",
    '    end loop;',
    '    for r in select c.relname, k.conname from pg_constraint k join pg_class c on c.oid = k.conrelid',
    '             join pg_namespace n on n.oid = c.relnamespace',
    "             where n.nspname = 'public' and k.contype = 'f' and not k.condeferrable loop",
    "      execute format('alter table public.%I alter constraint %I deferrable initially deferred', r.relname, r.conname);",
    '    end loop;',
    '  end;',
    'end $hv_vorbereitung$;',
    'set constraints all deferred;',
    `truncate table ${namen.map((t) => `public.${t}`).join(', ')};`,
    daten,
    ';',
    'do $hv_probe$',
    'declare',
    "  z jsonb := '{}'::jsonb;",
    '  n bigint;',
    'begin',
    zaehlen,
    `  raise exception '${PROBE_MARKE} %', z::text;`,
    'end $hv_probe$;',
    '',
  ].join('\n');
}

/** Zählung aus der Fehlermeldung der Probe; null, wenn die Marke fehlt (anderer Fehler) */
export function probeErgebnisLesen(fehlermeldung) {
  const treffer = new RegExp(`${PROBE_MARKE} (\\{[^\\n]*\\})`).exec(fehlermeldung ?? '');
  if (!treffer) return null;
  let objekt;
  try {
    objekt = JSON.parse(treffer[1]);
  } catch {
    return null;
  }
  const ergebnis = new Map();
  for (const [tabelle, zeilen] of Object.entries(objekt)) {
    if (!BEZEICHNER.test(tabelle) || !Number.isSafeInteger(zeilen) || zeilen < 0) return null;
    ergebnis.set(tabelle, zeilen);
  }
  return ergebnis;
}

/**
 * zaehlung.csv gegen die Zählung im Ziel. Tabellen nur im Ziel zählen nicht; fehlt eine Tabelle im Ziel, ist ist null.
 * @param {Map<string, number>} erwartet
 * @param {Map<string, number>} ist
 */
export function vergleichen(erwartet, ist) {
  let gleich = 0;
  const abweichungen = [];
  for (const [tabelle, zeilen] of erwartet) {
    const wert = ist.has(tabelle) ? ist.get(tabelle) : null;
    if (wert === zeilen) gleich += 1;
    else abweichungen.push({ tabelle, erwartet: zeilen, ist: wert });
  }
  return { gleich, abweichungen };
}

/**
 * Bericht der Probe: nur Stand, Tabellennamen, Zahlen, Storage-Ergebnis und Migrationsstand, nie Datenzeilen.
 * @param {string} stand
 * @param {{gleich: number; abweichungen: {tabelle: string; erwartet: number; ist: number | null}[]}} vergleich
 * @param {{dateien: number; ok: boolean} | null} storage null: Storage nicht gesichert
 * @param {{gleich: boolean; nurBackup: string[]; nurDev: string[]}} migrationen
 */
export function berichtMarkdown(stand, vergleich, storage, migrationen) {
  const gesamt = vergleich.gleich + vergleich.abweichungen.length;
  const tabellenOk = vergleich.abweichungen.length === 0;
  const storageText =
    storage === null
      ? 'nicht gesichert (kein Storage-Token)'
      : storage.ok
        ? `${storage.dateien} Dateien vollständig`
        : `${storage.dateien} Dateien im Manifest, unvollständig oder abweichend`;
  const migrationText = migrationen.gleich
    ? 'gleich'
    : [
        migrationen.nurBackup.length ? `fehlt in dev: ${migrationen.nurBackup.join(', ')}` : '',
        migrationen.nurDev.length ? `nur in dev: ${migrationen.nurDev.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; ');
  const bestanden = tabellenOk && (storage === null || storage.ok) && migrationen.nurBackup.length === 0;
  const zeilen = [
    `# Wiederherstellungsprobe ${stand}`,
    '',
    '| Prüfung | Ergebnis |',
    '|---|---|',
    `| Zählvergleich | ${vergleich.gleich} von ${gesamt} Tabellen gleich |`,
    `| Storage-Manifest | ${storageText} |`,
    `| Migrationsstand | ${migrationText} |`,
    `| Urteil | ${bestanden ? 'bestanden' : 'nicht bestanden'} |`,
    '',
  ];
  if (!tabellenOk) {
    zeilen.push('## Abweichungen', '', '| Tabelle | erwartet | in dev |', '|---|---|---|');
    for (const a of vergleich.abweichungen)
      zeilen.push(`| ${a.tabelle} | ${a.erwartet} | ${a.ist === null ? 'fehlt' : a.ist} |`);
    zeilen.push('');
  }
  if (storage === null) zeilen.push('Storage nicht gesichert: Der Stand enthält keine Tütenfotos.', '');
  return zeilen.join('\n');
}

/**
 * tar-Archiv im Speicher lesen (ustar mit Präfix, GNU-Langnamen «L», pax «x»); nur reguläre Dateien. Das Präfix gilt
 * nur bei Magic «ustar\0», im GNU-Format steht an derselben Stelle atime (Prüfer Fachlogik, Runde 1).
 * @param {Uint8Array} daten
 * @returns {Map<string, Uint8Array>}
 */
export function tarLesen(daten) {
  const dateien = new Map();
  const text = (von, laenge) => {
    const teil = daten.subarray(von, von + laenge);
    const ende = teil.indexOf(0);
    return Buffer.from(ende >= 0 ? teil.subarray(0, ende) : teil).toString('utf8');
  };
  let pos = 0;
  let langname = null;
  while (pos + 512 <= daten.length) {
    if (daten.subarray(pos, pos + 512).every((b) => b === 0)) break;
    const groesse = parseInt(text(pos + 124, 12).trim() || '0', 8);
    if (!Number.isSafeInteger(groesse) || groesse < 0) throw new Error('Ungültiger tar-Kopf');
    const typ = String.fromCharCode(daten[pos + 156] || 48);
    const ustar = Buffer.from(daten.subarray(pos + 257, pos + 263)).toString('latin1') === 'ustar\0';
    const praefix = ustar ? text(pos + 345, 155) : '';
    let name = text(pos, 100);
    if (praefix) name = `${praefix}/${name}`;
    const inhalt = daten.subarray(pos + 512, pos + 512 + groesse);
    pos += 512 + Math.ceil(groesse / 512) * 512;
    if (typ === 'L') {
      langname = Buffer.from(inhalt).toString('utf8').replace(/\0+$/, '');
      continue;
    }
    if (typ === 'x') {
      const pfad = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(Buffer.from(inhalt).toString('utf8'));
      if (pfad) langname = pfad[1];
      continue;
    }
    if (typ === 'g') continue;
    if (langname) {
      name = langname;
      langname = null;
    }
    if (typ === '0' || typ === '\0') dateien.set(name.replace(/^\.\//, ''), new Uint8Array(inhalt));
  }
  return dateien;
}

/**
 * Erste Zeile einer Fehlermeldung für die Konsole: ohne DETAIL und mit geschwärzten Werten in Anführungszeichen,
 * ausser Bezeichnern (Tabelle, Constraint). So erscheint kein Wert aus der Produktion (Prüfer Sicherheit, Runde 1).
 */
export function meldungKuerzen(text) {
  const erste = String(text ?? '').split(/\n|DETAIL/)[0];
  return erste.replace(/"([^"]*)"/g, (ganz, innen) => (BEZEICHNER.test(innen) ? ganz : '"…"')).slice(0, 300);
}

// ---------------------------------------------------------------------
// Einrichtung
// ---------------------------------------------------------------------

/**
 * SCRAM-SHA-256-Verifier wie PostgreSQL (RFC 5802/7677): «SCRAM-SHA-256$<iter>:<salz>$<StoredKey>:<ServerKey>».
 * Das Passwort ist ASCII (Zufallswert), SASLprep entfällt.
 */
export function scramVerifier(passwort, salz, iterationen) {
  const gesalzen = pbkdf2Sync(Buffer.from(passwort, 'utf8'), Buffer.from(salz), iterationen, 32, 'sha256');
  const clientKey = createHmac('sha256', gesalzen).update('Client Key').digest();
  const storedKey = createHash('sha256').update(clientKey).digest();
  const serverKey = createHmac('sha256', gesalzen).update('Server Key').digest();
  const b64 = (d) => Buffer.from(d).toString('base64');
  return `SCRAM-SHA-256$${iterationen}:${b64(salz)}$${b64(storedKey)}:${b64(serverKey)}`;
}

/** HS256-JWT für den Storage-Dienst mit der Rolle backup_speicher_leser (nur Bucket saattueten) */
export function speicherToken(geheimnis, jetzt, ablauf) {
  if (!geheimnis) throw new Error('JWT-Geheimnis fehlt');
  const iat = Math.floor(jetzt.getTime() / 1000);
  const exp = Math.floor(ablauf.getTime() / 1000);
  if (!(exp > iat)) throw new Error('Ablauf liegt nicht nach jetzt');
  const kopf = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const nutzlast = base64url(JSON.stringify({ role: 'backup_speicher_leser', iss: 'supabase', iat, exp }));
  const signatur = createHmac('sha256', geheimnis).update(`${kopf}.${nutzlast}`).digest('base64url');
  return `${kopf}.${nutzlast}.${signatur}`;
}
