// Regelprüfung der Honor-Simulation (Issue #120, T-01) im Prüftor: tests/honor/regeln.ts auf kleinen, festen Seiten
// (page.setContent, ohne App und ohne Daten). Die Simulation selbst (npm run sim:honor) läuft nicht im Prüftor.
import { expect, test, type Page } from '@playwright/test';
import { regelnImBrowser, schriftImBrowser, type Befund } from '../honor/regeln.ts';

async function seite(page: Page, dichte: 'regal' | 'standard', inhalt: string): Promise<void> {
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
     <style>body{margin:0;font:16px sans-serif} button{display:block;width:200px;margin:4px 0}</style></head>
     <body><main data-density="${dichte}">${inhalt}</main></body></html>`,
  );
}

const pruefen = (page: Page, o: { ohneScrollen?: boolean; druckseite?: boolean } = {}) =>
  page.evaluate(regelnImBrowser, {
    ohneScrollen: o.ohneScrollen ?? false,
    druckseite: o.druckseite ?? false,
  });

const regeln = (befunde: Befund[], art: Befund['art']) =>
  befunde.filter((b) => b.art === art).map((b) => b.regel);

test('SIM-AK1 Tasten: in Regal-Masken ist jede Taste unter 68 dp ein Mangel, Löcher der Deckelgrafik ab 48 dp; am Schreibtisch unter 48 dp, ausser compact ab 40 dp (Hinweis)', async ({
  page,
}) => {
  await seite(
    page,
    'regal',
    `<button class="hv-btn hv-btn-primary" style="height:68px">Speichern</button>
     <button aria-label="Loch 1, frei" style="height:48px">1</button>
     <button class="hv-btn hv-btn-compact" style="height:40px">Info öffnen</button>`,
  );
  const regal = await pruefen(page);
  expect(regeln(regal, 'Mangel')).toEqual(['Taste mindestens 68 dp']);
  expect(regal[0]?.text).toContain('Info öffnen');

  await seite(
    page,
    'standard',
    `<button class="hv-btn" style="height:48px">Weiter</button><button style="height:40px">Klein</button>`,
  );
  const tisch = await pruefen(page);
  expect(regeln(tisch, 'Mangel')).toEqual(['Taste mindestens 48 dp']);
  expect(tisch[0]?.text).toContain('Klein');

  // Variante «compact» am Schreibtisch: ab 40 dp Hinweis (Design System size-touch-compact), darunter Mangel
  await seite(
    page,
    'standard',
    `<button class="hv-btn hv-btn-compact" style="height:40px">Zur Anlage</button>
     <button class="hv-btn hv-btn-compact" style="height:36px">Zu klein</button>`,
  );
  const kompakt = await pruefen(page);
  expect(kompakt.filter((b) => b.art === 'Hinweis').map((b) => b.text)).toEqual([
    '«Zur Anlage» ist 40 dp hoch',
  ]);
  expect(kompakt.filter((b) => b.art === 'Mangel').map((b) => b.text)).toEqual(['«Zu klein» ist 36 dp hoch']);
});

test('SIM-AK2 Seite breiter als der Bildschirm und Scrollen in der Messmaske sind Mängel, eine Druckseite ist nur ein Hinweis', async ({
  page,
}) => {
  await seite(page, 'standard', `<div style="width:528px">Druckversatz X</div>`);
  const breit = await pruefen(page);
  expect(regeln(breit, 'Mangel')).toEqual(['Seite nicht breiter als der Bildschirm']);
  expect(breit[0]?.text).toContain('Druckversatz X');
  expect(regeln(await pruefen(page, { druckseite: true }), 'Hinweis')).toEqual([
    'Seite nicht breiter als der Bildschirm',
  ]);

  await seite(page, 'regal', `<div style="height:900px">Messmaske</div>`);
  expect(regeln(await pruefen(page), 'Mangel')).toEqual([]);
  expect(regeln(await pruefen(page, { ohneScrollen: true }), 'Mangel')).toEqual(['Maske ohne Scrollen']);

  // Hauptknopf unter dem Bildschirmrand: Mangel nur, wo die Maske ohne Scrollen auskommen muss
  await seite(
    page,
    'regal',
    `<div style="height:700px"></div><button class="hv-btn hv-btn-primary" style="height:68px">Speichern</button>`,
  );
  expect(regeln(await pruefen(page), 'Hinweis')).toEqual(['Hauptknopf ohne Scrollen sichtbar']);
  expect(regeln(await pruefen(page, { ohneScrollen: true }), 'Mangel')).toContain(
    'Hauptknopf ohne Scrollen sichtbar',
  );
});

test('SIM-AK3 Eingabefeld in einer Regal-Maske ist ein Mangel (Systemtastatur); Systemschrift 130 % vergrössert die Schriftgrössen des Design Systems', async ({
  page,
}) => {
  await seite(page, 'regal', `<input type="text" aria-label="Wert">`);
  expect(regeln(await pruefen(page), 'Mangel')).toEqual(['keine Systemtastatur in Regal-Masken']);
  await seite(page, 'standard', `<input type="text" aria-label="Wert" style="height:48px">`);
  expect(regeln(await pruefen(page), 'Mangel')).toEqual([]);

  await page.setContent(
    `<!doctype html><html><head><style>:root{--text-body-size:16px;--text-body-line:24px}
     p{font-size:var(--text-body-size);line-height:var(--text-body-line)}</style></head><body><p>Text</p></body></html>`,
  );
  expect(await page.evaluate(schriftImBrowser, 1.3)).toBe(2);
  expect(await page.locator('p').evaluate((p) => getComputedStyle(p).fontSize)).toBe('20.8px');
});
