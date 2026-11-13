// Deckelwahl mit Lochbild und nach Box gefiltert (Entscheid 0021, Rückmeldung Tim beim Einrichten der Honor-Tests).
// Regal R aus tests/fixtures/regal.ts (ohne Orte, für «Gefäss ändern» belegt), REST nachgebildet, 360 × 640 aus der Konfiguration. Lead-Test.
import { expect, test, type Page } from '@playwright/test';
import { leeresRegal, regalTeile, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

async function mitDaten(page: Page, start: Teile, pfad = '/#/gefaess-neu?a=R'): Promise<void> {
  const daten = sichtenNachrechnen(structuredClone(start));
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, new Date());
      sichtenNachrechnen(daten);
    },
  );
  await page.goto(pfad);
}

const gruppe = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
const weiter = (page: Page) => page.getByRole('button', { name: 'Weiter', exact: true });

/** Schritt 1 und 2: Ebene 2, Position 1, Box nach Name; danach steht Schritt 3 offen */
async function bisDeckel(page: Page, box: RegExp): Promise<void> {
  await gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe(page, 'Position').getByRole('radio', { name: '1', exact: true }).check();
  await weiter(page).click();
  await gruppe(page, 'Box').getByRole('radio', { name: box }).check();
  await weiter(page).click();
  await expect(page.getByText('Schritt 3 von 4')).toBeVisible();
}

const deckelRadios = (page: Page) => gruppe(page, 'Deckel oder Platte').getByRole('radio');

test('DK1-AK2 DK1-AK4 Gefäss 2.1 mit Rako 40 × 30 × 22: nur D1, D2, D3, D2 als vorgesehener Deckel zuoberst und gewählt', async ({
  page,
}) => {
  await mitDaten(page, leeresRegal());
  await bisDeckel(page, /^Rako 40 × 30 × 22/);
  await expect(deckelRadios(page)).toHaveCount(3);
  const namen = await deckelRadios(page).evaluateAll((els) =>
    els.map((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent),
  );
  expect(namen).toEqual(['D2', 'D1', 'D3']);
  const d2 = gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true });
  await expect(d2).toBeChecked();
  await expect(d2).toHaveAccessibleDescription(
    '6 Löcher · 8 cm · Reihen 3, 3 · für Rako 40 × 30 · vorgesehen für 2.1',
  );
  await expect(page.getByText('Passend zu Rako 40 × 30 × 22; 4 weitere ausgeblendet')).toBeVisible();
  // «Weiter» ohne weiteren Tipp; die Zusammenfassung beschreibt den Deckel
  await weiter(page).click();
  await expect(page.getByText('D2 (6 Löcher · 8 cm · Reihen 3, 3)', { exact: true })).toBeVisible();
});

test('DK1-AK1 DK1-AK3 «Alle Deckel zeigen» blendet die übrigen mit «passt nicht zur Box» ein, «Nur passende zeigen» wieder aus', async ({
  page,
}) => {
  await mitDaten(page, leeresRegal());
  await bisDeckel(page, /^Rako 30 × 20 × 12/);
  await expect(deckelRadios(page)).toHaveCount(2);
  // je Option eine Vorschau des Lochbilds, nur Anzeige
  await expect(gruppe(page, 'Deckel oder Platte').locator('svg.hv-deckel-vorschau')).toHaveCount(2);
  await page.getByRole('button', { name: 'Alle Deckel zeigen', exact: true }).click();
  await expect(deckelRadios(page)).toHaveCount(7);
  await expect(
    gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'S5', exact: true }),
  ).toHaveAccessibleDescription(
    '13 Löcher · 5 cm · Reihen 1, 2, 1, 2, 1, 2, 1, 2, 1 · für Leni Flori 36 · passt nicht zur Box',
  );
  await expect(page.locator('svg.hv-deckel-vorschau')).toHaveCount(7);
  await page.getByRole('button', { name: 'Nur passende zeigen', exact: true }).click();
  await expect(deckelRadios(page)).toHaveCount(2);
  // die Seite bleibt bei 360 dp schmal
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('DK1-AK3 Box ohne bekannte Grundfläche: alle Deckel mit Hinweis, keiner vorgewählt', async ({
  page,
}) => {
  const teile = leeresRegal();
  teile['gefaessmodell'] = [
    ...(teile['gefaessmodell'] ?? []),
    {
      id: '2d000000-0000-4000-8000-000000000099',
      client_id: '2d000000-0000-4000-8000-000000000099',
      name: 'Grosse Box 60 × 40',
      form: 'rechteckig',
      innen_l_mm: 570,
      innen_b_mm: 370,
      innen_h_mm: 210,
      nennvolumen_l: 40,
      betriebsvolumen_l: 30,
      storniert_am: null,
    },
  ];
  await mitDaten(page, teile);
  await bisDeckel(page, /^Grosse Box 60 × 40/);
  await expect(
    page.getByText('Für «Grosse Box 60 × 40» ist keine Grundfläche hinterlegt: alle Deckel stehen zur Wahl'),
  ).toBeVisible();
  await expect(deckelRadios(page)).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Alle Deckel zeigen', exact: true })).toHaveCount(0);
  // D2 ist für 2.1 vorgesehen, aber die Passung ist unbekannt: keine Vorwahl, «Weiter» gesperrt
  await expect(deckelRadios(page).and(page.locator(':checked'))).toHaveCount(0);
  await expect(weiter(page)).toBeDisabled();
});

test('DK1-AK3 kein Deckel passt zur Box: alle Deckel mit Warnung, keiner vorgewählt', async ({ page }) => {
  const teile = leeresRegal();
  // nur die Platten der Stationen erfasst, Box Rako 40 × 30 (Prüfer Runde 1, Befund 2)
  teile['deckeltyp'] = (teile['deckeltyp'] ?? []).filter((d) => ['S8', 'S5'].includes(String(d['name'])));
  await mitDaten(page, teile);
  await bisDeckel(page, /^Rako 40 × 30 × 22/);
  await expect(
    page.getByText('Kein Deckel passt zu «Rako 40 × 30 × 22»: alle Deckel stehen zur Wahl'),
  ).toBeVisible();
  await expect(deckelRadios(page)).toHaveCount(2);
  await expect(
    gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'S8', exact: true }),
  ).toHaveAccessibleDescription(/passt nicht zur Box/);
  await expect(deckelRadios(page).and(page.locator(':checked'))).toHaveCount(0);
  await expect(weiter(page)).toBeDisabled();
});

test('DK1-AK2 Gefäss ändern: neue Box blendet unpassende Deckel aus, der bisherige Deckel bleibt gewählt und sichtbar', async ({
  page,
}) => {
  // 2.3 mit Rako 40 × 30 × 22 und D2 (Prüfer Runde 1, Befund 4)
  await mitDaten(page, regalTeile(), '/#/gefaess/R-2.3/aendern');
  await expect(page.getByLabel(/^Wechseln alle/)).toBeVisible({ timeout: 15_000 });
  const d2 = gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true });
  await expect(d2).toBeChecked();
  await expect(deckelRadios(page)).toHaveCount(3);
  await gruppe(page, 'Box').getByRole('radio', { name: 'Rako 30 × 20 × 12', exact: true }).check();
  // D4 und D6 passen, D2 bleibt als bisherige Wahl
  await expect(deckelRadios(page)).toHaveCount(3);
  await expect(d2).toBeChecked();
  await expect(d2).toHaveAccessibleDescription(/passt nicht zur Box/);
  await expect(
    gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D4', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
