// Zeitpunkt der Sammel-Push (R5.5, G2, 11.3, TP4; Plan 13): fällig ⇔ Uhrzeit in der Zeitzone ≥ Push-Zeit am
// Kalendertag dieser Zeitzone; Wiederholung nach einem Fehler bis Push-Zeit + 4 h (TTL 14400 s, A6).
import { kalendertag, uhrzeit, type Zeitzone } from '../zeit.ts';

const WIEDERHOLUNG_MIN = 4 * 60;

/** Minuten seit Mitternacht aus 'HH:MM' oder 'HH:MM:SS' */
function minuten(zeit: string): number {
  const [h = 0, m = 0] = zeit.split(':').map(Number);
  return h * 60 + m;
}

export function sammelFaellig(
  jetzt: Date,
  zeitzone: Zeitzone,
  pushZeit: string,
): { faellig: boolean; datumLokal: string } {
  return {
    faellig: minuten(uhrzeit(jetzt, zeitzone)) >= minuten(pushZeit),
    datumLokal: kalendertag(jetzt, zeitzone),
  };
}

/** «Kurzprüfung offen» um 20:00 Zürich (R5.5), bis 21:59 (A4) */
export const KURZPRUEFUNG_ZEIT = '20:00';
const KURZPRUEFUNG_BIS = '21:59';

export function kurzpruefungFaellig(
  jetzt: Date,
  zeitzone: Zeitzone,
): { faellig: boolean; datumLokal: string } {
  const m = minuten(uhrzeit(jetzt, zeitzone));
  return {
    faellig: m >= minuten(KURZPRUEFUNG_ZEIT) && m <= minuten(KURZPRUEFUNG_BIS),
    datumLokal: kalendertag(jetzt, zeitzone),
  };
}

/** Timer-Push nur für timer_ende in den letzten 15 min (A5); ältere Timer gelten als verpasst */
export const TIMER_FENSTER_MS = 15 * 60 * 1000;

export function timerFaellig(timerEnde: Date, jetzt: Date): boolean {
  const seit = jetzt.getTime() - timerEnde.getTime();
  return seit >= 0 && seit < TIMER_FENSTER_MS;
}

export function wiederholungErlaubt(jetzt: Date, zeitzone: Zeitzone, pushZeit: string): boolean {
  const jetztMin = minuten(uhrzeit(jetzt, zeitzone));
  const ab = minuten(pushZeit);
  return jetztMin >= ab && jetztMin <= ab + WIEDERHOLUNG_MIN;
}
