// Nachgebildete REST-Schnittstelle von Supabase für E2E ohne lokale Datenbank (Plan 18 A7, Plan 20 A7): ist_tim()
// wahr, jede Tabelle oder Sicht liefert die Zeilen aus `teile` (sonst leer). Filter und Seiten werden nicht
// nachgebildet; die Teile sind klein und schon so, wie das Bündel sie erwartet. Ein POST (Upsert aus schreiben())
// gibt die gesendeten Zeilen zurück und meldet sie `beimSchreiben`; andere Schreibzugriffe antworten 201 ohne Inhalt.
import type { Page } from '@playwright/test';

export const REST = 'http://127.0.0.1:54321/rest/v1';

export async function restNachbilden(
  page: Page,
  teile: () => Record<string, unknown[]>,
  beimSchreiben?: (tabelle: string, zeilen: Record<string, unknown>[]) => void,
): Promise<void> {
  await page.route(`${REST}/**`, async (route) => {
    const anfrage = route.request();
    const name = new URL(anfrage.url()).pathname.replace(/^\/rest\/v1\//, '');
    if (name === 'rpc/ist_tim') return route.fulfill({ json: true });
    if (anfrage.method() === 'POST' && beimSchreiben) {
      const roh = anfrage.postDataJSON() as Record<string, unknown> | Record<string, unknown>[];
      const zeilen = Array.isArray(roh) ? roh : [roh];
      beimSchreiben(name, zeilen);
      return route.fulfill({ status: 201, json: zeilen });
    }
    if (anfrage.method() !== 'GET') return route.fulfill({ status: 201, body: '' });
    const zeilen = teile()[name] ?? [];
    return route.fulfill({
      json: zeilen,
      headers: { 'content-range': `0-${Math.max(0, zeilen.length - 1)}/${zeilen.length}` },
    });
  });
}
