// Teile für «Satz duplizieren» (Plan 25 Testliste): Regal R und Wissen aus tests/fixtures/saeen.ts (ohne den Satz in
// 2.3), dazu art_kulturform in Bündelform und Hilfen für Sätze, Pflanzungen, v_pflanzung_zustand und
// v_reservierung_aktiv. Uhr W4: 2027-02-18T08:00:00Z. Gemeinsam für Unit und E2E; die Fixtures regal.ts und saeen.ts
// bleiben unverändert. Ohne Personendaten.
//
// Werte, auf die die Tests rechnen:
// - Salat (lactuca_sativa): «Umsetzen ab» hier 14 Tage (saeen.ts: 21), damit ein Duplikat vom 18.2. am 4.3. umsetzt
//   (Konzept 14.1: Folgesatz Lollo Rossa, Löcher frei ab 4.3.).
// - art_kulturform Salat: kopf einmalig, Ernte ab 28 d (ab Umsetzen), Kulturdauer max. 70, typisch 49;
//   schnitt mehrfach, Ernte ab 21, max. 56, typisch 56 (Standzeit 56 − 14 = 42 Tage, R11.3: 6 × 14 / 42 = 2);
//   babyleaf einmalig, Ernte ab 21, max. 35, typisch 28.
// - Rucola (eruca_vesicaria, Umsetzen ab 14): babyleaf einmalig, Ernte ab 35 (bei Direktsaat ab Saat), max. 42,
//   typisch 35.
// - Petersilie schnitt mehrfach, Ernte ab 60, max. 365, typisch 180. Tomate und Chili ohne Zeile (Ende unbekannt).
import { netztopfId, platzId, uid, type Teile } from './regal.ts';
import { reservierung, saatTeile } from './saeen.ts';

type Zeile = Record<string, unknown>;

export const JETZT_W4 = new Date('2027-02-18T08:00:00Z');

const ART_KULTURFORM: [string, string, 'einmalig' | 'mehrfach', number, number, number][] = [
  // art_id, kulturform, ernteart, ernte_ab_d, kulturdauer_max_d, kulturdauer_typisch_d
  ['lactuca_sativa', 'kopf', 'einmalig', 28, 70, 49],
  ['lactuca_sativa', 'schnitt', 'mehrfach', 21, 56, 56],
  ['lactuca_sativa', 'babyleaf', 'einmalig', 21, 35, 28],
  ['eruca_vesicaria', 'babyleaf', 'einmalig', 35, 42, 35],
  ['petroselinum_crispum', 'schnitt', 'mehrfach', 60, 365, 180],
];

/** Regal R zum Duplizieren am 18.2.2027: kein Satz, alle Töpfe frei, Salat mit Umsetzen ab 14 Tagen */
export function duplizierTeile(jetzt = JETZT_W4): Teile {
  const t = saatTeile(jetzt, { ohneSatzIn23: true });
  for (const a of t['art'] ?? []) if (a['art_id'] === 'lactuca_sativa') a['umsetzen_ab_d'] = 14;
  t['art_kulturform'] = ART_KULTURFORM.map(([art, form, ernteart, ab, max, typisch], i) => ({
    id: uid('37', i + 1),
    art_id: art,
    kulturform: form,
    ernteart,
    ernte_ab_d: ab,
    ernteintervall_d: ernteart === 'mehrfach' ? 7 : null,
    schnitte_max: null,
    kulturdauer_max_d: max,
    kulturdauer_typisch_d: typisch,
    entspitzen: false,
    gueltig_bis: null,
  }));
  return t;
}

/** Felder einer art_kulturform-Zeile ändern; `null` entfernt die Zeile */
export function kulturformSetzen(t: Teile, artId: string, kulturform: string, felder: Zeile | null): void {
  const alle = t['art_kulturform'] ?? [];
  if (felder === null) {
    t['art_kulturform'] = alle.filter((z) => !(z['art_id'] === artId && z['kulturform'] === kulturform));
    return;
  }
  for (const z of alle) if (z['art_id'] === artId && z['kulturform'] === kulturform) Object.assign(z, felder);
}

/** Feld der Art ändern (z. B. umsetzen_ab_d) */
export function artSetzen(t: Teile, artId: string, felder: Zeile): void {
  for (const a of t['art'] ?? []) if (a['art_id'] === artId) Object.assign(a, felder);
}

export const satzId = (nr: number) => uid('27', nr);
export const pflanzungId = (satzNr: number, k: number) => uid('28', satzNr * 100 + k);

