// Heute: «Rundgang starten» fest im Daumenbereich (Issue #151, Plan 151; 05_masken.md 3.1). REST nachgebildet,
// Regal R mit fälligen Aufgaben aus tests/fixtures/rundgang.ts; 360 × 640 aus der Konfiguration.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const knopf = (page: Page, name: RegExp): Locator =>
  page.getByRole('link', { name }).or(page.getByRole('button', { name }));

async function heute(page: Page): Promise<void> {
  const daten = structuredClone(rundgangTeile());
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    () => undefined,
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
}

/** Rechteck ganz im Viewport und in der unteren Hälfte */
async function imDaumenbereich(page: Page, ort: Locator): Promise<void> {
  const box = await ort.boundingBox();
  const hoehe = page.viewportSize()?.height ?? 0;
  expect(box, 'sichtbar').not.toBeNull();
  if (!box) return;
  expect(box.y, 'oberer Rand im Viewport').toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, 'unterer Rand im Viewport').toBeLessThanOrEqual(hoehe);
  expect(box.y + box.height / 2, 'Mitte in der unteren Hälfte').toBeGreaterThan(hoehe / 2);
}

test('HF-AK1 «Rundgang starten» und «Stromausfall erfassen» ohne Scrollen im Daumenbereich, Tasten 68 dp, nebeneinander', async ({
  page,
}) => {
  await heute(page);
  const rundgang = knopf(page, /^Rundgang starten \(\d+ Orte?\)/);
  const strom = knopf(page, /^Stromausfall erfassen/);
  await expect(rundgang).toBeVisible();
  // die Seite ist länger als der Bildschirm, sonst prüft der Test nichts
  const seitenhoehe = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(seitenhoehe).toBeGreaterThan(page.viewportSize()?.height ?? 0);

  for (const ort of [rundgang, strom]) {
    await imDaumenbereich(page, ort);
    expect((await ort.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  }
  const r = await rundgang.boundingBox();
  const s = await strom.boundingBox();
  expect(Math.abs((r?.y ?? 0) - (s?.y ?? 1)), 'nebeneinander').toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // auch nach dem Scrollen in die Mitte bleibt der Fuss im Daumenbereich
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await imDaumenbereich(page, rundgang);
});

test('HF-AK2 am Ende der Seite verdeckt der Fuss keine Taste der letzten Karte, der Tipp trifft die Karte', async ({
  page,
}) => {
  await heute(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const fuss = page.getByRole('navigation', { name: 'Rundgang' });
  const fussBox = await fuss.boundingBox();
  // alle sichtbaren Tasten und Links ausserhalb des Fusses liegen über ihm
  const tasten = page.locator(
    'main a.hv-btn:not(.hv-heute-fuss *), main button.hv-btn:not(.hv-heute-fuss *)',
  );
  const boxen = await tasten.evaluateAll((l) =>
    l
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => {
        const b = e.getBoundingClientRect();
        return { text: e.textContent ?? '', unten: b.bottom, oben: b.top };
      }),
  );
  const imBild = boxen.filter((b) => b.unten > 0 && b.oben < (page.viewportSize()?.height ?? 0));
  expect(imBild.length, 'Tasten der letzten Karten im Bild').toBeGreaterThan(0);
  for (const b of imBild)
    expect(b.unten, `«${b.text}» über dem Fuss`).toBeLessThanOrEqual((fussBox?.y ?? 0) + 1);

  // die unterste Taste ausserhalb des Fusses ist anklickbar (kein Abfangen durch den Fuss)
  const letzte = tasten.last();
  await letzte.click({ trial: true });
});
