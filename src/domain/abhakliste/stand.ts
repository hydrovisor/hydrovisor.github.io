// Ablaufstand der Abhakliste (Konzept R4.6, U4, U7, 8.1 Regel 2, 11.4; Plan 29 A6, A8, A10, A13). Rein und
// JSON-serialisierbar (IndexedDB, Neustart). Jeder Übergang gibt einen neuen Stand zurück; ein unzulässiger Übergang
// gibt den Stand unverändert zurück. Zeitpunkte als ISO-Text.
import type { Vorgang } from '../datenpfad/erfassung.ts';
import type { NeuansatzErgebnis } from '../rechner.ts';
import { uhrzeit, type Zeitzone } from '../zeit.ts';
import { MESSZEILEN, TIMER_MIN, type Messfeld, type Teilschritt, type ZeileDef } from './zeilen.ts';

export interface AblaufMessung {
  id: string;
  ph?: number;
  ec?: number;
  temperatur?: number;
  giltAb?: string;
}

export interface ZeilenStand {
  nr: number;
  schritt: ZeileDef['schritt'];
  sollMl?: number;
  aufzuege: number;
  timerMin?: number;
  zugabe?: string;
  teilschritte?: Teilschritt[];
  erledigtAm?: string;
  istMl?: number;
  aufzuegeErledigt: number;
  begonnen: boolean;
  schrittClientId?: string;
  positionClientIds?: string[];
  messungId?: string;
}

export interface AblaufStand {
  version: 1;
  id: string;
  art: 'abhakliste';
  platzId: string;
  code: string;
  ansatzId: string;
  begonnenAm?: string;
  zeilen: ZeilenStand[];
  letzteAktionAm: string;
  kopfGeschrieben: boolean;
  /** Betriebsvolumen in Hundertsteln l, ab dem Kopf */
  volumen?: number;
  ausstehend: Vorgang[];
  rechnung?: NeuansatzErgebnis;
  frischwasser?: AblaufMessung;
  messungen: { kontrolle?: AblaufMessung; end?: AblaufMessung };
}

/** Pause, ab der die App vor der nächsten Zugabe nachfragt (R4.6, strikt grösser) */
export const PAUSE_MS = 2 * 60 * 1000;
/** Wake Lock bis Timerende plus 2 min (U7, E-F4-6) */
export const WACH_NACH_MS = 2 * 60 * 1000;

const ablaufId = (platzId: string) => `abhakliste:${platzId}`;

function zeilenStand(d: ZeileDef): ZeilenStand {
  return {
    nr: d.nr,
    schritt: d.schritt,
    ...(d.sollMl === undefined ? {} : { sollMl: d.sollMl }),
    aufzuege: d.aufzuege,
    ...(d.timerMin === undefined ? {} : { timerMin: d.timerMin }),
    ...(d.zugabe === undefined ? {} : { zugabe: d.zugabe }),
    ...(d.teilschritte === undefined ? {} : { teilschritte: d.teilschritte }),
    aufzuegeErledigt: 0,
    begonnen: false,
  };
}

export function standNeu(
  e: { platzId: string; code: string; ansatzId: string; defs: readonly ZeileDef[] },
  jetzt: Date,
): AblaufStand {
  return {
    version: 1,
    id: ablaufId(e.platzId),
    art: 'abhakliste',
    platzId: e.platzId,
    code: e.code,
    ansatzId: e.ansatzId,
    zeilen: e.defs.map(zeilenStand),
    letzteAktionAm: jetzt.toISOString(),
    kopfGeschrieben: false,
    ausstehend: [],
    messungen: {},
  };
}

/** Soll, Aufzüge und Teilschritte offener, nicht begonnener Zeilen aus neuen Zeilen übernehmen (Restdosis nach 14) */
export function defsUebernehmen(stand: AblaufStand, defs: readonly ZeileDef[]): AblaufStand {
  return {
    ...stand,
    zeilen: stand.zeilen.map((z) => {
      const d = defs.find((x) => x.nr === z.nr);
      if (!d || z.erledigtAm !== undefined || z.begonnen) return z;
      return {
        ...zeilenStand(d),
        ...(z.schrittClientId === undefined ? {} : { schrittClientId: z.schrittClientId }),
        ...(z.messungId === undefined ? {} : { messungId: z.messungId }),
      };
    }),
  };
}

