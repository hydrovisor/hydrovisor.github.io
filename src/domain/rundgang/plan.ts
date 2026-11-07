// Rundgang-Plan (Plan 30; UC8 Ablauf 2, Ablauf Rundgang 1 bis 3; R5.1, R5.2, R5.4, G5; A1 bis A3): ordnet die fälligen
// Aufgaben aus faelligeAufgaben() nach Laufweg, Ebene und Ort. Keine zweite Fälligkeitsrechnung (R5.1). Rein.
import {
  anlagenAus,
  bereicheAus,
  gefaessAm,
  nachKennung,
  zeilen,
  type AnlageZeile,
  type Teile,
} from '../anlage/teile.ts';
import type { Aufgabe, AufgabenArt, AufgabenOrt } from '../aufgaben.ts';
import { TYPEN } from '../aufgaben-aufschub.ts';
import { kalendertag, tageZwischen, type Zeitzone } from '../zeit.ts';
import { kurzpruefungPunkte, PUNKT_TEXT } from './kurzpruefung.ts';

export type Punkt = 'pumpe' | 'luftzone' | 'loesung_topfboden' | 'wurzeln' | 'wuerfel_feucht';

export interface KurzpruefungZeile {
  platzId: string;
  code: string;
  punkt: Punkt;
  text: string;
  /** Aufgabe, die der Punkt erledigt (Kurzprüfung, Wurzeln prüfen, Würfel feucht) */
  aufgabe: Aufgabe;
  vermerk?: 'belueftung' | 'mitmarkiert';
}
export interface RundgangOrt {
  platzId: string;
  code: string;
  betriebsart?: string;
  /** erste fällige Mess-Aufgabe nach Tabellenreihenfolge */
  messAufgabe?: Aufgabe;
  /** Knopfpaar «Speichern» und «Nachfüllen» (messen_nachfuellen fällig) */
  nachfuellen: boolean;
  aufgaben: Aufgabe[];
}
export interface RundgangEbene {
  bereichId: string | null;
  name: string;
  kurzpruefung: KurzpruefungZeile[];
  mitLichtLuefter: boolean;
  orte: RundgangOrt[];
}
export interface RundgangPlan {
  anlageId: string;
  tag: string;
  ebenen: RundgangEbene[];
  orteZahl: number;
}

/** Rundgang-Aufgaben (A2); übrige Aufgaben bleiben auf Heute */
export const RUNDGANG_TYPEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'kurzpruefung',
  'wurzeln_pruefen',
  'wuerfel_feucht',
  'belueftung_pruefen',
  'messen_nachfuellen',
  'messen',
  'kontrolle_folgetag',
  'waerme_pruefen',
  'strom_wassertemperatur',
  'strom_messen',
  'nachfuellen_kratky',
]);
/** Mess-Schritt: die erste fällige nach der Reihenfolge der Tabelle R5.2 */
const MESS_TYPEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'messen_nachfuellen',
  'messen',
  'kontrolle_folgetag',
  'waerme_pruefen',
  'strom_wassertemperatur',
  'strom_messen',
]);
const RANG_TYP = new Map(TYPEN.map((t, i) => [t, i]));

/** Anlage des Rundgangs: die echte, ohne echte die erste nach echt vor demo vor test (A1) */
export function rundgangAnlage(teile: Teile): AnlageZeile | undefined {
  return anlagenAus(teile)[0];
}

/**
 * Rang je Kennung: genannte Orte in der Reihenfolge des Laufwegs, fehlende danach (Anzuchtorte vor Gefässen, nach
 * Kennung). Gleiche Kennung kommt je Anlage nur einmal vor.
 */
export function laufwegRang(
  laufweg: readonly string[],
  orte: readonly { kennung: string; rolle: string; bereichId: string | null }[],
): Map<string, number> {
  const rang = new Map<string, number>();
  laufweg.forEach((k, i) => {
    if (!rang.has(k)) rang.set(k, i);
  });
  const rest = orte
    .filter((o) => !rang.has(o.kennung))
    .sort((a, b) => Number(a.rolle !== 'anzuchtort') - Number(b.rolle !== 'anzuchtort') || nachKennung(a, b));
  rest.forEach((o, i) => rang.set(o.kennung, laufweg.length + i));
  return rang;
}

/** Satzalter der jüngsten Direktsaat am Platz in Tagen (Kratky: Topfboden bis Tag 13, R5.2) */
function direktsaatAlter(teile: Teile, platzId: string, heute: string): number | undefined {
  const saat = zeilen<{
    direktsaat_platz_id: string | null;
    saatdatum: string;
    storniert_am?: string | null;
  }>(teile, 'satz')
    .filter((s) => (s.storniert_am ?? null) === null && s.direktsaat_platz_id === platzId)
    .map((s) => s.saatdatum)
    .sort()
    .at(-1);
  return saat === undefined ? undefined : tageZwischen(saat, heute);
}

/**
 * Orte einer Anlage in Ebenen nach dem Laufweg: Ebenen nach ihrem ersten genannten Ort, ohne genannten Ort zuerst die
 * Ebene der Anzuchtorte, dann absteigend nach Nummer (A3); innerhalb der Ebene nach laufwegRang(). Rundgang und
 * Heute-Karten teilen diese Reihenfolge.
 */
