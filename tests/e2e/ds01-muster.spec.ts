// DS-01 Musterseite (#17, Plan 17): Tasten 68 dp, Löcher und Kacheln Mindestmasse, Druckmasse, beide Themen.
// Viewport 360 × 640 bei Gerätedichte 1: 1 dp = 1 px (Konzept 10).
import { expect, test, type Locator, type Page } from '@playwright/test';

const THEMEN = ['light', 'dark'] as const;
const PX_JE_MM = 96 / 25.4;

async function masse(l: Locator) {
  const box = await l.boundingBox();
  if (!box) throw new Error('Element nicht sichtbar');
  return box;
}

async function muster(page: Page) {
  await page.goto('/#/muster');
  await expect(page.getByRole('heading', { name: 'Musterseite', level: 1 })).toBeVisible();
}

test('DS-01 Musterseite ohne Anmeldung erreichbar, beide Themen mit eigenem Seitengrund', async ({
  page,
}) => {
  await muster(page);
  const grund = async (id: string) =>
    page.getByTestId(`muster-${id}`).evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(await grund('light')).toBe('rgb(242, 245, 244)');
  expect(await grund('dark')).toBe('rgb(17, 25, 28)');
});

for (const thema of THEMEN) {
  test(`DS-01 Musterseite Tasten 68 dp, Abstand 8 dp, Raster nach R3 (${thema})`, async ({ page }) => {
    await muster(page);
    const bereich = page.getByTestId(`muster-${thema}`);
    const block = bereich.getByRole('group', { name: 'Ziffernblock' });
    const tasten = block.getByRole('button');
    await expect(tasten).toHaveCount(16);
    for (const t of await tasten.all()) {
      const b = await masse(t);
      expect(b.height).toBeCloseTo(68, 0);
      expect(b.width).toBeGreaterThanOrEqual(68);
    }
    // rechte Spalte von oben: leeren, −0.1, +0.1, Rücktaste (Entscheid R3)
    const namen = await tasten.evaluateAll((el) => el.map((e) => e.getAttribute('aria-label')));
    expect([namen[3], namen[7], namen[11], namen[15]]).toEqual([
      'leeren',
      'minus 0.1',
      'plus 0.1',
      'Rücktaste',
    ]);
    const sieben = await masse(block.getByRole('button', { name: 'Ziffer 7' }));
    const acht = await masse(block.getByRole('button', { name: 'Ziffer 8' }));
    const vier = await masse(block.getByRole('button', { name: 'Ziffer 4' }));
    expect(acht.x - (sieben.x + sieben.width)).toBeCloseTo(8, 0);
    expect(vier.y - (sieben.y + sieben.height)).toBeCloseTo(8, 0);
    // jede Tippfläche im Regal-Bereich mindestens 68 dp, auch Haken und Speichern
    const regal = bereich.locator('[data-density="regal"]');
    for (const knopf of await regal.locator('.hv-btn, .hv-check-haken').all()) {
      expect((await masse(knopf)).height).toBeGreaterThanOrEqual(68);
    }
    // über «Speichern» 16 dp
    const ruecktaste = await masse(block.getByRole('button', { name: 'Rücktaste' }));
    const speichern = await masse(regal.getByRole('button', { name: 'Messwert speichern' }));
    expect(speichern.y - (ruecktaste.y + ruecktaste.height)).toBeCloseTo(16, 0);
  });

  test(`DS-01 Musterseite Kacheln und Löcher Mindestmasse (${thema})`, async ({ page }) => {
    await muster(page);
    const bereich = page.getByTestId(`muster-${thema}`);
    const orte = bereich.locator('.hv-muster-orte .hv-tile');
    await expect(orte).toHaveCount(4);
    for (const o of await orte.all()) {
      const b = await masse(o);
      expect(b.width).toBeGreaterThanOrEqual(72);
      expect(b.height).toBeGreaterThanOrEqual(80);
      expect(await o.locator('.hv-tile-kennung').evaluate((e) => getComputedStyle(e).fontSize)).toBe('28px');
    }
    const wert = bereich.locator('.hv-tile-value').first();
    expect(await wert.evaluate((e) => getComputedStyle(e).fontSize)).toBe('40px');
    const symbol = await masse(bereich.locator('.hv-tile-kopf .hv-status-icon').first());
    expect(symbol.height).toBeCloseTo(32, 0);
    const loecher = bereich.getByRole('group', { name: 'Deckel' }).getByRole('button');
    await expect(loecher).toHaveCount(6);
    for (const l of await loecher.all()) {
      const b = await masse(l);
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(48);
    }
    // Loch 1 vorne links: unterste Reihe, links
    const eins = await masse(loecher.filter({ hasText: '2.3.1' }));
    const drei = await masse(bereich.getByRole('button', { name: 'Loch 3, frei' }));
    expect(eins.y).toBeGreaterThan(drei.y);
    // spaltenweise (Konzept v1.4 5.4, E9): Loch 2 liegt in derselben Spalte hinter (über) Loch 1
    const zwei = await masse(loecher.filter({ hasText: '2.3.2' }));
    expect(zwei.x).toBeCloseTo(eins.x, 0);
    expect(zwei.y).toBeLessThan(eins.y);
    // Statuswort in voller Breite in der Ergebniszone, nie nur Farbe
    await expect(bereich.locator('.hv-ergebnis')).toHaveText([
      'Im grünen Bereich',
      'Knapp daneben',
      'Ausserhalb',
    ]);
  });
}

