// UX3 Kurzprüfung, Wurzeln und Nachfüllen in Heute und im Gefäss (Issue #225, Plan 225 Entscheide 1 bis 9, Variante A,
// Testliste; UX3-AK3, UX3-AK4, UX3-AK5; U4, U13; R4.10, R5.1, R5.2, R5.3). REST nachgebildet (tests/e2e/rest.ts) mit
// beimSchreiben und beimStornieren, feste Uhr je Datenstand, Europe/Zurich und 360 × 640 aus der Konfiguration.
// Datenstände:
// - rundgangTeile() (tests/fixtures/rundgang.ts, Di 12.1.2027 09:00 Zürich): R-1.1 «Messen und nachfüllen» und
//   «Kurzprüfung», R-2.1 ebenso, R-3.1 «Messen» und «Kurzprüfung»; ohne die Wurzelprüfung vom 11.1. in 1.1 zusätzlich
//   «Wurzeln prüfen» R-1.1 (fällig seit 10.1.); mit rundgangMessungDazu() 3.1 «unter ⅓» (EC 1.0) «Nachfüllen Kratky»
//   R-3.1 (halbe Konzentration, höchstens 2.4 l).
// - umsetzTeile() (tests/fixtures/umsetzen.ts) am Di 26.1.2027 mit Neuansatz in der Station 4.4 am 20.1.: «Station auf
//   1. echte Blätter» R-4.4 (Eintritt 11.1. + 15); am Do 11.2.2027: R-A1 «Umsetzen · Lollo Rossa» und «Reservierung
//   prüfen · Lollo Rossa».
// Keine Personendaten.
//
// Erwartete Oberfläche (Plan 225; vom Testentwickler festgelegt, wo der Plan offen ist):
// - Heute: Ortskarte <section aria-label="R-1.1"> mit Zeilen (listitem); Zeile «Kurzprüfung» mit den Tasten «Alles ok»
//   (button, schreibt), «Etwas stimmt nicht» (Link nach #/kurzpruefung/R-1.1) und «Öffnen»; Zeile «Wurzeln prüfen» mit
//   «Wurzeln ok» und «Auffällig» (buttons); Zeile «Nachfüllen Kratky» mit dem Link «Nachfüllen».
// - Maske Gefäss: <section aria-label="Offene Aufgaben"> mit denselben Zeilen und Tasten (ohne «Öffnen»); der
//   Hauptknopf `.hv-gefaess-haupt` bleibt das einzige `.hv-btn-primary` in main. Links aus der Maske Gefäss nach
//   Kurzprüfung und Nachfüllen tragen ?von=gefaess.
// - Meldezeile `.hv-meldezeile[role="status"]` mit «Rückgängig machen» (wie tests/e2e/meldezeile.spec.ts), Texte
//   «Kurzprüfung ok: R-1.1», «Wurzeln ok: R-1.1», «Kurzprüfung gespeichert: R-1.1 … 1 Abweichung», «Nachgefüllt: 1.5 l
//   R-3.1»; nach dem Storno «Rückgängig gemacht».
// - Maske Kurzprüfung #/kurzpruefung/R-1.1: h1 mit «R-1.1», Tasten «Licht an?», «Lüfter läuft?», «1.1 Pumpe sprudelt?»
//   (Name beginnt so, danach «ja»/«nein»), «Alles ok» bzw. «Speichern mit 1 Abweichung»; nach dem Speichern die
//   Massnahme und «Zu Heute».
// - Maske Nachfüllen #/nachfuellen/R-3.1: h1 «R-3.1 Nachfüllen Kratky», Ziffernblock («Ziffer n», «Punkt»),
//   «Nachgefüllt»; nach dem Speichern «Zu Heute» und bei von=gefaess «Zum Gefäss R-3.1».
// Zählung: jede Berührung über tipp(), Ziffern eingeschlossen.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ansatzHinzu } from '../fixtures/messen.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';
import { JETZT, rundgangMessungDazu, rundgangTeile } from '../fixtures/rundgang.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { SATZ, umsetzTeile } from '../fixtures/umsetzen.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  tipper: number;
}

