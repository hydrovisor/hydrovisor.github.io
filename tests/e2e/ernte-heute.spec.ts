// UX4 Abernten direkt in Heute (Issue #226, Plan 226 Testliste; UX4-AK4; R1.7, U4, U13). REST nachgebildet
// (tests/e2e/rest.ts) wie tests/e2e/ernte.spec.ts und meldezeile.spec.ts: POST und PATCH aus schreiben() landen im
// nachgebildeten Bündel, die Sichten rechnet ernteSichtenNachrechnen() nach. Teile aus tests/fixtures/ernte.ts
// (LOLLO[1], LOLLO[2] in 2.3, LOLLO[3] als Stationsrest auf 4.4); Uhr 18.2.2027 09:00 Zürich (Lollo Rossa in 2.3
// erntereif), Europe/Zurich und 360 × 640 aus der Konfiguration. Ohne Personendaten.
//
// Erwartete Oberfläche (Plan 226 Erntekarte; Vertrag des Leads):
// - Card (section mit Überschrift) «Ernte und Kulturende»; Listeneintrag mit dem Link «Ernte möglich · Lollo Rossa»
//   (nach #/pflanze/<LOLLO[1]>) und der Taste «Alle 2 abernten» (bei n = 1 «Abernten»).
// - Nach dem Tipper die Meldung «Abgeerntet: 2 Pflanzen Lollo Rossa» in der Meldezeile (.hv-meldezeile, role status)
//   mit «Rückgängig machen»; die Zeile verschwindet ohne Maskenwechsel und steht nach dem Rückgängig wieder da.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ernteSichtenNachrechnen, ernteTeile, LOLLO, um } from '../fixtures/ernte.ts';
import type { Teile } from '../fixtures/regal.ts';
import { stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;

const JETZT = um('2027-02-18');
const L1 = LOLLO[1] as string;
const L2 = LOLLO[2] as string;
const L3 = LOLLO[3] as string;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  beruehrungen: number;
}

async function heute(page: Page): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: ernteTeile(), geschrieben: [], storniert: [], beruehrungen: 0 };
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
      ernteSichtenNachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      stornoAufnehmen(m.daten, tabelle, clientId, JETZT);
      ernteSichtenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
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
const ernteZeile = (page: Page) =>
  karte(page, 'Ernte und Kulturende')
    .getByRole('listitem')
    .filter({ hasText: 'Ernte möglich · Lollo Rossa' });
const abernten = (page: Page) =>
  ernteZeile(page).getByRole('button', { name: 'Alle 2 abernten', exact: true });
const ereignisse = (m: Mitschnitt, typ: string) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === typ).map(([, z]) => z);
const daten = (z: Zeile | undefined) => (z?.['daten'] ?? {}) as Zeile;
const meldezeile = (page: Page) => page.locator('.hv-meldezeile[role="status"]');
const rueckgaengig = (page: Page) =>
  meldezeile(page).getByRole('button', { name: 'Rückgängig machen', exact: true });

/** ganz im Bild und nicht verdeckt: der Tipp in die Mitte trifft das Element */
async function ohneScrollenTippbar(ort: Locator): Promise<void> {
  await expect(ort).toBeInViewport({ ratio: 1 });
  const trifft = await ort.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t !== null && (e === t || e.contains(t));
  });
  expect(trifft, 'Mitte des Elements frei').toBe(true);
}

/** zwei Frames: Scroll- und Render-Ereignisse sind verarbeitet */
const frames = (page: Page) =>
  page.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));

