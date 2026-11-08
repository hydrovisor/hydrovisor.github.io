// Wechselblock: bis zu 3 Abhaklisten parallel (Konzept R5.6, R5.3, R4.6; Plan 139). Rein. Der Block ist eine Sicht und
// wird nie gespeichert (8.1 Regel 2): Glieder aus den lokalen Ständen, den laufenden Neuansätzen im Bündel und den heute
// angezeigten Ansatz-Aufgaben; der nächste Schritt schlägt nur vor und sperrt kein Gefäss (A1).
import type { AnsatzZeile } from '../bewertung/verlauf.ts';
import type { Aufgabe, AufgabenArt } from '../aufgaben.ts';
import { messbareOrte } from '../ort.ts';
import type { Teile } from '../teile.ts';
import { kalendertag, uhrzeit, type Zeitzone } from '../zeit.ts';
import { laufendeAnsaetze } from './folgen.ts';
import { aktiveZeile, timerEnde, type AblaufStand, type SchrittZeile } from './stand.ts';
import { TIMER_MIN, type SchrittTyp } from './zeilen.ts';

export const MAX_ABHAKLISTEN_JE_BLOCK = 3;

/** ein lokaler Stand ohne Aktion seit 24 h zählt nicht (wie «alt» in Heute, A4) */
const ALT_MS = 24 * 60 * 60 * 1000;
/** Timerzeilen der Abhakliste (R4.6) */
const TIMER_ZEILEN: ReadonlySet<number> = new Set([11, 13, 16]);
/** Ansatz-Aufgaben, die in die Maske Ansatz führen (A3: ohne station_echte_blaetter) */
const BLOCK_TYPEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>(['loesung_wechseln', 'ansatz']);

/** Schritt der Zeile 0 bis 17 als kurzer Text («Zeile 1 absaugen») */
const SCHRITT_TEXT: Readonly<Record<SchrittTyp, string>> = {
  kalibrierung_pruefen: 'Kalibrierung prüfen',
  absaugen: 'absaugen',
  frischwasser: 'Frischwasser',
  frischwasser_messen: 'Frischwasser messen',
  gerechnet_fuer: 'Gerechnet für',
  micro: 'Micro',
  spuelen: 'spülen',
  grow: 'Grow',
  bloom: 'Bloom',
  umruehren: 'umrühren',
  timer: 'warten',
  ph_einstellen: 'pH einstellen',
  kontrollmessung: 'Kontrollmessung',
  restdosis: 'Restdosis',
  endmessung: 'Endmessung',
  abbruch: 'Abbruch',
};
/** feste Reihenfolge der Schritte 0 bis 17 (zeilenAus) für Glieder ohne lokalen Stand */
const SCHRITT_JE_ZEILE: readonly SchrittTyp[] = [
  'kalibrierung_pruefen',
  'absaugen',
  'frischwasser',
  'frischwasser_messen',
  'gerechnet_fuer',
  'micro',
  'spuelen',
  'grow',
  'spuelen',
  'bloom',
  'umruehren',
  'timer',
  'ph_einstellen',
  'timer',
  'kontrollmessung',
  'restdosis',
  'timer',
  'endmessung',
];
const textZeile = (nr: number): string | undefined => {
  const s = SCHRITT_JE_ZEILE[nr];
  return s === undefined ? undefined : SCHRITT_TEXT[s];
};

export interface BlockGlied {
  platzId: string;
  /** 'R-1.2' */
  code: string;
  /** '1.2' */
  kennung: string;
  /** aktive Zeile 0 bis 17; 0 bei nicht begonnenem Glied */
  zeile: number;
  /** Schritt der aktiven Zeile ('absaugen', 'Grow') */
  zeilenText?: string;
  /** Ende des Timers der aktiven Zeile (ISO), nur wenn die aktive Zeile eine Timerzeile ist */
  timerEnde?: string;
  quelle: 'lokal' | 'buendel' | 'aufgabe';
  /** Aufgabenschlüssel bei quelle 'aufgabe' */
  aufgabe?: string;
}

export type NaechsterSchritt =
  | { art: 'schritt'; platzId: string; code: string; kennung: string; zeile: number; zeilenText?: string }
  | { art: 'warten'; bis: string }
  | { art: 'fertig' };

export interface Wechselblock {
  anlageId: string;
  /** 'JJJJ-MM-TT' Zürich */
  tag: string;
  /** 2 bis 3 Glieder, nach Code sortiert */
  glieder: BlockGlied[];
  naechster: NaechsterSchritt;
  /** Schlüssel fälliger Ansatz-Aufgaben über 3, die nachrücken (A5) */
  wartend: string[];
}

