// Abschlussliste des Rundgangs (Plan 30 Testliste; Rundgang-AK2; R10.1, R10.2, R10.4, R10.5; A5, A8): genau die
// Werte «Knapp daneben» und «Ausserhalb» und die Kurzprüfungen mit Abweichung, mit Massnahme und Knopf; Kopf
// «Fertig: x von n · g im grünen Bereich · k korrigieren». Stand aus dem Ablauf mit Plänen von Hand
// (rundgang-fixture.ts); Bewertung mit bewerten() gegen das Sollband pH 6.0–6.5, EC 1.0–1.4, 18–22 °C bei u_EC 0.10
// und u_pH 0.10 (Hundertstel, G3). Uhr Di 12.1.2027 09:00 Zürich.
import { describe, expect, it } from 'vitest';
import { bewerten } from '../../src/domain/bewertung/bewertung.ts';
import type { Sollband } from '../../src/domain/bewertung/sollband.ts';
import type { Groesse } from '../../src/domain/messung/eingabe.ts';
import { abschlussKopf, abschlussliste, type AbschlussZeile } from '../../src/domain/rundgang/abschluss.ts';
import {
  amEnde,
  nachKurzpruefung,
  nachMessung,
  naechsterSchritt,
  rundgangBeenden,
  rundgangStart,
  type RundgangStand,
} from '../../src/domain/rundgang/ablauf.ts';
import type { RundgangPlan } from '../../src/domain/rundgang/plan.ts';
import {
  JETZT,
  kurzpruefungErgebnis,
  ortVon,
  planVon,
  platzId,
  regal,
  uid,
  type Teile,
} from './rundgang-fixture.ts';
import { fertig, kurzpruefungDazu } from './aufgaben-fixture.ts';

const SOLLBAND: Sollband = {
  ph: { min: 600, max: 650 },
  ec: { min: 100, max: 140 },
  temperatur: { min: 1800, max: 2200 },
  herkunft: 'pflanzungen',
};
const GERAET = { uEc: 10, uPh: 10 };
const GRUEN_WERTE: Partial<Record<Groesse, number>> = { ph: 620, ec: 120, temperatur: 2000 };

type Werte = Partial<Record<Groesse, number>>;

function weiter(s: RundgangStand): RundgangStand {
  let x = s;
  for (let i = 0; i < 5 && x.schritt.art === 'kennung'; i += 1) x = naechsterSchritt(x, JETZT);
  return x;
}

/**
 * Rundgang durch den Plan: je Ebene Kurzprüfung (Abweichungen «platzId|punkt»), je Ort mit Mess-Aufgabe eine
 * Messung mit den Werten aus `werte` (sonst grün), Kratky über ⅓, Halt mit «Am Ende». `bisOrte` bricht nach so
 * vielen gemessenen Orten mit «Rundgang beenden» ab.
 */
function rundgang(
  plan: RundgangPlan,
  werte: Readonly<Record<string, Werte>> = {},
  o: { abweichungen?: readonly string[]; bisOrte?: number } = {},
): RundgangStand {
  let s = rundgangStart(plan, JETZT);
  let gemessen = 0;
  for (let e = 0; e < plan.ebenen.length; e += 1) {
    expect(s.schritt).toEqual({ art: 'kurzpruefung', ebene: e });
    s = weiter(nachKurzpruefung(s, kurzpruefungErgebnis(plan, e, o.abweichungen), JETZT));
    for (const ort of plan.ebenen[e]?.orte ?? []) {
      if (!ort.messAufgabe) continue;
      if (o.bisOrte !== undefined && gemessen >= o.bisOrte) return rundgangBeenden(s, JETZT);
      const w = { ...GRUEN_WERTE, ...(werte[ort.code] ?? {}) };
      s = nachMessung(
        s,
        {
          messungId: uid('e9', `${ort.code}#${gemessen}`),
          werte: w,
          bewertungen: bewerten(w, SOLLBAND, GERAET),
          ...((ort.betriebsart ?? '').startsWith('kratky') ? { fuellstand: 'ueber_drittel' as const } : {}),
          nachfuellen: false,
        },
        JETZT,
      );
      gemessen += 1;
      if (s.schritt.art === 'halt') s = amEnde(s, JETZT);
      s = weiter(s);
    }
  }
  expect(s.schritt).toEqual({ art: 'abschluss' });
  return s;
}

