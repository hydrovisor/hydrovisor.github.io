// Zustellung der Sammel-Push je Tag aus v_push_zustellung (UC8-AK8, EK5; Plan 31 Schritt 10, A11): die Maske #/push zeigt
// die letzten 14 Tage, damit Abnahme 2 ohne SQL-Zugang zur Produktion möglich ist. Rein, ohne Uhr.

export interface ZustellungTag {
  datum_lokal: string | null;
  soll: string | null;
  gesendet_am: string | null;
  verspaetung_min: number | null;
  angezeigt_am: string | null;
  email_gesendet_am: string | null;
  aufgaben: number | null;
  am_faelligkeitstag: number | null;
}

/**
 * EK5: Anteil der Aufgaben der Tagesliste, die am Fälligkeitstag in einer angezeigten Push standen; Nenner alle
 * Aufgaben der Tage. undefined ohne Aufgaben.
 */
export function ek5Anteil(
  tage: readonly ZustellungTag[],
): { anteil: number; zaehler: number; nenner: number } | undefined {
  let zaehler = 0;
  let nenner = 0;
  for (const t of tage) {
    nenner += t.aufgaben ?? 0;
    if (t.angezeigt_am) zaehler += t.am_faelligkeitstag ?? 0;
  }
  return nenner === 0 ? undefined : { anteil: zaehler / nenner, zaehler, nenner };
}

/** neueste zuerst, höchstens n Tage */
export function letzteTage(tage: readonly ZustellungTag[], n = 14): ZustellungTag[] {
  return [...tage]
    .filter((t) => t.datum_lokal !== null)
    .sort((a, b) => ((a.datum_lokal ?? '') < (b.datum_lokal ?? '') ? 1 : -1))
    .slice(0, n);
}
