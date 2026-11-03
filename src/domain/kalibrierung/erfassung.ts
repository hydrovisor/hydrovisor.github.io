// Kalibrierung erfassen (Konzept 5.6, R10.3, G3; Plan 12): Gegenprobe in Hundertsteln, Datenart der Anlage.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Erfassungsbindung } from '../messung/erfassung.ts';
import type { Datenart } from './stand.ts';

/** Sollwert der Gegenprobe in der Lösung EC 1413 µS/cm, Anzeige 1.41 */
export const GEGENPROBE_SOLL = 1.41;

/** |round(g·100) − 141| ≤ round(u_EC·100) */
export function gegenprobeOk(gegenprobeEc: number, uEc: number): boolean {
  return (
    Math.abs(Math.round(gegenprobeEc * 100) - Math.round(GEGENPROBE_SOLL * 100)) <= Math.round(uEc * 100)
  );
}

export function kalibrierungVorgang(
  k: {
    messgeraetId: string;
    datenart: Datenart;
    gegenprobeEc: number;
    nachReinigung: boolean;
    warFaelligAm?: string;
    dauerS?: number;
  },
  bindung: Erfassungsbindung,
): Schritt {
  const felder: Record<string, unknown> & { client_id: string } = {
    client_id: bindung.clientId,
    gilt_ab: bindung.giltAb,
    messgeraet_id: k.messgeraetId,
    datenart: k.datenart,
    gegenprobe_ec: k.gegenprobeEc,
    nach_reinigung: k.nachReinigung,
    war_faellig_am: k.warFaelligAm ?? null,
  };
  if (k.dauerS !== undefined) felder['dauer_s'] = k.dauerS;
  return { art: 'neu', tabelle: 'kalibrierung', felder };
}
