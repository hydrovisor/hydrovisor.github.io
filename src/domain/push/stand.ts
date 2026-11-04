// Push-Stand für Heute (UC0-AK5, R5.5, 11.3, G5; Plan 13): «Letzte Erinnerung: heute 07:00 zugestellt» oder
// «Push nicht eingerichtet». Eingerichtet ist ein Gerät nur mit aktivem echtem Abo zu seinem eigenen Endpoint.
import type { Datenart } from '../kalibrierung/stand.ts';
import { kalendertag, tagKurz, tagPlus, uhrzeit, type Zeitzone } from '../zeit.ts';

export type PushStand =
  | { art: 'nicht_unterstuetzt' }
  | { art: 'nicht_eingerichtet'; grund: 'kein_abo' | 'abgemeldet' | 'verweigert' }
  | { art: 'eingerichtet'; letzteZustellung?: string; warnung48h: boolean };

const WARNUNG_MS = 48 * 3600 * 1000;

/** «heute 07:00», «gestern 07:05», sonst «2.12. 07:00» in der Zeitzone */
function zustellung(iso: string, jetzt: Date, zeitzone: Zeitzone): string {
  const zeitpunkt = new Date(iso);
  const tag = kalendertag(zeitpunkt, zeitzone);
  const heute = kalendertag(jetzt, zeitzone);
  const vorne = tag === heute ? 'heute' : tag === tagPlus(heute, -1) ? 'gestern' : tagKurz(tag);
  return `${vorne} ${uhrzeit(zeitpunkt, zeitzone)}`;
}

export function pushStand(
  geraet: { unterstuetzt: boolean; berechtigung: 'granted' | 'denied' | 'default'; endpoint: string | null },
  abos: readonly { endpoint: string; aktiv: boolean; datenart: Datenart; id?: string; erfasst_am?: string }[],
  versande: readonly {
    abo_id: string | null;
    art: string;
    angezeigt_am: string | null;
    gesendet_am: string | null;
  }[],
  jetzt: Date,
  zeitzone: Zeitzone,
): PushStand {
  if (!geraet.unterstuetzt) return { art: 'nicht_unterstuetzt' };
  if (geraet.berechtigung === 'denied') return { art: 'nicht_eingerichtet', grund: 'verweigert' };
  const eigene = geraet.endpoint
    ? abos.filter((a) => a.endpoint === geraet.endpoint && a.datenart === 'echt')
    : [];
  if (geraet.berechtigung !== 'granted' || eigene.length === 0)
    return { art: 'nicht_eingerichtet', grund: 'kein_abo' };
  if (!eigene.some((a) => a.aktiv)) return { art: 'nicht_eingerichtet', grund: 'abgemeldet' };

  // nur Versände der eigenen echten Abos, wenn die Abos eine id tragen (Prüfer Fachlogik 3)
  const ids = new Set(eigene.map((a) => a.id).filter((id): id is string => id !== undefined));
  const letzte = versande
    .filter((v) => ids.size === 0 || (v.abo_id !== null && ids.has(v.abo_id)))
    .map((v) => v.angezeigt_am)
    .filter((a): a is string => a !== null)
    .reduce<string | undefined>((l, a) => (!l || Date.parse(a) > Date.parse(l) ? a : l), undefined);
  if (!letzte) {
    // ohne Zustellung zählt die Warnung ab dem Anlegen des eigenen aktiven Abos (Plan 13 «Anzeige», Prüfer Fachlogik 1)
    const angelegt = eigene
      .filter((a) => a.aktiv && a.erfasst_am)
      .map((a) => Date.parse(a.erfasst_am as string))
      .reduce<number | undefined>((l, t) => (l === undefined || t < l ? t : l), undefined);
    return {
      art: 'eingerichtet',
      warnung48h: angelegt !== undefined && jetzt.getTime() - angelegt >= WARNUNG_MS,
    };
  }
  return {
    art: 'eingerichtet',
    letzteZustellung: zustellung(letzte, jetzt, zeitzone),
    warnung48h: jetzt.getTime() - Date.parse(letzte) >= WARNUNG_MS,
  };
}
