// Anmeldung (I0-06, Plan 8): UC0-AK7 ist [Gerät]; hier die Vorstufen im Browser gegen eine nachgebildete Auth.
import { expect, test, type Page } from '@playwright/test';
import { authNachbilden, sitzung, sitzungSpeichern } from './hilfen.ts';

const heute = (page: Page) => page.getByRole('heading', { name: 'Heute', level: 1 });

test('UC0-AK7 Vorstufe: ohne Sitzung erscheint die Anmeldung mit E-Mail, Passwort und Anmelden, ohne Registrierung', async ({
  page,
}) => {
  await authNachbilden(page);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Anmeldung', level: 1 })).toBeVisible();
  await expect(
    page.getByRole('img', { name: /Hydroponik mit Weitsicht\./ }).locator('visible=true'),
  ).toHaveCount(1);
  await expect(page.getByLabel('E-Mail')).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Passwort')).toHaveAttribute('type', 'password');
  await expect(page.getByRole('button')).toHaveText(['Anmelden']);
  await expect(page.getByText(/registrier|magic link|link senden|konto erstellen/i)).toHaveCount(0);
  await expect(heute(page)).toHaveCount(0);
  // Schreibtisch-Maske: Standarddichte
  await expect(page.locator('main[data-density]')).toHaveCount(0);
});

test('Anmeldung mit falschem Passwort zeigt den Fehler und bleibt', async ({ page }) => {
  await authNachbilden(page, (route) =>
    route.fulfill({
      status: 400,
      json: {
        code: 'invalid_credentials',
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      },
    }),
  );
  await page.goto('/#/anmelden');
  await page.getByLabel('E-Mail').fill('tim@example.test');
  await page.getByLabel('Passwort').fill('falsch');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toHaveText('E-Mail oder Passwort stimmt nicht.');
  await expect(page.getByLabel('E-Mail')).toHaveValue('tim@example.test');
  await expect(page.locator('[data-sitzung="abgemeldet"]')).toBeAttached();
});

test('Anmeldung ohne Netz meldet «Kein Netz» und behält die Eingaben', async ({ page }) => {
  await authNachbilden(page, (route) => route.abort('internetdisconnected'));
  await page.goto('/#/anmelden');
  await page.getByLabel('E-Mail').fill('tim@example.test');
  await page.getByLabel('Passwort').fill('geheim');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toContainText('Kein Netz, nicht angemeldet.');
  await expect(page.getByLabel('Passwort')).toHaveValue('geheim');
});

test('UC0-AK7 Vorstufe: nach der Anmeldung bleibt Heute über ein Neuladen', async ({ page }) => {
  let anmeldungen = 0;
  await authNachbilden(page, async (route, art) => {
    if (art === 'password') anmeldungen += 1;
    await route.fulfill({ json: sitzung() });
  });
  await page.goto('/#/anmelden');
  await page.getByLabel('E-Mail').fill('tim@example.test');
  await page.getByLabel('Passwort').fill('richtig');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(heute(page)).toBeVisible();
  await expect(page).toHaveURL(/#\/heute$/);
  expect(anmeldungen).toBe(1);

  await page.reload();
  await expect(heute(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden' })).toHaveCount(0);
  expect(anmeldungen).toBe(1);
});

test('UC0-AK7 Vorstufe: abgelaufene Sitzung ohne Netz öffnet Heute ohne Anmeldung', async ({ page }) => {
  await sitzungSpeichern(page, -600);
  let erneuerung = 0;
  await authNachbilden(page, async (route, art) => {
    if (art === 'refresh_token') erneuerung += 1;
    await route.abort('internetdisconnected');
  });
  // supabase-js wiederholt die Erneuerung bis 30 s und meldet danach INITIAL_SESSION ohne Sitzung
  // (mit console.warn); die Uhr überspringt die Wartezeit
  await page.clock.install();
  await page.goto('/#/heute');
  await expect(heute(page)).toBeVisible();
  const ohneSitzungGemeldet = page.waitForEvent('console', {
    predicate: (m) => m.type() === 'warning' && /AuthRetryableFetchError|fetch/i.test(m.text()),
    timeout: 10_000,
  });
  await page.clock.runFor(40_000);
  await ohneSitzungGemeldet;
  // die Warnung folgt dem Callback; React rendert über eine MessageChannel-Aufgabe (nicht von der Uhr gefälscht),
  // eine eigene Nachricht danach kommt erst nach diesem Rendern an (Prüferbefund 3)
  await page.clock.runFor(100);
  await page.evaluate(
    () =>
      new Promise((fertig) => {
        const kanal = new MessageChannel();
        kanal.port1.onmessage = () => fertig(null);
        kanal.port2.postMessage(0);
      }),
  );
  expect(erneuerung).toBeGreaterThan(1);
  // nach der gescheiterten Erneuerung weiter angemeldet, Sitzung bleibt gespeichert
  await expect(page.locator('[data-sitzung="angemeldet"]')).toBeAttached();
  await expect(heute(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden' })).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem('hydrovisor-sitzung'))).not.toBeNull();
});

test('Abgelehnte Erneuerung meldet ab und zeigt die Anmeldung', async ({ page }) => {
  await sitzungSpeichern(page, -600);
  await authNachbilden(page, (route) =>
    route.fulfill({
      status: 400,
      json: {
        code: 'refresh_token_not_found',
        error_code: 'refresh_token_not_found',
        msg: 'Invalid Refresh Token',
      },
    }),
  );
  await page.goto('/#/heute');
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  await expect(page.locator('[data-sitzung="abgemeldet"]')).toBeAttached();
});

test('Info zeigt Installation und dauerhaften Speicher nach der Anmeldung', async ({ page }) => {
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await page.goto('/#/info');
  await expect(page.getByTestId('installiert')).toHaveText('nein');
  await expect(page.getByTestId('speicher')).toHaveText(/^(erteilt|nicht erteilt)$/);
});
