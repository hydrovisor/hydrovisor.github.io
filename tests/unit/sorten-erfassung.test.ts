// Sortenformular der Maske «Neue Sorte» (Issue #37, Plan 37 Testliste; UC4-AK2, UC4 Ablauf und Varianten, R1.2,
// TO2; Konzept 8.2, 11.3, 11.4). Rein; feste Uhr in Zürich; keine Personendaten.
//
// Vorausgesetzt (Plan 37, Domänenfunktionen; Feldnamen des Formulars A):
//   src/domain/sorten/erfassung.ts
//     interface SortenFormular {
//       tuete: Partial<Record<KiFeld, string>>;           // Eingaben der acht KI-Felder (name, art, keimart, …)
//       artId?: string; neueArt?: { nameDe: string; nameWiss: string; kulturgruppeId: string };
//       kulturtyp?: Kulturtyp;
//       wuchshoeheCm: string; wuchsform: string; fruehzeitigkeitD: string; katalogLink: string; shopLink: string;
//       kaufdatum: string; keimfaehigkeitProzent: string; bestandKorn: string;
//       saatVonHand?: { quelle: 'tuete' | 'standard'; kulturform: Kulturform; samenJeSchwamm: string; bestaetigen: boolean };
//     }
//     leeresFormular(): SortenFormular
//     formularNachKi(f, ergebnis: KiErgebnis) → { formular; vorschlag; hinweis? }   (über kiUebernehmen())
//     artVorschlagen(arten, kiArt) → art_id | undefined
//     vorhandeneSorte(sorten, name, artId) → sorte_id | undefined
//     formularPruefen(f, arten) → { feld; text }[]
//     erfassungBauen(f, ids: { sorteId; saatgutId; clientIds }, ki: KiLauf | undefined, kontext: { jetzt; zeitzone; appVersion })
//       → { wissen: { aktion; daten }[]; vorgang: Vorgang }
//     type KiLauf = KiErgebnis 'ok' plus fotopfade: readonly string[]
//   ArtZeile und SorteZeile sind Zeilen aus dem Bündel (art, sorte) mit den Spalten der Datenbank.
import { describe, expect, it } from 'vitest';
import {
  artVorschlagen,
  erfassungBauen,
  formularNachKi,
  formularPruefen,
  keimartDerArt,
  keimartHinweis,
  leeresFormular,
  vorhandeneSorte,
  type KiLauf,
  type SortenFormular,
} from '../../src/domain/sorten/erfassung.ts';
import { hinweisVonHand, type KiErgebnis, type VonHandGrund } from '../../src/domain/ki/uebernahme.ts';
import type { TuetenFelder } from '../../src/domain/ki/schema.ts';

const ZUERICH = 'Europe/Zurich';
// 15.1.2027 10:30 Zürich
const JETZT = new Date('2027-01-15T09:30:00.000Z');
const KONTEXT = { jetzt: JETZT, zeitzone: ZUERICH, appVersion: '0.1.0+test' };
const SORTE = '37000000-0000-4000-8000-000000000010';
const SAATGUT = '37000000-0000-4000-8000-000000000020';

type Arten = Parameters<typeof artVorschlagen>[0];
type Sorten = Parameters<typeof vorhandeneSorte>[0];

const ARTEN = [
  {
    art_id: 'lactuca_sativa',
    name_de: 'Salat',
    name_wiss: 'Lactuca sativa',
    kulturgruppe_id: 'blatt',
    kulturformen_erlaubt: ['babyleaf', 'schnitt', 'kopf'],
    gueltig_bis: null,
  },
  {
    art_id: 'solanum_lycopersicum',
    name_de: 'Tomate',
    name_wiss: 'Solanum lycopersicum',
    kulturgruppe_id: 'frucht',
    kulturformen_erlaubt: ['dauerkultur_frucht'],
    gueltig_bis: null,
  },
  {
    art_id: 'testus_radix',
    name_de: 'Testknolle',
    name_wiss: 'Testus radix',
    kulturgruppe_id: 'blatt',
    kulturformen_erlaubt: ['schnitt'],
    gueltig_bis: null,
  },
] as unknown as Arten;

