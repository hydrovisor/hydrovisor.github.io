// Zeitwahl und Drehräder in «Anlage anlegen» (Plan 142; ZW-AK2, ZW-AK4; Plan 147: ZR-AK3, ZR-AK4). REST nachgebildet (Plan 18 A7), Regal R aus
// tests/fixtures/regal.ts; 360 × 640 aus der Konfiguration. Routine: Tests vom Lead.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { regalTeile, type Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');

async function mitDaten(
  page: Page,
  pfad: string,
): Promise<{ geschrieben: [string, Record<string, unknown>][] }> {
  const daten: Teile = structuredClone(regalTeile(JETZT));
  const geschrieben: [string, Record<string, unknown>][] = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        geschrieben.push([tabelle, z]);
        (daten[tabelle] ??= []).push({ storniert_am: null, aktiv: true, ...z });
      }
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  return { geschrieben };
}

const rad = (page: Page, name: string) => page.getByRole('listbox', { name, exact: true });
const gewaehlt = (r: Locator) => r.getByRole('option', { selected: true });

/** Abstand zwischen der Mitte der gewählten Option und der Mitte des Rads in px */
const ausDerMitte = (r: Locator) =>
  r.evaluate((el) => {
    const o = el.querySelector('[aria-selected="true"]');
    if (!o) return Infinity;
    const a = el.getBoundingClientRect();
    const b = o.getBoundingClientRect();
    return Math.abs(a.top + a.height / 2 - (b.top + b.height / 2));
  });

/** Rad drehen wie mit dem Finger: Scrollposition neben eine Zeile setzen, Einrasten übernimmt den Rest */
const drehen = (r: Locator, zeile: number) =>
  r.evaluate((el, z) => {
    const h = el.querySelector<HTMLElement>('[role="option"]')?.offsetHeight ?? 0;
    el.scrollTo({ top: z * h + h / 3 });
  }, zeile);

