// Ablauf des Rundgangs (Plan 30; Konzept 6.2 Rundgang, 11.4; UC F4 Rundgang 2 bis 6; A5, A6): Zustandsautomat über
// dem Plan, serialisierbar für den Ablaufspeicher. Je Ebene die Kurzprüfung, je Ort mit Schritt die Kennung (1 s,
// ohne Tipp), die Messung, falls gewählt das Nachfüllen bzw. bei Kratky unter ⅓ «Nachfüllen Kratky», bei Abweichung
// der Halt; am Ende die Abschlussliste. Rein: jetzt und Zeitzone als Parameter.
import type { Bewertung } from '../bewertung/bewertung.ts';
import type { Groesse } from '../messung/eingabe.ts';
import { kalendertag, type Zeitzone } from '../zeit.ts';
import type { RundgangOrt, RundgangPlan } from './plan.ts';

export type RundgangSchritt =
  | { art: 'kurzpruefung'; ebene: number }
  | { art: 'kennung'; ort: number; ebene: number }
  | { art: 'messen'; ort: number; ebene: number }
  | { art: 'halt'; ort: number; ebene: number }
  | { art: 'nachfuellen' | 'nachfuellen_kratky'; ort: number; ebene: number }
  | { art: 'abschluss' };

export interface OrtErgebnis {
  platzId: string;
  messungId?: string;
  /** Hundertstel (G3) */
  werte?: Partial<Record<Groesse, number>>;
  bewertungen?: Partial<Record<Groesse, Bewertung>>;
  fuellstand?: 'ueber_drittel' | 'unter_drittel';
  nachgefuelltL?: number;
  fertig: boolean;
}

export interface KurzpruefungErgebnis {
  platzId: string | null;
  bereichId: string | null;
  punkt: string;
  ok: boolean;
}

export interface RundgangStand {
  id: string;
  art: 'rundgang';
  anlageId: string;
  tag: string;
  plan: RundgangPlan;
  schritt: RundgangSchritt;
  kurzpruefung: KurzpruefungErgebnis[];
  orte: OrtErgebnis[];
  letzteAktionAm: string;
}

/** Schlüssel im Ablaufspeicher: je Anlage und Kalendertag ein Rundgang (A6) */
export const rundgangId = (anlageId: string, tag: string) => `rundgang:${anlageId}:${tag}`;

/** Ort mit eigenem Schritt: Messung oder (ohne fällige Messung) «Nachfüllen Kratky» */
const mitSchritt = (o: RundgangOrt) =>
  o.messAufgabe !== undefined || o.aufgaben.some((a) => a.typ === 'nachfuellen_kratky');

const ortVon = (s: RundgangStand, ebene: number, ort: number) => s.plan.ebenen[ebene]?.orte[ort];

function ergebnisSetzen(s: RundgangStand, platzId: string, neu: Partial<OrtErgebnis>): OrtErgebnis[] {
  return s.orte.map((o) => (o.platzId === platzId ? { ...o, ...neu } : o));
}

/** erster Schritt ab Ebene `ebene`, Ort `ab` (Kurzprüfung nur beim Eintritt in die Ebene) */
function schrittAb(plan: RundgangPlan, ebene: number, ab: number, mitKurz: boolean): RundgangSchritt {
  for (let e = ebene; e < plan.ebenen.length; e += 1) {
    const eb = plan.ebenen[e];
    if (!eb) continue;
    const start = e === ebene ? ab : 0;
    if ((e !== ebene || mitKurz) && eb.kurzpruefung.length > 0) return { art: 'kurzpruefung', ebene: e };
    const ort = eb.orte.findIndex((o, i) => i >= start && mitSchritt(o));
    if (ort >= 0) return { art: 'kennung', ort, ebene: e };
  }
  return { art: 'abschluss' };
}

const zeit = (s: RundgangStand, jetzt: Date): RundgangStand => ({
  ...s,
  letzteAktionAm: jetzt.toISOString(),
});

/** Ort fertig, weiter zum nächsten Ort bzw. zur nächsten Ebene */
function weiterNach(s: RundgangStand, ebene: number, ort: number, jetzt: Date): RundgangStand {
  const o = ortVon(s, ebene, ort);
  const orte = o ? ergebnisSetzen(s, o.platzId, { fertig: true }) : s.orte;
  return zeit({ ...s, orte, schritt: schrittAb(s.plan, ebene, ort + 1, false) }, jetzt);
}

const abweichung = (b: Partial<Record<Groesse, Bewertung>> | undefined) =>
  Object.values(b ?? {}).some((x) => x === 'knapp' || x === 'ausserhalb');

export function rundgangStart(plan: RundgangPlan, jetzt: Date): RundgangStand {
  return {
    id: rundgangId(plan.anlageId, plan.tag),
    art: 'rundgang',
    anlageId: plan.anlageId,
    tag: plan.tag,
    plan,
    schritt: schrittAb(plan, 0, 0, true),
    kurzpruefung: [],
    orte: plan.ebenen.flatMap((e) => e.orte.map((o) => ({ platzId: o.platzId, fertig: false }))),
    letzteAktionAm: jetzt.toISOString(),
  };
}

