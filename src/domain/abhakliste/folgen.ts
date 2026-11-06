// Folgen des Lösungswechsels und der pH-Korrektur (Konzept R5.2, R10.3, R4.14, TZ9; Plan 29 A7, A13). Rein.
// I1b-02 übernimmt kontrollmessungFolgetag und offeneNachmessungen in die Aufgaben-Rechnung ohne eigene Regel (A7).
import type { AnsatzZeile } from '../bewertung/verlauf.ts';
import { kalendertag, tagPlus, type Zeitzone } from '../zeit.ts';
import { zustandAusSchritten, type SchrittZeile } from './stand.ts';

/** Über diesem Abstand zwischen gilt_ab und erfasst_am gilt ein Ansatz als nacherfasst, wie die Spalte nacherfasst (TZ9) */
const NACHERFASST_AB_MS = 2 * 60 * 60 * 1000;

/** «Kontrollmessung am Folgetag» (R5.2, UC8-AK5): Kalendertag in Zürich nach dem Beginn, nicht bei Nacherfassung */
export function kontrollmessungFolgetag(
  ansatz: AnsatzZeile & { gilt_ab: string; erfasst_am?: string | null },
  zeitzone: Zeitzone,
): string | undefined {
  if (ansatz.typ !== 'neuansatz' || ansatz.storniert_am !== null || ansatz.status === 'abgebrochen')
    return undefined;
  if (ansatz.erfasst_am && Date.parse(ansatz.erfasst_am) - Date.parse(ansatz.gilt_ab) > NACHERFASST_AB_MS)
    return undefined;
  return tagPlus(kalendertag(new Date(ansatz.begonnen_am), zeitzone), 1);
}

/** Jede gültige pH-Korrektur ohne gültige Messung «nachmessen» dazu, fällig ab timer_ende (R5.2) */
export function offeneNachmessungen(
  ansaetze: readonly (AnsatzZeile & { timer_ende?: string | null })[],
  messungen: readonly {
    id: string;
    messart: string;
    ansatz_id: string | null;
    storniert_am: string | null;
  }[],
  jetzt: Date,
): { platzId: string; ansatzId: string; faelligAb: string }[] {
  // fällig ab timer_ende auch in der Zukunft: Heute zeigt «Nachmessen ab …» schon vorher
  void jetzt;
  return ansaetze
    .filter((a) => a.typ === 'ph_korrektur' && a.storniert_am === null && a.timer_ende)
    .filter(
      (a) =>
        !messungen.some((m) => m.messart === 'nachmessen' && m.ansatz_id === a.id && m.storniert_am === null),
    )
    .map((a) => ({ platzId: a.platz_id, ansatzId: a.id, faelligAb: a.timer_ende as string }));
}

/** Laufende Neuansätze mit Schritten aus dem Bündel, zum Fortsetzen ohne lokalen Stand (Gerätewechsel, A13) */
export function laufendeAnsaetze(
  ansaetze: readonly AnsatzZeile[],
  schritte: readonly (SchrittZeile & { ansatz_id: string })[],
): { platzId: string; ansatzId: string; schritte: SchrittZeile[] }[] {
  return ansaetze
    .filter((a) => a.typ === 'neuansatz' && a.storniert_am === null)
    .map((a) => ({ a, s: schritte.filter((x) => x.ansatz_id === a.id && !x.storniert_am) }))
    .filter(({ s }) => s.length > 0 && zustandAusSchritten(s, []).status === 'laufend')
    .map(({ a, s }) => ({
      platzId: a.platz_id,
      ansatzId: a.id,
      schritte: [...s].sort((x, y) => x.nr - y.nr),
    }));
}
