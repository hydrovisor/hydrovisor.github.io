// Route «Pflanze» (Plan 35 Testliste, 04_architektur.md 3: #/pflanze/:pflanzung). Ergänzt tests/unit/router.test.ts,
// router-etikett.test.ts und router-keimung.test.ts in einer eigenen Datei des Testentwicklers; die bestehenden
// Fälle bleiben.
//
// Vertrag (Plan 35 «Betroffene Dateien»): | { name: 'pflanze'; pflanzung: string } ↔ #/pflanze/<uuid>; eine ungültige
// ID (keine UUID) führt nach Heute.
import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const PFLANZUNG = '28000000-0000-4000-8000-000000006101';

describe('R1.5 Route #/pflanze/:pflanzung', () => {
  it('R1.5 #/pflanze/<uuid> hin und zurück', () => {
    const route = { name: 'pflanze', pflanzung: PFLANZUNG } as unknown as Route;
    expect(routeAusHash(`#/pflanze/${PFLANZUNG}`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/pflanze/${PFLANZUNG}`);
    expect(routeAusHash(hashZu(route))).toEqual(route);
    expect(maskeFuer(route, 'angemeldet')).toEqual(route);
    expect(maskeFuer(route, 'abgemeldet')).toEqual({ name: 'anmelden' });
  });

  it('R1.5 ungültige ID → Heute', () => {
    for (const hash of [
      '#/pflanze/',
      '#/pflanze/R-4.4',
      '#/pflanze/123',
      `#/pflanze/${PFLANZUNG}x`,
      '#/pflanze',
    ])
      expect(routeAusHash(hash), hash).toEqual({ name: 'heute' });
  });
});
