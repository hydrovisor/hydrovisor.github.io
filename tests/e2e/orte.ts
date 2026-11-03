// Playwright-Fixture «Testanlage Y» für die E2E der Messmaske (Plan 12 Testliste; A16 mit Entscheid des Lead:
// lokale Datenbank statt hydrovisor-dev). Baut auf tests/e2e/konto.ts auf, ohne die Datei zu ändern.
// Legt fehlende Orte idempotent mit dem Service-Schlüssel an, nur für 127.0.0.1 oder localhost (prüft konto.ts),
// Datenart test, ohne Personendaten: Y-2.3 DWC, Y-3.1 Kratky belüftet, Y-W Messstelle.
// Fehlt die lokale Datenbank oder das Messgerät aus dem Seed, scheitert der Test sichtbar, er wird nie übersprungen.
import postgres from 'postgres';
import { test as mitKonto } from './konto.ts';

export const ORTE = ['Y-2.3', 'Y-3.1', 'Y-W'] as const;
export type Ortcode = (typeof ORTE)[number];
type Datenart = 'echt' | 'demo' | 'test';

const APP_VERSION = 'e2e-fixture';
const LOKALE_HOSTS = new Set(['127.0.0.1', 'localhost']);

export interface Messzeile {
  ph: number | null;
  ec: number | null;
  temperatur: number | null;
  fuellstand: string | null;
  messart: string;
  datenart: string | null;
  platz_id: string | null;
  gilt_ab: Date;
  storniert_am: Date | null;
  storno_grund: string | null;
}

export interface Orte {
  anlageId: string;
  platz: Record<Ortcode, string>;
  /** storniert alle offenen Kalibrierungen dieser Datenart in der lokalen Datenbank (Grund korrektur) */
  kalibrierungenZuruecksetzen(datenart: Datenart): Promise<void>;
  /** offene Kalibrierungen dieser Datenart */
  kalibrierungen(datenart: Datenart): Promise<{ gegenprobe_ec: number | null; nach_reinigung: boolean }[]>;
  /** Anzahl Zeilen in messung mit dieser client_id */
  messungen(clientId: string): Promise<number>;
  /** Zeile in messung mit dieser client_id */
  messung(clientId: string): Promise<Messzeile | undefined>;
}

interface Kalibrierzeile {
  gegenprobe_ec: string | null;
  nach_reinigung: boolean;
}

interface Status {
  API_URL: string;
  DB_URL: string;
  SERVICE_ROLE_KEY: string;
}

function lokal(status: Status): void {
  for (const adresse of [status.API_URL, status.DB_URL]) {
    const host = new URL(adresse).hostname;
    if (!LOKALE_HOSTS.has(host))
      throw new Error(`Fixture Orte nur gegen die lokale Datenbank, nicht gegen ${host}`);
  }
}

function dienstKopf(status: Status): Record<string, string> {
  return {
    apikey: status.SERVICE_ROLE_KEY,
    authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
  };
}

/** id der ersten Zeile mit dem Filter oder eine neu angelegte Zeile (idempotent) */
async function einmal(
  status: Status,
  tabelle: string,
  filter: Record<string, string>,
  zeile: Record<string, unknown>,
): Promise<string> {
  const abfrage = new URLSearchParams({ select: 'id', ...filter, limit: '1' });
  const vorhanden = await fetch(`${status.API_URL}/rest/v1/${tabelle}?${abfrage.toString()}`, {
    headers: dienstKopf(status),
  });
  if (!vorhanden.ok)
    throw new Error(`${tabelle} nicht gelesen: ${vorhanden.status} ${await vorhanden.text()}`);
  const [erste] = (await vorhanden.json()) as { id: string }[];
  if (erste) return erste.id;
  const anlegen = await fetch(`${status.API_URL}/rest/v1/${tabelle}`, {
    method: 'POST',
    headers: { ...dienstKopf(status), prefer: 'return=representation' },
    body: JSON.stringify({ app_version: APP_VERSION, ...zeile }),
  });
  if (!anlegen.ok) throw new Error(`${tabelle} nicht angelegt: ${anlegen.status} ${await anlegen.text()}`);
  const [neu] = (await anlegen.json()) as { id: string }[];
  if (!neu) throw new Error(`${tabelle} angelegt, aber ohne Antwortzeile`);
  return neu.id;
}

