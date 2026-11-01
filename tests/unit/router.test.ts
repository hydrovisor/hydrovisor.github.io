import { describe, expect, it } from 'vitest';
import { hashZu, routeAusHash } from '../../src/ui/router.ts';

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
});
