// Demo-Szenarien auf echten Sorten aus W0 (Issue #199, Plan 199 Testliste; W199-AK3; Konzept 11.5).
// Gegen die lokale Datenbank mit dem Testkonto (konto.ts): vorher npm run seed -- --ziel lokal (echtes W0) und
// npm run demo -- --laden. Die Daten stehen relativ zum Ladezeitpunkt, deshalb ohne injizierte Uhr (Plan 199).
// IDs der Demo-Zeilen sind deterministisch (idFuer aus scripts/demo/regeln.ts).
//
// Erwartete Oberfläche (Pflanzenansicht, Plan 35/38): #/pflanze/<id> mit h1 «Pflanze», Kopf
// «Sweet Pickle · Dauerkultur Frucht …» und Phasenzeile «Keimung · …» (S8: Saat vor 7 Tagen, keine Phasenantwort).
import { idFuer } from '../../scripts/demo/regeln.ts';
import { expect, test } from './konto.ts';

test('W199-AK3 Pflanze aus S8 zeigt Sweet Pickle in der Keimung', async ({ page, konto }) => {
  await konto.anmelden(page);
  await page.goto(`/#/pflanze/${idFuer('X-s8-p1')}`);
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  const kopf = page.locator('main[data-density="regal"] .hv-pflanze-kopf');
  await expect(kopf).toHaveText(/^Sweet Pickle · Dauerkultur Frucht/, { timeout: 15_000 });
  await expect(page.getByText(/^Keimung · /)).toBeVisible();
  await expect(page.getByText('Pflanze nicht bekannt')).toHaveCount(0);
});
