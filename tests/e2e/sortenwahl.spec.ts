// Plan 205 (Entscheid 0023): Säen, Schritt 1 nach Gemüse. Fixture tests/fixtures/saeen.ts: Salat (Lollo Rossa,
// Eichblatt; Kulturformen Babyleaf, Schnitt, Kopf, Vorgabe Kopf), Tomate (Ochsenherz), Chili (Cayenne), Petersilie
// (Mooskrause), Rucola. Ohne Satz in 2.3, damit keine Sorte «Wie letztes Mal» trägt. Feste Uhr 7.1.2027, 360 × 640.
import { expect, test, type Page } from '@playwright/test';
import { saatTeile } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import type { Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';
import { gemueseKachel, sorteOeffnen, sortenZeile, sorteWaehlen } from './sortenwahl-hilfe.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');

async function oeffnen(page: Page): Promise<[string, Record<string, unknown>][]> {
  const daten: Teile = structuredClone(saatTeile(JETZT, { ohneSatzIn23: true }));
  const geschrieben: [string, Record<string, unknown>][] = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        geschrieben.push([tabelle, z]);
        zeileAufnehmen(daten, tabelle, z, JETZT);
      }
    },
    () => undefined,
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/saeen?box=R-A1');
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  return geschrieben;
}

const knopf = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('SW1-AK2 Kacheln je Gemüse, Sorten mit gemeinsamen Angaben und «Alle Gemüse», eine Sorte öffnet direkt das Detail', async ({
  page,
}) => {
  await oeffnen(page);
  const kacheln = page.getByRole('group', { name: 'Gemüse' }).getByRole('button');
  await expect(kacheln).toHaveText([/^Chili/, /^Petersilie/, /^Rucola/, /^Salat/, /^Tomate/]);
  await expect(gemueseKachel(page, 'Salat')).toContainText('2 Sorten');
  for (const k of await kacheln.all())
    expect((await k.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);

  await gemueseKachel(page, 'Salat').click();
  await expect(page.getByRole('heading', { name: 'Salat', level: 2 })).toBeVisible();
  await expect(page.getByText(/^Für alle 2 Sorten: Lichtkeimer · /)).toBeVisible();
  await expect(page.locator('.hv-sortenzeile-titel')).toHaveText(['Eichblatt', 'Lollo Rossa']);
  await knopf(page, 'Alle Gemüse').click();
  await expect(kacheln).toHaveCount(5);

  // Tomate hat eine Sorte: direkt das Detail, zurück zu allen Gemüsen
  await gemueseKachel(page, 'Tomate').click();
  await expect(page.getByRole('heading', { name: 'Ochsenherz', level: 2 })).toBeVisible();
  await knopf(page, 'Zurück zu allen Gemüsen').click();
  await expect(kacheln).toHaveCount(5);
});

test('SW1-AK3 Detail mit Platzhalter, botanischem Namen und Faktenliste, fehlende Werte «noch offen»', async ({
  page,
}) => {
  await oeffnen(page);
  await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
  await expect(page.getByRole('img', { name: 'Noch kein Tütenfoto' })).toBeVisible();
  await expect(page.getByText('Salat · Blattkultur')).toBeVisible();
  const fakten = page.getByRole('definition');
  const begriffe = page.getByRole('term');
  await expect(begriffe).toHaveText([
    'Keimung',
    'Keimtemperatur',
    'Keimdauer',
    'Saatmenge',
    'Umsetzen',
    'Packung',
    'Bezug',
    'Wissen',
  ]);
  // Fachbegriff nie allein: Lichtkeimer mit Erklärung
  await expect(fakten.nth(0)).toHaveText(/^Lichtkeimer.*braucht Licht zum Keimen/);
  await expect(fakten.nth(3)).toContainText('1 Samen je Schwamm');
  await expect(fakten.nth(4)).toHaveText('ab Tag 21 nach der Saat');
  await expect(fakten.nth(5)).toContainText('gekauft 20.11.2026');
  await expect(fakten.nth(5)).toContainText('Bestand 100 Korn');
  // ohne Shop-Link und ohne Vollständigkeit: Text statt leerem Feld
  await expect(fakten.nth(6)).toHaveText('keine Angabe');
  await expect(fakten.nth(7)).toHaveText('nicht bekannt');
  // kein Weiter im Detail, nur «Sorte wählen»
  await expect(knopf(page, 'Weiter')).toHaveCount(0);
  await expect(knopf(page, 'Sorte wählen')).toBeVisible();
});

test('SW1-AK4 Kulturform als Vorgabe, «Kulturform ändern» nur bei mehreren Formen, Wahl ändert die Saatmenge und den Satz', async ({
  page,
}) => {
  const geschrieben = await oeffnen(page);
  await sorteOeffnen(page, 'Tomate', 'Ochsenherz');
  const block = page.locator('.hv-kulturform');
  await expect(block).toContainText('Dauerkultur Frucht');
  await expect(block).toContainText('Vorgabe');
  await expect(knopf(page, 'Kulturform ändern')).toHaveCount(0);
  await knopf(page, 'Zurück zu allen Gemüsen').click();

  await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
  await expect(block.locator('.hv-kulturform-titel')).toHaveText('Kopf Vorgabe');
  await expect(block).toContainText('die ganze Pflanze wächst aus und wird einmal geerntet');
  await knopf(page, 'Kulturform ändern').click();
  const formen = page.getByRole('group', { name: 'Kulturform wählen' }).getByRole('button');
  await expect(formen).toHaveCount(3);
  await expect(page.getByRole('button', { name: /^Kopf · Vorgabe/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^Schnitt/ }).click();
  await expect(block.locator('.hv-kulturform-titel')).toHaveText('Schnitt geändert');
  await expect(page.getByRole('definition').nth(3)).toContainText('3 Samen je Schwamm');
  await expect(page.getByRole('definition').nth(3)).toContainText('für Schnitt');

  await knopf(page, 'Sorte wählen').click();
  await expect(sortenZeile(page, 'Lollo Rossa')).toContainText('gewählt · Schnitt');
  await knopf(page, 'Weiter').click();
  await knopf(page, 'Ziel später').click();
  await expect(page.getByText('Lollo Rossa · Schnitt · Ziel später')).toBeVisible();
  await knopf(page, 'Säen speichern').click();
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  const satz = geschrieben.filter(([t]) => t === 'satz').map(([, z]) => z);
  expect(satz[0]?.['kulturform']).toBe('schnitt');
});

test('SW1-AK5 Leiste «Gewählt» entfernt per Tipp, «Weiter» führt zu Schritt 2', async ({ page }) => {
  await oeffnen(page);
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa');
  // weitere Salate: die Sortenliste bleibt offen (Plan 205 A1)
  await expect(page.getByRole('heading', { name: 'Salat', level: 2 })).toBeVisible();
  await sorteWaehlen(page, 'Salat', 'Eichblatt');
  await sorteWaehlen(page, 'Chili', 'Cayenne');
  // Chili hat eine Sorte: zurück zu den Kacheln, die Kachel zeigt «1 gewählt»
  await expect(gemueseKachel(page, 'Chili')).toContainText('1 gewählt');
  await expect(gemueseKachel(page, 'Salat')).toContainText('2 gewählt');

  const leiste = page.getByRole('group', { name: 'Gewählt' }).getByRole('button');
  await expect(leiste).toHaveCount(3);
  for (const b of await leiste.all()) await expect(b).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('group', { name: 'Gewählt' })
    .getByRole('button', { name: /^Eichblatt/ })
    .click();
  await expect(leiste).toHaveCount(2);
  await expect(gemueseKachel(page, 'Salat')).toContainText('1 gewählt');

  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
});
