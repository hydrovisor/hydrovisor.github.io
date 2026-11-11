// Usability Runde 1 (Issue #153, Plan 153; docs/entwurf/usability_befunde.md B1 bis B4, B9). REST nachgebildet,
// Fixtures der E2E; 360 × 640 aus der Konfiguration, U01-AK3 zusätzlich 360 × 780 (Honor).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { JETZT as MESS_JETZT, messTeile } from '../fixtures/messen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { regalTeile } from '../fixtures/regal.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

async function oeffnen(page: Page, teile: Teile, pfad: string, uhr: Date): Promise<void> {
  const daten = structuredClone(teile);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) (daten[tabelle] ??= []).push({ storniert_am: null, ...z });
    },
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
}

const knopf = (ort: Page | Locator, name: RegExp | string): Locator =>
  ort.getByRole('link', { name }).or(ort.getByRole('button', { name }));

async function box(ort: Locator) {
  const b = await ort.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return b;
}

async function textPasst(ort: Locator): Promise<void> {
  const [scroll, client] = await ort.evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(scroll, 'Text breiter als die Taste').toBeLessThanOrEqual(client);
}

async function ziffern(page: Page, folge: string): Promise<void> {
  for (const z of folge) {
    await page.getByRole('button', { name: z === '.' ? 'Punkt' : `Ziffer ${z}`, exact: true }).click();
    await page.waitForTimeout(120);
  }
}

// Die Überlappung zeigt sich nur mit Mobil-Emulation wie am Honor (isMobile, Touch, Pixeldichte 3.5; Simulation #120)
test.describe('Honor-Profil', () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3.5 });

  test('U01-AK1 Rundgang: Titel und «Rundgang beenden» überlappen nicht, beide innerhalb von 360 dp, Taste 68 dp', async ({
    page,
  }) => {
    await oeffnen(page, rundgangTeile({ orte: ['1.1', '2.1'] }), '/#/heute', RUNDGANG_JETZT);
    await knopf(page, /^Rundgang starten/).click();
    const titel = page.getByRole('heading', { level: 1, name: /^Rundgang/ });
    const beenden = knopf(page, 'Rundgang beenden');
    await expect(beenden).toBeVisible({ timeout: 10_000 });
    // erst mit der Schrift des Design Systems messen (die Ersatzschrift ist schmaler)
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForTimeout(300);
    const t = await box(titel);
    const b = await box(beenden);
    const ueberlappt =
      t.x < b.x + b.width && b.x < t.x + t.width && t.y < b.y + b.height && b.y < t.y + t.height;
    expect(ueberlappt, 'Titel und Taste überlappen').toBe(false);
    for (const r of [t, b]) expect(r.x + r.width, 'rechter Rand').toBeLessThanOrEqual(360);
    expect(b.height).toBeGreaterThanOrEqual(68);
    // die Taste schrumpft sonst auf 68 dp und ihr Text läuft über Titel und Rand (Befund B1)
    await textPasst(titel);
    await textPasst(beenden);
  });
});

test('U01-AK2 gedrückter Zustand an Tasten, Kacheln und Haken; Vibration nur in Regal-Masken, höchstens 15 ms', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { vibriert: number[] };
    w.vibriert = [];
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (ms: number) => {
        w.vibriert.push(ms);
        return true;
      },
    });
  });
  await oeffnen(page, regalTeile(), '/#/gefaess/R-1.1', new Date('2026-12-10T08:00:00Z'));
  const haupt = knopf(page, /Messen$/);
  await expect(haupt).toBeVisible({ timeout: 15_000 });
  const vibriert = () => page.evaluate(() => (window as unknown as { vibriert: number[] }).vibriert);

  // Ruhezustand gegen gedrückt (Maus unten halten, ohne loszulassen)
  for (const ziel of [haupt, page.locator('.hv-gefaess-neben .hv-btn').first()]) {
    const ruhe = await ziel.evaluate((e) => {
      const s = getComputedStyle(e);
      return `${s.backgroundColor}|${s.boxShadow}|${s.transform}`;
    });
    const b = await box(ziel);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    const gedrueckt = await ziel.evaluate((e) => {
      const s = getComputedStyle(e);
      return `${s.backgroundColor}|${s.boxShadow}|${s.transform}`;
    });
    expect(gedrueckt, 'gedrückter Zustand sichtbar').not.toBe(ruhe);
    const v = await vibriert();
    expect(v.length, 'eine Vibration je Berührung').toBeGreaterThanOrEqual(1);
    expect(Math.max(...v)).toBeLessThanOrEqual(15);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }

  // Kachel des Regalbilds (Anlage ist eine Schreibtisch-Maske: Zustand ja, Vibration nein)
  await page.goto('/#/anlage');
  const kachel = page.locator('button.hv-tile').first();
  await expect(kachel).toBeVisible({ timeout: 10_000 });
  const vorher = (await vibriert()).length;
  const ruhe = await kachel.evaluate((e) => getComputedStyle(e).backgroundColor);
  const k = await box(kachel);
  await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2);
  await page.mouse.down();
  expect(await kachel.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(ruhe);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  const regal = await page.locator('main').getAttribute('data-density');
  if (regal !== 'regal') expect((await vibriert()).length, 'keine Vibration am Schreibtisch').toBe(vorher);
});

