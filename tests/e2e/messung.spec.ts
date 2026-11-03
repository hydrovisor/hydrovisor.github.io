// Einfache Messung (I0-07, Plan 12 Testliste): Messmaske #/messen/<code> und Kalibriermaske #/kalibrieren.
// Gegen den Produktions-Build (vite preview, 360 × 640) und die lokale Datenbank mit Testkonto (konto.ts) und
// Testanlage Y (orte.ts): Y-2.3 DWC, Y-3.1 Kratky belüftet, Y-W. Eingabe nur über den eigenen Ziffernblock.
import type { Locator, Page, Request } from '@playwright/test';
import { expect, test } from './orte.ts';

const KEIN_NETZ = 'Kein Netz, nicht gespeichert, erneut senden';
const NIE_KALIBRIERT = 'Noch nie kalibriert: Werte unsicher';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const speichern = (page: Page) => page.getByRole('button', { name: 'Speichern', exact: true });
const erneutSenden = (page: Page) => page.getByRole('button', { name: 'Erneut senden', exact: true });
const gespeichert = (page: Page) => page.getByText(/^Gespeichert \d{2}:\d{2}/);
const keinNetz = (page: Page) => page.getByRole('alert').filter({ hasText: KEIN_NETZ });
/** Messwert-Kachel (MesswertKachel als Button, Name beginnt mit der Bezeichnung) */
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}`) });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
/** Link oder Button «Kalibrieren» */
const kalibrierenKnopf = (page: Page) =>
  page
    .getByRole('link', { name: 'Kalibrieren', exact: true })
    .or(page.getByRole('button', { name: 'Kalibrieren', exact: true }));

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

const postAuf = (page: Page, apiUrl: string, tabelle: string) =>
  page.waitForRequest((r) => r.method() === 'POST' && r.url().startsWith(`${apiUrl}/rest/v1/${tabelle}`), {
    timeout: 15_000,
  });

/** Messmaske öffnen und warten, bis der Ort aus dem Bündel aufgelöst ist (Kachel EC sichtbar) */
async function messmaskeOeffnen(page: Page, code: string): Promise<void> {
  await page.goto(`/#/messen/${code}`);
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
}

/** keine senkrechte Bildlaufleiste: Inhalt passt in die Höhe des Viewports */
async function ohneScrollen(page: Page): Promise<void> {
  const { hoehe, fenster } = await page.evaluate(() => ({
    hoehe: document.scrollingElement?.scrollHeight ?? document.body.scrollHeight,
    fenster: window.innerHeight,
  }));
  expect(hoehe, 'Seitenhöhe').toBeLessThanOrEqual(fenster);
}

async function hoeheMindestens(locator: Locator, dp: number): Promise<void> {
  const box = da(await locator.boundingBox(), 'Bounding Box');
  expect(box.height).toBeGreaterThanOrEqual(dp - 0.5);
}

test('UC9-AK2 Messmaske Y-2.3: Speichern erst nach einem Wert, nur EC gespeichert, ph und temperatur null in der Datenbank', async ({
  page,
  konto,
  orte,
}) => {
  await konto.anmelden(page);
  await messmaskeOeffnen(page, 'Y-2.3');
  await expect(kachel(page, 'pH')).toBeVisible();
  await expect(kachel(page, '°C')).toBeVisible();
  await expect(speichern(page)).toBeDisabled();

  await kachel(page, 'EC').click();
  await ziffern(page, '125');
  await expect(kachel(page, 'EC')).toContainText('1.25');
  await expect(speichern(page)).toBeEnabled();

  const post = postAuf(page, konto.apiUrl, 'messung');
  await speichern(page).click();
  const clientId = clientIdAusBody(await post);
  await expect(gespeichert(page)).toBeVisible();

  await expect.poll(() => orte.messungen(clientId)).toBe(1);
  const zeile = da(await orte.messung(clientId), 'Messung');
  expect(zeile).toMatchObject({
    ph: null,
    ec: 1.25,
    temperatur: null,
    messart: 'aufgabe',
    datenart: null,
    platz_id: orte.platz['Y-2.3'],
    storniert_am: null,
  });
});

