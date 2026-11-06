// Datenpfad (I0-04, Plan 11): UC9-AK8 (I0-Teil) mit TO2 und TO8, Ü1 neue client_id nach geänderter Eingabe, TO6.
// Gegen den Produktions-Build (vite preview) und die lokale Datenbank mit echtem Testkonto in zugang (RLS greift echt).
// Prüfstand ist die Schreibtisch-Maske #/schreibprobe (pH-Kontrolle, Datenart test).
import type { Page, Request } from '@playwright/test';
import { expect, test } from './konto.ts';

const KEIN_NETZ = 'Kein Netz, nicht gespeichert, erneut senden';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const phFeld = (page: Page) => page.getByLabel('pH', { exact: true });
const speichern = (page: Page) => page.getByRole('button', { name: 'Speichern', exact: true });
const erneutSenden = (page: Page) => page.getByRole('button', { name: 'Erneut senden', exact: true });
const gespeichert = (page: Page) => page.getByText('Gespeichert', { exact: true });
const keinNetz = (page: Page) => page.getByRole('alert').filter({ hasText: KEIN_NETZ });

/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

async function clientIdDerMaske(page: Page): Promise<string> {
  const wert = await page.locator('[data-client-id]').getAttribute('data-client-id');
  expect(wert, 'data-client-id').toMatch(UUID);
  return da(wert, 'data-client-id');
}

/** client_id aus dem Body eines POST auf messung (Objekt oder Array von supabase-js) */
function clientIdAusBody(anfrage: Request): string {
  const body: unknown = anfrage.postDataJSON();
  const zeile = (Array.isArray(body) ? body[0] : body) as { client_id?: string } | undefined;
  expect(zeile?.client_id, 'client_id im Body').toMatch(UUID);
  return da(zeile?.client_id, 'client_id');
}

