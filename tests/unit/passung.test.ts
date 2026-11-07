// Entscheidungstabelle R3.2 als reine Funktion (Plan 36 Testliste passung.test.ts; Konzept R3.1 bis R3.3, 8.1 Regel 8;
// UC5-AK2, UC5-AK8, UC5-AK10, UC5-AK14). Kontext von Hand, Werte in Hundertsteln (pH 6.0 = 600, EC 1.2 = 120,
// 22 °C = 2200). Je Zeile P1 bis P11 ein Fall «trifft», «trifft nicht» und «nicht prüfbar».
//
// Vertrag (Plan 36 «Schnittstellen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/passung/passung.ts
//     passung(k: PassungKontext): Passung
//       { einstufung; gruende: GrundCode[] (höchstens zwei, Tabellenreihenfolge); texte: string[] (je Grund einer,
//         Empfohlen: genau ein Text «passt: …»); hinweise: string[]; nichtGeprueft: GrundCode[] (Tabellenreihenfolge);
//         restbreiteEc; abstandMitten }
//     passungText(p): «Nicht empfohlen · nicht für Kratky · kein freies 8-cm-Loch» (Stufe und texte mit « · »)
//     EINSTUFUNG_NAME: { empfohlen: 'Empfohlen', moeglich: 'Möglich', nicht_empfohlen: 'Nicht empfohlen' }
//     sortiert(l): je Stufe (empfohlen, moeglich, nicht_empfohlen) restbreiteEc absteigend, abstandMitten aufsteigend,
//       Name (de); rang 1-basiert über alle Stufen
//   P1 bis P6 Stufe nicht_empfohlen, P7 bis P11 moeglich (Fachregeln Tabelle R3.2). Ohne zählende Pflanzungen
//   (zielbereich.zaehlende = 0) nur P1 bis P6.
import { describe, expect, it } from 'vitest';
import {
  EINSTUFUNG_NAME,
  passung,
  passungText,
  sortiert,
  type Passung,
  type PassungKontext,
} from '../../src/domain/passung/passung.ts';

type Kandidat = PassungKontext['kandidat'];
type Gefaess = PassungKontext['gefaess'];
type Leitkultur = NonNullable<PassungKontext['leitkultur']>;
/** Überschreibung, in der undefined «Stammwert fehlt» heisst (der Schlüssel wird entfernt) */
type Lose<T> = { [K in keyof T]?: T[K] | undefined };

function ohneLuecken<T>(o: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(o).filter(([, w]) => w !== undefined)) as T;
}

/** Lollo Rossa (Salat, Kopf, Wachstum) für 2.3 (DWC, Ebene 2) mit stehendem Salat als Leitkultur: Empfohlen */
function kandidat(e: Lose<Kandidat> = {}): Kandidat {
  return ohneLuecken<Kandidat>({
    sorteId: 'sorte-lollo',
    name: 'Lollo Rossa',
    artId: 'lactuca_sativa',
    kulturgruppeId: 'salat',
    kulturform: 'kopf',
    phase: 'wachstum',
    systemeignung: 'beide',
    ph: { min: 580, max: 650 },
    ec: { min: 100, max: 140 },
    temp: { min: 1800, max: 2400 },
    lichtMaxH: 16,
    photoperiode: 'tagneutral',
    kulturdauerTypischD: 56,
    entspitzen: false,
    wuchshoeheMm: 90,
    wuchsform: 'rosette',
    pythium: 'gering',
    wasserbedarfL: 0.25,
    ...e,
  });
}

function gefaess(e: Lose<Gefaess> = {}): Gefaess {
  return ohneLuecken<Gefaess>({
    platzId: 'platz-2.3',
    kennung: '2.3',
    betriebsart: 'dwc',
    lochGroesseMm: 80,
    betriebsvolumenL: 9,
    lochzahl: 6,
    freieLoecher: [4, 5, 6],
    randloecher: [1, 2, 3, 4, 5, 6],
    bereich: { name: 'Ebene 2', lichtstundenH: 15, nutzbareHoeheMm: 200 },
    wassertempMax7d: 2050,
    ...e,
  });
}

const SALAT_LEIT: Leitkultur = {
  artId: 'lactuca_sativa',
  name: 'Salat',
  kulturgruppeId: 'salat',
  kulturdauerTypischD: 56,
  wuchshoeheMm: 250,
  ec: { min: 100, max: 140 },
};
const leit = (e: Lose<Leitkultur>): Leitkultur => ohneLuecken<Leitkultur>({ ...SALAT_LEIT, ...e });

function kontext(
  e: {
    kandidat?: Lose<Kandidat>;
    gefaess?: Lose<Gefaess>;
    zielbereich?: PassungKontext['zielbereich'];
    leitkultur?: Leitkultur | null;
    mitbewohnerArten?: PassungKontext['mitbewohnerArten'];
    uEc?: number;
  } = {},
): PassungKontext {
  const l = e.leitkultur === null ? undefined : (e.leitkultur ?? SALAT_LEIT);
  return {
    kandidat: kandidat(e.kandidat),
    gefaess: gefaess(e.gefaess),
    zielbereich: e.zielbereich ?? {
      ph: { min: 600, max: 650 },
      ec: { min: 100, max: 140 },
      temp: { min: 1800, max: 2400 },
      zaehlende: 3,
    },
    ...(l ? { leitkultur: l } : {}),
    mitbewohnerArten: e.mitbewohnerArten ?? [{ artId: 'lactuca_sativa', pythium: 'gering' }],
    uEc: e.uEc ?? 10,
  };
}

