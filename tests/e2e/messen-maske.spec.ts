// Messmaske mit Ergebniszone, Bewertung und Rückfrage (Plan 26 Testliste; UC9-AK1; UC9 Ablauf 1 bis 7; R2.5, R10.3;
// Konzept 6.3, 17; 05_masken.md 3.4). REST nachgebildet (tests/e2e/rest.ts, Plan 18 A7), die lokale Datenbank wird
// nicht berührt. Regal R aus tests/fixtures/messen.ts; feste Uhr 12.1.2027 18:00 Zürich; 360 × 640 aus der
// Konfiguration, dazu 360 × 780 (Honor-Viewport).
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - #/messen/R-2.3, main[data-density="regal"]; Kopf mit «Salate · DWC», bei 3.1 «nach einem Pumpintervall messen».
// - Kacheln als Buttons, Name beginnt mit «pH», «EC», «°C» (wie I0-07); Kachel mit Trendzeile «vorher 6.1», Spur
//   `.hv-tile-spur` und Statussymbol `.hv-status-icon`, nie mit dem Statuswort; veraltet: Kachel enthält «veraltet»
//   und keinen Pfeil.
// - Ziffernblock `group` «Ziffernblock» (wie I0-07); die Ergebniszone `.hv-ergebniszone` ersetzt ihn nach dem
//   dritten Wert und enthält je Wert das Statuswort und den Wert («pH 6.2», «EC 1.25») sowie höchstens zwei
//   Hinweiszeilen `.hv-ergebnis-hinweis`.
// - «Speichern» (Button, exakt) unter Ziffernblock bzw. Ergebniszone; die Rückfrage `.hv-rueckfrage` erscheint erst
//   nach «Speichern», mit dem Text «Richtiges Gefäss? Hier wächst: Salate» und den Buttons «Wert ändern» und
//   «Ja, speichern»; solange sie steht, ist «Speichern» ausgeblendet.
// - Banner «Noch nie kalibriert: Werte unsicher» ohne Kalibrierung, «Letzte Messung veraltet, neu messen» nach
//   Nachfüllen; nach dem Speichern «Gespeichert hh:mm …».
// - Gesendete Messung: bewertung_ph, bewertung_ec, bewertung_temp, schnappschuss.zielbereich in Einheiten,
//   schnappschuss.sprung_bestaetigt = true nach «Ja, speichern».
import { expect, test, type Locator, type Page } from '@playwright/test';
import { JETZT, messTeile, mitKalibrierung, mitNachfuellen23 } from '../fixtures/messen.ts';
import { platzId, type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const NIE_KALIBRIERT = 'Noch nie kalibriert: Werte unsicher';
const VERALTET = 'Letzte Messung veraltet, neu messen';
const GEFAESS = 'Richtiges Gefäss? Hier wächst: Salate';
const STATUSWORT = /Im grünen Bereich|Knapp daneben|Ausserhalb/;
const ZIELBEREICH_23 = { ph_min: 6, ph_max: 6.5, ec_min: 1, ec_max: 1.4, temp_min: 18, temp_max: 22 };

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile, code: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        zeileAufnehmen(m.daten, tabelle, z, JETZT);
      }
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(`/#/messen/${code}`);
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  return m;
}

const messungen = (m: Mitschnitt) => m.geschrieben.filter(([t]) => t === 'messung').map(([, z]) => z);

/** Messwert-Kachel (Button, Name beginnt mit der Bezeichnung) */
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}( |$)`) });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const speichern = (page: Page) => taste(page, 'Speichern');
const ziffernblock = (page: Page) => page.getByRole('group', { name: 'Ziffernblock' });
const zone = (page: Page) => page.locator('.hv-ergebniszone');
const rueckfrage = (page: Page) => page.locator('.hv-rueckfrage');

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

/** drei Werte ab dem pH-Feld (Fokus springt nach vollständigem Feld weiter) */
async function dreiWerte(page: Page, ph: string, ec: string, temperatur: string): Promise<void> {
  await ziffern(page, ph);
  await ziffern(page, ec);
  await ziffern(page, temperatur);
}

async function ohneScrollen(page: Page): Promise<void> {
  const { hoehe, fenster } = await page.evaluate(() => ({
    hoehe: document.scrollingElement?.scrollHeight ?? document.body.scrollHeight,
    fenster: window.innerHeight,
  }));
  expect(hoehe, 'Seitenhöhe').toBeLessThanOrEqual(fenster);
}

async function imViewport(page: Page, locator: Locator, was: string): Promise<void> {
  const box = da(await locator.boundingBox(), was);
  const fenster = await page.evaluate(() => window.innerHeight);
  expect(box.y, `${was} oben im Viewport`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${was} unten im Viewport`).toBeLessThanOrEqual(fenster);
}

