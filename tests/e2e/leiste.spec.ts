// Leiste unten (Issue #212, Plan 212; Entscheid 0025; Konzept 6.3, 10, 17; 05_masken.md 3.1). REST nachgebildet
// (tests/e2e/rest.ts), Regal R aus den Fixtures der E2E (nur Anlage R, Indoor, keine Outdoor-Anlage); 360 × 640 aus
// der Konfiguration.
//
// Erwartete Oberfläche (Vertrag des Leads, Plan 212):
// - <nav class="hv-tabbar" aria-label="Hauptnavigation"> fest unten mit fünf Links «Heute», «Anlagen», «Säen»,
//   «Saatgut», «Mehr» (zugänglicher Name genau das Wort, Symbol aria-hidden); aktives Ziel aria-current="page",
//   fette Schrift (font-weight ≥ 700) und Balken oben (::before); jedes Ziel mindestens 68 px hoch.
// - Der Rahmen um die Maske trägt data-leiste="<ziel>" bzw. data-leiste="keine".
// - Heute ohne «Anlage öffnen», «Säen» (Kopf), «Info öffnen», «Einstellungen öffnen» und nav «Navigation»;
//   «Rundgang starten (n Orte)» in nav.hv-heute-fuss fest unten über der Leiste.
// - #/anlagen: h1 «Anlagen», group «Standort» mit «Indoor · n» und «Outdoor · m» (aria-pressed); Karte je Anlage mit
//   Name und Link «Anlage <K> öffnen»; Outdoor leer: «Noch keine Outdoor-Anlage», Link «Anlage anlegen».
// - #/mehr: h1 «Mehr», Links «Einstellungen», «Etiketten», «Vorlagen», «Push-Erinnerungen», «Notfallblatt»,
//   «Info und Version».
// - #/sorten leitet per location.replace auf #/saatgut; Säen ab Schritt 2, Messen, Ansatz, Neue Sorte und Gefäss
//   erfassen ohne Leiste.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { um as ansatzUm, ansatzTeile } from '../fixtures/ansatz.ts';
import { JETZT as MESS_JETZT, messTeile } from '../fixtures/messen.ts';
import { leeresRegal, type Teile } from '../fixtures/regal.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { saatTeile } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

const SAAT_JETZT = new Date('2027-01-07T08:00:00Z');
const ZIELE = ['Heute', 'Anlagen', 'Säen', 'Saatgut', 'Mehr'] as const;
const RUNDGANG = /^Rundgang starten \(\d+ Orte?\)/;

async function oeffnen(page: Page, teile: Teile, pfad: string, uhr: Date): Promise<void> {
  const daten = structuredClone(teile);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, uhr);
    },
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
}

const leiste = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });
const ziel = (page: Page, name: (typeof ZIELE)[number]) =>
  leiste(page).getByRole('link', { name, exact: true });
const rahmen = (page: Page) => page.locator('[data-leiste]');
const knopf = (ort: Page | Locator, name: RegExp | string): Locator =>
  ort.getByRole('link', { name }).or(ort.getByRole('button', { name }));

async function box(ort: Locator) {
  const b = await ort.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return b;
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
}

/** genau dieses Ziel aktiv, alle anderen nicht */
async function aktiv(page: Page, name: (typeof ZIELE)[number], data: string): Promise<void> {
  await expect(leiste(page)).toBeVisible({ timeout: 15_000 });
  await expect(ziel(page, name)).toHaveAttribute('aria-current', 'page');
  await expect(leiste(page).locator('[aria-current="page"]')).toHaveCount(1);
  await expect(rahmen(page)).toHaveAttribute('data-leiste', data);
}

/** keine Leiste im Rahmen */
async function ohneLeiste(page: Page): Promise<void> {
  await expect(rahmen(page)).toHaveAttribute('data-leiste', 'keine');
  await expect(leiste(page)).toHaveCount(0);
  await expect(page.locator('nav.hv-tabbar')).toHaveCount(0);
}

