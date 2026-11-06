// pH-Ziel der Ersteinstellung und pH-Korrektur im Betrieb (Konzept R4.14, R4.11; UC9 Ablauf 6; Plan 29 A1 bis A3).
// Rein. pH in Hundertsteln, Volumen in Hundertsteln l, Mengen in Zehnteln ml; die Wirkung w ist ml pH-Minus je l je
// 0.1 pH. Gerechnet wird exakt mit Brüchen, gerundet genau einmal am Ende (G3).
import type { Hinweis } from './bewertung/hinweise.ts';
import type { Band, Hundertstel } from './bewertung/bewertung.ts';
import { bruch, durch, mal, minus, runde, vergleich, type Bruch } from './rechner-zahlen.ts';

export type PhArt = 'dwc' | 'konstantpegel' | 'kratky' | 'kratky_belueftet' | 'station';

/** Wartezeit bis zum Nachmessen nach einer pH-Korrektur (R4.14) */
export const NACHMESSEN_MIN = 15;
const STATION_PH = 600;
const WIRKUNG_STANDARD = bruch(1, 10);
const MASSNAHME_SENKEN = 'pH schrittweise senken';

/** DWC und Konstantpegel Bandmitte, Kratky unterer Rand, Station 6.00 (R4.14) */
export function phZielErsteinstellung(e: { art: PhArt; phBand?: Band }): Hundertstel {
  if (e.art === 'station' || !e.phBand) return STATION_PH;
  if (e.art === 'kratky' || e.art === 'kratky_belueftet') return e.phBand.min;
  return runde(bruch(e.phBand.min + e.phBand.max, 2));
}

/** Mittel aus `v_ph_wirkung`; ohne Wert 0.1 ml je l je 0.1 pH (R4.14) */
export function phWirkung(sicht: number | null): Bruch {
  if (sicht === null || !Number.isFinite(sicht) || sicht <= 0) return WIRKUNG_STANDARD;
  return bruch(Math.round(sicht * 10000), 10000);
}

/**
 * «zuerst» höchstens die Hälfte (R4.14): auf die Stufe nach R4.11 abgerundet, unter 5 ml 0.1 ml, sonst 0.5 ml;
 * mindestens 0.1 ml (keine Komponente auf 0, R4.4). Prüferbefund 15.
 */
function hoechstensMenge(roh: Bruch): number {
  const stufe = vergleich(roh, 50) < 0 ? 1 : 5;
  const zehntel = stufe * Math.floor(roh.z / (roh.n * stufe));
  return Math.max(1, zehntel);
}

export type PhVorschlag =
  | { art: 'kein' }
  | { art: 'vorschlag'; vorschlagMl: Bruch; zuerstMl: number; erwartet: Hundertstel; text: string };

function phText(hundertstel: number): string {
  return (runde(bruch(hundertstel, 10)) / 10).toFixed(1);
}

/**
 * Vorschlag = w · V · (pHIst − pHZiel) / 0.1; zuerst höchstens die Hälfte, gerundet nach R4.11 (oder die geänderte
 * Menge); erwartet = pHIst − zuerst / (w · V) · 0.1.
 */
export function phKorrekturVorschlag(e: {
  volumen: number;
  phIst: Hundertstel;
  phZiel: Hundertstel;
  w: Bruch;
  mengeMl?: number;
}): PhVorschlag {
  if (e.phIst <= e.phZiel || e.volumen <= 0 || vergleich(e.w, 0) <= 0) return { art: 'kein' };
  // Zehntel ml = w · (V/100 l) · ((Δ/100 pH) / 0.1) · 10 = w · V · Δ / 100
  const wV = mal(e.w, e.volumen);
  const vorschlagMl = durch(mal(wV, e.phIst - e.phZiel), 100);
  const zuerstMl = e.mengeMl ?? hoechstensMenge(durch(vorschlagMl, 2));
  // Hundertstel pH = (zuerst/10 ml) / (w · V/100) · 0.1 · 100 = zuerst · 100 / (w · V)
  const erwartet = runde(minus(e.phIst, durch(zuerstMl * 100, wV)));
  return {
    art: 'vorschlag',
    vorschlagMl,
    zuerstMl,
    erwartet,
    text: `zuerst ${(zuerstMl / 10).toFixed(1)} ml, erwartet ${phText(erwartet)}, nach ${String(NACHMESSEN_MIN)} min nachmessen`,
  };
}

/** Vorschlag nur, wenn die Ergebniszone die Massnahme «pH schrittweise senken» trägt (A2) */
export function phKorrekturAngebot(hinweise: readonly Hinweis[]): boolean {
  return hinweise.some((h) => h.massnahme.startsWith(MASSNAHME_SENKEN));
}
