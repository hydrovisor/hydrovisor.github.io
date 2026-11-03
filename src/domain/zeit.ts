// Zeit in einer gegebenen Zeitzone (01_fachregeln.md G1, G2): reine Funktionen, die Gerätezone zählt nie.
export type Zeitzone = string;
export const ZEITZONE: Zeitzone = 'Europe/Zurich';

const formate = new Map<string, Intl.DateTimeFormat>();

function teile(zeitpunkt: Date, zeitzone: Zeitzone): Record<string, string> {
  let format = formate.get(zeitzone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', {
      timeZone: zeitzone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formate.set(zeitzone, format);
  }
  return Object.fromEntries(format.formatToParts(zeitpunkt).map((t) => [t.type, t.value]));
}

/** Kalendertag 'JJJJ-MM-TT' in der Zeitzone (G2) */
export function kalendertag(zeitpunkt: Date, zeitzone: Zeitzone): string {
  const t = teile(zeitpunkt, zeitzone);
  return `${t['year']}-${t['month']}-${t['day']}`;
}

/** Uhrzeit 'hh:mm' im 24-Stunden-Format in der Zeitzone */
export function uhrzeit(zeitpunkt: Date, zeitzone: Zeitzone): string {
  const t = teile(zeitpunkt, zeitzone);
  return `${t['hour']}:${t['minute']}`;
}

/** Abweichung der Zeitzone von UTC in ms zum Zeitpunkt (positiv östlich von UTC) */
export function versatz(zeitpunkt: Date, zeitzone: Zeitzone): number {
  const t = teile(zeitpunkt, zeitzone);
  const alsUtc = Date.UTC(
    Number(t['year']),
    Number(t['month']) - 1,
    Number(t['day']),
    Number(t['hour']),
    Number(t['minute']),
  );
  const ohneSekunden = Math.floor(zeitpunkt.getTime() / 60_000) * 60_000;
  return alsUtc - ohneSekunden;
}

/** Zeitpunkt von 00:00 des Kalendertags 'JJJJ-MM-TT' in der Zeitzone */
export function tagesbeginn(tag: string, zeitzone: Zeitzone): Date {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  const mitternachtUtc = Date.UTC(j, m - 1, d);
  // zweimal angleichen, weil der Versatz am Tag einer Umstellung um Mitternacht anders sein kann als um 00:00 UTC
  let ergebnis = mitternachtUtc - versatz(new Date(mitternachtUtc), zeitzone);
  ergebnis = mitternachtUtc - versatz(new Date(ergebnis), zeitzone);
  return new Date(ergebnis);
}

/** Kalendertag 'JJJJ-MM-TT' plus n Tage, auf Datumsteilen gerechnet (sommerzeitfest, G2) */
export function tagPlus(tag: string, tage: number): string {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(j, m - 1, d + tage)).toISOString().slice(0, 10);
}

/** Anzahl Kalendertage von `von` bis `bis` (positiv, wenn `bis` später liegt) */
export function tageZwischen(von: string, bis: string): number {
  const ms = (t: string) => {
    const [j, m, d] = t.split('-').map(Number) as [number, number, number];
    return Date.UTC(j, m - 1, d);
  };
  return Math.round((ms(bis) - ms(von)) / 86_400_000);
}

/** «31.1.» aus 'JJJJ-MM-TT' */
export function tagKurz(tag: string): string {
  const [, m, d] = tag.split('-').map(Number) as [number, number, number];
  return `${d}.${m}.`;
}
