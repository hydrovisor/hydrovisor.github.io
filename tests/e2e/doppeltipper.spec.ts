// RB1 Doppeltipper in Phasen- und Umsetzen-Karten (Issue #241; RB1-AK1, RB1-AK2; U13). REST nachgebildet
// (tests/e2e/rest.ts) wie phasen-gruppen.spec.ts und umsetzen.spec.ts: POST und PATCH aus schreiben() landen im
// nachgebildeten Bündel. Feste Uhr, Europe/Zurich und 360 × 640 aus der Konfiguration. Ohne Personendaten.
//
// Geprüft wird wie in ernte-heute.spec.ts (UX4-AK4): zweiter Klick 100 ms nach dem ersten an derselben Stelle. Dazu
// prüft der Test, dass unter dem Finger noch die gesperrte Taste liegt (die Ansicht steht während der Sperre still)
// und dass kein zweiter Vorgang entsteht.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { GLEICH_JETZT, GLEICH_TITEL, gleicheSaetzeTeile, phasenNachrechnen } from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { SATZ, UMSETZ_JETZT, umsetzTeile } from '../fixtures/umsetzen.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string][];
}

async function mitDaten(
  page: Page,
  start: Teile,
  nachrechnen: (t: Teile) => Teile,
  jetzt: Date,
  pfad: string,
  ueberschrift: string,
): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: nachrechnen(structuredClone(start)), geschrieben: [], storniert: [] };
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
      nachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
      stornoAufnehmen(m.daten, tabelle, clientId, jetzt);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: ueberschrift, level: 1 })).toBeVisible({ timeout: 15_000 });
  return m;
}

