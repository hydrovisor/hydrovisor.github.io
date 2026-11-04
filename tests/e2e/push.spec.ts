// Push in der Oberfläche (I0-08, Plan 13 Testliste): Hinweis in Heute und Übergangsmaske #/push.
// Gegen den Produktions-Build (vite preview, 360 × 640) ohne VITE_VAPID_PUBLIC_KEY und die lokale Datenbank mit
// Testkonto (konto.ts). Kein echter Push-Dienst: der Browser hat kein Abo, es entsteht keines.
// Vorausgesetzt:
// - Heute zeigt den Hinweis aus pushStand(): ohne Browser-Abo (Berechtigung erteilt, kein Endpoint) ist der
//   Stand «nicht_eingerichtet» (kein_abo), unabhängig von Abos anderer Geräte in push_abo; «unterstützt» ist die
//   Fähigkeit des Browsers (Service Worker und PushManager), nicht das Vorhandensein des VAPID-Schlüssels.
// - Der Knopf «Push einrichten» in Heute ist ein Link oder Button und führt zu #/push.
import type { Page } from '@playwright/test';
import { expect, test } from './konto.ts';

const NICHT_EINGERICHTET = 'Push nicht eingerichtet';
const NICHT_VERFUEGBAR = 'Push in dieser Umgebung nicht verfügbar';

/** Link oder Button mit genau diesem Namen */
const knopf = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

/** sammelt nicht abgefangene Fehler der Seite ab jetzt */
function fehlerSammeln(page: Page): string[] {
  const fehler: string[] = [];
  page.on('pageerror', (f) => fehler.push(f.message));
  return fehler;
}

test('UC0-AK5 Heute ohne Abo zeigt «Push nicht eingerichtet» mit Knopf «Push einrichten» → #/push', async ({
  page,
  context,
  konto,
}) => {
  await context.grantPermissions(['notifications']);
  await konto.anmelden(page);
  await page.goto('/#/heute');
  const hinweis = page.getByRole('status').filter({ hasText: NICHT_EINGERICHTET });
  await expect(hinweis).toBeVisible({ timeout: 15_000 });
  const einrichten = knopf(page, 'Push einrichten');
  await expect(einrichten).toBeVisible();
  // Regal-Maske: Taste mindestens 48 dp hoch (Notice-Aktion; Regal-Tasten 68 dp prüft der Gerätetest)
  const box = await einrichten.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(47.5);
  await einrichten.click();
  await expect(page).toHaveURL(/#\/push$/);
});

test('11.3 #/push ohne VAPID-Schlüssel: «Push in dieser Umgebung nicht verfügbar», keine Fehlermeldung', async ({
  page,
  context,
  konto,
}) => {
  await context.grantPermissions(['notifications']);
  const fehler = fehlerSammeln(page);
  await konto.anmelden(page);
  await page.goto('/#/push');
  await expect(page.getByText(NICHT_VERFUEGBAR)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(fehler).toEqual([]);
});
