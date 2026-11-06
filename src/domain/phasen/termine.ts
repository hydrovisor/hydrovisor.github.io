// Termine einer Phase (Plan 35; R1.5, TZ5 bis TZ7, A4, A9). Rein: Kalendertage als ISO-Text, gerechnet über tagPlus.
import { tagPlus } from '../zeit.ts';

export interface Dauer {
  min?: number;
  typ?: number;
  max?: number;
}

/** frühestens = Beginn + min, typisch = + typ, spätestens = + max, «prüfen» ab dem Tag danach */
export function phasenTermine(
  beginn: string,
  dauer: Dauer,
): { fruehestens?: string; typisch?: string; spaetestens?: string; pruefenAb?: string } {
  return {
    ...(dauer.min !== undefined ? { fruehestens: tagPlus(beginn, dauer.min) } : {}),
    ...(dauer.typ !== undefined ? { typisch: tagPlus(beginn, dauer.typ) } : {}),
    ...(dauer.max !== undefined
      ? { spaetestens: tagPlus(beginn, dauer.max), pruefenAb: tagPlus(beginn, dauer.max + 1) }
      : {}),
  };
}

/** «Tag y von min–max», bei min = max «Tag y von n», ohne Spanne «Tag y» */
export function phasenText(tagInPhase: number, dauer: Dauer): string {
  const tag = `Tag ${String(tagInPhase)}`;
  if (dauer.min === undefined || dauer.max === undefined) return tag;
  return dauer.min === dauer.max
    ? `${tag} von ${String(dauer.min)}`
    : `${tag} von ${String(dauer.min)}–${String(dauer.max)}`;
}

/** Fragetag: typischer Tag, nach «Noch nicht» oder «Problem» am Tag a frühestens a + 2 (der spätere) */
export function fragetag(e: { typisch?: string; letzteAufschiebung?: string }): string | undefined {
  if (!e.typisch) return undefined;
  if (!e.letzteAufschiebung) return e.typisch;
  const nachher = tagPlus(e.letzteAufschiebung, 2);
  return nachher > e.typisch ? nachher : e.typisch;
}
