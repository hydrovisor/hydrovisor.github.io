// Saatgut-Manager: Liste «Saatgut», «Tüte erfassen», «Fotos nachtragen» (Issue #211, Plan 211 Testliste E2E;
// SG1-AK4 bis SG1-AK7; Konzept 6.1 UC4, 6.3, 8.1 Regel 2, 11.3; Plan 37 A16; Plan 207). 360 × 640 aus der
// Konfiguration. Die Claude API wird nie aufgerufen: ki-tuete und ki-recherche sind über page.route gemockt.
// Testbilder erzeugt der Test im Canvas des Browsers. Keine Personendaten; erfundene Sortennamen nur für neue Sorten.
//
// Alle Tests laufen gegen die lokale Datenbank und den lokalen Storage (Fixture konto.ts; vorher
// npm run seed -- --ziel lokal, W0 mit echten Sorten). Jeder Test nutzt eigene W0-Sorten (sorte_key, Plan 211 A17:
// Bull's Blood, glatt, Twiggy, Genoveser, Pourpre) und storniert vorher deren gültige Fotos; geprüft werden nur Zeilen
// ab dem Start des Tests, Zahlen nur relativ (Knopf gegen Filter, n gegen n − 1).
// Bildschirmfotos für Abnahme 1 hängen am Testbericht (test-results/<test>/…png).
//
// Erwartete Oberfläche (Plan 211 Oberfläche; design-system/components/Sortenzeile.md, PhotoField.md, Choice.md):
// - #/sorten: h1 «Saatgut»; Knopf «Tüte erfassen»; Knopf «Fotos nachtragen · n ohne Foto» (nur bei n > 0); Link
//   «Von Hand erfassen» auf #/sorten/neu; Gruppe «Filter» mit «Vorrätig · n» und «Ohne Foto · n» (aria-pressed).
//   Je Gemüse eine section als region mit dem Namen der Art (art.name_de); darin je Sorte ein Link (Sortenzeile), dessen
//   Name mit dem Sortennamen beginnt; Zusatzzeile «vollständig» oder «Recherche offen», ohne Foto ergänzt um
//   « · ohne Foto». Tütenbild in .hv-sortenzeile-bild: img (alt="") mit signiertem Link oder svg-Platzhalter.
// - «Tüte erfassen»: h1 «Tüte erfassen», ol[aria-label="Schritte"] mit aria-current="step"; PhotoField «Vorderseite»
//   und «Rückseite» (input type=file mit aria-label); Knöpfe «Ohne Rückseite lesen» bzw. «Tüte lesen»; Ergebnis mit
//   Feld «Name», Auswahl «Art» (Wert art_id), Gruppe «Kulturtyp» (Choice, aria-pressed); «Sorte speichern»; erkannt:
//   «<Name> gibt es schon» mit «Packung zu <Name> hinzufügen». Fertig: «Gespeichert: <Name> mit Packung» bzw.
//   «Gespeichert: Packung zu <Name>», Link «Sorte öffnen», Knopf «Zum Saatgut».
// - «Fotos nachtragen»: h1 «Fotos nachtragen», h2 «<nummer> von <gesamt>: <Sorte>», Gemüse als Text; PhotoField
//   «Vorderseite», danach «Vorderseite gespeichert», PhotoField «Rückseite» («Rückseite gespeichert»); «Weiter»,
//   «Überspringen», «Beenden»; Ende h2 «Fertig», «Fertig: x ergänzt, y übersprungen», «Zum Saatgut».
import { randomUUID } from 'node:crypto';
import { type Locator, type Page, type TestInfo } from '@playwright/test';
import { expect, test } from './konto.ts';
import {
  bildVorne,
  datenbank,
  fotoFeld,
  fotoWaehlen,
  FUNKTIONEN,
  geladen,
  kiOk,
  knopf,
  NICHT_EINGERICHTET,
  pfadAus,
  SIGNIERTER_LINK,
  testbild,
} from './lokal-db.ts';

// ---------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------

interface KiMitschnitt {
  tuete: Record<string, unknown>[];
  recherche: Record<string, unknown>[];
  /** Aufrufe der RPC wissen_app_schreiben */
  wissen: string[];
}

