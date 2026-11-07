// Aufgaben-Rechnung: Schlüssel, Zusammenführung, Sortierung, Datenart, Gewicht, Bündelteile (Plan 27 Testliste;
// R5.1, R5.5, G5, UC8-AK1, UC8-AK10, TO6). Injizierte Uhr, Zeitzone Europe/Zurich, Fixture tests/unit/aufgaben-fixture.ts.
//
// Vertrag (Plan 27 «Schnittstellen», ergänzt, wo der Plan offen ist; gilt für alle tests/unit/aufgaben-*.test.ts):
// - faelligeAufgaben(teile, einstellungen, stichtag, zeitzone) = alleAufgaben(…) mit anzeigeAb ≤ heute; alleAufgaben
//   enthält auch künftige Fälligkeiten; naechsteAufgabe() = erste Aufgabe aus alleAufgaben() mit anzeigeAb > heute
//   (kleinstes anzeigeAb, bei Gleichstand die Sortierung).
// - Schlüssel `typ|bezug|faellig_am`; schluesselLesen() liefert undefined bei anderer Teilzahl, unbekanntem Typ oder
//   einem Tag, der nicht 'JJJJ-MM-TT' ist.
// - Sortierung (A, über den Plan hinaus): Anlage wie anlagenAus() (echt vor demo vor test, dann Kürzel); in der Anlage
//   zuerst die Aufgaben am Messgerät (ohne Ort), dann Anzuchtorte, dann Gefässe; Kennung nach nachKennung(); dann
//   Reihenfolge der Typen wie AufgabenTyp im Plan (= Tabelle R5.2: gefaess_pruefen, messen_nachfuellen, messen,
//   nachfuellen_kratky, loesung_wechseln, ansatz, kontrolle_folgetag, kurzpruefung, belueftung_pruefen, wurzeln_pruefen,
//   waerme_pruefen, kalibrieren, ph_kontrolle, wuerfel_feucht, deckel_oeffnen, abdeckung_entfernen, keimung_pruefen,
//   umsetzen, station_echte_blaetter, reservierung_pruefen, reinigen); dann faelligAm. Aufgaben am Satz (Keimung prüfen,
//   Umsetzen, Reservierung prüfen, Abdeckung entfernen) sortieren beim Ort des Satzes (Anzuchtort bzw.
//   Direktsaat-Gefäss); ihr `ort` ist dieser Platz.
// - Aufgaben am Messgerät (Kalibrieren, pH-Kontrolle) gibt es nur, wenn eine Anlage mit Datenart echt besteht; sie
//   tragen datenart 'echt', anlageId der ersten echten Anlage, bezugArt 'messgeraet' und kein `ort`.
// - ort = { platzId, code: '<Kürzel>-<Kennung>', kennung, rolle, bereichId }.
// - Titel (A, je Typ): 'Gefäss prüfen', 'Messen und nachfüllen', 'Messen', 'Nachfüllen Kratky', 'Lösung wechseln',
//   'Ansatz für Umsetzen' bzw. 'Ansatz für Direktsaat', 'Kontrollmessung am Folgetag', 'Kurzprüfung', 'Belüftung prüfen',
//   'Wurzeln prüfen', 'Wärme prüfen', 'Messgerät kalibrieren' bzw. 'Erstkalibrierung', 'pH-Kontrolle', 'Würfel feucht',
//   'Deckel öffnen', 'Abdeckung entfernen · <Sorte>', 'Keimung prüfen · <Sorte>', 'Umsetzen · <Sorte>',
//   'Station auf 1. echte Blätter', 'Reservierung prüfen · <Sorte>', 'Reinigen, freie Löcher abdecken'.
// - Gewicht (R5.5, A): 'ausserhalb' für die Messaufgabe (messen_nachfuellen, messen) eines Orts, dessen letzte Messung
//   eine Bewertung 'ausserhalb' trägt, sowie für belueftung_pruefen und waerme_pruefen; 'wechsel' für loesung_wechseln
//   und ansatz; sonst 'routine'.
// - einstellungenAus(teile) liest einstellung.vorlauf_n und feste_kalibriertermine; ohne Zeile { vorlaufN: 2,
//   festeKalibriertermine: [] } (Standardwerte der Tabelle).
// - AUFGABEN_TEILE ⊆ FIXTURE_TEILE (tests/unit/aufgaben-fixture.ts) und ⊆ Namen in BUENDEL_TEILE.
import { describe, expect, it, vi } from 'vitest';
import {
  AUFGABEN_TEILE,
  alleAufgaben,
  aufgabenSchluessel,
  einstellungenAus,
  faelligeAufgaben,
  fehlendeTeile,
  naechsteAufgabe,
  nurEcht,
  schluesselLesen,
  titelNachGewicht,
  type Aufgabe,
  type Gewicht,
} from '../../src/domain/aufgaben.ts';
import { BUENDEL_TEILE } from '../../src/daten/buendel.ts';
import {
  ANLAGE,
  ERWARTETE_SCHLUESSEL,
  FIXTURE_TEILE,
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  ansatzDazu,
  aufschubDazu,
  fertig,
  gefaessDazu,
  grundstand,
  jetztAm,
  leer,
  messstelleDazu,
  messungDazu,
  ohne,
  platzId,
  satzId,
  schluessel,
  von,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';

// src/daten/buendel.ts zieht den Supabase-Client nach; hier nur die Liste der Teile
vi.mock('../../src/daten/supabase.ts', () => ({ supabase: {}, SUPABASE_URL: 'http://127.0.0.1:54321' }));

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const schluesselVon = (l: readonly Aufgabe[]) => l.map((a) => a.schluessel);

function einzig<T>(l: readonly T[], was: string): T {
  if (l.length !== 1) throw new Error(`${was}: erwartet genau 1, erhalten ${l.length}`);
  return l[0] as T;
}

/** 1.2 DWC mit Lösung, Neuansatz 2.1., Messung 10.1. → Messen und nachfüllen am 12.1. fällig */
function mitLoesungIn12(): Teile {
  const t = leer();
  gefaessDazu(t, { code: 'R-1.2', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'R-1.2', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'R-1.2', { gilt: zh('2027-01-03') });
  messungDazu(t, 'R-1.2', { gilt: zh('2027-01-10') });
  return fertig(t);
}

describe('UC8-AK1 Schlüssel und Erledigung durch Erfassung', () => {
  it('UC8-AK1 Messung mit Nachfüllen in 1.2 lässt «Messen und nachfüllen 1.2» verschwinden; nächste Fälligkeit = Messdatum + 2', () => {
    const t = mitLoesungIn12();
    const vorher = von(faellig(t), 'messen_nachfuellen', platzId('R-1.2'));
    expect(schluesselVon(vorher)).toEqual([schluessel('messen_nachfuellen', platzId('R-1.2'), '2027-01-12')]);
    expect(einzig(vorher, 'Messen 1.2').titel).toBe('Messen und nachfüllen');

    // heute 09:30 gemessen, danach nachgefüllt
    messungDazu(t, 'R-1.2', { gilt: zh(HEUTE, '09:30') });
    ansatzDazu(t, 'R-1.2', { begonnen: zh(HEUTE, '09:40'), typ: 'nachfuellen', nachgefuelltL: 2 });
    fertig(t);
    const spaeter = jetztAm(HEUTE, '10:00');
    expect(von(faellig(t, spaeter), 'messen_nachfuellen', platzId('R-1.2'))).toEqual([]);
    expect(schluesselVon(von(alle(t, spaeter), 'messen_nachfuellen', platzId('R-1.2')))).toEqual([
      schluessel('messen_nachfuellen', platzId('R-1.2'), '2027-01-14'),
    ]);
  });

  it('UC8-AK1 keine doppelten Schlüssel in der Liste (Set der Schlüssel = Länge)', () => {
    for (const liste of [
      faellig(grundstand()),
      alle(grundstand()),
      alle(grundstand(), jetztAm('2027-01-20')),
    ]) {
      const s = schluesselVon(liste);
      expect(new Set(s).size).toBe(s.length);
    }
  });

  it('UC8-AK1 aufgabenSchluessel und schluesselLesen sind Umkehrungen', () => {
    const s = aufgabenSchluessel('messen_nachfuellen', platzId('R-1.2'), '2027-01-12');
    expect(s).toBe(`messen_nachfuellen|${platzId('R-1.2')}|2027-01-12`);
    expect(schluesselLesen(s)).toEqual({
      typ: 'messen_nachfuellen',
      bezug: platzId('R-1.2'),
      faelligAm: '2027-01-12',
    });
    for (const a of alle(grundstand())) {
      expect(a.schluessel).toBe(aufgabenSchluessel(a.typ, a.bezug, a.faelligAm));
      expect(schluesselLesen(a.schluessel)).toEqual({ typ: a.typ, bezug: a.bezug, faelligAm: a.faelligAm });
    }
    expect(schluesselLesen(`messen|${platzId('R-1.2')}`)).toBeUndefined();
    expect(schluesselLesen(`messen|${platzId('R-1.2')}|2027-01-12|x`)).toBeUndefined();
    expect(schluesselLesen(`unbekannt|${platzId('R-1.2')}|2027-01-12`)).toBeUndefined();
    expect(schluesselLesen(`messen|${platzId('R-1.2')}|12.1.2027`)).toBeUndefined();
    expect(schluesselLesen('')).toBeUndefined();
  });
});

describe('R5.1 Zusammenführung', () => {
  it('R5.1 Sortierung: Anzuchtorte vor Gefässen, dann Kennung, dann Tabellenreihenfolge', () => {
    const t = grundstand();
    expect(schluesselVon(faellig(t))).toEqual(ERWARTETE_SCHLUESSEL);
    // vertauschte Eingabe: jede Liste rückwärts → dieselbe Reihenfolge
    const rueckwaerts: Teile = Object.fromEntries(Object.entries(t).map(([n, l]) => [n, [...l].reverse()]));
    expect(schluesselVon(faellig(rueckwaerts))).toEqual(ERWARTETE_SCHLUESSEL);
    // Kennung numerisch: 1.10 nach 1.2, beide nach den Anzuchtorten
    const k = leer();
    for (const code of ['R-1.10', 'R-1.2', 'R-1.1'])
      gefaessDazu(k, { code, betriebsart: 'dwc', status: 'in_pruefung', erfasst: zh('2027-01-10') });
    fertig(k);
    expect(von(faellig(k), 'gefaess_pruefen').map((a) => a.ort?.kennung)).toEqual(['1.1', '1.2', '1.10']);
  });

  it('R5.1 Bezug: Platz, Satz oder Messgerät, nie eine Pflanzung; Ort mit Code und Rolle', () => {
    const liste = faellig(grundstand());
    const ph = einzig(von(liste, 'ph_kontrolle'), 'pH-Kontrolle');
    expect(ph).toMatchObject({
      bezug: MESSGERAET,
      bezugArt: 'messgeraet',
      datenart: 'echt',
      anlageId: ANLAGE.R,
    });
    expect(ph.ort).toBeUndefined();
    const umsetzen = einzig(von(liste, 'umsetzen'), 'Umsetzen');
    expect(umsetzen).toMatchObject({
      bezug: satzId(1),
      bezugArt: 'satz',
      datenart: 'echt',
      anlageId: ANLAGE.R,
    });
    expect(umsetzen.ort).toEqual({
      platzId: platzId('R-A1'),
      code: 'R-A1',
      kennung: 'A1',
      rolle: 'anzuchtort',
      bereichId: expect.any(String),
    });
    const messen = einzig(von(liste, 'messen_nachfuellen', platzId('R-1.1')), 'Messen 1.1');
    expect(messen).toMatchObject({ bezugArt: 'platz', anlageId: ANLAGE.R, datenart: 'echt' });
    expect(messen.ort).toMatchObject({
      platzId: platzId('R-1.1'),
      code: 'R-1.1',
      kennung: '1.1',
      rolle: 'gefaess',
    });
    const demo = einzig(von(liste, 'messen_nachfuellen', platzId('X-1.1')), 'Messen X-1.1');
    expect(demo).toMatchObject({ anlageId: ANLAGE.X, datenart: 'demo' });
    expect(demo.ort).toEqual({
      platzId: platzId('X-1.1'),
      code: 'X-1.1',
      kennung: '1.1',
      rolle: 'gefaess',
      bereichId: null,
    });
    const pflanzungen = new Set(grundstand()['pflanzung']?.map((p) => p['id']));
    expect(liste.filter((a) => pflanzungen.has(a.bezug))).toEqual([]);
  });

  it('R5.1 Messstelle W erzeugt keine Aufgabe', () => {
    const t = leer();
    messstelleDazu(t, 'R-W');
    messungDazu(t, 'R-W', { gilt: zh('2027-01-01'), messart: 'w', temperatur: 25.0 });
    fertig(t);
    expect(alle(t).filter((a) => a.bezug === platzId('R-W') || a.ort?.platzId === platzId('R-W'))).toEqual(
      [],
    );
    expect(alle(grundstand()).filter((a) => a.ort?.kennung === 'W')).toEqual([]);
  });

  it('R5.1 fehlender Bündelteil zählt als leer, kein Fehler', () => {
    expect(faellig({})).toEqual([]);
    expect(faelligeAufgaben(undefined, { vorlaufN: 2, festeKalibriertermine: [] }, JETZT, ZONE)).toEqual([]);
    expect(naechsteAufgabe({}, { vorlaufN: 2, festeKalibriertermine: [] }, JETZT, ZONE)).toBeUndefined();
    for (const name of FIXTURE_TEILE) expect(() => alle(ohne(grundstand(), name))).not.toThrow();
    // ohne Messungen bleibt der Ort mit Lösung fällig (Plan 12 A11, Neuansatz als Grundlage A2), nicht ein Fehler
    const ohneMessung = faellig(ohne(grundstand(), 'messung'));
    expect(von(ohneMessung, 'messen_nachfuellen', platzId('R-1.1'))).toHaveLength(1);
  });

  it('R5.1 alleAufgaben enthält künftige Fälligkeiten, faelligeAufgaben nur anzeigeAb ≤ heute', () => {
    const t = grundstand();
    const a = alle(t);
    const f = faellig(t);
    expect(schluesselVon(a)).toEqual(
      expect.arrayContaining([
        ...ERWARTETE_SCHLUESSEL,
        schluessel('messen_nachfuellen', platzId('R-2.1'), '2027-01-13'),
        schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-16'),
        schluessel('kalibrieren', MESSGERAET, '2027-01-31'),
        schluessel('reservierung_pruefen', satzId(1), '2027-01-19'),
      ]),
    );
    expect(f.every((x) => x.anzeigeAb <= HEUTE)).toBe(true);
    expect(a.filter((x) => x.anzeigeAb <= HEUTE).map((x) => x.schluessel)).toEqual(schluesselVon(f));
    expect(
      f.find((x) => x.schluessel === schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-16')),
    ).toBe(undefined);
    // überfällig: tageUeberfaellig = heute − faelligAm; künftig und heute fällig: 0
    const gp = einzig(von(f, 'gefaess_pruefen', platzId('R-2.2')), 'Gefäss prüfen 2.2');
    expect(gp).toMatchObject({ faelligAm: '2027-01-08', anzeigeAb: '2027-01-08', tageUeberfaellig: 4 });
    const kal = einzig(von(a, 'kalibrieren'), 'Kalibrieren');
    expect(kal).toMatchObject({ faelligAm: '2027-01-31', anzeigeAb: '2027-01-31', tageUeberfaellig: 0 });
  });

  it('R5.1 naechsteAufgabe nennt die früheste Aufgabe nach heute (Leer-Text «Heute nichts zu tun · nächste: …»)', () => {
    const t = grundstand();
    expect(naechsteAufgabe(t, einstellungenAus(t), JETZT, ZONE)?.schluessel).toBe(
      schluessel('messen_nachfuellen', platzId('R-2.1'), '2027-01-13'),
    );
    const nurGefaess = leer();
    gefaessDazu(nurGefaess, { code: 'R-1.1', betriebsart: 'dwc' });
    ansatzDazu(nurGefaess, 'R-1.1', { begonnen: zh('2027-01-11') });
    messungDazu(nurGefaess, 'R-1.1', { gilt: zh('2027-01-12', '08:00') });
    fertig(nurGefaess);
    // Kurzprüfung ist heute noch offen, Messen und nachfüllen erst am 14.1.
    const n = naechsteAufgabe(nurGefaess, einstellungenAus(nurGefaess), JETZT, ZONE);
    expect(n?.anzeigeAb).toBe('2027-01-14');
    expect(n?.typ).toBe('messen_nachfuellen');
  });

  it('R5.1 einstellungenAus liest vorlauf_n und feste Kalibriertermine, sonst Standardwerte', () => {
    expect(
      einstellungenAus({ einstellung: [{ id: 'e', vorlauf_n: 3, feste_kalibriertermine: ['2027-01-31'] }] }),
    ).toEqual({ vorlaufN: 3, festeKalibriertermine: ['2027-01-31'] });
    expect(einstellungenAus({})).toEqual({ vorlaufN: 2, festeKalibriertermine: [] });
    expect(einstellungenAus(grundstand())).toEqual({ vorlaufN: 2, festeKalibriertermine: [] });
  });
});

describe('UC8-AK10 gleiche Liste in Client und Edge Function', () => {
  it('UC8-AK10 faelligeAufgaben auf der Fixture liefert genau ERWARTETE_SCHLUESSEL in dieser Reihenfolge', () => {
    expect(schluesselVon(faellig(grundstand()))).toEqual(ERWARTETE_SCHLUESSEL);
    // zweimal gerechnet: dieselbe Liste (keine Abhängigkeit von Laufzeit oder Zufall)
    expect(faellig(grundstand())).toEqual(faellig(grundstand()));
  });

  it('UC8-AK10 fehlendeTeile(Fixture) ist leer und AUFGABEN_TEILE ⊆ BUENDEL_TEILE-Namen', () => {
    expect(fehlendeTeile(grundstand())).toEqual([]);
    const buendel = new Set(BUENDEL_TEILE.map((b) => b.name));
    expect(AUFGABEN_TEILE.filter((n) => !buendel.has(n))).toEqual([]);
    expect(AUFGABEN_TEILE.filter((n) => !FIXTURE_TEILE.includes(n))).toEqual([]);
    expect(AUFGABEN_TEILE).toEqual(
      expect.arrayContaining(['aufschub', 'v_nachfuellsumme', 'ereignis_platz']),
    );
    expect(fehlendeTeile(ohne(grundstand(), 'aufschub', 'v_nachfuellsumme')).sort()).toEqual([
      'aufschub',
      'v_nachfuellsumme',
    ]);
    expect([...fehlendeTeile({})].sort()).toEqual([...AUFGABEN_TEILE].sort());
  });

  it('UC8-AK10 das Bündel lädt die Ereignistypen und v_nachfuellsumme, die die Regeln lesen', () => {
    const teil = (name: string) => BUENDEL_TEILE.find((b) => b.name === name);
    expect(teil('v_nachfuellsumme')).toBeDefined();
    expect(teil('ereignis_platz')?.typen).toEqual(
      expect.arrayContaining([
        'gefaess_erfasst',
        'geleert',
        'ruhe',
        'entfernt',
        'kurzpruefung',
        'aufgabe_erledigt',
        'gereinigt',
        'deckel_geoeffnet',
      ]),
    );
    expect(teil('ereignis_pflanzung')?.typen).toEqual(
      expect.arrayContaining([
        'keimung',
        'abschluss',
        'wiederherstellen',
        'verschieben',
        'abdeckung_entfernt',
        'umsetzen',
      ]),
    );
  });
});

describe('G5 Datenart und R5.5 Gewicht', () => {
  it('G5 nurEcht entfernt Demo-Aufgaben; Kalibrieren und pH-Kontrolle entstehen nur für echt', () => {
    const liste = faellig(grundstand());
    const echt = nurEcht(liste);
    expect(echt.every((a) => a.datenart === 'echt')).toBe(true);
    expect(schluesselVon(echt)).toEqual(ERWARTETE_SCHLUESSEL.filter((s) => !s.includes(platzId('X-1.1'))));
    // Heute zeigt Demo-Anlagen (Plan 24 A13), Push und Zählungen nur echt
    expect(liste.some((a) => a.datenart === 'demo')).toBe(true);

    const ohneEcht = grundstand();
    for (const a of ohneEcht['anlage'] ?? []) a['datenart'] = 'demo';
    const typen = alle(ohneEcht).map((a) => a.typ);
    expect(typen).not.toContain('kalibrieren');
    expect(typen).not.toContain('ph_kontrolle');
    expect(nurEcht(alle(ohneEcht))).toEqual([]);
  });

  it('R5.5 Gewicht: letzte Messung ausserhalb → ausserhalb; Lösung wechseln und Ansatz → wechsel; sonst routine', () => {
    const liste = faellig(grundstand());
    const gewicht = (typ: string, code: string) =>
      einzig(von(liste, typ, platzId(code)), `${typ} ${code}`).gewicht;
    expect(gewicht('waerme_pruefen', 'R-2.1')).toBe('ausserhalb');
    expect(gewicht('loesung_wechseln', 'R-2.1')).toBe('wechsel');
    expect(gewicht('ansatz', 'R-1.2')).toBe('wechsel');
    expect(gewicht('messen_nachfuellen', 'R-1.1')).toBe('routine');
    expect(gewicht('kurzpruefung', 'R-1.1')).toBe('routine');
    expect(gewicht('gefaess_pruefen', 'R-2.2')).toBe('routine');
    expect(gewicht('messen', 'R-3.1')).toBe('routine');
    expect(gewicht('nachfuellen_kratky', 'R-3.3')).toBe('routine');
    expect(einzig(von(liste, 'ph_kontrolle'), 'pH').gewicht).toBe('routine');

    const t = grundstand();
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10', '12:00'), ausserhalb: true });
    messungDazu(t, 'R-3.1', {
      gilt: zh('2027-01-05', '12:00'),
      fuellstand: 'ueber_drittel',
      ausserhalb: true,
    });
    fertig(t);
    const neu = faellig(t);
    expect(einzig(von(neu, 'messen_nachfuellen', platzId('R-1.1')), 'Messen 1.1').gewicht).toBe('ausserhalb');
    expect(einzig(von(neu, 'messen', platzId('R-3.1')), 'Messen 3.1').gewicht).toBe('ausserhalb');
    // eine spätere Messung im Bereich hebt es auf: es zählt nur die letzte
    messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10', '13:00') });
    fertig(t);
    expect(einzig(von(faellig(t), 'messen_nachfuellen', platzId('R-1.1')), 'Messen 1.1').gewicht).toBe(
      'routine',
    );
  });

  it('R5.5 titelNachGewicht zählt 1 Ausserhalb · 2 Wechsel · 9 Routine', () => {
    const mit = (g: Gewicht) => ({ gewicht: g }) as Aufgabe;
    const liste = [
      mit('routine'),
      mit('wechsel'),
      ...Array.from({ length: 8 }, () => mit('routine')),
      mit('ausserhalb'),
      mit('wechsel'),
    ];
    expect(titelNachGewicht(liste)).toEqual({ ausserhalb: 1, wechsel: 2, routine: 9 });
    expect(titelNachGewicht([])).toEqual({ ausserhalb: 0, wechsel: 0, routine: 0 });
    expect(titelNachGewicht(nurEcht(faellig(grundstand())))).toEqual({
      ausserhalb: 1,
      wechsel: 2,
      routine: 13,
    });
  });
});

describe('TO6 älteres Bündel', () => {
  it('TO6 faelligeAufgaben auf einem Bündel ohne aufschub und ohne v_nachfuellsumme (älterer Stand) liefert dieselben Aufgaben ohne Aufschub-Wirkung', () => {
    const t = grundstand();
    // Morgen auf «Wurzeln prüfen 2.1» und Nachfüllsumme über dem Volumen von 2.1 (3 l)
    aufschubDazu(t, {
      schluessel: schluessel('wurzeln_pruefen', platzId('R-2.1'), '2027-01-09'),
      art: 'morgen',
      gesetztAm: HEUTE,
    });
    ansatzDazu(t, 'R-2.1', { begonnen: zh('2027-01-05'), typ: 'nachfuellen', nachgefuelltL: 3 });
    fertig(t);
    const mitAufschub = faellig(t);
    expect(von(mitAufschub, 'wurzeln_pruefen', platzId('R-2.1'))).toEqual([]);

    const alt = ohne(t, 'aufschub', 'v_nachfuellsumme');
    const leereTeile: Teile = { ...structuredClone(t), aufschub: [], v_nachfuellsumme: [] };
    expect(faellig(alt)).toEqual(faellig(leereTeile));
    expect(schluesselVon(von(faellig(alt), 'wurzeln_pruefen', platzId('R-2.1')))).toEqual([
      schluessel('wurzeln_pruefen', platzId('R-2.1'), '2027-01-09'),
    ]);
  });
});