/** Do 11.2.2027 09:00 Zürich: Reservierung Lollo Rossa prüfen (Saat 7.1. + 28 + 7) */
const RESERVIERUNG_JETZT = new Date('2027-02-11T08:00:00.000Z');
/** Di 26.1.2027 09:00 Zürich: Station 4.4 auf 1. echte Blätter (Eintritt Lollo Rossa 11.1. + 15) */
const STATION_JETZT = new Date('2027-01-26T08:00:00.000Z');
const P11 = platzId('1.1');
const P31 = platzId('3.1');

/** REST nachbilden, Uhr setzen, Seite öffnen; geschriebene Zeilen und Stornos landen im Datenstand */
async function oeffnen(
  page: Page,
  e: {
    teile: Teile;
    jetzt: Date;
    pfad: string;
    ueberschrift: string | RegExp;
    nachrechnen?: (t: Teile) => Teile;
  },
): Promise<Mitschnitt> {
  const nachrechnen = e.nachrechnen ?? ((t: Teile) => t);
  const m: Mitschnitt = {
    daten: nachrechnen(structuredClone(e.teile)),
    geschrieben: [],
    storniert: [],
    tipper: 0,
  };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        zeileAufnehmen(m.daten, tabelle, z, e.jetzt);
      }
      nachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      stornoAufnehmen(m.daten, tabelle, clientId, e.jetzt);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(e.jetzt);
  await page.goto(e.pfad);
  await page.reload();
  await expect(page.getByRole('heading', { name: e.ueberschrift, level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  return m;
}

const nachRundgang = (t: Teile) => sichtenNachrechnen(t);
const nachUmsetzen = (t: Teile) => umsetzSichtenNachrechnen(sichtenNachrechnen(t));

const heute = (page: Page, teile: Teile, jetzt = JETZT, nachrechnen: (t: Teile) => Teile = nachRundgang) =>
  oeffnen(page, { teile, jetzt, pfad: '/#/heute', ueberschrift: 'Heute', nachrechnen });

const gefaess = (
  page: Page,
  teile: Teile,
  code: string,
  jetzt = JETZT,
  nachrechnen: (t: Teile) => Teile = nachRundgang,
) =>
  oeffnen(page, {
    teile,
    jetzt,
    pfad: `/#/gefaess/${code}`,
    ueberschrift: new RegExp(code.slice(2).replace('.', '\\.')),
    nachrechnen,
  });

/** jede Berührung zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.tipper += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string | RegExp) =>
  typeof name === 'string'
    ? ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }))
    : ort.getByRole('link', { name }).or(ort.getByRole('button', { name }));
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const region = (page: Page, code: string) => page.getByRole('region', { name: code, exact: true });
const zeileIn = (page: Page, code: string, text: string) =>
  region(page, code).getByRole('listitem').filter({ hasText: text });
const offen = (page: Page) => page.getByRole('region', { name: 'Offene Aufgaben', exact: true });
const offeneZeile = (page: Page, text: string) => offen(page).getByRole('listitem').filter({ hasText: text });
const meldezeile = (page: Page) => page.locator('.hv-meldezeile[role="status"]');
const rueckgaengig = (page: Page) =>
  meldezeile(page).getByRole('button', { name: 'Rückgängig machen', exact: true });
const hash = (page: Page) => page.evaluate(() => window.location.hash);

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);
const kurzpruefungen = (m: Mitschnitt) => zeilenVon(m, 'ereignis').filter((z) => z['typ'] === 'kurzpruefung');
const punktVon = (z: Zeile) => (z['daten'] as { punkt?: string } | undefined)?.punkt;
const okVon = (z: Zeile) => (z['daten'] as { ok?: boolean } | undefined)?.ok;
const amPlatz = (m: Mitschnitt, platz: string, punkt: string) =>
  kurzpruefungen(m).filter((z) => z['platz_id'] === platz && punktVon(z) === punkt);
const amBereich = (m: Mitschnitt) => kurzpruefungen(m).filter((z) => (z['platz_id'] ?? null) === null);

/** bereich_id der Ebene n in Anlage R */
const bereichVon = (t: Teile, nummer: number) =>
  (t['bereich'] ?? []).find((b) => b['nummer'] === nummer)?.['id'];

/** ganz im Bild und nicht verdeckt (fester Fuss, Leiste): der Tipp in die Mitte trifft das Element */
async function ohneScrollenTippbar(ort: Locator): Promise<void> {
  await expect(ort).toBeInViewport({ ratio: 1 });
  const trifft = await ort.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t !== null && (e === t || e.contains(t));
  });
  expect(trifft, 'Mitte des Elements frei').toBe(true);
}

