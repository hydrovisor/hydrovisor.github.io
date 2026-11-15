// UX5 Keimung prüfen je Anzuchtbox (Issue #227, Plan 227 Testliste; UX5-AK3, UX5-AK4; U13, TO2). REST nachgebildet
// wie tests/e2e/keimung.spec.ts: POST und PATCH aus schreiben() landen im nachgebildeten Bündel, die Sichten rechnen
// sichtenNachrechnen() und pflanzSichtenNachrechnen() nach jedem Schreiben nach. Feste Uhr 2027-01-11T08:00:00Z
// (Zürich 11.1. 09:00); 360 × 640 aus der Konfiguration. Teile aus tests/fixtures/keimung.ts:
// - keimTeile({ zweiterSatz, dritterSatz }): drei fällige Sätze in R-A1: 80 Lollo Rossa (6 Schwämme à 2, Zieltöpfe
//   2.3.1 bis 2.3.5), 81 Lollo Rossa (6 Schwämme à 2 ohne Zieltopf), 82 Eichblatt (4 Schwämme à 2 ohne Zieltopf);
//   Keimtemperatur beider Sorten 15–20 °C; Stationen 4.4 und 4.5 frei. 16 offene Schwämme, 32 Samen.
// - keimBoxTeile(14): 14 Sätze in A1 (Muster S9), je 1 Schwamm à 2 Samen, Lollo Rossa, Rucola und Eichblatt im Wechsel.
//
// Erwartete Oberfläche (Plan 227 «Maske KeimungBox» und «Heute»; vom Testentwickler festgelegt, wo der Plan offen ist):
// - Heute, Ortskarte R-A1: ein Listeneintrag mit «Keimung prüfen · 3 Sätze» und dem Grund («Lollo Rossa × 2»,
//   «Eichblatt × 1»), Link «Prüfen» nach #/keimung/box/R-A1, Taste «Morgen».
// - Maske: main mit data-density="regal", h1 «Keimung prüfen», «Zu Heute» im Kopf, Unterkopf «R-A1 · 3 Sätze»;
//   Frage «Keimtemperatur 15–20 °C eingehalten?» mit «Ja» und «Nein» (aria-pressed); je Satz eine Section (role region)
//   mit aria-label «Lollo Rossa 1», «Lollo Rossa 2», «Eichblatt»; darin «Alle gekeimt» (vorgewählt, aria-pressed="true")
//   und «Abweichung»; bei «Abweichung» Stepper «Schwamm n …» mit «… weniger»; Zusammenfassung des Satzes
//   («1 Schwamm keimt nicht»); Stationszeile «Station 4.4: Loch 1–6» für Satz 80.
// - Fester Fuss: Gesamtzeile «3 Sätze · 32 von 32 Samen (100 %)», «Keimung speichern» (68 dp, ohne Scrollen sichtbar).
// - Nach dem Speichern: «Gespeichert: 3 Sätze · 32 von 32 Samen», «Rückgängig machen»; danach nur «Zu Heute».
// - Meldezeile nach «Morgen»: «Auf morgen verschoben: Keimung prüfen · 3 Sätze R-A1» mit «Rückgängig machen».
// - Kein Eingabefeld, das die Systemtastatur öffnet.
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  KEIM_JETZT,
  KEIM_SATZ,
  KEIM_SATZ_2,
  KEIM_SATZ_3,
  KEIM_BOX_NR,
  keimBoxTeile,
  keimTeile,
  pflanzungId,
} from '../fixtures/keimung.ts';
import { platzId, type Teile } from '../fixtures/regal.ts';
import {
  pflanzSichtenNachrechnen,
  sichtenNachrechnen,
  stornoAufnehmen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

const JETZT = KEIM_JETZT;
const BOX = '/#/keimung/box/R-A1';

type Zeile = Record<string, unknown>;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  beruehrungen: number;
}

const nachrechnen = (t: Teile) => pflanzSichtenNachrechnen(sichtenNachrechnen(t));
const dreiSaetze = () => keimTeile({ zweiterSatz: true, dritterSatz: true });

