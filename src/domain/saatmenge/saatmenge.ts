// Saatmenge und Keimrate (R12.1, R12.2; Plan 23). Rein: Teile aus dem Bündel, keine Uhr.
import { zeilen, type Teile } from '../anlage/teile.ts';

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
