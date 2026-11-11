// Usability-Regeln der Honor-Simulation (Issue #156, U-02) im Prüftor: tests/honor/regeln.ts auf kleinen, festen
// Seiten (page.setContent, ohne App und ohne Daten). Die Simulation selbst (npm run sim:honor) läuft nicht im Prüftor.
import { expect, test, type Page } from '@playwright/test';
import { bediendauer, regelnImBrowser, type Befund } from '../honor/regeln.ts';

async function seite(page: Page, dichte: 'regal' | 'standard', inhalt: string): Promise<void> {
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
     <style>body{margin:0;font:16px sans-serif} button{box-sizing:border-box;height:68px;width:120px;margin:0;
     padding:0 8px;white-space:nowrap;overflow:hidden} .zeile{display:flex}</style></head>
     <body><main data-density="${dichte}">${inhalt}</main></body></html>`,
  );
}

const pruefen = (page: Page) => page.evaluate(regelnImBrowser, { ohneScrollen: false, druckseite: false });
const von = (befunde: Befund[], art: Befund['art'], regel: string) =>
  befunde.filter((b) => b.art === art && b.regel === regel);

test('U02-AK1 überstehender Text und Überlappung sind Mängel, 4 dp Abstand ist ein Hinweis, 8 dp keiner, Löcher zählen nicht', async ({
  page,
}) => {
  // Text breiter als die Taste
  await seite(page, 'regal', `<button>Umsetzen bestätigen und weiter</button>`);
  expect(von(await pruefen(page), 'Mangel', 'Text passt in die Taste')).toHaveLength(1);

  // zwei Tasten überlappen
  await seite(
    page,
    'regal',
    `<div style="position:relative;height:80px"><button style="position:absolute;left:0">Eins</button>
     <button style="position:absolute;left:60px">Zwei</button></div>`,
  );
  expect(von(await pruefen(page), 'Mangel', 'Tasten überlappen nicht')).toHaveLength(1);

  // unter einer haftenden Leiste nur ein Hinweis
  await seite(
    page,
    'regal',
    `<div style="position:relative;height:80px"><button style="position:absolute;left:0">Eins</button>
     <nav style="position:sticky;top:0"><button style="position:absolute;left:60px">Zwei</button></nav></div>`,
  );
  const haftend = await pruefen(page);
  expect(von(haftend, 'Mangel', 'Tasten überlappen nicht')).toHaveLength(0);
  expect(von(haftend, 'Hinweis', 'Tasten überlappen nicht')).toHaveLength(1);

  // Abstand nebeneinander 4 dp: Hinweis; 8 dp: nichts; am Schreibtisch nichts
  const paar = (abstand: number) =>
    `<div class="zeile" style="gap:${abstand}px"><button>Eins</button><button>Zwei</button></div>`;
  await seite(page, 'regal', paar(4));
  expect(von(await pruefen(page), 'Hinweis', 'Abstand zwischen Tasten mindestens 8 dp')).toHaveLength(1);
  await seite(page, 'regal', paar(8));
  expect(von(await pruefen(page), 'Hinweis', 'Abstand zwischen Tasten mindestens 8 dp')).toHaveLength(0);
  await seite(page, 'standard', paar(4));
  expect(von(await pruefen(page), 'Hinweis', 'Abstand zwischen Tasten mindestens 8 dp')).toHaveLength(0);

  // Löcher der Deckelgrafik (eigenes Raster) zählen nicht
  await seite(
    page,
    'regal',
    `<div class="zeile" style="gap:2px"><button aria-label="Loch 1, frei">1</button><button aria-label="Loch 2, frei">2</button></div>`,
  );
  expect(von(await pruefen(page), 'Hinweis', 'Abstand zwischen Tasten mindestens 8 dp')).toHaveLength(0);
});

test('U02-AK2 Bediendauer nach dem Keystroke-Level-Modell: 10 Berührungen und 3 Masken ergeben 10.05 s', () => {
  expect(bediendauer(10, 3)).toBe(10.05);
  expect(bediendauer(0, 1)).toBe(1.35);
});
