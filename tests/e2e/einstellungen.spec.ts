// Einstellungen und Notfallblatt (Plan 32; UC0-AK3, UC0-AK4; Konzept 11.7). REST nachgebildet (Plan 18 A7), Regal R
// aus tests/fixtures/regal.ts. Die Telefonnummer ist ein Platzhaltertext ohne Ziffern (Annahme 12). Routine: Tests
// vom Lead.
import { expect, test, type Page } from '@playwright/test';
import { platzId, regalTeile, uid, type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');
const EINSTELLUNG = uid('34', 1);

interface Mitschnitt {
  neu: [string, Record<string, unknown>][];
  geaendert: [string, string, Record<string, unknown>][];
}

function daten(): Teile {
  const t = regalTeile(JETZT);
  t['messgeraet'] = [{ id: uid('23', 1), modell: 'Aquamaster P160 Pro2', u_ec: 0.1, u_ph: 0.1 }];
  t['einstellung'] = [
    {
      id: EINSTELLUNG,
      push_zeit: '07:00:00',
      vorlauf_n: 2,
      kannengroesse_l: 10,
      messmittel_ml: [1, 5, 20, 60],
      messbecher: true,
      thema: 'hell',
      pflegebudget_min_werktag: 20,
      pflegebudget_h_woche: 4,
      zeitzone: 'Europe/Zurich',
      telefon_vertretung: 'Platzhalter',
    },
  ];
  return t;
}

async function mitDaten(page: Page, pfad: string, ohneEinstellung = false): Promise<Mitschnitt> {
  const d = daten();
  if (ohneEinstellung) delete d['einstellung'];
  const m: Mitschnitt = { neu: [], geaendert: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => d,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.neu.push([tabelle, z]);
        zeileAufnehmen(d, tabelle, z, JETZT);
      }
    },
    undefined,
    (tabelle, id, felder) => {
      m.geaendert.push([tabelle, id, felder]);
      const z = (d[tabelle] ?? []).find((x) => x['id'] === id);
      if (z) Object.assign(z, felder);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  return m;
}

const abschnitt = (page: Page, name: string) => page.getByRole('form', { name });

test('UC0-AK3 Push-Zeit nur 05:00 bis 22:00; Kanne ändern zeigt das Rechenbeispiel und speichert', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/einstellungen');
  const erinnerung = abschnitt(page, 'Erinnerung');
  await expect(erinnerung.getByLabel('Push-Zeit')).toHaveValue('07:00', { timeout: 15_000 });
  await erinnerung.getByLabel('Push-Zeit').fill('23:00');
  await erinnerung.getByRole('button', { name: 'Speichern' }).click();
  await expect(erinnerung).toContainText('Push-Zeit nur 05:00 bis 22:00');
  expect(m.geaendert).toHaveLength(0);
  await erinnerung.getByLabel('Push-Zeit').fill('06:30');
  await erinnerung.getByRole('button', { name: 'Speichern' }).click();
  await expect(erinnerung).toContainText('Gespeichert');
  expect(m.geaendert).toContainEqual(['einstellung', EINSTELLUNG, { push_zeit: '06:30', vorlauf_n: 2 }]);

  const kanne = abschnitt(page, 'Kanne');
  await kanne.getByLabel('Kannengrösse').fill('8');
  await expect(kanne).toContainText('2.3 halbe Dosis je Kanne: vorher 18.0 ml, neu 14.5 ml');
  await kanne.getByRole('button', { name: 'Speichern' }).click();
  await expect(kanne).toContainText('Gespeichert');
  expect(m.geaendert).toContainEqual(['einstellung', EINSTELLUNG, { kannengroesse_l: 8 }]);
  await kanne.getByLabel('Kannengrösse').fill('12.5');
  await kanne.getByRole('button', { name: 'Speichern' }).click();
  await expect(kanne).toContainText('Kannengrösse nur 1 bis 12 l');
});