async function mitDaten(page: Page, start: Teile, pfad: string, ueberschrift: string): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: nachrechnen(structuredClone(start)),
    geschrieben: [],
    storniert: [],
    beruehrungen: 0,
  };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        zeileAufnehmen(m.daten, tabelle, z, JETZT);
      }
      nachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      stornoAufnehmen(m.daten, tabelle, clientId, JETZT);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await page.reload();
  await expect(page.getByRole('heading', { name: ueberschrift, level: 1 })).toBeVisible({ timeout: 15_000 });
  return m;
}

const heute = (page: Page, start: Teile) => mitDaten(page, start, '/#/heute', 'Heute');
const box = (page: Page, start: Teile) => mitDaten(page, start, BOX, 'Keimung prüfen');

/** jede Berührung zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const boxzeile = (page: Page, n: number) =>
  region(page, 'R-A1')
    .getByRole('listitem')
    .filter({ hasText: `Keimung prüfen · ${n} Sätze` });
const satz = (page: Page, name: string) => page.locator('main').getByRole('region', { name, exact: true });
const weniger = (ort: Locator, nr: number) =>
  ort.getByRole('button', { name: new RegExp(`^Schwamm ${nr}(?!\\d).* weniger$`) });
const meldezeile = (page: Page) => page.locator('.hv-meldezeile[role="status"]');

const ereignisse = (m: Mitschnitt, typ: string) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === typ).map(([, z]) => z);
const daten = (z: Zeile | undefined) => (z?.['daten'] ?? {}) as Zeile;
const pflanzungenVon = (satzNr: number, n: number) =>
  Array.from({ length: n }, (_, i) => pflanzungId(satzNr, i + 1));

/** ganz im Bild und nicht verdeckt (fester Fuss, Leiste): der Tipp in die Mitte trifft das Element */
async function ohneScrollenTippbar(ort: Locator): Promise<void> {
  await expect(ort).toBeInViewport({ ratio: 1 });
  const trifft = await ort.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t !== null && (e === t || e.contains(t));
  });
  expect(trifft, 'Mitte des Elements frei').toBe(true);
}

async function ohneTastatur(page: Page): Promise<void> {
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();
  await expect(
    page
      .locator('main')
      .locator(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select, [contenteditable="true"]',
      ),
  ).toHaveCount(0);
}

/** zwei Frames: Scroll- und Render-Ereignisse sind verarbeitet */
const frames = (page: Page) =>
  page.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));

