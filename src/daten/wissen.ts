// Wissenszeilen aus der App über wissen_app_schreiben() (Konzept 8.1 Regel 6; Plan 37). Aufrufe nacheinander mit
// Zeitlimit; ein Fehler hält an und meldet, wie viele erledigt sind, damit «Erneut speichern» dort fortsetzt (A14).
import { fehlerEinordnen, type RohFehler, type Schreibfehler } from '../domain/datenpfad/fehler.ts';
import type { WissenAufruf } from '../domain/sorten/erfassung.ts';
import { ZEITLIMIT_MS, erfolgMelden } from './schreiben.ts';
import { supabase } from './supabase.ts';

export type Wissensergebnis =
  | { status: 'gespeichert'; ids: (string | null)[] }
  | { status: 'nicht_gespeichert'; erledigt: number; fehler: Schreibfehler };

/** «schon vorhanden» bei art_neu gilt als erledigt (Wiederholung nach halbem Speichern, A14) */
const SCHON_DA = '23505';

export async function wissenSchreiben(aufrufe: readonly WissenAufruf[], ab = 0): Promise<Wissensergebnis> {
  const ids: (string | null)[] = [];
  for (let i = ab; i < aufrufe.length; i++) {
    const a = aufrufe[i];
    if (!a) continue;
    const steuerung = new AbortController();
    const uhr = setTimeout(() => steuerung.abort(), ZEITLIMIT_MS);
    try {
      const { data, error, status } = await supabase
        .rpc('wissen_app_schreiben', { aktion: a.aktion, daten: a.daten as never })
        .abortSignal(steuerung.signal);
      if (error) {
        if (a.aktion === 'art_neu' && error.code === SCHON_DA) {
          ids.push(null);
          continue;
        }
        const roh: RohFehler = { message: error.message, code: error.code, status };
        return { status: 'nicht_gespeichert', erledigt: i, fehler: fehlerEinordnen(roh) };
      }
      ids.push(typeof data === 'string' ? data : null);
    } catch (e) {
      const roh: RohFehler =
        e instanceof Error ? { name: e.name, message: e.message } : { message: String(e) };
      return { status: 'nicht_gespeichert', erledigt: i, fehler: fehlerEinordnen(roh) };
    } finally {
      clearTimeout(uhr);
    }
  }
  erfolgMelden();
  return { status: 'gespeichert', ids };
}