/** aktiv: sichtbar, nicht gesperrt (Sperre 400 ms nach einer Aktion bzw. nach dem Erscheinen) */
async function aktiv(ort: Locator): Promise<void> {
  await expect(ort).toBeVisible();
  await expect(ort).not.toHaveAttribute('aria-disabled', 'true');
  await expect(ort).toBeEnabled();
}

/** Storno der Zeile mit dieser client_id, Grund rueckgaengig */
async function storniert(m: Mitschnitt, tabelle: string, clientId: unknown): Promise<void> {
  expect(typeof clientId, 'client_id der geschriebenen Zeile').toBe('string');
  await expect
    .poll(() => m.storniert.find(([t, id]) => t === tabelle && id === clientId)?.[2]['storno_grund'])
    .toBe('rueckgaengig');
  expect(m.storniert.find(([t, id]) => t === tabelle && id === clientId)?.[2]['storniert_am']).toBeTruthy();
}

/** zwei Frames: Scroll- und Render-Ereignisse sind verarbeitet */
const frames = (page: Page) =>
  page.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));

/** Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(m: Mitschnitt, page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await tipp(m, taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`));
    await page.waitForTimeout(120);
  }
}

async function imViewport(page: Page, locator: Locator, was: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${was}: keine Bounding Box`);
  const fenster = await page.evaluate(() => window.innerHeight);
  expect(box.y, `${was} oben im Viewport`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${was} unten im Viewport`).toBeLessThanOrEqual(fenster);
}

/** ohne die Wurzelprüfung vom 11.1. in 1.1: «Wurzeln prüfen» R-1.1 fällig seit 10.1. */
function mitWurzeln11(): Teile {
  const t = rundgangTeile();
  t['ereignis'] = (t['ereignis'] ?? []).filter(
    (e) => !(e['typ'] === 'kurzpruefung' && e['platz_id'] === P11 && punktVon(e) === 'wurzeln'),
  );
  return t;
}

/**
 * Station 4.4 (feste Dosis) mit Lösung seit dem Neuansatz am 20.1.: «Station auf 1. echte Blätter» am 26.1. (Eintritt
 * Lollo Rossa 11.1. + 15; Wechsel erst 3.2., also nicht zusammengelegt)
 */
function stationFaellig(): Teile {
  const t = umsetzTeile({ jetzt: STATION_JETZT });
  ansatzHinzu(t, {
    id: uid('5f', 1),
    kennung: '4.4',
    typ: 'neuansatz',
    begonnenAm: '2027-01-20T07:00:00.000Z',
  });
  return t;
}

/** Kratky 3.1 heute 08:30 Zürich «unter ⅓», EC 1.0 im Band: «Nachfüllen Kratky» R-3.1 (halbe Konzentration) */
function nachfuellenFaellig(): Teile {
  const t = rundgangTeile();
  rundgangMessungDazu(t, {
    kennung: '3.1',
    ec: 1.0,
    fuellstand: 'unter_drittel',
    giltAb: '2027-01-12T07:30:00.000Z',
    nr: 81,
  });
  return sichtenNachrechnen(t);
}

// ---------------------------------------------------------------------------------------------------------------
// UX3-AK3 Kurzprüfung in Heute mit einem Tipper
// ---------------------------------------------------------------------------------------------------------------

