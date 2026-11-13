// Maske «Säen» (Plan 23 Testliste; UC5-AK1, R6.1, UC5). REST nachgebildet (Plan 18 A7): POST und PATCH aus
// schreiben() werden mitgeschnitten. Regal R aus tests/fixtures/saeen.ts ohne den Satz in 2.3 (alle sechs Töpfe
// frei), zwei Lichtkeimer-Sorten Lollo Rossa und Eichblatt mit Saatempfehlung, Packung, umsetzen_ab_d und
// Keimwerten in v_sollwert. Feste Uhr 2027-01-07T08:00:00Z; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 23 offen ist):
// - main mit data-density="regal", h1 «Säen», Text «Schritt n von 3»; mit Box aus der Adresse «Anzuchtbox A1 ·
//   Lichtkeimer».
// - Schritt 1: Sorten als Buttons (Choice, aria-pressed), deren Name mit dem Sortennamen beginnt; «Weiter».
// - Schritt 2: Zielgefässe als Buttons, deren Name mit der Kennung beginnt («2.3 …»); Sortenleiste mit Buttons, deren
//   Name den Sortennamen enthält und nicht mit «Loch» beginnt; Deckel mit «Reihe n wählen» und «Loch n, …»;
//   «Ziel später»; «Weiter». Die zuerst gewählte Sorte ist aktiv; Reihe n gibt der aktiven Sorte die freien
//   Löcher der Reihe (D2 «3, 3» spaltenweise, #136: Reihe 1 = Loch 1, 3, 5, Reihe 2 = Loch 2, 4, 6;
//   UC5-AK1: Lollo Rossa mit Reihe 1, Eichblatt mit Loch 2, 4, 6 einzeln).
// - Schritt 3: «Säen speichern» (Button), Stationsvorschau «Station am TT.MM.: frei x von 32 (5 cm), y von 8 (8 cm)»,
//   Warnung «Zu wenig Platz auf der Station am …» ohne Sperre.
// - Nach dem Speichern: «Gespeichert: 2 Sätze, m Schwämme» bzw. «Gespeichert: 1 Satz, m Schwämme» und
//   «Rückgängig machen».
// - Kein Eingabefeld, das die Systemtastatur öffnet (input für Text oder Zahl, textarea, select, contenteditable).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { netztopfId, platzId, type Teile } from '../fixtures/regal.ts';
import { aufStation, saatTeile, SORTE, STATION_5CM } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  storniert: [string, string][];
  beruehrungen: number;
}

async function mitDaten(page: Page, start: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], storniert: [], beruehrungen: 0 };
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
    },
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  return m;
}