/** ki-tuete und ki-recherche über page.route; zählt dazu die Aufrufe von wissen_app_schreiben */
async function kiNachbilden(page: Page, antwort: object): Promise<KiMitschnitt> {
  const m: KiMitschnitt = { tuete: [], recherche: [], wissen: [] };
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    m.tuete.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: antwort });
  });
  await page.route(`${FUNKTIONEN}/ki-recherche`, async (route) => {
    m.recherche.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: NICHT_EINGERICHTET });
  });
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/rest/v1/rpc/wissen_app_schreiben'))
      m.wissen.push(r.url());
  });
  return m;
}

/** Bildschirmfoto in test-results/ und am Bericht (für Abnahme 1) */
async function bildschirm(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const pfad = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: pfad, fullPage: true });
  await testInfo.attach(name, { path: pfad, contentType: 'image/png' });
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
}

const filter = (page: Page, titel: RegExp): Locator => {
  const gruppe = page.getByRole('group', { name: 'Filter' });
  return gruppe.getByRole('button', { name: titel }).or(gruppe.getByRole('radio', { name: titel }));
};
const NACHTRAGEN = /^Fotos nachtragen · (\d+) ohne Foto$/;
const OHNE_FOTO = /^Ohne Foto · (\d+)$/;
const VORRAETIG = /^Vorrätig · (\d+)$/;

/** Zahl aus dem zugänglichen Namen eines Knopfs */
async function zahlAus(knopf: Locator, muster: RegExp): Promise<number> {
  const name = (await knopf.getAttribute('aria-label')) ?? (await knopf.innerText());
  const treffer = muster.exec(name.replace(/\s+/g, ' ').trim());
  if (!treffer?.[1]) throw new Error(`keine Zahl in «${name}»`);
  return Number(treffer[1]);
}

const nachtragenKnopf = (page: Page) => page.getByRole('button', { name: NACHTRAGEN });

async function saatgutOeffnen(page: Page): Promise<void> {
  await page.goto('/#/sorten');
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible({ timeout: 15_000 });
}

const schrittAktiv = (page: Page) => page.locator('ol[aria-label="Schritte"] [aria-current="step"]');

// Leiste unten wie tests/e2e/leiste.spec.ts: nav «Hauptnavigation», Rahmen mit data-leiste (Plan 211 A1, #212)
const leiste = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });
const rahmen = (page: Page) => page.locator('[data-leiste]');
async function ohneLeiste(page: Page): Promise<void> {
  await expect(rahmen(page)).toHaveAttribute('data-leiste', 'keine');
  await expect(leiste(page)).toHaveCount(0);
}
async function mitLeisteSaatgut(page: Page): Promise<void> {
  await expect(rahmen(page)).toHaveAttribute('data-leiste', 'saatgut');
  await expect(leiste(page)).toBeVisible();
}

/** Vorderseite einer W0-Sorte im Detail ergänzen (Weg aus TF1-AK4) */
async function vorderseiteImDetail(page: Page, sorteId: string): Promise<void> {
  await page.goto(`/#/sorten/${sorteId}`);
  await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#6d4c41', 'Randen'));
  await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
  await expect(fotoFeld(page, 'Vorderseite')).toContainText('Foto ersetzen');
}

// ---------------------------------------------------------------------
// SG1-AK4 Liste «Saatgut»
// ---------------------------------------------------------------------

