// Demo-Szenarien auf echten Sorten aus W0 (Issue #199, Plan 199 Testliste; W199-AK3; Konzept 11.5).
// Gegen die lokale Datenbank mit dem Testkonto (konto.ts): vorher npm run seed -- --ziel lokal (echtes W0) und
// npm run demo -- --laden. Die Daten stehen relativ zum Ladezeitpunkt, deshalb ohne injizierte Uhr (Plan 199).
// IDs der Demo-Zeilen sind deterministisch (idFuer aus scripts/demo/regeln.ts).
//
// Erwartete Oberfläche (Pflanzenansicht, Plan 35/38): #/pflanze/<id> mit h1 «Pflanze», Kopf
// «Sweet Pickle · Dauerkultur Frucht …» und Phasenzeile «Keimung · …» (S8: Saat vor 7 Tagen, keine Phasenantwort).
import { idFuer } from '../../scripts/demo/regeln.ts';
import { expect, test } from './konto.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

test('W199-AK3 Pflanze aus S8 zeigt Sweet Pickle in der Keimung', async ({ page, konto }) => {
  await konto.anmelden(page);
  await page.goto(`/#/pflanze/${idFuer('X-s8-p1')}`);
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  const kopf = page.locator('main[data-density="regal"] .hv-pflanze-kopf');
  await expect(kopf).toHaveText(/^Sweet Pickle · Dauerkultur Frucht/, { timeout: 15_000 });
  await expect(page.getByText(/^Keimung · /)).toBeVisible();
  await expect(page.getByText('Pflanze nicht bekannt')).toHaveCount(0);
});

// RB1 (Issue #241): S1 hat in 1.2 vier freie 8-cm-Töpfe (Deckel D1), damit Säen Schritt 2 in der Demo ein Ziel
// «Empfohlen» vorwählt (UX6, Entscheid 0028). Lattughino Verde ist eine echte W0-Sorte aus S6 (Entscheid 0020).
test('RB1-AK3 Demo: Säen mit Lattughino Verde zeigt 1.2 «Empfohlen» mit 4 freien Löchern und wählt es vor', async ({
  page,
  konto,
}) => {
  await konto.anmelden(page);
  await page.goto('/#/saeen');
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible({ timeout: 15_000 });
  await sorteWaehlen(page, 'Salat', 'Lattughino Verde', undefined, { weiter: true });
  const gruppe = page.getByRole('group', { name: 'Zielgefäss' });
  const ziel = gruppe.getByRole('button', { name: /^1\.2(?![.\d])/ });
  await expect(ziel).toContainText('Empfohlen');
  await expect(ziel).toContainText('4 freie Löcher');
  await expect(ziel).toHaveAttribute('aria-pressed', 'true');
  await expect(gruppe.locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Alle freien wählen und weiter', exact: true }),
  ).toBeEnabled();
});
