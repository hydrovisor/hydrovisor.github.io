// Usability Runde 2 (Issue #158, Plan 158; docs/entwurf/usability_befunde.md B11 bis B14). REST nachgebildet,
// Fixtures der E2E wie die Honor-Simulation (tests/honor/ablaeufe.spec.ts 04, 07, 10, 16). Der Textüberstand zeigt
// sich nur mit Mobil-Emulation wie am Honor (isMobile, Touch, Pixeldichte 3.5; Lehre aus #153).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  satzAnlegen,
} from '../fixtures/duplizieren.ts';
import { JETZT as MESS_JETZT, messTeile } from '../fixtures/messen.ts';
import { regalTeile, uid, type Teile } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { UMSETZ_FAELLIG, umsetzTeile } from '../fixtures/umsetzen.ts';
import { regelnImBrowser, schriftImBrowser, type Befund } from '../honor/regeln.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

async function oeffnen(
  page: Page,
  teile: Teile,
  pfad: string,
  jetzt: Date,
  nachrechnen: (t: Teile) => Teile = sichtenNachrechnen,
): Promise<void> {
  const daten = nachrechnen(structuredClone(teile));
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, jetzt);
      nachrechnen(daten);
    },
    (tabelle, clientId) => {
      stornoAufnehmen(daten, tabelle, clientId, jetzt);
      nachrechnen(daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
}

const knopf = (ort: Page | Locator, name: string): Locator =>
  ort
    .getByRole('link', { name, exact: true })
    .or(ort.getByRole('button', { name, exact: true }))
    .first();

/** erst mit der Schrift des Design Systems messen (die Ersatzschrift ist schmaler) */
async function schriftBereit(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(300);
}

/** Mängel der Bedienregeln der Honor-Simulation, als lesbare Zeilen */
async function maengel(page: Page, ohneScrollen = false): Promise<string[]> {
  const befunde: Befund[] = await page.evaluate(regelnImBrowser, { ohneScrollen, druckseite: false });
  return befunde.filter((b) => b.art === 'Mangel').map((b) => `${b.regel}: ${b.text}`);
}

async function textPasst(ort: Locator): Promise<void> {
  const [scroll, client] = await ort.evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(scroll, 'Text breiter als die Taste').toBeLessThanOrEqual(client);
}

function duplizierRegal(): Teile {
  // wie saeen-duplizieren.spec.ts regal(56, true) und Simulation 04
  const t = duplizierTeile(JETZT_W4);
  kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: 56 });
  satzAnlegen(t, {
    nr: 70,
    sorteId: SORTE.lollo,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    box: 'A1',
    samen: 3,
    schwaemme: 4,
  });
  pflanzungAnlegen(t, 70, 1, { topf: '2.3.1' });
  pflanzungAnlegen(t, 70, 2, { topf: '2.3.2' });
  for (const k of [3, 4]) pflanzungAnlegen(t, 70, k, { status: 'ueberzaehlig' });
  satzAnlegen(t, {
    nr: 71,
    sorteId: SORTE.eichblatt,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    schwaemme: 1,
  });
  pflanzungAnlegen(t, 71, 1, { topf: '2.3.3' });
  return t;
}