/** Ebene 3: 3.1 Kratky belüftet; Ebene 2: 2.1 Konstantpegel; Ebene 1: 1.1 DWC */
const DREI = (): RundgangPlan =>
  planVon([
    { nr: 3, orte: [ortVon('R-3.1')] },
    { nr: 2, orte: [ortVon('R-2.1')] },
    { nr: 1, orte: [ortVon('R-1.1')] },
  ]);
const NUR_11 = (): RundgangPlan => planVon([{ nr: 1, orte: [ortVon('R-1.1')] }]);
const NUR_31 = (): RundgangPlan => planVon([{ nr: 3, orte: [ortVon('R-3.1')] }]);

const liste = (stand: RundgangStand, t: Teile = regal()) => abschlussliste(stand, { teile: t });
const kurz = (z: readonly AbschlussZeile[]) => z.map((x) => `${x.code} ${x.art} ${x.groesse ?? '-'}`);

describe('Abschlussliste', () => {
  it('Rundgang-AK2 Abschlussliste enthält genau die Werte «Knapp daneben» und «Ausserhalb» und alle Kurzprüfungen mit Abweichung', () => {
    const plan = DREI();
    const stand = rundgang(
      plan,
      {
        'R-3.1': { ph: 670 },
        'R-2.1': { ec: 145 },
        'R-1.1': { ec: 160, temperatur: 2500 },
      },
      { abweichungen: [`${platzId('R-2.1')}|pumpe`] },
    );
    const z = liste(stand);
    expect(kurz(z)).toEqual([
      'R-3.1 wert ph',
      'R-2.1 kurzpruefung -',
      'R-2.1 wert ec',
      'R-1.1 wert ec',
      'R-1.1 wert temperatur',
    ]);
    expect(z.map((x) => x.bewertung)).toEqual(['knapp', undefined, 'knapp', 'ausserhalb', 'ausserhalb']);
    expect(z[0]?.text).toBe('3.1 pH 6.7 Knapp daneben');
    expect(z[2]?.text).toBe('2.1 EC 1.45 Knapp daneben');
    expect(z[3]?.text).toBe('1.1 EC 1.60 Ausserhalb');
    expect(z[4]?.text).toContain('25.0');
    expect(z[4]?.text).toContain('Ausserhalb');
    expect(z[1]?.text).toContain('2.1 Pumpe sprudelt nicht');
    expect(z[1]?.text).toContain('Belüftung prüfen');
    expect(z.map((x) => x.platzId)).toEqual(
      ['R-3.1', 'R-2.1', 'R-2.1', 'R-1.1', 'R-1.1'].map((c) => platzId(c)),
    );
  });

  it('Rundgang-AK2 Werte im grünen Bereich und Kurzprüfungen mit ok erscheinen nicht', () => {
    expect(liste(rundgang(DREI()))).toEqual([]);
    // gemischt: nur der Wert ausserhalb des Bands und die eine Abweichung
    const z = liste(
      rundgang(
        DREI(),
        { 'R-2.1': { ph: 640, ec: 100, temperatur: 2200 }, 'R-1.1': { ec: 90 } },
        {
          abweichungen: [`${platzId('R-3.1')}|luftzone`],
        },
      ),
    );
    expect(kurz(z)).toEqual(['R-3.1 kurzpruefung -', 'R-1.1 wert ec']);
    expect(z[0]?.text).toContain('3.1');
    expect(z[0]?.text).toContain('Luftzone');
  });

  it('Rundgang-AK2 mitmarkierte Gefässe ohne eigene Abweichung erscheinen nicht', () => {
    // 4.5 (Konstantpegel an P3) mit «Pumpe sprudelt nicht»; 3.1 und 3.2 an derselben Pumpe sind nur mitmarkiert
    const t = regal();
    kurzpruefungDazu(t, 'R-4.5', JETZT.toISOString(), 'pumpe', false);
    fertig(t);
    const plan = planVon([
      { nr: 4, orte: [ortVon('R-4.5', false)] },
      { nr: 3, orte: [ortVon('R-3.1'), ortVon('R-3.2', false)] },
    ]);
    const z = liste(rundgang(plan, {}, { abweichungen: [`${platzId('R-4.5')}|pumpe`] }), t);
    expect(kurz(z)).toEqual(['R-4.5 kurzpruefung -']);
  });

  it.each([
    [140, undefined],
    [141, 'knapp'],
    [151, 'knapp'],
    [152, 'ausserhalb'],
    [90, 'knapp'],
    [89, 'ausserhalb'],
  ] as const)(
    'Rundgang-AK2 Grenzen R10.1 bei 1.0–1.4, u 0.10: EC 1.40 fehlt, 1.41 und 1.51 «Knapp daneben», 1.52 «Ausserhalb» (EC %i → %s)',
    (ec, erwartet) => {
      const z = liste(rundgang(NUR_11(), { 'R-1.1': { ec } }));
      const zeile = z.filter((x) => x.groesse === 'ec');
      if (erwartet === undefined) {
        expect(z).toEqual([]);
        return;
      }
      expect(zeile).toHaveLength(1);
      expect(zeile[0]?.bewertung).toBe(erwartet);
      const text = `1.1 EC ${(ec / 100).toFixed(2)} ${erwartet === 'knapp' ? 'Knapp daneben' : 'Ausserhalb'}`;
      expect(zeile[0]?.text).toBe(text);
    },
  );

  it('Rundgang-AK2 R10.4 Kratky belüftet 3.1 pH 6.7 «Knapp daneben» steht in der Liste, 6.6 nicht', () => {
    const knapp = liste(rundgang(NUR_31(), { 'R-3.1': { ph: 670 } }));
    expect(kurz(knapp)).toEqual(['R-3.1 wert ph']);
    expect(knapp[0]).toMatchObject({ bewertung: 'knapp', text: '3.1 pH 6.7 Knapp daneben' });
    expect(liste(rundgang(NUR_31(), { 'R-3.1': { ph: 660 } }))).toEqual([]);
  });

  it('Rundgang-AK2 Kopf «Fertig: 3 von 3 · 1 im grünen Bereich · 2 korrigieren»; abgebrochen «Fertig: 2 von 3 …»', () => {
    const werte = { 'R-3.1': { ph: 670 }, 'R-1.1': { ec: 152 } };
    const voll = rundgang(DREI(), werte);
    expect(abschlussKopf(voll, liste(voll))).toBe('Fertig: 3 von 3 · 1 im grünen Bereich · 2 korrigieren');

    const ab = rundgang(DREI(), werte, { bisOrte: 2 });
    expect(ab.schritt).toEqual({ art: 'abschluss' });
    expect(abschlussKopf(ab, liste(ab))).toBe('Fertig: 2 von 3 · 1 im grünen Bereich · 1 korrigieren');

    const gruen = rundgang(DREI());
    expect(abschlussKopf(gruen, liste(gruen))).toBe('Fertig: 3 von 3 · 3 im grünen Bereich · 0 korrigieren');
  });

  it('Rundgang-AK2 Massnahme je Zeile aus R10.5 und Knopf «pH korrigieren» nur bei pH über dem Ziel', () => {
    const stand = rundgang(
      DREI(),
      {
        'R-3.1': { ph: 670 },
        'R-2.1': { ph: 680 },
        'R-1.1': { ph: 580, ec: 152 },
      },
      { abweichungen: [`${platzId('R-2.1')}|pumpe`] },
    );
    const z = liste(stand);
    const zeile = (code: string, art: 'wert' | 'kurzpruefung', groesse?: Groesse) =>
      z.find((x) => x.code === code && x.art === art && (groesse === undefined || x.groesse === groesse));

    expect(zeile('R-2.1', 'wert', 'ph')).toMatchObject({
      bewertung: 'ausserhalb',
      massnahme: 'pH schrittweise senken, nach 15 min nachmessen',
      knopf: { text: 'pH korrigieren', route: 'messen' },
    });
    expect(zeile('R-3.1', 'wert', 'ph')?.knopf).toEqual({ text: 'pH korrigieren', route: 'messen' });
    expect(zeile('R-1.1', 'wert', 'ph')).toMatchObject({
      bewertung: 'knapp',
      massnahme: 'pH vorsichtig anheben',
      knopf: { text: 'Gefäss öffnen', route: 'gefaess' },
    });
    expect(zeile('R-1.1', 'wert', 'ec')).toMatchObject({
      bewertung: 'ausserhalb',
      massnahme: 'Teilwechsel; Verdünnen mit Leitungswasser hebt den pH',
      knopf: { text: 'Gefäss öffnen', route: 'gefaess' },
    });
    const pumpe = zeile('R-2.1', 'kurzpruefung');
    expect(pumpe?.knopf).toEqual({ text: 'Gefäss öffnen', route: 'gefaess' });
    expect(pumpe?.massnahme).toContain('Pumpe, Schlauch und Luftstein prüfen');
    // «pH korrigieren» genau bei den beiden pH-Werten über dem Ziel
    expect(
      z
        .filter((x) => x.knopf.text === 'pH korrigieren')
        .map((x) => `${x.code} ${x.groesse}`)
        .sort(),
    ).toEqual(['R-2.1 ph', 'R-3.1 ph']);
  });
});
