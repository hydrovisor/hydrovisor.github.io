// daten-Schlüssel und Werte je ereignis_typ (Plan 11 Testliste; Plan 9 F5; Tabellenkommentar (A4) von public.ereignis
// in supabase/migrations/20261103140000_datenmodell.sql). Je Typ ein gültiger Fall und ein unbekannter Schlüssel.
import { describe, expect, it } from 'vitest';
import { ereignisDatenPruefen } from '../../src/domain/datenpfad/ereignisdaten.ts';

type EreignisTyp = Parameters<typeof ereignisDatenPruefen>[0];

const U1 = '0a0a0a0a-0000-4000-8000-000000000001';
const U2 = '0a0a0a0a-0000-4000-8000-000000000002';
const U3 = '0a0a0a0a-0000-4000-8000-000000000003';

const ORTSWECHSEL = { von_platz_id: U1, von_loch_nr: 1, nach_platz_id: U2, nach_loch_nr: 2 };

// Alle 32 Werte des Enums ereignis_typ mit den Schlüsseln aus dem Tabellenkommentar; Typen ohne Angabe mit {}
const GUELTIG: Record<EreignisTyp, Record<string, unknown>> = {
  aussaat: { saatdatum: '2027-01-10' },
  deckel_geoeffnet: {},
  abdeckung_entfernt: {},
  keimung: {
    samen_gesaet: 10,
    samen_gekeimt: 8,
    keimtemp_eingehalten: true,
    vorherige_pruefung_am: '2027-01-12',
  },
  phase_antwort: {
    phase: 'wachstum',
    antwort: 'ja',
    erwartet_am: '2027-01-20',
    nachgefuehrt: false,
    ausloesende_pflanzung_id: U3,
  },
  verschieben: ORTSWECHSEL,
  umsetzdatum_geaendert: { von: '2027-01-20', nach: '2027-01-21', grund: 'morgen' },
  umsetzen: ORTSWECHSEL,
  tausch: { ...ORTSWECHSEL, vorgang_id: U3 },
  neu_beschriften: { von_kennung: 'R-2.3', nach_kennung: 'R-2.4' },
  ernte: { art: 'teil' },
  kultur_entscheid: { entscheid: 'verlaengern', tage: 7 },
  schossen_handlung: {},
  abschluss: { grund: 'geerntet', text: 'Letzter Schnitt' },
  wiederherstellen: { ereignis_id: U1 },
  kurzpruefung: { punkt: 'pumpe', ok: true, ausnahmen: [] },
  gefaess_erfasst: {},
  gefaesspruefung: { schritt: 2, ok: true, volumen_gezaehlt_l: 38 },
  box_deckel_tausch: {},
  ruhe: { gesetzt: true },
  entfernt: {},
  geleert: {},
  gereinigt: {},
  bestaeubung: {},
  leitkultur_gewaehlt: { art_id: 'basilikum' },
  sonde_gereinigt: { datenart: 'echt' },
  als_unsicher_markiert: { seit_kalibrierung_id: U2, datenart: 'test' },
  stromausfall: { beginn: '2027-01-10T06:00:00.000Z', ende: '2027-01-10T07:30:00.000Z' },
  aufgabe_erledigt: { aufgabe_schluessel: 'kalibrierung|messgeraet|2027-01-10' },
  messung_umgehaengt: { messung_id: U1, nach_platz_id: U2 },
  sollwert_geaendert: { profilwert_zeile_id: 'pw-0001' },
  beobachtung: { kategorie: 'mehltau', text: 'Weisser Belag an zwei Blättern' },
};

const TYPEN = Object.keys(GUELTIG) as EreignisTyp[];

describe('ereignisDatenPruefen je ereignis_typ', () => {
  it('deckt alle 32 Werte des Enums ereignis_typ ab', () => {
    expect(TYPEN).toHaveLength(32);
  });

  for (const typ of TYPEN) {
    it(`${typ}: gültige daten ohne Verstoss`, () => {
      expect(ereignisDatenPruefen(typ, GUELTIG[typ])).toEqual([]);
    });

    it(`${typ}: unbekannter Schlüssel ist ein Verstoss`, () => {
      expect(ereignisDatenPruefen(typ, { ...GUELTIG[typ], unbekannt_xy: 1 }).length).toBeGreaterThan(0);
    });
  }
});

describe('ereignisDatenPruefen Werte', () => {
  it('sonde_gereinigt ohne datenart ist ein Verstoss (wie der Check der Tabelle)', () => {
    expect(ereignisDatenPruefen('sonde_gereinigt', {}).length).toBeGreaterThan(0);
  });

  it('als_unsicher_markiert ohne datenart ist ein Verstoss (wie der Check der Tabelle)', () => {
    expect(
      ereignisDatenPruefen('als_unsicher_markiert', { seit_kalibrierung_id: U2 }).length,
    ).toBeGreaterThan(0);
  });

  it('datenart ausserhalb von echt, demo, test ist ein Verstoss', () => {
    expect(ereignisDatenPruefen('sonde_gereinigt', { datenart: 'probe' }).length).toBeGreaterThan(0);
    for (const datenart of ['echt', 'demo', 'test'])
      expect(ereignisDatenPruefen('sonde_gereinigt', { datenart }), datenart).toEqual([]);
  });

  it('phase_antwort.antwort nur ja, noch_nicht oder problem', () => {
    for (const antwort of ['ja', 'noch_nicht', 'problem'])
      expect(ereignisDatenPruefen('phase_antwort', { ...GUELTIG.phase_antwort, antwort }), antwort).toEqual(
        [],
      );
    expect(
      ereignisDatenPruefen('phase_antwort', { ...GUELTIG.phase_antwort, antwort: 'vielleicht' }).length,
    ).toBeGreaterThan(0);
  });

  it('beobachtung.text mit 200 Zeichen gültig, mit 201 Zeichen ein Verstoss', () => {
    expect(ereignisDatenPruefen('beobachtung', { kategorie: 'tipburn', text: 'x'.repeat(200) })).toEqual([]);
    expect(
      ereignisDatenPruefen('beobachtung', { kategorie: 'tipburn', text: 'x'.repeat(201) }).length,
    ).toBeGreaterThan(0);
  });
});
