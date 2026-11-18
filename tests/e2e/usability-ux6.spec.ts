// UX6 (Issue #228, Usability-Runde vom 14.11.2026; Plan 228 Testliste E2E): Säen Schritt 2 mit Titel, Urteil der
// Passung und freien Löchern je Ziel, Vorwahl des besten empfohlenen Ziels und «Alle freien wählen und weiter»
// (UX6-AK2, UX6-AK3); «Tüte erfassen» liest nach der Rückseite von selbst (UX6-AK4). REST, Storage und Edge Functions
// sind über page.route nachgebildet (tests/e2e/rest.ts, wie saeen-passung.spec.ts und kamera.spec.ts); die Claude API
// wird nie aufgerufen, ki-tuete und ki-recherche antworten aus der Nachbildung und werden gezählt. Feste Uhr ZB_JETZT
// (Mo 18.1.2027 09:00 Zürich) für Säen, 7.1.2027 für «Tüte erfassen»; 360 × 640 aus der Konfiguration. Keine
// Personendaten; der Name der neuen Sorte ist erfunden.
//
// Erwartete Oberfläche (Plan 228; vom Testentwickler festgelegt, wo der Plan offen ist):
// - Säen Schritt 2: h2 «Wohin? · Anlage R»; Gruppe «Zielgefäss» (Choice, role=group) mit je Ziel einem Button, dessen
//   Name mit der Kennung beginnt und das Wort der Stufe (Baustein Stufe, .hv-badge: «Empfohlen», «Möglich», «Nicht
//   empfohlen») oder «ohne Urteil» sowie «n freie Löcher», «1 freies Loch» oder «kein freies Loch» enthält. Geordnet
//   nach Urteil, bei Gleichstand nach Kennung; das erste empfohlene Ziel mit freiem Loch ist vorgewählt
//   (aria-pressed=true), sein Deckel («Loch n, …») steht im Bild.
// - Regal aus tests/fixtures/passung.ts: für Lollo Rossa sind 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3 Empfohlen, 2.3 Nicht
//   empfohlen; freie Löcher 1.1 4, 2.3 0, 3.1 8. Ochsenherz ist überall Nicht empfohlen.
// - Bei genau einer Sorte heisst die Taste unter dem Deckel «Alle freien wählen und weiter» und öffnet Schritt 3; mit
//   zwei Sorten «Alle freien wählen» ohne Schrittwechsel.
// - «Tüte erfassen»: nach dem Foto der Rückseite im Fotofeld wechselt die Maske ohne Tipp in den Schritt «Ergebnis»
//   und ruft ki-tuete genau einmal mit beiden Fotos; kein Knopf «Tüte lesen»; «Ohne Rückseite lesen» bleibt.
// - Zählweise: Säen ab der Leiste «Saatgut» (7) bzw. ab «Säen» in Saatgut (6); «Tüte erfassen» ab der Seite «Saatgut»
//   (A9, ohne die Tipper in der Kamera-App von Android beim Fotofeld).
import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { netztopfId, type Teile } from '../fixtures/regal.ts';
import { passungTeile, SORTE, ZB_JETZT } from '../fixtures/passung.ts';
import { saatTeile, saatWissen } from '../fixtures/saeen.ts';
import { zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { fotoWaehlen, FUNKTIONEN, kiOk, NICHT_EINGERICHTET, SIGNIEREN, testbild } from './lokal-db.ts';
import { restNachbilden } from './rest.ts';
import { sorteOeffnen, sorteWaehlen } from './sortenwahl-hilfe.ts';

// Kamera-Weg (UX6-AK4): nachgebildete Kamera wie kamera.spec.ts; launchOptions gehen nur auf oberster Ebene
test.use({
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  permissions: ['camera'],
});

// ---------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
  tipper: number;
}

async function oeffnen(page: Page, start: Teile, pfad: string, jetzt: Date): Promise<Mitschnitt> {
  const m: Mitschnitt = { daten: structuredClone(start), geschrieben: [], tipper: 0 };
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
    },
    () => undefined,
  );
  await page.clock.setFixedTime(jetzt);
  await page.goto(pfad);
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
  return m;
}

