/// <reference lib="webworker" />
// Service Worker «Hinweis statt Automatik» (docs/spec/04_architektur.md 7): Precache der App-Shell, keine Laufzeit-Caches
// für API-Aufrufe. Eine neue Version wartet, bis die App sie in Heute ohne laufenden Ablauf übernehmen lässt (SKIP_WAITING).
// Push und Klick seit I0-08 (Plan 13): Benachrichtigung anzeigen und quittieren; Klick öffnet Heute.
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { START_PFAD } from '../adressen.ts';
import { benachrichtigungAus, quittungsAnfrage, type Quittung } from './push.ts';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.addEventListener('message', (ereignis) => {
  if ((ereignis.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
clientsClaim();

// Adresse von Supabase aus dem Build (wie src/daten/supabase.ts); ohne Wert die lokale Adresse
const SUPABASE_URL: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.['VITE_SUPABASE_URL'] ||
  'http://127.0.0.1:54321';

function quittieren(daten: { versand_id: string; signatur: string }, ereignis: Quittung['ereignis']) {
  if (!daten.versand_id || !daten.signatur) return Promise.resolve();
  const { url, init } = quittungsAnfrage(SUPABASE_URL, { ...daten, ereignis });
  return fetch(url, init).then(
    () => undefined,
    () => undefined,
  );
}

self.addEventListener('push', (ereignis) => {
  let nutzlast: unknown;
  try {
    nutzlast = ereignis.data?.json() ?? {};
  } catch {
    nutzlast = { titel: 'Hydrovisor', text: ereignis.data?.text() ?? '' };
  }
  const { titel, optionen } = benachrichtigungAus(nutzlast);
  ereignis.waitUntil(
    Promise.all([
      self.registration.showNotification(titel, optionen),
      quittieren(optionen.data, 'angezeigt'),
    ]),
  );
});

self.addEventListener('notificationclick', (ereignis) => {
  ereignis.notification.close();
  const daten = ereignis.notification.data as { versand_id: string; signatur: string } | undefined;
  ereignis.waitUntil(
    (async () => {
      await (daten ? quittieren(daten, 'geoeffnet') : Promise.resolve());
      const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const offen = fenster.find((f) => new URL(f.url).origin === self.location.origin);
      if (offen) {
        await offen.focus();
        await offen.navigate(new URL(START_PFAD, self.location.origin).href).catch(() => undefined);
      } else {
        await self.clients.openWindow(START_PFAD);
      }
    })(),
  );
});
