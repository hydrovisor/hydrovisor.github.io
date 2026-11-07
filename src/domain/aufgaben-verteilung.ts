// R5.6 Verteilung der Ansätze (Plan 113; Konzept 7.4 R5.6, Q18): höchstens 3 Ansätze je Tag und Anlage. Mehr fällige
// werden 1 bis 2 Tage vorgezogen (zuerst Wechsel nach Intervall, dann Ansätze für Umsetzen); nicht vorziehbar sind
// Direktsaat-Termine, Termine aus naechster_wechsel_am und aus der Nachfüllsumme (Merkmal `vorziehbar` der Regel).
// Bleibt ein Tag über 3, tragen die überzähligen den Hinweis «n Ansätze heute». Stufe nach alleAufgaben(): keine
// zweite Fälligkeitsrechnung; Schlüssel, faelligAm und Grund bleiben, nur anzeigeAb und Hinweis ändern sich.
// faelligeAufgaben() bleibt die Liste aus R5.1. Rein: stichtag und Zeitzone als Parameter (G1, G2).
import { plaetzeAus, anlagenAus, ms, zeilen, type Teile } from './anlage/teile.ts';
import { alleAufgaben, type Aufgabe, type AufgabenArt, type AufgabenEinstellungen } from './aufgaben.ts';
import { kalendertag, tageZwischen, tagPlus, type Zeitzone } from './zeit.ts';

/**
 * Ansatz-Aufgaben im Sinn von R5.6: Wechsel, Erstansätze und Direktsaat-Ansätze sowie «Station auf 1. echte Blätter»,
 * die ein Neuansatz erledigt (Konzept R5.2, R4.3; nicht vorziehbar, Plan 113 Nachtrag 11)
 */
export const ANSATZ_TYPEN: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>([
  'loesung_wechseln',
  'ansatz',
  'station_echte_blaetter',
]);
export const MAX_ANSAETZE_JE_TAG = 3;

/** Rang beim Vorziehen: zuerst planmässige Wechsel, dann Ansätze für Umsetzen (R5.6) */
const RANG: Partial<Record<AufgabenArt, number>> = { loesung_wechseln: 0, ansatz: 1 };

interface AnsatzZeile {
  platz_id: string;
  typ: string;
  status?: string | null;
  begonnen_am: string;
  storniert_am?: string | null;
}

/** heute erfasste Neuansätze je Anlage (nicht storniert, nicht abgebrochen; Kalendertag Zürich, Plan 113 A4) */
export function ansaetzeHeute(teile: Teile, stichtag: Date, zeitzone: Zeitzone): Map<string, number> {
  const heute = kalendertag(stichtag, zeitzone);
  const anlageVon = new Map<string, string>();
  for (const a of anlagenAus(teile)) for (const p of plaetzeAus(teile, a.id)) anlageVon.set(p.id, a.id);
  const zahl = new Map<string, number>();
  for (const z of zeilen<AnsatzZeile>(teile, 'naehrloesungsansatz')) {
    if ((z.storniert_am ?? null) !== null || z.typ !== 'neuansatz' || z.status === 'abgebrochen') continue;
    if (Number.isNaN(ms(z.begonnen_am)) || kalendertag(new Date(z.begonnen_am), zeitzone) !== heute) continue;
    const anlage = anlageVon.get(z.platz_id);
    if (anlage !== undefined) zahl.set(anlage, (zahl.get(anlage) ?? 0) + 1);
  }
  return zahl;
}

export interface Verteilt {
  /** Lasttag nach der Verteilung, 'JJJJ-MM-TT' */
  tag: string;
  vorgezogenUm: 0 | 1 | 2;
  /** Zahl der Ansätze des Tags, nur an den überzähligen Aufgaben (Hinweis «n Ansätze heute», A2) */
  ueberzahl?: number;
}

interface Eintrag {
  a: Aufgabe;
  index: number;
  start: string;
  tag: string;
}

/** Lasttag: überfällige zählen auf heute */
const lasttag = (a: Aufgabe, heute: string) => (a.anzeigeAb < heute ? heute : a.anzeigeAb);
/** vorziehbar und nicht mit «Morgen» verschoben (A5) */
const ziehbar = (a: Aufgabe) => a.vorziehbar === true && a.anzeigeAb === a.faelligAm;

