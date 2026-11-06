// Sortenliste und Sortendetail aus dem Bündel (Issue #37, Plan 37 Testliste; R1.3, R1.4, EK1; Konzept 11.3
// «Tim sieht jeden ergänzten Wert mit Herkunft»; Erratum E8). Rein; erfundene Sorten, keine Personendaten.
//
// Schnittstelle aus src/domain/sorten/liste.ts (Commit 0ba6b25):
//   sortenListe(teile) → SortenZeile[] { sorteId, name, artName, vollstaendig, fehlend, pruefauftraege, bestandKorn },
//     nach Name sortiert; Zustand aus v_vollstaendigkeit, Bestand als Summe der nicht stornierten Packungen.
//   sortenDetail(teile, sorteId) → { zeile, phasen: { phase, name, werte: WertAnzeige[] }[], saat, packungen }
//     WertAnzeige { groesse, wert, herkunft, verlaesslichkeit: 'belegt' | 'Prüfauftrag', quelle?: { titel, link } }
import { describe, expect, it } from 'vitest';
import { sortenDetail, sortenListe } from '../../src/domain/sorten/liste.ts';
import type { Teile } from '../../src/domain/teile.ts';

const ROT = '37000000-0000-4000-8000-000000000a01';
const GRUEN = '37000000-0000-4000-8000-000000000a02';
const ART = 'testus_lactucoides';
const gueltig = { gueltig_bis: null };

function sw(phase: string, groesse: string, w: Record<string, unknown>) {
  return {
    sorte_id: ROT,
    phase,
    groesse,
    wert_min: null,
    wert_typ: null,
    wert_max: null,
    text_wert: null,
    quelle_id: null,
    vermerk: 'keine',
    ...w,
  };
}

function teile(): Teile {
  return {
    art: [
      { art_id: ART, name_de: 'Testsalat', name_wiss: 'Testus lactucoides', ...gueltig },
      {
        art_id: 'testus_alt',
        name_de: 'Alte Art',
        name_wiss: 'Testus vetus',
        gueltig_bis: '2027-01-01T00:00:00Z',
      },
    ],
    sorte: [
      { sorte_id: ROT, name: 'Zebra Rot', art_id: ART, kulturtyp: 'blatt', ...gueltig },
      { sorte_id: GRUEN, name: 'Apfel Grün', art_id: ART, kulturtyp: 'blatt', ...gueltig },
      {
        sorte_id: '37000000-0000-4000-8000-000000000a09',
        name: 'Geschlossen',
        art_id: ART,
        kulturtyp: 'blatt',
        gueltig_bis: '2027-01-02T00:00:00Z',
      },
    ],
    v_vollstaendigkeit: [
      { sorte_id: ROT, fehlende_groessen: 2, pruefauftraege: 3, vollstaendig: false },
      { sorte_id: GRUEN, fehlende_groessen: 0, pruefauftraege: 1, vollstaendig: true },
    ],
    saatgut: [
      {
        id: 'p1',
        sorte_id: ROT,
        kaufdatum: '2027-01-10',
        bestand_korn: 180,
        keimfaehigkeit_packung: 0.85,
        storniert_am: null,
      },
      {
        id: 'p2',
        sorte_id: ROT,
        kaufdatum: '2026-11-20',
        bestand_korn: 40,
        keimfaehigkeit_packung: 0.8,
        storniert_am: null,
      },
      {
        id: 'p3',
        sorte_id: ROT,
        kaufdatum: '2026-10-01',
        bestand_korn: 500,
        keimfaehigkeit_packung: 0.9,
        storniert_am: '2027-01-11T10:00:00Z',
      },
      {
        id: 'p4',
        sorte_id: GRUEN,
        kaufdatum: '2027-01-05',
        bestand_korn: 90,
        keimfaehigkeit_packung: 0.75,
        storniert_am: null,
      },
    ],
    quelle: [
      {
        quelle_id: 'recherche-1a2b3c4d',
        titel: 'Blattsalat im DWC-Versuch',
        link: 'https://forschung.example.invalid/blattsalat-dwc',
      },
      { quelle_id: 'leit-q', titel: 'Leitkultur-Quelle', link: 'https://example.invalid/leit' },
    ],
    v_sollwert: [
      sw('keimung', 'anwendbar', { text_wert: 'ja', herkunft_ebene: 'kulturgruppe', evidenzklasse: 'D' }),
      sw('wachstum', 'anwendbar', { text_wert: 'ja', herkunft_ebene: 'kulturgruppe', evidenzklasse: 'D' }),
      sw('bluete', 'anwendbar', {
        text_wert: 'entfaellt',
        herkunft_ebene: 'kulturgruppe',
        evidenzklasse: 'D',
      }),
      sw('bluete', 'ph', { wert_min: 5.8, wert_max: 6.2, herkunft_ebene: 'art', evidenzklasse: 'B1' }),
      sw('wachstum', 'ec', {
        wert_min: 1.2,
        wert_max: 1.6,
        herkunft_ebene: 'art',
        evidenzklasse: 'B1',
        vermerk: 'recherche',
        quelle_id: 'recherche-1a2b3c4d',
      }),
      sw('wachstum', 'dauer', {
        wert_min: 21,
        wert_typ: 28,
        wert_max: 35,
        herkunft_ebene: 'art',
        evidenzklasse: 'B2',
        vermerk: 'leitkultur',
        quelle_id: 'leit-q',
      }),
      sw('wachstum', 'ph', {
        wert_min: 5.5,
        wert_max: 6.5,
        herkunft_ebene: 'kulturgruppe',
        evidenzklasse: 'D',
      }),
      sw('keimung', 'keimart', {
        text_wert: 'licht',
        herkunft_ebene: 'sorte',
        evidenzklasse: 'C',
        vermerk: 'tuete',
      }),
    ],
    saatempfehlung: [
      {
        id: 'se1',
        ebene: 'sorte',
        sorte_id: ROT,
        art_id: null,
        kulturform: 'schnitt',
        samen_je_schwamm: 3,
        klasse_saatmenge: 'C',
        bestaetigt_am: '2027-01-12',
        ...gueltig,
      },
      {
        id: 'se2',
        ebene: 'art',
        sorte_id: null,
        art_id: ART,
        kulturform: 'kopf',
        samen_je_schwamm: 2,
        klasse_saatmenge: 'B',
        bestaetigt_am: null,
        ...gueltig,
      },
      {
        id: 'se3',
        ebene: 'art',
        sorte_id: null,
        art_id: ART,
        kulturform: 'babyleaf',
        samen_je_schwamm: 5,
        klasse_saatmenge: 'D',
        bestaetigt_am: null,
        gueltig_bis: '2027-01-03T00:00:00Z',
      },
      {
        id: 'se4',
        ebene: 'sorte',
        sorte_id: GRUEN,
        art_id: null,
        kulturform: 'schnitt',
        samen_je_schwamm: 4,
        klasse_saatmenge: 'C',
        bestaetigt_am: null,
        ...gueltig,
      },
    ],
  };
}