/** Sammel-Tipp gespeichert: Orte ohne eigenen Schritt sind fertig, weiter zur ersten Kennung der Ebene */
export function nachKurzpruefung(
  s: RundgangStand,
  ergebnisse: readonly KurzpruefungErgebnis[],
  jetzt: Date,
): RundgangStand {
  if (s.schritt.art !== 'kurzpruefung') return s;
  const ebene = s.schritt.ebene;
  const ohne = new Set(
    (s.plan.ebenen[ebene]?.orte ?? []).filter((o) => !mitSchritt(o)).map((o) => o.platzId),
  );
  return zeit(
    {
      ...s,
      kurzpruefung: [...s.kurzpruefung, ...ergebnisse],
      orte: s.orte.map((o) => (ohne.has(o.platzId) ? { ...o, fertig: true } : o)),
      schritt: schrittAb(s.plan, ebene, 0, false),
    },
    jetzt,
  );
}

/** Kennung gezeigt (1 s, ohne Tipp): Schritt des Orts */
export function naechsterSchritt(s: RundgangStand, jetzt: Date): RundgangStand {
  if (s.schritt.art !== 'kennung') return s;
  const { ort, ebene } = s.schritt;
  const o = ortVon(s, ebene, ort);
  return zeit(
    { ...s, schritt: { art: o?.messAufgabe ? 'messen' : 'nachfuellen_kratky', ort, ebene } },
    jetzt,
  );
}

/** Messung gespeichert: Nachfüllen, «Nachfüllen Kratky», Halt oder weiter (Konzept 6.2, R4.10, R10.5) */
export function nachMessung(
  s: RundgangStand,
  e: {
    messungId: string;
    werte: Partial<Record<Groesse, number>>;
    bewertungen: Partial<Record<Groesse, Bewertung>>;
    fuellstand?: 'ueber_drittel' | 'unter_drittel';
    nachfuellen: boolean;
  },
  jetzt: Date,
): RundgangStand {
  if (s.schritt.art !== 'messen') return s;
  const { ort, ebene } = s.schritt;
  const o = ortVon(s, ebene, ort);
  if (!o) return s;
  const orte = ergebnisSetzen(s, o.platzId, {
    messungId: e.messungId,
    werte: e.werte,
    bewertungen: e.bewertungen,
    ...(e.fuellstand ? { fuellstand: e.fuellstand } : {}),
  });
  const neu = { ...s, orte };
  const kratky = (o.betriebsart ?? '').startsWith('kratky');
  if (e.nachfuellen && o.nachfuellen)
    return zeit({ ...neu, schritt: { art: 'nachfuellen', ort, ebene } }, jetzt);
  if (kratky && e.fuellstand === 'unter_drittel')
    return zeit({ ...neu, schritt: { art: 'nachfuellen_kratky', ort, ebene } }, jetzt);
  if (abweichung(e.bewertungen)) return zeit({ ...neu, schritt: { art: 'halt', ort, ebene } }, jetzt);
  return weiterNach(neu, ebene, ort, jetzt);
}

/** «Nachgefüllt»: Liter merken; bei Abweichung der Messung danach der Halt (A5) */
export function nachNachfuellen(s: RundgangStand, liter: number, jetzt: Date): RundgangStand {
  if (s.schritt.art !== 'nachfuellen' && s.schritt.art !== 'nachfuellen_kratky') return s;
  const { ort, ebene } = s.schritt;
  const o = ortVon(s, ebene, ort);
  if (!o) return s;
  const orte = ergebnisSetzen(s, o.platzId, { nachgefuelltL: liter });
  const neu = { ...s, orte };
  const b = orte.find((x) => x.platzId === o.platzId)?.bewertungen;
  if (abweichung(b)) return zeit({ ...neu, schritt: { art: 'halt', ort, ebene } }, jetzt);
  return weiterNach(neu, ebene, ort, jetzt);
}

/** Halt mit «Am Ende»: der Ort ist fertig, die Abweichung steht in der Abschlussliste */
export function amEnde(s: RundgangStand, jetzt: Date): RundgangStand {
  if (s.schritt.art !== 'halt') return s;
  return weiterNach(s, s.schritt.ebene, s.schritt.ort, jetzt);
}

/** «Rundgang beenden» jederzeit: zur Abschlussliste */
export function rundgangBeenden(s: RundgangStand, jetzt: Date): RundgangStand {
  return zeit({ ...s, schritt: { art: 'abschluss' } }, jetzt);
}

/** ein Stand gilt nur am Kalendertag seines Plans (A6) */
export function standGueltig(s: RundgangStand, jetzt: Date, zeitzone: Zeitzone): boolean {
  return s.tag === kalendertag(jetzt, zeitzone);
}

/** aktueller Ort des Schritts */
export function aktuellerOrt(s: RundgangStand): RundgangOrt | undefined {
  return 'ort' in s.schritt ? ortVon(s, s.schritt.ebene, s.schritt.ort) : undefined;
}

/** «4 von 13» für «Laufende Abläufe» */
export function fortschritt(s: RundgangStand): { fertig: number; von: number } {
  return { fertig: s.orte.filter((o) => o.fertig).length, von: s.orte.length };
}
