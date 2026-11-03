// Messung als Vorgang für schreiben() (Plan 12 Datenfluss «Speichern»; UC9-AK2, R4.10, R5.2, U2; Plan 11 Ü1).
// Die Bindung hält client_id und gilt_ab des ersten Speicherns für denselben Eingabe-Schnappschuss.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Betriebsart } from '../ort.ts';
import { messwerte, type Messeingabe } from './eingabe.ts';

export interface Erfassungsbindung {
  /** Eingabe-Schnappschuss, an den client_id und gilt_ab gebunden sind */
  schluessel: string;
  clientId: string;
  giltAb: string;
}

/** gleiche Eingabe → gleiche ID und gleiches gilt_ab (Wiederholung, TO2); geänderte Eingabe → neue Bindung */
export function erfassungBinden(
  vorher: Erfassungsbindung | undefined,
  schluessel: string,
  neueId: () => string,
  jetzt: Date,
): Erfassungsbindung {
  if (vorher && vorher.schluessel === schluessel) return vorher;
  return { schluessel, clientId: neueId(), giltAb: jetzt.toISOString() };
}

const MIT_FUELLSTAND = new Set(['kratky', 'kratky_belueftet']);

export function messungVorgang(
  eingabe: Messeingabe,
  kontext: {
    platzId: string;
    messgeraetId: string;
    messart: 'aufgabe' | 'w';
    betriebsart?: Betriebsart;
    fuellstand?: 'ueber_drittel' | 'unter_drittel';
    uEc: number;
    uPh: number;
    warFaelligAm?: string;
    erfassungsdauerS?: number;
  },
  bindung: Erfassungsbindung,
): Schritt {
  // Kratky: Füllstand über oder unter einem Drittel ist Pflicht (R4.10, UC9 Ablauf 5)
  if (kontext.betriebsart && MIT_FUELLSTAND.has(kontext.betriebsart) && !kontext.fuellstand)
    throw new Error('Füllstand fehlt bei Kratky');
  const felder: Record<string, unknown> & { client_id: string } = {
    client_id: bindung.clientId,
    gilt_ab: bindung.giltAb,
    platz_id: kontext.platzId,
    messgeraet_id: kontext.messgeraetId,
    messart: kontext.messart,
    ...messwerte(eingabe),
    fuellstand: kontext.fuellstand ?? null,
    war_faellig_am: kontext.warFaelligAm ?? null,
  };
  // Schnappschuss ohne Zielbereich: die Bewertung kommt mit I1b (A5)
  if (kontext.betriebsart)
    felder['schnappschuss'] = { betriebsart: kontext.betriebsart, u_ec: kontext.uEc, u_ph: kontext.uPh };
  if (kontext.erfassungsdauerS !== undefined) felder['erfassungsdauer_s'] = kontext.erfassungsdauerS;
  return { art: 'neu', tabelle: 'messung', felder };
}