async function testanlageEinrichten(
  status: Status,
): Promise<{ anlageId: string; platz: Record<Ortcode, string> }> {
  lokal(status);
  // eine bestehende Anlage Y muss eine Testanlage sein; sonst nichts anfassen
  const pruefen = await fetch(
    `${status.API_URL}/rest/v1/anlage?select=id,datenart&kuerzel=eq.Y&storniert_am=is.null`,
    { headers: dienstKopf(status) },
  );
  if (!pruefen.ok) throw new Error(`anlage nicht gelesen: ${pruefen.status} ${await pruefen.text()}`);
  const bestehend = (await pruefen.json()) as { id: string; datenart: string }[];
  if (bestehend.some((a) => a.datenart !== 'test'))
    throw new Error('Anlage Y besteht mit einer anderen Datenart als test; die Fixture ändert sie nicht');

  const anlageId = await einmal(
    status,
    'anlage',
    { kuerzel: 'eq.Y', storniert_am: 'is.null' },
    { name: 'Testanlage Y', kuerzel: 'Y', datenart: 'test' },
  );
  const modellId = await einmal(
    status,
    'gefaessmodell',
    { name: 'eq.E2E Box Y', storniert_am: 'is.null' },
    {
      name: 'E2E Box Y',
      form: 'rechteckig',
      innen_l_mm: 400,
      innen_b_mm: 300,
      innen_h_mm: 200,
      betriebsvolumen_l: 15,
    },
  );
  const deckelId = await einmal(
    status,
    'deckeltyp',
    { name: 'eq.E2E Deckel Y', storniert_am: 'is.null' },
    { name: 'E2E Deckel Y', topfdurchmesser_mm: 50, loecher_je_reihe: [3, 3] },
  );
  const platzAnlegen = (kennung: string, rolle: 'gefaess' | 'messstelle') =>
    einmal(
      status,
      'platz',
      { anlage_id: `eq.${anlageId}`, kennung: `eq.${kennung}`, aktiv: 'is.true', storniert_am: 'is.null' },
      { anlage_id: anlageId, kennung, rolle },
    );
  const platz: Record<Ortcode, string> = {
    'Y-2.3': await platzAnlegen('2.3', 'gefaess'),
    'Y-3.1': await platzAnlegen('3.1', 'gefaess'),
    'Y-W': await platzAnlegen('W', 'messstelle'),
  };
  const belegen = (platzId: string, zeile: Record<string, unknown>) =>
    einmal(
      status,
      'gefaess',
      { platz_id: `eq.${platzId}`, gueltig_bis: 'is.null', storniert_am: 'is.null' },
      {
        platz_id: platzId,
        gefaessmodell_id: modellId,
        deckeltyp_id: deckelId,
        betriebsvolumen_l: 15,
        ...zeile,
      },
    );
  await belegen(platz['Y-2.3'], { betriebsart: 'dwc', intervall_messen_d: 2, intervall_wechseln_d: 14 });
  await belegen(platz['Y-3.1'], { betriebsart: 'kratky_belueftet', intervall_messen_d: 7 });
  return { anlageId, platz };
}

export const test = mitKonto.extend<
  { orte: Orte },
  { orteWorker: { anlageId: string; platz: Record<Ortcode, string> } }
>({
  orteWorker: [
    async ({ kontoWorker }, verwenden) => {
      await verwenden(await testanlageEinrichten(kontoWorker.status));
    },
    { scope: 'worker' },
  ],
  orte: async ({ kontoWorker, orteWorker }, verwenden) => {
    const { status } = kontoWorker;
    lokal(status);
    const sql = postgres(status.DB_URL, { max: 1, onnotice: () => undefined });
    try {
      const [geraet] = await sql<{ anzahl: number }[]>`select count(*)::int as anzahl from public.messgeraet`;
      if (!geraet?.anzahl)
        throw new Error('Kein Messgerät in der lokalen Datenbank: zuerst npm run seed -- --ziel lokal');
      await verwenden({
        anlageId: orteWorker.anlageId,
        platz: orteWorker.platz,
        async kalibrierungenZuruecksetzen(datenart) {
          await sql`
            update public.kalibrierung set storniert_am = now(), storno_grund = 'korrektur'
             where datenart = ${datenart}::public.datenart and storniert_am is null`;
        },
        async kalibrierungen(datenart) {
          const zeilen = await sql<Kalibrierzeile[]>`
            select gegenprobe_ec::text as gegenprobe_ec, nach_reinigung from public.kalibrierung
             where datenart = ${datenart}::public.datenart and storniert_am is null`;
          return zeilen.map((z: Kalibrierzeile) => ({
            gegenprobe_ec: z.gegenprobe_ec === null ? null : Number(z.gegenprobe_ec),
            nach_reinigung: z.nach_reinigung,
          }));
        },
        async messungen(clientId) {
          const [zeile] = await sql<{ anzahl: number }[]>`
            select count(*)::int as anzahl from public.messung where client_id = ${clientId}::uuid`;
          return zeile?.anzahl ?? 0;
        },
        async messung(clientId) {
          const [zeile] = await sql<
            (Omit<Messzeile, 'ph' | 'ec' | 'temperatur'> & {
              ph: string | null;
              ec: string | null;
              temperatur: string | null;
            })[]
          >`
            select ph::text as ph, ec::text as ec, temperatur::text as temperatur, fuellstand::text as fuellstand,
                   messart::text as messart, datenart::text as datenart, platz_id::text as platz_id, gilt_ab,
                   storniert_am, storno_grund::text as storno_grund
              from public.messung where client_id = ${clientId}::uuid`;
          if (!zeile) return undefined;
          const zahl = (w: string | null) => (w === null ? null : Number(w));
          return { ...zeile, ph: zahl(zeile.ph), ec: zahl(zeile.ec), temperatur: zahl(zeile.temperatur) };
        },
      });
    } finally {
      await sql.end();
    }
  },
});

export { expect } from '@playwright/test';
