// Datenzugriff von push-taeglich über supabase-js mit der Service-Rolle (Pläne 13 und 31). Die Teile kommen aus der
// gemeinsamen Beschreibung BUENDEL_TEILE (gleiche Tabellen, Spalten, Filter, Typen, Fenster und Seiten wie das
// Offline-Bündel) und werden mit derselben teileKuerzen() gekürzt: Heute und Push rechnen dieselbe Liste (R5.1,
// Prüfer #27 H4). app_version der Serverzeilen ist push-taeglich (Plan 13 A10).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { AUFGABEN_TEILE } from '../../../src/domain/aufgaben.ts';
import { fensterBeginn, teileKuerzen } from '../../../src/domain/datenpfad/buendel.ts';
import { BUENDEL_TEILE, SEITE, type Buendelteil } from '../../../src/domain/datenpfad/buendel-teile.ts';
import type { Abo, LaufenderTimer, PushDaten } from './kern.ts';

const APP_VERSION = 'push-taeglich';
const ZONE = 'Europe/Zurich';

function pruefen<T>(r: { data: T | null; error: { message: string } | null }, was: string): T {
  if (r.error) throw new Error(`${was}: ${r.error.message}`);
  return r.data as T;
}

/** Teile, die die Aufgaben-Rechnung liest, in der Beschreibung des Bündels */
const PUSH_TEILE: readonly Buendelteil[] = BUENDEL_TEILE.filter((t) => AUFGABEN_TEILE.includes(t.name));

// ungebundene Sicht auf den Client, weil Tabelle und Sicht erst zur Laufzeit feststehen (wie src/daten/buendel.ts)
interface Abfrage extends PromiseLike<{ data: unknown; error: { message: string } | null }> {
  select(spalten: string): Abfrage;
  is(spalte: string, wert: null): Abfrage;
  gte(spalte: string, wert: string): Abfrage;
  in(spalte: string, werte: readonly string[]): Abfrage;
  order(spalte: string, optionen: { ascending: boolean }): Abfrage;
  range(von: number, bis: number): Abfrage;
}

async function teilLaden(
  db: SupabaseClient,
  teil: Buendelteil,
  stichtag: Date,
  zone: string,
): Promise<unknown[]> {
  const zeilen: unknown[] = [];
  for (let von = 0; ; von += SEITE) {
    let abfrage = (db as unknown as { from(n: string): Abfrage })
      .from(teil.tabelle ?? teil.name)
      .select(teil.spalten);
    if (teil.ohneStorno) abfrage = abfrage.is('storniert_am', null);
    if (teil.gueltig) abfrage = abfrage.is('gueltig_bis', null);
    if (teil.typen) abfrage = abfrage.in('typ', teil.typen);
    if (teil.fensterTage !== undefined)
      abfrage = abfrage.gte('gilt_ab', fensterBeginn(stichtag, teil.fensterTage, zone));
    for (const spalte of teil.ordnung) abfrage = abfrage.order(spalte, { ascending: true });
    const seite = pruefen(await abfrage.range(von, von + SEITE - 1), teil.name) as unknown[] | null;
    zeilen.push(...(seite ?? []));
    if (!seite || seite.length < SEITE) break;
  }
  return zeilen;
}

