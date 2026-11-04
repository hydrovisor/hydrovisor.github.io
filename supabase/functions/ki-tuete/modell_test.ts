// Anthropic-Rufer der Edge Function ki-tuete (Issue #14, Plan 14 Testliste; Konzept 11.3; 04_architektur.md 6, 10).
// Deno test mit Fake-fetch: kein Netz, kein echter Schlüssel (der Testwert ist erfunden).
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   supabase/functions/ki-tuete/modell.ts
//     anthropicRufer(fetchFn: typeof fetch, schluessel: string): ModellRufer
//   POST auf https://api.anthropic.com/v1/messages, Körper = JSON der übergebenen Anfrage, Header x-api-key,
//   anthropic-version und content-type application/json. Abbildung: 200 mit lesbarem Körper → ok (Text des
//   ersten Textblocks, usage), 429 und 5xx (inkl. 529) und Netzfehler → ausweichen, übrige 4xx und unlesbarer
//   Körper → fehler. Der Rufer wirft nicht und schreibt den Schlüssel nie in Rückgabe oder Konsole.
import { strict as assert } from 'node:assert';
import { anthropicRufer } from './modell.ts';

const SCHLUESSEL = 'test-schluessel-nicht-echt-0123456789';
const ANFRAGE = {
  model: 'claude-sonnet-5-5',
  max_tokens: 2000,
  messages: [{ role: 'user', content: 'Rote Probe' }],
};

async function fixture(datei: string): Promise<string> {
  return await Deno.readTextFile(new URL(`../../../tests/fixtures/ki/${datei}`, import.meta.url));
}

type Aufruf = { url: string; init: RequestInit | undefined };

function fakeFetch(antwort: () => Response | Promise<Response>) {
  const aufrufe: Aufruf[] = [];
  const fn = ((input: RequestInfo | URL, init?: RequestInit) => {
    aufrufe.push({ url: input instanceof Request ? input.url : String(input), init });
    return Promise.resolve().then(antwort);
  }) as typeof fetch;
  return { fn, aufrufe };
}

const json = (status: number, text: string) =>
  new Response(text, { status, headers: { 'content-type': 'application/json' } });

async function ohneKonsole<T>(f: () => Promise<T>): Promise<{ wert: T; ausgabe: string }> {
  const ausgabe: string[] = [];
  const alt = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };
  const fangen = (...a: unknown[]) =>
    ausgabe.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
  console.log = console.error = console.warn = console.info = console.debug = fangen;
  try {
    return { wert: await f(), ausgabe: ausgabe.join('\n') };
  } finally {
    Object.assign(console, alt);
  }
}

Deno.test(
  '11.3 Status 429, 500, 503, 529 und Netzfehler → ausweichen; 400, 401, 404 → fehler; 200 → ok mit Text und Token',
  async () => {
    const gueltig = await fixture('antwort_gueltig.json');
    const text = (JSON.parse(gueltig) as { content: { type: string; text?: string }[] }).content.find(
      (b) => b.type === 'text',
    )?.text;
    const ok = fakeFetch(() => json(200, gueltig));
    assert.deepEqual(
      await anthropicRufer(ok.fn, SCHLUESSEL)('claude-sonnet-5-5', ANFRAGE, new AbortController().signal),
      {
        art: 'ok',
        text,
        eingabeTokens: 2100,
        ausgabeTokens: 310,
      },
    );

    const ueberlastet = await fixture('fehler_529.json');
    for (const status of [429, 500, 503, 529]) {
      const f = fakeFetch(() => json(status, ueberlastet));
      const r = await anthropicRufer(f.fn, SCHLUESSEL)(
        'claude-sonnet-5-5',
        ANFRAGE,
        new AbortController().signal,
      );
      assert.deepEqual(r, { art: 'ausweichen', status }, String(status));
    }

    const netz = fakeFetch(() => Promise.reject(new TypeError('error sending request: connection reset')));
    const rn = await anthropicRufer(netz.fn, SCHLUESSEL)(
      'claude-sonnet-5-5',
      ANFRAGE,
      new AbortController().signal,
    );
    assert.equal(rn.art, 'ausweichen');

    for (const status of [400, 401, 404]) {
      const f = fakeFetch(() =>
        json(
          status,
          JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'nein' } }),
        ),
      );
      const r = await anthropicRufer(f.fn, SCHLUESSEL)(
        'claude-sonnet-5-5',
        ANFRAGE,
        new AbortController().signal,
      );
      assert.deepEqual(r, { art: 'fehler', status }, String(status));
    }

    const unlesbar = fakeFetch(() => json(200, '<html>kein JSON</html>'));
    const ru = await anthropicRufer(unlesbar.fn, SCHLUESSEL)(
      'claude-sonnet-5-5',
      ANFRAGE,
      new AbortController().signal,
    );
    assert.equal(ru.art, 'fehler');
  },
);