const FELDER: TuetenFelder = {
  name: 'Testsorte Rot',
  art: 'Lactuca sativa L.',
  keimart: 'licht',
  keimtemperatur_min_c: 15,
  keimtemperatur_max_c: 20,
  keimdauer_min_d: 7,
  keimdauer_max_d: 14,
  kulturdauer_min_d: 50,
  kulturdauer_max_d: 70,
  aussaat_von_monat: null,
  aussaat_bis_monat: null,
  hersteller: 'Beispiel Saaten',
};

const OK: KiErgebnis = {
  ergebnis: 'ok',
  modell: 'claude-haiku-5-5',
  felder: FELDER,
  verworfen: [],
  dauerMs: 4200,
  ausweichmodell: false,
};

const vonHand = (grund: VonHandGrund): KiErgebnis => ({
  ergebnis: 'von_hand',
  grund,
  hinweis: hinweisVonHand(grund),
  dauerMs: 30_000,
});

function formular(aenderung: Partial<SortenFormular> = {}): SortenFormular {
  return { ...leeresFormular(), ...aenderung };
}

const VOLL = (): SortenFormular =>
  formular({
    tuete: {
      name: 'Testsorte Rot',
      art: 'Lactuca sativa L.',
      keimart: 'licht',
      keimtemperatur: '15-20',
      keimdauer: '7-14',
      kulturdauer: '50-70',
      hersteller: 'Beispiel Saaten Schweiz',
    },
    artId: 'lactuca_sativa',
    kulturtyp: 'blatt',
    wuchshoeheCm: '45',
    wuchsform: 'rosette',
    fruehzeitigkeitD: '-3',
    katalogLink: 'https://katalog.example.invalid/testsorte-rot',
    shopLink: 'https://shop.example.invalid/testsorte-rot',
    kaufdatum: '2027-01-10',
    keimfaehigkeitProzent: '85',
    bestandKorn: '180',
    saatVonHand: { quelle: 'tuete', kulturform: 'schnitt', samenJeSchwamm: '3', bestaetigen: true },
  });

const LAUF = { ...OK, fotopfade: [`${SORTE}/37000000-0000-4000-8000-000000000031.jpg`] } as KiLauf;