test('R10.3 ohne Testkalibrierung Banner «Noch nie kalibriert: Werte unsicher»; nach Kalibrierung (Datenart test) kein Banner', async ({
  page,
  konto,
  orte,
}) => {
  await orte.kalibrierungenZuruecksetzen('test');
  const echtVorher = (await orte.kalibrierungen('echt')).length;
  await konto.anmelden(page);
  await messmaskeOeffnen(page, 'Y-2.3');
  await expect(page.getByText(NIE_KALIBRIERT)).toBeVisible();

  // der Knopf im Banner führt zur Kalibriermaske mit der Datenart der Testanlage
  await kalibrierenKnopf(page).click();
  await expect(page).toHaveURL(/#\/kalibrieren\?datenart=test$/);
  await expect(page.getByRole('heading', { name: 'Messgerät kalibrieren' })).toBeVisible();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();

  // Gegenprobe 1.41 über den Ziffernblock
  await ziffern(page, '141');
  const post = postAuf(page, konto.apiUrl, 'kalibrierung');
  await speichern(page).click();
  await post;
  await expect(page.getByText(/^Kalibriert · gültig bis \d{1,2}\.\d{1,2}\.$/)).toBeVisible();
  await expect.poll(async () => (await orte.kalibrierungen('test')).length).toBe(1);
  expect((await orte.kalibrierungen('test'))[0]).toMatchObject({
    gegenprobe_ec: 1.41,
    nach_reinigung: false,
  });
  // die echte Fälligkeit bleibt unberührt (G5): keine echte Kalibrierung entstanden
  expect(await orte.kalibrierungen('echt')).toHaveLength(echtVorher);

  await messmaskeOeffnen(page, 'Y-2.3');
  await expect(page.getByText(NIE_KALIBRIERT)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText(/Werte unsicher/)).toHaveCount(0);
});

test('Konzept 5.6 A9 Gegenprobe ausserhalb u_EC sperrt Speichern der Kalibrierung', async ({
  page,
  konto,
  orte,
}) => {
  await orte.kalibrierungenZuruecksetzen('test');
  await konto.anmelden(page);
  await page.goto('/#/kalibrieren?datenart=test');
  await expect(page.getByRole('heading', { name: 'Messgerät kalibrieren' })).toBeVisible({ timeout: 15_000 });
  await ziffern(page, '155');
  await expect(
    page.getByText('Gegenprobe 1.55 ausserhalb 1.31–1.51: Sonde spülen und neu kalibrieren'),
  ).toBeVisible();
  await expect(speichern(page)).toBeDisabled();
  expect(await orte.kalibrierungen('test')).toHaveLength(0);
});

test('U1 Messmaske ohne Scrollen auf 360 × 640, auch Y-3.1 mit Füllstand; Tasten 68 dp; keine Systemtastatur (kein input-Feld im Fokus)', async ({
  page,
  konto,
  orte,
}) => {
  // mit Banner «unsicher» als ungünstigster Fall
  await orte.kalibrierungenZuruecksetzen('test');
  await konto.anmelden(page);

  for (const code of ['Y-2.3', 'Y-3.1'] as const) {
    await messmaskeOeffnen(page, code);
    await expect(page.locator('main[data-density="regal"]')).toBeVisible();
    await expect(page.getByText(NIE_KALIBRIERT)).toBeVisible();
    await ohneScrollen(page);
    for (const name of ['Ziffer 7', 'Ziffer 0', 'leeren', 'Rücktaste', 'weiter'])
      await hoeheMindestens(taste(page, name), 68);
    const knopf = da(await speichern(page).boundingBox(), 'Speichern');
    expect(knopf.y + knopf.height, 'Speichern im Viewport').toBeLessThanOrEqual(640);

    await kachel(page, 'EC').click();
    await ziffern(page, '13');
    const fokus = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, editierbar: (el as HTMLElement).isContentEditable } : undefined;
    });
    expect(['INPUT', 'TEXTAREA', 'SELECT']).not.toContain(fokus?.tag);
    expect(fokus?.editierbar ?? false).toBe(false);
  }

  // Y-3.1 Kratky belüftet: Füllstand als Pflichtfeld, Speichern erst mit Füllstand (R4.10)
  const ueber = page.getByRole('button', { name: 'über ⅓', exact: true });
  const unter = page.getByRole('button', { name: 'unter ⅓', exact: true });
  await expect(ueber).toBeVisible();
  await expect(unter).toBeVisible();
  await ziffern(page, '5');
  await expect(kachel(page, 'EC')).toContainText('1.35');
  await expect(speichern(page)).toBeDisabled();
  await unter.click();
  await expect(unter).toHaveAttribute('aria-pressed', 'true');
  await expect(ueber).toHaveAttribute('aria-pressed', 'false');
  await expect(speichern(page)).toBeEnabled();
  await ohneScrollen(page);
});

