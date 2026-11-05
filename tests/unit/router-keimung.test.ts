// Route «Keimung prüfen» (Plan 24 Testliste, 04_architektur.md 3). Ergänzt tests/unit/router.test.ts und
// router-etikett.test.ts in einer eigenen Datei des Testentwicklers; die bestehenden Fälle bleiben.
//
// Vertrag (Plan 24 «Betroffene Dateien»): | { name: 'keimung'; satz: string } ↔ #/keimung/<uuid>; eine ungültige ID
// (keine UUID) führt nach Heute.
import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const SATZ = '27000000-0000-4000-8000-000000008000';

describe('UC6 Route #/keimung/:satz', () => {
  it('UC6 #/keimung/<uuid> hin und zurück', () => {
    const route = { name: 'keimung', satz: SATZ } as unknown as Route;
    expect(routeAusHash(`#/keimung/${SATZ}`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/keimung/${SATZ}`);
    expect(routeAusHash(hashZu(route))).toEqual(route);
    // mit Sitzung bleibt die Route, ohne Sitzung zur Anmeldung
    expect(maskeFuer(route, 'angemeldet')).toEqual(route);
    expect(maskeFuer(route, 'abgemeldet')).toEqual({ name: 'anmelden' });
  });

  it('UC6 ungültige ID → Heute', () => {
    for (const hash of ['#/keimung/', '#/keimung/R-A1', '#/keimung/123', `#/keimung/${SATZ}x`, '#/keimung'])
      expect(routeAusHash(hash), hash).toEqual({ name: 'heute' });
  });
});
