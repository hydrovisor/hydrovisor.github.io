import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash } from '../../src/ui/router.ts';

describe('Hash-Router', () => {
  it('erkennt #/heute und #/info', () => {
    expect(routeAusHash('#/heute')).toEqual({ name: 'heute' });
    expect(routeAusHash('#/info')).toEqual({ name: 'info' });
  });

  it('führt leere und unbekannte Routen nach Heute', () => {
    expect(routeAusHash('')).toEqual({ name: 'heute' });
    expect(routeAusHash('#/')).toEqual({ name: 'heute' });
    expect(routeAusHash('#/gibt-es-nicht')).toEqual({ name: 'heute' });
  });

  it('übergeht die Abfrage nach dem Pfad', () => {
    expect(routeAusHash('#/info?x=1')).toEqual({ name: 'info' });
  });

  it('bildet den Hash aus der Route', () => {
    expect(hashZu({ name: 'info' })).toBe('#/info');
    expect(routeAusHash(hashZu({ name: 'heute' }))).toEqual({ name: 'heute' });
  });

  it('erkennt #/anmelden', () => {
    expect(routeAusHash('#/anmelden')).toEqual({ name: 'anmelden' });
    expect(hashZu({ name: 'anmelden' })).toBe('#/anmelden');
  });
});

describe('Maske nach Sitzung', () => {
  it('ohne Sitzung führt jede Route ausser Info zur Anmeldung', () => {
    expect(maskeFuer({ name: 'heute' }, 'abgemeldet')).toEqual({ name: 'anmelden' });
    expect(maskeFuer({ name: 'anmelden' }, 'abgemeldet')).toEqual({ name: 'anmelden' });
    expect(maskeFuer({ name: 'info' }, 'abgemeldet')).toEqual({ name: 'info' });
  });

  it('mit Sitzung führt die Anmeldung nach Heute, andere Routen bleiben', () => {
    expect(maskeFuer({ name: 'anmelden' }, 'angemeldet')).toEqual({ name: 'heute' });
    expect(maskeFuer({ name: 'heute' }, 'angemeldet')).toEqual({ name: 'heute' });
    expect(maskeFuer({ name: 'info' }, 'angemeldet')).toEqual({ name: 'info' });
  });
});
