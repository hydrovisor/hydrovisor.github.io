// Rundgang am Regal und Heute mit Ortskarten (Plan 30 Testliste; Rundgang-AK1a, AK1b, AK1c; UC8 Ablauf 1 bis 3
// und 8; R5.2; Konzept 6.2, 11.4 Z. 869; 05_masken.md 3.1 bis 3.5). REST nachgebildet (tests/e2e/rest.ts), Sichten
// mit sichtenNachrechnen() nach jedem Schreiben; Regal R aus tests/fixtures/rundgang.ts; feste Uhr Di 12.1.2027
// 09:00 Zürich; 360 × 640 aus der Konfiguration.
//
// Zählung wie anzucht-ablauf.spec.ts: jede Berührung über tipp(), Ziffern eingeschlossen; automatische Übergänge
// (Kennung 1 s) zählen nicht (Glossar «Berührung»). Gezählt wird je Gefäss ab dem Erscheinen der Kurzprüfung seiner
// Ebene bis zum Erscheinen des nächsten Schritts (Plan 30 A7); «Rundgang starten» zählt nicht.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 30 offen ist):
// - Heute: Knopf oder Link «Rundgang starten (n Orte)» und «Stromausfall erfassen»; Ortskarten als
//   <section aria-label="R-1.1"> mit den bisherigen Listeneinträgen «Titel · Code»; laufender Rundgang in «Laufende
//   Abläufe» mit «Rundgang läuft» und «Fortsetzen».
// - Rundgang #/rundgang/R, main[data-density="regal"]: Kurzprüfung mit «Ebene n · Pumpen laufen, Licht an, Lüfter
//   läuft» und dem Knopf «Alles ok»; Messmaske wie messen-maske.spec.ts (Kacheln «pH», «EC», «°C», Tasten «Ziffer n»,
//   Füllstand «über ⅓»/«unter ⅓»); bei fälligem «Messen und nachfüllen» die Knöpfe «Speichern …» und «Nachfüllen …»
//   (Name beginnt mit dem Wort, Unterzeile darf folgen), sonst «Speichern …»; Nachfüllen mit «Wie viele Kannen?»,
//   Kannenknöpfe «1» bis «n» (optional «2 Kannen») und «Nachgefüllt»; Abschluss mit «Fertig: x von n …».
// - Stromausfall #/stromausfall: Beginn hh:mm über den Ziffernblock (Ende vorbelegt mit jetzt), «Speichern».
import { expect, test, type Locator, type Page } from '@playwright/test';
import { platzId, type Teile } from '../fixtures/regal.ts';
import { JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  beruehrungen: number;
}

async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string | RegExp) =>
  typeof name === 'string'
    ? ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }))
    : ort.getByRole('link', { name }).or(ort.getByRole('button', { name }));
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}( |$)`) });
const allesOk = (page: Page) => knopf(page, 'Alles ok');
const kurzpruefung = (page: Page, ebene: number) =>
  page.getByText(`Ebene ${ebene} · Pumpen laufen, Licht an, Lüfter läuft`);
const speichern = (page: Page) => page.getByRole('button', { name: /^Speichern/ });
const nachfuellen = (page: Page) => page.getByRole('button', { name: /^Nachfüllen(?! Kratky)/ });
const abschluss = (page: Page) => page.getByText(/^Fertig: \d+ von \d+/);
const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

async function mitDaten(page: Page, start: Teile): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], beruehrungen: 0 };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        const zeile = tabelle === 'naehrloesungsansatz' ? { status: 'abgeschlossen', ...z } : z;
        zeileAufnehmen(m.daten, tabelle, zeile, JETZT);
      }
      sichtenNachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      stornoAufnehmen(m.daten, tabelle, clientId, JETZT);
      sichtenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  return m;
}

async function heute(page: Page): Promise<void> {
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
}

/** von Heute aus starten (zählt nicht); wartet auf die Kurzprüfung der ersten Ebene */
async function starten(page: Page, orte: number, ebene: number): Promise<void> {
  await heute(page);
  await knopf(page, new RegExp(`^Rundgang starten \\(${orte} Orte?\\)`)).click();
  await expect(kurzpruefung(page, ebene)).toBeVisible({ timeout: 10_000 });
}

/** Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(m: Mitschnitt, page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await tipp(m, taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`));
    await page.waitForTimeout(120);
  }
}

