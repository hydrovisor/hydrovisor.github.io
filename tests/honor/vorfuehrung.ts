// Vorführung im Honor-Bildschirm (Issue #120, T-01): Schrittanzeige oben im Bild, roter Kreis an jeder Berührung,
// Pause je Schritt, Bildschirmfotos und Prüfung der Bedienregeln (CLAUDE.md «Oberfläche», Konzept 10). Die Daten
// kommen aus den E2E-Fixtures; die REST-Schnittstelle ist nachgebildet wie in tests/e2e (keine Datenbank, kein Netz).
import { expect, test as basis, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { Teile } from '../fixtures/regal.ts';
import { sichtenNachrechnen, stornoAufnehmen, zeileAufnehmen } from '../fixtures/sichten.ts';
import { authNachbilden, sitzungSpeichern } from '../e2e/hilfen.ts';
import { restNachbilden } from '../e2e/rest.ts';

const SCHNELL = process.env['SIM_SCHNELL'] === '1';
const TEMPO = SCHNELL ? 0 : Number(process.env['SIM_TEMPO'] ?? 900);

export interface Befund {
  art: 'Mangel' | 'Hinweis';
  regel: string;
  text: string;
}

export interface Mitschnitt {
  daten: Teile;
  geschrieben: [string, Record<string, unknown>][];
}

export interface StartOptionen {
  /** Sichten nach jedem Schreiben nachrechnen (Vorgabe: sichtenNachrechnen) */
  nachrechnen?: (t: Teile) => Teile;
  /** vorher gesetzte Fenster-Funktionen, z. B. window.print als Attrappe */
  ohneDruckdialog?: boolean;
}

export interface Sim {
  /** Daten, Uhr und Sitzung vorbereiten und die Adresse öffnen */
  start(teile: Teile, pfad: string, jetzt: Date, o?: StartOptionen): Promise<Mitschnitt>;
  /** Text in der Schrittanzeige, als Schritt im Bericht */
  zeige(text: string): Promise<void>;
  /** Berührung mit rotem Kreis; Text erscheint als «Tippe «…»» */
  tippe(ziel: Locator, text: string): Promise<void>;
  /** Auswahlfeld oder Häkchen setzen (Schreibtisch-Masken) */
  waehle(ziel: Locator, text: string): Promise<void>;
  /** Feld ausfüllen (nur Schreibtisch-Masken; Regal-Masken haben keine Felder) */
  fuelle(ziel: Locator, wert: string, text: string): Promise<void>;
  /** Ziffern über den Ziffernblock der App */
  ziffern(folge: string, text: string): Promise<void>;
  /** Bildschirmfoto ohne Schrittanzeige in den Bericht */
  foto(name: string): Promise<void>;
  /** Bedienregeln prüfen; Mängel lassen den Ablauf rot werden, Hinweise nicht */
  /** druckseite: A4-Seite zum Drucken, Breite nur als Hinweis */
  regeln(maske: string, o?: { ohneScrollen?: boolean; druckseite?: boolean }): Promise<Befund[]>;
  /** Systemschrift annähern: alle Schriftgrössen des Design Systems × faktor (A) */
  schrift(faktor: number): Promise<void>;
  /** Zeit von der Aktion bis zur sichtbaren Erwartung, mit gedrosselter CPU (A: Faktor 4) */
  messeZeit(was: string, aktion: () => Promise<void>, erwartung: Locator, grenzeMs: number): Promise<number>;
}

/** Schrittanzeige und Tippkreis im Seitenkontext; überlebt Neuladen über sessionStorage */
function anzeigeEinbauen(): void {
  const SCHLUESSEL = 'sim-anzeige';
  const bauen = () => {
    if (document.getElementById('sim-anzeige')) return;
    const leiste = document.createElement('div');
    leiste.id = 'sim-anzeige';
    leiste.setAttribute('aria-hidden', 'true');
    Object.assign(leiste.style, {
      position: 'fixed',
      left: '4px',
      right: '4px',
      top: '4px',
      zIndex: '2147483647',
      pointerEvents: 'none',
      background: 'rgba(17, 24, 39, 0.88)',
      color: '#fff',
      font: '600 13px/1.35 system-ui, sans-serif',
      padding: '6px 8px',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
      whiteSpace: 'pre-line',
    });
    leiste.textContent = sessionStorage.getItem(SCHLUESSEL) ?? '';
    leiste.style.display = leiste.textContent ? 'block' : 'none';
    document.documentElement.appendChild(leiste);
  };
  const w = window as unknown as {
    simZeige: (text: string, farbe?: string) => void;
    simTipp: (x: number, y: number) => void;
    simVerbergen: (aus: boolean) => void;
  };
  w.simZeige = (text, farbe) => {
    bauen();
    const leiste = document.getElementById('sim-anzeige');
    if (!leiste) return;
    sessionStorage.setItem(SCHLUESSEL, text);
    leiste.textContent = text;
    leiste.style.display = 'block';
    leiste.style.background = farbe ?? 'rgba(17, 24, 39, 0.88)';
  };
  w.simVerbergen = (aus) => {
    const leiste = document.getElementById('sim-anzeige');
    if (leiste) leiste.style.visibility = aus ? 'hidden' : 'visible';
  };
  w.simTipp = (x, y) => {
    const kreis = document.createElement('div');
    Object.assign(kreis.style, {
      position: 'fixed',
      left: `${x - 22}px`,
      top: `${y - 22}px`,
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: '4px solid #e11d48',
      background: 'rgba(225, 29, 72, 0.25)',
      zIndex: '2147483646',
      pointerEvents: 'none',
      transition: 'opacity 700ms ease-out, transform 700ms ease-out',
    });
    // Rahmen schneidet den Kreis am Bildschirmrand ab, damit er die Seite nicht verbreitert
    let rahmen = document.getElementById('sim-tipp');
    if (!rahmen) {
      rahmen = document.createElement('div');
      rahmen.id = 'sim-tipp';
      Object.assign(rahmen.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: '2147483646',
      });
      document.documentElement.appendChild(rahmen);
    }
    rahmen.appendChild(kreis);
    requestAnimationFrame(() => {
      kreis.style.opacity = '0';
      kreis.style.transform = 'scale(1.6)';
    });
    setTimeout(() => kreis.remove(), 900);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen);
  else bauen();
}