const zeileVon = (s: AblaufStand, nr: number) => s.zeilen.find((z) => z.nr === nr);

export function aktiveZeile(stand: AblaufStand): number | undefined {
  return stand.zeilen.find((z) => z.erledigtAm === undefined)?.nr;
}

function ersetze(stand: AblaufStand, z: ZeilenStand, jetzt: Date): AblaufStand {
  const zeilen = stand.zeilen.map((x) => (x.nr === z.nr ? z : x));
  const begonnenAm =
    stand.begonnenAm ?? (z.nr === 1 && z.erledigtAm !== undefined ? z.erledigtAm : undefined);
  return {
    ...stand,
    zeilen,
    letzteAktionAm: jetzt.toISOString(),
    ...(begonnenAm === undefined ? {} : { begonnenAm }),
  };
}

/** Ende des Timers der Zeile nr: Haken der Vorgängerzeile + 15 min */
export function timerEnde(stand: AblaufStand, nr: number): Date | undefined {
  const z = zeileVon(stand, nr);
  if (z?.timerMin === undefined) return undefined;
  const vor = zeileVon(stand, nr - 1)?.erledigtAm;
  return vor === undefined ? undefined : new Date(Date.parse(vor) + z.timerMin * 60_000);
}

export function wachBis(ende: Date): Date {
  return new Date(ende.getTime() + WACH_NACH_MS);
}

const istMesszeile = (nr: number) => MESSZEILEN[nr] !== undefined;

/** Die aktive Zeile ist abhakbar: Timer abgelaufen, Messzeile mit Messung */
export function abhakbar(stand: AblaufStand, nr: number, jetzt: Date): boolean {
  if (aktiveZeile(stand) !== nr) return false;
  const z = zeileVon(stand, nr);
  if (!z) return false;
  const ende = timerEnde(stand, nr);
  if (z.timerMin !== undefined && (ende === undefined || jetzt.getTime() < ende.getTime())) return false;
  if (istMesszeile(nr) && z.messungId === undefined) return false;
  return true;
}

export function abhaken(stand: AblaufStand, nr: number, jetzt: Date): AblaufStand {
  if (!abhakbar(stand, nr, jetzt)) return stand;
  const z = zeileVon(stand, nr) as ZeilenStand;
  const ist = z.istMl ?? z.sollMl;
  return ersetze(
    stand,
    {
      ...z,
      erledigtAm: jetzt.toISOString(),
      ...(ist === undefined ? {} : { istMl: ist }),
      aufzuegeErledigt: z.aufzuege,
    },
    jetzt,
  );
}

/** Ein Tipp auf einen Aufzug oder einen Teilschritt der Restdosis; der letzte hakt die Zeile ab (R4.11, A10) */
export function aufzugAbhaken(stand: AblaufStand, nr: number, jetzt: Date): AblaufStand {
  if (!abhakbar(stand, nr, jetzt)) return stand;
  const z = zeileVon(stand, nr) as ZeilenStand;
  const zahl = z.aufzuegeErledigt + 1;
  if (zahl >= z.aufzuege)
    return abhaken(
      { ...stand, zeilen: stand.zeilen.map((x) => (x.nr === nr ? { ...z, begonnen: true } : x)) },
      nr,
      jetzt,
    );
  return ersetze(stand, { ...z, aufzuegeErledigt: zahl, begonnen: true }, jetzt);
}

export function mengeAendern(stand: AblaufStand, nr: number, istMl: number, jetzt: Date): AblaufStand {
  if (aktiveZeile(stand) !== nr || !Number.isInteger(istMl) || istMl < 0) return stand;
  const z = zeileVon(stand, nr) as ZeilenStand;
  return ersetze(stand, { ...z, istMl, begonnen: true }, jetzt);
}

