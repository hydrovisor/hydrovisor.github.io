// Messfälligkeit je Ort (R5.2 «Messen», R5.4 Füllzustand; G2; Plan 12): letzte Messung am Platz + Intervall in
// Kalendertagen Zürich. Grundlage für die Aufgabe «Messen» in I1b-02 (aufgaben), dort ohne eigene Regel.
import { kalendertag, tagPlus, tageZwischen, type Zeitzone } from '../zeit.ts';

export type Messfaelligkeit =
  | { art: 'keine'; grund: 'leer' | 'ruht' | 'kein_gefaess' }
  | { art: 'offen'; faelligAm: string; faellig: boolean; tageUeberfaellig: number; letzte?: string };

export function messFaelligkeit(
  ort: {
    platzId: string;
    intervallMessenD: number | null;
    fuellzustand?: 'leer' | 'loesung';
    status?: string;
  },
  messungen: readonly { platz_id: string | null; gilt_ab: string; storniert_am: string | null }[],
  stichtag: Date,
  zeitzone: Zeitzone,
): Messfaelligkeit {
  if (ort.intervallMessenD === null) return { art: 'keine', grund: 'kein_gefaess' };
  if (ort.fuellzustand === 'leer') return { art: 'keine', grund: 'leer' };
  if (ort.status === 'ruht') return { art: 'keine', grund: 'ruht' };
  const heute = kalendertag(stichtag, zeitzone);
  const letzte = messungen
    .filter((m) => m.platz_id === ort.platzId && m.storniert_am === null)
    .reduce<string | undefined>(
      (l, m) => (!l || Date.parse(m.gilt_ab) > Date.parse(l) ? m.gilt_ab : l),
      undefined,
    );
  // ohne Messung im Bündel gilt «heute» (A11)
  const faelligAm = letzte ? tagPlus(kalendertag(new Date(letzte), zeitzone), ort.intervallMessenD) : heute;
  const faellig = heute >= faelligAm;
  const ergebnis = {
    art: 'offen' as const,
    faelligAm,
    faellig,
    tageUeberfaellig: faellig ? tageZwischen(faelligAm, heute) : 0,
  };
  return letzte ? { ...ergebnis, letzte } : ergebnis;
}