test('UX3-AK3 Kurzprüfung R-1.1 in Heute: 1 Tipper «Alles ok», Hash bleibt #/, POST kurzpruefung (pumpe ok, Schlüssel der Aufgabe), Zeile weg, Meldung «Kurzprüfung ok: R-1.1» ganz im Bild mit «Rückgängig machen»', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile());
  const zeile = zeileIn(page, 'R-1.1', 'Kurzprüfung');
  await expect(zeile).toHaveCount(1);
  // die Zeile nennt, was «Alles ok» bestätigt (A3)
  await expect(zeile).toContainText('Pumpe sprudelt?');
  await expect(zeile).toContainText('Licht an?');
  const vorher = await hash(page);

  await tipp(m, zeile.getByRole('button', { name: 'Alles ok', exact: true }));
  await expect(zeile).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Kurzprüfung ok: R-1.1');
  await expect(meldezeile(page)).toBeInViewport({ ratio: 1 });
  await ohneScrollenTippbar(rueckgaengig(page));
  expect(m.tipper, 'ein Tipper').toBe(1);
  expect(await hash(page), 'ohne Maskenwechsel').toBe(vorher);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();

  await expect.poll(() => amPlatz(m, P11, 'pumpe').length).toBe(1);
  const pumpe = amPlatz(m, P11, 'pumpe')[0] as Zeile;
  expect(okVon(pumpe)).toBe(true);
  expect(pumpe['aufgabe_schluessel']).toBe(`kurzpruefung|${P11}|2027-01-12`);
  expect(pumpe['war_faellig_am']).toBe('2027-01-12');
  // Licht und Lüfter der Ebene 1 am Bereich (erste Ortskarte der Ebene heute, A1)
  const ebene1 = bereichVon(m.daten, 1);
  expect(amBereich(m).map(punktVon).sort()).toEqual(['licht', 'luefter']);
  for (const z of amBereich(m)) {
    expect(z['bereich_id']).toBe(ebene1);
    expect(okVon(z)).toBe(true);
  }
  // nur die Kurzprüfung, keine Wurzeln, keine anderen Orte
  expect(kurzpruefungen(m)).toHaveLength(3);
  // die übrigen Zeilen bleiben
  await expect(zeileIn(page, 'R-1.1', 'Messen und nachfüllen')).toHaveCount(1);
  await expect(zeileIn(page, 'R-2.1', 'Kurzprüfung')).toHaveCount(1);
});

test('UX3-AK3 «Rückgängig machen» storniert alle Zeilen (storno_grund rueckgaengig), die Zeile steht wieder in R-1.1', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile());
  const zeile = zeileIn(page, 'R-1.1', 'Kurzprüfung');
  await tipp(m, zeile.getByRole('button', { name: 'Alles ok', exact: true }));
  await expect(zeile).toHaveCount(0);
  await expect.poll(() => kurzpruefungen(m).length).toBe(3);
  const ids = kurzpruefungen(m).map((z) => z['client_id']);

  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  for (const id of ids) await storniert(m, 'ereignis', id);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(rueckgaengig(page)).toHaveCount(0);
  await expect(zeile).toHaveCount(1);
  await expect(zeile.getByRole('button', { name: 'Alles ok', exact: true })).toBeVisible();
  // kein neues Ereignis
  expect(kurzpruefungen(m)).toHaveLength(3);
});

