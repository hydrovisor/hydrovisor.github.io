// Wechselblock in Heute und Block-Leiste in der Maske Ansatz (Plan 139 Testliste; WB-AK4, WB-AK5; Konzept R5.6, R4.6,
// 8.1 Regel 2; 05_masken.md 3.1, 3.5; 04_architektur 4.3). REST nachgebildet (tests/e2e/rest.ts), feste Uhr mit
// page.clock am 12.1.2027 (Zürich), 360 × 640 aus der Konfiguration. Regal R aus tests/fixtures/wechselblock.ts:
// 2.3 läuft aus dem Bündel bis Zeile 10 (Timer bis 19:02), «Lösung wechseln» fällig in 1.1 und 2.1.
//
// Erwartete Oberfläche (Plan 139 Lösungsweg 5, A9):
// - Heute: <section aria-label="Wechselblock"> mit der Kopfzeile «Nächster Schritt: <Kennung> · Zeile n …» und Knopf
//   «Weiter» (Link oder Button zu #/ansatz/<Code>); danach je Glied eine Zeile: nicht begonnen «1.1 · noch nicht
//   begonnen» mit «Beginnen», laufend die bestehende Zeile «2.3 Wechsel läuft · Zeile 11 · weiter ab 19:02» mit
//   «Fortsetzen» – nur innerhalb des Abschnitts, jede genau einmal.
// - Maske Ansatz: Block-Leiste «Weiter im Block: 2.1 · Zeile 0» (Link oder Button), wenn der nächste Schritt in einem
//   anderen Gefäss liegt.
// - Bis Zeile 3 sendet die App nichts (Plan 29); die Stände liegen in IndexedDB «hydrovisor», Speicher «ablaeufe»,
//   Schlüssel abhakliste:<platzId>.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { platzId, type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { um, wechselblockTeile } from '../fixtures/wechselblock.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile, pfad: string, uhr: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        const zeile = tabelle === 'naehrloesungsansatz' ? { status: 'laufend', ...z } : z;
        zeileAufnehmen(m.daten, tabelle, zeile, uhr);
      }
    },
    () => undefined,
    () => undefined,
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
  return m;
}

const block = (page: Page) => page.locator('section[aria-label="Wechselblock"]');
const knopfIn = (bereich: Locator, name: string | RegExp) =>
  bereich.getByRole('link', { name }).or(bereich.getByRole('button', { name })).first();
/** Zeile des Abschnitts mit ihrem Knopf */
const zeileMitKnopf = (bereich: Locator, text: RegExp, name: string) =>
  knopfIn(bereich.getByText(text).first().locator('xpath=ancestor-or-self::*[.//button or .//a][1]'), name);

const zeilen = (page: Page) => page.locator('ol.hv-checklist li.hv-check-row');
const abhaken = (page: Page, nr: number) =>
  page.getByRole('button', { name: `Zeile ${nr} abhaken`, exact: true });

async function listeGeladen(page: Page): Promise<void> {
  await expect(page.locator('main[data-density="regal"]')).toBeVisible({ timeout: 15_000 });
  await expect(zeilen(page)).toHaveCount(18, { timeout: 15_000 });
}

async function hash(page: Page, ziel: string): Promise<void> {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, ziel);
}

const ZEILE_23 = /2\.3 Wechsel läuft · Zeile 11 · weiter ab 19:02/;
const ansatzSchreiben = (m: Mitschnitt) =>
  m.geschrieben.filter(([t]) => ['naehrloesungsansatz', 'ansatz_schritt'].includes(t));

