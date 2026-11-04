// Anthropic-Rufer über fetch (Konzept 11.3; 04_architektur.md 6, 10; Plan 14). Laufzeitneutral: die Edge Function
// und das Eval-Skript nutzen ihn. Abbildung der HTTP-Status auf ModellAntwort; wirft nie; der Schlüssel geht nur in
// den Header x-api-key und erscheint weder in Rückgaben noch in der Konsole.
import { antwortAuslesen } from '../../../src/domain/ki/anfrage.ts';
import type { ModellRufer } from './kern.ts';

const ADRESSE = 'https://api.anthropic.com/v1/messages';
// Version der API (Header anthropic-version); output_config ist auf dieser Version verfügbar (Plan 14, Nachtrag)
const API_VERSION = '2023-06-01';

export function anthropicRufer(fetchFn: typeof fetch, schluessel: string): ModellRufer {
  return async (_modell, anfrage, signal) => {
    let antwort: Response;
    try {
      antwort = await fetchFn(ADRESSE, {
        method: 'POST',
        headers: {
          'x-api-key': schluessel,
          'anthropic-version': API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify(anfrage),
        signal,
      });
    } catch {
      // Netzfehler oder Abbruch über signal
      return { art: 'ausweichen' };
    }
    const status = antwort.status;
    if (status === 429 || status >= 500) {
      await antwort.body?.cancel().catch(() => undefined);
      return { art: 'ausweichen', status };
    }
    if (status < 200 || status >= 300) {
      await antwort.body?.cancel().catch(() => undefined);
      return { art: 'fehler', status };
    }
    let body: unknown;
    try {
      body = await antwort.json();
    } catch {
      return { art: 'fehler', status };
    }
    const gelesen = antwortAuslesen(body);
    return gelesen ? { art: 'ok', ...gelesen } : { art: 'fehler', status };
  };
}