test('ZW-AK2 Anlage anlegen: Licht ab und bis mit den Drehreglern wählen (Antippen, Pfeil, Drehen) und speichern', async ({
  page,
}) => {
  const { geschrieben } = await mitDaten(page, '/#/anlage/neu');
  await expect(page.getByRole('heading', { name: 'Anlage anlegen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel('Name', { exact: true }).fill('Zweites Regal');
  await page.getByLabel('Kürzel', { exact: true }).fill('T');

  // Start 06:00 bis 21:00; Räder mit zugänglichen Namen, Stunden 00 bis 23, Minuten im Schritt 5
  const abStunde = rad(page, 'Licht ab Stunde');
  const abMinute = rad(page, 'Licht ab Minute');
  const bisStunde = rad(page, 'Licht bis Stunde');
  const bisMinute = rad(page, 'Licht bis Minute');
  await expect(gewaehlt(abStunde)).toHaveText('06');
  await expect(gewaehlt(abMinute)).toHaveText('00');
  await expect(gewaehlt(bisStunde)).toHaveText('21');
  await expect(abStunde.getByRole('option')).toHaveCount(24);
  await expect(abMinute.getByRole('option')).toHaveText(
    Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')),
  );
  await expect.poll(() => ausDerMitte(bisStunde)).toBeLessThan(2);

  // Antippen wählt und dreht den Wert in die Mitte
  await abStunde.getByRole('option', { name: '07', exact: true }).click();
  await expect(gewaehlt(abStunde)).toHaveText('07');
  await expect.poll(() => ausDerMitte(abStunde)).toBeLessThan(2);
  // Pfeil ab zweimal: 00 → 10
  await abMinute.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(gewaehlt(abMinute)).toHaveText('10');
  // Drehen: das Rad rastet ein, der Wert in der Mitte ist gewählt
  await drehen(bisStunde, 22);
  await expect(gewaehlt(bisStunde)).toHaveText('22');
  await drehen(bisMinute, 6);
  await expect(gewaehlt(bisMinute)).toHaveText('30');
  await expect.poll(() => ausDerMitte(bisMinute)).toBeLessThan(2);
  // die Stunde bleibt beim Ändern der Minute
  await expect(gewaehlt(abStunde)).toHaveText('07');

  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=T$/);
  const anlage = geschrieben.find(([t]) => t === 'anlage')?.[1];
  expect(anlage).toMatchObject({ kuerzel: 'T', licht_von: '07:10:00', licht_bis: '22:30:00' });
});

test('ZW-AK4 Anlage anlegen bei 360 dp: Licht ab und Licht bis nebeneinander, Seite höchstens 360 dp breit', async ({
  page,
}) => {
  await mitDaten(page, '/#/anlage/neu');
  const ab = page.getByRole('group', { name: 'Licht ab', exact: true });
  const bis = page.getByRole('group', { name: 'Licht bis', exact: true });
  await expect(ab).toBeVisible({ timeout: 15_000 });
  expect(page.viewportSize()?.width).toBe(360);
  const a = await ab.boundingBox();
  const b = await bis.boundingBox();
  expect(Math.abs((a?.y ?? 0) - (b?.y ?? 1))).toBeLessThan(1);
  expect((b?.x ?? 0) + (b?.width ?? 0)).toBeLessThanOrEqual(360);
  // jede Zeile mindestens 48 dp hoch, jedes Rad mindestens 48 dp breit (Schreibtisch)
  for (const name of ['Licht ab Stunde', 'Licht ab Minute', 'Licht bis Stunde', 'Licht bis Minute']) {
    const r = await rad(page, name).boundingBox();
    expect(r?.width ?? 0, name).toBeGreaterThanOrEqual(48);
    const zeile = await gewaehlt(rad(page, name)).boundingBox();
    expect(zeile?.height ?? 0, name).toBeGreaterThanOrEqual(48);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

/** Zeile in der Mitte des Rads (Scrollposition / Zeilenhöhe) */
const zeileInDerMitte = (r: Locator) =>
  r.evaluate((el) => {
    const h = el.querySelector<HTMLElement>('.hv-drehrad-wert')?.offsetHeight ?? 1;
    return Math.round(el.scrollTop / h);
  });

test('ZR-AK3 Anlage anlegen: Licht bis 24:00, Räder drehen durch, Ebenen und Zahlen per Rad, ohne Karbonathärte', async ({
  page,
}) => {
  const { geschrieben } = await mitDaten(page, '/#/anlage/neu');
  await expect(page.getByRole('heading', { name: 'Anlage anlegen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel('Name', { exact: true }).fill('Zweites Regal');
  await page.getByLabel('Kürzel', { exact: true }).fill('T');
  await expect(page.getByText('Karbonathärte')).toHaveCount(0);

  // Licht bis: Stunden 00 bis 24; 24 wählt Minute 00, eine andere Minute dreht dorthin zurück
  const bisStunde = rad(page, 'Licht bis Stunde');
  const bisMinute = rad(page, 'Licht bis Minute');
  await expect(bisStunde.getByRole('option')).toHaveCount(25);
  await bisMinute.getByRole('option', { name: '30', exact: true }).click();
  await expect(gewaehlt(bisMinute)).toHaveText('30');
  await bisStunde.getByRole('option', { name: '24', exact: true }).click();
  await expect(gewaehlt(bisStunde)).toHaveText('24');
  await expect(gewaehlt(bisMinute)).toHaveText('00');
  await expect.poll(() => ausDerMitte(bisMinute)).toBeLessThan(2);
  await drehen(bisMinute, 24 + 3);
  await expect.poll(() => ausDerMitte(bisMinute)).toBeLessThan(2);
  await expect(gewaehlt(bisMinute)).toHaveText('00');
  // Licht ab höchstens 23
  await expect(rad(page, 'Licht ab Stunde').getByRole('option')).toHaveCount(24);

  // durchdrehen mit Pfeiltasten: Pos1 → 00, Pfeil auf → 23; Ende → 55, Pfeil ab → 00
  const abStunde = rad(page, 'Licht ab Stunde');
  const abMinute = rad(page, 'Licht ab Minute');
  await abStunde.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowUp');
  await expect(gewaehlt(abStunde)).toHaveText('23');
  await abMinute.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowDown');
  await expect(gewaehlt(abMinute)).toHaveText('00');
  await expect.poll(() => ausDerMitte(abMinute)).toBeLessThan(2);
  // durchdrehen beim Drehen: eine Zeile über 00 der mittleren Kopie (Zeile 24 von 5 × 12) steht 55
  await drehen(abMinute, 23);
  await expect(gewaehlt(abMinute)).toHaveText('55');
  // danach steht das Rad wieder in der mittleren Kopie, es dreht in beide Richtungen weiter
  await expect.poll(() => zeileInDerMitte(abMinute)).toBe(24 + 11);

  // Anzahl Ebenen und Zahlen der Ebene per Rad
  await rad(page, 'Anzahl Ebenen').getByRole('option', { name: '2', exact: true }).click();
  await expect(page.getByRole('group', { name: /^Ebene \d$/ })).toHaveCount(2);
  const ebene1 = page.getByRole('group', { name: 'Ebene 1', exact: true });
  await ebene1
    .getByRole('listbox', { name: 'Lichtleisten' })
    .getByRole('option', { name: '6', exact: true })
    .click();
  await ebene1
    .getByRole('listbox', { name: 'Lichtstunden' })
    .getByRole('option', { name: '15.5', exact: true })
    .click();
  const hoehe = ebene1.getByRole('listbox', { name: 'Nutzbare Höhe über dem Deckel' });
  await expect(gewaehlt(hoehe)).toHaveText('45');
  await hoehe.focus();
  await page.keyboard.press('ArrowDown');
  await expect(gewaehlt(hoehe)).toHaveText('46');

  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=T$/);
  const anlage = geschrieben.find(([t]) => t === 'anlage')?.[1];
  expect(anlage).toMatchObject({
    kuerzel: 'T',
    licht_von: '23:55:00',
    licht_bis: '24:00:00',
    karbonathaerte_dh: null,
  });
  const bereiche = geschrieben.filter(([t]) => t === 'bereich').map(([, z]) => z);
  expect(bereiche).toHaveLength(2);
  expect(bereiche[0]).toMatchObject({
    nummer: 1,
    lichtleisten: 6,
    lichtstunden: 15.5,
    nutzbare_hoehe_mm: 460,
  });
});

test('ZR-AK4 Anlage anlegen bei 360 dp: jedes Rad höchstens 160 dp breit, daneben Platz zum Scrollen, Seite ≤ 360 dp', async ({
  page,
}) => {
  await mitDaten(page, '/#/anlage/neu');
  await expect(rad(page, 'Anzahl Ebenen')).toBeVisible({ timeout: 15_000 });
  const breiten = await page
    .locator('.hv-drehrad-rahmen')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  // Licht ab, Licht bis, Anzahl Ebenen und je Ebene 3 Räder (4 Ebenen)
  expect(breiten).toHaveLength(3 + 4 * 3);
  for (const b of breiten) expect(b).toBeLessThanOrEqual(160);
  // einzelne Räder (Anzahl Ebenen und die Höhe jeder Ebene) lassen rechts mindestens 100 dp frei (Prüfer Befund 2)
  const rechterRand = await page
    .locator('.hv-drehrad-einzeln')
    .evaluateAll((els) =>
      els.filter((el) => !el.closest('.hv-anlage-zweispaltig')).map((el) => el.getBoundingClientRect().right),
    );
  expect(rechterRand).toHaveLength(1 + 4);
  for (const rechts of rechterRand) expect(360 - rechts).toBeGreaterThanOrEqual(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
