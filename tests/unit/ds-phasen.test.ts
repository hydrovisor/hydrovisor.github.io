// Farb-Tokens der Phasen im Phasenbalken (Issue #232, Plan 232 «Design System»; DS-01, Konzept 10; UC15-AK8).
// Jedes phase-* erreicht in Hell und Dunkel gegen ink des Themas mindestens 4.5:1 (WCAG 2.2 AA, Text: Buchstabe K/A/W/B/F
// im Abschnitt). Werte aus design-system/tokens.json; der Kontrast wird hier nach WCAG 2.x (relative Luminanz) gerechnet.
import { describe, expect, it } from 'vitest';
// ?raw liest die Datei als Text (Vite), ohne Node-Typen im Browser-tsconfig
import tokensJsonDatei from '../../design-system/tokens.json?raw';

interface Token {
  name: string;
  value: unknown;
}
const json = JSON.parse(tokensJsonDatei) as { color: { tokens: Token[] } };

const PHASEN = ['phase-keimung', 'phase-anzucht', 'phase-wachstum', 'phase-bluete', 'phase-frucht'] as const;
const THEMEN = ['light', 'dark'] as const;

function farbe(name: string, thema: (typeof THEMEN)[number]): string {
  const t = json.color.tokens.find((x) => x.name === name);
  const v = t?.value;
  const hex = typeof v === 'object' && v !== null ? (v as Record<string, unknown>)[thema] : v;
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex))
    throw new Error(`${name} (${thema}): kein Hex-Wert, sondern ${JSON.stringify(v)}`);
  return hex;
}

function luminanz(hex: string): number {
  const kanal = (i: number) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(1) + 0.7152 * kanal(3) + 0.0722 * kanal(5);
}

function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [luminanz(a), luminanz(b)].sort((x, y) => y - x) as [number, number];
  return (hell + 0.05) / (dunkel + 0.05);
}

describe('UC15-AK8 DS-01 Phasenfarben', () => {
  it('UC15-AK8 DS-01 Kontrastrechnung: Schwarz auf Weiss 21:1 (Gegenprobe)', () => {
    expect(kontrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('UC15-AK8 DS-01 jedes phase-* hat in Hell und Dunkel einen eigenen Hex-Wert', () => {
    for (const name of PHASEN)
      for (const thema of THEMEN) expect(farbe(name, thema), `${name} ${thema}`).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('UC15-AK8 DS-01 jedes phase-* erreicht gegen ink des Themas mindestens 4.5:1 (Hell und Dunkel)', () => {
    for (const thema of THEMEN) {
      const ink = farbe('ink', thema);
      for (const name of PHASEN)
        expect(kontrast(farbe(name, thema), ink), `${name} gegen ink (${thema})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('UC15-AK8 DS-01 die fünf Phasen sind je Thema verschiedene Farben', () => {
    for (const thema of THEMEN)
      expect(new Set(PHASEN.map((n) => farbe(n, thema).toLowerCase())).size, thema).toBe(PHASEN.length);
  });
});
