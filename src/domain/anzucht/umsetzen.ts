// Umsetzen einfach (Plan 33; UC5-AK3, UC5-AK4, UC5-AK7, R6.1, R6.2, R5.2, R8.3): Sämlinge eines Satzes von der Station
// (oder aus der Box) in ihre Zieltöpfe. Rein: `jetzt` und Zeitzone als Parameter, Kalendertage in Zürich (G2). Der
// Vorgang besteht nur aus Ereignissen (ernte, umsetzdatum_geaendert, umsetzen, abschluss) über schreiben().
import { gefaessAm, zeilen, type PlatzZeile, type Teile } from '../anlage/teile.ts';
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import { artDerSorte, umsetzenAbTage } from '../pflanzung/belegung.ts';
import { KULTURFORM_NAME } from '../pflanzung/saeen.ts';
import {
  deckelBelegung,
  istStation,
  lochGroesse,
  pflanzungenImTopf,
  sorteDesSatzes,
  topfOrt,
  type DeckelLoch,
} from '../pflanzung/topf.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen, type Zeitzone } from '../zeit.ts';
import { stationsGroesse } from './kapazitaet.ts';

interface SatzZeile {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  storniert_am: string | null;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
  loch_nr: number | null;
}
interface Ereignis {
  id: string;
  typ: string;
  pflanzung_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am: string | null;
}
interface Reservierung {
  pflanzung_id: string;
  netztopf_id: string;
  umsetzen_geplant_am?: string | null;
  umsetzen_vorgabe_am?: string | null;
}

export interface Saemling {
  pflanzungId: string;
  nr: number;
  ort: { platzId: string; kennung: string; lochNr?: number };
  groesse: 50 | 80;
  zieltopf?: {
    netztopfId: string;
    kennung: string;
    gefaessKennung: string;
    lochNr: number;
    frei: boolean;
    belegtDurch?: { sorte: string; pflanzungIds: string[] };
  };
}

export interface UmsetzAnsicht {
  satzId: string;
  sorte: string;
  kulturform: string;
  saatdatum: string;
  tagSeitSaat: number;
  kopf: string;
  saemlinge: Saemling[];
  /** aktive Schwämme ohne Keimprüfung (nicht auf einer Station) */
  ohneKeimpruefung: number;
  /** Saat + «Umsetzen bis», nur wenn nach heute (R6.2) */
  inStationLassenBis?: string;
  hinweise: string[];
}

export interface UmsetzEingabe {
  satzId: string;
  zuweisung: { pflanzungId: string; netztopfId: string }[];
  abernten: string[];
  inStationLassen: { pflanzungId: string; bis: string }[];
  ueberzaehlig: string[];
}

const offen = <T extends { storniert_am: string | null }>(l: readonly T[]) =>
  l.filter((x) => x.storniert_am === null);
const kennungVon = (teile: Teile, platzId: string | null | undefined) =>
  zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';

/** «Umsetzen bis» der Art in Tagen ab Saat */
function umsetzenBisTage(teile: Teile, artId: string | undefined): number | undefined {
  const w = zeilen<{ art_id: string; umsetzen_bis_d: number | null; gueltig_bis?: string | null }>(
    teile,
    'art',
  ).find((a) => a.art_id === artId && (a.gueltig_bis ?? null) === null)?.umsetzen_bis_d;
  return w === null || w === undefined ? undefined : Number(w);
}

const ereignisseDer = (teile: Teile, pflanzungId: string) =>
  offen(zeilen<Ereignis>(teile, 'ereignis_pflanzung')).filter((e) => e.pflanzung_id === pflanzungId);

function aktiveReservierung(teile: Teile, pflanzungId: string): Reservierung | undefined {
  return zeilen<Reservierung>(teile, 'v_reservierung_aktiv').find((r) => r.pflanzung_id === pflanzungId);
}

/** Zielort eines Topfs: auf der Station sein Heimplatz, sonst wo er steht */
function zielOrt(teile: Teile, netztopfId: string): { platzId: string; lochNr: number } | undefined {
  const o = topfOrt(teile, netztopfId);
  if (!o) return undefined;
  return istStation(teile, o.platzId)
    ? { platzId: o.heimPlatzId, lochNr: o.heimLochNr }
    : { platzId: o.platzId, lochNr: o.lochNr };
}

