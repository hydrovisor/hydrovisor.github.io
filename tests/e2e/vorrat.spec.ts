// Kein Saatgut mehr: Karte «Vorrat» im Detail der Sorte, Säen Schritt 1 und Filter «Aufgebraucht» im Saatgut
// (Issue #215, Plan 215 Testliste E2E; VR1-AK5 bis VR1-AK7; Konzept 6.1 UC5, 8.1 Regeln 2 und 3; G2). 360 × 640 aus
// der Konfiguration. Keine Personendaten.
//
// Alle Tests laufen gegen die lokale Datenbank (Fixture konto.ts; vorher npm run seed -- --ziel lokal, W0 mit echten
// Sorten). Jeder Test nutzt eigene W0-Sorten (Plan 215 A14: Tumbling Tom, Sweet Pickle, Prairie Fire) und storniert
// vorher und im finally deren gültige Vorrat-Ereignisse (vorratZuruecksetzen), damit kein anderer Test eine
// aufgebrauchte Sorte vorfindet. Geprüft werden nur Zeilen ab dem Start des Tests.
//
// Erwartete Oberfläche (Plan 215 Oberfläche):
// - #/sorten/<id>: Card «Vorrat» (section.hv-card mit h3 «Vorrat») nach der Infozeile. Vorrätig: StatusBadge «Vorrätig»
//   und Knopf «Kein Saatgut mehr»; aufgebraucht: StatusBadge «Aufgebraucht», Text «Säen zeigt diese Sorte nicht. …»
//   und Knopf «Wieder vorrätig». Verlauf als ul.hv-sorte-werte mit Zeilen «TT.MM.JJJJ · Kein Saatgut mehr» bzw.
//   «TT.MM.JJJJ · Wieder vorrätig», das jüngste zuerst; ohne Ereignis keine Liste.
// - #/saeen: Kachel des Gemüses, Sortenzeilen nur vorrätiger Sorten; Säen-Detail ohne Bestand in Korn.
// - #/sorten: Gruppe «Filter» mit «Vorrätig · n», «Ohne Foto · n», «Aufgebraucht · n»; Zusatzzeile «aufgebraucht».
import { type Locator, type Page, type TestInfo } from '@playwright/test';
import { expect, test } from './konto.ts';
import { datenbank, knopf } from './lokal-db.ts';
import { gemueseKachel, sorteOeffnen, sortenZeile } from './sortenwahl-hilfe.ts';

// ---------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------

const karte = (page: Page, titel: string): Locator =>
  page
    .locator('section.hv-card')
    .filter({ has: page.locator('h3.hv-card-title', { hasText: new RegExp(`^${titel}$`) }) });
const vorratKarte = (page: Page) => karte(page, 'Vorrat');
const badge = (page: Page) => vorratKarte(page).locator('.hv-badge');
const verlauf = (page: Page) => vorratKarte(page).locator('ul.hv-sorte-werte > li');

/** Kalendertag in Zürich wie die Anzeige (G2) */
const tagZuerich = (d: Date) =>
  new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);

