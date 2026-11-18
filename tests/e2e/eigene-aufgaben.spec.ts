// Eigene wiederkehrende Aufgaben (Issue #249, Plan 249 Testliste «E2E» und Abschnitt «Oberfläche»; EA-AK6, EA-AK7;
// Konzept R5.1 bis R5.3, U9; 05_masken 4; Button.md, TextField.md, Meldezeile.md; Plan 224). REST nachgebildet
// (tests/e2e/rest.ts) mit einem Stand, der Geschriebenes übernimmt: POST fügt an (erfasst_am und storniert_am wie die
// Datenbank), PATCH setzt storniert_am. Feste Uhr Di 12.1.2027 10:00 Zürich, Europe/Zurich und 360 × 640 aus der
// Konfiguration. Datenstände: regalTeile() (tests/fixtures/regal.ts) für die Maske Anlage, grundstand()
// (tests/unit/aufgaben-fixture.ts) für Heute. Keine Personendaten.
//
// Erwartete Oberfläche (Plan 249 «Oberfläche»; vom Testentwickler festgelegt, wo der Plan offen ist):
// - Maske Anlage (`#/anlage?a=R`, Router: Kürzel als Parameter a): Überschrift h2 «Eigene Aufgaben»; je Definition
//   eine Card (`.hv-card`) mit Titel h3 = Name und Meta «alle n Tage · heute fällig» bzw. «alle n Tage · fällig T.M.»;
//   im Fuss die Buttons «Ändern» und «Entfernen». Darunter der Button «Aufgabe hinzufügen».
// - Formular: TextField «Name» und «Intervall» (Beschriftung als label), Buttons «Speichern» (gesperrt: disabled oder
//   aria-disabled="true", solange eigeneEingabePruefen() meldet) und «Abbrechen». Fehlertexte «Bitte einen Namen
//   eingeben.» und «Bitte eine ganze Zahl zwischen 1 und 365 eingeben.».
// - «Entfernen» fragt nach: Notice «Aufgabe entfernen? Erledigungen bleiben erhalten.» mit «Entfernen» und «Abbrechen».
// - Heute: Liste «Aufgaben» (ul aria-label) mit der Zeile, Tasten «Erledigt», «Morgen», «Überspringen», ohne
//   «Öffnen»; Meldezeile `.hv-meldezeile[role="status"]` «Erledigt: <Name>» mit «Rückgängig machen».
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ANLAGE_R, regalTeile } from '../fixtures/regal.ts';
import { ANLAGE, grundstand } from '../unit/aufgaben-fixture.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;
type Teile = Record<string, Zeile[]>;

/** Di 12.1.2027 10:00 Zürich */
const JETZT = new Date('2027-01-12T09:00:00.000Z');
const NAME = 'Zelt und Luftsteine reinigen';
const FILTER = 'Luftfilter wechseln';
const FILTER_ID = 'f2490000-0000-4000-8000-0000000000f1';
const ZELT_ID = 'f2490000-0000-4000-8000-0000000000e1';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
}

const definition = (z: Zeile & { id: string; anlage_id: string }): Zeile => ({
  client_id: z.id,
  name: NAME,
  intervall_d: 30,
  letzte_erledigung: null,
  ersetzt_id: null,
  erfasst_am: JETZT.toISOString(),
  app_version: 'test',
  storniert_am: null,
  ...z,
});

/** REST nachbilden, Uhr setzen, Seite öffnen; geschriebene Zeilen und Stornos landen im Datenstand */
async function oeffnen(page: Page, teile: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(teile), geschrieben: [], storniert: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        const neu: Zeile = { storniert_am: null, ...z };
        if (tabelle === 'eigene_aufgabe') {
          neu['erfasst_am'] ??= JETZT.toISOString();
          neu['ersetzt_id'] ??= null;
          neu['letzte_erledigung'] ??= null;
        }
        if (tabelle === 'ereignis') {
          neu['gilt_ab'] ??= JETZT.toISOString();
          neu['daten'] ??= {};
          neu['platz_id'] ??= null;
        }
        (m.daten[tabelle] ??= []).push(neu);
      }
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      for (const z of m.daten[tabelle] ?? [])
        if (z['client_id'] === clientId && (z['storniert_am'] ?? null) === null)
          z['storniert_am'] = felder['storniert_am'] ?? JETZT.toISOString();
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await page.reload();
  return m;
}

const karte = (page: Page, name: string) =>
  page.locator('.hv-card').filter({ has: page.getByRole('heading', { level: 3, name, exact: true }) });
