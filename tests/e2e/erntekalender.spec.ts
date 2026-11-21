// Erntekalender, Leiste mit «Ernte», «Säen» in Saatgut (Issue #232, Plan 232 Testliste E2E; Konzept v1.8 6.1 UC15, 6.3,
// 10, 17; Entscheide 0025, 0026). REST nachgebildet (tests/e2e/rest.ts) wie tests/e2e/leiste.spec.ts, Daten aus
// tests/fixtures/ernte.ts (Sätze 90 bis 96, Uhr ERNTE_JETZT = Do 18.3.2027 09:00 Zürich), 360 × 640 aus der
// Konfiguration, Uhr mit page.clock.setFixedTime(). Ohne Personendaten.
//
// Erwartete Oberfläche (Vertrag nach Plan 232 «Maske» und «Design System», wo offen vom Testentwickler festgelegt):
// - Leiste <nav class="hv-tabbar" aria-label="Hauptnavigation"> mit genau den Links «Heute», «Anlagen», «Ernte»,
//   «Saatgut», «Mehr» in dieser Folge; aktives Ziel aria-current="page"; Rahmen mit data-leiste="<ziel>".
// - #/ernte und #/ernte/<satz>: main mit data-density="regal", h1 «Erntekalender», im Kopf «… · n Sätze»; Liste mit je
//   einem button.hv-kalender-zeile je aktivem Satz (aria-pressed, mindestens 68 px hoch). Zugänglicher Name der Zeile
//   beginnt mit «<Art> <Sorte>, <Ort>,» (z. B. «Salat Eissalat, R-2.3, …»).
// - Phasenbalken je Zeile: Abschnitte .hv-phasenbalken-abschnitt mit data-phase=<Phasenschlüssel> und dem Buchstaben
//   K/A/W/B/F im DOM (Text oder title); Prognose zusätzlich .hv-phasenbalken-prognose mit background-image
//   repeating-linear-gradient, bestätigte Abschnitte ohne; Ernte-Marken .hv-phasenbalken-marke.
// - Tipp auf eine Zeile: Adresse #/ernte/<satz> per location.replace (kein neuer Eintrag im Verlauf), Zeile
//   aria-pressed="true"; Feld section.hv-kalender-feld mit aria-label «Termine des Satzes», Titel «<Art> <Sorte>», Text
//   mit «Ernte», Knöpfe «Feld schliessen» und Link «Pflanze öffnen» (#/pflanze/<pflanzung>?von=ernte). Erneuter Tipp
//   oder «Feld schliessen» → #/ernte ohne Feld. Die gewählte Zeile steht beim Öffnen über dem Feld im Bild.
// - Pflanze mit ?von=ernte: h1 «Pflanze», Link «Zurück» nach #/ernte/<satz>.
// - Leer: Text «Kein Satz aktiv. Säen findest du unter Saatgut.» mit Link «Saatgut öffnen» nach #/saatgut.
// - Saatgut (#/saatgut): erster Link oder Knopf in main ist der Link «Säen» (hv-btn hv-btn-primary hv-btn-block) über
//   «Tüte erfassen»; er öffnet #/saeen, Schritt 1 von 3, dort ist «Saatgut» aktiv.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { EISSALAT, ernteTeile, ERNTE_JETZT, SATZ, SATZ_VOR } from '../fixtures/ernte.ts';
import type { Teile } from '../fixtures/regal.ts';
import { saatTeile } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const J = ERNTE_JETZT;
const ZIELE = ['Heute', 'Anlagen', 'Ernte', 'Saatgut', 'Mehr'] as const;
const BUCHSTABE: Readonly<Record<string, string>> = {
  keimung: 'K',
  anzucht: 'A',
  wachstum: 'W',
  bluete: 'B',
  fruchtbildung_reife: 'F',
};

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

/** ernteTeile() mit dem Thema der Einstellung */
function mitThema(thema: 'hell' | 'dunkel'): Teile {
  const t = ernteTeile();
  for (const e of t['einstellung'] ?? []) e['thema'] = thema;
  return t;
}

const leiste = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });
const ziel = (page: Page, name: (typeof ZIELE)[number]) =>
  leiste(page).getByRole('link', { name, exact: true });