/** alle keimung des Satzes mit allen Samen und eingehaltener Keimtemperatur */
function alleGekeimt(m: Mitschnitt, satzNr: number, schwaemme: number): void {
  const keimung = ereignisse(m, 'keimung');
  for (const p of pflanzungenVon(satzNr, schwaemme)) {
    const z = keimung.filter((k) => k['pflanzung_id'] === p);
    expect(z, `Satz ${satzNr}, ${p}`).toHaveLength(1);
    expect(daten(z[0]), `Satz ${satzNr}, ${p}`).toMatchObject({
      samen_gesaet: 2,
      samen_gekeimt: 2,
      keimtemp_eingehalten: true,
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// UX5-AK3 Tipperzahl «Keimung prüfen» je Box
// ---------------------------------------------------------------------------------------------------------------

test('UX5-AK3 Box mit 3 fälligen Sätzen ohne Abweichung: von Heute aus mit höchstens 3 Tippern gespeichert («Prüfen», «Ja», «Keimung speichern»)', async ({
  page,
}) => {
  const m = await heute(page, dreiSaetze());
  // in der Ortskarte R-A1 genau ein Eintrag «Keimung prüfen · 3 Sätze», keine Zeile je Satz
  const eintrag = boxzeile(page, 3);
  await expect(eintrag).toHaveCount(1);
  await expect(eintrag).toContainText('Lollo Rossa × 2');
  await expect(eintrag).toContainText('Eichblatt × 1');
  await expect(
    region(page, 'R-A1')
      .getByRole('listitem')
      .filter({ hasText: /Keimung prüfen · (Lollo Rossa|Eichblatt)/ }),
  ).toHaveCount(0);
  await expect(region(page, 'R-A1').getByRole('listitem').filter({ hasText: 'Würfel feucht' })).toHaveCount(
    1,
  );

  // Tipper 1: «Prüfen»
  await tipp(m, knopf(eintrag, 'Prüfen'));
  await expect(page).toHaveURL(/#\/keimung\/box\/R-A1$/);
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();
  await expect(page.getByText('R-A1 · 3 Sätze')).toBeVisible();
  await expect(page.getByText('Keimtemperatur 15–20 °C eingehalten?')).toBeVisible();
  // je Satz «Alle gekeimt» vorgewählt; Stationsplätze als Text
  for (const name of ['Lollo Rossa 1', 'Lollo Rossa 2', 'Eichblatt'])
    await expect(knopf(satz(page, name), 'Alle gekeimt'), name).toHaveAttribute('aria-pressed', 'true');
  await expect(satz(page, 'Lollo Rossa 1')).toContainText('Station 4.4: Loch 1–6');
  expect(m.geschrieben).toEqual([]);

  // Tipper 2 und 3
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 3 Sätze · 32 von 32 Samen/)).toBeVisible();
  expect(m.beruehrungen).toBeLessThanOrEqual(3);

  // keimung für alle 16 offenen Schwämme mit allen Samen und Keimtemperatur eingehalten
  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(16);
  alleGekeimt(m, 80, 6);
  alleGekeimt(m, 81, 6);
  alleGekeimt(m, 82, 4);
  expect(ereignisse(m, 'abschluss')).toEqual([]);
  // die verschieben der Vorschau: jeder Schwamm auf ein eigenes Stationsloch
  const verschieben = ereignisse(m, 'verschieben');
  expect(verschieben).toHaveLength(16);
  const loecher = verschieben.map(
    (z) => `${String(daten(z)['nach_platz_id'])}|${String(daten(z)['nach_loch_nr'])}`,
  );
  expect(new Set(loecher).size).toBe(16);
  for (const z of verschieben) expect(daten(z)['von_platz_id']).toBe(platzId('A1'));
  const satz80 = verschieben.filter((z) => pflanzungenVon(80, 6).includes(String(z['pflanzung_id'])));
  expect(satz80.map((z) => [daten(z)['nach_platz_id'], daten(z)['nach_loch_nr']])).toEqual(
    [1, 2, 3, 4, 5, 6].map((n) => [platzId('4.4'), n]),
  );
  // alles in einem Vorgang: jede Zeile genau einmal
  const ids = m.geschrieben.map(([, z]) => String(z['client_id']));
  expect(new Set(ids).size).toBe(ids.length);
});

test('UX5-AK3 die Maske hat data-density regal, kein Eingabefeld, kein waagrechtes Scrollen; «Ja» und «Keimung speichern» ohne Scrollen sichtbar, Tasten mindestens 68 dp', async ({
  page,
}) => {
  await box(page, dreiSaetze());
  await ohneTastatur(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const ja = knopf(page, 'Ja');
  const speichern = knopf(page, 'Keimung speichern');
  await ohneScrollenTippbar(ja);
  await ohneScrollenTippbar(speichern);
  for (const [name, taste] of [
    ['Ja', ja],
    ['Keimung speichern', speichern],
  ] as const)
    expect((await taste.boundingBox())?.height ?? 0, name).toBeGreaterThanOrEqual(68);
  // Gesamtzeile im festen Fuss
  await expect(page.getByText('3 Sätze · 32 von 32 Samen (100 %)')).toBeVisible();
  // gesperrt, solange die Keimtemperatur fehlt
  await expect(speichern).toBeDisabled();
  await ja.click();
  await expect(speichern).toBeEnabled();
  await ohneTastatur(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('UX5-AK3 vor «Keimung speichern» kein POST; ein Doppeltipper 100 ms danach schreibt nichts weiter (U13, TO2)', async ({
  page,
}) => {
  const m = await box(page, dreiSaetze());
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith(REST) && r.method() !== 'GET') posts.push(`${r.method()} ${r.url()}`);
  });
  await tipp(m, knopf(page, 'Ja'));
  // Wahl und Vorschau schreiben nichts
  await page.waitForTimeout(300);
  expect(posts).toEqual([]);
  expect(m.geschrieben).toEqual([]);

  const speichern = knopf(page, 'Keimung speichern');
  await speichern.scrollIntoViewIfNeeded();
  await frames(page);
  const rahmen = await speichern.boundingBox();
  if (!rahmen) throw new Error('«Keimung speichern»: keine Bounding Box');
  const x = rahmen.x + rahmen.width / 2;
  const y = rahmen.y + rahmen.height / 2;
  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  await page.mouse.click(x, y);
  await expect(page.getByText(/Gespeichert: 3 Sätze/)).toBeVisible();
  // Zeit für einen allfälligen zweiten Schreibvorgang
  await page.waitForTimeout(800);

  expect(ereignisse(m, 'keimung')).toHaveLength(16);
  expect(ereignisse(m, 'verschieben')).toHaveLength(16);
  const ids = m.geschrieben.map(([, z]) => String(z['client_id']));
  expect(new Set(ids).size).toBe(ids.length);
  // der zweite Tipp hat auch nichts zurückgenommen
  expect(m.storniert).toEqual([]);
});

test('UX5-AK3 TO2 Wiederholung nach Fehler sendet denselben Vorgang mit denselben client_id', async ({
  page,
}) => {
  const m = await box(page, dreiSaetze());
  let fehler = true;
  const versucht: string[] = [];
  await page.route(`${REST}/**`, async (route) => {
    const anfrage = route.request();
    if (anfrage.method() === 'POST') {
      const roh = (anfrage.postDataJSON() ?? {}) as Zeile | Zeile[];
      for (const z of Array.isArray(roh) ? roh : [roh]) versucht.push(String(z['client_id']));
      if (fehler) {
        fehler = false;
        return route.fulfill({ status: 503, json: { message: 'nicht verfügbar' } });
      }
    }
    return route.fallback();
  });
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  const ersterVersuch = new Set(versucht);
  expect(ersterVersuch.size).toBeGreaterThan(0);

  await page.waitForTimeout(450);
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 3 Sätze/)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(16);
  const gesendet = m.geschrieben.map(([, z]) => String(z['client_id']));
  expect(new Set(gesendet).size).toBe(gesendet.length);
  for (const id of ersterVersuch) expect(gesendet, id).toContain(id);
});

test('UX5-AK3 «Rückgängig machen» storniert alle Zeilen in umgekehrter Reihenfolge; danach nur «Zu Heute», in Heute steht die Boxzeile wieder', async ({
  page,
}) => {
  const m = await box(page, dreiSaetze());
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 3 Sätze/)).toBeVisible();
  await expect.poll(() => m.geschrieben.length).toBe(32);
  const geschrieben = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`);

  const zurueck = page.locator('main').getByRole('button', { name: 'Rückgängig machen', exact: true });
  await expect(zurueck).toBeEnabled();
  await tipp(m, zurueck);
  await expect.poll(() => m.storniert.length).toBe(geschrieben.length);
  expect(m.storniert.map(([t, id]) => `${t}:${id}`)).toEqual([...geschrieben].reverse());
  for (const [, , felder] of m.storniert) expect(felder['storno_grund']).toBe('rueckgaengig');

  // danach nur «Zu Heute», keine «Nächste Aufgabe»
  await expect(page.locator('main').getByRole('link', { name: /^Nächste Aufgabe/ })).toHaveCount(0);
  await expect(page.locator('main').getByRole('button', { name: /^Nächste Aufgabe/ })).toHaveCount(0);
  const zuHeute = knopf(page.locator('main'), 'Zu Heute').last();
  await expect(zuHeute).toBeVisible();
  await tipp(m, zuHeute);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(boxzeile(page, 3)).toHaveCount(1);
});

test('UX5-AK3 14 Sätze (keimBoxTeile): Heute zeigt eine Zeile «Keimung prüfen · 14 Sätze»; Speichern mit 3 Tippern schreibt 14 Sätze', async ({
  page,
}) => {
  const m = await heute(page, keimBoxTeile(14));
  const eintrag = boxzeile(page, 14);
  await expect(eintrag).toHaveCount(1);
  await expect(
    region(page, 'R-A1')
      .getByRole('listitem')
      .filter({ hasText: /Keimung prüfen · (Lollo Rossa|Rucola|Eichblatt)/ }),
  ).toHaveCount(0);

  await tipp(m, knopf(eintrag, 'Prüfen'));
  await expect(page).toHaveURL(/#\/keimung\/box\/R-A1$/);
  await expect(page.getByText('R-A1 · 14 Sätze')).toBeVisible();
  // die Keimtemperatur oben und «Keimung speichern» im festen Fuss: beide ohne Scrollen tippbar
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await ohneScrollenTippbar(knopf(page, 'Ja'));
  await ohneScrollenTippbar(knopf(page, 'Keimung speichern'));

  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 14 Sätze · 28 von 28 Samen/)).toBeVisible();
  expect(m.beruehrungen).toBe(3);
  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(14);
  const erwartet = Array.from({ length: 14 }, (_, i) => pflanzungId(KEIM_BOX_NR + i, 1)).sort();
  expect(
    ereignisse(m, 'keimung')
      .map((z) => String(z['pflanzung_id']))
      .sort(),
  ).toEqual(erwartet);
  for (const z of ereignisse(m, 'keimung'))
    expect(daten(z)).toMatchObject({ samen_gesaet: 2, samen_gekeimt: 2, keimtemp_eingehalten: true });
});

test('UX5-AK3 der Aufruf je Satz #/keimung/<satz> zeigt weiter die Maske je Satz mit Stationsschritt', async ({
  page,
}) => {
  const m = await mitDaten(page, dreiSaetze(), `/#/keimung/${KEIM_SATZ}`, 'Keimung prüfen');
  await expect(page).toHaveURL(new RegExp(`#/keimung/${KEIM_SATZ}$`));
  await expect(page.getByText('Lollo Rossa · Kopf · A1 · gesät 7.1. · Tag 4')).toBeVisible();
  // keine Box-Maske
  await expect(knopf(page, 'Alle gekeimt')).toHaveCount(0);
  await expect(page.getByText('R-A1 · 3 Sätze')).toHaveCount(0);
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByRole('button', { name: /^4\.4/ }).first()).toHaveAttribute('aria-pressed', 'true');
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  // nur Satz 80
  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(6);
  for (const z of ereignisse(m, 'keimung')) expect(pflanzungenVon(80, 6)).toContain(z['pflanzung_id']);
});