export function messungZuordnen(stand: AblaufStand, nr: number, messung: AblaufMessung): AblaufStand {
  if (aktiveZeile(stand) !== nr || !istMesszeile(nr)) return stand;
  const z = zeileVon(stand, nr) as ZeilenStand;
  const messungen =
    nr === 14
      ? { ...stand.messungen, kontrolle: messung }
      : nr === 17
        ? { ...stand.messungen, end: messung }
        : stand.messungen;
  return {
    ...stand,
    zeilen: stand.zeilen.map((x) => (x.nr === nr ? { ...z, messungId: messung.id, begonnen: true } : x)),
    messungen,
    ...(nr === 3 ? { frischwasser: messung } : {}),
  };
}

/** Abwählbar ist nur die zuletzt erledigte Zeile, solange die nächste nicht begonnen ist (R4.6, A8) */
export function abwaehlbar(stand: AblaufStand, nr: number): boolean {
  const erledigt = stand.zeilen.filter((z) => z.erledigtAm !== undefined);
  const letzte = erledigt[erledigt.length - 1];
  if (letzte?.nr !== nr) return false;
  const naechste = zeileVon(stand, nr + 1);
  return !naechste?.begonnen;
}

export function abwaehlen(stand: AblaufStand, nr: number, jetzt: Date): AblaufStand {
  if (!abwaehlbar(stand, nr)) return stand;
  const z = zeileVon(stand, nr) as ZeilenStand;
  const zuruck: ZeilenStand = { ...z, aufzuegeErledigt: 0, begonnen: z.messungId !== undefined };
  delete zuruck.erledigtAm;
  delete zuruck.istMl;
  delete zuruck.schrittClientId;
  delete zuruck.positionClientIds;
  const s = ersetze(stand, zuruck, jetzt);
  if (nr === 1) delete s.begonnenAm;
  return s;
}

/** pH vor EC in der Kontroll- und Endmessung (Herstellerregel Konzept 5.6) */
export function feldFrei(
  nr: number,
  eingabe: { ph?: number; ec?: number; temperatur?: number },
  feld: Messfeld,
): boolean {
  if (feld !== 'ec' || (nr !== 14 && nr !== 17)) return true;
  return eingabe.ph !== undefined;
}

interface Zugabe {
  name: string;
  ml?: number;
  am: string;
}

/** zuletzt bestätigte Zugabe und nächste Zugabe für die Rückfrage */
function zugabenUmAktiv(stand: AblaufStand): { letzte?: Zugabe; naechste?: string } | undefined {
  const aktiv = aktiveZeile(stand);
  if (aktiv === undefined) return undefined;
  const z = zeileVon(stand, aktiv) as ZeilenStand;
  if (aktiv === 15) {
    const teile = z.teilschritte ?? [];
    if (z.aufzuegeErledigt === 0 || z.aufzuegeErledigt >= teile.length) return undefined;
    const fertig = teile[z.aufzuegeErledigt - 1] as Teilschritt;
    const naechste = teile[z.aufzuegeErledigt] as Teilschritt;
    return {
      letzte: { name: fertig.name, ml: fertig.sollMl, am: stand.letzteAktionAm },
      naechste: naechste.name,
    };
  }
  if (aktiv < 6 || aktiv > 9) return undefined;
  const davor = stand.zeilen.filter(
    (x) => x.nr < aktiv && x.zugabe !== undefined && x.erledigtAm !== undefined,
  );
  const letzte = davor[davor.length - 1];
  const naechste = stand.zeilen.find((x) => x.nr >= aktiv && x.zugabe !== undefined);
  if (!letzte?.erledigtAm || !naechste?.zugabe) return undefined;
  return {
    letzte: {
      name: letzte.zugabe ?? '',
      ...(letzte.istMl === undefined ? {} : { ml: letzte.istMl }),
      am: letzte.erledigtAm,
    },
    naechste: naechste.zugabe,
  };
}

