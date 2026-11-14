// UX2 Meldezeile mit Rückgängig, «Nächste Aufgabe» und Weg zurück (Issue #224, Plan 224 Testliste; UX2-AK2 bis AK6;
// U4, U13; R1.5, R1.6, R5.1, R5.3, R6.2; Konzept 6.3). REST nachgebildet (tests/e2e/rest.ts) mit beimSchreiben und
// beimStornieren, feste Uhr je Datenstand, Europe/Zurich und 360 × 640 aus der Konfiguration. Datenstände:
// - rueckdatiertTeile() (tests/fixtures/phasen.ts, 12.1.2027): Ortskarte R-A1 mit «Würfel feucht».
// - grundstand() (tests/unit/aufgaben-fixture.ts, 12.1.2027): R-A1 und R-A3 «Würfel feucht», R-A3 «Deckel öffnen»,
//   R-1.1 «Messen und nachfüllen» mit «Pegel ok», R-2.1 «Lösung wechseln» mit «Morgen», R-3.1 «Messen» (Kratky
//   belüftet) mit «Überspringen».
// - buendelTeile() (tests/fixtures/phasen.ts, 23.1.2027): Phasenkarte «Salat · 4.4 · gesät 7.1.» mit «Alle Ja».
// - rundgangTeile() (tests/fixtures/rundgang.ts, 12.1.2027): «Messen und nachfüllen» R-1.1 und R-2.1, «Messen» R-3.1.
// - umsetzTeile() (tests/fixtures/umsetzen.ts, 28.1.2027): Umsetzen Lollo Rossa und Ochsenherz wie geplant.
// - keimTeile() (tests/fixtures/keimung.ts, 11.1.2027) mit zweitem Satz; saatTeile() (tests/fixtures/saeen.ts, 7.1.2027).
// Keine Personendaten.
//
// Erwartete Oberfläche (Plan 224 Entscheide 1 bis 8; vom Testentwickler festgelegt, wo der Plan offen ist):
// - Meldezeile `.hv-meldezeile` mit role="status", fest unten über Leiste und Fuss; Text nach der Tabelle unter
//   Entscheid 3 («Erledigt: Würfel feucht R-A1», «Auf morgen verschoben: Lösung wechseln R-2.1», «Übersprungen: Messen
//   R-3.1», «Pegel ok gespeichert: Messen und nachfüllen R-1.1», «Deckel geöffnet: R-A3», «Gespeichert: <Kartentitel>»);
//   darin der Button «Rückgängig machen» (im Regal mindestens 68 dp); nach dem Storno «Rückgängig gemacht» ohne Taste.
//   Die Meldung bleibt beim Nachladen und Scrollen, endet mit der nächsten Meldung und beim Maskenwechsel (A2).
// - Nach dem Speichern in Messen, Keimung, Umsetzen und Säen: Link oder Button, dessen Name mit «Nächste Aufgabe: »
//   beginnt («Nächste Aufgabe: <Titel> <Ort>», Ort als Code wie «R-2.1»), als primary, daneben «Zu Heute»; ohne
//   Folgeaufgabe nur «Zu Heute». Beide sind beim Erscheinen 400 ms gesperrt (aria-disabled="true" oder disabled, A5).
// - «Zu Heute» (Link oder Button, genau dieser Name) im Kopf (`main header`) von Messen (auch mit Banner), Pflanze und
//   Rundgang.
// Zählung: jede Berührung über tipp(), Ziffern eingeschlossen.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { KEIM_JETZT, KEIM_SATZ, KEIM_SATZ_2, keimTeile } from '../fixtures/keimung.ts';
import {
  buendelTeile,
  phasenNachrechnen,
  pflanzungVon,
  RUECK_JETZT,
  rueckdatiertTeile,
} from '../fixtures/phasen.ts';
import { platzId, type Teile } from '../fixtures/regal.ts';
import { JETZT as RUNDGANG_JETZT, rundgangTeile } from '../fixtures/rundgang.ts';
import { saatTeile } from '../fixtures/saeen.ts';
import {
  pflanzSichtenNachrechnen,
  sichtenNachrechnen,
  stornoAufnehmen,
  umsetzSichtenNachrechnen,
  zeileAufnehmen,
} from '../fixtures/sichten.ts';
import { SATZ, UMSETZ_FAELLIG, umsetzTeile } from '../fixtures/umsetzen.ts';
import { grundstand, JETZT as GRUND_JETZT } from '../unit/aufgaben-fixture.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { REST, restNachbilden } from './rest.ts';
import { sorteWaehlen } from './sortenwahl-hilfe.ts';

type Zeile = Record<string, unknown>;

interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Zeile][];
  storniert: [string, string, Zeile][];
  tipper: number;
}