test('UX3-AK3 U13 Doppeltipper auf «Alles ok»: die nachgerückte Zeile bleibt unberührt', async ({ page }) => {
  // R-1.1: «Messen und nachfüllen», «Kurzprüfung», darunter «Wurzeln prüfen» rückt nach
  const m = await heute(page, mitWurzeln11());
  const kurz = zeileIn(page, 'R-1.1', 'Kurzprüfung');
  const wurzeln = zeileIn(page, 'R-1.1', 'Wurzeln prüfen');
  await expect(wurzeln).toHaveCount(1);
  const allesOk = kurz.getByRole('button', { name: 'Alles ok', exact: true });
  await allesOk.scrollIntoViewIfNeeded();
  await frames(page);
  const box = await allesOk.boundingBox();
  if (!box) throw new Error('«Alles ok»: keine Bounding Box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  await page.mouse.click(x, y);
  await expect(kurz).toHaveCount(0);
  // Zeit für einen allfälligen zweiten Schreibvorgang
  await page.waitForTimeout(800);

  expect(amPlatz(m, P11, 'pumpe')).toHaveLength(1);
  expect(amPlatz(m, P11, 'wurzeln')).toHaveLength(0);
  expect(amBereich(m)).toHaveLength(2);
  expect(zeilenVon(m, 'aufschub')).toHaveLength(0);
  expect(await hash(page)).not.toMatch(/^#\/(messen|gefaess|kurzpruefung)\//);
  await expect(wurzeln).toHaveCount(1);
  await expect(wurzeln.getByRole('button', { name: 'Wurzeln ok', exact: true })).toBeVisible();
  await expect(meldezeile(page)).toContainText('Kurzprüfung ok: R-1.1');
});

test('UX3-AK3 «Etwas stimmt nicht» öffnet #/kurzpruefung/R-1.1 mit den Punkten wie im Rundgang (Licht an?, Lüfter läuft?, 1.1 Pumpe sprudelt?); Abweichung speichern zeigt die Massnahme und «Zu Heute»', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile());
  await tipp(
    m,
    zeileIn(page, 'R-1.1', 'Kurzprüfung').getByRole('link', { name: 'Etwas stimmt nicht', exact: true }),
  );
  await expect.poll(() => hash(page)).toBe('#/kurzpruefung/R-1.1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('R-1.1');
  await expect(page.locator('main')).toHaveAttribute('data-density', 'regal');
  await expect(page.getByRole('button', { name: /^Licht an\?/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Lüfter läuft\?/ })).toBeVisible();
  const pumpe = page.getByRole('button', { name: /^1\.1 Pumpe sprudelt\?/ });
  await expect(pumpe).toBeVisible();
  // nur dieser Ort: keine Punkte von R-2.1 oder R-3.1
  await expect(page.getByRole('button', { name: /^2\.1 / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^3\.1 / })).toHaveCount(0);
  await expect(taste(page, 'Alles ok')).toBeVisible();

  await tipp(m, pumpe);
  await expect(pumpe).toContainText('nein');
  await tipp(m, taste(page, 'Speichern mit 1 Abweichung'));

  await expect.poll(() => amPlatz(m, P11, 'pumpe').length).toBe(1);
  const z = amPlatz(m, P11, 'pumpe')[0] as Zeile;
  expect(okVon(z)).toBe(false);
  expect(z['aufgabe_schluessel']).toBe(`kurzpruefung|${P11}|2027-01-12`);
  expect(
    amBereich(m)
      .map((x) => `${String(punktVon(x))} ${String(okVon(x))}`)
      .sort(),
  ).toEqual(['licht true', 'luefter true']);
  await expect(meldezeile(page)).toContainText('Kurzprüfung gespeichert: R-1.1');
  await expect(meldezeile(page)).toContainText('1 Abweichung');
  await expect(rueckgaengig(page)).toBeVisible();
  // Abweichung mit Massnahme wie in der Abschlussliste des Rundgangs
  await expect(page.locator('main')).toContainText('Pumpe sprudelt nicht');
  await expect(page.locator('main')).toContainText('Pumpe, Schlauch und Luftstein prüfen');

  const zurueck = knopf(page.locator('main'), 'Zu Heute').last();
  await aktiv(zurueck);
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper, 'Etwas stimmt nicht, Punkt, Speichern, Zu Heute').toBe(4);
  await expect(zeileIn(page, 'R-1.1', 'Kurzprüfung')).toHaveCount(0);
  await expect(zeileIn(page, 'R-1.1', 'Belüftung prüfen')).toHaveCount(1);
});

// ---------------------------------------------------------------------------------------------------------------
// UX3-AK4 Maske Gefäss mit denselben Zeilen und Tasten
// ---------------------------------------------------------------------------------------------------------------

