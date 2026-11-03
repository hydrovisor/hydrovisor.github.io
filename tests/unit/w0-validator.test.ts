// AK «Validator je Regel» [Unit] (Issue #10, Plan 10 Testliste; 03_import_w0.md Abschnitte 4, 5, 7, 10; Konzept 9.4).
//
// Vorausgesetzt aus src/domain/w0/validator.ts:
//   type Regel = 'V1' | 'V2' | … | 'V13'
//   interface Verstoss { datei: string; zeileId: string | null; regel: Regel; wert: string | null; text: string }
//   interface Konflikt { datei: string; zeileId: string; artId: string; text: string }   // Gegenprobe
//   interface Pruefergebnis { verstoesse: Verstoss[]; konflikte: Konflikt[] }
//   pruefen(dateien: W0Dateien, optionen: { modus: 'freigegeben' | 'kandidaten' }): Pruefergebnis
// W0Dateien: Pfad relativ zum Repository → CsvTabelle (csv.ts); fehlende Datei = nicht geliefert (A1).
// Formatfehler (Zahl, Datum, ja/nein, Bereiche, Muster der zeile_id) meldet der Validator als V1 (A11).
// Gegenprobe: Konflikt mit der zeile_id des EC-Werts, kein Verstoss (Abschnitt 7, Tabelle Gegenprobe).
import { describe, expect, it } from 'vitest';
import { csvLesen } from '../../src/domain/w0/csv.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { wissen } from './w0-fixture.ts';
import {
  PFAD,
  alsCsv,
  artStammfelder,
  entfernen,
  kopie,
  spalteAnhaengen,
  spalteEntfernen,
  tabelle,
  zeile,
  type Dateien,
} from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

function ergebnis(d: Dateien) {
  return pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' });
}
function verstoesse(d: Dateien) {
  return ergebnis(d).verstoesse;
}
function hat(d: Dateien, regel: string, datei: string, zeileId?: string): boolean {
  return verstoesse(d).some(
    (v) => v.regel === regel && v.datei === datei && (zeileId === undefined || v.zeileId === zeileId),
  );
}
function setze(d: Dateien, pfad: string, zeileId: string, werte: Record<string, string | null>): Dateien {
  Object.assign(zeile(d, pfad, zeileId), werte);
  return d;
}

const PW = PFAD.profilwert;
const PH_A = 'pw.test_art_a.wachstum.ph';
const EC_A = 'pw.test_art_a.wachstum.ec';