export interface SatzDef {
  nr: number;
  sorteId: string;
  kulturform: string;
  saatdatum: string;
  /** Kennung der Anzuchtbox (Vorgabe A1), ausser bei Direktsaat */
  box?: string;
  /** Kennung des Direktsaat-Gefässes; dann ohne Box */
  direktsaat?: string;
  /** platz_id direkt (andere Anlage) */
  direktsaatPlatzId?: string;
  samen?: number;
  schwaemme?: number;
  giltAb?: string;
  storniert?: string;
}

/** Satz wie eine Zeile der Tabelle satz */
export function satzAnlegen(t: Teile, d: SatzDef): string {
  const id = satzId(d.nr);
  const direkt = d.direktsaatPlatzId ?? (d.direktsaat ? platzId(d.direktsaat) : null);
  (t['satz'] ??= []).push({
    id,
    client_id: id,
    sorte_id: d.sorteId,
    saatgut_id: null,
    kulturform: d.kulturform,
    anzuchtort_platz_id: direkt ? null : platzId(d.box ?? 'A1'),
    direktsaat_platz_id: direkt,
    anzahl_schwaemme: d.schwaemme ?? 2,
    samen_je_schwamm: d.samen ?? 1,
    schwaemme_vorschlag: null,
    samen_vorschlag: null,
    kopiert_von: null,
    saatdatum: d.saatdatum,
    gilt_ab: d.giltAb ?? `${d.saatdatum}T11:00:00.000Z`,
    storniert_am: d.storniert ?? null,
  });
  return id;
}

export interface PflanzungDef {
  /** Topf, in dem die Pflanzung steht oder stand (Kennung «2.3.1»): netztopf_id, platz_id und loch_nr */
  topf?: string;
  /** Loch einer Station ohne Netztopf, z. B. ['4.4', 1] (Phase Anzucht) */
  station?: [string, number];
  status?: string;
  phase?: string;
}

/**
 * Pflanzung k eines Satzes mit Zeile in pflanzung und v_pflanzung_zustand; ohne topf und station in der Box
 * (kein Ort, Phase Keimung).
 */
export function pflanzungAnlegen(t: Teile, satzNr: number, k: number, d: PflanzungDef = {}): string {
  const id = pflanzungId(satzNr, k);
  const satz = (t['satz'] ?? []).find((s) => s['id'] === satzId(satzNr));
  const gilt = String(satz?.['gilt_ab'] ?? '2027-01-01T11:00:00.000Z');
  (t['pflanzung'] ??= []).push({
    id,
    client_id: id,
    satz_id: satzId(satzNr),
    gilt_ab: gilt,
    storniert_am: null,
  });
  const ort = d.topf
    ? {
        netztopf_id: netztopfId(d.topf),
        platz_id: platzId(d.topf.split('.').slice(0, 2).join('.')),
        loch_nr: Number(d.topf.split('.')[2]),
      }
    : d.station
      ? { netztopf_id: null, platz_id: platzId(d.station[0]), loch_nr: d.station[1] }
      : { netztopf_id: null, platz_id: null, loch_nr: null };
  (t['v_pflanzung_zustand'] ??= []).push({
    pflanzung_id: id,
    satz_id: satzId(satzNr),
    phase: d.phase ?? (d.topf ? 'wachstum' : d.station ? 'anzucht' : 'keimung'),
    phase_seit: gilt,
    status: d.status ?? 'aktiv',
    ...ort,
  });
  return id;
}

/** aktive Reservierung (Zeile aus v_reservierung_aktiv) der Pflanzung auf den Topf mit Kennung */
export function reservieren(
  t: Teile,
  nr: number,
  pflanzung: string,
  topf: string,
  vorgabe: string,
  geplant?: string,
): void {
  reservierung(t, {
    nr,
    pflanzungId: pflanzung,
    netztopfId: netztopfId(topf),
    vorgabe,
    ...(geplant ? { geplant } : {}),
  });
}

/** Ochsenherz (Tomate, ohne art_kulturform: Ende unbekannt) in den Töpfen; nie frei */
export function dauerhaftBelegen(t: Teile, satzNr: number, sorteId: string, toepfe: string[]): void {
  satzAnlegen(t, {
    nr: satzNr,
    sorteId,
    kulturform: 'dauerkultur_frucht',
    saatdatum: '2026-12-01',
    schwaemme: toepfe.length,
  });
  toepfe.forEach((topf, i) => pflanzungAnlegen(t, satzNr, i + 1, { topf }));
}

/** alle Topfkennungen eines Gefässes mit Loch 1 bis n */
export const toepfeVon = (gefaess: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${gefaess}.${i + 1}`);
