// UX7 (Issue #229, Usability-Runde vom 14.11.2026): Messwert «vorher» übernehmen, Mindestschrift 14 dp in
// Regal-Masken, «Gerechnet für» vollständig, Trefferhöhe 48 dp in Heute. REST nachgebildet (tests/e2e/rest.ts), Daten
// aus den Fixtures der Abläufe; 360 × 640 aus der Konfiguration.
import { expect, test, type Page } from '@playwright/test';
import { ansatzTeile, um } from '../fixtures/ansatz.ts';
import { KEIM_JETZT, KEIM_SATZ, keimTeile } from '../fixtures/keimung.ts';
import { JETZT, messTeile, mitKalibrierung } from '../fixtures/messen.ts';
import { buendelTeile, phasenNachrechnen } from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { pflanzSichtenNachrechnen, sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  tipper: number;
}

async function oeffnen(
  page: Page,
  start: Teile,
  pfad: string,
  jetzt: Date,
  nachrechnen: (t: Teile) => Teile = (t) => t,
): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: nachrechnen(structuredClone(start)), geschrieben: [], tipper: 0 };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        zeileAufnehmen(m.daten, tabelle, z, jetzt);
      }
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
  return m;
}

const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}( |$)`) });

/** tippt Ziffern über den Ziffernblock und zählt die Tipper; Pause wegen des Prellfilters */
async function ziffern(page: Page, m: Mitschnitt, folge: string): Promise<void> {
  for (const z of folge) {
    await page.getByRole('button', { name: `Ziffer ${z}`, exact: true }).click();
    m.tipper += 1;
    await page.waitForTimeout(120);
  }
}

/** sichtbare Texte in main mit einer Schrift unter 14 dp */
function kleineTexte(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .filter((e) => {
        const el = e as HTMLElement;
        if (!el.offsetParent || el.closest('.hv-visually-hidden')) return false;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== ''))
          return false;
        return parseFloat(getComputedStyle(el).fontSize) < 14;
      })
      .map(
        (e) =>
          `${(e as HTMLElement).innerText.trim().slice(0, 30)} (${getComputedStyle(e).fontSize}, .${e.className})`,
      ),
  );
}

test('UX7-AK2 Tipperzahl Messung mit gleicher Temperatur: 2 + 3 Ziffern, «vorher» bei °C, «Speichern» = 7 Tipper', async ({
  page,
}) => {
  const m = await oeffnen(page, mitKalibrierung(messTeile()), '/#/messen/R-2.3', JETZT);
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  const vorher = /vorher (\d+\.\d)/.exec((await kachel(page, '°C').innerText()).replace(/\s+/g, ' '))?.[1];
  expect(vorher, 'Vorwert der Temperatur in der Kachel').toBeTruthy();

  await ziffern(page, m, '62');
  await ziffern(page, m, '125');
  // °C ist nach dem EC aktiv und leer: der Tipp auf die Kachel übernimmt «vorher»
  await kachel(page, '°C').click();
  m.tipper += 1;
  await expect(kachel(page, '°C')).toContainText(String(vorher));
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  // ohne Scrollen auf 360 × 640
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);

  await page.getByRole('button', { name: /^Speichern/ }).click();
  m.tipper += 1;
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  expect(m.tipper).toBe(7);
  const messung = m.geschrieben.find(([t]) => t === 'messung')?.[1];
  expect(Number(messung?.['temperatur'])).toBe(Number(vorher));
  expect(Number(messung?.['ph'])).toBe(6.2);
  expect(Number(messung?.['ec'])).toBe(1.25);
});

test('UX7-AK2 ein schon getipptes Feld überschreibt der Tipp auf die Kachel nicht', async ({ page }) => {
  const m = await oeffnen(page, mitKalibrierung(messTeile()), '/#/messen/R-2.3', JETZT);
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  await ziffern(page, m, '5');
  await kachel(page, 'pH').click();
  await expect(kachel(page, 'pH')).toContainText('5');
  await expect(kachel(page, 'pH')).not.toContainText('5.');
});

test('UX7-AK3 Messen, Gefäss, Keimung und Lösungswechsel: kein Text unter 14 dp, «Gerechnet für» vollständig', async ({
  page,
}) => {
  await oeffnen(page, mitKalibrierung(messTeile()), '/#/messen/R-2.3', JETZT);
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  expect(await kleineTexte(page), 'Messen').toEqual([]);

  await page.goto('/#/gefaess/R-2.3');
  await expect(page.getByRole('heading', { name: /2\.3/, level: 1 })).toBeVisible({ timeout: 15_000 });
  expect(await kleineTexte(page), 'Gefäss').toEqual([]);
});

test('UX7-AK3 Keimung: kein Text unter 14 dp', async ({ page }) => {
  await oeffnen(page, keimTeile(), `/#/keimung/${KEIM_SATZ}`, KEIM_JETZT, (t) =>
    pflanzSichtenNachrechnen(sichtenNachrechnen(t)),
  );
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  expect(await kleineTexte(page), 'Keimung').toEqual([]);
});

test('UX7-AK3 Lösungswechsel: kein Text unter 14 dp, «Gerechnet für» ist nicht abgeschnitten', async ({
  page,
}) => {
  await oeffnen(page, ansatzTeile(), '/#/ansatz/R-2.3', um('18:30'));
  await expect(page.locator('ol.hv-checklist li.hv-check-row').first()).toBeVisible({ timeout: 15_000 });
  expect(await kleineTexte(page), 'Lösungswechsel').toEqual([]);
  const abgeschnitten = await page.evaluate(() =>
    [...document.querySelectorAll('.hv-messen-kultur > span')]
      .filter((s) => s.scrollWidth > s.clientWidth + 1)
      .map((s) => (s as HTMLElement).innerText),
  );
  expect(abgeschnitten).toEqual([]);
});

test('UX7-AK3 UX7-AK4 Heute und Pflanze: Trefferhöhe mindestens 48 dp, kein Text unter 14 dp in der Pflanze', async ({
  page,
}) => {
  const jetzt = new Date('2027-01-23T08:00:00Z');
  await oeffnen(page, buendelTeile(jetzt, { ohneSpaete: true }), '/#/heute', jetzt, phasenNachrechnen);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('main a[href^="#/pflanze/"]').first()).toBeVisible();
  const zuKlein = await page.evaluate(() =>
    [...document.querySelectorAll('main a, main button')]
      .filter((e) => (e as HTMLElement).offsetParent)
      .map((e) => ({
        text: ((e.getAttribute('aria-label') ?? (e as HTMLElement).innerText) || '').trim().slice(0, 30),
        h: Math.round(e.getBoundingClientRect().height),
      }))
      .filter((x) => x.h < 48)
      .map((x) => `${x.text} (${String(x.h)} dp)`),
  );
  expect(zuKlein).toEqual([]);

  await page.locator('main a[href^="#/pflanze/"]').first().click();
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  expect(await kleineTexte(page), 'Pflanze').toEqual([]);
});
