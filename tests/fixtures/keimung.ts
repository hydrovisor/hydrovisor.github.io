// Teile für «Keimung prüfen» (Plan 24 Testliste): Regal R mit Wissen aus tests/fixtures/saeen.ts (ohne den Satz in 2.3),
// dazu Sätze in einer Box oder als Direktsaat mit Pflanzungen, Reservierungen (Tabelle reservierung und Sicht) und
// Ereignissen an den Pflanzungen. Die Sichten rechnet pflanzSichtenNachrechnen() aus tests/fixtures/sichten.ts nach.
// Gemeinsam für Unit und E2E. Ohne Personendaten.
//
// Werte, auf die die Tests rechnen:
// - Uhr 2027-01-11T08:00:00Z (Zürich 11.1. 09:00), Satz Lollo Rossa (Salat, 5 cm auf der Station, Keimdauer 2/4/7)
//   in A1, gesät 7.1. (Tag 4), 6 Schwämme à 2 Samen, Packung P1 mit Keimfähigkeit 0.85.
// - Zieltöpfe 2.3.1 bis 2.3.5 an den Pflanzungen 1 bis 5 (Schwamm 1 bis 5), Pflanzung 6 ist Reserve (Schwamm 6).
// - zweite Packung P2 derselben Sorte mit 0.6 für einen zweiten Satz (UC6-AK10).
import { netztopfId, platzId, uid, type Teile } from './regal.ts';
import { saatTeile, SORTE } from './saeen.ts';
import { pflanzSichtenNachrechnen } from './sichten.ts';

const o = { storniert_am: null };

export const KEIM_JETZT = new Date('2027-01-11T08:00:00Z');
export const KEIM_SAAT = '2027-01-07';
const SAAT_GILT = '2027-01-07T11:00:00.000Z';

/** Packungen der Keimtests: P1 (0.85) und P2 (0.6), beide Lollo Rossa */
export const KEIM_PACKUNG = { p1: uid('29', 21), p2: uid('29', 22) } as const;

/** Satz-Nummern: 80 = Satz der Keimtests, 81 = zweiter Satz */
export const KEIM_SATZ = uid('27', 80);
export const KEIM_SATZ_2 = uid('27', 81);

/** Pflanzung i (1 bis m) des Satzes mit der Nummer satzNr */
export const pflanzungId = (satzNr: number, i: number) => uid('28', satzNr * 100 + i);
/** Pflanzungen des Satzes der Keimtests: P[1] bis P[6] */
export const P = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => pflanzungId(80, i));
/** Reservierung k (1 bis Z) des Satzes */
export const reservierungId = (satzNr: number, k: number) => uid('30', satzNr * 100 + k);

export interface SatzDef {
  nr: number;
  sorteId?: string;
  saatgutId?: string | null;
  kulturform?: string;
  /** Box (Kennung), wenn nicht Direktsaat */
  box?: string;
  /** Kennung des Direktsaat-Gefässes */
  direktsaat?: string;
  schwaemme: number;
  samen: number;
  saatdatum?: string;
  /** Zieltöpfe nach Kennung, in der Reihenfolge der Pflanzungen 1, 2, … */
  zieltoepfe?: string[];
  /** Zuordnung Pflanzung (1-basiert) → Zieltopf, statt der Reihenfolge */
  zuordnung?: [number, string][];
}

/** Satz mit Pflanzungen und Reservierungen (Tabelle reservierung) anlegen; gibt die Pflanzungs-IDs zurück */
export function satzAnlegen(t: Teile, s: SatzDef): string[] {
  const satzId = uid('27', s.nr);
  const saatdatum = s.saatdatum ?? KEIM_SAAT;
  const gilt = saatdatum === KEIM_SAAT ? SAAT_GILT : `${saatdatum}T11:00:00.000Z`;
  (t['satz'] ??= []).push({
    id: satzId,
    client_id: satzId,
    sorte_id: s.sorteId ?? SORTE.lollo,
    saatgut_id: s.saatgutId === undefined ? KEIM_PACKUNG.p1 : s.saatgutId,
    kulturform: s.kulturform ?? 'kopf',
    anzuchtort_platz_id: s.direktsaat ? null : platzId(s.box ?? 'A1'),
    direktsaat_platz_id: s.direktsaat ? platzId(s.direktsaat) : null,
    anzahl_schwaemme: s.schwaemme,
    samen_je_schwamm: s.samen,
    saatdatum,
    gilt_ab: gilt,
    client_zeit: gilt,
    erfasst_am: gilt,
    ...o,
  });
  const ids = Array.from({ length: s.schwaemme }, (_, i) => pflanzungId(s.nr, i + 1));
  for (const id of ids)
    (t['pflanzung'] ??= []).push({
      id,
      client_id: id,
      satz_id: satzId,
      gilt_ab: gilt,
      client_zeit: gilt,
      ...o,
    });
  const zuordnung: [number, string][] = s.zuordnung ?? (s.zieltoepfe ?? []).map((k, i) => [i + 1, k]);
  zuordnung.forEach(([nr, kennung], k) => {
    const id = reservierungId(s.nr, k + 1);
    const vorgabe = s.direktsaat ? saatdatum : '2027-01-28';
    (t['reservierung'] ??= []).push({
      id,
      client_id: id,
      pflanzung_id: pflanzungId(s.nr, nr),
      netztopf_id: netztopfId(kennung),
      umsetzen_vorgabe_am: vorgabe,
      umsetzen_geplant_am: vorgabe,
      gilt_ab: gilt,
      ...o,
    });
  });
  return ids;
}