/** jede Berührung über diese Hilfe zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.tipper += 1;
  await ziel.click();
}

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);

const knopf = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).or(page.getByRole('link', { name, exact: true }));
const zielGruppe = (page: Page) => page.getByRole('group', { name: 'Zielgefäss' });
const ziele = (page: Page) => zielGruppe(page).getByRole('button');
const zielgefaess = (page: Page, kennung: string) =>
  zielGruppe(page)
    .getByRole('button', { name: new RegExp(`^${kennung.replace('.', '\\.')}(?![.\\d])`) })
    .first();
const loecher = (page: Page) => page.getByRole('button', { name: /^Loch \d+,/ });
const STUFE = /^(Empfohlen|Möglich|Nicht empfohlen)$/;
const URTEIL = /(Empfohlen|Möglich|Nicht empfohlen|ohne Urteil)/;
const FREI = /(\d+ freie Löcher|1 freies Loch|kein freies Loch)/;
const LOLLO_ORDNUNG = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '3.3', '2.3'];

/** Kennungen der Ziel-Knöpfe in der angezeigten Reihenfolge */
async function kennungen(page: Page): Promise<string[]> {
  const texte = await ziele(page).allInnerTexts();
  return texte.map((t) => /^\s*(\d+\.\d+)/.exec(t)?.[1] ?? `? ${t}`);
}

async function ohneWaagrechtesScrollen(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
}

/** Regal mit Passungs-Stammwerten und der Einstellung (wie saeen-passung.spec.ts) */
function regal(): Teile {
  const t = passungTeile();
  t['einstellung'] = saatWissen()['einstellung'] ?? [];
  return t;
}

/** Säen ohne Box und Ziel öffnen und Lollo Rossa mit «Wählen und weiter» wählen */
async function lolloInSchritt2(page: Page, pfad = '/#/saeen'): Promise<Mitschnitt> {
  const m = await oeffnen(page, regal(), pfad, ZB_JETZT);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible({ timeout: 15_000 });
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel), { weiter: true });
  return m;
}

// ---------------------------------------------------------------------
// UX6-AK2 Säen Schritt 2: Titel, Urteil je Ziel, Vorwahl
// ---------------------------------------------------------------------

test('UX6-AK2 Schritt 2 zeigt «Wohin? · Anlage R» und an jedem Ziel das Urteil als Wort, ohne dass ein Ziel angetippt wurde', async ({
  page,
}) => {
  const m = await lolloInSchritt2(page);
  // nur Kachel, Sortenzeile, «Wählen und weiter»: kein Ziel angetippt
  expect(m.tipper).toBe(3);
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wohin? · Anlage R', level: 2 })).toBeVisible();

  await expect(ziele(page)).toHaveCount(LOLLO_ORDNUNG.length);
  for (const z of await ziele(page).all()) {
    await expect(z).toContainText(URTEIL);
    await expect(z).toContainText(FREI);
  }
  await expect(zielgefaess(page, '1.1')).toContainText('Empfohlen');
  await expect(zielgefaess(page, '1.1')).toContainText('4 freie Löcher');
  await expect(zielgefaess(page, '2.3')).toContainText('Nicht empfohlen');
  await expect(zielgefaess(page, '2.3')).toContainText('kein freies Loch');
  await expect(zielgefaess(page, '3.1')).toContainText('8 freie Löcher');
  // der zugängliche Name beginnt weiter mit der Kennung
  await expect(zielgefaess(page, '3.3')).toHaveAccessibleName(/^3\.3 /);
});