async function hoeheMindestens(locator: Locator, dp: number): Promise<void> {
  const box = da(await locator.boundingBox(), 'Bounding Box');
  expect(box.height).toBeGreaterThanOrEqual(dp - 0.5);
}

async function ohneTastatur(page: Page): Promise<void> {
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(
    page
      .locator('main')
      .locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable="true"]',
      ),
  ).toHaveCount(0);
  const fokus = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName, editierbar: (el as HTMLElement).isContentEditable } : undefined;
  });
  expect(['INPUT', 'TEXTAREA', 'SELECT']).not.toContain(fokus?.tag);
  expect(fokus?.editierbar ?? false).toBe(false);
}

async function viewport(page: Page, hoehe: number): Promise<void> {
  await page.setViewportSize({ width: 360, height: hoehe });
  await page.reload();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
}

test('UC9-AK1 Messmaske 2.3 ohne Scrollen auf 360 × 640 und 360 × 780: Eingabe mit Banner, Trendzeilen und Spur, Ergebniszone nach dem dritten Wert, Rückfrage; Tasten 68 dp', async ({
  page,
}) => {
  // ohne Kalibrierung: Banner «unsicher» als ungünstigster Fall
  await mitDaten(page, messTeile(), 'R-2.3');
  for (const hoehe of [640, 780]) {
    await viewport(page, hoehe);

    // Eingabe
    await expect(page.locator('main[data-density="regal"]')).toBeVisible();
    await expect(page.getByText('Salate · DWC')).toBeVisible();
    await expect(page.getByText(NIE_KALIBRIERT)).toBeVisible();
    await expect(kachel(page, 'pH')).toContainText('vorher 6.1');
    await expect(kachel(page, 'EC')).toContainText('vorher 1.20');
    await expect(kachel(page, '°C')).toContainText('vorher 21.0');
    await expect(kachel(page, 'pH').locator('.hv-tile-spur')).toHaveCount(1);
    await expect(ziffernblock(page)).toBeVisible();
    await ohneScrollen(page);
    for (const name of ['Ziffer 7', 'Ziffer 0', 'leeren', 'Rücktaste', 'weiter'])
      await hoeheMindestens(taste(page, name), 68);
    await imViewport(page, speichern(page), 'Speichern');

    // Ergebniszone nach dem dritten Wert, mit zwei Hinweisen
    await dreiWerte(page, '68', '160', '245');
    await expect(zone(page)).toBeVisible();
    await expect(ziffernblock(page)).toBeHidden();
    await expect(zone(page)).toContainText('Ausserhalb');
    await expect(zone(page)).toContainText('pH 6.8');
    await expect(zone(page).locator('.hv-ergebnis-hinweis')).toHaveCount(2);
    await expect(kachel(page, 'EC')).toContainText('↗');
    await ohneScrollen(page);
    await imViewport(page, speichern(page), 'Speichern');

    // Rückfrage: EC 1.20 → 1.60 ohne Nachfüllen
    await speichern(page).click();
    await expect(rueckfrage(page)).toBeVisible();
    await expect(rueckfrage(page)).toContainText(GEFAESS);
    await expect(speichern(page)).toBeHidden();
    for (const name of ['Wert ändern', 'Ja, speichern']) {
      await hoeheMindestens(taste(page, name), 68);
      await imViewport(page, taste(page, name), name);
    }
    await ohneScrollen(page);
  }
});

