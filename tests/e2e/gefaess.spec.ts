// Gefäss erfassen, prüfen und ändern (Plan 21 Testliste; UC3-AK1, UC3-AK5, UC3-AK8). REST nachgebildet (Plan 18
// A7, Plan 20 A7): POST und PATCH aus schreiben() landen im nachgebildeten Bündel, v_gefaess_status und
// v_fuellzustand rechnet tests/fixtures/sichten.ts nach. Regal R aus tests/fixtures/regal.ts; 360 × 640 aus der
// Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 21 offen ist):
// - #/gefaess-neu?a=R: Überschrift h1 «Gefäss erfassen», Schrittanzeige als eigener Text «Schritt n von 4»;
//   Wahlfelder als fieldset mit legend «Rolle», «Bereich», «Position», «Betriebsart», «Luftpumpe» (Schritt 1),
//   «Box» (Schritt 2), «Deckel oder Platte» (Schritt 3) und Radios mit dem Namen der Wahl («Ebene 2», «3», «DWC»,
//   «P2», Vorlagenname «Rako 40 × 30 × 22», «D2»); Feld «Betriebsvolumen …»; Knöpfe «Weiter» und «Speichern».
// - Heute: je Gefäss «in Prüfung» ein Listeneintrag mit «Gefäss prüfen», der Kennung und dem Knopf «Prüfen»
//   (Link oder Button) nach #/pruefen/R-3.3.
// - #/pruefen/:code: main mit data-density="regal"; Schritt 1 Text «Kennung tippen» und NumPad (Taste «weiter»
//   bestätigt), danach «Richtiges Gefäss: 3.3»; Schritt 2 Baustein Deckel und Knopf «Stimmt»; Schritt 3 Text
//   «Netztopf 5 cm sitzt im Loch» und «Stimmt»; danach Text «in Betrieb (Volumen offen)».
// - Maske «Gefäss»: Nebenknopf «Ändern» (Link oder Button) nach #/gefaess/R-2.3/aendern; dort Feld mit Label
//   «Wechseln …», das beim Antippen seinen Inhalt markiert (Tippen ersetzt den Wert), Knopf «Speichern».
import { expect, test, type Locator, type Page } from '@playwright/test';
import { gefaessId, leeresRegal, platzId, regalTeile, type Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  stornos: [string, string][];
  /** Reihenfolge der Schreibzugriffe, z. B. «storno:gefaess», «neu:gefaess» */
  folge: string[];
}

async function mitDaten(page: Page, start: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: sichtenNachrechnen(structuredClone(start)),
    geschrieben: [],
    stornos: [],
    folge: [],
  };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        m.folge.push(`neu:${tabelle}`);
        zeileAufnehmen(m.daten, tabelle, z, new Date());
      }
      sichtenNachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      m.stornos.push([tabelle, clientId]);
      m.folge.push(`storno:${tabelle}`);
      stornoAufnehmen(m.daten, tabelle, clientId, new Date());
      sichtenNachrechnen(m.daten);
    },
  );
  await page.goto(pfad);
  return m;
}

/** unterer Rand liegt im Viewport (ohne Scrollen sichtbar) */
async function ohneScrollen(page: Page, ort: Locator): Promise<void> {
  const box = await ort.boundingBox();
  const hoehe = page.viewportSize()?.height ?? 0;
  expect((box?.y ?? Infinity) + (box?.height ?? 0), 'unterer Rand im Viewport').toBeLessThanOrEqual(hoehe);
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));

