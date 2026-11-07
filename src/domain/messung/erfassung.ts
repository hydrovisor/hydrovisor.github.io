// Messung als Vorgang für schreiben() (Plan 12 Datenfluss «Speichern»; UC9-AK2, R4.10, R5.2, U2; Plan 11 Ü1).
// Die Bindung hält client_id und gilt_ab des ersten Speicherns für denselben Eingabe-Schnappschuss.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Bewertung } from '../bewertung/bewertung.ts';
import { alsSchnappschuss, type Sollband } from '../bewertung/sollband.ts';
import type { Betriebsart } from '../ort.ts';
import { messwerte, type Groesse, type Messeingabe } from './eingabe.ts';

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
    messart: 'aufgabe' | 'w' | 'frischwasser' | 'kontrolle_ansatz' | 'end_ansatz' | 'nachmessen' | 'rundgang';
    /** Messung im Ablauf (Plan 29): gehört zum Ansatz und veraltet nicht (R10.3) */
    ansatzId?: string;
    betriebsart?: Betriebsart;
    fuellstand?: 'ueber_drittel' | 'unter_drittel';
    uEc: number;
    uPh: number;
    warFaelligAm?: string;
    /** Rundgang (Plan 30): Schlüssel der fälligen Mess-Aufgabe (Termintreue) */
    aufgabeSchluessel?: string | undefined;
    erfassungsdauerS?: number;
    /** Plan 26 (R2.5): Zielbereich und Bewertung; ohne bleibt der Vorgang wie in I0-07 */
    bewertung?: {
      sollband: Sollband;
      bewertungen: Partial<Record<Groesse, Bewertung>>;
      sprungBestaetigt?: boolean;
    };
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
  if (kontext.aufgabeSchluessel) felder['aufgabe_schluessel'] = kontext.aufgabeSchluessel;
  if (kontext.ansatzId) {
    // id = client_id wie die übrigen Zeilen im Ablauf (Plan 29 «Schreibweg»)
    felder['id'] = bindung.clientId;
    felder['ansatz_id'] = kontext.ansatzId;
  }
  const b = kontext.bewertung;
  if (b) {
    felder['bewertung_ph'] = b.bewertungen.ph ?? null;
    felder['bewertung_ec'] = b.bewertungen.ec ?? null;
    felder['bewertung_temp'] = b.bewertungen.temperatur ?? null;
  }
  // Schnappschuss mit Zielbereich nur, wenn bewertet wurde (R2.5); sonst wie in I0-07
  if (kontext.betriebsart || b)
    felder['schnappschuss'] = {
      ...(kontext.betriebsart ? { betriebsart: kontext.betriebsart } : {}),
      u_ec: kontext.uEc,
      u_ph: kontext.uPh,
      ...(b ? { zielbereich: alsSchnappschuss(b.sollband) } : {}),
      ...(b?.sprungBestaetigt ? { sprung_bestaetigt: true } : {}),
    };
  if (kontext.erfassungsdauerS !== undefined) felder['erfassungsdauer_s'] = kontext.erfassungsdauerS;
  return { art: 'neu', tabelle: 'messung', felder };
}
