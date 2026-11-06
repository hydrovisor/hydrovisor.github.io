// Anthropic-Rufer der Edge Function ki-recherche mit Serverwerkzeugen (Issue #37, Plan 37 Testliste; UC4-AK7;
// Konzept 11.3; 04_architektur.md 6, 10). Deno test mit Fake-fetch: kein Netz, kein echter Schlüssel (Testwert erfunden).
//
// Vorausgesetzt (Plan 37, Betroffene Dateien und Domänenfunktionen; Name des Rufers A):
//   supabase/functions/ki-recherche/modell.ts
//     rechercheRufer(fetchFn: typeof fetch, schluessel: string): ModellRufer   (ModellRufer aus ../ki-tuete/kern.ts)
//   Statusabbildung wie ki-tuete/modell.ts: 200 → ok mit dem letzten Textblock (letzterTextblock), 429, 5xx und
//   Netzfehler → ausweichen, übrige 4xx → fehler. stop_reason pause_turn: dieselbe Anfrage mit der Antwort als
//   assistant-Nachricht angehängt erneut senden, höchstens zweimal; danach fehler. Wirft nie; Schlüssel nur im Header.
//   Werkzeugversionen je Modell (werkzeugeFuer, am 6.11.2026 an der API-Referenz geprüft):
//     claude-sonnet-5-5 web_search_20260209, web_fetch_20260209; claude-haiku-5-5 web_search_20250305, web_fetch_20250910.
//   Ohne temperature, top_p, top_k; web_fetch ohne citations (nicht zusammen mit output_config.format).
import { strict as assert } from 'node:assert';
import { rechercheRufer } from './modell.ts';
import { pruefAnfrageBauen, rechercheAnfrageBauen } from '../../../src/domain/ki/recherche.ts';

const SCHLUESSEL = 'test-schluessel-nicht-echt-9876543210';
const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';

const AUFTRAG = {
  art: { name_de: 'Testsalat', name_wiss: 'Testus lactucoides' },
  sorte: { name: 'Testsorte Rot' },
  luecken: [
    { id: 'wachstum.ec', phase: 'wachstum', groesse: 'ec' },
    { id: 'wachstum.ph', phase: 'wachstum', groesse: 'ph' },
  ],
  saat: ['schnitt'],
} as Parameters<typeof rechercheAnfrageBauen>[0];

const KANDIDATEN = [
  {
    id: 'w1',
    link: 'https://forschung.example.invalid/blattsalat-dwc',
    fundstelle: 'Tabelle 2',
    kurzzitat: 'Im DWC-System lag die Leitfähigkeit zwischen 1.2 und 1.6 mS/cm.',
    wert: 'EC Wachstum 1.2–1.6 mS/cm',
  },
];

async function fixture(datei: string): Promise<string> {
  return await Deno.readTextFile(new URL(`../../../tests/fixtures/ki/recherche/${datei}`, import.meta.url));
}

function letzterText(roh: string): string {
  const texte = (JSON.parse(roh) as { content: { type: string; text?: string }[] }).content.filter(
    (b) => b.type === 'text',
  );
  return texte[texte.length - 1]?.text ?? '';
}

type Aufruf = { url: string; init: RequestInit | undefined };

function fakeFetch(antworten: (() => Response | Promise<Response>)[]) {
  const aufrufe: Aufruf[] = [];
  let n = 0;
  const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
    aufrufe.push({ url: input instanceof Request ? input.url : String(input), init });
    const a = antworten[Math.min(n++, antworten.length - 1)];
    if (!a) return Promise.reject(new Error('keine Antwort vorbereitet'));
    return Promise.resolve().then(a);
  }) as typeof fetch;
  return { fn, aufrufe };
}

const json = (status: number, text: string) =>
  new Response(text, { status, headers: { 'content-type': 'application/json' } });
const koerper = (a: Aufruf) => JSON.parse(String(a.init?.body)) as Record<string, unknown>;
const signal = () => new AbortController().signal;