test('UC0-AK4 k-Satz: ausserhalb 0.2 bis 0.45 nicht übernehmbar, über 20 % mit Rückfrage, dann je Komponente eine Zeile', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/einstellungen');
  const k = abschnitt(page, 'k je Komponente');
  await expect(k.getByLabel('Grow')).toHaveValue('0.300', { timeout: 15_000 });
  for (const c of ['Grow', 'Micro', 'Bloom']) await k.getByLabel(c).fill('0.5');
  await k.getByRole('button', { name: 'Speichern' }).click();
  await expect(k).toContainText('nicht übernehmbar');

  for (const c of ['Grow', 'Micro', 'Bloom']) await k.getByLabel(c).fill('0.37');
  await k.getByRole('button', { name: 'Speichern' }).click();
  await expect(k).toContainText('k ändert sich um 23.3 % gegen bisher. Übernehmen?');
  expect(m.neu.filter(([t]) => t === 'k_faktor')).toHaveLength(0);
  await k.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(k).toContainText('Gespeichert');
  const zeilen = m.neu.filter(([t]) => t === 'k_faktor').map(([, z]) => z);
  expect(zeilen.map((z) => z['produkt_id']).sort()).toEqual(['bloom', 'grow', 'micro_hard_water']);
  for (const z of zeilen) expect(z).toMatchObject({ wert: 0.37, quelle: 'becherversuch' });
});

test('Ruhe je Gefäss schreibt ein Ereignis ruhe', async ({ page }) => {
  const m = await mitDaten(page, '/#/einstellungen');
  await page.getByRole('button', { name: 'R-2.3 ruht' }).click();
  await expect.poll(() => m.neu.filter(([t]) => t === 'ereignis').length).toBe(1);
  expect(m.neu.find(([t]) => t === 'ereignis')?.[1]).toMatchObject({
    typ: 'ruhe',
    platz_id: platzId('2.3'),
    daten: { gesetzt: true },
  });
});

test('Konzept 11.7 Notfallblatt: eine Zeile je Gefäss, Vertretungsblatt mit Kontakt aus der Datenbank', async ({
  page,
}) => {
  await mitDaten(page, '/#/notfallblatt');
  const stand = page.getByRole('region', { name: 'Stand je Gefäss' });
  await expect(stand.locator('tbody tr')).toHaveCount(13, { timeout: 15_000 });
  await expect(stand.locator('tbody tr').nth(4)).toContainText('2.3');
  await expect(stand.locator('tbody tr').nth(4)).toContainText('Micro 15.5 ml · Grow 23.5 ml · Bloom 8.0 ml');
  const vertretung = page.getByRole('region', { name: 'Vertretung' });
  await expect(vertretung).toContainText('Keinen Dünger geben.');
  await expect(vertretung).toContainText('Bei Fragen: Platzhalter');
  await expect(page.getByRole('button', { name: 'Drucken' })).toBeVisible();
});

test('Heute führt zu den Einstellungen, die Einstellungen zum Notfallblatt', async ({ page }) => {
  await mitDaten(page, '/#/heute');
  await page.getByRole('link', { name: 'Einstellungen öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible();
  await page.getByRole('link', { name: 'Notfallblatt drucken' }).click();
  await expect(page.getByRole('region', { name: 'Stand je Gefäss' })).toBeVisible();
});

test('F126-AK1 Ohne Zeile einstellung zeigt #/einstellungen «Zu Heute», den Hinweis und den Link zur Push-Seite', async ({
  page,
}) => {
  await mitDaten(page, '/#/einstellungen', true);
  await expect(page.getByText('Keine Einstellungen gefunden')).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText('Die Einstellungen entstehen beim ersten Laden des Wissens (Seed).'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Zu Heute' })).toBeVisible();
  await page.getByRole('link', { name: 'Push einrichten und Test-Push senden' }).click();
  await expect(page).toHaveURL(/#\/push$/);
  await page.goto('/#/einstellungen');
  await page.getByRole('link', { name: 'Zu Heute' }).click();
  await expect(page).toHaveURL(/#\/heute$/);
});
