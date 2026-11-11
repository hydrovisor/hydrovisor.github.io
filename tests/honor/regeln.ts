// Bedienregeln der Honor-Simulation (Issue #120, T-01) als reine Funktionen für page.evaluate(): ohne Importe und
// ohne Zugriff auf äussere Namen, weil Playwright nur den Funktionstext in die Seite schickt. Belegt durch
// tests/e2e/honor-regeln.spec.ts (SIM-AK1 bis SIM-AK3); genutzt von tests/honor/vorfuehrung.ts.

export interface Befund {
  art: 'Mangel' | 'Hinweis';
  regel: string;
  text: string;
}

/** Bedienregeln im Seitenkontext (A): Regal 68 dp, Schreibtisch 48 dp, Löcher der Deckelgrafik 48 dp (UC2-AK3) */
export function regelnImBrowser(o: {
  ohneScrollen: boolean;
  druckseite: boolean;
  vorprobe?: boolean;
}): Befund[] {
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
    // CLAUDE.md «Oberfläche»: jede Taste einer Regal-Maske 68 dp, also Mangel; am Schreibtisch unter 48 dp ebenso,
    // ausser der Variante «compact» des Design Systems (40 dp, in Listen und Fussleisten), die dort ab 40 dp nur ein
    // Hinweis ist (A)
    const kompakt = el.classList.contains('hv-btn-compact');
    befunde.push({
      // compact laut Design System nie unter 40 dp (size-touch-compact)
      art: !regal && kompakt && h + 0.5 >= 40 ? 'Hinweis' : 'Mangel',
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
  // U-02 (Issue #156): Text passt in die Taste, Tasten überlappen nicht, Abstand 8 dp in Regal-Masken (Konzept 6.3);
  // Löcher der Deckelgrafik zählen nicht (eigenes Raster)
  const tasten = knoepfe.filter((el) => !/^Loch \d/.test(name(el)));
  for (const el of tasten) {
    const h = el as HTMLElement;
    if (h.scrollWidth > h.clientWidth + 1)
      befunde.push({
        art: 'Mangel',
        regel: 'Text passt in die Taste',
        text: `«${name(el)}» braucht ${h.scrollWidth} dp, hat ${h.clientWidth} dp`,
      });
  }
  for (let i = 0; i < tasten.length; i += 1) {
    for (let j = i + 1; j < tasten.length; j += 1) {
      const a = tasten[i];
      const b = tasten[j];
      if (!a || !b || a.contains(b) || b.contains(a)) continue;
      const r = a.getBoundingClientRect();
      const q = b.getBoundingClientRect();
      const ueberX = Math.min(r.right, q.right) - Math.max(r.left, q.left);
      const ueberY = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (ueberX > 1 && ueberY > 1) {
        // unter einer haftenden oder festen Leiste scrollt Inhalt bewusst durch: nur ein Hinweis (A)
        const haftet = (e: Element) =>
          [
            ...(function* (x: Element | null) {
              for (let y = x; y; y = y.parentElement) yield y;
            })(e),
          ].some((y) => ['sticky', 'fixed'].includes(getComputedStyle(y).position));
        befunde.push({
          art: haftet(a) || haftet(b) ? 'Hinweis' : 'Mangel',
          regel: 'Tasten überlappen nicht',
          text: `«${name(a)}» und «${name(b)}»`,
        });
        continue;
      }
      if (!regal) continue;
      // nebeneinander (gemeinsame Höhe) oder übereinander (gemeinsame Breite): Lücke dazwischen
      const luecke =
        ueberY > 1
          ? Math.max(q.left - r.right, r.left - q.right)
          : ueberX > 1
            ? Math.max(q.top - r.bottom, r.top - q.bottom)
            : Infinity;
      if (luecke >= 0 && luecke < 7.5)
        befunde.push({
          art: 'Hinweis',
          regel: 'Abstand zwischen Tasten mindestens 8 dp',
          text: `«${name(a)}» und «${name(b)}»: ${Math.round(luecke)} dp`,
        });
    }
  }
  const seite = document.scrollingElement ?? document.documentElement;
  // am Handy verbreitert Chrome die Seite, statt waagrecht zu scrollen: Bezug ist die Bildschirmbreite (360 dp).
  // Gemessen wird der rechte Rand des Inhalts von main (ohne die Anzeige der Simulation), nicht die Fensterbreite,
  // die nach einem Übergang breit bleiben kann (A). Bildschirm: am Handy screen.width (das Fenster kann breiter sein),
  // am Desktop die Fensterbreite (screen.width ist dort der Monitor).
  const bildschirm = Math.min(screen.width, window.innerWidth);
  const ueberstehend = [...document.querySelectorAll('main *')].filter(
    (el) => el.getBoundingClientRect().right > bildschirm + 1,
  );
  const breite = Math.round(Math.max(0, ...ueberstehend.map((el) => el.getBoundingClientRect().right)));
  if (ueberstehend.length > 0) {
    const zuBreit = ueberstehend
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30))
      .find((t) => t.length > 0);
    befunde.push({
      art: o.druckseite ? 'Hinweis' : 'Mangel',
      regel: 'Seite nicht breiter als der Bildschirm',
      text: `Seite ${breite} statt ${bildschirm} dp breit${zuBreit ? ` (zu breit: «${zuBreit}»)` : ''}; Chrome verkleinert die Ansicht`,
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
  // Vorprobe (z. B. strenger als das Gerät verlangt): alles nur als Hinweis
  if (o.vorprobe) return befunde.map((b) => ({ ...b, art: 'Hinweis' as const }));
  return befunde;
}

export function schriftImBrowser(faktor: number): number {
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

/**
 * Geschätzte Bediendauer nach dem Keystroke-Level-Modell (Card, Moran, Newell; U-02, A): je Berührung 0.6 s für Zielen
 * und Tippen am Touchscreen, je neue Maske eine Denkpause von 1.35 s. Ergebnis in Sekunden, auf 0.01 gerundet.
 */
export function bediendauer(beruehrungen: number, masken: number): number {
  return Math.round((beruehrungen * 0.6 + masken * 1.35) * 100) / 100;
}
