// Routen für Etiketten, Druckansicht, Säen und Prüfen nach Scan (Plan 22 Testliste, 04_architektur.md 3; R9.2).
// Ergänzt tests/unit/router.test.ts in einer eigenen Datei des Testentwicklers.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 22 offen ist):
//   | { name: 'etikett'; code: string }                                   // #/e/R-2.3
//   | { name: 'etiketten'; kuerzel?: string; codes?: string[] }           // #/etiketten?a=R&code=R-2.3
//   | { name: 'druck-etiketten'; kuerzel: string; codes: string[]; start: number; versatzX: number;
//       versatzY: number; test: boolean }                                 // #/druck/etiketten?…
//   | { name: 'saeen'; box?: string }                                     // #/saeen?box=R-A1
//   | { name: 'pruefen'; code: string; scan?: true }                      // #/pruefen/R-2.3?scan=1
//   Ungültige Werte fallen auf den Standard: Startfeld ausserhalb 1 bis 21 → 1, Kürzel nicht 1 bis 3 Grossbuchstaben
//   → ohne Kürzel.
import { describe, expect, it } from 'vitest';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const hin = (r: Route) => routeAusHash(hashZu(r));

const DRUCK = {
  name: 'druck-etiketten',
  kuerzel: 'R',
  codes: ['R-2.1', 'R-2.3', 'R-A1'],
  start: 17,
  versatzX: 1,
  versatzY: -0.5,
  test: false,
} as unknown as Route;

/** Hash mit einem ersetzten Abfragewert (Name der Abfrage über den eindeutigen Wert gefunden) */
function ersetzt(hash: string, alt: string, neu: string): string {
  const [pfad = '', abfrage = ''] = hash.split('?');
  const p = new URLSearchParams(abfrage);
  const schluessel = [...p.entries()].find(([, w]) => w === alt)?.[0];
  if (!schluessel) throw new Error(`Wert ${alt} fehlt in ${hash}`);
  p.set(schluessel, neu);
  return `${pfad}?${p.toString()}`;
}

describe('UC14 Routen (Plan 22)', () => {
  it('UC14-AK2 #/e/R-2.3 hin und zurück, ohne Sitzung zur Anmeldung', () => {
    expect(routeAusHash('#/e/R-2.3')).toEqual({ name: 'etikett', code: 'R-2.3' });
    expect(routeAusHash('#/e/R-A1')).toEqual({ name: 'etikett', code: 'R-A1' });
    expect(hashZu({ name: 'etikett', code: 'R-W' } as Route)).toBe('#/e/R-W');
    expect(hin({ name: 'etikett', code: 'R-4.4' } as Route)).toEqual({ name: 'etikett', code: 'R-4.4' });
    expect(maskeFuer({ name: 'etikett', code: 'R-2.3' } as Route, 'abgemeldet')).toEqual({
      name: 'anmelden',
    });
  });

  it('UC14-AK2 #/saeen?box=R-A1 hin und zurück', () => {
    expect(routeAusHash('#/saeen?box=R-A1')).toEqual({ name: 'saeen', box: 'R-A1' });
    expect(routeAusHash('#/saeen')).toEqual({ name: 'saeen' });
    expect(hashZu({ name: 'saeen', box: 'R-A1' } as Route)).toBe('#/saeen?box=R-A1');
    expect(hashZu({ name: 'saeen' } as Route)).toBe('#/saeen');
  });

  it('UC14-AK2 #/pruefen/R-2.3?scan=1 hin und zurück, ohne scan unverändert', () => {
    expect(routeAusHash('#/pruefen/R-2.3?scan=1')).toEqual({ name: 'pruefen', code: 'R-2.3', scan: true });
    expect(hashZu({ name: 'pruefen', code: 'R-2.3', scan: true } as Route)).toBe('#/pruefen/R-2.3?scan=1');
    expect(routeAusHash('#/pruefen/R-2.3')).toEqual({ name: 'pruefen', code: 'R-2.3' });
    expect(hashZu({ name: 'pruefen', code: 'R-2.3' })).toBe('#/pruefen/R-2.3');
    expect(routeAusHash('#/pruefen/R-2.3?scan=0')).toEqual({ name: 'pruefen', code: 'R-2.3' });
  });

  it('UC14-AK3 #/etiketten?a=R&code=R-2.3 hin und zurück; Kürzel klein fällt weg', () => {
    expect(routeAusHash('#/etiketten?a=R&code=R-2.3')).toEqual({
      name: 'etiketten',
      kuerzel: 'R',
      codes: ['R-2.3'],
    });
    expect(hashZu({ name: 'etiketten', kuerzel: 'R', codes: ['R-2.3'] } as Route)).toBe(
      '#/etiketten?a=R&code=R-2.3',
    );
    expect(routeAusHash('#/etiketten?a=R')).toEqual({ name: 'etiketten', kuerzel: 'R' });
    expect(hashZu({ name: 'etiketten', kuerzel: 'R' } as Route)).toBe('#/etiketten?a=R');
    expect(routeAusHash('#/etiketten')).toEqual({ name: 'etiketten' });
    expect(routeAusHash('#/etiketten?a=r')).toEqual({ name: 'etiketten' });
    expect(routeAusHash('#/etiketten?a=ABCD')).toEqual({ name: 'etiketten' });
  });

  it('UC14-AK3 #/druck/etiketten?… hin und zurück; Startfeld 30 und Kürzel klein fallen auf den Standard', () => {
    const hash = hashZu(DRUCK);
    expect(hash.startsWith('#/druck/etiketten?')).toBe(true);
    expect(routeAusHash(hash)).toEqual(DRUCK);
    const test = { ...DRUCK, test: true, start: 1, versatzX: 0, versatzY: 0 } as Route;
    expect(hin(test)).toEqual(test);
    // Startfeld 30 → 1, Startfeld 2.5 → 1
    expect(routeAusHash(ersetzt(hash, '17', '30'))).toMatchObject({ name: 'druck-etiketten', start: 1 });
    expect(routeAusHash(ersetzt(hash, '17', '2.5'))).toMatchObject({ name: 'druck-etiketten', start: 1 });
    // Kürzel klein: nicht die Anlage «r»
    const klein = routeAusHash(ersetzt(hash, 'R', 'r')) as unknown as Record<string, unknown>;
    expect(klein['kuerzel']).not.toBe('r');
  });
});
