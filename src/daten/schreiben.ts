// Der eine Schreibweg der App (Konzept 11.4, 04_architektur.md 4.1, Plan 11): jeder Schritt als Upsert ohne
// Überschreiben auf client_id (on conflict do nothing); eine Wiederholung ergibt nie eine zweite Zeile (TO2).
// Die client_id hält die Maske, gebunden an den Eingabe-Schnappschuss (Plan 11 Ü1).
import {
  MIT_ZEITACHSE,
  vorgangPruefen,
  zeileVorbereiten,
  type Erfassungstabelle,
  type Schritt,
  type StornoGrund,
  type Vorgang,
  type Zeitkontext,
} from '../domain/datenpfad/erfassung.ts';
import { fehlerEinordnen, type RohFehler, type Schreibfehler } from '../domain/datenpfad/fehler.ts';
import { APP_VERSION } from '../konstanten.ts';
import type { Database } from './datenbank.types.ts';
import { supabase } from './supabase.ts';

export type Schreibergebnis =
  | { status: 'gespeichert'; clientIds: string[] }
  | { status: 'abweichend'; clientId: string; vorhanden: Record<string, unknown> }
  | { status: 'nicht_gespeichert'; fehler: Schreibfehler; bestaetigt: number };

/** Antwort in der Form von supabase-js */
export interface Antwort {
  data: unknown;
  error: RohFehler | null;
  /** HTTP-Status; supabase-js legt ihn auf die Antwort, nicht auf `error` (Runde 1, Befund 2) */
  status?: number;
}

export interface Schreibadapter {
  einfuegen(
    tabelle: Erfassungstabelle,
    zeile: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<Antwort>;
  lesen(tabelle: Erfassungstabelle, clientId: string, signal: AbortSignal): Promise<Antwort>;
  stornieren(
    tabelle: Erfassungstabelle,
    clientId: string,
    felder: { storniert_am: string; storno_grund?: StornoGrund },
    signal: AbortSignal,
  ): Promise<Antwort>;
}

/** Zeitlimit je Anfrage; danach gilt der Ausgang als unklar (A3, Gerätetest T5 kann es ändern) */
export const ZEITLIMIT_MS = 15_000;

// Erfassungstabelle muss genau den Tabellen mit Spalte client_id entsprechen (Plan 11 Schnittstellen)
type Tabellen = Database['public']['Tables'];
type MitClientId = {
  [T in keyof Tabellen]: 'client_id' extends keyof Tabellen[T]['Row'] ? T : never;
}[keyof Tabellen];
type Gleich<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const abgleich: Gleich<Erfassungstabelle, Exclude<MitClientId, 'push_abo'>> = true;
void abgleich;

export function neueClientId(): string {
  return crypto.randomUUID();
}

/** nicht verglichen: setzt der Client je Sendung neu oder setzt der Server (A5) */
const NICHT_VERGLICHEN = new Set(['app_version', 'client_zeit', 'erfasst_am', 'nacherfasst', 'storniert_am']);

function gleicherWert(gesendet: unknown, vorhanden: unknown): boolean {
  if (gesendet === vorhanden) return true;
  if (gesendet === null || vorhanden === null || gesendet === undefined || vorhanden === undefined)
    return (gesendet ?? null) === (vorhanden ?? null);
  if (typeof gesendet === 'number' || typeof vorhanden === 'number')
    return Number(gesendet) === Number(vorhanden);
  if (typeof gesendet === 'string' && typeof vorhanden === 'string') {
    const a = Date.parse(gesendet);
    const b = Date.parse(vorhanden);
    // Zeitpunkte: gleich, wenn derselbe Zeitpunkt (Server schreibt +00:00 statt Z)
    return /^\d{4}-\d{2}-\d{2}T/.test(gesendet) && !Number.isNaN(a) && a === b;
  }
  if (Array.isArray(gesendet) || Array.isArray(vorhanden))
    return (
      Array.isArray(gesendet) &&
      Array.isArray(vorhanden) &&
      gesendet.length === vorhanden.length &&
      gesendet.every((w, i) => gleicherWert(w, vorhanden[i]))
    );
  if (typeof gesendet === 'object' && typeof vorhanden === 'object') {
    // jsonb ordnet Schlüssel um: tief und ohne Reihenfolge vergleichen (Runde 1, Befund 1)
    const a = gesendet as Record<string, unknown>;
    const b = vorhanden as Record<string, unknown>;
    const schluessel = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...schluessel].every((k) => gleicherWert(a[k], b[k]));
  }
  return false;
}

