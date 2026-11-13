// Usability Runde 3 (Issue #161, Plan 161; docs/entwurf/usability_befunde.md B6, B7, B8, B15; Tims Entscheide B, C, D
// vom 11.11.2026). REST nachgebildet, Fixtures der E2E; Honor-Profil (isMobile, Touch, Pixeldichte 3.5) 360 × 780.
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  satzAnlegen,
} from '../fixtures/duplizieren.ts';
import { einrichtungsTeile } from '../fixtures/einrichtung.ts';
import { regalTeile, uid, type Teile } from '../fixtures/regal.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { saatTeile, SORTE } from '../fixtures/saeen.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';
import { restNachbilden } from './rest.ts';

test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3.5 });

async function oeffnen(
  page: Page,
  teile: Teile | Record<string, unknown[]>,
  pfad: string,
  jetzt: Date,
  nachrechnen: (t: Teile) => Teile = sichtenNachrechnen,
): Promise<void> {
  const daten = nachrechnen(structuredClone(teile) as Teile);
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) zeileAufnehmen(daten, tabelle, z, jetzt);
      nachrechnen(daten);
    },
    (tabelle, clientId) => {
      stornoAufnehmen(daten, tabelle, clientId, jetzt);
      nachrechnen(daten);
    },
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
}

const knopf = (ort: Page | Locator, name: RegExp | string): Locator =>
  ort.getByRole('link', { name }).or(ort.getByRole('button', { name })).first();

async function hoehe(ort: Locator): Promise<number> {
  const b = await ort.boundingBox();
  if (!b) throw new Error('nicht sichtbar');
  return b.height;
}

test('U04-AK1 Einrichtung mit 6 erledigten Punkten: eine Zeile «Punkte 1 bis 6 erledigt», aufklappbar, Liste mindestens 300 dp kürzer', async ({
  page,
}) => {
  await oeffnen(page, einrichtungsTeile(6), '/#/heute', new Date('2026-12-01T08:00:00Z'));
  const liste = page.getByRole('list', { name: 'Einrichtung' });
  await expect(page.getByRole('heading', { name: 'Einrichtung · 6 von 9 erledigt' })).toBeVisible();
  const zeile = liste.getByRole('button', { name: /^Punkte 1 bis 6 erledigt/ });
  await expect(zeile).toHaveAttribute('aria-expanded', 'false');
  await expect(zeile).toHaveAccessibleName('Punkte 1 bis 6 erledigt anzeigen');
  expect(await hoehe(zeile)).toBeGreaterThanOrEqual(68);
  // eingeklappt: keine erledigte Karte, aktiver Punkt 7 und die offenen 8 und 9
  await expect(liste.getByRole('img', { name: 'erledigt' })).toHaveCount(0);
  await expect(liste.locator('li[data-zustand]')).toHaveCount(3);
  await expect(liste.getByRole('link', { name: 'Etiketten drucken' })).toBeVisible();
  const eingeklappt = await hoehe(liste);
  await zeile.click();
  await expect(zeile).toHaveAttribute('aria-expanded', 'true');
  await expect(zeile).toHaveAccessibleName('Punkte 1 bis 6 erledigt einklappen');
  await expect(liste.getByRole('img', { name: 'erledigt' })).toHaveCount(6);
  const aufgeklappt = await hoehe(liste);
  expect(aufgeklappt - eingeklappt, 'eingespart').toBeGreaterThanOrEqual(300);
  await zeile.click();
  await expect(liste.getByRole('img', { name: 'erledigt' })).toHaveCount(0);
});

test('U04-AK1 ein erledigter Punkt steht als «Punkt 1 erledigt», die übrigen acht einzeln', async ({
  page,
}) => {
  await oeffnen(page, einrichtungsTeile(1), '/#/heute', new Date('2026-12-01T08:00:00Z'));
  const liste = page.getByRole('list', { name: 'Einrichtung' });
  await expect(liste.getByRole('button', { name: /^Punkt 1 erledigt/ })).toBeVisible();
  await expect(liste.locator('li[data-zustand]')).toHaveCount(8);
});