async function detailOeffnen(page: Page, sorte: { id: string; name: string }): Promise<void> {
  await page.goto(`/#/sorten/${sorte.id}`);
  await expect(page.getByRole('heading', { name: sorte.name, level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(vorratKarte(page)).toBeVisible();
}

async function keinSaatgutMehr(page: Page): Promise<void> {
  await knopf(page, 'Kein Saatgut mehr').click();
  await expect(knopf(page, 'Wieder vorrätig')).toBeVisible({ timeout: 15_000 });
  await expect(badge(page)).toHaveText('Aufgebraucht');
}

async function wiederVorraetig(page: Page): Promise<void> {
  await knopf(page, 'Wieder vorrätig').click();
  await expect(knopf(page, 'Kein Saatgut mehr')).toBeVisible({ timeout: 15_000 });
  await expect(badge(page)).toHaveText('Vorrätig');
}

async function saeenGemuese(page: Page, gemuese: string): Promise<void> {
  await page.goto('/#/saeen');
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible({ timeout: 15_000 });
  await gemueseKachel(page, gemuese).click();
  await expect(page.getByRole('heading', { name: gemuese, level: 2 })).toBeVisible();
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
}

/** Bildschirmfoto in test-results/ und am Bericht (für Abnahme 1) */
async function bildschirm(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const pfad = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: pfad, fullPage: true });
  await testInfo.attach(name, { path: pfad, contentType: 'image/png' });
}

const filter = (page: Page, titel: RegExp): Locator => {
  const gruppe = page.getByRole('group', { name: 'Filter' });
  return gruppe.getByRole('button', { name: titel }).or(gruppe.getByRole('radio', { name: titel }));
};
const VORRAETIG = /^Vorrätig · (\d+)$/;
const OHNE_FOTO = /^Ohne Foto · (\d+)$/;
const AUFGEBRAUCHT = /^Aufgebraucht · (\d+)$/;

/** Zahl aus dem zugänglichen Namen eines Knopfs */
async function zahlAus(ziel: Locator, muster: RegExp): Promise<number> {
  const name = (await ziel.getAttribute('aria-label')) ?? (await ziel.innerText());
  const treffer = muster.exec(name.replace(/\s+/g, ' ').trim());
  if (!treffer?.[1]) throw new Error(`keine Zahl in «${name}»`);
  return Number(treffer[1]);
}

const listenLinks = (page: Page) => page.locator('.hv-saatgut-gruppe').getByRole('link');

// ---------------------------------------------------------------------
// VR1-AK5 Karte «Vorrat» im Detail der Sorte
// ---------------------------------------------------------------------

test('VR1-AK5 Kein Saatgut mehr setzt Aufgebraucht, Wieder vorrätig macht vorrätig, Packungen und Verlauf bleiben', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  let sorteId: string | undefined;
  try {
    const sorte = await db.sorte('sorte-tomate-tumbling-tom');
    sorteId = sorte.id;
    await db.vorratZuruecksetzen(sorte.id);
    const packungenVorher = await db.packungenGueltig(sorte.id);
    expect(packungenVorher).toBeGreaterThanOrEqual(1);
    const start = await db.jetzt();
    await konto.anmelden(page);

    await detailOeffnen(page, sorte);
    await expect(badge(page)).toHaveText('Vorrätig');
    await expect(knopf(page, 'Kein Saatgut mehr')).toBeVisible();
    await expect(knopf(page, 'Wieder vorrätig')).toHaveCount(0);
    await expect(verlauf(page)).toHaveCount(0);
    const packungen = karte(page, 'Packungen').locator('ul.hv-sorte-werte > li');
    const anzahlPackungen = await packungen.count();
    expect(anzahlPackungen).toBeGreaterThanOrEqual(1);

    // Kein Saatgut mehr
    await keinSaatgutMehr(page);
    await expect(knopf(page, 'Kein Saatgut mehr')).toHaveCount(0);
    await expect(vorratKarte(page)).toContainText(
      'Säen zeigt diese Sorte nicht. Eine neue Packung macht sie wieder vorrätig.',
    );
    const tag = tagZuerich(start);
    await expect(verlauf(page)).toHaveText([`${tag} · Kein Saatgut mehr`]);
    await expect(packungen).toHaveCount(anzahlPackungen);
    await bildschirm(page, testInfo, 'vorrat-aufgebraucht');

    // Wieder vorrätig
    await wiederVorraetig(page);
    await expect(knopf(page, 'Wieder vorrätig')).toHaveCount(0);
    await expect(verlauf(page)).toHaveText([`${tag} · Wieder vorrätig`, `${tag} · Kein Saatgut mehr`]);
    await expect(packungen).toHaveCount(anzahlPackungen);

    // nach dem Neuladen derselbe Stand aus dem Bündel
    await page.reload();
    await expect(vorratKarte(page)).toBeVisible({ timeout: 15_000 });
    await expect(badge(page)).toHaveText('Vorrätig');
    await expect(verlauf(page)).toHaveCount(2);
    await bildschirm(page, testInfo, 'vorrat-wieder-vorraetig');

    // Datenbank: zwei Ereignisse, keine Packung storniert, nichts gelöscht
    const zeilen = await db.vorratZeilen(sorte.id, start);
    expect(zeilen.map((z) => z.typ)).toEqual(['aufgebraucht', 'vorraetig']);
    for (const z of zeilen) {
      expect(z.sorte_id).toBe(sorte.id);
      expect(z.saatgut_id).toBeNull();
      expect(z.storniert_am).toBeNull();
    }
    expect(new Set(zeilen.map((z) => z.client_id)).size).toBe(2);
    expect(await db.packungenGueltig(sorte.id)).toBe(packungenVorher);
  } finally {
    try {
      if (sorteId) await db.vorratZuruecksetzen(sorteId);
    } finally {
      await db.sql.end();
    }
  }
});