test('UX6-AK2 Ziele nach Urteil geordnet; das beste empfohlene Ziel ist vorgewählt (aria-pressed) und sein Deckel steht im Bild', async ({
  page,
}) => {
  await lolloInSchritt2(page);
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(ziele(page)).toHaveCount(LOLLO_ORDNUNG.length);
  expect(await kennungen(page)).toEqual(LOLLO_ORDNUNG);

  // 1.1 ist vorgewählt, kein anderes Ziel
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await expect(zielGruppe(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
  // Deckel D1 von 1.1 mit 4 Löchern, im Bild; die Zeile der Passung steht ohne Tipp
  await expect(loecher(page)).toHaveCount(4);
  // im Honor-Viewport 360 × 780 (CLAUDE.md); das erste Loch im DOM liegt in der vorderen, unteren Reihe (column-reverse)
  await page.setViewportSize({ width: 360, height: 780 });
  await expect(loecher(page).first()).toBeInViewport();
  await expect(page.getByText(/^Lollo Rossa: Empfohlen/)).toBeVisible();
  await expect(knopf(page, 'Alle freien wählen und weiter')).toBeEnabled();
});

test('UX6-AK2 ohne empfohlenes Ziel ist nichts vorgewählt, «Weiter» gesperrt', async ({ page }) => {
  const m = await oeffnen(page, regal(), '/#/saeen', ZB_JETZT);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible({ timeout: 15_000 });
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await sorteWaehlen(page, 'Tomate', 'Ochsenherz', (ziel) => tipp(m, ziel), { weiter: true });
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wohin? · Anlage R', level: 2 })).toBeVisible();

  // Ochsenherz passt nirgends: jedes Ziel trägt «Nicht empfohlen»
  await expect(ziele(page)).toHaveCount(LOLLO_ORDNUNG.length);
  for (const z of await ziele(page).all()) await expect(z).toContainText('Nicht empfohlen');
  await expect(zielGruppe(page).locator('button[aria-pressed="true"]')).toHaveCount(0);
  await expect(loecher(page)).toHaveCount(0);
  await expect(page.getByText(/^Ochsenherz: /)).toHaveCount(0);
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  // nicht empfohlene Ziele bleiben mit einem Tipp wählbar (A10)
  await tipp(m, zielgefaess(page, '1.1'));
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/^Ochsenherz: Nicht empfohlen/)).toBeVisible();
});

test('UX6-AK2 Einstieg aus Gefäss (?ziel=R-3.3&von=gefaess) behält das Ziel aus der Adresse, auch wenn ein anderes besser passt', async ({
  page,
}) => {
  await lolloInSchritt2(page, '/#/saeen?ziel=R-3.3&von=gefaess');
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wohin? · Anlage R', level: 2 })).toBeVisible();
  // 1.1 steht vorne, gewählt bleibt 3.3 aus der Adresse
  expect((await kennungen(page))[0]).toBe('1.1');
  await expect(zielgefaess(page, '3.3')).toHaveAttribute('aria-pressed', 'true');
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'false');
  await expect(zielGruppe(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
  // Deckel D3 von 3.3 mit 8 Löchern
  await expect(loecher(page)).toHaveCount(8);
});

test('UX6-AK2 zurück in Schritt 1 ohne gewähltes Ziel zeigt keine Stufe an den Sorten (Vorwahl wirkt nur in Schritt 2)', async ({
  page,
}) => {
  await lolloInSchritt2(page);
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await knopf(page, 'Zurück').click();
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await expect(page.getByText(STUFE)).toHaveCount(0);
  await sorteOeffnen(page, 'Salat', 'Lollo Rossa');
  await expect(page.getByText(STUFE)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /anzeigen$/ })).toHaveCount(0);
});

test('UX6-AK2 Status nie nur über Farbe: jede Stufe an einem Ziel ist ein Wort; 360 × 640 ohne waagrechtes Scrollen', async ({
  page,
}) => {
  await lolloInSchritt2(page);
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(ziele(page)).toHaveCount(LOLLO_ORDNUNG.length);
  const badges = zielGruppe(page).locator('.hv-badge');
  await expect(badges).toHaveCount(LOLLO_ORDNUNG.length);
  for (const b of await badges.all()) expect((await b.innerText()).trim()).toMatch(STUFE);
  await ohneWaagrechtesScrollen(page);
  const breite = page.viewportSize()?.width ?? 360;
  for (const z of await ziele(page).all()) {
    const box = await z.boundingBox();
    expect(box, 'Ziel sichtbar').not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(breite);
  }
});

// ---------------------------------------------------------------------
// UX6-AK3 Tipperzahl «Säen»
// ---------------------------------------------------------------------

