// Grundregel und Validator für Recherche-Werte (Issue #37, Plan 37 Testliste; UC4-AK7; Konzept 9.1, 9.3, 9.4, 11.3,
// Erratum E8). Rein, ohne Netz; die Claude API wird nie aufgerufen.
//
// Vorausgesetzt (Plan 37, Domänenfunktionen; Feldnamen der Kandidaten wie im JSON der Recherche, A):
//   src/domain/wissen/validator.ts
//     wertPruefen(k: WertKandidat, kontext: { luecken: Luecke[]; ecObergrenze: number; artId: string })
//       → { ok: true; zeile: RechercheWert } | { ok: false; grund: VerwerfGrund }
//     saatPruefen(k: SaatKandidat, kontext: { kulturformen: Kulturform[] })
//       → { ok: true; zeile: RechercheSaat } | { ok: false; grund: VerwerfGrund }
//     evidenzAusQuelle(klasse) → 'B1' | 'B2' | 'C' | undefined
//   WertKandidat = { id, phase, groesse, wert_min, wert_typ, wert_max, text_wert, ec_einheit, ec_basis, system,
//                    umgebung, quelle: { titel, link, klasse, anbaumethode }, fundstelle, kurzzitat }
//   SaatKandidat = { id, kulturform, samen_je_schwamm, obergrenze_samen, pflanzen_stehen_lassen, substrat_gleich,
//                    system, quelle, fundstelle, kurzzitat }
//   RechercheWert = Daten für wissen_app_schreiben('recherche_wert') ohne app_version: art_id, phase, groesse,
//     wert_min/typ/max (EC in mS/cm), ec_min_quelle, ec_max_quelle, ec_einheit_quelle, ec_basis_quelle,
//     system_quelle, umgebung_quelle, fundstelle, kurzzitat, evidenzklasse, quelle { quelle_id = quelleId(link), … }.
//   RechercheSaat = Daten für recherche_saatempfehlung ohne sorte_id und app_version, mit klasse_saatmenge B oder C.
import { describe, expect, it } from 'vitest';
import {
  evidenzAusQuelle,
  saatPruefen,
  wertPruefen,
  type SaatKandidat,
  type WertKandidat,
} from '../../src/domain/wissen/validator.ts';
import type { Luecke } from '../../src/domain/wissen/luecken.ts';
import { quelleId } from '../../src/domain/ki/recherche.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { wissen } from './w0-fixture.ts';
import { PFAD, zeile } from './w0-hilfen.ts';

const ART = 'testus_lactucoides';
const LUECKEN: Luecke[] = [
  { id: 'wachstum.ph', phase: 'wachstum', groesse: 'ph' },
  { id: 'wachstum.ec', phase: 'wachstum', groesse: 'ec' },
  { id: 'wachstum.dauer', phase: 'wachstum', groesse: 'dauer' },
  { id: 'wachstum.bbch', phase: 'wachstum', groesse: 'bbch' },
  { id: 'anzucht.wechselmerkmal', phase: 'anzucht', groesse: 'wechselmerkmal' },
  { id: 'keimung.keimart', phase: 'keimung', groesse: 'keimart' },
  { id: 'keimung.keimtemp', phase: 'keimung', groesse: 'keimtemp' },
];
const BLATT = { luecken: LUECKEN, ecObergrenze: 2.0, artId: ART };
const FRUCHT = { luecken: LUECKEN, ecObergrenze: 2.6, artId: ART };

function kandidat(aenderung: Partial<WertKandidat> = {}): WertKandidat {
  return {
    id: 'w1',
    phase: 'wachstum',
    groesse: 'ph',
    wert_min: 5.8,
    wert_typ: 6.0,
    wert_max: 6.2,
    text_wert: null,
    ec_einheit: null,
    ec_basis: null,
    system: 'dwc',
    umgebung: 'indoor_led',
    quelle: {
      titel: 'Blattsalat im DWC-Versuch',
      link: 'https://forschung.example.invalid/blattsalat-dwc',
      klasse: 'peer_review',
      anbaumethode: 'dwc',
    },
    fundstelle: 'Tabelle 2',
    kurzzitat: 'Im DWC-System lag der pH-Wert zwischen 5.8 und 6.2.',
    ...aenderung,
  } as WertKandidat;
}

