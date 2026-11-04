// CORS für die Edge Functions (Plan 13, wie Plan 14 A8): Produktion, Vorschau je Zweig, lokale Entwicklung.
import { BASIS_URL } from '../../../src/adressen.ts';

const URSPRUNG = new URL(BASIS_URL).origin;
const ERLAUBT = [/^https:\/\/([a-z0-9-]+\.)?hydrovisor-vorschau\.pages\.dev$/, /^http:\/\/localhost(:\d+)?$/];

export function corsKopf(ursprung: string | null): Record<string, string> {
  const ok = ursprung !== null && (ursprung === URSPRUNG || ERLAUBT.some((m) => m.test(ursprung)));
  return {
    'access-control-allow-origin': ok ? ursprung : URSPRUNG,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
    vary: 'origin',
  };
}

export function jsonAntwort(status: number, body: unknown, cors: Record<string, string>): Response {
  return new Response(status === 204 || body === null ? null : JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}
