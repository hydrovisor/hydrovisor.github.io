// Tütenfotos im Detail der Sorte (Issue #207, Plan 207 Testliste E2E; TF1-AK4, TF1-AK5, TF1-AK6; Konzept 11.3, 11.6
// Punkt 3; Plan 37 A16; Entscheid 0023 Punkt 3). 360 × 640 aus der Konfiguration. Die Claude API wird nie aufgerufen:
// ki-tuete und ki-recherche sind über page.route gemockt. Testbilder erzeugt der Test im Canvas des Browsers. Keine
// Personendaten; erfundene Sortennamen nur für «Neue Sorte».
//
// TF1-AK4 und TF1-AK6 laufen gegen die lokale Datenbank und den lokalen Storage (Fixture konto.ts; vorher
// npm run seed -- --ziel lokal, W0 mit echten Sorten). Jeder Test nutzt eine eigene W0-Sorte (sorte_key) und storniert
// vorher deren gültige Fotos (A14); geprüft werden nur Zeilen ab dem Start des Tests.
// TF1-AK5 läuft gegen die nachgebildete REST-Schnittstelle (rest.ts, A18) mit nachgebildetem Signieren.
//
// Erwartete Oberfläche (Plan 207 Oberfläche; design-system/components/Tuetenfoto.md und PhotoField.md):
// - #/sorten/<id>: Card «Tütenfoto» mit dem Baustein Tuetenfoto und zwei PhotoField «Vorderseite» und «Rückseite»
//   (input type=file mit aria-label = Label); Knopf «Tütenfoto ergänzen» ohne gültiges Foto der Seite, sonst
//   «Foto ersetzen».
// - Tuetenfoto: img «Tütenfoto Vorderseite» bzw. «Tütenfoto Rückseite» mit src auf den signierten Link
//   (/storage/v1/object/sign/saattueten/<pfad>?token=…); beide Seiten da: Gruppe «Seite der Tüte» mit «Vorderseite»
//   und «Rückseite» (Choice), Start mit der Vorderseite. Platzhalter role=img «Noch kein Tütenfoto» bzw. «Foto nur mit
//   Verbindung».
// - #/sorten/neu wie Plan 37; nach dem Speichern der Link «Sorte öffnen».
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { type Locator, type Page, type Route } from '@playwright/test';
import postgres from 'postgres';
import { saatTeile, SORTE } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { expect, test } from './konto.ts';
import { restNachbilden } from './rest.ts';
import { sorteOeffnen } from './sortenwahl-hilfe.ts';

const FUNKTIONEN = 'http://127.0.0.1:54321/functions/v1';
const SIGNIEREN = /\/storage\/v1\/object\/sign\/saattueten\//;
const SIGNIERTER_LINK =
  /\/storage\/v1\/object\/sign\/saattueten\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg\?.*token=/;
const LOKALE_HOSTS = new Set(['127.0.0.1', 'localhost']);

// ---------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------

interface Fotozeile {
  client_id: string;
  sorte_id: string;
  saatgut_id: string | null;
  seite: string;
  pfad: string;
  storniert_am: Date | null;
}

