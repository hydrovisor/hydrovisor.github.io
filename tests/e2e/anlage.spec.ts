// Anlage, Regalbild und Maske «Gefäss» (Plan 20 Testliste; UC1-AK1, AK2, AK4, AK5). REST nachgebildet (Plan 18 A7),
// Regal R aus tests/fixtures/regal.ts; 360 × 640 aus der Konfiguration.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { regalTeile, vereinen, weitereAnlage, type Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');

async function mitDaten(
  page: Page,
  start: Teile,
  pfad: string,
): Promise<{ geschrieben: [string, Record<string, unknown>][] }> {
  const daten: Teile = structuredClone(start);
  const geschrieben: [string, Record<string, unknown>][] = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        geschrieben.push([tabelle, z]);
        (daten[tabelle] ??= []).push({ storniert_am: null, aktiv: true, ...z });
      }
    },
  );
  // feste Uhr: Lösungsalter und Pflanzdauer sind Kalendertage in Zürich (G2), unabhängig von Laufzeit und Sommerzeit
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  return { geschrieben };
}

/** unterer Rand liegt im Viewport (ohne Scrollen sichtbar) */
async function ohneScrollen(page: Page, ort: Locator): Promise<void> {
  const box = await ort.boundingBox();
  const hoehe = page.viewportSize()?.height ?? 0;
  expect((box?.y ?? Infinity) + (box?.height ?? 0), 'unterer Rand im Viewport').toBeLessThanOrEqual(hoehe);
}

test('UC1-AK1 Übersicht mit 13 Gefässen, 4 Anzuchtboxen und W ohne Scrollen, Kacheln 72 × 80, Kennung 28 sp, Ebene 4 in drei Gruppen', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/anlage');
  const regal = page.getByRole('list', { name: 'Regalbild Indoor-Regal' });
  await expect(regal).toBeVisible();
  await expect(regal.locator('.hv-regal-titel')).toHaveText([
    'Keimung',
    'Jungpflanzen',
    'Halbbox',
    'Ebene 3',
    'Ebene 2',
    'Ebene 1',
  ]);
  await expect(page.getByRole('list', { name: 'Keimung' }).locator('.hv-tile-kennung')).toHaveText([
    'A1',
    'A2',
    'A3',
    'A4',
  ]);
  await expect(page.getByRole('list', { name: 'Jungpflanzen' }).locator('.hv-tile-kennung')).toHaveText([
    '4.2',
    '4.3',
    '4.4',
    '4.5',
  ]);
  await expect(page.getByRole('list', { name: 'Halbbox' }).locator('.hv-tile-kennung')).toHaveText([
    '4.1',
    'W',
  ]);

  const kacheln = regal.locator('.hv-tile');
  await expect(kacheln).toHaveCount(18);
  for (const k of await kacheln.all()) {
    const box = await k.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(72);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(80);
    expect(await k.locator('.hv-tile-kennung').evaluate((e) => getComputedStyle(e).fontSize)).toBe('28px');
    await ohneScrollen(page, k);
  }
  // kein seitliches Scrollen; unter dem Regalbild dürfen Angaben und «Anlage anlegen» folgen
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // Tipp auf 2.3 öffnet die Maske «Gefäss», W die Messmaske
  await page.getByRole('button', { name: /^2\.3/ }).click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.3$/);
  await page.goto('/#/anlage');
  await page.getByRole('button', { name: /^W/ }).click();
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
});

