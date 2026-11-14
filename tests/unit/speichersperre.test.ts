// Sperre nach erfolgreichem Schreiben mit Frist (Issue #219, Plan 219 «Sperre», A15; Issue A3; Plan 207 A21 H2, #215).
// Reine Funktion sperreAktiv mit fester Uhr (jetztMs als Zahl), dazu eine Prüfung im Quelltext von Sorte.tsx, dass
// TuetenfotoKarte und VorratKarte denselben Baustein nutzen (Plan 219 A9). Keine Fake-Timer, keine Personendaten.
//
// Vorausgesetzt (Plan 219 «Datenflüsse und Signaturen»):
//   src/ui/speichersperre.ts
//     SPERRE_FRIST_MS = 10_000
//     sperreAktiv({ erwartetSeitMs?: number; sichtbar: boolean; jetztMs: number; fristMs: number }): boolean
//       wahr genau dann, wenn erwartetSeitMs gesetzt ist, sichtbar falsch ist und jetztMs − erwartetSeitMs < fristMs
//     useSpeichersperre<T>(istSichtbar, fristMs = SPERRE_FRIST_MS): { wartet; erwarten }
// Das Modul fehlt vor der Umsetzung; es wird je Test dynamisch geladen, damit die Datei als Ganzes läuft.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Sperre {
  SPERRE_FRIST_MS: number;
  sperreAktiv(e: { erwartetSeitMs?: number; sichtbar: boolean; jetztMs: number; fristMs: number }): boolean;
  useSpeichersperre: unknown;
}

const MODUL = '../../src/ui/speichersperre.ts';
const laden = async (): Promise<Sperre> => (await import(/* @vite-ignore */ MODUL)) as Sperre;

// feste Uhr: 15.1.2027 10:30:00 Zürich als Millisekunden
const SEIT = Date.parse('2027-01-15T09:30:00.000Z');
const FRIST = 10_000;

describe('NB1-AK4 sperreAktiv', () => {
  it('NB1-AK4 ohne erwartete Zeile nicht gesperrt', async () => {
    const { sperreAktiv } = await laden();
    expect(sperreAktiv({ sichtbar: false, jetztMs: SEIT, fristMs: FRIST })).toBe(false);
    expect(sperreAktiv({ sichtbar: false, jetztMs: SEIT + FRIST + 1, fristMs: FRIST })).toBe(false);
    expect(sperreAktiv({ sichtbar: true, jetztMs: SEIT, fristMs: FRIST })).toBe(false);
  });

  it('NB1-AK4 vor der Frist gesperrt, solange die Zeile nicht sichtbar ist', async () => {
    const { sperreAktiv } = await laden();
    for (const nach of [0, 1, 2_500, FRIST - 1])
      expect(
        sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + nach, fristMs: FRIST }),
      ).toBe(true);
  });

  it('NB1-AK4 sichtbar vor der Frist löst die Sperre', async () => {
    const { sperreAktiv } = await laden();
    for (const nach of [0, 1, FRIST - 1])
      expect(
        sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: true, jetztMs: SEIT + nach, fristMs: FRIST }),
      ).toBe(false);
  });

  it('NB1-AK4 ab der Frist gelöst (Grenze jetztMs − seit = fristMs), Frist 10 000 ms', async () => {
    const { sperreAktiv, SPERRE_FRIST_MS } = await laden();
    expect(SPERRE_FRIST_MS).toBe(10_000);
    const f = SPERRE_FRIST_MS;
    expect(sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + f - 1, fristMs: f })).toBe(
      true,
    );
    expect(sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + f, fristMs: f })).toBe(false);
    expect(sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + f + 1, fristMs: f })).toBe(
      false,
    );
    expect(sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + 60_000, fristMs: f })).toBe(
      false,
    );
    // eine andere Frist gilt wie übergeben
    expect(
      sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + 1_999, fristMs: 2_000 }),
    ).toBe(true);
    expect(
      sperreAktiv({ erwartetSeitMs: SEIT, sichtbar: false, jetztMs: SEIT + 2_000, fristMs: 2_000 }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------
// Beide Karten nutzen denselben Baustein (Quelltext, Plan 219 A9)
// ---------------------------------------------------------------------

/** Quelltext einer Funktion bis zur nächsten Funktion oben in der Datei */
function funktion(quelle: string, name: string): string {
  const start = quelle.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`function ${name} fehlt in Sorte.tsx`);
  const rest = quelle.slice(start + 1);
  const ende = rest.search(/\n(export )?function /);
  return ende < 0 ? rest : rest.slice(0, ende);
}

describe('NB1-AK4 Karten im Detail der Sorte', () => {
  it('NB1-AK4 TuetenfotoKarte und VorratKarte nutzen useSpeichersperre, kein eigenes wartetAufBuendel', async () => {
    const sperre = await laden();
    expect(typeof sperre.useSpeichersperre).toBe('function');
    const quelle = readFileSync('src/ui/masken/Sorte.tsx', 'utf8');
    expect(quelle).toMatch(
      /import\s*\{[^}]*\buseSpeichersperre\b[^}]*\}\s*from\s*'\.\.\/speichersperre(\.ts)?'/,
    );
    expect(quelle).not.toMatch(/wartetAufBuendel/);
    for (const karte of ['TuetenfotoKarte', 'VorratKarte']) {
      const text = funktion(quelle, karte);
      expect(text, karte).toMatch(/useSpeichersperre\s*(<[^>]*>)?\s*\(/);
      // gesperrt, solange geschrieben wird oder die Sperre wartet (Plan 219 «Sperre»)
      expect(text, karte).toMatch(/laeuft\s*\|\|\s*wartet/);
      // keine eigene Uhr in der Karte: die Frist rechnet der Baustein
      expect(text, karte).not.toMatch(/Date\.now\(\)|setTimeout\(/);
    }
  });
});
