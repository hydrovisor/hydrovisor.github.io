// Verteilung der Ansätze in Heute, offene Aufgaben in der Maske Gefäss und «Morgen» im Kopf «Messgerät» (Plan 113
// Testliste; R5.6-AK7, UC1-AK2 Ergänzung, UC8-AK6 Ergänzung; 05_masken.md 3.1 und 3.3). REST nachgebildet
// (tests/e2e/rest.ts), Sichten mit sichtenNachrechnen() nach jedem Schreiben; Regal R aus tests/fixtures/rundgang.ts;
// feste Uhr Di 12.1.2027 09:00 Zürich; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 113 offen ist):
// - Heute: Aufgabenzeile wie bisher («Titel · Code», darunter «Grund · Hinweis»); der vorgezogene Wechsel trägt
//   den Hinweis «vorgezogen» und den Grund mit dem ursprünglichen Termin («fällig 13.1.» oder «fällig Mi»).
// - Maske Gefäss: <section aria-label="Offene Aufgaben"> mit Listeneinträgen «Titel · Grund», ohne Links und Knöpfe;
//   Hauptknopf weiter als Link, dessen Name auf «Messen» endet.
// - Heute, Kopf <section aria-label="Messgerät">: Knopf «Morgen» (button) bei fälliger Kalibrierung und bei der
//   Erstkalibrierung (Plan 113 Punkt 12); der Tipp schreibt eine Zeile aufschub mit art «morgen» und blendet den Knopf aus.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ansatzHinzu } from '../fixtures/messen.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';
import { JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [] };
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

async function oeffnen(page: Page, pfad: string): Promise<void> {
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await page.reload();
}