test('UX3-AK4 Maske Gefäss R-1.1: jede Zeile unter «Offene Aufgaben» hat mindestens eine Taste, keine «Öffnen»; Hauptknopf ohne Scrollen und einziges primary', async ({
  page,
}) => {
  await gefaess(page, mitWurzeln11(), 'R-1.1');
  await expect(offen(page)).toBeVisible({ timeout: 15_000 });
  const zeilen = offen(page).getByRole('listitem');
  await expect(zeilen).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) {
    const z = zeilen.nth(i);
    const tasten = z.getByRole('button').or(z.getByRole('link'));
    expect(await tasten.count(), `Zeile ${i + 1}: mindestens eine Taste`).toBeGreaterThanOrEqual(1);
    await expect(knopf(z, 'Öffnen')).toHaveCount(0);
  }
  await expect(offen(page).getByRole('link', { name: 'Öffnen', exact: true })).toHaveCount(0);

  const kurz = offeneZeile(page, 'Kurzprüfung');
  await expect(kurz.getByRole('button', { name: 'Alles ok', exact: true })).toBeVisible();
  await expect(kurz.getByRole('link', { name: 'Etwas stimmt nicht', exact: true })).toHaveCount(1);
  const wurzeln = offeneZeile(page, 'Wurzeln prüfen');
  await expect(wurzeln.getByRole('button', { name: 'Wurzeln ok', exact: true })).toHaveCount(1);
  await expect(wurzeln.getByRole('button', { name: 'Auffällig', exact: true })).toHaveCount(1);
  const messen = offeneZeile(page, 'Messen und nachfüllen');
  await expect(messen.getByRole('link', { name: 'Messen', exact: true })).toHaveCount(1);
  await expect(messen.getByRole('button', { name: 'Pegel ok', exact: true })).toHaveCount(1);

  // Hauptknopf: einziges primary, Kopf, Zustand und Hauptknopf ohne Scrollen auf 360 × 640
  const haupt = page.locator('main .hv-gefaess-haupt');
  await expect(haupt).toHaveCount(1);
  await expect(page.locator('main .hv-btn-primary')).toHaveCount(1);
  await expect(haupt).toHaveClass(/hv-btn-primary/);
  await imViewport(page, page.getByRole('heading', { level: 1 }), 'Kopf');
  await imViewport(page, page.getByRole('region', { name: 'Zustand' }), 'Zustand');
  await imViewport(page, haupt, 'Hauptknopf');
  expect(await page.evaluate(() => window.scrollY), 'nicht gescrollt').toBe(0);
});

test('UX3-AK4 Gefäss: «Alles ok» und «Wurzeln ok» schreiben mit 1 Tipper, Meldung und Rückgängig wie in Heute', async ({
  page,
}) => {
  const m = await gefaess(page, mitWurzeln11(), 'R-1.1');
  await expect(offen(page)).toBeVisible({ timeout: 15_000 });
  const vorher = await hash(page);

  // Kurzprüfung mit einem Tipper
  const kurz = offeneZeile(page, 'Kurzprüfung');
  await tipp(m, kurz.getByRole('button', { name: 'Alles ok', exact: true }));
  await expect(kurz).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Kurzprüfung ok: R-1.1');
  await ohneScrollenTippbar(rueckgaengig(page));
  expect(await hash(page), 'bleibt in der Maske Gefäss').toBe(vorher);
  await expect.poll(() => amPlatz(m, P11, 'pumpe').length).toBe(1);
  expect(okVon(amPlatz(m, P11, 'pumpe')[0] as Zeile)).toBe(true);
  expect(amPlatz(m, P11, 'wurzeln')).toHaveLength(0);

  // Wurzeln mit einem Tipper (nach der Sperre von 400 ms)
  const wurzeln = offeneZeile(page, 'Wurzeln prüfen');
  const wurzelnOk = wurzeln.getByRole('button', { name: 'Wurzeln ok', exact: true });
  await aktiv(wurzelnOk);
  await tipp(m, wurzelnOk);
  await expect(wurzeln).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Wurzeln ok: R-1.1');
  await expect.poll(() => amPlatz(m, P11, 'wurzeln').length).toBe(1);
  const w = amPlatz(m, P11, 'wurzeln')[0] as Zeile;
  expect(okVon(w)).toBe(true);
  expect(w['aufgabe_schluessel']).toBe(`wurzeln_pruefen|${P11}|2027-01-10`);
  expect(w['war_faellig_am']).toBe('2027-01-10');
  expect(m.tipper, 'je Aufgabe ein Tipper').toBe(2);
  expect(await hash(page)).toBe(vorher);

  // Rückgängig nimmt die Wurzelprüfung zurück, die Zeile steht wieder da
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'ereignis', w['client_id']);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(wurzeln).toHaveCount(1);
  await expect(wurzeln.getByRole('button', { name: 'Auffällig', exact: true })).toBeVisible();
});

