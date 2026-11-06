// Phasenfragen in Heute, Karte «Phasen nachführen» und Pflanzenansicht (Plan 35 Testliste; UC6-AK6, R1.5, R1.6).
// REST nachgebildet (Plan 18 A7) wie tests/e2e/keimung.spec.ts: POST und PATCH aus schreiben() landen im nachgebildeten
// Bündel; v_pflanzung_zustand (Phase) und ereignis_satz rechnet tests/fixtures/sichten.ts (phaseNachrechnen) nach. Die
// Nachbildung filtert nicht: der Bündelteil ereignis_satz erhält alle Zeilen der Tabelle ereignis, auch stornierte
// (die Domäne filtert typ und Storno selbst). Teile aus tests/fixtures/phasen.ts; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 35 offen ist):
// - Heute (h1 «Heute»): je Bündel eine Card (section mit Überschrift h3) «Salat · 4.4 · gesät 7.1.»; je Satz eine
//   Choice-Gruppe (role group), deren Name mit dem Sortennamen beginnt, mit den Knöpfen «Ja» (vorgewählt),
//   «Noch nicht», «Problem»; Footer-Knopf «Alle Ja». Karte «Phasen nachführen (n Sätze)» mit dem Knopf
//   «Alle übernehmen» (im Kopf und im Footer, A14). Nach dem Speichern ein Text mit «Gespeichert» und der Knopf
//   «Rückgängig machen».
// - Maske «Gefäss» (#/gefaess/R-4.4): je Satzzeile der Liste «Pflanzen» ein Knopf «Phase» (Link oder Button) nach
//   #/pflanze/<erste aktive Pflanzung des Satzes>.
// - Pflanzenansicht #/pflanze/<pflanzung>: main mit data-density="regal", h1 «Pflanze»; Kopf «Lollo Rossa · Kopf · 4.4»,
//   «Tag 16 seit Saat», «Anzucht · Tag 12 von 10–14», «Wachstum frühestens 21.1., typisch 23.1.»; Knöpfe
//   «Phase wechseln» (vor der Mindestdauer gesperrt mit «möglich ab T.M.»), «Noch nicht», «Problem»,
//   «Datum korrigieren» (öffnet einen Stepper «Wechseldatum» mit «Wechseldatum weniger»/«… mehr» und den Knopf
//   «Korrektur speichern»); Abschnitt mit Überschrift «Verlauf» mit Einträgen «23.1. Wachstum: Ja»,
//   «11.1. Anzucht: Ja», «Korrektur am 23.1.: Wachstum ab 22.1.».
// - Kein Eingabefeld, das die Systemtastatur öffnet.
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  buendelTeile,
  phasenNachrechnen,
  pflanzungVon,
  RUECK_JETZT,
  rueckdatiertTeile,
  satzId,
} from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

/** 23.1.2027 09:00 Zürich: Lollo Rossa (61) und Eichblatt (62) in 4.4 fällig, Ochsenherz (64) in 4.2 noch nicht */
const JETZT = new Date('2027-01-23T08:00:00Z');

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  storniert: [string, string][];
  beruehrungen: number;
}

async function mitDaten(
  page: Page,
  start: Teile,
  jetzt: Date,
  pfad: string,
  ueberschrift: string,
): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: phasenNachrechnen(structuredClone(start)),
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
        zeileAufnehmen(m.daten, tabelle, z, jetzt);
      }
      phasenNachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
      stornoAufnehmen(m.daten, tabelle, clientId, jetzt);
      phasenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: ueberschrift, level: 1 })).toBeVisible();
  return m;
}

async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
/** nächste section um die Überschrift (Card) */
const karte = (page: Page, titel: string) =>
  page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]');
const antworten = (m: Mitschnitt) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === 'phase_antwort').map(([, z]) => z);
const daten = (z: Record<string, unknown> | undefined) => (z?.['daten'] ?? {}) as Record<string, unknown>;

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