function zaehler() {
  let n = 0;
  return () => `37000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
}

describe('UC4 Sortenformular', () => {
  it('UC4-AK2 Sortenformular: KI-Fehler, Zeitüberschreitung und «noch nicht eingerichtet» lassen alle Eingaben stehen, KI füllt nur leere Felder', () => {
    const getippt = formular({
      tuete: { name: 'Meine Eingabe', keimart: 'dunkel' },
      kulturtyp: 'blatt',
      bestandKorn: '120',
      kaufdatum: '2027-01-10',
    });
    const kopie = structuredClone(getippt);

    for (const grund of ['fehler', 'zeit', 'nicht_eingerichtet', 'ungueltig', 'grenze'] as const) {
      const r = formularNachKi(getippt, vonHand(grund));
      expect(r.formular, grund).toEqual(kopie);
      expect(r.vorschlag, grund).toEqual({});
      expect(r.hinweis, grund).toBe(hinweisVonHand(grund));
    }
    expect(getippt).toEqual(kopie);

    const ok = formularNachKi(getippt, OK);
    expect(ok.hinweis).toBeUndefined();
    expect(ok.formular.tuete.name).toBe('Meine Eingabe');
    expect(ok.formular.tuete.keimart).toBe('dunkel');
    expect(ok.formular.tuete.art).toBe('Lactuca sativa L.');
    expect(ok.formular.tuete.keimtemperatur).toBe('15-20');
    expect(ok.formular.tuete.hersteller).toBe('Beispiel Saaten');
    expect(ok.formular.tuete.aussaatfenster ?? '').toBe('');
    expect(ok.vorschlag).not.toHaveProperty('name');
    expect(ok.vorschlag).not.toHaveProperty('keimart');
    expect(ok.vorschlag).toMatchObject({ art: 'Lactuca sativa L.', keimdauer: '7-14' });
    expect(ok.formular.kulturtyp).toBe('blatt');
    expect(ok.formular.bestandKorn).toBe('120');
    expect(ok.formular.kaufdatum).toBe('2027-01-10');
    expect(getippt).toEqual(kopie);
  });

  it('UC4 Art vorschlagen: «Lactuca sativa L.» trifft lactuca_sativa, «Salat» trifft name_de, ohne Treffer nichts', () => {
    expect(artVorschlagen(ARTEN, 'Lactuca sativa L.')).toBe('lactuca_sativa');
    expect(artVorschlagen(ARTEN, '  lactuca  SATIVA ')).toBe('lactuca_sativa');
    expect(artVorschlagen(ARTEN, 'Salat')).toBe('lactuca_sativa');
    expect(artVorschlagen(ARTEN, 'Gurke')).toBeUndefined();
    expect(artVorschlagen(ARTEN, null)).toBeUndefined();
  });

  it('UC4 Sorte vorhanden: gleicher Name ohne Gross- und Kleinschreibung und gleiche Art → nur Packung', () => {
    const sorten = [
      {
        sorte_id: '37000000-0000-4000-8000-000000000101',
        name: 'Lollo Rossa',
        art_id: 'lactuca_sativa',
        gueltig_bis: null,
      },
      {
        sorte_id: '37000000-0000-4000-8000-000000000102',
        name: 'Rote Probe',
        art_id: 'solanum_lycopersicum',
        gueltig_bis: null,
      },
    ] as unknown as Sorten;
    expect(vorhandeneSorte(sorten, 'lollo  rossa ', 'lactuca_sativa')).toBe(
      '37000000-0000-4000-8000-000000000101',
    );
    expect(vorhandeneSorte(sorten, 'Lollo Rossa', 'solanum_lycopersicum')).toBeUndefined();
    expect(vorhandeneSorte(sorten, 'Lollo Bionda', 'lactuca_sativa')).toBeUndefined();
  });

  it('R1.2 Kulturtyp Frucht ohne dauerkultur_frucht abgelehnt, Knolle nur mit babyleaf oder kopf', () => {
    const fehler = (f: SortenFormular) => formularPruefen(f, ARTEN);
    expect(fehler(VOLL())).toEqual([]);
    expect(fehler({ ...VOLL(), kulturtyp: 'frucht' }).map((x) => x.text)).toContain(
      'Kulturtyp passt nicht zur Art',
    );
    expect(fehler({ ...VOLL(), artId: 'solanum_lycopersicum', kulturtyp: 'frucht' })).toEqual([]);
    expect(fehler({ ...VOLL(), kulturtyp: 'knolle' })).toEqual([]);
    expect(fehler({ ...VOLL(), artId: 'testus_radix', kulturtyp: 'knolle' }).map((x) => x.text)).toContain(
      'Kulturtyp passt nicht zur Art',
    );
    expect(fehler({ ...VOLL(), kulturtyp: undefined } as unknown as SortenFormular).length).toBeGreaterThan(
      0,
    );
  });

  it('UC4 erfassungBauen: Reihenfolge art_neu, sorte_neu, tuetenwert, saatempfehlung; Vorgang saatgut und acht ki_feldprotokoll mit Status uebernommen, geaendert, leer', () => {
    const f: SortenFormular = {
      ...VOLL(),
      artId: undefined,
      neueArt: { nameDe: 'Testsalat', nameWiss: 'Testus lactucoides', kulturgruppeId: 'blatt' },
    } as SortenFormular;
    const r = erfassungBauen(f, { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() }, LAUF, KONTEXT);
    const aktionen = r.wissen.map((a) => a.aktion);
    expect(aktionen.slice(0, 2)).toEqual(['art_neu', 'sorte_neu']);
    expect(aktionen.filter((a) => a === 'tuetenwert')).toHaveLength(2);
    expect(aktionen.indexOf('tuetenwert')).toBeGreaterThan(aktionen.indexOf('sorte_neu'));
    expect(aktionen).toContain('saatempfehlung_neu');
    expect(aktionen.lastIndexOf('tuetenwert')).toBeLessThan(aktionen.indexOf('saatempfehlung_neu'));
    expect(r.wissen[0]?.daten).toMatchObject({
      art_id: 'testus_lactucoides',
      name_de: 'Testsalat',
      name_wiss: 'Testus lactucoides',
      kulturgruppe_id: 'blatt',
    });
    expect(r.wissen[1]?.daten).toMatchObject({
      sorte_id: SORTE,
      name: 'Testsorte Rot',
      art_id: 'testus_lactucoides',
      kulturtyp: 'blatt',
      katalog_link: 'https://katalog.example.invalid/testsorte-rot',
      shop_link: 'https://shop.example.invalid/testsorte-rot',
    });

    const neu = r.vorgang.filter((s) => s.art === 'neu');
    const saatgut = neu.filter((s) => s.tabelle === 'saatgut');
    expect(saatgut).toHaveLength(1);
    expect(saatgut[0]?.felder).toMatchObject({ id: SAATGUT, sorte_id: SORTE, kaufdatum: '2027-01-10' });
    const protokoll = neu.filter((s) => s.tabelle === 'ki_feldprotokoll');
    expect(protokoll).toHaveLength(8);
    const status = Object.fromEntries(protokoll.map((s) => [s.felder['feld'], s.felder['status']]));
    expect(status).toEqual({
      name: 'uebernommen',
      art: 'uebernommen',
      keimart: 'uebernommen',
      keimtemperatur: 'uebernommen',
      keimdauer: 'uebernommen',
      kulturdauer: 'uebernommen',
      aussaatfenster: 'leer',
      hersteller: 'geaendert',
    });
    for (const s of protokoll) {
      expect(s.felder).toMatchObject({
        sorte_id: SORTE,
        saatgut_id: SAATGUT,
        modell: 'claude-haiku-5-5',
        dauer_ms: 4200,
        fotopfad: LAUF.fotopfade[0],
      });
      expect(s.felder['bewertung_eval'] ?? null).toBeNull();
    }
    expect(protokoll.find((s) => s.felder['feld'] === 'hersteller')?.felder).toMatchObject({
      wert_ki: 'Beispiel Saaten',
      wert_final: 'Beispiel Saaten Schweiz',
    });
  });

  it('UC4 Wuchshöhe 45 cm → 450 mm, Keimfähigkeit 85 % → 0.85, Bestand negativ abgelehnt', () => {
    const r = erfassungBauen(
      VOLL(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      LAUF,
      KONTEXT,
    );
    const sorte = r.wissen.find((a) => a.aktion === 'sorte_neu');
    expect(sorte?.daten).toMatchObject({
      wuchshoehe_max_mm: 450,
      wuchsform: 'rosette',
      fruehzeitigkeit_relativ_d: -3,
    });
    const saatgut = r.vorgang.find((s) => s.art === 'neu' && s.tabelle === 'saatgut');
    expect(saatgut?.art === 'neu' && saatgut.felder).toMatchObject({
      keimfaehigkeit_packung: 0.85,
      bestand_korn: 180,
    });

    expect(formularPruefen({ ...VOLL(), bestandKorn: '-1' }, ARTEN).map((x) => x.feld)).toContain(
      'bestandKorn',
    );
    expect(formularPruefen({ ...VOLL(), bestandKorn: '2.5' }, ARTEN).map((x) => x.feld)).toContain(
      'bestandKorn',
    );
    expect(formularPruefen({ ...VOLL(), keimfaehigkeitProzent: '101' }, ARTEN).map((x) => x.feld)).toContain(
      'keimfaehigkeitProzent',
    );
  });

  it('UC4 ohne KI-Lauf kein Feldprotokoll', () => {
    const r = erfassungBauen(
      VOLL(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      undefined,
      KONTEXT,
    );
    expect(r.vorgang.some((s) => s.art === 'neu' && s.tabelle === 'ki_feldprotokoll')).toBe(false);
    expect(r.vorgang.filter((s) => s.art === 'neu' && s.tabelle === 'saatgut')).toHaveLength(1);
    expect(r.wissen.map((a) => a.aktion)).not.toContain('art_neu');
  });

  it('TO2 gleicher Vorgang bei Wiederholung (gleiche client_id)', () => {
    const a = erfassungBauen(
      VOLL(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      LAUF,
      KONTEXT,
    );
    const b = erfassungBauen(
      VOLL(),
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      LAUF,
      KONTEXT,
    );
    expect(b).toEqual(a);
    const ids = a.vorgang.flatMap((s) => (s.art === 'neu' ? [s.felder.client_id] : []));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('UC4 B3 neue Art in einer Gruppe mit Blatt-Leitkultur: Kulturtyp Frucht passt nicht zur Art', () => {
    const gruppen = [{ kulturgruppe_id: 'blatt', leitkultur_art_id: 'lactuca_sativa' }];
    const f = {
      ...VOLL(),
      artId: undefined,
      neueArt: { nameDe: 'Testsalat', nameWiss: 'Testus lactucoides', kulturgruppeId: 'blatt' },
    } as SortenFormular;
    expect(formularPruefen({ ...f, kulturtyp: 'frucht' }, ARTEN, gruppen)).toContainEqual({
      feld: 'kulturtyp',
      text: 'Kulturtyp passt nicht zur Art',
    });
    expect(formularPruefen({ ...f, kulturtyp: 'blatt' }, ARTEN, gruppen)).toEqual([]);
  });

  it('UC4 B4 neue Art mit dem wissenschaftlichen Namen einer bestehenden Art abgelehnt', () => {
    const f = {
      ...VOLL(),
      artId: undefined,
      neueArt: { nameDe: 'Kopfsalat', nameWiss: 'Lactuca sativa', kulturgruppeId: 'blatt' },
    } as SortenFormular;
    expect(formularPruefen(f, ARTEN)).toContainEqual({
      feld: 'neueArt.nameWiss',
      text: 'Diese Art gibt es schon: Salat. Wähle sie in der Liste.',
    });
  });

  it('UC4 B2 Keimart der Tüte weicht vom Profil der Art ab: Hinweis, die Tüte gilt', () => {
    expect(keimartHinweis('licht', 'dunkel')).toBe('Tüte: Lichtkeimer, Art: Dunkelkeimer. Die Tüte gilt.');
    expect(keimartHinweis('licht', 'licht')).toBeUndefined();
    expect(keimartHinweis(undefined, 'dunkel')).toBeUndefined();
    expect(keimartHinweis('licht', undefined)).toBeUndefined();

    const andere = '37000000-0000-4000-8000-000000000101';
    const eigene = '37000000-0000-4000-8000-000000000102';
    const sorten = [
      { sorte_id: andere, name: 'Lollo Rossa', art_id: 'lactuca_sativa', gueltig_bis: null },
      { sorte_id: eigene, name: 'Testsorte Rot', art_id: 'lactuca_sativa', gueltig_bis: null },
    ] as unknown as Sorten;
    const keim = (sorte_id: string, text_wert: string, herkunft_ebene: string) => ({
      sorte_id,
      phase: 'keimung',
      groesse: 'keimart',
      text_wert,
      herkunft_ebene,
    });
    expect(
      keimartDerArt(
        [keim(eigene, 'licht', 'sorte'), keim(andere, 'dunkel', 'art')],
        sorten,
        'lactuca_sativa',
      ),
    ).toBe('dunkel');
    expect(keimartDerArt([keim(andere, 'licht', 'sorte')], sorten, 'lactuca_sativa')).toBeUndefined();
    expect(keimartDerArt([keim(andere, 'dunkel', 'art')], sorten, 'solanum_lycopersicum')).toBeUndefined();
    expect(keimartDerArt([keim(andere, 'dunkel', 'art')], sorten, undefined)).toBeUndefined();
  });

  it('UC4 B9 Keimfähigkeit 85.5 % → 0.855', () => {
    const r = erfassungBauen(
      { ...VOLL(), keimfaehigkeitProzent: '85.5' },
      { sorteId: SORTE, saatgutId: SAATGUT, clientIds: zaehler() },
      LAUF,
      KONTEXT,
    );
    const saatgut = r.vorgang.find((s) => s.art === 'neu' && s.tabelle === 'saatgut');
    expect(saatgut?.art === 'neu' && saatgut.felder['keimfaehigkeit_packung']).toBeCloseTo(0.855, 10);
    expect(formularPruefen({ ...VOLL(), keimfaehigkeitProzent: '85.5' }, ARTEN)).toEqual([]);
  });
});
