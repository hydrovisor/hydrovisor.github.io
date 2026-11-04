// npm run eval:tueten -- [--fotos data/eval/fotos] [--referenz data/eval/tueten_referenz.csv]
//   [--modelle claude-sonnet-5-5,claude-haiku-5-5] [--trocken tests/fixtures/ki/antworten]
// KI-Eval UC4-AK3 (Konzept 11.3, 12.6; Plan 14). Tim startet den echten Lauf an seinem PC; der Schlüssel kommt nur
// aus ANTHROPIC_API_KEY in seiner Shell. --trocken nutzt aufgezeichnete Antworten ohne Schlüssel und ohne Netz.
// Bericht nach reports/ki-eval.md und .json; auf der Konsole nur die Zusammenfassung. Schreibt nie in eine Datenbank.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUSWEICHMODELL, HAUPTMODELL } from '../src/domain/ki/modelle.ts';
import type { Preise } from '../src/domain/ki/eval.ts';
import { ZEITZONE } from '../src/domain/zeit.ts';
import type { ModellRufer } from '../supabase/functions/ki-tuete/kern.ts';
import { anthropicRufer } from '../supabase/functions/ki-tuete/modell.ts';
import { evalAblauf } from './ki-eval/ablauf.ts';
import { bildwandlerStarten } from './ki-eval/bild.ts';

// USD je Million Token, Stand 4.11.2026 (API-Referenz; Haiku bis 100K Eingabe-Token)
const PREISE: Preise = {
  'claude-sonnet-5-5': { eingabeJeMio: 2, ausgabeJeMio: 10 },
  'claude-haiku-5-5': { eingabeJeMio: 0.1, ausgabeJeMio: 0.5 },
};

const argumente = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const i = argumente.indexOf(name);
  return i >= 0 ? argumente[i + 1] : undefined;
};
const repository = fileURLToPath(new URL('..', import.meta.url));
const trocken = option('--trocken');
const fotoOrdner = resolve(
  option('--fotos') ?? join(repository, trocken ? 'tests/fixtures/ki/fotos' : 'data/eval/fotos'),
);
const referenzDatei = resolve(
  option('--referenz') ??
    join(repository, trocken ? 'tests/fixtures/ki/referenz_beispiel.csv' : 'data/eval/tueten_referenz.csv'),
);
const modelle = (option('--modelle') ?? `${HAUPTMODELL},${AUSWEICHMODELL}`).split(',').map((m) => m.trim());

/** Rufer mit aufgezeichneten Antworten <zeile_id>.<modell>.json; erkennt die Tüte an der Reihenfolge der Aufrufe */
function trockenRufer(ordner: string, reihenfolge: string[]): ModellRufer {
  let n = 0;
  return (modell) => {
    const id = reihenfolge[Math.floor(n++ / modelle.length)] ?? '';
    const datei = join(ordner, `${id}.${modell}.json`);
    if (!existsSync(datei)) return Promise.resolve({ art: 'fehler', status: 404 });
    const body = JSON.parse(readFileSync(datei, 'utf8')) as {
      content: { type: string; text?: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    return Promise.resolve({
      art: 'ok',
      text: body.content.find((b) => b.type === 'text')?.text ?? '',
      eingabeTokens: body.usage.input_tokens,
      ausgabeTokens: body.usage.output_tokens,
    });
  };
}

async function hauptprogramm(): Promise<void> {
  if (!existsSync(referenzDatei)) throw new Error(`Referenz fehlt: ${referenzDatei}`);
  if (!existsSync(fotoOrdner)) throw new Error(`Fotoordner fehlt: ${fotoOrdner}`);
  const fotos = readdirSync(fotoOrdner)
    .filter((n) => /-[12]\.(jpe?g|png)$/i.test(n))
    .map((name) => ({ name, bytes: new Uint8Array(readFileSync(join(fotoOrdner, name))) }));

  let rufer: ModellRufer;
  if (trocken) {
    const ids = [...new Set(fotos.map((f) => f.name.replace(/-[12]\.(jpe?g|png)$/i, '')))].sort();
    rufer = trockenRufer(resolve(trocken), ids);
  } else {
    const schluessel = process.env['ANTHROPIC_API_KEY'];
    if (!schluessel)
      throw new Error(
        'ANTHROPIC_API_KEY fehlt. In PowerShell: $env:ANTHROPIC_API_KEY = "<Schlüssel>"; npm run eval:tueten (Anleitung docs/anleitung/ki-eval.md)',
      );
    rufer = anthropicRufer(fetch, schluessel);
  }

  const wandler = await bildwandlerStarten();
  try {
    const r = await evalAblauf({
      referenzCsv: readFileSync(referenzDatei, 'utf8'),
      fotos,
      modelle,
      rufer,
      bildWandeln: (b) => wandler.wandeln(b),
      zeit: { jetzt: () => new Date() },
      preise: PREISE,
      zeitzone: ZEITZONE,
    });
    const ordner = join(repository, 'reports');
    mkdirSync(ordner, { recursive: true });
    writeFileSync(join(ordner, 'ki-eval.md'), `${r.markdown}\n`);
    writeFileSync(join(ordner, 'ki-eval.json'), `${JSON.stringify(r.auswertung, null, 2)}\n`);
    for (const m of r.auswertung.modelle)
      console.log(
        `${m.modell}: ${m.richtig} von ${m.felder} richtig, M0 ${m.m0 ? 'erfüllt' : 'nicht erfüllt'}, Median ${(m.dauerMedianMs / 1000).toFixed(1)} s, ${m.kostenJeTueteUsd.toFixed(4)} USD je Tüte`,
      );
    console.log(`Default: ${r.defaultModell}. Bericht: reports/ki-eval.md`);
  } finally {
    await wandler.schliessen();
  }
}

hauptprogramm().catch((e: unknown) => {
  console.log(`::error::${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
});
