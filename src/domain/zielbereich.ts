// Zielbereich nach Zweck (Konzept R2.1, R2.2; Plan 34; Fachregeln G1, G2, R10.1). Rein: Teile des Bündels, «jetzt» und
// die Zeitzone als Parameter. Bänder in Hundertsteln wie die Bewertung (pH 6.0 = 600, EC 1.2 = 120, 18 °C = 1800).
// Zwecke (R2.2, A4): Ansatz für Umsetzen vor Direktsaat vor Bewertung (auch Nachfüllen und Wechsel) vor «ohne».
import type { Band } from './bewertung/bewertung.ts';
import { TEMPERATUR_STANDARD } from './bewertung/sollband.ts';
import { PHASE_NAME, PHASEN, type Phase } from './phasen/profil.ts';
import { sollbereich } from './phasen/sollbereich.ts';
import type { Teile } from './teile.ts';
import { kalendertag, tagPlus, tageZwischen, type Zeitzone } from './zeit.ts';

export type Zweck = 'bewertung' | 'umsetzen' | 'direktsaat' | 'ohne';

export interface ZaehlendePflanzung {
  pflanzungId: string;
  satzId: string;
  sorteId: string;
  artId: string;
  kulturform: string;
  phase: Phase;
  rolle: 'stehend' | 'einziehend' | 'gesaet';
  netztopfId?: string;
  umsetzenAm?: string;
}

export type Schnittmenge =
  | {
      art: 'ok';
      ph: Band;
      ec: Band;
      temperatur: Band;
      /** je Grenze die pflanzungId der begrenzenden Pflanzung (R2.5; nur geliefert, nicht angezeigt) */
      begrenzt: { phMin?: string; phMax?: string; ecMin?: string; ecMax?: string };
    }
  | { art: 'leer'; ph?: Band; ec?: Band }
  | { art: 'ohne_band' };

export type Wechsel =
  | { art: 'erster_ansatz' }
  | { art: 'wechsel_vorschlagen'; alterTage: number }
  | { art: 'loesung_bleibt'; alterTage: number };

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const offen = (z: Zeile) => (z['storniert_am'] ?? null) === null;
const aktuell = (z: Zeile) => offen(z) && (z['gueltig_bis'] ?? null) === null;

/** Lösung ab 7 Tagen am Umsetztag wechseln (R2.2 letzte Zeile) */
const WECHSEL_AB_TAGEN = 7;
/** Umsetzen zählt bis heute + 3 (R2.2) */
const UMSETZEN_VORLAUF = 3;

const spaeter = (a: Phase, b: Phase): Phase => (PHASEN.indexOf(a) >= PHASEN.indexOf(b) ? a : b);

function satzKarte(teile: Teile): Map<string, Zeile> {
  return new Map(teil(teile, 'satz').map((s) => [text(s['id']), s]));
}

function artVonSorte(teile: Teile, sorteId: string): string {
  const s = teil(teile, 'sorte').find((x) => (x['sorte_id'] ?? x['id']) === sorteId && aktuell(x));
  return text(s?.['art_id']);
}

function aktiveZustaende(teile: Teile): Zeile[] {
  return teil(teile, 'v_pflanzung_zustand').filter((z) => z['status'] === 'aktiv');
}

function zaehlende(
  teile: Teile,
  z: Zeile,
  satz: Zeile,
  rolle: ZaehlendePflanzung['rolle'],
  phase: Phase,
  extra: { netztopfId?: string; umsetzenAm?: string } = {},
): ZaehlendePflanzung {
  const sorteId = text(satz['sorte_id']);
  const netztopf = extra.netztopfId ?? text(z['netztopf_id']);
  return {
    pflanzungId: text(z['pflanzung_id']),
    satzId: text(satz['id']),
    sorteId,
    artId: artVonSorte(teile, sorteId),
    kulturform: text(satz['kulturform']),
    phase,
    rolle,
    ...(netztopf ? { netztopfId: netztopf } : {}),
    ...(extra.umsetzenAm ? { umsetzenAm: extra.umsetzenAm } : {}),
  };
}

/** stehende am Platz, gesäte über den Direktsaat-Platz; bestätigte Phase heute (wie v_zielbereich) */
function stehende(teile: Teile, platzId: string): ZaehlendePflanzung[] {
  const saetze = satzKarte(teile);
  return aktiveZustaende(teile).flatMap((z) => {
    const satz = saetze.get(text(z['satz_id']));
    if (!satz) return [];
    const platz = (z['platz_id'] ?? null) === null ? satz['direktsaat_platz_id'] : z['platz_id'];
    if (platz !== platzId) return [];
    const rolle = (z['platz_id'] ?? null) === null ? 'gesaet' : 'stehend';
    return [zaehlende(teile, z, satz, rolle, (text(z['phase']) || 'keimung') as Phase)];
  });
}