test('UX5-AK3 «Morgen» in der Boxzeile verschiebt alle 3 Sätze mit einem Tipper (3 aufschub); «Rückgängig machen» in der Meldezeile holt die Zeile zurück', async ({
  page,
}) => {
  const m = await heute(page, dreiSaetze());
  const eintrag = boxzeile(page, 3);
  await expect(eintrag).toHaveCount(1);
  // «Prüfen» betont, «Morgen» nachrangig, kein «Öffnen»
  await expect(knopf(eintrag, 'Prüfen')).toHaveClass(/hv-btn-secondary/);
  await expect(knopf(eintrag, 'Morgen')).toHaveClass(/hv-btn-ghost/);
  await expect(knopf(eintrag, 'Öffnen')).toHaveCount(0);

  await tipp(m, knopf(eintrag, 'Morgen'));
  await expect.poll(() => m.geschrieben.filter(([t]) => t === 'aufschub').length).toBe(3);
  expect(m.beruehrungen).toBe(1);
  const aufschub = m.geschrieben.filter(([t]) => t === 'aufschub').map(([, z]) => z);
  expect(aufschub.map((z) => z['aufgabe_schluessel'])).toEqual(
    [KEIM_SATZ, KEIM_SATZ_2, KEIM_SATZ_3].map((s) => `keimung_pruefen|${s}|2027-01-11`),
  );
  for (const z of aufschub) expect(z).toMatchObject({ art: 'morgen', gesetzt_am: '2027-01-11' });
  await expect(boxzeile(page, 3)).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Auf morgen verschoben: Keimung prüfen · 3 Sätze R-A1');

  const zurueck = meldezeile(page).getByRole('button', { name: 'Rückgängig machen', exact: true });
  await expect(zurueck).toBeEnabled();
  await tipp(m, zurueck);
  await expect.poll(() => m.storniert.filter(([t]) => t === 'aufschub').length).toBe(3);
  expect(m.storniert.map(([, id]) => id).sort()).toEqual(aufschub.map((z) => String(z['client_id'])).sort());
  for (const [, , felder] of m.storniert) expect(felder['storno_grund']).toBe('rueckgaengig');
  await expect(boxzeile(page, 3)).toHaveCount(1);
});

