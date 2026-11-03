// Teile des Offline-Bündels für Messen, Kalibrieren und Heute (Plan 12): lesen, nie rechnen.
import type { Buendel } from '../domain/datenpfad/buendel.ts';
import type { GeraeteEreignis, Kalibrierdaten, KalibrierZeile } from '../domain/kalibrierung/stand.ts';

export interface Messgeraet {
  id: string;
  u_ec: number;
  u_ph: number;
}

const teil = <T>(b: Buendel | undefined, name: string) => (b?.teile[name] ?? []) as readonly T[];

/** erstes Messgerät im Bündel (A3) */
export function messgeraet(b: Buendel | undefined): Messgeraet | undefined {
  const g = teil<Messgeraet>(b, 'messgeraet')[0];
  return g ? { id: g.id, u_ec: Number(g.u_ec), u_ph: Number(g.u_ph) } : undefined;
}

export function kalibrierdaten(b: Buendel | undefined): Kalibrierdaten {
  const termine = teil<{ feste_kalibriertermine?: string[] | null }>(b, 'einstellung')[0]
    ?.feste_kalibriertermine;
  return {
    kalibrierungen: teil<KalibrierZeile>(b, 'kalibrierung'),
    ereignisse: teil<GeraeteEreignis>(b, 'ereignis'),
    festeTermine: termine ?? [],
  };
}

export function messungenIm(b: Buendel | undefined) {
  return teil<{ platz_id: string | null; gilt_ab: string; storniert_am: string | null }>(b, 'messung');
}

/** Füllzustand und Prüfstatus eines Platzes aus den Sichten im Bündel */
export function zustandVon(
  b: Buendel | undefined,
  platzId: string,
): { fuellzustand?: 'leer' | 'loesung'; status?: string } {
  const fuell = teil<{ platz_id: string; fuellzustand: 'leer' | 'loesung' }>(b, 'v_fuellzustand').find(
    (z) => z.platz_id === platzId,
  )?.fuellzustand;
  const gefaess = teil<{ id: string; platz_id: string; gueltig_bis: string | null }>(b, 'gefaess').find(
    (g) => g.platz_id === platzId && g.gueltig_bis === null,
  );
  const status = gefaess
    ? teil<{ gefaess_id: string; status: string }>(b, 'v_gefaess_status').find(
        (s) => s.gefaess_id === gefaess.id,
      )?.status
    : undefined;
  return { ...(fuell ? { fuellzustand: fuell } : {}), ...(status ? { status } : {}) };
}

/** aktueller Zeitpunkt für Ereignis-Handler; Date.now() nur in der Oberfläche (CLAUDE.md) */
export function jetzt(): Date {
  return new Date(Date.now());
}
