// Hülle der Edge Function ki-recherche (Konzept 11.3, 11.6, Erratum E8; Plan 37): CORS, Token und ist_tim(),
// Stand der Sorte mit dem Benutzer-Token (RLS), ki_aufruf mit der Service-Rolle, Wissenszeilen über
// wissen_app_schreiben() mit dem Benutzer-Token (eigene Prüfung ist_tim). Secret ANTHROPIC_API_KEY; ohne Secret
// «nicht_eingerichtet» ohne Request. Die Fachlogik steht in kern.ts (Deno-Tests ohne Netz).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { BASIS_URL } from '../../../src/adressen.ts';
import { ZEITZONE } from '../../../src/domain/zeit.ts';
import type { Zeitgeber } from '../ki-tuete/kern.ts';
import { ohneSchluessel, recherchieren, type RechercheDaten, type RechercheStand } from './kern.ts';
import { rechercheRufer } from './modell.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URSPRUNG = new URL(BASIS_URL).origin;
// erlaubte Ursprünge wie ki-tuete (Plan 14 A8): Produktion, Vorschau je Zweig, lokale Entwicklung
const ERLAUBT = [/^https:\/\/([a-z0-9-]+\.)?hydrovisor-vorschau\.pages\.dev$/, /^http:\/\/localhost(:\d+)?$/];
const KOERPER_MAX = 4096;

function corsKopf(ursprung: string | null): Record<string, string> {
  const ok = ursprung !== null && (ursprung === URSPRUNG || ERLAUBT.some((m) => m.test(ursprung)));
  return {
    'access-control-allow-origin': ok ? ursprung : URSPRUNG,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
    vary: 'origin',
  };
}

function antwort(status: number, body: unknown, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

const zeit: Zeitgeber = {
  jetzt: () => new Date(),
  warten: (ms, signal) =>
    new Promise<void>((resolve) => {
      if (signal.aborted) return resolve();
      const t = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          resolve();
        },
        { once: true },
      );
    }),
};

function daten<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error || r.data === null) throw new Error(r.error?.message ?? 'keine Daten');
  return r.data;
}

Deno.serve(async (req) => {
  const cors = corsKopf(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return antwort(405, { fehler: 'nur POST' }, cors);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const dienst = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return antwort(401, { fehler: 'Anmeldung fehlt' }, cors);

  const benutzer = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: nutzer, error: nutzerFehler } = await benutzer.auth.getUser(token);
  if (nutzerFehler || !nutzer.user) return antwort(401, { fehler: 'Anmeldung ungültig' }, cors);
  const { data: tim } = await benutzer.rpc('ist_tim');
  if (tim !== true) return antwort(403, { fehler: 'kein Zugang' }, cors);

  const laenge = Number(req.headers.get('content-length') ?? '0');
  if (!Number.isFinite(laenge) || laenge > KOERPER_MAX)
    return antwort(413, { fehler: 'Körper zu gross' }, cors);
  let body: { sorte_id?: unknown; app_version?: unknown };
  try {
    const text = await req.text();
    if (text.length > KOERPER_MAX) return antwort(413, { fehler: 'Körper zu gross' }, cors);
    body = JSON.parse(text) as typeof body;
  } catch {
    return antwort(400, { fehler: 'Körper ist kein JSON' }, cors);
  }
  if (typeof body?.sorte_id !== 'string' || !UUID.test(body.sorte_id))
    return antwort(400, { fehler: 'sorte_id fehlt' }, cors);
  const sorteId = body.sorte_id;
  const appVersion =
    typeof body.app_version === 'string' && body.app_version.trim() !== ''
      ? body.app_version.trim().slice(0, 40)
      : 'ki-recherche';

  const schluessel = Deno.env.get('ANTHROPIC_API_KEY');
  // ohne Secret keine Zeile ki_aufruf und kein Request (wie ki-tuete, Plan 14 A10)
  if (!schluessel) return antwort(200, ohneSchluessel(), cors);

  const dienstClient = createClient(url, dienst, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const zugriff: RechercheDaten = {
    async stand(id): Promise<RechercheStand> {
      const sorte = daten(
        await benutzer
          .from('sorte')
          .select('sorte_id, name, art_id, kulturtyp')
          .eq('sorte_id', id)
          .is('gueltig_bis', null)
          .single(),
      ) as unknown as RechercheStand['sorte'];
      const art = daten(
        await benutzer
          .from('art')
          .select('art_id, name_de, name_wiss, kulturgruppe_id, kulturformen_erlaubt')
          .eq('art_id', sorte.art_id)
          .is('gueltig_bis', null)
          .single(),
      ) as unknown as RechercheStand['art'] & { kulturgruppe_id: string };
      const kulturgruppe = daten(
        await benutzer
          .from('kulturgruppe')
          .select('kulturgruppe_id, ec_obergrenze_validator')
          .eq('kulturgruppe_id', art.kulturgruppe_id)
          .single(),
      ) as unknown as RechercheStand['kulturgruppe'];
      const sollwerte = daten(
        await benutzer
          .from('v_sollwert')
          .select(
            'sorte_id, phase, groesse, wert_min, wert_typ, wert_max, text_wert, herkunft_ebene, evidenzklasse, vermerk',
          )
          .eq('sorte_id', id),
      ) as unknown as RechercheStand['sollwerte'];
      const pflicht = daten(
        await benutzer.from('pflichtgroesse').select('phase, groesse, mindestens_art'),
      ) as unknown as RechercheStand['pflicht'];
      const saatempfehlungen = daten(
        await benutzer
          .from('saatempfehlung')
          .select('ebene, art_id, sorte_id, kulturform, klasse_saatmenge, bestaetigt_am')
          .is('gueltig_bis', null)
          .or(`art_id.eq.${sorte.art_id},sorte_id.eq.${id}`),
      ) as unknown as RechercheStand['saatempfehlungen'];
      return {
        sorte,
        art,
        kulturgruppe: {
          ...kulturgruppe,
          ec_obergrenze_validator: Number(kulturgruppe.ec_obergrenze_validator),
        },
        sollwerte,
        pflicht,
        saatempfehlungen,
      };
    },
    async aufrufeSeit(ab) {
      const { count, error } = await dienstClient
        .from('ki_aufruf')
        .select('id', { count: 'exact', head: true })
        .gte('erfasst_am', ab.toISOString());
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async aufrufBeginnen(z) {
      const { data, error } = await dienstClient
        .from('ki_aufruf')
        .insert({ modell: z.modell, zweck: z.zweck, app_version: z.app_version, status: 'gestartet' })
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message ?? 'ki_aufruf ohne id');
      return (data as { id: string }).id;
    },
    async aufrufBeenden(id, z) {
      const { error } = await dienstClient.from('ki_aufruf').update(z).eq('id', id);
      if (error) throw new Error(error.message);
    },
    async wertSchreiben(zeile) {
      const { data, error } = await benutzer.rpc('wissen_app_schreiben', {
        aktion: 'recherche_wert',
        daten: zeile,
      });
      if (error) throw new Error(error.message);
      return (data as string | null) ?? null;
    },
    async saatSchreiben(zeile) {
      const { data, error } = await benutzer.rpc('wissen_app_schreiben', {
        aktion: 'recherche_saatempfehlung',
        daten: zeile,
      });
      if (error) throw new Error(error.message);
      return (data as string | null) ?? null;
    },
  };

  const ergebnis = await recherchieren(
    { sorteId, appVersion },
    { daten: zugriff, modell: rechercheRufer(fetch, schluessel), zeit, zeitzone: ZEITZONE },
  );
  return antwort(200, ergebnis, cors);
});