test('TO8 Messmaske ohne Netz: «Kein Netz, nicht gespeichert, erneut senden», Eingaben bleiben; online erneut senden ergibt genau 1 Zeile mit dem gilt_ab des ersten Versuchs', async ({
  page,
  context,
  konto,
  orte,
}) => {
  await konto.anmelden(page);
  await messmaskeOeffnen(page, 'Y-2.3');
  await kachel(page, 'EC').click();
  await ziffern(page, '135');

  await context.setOffline(true);
  const vorErstemVersuch = Date.now();
  await speichern(page).click();
  await expect(keinNetz(page)).toBeVisible();
  const nachErstemVersuch = Date.now();
  await expect(kachel(page, 'EC')).toContainText('1.35');
  await expect(erneutSenden(page)).toBeVisible();

  // deutlich später erneut senden: gilt_ab muss der erste Versuch bleiben
  await page.waitForTimeout(2_000);
  await context.setOffline(false);
  const vorZweitemVersuch = Date.now();
  const post = postAuf(page, konto.apiUrl, 'messung');
  await erneutSenden(page).click();
  const clientId = clientIdAusBody(await post);
  await expect(gespeichert(page)).toBeVisible();
  await expect(keinNetz(page)).toHaveCount(0);

  await expect.poll(() => orte.messungen(clientId)).toBe(1);
  const zeile = da(await orte.messung(clientId), 'Messung');
  expect(zeile.ec).toBe(1.35);
  const giltAb = zeile.gilt_ab.getTime();
  expect(giltAb).toBeGreaterThanOrEqual(vorErstemVersuch - 1_000);
  expect(giltAb).toBeLessThanOrEqual(nachErstemVersuch);
  expect(giltAb).toBeLessThan(vorZweitemVersuch);
});

test('U4 Rückgängig storniert die Messung (storniert_am gesetzt, Grund rueckgaengig)', async ({
  page,
  konto,
  orte,
}) => {
  await konto.anmelden(page);
  await messmaskeOeffnen(page, 'Y-2.3');
  await kachel(page, 'EC').click();
  await ziffern(page, '140');
  const post = postAuf(page, konto.apiUrl, 'messung');
  await speichern(page).click();
  const clientId = clientIdAusBody(await post);
  await expect(gespeichert(page)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Zu Heute' }).or(page.getByRole('link', { name: 'Zu Heute' })),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Rückgängig machen', exact: true }).click();
  await expect
    .poll(async () => (await orte.messung(clientId))?.storno_grund, { timeout: 15_000 })
    .toBe('rueckgaengig');
  const zeile = da(await orte.messung(clientId), 'Messung');
  expect(zeile.storniert_am).not.toBeNull();
  expect(await orte.messungen(clientId)).toBe(1);
});

test('R5.2 Heute zeigt «Erstkalibrierung» bis zur ersten echten Kalibrierung und danach «Kalibrierung gültig bis …»', async ({
  page,
  konto,
  orte,
}) => {
  await orte.kalibrierungenZuruecksetzen('echt');
  await konto.anmelden(page);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(page.getByText('Erstkalibrierung', { exact: true })).toBeVisible({ timeout: 15_000 });

  await kalibrierenKnopf(page).click();
  await expect(page).toHaveURL(/#\/kalibrieren$/);
  await expect(page.getByRole('heading', { name: 'Messgerät kalibrieren' })).toBeVisible();
  await ziffern(page, '141');
  const post = postAuf(page, konto.apiUrl, 'kalibrierung');
  await speichern(page).click();
  await post;
  await expect(page.getByText(/^Kalibriert · gültig bis \d{1,2}\.\d{1,2}\.$/)).toBeVisible();
  await expect.poll(async () => (await orte.kalibrierungen('echt')).length).toBe(1);

  await page.goto('/#/heute');
  await expect(page.getByText(/^Kalibrierung gültig bis \d{1,2}\.\d{1,2}\.$/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText('Erstkalibrierung', { exact: true })).toHaveCount(0);
});