/** Rückfrage nach mehr als 2 min Pause vor der nächsten Zugabe (R4.6, A6) */
export function rueckfrage(
  stand: AblaufStand,
  _defs: readonly ZeileDef[],
  jetzt: Date,
  zeitzone: Zeitzone,
): { text: string } | undefined {
  if (jetzt.getTime() - Date.parse(stand.letzteAktionAm) <= PAUSE_MS) return undefined;
  const u = zugabenUmAktiv(stand);
  if (!u?.letzte || !u.naechste) return undefined;
  const menge = u.letzte.ml === undefined ? '' : ` ${(u.letzte.ml / 10).toFixed(1)} ml`;
  return {
    text: `Zuletzt bestätigt: ${u.letzte.name}${menge} um ${uhrzeit(new Date(u.letzte.am), zeitzone)}. ${u.naechste} schon im Wasser?`,
  };
}

/** «Ja, war schon drin» hakt bis und mit der nächsten Zugabe ab (Soll als Ist), «Nein» schliesst die Frage */
export function rueckfrageBeantworten(stand: AblaufStand, antwort: 'ja' | 'nein', jetzt: Date): AblaufStand {
  if (antwort === 'nein') return { ...stand, letzteAktionAm: jetzt.toISOString() };
  const aktiv = aktiveZeile(stand);
  if (aktiv === 15) return aufzugAbhaken(stand, 15, jetzt);
  const ziel = stand.zeilen.find((x) => aktiv !== undefined && x.nr >= aktiv && x.zugabe !== undefined);
  if (aktiv === undefined || !ziel || aktiv < 6 || aktiv > 9)
    return { ...stand, letzteAktionAm: jetzt.toISOString() };
  let s = stand;
  for (let nr = aktiv; nr <= ziel.nr; nr += 1) s = abhaken(s, nr, jetzt);
  return s;
}

/** Abbruch: die nächste offene Zeilennummer (Plan 29 Migration 1) */
export function abbruchNr(stand: AblaufStand): number | undefined {
  return aktiveZeile(stand);
}

// --- Zustand wie ansatz_zustand_nachrechnen() (8.1 Regel 2, Risiko 11) ---

export interface SchrittZeile {
  nr: number;
  schritt: string;
  erledigt_am: string | null;
  storniert_am?: string | null;
  erfasst_am?: string | null;
}
export interface MessungZeile {
  id: string;
  messart: string;
  gilt_ab: string;
  storniert_am?: string | null;
}
export interface Zustand {
  status: 'laufend' | 'abgeschlossen' | 'abgebrochen';
  abgeschlossenAm?: string;
  timerEnde?: string;
  kontrollmessungId?: string;
  endmessungId?: string;
}

const gueltig = <T extends { storniert_am?: string | null }>(x: T) => !x.storniert_am;
const zeitpunkt = (s: SchrittZeile) => s.erledigt_am ?? s.erfasst_am ?? undefined;
const iso = (t: string) => new Date(t).toISOString();

function juengste(messungen: readonly MessungZeile[], messart: string): string | undefined {
  const passend = messungen.filter((m) => gueltig(m) && m.messart === messart);
  passend.sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab));
  return passend[0]?.id;
}

export function zustandAusSchritten(
  schritte: readonly SchrittZeile[],
  messungen: readonly MessungZeile[],
): Zustand {
  const g = schritte.filter(gueltig);
  const abbruch = g.find((s) => s.schritt === 'abbruch');
  const ende = g.find((s) => s.schritt === 'endmessung');
  const abschluss = abbruch ?? ende;
  const am = abschluss ? zeitpunkt(abschluss) : undefined;
  let timer: string | undefined;
  for (const t of [16, 13, 11]) {
    const vor = g.find((s) => s.nr === t - 1 && s.schritt !== 'abbruch' && s.erledigt_am);
    if (vor?.erledigt_am) {
      timer = new Date(Date.parse(vor.erledigt_am) + TIMER_MIN * 60_000).toISOString();
      break;
    }
  }
  const kontrolle = juengste(messungen, 'kontrolle_ansatz');
  const endm = juengste(messungen, 'end_ansatz');
  return {
    status: abbruch ? 'abgebrochen' : ende ? 'abgeschlossen' : 'laufend',
    ...(am ? { abgeschlossenAm: iso(am) } : {}),
    ...(timer ? { timerEnde: timer } : {}),
    ...(kontrolle ? { kontrollmessungId: kontrolle } : {}),
    ...(endm ? { endmessungId: endm } : {}),
  };
}
