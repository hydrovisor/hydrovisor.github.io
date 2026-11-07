// R5.6 Verteilung der Ansätze (Plan 113 Testliste; R5.6-AK1 bis AK6, UC8-AK6; Konzept R5.6 Z. 543, Q18; 06_tests.md
// Z. 103, Szenario S9 verkleinert). Injizierte Uhr, Zeitzone Europe/Zurich, Fixture tests/unit/aufgaben-fixture.ts
// (nur importiert). Stichtag Mi 13.1.2027 09:00 Zürich, Tag D = Do 14.1.2027.
//
// verteilen() arbeitet nur über der Liste und wird mit synthetischen Aufgaben geprüft; verteilteAufgaben() mit
// Bündelteilen. Vom Testentwickler festgelegt, wo Plan 113 offen ist:
// - Verteilt.ueberzahl ist genau bei den Aufgaben gesetzt, die den Hinweis «n Ansätze heute» tragen; der Wert selbst
//   wird nur über den Hinweistext geprüft.
// - Der Grund einer vorgezogenen Aufgabe bleibt der aus der Aufgaben-Rechnung («fällig 14.1.»); der Test lässt
//   auch die Wochentagsform «fällig Do» aus dem AK-Text zu.
// - Welche von vier gleichrangigen Aufgaben wandert, legt der Test nicht fest (A3: Sortierung von alleAufgaben()),
//   nur, dass es genau eine ist und dass gleiche Eingaben gleiche Listen geben.
// Nachträge nach Prüfer Runde 1 (Plan 113 Punkte 10 bis 12): Wechsel mit «mit 1. echte Blätter» trägt
// `fruehestens` = Stationstag und wird nie davor gezogen; «Station auf 1. echte Blätter» zählt als Ansatz und ist
// nicht vorziehbar; «Morgen» gilt auch bei der Erstkalibrierung.
import { describe, expect, it } from 'vitest';
import {
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  type Aufgabe,
  type AufgabenEinstellungen,
} from '../../src/domain/aufgaben.ts';
import {
  ANSATZ_TYPEN,
  MAX_ANSAETZE_JE_TAG,
  ansaetzeHeute,
  verteilen,
  verteilteAufgaben,
  type Verteilt,
} from '../../src/domain/aufgaben-verteilung.ts';
import {
  ANLAGE,
  ERWARTETE_SCHLUESSEL,
  JETZT,
  MESSGERAET,
  ZONE,
  ansatzDazu,
  boxDazu,
  fertig,
  gefaessDazu,
  grundstand,
  jetztAm,
  kalibrierungDazu,
  keimungDazu,
  leer,
  netztopfDazu,
  platzId,
  reservierungDazu,
  satzDazu,
  schluessel,
  verschiebenDazu,
  von,
  zh,
  type GefaessVorgabe,
  type Teile,
} from './aufgaben-fixture.ts';

const MI = '2027-01-13';
const DO = '2027-01-14';
const FR = '2027-01-15';
const SA = '2027-01-16';
/** Mi 13.1.2027 09:00 Zürich */
const MI_JETZT = jetztAm(MI);
const OHNE: AufgabenEinstellungen = { vorlaufN: 2, festeKalibriertermine: [] };

const verteilt = (t: Teile, jetzt: Date = MI_JETZT, e?: AufgabenEinstellungen): Aufgabe[] =>
  verteilteAufgaben(t, e ?? einstellungenAus(t), jetzt, ZONE);
