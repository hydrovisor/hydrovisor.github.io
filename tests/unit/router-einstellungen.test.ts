// Routen Einstellungen und Notfallblatt (Plan 32). Routine: Tests vom Lead.
import { describe, expect, it } from 'vitest';
import { hashZu, routeAusHash } from '../../src/ui/router.ts';

describe('Routen Einstellungen und Notfallblatt (Plan 32)', () => {
  it('#/einstellungen und zurück', () => {
    expect(routeAusHash('#/einstellungen')).toEqual({ name: 'einstellungen' });
    expect(hashZu({ name: 'einstellungen' })).toBe('#/einstellungen');
  });

  it('#/notfallblatt mit und ohne Anlage; ungültiges Kürzel fällt weg', () => {
    expect(routeAusHash('#/notfallblatt')).toEqual({ name: 'notfallblatt' });
    expect(routeAusHash('#/notfallblatt?a=R')).toEqual({ name: 'notfallblatt', kuerzel: 'R' });
    expect(routeAusHash('#/notfallblatt?a=r-1')).toEqual({ name: 'notfallblatt' });
    expect(hashZu({ name: 'notfallblatt', kuerzel: 'T' })).toBe('#/notfallblatt?a=T');
    expect(hashZu({ name: 'notfallblatt' })).toBe('#/notfallblatt');
  });
});