export function umsetzAnsicht(
  teile: Teile,
  satzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): UmsetzAnsicht | undefined {
  const satz = offen(zeilen<SatzZeile>(teile, 'satz')).find((s) => s.id === satzId);
  if (!satz) return undefined;
  const sorte = sorteDesSatzes(teile, satzId) ?? 'Sorte';
  const artId = artDerSorte(teile, satz.sorte_id);
  const heute = kalendertag(jetzt, zeitzone);
  const tag = tageZwischen(satz.saatdatum, heute);
  const zustand = new Map(zeilen<Zustand>(teile, 'v_pflanzung_zustand').map((z) => [z.pflanzung_id, z]));
  const pflanzungen = offen(
    zeilen<{ id: string; satz_id: string; storniert_am: string | null }>(teile, 'pflanzung'),
  )
    .filter((p) => p.satz_id === satzId)
    .map((p) => p.id)
    .sort();

  const saemlinge: Saemling[] = [];
  let ohneKeimpruefung = 0;
  pflanzungen.forEach((id, i) => {
    const z = zustand.get(id);
    if (!z || z.status !== 'aktiv') return;
    const eigene = ereignisseDer(teile, id);
    if (eigene.some((e) => e.typ === 'umsetzen')) return;
    const keimung = eigene
      .filter((e) => e.typ === 'keimung')
      .sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab))[0];
    const aufStation = z.platz_id !== null && istStation(teile, z.platz_id);
    const gekeimt = keimung ? Number(keimung.daten?.['samen_gekeimt'] ?? 0) > 0 : false;
    if (!aufStation && !gekeimt) {
      if (!keimung) ohneKeimpruefung += 1;
      return;
    }
    const ortId = aufStation ? (z.platz_id as string) : (z.platz_id ?? satz.anzuchtort_platz_id ?? '');
    const s: Saemling = {
      pflanzungId: id,
      nr: i + 1,
      ort: {
        platzId: ortId,
        kennung: kennungVon(teile, ortId),
        ...(aufStation && z.loch_nr !== null ? { lochNr: Number(z.loch_nr) } : {}),
      },
      groesse: aufStation ? (lochGroesse(teile, ortId) ?? 50) : artId ? stationsGroesse(artId) : 50,
    };
    const r = aktiveReservierung(teile, id);
    const ziel = r ? zielOrt(teile, r.netztopf_id) : undefined;
    const topf = r ? topfOrt(teile, r.netztopf_id) : undefined;
    if (r && ziel && topf) {
      const andere = pflanzungenImTopf(teile, r.netztopf_id).filter((p) => p !== id);
      const erster = andere[0];
      const satzAnderer = erster ? zustand.get(erster)?.satz_id : undefined;
      s.zieltopf = {
        netztopfId: r.netztopf_id,
        kennung: topf.kennung,
        gefaessKennung: kennungVon(teile, ziel.platzId),
        lochNr: ziel.lochNr,
        frei: andere.length === 0,
        ...(andere.length > 0
          ? {
              belegtDurch: {
                sorte: (satzAnderer && sorteDesSatzes(teile, satzAnderer)) || 'Sorte',
                pflanzungIds: andere,
              },
            }
          : {}),
      };
    }
    saemlinge.push(s);
  });

  const bisTage = umsetzenBisTage(teile, artId);
  const bis = bisTage !== undefined ? tagPlus(satz.saatdatum, bisTage) : undefined;
  return {
    satzId,
    sorte,
    kulturform: satz.kulturform,
    saatdatum: satz.saatdatum,
    tagSeitSaat: tag,
    kopf: `${sorte} · ${KULTURFORM_NAME[satz.kulturform] ?? satz.kulturform} · gesät ${tagKurz(satz.saatdatum)} · Tag ${String(tag)}`,
    saemlinge,
    ohneKeimpruefung,
    ...(bis && bis > heute ? { inStationLassenBis: bis } : {}),
    hinweise: [],
  };
}

/** «Wie geplant»: jeder Sämling mit freiem Zieltopf in der Folge der Sämlinge */
export function wieGeplant(a: UmsetzAnsicht): UmsetzEingabe {
  return {
    satzId: a.satzId,
    zuweisung: a.saemlinge
      .filter((s) => s.zieltopf?.frei === true)
      .map((s) => ({
        pflanzungId: s.pflanzungId,
        netztopfId: (s.zieltopf as NonNullable<Saemling['zieltopf']>).netztopfId,
      })),
    abernten: [],
    inStationLassen: [],
    ueberzaehlig: [],
  };
}

export type Ziel = DeckelLoch & { nichtWaehlbar?: true; marke?: number };

