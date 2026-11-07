// Offline-Bündel laden und lesen (04_architektur.md 4.2, Konzept 11.1, Plan 11): erst ist_tim(), dann alle Teile
// seitenweise; nur wenn alles vollständig ist, ersetzt ein einziges put den Eintrag «aktuell» (sonst bleibt der alte).
import { buendelPruefen, fensterBeginn, teileKuerzen, type Buendel } from '../domain/datenpfad/buendel.ts';
import { BUENDEL_TEILE, SEITE, type Buendelteil } from '../domain/datenpfad/buendel-teile.ts';
import type { Zeitkontext } from '../domain/datenpfad/erfassung.ts';
import { fehlerEinordnen, type RohFehler, type Schreibfehler } from '../domain/datenpfad/fehler.ts';
import { gespeicherteNutzerId, SITZUNG_SCHLUESSEL } from '../anmeldung/sitzung.ts';
import { APP_VERSION } from '../konstanten.ts';
import { lokalOeffnen, SPEICHER_BUENDEL } from './lokal.ts';
import { mitStatus, ZEITLIMIT_MS, type Antwort } from './schreiben.ts';
import { supabase } from './supabase.ts';

export { BUENDEL_TEILE, SEITE, type Buendelteil } from '../domain/datenpfad/buendel-teile.ts';

export interface Buendeladapter {
  istTim(signal: AbortSignal): Promise<Antwort>;
  /** Zeilen von..bis (inklusive, wie range()) */
  seite(
    teil: Buendelteil,
    bereich: { von: number; bis: number },
    kontext: Zeitkontext,
    signal: AbortSignal,
  ): Promise<Antwort>;
}

export interface Buendelspeicher {
  ersetzen(buendel: Buendel): Promise<void>;
}

export type Ladeergebnis =
  | { status: 'geladen'; buendel: Buendel }
  | { status: 'kein_zugang' }
  | { status: 'fehler'; fehler: Schreibfehler };

class Ladefehler {
  readonly fehler: Schreibfehler;
  constructor(roh: unknown) {
    this.fehler = fehlerEinordnen(
      roh && typeof roh === 'object' ? (roh as RohFehler) : { message: String(roh) },
    );
  }
}

async function abrufen(anfrage: (signal: AbortSignal) => Promise<Antwort>): Promise<unknown> {
  const steuerung = new AbortController();
  const uhr = setTimeout(() => steuerung.abort(), ZEITLIMIT_MS);
  try {
    const { data, error, status } = await anfrage(steuerung.signal);
    if (error) throw new Ladefehler(mitStatus(error, status));
    return data;
  } catch (fehler) {
    throw fehler instanceof Ladefehler ? fehler : new Ladefehler(fehler);
  } finally {
    clearTimeout(uhr);
  }
}

export function erstelleBuendelLaden(
  adapter: Buendeladapter,
  speicher: Buendelspeicher,
  bindung: { appVersion: string; nutzerId: string },
  /** gilt die Sitzung noch für bindung.nutzerId? Sonst wird nichts gespeichert (Runde 1, Befund S2) */
  nochGueltig: () => Promise<boolean> = async () => true,
): (kontext: Zeitkontext) => Promise<Ladeergebnis> {
  return async (kontext) => {
    // stand ist der Beginn des Ladens: was danach geschrieben wird, gilt als nicht enthalten
    const stand = kontext.jetzt.toISOString();
    try {
      // ohne Zugang liefert RLS 0 Zeilen; ein leeres Bündel darf den letzten Stand nicht überschreiben
      if ((await abrufen((s) => adapter.istTim(s))) !== true) return { status: 'kein_zugang' };
      const geladen = await Promise.all(
        BUENDEL_TEILE.map(async (teil) => {
          const zeilen: unknown[] = [];
          for (let von = 0; ; von += SEITE) {
            const daten = await abrufen((s) =>
              adapter.seite(teil, { von, bis: von + SEITE - 1 }, kontext, s),
            );
            const seite = Array.isArray(daten) ? daten : [];
            zeilen.push(...seite);
            if (seite.length < SEITE) break;
          }
          return [teil.name, zeilen] as const;
        }),
      );
      // Kürzung nach dem Laden, gleich in push-taeglich (Plan 31 Lösungsweg 1)
      const teile = teileKuerzen(Object.fromEntries(geladen));
      const buendel: Buendel = {
        id: 'aktuell',
        format: 1,
        stand,
        appVersion: bindung.appVersion,
        nutzerId: bindung.nutzerId,
        teile,
      };
      if (!(await nochGueltig())) return { status: 'kein_zugang' };
      await speicher.ersetzen(buendel);
      return { status: 'geladen', buendel };
    } catch (fehler) {
      if (fehler instanceof Ladefehler) return { status: 'fehler', fehler: fehler.fehler };
      return { status: 'fehler', fehler: fehlerEinordnen({ message: String(fehler) }) };
    }
  };
}

