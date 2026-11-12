// Inbetriebnahme der Anlage R ab leerem Produktionsstand (Issue #166; docs/anleitung/inbetriebnahme.md). Spielt die
// Schritte der Anleitung der Reihe nach über die Knöpfe der Einrichtungs-Checkliste nach. REST nachgebildet: POST und
// PATCH aus schreiben() landen im nachgebildeten Bündel, die Sichten rechnet tests/fixtures/sichten.ts nach, dazu
// v_ec_wasser und v_netztopf_platz hier. Werte aus tests/fixtures/regal.ts (Box abweichend von Konzept 5.3, siehe Issue #166 Befund 2); 360 × 640 aus der
// Konfiguration.
//
// Annahmen (A):
// (A1) «Nach dem Seed» heisst: Messgerät, Einstellungen und Wissen aus W0 mit Arten, Sorten und Packungen sind da
//      (scripts/seed/ladeskript.ts); keine Anlage. Hier stellvertretend das Wissen aus tests/fixtures/saeen.ts. Ohne
//      W0-Dateien lädt der Seed nur die Konstanten (Messgerät, Einstellungen): IB-AK4 (#174).
// (A2) Gefässe: stellvertretend 2.3 (Rako 40 × 30 × 22, D2, P2), Anzuchtbox A1 und Messstelle W; die übrigen zwölf
//      Gefässe und A2 bis A4 erfasst Tim mit demselben Ablauf (gefaess.spec.ts).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { DECKELTYPEN, leeresRegal, type Teile } from '../fixtures/regal.ts';
import { netztopfPlatz, saatWissen } from '../fixtures/saeen.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from './hilfen.ts';
import { restNachbilden } from './rest.ts';

type Zeile = Record<string, unknown>;

const MESSGERAET = {
  id: '23000000-0000-4000-8000-000000000001',
  modell: 'Aquamaster P160 Pro2',
  einheit: 'mS/cm',
  dezimalen: 2,
  u_ec: 0.05,
  u_ph: 0.05,
};

/** Produktionsstand heute: nichts, auch keine Einstellungen und kein Messgerät */
const leer = (): Teile => ({});

/** nach dem Seed (A1): Messgerät, Einstellungen, Wissen mit Sorten und Packungen; keine Anlage */
function nachDemSeed(): Teile {
  const w = saatWissen();
  const wissen = ['einstellung', 'art', 'saatempfehlung', 'sorte', 'v_sollwert', 'saatgut', 'v_keimrate'];
  return { messgeraet: [{ ...MESSGERAET }], ...Object.fromEntries(wissen.map((n) => [n, w[n] ?? []])) };
}

/** scharfer Seed ohne W0-Dateien (#174): nur die Seed-Konstanten Messgerät und Einstellungen, kein Wissen */
function nurKonstanten(): Teile {
  return { messgeraet: [{ ...MESSGERAET }], einstellung: saatWissen()['einstellung'] ?? [] };
}

const offen = (z: Zeile) => z['storniert_am'] === null || z['storniert_am'] === undefined;

/** Sichten wie in der Datenbank: Gefässstatus, Füllzustand, Leitungswasser-EC je Anlage, Netztopf-Platz */
function nachrechnen(t: Teile): Teile {
  sichtenNachrechnen(t);
  const plaetze = (t['platz'] ?? []).filter(offen);
  t['v_ec_wasser'] = (t['anlage'] ?? []).filter(offen).map((a) => {
    const w = new Set(
      plaetze.filter((p) => p['anlage_id'] === a['id'] && p['rolle'] === 'messstelle').map((p) => p['id']),
    );
    const letzte = (t['messung'] ?? [])
      .filter((m) => offen(m) && w.has(m['platz_id']) && typeof m['ec'] === 'number')
      .sort((x, y) => String(y['gilt_ab']).localeCompare(String(x['gilt_ab'])))[0];
    return letzte
      ? { anlage_id: a['id'], ec: letzte['ec'], gemessen_am: letzte['gilt_ab'], herkunft: 'messung' }
      : { anlage_id: a['id'], ec: a['ec_wasser_annahme'] ?? 0.5, gemessen_am: null, herkunft: 'annahme' };
  });
  t['v_netztopf_platz'] = netztopfPlatz(t);
  return t;
}

interface Stand {
  daten: Teile;
  geschrieben: [string, Zeile][];
}

