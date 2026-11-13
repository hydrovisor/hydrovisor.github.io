// Ablauf «Anzucht mit Zieltopf» über drei Masken (Plan 33 Testliste; Anzucht-AK1, A24). REST nachgebildet wie
// keimung.spec.ts; die Sichten rechnet umsetzSichtenNachrechnen() aus tests/fixtures/sichten.ts nach jedem Schreiben
// nach. Regal R aus tests/fixtures/saeen.ts ohne den Satz in 2.3 (alle sechs Töpfe frei).
//
// Ablauf mit fester Uhr je Schritt (Zählung ab den Masken wie Plan 23 und 24, Umsetzen ab der Heute-Karte):
// 1. 7.1. Säen ab #/saeen?box=R-A1 wie UC5-AK1: Lollo Rossa Reihe 1 (Loch 1, 3, 5) und Eichblatt Loch 2, 4, 6 einzeln
//    in 2.3 (D2 «3, 3», #136). Die Saatmenge ergibt je Satz Zieltöpfe + 1 = 4 Schwämme
//    (Lollo Rossa 1 Samen bei p 0.9, Eichblatt 2 Samen bei p 0.7).
// 2. 11.1. Keimung prüfen ab #/keimung/<satz>: Lollo Rossa mit Schwamm 1 (Zieltopf 2.3.1) ohne Keimling, Eichblatt alle
//    gekeimt; die Station 4.4 ist vorbelegt.
// 3. 28.1. (Saat + «Umsetzen ab» 21 = geplantes Umsetzdatum) je Satz die Heute-Karte «Wie geplant umsetzen» und
//    «Umsetzen bestätigen»: 2 + 3 = 5 Sämlinge in ihre Zieltöpfe.
// Abweichung vom Plan (Testliste nennt den 19.1.): die Heute-Karte erscheint erst am geplanten Umsetzdatum 28.1.
//
// Erwartete Oberfläche: wie saeen.spec.ts, keimung.spec.ts und umsetzen.spec.ts.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { netztopfId, type Teile } from '../fixtures/regal.ts';
import { saatTeile, SORTE } from '../fixtures/saeen.ts';
import {
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

const SAEEN = new Date('2027-01-07T08:00:00Z');
const KEIMEN = new Date('2027-01-11T08:00:00Z');
const UMSETZEN = new Date('2027-01-28T08:00:00Z');

interface Mitschnitt {
  daten: Teile;
  jetzt: Date;
  geschrieben: [string, Record<string, unknown>][];
  beruehrungen: number;
}

const nachrechnen = (t: Teile) => umsetzSichtenNachrechnen(sichtenNachrechnen(t));

async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string) =>
  ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }));
const sortenleiste = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^(?!Loch ).*${name}`) }).first();
const zielgefaess = (page: Page, kennung: string) =>
  page.getByRole('button', { name: new RegExp(`^${kennung.replace('.', '\\.')}(?![.\\d])`) }).first();
const reihe = (page: Page, n: number) => page.getByRole('button', { name: `Reihe ${n} wählen` });
const loch = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^Loch ${n},`) });
const weniger = (page: Page, nr: number) =>
  page.getByRole('button', { name: new RegExp(`^Schwamm ${nr}(?!\\d).* weniger$`) });
const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);
const ereignisse = (m: Mitschnitt, typ: string) => zeilenVon(m, 'ereignis').filter((z) => z['typ'] === typ);

/** Uhr setzen und eine Maske neu laden (das Bündel zeigt den nachgerechneten Stand) */
async function oeffnen(
  page: Page,
  m: Mitschnitt,
  jetzt: Date,
  pfad: string,
  ueberschrift: string,
): Promise<void> {
  m.jetzt = jetzt;
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await page.reload();
  await expect(page.getByRole('heading', { name: ueberschrift, level: 1 })).toBeVisible();
}

