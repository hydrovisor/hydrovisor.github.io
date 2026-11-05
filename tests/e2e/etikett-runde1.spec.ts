// Prüfer Runde 1 zu Paket 22 (Lead), Befund 1: kurze Kennungen stehen in voller Grösse (R9.1, Label.md): 20 mm auf
// dem Gefässetikett, 12 mm auf der Anzuchtbox; gemessen wird die Textbreite, nicht die Spalte. REST nachgebildet,
// Regal R aus tests/fixtures/regal.ts, feste Uhr.
import { expect, test } from '@playwright/test';
import { regalTeile } from '../fixtures/regal.ts';
import { sichtenNachrechnen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');
const PX_JE_MM = 96 / 25.4;

test('R9.1 Kennung 2.3, 4.4 und W in 20 mm, A1 in 12 mm', async ({ page }) => {
  const daten = sichtenNachrechnen(regalTeile(JETZT));
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(page, () => daten);
  await page.clock.setFixedTime(JETZT);
  const hash = '#/druck/etiketten?a=R&code=R-2.3&code=R-4.4&code=R-A1&code=R-W&start=1&x=0&y=0';
  await page.goto(`/${hash}`);
  await expect(page.locator('.hv-label')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.emulateMedia({ media: 'print' });
  const groessen = async () =>
    page.locator('.hv-label-id').evaluateAll(
      (ids, px) =>
        ids.map((id) => ({
          kennung: id.textContent ?? '',
          mm: Number.parseFloat(getComputedStyle(id).fontSize) / px,
        })),
      PX_JE_MM,
    );
  await expect
    .poll(async () => (await groessen()).map((g) => [g.kennung, Math.round(g.mm * 2) / 2]))
    .toEqual([
      ['2.3', 20],
      ['4.4', 20],
      ['A1', 12],
      ['W', 20],
    ]);
});
