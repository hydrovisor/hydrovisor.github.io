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

export type StornoGrund = 'rueckgaengig' | 'korrektur' | 'fehleingabe';

export type Schritt =
  | { art: 'neu'; tabelle: Erfassungstabelle; felder: Record<string, unknown> & { client_id: string } }
  | { art: 'storno'; tabelle: Erfassungstabelle; clientId: string; grund: StornoGrund };

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
  if (MIT_ZEITACHSE.has(schritt.tabelle)) {
    const jetzt = kontext.jetzt.toISOString();
    zeile['client_zeit'] = jetzt;
    // eine Nacherfassung bringt ihr gilt_ab mit (8.1 Regel 3)
    if (zeile['gilt_ab'] === undefined || zeile['gilt_ab'] === null) zeile['gilt_ab'] = jetzt;
  } else {
    delete zeile['client_zeit'];
    delete zeile['gilt_ab'];
  }
  return zeile;
}

const leer = (wert: unknown) => typeof wert !== 'string' || wert.trim() === '';

/** Verstösse vor dem Senden: fehlende client_id, Ereignisdaten (Plan 9 F5) */
export function vorgangPruefen(vorgang: Vorgang): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  vorgang.forEach((schritt, i) => {
    const wo = `Schritt ${i + 1} (${schritt.tabelle})`;
    if (schritt.art === 'storno') {
      if (leer(schritt.clientId)) verstoesse.push({ feld: 'client_id', grund: `${wo}: client_id fehlt` });
      return;
    }
    if (leer(schritt.felder.client_id))
      verstoesse.push({ feld: 'client_id', grund: `${wo}: client_id fehlt` });
    if (schritt.tabelle === 'ereignis') {
      const daten = schritt.felder['daten'];
      const typ = schritt.felder['typ'] as EreignisTyp;
      const objekt = daten && typeof daten === 'object' && !Array.isArray(daten) ? daten : {};
      for (const v of ereignisDatenPruefen(typ, objekt as Record<string, unknown>))
        verstoesse.push({ ...v, grund: `${wo}: ${v.grund}` });
    }
  });
  return verstoesse;
}
