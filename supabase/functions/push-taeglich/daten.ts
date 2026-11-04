// Datenzugriff von push-taeglich über supabase-js mit der Service-Rolle (Plan 13). Die Teile lesen dieselben
// Tabellen und Sichten mit denselben Filtern wie das Offline-Bündel (src/daten/buendel.ts), soweit tagesliste()
// sie braucht. app_version der Serverzeilen ist push-taeglich (A10).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fensterBeginn } from '../../../src/domain/datenpfad/buendel.ts';
import type { Abo, PushDaten } from './kern.ts';

const APP_VERSION = 'push-taeglich';
const MESSUNG_FENSTER_TAGE = 14; // wie das Bündel (messung, fensterTage 14)

function pruefen<T>(r: { data: T | null; error: { message: string } | null }, was: string): T {
  if (r.error) throw new Error(`${was}: ${r.error.message}`);
  return r.data as T;
}

export function supabaseDaten(db: SupabaseClient): PushDaten {
  const abos = () => db.from('push_abo').select('id,endpoint,p256dh,auth_schluessel,datenart,aktiv');
  return {
    async einstellung() {
      const r = await db.from('einstellung').select('push_zeit,zeitzone').limit(1).maybeSingle();
      const e = pruefen(r, 'einstellung') as { push_zeit?: string; zeitzone?: string } | null;
      return { push_zeit: e?.push_zeit ?? '07:00:00', zeitzone: e?.zeitzone ?? 'Europe/Zurich' };
    },
    async aktiveAbos() {
      return pruefen(await abos(), 'push_abo') as Abo[];
    },
    async aboZuEndpoint(endpoint) {
      const r = await abos().eq('endpoint', endpoint).maybeSingle();
      return (pruefen(r, 'push_abo') as Abo | null) ?? undefined;
    },
    async teile(stichtag) {
      const zone = ((await this.einstellung()).zeitzone ?? 'Europe/Zurich') as string;
      const fenster = fensterBeginn(stichtag, MESSUNG_FENSTER_TAGE, zone);
      const [anlage, platz, gefaess, fuell, status, messung, geraet, kalibrierung, ereignis, einstellung] =
        await Promise.all([
          db.from('anlage').select('*').is('storniert_am', null),
          db.from('platz').select('*').is('storniert_am', null),
          db.from('gefaess').select('*').is('storniert_am', null),
          db.from('v_fuellzustand').select('*'),
          db.from('v_gefaess_status').select('*'),
          db
            .from('messung')
            .select('id,platz_id,gilt_ab,storniert_am')
            .is('storniert_am', null)
            .gte('gilt_ab', fenster),
          db.from('messgeraet').select('*').order('id'),
          db.from('kalibrierung').select('*').is('storniert_am', null),
          db
            .from('ereignis')
            .select('*')
            .is('storniert_am', null)
            .in('typ', ['sonde_gereinigt', 'als_unsicher_markiert']),
          db.from('einstellung').select('id,push_zeit,zeitzone,feste_kalibriertermine'),
        ]);
      return {
        anlage: pruefen(anlage, 'anlage'),
        platz: pruefen(platz, 'platz'),
        gefaess: pruefen(gefaess, 'gefaess'),
        v_fuellzustand: pruefen(fuell, 'v_fuellzustand'),
        v_gefaess_status: pruefen(status, 'v_gefaess_status'),
        messung: pruefen(messung, 'messung'),
        messgeraet: pruefen(geraet, 'messgeraet'),
        kalibrierung: pruefen(kalibrierung, 'kalibrierung'),
        ereignis: pruefen(ereignis, 'ereignis'),
        einstellung: pruefen(einstellung, 'einstellung'),
      } as Record<string, unknown[]>;
    },
    async versandAnlegen(z) {
      const r = await db
        .from('push_versand')
        .insert({ ...z, kanal: 'push', status: 'geplant', app_version: APP_VERSION })
        .select('id')
        .single();
      if (r.error?.code === '23505') return 'besteht';
      return { id: (pruefen(r, 'push_versand anlegen') as { id: string }).id };
    },
    async fehlerVersandUebernehmen(abo_id, datum_lokal) {
      // eine Anweisung: nur ein Lauf übernimmt die Zeile (atomar, A6)
      const r = await db
        .from('push_versand')
        .update({ status: 'geplant' })
        .eq('abo_id', abo_id)
        .eq('datum_lokal', datum_lokal)
        .eq('art', 'sammel')
        .eq('status', 'fehler')
        .select('id');
      const zeilen = pruefen(r, 'push_versand übernehmen') as { id: string }[];
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
  };
}
