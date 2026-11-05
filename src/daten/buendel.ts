// Offline-Bündel laden und lesen (04_architektur.md 4.2, Konzept 11.1, Plan 11): erst ist_tim(), dann alle Teile
// seitenweise; nur wenn alles vollständig ist, ersetzt ein einziges put den Eintrag «aktuell» (sonst bleibt der alte).
import { buendelPruefen, fensterBeginn, letzterJeOrt, type Buendel } from '../domain/datenpfad/buendel.ts';
import type { Zeitkontext } from '../domain/datenpfad/erfassung.ts';
import { fehlerEinordnen, type RohFehler, type Schreibfehler } from '../domain/datenpfad/fehler.ts';
import { gespeicherteNutzerId, SITZUNG_SCHLUESSEL } from '../anmeldung/sitzung.ts';
import { APP_VERSION } from '../konstanten.ts';
import { lokalOeffnen, SPEICHER_BUENDEL } from './lokal.ts';
import { mitStatus, ZEITLIMIT_MS, type Antwort } from './schreiben.ts';
import { supabase } from './supabase.ts';

export interface Buendelteil {
  /** Tabelle oder Sicht, zugleich Schlüssel in `teile` */
  name: string;
  /** abweichende Tabelle, wenn zwei Teile dieselbe Tabelle lesen (Plan 21 A13) */
  tabelle?: string;
  spalten: string;
  /** stabile Sortierung für die Seiten */
  ordnung: readonly string[];
  /** Betriebszeilen ohne Storno */
  ohneStorno?: boolean;
  /** Wissen: nur die gültige Fassung */
  gueltig?: boolean;
  /** nur Zeilen mit gilt_ab ab fensterBeginn(jetzt, tage) */
  fensterTage?: number;
  /** nur diese Werte der Spalte typ (Ereignisse) */
  typen?: readonly string[];
}

const tabelle = (
  name: string,
  extra: Omit<Buendelteil, 'name' | 'spalten' | 'ordnung'> = {},
): Buendelteil => ({
  name,
  spalten: '*',
  ordnung: ['id'],
  ...extra,
});
const sicht = (name: string, ordnung: readonly string[]): Buendelteil => ({ name, spalten: '*', ordnung });

