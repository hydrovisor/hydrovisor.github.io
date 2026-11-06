// Ernte, Kulturende, Schossen und Ausfall (Plan 38; R1.2, R1.7, R5.1, R5.2, A2 bis A9). Rein: jetzt und Zeitzone als
// Parameter, Kalendertage in Zürich (G1, G2). Ereignisse aus den Bündelteilen ereignis_pflanzung (auch kultur_entscheid
// am Satz) und ereignis_satz; Typ und Storno filtert die Domäne selbst.
import { kuerzelVon, ms, zeilen, type Teile } from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import {
  artDerSorte,
  artKulturform,
  kulturEntscheide,
  umsetzTag,
  verlaengerungTage,
  type Ernteart,
} from '../pflanzung/belegung.ts';
import { kalendertag, tagPlus, type Zeitzone } from '../zeit.ts';
import { teileNach } from './ende.ts';
import { PROFILENDE, type Kulturform } from './profil.ts';

/** Verlängerung der Kultur in Tagen (R1.7) */
export const VERLAENGERN_TAGE = 14;

export type SchossenHandlung = 'auskneifen' | 'ernten_beenden' | 'bluete_nutzen';
/** Ursachen für «Ausfall melden» (A9), gehen unverändert in abschluss.text */
export const AUSFALL_URSACHEN = ['Wurzeln', 'Mehltau', 'Tipburn', 'Schädlinge', 'Sonstiges'] as const;
export type AusfallUrsache = (typeof AUSFALL_URSACHEN)[number];

export interface ErnteStand {
  ernteart?: Ernteart;
  /** «Ernte möglich ab»: erster Termin oder letzte Teilernte + Intervall; bleibt stehen, bis geerntet wird */
  moeglichAb?: string;
  teilernten: number;
  schnitteMax?: number;
  kulturEndeAm?: string;
  kulturFrageAm?: string;
  teilernteErlaubt: boolean;
  schossenHandlung?: SchossenHandlung;
}

export interface ErnteAufgabe {
  typ: 'ernte_moeglich' | 'kultur_entscheid';
  satzId: string;
  pflanzungId: string;
  text: string;
  ort: string;
  faelligAm: string;
  schluessel: string;
}

interface Satz {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  storniert_am?: string | null;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
}
interface Ereignis {
  id: string;
  typ: string;
  pflanzung_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}

const zahl = (w: number | string | null | undefined) =>
  w === null || w === undefined ? undefined : Number(w);
const satzVon = (teile: Teile, satzId: string) =>
  zeilen<Satz>(teile, 'satz').find((s) => s.id === satzId && (s.storniert_am ?? null) === null);
const zustandVon = (teile: Teile, pflanzungId: string) =>
  zeilen<Zustand>(teile, 'v_pflanzung_zustand').find((z) => z.pflanzung_id === pflanzungId);
/** aktive Pflanzungen des Satzes nach id */
const aktiveVon = (teile: Teile, satzId: string) =>
  zeilen<Zustand>(teile, 'v_pflanzung_zustand')
    .filter((z) => z.satz_id === satzId && z.status === 'aktiv')
    .sort((a, b) => a.pflanzung_id.localeCompare(b.pflanzung_id));

/** Kalendertage der gültigen Teilernten einer Pflanzung, älteste zuerst */
function teilernteTage(teile: Teile, pflanzungId: string, zeitzone: Zeitzone): string[] {
  return zeilen<Ereignis>(teile, 'ereignis_pflanzung')
    .filter(
      (e) =>
        e.typ === 'ernte' &&
        e.pflanzung_id === pflanzungId &&
        (e.storniert_am ?? null) === null &&
        e.daten?.['art'] === 'teil',
    )
    .sort((a, b) => ms(a.gilt_ab) - ms(b.gilt_ab))
    .map((e) => kalendertag(new Date(e.gilt_ab), zeitzone));
}

function schossenHandlungVon(teile: Teile, artId: string | undefined, kulturform: string) {
  // Blüte ist bei Blattgemüse und Kräutern keine Phase (Profilende Wachstum, A8); Fruchtgemüse nach R1.5
  if ((PROFILENDE[kulturform as Kulturform] ?? 'wachstum') !== 'wachstum') return undefined;
  const h = zeilen<{ art_id: string; schossen_handlung?: string | null; gueltig_bis?: string | null }>(
    teile,
    'art',
  ).find((a) => a.art_id === artId && (a.gueltig_bis ?? null) === null)?.schossen_handlung;
  return h === 'auskneifen' || h === 'ernten_beenden' || h === 'bluete_nutzen' ? h : undefined;
}