/** Löcher eines Zielgefässes (R6.2): wählbar = freier 80-mm-Topf, nicht reserviert, Gefäss ohne feste Dosis */
export function umsetzZiele(
  teile: Teile,
  zielPlatzId: string,
  gewaehlt: ReadonlyMap<string, number>,
): Ziel[] {
  const geeignet =
    gefaessAm(teile, zielPlatzId) !== undefined &&
    !istStation(teile, zielPlatzId) &&
    lochGroesse(teile, zielPlatzId) === 80;
  return deckelBelegung(teile, zielPlatzId).map((l) => {
    const marke = l.netztopfId ? gewaehlt.get(l.netztopfId) : undefined;
    const waehlbar = geeignet && l.kennung !== undefined && l.zustand === 'frei';
    return {
      ...l,
      ...(waehlbar ? {} : { nichtWaehlbar: true as const }),
      ...(marke !== undefined ? { marke } : {}),
    };
  });
}

/** die ersten `anzahl` wählbaren Töpfe in Lochfolge */
export function alleFreienWaehlen(ziele: readonly Ziel[], anzahl: number): string[] {
  return ziele
    .filter((l) => !l.nichtWaehlbar && l.netztopfId)
    .slice(0, Math.max(0, anzahl))
    .map((l) => l.netztopfId as string);
}

export function umsetzEingabePruefen(
  teile: Teile,
  e: UmsetzEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): Verstoss[] {
  const a = umsetzAnsicht(teile, e.satzId, jetzt, zeitzone);
  if (!a) return [{ feld: 'satz', grund: 'Satz nicht bekannt' }];
  const v: Verstoss[] = [];
  const saemling = new Map(a.saemlinge.map((s) => [s.pflanzungId, s]));
  const heute = kalendertag(jetzt, zeitzone);
  const toepfe = new Set<string>();
  const verwendet = new Set<string>();
  const nimm = (p: string) => {
    if (!saemling.has(p)) v.push({ feld: 'pflanzung', grund: 'Kein Sämling dieses Satzes' });
    if (verwendet.has(p)) v.push({ feld: 'pflanzung', grund: 'Sämling doppelt' });
    verwendet.add(p);
  };
  for (const z of e.zuweisung) {
    nimm(z.pflanzungId);
    if (toepfe.has(z.netztopfId)) v.push({ feld: 'topf', grund: 'Topf doppelt gewählt' });
    toepfe.add(z.netztopfId);
    const eigen = saemling.get(z.pflanzungId)?.zieltopf?.netztopfId === z.netztopfId;
    const topf = topfOrt(teile, z.netztopfId);
    if (!topf) {
      v.push({ feld: 'topf', grund: 'Topf nicht bekannt' });
      continue;
    }
    const ziel = zielOrt(teile, z.netztopfId);
    if (
      topf.groesseMm !== 80 ||
      !ziel ||
      istStation(teile, ziel.platzId) ||
      lochGroesse(teile, ziel.platzId) !== 80
    )
      v.push({ feld: 'groesse', grund: 'Nur 8-cm-Töpfe in Gefässen ohne feste Dosis' });
    if (!eigen) {
      // fremder Zieltopf: frei, nicht reserviert, nicht abwesend (R6.2, A15)
      if (istStation(teile, topf.platzId))
        v.push({ feld: 'abwesend', grund: 'Topf steht auf einer Station' });
      if (zeilen<Reservierung>(teile, 'v_reservierung_aktiv').some((r) => r.netztopf_id === z.netztopfId))
        v.push({ feld: 'reserviert', grund: 'Topf ist reserviert' });
    }
    const belegt = pflanzungenImTopf(teile, z.netztopfId).filter((p) => p !== z.pflanzungId);
    if (belegt.length > 0 && !e.abernten.includes(z.netztopfId))
      v.push({ feld: 'belegt', grund: 'Zieltopf belegt: erst abernten oder anderes Loch' });
  }
  for (const s of e.inStationLassen) {
    nimm(s.pflanzungId);
    if (!a.inStationLassenBis || s.bis > a.inStationLassenBis || s.bis <= heute)
      v.push({ feld: 'bis', grund: 'In der Station lassen nur ab morgen bis «Umsetzen bis»' });
  }
  for (const p of e.ueberzaehlig) nimm(p);
  for (const t of e.abernten)
    if (!e.zuweisung.some((z) => z.netztopfId === t) || pflanzungenImTopf(teile, t).length === 0)
      v.push({ feld: 'abernten', grund: 'Nur belegte Zieltöpfe abernten' });
  return v;
}