test('U04-AK2 Einzelauswahl (E-Mail-Rückfall, Thema) mit rundem Punkt, kurze Optionen als gleich breite Segmente, kein Wort getrennt', async ({
  page,
}) => {
  const jetzt = new Date('2026-12-10T08:00:00Z');
  const t = regalTeile(jetzt);
  t['einstellung'] = [
    {
      id: uid('31', 1),
      push_zeit: '07:00:00',
      vorlauf_n: 2,
      kannengroesse_l: 10,
      messmittel_ml: [1, 5, 20, 60],
      messbecher: true,
      thema: 'hell',
      pflegebudget_min_werktag: 20,
      pflegebudget_h_woche: 4,
      zeitzone: 'Europe/Zurich',
      telefon_vertretung: 'Platzhalter',
    },
  ];
  await oeffnen(page, t, '/#/einstellungen', jetzt);
  for (const name of ['E-Mail, wenn Push fehlt', 'Thema']) {
    const gruppe = page.getByRole('group', { name });
    const optionen = gruppe.getByRole('button');
    await expect(optionen.first()).toBeVisible({ timeout: 15_000 });
    const breiten: number[] = [];
    for (const o of await optionen.all()) {
      breiten.push((await o.boundingBox())?.width ?? 0);
      const rund = await o.locator('.hv-choice-check').evaluate((e) => getComputedStyle(e).borderRadius);
      expect(rund, `${name}: runder Punkt`).toBe('50%');
      // kein Häkchen-Symbol in der Einzelauswahl
      await expect(o.locator('.hv-choice-check svg')).toHaveCount(0);
      // nie ein Wort getrennt: der Titel steht in einer Zeile (Prüfer Runde 1)
      const zeilen = await o
        .locator('.hv-choice-titel')
        .evaluate((e) => new Set([...e.getClientRects()].map((r) => Math.round(r.top))).size);
      expect(zeilen, `${name}: Titel in einer Zeile`).toBe(1);
    }
    await expect(gruppe.getByRole('button', { pressed: true })).toHaveCount(1);
    // zwei kurze Optionen stehen als gleich breite Segmente in einer Zeile
    if (name === 'E-Mail, wenn Push fehlt')
      expect(Math.max(...breiten) - Math.min(...breiten), 'gleich breit').toBeLessThanOrEqual(1);
  }
});

test('U04-AK2 Mehrfachauswahl (Sorten in Säen) behält das eckige Häkchen', async ({ page }) => {
  const saat = new Date('2027-01-07T08:00:00Z');
  await oeffnen(page, saatTeile(saat, { ohneSatzIn23: true }), '/#/saeen?box=R-A1', saat);
  // Plan 205: Mehrfachwahl über «Wählen»; die gewählte Sorte trägt das Häkchen, keinen runden Punkt
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa');
  const lollo = page.locator('.hv-sortenzeile-gewaehlt').filter({ hasText: 'Lollo Rossa' });
  await expect(lollo).toContainText('gewählt');
  await expect(lollo.locator('.hv-sortenzeile-zusatz svg')).toHaveCount(1);
  await expect(page.getByLabel('Gewählte Sorten').locator('svg')).toHaveCount(1);
  await expect(page.locator('.hv-choice-einzeln')).toHaveCount(0);
});

test('U04-AK3 Kurzprüfung als Frage: «Licht an? ja», nach Tipp «nein»; Ort «1.1 Pumpe sprudelt? ja»; Symbol 32 dp', async ({
  page,
}) => {
  await oeffnen(page, rundgangTeile({ orte: ['1.1', '2.1'] }), '/#/heute', RUNDGANG_JETZT);
  await knopf(page, /^Rundgang starten/).click();
  const licht = page.getByRole('button', { name: /^Licht an\?/ });
  await expect(licht).toHaveAccessibleName('Licht an? ja', { timeout: 10_000 });
  await expect(page.getByRole('button', { name: /^Lüfter läuft\? ja$/ })).toBeVisible();
  const pumpe = page.getByRole('button', { name: /^1\.1 Pumpe sprudelt\? ja/ });
  await expect(pumpe).toBeVisible();
  const symbol = await licht.locator('.hv-status-icon').boundingBox();
  expect(symbol?.width ?? 0).toBeGreaterThanOrEqual(32);
  await licht.click();
  await expect(licht).toHaveAccessibleName('Licht an? nein');
  await expect(licht).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Speichern mit 1 Abweichung' })).toBeVisible();
  await licht.click();
  await expect(licht).toHaveAccessibleName('Licht an? ja');
  await expect(page.getByRole('button', { name: 'Alles ok' })).toBeVisible();
});

function duplizierRegal(): Teile {
  // wie saeen-duplizieren.spec.ts regal(56, true)
  const t = duplizierTeile(JETZT_W4);
  kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { kulturdauer_max_d: 56 });
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
  satzAnlegen(t, {
    nr: 71,
    sorteId: SORTE.eichblatt,
    kulturform: 'schnitt',
    saatdatum: '2027-01-07',
    schwaemme: 1,
  });
  pflanzungAnlegen(t, 71, 1, { topf: '2.3.3' });
  return t;
}

test('U04-AK4 Nachfolge-Topf im Deckel zeigt «bis 4.3.» statt «4.3.», zugänglicher Name unverändert', async ({
  page,
}) => {
  await oeffnen(page, duplizierRegal(), '/#/saeen', JETZT_W4);
  await knopf(page, 'Lollo Rossa vom 7.1. duplizieren').click();
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  const loch = page.getByRole('button', { name: /^Loch 3, frei als Nachfolge, belegt bis 4\.3\.$/ });
  await expect(loch).toHaveText('bis 4.3.');
  const [scroll, client] = await loch.evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(scroll, 'Text passt ins Loch').toBeLessThanOrEqual(client);
});
