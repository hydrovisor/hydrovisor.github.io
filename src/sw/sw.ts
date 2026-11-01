/// <reference lib="webworker" />
// Service Worker «Hinweis statt Automatik» (docs/spec/04_architektur.md 7): Precache der App-Shell, keine Laufzeit-Caches
// für API-Aufrufe. Eine neue Version wartet, bis die App sie in Heute ohne laufenden Ablauf übernehmen lässt (SKIP_WAITING).
// Push und Klick folgen mit I0-08.
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

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
