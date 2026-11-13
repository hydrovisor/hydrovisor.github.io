// Saatgut-Manager: Liste nach Gemüse, Filter, Reihe «Fotos nachtragen» und Erkennung aus dem Ergebnis der KI
// (Issue #211, Plan 211 Testliste Unit; SG1-AK1 bis SG1-AK3; R1.2, R1.4; Konzept 6.1 UC4, 8.1 Regel 2; Plan 207
// aktuelleTuetenfotos). Reine Funktionen ohne Zeit, darum ohne Uhr. Erfundene Sorten und UUIDs, keine Personendaten.
//
// Vorausgesetzt (Plan 211, Domäne und Datenfluss; seit Plan 215 mit Vorrat, die Fixture hat kein vorrat_ereignis,
// darum sind hier alle Sorten vorrätig; Vorrat selbst prüft tests/unit/vorrat.test.ts):
//   src/domain/sorten/saatgut.ts
//     type SaatgutStatus = 'vollständig' | 'Recherche offen' | 'aufgebraucht'
//     interface SaatgutZeile { sorteId; name; artId; artName; vollstaendig; status; ohneFoto; aufgebraucht; fotoPfad? }
//     saatgutListe(teile, jetzt?) → SaatgutZeile[] je gültige Sorte, nach artName, dann name (de-CH)
//     type SaatgutFilter = 'vorraetig' | 'ohne_foto' | 'aufgebraucht'
//     saatgutGruppen(liste, filter) → { gemuese; sorten }[]
//     saatgutZahlen(liste) → { vorraetig; ohneFoto; aufgebraucht }
//     nachtragReihe(liste), nachtragStarten(liste), nachtragWeiter(stand, wie), nachtragPosition(stand)
//   src/domain/sorten/erfassung.ts
//     sortennameNormalisieren(name), sorteErkennen(sorten, arten, felder), kulturtypVorschlagen(sorten, artId)
//     vorhandeneSorte() vergleicht über sortennameNormalisieren(); SorteZeile mit optionalem kulturtyp
import { describe, expect, it } from 'vitest';
import {
  nachtragPosition,
  nachtragReihe,
  nachtragStarten,
  nachtragWeiter,
  saatgutGruppen,
  saatgutListe,
  saatgutZahlen,
  type SaatgutZeile,
} from '../../src/domain/sorten/saatgut.ts';
import {
  kulturtypVorschlagen,
  sorteErkennen,
  sortennameNormalisieren,
  vorhandeneSorte,
  type ArtZeile,
  type SorteZeile,
} from '../../src/domain/sorten/erfassung.ts';
import type { Teile } from '../../src/domain/teile.ts';

