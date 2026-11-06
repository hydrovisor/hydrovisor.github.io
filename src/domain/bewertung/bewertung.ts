// Bewertung je Messwert in ganzen Hundertsteln (Plan 26; R10.1 EC, R10.2 pH und Temperatur, G3).
// Rein: keine Zeit, keine Teile; Sollband und Gerät kommen als Parameter.
import type { Groesse } from '../messung/eingabe.ts';
import type { Sollband } from './sollband.ts';

export type Hundertstel = number;
export interface Band {
  min: Hundertstel;
  max: Hundertstel;
}
/** gleich dem Enum `bewertung` der Datenbank */
export type Bewertung = 'gruen' | 'knapp' | 'ausserhalb';

/** Wert aus dem Bündel (numeric als Zahl oder Text) in Hundertsteln, ohne Gleitkommarest (G3) */
export function inHundertstel(wert: number | string): Hundertstel {
  return Math.round(Number(wert) * 100);
}

/** Abstand zum Band, 0 im Band (Grenzen eingeschlossen) */
function abstand(wert: Hundertstel, band: Band): { abweichung: Hundertstel; grenze: Hundertstel } {
  if (wert > band.max) return { abweichung: wert - band.max, grenze: band.max };
  if (wert < band.min) return { abweichung: band.min - wert, grenze: band.min };
  return { abweichung: 0, grenze: wert };
}

/** R10.1: max(⌊8 % der verletzten Grenze⌋, 10, u_EC) in Hundertsteln */
export function knappZone(verletzteGrenze: Hundertstel, uEc: Hundertstel): Hundertstel {
  return Math.max(Math.floor((verletzteGrenze * 8) / 100), 10, uEc);
}

export function bewerteEc(wert: Hundertstel, band: Band, uEc: Hundertstel): Bewertung {
  const { abweichung, grenze } = abstand(wert, band);
  if (abweichung === 0) return 'gruen';
  return abweichung <= knappZone(grenze, uEc) ? 'knapp' : 'ausserhalb';
}

/** R10.2: bis u_pH grün, bis 0.20 knapp, darüber ausserhalb */
export function bewertePh(wert: Hundertstel, band: Band, uPh: Hundertstel): Bewertung {
  const { abweichung } = abstand(wert, band);
  if (abweichung <= uPh) return 'gruen';
  return abweichung <= 20 ? 'knapp' : 'ausserhalb';
}

/** R10.2: im Band grün, bis 2 °C daneben knapp, darüber ausserhalb */
export function bewerteTemperatur(wert: Hundertstel, band: Band): Bewertung {
  const { abweichung } = abstand(wert, band);
  if (abweichung === 0) return 'gruen';
  return abweichung <= 200 ? 'knapp' : 'ausserhalb';
}

/** Bewertung nur für die übergebenen Grössen */
export function bewerten(
  werte: Partial<Record<Groesse, Hundertstel>>,
  sollband: Sollband,
  geraet: { uEc: Hundertstel; uPh: Hundertstel },
): Partial<Record<Groesse, Bewertung>> {
  const r: Partial<Record<Groesse, Bewertung>> = {};
  // Mischentscheid Leitkultur oder Kompromiss: höchstens «Knapp daneben» (R2.4, R10.2)
  const kappen = (b: Bewertung): Bewertung => (sollband.hoechstensKnapp && b === 'gruen' ? 'knapp' : b);
  if (werte.ph !== undefined) r.ph = kappen(bewertePh(werte.ph, sollband.ph, geraet.uPh));
  if (werte.ec !== undefined) r.ec = kappen(bewerteEc(werte.ec, sollband.ec, geraet.uEc));
  if (werte.temperatur !== undefined) r.temperatur = bewerteTemperatur(werte.temperatur, sollband.temperatur);
  return r;
}

/** Brücke zum Design System (StatusIcon, Ergebnis) */
export const TON: Readonly<Record<Bewertung, 'ok' | 'warn' | 'danger'>> = {
  gruen: 'ok',
  knapp: 'warn',
  ausserhalb: 'danger',
};

/** Rang für die Reihenfolge der Hinweise: ausserhalb zuerst */
export const RANG: Readonly<Record<Bewertung, number>> = { ausserhalb: 0, knapp: 1, gruen: 2 };

/** Hundertstel als Text mit den Dezimalen der Eingabe (pH und °C eine, EC zwei; A13) */
export function alsText(groesse: Groesse, wert: Hundertstel): string {
  const vorzeichen = wert < 0 ? '-' : '';
  const b = Math.abs(wert);
  if (groesse === 'ec') return `${vorzeichen}${Math.floor(b / 100)}.${String(b % 100).padStart(2, '0')}`;
  const zehntel = Math.round(b / 10);
  return `${vorzeichen}${Math.floor(zehntel / 10)}.${zehntel % 10}`;
}
