// Anlagen-Übersicht mit Belegung (Issue #216, Plan 216; Entscheid 0025). REST nachgebildet (tests/e2e/rest.ts),
// Regal R aus tests/fixtures/saeen.ts (Lollo Rossa auf 2.3 Loch 1 bis 3), dazu Rucola in A3 und ein reservierter
// Topf 2.1.1; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (Vertrag des Leads, Plan 216):
// - Karte der Anlage (h3 «R · Indoor-Regal») mit Zeile «Töpfe: 3 belegt · 1 reserviert · 80 frei».
// - je Ebene h4 «Ebene 4» … «Ebene 1» und je Gefäss ein Link (Baustein Belegungszeile, `a.hv-belegung`) mit dem
//   zugänglichen Namen «<Kennung>, <Belegung>[, <Sorten>][, <Prüfstatus>]», etwa «2.3, 3 belegt · 3 frei, Lollo Rossa 3».
// - h4 «Anzuchtboxen» mit «A3, Anzucht dunkel · 5 von 25, Rucola 5»; h4 «Messstelle» mit «W, Leitungswasser».
import { expect, test, type Page } from '@playwright/test';
import { leeresRegal, netztopfId, type Teile } from '../fixtures/regal.ts';
import { inDerBox, reservierung, saatTeile, SORTE } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');

function belegtesRegal(): Teile {
  const t = saatTeile(JETZT);
  inDerBox(t, { satzNr: 5, sorteId: SORTE.rucola, saatdatum: '2027-01-05', schwaemme: 5, box: 'A3' });
  const [p] = inDerBox(t, {
    satzNr: 6,
    sorteId: SORTE.ochsenherz,
    saatdatum: '2026-12-20',
    schwaemme: 1,
    box: 'A2',
  });
  reservierung(t, {
    nr: 1,
    pflanzungId: p as string,
    netztopfId: netztopfId('2.1.1'),
    vorgabe: '2027-01-17',
  });
  return t;
}

async function oeffnen(page: Page, teile: Teile, pfad: string): Promise<void> {
  const daten = structuredClone(teile);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, JETZT);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: 'Anlagen', level: 1 })).toBeVisible({ timeout: 15_000 });
}

const zeile = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

test('NV4-AK4 Indoor zeigt je Ebene die Gefässe mit Belegung und Sorten als Wort und die Anzuchtboxen mit Inhalt; Zeilen 68 px, kein waagrechtes Scrollen', async ({
  page,
}) => {
  await oeffnen(page, belegtesRegal(), '/#/anlagen');

  await expect(page.getByRole('heading', { name: 'R · Indoor-Regal', level: 3 })).toBeVisible();
  await expect(page.getByText('Töpfe: 3 belegt · 1 reserviert · 80 frei')).toBeVisible();
  const ebenen = page.getByRole('heading', { level: 4 });
  await expect(ebenen).toHaveText(['Ebene 4', 'Ebene 3', 'Ebene 2', 'Ebene 1', 'Anzuchtboxen', 'Messstelle']);

  await expect(zeile(page, '2.3, 3 belegt · 3 frei, Lollo Rossa 3')).toBeVisible();
  await expect(zeile(page, '2.1, 1 reserviert · 5 frei')).toBeVisible();
  await expect(zeile(page, '2.2, 2 frei')).toBeVisible();
  // Prüfstatus als Wort, nicht nur Farbe
  await expect(zeile(page, '1.2, 4 frei, ruht')).toBeVisible();
  await expect(zeile(page, '3.3, 8 frei, nicht geprüft')).toBeVisible();
  // Boxen mit Inhalt
  await expect(zeile(page, 'A1, Anzucht hell · leer')).toBeVisible();
  await expect(zeile(page, 'A2, Anzucht hell · 1 von 25, Ochsenherz 1')).toBeVisible();
  await expect(zeile(page, 'A3, Anzucht dunkel · 5 von 25, Rucola 5')).toBeVisible();
  await expect(zeile(page, 'W, Leitungswasser')).toBeVisible();
  // sichtbarer Text der Zeile trägt die Belegung als Wort
  await expect(zeile(page, '2.3, 3 belegt · 3 frei, Lollo Rossa 3')).toContainText('3 belegt · 3 frei');
  await expect(zeile(page, '2.3, 3 belegt · 3 frei, Lollo Rossa 3')).toContainText('Lollo Rossa 3');

  const zeilen = page.locator('a.hv-belegung');
  await expect(zeilen).toHaveCount(13 + 4 + 1);
  for (const z of await zeilen.all()) {
    const b = await z.boundingBox();
    expect(b?.height ?? 0).toBeGreaterThanOrEqual(68);
    expect((b?.x ?? 0) + (b?.width ?? 0)).toBeLessThanOrEqual(360);
  }
  await expect(page.getByRole('link', { name: 'Anlage R öffnen', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('NV4-AK5 ein Tipp öffnet das Gefäss, die Box oder bei W die Messmaske', async ({ page }) => {
  await oeffnen(page, belegtesRegal(), '/#/anlagen');
  await zeile(page, '2.3, 3 belegt · 3 frei, Lollo Rossa 3').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.3$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('2.3');

  await page.goBack();
  await zeile(page, 'A3, Anzucht dunkel · 5 von 25, Rucola 5').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-A3$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A3');

  await page.goBack();
  await zeile(page, 'W, Leitungswasser').click();
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
});

test('NV4-AK6 Outdoor ohne Anlage: leerer Zustand mit «Anlage anlegen» und Hinweis auf die Dachterrasse', async ({
  page,
}) => {
  await oeffnen(page, belegtesRegal(), '/#/anlagen?standort=outdoor');
  await expect(page.getByText('Noch keine Outdoor-Anlage')).toBeVisible();
  await expect(page.getByText(/Dachterrasse/)).toBeVisible();
  await expect(page.locator('a.hv-belegung')).toHaveCount(0);
  await page.getByRole('link', { name: 'Anlage anlegen', exact: true }).click();
  await expect(page).toHaveURL(/#\/anlage\/neu$/);
});

test('NV4-AK6 ohne Anlage zeigt Indoor «Noch keine Anlage» mit «Anlage anlegen»', async ({ page }) => {
  await oeffnen(page, { ...leeresRegal(), anlage: [], bereich: [] }, '/#/anlagen');
  await expect(page.getByText('Noch keine Anlage', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anlage anlegen', exact: true })).toBeVisible();
  await expect(page.locator('a.hv-belegung')).toHaveCount(0);
});