/** Kulturfrage des Satzes (R1.7, A6): früherer Tag von Kulturende und erreichten Schnitten; nach Verlängern Tag + tage */
function kulturFrage(
  teile: Teile,
  satz: Satz,
  max: { kulturdauerMax?: number; schnitteMax?: number },
  zeitzone: Zeitzone,
): { endeAm?: string; frageAm?: string } {
  const endeAm =
    max.kulturdauerMax === undefined
      ? undefined
      : tagPlus(satz.saatdatum, max.kulturdauerMax + verlaengerungTage(teile, satz.id));
  const verlaengert = kulturEntscheide(teile, satz.id)
    .filter((e) => e.daten?.['entscheid'] === 'verlaengern')
    .at(-1);
  if (verlaengert)
    return {
      ...(endeAm ? { endeAm } : {}),
      frageAm: tagPlus(
        kalendertag(new Date(verlaengert.gilt_ab), zeitzone),
        Number(verlaengert.daten?.['tage']),
      ),
    };
  const kandidaten: string[] = endeAm ? [endeAm] : [];
  if (max.schnitteMax !== undefined)
    for (const z of aktiveVon(teile, satz.id)) {
      const tag = teilernteTage(teile, z.pflanzung_id, zeitzone)[max.schnitteMax - 1];
      if (tag) kandidaten.push(tag);
    }
  const frageAm = kandidaten.sort()[0];
  return { ...(endeAm ? { endeAm } : {}), ...(frageAm ? { frageAm } : {}) };
}

/**
 * Erntestand einer aktiven Pflanzung (R1.2, R1.7, A4, A5). `neu` (noch nicht gespeichert) wird eingerechnet.
 * undefined: Pflanzung unbekannt oder nicht aktiv.
 */
export function ernteStand(
  teile: Teile,
  pflanzungId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  neu?: Vorgang,
): ErnteStand | undefined {
  const t = neu ? teileNach(teile, neu, jetzt, zeitzone) : teile;
  const z = zustandVon(t, pflanzungId);
  if (!z || z.status !== 'aktiv') return undefined;
  const satz = satzVon(t, z.satz_id);
  if (!satz) return undefined;
  const artId = artDerSorte(t, satz.sorte_id);
  const ak = artKulturform(t, artId, satz.kulturform);
  const ernteart = ak?.ernteart ?? undefined;
  const schossenHandlung = schossenHandlungVon(t, artId, satz.kulturform);
  const teile0 = teilernteTage(t, pflanzungId, zeitzone);
  const stand: ErnteStand = {
    teilernten: teile0.length,
    teilernteErlaubt: ernteart === 'mehrfach',
    ...(schossenHandlung ? { schossenHandlung } : {}),
  };
  if (!ernteart || !ak) return stand;
  stand.ernteart = ernteart;
  const schnitteMax = zahl(ak.schnitte_max);
  if (schnitteMax !== undefined) stand.schnitteMax = schnitteMax;

  // Bezug: Umsetztag; Direktsaat und Keimling ab Saat (A4)
  const bezug =
    satz.direktsaat_platz_id || satz.kulturform === 'keimling'
      ? satz.saatdatum
      : umsetzTag(t, pflanzungId, zeitzone);
  const ab = zahl(ak.ernte_ab_d);
  const intervall = zahl(ak.ernteintervall_d);
  const letzte = teile0.at(-1);
  const moeglichAb =
    ernteart === 'mehrfach' && letzte
      ? intervall === undefined
        ? undefined
        : tagPlus(letzte, intervall)
      : bezug !== undefined && ab !== undefined
        ? tagPlus(bezug, ab)
        : undefined;
  if (moeglichAb) stand.moeglichAb = moeglichAb;

  const kulturdauerMax = zahl(ak.kulturdauer_max_d);
  const frage = kulturFrage(
    t,
    satz,
    {
      ...(kulturdauerMax !== undefined ? { kulturdauerMax } : {}),
      ...(schnitteMax !== undefined ? { schnitteMax } : {}),
    },
    zeitzone,
  );
  if (frage.endeAm) stand.kulturEndeAm = frage.endeAm;
  if (frage.frageAm) stand.kulturFrageAm = frage.frageAm;
  return stand;
}

