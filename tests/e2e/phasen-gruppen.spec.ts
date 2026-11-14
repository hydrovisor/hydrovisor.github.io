// UX4 Phasenkarten je Sorte gebündelt (Issue #226, Plan 226 Testliste; UX4-AK2, UX4-AK3; R1.5, R1.6, U4, U13).
// REST nachgebildet (tests/e2e/rest.ts) wie tests/e2e/phasen.spec.ts und meldezeile.spec.ts: POST und PATCH aus
// schreiben() landen im nachgebildeten Bündel, Phase und ereignis_satz rechnet phasenNachrechnen() nach. Feste Uhr,
// Europe/Zurich und 360 × 640 aus der Konfiguration. Datenstände aus tests/fixtures/phasen.ts:
// - gleicheSaetzeTeile() (11.1.2027 09:00 Zürich): Karte «Salat · A1 · gesät 7.1.» mit 5 Sätzen Lollo Rossa (81 bis
//   85, je 1 Pflanzung) und Eichblatt (86), Frage Keimung → Anzucht heute fällig.
// - rueckdatiertTeile() (12.1.2027): Karte «Phasen nachführen (2 Sätze)».
// Ohne Personendaten.
//
// Erwartete Oberfläche (Plan 226 Phasenkarte; Vertrag des Leads):
// - Gruppenzeile mit Text «Lollo Rossa × 5» (bei einer Pflanzung ohne «× 1»), darunter eine Choice (role group) mit
//   Namen «<Sorte> · <Übergang>» und den Knöpfen «Ja», «Noch nicht», «Problem» (aria-pressed) als Segmente in einer
//   Zeile. Weicht ein Satz ab, nennt die Gruppenzeile «1 abweichend».
// - Fusszeile: «Einzeln beantworten» (aria-expanded, nur wenn eine Gruppe mehr als einen Satz hat) und «Alle Ja».
//   Einzelzeilen: Choice mit Namen «<Sorte> <i> · <Übergang>», i ab 1 in der Reihenfolge der Karte.
// - «Phasen nachführen» hat genau eine Taste «Alle übernehmen».
// - Meldung in der Meldezeile (.hv-meldezeile, role status) «Gespeichert: <Kartentitel>» mit «Rückgängig machen».
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  GLEICH,
  GLEICH_JETZT,
  GLEICH_TITEL,
  gleicheSaetzeTeile,
  phasenNachrechnen,
  RUECK_JETZT,
  rueckdatiertTeile,
  satzId,
} from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  beruehrungen: number;
}

async function mitDaten(page: Page, start: Teile, jetzt: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: phasenNachrechnen(structuredClone(start)),
    geschrieben: [],
    storniert: [],
    beruehrungen: 0,
  };
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
      phasenNachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      stornoAufnehmen(m.daten, tabelle, clientId, jetzt);
      phasenNachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
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
/** nächste section um die Überschrift (Card) */
const karte = (page: Page, titel: string) =>
  page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]');
const segment = (gruppe: Locator, name: string) => gruppe.getByRole('button', { name, exact: true });
const antworten = (m: Mitschnitt) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === 'phase_antwort').map(([, z]) => z);
const daten = (z: Zeile | undefined) => (z?.['daten'] ?? {}) as Zeile;
const meldezeile = (page: Page) => page.locator('.hv-meldezeile[role="status"]');
const rueckgaengig = (page: Page) =>
  meldezeile(page).getByRole('button', { name: 'Rückgängig machen', exact: true });

const LOLLO = GLEICH.lollo.map((nr) => satzId(nr));
const EICHBLATT = satzId(GLEICH.eichblatt);
const GRUPPE_LOLLO = 'Lollo Rossa · Keimung → Anzucht';
const GRUPPE_EICHBLATT = 'Eichblatt · Keimung → Anzucht';

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

async function hoehe(ort: Locator): Promise<number> {
  const box = await ort.boundingBox();
  if (!box) throw new Error('keine Bounding Box');
  return box.height;
}