test('U01-AK3 Messmaske auf 780 dp: Hinweise ganz sichtbar, «Speichern» am unteren Rand und in beiden Zuständen an derselben Stelle', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await oeffnen(page, messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  const speichern = page.getByRole('button', { name: /^Speichern/ });
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  const eingabe = await box(speichern);
  await ziffern(page, '68');
  await ziffern(page, '160');
  await ziffern(page, '245');
  const zone = page.locator('.hv-ergebniszone');
  await expect(zone).toBeVisible();
  const ergebnis = await box(speichern);
  expect(Math.abs(ergebnis.y - eingabe.y), 'Speichern an derselben Stelle').toBeLessThanOrEqual(1);
  expect(ergebnis.y + ergebnis.height, 'Speichern im Viewport').toBeLessThanOrEqual(780);
  expect(ergebnis.y + ergebnis.height, 'Speichern am unteren Rand').toBeGreaterThan(780 - 120);
  // jeder Hinweis der Zone ganz sichtbar: nicht abgeschnitten (eigener Inhalt) und unten innerhalb der Zone
  const z = await box(zone);
  const hinweise = await zone.locator(':scope > *').all();
  expect(hinweise.length).toBeGreaterThan(0);
  for (const h of hinweise) {
    const r = await box(h);
    expect(r.y + r.height, 'Hinweis endet in der Zone').toBeLessThanOrEqual(z.y + z.height + 0.5);
    const [scroll, client] = await h.evaluate((e) => [e.scrollHeight, e.clientHeight]);
    expect(scroll, 'Hinweis nicht abgeschnitten').toBeLessThanOrEqual(client + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(780);
});

test('U01-AK3 Messmaske auf 640 dp bleibt ohne Scrollen, Speichern in beiden Zuständen sichtbar', async ({
  page,
}) => {
  await oeffnen(page, messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  const speichern = page.getByRole('button', { name: /^Speichern/ });
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  await expect(speichern).toBeInViewport({ ratio: 1 });
  await ziffern(page, '68');
  await ziffern(page, '160');
  await ziffern(page, '245');
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  await expect(speichern).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(640);
});

test('U01-AK4 Heute: Navigation im Kopf höchstens 150 dp hoch, Tasten 68 dp, Text passt', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile(), '/#/heute', RUNDGANG_JETZT);
  const nav = page.getByRole('navigation', { name: 'Navigation' });
  await expect(nav).toBeVisible({ timeout: 15_000 });
  expect((await box(nav)).height).toBeLessThanOrEqual(150);
  for (const t of await nav.getByRole('link').all()) {
    expect((await box(t)).height).toBeGreaterThanOrEqual(68);
    await textPasst(t);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('U01-AK5 Gefäss 1.1: Nebentasten gleich breit und mindestens 68 dp hoch', async ({ page }) => {
  await oeffnen(page, regalTeile(), '/#/gefaess/R-1.1', new Date('2026-12-10T08:00:00Z'));
  const neben = page.locator('.hv-gefaess-neben > .hv-btn');
  await expect(neben.first()).toBeVisible({ timeout: 15_000 });
  const boxen = await Promise.all((await neben.all()).map((n) => box(n)));
  expect(boxen.length).toBeGreaterThanOrEqual(2);
  for (const b of boxen) {
    expect(Math.abs(b.width - (boxen[0]?.width ?? 0)), 'gleich breit').toBeLessThanOrEqual(1);
    expect(b.height).toBeGreaterThanOrEqual(68);
  }
  for (const n of await neben.all()) await textPasst(n);
});