test('SG1-AK4 Saatgut zeigt Titel, Tüte erfassen, Fotos nachtragen, Filter, Gruppen nach Gemüse mit Tütenbild oder Platzhalter, Status als Wort, keinen Bestand, ohne waagrechtes Scrollen', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  try {
    const bull = await db.sorteMitArt('sorte-randen-bull-s-blood');
    const glatt = await db.sorteMitArt('sorte-petersilie-glatt');
    await db.fotosStornieren(bull.id);
    await db.fotosStornieren(glatt.id);
    await konto.anmelden(page);
    await vorderseiteImDetail(page, bull.id);

    await saatgutOeffnen(page);
    await expect(knopf(page, 'Tüte erfassen')).toBeVisible();
    await mitLeisteSaatgut(page);
    await expect(nachtragenKnopf(page)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Von Hand erfassen', exact: true })).toBeVisible();
    await expect(filter(page, VORRAETIG)).toHaveAttribute('aria-pressed', 'true');
    await expect(filter(page, OHNE_FOTO)).toHaveAttribute('aria-pressed', 'false');
    const n = await zahlAus(nachtragenKnopf(page), NACHTRAGEN);
    expect(n).toBeGreaterThan(0);
    expect(await zahlAus(filter(page, OHNE_FOTO), OHNE_FOTO)).toBe(n);

    // Gruppe Randen: Bull's Blood mit Tütenbild über signierten Link
    const randen = page.getByRole('region', { name: bull.nameDe, exact: true });
    await expect(randen.getByRole('heading', { name: bull.nameDe, level: 2 })).toBeVisible();
    const zeileBull = randen.getByRole('link', { name: new RegExp(`^${bull.name}`) });
    await expect(zeileBull).toHaveCount(1);
    await zeileBull.scrollIntoViewIfNeeded();
    const bild = zeileBull.locator('.hv-sortenzeile-bild img');
    await expect(bild).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    await geladen(bild);
    await expect(zeileBull).toContainText(/vollständig|Recherche offen/);
    await expect(zeileBull).not.toContainText('ohne Foto');
    await expect(zeileBull).toHaveAttribute('href', new RegExp(`#/sorten/${bull.id}$`));
    await bildschirm(page, testInfo, 'saatgut-liste-randen');

    // Gruppe Petersilie: glatt ohne Foto mit Platzhalter und Wort
    const petersilie = page.getByRole('region', { name: glatt.nameDe, exact: true });
    const zeileGlatt = petersilie.getByRole('link', { name: new RegExp(`^${glatt.name}`) });
    await expect(zeileGlatt).toHaveCount(1);
    await expect(zeileGlatt.locator('.hv-sortenzeile-bild svg')).toHaveCount(1);
    await expect(zeileGlatt.locator('.hv-sortenzeile-bild img')).toHaveCount(0);
    await expect(zeileGlatt).toContainText('ohne Foto');
    await expect(zeileGlatt).toContainText(/(vollständig|Recherche offen) · ohne Foto/);

    // kein Bestand in Korn, kein waagrechtes Scrollen
    await expect(page.getByText(/Korn/)).toHaveCount(0);
    await ohneWaagrechtesScrollen(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await bildschirm(page, testInfo, 'saatgut-liste-kopf');
  } finally {
    await db.sql.end();
  }
});

test('SG1-AK4 Filter Ohne Foto blendet Sorten mit Foto aus', async ({ page, konto }, testInfo) => {
  const db = datenbank();
  try {
    const bull = await db.sorteMitArt('sorte-randen-bull-s-blood');
    const glatt = await db.sorteMitArt('sorte-petersilie-glatt');
    await db.fotosStornieren(bull.id);
    await db.fotosStornieren(glatt.id);
    await konto.anmelden(page);
    await vorderseiteImDetail(page, bull.id);

    await saatgutOeffnen(page);
    const randen = page.getByRole('region', { name: bull.nameDe, exact: true });
    await expect(randen.getByRole('link', { name: new RegExp(`^${bull.name}`) })).toHaveCount(1);
    const vorraetig = await zahlAus(filter(page, VORRAETIG), VORRAETIG);

    await filter(page, OHNE_FOTO).click();
    await expect(filter(page, OHNE_FOTO)).toHaveAttribute('aria-pressed', 'true');
    await expect(filter(page, VORRAETIG)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('link', { name: new RegExp(`^${bull.name}`) })).toHaveCount(0);
    const petersilie = page.getByRole('region', { name: glatt.nameDe, exact: true });
    await expect(petersilie.getByRole('link', { name: new RegExp(`^${glatt.name}`) })).toBeVisible();

    const ohneFoto = await zahlAus(filter(page, OHNE_FOTO), OHNE_FOTO);
    expect(ohneFoto).toBeLessThan(vorraetig);
    const zeilen = page.locator('section[aria-labelledby] a.hv-sortenzeile');
    await expect(zeilen).toHaveCount(ohneFoto);
    for (const z of await zeilen.all()) await expect(z).toContainText('ohne Foto');
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'saatgut-filter-ohne-foto');

    // zurück auf «Vorrätig»: Bull's Blood wieder da
    await filter(page, VORRAETIG).click();
    await expect(randen.getByRole('link', { name: new RegExp(`^${bull.name}`) })).toHaveCount(1);
    await expect(zeilen).toHaveCount(vorraetig);
  } finally {
    await db.sql.end();
  }
});

