// Heute: «Rundgang starten» fest im Daumenbereich (Issue #151, Plan 151; 05_masken.md 3.1). REST nachgebildet,
// Regal R mit fälligen Aufgaben aus tests/fixtures/rundgang.ts, Wechselblock aus tests/fixtures/wechselblock.ts;
// 360 × 640 aus der Konfiguration.
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Teile } from '../fixtures/regal.ts';
import { JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { um, wechselblockTeile } from '../fixtures/wechselblock.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const knopf = (page: Page, name: RegExp): Locator =>
  page.getByRole('link', { name }).or(page.getByRole('button', { name }));
const RUNDGANG = /^Rundgang starten \(\d+ Orte?\)/;

async function heute(page: Page, teile: Teile, uhr: Date): Promise<void> {
  const daten = structuredClone(teile);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    () => undefined,
  );
  await page.clock.setFixedTime(uhr);
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

/** Text passt in die Taste (kein Überstand) */
async function textPasst(ort: Locator): Promise<void> {
  const [scroll, client] = await ort.evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(scroll, 'Text breiter als die Taste').toBeLessThanOrEqual(client);
}

/** alle bedienbaren Elemente im Bild ausserhalb des Fusses: Mitte nicht vom Fuss verdeckt */
async function nichtsVerdeckt(page: Page): Promise<number> {
  return page.evaluate(() => {
    const fuss = document.querySelector('.hv-heute-fuss');
    const ziele = [...document.querySelectorAll('main a, main button, main [role="button"]')].filter(
      (e) => !fuss?.contains(e),
    );
    let geprueft = 0;
    for (const e of ziele) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= window.innerHeight) continue;
      // jede sichtbare Zeile des Elements: oberer und unterer Rand, je in der Mitte der Breite
      for (const y of [r.top + 2, r.bottom - 2]) {
        if (y < 0 || y > window.innerHeight) continue;
        const treffer = document.elementFromPoint(r.left + r.width / 2, y);
        if (treffer && fuss?.contains(treffer))
          throw new Error(
            `«${(e.textContent ?? '').trim().slice(0, 40)}» vom Fuss verdeckt bei y = ${Math.round(y)}`,
          );
      }
      geprueft += 1;
    }
    return geprueft;
  });
}

test('HF-AK1 «Rundgang starten» ohne Scrollen im Daumenbereich, über die ganze Breite, 68 dp, Text passt; «Stromausfall erfassen» am Seitenende', async ({
  page,
}) => {
  await heute(page, rundgangTeile(), JETZT);
  const rundgang = knopf(page, RUNDGANG);
  await expect(rundgang).toBeVisible();
  // die Seite ist länger als der Bildschirm, sonst prüft der Test nichts
  const seitenhoehe = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(seitenhoehe).toBeGreaterThan(page.viewportSize()?.height ?? 0);

  await imDaumenbereich(page, rundgang);
  const box = await rundgang.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(68);
  expect(box?.width ?? 0, 'ganze Inhaltsbreite').toBeGreaterThanOrEqual(320);
  await textPasst(rundgang);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // nach dem Scrollen in die Mitte bleibt die Taste im Daumenbereich
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await imDaumenbereich(page, rundgang);

  // «Stromausfall erfassen» am Seitenende, über dem Fuss, Text passt
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const strom = knopf(page, /^Stromausfall erfassen/);
  await expect(strom).toBeInViewport();
  expect((await strom.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  await textPasst(strom);
});

test('HF-AK2 am Seitenende verdeckt der Fuss kein bedienbares Element; der Tipp trifft die unterste Kachel', async ({
  page,
}) => {
  await heute(page, rundgangTeile(), JETZT);
  // erst wenn die Übersicht geladen ist, steht das Seitenende fest (sonst scrollt der Test auf 640 dp, und die
  // Einrichtung liegt beim Prüfen kurz unter dem Fuss; seit #162 wackelig)
  await expect(page.locator('main .hv-tile').last()).toBeVisible({ timeout: 15_000 });
  // am Seitenende liegt nichts mehr unter dem Fuss (oben und in der Mitte scrollen Karten bewusst darunter durch)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const geprueft = await nichtsVerdeckt(page);
  expect(geprueft, 'Elemente am Seitenende geprüft').toBeGreaterThan(0);

  // unterste Kachel der Übersicht (Regalbild) bekommt den Tipp, nicht der Fuss
  const kachel = page.locator('main .hv-tile').last();
  await kachel.scrollIntoViewIfNeeded();
  await kachel.click({ trial: true });
  const mitte = await kachel.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t !== null && e.contains(t);
  });
  expect(mitte, 'Mitte der untersten Kachel trifft die Kachel').toBe(true);
});

test('HF-AK2 mit offenem Wechselblock bleibt der Fuss im Fluss und verdeckt keinen Knopf des Blocks (WB-AK4)', async ({
  page,
}) => {
  await heute(page, wechselblockTeile(), um('18:50'));
  const block = page.getByRole('region', { name: 'Wechselblock' });
  await expect(block).toBeVisible();
  for (const k of await block.getByRole('link').or(block.getByRole('button')).all()) {
    const verdeckt = await k.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const t = document.elementFromPoint(r.left + r.width / 2, r.bottom - 2);
      return t !== null && !e.contains(t);
    });
    expect(verdeckt, `«${(await k.textContent()) ?? ''}» verdeckt`).toBe(false);
  }
  const fuss = page.locator('.hv-heute-fuss');
  if ((await fuss.count()) > 0)
    expect(await fuss.evaluate((e) => getComputedStyle(e).position), 'Fuss im Fluss').toBe('static');
});
