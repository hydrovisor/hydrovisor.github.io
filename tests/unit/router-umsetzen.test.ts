// Routen «Umsetzen» und «Verschieben» (Plan 33 Testliste; 04_architektur.md 3, A20). Eigene Datei des Testentwicklers
// neben router.test.ts, router-etikett.test.ts und router-keimung.test.ts; die bestehenden Fälle bleiben.
//
// Vertrag (Plan 33 «Betroffene Dateien»):
//   { name: 'umsetzen'; satz: string; wie?: 'geplant' } ↔ #/umsetzen/<uuid> bzw. #/umsetzen/<uuid>?wie=geplant
//   { name: 'verschieben'; topf: string } ↔ #/verschieben/R-2.3.1 (Topf-Code aus Kürzel und Topfkennung)
//   ungültige Satz-ID (keine UUID) oder ungültiger Topf-Code → Heute; ein anderer Wert für wie wird weggelassen.
import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const SATZ = '27000000-0000-4000-8000-000000008000';

describe('Route #/umsetzen/:satz und #/verschieben/:topf', () => {
  it('Route #/umsetzen/<uuid> und ?wie=geplant', () => {
    const route = { name: 'umsetzen', satz: SATZ } as unknown as Route;
    expect(routeAusHash(`#/umsetzen/${SATZ}`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/umsetzen/${SATZ}`);
    const geplant = { name: 'umsetzen', satz: SATZ, wie: 'geplant' } as unknown as Route;
    expect(routeAusHash(`#/umsetzen/${SATZ}?wie=geplant`)).toEqual(geplant);
    expect(hashZu(geplant)).toBe(`#/umsetzen/${SATZ}?wie=geplant`);
    expect(routeAusHash(hashZu(geplant))).toEqual(geplant);
    expect(routeAusHash(`#/umsetzen/${SATZ}?wie=sofort`)).toEqual(route);
    expect(maskeFuer(geplant, 'angemeldet')).toEqual(geplant);
    expect(maskeFuer(geplant, 'abgemeldet')).toEqual({ name: 'anmelden' });
  });

  it('Route #/verschieben/R-2.3.1', () => {
    const route = { name: 'verschieben', topf: 'R-2.3.1' } as unknown as Route;
    expect(routeAusHash('#/verschieben/R-2.3.1')).toEqual(route);
    expect(hashZu(route)).toBe('#/verschieben/R-2.3.1');
    expect(routeAusHash(hashZu(route))).toEqual(route);
    expect(maskeFuer(route, 'abgemeldet')).toEqual({ name: 'anmelden' });
  });

  it('ungültige Satz-ID oder Topf-Code → Heute', () => {
    for (const hash of [
      '#/umsetzen/',
      '#/umsetzen',
      '#/umsetzen/R-4.4',
      `#/umsetzen/${SATZ}x`,
      '#/verschieben/',
      '#/verschieben',
      '#/verschieben/2.3.1',
      '#/verschieben/r-2.3.1',
    ])
      expect(routeAusHash(hash), hash).toEqual({ name: 'heute' });
  });
});
