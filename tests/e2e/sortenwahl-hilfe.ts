// Sortenwahl in Säen, Schritt 1 (Plan 205): Gemüse-Kachel, Sorte, «Wählen» oder «Wählen und weiter». Für alle Säen-Abläufe, damit die
// Tests die Bedienung genau so zählen, wie Tim sie am Regal ausführt.
import { expect, type Locator, type Page } from '@playwright/test';

type Tipp = (ziel: Locator) => Promise<void>;
const klick: Tipp = (ziel) => ziel.click();

/** Kachel eines Gemüses: der zugängliche Name beginnt mit «Salat, » */
export const gemueseKachel = (page: Page, gemuese: string) =>
  page.getByRole('group', { name: 'Gemüse' }).getByRole('button', { name: new RegExp(`^${gemuese}, `) });

/** Zeile einer Sorte in der Sortenliste eines Gemüses */
export const sortenZeile = (page: Page, sorte: string) =>
  page.locator('.hv-sortenzeile').filter({ has: page.locator('.hv-sortenzeile-titel', { hasText: sorte }) });

/** Detail einer Sorte öffnen; steht die Sortenliste eines anderen Gemüses offen, zuerst «Alle Gemüse» */
export async function sorteOeffnen(
  page: Page,
  gemuese: string,
  sorte: string,
  tipp: Tipp = klick,
): Promise<void> {
  const kopf = page.locator('.hv-saeen-gemuesekopf h2');
  if ((await kopf.count()) === 0 || (await kopf.textContent()) !== gemuese) {
    if ((await kopf.count()) > 0) await tipp(page.getByRole('button', { name: 'Alle Gemüse', exact: true }));
    await tipp(gemueseKachel(page, gemuese));
  }
  const titel = page.locator('.hv-saeen-sortetitel');
  // Gemüse mit einer Sorte: die Kachel öffnet direkt das Detail
  await expect(kopf.or(titel).first()).toBeVisible();
  if ((await titel.count()) === 0) await tipp(sortenZeile(page, sorte).first());
  await expect(titel).toHaveText(sorte);
}

/**
 * Sorte wählen: Kachel, Sorte, «Wählen» (bei weiteren Sorten bleibt die Sortenliste offen, Plan 205 A1); mit
 * `weiter` «Wählen und weiter» direkt zu Schritt 2 (A6)
 */
export async function sorteWaehlen(
  page: Page,
  gemuese: string,
  sorte: string,
  tipp: Tipp = klick,
  { weiter = false }: { weiter?: boolean } = {},
): Promise<void> {
  await sorteOeffnen(page, gemuese, sorte, tipp);
  await tipp(page.getByRole('button', { name: weiter ? 'Wählen und weiter' : 'Wählen', exact: true }));
  if (weiter) await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  else await expect(page.locator('.hv-saeen-sortetitel')).toHaveCount(0);
}
