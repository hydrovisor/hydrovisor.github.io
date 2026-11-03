// Runde 1 I0-07 (#12): TO2 in der Messmaske Y-2.3 und der Kalibriermaske (Datenart test).
// Der Server speichert den ersten POST, die Antwort wird verworfen (route.fetch() und route.abort('connectionreset')).
// «Erneut senden» mit derselben client_id muss «Gespeichert hh:mm» bzw. «Kalibriert · gültig bis …» ergeben,
// nie «Schon gespeichert», und genau 1 Zeile. Lokale Datenbank mit Testkonto (konto.ts) und Testanlage Y (orte.ts).
import type { Page, Request } from '@playwright/test';
import { expect, test } from './orte.ts';

const KEIN_NETZ = 'Kein Netz, nicht gespeichert, erneut senden';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const speichern = (page: Page) => page.getByRole('button', { name: 'Speichern', exact: true });
const erneutSenden = (page: Page) => page.getByRole('button', { name: 'Erneut senden', exact: true });
const keinNetz = (page: Page) => page.getByRole('alert').filter({ hasText: KEIN_NETZ });
const schonGespeichert = (page: Page) => page.getByText(/Schon gespeichert/);
/** Messwert-Kachel (MesswertKachel als Button, Name beginnt mit der Bezeichnung) */
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}`) });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

/** tippt Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
}

/** client_id aus dem Body eines POST (Objekt oder Array von supabase-js) */
function clientIdAusBody(anfrage: Request): string {
  const body: unknown = anfrage.postDataJSON();
  const zeile = (Array.isArray(body) ? body[0] : body) as { client_id?: string } | undefined;
  expect(zeile?.client_id, 'client_id im Body').toMatch(UUID);
  return da(zeile?.client_id, 'client_id');
}

/** fängt POST auf die Tabelle ab; der erste wird gespeichert, seine Antwort verworfen */
async function ersteAntwortVerwerfen(page: Page, apiUrl: string, tabelle: string): Promise<Request[]> {
  const posts: Request[] = [];
  let verwerfen = true;
  await page.route(`${apiUrl}/rest/v1/${tabelle}*`, async (route) => {
    const anfrage = route.request();
    if (anfrage.method() !== 'POST') return route.continue();
    posts.push(anfrage);
    if (verwerfen) {
      verwerfen = false;
      // der Server speichert, die Antwort kommt nie an
      await route.fetch();
      return route.abort('connectionreset');
    }
    return route.continue();
  });
  return posts;
}

test('TO2 Messmaske Y-2.3: Server speichert, Antwort verworfen, Erneut senden ergibt «Gespeichert» und genau 1 Zeile', async ({
  page,
  konto,
  orte,
}) => {
  await konto.anmelden(page);
  const posts = await ersteAntwortVerwerfen(page, konto.apiUrl, 'messung');
  await page.goto('/#/messen/Y-2.3');
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  await kachel(page, 'EC').click();
  await ziffern(page, '128');
  await expect(kachel(page, 'EC')).toContainText('1.28');

  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  await expect(erneutSenden(page)).toBeVisible();
  expect(posts).toHaveLength(1);
  const clientId = clientIdAusBody(da(posts[0], 'erster POST'));
  await expect.poll(() => orte.messungen(clientId)).toBe(1);

  // mindestens 1.5 s warten, damit sich eine Dauer in Sekunden ändern würde
  await page.waitForTimeout(1_600);
  await erneutSenden(page).click();
  await expect(page.getByText(/^Gespeichert \d{2}:\d{2}/)).toBeVisible();
  await expect(schonGespeichert(page)).toHaveCount(0);
  await expect(keinNetz(page)).toHaveCount(0);
  expect(posts).toHaveLength(2);
  expect(clientIdAusBody(da(posts[1], 'zweiter POST'))).toBe(clientId);
  expect(await orte.messungen(clientId)).toBe(1);
});

test('TO2 Kalibrierung: Antwort verworfen, Erneut senden ergibt «Kalibriert · gültig bis …» und genau 1 Zeile', async ({
  page,
  konto,
  orte,
}) => {
  await orte.kalibrierungenZuruecksetzen('test');
  await konto.anmelden(page);
  const posts = await ersteAntwortVerwerfen(page, konto.apiUrl, 'kalibrierung');
  await page.goto('/#/kalibrieren?datenart=test');
  await expect(page.getByRole('heading', { name: 'Messgerät kalibrieren' })).toBeVisible({ timeout: 15_000 });
  await ziffern(page, '141');

  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  await expect(erneutSenden(page)).toBeVisible();
  expect(posts).toHaveLength(1);
  const clientId = clientIdAusBody(da(posts[0], 'erster POST'));
  await expect.poll(async () => (await orte.kalibrierungen('test')).length).toBe(1);

  // mindestens 1.5 s warten, damit sich eine Dauer in Sekunden ändern würde
  await page.waitForTimeout(1_600);
  await erneutSenden(page).click();
  await expect(page.getByText(/^Kalibriert · gültig bis \d{1,2}\.\d{1,2}\.$/)).toBeVisible();
  await expect(schonGespeichert(page)).toHaveCount(0);
  await expect(keinNetz(page)).toHaveCount(0);
  expect(posts).toHaveLength(2);
  expect(clientIdAusBody(da(posts[1], 'zweiter POST'))).toBe(clientId);
  expect(await orte.kalibrierungen('test')).toHaveLength(1);
  expect((await orte.kalibrierungen('test'))[0]).toMatchObject({ gegenprobe_ec: 1.41 });
});
