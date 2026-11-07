// Abschlussliste des Rundgangs (Plan 30; Rundgang-AK2; R10.1, R10.2, R10.4, R10.5; A5, A8): genau die Werte «Knapp
// daneben» und «Ausserhalb» und die Kurzprüfungen mit Abweichung, je mit Massnahme und Knopf; Kopf «Fertig: x von n ·
// g im grünen Bereich · k korrigieren». Rein; die Massnahme kommt aus hinweise() (Ergebniszone, R10.5).
import { gefaessAm } from '../anlage/teile.ts';
import type { Teile } from '../teile.ts';
import { alsText, type Bewertung } from '../bewertung/bewertung.ts';
import { hinweise, type Hinweis, type Messart } from '../bewertung/hinweise.ts';
import { bewertungsband, type Sollband } from '../bewertung/sollband.ts';
import type { Groesse } from '../messung/eingabe.ts';
import { ZEITZONE, type Zeitzone } from '../zeit.ts';
import type { OrtErgebnis, RundgangStand } from './ablauf.ts';

export interface AbschlussZeile {
  platzId: string;
  code: string;
  art: 'wert' | 'kurzpruefung';
  groesse?: Groesse;
  text: string;
  bewertung?: 'knapp' | 'ausserhalb';
  massnahme?: string;
  knopf: {
    text: 'pH korrigieren' | 'Gefäss öffnen' | 'Anlage öffnen';
    route: 'messen' | 'gefaess' | 'anlage';
  };
}

const GROESSEN: readonly Groesse[] = ['ph', 'ec', 'temperatur'];
const KURZ: Readonly<Record<Groesse, string>> = { ph: 'pH', ec: 'EC', temperatur: '°C' };
const WORT: Readonly<Record<'knapp' | 'ausserhalb', string>> = {
  knapp: 'Knapp daneben',
  ausserhalb: 'Ausserhalb',
};
const ZU_GROESSE: Readonly<Record<Hinweis['ausloeser'], Groesse | undefined>> = {
  ph_hoch: 'ph',
  ph_tief: 'ph',
  ph_trend: 'ph',
  eisen: 'ph',
  ph_fall: undefined,
  ph_anstieg: undefined,
  ec_hoch: 'ec',
  ec_tief: 'ec',
  temp_hoch: 'temperatur',
  temp_tief: 'temperatur',
  leitungswasser: undefined,
};

/** Abweichungen der Kurzprüfung (R10.5 «Pumpe sprudelt nicht oder keine Luftzone») */
const BELUEFTUNG =
  'Pumpe, Schlauch und Luftstein prüfen; bei Kratky Pegel senken; Gefässe derselben Luftpumpe mitmarkiert';
const KURZ_ABWEICHUNG: Readonly<Record<string, { text: string; massnahme: string }>> = {
  pumpe: { text: 'Pumpe sprudelt nicht → Belüftung prüfen', massnahme: BELUEFTUNG },
  luftzone: { text: 'Keine Luftzone → Belüftung prüfen', massnahme: BELUEFTUNG },
  loesung_topfboden: {
    text: 'Lösung berührt Topfboden nicht',
    massnahme: 'Pegel bis an den Topfboden anheben',
  },
  wurzeln: { text: 'Wurzeln nicht weiss', massnahme: 'Wurzeln und Geruch prüfen' },
  wuerfel_feucht: { text: 'Würfel nicht feucht', massnahme: 'Würfel befeuchten' },
  // am Bereich (Sammel-Tipp, Prüfer Runde 1 Befund 2; Massnahmen A)
  licht: { text: 'Licht aus', massnahme: 'AC10-Zeitplan und Stromzufuhr des Lichts prüfen' },
  luefter: { text: 'Lüfter steht', massnahme: 'Lüfter und Stromzufuhr prüfen' },
};

const kennung = (code: string) => code.slice(code.indexOf('-') + 1);
const GEFAESS = { text: 'Gefäss öffnen', route: 'gefaess' } as const;

function messartAm(teile: Teile, platzId: string): Messart {
  const g = gefaessAm(teile, platzId);
  if (g?.feste_dosis === true) return 'station';
  return (g?.betriebsart ?? 'dwc') as Messart;
}

/** Massnahme der Ergebniszone für genau diesen Wert (je Grösse einzeln, damit keine Kürzung auf zwei greift) */
function massnahmeFuer(
  teile: Teile,
  o: OrtErgebnis,
  g: Groesse,
  b: Bewertung,
  sollband: Sollband | undefined,
  jetzt: Date,
  zeitzone: Zeitzone,
): string | undefined {
  const wert = o.werte?.[g];
  if (wert === undefined) return undefined;
  const h = hinweise(
    {
      betriebsart: messartAm(teile, o.platzId),
      werte: { [g]: wert },
      bewertungen: { [g]: b },
      ...(sollband ? { sollband } : {}),
      vorher: {},
      ansaetze: [],
    },
    jetzt,
    zeitzone,
  ).hinweise.find((x) => ZU_GROESSE[x.ausloeser] === g);
  return h?.massnahme;
}

