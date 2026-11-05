// Maske «Keimung prüfen» (Plan 24 Testliste; UC6-AK9, UC6, TO2, TO8). REST nachgebildet (Plan 18 A7): POST und PATCH
// aus schreiben() landen im nachgebildeten Bündel, v_reservierung_aktiv, v_pflanzung_zustand und v_keimrate rechnet
// tests/fixtures/sichten.ts (pflanzSichtenNachrechnen) nach. Die Nachbildung filtert nicht: der Bündelteil
// ereignis_pflanzung erhält alle Zeilen der Tabelle ereignis. Teile aus tests/fixtures/keimung.ts: Satz Lollo Rossa in
// A1, gesät 7.1., 6 Schwämme à 2 Samen, Zieltöpfe 2.3.1 bis 2.3.5 (Schwamm 1 bis 5), Schwamm 6 Reserve; Stationen
// 4.4 und 4.5 frei. Feste Uhr 2027-01-11T08:00:00Z; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 24 offen ist; Streichung (1): die Vorbelegung im
// Stationsschritt wird nur bestätigt):
// - main mit data-density="regal", h1 «Keimung prüfen», Kopf «Lollo Rossa · Kopf · A1 · gesät 7.1. · Tag 4».
// - Schritt 1: je offener Schwamm ein Stepper (Baustein Stepper) mit dem Namen «Schwamm n …», Knöpfe «… weniger» und
//   «… mehr»; die Zeile nennt «Ziel 2.3.n» bzw. «Reserve». Wahl Keimtemperatur mit den Knöpfen «Ja» und «Nein».
//   «Weiter» bei Box mit gekeimten Schwämmen ohne Stationsplatz.
// - Schritt 2: Station 4.4 vorgewählt (Knopf, dessen Name mit «4.4» beginnt, aria-pressed="true"); Deckel mit Löchern
//   «Loch n, … Schwamm m»; «Keimung speichern».
// - Nach dem Speichern: Text «Gespeichert: …», «Rückgängig machen». Abschnitt «Keimt nicht» mit «Schwamm 4 · keimt nicht
//   seit 11.1.» und Knopf «Wiederherstellen»; danach «Schwamm 4 wiederhergestellt · Zieltopf 2.3.4 wieder reserviert».
// - Fehler beim Speichern: role="alert" mit «nicht gespeichert», Eingaben bleiben.
// - Heute: Listeneintrag mit «Keimung prüfen», «Lollo Rossa» und «R-A1» und dem Knopf «Prüfen» (Link oder Button);
//   Maske «Gefäss» R-A1: Knopf «Keimung prüfen» (Link oder Button) je Satzzeile.
// - Kein Eingabefeld, das die Systemtastatur öffnet.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { KEIM_JETZT, KEIM_SATZ, keimTeile, P } from '../fixtures/keimung.ts';
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
const PFAD = `/#/keimung/${KEIM_SATZ}`;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  storniert: [string, string][];
  beruehrungen: number;
}

const nachrechnen = (t: Teile) => pflanzSichtenNachrechnen(sichtenNachrechnen(t));

async function mitDaten(
  page: Page,
  start: Teile,
  pfad = PFAD,
  ueberschrift = 'Keimung prüfen',
): Promise<Mitschnitt> {
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
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
      stornoAufnehmen(m.daten, tabelle, clientId, JETZT);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
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
const weniger = (page: Page, nr: number) =>
  page.getByRole('button', { name: new RegExp(`^Schwamm ${nr}(?!\\d).* weniger$`) });
const ereignisse = (m: Mitschnitt, typ: string) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === typ).map(([, z]) => z);
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

/** Maske «Säen» mit Ziel 2.3 bis zum Deckel öffnen (neu geladen, damit das Bündel den Stand zeigt) */
async function deckel23(page: Page): Promise<void> {
  await page.goto('/#/saeen?ziel=R-2.3');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await page
    .getByRole('button', { name: /^Lollo Rossa/ })
    .first()
    .click();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
}