// Supabase-Adapter: ungebundene Sicht auf den Client, weil Tabelle und Sicht erst zur Laufzeit feststehen
interface Abfrage extends PromiseLike<Antwort> {
  select(spalten: string): Abfrage;
  is(spalte: string, wert: null): Abfrage;
  gte(spalte: string, wert: string): Abfrage;
  in(spalte: string, werte: readonly string[]): Abfrage;
  order(spalte: string, optionen: { ascending: boolean }): Abfrage;
  range(von: number, bis: number): Abfrage;
  abortSignal(signal: AbortSignal): Abfrage;
}
const ungebunden = supabase as unknown as {
  from(name: string): Abfrage;
  rpc(name: string): { abortSignal(signal: AbortSignal): PromiseLike<Antwort> };
};

export const supabaseBuendeladapter: Buendeladapter = {
  istTim: async (signal) => ungebunden.rpc('ist_tim').abortSignal(signal),
  seite: async (teil, { von, bis }, kontext, signal) => {
    let abfrage = ungebunden.from(teil.tabelle ?? teil.name).select(teil.spalten);
    if (teil.ohneStorno) abfrage = abfrage.is('storniert_am', null);
    if (teil.gueltig) abfrage = abfrage.is('gueltig_bis', null);
    if (teil.typen) abfrage = abfrage.in('typ', teil.typen);
    if (teil.fensterTage !== undefined)
      abfrage = abfrage.gte('gilt_ab', fensterBeginn(kontext.jetzt, teil.fensterTage, kontext.zeitzone));
    for (const spalte of teil.ordnung) abfrage = abfrage.order(spalte, { ascending: true });
    return abfrage.range(von, bis).abortSignal(signal);
  },
};

const SCHLUESSEL = 'aktuell';

function anfrageAls<T>(anfrage: IDBRequest<T>): Promise<T> {
  return new Promise((erfuellen, ablehnen) => {
    anfrage.onsuccess = () => erfuellen(anfrage.result);
    anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB-Fehler'));
  });
}

async function mitSpeicher<T>(
  modus: IDBTransactionMode,
  tun: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await lokalOeffnen();
  try {
    const transaktion = db.transaction(SPEICHER_BUENDEL, modus);
    const ergebnis = await anfrageAls(tun(transaktion.objectStore(SPEICHER_BUENDEL)));
    await new Promise<void>((erfuellen, ablehnen) => {
      transaktion.oncomplete = () => erfuellen();
      transaktion.onerror = () => ablehnen(transaktion.error ?? new Error('IndexedDB-Fehler'));
      transaktion.onabort = () => ablehnen(transaktion.error ?? new Error('IndexedDB abgebrochen'));
    });
    return ergebnis;
  } finally {
    db.close();
  }
}

export const indexedDbBuendelspeicher: Buendelspeicher = {
  ersetzen: async (buendel) => {
    await mitSpeicher('readwrite', (s) => s.put(buendel));
  },
};

/** gespeichertes Bündel des Nutzers oder undefined (anderes Format, anderer Nutzer, keins) */
export async function buendelLesen(nutzerId: string): Promise<Buendel | undefined> {
  try {
    return buendelPruefen(await mitSpeicher('readonly', (s) => s.get(SCHLUESSEL)), nutzerId);
  } catch {
    return undefined;
  }
}

export async function buendelLeeren(): Promise<void> {
  await mitSpeicher('readwrite', (s) => s.delete(SCHLUESSEL));
}

/** Nutzer-ID der im localStorage gespeicherten Sitzung, ohne Netz und ohne Erneuerung des Tokens */
export function nutzerIdGespeichert(): string | undefined {
  try {
    return gespeicherteNutzerId(window.localStorage.getItem(SITZUNG_SCHLUESSEL));
  } catch {
    return undefined;
  }
}

/** lädt das Bündel für den angemeldeten Nutzer (Sitzung aus dem localStorage, ohne Netz) */
export async function buendelLaden(kontext: Zeitkontext): Promise<Ladeergebnis> {
  const nutzerId = nutzerIdGespeichert();
  if (!nutzerId) return { status: 'kein_zugang' };
  // ohne Netz und mit abgelaufenem Token liefert getSession() nichts; die gespeicherte Sitzung zählt (Runde 2, N1)
  const gleicherNutzer = async () => nutzerIdGespeichert() === nutzerId;
  return erstelleBuendelLaden(
    supabaseBuendeladapter,
    indexedDbBuendelspeicher,
    { appVersion: APP_VERSION, nutzerId },
    gleicherNutzer,
  )(kontext);
}
