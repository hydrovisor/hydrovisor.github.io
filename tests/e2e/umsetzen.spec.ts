// Maske «Umsetzen» (Plan 33 Testliste; UC5-AK3, UC5-AK7, R6.2, TO2, TO8). REST nachgebildet (Plan 18 A7) wie
// keimung.spec.ts: POST und PATCH aus schreiben() landen im nachgebildeten Bündel, die Sichten rechnet
// umsetzSichtenNachrechnen() aus tests/fixtures/sichten.ts nach (v_reservierung_aktiv, v_pflanzung_zustand,
// v_netztopf_platz, v_zielbereich, ereignis_pflanzung). Teile aus tests/fixtures/umsetzen.ts: Lollo Rossa gesät 7.1.,
// 6 Sämlinge auf 4.4 Loch 1 bis 6, Zieltöpfe 2.3.1 bis 2.3.5 (geplant 28.1.); Rucola ohne Zieltopf auf 4.4 Loch 7 bis
// 11; Ochsenherz mit 8-cm-Zieltopf 2.1.2 auf 4.2 Loch 1. Feste Uhr 19.1. (Maske direkt) oder 28.1. (Einstieg aus Heute,
// fällig); 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 33 offen ist):
// - main mit data-density="regal", h1 «Umsetzen», Kopf «Lollo Rossa · Kopf · gesät 7.1. · Tag 12».
// - Abschnitte «Wie geplant» (Zeilen «4.4.1 → 2.3.1»), «Zieltopf belegt» (Text «2.3.1 belegt: Eichblatt», Knöpfe
//   «Jetzt abernten», «Anderes Loch», «In der Station lassen»), «Ohne Ziel» (Knöpfe «Ziel wählen», «Überzählige
//   beenden»). Fester Fuss mit dem Hauptknopf «Wie geplant umsetzen»; danach die Bestätigung mit Zeilen, Hinweisen
//   (wörtlich nach Konzept 7.4, z. B. «8-cm-Topf samt Blähton ins Zielgefäss») und dem Knopf «Umsetzen bestätigen».
//   Mit ?wie=geplant öffnet die Maske direkt die Bestätigung.
// - «Ziel wählen»: «Schritt 1 von 3» mit Zielgefässen als Buttons, deren Name mit der Kennung beginnt (nur 80-mm-
//   Lochbild ohne feste Dosis); der Tipp auf ein Gefäss führt zu «Schritt 2 von 3» mit dem Deckel («Loch n, …»; nicht
//   wählbare Löcher aria-disabled="true"), «Alle freien wählen», Text «x von n gewählt», «Weiter»; «Schritt 3 von 3»
//   mit dem Knopf «Umsetzen».
// - Ergebnis «Umgesetzt: n Sämlinge» bzw. «Umgesetzt: 1 Sämling», Rest «In 4.4 verbleibt 1 Sämling ohne Ziel» mit
//   «Überzählige beenden», «Rückgängig machen».
// - Fehler beim Speichern: role="alert" mit «nicht gespeichert», Eingaben und Hauptknopf bleiben.
// - Heute: Listeneintrag mit «Umsetzen» und dem Sortennamen, Knopf «Wie geplant umsetzen» (Link oder Button) →
//   #/umsetzen/<satz>?wie=geplant.
// - Maske «Gefäss»: Zeile «Zielbereich aus Pflanzen: pH a–b · EC c–d · n Pflanzen»; Deckel mit «Loch n, …», im Namen
//   die Kennung des Topfs, «ausser Heimplatz» für einen Topf ausserhalb seines Heimplatzes; auf der Station 4.2
//   Loch 1 «2.1.2» und «→ 2.1».
// - Kein Eingabefeld, das die Systemtastatur öffnet.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { netztopfId, platzId, type Teile } from '../fixtures/regal.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { L, R, SATZ, TOMATE, UMSETZ_FAELLIG, UMSETZ_JETZT, umsetzTeile } from '../fixtures/umsetzen.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';

interface Mitschnitt {
  daten: Teile;
  jetzt: Date;
  geschrieben: [string, Record<string, unknown>][];
  storniert: [string, string][];
  beruehrungen: number;
}

const nachrechnen = (t: Teile) => umsetzSichtenNachrechnen(sichtenNachrechnen(t));