Deno.test(
  'UC4-AK7 Rufer: 429 und 5xx → ausweichen, 4xx → fehler, pause_turn höchstens zweimal fortgesetzt, Schlüssel nur im Header',
  async () => {
    const gueltig = await fixture('antwort_gueltig.json');
    const pause = await fixture('antwort_pause_turn.json');
    const ueberlastet = await fixture('fehler_529.json');
    const anfrage = rechercheAnfrageBauen(AUFTRAG, SONNET);

    const gut = fakeFetch([() => json(200, gueltig)]);
    const r = await rechercheRufer(gut.fn, SCHLUESSEL)(SONNET, anfrage, signal());
    assert.equal(r.art, 'ok');
    assert.equal(r.art === 'ok' && r.text, letzterText(gueltig));
    assert.equal(gut.aufrufe.length, 1);
    const a = gut.aufrufe[0];
    assert.ok(a);
    assert.equal(a.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(a.init?.method, 'POST');
    const header = new Headers(a.init?.headers);
    assert.equal(header.get('x-api-key'), SCHLUESSEL);
    assert.match(header.get('anthropic-version') ?? '', /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!String(a.init?.body).includes(SCHLUESSEL));
    assert.ok(!JSON.stringify(r).includes(SCHLUESSEL));

    for (const status of [429, 500, 503, 529]) {
      const f = fakeFetch([() => json(status, ueberlastet)]);
      assert.deepEqual(await rechercheRufer(f.fn, SCHLUESSEL)(SONNET, anfrage, signal()), {
        art: 'ausweichen',
        status,
      });
    }
    const netz = fakeFetch([() => Promise.reject(new TypeError('connection reset'))]);
    assert.equal((await rechercheRufer(netz.fn, SCHLUESSEL)(SONNET, anfrage, signal())).art, 'ausweichen');
    for (const status of [400, 401, 404]) {
      const f = fakeFetch([
        () =>
          json(
            status,
            JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'nein' } }),
          ),
      ]);
      assert.deepEqual(await rechercheRufer(f.fn, SCHLUESSEL)(SONNET, anfrage, signal()), {
        art: 'fehler',
        status,
      });
    }

    // pause_turn einmal: zweiter Request mit der Antwort als assistant-Nachricht, dann der letzte Textblock
    const einmal = fakeFetch([() => json(200, pause), () => json(200, gueltig)]);
    const r1 = await rechercheRufer(einmal.fn, SCHLUESSEL)(SONNET, anfrage, signal());
    assert.equal(einmal.aufrufe.length, 2);
    assert.equal(r1.art === 'ok' && r1.text, letzterText(gueltig));
    const erste = koerper(einmal.aufrufe[0] as Aufruf)['messages'] as { role: string; content: unknown }[];
    const zweite = koerper(einmal.aufrufe[1] as Aufruf)['messages'] as { role: string; content: unknown }[];
    assert.equal(zweite.length, erste.length + 1);
    assert.equal(zweite[zweite.length - 1]?.role, 'assistant');
    assert.deepEqual(zweite[zweite.length - 1]?.content, (JSON.parse(pause) as { content: unknown }).content);
    assert.deepEqual(koerper(einmal.aufrufe[1] as Aufruf)['tools'], anfrage['tools']);

    // pause_turn immer: Anfrage plus höchstens zwei Fortsetzungen, dann fehler
    const immer = fakeFetch([() => json(200, pause)]);
    const r2 = await rechercheRufer(immer.fn, SCHLUESSEL)(SONNET, anfrage, signal());
    assert.equal(immer.aufrufe.length, 3);
    assert.equal(r2.art, 'fehler');
  },
);

Deno.test(
  'UC4-AK7 Rufer: Anfrage für Sonnet mit web_search_20260209, für Haiku mit web_search_20250305; ohne temperature und ohne citations',
  async () => {
    const gueltig = await fixture('antwort_gueltig.json');
    const belegt = await fixture('pruefer_belegt.json');
    const faelle = [
      [SONNET, 'web_search_20260209', 'web_fetch_20260209'],
      [HAIKU, 'web_search_20250305', 'web_fetch_20250910'],
    ] as const;
    for (const [modell, suche, abruf] of faelle) {
      const f = fakeFetch([() => json(200, gueltig)]);
      await rechercheRufer(f.fn, SCHLUESSEL)(modell, rechercheAnfrageBauen(AUFTRAG, modell), signal());
      const k = koerper(f.aufrufe[0] as Aufruf);
      const text = JSON.stringify(k);
      assert.equal(k['model'], modell);
      assert.ok(text.includes(`"${suche}"`), `${modell}: ${suche} fehlt`);
      assert.ok(!text.includes('web_fetch'), `${modell}: Recherche ohne web_fetch`);
      for (const verboten of ['temperature', 'top_p', 'top_k', 'citations'])
        assert.ok(!(verboten in k), verboten);
      assert.ok(!text.includes('citations'));
      if (modell === HAIKU) assert.ok(!text.includes('20260209'), 'Haiku ohne _20260209');

      const p = fakeFetch([() => json(200, belegt)]);
      await rechercheRufer(p.fn, SCHLUESSEL)(modell, pruefAnfrageBauen(KANDIDATEN, modell), signal());
      const pk = koerper(p.aufrufe[0] as Aufruf);
      const ptext = JSON.stringify(pk);
      assert.ok(ptext.includes(`"${abruf}"`), `${modell}: ${abruf} fehlt`);
      assert.ok(!ptext.includes('citations'), `${modell}: Prüfer ohne citations`);
      assert.ok(!('temperature' in pk));
      if (modell === HAIKU) assert.ok(!ptext.includes('20260209'), 'Haiku-Prüfer ohne _20260209');
    }
  },
);