const rahmen = (page: Page) => page.locator('[data-leiste]');
const kalenderTitel = (page: Page) => page.getByRole('heading', { name: 'Erntekalender', level: 1 });
const feld = (page: Page) => page.getByRole('region', { name: 'Termine des Satzes' });
const zeileEissalat = (page: Page) => page.getByRole('button', { name: /^Salat Eissalat, R-2\.3,/ });
const zeilen = (page: Page) => page.locator('button.hv-kalender-zeile');
const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function box(ort: Locator) {
  const b = await ort.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return b;
}

/** genau dieses Ziel aktiv, alle anderen nicht */
async function aktiv(page: Page, name: (typeof ZIELE)[number], data: string): Promise<void> {
  await expect(leiste(page)).toBeVisible({ timeout: 15_000 });
  await expect(ziel(page, name)).toHaveAttribute('aria-current', 'page');
  await expect(leiste(page).locator('[aria-current="page"]')).toHaveCount(1);
  await expect(rahmen(page)).toHaveAttribute('data-leiste', data);
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
}

/** Mitte des Elements nicht vom Feld oder der Leiste verdeckt */
async function nichtVerdeckt(ort: Locator): Promise<boolean> {
  return ort.evaluate((e) => {
    const b = e.getBoundingClientRect();
    const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return t !== null && e.contains(t);
  });
}

/** Feld zum Eissalat offen, Zeile gewählt und über dem Feld sichtbar */
async function feldEissalat(page: Page): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`#/ernte/${esc(SATZ.eissalat)}$`));
  await expect(feld(page)).toBeVisible({ timeout: 15_000 });
  await expect(feld(page)).toContainText('Salat Eissalat');
  await expect(feld(page)).toContainText('Ernte');
  await expect(zeileEissalat(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(zeileEissalat(page)).toBeInViewport();
  await page.waitForTimeout(200);
  expect(await nichtVerdeckt(zeileEissalat(page)), 'gewählte Zeile über dem Feld').toBe(true);
}

// ---------------------------------------------------------------------
// UC15-AK6 Leiste und Säen in Saatgut
// ---------------------------------------------------------------------

test('UC15-AK6 Leiste zeigt Heute, Anlagen, Ernte, Saatgut, Mehr; «Ernte» öffnet #/ernte mit h1 «Erntekalender», «Ernte» aktiv', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), '/#/heute', J);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  const links = leiste(page).getByRole('link');
  await expect(links).toHaveCount(5);
  for (const [i, wort] of ZIELE.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(wort);
    await expect(links.nth(i)).toContainText(wort);
  }
  await expect(leiste(page).getByRole('link', { name: 'Säen' })).toHaveCount(0);

  await ziel(page, 'Ernte').click();
  await expect(page).toHaveURL(/#\/ernte$/);
  await expect(kalenderTitel(page)).toBeVisible();
  await aktiv(page, 'Ernte', 'ernte');
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  // je aktivem Satz (90 bis 96) eine Zeile, Zahl im Kopf
  await expect(zeilen(page)).toHaveCount(7);
  await expect(page.locator('main')).toContainText('7 Sätze');
  await expect(feld(page)).toHaveCount(0);
  await ohneWaagrechtesScrollen(page);
});

test('UC15-AK6 «Saatgut» zeigt «Säen» als oberste Taste (primär, volle Breite) vor «Tüte erfassen»; sie öffnet Säen Schritt 1 mit «Saatgut» aktiv', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), '/#/heute', J);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await ziel(page, 'Saatgut').click();
  await expect(page).toHaveURL(/#\/saatgut$/);
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
  await aktiv(page, 'Saatgut', 'saatgut');

  const main = page.locator('main');
  const saeen = main.getByRole('link', { name: 'Säen', exact: true });
  await expect(saeen).toHaveCount(1);
  await expect(saeen).toBeInViewport({ ratio: 1 });
  // erste bedienbare Taste in main
  const erste = main.locator('a, button').first();
  await expect(erste).toHaveAccessibleName('Säen');
  await expect(saeen).toHaveClass(/(^|\s)hv-btn-primary(\s|$)/);
  await expect(saeen).toHaveClass(/(^|\s)hv-btn-block(\s|$)/);
  const tuete = knopf(main, 'Tüte erfassen');
  await expect(tuete).toBeVisible();
  await expect(tuete).not.toHaveClass(/hv-btn-primary/);
  expect((await box(saeen)).y, '«Säen» über «Tüte erfassen»').toBeLessThan((await box(tuete)).y);
  expect((await box(saeen)).height).toBeGreaterThanOrEqual(68);
  await ohneWaagrechtesScrollen(page);

  await saeen.click();
  await expect(page).toHaveURL(/#\/saeen$/);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await aktiv(page, 'Saatgut', 'saatgut');
});