test('UC6-AK9 Keimung versehentlich mit 0 erfasst: nach dem Wiederherstellen ist der Zieltopf wieder reserviert', async ({
  page,
}) => {
  const m = await mitDaten(page, keimTeile());
  await expect(page.getByText('Lollo Rossa · Kopf · A1 · gesät 7.1. · Tag 4')).toBeVisible();
  await expect(page.getByText(/Ziel 2\.3\.4/).first()).toBeVisible();

  // Schwamm 4 (Zieltopf 2.3.4) von 2 auf 0, Keimtemperatur ja, Station bestätigen, speichern: 5 Berührungen
  await tipp(m, weniger(page, 4));
  await tipp(m, weniger(page, 4));
  await expect(page.getByText(/Zieltopf 2\.3\.4 wird frei/).first()).toBeVisible();
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  expect(m.beruehrungen).toBe(5);

  await expect.poll(() => ereignisse(m, 'abschluss').length).toBe(1);
  const keimung4 = ereignisse(m, 'keimung').find((z) => z['pflanzung_id'] === P[4]);
  expect(daten(keimung4)).toMatchObject({ samen_gesaet: 2, samen_gekeimt: 0, keimtemp_eingehalten: true });
  const [abschluss] = ereignisse(m, 'abschluss');
  expect(abschluss?.['pflanzung_id']).toBe(P[4]);
  expect(daten(abschluss)['grund']).toBe('keimt_nicht');

  // nachgerechnet: Topf 2.3.4 ist frei
  await deckel23(page);
  await expect(page.getByRole('button', { name: 'Loch 4, frei' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Loch 5, reserviert' })).toBeVisible();

  // zurück in die Keimprüfung: Schwamm 4 keimt nicht, wiederherstellen
  await page.goto(PFAD);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();
  await expect(page.getByText('Schwamm 4 · keimt nicht seit 11.1.').first()).toBeVisible();
  await knopf(page, 'Wiederherstellen').click();
  await expect(
    page.getByText(/Schwamm 4 wiederhergestellt · Zieltopf 2\.3\.4 wieder reserviert/),
  ).toBeVisible();
  await expect.poll(() => ereignisse(m, 'wiederherstellen').length).toBe(1);
  const [wieder] = ereignisse(m, 'wiederherstellen');
  expect(wieder?.['pflanzung_id']).toBe(P[4]);
  expect(daten(wieder)['ereignis_id']).toBe(abschluss?.['id']);
  // Schwamm 4 steht wieder offen in Schritt 1
  await expect(weniger(page, 4)).toBeVisible();

  // nachgerechnet: Topf 2.3.4 wieder reserviert
  await deckel23(page);
  const loch4 = page.getByRole('button', { name: 'Loch 4, reserviert' });
  await expect(loch4).toBeVisible();
  await expect(loch4).toHaveText('res.');
});

test('UC6 Rückgängig sendet Storno für alle Zeilen', async ({ page }) => {
  const m = await mitDaten(page, keimTeile());
  await tipp(m, weniger(page, 4));
  await tipp(m, weniger(page, 4));
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'verschieben').length).toBe(5);
  const geschrieben = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`);
  await tipp(m, knopf(page, 'Rückgängig machen'));
  await expect.poll(() => m.storniert.length).toBe(geschrieben.length);
  // umgekehrte Reihenfolge
  expect(m.storniert.map(([t, id]) => `${t}:${id}`)).toEqual([...geschrieben].reverse());
  // danach wieder alle Reservierungen aktiv
  expect((m.daten['v_reservierung_aktiv'] ?? []).length).toBe(5);
});

test('UC6 Einstieg aus Heute und aus der Maske Gefäss A1', async ({ page }) => {
  await mitDaten(page, keimTeile(), '/#/heute', 'Heute');
  const eintrag = page
    .getByRole('listitem')
    .filter({ hasText: 'Keimung prüfen' })
    .filter({ hasText: 'Lollo Rossa' })
    .filter({ hasText: 'R-A1' });
  await expect(eintrag).toHaveCount(1);
  await knopf(eintrag, 'Prüfen').click();
  await expect(page).toHaveURL(new RegExp(`#/keimung/${KEIM_SATZ}$`));
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();
  // Heute auf 360 dp ohne waagrechtes Scrollen
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await page.goto('/#/gefaess/R-A1');
  await expect(page.getByText(/Lollo Rossa/).first()).toBeVisible();
  await knopf(page.locator('main'), 'Keimung prüfen').click();
  await expect(page).toHaveURL(new RegExp(`#/keimung/${KEIM_SATZ}$`));
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();
});

test('UC6 Stationsschritt mit Vorbelegung auf 4.4, Speichern sendet verschieben', async ({ page }) => {
  const m = await mitDaten(page, keimTeile());
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  // 5 Zieltöpfe → höchstens 6 auf 5 cm: alle sechs Schwämme auf 4.4 Loch 1 bis 6
  await expect(page.getByRole('button', { name: /^4\.4/ }).first()).toHaveAttribute('aria-pressed', 'true');
  for (let n = 1; n <= 6; n += 1)
    await expect(page.getByRole('button', { name: new RegExp(`^Loch ${n}, .*Schwamm ${n}$`) })).toBeVisible();
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'verschieben').length).toBe(6);
  const verschieben = ereignisse(m, 'verschieben');
  expect(verschieben.map((z) => z['pflanzung_id'])).toEqual(P.slice(1, 7));
  verschieben.forEach((z, i) =>
    expect(daten(z)).toMatchObject({
      von_platz_id: platzId('A1'),
      nach_platz_id: platzId('4.4'),
      nach_loch_nr: i + 1,
    }),
  );
  expect(ereignisse(m, 'keimung')).toHaveLength(6);
  expect(ereignisse(m, 'abschluss')).toEqual([]);
  // die Keimung kommt vor dem Stationseintritt
  const typen = m.geschrieben.map(([, z]) => z['typ']);
  expect(typen.lastIndexOf('keimung')).toBeLessThan(typen.indexOf('verschieben'));
});