async function ohneScrollen(page: Page): Promise<void> {
  const { hoehe, fenster, oben } = await page.evaluate(() => ({
    hoehe: document.scrollingElement?.scrollHeight ?? document.body.scrollHeight,
    fenster: window.innerHeight,
    oben: window.scrollY,
  }));
  expect(hoehe, 'Seitenhöhe').toBeLessThanOrEqual(fenster);
  expect(oben, 'nicht gescrollt').toBe(0);
}

async function imViewport(page: Page, locator: Locator, was: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${was}: keine Bounding Box`);
  const fenster = await page.evaluate(() => window.innerHeight);
  expect(box.y, `${was} oben im Viewport`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${was} unten im Viewport`).toBeLessThanOrEqual(fenster);
}

async function hoeheMindestens(locator: Locator, dp: number, was: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${was}: keine Bounding Box`);
  expect(box.height, was).toBeGreaterThanOrEqual(dp - 0.5);
}

const AUFGABE = (typ: string, kennung: string) => `${typ}|${platzId(kennung)}|2027-01-12`;

test('Rundgang-AK1a DWC 1.1 im grünen Bereich ohne Nachfüllen in höchstens 10 Berührungen, ohne Wischgeste', async ({
  page,
}) => {
  const m = await mitDaten(page, rundgangTeile({ orte: ['1.1', '2.1'] }));
  await starten(page, 2, 1);
  m.beruehrungen = 0;

  await tipp(m, allesOk(page));
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('1.1');
  await ohneScrollen(page);
  await ziffern(m, page, '62');
  await ziffern(m, page, '120');
  await ziffern(m, page, '200');
  await expect(page.locator('.hv-ergebniszone')).toContainText('Im grünen Bereich');
  await ohneScrollen(page);
  await tipp(m, speichern(page));

  // automatischer Übergang (Kennung, «Sonde abspülen») ohne Berührung bis zur Kurzprüfung der Ebene 2
  await expect(kurzpruefung(page, 2)).toBeVisible({ timeout: 10_000 });
  expect(m.beruehrungen).toBeLessThanOrEqual(10);
  await ohneScrollen(page);

  await expect.poll(() => zeilenVon(m, 'messung').length).toBe(1);
  expect(zeilenVon(m, 'messung')[0]).toMatchObject({
    platz_id: platzId('1.1'),
    messart: 'rundgang',
    ph: 6.2,
    ec: 1.2,
    temperatur: 20,
    war_faellig_am: '2027-01-12',
    aufgabe_schluessel: AUFGABE('messen_nachfuellen', '1.1'),
  });
  const kurz = zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'kurzpruefung');
  expect(
    kurz.some(
      (z) =>
        z['platz_id'] === platzId('1.1') &&
        (z['daten'] as { punkt?: string; ok?: boolean }).punkt === 'pumpe' &&
        (z['daten'] as { ok?: boolean }).ok === true,
    ),
  ).toBe(true);
  expect(zeilenVon(m, 'naehrloesungsansatz')).toHaveLength(0);
});

test('Rundgang-AK1b Kratky belüftet 3.1 über einem Drittel in höchstens 11 Berührungen', async ({ page }) => {
  const m = await mitDaten(page, rundgangTeile({ orte: ['3.1'] }));
  await starten(page, 1, 3);
  m.beruehrungen = 0;

  await tipp(m, allesOk(page));
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('3.1');
  await ziffern(m, page, '64');
  await ziffern(m, page, '100');
  await ziffern(m, page, '190');
  await tipp(m, taste(page, 'über ⅓'));
  await expect(nachfuellen(page)).toHaveCount(0);
  await tipp(m, speichern(page));

  await expect(abschluss(page)).toBeVisible({ timeout: 10_000 });
  expect(m.beruehrungen).toBeLessThanOrEqual(11);
  await expect(page.getByText(/Nachfüllen Kratky/)).toHaveCount(0);
  await expect(page.getByText(/^Fertig: 1 von 1/)).toBeVisible();

  await expect.poll(() => zeilenVon(m, 'messung').length).toBe(1);
  expect(zeilenVon(m, 'messung')[0]).toMatchObject({
    platz_id: platzId('3.1'),
    messart: 'rundgang',
    fuellstand: 'ueber_drittel',
    aufgabe_schluessel: `messen|${platzId('3.1')}|2027-01-07`,
    war_faellig_am: '2027-01-07',
  });
  expect(zeilenVon(m, 'naehrloesungsansatz')).toHaveLength(0);
});

test('Rundgang-AK1c DWC 2.1 mit Nachfüllen von 2 Kannen in höchstens 13 Berührungen', async ({ page }) => {
  const m = await mitDaten(page, rundgangTeile({ orte: ['2.1'] }));
  await starten(page, 1, 2);
  m.beruehrungen = 0;

  await tipp(m, allesOk(page));
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('2.1');
  await ziffern(m, page, '62');
  await ziffern(m, page, '120');
  await ziffern(m, page, '200');
  await tipp(m, nachfuellen(page));
  await expect(page.getByText('Wie viele Kannen?')).toBeVisible({ timeout: 10_000 });
  // 30 l bei Kanne 10 l: Knöpfe 1 bis 3
  await expect(page.getByRole('button', { name: /^3( Kannen)?$/ })).toBeVisible();
  await tipp(m, page.getByRole('button', { name: /^2( Kannen)?$/ }));
  await expect(page.getByText(/ml/).first()).toBeVisible();
  await tipp(m, page.getByRole('button', { name: /^Nachgefüllt/ }));

  await expect(abschluss(page)).toBeVisible({ timeout: 10_000 });
  expect(m.beruehrungen).toBeLessThanOrEqual(13);

  await expect.poll(() => zeilenVon(m, 'naehrloesungsansatz').length).toBe(1);
  expect(zeilenVon(m, 'naehrloesungsansatz')[0]).toMatchObject({
    platz_id: platzId('2.1'),
    typ: 'nachfuellen',
    nachgefuellt_l: 20,
    aufgabe_schluessel: AUFGABE('messen_nachfuellen', '2.1'),
  });
  const positionen = zeilenVon(m, 'ansatz_position');
  expect(positionen.map((p) => p['produkt_id']).sort()).toEqual(['bloom', 'grow', 'micro_hard_water']);
  expect(zeilenVon(m, 'messung')).toHaveLength(1);
  expect(zeilenVon(m, 'messung')[0]).toMatchObject({ platz_id: platzId('2.1'), messart: 'rundgang' });
});

test('R5.2 Rundgang Regal-Maske: data-density regal, Tasten mindestens 68 dp, keine Eingabefelder, Messmaske mit Knopfpaar ohne Scrollen auf 360 × 640', async ({
  page,
}) => {
  await mitDaten(page, rundgangTeile({ orte: ['2.1'] }));
  await starten(page, 1, 2);
  const keineEingabe = page
    .locator('main')
    .locator(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable="true"]',
    );

  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(keineEingabe).toHaveCount(0);
  await hoeheMindestens(allesOk(page), 68, 'Alles ok');
  await imViewport(page, allesOk(page), 'Alles ok');
  await ohneScrollen(page);

  await allesOk(page).click();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(keineEingabe).toHaveCount(0);
  await hoeheMindestens(taste(page, 'Ziffer 5'), 68, 'Ziffer 5');
  for (const [locator, was] of [
    [speichern(page), 'Speichern'],
    [nachfuellen(page), 'Nachfüllen'],
  ] as const) {
    await expect(locator, was).toBeVisible();
    await imViewport(page, locator, was);
    await hoeheMindestens(locator, 72, was);
  }
  // gleich gross und nebeneinander
  const s = await speichern(page).boundingBox();
  const n = await nachfuellen(page).boundingBox();
  expect(Math.abs((s?.height ?? 0) - (n?.height ?? -1))).toBeLessThanOrEqual(1);
  expect(Math.abs((s?.y ?? 0) - (n?.y ?? -1))).toBeLessThanOrEqual(1);
  await ohneScrollen(page);

  // nach drei Werten: Ergebniszone, Knopfpaar weiter sichtbar, ohne Scrollen
  for (const zeichen of '62120200') {
    await taste(page, `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.hv-ergebniszone')).toBeVisible();
  await imViewport(page, speichern(page), 'Speichern nach drei Werten');
  await imViewport(page, nachfuellen(page), 'Nachfüllen nach drei Werten');
  await ohneScrollen(page);
});