test('UC6-AK6 Phase je Satz in höchstens 2 Berührungen, eine Karte je Ort, Art und Saatdatum mit [Alle Ja], Bestätigung und Korrektur mit Datum im Verlauf', async ({
  page,
}) => {
  const m = await mitDaten(page, buendelTeile(JETZT, { ohneSpaete: true }), JETZT, '/#/heute', 'Heute');

  // Heute: eine Karte für die beiden Salatsätze in 4.4 vom 7.1., die Tomate ist noch nicht fällig
  const salat = karte(page, 'Salat · 4.4 · gesät 7.1.');
  await expect(salat).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /^Tomate · 4\.2/ })).toHaveCount(0);
  const lollo = salat.getByRole('group', { name: /^Lollo Rossa/ });
  const eichblatt = salat.getByRole('group', { name: /^Eichblatt/ });
  await expect(lollo).toHaveCount(1);
  await expect(eichblatt).toHaveCount(1);
  await expect(lollo.getByRole('button', { name: 'Ja', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Ausnahme «Noch nicht» für Eichblatt, dann [Alle Ja]: 2 Berührungen
  await tipp(m, eichblatt.getByRole('button', { name: 'Noch nicht', exact: true }));
  await tipp(m, knopf(salat, 'Alle Ja'));
  expect(m.beruehrungen).toBe(2);
  await expect.poll(() => antworten(m).length).toBe(2);
  const [a61] = antworten(m).filter((z) => z['satz_id'] === satzId(61));
  const [a62] = antworten(m).filter((z) => z['satz_id'] === satzId(62));
  expect(daten(a61)).toMatchObject({ phase: 'wachstum', antwort: 'ja', erwartet_am: '2027-01-23' });
  expect(daten(a62)).toMatchObject({ phase: 'wachstum', antwort: 'noch_nicht', erwartet_am: '2027-01-23' });
  for (const a of [a61, a62]) {
    expect(a?.['pflanzung_id'] ?? null).toBeNull();
    expect(a?.['war_faellig_am']).toBe('2027-01-23');
  }
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  await expect(knopf(page, 'Rückgängig machen')).toBeVisible();
  await expect(salat).toHaveCount(0);

  // aus der Maske «Gefäss»: «Phase» und «Phase wechseln» = 2 Berührungen
  m.beruehrungen = 0;
  await page.goto('/#/gefaess/R-4.4');
  await page.reload();
  const zeile = page
    .getByRole('list', { name: 'Pflanzen' })
    .getByRole('listitem')
    .filter({ hasText: 'Eichblatt' });
  await expect(zeile).toHaveCount(1);
  await tipp(m, knopf(zeile, 'Phase'));
  await expect(page).toHaveURL(new RegExp(`#/pflanze/${pflanzungVon(62, 1)}$`));
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  await tipp(m, knopf(page.locator('main'), 'Phase wechseln'));
  expect(m.beruehrungen).toBe(2);
  await expect.poll(() => antworten(m).length).toBe(3);
  const wechsel = antworten(m)[2];
  expect(wechsel?.['satz_id']).toBe(satzId(62));
  expect(wechsel?.['pflanzung_id'] ?? null).toBeNull();
  expect(daten(wechsel)).toMatchObject({ phase: 'wachstum', antwort: 'ja' });
  expect(wechsel?.['gilt_ab']).toBe(JETZT.toISOString());

  // Verlauf mit Datum
  const verlauf = karte(page, 'Verlauf');
  await expect(verlauf.getByText('23.1. Wachstum: Ja', { exact: true })).toBeVisible();
  await expect(verlauf.getByText('23.1. Wachstum: Noch nicht', { exact: true })).toBeVisible();
  await expect(verlauf.getByText('11.1. Anzucht: Ja', { exact: true })).toBeVisible();

  // Datum der Bestätigung um einen Tag zurück
  await knopf(page.locator('main'), 'Datum korrigieren').click();
  await page.getByRole('button', { name: 'Wechseldatum weniger', exact: true }).click();
  await knopf(page.locator('main'), 'Korrektur speichern').click();
  await expect.poll(() => m.storniert.length).toBe(1);
  expect(m.storniert[0]).toEqual(['ereignis', String(wechsel?.['client_id'])]);
  await expect.poll(() => antworten(m).length).toBe(4);
  const korrektur = antworten(m)[3];
  expect(korrektur?.['ersetzt_id']).toBe(wechsel?.['id']);
  expect(korrektur?.['gilt_ab']).toBe('2027-01-22T11:00:00.000Z');
  expect(daten(korrektur)).toMatchObject({ phase: 'wachstum', antwort: 'ja' });
  await expect(verlauf.getByText('Korrektur am 23.1.: Wachstum ab 22.1.', { exact: true })).toBeVisible();
  await expect(verlauf.getByText('23.1. Wachstum: Ja', { exact: true })).toHaveCount(0);
});

test('R1.6 Karte «Phasen nachführen» mit [Alle übernehmen] in einem Tipp', async ({ page }) => {
  const m = await mitDaten(page, rueckdatiertTeile(), RUECK_JETZT, '/#/heute', 'Heute');
  const nachfuehren = karte(page, 'Phasen nachführen (2 Sätze)');
  await expect(nachfuehren).toHaveCount(1);
  await expect(nachfuehren.getByText(/Lollo Rossa/).first()).toBeVisible();
  await expect(nachfuehren.getByText(/Ochsenherz/).first()).toBeVisible();
  // keine Einzelfrage vor dem Erfassungstag
  await expect(page.getByRole('button', { name: 'Alle Ja', exact: true })).toHaveCount(0);

  await tipp(m, knopf(nachfuehren, 'Alle übernehmen').first());
  expect(m.beruehrungen).toBe(1);
  await expect.poll(() => antworten(m).length).toBe(2);
  const nach = (nr: number) => antworten(m).find((z) => z['satz_id'] === satzId(nr));
  expect(daten(nach(70))).toMatchObject({
    phase: 'anzucht',
    antwort: 'ja',
    nachgefuehrt: true,
    erwartet_am: '2027-01-05',
  });
  expect(nach(70)?.['gilt_ab']).toBe('2027-01-05T11:00:00.000Z');
  expect(daten(nach(71))).toMatchObject({ phase: 'anzucht', nachgefuehrt: true, erwartet_am: '2027-01-08' });
  expect(nach(71)?.['gilt_ab']).toBe('2027-01-08T11:00:00.000Z');
  for (const z of antworten(m)) expect(z['pflanzung_id'] ?? null).toBeNull();
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  await expect(karte(page, 'Phasen nachführen (2 Sätze)')).toHaveCount(0);
});

test('R1.5 Pflanzenansicht ohne Systemtastatur, data-density regal, Kopf ohne Scrollen', async ({ page }) => {
  await mitDaten(
    page,
    buendelTeile(JETZT, { ohneSpaete: true }),
    JETZT,
    `/#/pflanze/${pflanzungVon(61, 1)}`,
    'Pflanze',
  );
  await ohneTastatur(page);
  const main = page.locator('main');
  await expect(main.getByText('Lollo Rossa · Kopf · 4.4', { exact: true })).toBeVisible();
  await expect(main.getByText('Tag 16 seit Saat', { exact: true })).toBeVisible();
  const phase = main.getByText('Anzucht · Tag 12 von 10–14', { exact: true });
  await expect(phase).toBeVisible();
  await expect(main.getByText(/Wachstum frühestens 21\.1\., typisch 23\.1\./)).toBeVisible();
  // Kopf und Phasenstand ohne Scrollen
  const kasten = await phase.boundingBox();
  expect(kasten).not.toBeNull();
  expect((kasten?.y ?? 0) + (kasten?.height ?? 0)).toBeLessThanOrEqual(640);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  // Aktionen 68 dp
  const wechseln = knopf(main, 'Phase wechseln');
  await expect(wechseln).toBeEnabled();
  expect((await wechseln.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  await expect(knopf(main, 'Noch nicht')).toBeVisible();
  await expect(knopf(main, 'Problem')).toBeVisible();

  // Ochsenherz in Anzucht seit 14.1. (min 21): «Phase wechseln» gesperrt bis 4.2.
  await page.goto(`/#/pflanze/${pflanzungVon(64, 1)}`);
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  await expect(main.getByText(/Ochsenherz/).first()).toBeVisible();
  await expect(knopf(main, 'Phase wechseln')).toBeDisabled();
  await expect(main.getByText(/möglich ab 4\.2\./)).toBeVisible();
  await ohneTastatur(page);
});
