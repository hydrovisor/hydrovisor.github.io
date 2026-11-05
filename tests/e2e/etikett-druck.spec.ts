// Etiketten drucken (Plan 22 Testliste; UC14-AK3, R9.1, LabelSheet.md, TO2). REST nachgebildet (Plan 18 A7):
// PATCH etikett aus schreiben() (Schritt «setzen», A2) meldet gedruckt_am und setzt es im Bündel. Regal R aus
// tests/fixtures/regal.ts, feste Uhr 2026-12-14T08:00:00Z; 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 22 offen ist):
// - #/etiketten?a=R: Überschrift h1 «Etiketten»; je Etikett ein Wahlfeld (checkbox), dessen Name mit der Kennung
//   beginnt («2.3 …», «A1 …», «W …»), dazu der Stand «nicht gedruckt» oder «gedruckt am 14.12.» als Text;
//   Felder mit Label «Startfeld …», «Druckversatz X …», «Druckversatz Y …»; Wahlfeld «Testbogen auf Normalpapier»;
//   Knopf (Link oder Button) «Druckansicht öffnen» nach #/druck/etiketten?…
// - Druckansicht: Knöpfe «Drucken» (window.print), «Als gedruckt bestätigen» (nicht beim Testbogen),
//   «Zurück zu den Etiketten»; je Seite ein .hv-sheet mit 21 .hv-sheet-cell, Etiketten als .hv-label mit
//   .hv-label-id; Testbogen mit Klasse hv-sheet-test.
import { expect, test, type Page } from '@playwright/test';
import { regalTeile, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');
const PX_JE_MM = 96 / 25.4;
const TOLERANZ_MM = 0.5;
const KENNUNGEN = [
  '1.1',
  '1.2',
  '2.1',
  '2.2',
  '2.3',
  '3.1',
  '3.2',
  '3.3',
  '4.1',
  '4.2',
  '4.3',
  '4.4',
  '4.5',
  'A1',
  'A2',
  'A3',
  'A4',
  'W',
];

interface Mitschnitt {
  daten: Teile;
  gesetzt: [string, string, Record<string, unknown>][];
}

async function mitDaten(page: Page, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: sichtenNachrechnen(regalTeile(JETZT)), gesetzt: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(m.daten, tabelle, z, JETZT);
      sichtenNachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.gesetzt.push([tabelle, clientId, felder]);
      for (const z of m.daten[tabelle] ?? []) if (z['client_id'] === clientId) Object.assign(z, felder);
    },
  );
  // window.print öffnet im Test keinen Dialog, sondern zählt
  await page.addInitScript(() => {
    (window as unknown as { gedruckt: number }).gedruckt = 0;
    window.print = () => {
      (window as unknown as { gedruckt: number }).gedruckt += 1;
    };
  });
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  return m;
}

const escape = (k: string) => k.replace(/\./g, '\\.');
const wahl = (page: Page, kennung: string) =>
  page.getByRole('checkbox', { name: new RegExp(`^${escape(kennung)}(\\s|$)`) });
const knopf = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true }).or(page.getByRole('button', { name, exact: true }));

/** genau diese Etiketten wählen; Startfeld und Versatz eintragen; Druckansicht öffnen */
async function druckansicht(
  page: Page,
  gewaehlt: string[],
  { start = '5', x = '0', y = '0', testbogen = false } = {},
): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Etiketten', level: 1 })).toBeVisible();
  for (const k of KENNUNGEN) {
    const feld = wahl(page, k);
    await expect(feld, k).toHaveCount(1);
    if (gewaehlt.includes(k)) await feld.check();
    else await feld.uncheck();
  }
  await page.getByLabel(/^Startfeld/).fill(start);
  await page.getByLabel(/^Druckversatz X/).fill(x);
  await page.getByLabel(/^Druckversatz Y/).fill(y);
  const test = page.getByRole('checkbox', { name: 'Testbogen auf Normalpapier' });
  if (testbogen) await test.check();
  else await test.uncheck();
  await knopf(page, 'Druckansicht öffnen').click();
  await expect(page).toHaveURL(/#\/druck\/etiketten\?/);
  await expect(page.locator('.hv-sheet').first()).toBeVisible();
}