const neuerSchritt = (id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle: 'ereignis',
  felder: { client_id: id, id, ...felder },
});

/**
 * Teilernte oder Abernten je Pflanzung in der gegebenen Folge (R1.7, A2). Leer, wenn eine Pflanzung nicht aktiv ist
 * oder bei Teilernte ohne Mehrfachernte.
 */
export function ernteVorgang(
  teile: Teile,
  e: { pflanzungIds: readonly string[]; art: 'teil' | 'ab' },
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  if (e.pflanzungIds.length === 0) return [];
  for (const p of e.pflanzungIds) {
    const stand = ernteStand(teile, p, jetzt, zeitzone);
    if (!stand || (e.art === 'teil' && !stand.teilernteErlaubt)) return [];
  }
  return e.pflanzungIds.map((p) =>
    neuerSchritt(ids(), {
      typ: 'ernte',
      pflanzung_id: p,
      gilt_ab: jetzt.toISOString(),
      daten: { art: e.art },
    }),
  );
}

/**
 * «Kultur beenden oder verlängern?» am Satz (R1.7, A6): zuerst kultur_entscheid; bei fälliger Frage mit
 * war_faellig_am und aufgabe_schluessel (R5.1); bei beenden danach ernte ab je aktive Pflanzung nach id, kein
 * abschluss. Satz ohne aktive Pflanzung → leer.
 */
export function kulturEntscheidVorgang(
  teile: Teile,
  satzId: string,
  entscheid: 'beenden' | 'verlaengern',
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  const aktive = aktiveVon(teile, satzId);
  const erste = aktive[0];
  if (!erste) return [];
  const heute = kalendertag(jetzt, zeitzone);
  const frageAm = ernteStand(teile, erste.pflanzung_id, jetzt, zeitzone)?.kulturFrageAm;
  const faellig = frageAm !== undefined && frageAm <= heute;
  const giltAb = jetzt.toISOString();
  const schritte: Schritt[] = [
    neuerSchritt(ids(), {
      typ: 'kultur_entscheid',
      satz_id: satzId,
      gilt_ab: giltAb,
      ...(faellig
        ? { war_faellig_am: frageAm, aufgabe_schluessel: `kultur_entscheid|${satzId}|${frageAm}` }
        : {}),
      daten: entscheid === 'verlaengern' ? { entscheid, tage: VERLAENGERN_TAGE } : { entscheid },
    }),
  ];
  if (entscheid === 'beenden')
    for (const z of aktive)
      schritte.push(
        neuerSchritt(ids(), {
          typ: 'ernte',
          pflanzung_id: z.pflanzung_id,
          gilt_ab: giltAb,
          daten: { art: 'ab' },
        }),
      );
  return schritte;
}

/**
 * «Blüte melden» (R1.7, A7, A8): beobachtung {kategorie: schossen}, dann schossen_handlung {handlung} nach der Art;
 * bei ernten_beenden zuletzt ernte ab. Ohne Handlung → leer.
 */
export function schossenVorgang(
  teile: Teile,
  pflanzungId: string,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  const handlung = ernteStand(teile, pflanzungId, jetzt, zeitzone)?.schossenHandlung;
  if (!handlung) return [];
  const giltAb = jetzt.toISOString();
  const schritte: Schritt[] = [
    neuerSchritt(ids(), {
      typ: 'beobachtung',
      pflanzung_id: pflanzungId,
      gilt_ab: giltAb,
      daten: { kategorie: 'schossen' },
    }),
    neuerSchritt(ids(), {
      typ: 'schossen_handlung',
      pflanzung_id: pflanzungId,
      gilt_ab: giltAb,
      daten: { handlung },
    }),
  ];
  if (handlung === 'ernten_beenden')
    schritte.push(
      neuerSchritt(ids(), { typ: 'ernte', pflanzung_id: pflanzungId, gilt_ab: giltAb, daten: { art: 'ab' } }),
    );
  return schritte;
}