test('UX3-AK4 Gefäss mit Station (tests/fixtures/umsetzen.ts): «Ansetzen» bei «Station auf 1. echte Blätter» führt in den Ansatz', async ({
  page,
}) => {
  const m = await gefaess(page, stationFaellig(), 'R-4.4', STATION_JETZT, nachUmsetzen);
  await expect(offen(page)).toBeVisible({ timeout: 15_000 });
  const station = offeneZeile(page, 'Station auf 1. echte Blätter');
  await expect(station).toHaveCount(1);
  await expect(knopf(station, 'Öffnen')).toHaveCount(0);
  await tipp(m, station.getByRole('link', { name: 'Ansetzen', exact: true }));
  await expect.poll(() => hash(page)).toBe('#/ansatz/R-4.4');
  expect(m.tipper).toBe(1);
});

test('UX3-AK4 Gefäss mit Reservierung und Umsetzen (tests/fixtures/umsetzen.ts): Tasten «Umsetzen» führen in die Maske Umsetzen des Satzes', async ({
  page,
}) => {
  const m = await gefaess(
    page,
    umsetzTeile({ jetzt: RESERVIERUNG_JETZT }),
    'R-A1',
    RESERVIERUNG_JETZT,
    nachUmsetzen,
  );
  await expect(offen(page)).toBeVisible({ timeout: 15_000 });
  const reservierung = offeneZeile(page, 'Reservierung prüfen');
  await expect(reservierung).toHaveCount(1);
  const umsetzen = offen(page)
    .getByRole('listitem')
    .filter({ hasText: /^Umsetzen/ });
  await expect(umsetzen).toHaveCount(1);
  for (const z of [reservierung, umsetzen]) {
    await expect(knopf(z, 'Öffnen')).toHaveCount(0);
    await expect(z.getByRole('link', { name: 'Umsetzen', exact: true })).toHaveAttribute(
      'href',
      new RegExp(`^#/umsetzen/${SATZ.lollo}`),
    );
  }
  await tipp(m, reservierung.getByRole('link', { name: 'Umsetzen', exact: true }));
  await expect.poll(() => hash(page)).toMatch(new RegExp(`^#/umsetzen/${SATZ.lollo}`));
  expect(m.tipper).toBe(1);
});

// ---------------------------------------------------------------------------------------------------------------
// UX3-AK5 Nachfüllen Kratky mit einem Tipper (Variante A)
// ---------------------------------------------------------------------------------------------------------------

