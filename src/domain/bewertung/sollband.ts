// Zielbereich der Bewertung heute (Plan 26 «Sollband der Bewertung»; R2.2 Zweck «Bewertung», R2.5, R4.5, R10.2;
// A1, A2). Erste zutreffende Quelle: Station, v_zielbereich, Schnappschuss des letzten Ansatzes; sonst keine.
// Alles in Hundertsteln, auch die Temperatur (18 °C = 1800).
import type { Teile } from '../teile.ts';
import { inHundertstel, type Band } from './bewertung.ts';

export interface Sollband {
  ph: Band;
  ec: Band;
  temperatur: Band;
  herkunft: 'station' | 'pflanzungen' | 'ansatz';
  /** R2.4, R10.2: Mischentscheid Leitkultur oder Kompromiss → pH und EC höchstens «Knapp daneben» */
  hoechstensKnapp?: true;
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];

/** Standard der Wassertemperatur ohne Band (G6, R10.2) */
export const TEMPERATUR_STANDARD: Band = { min: 1800, max: 2200 };
/** fester pH-Bereich der Station (R4.5, R10.2) */
const STATION_PH: Band = { min: 580, max: 630 };
/** ECWasser ohne Messung (G6) */
const EC_WASSER_STANDARD = 50;

const gesetzt = (x: unknown): x is number | string =>
  x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x));

function band(min: unknown, max: unknown): Band | undefined {
  if (!gesetzt(min) || !gesetzt(max)) return undefined;
  const b = { min: inHundertstel(min), max: inHundertstel(max) };
  return b.min <= b.max ? b : undefined;
}

const zeitpunkt = (x: unknown) => (typeof x === 'string' ? Date.parse(x) : Number.NaN);

/** gültige Ansätze am Platz bis jetzt, jüngster zuerst */
function ansaetzeAm(teile: Teile, platzId: string, jetzt: Date): Zeile[] {
  return teil(teile, 'naehrloesungsansatz')
    .filter(
      (a) =>
        a['platz_id'] === platzId &&
        (a['storniert_am'] ?? null) === null &&
        zeitpunkt(a['begonnen_am']) <= jetzt.getTime(),
    )
    .sort((a, b) => zeitpunkt(b['begonnen_am']) - zeitpunkt(a['begonnen_am']));
}

function ecWasser(teile: Teile, platzId: string): number {
  const anlageId = teil(teile, 'platz').find((p) => p['id'] === platzId)?.['anlage_id'];
  const zeilen = teil(teile, 'v_ec_wasser');
  const z = zeilen.find((w) => w['anlage_id'] === anlageId);
  return z && gesetzt(z['ec']) ? inHundertstel(z['ec']) : EC_WASSER_STANDARD;
}

function station(teile: Teile, platzId: string, jetzt: Date, temperatur: Band): Sollband {
  // Stadium aus dem letzten nicht abgebrochenen Neuansatz, ohne Ansatz die erste feste Dosis (A2)
  const neuansatz = ansaetzeAm(teile, platzId, jetzt).find(
    (a) => a['typ'] === 'neuansatz' && a['status'] !== 'abgebrochen',
  );
  const echteBlaetter = neuansatz?.['stadium_gewaehlt'] === 'echte_blaetter';
  const w = ecWasser(teile, platzId);
  const ec = echteBlaetter ? { min: w + 80, max: w + 120 } : { min: w + 30, max: w + 60 };
  return { ph: STATION_PH, ec, temperatur, herkunft: 'station' };
}

function ausSchnappschuss(a: Zeile): Sollband | undefined {
  const zb = (a['schnappschuss'] as { zielbereich?: Zeile } | null | undefined)?.zielbereich;
  if (!zb) return undefined;
  const ph = band(zb['ph_min'], zb['ph_max']);
  const ec = band(zb['ec_min'], zb['ec_max']);
  if (!ph || !ec) return undefined;
  return {
    ph,
    ec,
    temperatur: band(zb['temp_min'], zb['temp_max']) ?? TEMPERATUR_STANDARD,
    herkunft: 'ansatz',
  };
}

export function bewertungsband(teile: Teile, platzId: string, jetzt: Date): Sollband | undefined {
  const z = teil(teile, 'v_zielbereich').find((r) => r['platz_id'] === platzId);
  const temperaturSicht = z ? band(z['temp_min'], z['temp_max']) : undefined;

  // 1. Station mit fester Dosis
  const gefaess = teil(teile, 'gefaess').find(
    (g) =>
      g['platz_id'] === platzId &&
      (g['gueltig_bis'] ?? null) === null &&
      (g['storniert_am'] ?? null) === null,
  );
  if (gefaess?.['feste_dosis'] === true)
    return station(teile, platzId, jetzt, temperaturSicht ?? TEMPERATUR_STANDARD);

  // 1b. Mischentscheid (R2.4): der Schnappschuss des letzten Ansatzes mit Entscheid geht der Sicht vor
  //     (Runde 1 Befund 3; Ansätze mit Mischentscheid schreibt erst I1b-03)
  const letzterBasis = ansaetzeAm(teile, platzId, jetzt).find(
    (a) => a['typ'] === 'neuansatz' || a['typ'] === 'teilwechsel',
  );
  const entscheid = letzterBasis?.['mischentscheid'];
  if (letzterBasis && typeof entscheid === 'string' && entscheid !== 'keiner') {
    const aus = ausSchnappschuss(letzterBasis);
    if (aus)
      return entscheid === 'leitkultur' || entscheid === 'kompromiss'
        ? { ...aus, hoechstensKnapp: true }
        : aus;
  }

  // 2. v_zielbereich mit zählenden Pflanzungen und gültigem pH- und EC-Band
  if (z && Number(z['zaehlende_pflanzungen'] ?? 0) > 0) {
    const ph = band(z['ph_min'], z['ph_max']);
    const ec = band(z['ec_min'], z['ec_max']);
    if (ph && ec)
      return { ph, ec, temperatur: temperaturSicht ?? TEMPERATUR_STANDARD, herkunft: 'pflanzungen' };
  }

  // 3. Schnappschuss des letzten Neuansatzes oder Teilwechsels
  for (const a of ansaetzeAm(teile, platzId, jetzt)) {
    if (a['typ'] !== 'neuansatz' && a['typ'] !== 'teilwechsel') continue;
    const aus = ausSchnappschuss(a);
    if (aus) return aus;
  }

  // 4. kein Sollband (A3)
  return undefined;
}

/** Zielbereich in Einheiten wie im Tabellenkommentar von messung.schnappschuss (R2.5) */
export function alsSchnappschuss(s: Sollband): {
  ph_min: number;
  ph_max: number;
  ec_min: number;
  ec_max: number;
  temp_min: number;
  temp_max: number;
} {
  return {
    ph_min: s.ph.min / 100,
    ph_max: s.ph.max / 100,
    ec_min: s.ec.min / 100,
    ec_max: s.ec.max / 100,
    temp_min: s.temperatur.min / 100,
    temp_max: s.temperatur.max / 100,
  };
}
