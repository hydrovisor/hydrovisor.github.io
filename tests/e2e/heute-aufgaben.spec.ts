// UX1 Heute: Aufgaben zuerst, Aktion als Haupttaste, Position merken (Issue #223, Plan 223; Usability-Runde vom
// 14.11.2026). REST nachgebildet, feste Uhr, 360 × 640 aus der Konfiguration. Datenstände:
// - rueckdatiertTeile() (tests/fixtures/phasen.ts, 12.1.2027): Einrichtung 4 von 9, Push nicht eingerichtet, Karte
//   «Phasen nachführen», Ortskarte R-A1 mit «Würfel feucht» und «Keimung prüfen».
// - grundstand() (tests/unit/aufgaben-fixture.ts, 12.1.2027): alle Aufgabentypen der Aufgaben-Rechnung.
// - rundgangTeile() (tests/fixtures/rundgang.ts, 12.1.2027): drei Ortskarten, R-3.1 unter dem ersten Bildschirm.
// - einrichtungsTeile(0): nichts erfasst, keine fällige Aufgabe.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { einrichtungsTeile } from '../fixtures/einrichtung.ts';
import { RUECK_JETZT, rueckdatiertTeile } from '../fixtures/phasen.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { grundstand, JETZT as GRUND_JETZT } from '../unit/aufgaben-fixture.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Teile = Record<string, unknown[]>;
type Geschrieben = [string, Record<string, unknown>][];

async function heute(page: Page, teile: Teile, uhr: Date): Promise<Geschrieben> {
  const daten = structuredClone(teile);
  const geschrieben: Geschrieben = [];
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) geschrieben.push([tabelle, z]);
    },
  );
  await page.clock.setFixedTime(uhr);
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  return geschrieben;
}

/** steht `a` im Dokument vor `b`? */
async function vor(a: Locator, b: Locator): Promise<boolean> {
  const zweiter = await b.elementHandle();
  return a.evaluate(
    (e, z) => Boolean(z && e.compareDocumentPosition(z) & Node.DOCUMENT_POSITION_FOLLOWING),
    zweiter,
  );
}

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

const einrichtungZeile = (page: Page) =>
  page.getByRole('button', { name: /^Einrichtung · \d von 9 erledigt (anzeigen|einklappen)$/ });
const einrichtungListe = (page: Page) => page.getByRole('list', { name: 'Einrichtung' });

test('UX1-AK1 die erste Ortskarte steht vor Phasenkarten, Einrichtung und Push-Hinweis; ihre erste Aufgabe ist ohne Scrollen sichtbar', async ({
  page,
}) => {
  await heute(page, rueckdatiertTeile(), RUECK_JETZT);
  const karte = page.locator('main .hv-ortskarte').first();
  await expect(karte).toHaveAccessibleName('R-A1');
  const phasen = page.getByRole('heading', { name: /^Phasen nachführen/ });
  const einrichtung = page.getByRole('heading', { name: /^Einrichtung · 4 von 9 erledigt/ });
  const push = page.getByText('Push nicht eingerichtet');
  for (const block of [phasen, einrichtung, push]) await expect(block).toBeAttached();

  expect(await vor(karte, phasen), 'Ortskarte vor Phasenkarten').toBe(true);
  expect(await vor(karte, einrichtung), 'Ortskarte vor Einrichtung').toBe(true);
  expect(await vor(karte, push), 'Ortskarte vor Push-Hinweis').toBe(true);
  // Reihenfolge der Blöcke darunter: Phasenkarten, Einrichtung, Push-Hinweis
  expect(await vor(phasen, einrichtung), 'Phasenkarten vor Einrichtung').toBe(true);
  expect(await vor(einrichtung, push), 'Einrichtung vor Push-Hinweis').toBe(true);

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const erste = karte.getByRole('listitem').first();
  await expect(erste).toContainText('Würfel feucht');
  // ganz im Bild und weder vom festen Fuss noch von der Leiste verdeckt
  await ohneScrollenTippbar(erste);
});

test('UX1-AK2 mit fälligen Aufgaben ist die Einrichtung eine eingeklappte Zeile mit dem Stand; ein Tipper öffnet die Liste', async ({
  page,
}) => {
  await heute(page, rueckdatiertTeile(), RUECK_JETZT);
  await expect(page.locator('main .hv-ortskarte').first()).toBeVisible();
  const zeile = einrichtungZeile(page);
  await expect(zeile).toHaveAccessibleName('Einrichtung · 4 von 9 erledigt anzeigen');
  await expect(zeile).toHaveAttribute('aria-expanded', 'false');
  await expect(einrichtungListe(page)).toHaveCount(0);
  expect((await zeile.boundingBox())?.height ?? 0, 'Tippfläche im Regal').toBeGreaterThanOrEqual(68);

  await zeile.click();
  await expect(zeile).toHaveAttribute('aria-expanded', 'true');
  await expect(zeile).toHaveAccessibleName('Einrichtung · 4 von 9 erledigt einklappen');
  await expect(einrichtungListe(page)).toBeVisible();
  await expect(einrichtungListe(page).locator('li[data-zustand="aktiv"]')).toHaveCount(1);
});

test('UX1-AK2 ohne fällige Aufgabe ist die Einrichtung offen', async ({ page }) => {
  await heute(page, einrichtungsTeile(0), RUECK_JETZT);
  await expect(page.getByRole('heading', { name: 'Einrichtung · 0 von 9 erledigt' })).toBeVisible();
  await expect(page.locator('main .hv-ortskarte')).toHaveCount(0);
  await expect(einrichtungListe(page)).toBeVisible();
  await expect(einrichtungZeile(page)).toHaveCount(0);
});