async function heute(page: Page): Promise<void> {
  await oeffnen(page, '/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
}

async function imViewport(page: Page, locator: Locator, was: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${was}: keine Bounding Box`);
  const fenster = await page.evaluate(() => window.innerHeight);
  expect(box.y, `${was} oben im Viewport`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${was} unten im Viewport`).toBeLessThanOrEqual(fenster);
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

/**
 * S9 verkleinert: die Stationen 4.1, 4.2, 4.3 und 4.5 (Konstantpegel, Wechsel nach 14 Tagen) mit Neuansatz am
 * 30.12.2026 → vier «Lösung wechseln» am Mi 13.1. (Tag D = heute + 1), heute kein Ansatz; 1.1 und 2.1 wechseln erst
 * am 17.1. bzw. 19.1.
 */
function vierWechselMorgen(): Teile {
  const t = rundgangTeile();
  ['4.1', '4.2', '4.3', '4.5'].forEach((kennung, i) =>
    ansatzHinzu(t, {
      id: uid('5a', i + 1),
      kennung,
      typ: 'neuansatz',
      begonnenAm: '2026-12-30T08:00:00.000Z',
    }),
  );
  return sichtenNachrechnen(t);
}

test('R5.6-AK7 Heute zeigt vorgezogenen Wechsel', async ({ page }) => {
  await mitDaten(page, vierWechselMorgen());
  await heute(page);

  const vorgezogen = page.getByRole('listitem').filter({ hasText: 'vorgezogen' });
  await expect(vorgezogen).toHaveCount(1);
  await expect(vorgezogen).toContainText('Lösung wechseln');
  await expect(vorgezogen).toContainText(/fällig (Mi|13\.1\.)/);
  await expect(vorgezogen).toContainText(/R-4\.[1235]/);
  // die übrigen drei bleiben am Mi: heute genau ein Wechsel
  await expect(page.getByRole('listitem').filter({ hasText: 'Lösung wechseln' })).toHaveCount(1);
  await expect(page.getByText(/Ansätze heute/)).toHaveCount(0);
});

test('UC1-AK2 Offene Aufgaben in der Maske Gefäss ohne Links, Hauptknopf ohne Scrollen', async ({ page }) => {
  // ohne Kurzprüfung Wurzeln in 1.1: «Wurzeln prüfen» seit dem 10.1. (Neuansatz 3.1. + 7)
  const t = rundgangTeile();
  t['ereignis'] = (t['ereignis'] ?? []).filter(
    (e) =>
      !(
        e['typ'] === 'kurzpruefung' &&
        e['platz_id'] === platzId('1.1') &&
        (e['daten'] as { punkt?: string } | undefined)?.punkt === 'wurzeln'
      ),
  );
  await mitDaten(page, t);
  await oeffnen(page, '/#/gefaess/R-1.1');

  const offen = page.getByRole('region', { name: 'Offene Aufgaben' });
  await expect(offen).toBeVisible({ timeout: 15_000 });
  await expect(offen.getByRole('listitem').filter({ hasText: 'Wurzeln prüfen' })).toHaveCount(1);
  await expect(offen.getByRole('listitem').filter({ hasText: 'Messen und nachfüllen' })).toHaveCount(1);
  await expect(offen.getByRole('link')).toHaveCount(0);
  await expect(offen.getByRole('button')).toHaveCount(0);

  // Kopf, Zustand und Hauptknopf ohne Scrollen auf 360 × 640; genau ein Link «… Messen»
  const haupt = page.getByRole('link', { name: /Messen$/ });
  await expect(haupt).toHaveCount(1);
  await expect(haupt).toBeVisible();
  await imViewport(page, page.getByRole('heading', { level: 1 }), 'Kopf');
  await imViewport(page, page.getByRole('region', { name: 'Zustand' }), 'Zustand');
  await imViewport(page, haupt, 'Hauptknopf');
  expect(await page.evaluate(() => window.scrollY), 'nicht gescrollt').toBe(0);
});

test('UC8-AK6 Kopf Messgerät mit Morgen bei fälliger Kalibrierung', async ({ page }) => {
  // letzte echte Kalibrierung vor 31 Tagen (12.12.2026): «Messgerät kalibrieren» fällig
  const t = rundgangTeile();
  for (const k of t['kalibrierung'] ?? []) k['gilt_ab'] = '2026-12-12T08:00:00.000Z';
  const m = await mitDaten(page, t);
  await heute(page);

  const kopf = page.getByRole('region', { name: 'Messgerät' });
  await expect(kopf).toBeVisible();
  const morgen = kopf.getByRole('button', { name: 'Morgen', exact: true });
  await expect(morgen).toBeVisible();
  await morgen.click();

  await expect.poll(() => zeilenVon(m, 'aufschub').length).toBe(1);
  const z = zeilenVon(m, 'aufschub')[0] as Record<string, unknown>;
  expect(z['art']).toBe('morgen');
  expect(String(z['aufgabe_schluessel'])).toMatch(/^kalibrieren\|/);
  expect(z['gesetzt_am']).toBe('2027-01-12');
  await expect(kopf.getByRole('button', { name: 'Morgen', exact: true })).toHaveCount(0);
});

test('UC8-AK6 Kopf Messgerät mit Morgen bei Erstkalibrierung', async ({ page }) => {
  // Plan 113 Punkt 12: Konzept R5.2 «Messgerät kalibrieren»: Morgen ja, auch bei der Erstkalibrierung
  const t = rundgangTeile();
  t['kalibrierung'] = [];
  const m = await mitDaten(page, t);
  await heute(page);

  const kopf = page.getByRole('region', { name: 'Messgerät' });
  await expect(kopf).toBeVisible();
  const morgen = kopf.getByRole('button', { name: 'Morgen', exact: true });
  await expect(morgen).toBeVisible();
  await morgen.click();

  await expect.poll(() => zeilenVon(m, 'aufschub').length).toBe(1);
  const z = zeilenVon(m, 'aufschub')[0] as Record<string, unknown>;
  expect(z['art']).toBe('morgen');
  expect(String(z['aufgabe_schluessel'])).toMatch(/^kalibrieren\|/);
  await expect(kopf.getByRole('button', { name: 'Morgen', exact: true })).toHaveCount(0);
});
