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