test('NV1-AK3 Heute auf 360 × 640: Leiste unten mit fünf Zielen, je 68 dp, Symbol und Wort; «Heute» aktiv mit Balken und fetter Schrift; keine Kopfknöpfe; kein waagrechtes Scrollen', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile(), '/#/heute', RUNDGANG_JETZT);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await aktiv(page, 'Heute', 'heute');

  // fünf Links in dieser Reihenfolge, Name genau das Wort
  const links = leiste(page).getByRole('link');
  await expect(links).toHaveCount(5);
  for (const [i, wort] of ZIELE.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(wort);
    await expect(links.nth(i)).toContainText(wort);
  }

  // fest unten: Unterkante am unteren Rand des Viewports, auch nach dem Scrollen
  const unten = async () => {
    const n = await box(leiste(page));
    expect(n.y + n.height, 'Leiste am unteren Rand').toBeGreaterThanOrEqual(640 - 1);
    expect(n.y + n.height, 'Leiste im Bild').toBeLessThanOrEqual(640 + 1);
  };
  await unten();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  await unten();
  expect(await leiste(page).evaluate((e) => getComputedStyle(e).position)).toBe('fixed');

  // je Ziel: 68 dp hoch, innerhalb von 360 dp, Symbol aria-hidden neben dem Wort, Text passt
  for (const wort of ZIELE) {
    const z = ziel(page, wort);
    const b = await box(z);
    expect(b.height, `${wort} mindestens 68 dp`).toBeGreaterThanOrEqual(68);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width, `${wort} rechter Rand`).toBeLessThanOrEqual(360);
    await expect(z.locator('[aria-hidden="true"]').first()).toBeAttached();
    expect(await z.locator('svg').count(), `${wort} mit Symbol`).toBeGreaterThanOrEqual(1);
    const [scroll, client] = await z.evaluate((e) => [e.scrollWidth, e.clientWidth]);
    expect(scroll, `${wort}: Text passt`).toBeLessThanOrEqual(client);
  }

  // aktiv nicht nur über Farbe: fette Schrift und Balken oben; inaktive dünner
  const stil = (z: Locator) =>
    z.evaluate((e) => {
      const balken = getComputedStyle(e, '::before');
      return {
        gewicht: Number(getComputedStyle(e.querySelector('.hv-tabbar-wort') ?? e).fontWeight),
        balken:
          balken.content !== 'none' &&
          balken.content !== 'normal' &&
          balken.display !== 'none' &&
          balken.visibility !== 'hidden' &&
          Number(balken.opacity) > 0,
      };
    });
  const heute = await stil(ziel(page, 'Heute'));
  expect(heute.gewicht, 'aktiv fett').toBeGreaterThanOrEqual(700);
  expect(heute.balken, 'aktiv mit Balken').toBe(true);
  for (const wort of ZIELE.slice(1)) {
    const s = await stil(ziel(page, wort));
    expect(s.gewicht, `${wort} inaktiv dünner`).toBeLessThan(heute.gewicht);
  }

  // Kopfknöpfe entfallen (Entscheid 0025)
  for (const name of ['Anlage öffnen', 'Info öffnen', 'Einstellungen öffnen'])
    await expect(knopf(page, name), name).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navigation', exact: true })).toHaveCount(0);
  // «Säen» nur noch als Ziel der Leiste
  await expect(knopf(page, /^Säen$/)).toHaveCount(1);
  await expect(ziel(page, 'Säen')).toHaveCount(1);
  await ohneWaagrechtesScrollen(page);
});