// ---------------------------------------------------------------------
// VR1-AK6 Säen Schritt 1 nur mit vorrätigen Sorten
// ---------------------------------------------------------------------

test('VR1-AK6 Säen Schritt 1 zeigt eine aufgebrauchte Sorte nicht und nach Wieder vorrätig wieder', async ({
  page,
  konto,
}) => {
  const db = datenbank();
  let sorteId: string | undefined;
  try {
    const sorte = await db.sorteMitArt('sorte-chili-sweet-pickle');
    sorteId = sorte.id;
    // zwei Chili-Sorten, die kein VR-Test aufbraucht (Plan 215 A15)
    const basket = await db.sorte('sorte-chili-basket-of-fire-f1');
    const sibirisch = await db.sorte('sorte-chili-sibirischer-hauspaprika');
    await db.vorratZuruecksetzen(sorte.id);
    await konto.anmelden(page);

    // vorher: Sweet Pickle steht unter Chili
    await saeenGemuese(page, sorte.nameDe);
    await expect(sortenZeile(page, sorte.name)).toHaveCount(1);

    // aufbrauchen: Säen zeigt sie nicht mehr, die übrigen Chili-Sorten bleiben
    await detailOeffnen(page, sorte);
    await keinSaatgutMehr(page);
    await saeenGemuese(page, sorte.nameDe);
    await expect(sortenZeile(page, basket.name)).toBeVisible();
    await expect(sortenZeile(page, sibirisch.name)).toBeVisible();
    await expect(sortenZeile(page, sorte.name)).toHaveCount(0);

    // wieder vorrätig: die Zeile ist zurück
    await detailOeffnen(page, sorte);
    await wiederVorraetig(page);
    await saeenGemuese(page, sorte.nameDe);
    await expect(sortenZeile(page, sorte.name)).toHaveCount(1);
    await expect(sortenZeile(page, basket.name)).toBeVisible();
  } finally {
    try {
      if (sorteId) await db.vorratZuruecksetzen(sorteId);
    } finally {
      await db.sql.end();
    }
  }
});

test('VR1-AK6 Säen-Detail zeigt keinen Bestand in Korn', async ({ page, konto }) => {
  const db = datenbank();
  let sorteId: string | undefined;
  try {
    const sorte = await db.sorteMitArt('sorte-chili-sweet-pickle');
    sorteId = sorte.id;
    await db.vorratZuruecksetzen(sorte.id);
    expect(await db.packungenGueltig(sorte.id)).toBeGreaterThanOrEqual(1);
    await konto.anmelden(page);

    await page.goto('/#/saeen');
    await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible({ timeout: 15_000 });
    await sorteOeffnen(page, sorte.nameDe, sorte.name);
    const packung = page
      .getByRole('term')
      .filter({ hasText: /^Packung$/ })
      .locator('xpath=following-sibling::*[1]');
    await expect(packung).toHaveText(/gekauft \d{2}\.\d{2}\.\d{4}|erfasst/);
    await expect(packung).not.toContainText('Korn');
    await expect(packung).not.toContainText('Bestand');
    await expect(page.getByText(/Korn/)).toHaveCount(0);
  } finally {
    try {
      if (sorteId) await db.vorratZuruecksetzen(sorteId);
    } finally {
      await db.sql.end();
    }
  }
});