export function ortsfolge(
  teile: Teile,
  anlageId: string,
  orte: readonly AufgabenOrt[],
): { bereichId: string | null; orte: AufgabenOrt[] }[] {
  const anlage = anlagenAus(teile).find((a) => a.id === anlageId) as
    (AnlageZeile & { laufweg?: readonly string[] | null }) | undefined;
  const laufweg = [...(anlage?.laufweg ?? [])];
  const rang = laufwegRang(laufweg, orte);
  const sortiert = [...orte].sort((a, b) => (rang.get(a.kennung) ?? 0) - (rang.get(b.kennung) ?? 0));
  const bereiche = new Map(bereicheAus(teile, anlageId).map((b) => [b.id, b]));
  const genannt = new Set(laufweg);
  const gruppen = new Map<string | null, AufgabenOrt[]>();
  for (const o of sortiert) gruppen.set(o.bereichId, [...(gruppen.get(o.bereichId) ?? []), o]);
  const kennzahl = (id: string | null, l: readonly AufgabenOrt[]) => {
    const erster = l.find((o) => genannt.has(o.kennung));
    return [
      erster ? 0 : 1,
      erster ? (rang.get(erster.kennung) ?? 0) : 0,
      l.some((o) => o.rolle === 'anzuchtort') ? 0 : 1,
      -(id === null ? -1 : (bereiche.get(id)?.nummer ?? -1)),
    ];
  };
  return [...gruppen.entries()]
    .map(([bereichId, l]) => ({ bereichId, orte: l, k: kennzahl(bereichId, l) }))
    .sort((a, b) => a.k.reduce((d, x, i) => d || x - (b.k[i] ?? 0), 0))
    .map(({ bereichId, orte: l }) => ({ bereichId, orte: l }));
}

export function rundgangPlan(
  teile: Teile,
  aufgaben: readonly Aufgabe[],
  anlageId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): RundgangPlan {
  const tag = kalendertag(jetzt, zeitzone);
  const eigene = aufgaben.filter((a) => a.anlageId === anlageId && a.ort && RUNDGANG_TYPEN.has(a.typ));

  // Orte mit ihren Rundgang-Aufgaben, Aufgaben nach Tabellenreihenfolge
  const jeOrt = new Map<string, Aufgabe[]>();
  for (const a of eigene) {
    const id = (a.ort as AufgabenOrt).platzId;
    jeOrt.set(id, [...(jeOrt.get(id) ?? []), a]);
  }
  const listen = new Map(
    [...jeOrt.entries()].map(([id, l]) => [
      id,
      [...l].sort((a, b) => (RANG_TYP.get(a.typ) ?? 0) - (RANG_TYP.get(b.typ) ?? 0)),
    ]),
  );
  const folge = ortsfolge(
    teile,
    anlageId,
    [...listen.values()].map((l) => l[0]?.ort as AufgabenOrt),
  );
  const orteZahl = listen.size;
  const ebenenFolge = folge.map((g) => ({
    id: g.bereichId,
    l: g.orte.map((ort) => ({ ort, aufgaben: listen.get(ort.platzId) ?? [] })),
  }));

  const bereiche = new Map(bereicheAus(teile, anlageId).map((b) => [b.id, b]));
  const ebenen: RundgangEbene[] = ebenenFolge.map(({ id, l }) => {
    const kurzpruefung: KurzpruefungZeile[] = [];
    const rundgangOrte: RundgangOrt[] = l.map(({ ort, aufgaben: liste }) => {
      const von = (typ: AufgabenArt) => liste.find((a) => a.typ === typ);
      const betriebsart = gefaessAm(teile, ort.platzId)?.betriebsart;
      const alter = ort.rolle === 'gefaess' ? direktsaatAlter(teile, ort.platzId, tag) : undefined;
      const punkte = kurzpruefungPunkte(
        {
          ...(betriebsart ? { betriebsart } : {}),
          anzuchtort: ort.rolle === 'anzuchtort',
          ...(alter !== undefined ? { direktsaatAlterTage: alter } : {}),
        },
        liste,
      );
      const belueftung = von('belueftung_pruefen');
      for (const punkt of punkte) {
        const aufgabe =
          punkt === 'wurzeln'
            ? von('wurzeln_pruefen')
            : punkt === 'wuerfel_feucht'
              ? von('wuerfel_feucht')
              : (von('kurzpruefung') ?? belueftung);
        if (!aufgabe) continue;
        const hauptpunkt = punkt !== 'wurzeln' && punkt !== 'wuerfel_feucht';
        kurzpruefung.push({
          platzId: ort.platzId,
          code: ort.code,
          punkt,
          text: PUNKT_TEXT[punkt],
          aufgabe,
          ...(hauptpunkt && belueftung
            ? { vermerk: belueftung.hinweis === 'mitmarkiert' ? 'mitmarkiert' : 'belueftung' }
            : {}),
        });
      }
      const messAufgabe = liste.find((a) => MESS_TYPEN.has(a.typ));
      return {
        platzId: ort.platzId,
        code: ort.code,
        ...(betriebsart ? { betriebsart } : {}),
        ...(messAufgabe ? { messAufgabe } : {}),
        nachfuellen: messAufgabe !== undefined && von('messen_nachfuellen') !== undefined,
        aufgaben: liste,
      };
    });
    const b = id === null ? undefined : bereiche.get(id);
    return {
      bereichId: id,
      name: b?.name ?? (b ? `Ebene ${b.nummer}` : 'Ohne Ebene'),
      kurzpruefung,
      mitLichtLuefter: kurzpruefung.length > 0,
      orte: rundgangOrte,
    };
  });
  return { anlageId, tag, ebenen, orteZahl };
}