test('Anzucht-AK1 6 Zieltöpfe, 2 Sorten, 1 Schwamm ohne Keimling, 5 umgesetzt: zusammen höchstens 26 Berührungen über alle drei Schritte', async ({
  page,
}) => {
  const start = saatTeile(SAEEN, { ohneSatzIn23: true });
  start['reservierung'] = [];
  start['ereignis_pflanzung'] = [];
  const m: Mitschnitt = { daten: nachrechnen(start), jetzt: SAEEN, geschrieben: [], beruehrungen: 0 };
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
      stornoAufnehmen(m.daten, tabelle, clientId, m.jetzt);
      nachrechnen(m.daten);
    },
  );

  // 1. Säen am 7.1.
  await oeffnen(page, m, SAEEN, '/#/saeen?box=R-A1', 'Säen');
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  // Plan 205 A6: «Wählen und weiter» bei der letzten Sorte spart den Tipp auf «Weiter»
  await sorteWaehlen(page, 'Salat', 'Eichblatt', (ziel) => tipp(m, ziel), { weiter: true });
  await tipp(m, zielgefaess(page, '2.3'));
  await tipp(m, sortenleiste(page, 'Lollo Rossa'));
  await tipp(m, reihe(page, 1));
  await tipp(m, sortenleiste(page, 'Eichblatt'));
  await tipp(m, loch(page, 2));
  await tipp(m, loch(page, 4));
  await tipp(m, loch(page, 6));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 2 Sätze, \d+ Schwämme/)).toBeVisible();
  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(6);
  const saeen = m.beruehrungen;
  const satzVon = (sorte: string) =>
    String(zeilenVon(m, 'satz').find((s) => s['sorte_id'] === sorte)?.['id']);
  const lollo = satzVon(SORTE.lollo);
  const eichblatt = satzVon(SORTE.eichblatt);
  for (const satz of [lollo, eichblatt])
    expect(
      zeilenVon(m, 'pflanzung').filter((p) => p['satz_id'] === satz),
      satz,
    ).toHaveLength(4);

  // 2. Keimung prüfen am 11.1.: Lollo Rossa Schwamm 1 ohne Keimling, Eichblatt alle gekeimt
  await oeffnen(page, m, KEIMEN, `/#/keimung/${lollo}`, 'Keimung prüfen');
  await expect(page.getByText(/Ziel 2\.3\.1/).first()).toBeVisible();
  const schwamm1 = page.getByRole('group', { name: /^Schwamm 1(?!\d)/ });
  // Lollo Rossa hat 1 Samen je Schwamm: ein «weniger» genügt; höchstens so oft wie Samen möglich
  for (let i = 0; i < 4 && !/(^|\D)0(\D|$)/.test((await schwamm1.textContent()) ?? ''); i += 1)
    await tipp(m, weniger(page, 1));
  await expect(schwamm1).toContainText('0');
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'abschluss').length).toBe(1);

  await oeffnen(page, m, KEIMEN, `/#/keimung/${eichblatt}`, 'Keimung prüfen');
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  await expect.poll(() => ereignisse(m, 'verschieben').length).toBe(7);
  const keimen = m.beruehrungen - saeen;

  // 3. Umsetzen am 28.1. über die Heute-Karten
  for (const sorte of ['Lollo Rossa', 'Eichblatt']) {
    await oeffnen(page, m, UMSETZEN, '/#/heute', 'Heute');
    const eintrag = page.getByRole('listitem').filter({ hasText: 'Umsetzen' }).filter({ hasText: sorte });
    await expect(eintrag, sorte).toHaveCount(1);
    await tipp(m, knopf(eintrag, 'Wie geplant umsetzen'));
    await tipp(m, knopf(page, 'Umsetzen bestätigen'));
    await expect(page.getByText(/Umgesetzt: \d+ Sämlinge?/)).toBeVisible();
  }
  await expect.poll(() => ereignisse(m, 'umsetzen').length).toBe(5);
  const umsetzen = m.beruehrungen - saeen - keimen;
  expect(new Set(ereignisse(m, 'umsetzen').map((z) => z['netztopf_id']))).toEqual(
    new Set(['2.3.2', '2.3.3', '2.3.4', '2.3.5', '2.3.6'].map(netztopfId)),
  );

  expect({ saeen, keimen, umsetzen, zusammen: m.beruehrungen }).toMatchObject({ umsetzen: 4 });
  expect(m.beruehrungen).toBeLessThanOrEqual(26);
});
