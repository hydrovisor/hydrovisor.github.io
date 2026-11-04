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

export function wiederholungErlaubt(jetzt: Date, zeitzone: Zeitzone, pushZeit: string): boolean {
  const jetztMin = minuten(uhrzeit(jetzt, zeitzone));
  const ab = minuten(pushZeit);
  return jetztMin >= ab && jetztMin <= ab + WIEDERHOLUNG_MIN;
}