for (const hoehe of [640, 780]) {
  test.describe(`Honor-Profil 360 × ${hoehe}`, () => {
    test.use({
      viewport: { width: 360, height: hoehe },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3.5,
    });

    test(`U03-AK1 Säen Schritt 2 auf 360 × ${hoehe}: «Zurück», «Ziel später», «Weiter» ohne Textüberstand, 68 dp, innerhalb 360 dp`, async ({
      page,
    }) => {
      await oeffnen(page, duplizierRegal(), '/#/saeen', JETZT_W4);
      await knopf(page, 'Lollo Rossa vom 7.1. duplizieren').click();
      await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
      await schriftBereit(page);
      for (const name of ['Zurück', 'Ziel später', 'Weiter']) {
        const k = knopf(page, name);
        await textPasst(k);
        const b = await k.boundingBox();
        expect(b?.height ?? 0, name).toBeGreaterThanOrEqual(68);
        expect((b?.x ?? 0) + (b?.width ?? 999), name).toBeLessThanOrEqual(360);
      }
      expect(await maengel(page)).toEqual([]);
    });

    test(`U03-AK2 Messmaske auf 360 × ${hoehe} bei Systemschrift 130 %: Ziffernblock und Kacheln ohne Textüberstand, ohne Scrollen`, async ({
      page,
    }) => {
      await oeffnen(page, messTeile(), '/#/messen/R-2.3', MESS_JETZT);
      await expect(page.getByRole('button', { name: /^EC( |$)/ })).toBeVisible({ timeout: 15_000 });
      expect(await page.evaluate(schriftImBrowser, 1.3)).toBeGreaterThan(0);
      await schriftBereit(page);
      const tasten = page.getByRole('group', { name: 'Ziffernblock' }).getByRole('button');
      for (const k of await tasten.all()) if (await k.isVisible()) await textPasst(k);
      for (const name of [/^pH( |$)/, /^EC( |$)/, /^°C( |$)/])
        await textPasst(page.getByRole('button', { name }));
      // 640 dp: die Höhe bleibt wie in der Simulation eine Vorprobe (#94 am Honor), hier zählt nur die Breite
      expect(await maengel(page, hoehe === 780)).toEqual([]);
      // nach drei Werten mit Vorwert und Trend in jeder Kachel
      for (const folge of ['62', '125', '205'])
        for (const z of folge) {
          await page.getByRole('button', { name: `Ziffer ${z}`, exact: true }).click();
          await page.waitForTimeout(120);
        }
      await expect(page.locator('.hv-ergebniszone')).toBeVisible();
      for (const name of [/^pH( |$)/, /^EC( |$)/, /^°C( |$)/])
        await textPasst(page.getByRole('button', { name }));
      expect(await maengel(page, hoehe === 780)).toEqual([]);
    });

    test(`U03-AK3 Umsetzen, Bestätigung auf 360 × ${hoehe}: «Umsetzen bestätigen» und «Zurück» ohne Textüberstand`, async ({
      page,
    }) => {
      await oeffnen(
        page,
        umsetzTeile({ jetzt: UMSETZ_FAELLIG, reserve: false }),
        '/#/heute',
        UMSETZ_FAELLIG,
        (t) => umsetzSichtenNachrechnen(sichtenNachrechnen(t)),
      );
      const eintrag = page
        .getByRole('listitem')
        .filter({ hasText: 'Umsetzen' })
        .filter({ hasText: 'Lollo Rossa' });
      await knopf(eintrag, 'Wie geplant umsetzen').click();
      await expect(page.getByRole('heading', { level: 1, name: 'Umsetzen' })).toBeVisible();
      await schriftBereit(page);
      for (const name of ['Zurück', 'Umsetzen bestätigen']) {
        const k = knopf(page, name);
        await textPasst(k);
        const b = await k.boundingBox();
        expect(b?.height ?? 0, name).toBeGreaterThanOrEqual(68);
      }
      expect(await maengel(page)).toEqual([]);
    });
  });
}

test('U03-AK4 Notfallblatt: die waagrecht scrollbare Druckvorschau ist per Tastatur erreichbar, axe-core meldet kein «scrollable-region-focusable»', async ({
  page,
}) => {
  const jetzt = new Date('2026-12-10T08:00:00Z');
  const t = regalTeile(jetzt);
  t['einstellung'] = [
    {
      id: uid('31', 1),
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
  await oeffnen(page, t, '/#/notfallblatt', jetzt);
  const vorschau = page.locator('main .hv-druck-vorschau');
  await expect(vorschau).toBeVisible({ timeout: 15_000 });
  // die Vorschau ist breiter als 360 dp und scrollt waagrecht (A4-Blatt)
  const [scroll, client] = await vorschau.evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(scroll).toBeGreaterThan(client);
  const ergebnis = await new AxeBuilder({ page })
    .include('main')
    .withRules(['scrollable-region-focusable'])
    .analyze();
  expect(
    ergebnis.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
  // Name für Screenreader, damit der Fokus auf der Fläche angesagt wird
  await expect(page.getByRole('region', { name: 'Druckvorschau Notfallblatt' })).toBeVisible();
  await vorschau.focus();
  await expect(vorschau).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => vorschau.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
});