async function mitDaten(
  page: Page,
  start: Teile,
  pfad: string,
  ueberschrift: string | RegExp = 'Umsetzen',
  jetzt = UMSETZ_JETZT,
): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: nachrechnen(structuredClone(start)),
    jetzt,
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
        zeileAufnehmen(m.daten, tabelle, z, m.jetzt);
      }
      nachrechnen(m.daten);
    },
    (tabelle, clientId) => {
      m.storniert.push([tabelle, clientId]);
      stornoAufnehmen(m.daten, tabelle, clientId, m.jetzt);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.getByRole('heading', { name: ueberschrift, level: 1 })).toBeVisible();
  return m;
}

async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const gefaessWahl = (page: Page, kennung: string) =>
  page.getByRole('button', { name: new RegExp(`^${kennung.replace('.', '\\.')}(?![.\\d])`) }).first();
const loch = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Loch ${n},`) });
const ereignisse = (m: Mitschnitt, typ: string) =>
  m.geschrieben.filter(([t, z]) => t === 'ereignis' && z['typ'] === typ).map(([, z]) => z);
const daten = (z: Record<string, unknown> | undefined) => (z?.['daten'] ?? {}) as Record<string, unknown>;
const aufgabe = (page: Page, sorte: string) =>
  page.getByRole('listitem').filter({ hasText: 'Umsetzen' }).filter({ hasText: sorte });

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

/** Maske «Gefäss» neu laden (Bündel mit dem nachgerechneten Stand) */
async function gefaess(page: Page, code: string): Promise<void> {
  await page.goto(`/#/gefaess/${code}`);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
}

