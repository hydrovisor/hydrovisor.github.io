// Hash-Router: Erstaufruf und jeder hashchange werten dieselbe Funktion aus (docs/spec/04_architektur.md Abschnitt 3)
import { useSyncExternalStore } from 'react';

export type Route = { name: 'heute' } | { name: 'info' };

/** Unbekannte oder leere Route → Heute */
export function routeAusHash(hash: string): Route {
  const pfad = hash.replace(/^#/, '').split('?')[0] ?? '';
  switch (pfad) {
    case '/info':
      return { name: 'info' };
    default:
      return { name: 'heute' };
  }
}

export function hashZu(route: Route): string {
  return `#/${route.name}`;
}

function abonnieren(melden: () => void): () => void {
  window.addEventListener('hashchange', melden);
  return () => window.removeEventListener('hashchange', melden);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(abonnieren, () => window.location.hash);
  return routeAusHash(hash);
}
