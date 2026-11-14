// Tütenfotos direkt mit der Kamera (Plan kamera; KA1-AK1 bis KA1-AK5). 360 × 640 aus der Konfiguration. Chromium mit
// nachgebildeter Kamera (--use-fake-device-for-media-stream, Testbild mit Zähler) und Freigabe ohne Rückfrage
// (--use-fake-ui-for-media-stream). REST, Storage und Edge Functions sind über page.route nachgebildet (rest.ts,
// A18 aus Plan 207); die Claude API wird nie aufgerufen. Keine Personendaten.
import type { Page, Route } from '@playwright/test';
import { saatTeile, SORTE } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import type { Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { expect, test } from './konto.ts';
import { FUNKTIONEN, kiOk, knopf, NICHT_EINGERICHTET, SIGNIEREN, testbild } from './lokal-db.ts';
import { restNachbilden } from './rest.ts';

test.use({
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  permissions: ['camera'],
});

const JETZT = new Date('2027-01-07T08:00:00Z');
const HOCHLADEN = /\/storage\/v1\/object\/saattueten\//;

interface Stand {
  daten: Teile;
  /** Pfade der hochgeladenen Fotos in der Reihenfolge des Hochladens */
  hochgeladen: string[];
  /** geschriebene Zeilen tuetenfoto */
  fotos: Record<string, unknown>[];
}

async function appVorbereiten(page: Page): Promise<Stand> {
  const jpeg = await testbild(page, '#2e7d32', 'Tüte');
  const daten: Teile = structuredClone(saatTeile(JETZT, { ohneSatzIn23: true }));
  daten['tuetenfoto'] = [];
  // name_wiss ist in der Datenbank Pflicht; saatTeile() lässt es weg, die Erkennung der Art braucht es (Plan 211 A12)
  daten['art'] = (daten['art'] ?? []).map((a) => ({ name_wiss: '', ...a }));
  const s: Stand = { daten, hochgeladen: [], fotos: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        if (tabelle === 'tuetenfoto') s.fotos.push(z);
        zeileAufnehmen(daten, tabelle, z, JETZT);
      }
    },
    () => undefined,
  );
  await page.route(HOCHLADEN, async (route: Route) => {
    const pfad = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^.*\/saattueten\//, ''));
    s.hochgeladen.push(pfad);
    return route.fulfill({ json: { Id: pfad, Key: `saattueten/${pfad}` } });
  });
  await page.route(SIGNIEREN, async (route: Route) => {
    const anfrage = route.request();
    const pfad = decodeURIComponent(
      new URL(anfrage.url()).pathname.replace(/^.*\/object\/sign\/saattueten\//, ''),
    );
    if (anfrage.method() === 'POST')
      return route.fulfill({ json: { signedURL: `/object/sign/saattueten/${pfad}?token=e2e` } });
    return route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpeg });
  });
  await page.clock.setFixedTime(JETZT);
  return s;
}

const kamera = (page: Page) => page.getByRole('dialog', { name: /^Kamera: / });
const ausloeser = (page: Page) => kamera(page).getByRole('button', { name: 'Foto aufnehmen', exact: true });

async function ausloesen(page: Page): Promise<void> {
  await expect(ausloeser(page)).toBeEnabled({ timeout: 15_000 });
  await ausloeser(page).click();
}

test('KA1-AK1 Fotofeld: Kamera direkt, Galerie und Dateien als eigene Wege', async ({ page }) => {
  const s = await appVorbereiten(page);
  await page.goto(`/#/sorten/${SORTE.eichblatt}`);
  await expect(page.getByRole('heading', { name: 'Eichblatt', level: 1 })).toBeVisible();

  const feld = page.locator('.hv-photo').filter({ hasText: 'Vorderseite' }).first();
  const mitKamera = feld.locator('input[type=file][aria-label="Vorderseite mit der Kamera"]');
  const galerie = feld.locator('input[type=file][aria-label="Vorderseite"]');
  const dateien = feld.locator('input[type=file][aria-label="Vorderseite aus Dateien"]');
  await expect(mitKamera).toHaveAttribute('capture', 'environment');
  await expect(mitKamera).toHaveAttribute('accept', 'image/*');
  await expect(galerie).toHaveAttribute('accept', 'image/*');
  expect(await galerie.getAttribute('capture')).toBeNull();
  expect(await dateien.getAttribute('accept')).toBeNull();
  expect(await dateien.getAttribute('capture')).toBeNull();
  await expect(feld).toContainText('Tütenfoto ergänzen');
  await expect(feld).toContainText('Aus Galerie wählen');
  await expect(feld).toContainText('Aus Dateien wählen');

  // ein Foto aus Dateien geht denselben Weg wie die übrigen
  await dateien.setInputFiles({
    name: 'tuete.jpg',
    mimeType: 'image/jpeg',
    buffer: await testbild(page, '#1565c0', 'Datei'),
  });
  await expect.poll(() => s.fotos.length, { timeout: 15_000 }).toBe(1);
  expect(s.fotos[0]?.['seite']).toBe('vorne');
  expect(s.hochgeladen).toHaveLength(1);
});