let ereignisNr = 0;
/** Ereignis an einer Pflanzung (Tabelle ereignis); danach pflanzSichtenNachrechnen() aufrufen */
export function ereignisDazu(
  t: Teile,
  e: { typ: string; pflanzungId: string; daten: Record<string, unknown>; giltAb: string; id?: string },
): string {
  ereignisNr += 1;
  const id = e.id ?? uid('3e', ereignisNr);
  (t['ereignis'] ??= []).push({
    id,
    client_id: id,
    typ: e.typ,
    pflanzung_id: e.pflanzungId,
    daten: e.daten,
    gilt_ab: e.giltAb,
    ...o,
  });
  return id;
}

/** Keimung wie aus einer früheren Prüfung */
export function keimungDazu(
  t: Teile,
  pflanzung: string,
  e: { gekeimt: number; gesaet?: number; keimtemp?: boolean; giltAb: string; id?: string },
): string {
  return ereignisDazu(t, {
    typ: 'keimung',
    pflanzungId: pflanzung,
    daten: {
      samen_gesaet: e.gesaet ?? 2,
      samen_gekeimt: e.gekeimt,
      keimtemp_eingehalten: e.keimtemp ?? true,
    },
    giltAb: e.giltAb,
    ...(e.id ? { id: e.id } : {}),
  });
}

/**
 * Regal R mit dem Satz der Keimtests. Optionen: andere Zieltöpfe, Datenart der Anlage R, Direktsaat in 3.1
 * (4 Schwämme à 2 Samen, Zieltöpfe 3.1.1 bis 3.1.4), zweiter Satz (Nr. 81, Packung P2, 6 Schwämme à 2 ohne Zieltopf).
 */
export function keimTeile(
  e: {
    zieltoepfe?: string[];
    datenart?: 'echt' | 'demo' | 'test';
    direktsaat?: boolean;
    zweiterSatz?: boolean;
    jetzt?: Date;
  } = {},
): Teile {
  const t = saatTeile(e.jetzt ?? KEIM_JETZT, { ohneSatzIn23: true });
  if (e.datenart) for (const a of t['anlage'] ?? []) a['datenart'] = e.datenart;
  t['saatgut'] = [
    ...(t['saatgut'] ?? []),
    ...[
      [KEIM_PACKUNG.p1, 0.85],
      [KEIM_PACKUNG.p2, 0.6],
    ].map(([id, p]) => ({
      id,
      client_id: id,
      sorte_id: SORTE.lollo,
      kaufdatum: '2026-10-01',
      bestand_korn: 100,
      keimfaehigkeit_packung: p,
      erfasst_am: '2026-10-01T10:00:00Z',
      ...o,
    })),
  ];
  t['reservierung'] = [];
  t['ereignis_pflanzung'] = [];
  if (e.direktsaat)
    satzAnlegen(t, {
      nr: 80,
      direktsaat: '3.1',
      schwaemme: 4,
      samen: 2,
      zieltoepfe: ['3.1.1', '3.1.2', '3.1.3', '3.1.4'],
    });
  else
    satzAnlegen(t, {
      nr: 80,
      box: 'A1',
      schwaemme: 6,
      samen: 2,
      zieltoepfe: e.zieltoepfe ?? ['2.3.1', '2.3.2', '2.3.3', '2.3.4', '2.3.5'],
    });
  if (e.zweiterSatz)
    satzAnlegen(t, { nr: 81, box: 'A1', saatgutId: KEIM_PACKUNG.p2, schwaemme: 6, samen: 2, zieltoepfe: [] });
  return pflanzSichtenNachrechnen(t);
}
