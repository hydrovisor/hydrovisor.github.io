// DS-01 Design System (#17, Plan 17): Token-Datei, Masse und Prellfilter
import { describe, expect, it } from 'vitest';
import { tokensCss, type Tokens } from '../../scripts/tokens-regeln.ts';
import { restzeit } from '../../src/ui/bausteine/Checklist.tsx';
import { prellfilter, type Prellzustand } from '../../src/ui/bausteine/prellfilter.ts';
// ?raw liest die Dateien als Text (Vite), ohne Node-Typen im Browser-tsconfig
import tokensCssDatei from '../../design-system/tokens.css?raw';
import tokensJsonDatei from '../../design-system/tokens.json?raw';

const json = JSON.parse(tokensJsonDatei) as Tokens;
const css = tokensCssDatei;

function wert(gruppe: { tokens: { name: string; value: unknown }[] }, name: string): unknown {
  return gruppe.tokens.find((t) => t.name === name)?.value;
}

const mm = (v: unknown) => Number.parseFloat(String(v));

describe('DS-01 Tokens', () => {
  it('DS-01 tokens.css entspricht tokens.json (npm run tokens)', () => {
    expect(css).toBe(tokensCss(json));
  });

  it('DS-01 Dichte regal: Tippflächen 68 dp, Schriftgrade nach Konzept 10', () => {
    expect(wert(json.size, 'size-touch-regal')).toBe('68px');
    expect(wert(json.size, 'icon-status-regal')).toBe('32px');
    const stile = json.type.groups.flatMap((g) => g.styles);
    const groesse = (n: string) => stile.find((s) => s.name === n)?.fontSize;
    expect([groesse('value-regal'), groesse('status-regal'), groesse('text-regal')]).toEqual([
      '40px',
      '28px',
      '21px',
    ]);
    expect(css).toMatch(
      /\[data-density="regal"\] \{\n {2}--size-touch: var\(--size-touch-regal\);\n {2}--size-touch-compact: var\(--size-touch-regal\);/,
    );
  });

  it('DS-01 Kachel mindestens 72 × 80 dp, Loch mindestens 48 dp', () => {
    expect([wert(json.size, 'size-tile-min-width'), wert(json.size, 'size-tile-min-height')]).toEqual([
      '72px',
      '80px',
    ]);
    expect(wert(json.size, 'size-loch')).toBe('48px');
  });

  it('DS-01 Etikett: 4 mm + QR 30 mm + Kennung 32 mm + 4 mm = 70 mm', () => {
    const p = json.print;
    expect(mm(wert(p, 'label-padding-x')) * 2 + mm(wert(p, 'label-qr')) + mm(wert(p, 'label-id-width'))).toBe(
      mm(wert(p, 'label-width')),
    );
    expect(wert(p, 'label-height')).toBe('42.3mm');
  });

  it('DS-01 Bogen 3 × 7 füllt A4: 3 × 70 mm = 210 mm, 7 × 42.3 mm + 2 × Rand oben = 297 mm', () => {
    const p = json.print;
    const spalten = Number(wert(p, 'sheet-columns'));
    const zeilen = Number(wert(p, 'sheet-rows'));
    expect(spalten * mm(wert(p, 'label-width')) + 2 * mm(wert(p, 'sheet-margin-left'))).toBe(210);
    expect(zeilen * mm(wert(p, 'label-height')) + 2 * mm(wert(p, 'sheet-margin-top'))).toBeCloseTo(297, 6);
  });

  it('DS-01 dunkles Thema nur mit abweichenden Werten', () => {
    const dunkel = css.slice(css.indexOf('[data-theme="dark"]'), css.indexOf('[data-density'));
    expect(dunkel).toContain('--surface: #11191C;');
    expect(dunkel).not.toContain('--label-ink');
    expect(dunkel).not.toContain('--surface-brand');
  });
});

describe('DS-01 Prellfilter des Ziffernblocks (höchstens 80 ms, keine Sperre)', () => {
  function folge(tipps: [string, number][]): string {
    let z: Prellzustand | null = null;
    let aus = '';
    for (const [taste, zeit] of tipps) {
      const r = prellfilter(z, taste, zeit);
      z = r.zustand;
      if (r.zaehlt) aus += taste;
    }
    return aus;
  }

  it('DS-01 1, 1, 2 innert 0.6 s ergibt 112', () => {
    expect(
      folge([
        ['1', 0],
        ['1', 250],
        ['2', 500],
      ]),
    ).toBe('112');
  });

  it('DS-01 +0.1 zweimal innert 0.5 s zählt zweimal', () => {
    expect(
      folge([
        ['plus', 1000],
        ['plus', 1400],
      ]),
    ).toBe('plusplus');
  });

  it('DS-01 Prellen derselben Taste unter 80 ms wird verworfen, ab 80 ms zählt der Tipp', () => {
    expect(
      folge([
        ['7', 0],
        ['7', 30],
        ['7', 79],
      ]),
    ).toBe('7');
    expect(
      folge([
        ['7', 0],
        ['7', 80],
      ]),
    ).toBe('77');
  });

  it('DS-01 andere Taste innert 80 ms zählt', () => {
    expect(
      folge([
        ['4', 0],
        ['5', 20],
      ]),
    ).toBe('45');
  });

  it('DS-01 verworfener Tipp verlängert das Fenster nicht', () => {
    expect(
      folge([
        ['9', 0],
        ['9', 60],
        ['9', 100],
      ]),
    ).toBe('99');
  });
});

describe('DS-01 Timer der Abhakliste', () => {
  it('DS-01 Restzeit gegen die absolute Endzeit, nie negativ', () => {
    expect(restzeit(872_000, 0)).toBe('14:32');
    expect(restzeit(1_000, 500)).toBe('0:01');
    expect(restzeit(0, 5_000)).toBe('0:00');
  });
});
