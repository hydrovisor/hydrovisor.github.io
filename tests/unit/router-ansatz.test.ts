// Routen der Abhakliste und der Messung im Ablauf (Plan 29 Testliste router-ansatz, A18; 04_architektur.md 3).
// Ergänzt tests/unit/router.test.ts in einer eigenen Datei des Testentwicklers; die bestehenden Fälle bleiben.
//
// Vertrag (src/ui/router.ts):
//   | { name: 'ansatz'; code } ↔ #/ansatz/<code>
//   | { name: 'messen'; code; zeile?: 3 | 14 | 17; nachmessen?: <uuid> } ↔ #/messen/<code>?zeile=n bzw. ?nachmessen=<uuid>
//   fortsetzenZiel(route, offeneWechselCodes): #/e/<code> und #/ansatz/<code> mit offenem Wechsel → Abhakliste
import { describe, expect, it } from 'vitest';
import { fortsetzenZiel, hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const ANSATZ = '29000000-0000-4000-8000-000000000001';

describe('Route #/ansatz/:code', () => {
  it('Loesungswechsel-AK3 #/ansatz/R-2.3 hin und zurück', () => {
    const route: Route = { name: 'ansatz', code: 'R-2.3' };
    expect(routeAusHash('#/ansatz/R-2.3')).toEqual(route);
    expect(hashZu(route)).toBe('#/ansatz/R-2.3');
    expect(routeAusHash(hashZu(route))).toEqual(route);
    expect(maskeFuer(route, 'angemeldet')).toEqual(route);
    expect(maskeFuer(route, 'abgemeldet')).toEqual({ name: 'anmelden' });
  });
});

describe('Messung im Ablauf', () => {
  it('Loesungswechsel-AK1 #/messen/R-2.3?zeile=14 hin und zurück, ebenso Zeile 3 und 17', () => {
    for (const zeile of [3, 14, 17] as const) {
      const route: Route = { name: 'messen', code: 'R-2.3', zeile };
      expect(routeAusHash(`#/messen/R-2.3?zeile=${String(zeile)}`)).toEqual(route);
      expect(hashZu(route)).toBe(`#/messen/R-2.3?zeile=${String(zeile)}`);
      expect(routeAusHash(hashZu(route))).toEqual(route);
    }
  });

  it('Loesungswechsel-AK1 ungültige Zeile ergibt die Messmaske ohne Ablaufmodus', () => {
    for (const hash of [
      '#/messen/R-2.3?zeile=4',
      '#/messen/R-2.3?zeile=0',
      '#/messen/R-2.3?zeile=x',
      '#/messen/R-2.3?zeile=',
      '#/messen/R-2.3?zeile=14.5',
    ])
      expect(routeAusHash(hash), hash).toEqual({ name: 'messen', code: 'R-2.3' });
    expect(hashZu({ name: 'messen', code: 'R-2.3' })).toBe('#/messen/R-2.3');
  });

  it('Rundgang-AK3 #/messen/R-2.3?nachmessen=<uuid> hin und zurück', () => {
    const route: Route = { name: 'messen', code: 'R-2.3', nachmessen: ANSATZ };
    expect(routeAusHash(`#/messen/R-2.3?nachmessen=${ANSATZ}`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/messen/R-2.3?nachmessen=${ANSATZ}`);
    expect(routeAusHash(hashZu(route))).toEqual(route);
  });

  it('Rundgang-AK3 nachmessen ohne gültige UUID ergibt die Messmaske ohne Nachmessen', () => {
    for (const hash of [
      '#/messen/R-2.3?nachmessen=123',
      '#/messen/R-2.3?nachmessen=',
      `#/messen/R-2.3?nachmessen=${ANSATZ}x`,
    ])
      expect(routeAusHash(hash), hash).toEqual({ name: 'messen', code: 'R-2.3' });
  });
});

describe('fortsetzenZiel (A18)', () => {
  it('Loesungswechsel-AK3 #/e/R-2.3 mit offenem Wechsel an 2.3 führt zu #/ansatz/R-2.3', () => {
    const ziel = fortsetzenZiel(routeAusHash('#/e/R-2.3'), ['R-2.3']);
    expect(ziel).toEqual({ name: 'ansatz', code: 'R-2.3' });
    expect(hashZu(ziel)).toBe('#/ansatz/R-2.3');
  });

  it('Loesungswechsel-AK3 #/e/R-2.3 ohne offenen Wechsel bleibt unverändert', () => {
    const route = routeAusHash('#/e/R-2.3');
    expect(fortsetzenZiel(route, [])).toEqual(route);
    // offener Wechsel an einem anderen Platz
    expect(fortsetzenZiel(route, ['R-2.2'])).toEqual(route);
  });

  it('Loesungswechsel-AK3 mit offener Prüfung und offenem Wechsel geht der Wechsel vor', () => {
    // #/e/<code> führt sonst zur offenen Prüfung (Plan 21); der offene Wechsel kommt davor
    const route = routeAusHash('#/e/R-2.3');
    expect(route.name).toBe('etikett');
    expect(fortsetzenZiel(route, ['R-2.3'])).toEqual({ name: 'ansatz', code: 'R-2.3' });
    // auch eine Prüfroute an diesem Platz bleibt, wie sie ist, nur Etikett und Ansatz werden umgeleitet
    const pruefen = routeAusHash('#/pruefen/R-2.3');
    expect(fortsetzenZiel(pruefen, ['R-2.3'])).toEqual(pruefen);
  });

  it('Loesungswechsel-AK3 #/ansatz/R-2.3 bleibt die Abhakliste, mit und ohne offenen Wechsel', () => {
    expect(fortsetzenZiel(routeAusHash('#/ansatz/R-2.3'), ['R-2.3'])).toEqual({
      name: 'ansatz',
      code: 'R-2.3',
    });
    expect(fortsetzenZiel(routeAusHash('#/ansatz/R-2.3'), [])).toEqual({ name: 'ansatz', code: 'R-2.3' });
  });

  it('Loesungswechsel-AK3 Erstaufruf und hashchange werten dieselbe Funktion aus', () => {
    const offen = ['R-2.3'];
    const erst = fortsetzenZiel(routeAusHash('#/e/R-2.3'), offen);
    const wechsel = fortsetzenZiel(routeAusHash(hashZu({ name: 'etikett', code: 'R-2.3' })), offen);
    expect(wechsel).toEqual(erst);
  });
});
