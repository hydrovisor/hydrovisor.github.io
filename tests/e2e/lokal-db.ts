// Gemeinsame Hilfen für E2E gegen die lokale Datenbank und den lokalen Storage (Plan 211 A21; ausgelagert aus
// tests/e2e/tuetenfoto.spec.ts, Plan 207 A14, A17). Nur 127.0.0.1 oder localhost; fehlt die lokale Datenbank oder der
// W0-Seed, scheitert der Test sichtbar. Testbilder erzeugt der Browser im Canvas. Keine Personendaten.
import { execSync } from 'node:child_process';
import { type Locator, type Page } from '@playwright/test';
import postgres from 'postgres';
import { expect } from './konto.ts';

export const FUNKTIONEN = 'http://127.0.0.1:54321/functions/v1';
export const SIGNIEREN = /\/storage\/v1\/object\/sign\/saattueten\//;
export const SIGNIERTER_LINK =
  /\/storage\/v1\/object\/sign\/saattueten\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg\?.*token=/;
const LOKALE_HOSTS = new Set(['127.0.0.1', 'localhost']);

export interface Fotozeile {
  client_id: string;
  sorte_id: string;
  saatgut_id: string | null;
  seite: string;
  pfad: string;
  storniert_am: Date | null;
}

export interface Packungzeile {
  id: string;
  sorte_id: string;
  bestand_korn: number | null;
  kaufdatum: string | null;
  keimfaehigkeit_packung: string | null;
}