/** Verbindung zur lokalen Datenbank (nur 127.0.0.1 oder localhost) */
function datenbank() {
  let ausgabe: string;
  try {
    ausgabe = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    ausgabe = execSync('npx --yes supabase@3.0.0 status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const dbUrl = /^DB_URL="?([^"\r\n]+)"?$/m.exec(ausgabe)?.[1];
  if (!dbUrl) throw new Error('Lokale Datenbank nicht gefunden: zuerst supabase start');
  if (!LOKALE_HOSTS.has(new URL(dbUrl).hostname)) throw new Error('E2E nur gegen die lokale Datenbank');
  const sql = postgres(dbUrl, { max: 1, onnotice: () => undefined });
  return {
    sql,
    /** gültige W0-Sorte nach sorte_key; fehlt sie, scheitert der Test sichtbar (Seed fehlt) */
    async sorte(sorteKey: string): Promise<{ id: string; name: string }> {
      const [z] = await sql<{ id: string; name: string }[]>`
        select s.sorte_id::text as id, s.name from public.sorte s
          join public.sorte_schluessel k on k.id = s.sorte_id
         where k.sorte_key = ${sorteKey} and s.gueltig_bis is null`;
      if (!z) throw new Error(`W0-Sorte ${sorteKey} fehlt: zuerst npm run seed -- --ziel lokal`);
      return z;
    },
    async sorteNachName(name: string): Promise<string | undefined> {
      const [z] = await sql<{ id: string }[]>`
        select sorte_id::text as id from public.sorte where name = ${name} and gueltig_bis is null`;
      return z?.id;
    },
    /** storniert die gültigen Fotos der Sorte (A14; die Service-Rolle löscht nicht) */
    async fotosStornieren(sorteId: string): Promise<void> {
      await sql`update public.tuetenfoto set storniert_am = now()
                 where sorte_id = ${sorteId}::uuid and storniert_am is null`;
    },
    async jetzt(): Promise<Date> {
      const [z] = await sql<{ t: Date }[]>`select clock_timestamp() as t`;
      if (!z) throw new Error('keine Uhrzeit aus der Datenbank');
      return z.t;
    },
    /** Zeilen tuetenfoto der Sorte seit `ab`, nach erfasst_am */
    async fotos(sorteId: string, ab: Date): Promise<Fotozeile[]> {
      return sql<Fotozeile[]>`
        select client_id::text, sorte_id::text, saatgut_id::text, seite, pfad, storniert_am
          from public.tuetenfoto where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}
         order by erfasst_am, id`;
    },
    async packungen(sorteId: string, ab: Date): Promise<string[]> {
      const z = await sql<{ id: string }[]>`
        select id::text from public.saatgut where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}`;
      return z.map((r) => r.id);
    },
  };
}

/** JPEG aus dem Canvas des Browsers (wie sorten-exif.spec.ts, ohne EXIF) */
async function testbild(page: Page, farbe: string, text: string): Promise<Buffer> {
  const base64 = await page.evaluate(
    ({ farbe, text }) => {
      const c = document.createElement('canvas');
      c.width = 900;
      c.height = 600;
      const g = c.getContext('2d');
      if (!g) throw new Error('kein Canvas');
      g.fillStyle = farbe;
      g.fillRect(0, 0, 900, 600);
      g.fillStyle = '#ffffff';
      g.font = '96px sans-serif';
      g.fillText(text, 80, 330);
      return c.toDataURL('image/jpeg', 0.9).split(',')[1] ?? '';
    },
    { farbe, text },
  );
  return Buffer.from(base64, 'base64');
}

const dateiFeld = (page: Page, label: 'Vorderseite' | 'Rückseite') =>
  page.locator(`input[type=file][aria-label="${label}"]`);
const fotoFeld = (page: Page, label: 'Vorderseite' | 'Rückseite') =>
  page.locator('.hv-photo').filter({ has: dateiFeld(page, label) });
const seitenwahl = (page: Page, seite: 'Vorderseite' | 'Rückseite') => {
  const gruppe = page.getByRole('group', { name: 'Seite der Tüte' });
  return gruppe
    .getByRole('button', { name: seite, exact: true })
    .or(gruppe.getByRole('radio', { name: seite, exact: true }));
};
const bildVorne = (page: Page) => page.getByRole('img', { name: 'Tütenfoto Vorderseite', exact: true });
const bildHinten = (page: Page) => page.getByRole('img', { name: 'Tütenfoto Rückseite', exact: true });

/** Pfad im Bucket aus dem signierten Link */
function pfadAus(src: string | null): string {
  const treffer = /\/object\/sign\/saattueten\/([^?]+)/.exec(src ?? '');
  return treffer?.[1] ? decodeURIComponent(treffer[1]) : '';
}

/** das Bild ist wirklich geladen (Link gültig, Inhalt ein Bild) */
async function geladen(bild: Locator): Promise<void> {
  await expect
    .poll(
      () => bild.evaluate((b) => (b as HTMLImageElement).complete && (b as HTMLImageElement).naturalWidth),
      {
        timeout: 15_000,
      },
    )
    .toBeGreaterThan(0);
}

async function fotoWaehlen(page: Page, label: 'Vorderseite' | 'Rückseite', bild: Buffer): Promise<void> {
  await dateiFeld(page, label).setInputFiles({ name: `${label}.jpg`, mimeType: 'image/jpeg', buffer: bild });
}

const knopf = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).or(page.getByRole('link', { name, exact: true }));

function kiOk(name: string, art: string) {
  return {
    ergebnis: 'ok',
    modell: 'claude-haiku-5-5',
    felder: {
      name,
      art,
      keimart: 'licht',
      keimtemperatur_min_c: 15,
      keimtemperatur_max_c: 20,
      keimdauer_min_d: 7,
      keimdauer_max_d: 14,
      kulturdauer_min_d: 50,
      kulturdauer_max_d: 70,
      aussaat_von_monat: 3,
      aussaat_bis_monat: 8,
      hersteller: 'Beispiel Saaten',
    },
    verworfen: [],
    dauerMs: 1200,
    ausweichmodell: false,
  };
}

const NICHT_EINGERICHTET = {
  ergebnis: 'abgebrochen',
  grund: 'nicht_eingerichtet',
  hinweis: 'Die Recherche ist noch nicht eingerichtet. Lege die Saatempfehlung von Hand an.',
  dauerMs: 0,
};

/** ki-tuete und ki-recherche über page.route; liefert die Anfragen an ki-tuete */
async function kiNachbilden(page: Page, antwort: object): Promise<Record<string, unknown>[]> {
  const tuete: Record<string, unknown>[] = [];
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    tuete.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: antwort });
  });
  await page.route(`${FUNKTIONEN}/ki-recherche`, (route) => route.fulfill({ json: NICHT_EINGERICHTET }));
  return tuete;
}