test('UX4-AK4 «Alle 2 abernten» in der Zeile «Ernte möglich · Lollo Rossa»: 1 Tipper, URL bleibt #/heute, 2 × ernte ab (LOLLO[1], LOLLO[2]), Meldung «Abgeerntet: 2 Pflanzen Lollo Rossa» ganz im Bild mit «Rückgängig machen»', async ({
  page,
}) => {
  const m = await heute(page);
  await expect(ernteZeile(page)).toHaveCount(1);
  await expect(abernten(page)).toBeVisible();

  await tipp(m, abernten(page));
  expect(m.beruehrungen).toBe(1);
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(2);
  await expect(page).toHaveURL(/#\/heute$/);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();

  const ernten = ereignisse(m, 'ernte');
  expect(ernten.map((z) => z['pflanzung_id'])).toEqual([L1, L2].sort());
  expect(ernten.map((z) => z['pflanzung_id'])).not.toContain(L3);
  for (const z of ernten) {
    expect(daten(z)).toEqual({ art: 'ab' });
    expect(z['gilt_ab']).toBe(JETZT.toISOString());
  }
  expect(ereignisse(m, 'abschluss')).toHaveLength(0);
  expect(ereignisse(m, 'kultur_entscheid')).toHaveLength(0);

  await expect(meldezeile(page)).toContainText('Abgeerntet: 2 Pflanzen Lollo Rossa');
  await expect(meldezeile(page)).toBeInViewport({ ratio: 1 });
  await ohneScrollenTippbar(rueckgaengig(page));
  await expect(ernteZeile(page)).toHaveCount(0);
});

test('UX4-AK4 «Rückgängig machen» storniert beide ernte in umgekehrter Reihenfolge (storno_grund rueckgaengig); die Zeile «Ernte möglich · Lollo Rossa» steht wieder da', async ({
  page,
}) => {
  const m = await heute(page);
  await tipp(m, abernten(page));
  await expect.poll(() => ereignisse(m, 'ernte').length).toBe(2);
  await expect(ernteZeile(page)).toHaveCount(0);
  const ids = ereignisse(m, 'ernte').map((z) => String(z['client_id']));

  await expect(rueckgaengig(page)).toBeVisible();
  await expect(rueckgaengig(page)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(rueckgaengig(page)).toBeEnabled();
  await tipp(m, rueckgaengig(page));
  await expect.poll(() => m.storniert.length).toBe(2);
  expect(m.storniert.map(([t, id]) => [t, id])).toEqual([...ids].reverse().map((id) => ['ereignis', id]));
  for (const [, , felder] of m.storniert) {
    expect(felder['storno_grund']).toBe('rueckgaengig');
    expect(felder['storniert_am']).toBeTruthy();
  }
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  // ohne Neuladen: die Überlagerung kennt das Rückgängig
  await expect(ernteZeile(page)).toHaveCount(1);
  await expect(abernten(page)).toBeVisible();
  expect(ereignisse(m, 'ernte')).toHaveLength(2);
});

test('UX4-AK4 der Link «Ernte möglich · Lollo Rossa» führt weiter zur Pflanze (#/pflanze/<LOLLO[1]>)', async ({
  page,
}) => {
  const m = await heute(page);
  const link = ernteZeile(page).getByRole('link', { name: 'Ernte möglich · Lollo Rossa', exact: true });
  await expect(link).toHaveAttribute('href', `#/pflanze/${L1}`);
  // Link und Taste sind getrennte Ziele
  await expect(knopf(ernteZeile(page), 'Alle 2 abernten')).toHaveCount(1);
  await tipp(m, link);
  await expect(page).toHaveURL(new RegExp(`#/pflanze/${L1}$`));
  await expect(page.getByRole('heading', { name: 'Pflanze', level: 1 })).toBeVisible();
  expect(m.geschrieben).toEqual([]);
});

test('UX4-AK4 U13 Doppeltipper: ein zweiter Klick 100 ms nach «Alle 2 abernten» schreibt nichts weiter', async ({
  page,
}) => {
  const m = await heute(page);
  const taste = abernten(page);
  await taste.scrollIntoViewIfNeeded();
  await frames(page);
  const box = await taste.boundingBox();
  if (!box) throw new Error('«Alle 2 abernten»: keine Bounding Box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  await page.mouse.click(x, y);
  await expect(ernteZeile(page)).toHaveCount(0);
  // Zeit für einen allfälligen zweiten Schreibvorgang
  await page.waitForTimeout(800);

  expect(ereignisse(m, 'ernte')).toHaveLength(2);
  expect(m.geschrieben, 'nur die beiden ernte').toHaveLength(2);
  expect(m.storniert).toEqual([]);
  await expect(meldezeile(page)).toContainText('Abgeerntet: 2 Pflanzen Lollo Rossa');
});