/** Phasen 23.1.2027 09:00 Zürich: Lollo Rossa (61) und Eichblatt (62) in 4.4 fällig */
const PHASEN_JETZT = new Date('2027-01-23T08:00:00Z');
const SAAT_JETZT = new Date('2027-01-07T08:00:00Z');

/** REST nachbilden, Uhr setzen, Seite öffnen; geschriebene Zeilen und Stornos landen im Datenstand */
async function oeffnen(
  page: Page,
  e: {
    teile: Teile;
    jetzt: Date;
    pfad: string;
    ueberschrift: string | RegExp;
    nachrechnen?: (t: Teile) => Teile;
  },
): Promise<Mitschnitt> {
  const nachrechnen = e.nachrechnen ?? ((t: Teile) => t);
  const m: Mitschnitt = {
    daten: nachrechnen(structuredClone(e.teile)),
    geschrieben: [],
    storniert: [],
    tipper: 0,
  };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => m.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        m.geschrieben.push([tabelle, z]);
        zeileAufnehmen(m.daten, tabelle, z, e.jetzt);
      }
      nachrechnen(m.daten);
    },
    (tabelle, clientId, felder) => {
      m.storniert.push([tabelle, clientId, felder]);
      stornoAufnehmen(m.daten, tabelle, clientId, e.jetzt);
      nachrechnen(m.daten);
    },
  );
  await page.clock.setFixedTime(e.jetzt);
  await page.goto(e.pfad);
  await page.reload();
  await expect(page.getByRole('heading', { name: e.ueberschrift, level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  return m;
}

const heute = (page: Page, teile: Teile, jetzt: Date, nachrechnen?: (t: Teile) => Teile) =>
  oeffnen(page, { teile, jetzt, pfad: '/#/heute', ueberschrift: 'Heute', nachrechnen });

/** jede Berührung zählen */
async function tipp(m: Mitschnitt, ziel: Locator): Promise<void> {
  m.tipper += 1;
  await ziel.click();
}

const knopf = (ort: Page | Locator, name: string | RegExp) =>
  typeof name === 'string'
    ? ort.getByRole('link', { name, exact: true }).or(ort.getByRole('button', { name, exact: true }))
    : ort.getByRole('link', { name }).or(ort.getByRole('button', { name }));
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const region = (page: Page, code: string) => page.getByRole('region', { name: code, exact: true });
const zeileIn = (page: Page, code: string, text: string) =>
  region(page, code).getByRole('listitem').filter({ hasText: text });
const meldezeile = (page: Page) => page.locator('.hv-meldezeile[role="status"]');
const rueckgaengig = (page: Page) =>
  meldezeile(page).getByRole('button', { name: 'Rückgängig machen', exact: true });
const naechste = (page: Page) => knopf(page.locator('main'), /^Nächste Aufgabe: /);
const zuHeuteKopf = (page: Page) => knopf(page.locator('main header'), 'Zu Heute');
const kachel = (page: Page, bezeichnung: 'pH' | 'EC' | '°C') =>
  page.getByRole('button', { name: new RegExp(`^${bezeichnung}( |$)`) });
const kurzpruefung = (page: Page, ebene: number) =>
  page.getByText(`Ebene ${ebene} · Pumpen laufen, Licht an, Lüfter läuft`);

const zeilenVon = (m: Mitschnitt, tabelle: string) =>
  m.geschrieben.filter(([t]) => t === tabelle).map(([, z]) => z);
const ereignisseVom = (m: Mitschnitt, typ: string) =>
  zeilenVon(m, 'ereignis').filter((z) => z['typ'] === typ);

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

/** aktiv: sichtbar, nicht gesperrt (Sperre 400 ms nach dem Erscheinen, A5) */
async function aktiv(ort: Locator): Promise<void> {
  await expect(ort).toBeVisible();
  await expect(ort).not.toHaveAttribute('aria-disabled', 'true');
  await expect(ort).toBeEnabled();
}

/** Storno der Zeile mit dieser client_id, Grund rueckgaengig */
async function storniert(m: Mitschnitt, tabelle: string, clientId: unknown): Promise<void> {
  expect(typeof clientId, 'client_id der geschriebenen Zeile').toBe('string');
  await expect
    .poll(() => m.storniert.find(([t, id]) => t === tabelle && id === clientId)?.[2]['storno_grund'])
    .toBe('rueckgaengig');
  expect(m.storniert.find(([t, id]) => t === tabelle && id === clientId)?.[2]['storniert_am']).toBeTruthy();
}

/**
 * Beobachtet ab jetzt, ob «Nächste Aufgabe» und «Zu Heute» (ausserhalb des Kopfs) beim Einfügen ins Dokument gesperrt
 * sind (aria-disabled="true" oder disabled, A5). Lesen mit sperreBeimErscheinen().
 */
async function sperreBeobachten(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __sperre: Record<string, boolean> };
    w.__sperre = {};
    const pruefen = (el: Element) => {
      const text = (el.textContent ?? '').trim();
      const name = text.startsWith('Nächste Aufgabe')
        ? 'naechste'
        : text === 'Zu Heute' && !el.closest('header')
          ? 'zuHeute'
          : undefined;
      if (!name || name in w.__sperre) return;
      w.__sperre[name] =
        el.getAttribute('aria-disabled') === 'true' || (el instanceof HTMLButtonElement && el.disabled);
    };
    new MutationObserver((liste) => {
      for (const eintrag of liste)
        for (const n of eintrag.addedNodes)
          if (n instanceof Element)
            for (const e of [n, ...n.querySelectorAll('a, button')]) if (e.matches('a, button')) pruefen(e);
    }).observe(document.body, { childList: true, subtree: true });
  });
}