test('R5.2 Rundgang nach Neuladen und nach Hash-Wechsel beim offenen Schritt fortgesetzt', async ({
  page,
}) => {
  const m = await mitDaten(page, rundgangTeile());
  await starten(page, 3, 1);
  await allesOk(page).click();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('1.1');
  await expect
    .poll(() => zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'kurzpruefung').length)
    .toBeGreaterThan(0);
  const kurz = zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'kurzpruefung').length;

  // Neuladen: offener Schritt (Messmaske 1.1), keine zweite Kurzprüfung
  await page.clock.setFixedTime(JETZT);
  await page.reload();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('main')).toContainText('1.1');
  await expect(kurzpruefung(page, 1)).toHaveCount(0);

  // Hash-Wechsel nach Heute und zurück über «Fortsetzen»
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  const laufend = page.getByText(/Rundgang läuft/);
  await expect(laufend).toBeVisible();
  await knopf(page, 'Fortsetzen').first().click();
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('1.1');
  await expect(kurzpruefung(page, 1)).toHaveCount(0);
  expect(zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'kurzpruefung')).toHaveLength(kurz);
});

test('UC8 Heute zeigt «Rundgang starten (3 Orte)» und Ortskarten; Einträge «Gefäss prüfen» und «Reinigen» bleiben je genau ein Eintrag', async ({
  page,
}) => {
  await mitDaten(page, rundgangTeile());
  await heute(page);
  await expect(knopf(page, /^Rundgang starten \(3 Orte\)/)).toBeVisible();
  await expect(knopf(page, /^Stromausfall erfassen/)).toBeVisible();

  // Ortskarten als Abschnitte, Testorte in Laufweg-Reihenfolge
  const karten = page.locator('section[aria-label^="R-"]');
  const namen = await karten.evaluateAll((l) => l.map((e) => e.getAttribute('aria-label')));
  const reihe = namen.filter((n) => n === 'R-1.1' || n === 'R-2.1' || n === 'R-3.1');
  expect(reihe).toEqual(['R-1.1', 'R-2.1', 'R-3.1']);
  await expect(page.getByRole('region', { name: 'R-1.1' }).getByRole('listitem')).toHaveCount(2);
  await expect(
    page
      .getByRole('region', { name: 'R-1.1' })
      .getByRole('listitem')
      .filter({ hasText: 'Messen und nachfüllen' }),
  ).toHaveCount(1);

  // bestehende Selektoren: genau ein Listeneintrag je Aufgabe, keine verschachtelten Einträge
  await expect(page.getByRole('listitem').filter({ hasText: 'Gefäss prüfen' })).toHaveCount(1);
  await expect(page.getByRole('listitem').filter({ hasText: 'Gefäss prüfen · R-3.3' })).toHaveCount(1);
  for (const code of ['R-2.2', 'R-2.3'])
    await expect(
      page.getByRole('listitem').filter({ hasText: `Reinigen, freie Löcher abdecken · ${code}` }),
      code,
    ).toHaveCount(1);
});