describe('W0-Validator V1 bis V13', () => {
  it('Validator je Regel V1 bricht ab bei unbekannter Spalte in profilwert.csv', () => {
    const d = wissen();
    spalteAnhaengen(d, PW, 'notiz', 'x');
    expect(hat(d, 'V1', PW)).toBe(true);
  });

  it('Validator je Regel V1 bricht ab bei fehlender Pflichtspalte und bei Prüfspalte in freigegeben/', () => {
    const ohne = wissen();
    spalteEntfernen(ohne, PW, 'kurzzitat');
    expect(hat(ohne, 'V1', PW)).toBe(true);

    const pruefspalte = wissen();
    spalteAnhaengen(pruefspalte, PW, 'status', 'freigegeben');
    expect(hat(pruefspalte, 'V1', PW)).toBe(true);
  });

  it('Validator je Regel V1 geht durch mit Spalten in beliebiger Reihenfolge', () => {
    const d = wissen();
    for (const pfad of [PW, PFAD.art, PFAD.sorten]) {
      const t = tabelle(d, pfad);
      const gelesen = csvLesen(pfad, alsCsv(t, [...t.spalten].reverse()));
      expect(Array.isArray(gelesen)).toBe(false);
      d[pfad] = gelesen as unknown as Dateien[string];
    }
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V2 bricht ab bei doppelter zeile_id und bei unbekannter quelle_id', () => {
    const doppelt = wissen();
    kopie(doppelt, PW, PH_A, {});
    expect(hat(doppelt, 'V2', PW, PH_A)).toBe(true);

    const quelle = setze(wissen(), PW, PH_A, { quelle_id: 'unbekannte-quelle' });
    expect(hat(quelle, 'V2', PW, PH_A)).toBe(true);
  });

  it('Validator je Regel V2 bricht ab bei unbekanntem Artnamen in sorten.csv', () => {
    const d = setze(wissen(), PFAD.sorten, 'sorte-test-b-zwei', { art: 'Gurke' });
    const v = verstoesse(d).find((x) => x.regel === 'V2' && x.datei === PFAD.sorten);
    expect(v?.zeileId).toBe('sorte-test-b-zwei');
    expect(v?.wert).toBe('Gurke');
  });

  it('Validator je Regel V2 geht durch mit Verweisen auf Dateien desselben Laufs', () => {
    const d = wissen();
    kopie(d, PFAD.quelle, 'test-fixture', { zeile_id: 'test-zweitquelle', quelle_id: 'test-zweitquelle' });
    setze(d, PW, PH_A, { quelle_id: 'test-zweitquelle' });
    setze(d, PFAD.art, 'art.test_art_b.systemeignung', { quelle_id: 'test-zweitquelle' });
    setze(d, PFAD.sorten, 'sorte-test-a-eins', { katalog_quelle: 'test-zweitquelle' });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V3 bricht ab bei pH 5.1 bis 5.8 und 6.5 bis 7.1', () => {
    expect(hat(setze(wissen(), PW, PH_A, { wert_min: '5.1', wert_max: '5.8' }), 'V3', PW, PH_A)).toBe(true);
    expect(hat(setze(wissen(), PW, PH_A, { wert_min: '6.5', wert_max: '7.1' }), 'V3', PW, PH_A)).toBe(true);
  });

  it('Validator je Regel V3 geht durch bei pH 5.2 bis 6.0', () => {
    expect(verstoesse(setze(wissen(), PW, PH_A, { wert_min: '5.2', wert_max: '6.0' }))).toEqual([]);
  });

  it('Validator je Regel V4 bricht ab bei EC über 2.0 in einer Blattgruppe und unter 0.4', () => {
    const blatt = 'pw.test_art_c.wachstum.ec';
    expect(hat(setze(wissen(), PW, blatt, { wert_min: '0.8', wert_max: '2.1' }), 'V4', PW, blatt)).toBe(true);
    expect(hat(setze(wissen(), PW, EC_A, { wert_min: '0.3', wert_max: '0.9' }), 'V4', PW, EC_A)).toBe(true);
  });

  it('Validator je Regel V4 geht durch bei 1800 bis 2600 µS/cm in Fruchtgemüse', () => {
    const d = setze(wissen(), PW, 'pw.test_art_a.fruchtbildung_reife.ec', {
      wert_min: '1800',
      wert_max: '2600',
      einheit_quelle: 'µS/cm',
    });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V5 bricht ab bei EC-Bandbreite 0.1 und pH-Bandbreite 1.3', () => {
    expect(hat(setze(wissen(), PW, EC_A, { wert_min: '1.4', wert_max: '1.5' }), 'V5', PW, EC_A)).toBe(true);
    expect(hat(setze(wissen(), PW, PH_A, { wert_min: '5.3', wert_max: '6.6' }), 'V5', PW, PH_A)).toBe(true);
  });

  it('Validator je Regel V5 geht durch an den Grenzen 0.2 und 1.2', () => {
    // 1.2 − 1.0 und 6.5 − 5.3 sind in Gleitkomma nicht genau 0.2 und 1.2 (G3: in Tausendsteln rechnen)
    const d = setze(wissen(), PW, EC_A, { wert_min: '1.0', wert_max: '1.2' });
    setze(d, PW, PH_A, { wert_min: '5.3', wert_max: '6.5' });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V6 bricht ab bei Dauer min 0 und bei typ über max', () => {
    const dauer = 'pw.test_art_a.keimung.dauer';
    const null0 = setze(wissen(), PW, dauer, { wert_min: '0', wert_typ: '6', wert_max: '8' });
    expect(hat(null0, 'V6', PW, dauer)).toBe(true);
    const typ = setze(wissen(), PW, dauer, { wert_min: '4', wert_typ: '9', wert_max: '8' });
    expect(hat(typ, 'V6', PW, dauer)).toBe(true);
  });

  it('Validator je Regel V6 geht durch bei 4, 6, 8', () => {
    const d = setze(wissen(), PW, 'pw.test_art_a.keimung.dauer', {
      wert_min: '4',
      wert_typ: '6',
      wert_max: '8',
    });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V7 bricht ab bei Wassertemperatur 9 und Lichtstunden 25', () => {
    const wt = 'pw.standard.wachstum.wassertemp';
    const lh = 'pw.standard.wachstum.licht_h';
    expect(hat(setze(wissen(), PW, wt, { wert_min: '9', wert_max: '20' }), 'V7', PW, wt)).toBe(true);
    expect(hat(setze(wissen(), PW, lh, { wert_min: '14', wert_max: '25' }), 'V7', PW, lh)).toBe(true);
  });

  it('Validator je Regel V7 geht durch bei 10 bis 28 °C und 0 bis 24 h', () => {
    const d = setze(wissen(), PW, 'pw.standard.wachstum.wassertemp', { wert_min: '10', wert_max: '28' });
    setze(d, PW, 'pw.standard.wachstum.licht_h', { wert_min: '0', wert_max: '24' });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V8 bricht ab bei Ebene standard mit ec, keimtemp in wachstum, einheit_quelle bei ph', () => {
    const standardEc = wissen();
    kopie(standardEc, PW, 'pw.test_blatt.wachstum.ec', {
      zeile_id: 'pw.standard.wachstum.ec',
      ebene: 'standard',
      bezug: 'standard',
    });
    expect(hat(standardEc, 'V8', PW, 'pw.standard.wachstum.ec')).toBe(true);

    const keimtemp = wissen();
    kopie(keimtemp, PW, 'pw.test_art_a.keimung.keimtemp', {
      zeile_id: 'pw.test_art_a.wachstum.keimtemp',
      phase: 'wachstum',
    });
    expect(hat(keimtemp, 'V8', PW, 'pw.test_art_a.wachstum.keimtemp')).toBe(true);

    const einheit = setze(wissen(), PW, PH_A, { einheit_quelle: 'mS/cm' });
    expect(hat(einheit, 'V8', PW, PH_A)).toBe(true);
  });

  it('Validator je Regel V8 geht durch bei standard mit ph, wassertemp, licht_h', () => {
    const d = wissen();
    kopie(d, PW, 'pw.test_blatt.wachstum.ph', {
      zeile_id: 'pw.standard.wachstum.ph',
      ebene: 'standard',
      bezug: 'standard',
    });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V9 bricht ab ohne Kurzzitat und bei Evidenzklasse D', () => {
    expect(hat(setze(wissen(), PW, PH_A, { kurzzitat: null }), 'V9', PW, PH_A)).toBe(true);
    expect(hat(setze(wissen(), PW, PH_A, { evidenzklasse: 'D' }), 'V9', PW, PH_A)).toBe(true);
    const art = 'art.test_art_b.systemeignung';
    expect(hat(setze(wissen(), PFAD.art, art, { kurzzitat: null }), 'V9', PFAD.art, art)).toBe(true);
  });

  it('Validator je Regel V9 geht durch bei Saatempfehlung Klasse D ohne Quelle', () => {
    const d = wissen();
    const se = zeile(d, PFAD.saatempfehlung, 'se.test_art_c.babyleaf');
    expect(se).toMatchObject({ klasse_saatmenge: 'D', quelle_id: null, fundstelle: null, kurzzitat: null });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V10 bricht ab bei Wechselmerkmal mit 121 Zeichen und bei «kcl» im Wissenseintrag', () => {
    const wm = 'pw.test_frucht.keimung.wechselmerkmal';
    expect(hat(setze(wissen(), PW, wm, { text_wert: 'x'.repeat(121) }), 'V10', PW, wm)).toBe(true);

    const we = 'we.test_art_a.wachstum.1';
    for (const text of ['Nie mit kcl spülen.', 'Sonde in KCl lagern.', 'Die Lagerlösung wechseln.']) {
      const d = setze(wissen(), PFAD.wissenseintrag, we, { text });
      expect(hat(d, 'V10', PFAD.wissenseintrag, we), text).toBe(true);
    }
  });

  it('Validator je Regel V10 geht durch bei 120 und 600 Zeichen', () => {
    const d = setze(wissen(), PW, 'pw.test_frucht.keimung.wechselmerkmal', { text_wert: 'x'.repeat(120) });
    setze(d, PFAD.wissenseintrag, 'we.test_art_a.wachstum.1', { text: 'y'.repeat(600) });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V11 bricht ab bei Vorgabe ausserhalb kulturformen_erlaubt und ernteintervall_d bei einmalig', () => {
    const vorgabe = 'art.test_art_a.kulturform_vorgabe';
    expect(hat(setze(wissen(), PFAD.art, vorgabe, { wert: 'babyleaf' }), 'V11', PFAD.art)).toBe(true);

    const intervall = wissen();
    kopie(intervall, PFAD.art, 'ak.test_art_b.kopf.ernte_ab_d', {
      zeile_id: 'ak.test_art_b.kopf.ernteintervall_d',
      feld: 'ernteintervall_d',
      wert: '7',
    });
    expect(hat(intervall, 'V11', PFAD.art)).toBe(true);
  });

  it('Validator je Regel V11 geht durch bei mehrfach mit Intervall und Schnitten', () => {
    const d = wissen();
    expect(zeile(d, PFAD.art, 'ak.test_art_b.schnitt.ernteart').wert).toBe('mehrfach');
    expect(zeile(d, PFAD.art, 'ak.test_art_b.schnitt.ernteintervall_d').wert).toBe('10');
    expect(zeile(d, PFAD.art, 'ak.test_art_b.schnitt.schnitte_max').wert).toBe('3');
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V12 bricht ab bei unbekannter Phase und bei «Keimung» gross geschrieben', () => {
    const dauer = 'pw.test_art_a.bluete.dauer';
    expect(hat(setze(wissen(), PW, dauer, { phase: 'bluehen' }), 'V12', PW, dauer)).toBe(true);
    const keim = 'pw.test_art_a.keimung.dauer';
    expect(hat(setze(wissen(), PW, keim, { phase: 'Keimung' }), 'V12', PW, keim)).toBe(true);
  });

  it('Validator je Regel V12 geht durch mit allen Werten aus Abschnitt 5', () => {
    const d = wissen();
    // phase und groesse: alle Werte stehen schon in der Fixture
    const pw = tabelle(d, PW).zeilen;
    expect(new Set(pw.map((z) => z['phase']))).toEqual(
      new Set(['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife']),
    );
    expect(new Set(pw.map((z) => z['groesse']))).toEqual(
      new Set([
        'anwendbar',
        'dauer',
        'bbch',
        'wechselmerkmal',
        'ph',
        'ec',
        'licht_h',
        'wassertemp',
        'keimart',
        'keimtemp',
      ]),
    );
    // kulturform: alle sechs erlaubt
    setze(d, PFAD.art, 'art.test_art_c.kulturformen_erlaubt', {
      wert: 'keimling;babyleaf;schnitt;kopf;dauerkultur_blatt;dauerkultur_frucht',
    });
    // system und quelle_klasse
    const systeme = ['dwc', 'kratky', 'nft', 'ebbe_flut', 'substrat_inert', 'keine'];
    const klassen = [
      'peer_review',
      'universitaet_beratung',
      'hersteller',
      'praxis',
      'katalog',
      'tuete',
      'app',
    ];
    klassen.forEach((klasse, i) => {
      const id = `test-klasse-${i}`;
      kopie(d, PFAD.quelle, 'test-fixture', {
        zeile_id: id,
        quelle_id: id,
        klasse,
        anbaumethode: systeme[i % systeme.length] ?? 'dwc',
      });
    });
    const dauerZeilen = ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife']
      .map((p) => `pw.test_art_a.${p}.dauer`)
      .concat('pw.test_art_b.keimung.dauer');
    systeme.forEach((system, i) => setze(d, PW, dauerZeilen[i] ?? PH_A, { system_quelle: system }));
    // wissenseintrag_typ: alle sechzehn
    const typen = [
      'naehrstoffe',
      'duengerkomponenten',
      'typischer_fehler',
      'mangelbild',
      'warnregel',
      'ernte',
      'sondenpflege',
      'kratky_pegel',
      'wurzelfarbe',
      'topf_umsetzen',
      'boxen_einzeln',
      'stromausfall',
      'schossen',
      'entspitzen',
      'bestaeubung',
      'wochenfahrplan',
    ];
    typen.forEach((typ, i) => {
      kopie(d, PFAD.wissenseintrag, 'we.allgemein.sondenpflege.1', {
        zeile_id: `we.allgemein.${typ}.${i + 2}`,
        typ,
      });
    });
    expect(verstoesse(d)).toEqual([]);
  });

  it('Validator je Regel V13 bricht ab bei Kulturgruppe ohne dauer in wachstum und bei ph der Kulturgruppe in keimung', () => {
    const ohneDauer = wissen();
    entfernen(ohneDauer, PW, 'pw.test_blatt.wachstum.dauer');
    expect(
      verstoesse(ohneDauer).some((v) => v.regel === 'V13' && JSON.stringify(v).includes('test_blatt')),
    ).toBe(true);

    const phKeimung = wissen();
    kopie(phKeimung, PW, 'pw.test_frucht.anzucht.ph', {
      zeile_id: 'pw.test_frucht.keimung.ph',
      phase: 'keimung',
    });
    expect(hat(phKeimung, 'V13', PW, 'pw.test_frucht.keimung.ph')).toBe(true);
  });

  it('Validator je Regel V13 geht durch mit den Mindestzeilen nach 4.4.2', () => {
    expect(ergebnis(wissen())).toEqual({ verstoesse: [], konflikte: [] });
  });

  it('Validator je Regel meldet Datei, zeile_id, Regel und Wert', () => {
    const d = setze(wissen(), PW, PH_A, { wert_min: '5.1', wert_max: '5.8' });
    const v = verstoesse(d).find((x) => x.regel === 'V3');
    expect(v).toMatchObject({ datei: PW, zeileId: PH_A, regel: 'V3' });
    expect(String(v?.wert)).toContain('5.1');
    expect(typeof v?.text).toBe('string');
    expect(v?.text.length).toBeGreaterThan(0);
  });
});

