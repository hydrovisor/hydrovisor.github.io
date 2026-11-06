// UC12 Phasenwissen in der Pflanzenansicht (Plan 40 Testliste; UC12-AK2, UC12-AK3; Konzept R7.2). REST nachgebildet wie
// tests/e2e/phasen.spec.ts; Teile aus tests/fixtures/phasen.ts mit zwei Wissenskarten für Salat (Anzucht, Wachstum).
// Erwartete Oberfläche (Plan 40 A3): Notice mit Titel «Wissen: <Phase>» und dem Kartentext, Knopf «Schliessen».
import { expect, test, type Page } from '@playwright/test';
import { buendelTeile, phasenNachrechnen, pflanzungVon } from '../fixtures/phasen.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

/** 23.1.2027 09:00 Zürich: Lollo Rossa (61) in 4.4 seit 11.1. in Anzucht, Wechsel nach Wachstum fällig */
const JETZT = new Date('2027-01-23T08:00:00Z');
const ANZUCHT = 'Salat in der Anzucht: wenig Dünger, Stadium 1. echte Blätter. Testkarte, erfunden.';
const WACHSTUM = 'Salat im Wachstum: Grow als Hauptkomponente, Lichtabstand prüfen. Testkarte, erfunden.';

function mitWissen(): Teile {
  const t = buendelTeile(JETZT, { ohneSpaete: true });
  t['wissenseintrag'] = [
    [ANZUCHT, 'anzucht'],
    [WACHSTUM, 'wachstum'],
  ].map(([text, phase], i) => ({
    id: uid('4f', i + 1),
    ebene: 'art',
    art_id: 'lactuca_sativa',
    kulturgruppe_id: null,
    phase,
    typ: 'naehrstoffe',
    text,
    quelle_id: 'test-fixture',
    gueltig_bis: null,
  }));
  return t;
}

async function oeffnen(page: Page): Promise<Teile> {
  const daten = phasenNachrechnen(structuredClone(mitWissen()));
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, JETZT);
      phasenNachrechnen(daten);
    },
    () => undefined,
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(`/#/pflanze/${pflanzungVon(61, 1)}`);
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  return daten;
}

test('UC12-AK2 Karte der aktuellen Phase ist ohne Netz lesbar', async ({ page, context }) => {
  await oeffnen(page);
  const main = page.locator('main');
  await expect(main.getByText('Wissen: Anzucht', { exact: true })).toBeVisible();
  await expect(main.getByText(ANZUCHT, { exact: true })).toBeVisible();

  // App vom Service Worker gesteuert, Bündel im Speicher des Geräts (wie datenpfad-runde2.spec.ts)
  await page.evaluate(async () => void (await navigator.serviceWorker.ready));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(main.getByText(ANZUCHT, { exact: true })).toBeVisible();

  // ohne Netz: jede REST-Anfrage scheitert, auch GET (Runde 1 Befund 1)
  let ohneNetz = false;
  let beantwortet = 0;
  await page.route(`${REST}/**`, async (route) => {
    if (ohneNetz) return route.abort('internetdisconnected');
    return route.fallback();
  });
  // gezählt werden nur Anfragen, die ohne Netz begonnen haben (laufende Ladevorgänge davor zählen nicht)
  const ohneNetzBegonnen = new Set<object>();
  page.on('request', (r) => {
    if (ohneNetz && r.url().startsWith(REST)) ohneNetzBegonnen.add(r);
  });
  page.on('requestfinished', (r) => {
    if (ohneNetzBegonnen.has(r)) beantwortet += 1;
  });
  ohneNetz = true;
  await context.setOffline(true);

  // neu geladen: die Karte kommt aus dem gespeicherten Bündel
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  await expect(main.getByText('Wissen: Anzucht', { exact: true })).toBeVisible();
  await expect(main.getByText(ANZUCHT, { exact: true })).toBeVisible();
  // zu Heute und zurück
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await page.goto(`/#/pflanze/${pflanzungVon(61, 1)}`);
  await expect(main.getByText(ANZUCHT, { exact: true })).toBeVisible();
  expect(beantwortet).toBe(0);
  ohneNetz = false;
  await context.setOffline(false);
});

test('UC12-AK3 nach der Phasenbestätigung erscheint die Karte ohne weitere Berührung und schliesst mit einem Antippen', async ({
  page,
}) => {
  await oeffnen(page);
  const main = page.locator('main');
  await expect(main.getByText(ANZUCHT, { exact: true })).toBeVisible();

  // eine Berührung: Phase wechseln → die Karte der neuen Phase steht ohne weitere Berührung da
  await main.getByRole('button', { name: 'Phase wechseln', exact: true }).click();
  await expect(main.getByText('Wissen: Wachstum', { exact: true })).toBeVisible();
  await expect(main.getByText(WACHSTUM, { exact: true })).toBeVisible();
  await expect(main.getByText(ANZUCHT, { exact: true })).toHaveCount(0);

  // ein Antippen schliesst sie
  await main.getByRole('button', { name: 'Schliessen', exact: true }).click();
  await expect(main.getByText(WACHSTUM, { exact: true })).toHaveCount(0);
  await expect(main.getByText('Wissen: Wachstum', { exact: true })).toHaveCount(0);
});
