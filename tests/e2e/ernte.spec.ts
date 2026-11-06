// Ernte, Kulturfrage in Heute und Wiederherstellen über «Kürzlich beendet» (Plan 38 Testliste; R1.7, U4).
// REST nachgebildet (Plan 18 A7) wie tests/e2e/phasen.spec.ts: POST und PATCH aus schreiben() landen im nachgebildeten
// Bündel; die Sichten rechnet ernteSichtenNachrechnen() aus tests/fixtures/ernte.ts nach (kultur_entscheid im Bündelteil
// ereignis_pflanzung). Teile aus tests/fixtures/ernte.ts; 360 × 640 aus der Konfiguration, Uhr mit
// page.clock.setFixedTime().
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 38 offen ist):
// - Pflanzenansicht #/pflanze/<pflanzung>: main mit data-density="regal", h1 «Pflanze», Kopf «Lollo Rossa · Schnitt ·
//   2.3» (wie Plan 35) ohne Scrollen; Text «Ernte möglich ab 18.2.»; Choice-Gruppe (role group) «Umfang» mit
//   «Dieser Topf» (aria-pressed true) und «Alle 2 im Satz»; Knopf «Teilernte» (primär, Klasse hv-btn-primary) und
//   darunter mit mindestens 68 px Abstand «Abernten» (nicht primär); bei Einmalernte nur «Abernten». Nach dem Speichern
//   ein Text mit «Gespeichert» und «Rückgängig machen». Beendet: StatusBadge «Geerntet am 18.2.», keine
//   Ernteknöpfe; Abschnitt mit Überschrift «Verlauf», Listeneintrag «18.3. Abgeerntet» mit Knopf «Wiederherstellen».
// - Heute: Card (section mit Überschrift) «Ernte und Kulturende» mit Listeneinträgen «Ernte möglich · Lollo Rossa»
//   (Link zur Pflanzenansicht) und «Kultur beenden oder verlängern? · Lollo Rossa» mit den Knöpfen «Beenden» und
//   «Verlängern um 14 Tage». Nach [Beenden] der Text «Beendet: 3 Pflanzen Lollo Rossa» und «Rückgängig machen».
// - Maske «Gefäss» #/gefaess/R-2.3: Liste mit Namen «Kürzlich beendet» mit einem Eintrag je beendete Pflanzung der
//   letzten 7 Tage (Sortenname) und Link zur Pflanzenansicht.
// - Kein Eingabefeld, das die Systemtastatur öffnet.
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  EISSALAT,
  ernteSichtenNachrechnen,
  ernteTeile,
  ERNTE_JETZT,
  LOLLO,
  SATZ,
} from '../fixtures/ernte.ts';
import type { Teile } from '../fixtures/regal.ts';
import { stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const L1 = LOLLO[1] as string;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  storniert: [string, string][];
  beruehrungen: number;
}

async function mitDaten(page: Page, jetzt: Date, pfad: string, ueberschrift: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: ernteTeile(), geschrieben: [], storniert: [], beruehrungen: 0 };
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
      ernteSichtenNachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
      stornoAufnehmen(m.daten, tabelle, clientId, jetzt);
      ernteSichtenNachrechnen(m.daten);
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
const karte = (page: Page, titel: string) =>
  page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]');
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

