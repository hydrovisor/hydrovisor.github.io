// Hülle der Edge Function ki-tuete (Plan 14, Datenfluss): CORS, Token und ist_tim(), Fotos aus dem Bucket
// saattueten mit dem Benutzer-Token, ki_aufruf mit der Service-Rolle, Secret ANTHROPIC_API_KEY. Die Fachlogik steht
// in kern.ts; diese Datei hat keine eigenen Tests (Deno-Tests ohne Netz und ohne Secrets, 06_tests.md 1).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { BASIS_URL } from '../../../src/adressen.ts';
import { BILD_KANTE_MAX } from '../../../src/domain/ki/modelle.ts';
import type { KiEingabe } from '../../../src/domain/ki/anfrage.ts';
import { hinweisVonHand, type KiErgebnis } from '../../../src/domain/ki/uebernahme.ts';
import { ZEITZONE } from '../../../src/domain/zeit.ts';
import { jpegMasse } from './jpeg.ts';
import { anfragePruefen, tueteLesen, type KiDaten, type Zeitgeber } from './kern.ts';
import { anthropicRufer } from './modell.ts';

const BUCKET = 'saattueten';
const URSPRUNG = new URL(BASIS_URL).origin;
// erlaubte Ursprünge (A8): Produktion, Vorschau je Zweig, lokale Entwicklung
const ERLAUBT = [/^https:\/\/([a-z0-9-]+\.)?hydrovisor-vorschau\.pages\.dev$/, /^http:\/\/localhost(:\d+)?$/];

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
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

function base64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
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

  // Körper höchstens 64 KB vor dem Parsen (Prüfer Sicherheit, Befund 2); Text bis 8000 Zeichen passt gut hinein
  const laenge = Number(req.headers.get('content-length') ?? '0');
  if (!Number.isFinite(laenge) || laenge > 64 * 1024)
    return antwort(413, { fehler: 'Körper zu gross' }, cors);

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 64 * 1024) return antwort(413, { fehler: 'Körper zu gross' }, cors);
    body = JSON.parse(text);
  } catch {
    return antwort(400, { fehler: 'Körper ist kein JSON' }, cors);
  }
  const anfrage = anfragePruefen(body);
  if ('fehler' in anfrage) return antwort(400, anfrage, cors);

  const schluessel = Deno.env.get('ANTHROPIC_API_KEY');
  if (!schluessel) {
    // A10: ohne Secret keine Zeile ki_aufruf und kein Request
    const ergebnis: KiErgebnis = {
      ergebnis: 'von_hand',
      grund: 'nicht_eingerichtet',
      hinweis: hinweisVonHand('nicht_eingerichtet'),
      dauerMs: 0,
    };
    return antwort(200, ergebnis, cors);
  }

  let eingabe: KiEingabe;
  if ('fotopfade' in anfrage) {
    const bilder: { base64: string }[] = [];
    for (const pfad of anfrage.fotopfade) {
      const { data, error } = await benutzer.storage.from(BUCKET).download(pfad);
      if (error || !data) return antwort(400, { fehler: `Foto nicht lesbar: ${pfad}` }, cors);
      const bytes = new Uint8Array(await data.arrayBuffer());
      const masse = jpegMasse(bytes);
      if (!masse) return antwort(400, { fehler: `kein JPEG: ${pfad}` }, cors);
      if (Math.max(masse.breite, masse.hoehe) > BILD_KANTE_MAX)
        return antwort(400, { fehler: `Foto grösser als ${BILD_KANTE_MAX} px: ${pfad}` }, cors);
      bilder.push({ base64: base64(bytes) });
    }
    eingabe = { art: 'bilder', bilder };
  } else {
    eingabe = { art: 'text', text: anfrage.text };
  }

  const dienstClient = createClient(url, dienst, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const daten: KiDaten = {
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
        .insert({ modell: z.modell, app_version: z.app_version, status: 'gestartet' })
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message ?? 'ki_aufruf ohne id');
      return (data as { id: string }).id;
    },
    async aufrufBeenden(id, z) {
      const { error } = await dienstClient.from('ki_aufruf').update(z).eq('id', id);
      if (error) throw new Error(error.message);
    },
  };

  const ergebnis = await tueteLesen(eingabe, anfrage.appVersion, {
    daten,
    modell: anthropicRufer(fetch, schluessel),
    zeit,
    zeitzone: ZEITZONE,
  });
  return antwort(200, ergebnis, cors);
});