/** Bedienregeln im Seitenkontext (A): Regal 68 dp, Schreibtisch 48 dp, Löcher der Deckelgrafik 48 dp (UC2-AK3) */
function regelnImBrowser(o: { ohneScrollen: boolean; druckseite: boolean }): Befund[] {
  const befunde: Befund[] = [];
  const main = document.querySelector('main');
  const regal = main?.getAttribute('data-density') === 'regal';
  const mindest = regal ? 68 : 48;
  const sichtbar = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const name = (el: Element) =>
    (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
  const hoehe = window.innerHeight;
  const knoepfe = [...document.querySelectorAll('main button, main a.hv-btn, main [role="button"]')].filter(
    sichtbar,
  );
  for (const el of knoepfe) {
    const h = Math.round(el.getBoundingClientRect().height);
    const loch = /^Loch \d/.test(name(el));
    const soll = loch ? 48 : mindest;
    if (h + 0.5 >= soll) continue;
    const haupt = el.classList.contains('hv-btn') && !el.classList.contains('hv-btn-compact');
    befunde.push({
      art: haupt ? 'Mangel' : 'Hinweis',
      regel: `Taste mindestens ${soll} dp`,
      text: `«${name(el) || el.tagName.toLowerCase()}» ist ${h} dp hoch`,
    });
  }
  // Hauptknopf (A): erster sichtbarer Primärknopf in einer Fussleiste (Klasse …-fuss oder …-aktionen), sonst der erste
  const primaer = [...document.querySelectorAll('main .hv-btn-primary')].filter(sichtbar);
  const imFuss = primaer.filter((el) => el.closest('[class*="-fuss"], [class*="-aktionen"], footer'));
  const haupt = imFuss[0] ?? primaer[0];
  if (haupt) {
    const r = haupt.getBoundingClientRect();
    if (r.bottom > hoehe + 0.5)
      befunde.push({
        // Mangel nur in Masken, die ohne Scrollen auskommen müssen (Messmaske); sonst Hinweis (A)
        art: o.ohneScrollen ? 'Mangel' : 'Hinweis',
        regel: 'Hauptknopf ohne Scrollen sichtbar',
        text: `«${name(haupt)}» erst nach Scrollen (unten bei ${Math.round(r.bottom)} von ${hoehe} dp)`,
      });
    else if (regal && r.top + r.height / 2 < hoehe * 0.45)
      befunde.push({
        art: 'Hinweis',
        regel: 'Hauptknopf im Daumenbereich (untere Hälfte)',
        text: `«${name(haupt)}» liegt oben (Mitte bei ${Math.round(r.top + r.height / 2)} von ${hoehe} dp)`,
      });
  }
  const seite = document.scrollingElement ?? document.documentElement;
  // am Handy verbreitert Chrome die Seite, statt waagrecht zu scrollen: Bezug ist die Bildschirmbreite (360 dp).
  // Gemessen wird der rechte Rand des Inhalts von main (ohne die Anzeige der Simulation), nicht die Fensterbreite,
  // die nach einem Übergang breit bleiben kann (A).
  const ueberstehend = [...document.querySelectorAll('main *')].filter(
    (el) => el.getBoundingClientRect().right > screen.width + 1,
  );
  const breite = Math.round(Math.max(0, ...ueberstehend.map((el) => el.getBoundingClientRect().right)));
  if (ueberstehend.length > 0) {
    const zuBreit = ueberstehend
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30))
      .find((t) => t.length > 0);
    befunde.push({
      art: o.druckseite ? 'Hinweis' : 'Mangel',
      regel: 'Seite nicht breiter als der Bildschirm',
      text: `Seite ${breite} statt ${screen.width} dp breit${zuBreit ? ` (zu breit: «${zuBreit}»)` : ''}; Chrome verkleinert die Ansicht`,
    });
  }
  if (o.ohneScrollen && seite.scrollHeight > hoehe + 1)
    befunde.push({
      art: 'Mangel',
      regel: 'Maske ohne Scrollen',
      text: `Seite ${seite.scrollHeight} dp hoch bei ${hoehe} dp Bildschirm`,
    });
  if (regal) {
    const felder = [
      ...document.querySelectorAll(
        'main input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]), main textarea, main select, main [contenteditable="true"]',
      ),
    ].filter(sichtbar);
    if (felder.length > 0)
      befunde.push({
        art: 'Mangel',
        regel: 'keine Systemtastatur in Regal-Masken',
        text: `${felder.length} Eingabefeld(er)`,
      });
  }
  return befunde;
}