test('R1.7 Teilernte und Abernten in der Pflanzenansicht ohne Systemtastatur, Abernten sekundär und räumlich getrennt, Kopf ohne Scrollen', async ({
  page,
}) => {
  const jetzt = new Date('2027-02-18T08:00:00Z');
  const m = await mitDaten(page, jetzt, `/#/pflanze/${L1}`, 'Pflanze');
  await ohneTastatur(page);
  const main = page.locator('main');
  const kopf = main.getByText('Lollo Rossa · Schnitt · 2.3', { exact: true });
  await expect(kopf).toBeVisible();
  const kasten = await kopf.boundingBox();
  expect((kasten?.y ?? 0) + (kasten?.height ?? 0)).toBeLessThanOrEqual(640);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(main.getByText('Ernte möglich ab 18.2.', { exact: true })).toBeVisible();

  const umfang = main.getByRole('group', { name: 'Umfang' });
  await expect(umfang.getByRole('button', { name: 'Dieser Topf', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(umfang.getByRole('button', { name: 'Alle 2 im Satz', exact: true })).toBeVisible();

  const teilernte = main.getByRole('button', { name: 'Teilernte', exact: true });
  const abernten = main.getByRole('button', { name: 'Abernten', exact: true });
  await expect(teilernte).toHaveClass(/hv-btn-primary/);
  await expect(abernten).not.toHaveClass(/hv-btn-primary/);
  const t = await teilernte.boundingBox();
  const a = await abernten.boundingBox();
  expect(t?.height ?? 0).toBeGreaterThanOrEqual(68);
  expect(a?.height ?? 0).toBeGreaterThanOrEqual(68);
  // mindestens eine Tastenhöhe Abstand zwischen Teilernte und Abernten
  expect((a?.y ?? 0) - ((t?.y ?? 0) + (t?.height ?? 0))).toBeGreaterThanOrEqual(68);

  await tipp(m, teilernte);
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(1);
  const [teil] = ereignisse(m, 'ernte');
  expect(teil).toMatchObject({ pflanzung_id: L1, gilt_ab: jetzt.toISOString() });
  expect(daten(teil)).toEqual({ art: 'teil' });
  await expect(page.getByText(/Gespeichert/).first()).toBeVisible();
  await expect(knopf(page, 'Rückgängig machen')).toBeVisible();
  await expect(main.getByText('Ernte möglich ab 25.2.', { exact: true })).toBeVisible();

  await tipp(m, main.getByRole('button', { name: 'Abernten', exact: true }));
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(2);
  expect(daten(ereignisse(m, 'ernte')[1])).toEqual({ art: 'ab' });
  expect(ereignisse(m, 'abschluss')).toHaveLength(0);
  await expect(main.getByText('Geerntet am 18.2.', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Teilernte', exact: true })).toHaveCount(0);
  await ohneTastatur(page);
});

test('R1.7 Kulturfrage in Heute mit [Beenden] in einer Berührung, Rückgängig machen stellt den Satz wieder her', async ({
  page,
}) => {
  const m = await mitDaten(page, ERNTE_JETZT, '/#/heute', 'Heute');
  const ernte = karte(page, 'Ernte und Kulturende');
  await expect(ernte).toHaveCount(1);
  await expect(knopf(ernte, 'Ernte möglich · Lollo Rossa')).toHaveAttribute('href', `#/pflanze/${L1}`);
  const frage = ernte
    .getByRole('listitem')
    .filter({ hasText: 'Kultur beenden oder verlängern? · Lollo Rossa' });
  await expect(frage).toHaveCount(1);
  await expect(knopf(frage, 'Verlängern um 14 Tage')).toBeVisible();

  await tipp(m, knopf(frage, 'Beenden'));
  expect(m.beruehrungen).toBe(1);
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(3);
  const [entscheid] = ereignisse(m, 'kultur_entscheid');
  expect(entscheid).toMatchObject({
    satz_id: SATZ.lollo,
    war_faellig_am: '2027-03-18',
    aufgabe_schluessel: `kultur_entscheid|${SATZ.lollo}|2027-03-18`,
  });
  expect(daten(entscheid)).toEqual({ entscheid: 'beenden' });
  for (const z of ereignisse(m, 'ernte')) expect(daten(z)).toEqual({ art: 'ab' });
  expect(ereignisse(m, 'abschluss')).toHaveLength(0);
  await expect(page.getByText('Beendet: 3 Pflanzen Lollo Rossa').first()).toBeVisible();
  await expect(ernte.getByRole('listitem').filter({ hasText: 'Lollo Rossa' })).toHaveCount(0);

  // Rückgängig: Stornos in umgekehrter Reihenfolge, die Frage ist wieder da
  const neu = [entscheid, ...ereignisse(m, 'ernte')].map((z) => String(z?.['client_id']));
  await knopf(page, 'Rückgängig machen').click();
  await expect.poll(() => m.storniert.length).toBe(4);
  expect(m.storniert).toEqual([...neu].reverse().map((id) => ['ereignis', id]));
  await page.reload();
  await expect(
    karte(page, 'Ernte und Kulturende')
      .getByRole('listitem')
      .filter({ hasText: 'Kultur beenden oder verlängern? · Lollo Rossa' }),
  ).toHaveCount(1);
});

test('R1.7 Abernten, dann über Gefäss «Kürzlich beendet» und Verlauf wiederherstellen', async ({ page }) => {
  const m = await mitDaten(page, ERNTE_JETZT, `/#/pflanze/${EISSALAT}`, 'Pflanze');
  const main = page.locator('main');
  // Einmalernte: nur Abernten
  await expect(main.getByRole('button', { name: 'Teilernte', exact: true })).toHaveCount(0);
  await tipp(m, main.getByRole('button', { name: 'Abernten', exact: true }));
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(1);
  const ab = ereignisse(m, 'ernte')[0];
  expect(daten(ab)).toEqual({ art: 'ab' });

  await page.goto('/#/gefaess/R-2.3');
  await page.reload();
  const beendet = page.getByRole('list', { name: 'Kürzlich beendet' }).getByRole('listitem').filter({
    hasText: 'Eissalat',
  });
  await expect(beendet).toHaveCount(1);
  await beendet.getByRole('link').first().click();
  await expect(page).toHaveURL(new RegExp(`#/pflanze/${EISSALAT}$`));
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  await expect(main.getByText('Geerntet am 18.3.', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Abernten', exact: true })).toHaveCount(0);

  const zeile = karte(page, 'Verlauf').getByRole('listitem').filter({ hasText: '18.3. Abgeerntet' });
  await expect(zeile).toHaveCount(1);
  await knopf(zeile, 'Wiederherstellen').click();
  await expect.poll(() => ereignisse(m, 'wiederherstellen').length).toBe(1);
  const w = ereignisse(m, 'wiederherstellen')[0];
  expect(w).toMatchObject({ pflanzung_id: EISSALAT });
  expect(daten(w)).toEqual({ ereignis_id: ab?.['id'] });
  await expect(main.getByRole('button', { name: 'Abernten', exact: true })).toBeVisible();
  await ohneTastatur(page);
});
