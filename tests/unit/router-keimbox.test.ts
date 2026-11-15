// Route «Keimung je Box» (Issue #227, Plan 227 A1; Vorbedingung von UX5-AK3). Ergänzt tests/unit/router-keimung.test.ts
// in einer eigenen Datei des Testentwicklers; die bestehenden Fälle bleiben.
//
// Vertrag (Plan 227 «Betroffene Dateien»): | { name: 'keimung-box'; code: string } ↔ #/keimung/box/<code> mit dem Code
// der Box (Kürzel und Kennung, «R-A1»); ein ungültiger Code führt nach Heute; #/keimung/<uuid> bleibt die Route je Satz.
import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const SATZ = '27000000-0000-4000-8000-000000008000';

describe('UX5 Route #/keimung/box/:code', () => {
  it("UX5-AK3 #/keimung/box/R-A1 ergibt { name: 'keimung-box', code: 'R-A1' } und zurück; ungültiger Code führt nach Heute; #/keimung/<uuid> bleibt die Route je Satz", () => {
    const route = { name: 'keimung-box', code: 'R-A1' } as unknown as Route;
    expect(routeAusHash('#/keimung/box/R-A1')).toEqual(route);
    expect(hashZu(route)).toBe('#/keimung/box/R-A1');
    expect(routeAusHash(hashZu(route))).toEqual(route);
    expect(routeAusHash('#/keimung/box/Z-A1')).toEqual({ name: 'keimung-box', code: 'Z-A1' });
    // mit Sitzung bleibt die Route, ohne Sitzung zur Anmeldung
    expect(maskeFuer(route, 'angemeldet')).toEqual(route);
    expect(maskeFuer(route, 'abgemeldet')).toEqual({ name: 'anmelden' });

    // ungültiger Code → Heute
    for (const hash of [
      '#/keimung/box/',
      '#/keimung/box',
      '#/keimung/box/r-a1',
      '#/keimung/box/A1',
      '#/keimung/box/R-A1/x',
      '#/keimung/box/R A1',
    ])
      expect(routeAusHash(hash), hash).toEqual({ name: 'heute' });

    // die Route je Satz bleibt unverändert
    const satz = { name: 'keimung', satz: SATZ } as unknown as Route;
    expect(routeAusHash(`#/keimung/${SATZ}`)).toEqual(satz);
    expect(hashZu(satz)).toBe(`#/keimung/${SATZ}`);
  });
});
