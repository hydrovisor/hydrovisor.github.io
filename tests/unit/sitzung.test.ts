import { describe, expect, it } from 'vitest';
import { anmeldeFehlerText, sitzungGespeichert, zustandNachEreignis } from '../../src/anmeldung/sitzung.ts';

const SITZUNG = { access_token: 'a.b.c', refresh_token: 'r1', expires_at: 1_000, user: { id: 'u' } };

describe('Gespeicherte Sitzung', () => {
  it('gilt mit Zugriffs- und Erneuerungstoken und Ablaufzeit, auch abgelaufen', () => {
    expect(sitzungGespeichert(JSON.stringify(SITZUNG))).toBe(true);
    expect(sitzungGespeichert(JSON.stringify({ ...SITZUNG, expires_at: 0 }))).toBe(true);
  });

  it('gilt nicht ohne Wert, mit kaputtem JSON oder fehlenden Feldern', () => {
    expect(sitzungGespeichert(null)).toBe(false);
    expect(sitzungGespeichert('')).toBe(false);
    expect(sitzungGespeichert('{kaputt')).toBe(false);
    expect(sitzungGespeichert('null')).toBe(false);
    expect(sitzungGespeichert('"text"')).toBe(false);
    expect(sitzungGespeichert(JSON.stringify({ ...SITZUNG, refresh_token: '' }))).toBe(false);
    expect(sitzungGespeichert(JSON.stringify({ ...SITZUNG, access_token: undefined }))).toBe(false);
    expect(sitzungGespeichert(JSON.stringify({ ...SITZUNG, expires_at: '1000' }))).toBe(false);
  });
});

describe('Zustand nach Auth-Ereignis', () => {
  it('UC0-AK7 Vorstufe: Start ohne Netz mit gespeicherter Sitzung bleibt angemeldet', () => {
    // supabase-js meldet INITIAL_SESSION ohne Sitzung, wenn die Erneuerung am Netz scheitert
    expect(zustandNachEreignis('INITIAL_SESSION', false, true)).toBe('angemeldet');
  });

  it('meldet an bei Sitzung aus Anmeldung, Erneuerung oder Start', () => {
    expect(zustandNachEreignis('SIGNED_IN', true, true)).toBe('angemeldet');
    expect(zustandNachEreignis('TOKEN_REFRESHED', true, true)).toBe('angemeldet');
    expect(zustandNachEreignis('INITIAL_SESSION', true, true)).toBe('angemeldet');
  });

  it('meldet ab bei SIGNED_OUT, auch wenn noch etwas gespeichert ist', () => {
    expect(zustandNachEreignis('SIGNED_OUT', false, false)).toBe('abgemeldet');
    expect(zustandNachEreignis('SIGNED_OUT', false, true)).toBe('abgemeldet');
  });

  it('bleibt abgemeldet ohne Sitzung und ohne Gespeichertes', () => {
    expect(zustandNachEreignis('INITIAL_SESSION', false, false)).toBe('abgemeldet');
  });
});

describe('Fehlertext der Anmeldung', () => {
  it('falsche Zugangsdaten', () => {
    expect(
      anmeldeFehlerText({ status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' }),
    ).toBe('E-Mail oder Passwort stimmt nicht.');
    expect(anmeldeFehlerText({ status: 400, message: 'Invalid login credentials' })).toBe(
      'E-Mail oder Passwort stimmt nicht.',
    );
  });

  it('kein Netz', () => {
    expect(
      anmeldeFehlerText({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }),
    ).toBe('Kein Netz, nicht angemeldet. Versuche es erneut, sobald Netz da ist.');
  });

  it('zu viele Versuche und Unbekanntes ohne Ausrufezeichen', () => {
    expect(anmeldeFehlerText({ status: 429, message: 'rate limit' })).toMatch(/^Zu viele Versuche/);
    const text = anmeldeFehlerText({ status: 500, message: 'Database error' });
    expect(text).toBe('Anmeldung nicht möglich: Database error');
    expect(text).not.toContain('!');
  });
});