test('UC3-AK1 Gefäss 2.3 ist in höchstens 4 Schritten erfasst: Platz, Box, Deckel, Zusammenfassung, Speichern schreibt platz, etikett, gefaess, 6 netztopf, gefaess_erfasst', async ({
  page,
}) => {
  const { geschrieben } = await mitDaten(page, leeresRegal(), '/#/gefaess-neu?a=R');
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible();
  const anzeige = page.getByText(/^Schritt \d+ von \d+$/);
  const gesehen = new Set<string>();
  const merken = async (erwartet: string) => {
    await expect(anzeige).toHaveText(erwartet);
    gesehen.add((await anzeige.innerText()).trim());
  };
  const gruppe = (name: string) => page.getByRole('group', { name, exact: true });
  const weiter = page.getByRole('button', { name: 'Weiter', exact: true });

  // Schritt 1 Platz: Rolle Gefäss vorbelegt, Ebene 2, Position 3, Betriebsart DWC aus dem Bereich, Pumpe P2
  await merken('Schritt 1 von 4');
  await expect(gruppe('Rolle').getByRole('radio', { name: 'Gefäss', exact: true })).toBeChecked();
  await gruppe('Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe('Position').getByRole('radio', { name: '3', exact: true }).check();
  await expect(gruppe('Betriebsart').getByRole('radio', { name: 'DWC', exact: true })).toBeChecked();
  await gruppe('Luftpumpe').getByRole('radio', { name: 'P2', exact: true }).check();
  await weiter.click();

  // Schritt 2 Box: Vorlage wählen, Betriebsvolumen vorgeschlagen
  await merken('Schritt 2 von 4');
  await gruppe('Box')
    .getByRole('radio', { name: /^Rako 40 × 30 × 22/ })
    .check();
  await expect(page.getByLabel(/^Betriebsvolumen/)).toHaveValue(/^9(\.0+)?$/);
  await weiter.click();

  // Schritt 3 Deckel: Vorlage wählen, Grafik mit 6 nummerierten Löchern
  await merken('Schritt 3 von 4');
  await gruppe('Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }).check();
  await expect(gruppe('Deckel').getByRole('button', { name: /^Loch \d+/ })).toHaveCount(6);
  await weiter.click();

  // Schritt 4 Zusammenfassung
  await merken('Schritt 4 von 4');
  await expect(page.getByText('R-2.3')).toBeVisible();
  await expect(page.getByText(/2\.3\.1 bis 2\.3\.6/)).toBeVisible();
  expect(geschrieben).toHaveLength(0);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  const tabellen = ['platz', 'etikett', 'gefaess', ...Array<string>(6).fill('netztopf'), 'ereignis'];
  await expect.poll(() => geschrieben.map(([t]) => t)).toEqual(tabellen);
  expect(gesehen.size).toBeLessThanOrEqual(4);
  const zeile = (t: string) => geschrieben.filter(([n]) => n === t).map(([, z]) => z);
  const [platz] = zeile('platz');
  expect(platz).toMatchObject({ kennung: '2.3', rolle: 'gefaess' });
  expect(zeile('etikett')[0]).toMatchObject({ code: 'R-2.3', platz_id: platz?.['id'] });
  expect(zeile('gefaess')[0]).toMatchObject({
    platz_id: platz?.['id'],
    betriebsart: 'dwc',
    luftpumpe: 'P2',
    intervall_messen_d: 2,
    intervall_wechseln_d: 14,
  });
  expect(Number(zeile('gefaess')[0]?.['betriebsvolumen_l'])).toBe(9);
  expect(zeile('netztopf').map((n) => n['kennung'])).toEqual([
    '2.3.1',
    '2.3.2',
    '2.3.3',
    '2.3.4',
    '2.3.5',
    '2.3.6',
  ]);
  expect(zeile('ereignis')[0]).toMatchObject({ typ: 'gefaess_erfasst', platz_id: platz?.['id'], daten: {} });
  for (const [, z] of geschrieben) expect(z['client_id']).toBe(z['id']);
});

test('UC3-AK5 nach Prüfschritten 1 bis 3 «in Betrieb (Volumen offen)», Aufgabe «Gefäss prüfen» weg; nach Schritt 4 «in Betrieb, geprüft am …»', async ({
  page,
}) => {
  const m = await mitDaten(page, regalTeile(new Date()), '/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  const aufgaben = page.getByRole('listitem').filter({ hasText: 'Gefäss prüfen' });
  await expect(aufgaben).toHaveCount(1);
  await expect(aufgaben).toContainText('3.3');
  await knopf(aufgaben, 'Prüfen').click();
  await expect(page).toHaveURL(/#\/pruefen\/R-3\.3$/);
  await expect(page.locator('main[data-density="regal"]')).toBeVisible();

  // Schritt 1: Kennung tippen; Zusatzprüfung Regal: Tasten 68 dp, ohne Scrollen auf 360 × 640
  await expect(page.getByText('Kennung tippen')).toBeVisible();
  const block = page.getByRole('group', { name: 'Ziffernblock' });
  for (const taste of await block.getByRole('button').all()) {
    expect((await taste.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
    await ohneScrollen(page, taste);
  }
  for (const name of ['Ziffer 3', 'Punkt', 'Ziffer 3', 'weiter'])
    await block.getByRole('button', { name, exact: true }).click();
  await expect(page.getByText('Richtiges Gefäss: 3.3')).toBeVisible();

  // Schritt 2: Deckel D3 mit 8 Löchern vergleichen
  await expect(
    page.getByRole('group', { name: 'Deckel', exact: true }).getByRole('button', { name: /^Loch \d+/ }),
  ).toHaveCount(8);
  const stimmt = page.getByRole('button', { name: 'Stimmt', exact: true });
  expect((await stimmt.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  await ohneScrollen(page, stimmt);
  await stimmt.click();

  // Schritt 3: Topfgrösse
  await expect(page.getByText('Netztopf 5 cm sitzt im Loch')).toBeVisible();
  await page.getByRole('button', { name: 'Stimmt', exact: true }).click();
  await expect(page.getByText('in Betrieb (Volumen offen)')).toBeVisible();

  // je Tipp ein Ereignis gefaesspruefung am Platz 3.3
  await expect
    .poll(() =>
      m.geschrieben
        .filter(([t, z]) => t === 'ereignis' && z['typ'] === 'gefaesspruefung')
        .map(([, z]) => [z['platz_id'], z['daten']]),
    )
    .toEqual([1, 2, 3].map((schritt) => [platzId('3.3'), { schritt, ok: true }]));

  // Regalbild: Badge «Volumen offen» mit Wort; Heute ohne Aufgabe
  await page.goto('/#/anlage');
  await expect(page.getByRole('button', { name: /^3\.3/ }).getByText('Volumen offen')).toBeVisible();
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Gefäss prüfen' })).toHaveCount(0);

  // Schritt 4 als Ereignis im Bündel (A2: die Kannenzählung folgt mit UC7 in I1b-04)
  zeileAufnehmen(
    m.daten,
    'ereignis',
    {
      id: '4f000000-0000-4000-8000-000000000001',
      client_id: '4f000000-0000-4000-8000-000000000001',
      typ: 'gefaesspruefung',
      platz_id: platzId('3.3'),
      daten: { schritt: 4, ok: true, volumen_gezaehlt_l: 9 },
      gilt_ab: new Date().toISOString(),
    },
    new Date(),
  );
  sichtenNachrechnen(m.daten);
  await page.goto('/#/gefaess/R-3.3');
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Zustand' }).getByText(/^in Betrieb, geprüft am \d{1,2}\.\d{1,2}\.$/),
  ).toBeVisible();
});

test('UC3-AK8 Wechselintervall 14 → 10 Tage in höchstens 5 Berührungen ab der Maske Gefäss', async ({
  page,
}) => {
  const start = regalTeile(new Date());
  const alt = start['gefaess']?.find((g) => g['id'] === gefaessId('2.3'));
  const m = await mitDaten(page, start, '/#/gefaess/R-2.3');
  await expect(page.getByRole('heading', { name: '2.3', level: 1 })).toBeVisible();

  let beruehrungen = 0;
  const tippen = async (ort: Locator) => {
    beruehrungen += 1;
    await ort.click();
  };
  await tippen(knopf(page, 'Ändern'));
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.3\/aendern$/);
  const feld = page.getByLabel(/^Wechseln/);
  await expect(feld).toHaveValue('14');
  await tippen(feld);
  for (const ziffer of ['1', '0']) {
    beruehrungen += 1;
    await page.keyboard.press(ziffer);
  }
  await expect(feld).toHaveValue('10');
  await tippen(page.getByRole('button', { name: 'Speichern', exact: true }));

  await expect.poll(() => m.folge).toEqual(['storno:gefaess', 'neu:gefaess']);
  expect(beruehrungen).toBeLessThanOrEqual(5);
  expect(m.stornos).toEqual([['gefaess', gefaessId('2.3')]]);
  const neu = m.geschrieben[0]?.[1] ?? {};
  expect(neu).toMatchObject({ platz_id: platzId('2.3'), intervall_wechseln_d: 10, intervall_messen_d: 2 });
  expect(neu['client_id']).toBe(neu['id']);
  expect(Date.parse(String(neu['gueltig_von']))).toBe(Date.parse(String(alt?.['gueltig_von'])));

  // die Maske «Gefäss» zeigt das neue Intervall (Alter der Lösung hängt an der Uhr, Fixture relativ zu jetzt)
  await page.goto('/#/gefaess/R-2.3');
  await expect(
    page.getByRole('region', { name: 'Zustand' }).getByText(/^Lösung \d+\/10 Tage$/),
  ).toBeVisible();
});