test('UX6-AK3 Säen mit einer Sorte, vorgewähltem Ziel und «Alle freien wählen und weiter»: höchstens 6 Tipper ab «Säen» in Saatgut bis «Gespeichert», 7 ab der Leiste', async ({
  page,
}) => {
  const m = await oeffnen(page, regal(), '/#/heute', ZB_JETZT);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await tipp(
    m,
    page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('link', { name: 'Saatgut', exact: true }),
  );
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible();
  const abLeiste = m.tipper;
  await tipp(m, page.locator('main').getByRole('link', { name: 'Säen', exact: true }));
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible();
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel), { weiter: true });

  // Schritt 2: 1.1 vorgewählt, ein Tipp gibt alle freien Löcher und öffnet Schritt 3
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await tipp(m, knopf(page, 'Alle freien wählen und weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible({ timeout: 15_000 });

  // abLeiste zählt den Tipp auf die Leiste schon mit: ab «Säen» (eingeschlossen) sind es m.tipper - abLeiste
  expect(m.tipper - abLeiste, 'ab «Säen» in Saatgut').toBeLessThanOrEqual(6);
  expect(m.tipper, 'ab der Leiste').toBeLessThanOrEqual(7);

  // geschrieben: ein Satz Lollo Rossa, Reservierungen auf alle freien 8-cm-Töpfe von 1.1, Einstufung empfohlen
  await expect.poll(() => zeilenVon(m, 'reservierung').length, { timeout: 15_000 }).toBe(4);
  const saetze = zeilenVon(m, 'satz');
  expect(saetze).toHaveLength(1);
  expect(saetze[0]?.['sorte_id']).toBe(SORTE.lollo);
  expect(
    zeilenVon(m, 'reservierung')
      .map((r) => r['netztopf_id'])
      .sort(),
  ).toEqual(['1.1.1', '1.1.2', '1.1.3', '1.1.4'].map((k) => netztopfId(k)).sort());
  const pflanzungen = zeilenVon(m, 'pflanzung');
  expect(pflanzungen.length).toBeGreaterThan(0);
  for (const p of pflanzungen) expect(p['einstufung']).toBe('empfohlen');
});

test('UX6-AK3 zwei Sorten: die Taste heisst «Alle freien wählen» und bleibt in Schritt 2', async ({
  page,
}) => {
  const m = await oeffnen(page, regal(), '/#/saeen', ZB_JETZT);
  await expect(page.getByText('Schritt 1 von 3')).toBeVisible({ timeout: 15_000 });
  await sorteWaehlen(page, 'Salat', 'Lollo Rossa', (ziel) => tipp(m, ziel));
  await sorteWaehlen(page, 'Salat', 'Eichblatt', (ziel) => tipp(m, ziel), { weiter: true });
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  // beide Salate passen in 1.1: vorgewählt
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await expect(knopf(page, 'Alle freien wählen und weiter')).toHaveCount(0);
  await tipp(m, knopf(page, 'Alle freien wählen'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Loch \d+, gewählt für / })).toHaveCount(4);
  await expect(knopf(page, 'Weiter')).toBeEnabled();
});

