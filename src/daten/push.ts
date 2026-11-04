// Push im Browser (Plan 13 «Client»; 11.3, T2): Abo einrichten, beim Start mit push_abo abgleichen, Test-Push
// über die Function push-taeglich anfordern. Die Browser-APIs kommen als Parameter, damit die Regeln testbar sind.
import { supabase, SUPABASE_URL } from './supabase.ts';
import type { AboEingabe } from './schreiben.ts';

type AboErgebnis = { status: 'gespeichert' } | { status: 'nicht_gespeichert'; fehler: unknown };

interface BrowserAbo {
  endpoint: string;
  toJSON(): { endpoint?: string; keys?: Record<string, string> };
}

interface PushVerwalter {
  getSubscription(): Promise<BrowserAbo | null>;
}

/** öffentlicher VAPID-Schlüssel aus dem Build; ohne ihn ist Push in dieser Umgebung nicht verfügbar */
export const VAPID_OEFFENTLICH: string = import.meta.env['VITE_VAPID_PUBLIC_KEY'] ?? '';

/** Push-Fähigkeit des Browsers (Service Worker und PushManager), unabhängig vom VAPID-Schlüssel */
export function pushUnterstuetzt(): boolean {
  return (
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof PushManager !== 'undefined'
  );
}

/** kurze Gerätebeschreibung ohne Personendaten, z. B. «Android · Chrome 131» (A10) */
export function geraetBeschreibung(agent: string): string {
  const system = /Android/.test(agent)
    ? 'Android'
    : /iPhone|iPad/.test(agent)
      ? 'iOS'
      : /Windows/.test(agent)
        ? 'Windows'
        : /Mac OS/.test(agent)
          ? 'macOS'
          : /Linux/.test(agent)
            ? 'Linux'
            : 'Gerät';
  const chrome = /Chrome\/(\d+)/.exec(agent);
  return chrome ? `${system} · Chrome ${chrome[1]}` : system;
}

function eingabeAus(abo: BrowserAbo, geraet: string): AboEingabe | undefined {
  const keys = abo.toJSON().keys ?? {};
  if (!keys['p256dh'] || !keys['auth']) return undefined;
  return { endpoint: abo.endpoint, p256dh: keys['p256dh'], auth_schluessel: keys['auth'], geraet };
}

/** Beim Start: fehlt der Endpoint des Browsers in push_abo oder ist er inaktiv, neu speichern (11.3) */
export async function aboAbgleichen(e: {
  pushManager: PushVerwalter;
  abos: readonly { endpoint: string; aktiv: boolean }[];
  aboSchreiben: (abo: AboEingabe) => Promise<AboErgebnis>;
  geraet: string;
}): Promise<AboErgebnis | undefined> {
  const abo = await e.pushManager.getSubscription();
  if (!abo) return undefined;
  if (e.abos.some((a) => a.endpoint === abo.endpoint && a.aktiv)) return undefined;
  const eingabe = eingabeAus(abo, e.geraet);
  return eingabe ? e.aboSchreiben(eingabe) : undefined;
}

function schluesselBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64url.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (z) => z.charCodeAt(0));
}

/** «Push einrichten»: Berechtigung, Browser-Abo mit VAPID-Schlüssel, Abo speichern */
export async function aboEinrichten(
  aboSchreiben: (abo: AboEingabe) => Promise<AboErgebnis>,
): Promise<'eingerichtet' | 'verweigert' | 'nicht_verfuegbar' | 'nicht_gespeichert'> {
  if (!VAPID_OEFFENTLICH || !pushUnterstuetzt()) return 'nicht_verfuegbar';
  const berechtigung = await Notification.requestPermission();
  if (berechtigung !== 'granted') return 'verweigert';
  const registrierung = await navigator.serviceWorker.ready;
  const abo =
    (await registrierung.pushManager.getSubscription()) ??
    (await registrierung.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: schluesselBytes(VAPID_OEFFENTLICH),
    }));
  const eingabe = eingabeAus(abo as unknown as BrowserAbo, geraetBeschreibung(navigator.userAgent));
  if (!eingabe) return 'nicht_gespeichert';
  const r = await aboSchreiben(eingabe);
  return r.status === 'gespeichert' ? 'eingerichtet' : 'nicht_gespeichert';
}

/** Endpoint des Browser-Abos dieses Geräts oder null */
export async function eigenerEndpoint(): Promise<string | null> {
  if (!pushUnterstuetzt()) return null;
  const registrierung = await navigator.serviceWorker.getRegistration();
  return (await registrierung?.pushManager.getSubscription())?.endpoint ?? null;
}

/** Test-Push an das Abo dieses Geräts (T2, A7) */
export async function testPushSenden(): Promise<'gesendet' | 'kein_abo' | 'fehler'> {
  const endpoint = await eigenerEndpoint();
  if (!endpoint) return 'kein_abo';
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return 'fehler';
  try {
    const antwort = await fetch(`${SUPABASE_URL}/functions/v1/push-taeglich`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ art: 'test', endpoint }),
    });
    return antwort.ok ? 'gesendet' : 'fehler';
  } catch {
    return 'fehler';
  }
}
