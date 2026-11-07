// «Jetzt korrigieren» im Rundgang (Plan 113 Testliste; Rundgang-AK3 Ergänzung; F4 Rundgang Schritt 5; R4.14, R10.5).
// REST nachgebildet (tests/e2e/rest.ts), Sichten mit sichtenNachrechnen() nach jedem Schreiben; Regal R aus
// tests/fixtures/rundgang.ts mit den Testorten 1.1 (DWC, 9 l, Ziel pH 6.0–6.5, EC 1.0–1.4) und 2.1; feste Uhr Di
// 12.1.2027 09:00 Zürich; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 113 offen ist):
// - Halt mit den Knöpfen «Am Ende korrigieren» und «Jetzt korrigieren» (wie bisher).
// - «Jetzt korrigieren» bei pH über Ziel: Messmaske im Modus Korrektur mit der Ergebniszone .hv-ergebniszone, den
//   gemessenen Werten und dem Knopf «pH-Minus gegeben» (exakt), ohne neue Ziffern; danach Countdown role="timer"
//   «15:00» und der Knopf «Rundgang fortsetzen» (Knopf oder Link), der zur Kurzprüfung der Ebene 2 führt.
// - «Jetzt korrigieren» ohne pH-Vorschlag (EC-Abweichung): Maske Gefäss #/gefaess/R-1.1 wie bisher.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { platzId, type Teile } from '../fixtures/regal.ts';
import { JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}( |$)`) });
const kurzpruefung = (page: Page, ebene: number) =>
  page.getByText(`Ebene ${ebene} · Pumpen laufen, Licht an, Lüfter läuft`);
const speichern = (page: Page) => page.getByRole('button', { name: /^Speichern/ });
const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

async function mitDaten(page: Page, start: Teile): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        const zeile = tabelle === 'naehrloesungsansatz' ? { status: 'abgeschlossen', ...z } : z;
        zeileAufnehmen(m.daten, tabelle, zeile, JETZT);
      }
      sichtenNachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      stornoAufnehmen(m.daten, tabelle, clientId, JETZT);
      sichtenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  return m;
}

/** von Heute aus starten; Kurzprüfung Ebene 1 «Alles ok»; wartet auf die Messmaske von 1.1 */
async function bisMessung11(page: Page): Promise<void> {
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await page
    .getByRole('link', { name: /^Rundgang starten \(2 Orte\)/ })
    .or(page.getByRole('button', { name: /^Rundgang starten \(2 Orte\)/ }))
    .click();
  await expect(kurzpruefung(page, 1)).toBeVisible({ timeout: 10_000 });
  await knopf(page, 'Alles ok').click();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('1.1');
}

/** Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
}

async function imViewport(page: Page, locator: Locator, was: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${was}: keine Bounding Box`);
  const fenster = await page.evaluate(() => window.innerHeight);
  expect(box.y, `${was} oben im Viewport`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${was} unten im Viewport`).toBeLessThanOrEqual(fenster);
}

test('Rundgang-AK3 Jetzt korrigieren direkt zu pH-Minus gegeben', async ({ page }) => {
  const m = await mitDaten(page, rundgangTeile({ orte: ['1.1', '2.1'] }));
  await bisMessung11(page);

  // pH 6.9 über dem Ziel 6.0–6.5, EC 1.20, 20.0 °C → Halt
  await ziffern(page, '69');
  await ziffern(page, '120');
  await ziffern(page, '200');
  await speichern(page).click();
  const jetzt = knopf(page, 'Jetzt korrigieren');
  await expect(jetzt).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => zeilenVon(m, 'messung').length).toBe(1);

  // «Jetzt korrigieren»: sofort die Ergebniszone mit den gemessenen Werten und «pH-Minus gegeben», ohne Ziffern
  await jetzt.click();
  const minus = taste(page, 'pH-Minus gegeben');
  await expect(minus).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  await expect(page.locator('main')).toContainText('6.9');
  await expect(page.locator('main')).toContainText('1.1');
  await imViewport(page, minus, 'pH-Minus gegeben');

  await minus.click();
  await expect(page.getByRole('timer').first()).toHaveText('15:00', { timeout: 5_000 });
  await expect.poll(() => zeilenVon(m, 'ansatz_position').length).toBe(1);
  // genau 1 Messung: die des Rundgangs, keine zweite aus der Korrektur
  expect(zeilenVon(m, 'messung')).toHaveLength(1);
  expect(zeilenVon(m, 'messung')[0]).toMatchObject({ platz_id: platzId('1.1'), messart: 'rundgang' });
  expect(Number(zeilenVon(m, 'messung')[0]?.['ph'])).toBe(6.9);
  const korrektur = zeilenVon(m, 'naehrloesungsansatz');
  expect(korrektur).toHaveLength(1);
  expect(korrektur[0]).toMatchObject({ platz_id: platzId('1.1'), typ: 'ph_korrektur' });
  expect(Number(korrektur[0]?.['ph_vorher'])).toBe(6.9);
  expect(zeilenVon(m, 'ansatz_position')[0]).toMatchObject({
    ansatz_id: korrektur[0]?.['id'],
    produkt_id: 'ph_minus',
  });

  // «Rundgang fortsetzen» führt zum nächsten Schritt (Kurzprüfung Ebene 2)
  await knopf(page, 'Rundgang fortsetzen').click();
  await expect(kurzpruefung(page, 2)).toBeVisible({ timeout: 10_000 });
  expect(zeilenVon(m, 'messung')).toHaveLength(1);
});

test('Rundgang-AK3 Jetzt korrigieren ohne pH-Vorschlag öffnet Gefäss', async ({ page }) => {
  const m = await mitDaten(page, rundgangTeile({ orte: ['1.1', '2.1'] }));
  await bisMessung11(page);

  // pH 6.2 im Ziel, EC 1.80 über dem Ziel 1.0–1.4 → Halt ohne pH-Vorschlag
  await ziffern(page, '62');
  await ziffern(page, '180');
  await ziffern(page, '200');
  await speichern(page).click();
  const jetzt = knopf(page, 'Jetzt korrigieren');
  await expect(jetzt).toBeVisible({ timeout: 10_000 });
  await jetzt.click();

  await expect(page).toHaveURL(/#\/gefaess\/R-1\.1$/, { timeout: 10_000 });
  await expect(taste(page, 'pH-Minus gegeben')).toHaveCount(0);
  expect(zeilenVon(m, 'messung')).toHaveLength(1);
  expect(zeilenVon(m, 'naehrloesungsansatz')).toHaveLength(0);
});