test('UC15-AK6 ohne aktiven Satz: Leer-Text mit Link «Saatgut öffnen»', async ({ page }) => {
  await oeffnen(page, saatTeile(J, { ohneSatzIn23: true }), '/#/ernte', J);
  await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });
  await aktiv(page, 'Ernte', 'ernte');
  await expect(page.getByText('Kein Satz aktiv. Säen findest du unter Saatgut.')).toBeVisible();
  await expect(zeilen(page)).toHaveCount(0);
  await page.locator('main').getByRole('link', { name: 'Saatgut öffnen', exact: true }).click();
  await expect(page).toHaveURL(/#\/saatgut$/);
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
});

// ---------------------------------------------------------------------
// UC15-AK7 Tipperzahl, Feld, Pflanze und zurück
// ---------------------------------------------------------------------

for (const weg of ['Zurück', 'Zurück-Taste des Browsers'] as const) {
  test(`UC15-AK7 von Heute 2 Tipper bis zum Feld, 3 bis zur Pflanze; ${weg} führt in den Kalender mit derselben Auswahl`, async ({
    page,
  }) => {
    await oeffnen(page, ernteTeile(), '/#/heute', J);
    await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
    let tipper = 0;
    const tipp = async (ort: Locator) => {
      tipper += 1;
      await ort.click();
    };

    await tipp(ziel(page, 'Ernte'));
    await expect(kalenderTitel(page)).toBeVisible();
    await expect(zeileEissalat(page)).toHaveAttribute('aria-pressed', 'false');
    await tipp(zeileEissalat(page));
    await feldEissalat(page);
    expect(tipper, 'Tipper bis zum Feld').toBe(2);

    await tipp(feld(page).getByRole('link', { name: 'Pflanze öffnen', exact: true }));
    await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#/pflanze/${esc(EISSALAT)}\\?von=ernte$`));
    expect(tipper, 'Tipper bis zur Pflanze').toBe(3);

    if (weg === 'Zurück') await page.getByRole('link', { name: 'Zurück', exact: true }).click();
    else await page.goBack();
    await expect(kalenderTitel(page)).toBeVisible();
    await feldEissalat(page);
    await aktiv(page, 'Ernte', 'ernte');
  });
}

test('UC15-AK7 «Feld schliessen» und erneuter Tipp schliessen das Feld (#/ernte); die Auswahl legt keinen Eintrag im Verlauf an', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), '/#/heute', J);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await ziel(page, 'Ernte').click();
  await expect(kalenderTitel(page)).toBeVisible();
  const verlauf = () => page.evaluate(() => window.history.length);
  const vorher = await verlauf();

  await zeileEissalat(page).click();
  await feldEissalat(page);
  await feld(page).getByRole('button', { name: 'Feld schliessen', exact: true }).click();
  await expect(page).toHaveURL(/#\/ernte$/);
  await expect(feld(page)).toHaveCount(0);
  await expect(zeileEissalat(page)).toHaveAttribute('aria-pressed', 'false');

  // erneuter Tipp auf die gewählte Zeile schliesst ebenfalls
  await zeileEissalat(page).click();
  await feldEissalat(page);
  await zeileEissalat(page).click();
  await expect(page).toHaveURL(/#\/ernte$/);
  await expect(feld(page)).toHaveCount(0);

  expect(await verlauf(), 'kein zusätzlicher Eintrag im Verlauf').toBe(vorher);
  await page.goBack();
  await expect(page).toHaveURL(/#\/heute$/);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
});

test('UC15-AK7 #/ernte/<satz> direkt geöffnet zeigt das Feld; eine unbekannte Auswahl zeigt den Kalender ohne Feld', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), `/#/ernte/${SATZ.eissalat}`, J);
  await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });
  await feldEissalat(page);
  await page.evaluate(() => {
    window.location.hash = '#/ernte/27000000-0000-4000-8000-000000000999';
  });
  await expect(kalenderTitel(page)).toBeVisible();
  await expect(feld(page)).toHaveCount(0);
  await expect(zeilen(page)).toHaveCount(7);
});

