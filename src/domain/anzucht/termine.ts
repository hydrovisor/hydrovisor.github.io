// Termine eines neuen Satzes (R1.6, UC5-AK5, Konzept 5.8; Plan 23). Rein: jetzt und Zeitzone als Parameter.
// Eingabe für faelligeAufgaben() in I1b-02; hier nur die Fälligkeiten.
import { kalendertag, tagPlus, type Zeitzone } from '../zeit.ts';

export type SaatTerminTyp = 'deckel_oeffnen' | 'abdeckung_entfernen' | 'keimung_pruefen' | 'umsetzen';

export interface SaatTermin {
  typ: SaatTerminTyp;
  /** Satz, auf den sich der Termin bezieht */
  bezug: string;
  faelligAm: string;
}

/**
 * Deckel öffnen (nur Dunkelkeimer-Box) bzw. Abdeckung entfernen (nur Direktsaat Dunkelkeimer) am Saattag + minimale
 * Keimdauer; Keimung prüfen am Saattag + typische Keimdauer; Umsetzen am Umsetzdatum (nicht bei Direktsaat). Termine
 * vor dem Erfassungstag (Kalendertag in der Zeitzone) liegen auf dem Erfassungstag (R1.6, A15).
 */
export function saatTermine(
  satz: {
    satzId: string;
    saatdatum: string;
    boxTyp?: 'box_licht' | 'box_dunkel';
    direktsaat: boolean;
    keimart?: string;
  },
  keimdauer: { min?: number; typ?: number },
  umsetzenAm: string | undefined,
  jetzt: Date,
  zeitzone: Zeitzone,
): { termine: SaatTermin[]; rueckdatiert: boolean } {
  const erfasst = kalendertag(jetzt, zeitzone);
  const nichtVor = (tag: string) => (tag < erfasst ? erfasst : tag);
  const termine: SaatTermin[] = [];
  const dazu = (typ: SaatTerminTyp, tag: string) =>
    termine.push({ typ, bezug: satz.satzId, faelligAm: nichtVor(tag) });
  const min = keimdauer.min ?? keimdauer.typ;
  if (min !== undefined) {
    if (!satz.direktsaat && satz.boxTyp === 'box_dunkel')
      dazu('deckel_oeffnen', tagPlus(satz.saatdatum, min));
    if (satz.direktsaat && satz.keimart === 'dunkel')
      dazu('abdeckung_entfernen', tagPlus(satz.saatdatum, min));
  }
  if (keimdauer.typ !== undefined) dazu('keimung_pruefen', tagPlus(satz.saatdatum, keimdauer.typ));
  if (!satz.direktsaat && umsetzenAm) dazu('umsetzen', umsetzenAm);
  return { termine, rueckdatiert: satz.saatdatum < erfasst };
}

/**
 * Termin «Keimung prüfen» (R5.2, Plan 24): erste Prüfung am Saattag + typische Keimdauer, nicht vor dem Kalendertag des
 * Erfassungszeitpunkts (Plan 23 Befund 13); nach einer Prüfung mit offenen Schwämmen (Teilergebnis) am Prüftag + 2,
 * solange dieser Tag nicht nach Saat + Keimdauer max liegt; ohne offene Schwämme kein Termin.
 */
export function keimPruefTermin(
  e: {
    satzId: string;
    saatdatum: string;
    keimdauer: { typ?: number; max?: number };
    erfasstAm: Date;
    letztePruefung?: string;
    offen: number;
  },
  zeitzone: Zeitzone,
): { faelligAm?: string; grund: 'erste' | 'teilergebnis' | 'ueber_max' | 'fertig' } {
  if (e.offen <= 0) return { grund: 'fertig' };
  if (e.letztePruefung === undefined) {
    const erfasst = kalendertag(e.erfasstAm, zeitzone);
    // ohne typische Keimdauer die längste, sonst der Erfassungstag (A)
    const dauer = e.keimdauer.typ ?? e.keimdauer.max ?? 0;
    const tag = tagPlus(e.saatdatum, dauer);
    return { faelligAm: tag < erfasst ? erfasst : tag, grund: 'erste' };
  }
  const folge = tagPlus(e.letztePruefung, 2);
  if (e.keimdauer.max !== undefined && folge > tagPlus(e.saatdatum, e.keimdauer.max))
    return { grund: 'ueber_max' };
  return { faelligAm: folge, grund: 'teilergebnis' };
}