test('NV1-AK4 jedes Ziel öffnet seine Seite und ist dort aktiv: Anlagen, Säen (Schritt 1), Saatgut, Mehr und zurück zu Heute', async ({
  page,
}) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/heute', SAAT_JETZT);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await aktiv(page, 'Heute', 'heute');

  await ziel(page, 'Anlagen').click();
  await expect(page).toHaveURL(/#\/anlagen$/);
  await expect(page.getByRole('heading', { name: 'Anlagen', level: 1 })).toBeVisible();
  await aktiv(page, 'Anlagen', 'anlagen');

  await ziel(page, 'Säen').click();
  await expect(page).toHaveURL(/#\/saeen$/);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await aktiv(page, 'Säen', 'saeen');

  await ziel(page, 'Saatgut').click();
  await expect(page).toHaveURL(/#\/saatgut$/);
  await expect(page.getByRole('heading', { name: 'Sorten', level: 1 })).toBeVisible();
  await aktiv(page, 'Saatgut', 'saatgut');

  await ziel(page, 'Mehr').click();
  await expect(page).toHaveURL(/#\/mehr$/);
  await expect(page.getByRole('heading', { name: 'Mehr', level: 1 })).toBeVisible();
  await aktiv(page, 'Mehr', 'mehr');

  await ziel(page, 'Heute').click();
  await expect(page).toHaveURL(/#\/heute$/);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await aktiv(page, 'Heute', 'heute');
  await ohneWaagrechtesScrollen(page);
});

test('NV1-AK5 «Anlagen»: Wahl Indoor und Outdoor; Indoor mit «Anlage R öffnen» zur Anlage-Maske, Outdoor leer mit «Anlage anlegen»', async ({
  page,
}) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/heute', SAAT_JETZT);
  await ziel(page, 'Anlagen').click();
  await expect(page.getByRole('heading', { name: 'Anlagen', level: 1 })).toBeVisible({ timeout: 15_000 });

  const standort = page.getByRole('group', { name: 'Standort' });
  const indoor = standort.getByRole('button', { name: 'Indoor · 1', exact: true });
  const outdoor = standort.getByRole('button', { name: 'Outdoor · 0', exact: true });
  await expect(indoor).toHaveAttribute('aria-pressed', 'true');
  await expect(outdoor).toHaveAttribute('aria-pressed', 'false');

  // Indoor: Karte mit Name und Link zur bestehenden Anlage-Maske
  await expect(page.getByText('Indoor-Regal')).toBeVisible();
  await expect(page.getByText('Noch keine Outdoor-Anlage')).toHaveCount(0);
  await page.getByRole('link', { name: 'Anlage R öffnen', exact: true }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=R$/);
  await expect(page.getByRole('heading', { name: 'Anlage R', level: 1 })).toBeVisible();
  // die Anlage ist eine Unterseite ohne Leiste (Plan 212 A1)
  await ohneLeiste(page);

  // zurück: Outdoor ohne Anlage zeigt den leeren Zustand, die Wahl steht in der Adresse
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Anlagen', level: 1 })).toBeVisible();
  await outdoor.click();
  await expect(page).toHaveURL(/#\/anlagen\?standort=outdoor$/);
  await expect(outdoor).toHaveAttribute('aria-pressed', 'true');
  await expect(indoor).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Noch keine Outdoor-Anlage')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anlage R öffnen' })).toHaveCount(0);
  await aktiv(page, 'Anlagen', 'anlagen');
  await page.getByRole('link', { name: 'Anlage anlegen', exact: true }).click();
  await expect(page).toHaveURL(/#\/anlage\/neu$/);
  await expect(page.getByRole('heading', { name: 'Anlage anlegen', level: 1 })).toBeVisible();
  await ohneWaagrechtesScrollen(page);
});

test('NV1-AK5 #/anlagen?standort=outdoor öffnet direkt Outdoor', async ({ page }) => {
  await oeffnen(
    page,
    saatTeile(SAAT_JETZT, { ohneSatzIn23: true }),
    '/#/anlagen?standort=outdoor',
    SAAT_JETZT,
  );
  await expect(page.getByRole('heading', { name: 'Anlagen', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole('group', { name: 'Standort' }).getByRole('button', { name: 'Outdoor · 0', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Noch keine Outdoor-Anlage')).toBeVisible();
  await aktiv(page, 'Anlagen', 'anlagen');
});

test('NV1-AK6 «Mehr» listet Einstellungen, Etiketten, Vorlagen, Push, Notfallblatt und Info; jeder Eintrag öffnet seine Maske', async ({
  page,
}) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/heute', SAAT_JETZT);
  await ziel(page, 'Mehr').click();
  await expect(page.getByRole('heading', { name: 'Mehr', level: 1 })).toBeVisible({ timeout: 15_000 });
  await aktiv(page, 'Mehr', 'mehr');

  const eintraege: [string, RegExp, (p: Page) => Locator][] = [
    [
      'Einstellungen',
      /#\/einstellungen$/,
      (p) => p.getByRole('heading', { name: 'Einstellungen', level: 1 }),
    ],
    ['Etiketten', /#\/etiketten$/, (p) => p.getByRole('heading', { name: 'Etiketten', level: 1 })],
    ['Vorlagen', /#\/vorlagen$/, (p) => p.getByRole('heading', { name: 'Vorlagen', level: 1 })],
    ['Push-Erinnerungen', /#\/push$/, (p) => p.getByRole('heading', { name: 'Push', level: 1 })],
    ['Notfallblatt', /#\/notfallblatt$/, (p) => p.getByRole('region', { name: 'Stand je Gefäss' })],
    ['Info und Version', /#\/info$/, (p) => p.getByRole('heading', { name: 'Info', level: 1 })],
  ];
  const main = page.locator('main');
  for (const [name] of eintraege)
    await expect(main.getByRole('link', { name, exact: true }), name).toBeVisible();

  for (const [name, adresse, maske] of eintraege) {
    await main.getByRole('link', { name, exact: true }).click();
    await expect(page, name).toHaveURL(adresse);
    await expect(maske(page), name).toBeVisible({ timeout: 15_000 });
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Mehr', level: 1 })).toBeVisible();
  }
  await ohneWaagrechtesScrollen(page);
});

test('NV1-AK7 Messen ohne Leiste, die Messmaske passt weiter ohne Scrollen auf 360 × 640', async ({
  page,
}) => {
  await oeffnen(page, messTeile(), '/#/messen/R-2.3', MESS_JETZT);
  await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
  await ohneLeiste(page);
  await expect(page.getByRole('button', { name: /^Speichern/ })).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(640);
});

test('NV1-AK7 Ansatz (Lösung wechseln) ohne Leiste', async ({ page }) => {
  await oeffnen(page, ansatzTeile(), '/#/ansatz/R-2.3', ansatzUm('18:30'));
  await expect(page.getByRole('button', { name: 'Zeile 0 abhaken', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await ohneLeiste(page);
});

test('NV1-AK7 Säen: Schritt 1 mit Leiste, ab Schritt 2 ohne', async ({ page }) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/saeen', SAAT_JETZT);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await aktiv(page, 'Säen', 'saeen');
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', undefined, { weiter: true });
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await ohneLeiste(page);
});

test('NV1-AK7 Neue Sorte ohne Leiste', async ({ page }) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/sorten/neu', SAAT_JETZT);
  await expect(page.getByRole('heading', { name: 'Neue Sorte', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/#\/sorten\/neu$/);
  await ohneLeiste(page);
});

test('NV1-AK7 Gefäss erfassen ohne Leiste', async ({ page }) => {
  await oeffnen(page, leeresRegal(), '/#/gefaess-neu?a=R', SAAT_JETZT);
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await ohneLeiste(page);
});

test('NV1-AK8 #/sorten leitet auf #/saatgut weiter, zeigt die Sorten-Liste, «Saatgut» ist aktiv', async ({
  page,
}) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/heute', SAAT_JETZT);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    window.location.hash = '#/sorten';
  });
  await expect(page).toHaveURL(/#\/saatgut$/);
  await expect(page.getByRole('heading', { name: 'Sorten', level: 1 })).toBeVisible();
  await aktiv(page, 'Saatgut', 'saatgut');
  // ersetzt, nicht angehängt: «Zurück» führt nach Heute, nicht wieder auf #/sorten
  await page.goBack();
  await expect(page).toHaveURL(/#\/heute$/);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
});

test('NV1-AK8 Direktaufruf von #/sorten landet auf #/saatgut', async ({ page }) => {
  await oeffnen(page, saatTeile(SAAT_JETZT, { ohneSatzIn23: true }), '/#/sorten', SAAT_JETZT);
  await expect(page).toHaveURL(/#\/saatgut$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Sorten', level: 1 })).toBeVisible();
  await aktiv(page, 'Saatgut', 'saatgut');
});

test('NV1-AK9 Heute: «Rundgang starten» ganz sichtbar über der Leiste, nichts liegt verdeckt darunter', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile(), '/#/heute', RUNDGANG_JETZT);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const rundgang = knopf(page.locator('nav.hv-heute-fuss'), RUNDGANG);
  await expect(rundgang).toBeInViewport({ ratio: 1 });
  const r = await box(rundgang);
  const fuss = await box(page.locator('nav.hv-heute-fuss'));
  const n = await box(leiste(page));
  expect(fuss.y + fuss.height, 'Fuss endet über der Leiste').toBeLessThanOrEqual(n.y + 0.5);
  expect(r.y + r.height, 'Rundgang starten über der Leiste').toBeLessThanOrEqual(n.y + 0.5);
  expect(r.height).toBeGreaterThanOrEqual(68);

  // Mitte von «Rundgang starten» und jedes Ziels der Leiste trifft das Element selbst
  const getroffen = (ort: Locator) =>
    ort.evaluate((e) => {
      const b = e.getBoundingClientRect();
      const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return t !== null && e.contains(t);
    });
  expect(await getroffen(rundgang), 'Rundgang starten nicht verdeckt').toBe(true);
  for (const wort of ZIELE) expect(await getroffen(ziel(page, wort)), `${wort} nicht verdeckt`).toBe(true);

  // ganz unten gescrollt: kein bedienbares Element der Seite liegt unter Fuss oder Leiste
  const pruefen = () =>
    page.evaluate(() => {
      const fest = [...document.querySelectorAll('.hv-heute-fuss, nav.hv-tabbar')];
      const drin = (e: Element | null) => e !== null && fest.some((f) => f.contains(e));
      const ziele = [...document.querySelectorAll('main a, main button, main [role="button"]')].filter(
        (e) => !drin(e),
      );
      let geprueft = 0;
      for (const e of ziele) {
        const b = e.getBoundingClientRect();
        if (b.width === 0 || b.height === 0 || b.bottom <= 0 || b.top >= window.innerHeight) continue;
        for (const y of [b.top + 2, b.bottom - 2]) {
          if (y < 0 || y > window.innerHeight) continue;
          if (drin(document.elementFromPoint(b.left + b.width / 2, y)))
            throw new Error(
              `«${(e.textContent ?? '').trim().slice(0, 40)}» verdeckt bei y = ${String(Math.round(y))}`,
            );
        }
        geprueft += 1;
      }
      return geprueft;
    });
  expect(await pruefen()).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  expect(await pruefen()).toBeGreaterThan(0);
  await expect(knopf(page, 'Stromausfall erfassen')).toBeInViewport({ ratio: 1 });
  await ohneWaagrechtesScrollen(page);
});
