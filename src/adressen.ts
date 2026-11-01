// Adressen der App (docs/spec/04_architektur.md Abschnitt 2). Eine eigene Domain ändert nur diese Werte.
export const BASIS_URL = 'https://hydrovisor.github.io/';
export const SCOPE = BASIS_URL;
export const START_URL = BASIS_URL + '#/heute';

// Für Manifest und Service Worker relativ zum Ursprung, damit die Vorschau auf Cloudflare dieselbe Datei nutzt (Plan 6, A2)
export const SCOPE_PFAD = new URL(SCOPE).pathname;
export const START_PFAD = SCOPE_PFAD + new URL(START_URL).hash;