Deno.test(
  '11.3 Header x-api-key und anthropic-version gesetzt; Schlüssel erscheint in keiner Fehlermeldung',
  async () => {
    const gueltig = await fixture('antwort_gueltig.json');
    const f = fakeFetch(() => json(200, gueltig));
    await anthropicRufer(f.fn, SCHLUESSEL)('claude-haiku-5-5', ANFRAGE, new AbortController().signal);
    assert.equal(f.aufrufe.length, 1);
    const a = f.aufrufe[0];
    assert.ok(a);
    assert.equal(a.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(a.init?.method, 'POST');
    const header = new Headers(a.init?.headers);
    assert.equal(header.get('x-api-key'), SCHLUESSEL);
    assert.match(header.get('anthropic-version') ?? '', /^\d{4}-\d{2}-\d{2}$/);
    assert.match(header.get('content-type') ?? '', /application\/json/);
    assert.deepEqual(JSON.parse(String(a.init?.body)), ANFRAGE);
    assert.ok(!String(a.init?.body).includes(SCHLUESSEL));

    const faelle: (() => Response | Promise<Response>)[] = [
      () =>
        json(
          401,
          JSON.stringify({
            type: 'error',
            error: { type: 'authentication_error', message: 'invalid x-api-key' },
          }),
        ),
      () => json(529, '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}'),
      () => json(200, 'kein JSON'),
      () => Promise.reject(new TypeError(`fetch failed`)),
    ];
    for (const fall of faelle) {
      const g = fakeFetch(fall);
      const { wert, ausgabe } = await ohneKonsole(() =>
        anthropicRufer(g.fn, SCHLUESSEL)('claude-sonnet-5-5', ANFRAGE, new AbortController().signal),
      );
      assert.ok(!JSON.stringify(wert).includes(SCHLUESSEL));
      assert.ok(!ausgabe.includes(SCHLUESSEL));
    }
  },
);

Deno.test('11.3 Abbruch über signal wird an fetch weitergegeben', async () => {
  const steuerung = new AbortController();
  const aufrufe: Aufruf[] = [];
  const haengt = ((input: RequestInfo | URL, init?: RequestInit) => {
    aufrufe.push({ url: String(input), init });
    return new Promise<Response>((_, reject) => {
      const signal = init?.signal;
      // ohne signal oder schon abgebrochen sofort beenden, damit der Test nie hängt
      if (!signal) return reject(new TypeError('fetch ohne signal'));
      if (signal.aborted) return reject(new DOMException('abgebrochen', 'AbortError'));
      signal.addEventListener('abort', () => reject(new DOMException('abgebrochen', 'AbortError')), {
        once: true,
      });
    });
  }) as typeof fetch;
  const laufend = anthropicRufer(haengt, SCHLUESSEL)('claude-sonnet-5-5', ANFRAGE, steuerung.signal);
  await Promise.resolve();
  steuerung.abort();
  const r = await laufend.then(
    (wert) => ({ wert }),
    (fehler: unknown) => ({ fehler }),
  );
  assert.equal(aufrufe.length, 1);
  assert.equal(aufrufe[0]?.init?.signal?.aborted, true);
  assert.ok(!JSON.stringify(r).includes(SCHLUESSEL));
});