/** Aus Heute «Weiter» nach 1.1, Zeile 0 abhaken, über die Block-Leiste nach 2.1, Zeile 0 abhaken */
async function zweiSchritte(page: Page): Promise<void> {
  await expect(block(page)).toBeVisible({ timeout: 15_000 });
  await knopfIn(block(page), 'Weiter').click();
  await expect(page).toHaveURL(/#\/ansatz\/R-1\.1$/);
  await listeGeladen(page);
  await abhaken(page, 0).click();
  await expect(zeilen(page).nth(0)).toHaveAttribute('data-zustand', 'erledigt');

  const leiste = knopfIn(page.locator('main'), /Weiter im Block: 2\.1 · Zeile 0/);
  await expect(leiste).toBeVisible();
  await leiste.click();
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.1$/);
  await listeGeladen(page);
  await abhaken(page, 0).click();
  await expect(zeilen(page).nth(0)).toHaveAttribute('data-zustand', 'erledigt');
}

/** Heute nach den zwei Schritten: 1.1 und 2.1 auf Zeile 1, 2.3 unverändert */
async function heuteNachZweiSchritten(page: Page): Promise<void> {
  const b = block(page);
  await expect(b).toBeVisible({ timeout: 15_000 });
  await expect(b).toContainText('Nächster Schritt: 1.1 · Zeile 1 absaugen');
  await expect(b.getByText(/1\.1 Wechsel läuft · Zeile 1(?!\d)/)).toHaveCount(1);
  await expect(b.getByText(/2\.1 Wechsel läuft · Zeile 1(?!\d)/)).toHaveCount(1);
  await expect(b.getByText(ZEILE_23)).toHaveCount(1);
  await expect(page.getByText(/noch nicht begonnen/)).toHaveCount(0);
  await expect(page.getByText(/Wechsel läuft/)).toHaveCount(3);
}

async function ablauf(page: Page, id: string): Promise<unknown> {
  return page.evaluate(
    (schluessel) =>
      new Promise((erfuellen, ablehnen) => {
        const anfrage = indexedDB.open('hydrovisor');
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onsuccess = () => {
          const lesen = anfrage.result.transaction('ablaeufe').objectStore('ablaeufe').get(schluessel);
          lesen.onsuccess = () => {
            anfrage.result.close();
            erfuellen(lesen.result);
          };
          lesen.onerror = () => ablehnen(lesen.error);
        };
      }),
    id,
  );
}

test('WB-AK4 Heute zeigt Wechselblock mit allen Gliedern', async ({ page }) => {
  await mitDaten(page, wechselblockTeile(), '/#/heute', um('18:50'));
  const b = block(page);
  await expect(b).toBeVisible({ timeout: 15_000 });
  await expect(b).toContainText(/Nächster Schritt: 1\.1 · Zeile 0/);
  await expect(knopfIn(b, 'Weiter')).toBeVisible();

  await expect(b.getByText('1.1 · noch nicht begonnen')).toHaveCount(1);
  await expect(b.getByText('2.1 · noch nicht begonnen')).toHaveCount(1);
  await expect(b.getByText(ZEILE_23)).toHaveCount(1);
  // jede Zeile genau einmal auf der ganzen Seite, die laufende nur innerhalb des Abschnitts (A9)
  await expect(page.getByText('1.1 · noch nicht begonnen')).toHaveCount(1);
  await expect(page.getByText('2.1 · noch nicht begonnen')).toHaveCount(1);
  await expect(page.getByText(/2\.3 Wechsel läuft/)).toHaveCount(1);

  await expect(zeileMitKnopf(b, /1\.1 · noch nicht begonnen/, 'Beginnen')).toBeVisible();
  await expect(zeileMitKnopf(b, /2\.1 · noch nicht begonnen/, 'Beginnen')).toBeVisible();
  await expect(zeileMitKnopf(b, ZEILE_23, 'Fortsetzen')).toBeVisible();

  // Reihenfolge nach Code: 1.1, 2.1, 2.3
  const text = (await b.innerText()).replace(/\s+/g, ' ');
  const pos = ['1.1 · noch nicht begonnen', '2.1 · noch nicht begonnen', '2.3 Wechsel läuft'].map((x) =>
    text.indexOf(x),
  );
  expect(pos.every((p) => p >= 0)).toBe(true);
  expect([...pos].sort((x, y) => x - y)).toEqual(pos);

  // «Fortsetzen» führt in die Abhakliste von 2.3
  await zeileMitKnopf(b, ZEILE_23, 'Fortsetzen').click();
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/);
});

