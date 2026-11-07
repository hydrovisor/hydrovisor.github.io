// Vorschläge der Deckeltypen aus dem Konzept 5.4 unter #/vorlagen (#125). Lead-Test; Nachbildung wie vorlagen.spec.ts.
import { expect, test, type Page, type Request } from '@playwright/test';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

type Teile = Record<string, unknown[]>;

/**
 * öffnet #/vorlagen mit Sitzung und nachgebildetem REST; POST auf die Vorlagen-Tabellen wird gesammelt und wie
 * PostgREST mit der Zeile beantwortet, die neue Zeile erscheint danach in den Teilen (Liste nach dem Neuladen)
 */
async function vorlagenOeffnen(page: Page, teile: Teile = {}): Promise<Request[]> {
  const posts: Request[] = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(page, () => teile);
  await page.route(`${REST}/**`, async (route) => {
    const anfrage = route.request();
    const name = new URL(anfrage.url()).pathname.replace(/^\/rest\/v1\//, '');
    if (anfrage.method() !== 'POST' || (name !== 'deckeltyp' && name !== 'gefaessmodell'))
      return route.fallback();
    posts.push(anfrage);
    const body: unknown = anfrage.postDataJSON();
    const zeilen = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
    const gespeichert = zeilen.map((z, i) => ({
      id: `19e2e000-0000-4000-8000-${String((teile[name]?.length ?? 0) + i + 1).padStart(12, '0')}`,
      erfasst_am: '2026-11-04T10:00:00Z',
      storniert_am: null,
      ...z,
    }));
    teile[name] = [...(teile[name] ?? []), ...gespeichert];
    return route.fulfill({ status: 201, json: gespeichert });
  });
  await page.goto('/#/vorlagen');
  await expect(page.getByRole('heading', { name: 'Vorlagen', level: 1 })).toBeVisible();
  return posts;
}

const vorschlaege = (page: Page) => page.getByRole('region', { name: 'Vorschläge aus dem Konzept' });

test('V01-AK2 «D1 übernehmen» füllt das Formular, «Speichern» schreibt genau eine Zeile, danach fehlt D1 in den Vorschlägen', async ({
  page,
}) => {
  const posts = await vorlagenOeffnen(page);
  await expect(vorschlaege(page).getByText('2, 2 · 4 Löcher · 8 cm · für 1.1, 1.2')).toBeVisible();
  await expect(vorschlaege(page).getByRole('listitem')).toHaveCount(7);
  await vorschlaege(page).getByRole('button', { name: 'D1 übernehmen' }).click();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('D1');
  await expect(page.getByRole('radio', { name: '8 cm' })).toBeChecked();
  await expect(page.getByLabel(/^Löcher je Reihe/)).toHaveValue('2, 2');
  await expect(
    page.getByRole('group', { name: 'Service-Öffnung' }).getByRole('radio', { name: 'ja' }),
  ).toBeChecked();
  await expect(page.getByText(/Vorschlag D1 für 1\.1, 1\.2: Das Konzept nennt nur 4 Löcher/)).toBeVisible();
  await expect(page.getByText('Name aus dem 3D-Modell, z. B. D1 für 1.1 und 1.2')).toBeVisible();
  expect(posts).toHaveLength(0);

  const post = page.waitForRequest((r) => r.method() === 'POST' && r.url().startsWith(`${REST}/deckeltyp`));
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  const body: unknown = (await post).postDataJSON();
  const zeile = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
  expect(zeile).toMatchObject({
    name: 'D1',
    topfdurchmesser_mm: 80,
    loecher_je_reihe: [2, 2],
    service_oeffnung: true,
  });
  await expect(page.getByText('Deckel «D1» gespeichert')).toBeVisible();
  await expect(vorschlaege(page).getByRole('listitem')).toHaveCount(6);
  await expect(vorschlaege(page).getByRole('button', { name: 'D1 übernehmen' })).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(posts).toHaveLength(1);
});

test('V01-AK2 D6 aus dem Konzept ohne Annahme-Hinweis; erfasste Typen fehlen in den Vorschlägen', async ({
  page,
}) => {
  await vorlagenOeffnen(page, {
    deckeltyp: [
      {
        id: '19e2e000-0000-4000-8000-0000000000d1',
        client_id: '19e2e000-0000-4000-8000-0000000000c1',
        name: 'S5',
        topfdurchmesser_mm: 50,
        loecher_je_reihe: [1, 2, 1, 2, 1, 2, 1, 2, 1],
        service_oeffnung: true,
        storniert_am: null,
      },
    ],
  });
  await expect(vorschlaege(page).getByRole('listitem')).toHaveCount(6);
  await expect(vorschlaege(page).getByRole('button', { name: 'S5 übernehmen' })).toHaveCount(0);
  await vorschlaege(page).getByRole('button', { name: 'D6 übernehmen' }).click();
  await expect(page.getByLabel(/^Löcher je Reihe/)).toHaveValue('2, 2, 2');
  await expect(
    page.getByText(
      'Vorschlag D6 für 3.2, 4.1 aus dem Konzept. Vergleiche mit deinem Deckel, dann speichern.',
    ),
  ).toBeVisible();
});
