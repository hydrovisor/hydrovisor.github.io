// Backup-Regeln (Plan 16, Schnittstellen und Testliste «Unit»; Konzept 11.7): reine Funktionen aus
// scripts/backup-regeln.mjs für Storage-Kopie, Wiederherstellungsprobe und Einrichtung, ohne Ein- und Ausgabe.
// Hilfstests ohne eigenes AK (Plan A9): Präfix «Wiederherstellungsprobe (M0)», «Backup-Storage», «Backup-Einrichtung».
// Rückgaben werden mit await gelesen, damit synchrone und asynchrone Umsetzungen (SHA-256, PBKDF2, HMAC) gelten.
// Keine Personendaten, keine Geheimnisse: Passwort, Salz und JWT-Geheimnis sind Testwerte ohne Bedeutung.
import { expect, it } from 'vitest';
import {
  berichtMarkdown,
  dumpBereinigen,
  listeAufloesen,
  manifestPruefen,
  manifestZeile,
  probeErgebnisLesen,
  probeSql,
  scramVerifier,
  speicherToken,
  vergleichen,
  zaehlungLesen,
} from '../../scripts/backup-regeln.mjs';

const text = new TextEncoder();

async function sha256Hex(daten: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', daten));
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64urlDecode(teil: string): Uint8Array<ArrayBuffer> {
  const b64 = teil
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(teil.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (z) => z.charCodeAt(0));
}

function jsonAus(teil: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64urlDecode(teil))) as Record<string, unknown>;
}

// ---------------------------------------------------------------------
// dumpBereinigen (pg_dump 17.6+ schreibt \restrict und \unrestrict; Management-API kennt keine psql-Befehle)
// ---------------------------------------------------------------------

const DUMP = [
  '--',
  '-- PostgreSQL database dump',
  '--',
  '\\restrict pgtapSchluessel0123456789',
  "SET client_encoding = 'UTF8';",
  "INSERT INTO public.anlage (id, name, kuerzel) VALUES ('fb000000-0000-4000-8000-000000000301', 'Backupregal', 'BKT');",
  "INSERT INTO public.messung (id, ec) VALUES ('fb000000-0000-4000-8000-000000000501', 1.2);",
  '\\unrestrict pgtapSchluessel0123456789',
  '',
].join('\n');

it('Wiederherstellungsprobe (M0) dumpBereinigen entfernt \\restrict und \\unrestrict', async () => {
  const bereinigt = await dumpBereinigen(DUMP);
  expect(bereinigt).not.toMatch(/^\s*\\/m);
  expect(bereinigt).not.toContain('restrict');
  expect(bereinigt).toContain("SET client_encoding = 'UTF8';");
  expect(bereinigt).toContain(
    "INSERT INTO public.anlage (id, name, kuerzel) VALUES ('fb000000-0000-4000-8000-000000000301', 'Backupregal', 'BKT');",
  );
  expect(bereinigt).toContain(
    "INSERT INTO public.messung (id, ec) VALUES ('fb000000-0000-4000-8000-000000000501', 1.2);",
  );
  // Reihenfolge der Anweisungen bleibt
  expect(bereinigt.indexOf('public.anlage')).toBeLessThan(bereinigt.indexOf('public.messung'));
});

it('Wiederherstellungsprobe (M0) dumpBereinigen lässt einen Dump ohne psql-Befehle unverändert', async () => {
  const ohne = "INSERT INTO public.anlage (id) VALUES ('fb000000-0000-4000-8000-000000000301');\n";
  expect(await dumpBereinigen(ohne)).toBe(ohne);
});

it('Wiederherstellungsprobe (M0) dumpBereinigen wirft bei COPY FROM stdin', async () => {
  const mitCopy = [
    'COPY public.messung (id, ec) FROM stdin;',
    'fb000000-0000-4000-8000-000000000501\t1.2',
    '\\.',
    '',
  ].join('\n');
  await expect(async () => dumpBereinigen(mitCopy)).rejects.toThrow();
});

it('Wiederherstellungsprobe (M0) dumpBereinigen wirft bei anderem psql-Befehl', async () => {
  await expect(async () => dumpBereinigen('\\connect postgres\nSELECT 1;\n')).rejects.toThrow();
  await expect(async () => dumpBereinigen('SELECT 1;\n\\set ON_ERROR_STOP on\n')).rejects.toThrow();
});

