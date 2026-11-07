// Seitenbreite am Honor (Fehler #121, gefunden mit der Honor-Simulation T-01, #120): Zweispaltige Felder dürfen die
// Seite nicht breiter als 360 dp machen. Eine Spalte `1fr` wird nie schmaler als ihr Inhalt; das Eingabefeld bringt
// seine Standardbreite mit. Regal R aus tests/fixtures/regal.ts, REST nachgebildet, 360 × 640 aus der Konfiguration.
// Routine: Tests vom Lead.
import { expect, test, type Page } from '@playwright/test';
import { leeresRegal, regalTeile, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');

async function mitDaten(page: Page, start: Teile, pfad: string): Promise<void> {
  const daten = sichtenNachrechnen(structuredClone(start));
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, JETZT);
      sichtenNachrechnen(daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
}

/** Breite des Dokuments in CSS-Pixeln (dp); grösser als der Viewport heisst waagrechter Überlauf */
const seitenbreite = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** Knöpfe und Eingabefelder, deren Inhalt breiter ist als das Element selbst (Text ragt über den Rahmen) */
const ueberlaufend = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main .hv-btn, main input')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent?.trim() || el.getAttribute('aria-label') || el.id),
  );

async function passt(page: Page): Promise<void> {
  expect(page.viewportSize()?.width).toBe(360);
  expect(await seitenbreite(page)).toBeLessThanOrEqual(360);
  expect(await ueberlaufend(page)).toEqual([]);
}

test('F121-AK1 Etiketten: bei 360 dp ist die Seite höchstens 360 dp breit (Startfeld und Druckversatz X nebeneinander)', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/etiketten?a=R');
  await expect(page.getByLabel(/^Druckversatz X/)).toBeVisible({ timeout: 15_000 });
  await passt(page);
});

test('F121-AK1 Gefäss erfassen Schritt 4: bei 360 dp ist die Seite höchstens 360 dp breit (Messen, Nachfüllen, Wechseln)', async ({
  page,
}) => {
  await mitDaten(page, leeresRegal(), '/#/gefaess-neu?a=R');
  const gruppe = (name: string) => page.getByRole('group', { name, exact: true });
  const weiter = page.getByRole('button', { name: 'Weiter', exact: true });
  await gruppe('Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe('Position').getByRole('radio', { name: '3', exact: true }).check();
  await gruppe('Luftpumpe').getByRole('radio', { name: 'P2', exact: true }).check();
  await weiter.click();
  await gruppe('Box')
    .getByRole('radio', { name: /^Rako 40 × 30 × 22/ })
    .check();
  await weiter.click();
  await gruppe('Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }).check();
  await weiter.click();
  await expect(page.getByText('Schritt 4 von 4')).toBeVisible();
  await expect(page.getByLabel(/^Wechseln alle/)).toBeVisible();
  await passt(page);
});

test('F121-AK1 Anlage: bei 360 dp ist die Seite höchstens 360 dp breit, «Gefäss erfassen» und «Etiketten drucken» ohne überstehenden Text', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/anlage?a=R');
  await expect(page.getByRole('link', { name: 'Etiketten drucken' })).toBeVisible({ timeout: 15_000 });
  await passt(page);
});

test('F121-AK1 Anlage anlegen: bei 360 dp ist die Seite höchstens 360 dp breit (Licht ab und bis, Lichtleisten und Lichtstunden)', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/anlage/neu');
  await expect(page.getByLabel(/^Licht ab/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel(/^Lichtstunden/).first()).toBeVisible();
  await passt(page);
});

test('F121-AK1 Gefäss ändern: bei 360 dp ist die Seite höchstens 360 dp breit (Messen, Nachfüllen, Wechseln)', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/gefaess/R-2.3/aendern');
  await expect(page.getByLabel(/^Wechseln alle/)).toBeVisible({ timeout: 15_000 });
  await passt(page);
});
