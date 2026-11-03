// Datenpfad (I0-04, Plan 11), Runde 2: Befund N1 des Prüfers Fachlogik.
// TO6 mit abgelaufenem Zugriffstoken: offline liefert getSession() session null, die Sitzung bleibt
// laut I0-06 «angemeldet»; Heute muss das gespeicherte Bündel trotzdem innert 2 s zeigen (UC8-AK9).
// Helfer aus tests/e2e/datenpfad.spec.ts kopiert (die Datei bleibt unverändert).
import type { Page } from '@playwright/test';
import { expect, test } from './konto.ts';

/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

/** Bündel buendel/aktuell aus IndexedDB «hydrovisor» (Speicher buendel, keyPath id) */
function buendelAusSpeicher(
  page: Page,
): Promise<{ stand: string; teile: Record<string, unknown[]> } | undefined> {
  return page.evaluate(
    () =>
      new Promise((erfuellen, ablehnen) => {
        const anfrage = indexedDB.open('hydrovisor');
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onsuccess = () => {
          const db = anfrage.result;
          if (!db.objectStoreNames.contains('buendel')) {
            db.close();
            return erfuellen(undefined);
          }
          const lesen = db.transaction('buendel').objectStore('buendel').get('aktuell');
          lesen.onsuccess = () => {
            db.close();
            erfuellen(lesen.result);
          };
          lesen.onerror = () => ablehnen(lesen.error);
        };
      }),
  );
}

/** «Stand: hh:mm», am Vortag «Stand: TT.MM. hh:mm» (A2); unabhängig von der App mit Intl in Europe/Zurich */
function standErwartet(standIso: string, jetzt: Date): string {
  const teile = (d: Date) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('de-CH', {
        timeZone: 'Europe/Zurich',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(d)
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
  const s = teile(new Date(standIso));
  const j = teile(jetzt);
  const uhr = `${s['hour']}:${s['minute']}`;
  const gleicherTag = s['year'] === j['year'] && s['month'] === j['month'] && s['day'] === j['day'];
  return gleicherTag ? `Stand: ${uhr}` : `Stand: ${s['day']}.${s['month']}. ${uhr}`;
}

/** Gespeicherte Sitzung so ändern, dass das Zugriffstoken seit 10 Minuten abgelaufen ist */
function tokenAblaufenLassen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const roh = localStorage.getItem('hydrovisor-sitzung');
    if (roh === null) return false;
    const sitzung = JSON.parse(roh) as Record<string, unknown>;
    const jetztSekunden = Math.floor(Date.now() / 1000);
    sitzung['expires_at'] = jetztSekunden - 600;
    if ('expires_in' in sitzung) sitzung['expires_in'] = -600;
    localStorage.setItem('hydrovisor-sitzung', JSON.stringify(sitzung));
    return true;
  });
}

test('TO6 Heute offline mit abgelaufenem Zugriffstoken: Bündel sichtbar mit «Stand: hh:mm», kein «Kein Zugang»', async ({
  page,
  context,
  konto,
}) => {
  test.setTimeout(60_000);
  const heute = page.getByRole('heading', { name: 'Heute', level: 1 });
  const standZeile = page.locator('[data-buendel-stand]');
  await konto.anmelden(page);

  // online: App installiert, vom Service Worker gesteuert, Bündel geladen
  await page.goto('/#/heute');
  await page.evaluate(async () => void (await navigator.serviceWorker.ready));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(heute).toBeVisible();
  await expect.poll(async () => (await buendelAusSpeicher(page))?.stand, { timeout: 15_000 }).toBeTruthy();
  const online = da(await buendelAusSpeicher(page), 'Bündel online');
  await expect(standZeile).toHaveAttribute('data-buendel-stand', online.stand);

  // offline, Zugriffstoken seit 10 Minuten abgelaufen (jwt_expiry 3600), dann neu laden
  await context.setOffline(true);
  expect(await tokenAblaufenLassen(page), 'Sitzung hydrovisor-sitzung im localStorage').toBe(true);
  await page.reload();

  await expect(heute).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden' })).toHaveCount(0);
  // UC8-AK9: Stand innert 2 s
  await expect(page.getByText(standErwartet(online.stand, new Date()), { exact: true })).toBeVisible({
    timeout: 2000,
  });
  await expect(standZeile).toHaveAttribute('data-buendel-stand', online.stand);

  // auch nach weiteren 5 s kein «Kein Zugang» (getSession() liefert offline session null)
  await page.waitForTimeout(5000);
  await expect(page.getByText('Kein Zugang für dieses Konto')).toHaveCount(0);
  await expect(standZeile).toHaveAttribute('data-buendel-stand', online.stand);

  const offline = da(await buendelAusSpeicher(page), 'Bündel offline');
  expect(offline.stand).toBe(online.stand);
  await context.setOffline(false);
});