async function oeffnen(page: Page, start: Teile): Promise<Stand> {
  const s: Stand = { daten: nachrechnen(start), geschrieben: [] };
  await sitzungSpeichern(page);
  await authNachbilden(page);
  await restNachbilden(
    page,
    () => s.daten,
    (tabelle, zeilen) => {
      for (const z of zeilen) {
        s.geschrieben.push([tabelle, z]);
        // die Datenbank vergibt eine eigene id (default gen_random_uuid()), wo schreiben() nur client_id sendet
        // (Vorlagen); verschieden von client_id, damit eine Verwechslung in der App auffällt
        zeileAufnehmen(s.daten, tabelle, { ...z, id: z['id'] ?? crypto.randomUUID() }, new Date());
      }
      nachrechnen(s.daten);
    },
    (tabelle, clientId, felder) => {
      // Storno setzt storniert_am; «Als gedruckt bestätigen» setzt gedruckt_am an derselben Zeile
      if ('storniert_am' in felder) stornoAufnehmen(s.daten, tabelle, clientId, new Date());
      else for (const z of s.daten[tabelle] ?? []) if (z['client_id'] === clientId) Object.assign(z, felder);
      nachrechnen(s.daten);
    },
  );
  // window.print öffnet im Test keinen Dialog
  await page.addInitScript(() => {
    window.print = () => undefined;
  });
  return s;
}

const liste = (page: Page) => page.getByRole('list', { name: 'Einrichtung' });
const knopf = (ort: Page | Locator, name: string) =>
  ort
    .getByRole('link', { name, exact: true })
    .or(ort.getByRole('button', { name, exact: true }))
    .first();
const gruppe = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
const taste = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Heute neu laden (das Bündel kommt frisch aus dem REST) und den Stand «n von 9» abwarten */
async function heute(page: Page, erledigt: number): Promise<void> {
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: `Einrichtung · ${erledigt} von 9 erledigt` })).toBeVisible({
    timeout: 15_000,
  });
}