function schriftImBrowser(faktor: number): number {
  let gesetzt = 0;
  for (const blatt of [...document.styleSheets]) {
    let regeln: CSSRuleList;
    try {
      regeln = blatt.cssRules;
    } catch {
      continue;
    }
    for (const regel of [...regeln]) {
      if (!(regel instanceof CSSStyleRule) || !regel.selectorText.startsWith(':root')) continue;
      for (const name of [...regel.style]) {
        if (!/^--text-.*-(size|line)$/.test(name)) continue;
        const wert = regel.style.getPropertyValue(name).trim();
        if (!wert.endsWith('px')) continue;
        document.documentElement.style.setProperty(name, `${parseFloat(wert) * faktor}px`);
        gesetzt += 1;
      }
    }
  }
  return gesetzt;
}

async function pause(page: Page, ms = TEMPO): Promise<void> {
  if (ms > 0) await page.waitForTimeout(ms);
}

function simFuer(page: Page, info: TestInfo): Sim {
  const zeige = async (text: string, farbe?: string) => {
    await page.evaluate(
      ([t, f]) => (window as unknown as { simZeige: (a: string, b?: string) => void }).simZeige(t ?? '', f),
      [`${info.title}\n${text}`, farbe] as const,
    );
  };
  const markieren = async (ziel: Locator) => {
    await ziel.scrollIntoViewIfNeeded();
    const box = await ziel.boundingBox();
    if (box)
      await page.evaluate(
        ([x, y]) =>
          (window as unknown as { simTipp: (a: number, b: number) => void }).simTipp(x ?? 0, y ?? 0),
        [box.x + box.width / 2, box.y + box.height / 2] as const,
      );
    await pause(page, TEMPO / 2);
  };
  const foto = async (name: string) => {
    await page.evaluate(() =>
      (window as unknown as { simVerbergen: (a: boolean) => void }).simVerbergen(true),
    );
    await info.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
    await page.evaluate(() =>
      (window as unknown as { simVerbergen: (a: boolean) => void }).simVerbergen(false),
    );
  };
  return {
    async start(teile, pfad, jetzt, o = {}) {
      const nachrechnen = o.nachrechnen ?? sichtenNachrechnen;
      const m: Mitschnitt = { daten: nachrechnen(structuredClone(teile)), geschrieben: [] };
      await page.addInitScript(anzeigeEinbauen);
      if (o.ohneDruckdialog)
        await page.addInitScript(() => {
          window.print = () => undefined;
        });
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
          nachrechnen(m.daten);
        },
        (tabelle, clientId) => {
          stornoAufnehmen(m.daten, tabelle, clientId, jetzt);
          nachrechnen(m.daten);
        },
      );
      await page.clock.setFixedTime(jetzt);
      await page.goto(pfad);
      await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
      return m;
    },
    async zeige(text) {
      await basis.step(text, async () => {
        await zeige(text);
        await pause(page);
      });
    },
    async tippe(ziel, text) {
      await basis.step(`Tippe «${text}»`, async () => {
        await zeige(`Tippe «${text}»`);
        await markieren(ziel);
        try {
          await ziel.click({ timeout: 5_000 });
        } catch {
          // z. B. Seite breiter als der Bildschirm: Tipp über das Element selbst, Hinweis im Bericht
          info.annotations.push({
            type: 'Hinweis · Tippen',
            description: `«${text}» nicht direkt antippbar`,
          });
          await ziel.evaluate((el) => (el as HTMLElement).click());
        }
        await pause(page, TEMPO / 2);
      });
    },
    async waehle(ziel, text) {
      await basis.step(`Wähle «${text}»`, async () => {
        await zeige(`Wähle «${text}»`);
        await markieren(ziel);
        await ziel.check();
        await pause(page, TEMPO / 2);
      });
    },
    async fuelle(ziel, wert, text) {
      await basis.step(`${text}: ${wert}`, async () => {
        await zeige(`${text}: ${wert}`);
        await markieren(ziel);
        await ziel.fill(wert);
        await ziel.blur();
        await pause(page, TEMPO / 2);
      });
    },
    async ziffern(folge, text) {
      await basis.step(`Ziffernblock «${folge}» (${text})`, async () => {
        await zeige(`Ziffernblock: ${folge.split('').join(' ')}  (${text})`);
        for (const zeichen of folge) {
          const taste = page.getByRole('button', {
            name: zeichen === '.' ? 'Punkt' : `Ziffer ${zeichen}`,
            exact: true,
          });
          await markieren(taste);
          await taste.click();
          // Prellfilter des Ziffernblocks: mehr als 80 ms zwischen zwei Tipps
          await page.waitForTimeout(Math.max(120, TEMPO / 4));
        }
        await pause(page, TEMPO / 2);
      });
    },
    foto,
    async regeln(maske, o = {}) {
      return basis.step(`Regeln prüfen: ${maske}`, async () => {
        // Übergänge abwarten (z. B. Einschieben der nächsten Ebene), damit nur der ruhende Zustand zählt
        await page.evaluate(async () => {
          await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
        });
        await page.waitForTimeout(300);
        const befunde = await page.evaluate(regelnImBrowser, {
          ohneScrollen: o.ohneScrollen ?? false,
          druckseite: o.druckseite ?? false,
        });
        const maengel = befunde.filter((b) => b.art === 'Mangel');
        const hinweise = befunde.filter((b) => b.art === 'Hinweis');
        await foto(`${maske} (Regeln)`);
        await info.attach(`${maske}: ${maengel.length} Mängel, ${hinweise.length} Hinweise`, {
          body: JSON.stringify(befunde, null, 2),
          contentType: 'application/json',
        });
        for (const b of befunde)
          info.annotations.push({ type: `${b.art} · ${maske}`, description: `${b.regel}: ${b.text}` });
        const zeilen = befunde.slice(0, 4).map((b) => `${b.art}: ${b.regel} – ${b.text}`);
        await zeige(
          befunde.length === 0
            ? `Regeln ${maske}: alles erfüllt`
            : `Regeln ${maske}: ${maengel.length} Mängel, ${hinweise.length} Hinweise\n${zeilen.join('\n')}`,
          maengel.length > 0
            ? 'rgba(185, 28, 28, 0.92)'
            : hinweise.length > 0
              ? 'rgba(180, 83, 9, 0.92)'
              : 'rgba(21, 128, 61, 0.92)',
        );
        await pause(page, befunde.length > 0 ? TEMPO * 3 : TEMPO);
        expect.soft(maengel, `Mängel in ${maske}`).toEqual([]);
        return befunde;
      });
    },
    async schrift(faktor) {
      await basis.step(`Systemschrift ${Math.round(faktor * 100)} %`, async () => {
        const n = await page.evaluate(schriftImBrowser, faktor);
        expect(n, 'Schriftgrössen im Design System gefunden').toBeGreaterThan(0);
        await zeige(`Systemschrift ${Math.round(faktor * 100)} % (angenähert)`);
        await pause(page);
      });
    },
    async messeZeit(was, aktion, erwartung, grenzeMs) {
      return basis.step(`Zeit messen: ${was}`, async () => {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        const t0 = Date.now();
        await aktion();
        await expect(erwartung).toBeVisible({ timeout: 15_000 });
        const ms = Date.now() - t0;
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        await cdp.detach();
        info.annotations.push({
          type: ms <= grenzeMs ? `Zeit ok · ${was}` : `Hinweis Zeit · ${was}`,
          description: `${ms} ms bei CPU ÷ 4 (Grenze ${grenzeMs} ms, Schätzung)`,
        });
        await zeige(
          `${was}: ${ms} ms bei gedrosselter CPU (Grenze ${grenzeMs} ms)`,
          ms <= grenzeMs ? 'rgba(21, 128, 61, 0.92)' : 'rgba(180, 83, 9, 0.92)',
        );
        await pause(page, TEMPO * 2);
        return ms;
      });
    },
  };
}

export const test = basis.extend<{ sim: Sim }>({
  sim: async ({ page }, nutzen, info) => {
    await nutzen(simFuer(page, info));
  },
});

export { expect };
