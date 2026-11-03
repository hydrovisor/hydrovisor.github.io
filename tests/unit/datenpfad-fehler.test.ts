// Fehler einordnen (Plan 11 Abschnitt «Fehler und Konflikte», Testliste; Konzept 11.4). Je Zeile der Tabelle ein Fall.
// Die Rohfehler haben die Form von supabase-js (postgrest-js): Netzfehler als message «<Name>: <Text>» mit status 0.
import { describe, expect, it } from 'vitest';
import { fehlerEinordnen, type RohFehler, type Schreibfehler } from '../../src/domain/datenpfad/fehler.ts';

const KEIN_NETZ = 'Kein Netz, nicht gespeichert, erneut senden';
const SERVER = 'Server nicht erreichbar, nicht gespeichert, erneut senden';
const ANMELDUNG = 'Anmeldung wird erneuert, nicht gespeichert, erneut senden';
const KEIN_ZUGANG = 'Nicht gespeichert: kein Zugang für dieses Konto';

const fall = (roh: RohFehler): Schreibfehler => fehlerEinordnen(roh);

describe('fehlerEinordnen', () => {
  it('kein Netz: TypeError, «Failed to fetch» oder Status 0', () => {
    const faelle: RohFehler[] = [
      { name: 'TypeError', message: 'Failed to fetch' },
      { message: 'TypeError: Failed to fetch', code: '', status: 0 },
      { message: 'FetchError: network error', code: '', status: 0 },
      { status: 0 },
    ];
    for (const roh of faelle) {
      const f = fall(roh);
      expect(f.art, JSON.stringify(roh)).toBe('kein_netz');
      expect(f.wiederholbar).toBe(true);
      expect(f.text).toBe(KEIN_NETZ);
    }
  });

  it('Antwort verloren, Zeitlimit (AbortError): unklar, wiederholbar, gleicher Text wie kein Netz (A4)', () => {
    const faelle: RohFehler[] = [
      { name: 'AbortError', message: 'This operation was aborted' },
      { message: 'AbortError: signal is aborted without reason', code: '', status: 0 },
    ];
    for (const roh of faelle) {
      const f = fall(roh);
      expect(f.art, JSON.stringify(roh)).toBe('unklar');
      expect(f.wiederholbar).toBe(true);
      expect(f.text).toBe(KEIN_NETZ);
    }
  });

  it('Server überlastet: 408, 429 und 5xx', () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      const f = fall({ status, message: 'upstream' });
      expect(f.art, String(status)).toBe('server');
      expect(f.wiederholbar).toBe(true);
      expect(f.text).toBe(SERVER);
    }
  });

  it('Token abgelaufen: 401, PGRST301 und PGRST303 ergeben anmeldung, wiederholbar', () => {
    const faelle: RohFehler[] = [
      { status: 401, message: 'JWT expired' },
      { status: 401, code: 'PGRST301', message: 'JWT expired' },
      { status: 401, code: 'PGRST303', message: 'JWT expired' },
    ];
    for (const roh of faelle) {
      const f = fall(roh);
      expect(f.art, JSON.stringify(roh)).toBe('anmeldung');
      expect(f.wiederholbar).toBe(true);
      expect(f.text).toBe(ANMELDUNG);
    }
  });

  it('kein Zugang (RLS 42501): abgelehnt, nicht wiederholbar', () => {
    const f = fall({
      status: 403,
      code: '42501',
      message: 'new row violates row-level security policy for table "messung"',
    });
    expect(f).toMatchObject({ art: 'abgelehnt', wiederholbar: false, code: '42501' });
    expect(f.text).toBe(KEIN_ZUGANG);
  });

  it('Regel der Datenbank verletzt: 23505, 23503, 23514, 22P02 und PGRST2xx ergeben abgelehnt mit Grund', () => {
    const faelle: RohFehler[] = [
      { status: 409, code: '23505', message: 'duplicate key value violates unique constraint "x"' },
      { status: 409, code: '23503', message: 'insert or update violates foreign key constraint' },
      { status: 400, code: '23514', message: 'new row violates check constraint "messung_check"' },
      { status: 400, code: '22P02', message: 'invalid input syntax for type uuid' },
      { status: 400, code: 'PGRST204', message: "Could not find the 'phx' column" },
    ];
    for (const roh of faelle) {
      const f = fall(roh);
      expect(f.art, roh.code).toBe('abgelehnt');
      expect(f.wiederholbar, roh.code).toBe(false);
      expect(f.code, roh.code).toBe(roh.code);
      expect(f.text, roh.code).toMatch(/^Nicht gespeichert: \S/);
    }
  });

  it('ein unbekannter Code ergibt abgelehnt mit dem Code im Text', () => {
    const f = fall({ status: 400, code: 'XX999', message: 'etwas Unbekanntes' });
    expect(f.art).toBe('abgelehnt');
    expect(f.wiederholbar).toBe(false);
    expect(f.text).toContain('XX999');
    expect(f.text).toMatch(/^Nicht gespeichert/);
  });

  it('alle Texte sagen «nicht gespeichert» und haben kein Ausrufezeichen', () => {
    const roh: RohFehler[] = [
      { name: 'TypeError', message: 'Failed to fetch' },
      { name: 'AbortError', message: 'aborted' },
      { status: 503 },
      { status: 401, code: 'PGRST301' },
      { status: 403, code: '42501' },
      { status: 409, code: '23505' },
      { status: 409, code: '23503' },
      { status: 400, code: '23514' },
      { status: 400, code: '22P02' },
      { status: 400, code: 'PGRST204' },
      { status: 400, code: 'XX999' },
    ];
    for (const r of roh) {
      const { text } = fall(r);
      expect(text, JSON.stringify(r)).toMatch(/[Nn]icht gespeichert/);
      expect(text, JSON.stringify(r)).not.toContain('!');
    }
  });
});
