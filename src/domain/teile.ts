// Lesehilfen auf den Teilen des Offline-Bündels (Plan 12, Plan 13): rein, damit Client (Heute, Messen) und
// Edge Function push-taeglich dieselben Zeilen gleich lesen (R5.1). src/ui/bundeldaten.ts reicht sie weiter.
import type { GeraeteEreignis, Kalibrierdaten, KalibrierZeile } from './kalibrierung/stand.ts';

export type Teile = Record<string, readonly unknown[]>;

export interface Messgeraet {
  id: string;
  u_ec: number;
  u_ph: number;
}

const teil = <T>(t: Teile | undefined, name: string) => (t?.[name] ?? []) as readonly T[];

/** erstes Messgerät (A3) */
export function messgeraetAus(t: Teile | undefined): Messgeraet | undefined {
  const g = teil<Messgeraet>(t, 'messgeraet')[0];
  return g ? { id: g.id, u_ec: Number(g.u_ec), u_ph: Number(g.u_ph) } : undefined;
}

export function kalibrierdatenAus(t: Teile | undefined): Kalibrierdaten {
  const termine = teil<{ feste_kalibriertermine?: string[] | null }>(t, 'einstellung')[0]
    ?.feste_kalibriertermine;
  return {
    kalibrierungen: teil<KalibrierZeile>(t, 'kalibrierung'),
    ereignisse: teil<GeraeteEreignis>(t, 'ereignis'),
    festeTermine: termine ?? [],
  };
}

export function messungenAus(t: Teile | undefined) {
  return teil<{ platz_id: string | null; gilt_ab: string; storniert_am: string | null }>(t, 'messung');
}

/** Füllzustand und Prüfstatus eines Platzes aus den Sichten */
export function zustandAus(
  t: Teile | undefined,
  platzId: string,
): { fuellzustand?: 'leer' | 'loesung'; status?: string } {
  const fuell = teil<{ platz_id: string; fuellzustand: 'leer' | 'loesung' }>(t, 'v_fuellzustand').find(
    (z) => z.platz_id === platzId,
  )?.fuellzustand;
  const gefaess = teil<{ id: string; platz_id: string; gueltig_bis: string | null }>(t, 'gefaess').find(
    (g) => g.platz_id === platzId && g.gueltig_bis === null,
  );
  const status = gefaess
    ? teil<{ gefaess_id: string; status: string }>(t, 'v_gefaess_status').find(
        (s) => s.gefaess_id === gefaess.id,
      )?.status
    : undefined;
  return { ...(fuell ? { fuellzustand: fuell } : {}), ...(status ? { status } : {}) };
}
