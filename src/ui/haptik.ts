// Haptik beim Tippen (U-01, B2; design-system/components/Button.md): in Regal-Masken eine kurze Vibration, wenn ein
// Tipp eine Taste auslöst. Ein Lauscher für die ganze App (click, Erfassungsphase), keine Änderung an den Bausteinen.
// click statt pointerdown (Prüfer #154): Bei Touch zählt erst das Loslassen als Nutzeraktion, die Chrome für
// navigator.vibrate verlangt, und ein Wischen zum Scrollen über eine Taste löst keinen click aus. Die sichtbare
// Rückmeldung beim Drücken liefert :active im Design System. Geräte ohne Vibration und gesperrte Tasten bleiben still.

/** Dauer in ms (A): spürbar, aber kein Summen; Android-Chrome rundet kürzere Werte teils auf 0 */
export const TIPP_MS = 10;

const ZIEL =
  '.hv-btn, button.hv-tile, .hv-choice-item, .hv-loch, .hv-stepper-knopf, .hv-numpad-key, .hv-check-row button';

/** Element, das vibrieren soll, oder null (reine Funktion, für Tests) */
export function tippZiel(start: Element | null): Element | null {
  const ziel = start?.closest(ZIEL) ?? null;
  if (!ziel) return null;
  if (!ziel.closest('[data-density="regal"]')) return null;
  if ((ziel as HTMLButtonElement).disabled || ziel.getAttribute('aria-disabled') === 'true') return null;
  return ziel;
}

/** einmal beim Start aufrufen; gibt eine Funktion zum Entfernen zurück */
export function haptikEinbauen(doc: Document = document): () => void {
  const nav = doc.defaultView?.navigator;
  if (!nav || typeof nav.vibrate !== 'function') return () => undefined;
  const beiTipp = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (!tippZiel(e.target instanceof Element ? e.target : null)) return;
    try {
      nav.vibrate(TIPP_MS);
    } catch {
      // ohne Berechtigung oder ohne Nutzeraktion: still weiter
    }
  };
  doc.addEventListener('click', beiTipp, { capture: true, passive: true });
  return () => doc.removeEventListener('click', beiTipp, { capture: true });
}
