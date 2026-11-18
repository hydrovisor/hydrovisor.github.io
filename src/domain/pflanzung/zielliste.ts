// Zielliste in Säen Schritt 2 (UX6, #228, Plan 228, Entscheid 0028): je Zielgefäss das Urteil der bestehenden
// Passung für die gewählten Sorten und die freien Löcher, geordnet nach Urteil; die Vorwahl ist das beste
// empfohlene Ziel. Die Passung selbst (R3.1, R3.2) rechnet unverändert in `sortenPassung()`. Rein, ohne Systemzeit.
import type { Teile } from '../teile.ts';
import { sortenPassung, type SortePassung } from '../passung/kontext.ts';
import { EINSTUFUNG_NAME, type Einstufung } from '../passung/passung.ts';
import type { Kulturform } from '../phasen/profil.ts';
import { tagPlus, type Zeitzone } from '../zeit.ts';
import { zieltoepfe, type SorteWahl, type Zielgefaess } from './saeen.ts';

export interface ZielUrteil {
  ziel: Zielgefaess;
  /** fehlt: keine Sorte gewählt oder Passung für dieses Ziel nicht rechenbar (A3) */
  einstufung?: Einstufung;
  /** «Empfohlen», «Möglich», «Nicht empfohlen» oder «ohne Urteil» */
  wort: string;
  freieLoecher: number;
  /** «4 freie Löcher», «1 freies Loch», «kein freies Loch» */
  freiText: string;
  /** Passung je gewählte Sorte für dieses Ziel (aus sortenPassung) */
  sorten: SortePassung[];
}

export const OHNE_URTEIL = 'ohne Urteil';

const RANG: Readonly<Record<Einstufung, number>> = { empfohlen: 0, moeglich: 1, nicht_empfohlen: 2 };
const OHNE_RANG = 3;

export function freiText(n: number): string {
  return n === 0 ? 'kein freies Loch' : n === 1 ? '1 freies Loch' : `${n} freie Löcher`;
}

function umsetzenAbTage(teile: Teile, artId: string): number | undefined {
  const d = ((teile?.['art'] ?? []) as { art_id: string; umsetzen_ab_d: number | null }[]).find(
    (a) => a.art_id === artId,
  )?.umsetzen_ab_d;
  return d === null || d === undefined ? undefined : Number(d);
}

/** freie passende Töpfe wie «Alle freien wählen»: Anzucht nur 8 cm, Direktsaat jede Grösse (Konzept 5.8, R11.2, A5) */
function freieLoecher(
  teile: Teile,
  ziel: Zielgefaess,
  erste: SorteWahl | undefined,
  saatdatum: string,
): number {
  let umsetzenAm: string | undefined;
  if (erste) {
    if (ziel.direktsaat) umsetzenAm = saatdatum;
    else {
      const ab = umsetzenAbTage(teile, erste.artId);
      umsetzenAm = ab === undefined ? undefined : tagPlus(saatdatum, ab);
    }
  }
  return zieltoepfe(teile, ziel.platzId, new Map(), umsetzenAm, ziel.direktsaat).filter(
    (t) => t.zustand === 'frei' && (ziel.direktsaat || t.groesseMm === 80),
  ).length;
}

/** Ziele mit Urteil, geordnet Empfohlen, Möglich, Nicht empfohlen, ohne Urteil; bei Gleichstand stabil (A4) */
export function zielliste(
  teile: Teile,
  ziele: readonly Zielgefaess[],
  sorten: readonly (SorteWahl & { kulturform: Kulturform })[],
  saatdatum: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): ZielUrteil[] {
  const liste = ziele.map((ziel): ZielUrteil => {
    const passungen =
      sorten.length > 0 ? sortenPassung(teile, sorten, ziel.platzId, saatdatum, jetzt, zeitzone) : [];
    // schlechtestes Urteil der gewählten Sorten (A2); fehlt eine Sorte, gilt das Ziel ohne Urteil
    const vollstaendig = passungen.length === sorten.length && sorten.length > 0;
    const einstufung = vollstaendig
      ? passungen.map((p) => p.passung.einstufung).reduce((a, b) => (RANG[b] > RANG[a] ? b : a))
      : undefined;
    const frei = freieLoecher(teile, ziel, sorten[0], saatdatum);
    return {
      ziel,
      ...(einstufung ? { einstufung } : {}),
      wort: einstufung ? EINSTUFUNG_NAME[einstufung] : OHNE_URTEIL,
      freieLoecher: frei,
      freiText: freiText(frei),
      sorten: passungen,
    };
  });
  const rang = (z: ZielUrteil) => (z.einstufung ? RANG[z.einstufung] : OHNE_RANG);
  return liste
    .map((z, i) => ({ z, i }))
    .sort((a, b) => rang(a.z) - rang(b.z) || a.i - b.i)
    .map((x) => x.z);
}

/** erstes empfohlenes Ziel mit freiem Loch, das weder ruht noch in Prüfung ist (A6); sonst keine Vorwahl */
export function zielVorwahl(liste: readonly ZielUrteil[]): string | undefined {
  return liste.find((z) => z.einstufung === 'empfohlen' && !z.ziel.hinweis && z.freieLoecher > 0)?.ziel
    .platzId;
}
