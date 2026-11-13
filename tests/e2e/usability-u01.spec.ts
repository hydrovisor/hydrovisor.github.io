// Usability Runde 1 (Issue #153, Plan 153; docs/entwurf/usability_befunde.md B1 bis B4, B9). REST nachgebildet,
// Fixtures der E2E; 360 × 640 aus der Konfiguration, U01-AK1 im Honor-Profil (640 und 780), U01-AK3 auch 360 × 780.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ansatzTeile, um as ansatzUm } from '../fixtures/ansatz.ts';
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
for (const hoehe of [640, 780]) {
  test.describe(`Honor-Profil 360 × ${hoehe}`, () => {
    test.use({
      viewport: { width: 360, height: hoehe },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3.5,
    });

    test(`U01-AK1 Rundgang auf 360 × ${hoehe}: Titel und «Rundgang beenden» überlappen nicht, beide innerhalb von 360 dp, Taste 68 dp`, async ({
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
}

/** Stil im Ruhezustand und bei gedrückter Maustaste (ohne loszulassen) */
async function gedrueckt(page: Page, ziel: Locator): Promise<[string, string]> {
  const stil = () =>
    ziel.evaluate((e) => {
      const s = getComputedStyle(e);
      return `${s.backgroundColor}|${s.boxShadow}|${s.transform}`;
    });
  await ziel.scrollIntoViewIfNeeded();
  const ruhe = await stil();
  const b = await box(ziel);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  const unten = await stil();
  // wegziehen und loslassen: kein click, keine Wirkung
  await page.mouse.move(0, 0);
  await page.mouse.up();
  return [ruhe, unten];
}

async function vibrationMitschneiden(page: Page): Promise<() => Promise<number[]>> {
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
  return () => page.evaluate(() => [...(window as unknown as { vibriert: number[] }).vibriert]);
}

test('U01-AK2 gedrückter Zustand an Tasten, Kacheln und Haken sichtbar anders als in Ruhe', async ({
  page,
}) => {
  await oeffnen(page, regalTeile(), '/#/gefaess/R-1.1', new Date('2026-12-10T08:00:00Z'));
  const haupt = knopf(page, /Messen$/);
  await expect(haupt).toBeVisible({ timeout: 15_000 });
  for (const ziel of [haupt, page.locator('.hv-gefaess-neben .hv-btn').first()]) {
    const [ruhe, unten] = await gedrueckt(page, ziel);
    expect(unten, 'Taste gedrückt').not.toBe(ruhe);
  }
  await page.goto('/#/anlage');
  const kachel = page.locator('button.hv-tile').first();
  await expect(kachel).toBeVisible({ timeout: 10_000 });
  const [ruheK, untenK] = await gedrueckt(page, kachel);
  expect(untenK, 'Kachel gedrückt').not.toBe(ruheK);

  // Haken der Abhakliste (Lösung wechseln 2.3)
  await oeffnen(page, ansatzTeile(), '/#/ansatz/R-2.3', ansatzUm('18:30'));
  const haken = page.getByRole('button', { name: 'Zeile 0 abhaken', exact: true });
  await expect(haken).toBeVisible({ timeout: 15_000 });
  const [ruheH, untenH] = await gedrueckt(page, haken);
  expect(untenH, 'Haken gedrückt').not.toBe(ruheH);
});

test('U01-AK2 Vibration: genau einmal je Tipp in Regal-Masken, höchstens 15 ms; am Schreibtisch und beim Wegziehen nicht', async ({
  page,
}) => {
  const vibriert = await vibrationMitschneiden(page);
  await oeffnen(page, messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  expect(await page.locator('main').getAttribute('data-density')).toBe('regal');
  for (const z of ['6', '8']) {
    const vorher = (await vibriert()).length;
    await page.getByRole('button', { name: `Ziffer ${z}`, exact: true }).click();
    await page.waitForTimeout(120);
    const v = await vibriert();
    expect(v.length, `genau eine Vibration für Ziffer ${z}`).toBe(vorher + 1);
    expect(v[v.length - 1]).toBeLessThanOrEqual(15);
  }
  // gedrückt und weggezogen: kein click, keine Vibration
  const vorWeg = (await vibriert()).length;
  await gedrueckt(page, page.getByRole('button', { name: 'Ziffer 1', exact: true }));
  expect((await vibriert()).length, 'keine Vibration ohne Auslösen').toBe(vorWeg);

  // Anlage ist eine Schreibtisch-Maske: kein Vibrieren
  await page.goto('/#/anlage');
  const kachel = page.locator('button.hv-tile').first();
  await expect(kachel).toBeVisible({ timeout: 10_000 });
  expect(await page.locator('main').getAttribute('data-density')).not.toBe('regal');
  const vorher = (await vibriert()).length;
  await kachel.click();
  expect((await vibriert()).length, 'keine Vibration am Schreibtisch').toBe(vorher);
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

// seit N1 (Entscheid 0025) ersetzt die Leiste unten die Navigation im Kopf: dieselbe Prüfung an der Leiste
test('U01-AK4 Heute: Leiste unten in einer Zeile, Ziele 68 dp, Text passt, kein waagrechtes Scrollen', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile(), '/#/heute', RUNDGANG_JETZT);
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await expect(nav).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const ziele = await nav.getByRole('link').all();
  expect(ziele).toHaveLength(5);
  const boxen = await Promise.all(ziele.map((t) => box(t)));
  // höchstens eine Zeile: alle Ziele auf derselben Höhe, die Leiste kaum höher als ein Ziel
  for (const b of boxen) expect(Math.abs(b.y - (boxen[0]?.y ?? 0)), 'eine Zeile').toBeLessThanOrEqual(1);
  expect((await box(nav)).height).toBeLessThan(2 * 68);
  for (const [i, t] of ziele.entries()) {
    expect(boxen[i]?.height ?? 0).toBeGreaterThanOrEqual(68);
    expect((boxen[i]?.x ?? 0) + (boxen[i]?.width ?? 0), 'rechter Rand').toBeLessThanOrEqual(360);
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

test('U01-AK7 Einrichtung: die Taste im aktiven Punkt bleibt in der Textspalte und überlappt den Statuskreis nicht', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile(), '/#/heute', RUNDGANG_JETZT);
  const punkt = page.locator('li.hv-check-row[data-zustand="aktiv"]').first();
  await expect(punkt).toBeVisible({ timeout: 15_000 });
  const taste = punkt.locator('.hv-check-aktion .hv-btn');
  const kreis = punkt.locator('.hv-check-status');
  const t = await box(taste);
  const k = await box(kreis);
  const ueberlappt =
    t.x < k.x + k.width && k.x < t.x + t.width && t.y < k.y + k.height && k.y < t.y + t.height;
  expect(ueberlappt, 'Taste überlappt den Statuskreis').toBe(false);
  await textPasst(taste);
  expect(t.height).toBeGreaterThanOrEqual(68);
});