test('DS-01 Musterseite Ziffernblock: 1, 1, 2 ergibt 112, «leeren» und Rücktaste', async ({ page }) => {
  await muster(page);
  const bereich = page.getByTestId('muster-light');
  const block = bereich.getByRole('group', { name: 'Ziffernblock' });
  const echo = bereich.locator('.hv-numpad-echo');
  for (const z of ['1', '1', '2']) {
    await block.getByRole('button', { name: `Ziffer ${z}` }).click();
    await page.waitForTimeout(150);
  }
  await expect(echo).toHaveText('112');
  await block.getByRole('button', { name: 'Rücktaste' }).click();
  await expect(echo).toHaveText('11');
  await block.getByRole('button', { name: 'leeren' }).click();
  await expect(echo).toHaveText('');
});

test('DS-01 Musterseite Etikett 70 × 42.3 mm, Kennung auf 32 mm, Bogen A4, schwarz auf weiss', async ({
  page,
}) => {
  await muster(page);
  const etikett = page.getByTestId('etikett').first();
  const b = await masse(etikett);
  expect(Math.abs(b.width / PX_JE_MM - 70)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(b.height / PX_JE_MM - 42.3)).toBeLessThanOrEqual(0.5);
  const kennung = await masse(etikett.locator('.hv-label-text'));
  expect(Math.abs(kennung.width / PX_JE_MM - 32)).toBeLessThanOrEqual(0.5);
  const qr = await masse(etikett.locator('.hv-label-qr'));
  expect(Math.abs(qr.width / PX_JE_MM - 30)).toBeLessThanOrEqual(0.5);
  expect(Math.abs((qr.x - b.x) / PX_JE_MM - 4)).toBeLessThanOrEqual(0.5);
  const farben = await etikett.evaluate((e) => [
    getComputedStyle(e).color,
    getComputedStyle(e).backgroundColor,
  ]);
  expect(farben).toEqual(['rgb(0, 0, 0)', 'rgb(255, 255, 255)']);

  const bogen = await masse(page.getByTestId('bogen'));
  expect(Math.abs(bogen.width / PX_JE_MM - 210)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(bogen.height / PX_JE_MM - 297)).toBeLessThanOrEqual(0.5);
  // Startfeld 2: das erste Feld bleibt leer, das Etikett sitzt im zweiten Feld
  expect(Math.abs((b.x - bogen.x) / PX_JE_MM - 70)).toBeLessThanOrEqual(0.5);
  expect(Math.abs((b.y - bogen.y) / PX_JE_MM - 0.45)).toBeLessThanOrEqual(0.5);
  const klein = await masse(page.getByTestId('etikett').nth(2));
  expect(Math.abs(klein.width / PX_JE_MM - 55)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(klein.height / PX_JE_MM - 25)).toBeLessThanOrEqual(0.5);
});

test('DS-01 Musterseite Notfallblatt und Vertretungsblatt A4 ohne Telefonnummer', async ({ page }) => {
  await muster(page);
  const blatt = await masse(page.getByTestId('notfallblatt'));
  expect(Math.abs(blatt.width / PX_JE_MM - 210)).toBeLessThanOrEqual(0.5);
  await expect(page.getByTestId('notfallblatt').getByRole('columnheader')).toHaveText([
    'Kennung',
    'Betriebsart',
    'Zielbereich',
    'Dosis je Kanne',
    'Letzte Messung',
    'Nächster Wechsel',
  ]);
  await expect(page.getByTestId('vertretungsblatt')).toContainText('Keinen Dünger geben.');
  await expect(page.getByTestId('vertretungsblatt')).not.toContainText(/\d{3} \d{3} \d{2} \d{2}/);
});

test('DS-01 Dichte «regal» setzt Tippflächen auf 68 dp und Text auf 21 sp', async ({ page }) => {
  await muster(page);
  const werte = await page.evaluate(() => {
    const regal = document.createElement('div');
    regal.dataset['density'] = 'regal';
    document.body.append(regal);
    const s = getComputedStyle(regal);
    const r = [
      s.getPropertyValue('--size-touch').trim(),
      s.getPropertyValue('--size-touch-compact').trim(),
      s.fontSize,
    ];
    regal.remove();
    return r;
  });
  expect(werte).toEqual(['68px', '68px', '21px']);
});