const faellig = (t: Teile, jetzt: Date = MI_JETZT, e?: AufgabenEinstellungen) =>
  faelligeAufgaben(t, e ?? einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt: Date = MI_JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const vorziehbar = (a: Aufgabe) => (a as Aufgabe & { vorziehbar?: true }).vorziehbar;
const fruehestens = (a: Aufgabe) => (a as Aufgabe & { fruehestens?: string }).fruehestens;
const ansatzArt = (l: readonly Aufgabe[]) =>
  l.filter((a) => a.typ === 'loesung_wechseln' || a.typ === 'ansatz');
const GRUND_DO = /^fällig (Do|14\.1\.)$/;

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

/** Gefässe mit Lösung: Neuansatz am Tag `begonnen` 09:00 Zürich (Intervall wechseln 14 → Wechsel begonnen + 14) */
function mitWechsel(
  t: Teile,
  codes: readonly string[],
  begonnen = '2026-12-31',
  extra: Omit<GefaessVorgabe, 'code' | 'betriebsart'> = {},
): Teile {
  for (const code of codes) {
    gefaessDazu(t, { code, betriebsart: 'dwc', ...extra });
    ansatzDazu(t, code, { begonnen: zh(begonnen) });
  }
  return t;
}

/** S9 verkleinert: vier DWC-Gefässe mit Neuansatz am 31.12.2026 → «Lösung wechseln» alle am Do 14.1. */
const VIER = ['R-1.1', 'R-1.2', 'R-2.1', 'R-2.2'] as const;
const vierAmDonnerstag = () => fertig(mitWechsel(leer(), VIER));

/**
 * Station 4.4 (Konstantpegel, feste Dosis) mit Neuansatz am Tag `neuansatz` (Wechsel nach Intervall + 14) und
 * Stationseintritt von Satz 2 am Tag `eintritt` (1. echte Blätter am Eintritt + 15)
 */
function mitStation(t: Teile, neuansatz: string, eintritt: string): Teile {
  gefaessDazu(t, {
    code: 'R-4.4',
    betriebsart: 'konstantpegel',
    luftpumpe: 'P4',
    festeDosis: true,
    volumenL: 2.3,
  });
  ansatzDazu(t, 'R-4.4', { begonnen: zh(neuansatz) });
  boxDazu(t, 'R-A1', 'box_licht');
  const p = satzDazu(t, { nr: 2, sorte: 'lollo', box: 'R-A1', saat: '2026-12-01' });
  p.forEach((id, i) => {
    keimungDazu(t, id, 2, zh('2026-12-05'));
    verschiebenDazu(t, id, 'R-4.4', zh(eintritt), i + 1);
  });
  return t;
}

// ---------------------------------------------------------------- synthetische Aufgaben für verteilen()

let laufnummer = 0;
/** Ansatz-Aufgabe ohne Bündel; vorziehbar Standard ja, anzeigeAb Standard = faelligAm */
function aufgabe(e: {
  faelligAm: string;
  anzeigeAb?: string;
  typ?: 'loesung_wechseln' | 'ansatz' | 'station_echte_blaetter' | 'messen_nachfuellen';
  anlage?: string;
  vorziehbar?: boolean;
  titel?: string;
  fruehestens?: string;
}): Aufgabe {
  laufnummer += 1;
  const typ = e.typ ?? 'loesung_wechseln';
  const bezug = uidVon(laufnummer);
  const anzeigeAb = e.anzeigeAb ?? e.faelligAm;
  const basis: Aufgabe = {
    schluessel: `${typ}|${bezug}|${e.faelligAm}`,
    typ,
    bezug,
    bezugArt: 'platz',
    faelligAm: e.faelligAm,
    anzeigeAb,
    tageUeberfaellig: 0,
    anlageId: e.anlage ?? ANLAGE.R,
    datenart: e.anlage === ANLAGE.X ? 'demo' : 'echt',
    titel: e.titel ?? (typ === 'ansatz' ? 'Ansatz für Umsetzen' : 'Lösung wechseln'),
    grund: 'fällig',
    gewicht: typ === 'messen_nachfuellen' ? 'routine' : 'wechsel',
    morgen: { erlaubt: false, verschoben: anzeigeAb === e.faelligAm ? 0 : 1 },
    ueberspringen: false,
    pegelOk: false,
    erledigtKnopf: false,
  };
  return {
    ...basis,
    ...(e.vorziehbar === false ? {} : { vorziehbar: true }),
    ...(e.fruehestens !== undefined ? { fruehestens: e.fruehestens } : {}),
  } as Aufgabe;
}
function uidVon(n: number): string {
  return `f0000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}
const viele = (n: number, e: Parameters<typeof aufgabe>[0]) => Array.from({ length: n }, () => aufgabe(e));
const KEINE = new Map<string, number>();

function lies(m: ReadonlyMap<string, Verteilt>, a: Aufgabe): Verteilt {
  const v = m.get(a.schluessel);
  if (!v) throw new Error(`keine Verteilung für ${a.schluessel}`);
  return v;
}
const tageVon = (m: ReadonlyMap<string, Verteilt>, l: readonly Aufgabe[]) => l.map((a) => lies(m, a).tag);
const mitUeberzahl = (m: ReadonlyMap<string, Verteilt>, l: readonly Aufgabe[]) =>
  l.filter((a) => lies(m, a).ueberzahl !== undefined);

// ---------------------------------------------------------------- R5.6-AK1

describe('R5.6-AK1 Vorziehen bei Überlast', () => {
  it('R5.6-AK1 Grenze 3 Ansätze je Tag; Ansatz-Typen sind Lösung wechseln, Ansatz und Station', () => {
    expect(MAX_ANSAETZE_JE_TAG).toBe(3);
    // Plan 113 Punkt 11: «Station auf 1. echte Blätter» wird durch einen Neuansatz erledigt (R4.3)
    expect([...ANSATZ_TYPEN].sort()).toEqual(['ansatz', 'loesung_wechseln', 'station_echte_blaetter']);
    // nur Ansatz-Aufgaben stehen in der Map
    const routine = aufgabe({ faelligAm: DO, typ: 'messen_nachfuellen', vorziehbar: false });
    const m = verteilen([routine, ...viele(4, { faelligAm: DO })], MI, KEINE);
    expect(m.has(routine.schluessel)).toBe(false);
    expect(m.size).toBe(4);
  });

  it('R5.6-AK1 vier fällige Ansätze → einer vorgezogen', () => {
    // synthetisch: vier vorziehbare Wechsel am Tag D = heute + 1, heute keiner
    const liste = viele(4, { faelligAm: DO });
    const m = verteilen(liste, MI, KEINE);
    expect(tageVon(m, liste).filter((t) => t === MI)).toHaveLength(1);
    expect(tageVon(m, liste).filter((t) => t === DO)).toHaveLength(3);
    const vor = liste.filter((a) => lies(m, a).tag === MI);
    expect(lies(m, einzig(vor, 'vorgezogen')).vorgezogenUm).toBe(1);
    expect(mitUeberzahl(m, liste)).toEqual([]);

    // mit Bündelteilen: genau einer erscheint heute mit «vorgezogen» und dem ursprünglichen Termin im Grund
    const t = vierAmDonnerstag();
    const heute = von(verteilt(t), 'loesung_wechseln');
    const a = einzig(heute, 'vorgezogener Wechsel');
    expect(a.hinweis).toBe('vorgezogen');
    expect(a.grund).toMatch(GRUND_DO);
    expect(a).toMatchObject({ faelligAm: DO, anzeigeAb: MI, tageUeberfaellig: 0, gewicht: 'wechsel' });
    expect(VIER.map((c) => schluessel('loesung_wechseln', platzId(c), DO))).toContain(a.schluessel);

    // D trägt danach 3
    const verteilung = verteilen(alle(t), MI, ansaetzeHeute(t, MI_JETZT, ZONE));
    const tage = [...verteilung.values()].map((v) => v.tag);
    expect(tage.filter((x) => x === DO)).toHaveLength(3);
    expect(tage.filter((x) => x === MI)).toHaveLength(1);
  });

  it('R5.6-AK1 genau 3 am Tag D → nichts vorgezogen', () => {
    const liste = viele(3, { faelligAm: DO });
    const m = verteilen(liste, MI, KEINE);
    expect(tageVon(m, liste)).toEqual([DO, DO, DO]);
    expect(liste.map((a) => lies(m, a).vorgezogenUm)).toEqual([0, 0, 0]);

    const t = fertig(mitWechsel(leer(), ['R-1.1', 'R-1.2', 'R-2.1']));
    expect(von(verteilt(t), 'loesung_wechseln')).toEqual([]);
    expect(verteilt(t)).toEqual(faellig(t));
  });

  it('R5.6-AK1 Station mit «mit 1. echte Blätter» am Stationstag (Abstand 0) → nicht vorgezogen', () => {
    // Plan 113 Punkt 10: drei Wechsel aus naechster_wechsel_am (nicht vorziehbar) am Do, Neuansatz 2.1.; Station 4.4
    // mit Neuansatz 31.12. (Wechsel nach Intervall am Do) und Eintritt 30.12. (1. echte Blätter am Do)
    const t = mitWechsel(leer(), ['R-1.1', 'R-1.2', 'R-2.1'], '2027-01-02', { naechsterWechselAm: DO });
    mitStation(t, '2026-12-31', '2026-12-30');
    fertig(t);
    const wechsel = einzig(von(alle(t), 'loesung_wechseln', platzId('R-4.4')), 'Wechsel 4.4 in alleAufgaben');
    expect(wechsel).toMatchObject({ faelligAm: DO, hinweis: 'mit 1. echte Blätter' });
    expect(fruehestens(wechsel)).toBe(DO);
    expect(von(alle(t), 'station_echte_blaetter')).toEqual([]);

    // Do ist voll, aber der Wechsel darf nicht vor den Stationstag
    expect(von(verteilt(t), 'loesung_wechseln')).toEqual([]);
    const amDo = von(verteilt(t, jetztAm(DO)), 'loesung_wechseln');
    expect(amDo).toHaveLength(4);
    expect(amDo.filter((a) => a.hinweis?.includes('vorgezogen'))).toEqual([]);
  });

  it('R5.6-AK1 Station mit «mit 1. echte Blätter» (Abstand 2) bis zum Stationstag vorgezogen → Hinweis «mit 1. echte Blätter · vorgezogen»', () => {
    // Station 4.4: Eintritt 29.12. → 1. echte Blätter heute (Mi); Neuansatz 1.1. → Wechsel Fr (Abstand 2); Do voll
    // (drei Vorgaben), Fr mit drei weiteren Vorgaben → der Stationswechsel geht auf D−2 = Mi = Stationstag
    const t = mitWechsel(leer(), ['R-1.1', 'R-1.2', 'R-1.3'], '2027-01-02', { naechsterWechselAm: DO });
    mitWechsel(t, ['R-2.1', 'R-2.2', 'R-2.3'], '2027-01-02', { naechsterWechselAm: FR });
    mitStation(t, '2027-01-01', '2026-12-29');
    fertig(t);
    const wechsel = einzig(von(alle(t), 'loesung_wechseln', platzId('R-4.4')), 'Wechsel 4.4 in alleAufgaben');
    expect(wechsel).toMatchObject({ faelligAm: FR, hinweis: 'mit 1. echte Blätter' });
    expect(fruehestens(wechsel)).toBe(MI);

    const a = einzig(von(verteilt(t), 'loesung_wechseln'), 'vorgezogene Station');
    expect(a).toMatchObject({
      schluessel: schluessel('loesung_wechseln', platzId('R-4.4'), FR),
      hinweis: 'mit 1. echte Blätter · vorgezogen',
      anzeigeAb: MI,
    });
  });

  it('R5.6-AK1 synthetisch: nie vor fruehestens', () => {
    // Do voll, Mi frei: mit fruehestens Do bleibt der Wechsel am Fr, mit fruehestens Mi wandert er auf Mi
    const voll = viele(3, { faelligAm: DO, vorziehbar: false });
    const fr = viele(3, { faelligAm: FR, vorziehbar: false });
    const gesperrt = aufgabe({ faelligAm: FR, fruehestens: DO });
    const m = verteilen([...voll, ...fr, gesperrt], MI, KEINE);
    expect(lies(m, gesperrt)).toMatchObject({ tag: FR, vorgezogenUm: 0 });
    expect(lies(m, gesperrt).ueberzahl).toBeDefined();

    const erlaubt = aufgabe({ faelligAm: FR, fruehestens: MI });
    const m2 = verteilen([...voll, ...fr, erlaubt], MI, KEINE);
    expect(lies(m2, erlaubt)).toMatchObject({ tag: MI, vorgezogenUm: 2 });
    expect([...m2.values()].every((v) => v.ueberzahl === undefined)).toBe(true);
  });

  it('R5.6-AK1 Station zählt als Ansatz, nicht vorziehbar: 3 Wechsel und Station am selben Tag → «4 Ansätze heute»', () => {
    // Plan 113 Punkt 11: Station 4.4 mit Eintritt 30.12. (1. echte Blätter Do) und Neuansatz 5.1. (Wechsel 19.1.,
    // Abstand 5, nicht zusammengelegt); drei Vorgaben am Do
    const t = mitWechsel(leer(), ['R-1.1', 'R-1.2', 'R-2.1'], '2027-01-02', { naechsterWechselAm: DO });
    mitStation(t, '2027-01-05', '2026-12-30');
    fertig(t);
    const station = einzig(von(alle(t), 'station_echte_blaetter', platzId('R-4.4')), 'Station 4.4');
    expect(station.faelligAm).toBe(DO);
    expect(vorziehbar(station)).toBeUndefined();

    expect(verteilt(t).filter((a) => a.hinweis?.includes('vorgezogen'))).toEqual([]);
    const amDo = verteilt(t, jetztAm(DO)).filter(
      (a) => a.typ === 'loesung_wechseln' || a.typ === 'station_echte_blaetter',
    );
    expect(amDo).toHaveLength(4);
    expect(amDo.filter((a) => a.hinweis === '4 Ansätze heute')).toHaveLength(1);
  });

  it('R5.6-AK1 TZ Wechsel am 28.3.2027 (Sommerzeit) auf den 27.3. vorgezogen, Tageszählung über kalendertag()', () => {
    const t = fertig(mitWechsel(leer(), VIER, '2027-03-14'));
    for (const jetzt of [jetztAm('2027-03-27', '09:00'), jetztAm('2027-03-27', '23:30')]) {
      const a = einzig(von(verteilt(t, jetzt), 'loesung_wechseln'), `Wechsel ${jetzt.toISOString()}`);
      expect(a).toMatchObject({ faelligAm: '2027-03-28', anzeigeAb: '2027-03-27', hinweis: 'vorgezogen' });
      expect(a.schluessel.endsWith('|2027-03-28')).toBe(true);
    }
    const m = verteilen(alle(t, jetztAm('2027-03-27')), '2027-03-27', KEINE);
    const tage = [...m.values()].map((v) => v.tag).sort();
    expect(tage).toEqual(['2027-03-27', '2027-03-28', '2027-03-28', '2027-03-28']);
  });
});

// ---------------------------------------------------------------- R5.6-AK2

describe('R5.6-AK2 Hinweis «n Ansätze heute»', () => {
  it('R5.6-AK2 beide Vortage voll → «4 Ansätze heute»', () => {
    const heute = viele(3, { faelligAm: MI, vorziehbar: false });
    const vortag = viele(3, { faelligAm: DO, vorziehbar: false });
    const tagD = viele(4, { faelligAm: FR });
    const m = verteilen([...heute, ...vortag, ...tagD], MI, KEINE);
    expect(tageVon(m, tagD)).toEqual([FR, FR, FR, FR]);
    expect(tagD.map((a) => lies(m, a).vorgezogenUm)).toEqual([0, 0, 0, 0]);
    expect(mitUeberzahl(m, tagD)).toHaveLength(1);
    expect(mitUeberzahl(m, [...heute, ...vortag])).toEqual([]);

    // Vortage vergangen: vier nicht vorziehbare Wechsel (naechster_wechsel_am) am Do, Stichtag Do
    const t = fertig(mitWechsel(leer(), VIER, '2027-01-02', { naechsterWechselAm: DO }));
    const liste = von(verteilt(t, jetztAm(DO)), 'loesung_wechseln');
    expect(liste).toHaveLength(4);
    expect(liste.filter((a) => a.hinweis === '4 Ansätze heute')).toHaveLength(1);
    expect(liste.filter((a) => a.hinweis === undefined)).toHaveLength(3);
  });

  it('R5.6-AK2 vier überfällige Ansätze heute → «4 Ansätze heute»', () => {
    // synthetisch: überfällige zählen auf heute, nie davor
    const ueber = viele(4, { faelligAm: '2027-01-10' });
    const m = verteilen(ueber, MI, KEINE);
    expect(tageVon(m, ueber)).toEqual([MI, MI, MI, MI]);
    expect(mitUeberzahl(m, ueber)).toHaveLength(1);

    // Neuansatz 28.12.2026 → Wechsel 11.1., am 13.1. seit 2 Tagen überfällig
    const t = fertig(mitWechsel(leer(), VIER, '2026-12-28'));
    const liste = von(verteilt(t), 'loesung_wechseln');
    expect(liste).toHaveLength(4);
    expect(liste.every((a) => a.tageUeberfaellig === 2)).toBe(true);
    expect(liste.filter((a) => a.hinweis === '4 Ansätze heute')).toHaveLength(1);
    expect(liste.filter((a) => a.hinweis === undefined)).toHaveLength(3);
  });

  it('R5.6-AK2 fünf überfällige Ansätze heute → zwei mit «5 Ansätze heute»', () => {
    const t = fertig(mitWechsel(leer(), [...VIER, 'R-2.3'], '2026-12-28'));
    const liste = von(verteilt(t), 'loesung_wechseln');
    expect(liste).toHaveLength(5);
    expect(liste.filter((a) => a.hinweis === '5 Ansätze heute')).toHaveLength(2);
    expect(liste.filter((a) => a.hinweis === undefined)).toHaveLength(3);
  });
});

describe('R5.6-AK2 Überzahl, Reihenfolge und Hinweise (Prüfer Runde 1 Befund 5)', () => {
  it('R5.6-AK2 Überzahl heute mit Neuansätzen von heute: 2 erfasst + 2 überfällig → genau einer «4 Ansätze heute»', () => {
    const t = mitWechsel(leer(), ['R-1.1', 'R-1.2'], MI);
    mitWechsel(t, ['R-2.1', 'R-2.2'], '2026-12-28');
    fertig(t);
    expect(ansaetzeHeute(t, MI_JETZT, ZONE).get(ANLAGE.R)).toBe(2);
    const liste = von(verteilt(t), 'loesung_wechseln');
    expect(liste).toHaveLength(2);
    expect(liste.filter((a) => a.hinweis === '4 Ansätze heute')).toHaveLength(1);

    const synth = viele(2, { faelligAm: '2027-01-11' });
    const m = verteilen(synth, MI, new Map([[ANLAGE.R, 2]]));
    expect(mitUeberzahl(m, synth)).toHaveLength(1);
  });

  it('R5.6-AK2 nicht vorziehbare zuerst gezählt: den Hinweis trägt die vorziehbare, auch wenn sie vorne steht', () => {
    // A2: alle heute, Vortage vergangen; die vorziehbare steht in der Liste vor den drei nicht vorziehbaren
    const vorz = aufgabe({ faelligAm: '2027-01-11' });
    const fest = viele(3, { faelligAm: '2027-01-11', vorziehbar: false });
    const m = verteilen([vorz, ...fest], MI, KEINE);
    expect(mitUeberzahl(m, [vorz, ...fest])).toEqual([vorz]);
  });

  it('R5.6-AK2 Tage aufsteigend ab heute abgearbeitet, unabhängig von der Eingabereihenfolge', () => {
    // heute 2 (nicht vorziehbar), Do 4, Fr 4; Eingabe Fr vor Do vor heute. Aufsteigend gibt Do einen an Mi ab
    // (Mi dann voll), Fr findet Do und Mi voll und bleibt mit Hinweis. Absteigend träfe der Hinweis den Do.
    const mi = viele(2, { faelligAm: MI, vorziehbar: false });
    const tagDo = viele(4, { faelligAm: DO });
    const tagFr = viele(4, { faelligAm: FR });
    const m = verteilen([...tagFr, ...tagDo, ...mi], MI, KEINE);
    expect(tageVon(m, tagDo).filter((x) => x === MI)).toHaveLength(1);
    expect(tageVon(m, tagDo).filter((x) => x === DO)).toHaveLength(3);
    expect(mitUeberzahl(m, tagDo)).toEqual([]);
    expect(tageVon(m, tagFr)).toEqual([FR, FR, FR, FR]);
    expect(mitUeberzahl(m, tagFr)).toHaveLength(1);
  });

  it('R5.6-AK2 Überzahl mit vorhandenem Hinweis → «mit 1. echte Blätter · 4 Ansätze heute»', () => {
    // Station 4.4: Eintritt 28.12. und Neuansatz 29.12. → Wechsel mit Station am 12.1. (Abstand 0), überfällig;
    // drei Vorgaben am 12.1. (nicht vorziehbar) → am Mi vier auf heute, die vorziehbare Station trägt den Hinweis
    const t = mitWechsel(leer(), ['R-1.1', 'R-1.2', 'R-2.1'], '2027-01-02', {
      naechsterWechselAm: '2027-01-12',
    });
    mitStation(t, '2026-12-29', '2026-12-28');
    fertig(t);
    const liste = von(verteilt(t), 'loesung_wechseln');
    expect(liste).toHaveLength(4);
    const a = einzig(von(liste, 'loesung_wechseln', platzId('R-4.4')), 'Wechsel 4.4');
    expect(a.hinweis).toBe('mit 1. echte Blätter · 4 Ansätze heute');
    expect(liste.filter((x) => x.hinweis === undefined)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------- R5.6-AK3

describe('R5.6-AK3 Reihenfolge und Merkmal vorziehbar', () => {
  it('R5.6-AK3 Wechsel nach Intervall vor Ansatz für Umsetzen', () => {
    // synthetisch: der Ansatz für Umsetzen steht in der Liste vorne, gezogen wird trotzdem ein Wechsel
    const umsetzen = aufgabe({ faelligAm: DO, typ: 'ansatz' });
    const wechsel = viele(3, { faelligAm: DO });
    const m = verteilen([umsetzen, ...wechsel], MI, KEINE);
    expect(lies(m, umsetzen)).toMatchObject({ tag: DO, vorgezogenUm: 0 });
    expect(tageVon(m, wechsel).filter((x) => x === MI)).toHaveLength(1);

    // mit Bündelteilen: 1.1 leer mit Reservierung (Ansatz für Umsetzen am Do), 1.2, 2.1, 2.2 Wechsel am Do
    const t = leer();
    boxDazu(t, 'R-A1', 'box_licht');
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
    netztopfDazu(t, 'R-1.1.1');
    const p = satzDazu(t, { nr: 1, sorte: 'lollo', box: 'R-A1', saat: '2026-12-24' });
    keimungDazu(t, p[0] ?? '', 2, zh('2026-12-28'));
    reservierungDazu(t, p[0] ?? '', 'R-1.1.1', DO);
    mitWechsel(t, ['R-1.2', 'R-2.1', 'R-2.2']);
    fertig(t);
    const ansatz = einzig(von(alle(t), 'ansatz', platzId('R-1.1')), 'Ansatz 1.1');
    expect(ansatz).toMatchObject({ titel: 'Ansatz für Umsetzen', faelligAm: DO });
    expect(vorziehbar(ansatz)).toBe(true);

    const heute = einzig(ansatzArt(verteilt(t)), 'vorgezogener Ansatz');
    expect(heute.typ).toBe('loesung_wechseln');
    expect(heute.hinweis).toBe('vorgezogen');
  });

  it('R5.6-AK3 Direktsaat nicht vorziehbar', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-2.3', betriebsart: 'dwc', luftpumpe: 'P2' });
    satzDazu(t, { nr: 6, sorte: 'lollo', direktsaat: 'R-2.3', saat: '2027-01-12' });
    fertig(t);
    const a = einzig(von(alleAufgaben(t, OHNE, JETZT, ZONE), 'ansatz', platzId('R-2.3')), 'Direktsaat');
    expect(a.titel).toBe('Ansatz für Direktsaat');
    expect(vorziehbar(a)).toBeUndefined();

    // synthetisch: vier Ansätze für Direktsaat am Tag D bleiben, einer trägt den Hinweis
    const direkt = viele(4, {
      faelligAm: DO,
      typ: 'ansatz',
      titel: 'Ansatz für Direktsaat',
      vorziehbar: false,
    });
    const m = verteilen(direkt, MI, KEINE);
    expect(tageVon(m, direkt)).toEqual([DO, DO, DO, DO]);
    expect(mitUeberzahl(m, direkt)).toHaveLength(1);
  });

  it('R5.6-AK3 naechster_wechsel_am nicht vorziehbar', () => {
    const t = fertig(mitWechsel(leer(), VIER, '2027-01-02', { naechsterWechselAm: DO }));
    const wechsel = von(alle(t), 'loesung_wechseln');
    expect(wechsel.map((a) => a.faelligAm)).toEqual([DO, DO, DO, DO]);
    expect(wechsel.map(vorziehbar)).toEqual([undefined, undefined, undefined, undefined]);
    // heute frei, aber nichts wird vorgezogen
    expect(von(verteilt(t), 'loesung_wechseln')).toEqual([]);

    // Gegenprobe: Termin nach Intervall ist vorziehbar
    const intervall = einzig(
      von(alle(vierAmDonnerstag()), 'loesung_wechseln', platzId('R-1.1')),
      'Intervall',
    );
    expect(vorziehbar(intervall)).toBe(true);
  });

  it('R5.6-AK3 Nachfüllsumme nicht vorziehbar', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', volumenL: 9 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-05'), typ: 'nachfuellen', nachgefuelltL: 5 });
    ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-08'), typ: 'nachfuellen', nachgefuelltL: 4 });
    fertig(t);
    const a = einzig(
      von(alleAufgaben(t, OHNE, JETZT, ZONE), 'loesung_wechseln', platzId('R-1.1')),
      'Wechsel aus Nachfüllsumme',
    );
    expect(a.faelligAm).toBe('2027-01-08');
    expect(vorziehbar(a)).toBeUndefined();
  });
});

// ---------------------------------------------------------------- R5.6-AK4

describe('R5.6-AK4 Grenzen des Vorziehens', () => {
  it('R5.6-AK4 höchstens zwei Tage, Vortag zuerst', () => {
    // D−1 mit 2, D−2 mit 0 → nach D−1
    const fr = viele(2, { faelligAm: FR, vorziehbar: false });
    const sa = viele(4, { faelligAm: SA });
    const m = verteilen([...fr, ...sa], MI, KEINE);
    const vor = sa.filter((a) => lies(m, a).tag !== SA);
    expect(lies(m, einzig(vor, 'vorgezogen nach D−1'))).toMatchObject({ tag: FR, vorgezogenUm: 1 });
    expect(tageVon(m, sa).filter((x) => x === DO)).toEqual([]);

    // D−1 und D−2 voll, heute (D−3) frei → bleibt am Tag D, nie drei Tage
    const zwei = [
      ...viele(3, { faelligAm: DO, vorziehbar: false }),
      ...viele(3, { faelligAm: FR, vorziehbar: false }),
    ];
    const sa2 = viele(4, { faelligAm: SA });
    const m2 = verteilen([...zwei, ...sa2], MI, KEINE);
    expect(tageVon(m2, sa2)).toEqual([SA, SA, SA, SA]);
    expect(mitUeberzahl(m2, sa2)).toHaveLength(1);
  });

  it('R5.6-AK4 D−1 voll, D−2 frei → nach D−2', () => {
    const fr = viele(3, { faelligAm: FR, vorziehbar: false });
    const sa = viele(4, { faelligAm: SA });
    const m = verteilen([...fr, ...sa], MI, KEINE);
    const vor = sa.filter((a) => lies(m, a).tag !== SA);
    expect(lies(m, einzig(vor, 'vorgezogen nach D−2'))).toMatchObject({ tag: DO, vorgezogenUm: 2 });
    expect(mitUeberzahl(m, sa)).toEqual([]);
  });

  it('R5.6-AK4 D = heute + 2, heute voll, heute + 1 frei → nach heute + 1', () => {
    const heute = viele(3, { faelligAm: MI, vorziehbar: false });
    const fr = viele(4, { faelligAm: FR });
    const m = verteilen([...heute, ...fr], MI, KEINE);
    const vor = fr.filter((a) => lies(m, a).tag !== FR);
    expect(lies(m, einzig(vor, 'vorgezogen nach heute + 1'))).toMatchObject({ tag: DO, vorgezogenUm: 1 });
  });

  it('R5.6-AK4 nie vor heute', () => {
    // D = heute + 1, heute voll, D−2 vergangen → bleibt
    const heute = viele(3, { faelligAm: MI, vorziehbar: false });
    const tagD = viele(4, { faelligAm: DO });
    const m = verteilen([...heute, ...tagD], MI, KEINE);
    expect(tageVon(m, tagD)).toEqual([DO, DO, DO, DO]);
    expect(mitUeberzahl(m, tagD)).toHaveLength(1);
    // überfällige zählen auf heute, kein Tag vor heute
    const alt = viele(2, { faelligAm: '2027-01-11' });
    const m2 = verteilen([...alt, ...viele(4, { faelligAm: MI })], MI, KEINE);
    expect([...m2.values()].every((v) => v.tag >= MI)).toBe(true);
  });

  it('R5.6-AK4 je Anlage getrennt', () => {
    // Demo X mit 3 am heutigen Tag zählt nicht für R
    const x = viele(3, { faelligAm: MI, anlage: ANLAGE.X, vorziehbar: false });
    const r = viele(4, { faelligAm: DO });
    const m = verteilen([...x, ...r], MI, new Map([[ANLAGE.X, 3]]));
    expect(tageVon(m, r).filter((t) => t === MI)).toHaveLength(1);
    expect(tageVon(m, x)).toEqual([MI, MI, MI]);

    // Datenart demo und echt am selben Tag getrennt gezählt: 2 in R und 2 in X am Do → nichts vorgezogen
    const t = fertig(mitWechsel(leer(), ['R-1.1', 'R-1.2', 'X-1.1', 'X-1.2']));
    expect(von(alle(t), 'loesung_wechseln').map((a) => a.faelligAm)).toEqual([DO, DO, DO, DO]);
    expect(von(verteilt(t), 'loesung_wechseln')).toEqual([]);
  });

  it('R5.6-AK4 nach Morgen nicht vorgezogen', () => {
    // «Morgen» am Mi: fällig Mi, angezeigt ab Do; mit drei nicht vorziehbaren am Do wandert sie nicht zurück
    const morgen = aufgabe({ faelligAm: MI, anzeigeAb: DO });
    const tagD = viele(3, { faelligAm: DO, vorziehbar: false });
    const m = verteilen([morgen, ...tagD], MI, KEINE);
    expect(lies(m, morgen)).toMatchObject({ tag: DO, vorgezogenUm: 0 });
    expect(tageVon(m, tagD)).toEqual([DO, DO, DO]);
  });
});

// ---------------------------------------------------------------- R5.6-AK5

describe('R5.6-AK5 Schlüssel, Erledigung und Last von heute', () => {
  it('R5.6-AK5 Schlüssel unverändert', () => {
    const t = vierAmDonnerstag();
    const a = einzig(von(verteilt(t), 'loesung_wechseln'), 'vorgezogen');
    const original = einzig(
      alle(t).filter((x) => x.schluessel === a.schluessel),
      'gleicher Schlüssel in alleAufgaben',
    );
    expect(a.faelligAm).toBe(original.faelligAm);
    expect({ ...a, anzeigeAb: original.anzeigeAb, hinweis: original.hinweis }).toEqual(original);
  });

  it('R5.6-AK5 vorgezogener Wechsel nach Neuansatz erledigt', () => {
    const t = vierAmDonnerstag();
    const a = einzig(von(verteilt(t), 'loesung_wechseln'), 'vorgezogen');
    const platz = a.bezug;
    const code = einzig(
      VIER.filter((c) => platzId(c) === platz),
      'Code des vorgezogenen Wechsels',
    );
    // Neuansatz am Vortag von D (heute 10:00)
    ansatzDazu(t, code, { begonnen: zh(MI, '10:00') });
    fertig(t);
    expect(von(verteilt(t, jetztAm(MI, '11:00')), 'loesung_wechseln')).toEqual([]);

    // am Do: die übrigen drei, ohne Hinweis; der erledigte erscheint nicht wieder
    const amDo = von(verteilt(t, jetztAm(DO)), 'loesung_wechseln');
    expect(amDo).toHaveLength(3);
    expect(amDo.map((x) => x.bezug)).not.toContain(platz);
    expect(amDo.map((x) => x.hinweis)).toEqual([undefined, undefined, undefined]);
    expect(von(alle(t, jetztAm(DO)), 'loesung_wechseln', platz).map((x) => x.faelligAm)).toEqual([
      '2027-01-27',
    ]);
  });

  it('R5.6-AK5 drei Neuansätze heute → nichts rutscht nach', () => {
    const t = mitWechsel(leer(), VIER);
    mitWechsel(t, ['R-1.3', 'R-1.4', 'R-2.3'], MI);
    fertig(t);
    expect(ansaetzeHeute(t, MI_JETZT, ZONE).get(ANLAGE.R)).toBe(3);
    expect(von(verteilt(t), 'loesung_wechseln')).toEqual([]);

    // synthetisch: bereitsHeute 3 → heute voll
    const tagD = viele(4, { faelligAm: DO });
    const m = verteilen(tagD, MI, new Map([[ANLAGE.R, 3]]));
    expect(tageVon(m, tagD)).toEqual([DO, DO, DO, DO]);
  });

  it('R5.6-AK5 ansaetzeHeute: Kalendertag Zürich, ohne Storno, Abbruch, Nachfüllen; je Anlage', () => {
    const t = leer();
    for (const code of ['R-1.1', 'R-1.2', 'R-2.1', 'X-1.1']) gefaessDazu(t, { code, betriebsart: 'dwc' });
    ansatzDazu(t, 'R-1.1', { begonnen: zh(MI, '00:30') });
    ansatzDazu(t, 'R-1.2', { begonnen: zh('2027-01-12', '23:30') });
    ansatzDazu(t, 'R-1.2', { begonnen: zh(MI, '08:00'), status: 'abgebrochen' });
    const storniert = ansatzDazu(t, 'R-2.1', { begonnen: zh(MI, '08:10') });
    for (const z of t['naehrloesungsansatz'] ?? [])
      if (z['id'] === storniert) z['storniert_am'] = zh(MI, '08:20');
    ansatzDazu(t, 'R-2.1', { begonnen: zh(MI, '08:30'), typ: 'nachfuellen', nachgefuelltL: 2 });
    ansatzDazu(t, 'X-1.1', { begonnen: zh(MI, '08:00') });
    fertig(t);
    const n = ansaetzeHeute(t, MI_JETZT, ZONE);
    expect(n.get(ANLAGE.R)).toBe(1);
    expect(n.get(ANLAGE.X)).toBe(1);
  });
});

// ---------------------------------------------------------------- R5.6-AK6

describe('R5.6-AK6 faelligeAufgaben unverändert, deterministisch', () => {
  it('R5.6-AK6 ohne Überlast gleich faelligeAufgaben', () => {
    const t = grundstand();
    expect(verteilt(t, JETZT).map((a) => a.schluessel)).toEqual(ERWARTETE_SCHLUESSEL);
    for (const jetzt of [JETZT, jetztAm(MI), jetztAm(MI, '23:30')])
      expect(verteilt(t, jetzt), jetzt.toISOString()).toEqual(faellig(t, jetzt));
    // faelligeAufgaben() bleibt bei Überlast die unverteilte Liste (R5.1)
    const s9 = vierAmDonnerstag();
    expect(von(faellig(s9), 'loesung_wechseln')).toEqual([]);
    expect(von(verteilt(s9), 'loesung_wechseln')).toHaveLength(1);
  });

  it('R5.6-AK6 deterministisch', () => {
    const t = fertig(mitWechsel(mitWechsel(leer(), VIER), ['R-2.3', 'R-4.1'], '2027-01-01'));
    const erste = verteilt(t);
    const zweite = verteilt(structuredClone(t));
    expect(zweite).toEqual(erste);
    const liste = alle(t);
    expect([...verteilen(liste, MI, KEINE).entries()]).toEqual([...verteilen(liste, MI, KEINE).entries()]);
  });
});

// ---------------------------------------------------------------- UC8-AK6

describe('UC8-AK6 Kalibrieren mit Morgen', () => {
  it('UC8-AK6 Erstkalibrierung mit Morgen', () => {
    // Plan 113 Punkt 12: Konzept R5.2 «Messgerät kalibrieren»: Morgen ja, auch bei der Erstkalibrierung
    const t = fertig(leer());
    const erst = einzig(von(verteilt(t, JETZT, OHNE), 'kalibrieren', MESSGERAET), 'Erstkalibrierung');
    expect(erst.titel).toBe('Erstkalibrierung');
    expect(erst.morgen.erlaubt).toBe(true);
    expect(einzig(von(faellig(t, JETZT, OHNE), 'kalibrieren'), 'faellig').morgen.erlaubt).toBe(true);

    // Kalibrierung vor 30 Tagen → «Messgerät kalibrieren» mit Morgen
    kalibrierungDazu(t, zh('2026-12-13'));
    fertig(t);
    const faelligK = einzig(von(verteilt(t, JETZT, OHNE), 'kalibrieren', MESSGERAET), 'Kalibrieren');
    expect(faelligK).toMatchObject({ titel: 'Messgerät kalibrieren', faelligAm: '2027-01-12' });
    expect(faelligK.morgen.erlaubt).toBe(true);
  });
});
