// Bereitschaft des KI-Eval mit 22 Tüten (Issue #37, Plan 37 Testliste und Umfang Teil 5; UC4-AK3 Skript; Konzept
// 12.6). Kein Modellaufruf: der Rufer ist ein Fake, aufgezeichnete Antworten aus tests/fixtures/ki/antworten/.
//
// Vorausgesetzt (Plan 37, Betroffene Dateien scripts/ki-eval/ablauf.ts, A):
//   evalVoraussetzungen(e: { referenzPfad: string; referenzVorhanden: boolean; fotoPfad: string;
//                            fotos: readonly string[] | undefined })      // undefined = Ordner fehlt
//     → { ok: true; tueten: number } | { ok: false; meldung: string }
//   Meldung einzeilig ohne Stapelspur: «Referenzdatei fehlt: <referenzPfad>»; fehlt der Fotoordner oder enthält er
//   keine Fotos <zeile_id>-1.jpg / -2.jpg, eine eigene Meldung mit dem Fotopfad.
//   Der Bericht (berichtMarkdown über evalAblauf) nennt die Zahl der Tüten als «n von 22 Tüten».
//   scripts/ki-eval.ts prüft evalVoraussetzungen vor allem anderen und schreibt dann keinen Bericht.
import { describe, expect, it } from 'vitest';
import { evalAblauf, evalVoraussetzungen } from '../../scripts/ki-eval/ablauf.ts';
import type { Preise } from '../../src/domain/ki/eval.ts';
import referenzRoh from '../fixtures/ki/referenz_beispiel.csv?raw';

const ZUERICH = 'Europe/Zurich';
const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const PREISE: Preise = {
  [SONNET]: { eingabeJeMio: 3, ausgabeJeMio: 15 },
  [HAIKU]: { eingabeJeMio: 1, ausgabeJeMio: 5 },
};
const FOTOS = [
  'sorte-eval-a-1.jpg',
  'sorte-eval-a-2.jpg',
  'sorte-eval-b-1.jpg',
  'sorte-eval-b-2.jpg',
  'sorte-eval-c-1.jpg',
  'sorte-eval-c-2.jpg',
];

const antworten = import.meta.glob<string>('../fixtures/ki/antworten/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('UC4-AK3 Bereitschaft des Eval-Skripts', () => {
  it('UC4-AK3 (Skript) Referenzdatei fehlt → Meldung «Referenzdatei fehlt: data/eval/tueten_referenz.csv», kein Bericht, kein Modellaufruf', () => {
    const r = evalVoraussetzungen({
      referenzPfad: 'data/eval/tueten_referenz.csv',
      referenzVorhanden: false,
      fotoPfad: 'data/eval/fotos',
      fotos: FOTOS,
    });
    expect(r).toEqual({ ok: false, meldung: 'Referenzdatei fehlt: data/eval/tueten_referenz.csv' });

    // einzeilig, ohne Stapelspur; die Hülle bricht damit vor dem Bildwandler, dem Rufer und dem Bericht ab
    expect(r.ok === false && r.meldung).not.toMatch(/\n|\sat\s/);
  });

  it('UC4-AK3 (Skript) Fotoordner fehlt oder leer → eigene Meldung', () => {
    const fehlt = evalVoraussetzungen({
      referenzPfad: 'data/eval/tueten_referenz.csv',
      referenzVorhanden: true,
      fotoPfad: 'data/eval/fotos',
      fotos: undefined,
    });
    const leer = evalVoraussetzungen({
      referenzPfad: 'data/eval/tueten_referenz.csv',
      referenzVorhanden: true,
      fotoPfad: 'data/eval/fotos',
      fotos: ['liesmich.txt'],
    });
    for (const r of [fehlt, leer]) {
      if (r.ok) throw new Error('ohne Fotos bereit gemeldet');
      expect(r.meldung).toContain('data/eval/fotos');
      expect(r.meldung).not.toContain('Referenzdatei');
      expect(r.meldung).not.toContain('\n');
    }
    expect(fehlt.ok === false && leer.ok === false && fehlt.meldung !== leer.meldung).toBe(true);

    expect(
      evalVoraussetzungen({
        referenzPfad: 'data/eval/tueten_referenz.csv',
        referenzVorhanden: true,
        fotoPfad: 'data/eval/fotos',
        fotos: FOTOS,
      }),
    ).toEqual({ ok: true, tueten: 3 });
  });

  it('UC4-AK3 (Skript) Bericht nennt «3 von 22 Tüten»', async () => {
    let uhr = Date.parse('2027-01-08T09:00:00.000Z');
    type Block = { type?: string; text?: string; source?: { data?: string } };
    const r = await evalAblauf({
      referenzCsv: referenzRoh,
      fotos: FOTOS.map((name) => ({ name, bytes: new TextEncoder().encode(name.replace(/\.jpg$/, '')) })),
      modelle: [SONNET, HAIKU],
      bildWandeln: (bytes) => Promise.resolve(bytes),
      rufer: (modell, anfrage) => {
        const inhalt = ((anfrage['messages'] as { content: Block[] }[])[0]?.content ?? []) as Block[];
        const erstes = atob(inhalt.find((b) => b.type === 'image')?.source?.data ?? '');
        const roh = antworten[`../fixtures/ki/antworten/${erstes.replace(/-1$/, '')}.${modell}.json`];
        if (!roh) return Promise.resolve({ art: 'fehler', status: 404 });
        const body = JSON.parse(roh) as {
          content: Block[];
          usage: { input_tokens: number; output_tokens: number };
        };
        uhr += 3000;
        return Promise.resolve({
          art: 'ok',
          text: body.content.find((b) => b.type === 'text')?.text ?? '',
          eingabeTokens: body.usage.input_tokens,
          ausgabeTokens: body.usage.output_tokens,
        });
      },
      zeit: { jetzt: () => new Date(uhr) },
      preise: PREISE,
      zeitzone: ZUERICH,
    });
    expect(r.markdown).toContain('3 von 22 Tüten');
  });
});