export function supabaseDaten(db: SupabaseClient): PushDaten {
  const abos = () => db.from('push_abo').select('id,endpoint,p256dh,auth_schluessel,datenart,aktiv');
  return {
    async einstellung() {
      const r = await db
        .from('einstellung')
        .select('push_zeit,zeitzone,email_rueckfall')
        .limit(1)
        .maybeSingle();
      const e = pruefen(r, 'einstellung') as {
        push_zeit?: string;
        zeitzone?: string;
        email_rueckfall?: boolean | null;
      } | null;
      return {
        push_zeit: e?.push_zeit ?? '07:00:00',
        zeitzone: e?.zeitzone ?? ZONE,
        email_rueckfall: e?.email_rueckfall === true,
      };
    },
    async aktiveAbos() {
      return pruefen(await abos(), 'push_abo') as Abo[];
    },
    async aboZuEndpoint(endpoint) {
      const r = await abos().eq('endpoint', endpoint).maybeSingle();
      return (pruefen(r, 'push_abo') as Abo | null) ?? undefined;
    },
    async teile(stichtag) {
      const zone = (await this.einstellung()).zeitzone;
      const geladen = await Promise.all(
        PUSH_TEILE.map(async (t) => [t.name, await teilLaden(db, t, stichtag, zone)] as const),
      );
      return teileKuerzen(Object.fromEntries(geladen)) as Record<string, unknown[]>;
    },
    async versandHeute(datum_lokal) {
      const r = await db
        .from('push_versand')
        .select('abo_id,kanal,art,status')
        .eq('datum_lokal', datum_lokal);
      return pruefen(r, 'push_versand lesen') as Awaited<ReturnType<PushDaten['versandHeute']>>;
    },
    async versandAnlegen(z) {
      const r = await db
        .from('push_versand')
        .insert({ ...z, status: 'geplant', app_version: APP_VERSION })
        .select('id')
        .single();
      if (r.error?.code === '23505') return 'besteht';
      return { id: (pruefen(r, 'push_versand anlegen') as { id: string }).id };
    },
    async fehlerVersandUebernehmen(abo_id, datum_lokal, art, kanal) {
      // eine Anweisung: nur ein Lauf übernimmt die Zeile (atomar, Plan 13 A6)
      let abfrage = db
        .from('push_versand')
        .update({ status: 'geplant' })
        .eq('datum_lokal', datum_lokal)
        .eq('art', art)
        .eq('kanal', kanal)
        .eq('status', 'fehler');
      abfrage = abo_id === null ? abfrage.is('abo_id', null) : abfrage.eq('abo_id', abo_id);
      const zeilen = pruefen(await abfrage.select('id'), 'push_versand übernehmen') as { id: string }[];
      return zeilen[0];
    },
    async versandAbschliessen(id, status, gesendetAm) {
      const r = await db
        .from('push_versand')
        .update({ status, ...(gesendetAm ? { gesendet_am: gesendetAm.toISOString() } : {}) })
        .eq('id', id);
      pruefen(r, 'push_versand abschliessen');
    },
    async aboDeaktivieren(id, fehler) {
      pruefen(
        await db.from('push_abo').update({ aktiv: false, letzter_fehler: fehler }).eq('id', id),
        'push_abo',
      );
    },
    async testsHeute(datum_lokal) {
      const r = await db
        .from('push_versand')
        .select('id', { count: 'exact', head: true })
        .eq('art', 'test')
        .eq('datum_lokal', datum_lokal);
      if (r.error) throw new Error(`push_versand zählen: ${r.error.message}`);
      return r.count ?? 0;
    },
    async tageslisteSchreiben(tag, zeilen) {
      if (zeilen.length === 0) return 0;
      // A7: ein Schlüssel nur am ersten Tag, an dem er in einer Push-Liste steht
      const bekannt = new Set<string>();
      const schluessel = zeilen.map((z) => z.aufgabe_schluessel);
      for (let i = 0; i < schluessel.length; i += 100) {
        const r = await db
          .from('aufgabe_tagesliste')
          .select('aufgabe_schluessel')
          .in('aufgabe_schluessel', schluessel.slice(i, i + 100));
        for (const z of pruefen(r, 'aufgabe_tagesliste lesen') as { aufgabe_schluessel: string }[])
          bekannt.add(z.aufgabe_schluessel);
      }
      const neu = zeilen
        .filter((z) => !bekannt.has(z.aufgabe_schluessel))
        .map((z) => ({ ...z, tag, app_version: APP_VERSION }));
      if (neu.length === 0) return 0;
      // parallele Läufe: unique (tag, aufgabe_schluessel), doppelte Zeilen werden übergangen
      const r = await db
        .from('aufgabe_tagesliste')
        .upsert(neu, { onConflict: 'tag,aufgabe_schluessel', ignoreDuplicates: true })
        .select('id');
      return (pruefen(r, 'aufgabe_tagesliste schreiben') as unknown[]).length;
    },
    async laufendeTimer(von, bis) {
      const r = await db
        .from('naehrloesungsansatz')
        .select('id,typ,timer_ende,platz:platz_id(kennung,anlage:anlage_id(kuerzel,datenart))')
        .eq('status', 'laufend')
        .is('storniert_am', null)
        .gt('timer_ende', von.toISOString())
        .lte('timer_ende', bis.toISOString());
      const zeilen = (pruefen(r, 'naehrloesungsansatz Timer') ?? []) as unknown as {
        id: string;
        typ: string;
        timer_ende: string;
        platz: {
          kennung: string;
          anlage: { kuerzel: string; datenart: LaufenderTimer['datenart'] } | null;
        } | null;
      }[];
      return zeilen
        .filter((z) => z.platz?.anlage)
        .map((z) => ({
          ansatz_id: z.id,
          typ: z.typ,
          timer_ende: z.timer_ende,
          code: `${z.platz?.anlage?.kuerzel}-${z.platz?.kennung}`,
          datenart: z.platz?.anlage?.datenart ?? 'demo',
        }));
    },
  };
}
