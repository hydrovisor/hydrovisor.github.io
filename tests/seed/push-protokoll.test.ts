// UC8-AK7 [SQL] Protokoll der Sammel-Push über 14 Tage gegen die lokale Datenbank (Plan 31 Testliste «SQL»; Konzept
// R5.5, 11.3, TE-05, 2.3 EK5; 06_tests.md 9 «Abläufe»: an 14 von 14 Tagen höchstens 5 min nach der Push-Zeit).
// pushLauf() läuft mit dem echten Datenzugriff supabaseDaten() über die lokale API (Service-Rolle aus
// `supabase status -o env`, wie tests/e2e/konto.ts) und einem Fake-Sender (keine echte Push, kein Netz nach aussen).
// Uhr injiziert: 15.3. bis 28.3.2027 (über die Umstellung auf Sommerzeit), je Tag alle 5 min von Push-Zeit − 10 min bis
// Push-Zeit + 20 min, Zeitzone Europe/Zurich. Geprüft per SQL über v_push_zustellung, push_versand und
// aufgabe_tagesliste.
//
// Testanlage Q (Datenart echt, feste IDs, keine Personendaten) mit drei DWC-Gefässen in Betrieb, Neuansatz 10.3.:
// - Q-1.1: Messung 13.3. mit EC ausserhalb → «Messen und nachfüllen» ab 15.3. als Ausserhalb (bleibt überfällig);
// - Q-1.2: naechster_wechsel_am 15.3. → «Lösung wechseln» als Wechsel;
// - Q-1.3: Messung 14.3. → Routine; jeden Tag Kurzprüfung an allen drei (Routine).
// Dazu ein echtes Abo mit Endpoint unter example.invalid.
//
// Die Testzeilen werden über DB_URL (postgres) angelegt und committet, damit die API sie sieht; afterAll räumt mit
// postgres auf (die Service-Rolle darf nicht löschen), damit spätere Seed-Tests und der Zähltest unverändert bleiben.
// Die Einstellung bleibt unverändert (Push-Zeit aus der Datenbank); fehlt sie, legt der Test eine an und löscht sie.
// Ebenso das Messgerät: fehlt es (Prüftor nach db reset ohne Seed), legt der Test eines mit fester ID an.
// Vorausgesetzt (Plan 31): Migration 20261109120000_push_timer.sql mit der Sicht v_push_zustellung (Spalten datum_lokal,
// soll, gesendet_am, verspaetung_min, aufgaben, am_faelligkeitstag); supabaseDaten(db) aus
// supabase/functions/push-taeglich/daten.ts (dynamisch importiert, weil die Datei den Typ aus jsr: bezieht).
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pushLauf, type PushDaten, type Sender } from '../../supabase/functions/push-taeglich/kern.ts';

const LOKAL = new Set(['127.0.0.1', 'localhost']);
const ZONE = 'Europe/Zurich';
const APP = 'uc8-ak7-test';
const TAGE = Array.from({ length: 14 }, (_, i) => `2027-03-${String(15 + i).padStart(2, '0')}`);