const sperreBeimErscheinen = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sperre: Record<string, boolean> }).__sperre);

/** Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(m: Mitschnitt, page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await tipp(m, taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`));
    await page.waitForTimeout(120);
  }
}

async function ohneSeitenScrollen(page: Page): Promise<void> {
  const { hoehe, fenster, oben } = await page.evaluate(() => ({
    hoehe: document.scrollingElement?.scrollHeight ?? document.body.scrollHeight,
    fenster: window.innerHeight,
    oben: window.scrollY,
  }));
  expect(hoehe, 'Seitenhöhe').toBeLessThanOrEqual(fenster);
  expect(oben, 'nicht gescrollt').toBe(0);
}

/** zwei Frames: Scroll- und Render-Ereignisse sind verarbeitet */
const frames = (page: Page) =>
  page.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));

const nachRundgang = (t: Teile) => sichtenNachrechnen(t);
const nachUmsetzen = (t: Teile) => umsetzSichtenNachrechnen(sichtenNachrechnen(t));
const nachKeimung = (t: Teile) => pflanzSichtenNachrechnen(sichtenNachrechnen(t));

/** 3.3 ruht: «Gefäss prüfen» R-3.3 entfällt (kein weiterer Eintrag mit eigener Maske) */
function ruht33(t: Teile): Teile {
  const id = 'e0000000-0000-4000-8000-000000000331';
  (t['ereignis'] ??= []).push({
    id,
    client_id: id,
    typ: 'ruhe',
    platz_id: platzId('3.3'),
    daten: { gesetzt: true },
    gilt_ab: '2027-01-20T08:00:00.000Z',
    storniert_am: null,
  });
  return t;
}

// ---------------------------------------------------------------------------------------------------------------
// UX2-AK2 Meldezeile mit Rückgängig für die Aktionen in Heute
// ---------------------------------------------------------------------------------------------------------------

test('UX2-AK2 «Erledigt» bei Würfel feucht: Meldung «Erledigt: …» ganz im Bild und tippbar; Rückgängig storniert das Ereignis (storno_grund rueckgaengig), die Zeile steht wieder in R-A1', async ({
  page,
}) => {
  const m = await heute(page, rueckdatiertTeile(), RUECK_JETZT);
  const zeile = zeileIn(page, 'R-A1', 'Würfel feucht');
  await expect(zeile).toHaveCount(1);
  await tipp(m, zeile.getByRole('button', { name: 'Erledigt', exact: true }));
  await expect(zeile).toHaveCount(0);

  await expect(meldezeile(page)).toContainText('Erledigt: Würfel feucht R-A1');
  await expect(meldezeile(page)).toBeInViewport({ ratio: 1 });
  await ohneScrollenTippbar(rueckgaengig(page));
  expect((await rueckgaengig(page).boundingBox())?.height ?? 0, 'Tippfläche im Regal').toBeGreaterThanOrEqual(
    67.5,
  );

  await expect.poll(() => ereignisseVom(m, 'aufgabe_erledigt').length).toBe(1);
  const clientId = ereignisseVom(m, 'aufgabe_erledigt')[0]?.['client_id'];
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'ereignis', clientId);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(rueckgaengig(page)).toHaveCount(0);
  await expect(zeile).toHaveCount(1);
  // kein zweites Ereignis
  expect(ereignisseVom(m, 'aufgabe_erledigt')).toHaveLength(1);
});

