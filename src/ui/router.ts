// Hash-Router: Erstaufruf und jeder hashchange werten dieselbe Funktion aus (docs/spec/04_architektur.md Abschnitt 3)
import { useSyncExternalStore } from 'react';
import type { Sitzungszustand } from '../anmeldung/sitzung.ts';

export type Route = { name: 'heute' } | { name: 'info' } | { name: 'anmelden' };

/** Unbekannte oder leere Route → Heute */
export function routeAusHash(hash: string): Route {
  const pfad = hash.replace(/^#/, '').split('?')[0] ?? '';
  switch (pfad) {
    case '/info':
      return { name: 'info' };
    case '/anmelden':
      return { name: 'anmelden' };
    default:
      return { name: 'heute' };
  }
}

export function hashZu(route: Route): string {
  return `#/${route.name}`;
}

/**
 * Welche Maske erscheint? Ohne Sitzung jede Route ausser Info → Anmeldung (Info zeigt keine Daten, Plan 8 A2);
 * mit Sitzung führt die Anmeldung nach Heute.
 */
export function maskeFuer(route: Route, sitzung: Sitzungszustand): Route {
  if (sitzung === 'abgemeldet') return route.name === 'info' ? route : { name: 'anmelden' };
  return route.name === 'anmelden' ? { name: 'heute' } : route;
}

function abonnieren(melden: () => void): () => void {
  window.addEventListener('hashchange', melden);
  return () => window.removeEventListener('hashchange', melden);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(abonnieren, () => window.location.hash);
  return routeAusHash(hash);
}