test('SG1-AK4 Von Hand erfassen öffnet Neue Sorte', async ({ page, konto }) => {
  await konto.anmelden(page);
  await saatgutOeffnen(page);
  await page.getByRole('link', { name: 'Von Hand erfassen', exact: true }).click();
  await expect(page).toHaveURL(/#\/sorten\/neu$/);
  await expect(page.getByRole('heading', { name: 'Neue Sorte', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Bestand in Korn')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Zum Saatgut', exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------
// SG1-AK5 und SG1-AK6 «Tüte erfassen»
// ---------------------------------------------------------------------

test('SG1-AK5 Tüte erfassen mit Vorder- und Rückseite, unbekannte Sorte: Name und Art, Sorte speichern schreibt Sorte, Packung und zwei tuetenfoto, Recherche startet von selbst', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  try {
    const start = await db.jetzt();
    const name = `Saatguttest ${randomUUID().slice(0, 8)}`;
    const ki = await kiNachbilden(page, kiOk(name, 'Salat'));
    await konto.anmelden(page);
    await saatgutOeffnen(page);

    await knopf(page, 'Tüte erfassen').click();
    await expect(page.getByRole('heading', { name: 'Tüte erfassen', level: 1 })).toBeVisible();
    await ohneLeiste(page);
    await expect(schrittAktiv(page)).toContainText('Vorderseite');
    await expect(knopf(page, 'Abbrechen')).toBeVisible();
    await bildschirm(page, testInfo, 'tuete-schritt-1');
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#2e7d32', 'Vorne'));

    // ohne weiteren Tipp zu Schritt 2
    await expect(schrittAktiv(page)).toContainText('Rückseite');
    await expect(knopf(page, 'Ohne Rückseite lesen')).toBeVisible();
    await fotoWaehlen(page, 'Rückseite', await testbild(page, '#1565c0', 'Hinten'));
    await expect(fotoFeld(page, 'Rückseite')).toContainText('Foto ersetzen');
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'tuete-schritt-2');
    await knopf(page, 'Tüte lesen').click();

    // Schritt 3: Ergebnis der KI, unbekannte Sorte
    await expect(schrittAktiv(page)).toContainText('Ergebnis');
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name, { timeout: 15_000 });
    await expect(page.getByLabel('Art', { exact: true })).toHaveValue('lactuca_sativa');
    const kulturtyp = page.getByRole('group', { name: 'Kulturtyp' });
    await expect(
      kulturtyp
        .getByRole('button', { name: 'Blatt', exact: true })
        .or(kulturtyp.getByRole('radio', { name: 'Blatt', exact: true })),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/gibt es schon/)).toHaveCount(0);
    expect(ki.tuete).toHaveLength(1);
    const fotopfade = (ki.tuete[0]?.['fotopfade'] ?? []) as string[];
    expect(fotopfade).toHaveLength(2);
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'tuete-schritt-3-neu');

    await knopf(page, 'Sorte speichern').click();
    await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/noch nicht eingerichtet/)).toBeVisible({ timeout: 15_000 });
    await bildschirm(page, testInfo, 'tuete-gespeichert-neu');

    // Datenbank: eine Sorte, eine Packung ohne Bestand, zwei Fotos unter dem Ordner der Sorte
    expect(await db.sortenNachName(name)).toBe(1);
    const sorteId = (await db.sorteNachName(name)) ?? '';
    expect(sorteId).toMatch(/^[0-9a-f-]{36}$/);
    const packungen = await db.packungZeilen(sorteId, start);
    expect(packungen).toHaveLength(1);
    expect(packungen[0]?.bestand_korn).toBeNull();
    expect(packungen[0]?.kaufdatum).toBeNull();
    expect(packungen[0]?.keimfaehigkeit_packung).toBeNull();
    const zeilen = await db.fotos(sorteId, start);
    expect(zeilen.map((z) => [z.seite, z.pfad])).toEqual([
      ['vorne', fotopfade[0]],
      ['hinten', fotopfade[1]],
    ]);
    for (const z of zeilen) {
      expect(z.saatgut_id).toBe(packungen[0]?.id);
      expect(z.storniert_am).toBeNull();
      expect(z.pfad.startsWith(`${sorteId}/`)).toBe(true);
    }
    // die Recherche startet von selbst, genau einmal
    expect(ki.recherche).toHaveLength(1);
    expect(ki.recherche[0]?.['sorte_id']).toBe(sorteId);

    await knopf(page, 'Sorte öffnen').click();
    await expect(page).toHaveURL(new RegExp(`#/sorten/${sorteId}$`));
    await expect(bildVorne(page)).toHaveAttribute('src', SIGNIERTER_LINK, { timeout: 15_000 });
    expect(pfadAus(await bildVorne(page).getAttribute('src'))).toBe(fotopfade[0]);
    await geladen(bildVorne(page));
  } finally {
    await db.sql.end();
  }
});