export function umsetzVorgang(
  teile: Teile,
  e: UmsetzEingabe,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  if (umsetzEingabePruefen(teile, e, jetzt, zeitzone).length > 0) return [];
  const a = umsetzAnsicht(teile, e.satzId, jetzt, zeitzone);
  if (!a) return [];
  const iso = jetzt.toISOString();
  const saemling = new Map(a.saemlinge.map((s) => [s.pflanzungId, s]));
  const zeile = (felder: Record<string, unknown>): Schritt => {
    const id = ids();
    return { art: 'neu', tabelle: 'ereignis', felder: { client_id: id, id, gilt_ab: iso, ...felder } };
  };
  const v: Schritt[] = [];
  for (const t of e.abernten)
    for (const p of pflanzungenImTopf(teile, t))
      v.push(zeile({ typ: 'ernte', pflanzung_id: p, daten: { art: 'ab' } }));
  const satz = offen(zeilen<SatzZeile>(teile, 'satz')).find((s) => s.id === e.satzId);
  const vorgabe = () => {
    const ab = satz ? umsetzenAbTage(teile, artDerSorte(teile, satz.sorte_id)) : undefined;
    return satz && ab !== undefined ? tagPlus(satz.saatdatum, ab) : undefined;
  };
  for (const s of e.inStationLassen) {
    const r = aktiveReservierung(teile, s.pflanzungId);
    const von = r?.umsetzen_geplant_am ?? r?.umsetzen_vorgabe_am ?? vorgabe() ?? null;
    v.push(
      zeile({
        typ: 'umsetzdatum_geaendert',
        pflanzung_id: s.pflanzungId,
        daten: { von, nach: s.bis, grund: 'in_station_lassen' },
      }),
    );
  }
  for (const z of e.zuweisung) {
    const s = saemling.get(z.pflanzungId);
    const ziel = zielOrt(teile, z.netztopfId);
    if (!s || !ziel) return [];
    v.push(
      zeile({
        typ: 'umsetzen',
        pflanzung_id: z.pflanzungId,
        netztopf_id: z.netztopfId,
        daten: {
          von_platz_id: s.ort.platzId,
          ...(s.ort.lochNr !== undefined ? { von_loch_nr: s.ort.lochNr } : {}),
          nach_platz_id: ziel.platzId,
          nach_loch_nr: ziel.lochNr,
        },
      }),
    );
  }
  for (const p of e.ueberzaehlig)
    v.push(zeile({ typ: 'abschluss', pflanzung_id: p, daten: { grund: 'ueberzaehlig' } }));
  return v;
}

const HINWEIS_8CM = '8-cm-Topf samt Blähton ins Zielgefäss';
const HINWEIS_5CM = '5-cm-Anzuchttopf mitsamt Schwamm in den 8-cm-Zieltopf mit gespültem Blähton 8 bis 16 mm';
const HINWEIS_DWC = 'DWC-Startstand: Topfboden 1 bis 2 cm im Wasser, 5 bis 7 Tage von oben angiessen';
const HINWEIS_KRATKY_BELUEFTET = 'Kratky belüftet: Topfboden 1 cm eintauchen';
const HINWEIS_KRATKY = 'Kratky: Topfboden 1 cm eintauchen';

