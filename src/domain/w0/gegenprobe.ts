// Gegenprobe gegen die Ziel-EC des Düngeplans V1.6 Abschnitt 4 (03_import_w0.md Abschnitt 7, Konzept 9.4):
// Bandmitte als Gesamt-EC mit ECWasser 0.5; weicht sie um mehr als 0.4 mS/cm von allen Vergleichswerten der Art
// und Phase ab, entsteht ein Konflikt für Tim, kein Abbruch (A13).
import { artGruppe, ersteRunde, wert, zeilen } from './bestand.ts';
import { DATEI } from './schema.ts';
import type { Konflikt, W0Dateien } from './typen.ts';
import { ecTausendstel, type EcEinheit } from './umrechnung.ts';

/** Vergleichswerte in mS/cm je art_id und Phase (A, Tabelle Gegenprobe) */
export const VERGLEICH: Record<string, Partial<Record<string, number[]>>> = {
  solanum_lycopersicum: { anzucht: [1.0], wachstum: [1.5], bluete: [1.9], fruchtbildung_reife: [2.1] },
  capsicum_annuum: { anzucht: [1.1], wachstum: [1.7], bluete: [1.9], fruchtbildung_reife: [2.1] },
  ocimum_basilicum: { anzucht: [1.0], wachstum: [1.4] },
  brassica_rapa_chinensis: { anzucht: [1.0], wachstum: [1.4] },
  petroselinum_crispum: { wachstum: [1.3] },
  allium_schoenoprasum: { wachstum: [1.3] },
  lactuca_sativa: { anzucht: [1.0], wachstum: [1.2, 1.0] },
  valerianella_locusta: { wachstum: [1.0] },
  spinacia_oleracea: { wachstum: [1.6] },
};

const EC_WASSER = 500; // Tausendstel mS/cm
const TOLERANZ = 400;

export function gegenprobe(d: W0Dateien): Konflikt[] {
  const runde = ersteRunde(d);
  const gruppe = artGruppe(d);
  const konflikte: Konflikt[] = [];
  for (const z of zeilen(d, 'profilwert')) {
    const artId = wert(z, 'bezug') ?? '';
    const phase = wert(z, 'phase') ?? '';
    const vergleich = VERGLEICH[artId]?.[phase];
    if (wert(z, 'ebene') !== 'art' || wert(z, 'groesse') !== 'ec' || !runde.has(artId) || !vergleich)
      continue;
    const einheit = wert(z, 'einheit_quelle') as EcEinheit | null;
    const min = wert(z, 'wert_min');
    const max = wert(z, 'wert_max');
    if (!einheit || !min || !max || !gruppe.has(artId)) continue;
    let summe: number;
    try {
      summe = ecTausendstel(min, einheit) + ecTausendstel(max, einheit);
    } catch {
      continue; // Formatfehler meldet der Validator
    }
    const mitte2 = summe + (wert(z, 'ec_basis') === 'zuwachs' ? 2 * EC_WASSER : 0);
    const abweichend = vergleich.every((v) => Math.abs(mitte2 - 2 * Math.round(v * 1000)) > 2 * TOLERANZ);
    if (!abweichend) continue;
    konflikte.push({
      datei: DATEI.profilwert,
      zeileId: wert(z, 'zeile_id') ?? '',
      artId,
      text: `Bandmitte ${(mitte2 / 2000).toFixed(3)} mS/cm gesamt weicht um mehr als 0.4 von ${vergleich.join(' / ')} (Düngeplan, ${phase}) ab`,
    });
  }
  return konflikte;
}
