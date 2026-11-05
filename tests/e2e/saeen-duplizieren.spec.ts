// Maske «Säen» mit «Satz duplizieren» (Plan 25 Testliste; UC5, UC5-AK16, R11.1, R11.3). REST nachgebildet wie in
// saeen.spec.ts: POST aus schreiben() wird mitgeschnitten. Regal R aus tests/fixtures/duplizieren.ts mit einem Satz
// Lollo Rossa Schnitt vom 7.1. in A1 (3 Samen je Schwamm, 4 Schwämme), zwei Pflanzungen in 2.3.1 und 2.3.2. Feste Uhr
// 2027-02-18T08:00:00Z (W4), Salat setzt 14 Tage nach der Saat um: Umsetzdatum des Duplikats 4.3.; 360 × 640.
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 25 offen ist):
// - Schritt 1: Überschrift «Satz duplizieren», je Satz der Text «Lollo Rossa · Schnitt · gesät 7.1. · 2.3, 2 Töpfe»
//   und ein Button mit dem Namen «Lollo Rossa vom 7.1. duplizieren». Ein Tipp springt in «Schritt 2 von 3».
// - Schritt 2: übernommene Töpfe gewählt für die Sorte (Name «Loch n, … für Lollo Rossa»); ein freier Nachfolge-Topf
//   heisst «Loch n, frei als Nachfolge, belegt bis 4.3.» (Status nie nur über Farbe); Hinweise als Text:
//   «2.3 belegt bis voraussichtlich 5.3.; frei gleicher Grösse: …» und «Fester Takt alle 14 Tage: 2 Pflanzen je
//   Folgesatz (6 Löcher × 14 / 42 Tage)»; «Weiter» und «Ziel später» wie in Säen.
// - Schritt 3: die Hinweise nochmals; «Säen speichern»; danach «Gespeichert: 1 Satz, 4 Schwämme».
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  satzAnlegen,
  satzId,
} from '../fixtures/duplizieren.ts';
import { netztopfId, platzId, type Teile } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const JETZT = JETZT_W4;
const ORIGINAL = satzId(70);

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

async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.beruehrungen += 1;
  await ziel.click();
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);
const knopf = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Regal mit dem Original; `kulturdauerMax` der Salat-Kulturform Schnitt (56: frei am 4.3., 57: belegt bis 5.3.) */
function regal(kulturdauerMax: number, nachfolgeIn233 = false): Teile {
  const t = duplizierTeile(JETZT);
  kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: kulturdauerMax });
  satzAnlegen(t, {
    nr: 70,
    sorteId: SORTE.lollo,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    box: 'A1',
    samen: 3,
    schwaemme: 4,
  });
  pflanzungAnlegen(t, 70, 1, { topf: '2.3.1' });
  pflanzungAnlegen(t, 70, 2, { topf: '2.3.2' });
  for (const k of [3, 4]) pflanzungAnlegen(t, 70, k, { status: 'ueberzaehlig' });
  if (nachfolgeIn233) {
    // Eichblatt Schnitt vom 7.1. in 2.3.3: ebenfalls Ende 4.3., frei als Nachfolge, aber kein Topf des Originals
    satzAnlegen(t, {
      nr: 71,
      sorteId: SORTE.eichblatt,
      kulturform: 'schnitt',
      saatdatum: '2027-01-07',
      schwaemme: 1,
    });
    pflanzungAnlegen(t, 71, 1, { topf: '2.3.3' });
  }
  return t;
}

test('UC5 Satz duplizieren aus Schritt 1: vorbelegt, drei Berührungen bis Speichern', async ({ page }) => {
  const m = await mitDaten(page, regal(56, true), '/#/saeen');
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Satz duplizieren' })).toBeVisible();
  await expect(page.getByText('Lollo Rossa · Schnitt · gesät 7.1. · 2.3, 2 Töpfe')).toBeVisible();

  await tipp(m, knopf(page, 'Lollo Rossa vom 7.1. duplizieren'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  // übernommene Töpfe 1 und 2 gewählt für Lollo Rossa, 3 frei als Nachfolge (Text, nicht nur Farbe)
  await expect(page.getByRole('button', { name: /^Loch [12], .*für Lollo Rossa$/ })).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: /^Loch 3, frei als Nachfolge, belegt bis 4\.3\.$/ }),
  ).toBeVisible();
  await expect(
    page.getByText('Fester Takt alle 14 Tage: 2 Pflanzen je Folgesatz (6 Löcher × 14 / 42 Tage)').first(),
  ).toBeVisible();
  await expect(page.getByText(/belegt bis voraussichtlich/)).toHaveCount(0);
  await tipp(m, knopf(page, 'Weiter'));

  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText('Gespeichert: 1 Satz, 4 Schwämme')).toBeVisible();
  expect(m.beruehrungen).toBe(3);

  await expect.poll(() => zeilenVon(m, 'reservierung').length).toBe(2);
  const vorgaenge = zeilenVon(m, 'pflanzvorgang');
  expect(vorgaenge).toHaveLength(1);
  expect(vorgaenge[0]?.['einstieg']).toBe('duplizieren');
  const saetze = zeilenVon(m, 'satz');
  expect(saetze).toHaveLength(1);
  expect(saetze[0]).toMatchObject({
    sorte_id: SORTE.lollo,
    kulturform: 'schnitt',
    kopiert_von: ORIGINAL,
    anzuchtort_platz_id: platzId('A1'),
    samen_je_schwamm: 3,
    anzahl_schwaemme: 4,
    saatdatum: '2027-02-18',
  });
  expect(zeilenVon(m, 'pflanzung')).toHaveLength(4);
  const res = zeilenVon(m, 'reservierung');
  expect(res.map((r) => r['netztopf_id']).sort()).toEqual([netztopfId('2.3.1'), netztopfId('2.3.2')].sort());
  for (const r of res)
    expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-03-04', umsetzen_geplant_am: '2027-03-04' });
});

test('UC5 Satz duplizieren mit belegten Töpfen zeigt den Hinweis «belegt bis voraussichtlich» und speichert ohne Reservierung', async ({
  page,
}) => {
  // Kulturdauer max. 57: Ende 5.3. nach dem Umsetzdatum 4.3. → Ziel später
  const m = await mitDaten(page, regal(57), '/#/saeen');
  await tipp(m, knopf(page, 'Lollo Rossa vom 7.1. duplizieren'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  const hinweis =
    /2\.3 belegt bis voraussichtlich 5\.3\.; frei gleicher Grösse: 2\.3\.3, 2\.3\.4, 2\.3\.5, 2\.3\.6/;
  await expect(page.getByText(hinweis).first()).toBeVisible();
  // die Töpfe des Originals sind nicht gewählt
  await expect(page.getByRole('button', { name: /^Loch \d+, .*für Lollo Rossa$/ })).toHaveCount(0);
  await tipp(m, knopf(page, 'Ziel später'));

  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await expect(page.getByText(hinweis).first()).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz, \d+ Schwämme/)).toBeVisible();
  expect(m.beruehrungen).toBe(3);

  await expect.poll(() => zeilenVon(m, 'pflanzung').length).toBeGreaterThan(0);
  expect(zeilenVon(m, 'pflanzvorgang')[0]?.['einstieg']).toBe('duplizieren');
  const saetze = zeilenVon(m, 'satz');
  expect(saetze).toHaveLength(1);
  expect(saetze[0]).toMatchObject({
    kopiert_von: ORIGINAL,
    anzuchtort_platz_id: platzId('A1'),
    samen_je_schwamm: 3,
  });
  expect(zeilenVon(m, 'reservierung')).toEqual([]);
});