/** jede Berührung über diese Hilfe zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

const sortenleiste = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^(?!Loch ).*${name}`) }).first();
const zielgefaess = (page: Page, kennung: string) =>
  page.getByRole('button', { name: new RegExp(`^${kennung.replace('.', '\\.')}(?![.\\d])`) }).first();
const knopf = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const reihe = (page: Page, n: number) => page.getByRole('button', { name: `Reihe ${n} wählen` });
const loch = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Loch ${n},`) });

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

const regal = () => saatTeile(JETZT, { ohneSatzIn23: true });

test('UC5-AK1 6 Zieltöpfe in 2.3 mit 2 Sorten, Anzucht in A1, in höchstens 14 Berührungen und 3 Schritten', async ({
  page,
}) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await expect(page.getByText('Anzuchtbox A1 · Lichtkeimer')).toBeVisible();

  // Schritt 1: zwei Sorten
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await sorteWaehlen(page, 'Salat', 'Eichblatt', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));

  // Schritt 2: Malmodus in 2.3
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await tipp(m, zielgefaess(page, '2.3'));
  await expect(page.getByRole('button', { name: /^Loch \d+,/ })).toHaveCount(6);
  await tipp(m, sortenleiste(page, 'Lollo Rossa'));
  await tipp(m, reihe(page, 1));
  await tipp(m, sortenleiste(page, 'Eichblatt'));
  await tipp(m, loch(page, 2));
  await tipp(m, loch(page, 4));
  await tipp(m, loch(page, 6));
  // Zustand im Namen, nie nur Farbe
  await expect(page.getByRole('button', { name: /^Loch \d+, gewählt für / })).toHaveCount(6);
  await tipp(m, knopf(page, 'Weiter'));

  // Schritt 3: Speichern
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 2 Sätze, \d+ Schwämme/)).toBeVisible();
  expect(m.beruehrungen).toBeLessThanOrEqual(14);

  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(6);
  const vorgaenge = zeilenVon(m, 'pflanzvorgang');
  expect(vorgaenge).toHaveLength(1);
  expect(vorgaenge[0]?.['einstieg']).toBe('scan');
  const saetze = zeilenVon(m, 'satz');
  expect(saetze).toHaveLength(2);
  for (const s of saetze) expect(s['anzuchtort_platz_id']).toBe(platzId('A1'));
  expect(new Set(saetze.map((s) => s['sorte_id']))).toEqual(new Set([SORTE.lollo, SORTE.eichblatt]));
  const pflanzungen = zeilenVon(m, 'pflanzung');
  expect(pflanzungen.length).toBe(vorgaenge[0]?.['anzahl_pflanzungen']);
  expect(pflanzungen.length).toBe(saetze.reduce((n, s) => n + Number(s['anzahl_schwaemme']), 0));

  // je Sorte drei Töpfe (D2 «3, 3», #136): Lollo Rossa 1, 3, 5 (Reihe 1); Eichblatt 2, 4, 6 (Einzellöcher)
  const satzVon = (pflanzungId: unknown) => pflanzungen.find((p) => p['id'] === pflanzungId)?.['satz_id'];
  const sorteVon = (satzId: unknown) => saetze.find((s) => s['id'] === satzId)?.['sorte_id'];
  const toepfeVon = (sorte: string) =>
    zeilenVon(m, 'reservierung')
      .filter((r) => sorteVon(satzVon(r['pflanzung_id'])) === sorte)
      .map((r) => r['netztopf_id'])
      .sort();
  expect(toepfeVon(SORTE.lollo)).toEqual(['2.3.1', '2.3.3', '2.3.5'].map((k) => netztopfId(k)).sort());
  expect(toepfeVon(SORTE.eichblatt)).toEqual(['2.3.2', '2.3.4', '2.3.6'].map((k) => netztopfId(k)).sort());
});

test('R6.1 Stationsvorschau und Warnung ohne Sperre, Speichern bleibt möglich', async ({ page }) => {
  // 30 von 32 Plätzen 5 cm belegt (Rucola, gesät 30.12., bis 13.1. auf der Station); Lollo Rossa keimt am 11.1.
  const t = regal();
  aufStation(t, {
    satzNr: 50,
    sorteId: SORTE.rucola,
    saatdatum: '2026-12-30',
    loecher: STATION_5CM.slice(0, 30),
  });
  const m = await mitDaten(page, t, '/#/saeen?box=R-A1');
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, zielgefaess(page, '2.3'));
  await tipp(m, reihe(page, 1));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await expect(
    page.getByText(/Station am 11\.1\.: frei \d+ von 32 \(5 cm\), \d+ von 8 \(8 cm\)/),
  ).toBeVisible();
  await expect(page.getByText(/Zu wenig Platz auf der Station am 11\.1\./)).toBeVisible();
  await expect(knopf(page, 'Säen speichern')).toBeEnabled();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(3); // Reihe 1 von D2 «3, 3» (#136)
  expect(zeilenVon(m, 'pflanzvorgang')).toHaveLength(1);
});

test('UC5 Ziel später speichert ohne Reservierung', async ({ page }) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await sorteWaehlen(page, 'Salat', 'Eichblatt', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Ziel später'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'pflanzung').length).toBeGreaterThan(0);
  expect(zeilenVon(m, 'satz')).toHaveLength(1);
  expect(zeilenVon(m, 'satz')[0]?.['anzuchtort_platz_id']).toBe(platzId('A1'));
  expect(zeilenVon(m, 'reservierung')).toEqual([]);
});

test('UC5 Rückgängig sendet Storno für alle Zeilen', async ({ page }) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, zielgefaess(page, '2.3'));
  await tipp(m, reihe(page, 1));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(3); // Reihe 1 von D2 «3, 3» (#136)
  const geschrieben = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`).sort();
  await tipp(m, knopf(page, 'Rückgängig machen'));
  await expect.poll(() => m.storniert.length).toBe(geschrieben.length);
  expect(m.storniert.map(([t, id]) => `${t}:${id}`).sort()).toEqual(geschrieben);
  // umgekehrte Reihenfolge: die Reservierungen zuerst, der Pflanzvorgang zuletzt
  expect(m.storniert[0]?.[0]).toBe('reservierung');
  expect(m.storniert.at(-1)?.[0]).toBe('pflanzvorgang');
});

test('UC5 Maske ohne Systemtastatur (kein input mit Tastatur)', async ({ page }) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await ohneTastatur(page);
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await tipp(m, zielgefaess(page, '2.3'));
  await ohneTastatur(page);
  await tipp(m, reihe(page, 1));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await ohneTastatur(page);
  // «Säen speichern» ohne Scrollen im Bild (fest unten, A16)
  const speichern = await knopf(page, 'Säen speichern').boundingBox();
  expect(speichern).not.toBeNull();
  expect((speichern?.y ?? 0) + (speichern?.height ?? 0)).toBeLessThanOrEqual(640);
  expect(speichern?.height ?? 0).toBeGreaterThanOrEqual(68);
});

test('TO8 Säen ohne Netz: «nicht gespeichert», Schritt 3 mit Eingaben bleibt, erneut senden speichert genau einen Vorgang', async ({
  page,
  context,
}) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  // ohne Netz: das Gerät ist offline und jeder Schreibzugriff scheitert wie ohne Verbindung (auch an page.route)
  let ohneNetz = false;
  const versucht: string[] = [];
  await page.route('http://127.0.0.1:54321/rest/v1/**', async (route) => {
    const anfrage = route.request();
    if (ohneNetz && anfrage.method() !== 'GET') {
      const roh = (anfrage.postDataJSON() ?? {}) as Record<string, unknown> | Record<string, unknown>[];
      for (const z of Array.isArray(roh) ? roh : [roh]) versucht.push(String(z['client_id']));
      return route.abort('internetdisconnected');
    }
    return route.fallback();
  });

  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, zielgefaess(page, '2.3'));
  await tipp(m, reihe(page, 1));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();

  ohneNetz = true;
  await context.setOffline(true);
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await expect(page.getByText(/Lollo Rossa/).first()).toBeVisible();
  await expect(knopf(page, 'Säen speichern')).toBeVisible();
  await expect(page.getByText(/Gespeichert: /)).toHaveCount(0);
  expect(m.geschrieben).toEqual([]);

  // Netz zurück: erneut speichern schickt dieselben client_id (TO2)
  await context.setOffline(false);
  ohneNetz = false;
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(3); // Reihe 1 von D2 «3, 3» (#136)
  expect(zeilenVon(m, 'pflanzvorgang')).toHaveLength(1);
  expect(zeilenVon(m, 'satz')).toHaveLength(1);
  const ids = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`);
  expect(new Set(ids).size).toBe(ids.length);
  const geschrieben = new Set(m.geschrieben.map(([, z]) => String(z['client_id'])));
  for (const id of versucht) expect(geschrieben.has(id), id).toBe(true);
});

test('UC5 Heute auf 360 × 640 zeigt den Link «Säen» im Bild, ohne waagrechtes Scrollen', async ({ page }) => {
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(page, () => regal());
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  const saeen = page.getByRole('link', { name: 'Säen', exact: true });
  await expect(saeen).toBeVisible();
  const box = await saeen.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await saeen.click();
  await expect(page).toHaveURL(/#\/saeen$/);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
});