const taste = (ort: Page | Locator, name: string) => ort.getByRole('button', { name, exact: true });
const feld = (page: Page, name: 'Name' | 'Intervall') => page.getByLabel(name, { exact: true });
const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

/** gesperrt: disabled oder aria-disabled="true" */
async function gesperrt(ort: Locator, erwartet: boolean, was: string): Promise<void> {
  await expect
    .poll(
      () =>
        ort.evaluate(
          (e) => (e instanceof HTMLButtonElement && e.disabled) || e.getAttribute('aria-disabled') === 'true',
        ),
      { message: was },
    )
    .toBe(erwartet);
}

async function mindestHoehe(ort: Locator, px: number, was: string): Promise<void> {
  expect((await ort.boundingBox())?.height ?? 0, was).toBeGreaterThanOrEqual(px);
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  const breite = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    sicht: document.documentElement.clientWidth,
  }));
  expect(breite.scroll, 'kein waagrechtes Scrollen').toBeLessThanOrEqual(breite.sicht);
}

test('EA-AK6 Maske Anlage: anlegen, Intervall auf 28 ändern, zweite Aufgabe entfernen; Speichern gesperrt bei leerem Namen oder Intervall ausserhalb 1 bis 365', async ({
  page,
}) => {
  const teile = regalTeile(JETZT) as Teile;
  teile['eigene_aufgabe'] = [
    definition({
      id: FILTER_ID,
      anlage_id: ANLAGE_R,
      name: FILTER,
      intervall_d: 90,
      erfasst_am: '2027-01-05T08:00:00.000Z',
    }),
  ];
  const m = await oeffnen(page, teile, '/#/anlage?a=R');
  await expect(page.getByRole('heading', { level: 2, name: 'Eigene Aufgaben', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(karte(page, FILTER)).toHaveCount(1);
  await expect(karte(page, NAME)).toHaveCount(0);

  // anlegen
  const hinzufuegen = taste(page, 'Aufgabe hinzufügen');
  await mindestHoehe(hinzufuegen, 48, 'Aufgabe hinzufügen');
  await hinzufuegen.click();
  await expect(feld(page, 'Name')).toBeVisible();
  await expect(feld(page, 'Intervall')).toBeVisible();
  const speichern = taste(page, 'Speichern');
  await expect(taste(page, 'Abbrechen')).toBeVisible();
  await mindestHoehe(speichern, 48, 'Speichern');

  // Speichern gesperrt: leerer Name, Intervall 0, 366 und «abc»
  await feld(page, 'Intervall').fill('30');
  await feld(page, 'Name').fill('x');
  await feld(page, 'Name').fill('');
  await gesperrt(speichern, true, 'leerer Name');
  await expect(page.getByText('Bitte einen Namen eingeben.')).toBeVisible();
  await feld(page, 'Name').fill(NAME);
  for (const wert of ['0', '366', 'abc']) {
    await feld(page, 'Intervall').fill(wert);
    await gesperrt(speichern, true, `Intervall ${wert}`);
    await expect(page.getByText('Bitte eine ganze Zahl zwischen 1 und 365 eingeben.')).toBeVisible();
  }
  await feld(page, 'Intervall').fill('30');
  await gesperrt(speichern, false, 'gültige Eingabe');
  await expect(page.getByText('Bitte eine ganze Zahl zwischen 1 und 365 eingeben.')).toHaveCount(0);
  await speichern.click();

  await expect(karte(page, NAME)).toHaveCount(1);
  await expect(karte(page, NAME)).toContainText('alle 30 Tage · heute fällig');
  const angelegt = zeilenVon(m, 'eigene_aufgabe');
  expect(angelegt).toHaveLength(1);
  expect(angelegt[0]).toMatchObject({ anlage_id: ANLAGE_R, name: NAME, intervall_d: 30 });
  expect(angelegt[0]?.['ersetzt_id'] ?? null).toBeNull();
  const ersteId = angelegt[0]?.['id'];
  const ersteClient = angelegt[0]?.['client_id'];
  expect(typeof ersteId).toBe('string');
  expect(typeof ersteClient).toBe('string');

  // ändern: Intervall 28
  const aendern = taste(karte(page, NAME), 'Ändern');
  await mindestHoehe(aendern, 48, 'Ändern');
  await aendern.click();
  await expect(feld(page, 'Name')).toHaveValue(NAME);
  await expect(feld(page, 'Intervall')).toHaveValue('30');
  await feld(page, 'Intervall').fill('28');
  await taste(page, 'Speichern').click();

  await expect(karte(page, NAME)).toHaveCount(1);
  await expect(karte(page, NAME)).toContainText('alle 28 Tage');
  const nachfolger = zeilenVon(m, 'eigene_aufgabe').slice(1);
  expect(nachfolger).toHaveLength(1);
  expect(nachfolger[0]).toMatchObject({
    anlage_id: ANLAGE_R,
    name: NAME,
    intervall_d: 28,
    ersetzt_id: ersteId,
  });
  await expect
    .poll(() => m.storniert.filter(([t]) => t === 'eigene_aufgabe').map(([, id]) => id))
    .toEqual([ersteClient]);
  expect(m.storniert[0]?.[2]['storniert_am']).toBeTruthy();

  // zweite Aufgabe entfernen: Rückfrage, dann Storno
  const filterKarte = karte(page, FILTER);
  await taste(filterKarte, 'Entfernen').click();
  const rueckfrage = page.locator('.hv-notice').filter({ hasText: 'Aufgabe entfernen?' });
  await expect(rueckfrage).toContainText('Aufgabe entfernen? Erledigungen bleiben erhalten.');
  // vor der Bestätigung nichts storniert
  expect(m.storniert.some(([, id]) => id === FILTER_ID)).toBe(false);
  await expect(taste(rueckfrage, 'Abbrechen')).toBeVisible();
  await taste(rueckfrage, 'Entfernen').click();
  await expect(filterKarte).toHaveCount(0);
  await expect
    .poll(() => m.storniert.some(([t, id]) => t === 'eigene_aufgabe' && id === FILTER_ID))
    .toBe(true);
  expect(m.storniert.find(([, id]) => id === FILTER_ID)?.[2]['storniert_am']).toBeTruthy();
  // die geänderte Aufgabe bleibt
  await expect(karte(page, NAME)).toHaveCount(1);

  await ohneWaagrechtesScrollen(page);
});

test('EA-AK7 Heute: fällige eigene Aufgabe in der Liste Aufgaben mit drei Tasten, Erledigt nimmt sie weg, Rückgängig machen bringt sie zurück', async ({
  page,
}) => {
  const teile = grundstand() as Teile;
  teile['eigene_aufgabe'] = [
    definition({ id: ZELT_ID, anlage_id: ANLAGE.R, erfasst_am: '2027-01-12T07:00:00.000Z' }),
  ];
  const m = await oeffnen(page, teile, '/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });

  const liste = page.getByRole('list', { name: 'Aufgaben', exact: true });
  const zeile = liste.getByRole('listitem').filter({ hasText: NAME });
  await expect(zeile).toHaveCount(1);
  for (const name of ['Erledigt', 'Morgen', 'Überspringen']) {
    const t = taste(zeile, name);
    await expect(t, name).toBeVisible();
    await mindestHoehe(t, 68, `${name} im Regal`);
  }
  await expect(zeile.getByRole('link', { name: 'Öffnen' }).or(taste(zeile, 'Öffnen'))).toHaveCount(0);

  // Erledigt
  await taste(zeile, 'Erledigt').click();
  await expect(zeile).toHaveCount(0);
  const meldezeile = page.locator('.hv-meldezeile[role="status"]');
  await expect(meldezeile).toContainText(`Erledigt: ${NAME}`);
  const ereignisse = zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'aufgabe_erledigt');
  expect(ereignisse).toHaveLength(1);
  expect(ereignisse[0]).toMatchObject({
    anlage_id: ANLAGE.R,
    aufgabe_schluessel: `eigene_aufgabe|${ZELT_ID}|2027-01-12`,
    war_faellig_am: '2027-01-12',
  });
  expect(ereignisse[0]?.['platz_id'] ?? null).toBeNull();

  // Rückgängig machen (nach der Sperre von 400 ms)
  const rueckgaengig = meldezeile.getByRole('button', { name: 'Rückgängig machen', exact: true });
  await expect(rueckgaengig).toBeVisible();
  await expect(rueckgaengig).not.toHaveAttribute('aria-disabled', 'true');
  await expect(rueckgaengig).toBeEnabled();
  await page.waitForTimeout(450);
  await rueckgaengig.click();
  await expect
    .poll(() => m.storniert.find(([t, id]) => t === 'ereignis' && id === ereignisse[0]?.['client_id']))
    .toBeTruthy();
  await expect(liste.getByRole('listitem').filter({ hasText: NAME })).toHaveCount(1);
});
