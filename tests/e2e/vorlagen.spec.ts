// Vorlagen Box und Deckel unter #/vorlagen (Plan 19 Testliste E2E; UC2-AK3 und Ablauf UC2). Schreibtisch-Maske,
// 360 × 640 aus der Konfiguration. REST nachgebildet: GET über restNachbilden, POST auf deckeltyp und gefaessmodell
// mit eigener page.route in dieser Spec (Plan 19 A11). Lochbilder aus tests/fixtures/lochbilder.ts.
import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import { LOCHBILDER } from '../fixtures/lochbilder.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

type Teile = Record<string, unknown[]>;

/** Wert oder sichtbarer Abbruch statt Non-Null-Zusicherung */
function da<T>(wert: T | null | undefined, was: string): T {
  if (wert === null || wert === undefined) throw new Error(`${was} fehlt`);
  return wert;
}

async function masse(locator: Locator) {
  return da(await locator.boundingBox(), 'Bounding Box');
}

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

const grafik = (page: Page) => page.getByRole('group', { name: 'Deckel' });
const loecherIn = (page: Page) => grafik(page).getByRole('button');
const loch = (page: Page, nr: number) =>
  grafik(page).getByRole('button', { name: new RegExp(`^Loch ${nr},`) });
const lochfeld = (page: Page) => page.getByLabel(/^Löcher je Reihe/);

async function deckelFormular(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Deckel erfassen' }).click();
  await expect(lochfeld(page)).toBeVisible();
}

for (const typ of LOCHBILDER) {
  test(`UC2-AK3 jedes Loch der Grafik mindestens 48 dp bei 360 × 640: ${typ.name} «${typ.eingabe}»`, async ({
    page,
  }) => {
    const posts = await vorlagenOeffnen(page);
    await deckelFormular(page);
    await lochfeld(page).fill(typ.eingabe);

    // die Grafik erscheint sofort, ohne Speichern (UC2 «Ablauf Deckel oder Platte»)
    const anzahl = typ.nummern.flat().length;
    await expect(loecherIn(page)).toHaveCount(anzahl);
    expect(posts).toHaveLength(0);

    const boxen = [];
    for (const l of await loecherIn(page).all()) {
      const b = await masse(l);
      expect(b.width, 'Breite eines Lochs').toBeGreaterThanOrEqual(47.5);
      expect(b.height, 'Höhe eines Lochs').toBeGreaterThanOrEqual(47.5);
      boxen.push(b);
    }

    // Nummern spaltenweise (E9): Loch n liegt in der Reihe aus dem Lochbild (Reihe 1 = vorne = unten), erst die
    // linke Spalte von vorne nach hinten, dann die nächste
    const yJeReihe: number[] = [];
    for (const [i, reihe] of typ.nummern.entries()) {
      for (const nr of reihe) await expect(loch(page, nr)).toHaveAttribute('data-reihe', String(i + 1));
      const erstes = await masse(loch(page, da(reihe[0], 'erstes Loch der Reihe')));
      yJeReihe.push(erstes.y);
      // innerhalb der Reihe von links nach rechts
      let x = -Infinity;
      for (const nr of reihe) {
        const b = await masse(loch(page, nr));
        expect(b.x, `Loch ${nr} rechts vom vorigen`).toBeGreaterThan(x);
        x = b.x;
      }
    }
    for (let i = 1; i < yJeReihe.length; i++)
      expect(da(yJeReihe[i], 'Reihe'), `Reihe ${i + 1} liegt hinter (über) Reihe ${i}`).toBeLessThan(
        da(yJeReihe[i - 1], 'Reihe'),
      );

    // Loch 1 vorne links: unterste Reihe, dort ganz links
    const eins = await masse(loch(page, 1));
    expect(eins.y).toBeGreaterThanOrEqual(Math.max(...boxen.map((b) => b.y)) - 0.5);
    const vorne = grafik(page).locator('[data-reihe="1"]');
    for (const l of await vorne.all()) expect(eins.x).toBeLessThanOrEqual((await masse(l)).x + 0.5);
  });
}

test('UC2-AK3 breites Lochbild «6, 6» bleibt bei 48 dp und scrollt im Rahmen statt zu schrumpfen', async ({
  page,
}) => {
  await vorlagenOeffnen(page);
  await deckelFormular(page);
  await lochfeld(page).fill('6, 6');
  await expect(loecherIn(page)).toHaveCount(12);
  for (const l of await loecherIn(page).all()) {
    const b = await masse(l);
    expect(b.width).toBeGreaterThanOrEqual(47.5);
    expect(b.height).toBeGreaterThanOrEqual(47.5);
  }
  // die Reihe ist breiter als die Maske: der Rahmen um die Grafik scrollt waagrecht, die Seite nicht
  const rahmen = page.locator('.hv-deckel-rahmen').filter({ has: grafik(page) });
  await expect(rahmen).toHaveCount(1);
  const { scroll, sichtbar, ueberlauf } = await rahmen.evaluate((e) => ({
    scroll: e.scrollWidth,
    sichtbar: e.clientWidth,
    ueberlauf: getComputedStyle(e).overflowX,
  }));
  expect(ueberlauf).toBe('auto');
  expect(scroll).toBeGreaterThan(sichtbar);
  const seite = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(seite, 'Seite ohne waagrechten Bildlauf').toBeLessThanOrEqual(360);
  // nach dem Bildlauf ist Loch 6 (vorne rechts) erreichbar
  await loch(page, 6).scrollIntoViewIfNeeded();
  await expect(loch(page, 6)).toBeInViewport();
});

