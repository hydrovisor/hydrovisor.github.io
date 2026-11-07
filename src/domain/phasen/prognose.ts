// Phasenprognose eines Satzes an einem Kalendertag (Plan 36; R1.1, R1.5, R3.1, TZ5). Rein: `jetzt` und Zeitzone als
// Parameter, Kalendertage in Zürich (G2). Bestätigte Phase aus dem jüngsten phase_antwort {antwort: ja} des Satzes bis
// `jetzt` (Lesart wie phasenStand()), ohne Antwort Keimung ab Saatdatum; danach zählen die typischen Dauern weiter.
import { zeilen, type Teile } from '../anlage/teile.ts';
import { kalendertag, tagPlus, type Zeitzone } from '../zeit.ts';
import { phasenfolge, type Phase } from './profil.ts';

export interface SatzBezug {
  /** fehlt bei einem noch nicht gespeicherten Satz */
  satzId?: string;
  sorteId: string;
  kulturform: string;
  saatdatum: string;
  direktsaat: boolean;
}

interface Antwort {
  typ: string;
  satz_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}

/** jüngste gültige Antwort «ja» des Satzes bis jetzt */
function bestaetigt(
  teile: Teile,
  satzId: string | undefined,
  jetzt: Date,
  zeitzone: Zeitzone,
): { phase: Phase; beginn: string } | undefined {
  if (satzId === undefined) return undefined;
  const letzte = zeilen<Antwort>(teile, 'ereignis_satz')
    .filter(
      (e) =>
        e.typ === 'phase_antwort' &&
        e.satz_id === satzId &&
        (e.storniert_am ?? null) === null &&
        e.daten?.['antwort'] === 'ja' &&
        Date.parse(e.gilt_ab) <= jetzt.getTime(),
    )
    .sort((a, b) => Date.parse(a.gilt_ab) - Date.parse(b.gilt_ab))
    .at(-1);
  return letzte
    ? {
        phase: String(letzte.daten?.['phase']) as Phase,
        beginn: kalendertag(new Date(letzte.gilt_ab), zeitzone),
      }
    : undefined;
}

/** Phase des Satzes am Kalendertag `tag`: beginn + typ ist der erste Tag der nächsten Phase */
export function phaseAm(teile: Teile, satz: SatzBezug, tag: string, jetzt: Date, zeitzone: Zeitzone): Phase {
  const folge = phasenfolge(teile, satz.sorteId, satz.kulturform);
  const b = bestaetigt(teile, satz.satzId, jetzt, zeitzone);
  let beginn = b?.beginn ?? satz.saatdatum;
  let i = folge.findIndex((p) => p.phase === (b?.phase ?? 'keimung'));
  if (i < 0) return b ? b.phase : (folge[0]?.phase ?? 'keimung');
  while (i < folge.length - 1) {
    const typ = folge[i]?.dauer.typ;
    if (typ === undefined) break;
    const naechste = tagPlus(beginn, typ);
    if (tag < naechste) break;
    beginn = naechste;
    i += 1;
  }
  return (folge[i] as { phase: Phase }).phase;
}