/** «Ausfall melden» (R1.7, A9): abschluss {grund: ausfall, text: Ursache}; nicht aktiv → leer */
export function ausfallVorgang(
  teile: Teile,
  pflanzungId: string,
  ursache: AusfallUrsache | undefined,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  void zeitzone;
  if (zustandVon(teile, pflanzungId)?.status !== 'aktiv') return [];
  return [
    neuerSchritt(ids(), {
      typ: 'abschluss',
      pflanzung_id: pflanzungId,
      gilt_ab: jetzt.toISOString(),
      daten: ursache ? { grund: 'ausfall', text: ursache } : { grund: 'ausfall' },
    }),
  ];
}

/** Code des Platzes mit den meisten aktiven Pflanzungen des Satzes (sonst Direktsaat- bzw. Anzuchtort) */
function ortVon(teile: Teile, satz: Satz, aktive: readonly Zustand[]): string {
  const zaehler = new Map<string, number>();
  for (const z of aktive) {
    const pl = z.platz_id ?? satz.direktsaat_platz_id ?? satz.anzuchtort_platz_id;
    if (pl) zaehler.set(pl, (zaehler.get(pl) ?? 0) + 1);
  }
  const plaetze = zeilen<{ id: string; anlage_id: string; kennung: string }>(teile, 'platz');
  const code = (id: string) => {
    const p = plaetze.find((x) => x.id === id);
    return p ? `${kuerzelVon(teile, p.anlage_id)}-${p.kennung}` : '';
  };
  const [bester] = [...zaehler.entries()].sort((a, b) => b[1] - a[1] || code(a[0]).localeCompare(code(b[0])));
  return bester ? code(bester[0]) : '';
}

/**
 * Teilfälligkeiten «Ernte möglich» und «Kultur beenden oder verlängern?» je Satz (R5.1, R5.2, A3): fällig bis heute,
 * alle Anlagen mit Kürzel; nach Fälligkeit, dann Ort. I1b-02 ruft diese Funktion auf, statt nachzurechnen.
 */
export function ernteAufgaben(teile: Teile, jetzt: Date, zeitzone: Zeitzone): ErnteAufgabe[] {
  const heute = kalendertag(jetzt, zeitzone);
  const aufgaben: ErnteAufgabe[] = [];
  const sorten = zeilen<{ sorte_id: string; name: string; gueltig_bis?: string | null }>(teile, 'sorte');
  for (const satz of zeilen<Satz>(teile, 'satz').filter((s) => (s.storniert_am ?? null) === null)) {
    const aktive = aktiveVon(teile, satz.id);
    const erste = aktive[0];
    if (!erste) continue;
    const sorte =
      sorten.find((s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null)?.name ?? 'Sorte';
    const ort = ortVon(teile, satz, aktive);
    const staende = aktive.map((z) => ({ z, s: ernteStand(teile, z.pflanzung_id, jetzt, zeitzone) }));
    const ernte = staende
      .filter((x) => x.s?.moeglichAb !== undefined && x.s.moeglichAb <= heute)
      .sort(
        (a, b) =>
          (a.s?.moeglichAb ?? '').localeCompare(b.s?.moeglichAb ?? '') ||
          a.z.pflanzung_id.localeCompare(b.z.pflanzung_id),
      )[0];
    if (ernte?.s?.moeglichAb)
      aufgaben.push({
        typ: 'ernte_moeglich',
        satzId: satz.id,
        pflanzungId: ernte.z.pflanzung_id,
        text: `Ernte möglich · ${sorte}`,
        ort,
        faelligAm: ernte.s.moeglichAb,
        schluessel: `ernte_moeglich|${satz.id}|${ernte.s.moeglichAb}`,
      });
    const frageAm = staende[0]?.s?.kulturFrageAm;
    if (frageAm !== undefined && frageAm <= heute)
      aufgaben.push({
        typ: 'kultur_entscheid',
        satzId: satz.id,
        pflanzungId: erste.pflanzung_id,
        text: `Kultur beenden oder verlängern? · ${sorte}`,
        ort,
        faelligAm: frageAm,
        schluessel: `kultur_entscheid|${satz.id}|${frageAm}`,
      });
  }
  return aufgaben.sort((a, b) => a.faelligAm.localeCompare(b.faelligAm) || a.ort.localeCompare(b.ort));
}