test('UX6-AK3 «Zurück» aus Schritt 3 zeigt die gewählten Löcher im Deckel, «Gesät» zurückdatiert ändert das vorgewählte Ziel nicht', async ({
  page,
}) => {
  const m = await lolloInSchritt2(page);
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await tipp(m, knopf(page, 'Alle freien wählen und weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();

  // «Zurück» zeigt die Wahl im Deckel und lässt sie ändern
  await tipp(m, knopf(page, 'Zurück'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Loch \d+, gewählt für / })).toHaveCount(4);
  await tipp(m, knopf(page, 'Weiter'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();

  // zwei Tage zurückdatiert: Ziel und Löcher bleiben (Vorwahl ist ein Zustand, R1)
  await tipp(m, knopf(page, 'Gesät weniger'));
  await tipp(m, knopf(page, 'Gesät weniger'));
  await tipp(m, knopf(page, 'Zurück'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await expect(zielgefaess(page, '1.1')).toHaveAttribute('aria-pressed', 'true');
  await expect(zielGruppe(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Loch \d+, gewählt für / })).toHaveCount(4);
  await tipp(m, knopf(page, 'Weiter'));
  await tipp(m, knopf(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => zeilenVon(m, 'reservierung').length, { timeout: 15_000 }).toBe(4);
  expect(zeilenVon(m, 'satz')[0]?.['saatdatum']).toBe('2027-01-16');
  for (const r of zeilenVon(m, 'reservierung'))
    expect(['1.1.1', '1.1.2', '1.1.3', '1.1.4'].map((k) => netztopfId(k))).toContain(r['netztopf_id']);
});

// ---------------------------------------------------------------------
// UX6-AK4 Tipperzahl «Tüte erfassen»
// ---------------------------------------------------------------------

const TUETE_JETZT = new Date('2027-01-07T08:00:00Z');
const HOCHLADEN = /\/storage\/v1\/object\/saattueten\//;

interface Tuete extends Mitschnitt {
  /** Anfragen an ki-tuete und ki-recherche (nachgebildet) */
  tuete: Record<string, unknown>[];
  recherche: Record<string, unknown>[];
  hochgeladen: string[];
}

/** Regal aus saatTeile wie kamera.spec.ts, REST, Storage und Edge Functions nachgebildet */
async function tueteVorbereiten(page: Page, name: string): Promise<Tuete> {
  const jpeg = await testbild(page, '#2e7d32', 'Tüte');
  const daten: Teile = structuredClone(saatTeile(TUETE_JETZT, { ohneSatzIn23: true }));
  daten['tuetenfoto'] = [];
  // name_wiss ist in der Datenbank Pflicht; saatTeile() lässt es weg (wie kamera.spec.ts)
  daten['art'] = (daten['art'] ?? []).map((a) => ({ name_wiss: '', ...a }));
  const s: Tuete = { daten, geschrieben: [], tipper: 0, tuete: [], recherche: [], hochgeladen: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        s.geschrieben.push([tabelle, z]);
        zeileAufnehmen(daten, tabelle, z, TUETE_JETZT);
      }
    },
    () => undefined,
  );
  await page.route(HOCHLADEN, async (route: Route) => {
    const pfad = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^.*\/saattueten\//, ''));
    s.hochgeladen.push(pfad);
    return route.fulfill({ json: { Id: pfad, Key: `saattueten/${pfad}` } });
  });
  await page.route(SIGNIEREN, async (route: Route) => {
    const anfrage = route.request();
    const pfad = decodeURIComponent(
      new URL(anfrage.url()).pathname.replace(/^.*\/object\/sign\/saattueten\//, ''),
    );
    if (anfrage.method() === 'POST')
      return route.fulfill({ json: { signedURL: `/object/sign/saattueten/${pfad}?token=e2e` } });
    return route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpeg });
  });
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    s.tuete.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: kiOk(name, 'Salat') });
  });
  await page.route(`${FUNKTIONEN}/ki-recherche`, async (route) => {
    s.recherche.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    return route.fulfill({ json: NICHT_EINGERICHTET });
  });
  await page.clock.setFixedTime(TUETE_JETZT);
  await page.goto('/#/saatgut');
  await expect(page.getByRole('heading', { name: 'Saatgut', level: 1 })).toBeVisible({ timeout: 15_000 });
  return s;
}

const schrittAktiv = (page: Page) => page.locator('ol[aria-label="Schritte"] [aria-current="step"]');

/** Foto über das Fotofeld wählen und als einen Tipper zählen («Foto aufnehmen»; die Kamera-App zählt nicht, A9) */
async function fotoTipp(s: Tuete, page: Page, seite: 'Vorderseite' | 'Rückseite', farbe: string) {
  const bild = await testbild(page, farbe, seite);
  s.tipper += 1;
  await fotoWaehlen(page, seite, bild);
}

test('UX6-AK4 Tüte erfassen über das Fotofeld: nach der Rückseite liest die App ohne weiteren Tipper; von Saatgut bis «Gespeichert» höchstens 6 Tipper', async ({
  page,
}) => {
  const name = 'Testsalat Ux Sechs';
  const s = await tueteVorbereiten(page, name);
  await tipp(s, knopf(page, 'Tüte erfassen'));
  await expect(page.getByRole('heading', { name: 'Tüte erfassen', level: 1 })).toBeVisible();
  await fotoTipp(s, page, 'Vorderseite', '#2e7d32');
  await expect(schrittAktiv(page)).toContainText('Rückseite');
  await expect(knopf(page, 'Ohne Rückseite lesen')).toBeVisible();
  expect(s.tuete).toHaveLength(0);

  await fotoTipp(s, page, 'Rückseite', '#1565c0');
  // ohne weiteren Tipp: Schritt «Ergebnis», genau eine Anfrage mit beiden Fotos
  await expect(schrittAktiv(page)).toContainText('Ergebnis', { timeout: 15_000 });
  await expect(knopf(page, 'Tüte lesen')).toHaveCount(0);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name, { timeout: 15_000 });
  expect(s.tuete).toHaveLength(1);
  expect((s.tuete[0]?.['fotopfade'] as string[] | undefined) ?? []).toHaveLength(2);
  expect(s.hochgeladen).toHaveLength(2);

  await tipp(s, knopf(page, 'Sorte speichern'));
  await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });
  expect(s.tipper).toBe(4);
  expect(s.tipper).toBeLessThanOrEqual(6);
  // kein zweites Lesen
  expect(s.tuete).toHaveLength(1);
  expect(zeilenVon(s, 'tuetenfoto').map((f) => f['seite'])).toEqual(['vorne', 'hinten']);
});

