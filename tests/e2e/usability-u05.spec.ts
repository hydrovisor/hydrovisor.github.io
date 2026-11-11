// Usability Runde 4 (Issue #168; docs/entwurf/usability_befunde.md B16, B17): Messstelle W öffnet nach dem Speichern
// die Messmaske, Gefässe lassen sich ohne Umweg über die Anlage in Folge erfassen. REST nachgebildet wie
// gefaess.spec.ts; Regal R ohne Plätze aus tests/fixtures/regal.ts; 360 × 640 aus der Konfiguration.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { leeresRegal, type Teile } from '../fixtures/regal.ts';
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

test('U05-AK2 «Speichern und nächstes erfassen» speichert 2.3, meldet es und beginnt wieder bei Schritt 1', async ({
  page,
}) => {
  const geschrieben = await mitDaten(page, leeresRegal());
  await gefaessBisZusammenfassung(page, '3');
  await knopf(page, 'Speichern und nächstes erfassen').click();

  await expect(page.getByRole('status').filter({ hasText: 'R-2.3 gespeichert' })).toBeVisible();
  await expect(page.getByText('Schritt 1 von 4')).toBeVisible();
  await expect(page).toHaveURL(/#\/gefaess-neu\?a=R$/);
  await expect(gruppe(page, 'Rolle').getByRole('radio', { name: 'Gefäss' })).toBeChecked();
  await expect(gruppe(page, 'Bereich').getByRole('radio', { checked: true })).toHaveCount(0);
  const gefaesse = () => geschrieben.filter(([t]) => t === 'gefaess');
  expect(gefaesse()).toHaveLength(1);

  // das nächste Gefäss bekommt eine eigene Kennung und einen eigenen Vorgang
  await gefaessBisZusammenfassung(page, '1');
  await expect(page.getByText('R-2.1', { exact: true })).toBeVisible();
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.1$/);
  expect(gefaesse()).toHaveLength(2);
  const kennungen = geschrieben
    .filter(([t, z]) => t === 'platz' && z['rolle'] === 'gefaess')
    .map(([, z]) => z['kennung']);
  expect(kennungen).toEqual(['2.3', '2.1']);
});