/** Verbindung zur lokalen Datenbank (nur 127.0.0.1 oder localhost) */
export function datenbank() {
  let ausgabe: string;
  try {
    ausgabe = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    ausgabe = execSync('npx --yes supabase@3.0.0 status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const dbUrl = /^DB_URL="?([^"\r\n]+)"?$/m.exec(ausgabe)?.[1];
  if (!dbUrl) throw new Error('Lokale Datenbank nicht gefunden: zuerst supabase start');
  if (!LOKALE_HOSTS.has(new URL(dbUrl).hostname)) throw new Error('E2E nur gegen die lokale Datenbank');
  const sql = postgres(dbUrl, { max: 1, onnotice: () => undefined });
  return {
    sql,
    /** gültige W0-Sorte nach sorte_key; fehlt sie, scheitert der Test sichtbar (Seed fehlt) */
    async sorte(sorteKey: string): Promise<{ id: string; name: string }> {
      const [z] = await sql<{ id: string; name: string }[]>`
        select s.sorte_id::text as id, s.name from public.sorte s
          join public.sorte_schluessel k on k.id = s.sorte_id
         where k.sorte_key = ${sorteKey} and s.gueltig_bis is null`;
      if (!z) throw new Error(`W0-Sorte ${sorteKey} fehlt: zuerst npm run seed -- --ziel lokal`);
      return z;
    },
    /** gültige W0-Sorte mit Art und deutschem Namen der Art (Plan 211 A21) */
    async sorteMitArt(
      sorteKey: string,
    ): Promise<{ id: string; name: string; artId: string; nameDe: string }> {
      const [z] = await sql<{ id: string; name: string; art_id: string; name_de: string }[]>`
        select s.sorte_id::text as id, s.name, s.art_id, a.name_de from public.sorte s
          join public.sorte_schluessel k on k.id = s.sorte_id
          join public.art a on a.art_id = s.art_id and a.gueltig_bis is null
         where k.sorte_key = ${sorteKey} and s.gueltig_bis is null`;
      if (!z) throw new Error(`W0-Sorte ${sorteKey} fehlt: zuerst npm run seed -- --ziel lokal`);
      return { id: z.id, name: z.name, artId: z.art_id, nameDe: z.name_de };
    },
    async sorteNachName(name: string): Promise<string | undefined> {
      const [z] = await sql<{ id: string }[]>`
        select sorte_id::text as id from public.sorte where name = ${name} and gueltig_bis is null`;
      return z?.id;
    },
    /** Anzahl gültiger Sorten mit diesem Namen (Plan 211 A21) */
    async sortenNachName(name: string): Promise<number> {
      const [z] = await sql<{ n: number }[]>`
        select count(*)::int as n from public.sorte where name = ${name} and gueltig_bis is null`;
      return z?.n ?? 0;
    },
    /** storniert die gültigen Fotos der Sorte (Plan 207 A14; die Service-Rolle löscht nicht) */
    async fotosStornieren(sorteId: string): Promise<void> {
      await sql`update public.tuetenfoto set storniert_am = now()
                 where sorte_id = ${sorteId}::uuid and storniert_am is null`;
    },
    async jetzt(): Promise<Date> {
      const [z] = await sql<{ t: Date }[]>`select clock_timestamp() as t`;
      if (!z) throw new Error('keine Uhrzeit aus der Datenbank');
      return z.t;
    },
    /** Zeilen tuetenfoto der Sorte seit `ab`, nach erfasst_am */
    async fotos(sorteId: string, ab: Date): Promise<Fotozeile[]> {
      return sql<Fotozeile[]>`
        select client_id::text, sorte_id::text, saatgut_id::text, seite, pfad, storniert_am
          from public.tuetenfoto where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}
         order by erfasst_am, id`;
    },
    async packungen(sorteId: string, ab: Date): Promise<string[]> {
      const z = await sql<{ id: string }[]>`
        select id::text from public.saatgut where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}`;
      return z.map((r) => r.id);
    },
    /** Packungen der Sorte seit `ab` mit Bestand, Kaufdatum und Keimfähigkeit (Plan 211) */
    async packungZeilen(sorteId: string, ab: Date): Promise<Packungzeile[]> {
      return sql<Packungzeile[]>`
        select id::text, sorte_id::text, bestand_korn, kaufdatum::text, keimfaehigkeit_packung::text
          from public.saatgut where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}
         order by erfasst_am, id`;
    },
    /**
     * storniert die gültigen Vorrat-Ereignisse der Sorte (Plan 215 A14; die Service-Rolle löscht nicht): danach ist
     * die Sorte wieder vorrätig, solange keine Packung fehlt
     */
    async vorratZuruecksetzen(sorteId: string): Promise<void> {
      await sql`update public.vorrat_ereignis set storniert_am = now(), storno_grund = 'fehleingabe'
                 where sorte_id = ${sorteId}::uuid and storniert_am is null`;
    },
    /** Zeilen vorrat_ereignis der Sorte seit `ab`, nach erfasst_am (Plan 215) */
    async vorratZeilen(sorteId: string, ab: Date): Promise<Vorratzeile[]> {
      return sql<Vorratzeile[]>`
        select client_id::text, sorte_id::text, saatgut_id::text, typ, gilt_ab, storniert_am
          from public.vorrat_ereignis where sorte_id = ${sorteId}::uuid and erfasst_am >= ${ab}
         order by erfasst_am, id`;
    },
    /** Anzahl gültiger (nicht stornierter) Packungen der Sorte (Plan 215) */
    async packungenGueltig(sorteId: string): Promise<number> {
      const [z] = await sql<{ n: number }[]>`
        select count(*)::int as n from public.saatgut where sorte_id = ${sorteId}::uuid and storniert_am is null`;
      return z?.n ?? 0;
    },
  };
}

export interface Vorratzeile {
  client_id: string;
  sorte_id: string;
  saatgut_id: string | null;
  typ: string;
  gilt_ab: Date;
  storniert_am: Date | null;
}

/** JPEG aus dem Canvas des Browsers (wie sorten-exif.spec.ts, ohne EXIF) */
export async function testbild(page: Page, farbe: string, text: string): Promise<Buffer> {
  const base64 = await page.evaluate(
    ({ farbe, text }) => {
      const c = document.createElement('canvas');
      c.width = 900;
      c.height = 600;
      const g = c.getContext('2d');
      if (!g) throw new Error('kein Canvas');
      g.fillStyle = farbe;
      g.fillRect(0, 0, 900, 600);
      g.fillStyle = '#ffffff';
      g.font = '96px sans-serif';
      g.fillText(text, 80, 330);
      return c.toDataURL('image/jpeg', 0.9).split(',')[1] ?? '';
    },
    { farbe, text },
  );
  return Buffer.from(base64, 'base64');
}

export type Seite = 'Vorderseite' | 'Rückseite';

export const dateiFeld = (page: Page, label: Seite) =>
  page.locator(`input[type=file][aria-label="${label}"]`);
export const fotoFeld = (page: Page, label: Seite) =>
  page.locator('.hv-photo').filter({ has: dateiFeld(page, label) });
export const bildVorne = (page: Page) =>
  page.getByRole('img', { name: 'Tütenfoto Vorderseite', exact: true });
export const bildHinten = (page: Page) => page.getByRole('img', { name: 'Tütenfoto Rückseite', exact: true });

export async function fotoWaehlen(page: Page, label: Seite, bild: Buffer): Promise<void> {
  await dateiFeld(page, label).setInputFiles({ name: `${label}.jpg`, mimeType: 'image/jpeg', buffer: bild });
}

/** Pfad im Bucket aus dem signierten Link */
export function pfadAus(src: string | null): string {
  const treffer = /\/object\/sign\/saattueten\/([^?]+)/.exec(src ?? '');
  return treffer?.[1] ? decodeURIComponent(treffer[1]) : '';
}

/** das Bild ist wirklich geladen (Link gültig, Inhalt ein Bild) */
export async function geladen(bild: Locator): Promise<void> {
  await expect
    .poll(
      () => bild.evaluate((b) => (b as HTMLImageElement).complete && (b as HTMLImageElement).naturalWidth),
      {
        timeout: 15_000,
      },
    )
    .toBeGreaterThan(0);
}

export const knopf = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).or(page.getByRole('link', { name, exact: true }));

export function kiOk(name: string, art: string) {
  return {
    ergebnis: 'ok',
    modell: 'claude-haiku-5-5',
    felder: {
      name,
      art,
      keimart: 'licht',
      keimtemperatur_min_c: 15,
      keimtemperatur_max_c: 20,
      keimdauer_min_d: 7,
      keimdauer_max_d: 14,
      kulturdauer_min_d: 50,
      kulturdauer_max_d: 70,
      aussaat_von_monat: 3,
      aussaat_bis_monat: 8,
      hersteller: 'Beispiel Saaten',
    },
    verworfen: [],
    dauerMs: 1200,
    ausweichmodell: false,
  };
}

export const NICHT_EINGERICHTET = {
  ergebnis: 'abgebrochen',
  grund: 'nicht_eingerichtet',
  hinweis: 'Die Recherche ist noch nicht eingerichtet. Lege die Saatempfehlung von Hand an.',
  dauerMs: 0,
};