export function abschlussliste(
  stand: RundgangStand,
  kontext: { teile: Teile; zeitzone?: Zeitzone },
): AbschlussZeile[] {
  const zeitzone = kontext.zeitzone ?? ZEITZONE;
  const jetzt = new Date(stand.letzteAktionAm);
  const codes = new Map(stand.plan.ebenen.flatMap((e) => e.orte.map((o) => [o.platzId, o.code] as const)));
  for (const e of stand.plan.ebenen) for (const z of e.kurzpruefung) codes.set(z.platzId, z.code);
  const ergebnisse = new Map(stand.orte.map((o) => [o.platzId, o]));
  const zeilen: AbschlussZeile[] = [];
  // Reihenfolge wie der Rundgang: je Ebene zuerst Licht und Lüfter, dann die Orte
  const folge = stand.plan.ebenen.flatMap((e) => [
    { bereich: e },
    ...e.orte.flatMap((o) => {
      const r = ergebnisse.get(o.platzId);
      return r ? [{ ort: r }] : [];
    }),
  ]);
  for (const f of folge) {
    if ('bereich' in f) {
      const e = f.bereich;
      for (const k of stand.kurzpruefung.filter(
        (x) => x.platzId === null && x.bereichId === e.bereichId && e.bereichId !== null && !x.ok,
      )) {
        const a = KURZ_ABWEICHUNG[k.punkt] ?? { text: `${k.punkt} nicht ok`, massnahme: 'Anlage prüfen' };
        zeilen.push({
          platzId: e.bereichId as string,
          code: e.name,
          art: 'kurzpruefung',
          text: `${e.name} ${a.text}`,
          massnahme: a.massnahme,
          knopf: { text: 'Anlage öffnen', route: 'anlage' },
        });
      }
      continue;
    }
    const o = f.ort;
    const code = codes.get(o.platzId) ?? o.platzId;
    for (const k of stand.kurzpruefung.filter((x) => x.platzId === o.platzId && !x.ok)) {
      const a = KURZ_ABWEICHUNG[k.punkt] ?? { text: `${k.punkt} nicht ok`, massnahme: 'Gefäss prüfen' };
      zeilen.push({
        platzId: o.platzId,
        code,
        art: 'kurzpruefung',
        text: `${kennung(code)} ${a.text}`,
        massnahme: a.massnahme,
        knopf: GEFAESS,
      });
    }
    const sollband = o.werte ? bewertungsband(kontext.teile, o.platzId, jetzt) : undefined;
    for (const g of GROESSEN) {
      const b = o.bewertungen?.[g];
      const wert = o.werte?.[g];
      if ((b !== 'knapp' && b !== 'ausserhalb') || wert === undefined) continue;
      const massnahme = massnahmeFuer(kontext.teile, o, g, b, sollband, jetzt, zeitzone);
      const ueberZiel = g === 'ph' && sollband !== undefined && wert > sollband.ph.max;
      zeilen.push({
        platzId: o.platzId,
        code,
        art: 'wert',
        groesse: g,
        text: `${kennung(code)} ${KURZ[g]} ${alsText(g, wert)} ${WORT[b]}`,
        bewertung: b,
        ...(massnahme ? { massnahme } : {}),
        knopf: ueberZiel ? { text: 'pH korrigieren', route: 'messen' } : GEFAESS,
      });
    }
  }
  return zeilen;
}

/** «Fertig: x von n · g im grünen Bereich · k korrigieren» (A8) */
export function abschlussKopf(stand: RundgangStand, zeilen: readonly AbschlussZeile[]): string {
  const mitZeile = new Set(zeilen.map((z) => z.platzId));
  const besucht = stand.orte.filter((o) => o.fertig || o.messungId !== undefined);
  const orte = besucht.filter((o) => mitZeile.has(o.platzId)).length;
  // Licht und Lüfter am Bereich zählen je Ebene einmal zu «korrigieren» (Prüfer Runde 2 N2)
  const ortIds = new Set(stand.orte.map((o) => o.platzId));
  const bereiche = new Set(zeilen.filter((z) => !ortIds.has(z.platzId)).map((z) => z.platzId)).size;
  const korrigieren = orte + bereiche;
  const fertig = stand.orte.filter((o) => o.fertig).length;
  return `Fertig: ${fertig} von ${stand.orte.length} · ${besucht.length - orte} im grünen Bereich · ${korrigieren} korrigieren`;
}
