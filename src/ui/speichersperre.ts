// Sperre nach erfolgreichem Schreiben (Issue #219, Plan 219 «Sperre», A15; Issue A3; Plan 207 A21 H2, #215): Eine
// Karte bleibt gesperrt, bis das Bündel die eben geschriebene Zeile zeigt, höchstens bis zur Frist. Lädt das Bündel
// nicht nach, löst sich die Sperre danach; die jüngste Zeile gilt weiter (Ersetzen neu vor Storno, Plan 219 A14).
// Gemeinsam für TuetenfotoKarte und VorratKarte. Die Uhr (Date.now) liest nur der Hook in der Oberfläche.
import { useCallback, useEffect, useState } from 'react';

/** Frist der Sperre nach dem erfolgreichen Schreiben (Issue A3) */
export const SPERRE_FRIST_MS = 10_000;

/** Gesperrt genau dann, wenn eine Zeile erwartet wird, sie noch nicht sichtbar ist und die Frist nicht abgelaufen ist */
export function sperreAktiv(e: {
  erwartetSeitMs?: number;
  sichtbar: boolean;
  jetztMs: number;
  fristMs: number;
}): boolean {
  return e.erwartetSeitMs !== undefined && !e.sichtbar && e.jetztMs - e.erwartetSeitMs < e.fristMs;
}

/**
 * Merkt sich nach dem Schreiben, welche Zeile das Bündel zeigen muss (`erwarten`), und meldet `wartet`, solange
 * `sperreAktiv` gilt. Nach Ablauf der Frist oder sobald die Zeile sichtbar ist, verwirft der Hook den gemerkten Wert.
 */
export function useSpeichersperre<T>(
  istSichtbar: (erwartet: T) => boolean,
  fristMs: number = SPERRE_FRIST_MS,
): { wartet: boolean; erwarten: (erwartet: T) => void } {
  const [gemerkt, setGemerkt] = useState<{ erwartet: T; seitMs: number }>();
  // Uhr als Zustand: gesetzt beim Erwarten und vom Zeitgeber zum Ablauf der Frist (keine Uhr beim Zeichnen)
  const [jetztMs, setJetztMs] = useState(0);
  const sichtbar = gemerkt !== undefined && istSichtbar(gemerkt.erwartet);
  const wartet = sperreAktiv({
    ...(gemerkt ? { erwartetSeitMs: gemerkt.seitMs } : {}),
    sichtbar,
    jetztMs,
    fristMs,
  });

  // Ablauf der Frist: gemerkten Wert verwerfen, die Sperre ist gelöst, auch wenn die Uhr steht oder zurückspringt
  // (Prüfer #219 Runde 1 B1, B2)
  useEffect(() => {
    if (!gemerkt || !wartet) return;
    const ende = gemerkt.seitMs + fristMs;
    const zeitgeber = setTimeout(
      () => {
        setJetztMs(Math.max(Date.now(), ende));
        setGemerkt(undefined);
      },
      Math.max(0, ende - Date.now()),
    );
    return () => clearTimeout(zeitgeber);
  }, [gemerkt, wartet, fristMs]);

  // Zeile sichtbar: gemerkten Wert verwerfen, damit ein späteres Verschwinden der Zeile nicht erneut sperrt (B2)
  useEffect(() => {
    if (!gemerkt || !sichtbar) return;
    const zeitgeber = setTimeout(() => setGemerkt(undefined), 0);
    return () => clearTimeout(zeitgeber);
  }, [gemerkt, sichtbar]);

  const erwarten = useCallback((erwartet: T) => {
    const nun = Date.now();
    setGemerkt({ erwartet, seitMs: nun });
    setJetztMs(nun);
  }, []);
  return { wartet, erwarten };
}
