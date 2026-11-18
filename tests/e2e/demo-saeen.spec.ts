// Demo-Szenarien in Säen (Issue #241; RB1-AK3). Gegen die lokale Datenbank mit dem Testkonto (konto.ts) wie
// demo-echt.spec.ts: vorher npm run seed -- --ziel lokal (echtes W0) und npm run demo -- --laden; ohne injizierte Uhr.
import { expect, test } from './konto.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

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
