// Hilfen für die E2E: nachgebildete Auth-Schnittstelle von Supabase und eine gespeicherte Sitzung.
// Der Build ohne VITE_SUPABASE_URL spricht http://127.0.0.1:54321 an (Plan 8, A1); dort antwortet page.route.
import type { Page, Route } from '@playwright/test';

export const AUTH = 'http://127.0.0.1:54321/auth/v1';
const SITZUNG_SCHLUESSEL = 'hydrovisor-sitzung';

const NUTZER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'tim@example.test',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-11-01T00:00:00Z',
};

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

/** Sitzung im Format von supabase-js; `abSekunden` relativ zu jetzt (negativ = abgelaufen) */
export function sitzung(abSekunden = 3600) {
  const exp = Math.floor(Date.now() / 1000) + abSekunden;
  const zugriff = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: NUTZER.id, role: 'authenticated', exp })}.e2e`;
  return {
    access_token: zugriff,
    token_type: 'bearer',
    expires_in: abSekunden,
    expires_at: exp,
    refresh_token: 'e2e-erneuerung',
    user: NUTZER,
  };
}

/** legt vor dem Laden eine Sitzung in den localStorage, als wäre Tim früher angemeldet worden */
export async function sitzungSpeichern(page: Page, abSekunden = 3600): Promise<void> {
  await page.addInitScript(
    ({ schluessel, wert }) => {
      if (!window.localStorage.getItem(schluessel)) window.localStorage.setItem(schluessel, wert);
    },
    { schluessel: SITZUNG_SCHLUESSEL, wert: JSON.stringify(sitzung(abSekunden)) },
  );
}

/** beantwortet die Auth-Schnittstelle; `token` entscheidet über Anmeldung und Erneuerung */
export async function authNachbilden(
  page: Page,
  token: (route: Route, art: string | null) => Promise<void> = (route) => route.fulfill({ json: sitzung() }),
): Promise<void> {
  await page.route(`${AUTH}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/token')) return token(route, url.searchParams.get('grant_type'));
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: NUTZER });
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404, json: { code: 'not_found' } });
  });
}
