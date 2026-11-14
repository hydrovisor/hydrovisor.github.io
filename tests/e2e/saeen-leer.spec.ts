// Säen bei lauter aufgebrauchten Sorten: Leerzustand «Alle Sorten aufgebraucht» mit «Zum Saatgut» (Issue #219, Plan
// 219 Testliste NB1-AK9, A13; Plan 215). REST nachgebildet (rest.ts, authNachbilden, sitzungSpeichern wie TF1-AK5):
// die lokale Datenbank bleibt unberührt. Teile aus saatTeile(JETZT), dazu je Sorte ein vorrat_ereignis «aufgebraucht»
// vor JETZT und nach den Packungen der Fixture. Feste Uhr 2027-01-07T08:00:00Z; 360 × 640 aus der Konfiguration.
// Keine Personendaten.
import { expect, test } from '@playwright/test';
import { uid, type Teile } from '../fixtures/regal.ts';
import { saatTeile } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');
// «Kein Saatgut mehr» am Vortag, nach den Packungen der Fixture (erfasst bis 20.11.2026)
const AUFGEBRAUCHT_AM = '2027-01-06T10:00:00.000Z';

function alleAufgebraucht(): Teile {
  const daten: Teile = structuredClone(saatTeile(JETZT));
  const sorten = [...new Set((daten['sorte'] ?? []).map((s) => String(s['sorte_id'])))];
  daten['vorrat_ereignis'] = sorten.map((sorteId, i) => ({
    id: uid('2c', i + 1),
    client_id: uid('2c', 100 + i + 1),
    sorte_id: sorteId,
    saatgut_id: null,
    typ: 'aufgebraucht',
    gilt_ab: AUFGEBRAUCHT_AM,
    erfasst_am: AUFGEBRAUCHT_AM,
    nacherfasst: false,
    storniert_am: null,
    storno_grund: null,
    app_version: 'e2e',
  }));
  return daten;
}

test('NB1-AK9 lauter aufgebrauchte Sorten: Leerzustand «Alle Sorten aufgebraucht», «Zum Saatgut» öffnet die Saatgut-Liste', async ({
  page,
}) => {
  const daten = alleAufgebraucht();
  expect((daten['vorrat_ereignis'] ?? []).length).toBeGreaterThanOrEqual(2);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, JETZT);
    },
    () => undefined,
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/saeen');
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible({ timeout: 15_000 });

  // Leerzustand statt einer leeren Liste
  await expect(page.getByText('Alle Sorten aufgebraucht', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Noch keine Sorten', { exact: true })).toHaveCount(0);
  // keine Gemüsekachel, keine Sortenzeile
  await expect(page.getByRole('group', { name: 'Gemüse' }).getByRole('button')).toHaveCount(0);
  await expect(page.locator('.hv-sortenzeile')).toHaveCount(0);

  const zumSaatgut = page.getByRole('link', { name: 'Zum Saatgut', exact: true });
  await expect(zumSaatgut).toBeVisible();
  await zumSaatgut.click();
  await expect(page).toHaveURL(/#\/(saatgut|sorten)$/);
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible({ timeout: 15_000 });
});
