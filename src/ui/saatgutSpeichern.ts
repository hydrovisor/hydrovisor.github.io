// Gemeinsame Speicherwege des Saatgut-Managers (Plan 211 A10): Tütenfoto verkleinern und hochladen, Erfassung
// (Wissen, dann Vorgang) mit Fortsetzen senden, Fotovorgang senden. In src/ui, weil Browser-API und src/daten (G1).
// Nutzer: SorteNeu, TuetenfotoKarte (Sorte), SaatgutErfassen, SaatgutNachtragen. Texte wie bisher (Plan 37, Plan 207).
import { fotoHochladen } from '../daten/ki.ts';
import { schreiben } from '../daten/schreiben.ts';
import { wissenSchreiben } from '../daten/wissen.ts';
import type { Vorgang } from '../domain/datenpfad/erfassung.ts';
import type { WissenAufruf } from '../domain/sorten/erfassung.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { tuetenbildVerkleinern } from './tuetenbild.ts';

/** Uhr der Oberfläche (G2: Date.now() nur hier) */
const jetzt = () => new Date(Date.now());

/** verkleinert das Foto und lädt es in den Ordner der Sorte (Plan 37 A16: Ordner zählt nicht für die Zuordnung) */
export async function tuetenfotoHochladen(
  ordner: string,
  datei: File,
): Promise<{ pfad: string } | { fehler: 'lesbar' | 'hochladen' }> {
  let bild: Blob;
  try {
    bild = await tuetenbildVerkleinern(datei);
  } catch {
    return { fehler: 'lesbar' };
  }
  const r = await fotoHochladen(ordner, bild);
  return 'fehler' in r ? { fehler: 'hochladen' } : { pfad: r.pfad };
}

/** Speicherstand einer Erfassung; Wiederholen setzt beim ersten offenen Schritt fort (Plan 37 A14, TO2) */
export interface Speicherstand {
  schluessel: string;
  wissen: WissenAufruf[];
  vorgang: Vorgang;
  wissenErledigt: number;
}

export async function erfassungSenden(
  stand: Speicherstand,
): Promise<
  | { status: 'gespeichert'; stand: Speicherstand }
  | { status: 'nicht_gespeichert'; stand: Speicherstand; meldung: string }
> {
  const w = await wissenSchreiben(stand.wissen, stand.wissenErledigt);
  if (w.status === 'nicht_gespeichert')
    return {
      status: 'nicht_gespeichert',
      stand: { ...stand, wissenErledigt: w.erledigt },
      meldung: w.fehler.text,
    };
  const fertig = { ...stand, wissenErledigt: stand.wissen.length };
  const r = await schreiben(fertig.vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
  if (r.status === 'nicht_gespeichert')
    return { status: 'nicht_gespeichert', stand: fertig, meldung: r.fehler.text };
  if (r.status === 'abweichend')
    return {
      status: 'nicht_gespeichert',
      stand: fertig,
      meldung: 'Nicht gespeichert: Diese Packung ist schon mit anderen Angaben gespeichert.',
    };
  return { status: 'gespeichert', stand: fertig };
}

/** sendet einen Fotovorgang (Storno plus neue Zeile); «abweichend» lässt sich nicht wiederholen (Plan 207 A12) */
export async function fotoVorgangSenden(
  vorgang: Vorgang,
): Promise<'gespeichert' | { meldung: string; wiederholbar: boolean }> {
  const r = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
  if (r.status === 'gespeichert') return 'gespeichert';
  if (r.status === 'abweichend')
    return {
      meldung: 'Foto nicht gespeichert: Es ist schon mit anderen Angaben gespeichert. Wähle das Foto erneut.',
      wiederholbar: false,
    };
  return { meldung: r.fehler.text, wiederholbar: true };
}

/** sendet «Kein Saatgut mehr» bzw. «Wieder vorrätig» (Plan 215); «abweichend» lässt sich nicht wiederholen */
export async function vorratSenden(
  vorgang: Vorgang,
): Promise<'gespeichert' | { meldung: string; wiederholbar: boolean }> {
  const r = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
  if (r.status === 'gespeichert') return 'gespeichert';
  if (r.status === 'abweichend')
    return { meldung: 'Nicht gespeichert: Diese Angabe ist schon anders gespeichert.', wiederholbar: false };
  return { meldung: r.fehler.text, wiederholbar: true };
}