test('UC8 «Stromausfall erfassen» über 7 h schreibt das Ereignis und zeigt «Pumpen prüfen nach Stromausfall» in Heute', async ({
  page,
}) => {
  const m = await mitDaten(page, rundgangTeile());
  await heute(page);
  await expect(page.getByText('Pumpen prüfen nach Stromausfall')).toHaveCount(0);
  await knopf(page, /^Stromausfall erfassen/).click();
  await expect(page.locator('main[data-density="regal"]')).toBeVisible({ timeout: 10_000 });
  // Beginn 02:00 heute über den Ziffernblock, Ende vorbelegt 09:00
  for (const zeichen of '0200') {
    await taste(page, `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
  const heuteKnopf = taste(page, 'heute');
  if (await heuteKnopf.isVisible()) await heuteKnopf.click();
  await speichern(page).click();

  await expect.poll(() => zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'stromausfall').length).toBe(1);
  const e = zeilenVon(m, 'ereignis').find((z) => z['typ'] === 'stromausfall') as Record<string, unknown>;
  expect(e['anlage_id']).toBe((m.daten['anlage']?.[0] as Record<string, unknown>)['id']);
  const daten = e['daten'] as { beginn: string; ende: string };
  expect(Date.parse(daten.beginn)).toBe(Date.parse('2027-01-12T01:00:00.000Z'));
  expect(Date.parse(daten.ende)).toBe(JETZT.getTime());

  await heute(page);
  await expect(page.getByText('Pumpen prüfen nach Stromausfall').first()).toBeVisible();
  await expect(page.getByText('Wassertemperatur messen').first()).toBeVisible();
});
