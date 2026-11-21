// Eigene wiederkehrende Aufgaben, Runde 1 (Issue #249, Plan 249; Befunde des Prüfers und überlebende Mutanten in
// src/domain/aufgaben-eigene.ts). Konzept R5.1, R5.2 letzte Zeile, R5.3, 8.1 Regel 2 und 3 (TO2), G2; Use Cases U9,
// U11. Fixture wie tests/unit/aufgaben-eigene.test.ts: leer() aus tests/unit/aufgaben-fixture.ts (geschützt,
// unverändert) mit angehängten Zeilen eigene_aufgabe, ereignis_platz bzw. ereignis und aufschub; für den Stromausfall
// regal() aus tests/unit/rundgang-fixture.ts. Uhr als Parameter, Zeitzone Europe/Zurich. Keine Personendaten.
import { describe, expect, it } from 'vitest';
import {
  eigeneAendernVorgang,
  eigeneAnlegenVorgang,
  eigeneAufgabenListe,
  eigeneDefinitionen,
  eigeneEingabePruefen,
  eigeneFaelligkeit,
} from '../../src/domain/aufgaben-eigene.ts';
import { alleAufgaben, einstellungenAus, type Aufgabe } from '../../src/domain/aufgaben.ts';
import {
  ANLAGE,
  ZONE,
  aufschubDazu,
  fertig,
  jetztAm,
  leer,
  schluessel,
  uid,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';
import { JETZT, regal, stromausfallDazu } from './rundgang-fixture.ts';

const NAME = 'Zelt und Luftsteine reinigen';
const ZELT = uid('f0', 'zelt');
/** Nachfolger mit fester Ordnung der Ids: KLEIN < GROSS */
const KLEIN = 'f2490000-0000-4000-8000-000000000101';
const GROSS = 'f2490000-0000-4000-8000-000000000102';
type Definition = ReturnType<typeof eigeneDefinitionen>[number];

const key = (bezug: string, tag: string) => schluessel('eigene_aufgabe', bezug, tag);
const eigene = (l: readonly Aufgabe[]) => l.filter((a) => a.typ === 'eigene_aufgabe');
const alle = (t: Teile, jetzt: Date) => eigene(alleAufgaben(t, einstellungenAus(t), jetzt, ZONE));

/** leer() ohne Messgerät mit leerem Teil eigene_aufgabe */
function basis(): Teile {
  const t = leer();
  t['messgeraet'] = [];
  t['eigene_aufgabe'] = [];
  return t;
}

/** eine Zeile eigene_aufgabe (PostgREST-Form) */
function definitionDazu(
  t: Teile,
  d: {
    id: string;
    anlageId?: string;
    name?: string;
    intervall?: number;
    erfasst: string;
    ersetzt?: string;
    storniert?: string;
  },
): string {
  (t['eigene_aufgabe'] ??= []).push({
    id: d.id,
    client_id: d.id,
    anlage_id: d.anlageId ?? ANLAGE.R,
    name: d.name ?? NAME,
    intervall_d: d.intervall ?? 30,
    letzte_erledigung: null,
    erfasst_am: d.erfasst,
    app_version: 'test',
    ersetzt_id: d.ersetzt ?? null,
    storniert_am: d.storniert ?? null,
  });
  return d.id;
}

/** Ereignis an der Anlage (ohne platz_id) im Teil `teil`; Schlüssel in der Spalte und/oder in daten */
function ereignisDazu(
  t: Teile,
  e: {
    id?: string;
    teil?: 'ereignis_platz' | 'ereignis';
    typ?: string;
    spalte?: string | null;
    daten?: Record<string, unknown> | null;
    gilt: string;
    storniert?: string;
  },
): string {
  const id = e.id ?? uid('e7', `${e.teil ?? 'ereignis_platz'}#${e.gilt}#${String(e.spalte)}`);
  (t[e.teil ?? 'ereignis_platz'] ??= []).push({
    id,
    client_id: id,
    typ: e.typ ?? 'aufgabe_erledigt',
    anlage_id: ANLAGE.R,
    platz_id: null,
    satz_id: null,
    pflanzung_id: null,
    daten: e.daten === undefined ? (e.spalte ? { aufgabe_schluessel: e.spalte } : {}) : e.daten,
    aufgabe_schluessel: e.spalte ?? null,
    gilt_ab: e.gilt,
    storniert_am: e.storniert ?? null,
  });
  return id;
}

/** Vorgänger ZELT (storniert) mit zwei offenen Nachfolgern a und b in dieser Lage im Teil */
function zweiNachfolger(
  a: { id: string; erfasst: string; intervall: number },
  b: { id: string; erfasst: string; intervall: number },
): Teile {
  const t = basis();
  definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-05'), storniert: zh('2027-01-11', '09:10') });
  for (const n of [a, b])
    definitionDazu(t, { id: n.id, erfasst: n.erfasst, intervall: n.intervall, ersetzt: ZELT });
  return t;
}

// ---------------------------------------------------------------------------------------------------------------
// EA-AK3 TO2 Wiederholung: zwei offene Nachfolger derselben Zeile
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK3 TO2 zwei offene Nachfolger derselben Zeile', () => {
  const frueh = { id: GROSS, erfasst: zh('2027-01-11', '09:00'), intervall: 28 };
  const spaet = { id: KLEIN, erfasst: zh('2027-01-11', '09:05'), intervall: 14 };

  for (const [titel, reihe] of [
    ['frühere Zeile zuerst', [frueh, spaet]],
    ['jüngere Zeile zuerst', [spaet, frueh]],
  ] as const) {
    it(`EA-AK3 TO2 Wiederholung: genau eine Definition und eine Aufgabe, die jüngere nach erfasst_am (${titel})`, () => {
      const t = zweiNachfolger(reihe[0], reihe[1]);
      const defs = eigeneDefinitionen(t);
      expect(defs.map((d) => d.id)).toEqual([KLEIN]);
      expect(defs[0]).toMatchObject({ intervallD: 14, kette: [KLEIN, ZELT] });
      const l = alle(t, jetztAm('2027-01-12'));
      expect(l.map((a) => a.bezug)).toEqual([KLEIN]);
      // ohne Erledigung: Erfassungstag der ältesten Zeile der Kette (5.1.)
      expect(l[0]?.faelligAm).toBe('2027-01-05');
      expect(
        eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12'), ZONE).map((e) => e.definition.id),
      ).toEqual([KLEIN]);
    });
  }

  const gleichzeitigKlein = { id: KLEIN, erfasst: zh('2027-01-11', '09:00'), intervall: 28 };
  const gleichzeitigGross = { id: GROSS, erfasst: zh('2027-01-11', '09:00'), intervall: 14 };
  for (const [titel, reihe] of [
    ['kleinere Id zuerst', [gleichzeitigKlein, gleichzeitigGross]],
    ['grössere Id zuerst', [gleichzeitigGross, gleichzeitigKlein]],
  ] as const) {
    it(`EA-AK3 TO2 Wiederholung bei gleichem erfasst_am: die grössere Id gilt (${titel})`, () => {
      const t = zweiNachfolger(reihe[0], reihe[1]);
      expect(eigeneDefinitionen(t).map((d) => d.id)).toEqual([GROSS]);
      expect(alle(t, jetztAm('2027-01-12')).map((a) => a.bezug)).toEqual([GROSS]);
    });
  }

  it('EA-AK3 TO2 ein stornierter jüngerer Nachfolger verdrängt den offenen nicht', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-05'), storniert: zh('2027-01-11', '09:10') });
    definitionDazu(t, { id: KLEIN, erfasst: zh('2027-01-11', '09:00'), ersetzt: ZELT });
    definitionDazu(t, {
      id: GROSS,
      erfasst: zh('2027-01-11', '09:05'),
      ersetzt: ZELT,
      storniert: zh('2027-01-11', '09:06'),
    });
    expect(eigeneDefinitionen(t).map((d) => d.id)).toEqual([KLEIN]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK1 Erledigung: Spalte oder daten, ereignis_platz oder ereignis
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK1 Erledigung aus beiden Ereignis-Teilen', () => {
  const heute = jetztAm('2027-01-13');

  it('EA-AK1 Erledigung nur über daten.aufgabe_schluessel (Spalte null) zählt', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, {
      spalte: null,
      daten: { aufgabe_schluessel: key(ZELT, '2027-01-10') },
      gilt: zh('2027-01-12', '10:00'),
    });
    const [d] = eigeneDefinitionen(t);
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({
      faelligAm: '2027-02-11',
      zuletztErledigtAm: '2027-01-12',
    });
  });

  it('EA-AK1 Erledigung ohne Schlüssel in Spalte und daten zählt nicht (daten null oder Schlüssel keine Zeichenkette)', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, { spalte: null, daten: null, gilt: zh('2027-01-12', '10:00') });
    ereignisDazu(t, { spalte: null, daten: { aufgabe_schluessel: 42 }, gilt: zh('2027-01-12', '11:00') });
    const [d] = eigeneDefinitionen(t);
    const f = eigeneFaelligkeit(d as Definition, t, [], ZONE);
    expect(f).toEqual({ faelligAm: '2027-01-10' });
    // ohne Erledigung fehlt das Feld ganz (nicht nur undefined)
    expect(f).not.toHaveProperty('zuletztErledigtAm');
  });

  it('EA-AK1 Erledigung im Teil ereignis (statt ereignis_platz) zählt', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, { teil: 'ereignis', spalte: key(ZELT, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });
    expect(alle(t, heute).map((a) => a.faelligAm)).toEqual(['2027-02-11']);
  });

  it('EA-AK1 dieselbe Erledigung (gleiche id) in beiden Teilen zählt einmal, die Zeile aus ereignis_platz gilt', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    const id = uid('e7', 'doppelt');
    ereignisDazu(t, { id, spalte: key(ZELT, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });
    // dieselbe id im Teil ereignis mit anderem gilt_ab: nicht ein zweites Mal gezählt
    ereignisDazu(t, {
      id,
      teil: 'ereignis',
      spalte: key(ZELT, '2027-01-10'),
      gilt: zh('2027-01-20', '10:00'),
    });
    const [d] = eigeneDefinitionen(t);
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({
      faelligAm: '2027-02-11',
      zuletztErledigtAm: '2027-01-12',
    });
  });

  it('EA-AK1 ein anderes Ereignis (typ ≠ aufgabe_erledigt) mit passendem Schlüssel zählt nicht', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, {
      typ: 'kurzpruefung',
      spalte: key(ZELT, '2027-01-10'),
      gilt: zh('2027-01-12', '10:00'),
    });
    ereignisDazu(t, {
      teil: 'ereignis',
      typ: 'notiz',
      spalte: key(ZELT, '2027-01-10'),
      gilt: zh('2027-01-12', '11:00'),
    });
    const [d] = eigeneDefinitionen(t);
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({ faelligAm: '2027-01-10' });
    expect(alle(t, heute)[0]?.grund).toBe('alle 30 Tage · noch nie erledigt');
  });

  it('EA-AK1 Schlüssel einer anderen Definition mit gleichem Anfang der Id zählt nicht (Vorsatz mit Trennzeichen)', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, { spalte: `eigene_aufgabe|${ZELT}x|2027-01-10`, gilt: zh('2027-01-12', '10:00') });
    ereignisDazu(t, { spalte: `messen|${ZELT}|2027-01-10`, gilt: zh('2027-01-12', '11:00') });
    const [d] = eigeneDefinitionen(t);
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({ faelligAm: '2027-01-10' });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK1 Maske: Text der Liste
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK1 eigeneAufgabenListe Text', () => {
  const text = (t: Teile, tag: string) =>
    eigeneAufgabenListe(t, ANLAGE.R, jetztAm(tag, '11:00'), ZONE).map((e) => e.text);

  it('EA-AK1 «alle 30 Tage · seit 2 Tagen überfällig» und «seit 1 Tag überfällig» (Einzahl)', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    expect(text(t, '2027-01-12')).toEqual(['alle 30 Tage · seit 2 Tagen überfällig']);
    expect(text(t, '2027-01-11')).toEqual(['alle 30 Tage · seit 1 Tag überfällig']);
    expect(text(t, '2027-01-10')).toEqual(['alle 30 Tage · heute fällig']);
  });

  it('EA-AK1 «alle 30 Tage · fällig 11.2.» nach Erledigung, «jeden Tag · heute fällig» bei Intervall 1', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    ereignisDazu(t, { spalte: key(ZELT, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });
    expect(text(t, '2027-01-12')).toEqual(['alle 30 Tage · fällig 11.2.']);
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12'), ZONE)[0]?.faelligAm).toBe('2027-02-11');

    const u = basis();
    definitionDazu(u, { id: ZELT, intervall: 1, erfasst: zh('2027-01-12', '08:00') });
    expect(text(u, '2027-01-12')).toEqual(['jeden Tag · heute fällig']);
  });

  it('EA-AK1 storniertes Überspringen wirkt in der Liste nicht, gültiges schon', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    aufschubDazu(t, {
      schluessel: key(ZELT, '2027-01-10'),
      art: 'ueberspringen',
      gesetztAm: '2027-01-12',
      storniert: true,
    });
    expect(text(t, '2027-01-12')).toEqual(['alle 30 Tage · seit 2 Tagen überfällig']);
    aufschubDazu(t, { schluessel: key(ZELT, '2027-01-10'), art: 'ueberspringen', gesetztAm: '2027-01-12' });
    expect(text(t, '2027-01-12')).toEqual(['alle 30 Tage · fällig 11.2.']);
  });

  it('EA-AK1 nur die Definitionen der gewünschten Anlage', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    definitionDazu(t, { id: KLEIN, anlageId: ANLAGE.X, name: 'Pumpe reinigen', erfasst: zh('2027-01-10') });
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12'), ZONE).map((e) => e.definition.id)).toEqual(
      [ZELT],
    );
    expect(eigeneAufgabenListe(t, ANLAGE.X, jetztAm('2027-01-12'), ZONE).map((e) => e.definition.id)).toEqual(
      [KLEIN],
    );
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK1 Ohne Grundlage: Erfassungstag aus der Kette
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK1 Erfassungstag der ältesten Zeile der Kette', () => {
  it('EA-AK1 ohne Erledigung gilt der Erfassungstag der ältesten Zeile, auch wenn die Nachfolger später erfasst sind', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-03'), storniert: zh('2027-01-08') });
    definitionDazu(t, {
      id: KLEIN,
      intervall: 20,
      erfasst: zh('2027-01-08'),
      ersetzt: ZELT,
      storniert: zh('2027-01-11'),
    });
    definitionDazu(t, { id: GROSS, intervall: 14, erfasst: zh('2027-01-11'), ersetzt: KLEIN });
    const [d] = eigeneDefinitionen(t);
    expect(d).toMatchObject({ id: GROSS, kette: [GROSS, KLEIN, ZELT], erfasstAm: zh('2027-01-11') });
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({ faelligAm: '2027-01-03' });
    expect(alle(t, jetztAm('2027-01-12')).map((a) => a.schluessel)).toEqual([key(GROSS, '2027-01-03')]);
  });

  it('EA-AK1 G2 Erfassungstag in Zürich: älteste Zeile 9.1. 23:30 UTC zählt als 10.1.', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: '2027-01-09T23:30:00.000Z', storniert: zh('2027-01-11') });
    definitionDazu(t, { id: KLEIN, erfasst: zh('2027-01-11'), ersetzt: ZELT });
    const [d] = eigeneDefinitionen(t);
    expect(eigeneFaelligkeit(d as Definition, t, [], ZONE)).toEqual({ faelligAm: '2027-01-10' });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK3 Sortierung, Prüfung, Vorgänge
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK3 Sortierung, Prüfung und Vorgänge', () => {
  it('EA-AK3 gleicher Name an derselben Anlage: nach id sortiert', () => {
    const t = basis();
    definitionDazu(t, { id: GROSS, erfasst: zh('2027-01-05') });
    definitionDazu(t, { id: KLEIN, erfasst: zh('2027-01-10') });
    expect(eigeneDefinitionen(t).map((d) => d.id)).toEqual([KLEIN, GROSS]);
    expect(eigeneDefinitionen(t, ANLAGE.R).map((d) => d.id)).toEqual([KLEIN, GROSS]);
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12'), ZONE).map((e) => e.definition.id)).toEqual(
      [KLEIN, GROSS],
    );
  });

  it('EA-AK3 Name vor id: «Abfluss» vor «Zelt» trotz grösserer id', () => {
    const t = basis();
    definitionDazu(t, { id: KLEIN, name: 'Zelt', erfasst: zh('2027-01-05') });
    definitionDazu(t, { id: GROSS, name: 'Abfluss', erfasst: zh('2027-01-05') });
    expect(eigeneDefinitionen(t).map((d) => d.id)).toEqual([GROSS, KLEIN]);
  });

  it('EA-AK3 eigeneAnlegenVorgang mit ungültiger Eingabe (Name leer, Intervall 0) liefert []', () => {
    const id = uid('f0', 'neu');
    expect(eigeneAnlegenVorgang(ANLAGE.R, { name: '', intervallD: 30 }, id)).toEqual([]);
    expect(eigeneAnlegenVorgang(ANLAGE.R, { name: '   ', intervallD: 30 }, id)).toEqual([]);
    expect(eigeneAnlegenVorgang(ANLAGE.R, { name: NAME, intervallD: 0 }, id)).toEqual([]);
    expect(eigeneAnlegenVorgang(ANLAGE.R, { name: NAME, intervallD: 30 }, id)).toHaveLength(1);
  });

  it('EA-AK3 eigeneEingabePruefen liefert genau die Felder name und intervall_d mit den Texten', () => {
    const LEER = { feld: 'name', grund: 'Bitte einen Namen eingeben.' };
    const LANG = { feld: 'name', grund: 'Bitte höchstens 80 Zeichen eingeben.' };
    const ZAHL = { feld: 'intervall_d', grund: 'Bitte eine ganze Zahl zwischen 1 und 365 eingeben.' };
    expect(eigeneEingabePruefen({ name: '', intervallD: 30 })).toEqual([LEER]);
    expect(eigeneEingabePruefen({ name: '  ', intervallD: 30 })).toEqual([LEER]);
    expect(eigeneEingabePruefen({ name: 'x'.repeat(81), intervallD: 30 })).toEqual([LANG]);
    // Länge nach Trim: 80 Zeichen mit Leerzeichen aussen sind gültig
    expect(eigeneEingabePruefen({ name: ` ${'x'.repeat(80)} `, intervallD: 30 })).toEqual([]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: 0 })).toEqual([ZAHL]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: 366 })).toEqual([ZAHL]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: 1.5 })).toEqual([ZAHL]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: Number.NaN })).toEqual([ZAHL]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: 1 })).toEqual([]);
    expect(eigeneEingabePruefen({ name: NAME, intervallD: 365 })).toEqual([]);
    expect(eigeneEingabePruefen({ name: '', intervallD: 0 })).toEqual([LEER, ZAHL]);
  });

  it('EA-AK3 eigeneAendernVorgang: alter Name « Zelt » mit Leerzeichen und Eingabe «Zelt», gleiches Intervall → []', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, name: ' Zelt ', erfasst: zh('2027-01-10') });
    const [alt] = eigeneDefinitionen(t);
    expect(alt?.name).toBe(' Zelt ');
    const neu = uid('f0', 'neu');
    expect(eigeneAendernVorgang(alt as Definition, { name: 'Zelt', intervallD: 30 }, neu)).toEqual([]);
    expect(eigeneAendernVorgang(alt as Definition, { name: ' Zelt  ', intervallD: 30 }, neu)).toEqual([]);
    // anderes Intervall oder ungültige Eingabe
    expect(eigeneAendernVorgang(alt as Definition, { name: 'Zelt', intervallD: 28 }, neu)).toHaveLength(2);
    expect(eigeneAendernVorgang(alt as Definition, { name: '', intervallD: 28 }, neu)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK4 Sortierung in alleAufgaben nach Tabelle R5.2
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK4 Sortierung in alleAufgaben', () => {
  it('EA-AK4 eigene Aufgabe und Stromausfall-Aufgaben an derselben Anlage ohne Ort: Stromausfall zuerst, eigene zuletzt', () => {
    const t = regal();
    stromausfallDazu(t, { beginn: zh('2027-01-11', '23:00'), ende: zh('2027-01-12', '07:00') });
    t['eigene_aufgabe'] = [];
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-12', '08:00') });
    fertig(t);
    const ohneOrt = alleAufgaben(t, einstellungenAus(t), JETZT, ZONE).filter(
      (a) =>
        a.anlageId === ANLAGE.R &&
        a.ort === undefined &&
        ['strom_pumpen', 'strom_ac10_licht', 'eigene_aufgabe'].includes(a.typ),
    );
    // gleiche Anlage, gleiche Gruppe, gleiche Fälligkeit: nur der Rang aus R5.2 entscheidet
    expect(ohneOrt.map((a) => [a.typ, a.faelligAm])).toEqual([
      ['strom_pumpen', '2027-01-12'],
      ['strom_ac10_licht', '2027-01-12'],
      ['eigene_aufgabe', '2027-01-12'],
    ]);
  });
});