// ---------------------------------------------------------------------
// TF1-AK4 Detail der Sorte am Schreibtisch (lokale Datenbank und Storage)
// ---------------------------------------------------------------------

test('TF1-AK4 Detail der Sorte: Vorder- und Rückseite ergänzen, Wechsel der Seite, Foto ersetzen storniert das alte', async ({
  page,
  konto,
}) => {
  const db = datenbank();
  try {
    const sorte = await db.sorte('sorte-mangold-bright-lights');
    await db.fotosStornieren(sorte.id);
    const start = await db.jetzt();
    await konto.anmelden(page);
    await page.goto(`/#/sorten/${sorte.id}`);
    await expect(page.getByRole('heading', { name: sorte.name, level: 1 })).toBeVisible();
    await expect(page.getByText('Tütenfoto', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'Noch kein Tütenfoto' })).toBeVisible();
    await expect(fotoFeld(page, 'Vorderseite')).toContainText('Tütenfoto ergänzen');
    await expect(fotoFeld(page, 'Rückseite')).toContainText('Tütenfoto ergänzen');

    // Vorderseite ergänzen
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#2e7d32', 'Vorne eins'));
    await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    await geladen(bildVorne(page));
    await expect(page.getByRole('img', { name: 'Noch kein Tütenfoto' })).toHaveCount(0);
    await expect(fotoFeld(page, 'Vorderseite')).toContainText('Foto ersetzen');
    await expect(fotoFeld(page, 'Rückseite')).toContainText('Tütenfoto ergänzen');
    // nur eine Seite: keine Wahl der Seite (A9)
    await expect(page.getByRole('group', { name: 'Seite der Tüte' })).toHaveCount(0);

    // Rückseite ergänzen
    await fotoWaehlen(page, 'Rückseite', await testbild(page, '#1565c0', 'Hinten'));
    await expect(fotoFeld(page, 'Rückseite')).toContainText('Foto ersetzen', { timeout: 15_000 });
    await expect(page.getByRole('group', { name: 'Seite der Tüte' })).toBeVisible();
    // Start mit der Vorderseite
    await expect(bildVorne(page)).toBeVisible();

    // Wechsel der Seite
    await seitenwahl(page, 'Rückseite').click();
    await expect(bildHinten(page)).toBeVisible();
    await expect(bildHinten(page)).toHaveAttribute('src', SIGNIERTER_LINK);
    await geladen(bildHinten(page));
    const pfadHinten = pfadAus(await bildHinten(page).getAttribute('src'));
    await seitenwahl(page, 'Vorderseite').click();
    await expect(bildVorne(page)).toBeVisible();
    const pfadAlt = pfadAus(await bildVorne(page).getAttribute('src'));
    expect(pfadAlt).toMatch(new RegExp(`^${sorte.id}/[0-9a-f-]{36}\\.jpg$`));
    expect(pfadHinten).not.toBe(pfadAlt);

    // Foto ersetzen: neues Foto, das alte storniert
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#c62828', 'Vorne zwei'));
    await expect
      .poll(
        async () => {
          if (await seitenwahl(page, 'Vorderseite').isVisible())
            await seitenwahl(page, 'Vorderseite').click();
          return pfadAus(await bildVorne(page).getAttribute('src'));
        },
        { timeout: 15_000 },
      )
      .not.toBe(pfadAlt);
    await geladen(bildVorne(page));
    const pfadNeu = pfadAus(await bildVorne(page).getAttribute('src'));
    expect(pfadNeu).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/);

    const zeilen = await db.fotos(sorte.id, start);
    expect(zeilen).toHaveLength(3);
    for (const z of zeilen) {
      expect(z.sorte_id).toBe(sorte.id);
      expect(z.saatgut_id).toBeNull();
    }
    const gueltig = zeilen.filter((z) => z.storniert_am === null);
    expect(gueltig.map((z) => z.seite).sort()).toEqual(['hinten', 'vorne']);
    expect(gueltig.find((z) => z.seite === 'vorne')?.pfad).toBe(pfadNeu);
    expect(gueltig.find((z) => z.seite === 'hinten')?.pfad).toBe(pfadHinten);
    const alt = zeilen.find((z) => z.pfad === pfadAlt);
    expect(alt?.seite).toBe('vorne');
    expect(alt?.storniert_am).not.toBeNull();
  } finally {
    await db.sql.end();
  }
});