test('UC9-AK1 Kratky 3.1 mit Füllstand, Banner und Ergebniszone ohne Scrollen auf 360 × 640 und 360 × 780', async ({
  page,
}) => {
  await mitDaten(page, messTeile(), 'R-3.1');
  for (const hoehe of [640, 780]) {
    await viewport(page, hoehe);
    await expect(page.getByText(NIE_KALIBRIERT)).toBeVisible();
    await expect(page.getByText('nach einem Pumpintervall messen')).toBeVisible();
    await expect(kachel(page, 'pH')).toContainText('vorher 6.5');
    await ohneScrollen(page);

    // 6.9 nach 6.5 vor 7 Tagen: Eisenhinweis und Anstieg, beide ohne Alarm
    await dreiWerte(page, '69', '105', '195');
    await expect(zone(page)).toBeVisible();
    await expect(ziffernblock(page)).toBeHidden();
    await expect(zone(page).locator('.hv-ergebnis-hinweis')).toHaveCount(2);
    await expect(zone(page)).toContainText('Eisen- und Mangansperre');

    const ueber = taste(page, 'über ⅓');
    const unter = taste(page, 'unter ⅓');
    await expect(ueber).toBeVisible();
    await expect(speichern(page)).toBeDisabled();
    await unter.click();
    await expect(unter).toHaveAttribute('aria-pressed', 'true');
    await expect(speichern(page)).toBeEnabled();
    await imViewport(page, speichern(page), 'Speichern');
    await imViewport(page, unter, 'unter ⅓');
    await ohneScrollen(page);
  }
});

test('UC9-AK1 keine Systemtastatur: kein Eingabefeld und kein editierbares Element in Eingabe, Ergebniszone und Rückfrage', async ({
  page,
}) => {
  await mitDaten(page, mitKalibrierung(messTeile()), 'R-2.3');
  await ohneTastatur(page);
  await ziffern(page, '62');
  await ohneTastatur(page);
  await ziffern(page, '156205');
  await expect(zone(page)).toBeVisible();
  await ohneTastatur(page);
  await speichern(page).click();
  await expect(rueckfrage(page)).toBeVisible();
  await ohneTastatur(page);
});

test('UC9 Ergebniszone ersetzt den Ziffernblock nach dem dritten Wert, Tipp auf die Kachel EC holt ihn zurück', async ({
  page,
}) => {
  await mitDaten(page, mitKalibrierung(messTeile()), 'R-2.3');
  await ziffern(page, '62');
  await ziffern(page, '125');
  await ziffern(page, '20');
  // der dritte Wert ist noch nicht vollständig
  await expect(ziffernblock(page)).toBeVisible();
  await expect(zone(page)).toBeHidden();
  await ziffern(page, '5');
  await expect(zone(page)).toBeVisible();
  await expect(ziffernblock(page)).toBeHidden();
  await expect(speichern(page)).toBeVisible();

  await kachel(page, 'EC').click();
  await expect(ziffernblock(page)).toBeVisible();
  await expect(zone(page)).toBeHidden();
  await expect(kachel(page, 'EC')).toHaveAttribute('aria-pressed', 'true');
  await expect(kachel(page, 'EC')).toContainText('1.25');
  await expect(kachel(page, 'pH')).toContainText('6.2');
  await expect(kachel(page, '°C')).toContainText('20.5');
});

test('UC9 Statuswort nur in der Ergebniszone, in der Kachel nur Symbol und Wert', async ({ page }) => {
  await mitDaten(page, mitKalibrierung(messTeile()), 'R-2.3');
  await dreiWerte(page, '67', '125', '205');
  await expect(zone(page)).toBeVisible();
  await expect(zone(page)).toContainText('Knapp daneben');
  await expect(zone(page)).toContainText('Im grünen Bereich');
  await expect(zone(page)).toContainText('pH 6.7');
  await expect(zone(page)).toContainText('EC 1.25');
  for (const b of ['pH', 'EC', '°C'] as const) {
    await expect(kachel(page, b)).not.toContainText(STATUSWORT);
    await expect(kachel(page, b).locator('.hv-status-icon')).toHaveCount(1);
  }
  await expect(kachel(page, 'pH')).toContainText('6.7');
});