test('UX2-AK2 «Morgen»: Meldung, Rückgängig storniert die Zeile in aufschub, die Aufgabe steht wieder da', async ({
  page,
}) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  const zeile = zeileIn(page, 'R-2.1', 'Lösung wechseln');
  await expect(zeile).toHaveCount(1);
  await tipp(m, zeile.getByRole('button', { name: 'Morgen', exact: true }));
  await expect(zeile).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Auf morgen verschoben: Lösung wechseln R-2.1');
  await ohneScrollenTippbar(rueckgaengig(page));

  await expect.poll(() => zeilenVon(m, 'aufschub').length).toBe(1);
  const aufschub = zeilenVon(m, 'aufschub')[0];
  expect(aufschub?.['art']).toBe('morgen');
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'aufschub', aufschub?.['client_id']);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(zeile).toHaveCount(1);
  await expect(zeile.getByRole('button', { name: 'Morgen', exact: true })).toBeVisible();
});

test('UX2-AK2 «Überspringen» (Messen Kratky belüftet): Meldung, Rückgängig storniert, Aufgabe wieder da', async ({
  page,
}) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  const zeile = zeileIn(page, 'R-3.1', 'Messen');
  await expect(zeile).toHaveCount(1);
  await tipp(m, zeile.getByRole('button', { name: 'Überspringen', exact: true }));
  await expect(zeile).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Übersprungen: Messen R-3.1');
  await ohneScrollenTippbar(rueckgaengig(page));

  await expect.poll(() => zeilenVon(m, 'aufschub').length).toBe(1);
  const aufschub = zeilenVon(m, 'aufschub')[0];
  expect(aufschub?.['art']).toBe('ueberspringen');
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'aufschub', aufschub?.['client_id']);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(zeile).toHaveCount(1);
});

test('UX2-AK2 «Pegel ok»: Zeile bleibt, Taste weg, Meldung; Rückgängig storniert, Taste «Pegel ok» wieder da', async ({
  page,
}) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  const zeile = zeileIn(page, 'R-1.1', 'Messen und nachfüllen');
  const pegel = zeile.getByRole('button', { name: 'Pegel ok', exact: true });
  await expect(pegel).toBeVisible();
  await tipp(m, pegel);
  await expect(pegel).toHaveCount(0);
  await expect(zeile).toHaveCount(1);
  await expect(meldezeile(page)).toContainText('Pegel ok gespeichert: Messen und nachfüllen R-1.1');
  await ohneScrollenTippbar(rueckgaengig(page));

  await expect.poll(() => zeilenVon(m, 'aufschub').length).toBe(1);
  const aufschub = zeilenVon(m, 'aufschub')[0];
  expect(aufschub?.['art']).toBe('pegel_ok');
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'aufschub', aufschub?.['client_id']);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(zeile.getByRole('button', { name: 'Pegel ok', exact: true })).toBeVisible();
});

test('UX2-AK2 «Deckel geöffnet»: Meldung, Rückgängig storniert deckel_geoeffnet', async ({ page }) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  const zeile = zeileIn(page, 'R-A3', 'Deckel öffnen');
  await expect(zeile).toHaveCount(1);
  await tipp(m, zeile.getByRole('button', { name: 'Deckel geöffnet', exact: true }));
  await expect(zeile).toHaveCount(0);
  await expect(meldezeile(page)).toContainText('Deckel geöffnet: R-A3');
  await ohneScrollenTippbar(rueckgaengig(page));

  await expect.poll(() => ereignisseVom(m, 'deckel_geoeffnet').length).toBe(1);
  const clientId = ereignisseVom(m, 'deckel_geoeffnet')[0]?.['client_id'];
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  await storniert(m, 'ereignis', clientId);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(zeile).toHaveCount(1);
});

test('UX2-AK2 U13 Doppeltipper: zweiter Klick 100 ms nach «Erledigt» an derselben Stelle schreibt nichts weiter, die nachgerückte Aufgabe bleibt offen', async ({
  page,
}) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  // R-A3: «Würfel feucht» (Erledigt), darunter «Deckel öffnen» (Deckel geöffnet) rückt nach
  const wuerfel = zeileIn(page, 'R-A3', 'Würfel feucht');
  const deckel = zeileIn(page, 'R-A3', 'Deckel öffnen');
  await expect(deckel).toHaveCount(1);
  const erledigt = wuerfel.getByRole('button', { name: 'Erledigt', exact: true });
  await erledigt.scrollIntoViewIfNeeded();
  await frames(page);
  const box = await erledigt.boundingBox();
  if (!box) throw new Error('«Erledigt»: keine Bounding Box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  await page.mouse.click(x, y);
  await expect(wuerfel).toHaveCount(0);
  // Zeit für einen allfälligen zweiten Schreibvorgang
  await page.waitForTimeout(800);

  expect(ereignisseVom(m, 'aufgabe_erledigt')).toHaveLength(1);
  expect(ereignisseVom(m, 'deckel_geoeffnet')).toHaveLength(0);
  expect(zeilenVon(m, 'aufschub')).toHaveLength(0);
  await expect(deckel).toHaveCount(1);
  await expect(deckel.getByRole('button', { name: 'Deckel geöffnet', exact: true })).toBeVisible();
  await expect(meldezeile(page)).toContainText('Erledigt: Würfel feucht R-A3');
});

