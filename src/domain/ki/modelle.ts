// Modelle, Fristen und Grenzen des KI-Aufrufs an einer Stelle (Konzept 11.1, 11.3, 16.4; Plan 14).
// Modell-IDs und Parameter am 4.11.2026 an der API-Referenz geprüft (Plan 14, Nachtrag).
// Default nach dem Eval vom 4.11.2026: Haiku (M0 erfüllt, 23 von 24), Sonnet als Ausweichmodell (Entscheid 0009).
export const HAUPTMODELL = 'claude-haiku-5-5';
export const AUSWEICHMODELL = 'claude-sonnet-5-5';
export const MAX_TOKENS = 2000;
export const FRIST_HAUPT_MS = 20_000;
export const FRIST_GESAMT_MS = 30_000;
export const AUFRUFE_JE_TAG = 30;
export const BILD_KANTE_MAX = 1568;
export const TEXT_MAX_ZEICHEN = 8000;

// Hydroponik-Recherche (Konzept 11.3, Erratum E8; Plan 37 A2). Werkzeugversionen am 6.11.2026 an der API-Referenz
// geprüft: die Varianten _20260209 (dynamische Filterung) gibt es für Sonnet 5.5, nicht für Haiku 5.5.
export const RECHERCHE_HAUPTMODELL = 'claude-sonnet-5-5';
export const RECHERCHE_AUSWEICHMODELL = 'claude-haiku-5-5';
export const RECHERCHE_FRIST_HAUPT_MS = 60_000;
export const RECHERCHE_FRIST_GESAMT_MS = 120_000;
export const RECHERCHE_MAX_TOKENS = 8000;
export const SUCHEN_MAX = 5;
/** Obergrenze der Abrufe des Quellenprüfers; je Quelle ein Abruf (Prüferbefund B5) */
export const ABRUFE_MAX = 10;
/** pause_turn höchstens so oft fortsetzen */
export const PAUSEN_MAX = 2;

const NEUE_WERKZEUGE = new Set(['claude-sonnet-5-5', 'claude-opus-5-5']);

export function werkzeugeFuer(modell: string): { webSearch: string; webFetch: string } {
  return NEUE_WERKZEUGE.has(modell)
    ? { webSearch: 'web_search_20260209', webFetch: 'web_fetch_20260209' }
    : { webSearch: 'web_search_20250305', webFetch: 'web_fetch_20250910' };
}
