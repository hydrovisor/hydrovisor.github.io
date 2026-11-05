// Etikett-Aufruf #/e/<code> (Plan 22 Testliste; UC14-AK2, R9.2, R9.3, TO1, TO2). REST nachgebildet (Plan 18 A7):
// POST etikett_aufruf und ereignis landen im nachgebildeten Bündel, v_gefaess_status rechnet
// tests/fixtures/sichten.ts nach. Regal R aus tests/fixtures/regal.ts, feste Uhr 2026-12-14T08:00:00Z;
// 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 22 offen ist):
// - #/e/:code ersetzt die Adresse (location.replace) durch das Ziel: #/gefaess/R-2.3, #/saeen?box=R-A1,
//   #/messen/R-W, bei offener Prüfung #/pruefen/R-2.3 (nach dem Schreiben von Schritt 1 ohne ?scan=1).
// - je Aufruf genau eine Zeile etikett_aufruf mit code und ergebnis (gefunden, entfernt, unbekannt).
// - «unbekannt» und «entfernt»: main mit data-density="regal", Text «Etikett nicht bekannt» bzw.
//   «Gefäss 1.2 entfernt am 10.12.», Knopf (Link oder Button) «Zu Heute» bzw. «Zur Anlage»; die Adresse bleibt.
// - Säen: Überschrift h1 «Säen», Text «Anzuchtbox A1 · Lichtkeimer».
// - Prüfen nach Scan: Text «Richtiges Gefäss: 2.3» und «Deckel D2: stimmen Lochbild und Nummern?»; ein Ereignis
//   gefaesspruefung { schritt: 1, ok: true } am Platz 2.3; ein Neuladen schreibt kein zweites.
import { expect, test, type Page } from '@playwright/test';
import { platzId, regalTeile, uid, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: sichtenNachrechnen(structuredClone(start)), geschrieben: [] };
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
      sichtenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  return m;
}

const aufrufe = (m: Mitschnitt) =>
  m.geschrieben
    .filter(([t]) => t === 'etikett_aufruf')
    .map(([, z]) => ({ code: z['code'], ergebnis: z['ergebnis'] }));

const pruefschritte = (m: Mitschnitt, kennung: string) =>
  m.geschrieben
    .filter(
      ([t, z]) => t === 'ereignis' && z['typ'] === 'gefaesspruefung' && z['platz_id'] === platzId(kennung),
    )
    .map(([, z]) => z['daten']);

const knopf = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

/** Regal R, in dem 2.3 am Vortag neu erfasst ist: Prüfung offen ab Schritt 1 */
function mitOffenerPruefung(): Teile {
  const t = regalTeile(JETZT);
  zeileAufnehmen(
    t,
    'ereignis',
    {
      id: uid('49', 1),
      client_id: uid('49', 1),
      typ: 'gefaess_erfasst',
      platz_id: platzId('2.3'),
      gilt_ab: '2026-12-13T09:00:00Z',
    },
    JETZT,
  );
  return sichtenNachrechnen(t);
}

/** Regal R, in dem 1.2 am 10.12. entfernt ist */
function mitEntferntem(): Teile {
  const t = regalTeile(JETZT);
  zeileAufnehmen(
    t,
    'ereignis',
    {
      id: uid('49', 2),
      client_id: uid('49', 2),
      typ: 'entfernt',
      platz_id: platzId('1.2'),
      gilt_ab: '2026-12-10T08:00:00Z',
    },
    JETZT,
  );
  return sichtenNachrechnen(t);
}

async function pruefschritt2(page: Page, m: Mitschnitt): Promise<void> {
  await expect(page).toHaveURL(/#\/pruefen\/R-2\.3$/);
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(page.getByText('Richtiges Gefäss: 2.3')).toBeVisible();
  await expect(page.getByText('Deckel D2: stimmen Lochbild und Nummern?')).toBeVisible();
  await expect.poll(() => pruefschritte(m, '2.3')).toEqual([{ schritt: 1, ok: true }]);
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-2.3', ergebnis: 'gefunden' }]);
}

test('UC14-AK2 #/e/R-2.3 öffnet die Maske Gefäss 2.3 und schreibt etikett_aufruf gefunden', async ({
  page,
}) => {
  const m = await mitDaten(page, regalTeile(JETZT), '/#/e/R-2.3');
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.3$/);
  await expect(page.getByRole('heading', { name: '2.3', level: 1 })).toBeVisible();
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-2.3', ergebnis: 'gefunden' }]);
  const [, zeile = {}] = m.geschrieben.find(([t]) => t === 'etikett_aufruf') ?? [];
  expect(typeof zeile['client_id']).toBe('string');
  expect(Date.parse(String(zeile['aufgerufen_am']))).toBe(JETZT.getTime());
  // StrictMode und Neuzeichnen schreiben keinen zweiten Aufruf (A3)
  await page.waitForTimeout(300);
  expect(aufrufe(m)).toHaveLength(1);
});