test('UC2 Speichern schreibt genau eine Zeile deckeltyp «2, 2, 2» mit 5 cm und Service-Öffnung', async ({
  page,
}) => {
  const posts = await vorlagenOeffnen(page);
  await deckelFormular(page);
  await page.getByLabel('Name', { exact: true }).fill('D6');
  await page.getByRole('radio', { name: '5 cm' }).check();
  await lochfeld(page).fill('2, 2, 2');
  await page.getByRole('group', { name: 'Service-Öffnung' }).getByRole('radio', { name: 'ja' }).check();
  await expect(loecherIn(page)).toHaveCount(6);

  const post = page.waitForRequest((r) => r.method() === 'POST' && r.url().startsWith(`${REST}/deckeltyp`));
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  const body: unknown = (await post).postDataJSON();
  const zeile = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
  expect(zeile).toMatchObject({
    name: 'D6',
    topfdurchmesser_mm: 50,
    loecher_je_reihe: [2, 2, 2],
    service_oeffnung: true,
  });
  expect(zeile['client_id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  expect(zeile).not.toHaveProperty('storniert_am');
  // die Liste zeigt den neuen Deckel; es bleibt bei genau einer Zeile
  await expect(page.getByText('D6', { exact: true }).first()).toBeVisible();
  await page.waitForTimeout(300);
  expect(posts).toHaveLength(1);
});

test('UC2 Box rechteckig zeigt den Volumen-Vorschlag, oval den Hinweis ohne Vorschlag', async ({ page }) => {
  await vorlagenOeffnen(page);
  await page.getByRole('button', { name: 'Box erfassen' }).click();
  await page.getByRole('radio', { name: 'rechteckig' }).check();
  await page.getByLabel(/^Länge/).fill('400');
  await page.getByLabel(/^Breite/).fill('300');
  await page.getByLabel(/^Höhe/).fill('270');
  await page.getByLabel(/^Füllhöhe/).fill('150');
  await expect(page.getByText(/18\.0 l/)).toBeVisible();

  await page.getByRole('radio', { name: 'oval' }).check();
  await expect(page.getByText(/18\.0 l/)).toHaveCount(0);
  await expect(page.getByText(/ohne Vorschlag|kein Vorschlag/i)).toBeVisible();
});

test('UC2 R9.3 Betriebsvolumen nicht kleiner als L · B · H zeigt den Fehlertext und sendet nicht', async ({
  page,
}) => {
  const posts = await vorlagenOeffnen(page);
  await page.getByRole('button', { name: 'Box erfassen' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Rako 40 × 30 × 27');
  await page.getByRole('radio', { name: 'rechteckig' }).check();
  await page.getByLabel(/^Länge/).fill('400');
  await page.getByLabel(/^Breite/).fill('300');
  await page.getByLabel(/^Höhe/).fill('270');
  await page.getByLabel(/^Betriebsvolumen/).fill('32.4');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByText(/kleiner als/i)).toBeVisible();
  await page.waitForTimeout(300);
  expect(posts).toHaveLength(0);
});

test('UC2 genutzte Vorlage zeigt «Wird genutzt von 2.1, 2.3, nicht löschbar» ohne Knopf «Löschen»', async ({
  page,
}) => {
  const ohneStorno = { storniert_am: null };
  const teile: Teile = {
    gefaessmodell: [
      {
        id: '19e2e000-0000-4000-8000-0000000000a1',
        client_id: '19e2e000-0000-4000-8000-0000000000c1',
        name: 'Rako 40 × 30 × 17',
        form: 'rechteckig',
        innen_l_mm: 400,
        innen_b_mm: 300,
        innen_h_mm: 170,
        nennvolumen_l: '15.00',
        betriebsvolumen_l: '9.00',
        ...ohneStorno,
      },
    ],
    deckeltyp: [
      {
        id: '19e2e000-0000-4000-8000-0000000000d2',
        client_id: '19e2e000-0000-4000-8000-0000000000c2',
        name: 'D2',
        topfdurchmesser_mm: 80,
        loecher_je_reihe: [3, 3],
        service_oeffnung: true,
        ...ohneStorno,
      },
      {
        id: '19e2e000-0000-4000-8000-0000000000d3',
        client_id: '19e2e000-0000-4000-8000-0000000000c3',
        name: 'D3',
        topfdurchmesser_mm: 50,
        loecher_je_reihe: [4, 4],
        service_oeffnung: true,
        ...ohneStorno,
      },
    ],
    platz: [
      {
        id: '19e2e000-0000-4000-8000-0000000000f1',
        anlage_id: 'a',
        kennung: '2.1',
        rolle: 'gefaess',
        aktiv: true,
      },
      {
        id: '19e2e000-0000-4000-8000-0000000000f3',
        anlage_id: 'a',
        kennung: '2.3',
        rolle: 'gefaess',
        aktiv: true,
      },
    ].map((p) => ({ ...p, ...ohneStorno })),
    gefaess: ['f1', 'f3'].map((p, i) => ({
      id: `19e2e000-0000-4000-8000-0000000000e${i + 1}`,
      platz_id: `19e2e000-0000-4000-8000-0000000000${p}`,
      gefaessmodell_id: '19e2e000-0000-4000-8000-0000000000a1',
      deckeltyp_id: '19e2e000-0000-4000-8000-0000000000d2',
      gueltig_bis: null,
      ...ohneStorno,
    })),
  };
  await vorlagenOeffnen(page, teile);
  await expect(page.getByText('D2', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('D3', { exact: true }).first()).toBeVisible();
  // Deckel D2 und die Box werden von 2.1 und 2.3 genutzt: Hinweis statt Löschen; D3 ist ungenutzt und löschbar
  await expect(page.getByText('Wird genutzt von 2.1, 2.3, nicht löschbar')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /^Löschen/ })).toHaveCount(1);
});
