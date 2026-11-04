// Einrichtungs-Checkliste in Heute und Thema (Plan 18 Testliste; UC0-AK1, UC0-AK6). REST nachgebildet (A7),
// Datenstände aus tests/fixtures/einrichtung.ts; 360 × 640 aus der Konfiguration.
import { expect, test, type Page } from '@playwright/test';
import { einrichtungsTeile } from '../fixtures/einrichtung.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const HELL = 'rgb(242, 245, 244)'; // --surface im hellen Thema (design-system/tokens.css)
const DUNKEL = 'rgb(17, 25, 28)'; // --surface im dunklen Thema

const TITEL = [
  'Anlage anlegen',
  'Messstift 12 h einweichen',
  'Messgerät kalibrieren mit Gegenprobe',
  'Leitungswasser-EC messen (W)',
  'Vorlagen für Box, Deckel und Platte',
  'Gefässe, Anzuchtboxen und Messstelle W erfassen',
  'Etiketten drucken und anbringen',
  'Gefässe prüfen, Schritte 1 bis 3',
  'Erste Aussaat',
];

const liste = (page: Page) => page.getByRole('list', { name: 'Einrichtung' });
const zustaende = (page: Page) =>
  liste(page)
    .locator('li')
    .evaluateAll((li) => li.map((e) => e.getAttribute('data-zustand')));

async function heuteMit(page: Page, teile: () => Record<string, unknown[]>): Promise<void> {
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(page, teile);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
}

test('UC0-AK1 neun Punkte in fester Reihenfolge, jeder hakt sich selbst ab, danach verschwindet die Liste', async ({
  page,
}) => {
  let stufe = 0;
  await heuteMit(page, () => einrichtungsTeile(stufe));
  await expect(liste(page)).toBeVisible();
  await expect(liste(page).locator('.hv-check-titel')).toHaveText(TITEL);
  await expect(page.getByRole('heading', { name: 'Einrichtung · 0 von 9 erledigt' })).toBeVisible();
  expect(await zustaende(page)).toEqual(['aktiv', ...Array(8).fill('offen')]);
  // Status nie nur über Farbe: jede Zeile hat ein benanntes Symbol
  await expect(liste(page).getByRole('img', { name: 'als Nächstes' })).toHaveCount(1);
  await expect(liste(page).getByRole('img', { name: 'offen' })).toHaveCount(8);

  // Datenstand nach Punkt n: genau die ersten n Punkte erledigt (Punkt 2 hakt die Kalibrierung mit ab)
  for (const n of [1, 3, 4, 5, 6, 7, 8]) {
    stufe = n;
    await page.reload();
    await expect(page.getByRole('heading', { name: `Einrichtung · ${n} von 9 erledigt` })).toBeVisible();
    expect(await zustaende(page)).toEqual([
      ...Array(n).fill('erledigt'),
      'aktiv',
      ...Array(8 - n).fill('offen'),
    ]);
    await expect(liste(page).getByRole('img', { name: 'erledigt' })).toHaveCount(n);
  }

  stufe = 9;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(liste(page)).toHaveCount(0);

  // Abschluss bleibt: ein später erfasstes Gefäss in Prüfung bringt die Liste nicht zurück (A4)
  stufe = 7;
  const geladen = page.waitForResponse((r) => r.url().includes('/rest/v1/einstellung'));
  await page.reload();
  await geladen;
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(liste(page)).toHaveCount(0);
});

test('UC0-AK1 der aktive Punkt öffnet seinen Ablauf: Kalibrieren und Leitungswasser messen', async ({
  page,
}) => {
  let teile = einrichtungsTeile(1);
  await page.clock.install();
  await heuteMit(page, () => teile);
  // Punkt 2 aktiv: Timer starten
  await liste(page).getByRole('button', { name: 'Einweichen starten' }).click();
  await expect(liste(page).getByRole('timer')).toHaveText('12:00:00');
  await page.clock.fastForward('06:00:00');
  await expect(liste(page).getByRole('timer')).toHaveText(/^6:00:0\d$/);
  await page.clock.fastForward('06:00:01');
  await expect(liste(page).getByRole('link', { name: 'Kalibrieren' })).toBeVisible();
  expect((await zustaende(page)).slice(0, 3)).toEqual(['erledigt', 'erledigt', 'aktiv']);
  // der Timer überlebt das Neuladen (absolute Endzeit im Gerätespeicher)
  await page.reload();
  await expect(liste(page).getByRole('link', { name: 'Kalibrieren' })).toBeVisible();
  await liste(page).getByRole('link', { name: 'Kalibrieren' }).click();
  await expect(page).toHaveURL(/#\/kalibrieren$/);

  teile = einrichtungsTeile(3);
  teile['platz'] = einrichtungsTeile(4)['platz'] ?? [];
  await page.goto('/#/heute');
  await page.reload();
  await liste(page).getByRole('link', { name: 'Leitungswasser messen' }).click();
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
});

test('UC0-AK1 Demo-Daten haken nichts ab, Punkte ohne Ablauf zeigen «Ablauf folgt»', async ({ page }) => {
  await heuteMit(page, () => einrichtungsTeile(9, 'demo'));
  await expect(page.getByRole('heading', { name: 'Einrichtung · 1 von 9 erledigt' })).toBeVisible();
  expect(await zustaende(page)).toEqual([
    'aktiv',
    'offen',
    'offen',
    'offen',
    'erledigt',
    'offen',
    'offen',
    'offen',
    'offen',
  ]);
  await expect(liste(page).getByText('Ablauf folgt mit einer der nächsten Versionen')).toBeVisible();
});

test('UC0-AK6 Thema standardmässig Hell, auch bei dunklem Systemmodus', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  // ohne Sitzung: Anmeldung
  await page.goto('/#/heute');
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', HELL);
  // mit Sitzung und Bündel ohne Einstellung: Heute bleibt hell
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(page, () => einrichtungsTeile(0));
  await page.reload();
  await expect(liste(page)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', HELL);
});

test('UC0-AK6 Einstellung «hell» bleibt hell, «dunkel» und «wie System» folgen der Einstellung', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  let thema = 'hell';
  await heuteMit(page, () => ({ ...einrichtungsTeile(0), einstellung: [{ id: 'e1', thema }] }));
  await expect(liste(page)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  thema = 'dunkel';
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', DUNKEL);
  thema = 'system';
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