/** leeres Gefäss: keine zählenden, kein Zielbereich, keine Leitkultur, keine Mitbewohner */
const LEER: { zielbereich: PassungKontext['zielbereich']; leitkultur: null; mitbewohnerArten: [] } = {
  zielbereich: { zaehlende: 0 },
  leitkultur: null,
  mitbewohnerArten: [],
};

const trifft = (p: Passung, code: string) => p.gruende.includes(code as Passung['gruende'][number]);
const nichtGeprueft = (p: Passung, code: string) =>
  p.nichtGeprueft.includes(code as Passung['nichtGeprueft'][number]);

describe('R3.2 Grundfall', () => {
  it('UC5-AK10 gleiche Kulturgruppe, Restbreite ≥ 0.3, Band um die Leitkultur-Mitte ist Empfohlen', () => {
    const p = passung(kontext());
    expect(p.einstufung).toBe('empfohlen');
    expect(p.gruende).toEqual([]);
    expect(p.nichtGeprueft).toEqual([]);
    expect(p.restbreiteEc).toBe(40);
    expect(p.abstandMitten).toBe(0);
  });

  it('R3.2 Text Empfohlen nennt die Schnittmenge «passt: pH 6.0 bis 6.5, EC 1.0 bis 1.4»', () => {
    const p = passung(kontext());
    expect(p.texte).toEqual(['passt: pH 6.0 bis 6.5, EC 1.0 bis 1.4']);
    // Schnittmenge Kandidat ∩ Zielbereich, nicht das Band des Kandidaten
    const q = passung(
      kontext({
        kandidat: { ph: { min: 580, max: 700 }, ec: { min: 90, max: 160 } },
        zielbereich: { ph: { min: 600, max: 650 }, ec: { min: 100, max: 140 }, zaehlende: 2 },
      }),
    );
    expect(q.texte).toEqual(['passt: pH 6.0 bis 6.5, EC 1.0 bis 1.4']);
  });

  it('R3.2 EINSTUFUNG_NAME und passungText verbindet Stufe und Gründe mit ·', () => {
    expect(EINSTUFUNG_NAME).toEqual({
      empfohlen: 'Empfohlen',
      moeglich: 'Möglich',
      nicht_empfohlen: 'Nicht empfohlen',
    });
    const p = passung(
      kontext({
        kandidat: { systemeignung: 'dwc' },
        gefaess: { betriebsart: 'kratky_belueftet', freieLoecher: [], lochGroesseMm: 80 },
      }),
    );
    expect(p.gruende).toEqual(['P1', 'P3']);
    expect(passungText(p)).toBe('Nicht empfohlen · nicht für Kratky · kein freies 8-cm-Loch');
    expect(passungText(passung(kontext()))).toMatch(/^Empfohlen · passt: /);
  });
});

