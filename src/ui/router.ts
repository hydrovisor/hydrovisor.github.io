// Hash-Router: Erstaufruf und jeder hashchange werten dieselbe Funktion aus (docs/spec/04_architektur.md Abschnitt 3)
import { useSyncExternalStore } from 'react';
import type { Sitzungszustand } from '../anmeldung/sitzung.ts';

export type Route =
  | { name: 'heute' }
  | { name: 'info' }
  | { name: 'anmelden' }
  | { name: 'muster' }
  | { name: 'schreibprobe' }
  | { name: 'push' }
  | { name: 'messen'; code: string }
  | { name: 'gefaess'; code: string }
  | { name: 'anlage'; kuerzel?: string }
  | { name: 'anlage-neu' }
  | { name: 'vorlagen' }
  | { name: 'kalibrieren'; datenart?: 'demo' | 'test' };

/** Unbekannte oder leere Route → Heute */
export function routeAusHash(hash: string): Route {
  const [pfad = '', abfrage = ''] = hash.replace(/^#/, '').split('?');
  const messen = /^\/messen\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (messen?.[1]) return { name: 'messen', code: decodeURIComponent(messen[1]) };
  const gefaess = /^\/gefaess\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (gefaess?.[1]) return { name: 'gefaess', code: decodeURIComponent(gefaess[1]) };
  if (pfad === '/anlage/neu') return { name: 'anlage-neu' };
  if (pfad === '/anlage') {
    const kuerzel = new URLSearchParams(abfrage).get('a');
    return kuerzel && /^[A-Z]{1,3}$/.test(kuerzel) ? { name: 'anlage', kuerzel } : { name: 'anlage' };
  }
  if (pfad === '/kalibrieren') {
    const datenart = new URLSearchParams(abfrage).get('datenart');
    return datenart === 'demo' || datenart === 'test'
      ? { name: 'kalibrieren', datenart }
      : { name: 'kalibrieren' };
  }
  switch (pfad) {
    case '/info':
      return { name: 'info' };
    case '/anmelden':
      return { name: 'anmelden' };
    case '/muster':
      return { name: 'muster' };
    case '/schreibprobe':
      return { name: 'schreibprobe' };
    case '/push':
      return { name: 'push' };
    case '/vorlagen':
      return { name: 'vorlagen' };
    default:
      return { name: 'heute' };
  }
}

export function hashZu(route: Route): string {
  if (route.name === 'messen') return `#/messen/${route.code}`;
  if (route.name === 'gefaess') return `#/gefaess/${route.code}`;
  if (route.name === 'anlage-neu') return '#/anlage/neu';
  if (route.name === 'anlage' && route.kuerzel) return `#/anlage?a=${route.kuerzel}`;
  if (route.name === 'kalibrieren' && route.datenart) return `#/kalibrieren?datenart=${route.datenart}`;
  return `#/${route.name}`;
}

/**
 * Welche Maske erscheint? Ohne Sitzung jede Route ausser Info und Musterseite → Anmeldung (beide zeigen keine Daten,
 * Plan 8 A2, Plan 17 A3);
 * mit Sitzung führt die Anmeldung nach Heute.
 */
export function maskeFuer(route: Route, sitzung: Sitzungszustand): Route {
  if (sitzung === 'abgemeldet')
    return route.name === 'info' || route.name === 'muster' ? route : { name: 'anmelden' };
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
