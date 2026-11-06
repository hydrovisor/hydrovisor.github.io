// Abhakliste Lösungswechsel in 2.3 (Plan 29 Testliste abhakliste.spec; Loesungswechsel-AK3, AK5; Konzept R4.6, 6.2,
// 11.4; 05_masken.md 3.5). REST nachgebildet (tests/e2e/rest.ts, Plan 18 A7), die lokale Datenbank wird nicht
// berührt; die Nachbildung hat keine Trigger, deshalb prüft der Test die gesendeten Zeilen, die Zustandsfelder prüft
// supabase/tests/database/16_ansatz_zustand.test.sql. Feste Uhr mit page.clock am 12.1.2027 (Zürich), Regal R aus
// tests/fixtures/ansatz.ts (Teil-Dosis 100 %: Micro 7.0 ml, Grow 10.5 ml, Bloom 3.5 ml); 360 × 640 aus der
// Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 29 offen ist):
// - #/ansatz/R-2.3: main[data-density="regal"] mit der Abhakliste ol.hv-checklist aus dem Baustein Checklist, 18
//   Zeilen li.hv-check-row in der Reihenfolge 0 bis 17 mit data-zustand offen | aktiv | erledigt; der Haken der
//   aktiven Zeile heisst «Zeile n abhaken», eine abwählbare erledigte Zeile «Zeile n abwählen».
// - Timer-Zeile mit role="timer" und Restzeit «14:00»; der Haken ist bis zum Ende gesperrt (disabled).
// - Rückfrage nach mehr als 2 min Pause als Card über der Liste mit dem Text «Zuletzt bestätigt: Micro 7.0 ml um
//   18:42. Grow schon im Wasser?» und den Knöpfen «Nein, jetzt geben» und «Ja, war schon drin».
// - Heute (#/heute): je offenem Wechsel eine Zeile «2.3 Wechsel läuft · Zeile n …» mit «Fortsetzen».
// - #/e/R-2.3 führt bei offenem Wechsel an 2.3 zu #/ansatz/R-2.3 (Erstaufruf und Hash-Wechsel).
// - Bis Zeile 3 wird nichts gesendet; jeder Haken nach dem Kopf sendet ansatz_schritt mit nr, erledigt_am, ist_ml.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ansatzTeile, laufenderWechsel, LAUFEND, um } from '../fixtures/ansatz.ts';
import { type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const RUECKFRAGE = 'Zuletzt bestätigt: Micro 7.0 ml um 18:42. Grow schon im Wasser?';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  geaendert: [string, string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile, pfad: string, uhr: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], geaendert: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        // Default der Spalte status wie in der Datenbank
        const zeile = tabelle === 'naehrloesungsansatz' ? { status: 'laufend', ...z } : z;
        zeileAufnehmen(m.daten, tabelle, zeile, uhr);
      }
    },
    (tabelle, clientId, felder) => m.geaendert.push([tabelle, clientId, felder]),
    (tabelle, id, felder) => m.geaendert.push([tabelle, id, felder]),
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
  return m;
}

const liste = (page: Page) => page.locator('ol.hv-checklist');
const zeilen = (page: Page) => liste(page).locator('li.hv-check-row');
const zeile = (page: Page, nr: number) => zeilen(page).nth(nr);
const abhaken = (page: Page, nr: number) =>
  page.getByRole('button', { name: `Zeile ${nr} abhaken`, exact: true });
const knopf = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function listeGeladen(page: Page): Promise<void> {
  await expect(page.locator('main[data-density="regal"]')).toBeVisible({ timeout: 15_000 });
  await expect(zeilen(page)).toHaveCount(18, { timeout: 15_000 });
}

async function zustaende(page: Page, erledigtBis: number, aktiv: number): Promise<void> {
  for (let nr = 0; nr <= erledigtBis; nr += 1)
    await expect(zeile(page, nr), `Zeile ${nr}`).toHaveAttribute('data-zustand', 'erledigt');
  await expect(zeile(page, aktiv), `Zeile ${aktiv}`).toHaveAttribute('data-zustand', 'aktiv');
}

const schritte = (m: Mitschnitt) => m.geschrieben.filter(([t]) => t === 'ansatz_schritt').map(([, z]) => z);
const schrittNr = (m: Mitschnitt, nr: number) => schritte(m).filter((z) => Number(z['nr']) === nr);

async function hash(page: Page, ziel: string): Promise<void> {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, ziel);
}

/** Eintrag in Heute mit seinem Knopf (Knopf oder Link) */
function heuteKnopf(page: Page, text: RegExp | string, name: string): Locator {
  const eintrag = page.getByText(text).first().locator('xpath=ancestor-or-self::*[.//button or .//a][1]');
  return eintrag.getByRole('button', { name }).or(eintrag.getByRole('link', { name })).first();
}