describe('R3.2 P1 Systemeignung', () => {
  it('UC5-AK8 Tomate für Kratky belüftet ist Nicht empfohlen mit «nicht für Kratky»', () => {
    const p = passung(
      kontext({
        kandidat: { name: 'Ochsenherz', artId: 'solanum_lycopersicum', systemeignung: 'dwc' },
        gefaess: { kennung: '3.3', betriebsart: 'kratky_belueftet', lochGroesseMm: 50, lochzahl: 8 },
      }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende[0]).toBe('P1');
    expect(p.texte[0]).toBe('nicht für Kratky');
    // reines Kratky ebenso
    expect(
      passung(kontext({ kandidat: { systemeignung: 'dwc' }, gefaess: { betriebsart: 'kratky' } })).gruende,
    ).toEqual(['P1']);
  });

  it('UC5-AK8 Art dwc in konstantpegel ist erlaubt, Art kratky in DWC ist «nicht für DWC»', () => {
    expect(
      passung(kontext({ kandidat: { systemeignung: 'dwc' }, gefaess: { betriebsart: 'konstantpegel' } }))
        .gruende,
    ).toEqual([]);
    expect(
      passung(kontext({ kandidat: { systemeignung: 'dwc' }, gefaess: { betriebsart: 'dwc' } })).gruende,
    ).toEqual([]);
    const p = passung(kontext({ kandidat: { systemeignung: 'kratky' }, gefaess: { betriebsart: 'dwc' } }));
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P1']);
    expect(p.texte).toEqual(['nicht für DWC']);
    expect(
      passung(kontext({ kandidat: { systemeignung: 'kratky' }, gefaess: { betriebsart: 'konstantpegel' } }))
        .gruende,
    ).toEqual(['P1']);
    for (const betriebsart of ['kratky', 'kratky_belueftet'] as const)
      expect(
        passung(kontext({ kandidat: { systemeignung: 'kratky' }, gefaess: { betriebsart } })).gruende,
      ).toEqual([]);
    for (const betriebsart of ['dwc', 'konstantpegel', 'kratky', 'kratky_belueftet'] as const)
      expect(
        passung(kontext({ kandidat: { systemeignung: 'beide' }, gefaess: { betriebsart } })).gruende,
      ).toEqual([]);
  });

  it('R3.2 P1 ohne Systemeignung ist nicht prüfbar (A2)', () => {
    const p = passung(
      kontext({ kandidat: { systemeignung: undefined }, gefaess: { betriebsart: 'kratky' } }),
    );
    expect(p.einstufung).toBe('empfohlen');
    expect(nichtGeprueft(p, 'P1')).toBe(true);
    expect(trifft(p, 'P1')).toBe(false);
  });
});

describe('R3.2 P2 Restbreite', () => {
  it('UC5-AK2 Matador 1.2–1.8 für 2.3 mit Salat 1.0–1.4 ist Nicht empfohlen mit P2 (Restbreite 0.2)', () => {
    const p = passung(
      kontext({
        kandidat: {
          name: 'Matador',
          artId: 'spinacia_oleracea',
          kulturgruppeId: 'spinat',
          ph: { min: 600, max: 700 },
          ec: { min: 120, max: 180 },
          kulturdauerTypischD: 30,
        },
      }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende[0]).toBe('P2');
    expect(p.restbreiteEc).toBe(20);
  });

  it('UC5-AK10 pH 5.8–6.0 gegen 6.0–6.5 Restbreite 0 ist Nicht empfohlen', () => {
    const p = passung(kontext({ kandidat: { ph: { min: 580, max: 600 } } }));
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P2']);
    expect(p.texte[0]).toContain('schmaler als 0.3');
  });

  it('R3.2 P2 Texte: «pH bleibt 6.0 bis 6.2, schmaler als 0.3» und «EC: keine Schnittmenge mit 1.0 bis 1.4»', () => {
    const ph = passung(kontext({ kandidat: { ph: { min: 580, max: 620 } } }));
    expect(ph.texte[0]).toBe('pH bleibt 6.0 bis 6.2, schmaler als 0.3');
    const ec = passung(
      kontext({ kandidat: { ec: { min: 150, max: 180 } }, leitkultur: leit({ ec: { min: 150, max: 180 } }) }),
    );
    expect(ec.gruende).toEqual(['P2']);
    expect(ec.restbreiteEc).toBe(0);
    expect(ec.texte[0]).toBe('EC: keine Schnittmenge mit 1.0 bis 1.4');
  });

  it('R3.2 P2 Grenzen: pH Restbreite 0.30 trifft nicht, 0.29 trifft; EC 0.30 mit u_EC 0.10 nicht, mit u_EC 0.20 schon', () => {
    expect(passung(kontext({ kandidat: { ph: { min: 580, max: 630 } } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { ph: { min: 580, max: 629 } } })).gruende).toEqual(['P2']);
    const ec30 = kontext({
      kandidat: { ec: { min: 100, max: 130 } },
      leitkultur: leit({ ec: { min: 100, max: 130 } }),
    });
    expect(passung(ec30).gruende).toEqual([]);
    expect(passung(ec30).restbreiteEc).toBe(30);
    expect(passung({ ...ec30, uEc: 20 }).gruende).toEqual(['P2']);
    expect(passung({ ...ec30, uEc: 15 }).gruende).toEqual([]);
    const ec29 = kontext({
      kandidat: { ec: { min: 100, max: 129 } },
      leitkultur: leit({ ec: { min: 100, max: 129 } }),
    });
    expect(passung(ec29).gruende).toEqual(['P2']);
  });

  it('R3.2 P2 ohne Band des Kandidaten oder ohne Zielbereich-Band ist nicht prüfbar (A2, A17)', () => {
    const ohneKandidat = passung(kontext({ kandidat: { ph: undefined, ec: undefined }, leitkultur: null }));
    expect(nichtGeprueft(ohneKandidat, 'P2')).toBe(true);
    expect(trifft(ohneKandidat, 'P2')).toBe(false);
    // ohne_band bei zählenden Pflanzungen: P2 nicht prüfbar, P7 bis P11 werden geprüft (A17)
    const ohneBand = passung(
      kontext({
        zielbereich: { zaehlende: 2 },
        kandidat: { kulturdauerTypischD: 90 },
        leitkultur: SALAT_LEIT,
      }),
    );
    expect(nichtGeprueft(ohneBand, 'P2')).toBe(true);
    expect(ohneBand.einstufung).toBe('moeglich');
    expect(ohneBand.gruende).toEqual(['P8']);
  });
});

describe('R3.2 P3 freies Loch', () => {
  it('R3.2 P3 kein freies Loch am Umsetzdatum trifft, ein freies Loch nicht', () => {
    const p = passung(kontext({ gefaess: { freieLoecher: [] } }));
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P3']);
    expect(p.texte).toEqual(['kein freies 8-cm-Loch']);
    expect(passung(kontext({ gefaess: { freieLoecher: [1] } })).gruende).toEqual([]);
    // Lochgrösse des Gefässes im Text
    expect(passung(kontext({ gefaess: { freieLoecher: [], lochGroesseMm: 50 } })).texte).toEqual([
      'kein freies 5-cm-Loch',
    ]);
    // P3 ist immer prüfbar
    expect(nichtGeprueft(p, 'P3')).toBe(false);
  });
});

describe('R3.2 P4 Licht', () => {
  it('UC5-AK14 Spinat als Kopf auf Ebene 3 bei 15 h ist Schossgefahr', () => {
    const p = passung(
      kontext({
        ...LEER,
        kandidat: {
          name: 'Matador',
          artId: 'spinacia_oleracea',
          kulturgruppeId: 'spinat',
          kulturform: 'kopf',
          ph: { min: 600, max: 700 },
          ec: { min: 120, max: 180 },
          lichtMaxH: 14,
          photoperiode: 'langtag',
          kritischeTageslaengeH: 13,
          kulturdauerTypischD: 45,
          wuchshoeheMm: 300,
          pythium: 'hoch',
        },
        gefaess: {
          kennung: '3.3',
          betriebsart: 'kratky_belueftet',
          lochGroesseMm: 50,
          lochzahl: 8,
          freieLoecher: [1, 2, 3, 4, 5, 6, 7, 8],
          bereich: { name: 'Ebene 3', lichtstundenH: 15, nutzbareHoeheMm: 150 },
        },
      }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende[0]).toBe('P4');
    expect(p.texte[0]).toBe('Schossgefahr bei 15 h Licht');
  });

  it('UC5-AK14 Spinat als Babyleaf hat keine Lichtzeile', () => {
    const p = passung(
      kontext({
        ...LEER,
        kandidat: {
          kulturform: 'babyleaf',
          lichtMaxH: 14,
          photoperiode: 'langtag',
          kritischeTageslaengeH: 13,
          kulturdauerTypischD: 30,
          wuchshoeheMm: 300,
        },
        gefaess: { bereich: { name: 'Ebene 3', lichtstundenH: 15, nutzbareHoeheMm: 150 } },
      }),
    );
    expect(trifft(p, 'P4')).toBe(false);
    expect(trifft(p, 'P5')).toBe(false);
    expect(p.einstufung).toBe('empfohlen');
  });

  it('R3.2 P4 Kulturdauer 37 ≤ 40 ist von der Lichtzeile ausgenommen', () => {
    const licht = { lichtMaxH: 14, kulturform: 'kopf' as const };
    expect(passung(kontext({ kandidat: { ...licht, kulturdauerTypischD: 37 } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { ...licht, kulturdauerTypischD: 40 } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { ...licht, kulturdauerTypischD: 41 } })).gruende).toEqual(['P4']);
    // Lichtstunden gleich dem Maximum: keine Schossgefahr
    expect(passung(kontext({ kandidat: { lichtMaxH: 15, kulturdauerTypischD: 56 } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { lichtMaxH: 14, kulturdauerTypischD: 56 } })).gruende).toEqual([
      'P4',
    ]);
  });

  it('R3.2 P4 Langtag mit kritischer Tageslänge 13 h unter 15 h Licht trifft', () => {
    const lang = { lichtMaxH: undefined, photoperiode: 'langtag' as const, kulturdauerTypischD: 56 };
    expect(passung(kontext({ kandidat: { ...lang, kritischeTageslaengeH: 13 } })).gruende).toEqual(['P4']);
    expect(passung(kontext({ kandidat: { ...lang, kritischeTageslaengeH: 15 } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { ...lang, kritischeTageslaengeH: 14.5 } })).gruende).toEqual(['P4']);
    // Kurztag und tagneutral: keine Langtag-Regel
    expect(
      passung(kontext({ kandidat: { ...lang, photoperiode: 'kurztag', kritischeTageslaengeH: 13 } })).gruende,
    ).toEqual([]);
  });

  it('R3.2 P4 ohne Lichtstunden des Bereichs ist nicht prüfbar', () => {
    const p = passung(
      kontext({
        kandidat: { lichtMaxH: 14, kulturdauerTypischD: 56 },
        gefaess: { bereich: { name: 'Ebene 2', nutzbareHoeheMm: 200 } },
      }),
    );
    expect(trifft(p, 'P4')).toBe(false);
    expect(nichtGeprueft(p, 'P4')).toBe(true);
    // weder licht_h noch Langtag mit kritischer Tageslänge
    const q = passung(
      kontext({
        kandidat: { lichtMaxH: undefined, photoperiode: undefined, kritischeTageslaengeH: undefined },
      }),
    );
    expect(nichtGeprueft(q, 'P4')).toBe(true);
    expect(q.einstufung).toBe('empfohlen');
  });
});

describe('R3.2 P5 Höhe', () => {
  const ebene3 = {
    kennung: '3.3',
    betriebsart: 'kratky_belueftet' as const,
    lochGroesseMm: 50 as const,
    lochzahl: 8,
    freieLoecher: [1, 2, 3],
    bereich: { name: 'Ebene 3', lichtstundenH: 15, nutzbareHoeheMm: 150 },
  };
  const mangold = {
    name: 'Rhubarb Chard',
    artId: 'beta_vulgaris',
    kulturgruppeId: 'mangold',
    wuchshoeheMm: 450,
    wuchsform: 'aufrecht' as const,
    entspitzen: false,
    kulturdauerTypischD: 120,
    ph: { min: 600, max: 680 },
    ec: { min: 100, max: 160 },
  };

  it('UC5-AK14 Mangold Dauerkultur Blatt ohne Entspitzen 45 cm für Ebene 3 ist Nicht empfohlen mit P5', () => {
    const p = passung(
      kontext({ ...LEER, kandidat: { ...mangold, kulturform: 'dauerkultur_blatt' }, gefaess: ebene3 }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P5']);
    expect(p.texte).toEqual(['zu hoch für Ebene 3 (15 cm)']);
  });

  it('UC5-AK14 Mangold als Babyleaf wird ohne Höhenzeile geprüft', () => {
    const p = passung(
      kontext({
        ...LEER,
        kandidat: { ...mangold, kulturform: 'babyleaf', kulturdauerTypischD: 30 },
        gefaess: ebene3,
      }),
    );
    expect(trifft(p, 'P5')).toBe(false);
    expect(p.einstufung).toBe('empfohlen');
  });

  it('R3.2 P5 Schnitt, Dauerkultur Blatt mit Entspitzen und Wuchsform hängend sind ausgenommen', () => {
    const fall = (k: Partial<Kandidat>) =>
      passung(kontext({ ...LEER, kandidat: { ...mangold, ...k }, gefaess: ebene3 })).gruende;
    expect(fall({ kulturform: 'schnitt' })).toEqual([]);
    expect(fall({ kulturform: 'dauerkultur_blatt', entspitzen: true })).toEqual([]);
    expect(fall({ kulturform: 'dauerkultur_blatt', wuchsform: 'haengend' })).toEqual([]);
    expect(fall({ kulturform: 'kopf' })).toEqual(['P5']);
    // Entspitzen gilt nur für Dauerkultur Blatt
    expect(fall({ kulturform: 'kopf', entspitzen: true })).toEqual(['P5']);
    // Grenze: Wuchshöhe + 100 mm = nutzbare Höhe trifft nicht, 1 mm mehr trifft
    expect(fall({ kulturform: 'kopf', wuchshoeheMm: 50 })).toEqual([]);
    expect(fall({ kulturform: 'kopf', wuchshoeheMm: 51 })).toEqual(['P5']);
  });

  it('R3.3 hängend erzeugt den Hinweis an die gangseitige Längskante', () => {
    const p = passung(kontext({ kandidat: { wuchsform: 'haengend' } }));
    expect(p.hinweise.some((h) => h.includes('an die gangseitige Längskante'))).toBe(true);
    expect(passung(kontext()).hinweise.some((h) => h.includes('Längskante'))).toBe(false);
  });

  it('R3.2 P5 ohne Wuchshöhe oder ohne nutzbare Höhe ist nicht prüfbar', () => {
    const ohneWuchs = passung(
      kontext({ ...LEER, kandidat: { ...mangold, wuchshoeheMm: undefined }, gefaess: ebene3 }),
    );
    expect(nichtGeprueft(ohneWuchs, 'P5')).toBe(true);
    expect(trifft(ohneWuchs, 'P5')).toBe(false);
    const ohneHoehe = passung(
      kontext({
        ...LEER,
        kandidat: { ...mangold, kulturform: 'dauerkultur_blatt' },
        gefaess: { ...ebene3, bereich: { name: 'Ebene 3', lichtstundenH: 15 } },
      }),
    );
    expect(nichtGeprueft(ohneHoehe, 'P5')).toBe(true);
    expect(ohneHoehe.einstufung).toBe('empfohlen');
  });
});

describe('R3.2 P6 Wärme', () => {
  it('R3.2 P6 Wassertemperatur-Maximum 23 °C über Art-Maximum 22 trifft', () => {
    const p = passung(
      kontext({ kandidat: { temp: { min: 1800, max: 2200 } }, gefaess: { wassertempMax7d: 2300 } }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P6']);
    expect(p.texte).toEqual(['Wasser zu warm (23 °C)']);
    // gleich dem Maximum trifft nicht
    expect(
      passung(kontext({ kandidat: { temp: { min: 1800, max: 2200 } }, gefaess: { wassertempMax7d: 2200 } }))
        .gruende,
    ).toEqual([]);
  });

  it('R3.2 P6 keine Schnittmenge der Temperaturbänder trifft auch ohne Messung', () => {
    const p = passung(
      kontext({
        kandidat: { temp: { min: 2100, max: 2600 } },
        zielbereich: {
          ph: { min: 600, max: 650 },
          ec: { min: 100, max: 140 },
          temp: { min: 1800, max: 2000 },
          zaehlende: 3,
        },
        gefaess: { wassertempMax7d: undefined },
      }),
    );
    expect(p.gruende).toEqual(['P6']);
  });

  it('R3.2 P6 ohne Messung und mit Schnittmenge trifft nicht', () => {
    const p = passung(
      kontext({
        kandidat: { temp: { min: 2000, max: 2600 } },
        zielbereich: {
          ph: { min: 600, max: 650 },
          ec: { min: 100, max: 140 },
          temp: { min: 1800, max: 2000 },
          zaehlende: 3,
        },
        gefaess: { wassertempMax7d: undefined },
      }),
    );
    expect(p.gruende).toEqual([]);
    expect(nichtGeprueft(p, 'P6')).toBe(false);
  });

  it('R3.2 P6 ohne Temperaturband des Kandidaten ist nicht prüfbar', () => {
    const p = passung(kontext({ kandidat: { temp: undefined }, gefaess: { wassertempMax7d: 3000 } }));
    expect(trifft(p, 'P6')).toBe(false);
    expect(nichtGeprueft(p, 'P6')).toBe(true);
  });
});

describe('R3.2 P7 bis P11 (Möglich)', () => {
  const spinat = {
    name: 'Matador',
    artId: 'spinacia_oleracea',
    kulturgruppeId: 'salat',
    pythium: 'hoch' as const,
  };

  it('R3.2 P7 Basilikum und Spinat beide hoch trifft, Spinat allein oder Spinat mit Spinat nicht', () => {
    const p = passung(
      kontext({
        kandidat: spinat,
        mitbewohnerArten: [
          { artId: 'lactuca_sativa', pythium: 'gering' },
          { artId: 'ocimum_basilicum', pythium: 'hoch' },
        ],
      }),
    );
    expect(p.einstufung).toBe('moeglich');
    expect(p.gruende).toEqual(['P7']);
    expect(p.texte).toEqual(['beide pythiumanfällig']);
    expect(
      passung(
        kontext({ kandidat: spinat, mitbewohnerArten: [{ artId: 'lactuca_sativa', pythium: 'gering' }] }),
      ).gruende,
    ).toEqual([]);
    expect(
      passung(
        kontext({ kandidat: spinat, mitbewohnerArten: [{ artId: 'spinacia_oleracea', pythium: 'hoch' }] }),
      ).gruende,
    ).toEqual([]);
    expect(
      passung(
        kontext({
          kandidat: { ...spinat, pythium: 'mittel' },
          mitbewohnerArten: [{ artId: 'ocimum_basilicum', pythium: 'hoch' }],
        }),
      ).gruende,
    ).toEqual([]);
  });

  it('R3.2 P7 ohne Pythium des Kandidaten ist nicht prüfbar', () => {
    const p = passung(
      kontext({
        kandidat: { ...spinat, pythium: undefined },
        mitbewohnerArten: [{ artId: 'ocimum_basilicum', pythium: 'hoch' }],
      }),
    );
    expect(nichtGeprueft(p, 'P7')).toBe(true);
    expect(p.einstufung).toBe('empfohlen');
  });

  it('R3.2 P8 Kulturdauer 150 über Leitkultur 56 trifft, gleich nicht', () => {
    const p = passung(kontext({ kandidat: { kulturdauerTypischD: 150, lichtMaxH: 16 } }));
    expect(p.einstufung).toBe('moeglich');
    expect(p.gruende).toEqual(['P8']);
    expect(p.texte).toEqual(['bleibt länger als die Leitkultur']);
    expect(passung(kontext({ kandidat: { kulturdauerTypischD: 56 } })).gruende).toEqual([]);
    expect(passung(kontext({ kandidat: { kulturdauerTypischD: 57 } })).gruende).toEqual(['P8']);
    const ohne = passung(kontext({ kandidat: { kulturdauerTypischD: undefined } }));
    expect(nichtGeprueft(ohne, 'P8')).toBe(true);
    const ohneLeit = passung(
      kontext({
        kandidat: { kulturdauerTypischD: 150 },
        leitkultur: leit({ kulturdauerTypischD: undefined }),
      }),
    );
    expect(nichtGeprueft(ohneLeit, 'P8')).toBe(true);
    expect(trifft(ohneLeit, 'P8')).toBe(false);
  });

  it('R3.2 P9 Wuchshöhe 100 unter 1/3 von 450 ohne freies Randloch trifft, mit Randloch nicht', () => {
    const hoch = leit({ wuchshoeheMm: 450 });
    const ohneRand = { freieLoecher: [5], randloecher: [1, 2, 3] };
    const p = passung(kontext({ kandidat: { wuchshoeheMm: 100 }, leitkultur: hoch, gefaess: ohneRand }));
    expect(p.einstufung).toBe('moeglich');
    expect(p.gruende).toEqual(['P9']);
    expect(p.texte).toEqual(['wird beschattet']);
    expect(
      passung(
        kontext({
          kandidat: { wuchshoeheMm: 100 },
          leitkultur: hoch,
          gefaess: { ...ohneRand, freieLoecher: [1, 5] },
        }),
      ).gruende,
    ).toEqual([]);
    // Grenze: 100 · 3 = 300 ist nicht kleiner als 300, 99 · 3 = 297 schon
    const mittel = leit({ wuchshoeheMm: 300 });
    expect(
      passung(kontext({ kandidat: { wuchshoeheMm: 100 }, leitkultur: mittel, gefaess: ohneRand })).gruende,
    ).toEqual([]);
    expect(
      passung(kontext({ kandidat: { wuchshoeheMm: 99 }, leitkultur: mittel, gefaess: ohneRand })).gruende,
    ).toEqual(['P9']);
    const ohne = passung(
      kontext({
        kandidat: { wuchshoeheMm: 100 },
        leitkultur: leit({ wuchshoeheMm: undefined }),
        gefaess: ohneRand,
      }),
    );
    expect(nichtGeprueft(ohne, 'P9')).toBe(true);
    expect(trifft(ohne, 'P9')).toBe(false);
  });

  it('R3.2 P10 Band 1.5–1.8 enthält Mitte 1.2 nicht', () => {
    const p = passung(
      kontext({
        kandidat: { ec: { min: 150, max: 180 } },
        zielbereich: { ph: { min: 600, max: 650 }, ec: { min: 100, max: 200 }, zaehlende: 3 },
      }),
    );
    expect(p.einstufung).toBe('moeglich');
    expect(p.gruende).toEqual(['P10']);
    expect(p.texte[0]).toMatch(/^EC-Mitte 1\.65 gegen 1\.2$/);
    expect(p.abstandMitten).toBe(45);
    // Mitte genau auf der Grenze ist enthalten
    expect(
      passung(
        kontext({
          kandidat: { ec: { min: 120, max: 160 } },
          zielbereich: { ph: { min: 600, max: 650 }, ec: { min: 100, max: 200 }, zaehlende: 3 },
        }),
      ).gruende,
    ).toEqual([]);
  });

  it('R3.2 P10 andere Kulturgruppe und Mittenabstand 0.25 trifft, 0.20 nicht', () => {
    const ziel = { ph: { min: 600, max: 650 }, ec: { min: 100, max: 200 }, zaehlende: 3 };
    const andere = { kulturgruppeId: 'kraeuter' };
    const p25 = passung(kontext({ kandidat: { ...andere, ec: { min: 100, max: 190 } }, zielbereich: ziel }));
    expect(p25.abstandMitten).toBe(25);
    expect(p25.gruende).toEqual(['P10']);
    const p20 = passung(kontext({ kandidat: { ...andere, ec: { min: 100, max: 180 } }, zielbereich: ziel }));
    expect(p20.abstandMitten).toBe(20);
    expect(p20.gruende).toEqual([]);
    // gleiche Kulturgruppe mit 0.25: trifft nicht
    expect(passung(kontext({ kandidat: { ec: { min: 100, max: 190 } }, zielbereich: ziel })).gruende).toEqual(
      [],
    );
  });

  it('R3.2 P10 ohne EC-Band einer Seite ist nicht prüfbar', () => {
    const p = passung(kontext({ leitkultur: leit({ ec: undefined }) }));
    expect(nichtGeprueft(p, 'P10')).toBe(true);
    expect(p.einstufung).toBe('empfohlen');
  });

  it('R3.2 P11 Kratky belüftet 7 l / 8 Löcher < 4 l trifft; DWC nur Hinweis', () => {
    const kratky = { betriebsart: 'kratky_belueftet' as const, betriebsvolumenL: 7, lochzahl: 8 };
    const p = passung(kontext({ kandidat: { wasserbedarfL: 4 }, gefaess: kratky }));
    expect(p.einstufung).toBe('moeglich');
    expect(p.gruende).toEqual(['P11']);
    expect(p.texte).toEqual(['zu wenig Liter je Pflanze']);
    expect(passung(kontext({ kandidat: { wasserbedarfL: 0.5 }, gefaess: kratky })).gruende).toEqual([]);
    // Grenze: 8 l / 8 Löcher = 1 l je Pflanze bei Bedarf 1 l trifft nicht
    expect(
      passung(kontext({ kandidat: { wasserbedarfL: 1 }, gefaess: { ...kratky, betriebsvolumenL: 8 } }))
        .gruende,
    ).toEqual([]);
    const dwc = passung(
      kontext({ kandidat: { wasserbedarfL: 4 }, gefaess: { betriebsvolumenL: 7, lochzahl: 8 } }),
    );
    expect(dwc.gruende).toEqual([]);
    expect(dwc.einstufung).toBe('empfohlen');
    expect(dwc.hinweise.some((h) => h.includes('Liter'))).toBe(true);
    const ohne = passung(kontext({ kandidat: { wasserbedarfL: undefined }, gefaess: kratky }));
    expect(nichtGeprueft(ohne, 'P11')).toBe(true);
  });

  it('R3.2 P8 bis P10 ohne Leitkultur sind nicht prüfbar (A16)', () => {
    const p = passung(
      kontext({
        leitkultur: null,
        kandidat: { kulturdauerTypischD: 150, wuchshoeheMm: 10, ec: { min: 100, max: 140 } },
        gefaess: { freieLoecher: [5], randloecher: [1] },
      }),
    );
    expect(p.nichtGeprueft).toEqual(expect.arrayContaining(['P8', 'P9', 'P10']));
    expect(p.gruende).toEqual([]);
    expect(p.einstufung).toBe('empfohlen');
    // Abstand ohne Leitkultur gegen die Zielbereich-Mitte (1.2): Kandidat 1.0–1.6 → 0.10
    expect(
      passung(kontext({ leitkultur: null, kandidat: { ec: { min: 100, max: 160 } } })).abstandMitten,
    ).toBe(10);
  });
});

describe('R3.2 Stufe, Gründe, leeres Gefäss', () => {
  it('R3.2 leeres Gefäss prüft nur P1 bis P6, P2 entfällt ohne Zielbereich (A3)', () => {
    const p = passung(
      kontext({
        ...LEER,
        // schmales eigenes Band, Kratky belüftet mit zu wenig Liter, Pythium hoch: im leeren Gefäss ohne Wirkung
        kandidat: {
          ph: { min: 600, max: 620 },
          ec: { min: 100, max: 120 },
          wasserbedarfL: 4,
          pythium: 'hoch',
        },
        gefaess: { betriebsart: 'kratky_belueftet', betriebsvolumenL: 9, lochzahl: 8 },
      }),
    );
    expect(p.einstufung).toBe('empfohlen');
    expect(p.gruende).toEqual([]);
    expect(trifft(p, 'P2')).toBe(false);
    // Empfohlen-Text mit dem Band der Sorte; Restbreite EC = Breite des Kandidatenbands
    expect(p.texte).toEqual(['passt: pH 6.0 bis 6.2, EC 1.0 bis 1.2']);
    expect(p.restbreiteEc).toBe(20);
    expect(p.abstandMitten).toBe(0);
    // P1, P3 bis P6 gelten weiter
    expect(passung(kontext({ ...LEER, gefaess: { freieLoecher: [] } })).gruende).toEqual(['P3']);
    expect(passung(kontext({ ...LEER, kandidat: { systemeignung: 'kratky' } })).gruende).toEqual(['P1']);
  });

  it('R3.2 Stufe ist die der ersten zutreffenden Zeile, Gründe sind die ersten zwei dieser Stufe', () => {
    const p = passung(
      kontext({
        kandidat: { systemeignung: 'dwc', pythium: 'hoch' },
        gefaess: { betriebsart: 'kratky_belueftet', freieLoecher: [] },
        mitbewohnerArten: [{ artId: 'ocimum_basilicum', pythium: 'hoch' }],
      }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P1', 'P3']);
    expect(p.texte).toEqual(['nicht für Kratky', 'kein freies 8-cm-Loch']);
  });

  it('R3.2 drei zutreffende Zeilen einer Stufe liefern genau zwei Gründe', () => {
    const ne = passung(
      kontext({
        kandidat: { systemeignung: 'kratky', wuchshoeheMm: 400 },
        gefaess: { freieLoecher: [] },
      }),
    );
    expect(ne.gruende).toEqual(['P1', 'P3']);
    const m = passung(
      kontext({
        kandidat: { pythium: 'hoch', kulturdauerTypischD: 150, wasserbedarfL: 4 },
        gefaess: { betriebsart: 'kratky_belueftet', betriebsvolumenL: 7, lochzahl: 8 },
        mitbewohnerArten: [{ artId: 'ocimum_basilicum', pythium: 'hoch' }],
      }),
    );
    expect(m.einstufung).toBe('moeglich');
    expect(m.gruende).toEqual(['P7', 'P8']);
    expect(m.texte).toHaveLength(2);
  });

  it('R3.2 Möglich-Zeile vor Nicht-empfohlen-Zeile in der Prüfreihenfolge ändert die Stufe nicht', () => {
    // P8 (Möglich) und P6 (Nicht empfohlen): die Stufe kommt von P6, P8 ist kein Grund
    const p = passung(
      kontext({
        kandidat: { kulturdauerTypischD: 150, temp: { min: 1800, max: 2200 } },
        gefaess: { wassertempMax7d: 2500 },
      }),
    );
    expect(p.einstufung).toBe('nicht_empfohlen');
    expect(p.gruende).toEqual(['P6']);
  });

  it('nichtGeprueft listet Zeilen ohne Stammwert', () => {
    const p = passung(
      kontext({
        kandidat: {
          systemeignung: undefined,
          lichtMaxH: undefined,
          photoperiode: undefined,
          wuchshoeheMm: undefined,
          pythium: undefined,
        },
      }),
    );
    expect(p.nichtGeprueft).toEqual(['P1', 'P4', 'P5', 'P7', 'P9']);
    expect(p.einstufung).toBe('empfohlen');
    expect(p.gruende).toEqual([]);
  });
});

describe('R3.2 Sortierung und Rang', () => {
  const p = (einstufung: Passung['einstufung'], restbreiteEc: number, abstandMitten: number): Passung => ({
    einstufung,
    gruende: [],
    texte: [],
    hinweise: [],
    nichtGeprueft: [],
    restbreiteEc,
    abstandMitten,
  });

  it('R3.2 Sortierung je Stufe: Restbreite EC absteigend, dann Mittenabstand aufsteigend, dann Name; Rang über alle Stufen', () => {
    const liste = [
      { name: 'Zwiebel', passung: p('nicht_empfohlen', 60, 0) },
      { name: 'Dill', passung: p('empfohlen', 30, 10) },
      { name: 'Kresse', passung: p('moeglich', 10, 0) },
      { name: 'Basilikum', passung: p('empfohlen', 40, 20) },
      { name: 'Chicorée', passung: p('empfohlen', 40, 5) },
      { name: 'Anis', passung: p('empfohlen', 30, 10) },
      { name: 'Lauch', passung: p('moeglich', 50, 30) },
    ];
    const s = sortiert(liste);
    expect(s.map((x) => [x.name, x.rang])).toEqual([
      ['Chicorée', 1],
      ['Basilikum', 2],
      ['Anis', 3],
      ['Dill', 4],
      ['Lauch', 5],
      ['Kresse', 6],
      ['Zwiebel', 7],
    ]);
    // Eingabe bleibt unverändert, die Einträge behalten ihre Felder
    expect(liste[0]?.name).toBe('Zwiebel');
    expect(s[0]?.passung.restbreiteEc).toBe(40);
  });
});
