// W0-Abbildung, Artauswahl, Konstanten, Daten, Ladeskript ohne eigenes AK (Plan 10 Testliste;
// 03_import_w0.md Abschnitte 4.3, 4.6, 4.7, 8.4, 9; R1.2, R1.4, G6). Namen ohne die Wörter der [SQL]-AK.
//
// Vorausgesetzt:
//   src/domain/w0/auswahl.ts
//     artAuswahl(dateien: W0Dateien, pflichtgroessen: Pflichtgroesse[]):
//       { voll: Set<ArtId>; nurMerkmale: Map<ArtId, string /* Grund */>; keimungVorab: Set<ArtId> }
//     Grund bei fehlender Phase: «Phase <phase> ohne anwendbar» (A3).
//   src/domain/w0/konstanten.ts
//     seedKonstanten: {
//       pflichtgroessen: { phase: string; groesse: string; mindestensArt: boolean }[]   // 30 Zeilen, Abschnitt 9
//       profilenden: { kulturform: string; profilEnde: string }[]                      // 6 Zeilen, R1.2
//       produkte: { produktId: string; name: string; gehalt: string | null; konzentration: string | null }[]
//       kStartwerte: { produktId: string; wert: number }[]                             // grow, micro_hard_water, bloom
//       messgeraet: { modell: string; … }
//       auswertungFenster: { name: string; von: Date; bis: Date }                     // halboffen, Europe/Zurich
//     }
//   src/domain/w0/abbildung.ts
//     ladeplan(dateien, auswahl, konstanten): Ladeplan
//     Ladeplan.tabellen: Record<Zieltabelle, Record<string, unknown>[]> mit Spaltennamen der Datenbank; Zieltabellen
//       mindestens quelle, kulturgruppe, art, art_kulturform, herkunft, sorte, saatgut, profilwert, saatempfehlung,
//       duengerschema, wissenseintrag. Verweise auf Sorten über sorte_key (= zeile_id der Sorte); Wahrheitswerte
//       als boolean, kulturformen_erlaubt als string[].
//     Ladeplan.erwartet: { datei: string; tabelle: string; anzahl: number }[]   (Zähltest, 8.6)
//   scripts/seed/ladeskript.ts
//     DOLLAR_TAG: string
//     ladeskript(plan, lauf: { jetzt: Date; commit: string; gesamtfreigabe: boolean; trocken: boolean }):
//       { vorbereitung: string; kern: string; berichtAbfrage: string; vollstaendig: string }
//     wirft, wenn ein Datenwert DOLLAR_TAG enthält.
import { describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { DOLLAR_TAG, ladeskript } from '../../scripts/seed/ladeskript.ts';
import { repository, wissen } from './w0-fixture.ts';
import { PFAD, entfernen, muss, tabelle, zeile, type Dateien } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof artAuswahl>[0];
type Zielzeile = Record<string, unknown>;

function auswahl(d: Dateien) {
  return artAuswahl(d as unknown as W0Dateien, seedKonstanten.pflichtgroessen);
}
function plan(d: Dateien) {
  const dateien = d as unknown as W0Dateien;
  return ladeplan(dateien, auswahl(d), seedKonstanten);
}
function zeilen(d: Dateien, tabelleName: string): Zielzeile[] {
  const tabellen = plan(d).tabellen as unknown as Record<string, Zielzeile[] | undefined>;
  return muss(tabellen[tabelleName], tabelleName);
}

describe('W0-Abbildung auf Zielzeilen', () => {
  it('W0-Abbildung ordnet sorten.csv über name_de zu', () => {
    const sorten = zeilen(wissen(), 'sorte');
    const zuordnung = Object.fromEntries(sorten.map((s) => [s['zeile_id'], s['art_id']]));
    expect(zuordnung).toEqual({
      'sorte-test-a-eins': 'test_art_a',
      'sorte-test-b-zwei': 'test_art_b',
      'sorte-test-c-drei': 'test_art_c',
      'sorte-test-d-vier': 'test_art_d',
    });
    const eins = muss(
      sorten.find((s) => s['zeile_id'] === 'sorte-test-a-eins'),
      'sorte-test-a-eins',
    );
    expect(eins).toMatchObject({ name: 'Eins', kulturtyp: 'frucht', wuchsform: 'buschig' });
    expect(Number(eins['wuchshoehe_max_mm'])).toBe(600);
  });

  it('W0-Abbildung keimtemperatur_tuete 18-24 ergibt wert_min 18 und wert_max 24 mit Quelle tuete-<zeile_id>', () => {
    const d = wissen();
    const sorteZeilen = zeilen(d, 'profilwert').filter(
      (z) => z['ebene'] === 'sorte' && JSON.stringify(z).includes('sorte-test-a-eins'),
    );
    const keimtemp = muss(
      sorteZeilen.find((z) => z['groesse'] === 'keimtemp'),
      'Tütenwert keimtemp',
    );
    expect(keimtemp).toMatchObject({
      phase: 'keimung',
      quelle_id: 'tuete-sorte-test-a-eins',
      evidenzklasse: 'C',
      vermerk: 'tuete',
    });
    expect(Number(keimtemp['wert_min'])).toBe(18);
    expect(Number(keimtemp['wert_max'])).toBe(24);
    expect(sorteZeilen.find((z) => z['groesse'] === 'keimart')).toMatchObject({ text_wert: 'dunkel' });
    // Sorten ohne Tütenwert erhalten keine Zeile der Ebene sorte und keine Tüten-Quelle
    expect(sorteZeilen).toHaveLength(2);
    const quellen = zeilen(d, 'quelle').map((q) => q['quelle_id']);
    expect(quellen).toContain('tuete-sorte-test-a-eins');
    expect(quellen.filter((q) => String(q).startsWith('tuete-'))).toEqual(['tuete-sorte-test-a-eins']);
  });

  it('W0-Abbildung Langform art.csv ergibt eine Zeile art, je Kulturform eine Zeile art_kulturform und je Feld eine Herkunft', () => {
    const d = wissen();
    const art = zeilen(d, 'art').filter((z) => z['art_id'] === 'test_art_b');
    expect(art).toHaveLength(1);
    expect(art[0]).toMatchObject({
      zeile_id: 'art.test_art_b',
      name_de: 'Testart B',
      name_wiss: 'Testus beta',
      kulturgruppe_id: 'test_frucht',
      kulturformen_erlaubt: ['kopf', 'schnitt'],
      kulturform_vorgabe: 'kopf',
      systemeignung: 'beide',
    });
    expect(Number(art[0]?.['gbif_key'])).toBe(9000002);
    expect(Number(art[0]?.['standard_keimfaehigkeit'])).toBe(0.75);
    expect(Number(art[0]?.['umsetzen_ab_d'])).toBe(10);
    expect(Number(art[0]?.['umsetzen_bis_d'])).toBe(18);

    const ak = zeilen(d, 'art_kulturform').filter((z) => z['art_id'] === 'test_art_b');
    expect(ak.map((z) => z['zeile_id']).sort()).toEqual(['ak.test_art_b.kopf', 'ak.test_art_b.schnitt']);
    const kopf = muss(
      ak.find((z) => z['kulturform'] === 'kopf'),
      'kopf',
    );
    expect(kopf).toMatchObject({ ernteart: 'einmalig', entspitzen: false });
    expect(kopf['ernteintervall_d'] ?? null).toBeNull();
    const schnitt = muss(
      ak.find((z) => z['kulturform'] === 'schnitt'),
      'schnitt',
    );
    expect(Number(schnitt['ernteintervall_d'])).toBe(10);
    expect(Number(schnitt['schnitte_max'])).toBe(3);

    const herkunft = zeilen(d, 'herkunft').filter((z) => String(z['zeile_id']).includes('test_art_b'));
    const dateiZeilen = tabelle(d, PFAD.art).zeilen.filter((z) => z['art_id'] === 'test_art_b');
    expect(herkunft).toHaveLength(dateiZeilen.length);
    expect(
      herkunft
        .filter((h) => h['tabelle'] === 'art')
        .map((h) => h['feld'])
        .sort(),
    ).toEqual(
      dateiZeilen
        .filter((z) => z['kulturform'] === null)
        .map((z) => z['feld'])
        .sort(),
    );
    expect(
      herkunft
        .filter((h) => h['zeile_id'] === 'ak.test_art_b.kopf')
        .map((h) => h['feld'])
        .sort(),
    ).toEqual(['entspitzen', 'ernte_ab_d', 'ernteart', 'kulturdauer_max_d', 'kulturdauer_typisch_d']);
    for (const h of herkunft) {
      expect(h).toMatchObject({
        quelle_id: 'test-fixture',
        fundstelle: 'Tabelle 1',
        kurzzitat: 'Erfundener Testwert',
        evidenzklasse: 'B2',
        vermerk: 'keine',
      });
      expect(['art', 'art_kulturform']).toContain(h['tabelle']);
    }
  });

  it('W0-Abbildung aussaatfenster 3-6 ergibt Monat 3 bis 6', () => {
    const a = muss(
      zeilen(wissen(), 'art').find((z) => z['art_id'] === 'test_art_a'),
      'test_art_a',
    );
    expect(Number(a['aussaatfenster_von_monat'])).toBe(3);
    expect(Number(a['aussaatfenster_bis_monat'])).toBe(6);
    const b = muss(
      zeilen(wissen(), 'art').find((z) => z['art_id'] === 'test_art_b'),
      'test_art_b',
    );
    expect(b['aussaatfenster_von_monat'] ?? null).toBeNull();
  });

  it('W0-Abbildung Stadium «1. echte Blätter» ergibt echte_blaetter, anderer Wert bricht ab', () => {
    const d = wissen();
    const stadien = Object.fromEntries(zeilen(d, 'duengerschema').map((z) => [z['zeile_id'], z['stadium']]));
    expect(stadien).toEqual({
      'test-ds-1': 'wurzeln_keimung',
      'test-ds-2': 'echte_blaetter',
      'test-ds-3': 'wachstum',
      'test-ds-4': 'vorbluete',
      'test-ds-5': 'bluete_frucht',
      'test-ds-6': 'reife',
    });

    const falsch = wissen();
    zeile(falsch, PFAD.duengerschema, 'test-ds-2')['stadium'] = '1. Echte Blätter';
    const v = pruefen(falsch as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse;
    expect(v.some((x) => x.datei === PFAD.duengerschema && x.zeileId === 'test-ds-2')).toBe(true);
  });
});

describe('W0-Artauswahl (8.4, A3)', () => {
  it('W0-Artauswahl Art ohne Phase bluete liefert nur Merkmale und Keimungswerte', () => {
    const a = auswahl(wissen());
    expect([...a.voll].sort()).toEqual(['test_art_a', 'test_art_b', 'test_art_c']);
    expect([...a.nurMerkmale.keys()]).toEqual(['test_art_d']);
    expect(a.nurMerkmale.get('test_art_d')).toMatch(/Phase bluete ohne anwendbar/);
    expect(a.keimungVorab.has('test_art_d')).toBe(true);

    // Im Ladeplan: Artmerkmale ja, Kulturformen und Saatempfehlung nein, profilwert nur keimart, keimtemp, dauer
    const d = wissen();
    expect(zeilen(d, 'art').some((z) => z['art_id'] === 'test_art_d')).toBe(true);
    expect(zeilen(d, 'art_kulturform').some((z) => z['art_id'] === 'test_art_d')).toBe(false);
    expect(zeilen(d, 'saatempfehlung').some((z) => z['art_id'] === 'test_art_d')).toBe(false);
    const pw = zeilen(d, 'profilwert').filter((z) => z['ebene'] === 'art' && z['art_id'] === 'test_art_d');
    expect(pw.map((z) => `${z['phase']}.${z['groesse']}`).sort()).toEqual([
      'keimung.dauer',
      'keimung.keimart',
      'keimung.keimtemp',
    ]);
  });

  it('W0-Artauswahl Pflichtgrössen mindestens auf Ebene Art nach Abschnitt 9', () => {
    // bbch und wechselmerkmal dürfen von der Kulturgruppe kommen: test_art_a hat sie nicht auf Ebene Art
    const d = wissen();
    const artA = tabelle(d, PFAD.profilwert).zeilen.filter((z) => z['bezug'] === 'test_art_a');
    expect(artA.some((z) => z['groesse'] === 'bbch' || z['groesse'] === 'wechselmerkmal')).toBe(false);
    expect(auswahl(d).voll.has('test_art_a')).toBe(true);

    for (const fehlt of [
      'pw.test_art_a.anzucht.ec',
      'pw.test_art_a.wachstum.ph',
      'pw.test_art_a.bluete.dauer',
    ]) {
      const ohne = wissen();
      entfernen(ohne, PFAD.profilwert, fehlt);
      const a = auswahl(ohne);
      expect(a.voll.has('test_art_a'), fehlt).toBe(false);
      expect(a.nurMerkmale.has('test_art_a'), fehlt).toBe(true);
    }
  });
});

describe('W0-Konstanten (Abschnitt 9, R1.2, 4.7, G6)', () => {
  it('W0-Konstanten 30 Pflichtgrössen, 6 Profilenden, 4 Produkte, 3 k-Startwerte 0.3', () => {
    const k = seedKonstanten;
    expect(k.pflichtgroessen).toHaveLength(30);
    const schluessel = k.pflichtgroessen.map((p) => `${p.phase}.${p.groesse}`);
    expect(new Set(schluessel).size).toBe(30);
    expect(schluessel.filter((s) => s.startsWith('keimung.')).sort()).toEqual(
      ['anwendbar', 'bbch', 'dauer', 'keimart', 'keimtemp', 'wechselmerkmal'].map((g) => `keimung.${g}`),
    );
    for (const phase of ['anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife']) {
      expect(schluessel.filter((s) => s.startsWith(`${phase}.`)).sort()).toEqual(
        ['anwendbar', 'bbch', 'dauer', 'ec', 'ph', 'wechselmerkmal'].map((g) => `${phase}.${g}`),
      );
    }
    expect(
      k.pflichtgroessen
        .filter((p) => p.mindestensArt)
        .map((p) => `${p.phase}.${p.groesse}`)
        .sort(),
    ).toEqual(
      [
        'keimung.dauer',
        ...['anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'].flatMap((p) => [
          `${p}.dauer`,
          `${p}.ec`,
          `${p}.ph`,
        ]),
      ].sort(),
    );

    expect(Object.fromEntries(k.profilenden.map((p) => [p.kulturform, p.profilEnde]))).toEqual({
      keimling: 'anzucht',
      babyleaf: 'wachstum',
      kopf: 'wachstum',
      schnitt: 'wachstum',
      dauerkultur_blatt: 'wachstum',
      dauerkultur_frucht: 'fruchtbildung_reife',
    });

    expect(Object.fromEntries(k.produkte.map((p) => [p.produktId, p.gehalt ?? null]))).toEqual({
      grow: '3-1-6',
      micro_hard_water: '5-0-1',
      bloom: '0-5-4',
      ph_minus: null,
    });
    expect(k.produkte.find((p) => p.produktId === 'ph_minus')?.konzentration ?? null).toBeNull();

    expect(k.kStartwerte.map((x) => [x.produktId, x.wert]).sort()).toEqual([
      ['bloom', 0.3],
      ['grow', 0.3],
      ['micro_hard_water', 0.3],
    ]);
    expect(k.messgeraet.modell).toBe('Aquamaster P160 Pro2');
  });

  it('W0-Konstanten Auswertungsfenster testbetrieb 7.1.2027 bis 1.4.2027 Europe/Zurich, halboffen', () => {
    const f = seedKonstanten.auswertungFenster;
    expect(f.name).toBe('testbetrieb');
    // 7.1.2027 00:00 MEZ = 06.01. 23:00 UTC; 1.4.2027 00:00 MESZ (Umstellung 28.3.2027) = 31.03. 22:00 UTC
    expect(new Date(f.von).toISOString()).toBe('2027-01-06T23:00:00.000Z');
    expect(new Date(f.bis).toISOString()).toBe('2027-03-31T22:00:00.000Z');
  });
});

describe('W0-Daten im Repository', () => {
  it('W0-Daten sorten.csv hat 22 Sorten mit kulturtyp, Mangold und Randen blatt (W6)', () => {
    const sorten = muss(repository()[PFAD.sorten], PFAD.sorten).zeilen;
    expect(sorten).toHaveLength(22);
    for (const s of sorten)
      expect(['blatt', 'knolle', 'frucht'], String(s['zeile_id'])).toContain(s['kulturtyp']);
    const kulturtyp = (art: string) => sorten.filter((s) => s['art'] === art).map((s) => s['kulturtyp']);
    expect(kulturtyp('Mangold')).toEqual(['blatt']);
    expect(kulturtyp('Randen')).toEqual(['blatt']);
  });

  it('W0-Daten w0:pruefen geht über den Stand im Repository durch', () => {
    const d = repository();
    expect(Object.keys(d)).toContain(PFAD.sorten);
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });
});

describe('W0-Ladeskript', () => {
  it('W0-Ladeskript lehnt Daten mit dem Dollar-Tag ab', () => {
    expect(DOLLAR_TAG).toMatch(/^\$[a-z_]+\$$/);
    const lauf = {
      jetzt: new Date('2026-11-24T08:00:00Z'),
      commit: 'test1',
      gesamtfreigabe: false,
      trocken: false,
    };
    expect(() => ladeskript(plan(wissen()), lauf)).not.toThrow();

    const d = wissen();
    zeile(d, PFAD.wissenseintrag, 'we.test_art_a.wachstum.1')['text'] = `Text mit ${DOLLAR_TAG} darin.`;
    expect(() => ladeskript(plan(d), lauf)).toThrow();
    const c = { ...lauf, commit: `x${DOLLAR_TAG}` };
    expect(() => ladeskript(plan(wissen()), c)).toThrow();
  });
});
