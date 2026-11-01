import { expect, test } from '@playwright/test';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';

test('Info-Seite zeigt Commit aus version.json', async ({ page, request }) => {
  const antwort = await request.get('/version.json');
  expect(antwort.ok()).toBe(true);
  const { version, commit } = (await antwort.json()) as { version: string; commit: string };
  expect(commit).toMatch(/^[0-9a-f]{40}$/);
  expect(version.endsWith(`+${commit.slice(0, 7)}`)).toBe(true);

  await page.goto('/#/info');
  await expect(page.getByRole('heading', { name: 'Info', level: 1 })).toBeVisible();
  await expect(page.getByTestId('app-commit')).toHaveText(commit.slice(0, 7));
  await expect(page.getByTestId('app-commit')).toHaveAttribute('title', commit);
  await expect(page.getByTestId('app-version')).toHaveText(version);
  await expect(
    page.getByRole('img', { name: /Hydroponik mit Weitsicht\./ }).locator('visible=true'),
  ).toHaveCount(1);
});

test('Manifest im Hochformat mit den App-Icons aus dem Design System', async ({ request }) => {
  const manifest = (await (await request.get('/manifest.webmanifest')).json()) as {
    orientation: string;
    display: string;
    start_url: string;
    scope: string;
    icons: { src: string; sizes: string; purpose: string }[];
  };
  expect(manifest.orientation).toBe('portrait');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/#/heute');
  expect(manifest.scope).toBe('/');
  expect(manifest.icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);
  for (const icon of manifest.icons) {
    const bild = await request.get(`/${icon.src}`);
    expect(bild.ok(), icon.src).toBe(true);
    expect(bild.headers()['content-type']).toBe('image/png');
  }
});

test('unbekannte Route führt nach Heute', async ({ page }) => {
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await page.goto('/#/gibt-es-nicht');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
});