const id = (n: number) => `21100000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const ROXETTE = id(1);
const BABYLEAF = id(2);
const LOLLO = id(3);
const NUESSLI = id(4);
const MISOME = id(5);
const GESCHLOSSEN = id(6);
const UNBEKANNT = id(8);

const gueltig = { gueltig_bis: null };

function foto(
  n: number,
  sorteId: string,
  seite: 'vorne' | 'hinten',
  ordner: string,
  erfasstAm: string,
  storniertAm: string | null = null,
) {
  return {
    id: id(100 + n),
    client_id: id(200 + n),
    sorte_id: sorteId,
    saatgut_id: null,
    seite,
    pfad: `${ordner}/${id(300 + n)}.jpg`,
    erfasst_am: erfasstAm,
    storniert_am: storniertAm,
    app_version: 'test',
  };
}

const PFAD = (n: number, ordner: string) => `${ordner}/${id(300 + n)}.jpg`;

/** Bündelteile mit Arten, Sorten, Vollständigkeit und Tütenfotos (Reihenfolge der Zeilen absichtlich gemischt) */
function teile(): Teile {
  return {
    art: [
      { art_id: 'lactuca_sativa', name_de: 'Salat', name_wiss: 'Lactuca sativa', ...gueltig },
      { art_id: 'brassica_rapa_chinensis', name_de: 'Pak Choi', name_wiss: 'Brassica rapa', ...gueltig },
      {
        art_id: 'valerianella_locusta',
        name_de: 'Nüsslisalat',
        name_wiss: 'Valerianella locusta',
        ...gueltig,
      },
    ],
    sorte: [
      { sorte_id: ROXETTE, name: 'Roxette', art_id: 'lactuca_sativa', kulturtyp: 'blatt', ...gueltig },
      { sorte_id: MISOME, name: 'Misome', art_id: 'brassica_rapa_chinensis', kulturtyp: 'blatt', ...gueltig },
      {
        sorte_id: BABYLEAF,
        name: 'Babyleaf-Mischung',
        art_id: 'lactuca_sativa',
        kulturtyp: 'blatt',
        ...gueltig,
      },
      {
        sorte_id: GESCHLOSSEN,
        name: 'Alte Testsorte',
        art_id: 'lactuca_sativa',
        kulturtyp: 'blatt',
        gueltig_bis: '2027-01-02T00:00:00Z',
      },
      { sorte_id: UNBEKANNT, name: 'Ohne Gemüse', art_id: 'testus_ignotus', kulturtyp: 'blatt', ...gueltig },
      { sorte_id: LOLLO, name: 'Lollo Rossa Loka', art_id: 'lactuca_sativa', kulturtyp: 'blatt', ...gueltig },
      {
        sorte_id: NUESSLI,
        name: 'Dunkelgrüner vollherziger',
        art_id: 'valerianella_locusta',
        kulturtyp: 'blatt',
        ...gueltig,
      },
    ],
    v_vollstaendigkeit: [
      { sorte_id: ROXETTE, fehlende_groessen: 0, pruefauftraege: 1, vollstaendig: true },
      { sorte_id: BABYLEAF, fehlende_groessen: 3, pruefauftraege: 4, vollstaendig: false },
      { sorte_id: NUESSLI, fehlende_groessen: 0, pruefauftraege: 0, vollstaendig: true },
      { sorte_id: MISOME, fehlende_groessen: 1, pruefauftraege: 2, vollstaendig: false },
      // LOLLO und UNBEKANNT ohne Zeile in v_vollstaendigkeit
    ],
    tuetenfoto: [
      // Roxette: alte Vorderseite storniert, neue Vorderseite und Rückseite gültig
      foto(1, ROXETTE, 'vorne', ROXETTE, '2027-01-05T10:00:00.000Z', '2027-01-06T10:00:00.000Z'),
      foto(2, ROXETTE, 'vorne', ROXETTE, '2027-01-06T10:00:00.000Z'),
      foto(3, ROXETTE, 'hinten', ROXETTE, '2027-01-06T10:01:00.000Z'),
      // Lollo: nur Rückseite
      foto(4, LOLLO, 'hinten', LOLLO, '2027-01-06T11:00:00.000Z'),
      // Nüsslisalat: nur eine stornierte Vorderseite
      foto(5, NUESSLI, 'vorne', NUESSLI, '2027-01-04T09:00:00.000Z', '2027-01-04T09:30:00.000Z'),
      // Misome: Foto unter fremdem Ordner (Plan 37 A16), zählt nach sorte_id
      foto(6, MISOME, 'vorne', id(99), '2027-01-06T12:00:00.000Z'),
      // ältere gültige Rückseite von Roxette unter dem Ordner von Babyleaf: zählt nicht für Babyleaf
      foto(7, ROXETTE, 'hinten', BABYLEAF, '2027-01-03T08:00:00.000Z'),
      // Foto der geschlossenen Sorte
      foto(8, GESCHLOSSEN, 'vorne', GESCHLOSSEN, '2027-01-02T08:00:00.000Z'),
    ],
  };
}

const namen = (liste: readonly { name: string }[]) => liste.map((s) => s.name);
const zeile = (liste: readonly SaatgutZeile[], sorteId: string) => liste.find((s) => s.sorteId === sorteId);

describe('SG1-AK1 Saatgut-Liste', () => {
  it('SG1-AK1 saatgutListe liefert je gültige Sorte Gemüse (art.name_de), Status «vollständig» oder «Recherche offen» und ohne Foto', () => {
    const liste = saatgutListe(teile());
    expect(liste).toHaveLength(6);
    expect(zeile(liste, ROXETTE)).toMatchObject({
      sorteId: ROXETTE,
      name: 'Roxette',
      artId: 'lactuca_sativa',
      artName: 'Salat',
      vollstaendig: true,
      status: 'vollständig',
      ohneFoto: false,
    });
    expect(zeile(liste, BABYLEAF)).toMatchObject({
      name: 'Babyleaf-Mischung',
      artName: 'Salat',
      vollstaendig: false,
      status: 'Recherche offen',
      ohneFoto: true,
    });
    expect(zeile(liste, NUESSLI)).toMatchObject({
      artName: 'Nüsslisalat',
      status: 'vollständig',
      ohneFoto: true,
    });
    expect(zeile(liste, MISOME)).toMatchObject({ artName: 'Pak Choi', status: 'Recherche offen' });
    // Listenreihenfolge: nach Gemüse, dann Name (de-CH)
    expect(namen(liste)).toEqual([
      'Dunkelgrüner vollherziger',
      'Misome',
      'Babyleaf-Mischung',
      'Lollo Rossa Loka',
      'Roxette',
      'Ohne Gemüse',
    ]);
  });

  it('SG1-AK1 ohne Foto nur ohne gültige Zeile tuetenfoto: Rückseite allein zählt als Foto, stornierte Zeile und Zeile einer anderen Sorte zählen nicht', () => {
    const liste = saatgutListe(teile());
    // nur Rückseite
    expect(zeile(liste, LOLLO)?.ohneFoto).toBe(false);
    // nur stornierte Zeile
    expect(zeile(liste, NUESSLI)?.ohneFoto).toBe(true);
    // Zeile der Sorte Roxette unter dem Ordner von Babyleaf zählt nicht für Babyleaf
    expect(zeile(liste, BABYLEAF)?.ohneFoto).toBe(true);
    // fremder Ordner im Pfad, aber sorte_id stimmt (Plan 37 A16)
    expect(zeile(liste, MISOME)?.ohneFoto).toBe(false);
    // ohne Teil tuetenfoto sind alle Sorten ohne Foto
    const ohneTeil = { ...teile() };
    delete (ohneTeil as Record<string, unknown>)['tuetenfoto'];
    expect(saatgutListe(ohneTeil).every((s) => s.ohneFoto)).toBe(true);
  });

  it('SG1-AK1 fotoPfad ist die Vorderseite, sonst die Rückseite', () => {
    const liste = saatgutListe(teile());
    // jüngste gültige Vorderseite, nicht die stornierte und nicht die Rückseite
    expect(zeile(liste, ROXETTE)?.fotoPfad).toBe(PFAD(2, ROXETTE));
    expect(zeile(liste, LOLLO)?.fotoPfad).toBe(PFAD(4, LOLLO));
    expect(zeile(liste, MISOME)?.fotoPfad).toBe(PFAD(6, id(99)));
    expect(zeile(liste, BABYLEAF)?.fotoPfad).toBeUndefined();
    expect(zeile(liste, NUESSLI)?.fotoPfad).toBeUndefined();
  });

  it('SG1-AK1 Gruppen nach Gemüse de-CH alphabetisch (Nüsslisalat vor Pak Choi vor Salat), in der Gruppe nach Name', () => {
    const gruppen = saatgutGruppen(saatgutListe(teile()), 'vorraetig');
    expect(gruppen.map((g) => g.gemuese)).toEqual(['Nüsslisalat', 'Pak Choi', 'Salat', 'testus_ignotus']);
    expect(namen(gruppen[2]?.sorten ?? [])).toEqual(['Babyleaf-Mischung', 'Lollo Rossa Loka', 'Roxette']);
    expect(namen(gruppen[0]?.sorten ?? [])).toEqual(['Dunkelgrüner vollherziger']);
  });

  it('SG1-AK1 Filter Vorrätig zeigt alle gültigen Sorten, Ohne Foto nur Sorten ohne Foto; leere Gruppen fallen weg', () => {
    const liste = saatgutListe(teile());
    const vorraetig = saatgutGruppen(liste, 'vorraetig');
    expect(vorraetig.flatMap((g) => g.sorten.map((s) => s.sorteId)).sort()).toEqual(
      [ROXETTE, BABYLEAF, LOLLO, NUESSLI, MISOME, UNBEKANNT].sort(),
    );
    const ohneFoto = saatgutGruppen(liste, 'ohne_foto');
    // Pak Choi hat nur Misome mit Foto: die Gruppe fällt weg
    expect(ohneFoto.map((g) => g.gemuese)).toEqual(['Nüsslisalat', 'Salat', 'testus_ignotus']);
    expect(ohneFoto.find((g) => g.gemuese === 'Salat')?.sorten.map((s) => s.name)).toEqual([
      'Babyleaf-Mischung',
    ]);
    for (const g of ohneFoto) {
      expect(g.sorten.length).toBeGreaterThan(0);
      for (const s of g.sorten) expect(s.ohneFoto).toBe(true);
    }
    // leere Liste: keine Gruppe
    expect(saatgutGruppen([], 'vorraetig')).toEqual([]);
    expect(saatgutGruppen([], 'ohne_foto')).toEqual([]);
  });

  it('SG1-AK1 saatgutZahlen: vorrätig und ohne Foto stimmen mit den gefilterten Gruppen überein', () => {
    const liste = saatgutListe(teile());
    const zahlen = saatgutZahlen(liste);
    expect(zahlen).toEqual({ vorraetig: 6, ohneFoto: 3, aufgebraucht: 0 });
    const anzahl = (f: 'vorraetig' | 'ohne_foto') =>
      saatgutGruppen(liste, f).reduce((n, g) => n + g.sorten.length, 0);
    expect(zahlen.vorraetig).toBe(anzahl('vorraetig'));
    expect(zahlen.ohneFoto).toBe(anzahl('ohne_foto'));
    expect(saatgutZahlen([])).toEqual({ vorraetig: 0, ohneFoto: 0, aufgebraucht: 0 });
  });

  it('SG1-AK1 geschlossene Sorte (gueltig_bis gesetzt) fehlt; ohne Zeile v_vollstaendigkeit «Recherche offen»; ohne Art name_de die art_id', () => {
    const liste = saatgutListe(teile());
    expect(zeile(liste, GESCHLOSSEN)).toBeUndefined();
    expect(namen(liste)).not.toContain('Alte Testsorte');
    expect(zeile(liste, LOLLO)).toMatchObject({ vollstaendig: false, status: 'Recherche offen' });
    expect(zeile(liste, UNBEKANNT)).toMatchObject({
      artId: 'testus_ignotus',
      artName: 'testus_ignotus',
      status: 'Recherche offen',
      ohneFoto: true,
    });
  });
});

describe('SG1-AK2 Fotos nachtragen', () => {
  it('SG1-AK2 nachtragReihe enthält die Sorten ohne Foto in der Reihenfolge der Liste', () => {
    const reihe = nachtragReihe(saatgutListe(teile()));
    expect(reihe).toEqual([
      { sorteId: NUESSLI, name: 'Dunkelgrüner vollherziger', artName: 'Nüsslisalat' },
      { sorteId: BABYLEAF, name: 'Babyleaf-Mischung', artName: 'Salat' },
      { sorteId: UNBEKANNT, name: 'Ohne Gemüse', artName: 'testus_ignotus' },
    ]);
  });

  it('SG1-AK2 Position und Gesamtzahl bleiben ab dem Start fest, auch wenn inzwischen Fotos gespeichert sind', () => {
    const t = teile();
    const start = nachtragStarten(saatgutListe(t));
    expect(start).toMatchObject({ index: 0, ergaenzt: 0, uebersprungen: 0 });
    expect(nachtragPosition(start)).toEqual({
      fertig: false,
      nummer: 1,
      gesamt: 3,
      eintrag: { sorteId: NUESSLI, name: 'Dunkelgrüner vollherziger', artName: 'Nüsslisalat' },
    });
    // Foto für die erste Sorte gespeichert; das Bündel lädt nach
    const nachher: Teile = {
      ...t,
      tuetenfoto: [
        ...(t['tuetenfoto'] ?? []),
        foto(20, NUESSLI, 'vorne', NUESSLI, '2027-01-07T08:00:00.000Z'),
      ],
    };
    const neueListe = saatgutListe(nachher);
    expect(nachtragReihe(neueListe)).toHaveLength(2);
    expect(saatgutZahlen(neueListe).ohneFoto).toBe(2);
    // der Stand bleibt beim Schnappschuss
    const weiter = nachtragWeiter(start, 'ergaenzt');
    expect(nachtragPosition(weiter)).toEqual({
      fertig: false,
      nummer: 2,
      gesamt: 3,
      eintrag: { sorteId: BABYLEAF, name: 'Babyleaf-Mischung', artName: 'Salat' },
    });
    expect(weiter.reihe).toHaveLength(3);
    // der Startstand bleibt unverändert (rein)
    expect(nachtragPosition(start)).toMatchObject({ nummer: 1, gesamt: 3 });
  });

  it('SG1-AK2 Überspringen führt zur nächsten Sorte und zählt übersprungen', () => {
    const start = nachtragStarten(saatgutListe(teile()));
    const s1 = nachtragWeiter(start, 'uebersprungen');
    expect(s1).toMatchObject({ index: 1, ergaenzt: 0, uebersprungen: 1 });
    expect(nachtragPosition(s1)).toMatchObject({ fertig: false, nummer: 2, gesamt: 3 });
    const s2 = nachtragWeiter(s1, 'uebersprungen');
    expect(nachtragPosition(s2)).toEqual({
      fertig: false,
      nummer: 3,
      gesamt: 3,
      eintrag: { sorteId: UNBEKANNT, name: 'Ohne Gemüse', artName: 'testus_ignotus' },
    });
  });

  it('SG1-AK2 nach der letzten Sorte fertig mit Zahl der ergänzten und übersprungenen Sorten; weiteres nachtragWeiter ändert nichts', () => {
    let stand = nachtragStarten(saatgutListe(teile()));
    stand = nachtragWeiter(stand, 'ergaenzt');
    stand = nachtragWeiter(stand, 'uebersprungen');
    stand = nachtragWeiter(stand, 'uebersprungen');
    expect(nachtragPosition(stand)).toEqual({ fertig: true, ergaenzt: 1, uebersprungen: 2 });
    const danach = nachtragWeiter(nachtragWeiter(stand, 'ergaenzt'), 'uebersprungen');
    expect(danach).toEqual(stand);
    expect(nachtragPosition(danach)).toEqual({ fertig: true, ergaenzt: 1, uebersprungen: 2 });

    // alles übersprungen bis zum Ende
    let alle = nachtragStarten(saatgutListe(teile()));
    for (let i = 0; i < 3; i++) alle = nachtragWeiter(alle, 'uebersprungen');
    expect(nachtragPosition(alle)).toEqual({ fertig: true, ergaenzt: 0, uebersprungen: 3 });
  });

  it('SG1-AK2 ohne Sorte ohne Foto sofort fertig mit 0 ergänzt und 0 übersprungen', () => {
    const liste = saatgutListe(teile()).filter((s) => !s.ohneFoto);
    expect(nachtragReihe(liste)).toEqual([]);
    const stand = nachtragStarten(liste);
    expect(nachtragPosition(stand)).toEqual({ fertig: true, ergaenzt: 0, uebersprungen: 0 });
    expect(nachtragWeiter(stand, 'uebersprungen')).toEqual(stand);
    expect(nachtragPosition(nachtragStarten([]))).toEqual({ fertig: true, ergaenzt: 0, uebersprungen: 0 });
  });
});

// ---------------------------------------------------------------------
// SG1-AK3 Erkennung und Kulturtyp-Vorschlag
// ---------------------------------------------------------------------

const art = (art_id: string, name_de: string, name_wiss: string): ArtZeile => ({
  art_id,
  name_de,
  name_wiss,
  kulturgruppe_id: 'testgruppe',
  kulturformen_erlaubt: ['schnitt'],
  gueltig_bis: null,
});

const ARTEN: ArtZeile[] = [
  art('lactuca_sativa', 'Salat', 'Lactuca sativa'),
  art('beta_vulgaris_conditiva', 'Randen', 'Beta vulgaris subsp. conditiva'),
  art('ocimum_basilicum', 'Basilikum', 'Ocimum basilicum'),
  art('solanum_lycopersicum', 'Tomate', 'Solanum lycopersicum'),
  art('capsicum_annuum', 'Chili', 'Capsicum annuum'),
  { ...art('testus_vetus', 'Alte Art', 'Testus vetus'), gueltig_bis: '2027-01-01T00:00:00Z' },
];

const sorte = (
  n: number,
  name: string,
  art_id: string,
  kulturtyp: string | null,
  gueltig_bis: string | null = null,
): SorteZeile => ({ sorte_id: id(400 + n), name, art_id, kulturtyp, gueltig_bis });

const SORTEN: SorteZeile[] = [
  sorte(1, "Bull's Blood", 'beta_vulgaris_conditiva', 'blatt'),
  sorte(2, 'Lollo Rossa Loka', 'lactuca_sativa', 'blatt'),
  sorte(3, 'Babyleaf-Mischung', 'lactuca_sativa', 'blatt'),
  sorte(4, 'Roxette', 'lactuca_sativa', 'knolle'),
  sorte(5, 'Alte Testsorte', 'lactuca_sativa', 'frucht', '2027-01-02T00:00:00Z'),
  sorte(6, 'Alte Testsorte 2', 'lactuca_sativa', 'frucht', '2027-01-02T00:00:00Z'),
  sorte(7, 'Alte Testsorte 3', 'lactuca_sativa', 'frucht', '2027-01-02T00:00:00Z'),
  sorte(8, 'Genoveser', 'ocimum_basilicum', 'blatt'),
  sorte(9, 'Tumbling Tom', 'solanum_lycopersicum', 'frucht'),
  sorte(10, 'Testtomate Knolle', 'solanum_lycopersicum', 'knolle'),
  sorte(11, 'Prairie Fire', 'capsicum_annuum', 'frucht'),
  sorte(12, 'Testchili Blatt', 'capsicum_annuum', 'blatt'),
  sorte(13, 'Testchili ohne Typ', 'capsicum_annuum', null),
  sorte(14, 'Testchili ohne Typ 2', 'capsicum_annuum', null),
];

describe('SG1-AK3 Erkennung aus dem Ergebnis der KI', () => {
  it('SG1-AK3 sorteErkennen trifft trotz Gross- und Kleinschreibung, Anführungszeichen (\' " « » ‹ › „ “ ’) und Leerzeichen', () => {
    const bull = { sorteId: id(401), artId: 'beta_vulgaris_conditiva' };
    const lollo = { sorteId: id(402), artId: 'lactuca_sativa' };
    const roxette = { sorteId: id(404), artId: 'lactuca_sativa' };
    expect(sorteErkennen(SORTEN, ARTEN, { name: '‹BULL’S  BLOOD›', art: 'Randen' })).toEqual(bull);
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Bulls Blood', art: 'Randen' })).toEqual(bull);
    expect(sorteErkennen(SORTEN, ARTEN, { name: '„lollo rossa loka“', art: 'Lactuca sativa L.' })).toEqual(
      lollo,
    );
    expect(sorteErkennen(SORTEN, ARTEN, { name: '  Lollo   Rossa  Loka ', art: 'Salat' })).toEqual(lollo);
    expect(sorteErkennen(SORTEN, ARTEN, { name: '"Roxette"', art: 'Salat' })).toEqual(roxette);
    expect(sorteErkennen(SORTEN, ARTEN, { name: '« ROXETTE »', art: 'Salat' })).toEqual(roxette);
    expect(sorteErkennen(SORTEN, ARTEN, { name: "'roxette'", art: 'salat' })).toEqual(roxette);
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Babyleaf Mischung', art: 'Salat' })).toEqual({
      sorteId: id(403),
      artId: 'lactuca_sativa',
    });
  });

  it('SG1-AK3 sortennameNormalisieren und vorhandeneSorte vergleichen gleich (auch in «Von Hand erfassen»)', () => {
    expect(sortennameNormalisieren('‹BULL’S  BLOOD›')).toBe('bulls blood');
    expect(sortennameNormalisieren("Bull's Blood")).toBe('bulls blood');
    expect(sortennameNormalisieren('Babyleaf-Mischung')).toBe('babyleaf mischung');
    expect(sortennameNormalisieren('Babyleaf Mischung')).toBe('babyleaf mischung');
    expect(sortennameNormalisieren('  „Dunkelgrüner“  ')).toBe('dunkelgrüner');
    expect(vorhandeneSorte(SORTEN, '«BULL’S BLOOD»', 'beta_vulgaris_conditiva')).toBe(id(401));
  });

  it('SG1-AK3 nur gültige Sorte derselben Art: gleicher Name bei anderer Art oder geschlossene Sorte keine Erkennung', () => {
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette', art: 'Randen' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Genoveser', art: 'Salat' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Alte Testsorte', art: 'Salat' })).toBeUndefined();
  });

  it('SG1-AK3 ohne passende Art (KI-Art leer oder unbekannt) keine Erkennung', () => {
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette', art: '' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette', art: null })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette', art: 'Mondkraut' })).toBeUndefined();
    // geschlossene Art zählt nicht
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Roxette', art: 'Alte Art' })).toBeUndefined();
    // ohne Name keine Erkennung, auch mit Art
    expect(sorteErkennen(SORTEN, ARTEN, { name: '', art: 'Salat' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: null, art: 'Salat' })).toBeUndefined();
  });

  it('SG1-AK3 anderer Name keine Erkennung (Lollo Rossa gegen Lollo Rossa Loka)', () => {
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Lollo Rossa', art: 'Salat' })).toBeUndefined();
    expect(sorteErkennen(SORTEN, ARTEN, { name: 'Lollo Rossa Loka Rot', art: 'Salat' })).toBeUndefined();
  });

  it('SG1-AK3 kulturtypVorschlagen: häufigster Kulturtyp gültiger Sorten derselben Art; Gleichstand Blatt vor Knolle vor Frucht; ohne Sorte der Art undefined', () => {
    // Salat: blatt 2, knolle 1; die drei geschlossenen frucht zählen nicht
    expect(kulturtypVorschlagen(SORTEN, 'lactuca_sativa')).toBe('blatt');
    // Tomate: frucht 1, knolle 1 → Knolle vor Frucht
    expect(kulturtypVorschlagen(SORTEN, 'solanum_lycopersicum')).toBe('knolle');
    // Chili: frucht 1, blatt 1, zwei ohne Kulturtyp → Blatt vor Frucht
    expect(kulturtypVorschlagen(SORTEN, 'capsicum_annuum')).toBe('blatt');
    expect(kulturtypVorschlagen(SORTEN, 'ocimum_basilicum')).toBe('blatt');
    // ohne Sorte der Art, ohne Art
    expect(kulturtypVorschlagen(SORTEN, 'allium_schoenoprasum')).toBeUndefined();
    expect(kulturtypVorschlagen(SORTEN, undefined)).toBeUndefined();
    expect(kulturtypVorschlagen([], 'lactuca_sativa')).toBeUndefined();
    // nur geschlossene Sorten der Art
    expect(
      kulturtypVorschlagen(
        [sorte(20, 'Zu', 'testus_vetus', 'frucht', '2027-01-02T00:00:00Z')],
        'testus_vetus',
      ),
    ).toBeUndefined();
  });
});