test('UX3-AK5 «Nachfüllen» bei «Nachfüllen Kratky» R-3.1 (Messung «unter ⅓», rundgangMessungDazu()) führt mit 1 Tipper nach #/nachfuellen/R-3.1 «R-3.1 Nachfüllen Kratky»; «Nachgefüllt» schreibt naehrloesungsansatz typ nachfuellen mit aufgabe_schluessel', async ({
  page,
}) => {
  const m = await heute(page, nachfuellenFaellig());
  const zeile = zeileIn(page, 'R-3.1', 'Nachfüllen Kratky');
  await expect(zeile).toHaveCount(1);
  await expect(knopf(zeile, 'Öffnen')).toHaveCount(0);
  await tipp(m, zeile.getByRole('link', { name: 'Nachfüllen', exact: true }));
  await expect.poll(() => hash(page)).toBe('#/nachfuellen/R-3.1');
  await expect(page.getByRole('heading', { name: 'R-3.1 Nachfüllen Kratky', level: 1 })).toBeVisible();
  expect(m.tipper, 'ein Tipper bis in den Ablauf').toBe(1);
  await expect(page.locator('main')).toHaveAttribute('data-density', 'regal');
  await expect(page.getByText(/höchstens 2\.4 l/)).toBeVisible();

  await ziffern(m, page, '1.5');
  await tipp(m, taste(page, 'Nachgefüllt'));
  await expect.poll(() => zeilenVon(m, 'naehrloesungsansatz').length).toBe(1);
  const kopf = zeilenVon(m, 'naehrloesungsansatz')[0] as Zeile;
  expect(kopf).toMatchObject({
    platz_id: P31,
    typ: 'nachfuellen',
    nachgefuellt_l: 1.5,
    aufgabe_schluessel: `nachfuellen_kratky|${P31}|2027-01-12`,
    war_faellig_am: '2027-01-12',
  });
  // halbe Konzentration: Positionen mit dem gegebenen Dünger, Bezug die nachgefüllten Liter
  await expect.poll(() => zeilenVon(m, 'ansatz_position').length).toBeGreaterThan(0);
  for (const p of zeilenVon(m, 'ansatz_position')) {
    expect(p['ansatz_id']).toBe(kopf['id'] ?? kopf['client_id']);
    expect(p['bezugsvolumen_l']).toBe(1.5);
  }
  await expect(meldezeile(page)).toContainText('Nachgefüllt: 1.5 l R-3.1');
  await ohneScrollenTippbar(rueckgaengig(page));

  const zurueck = knopf(page.locator('main'), 'Zu Heute').last();
  await aktiv(zurueck);
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper, 'Nachfüllen, 1, Punkt, 5, Nachgefüllt, Zu Heute').toBe(6);
  await expect(zeileIn(page, 'R-3.1', 'Nachfüllen Kratky')).toHaveCount(0);
});

test('UX3-AK5 aus der Maske Gefäss ebenso mit 1 Tipper; nach dem Speichern «Zum Gefäss R-3.1»', async ({
  page,
}) => {
  const m = await gefaess(page, nachfuellenFaellig(), 'R-3.1');
  await expect(offen(page)).toBeVisible({ timeout: 15_000 });
  const zeile = offeneZeile(page, 'Nachfüllen Kratky');
  await expect(zeile).toHaveCount(1);
  await tipp(m, zeile.getByRole('link', { name: 'Nachfüllen', exact: true }));
  await expect.poll(() => hash(page)).toBe('#/nachfuellen/R-3.1?von=gefaess');
  await expect(page.getByRole('heading', { name: 'R-3.1 Nachfüllen Kratky', level: 1 })).toBeVisible();
  expect(m.tipper).toBe(1);

  await ziffern(m, page, '1');
  await tipp(m, taste(page, 'Nachgefüllt'));
  await expect.poll(() => zeilenVon(m, 'naehrloesungsansatz').length).toBe(1);
  expect(zeilenVon(m, 'naehrloesungsansatz')[0]).toMatchObject({
    platz_id: P31,
    typ: 'nachfuellen',
    nachgefuellt_l: 1,
    aufgabe_schluessel: `nachfuellen_kratky|${P31}|2027-01-12`,
  });
  await expect(meldezeile(page)).toContainText(/Nachgefüllt: 1(\.0)? l R-3\.1/);

  const zumGefaess = knopf(page.locator('main'), 'Zum Gefäss R-3.1');
  await aktiv(zumGefaess);
  await tipp(m, zumGefaess);
  await expect.poll(() => hash(page)).toBe('#/gefaess/R-3.1');
  await expect(offen(page).getByRole('listitem').filter({ hasText: 'Nachfüllen Kratky' })).toHaveCount(0);
});