function gleicherInhalt(gesendet: Record<string, unknown>, vorhanden: Record<string, unknown>): boolean {
  return Object.entries(gesendet).every(
    ([feld, wert]) => NICHT_VERGLICHEN.has(feld) || gleicherWert(wert, vorhanden[feld]),
  );
}

function alsRoh(fehler: unknown): RohFehler {
  if (fehler && typeof fehler === 'object') return fehler as RohFehler;
  return { message: String(fehler) };
}

/** Status der Antwort in den Rohfehler, falls der Fehler selbst keinen trägt */
export function mitStatus(roh: RohFehler, status: number | undefined): RohFehler {
  return roh.status === undefined && status !== undefined ? { ...roh, status } : roh;
}

export const TEXT_NICHT_GEFUNDEN =
  'Nicht gespeichert: Eintrag nicht gefunden oder kein Zugang für dieses Konto';

class Abbruch {
  readonly fehler: Schreibfehler;
  constructor(fehler: Schreibfehler) {
    this.fehler = fehler;
  }
}

/** eine Anfrage mit Zeitlimit; ein Fehler als Ausnahme oder als `error` endet als Abbruch */
async function mitZeitlimit(anfrage: (signal: AbortSignal) => Promise<Antwort>): Promise<unknown> {
  const steuerung = new AbortController();
  const uhr = setTimeout(() => steuerung.abort(), ZEITLIMIT_MS);
  try {
    const { data, error, status } = await anfrage(steuerung.signal);
    if (error) throw new Abbruch(fehlerEinordnen(mitStatus(alsRoh(error), status)));
    return data;
  } catch (fehler) {
    if (fehler instanceof Abbruch) throw fehler;
    throw new Abbruch(fehlerEinordnen(alsRoh(fehler)));
  } finally {
    clearTimeout(uhr);
  }
}

const zeilenAus = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? (data as Record<string, unknown>[]) : data ? [data as Record<string, unknown>] : [];