/** aktive Zeile und Timer eines lokalen Stands; undefined, wenn abgeschlossen */
export function gliedAusStand(
  stand: AblaufStand,
  ort: { code: string; kennung: string },
): BlockGlied | undefined {
  const nr = aktiveZeile(stand);
  if (nr === undefined) return undefined;
  const z = stand.zeilen.find((x) => x.nr === nr);
  const ende = timerEnde(stand, nr);
  const text = z ? SCHRITT_TEXT[z.schritt] : textZeile(nr);
  return {
    platzId: stand.platzId,
    code: ort.code,
    kennung: ort.kennung,
    zeile: nr,
    ...(text === undefined ? {} : { zeilenText: text }),
    ...(ende === undefined ? {} : { timerEnde: ende.toISOString() }),
    quelle: 'lokal',
  };
}

/** aktive Zeile eines laufenden Neuansatzes aus dem Bündel und Timerende, nur bei aktiver Timerzeile (Gerätewechsel) */
export function buendelZeile(
  schritte: readonly SchrittZeile[],
  timerEndeKopf: string | null | undefined,
): { zeile: number; timerEnde?: string } {
  const erledigt = schritte.filter((x) => !x.storniert_am && x.erledigt_am).map((x) => x.nr);
  const zeile = erledigt.length === 0 ? 0 : Math.min(17, Math.max(...erledigt) + 1);
  if (!TIMER_ZEILEN.has(zeile)) return { zeile };
  const vor = schritte.find((x) => x.nr === zeile - 1 && !x.storniert_am && x.erledigt_am);
  const ende = timerEndeKopf
    ? new Date(timerEndeKopf).toISOString()
    : vor?.erledigt_am
      ? new Date(Date.parse(vor.erledigt_am) + TIMER_MIN * 60_000).toISOString()
      : undefined;
  return ende === undefined ? { zeile } : { zeile, timerEnde: ende };
}

const vergleichCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);

/** Regel (a) abgelaufener Timer, früheste Endzeit zuerst; (b) kleinste Zeile; (c) Code */
export function naechsterSchritt(glieder: readonly BlockGlied[], jetzt: Date): NaechsterSchritt {
  if (glieder.length === 0) return { art: 'fertig' };
  const t = jetzt.getTime();
  const ende = (g: BlockGlied) => (g.timerEnde === undefined ? undefined : Date.parse(g.timerEnde));
  const bereit = glieder.filter((g) => {
    const e = ende(g);
    return e === undefined || e <= t;
  });
  if (bereit.length === 0) {
    const frueh = Math.min(...glieder.map((g) => ende(g) as number));
    return { art: 'warten', bis: new Date(frueh).toISOString() };
  }
  const [g] = [...bereit].sort((a, b) => {
    const ea = ende(a);
    const eb = ende(b);
    if (ea !== undefined && eb !== undefined && ea !== eb) return ea - eb;
    if (ea !== undefined && eb === undefined) return -1;
    if (ea === undefined && eb !== undefined) return 1;
    return a.zeile - b.zeile || vergleichCode(a, b);
  }) as [BlockGlied];
  return {
    art: 'schritt',
    platzId: g.platzId,
    code: g.code,
    kennung: g.kennung,
    zeile: g.zeile,
    ...(g.zeilenText === undefined ? {} : { zeilenText: g.zeilenText }),
  };
}

interface Kandidat {
  anlageId: string;
  glied: BlockGlied;
}