// ---------------------------------------------------------------------
// UC15-AK8 Masse, axe, Buchstaben und Schraffur
// ---------------------------------------------------------------------

for (const thema of ['hell', 'dunkel'] as const) {
  test(`UC15-AK8 360 × 640 (${thema}): kein seitliches Scrollen, Tippflächen 68 dp, axe ohne Befund, ohne und mit offenem Feld`, async ({
    page,
  }) => {
    await oeffnen(page, mitThema(thema), '/#/ernte', J);
    await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('html')).toHaveAttribute('data-theme', thema === 'hell' ? 'light' : 'dark');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pruefen = async (wann: string) => {
      await ohneWaagrechtesScrollen(page);
      // jede Zeile, jeder Knopf und Link in main und im Feld (ohne die Leiste) mindestens 68 px hoch
      const masse = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            'main a, main button, main [role="button"], .hv-kalender-feld a, .hv-kalender-feld button',
          ),
        ]
          .filter((e) => !e.closest('nav.hv-tabbar'))
          .map((e) => {
            const b = e.getBoundingClientRect();
            return {
              text: (e.textContent ?? '').trim().slice(0, 40),
              hoehe: b.height,
              sichtbar: b.width > 0 && b.height > 0,
              passt: e.scrollWidth <= e.clientWidth + 1,
            };
          })
          .filter((m) => m.sichtbar),
      );
      expect(masse.length, `${wann}: Tippflächen`).toBeGreaterThan(0);
      for (const m of masse) {
        expect(m.hoehe, `${wann}: «${m.text}» mindestens 68 px`).toBeGreaterThanOrEqual(68);
        expect(m.passt, `${wann}: «${m.text}» ohne Textüberstand`).toBe(true);
      }
      const ergebnis = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        ergebnis.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        `${wann}: axe (${thema})`,
      ).toEqual([]);
    };

    await pruefen('ohne Feld');
    await zeileEissalat(page).click();
    await feldEissalat(page);
    for (const name of ['Feld schliessen', 'Pflanze öffnen']) {
      const k = knopf(feld(page), name);
      await expect(k, name).toBeVisible();
      const b = await box(k);
      expect(b.x, name).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, `${name} rechter Rand`).toBeLessThanOrEqual(360);
    }
    await pruefen('mit Feld');
  });
}

test('UC15-AK8 jeder Abschnitt trägt seinen Buchstaben passend zu data-phase; Prognosen schraffiert, bestätigte Abschnitte nicht', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), '/#/ernte', J);
  await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });
  const abschnitte = await page.locator('.hv-phasenbalken-abschnitt').evaluateAll((liste) =>
    liste.map((e) => ({
      phase: e.getAttribute('data-phase') ?? '',
      text: `${e.textContent ?? ''} ${e.getAttribute('title') ?? ''}`,
      prognose: e.classList.contains('hv-phasenbalken-prognose'),
      bild: getComputedStyle(e).backgroundImage,
    })),
  );
  expect(abschnitte.length).toBeGreaterThanOrEqual(7);
  for (const a of abschnitte) {
    const b = BUCHSTABE[a.phase];
    expect(b, `bekannte Phase «${a.phase}»`).toBeDefined();
    expect(a.text, `Buchstabe ${String(b)} für ${a.phase}`).toContain(String(b));
    if (a.prognose) expect(a.bild, `Prognose ${a.phase} schraffiert`).toContain('repeating-linear-gradient');
    else expect(a.bild, `bestätigt ${a.phase} ohne Schraffur`).not.toContain('repeating-linear-gradient');
  }
  // Lollo Rossa hat bestätigtes und prognostiziertes Wachstum, Eichblatt nur Prognosen
  expect(abschnitte.some((a) => a.prognose)).toBe(true);
  expect(abschnitte.some((a) => !a.prognose)).toBe(true);
  // Ernte-Marke Eichblatt 5.5. im Fenster
  await expect(page.locator('.hv-phasenbalken-marke').first()).toBeAttached();
  await expect(page.locator('.hv-phasenbalken-heute').first()).toBeAttached();
});

