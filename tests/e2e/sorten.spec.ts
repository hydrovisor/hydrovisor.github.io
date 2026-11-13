// Maske Sorten und «Neue Sorte» aus dem Tütentext (Issue #37, Plan 37 Testliste E2E; UC4-AK9, UC4 Varianten, TO8;
// 05_masken.md Abschnitt 4; Erratum E8). REST nachgebildet (Plan 18 A7) wie tests/e2e/ernte.spec.ts; die Functions
// ki-tuete und ki-recherche sind über page.route gemockt, die Claude API wird nie aufgerufen. 360 × 640 aus der
// Konfiguration, Uhr mit page.clock.setFixedTime(). Erfundene Sorten, keine Personendaten.
//
// Erwartete Oberfläche (Plan 37 Maskenablauf; wo der Plan offen ist, vom Testentwickler festgelegt, A):
// - #/sorten (Plan 211): h1 «Saatgut», Link «Von Hand erfassen»; je Gemüse eine region mit dem Namen der Art, darin je
//   Sorte ein Link, der mit dem Sortennamen beginnt, und dem Status als Wort «vollständig» oder «Recherche offen»; kein
//   waagrechtes Scrollen.
// - #/sorten/neu Schritt «Tüte»: mehrzeiliges Feld «Text der Tüte einfügen», Knöpfe «Tüte lesen» und «Ohne KI weiter».
//   Schritt «Sorte und Art»: Feld «Name», Auswahl «Art» (option value = art_id). Schritt «Merkmale»: Radio «Blatt».
//   Schritt «Packung»: Felder «Kaufdatum», «Keimfähigkeit in %» (ohne «Bestand in Korn», Plan 211 Abweichung 1),
//   Knopf «Sorte speichern».
//   Zwischen den Schritten der Knopf «Weiter» (A).
// - Nach dem Speichern «Gespeichert: <Name> mit Packung», danach der Hinweis der Recherche («noch nicht eingerichtet»).
// - Gleiche Sorte und Art: Hinweis «<Name> gibt es schon» mit «Packung zu <Name> erfassen».
// - Ohne Netz: «Kein Netz, nicht gespeichert, erneut senden», Eingaben bleiben.
import { expect, test, type Page, type Route } from '@playwright/test';
import { regalTeile, uid, vereinen, type Teile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

const FUNKTIONEN = 'http://127.0.0.1:54321/functions/v1';
// 15.1.2027 10:30 Zürich
const JETZT = new Date('2027-01-15T09:30:00.000Z');
const LOLLO = uid('37', 1);
const gueltig = { gueltig_bis: null };

function wissen(): Teile {
  return {
    kulturgruppe: [
      {
        kulturgruppe_id: 'blatt_kopf',
        name: 'Blattsalate',
        leitkultur_art_id: 'lactuca_sativa',
        ec_obergrenze_validator: 2.0,
      },
    ],
    art: [
      {
        id: uid('38', 1),
        art_id: 'lactuca_sativa',
        name_de: 'Salat',
        name_wiss: 'Lactuca sativa',
        kulturgruppe_id: 'blatt_kopf',
        kulturformen_erlaubt: ['babyleaf', 'schnitt', 'kopf'],
        kulturform_vorgabe: 'kopf',
        ...gueltig,
      },
      {
        id: uid('38', 2),
        art_id: 'solanum_lycopersicum',
        name_de: 'Tomate',
        name_wiss: 'Solanum lycopersicum',
        kulturgruppe_id: 'blatt_kopf',
        kulturformen_erlaubt: ['dauerkultur_frucht'],
        kulturform_vorgabe: 'dauerkultur_frucht',
        ...gueltig,
      },
    ],
    sorte: [
      {
        id: uid('39', 1),
        sorte_id: LOLLO,
        name: 'Lollo Rossa',
        art_id: 'lactuca_sativa',
        kulturtyp: 'blatt',
        ...gueltig,
      },
    ],
    v_vollstaendigkeit: [{ sorte_id: LOLLO, fehlende_groessen: 0, pruefauftraege: 2, vollstaendig: true }],
    saatgut: [
      {
        id: uid('3a', 1),
        client_id: uid('3a', 1),
        sorte_id: LOLLO,
        kaufdatum: '2026-11-20',
        bestand_korn: 180,
        keimfaehigkeit_packung: 0.85,
        storniert_am: null,
      },
    ],
    saatempfehlung: [],
    v_sollwert: [],
    quelle: [],
  };
}

const KI_OK = {
  ergebnis: 'ok',
  modell: 'claude-haiku-5-5',
  felder: {
    name: 'Testsorte Rot',
    art: 'Lactuca sativa L.',
    keimart: 'licht',
    keimtemperatur_min_c: 15,
    keimtemperatur_max_c: 20,
    keimdauer_min_d: 7,
    keimdauer_max_d: 14,
    kulturdauer_min_d: 50,
    kulturdauer_max_d: 70,
    aussaat_von_monat: 3,
    aussaat_bis_monat: 8,
    hersteller: 'Beispiel Saaten',
  },
  verworfen: [],
  dauerMs: 4200,
  ausweichmodell: false,
};

const NICHT_EINGERICHTET = {
  ergebnis: 'abgebrochen',
  grund: 'nicht_eingerichtet',
  hinweis: 'Die Recherche ist noch nicht eingerichtet. Lege die Saatempfehlung von Hand an.',
  dauerMs: 0,
};

interface Mitschnitt {
  daten: Teile;
  wissen: { aktion: string; daten: Record<string, unknown> }[];
  geschrieben: [string, Record<string, unknown>][];
  tuete: Record<string, unknown>[];
  recherche: Record<string, unknown>[];
}

async function mitDaten(
  page: Page,
  optionen: { ki?: object; ohneNetz?: () => boolean } = {},
): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: vereinen(regalTeile(JETZT), wissen()),
    wissen: [],
    geschrieben: [],
    tuete: [],
    recherche: [],
  };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        (m.daten[tabelle] ??= []).push(z);
      }
    },
  );
  // RPC wissen_app_schreiben: Sorte und Vollständigkeit ins nachgebildete Bündel, Antwort mit einer id
  await page.route(`${REST}/rpc/wissen_app_schreiben`, async (route: Route) => {
    if (optionen.ohneNetz?.()) return route.abort('internetdisconnected');
    const body = route.request().postDataJSON() as { aktion: string; daten: Record<string, unknown> };
    m.wissen.push(body);
    let id = `37000000-0000-4000-8000-${String(m.wissen.length).padStart(12, '0')}`;
    if (body.aktion === 'sorte_neu') {
      id = String(body.daten['sorte_id']);
      (m.daten['sorte'] ??= []).push({ id: uid('39', 9), sorte_id: id, ...body.daten, ...gueltig });
      (m.daten['v_vollstaendigkeit'] ??= []).push({
        sorte_id: id,
        fehlende_groessen: 4,
        pruefauftraege: 6,
        vollstaendig: false,
      });
    }
    return route.fulfill({ json: id });
  });
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    m.tuete.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: optionen.ki ?? KI_OK });
  });
  await page.route(`${FUNKTIONEN}/ki-recherche`, async (route) => {
    m.recherche.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: NICHT_EINGERICHTET });
  });
  await page.clock.setFixedTime(JETZT);
  return m;
}

