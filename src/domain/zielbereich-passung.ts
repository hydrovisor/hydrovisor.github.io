// Zielbereich für den Zweck «Passung» (Konzept R2.2 Zeile Passung, R3.1, R3.2; Plan 36) und Band-Hilfen in Hundertsteln
// (R10.1). Rein: Teile des Bündels, «jetzt» und die Zeitzone als Parameter. Zählend sind die stehenden und alle
// reservierten Pflanzungen mit ihrer Phase am Stichtag (phaseAm); Direktsaat rechnet in Wachstum (A1).
import { inHundertstel, type Band } from './bewertung/bewertung.ts';
import { phaseAm } from './phasen/prognose.ts';
import type { Teile } from './teile.ts';
import type { Zeitzone } from './zeit.ts';
import {
  reservierteImGefaess,
  schnittmenge,
  zaehlendePflanzungen,
  type Schnittmenge,
  type ZaehlendePflanzung,
} from './zielbereich.ts';

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => String(x ?? '');

/** Mindestbreite pH 0.3 (R3.2 P2) */
export const MINDESTBREITE_PH = 30;
/** Standard-Unsicherheit EC 0.10 ohne Gerät (G6) */
const U_EC_STANDARD = 10;

/** Schnittmenge zweier Bänder; fehlt eines, undefined. Leer heisst min > max */
export function bandSchnitt(a: Band | undefined, b: Band | undefined): Band | undefined {
  if (!a || !b) return undefined;
  return { min: Math.max(a.min, b.min), max: Math.min(a.max, b.max) };
}

export function istLeer(b: Band): boolean {
  return b.min > b.max;
}

export function restbreite(b: Band): number {
  return Math.max(0, b.max - b.min);
}

export function bandmitte(b: Band): number {
  return Math.round((b.min + b.max) / 2);
}

/** EC-Mindestbreite max(0.3, 2 · u_EC) (R3.2 P2) */
export function mindestbreiteEc(uEc: number): number {
  return Math.max(30, 2 * uEc);
}

/** u_EC des ersten nicht stornierten Messgeräts (Konzept 5.6), sonst 0.10 (G6) */
export function uEcVon(teile: Teile): number {
  const g = teil(teile, 'messgeraet').find((m) => (m['storniert_am'] ?? null) === null);
  return g ? inHundertstel(g['u_ec'] as number | string) : U_EC_STANDARD;
}

export interface ZielbereichPassung {
  platzId: string;
  stichtag: string;
  zaehlende: ZaehlendePflanzung[];
  schnittmenge: Schnittmenge;
}

/** stehende und alle reservierten mit Phase am Stichtag; `ohne` nimmt Pflanzungen heraus (R2.2 Zweck Passung) */
export function zaehlendeFuerPassung(
  teile: Teile,
  platzId: string,
  stichtag: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  ohne: readonly string[] = [],
): ZaehlendePflanzung[] {
  const platz = teil(teile, 'platz').find((p) => p['id'] === platzId);
  if (platz?.['rolle'] !== 'gefaess') return [];
  const da = zaehlendePflanzungen(teile, platzId, 'bewertung', jetzt, zeitzone);
  const ids = new Set(da.map((p) => p.pflanzungId));
  const alle = [...da, ...reservierteImGefaess(teile, platzId).filter((p) => !ids.has(p.pflanzungId))];
  const saetze = new Map(teil(teile, 'satz').map((s) => [text(s['id']), s]));
  const raus = new Set(ohne);
  return alle
    .filter((p) => !raus.has(p.pflanzungId))
    .map((p) => {
      if (p.rolle === 'gesaet') return { ...p, phase: 'wachstum' as const };
      const satz = saetze.get(p.satzId) as Zeile;
      const phase = phaseAm(
        teile,
        {
          satzId: p.satzId,
          sorteId: p.sorteId,
          kulturform: p.kulturform,
          saatdatum: text(satz['saatdatum']),
          direktsaat: false,
        },
        stichtag,
        jetzt,
        zeitzone,
      );
      return { ...p, phase };
    });
}

/** Zielbereich des Gefässes am Stichtag: Schnittmenge der zählenden (R2.1) */
export function zielbereichPassung(
  teile: Teile,
  platzId: string,
  stichtag: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  ohne: readonly string[] = [],
): ZielbereichPassung {
  const zaehlende = zaehlendeFuerPassung(teile, platzId, stichtag, jetzt, zeitzone, ohne);
  return { platzId, stichtag, zaehlende, schnittmenge: schnittmenge(teile, platzId, zaehlende) };
}
