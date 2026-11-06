// Maske «Verschieben» und Deckelgrafik in «Gefäss» (Plan 33 Testliste; UC6-AK3, UC6-AK8, R8.3, R8.4). REST
// nachgebildet wie keimung.spec.ts, Sichten mit umsetzSichtenNachrechnen() aus tests/fixtures/sichten.ts. Teile
// verschiebTeile() aus tests/fixtures/umsetzen.ts: 2.3 Loch 1 Topf 2.3.1 mit Eichblatt, Loch 4 Topf 2.3.4 mit Lollo
// Rossa (beide umgesetzt 9.1.), 2.3.6 reserviert; 2.1 Loch 5 leerer Topf 2.1.5, Loch 2 abwesend. Feste Uhr 19.1.
// (Tag 10) bzw. 20.1. (Tag 11); 360 × 640 aus der Konfiguration.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 33 offen ist):
// - «Gefäss» 2.3: Deckel mit «Loch n, …» (Name mit Kennung des Topfs, Sorte, «ausser Heimplatz» für einen Topf
//   ausserhalb seines Heimplatzes); Tipp auf einen Topf zeigt die Aktionszeile «Topf 2.3.1 · Eichblatt» mit dem Knopf
//   «Verschieben» (Link oder Button) → #/verschieben/R-2.3.1. Verlauf mit dem Marker «Tausch 2.3.1 ↔ 2.3.4».
// - «Verschieben»: main data-density="regal", h1 «Verschieben», Kopf «Topf 2.3.1 · Eichblatt · umgesetzt am 9.1.»;
//   Zielgefässe als Buttons, deren Name mit der Kennung beginnt, das eigene vorgewählt (aria-pressed="true"); Deckel
//   des Zielgefässes mit «Loch n, …»; der Tipp auf ein wählbares Loch speichert sofort. Ergebnis «Getauscht: 2.3.1 ↔
//   2.3.4» oder «Verschoben: 2.3.1 auf 2.1.5 · leeren Topf 2.1.5 in 2.3 Loch 1 stecken», «Rückgängig machen».
//   Beim Wechsel des Gefässes die Wissenskarte «Topf umsetzen» (Text aus wissenseintrag); ab Tag 11 nach dem Umsetzen
//   beim Tipp auf ein anderes Gefäss die Notice «Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen».
import { expect, test, type Locator, type Page } from '@playwright/test';
import { netztopfId, platzId, type Teile } from '../fixtures/regal.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import {
  EICHBLATT_23,
  LOLLO_ALT,
  UMSETZ_JETZT,
  verschiebTeile,
  WISSEN_TOPF_UMSETZEN,
} from '../fixtures/umsetzen.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const TAG11 = new Date('2027-01-20T08:00:00Z');
const HINWEIS = 'Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen';

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
  pfad: string,
  ueberschrift: string | RegExp,
  jetzt = UMSETZ_JETZT,
): Promise<Mitschnitt> {
  const m: Mitschnitt = {
    daten: nachrechnen(verschiebTeile(jetzt)),
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

test('UC6-AK3 Tausch zweier Töpfe in 2.3 in höchstens 4 Berührungen; Deckelgrafik und Verlauf zeigen den Tausch', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/gefaess/R-2.3', /2\.3/);
  await expect(loch(page, 1)).toHaveAccessibleName(/2\.3\.1/);
  await tipp(m, loch(page, 1));
  await expect(page.getByText('Topf 2.3.1 · Eichblatt')).toBeVisible();
  await tipp(m, knopf(page, 'Verschieben'));
  await expect(page).toHaveURL(/#\/verschieben\/R-2\.3\.1$/);
  await expect(page.getByRole('heading', { name: 'Verschieben', level: 1 })).toBeVisible();
  await expect(page.getByText('Topf 2.3.1 · Eichblatt · umgesetzt am 9.1.')).toBeVisible();
  await expect(gefaessWahl(page, '2.3')).toHaveAttribute('aria-pressed', 'true');
  await tipp(m, loch(page, 4));
  await expect(page.getByText('Getauscht: 2.3.1 ↔ 2.3.4')).toBeVisible();
  expect(m.beruehrungen).toBeLessThanOrEqual(4);

  await expect.poll(() => ereignisse(m, 'tausch').length).toBe(2);
  const tausch = ereignisse(m, 'tausch');
  const a = tausch.find((z) => z['netztopf_id'] === netztopfId('2.3.1'));
  const b = tausch.find((z) => z['netztopf_id'] === netztopfId('2.3.4'));
  expect(a?.['pflanzung_id']).toBe(EICHBLATT_23);
  expect(b?.['pflanzung_id']).toBe(LOLLO_ALT);
  expect(daten(a)['vorgang_id']).toBeTruthy();
  expect(daten(a)['vorgang_id']).toBe(daten(b)['vorgang_id']);
  expect(daten(a)).toMatchObject({ von_loch_nr: 1, nach_loch_nr: 4, nach_platz_id: platzId('2.3') });
  expect(daten(b)).toMatchObject({ von_loch_nr: 4, nach_loch_nr: 1, nach_platz_id: platzId('2.3') });
  // kein Wechsel des Gefässes: keine Wissenskarte
  await expect(page.getByText(WISSEN_TOPF_UMSETZEN)).toHaveCount(0);

  // Deckelgrafik und Verlauf in «Gefäss» 2.3
  await page.goto('/#/gefaess/R-2.3');
  await page.reload();
  await expect(loch(page, 1)).toHaveAccessibleName(/2\.3\.4/);
  await expect(loch(page, 1)).toHaveAccessibleName(/ausser Heimplatz/);
  await expect(loch(page, 4)).toHaveAccessibleName(/2\.3\.1/);
  await expect(loch(page, 4)).toHaveAccessibleName(/ausser Heimplatz/);
  await expect(loch(page, 2)).not.toHaveAccessibleName(/ausser Heimplatz/);
  await expect(page.getByText('Tausch 2.3.1 ↔ 2.3.4').first()).toBeVisible();
});

test('UC6-AK3 Verschieben auf ein freies Loch: leerer Topf rückt nach, Hinweis zum Stecken', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/verschieben/R-2.3.1', 'Verschieben');
  await tipp(m, gefaessWahl(page, '2.1'));
  // anderes Gefäss am Tag 10: erlaubt, mit Wissenskarte
  await expect(page.getByText(WISSEN_TOPF_UMSETZEN)).toBeVisible();
  await expect(page.getByText(HINWEIS)).toHaveCount(0);
  await expect(loch(page, 2)).toHaveAttribute('aria-disabled', 'true');
  await tipp(m, loch(page, 5));
  await expect(
    page.getByText('Verschoben: 2.3.1 auf 2.1.5 · leeren Topf 2.1.5 in 2.3 Loch 1 stecken'),
  ).toBeVisible();
  await expect.poll(() => ereignisse(m, 'verschieben').length).toBe(2);
  const v = ereignisse(m, 'verschieben');
  const mit = v.find((z) => z['netztopf_id'] === netztopfId('2.3.1'));
  const leer = v.find((z) => z['netztopf_id'] === netztopfId('2.1.5'));
  expect(mit?.['pflanzung_id']).toBe(EICHBLATT_23);
  expect(daten(mit)).toMatchObject({ nach_platz_id: platzId('2.1'), nach_loch_nr: 5 });
  expect(leer?.['pflanzung_id'] ?? null).toBeNull();
  expect(daten(leer)).toMatchObject({ nach_platz_id: platzId('2.3'), nach_loch_nr: 1 });
  // Rückgängig storniert beide
  const geschrieben = m.geschrieben.map(([t, z]) => `${t}:${String(z['client_id'])}`);
  await tipp(m, knopf(page, 'Rückgängig machen'));
  await expect.poll(() => m.storniert.length).toBe(2);
  expect(m.storniert.map(([t, id]) => `${t}:${id}`)).toEqual([...geschrieben].reverse());
});

test('UC6-AK8 Verschieben eines Topfs, dessen Umsetzdatum mehr als 10 Tage zurückliegt, in ein anderes Gefäss zeigt «Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen»', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/verschieben/R-2.3.1', 'Verschieben', TAG11);
  await expect(page.getByRole('main')).toHaveAttribute('data-density', 'regal');
  await tipp(m, gefaessWahl(page, '2.1'));
  await expect(page.getByText(HINWEIS)).toBeVisible();
  // ein Tipp auf ein Loch des gesperrten Gefässes schreibt nichts
  const l5 = loch(page, 5);
  if ((await l5.count()) > 0) await l5.first().click();
  expect(m.geschrieben).toEqual([]);
});

test('UC6-AK8 nach dem Hinweis bleibt der Tausch im eigenen Gefäss möglich; nichts geschrieben beim gesperrten Ziel', async ({
  page,
}) => {
  const m = await mitDaten(page, '/#/verschieben/R-2.3.1', 'Verschieben', TAG11);
  await tipp(m, gefaessWahl(page, '2.1'));
  await expect(page.getByText(HINWEIS)).toBeVisible();
  expect(m.geschrieben).toEqual([]);
  await tipp(m, gefaessWahl(page, '2.3'));
  await expect(gefaessWahl(page, '2.3')).toHaveAttribute('aria-pressed', 'true');
  await tipp(m, loch(page, 4));
  await expect(page.getByText('Getauscht: 2.3.1 ↔ 2.3.4')).toBeVisible();
  await expect.poll(() => ereignisse(m, 'tausch').length).toBe(2);
  expect(m.geschrieben.every(([t, z]) => t === 'ereignis' && z['typ'] === 'tausch')).toBe(true);
});