interface Kante {
  x: number;
  y: number;
  b: number;
  h: number;
  etikett: boolean;
}

/** Zellen des Bogens im Druck, Masse in mm relativ zum Seitenursprung */
async function zellenImDruck(page: Page): Promise<Kante[]> {
  await page.emulateMedia({ media: 'print' });
  // Seite A4 bei 96 dpi, damit die Bildschirmbreite 360 dp den Bogen nicht beschneidet
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.evaluate(() => window.scrollTo(0, 0));
  return page
    .locator('.hv-sheet')
    .first()
    .locator('.hv-sheet-cell')
    .evaluateAll(
      (zellen, px) =>
        zellen.map((z) => {
          const r = z.getBoundingClientRect();
          return {
            x: (r.left + window.scrollX) / px,
            y: (r.top + window.scrollY) / px,
            b: r.width / px,
            h: r.height / px,
            etikett: z.querySelector('.hv-label') !== null,
          };
        }),
      PX_JE_MM,
    );
}

function kantenPruefen(zellen: Kante[], versatz: { x: number; y: number }): void {
  expect(zellen).toHaveLength(21);
  zellen.forEach((z, i) => {
    const sollX = (i % 3) * 70 + versatz.x;
    const sollY = 0.45 + Math.floor(i / 3) * 42.3 + versatz.y;
    expect(Math.abs(z.x - sollX), `Feld ${i + 1} x ${z.x.toFixed(2)} statt ${sollX}`).toBeLessThanOrEqual(
      TOLERANZ_MM,
    );
    expect(Math.abs(z.y - sollY), `Feld ${i + 1} y ${z.y.toFixed(2)} statt ${sollY}`).toBeLessThanOrEqual(
      TOLERANZ_MM,
    );
    expect(Math.abs(z.b - 70), `Feld ${i + 1} Breite`).toBeLessThanOrEqual(TOLERANZ_MM);
    expect(Math.abs(z.h - 42.3), `Feld ${i + 1} Höhe`).toBeLessThanOrEqual(TOLERANZ_MM);
  });
}

test('UC14-AK3 PDF der Druckansicht hat genau eine Seite A4', async ({ page }) => {
  await mitDaten(page, '/#/etiketten?a=R');
  await druckansicht(page, ['2.1', '2.3', 'A1']);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const pdf = (await page.pdf({ preferCSSPageSize: true })).toString('latin1');
  const seiten = pdf.match(/\/Type\s*\/Page(?!s)/g) ?? [];
  expect(seiten, 'Seiten im PDF').toHaveLength(1);
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf);
  expect(box, 'MediaBox').not.toBeNull();
  expect(Math.abs(Number(box?.[1]) - 595)).toBeLessThanOrEqual(1);
  expect(Math.abs(Number(box?.[2]) - 842)).toBeLessThanOrEqual(1);
  // «Drucken» ruft den Druckdialog
  await knopf(page, 'Drucken').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { gedruckt: number }).gedruckt)).toBe(1);
});

test('UC14-AK3 Bogen mit 3 × 7 Feldern beginnt am Startfeld 5', async ({ page }) => {
  await mitDaten(page, '/#/etiketten?a=R');
  await druckansicht(page, ['2.1', '2.3', 'A1'], { start: '5' });
  await expect(page.locator('.hv-sheet')).toHaveCount(1);
  const zellen = await zellenImDruck(page);
  expect(zellen).toHaveLength(21);
  expect(zellen.map((z) => z.etikett)).toEqual([
    ...Array<boolean>(4).fill(false),
    true,
    true,
    true,
    ...Array<boolean>(14).fill(false),
  ]);
  // Reihenfolge wie in der Liste, Anzuchtbox klein
  const zelle = page.locator('.hv-sheet-cell');
  await expect(zelle.nth(4).locator('.hv-label-id')).toHaveText('2.1');
  await expect(zelle.nth(5).locator('.hv-label-id')).toHaveText('2.3');
  await expect(zelle.nth(6).locator('.hv-label-id')).toHaveText('A1');
  await expect(zelle.nth(6).locator('.hv-label')).toHaveClass(/hv-label-small/);
  await expect(zelle.nth(4).locator('.hv-label-code')).toHaveText('R-2.1');
  await expect(zelle.nth(4).locator('.hv-label-qr svg')).toHaveCount(1);
  // Steuerleiste nicht im Druck
  await expect(knopf(page, 'Drucken')).toBeHidden();
});