test('UC1-AK2 Maske Gefäss: Kopf, Zustand und Hauptknopf ohne Scrollen; Pflanzdauer, Phase, Zielbereich, Dosis je Komponente', async ({
  page,
}) => {
  await mitDaten(page, regalTeile(JETZT), '/#/gefaess/R-2.3');
  const kopf = page.getByRole('heading', { name: '2.3', level: 1 });
  await expect(kopf).toBeVisible();
  await expect(page.getByText('Anlage R · DWC · 9 l')).toBeVisible();
  const zustand = page.getByRole('region', { name: 'Zustand' });
  await expect(zustand.getByText('Lösung 12/14 Tage')).toBeVisible();
  await expect(zustand.getByText('pH 5.8–6.3 · EC 1.0–1.4 · 18–22 °C')).toBeVisible();
  await expect(zustand.getByText('pH 6.40 · EC 1.45 · 20.5 °C')).toBeVisible();
  await expect(zustand.getByText('Grow 2.33 · Micro 1.56 · Bloom 0.78 ml/L')).toBeVisible();
  await expect(zustand.getByText('3 × Lollo Rossa · Wachstum · seit 30 Tagen')).toBeVisible();
  const haupt = page.getByRole('link', { name: /Messen$/ });
  await expect(haupt).toBeVisible();
  for (const ort of [kopf, zustand, haupt]) await ohneScrollen(page, ort);
  expect((await haupt.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(72);
  // darunter der Verlauf als Zahlenreihe (darf scrollen), ohne Diagramm
  const verlauf = page.getByRole('table');
  await expect(verlauf.getByRole('row')).toHaveCount(5);
  await expect(verlauf.getByText('Ansatz')).toBeVisible();
  await expect(page.locator('canvas, svg.hv-diagramm')).toHaveCount(0);
  await haupt.click();
  await expect(page).toHaveURL(/#\/messen\/R-2\.3$/);
});

test('UC1-AK4 kein Status nur über Farbe in Übersicht und Gefäss', async ({ page }) => {
  await mitDaten(page, regalTeile(JETZT), '/#/anlage');
  const regal = page.getByRole('list', { name: 'Regalbild Indoor-Regal' });
  await expect(regal.getByRole('button', { name: /^3\.3/ }).getByText('nicht geprüft')).toBeVisible();
  await expect(regal.getByRole('button', { name: /^1\.2/ }).getByText('ruht')).toBeVisible();
  for (const badge of await page.locator('.hv-badge').all())
    expect((await badge.innerText()).trim()).not.toBe('');

  await page.goto('/#/gefaess/R-2.3');
  // seit I1a-04 steht daneben der Prüfstatus «in Betrieb, geprüft am …» als zweiter Badge (Plan 21)
  const bewertung = page
    .getByRole('region', { name: 'Zustand' })
    .locator('.hv-badge')
    .filter({ hasText: 'Knapp daneben' });
  await expect(bewertung).toHaveText('Knapp daneben');
  await expect(bewertung.locator('.hv-status-icon')).toHaveCount(1);
  await page.goto('/#/gefaess/R-3.3');
  await expect(page.getByRole('region', { name: 'Zustand' }).getByText('nicht geprüft')).toBeVisible();
});

test('UC1-AK5 zweite echte Anlage T anlegen: R unverändert, Heute gruppiert erst danach; X und Y gruppieren nicht', async ({
  page,
}) => {
  const start = vereinen(regalTeile(JETZT), weitereAnlage('X', 'demo'), weitereAnlage('Y', 'test'));
  const { geschrieben } = await mitDaten(page, start, '/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /^X-2\.3/ })).toBeVisible();
  // eine echte Anlage mit Demo X und Test Y: keine Gruppen
  await expect(page.getByRole('heading', { level: 2, name: /^Anlage / })).toHaveCount(0);

  // seit N1 (Entscheid 0025) über die Leiste unten: «Anlagen», dann die Anlage-Maske von R
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('link', { name: 'Anlagen', exact: true })
    .click();
  await page.getByRole('link', { name: 'Anlage R öffnen', exact: true }).click();
  await page.getByRole('link', { name: 'Anlage anlegen' }).click();
  await expect(page.getByRole('heading', { name: 'Anlage anlegen', level: 1 })).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Zweites Regal');
  await page.getByLabel('Kürzel', { exact: true }).fill('R');
  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page.getByText('Kürzel R ist schon vergeben.')).toBeVisible();
  expect(geschrieben).toHaveLength(0);
  await page.getByLabel('Kürzel', { exact: true }).fill('t');
  // Anzahl Ebenen per Drehrad (#147)
  await page
    .getByRole('listbox', { name: 'Anzahl Ebenen' })
    .getByRole('option', { name: '2', exact: true })
    .click();
  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=T$/);
  await expect(page.getByRole('heading', { name: 'Anlage T', level: 1 })).toBeVisible();

  // geschrieben: eine Anlage T (echt) und zwei Bereiche, nichts an R
  expect(geschrieben.map(([t]) => t)).toEqual(['anlage', 'bereich', 'bereich']);
  const t = geschrieben[0]?.[1] ?? {};
  expect(t).toMatchObject({ kuerzel: 'T', datenart: 'echt', name: 'Zweites Regal' });
  expect(geschrieben.slice(1).every(([, z]) => z['anlage_id'] === t['id'])).toBe(true);
  expect(geschrieben.some(([, z]) => z['anlage_id'] === start['anlage']?.[0]?.['id'])).toBe(false);

  // Kennungen von R unverändert: das Regalbild von R zeigt dieselben 18 Orte
  await page.getByRole('link', { name: 'R', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Regalbild Indoor-Regal' }).locator('.hv-tile')).toHaveCount(
    18,
  );

  // Heute gruppiert jetzt nach Anlage: R zuerst, Demo X und Test Y je in ihrer Gruppe
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { level: 2, name: 'Anlage R · Indoor-Regal' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Anlage X · Anlage X' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Anlage R' }).getByRole('button', { name: /^R-2\.3/ }),
  ).toBeVisible();
});