const id = (n: number) => `31a00000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ANLAGE = id(1);
const BEREICH = id(2);
const MODELL = id(3);
const DECKEL = id(4);
const ABO = id(5);
const EINSTELLUNG = id(6);
const MESSGERAET = id(7);
const PLATZ = { '1.1': id(11), '1.2': id(12), '1.3': id(13) } as const;
const GEFAESS = { '1.1': id(21), '1.2': id(22), '1.3': id(23) } as const;
const PLAETZE = Object.values(PLATZ);

function statusLesen(): { apiUrl: string; dbUrl: string; dienst: string } {
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
    const [, k, w] = /^([A-Z_]+)=(.*)$/.exec(zeile.trim()) ?? [];
    if (k && w !== undefined) werte[k] = w.replace(/^"|"$/g, '');
  }
  const apiUrl = werte['API_URL'];
  const dbUrl = process.env['DB_URL'] ?? werte['DB_URL'];
  const dienst = werte['SERVICE_ROLE_KEY'] ?? werte['SECRET_KEY'];
  if (!apiUrl || !dbUrl || !dienst)
    throw new Error(
      'Lokale Datenbank nicht gefunden: zuerst supabase start (supabase status -o env ohne Werte)',
    );
  for (const adresse of [apiUrl, dbUrl])
    if (!LOKAL.has(new URL(adresse).hostname))
      throw new Error(`nur gegen die lokale Datenbank, nicht ${adresse}`);
  return { apiUrl, dbUrl, dienst };
}

const status = statusLesen();
const sql = postgres(status.dbUrl, { max: 1, onnotice: () => undefined });

/** Kalendertag und Ortszeit Zürich → UTC (MEZ bis 28.3.2027 02:00, danach MESZ; Push-Zeit liegt nach 05:00) */
function zuerich(tag: string, zeit: string): Date {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  const [h, mi] = zeit.split(':').map(Number) as [number, number];
  const lokal = Date.UTC(j, m - 1, d, h, mi);
  const sommer = lokal >= Date.UTC(2027, 2, 28, 3, 0) && lokal < Date.UTC(2027, 9, 31, 3, 0);
  return new Date(lokal - (sommer ? 2 : 1) * 3_600_000);
}

async function aufraeumen(): Promise<void> {
  await sql`delete from public.aufgabe_tagesliste
            where platz_id = any(${PLAETZE}::uuid[])
               or (app_version = 'push-taeglich' and tag between ${TAGE[0] ?? ''}::date and ${TAGE[13] ?? ''}::date)`;
  await sql`delete from public.push_versand
            where abo_id = ${ABO}::uuid
               or (kanal = 'email' and datum_lokal between ${TAGE[0] ?? ''}::date and ${TAGE[13] ?? ''}::date)`;
  await sql`delete from public.push_abo where id = ${ABO}::uuid`;
  await sql`delete from public.messung where platz_id = any(${PLAETZE}::uuid[])`;
  await sql`delete from public.naehrloesungsansatz where platz_id = any(${PLAETZE}::uuid[])`;
  await sql`delete from public.ereignis where platz_id = any(${PLAETZE}::uuid[]) or anlage_id = ${ANLAGE}::uuid`;
  await sql`delete from public.gefaess where platz_id = any(${PLAETZE}::uuid[])`;
  await sql`delete from public.platz where anlage_id = ${ANLAGE}::uuid`;
  await sql`delete from public.bereich where anlage_id = ${ANLAGE}::uuid`;
  await sql`delete from public.gefaessmodell where id = ${MODELL}::uuid`;
  await sql`delete from public.deckeltyp where id = ${DECKEL}::uuid`;
  await sql`delete from public.anlage where id = ${ANLAGE}::uuid`;
  await sql`delete from public.einstellung where id = ${EINSTELLUNG}::uuid`;
  // nur ohne fremde Messungen (andere Läufe auf derselben lokalen Datenbank, Prüferbefund 5)
  await sql`delete from public.messgeraet m
            where m.id = ${MESSGERAET}::uuid
              and not exists (select 1 from public.messung x where x.messgeraet_id = m.id)
              and not exists (select 1 from public.kalibrierung k where k.messgeraet_id = m.id)`;
}

async function anlegen(): Promise<void> {
  // Im Prüftor läuft der Test direkt nach supabase db reset ohne Seed: fehlt ein Messgerät, legt er ein eigenes an
  let [geraet] = await sql<{ id: string }[]>`select id from public.messgeraet order by erfasst_am limit 1`;
  if (!geraet) {
    await sql`insert into public.messgeraet (id, modell, app_version)
              values (${MESSGERAET}::uuid, 'Testmessgerät UC8-AK7', ${APP})`;
    geraet = { id: MESSGERAET };
  }
  const [einstellung] = await sql<{ id: string }[]>`select id from public.einstellung limit 1`;
  if (!einstellung)
    await sql`insert into public.einstellung (id, push_zeit, zeitzone, app_version)
              values (${EINSTELLUNG}::uuid, '07:00', ${ZONE}, ${APP})`;
  await sql`insert into public.anlage (id, client_id, name, kuerzel, datenart, app_version)
            values (${ANLAGE}::uuid, ${ANLAGE}::uuid, 'Testanlage UC8-AK7', 'Q', 'echt', ${APP})`;
  await sql`insert into public.bereich (id, client_id, anlage_id, nummer, name, app_version)
            values (${BEREICH}::uuid, ${BEREICH}::uuid, ${ANLAGE}::uuid, 1, 'Ebene 1', ${APP})`;
  await sql`insert into public.gefaessmodell (id, client_id, name, form, innen_l_mm, innen_b_mm, innen_h_mm,
                                              betriebsvolumen_l, app_version)
            values (${MODELL}::uuid, ${MODELL}::uuid, 'Testmodell UC8-AK7', 'rechteckig', 400, 300, 220, 9, ${APP})`;
  await sql`insert into public.deckeltyp (id, client_id, name, topfdurchmesser_mm, loecher_je_reihe, app_version)
            values (${DECKEL}::uuid, ${DECKEL}::uuid, 'Testdeckel UC8-AK7', 80, '{2,2}', ${APP})`;
  for (const [kennung, platz] of Object.entries(PLATZ)) {
    const gefaess = GEFAESS[kennung as keyof typeof GEFAESS];
    await sql`insert into public.platz (id, client_id, anlage_id, bereich_id, kennung, rolle, app_version)
              values (${platz}::uuid, ${platz}::uuid, ${ANLAGE}::uuid, ${BEREICH}::uuid, ${kennung}, 'gefaess', ${APP})`;
    await sql`insert into public.gefaess (id, client_id, platz_id, gefaessmodell_id, deckeltyp_id, betriebsart, luftpumpe,
                                          betriebsvolumen_l, intervall_messen_d, intervall_nachfuellen_d,
                                          intervall_wechseln_d, naechster_wechsel_am, gueltig_von, app_version)
              values (${gefaess}::uuid, ${gefaess}::uuid, ${platz}::uuid, ${MODELL}::uuid, ${DECKEL}::uuid, 'dwc', 'P1',
                      9, 2, 2, 14, ${kennung === '1.2' ? '2027-03-15' : null}::date, '2027-03-01T08:00:00Z', ${APP})`;
    // Gefässprüfung Schritte 1 bis 4 ok → in Betrieb
    for (const schritt of [1, 2, 3, 4])
      await sql`insert into public.ereignis (client_id, typ, platz_id, daten, gilt_ab, app_version)
                values (gen_random_uuid(), 'gefaesspruefung', ${platz}::uuid,
                        ${JSON.stringify({ schritt, ok: true })}::text::jsonb, '2027-03-01T09:00:00Z', ${APP})`;
    await sql`insert into public.naehrloesungsansatz (client_id, platz_id, typ, status, begonnen_am, abgeschlossen_am,
                                                      volumen_l, gilt_ab, app_version)
              values (gen_random_uuid(), ${platz}::uuid, 'neuansatz', 'abgeschlossen', '2027-03-10T08:00:00Z',
                      '2027-03-10T08:30:00Z', 9, '2027-03-10T08:00:00Z', ${APP})`;
    const ausserhalb = kennung === '1.1';
    await sql`insert into public.messung (client_id, platz_id, messgeraet_id, messart, ph, ec, temperatur,
                                          bewertung_ph, bewertung_ec, bewertung_temp, gilt_ab, app_version)
              values (gen_random_uuid(), ${platz}::uuid, ${geraet.id}::uuid, 'rundgang', 6.0, ${ausserhalb ? 2.4 : 1.2},
                      20.0, 'gruen', ${ausserhalb ? 'ausserhalb' : 'gruen'}, 'gruen',
                      ${ausserhalb ? '2027-03-13T08:00:00Z' : '2027-03-14T08:00:00Z'}, ${APP})`;
  }
  await sql`insert into public.push_abo (id, geraet, endpoint, p256dh, auth_schluessel, datenart, aktiv, app_version)
            values (${ABO}::uuid, 'Testgerät UC8-AK7', 'https://push.example.invalid/uc8-ak7', 'BPtest', 'auth',
                    'echt', true, ${APP})`;
}

beforeAll(async () => {
  await aufraeumen();
  await anlegen();
}, 60_000);

afterAll(async () => {
  try {
    await aufraeumen();
  } finally {
    await sql.end();
  }
});

describe('UC8-AK7 Protokoll der Sammel-Push', () => {
  it('UC8-AK7 Protokoll mit injizierter Uhr: an 14 von 14 Tagen Sammel-Push höchstens 5 min nach der Push-Zeit, Titel nach Gewicht', async () => {
    const pfad = '../../supabase/functions/push-taeglich/daten.ts';
    const { supabaseDaten } = (await import(/* @vite-ignore */ pfad)) as {
      supabaseDaten: (db: unknown) => PushDaten;
    };
    const db = createClient(status.apiUrl, status.dienst, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const daten = supabaseDaten(db);
    const gesendet: string[] = [];
    const sender: Sender = {
      async senden(abo, nutzlast) {
        expect(abo.id, 'nur an das Test-Abo').toBe(ABO);
        gesendet.push(String(JSON.parse(nutzlast)['tag']));
        return { status: 201 };
      },
    };
    const [einstellung] = await sql<{ push_zeit: string }[]>`
        select to_char(push_zeit, 'HH24:MI') as push_zeit from public.einstellung order by erfasst_am limit 1`;
    const pushZeit = einstellung?.push_zeit ?? '07:00';

    for (const tag of TAGE) {
      const soll = zuerich(tag, pushZeit).getTime();
      for (let t = soll - 10 * 60_000; t <= soll + 20 * 60_000; t += 5 * 60_000) {
        const ergebnis = await pushLauf(
          { art: 'sammel', geheimnisOk: true },
          { jetzt: new Date(t), daten, sender, signieren: async () => 'signatur-ohne-bedeutung' },
        );
        expect([200, 204], `HTTP am ${tag} ${new Date(t).toISOString()}`).toContain(ergebnis.http);
      }
    }

    // je Tag genau ein Sammel-Versand an das Test-Abo, gesendet
    const versande = await sql<{ datum_lokal: string; titel: string; status: string }[]>`
        select to_char(datum_lokal, 'YYYY-MM-DD') as datum_lokal, titel, status::text as status
          from public.push_versand
         where abo_id = ${ABO}::uuid and kanal = 'push' and art = 'sammel'
         order by datum_lokal`;
    expect(versande.map((v) => v.datum_lokal)).toEqual(TAGE);
    expect(versande.every((v) => v.status === 'gesendet')).toBe(true);
    expect(gesendet.filter((t) => t === 'heute')).toHaveLength(14);

    // Titel nach Gewicht; am 15.3. alle drei Gruppen
    for (const v of versande)
      expect(v.titel, v.datum_lokal).toMatch(
        /^Hydrovisor heute: \d+ (Ausserhalb|Wechsel|Routine)( · \d+ (Wechsel|Routine))*$/,
      );
    expect(versande[0]?.titel).toMatch(/^Hydrovisor heute: \d+ Ausserhalb · \d+ Wechsel · \d+ Routine$/);
    expect(versande.every((v) => !/nichts fällig/.test(v.titel))).toBe(true);

    // 14 von 14 Tagen höchstens 5 min nach der Push-Zeit (v_push_zustellung)
    const zustellung = await sql<{ datum_lokal: string; verspaetung_min: string | null }[]>`
        select to_char(datum_lokal, 'YYYY-MM-DD') as datum_lokal, verspaetung_min::text as verspaetung_min
          from public.v_push_zustellung
         where datum_lokal between ${TAGE[0] ?? ''}::date and ${TAGE[13] ?? ''}::date
         order by datum_lokal`;
    expect(zustellung.map((z) => z.datum_lokal)).toEqual(TAGE);
    const puenktlich = zustellung.filter(
      (z) => z.verspaetung_min !== null && Number(z.verspaetung_min) >= 0 && Number(z.verspaetung_min) <= 5,
    );
    expect(
      puenktlich.map((z) => z.datum_lokal),
      JSON.stringify(zustellung),
    ).toEqual(TAGE);

    // Tagesliste je Tag geschrieben, kein Schlüssel zweimal (A7); die überfällige Ausserhalb-Messung nur am 15.3.
    const liste = await sql<{ tag: string; aufgabe_schluessel: string }[]>`
        select to_char(tag, 'YYYY-MM-DD') as tag, aufgabe_schluessel
          from public.aufgabe_tagesliste
         where tag between ${TAGE[0] ?? ''}::date and ${TAGE[13] ?? ''}::date and app_version = 'push-taeglich'`;
    expect([...new Set(liste.map((z) => z.tag))].sort()).toEqual(TAGE);
    const schluessel = liste.map((z) => z.aufgabe_schluessel);
    expect(new Set(schluessel).size).toBe(schluessel.length);
    expect(
      liste.filter((z) => z.aufgabe_schluessel === `messen_nachfuellen|${PLATZ['1.1']}|2027-03-15`),
    ).toEqual([{ tag: '2027-03-15', aufgabe_schluessel: `messen_nachfuellen|${PLATZ['1.1']}|2027-03-15` }]);
  }, 600_000);
});