test('UC14-AK2 #/e/R-A1 öffnet Säen mit Anzuchtbox A1', async ({ page }) => {
  const m = await mitDaten(page, regalTeile(JETZT), '/#/e/R-A1');
  await expect(page).toHaveURL(/#\/saeen\?box=R-A1$/);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await expect(page.getByText('Anzuchtbox A1 · Lichtkeimer')).toBeVisible();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-A1', ergebnis: 'gefunden' }]);
});

test('UC14-AK2 #/e/R-W öffnet die Messmaske der Messstelle W', async ({ page }) => {
  const m = await mitDaten(page, regalTeile(JETZT), '/#/e/R-W');
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
  await expect(page.getByRole('heading', { name: 'R-W', level: 1 })).toBeVisible();
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-W', ergebnis: 'gefunden' }]);
});

test('UC14-AK2 #/e/R-9.9 zeigt «Etikett nicht bekannt» und schreibt unbekannt', async ({ page }) => {
  const m = await mitDaten(page, regalTeile(JETZT), '/#/e/R-9.9');
  await expect(page.getByText('Etikett nicht bekannt')).toBeVisible();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(page).toHaveURL(/#\/e\/R-9\.9$/);
  const zuHeute = knopf(page, 'Zu Heute');
  await expect(zuHeute).toBeVisible();
  expect((await zuHeute.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-9.9', ergebnis: 'unbekannt' }]);
  await zuHeute.click();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
});

test('UC14-AK2 entferntes Gefäss zeigt «Gefäss 1.2 entfernt am …» und schreibt entfernt', async ({
  page,
}) => {
  const m = await mitDaten(page, mitEntferntem(), '/#/e/R-1.2');
  await expect(page.getByText('Gefäss 1.2 entfernt am 10.12.')).toBeVisible();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect.poll(() => aufrufe(m)).toEqual([{ code: 'R-1.2', ergebnis: 'entfernt' }]);
  await knopf(page, 'Zur Anlage').click();
  await expect(page).toHaveURL(/#\/anlage\?a=R$/);
});

test('UC14-AK2 offene Prüfung von 2.3: #/e/R-2.3 zeigt Prüfschritt 2 als Neuladen', async ({ page }) => {
  // Scan öffnet die App neu (page.goto als erster Aufruf der Seite)
  const m = await mitDaten(page, mitOffenerPruefung(), '/#/e/R-2.3');
  await pruefschritt2(page, m);
  // die Adresse ist ersetzt: ein Neuladen zeigt Schritt 2 ohne neues Ereignis und ohne neuen Aufruf
  await page.reload();
  await expect(page).toHaveURL(/#\/pruefen\/R-2\.3$/);
  await expect(page.getByText('Deckel D2: stimmen Lochbild und Nummern?')).toBeVisible();
  await page.waitForTimeout(300);
  expect(pruefschritte(m, '2.3')).toEqual([{ schritt: 1, ok: true }]);
  expect(aufrufe(m)).toHaveLength(1);
});

test('UC14-AK2 offene Prüfung von 2.3: #/e/R-2.3 zeigt Prüfschritt 2 als Hash-Wechsel', async ({ page }) => {
  const m = await mitDaten(page, mitOffenerPruefung(), '/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = '#/e/R-2.3';
  });
  await pruefschritt2(page, m);
  // die ersetzte Adresse: zurück führt nach Heute, nicht wieder auf den Scan
  await page.goBack();
  await expect(page).toHaveURL(/#\/heute$/);
  await page.waitForTimeout(300);
  expect(aufrufe(m)).toHaveLength(1);
  expect(pruefschritte(m, '2.3')).toHaveLength(1);
});
