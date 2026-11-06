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
  | { name: 'messen'; code: string; zeile?: 3 | 14 | 17; nachmessen?: string }
  | { name: 'ansatz'; code: string }
  | { name: 'gefaess'; code: string }
  | { name: 'gefaess-aendern'; code: string; teil?: 'deckel' }
  | { name: 'gefaess-neu'; kuerzel?: string; rolle?: 'gefaess' | 'anzuchtort' | 'messstelle' }
  | { name: 'pruefen'; code: string; scan?: true }
  | { name: 'etikett'; code: string }
  | { name: 'etiketten'; kuerzel?: string; codes?: string[] }
  | {
      name: 'druck-etiketten';
      kuerzel: string;
      codes: string[];
      start: number;
      versatzX: number;
      versatzY: number;
      test: boolean;
    }
  // Plan 23 (A3): Box ohne von = Scan; von=gefaess aus der Maske Gefäss
  | { name: 'saeen'; box?: string; ziel?: string; von?: 'gefaess' }
  // Plan 24: Keimung prüfen je Satz (04 Abschnitt 3)
  | { name: 'keimung'; satz: string }
  | { name: 'pflanze'; pflanzung: string }
  | { name: 'umsetzen'; satz: string; wie?: 'geplant' }
  | { name: 'verschieben'; topf: string }
  | { name: 'anlage'; kuerzel?: string }
  | { name: 'anlage-neu' }
  | { name: 'vorlagen' }
  | { name: 'einstellungen' }
  // Plan 37: Sorten (Schreibtisch)
  | { name: 'sorten' }
  | { name: 'sorte-neu' }
  | { name: 'sorte'; sorte: string }
  | { name: 'notfallblatt'; kuerzel?: string }
  | { name: 'kalibrieren'; datenart?: 'demo' | 'test' };

const KUERZEL = /^[A-Z]{1,3}$/;
const CODE = /^[A-Z]{1,3}-[A-Za-z0-9.]+$/;
/** Topf-Code: Kürzel der Anlage und Topfkennung, etwa «R-2.3.1» */
const TOPF = /^[A-Z]{1,3}-[0-9]+\.[0-9]+\.[0-9]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Druckversatz in mm: −5.0 bis +5.0, sonst 0 (Plan 22 A6) */
function versatzAus(wert: string | null): number {
  const w = Number(wert ?? '0');
  return Number.isFinite(w) && Math.abs(w) <= 5 ? Math.round(w * 10) / 10 : 0;
}