const frames = (page: Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** Taste an (x, y): Text, gesperrt und Überschrift der umgebenden Karte (section), oder null */
const tasteBei = (page: Page, x: number, y: number) =>
  page.evaluate(
    ([px, py]) => {
      const t = document.elementFromPoint(px, py)?.closest('button, a');
      if (!t) return null;
      const karte = t.closest('section')?.querySelector('h1, h2, h3')?.textContent?.trim() ?? null;
      return { text: t.textContent?.trim() ?? '', gesperrt: t.matches(':disabled'), karte };
    },
    [x, y] as const,
  );

/** erster Tipp, nach 100 ms prüfen, was unter dem Finger liegt, dann zweiter Tipp an derselben Stelle */
async function doppeltipp(page: Page, taste: Locator): Promise<Awaited<ReturnType<typeof tasteBei>>> {
  await taste.scrollIntoViewIfNeeded();
  await frames(page);
  const box = await taste.boundingBox();
  if (!box) throw new Error('Taste ohne Bounding Box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  const unterDemFinger = await tasteBei(page, x, y);
  await page.mouse.click(x, y);
  return unterDemFinger;
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const karte = (page: Page, titel: string) =>
  page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]');
const ereignisse = (m: Mitschnitt, typ: string) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === typ);

test('RB1-AK1 Phasenkarte: zweiter Tipp 100 ms nach «Alle Ja» trifft noch die gesperrte Taste der stillstehenden Karte und schreibt nichts weiter', async ({
  page,
}) => {
  const m = await mitDaten(page, gleicheSaetzeTeile(), phasenNachrechnen, GLEICH_JETZT, '/#/heute', 'Heute');
  const k = karte(page, GLEICH_TITEL);
  await expect(k).toHaveCount(1);
  const unter = await doppeltipp(page, k.getByRole('button', { name: 'Alle Ja', exact: true }));
  // dieselbe, gesperrte Taste in derselben Karte (nicht eine nachgerückte «Alle Ja»)
  expect(unter, 'nach 100 ms liegt noch «Alle Ja» unter dem Finger').toEqual({
    text: 'Alle Ja',
    gesperrt: true,
    karte: GLEICH_TITEL,
  });
  await expect(k).toHaveCount(0);
  // Zeit für einen allfälligen zweiten Schreibvorgang
  await page.waitForTimeout(800);
  // ein Vorgang: 5 × Lollo Rossa und 1 × Eichblatt, nichts doppelt
  expect(ereignisse(m, 'phase_antwort')).toHaveLength(6);
  expect(new Set(ereignisse(m, 'phase_antwort').map(([, z]) => z['client_id'])).size).toBe(6);
  expect(m.storniert).toEqual([]);
});

const umsetzNachrechnen = (t: Teile) => umsetzSichtenNachrechnen(sichtenNachrechnen(t));

test('RB1-AK2 Umsetzen: zweiter Tipp 100 ms nach «Umsetzen bestätigen» trifft noch die gesperrte Taste und schreibt nichts weiter; danach das Ergebnis', async ({
  page,
}) => {
  const m = await mitDaten(
    page,
    umsetzTeile(),
    umsetzNachrechnen,
    UMSETZ_JETZT,
    `/#/umsetzen/${SATZ.lollo}`,
    'Umsetzen',
  );
  await knopf(page, 'Wie geplant umsetzen').click();
  const unter = await doppeltipp(page, knopf(page, 'Umsetzen bestätigen'));
  expect(unter, 'nach 100 ms liegt noch «Umsetzen bestätigen» unter dem Finger').toMatchObject({
    text: 'Umsetzen bestätigen',
    gesperrt: true,
  });
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  await page.waitForTimeout(800);
  expect(ereignisse(m, 'umsetzen')).toHaveLength(5);
  expect(m.geschrieben).toHaveLength(5);
  expect(m.storniert).toEqual([]);
});

test('RB1-AK2 Umsetzen: zweiter Tipp 100 ms nach «Rückgängig machen» trifft noch die gesperrte Taste, die Übersicht erscheint erst danach und nichts wird neu umgesetzt', async ({
  page,
}) => {
  const m = await mitDaten(
    page,
    umsetzTeile(),
    umsetzNachrechnen,
    UMSETZ_JETZT,
    `/#/umsetzen/${SATZ.lollo}`,
    'Umsetzen',
  );
  await knopf(page, 'Wie geplant umsetzen').click();
  await knopf(page, 'Umsetzen bestätigen').click();
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  // Sperre nach dem Umsetzen abwarten
  await page.waitForTimeout(500);
  const unter = await doppeltipp(page, knopf(page, 'Rückgängig machen'));
  expect(unter, 'nach 100 ms liegt noch «Rückgängig machen» unter dem Finger').toMatchObject({
    text: 'Rückgängig machen',
    gesperrt: true,
  });
  await expect(knopf(page, 'Wie geplant umsetzen')).toBeVisible();
  await page.waitForTimeout(800);
  expect(m.storniert).toHaveLength(5);
  // kein neues Umsetzen durch den zweiten Tipp
  expect(ereignisse(m, 'umsetzen')).toHaveLength(5);
});

const loch = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Loch ${String(n)},`) });

test('RB1-AK2 Umsetzen Schritt 3 von 3: zweiter Tipp 100 ms nach «Umsetzen» trifft noch die gesperrte Taste, die Zeilen stehen still, nichts doppelt', async ({
  page,
}) => {
  const m = await mitDaten(
    page,
    umsetzTeile(),
    umsetzNachrechnen,
    UMSETZ_JETZT,
    `/#/umsetzen/${SATZ.rucola}`,
    'Umsetzen',
  );
  await knopf(page, 'Ziel wählen').click();
  await page
    .getByRole('button', { name: /^2\.1(?![.\d])/ })
    .first()
    .click();
  for (const n of [1, 3, 4, 5]) await loch(page, n).click();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  const zeilen = await page.getByRole('list', { name: 'Umsetzen' }).getByRole('listitem').count();
  expect(zeilen).toBeGreaterThan(0);
  const unter = await doppeltipp(page, knopf(page, 'Umsetzen'));
  // gleich nach dem zweiten Tipp (noch in der Sperre): dieselben Zeilen stehen da
  const zeilenDanach = await page.getByRole('list', { name: 'Umsetzen' }).getByRole('listitem').count();
  expect(unter, 'nach 100 ms liegt noch «Umsetzen» unter dem Finger').toMatchObject({
    text: 'Umsetzen',
    gesperrt: true,
  });
  expect(zeilenDanach, 'die Zeilen stehen während der Sperre still').toBe(zeilen);
  await expect(page.getByText('Umgesetzt: 4 Sämlinge')).toBeVisible();
  await page.waitForTimeout(800);
  expect(ereignisse(m, 'umsetzen')).toHaveLength(4);
  expect(m.storniert).toEqual([]);
});