test('UX2-AK2 U4 die Meldung bleibt beim Nachladen des Bündels und beim Scrollen, endet mit der nächsten Aktion und beim Maskenwechsel', async ({
  page,
}) => {
  const m = await heute(page, grundstand(), GRUND_JETZT);
  const nachgeladen = page.waitForRequest(
    (r) => r.method() === 'GET' && r.url().startsWith(REST) && !r.url().includes('/rpc/'),
  );
  await tipp(
    m,
    zeileIn(page, 'R-A1', 'Würfel feucht').getByRole('button', { name: 'Erledigt', exact: true }),
  );
  await expect(meldezeile(page)).toContainText('Erledigt: Würfel feucht R-A1');

  // Nachladen des Bündels nach dem Schreiben
  await nachgeladen;
  await page.waitForLoadState('networkidle');
  await frames(page);
  await expect(meldezeile(page)).toContainText('Erledigt: Würfel feucht R-A1');
  await expect(rueckgaengig(page)).toBeVisible();

  // Scrollen: die Meldung bleibt fest unten im Bild
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => window.scrollY > 0);
  await frames(page);
  await expect(meldezeile(page)).toContainText('Erledigt: Würfel feucht R-A1');
  await expect(meldezeile(page)).toBeInViewport({ ratio: 1 });

  // nächste Aktion: die neue Meldung ersetzt die alte
  await tipp(m, zeileIn(page, 'R-3.1', 'Messen').getByRole('button', { name: 'Überspringen', exact: true }));
  await expect(meldezeile(page)).toContainText('Übersprungen: Messen R-3.1');
  await expect(meldezeile(page)).not.toContainText('Erledigt: Würfel feucht R-A1');
  await expect(meldezeile(page)).toHaveCount(1);

  // Maskenwechsel: die Meldung endet und kommt in Heute nicht zurück
  await tipp(
    m,
    zeileIn(page, 'R-1.1', 'Messen und nachfüllen').getByRole('link', { name: 'Messen', exact: true }),
  );
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toHaveCount(0);
  await expect(meldezeile(page)).toHaveCount(0);
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  await expect(meldezeile(page)).toHaveCount(0);
});

// ---------------------------------------------------------------------------------------------------------------
// UX2-AK3 Phasenkarten melden über die Meldezeile
// ---------------------------------------------------------------------------------------------------------------

test('UX2-AK3 «Alle Ja» einer Phasenkarte unter dem ersten Bildschirm: Meldung «Gespeichert: …» ohne Scrollen ganz im Bild, «Rückgängig machen» tippbar und storniert', async ({
  page,
}) => {
  const m = await heute(
    page,
    buendelTeile(PHASEN_JETZT, { ohneSpaete: true }),
    PHASEN_JETZT,
    phasenNachrechnen,
  );
  const titel = 'Salat · 4.4 · gesät 7.1.';
  const karte = page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]');
  await expect(karte).toHaveCount(1);
  const alleJa = knopf(karte, 'Alle Ja');
  // die Karte liegt mit ihrer Taste unter dem ersten Bildschirm
  const vorher = await alleJa.boundingBox();
  expect((vorher?.y ?? 0) + (vorher?.height ?? 0), 'Taste unter dem ersten Bildschirm').toBeGreaterThan(640);
  await alleJa.scrollIntoViewIfNeeded();
  await frames(page);

  await tipp(m, alleJa);
  await expect.poll(() => ereignisseVom(m, 'phase_antwort').length).toBe(2);
  // ohne weiteres Scrollen: die Meldung steht ganz im Bild, «Rückgängig machen» ist frei
  await expect(meldezeile(page)).toContainText(`Gespeichert: ${titel}`);
  await expect(meldezeile(page)).toBeInViewport({ ratio: 1 });
  await ohneScrollenTippbar(rueckgaengig(page));
  await expect(karte).toHaveCount(0);

  const ids = ereignisseVom(m, 'phase_antwort').map((z) => z['client_id']);
  await aktiv(rueckgaengig(page));
  await tipp(m, rueckgaengig(page));
  for (const id of ids) await storniert(m, 'ereignis', id);
  await expect(meldezeile(page)).toContainText('Rückgängig gemacht');
  await expect(
    page.getByRole('heading', { name: titel, exact: true }).locator('xpath=ancestor::section[1]'),
  ).toHaveCount(1);
});

