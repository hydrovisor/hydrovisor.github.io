// Eigene wiederkehrende Aufgaben je Anlage (Issue #249, Plan 249 Testliste «Unit»; Konzept R5.1, R5.2 letzte Zeile,
// R5.3, R5.5, 8.1 Regel 2 und 7, G2, G5; Use Cases U9, U11, UC8-AK10, UC8-AK12; Entscheid 0029). Fixture
// tests/unit/aufgaben-fixture.ts (geschützt, unverändert, A17): leer() und grundstand() mit angehängten Zeilen
// eigene_aufgabe (Definitionen), ereignis_platz (aufgabe_erledigt an der Anlage, ohne platz_id) und aufschub. Uhr als
// Parameter, Zeitzone Europe/Zurich. Keine Personendaten.
//
// Erwartete Schnittstellen (Plan 249 «Signaturen»): src/domain/aufgaben-eigene.ts mit EIGENE_TYP, MORGEN_EIGENE,
// eigeneDefinitionen, eigeneFaelligkeit, eigeneAufgabenListe, eigeneEingabePruefen, eigeneAnlegenVorgang,
// eigeneAendernVorgang, eigeneEntfernenVorgang; src/domain/aufgaben.ts mit AUFGABEN_TEILE_ZUSATZ.
import { describe, expect, it } from 'vitest';
import {
  EIGENE_TYP,
  MORGEN_EIGENE,
  eigeneAendernVorgang,
  eigeneAnlegenVorgang,
  eigeneAufgabenListe,
  eigeneDefinitionen,
  eigeneEingabePruefen,
  eigeneEntfernenVorgang,
  eigeneFaelligkeit,
} from '../../src/domain/aufgaben-eigene.ts';
import {
  AUFGABEN_TEILE,
  AUFGABEN_TEILE_ZUSATZ,
  alleAufgaben,
  einstellungenAus,
  faelligeAufgaben,
  fehlendeTeile,
  naechsteAufgabe,
  nurEcht,
  titelNachGewicht,
  type Aufgabe,
} from '../../src/domain/aufgaben.ts';
import {
  aufschubVorgang,
  erledigtVorgang,
  morgenErlaubt,
  type AufschubZeile,
} from '../../src/domain/aufgaben-aufschub.ts';
import { aufgabenTasten } from '../../src/domain/aufgaben-tasten.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { BUENDEL_TEILE } from '../../src/domain/datenpfad/buendel-teile.ts';
import { vorgangPruefen, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { tageslisteZeilen } from '../../src/domain/push/inhalt.ts';
import {
  ANLAGE,
  ERWARTETE_SCHLUESSEL,
  ZONE,
  aufschubDazu,
  grundstand,
  jetztAm,
  leer,
  ohne,
  schluessel,
  uid,
  von,
  zh,
  type Teile,
  type Zeile,
} from './aufgaben-fixture.ts';

const NAME = 'Zelt und Luftsteine reinigen';
const FILTER = 'Luftfilter wechseln';
/** Definition «Zelt und Luftsteine reinigen»; client_id absichtlich verschieden von id */
const ZELT = uid('f0', 'zelt');
const ZELT_CLIENT = uid('f8', 'zelt');
const ANLAGE_Y = uid('a0', 'Y');
type Definition = ReturnType<typeof eigeneDefinitionen>[number];

const key = (bezug: string, tag: string) => schluessel('eigene_aufgabe', bezug, tag);
const eigene = <T extends { typ: string; bezug: string }>(l: readonly T[]) => von(l, 'eigene_aufgabe');
const alle = (t: Teile, jetzt: Date) => eigene(alleAufgaben(t, einstellungenAus(t), jetzt, ZONE));
const faellig = (t: Teile, jetzt: Date) => eigene(faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE));
const eine = (t: Teile, jetzt: Date): Aufgabe => {
  const l = alle(t, jetzt);
  expect(l, 'genau eine eigene Aufgabe').toHaveLength(1);
  return l[0] as Aufgabe;
};

/** leer() ohne Messgerät (keine Aufgaben am Gerät) mit leerem Teil eigene_aufgabe */
function basis(): Teile {
  const t = leer();
  t['messgeraet'] = [];
  t['eigene_aufgabe'] = [];
  return t;
}

/** dritte Anlage Y (test) für «Anlagen getrennt» */
function mitAnlageY(t: Teile): Teile {
  (t['anlage'] ??= []).push({
    id: ANLAGE_Y,
    kuerzel: 'Y',
    name: 'Testanlage',
    datenart: 'test',
    aktiv: true,
    storniert_am: null,
  });
  return t;
}

