// Thema für die ganze App (W7, UC0-AK6, Plan 18): data-theme auf <html> nach einstellung.thema im Bündel,
// ohne Einstellung «Hell» unabhängig vom Systemmodus. Nur «wie System» folgt prefers-color-scheme.
import { useEffect, useSyncExternalStore } from 'react';
import { themaAttribut, themaAus } from '../domain/einrichtung/thema.ts';
import { useBuendel } from './buendel.tsx';

const ABFRAGE = '(prefers-color-scheme: dark)';

function abonnieren(melden: () => void): () => void {
  const liste = window.matchMedia(ABFRAGE);
  liste.addEventListener('change', melden);
  return () => liste.removeEventListener('change', melden);
}

export function Thema() {
  const { buendel } = useBuendel();
  const systemDunkel = useSyncExternalStore(abonnieren, () => window.matchMedia(ABFRAGE).matches);
  const wert = themaAttribut(themaAus(buendel?.teile), systemDunkel);
  useEffect(() => {
    document.documentElement.dataset['theme'] = wert;
  }, [wert]);
  return null;
}