// ---------------------------------------------------------------------------------------------------------------
// UX2-AK4 Tipperzahl «Messung erfassen» mit «Nächste Aufgabe»
// ---------------------------------------------------------------------------------------------------------------

/** von Heute: «Messen» in R-1.1, 8 Ziffern, Speichern, «Nächste Aufgabe» bis zur Messmaske R-2.1 */
async function messenBisR21(page: Page, m: Mitschnitt): Promise<void> {
  await tipp(
    m,
    zeileIn(page, 'R-1.1', 'Messen und nachfüllen').getByRole('link', { name: 'Messen', exact: true }),
  );
  await expect(kachel(page, 'EC')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'R-1.1', level: 1 })).toBeVisible();
  await ziffern(m, page, '62');
  await ziffern(m, page, '120');
  await ziffern(m, page, '200');
  await tipp(m, taste(page, 'Speichern'));
  await expect.poll(() => zeilenVon(m, 'messung').length).toBe(1);

  const weiter = naechste(page);
  await expect(weiter).toHaveAccessibleName(/^Nächste Aufgabe:\s*Messen und nachfüllen R-2\.1$/);
  await expect(knopf(page.locator('main'), 'Zu Heute').last()).toBeVisible();
  await aktiv(weiter);
  await tipp(m, weiter);
  await expect(page).toHaveURL(/#\/(messen|e)\/R-2\.1$/);
  await expect(page.getByRole('heading', { name: 'R-2.1', level: 1 })).toBeVisible();
  await expect(kachel(page, 'EC')).toBeVisible();
}

test('UX2-AK4 Tipperzahl «Messung erfassen»: Messen in R-1.1, 8 Ziffern, Speichern, «Nächste Aufgabe: Messen und nachfüllen R-2.1» → Messmaske R-2.1 nach 11 Tippern', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile(), RUNDGANG_JETZT, nachRundgang);
  m.tipper = 0;
  await messenBisR21(page, m);
  expect(m.tipper).toBe(11);
  expect(zeilenVon(m, 'messung')[0]).toMatchObject({ platz_id: platzId('1.1'), ph: 6.2, ec: 1.2 });
  // die Messmaske R-2.1 ist frisch: keine Bestätigung der vorigen Messung
  await expect(naechste(page)).toHaveCount(0);
  await expect(page.getByText(/^Gespeichert \d{2}:\d{2}/)).toHaveCount(0);
});

test('UX2-AK4 zwei Messungen hintereinander bis zurück in Heute brauchen 21 Tipper, scrollY in Heute bleibt 0', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile(), RUNDGANG_JETZT, nachRundgang);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  m.tipper = 0;
  await messenBisR21(page, m);
  await ziffern(m, page, '62');
  await ziffern(m, page, '120');
  await ziffern(m, page, '200');
  await tipp(m, taste(page, 'Speichern'));
  await expect.poll(() => zeilenVon(m, 'messung').length).toBe(2);
  expect(zeilenVon(m, 'messung')[1]).toMatchObject({ platz_id: platzId('2.1') });

  await expect(naechste(page)).toHaveAccessibleName(/^Nächste Aufgabe:\s*Messen R-3\.1$/);
  const zurueck = knopf(page.locator('main'), 'Zu Heute').last();
  await aktiv(zurueck);
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper).toBe(21);
  await frames(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  // beide Messungen erledigt: R-1.1 und R-2.1 ohne «Messen»
  await expect(zeileIn(page, 'R-1.1', 'Messen und nachfüllen')).toHaveCount(0);
  await expect(zeileIn(page, 'R-2.1', 'Messen und nachfüllen')).toHaveCount(0);
});

// ---------------------------------------------------------------------------------------------------------------
// UX2-AK5 Weiterführung nach dem Speichern in Umsetzen, Keimung und Säen
// ---------------------------------------------------------------------------------------------------------------