test('KA1-AK2 Kamera ohne Freigabe zeigt eine Meldung mit dem Weg über das Fotofeld', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => Promise.reject(new DOMException('verweigert', 'NotAllowedError')),
    });
  });
  await appVorbereiten(page);
  await page.goto(`/#/sorten/${SORTE.eichblatt}`);
  await knopf(page, 'Vorder- und Rückseite aufnehmen').click();
  await expect(kamera(page).getByRole('alert')).toContainText('nicht freigegeben');
  await expect(kamera(page).getByRole('alert')).toContainText('einzeln');
  await expect(ausloeser(page)).toBeDisabled();
  await kamera(page).getByRole('button', { name: 'Beenden', exact: true }).click();
  await expect(kamera(page)).toHaveCount(0);
});

test('KA1-AK3 Detail der Sorte: Vorder- und Rückseite mit zwei Auslösungen gespeichert', async ({ page }) => {
  const s = await appVorbereiten(page);
  await page.goto(`/#/sorten/${SORTE.eichblatt}`);
  await knopf(page, 'Vorder- und Rückseite aufnehmen').click();
  await expect(kamera(page)).toBeVisible();
  await expect(kamera(page)).toContainText('Eichblatt');
  await expect(kamera(page)).toContainText('Vorderseite');

  await ausloesen(page);
  await expect(kamera(page).getByText('Rückseite', { exact: true })).toBeVisible();
  await expect(kamera(page).getByRole('img', { name: 'Vorderseite aufgenommen' })).toBeVisible();
  expect(s.hochgeladen).toHaveLength(0);

  await ausloesen(page);
  await expect(kamera(page)).toHaveCount(0);
  await expect.poll(() => s.fotos.map((f) => f['seite']), { timeout: 15_000 }).toEqual(['vorne', 'hinten']);
  expect(s.hochgeladen).toHaveLength(2);
  for (const f of s.fotos) {
    expect(f['sorte_id']).toBe(SORTE.eichblatt);
    expect(String(f['pfad'])).toMatch(new RegExp(`^${SORTE.eichblatt}/[0-9a-f-]{36}\\.jpg$`));
  }
  await expect(page.getByRole('group', { name: 'Seite der Tüte' })).toBeVisible({ timeout: 15_000 });
});

test('KA1-AK4 Fotos nachtragen: Kamera bleibt offen und springt nach dem Speichern zur nächsten Sorte', async ({
  page,
}) => {
  const s = await appVorbereiten(page);
  await page.goto('/#/sorten');
  await page.getByRole('button', { name: /^Fotos nachtragen · \d+ ohne Foto$/ }).click();
  await expect(page.getByRole('heading', { name: 'Fotos nachtragen', level: 1 })).toBeVisible();
  await knopf(page, 'Vorder- und Rückseite aufnehmen').click();

  const titel = kamera(page).locator('.hv-kamera-titel');
  await expect(titel).toHaveText(/^1 von \d+: /);
  const gesamt = Number(/von (\d+)/.exec((await titel.textContent()) ?? '')?.[1]);
  expect(gesamt).toBeGreaterThanOrEqual(3);

  // Tüte 1: Vorderseite und Rückseite
  await ausloesen(page);
  await ausloesen(page);
  await expect(titel).toHaveText(new RegExp(`^2 von ${String(gesamt)}: `), { timeout: 15_000 });
  await expect(kamera(page).getByText('Vorderseite', { exact: true })).toBeVisible();
  expect(s.fotos.map((f) => f['seite'])).toEqual(['vorne', 'hinten']);
  expect(new Set(s.fotos.map((f) => f['sorte_id'])).size).toBe(1);

  // Tüte 2: nur Vorderseite
  await ausloesen(page);
  await kamera(page).getByRole('button', { name: 'Ohne Rückseite weiter', exact: true }).click();
  await expect(titel).toHaveText(new RegExp(`^3 von ${String(gesamt)}: `), { timeout: 15_000 });
  expect(s.fotos).toHaveLength(3);
  expect(s.fotos[2]?.['seite']).toBe('vorne');
  expect(s.fotos[2]?.['sorte_id']).not.toBe(s.fotos[0]?.['sorte_id']);

  // Tüte 3 überspringen, dann die Kamera schliessen
  await kamera(page).getByRole('button', { name: 'Sorte überspringen', exact: true }).click();
  await expect(titel).toHaveText(new RegExp(`^4 von ${String(gesamt)}: `));
  await kamera(page).getByRole('button', { name: 'Beenden', exact: true }).click();
  await expect(kamera(page)).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: new RegExp(`^4 von ${String(gesamt)}: `), level: 2 }),
  ).toBeVisible();
  expect(s.hochgeladen).toHaveLength(3);
});

test('KA1-AK5 Tüte erfassen: nach Vorder- und Rückseite liest die App die Tüte ohne weiteren Tipp', async ({
  page,
}) => {
  const anfragen: Record<string, unknown>[] = [];
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    anfragen.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: kiOk('Kameratest', 'Salat') });
  });
  await page.route(`${FUNKTIONEN}/ki-recherche`, (route) => route.fulfill({ json: NICHT_EINGERICHTET }));
  const s = await appVorbereiten(page);
  await page.goto('/#/sorten');
  await knopf(page, 'Tüte erfassen').click();
  await knopf(page, 'Vorder- und Rückseite aufnehmen').click();
  await ausloesen(page);
  await ausloesen(page);
  await expect(kamera(page)).toHaveCount(0);
  await expect.poll(() => anfragen.length, { timeout: 15_000 }).toBe(1);
  expect((anfragen[0]?.['fotopfade'] as string[] | undefined) ?? []).toHaveLength(2);
  expect(s.hochgeladen).toHaveLength(2);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Kameratest', { timeout: 15_000 });
});