export function erstelleSchreiben(
  adapter: Schreibadapter,
  bindung: { appVersion: string; nachErfolg: () => void },
): (vorgang: Vorgang | Schritt, kontext: Zeitkontext) => Promise<Schreibergebnis> {
  return async (eingabe, kontext) => {
    const vorgang: Vorgang = Array.isArray(eingabe) ? eingabe : [eingabe as Schritt];
    const verstoesse = vorgangPruefen(vorgang);
    if (verstoesse.length > 0) {
      const text = `Nicht gespeichert: ${verstoesse.map((v) => v.grund).join('; ')}`;
      return {
        status: 'nicht_gespeichert',
        bestaetigt: 0,
        fehler: { art: 'abgelehnt', wiederholbar: false, text },
      };
    }
    const clientIds: string[] = [];
    for (const schritt of vorgang) {
      try {
        if (schritt.art === 'storno') {
          // nur ändern, wenn noch nicht storniert: eine Wiederholung bleibt ohne Wirkung;
          // storno_grund gibt es nur in den Tabellen mit Zeitachse (Runde 1, Befund 4)
          const felder = MIT_ZEITACHSE.has(schritt.tabelle)
            ? { storniert_am: kontext.jetzt.toISOString(), storno_grund: schritt.grund }
            : { storniert_am: kontext.jetzt.toISOString() };
          const geaendert = zeilenAus(
            await mitZeitlimit((s) => adapter.stornieren(schritt.tabelle, schritt.clientId, felder, s)),
          );
          if (geaendert.length === 0) {
            // RLS filtert UPDATE still: 0 Zeilen heisst schon storniert, nicht vorhanden oder kein Zugang
            const [vorhanden] = zeilenAus(
              await mitZeitlimit((s) => adapter.lesen(schritt.tabelle, schritt.clientId, s)),
            );
            if (!vorhanden || vorhanden['storniert_am'] === null || vorhanden['storniert_am'] === undefined)
              throw new Abbruch({ art: 'abgelehnt', wiederholbar: false, text: TEXT_NICHT_GEFUNDEN });
          }
          clientIds.push(schritt.clientId);
          continue;
        }
        const zeile = zeileVorbereiten(schritt, kontext, bindung.appVersion);
        const zurueck = zeilenAus(await mitZeitlimit((s) => adapter.einfuegen(schritt.tabelle, zeile, s)));
        if (zurueck.length === 0) {
          // Duplikat: die erste Zeile gewinnt; gleicher Inhalt gilt als bestätigt (A5)
          const id = schritt.felder.client_id;
          const [vorhanden] = zeilenAus(await mitZeitlimit((s) => adapter.lesen(schritt.tabelle, id, s)));
          if (!vorhanden) throw new Abbruch(fehlerEinordnen({ code: 'PGRST116', status: 406 }));
          // verglichen wird, was die Maske gesendet hat; app_version, client_zeit und ein selbst gesetztes gilt_ab
          // entstehen je Sendung neu (A5)
          if (!gleicherInhalt(schritt.felder, vorhanden))
            return { status: 'abweichend', clientId: id, vorhanden };
        }
        clientIds.push(schritt.felder.client_id);
      } catch (fehler) {
        if (!(fehler instanceof Abbruch)) throw fehler;
        return { status: 'nicht_gespeichert', fehler: fehler.fehler, bestaetigt: clientIds.length };
      }
    }
    bindung.nachErfolg();
    return { status: 'gespeichert', clientIds };
  };
}

// Supabase-Adapter: ungebundene Sicht auf den Client, weil die Tabelle erst zur Laufzeit feststeht
interface Abfrage extends PromiseLike<Antwort> {
  upsert(zeile: object, optionen: object): Abfrage;
  select(spalten?: string): Abfrage;
  update(felder: object): Abfrage;
  eq(spalte: string, wert: unknown): Abfrage;
  is(spalte: string, wert: null): Abfrage;
  abortSignal(signal: AbortSignal): Abfrage;
}
const tabelle = (name: Erfassungstabelle) => (supabase as unknown as { from(t: string): Abfrage }).from(name);

export const supabaseAdapter: Schreibadapter = {
  einfuegen: async (t, zeile, signal) =>
    tabelle(t)
      .upsert(zeile, { onConflict: 'client_id', ignoreDuplicates: true })
      .select()
      .abortSignal(signal),
  lesen: async (t, clientId, signal) => tabelle(t).select('*').eq('client_id', clientId).abortSignal(signal),
  stornieren: async (t, clientId, felder, signal) =>
    tabelle(t)
      .update(felder)
      .eq('client_id', clientId)
      .is('storniert_am', null)
      .select('client_id')
      .abortSignal(signal),
};

// Nach jedem erfolgreichen Schreiben lädt die Oberfläche das Bündel neu (04 4.2); sie meldet sich hier an
const nachErfolgHoerer = new Set<() => void>();
export function beiErfolg(hoerer: () => void): () => void {
  nachErfolgHoerer.add(hoerer);
  return () => nachErfolgHoerer.delete(hoerer);
}

export const schreiben = erstelleSchreiben(supabaseAdapter, {
  appVersion: APP_VERSION,
  nachErfolg: () => nachErfolgHoerer.forEach((h) => h()),
});