test('Loesungswechsel-AK3 abgebrochener Wechsel erscheint in Heute und setzt beim nächsten offenen Haken fort (Neuladen, Hash-Wechsel und #/e/R-2.3)', async ({
  page,
}) => {
  const m = await mitDaten(page, ansatzTeile(), '/#/ansatz/R-2.3', um('18:30'));
  await listeGeladen(page);
  await expect(zeile(page, 0)).toHaveAttribute('data-zustand', 'aktiv');
  for (const [nr, uhr] of [
    [0, '18:30'],
    [1, '18:31'],
    [2, '18:33'],
  ] as const) {
    await page.clock.setFixedTime(um(uhr));
    await abhaken(page, nr).click();
    await expect(zeile(page, nr)).toHaveAttribute('data-zustand', 'erledigt');
  }
  await zustaende(page, 2, 3);
  // vor dem Kopf (Zeile 4) nur lokal
  expect(m.geschrieben.filter(([t]) => ['naehrloesungsansatz', 'ansatz_schritt'].includes(t))).toEqual([]);

  // Unterbrechung: Neuladen
  await page.clock.setFixedTime(um('18:50'));
  await page.reload();
  await listeGeladen(page);
  await zustaende(page, 2, 3);

  // Hash-Wechsel zu Heute: der Wechsel steht oben mit «Fortsetzen»
  await hash(page, '#/heute');
  await expect(page.getByText(/2\.3 Wechsel läuft · Zeile 3/)).toBeVisible({ timeout: 15_000 });
  await heuteKnopf(page, /2\.3 Wechsel läuft · Zeile 3/, 'Fortsetzen').click();
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/);
  await listeGeladen(page);
  await zustaende(page, 2, 3);

  // Scan des Etiketts: als Hash-Wechsel und als Erstaufruf
  await hash(page, '#/e/R-2.3');
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/, { timeout: 15_000 });
  await listeGeladen(page);
  await zustaende(page, 2, 3);
  await page.goto('/#/e/R-2.3');
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/, { timeout: 15_000 });
  await listeGeladen(page);
  await zustaende(page, 2, 3);
});

test('Loesungswechsel-AK3 Timer läuft nach Neuladen gegen die absolute Endzeit weiter', async ({ page }) => {
  // Zeile 10 um 18:47 (anderes Gerät), timer_ende 19:02
  const m = await mitDaten(page, laufenderWechsel(ansatzTeile(), 10), '/#/ansatz/R-2.3', um('18:48'));
  await listeGeladen(page);
  await zustaende(page, 10, 11);
  await expect(zeile(page, 11).getByRole('timer')).toHaveText('14:00');
  await expect(abhaken(page, 11)).toBeDisabled();

  await page.clock.setFixedTime(um('18:57'));
  await page.reload();
  await listeGeladen(page);
  await expect(zeile(page, 11).getByRole('timer')).toHaveText('5:00');
  await expect(abhaken(page, 11)).toBeDisabled();

  await page.clock.setFixedTime(um('19:02'));
  await expect(abhaken(page, 11)).toBeEnabled({ timeout: 5_000 });
  await abhaken(page, 11).click();
  await expect(zeile(page, 11)).toHaveAttribute('data-zustand', 'erledigt');
  await expect.poll(() => schrittNr(m, 11).length).toBe(1);
  const [elf] = schrittNr(m, 11);
  expect(elf).toMatchObject({ ansatz_id: LAUFEND, nr: 11, schritt: 'timer' });
  expect(Date.parse(String(elf?.['erledigt_am']))).toBe(um('19:02').getTime());
});

test('Loesungswechsel-AK3 anderes Gerät setzt aus Bündel und Schritten fort', async ({ page }) => {
  // Kopf und Zeilen 0 bis 4 aus einem anderen Gerät, lokal kein Stand
  await mitDaten(page, laufenderWechsel(ansatzTeile(), 4), '/#/heute', um('18:40'));
  await expect(page.getByText(/2\.3 Wechsel läuft · Zeile 5/)).toBeVisible({ timeout: 15_000 });
  await heuteKnopf(page, /2\.3 Wechsel läuft · Zeile 5/, 'Fortsetzen').click();
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/);
  await listeGeladen(page);
  await zustaende(page, 4, 5);
  await expect(zeile(page, 5)).toContainText('7.0 ml');
  await expect(abhaken(page, 5)).toBeEnabled();
  await page.goto('/#/e/R-2.3');
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/, { timeout: 15_000 });
  await listeGeladen(page);
  await zustaende(page, 4, 5);
});

