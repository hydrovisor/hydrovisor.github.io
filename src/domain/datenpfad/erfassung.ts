// Vorgang und Zeile für den Schreibweg (Plan 11 Schnittstellen und Datenfluss; Konzept 8.1 Regel 3, 11.4).
// Rein: keine Browser-API, jetzt und Zeitzone als Parameter (G1).
import type { Zeitzone } from '../zeit.ts';
import { ereignisDatenPruefen, type EreignisTyp, type Verstoss } from './ereignisdaten.ts';

export type { Verstoss } from './ereignisdaten.ts';

/** Tabellen mit client_id, die die App schreibt (02_datenmodell.sql; Abgleich mit den Typen in src/daten/schreiben.ts) */
export type Erfassungstabelle =
  | 'messung'
  | 'kalibrierung'
  | 'naehrloesungsansatz'
  | 'ansatz_position'
  | 'ansatz_schritt'
  | 'ereignis'
  | 'satz'
  | 'pflanzung'
  | 'pflanzvorgang'
  | 'reservierung'
  | 'aufschub'
  | 'saatgut'
  | 'eigene_aufgabe'
  | 'ki_feldprotokoll'
  | 'tuetenfoto'
  | 'etikett_aufruf'
  | 'anlage'
  | 'bereich'
  | 'platz'
  | 'etikett'
  | 'gefaessmodell'
  | 'deckeltyp'
  | 'gefaess'
  | 'anzuchtort'
  | 'netztopf'
  | 'k_faktor';

/** Tabellen mit gilt_ab und client_zeit (8.1 Regel 3) */
export const MIT_ZEITACHSE: ReadonlySet<Erfassungstabelle> = new Set<Erfassungstabelle>([
  'messung',
  'kalibrierung',
  'naehrloesungsansatz',
  'ereignis',
  'satz',
  'pflanzung',
  'reservierung',
  'aufschub',
]);

/** Tabellen mit gilt_ab: die mit Zeitachse und k_faktor (ohne client_zeit; Runde 1, Befund 3) */
export const MIT_GILT_AB: ReadonlySet<Erfassungstabelle> = new Set<Erfassungstabelle>([
  ...MIT_ZEITACHSE,
  'k_faktor',
]);

/** Tabellen ohne storniert_am: ein Storno ist dort nicht möglich */
const OHNE_STORNO: ReadonlySet<Erfassungstabelle> = new Set<Erfassungstabelle>(['etikett_aufruf']);

export type StornoGrund = 'rueckgaengig' | 'korrektur' | 'fehleingabe';

/**
 * Spalten, die ein Schritt «setzen» ändern darf, je nur solange sie leer sind (Plan 22 A2): ein Stand, der kein
 * Ereignis ist und einmal gesetzt stehen bleibt. Sonst gilt Storno plus neue Zeile.
 */
export const SETZBAR: Readonly<Partial<Record<Erfassungstabelle, readonly string[]>>> = {
  etikett: ['gedruckt_am'],
  // Plan 29 A24: entstehen erst nach dem Kopf, nie ein Zustandsfeld (8.1 Regel 2)
  naehrloesungsansatz: ['ec_erwartet_final', 'k_vorschlag'],
};

export type Schritt =
  | { art: 'neu'; tabelle: Erfassungstabelle; felder: Record<string, unknown> & { client_id: string } }
  | { art: 'storno'; tabelle: Erfassungstabelle; clientId: string; grund: StornoGrund }
  | { art: 'setzen'; tabelle: 'etikett'; clientId: string; felder: { gedruckt_am: string } }
  | {
      art: 'setzen';
      tabelle: 'naehrloesungsansatz';
      clientId: string;
      felder: { ec_erwartet_final?: number; k_vorschlag?: number };
    };

export type Vorgang = readonly Schritt[];

export interface Zeitkontext {
  jetzt: Date;
  zeitzone: Zeitzone;
}

/** setzt nur die Datenbank, nie der Client */
const SERVERFELDER = ['erfasst_am', 'nacherfasst', 'storniert_am'] as const;

export function zeileVorbereiten(
  schritt: Extract<Schritt, { art: 'neu' }>,
  kontext: Zeitkontext,
  appVersion: string,
): Record<string, unknown> {
  const zeile: Record<string, unknown> = Object.fromEntries(
    Object.entries(schritt.felder).filter(([feld]) => !(SERVERFELDER as readonly string[]).includes(feld)),
  );
  zeile['app_version'] = appVersion;
  const jetzt = kontext.jetzt.toISOString();
  if (MIT_ZEITACHSE.has(schritt.tabelle)) zeile['client_zeit'] = jetzt;
  else delete zeile['client_zeit'];
  if (MIT_GILT_AB.has(schritt.tabelle)) {
    // eine Nacherfassung bringt ihr gilt_ab mit (8.1 Regel 3)
    if (zeile['gilt_ab'] === undefined || zeile['gilt_ab'] === null) zeile['gilt_ab'] = jetzt;
  } else delete zeile['gilt_ab'];
  return zeile;
}

const leer = (wert: unknown) => typeof wert !== 'string' || wert.trim() === '';

/** Verstösse vor dem Senden: fehlende client_id, Ereignisdaten (Plan 9 F5), setzen nur nach SETZBAR (Plan 22 A2) */
export function vorgangPruefen(vorgang: Vorgang): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  vorgang.forEach((schritt, i) => {
    const wo = `Schritt ${i + 1} (${schritt.tabelle})`;
    if (schritt.art === 'storno') {
      if (leer(schritt.clientId)) verstoesse.push({ feld: 'client_id', grund: `${wo}: client_id fehlt` });
      if (OHNE_STORNO.has(schritt.tabelle))
        verstoesse.push({ feld: 'storniert_am', grund: `${wo}: kann nicht storniert werden` });
      return;
    }
    if (schritt.art === 'setzen') {
      if (leer(schritt.clientId)) verstoesse.push({ feld: 'client_id', grund: `${wo}: client_id fehlt` });
      const erlaubt = SETZBAR[schritt.tabelle as Erfassungstabelle] ?? [];
      const felder = Object.keys((schritt.felder ?? {}) as Record<string, unknown>);
      if (erlaubt.length === 0)
        verstoesse.push({ feld: 'tabelle', grund: `${wo}: setzen ist hier nicht erlaubt` });
      else if (felder.length === 0) verstoesse.push({ feld: 'felder', grund: `${wo}: kein Feld zum Setzen` });
      for (const feld of felder)
        if (!erlaubt.includes(feld))
          verstoesse.push({ feld, grund: `${wo}: ${feld} kann nicht gesetzt werden` });
      return;
    }
    if (leer(schritt.felder.client_id))
      verstoesse.push({ feld: 'client_id', grund: `${wo}: client_id fehlt` });
    if (schritt.tabelle === 'ereignis') {
      const daten = schritt.felder['daten'];
      const typ = schritt.felder['typ'] as EreignisTyp;
      if (!daten || typeof daten !== 'object' || Array.isArray(daten))
        verstoesse.push({ feld: 'daten', grund: `${wo}: daten muss ein Objekt sein` });
      else
        for (const v of ereignisDatenPruefen(typ, daten as Record<string, unknown>))
          verstoesse.push({ ...v, grund: `${wo}: ${v.grund}` });
    }
  });
  return verstoesse;
}
