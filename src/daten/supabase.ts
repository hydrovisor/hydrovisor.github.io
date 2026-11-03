// Ein Supabase-Client für die ganze App (docs/spec/04_architektur.md Abschnitte 4 und 9).
// Sitzung im localStorage ohne Zeitbegrenzung, kein Magic Link (Use Cases F4 UC0).
import { createClient } from '@supabase/supabase-js';
import { SITZUNG_SCHLUESSEL } from '../anmeldung/sitzung.ts';
import type { Database } from './datenbank.types.ts';

// Ohne Werte die Adresse von `supabase start`; deploy.yml und die Vorschau setzen sie immer (Plan 8, A1)
const LOKAL_URL = 'http://127.0.0.1:54321';
const LOKAL_SCHLUESSEL = 'lokal-ohne-schluessel';

export const SUPABASE_URL: string = import.meta.env['VITE_SUPABASE_URL'] || LOKAL_URL;
const SCHLUESSEL: string = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || LOKAL_SCHLUESSEL;

export const supabase = createClient<Database>(SUPABASE_URL, SCHLUESSEL, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: SITZUNG_SCHLUESSEL,
    detectSessionInUrl: false,
  },
});