/** aktive Pflanzungen mit aktiver Reservierung auf einen Topf mit Heimplatz im Gefäss bis heute + 3 (A3, A6) */
function einziehende(teile: Teile, platzId: string, jetzt: Date, zeitzone: Zeitzone): ZaehlendePflanzung[] {
  const bis = tagPlus(kalendertag(jetzt, zeitzone), UMSETZEN_VORLAUF);
  const toepfe = new Map(teil(teile, 'netztopf').map((n) => [text(n['id']), n]));
  const zustand = new Map(aktiveZustaende(teile).map((z) => [text(z['pflanzung_id']), z]));
  const saetze = satzKarte(teile);
  const gesehen = new Set<string>();
  return teil(teile, 'v_reservierung_aktiv').flatMap((r) => {
    if (!offen(r)) return [];
    const topf = toepfe.get(text(r['netztopf_id']));
    if (topf?.['heim_platz_id'] !== platzId) return [];
    const am = text(r['umsetzen_geplant_am']);
    if (!am || am > bis) return [];
    const z = zustand.get(text(r['pflanzung_id']));
    const satz = z ? saetze.get(text(z['satz_id'])) : undefined;
    if (!z || !satz || gesehen.has(text(z['pflanzung_id']))) return [];
    gesehen.add(text(z['pflanzung_id']));
    const phase = spaeter((text(z['phase']) || 'keimung') as Phase, 'anzucht');
    return [
      zaehlende(teile, z, satz, 'einziehend', phase, { netztopfId: text(r['netztopf_id']), umsetzenAm: am }),
    ];
  });
}

/** gültige Neuansätze am Platz (nicht storniert), ohne Rücksicht auf den Status */
function neuansaetze(teile: Teile, platzId: string): Zeile[] {
  return teil(teile, 'naehrloesungsansatz').filter(
    (a) => a['platz_id'] === platzId && a['typ'] === 'neuansatz' && offen(a),
  );
}

/** Direktsaat-Sätze am Platz ohne gültigen Neuansatz seit dem Saattag (A5) */
function direktsaatSaetze(teile: Teile, platzId: string, zeitzone: Zeitzone): Set<string> {
  const ansaetze = neuansaetze(teile, platzId)
    .filter((a) => a['status'] !== 'abgebrochen')
    .map((a) => kalendertag(new Date(text(a['begonnen_am'])), zeitzone));
  return new Set(
    teil(teile, 'satz')
      .filter(
        (s) =>
          s['direktsaat_platz_id'] === platzId &&
          offen(s) &&
          !ansaetze.some((tag) => tag >= text(s['saatdatum'])),
      )
      .map((s) => text(s['id'])),
  );
}

function gesaete(teile: Teile, platzId: string, zeitzone: Zeitzone): ZaehlendePflanzung[] {
  const saetze = direktsaatSaetze(teile, platzId, zeitzone);
  const karte = satzKarte(teile);
  return aktiveZustaende(teile).flatMap((z) => {
    const satz = karte.get(text(z['satz_id']));
    return satz && saetze.has(text(satz['id'])) ? [zaehlende(teile, z, satz, 'gesaet', 'wachstum')] : [];
  });
}

export function ansatzZweck(teile: Teile, platzId: string, jetzt: Date, zeitzone: Zeitzone): Zweck {
  if (einziehende(teile, platzId, jetzt, zeitzone).length > 0) return 'umsetzen';
  if (gesaete(teile, platzId, zeitzone).length > 0) return 'direktsaat';
  if (stehende(teile, platzId).length > 0) return 'bewertung';
  return 'ohne';
}

export function zaehlendePflanzungen(
  teile: Teile,
  platzId: string,
  zweck: Zweck,
  jetzt: Date,
  zeitzone: Zeitzone,
): ZaehlendePflanzung[] {
  if (zweck === 'bewertung') return stehende(teile, platzId);
  if (zweck === 'direktsaat') return gesaete(teile, platzId, zeitzone);
  if (zweck === 'ohne') return [];
  const da = stehende(teile, platzId);
  const ids = new Set(da.map((p) => p.pflanzungId));
  return [...da, ...einziehende(teile, platzId, jetzt, zeitzone).filter((p) => !ids.has(p.pflanzungId))];
}

interface Grenze {
  wert: number;
  von: string;
}

/** Schnittmenge der Bänder (R2.1): Maximum der Minima, Minimum der Maxima; ohne Band grenzt nicht ein (A7) */
function schneiden(baender: readonly { band: Band | undefined; id: string }[]) {
  let min: Grenze | undefined;
  let max: Grenze | undefined;
  for (const { band, id } of baender) {
    if (!band) continue;
    if (!min || band.min > min.wert) min = { wert: band.min, von: id };
    if (!max || band.max < max.wert) max = { wert: band.max, von: id };
  }
  return min && max ? { min, max } : undefined;
}