describe('Sortenliste und Sortendetail', () => {
  it('R1.4 Liste aus v_vollstaendigkeit mit Prüfaufträgen und Bestand', () => {
    expect(sortenListe(teile())).toEqual([
      {
        sorteId: GRUEN,
        name: 'Apfel Grün',
        artName: 'Testsalat',
        vollstaendig: true,
        fehlend: 0,
        pruefauftraege: 1,
        bestandKorn: 90,
      },
      {
        sorteId: ROT,
        name: 'Zebra Rot',
        artName: 'Testsalat',
        vollstaendig: false,
        fehlend: 2,
        pruefauftraege: 3,
        bestandKorn: 220,
      },
    ]);
  });

  it('R1.3 Detail: Vermerk recherche «belegt» mit Quelle, leitkultur «Prüfauftrag», Kulturgruppe «Prüfauftrag»', () => {
    const d = sortenDetail(teile(), ROT);
    if (!d) throw new Error('Detail fehlt');
    expect(d.zeile.name).toBe('Zebra Rot');
    expect(d.phasen.map((p) => p.phase)).toEqual(['keimung', 'wachstum']);

    const wachstum = d.phasen.find((p) => p.phase === 'wachstum')?.werte ?? [];
    const ec = wachstum.find((w) => w.groesse === 'EC');
    expect(ec?.verlaesslichkeit).toBe('belegt');
    expect(ec?.herkunft).toContain('Recherche');
    expect(ec?.herkunft).toContain('Art');
    expect(ec?.herkunft).toContain('B1');
    expect(ec?.quelle).toEqual({
      titel: 'Blattsalat im DWC-Versuch',
      link: 'https://forschung.example.invalid/blattsalat-dwc',
    });

    const dauer = wachstum.find((w) => w.groesse === 'Dauer');
    expect(dauer?.verlaesslichkeit).toBe('Prüfauftrag');
    expect(dauer?.herkunft).toContain('Leitkultur');

    const ph = wachstum.find((w) => w.groesse === 'pH');
    expect(ph?.verlaesslichkeit).toBe('Prüfauftrag');
    expect(ph?.herkunft).toContain('Kulturgruppe');
    expect(ph?.herkunft).toContain('D');
    expect(ph?.quelle).toBeUndefined();

    const keimart = d.phasen.find((p) => p.phase === 'keimung')?.werte.find((w) => w.groesse === 'Keimart');
    expect(keimart?.herkunft).toContain('Tüte');

    expect(d.saat.map((s) => [s.id, s.kulturform, s.samen, s.klasse, s.bestaetigtAm])).toEqual([
      ['se1', 'schnitt', 3, 'C', '2027-01-12'],
      ['se2', 'kopf', 2, 'B', null],
    ]);
    expect(d.packungen.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
    expect(sortenDetail(teile(), '37000000-0000-4000-8000-000000000aff')).toBeUndefined();
  });
});
