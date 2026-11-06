// Bildschirm wach halten in der Abhakliste und der Messmaske im Ablauf (U7, E-F4-6; Plan 29 A15, Risiko 5).
// Ohne navigator.wakeLock fällt der Hook still zurück. Am Timerende Ton und Vibration, wenn die Maske sichtbar ist.
import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}
interface WakeLockLike {
  request(art: 'screen'): Promise<WakeLockSentinelLike>;
}

/** Wake Lock, solange `aktiv` und die Seite sichtbar ist; mit `bis` nur bis zu diesem Zeitpunkt (Timerende + 2 min) */
export function useWachhalten(aktiv: boolean, bis?: Date): void {
  const bisMs = bis?.getTime();
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
    if (!aktiv || !wl) return;
    let sperre: WakeLockSentinelLike | undefined;
    let beendet = false;
    const freigeben = () => {
      const s = sperre;
      sperre = undefined;
      void s?.release().catch(() => undefined);
    };
    const anfordern = () => {
      if (beendet || document.visibilityState !== 'visible') return;
      if (bisMs !== undefined && Date.now() >= bisMs) return;
      wl.request('screen').then(
        (s) => {
          if (beendet) void s.release().catch(() => undefined);
          else sperre = s;
        },
        () => undefined,
      );
    };
    const beiSichtbar = () => {
      if (document.visibilityState === 'visible') anfordern();
    };
    anfordern();
    document.addEventListener('visibilitychange', beiSichtbar);
    const uhr =
      bisMs === undefined ? undefined : window.setTimeout(freigeben, Math.max(0, bisMs - Date.now()));
    return () => {
      beendet = true;
      document.removeEventListener('visibilitychange', beiSichtbar);
      if (uhr !== undefined) window.clearTimeout(uhr);
      freigeben();
    };
  }, [aktiv, bisMs]);
}

/** kurzer Ton und Vibration am Timerende, nur bei sichtbarer Maske (A15) */
export function timerSignal(): void {
  if (document.visibilityState !== 'visible') return;
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // ohne Vibration
  }
  try {
    const Kontext = window.AudioContext as typeof AudioContext | undefined;
    if (!Kontext) return;
    const ctx = new Kontext();
    const ton = ctx.createOscillator();
    const lautstaerke = ctx.createGain();
    ton.frequency.value = 880;
    lautstaerke.gain.value = 0.2;
    ton.connect(lautstaerke).connect(ctx.destination);
    ton.start();
    ton.stop(ctx.currentTime + 0.4);
    ton.onended = () => void ctx.close();
  } catch {
    // ohne Ton
  }
}
