// Reine Hilfen des Service Workers für Push und Quittung (Plan 13 «Service Worker»; 11.3, R5.5 Zustellung;
// 04_architektur.md 5: Quittung ohne Sitzung, nur mit Signatur).

export interface Quittung {
  versand_id: string;
  signatur: string;
  ereignis: 'angezeigt' | 'geoeffnet';
}

const TAGS: readonly string[] = ['heute', 'test', 'kurzpruefung', 'timer'];

const text = (w: unknown, ersatz: string) => (typeof w === 'string' && w !== '' ? w : ersatz);

/** Titel und Optionen für showNotification aus der Nutzlast { titel, text, versand_id, signatur, tag, url } */
export function benachrichtigungAus(nutzlast: unknown): {
  titel: string;
  optionen: {
    body: string;
    tag: string;
    renotify: boolean;
    data: { versand_id: string; signatur: string; url: string };
  };
} {
  const n = (nutzlast && typeof nutzlast === 'object' ? nutzlast : {}) as Record<string, unknown>;
  const tag = TAGS.includes(n['tag'] as string) ? (n['tag'] as string) : 'heute';
  const url = n['url'];
  return {
    titel: text(n['titel'], 'Hydrovisor'),
    optionen: {
      body: text(n['text'], ''),
      tag,
      // nur der Timer klingelt erneut, damit ein zweiter Timer auffällt (Plan 31 A9)
      renotify: tag === 'timer',
      data: {
        versand_id: text(n['versand_id'], ''),
        signatur: text(n['signatur'], ''),
        // nur Hash-Routen der App (Plan 31 A10)
        url: typeof url === 'string' && url.startsWith('#/') ? url : '#/heute',
      },
    },
  };
}

/** POST an die Function push-quittung (ohne Sitzung) */
export function quittungsAnfrage(basisUrl: string, quittung: Quittung): { url: string; init: RequestInit } {
  return {
    url: `${basisUrl.replace(/\/+$/, '')}/functions/v1/push-quittung`,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(quittung),
      keepalive: true,
    },
  };
}