// ---------------------------------------------------------------------------------------------------------------
// UX5-AK4 Abweichung je Schwamm in derselben Maske
// ---------------------------------------------------------------------------------------------------------------

test('UX5-AK4 «Abweichung» bei Lollo Rossa 2, Schwamm 4 zweimal «weniger», «Ja», «Keimung speichern»: nur Satz 81 Schwamm 4 keimt nicht, Sätze 80 und 82 bleiben «Alle gekeimt»', async ({
  page,
}) => {
  const m = await box(page, dreiSaetze());
  const zwei = satz(page, 'Lollo Rossa 2');
  await expect(weniger(zwei, 4)).toHaveCount(0);
  await tipp(m, knopf(zwei, 'Abweichung'));
  await expect(knopf(zwei, 'Abweichung')).toHaveAttribute('aria-pressed', 'true');
  // Stepper je offenem Schwamm, vorbelegt mit allen Samen
  for (let n = 1; n <= 6; n += 1) await expect(weniger(zwei, n)).toHaveCount(1);
  await expect(zwei.getByRole('group', { name: /^Schwamm 4(?!\d)/ })).toContainText('2');
  await tipp(m, weniger(zwei, 4));
  await tipp(m, weniger(zwei, 4));
  await expect(zwei.getByRole('group', { name: /^Schwamm 4(?!\d)/ })).toContainText('0');
  // Warnung in derselben Maske
  await expect(zwei).toContainText('1 Schwamm keimt nicht');
  // die übrigen Sätze bleiben «Alle gekeimt», ohne Stepper
  for (const name of ['Lollo Rossa 1', 'Eichblatt']) {
    await expect(knopf(satz(page, name), 'Alle gekeimt'), name).toHaveAttribute('aria-pressed', 'true');
    await expect(weniger(satz(page, name), 1), name).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();

  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 3 Sätze · 30 von 32 Samen/)).toBeVisible();
  expect(m.beruehrungen).toBe(5);

  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(16);
  const schwamm4 = pflanzungId(81, 4);
  const keimung4 = ereignisse(m, 'keimung').filter((z) => z['pflanzung_id'] === schwamm4);
  expect(keimung4).toHaveLength(1);
  expect(daten(keimung4[0])).toMatchObject({ samen_gesaet: 2, samen_gekeimt: 0, keimtemp_eingehalten: true });
  const abschluss = ereignisse(m, 'abschluss');
  expect(abschluss.map((z) => [z['pflanzung_id'], daten(z)['grund']])).toEqual([[schwamm4, 'keimt_nicht']]);
  alleGekeimt(m, 80, 6);
  alleGekeimt(m, 82, 4);
  for (const p of pflanzungenVon(81, 6).filter((p) => p !== schwamm4)) {
    const z = ereignisse(m, 'keimung').find((k) => k['pflanzung_id'] === p);
    expect(daten(z)['samen_gekeimt'], p).toBe(2);
  }
  // Schwamm 4 geht nicht auf die Station
  expect(ereignisse(m, 'verschieben').some((z) => z['pflanzung_id'] === schwamm4)).toBe(false);
});