test('UX2-AK5 Tipperzahl «Umsetzen wie geplant»: 2 Tipper bis gespeichert; die Bestätigung zeigt «Nächste Aufgabe: …» (primary) und «Zu Heute»', async ({
  page,
}) => {
  const m = await heute(page, umsetzTeile({ jetzt: UMSETZ_FAELLIG }), UMSETZ_FAELLIG, nachUmsetzen);
  const eintrag = page
    .getByRole('listitem')
    .filter({ hasText: 'Umsetzen' })
    .filter({ hasText: 'Lollo Rossa' });
  await expect(eintrag).toHaveCount(1);
  m.tipper = 0;
  await tipp(m, knopf(eintrag, 'Wie geplant umsetzen'));
  await expect(page).toHaveURL(new RegExp(`#/umsetzen/${SATZ.lollo}\\?wie=geplant$`));
  await sperreBeobachten(page);
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText('Umgesetzt: 5 Sämlinge')).toBeVisible();
  expect(m.tipper).toBe(2);

  const weiter = naechste(page);
  await expect(weiter).toBeVisible();
  await expect(weiter).toHaveClass(/hv-btn-primary/);
  const zurueck = knopf(page.locator('main'), 'Zu Heute');
  await expect(zurueck).toHaveCount(1);
  await expect(zurueck).toBeVisible();
  await expect(zurueck).not.toHaveClass(/hv-btn-primary/);
  // Doppeltipper: beide beim Erscheinen 400 ms gesperrt
  expect(await sperreBeimErscheinen(page)).toEqual({ naechste: true, zuHeute: true });

  // nächste Aufgabe in der Reihenfolge von Heute: Ochsenherz wie geplant
  await aktiv(weiter);
  await tipp(m, weiter);
  await expect(page).toHaveURL(new RegExp(`#/umsetzen/${SATZ.tomate}\\?wie=geplant$`));
  await expect(page.getByRole('heading', { name: 'Umsetzen', level: 1 })).toBeVisible();
  await expect(page.getByText(/^Umgesetzt: /)).toHaveCount(0);
});

test('UX2-AK5 ohne weitere Aufgabe zeigt die Bestätigung nur «Zu Heute»', async ({ page }) => {
  const teile = ruht33(umsetzTeile({ jetzt: UMSETZ_FAELLIG, rucola: false, tomate: false }));
  const m = await oeffnen(page, {
    teile,
    jetzt: UMSETZ_FAELLIG,
    pfad: `/#/umsetzen/${SATZ.lollo}?wie=geplant`,
    ueberschrift: 'Umsetzen',
    nachrechnen: nachUmsetzen,
  });
  await sperreBeobachten(page);
  await tipp(m, knopf(page, 'Umsetzen bestätigen'));
  await expect(page.getByText(/^Umgesetzt: /)).toBeVisible();

  const zurueck = knopf(page.locator('main'), 'Zu Heute');
  await expect(zurueck).toHaveCount(1);
  await expect(zurueck).toBeVisible();
  await expect(zurueck).toHaveClass(/hv-btn-primary/);
  await expect(naechste(page)).toHaveCount(0);
  expect(await sperreBeimErscheinen(page)).toEqual({ zuHeute: true });

  await aktiv(zurueck);
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
});

test('UX2-AK5 Keimung und Säen bieten nach dem Speichern dieselbe Weiterführung', async ({ page }) => {
  // Keimung: Satz 80 gespeichert, nächste Aufgabe ist «Keimung prüfen» des zweiten Satzes in derselben Box
  const m = await oeffnen(page, {
    teile: keimTeile({ zweiterSatz: true }),
    jetzt: KEIM_JETZT,
    pfad: `/#/keimung/${KEIM_SATZ}`,
    ueberschrift: 'Keimung prüfen',
    nachrechnen: nachKeimung,
  });
  await tipp(m, knopf(page, 'Ja'));
  await tipp(m, knopf(page, 'Weiter'));
  await sperreBeobachten(page);
  await tipp(m, knopf(page, 'Keimung speichern'));
  await expect(page.getByText(/Gespeichert: /)).toBeVisible();
  const weiter = naechste(page);
  await expect(weiter).toHaveAccessibleName(/^Nächste Aufgabe:\s*Keimung prüfen.* R-A1$/);
  await expect(weiter).toHaveClass(/hv-btn-primary/);
  await expect(knopf(page.locator('main'), 'Zu Heute').last()).toBeVisible();
  expect(await sperreBeimErscheinen(page)).toMatchObject({ naechste: true, zuHeute: true });
  await aktiv(weiter);
  await tipp(m, weiter);
  await expect(page).toHaveURL(new RegExp(`#/keimung/${KEIM_SATZ_2}$`));
  await expect(page.getByRole('heading', { name: 'Keimung prüfen', level: 1 })).toBeVisible();
  // neu eingehängt: Schritt 1 des zweiten Satzes, nicht die Bestätigung des ersten
  await expect(page.getByText(/Gespeichert: /)).toHaveCount(0);
  await expect(knopf(page, 'Keimung speichern')).toHaveCount(0);
});