// ---------------------------------------------------------------------
// probeSql: eine Transaktion, die immer mit HV_PROBE endet (Rückrollen, dev bleibt unverändert)
// ---------------------------------------------------------------------

const DATEN = [
  "INSERT INTO public.anlage (id, name, kuerzel) VALUES ('fb000000-0000-4000-8000-000000000301', 'Backupregal', 'BKT');",
  "INSERT INTO public.messung (id, ec) VALUES ('fb000000-0000-4000-8000-000000000501', 1.2);",
].join('\n');
const TABELLEN = ['anlage', 'messung', 'zugang', 'backup_status'];

it('Wiederherstellungsprobe (M0) probeSql endet immer mit HV_PROBE und enthält truncate aller Tabellen und session_replication_role', async () => {
  const sql = await probeSql(DATEN, TABELLEN);

  const replica = sql.search(/set\s+local\s+session_replication_role\s*=\s*'?replica'?/i);
  expect(replica).toBeGreaterThanOrEqual(0);

  for (const tabelle of TABELLEN) {
    expect(sql, `truncate ${tabelle}`).toMatch(new RegExp(`truncate[^;]*\\b${tabelle}\\b`, 'i'));
  }
  const truncate = sql.search(/truncate/i);
  const daten = sql.indexOf(DATEN.split('\n')[0] ?? '');
  const marke = sql.lastIndexOf('HV_PROBE');

  expect(daten, 'Daten unverändert im Text').toBeGreaterThanOrEqual(0);
  expect(sql).toContain(DATEN.split('\n')[1]);
  expect(replica).toBeLessThan(truncate);
  expect(truncate).toBeLessThan(daten);
  expect(daten).toBeLessThan(marke);
  // Zählung je Tabelle und Abschluss mit einer Ausnahme, die alles zurückrollt
  expect(sql).toMatch(/raise\s+exception\s+'HV_PROBE/i);
  expect(sql.slice(daten)).toMatch(/count\s*\(\s*\*\s*\)/i);
  for (const tabelle of TABELLEN) {
    expect(sql.slice(daten), `Zählung ${tabelle}`).toContain(tabelle);
  }
  // Nie festschreiben
  expect(sql).not.toMatch(/\bcommit\b/i);
  expect(sql).not.toMatch(/\bend\s+transaction\b/i);
});

it('Wiederherstellungsprobe (M0) probeSql endet immer mit HV_PROBE auch ohne Daten', async () => {
  const sql = await probeSql('', ['anlage']);
  expect(sql).toMatch(/raise\s+exception\s+'HV_PROBE/i);
  expect(sql).toMatch(/truncate[^;]*\banlage\b/i);
  expect(sql).not.toMatch(/\bcommit\b/i);
});

// ---------------------------------------------------------------------
// probeErgebnisLesen (aufgezeichnete Fehlerantwort der Management-API, Feld message)
// ---------------------------------------------------------------------

const ANTWORT_PROBE = {
  message:
    'Failed to run sql query: ERROR:  P0001: HV_PROBE {"anlage": 3, "messung": 19, "zugang": 1, "backup_status": 0}\n' +
    'CONTEXT:  PL/pgSQL function inline_code_block line 9 at RAISE\n',
};
const ANTWORT_FEHLER = {
  message:
    'Failed to run sql query: ERROR:  23503: insert or update on table "zugang" violates foreign key constraint ' +
    '"zugang_user_id_fkey"\n',
};

it('Wiederherstellungsprobe (M0) probeErgebnisLesen liest die Zählung aus der Fehlerantwort', async () => {
  const ergebnis = await probeErgebnisLesen(ANTWORT_PROBE.message);
  expect(ergebnis).toBeInstanceOf(Map);
  expect(Object.fromEntries(ergebnis ?? [])).toEqual({ anlage: 3, messung: 19, zugang: 1, backup_status: 0 });
});

it('Wiederherstellungsprobe (M0) probeErgebnisLesen ohne Marke ergibt null', async () => {
  expect(await probeErgebnisLesen(ANTWORT_FEHLER.message)).toBeNull();
  expect(await probeErgebnisLesen('')).toBeNull();
});

// ---------------------------------------------------------------------
// vergleichen (zaehlung.csv gegen die Zählung in dev)
// ---------------------------------------------------------------------

const erwartet = new Map([
  ['anlage', 3],
  ['messung', 19],
  ['zugang', 1],
]);

it('Wiederherstellungsprobe (M0) vergleichen gleich', async () => {
  const v = await vergleichen(erwartet, new Map(erwartet));
  expect(v).toEqual({ gleich: 3, abweichungen: [] });
});

it('Wiederherstellungsprobe (M0) vergleichen Abweichung', async () => {
  const v = await vergleichen(
    erwartet,
    new Map([
      ['anlage', 3],
      ['messung', 18],
      ['zugang', 1],
    ]),
  );
  expect(v.gleich).toBe(2);
  expect(v.abweichungen).toEqual([{ tabelle: 'messung', erwartet: 19, ist: 18 }]);
});

it('Wiederherstellungsprobe (M0) vergleichen Tabelle fehlt in dev', async () => {
  const v = await vergleichen(
    erwartet,
    new Map([
      ['anlage', 3],
      ['messung', 19],
    ]),
  );
  expect(v.gleich).toBe(2);
  expect(v.abweichungen).toEqual([{ tabelle: 'zugang', erwartet: 1, ist: null }]);
});

it('Wiederherstellungsprobe (M0) vergleichen Tabelle nur in dev zählt nicht als Abweichung', async () => {
  const v = await vergleichen(erwartet, new Map([...erwartet, ['neue_tabelle', 5]]));
  expect(v).toEqual({ gleich: 3, abweichungen: [] });
});

it('Wiederherstellungsprobe (M0) vergleichen 0 Zeilen gegen fehlende Tabelle ist eine Abweichung', async () => {
  const v = await vergleichen(new Map([['backup_status', 0]]), new Map());
  expect(v).toEqual({ gleich: 0, abweichungen: [{ tabelle: 'backup_status', erwartet: 0, ist: null }] });
});

// ---------------------------------------------------------------------
// zaehlungLesen (zaehlung.csv: tabelle;zeilen)
// ---------------------------------------------------------------------

it('Wiederherstellungsprobe (M0) zaehlungLesen mit Kopfzeile und Leerzeilen', async () => {
  const z = await zaehlungLesen('tabelle;zeilen\nanlage;3\n\nmessung;19\nbackup_status;0\n\n');
  expect(z).toBeInstanceOf(Map);
  expect(Object.fromEntries(z)).toEqual({ anlage: 3, messung: 19, backup_status: 0 });
  expect(z.has('tabelle')).toBe(false);
});

it('Wiederherstellungsprobe (M0) zaehlungLesen mit Windows-Zeilenenden', async () => {
  const z = await zaehlungLesen('tabelle;zeilen\r\nanlage;3\r\nmessung;19\r\n');
  expect(Object.fromEntries(z)).toEqual({ anlage: 3, messung: 19 });
});

it('Wiederherstellungsprobe (M0) zaehlungLesen Zahl ungültig ergibt Fehler', async () => {
  await expect(async () => zaehlungLesen('tabelle;zeilen\nmessung;abc\n')).rejects.toThrow();
  await expect(async () => zaehlungLesen('tabelle;zeilen\nmessung;-1\n')).rejects.toThrow();
  await expect(async () => zaehlungLesen('tabelle;zeilen\nmessung;1.5\n')).rejects.toThrow();
  await expect(async () => zaehlungLesen('tabelle;zeilen\nmessung;\n')).rejects.toThrow();
});

// ---------------------------------------------------------------------
// berichtMarkdown (nur Tabellennamen und Zahlen, Storage-Ergebnis, Migrationsstand)
// ---------------------------------------------------------------------

it('Wiederherstellungsprobe (M0) berichtMarkdown enthält nur Namen und Zahlen', async () => {
  const bericht = await berichtMarkdown(
    'backup-2026-11-20',
    { gleich: 3, abweichungen: [] },
    { dateien: 7, ok: true },
    { gleich: true, nurBackup: [], nurDev: [] },
  );
  expect(typeof bericht).toBe('string');
  expect(bericht).toContain('backup-2026-11-20');
  expect(bericht).toContain('3 von 3 Tabellen gleich');
  expect(bericht).toContain('7');
  expect(bericht).not.toMatch(/insert\s+into|values\s*\(/i);
});

it('Wiederherstellungsprobe (M0) berichtMarkdown nennt Abweichungen, Storage und Migrationsstand', async () => {
  const bericht = await berichtMarkdown(
    'backup-2026-11-21',
    {
      gleich: 2,
      abweichungen: [
        { tabelle: 'messung', erwartet: 19, ist: 18 },
        { tabelle: 'zugang', erwartet: 1, ist: null },
      ],
    },
    null,
    { gleich: false, nurBackup: ['20261201120000'], nurDev: ['20261202120000'] },
  );
  expect(bericht).toContain('2 von 4 Tabellen gleich');
  expect(bericht).toContain('messung');
  expect(bericht).toContain('19');
  expect(bericht).toContain('18');
  expect(bericht).toContain('zugang');
  expect(bericht).toMatch(/nicht gesichert/i);
  expect(bericht).toContain('20261201120000');
  expect(bericht).toContain('20261202120000');
});

// ---------------------------------------------------------------------
// Backup-Storage: Liste des Buckets saattueten ({sorte_id}/{uuid}.jpg) und Manifest
// ---------------------------------------------------------------------

const SORTE_1 = 'fb000000-0000-4000-8000-000000000101';
const SORTE_2 = 'fb000000-0000-4000-8000-000000000102';
const FOTO_1 = 'fb000000-0000-4000-8000-000000000601.jpg';
const FOTO_2 = 'fb000000-0000-4000-8000-000000000602.jpg';

it('Backup-Storage listeAufloesen trennt Ordner und Dateien', async () => {
  const r = await listeAufloesen(
    [
      { name: SORTE_1, id: null, metadata: null },
      { name: SORTE_2, id: null, metadata: null },
    ],
    '',
  );
  expect(r).toEqual({ dateien: [], ordner: [SORTE_1, SORTE_2] });
});

it('Backup-Storage listeAufloesen verschachtelte Pfade saattueten/{sorte_id}/{uuid}.jpg', async () => {
  const r = await listeAufloesen(
    [
      { name: FOTO_1, id: 'fb000000-0000-4000-8000-000000000701', metadata: { size: 123456 } },
      { name: 'unterordner', id: null, metadata: null },
      { name: FOTO_2, id: 'fb000000-0000-4000-8000-000000000702', metadata: { size: 0 } },
    ],
    SORTE_1,
  );
  expect(r.dateien).toEqual([
    { pfad: `${SORTE_1}/${FOTO_1}`, bytes: 123456 },
    { pfad: `${SORTE_1}/${FOTO_2}`, bytes: 0 },
  ]);
  expect(r.ordner).toEqual([`${SORTE_1}/unterordner`]);
});

it('Backup-Storage manifestZeile im Format pfad;bytes;sha256', async () => {
  const hash = 'a'.repeat(64);
  expect(await manifestZeile(`${SORTE_1}/${FOTO_1}`, 3, hash)).toBe(`${SORTE_1}/${FOTO_1};3;${hash}`);
});

async function manifestAus(dateien: Map<string, Uint8Array<ArrayBuffer>>): Promise<string> {
  const zeilen: string[] = [];
  for (const [pfad, inhalt] of dateien)
    zeilen.push(await manifestZeile(pfad, inhalt.length, await sha256Hex(inhalt)));
  return zeilen.join('\n') + '\n';
}

function testDateien(): Map<string, Uint8Array<ArrayBuffer>> {
  return new Map([
    [`${SORTE_1}/${FOTO_1}`, text.encode('JPEG-Testinhalt eins')],
    [`${SORTE_2}/${FOTO_2}`, text.encode('JPEG-Testinhalt zwei')],
  ]);
}

it('Backup-Storage manifestPruefen vollständig', async () => {
  const dateien = testDateien();
  const r = await manifestPruefen(await manifestAus(dateien), dateien);
  expect(r).toEqual({ ok: true, fehlend: [], abweichend: [] });
});

it('Backup-Storage manifestPruefen fehlend', async () => {
  const dateien = testDateien();
  const manifest = await manifestAus(dateien);
  dateien.delete(`${SORTE_2}/${FOTO_2}`);
  const r = await manifestPruefen(manifest, dateien);
  expect(r).toEqual({ ok: false, fehlend: [`${SORTE_2}/${FOTO_2}`], abweichend: [] });
});

it('Backup-Storage manifestPruefen abweichende Grösse', async () => {
  const dateien = testDateien();
  const manifest = await manifestAus(dateien);
  dateien.set(`${SORTE_1}/${FOTO_1}`, text.encode('JPEG-Testinhalt eins, länger'));
  const r = await manifestPruefen(manifest, dateien);
  expect(r).toEqual({ ok: false, fehlend: [], abweichend: [`${SORTE_1}/${FOTO_1}`] });
});

it('Backup-Storage manifestPruefen abweichender SHA-256 bei gleicher Grösse', async () => {
  const dateien = testDateien();
  const manifest = await manifestAus(dateien);
  dateien.set(`${SORTE_1}/${FOTO_1}`, text.encode('JPEG-Testinhalt EINS'));
  const r = await manifestPruefen(manifest, dateien);
  expect(r).toEqual({ ok: false, fehlend: [], abweichend: [`${SORTE_1}/${FOTO_1}`] });
});

// ---------------------------------------------------------------------
// Backup-Einrichtung: SCRAM-Hash wie PostgreSQL und Storage-Token mit injizierter Uhr
// ---------------------------------------------------------------------

it('Backup-Einrichtung scramVerifier gegen bekannten Testvektor', async () => {
  // Vom Testentwickler gegen PostgreSQL 17 (supabase start) geprüft: Anmeldung mit diesem Hash und Passwort gelingt,
  // mit falschem Passwort scheitert sie (28P01). Salz 00 01 … 0f, 4096 Iterationen.
  const salz = Uint8Array.from({ length: 16 }, (_, i) => i);
  expect(await scramVerifier('hydrovisor-testpasswort', salz, 4096)).toBe(
    'SCRAM-SHA-256$4096:AAECAwQFBgcICQoLDA0ODw==$SNFd6u884cDy/dxz/lYowOgXkxvWLvA/kn/kQRu/xts=:u1p/Yvo5Cx+fBxwGa6aUAW5KxqGsxNk4k5HozeChuao=',
  );
});

it('Backup-Einrichtung scramVerifier enthält das Passwort nicht', async () => {
  const salz = Uint8Array.from({ length: 16 }, (_, i) => 255 - i);
  const verifier = await scramVerifier('hydrovisor-testpasswort', salz, 4096);
  expect(verifier).toMatch(/^SCRAM-SHA-256\$4096:[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
  expect(verifier).not.toContain('hydrovisor-testpasswort');
});

it('Backup-Einrichtung speicherToken mit injizierter Uhr: Kopf HS256, role, iat, exp, Signatur prüfbar', async () => {
  const geheimnis = 'pgtap-testgeheimnis-ohne-bedeutung-mindestens-32-zeichen';
  // Uhr in Europe/Zurich: 20.11.2026 10:15 MEZ (UTC+1); Ablauf 30.6.2027 23:59:59 MESZ (UTC+2)
  const jetzt = new Date('2026-11-20T10:15:00+01:00');
  const ablauf = new Date('2027-06-30T23:59:59+02:00');
  const token = await speicherToken(geheimnis, jetzt, ablauf);

  const teile = token.split('.');
  expect(teile).toHaveLength(3);
  const [kopf, nutzlast, signatur] = teile as [string, string, string];
  expect(jsonAus(kopf)).toMatchObject({ alg: 'HS256' });
  const anspruch = jsonAus(nutzlast);
  expect(anspruch).toMatchObject({
    role: 'backup_speicher_leser',
    iss: 'supabase',
    iat: Math.floor(jetzt.getTime() / 1000),
    exp: Math.floor(ablauf.getTime() / 1000),
  });
  expect(anspruch['iat']).toBe(1795166100);
  expect(anspruch['exp']).toBe(1814392799);

  const schluessel = await crypto.subtle.importKey(
    'raw',
    text.encode(geheimnis),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const gueltig = await crypto.subtle.verify(
    'HMAC',
    schluessel,
    base64urlDecode(signatur),
    text.encode(`${kopf}.${nutzlast}`),
  );
  expect(gueltig).toBe(true);

  const falsch = await crypto.subtle.importKey(
    'raw',
    text.encode('anderes-testgeheimnis-ohne-bedeutung-mindestens-32'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  expect(
    await crypto.subtle.verify('HMAC', falsch, base64urlDecode(signatur), text.encode(`${kopf}.${nutzlast}`)),
  ).toBe(false);
});