test('UC14-AK3 Etikettkanten auf den Bogenmassen ±0.5 mm, mit Versatz um X/Y verschoben', async ({
  page,
}) => {
  await mitDaten(page, '/#/etiketten?a=R');
  await druckansicht(page, ['2.1', '2.3', 'A1'], { start: '5' });
  kantenPruefen(await zellenImDruck(page), { x: 0, y: 0 });

  // zweiter Lauf mit Versatz X 1.0 und Y −0.5 mm
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 360, height: 640 });
  await knopf(page, 'Zurück zu den Etiketten').click();
  await druckansicht(page, ['2.1', '2.3', 'A1'], { start: '5', x: '1.0', y: '-0.5' });
  kantenPruefen(await zellenImDruck(page), { x: 1.0, y: -0.5 });
});

test('UC14-AK3 Kennung passt in 32 mm', async ({ page }) => {
  await mitDaten(page, '/#/etiketten?a=R');
  await druckansicht(page, KENNUNGEN, { start: '1' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.emulateMedia({ media: 'print' });
  const masse = await page.locator('.hv-label').evaluateAll(
    (labels, px) =>
      labels.map((l) => {
        const id = l.querySelector('.hv-label-id') as HTMLElement | null;
        const spalte = l.querySelector('.hv-label-text') as HTMLElement | null;
        return {
          kennung: id?.textContent ?? '',
          klein: l.classList.contains('hv-label-small'),
          breite: (id?.scrollWidth ?? Infinity) / px,
          spalte: (spalte?.clientWidth ?? 0) / px,
        };
      }),
    PX_JE_MM,
  );
  expect(masse.map((m) => m.kennung)).toEqual(KENNUNGEN);
  for (const m of masse) {
    if (!m.klein) expect(Math.abs(m.spalte - 32), `${m.kennung} Spalte`).toBeLessThanOrEqual(TOLERANZ_MM);
    expect(m.breite, `${m.kennung} Breite in mm`).toBeLessThanOrEqual(m.spalte + TOLERANZ_MM);
    expect(m.breite, `${m.kennung} nicht leer`).toBeGreaterThan(3);
  }
});

test('R9.1 Als gedruckt bestätigen sendet gedruckt_am für die gewählten Etiketten; Testbogen bietet es nicht an', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/etiketten?a=R');
  const id = (code: string) =>
    String((m.daten['etikett'] ?? []).find((e) => e['code'] === code)?.['client_id'] ?? '');

  // Testbogen: Feldkanten sichtbar, keine Bestätigung
  await druckansicht(page, ['2.1', '2.3', 'A1'], { testbogen: true });
  await expect(page.locator('.hv-sheet.hv-sheet-test')).toHaveCount(1);
  await expect(knopf(page, 'Als gedruckt bestätigen')).toHaveCount(0);
  await knopf(page, 'Zurück zu den Etiketten').click();

  // Spezialbogen: Bestätigung setzt gedruckt_am = jetzt für genau die gewählten
  await druckansicht(page, ['2.1', '2.3', 'A1']);
  await expect(page.locator('.hv-sheet.hv-sheet-test')).toHaveCount(0);
  await knopf(page, 'Als gedruckt bestätigen').click();
  await expect
    .poll(() => m.gesetzt.map(([t, c]) => `${t}:${c}`).sort())
    .toEqual(['R-2.1', 'R-2.3', 'R-A1'].map((c) => `etikett:${id(c)}`).sort());
  for (const [, , felder] of m.gesetzt) {
    expect(Object.keys(felder)).toContain('gedruckt_am');
    expect(Date.parse(String(felder['gedruckt_am']))).toBe(JETZT.getTime());
    expect(Object.keys(felder)).not.toContain('storniert_am');
  }

  // die Liste zeigt den neuen Stand
  await knopf(page, 'Zurück zu den Etiketten').click();
  await expect(page.getByRole('heading', { name: 'Etiketten', level: 1 })).toBeVisible();
  await expect(page.getByText('gedruckt am 14.12.')).toHaveCount(3);
});
