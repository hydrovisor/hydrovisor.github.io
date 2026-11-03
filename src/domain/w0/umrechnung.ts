// EC-Umrechnung in mS/cm (03_import_w0.md Abschnitt 6, Konzept 9.3): µS/cm durch 1000, ppm500 durch 500,
// ppm700 durch 700, CF durch 10, auf drei Dezimalen halb aufwärts, in ganzen Tausendsteln gerechnet (G3).
import { tausendstel } from './zahl.ts';

export type EcEinheit = 'mS/cm' | 'µS/cm' | 'ppm500' | 'ppm700' | 'cf';
export type EcBasis = 'gesamt' | 'zuwachs' | 'unbekannt';

export const EC_TEILER: Record<EcEinheit, number> = {
  'mS/cm': 1,
  'µS/cm': 1000,
  ppm500: 500,
  ppm700: 700,
  cf: 10,
};

/** EC in ganzen Tausendsteln mS/cm */
export function ecTausendstel(wert: string | number, einheit: EcEinheit): number {
  return tausendstel(wert, EC_TEILER[einheit]);
}

export function ecInMsCm(wert: number, einheit: EcEinheit): number {
  return ecTausendstel(wert, einheit) / 1000;
}
