// UX8 (Issue #230, Plan 230, Usability-Runde vom 14.11.2026 Punkt 14): Spülen in der Dosierzeile. Die Abhakliste
// Lösungswechsel zeigt 16 Zeilen; «Messbecher spülen» steht als Hinweis an Micro (5) und Grow (7), nicht mehr als
// eigene Zeile 6 und 8. REST nachgebildet (tests/e2e/rest.ts), Daten ansatzTeile() (2.3, Micro 7.0, Grow 10.5,
// Bloom 3.5 ml, je ein Aufzug, keine Leitkulturwahl); feste Uhr am 12.1.2027 (Zürich) ohne Pause über 2 min vor einer
// Zugabe; 360 × 640 aus der Konfiguration.
//
// Zählweise (A4): nur Tipps auf «Zeile N abhaken» der Zeilen 0 bis 13, bis die Kontrollmessung (Zeile 14) aktiv ist;
// die Tipps der Frischwassermessung in Zeile 3 (Messen, Ziffern, Speichern) zählen nicht. Vorher 14, jetzt 12.
import { expect, test, type Page } from '@playwright/test';
import { ansatzTeile, um } from '../fixtures/ansatz.ts';
import type { Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const SPUELHINWEIS = 'danach Messbecher spülen';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  tipper: number;
}

async function oeffnen(page: Page, start: Teile, pfad: string, uhr: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], tipper: 0 };
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
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
  return m;
}

const zeilen = (page: Page) => page.locator('ol.hv-checklist li.hv-check-row');
/** Zeile über ihre Nummer (Lücken 6 und 8), nicht über den Index */
const zeile = (page: Page, nr: number) =>
  zeilen(page).filter({ has: page.locator('.hv-check-nr', { hasText: new RegExp(`^${String(nr)}$`) }) });
const hakenKnopf = (page: Page, nr: number) =>
  page.getByRole('button', { name: `Zeile ${nr} abhaken`, exact: true });

/** ein gezählter Tipp auf den Haken der Zeile nr */
async function haken(page: Page, m: Mitschnitt, nr: number): Promise<void> {
  await expect(hakenKnopf(page, nr)).toBeEnabled({ timeout: 5_000 });
  await hakenKnopf(page, nr).click();
  m.tipper += 1;
  await expect(zeile(page, nr)).toHaveAttribute('data-zustand', 'erledigt');
}

/** Frischwassermessung in Zeile 3 (EC 0.50, 20.0 °C), nicht gezählt */
async function frischwasserMessen(page: Page): Promise<void> {
  await zeile(page, 3).getByRole('link', { name: 'Messen' }).click();
  await expect(page).toHaveURL(/#\/messen\/R-2\.3\?zeile=3$/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  for (const z of '050200') {
    await page.getByRole('button', { name: `Ziffer ${z}`, exact: true }).click();
    await page.waitForTimeout(120);
  }
  await page.getByRole('button', { name: /^Speichern/ }).click();
  const ja = page.getByRole('button', { name: 'Ja, speichern', exact: true });
  await expect(async () => {
    if (await ja.isVisible()) await ja.click();
    await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(zeilen(page).first()).toBeVisible({ timeout: 15_000 });
}

test('UX8-AK3 Tipperzahl Lösung wechseln: Zeilen 0 bis 13 mit 12 Haken (vorher 14), Messung Zeile 3 nicht gezählt; 16 Zeilen, kein «Messbecher spülen» als Zeile, Hinweis an Micro und Grow sichtbar', async ({
  page,
}) => {
  const m = await oeffnen(page, ansatzTeile(), '/#/ansatz/R-2.3', um('18:30'));
  await expect(page.locator('main[data-density="regal"]')).toBeVisible({ timeout: 15_000 });
  await expect(zeilen(page)).toHaveCount(16, { timeout: 15_000 });
  const nummern = (await zeilen(page).locator('.hv-check-nr').allInnerTexts()).map((t) => Number(t.trim()));
  expect(nummern).toEqual([0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  await expect(
    zeilen(page).filter({ has: page.locator('.hv-check-titel', { hasText: 'spülen' }) }),
  ).toHaveCount(0);
  await expect(zeile(page, 5).locator('.hv-check-hinweis')).toHaveText(SPUELHINWEIS);
  await expect(zeile(page, 7).locator('.hv-check-hinweis')).toHaveText(SPUELHINWEIS);
  await expect(zeile(page, 9)).not.toContainText(SPUELHINWEIS);

  // Zeilen 0 bis 2, je eine Minute
  let t = um('18:30');
  const minute = async () => {
    t = new Date(t.getTime() + 60_000);
    await page.clock.setFixedTime(t);
  };
  for (const nr of [0, 1, 2]) {
    await haken(page, m, nr);
    await minute();
  }
  // Zeile 3: Messung (nicht gezählt), dann Haken
  await frischwasserMessen(page);
  await haken(page, m, 3);
  await minute();
  // Zeile 4 schreibt den Kopf; Micro, Grow, Bloom ohne Pause über 2 min (keine Rückfrage), Umrühren
  for (const nr of [4, 5, 7, 9, 10]) {
    await haken(page, m, nr);
    if (nr !== 10) await minute();
  }
  await expect(page.getByText('Zuletzt bestätigt:')).toHaveCount(0);
  // Timer 11: Haken 10 + 15 min
  t = new Date(t.getTime() + 15 * 60_000);
  await page.clock.setFixedTime(t);
  await haken(page, m, 11);
  await minute();
  await haken(page, m, 12);
  // Timer 13: Haken 12 + 15 min
  t = new Date(t.getTime() + 15 * 60_000);
  await page.clock.setFixedTime(t);
  await haken(page, m, 13);

  await expect(zeile(page, 14)).toHaveAttribute('data-zustand', 'aktiv');
  expect(m.tipper, 'Haken der Zeilen 0 bis 13').toBe(12);
  // keine Schritte 6 und 8 gesendet, die Dosierzeilen schon
  const nrs = m.geschrieben.filter(([tab]) => tab === 'ansatz_schritt').map(([, z]) => Number(z['nr']));
  expect(nrs).not.toContain(6);
  expect(nrs).not.toContain(8);
  expect(nrs).toEqual(expect.arrayContaining([5, 7, 9, 13]));
});