/** je Anlage höchstens ein Block; Anlagen mit weniger als 2 Gliedern fehlen */
export function wechselblock(
  e: { teile: Teile; aufgaben: readonly Aufgabe[]; lokal: readonly AblaufStand[] },
  jetzt: Date,
  zeitzone: Zeitzone,
): Wechselblock[] {
  const heute = kalendertag(jetzt, zeitzone);
  const orte = new Map(messbareOrte(e.teile).map((o) => [o.platzId, o]));
  const laufend: Kandidat[] = [];
  /** Plätze mit lokalem Stand: das Bündel und die Aufgabe gelten dort nicht (A9, Plan 29 A13) */
  const belegt = new Set<string>();

  for (const s of e.lokal) {
    if (s.art !== 'abhakliste') continue;
    // auch ein alter Stand belegt den Platz: er bleibt in Heute mit «Abbrechen» und wird kein Glied (A4)
    belegt.add(s.platzId);
    if (jetzt.getTime() - Date.parse(s.letzteAktionAm) > ALT_MS) continue;
    const ort = orte.get(s.platzId);
    if (!ort) continue;
    const g = gliedAusStand(s, ort);
    if (g) laufend.push({ anlageId: ort.anlageId, glied: g });
  }

  const ansaetze = (e.teile['naehrloesungsansatz'] ?? []) as (AnsatzZeile & { timer_ende?: string | null })[];
  const schritte = (e.teile['ansatz_schritt'] ?? []) as (SchrittZeile & { ansatz_id: string })[];
  for (const l of laufendeAnsaetze(ansaetze, schritte)) {
    if (belegt.has(l.platzId)) continue;
    const ort = orte.get(l.platzId);
    if (!ort) continue;
    belegt.add(l.platzId);
    const { zeile, timerEnde: ende } = buendelZeile(
      l.schritte,
      ansaetze.find((a) => a.id === l.ansatzId)?.timer_ende,
    );
    const text = textZeile(zeile);
    laufend.push({
      anlageId: ort.anlageId,
      glied: {
        platzId: l.platzId,
        code: ort.code,
        kennung: ort.kennung,
        zeile,
        ...(text === undefined ? {} : { zeilenText: text }),
        ...(ende === undefined ? {} : { timerEnde: ende }),
        quelle: 'buendel',
      },
    });
  }

  // fällige Ansatz-Aufgaben, deterministisch: früheste Fälligkeit zuerst, dann Code (A2)
  const faellig = e.aufgaben
    .filter((a) => BLOCK_TYPEN.has(a.typ) && a.anzeigeAb <= heute && a.ort?.platzId)
    .slice()
    .sort(
      (a, b) =>
        a.faelligAm.localeCompare(b.faelligAm) || (a.ort?.code ?? '').localeCompare(b.ort?.code ?? ''),
    );
  const aufgaben: Kandidat[] = [];
  for (const a of faellig) {
    const ort = a.ort;
    if (!ort || belegt.has(ort.platzId)) continue;
    belegt.add(ort.platzId);
    aufgaben.push({
      anlageId: a.anlageId,
      glied: {
        platzId: ort.platzId,
        code: ort.code,
        kennung: ort.kennung,
        zeile: 0,
        zeilenText: SCHRITT_TEXT.kalibrierung_pruefen,
        quelle: 'aufgabe',
        aufgabe: a.schluessel,
      },
    });
  }

  const anlagen = [...new Set([...laufend, ...aufgaben].map((k) => k.anlageId))].sort();
  const bloecke: Wechselblock[] = [];
  for (const anlageId of anlagen) {
    const lauf = laufend
      .filter((k) => k.anlageId === anlageId)
      .map((k) => k.glied)
      .sort(vergleichCode);
    const auf = aufgaben.filter((k) => k.anlageId === anlageId).map((k) => k.glied);
    const glieder = [...lauf, ...auf].slice(0, MAX_ABHAKLISTEN_JE_BLOCK);
    if (glieder.length < 2) continue;
    const wartend = auf
      .filter((g) => !glieder.includes(g))
      .map((g) => g.aufgabe)
      .filter((x): x is string => x !== undefined);
    glieder.sort(vergleichCode);
    bloecke.push({ anlageId, tag: heute, glieder, naechster: naechsterSchritt(glieder, jetzt), wartend });
  }
  return bloecke;
}

/** «1.2 · Zeile 1 absaugen», «2.3 · Zeile 11 · weiter ab 19:02», «2.1 · noch nicht begonnen» */
export function blockText(g: BlockGlied, zeitzone: Zeitzone): string {
  if (g.quelle === 'aufgabe') return `${g.kennung} · noch nicht begonnen`;
  if (g.timerEnde !== undefined)
    return `${g.kennung} · Zeile ${String(g.zeile)} · weiter ab ${uhrzeit(new Date(g.timerEnde), zeitzone)}`;
  return `${g.kennung} · Zeile ${String(g.zeile)}${g.zeilenText ? ` ${g.zeilenText}` : ''}`;
}

/** Kopfzeile «Nächster Schritt: 1.2 · Zeile 1 absaugen» bzw. «Alle Timer laufen · weiter ab 19:02» */
export function naechsterText(n: NaechsterSchritt, zeitzone: Zeitzone): string | undefined {
  if (n.art === 'fertig') return undefined;
  if (n.art === 'warten') return `Alle Timer laufen · weiter ab ${uhrzeit(new Date(n.bis), zeitzone)}`;
  return `Nächster Schritt: ${n.kennung} · Zeile ${String(n.zeile)}${n.zeilenText ? ` ${n.zeilenText}` : ''}`;
}
