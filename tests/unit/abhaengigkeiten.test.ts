// Sicherheitswarnungen der Entwicklungs-Abhängigkeiten (#137): qs kommt über @stryker-mutator/core und
// typed-rest-client (fixiert auf 6.15.1); der Override in package.json hebt es innerhalb von Version 6 auf 6.17.1.
// Liest package-lock.json, damit der Test ohne Netz und ohne node_modules gilt. Routine: Test vom Lead.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Lock {
  packages: Record<string, { version?: string }>;
}

const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8')) as Lock;
const zahl = (v: string) => v.split('.').map(Number) as [number, number, number];
const mindestens = (v: string, min: string) => {
  const [a, b, c] = zahl(v);
  const [x, y, z] = zahl(min);
  return a !== x ? a > x : b !== y ? b > y : c >= z;
};

describe('Abhängigkeiten', () => {
  it('DEP-AK1 jedes qs in package-lock.json ist mindestens 6.17.1 (Warnungen bis 6.16.0)', () => {
    const qs = Object.entries(lock.packages).filter(([pfad]) => pfad.endsWith('node_modules/qs'));
    expect(qs.length).toBeGreaterThan(0);
    for (const [pfad, p] of qs) {
      expect(mindestens(p.version ?? '0.0.0', '6.17.1'), pfad).toBe(true);
      expect(zahl(p.version ?? '0.0.0')[0], `${pfad} bleibt in Hauptversion 6`).toBe(6);
    }
  });
});
