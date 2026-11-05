// Saatmenge und Keimrate (R12.1, R12.2; Plan 23). Rein: Teile aus dem Bündel, keine Uhr.
import { zeilen, type Teile } from '../anlage/teile.ts';
import type { Vorgang } from '../datenpfad/erfassung.ts';

export interface Empfehlung {
  samenJeSchwamm: number;
  obergrenzeSamen: number;
  pflanzenStehenLassen: number;
}

export interface Keimrate {
  p: number;
  herkunft: 'beobachtet' | 'packung' | 'art';
}

/** Mindestzahl gesäter Samen, ab der die beobachtete Keimrate gilt (R12.2) */
const BEOBACHTET_AB = 10;
const P_MIN = 0.3;
const P_MAX = 0.98;
/** Obergrenze ohne Saatempfehlung (Beispiel R12.1, Plan 23 A8) */
export const OBERGRENZE_OHNE_EMPFEHLUNG = 3;

/** Gleitkomma vor dem Aufrunden glätten: ln 0.1 / ln 0.1 = 1.0000000000000002 soll 1 bleiben (Plan 23 Risiken) */
const aufrunden = (x: number) => Math.ceil(Math.round(x * 1e9) / 1e9);

interface SaatgutZeile {
  id: string;
  keimfaehigkeit_packung: number | string | null;
  storniert_am: string | null;
}
interface KeimrateZeile {
  saatgut_id: string;
  gesaet: number | string;
  rate_geglaettet: number | string | null;
}

/** Keimrate der Packung aus v_keimrate (zählt nur echte Keimungen, G5), begrenzt auf 0.3 bis 0.98 */
export function keimrate(teile: Teile, saatgutId: string | undefined): Keimrate | undefined {
  if (!saatgutId) return undefined;
  const packung = zeilen<SaatgutZeile>(teile, 'saatgut').find(
    (s) => s.id === saatgutId && s.storniert_am === null,
  );
  if (!packung) return undefined;
  const rate = zeilen<KeimrateZeile>(teile, 'v_keimrate').find((r) => r.saatgut_id === saatgutId);
  if (!rate || rate.rate_geglaettet === null) return undefined;
  const p = Math.min(P_MAX, Math.max(P_MIN, Number(rate.rate_geglaettet)));
  const herkunft =
    Number(rate.gesaet) >= BEOBACHTET_AB
      ? 'beobachtet'
      : packung.keimfaehigkeit_packung !== null
        ? 'packung'
        : 'art';
  return { p, herkunft };
}

/** Rückfall ohne Packung: Standard-Keimfähigkeit der Art, begrenzt (R12.2 «sonst Standard der Art») */
export function keimrateArt(standard: number | string | null | undefined): Keimrate | undefined {
  if (standard === null || standard === undefined) return undefined;
  return { p: Math.min(P_MAX, Math.max(P_MIN, Number(standard))), herkunft: 'art' };
}

/**
 * R12.1: Samen je Schwamm s = min(⌈ln 0.1 / ln(1 − p)⌉, Obergrenze), mindestens 1; mit «Pflanzen stehen lassen» > 1
 * die Samen der Empfehlung. Schwamm-Keimrate q = 1 − (1 − p)^s; Schwämme m = ⌈Z / q⌉, bei q ≥ 0.99 m = Z, höchstens
 * Platzzahl der Box; Direktsaat m = Z. Ohne p: Samen der Empfehlung und m = Z + 1 (A8).
 */
export function saatmenge(e: {
  p: number | undefined;
  zieltoepfe: number;
  empfehlung?: Empfehlung;
  direktsaat: boolean;
  platzzahl: number;
}): { samenJeSchwamm: number; schwaemme: number; schwammKeimrate: number | undefined } {
  const z = Math.max(1, e.zieltoepfe);
  const ober = e.empfehlung?.obergrenzeSamen ?? OBERGRENZE_OHNE_EMPFEHLUNG;
  const begrenzen = (m: number) => (e.direktsaat ? z : Math.min(e.platzzahl, Math.max(z, m)));
  if (e.p === undefined) {
    const s = Math.max(1, e.empfehlung?.samenJeSchwamm ?? 1);
    return { samenJeSchwamm: s, schwaemme: begrenzen(z + 1), schwammKeimrate: undefined };
  }
  const p = e.p;
  const s =
    e.empfehlung && e.empfehlung.pflanzenStehenLassen > 1
      ? e.empfehlung.samenJeSchwamm
      : Math.max(1, Math.min(aufrunden(Math.log(0.1) / Math.log(1 - p)), ober));
  const q = 1 - (1 - p) ** s;
  const m = q >= 0.99 ? z : aufrunden(z / q);
  return { samenJeSchwamm: s, schwaemme: begrenzen(m), schwammKeimrate: q };
}

// ---------------------------------------------------------------------------------------------------------------
// Keimrate nach der Keimprüfung (R12.2; Plan 24)

export interface GeglaetteteKeimrate {
  /** geglättete Rate, begrenzt 0.3 bis 0.98; ohne Basis und unter 10 Samen nicht bestimmt */
  p: number | undefined;
  /** gekeimt / gesät, nur bei gesät > 0 */
  roh: number | undefined;
  herkunft: Keimrate['herkunft'] | undefined;
  /** «Saatgut prüfen»: mindestens 10 Samen und Rohrate unter 0.5 */
  saatgutPruefen: boolean;
}