/** rein über der Liste: Schlüssel → Lasttag; nur Ansatz-Aufgaben stehen in der Map */
export function verteilen(
  aufgaben: readonly Aufgabe[],
  heute: string,
  bereitsHeute: ReadonlyMap<string, number>,
): Map<string, Verteilt> {
  const jeAnlage = new Map<string, Eintrag[]>();
  aufgaben.forEach((a, index) => {
    if (!ANSATZ_TYPEN.has(a.typ)) return;
    const start = lasttag(a, heute);
    const liste = jeAnlage.get(a.anlageId) ?? [];
    liste.push({ a, index, start, tag: start });
    jeAnlage.set(a.anlageId, liste);
  });
  const ergebnis = new Map<string, Verteilt>();
  for (const [anlage, eintraege] of jeAnlage) {
    const vorab = bereitsHeute.get(anlage) ?? 0;
    const last = (tag: string) => eintraege.filter((e) => e.tag === tag).length + (tag === heute ? vorab : 0);
    const tage = [...new Set(eintraege.map((e) => e.start))].sort();
    for (const d of tage) {
      const kandidaten = eintraege
        .filter((e) => e.tag === d && ziehbar(e.a))
        .sort((x, y) => (RANG[x.a.typ] ?? 9) - (RANG[y.a.typ] ?? 9) || x.index - y.index);
      for (const e of kandidaten) {
        if (last(d) <= MAX_ANSAETZE_JE_TAG) break;
        const ziel = [tagPlus(d, -1), tagPlus(d, -2)].find(
          (t) => t >= heute && t >= (e.a.fruehestens ?? heute) && last(t) < MAX_ANSAETZE_JE_TAG,
        );
        if (ziel !== undefined) e.tag = ziel;
      }
    }
    // Überzahl: je Tag ab dem vierten Ansatz, nicht vorziehbare zuerst gezählt (A2)
    for (const d of new Set(eintraege.map((e) => e.tag))) {
      const n = last(d);
      if (n <= MAX_ANSAETZE_JE_TAG) continue;
      const frei = Math.max(0, MAX_ANSAETZE_JE_TAG - (d === heute ? vorab : 0));
      eintraege
        .filter((e) => e.tag === d)
        .sort((x, y) => Number(ziehbar(x.a)) - Number(ziehbar(y.a)) || x.index - y.index)
        .slice(frei)
        .forEach((e) => ergebnis.set(e.a.schluessel, { tag: d, vorgezogenUm: 0, ueberzahl: n }));
    }
    for (const e of eintraege) {
      if (ergebnis.has(e.a.schluessel)) continue;
      ergebnis.set(e.a.schluessel, { tag: e.tag, vorgezogenUm: tageZwischen(e.tag, e.start) as 0 | 1 | 2 });
    }
  }
  return ergebnis;
}

const mitHinweis = (a: Aufgabe, zusatz: string) => (a.hinweis ? `${a.hinweis} · ${zusatz}` : zusatz);

/** alleAufgaben() → verteilen() → anzeigeAb und Hinweis gesetzt → anzeigeAb ≤ heute; sonst gleich wie faelligeAufgaben() */
export function verteilteAufgaben(
  teile: Teile,
  einstellungen: AufgabenEinstellungen,
  stichtag: Date,
  zeitzone: Zeitzone,
): Aufgabe[] {
  const heute = kalendertag(stichtag, zeitzone);
  const alle = alleAufgaben(teile, einstellungen, stichtag, zeitzone);
  const verteilung = verteilen(alle, heute, ansaetzeHeute(teile, stichtag, zeitzone));
  return alle
    .map((a) => {
      const v = verteilung.get(a.schluessel);
      if (!v) return a;
      if (v.ueberzahl !== undefined)
        return { ...a, hinweis: mitHinweis(a, `${String(v.ueberzahl)} Ansätze heute`) };
      if (v.vorgezogenUm > 0) return { ...a, anzeigeAb: v.tag, hinweis: mitHinweis(a, 'vorgezogen') };
      return a;
    })
    .filter((a) => a.anzeigeAb <= heute);
}