function ec(min: number, max: number, einheit: string | null = 'mS/cm', basis: string | null = 'gesamt') {
  return kandidat({
    groesse: 'ec',
    wert_min: min,
    wert_typ: null,
    wert_max: max,
    ec_einheit: einheit,
    ec_basis: basis,
  } as Partial<WertKandidat>);
}

function grund(r: ReturnType<typeof wertPruefen> | ReturnType<typeof saatPruefen>): string {
  return r.ok ? 'ok' : r.grund;
}

function saat(aenderung: Partial<SaatKandidat> = {}): SaatKandidat {
  return {
    id: 's1',
    kulturform: 'schnitt',
    samen_je_schwamm: 3,
    obergrenze_samen: 4,
    pflanzen_stehen_lassen: 1,
    substrat_gleich: true,
    system: 'nft',
    quelle: {
      titel: 'Merkblatt Schnittsalat hydroponisch',
      link: 'https://beratung.example.invalid/schnittsalat',
      klasse: 'universitaet_beratung',
      anbaumethode: 'nft',
    },
    fundstelle: 'Seite 3',
    kurzzitat: 'Drei Samen je Steinwollwürfel, ohne Vereinzeln.',
    ...aenderung,
  } as SaatKandidat;
}

describe('UC4-AK7 Validator der Recherche (9.1, 9.4)', () => {
  it('UC4-AK7 (Validator) pH 5.2–5.4 angenommen, 5.1–5.6 und 6.0–7.4 verworfen, Bandbreite 0.1 und 1.3 verworfen', () => {
    expect(grund(wertPruefen(kandidat({ wert_min: 5.2, wert_typ: 5.3, wert_max: 5.4 }), BLATT))).toBe('ok');
    expect(grund(wertPruefen(kandidat({ wert_min: 6.0, wert_typ: 6.5, wert_max: 7.0 }), BLATT))).toBe('ok');
    expect(grund(wertPruefen(kandidat({ wert_min: 5.1, wert_typ: 5.4, wert_max: 5.6 }), BLATT))).toBe('ph');
    expect(grund(wertPruefen(kandidat({ wert_min: 6.0, wert_typ: 6.6, wert_max: 7.4 }), BLATT))).toBe('ph');
    expect(grund(wertPruefen(kandidat({ wert_min: 6.0, wert_typ: 6.0, wert_max: 6.1 }), BLATT))).toBe(
      'bandbreite',
    );
    expect(grund(wertPruefen(kandidat({ wert_min: 5.5, wert_typ: 6.0, wert_max: 6.8 }), BLATT))).toBe(
      'bandbreite',
    );
  });

  it('UC4-AK7 (Validator) EC Blatt 1.2–2.0 angenommen, 1.2–2.1 verworfen; Frucht bis 2.6; 1400 µS/cm, ppm 500, ppm 700 und CF umgerechnet; ohne Einheit oder Basis verworfen', () => {
    expect(grund(wertPruefen(ec(1.2, 2.0), BLATT))).toBe('ok');
    expect(grund(wertPruefen(ec(1.2, 2.1), BLATT))).toBe('ec');
    expect(grund(wertPruefen(ec(0.3, 0.8), BLATT))).toBe('ec');
    expect(grund(wertPruefen(ec(1.6, 2.6), BLATT))).toBe('ec');
    expect(grund(wertPruefen(ec(1.6, 2.6), FRUCHT))).toBe('ok');
    expect(grund(wertPruefen(ec(1.6, 2.7), FRUCHT))).toBe('ec');
    expect(grund(wertPruefen(ec(1.0, 1.1), BLATT))).toBe('bandbreite');

    const faelle: [number, number, string][] = [
      [1000, 1400, 'µS/cm'],
      [500, 700, 'ppm500'],
      [700, 980, 'ppm700'],
      [10, 14, 'cf'],
    ];
    for (const [min, max, einheit] of faelle) {
      const r = wertPruefen(ec(min, max, einheit), BLATT);
      if (!r.ok) throw new Error(`${einheit}: verworfen mit ${r.grund}`);
      expect(r.zeile, einheit).toMatchObject({
        groesse: 'ec',
        wert_min: 1.0,
        wert_max: 1.4,
        ec_min_quelle: min,
        ec_max_quelle: max,
        ec_einheit_quelle: einheit,
        ec_basis_quelle: 'gesamt',
      });
    }
    // 2400 µS/cm = 2.4 mS/cm über der Blatt-Grenze, obwohl der Rohwert gross ist
    expect(grund(wertPruefen(ec(1600, 2400, 'µS/cm'), BLATT))).toBe('ec');

    expect(grund(wertPruefen(ec(1.2, 1.6, null, 'gesamt'), BLATT))).toBe('ec_einheit');
    expect(grund(wertPruefen(ec(1.2, 1.6, 'mS/cm', null), BLATT))).toBe('ec_einheit');
  });

  it('UC4-AK7 (Validator) Dauer 0, min > typ, typ > max verworfen; Wassertemperatur 9 und 29 verworfen; Lichtstunden 25 verworfen; BBCH 60 bis 59 verworfen; Wechselmerkmal 121 Zeichen verworfen', () => {
    const dauer = (min: number, typ: number, max: number) =>
      kandidat({ groesse: 'dauer', wert_min: min, wert_typ: typ, wert_max: max });
    expect(grund(wertPruefen(dauer(21, 28, 35), BLATT))).toBe('ok');
    expect(grund(wertPruefen(dauer(0, 28, 35), BLATT))).toBe('dauer');
    expect(grund(wertPruefen(dauer(30, 28, 35), BLATT))).toBe('dauer');
    expect(grund(wertPruefen(dauer(21, 36, 35), BLATT))).toBe('dauer');

    // Wassertemperatur und Licht sind keine Pflichtgrössen (A6); der Validator kennt die Grenzen trotzdem (9.4)
    const zusatz = {
      ...BLATT,
      luecken: [
        ...LUECKEN,
        { id: 'wachstum.wassertemp', phase: 'wachstum', groesse: 'wassertemp' },
        { id: 'wachstum.licht_h', phase: 'wachstum', groesse: 'licht_h' },
      ] as unknown as Luecke[],
    };
    const wasser = (min: number, max: number) =>
      kandidat({
        groesse: 'wassertemp',
        wert_min: min,
        wert_typ: null,
        wert_max: max,
      } as Partial<WertKandidat>);
    expect(grund(wertPruefen(wasser(18, 22), zusatz))).toBe('ok');
    expect(grund(wertPruefen(wasser(9, 22), zusatz))).toBe('wassertemp');
    expect(grund(wertPruefen(wasser(18, 29), zusatz))).toBe('wassertemp');
    const licht = kandidat({
      groesse: 'licht_h',
      wert_min: 16,
      wert_typ: null,
      wert_max: 25,
    } as Partial<WertKandidat>);
    expect(grund(wertPruefen(licht, zusatz))).toBe('licht');

    const bbch = (von: number, bis: number) =>
      kandidat({ groesse: 'bbch', wert_min: von, wert_typ: null, wert_max: bis });
    expect(grund(wertPruefen(bbch(13, 19), BLATT))).toBe('ok');
    expect(grund(wertPruefen(bbch(60, 59), BLATT))).toBe('bbch');
    expect(grund(wertPruefen(bbch(90, 100), BLATT))).toBe('bbch');

    const wechsel = (text: string) =>
      kandidat({
        phase: 'anzucht',
        groesse: 'wechselmerkmal',
        wert_min: null,
        wert_typ: null,
        wert_max: null,
        text_wert: text,
      });
    expect(grund(wertPruefen(wechsel('x'.repeat(120)), BLATT))).toBe('ok');
    expect(grund(wertPruefen(wechsel('x'.repeat(121)), BLATT))).toBe('text');
  });

  it('UC4-AK7 (Validator) System «keine» und Quellenklasse tuete, katalog, app verworfen; ohne Kurzzitat «ohne_zitat»; Kurzzitat 201 Zeichen verworfen', () => {
    expect(grund(wertPruefen(kandidat({ system: 'keine' } as Partial<WertKandidat>), BLATT))).toBe(
      'nicht_hydroponisch',
    );
    for (const klasse of ['tuete', 'katalog', 'app']) {
      const k = kandidat();
      const r = wertPruefen({ ...k, quelle: { ...k.quelle, klasse } } as WertKandidat, BLATT);
      expect(grund(r), klasse).toBe('quelle_unzulaessig');
    }
    const ohneMethode = kandidat();
    expect(
      grund(
        wertPruefen(
          { ...ohneMethode, quelle: { ...ohneMethode.quelle, anbaumethode: 'keine' } } as WertKandidat,
          BLATT,
        ),
      ),
    ).toBe('nicht_hydroponisch');

    expect(grund(wertPruefen(kandidat({ kurzzitat: '' }), BLATT))).toBe('ohne_zitat');
    expect(grund(wertPruefen(kandidat({ kurzzitat: '   ' }), BLATT))).toBe('ohne_zitat');
    expect(grund(wertPruefen(kandidat({ fundstelle: '' }), BLATT))).toBe('ohne_zitat');
    expect(grund(wertPruefen(kandidat({ kurzzitat: 'z'.repeat(200) }), BLATT))).toBe('ok');
    expect(['ohne_zitat', 'text']).toContain(
      grund(wertPruefen(kandidat({ kurzzitat: 'z'.repeat(201) }), BLATT)),
    );

    const http = kandidat();
    const r = wertPruefen(
      { ...http, quelle: { ...http.quelle, link: 'http://forschung.example.invalid/blattsalat-dwc' } },
      BLATT,
    );
    expect(r.ok).toBe(false);
  });

  it('UC4-AK7 (Validator) Evidenz aus Quellenklasse: peer_review → B1, universitaet_beratung → B1, hersteller → B2, praxis → C', () => {
    expect(evidenzAusQuelle('peer_review')).toBe('B1');
    expect(evidenzAusQuelle('universitaet_beratung')).toBe('B1');
    expect(evidenzAusQuelle('hersteller')).toBe('B2');
    expect(evidenzAusQuelle('praxis')).toBe('C');
    expect(evidenzAusQuelle('tuete')).toBeUndefined();
    expect(evidenzAusQuelle('katalog')).toBeUndefined();
    expect(evidenzAusQuelle('app')).toBeUndefined();

    for (const [klasse, evidenz] of [
      ['peer_review', 'B1'],
      ['hersteller', 'B2'],
      ['praxis', 'C'],
    ] as const) {
      const k = kandidat();
      const r = wertPruefen({ ...k, quelle: { ...k.quelle, klasse } }, BLATT);
      if (!r.ok) throw new Error(`${klasse}: verworfen mit ${r.grund}`);
      expect(r.zeile.evidenzklasse, klasse).toBe(evidenz);
      expect(r.zeile).toMatchObject({
        art_id: ART,
        phase: 'wachstum',
        groesse: 'ph',
        wert_min: 5.8,
        wert_max: 6.2,
        system_quelle: 'dwc',
        fundstelle: 'Tabelle 2',
        kurzzitat: k.kurzzitat,
        quelle: { quelle_id: quelleId(k.quelle.link), link: k.quelle.link, klasse, anbaumethode: 'dwc' },
      });
      expect(['A', 'D']).not.toContain(r.zeile.evidenzklasse);
    }
  });

  it('UC4-AK7 (Validator) Kandidat ohne passende Lücke «keine_luecke»; Keimart auf Ebene Sorte nie', () => {
    expect(grund(wertPruefen(kandidat({ phase: 'anzucht' }), BLATT))).toBe('keine_luecke');
    expect(grund(wertPruefen(kandidat(), { ...BLATT, luecken: [] }))).toBe('keine_luecke');

    const keimart = kandidat({
      phase: 'keimung',
      groesse: 'keimart',
      wert_min: null,
      wert_typ: null,
      wert_max: null,
      text_wert: 'licht',
    });
    const r = wertPruefen(keimart, BLATT);
    if (!r.ok) throw new Error(`Keimart verworfen mit ${r.grund}`);
    expect(r.zeile.art_id).toBe(ART);
    expect((r.zeile as unknown as Record<string, unknown>)['sorte_id']).toBeUndefined();
    expect((r.zeile as unknown as Record<string, unknown>)['ebene'] ?? 'art').toBe('art');
    expect(grund(wertPruefen({ ...keimart, text_wert: 'halbschatten' }, BLATT))).not.toBe('ok');
  });

  it('UC4-AK7 (Validator) Saatempfehlung: Obergrenze < Samen, Obergrenze 26, Pflanzen stehen lassen > Samen verworfen; Klasse A wird nicht vergeben', () => {
    const formen = { kulturformen: ['schnitt', 'kopf'] } as Parameters<typeof saatPruefen>[1];
    const gut = saatPruefen(saat(), formen);
    if (!gut.ok) throw new Error(`verworfen mit ${gut.grund}`);
    expect(gut.zeile).toMatchObject({
      kulturform: 'schnitt',
      samen_je_schwamm: 3,
      obergrenze_samen: 4,
      pflanzen_stehen_lassen: 1,
      klasse_saatmenge: 'B',
      fundstelle: 'Seite 3',
      quelle: { quelle_id: quelleId('https://beratung.example.invalid/schnittsalat') },
    });

    const abweichend = saatPruefen(saat({ substrat_gleich: false }), formen);
    expect(abweichend.ok && abweichend.zeile.klasse_saatmenge).toBe('C');

    expect(grund(saatPruefen(saat({ samen_je_schwamm: 4, obergrenze_samen: 3 }), formen))).toBe('saatmenge');
    expect(grund(saatPruefen(saat({ samen_je_schwamm: 3, obergrenze_samen: 26 }), formen))).toBe('saatmenge');
    expect(grund(saatPruefen(saat({ samen_je_schwamm: 3, obergrenze_samen: 25 }), formen))).toBe('ok');
    expect(grund(saatPruefen(saat({ samen_je_schwamm: 2, pflanzen_stehen_lassen: 3 }), formen))).toBe(
      'saatmenge',
    );
    expect(grund(saatPruefen(saat({ samen_je_schwamm: 0, obergrenze_samen: 0 }), formen))).toBe('saatmenge');
    expect(grund(saatPruefen(saat({ kulturform: 'keimling' } as Partial<SaatKandidat>), formen))).toBe(
      'keine_luecke',
    );
    expect(grund(saatPruefen(saat({ system: 'keine' } as Partial<SaatKandidat>), formen))).toBe(
      'nicht_hydroponisch',
    );

    for (const klasse of ['peer_review', 'universitaet_beratung', 'hersteller', 'praxis']) {
      const k = saat();
      const r = saatPruefen({ ...k, quelle: { ...k.quelle, klasse } } as SaatKandidat, formen);
      expect(r.ok && r.zeile.klasse_saatmenge, klasse).not.toBe('A');
      expect(r.ok && ['B', 'C'].includes(r.zeile.klasse_saatmenge), klasse).toBe(true);
    }
  });

  it('UC4-AK7 (Validator) gleiche Grenzen wie die Checks von profilwert und der W0-Validator an denselben Randwerten', () => {
    // profilwert: pH 5.2 bis 7.0, Bandbreite 0.2 bis 1.2; EC ab 0.4, Bandbreite 0.2 bis 1.2 (02_datenmodell.sql)
    const PH_A = 'pw.test_art_a.wachstum.ph';
    const w0Ok = (min: string, max: string) => {
      const d = wissen();
      Object.assign(zeile(d, PFAD.profilwert, PH_A), { wert_min: min, wert_typ: null, wert_max: max });
      return !pruefen(d as unknown as Parameters<typeof pruefen>[0], {
        modus: 'freigegeben',
      }).verstoesse.some((v) => v.zeileId === PH_A);
    };
    const paare: [number, number][] = [
      [5.2, 5.4],
      [5.1, 5.6],
      [6.0, 7.0],
      [6.0, 7.1],
      [6.0, 6.1],
      [5.5, 6.7],
      [5.5, 6.8],
    ];
    for (const [min, max] of paare) {
      const recherche = wertPruefen(kandidat({ wert_min: min, wert_typ: null, wert_max: max }), BLATT).ok;
      expect(recherche, `pH ${min}–${max}`).toBe(w0Ok(String(min), String(max)));
    }
  });
});