describe('W0-Validator Gegenprobe (Konflikt statt Verstoss)', () => {
  // Tomate als Art der ersten Runde: Stammfelder, eine Sorte in sorten.csv, ein EC-Wert in profilwert.csv
  function mitTomate(phase: string, werte: Record<string, string>): Dateien {
    const d = wissen();
    artStammfelder(d, 'solanum_lycopersicum', 'Tomate', 'test_frucht');
    kopie(d, PFAD.sorten, 'sorte-test-b-zwei', {
      zeile_id: 'sorte-tomate-test',
      name: 'Test',
      art: 'Tomate',
      kulturtyp: 'frucht',
    });
    kopie(d, PW, 'pw.test_art_a.wachstum.ec', {
      zeile_id: `pw.solanum_lycopersicum.${phase}.ec`,
      bezug: 'solanum_lycopersicum',
      phase,
      einheit_quelle: 'mS/cm',
      ...werte,
    });
    return d;
  }
  const konflikt = (d: Dateien, zeileId: string) => ergebnis(d).konflikte.some((k) => k.zeileId === zeileId);

  it('Validator je Regel Gegenprobe Tomate Wachstum Bandmitte 2.0 gesamt meldet Konflikt', () => {
    const d = mitTomate('wachstum', { wert_min: '1.8', wert_max: '2.2', ec_basis: 'gesamt' });
    expect(verstoesse(d)).toEqual([]);
    expect(konflikt(d, 'pw.solanum_lycopersicum.wachstum.ec')).toBe(true);
    const k = ergebnis(d).konflikte.find((x) => x.zeileId === 'pw.solanum_lycopersicum.wachstum.ec');
    expect(k?.artId).toBe('solanum_lycopersicum');
  });

  it('Validator je Regel Gegenprobe Tomate Wachstum Bandmitte 1.8 gesamt meldet keinen Konflikt', () => {
    const d = mitTomate('wachstum', { wert_min: '1.6', wert_max: '2.0', ec_basis: 'gesamt' });
    expect(ergebnis(d)).toEqual({ verstoesse: [], konflikte: [] });
  });

  it('Validator je Regel Gegenprobe Basis zuwachs rechnet ECWasser 0.5 dazu', () => {
    // Anzucht Tomate 1.0: 1.0–1.4 zuwachs → Mitte 1.2 + 0.5 = 1.7, Abweichung 0.7 → Konflikt;
    // dieselben Werte mit Basis gesamt → 1.2, Abweichung 0.2 → kein Konflikt
    const zuwachs = mitTomate('anzucht', { wert_min: '1.0', wert_max: '1.4', ec_basis: 'zuwachs' });
    expect(verstoesse(zuwachs)).toEqual([]);
    expect(konflikt(zuwachs, 'pw.solanum_lycopersicum.anzucht.ec')).toBe(true);
    const gesamt = mitTomate('anzucht', { wert_min: '1.0', wert_max: '1.4', ec_basis: 'gesamt' });
    expect(konflikt(gesamt, 'pw.solanum_lycopersicum.anzucht.ec')).toBe(false);
  });
});
