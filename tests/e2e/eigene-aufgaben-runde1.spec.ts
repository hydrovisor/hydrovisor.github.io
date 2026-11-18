// Eigene wiederkehrende Aufgaben, Runde 1 (Issue #249, Plan 249 «Oberfläche»; EA-AK6; Konzept 8.1 Regel 3, 11.4 TO2):
// Wiederholung nach einem Fehler sendet dieselben Client-UUIDs. schreiben() wiederholt selbst nicht; ein Fehler endet
// als «nicht gespeichert», die Maske zeigt ihn und lässt das Formular offen. Der erste POST auf eigene_aufgabe
// antwortet 500 (eigene Route nach restNachbilden, sie geht in Playwright vor), jeder weitere geht an die nachgebildete
// REST-Schnittstelle (tests/e2e/rest.ts). Feste Uhr Di 12.1.2027 10:00 Zürich, Europe/Zurich und 360 × 640 aus der
// Konfiguration; Datenstand regalTeile() (tests/fixtures/regal.ts). Keine Personendaten.
import { expect, test, type Page, type Route } from '@playwright/test';
import { ANLAGE_R, regalTeile } from '../fixtures/regal.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;
type Teile = Record<string, Zeile[]>;

/** Di 12.1.2027 10:00 Zürich */
const JETZT = new Date('2027-01-12T09:00:00.000Z');
const NAME = 'Zelt und Luftsteine reinigen';
const ZELT_ID = 'f2490000-0000-4000-8000-0000000000e1';

interface Mitschnitt {
  daten: Teile;
  /** angenommene Zeilen (nach dem Fehler) */
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  /** jeder POST auf eigene_aufgabe, auch der gescheiterte */
  versuche: Zeile[];
}

/** REST nachbilden, ersten POST auf eigene_aufgabe mit 500 scheitern lassen, Uhr setzen, Seite öffnen */
async function oeffnen(page: Page, teile: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(teile), geschrieben: [], storniert: [], versuche: [] };
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
  // später registrierte Routen gehen vor: der erste POST scheitert, alle übrigen Anfragen fallen durch
  await page.route(
    (url) => url.pathname.endsWith('/rest/v1/eigene_aufgabe'),
    async (route: Route) => {
      const anfrage = route.request();
      if (anfrage.method() !== 'POST') return route.fallback();
      const roh = anfrage.postDataJSON() as Zeile | Zeile[];
      for (const z of Array.isArray(roh) ? roh : [roh]) m.versuche.push(z);
      if (m.versuche.length === 1)
        return route.fulfill({
          status: 500,
          json: { code: 'XX000', message: 'interner Fehler', details: null, hint: null },
        });
      return route.fallback();
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await page.reload();
  return m;
}

const karte = (page: Page, name: string) =>
  page.locator('.hv-card').filter({ has: page.getByRole('heading', { level: 3, name, exact: true }) });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const feld = (page: Page, name: 'Name' | 'Intervall') => page.getByLabel(name, { exact: true });
const eigeneZeilen = (m: Mitschnitt) =>
  m.geschrieben.filter(([t]) => t === 'eigene_aufgabe').map(([, z]) => z);

test('EA-AK6 TO2 Anlegen: erster POST scheitert, Fehler sichtbar, Formular bleibt offen; zweites Speichern sendet dieselbe client_id und id, danach genau eine Karte', async ({
  page,
}) => {
  const m = await oeffnen(page, regalTeile(JETZT) as Teile, '/#/anlage?a=R');
  await expect(page.getByRole('heading', { level: 2, name: 'Eigene Aufgaben', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await taste(page, 'Aufgabe hinzufügen').click();
  await feld(page, 'Name').fill(NAME);
  await feld(page, 'Intervall').fill('30');
  await taste(page, 'Speichern').click();

  // Fehler: Meldung sichtbar, Formular mit Eingabe offen, nichts angenommen
  await expect.poll(() => m.versuche.length).toBe(1);
  await expect(page.locator('.hv-notice-danger')).toBeVisible();
  await expect(feld(page, 'Name')).toHaveValue(NAME);
  await expect(feld(page, 'Intervall')).toHaveValue('30');
  await expect(karte(page, NAME)).toHaveCount(0);
  expect(eigeneZeilen(m)).toHaveLength(0);

  // Wiederholung
  await expect(taste(page, 'Speichern')).toBeEnabled();
  await taste(page, 'Speichern').click();
  await expect(karte(page, NAME)).toHaveCount(1);
  await expect(karte(page, NAME)).toContainText('alle 30 Tage · heute fällig');
  await expect(page.locator('.hv-notice-danger')).toHaveCount(0);

  expect(m.versuche).toHaveLength(2);
  const [erster, zweiter] = m.versuche;
  expect(typeof erster?.['client_id']).toBe('string');
  expect(zweiter?.['client_id']).toBe(erster?.['client_id']);
  expect(zweiter?.['id']).toBe(erster?.['id']);
  expect(zweiter).toMatchObject({ anlage_id: ANLAGE_R, name: NAME, intervall_d: 30 });
  expect(eigeneZeilen(m)).toHaveLength(1);
  expect(eigeneZeilen(m)[0]?.['client_id']).toBe(erster?.['client_id']);
});

test('EA-AK6 TO2 Ändern: erster POST des Nachfolgers scheitert ohne Storno; Wiederholung sendet dieselbe client_id, id und ersetzt_id, danach ein Storno und eine Karte', async ({
  page,
}) => {
  const teile = regalTeile(JETZT) as Teile;
  teile['eigene_aufgabe'] = [
    {
      id: ZELT_ID,
      client_id: ZELT_ID,
      anlage_id: ANLAGE_R,
      name: NAME,
      intervall_d: 30,
      letzte_erledigung: null,
      ersetzt_id: null,
      erfasst_am: JETZT.toISOString(),
      app_version: 'test',
      storniert_am: null,
    },
  ];
  const m = await oeffnen(page, teile, '/#/anlage?a=R');
  await expect(karte(page, NAME)).toHaveCount(1, { timeout: 15_000 });
  await karte(page, NAME).getByRole('button', { name: 'Ändern', exact: true }).click();
  await feld(page, 'Intervall').fill('28');
  await taste(page, 'Speichern').click();

  await expect.poll(() => m.versuche.length).toBe(1);
  await expect(page.locator('.hv-notice-danger')).toBeVisible();
  await expect(feld(page, 'Intervall')).toHaveValue('28');
  // der Vorgänger ist nicht storniert: der Storno folgt erst nach dem neuen Eintrag
  expect(m.storniert).toHaveLength(0);

  await expect(taste(page, 'Speichern')).toBeEnabled();
  await taste(page, 'Speichern').click();
  await expect(karte(page, NAME)).toHaveCount(1);
  await expect(karte(page, NAME)).toContainText('alle 28 Tage');

  expect(m.versuche).toHaveLength(2);
  const [erster, zweiter] = m.versuche;
  expect(zweiter?.['client_id']).toBe(erster?.['client_id']);
  expect(zweiter?.['id']).toBe(erster?.['id']);
  expect(zweiter).toMatchObject({ intervall_d: 28, ersetzt_id: ZELT_ID });
  await expect
    .poll(() => m.storniert.filter(([t]) => t === 'eigene_aufgabe').map(([, id]) => id))
    .toEqual([ZELT_ID]);
  expect(eigeneZeilen(m)).toHaveLength(1);
});