// ---------------------------------------------------------------------
// TF1-AK5 Säen-Detail über die nachgebildete REST-Schnittstelle (A18)
// ---------------------------------------------------------------------

const JETZT = new Date('2027-01-07T08:00:00Z');
const FOTO_LOLLO = {
  id: uid('2b', 1),
  client_id: uid('2b', 2),
  sorte_id: SORTE.lollo,
  saatgut_id: null,
  seite: 'vorne',
  pfad: `${SORTE.lollo}/${uid('2b', 3)}.jpg`,
  erfasst_am: '2027-01-06T10:00:00.000Z',
  storniert_am: null,
  app_version: 'e2e',
};

interface Signieren {
  /** Anfrage-Bodies an …/object/sign/saattueten/<pfad> */
  anfragen: { pfad: string; body: Record<string, unknown> }[];
  /** Abrufe des signierten Links */
  abrufe: string[];
  offline: boolean;
}

async function saeenOeffnen(page: Page): Promise<Signieren> {
  // Test-JPEG vor dem Laden der App, auf about:blank
  const jpeg = await testbild(page, '#6a1b9a', 'Lollo');
  const daten: Teile = structuredClone(saatTeile(JETZT, { ohneSatzIn23: true }));
  daten['tuetenfoto'] = [{ ...FOTO_LOLLO }];
  const s: Signieren = { anfragen: [], abrufe: [], offline: false };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, JETZT);
    },
    () => undefined,
  );
  await page.route(SIGNIEREN, async (route: Route) => {
    if (s.offline) return route.abort('internetdisconnected');
    const anfrage = route.request();
    const url = new URL(anfrage.url());
    const pfad = decodeURIComponent(url.pathname.replace(/^.*\/object\/sign\/saattueten\//, ''));
    if (anfrage.method() === 'POST') {
      s.anfragen.push({ pfad, body: (anfrage.postDataJSON() ?? {}) as Record<string, unknown> });
      return route.fulfill({
        json: { signedURL: `/object/sign/saattueten/${pfad}?token=e2e-token-${s.anfragen.length}` },
      });
    }
    s.abrufe.push(url.toString());
    return route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpeg });
  });
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/saeen?box=R-A1');
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  return s;
}

test('TF1-AK5 Säen-Detail zeigt das Foto über einen signierten Link mit 60 s', async ({ page }) => {
  const s = await saeenOeffnen(page);
  await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
  const bild = bildVorne(page);
  await expect(bild).toBeVisible();
  await expect(bild).toHaveAttribute('src', SIGNIERTER_LINK);
  await expect(bild).toHaveAttribute('src', /token=e2e-token-/);
  await geladen(bild);
  await expect(page.getByRole('img', { name: 'Noch kein Tütenfoto' })).toHaveCount(0);
  expect(s.anfragen.length).toBeGreaterThanOrEqual(1);
  for (const a of s.anfragen) {
    expect(a.pfad).toBe(FOTO_LOLLO.pfad);
    expect(a.body['expiresIn']).toBe(60);
  }
  expect(s.abrufe.some((u) => u.includes(FOTO_LOLLO.pfad))).toBe(true);
  // nur Vorderseite: keine Wahl der Seite (A9)
  await expect(page.getByRole('group', { name: 'Seite der Tüte' })).toHaveCount(0);
});

