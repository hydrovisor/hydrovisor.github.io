// Playwright-Fixture für E2E gegen die lokale Datenbank (Plan 11 Testliste, D4, A12): lokales Testkonto ohne
// Personendaten, Eintrag in zugang, echte Sitzung im localStorage, Zählabfragen über DB_URL.
// Nur für 127.0.0.1 oder localhost; fehlt die lokale Datenbank, scheitert der Test sichtbar, er wird nie übersprungen.
import { execSync } from 'node:child_process';
import { test as basis, type Page } from '@playwright/test';
import postgres from 'postgres';

export const E2E_EMAIL = 'e2e@example.test';
// fester, offensichtlicher Testwert der lokalen Datenbank, kein echtes Passwort
const E2E_PASSWORT = 'e2e-nur-lokal-kein-geheimnis';
const SITZUNG_SCHLUESSEL = 'hydrovisor-sitzung';
const LOKALE_HOSTS = new Set(['127.0.0.1', 'localhost']);

interface Status {
  API_URL: string;
  DB_URL: string;
  PUBLISHABLE_KEY: string;
  SERVICE_ROLE_KEY: string;
}

export interface Konto {
  apiUrl: string;
  nutzerId: string;
  /** legt eine frische Sitzung des Testkontos vor dem Laden in den localStorage */
  anmelden(page: Page): Promise<void>;
  /** Anzahl Zeilen in messung mit dieser client_id */
  messungen(clientId: string): Promise<number>;
  /** ph der Zeile in messung mit dieser client_id (als Text, numeric(4,2)) */
  phVon(clientId: string): Promise<string | undefined>;
  /** Anzahl Zeilen in messgeraet */
  messgeraete(): Promise<number>;
}

function statusLesen(): Status {
  let ausgabe: string;
  try {
    ausgabe = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    ausgabe = execSync('npx --yes supabase@3.0.0 status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const werte: Record<string, string> = {};
  for (const zeile of ausgabe.split(/\r?\n/)) {
    const treffer = /^([A-Z_]+)=(.*)$/.exec(zeile.trim());
    const [, schluessel, wert] = treffer ?? [];
    if (schluessel && wert !== undefined) werte[schluessel] = wert.replace(/^"|"$/g, '');
  }
  const publishable = werte['PUBLISHABLE_KEY'] ?? werte['ANON_KEY'];
  const service = werte['SERVICE_ROLE_KEY'] ?? werte['SECRET_KEY'];
  const apiUrl = werte['API_URL'];
  const dbUrl = werte['DB_URL'];
  if (!apiUrl || !dbUrl || !publishable || !service)
    throw new Error(
      'Lokale Datenbank nicht gefunden: zuerst supabase start (supabase status -o env ohne Werte)',
    );
  for (const adresse of [apiUrl, dbUrl]) {
    const host = new URL(adresse).hostname;
    if (!LOKALE_HOSTS.has(host)) throw new Error(`E2E nur gegen die lokale Datenbank, nicht gegen ${host}`);
  }
  return { API_URL: apiUrl, DB_URL: dbUrl, PUBLISHABLE_KEY: publishable, SERVICE_ROLE_KEY: service };
}

async function sitzungHolen(status: Status): Promise<Record<string, unknown> & { user: { id: string } }> {
  const antwort = await fetch(`${status.API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: status.PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASSWORT }),
  });
  if (!antwort.ok)
    throw new Error(`Anmeldung des Testkontos gescheitert: ${antwort.status} ${await antwort.text()}`);
  return (await antwort.json()) as Record<string, unknown> & { user: { id: string } };
}

async function kontoEinrichten(status: Status): Promise<string> {
  const dienst = {
    apikey: status.SERVICE_ROLE_KEY,
    authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
  };
  // Konto anlegen, falls es fehlt (422 email_exists ist in Ordnung)
  const anlegen = await fetch(`${status.API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: dienst,
    body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASSWORT, email_confirm: true }),
  });
  if (!anlegen.ok && anlegen.status !== 422)
    throw new Error(`Testkonto nicht angelegt: ${anlegen.status} ${await anlegen.text()}`);

  const { user } = await sitzungHolen(status);
  const zugang = await fetch(`${status.API_URL}/rest/v1/zugang?on_conflict=user_id`, {
    method: 'POST',
    headers: { ...dienst, prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: user.id }),
  });
  if (!zugang.ok) throw new Error(`Zugang nicht eingetragen: ${zugang.status} ${await zugang.text()}`);
  return user.id;
}

export const test = basis.extend<{ konto: Konto }, { kontoWorker: { status: Status; nutzerId: string } }>({
  kontoWorker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, verwenden) => {
      const status = statusLesen();
      const nutzerId = await kontoEinrichten(status);
      await verwenden({ status, nutzerId });
    },
    { scope: 'worker' },
  ],
  konto: async ({ kontoWorker }, verwenden) => {
    const { status, nutzerId } = kontoWorker;
    const sql = postgres(status.DB_URL, { max: 1, onnotice: () => undefined });
    try {
      await verwenden({
        apiUrl: status.API_URL,
        nutzerId,
        async anmelden(page) {
          const sitzung = await sitzungHolen(status);
          await page.addInitScript(
            ({ schluessel, wert }) => {
              if (!window.localStorage.getItem(schluessel)) window.localStorage.setItem(schluessel, wert);
            },
            { schluessel: SITZUNG_SCHLUESSEL, wert: JSON.stringify(sitzung) },
          );
        },
        async messungen(clientId) {
          const [zeile] = await sql<{ anzahl: number }[]>`
            select count(*)::int as anzahl from public.messung where client_id = ${clientId}::uuid`;
          return zeile?.anzahl ?? 0;
        },
        async phVon(clientId) {
          const [zeile] = await sql<{ ph: string | null }[]>`
            select ph::text as ph from public.messung where client_id = ${clientId}::uuid`;
          return zeile?.ph ?? undefined;
        },
        async messgeraete() {
          const [zeile] = await sql<
            { anzahl: number }[]
          >`select count(*)::int as anzahl from public.messgeraet`;
          return zeile?.anzahl ?? 0;
        },
      });
    } finally {
      await sql.end();
    }
  },
});

export { expect } from '@playwright/test';
