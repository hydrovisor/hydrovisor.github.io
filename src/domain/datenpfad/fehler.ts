// Fehler beim Schreiben einordnen (Plan 11 «Fehler und Konflikte»; Konzept 11.4: nie still verwerfen).
// Rohfehler in der Form von supabase-js; Netzfehler kommen als «<Name>: <Text>» mit status 0.
export type Fehlerart = 'kein_netz' | 'unklar' | 'server' | 'anmeldung' | 'abgelehnt';

export interface RohFehler {
  name?: string;
  message?: string;
  status?: number;
  code?: string;
}

export interface Schreibfehler {
  art: Fehlerart;
  wiederholbar: boolean;
  code?: string;
  text: string;
}

export const TEXT_KEIN_NETZ = 'Kein Netz, nicht gespeichert, erneut senden';
const TEXT_SERVER = 'Server nicht erreichbar, nicht gespeichert, erneut senden';
const TEXT_ANMELDUNG = 'Anmeldung wird erneuert, nicht gespeichert, erneut senden';

/** Grund in Tims Worten je PostgreSQL- oder PostgREST-Code */
const GRUND: Readonly<Record<string, string>> = {
  '42501': 'kein Zugang für dieses Konto',
  '23505': 'ein gleicher Eintrag ist schon gespeichert',
  '23503': 'ein verknüpfter Eintrag fehlt',
  '23502': 'ein Pflichtwert fehlt',
  '23514': 'ein Wert verletzt eine Regel der Datenbank',
  '22P02': 'ein Wert hat das falsche Format',
};

const hat = (roh: RohFehler, name: string) => roh.name === name || (roh.message ?? '').startsWith(`${name}:`);

export function fehlerEinordnen(roh: RohFehler): Schreibfehler {
  // Abbruch durch das Zeitlimit vor Status 0: Der Server kann gespeichert haben (A4)
  if (hat(roh, 'AbortError')) return { art: 'unklar', wiederholbar: true, text: TEXT_KEIN_NETZ };
  if (
    hat(roh, 'TypeError') ||
    hat(roh, 'FetchError') ||
    (roh.message ?? '').includes('Failed to fetch') ||
    roh.status === 0
  )
    return { art: 'kein_netz', wiederholbar: true, text: TEXT_KEIN_NETZ };
  const status = roh.status ?? 0;
  if (status === 401 || roh.code === 'PGRST301' || roh.code === 'PGRST303')
    return { art: 'anmeldung', wiederholbar: true, text: TEXT_ANMELDUNG };
  if (status === 408 || status === 429 || status >= 500)
    return { art: 'server', wiederholbar: true, text: TEXT_SERVER };
  const code = roh.code || `HTTP ${status}`;
  const grund =
    GRUND[code] ?? (code.startsWith('PGRST2') ? 'die Eingabe passt nicht zur Datenbank' : `Fehler ${code}`);
  return { art: 'abgelehnt', wiederholbar: false, code, text: `Nicht gespeichert: ${grund}` };
}
