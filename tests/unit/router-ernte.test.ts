// Routen des Erntekalenders (Issue #232, Plan 232 Testliste router-ernte.test.ts; Entscheid 0026; UC15-AK6, UC15-AK7).
// Vertrag (Plan 232 «Betroffene Dateien»):
// - src/ui/router.ts: | { name: 'ernte'; satz?: string } ↔ #/ernte und #/ernte/<satz-uuid>; eine ungültige Auswahl zeigt
//   den Kalender ohne Feld ({ name: 'ernte' }). | { name: 'pflanze'; pflanzung: string; von?: 'ernte' } ↔
//   #/pflanze/<uuid>?von=ernte; ein anderer Wert von «von» fällt weg.
// - src/ui/leiste.ts: leisteZiel({ name: 'ernte' }) = 'ernte' (auch mit Auswahl, Plan A16); Säen Schritt 1 ausserhalb
//   des Ablaufs = 'saatgut'.
import { describe, expect, it } from 'vitest';
import { leisteZiel } from '../../src/ui/leiste.ts';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const SATZ = '27000000-0000-4000-8000-000000000091';
const PFLANZUNG = '28000000-0000-4000-8000-000000009101';

// Routen über unknown, damit der Test vor der Umsetzung lädt
const r = (route: Record<string, unknown>) => route as unknown as Route;

describe('UC15-AK7 Route #/ernte und #/ernte/<satz>', () => {
  it('UC15-AK7 #/ernte ergibt { name: ernte }, hin und zurück', () => {
    expect(routeAusHash('#/ernte')).toEqual({ name: 'ernte' });
    expect(hashZu(r({ name: 'ernte' }))).toBe('#/ernte');
    expect(hashZu(routeAusHash('#/ernte'))).toBe('#/ernte');
  });

  it('UC15-AK7 #/ernte/<uuid> trägt die Auswahl des Satzes, hin und zurück', () => {
    const route = r({ name: 'ernte', satz: SATZ });
    expect(routeAusHash(`#/ernte/${SATZ}`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/ernte/${SATZ}`);
    expect(routeAusHash(hashZu(route))).toEqual(route);
  });

  it('UC15-AK7 ungültige Auswahl (keine UUID) zeigt den Kalender ohne Feld', () => {
    for (const hash of ['#/ernte/R-2.3', '#/ernte/123', `#/ernte/${SATZ}x`, '#/ernte/Eissalat'])
      expect(routeAusHash(hash), hash).toEqual({ name: 'ernte' });
  });

  it('UC15-AK7 der Erntekalender braucht eine Sitzung', () => {
    expect(maskeFuer(r({ name: 'ernte' }), 'angemeldet')).toEqual({ name: 'ernte' });
    expect(maskeFuer(r({ name: 'ernte', satz: SATZ }), 'angemeldet')).toEqual({ name: 'ernte', satz: SATZ });
    expect(maskeFuer(r({ name: 'ernte' }), 'abgemeldet')).toEqual({ name: 'anmelden' });
  });
});

describe('UC15-AK7 Route #/pflanze/<id>?von=ernte', () => {
  it('UC15-AK7 #/pflanze/<uuid>?von=ernte trägt die Herkunft, hin und zurück', () => {
    const route = r({ name: 'pflanze', pflanzung: PFLANZUNG, von: 'ernte' });
    expect(routeAusHash(`#/pflanze/${PFLANZUNG}?von=ernte`)).toEqual(route);
    expect(hashZu(route)).toBe(`#/pflanze/${PFLANZUNG}?von=ernte`);
    expect(routeAusHash(hashZu(route))).toEqual(route);
  });

  it('UC15-AK7 ein anderer Wert von «von» fällt weg; ohne «von» bleibt die Pflanze unverändert', () => {
    expect(routeAusHash(`#/pflanze/${PFLANZUNG}?von=heute`)).toEqual({
      name: 'pflanze',
      pflanzung: PFLANZUNG,
    });
    expect(routeAusHash(`#/pflanze/${PFLANZUNG}?von=`)).toEqual({ name: 'pflanze', pflanzung: PFLANZUNG });
    expect(routeAusHash(`#/pflanze/${PFLANZUNG}`)).toEqual({ name: 'pflanze', pflanzung: PFLANZUNG });
    expect(hashZu(r({ name: 'pflanze', pflanzung: PFLANZUNG }))).toBe(`#/pflanze/${PFLANZUNG}`);
  });
});

describe('UC15-AK6 aktives Ziel der Leiste', () => {
  it('UC15-AK6 leisteZiel: Erntekalender (mit und ohne Auswahl) → ernte', () => {
    expect(leisteZiel(r({ name: 'ernte' }), 'angemeldet')).toBe('ernte');
    expect(leisteZiel(r({ name: 'ernte', satz: SATZ }), 'angemeldet')).toBe('ernte');
    expect(leisteZiel(r({ name: 'ernte' }), 'abgemeldet')).toBeUndefined();
  });

  it('UC15-AK6 leisteZiel: Säen Schritt 1 → saatgut, ab Schritt 2 keine Leiste; Pflanze aus dem Kalender ohne Leiste', () => {
    expect(leisteZiel(r({ name: 'saeen' }), 'angemeldet', false)).toBe('saatgut');
    expect(leisteZiel(r({ name: 'saeen', box: 'R-A1' }), 'angemeldet', false)).toBe('saatgut');
    expect(leisteZiel(r({ name: 'saeen' }), 'angemeldet', true)).toBeUndefined();
    expect(
      leisteZiel(r({ name: 'pflanze', pflanzung: PFLANZUNG, von: 'ernte' }), 'angemeldet'),
    ).toBeUndefined();
  });
});