export function umsetzZusammenfassung(
  teile: Teile,
  e: UmsetzEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): { zeilen: string[]; hinweise: string[]; rest?: string; stationLeer?: string; ansatz?: string } {
  const a = umsetzAnsicht(teile, e.satzId, jetzt, zeitzone);
  if (!a) return { zeilen: [], hinweise: [] };
  const saemling = new Map(a.saemlinge.map((s) => [s.pflanzungId, s]));
  const zeilenText: string[] = [];
  const hinweise = new Set<string>();
  const zielgefaesse: string[] = [];
  for (const z of e.zuweisung) {
    const s = saemling.get(z.pflanzungId);
    const topf = topfOrt(teile, z.netztopfId);
    const ziel = zielOrt(teile, z.netztopfId);
    if (!s || !topf || !ziel) continue;
    const von = s.ort.lochNr !== undefined ? `${s.ort.kennung}.${String(s.ort.lochNr)}` : s.ort.kennung;
    zeilenText.push(`${von} → ${topf.kennung}`);
    hinweise.add(s.groesse === 80 ? HINWEIS_8CM : HINWEIS_5CM);
    const g = gefaessAm(teile, ziel.platzId);
    if (g?.betriebsart === 'dwc') hinweise.add(HINWEIS_DWC);
    if (g?.betriebsart === 'kratky_belueftet') hinweise.add(HINWEIS_KRATKY_BELUEFTET);
    if (g?.betriebsart === 'kratky') hinweise.add(HINWEIS_KRATKY);
    if (!zielgefaesse.includes(ziel.platzId)) zielgefaesse.push(ziel.platzId);
  }
  // Rest: Sämlinge ohne Ziel, nicht beendet und nicht in der Station gelassen
  const bewegt = new Set([
    ...e.zuweisung.map((z) => z.pflanzungId),
    ...e.ueberzaehlig,
    ...e.inStationLassen.map((s) => s.pflanzungId),
  ]);
  const rest = a.saemlinge.filter((s) => !bewegt.has(s.pflanzungId));
  const restOrt = rest[0]?.ort.kennung;
  const restText =
    rest.length === 0
      ? undefined
      : rest.length === 1
        ? `In ${restOrt ?? ''} verbleibt 1 Sämling ohne Ziel`
        : `In ${restOrt ?? ''} verbleiben ${String(rest.length)} Sämlinge ohne Ziel`;
  // Station ohne Satz: keine aktive Pflanzung bleibt auf der Station
  const weg = new Set([...e.zuweisung.map((z) => z.pflanzungId), ...e.ueberzaehlig]);
  const stationen = [
    ...new Set(
      a.saemlinge
        .filter((s) => weg.has(s.pflanzungId) && s.ort.lochNr !== undefined)
        .map((s) => s.ort.platzId),
    ),
  ];
  const leer = stationen.find(
    (st) =>
      !zeilen<Zustand>(teile, 'v_pflanzung_zustand').some(
        (z) => z.status === 'aktiv' && z.platz_id === st && !weg.has(z.pflanzung_id),
      ),
  );
  const ansatz = zielgefaesse
    .map(
      (p) =>
        `Ansatz für Umsetzen in ${kennungVon(teile, p)}: Ziel-EC von Hand nach Düngeplan, Stadium 1. echte Blätter`,
    )
    .join(' · ');
  return {
    zeilen: zeilenText,
    hinweise: [...hinweise],
    ...(restText ? { rest: restText } : {}),
    ...(leer ? { stationLeer: `${kennungVon(teile, leer)} ist ohne Satz: leeren` } : {}),
    ...(ansatz ? { ansatz } : {}),
  };
}

export interface UmsetzAufgabe {
  satzId: string;
  text: string;
  ort: string;
  faelligAm: string;
  ueberfaellig: boolean;
  wieGeplant: boolean;
}

/** Aufgabe «Umsetzen» je Satz mit Sämlingen (Übergangsliste bis I1b-02, R5.2): fällig bis heute */
export function umsetzAufgaben(teile: Teile, jetzt: Date, zeitzone: Zeitzone): UmsetzAufgabe[] {
  const heute = kalendertag(jetzt, zeitzone);
  const aufgaben: UmsetzAufgabe[] = [];
  for (const satz of offen(zeilen<SatzZeile>(teile, 'satz'))) {
    if (satz.direktsaat_platz_id) continue;
    const a = umsetzAnsicht(teile, satz.id, jetzt, zeitzone);
    if (!a || a.saemlinge.length === 0) continue;
    const artId = artDerSorte(teile, satz.sorte_id);
    const ab = umsetzenAbTage(teile, artId);
    const vorgabe = ab !== undefined ? tagPlus(satz.saatdatum, ab) : undefined;
    const termine = a.saemlinge
      .map((s) => aktiveReservierung(teile, s.pflanzungId)?.umsetzen_geplant_am ?? vorgabe)
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.slice(0, 10))
      .sort();
    const faelligAm = termine[0];
    if (!faelligAm || faelligAm > heute) continue;
    const bisTage = umsetzenBisTage(teile, artId);
    const ueberfaellig = bisTage !== undefined && heute >= tagPlus(satz.saatdatum, bisTage + 7);
    const station =
      a.saemlinge.find((s) => s.ort.lochNr !== undefined)?.ort.kennung ?? a.saemlinge[0]?.ort.kennung ?? '';
    const ziel = a.saemlinge.find((s) => s.zieltopf)?.zieltopf?.gefaessKennung;
    aufgaben.push({
      satzId: satz.id,
      text: `${ueberfaellig ? 'Umsetzen überfällig' : 'Umsetzen'} · ${a.sorte} · ${station} → ${ziel ?? 'Ziel wählen'}`,
      ort: station,
      faelligAm,
      ueberfaellig,
      wieGeplant: a.saemlinge.some((s) => s.zieltopf?.frei === true),
    });
  }
  return aufgaben.sort((x, y) => x.faelligAm.localeCompare(y.faelligAm) || x.text.localeCompare(y.text));
}
