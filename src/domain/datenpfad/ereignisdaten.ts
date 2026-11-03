// Erlaubte daten-Schlüssel und Werte je ereignis_typ (Plan 9 F5, Plan 11): aus dem Tabellenkommentar (A4)
// von public.ereignis in supabase/migrations/20261103140000_datenmodell.sql. Die Datenbank prüft nur datenart (Check).
export type EreignisTyp =
  | 'aussaat'
  | 'deckel_geoeffnet'
  | 'abdeckung_entfernt'
  | 'keimung'
  | 'phase_antwort'
  | 'verschieben'
  | 'umsetzdatum_geaendert'
  | 'umsetzen'
  | 'tausch'
  | 'neu_beschriften'
  | 'ernte'
  | 'kultur_entscheid'
  | 'schossen_handlung'
  | 'abschluss'
  | 'wiederherstellen'
  | 'kurzpruefung'
  | 'gefaess_erfasst'
  | 'gefaesspruefung'
  | 'box_deckel_tausch'
  | 'ruhe'
  | 'entfernt'
  | 'geleert'
  | 'gereinigt'
  | 'bestaeubung'
  | 'leitkultur_gewaehlt'
  | 'sonde_gereinigt'
  | 'als_unsicher_markiert'
  | 'stromausfall'
  | 'aufgabe_erledigt'
  | 'messung_umgehaengt'
  | 'sollwert_geaendert'
  | 'beobachtung';

export interface Verstoss {
  feld: string;
  grund: string;
}

/** Wertregel je Schlüssel; undefined = jeder Wert */
type Regel = readonly string[] | ((wert: unknown) => boolean) | undefined;

interface Schema {
  schluessel: Readonly<Record<string, Regel>>;
  pflicht?: readonly string[];
}

const DATENART = ['echt', 'demo', 'test'] as const;
const ORTSWECHSEL = {
  von_platz_id: undefined,
  von_loch_nr: undefined,
  nach_platz_id: undefined,
  nach_loch_nr: undefined,
} as const;

const SCHEMA: Readonly<Record<EreignisTyp, Schema>> = {
  aussaat: { schluessel: { saatdatum: undefined } },
  deckel_geoeffnet: { schluessel: {} },
  abdeckung_entfernt: { schluessel: {} },
  keimung: {
    schluessel: {
      samen_gesaet: undefined,
      samen_gekeimt: undefined,
      keimtemp_eingehalten: undefined,
      vorherige_pruefung_am: undefined,
    },
  },
  phase_antwort: {
    schluessel: {
      phase: undefined,
      antwort: ['ja', 'noch_nicht', 'problem'],
      erwartet_am: undefined,
      nachgefuehrt: undefined,
      ausloesende_pflanzung_id: undefined,
    },
  },
  verschieben: { schluessel: ORTSWECHSEL },
  umsetzdatum_geaendert: {
    schluessel: { von: undefined, nach: undefined, grund: ['morgen', 'in_station_lassen', 'ziel_spaeter'] },
  },
  umsetzen: { schluessel: ORTSWECHSEL },
  tausch: { schluessel: { ...ORTSWECHSEL, vorgang_id: undefined } },
  neu_beschriften: { schluessel: { von_kennung: undefined, nach_kennung: undefined } },
  ernte: { schluessel: { art: ['teil', 'ab'] } },
  kultur_entscheid: { schluessel: { entscheid: ['beenden', 'verlaengern'], tage: undefined } },
  schossen_handlung: { schluessel: {} },
  abschluss: {
    schluessel: { grund: ['geerntet', 'ausfall', 'keimt_nicht', 'ueberzaehlig'], text: undefined },
  },
  wiederherstellen: { schluessel: { ereignis_id: undefined } },
  kurzpruefung: {
    schluessel: {
      punkt: ['pumpe', 'luftzone', 'loesung_topfboden', 'wurzeln', 'licht', 'luefter', 'wuerfel_feucht'],
      ok: undefined,
      ausnahmen: undefined,
    },
  },
  gefaess_erfasst: { schluessel: {} },
  gefaesspruefung: {
    schluessel: {
      schritt: (wert) => Number.isInteger(wert) && (wert as number) >= 1 && (wert as number) <= 4,
      ok: undefined,
      volumen_gezaehlt_l: undefined,
    },
  },
  box_deckel_tausch: { schluessel: {} },
  ruhe: { schluessel: { gesetzt: undefined } },
  entfernt: { schluessel: {} },
  geleert: { schluessel: {} },
  gereinigt: { schluessel: {} },
  bestaeubung: { schluessel: {} },
  leitkultur_gewaehlt: { schluessel: { art_id: undefined } },
  sonde_gereinigt: { schluessel: { datenart: DATENART }, pflicht: ['datenart'] },
  als_unsicher_markiert: {
    schluessel: { seit_kalibrierung_id: undefined, datenart: DATENART },
    pflicht: ['datenart'],
  },
  stromausfall: { schluessel: { beginn: undefined, ende: undefined } },
  aufgabe_erledigt: { schluessel: { aufgabe_schluessel: undefined } },
  messung_umgehaengt: { schluessel: { messung_id: undefined, nach_platz_id: undefined } },
  sollwert_geaendert: { schluessel: { profilwert_zeile_id: undefined } },
  beobachtung: {
    schluessel: {
      kategorie: ['tipburn', 'mehltau', 'schossen', 'wurzeln', 'sonstiges'],
      text: (wert) => typeof wert === 'string' && wert.length <= 200,
    },
  },
};

function erfuellt(regel: Regel, wert: unknown): boolean {
  if (regel === undefined) return true;
  if (typeof regel === 'function') return regel(wert);
  return typeof wert === 'string' && regel.includes(wert);
}

export function ereignisDatenPruefen(typ: EreignisTyp, daten: Record<string, unknown>): Verstoss[] {
  const schema = SCHEMA[typ];
  if (!schema) return [{ feld: 'typ', grund: `unbekannter Ereignistyp ${String(typ)}` }];
  const verstoesse: Verstoss[] = [];
  for (const [schluessel, wert] of Object.entries(daten)) {
    if (!Object.hasOwn(schema.schluessel, schluessel))
      verstoesse.push({ feld: schluessel, grund: `${typ}: Schlüssel ${schluessel} nicht erlaubt` });
    else if (!erfuellt(schema.schluessel[schluessel], wert))
      verstoesse.push({ feld: schluessel, grund: `${typ}: Wert von ${schluessel} nicht erlaubt` });
  }
  for (const schluessel of schema.pflicht ?? [])
    if (daten[schluessel] === undefined || daten[schluessel] === null)
      verstoesse.push({ feld: schluessel, grund: `${typ}: ${schluessel} fehlt` });
  return verstoesse;
}
