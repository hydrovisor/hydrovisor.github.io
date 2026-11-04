// Gemeinsame Bündel-Teile für die Push-Tests (Plan 13 Testliste): Vitest (tests/unit/push-*.test.ts) und die
// Deno-Tests der Edge Function (supabase/functions/push-taeglich/kern.test.ts) importieren diese Datei relativ.
// Darum reines TypeScript ohne vitest-, node:- oder Deno-Abhängigkeit. Zeilen in der Form von PostgREST
// (snake_case), wie sie das Bündel und PushDaten.teile() liefern. Keine Personendaten (CLAUDE.md Regel 6).
// Anlage R ist echt, Anlage D ist demo; feste Kalibriertermine leer, damit nur «letzte + 30 Tage» gilt.

export const ZONE = 'Europe/Zurich';
export const MESSGERAET_ID = '00000000-0000-4000-8000-00000000a001';

export interface OrtVorgabe {
  anlage: 'R' | 'D';
  /** Kennung des Platzes, Code = Anlage + «-» + Kennung */
  kennung: string;
  /** Intervall Messen in Tagen; ohne Angabe 2 */
  intervall?: number;
  /** letzte Messung am Platz (ISO in UTC); ohne Angabe keine Messung (gilt als heute fällig) */
  letzteMessung?: string;
  /** Füllzustand leer (R5.4: nicht messbar) */
  leer?: boolean;
  /** Messstelle ohne Gefäss (keine eigene Fälligkeit) */
  messstelle?: boolean;
}

export interface TeileVorgabe {
  /** letzte echte Kalibrierung (ISO); null = noch nie (Erstkalibrierung) */
  echtKalibriert: string | null;
  /** letzte Demo-Kalibrierung (ISO), zählt nie für die echte Fälligkeit (G5) */
  demoKalibriert?: string;
  orte: readonly OrtVorgabe[];
  /** ohne Messgerät im Bündel */
  ohneMessgeraet?: boolean;
}

const ANLAGE_ID: Record<'R' | 'D', string> = {
  R: '00000000-0000-4000-8000-00000000b001',
  D: '00000000-0000-4000-8000-00000000b002',
};

const hex = (n: number) => n.toString(16).padStart(12, '0');

/** platz_id zum Code, z. B. platzId('R-2.3') */
export function platzId(code: string): string {
  let summe = 0;
  for (const zeichen of code) summe = (summe * 31 + zeichen.charCodeAt(0)) % 0xffffffffff;
  return `00000000-0000-4000-8000-${hex(summe)}`;
}

/** Bündel-Teile für tagesliste() und PushDaten.teile() */
export function teileFuer(vorgabe: TeileVorgabe): Record<string, unknown[]> {
  const kalibrierung: unknown[] = [];
  if (vorgabe.echtKalibriert)
    kalibrierung.push({
      id: '00000000-0000-4000-8000-00000000c001',
      messgeraet_id: MESSGERAET_ID,
      datenart: 'echt',
      gilt_ab: vorgabe.echtKalibriert,
      storniert_am: null,
    });
  if (vorgabe.demoKalibriert)
    kalibrierung.push({
      id: '00000000-0000-4000-8000-00000000c002',
      messgeraet_id: MESSGERAET_ID,
      datenart: 'demo',
      gilt_ab: vorgabe.demoKalibriert,
      storniert_am: null,
    });
  const platz: unknown[] = [];
  const gefaess: unknown[] = [];
  const fuell: unknown[] = [];
  const messung: unknown[] = [];
  vorgabe.orte.forEach((o, i) => {
    const code = `${o.anlage}-${o.kennung}`;
    const id = platzId(code);
    platz.push({
      id,
      anlage_id: ANLAGE_ID[o.anlage],
      kennung: o.kennung,
      rolle: o.messstelle ? 'messstelle' : 'gefaess',
      aktiv: true,
      storniert_am: null,
    });
    if (o.messstelle) return;
    gefaess.push({
      id: `00000000-0000-4000-8000-0000000d${hex(i).slice(-4)}`,
      platz_id: id,
      betriebsart: 'dwc',
      intervall_messen_d: o.intervall ?? 2,
      gueltig_bis: null,
      storniert_am: null,
    });
    fuell.push({ platz_id: id, fuellzustand: o.leer ? 'leer' : 'loesung' });
    if (o.letzteMessung)
      messung.push({
        id: `00000000-0000-4000-8000-0000000e${hex(i).slice(-4)}`,
        platz_id: id,
        gilt_ab: o.letzteMessung,
        storniert_am: null,
      });
  });
  return {
    anlage: [
      { id: ANLAGE_ID.R, kuerzel: 'R', datenart: 'echt', aktiv: true, storniert_am: null },
      { id: ANLAGE_ID.D, kuerzel: 'D', datenart: 'demo', aktiv: true, storniert_am: null },
    ],
    platz,
    gefaess,
    v_fuellzustand: fuell,
    v_gefaess_status: [],
    messung,
    messgeraet: vorgabe.ohneMessgeraet ? [] : [{ id: MESSGERAET_ID, u_ec: '0.100', u_ph: '0.10' }],
    kalibrierung,
    ereignis: [],
    einstellung: [
      {
        id: '00000000-0000-4000-8000-00000000f001',
        push_zeit: '07:00:00',
        zeitzone: ZONE,
        feste_kalibriertermine: [],
      },
    ],
  };
}

/**
 * Stichtag 20.1.2027 (Mittwoch, Winterzeit): Kalibrierung vor 30 Tagen (fällig), R-2.3 und R-3.1 fällig,
 * R-4.1 nicht fällig, R-5.1 leer, R-W Messstelle; dazu Demo-Anlage D mit fälligem D-2.3.
 */
export const STICHTAG = new Date('2027-01-20T06:00:00.000Z');
export const TEILE_DREI_ROUTINE = teileFuer({
  echtKalibriert: '2026-12-21T10:00:00.000Z',
  orte: [
    { anlage: 'R', kennung: '3.1', letzteMessung: '2027-01-18T08:00:00.000Z' },
    { anlage: 'R', kennung: '2.3', letzteMessung: '2027-01-17T08:00:00.000Z' },
    { anlage: 'R', kennung: '4.1', letzteMessung: '2027-01-19T08:00:00.000Z' },
    { anlage: 'R', kennung: '5.1', leer: true, letzteMessung: '2027-01-01T08:00:00.000Z' },
    { anlage: 'R', kennung: 'W', messstelle: true },
    { anlage: 'D', kennung: '2.3', letzteMessung: '2027-01-10T08:00:00.000Z' },
  ],
});