test('UX6-AK4 «Ohne Rückseite lesen» bleibt und liest mit einem Foto', async ({ page }) => {
  const name = 'Testsalat Ohne Rueckseite';
  const s = await tueteVorbereiten(page, name);
  await tipp(s, knopf(page, 'Tüte erfassen'));
  await fotoTipp(s, page, 'Vorderseite', '#33691e');
  await expect(schrittAktiv(page)).toContainText('Rückseite');
  await tipp(s, knopf(page, 'Ohne Rückseite lesen'));
  await expect(schrittAktiv(page)).toContainText('Ergebnis');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name, { timeout: 15_000 });
  expect(s.tuete).toHaveLength(1);
  expect((s.tuete[0]?.['fotopfade'] as string[] | undefined) ?? []).toHaveLength(1);
  await tipp(s, knopf(page, 'Sorte speichern'));
  await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });
  expect(s.tipper).toBeLessThanOrEqual(6);
});

test('UX6-AK4 ein neues Foto der Vorderseite im Schritt Rückseite startet das Lesen nicht', async ({
  page,
}) => {
  const s = await tueteVorbereiten(page, 'Testsalat Vorderseite Neu');
  await tipp(s, knopf(page, 'Tüte erfassen'));
  await fotoTipp(s, page, 'Vorderseite', '#2e7d32');
  await expect(schrittAktiv(page)).toContainText('Rückseite');
  // Vorderseite ersetzen: bleibt im Schritt «Rückseite», keine Anfrage
  await fotoTipp(s, page, 'Vorderseite', '#4e342e');
  await page.waitForTimeout(500);
  await expect(schrittAktiv(page)).toContainText('Rückseite');
  await expect(knopf(page, 'Ohne Rückseite lesen')).toBeVisible();
  expect(s.tuete).toHaveLength(0);
  expect(s.hochgeladen).toHaveLength(0);
  // erst die Rückseite startet das Lesen, genau einmal
  await fotoTipp(s, page, 'Rückseite', '#1565c0');
  await expect(schrittAktiv(page)).toContainText('Ergebnis', { timeout: 15_000 });
  await expect.poll(() => s.tuete.length, { timeout: 15_000 }).toBe(1);
  expect((s.tuete[0]?.['fotopfade'] as string[] | undefined) ?? []).toHaveLength(2);
});

test('UX6-AK4 Kamera-Weg: «Vorder- und Rückseite aufnehmen», zwei Auslösungen, «Sorte speichern»: 5 Tipper bis «Gespeichert»', async ({
  page,
}) => {
  const name = 'Testsalat Kamera';
  const s = await tueteVorbereiten(page, name);
  const kamera = page.getByRole('dialog', { name: /^Kamera: / });
  const ausloeser = kamera.getByRole('button', { name: 'Foto aufnehmen', exact: true });
  await tipp(s, knopf(page, 'Tüte erfassen'));
  await tipp(s, knopf(page, 'Vorder- und Rückseite aufnehmen'));
  await expect(ausloeser).toBeEnabled({ timeout: 15_000 });
  await tipp(s, ausloeser);
  await expect(kamera.getByText('Rückseite', { exact: true })).toBeVisible();
  await expect(ausloeser).toBeEnabled({ timeout: 15_000 });
  await tipp(s, ausloeser);
  await expect(kamera).toHaveCount(0);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name, { timeout: 15_000 });
  expect(s.tuete).toHaveLength(1);
  expect((s.tuete[0]?.['fotopfade'] as string[] | undefined) ?? []).toHaveLength(2);
  await tipp(s, knopf(page, 'Sorte speichern'));
  await expect(page.getByText(`Gespeichert: ${name} mit Packung`)).toBeVisible({ timeout: 15_000 });
  expect(s.tipper).toBe(5);
  expect(s.tipper).toBeLessThanOrEqual(6);
});