// Prüfer Runde 1, Befund 1: Ein Erntetermin vor dem Fenster ist ein Termin, kein «Termine noch offen». Am linken Rand
// steht dann der Hinweis .hv-phasenbalken-frueher «← Ernte seit <T.M.>».
test('UC15-AK3 Erntetermin vor dem Fenster: Eissalat zeigt «← Ernte seit 4.3.» statt «Termine noch offen»; Eichblatt mit Marke 5.5. ebenfalls ohne', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile(), '/#/ernte', J);
  await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });

  const eissalat = zeileEissalat(page);
  await expect(eissalat).toHaveCount(1);
  await expect(eissalat.locator('.hv-phasenbalken-offen')).toHaveCount(0);
  const frueher = eissalat.locator('.hv-phasenbalken-frueher');
  await expect(frueher).toHaveCount(1);
  await expect(frueher).toHaveText('← Ernte seit 4.3.');
  await expect(eissalat).not.toContainText('Termine noch offen');

  const eichblatt = page.getByRole('button', { name: /^Salat Eichblatt, R-A2,/ });
  await expect(eichblatt).toHaveCount(1);
  await expect(eichblatt.locator('.hv-phasenbalken-offen')).toHaveCount(0);
  await expect(eichblatt.locator('.hv-phasenbalken-marke')).toHaveCount(1);
  await expect(eichblatt.locator('.hv-phasenbalken-marke')).toContainText('5.5.');
});

// ---------------------------------------------------------------------
// UC15-AK13 (Issue #254, Plan 254): «Ernte ab» bei Mehrfachernte vor dem Umsetzen
// ernteTeile({ vorUmsetzen: true }): Petersilie Mooskrause dauerkultur_blatt (Satz 99) in A3, gesät 15.2., Anzucht
// bestätigt 1.3., ohne Reservierung → Wachstum 29.3., Ernte ab 29.3. + 28 = Mo 26.4., Ende 15.2. + 180 = Sa 14.8.
// «Ernte ab TT.MM.» im Issue heisst in der App «Ernte ab 26.4.» (tagKurz(), ohne führende Null; Plan 254 A9).
// ---------------------------------------------------------------------

test('UC15-AK13 Petersilie (Dauerkultur Blatt) in der Anzucht ohne Reservierung zeigt «Ernte ab 26.4.» statt «Ernte offen» und kein «Termine noch offen»', async ({
  page,
}) => {
  await oeffnen(page, ernteTeile({ vorUmsetzen: true }), '/#/ernte', J);
  await expect(kalenderTitel(page)).toBeVisible({ timeout: 15_000 });
  await expect(zeilen(page)).toHaveCount(10);

  const petersilie = page.getByRole('button', { name: /^Petersilie Mooskrause, R-A3,/ });
  await expect(petersilie).toHaveCount(1);
  // Kurzzeile im zugänglichen Namen
  const name = (await petersilie.getAttribute('aria-label')) ?? '';
  expect(name).toContain('Wachstum ab 29.3. · Ernte ab 26.4.');
  expect(name).not.toContain('Ernte offen');
  expect(name).not.toContain('Termine noch offen');
  // Marke im Fenster, kein Hinweis «Termine noch offen»
  const marke = petersilie.locator('.hv-phasenbalken-marke');
  await expect(marke).toHaveCount(1);
  await expect(marke).toContainText('26.4.');
  await expect(petersilie.locator('.hv-phasenbalken-offen')).toHaveCount(0);
  await expect(petersilie).not.toContainText('Termine noch offen');

  // Feld: Ernte ab Mo 26.4. (Prognose), Ende Sa 14.8.
  await petersilie.click();
  await expect(page).toHaveURL(new RegExp(`#/ernte/${esc(SATZ_VOR.petersilie)}$`));
  await expect(feld(page)).toBeVisible();
  await expect(feld(page)).toContainText('Petersilie Mooskrause');
  await expect(feld(page)).toContainText('ab Mo 26.4. (Prognose)');
  await expect(feld(page)).toContainText('Ende Sa 14.8.');
  await expect(feld(page)).not.toContainText('Termine noch offen');
  await ohneWaagrechtesScrollen(page);
});
