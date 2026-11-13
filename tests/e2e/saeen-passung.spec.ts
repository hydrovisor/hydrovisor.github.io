// Maske «Säen» mit Passungs-Empfehlung (Plan 36 Testliste E2E; UC5-AK13, R3.1, E-F4-2). REST nachgebildet wie
// saeen.spec.ts: POST und PATCH aus schreiben() werden mitgeschnitten. Regal R aus tests/fixtures/passung.ts (Bestand in
// 2.3, Stammwerte der Passung, sieben Sorten), dazu die Einstellung aus tests/fixtures/saeen.ts. Feste Uhr ZB_JETZT
// (Mo 18.1.2027 09:00 Zürich); 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 36 offen ist):
// - Einstieg aus «Gefäss» 3.3: #/saeen?ziel=R-3.3&von=gefaess. 3.3 ist leer und Kratky belüftet (Ebene 3): Ochsenherz
//   (Tomate, nur DWC) ist die einzige Sorte «Nicht empfohlen», alle anderen sind «Empfohlen».
// - Schritt 1 mit Zielgefäss: Sorten als Buttons, deren Name mit dem Sortennamen beginnt; im Button das Wort der Stufe
//   («Empfohlen», «Möglich», «Nicht empfohlen») und die Gründe («nicht für Kratky»). Die Gruppe «Nicht empfohlen» ist
//   eingeklappt; der Knopf «Nicht empfohlen (1) anzeigen» klappt sie auf. Danach wählt ein Tipp die Sorte, «Weiter»
//   öffnet Schritt 2 ohne Dialog.
// - Schritt 1 ohne Zielgefäss: keine Stufe, kein Aufklappknopf, alle Sorten sichtbar.
// - Schritt 2: nach der Wahl des Zielgefässes je gewählte Sorte eine Zeile «<Sorte>: <Stufe> · <Grund> · …»; ein
//   Wechsel des Gefässes rechnet neu. Die Passung braucht kein Netz (alle Teile im Bündel).
// - Gespeicherte pflanzung-Zeilen tragen einstufung, rang und gruende (Codes P1 bis P11).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { type Teile } from '../fixtures/regal.ts';
import { passungTeile, SORTE, ZB_JETZT } from '../fixtures/passung.ts';
import { saatWissen } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';
import { gemueseKachel, sorteOeffnen, sortenZeile, sorteWaehlen } from './sortenwahl-hilfe.ts';

const JETZT = ZB_JETZT;
const AUS_GEFAESS_33 = '/#/saeen?ziel=R-3.3&von=gefaess';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  beruehrungen: number;
}

async function mitDaten(page: Page, start: Teile, pfad: string): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], beruehrungen: 0 };
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
    },
  );
  await page.clock.setFixedTime(JETZT);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  return m;
}

/** jede Berührung über diese Hilfe zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

const zielgefaess = (page: Page, kennung: string) =>
  page.getByRole('button', { name: new RegExp(`^${kennung.replace('.', '\\.')}(?![.\\d])`) }).first();
const knopf = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const reihe = (page: Page, n: number) => page.getByRole('button', { name: `Reihe ${n} wählen` });
const STUFE = /^(Empfohlen|Möglich|Nicht empfohlen)$/;

/** Regal mit Passungs-Stammwerten und der Einstellung (Thema, Zeitzone) */
function regal(): Teile {
  const t = passungTeile();
  t['einstellung'] = saatWissen()['einstellung'] ?? [];
  return t;
}

test('UC5-AK13 Setzen einer Nicht-empfohlen-Sorte braucht keine zusätzliche Berührung ausser dem Aufklappen', async ({
  page,
}) => {
  const m = await mitDaten(page, regal(), AUS_GEFAESS_33);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();

  // Empfohlen offen, Nicht empfohlen eingeklappt (Plan 205: Kacheln je Gemüse; Tomate hat nur Ochsenherz)
  await expect(gemueseKachel(page, 'Salat')).toContainText('Empfohlen');
  await expect(gemueseKachel(page, 'Tomate')).toHaveCount(0);
  const aufklappen = knopf(page, 'Nicht empfohlen (1) anzeigen');
  await expect(aufklappen).toBeVisible();

  // ein Tipp klappt auf, dann wie jede Sorte: Kachel, «Wählen und weiter» ohne Rückfrage
  await tipp(m, aufklappen);
  await expect(gemueseKachel(page, 'Tomate')).toContainText('Nicht empfohlen');
  await sorteOeffnen(page, 'Tomate', 'Ochsenherz', (ziel) => tipp(m, ziel));
  await expect(page.locator('.hv-saeen-sortekopf')).toContainText('Nicht empfohlen');
  await expect(page.locator('.hv-saeen-sortekopf')).toContainText('nicht für Kratky');
  await tipp(m, knopf(page, 'Wählen und weiter'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  const mitTomate = m.beruehrungen;
  expect(mitTomate).toBe(3);

  // Direktsaat in 3.3: Reihe 1, Weiter, Speichern
  await tipp(m, reihe(page, 1));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'pflanzung').length).toBeGreaterThan(0);
  const satz = zeilenVon(m, 'satz').find((s) => s['sorte_id'] === SORTE.ochsenherz);
  expect(satz).toBeDefined();
  for (const p of zeilenVon(m, 'pflanzung')) {
    expect(p['satz_id']).toBe(satz?.['id']);
    expect(p['einstufung']).toBe('nicht_empfohlen');
    expect(p['gruende']).toContain('P1');
    expect((p['gruende'] as string[])[0]).toBe('P1');
    expect(typeof p['rang']).toBe('number');
  }

  // Vergleich: die nicht empfohlene Sorte braucht höchstens eine Berührung mehr (das Aufklappen) als eine empfohlene;
  // Lollo Rossa braucht den Tipp auf die Sortenzeile, weil Salat zwei Sorten hat, Tomate das Aufklappen (Plan 205)
  m.beruehrungen = 0;
  await page.goto('/#/');
  await page.goto(AUS_GEFAESS_33);
  await page.reload();
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel), { weiter: true });
  expect(m.beruehrungen).toBe(3);
  expect(mitTomate - m.beruehrungen).toBeLessThanOrEqual(1);
});