test('UC6 Maske ohne Systemtastatur (kein input mit Tastatur), data-density regal', async ({ page }) => {
  const m = await mitDaten(page, keimTeile());
  await ohneTastatur(page);
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByRole('button', { name: /^Loch 1, .*Schwamm 1$/ })).toBeVisible();
  await ohneTastatur(page);
  // «Keimung speichern» fest unten im Bild, 68 dp
  const speichern = await knopf(page, 'Keimung speichern').boundingBox();
  expect(speichern).not.toBeNull();
  expect((speichern?.y ?? 0) + (speichern?.height ?? 0)).toBeLessThanOrEqual(640);
  expect(speichern?.height ?? 0).toBeGreaterThanOrEqual(68);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('TO8 Speichern ohne Netz: «nicht gespeichert», Eingaben bleiben', async ({ page, context }) => {
  const m = await mitDaten(page, keimTeile());
  let ohneNetz = false;
  await page.route(`${REST}/**`, async (route) => {
    if (ohneNetz && route.request().method() !== 'GET') return route.abort('internetdisconnected');
    return route.fallback();
  });
  await tipp(m, weniger(page, 4));
  await tipp(m, weniger(page, 4));
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));

  ohneNetz = true;
  await context.setOffline(true);
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  await expect(page.getByText(/Gespeichert: /)).toHaveCount(0);
  await expect(knopf(page, 'Keimung speichern')).toBeVisible();
  expect(m.geschrieben).toEqual([]);
  // Eingaben bleiben: zurück zu Schritt 1, Schwamm 4 steht auf 0, Keimtemperatur Ja gewählt
  await knopf(page, 'Zurück').click();
  await expect(page.getByRole('group', { name: /^Schwamm 4(?!\d)/ })).toContainText('0');
  await expect(knopf(page, 'Ja')).toHaveAttribute('aria-pressed', 'true');

  await context.setOffline(false);
  ohneNetz = false;
});

test('TO2 Wiederholung nach Fehler sendet dieselben client_id', async ({ page }) => {
  const m = await mitDaten(page, keimTeile());
  // der erste Schreibversuch scheitert mit 503, danach antwortet die Nachbildung
  let fehler = true;
  const versucht: string[] = [];
  await page.route(`${REST}/**`, async (route) => {
    const anfrage = route.request();
    if (anfrage.method() === 'POST') {
      const roh = (anfrage.postDataJSON() ?? {}) as Record<string, unknown> | Record<string, unknown>[];
      for (const z of Array.isArray(roh) ? roh : [roh]) versucht.push(String(z['client_id']));
      if (fehler) {
        fehler = false;
        return route.fulfill({ status: 503, json: { message: 'nicht verfügbar' } });
      }
    }
    return route.fallback();
  });
  await tipp(m, weniger(page, 4));
  await tipp(m, weniger(page, 4));
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  const ersterVersuch = new Set(versucht);
  expect(ersterVersuch.size).toBeGreaterThan(0);

  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'verschieben').length).toBe(5);
  const gesendet = m.geschrieben.map(([, z]) => String(z['client_id']));
  // jede Zeile genau einmal angekommen, und die IDs des ersten Versuchs sind dabei
  expect(new Set(gesendet).size).toBe(gesendet.length);
  for (const id of ersterVersuch) expect(gesendet, id).toContain(id);
  expect(ereignisse(m, 'keimung')).toHaveLength(6);
  expect(ereignisse(m, 'abschluss')).toHaveLength(1);
});