test('TF1-AK5 ohne Foto «Noch kein Tütenfoto»', async ({ page }) => {
  const s = await saeenOeffnen(page);
  await sorteOeffnen(page, 'Salat', 'Eichblatt');
  const platzhalter = page.getByRole('img', { name: 'Noch kein Tütenfoto' });
  await expect(platzhalter).toBeVisible();
  await expect(platzhalter).toContainText('Noch kein Tütenfoto');
  await expect(bildVorne(page)).toHaveCount(0);
  // ohne Zeile tuetenfoto wird nichts signiert
  expect(s.anfragen).toEqual([]);
});

test('TF1-AK5 ohne Verbindung «Foto nur mit Verbindung»', async ({ page }) => {
  const s = await saeenOeffnen(page);
  await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
  await geladen(bildVorne(page));

  // offline, Detail in der App neu öffnen (ohne page.goto)
  s.offline = true;
  await page.context().setOffline(true);
  try {
    await page.getByRole('button', { name: 'Zurück zu Salat', exact: true }).click();
    await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
    const offline = page.getByRole('img', { name: 'Foto nur mit Verbindung' });
    await expect(offline).toBeVisible({ timeout: 15_000 });
    await expect(offline).toContainText('Foto nur mit Verbindung');
    // Status als Text, nicht nur über Farbe
    await expect(offline).toContainText(/online/);
    await expect(bildVorne(page)).toHaveCount(0);

    // Sorte ohne Foto zeigt offline weiter «Noch kein Tütenfoto»
    await page.getByRole('button', { name: 'Zurück zu Salat', exact: true }).click();
    await sorteOeffnen(page, 'Salat', 'Eichblatt');
    await expect(page.getByRole('img', { name: 'Noch kein Tütenfoto' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Foto nur mit Verbindung' })).toHaveCount(0);
  } finally {
    await page.context().setOffline(false);
  }
});

// ---------------------------------------------------------------------
// TF1-AK6 «Neue Sorte» und «Packung zu …» (lokale Datenbank und Storage)
// ---------------------------------------------------------------------

test('TF1-AK6 Neue Sorte mit Fotos schreibt tuetenfoto, das Foto erscheint im Detail', async ({
  page,
  konto,
}) => {
  const db = datenbank();
  try {
    const start = await db.jetzt();
    const name = `Tütentest ${randomUUID().slice(0, 8)}`;
    const tuete = await kiNachbilden(page, kiOk(name, 'Salat'));
    await konto.anmelden(page);
    await page.goto('/#/sorten/neu');
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#ef6c00', 'Neu vorne'));
    await fotoWaehlen(page, 'Rückseite', await testbild(page, '#00838f', 'Neu hinten'));
    await knopf(page, 'Tüte lesen').click();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name, { timeout: 15_000 });
    const fotopfade = (tuete[0]?.['fotopfade'] ?? []) as string[];
    expect(fotopfade).toHaveLength(2);
    await knopf(page, 'Weiter').click();
    await page.getByRole('radio', { name: 'Blatt', exact: true }).check();
    await knopf(page, 'Weiter').click();
    await page.getByLabel('Bestand in Korn').fill('120');
    await knopf(page, 'Sorte speichern').click();
    await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });

    const sorteId = await db.sorteNachName(name);
    expect(sorteId).toMatch(/^[0-9a-f-]{36}$/);
    const id = sorteId ?? '';
    const [packung] = await db.packungen(id, start);
    expect(packung).toBeDefined();
    const zeilen = await db.fotos(id, start);
    expect(zeilen).toHaveLength(2);
    expect(zeilen.map((z) => [z.seite, z.pfad])).toEqual([
      ['vorne', fotopfade[0]],
      ['hinten', fotopfade[1]],
    ]);
    for (const z of zeilen) {
      expect(z.saatgut_id).toBe(packung);
      expect(z.storniert_am).toBeNull();
      expect(z.pfad.startsWith(`${id}/`)).toBe(true);
    }

    await knopf(page, 'Sorte öffnen').click();
    await expect(page).toHaveURL(new RegExp(`#/sorten/${id}$`));
    await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    expect(pfadAus(await bildVorne(page).getAttribute('src'))).toBe(fotopfade[0]);
    await geladen(bildVorne(page));
    await expect(fotoFeld(page, 'Vorderseite')).toContainText('Foto ersetzen');
    await expect(fotoFeld(page, 'Rückseite')).toContainText('Foto ersetzen');
  } finally {
    await db.sql.end();
  }
});