const begrenzt = (p: number) => Math.min(P_MAX, Math.max(P_MIN, p));
const ROHRATE_PRUEFEN = 0.5;

/**
 * R12.2: ab 10 gesäten Samen p = (gekeimt + 10 · p_Basis) / (gesät + 10), p_Basis = Packungsangabe, sonst Standard
 * der Art; darunter p = p_Basis. Begrenzt auf 0.3 bis 0.98, keine Division durch null.
 */
export function keimrateGeglaettet(e: {
  gesaet: number;
  gekeimt: number;
  pPackung?: number | null;
  pArt?: number | null;
}): GeglaetteteKeimrate {
  const packung = e.pPackung ?? undefined;
  const art = e.pArt ?? undefined;
  const basis = packung ?? art;
  const herkunftBasis = packung !== undefined ? 'packung' : art !== undefined ? 'art' : undefined;
  const roh = e.gesaet > 0 ? e.gekeimt / e.gesaet : undefined;
  const saatgutPruefen = e.gesaet >= BEOBACHTET_AB && roh !== undefined && roh < ROHRATE_PRUEFEN;
  if (basis === undefined) return { p: undefined, roh, herkunft: undefined, saatgutPruefen };
  if (e.gesaet >= BEOBACHTET_AB)
    return {
      p: begrenzt((e.gekeimt + BEOBACHTET_AB * basis) / (e.gesaet + BEOBACHTET_AB)),
      roh,
      herkunft: 'beobachtet',
      saatgutPruefen,
    };
  return { p: begrenzt(basis), roh, herkunft: herkunftBasis, saatgutPruefen };
}

interface KeimEreignis {
  id: string;
  typ: string;
  pflanzung_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}
interface PflanzungZeile {
  id: string;
  satz_id: string;
}
interface SatzOrtZeile {
  id: string;
  saatgut_id: string | null;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
}

/** nicht stornierte Keimungen aus dem Bündelteil ereignis_pflanzung plus die neuen Schritte eines Vorgangs */
export function keimungenMit(teile: Teile, neu?: Vorgang): KeimEreignis[] {
  const alt = zeilen<KeimEreignis>(teile, 'ereignis_pflanzung').filter(
    (e) => e.typ === 'keimung' && (e.storniert_am ?? null) === null && !!e.pflanzung_id,
  );
  const dazu = (neu ?? [])
    .filter((s) => s.art === 'neu' && s.tabelle === 'ereignis' && s.felder['typ'] === 'keimung')
    .map((s) => (s as { felder: Record<string, unknown> }).felder as unknown as KeimEreignis);
  return [...alt, ...dazu];
}

/**
 * Keimbilanz einer Packung wie v_keimrate: je Pflanzung die jüngste nicht stornierte Keimung, nur mit eingehaltener
 * Keimtemperatur, nur Sätze in Anlagen mit Datenart echt (G5), Packung = satz.saatgut_id. `neu` zählt mit, damit die
 * Maske die Rate gleich nach dem Speichern zeigt (A6).
 */
export function keimbilanz(
  teile: Teile,
  saatgutId: string,
  neu?: Vorgang,
): { gesaet: number; gekeimt: number } {
  const pflanzungen = new Map(zeilen<PflanzungZeile>(teile, 'pflanzung').map((p) => [p.id, p]));
  const saetze = new Map(zeilen<SatzOrtZeile>(teile, 'satz').map((s) => [s.id, s]));
  const plaetze = new Map(
    zeilen<{ id: string; anlage_id: string }>(teile, 'platz').map((p) => [p.id, p.anlage_id]),
  );
  const echt = new Set(
    zeilen<{ id: string; datenart: string }>(teile, 'anlage')
      .filter((a) => a.datenart === 'echt')
      .map((a) => a.id),
  );
  // jüngste je Pflanzung; bei gleichem gilt_ab gilt die später gelesene (neue Schritte zuletzt), v_keimrate zählt
  // dann beide (Plan 24 A23, praktisch nicht erreichbar)
  const juengste = new Map<string, KeimEreignis>();
  for (const k of keimungenMit(teile, neu)) {
    const id = k.pflanzung_id as string;
    const bisher = juengste.get(id);
    if (!bisher || Date.parse(k.gilt_ab) >= Date.parse(bisher.gilt_ab)) juengste.set(id, k);
  }
  let gesaet = 0;
  let gekeimt = 0;
  for (const [pflanzungId, k] of juengste) {
    const d = k.daten ?? {};
    if (d['keimtemp_eingehalten'] !== true) continue;
    const satz = saetze.get(pflanzungen.get(pflanzungId)?.satz_id ?? '');
    if (!satz || satz.saatgut_id !== saatgutId) continue;
    const anlage = plaetze.get(satz.anzuchtort_platz_id ?? satz.direktsaat_platz_id ?? '');
    if (!anlage || !echt.has(anlage)) continue;
    gesaet += Number(d['samen_gesaet'] ?? 0);
    gekeimt += Number(d['samen_gekeimt'] ?? 0);
  }
  return { gesaet, gekeimt };
}
