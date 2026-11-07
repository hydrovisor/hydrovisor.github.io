// Lead-Tests Runde 1 (Plan 30, Prüfer Fachlogik Runde 1): Grenzfälle «Nach Stromausfall» (Befund 4, 6), Licht und
// Lüfter als Abweichung (Befund 2), Teilkanne (Befund 1) und Positionen beim Kratky-Nachfüllen (Befund 3).
// Uhr Di 12.1.2027 09:00 Zürich; Fixtures wie die Tests des Testentwicklers, ohne deren Dateien zu ändern.
import { describe, expect, it } from 'vitest';
import { stromausfallVorgang } from '../../src/domain/aufgaben-stromausfall.ts';
import { alleAufgaben, einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { abschlussKopf, abschlussliste } from '../../src/domain/rundgang/abschluss.ts';
import { nachKurzpruefung, rundgangBeenden, rundgangStart } from '../../src/domain/rundgang/ablauf.ts';
import { kurzpruefungVorgang } from '../../src/domain/rundgang/kurzpruefung.ts';
import {
  kratkyErgebnis,
  nachfuellSchritt,
  nachfuellVorgang,
  type MessungZeile,
} from '../../src/domain/rundgang/nachfuellen.ts';
import { platzId as platzIdRegal } from '../fixtures/regal.ts';
import { JETZT as JETZT_RG, rundgangMessungDazu, rundgangTeile } from '../fixtures/rundgang.ts';
import {
  ANLAGE,
  JETZT,
  ZONE,
  bereichEreignisDazu,
  bereichId,
  jetztAm,
  kurzpruefungErgebnis,
  ortVon,
  planVon,
  platzId,
  regal,
  stromausfallDazu,
  uid,
  zh,
  type Teile,
} from './rundgang-fixture.ts';
import { fertig, kurzpruefungDazu, messungDazu } from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const codes = (l: readonly Aufgabe[], typ: string) =>
  l
    .filter((a) => a.typ === typ)
    .map((a) => a.ort?.code ?? a.bezug)
    .sort();
const MIT_LOESUNG = ['R-1.1', 'R-2.1', 'R-3.1', 'R-3.2', 'R-3.3', 'R-4.4', 'R-4.5'];

/** 8 h: 11.1. 23:00 bis 12.1. 07:00 */
function achtStunden(): Teile {
  const t = regal();
  stromausfallDazu(t, { beginn: zh('2027-01-11', '23:00'), ende: zh('2027-01-12', '07:00') });
  return fertig(t);
}

describe('Nach Stromausfall, Grenzfälle (Runde 1)', () => {
  it('R5.2 Erfassung vor dem Ende des Ausfalls erledigt nichts, genau am Ende schon', () => {
    const t = achtStunden();
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-12', '06:59'), temperatur: 19.0 });
    messungDazu(t, 'R-2.1', { gilt: zh('2027-01-12', '07:00'), temperatur: 19.0 });
    fertig(t);
    expect(codes(faellig(t), 'strom_wassertemperatur')).toEqual(MIT_LOESUNG.filter((c) => c !== 'R-2.1'));
  });

  it('R5.2 Messung ohne Temperatur erledigt «Wassertemperatur messen» nicht', () => {
    const t = achtStunden();
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-12', '08:00') });
    const m = (t['messung'] ?? []).at(-1) as Record<string, unknown>;
    m['temperatur'] = null;
    fertig(t);
    expect(codes(faellig(t), 'strom_wassertemperatur')).toContain('R-1.1');
  });

  it('R5.2 Sammel-Tipp «luefter» erledigt «AC10-Zeitplan und Licht» nicht; «licht» mit Abweichung auch nicht', () => {
    const t = achtStunden();
    for (const ebene of [1, 2, 3, 4]) bereichEreignisDazu(t, ebene, 'luefter', zh('2027-01-12', '08:00'));
    fertig(t);
    expect(codes(faellig(t), 'strom_ac10_licht')).toEqual([ANLAGE.R]);
    for (const ebene of [1, 2, 3]) bereichEreignisDazu(t, ebene, 'licht', zh('2027-01-12', '08:05'));
    bereichEreignisDazu(t, 4, 'licht', zh('2027-01-12', '08:05'), false);
    fertig(t);
    expect(codes(faellig(t), 'strom_ac10_licht')).toEqual([ANLAGE.R]);
    bereichEreignisDazu(t, 4, 'licht', zh('2027-01-12', '08:10'));
    fertig(t);
    expect(codes(faellig(t), 'strom_ac10_licht')).toEqual([]);
  });

  it('R5.2 «Pumpen prüfen»: Kratky belüftet zählt mit Luftzone oder Topfboden, Kratky ohne Pumpe und leere Gefässe zählen nicht', () => {
    const t = achtStunden();
    for (const code of ['R-1.1', 'R-2.1', 'R-4.4', 'R-4.5'])
      kurzpruefungDazu(t, code, zh('2027-01-12', '08:00'), 'pumpe');
    kurzpruefungDazu(t, 'R-3.1', zh('2027-01-12', '08:00'), 'luftzone');
    fertig(t);
    expect(codes(faellig(t), 'strom_pumpen')).toEqual([ANLAGE.R]);
    kurzpruefungDazu(t, 'R-3.2', zh('2027-01-12', '08:00'), 'loesung_topfboden');
    fertig(t);
    // 3.3 ohne Pumpe und 2.2 leer zählen nicht
    expect(codes(faellig(t), 'strom_pumpen')).toEqual([]);
  });

  it('R5.2 Anlage ohne Gefäss mit Pumpe und ohne Bereich mit Kurzprüfung: Folgeaufgaben bleiben offen', () => {
    const t = regal();
    for (const s of t['v_fuellzustand'] ?? []) (s as Record<string, unknown>)['fuellzustand'] = 'leer';
    for (const p of t['v_pflanzung_zustand'] ?? [])
      (p as Record<string, unknown>)['status'] = 'abgeschlossen';
    stromausfallDazu(t, { beginn: zh('2027-01-11', '23:00'), ende: zh('2027-01-12', '07:00') });
    const l = alle(t);
    expect(codes(l, 'strom_pumpen')).toEqual([ANLAGE.R]);
    expect(codes(l, 'strom_ac10_licht')).toEqual([ANLAGE.R]);
    expect(codes(l, 'strom_wassertemperatur')).toEqual([]);
  });

  it('R5.1 stromausfallVorgang: Ende gleich Beginn und Beginn gleich jetzt sind erlaubt', () => {
    const id = uid('f9', 'strom');
    expect(stromausfallVorgang({ anlageId: ANLAGE.R, beginn: JETZT, ende: JETZT }, id, JETZT)).toHaveLength(
      1,
    );
    const v = stromausfallVorgang(
      { anlageId: ANLAGE.R, beginn: jetztAm('2027-01-12', '08:00'), ende: JETZT },
      id,
      JETZT,
    );
    expect(v[0]?.felder).toMatchObject({
      typ: 'stromausfall',
      anlage_id: ANLAGE.R,
      gilt_ab: JETZT.toISOString(),
    });
  });
});

describe('Licht und Lüfter im Rundgang (Runde 1)', () => {
  it('Rundgang-AK2 Licht aus am Bereich steht in der Abschlussliste mit Knopf «Anlage öffnen»', () => {
    const plan = planVon([{ nr: 1, orte: [ortVon('R-1.1')] }]);
    const ergebnisse = kurzpruefungErgebnis(plan, 0).map((e) =>
      e.punkt === 'licht' ? { ...e, ok: false } : e,
    );
    const stand = rundgangBeenden(nachKurzpruefung(rundgangStart(plan, JETZT), ergebnisse, JETZT), JETZT);
    const z = abschlussliste(stand, { teile: regal(), zeitzone: ZONE });
    expect(z).toHaveLength(1);
    expect(z[0]).toMatchObject({
      platzId: bereichId(1),
      code: 'Ebene 1',
      art: 'kurzpruefung',
      text: 'Ebene 1 Licht aus',
      knopf: { text: 'Anlage öffnen', route: 'anlage' },
    });
    // Runde 2 N2: die Zeile am Bereich zählt zu «korrigieren»
    expect(abschlussKopf(stand, z)).toBe('Fertig: 0 von 1 · 0 im grünen Bereich · 1 korrigieren');
  });

  it('R5.2 kurzpruefungVorgang mit «bereich|licht» schreibt Licht mit ok false, Lüfter ok', () => {
    const plan = planVon([{ nr: 2, orte: [ortVon('R-2.1')] }]);
    const e = plan.ebenen[0];
    if (!e) throw new Error('Ebene fehlt');
    let n = 0;
    const v = kurzpruefungVorgang(
      e,
      new Set([`${bereichId(2)}|licht`]),
      () => uid('fa', String((n += 1))),
      JETZT,
    );
    const am = (punkt: string) =>
      v.find((s) => (s.felder['daten'] as { punkt: string }).punkt === punkt)?.felder['daten'];
    expect(am('licht')).toMatchObject({ ok: false });
    expect(am('luefter')).toMatchObject({ ok: true });
  });
});

describe('Nachfüllen mit Teilkanne und Kratky (Runde 1)', () => {
  const P21 = platzIdRegal('2.1');
  const P31 = platzIdRegal('3.1');

  it('R4.9 Rundgang 1.5 Kannen à 10 l: 15 l, Mengen zwischen 10 l und 20 l', () => {
    const t = rundgangTeile({ orte: ['2.1'] });
    const m = rundgangMessungDazu(t, { kennung: '2.1', ec: 1.1 }) as unknown as MessungZeile;
    const mengen = (liter: number) => {
      const r = nachfuellSchritt(t, P21, m, liter, JETZT_RG, ZONE);
      if (!('mengen' in r)) throw new Error('neue Messung nötig');
      return r.mengen.grow;
    };
    expect(mengen(15)).toBeGreaterThan(mengen(10));
    expect(mengen(15)).toBeLessThan(mengen(20));
    const v = nachfuellVorgang({ platzId: P21, liter: 15, volumenL: 30 }, () => uid('fb', '1'), JETZT_RG);
    expect(v[0]).toMatchObject({ felder: { typ: 'nachfuellen', nachgefuellt_l: 15 } });
    expect(
      nachfuellVorgang({ platzId: P21, liter: 0, volumenL: 30 }, () => uid('fb', '2'), JETZT_RG),
    ).toEqual([]);
  });

  it('R4.10 Kratky halbe Konzentration: Positionen mit Mengen für die nachgefüllten Liter; nur Wasser ohne', () => {
    const t = rundgangTeile({ orte: ['3.1'] });
    const halb = rundgangMessungDazu(t, {
      kennung: '3.1',
      ec: 1.0,
      fuellstand: 'unter_drittel',
      nr: 95,
    }) as unknown as MessungZeile;
    const r = kratkyErgebnis(t, P31, halb, 2, ZONE);
    expect(r?.nurWasser).toBe(false);
    expect(
      (r?.mengen.grow ?? 0) + (r?.mengen.micro_hard_water ?? 0) + (r?.mengen.bloom ?? 0),
    ).toBeGreaterThan(0);
    const doppelt = kratkyErgebnis(t, P31, halb, 4, ZONE);
    expect(doppelt?.mengen.grow ?? 0).toBeGreaterThan(r?.mengen.grow ?? 0);
    const v = nachfuellVorgang(
      { platzId: P31, liter: 2, ...(r ? { ergebnis: r } : {}), volumenL: 9 },
      (() => {
        let n = 0;
        return () => uid('fc', String((n += 1)));
      })(),
      JETZT_RG,
    );
    expect(v.filter((s) => s.art === 'neu' && s.tabelle === 'ansatz_position').length).toBeGreaterThan(0);

    const wasser = rundgangMessungDazu(t, {
      kennung: '3.1',
      ec: 1.3,
      fuellstand: 'unter_drittel',
      nr: 96,
    }) as unknown as MessungZeile;
    expect(kratkyErgebnis(t, P31, wasser, 2, ZONE)).toBeUndefined();
    expect(kratkyErgebnis(t, P31, halb, 0, ZONE)).toBeUndefined();
  });
});

describe('Kurzprüfung bei Direktsaat (Runde 1 Befund 6)', () => {
  it('R5.2 Kurzprüfung Topfboden in Kratky belüftet zählt für «Pumpen prüfen»', () => {
    const t = achtStunden();
    for (const code of ['R-1.1', 'R-2.1', 'R-4.4', 'R-4.5'])
      kurzpruefungDazu(t, code, zh('2027-01-12', '08:00'), 'pumpe');
    for (const code of ['R-3.1', 'R-3.2'])
      kurzpruefungDazu(t, code, zh('2027-01-12', '08:00'), 'loesung_topfboden');
    fertig(t);
    expect(codes(faellig(t), 'strom_pumpen')).toEqual([]);
    expect(platzId('R-3.1')).toBeTruthy();
  });
});