test('Loesungswechsel-AK5 nach mehr als 2 Minuten Pause fragt die App mit Zeitstempel: Zuletzt bestätigt: Micro 7.0 ml um 18:42. Grow schon im Wasser? («Ja, war schon drin» hakt Grow ab)', async ({
  page,
}) => {
  const m = await mitDaten(page, laufenderWechsel(ansatzTeile(), 4), '/#/ansatz/R-2.3', um('18:42'));
  await listeGeladen(page);
  await zustaende(page, 4, 5);
  await abhaken(page, 5).click();
  await expect(zeile(page, 5)).toHaveAttribute('data-zustand', 'erledigt');
  await expect.poll(() => schrittNr(m, 5).length).toBe(1);
  const [fuenf] = schrittNr(m, 5);
  expect(fuenf).toMatchObject({ ansatz_id: LAUFEND, nr: 5, schritt: 'micro' });
  expect(Number(fuenf?.['ist_ml'])).toBe(7);
  expect(Date.parse(String(fuenf?.['erledigt_am']))).toBe(um('18:42').getTime());

  // genau 2:00 Pause: keine Rückfrage
  await page.clock.setFixedTime(um('18:44'));
  await page.reload();
  await listeGeladen(page);
  await zustaende(page, 5, 6);
  await expect(page.getByText('Zuletzt bestätigt:')).toHaveCount(0);

  // 2:01 Pause: Rückfrage beim Fortsetzen
  await page.clock.setFixedTime(um('18:44', 1));
  await page.reload();
  await listeGeladen(page);
  await expect(page.getByText(RUECKFRAGE)).toBeVisible();
  await expect(knopf(page, 'Nein, jetzt geben')).toBeVisible();
  await expect(knopf(page, 'Ja, war schon drin')).toBeVisible();

  await knopf(page, 'Ja, war schon drin').click();
  await expect(page.getByText(RUECKFRAGE)).toHaveCount(0);
  await zustaende(page, 7, 8);
  await expect.poll(() => schrittNr(m, 7).length).toBe(1);
  expect(schrittNr(m, 6)).toHaveLength(1);
  expect(Number(schrittNr(m, 7)[0]?.['ist_ml'])).toBe(10.5);
});

test('Loesungswechsel-AK5 Rückfrage vor dem nächsten Tipp; «Nein, jetzt geben» lässt Grow offen', async ({
  page,
}) => {
  const m = await mitDaten(page, laufenderWechsel(ansatzTeile(), 4), '/#/ansatz/R-2.3', um('18:42'));
  await listeGeladen(page);
  await abhaken(page, 5).click();
  await expect(zeile(page, 5)).toHaveAttribute('data-zustand', 'erledigt');

  await page.clock.setFixedTime(um('18:44', 1));
  await abhaken(page, 6).click();
  await expect(page.getByText(RUECKFRAGE)).toBeVisible();
  await expect(zeile(page, 6)).not.toHaveAttribute('data-zustand', 'erledigt');
  expect(schrittNr(m, 6)).toEqual([]);

  await knopf(page, 'Nein, jetzt geben').click();
  await expect(page.getByText(RUECKFRAGE)).toHaveCount(0);
  await zustaende(page, 5, 6);
  expect(schrittNr(m, 6)).toEqual([]);
  expect(schrittNr(m, 7)).toEqual([]);
  await abhaken(page, 6).click();
  await expect(zeile(page, 6)).toHaveAttribute('data-zustand', 'erledigt');
  await expect(zeile(page, 7)).toHaveAttribute('data-zustand', 'aktiv');
});

test('Loesungswechsel-AK3 05-3.5 Abhakliste auf 360 × 640: data-density regal, Haken 68 dp, kein waagrechtes Scrollen, keine Systemtastatur', async ({
  page,
}) => {
  await mitDaten(page, laufenderWechsel(ansatzTeile(), 4), '/#/ansatz/R-2.3', um('18:42'));
  await listeGeladen(page);
  const box = await abhaken(page, 5).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(67.5);
  const { breite, fenster } = await page.evaluate(() => ({
    breite: document.scrollingElement?.scrollWidth ?? document.body.scrollWidth,
    fenster: window.innerWidth,
  }));
  expect(breite, 'Seitenbreite').toBeLessThanOrEqual(fenster);
  await expect(
    page
      .locator('main')
      .locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable="true"]',
      ),
  ).toHaveCount(0);
  // die aktive Zeile ist im Blick (A14)
  const aktiv = await zeile(page, 5).boundingBox();
  const hoehe = await page.evaluate(() => window.innerHeight);
  expect(aktiv?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((aktiv?.y ?? 0) + (aktiv?.height ?? 0)).toBeLessThanOrEqual(hoehe);
});