test('SG1-AK6 Tüte erfassen ohne Rückseite, vorhandene Sorte: Packung zu … hinzufügen schreibt Packung und ein tuetenfoto zur bestehenden Sorte, keine neue Sorte, keine Recherche', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  try {
    const sorte = await db.sorteMitArt('sorte-schnittlauch-twiggy');
    await db.fotosStornieren(sorte.id);
    const vorher = await db.sortenNachName(sorte.name);
    expect(vorher).toBe(1);
    const start = await db.jetzt();
    // abweichende Schreibweise: Anführungszeichen, Grossbuchstaben, Leerzeichen am Ende
    const ki = await kiNachbilden(page, kiOk(`„${sorte.name.toUpperCase()}“ `, sorte.nameDe));
    await konto.anmelden(page);
    await saatgutOeffnen(page);

    await knopf(page, 'Tüte erfassen').click();
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#33691e', 'Packung'));
    await expect(schrittAktiv(page)).toContainText('Rückseite');
    await knopf(page, 'Ohne Rückseite lesen').click();

    await expect(page.getByText(`${sorte.name} gibt es schon`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(`Gemüse: ${sorte.nameDe}`)).toBeVisible();
    expect(ki.tuete).toHaveLength(1);
    const fotopfade = (ki.tuete[0]?.['fotopfade'] ?? []) as string[];
    expect(fotopfade).toHaveLength(1);
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'tuete-schritt-3-erkannt');

    await knopf(page, `Packung zu ${sorte.name} hinzufügen`).click();
    await expect(page.getByText(`Gespeichert: Packung zu ${sorte.name}`)).toBeVisible({ timeout: 15_000 });
    await bildschirm(page, testInfo, 'tuete-gespeichert-packung');

    // keine neue Sorte, eine Packung zur bestehenden Sorte
    expect(await db.sortenNachName(sorte.name)).toBe(1);
    const packungen = await db.packungZeilen(sorte.id, start);
    expect(packungen).toHaveLength(1);
    expect(packungen[0]?.bestand_korn).toBeNull();
    const zeilen = await db.fotos(sorte.id, start);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toMatchObject({
      sorte_id: sorte.id,
      seite: 'vorne',
      saatgut_id: packungen[0]?.id,
      pfad: fotopfade[0],
      storniert_am: null,
    });
    // Plan 37 A16: der Pfad liegt unter der beim Öffnen erzeugten, ungenutzten sorte_id
    expect(zeilen[0]?.pfad.startsWith(`${sorte.id}/`)).toBe(false);
    // keine Recherche, kein Wissen geschrieben
    expect(ki.recherche).toEqual([]);
    expect(ki.wissen).toEqual([]);

    await knopf(page, 'Zum Saatgut').click();
    await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
  } finally {
    await db.sql.end();
  }
});

// ---------------------------------------------------------------------
// SG1-AK7 «Fotos nachtragen»
// ---------------------------------------------------------------------

const zaehler = (page: Page, text: string | RegExp) => page.getByRole('heading', { name: text, level: 2 });