test('UX2-AK5 Säen bietet nach dem Speichern «Nächste Aufgabe» (erste Aufgabe mit Maske) und «Zu Heute»', async ({
  page,
}) => {
  const m = await oeffnen(page, {
    teile: saatTeile(SAAT_JETZT, { ohneSatzIn23: true }),
    jetzt: SAAT_JETZT,
    pfad: '/#/saeen?box=R-A1',
    ueberschrift: 'Säen',
  });
  await sorteWaehlen(page, 'Salat', 'Eichblatt', (ziel) => tipp(m, ziel));
  await tipp(m, taste(page, 'Weiter'));
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await tipp(m, taste(page, 'Ziel später'));
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await sperreBeobachten(page);
  await tipp(m, taste(page, 'Säen speichern'));
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();

  const weiter = naechste(page);
  await expect(weiter).toHaveAccessibleName(/^Nächste Aufgabe:\s*Gefäss prüfen R-3\.3$/);
  await expect(weiter).toHaveClass(/hv-btn-primary/);
  await expect(knopf(page.locator('main'), 'Zu Heute').last()).toBeVisible();
  expect(await sperreBeimErscheinen(page)).toMatchObject({ naechste: true, zuHeute: true });
  await aktiv(weiter);
  await tipp(m, weiter);
  await expect(page).toHaveURL(/#\/pruefen\/R-3\.3$/);
});

// ---------------------------------------------------------------------------------------------------------------
// UX2-AK6 «Zu Heute» im Kopf von Messen, Pflanze und Rundgang
// ---------------------------------------------------------------------------------------------------------------

test('UX2-AK6 Messen vor dem Speichern mit Banner «Kalibrierung überfällig» hat «Zu Heute» im Kopf; 1 Tipper nach Heute, kein POST, Messmaske ohne Scrollen', async ({
  page,
}) => {
  const t = rundgangTeile();
  // letzte echte Kalibrierung am 1.12.2026: am 12.1. überfällig, Werte unsicher
  for (const k of t['kalibrierung'] ?? []) k['gilt_ab'] = '2026-12-01T08:00:00.000Z';
  const m = await oeffnen(page, {
    teile: t,
    jetzt: RUNDGANG_JETZT,
    pfad: '/#/messen/R-1.1',
    ueberschrift: 'R-1.1',
    nachrechnen: nachRundgang,
  });
  await expect(kachel(page, 'EC')).toBeVisible();
  await expect(page.getByText('Kalibrierung überfällig: Werte unsicher')).toBeVisible();
  const zurueck = zuHeuteKopf(page);
  await expect(zurueck).toHaveCount(1);
  await ohneScrollenTippbar(zurueck);
  await ohneSeitenScrollen(page);

  m.tipper = 0;
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper).toBe(1);
  expect(m.geschrieben).toEqual([]);
  expect(m.storniert).toEqual([]);
});

test('UX2-AK6 Pflanze hat «Zu Heute» im Kopf; 1 Tipper nach Heute, nichts geschrieben', async ({ page }) => {
  const m = await oeffnen(page, {
    teile: buendelTeile(PHASEN_JETZT, { ohneSpaete: true }),
    jetzt: PHASEN_JETZT,
    pfad: `/#/pflanze/${pflanzungVon(61, 1)}`,
    ueberschrift: 'Pflanze',
    nachrechnen: phasenNachrechnen,
  });
  await expect(page.getByText('Lollo Rossa · Kopf · 4.4', { exact: true })).toBeVisible();
  const zurueck = zuHeuteKopf(page);
  await expect(zurueck).toHaveCount(1);
  await ohneScrollenTippbar(zurueck);

  m.tipper = 0;
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper).toBe(1);
  expect(m.geschrieben).toEqual([]);
  expect(m.storniert).toEqual([]);
});

test('UX2-AK6 Rundgang (Kurzprüfung) hat «Zu Heute» im Kopf; 1 Tipper nach Heute, nichts geschrieben, «Rundgang starten» setzt fort', async ({
  page,
}) => {
  const m = await heute(page, rundgangTeile(), RUNDGANG_JETZT, nachRundgang);
  await knopf(page, /^Rundgang starten \(3 Orte\)/).click();
  await expect(kurzpruefung(page, 1)).toBeVisible({ timeout: 10_000 });
  const vorher = m.geschrieben.length;
  const zurueck = zuHeuteKopf(page);
  await expect(zurueck).toHaveCount(1);
  await ohneScrollenTippbar(zurueck);

  m.tipper = 0;
  await tipp(m, zurueck);
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible();
  expect(m.tipper).toBe(1);
  await page.waitForTimeout(300);
  expect(m.geschrieben).toHaveLength(vorher);
  expect(m.storniert).toEqual([]);

  // der Rundgang lässt sich fortsetzen: wieder bei der Kurzprüfung der Ebene 1
  await knopf(page, /^(Rundgang starten|Fortsetzen)/)
    .first()
    .click();
  await expect(kurzpruefung(page, 1)).toBeVisible({ timeout: 10_000 });
});