test('UX5-AK4 zurück auf «Alle gekeimt» verwirft die Abweichung des Satzes; gespeichert werden alle Samen', async ({
  page,
}) => {
  const m = await box(page, dreiSaetze());
  const zwei = satz(page, 'Lollo Rossa 2');
  await tipp(m, knopf(zwei, 'Abweichung'));
  await tipp(m, weniger(zwei, 4));
  await tipp(m, weniger(zwei, 4));
  await expect(zwei).toContainText('1 Schwamm keimt nicht');
  await tipp(m, knopf(zwei, 'Alle gekeimt'));
  await expect(knopf(zwei, 'Alle gekeimt')).toHaveAttribute('aria-pressed', 'true');
  await expect(weniger(zwei, 4)).toHaveCount(0);
  await expect(page.getByText('3 Sätze · 32 von 32 Samen (100 %)')).toBeVisible();
  // erneut «Abweichung»: wieder vorbelegt mit allen Samen (A9)
  await tipp(m, knopf(zwei, 'Abweichung'));
  await expect(zwei.getByRole('group', { name: /^Schwamm 4(?!\d)/ })).toContainText('2');
  await tipp(m, knopf(zwei, 'Alle gekeimt'));

  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: 3 Sätze · 32 von 32 Samen/)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'keimung').length).toBe(16);
  alleGekeimt(m, 80, 6);
  alleGekeimt(m, 81, 6);
  alleGekeimt(m, 82, 4);
  expect(ereignisse(m, 'abschluss')).toEqual([]);
});