test('R10.3 Rückfrage bei EC-Sprung: «Wert ändern» behält die Eingabe; «Ja, speichern» sendet eine Messung mit bewertung_* und schnappschuss.zielbereich', async ({
  page,
}) => {
  const m = await mitDaten(page, mitKalibrierung(messTeile()), 'R-2.3');
  await dreiWerte(page, '62', '156', '205');
  await expect(zone(page)).toBeVisible();
  // die Rückfrage kommt erst beim Speichern
  await expect(rueckfrage(page)).toBeHidden();
  await speichern(page).click();
  await expect(rueckfrage(page)).toContainText(GEFAESS);
  await expect(speichern(page)).toBeHidden();

  // «Wert ändern»: Ziffernblock mit dem Feld des Sprungs, Eingaben bleiben, nichts gesendet
  await taste(page, 'Wert ändern').click();
  await expect(rueckfrage(page)).toBeHidden();
  await expect(ziffernblock(page)).toBeVisible();
  await expect(kachel(page, 'EC')).toHaveAttribute('aria-pressed', 'true');
  await expect(kachel(page, 'EC')).toContainText('1.56');
  await expect(kachel(page, 'pH')).toContainText('6.2');
  await expect(kachel(page, '°C')).toContainText('20.5');
  expect(messungen(m)).toHaveLength(0);

  // Wert bestätigen
  await speichern(page).click();
  await expect(rueckfrage(page)).toBeVisible();
  // Sperre 400 ms am Ja-Knopf (U13)
  await page.waitForTimeout(450);
  await taste(page, 'Ja, speichern').click();
  await expect(page.getByText(/^Gespeichert \d{2}:\d{2}/)).toBeVisible();
  await expect.poll(() => messungen(m).length).toBe(1);
  const zeile = da(messungen(m)[0], 'Messung');
  expect(zeile).toMatchObject({
    platz_id: platzId('2.3'),
    ph: 6.2,
    ec: 1.56,
    temperatur: 20.5,
    bewertung_ph: 'gruen',
    bewertung_ec: 'ausserhalb',
    bewertung_temp: 'gruen',
  });
  expect(zeile['schnappschuss']).toMatchObject({
    betriebsart: 'dwc',
    sprung_bestaetigt: true,
    zielbereich: ZIELBEREICH_23,
  });
});

test('R10.3 nach Nachfüllen Banner «Letzte Messung veraltet, neu messen» und Kennzeichen in der Trendzeile', async ({
  page,
}) => {
  await mitDaten(page, mitNachfuellen23(mitKalibrierung(messTeile())), 'R-2.3');
  await expect(page.getByText(VERALTET)).toBeVisible();
  await expect(page.getByText(NIE_KALIBRIERT)).toHaveCount(0);
  await expect(kachel(page, 'EC')).toContainText('veraltet');
  await expect(kachel(page, 'pH')).toContainText('veraltet');
  // EC 1.20 → 1.40 zeigte sonst «↗»; veraltet ohne Pfeil
  await kachel(page, 'EC').click();
  await ziffern(page, '140');
  await expect(kachel(page, 'EC')).toContainText('1.40');
  await expect(kachel(page, 'EC')).not.toContainText(/[↗↘]/);
  await expect(kachel(page, 'EC')).toContainText('veraltet');
});

test('R2.5 Speichern ohne Sprung in einem Tipp aus der Ergebniszone', async ({ page }) => {
  const m = await mitDaten(page, mitKalibrierung(messTeile()), 'R-2.3');
  await expect(page.getByText('Salate · DWC')).toBeVisible();
  await dreiWerte(page, '62', '125', '205');
  await expect(zone(page)).toBeVisible();
  await expect(zone(page)).toContainText('Im grünen Bereich');
  await expect(zone(page)).toContainText('pH 6.2');
  await expect(zone(page)).toContainText('EC 1.25');
  await expect(zone(page).locator('.hv-ergebnis-hinweis')).toHaveCount(0);

  await speichern(page).click();
  await expect(page.getByText(/^Gespeichert \d{2}:\d{2}/)).toBeVisible();
  await expect(rueckfrage(page)).toHaveCount(0);
  await expect.poll(() => messungen(m).length).toBe(1);
  const zeile = da(messungen(m)[0], 'Messung');
  expect(zeile).toMatchObject({
    platz_id: platzId('2.3'),
    ph: 6.2,
    ec: 1.25,
    temperatur: 20.5,
    bewertung_ph: 'gruen',
    bewertung_ec: 'gruen',
    bewertung_temp: 'gruen',
  });
  expect(zeile['schnappschuss']).toEqual({
    betriebsart: 'dwc',
    u_ec: 0.1,
    u_ph: 0.1,
    zielbereich: ZIELBEREICH_23,
  });
});
