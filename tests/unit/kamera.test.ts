// Baustein Kamera: Fehler von getUserMedia → Meldung (Plan kamera A4; KA1-AK2)
import { describe, expect, it } from 'vitest';
import { KAMERA_FEHLER_TEXT, kameraFehler } from '../../src/ui/bausteine/Kamera.tsx';

describe('kameraFehler', () => {
  it('KA1-AK2 verweigerte Freigabe → «verweigert»', () => {
    expect(kameraFehler({ name: 'NotAllowedError' })).toBe('verweigert');
    expect(kameraFehler({ name: 'SecurityError' })).toBe('verweigert');
  });
  it('KA1-AK2 keine Kamera → «fehlt»', () => {
    expect(kameraFehler({ name: 'NotFoundError' })).toBe('fehlt');
    expect(kameraFehler({ name: 'OverconstrainedError' })).toBe('fehlt');
  });
  it('KA1-AK2 alles andere → «unbekannt»', () => {
    expect(kameraFehler({ name: 'NotReadableError' })).toBe('unbekannt');
    expect(kameraFehler(new Error('x'))).toBe('unbekannt');
    expect(kameraFehler(null)).toBe('unbekannt');
    expect(kameraFehler('kaputt')).toBe('unbekannt');
  });
  it('KA1-AK2 jede Meldung nennt einen Ausweg, Schweizer Rechtschreibung, ohne Ausrufezeichen', () => {
    for (const text of Object.values(KAMERA_FEHLER_TEXT)) {
      expect(text).toMatch(/einzeln|Galerie/);
      expect(text).not.toMatch(/ß|!/);
    }
  });
});
