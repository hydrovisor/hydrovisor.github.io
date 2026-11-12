// Usability Runde 4 (Issue #168; docs/entwurf/usability_befunde.md B16, B17): Messstelle W öffnet nach dem Speichern
// die Messmaske, Gefässe lassen sich ohne Umweg über die Anlage in Folge erfassen. REST nachgebildet wie
// gefaess.spec.ts; Regal R ohne Plätze aus tests/fixtures/regal.ts; 360 × 640 aus der Konfiguration.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { leeresRegal, platzId, uid, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

async function mitDaten(page: Page, start: Teile): Promise<[string, Record<string, unknown>][]> {
  const daten = sichtenNachrechnen(structuredClone(start));
  const geschrieben: [string, Record<string, unknown>][] = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        geschrieben.push([tabelle, z]);
        zeileAufnehmen(daten, tabelle, z, new Date());
      }
      sichtenNachrechnen(daten);
    },
  );
  await page.goto('/#/gefaess-neu?a=R');
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  return geschrieben;
}

const knopf = (ort: Page | Locator, name: string) =>
  ort
    .getByRole('link', { name, exact: true })
    .or(ort.getByRole('button', { name, exact: true }))
    .first();
const gruppe = (page: Page, name: string) => page.getByRole('group', { name, exact: true });

/** Gefäss auf Ebene 2 an der Position mit Rako und D2 bis zur Zusammenfassung */
async function gefaessBisZusammenfassung(page: Page, position: string): Promise<void> {
  await gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe(page, 'Position').getByRole('radio', { name: position, exact: true }).check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Box')
    .getByRole('radio', { name: /^Rako 40 × 30 × 22/ })
    .check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 4 von 4')).toBeVisible();
}

test('U05-AK1 Speichern der Messstelle W öffnet die Messmaske R-W', async ({ page }) => {
  const geschrieben = await mitDaten(page, leeresRegal());
  await gruppe(page, 'Rolle').getByRole('radio', { name: 'Messstelle W' }).check();
  await knopf(page, 'Weiter').click();
  // nur eine Messstelle je Anlage: kein «nächstes erfassen»
  await expect(knopf(page, 'Speichern und nächstes erfassen')).toHaveCount(0);
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
  await expect(page.getByRole('button', { name: /^EC/ })).toBeVisible({ timeout: 15_000 });
  expect(geschrieben.filter(([t, z]) => t === 'platz' && z['rolle'] === 'messstelle')).toHaveLength(1);
});

/** verzögert das Nachladen der Plätze nach dem Speichern (wie ein langsames Netz am Regal) */
async function nachladenVerzoegern(page: Page, ms: number, tabelle = 'platz'): Promise<void> {
  await page.route(`**/rest/v1/${tabelle}*`, async (route) => {
    if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, ms));
    await route.fallback();
  });
}

test('U05-AK2 «Speichern und nächstes erfassen» speichert 2.3, meldet es und schlägt auf derselben Ebene die nächste freie Position vor', async ({
  page,
}) => {
  const geschrieben = await mitDaten(page, leeresRegal());
  await gruppe(page, 'Luftpumpe').getByRole('radio', { name: 'P2', exact: true }).check();
  await gefaessBisZusammenfassung(page, '3');
  await knopf(page, 'Speichern und nächstes erfassen').click();

  await expect(page.getByRole('status').filter({ hasText: 'R-2.3 gespeichert' })).toBeVisible();
  await expect(page.getByText('Schritt 1 von 4')).toBeVisible();
  await expect(page).toHaveURL(/#\/gefaess-neu\?a=R$/);
  // Rolle, Bereich und Luftpumpe bleiben; die Position schlägt die App neu vor (2.3 ist belegt)
  await expect(gruppe(page, 'Rolle').getByRole('radio', { name: 'Gefäss' })).toBeChecked();
  await expect(gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true })).toBeChecked();
  await expect(gruppe(page, 'Luftpumpe').getByRole('radio', { name: 'P2', exact: true })).toBeChecked();
  await expect(gruppe(page, 'Position').getByRole('radio', { name: '1', exact: true })).toBeChecked();
  const gefaesse = () => geschrieben.filter(([t]) => t === 'gefaess');
  expect(gefaesse()).toHaveLength(1);

  // das nächste Gefäss aus dem Vorschlag: eigene Kennung, eigener Vorgang
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Box')
    .getByRole('radio', { name: /^Rako 40 × 30 × 22/ })
    .check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('R-2.1', { exact: true })).toBeVisible();
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.1$/);
  expect(gefaesse()).toHaveLength(2);
  const kennungen = geschrieben
    .filter(([t, z]) => t === 'platz' && z['rolle'] === 'gefaess')
    .map(([, z]) => z['kennung']);
  expect(kennungen).toEqual(['2.3', '2.1']);
  // die Luftpumpe P2 gilt auch für das zweite Gefäss
  expect(gefaesse().map(([, z]) => z['luftpumpe'])).toEqual(['P2', 'P2']);
});