test('UC5 Schritt 2: nach der Wahl des Zielgefässes steht je gewählte Sorte eine Zeile mit Einstufung und Gründen (auch ohne Netz)', async ({
  page,
  context,
}) => {
  const m = await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await sorteWaehlen(page, 'Tomate', 'Ochsenherz', (ziel) => tipp(m, ziel));
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  // vor der Gefässwahl keine Einstufung
  await expect(page.getByText(/^Ochsenherz: /)).toHaveCount(0);

  // die Passung rechnet aus dem Bündel, ohne Netz
  await context.setOffline(true);
  await tipp(m, zielgefaess(page, '3.3'));
  await expect(page.getByText(/Ochsenherz: Nicht empfohlen · nicht für Kratky/)).toBeVisible();
  await expect(page.getByText(/Lollo Rossa: Empfohlen/)).toBeVisible();

  // Wechsel des Gefässes rechnet neu: in 2.3 (DWC, Salat 1.0–1.4) fehlt die EC-Schnittmenge der Tomate
  await tipp(m, zielgefaess(page, '2.3'));
  await expect(
    page.getByText(/Ochsenherz: Nicht empfohlen · EC: keine Schnittmenge mit 1\.0 bis 1\.4/),
  ).toBeVisible();
  await expect(page.getByText(/nicht für Kratky/)).toHaveCount(0);
  await context.setOffline(false);
});

test('UC5 ohne Zielgefäss zeigt Schritt 1 keine Einstufung', async ({ page }) => {
  await mitDaten(page, regal(), '/#/saeen?box=R-A1');
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  // Plan 205: alle Gemüse als Kacheln, keine Stufe, nichts eingeklappt
  for (const name of ['Basilikum', 'Mangold', 'Rucola', 'Salat', 'Spinat', 'Tomate'])
    await expect(gemueseKachel(page, name)).toBeVisible();
  await expect(page.getByText(STUFE)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /anzeigen$/ })).toHaveCount(0);
  await gemueseKachel(page, 'Salat').click();
  await expect(sortenZeile(page, 'Lollo Rossa')).toBeVisible();
  await expect(sortenZeile(page, 'Eichblatt')).toBeVisible();
  await expect(page.getByText(STUFE)).toHaveCount(0);
  await expect(page.getByText(/nicht für Kratky/)).toHaveCount(0);
});

test('UC5 Status nie nur über Farbe: Badge trägt das Wort', async ({ page }) => {
  const m = await mitDaten(page, regal(), AUS_GEFAESS_33);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  // Plan 205: jede Gemüse-Kachel trägt die beste Stufe ihrer Sorten als Wort
  for (const name of ['Basilikum', 'Mangold', 'Rucola', 'Salat', 'Spinat'])
    await expect(gemueseKachel(page, name)).toContainText(/Empfohlen/);
  await tipp(m, knopf(page, 'Nicht empfohlen (1) anzeigen'));
  await expect(gemueseKachel(page, 'Tomate')).toContainText('Nicht empfohlen');
  // jedes Stufen-Badge ist ein Wort, nicht nur eine Farbe
  const badges = page.getByText(STUFE);
  expect(await badges.count()).toBeGreaterThanOrEqual(6);
  for (const b of await badges.all()) expect((await b.innerText()).trim()).toMatch(STUFE);
  // auch in der Sortenliste je Sorte
  await tipp(m, gemueseKachel(page, 'Salat'));
  for (const name of ['Lollo Rossa', 'Eichblatt'])
    await expect(sortenZeile(page, name)).toContainText(/Empfohlen/);
});