const knopf = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).or(page.getByRole('link', { name, exact: true }));

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
}

async function tuetentextLesen(page: Page, text: string): Promise<void> {
  await page.goto('/#/sorten');
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
  await knopf(page, 'Von Hand erfassen').click();
  await expect(page).toHaveURL(/#\/sorten\/neu$/);
  await page.getByLabel('Text der Tüte einfügen').fill(text);
  await knopf(page, 'Tüte lesen').click();
}

const TUETENTEXT =
  'Testsorte Rot\nLactuca sativa L.\nLichtkeimer, 15 bis 20 °C, Keimung 7 bis 14 Tage\nBeispiel Saaten';

test('UC4-AK9 Neue Sorte aus Tütentext: KI-Vorschlag, Art bestätigen, Packung, Speichern, Recherche «noch nicht eingerichtet», Liste zeigt «Recherche offen» als Wort, ohne waagrechtes Scrollen auf 360 × 640', async ({
  page,
}) => {
  const m = await mitDaten(page);
  await tuetentextLesen(page, TUETENTEXT);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Testsorte Rot');
  expect(m.tuete).toHaveLength(1);
  expect(m.tuete[0]?.['text']).toBe(TUETENTEXT);
  await expect(page.getByLabel('Art', { exact: true })).toHaveValue('lactuca_sativa');
  await ohneWaagrechtesScrollen(page);
  await knopf(page, 'Weiter').click();

  await page.getByRole('radio', { name: 'Blatt', exact: true }).check();
  await ohneWaagrechtesScrollen(page);
  await knopf(page, 'Weiter').click();

  await page.getByLabel('Kaufdatum').fill('2027-01-10');
  await page.getByLabel('Keimfähigkeit in %').fill('85');
  await expect(page.getByLabel('Bestand in Korn')).toHaveCount(0);
  await ohneWaagrechtesScrollen(page);
  await knopf(page, 'Sorte speichern').click();

  await expect(page.getByText('Gespeichert: Testsorte Rot mit Packung')).toBeVisible();
  await expect(page.getByText(/noch nicht eingerichtet/)).toBeVisible();

  const sorteNeu = m.wissen.find((a) => a.aktion === 'sorte_neu');
  expect(sorteNeu?.daten).toMatchObject({
    name: 'Testsorte Rot',
    art_id: 'lactuca_sativa',
    kulturtyp: 'blatt',
  });
  const sorteId = String(sorteNeu?.daten['sorte_id']);
  expect(sorteId).toMatch(/^[0-9a-f-]{36}$/);
  expect(m.wissen.findIndex((a) => a.aktion === 'sorte_neu')).toBeLessThan(
    m.wissen.findIndex((a) => a.aktion === 'tuetenwert'),
  );
  const saatgut = m.geschrieben.filter(([t]) => t === 'saatgut').map(([, z]) => z);
  expect(saatgut).toHaveLength(1);
  expect(saatgut[0]).toMatchObject({ sorte_id: sorteId, bestand_korn: null, keimfaehigkeit_packung: 0.85 });
  expect(m.geschrieben.filter(([t]) => t === 'ki_feldprotokoll')).toHaveLength(8);
  expect(m.recherche).toHaveLength(1);
  expect(m.recherche[0]?.['sorte_id']).toBe(sorteId);

  await page.goto('/#/sorten');
  const salat = page.getByRole('region', { name: 'Salat' });
  const zeile = salat.getByRole('link', { name: /^Testsorte Rot/ });
  await expect(zeile).toBeVisible();
  await expect(zeile).toContainText('Recherche offen');
  const lollo = salat.getByRole('link', { name: /^Lollo Rossa/ });
  await expect(lollo).toContainText(/(^|[^n])vollständig/);
  await expect(lollo).not.toContainText('Recherche offen');
  await ohneWaagrechtesScrollen(page);
});

test('UC4 Sorte gibt es schon → Packung erfassen schreibt nur saatgut und Feldprotokoll', async ({
  page,
}) => {
  const m = await mitDaten(page, { ki: { ...KI_OK, felder: { ...KI_OK.felder, name: 'lollo rossa' } } });
  await tuetentextLesen(page, 'Lollo Rossa\nLactuca sativa\nBeispiel Saaten');
  await expect(page.getByText(/Lollo Rossa gibt es schon/i)).toBeVisible();
  await knopf(page, 'Packung zu Lollo Rossa erfassen').click();
  await knopf(page, 'Sorte speichern').or(knopf(page, 'Packung speichern')).first().click();
  await expect(page.getByText(/Gespeichert/)).toBeVisible();

  expect(m.wissen.filter((a) => ['sorte_neu', 'art_neu', 'tuetenwert'].includes(a.aktion))).toEqual([]);
  const saatgut = m.geschrieben.filter(([t]) => t === 'saatgut').map(([, z]) => z);
  expect(saatgut).toHaveLength(1);
  expect(saatgut[0]).toMatchObject({ sorte_id: LOLLO, bestand_korn: null });
  const protokoll = m.geschrieben.filter(([t]) => t === 'ki_feldprotokoll').map(([, z]) => z);
  expect(protokoll).toHaveLength(8);
  for (const z of protokoll) expect(z['sorte_id']).toBe(LOLLO);
});

test('UC4 KI antwortet «von Hand» → Hinweis, getippte Werte bleiben', async ({ page }) => {
  await mitDaten(page, {
    ki: {
      ergebnis: 'von_hand',
      grund: 'nicht_eingerichtet',
      hinweis: 'Das Lesen der Tüte ist noch nicht eingerichtet. Trag die Werte von Hand ein.',
      dauerMs: 0,
    },
  });
  await tuetentextLesen(page, TUETENTEXT);
  await expect(
    page.getByText('Das Lesen der Tüte ist noch nicht eingerichtet. Trag die Werte von Hand ein.'),
  ).toBeVisible();
  await expect(page.getByLabel('Text der Tüte einfügen')).toHaveValue(TUETENTEXT);
  await knopf(page, 'Ohne KI weiter').click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
});

test('TO8 Speichern ohne Netz → «Kein Netz, nicht gespeichert, erneut senden», Eingaben bleiben', async ({
  page,
}) => {
  let ohneNetz = false;
  await mitDaten(page, { ohneNetz: () => ohneNetz });
  await tuetentextLesen(page, TUETENTEXT);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Testsorte Rot');
  await knopf(page, 'Weiter').click();
  await page.getByRole('radio', { name: 'Blatt', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await page.getByLabel('Keimfähigkeit in %').fill('85');
  ohneNetz = true;
  await page.context().setOffline(true);
  await knopf(page, 'Sorte speichern').click();
  await expect(page.getByText('Kein Netz, nicht gespeichert, erneut senden')).toBeVisible();
  await expect(page.getByLabel('Keimfähigkeit in %')).toHaveValue('85');
  await page.context().setOffline(false);
});