/** eine Zeile eigene_aufgabe (PostgREST-Form) */
function definitionDazu(
  t: Teile,
  d: {
    id: string;
    clientId?: string;
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
    client_id: d.clientId ?? d.id,
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

/** «Erledigt» an der Anlage: aufgabe_erledigt mit anlage_id, ohne platz_id (Bündelteil ereignis_platz) */
function erledigtDazu(
  t: Teile,
  e: { schluessel: string; gilt: string; anlageId?: string; storniert?: string },
): string {
  const id = uid('e7', `${e.schluessel}@${e.gilt}`);
  (t['ereignis_platz'] ??= []).push({
    id,
    client_id: id,
    typ: 'aufgabe_erledigt',
    anlage_id: e.anlageId ?? ANLAGE.R,
    platz_id: null,
    satz_id: null,
    pflanzung_id: null,
    daten: { aufgabe_schluessel: e.schluessel },
    aufgabe_schluessel: e.schluessel,
    war_faellig_am: e.schluessel.split('|')[2] ?? null,
    gilt_ab: e.gilt,
    storniert_am: e.storniert ?? null,
  });
  return id;
}

/** Vorgang wie nach schreiben() in die Teile übernehmen (Ereignisse in ereignis_platz) */
function vorgangDazu(t: Teile, v: Vorgang, jetzt: Date): Teile {
  const iso = jetzt.toISOString();
  for (const s of v) {
    if (s.art === 'neu') {
      const felder = s.felder as Zeile;
      if (s.tabelle === 'ereignis')
        (t['ereignis_platz'] ??= []).push({
          platz_id: null,
          satz_id: null,
          pflanzung_id: null,
          storniert_am: null,
          ...felder,
        });
      else if (s.tabelle === 'eigene_aufgabe')
        (t['eigene_aufgabe'] ??= []).push({
          letzte_erledigung: null,
          ersetzt_id: null,
          erfasst_am: iso,
          storniert_am: null,
          ...felder,
        });
      else (t[s.tabelle] ??= []).push({ storniert_am: null, ...felder });
    } else if (s.art === 'storno') {
      const ziel = s.tabelle === 'ereignis' ? 'ereignis_platz' : s.tabelle;
      for (const z of t[ziel] ?? []) if (z['client_id'] === s.clientId) z['storniert_am'] = iso;
    }
  }
  return t;
}

const aufschuebeAus = (t: Teile) =>
  (t['aufschub'] ?? []).filter((a) => (a['storniert_am'] ?? null) === null) as unknown as AufschubZeile[];

// ---------------------------------------------------------------------------------------------------------------
// EA-AK1 Fälligkeit, Schlüssel, Grund
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK1 Fälligkeit der eigenen Aufgabe', () => {
  it('EA-AK1 neue Aufgabe ist am Erfassungstag fällig mit Schlüssel, Bezug, Gewicht Routine, Titel und Grund noch nie erledigt', () => {
    expect(EIGENE_TYP).toBe('eigene_aufgabe');
    const t = basis();
    definitionDazu(t, { id: ZELT, clientId: ZELT_CLIENT, erfasst: zh('2027-01-10', '09:00') });
    const l = faellig(t, jetztAm('2027-01-10', '09:30'));
    expect(l).toHaveLength(1);
    const a = l[0] as Aufgabe;
    expect(a).toMatchObject({
      schluessel: key(ZELT, '2027-01-10'),
      typ: 'eigene_aufgabe',
      bezug: ZELT,
      bezugArt: 'eigene_aufgabe',
      faelligAm: '2027-01-10',
      anzeigeAb: '2027-01-10',
      tageUeberfaellig: 0,
      anlageId: ANLAGE.R,
      datenart: 'echt',
      titel: NAME,
      gewicht: 'routine',
      grund: 'alle 30 Tage · noch nie erledigt',
      erledigtKnopf: true,
      ueberspringen: true,
      pegelOk: false,
    });
    expect(a.ort).toBeUndefined();
    expect(a.morgen).toMatchObject({ erlaubt: true, verschoben: 0 });

    // zwei Tage später überfällig, der Grund bleibt der eigene (A7)
    const spaeter = faellig(t, jetztAm('2027-01-12', '09:00'));
    expect(spaeter.map((x) => x.schluessel)).toEqual([key(ZELT, '2027-01-10')]);
    expect(spaeter[0]).toMatchObject({ tageUeberfaellig: 2, grund: 'alle 30 Tage · noch nie erledigt' });

    // Maske Anlage
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-10', '09:30'), ZONE)).toEqual([
      expect.objectContaining({ faelligAm: '2027-01-10', text: 'alle 30 Tage · heute fällig' }),
    ]);
    const def = eigeneDefinitionen(t, ANLAGE.R);
    expect(def).toEqual([
      {
        id: ZELT,
        clientId: ZELT_CLIENT,
        anlageId: ANLAGE.R,
        name: NAME,
        intervallD: 30,
        erfasstAm: zh('2027-01-10', '09:00'),
        kette: [ZELT],
      },
    ]);
    expect(eigeneFaelligkeit(def[0] as Definition, t, [], ZONE)).toEqual({ faelligAm: '2027-01-10' });
  });

  it('EA-AK1 G2 erfasst 10.1. 00:30 Zürich (9.1. 23:30 UTC) ist erst am Kalendertag 10.1. fällig', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10', '00:30') });
    expect(zh('2027-01-10', '00:30')).toBe('2027-01-09T23:30:00.000Z');
    expect(faellig(t, jetztAm('2027-01-09', '23:45'))).toEqual([]);
    expect(eine(t, jetztAm('2027-01-09', '23:45')).faelligAm).toBe('2027-01-10');
    expect(faellig(t, jetztAm('2027-01-10', '00:45')).map((a) => a.schluessel)).toEqual([
      key(ZELT, '2027-01-10'),
    ]);
  });

  it('EA-AK1 nach Erledigt am 12.1. wieder fällig am 11.2., Grund zuletzt vor n Tagen', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10', '09:00') });
    erledigtDazu(t, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });

    expect(faellig(t, jetztAm('2027-01-12', '11:00'))).toEqual([]);
    expect(eine(t, jetztAm('2027-01-12', '11:00'))).toMatchObject({
      schluessel: key(ZELT, '2027-02-11'),
      faelligAm: '2027-02-11',
    });
    expect(faellig(t, jetztAm('2027-02-10', '23:59'))).toEqual([]);
    const am11 = faellig(t, jetztAm('2027-02-11', '00:01'));
    expect(am11).toHaveLength(1);
    expect(am11[0]).toMatchObject({
      schluessel: key(ZELT, '2027-02-11'),
      faelligAm: '2027-02-11',
      grund: 'alle 30 Tage · zuletzt vor 30 Tagen',
    });
    // überfällig: «zuletzt» zählt weiter ab der Erledigung
    expect(faellig(t, jetztAm('2027-02-13'))[0]?.grund).toBe('alle 30 Tage · zuletzt vor 32 Tagen');

    // naechsteAufgabe am 13.1.: die eigene Aufgabe am 11.2.
    const n = naechsteAufgabe(t, einstellungenAus(t), jetztAm('2027-01-13'), ZONE);
    expect(n).toMatchObject({ typ: 'eigene_aufgabe', bezug: ZELT, anzeigeAb: '2027-02-11' });

    // Maske Anlage und Fälligkeit direkt
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12', '11:00'), ZONE)).toEqual([
      expect.objectContaining({ faelligAm: '2027-02-11', text: 'alle 30 Tage · fällig 11.2.' }),
    ]);
    const [def] = eigeneDefinitionen(t, ANLAGE.R);
    expect(eigeneFaelligkeit(def as Definition, t, [], ZONE)).toEqual({
      faelligAm: '2027-02-11',
      zuletztErledigtAm: '2027-01-12',
    });
  });

  it('EA-AK1 Intervall 1 «jeden Tag · zuletzt vor 1 Tag», Intervall 365 ein Jahr später', () => {
    const t = basis();
    const taeglich = uid('f0', 'taeglich');
    const jaehrlich = uid('f0', 'jaehrlich');
    definitionDazu(t, { id: taeglich, name: 'Tropfschale leeren', intervall: 1, erfasst: zh('2027-01-10') });
    definitionDazu(t, { id: jaehrlich, name: 'Regal abbauen', intervall: 365, erfasst: zh('2027-01-10') });
    erledigtDazu(t, { schluessel: key(taeglich, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });
    erledigtDazu(t, { schluessel: key(jaehrlich, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });

    expect(faellig(t, jetztAm('2027-01-12', '11:00'))).toEqual([]);
    const morgen = faellig(t, jetztAm('2027-01-13'));
    expect(morgen.map((a) => a.schluessel)).toEqual([key(taeglich, '2027-01-13')]);
    expect(morgen[0]?.grund).toBe('jeden Tag · zuletzt vor 1 Tag');
    expect(faellig(t, jetztAm('2027-01-14'))[0]?.grund).toBe('jeden Tag · zuletzt vor 2 Tagen');

    const jahr = alle(t, jetztAm('2027-01-13')).find((a) => a.bezug === jaehrlich);
    expect(jahr?.faelligAm).toBe('2028-01-12');
    expect(faellig(t, jetztAm('2028-01-11')).some((a) => a.bezug === jaehrlich)).toBe(false);
    expect(faellig(t, jetztAm('2028-01-12')).find((a) => a.bezug === jaehrlich)?.grund).toBe(
      'alle 365 Tage · zuletzt vor 365 Tagen',
    );
  });

  it('EA-AK1 TZ Sommerzeit: Erledigt 20.3.2027 23:30, Intervall 10 → fällig 30.3.', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, intervall: 10, erfasst: zh('2027-01-10') });
    // 20.3. 23:30 Zürich (MEZ) = 22:30 UTC: Kalendertag 20.3.
    expect(zh('2027-03-20', '23:30')).toBe('2027-03-20T22:30:00.000Z');
    erledigtDazu(t, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-03-20', '23:30') });
    expect(eine(t, jetztAm('2027-03-21')).faelligAm).toBe('2027-03-30');
    // 29.3. 23:45 Zürich (MESZ) = 21:45 UTC: noch nicht; 30.3. 00:15 Zürich = 29.3. 22:15 UTC: fällig
    expect(faellig(t, jetztAm('2027-03-29', '23:45'))).toEqual([]);
    expect(faellig(t, jetztAm('2027-03-30', '00:15')).map((a) => a.schluessel)).toEqual([
      key(ZELT, '2027-03-30'),
    ]);
  });

  it('EA-AK1 G2 Erledigung 13.1. 00:30 Zürich (12.1. 23:30 UTC) zählt als 13.1.', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    erledigtDazu(t, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-01-13', '00:30') });
    expect(eine(t, jetztAm('2027-01-13', '09:00')).faelligAm).toBe('2027-02-12');
    expect(faellig(t, jetztAm('2027-02-12', '00:10')).map((a) => a.schluessel)).toEqual([
      key(ZELT, '2027-02-12'),
    ]);
    expect(faellig(t, jetztAm('2027-02-12', '00:10'))[0]?.grund).toBe('alle 30 Tage · zuletzt vor 30 Tagen');
  });

  it('EA-AK1 nach zwei «Morgen» Grund «seit n Tagen verschoben» mit Hinweis intervall_anpassen', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    aufschubDazu(t, { schluessel: key(ZELT, '2027-01-10'), art: 'morgen', gesetztAm: '2027-01-10' });
    // nach einem «Morgen» am 11.1. wieder sichtbar, eigener Grund
    const eins = faellig(t, jetztAm('2027-01-11'));
    expect(eins).toHaveLength(1);
    expect(eins[0]).toMatchObject({
      anzeigeAb: '2027-01-11',
      faelligAm: '2027-01-10',
      grund: 'alle 30 Tage · noch nie erledigt',
      morgen: { erlaubt: true, verschoben: 1 },
    });
    expect(eins[0]?.morgen.hinweis).toBeUndefined();

    aufschubDazu(t, { schluessel: key(ZELT, '2027-01-10'), art: 'morgen', gesetztAm: '2027-01-11' });
    expect(faellig(t, jetztAm('2027-01-11', '20:00'))).toEqual([]);
    const zwei = faellig(t, jetztAm('2027-01-12'));
    expect(zwei).toHaveLength(1);
    expect(zwei[0]).toMatchObject({
      anzeigeAb: '2027-01-12',
      faelligAm: '2027-01-10',
      grund: 'seit 2 Tagen verschoben',
      morgen: { erlaubt: true, verschoben: 2, hinweis: 'intervall_anpassen' },
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK2 Tasten, Erledigt, Morgen, Storno
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK2 Bedienung in Heute', () => {
  const stand = () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, clientId: ZELT_CLIENT, erfasst: zh('2027-01-10') });
    return t;
  };

  it('EA-AK2 Tasten in Heute: Erledigt, Morgen, Überspringen, kein Öffnen', () => {
    const a = eine(stand(), jetztAm('2027-01-12'));
    const tasten = aufgabenTasten(a, 'heute', false);
    expect(tasten.map((x) => [x.art, x.text, x.betont])).toEqual([
      ['schreiben', 'Erledigt', true],
      ['schreiben', 'Morgen', false],
      ['schreiben', 'Überspringen', false],
    ]);
    expect(tasten.some((x) => x.text === 'Öffnen' || x.art === 'link')).toBe(false);
    expect(tasten.map((x) => (x.art === 'schreiben' ? x.aktion : ''))).toEqual([
      'erledigt',
      'morgen',
      'ueberspringen',
    ]);
  });

  it('EA-AK2 erledigtVorgang schreibt genau ein aufgabe_erledigt mit anlage_id, aufgabe_schluessel, war_faellig_am', () => {
    const t = stand();
    const a = eine(t, jetztAm('2027-01-12'));
    const id = uid('f1', 'erledigt-zelt');
    const jetzt = jetztAm('2027-01-12', '10:00');
    const v = erledigtVorgang(a, id, jetzt);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: 'aufgabe_erledigt',
        anlage_id: ANLAGE.R,
        aufgabe_schluessel: key(ZELT, '2027-01-10'),
        daten: { aufgabe_schluessel: key(ZELT, '2027-01-10') },
        war_faellig_am: '2027-01-10',
        gilt_ab: jetzt.toISOString(),
      },
    });
    const felder = (v[0] as { felder: Zeile }).felder;
    expect(felder['anlage_id']).not.toBe(ZELT);
    expect(felder['platz_id'] ?? null).toBeNull();
    expect(vorgangPruefen(v)).toEqual([]);

    // übernommen: nicht mehr fällig, nächste Fälligkeit 11.2.
    vorgangDazu(t, v, jetzt);
    expect(faellig(t, jetztAm('2027-01-12', '10:05'))).toEqual([]);
    expect(eine(t, jetztAm('2027-01-12', '10:05')).faelligAm).toBe('2027-02-11');
  });

  it('EA-AK2 Morgen ohne Grenze auch nach dem dritten Mal; nächster Termin ab der tatsächlichen Erledigung', () => {
    expect(MORGEN_EIGENE).toBe('ja');
    const t = stand();
    const tage = ['2027-01-10', '2027-01-11', '2027-01-12', '2027-01-13'];
    tage.forEach((heute, n) => {
      const a = eine(t, jetztAm(heute));
      expect(a.morgen.verschoben, `nach ${n} × Morgen`).toBe(n);
      expect(a.morgen.erlaubt, `nach ${n} × Morgen`).toBe(true);
      expect(a.anzeigeAb, `nach ${n} × Morgen`).toBe(n === 0 ? '2027-01-10' : heute);
      expect(morgenErlaubt(a, undefined, aufschuebeAus(t), heute), `morgenErlaubt nach ${n}`).toBe(true);
      const v = aufschubVorgang(a, 'morgen', uid('f2', heute), jetztAm(heute, '10:00'), ZONE);
      expect(v, `Morgen am ${heute}`).toHaveLength(1);
      vorgangDazu(t, v, jetztAm(heute, '10:00'));
      // Anzeige ab dem Folgetag
      expect(eine(t, jetztAm(heute, '10:01')).anzeigeAb).toBe(tage[n + 1] ?? '2027-01-14');
    });

    // «Morgen» am 10.1., Erledigung am 11.2.: nächste Fälligkeit 13.3. (R5.3)
    const u = stand();
    aufschubDazu(u, { schluessel: key(ZELT, '2027-01-10'), art: 'morgen', gesetztAm: '2027-01-10' });
    expect(eine(u, jetztAm('2027-01-10', '11:00')).anzeigeAb).toBe('2027-01-11');
    erledigtDazu(u, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-02-11', '10:00') });
    expect(eine(u, jetztAm('2027-02-11', '11:00')).faelligAm).toBe('2027-03-13');
  });

  it('EA-AK2 Storno der Erledigung macht die Aufgabe wieder fällig', () => {
    const t = stand();
    erledigtDazu(t, {
      schluessel: key(ZELT, '2027-01-10'),
      gilt: zh('2027-01-12', '10:00'),
      storniert: zh('2027-01-12', '10:01'),
    });
    const l = faellig(t, jetztAm('2027-01-12', '10:05'));
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({
      schluessel: key(ZELT, '2027-01-10'),
      faelligAm: '2027-01-10',
      tageUeberfaellig: 2,
      grund: 'alle 30 Tage · noch nie erledigt',
    });
    // über den Vorgang: Erledigt und Rückgängig
    const u = stand();
    const a = eine(u, jetztAm('2027-01-12'));
    const id = uid('f1', 'rueck');
    vorgangDazu(u, erledigtVorgang(a, id, jetztAm('2027-01-12', '10:00')), jetztAm('2027-01-12', '10:00'));
    expect(faellig(u, jetztAm('2027-01-12', '10:01'))).toEqual([]);
    vorgangDazu(
      u,
      [{ art: 'storno', tabelle: 'ereignis', clientId: id, grund: 'rueckgaengig' }],
      jetztAm('2027-01-12', '10:02'),
    );
    expect(faellig(u, jetztAm('2027-01-12', '10:03')).map((x) => x.schluessel)).toEqual([
      key(ZELT, '2027-01-10'),
    ]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK3 Definitionen: Storno, Änderung als Kette, Prüfung
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK3 Definitionen ohne Zustand', () => {
  it('EA-AK3 stornierte Definition erzeugt keine Aufgabe', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10'), storniert: zh('2027-01-11') });
    expect(alle(t, jetztAm('2027-01-12'))).toEqual([]);
    expect(eigeneDefinitionen(t)).toEqual([]);
    expect(eigeneDefinitionen(t, ANLAGE.R)).toEqual([]);
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12'), ZONE)).toEqual([]);
  });

  it('EA-AK3 Anlegen: eine neue Zeile mit getrimmtem Namen und client_id = id', () => {
    const id = uid('f3', 'neu');
    const v = eigeneAnlegenVorgang(ANLAGE.R, { name: `  ${FILTER} `, intervallD: 90 }, id);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'eigene_aufgabe',
      felder: { id, client_id: id, anlage_id: ANLAGE.R, name: FILTER, intervall_d: 90 },
    });
    expect(((v[0] as { felder: Zeile }).felder['ersetzt_id'] ?? null) as unknown).toBeNull();
    expect(vorgangPruefen(v)).toEqual([]);
    // übernommen: am Erfassungstag fällig
    const t = vorgangDazu(basis(), v, jetztAm('2027-01-12', '10:00'));
    expect(faellig(t, jetztAm('2027-01-12', '10:01')).map((a) => a.schluessel)).toEqual([
      key(id, '2027-01-12'),
    ]);
  });

  it('EA-AK3 Änderung ist neu mit ersetzt_id plus Storno, unverändert leer', () => {
    const t = basis();
    definitionDazu(t, { id: ZELT, clientId: ZELT_CLIENT, erfasst: zh('2027-01-10') });
    const [alt] = eigeneDefinitionen(t, ANLAGE.R);
    const neu = uid('f3', 'aenderung');

    const v = eigeneAendernVorgang(alt as Definition, { name: NAME, intervallD: 28 }, neu);
    expect(v).toHaveLength(2);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'eigene_aufgabe',
      felder: {
        id: neu,
        client_id: neu,
        anlage_id: ANLAGE.R,
        name: NAME,
        intervall_d: 28,
        ersetzt_id: ZELT,
      },
    });
    expect(v[1]).toEqual({
      art: 'storno',
      tabelle: 'eigene_aufgabe',
      clientId: ZELT_CLIENT,
      grund: 'korrektur',
    });
    expect(vorgangPruefen(v)).toEqual([]);

    // nur der Name: ebenfalls neu plus Storno, Name getrimmt
    const nurName = eigeneAendernVorgang(alt as Definition, { name: ' Zelt reinigen ', intervallD: 30 }, neu);
    expect(nurName).toHaveLength(2);
    expect(nurName[0]).toMatchObject({
      felder: { name: 'Zelt reinigen', intervall_d: 30, ersetzt_id: ZELT },
    });

    // unverändert (auch mit anderen Leerzeichen) und ungültig: leer
    expect(eigeneAendernVorgang(alt as Definition, { name: NAME, intervallD: 30 }, neu)).toEqual([]);
    expect(eigeneAendernVorgang(alt as Definition, { name: `  ${NAME}  `, intervallD: 30 }, neu)).toEqual([]);
    expect(eigeneAendernVorgang(alt as Definition, { name: '   ', intervallD: 28 }, neu)).toEqual([]);
    expect(eigeneAendernVorgang(alt as Definition, { name: NAME, intervallD: 0 }, neu)).toEqual([]);
    expect(eigeneAendernVorgang(alt as Definition, { name: NAME, intervallD: 366 }, neu)).toEqual([]);

    // Entfernen: nur Storno mit Grund korrektur
    expect(eigeneEntfernenVorgang(alt as Definition)).toEqual([
      { art: 'storno', tabelle: 'eigene_aufgabe', clientId: ZELT_CLIENT, grund: 'korrektur' },
    ]);
    const weg = vorgangDazu(
      structuredClone(t),
      eigeneEntfernenVorgang(alt as Definition),
      jetztAm('2027-01-12'),
    );
    expect(alle(weg, jetztAm('2027-01-12', '10:00'))).toEqual([]);

    // Änderung übernommen: genau eine Aufgabe des Nachfolgers
    vorgangDazu(t, v, jetztAm('2027-01-12', '10:00'));
    const a = eine(t, jetztAm('2027-01-12', '10:01'));
    expect(a).toMatchObject({ bezug: neu, schluessel: key(neu, '2027-01-10'), titel: NAME });
    expect(eigeneDefinitionen(t, ANLAGE.R).map((d) => [d.id, d.intervallD, [...d.kette].sort()])).toEqual([
      [neu, 28, [ZELT, neu].sort()],
    ]);
  });

  it('EA-AK3 Fälligkeit rechnet über die Kette ab der Erledigung des Vorgängers', () => {
    const erste = ZELT;
    const zweite = uid('f3', 'zweite');
    const dritte = uid('f3', 'dritte');
    const kette = (mitErledigung: boolean) => {
      const t = basis();
      definitionDazu(t, { id: erste, erfasst: zh('2027-01-10'), storniert: zh('2027-01-20', '10:00') });
      if (mitErledigung)
        erledigtDazu(t, { schluessel: key(erste, '2027-01-10'), gilt: zh('2027-01-12', '10:00') });
      definitionDazu(t, { id: zweite, intervall: 28, erfasst: zh('2027-01-20', '10:00'), ersetzt: erste });
      return t;
    };

    // eine Änderung auf 28 Tage: 12.1. + 28 = 9.2. (nicht 20.1.)
    const t = kette(true);
    expect(eine(t, jetztAm('2027-01-20', '11:00'))).toMatchObject({
      bezug: zweite,
      faelligAm: '2027-02-09',
      schluessel: key(zweite, '2027-02-09'),
    });
    expect(faellig(t, jetztAm('2027-01-20', '11:00'))).toEqual([]);

    // zweite Änderung auf 14 Tage: 12.1. + 14 = 26.1.; Kette mit drei Gliedern
    for (const z of t['eigene_aufgabe'] ?? [])
      if (z['id'] === zweite) z['storniert_am'] = zh('2027-01-21', '10:00');
    definitionDazu(t, { id: dritte, intervall: 14, erfasst: zh('2027-01-21', '10:00'), ersetzt: zweite });
    expect(eine(t, jetztAm('2027-01-21', '11:00'))).toMatchObject({
      bezug: dritte,
      faelligAm: '2027-01-26',
      schluessel: key(dritte, '2027-01-26'),
    });
    const [def] = eigeneDefinitionen(t, ANLAGE.R);
    expect(def?.id).toBe(dritte);
    expect([...(def?.kette ?? [])].sort()).toEqual([erste, zweite, dritte].sort());
    expect(eigeneFaelligkeit(def as Definition, t, [], ZONE)).toEqual({
      faelligAm: '2027-01-26',
      zuletztErledigtAm: '2027-01-12',
    });
    expect(faellig(t, jetztAm('2027-01-26'))[0]?.grund).toBe('alle 14 Tage · zuletzt vor 14 Tagen');

    // Erledigung am mittleren Glied zählt ebenfalls: 20.1. + 14 = 3.2.
    erledigtDazu(t, { schluessel: key(zweite, '2027-02-09'), gilt: zh('2027-01-20', '12:00') });
    expect(eine(t, jetztAm('2027-01-21', '11:00')).faelligAm).toBe('2027-02-03');

    // ohne Erledigung: der Erfassungstag der ersten Zeile
    const ohneErl = kette(false);
    for (const z of ohneErl['eigene_aufgabe'] ?? [])
      if (z['id'] === zweite) z['storniert_am'] = zh('2027-01-21', '10:00');
    definitionDazu(ohneErl, {
      id: dritte,
      intervall: 14,
      erfasst: zh('2027-01-21', '10:00'),
      ersetzt: zweite,
    });
    expect(eine(ohneErl, jetztAm('2027-01-21', '11:00'))).toMatchObject({
      bezug: dritte,
      faelligAm: '2027-01-10',
      grund: 'alle 14 Tage · noch nie erledigt',
    });
  });

  it('EA-AK3 TO2 Nachfolger vor dem Storno ergibt keine doppelte Aufgabe', () => {
    const t = basis();
    const nachfolger = uid('f3', 'nachfolger');
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    definitionDazu(t, { id: nachfolger, intervall: 28, erfasst: zh('2027-01-12', '10:00'), ersetzt: ZELT });
    const l = alle(t, jetztAm('2027-01-12', '11:00'));
    expect(l.map((a) => a.bezug)).toEqual([nachfolger]);
    expect(eigeneDefinitionen(t, ANLAGE.R).map((d) => d.id)).toEqual([nachfolger]);
    expect(eigeneAufgabenListe(t, ANLAGE.R, jetztAm('2027-01-12', '11:00'), ZONE)).toHaveLength(1);
  });

  it('EA-AK3 mehrere Definitionen je Anlage, Anlagen getrennt', () => {
    const t = mitAnlageY(basis());
    const filter = uid('f0', 'filter');
    const pumpe = uid('f0', 'pumpe');
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    definitionDazu(t, { id: filter, name: FILTER, intervall: 90, erfasst: zh('2027-01-05') });
    definitionDazu(t, {
      id: pumpe,
      name: 'Pumpe entkalken',
      intervall: 60,
      anlageId: ANLAGE_Y,
      erfasst: zh('2027-01-08'),
    });
    const heute = jetztAm('2027-01-12');
    const l = faellig(t, heute);
    expect(l.map((a) => a.schluessel).sort()).toEqual(
      [key(ZELT, '2027-01-10'), key(filter, '2027-01-05'), key(pumpe, '2027-01-08')].sort(),
    );
    expect(Object.fromEntries(l.map((a) => [a.bezug, [a.anlageId, a.datenart]]))).toEqual({
      [ZELT]: [ANLAGE.R, 'echt'],
      [filter]: [ANLAGE.R, 'echt'],
      [pumpe]: [ANLAGE_Y, 'test'],
    });

    // Definitionen nach Name, je Anlage
    expect(eigeneDefinitionen(t, ANLAGE.R).map((d) => d.name)).toEqual([FILTER, NAME]);
    expect(eigeneDefinitionen(t, ANLAGE_Y).map((d) => d.id)).toEqual([pumpe]);
    expect(eigeneDefinitionen(t)).toHaveLength(3);
    expect(eigeneAufgabenListe(t, ANLAGE_Y, heute, ZONE).map((e) => e.definition.id)).toEqual([pumpe]);

    // Überspringen an ZELT wirkt nicht auf die anderen
    aufschubDazu(t, { schluessel: key(ZELT, '2027-01-10'), art: 'ueberspringen', gesetztAm: '2027-01-12' });
    const danach = faellig(t, jetztAm('2027-01-12', '11:00'));
    expect(danach.map((a) => a.schluessel).sort()).toEqual(
      [key(filter, '2027-01-05'), key(pumpe, '2027-01-08')].sort(),
    );
  });

  it('EA-AK3 eigeneEingabePruefen Name und Intervall 1 bis 365', () => {
    const ok = (name: string, intervallD: number) => eigeneEingabePruefen({ name, intervallD });
    for (const [name, intervallD] of [
      [NAME, 1],
      [NAME, 365],
      [NAME, 30],
      ['x'.repeat(80), 30],
      [`  ${'x'.repeat(80)}  `, 30],
      ['a', 1],
    ] as const)
      expect(ok(name, intervallD), `${name.length} Zeichen, ${intervallD}`).toEqual([]);

    for (const [name, intervallD] of [
      ['', 30],
      ['   ', 30],
      ['x'.repeat(81), 30],
      [NAME, 0],
      [NAME, -1],
      [NAME, 366],
      [NAME, 1.5],
      [NAME, Number.NaN],
    ] as const)
      expect(ok(name, intervallD).length, `${JSON.stringify(name)}, ${intervallD}`).toBeGreaterThan(0);

    // ungültig: Anlegen ergibt trotzdem keine Zeile nur über die Maske (Speichern gesperrt); hier Verstösse je Feld
    expect(ok('', 0).length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// EA-AK4 Datenart, Bündel, App und Push gleich
// ---------------------------------------------------------------------------------------------------------------

describe('EA-AK4 gleiche Liste in App und Push', () => {
  it('EA-AK4 Datenart der Anlage, nurEcht lässt Demo und Test weg', () => {
    const t = mitAnlageY(basis());
    const demo = uid('f0', 'demo');
    const test = uid('f0', 'test');
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-12', '08:00') });
    definitionDazu(t, { id: demo, anlageId: ANLAGE.X, erfasst: zh('2027-01-12', '08:00') });
    definitionDazu(t, { id: test, anlageId: ANLAGE_Y, erfasst: zh('2027-01-12', '08:00') });
    const l = faellig(t, jetztAm('2027-01-12'));
    expect(Object.fromEntries(l.map((a) => [a.bezug, a.datenart]))).toEqual({
      [ZELT]: 'echt',
      [demo]: 'demo',
      [test]: 'test',
    });
    expect(
      eigene(nurEcht(faelligeAufgaben(t, einstellungenAus(t), jetztAm('2027-01-12'), ZONE))).map(
        (a) => a.bezug,
      ),
    ).toEqual([ZELT]);

    // inaktive oder stornierte Anlage: keine Aufgabe
    const inaktiv = structuredClone(t);
    for (const a of inaktiv['anlage'] ?? []) if (a['id'] === ANLAGE.X) a['aktiv'] = false;
    expect(faellig(inaktiv, jetztAm('2027-01-12')).some((a) => a.bezug === demo)).toBe(false);
    const storniert = structuredClone(t);
    for (const a of storniert['anlage'] ?? []) if (a['id'] === ANLAGE.X) a['storniert_am'] = zh('2027-01-11');
    expect(faellig(storniert, jetztAm('2027-01-12')).some((a) => a.bezug === demo)).toBe(false);
    expect(eigeneDefinitionen(storniert).some((d) => d.id === demo)).toBe(false);
  });

  it('EA-AK4 AUFGABEN_TEILE_ZUSATZ und Bündel laden eigene_aufgabe mit stornierten Zeilen, Push-Teile enthalten ihn', () => {
    expect(AUFGABEN_TEILE_ZUSATZ).toContain('eigene_aufgabe');
    expect(AUFGABEN_TEILE).not.toContain('eigene_aufgabe');
    const teil = BUENDEL_TEILE.find((x) => x.name === 'eigene_aufgabe');
    expect(teil, 'Teil eigene_aufgabe in BUENDEL_TEILE').toBeDefined();
    expect(teil?.ohneStorno ?? false).toBe(false);
    expect(teil?.typen).toBeUndefined();
    expect(teil?.fensterTage).toBeUndefined();
    // Bündel enthält alle Teile, die die Edge Function lädt
    const push = [...AUFGABEN_TEILE, ...AUFGABEN_TEILE_ZUSATZ];
    for (const n of push)
      expect(
        BUENDEL_TEILE.some((x) => x.name === n),
        n,
      ).toBe(true);

    // ohne Teil eigene_aufgabe (älteres Bündel): ohne Fehler und ohne eigene Aufgabe; Fixture bleibt vollständig
    const g = grundstand();
    expect(fehlendeTeile(g)).toEqual([]);
    const ohneTeil = ohne(g, 'eigene_aufgabe');
    expect(() =>
      faelligeAufgaben(ohneTeil, einstellungenAus(ohneTeil), jetztAm('2027-01-12'), ZONE),
    ).not.toThrow();
    const l = faelligeAufgaben(ohneTeil, einstellungenAus(ohneTeil), jetztAm('2027-01-12'), ZONE);
    expect(l.map((a) => a.schluessel)).toEqual(ERWARTETE_SCHLUESSEL);
    expect(eigene(l)).toEqual([]);
  });

  it('EA-AK4 faelligeAufgaben und verteilteAufgaben liefern dieselbe eigene Aufgabe', () => {
    const t = grundstand();
    t['eigene_aufgabe'] = [];
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-12', '08:00') });
    definitionDazu(t, { id: uid('f0', 'demo'), anlageId: ANLAGE.X, erfasst: zh('2027-01-12', '08:00') });
    const jetzt = jetztAm('2027-01-12');
    const e = einstellungenAus(t);
    const app = nurEcht(faelligeAufgaben(t, e, jetzt, ZONE));
    const verteilt = nurEcht(verteilteAufgaben(t, e, jetzt, ZONE));
    expect(eigene(app)).toHaveLength(1);
    expect(eigene(verteilt)).toEqual(eigene(app));
    expect(eigene(app)[0]?.schluessel).toBe(key(ZELT, '2027-01-12'));

    // übrige Aufgaben unverändert in ihrer Reihenfolge
    const alleFaellig = faelligeAufgaben(t, e, jetzt, ZONE);
    expect(alleFaellig.filter((a) => a.typ !== 'eigene_aufgabe').map((a) => a.schluessel)).toEqual(
      ERWARTETE_SCHLUESSEL,
    );

    // Routine im Push-Titel: genau eine mehr als ohne eigene Aufgabe
    const ohneEigene = nurEcht(faelligeAufgaben(ohne(t, 'eigene_aufgabe'), e, jetzt, ZONE));
    expect(titelNachGewicht(eigene(app))).toEqual({ ausserhalb: 0, wechsel: 0, routine: 1 });
    expect(titelNachGewicht(app).routine).toBe(titelNachGewicht(ohneEigene).routine + 1);
    expect(titelNachGewicht(app).ausserhalb).toBe(titelNachGewicht(ohneEigene).ausserhalb);
    expect(titelNachGewicht(app).wechsel).toBe(titelNachGewicht(ohneEigene).wechsel);

    // Tagesliste für die Termintreue (A14): platz_id null
    expect(tageslisteZeilen(eigene(app), '2027-01-12')).toEqual([
      {
        tag: '2027-01-12',
        aufgabe_schluessel: key(ZELT, '2027-01-12'),
        typ: 'eigene_aufgabe',
        platz_id: null,
        faellig_am: '2027-01-12',
      },
    ]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC8-AK12 Überspringen
// ---------------------------------------------------------------------------------------------------------------

describe('UC8-AK12 Überspringen der eigenen Aufgabe', () => {
  const stand = () => {
    const t = mitAnlageY(basis());
    definitionDazu(t, { id: ZELT, erfasst: zh('2027-01-10') });
    return t;
  };

  it('UC8-AK12 Überspringen am 12.1. bei Intervall 30 → nächste Fälligkeit 11.2.', () => {
    const t = stand();
    aufschubDazu(t, { schluessel: key(ZELT, '2027-01-10'), art: 'ueberspringen', gesetztAm: '2027-01-12' });
    expect(faellig(t, jetztAm('2027-01-12', '11:00'))).toEqual([]);
    expect(eine(t, jetztAm('2027-01-12', '11:00'))).toMatchObject({
      faelligAm: '2027-02-11',
      schluessel: key(ZELT, '2027-02-11'),
    });
    // «zuletzt» meint die Erledigung, nicht das Überspringen (A7)
    expect(faellig(t, jetztAm('2027-02-11'))[0]?.grund).toBe('alle 30 Tage · noch nie erledigt');
    const [def] = eigeneDefinitionen(t, ANLAGE.R);
    expect(eigeneFaelligkeit(def as Definition, t, aufschuebeAus(t), ZONE)).toEqual({
      faelligAm: '2027-02-11',
    });

    // storniertes Überspringen bleibt ohne Wirkung
    const s = stand();
    aufschubDazu(s, {
      schluessel: key(ZELT, '2027-01-10'),
      art: 'ueberspringen',
      gesetztAm: '2027-01-12',
      storniert: true,
    });
    expect(faellig(s, jetztAm('2027-01-12', '11:00')).map((a) => a.schluessel)).toEqual([
      key(ZELT, '2027-01-10'),
    ]);

    // Überspringen an einer anderen Definition oder einem fremden Typ wirkt nicht
    const f = stand();
    aufschubDazu(f, {
      schluessel: schluessel('messen', ZELT, '2027-01-10'),
      art: 'ueberspringen',
      gesetztAm: '2027-01-12',
    });
    expect(eine(f, jetztAm('2027-01-12', '11:00')).faelligAm).toBe('2027-01-10');

    // Erledigung jünger als das Überspringen: die Erledigung gilt
    const j = stand();
    aufschubDazu(j, { schluessel: key(ZELT, '2027-01-10'), art: 'ueberspringen', gesetztAm: '2027-01-12' });
    erledigtDazu(j, { schluessel: key(ZELT, '2027-02-11'), gilt: zh('2027-01-14', '10:00') });
    expect(eine(j, jetztAm('2027-01-14', '11:00')).faelligAm).toBe('2027-02-13');

    // Überspringen jünger als die Erledigung: das Überspringen gilt
    const u = stand();
    erledigtDazu(u, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-01-11', '10:00') });
    aufschubDazu(u, { schluessel: key(ZELT, '2027-02-10'), art: 'ueberspringen', gesetztAm: '2027-01-15' });
    expect(eine(u, jetztAm('2027-01-15', '11:00')).faelligAm).toBe('2027-02-14');

    // Erledigung und Überspringen am selben Tag: 12.1. + 30 = 11.2.
    const g = stand();
    aufschubDazu(g, { schluessel: key(ZELT, '2027-01-10'), art: 'ueberspringen', gesetztAm: '2027-01-12' });
    erledigtDazu(g, { schluessel: key(ZELT, '2027-01-10'), gilt: zh('2027-01-12', '08:00') });
    expect(eine(g, jetztAm('2027-01-12', '11:00')).faelligAm).toBe('2027-02-11');
  });

  it('UC8-AK12 aufschubVorgang ueberspringen schreibt aufschub mit Datenart der Anlage', () => {
    const t = stand();
    definitionDazu(t, { id: uid('f0', 'demo'), anlageId: ANLAGE.X, erfasst: zh('2027-01-10') });
    const l = faellig(t, jetztAm('2027-01-12'));
    const echt = l.find((a) => a.bezug === ZELT) as Aufgabe;
    const demo = l.find((a) => a.anlageId === ANLAGE.X) as Aufgabe;
    const id = uid('f4', 'ueber');
    const jetzt = jetztAm('2027-01-12', '10:00');

    const v = aufschubVorgang(echt, 'ueberspringen', id, jetzt, ZONE);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'aufschub',
      felder: {
        id,
        client_id: id,
        aufgabe_schluessel: key(ZELT, '2027-01-10'),
        art: 'ueberspringen',
        gesetzt_am: '2027-01-12',
        gilt_ab: jetzt.toISOString(),
        datenart: 'echt',
      },
    });
    expect(aufschubVorgang(demo, 'ueberspringen', id, jetzt, ZONE)[0]).toMatchObject({
      felder: { datenart: 'demo' },
    });
    // nach Mitternacht Zürich (12.1. 23:30 UTC) gilt der 13.1.
    expect(aufschubVorgang(echt, 'ueberspringen', id, jetztAm('2027-01-13', '00:30'), ZONE)[0]).toMatchObject(
      {
        felder: { gesetzt_am: '2027-01-13' },
      },
    );
    expect(aufschubVorgang(echt, 'pegel_ok', id, jetzt, ZONE)).toEqual([]);

    // übernommen: nächste Fälligkeit 11.2.
    vorgangDazu(t, v, jetzt);
    expect(alle(t, jetztAm('2027-01-12', '10:05')).find((a) => a.bezug === ZELT)?.faelligAm).toBe(
      '2027-02-11',
    );
  });
});
