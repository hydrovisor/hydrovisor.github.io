// Anthropic-Rufer der Recherche mit Serverwerkzeugen (Konzept 11.3; 04_architektur.md 6, 10; Plan 37).
// Statusabbildung wie ki-tuete/modell.ts; stop_reason pause_turn setzt den Turn mit der Antwort als assistant-Nachricht
// fort, höchstens zweimal. Wirft nie; der Schlüssel steht nur im Header x-api-key.
// Eine Fortsetzung bei pause_turn ist derselbe Turn und zählt deshalb nicht als eigene Zeile ki_aufruf; das
// Tageslimit zählt Turns, höchstens drei Requests je Zeile (A, Prüferbefund B8).
import { letzterTextblock } from '../../../src/domain/ki/recherche.ts';
import { PAUSEN_MAX } from '../../../src/domain/ki/modelle.ts';
import type { ModellAntwort, ModellRufer } from '../ki-tuete/kern.ts';

const ADRESSE = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export function rechercheRufer(fetchFn: typeof fetch, schluessel: string): ModellRufer {
  return async (_modell, anfrage, signal): Promise<ModellAntwort> => {
    let koerper: Record<string, unknown> = anfrage;
    for (let runde = 0; runde <= PAUSEN_MAX; runde++) {
      let antwort: Response;
      try {
        antwort = await fetchFn(ADRESSE, {
          method: 'POST',
          headers: {
            'x-api-key': schluessel,
            'anthropic-version': API_VERSION,
            'content-type': 'application/json',
          },
          body: JSON.stringify(koerper),
          signal,
        });
      } catch {
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
      const b = body as { stop_reason?: unknown; content?: unknown };
      if (b?.stop_reason === 'pause_turn') {
        const bisher = (koerper['messages'] as unknown[] | undefined) ?? [];
        koerper = { ...koerper, messages: [...bisher, { role: 'assistant', content: b.content }] };
        continue;
      }
      const gelesen = letzterTextblock(body);
      return gelesen
        ? {
            art: 'ok',
            text: gelesen.text,
            eingabeTokens: gelesen.eingabeTokens,
            ausgabeTokens: gelesen.ausgabeTokens,
          }
        : { art: 'fehler', status };
    }
    return { art: 'fehler' };
  };
}