test('TF1-AK6 «Ohne KI weiter» mit gewählten Fotos lädt sie beim Speichern hoch und schreibt tuetenfoto (A13)', async ({
  page,
  konto,
}) => {
  const db = datenbank();
  try {
    const start = await db.jetzt();
    const name = `Tütentest ${randomUUID().slice(0, 8)}`;
    const tuete = await kiNachbilden(page, kiOk('nie gelesen', 'Salat'));
    await konto.anmelden(page);
    await page.goto('/#/sorten/neu');
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#5d4037', 'Ohne KI'));
    await knopf(page, 'Ohne KI weiter').click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Art', { exact: true }).selectOption('lactuca_sativa');
    await knopf(page, 'Weiter').click();
    await page.getByRole('radio', { name: 'Blatt', exact: true }).check();
    await knopf(page, 'Weiter').click();
    await page.getByLabel('Bestand in Korn').fill('80');
    await knopf(page, 'Sorte speichern').click();
    await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });
    // die KI wurde nicht gerufen
    expect(tuete).toEqual([]);

    const id = (await db.sorteNachName(name)) ?? '';
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const zeilen = await db.fotos(id, start);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]?.seite).toBe('vorne');
    expect(zeilen[0]?.pfad).toMatch(new RegExp(`^${id}/[0-9a-f-]{36}\\.jpg$`));
    const [packung] = await db.packungen(id, start);
    expect(zeilen[0]?.saatgut_id).toBe(packung);

    await knopf(page, 'Sorte öffnen').click();
    await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    await geladen(bildVorne(page));
  } finally {
    await db.sql.end();
  }
});

test('TF1-AK6 Packung zu … schreibt tuetenfoto der bestehenden Sorte', async ({ page, konto }) => {
  const db = datenbank();
  try {
    const sorte = await db.sorte('sorte-spinat-butterfly');
    await db.fotosStornieren(sorte.id);
    const start = await db.jetzt();
    const tuete = await kiNachbilden(page, kiOk(sorte.name, 'Spinat'));
    await konto.anmelden(page);
    await page.goto('/#/sorten/neu');
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#33691e', 'Packung'));
    await knopf(page, 'Tüte lesen').click();
    await expect(page.getByText(new RegExp(`${sorte.name} gibt es schon`, 'i'))).toBeVisible({
      timeout: 15_000,
    });
    const fotopfade = (tuete[0]?.['fotopfade'] ?? []) as string[];
    expect(fotopfade).toHaveLength(1);
    await knopf(page, `Packung zu ${sorte.name} erfassen`).click();
    await page.getByLabel('Bestand in Korn').fill('60');
    await knopf(page, 'Packung speichern').click();
    await expect(page.getByText(`Gespeichert: Packung zu ${sorte.name}`)).toBeVisible({ timeout: 15_000 });

    const zeilen = await db.fotos(sorte.id, start);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]?.seite).toBe('vorne');
    expect(zeilen[0]?.pfad).toBe(fotopfade[0]);
    // Plan 37 A16: der Pfad liegt unter der beim Öffnen erzeugten, ungenutzten sorte_id
    expect(zeilen[0]?.pfad.startsWith(`${sorte.id}/`)).toBe(false);
    const [packung] = await db.packungen(sorte.id, start);
    expect(packung).toBeDefined();
    expect(zeilen[0]?.saatgut_id).toBe(packung);

    await knopf(page, 'Sorte öffnen').click();
    await expect(page).toHaveURL(new RegExp(`#/sorten/${sorte.id}$`));
    await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    expect(pfadAus(await bildVorne(page).getAttribute('src'))).toBe(fotopfade[0]);
    await geladen(bildVorne(page));
  } finally {
    await db.sql.end();
  }
});