export function schnittmenge(
  teile: Teile,
  platzId: string,
  zaehlendeListe: readonly ZaehlendePflanzung[],
): Schnittmenge {
  const soll = zaehlendeListe.map((p) => ({
    id: p.pflanzungId,
    s: sollbereich(teile, p.sorteId, p.phase, platzId),
  }));
  const ph = schneiden(soll.map((x) => ({ band: x.s.ph, id: x.id })));
  const ec = schneiden(soll.map((x) => ({ band: x.s.ec, id: x.id })));
  if (!ph || !ec) return { art: 'ohne_band' };
  const phBand = { min: ph.min.wert, max: ph.max.wert };
  const ecBand = { min: ec.min.wert, max: ec.max.wert };
  if (phBand.min > phBand.max || ecBand.min > ecBand.max) return { art: 'leer', ph: phBand, ec: ecBand };
  const temp = schneiden(soll.map((x) => ({ band: x.s.temp, id: x.id })));
  const temperatur =
    temp && temp.min.wert <= temp.max.wert ? { min: temp.min.wert, max: temp.max.wert } : TEMPERATUR_STANDARD;
  return {
    art: 'ok',
    ph: phBand,
    ec: ecBand,
    temperatur,
    begrenzt: { phMin: ph.min.von, phMax: ph.max.von, ecMin: ec.min.von, ecMax: ec.max.von },
  };
}

/** «Gerechnet für» (R2.2, A8) ohne den Vorsatz: «4 × Tomate Blüte, 2 reserviert Basilikum Anzucht» */
export function gerechnetFuerText(teile: Teile, zaehlendeListe: readonly ZaehlendePflanzung[]): string {
  if (zaehlendeListe.length === 0) return 'niemand, Ziel-EC und Stadium von Hand';
  const namen = new Map(
    teil(teile, 'art')
      .filter(aktuell)
      .map((a) => [text(a['art_id']), text(a['name_de'])]),
  );
  const gruppen = new Map<string, { anzahl: number; reserviert: boolean; text: string }>();
  for (const p of zaehlendeListe) {
    const reserviert = p.rolle === 'einziehend';
    const name = namen.get(p.artId) || 'Pflanze';
    const schluessel = `${String(reserviert)}|${name}|${p.phase}`;
    const g = gruppen.get(schluessel) ?? { anzahl: 0, reserviert, text: `${name} ${PHASE_NAME[p.phase]}` };
    g.anzahl += 1;
    gruppen.set(schluessel, g);
  }
  const liste = [...gruppen.values()];
  return [...liste.filter((g) => !g.reserviert), ...liste.filter((g) => g.reserviert)]
    .map((g) => `${String(g.anzahl)} ${g.reserviert ? 'reserviert' : '×'} ${g.text}`)
    .join(', ');
}

/**
 * Wechsel am Umsetztag (R2.2 letzte Zeile, A12): Alter der Lösung in Kalendertagen vom letzten gültigen, nicht
 * abgebrochenen Neuansatz bis zum Umsetztag; ab 7 Tagen wechseln. Ohne Lösung (nie angesetzt oder seither geleert,
 * R5.4) erster Ansatz.
 */
export function wechselAmUmsetztag(
  teile: Teile,
  platzId: string,
  umsetztag: string,
  _jetzt: Date,
  zeitzone: Zeitzone,
): Wechsel {
  const letzter = neuansaetze(teile, platzId)
    // Ansätze bis zum Umsetztag zählen, auch ein schon für später erfasster
    .filter(
      (a) =>
        a['status'] !== 'abgebrochen' && kalendertag(new Date(text(a['begonnen_am'])), zeitzone) <= umsetztag,
    )
    .map((a) => Date.parse(text(a['begonnen_am'])))
    .sort((a, b) => b - a)[0];
  if (letzter === undefined) return { art: 'erster_ansatz' };
  const geleert = teil(teile, 'ereignis_platz').some(
    (e) =>
      e['platz_id'] === platzId &&
      e['typ'] === 'geleert' &&
      offen(e) &&
      Date.parse(text(e['gilt_ab'])) > letzter,
  );
  if (geleert) return { art: 'erster_ansatz' };
  const alterTage = tageZwischen(kalendertag(new Date(letzter), zeitzone), umsetztag);
  return alterTage >= WECHSEL_AB_TAGEN
    ? { art: 'wechsel_vorschlagen', alterTage }
    : { art: 'loesung_bleibt', alterTage };
}