test('SG1-AK7 Fotos nachtragen: 1 von n, Vorderseite gespeichert, Überspringen schreibt nichts, Beenden, Zahl ohne Foto gesunken', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  try {
    const genoveser = await db.sorteMitArt('sorte-basilikum-genoveser');
    const pourpre = await db.sorteMitArt('sorte-basilikum-pourpre');
    await db.fotosStornieren(genoveser.id);
    await db.fotosStornieren(pourpre.id);
    const start = await db.jetzt();
    await konto.anmelden(page);
    await saatgutOeffnen(page);

    const n = await zahlAus(nachtragenKnopf(page), NACHTRAGEN);
    expect(n).toBeGreaterThanOrEqual(3);
    await nachtragenKnopf(page).click();
    await expect(page.getByRole('heading', { name: 'Fotos nachtragen', level: 1 })).toBeVisible();
    await expect(zaehler(page, `1 von ${n}: ${genoveser.name}`)).toBeVisible();
    await ohneLeiste(page);
    await expect(page.getByText(genoveser.nameDe, { exact: true })).toBeVisible();
    await expect(knopf(page, 'Überspringen')).toBeVisible();
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'nachtragen-1-von-n');

    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#558b2f', 'Genoveser'));
    await expect(page.getByText('Vorderseite gespeichert')).toBeVisible({ timeout: 15_000 });
    await expect(fotoFeld(page, 'Vorderseite')).toContainText('Foto ersetzen');
    await expect(fotoFeld(page, 'Rückseite')).toBeVisible();
    await bildschirm(page, testInfo, 'nachtragen-vorderseite-gespeichert');
    await knopf(page, 'Weiter').click();

    await expect(zaehler(page, `2 von ${n}: ${pourpre.name}`)).toBeVisible();
    await knopf(page, 'Überspringen').click();
    await expect(zaehler(page, new RegExp(`^3 von ${n}: `))).toBeVisible();
    await knopf(page, 'Beenden').click();

    await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
    await mitLeisteSaatgut(page);
    await expect(
      page.getByRole('button', { name: `Fotos nachtragen · ${n - 1} ohne Foto`, exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const vorne = await db.fotos(genoveser.id, start);
    expect(vorne).toHaveLength(1);
    expect(vorne[0]).toMatchObject({
      seite: 'vorne',
      saatgut_id: null,
      storniert_am: null,
      sorte_id: genoveser.id,
    });
    expect(vorne[0]?.pfad).toMatch(new RegExp(`^${genoveser.id}/[0-9a-f-]{36}\\.jpg$`));
    expect(await db.fotos(pourpre.id, start)).toEqual([]);
  } finally {
    await db.sql.end();
  }
});

test('SG1-AK7 Rückseite optional und Ende «Fertig: 1 ergänzt, n−1 übersprungen»', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  try {
    const genoveser = await db.sorteMitArt('sorte-basilikum-genoveser');
    const pourpre = await db.sorteMitArt('sorte-basilikum-pourpre');
    await db.fotosStornieren(genoveser.id);
    await db.fotosStornieren(pourpre.id);
    const start = await db.jetzt();
    await konto.anmelden(page);
    await saatgutOeffnen(page);

    const n = await zahlAus(nachtragenKnopf(page), NACHTRAGEN);
    expect(n).toBeGreaterThanOrEqual(2);
    await nachtragenKnopf(page).click();
    await expect(zaehler(page, `1 von ${n}: ${genoveser.name}`)).toBeVisible();
    await ohneLeiste(page);
    await fotoWaehlen(page, 'Vorderseite', await testbild(page, '#558b2f', 'Vorne'));
    await expect(page.getByText('Vorderseite gespeichert')).toBeVisible({ timeout: 15_000 });
    await fotoWaehlen(page, 'Rückseite', await testbild(page, '#00838f', 'Hinten'));
    await expect(page.getByText('Rückseite gespeichert')).toBeVisible({ timeout: 15_000 });
    await bildschirm(page, testInfo, 'nachtragen-rueckseite-gespeichert');
    await knopf(page, 'Weiter').click();

    for (let i = 2; i <= n; i++) {
      await expect(zaehler(page, new RegExp(`^${i} von ${n}: `))).toBeVisible();
      await knopf(page, 'Überspringen').click();
    }
    await expect(zaehler(page, 'Fertig')).toBeVisible();
    await expect(page.getByText(`Fertig: 1 ergänzt, ${n - 1} übersprungen`)).toBeVisible();
    await bildschirm(page, testInfo, 'nachtragen-fertig');
    await knopf(page, 'Zum Saatgut').click();
    await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();

    const zeilen = await db.fotos(genoveser.id, start);
    const gueltig = zeilen.filter((z) => z.storniert_am === null);
    expect(gueltig.map((z) => z.seite).sort()).toEqual(['hinten', 'vorne']);
    for (const z of gueltig) expect(z.saatgut_id).toBeNull();
    expect(await db.fotos(pourpre.id, start)).toEqual([]);
  } finally {
    await db.sql.end();
  }
});
