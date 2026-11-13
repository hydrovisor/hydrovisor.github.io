// TO7 (docs/spec/06_tests.md 7): neue Version während eines Ablaufs → Hinweis nur in Heute ohne Ablauf, nichts verloren.
// Die neue Version entsteht, indem der Test dist/sw.js ändert und das Update des Service Workers anstösst.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';

const SW = resolve(import.meta.dirname, '../../dist/sw.js');
const ABLAUF = { id: 'e2e-rundgang', art: 'rundgang', schritt: 3 };

function ablaufSetzen(page: Page, eintrag: typeof ABLAUF | null): Promise<void> {
  return page.evaluate(
    (e) =>
      new Promise<void>((erfuellen, ablehnen) => {
        const anfrage = indexedDB.open('hydrovisor');
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onsuccess = () => {
          const tx = anfrage.result.transaction('ablaeufe', 'readwrite');
          const speicher = tx.objectStore('ablaeufe');
          if (e) speicher.put(e);
          else speicher.clear();
          tx.oncomplete = () => {
            anfrage.result.close();
            erfuellen();
          };
          tx.onerror = () => ablehnen(tx.error);
        };
      }),
    eintrag,
  );
}

function ablaufLesen(page: Page): Promise<unknown> {
  return page.evaluate(
    (id) =>
      new Promise((erfuellen, ablehnen) => {
        const anfrage = indexedDB.open('hydrovisor');
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onsuccess = () => {
          const lesen = anfrage.result.transaction('ablaeufe').objectStore('ablaeufe').get(id);
          lesen.onsuccess = () => {
            anfrage.result.close();
            erfuellen(lesen.result);
          };
        };
      }),
    ABLAUF.id,
  );
}

/** Info über die Leiste unten: «Mehr», dann «Info und Version» (seit N1, Entscheid 0025) */
async function infoOeffnen(page: Page): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'Mehr', exact: true })
    .click();
  await page.locator('main').getByRole('link', { name: 'Info und Version', exact: true }).click();
}

const wartenderDienst = (page: Page) =>
  page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
const ohneNeuladen = (page: Page) =>
  page.evaluate(() => (window as unknown as { ohneNeuladen?: boolean }).ohneNeuladen === true);

test('TO7 neue Version während Ablauf: Hinweis nur in Heute ohne Ablauf, nichts verloren', async ({
  page,
}) => {
  const original = readFileSync(SW, 'utf8');
  const hinweis = page.getByText('Neue Version, neu laden');
  // Heute erst mit Sitzung (I0-06)
  await sitzungSpeichern(page);
  await authNachbilden(page);
  try {
    // App installiert und vom Service Worker gesteuert
    await page.goto('/#/heute');
    await page.evaluate(async () => void (await navigator.serviceWorker.ready));
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await expect(page.locator('main[data-ablauf="keiner"]')).toBeVisible();

    // Ein Ablauf läuft (Schrittstand in IndexedDB), Tim ist ausserhalb von Heute
    await infoOeffnen(page);
    await ablaufSetzen(page, ABLAUF);
    await page.evaluate(() => ((window as unknown as { ohneNeuladen: boolean }).ohneNeuladen = true));

    // Neue Version ausgeliefert
    writeFileSync(SW, `${original}\n// neue Version ${Date.now()}\n`);
    await page.evaluate(async () => void (await (await navigator.serviceWorker.getRegistration())?.update()));
    await expect(page.locator('[data-neue-version="wartet"]')).toBeAttached();
    await expect(hinweis).toHaveCount(0);

    // In Heute mit laufendem Ablauf: kein Hinweis, kein Umschalten, nichts verloren
    await page.getByRole('link', { name: 'Heute öffnen' }).click();
    await expect(page.locator('main[data-ablauf="offen"]')).toBeVisible();
    await expect(hinweis).toHaveCount(0);
    expect(await wartenderDienst(page)).toBe(true);
    expect(await ohneNeuladen(page)).toBe(true);
    expect(await ablaufLesen(page)).toEqual(ABLAUF);

    // Ablauf beendet: der Hinweis erscheint in Heute
    await ablaufSetzen(page, null);
    await infoOeffnen(page);
    await expect(hinweis).toHaveCount(0);
    await page.getByRole('link', { name: 'Heute öffnen' }).click();
    await expect(page.locator('main[data-ablauf="keiner"]')).toBeVisible();
    await expect(hinweis).toBeVisible();
    expect(await ohneNeuladen(page)).toBe(true);

    // Erst das Tippen übernimmt die neue Version und lädt neu
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Neu laden' }).click()]);
    await expect(page.locator('main[data-ablauf="keiner"]')).toBeVisible();
    expect(await ohneNeuladen(page)).toBe(false);
    await expect(page.locator('[data-neue-version="keine"]')).toBeAttached();
    await expect(hinweis).toHaveCount(0);
    expect(await wartenderDienst(page)).toBe(false);
  } finally {
    writeFileSync(SW, original);
  }
});
