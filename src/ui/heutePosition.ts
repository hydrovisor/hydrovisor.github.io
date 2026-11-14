// Scrollposition von Heute (UX1, Plan 223): Heute merkt sich, wo Tim stand, und steht nach der Rückkehr aus einer
// Maske wieder dort. Gilt für die Sitzung im Speicher der App; nach dem Neuladen beginnt Heute oben (A6).
import { useLayoutEffect } from 'react';

/** so lange folgt das Wiederherstellen Inhalten, die nachladen und die Seite verschieben (Abläufe, Push-Stand) */
const NACHFUEHREN_MS = 1500;
const BERUEHRUNG = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const;

let gemerkt = 0;
let einrichtungOffen = false;

/** eine in dieser Sitzung geöffnete Einrichtung bleibt offen (A4) */
export const einrichtungOffenGemerkt = () => einrichtungOffen;
export function einrichtungOffenMerken(offen: boolean): void {
  einrichtungOffen = offen;
}

/** stellt die gemerkte Position her, sobald der Inhalt steht (`bereit`), und merkt danach jede neue */
export function useHeutePosition(bereit: boolean): void {
  useLayoutEffect(() => {
    if (!bereit) return undefined;
    const ziel = gemerkt;
    // solange wiederhergestellt wird, zählt ein Scroll-Ereignis nicht: eine noch zu kurze Seite klemmt die Position
    let stellt = ziel > 0;
    const setzen = () => {
      if (stellt) window.scrollTo(0, ziel);
    };
    const beobachter =
      stellt && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setzen) : undefined;
    const fertig = () => {
      stellt = false;
      beobachter?.disconnect();
    };
    setzen();
    beobachter?.observe(document.body);
    const frist = window.setTimeout(fertig, NACHFUEHREN_MS);
    for (const art of BERUEHRUNG) window.addEventListener(art, fertig, { passive: true, capture: true });
    const merken = () => {
      if (!stellt) gemerkt = window.scrollY;
    };
    window.addEventListener('scroll', merken, { passive: true });
    return () => {
      window.clearTimeout(frist);
      fertig();
      for (const art of BERUEHRUNG) window.removeEventListener(art, fertig, { capture: true });
      window.removeEventListener('scroll', merken);
    };
  }, [bereit]);
}