test('UC5-AK3 «Wie geplant umsetzen» setzt 5 Sämlinge mit 1 Berührung plus Bestätigung an ihre Zieltöpfe; Saatdatum, Phase und Verlauf unverändert, beide Zielbereiche neu', async ({
  page,
}) => {
  const m = await mitDaten(page, umsetzTeile({ jetzt: UMSETZ_FAELLIG }), '/#/heute', 'Heute', UMSETZ_FAELLIG);
  const eintrag = aufgabe(page, 'Lollo Rossa');
  await expect(eintrag).toHaveCount(1);
  await tipp(m, knopf(eintrag, 'Wie geplant umsetzen'));
  await expect(page).toHaveURL(new RegExp(`#/umsetzen/${SATZ.lollo}\\?wie=geplant$`));
  await expect(page.getByRole('heading', { name: 'Umsetzen', level: 1 })).toBeVisible();
  await expect(page.getByText('4.4.1 → 2.3.1').first()).toBeVisible();
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  expect(m.beruehrungen).toBe(2);

  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  for (let k = 1; k <= 5; k += 1) {
    const z = ereignisse(m, 'umsetzen').find((x) => x['pflanzung_id'] === L[k]);
    expect(z?.['netztopf_id'], `Sämling ${k}`).toBe(netztopfId(`2.3.${k}`));
    expect(daten(z)).toEqual({
      von_platz_id: platzId('4.4'),
      von_loch_nr: k,
      nach_platz_id: platzId('2.3'),
      nach_loch_nr: k,
    });
  }
  // nur umsetzen: kein Satz, kein aussaat, keine phase_antwort, kein Storno
  expect(m.geschrieben.map(([t, z]) => `${t}:${String(z['typ'])}`)).toEqual(
    Array(5).fill('ereignis:umsetzen'),
  );
  expect(m.storniert).toEqual([]);
  const zustand = (p: string) => (m.daten['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === p);
  expect(zustand(L[1] as string)).toMatchObject({ phase: 'anzucht', platz_id: platzId('2.3') });
  expect((m.daten['satz'] ?? []).find((s) => s['id'] === SATZ.lollo)?.['saatdatum']).toBe('2027-01-07');

  // beide Zielbereiche neu: 2.3 zählt 5 Pflanzen, 4.4 noch die Reserve und Rucola (6)
  await gefaess(page, 'R-2.3');
  await expect(
    page.getByText('Zielbereich aus Pflanzen: pH 5.8–6.2 · EC 0.8–1.2 · 5 Pflanzen'),
  ).toBeVisible();
  await gefaess(page, 'R-4.4');
  await expect(page.getByText(/Zielbereich aus Pflanzen: .* · 6 Pflanzen/)).toBeVisible();
});

test('UC5-AK3 Rückgängig nach dem Umsetzen storniert alle Ereignisse; Reservierungen wieder aktiv', async ({
  page,
}) => {
  const m = await mitDaten(page, umsetzTeile(), `/#/umsetzen/${SATZ.lollo}`);
  await expect(page.getByText('Lollo Rossa · Kopf · gesät 7.1. · Tag 12')).toBeVisible();
  await tipp(m, knopf(page, 'Wie geplant umsetzen'));
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  const geschrieben = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`);
  await tipp(m, knopf(page, 'Rückgängig machen'));
  await expect.poll(() => m.storniert.length).toBe(geschrieben.length);
  expect(m.storniert.map(([t, id]) => `${t}:${id}`)).toEqual([...geschrieben].reverse());
  const lollo = (m.daten['v_reservierung_aktiv'] ?? []).filter((r) => L.includes(String(r['pflanzung_id'])));
  expect(lollo).toHaveLength(5);
});

test('UC5-AK3 8-cm-Zieltopf: vorher «2.1.2 → 2.1» auf 4.2, nachher in 2.1 Loch 2 ohne «ausser Heimplatz»', async ({
  page,
}) => {
  const m = await mitDaten(
    page,
    umsetzTeile({ jetzt: UMSETZ_FAELLIG }),
    '/#/gefaess/R-4.2',
    /4\.2/,
    UMSETZ_FAELLIG,
  );
  const station = loch(page, 1);
  await expect(station).toHaveAccessibleName(/2\.1\.2/);
  await expect(station).toHaveAccessibleName(/→ 2\.1/);
  await gefaess(page, 'R-2.1');
  await expect(loch(page, 2)).toHaveAccessibleName(/2\.1\.2/);

  await page.goto('/#/heute');
  await page.reload();
  const eintrag = aufgabe(page, 'Ochsenherz');
  await expect(eintrag).toHaveCount(1);
  await tipp(m, knopf(eintrag, 'Wie geplant umsetzen'));
  await expect(page.getByText('8-cm-Topf samt Blähton ins Zielgefäss')).toBeVisible();
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 1 Sämling')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(1);
  const [u] = ereignisse(m, 'umsetzen');
  expect(u).toMatchObject({ pflanzung_id: TOMATE, netztopf_id: netztopfId('2.1.2') });
  expect(daten(u)).toEqual({
    von_platz_id: platzId('4.2'),
    von_loch_nr: 1,
    nach_platz_id: platzId('2.1'),
    nach_loch_nr: 2,
  });

  await gefaess(page, 'R-2.1');
  await expect(loch(page, 2)).toHaveAccessibleName(/2\.1\.2/);
  await expect(loch(page, 2)).not.toHaveAccessibleName(/ausser Heimplatz/);
  await gefaess(page, 'R-4.2');
  await expect(loch(page, 1)).not.toHaveAccessibleName(/2\.1\.2/);
});

test('UC5-AK3 Zieltopf belegt zeigt Jetzt abernten, Anderes Loch und In der Station lassen', async ({
  page,
}) => {
  // 2.3.1 steht mit Eichblatt, 2.3.4 mit Lollo Rossa (umgesetzt 9.1.)
  await mitDaten(page, umsetzTeile({ bestand23: true }), `/#/umsetzen/${SATZ.lollo}`);
  await expect(page.getByText('2.3.1 belegt: Eichblatt')).toBeVisible();
  await expect(page.getByText('2.3.4 belegt: Lollo Rossa')).toBeVisible();
  for (const name of ['Jetzt abernten', 'Anderes Loch', 'In der Station lassen'])
    await expect(knopf(page, name).first(), name).toBeVisible();
  await expect(knopf(page, 'Jetzt abernten')).toHaveCount(2);
  // Wie geplant setzt nur die drei freien Zieltöpfe
  await expect(page.getByText('4.4.2 → 2.3.2').first()).toBeVisible();
  await expect(page.getByText('4.4.1 → 2.3.1')).toHaveCount(0);
});

test('UC5-AK7 Ein Satz ohne Zieltopf mit 5 Sämlingen wird beim Umsetzen in höchstens 3 Schritten zugewiesen', async ({
  page,
}) => {
  const m = await mitDaten(page, umsetzTeile(), `/#/umsetzen/${SATZ.rucola}`);
  await tipp(m, knopf(page, 'Ziel wählen'));
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await tipp(m, gefaessWahl(page, '2.1'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByText('0 von 5 gewählt')).toBeVisible();
  await tipp(m, knopf(page, 'Alle freien wählen'));
  await expect(page.getByText('5 von 5 gewählt')).toBeVisible();
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Umsetzen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  expect(m.beruehrungen).toBeLessThanOrEqual(5);
  await expect(page.getByText(/Schritt 4 von/)).toHaveCount(0);

  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  expect(
    ereignisse(m, 'umsetzen').map((z) => [z['pflanzung_id'], z['netztopf_id'], daten(z)['nach_loch_nr']]),
  ).toEqual(R.slice(1, 6).map((p, i) => [p, netztopfId(`2.1.${[1, 3, 4, 5, 6][i]}`), [1, 3, 4, 5, 6][i]]));
  expect(m.geschrieben.filter(([t]) => t === 'reservierung')).toEqual([]);
});

test('UC5-AK7 nur freie 8-cm-Töpfe sind wählbar, reservierte, belegte und 5-cm-Löcher nicht', async ({
  page,
}) => {
  // 2.3: Loch 1 und 4 belegt, Loch 2 und 3 reserviert; 2.1: Loch 2 abwesend (auf 4.2), Loch 6 belegt
  const t = umsetzTeile({ bestand23: true, zieltoepfe: ['2.3.2', '2.3.3', '1.1.1', '1.1.2', '1.1.3'] });
  const m = await mitDaten(page, t, `/#/umsetzen/${SATZ.rucola}`);
  await tipp(m, knopf(page, 'Ziel wählen'));
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  // 5-cm-Lochbilder und Stationen stehen nicht zur Wahl
  for (const kennung of ['3.1', '3.2', '3.3', '4.1', '4.2', '4.4'])
    await expect(gefaessWahl(page, kennung), kennung).toHaveCount(0);
  await tipp(m, gefaessWahl(page, '2.3'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  for (const n of [1, 2, 3, 4])
    await expect(loch(page, n), `Loch ${n}`).toHaveAttribute('aria-disabled', 'true');
  for (const n of [5, 6])
    await expect(loch(page, n), `Loch ${n}`).not.toHaveAttribute('aria-disabled', 'true');
  await expect(loch(page, 2)).toHaveAccessibleName(/reserviert/);
  await expect(loch(page, 1)).toHaveAccessibleName(/belegt/);
  // ein Tipp auf ein nicht wählbares Loch wählt nichts
  await loch(page, 1).click({ force: true });
  await expect(page.getByText('0 von 5 gewählt')).toBeVisible();
  await knopf(page, 'Zurück').click();
  await tipp(m, gefaessWahl(page, '2.1'));
  await expect(loch(page, 2)).toHaveAttribute('aria-disabled', 'true');
  await expect(loch(page, 2)).toHaveAccessibleName(/auf 4\.2\.1/);
  await expect(loch(page, 6)).toHaveAttribute('aria-disabled', 'true');
  await expect(loch(page, 1)).not.toHaveAttribute('aria-disabled', 'true');
  expect(m.geschrieben).toEqual([]);
});

test('UC5-AK7 Rest «In 4.4 verbleibt 1 Sämling ohne Ziel» und Überzählige beenden', async ({ page }) => {
  const m = await mitDaten(page, umsetzTeile(), `/#/umsetzen/${SATZ.rucola}`);
  await tipp(m, knopf(page, 'Ziel wählen'));
  await tipp(m, gefaessWahl(page, '2.1'));
  for (const n of [1, 3, 4, 5]) await tipp(m, loch(page, n));
  await expect(page.getByText('4 von 5 gewählt')).toBeVisible();
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Umsetzen'));
  await expect(page.getByText('Umgesetzt: 4 Sämlinge')).toBeVisible();
  await expect(page.getByText('In 4.4 verbleibt 1 Sämling ohne Ziel')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(4);
  await tipp(m, knopf(page, 'Überzählige beenden'));
  await expect.poll(() => ereignisse(m, 'abschluss').length).toBe(1);
  const [ab] = ereignisse(m, 'abschluss');
  expect(ab?.['pflanzung_id']).toBe(R[5]);
  expect(daten(ab)).toEqual({ grund: 'ueberzaehlig' });
});

test('UC5-AK3 Masken Umsetzen und Verschieben: data-density regal, keine Systemtastatur, Hauptknopf in 360 × 640 sichtbar', async ({
  page,
}) => {
  // Bestand in 2.3: Topf 2.3.1 mit Eichblatt für die Maske «Verschieben»
  await mitDaten(page, umsetzTeile({ bestand23: true }), `/#/umsetzen/${SATZ.lollo}`);
  await ohneTastatur(page);
  const haupt = await knopf(page, 'Wie geplant umsetzen').boundingBox();
  expect(haupt).not.toBeNull();
  expect((haupt?.y ?? 0) + (haupt?.height ?? 0)).toBeLessThanOrEqual(640);
  expect(haupt?.height ?? 0).toBeGreaterThanOrEqual(68);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await knopf(page, 'Wie geplant umsetzen').click();
  const bestaetigen = await knopf(page, 'Umsetzen bestätigen').boundingBox();
  expect((bestaetigen?.y ?? 999) + (bestaetigen?.height ?? 0)).toBeLessThanOrEqual(640);
  await ohneTastatur(page);

  await page.goto('/#/verschieben/R-2.3.1');
  await expect(page.getByRole('heading', { name: 'Verschieben', level: 1 })).toBeVisible();
  await ohneTastatur(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('UC5-AK3 TO2 Umsetzen nach Zeitüberschreitung erneut senden schreibt dieselben client_id', async ({
  page,
}) => {
  const m = await mitDaten(page, umsetzTeile(), `/#/umsetzen/${SATZ.lollo}?wie=geplant`);
  let fehler = true;
  const versucht: string[] = [];
  await page.route(`${REST}/**`, async (route) => {
    const anfrage = route.request();
    if (anfrage.method() === 'POST') {
      const roh = (anfrage.postDataJSON() ?? {}) as Record<string, unknown> | Record<string, unknown>[];
      for (const z of Array.isArray(roh) ? roh : [roh]) versucht.push(String(z['client_id']));
      if (fehler) {
        fehler = false;
        return route.fulfill({ status: 504, json: { message: 'Zeitüberschreitung' } });
      }
    }
    return route.fallback();
  });
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  const erster = new Set(versucht);
  expect(erster.size).toBeGreaterThan(0);
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  const gesendet = m.geschrieben.map(([, z]) => String(z['client_id']));
  expect(new Set(gesendet).size).toBe(gesendet.length);
  for (const id of erster) expect(gesendet, id).toContain(id);
});

test('UC5-AK3 Kein Netz: «nicht gespeichert», Eingaben bleiben', async ({ page, context }) => {
  const m = await mitDaten(page, umsetzTeile(), `/#/umsetzen/${SATZ.rucola}`);
  let ohneNetz = false;
  await page.route(`${REST}/**`, async (route) => {
    if (ohneNetz && route.request().method() !== 'GET') return route.abort('internetdisconnected');
    return route.fallback();
  });
  await tipp(m, knopf(page, 'Ziel wählen'));
  await tipp(m, gefaessWahl(page, '2.1'));
  await tipp(m, knopf(page, 'Alle freien wählen'));
  await tipp(m, knopf(page, 'Weiter'));
  ohneNetz = true;
  await context.setOffline(true);
  await tipp(m, knopf(page, 'Umsetzen'));
  await expect(page.getByRole('alert').filter({ hasText: /nicht gespeichert/ })).toBeVisible();
  await expect(page.getByText(/Umgesetzt: /)).toHaveCount(0);
  await expect(knopf(page, 'Umsetzen')).toBeVisible();
  expect(m.geschrieben).toEqual([]);
  // Eingaben bleiben: zurück zu Schritt 2, die Wahl steht noch
  await knopf(page, 'Zurück').click();
  await expect(page.getByText('5 von 5 gewählt')).toBeVisible();
  await context.setOffline(false);
  ohneNetz = false;
});

test('UC5-AK3 Heute zeigt «Umsetzen · Lollo Rossa» mit «Wie geplant umsetzen»; nach dem Umsetzen nicht mehr', async ({
  page,
}) => {
  // ohne Reserve: nach dem Umsetzen hat der Satz keinen Sämling mehr
  const m = await mitDaten(
    page,
    umsetzTeile({ jetzt: UMSETZ_FAELLIG, reserve: false }),
    '/#/heute',
    'Heute',
    UMSETZ_FAELLIG,
  );
  const eintrag = aufgabe(page, 'Lollo Rossa');
  await expect(eintrag).toHaveCount(1);
  await expect(eintrag).toContainText(/Umsetzen · Lollo Rossa · 4\.4 → 2\.3/);
  await expect(knopf(eintrag, 'Wie geplant umsetzen')).toBeVisible();
  // Heute auf 360 dp ohne waagrechtes Scrollen
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await tipp(m, knopf(eintrag, 'Wie geplant umsetzen'));
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(aufgabe(page, 'Ochsenherz')).toHaveCount(1);
  await expect(aufgabe(page, 'Lollo Rossa')).toHaveCount(0);
});
