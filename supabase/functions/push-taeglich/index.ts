// Hülle der Edge Function push-taeglich (Plan 13, Datenfluss): Cron-Aufruf mit Header x-cron-geheimnis (Prüfung über
// push_cron_pruefen gegen Vault) oder Test-Push mit dem Sitzungs-Token (auth.getUser und ist_tim). Sender ist
// npm:web-push mit den Secrets VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT; die Quittungs-Signatur nutzt
// PUSH_QUITTUNG_SCHLUESSEL. Ohne diese Secrets antwortet die Function mit 503 und sendet nichts.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { corsKopf, jsonAntwort } from '../_shared/cors.ts';
import { signieren } from '../_shared/hmac.ts';
import { supabaseDaten } from './daten.ts';
import { pushLauf, type Auftrag, type Sender } from './kern.ts';

const keineSitzung = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(async (req) => {
  const cors = corsKopf(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return jsonAntwort(405, { fehler: 'nur POST' }, cors);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const dienst = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', keineSitzung);

  let auftrag: Auftrag;
  const geheimnis = req.headers.get('x-cron-geheimnis');
  if (geheimnis !== null) {
    const { data } = await dienst.rpc('push_cron_pruefen', { geheimnis });
    auftrag = { art: 'sammel', geheimnisOk: data === true };
  } else {
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return jsonAntwort(401, { fehler: 'Anmeldung fehlt' }, cors);
    const nutzer = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      ...keineSitzung,
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: angemeldet, error } = await nutzer.auth.getUser(token);
    if (error || !angemeldet.user) return jsonAntwort(401, { fehler: 'Anmeldung ungültig' }, cors);
    const { data: tim } = await nutzer.rpc('ist_tim');
    let body: { art?: unknown; endpoint?: unknown };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonAntwort(400, { fehler: 'Körper ist kein JSON' }, cors);
    }
    if (body.art !== 'test' || typeof body.endpoint !== 'string' || body.endpoint === '')
      return jsonAntwort(400, { fehler: 'art test und endpoint erwartet' }, cors);
    auftrag = { art: 'test', istTim: tim === true, endpoint: body.endpoint };
  }

  const oeffentlich = Deno.env.get('VAPID_PUBLIC_KEY');
  const privat = Deno.env.get('VAPID_PRIVATE_KEY');
  const betreff = Deno.env.get('VAPID_SUBJECT');
  const quittung = Deno.env.get('PUSH_QUITTUNG_SCHLUESSEL');
  if (!oeffentlich || !privat || !betreff || !quittung)
    return jsonAntwort(503, { fehler: 'Push nicht eingerichtet' }, cors);
  webpush.setVapidDetails(betreff, oeffentlich, privat);

  const sender: Sender = {
    async senden(abo, nutzlast, optionen) {
      try {
        const r = await webpush.sendNotification(
          { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth_schluessel } },
          nutzlast,
          optionen,
        );
        return { status: r.statusCode };
      } catch (f) {
        return { status: (f as { statusCode?: number }).statusCode ?? 0 };
      }
    },
  };

  const ergebnis = await pushLauf(auftrag, {
    jetzt: new Date(),
    daten: supabaseDaten(dienst),
    sender,
    signieren: (text) => signieren(quittung, text),
  });
  const { http, ...zaehler } = ergebnis;
  return jsonAntwort(http, http === 204 ? null : zaehler, cors);
});
