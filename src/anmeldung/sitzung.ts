// Regeln der Anmeldung (Use Cases F4 UC0, docs/spec/04_architektur.md Abschnitt 9): eine Anmeldung je Gerät,
// danach keine erneute Anmeldung am Regal (UC0-AK7). Ohne Browser- oder Supabase-Abhängigkeit, damit testbar.

/** Schlüssel der Sitzung im localStorage (Option `storageKey` von supabase-js) */
export const SITZUNG_SCHLUESSEL = 'hydrovisor-sitzung';

export type Sitzungszustand = 'angemeldet' | 'abgemeldet';

/** Auth-Ereignisse von supabase-js, soweit sie den Zustand betreffen */
export type AuthEreignis =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_VERIFIED';

/**
 * Gilt der gespeicherte Wert als Sitzung? Wie supabase-js (`_isValidSession`): Zugriffs- und Erneuerungstoken
 * und Ablaufzeit vorhanden. Die Ablaufzeit selbst zählt nicht: Ein abgelaufenes Zugriffstoken erneuert
 * supabase-js, sobald Netz da ist.
 */
export function sitzungGespeichert(wert: string | null): boolean {
  if (!wert) return false;
  try {
    const s = JSON.parse(wert) as Record<string, unknown> | null;
    return (
      typeof s === 'object' &&
      s !== null &&
      typeof s['access_token'] === 'string' &&
      typeof s['refresh_token'] === 'string' &&
      s['refresh_token'] !== '' &&
      typeof s['expires_at'] === 'number'
    );
  } catch {
    return false;
  }
}

/**
 * Nutzer-ID der gespeicherten Sitzung, auch wenn das Zugriffstoken abgelaufen ist: getSession() liefert dann ohne Netz
 * keine Sitzung, das Bündel des Nutzers muss trotzdem lesbar bleiben (Plan 11, Runde 2 Befund N1).
 */
export function gespeicherteNutzerId(wert: string | null): string | undefined {
  if (!sitzungGespeichert(wert)) return undefined;
  const s = JSON.parse(wert as string) as { user?: { id?: unknown } };
  return typeof s.user?.id === 'string' && s.user.id !== '' ? s.user.id : undefined;
}

/**
 * Zustand nach einem Auth-Ereignis. Abgemeldet nur bei `SIGNED_OUT` oder wenn keine Sitzung mehr gespeichert ist:
 * Ohne Netz meldet supabase-js beim Start einer abgelaufenen Sitzung `INITIAL_SESSION` ohne Sitzung, lässt sie
 * aber im Speicher (Erneuerung scheitert nur vorübergehend). Diese Sitzung bleibt angemeldet.
 */
export function zustandNachEreignis(
  ereignis: AuthEreignis,
  mitSitzung: boolean,
  gespeichert: boolean,
): Sitzungszustand {
  if (ereignis === 'SIGNED_OUT') return 'abgemeldet';
  return mitSitzung || gespeichert ? 'angemeldet' : 'abgemeldet';
}

/** Fehler der Anmeldung in Tims Worten (Texte deutsch, Du-Form, ohne Ausrufezeichen) */
export function anmeldeFehlerText(fehler: {
  name?: string | undefined;
  status?: number | undefined;
  code?: string | undefined;
  message?: string | undefined;
}): string {
  if (
    fehler.code === 'invalid_credentials' ||
    (fehler.status === 400 && /invalid login/i.test(fehler.message ?? ''))
  )
    return 'E-Mail oder Passwort stimmt nicht.';
  if (fehler.name === 'AuthRetryableFetchError' || fehler.status === 0)
    return 'Kein Netz, nicht angemeldet. Versuche es erneut, sobald Netz da ist.';
  if (fehler.status === 429) return 'Zu viele Versuche. Warte einige Minuten und versuche es dann erneut.';
  const code = fehler.code ?? (fehler.status ? `HTTP ${fehler.status}` : undefined);
  return `Anmeldung nicht möglich. Versuche es später erneut.${code ? ` (${code})` : ''}`;
}