// ---------------------------------------------------------------------------------------------------------------
// UX4-AK2 eine Zeile je Sorte, «Alle Ja» in einem Tipper, «Phasen nachführen» mit einer Taste
// ---------------------------------------------------------------------------------------------------------------

test('UX4-AK2 Satz mit 5 gleichen Pflanzen: eine Zeile «Lollo Rossa × 5», die drei Antworten auf gleicher Höhe in einer Zeile; 1 Tipper «Alle Ja» schreibt 5 phase_antwort ja am Satz; Meldung «Gespeichert: …» mit «Rückgängig machen»', async ({
  page,
}) => {
  const m = await mitDaten(page, gleicheSaetzeTeile(), GLEICH_JETZT);
  const k = karte(page, GLEICH_TITEL);
  await expect(k).toHaveCount(1);

  // eine Zeile für die 5 Sätze, Eichblatt als eigene Zeile ohne «× 1»
  await expect(k.getByText('Lollo Rossa × 5').first()).toBeVisible();
  await expect(k.getByText(/Eichblatt/).first()).toBeVisible();
  await expect(k.getByText(/× 1\b/)).toHaveCount(0);
  const lollo = k.getByRole('group', { name: GRUPPE_LOLLO, exact: true });
  await expect(lollo).toHaveCount(1);
  await expect(k.getByRole('group', { name: GRUPPE_EICHBLATT, exact: true })).toHaveCount(1);
  // eingeklappt: keine Einzelzeilen
  await expect(k.getByRole('group', { name: /^Lollo Rossa \d+ · / })).toHaveCount(0);

  // Ja vorgewählt; die drei Segmente auf gleicher Höhe nebeneinander
  await expect(segment(lollo, 'Ja')).toHaveAttribute('aria-pressed', 'true');
  await expect(segment(lollo, 'Noch nicht')).toHaveAttribute('aria-pressed', 'false');
  await expect(segment(lollo, 'Problem')).toHaveAttribute('aria-pressed', 'false');
  const boxen = await Promise.all(
    ['Ja', 'Noch nicht', 'Problem'].map(async (n) => {
      const b = await segment(lollo, n).boundingBox();
      if (!b) throw new Error(`«${n}»: keine Bounding Box`);
      return b;
    }),
  );
  const [ja, nochNicht, problem] = boxen as [(typeof boxen)[0], (typeof boxen)[0], (typeof boxen)[0]];
  for (const b of [nochNicht, problem]) expect(Math.abs(b.y - ja.y), 'gleiche Höhe').toBeLessThanOrEqual(1);
  expect(ja.x + ja.width, 'Ja links von Noch nicht').toBeLessThanOrEqual(nochNicht.x + 1);
  expect(nochNicht.x + nochNicht.width, 'Noch nicht links von Problem').toBeLessThanOrEqual(problem.x + 1);
  expect(problem.x + problem.width, 'Problem im Bild').toBeLessThanOrEqual(360);

  // 1 Tipper
  await tipp(m, knopf(k, 'Alle Ja'));
  expect(m.beruehrungen).toBe(1);
  await expect.poll(() => antworten(m).length).toBe(6);
  for (const s of LOLLO) {
    const zeilen = antworten(m).filter((z) => z['satz_id'] === s);
    expect(zeilen, s).toHaveLength(1);
    expect(daten(zeilen[0])).toMatchObject({ phase: 'anzucht', antwort: 'ja', nachgefuehrt: false });
    expect(zeilen[0]?.['war_faellig_am']).toBe('2027-01-11');
    expect(zeilen[0]?.['aufgabe_schluessel']).toBe(`phase_bestaetigen|${s}|2027-01-11`);
  }
  expect(daten(antworten(m).find((z) => z['satz_id'] === EICHBLATT))).toMatchObject({ antwort: 'ja' });
  for (const z of antworten(m)) expect(z['pflanzung_id'] ?? null).toBeNull();

  await expect(meldezeile(page)).toContainText(`Gespeichert: ${GLEICH_TITEL}`);
  await ohneScrollenTippbar(rueckgaengig(page));
  await expect(karte(page, GLEICH_TITEL)).toHaveCount(0);
});