test('UX1-AK3 die Aktion der Aufgabe ist die Haupttaste der Zeile, «Öffnen» nachrangig; der Zeilentext wiederholt den Ort nicht', async ({
  page,
}) => {
  await heute(page, grundstand(), GRUND_JETZT);
  const karten = page.locator('main .hv-ortskarte');
  await expect(karten.first()).toBeVisible();

  // je Aktion eine Zeile aus dem Grundstand: [Ortskarte, Aufgabe, Haupttaste]
  const erwartet = [
    ['R-A1', 'Würfel feucht', 'Erledigt'],
    ['R-A3', 'Deckel öffnen', 'Deckel geöffnet'],
    ['R-3.1', 'Messen', 'Messen'],
    ['R-2.2', 'Gefäss prüfen', 'Prüfen'],
    ['R-2.1', 'Lösung wechseln', 'Ansetzen'],
  ] as const;
  for (const [code, aufgabe, aktion] of erwartet) {
    const zeile = page
      .getByRole('region', { name: code, exact: true })
      .getByRole('listitem')
      .filter({ has: page.locator('.hv-aufgabe-text', { hasText: new RegExp(`^${aufgabe}`) }) })
      .first();
    const tasten = zeile.locator('.hv-aufgabe-knoepfe > *');
    await expect(tasten.first(), `${code} ${aufgabe}`).toHaveText(aktion);
    await expect(tasten.first(), `${code} ${aufgabe}`).toHaveClass(/hv-btn-secondary/);
  }

  // jede Zeile mit eigener Aktion: genau eine betonte Taste, sie steht zuerst; «Öffnen» ist nie betont und nie zuerst
  const zeilen = await page.locator('main .hv-aufgabe:has(.hv-aufgabe-knoepfe)').evaluateAll((li) =>
    li.map((e) => ({
      text: e.querySelector('.hv-aufgabe-text')?.textContent ?? '',
      ort: e.closest('.hv-ortskarte')?.getAttribute('aria-label') ?? '',
      tasten: [...e.querySelectorAll('.hv-aufgabe-knoepfe > *')].map((t) => ({
        text: (t.textContent ?? '').trim(),
        betont: t.classList.contains('hv-btn-secondary'),
        nachrangig: t.classList.contains('hv-btn-ghost'),
      })),
    })),
  );
  expect(zeilen.length).toBeGreaterThan(10);
  const AKTIONEN = ['Erledigt', 'Deckel geöffnet', 'Messen', 'Prüfen', 'Ansetzen'];
  let mitOeffnen = 0;
  for (const z of zeilen) {
    const name = `${z.ort} «${z.text}»`;
    expect(
      z.tasten.filter((t) => t.betont),
      name,
    ).toHaveLength(1);
    expect(z.tasten[0]?.betont, name).toBe(true);
    expect(
      z.tasten.slice(1).every((t) => t.nachrangig),
      name,
    ).toBe(true);
    const aktion = z.tasten.find((t) => AKTIONEN.includes(t.text));
    const oeffnen = z.tasten.find((t) => t.text === 'Öffnen');
    if (aktion) {
      expect(z.tasten[0]?.text, name).toBe(aktion.text);
      if (oeffnen) {
        mitOeffnen += 1;
        expect(oeffnen.nachrangig, name).toBe(true);
      }
    }
    // der Ort steht nur im Kartenkopf
    if (z.ort === '') continue;
    expect(z.text, name).not.toContain(z.ort);
    expect(z.text, name).not.toContain(z.ort.replace(/^[A-Z]-/, ''));
  }
  expect(mitOeffnen, 'Zeilen mit Aktion und «Öffnen»').toBeGreaterThan(0);
});

test('UX1-AK4 von einer Aufgabe weiter unten in die Messmaske und zurück: die Aufgabe ist ohne Scrollen wieder sichtbar', async ({
  page,
}) => {
  await heute(page, rundgangTeile(), RUNDGANG_JETZT);
  const zeile = page
    .getByRole('region', { name: 'R-3.1', exact: true })
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: 'Messen', exact: true }) });
  await expect(zeile).toHaveCount(1);
  // die Aufgabe liegt unter dem ersten Bildschirm, sonst prüft der Test nichts
  expect((await zeile.boundingBox())?.y ?? 0).toBeGreaterThan(640);
  await zeile.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.scrollY > 0);
  // das Scroll-Ereignis ist verarbeitet, bevor der Tipper die Maske wechselt
  await page.evaluate(
    () => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))),
  );
  const vorher = await page.evaluate(() => window.scrollY);

  await zeile.getByRole('link', { name: 'Messen', exact: true }).click();
  await expect(page).toHaveURL(/#\/e\/R-3\.1|#\/messen/);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toHaveCount(0);
  await page.getByRole('link', { name: 'Zu Heute' }).first().click();

  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeAttached();
  await expect(zeile).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(vorher);
});

test('UX1-AK5 Tipperzahl «Aufgabe in Heute erledigen»: «Würfel feucht» mit 1 Tipper, ohne Scrollen und ohne Maskenwechsel', async ({
  page,
}) => {
  const geschrieben = await heute(page, rueckdatiertTeile(), RUECK_JETZT);
  const zeile = page
    .getByRole('region', { name: 'R-A1', exact: true })
    .getByRole('listitem')
    .filter({ hasText: 'Würfel feucht' });
  const erledigt = zeile.getByRole('button', { name: 'Erledigt', exact: true });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await ohneScrollenTippbar(erledigt);

  // Tipper 1
  await erledigt.click();
  await expect(zeile).toHaveCount(0);
  await expect(page).toHaveURL(/#\/heute$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const ereignisse = geschrieben.filter(
    ([tabelle, z]) => tabelle === 'ereignis' && z['typ'] === 'aufgabe_erledigt',
  );
  expect(ereignisse).toHaveLength(1);
});