/** Schreibprobe öffnen und warten, bis das Messgerät aus dem Bündel da ist (Speichern aktiv) */
async function schreibprobeOeffnen(page: Page): Promise<void> {
  await page.goto('/#/schreibprobe');
  await expect(phFeld(page)).toBeVisible();
  await expect(speichern(page)).toBeEnabled();
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

test('UC9-AK8 TO2 Server speichert, Antwort verworfen, Wiederholung: genau 1 Datensatz', async ({
  page,
  konto,
}) => {
  await konto.anmelden(page);
  const posts: Request[] = [];
  let antwortVerwerfen = true;
  await page.route(`${konto.apiUrl}/rest/v1/messung*`, async (route) => {
    const anfrage = route.request();
    if (anfrage.method() !== 'POST') return route.continue();
    posts.push(anfrage);
    if (antwortVerwerfen) {
      antwortVerwerfen = false;
      // der Server speichert, die Antwort kommt nie an
      await route.fetch();
      return route.abort('connectionreset');
    }
    return route.continue();
  });

  await schreibprobeOeffnen(page);
  await phFeld(page).fill('7.02');
  await speichern(page).click();

  await expect(keinNetz(page)).toBeVisible();
  await expect(phFeld(page)).toHaveValue('7.02');
  await expect(erneutSenden(page)).toBeVisible();
  expect(posts).toHaveLength(1);
  const clientId = clientIdAusBody(da(posts[0], 'erster POST'));
  expect(await clientIdDerMaske(page)).toBe(clientId);
  expect(await konto.messungen(clientId)).toBe(1);

  // Wiederholung mit unveränderter Eingabe (Ü4): dieselbe client_id, der Server ignoriert das Duplikat
  await erneutSenden(page).click();
  await expect(gespeichert(page)).toBeVisible();
  expect(posts).toHaveLength(2);
  expect(clientIdAusBody(da(posts[1], 'zweiter POST'))).toBe(clientId);
  expect(da(posts[1], 'zweiter POST').headers()['prefer']).toContain('resolution=ignore-duplicates');
  expect(await konto.messungen(clientId)).toBe(1);
  expect(await konto.phVon(clientId)).toBe('7.02');
});

test('UC9-AK8 TO8 Speichern ohne Netz: «nicht gespeichert», Eingaben bleiben', async ({
  page,
  context,
  konto,
}) => {
  await konto.anmelden(page);
  await schreibprobeOeffnen(page);
  await phFeld(page).fill('7.01');

  await context.setOffline(true);
  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  await expect(phFeld(page)).toHaveValue('7.01');
  await expect(erneutSenden(page)).toBeVisible();
  await expect(speichern(page)).toBeVisible();
  const clientId = await clientIdDerMaske(page);
  expect(await konto.messungen(clientId)).toBe(0);

  // wieder online, «Speichern» mit unveränderter Eingabe schickt dieselbe client_id
  await context.setOffline(false);
  await speichern(page).click();
  await expect(gespeichert(page)).toBeVisible();
  await expect(keinNetz(page)).toHaveCount(0);
  expect(await konto.messungen(clientId)).toBe(1);
  expect(await konto.phVon(clientId)).toBe('7.01');
});

test('UC9-AK8 Eingabe ändern nach Fehler erzeugt eine neue client_id', async ({ page, context, konto }) => {
  await konto.anmelden(page);
  await schreibprobeOeffnen(page);
  await phFeld(page).fill('7.01');

  await context.setOffline(true);
  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  const erste = await clientIdDerMaske(page);

  // unveränderte Eingabe: «Erneut senden» behält die client_id
  await erneutSenden(page).click();
  await expect(keinNetz(page)).toBeVisible();
  expect(await clientIdDerMaske(page)).toBe(erste);

  // geänderte Eingabe nach dem Fehler: neue client_id (Ü1)
  await phFeld(page).fill('7.03');
  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  const zweite = await clientIdDerMaske(page);
  expect(zweite).not.toBe(erste);

  await context.setOffline(false);
  await speichern(page).click();
  await expect(gespeichert(page)).toBeVisible();
  expect(await konto.messungen(zweite)).toBe(1);
  expect(await konto.phVon(zweite)).toBe('7.03');
  expect(await konto.messungen(erste)).toBe(0);
});

test('TO6 Heute online geladen, offline neu geladen: Bündel sichtbar mit «Stand: hh:mm»', async ({
  page,
  context,
  konto,
}) => {
  const heute = page.getByRole('heading', { name: 'Heute', level: 1 });
  const standZeile = page.locator('[data-buendel-stand]');
  await konto.anmelden(page);

  // online: App installiert, vom Service Worker gesteuert, Bündel geladen
  await page.goto('/#/heute');
  await page.evaluate(async () => void (await navigator.serviceWorker.ready));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(heute).toBeVisible();
  // warten, bis das letzte Laden fertig ist: Stand in IndexedDB und in der Oberfläche gleich (#79; nach dem
  // Neuladen lädt die App ein zweites Bündel, der neuere Stand gewinnt)
  await expect
    .poll(
      async () => {
        const s = (await buendelAusSpeicher(page))?.stand;
        return s !== undefined && s === (await standZeile.getAttribute('data-buendel-stand'));
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  const online = da(await buendelAusSpeicher(page), 'Bündel online');
  await expect(standZeile).toHaveAttribute('data-buendel-stand', online.stand);

  // offline neu laden: Heute ohne Anmeldung, Bündel aus IndexedDB mit «Stand: hh:mm»
  await context.setOffline(true);
  await page.reload();
  await expect(heute).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden' })).toHaveCount(0);
  await expect(page.getByText(standErwartet(online.stand, new Date()), { exact: true })).toBeVisible();
  await expect(standZeile).toHaveAttribute('data-buendel-stand', online.stand);

  const offline = da(await buendelAusSpeicher(page), 'Bündel offline');
  expect(offline.stand).toBe(online.stand);
  const geraete = await konto.messgeraete();
  expect(geraete).toBeGreaterThanOrEqual(1);
  expect(offline.teile['messgeraet']).toHaveLength(geraete);

  // ein zweites Neuladen offline: das gescheiterte Laden überschreibt nichts
  await page.reload();
  await expect(heute).toBeVisible();
  await expect(page.getByText(standErwartet(online.stand, new Date()), { exact: true })).toBeVisible();
  expect((await buendelAusSpeicher(page))?.stand).toBe(online.stand);
  await context.setOffline(false);
});
