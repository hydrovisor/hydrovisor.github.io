// pH-Korrektur mit Nachmessen in der Messmaske 2.3 (Plan 29 Testliste ph-korrektur.spec, A19; Rundgang-AK3, UC9
// Ablauf 6, UC9-AK7; Konzept R4.14, R5.2). Der Rundgang entsteht erst mit I1b-05 und verwendet dieselbe Messmaske.
// REST nachgebildet (tests/e2e/rest.ts); feste Uhr mit page.clock am 12.1.2027 18:00 Zürich; Regal R aus
// tests/fixtures/ansatz.ts (v_ph_wirkung ohne Wert → w 0.1; 2.3 DWC 9 l, pH-Ziel 6.25).
// Rechenbeispiel R4.14: 9 l, pH 6.9, Ziel 6.25, w 0.1 → Vorschlag 5.85 ml, «zuerst 2.9 ml, erwartet 6.6, nach 15 min
// nachmessen».
//
// Erwartete Oberfläche (vom Testentwickler festgelegt, wo Plan 29 offen ist):
// - Ergebniszone .hv-ergebniszone nach dem dritten Wert mit dem Text «zuerst 2.9 ml, erwartet 6.6, nach 15 min
//   nachmessen» und dem Knopf «pH-Minus gegeben» (exakt).
// - Nach «pH-Minus gegeben»: Countdown role="timer" mit «15:00».
// - Heute (#/heute): «2.3 Nachmessen ab 18:15» mit «Messen» (Knopf oder Link) → #/messen/R-2.3?nachmessen=<id>.
// - Gesendet: messung (pH 6.9), naehrloesungsansatz (ph_korrektur, timer_ende = Uhr + 15 min, ph_vorher 6.9,
//   volumen_l 9, ist_ersteinstellung false, ohne status) vor ansatz_position (ph_minus, soll_ml und ist_ml 2.9,
//   ansatz_id); Nachmessen sendet eine messung nachmessen mit ansatz_id und kein Update.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ansatzTeile, um } from '../fixtures/ansatz.ts';
import { type Teile } from '../fixtures/regal.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

const VORSCHLAG = 'zuerst 2.9 ml, erwartet 6.6, nach 15 min nachmessen';

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  geaendert: [string, string, Record<string, unknown>][];
}

async function mitDaten(page: Page, start: Teile, pfad: string, uhr: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], geaendert: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        const zeile = tabelle === 'naehrloesungsansatz' ? { status: 'laufend', ...z } : z;
        zeileAufnehmen(m.daten, tabelle, zeile, uhr);
      }
    },
    (tabelle, clientId, felder) => m.geaendert.push([tabelle, clientId, felder]),
    (tabelle, id, felder) => m.geaendert.push([tabelle, id, felder]),
  );
  await page.clock.setFixedTime(uhr);
  await page.goto(pfad);
  return m;
}

const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}`) });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const zone = (page: Page) => page.locator('.hv-ergebniszone');

async function ziffern(page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
}

async function dreiWerte(page: Page, ph: string, ec: string, temperatur: string): Promise<void> {
  await ziffern(page, ph);
  await ziffern(page, ec);
  await ziffern(page, temperatur);
}

function heuteKnopf(page: Page, text: string, name: string): Locator {
  const eintrag = page.getByText(text).first().locator('xpath=ancestor-or-self::*[.//button or .//a][1]');
  return eintrag.getByRole('button', { name }).or(eintrag.getByRole('link', { name })).first();
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

test('Rundgang-AK3 «pH-Minus gegeben» startet den Timer 15 min und erzeugt «Nachmessen» (Messmaske 2.3 mit pH 6.9)', async ({
  page,
}) => {
  const m = await mitDaten(page, ansatzTeile(), '/#/messen/R-2.3', um('18:00'));
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });

  // 1. pH 6.9, EC 1.20, 20.0 °C → Vorschlag pH-Minus in der Ergebniszone
  await dreiWerte(page, '69', '120', '200');
  await expect(zone(page)).toBeVisible();
  await expect(zone(page)).toContainText(VORSCHLAG);

  // 2. «pH-Minus gegeben» → Countdown 15:00 und die Zeilen der Korrektur
  await taste(page, 'pH-Minus gegeben').click();
  await expect(page.getByRole('timer').first()).toHaveText('15:00', { timeout: 5_000 });
  await expect.poll(() => zeilenVon(m, 'ansatz_position').length).toBe(1);
  const messung = zeilenVon(m, 'messung').find((z) => Number(z['ph']) === 6.9);
  expect(messung, 'Messung pH 6.9').toBeDefined();
  const korrekturen = zeilenVon(m, 'naehrloesungsansatz');
  expect(korrekturen).toHaveLength(1);
  const kopf = korrekturen[0] as Record<string, unknown>;
  expect(kopf).toMatchObject({ typ: 'ph_korrektur', ist_ersteinstellung: false });
  expect(Number(kopf['ph_vorher'])).toBe(6.9);
  expect(Number(kopf['volumen_l'])).toBe(9);
  expect(Date.parse(String(kopf['timer_ende']))).toBe(um('18:15').getTime());
  expect(kopf).not.toHaveProperty('status');
  const position = zeilenVon(m, 'ansatz_position')[0] as Record<string, unknown>;
  expect(position).toMatchObject({ ansatz_id: kopf['id'], produkt_id: 'ph_minus' });
  expect(Number(position['soll_ml'])).toBe(2.9);
  expect(Number(position['ist_ml'])).toBe(2.9);
  const reihe = m.geschrieben.map(([t]) => t);
  expect(reihe.indexOf('naehrloesungsansatz')).toBeLessThan(reihe.indexOf('ansatz_position'));

  // 3. Heute zeigt das Nachmessen mit Uhrzeit
  await page.evaluate(() => {
    window.location.hash = '#/heute';
  });
  await expect(page.getByText('2.3 Nachmessen ab 18:15')).toBeVisible({ timeout: 15_000 });

  // 4. nach 15 min «Messen» → Messmaske im Modus Nachmessen; Speichern sendet nur eine Messung
  await page.clock.setFixedTime(um('18:15'));
  await heuteKnopf(page, '2.3 Nachmessen ab 18:15', 'Messen').click();
  await expect(page).toHaveURL(new RegExp(`#/messen/R-2\\.3\\?nachmessen=${String(kopf['id'])}$`));
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 15_000 });
  const vorher = m.geschrieben.length;
  await dreiWerte(page, '66', '120', '200');
  await taste(page, 'Speichern').click();
  await expect.poll(() => m.geschrieben.length).toBeGreaterThan(vorher);
  const neu = m.geschrieben.slice(vorher);
  expect(neu.map(([t]) => t)).toEqual(['messung']);
  expect(neu[0]?.[1]).toMatchObject({ messart: 'nachmessen', ansatz_id: kopf['id'] });
  expect(Number(neu[0]?.[1]['ph'])).toBe(6.6);
  expect(m.geaendert.filter(([t]) => t === 'naehrloesungsansatz')).toEqual([]);
});