/** Teile nach 04 4.2; spätere Pakete ergänzen hier, ohne Aufrufer zu ändern */
export const BUENDEL_TEILE: readonly Buendelteil[] = [
  // Anlage
  ...[
    'anlage',
    'bereich',
    'platz',
    'etikett',
    'gefaess',
    'gefaessmodell',
    'deckeltyp',
    'anzuchtort',
    'netztopf',
  ].map((n) => tabelle(n, { ohneStorno: true })),
  sicht('v_gefaess_status', ['gefaess_id']),
  sicht('v_fuellzustand', ['platz_id']),
  // Leitungswasser-EC je Anlage für Punkt 4 der Einrichtung, unabhängig vom 14-Tage-Fenster (Plan 18)
  sicht('v_ec_wasser', ['anlage_id']),
  sicht('v_zielbereich', ['platz_id']),
  // Wissen (gültige Fassung)
  ...['sorte', 'art', 'art_kulturform', 'saatempfehlung', 'duengerschema', 'wissenseintrag'].map((n) =>
    tabelle(n, { gueltig: true }),
  ),
  tabelle('kulturgruppe'),
  tabelle('produkt'),
  sicht('v_sollwert', ['sorte_id', 'phase', 'groesse']),
  // Betrieb
  tabelle('satz', { ohneStorno: true }),
  tabelle('pflanzung', { ohneStorno: true }),
  sicht('v_pflanzung_zustand', ['pflanzung_id']),
  tabelle('v_reservierung_aktiv', { ohneStorno: true }),
  // Keimung prüfen (Plan 24): frühere Reservierungen (auch beendete) für Schwammfolge und Wiederherstellen
  tabelle('reservierung', { ohneStorno: true }),
  // Ereignisse an den Pflanzungen für Keimprüfung, «keimt nicht» und Wiederherstellen
  {
    name: 'ereignis_pflanzung',
    tabelle: 'ereignis',
    spalten: '*',
    ordnung: ['id'],
    ohneStorno: true,
    typen: ['keimung', 'abschluss', 'wiederherstellen'],
  },
  // Säen (Plan 23): Packungen, Keimrate je Packung (nur echt, G5), aktueller Platz je Topf
  tabelle('saatgut', { ohneStorno: true }),
  sicht('v_keimrate', ['saatgut_id']),
  sicht('v_netztopf_platz', ['netztopf_id']),
  tabelle('messung', { ohneStorno: true, fensterTage: 14 }),
  sicht('v_messung_unsicher', ['messung_id']),
  tabelle('naehrloesungsansatz', { ohneStorno: true }),
  // Dosis je Komponente in der Maske «Gefäss»; nach dem Laden auf die letzten Ansätze gekürzt (Plan 20)
  tabelle('ansatz_position', { ohneStorno: true }),
  tabelle('kalibrierung', { ohneStorno: true }),
  sicht('v_kalibrierung_faellig', ['messgeraet_id', 'datenart']),
  tabelle('messgeraet'),
  tabelle('aufschub', { ohneStorno: true }),
  // Geräte-Ereignisse für Kalibrierstand und «unsicher» ohne Netz (R10.3, R5.2; Plan 12)
  tabelle('ereignis', { ohneStorno: true, typen: ['sonde_gereinigt', 'als_unsicher_markiert'] }),
  // Ereignisse am Platz für Prüfstatus, Prüfprotokoll, «entfernt am» und Wiederherstellen (Plan 21 A13)
  {
    name: 'ereignis_platz',
    tabelle: 'ereignis',
    spalten: '*',
    ordnung: ['id'],
    ohneStorno: true,
    typen: ['gefaess_erfasst', 'gefaesspruefung', 'box_deckel_tausch', 'entfernt', 'geleert', 'ruhe'],
  },
  // Push (Plan 13): Abos ohne Schlüssel, Versände für «Letzte Erinnerung» und #/push
  {
    name: 'push_abo',
    spalten: 'id,geraet,endpoint,datenart,aktiv,letzter_fehler,erfasst_am',
    ordnung: ['id'],
  },
  tabelle('push_versand'),
  // ohne telefon_vertretung und email_rueckfall: keine Personendaten im Gerätespeicher, die keine Maske braucht (Ü3)
  {
    name: 'einstellung',
    spalten:
      'id,push_zeit,vorlauf_n,kannengroesse_l,messmittel_ml,messbecher,thema,pflegebudget_min_werktag,' +
      'pflegebudget_h_woche,zeitzone,min_client_version,feste_kalibriertermine,stationsgrenze_ab',
    ordnung: ['id'],
  },
];

/** max_rows in supabase/config.toml */
export const SEITE = 1000;

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
      const teile: Record<string, readonly unknown[]> = Object.fromEntries(geladen);
      // letzter Ansatz je Ort (04 4.2, A7)
      const ansaetze = teile['naehrloesungsansatz'] as
        { platz_id: string | null; begonnen_am: string; typ?: string; status?: string }[] | undefined;
      // dazu der letzte nicht abgebrochene Neuansatz oder Teilwechsel je Ort für Zielbereich und Dosis (Plan 20,
      // Runde 1, Befund 4)
      if (ansaetze)
        teile['naehrloesungsansatz'] = [
          ...new Set([
            ...letzterJeOrt(ansaetze),
            ...letzterJeOrt(
              ansaetze.filter(
                (a) => (a.typ === 'neuansatz' || a.typ === 'teilwechsel') && a.status !== 'abgebrochen',
              ),
            ),
          ]),
        ];
      // Positionen nur der letzten Ansätze je Ort (Plan 20)
      const letzte = new Set(
        (teile['naehrloesungsansatz'] as { id: string }[] | undefined)?.map((a) => a.id),
      );
      const positionen = teile['ansatz_position'] as { ansatz_id: string }[] | undefined;
      if (positionen) teile['ansatz_position'] = positionen.filter((p) => letzte.has(p.ansatz_id));
      // v_messung_unsicher hat kein gilt_ab: auf die Messungen im Fenster beschränken (Runde 1, Befund 9)
      const imFenster = new Set((teile['messung'] as { id: string }[] | undefined)?.map((m) => m.id));
      const unsicher = teile['v_messung_unsicher'] as { messung_id: string }[] | undefined;
      if (unsicher) teile['v_messung_unsicher'] = unsicher.filter((u) => imFenster.has(u.messung_id));
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