test('UX4-AK2 die Karte ist auf 360 × 640 höchstens 400 dp hoch (boundingBox der section), kein seitliches Scrollen, Tasten mindestens 68 dp, keine Systemtastatur', async ({
  page,
}) => {
  await mitDaten(page, gleicheSaetzeTeile(), GLEICH_JETZT);
  const k = karte(page, GLEICH_TITEL);
  await expect(k).toHaveCount(1);
  expect(await hoehe(k), 'Höhe der Phasenkarte').toBeLessThanOrEqual(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  const lollo = k.getByRole('group', { name: GRUPPE_LOLLO, exact: true });
  const eichblatt = k.getByRole('group', { name: GRUPPE_EICHBLATT, exact: true });
  const tasten = [
    segment(lollo, 'Ja'),
    segment(lollo, 'Noch nicht'),
    segment(lollo, 'Problem'),
    segment(eichblatt, 'Ja'),
    segment(eichblatt, 'Noch nicht'),
    segment(eichblatt, 'Problem'),
    k.getByRole('button', { name: 'Einzeln beantworten', exact: true }),
    knopf(k, 'Alle Ja'),
  ];
  for (const t of tasten) {
    await expect(t).toBeVisible();
    expect(await hoehe(t), 'Tippfläche im Regal').toBeGreaterThanOrEqual(67.5);
  }
  await ohneTastatur(page);
});

test('UX4-AK2 «Phasen nachführen» hat genau eine Taste «Alle übernehmen»; 1 Tipper schreibt wie R1.6', async ({
  page,
}) => {
  const m = await mitDaten(page, rueckdatiertTeile(), RUECK_JETZT);
  const nachfuehren = karte(page, 'Phasen nachführen (2 Sätze)');
  await expect(nachfuehren).toHaveCount(1);
  const uebernehmen = knopf(nachfuehren, 'Alle übernehmen');
  await expect(uebernehmen).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Alle übernehmen', exact: true })).toHaveCount(1);

  await tipp(m, uebernehmen);
  expect(m.beruehrungen).toBe(1);
  await expect.poll(() => antworten(m).length).toBe(2);
  const nach = (nr: number) => antworten(m).find((z) => z['satz_id'] === satzId(nr));
  expect(daten(nach(70))).toMatchObject({
    phase: 'anzucht',
    antwort: 'ja',
    nachgefuehrt: true,
    erwartet_am: '2027-01-05',
  });
  expect(nach(70)?.['gilt_ab']).toBe('2027-01-05T11:00:00.000Z');
  expect(daten(nach(71))).toMatchObject({ phase: 'anzucht', nachgefuehrt: true, erwartet_am: '2027-01-08' });
  for (const z of antworten(m)) expect(z['pflanzung_id'] ?? null).toBeNull();
  await expect(meldezeile(page)).toContainText('Gespeichert');
  await expect(karte(page, 'Phasen nachführen (2 Sätze)')).toHaveCount(0);
});

// ---------------------------------------------------------------------------------------------------------------
// UX4-AK3 Ausnahme je Satz nach «Einzeln beantworten»
// ---------------------------------------------------------------------------------------------------------------

test('UX4-AK3 «Einzeln beantworten», «Noch nicht» bei Lollo Rossa 3, «Alle Ja»: 3 Tipper, ein Vorgang mit 4 × ja und 1 × noch_nicht am richtigen Satz; vor «Alle Ja» kein POST', async ({
  page,
}) => {
  const m = await mitDaten(page, gleicheSaetzeTeile(), GLEICH_JETZT);
  const k = karte(page, GLEICH_TITEL);
  await expect(k).toHaveCount(1);
  const einzeln = k.getByRole('button', { name: 'Einzeln beantworten', exact: true });
  await expect(einzeln).toHaveAttribute('aria-expanded', 'false');

  // (1) aufklappen: je Satz eine Einzelzeile, nichts geschrieben
  await tipp(m, einzeln);
  await expect(einzeln).toHaveAttribute('aria-expanded', 'true');
  await expect(k.getByRole('group', { name: /^Lollo Rossa \d+ · Keimung → Anzucht$/ })).toHaveCount(5);
  const s3 = k.getByRole('group', { name: 'Lollo Rossa 3 · Keimung → Anzucht', exact: true });
  await expect(s3).toHaveCount(1);
  await expect(segment(s3, 'Ja')).toHaveAttribute('aria-pressed', 'true');

  // (2) Ausnahme für Satz 3, nichts geschrieben; die Gruppenzeile nennt die Abweichung
  await tipp(m, segment(s3, 'Noch nicht'));
  await expect(segment(s3, 'Noch nicht')).toHaveAttribute('aria-pressed', 'true');
  await expect(k.getByText(/1 abweichend/).first()).toBeVisible();
  const gruppe = k.getByRole('group', { name: GRUPPE_LOLLO, exact: true });
  await expect(gruppe.getByRole('button', { pressed: true })).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(m.geschrieben, 'vor «Alle Ja» kein POST').toEqual([]);

  // (3) Alle Ja
  await tipp(m, knopf(k, 'Alle Ja'));
  expect(m.beruehrungen).toBe(3);
  await expect.poll(() => antworten(m).length).toBe(6);
  const lollo = LOLLO.map((s) => antworten(m).filter((z) => z['satz_id'] === s));
  for (const zeilen of lollo) expect(zeilen).toHaveLength(1);
  expect(lollo.map((zeilen) => daten(zeilen[0])['antwort'])).toEqual(['ja', 'ja', 'noch_nicht', 'ja', 'ja']);
  const ausnahme = lollo[2]?.[0];
  expect(ausnahme?.['satz_id']).toBe(satzId(83));
  expect(daten(ausnahme)).toMatchObject({ phase: 'anzucht', antwort: 'noch_nicht' });
  expect(ausnahme?.['war_faellig_am']).toBe('2027-01-11');
  expect(ausnahme?.['aufgabe_schluessel']).toBe(`phase_bestaetigen|${satzId(83)}|2027-01-11`);
  for (const z of antworten(m)) {
    expect(z['pflanzung_id'] ?? null).toBeNull();
    expect(z['gilt_ab']).toBe(GLEICH_JETZT.toISOString());
  }
  // ein Vorgang, eine Meldung
  await expect(meldezeile(page)).toHaveCount(1);
  await expect(meldezeile(page)).toContainText(`Gespeichert: ${GLEICH_TITEL}`);
});

test('UX4-AK3 «Rückgängig machen» storniert alle 5 Antworten in umgekehrter Reihenfolge, die Karte steht wieder da', async ({
  page,
}) => {
  const m = await mitDaten(page, gleicheSaetzeTeile(), GLEICH_JETZT);
  await tipp(m, knopf(karte(page, GLEICH_TITEL), 'Alle Ja'));
  await expect.poll(() => antworten(m).length).toBe(6);
  const ids = antworten(m).map((z) => String(z['client_id']));
  // die 5 Lollo-Antworten sind darunter
  const lollo = antworten(m)
    .filter((z) => LOLLO.includes(String(z['satz_id'])))
    .map((z) => String(z['client_id']));
  expect(lollo).toHaveLength(5);

  await expect(rueckgaengig(page)).toBeVisible();
  await expect(rueckgaengig(page)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(rueckgaengig(page)).toBeEnabled();
  await tipp(m, rueckgaengig(page));
  await expect.poll(() => m.storniert.length).toBe(ids.length);
  expect(m.storniert.map(([t, id]) => [t, id])).toEqual([...ids].reverse().map((id) => ['ereignis', id]));
  for (const [, , felder] of m.storniert) {
    expect(felder['storno_grund']).toBe('rueckgaengig');
    expect(felder['storniert_am']).toBeTruthy();
  }
  for (const id of lollo) expect(m.storniert.some(([, x]) => x === id)).toBe(true);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(karte(page, GLEICH_TITEL)).toHaveCount(1);
  await expect(karte(page, GLEICH_TITEL).getByText('Lollo Rossa × 5').first()).toBeVisible();
});