test('WB-AK4 abgelaufener Timer wird nächster Schritt', async ({ page }) => {
  await mitDaten(page, wechselblockTeile(), '/#/heute', um('19:03'));
  const b = block(page);
  await expect(b).toBeVisible({ timeout: 15_000 });
  await expect(b).toContainText(/Nächster Schritt: 2\.3 · Zeile 11/);
  await knopfIn(b, 'Weiter').click();
  await expect(page).toHaveURL(/#\/ansatz\/R-2\.3$/);
});

test('WB-AK4 Regal-Masse 360 × 640', async ({ page }) => {
  await mitDaten(page, wechselblockTeile(), '/#/heute', um('18:50'));
  await expect(page.locator('main[data-density="regal"]')).toBeVisible({ timeout: 15_000 });
  const b = block(page);
  await expect(b).toBeVisible({ timeout: 15_000 });
  const { scrollY, hoehe, breite, fenster } = await page.evaluate(() => ({
    scrollY: window.scrollY,
    hoehe: window.innerHeight,
    breite: document.scrollingElement?.scrollWidth ?? document.body.scrollWidth,
    fenster: window.innerWidth,
  }));
  expect(scrollY).toBe(0);
  expect(breite, 'Seitenbreite').toBeLessThanOrEqual(fenster);
  const box = await b.boundingBox();
  expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? Infinity)).toBeLessThanOrEqual(hoehe);
  const knoepfe = b.locator('a, button');
  const zahl = await knoepfe.count();
  expect(zahl, 'Weiter, 2 × Beginnen, Fortsetzen').toBeGreaterThanOrEqual(4);
  for (let i = 0; i < zahl; i += 1) {
    const k = await knoepfe.nth(i).boundingBox();
    expect(k?.height ?? 0, `Knopf ${String(i)}`).toBeGreaterThanOrEqual(67.5);
  }
});

test('WB-AK5 Schritt je Gefäss abhaken und weiter im Block', async ({ page }) => {
  const m = await mitDaten(page, wechselblockTeile(), '/#/heute', um('18:50'));
  await zweiSchritte(page);
  // in 2.1 führt die Leiste zurück zu 1.1, Zeile 1
  await expect(knopfIn(page.locator('main'), /Weiter im Block: 1\.1 · Zeile 1/)).toBeVisible();

  await hash(page, '#/heute');
  await heuteNachZweiSchritten(page);
  // bis Zeile 3 sendet die App nichts
  expect(ansatzSchreiben(m)).toEqual([]);
});

test('WB-AK5 Stand je Gefäss getrennt nach Neuladen', async ({ page }) => {
  const m = await mitDaten(page, wechselblockTeile(), '/#/heute', um('18:50'));
  await zweiSchritte(page);

  for (const kennung of ['1.1', '2.1']) {
    const s = (await ablauf(page, `abhakliste:${platzId(kennung)}`)) as
      { platzId: string; code: string; zeilen: { nr: number; erledigtAm?: string }[] } | undefined;
    expect(s, kennung).toBeDefined();
    expect(s?.platzId).toBe(platzId(kennung));
    expect(s?.code).toBe(`R-${kennung}`);
    expect(s?.zeilen.filter((z) => z.erledigtAm !== undefined).map((z) => z.nr)).toEqual([0]);
  }
  // 2.3 läuft nur aus dem Bündel, ohne lokalen Stand
  expect(await ablauf(page, `abhakliste:${platzId('2.3')}`)).toBeUndefined();

  await hash(page, '#/heute');
  await heuteNachZweiSchritten(page);
  await page.reload();
  await heuteNachZweiSchritten(page);
  expect(ansatzSchreiben(m)).toEqual([]);
});