// ---------------------------------------------------------------------
// VR1-AK7 Saatgut mit Filter «Aufgebraucht»
// ---------------------------------------------------------------------

test('VR1-AK7 Saatgut zeigt drei Filter ohne waagrechtes Scrollen, Aufgebraucht nur mit der aufgebrauchten Sorte und dem Wort aufgebraucht, Vorrätig ohne sie', async ({
  page,
  konto,
}, testInfo) => {
  const db = datenbank();
  let sorteId: string | undefined;
  try {
    const sorte = await db.sorteMitArt('sorte-chili-prairie-fire');
    sorteId = sorte.id;
    await db.vorratZuruecksetzen(sorte.id);
    // ohne Foto: sonst stünde sie auch unter «Ohne Foto», wäre sie vorrätig
    await db.fotosStornieren(sorte.id);
    await konto.anmelden(page);

    // vorher: «Aufgebraucht» erscheint immer, auch ohne aufgebrauchte Sorte nur mit seiner Zahl
    await page.goto('/#/sorten');
    await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(filter(page, AUFGEBRAUCHT)).toBeVisible();
    const aufgebrauchtVorher = await zahlAus(filter(page, AUFGEBRAUCHT), AUFGEBRAUCHT);

    await detailOeffnen(page, sorte);
    await keinSaatgutMehr(page);

    await page.goto('/#/sorten');
    await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible({ timeout: 15_000 });
    const gruppe = page.getByRole('group', { name: 'Filter' });
    await expect(gruppe).toBeVisible();
    await expect(filter(page, VORRAETIG)).toHaveCount(1);
    await expect(filter(page, OHNE_FOTO)).toHaveCount(1);
    await expect(filter(page, AUFGEBRAUCHT)).toHaveCount(1);
    await expect(filter(page, VORRAETIG)).toHaveAttribute('aria-pressed', 'true');
    await ohneWaagrechtesScrollen(page);
    await expect.poll(() => zahlAus(filter(page, AUFGEBRAUCHT), AUFGEBRAUCHT)).toBe(aufgebrauchtVorher + 1);

    // Vorrätig: Prairie Fire fehlt
    const prairie = page.getByRole('link', { name: new RegExp(`^${sorte.name}`) });
    await expect(prairie).toHaveCount(0);

    // Ohne Foto: Prairie Fire fehlt, obwohl ohne Foto
    await filter(page, OHNE_FOTO).click();
    await expect(filter(page, OHNE_FOTO)).toHaveAttribute('aria-pressed', 'true');
    await expect(prairie).toHaveCount(0);

    // Aufgebraucht: nur aufgebrauchte Sorten, jede mit dem Wort «aufgebraucht»
    await filter(page, AUFGEBRAUCHT).click();
    await expect(filter(page, AUFGEBRAUCHT)).toHaveAttribute('aria-pressed', 'true');
    await expect(filter(page, VORRAETIG)).toHaveAttribute('aria-pressed', 'false');
    await expect(prairie).toBeVisible();
    await expect(prairie).toContainText('aufgebraucht');
    await expect(prairie).not.toContainText('ohne Foto');
    const anzahl = await zahlAus(filter(page, AUFGEBRAUCHT), AUFGEBRAUCHT);
    await expect(listenLinks(page)).toHaveCount(anzahl);
    for (const link of await listenLinks(page).all()) await expect(link).toContainText('aufgebraucht');
    await ohneWaagrechtesScrollen(page);
    await bildschirm(page, testInfo, 'saatgut-filter-aufgebraucht');
  } finally {
    try {
      if (sorteId) await db.vorratZuruecksetzen(sorteId);
    } finally {
      await db.sql.end();
    }
  }
});