/** tippt Ziffern über den Ziffernblock; zwischen zwei Tipps mehr als die 80 ms des Prellfilters */
async function ziffern(page: Page, folge: string): Promise<void> {
  for (const zeichen of folge) {
    await taste(page, zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`).click();
    await page.waitForTimeout(120);
  }
}

test('IB-AK1 leerer Produktionsstand: Heute zeigt «0 von 9», die Einstellungen verlangen zuerst den Seed', async ({
  page,
}) => {
  await oeffnen(page, leer());
  await page.goto('/#/heute');
  await expect(page.getByRole('heading', { name: 'Einrichtung · 0 von 9 erledigt' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(knopf(liste(page), 'Anlage anlegen')).toBeVisible();
  await page.goto('/#/einstellungen');
  await expect(
    page.getByText(/Die Einstellungen entstehen beim ersten Laden des Wissens \(Seed\)/),
  ).toBeVisible();
});

/** Punkte 1 bis 8 der Checkliste über ihre Knöpfe, wie die Anleitung sie beschreibt; endet mit «8 von 9» */
async function punkte1bis8(page: Page, s: Stand): Promise<void> {
  await heute(page, 0);

  // Punkt 1: Anlage R mit vier Ebenen (Konzept 5.2)
  await knopf(liste(page), 'Anlage anlegen').click();
  await expect(page.getByRole('heading', { name: 'Anlage anlegen', level: 1 })).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Indoor-Regal');
  await page.getByLabel('Kürzel', { exact: true }).fill('R');
  await page
    .getByRole('listbox', { name: 'Anzahl Ebenen' })
    .getByRole('option', { name: '4', exact: true })
    .click();
  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=R$/);
  expect(s.geschrieben.filter(([t]) => t === 'bereich')).toHaveLength(4);
  await heute(page, 1);

  // Punkt 2: Messstift 12 h einweichen (Timer im Gerät)
  await knopf(liste(page), 'Einweichen starten').click();
  await expect(liste(page).getByRole('timer')).toHaveText('12:00:00');
  await page.clock.fastForward('12:00:01');
  await expect(knopf(liste(page), 'Kalibrieren')).toBeVisible();

  // Punkt 3: Kalibrieren mit Gegenprobe 1.41 (Konzept 5.6)
  await knopf(liste(page), 'Kalibrieren').click();
  await expect(page.getByRole('heading', { name: 'Messgerät kalibrieren' })).toBeVisible();
  await ziffern(page, '141');
  await taste(page, 'Speichern').click();
  await expect(page.getByText(/^Kalibriert · gültig bis \d{1,2}\.\d{1,2}\.$/)).toBeVisible();
  await heute(page, 3);

  // Punkt 4: ohne W führt «Messstelle W erfassen» zum Assistenten mit Rolle Messstelle; danach Leitungswasser messen
  await knopf(liste(page), 'Messstelle W erfassen').click();
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible();
  await expect(gruppe(page, 'Rolle').getByRole('radio', { name: 'Messstelle W' })).toBeChecked();
  await knopf(page, 'Weiter').click();
  // U-05 (B16): nach dem Speichern direkt in die Messmaske R-W
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/messen\/R-W$/);
  await page.getByRole('button', { name: /^EC/ }).click();
  await ziffern(page, '0.42');
  await taste(page, 'Speichern').click();
  await expect(page.getByText(/^Gespeichert \d{2}:\d{2}/)).toBeVisible();
  await heute(page, 4);

  // Punkt 5: Vorlagen Box Rako 40 × 30 × 22 und Deckel D2 «3, 3» (Konzept 5.3, 5.4)
  await knopf(liste(page), 'Vorlagen erfassen').click();
  await expect(page.getByRole('heading', { name: 'Vorlagen', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Box erfassen' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Rako 40 × 30 × 22');
  await page.getByRole('radio', { name: 'rechteckig' }).check();
  await page.getByLabel(/^Länge/).fill('365');
  await page.getByLabel(/^Breite/).fill('265');
  await page.getByLabel(/^Höhe/).fill('200');
  await page.getByLabel(/^Betriebsvolumen/).fill('9');
  await taste(page, 'Speichern').click();
  await expect(page.getByText('Rako 40 × 30 × 22').first()).toBeVisible();
  await page.getByRole('button', { name: 'Deckel erfassen' }).click();
  await page.getByLabel('Name', { exact: true }).fill('D2');
  await page.getByRole('radio', { name: '8 cm' }).check();
  await page.getByLabel(/^Löcher je Reihe/).fill((DECKELTYPEN['D2']?.loecher_je_reihe ?? []).join(', '));
  await page.getByRole('group', { name: 'Service-Öffnung' }).getByRole('radio', { name: 'ja' }).check();
  await taste(page, 'Speichern').click();
  await expect(page.getByText('D2', { exact: true }).first()).toBeVisible();
  await heute(page, 5);

  // Punkt 6: Gefäss 2.3 (Ebene 2, Position 3, P2, Rako, D2) und Anzuchtbox A1
  await knopf(liste(page), 'Gefässe erfassen').click();
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible();
  await gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe(page, 'Position').getByRole('radio', { name: '3', exact: true }).check();
  await gruppe(page, 'Luftpumpe').getByRole('radio', { name: 'P2', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Box')
    .getByRole('radio', { name: /^Rako 40 × 30 × 22/ })
    .check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText(/2\.3\.1 bis 2\.3\.6/)).toBeVisible();
  // U-05 (B17): ohne Umweg über die Anlage gleich die Anzuchtbox
  await knopf(page, 'Speichern und nächstes erfassen').click();
  await expect(page.getByText('R-2.3 gespeichert')).toBeVisible();
  await gruppe(page, 'Rolle').getByRole('radio', { name: 'Anzuchtbox' }).check();
  await expect(page.getByText('Kennung A1')).toBeVisible();
  await knopf(page, 'Weiter').click();
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-A1$/);
  await heute(page, 6);

  // Punkt 7: Etiketten für 2.3, A1 und W drucken und als gedruckt bestätigen
  await knopf(liste(page), 'Etiketten drucken').click();
  await expect(page.getByRole('heading', { name: 'Etiketten', level: 1 })).toBeVisible();
  for (const k of ['2\\.3', 'A1', 'W']) {
    const feld = page.getByRole('checkbox', { name: new RegExp(`^${k}(\\s|$)`) });
    if (!(await feld.isChecked())) await feld.check();
  }
  await knopf(page, 'Druckansicht öffnen').click();
  await knopf(page, 'Als gedruckt bestätigen').click();
  await expect
    .poll(() => (s.daten['etikett'] ?? []).filter((e) => offen(e) && e['gedruckt_am']).length)
    .toBe(3);
  await heute(page, 7);

  // Punkt 8: Gefäss 2.3 prüfen, Schritte 1 bis 3
  await knopf(liste(page), 'Gefässe prüfen').click();
  await expect(page).toHaveURL(/#\/pruefen\/R-2\.3$/);
  const block = page.getByRole('group', { name: 'Ziffernblock' });
  for (const name of ['Ziffer 2', 'Punkt', 'Ziffer 3', 'weiter'])
    await block.getByRole('button', { name, exact: true }).click();
  await expect(page.getByText('Richtiges Gefäss: 2.3')).toBeVisible();
  await taste(page, 'Stimmt').click();
  await expect(page.getByText('Netztopf 8 cm sitzt im Loch')).toBeVisible();
  await taste(page, 'Stimmt').click();
  await expect(page.getByText('in Betrieb (Volumen offen)')).toBeVisible();
  await heute(page, 8);
}

test('IB-AK2 nach dem Seed führt die Checkliste Punkt für Punkt durch die Inbetriebnahme, jeder Punkt hakt sich ab', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.clock.install();
  const s = await oeffnen(page, nachDemSeed());
  await punkte1bis8(page, s);

  // Punkt 9: erste Aussaat Lollo Rossa in A1 mit Ziel 2.3, Reihe 1
  await knopf(liste(page), 'Aussaat erfassen').click();
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await page
    .getByRole('button', { name: /^Lollo Rossa/ })
    .first()
    .click();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 2 von 3')).toBeVisible();
  await page
    .getByRole('button', { name: /^2\.3(?![.\d])/ })
    .first()
    .click();
  // eine Sorte: keine Sortenleiste, Reihe 1 (Loch 1, 3, 5) direkt wählen
  await page.getByRole('button', { name: 'Reihe 1 wählen' }).click();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Schritt 3 von 3')).toBeVisible();
  await knopf(page, 'Säen speichern').click();
  await expect(page.getByText(/Gespeichert: 1 Satz/)).toBeVisible();

  // alle neun Punkte erledigt: die Checkliste verschwindet
  await page.goto('/#/heute');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible({ timeout: 15_000 });
  await expect(liste(page)).toHaveCount(0);
});

test('IB-AK4 Seed nur mit Konstanten (ohne W0): Punkte 1 bis 8 gehen durch, die Aussaat wartet auf die Sorten', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.clock.install();
  const s = await oeffnen(page, nurKonstanten());
  await punkte1bis8(page, s);
  await knopf(liste(page), 'Aussaat erfassen').click();
  await expect(page.getByRole('heading', { name: 'Säen', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Lollo Rossa/ })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Noch keine Sorten' })).toBeVisible();
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  // Regal-Maske: auch diese Taste 68 dp (CLAUDE.md, Oberfläche)
  expect((await knopf(page, 'Sorte erfassen').boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(68);
  await knopf(page, 'Sorte erfassen').click();
  await expect(page).toHaveURL(/#\/sorten\/neu$/);
});

test('W185-AK1 «Einweichen überspringen» hakt Punkt 2 sofort ab, auch während der Timer läuft', async ({
  page,
}) => {
  await page.clock.install();
  await oeffnen(page, nachDemSeed());
  await heute(page, 0);
  await knopf(liste(page), 'Anlage anlegen').click();
  await page.getByLabel('Name', { exact: true }).fill('Indoor-Regal');
  await page.getByLabel('Kürzel', { exact: true }).fill('R');
  await page.getByRole('button', { name: 'Anlage speichern' }).click();
  await expect(page).toHaveURL(/#\/anlage\?a=R$/);
  await heute(page, 1);
  // Timer gestartet, dann doch schon eingeweicht (Messstift lag seit gestern im Wasser)
  await knopf(liste(page), 'Einweichen starten').click();
  await expect(liste(page).getByRole('timer')).toHaveText('12:00:00');
  await knopf(liste(page), 'Einweichen überspringen').click();
  await expect(page.getByRole('heading', { name: 'Einrichtung · 2 von 9 erledigt' })).toBeVisible();
  await expect(knopf(liste(page), 'Kalibrieren')).toBeVisible();
  // bleibt nach dem Neuladen abgehakt
  await heute(page, 2);
});

test('W185-AK2 Gefäss ohne Vorlagen: Box und Deckel im Assistenten erfassen, gleich gewählt, dann speichern', async ({
  page,
}) => {
  const start = leeresRegal();
  start['gefaessmodell'] = [];
  start['deckeltyp'] = [];
  const s = await oeffnen(page, start);
  await page.goto('/#/gefaess-neu?a=R');
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe(page, 'Position').getByRole('radio', { name: '3', exact: true }).check();
  await knopf(page, 'Weiter').click();

  // Schritt 2: ohne Vorlage gleich das Box-Formular, nur ein Feld «Betriebsvolumen»
  await expect(page.getByText('Schritt 2 von 4')).toBeVisible();
  const box = page.getByRole('form', { name: 'Box erfassen' });
  await expect(box).toBeVisible();
  await expect(page.getByLabel(/^Betriebsvolumen/)).toHaveCount(1);
  await expect(knopf(page, 'Weiter')).toBeDisabled();
  await box.getByLabel('Name', { exact: true }).fill('Rako 40 × 30 × 17');
  await box.getByRole('radio', { name: 'rechteckig' }).check();
  await box.getByLabel(/^Länge/).fill('365');
  await box.getByLabel(/^Breite/).fill('265');
  await box.getByLabel(/^Höhe/).fill('150');
  await box.getByLabel(/^Betriebsvolumen/).fill('9');
  await taste(page, 'Speichern').click();
  await expect(gruppe(page, 'Box').getByRole('radio', { name: /^Rako 40 × 30 × 17/ })).toBeChecked();
  await expect(page.getByLabel(/^Betriebsvolumen/)).toHaveValue('9');
  await knopf(page, 'Weiter').click();

  // Schritt 3: Deckel D2 im Assistenten
  const deckel = page.getByRole('form', { name: 'Deckel erfassen' });
  await expect(deckel).toBeVisible();
  await deckel.getByLabel('Name', { exact: true }).fill('D2');
  await deckel.getByRole('radio', { name: '8 cm' }).check();
  await deckel.getByLabel(/^Löcher je Reihe/).fill('3, 3');
  await deckel.getByRole('group', { name: 'Service-Öffnung' }).getByRole('radio', { name: 'ja' }).check();
  await taste(page, 'Speichern').click();
  await expect(
    gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D2', exact: true }),
  ).toBeChecked();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText(/2\.3\.1 bis 2\.3\.6/)).toBeVisible();
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.3$/);

  const modell = s.geschrieben.find(([t]) => t === 'gefaessmodell')?.[1];
  const gefaess = s.geschrieben.find(([t]) => t === 'gefaess')?.[1];
  expect(gefaess?.['betriebsvolumen_l']).toBe(9);
  expect(gefaess?.['gefaessmodell_id']).toBe((s.daten['gefaessmodell'] ?? [])[0]?.['id']);
  expect(modell?.['name']).toBe('Rako 40 × 30 × 17');
});

test('W185-AK2 zweiter Deckel im Assistenten behält die gewählte Box: Gefäss 2.2 mit Rako 30 × 20 × 12 und neuem D4', async ({
  page,
}) => {
  // zwei Boxen (Rako 40 × 30 × 22, Rako 30 × 20 × 12) und ohne D4; andere Deckel vorhanden
  const start = leeresRegal();
  start['gefaessmodell'] = (start['gefaessmodell'] ?? []).filter((m) => m['name'] !== 'Leni Flori 36');
  start['deckeltyp'] = (start['deckeltyp'] ?? []).filter((d) => d['name'] !== 'D4');
  const s = await oeffnen(page, start);
  await page.goto('/#/gefaess-neu?a=R');
  await expect(page.getByRole('heading', { name: 'Gefäss erfassen', level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await gruppe(page, 'Bereich').getByRole('radio', { name: 'Ebene 2', exact: true }).check();
  await gruppe(page, 'Position').getByRole('radio', { name: '2', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await gruppe(page, 'Box')
    .getByRole('radio', { name: /^Rako 30 × 20 × 12/ })
    .check();
  await knopf(page, 'Weiter').click();

  await knopf(page, 'Neuen Deckel erfassen').click();
  const deckel = page.getByRole('form', { name: 'Deckel erfassen' });
  await deckel.getByLabel('Name', { exact: true }).fill('D4');
  await deckel.getByRole('radio', { name: '8 cm' }).check();
  await deckel.getByLabel(/^Löcher je Reihe/).fill('1, 1');
  await deckel.getByRole('group', { name: 'Service-Öffnung' }).getByRole('radio', { name: 'ja' }).check();
  await taste(page, 'Speichern').click();
  // mehrere Deckel: den neuen antippen
  await gruppe(page, 'Deckel oder Platte').getByRole('radio', { name: 'D4', exact: true }).check();
  await knopf(page, 'Weiter').click();
  await expect(page.getByText('Rako 30 × 20 × 12', { exact: true })).toBeVisible();
  await knopf(page, 'Speichern').click();
  await expect(page).toHaveURL(/#\/gefaess\/R-2\.2$/);

  const gefaesse = s.geschrieben.filter(([t]) => t === 'gefaess').map(([, z]) => z);
  expect(gefaesse).toHaveLength(1);
  const rako30 = (s.daten['gefaessmodell'] ?? []).find((m) => m['name'] === 'Rako 30 × 20 × 12');
  expect(gefaesse[0]?.['gefaessmodell_id']).toBe(rako30?.['id']);
});