test('U05-AK2 Anzuchtbox A1, dann A2: bis der neue Stand geladen ist, sperrt der Assistent «Weiter», keine Kennung doppelt', async ({
  page,
}) => {
  const geschrieben = await mitDaten(page, leeresRegal());
  await nachladenVerzoegern(page, 1500);
  await gruppe(page, 'Rolle').getByRole('radio', { name: 'Anzuchtbox' }).check();
  await expect(page.getByText('Kennung A1')).toBeVisible();
  await knopf(page, 'Weiter').click();
  await knopf(page, 'Speichern und nächstes erfassen').click();

  // während des Nachladens: Meldung mit «Stand wird geladen», «Weiter» gesperrt
  await expect(
    page.getByRole('status').filter({ hasText: 'R-A1 gespeichert, Stand wird geladen' }),
  ).toBeVisible();
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  // danach: A2 vorgeschlagen, «Weiter» frei
  await expect(page.getByText('Kennung A2')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('status').filter({ hasText: /^R-A1 gespeichert$/ })).toBeVisible();
  await knopf(page, 'Weiter').click();
  await knopf(page, 'Speichern und nächstes erfassen').click();
  await expect(page.getByRole('status').filter({ hasText: 'R-A2 gespeichert' })).toBeVisible();
  await expect(page.getByText('Kennung A3')).toBeVisible({ timeout: 10_000 });

  await expect(page.getByRole('alert')).toHaveCount(0);
  const boxen = geschrieben
    .filter(([t, z]) => t === 'platz' && z['rolle'] === 'anzuchtort')
    .map(([, z]) => z['kennung']);
  expect(boxen).toEqual(['A1', 'A2']);
});

test('W168-AK1 Gefäss auf dem geräumten Platz 2.3: «Weiter» wartet auf das neue Gefäss im Bündel, danach Position 1', async ({
  page,
}) => {
  // Platz 2.3 besteht schon ohne Gefäss (früher entfernt); das Erfassen legt nur ein Gefäss an, keinen Platz
  const start = leeresRegal();
  start['platz'] = [
    {
      id: platzId('2.3'),
      client_id: platzId('2.3'),
      anlage_id: uid('2a', 1),
      bereich_id: uid('2e', 2),
      kennung: '2.3',
      rolle: 'gefaess',
      aktiv: true,
      storniert_am: null,
    },
  ];
  const geschrieben = await mitDaten(page, start);
  await nachladenVerzoegern(page, 1500, 'gefaess');
  await gruppe(page, 'Luftpumpe').getByRole('radio', { name: 'P2', exact: true }).check();
  await gefaessBisZusammenfassung(page, '3');
  await knopf(page, 'Speichern und nächstes erfassen').click();

  await expect(
    page.getByRole('status').filter({ hasText: 'R-2.3 gespeichert, Stand wird geladen' }),
  ).toBeVisible();
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: /^R-2\.3 gespeichert$/ })).toBeVisible({
    timeout: 10_000,
  });
  await expect(gruppe(page, 'Position').getByRole('radio', { name: '1', exact: true })).toBeChecked();
  await expect(knopf(page, 'Weiter')).toBeEnabled();

  const gefaesse = geschrieben.filter(([t]) => t === 'gefaess');
  expect(gefaesse).toHaveLength(1);
  expect(gefaesse[0]?.[1]['platz_id']).toBe(platzId('2.3'));
  expect(geschrieben.filter(([t]) => t === 'platz')).toHaveLength(0);
});
