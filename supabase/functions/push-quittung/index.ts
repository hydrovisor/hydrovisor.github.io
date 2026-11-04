// Hülle der Edge Function push-quittung (Plan 13; 04_architektur.md 5): ohne Sitzung, die Signatur über die
// versand_id genügt (Secret PUSH_QUITTUNG_SCHLUESSEL). Setzt angezeigt_am bzw. geoeffnet_am nur, wenn leer.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsKopf, jsonAntwort } from '../_shared/cors.ts';
import { pruefen } from '../_shared/hmac.ts';
import { quittieren } from './kern.ts';

Deno.serve(async (req) => {
  const cors = corsKopf(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return jsonAntwort(405, { fehler: 'nur POST' }, cors);
  const schluessel = Deno.env.get('PUSH_QUITTUNG_SCHLUESSEL');
  if (!schluessel) return jsonAntwort(503, { fehler: 'Push nicht eingerichtet' }, cors);

  let anfrage: Parameters<typeof quittieren>[0];
  try {
    const text = await req.text();
    if (text.length > 4096) return jsonAntwort(413, { fehler: 'Körper zu gross' }, cors);
    anfrage = JSON.parse(text) as typeof anfrage;
  } catch {
    return jsonAntwort(400, { fehler: 'Körper ist kein JSON' }, cors);
  }

  const dienst = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { http } = await quittieren(anfrage, {
    jetzt: new Date(),
    pruefen: (text, sig) => pruefen(schluessel, text, sig),
    setzen: async (id, feld, zeit) => {
      const { error } = await dienst
        .from('push_versand')
        .update({ [feld]: zeit.toISOString() })
        .eq('id', id)
        .is(feld, null);
      if (error) throw new Error(error.message);
    },
  });
  return jsonAntwort(http, null, cors);
});