/** Unbekannte oder leere Route → Heute */
export function routeAusHash(hash: string): Route {
  const [pfad = '', abfrage = ''] = hash.replace(/^#/, '').split('?');
  const etikett = /^\/e\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (etikett?.[1]) return { name: 'etikett', code: decodeURIComponent(etikett[1]) };
  const keimung = /^\/keimung\/([^/]+)$/.exec(pfad);
  if (keimung?.[1]) return UUID.test(keimung[1]) ? { name: 'keimung', satz: keimung[1] } : { name: 'heute' };
  // Plan 35: Pflanzenansicht (Phasen) je Pflanzung
  const pflanze = /^\/pflanze\/([^/]+)$/.exec(pfad);
  if (pflanze?.[1])
    return UUID.test(pflanze[1]) ? { name: 'pflanze', pflanzung: pflanze[1] } : { name: 'heute' };
  // Plan 33: Umsetzen je Satz, Verschieben je Topf (Kürzel und Topfkennung)
  const umsetzen = /^\/umsetzen\/([^/]+)$/.exec(pfad);
  if (umsetzen?.[1]) {
    if (!UUID.test(umsetzen[1])) return { name: 'heute' };
    return new URLSearchParams(abfrage).get('wie') === 'geplant'
      ? { name: 'umsetzen', satz: umsetzen[1], wie: 'geplant' }
      : { name: 'umsetzen', satz: umsetzen[1] };
  }
  const verschieben = /^\/verschieben\/([^/]+)$/.exec(pfad);
  if (verschieben?.[1])
    return TOPF.test(verschieben[1]) ? { name: 'verschieben', topf: verschieben[1] } : { name: 'heute' };
  if (pfad === '/saeen') {
    const p = new URLSearchParams(abfrage);
    const box = p.get('box');
    const ziel = p.get('ziel');
    return {
      name: 'saeen',
      ...(box && CODE.test(box) ? { box } : {}),
      ...(ziel && CODE.test(ziel) ? { ziel } : {}),
      ...(p.get('von') === 'gefaess' ? { von: 'gefaess' as const } : {}),
    };
  }
  if (pfad === '/etiketten') {
    const p = new URLSearchParams(abfrage);
    const kuerzel = p.get('a');
    const codes = p.getAll('code').filter((c) => CODE.test(c));
    return {
      name: 'etiketten',
      ...(kuerzel && KUERZEL.test(kuerzel) ? { kuerzel } : {}),
      ...(codes.length > 0 ? { codes } : {}),
    };
  }
  if (pfad === '/druck/etiketten') {
    const p = new URLSearchParams(abfrage);
    const kuerzel = p.get('a') ?? '';
    const start = Number(p.get('start') ?? '1');
    return {
      name: 'druck-etiketten',
      kuerzel: KUERZEL.test(kuerzel) ? kuerzel : '',
      codes: p.getAll('code').filter((c) => CODE.test(c)),
      start: Number.isInteger(start) && start >= 1 && start <= 21 ? start : 1,
      versatzX: versatzAus(p.get('x')),
      versatzY: versatzAus(p.get('y')),
      test: p.get('test') === '1',
    };
  }
  const messen = /^\/messen\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (messen?.[1]) {
    // Messung im Ablauf (Plan 29): Zeile 3, 14 oder 17 der Abhakliste bzw. Nachmessen einer pH-Korrektur
    const p = new URLSearchParams(abfrage);
    const zeile = Number(p.get('zeile'));
    const nachmessen = p.get('nachmessen');
    return {
      name: 'messen',
      code: decodeURIComponent(messen[1]),
      ...(zeile === 3 || zeile === 14 || zeile === 17 ? { zeile } : {}),
      ...(nachmessen && UUID.test(nachmessen) ? { nachmessen } : {}),
    };
  }
  const ansatz = /^\/ansatz\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (ansatz?.[1]) return { name: 'ansatz', code: decodeURIComponent(ansatz[1]) };
  const aendern = /^\/gefaess\/([A-Za-z0-9.-]+)\/aendern$/.exec(pfad);
  if (aendern?.[1]) {
    const teil = new URLSearchParams(abfrage).get('teil');
    return teil === 'deckel'
      ? { name: 'gefaess-aendern', code: decodeURIComponent(aendern[1]), teil }
      : { name: 'gefaess-aendern', code: decodeURIComponent(aendern[1]) };
  }
  const pruefen = /^\/pruefen\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (pruefen?.[1])
    return new URLSearchParams(abfrage).get('scan') === '1'
      ? { name: 'pruefen', code: decodeURIComponent(pruefen[1]), scan: true }
      : { name: 'pruefen', code: decodeURIComponent(pruefen[1]) };
  if (pfad === '/gefaess-neu') {
    const p = new URLSearchParams(abfrage);
    const kuerzel = p.get('a');
    const rolle = p.get('rolle');
    return {
      name: 'gefaess-neu',
      ...(kuerzel && KUERZEL.test(kuerzel) ? { kuerzel } : {}),
      ...(rolle === 'gefaess' || rolle === 'anzuchtort' || rolle === 'messstelle' ? { rolle } : {}),
    };
  }
  const gefaess = /^\/gefaess\/([A-Za-z0-9.-]+)$/.exec(pfad);
  if (gefaess?.[1]) return { name: 'gefaess', code: decodeURIComponent(gefaess[1]) };
  if (pfad === '/sorten') return { name: 'sorten' };
  if (pfad === '/sorten/neu') return { name: 'sorte-neu' };
  const sorte = /^\/sorten\/([^/]+)$/.exec(pfad);
  if (sorte?.[1]) return UUID.test(sorte[1]) ? { name: 'sorte', sorte: sorte[1] } : { name: 'sorten' };
  if (pfad === '/anlage/neu') return { name: 'anlage-neu' };
  if (pfad === '/anlage') {
    const kuerzel = new URLSearchParams(abfrage).get('a');
    return kuerzel && KUERZEL.test(kuerzel) ? { name: 'anlage', kuerzel } : { name: 'anlage' };
  }
  if (pfad === '/kalibrieren') {
    const datenart = new URLSearchParams(abfrage).get('datenart');
    return datenart === 'demo' || datenart === 'test'
      ? { name: 'kalibrieren', datenart }
      : { name: 'kalibrieren' };
  }
  if (pfad === '/notfallblatt') {
    const kuerzel = new URLSearchParams(abfrage).get('a');
    return kuerzel && KUERZEL.test(kuerzel) ? { name: 'notfallblatt', kuerzel } : { name: 'notfallblatt' };
  }
  switch (pfad) {
    case '/einstellungen':
      return { name: 'einstellungen' };
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

/** wechselt zur Maske (ausserhalb der Komponenten, damit der React-Compiler keine globale Änderung sieht) */
export function oeffnen(route: Route): void {
  window.location.hash = hashZu(route);
}

export function hashZu(route: Route): string {
  if (route.name === 'messen') {
    if (route.zeile) return `#/messen/${route.code}?zeile=${String(route.zeile)}`;
    if (route.nachmessen) return `#/messen/${route.code}?nachmessen=${route.nachmessen}`;
    return `#/messen/${route.code}`;
  }
  if (route.name === 'ansatz') return `#/ansatz/${route.code}`;
  if (route.name === 'gefaess') return `#/gefaess/${route.code}`;
  if (route.name === 'gefaess-aendern')
    return `#/gefaess/${route.code}/aendern${route.teil ? `?teil=${route.teil}` : ''}`;
  if (route.name === 'pruefen') return `#/pruefen/${route.code}${route.scan ? '?scan=1' : ''}`;
  if (route.name === 'etikett') return `#/e/${route.code}`;
  if (route.name === 'sorten') return '#/sorten';
  if (route.name === 'sorte-neu') return '#/sorten/neu';
  if (route.name === 'sorte') return `#/sorten/${route.sorte}`;
  if (route.name === 'keimung') return `#/keimung/${route.satz}`;
  if (route.name === 'pflanze') return `#/pflanze/${route.pflanzung}`;
  if (route.name === 'umsetzen') return `#/umsetzen/${route.satz}${route.wie ? `?wie=${route.wie}` : ''}`;
  if (route.name === 'verschieben') return `#/verschieben/${route.topf}`;
  if (route.name === 'saeen') {
    const teile = [
      route.box ? `box=${route.box}` : '',
      route.ziel ? `ziel=${route.ziel}` : '',
      route.von ? `von=${route.von}` : '',
    ].filter(Boolean);
    return teile.length > 0 ? `#/saeen?${teile.join('&')}` : '#/saeen';
  }
  if (route.name === 'etiketten') {
    const p = new URLSearchParams();
    if (route.kuerzel) p.set('a', route.kuerzel);
    for (const c of route.codes ?? []) p.append('code', c);
    const q = p.toString();
    return `#/etiketten${q ? `?${q}` : ''}`;
  }
  if (route.name === 'druck-etiketten') {
    const p = new URLSearchParams();
    p.set('a', route.kuerzel);
    for (const c of route.codes) p.append('code', c);
    p.set('start', String(route.start));
    p.set('x', String(route.versatzX));
    p.set('y', String(route.versatzY));
    if (route.test) p.set('test', '1');
    return `#/druck/etiketten?${p.toString()}`;
  }
  if (route.name === 'gefaess-neu') {
    const p = new URLSearchParams();
    if (route.kuerzel) p.set('a', route.kuerzel);
    if (route.rolle) p.set('rolle', route.rolle);
    const q = p.toString();
    return `#/gefaess-neu${q ? `?${q}` : ''}`;
  }
  if (route.name === 'anlage-neu') return '#/anlage/neu';
  if (route.name === 'notfallblatt' && route.kuerzel) return `#/notfallblatt?a=${route.kuerzel}`;
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

/**
 * Fortsetzen (Plan 29 A18): #/e/<code> und #/ansatz/<code> mit offenem Wechsel an diesem Platz führen zur Abhakliste,
 * vor der offenen Prüfung; sonst bleibt die Route.
 */
export function fortsetzenZiel(route: Route, offeneWechsel: readonly string[]): Route {
  if ((route.name === 'etikett' || route.name === 'ansatz') && offeneWechsel.includes(route.code))
    return { name: 'ansatz', code: route.code };
  return route;
}

function abonnieren(melden: () => void): () => void {
  window.addEventListener('hashchange', melden);
  return () => window.removeEventListener('hashchange', melden);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(abonnieren, () => window.location.hash);
  return routeAusHash(hash);
}
