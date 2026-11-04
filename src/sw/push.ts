// Reine Hilfen des Service Workers für Push und Quittung (Plan 13 «Service Worker»; 11.3, R5.5 Zustellung;
// 04_architektur.md 5: Quittung ohne Sitzung, nur mit Signatur).

export interface Quittung {
  versand_id: string;
  signatur: string;
  ereignis: 'angezeigt' | 'geoeffnet';
}

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
  return {
    titel: text(n['titel'], 'Hydrovisor'),
    optionen: {
      body: text(n['text'], ''),
      tag: n['tag'] === 'test' ? 'test' : 'heute',
      renotify: false,
      data: {
        versand_id: text(n['versand_id'], ''),
        signatur: text(n['signatur'], ''),
        url: text(n['url'], '#/heute'),
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
