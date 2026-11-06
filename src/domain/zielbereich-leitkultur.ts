// Leitkultur und Herstellerstadium des Ansatzes (Konzept R2.3, R4.3, R4.5; UC7 Rechenbasis 1; Plan 34). Rein: Teile des
// Bündels, «jetzt» und die Zeitzone als Parameter; Tage als Kalendertage in Zürich (G2).
import { PHASEN, type Phase } from './phasen/profil.ts';
import { herstellerstadium, type Stadium, type StadiumEingabe } from './rechner.ts';
import type { Teile } from './teile.ts';
import { mittag, type Zeitzone } from './zeit.ts';
import {
  ansatzZweck,
  gerechnetFuerText,
  schnittmenge,
  zaehlendePflanzungen,
  type Schnittmenge,
  type Zweck,
  type ZaehlendePflanzung,
} from './zielbereich.ts';

export type Leitkultur =
  | {
      art: 'art';
      artId: string;
      grund: 'einzige' | 'kulturdauer' | 'wasserbedarf' | 'netztoepfe' | 'gewaehlt';
    }
  | { art: 'wahl_noetig'; kandidaten: string[] }
  | { art: 'keine' };

export interface AnsatzGrundlage {
  zweck: Zweck;
  zaehlende: ZaehlendePflanzung[];
  schnittmenge: Schnittmenge;
  leitkultur: Leitkultur;
  stadiumVorschlag?: Stadium;
  gerechnetFuer: string;
  pflanzungIds: string[];
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const offen = (z: Zeile) => (z['storniert_am'] ?? null) === null;
const aktuell = (z: Zeile) => offen(z) && (z['gueltig_bis'] ?? null) === null;
/** fehlender Wert zählt als tiefster (A11) */
const wert = (x: unknown) =>
  x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? -Infinity : Number(x);

/** Arten mit dem höchsten Wert behalten */
function besten(arten: readonly string[], f: (art: string) => number): string[] {
  const werte = arten.map((a) => [a, f(a)] as const);
  const max = Math.max(...werte.map(([, w]) => w));
  return werte.filter(([, w]) => w === max).map(([a]) => a);
}

/** jüngstes gültiges Ereignis leitkultur_gewaehlt am Platz (A9) */
function gewaehlteArt(teile: Teile, platzId: string): string | undefined {
  const e = teil(teile, 'ereignis_platz')
    .filter((x) => x['typ'] === 'leitkultur_gewaehlt' && x['platz_id'] === platzId && offen(x))
    .sort((a, b) => Date.parse(text(b['gilt_ab'])) - Date.parse(text(a['gilt_ab'])))[0];
  const daten = e?.['daten'] as { art_id?: unknown } | undefined;
  return daten ? text(daten.art_id) || undefined : undefined;
}

/**
 * Leitkultur in vier Stufen über alle zählenden (R2.3, A10): längste typische Kulturdauer der Kulturform (mehrere
 * Kulturformen: die längste), höchster Wasserbedarf je Pflanze, meiste Netztöpfe, Tims Wahl am Platz.
 */
export function leitkultur(
  teile: Teile,
  platzId: string,
  zaehlende: readonly ZaehlendePflanzung[],
): Leitkultur {
  const arten = [...new Set(zaehlende.map((p) => p.artId))];
  if (arten.length === 0) return { art: 'keine' };
  if (arten.length === 1) return { art: 'art', artId: arten[0] as string, grund: 'einzige' };
  const kulturformen = teil(teile, 'art_kulturform').filter(aktuell);
  const kulturdauer = (art: string) =>
    Math.max(
      ...[...new Set(zaehlende.filter((p) => p.artId === art).map((p) => p.kulturform))].map((kf) =>
        wert(
          kulturformen.find((k) => k['art_id'] === art && k['kulturform'] === kf)?.['kulturdauer_typisch_d'],
        ),
      ),
    );
  const artZeilen = teil(teile, 'art').filter(aktuell);
  const wasserbedarf = (art: string) =>
    wert(artZeilen.find((a) => a['art_id'] === art)?.['wasserbedarf_je_pflanze_l']);
  const netztoepfe = (art: string) =>
    new Set(zaehlende.filter((p) => p.artId === art).map((p) => p.netztopfId ?? p.pflanzungId)).size;
  let kandidaten = arten;
  for (const [grund, f] of [
    ['kulturdauer', kulturdauer],
    ['wasserbedarf', wasserbedarf],
    ['netztoepfe', netztoepfe],
  ] as const) {
    kandidaten = besten(kandidaten, f);
    if (kandidaten.length === 1) return { art: 'art', artId: kandidaten[0] as string, grund };
  }
  const wahl = gewaehlteArt(teile, platzId);
  return wahl !== undefined && kandidaten.includes(wahl)
    ? { art: 'art', artId: wahl, grund: 'gewaehlt' }
    : { art: 'wahl_noetig', kandidaten };
}

const phaseIndex = (p: Phase) => PHASEN.indexOf(p);
const IN_WACHSTUM = phaseIndex('wachstum');

/** Sätze der Liste, ältester zuerst: frühestes Saatdatum, dann gilt_ab, dann id (A13) */
function saetzeAeltesteZuerst(teile: Teile, liste: readonly ZaehlendePflanzung[]): Zeile[] {
  const ids = new Set(liste.map((p) => p.satzId));
  return teil(teile, 'satz')
    .filter((s) => ids.has(text(s['id'])))
    .sort(
      (a, b) =>
        text(a['saatdatum']).localeCompare(text(b['saatdatum'])) ||
        text(a['gilt_ab']).localeCompare(text(b['gilt_ab'])) ||
        text(a['id']).localeCompare(text(b['id'])),
    );
}

/** späteste Phase der zählenden Pflanzungen eines Satzes */
function phaseVon(liste: readonly ZaehlendePflanzung[], satzId: string): Phase {
  return liste
    .filter((p) => p.satzId === satzId)
    .map((p) => p.phase)
    .reduce((a, b) => (phaseIndex(b) > phaseIndex(a) ? b : a));
}

/** jüngstes gültiges Umsetzen einer Pflanzung des Satzes (Konzept 8.1 Nr. 10) */
function umgesetztAm(teile: Teile, liste: readonly ZaehlendePflanzung[], satzId: string): Date | undefined {
  const pflanzungen = new Set(liste.filter((p) => p.satzId === satzId).map((p) => p.pflanzungId));
  const zeit = teil(teile, 'ereignis_pflanzung')
    .filter((e) => e['typ'] === 'umsetzen' && offen(e) && pflanzungen.has(text(e['pflanzung_id'])))
    .map((e) => Date.parse(text(e['gilt_ab'])))
    .sort((a, b) => b - a)[0];
  return zeit === undefined ? undefined : new Date(zeit);
}

/** frühestes gültiges Verschieben einer Pflanzung des Satzes auf den Platz (Eintritt in die Station, R4.5) */
function eintrittAm(teile: Teile, satz: Zeile, platzId: string): Date | undefined {
  const pflanzungen = new Set(
    teil(teile, 'pflanzung')
      .filter((p) => p['satz_id'] === satz['id'])
      .map((p) => text(p['id'])),
  );
  const zeit = teil(teile, 'ereignis_pflanzung')
    .filter(
      (e) =>
        e['typ'] === 'verschieben' &&
        offen(e) &&
        pflanzungen.has(text(e['pflanzung_id'])) &&
        (e['daten'] as { nach_platz_id?: unknown } | null)?.nach_platz_id === platzId,
    )
    .map((e) => Date.parse(text(e['gilt_ab'])))
    .sort((a, b) => a - b)[0];
  return zeit === undefined ? undefined : new Date(zeit);
}

/**
 * Eingabe für herstellerstadium() (R4.3, R2.3): Anzuchtbox; Station nach dem Eintritt des ältesten Satzes; Direktsaat;
 * sonst der älteste stehende Satz der Leitkultur, «1. echte Blätter» nur ohne Satz der Leitkultur in Wachstum (A14);
 * Ansatz für Umsetzen ohne stehende Leitkultur mit dem Umsetzdatum der einziehenden. Zweck «ohne»: undefined (RF7).
 */
export function stadiumEingabe(
  teile: Teile,
  platzId: string,
  zweck: Zweck,
  leitkulturArtId: string | undefined,
  zaehlende: readonly ZaehlendePflanzung[],
  jetzt: Date,
  zeitzone: Zeitzone,
): StadiumEingabe | undefined {
  const platz = teil(teile, 'platz').find((p) => p['id'] === platzId);
  if (platz?.['rolle'] === 'anzuchtort') return { ort: 'anzuchtbox' };
  if (zweck === 'ohne' || zaehlende.length === 0) return undefined;
  const gefaess = teil(teile, 'gefaess').find((g) => g['platz_id'] === platzId && aktuell(g));
  if (gefaess?.['feste_dosis'] === true) {
    const aeltester = saetzeAeltesteZuerst(teile, zaehlende)[0];
    const eintritt = aeltester ? eintrittAm(teile, aeltester, platzId) : undefined;
    const ersatz = aeltester ? Date.parse(text(aeltester['gilt_ab'])) : Number.NaN;
    return {
      ort: 'station',
      aeltesterEintrittAm: eintritt ?? (Number.isFinite(ersatz) ? new Date(ersatz) : jetzt),
    };
  }
  if (zweck === 'direktsaat') return { ort: 'zielgefaess', direktsaat: true, phaseLeitkultur: 'wachstum' };
  const derLeitkultur = zaehlende.filter((p) => leitkulturArtId === undefined || p.artId === leitkulturArtId);
  const da = derLeitkultur.filter((p) => p.rolle !== 'einziehend');
  if (da.length === 0) {
    const tag = derLeitkultur
      .map((p) => p.umsetzenAm)
      .filter((x): x is string => x !== undefined)
      .sort()[0];
    return tag === undefined
      ? undefined
      : {
          ort: 'zielgefaess',
          direktsaat: false,
          phaseLeitkultur: 'anzucht',
          umgesetztAm: mittag(tag, zeitzone),
        };
  }
  const saetze = saetzeAeltesteZuerst(teile, da);
  const [aeltester, ...uebrige] = saetze as [Zeile, ...Zeile[]];
  const id = text(aeltester['id']);
  const am = umgesetztAm(teile, da, id);
  const eingabe: StadiumEingabe = {
    ort: 'zielgefaess',
    direktsaat: (aeltester['direktsaat_platz_id'] ?? null) !== null,
    phaseLeitkultur: phaseVon(da, id),
    ...(am ? { umgesetztAm: am } : {}),
  };
  if (herstellerstadium(eingabe, jetzt, zeitzone) !== 'echte_blaetter') return eingabe;
  const imWachstum = uebrige.find((s) => phaseIndex(phaseVon(da, text(s['id']))) >= IN_WACHSTUM);
  return imWachstum
    ? {
        ort: 'zielgefaess',
        direktsaat: (imWachstum['direktsaat_platz_id'] ?? null) !== null,
        phaseLeitkultur: phaseVon(da, text(imWachstum['id'])),
      }
    : eingabe;
}

/** Grundlage des Neuansatzes: Zweck, zählende, Schnittmenge, Leitkultur, Stadium-Vorschlag, «Gerechnet für» (R2.5) */
export function ansatzGrundlage(
  teile: Teile,
  platzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): AnsatzGrundlage {
  const zweck = ansatzZweck(teile, platzId, jetzt, zeitzone);
  const zaehlende = zaehlendePflanzungen(teile, platzId, zweck, jetzt, zeitzone);
  const lk = leitkultur(teile, platzId, zaehlende);
  const eingabe = stadiumEingabe(
    teile,
    platzId,
    zweck,
    lk.art === 'art' ? lk.artId : undefined,
    zaehlende,
    jetzt,
    zeitzone,
  );
  const stadium = eingabe ? herstellerstadium(eingabe, jetzt, zeitzone) : undefined;
  return {
    zweck,
    zaehlende,
    schnittmenge: schnittmenge(teile, platzId, zaehlende),
    leitkultur: lk,
    ...(stadium && stadium !== 'anfeuchten' ? { stadiumVorschlag: stadium } : {}),
    gerechnetFuer: gerechnetFuerText(teile, zaehlende),
    pflanzungIds: zaehlende.map((p) => p.pflanzungId),
  };
}
