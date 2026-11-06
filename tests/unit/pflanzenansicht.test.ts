// Pflanzenansicht nach UC6: Sollbereich, Kopf, nächster Schritt, «Wie weiter?», auslösende Pflanze, Verlauf,
// Ereignisdaten (Plan 38 Testliste; R1.3, R1.5, R1.7, UC6, A13, A14). Injizierte Uhr ERNTE_JETZT
// 2027-03-18T08:00:00Z (Zürich 18.3. 09:00), Zeitzone Europe/Zurich; Teile aus tests/fixtures/ernte.ts.
//
// Vertrag (Plan 38 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/phasen/sollbereich.ts
//     sollbereich(teile, sorteId, phase, platzId?): { ph?: Band; ec?: Band; temp?: Band; herkunft: { ph; ec; temp };
//       verlaesslichkeit: 'belegt' | 'pruefauftrag'; ecBasisUnklar: boolean }. Band aus bewertung.ts in Hundertsteln
//       (pH 6.0 = 600, EC 1.2 = 120, 18 °C = 1800). EC mit ec_gesamt: Basis zuwachs + ECWasser der Anlage des Platzes
//       (v_ec_wasser, sonst 0.5), unbekannt rechnet wie gesamt und setzt ecBasisUnklar. Herkunft je Grösse
//       { ebene: 'sorte' | 'art' | 'kulturgruppe' | 'standard'; klasse: evidenzklasse; vermerk? } oder undefined.
//       verlaesslichkeit 'belegt', wenn jeder vorhandene Wert Klasse A bis C auf Ebene Sorte oder Art ohne Vermerk
//       leitkultur hat, sonst 'pruefauftrag'.
//   src/domain/phasen/ansicht.ts
//     pflanzenAnsicht(teile, pflanzungId, jetzt, zeitzone): PflanzenAnsicht | undefined mit mindestens
//       { pflanzungId; satzId; status; kopf: { titel; ort; tagSeitSaat }; phase?: PhasenStand;
//         soll: Sollbereich & { text }; ziel?: { platzId; text; pflanzen };
//         ernte?: ErnteStand; ende?: Endzustand; naechsterSchritt?: { art; am; text }; umfang: string[];
//         ausloeserFrage?: string; wissenSchossen?: string }
//       kopf.titel «<Sorte> · <Kulturform> · <Platz>» (wie Plan 35), kopf.ort «2.3.1» (Topf am Heimplatz),
//       «2.3.1, steht auf 2.3.5» (Topf ausser Heim), ohne Topf und Platz der Anzuchtort («A2»).
//       soll.text «pH 6.0–6.5 · EC 1.2–1.6 · 18–22 °C»; ein fehlender Wert steht als «… Sollwert nicht belegt»,
//       bei unbekannter Basis enthält er «EC-Basis unklar». ziel.text «Gefäss 2.3: pH 6.0–6.5 · EC 1.2–1.4 · 4 Pflanzen».
//       naechsterSchritt.art in der Reihenfolge bei Gleichstand: 'keimung', 'umsetzen', 'phase', 'kultur_entscheid',
//       'ernte_moeglich'; text «Nächster Schritt: <Name> ab <T.M.>» mit den Namen «Keimung prüfen», «Umsetzen»,
//       «Phase bestätigen», «Kultur beenden oder verlängern?», «Ernte möglich»; ohne Termin fehlt das Feld (A13).
//       umfang = aktive Pflanzungen desselben Satzes am selben Platz nach id (A2). ausloeserFrage = «Diese Pflanze
//       zeigt das Merkmal», nur wenn die nächste Phase bluete oder fruchtbildung_reife ist. wissenSchossen = Text der
//       Wissenskarte Typ schossen (zuerst Art, sonst Kulturgruppe), nur mit Schossen-Handlung.
//     wieWeiter(teile, vorgang, jetzt, zeitzone): { kennung; code; links: { text; href }[] } | undefined: wenn der
//       Vorgang die letzte aktive Pflanzung eines Platzes mit Rolle gefaess beendet; Links «Neu bepflanzen»
//       (#/saeen?ziel=<code>) und «Zum Gefäss» (#/gefaess/<code>).
//   src/domain/phasen/ende.ts
//     pflanzenVerlauf(teile, pflanzungId, jetzt, zeitzone): { tag; text; wiederherstellen?: true }[], neueste zuerst;
//       Texte «18.2. Teilernte», «20.3. Abgeerntet», «18.3. Kultur verlängert um 14 Tage», «18.3. Kultur beendet»,
//       «21.3. Wiederhergestellt», «… Ausfall: Mehltau», dazu die Phasenzeilen aus phasenVerlauf() («28.1. Wachstum:
//       Ja»); wiederherstellen: true an der Zeile des wiederherstellbaren Endzustands.
//   src/domain/datenpfad/ereignisdaten.ts: schossen_handlung { handlung: auskneifen | ernten_beenden | bluete_nutzen };
//     kultur_entscheid.tage nur Ganzzahl > 0.
import { describe, expect, it } from 'vitest';
import { ereignisDatenPruefen } from '../../src/domain/datenpfad/ereignisdaten.ts';
import { pflanzenAnsicht, wieWeiter } from '../../src/domain/phasen/ansicht.ts';
import { ausfallVorgang, ernteVorgang } from '../../src/domain/phasen/ernte.ts';
import { pflanzenVerlauf, teileNach } from '../../src/domain/phasen/ende.ts';
import { antwortVorgang, PHASENLOGIK_AB } from '../../src/domain/phasen/fragen.ts';
import { sollbereich } from '../../src/domain/phasen/sollbereich.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  BASILIKUM,
  EICHBLATT,
  EISSALAT,
  ereignisDazu,
  ernteDazu,
  ernteSichtenNachrechnen,
  ernteTeile,
  ERNTE_JETZT,
  kulturEntscheidDazu,
  kulturformSetzen,
  LOLLO,
  PAKCHOI,
  platzId,
  SATZ,
  SCHNITTLAUCH,
  sollwertSetzen,
  SORTE,
  SORTE_E,
  SORTE_W1,
  TOMATE,
  um,
  verschiebenDazu,
  WISSEN_SCHOSSEN_BASILIKUM,
} from '../fixtures/ernte.ts';
import { uid } from '../fixtures/regal.ts';

const J = ERNTE_JETZT;
const Z = ZEITZONE;
const L1 = LOLLO[1] as string;
const L2 = LOLLO[2] as string;

function neueIds(praefix = '5b'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

describe('R1.3 Sollbereich', () => {
  it('R1.3 Sollbereich: Herkunft Art Klasse B «belegt», Kulturgruppe «Prüfauftrag», Vermerk leitkultur «Prüfauftrag», EC-Basis unbekannt «EC-Basis unklar»', () => {
    const t = ernteTeile();
    // Lollo Rossa: alle Werte von der Art, Klasse B1; EC 0.8–1.2 Zuwachs + ECWasser 0.4
    const lollo = sollbereich(t, SORTE.lollo, 'wachstum', platzId('2.3'));
    expect(lollo).toMatchObject({
      ph: { min: 600, max: 650 },
      ec: { min: 120, max: 160 },
      temp: { min: 1800, max: 2200 },
      verlaesslichkeit: 'belegt',
      ecBasisUnklar: false,
    });
    expect(lollo.herkunft.ph).toMatchObject({ ebene: 'art', klasse: 'B1' });
    expect(lollo.herkunft.ec).toMatchObject({ ebene: 'art', klasse: 'B1' });
    const ansicht = pflanzenAnsicht(t, L1, J, Z);
    expect(ansicht?.soll.text).toBe('pH 6.0–6.5 · EC 1.2–1.6 · 18–22 °C');
    expect(ansicht?.soll.verlaesslichkeit).toBe('belegt');
    expect(ansicht?.ziel).toMatchObject({
      platzId: platzId('2.3'),
      text: 'Gefäss 2.3: pH 6.0–6.5 · EC 1.2–1.4 · 4 Pflanzen',
      pflanzen: 4,
    });

    // Kulturgruppe (Klasse D aus der Sicht): Prüfauftrag
    sollwertSetzen(t, SORTE_W1.eissalat, 'ph', { herkunft_ebene: 'kulturgruppe', evidenzklasse: 'D' });
    const eis = sollbereich(t, SORTE_W1.eissalat, 'wachstum', platzId('2.3'));
    expect(eis.herkunft.ph).toMatchObject({ ebene: 'kulturgruppe' });
    expect(eis.verlaesslichkeit).toBe('pruefauftrag');
    expect(pflanzenAnsicht(t, EISSALAT, J, Z)?.soll.verlaesslichkeit).toBe('pruefauftrag');

    // Art, Klasse B2, aber Vermerk leitkultur: Prüfauftrag
    sollwertSetzen(t, SORTE_E.basilikum, 'ec', { evidenzklasse: 'B2', vermerk: 'leitkultur' });
    expect(sollbereich(t, SORTE_E.basilikum, 'wachstum', platzId('2.3')).verlaesslichkeit).toBe(
      'pruefauftrag',
    );
    // Sorte, Klasse C: belegt
    sollwertSetzen(t, SORTE_W1.schnittlauch, 'ph', { herkunft_ebene: 'sorte', evidenzklasse: 'C' });
    const sl = sollbereich(t, SORTE_W1.schnittlauch, 'wachstum', platzId('2.1'));
    expect(sl.herkunft.ph).toMatchObject({ ebene: 'sorte', klasse: 'C' });
    expect(sl.verlaesslichkeit).toBe('belegt');

    // EC-Basis unbekannt: rechnet wie gesamt, Hinweis
    sollwertSetzen(t, SORTE_E.pakchoi, 'ec', { ec_basis_quelle: 'unbekannt' });
    const pak = sollbereich(t, SORTE_E.pakchoi, 'wachstum', platzId('2.1'));
    expect(pak.ec).toEqual({ min: 120, max: 180 });
    expect(pak.ecBasisUnklar).toBe(true);
    expect(pflanzenAnsicht(t, PAKCHOI, J, Z)?.soll.text).toContain('EC-Basis unklar');
    expect(pflanzenAnsicht(t, L1, J, Z)?.soll.text).not.toContain('EC-Basis unklar');
  });

  it('R1.3 fehlender Wert «Sollwert nicht belegt»', () => {
    const t = ernteTeile();
    sollwertSetzen(t, SORTE.lollo, 'wassertemp', null);
    const s = sollbereich(t, SORTE.lollo, 'wachstum', platzId('2.3'));
    expect(s.temp).toBeUndefined();
    expect(s.herkunft.temp).toBeUndefined();
    expect(s.ph).toEqual({ min: 600, max: 650 });
    const text = pflanzenAnsicht(t, L1, J, Z)?.soll.text ?? '';
    expect(text).toContain('pH 6.0–6.5');
    expect(text).toContain('Sollwert nicht belegt');
    // ohne jeden Wert
    for (const g of ['ph', 'ec']) sollwertSetzen(t, SORTE.lollo, g, null);
    const leer = sollbereich(t, SORTE.lollo, 'wachstum', platzId('2.3'));
    expect([leer.ph, leer.ec, leer.temp]).toEqual([undefined, undefined, undefined]);
    expect(pflanzenAnsicht(t, L1, J, Z)?.soll.text).toContain('Sollwert nicht belegt');
  });
});

describe('UC6 Pflanzenansicht', () => {
  it('UC6 Kopf «2.3.1, steht auf 2.3.4» und in der Anzucht der Anzuchtort', () => {
    const t = ernteTeile();
    const a = pflanzenAnsicht(t, L1, J, Z);
    expect(a).toMatchObject({
      pflanzungId: L1,
      satzId: SATZ.lollo,
      status: 'aktiv',
      kopf: { titel: 'Lollo Rossa · Schnitt · 2.3', ort: '2.3.1', tagSeitSaat: 70 },
    });
    expect(a?.phase?.phase).toBe('wachstum');
    // Topf 2.3.1 innerhalb von 2.3 auf Loch 5 verschoben
    verschiebenDazu(t, L1, '2.3.1', ['2.3', 5], '2027-03-10');
    ernteSichtenNachrechnen(t);
    expect(pflanzenAnsicht(t, L1, J, Z)?.kopf.ort).toBe('2.3.1, steht auf 2.3.5');
    // Eichblatt noch in der Box A2
    expect(pflanzenAnsicht(t, EICHBLATT[1] as string, J, Z)?.kopf.ort).toBe('A2');
    expect(pflanzenAnsicht(t, uid('28', 1), J, Z)).toBeUndefined();
  });

  it('UC6 nächster Schritt: frühester Termin, Gleichstand in fester Reihenfolge', () => {
    const t = ernteTeile();
    // Lollo Rossa: Ernte möglich seit 18.2. vor der Kulturfrage am 18.3.
    expect(pflanzenAnsicht(t, L1, J, Z)?.naechsterSchritt).toEqual({
      art: 'ernte_moeglich',
      am: '2027-02-18',
      text: 'Nächster Schritt: Ernte möglich ab 18.2.',
    });
    // Tomate: Phasenfrage und Ernte möglich beide am 6.3. → Phase bestätigen
    expect(pflanzenAnsicht(t, TOMATE, J, Z)?.naechsterSchritt).toEqual({
      art: 'phase',
      am: '2027-03-06',
      text: 'Nächster Schritt: Phase bestätigen ab 6.3.',
    });
    // Teilernte am 11.3.: Ernte möglich und Kulturfrage am 18.3. → Kultur beenden oder verlängern?
    ernteDazu(t, L1, 'teil', '2027-03-11');
    ernteSichtenNachrechnen(t);
    expect(pflanzenAnsicht(t, L1, J, Z)?.naechsterSchritt).toMatchObject({
      art: 'kultur_entscheid',
      am: '2027-03-18',
      text: 'Nächster Schritt: Kultur beenden oder verlängern? ab 18.3.',
    });
    // Pak Choi ohne Katalogwerte zur Ernte und am Profilende: kein Termin, keine Zeile
    kulturformSetzen(t, 'brassica_rapa_chinensis', 'kopf', null);
    expect(pflanzenAnsicht(t, PAKCHOI, J, Z)?.naechsterSchritt).toBeUndefined();
  });

  it('UC6 «Wie weiter?» nach Abernten des letzten Topfs in 2.3, nicht in der Anzuchtbox', () => {
    const t = ernteTeile();
    const alle = ernteVorgang(t, { pflanzungIds: [L1, L2, EISSALAT, BASILIKUM], art: 'ab' }, neueIds(), J, Z);
    expect(wieWeiter(t, alle, J, Z)).toEqual({
      kennung: '2.3',
      code: 'R-2.3',
      links: [
        { text: 'Neu bepflanzen', href: '#/saeen?ziel=R-2.3' },
        { text: 'Zum Gefäss', href: '#/gefaess/R-2.3' },
      ],
    });
    // nur Lollo Rossa: Eissalat und Basilikum bleiben
    const teilweise = ernteVorgang(t, { pflanzungIds: [L1, L2], art: 'ab' }, neueIds(), J, Z);
    expect(wieWeiter(t, teilweise, J, Z)).toBeUndefined();
    // letzter Topf nach vorigen Ernten: Basilikum allein in 2.3
    const n = teileNach(
      t,
      ernteVorgang(t, { pflanzungIds: [L1, L2, EISSALAT], art: 'ab' }, neueIds('5a'), J, Z),
      J,
      Z,
    );
    const letzter = ausfallVorgang(n, BASILIKUM, 'Wurzeln', neueIds(), J, Z);
    expect(wieWeiter(n, letzter, J, Z)?.code).toBe('R-2.3');
    // Ausfall beider Schwämme in der Box A2: kein «Wie weiter?»
    const box = [
      ...ausfallVorgang(t, EICHBLATT[1] as string, undefined, neueIds('5c'), J, Z),
      ...ausfallVorgang(t, EICHBLATT[2] as string, undefined, neueIds('5d'), J, Z),
    ];
    expect(box).toHaveLength(2);
    expect(wieWeiter(t, box, J, Z)).toBeUndefined();
  });

  it('R1.5 Fruchtgemüse: «Ja» für «Diese Pflanze zeigt das Merkmal» setzt ausloesende_pflanzung_id, «Überspringen» nicht', () => {
    const t = ernteTeile();
    // Tomate in Wachstum, nächste Phase Blüte: die Ansicht fragt nach der auslösenden Pflanze
    expect(pflanzenAnsicht(t, TOMATE, J, Z)?.ausloeserFrage).toBe('Diese Pflanze zeigt das Merkmal');
    expect(pflanzenAnsicht(t, L1, J, Z)?.ausloeserFrage).toBeUndefined();
    const daten = (v: ReturnType<typeof antwortVorgang>) =>
      (v[0]?.art === 'neu' ? v[0].felder['daten'] : undefined) as Record<string, unknown> | undefined;
    const ja = antwortVorgang(
      t,
      [{ satzId: SATZ.tomate, antwort: 'ja', ausloesendePflanzungId: TOMATE }],
      neueIds(),
      J,
      Z,
      PHASENLOGIK_AB,
    );
    expect(daten(ja)).toMatchObject({ phase: 'bluete', antwort: 'ja', ausloesende_pflanzung_id: TOMATE });
    const ueberspringen = antwortVorgang(
      t,
      [{ satzId: SATZ.tomate, antwort: 'ja' }],
      neueIds(),
      J,
      Z,
      PHASENLOGIK_AB,
    );
    expect(daten(ueberspringen)).toMatchObject({ phase: 'bluete', antwort: 'ja' });
    expect(daten(ueberspringen)?.['ausloesende_pflanzung_id']).toBeUndefined();
  });

  it('R1.7 Umfang und Schossen in der Ansicht: Satz am selben Platz, Wissenskarte nur mit Handlung', () => {
    const t = ernteTeile();
    expect(pflanzenAnsicht(t, L1, J, Z)?.umfang).toEqual([L1, L2]);
    expect(pflanzenAnsicht(t, EISSALAT, J, Z)?.umfang).toEqual([EISSALAT]);
    expect(pflanzenAnsicht(t, BASILIKUM, J, Z)?.wissenSchossen).toBe(WISSEN_SCHOSSEN_BASILIKUM);
    expect(pflanzenAnsicht(t, L1, J, Z)?.wissenSchossen).toBeUndefined();
    // Schnittlauch ohne eigene Karte: Karte der Kulturgruppe
    (t['wissenseintrag'] ??= []).push({
      id: uid('38', 41),
      ebene: 'kulturgruppe',
      art_id: null,
      kulturgruppe_id: 'kraeuter',
      phase: null,
      typ: 'schossen',
      text: 'Blütenstände früh schneiden.',
      gueltig_bis: null,
    });
    expect(pflanzenAnsicht(t, SCHNITTLAUCH, J, Z)?.wissenSchossen).toBe('Blütenstände früh schneiden.');
    expect(pflanzenAnsicht(t, BASILIKUM, J, Z)?.wissenSchossen).toBe(WISSEN_SCHOSSEN_BASILIKUM);
  });

  it('R1.7 Verlauf der Pflanzung: Teilernte, Kulturentscheid, Abernten, Wiederherstellen mit Datum, neueste zuerst', () => {
    const t = ernteTeile();
    ernteDazu(t, L1, 'teil', '2027-02-18');
    kulturEntscheidDazu(t, SATZ.lollo, 'verlaengern', '2027-03-18');
    const ab = ernteDazu(t, L1, 'ab', '2027-03-20');
    ernteSichtenNachrechnen(t);
    const amZwanzigsten = pflanzenVerlauf(t, L1, um('2027-03-20'), Z);
    const texte = amZwanzigsten.map((z) => z.text);
    const erwartet = ['20.3. Abgeerntet', '18.3. Kultur verlängert um 14 Tage', '18.2. Teilernte'];
    expect(texte.filter((x) => erwartet.includes(x))).toEqual(erwartet);
    expect(texte).toContain('28.1. Wachstum: Ja');
    expect(texte.indexOf('18.2. Teilernte')).toBeLessThan(texte.indexOf('28.1. Wachstum: Ja'));
    expect(amZwanzigsten.find((z) => z.text === '20.3. Abgeerntet')).toMatchObject({
      tag: '2027-03-20',
      wiederherstellen: true,
    });
    // neueste zuerst
    const tage = amZwanzigsten.map((z) => z.tag);
    expect(tage).toEqual([...tage].sort().reverse());
    expect(pflanzenAnsicht(t, L1, um('2027-03-20'), Z)).toMatchObject({
      status: 'geerntet',
      ende: { grund: 'geerntet', tag: '2027-03-20', wiederherstellbar: true },
    });

    ereignisDazu(t, {
      typ: 'wiederherstellen',
      pflanzungId: L1,
      giltAb: '2027-03-21T08:00:00.000Z',
      daten: { ereignis_id: ab },
    });
    ernteSichtenNachrechnen(t);
    const danach = pflanzenVerlauf(t, L1, um('2027-03-21'), Z);
    expect(danach[0]?.text).toBe('21.3. Wiederhergestellt');
    expect(danach.map((z) => z.text)).toContain('20.3. Abgeerntet');
    expect(danach.some((z) => z.wiederherstellen === true)).toBe(false);
    expect(pflanzenAnsicht(t, L1, um('2027-03-21'), Z)?.status).toBe('aktiv');

    // Ausfall mit Ursache
    const n = teileNach(t, ausfallVorgang(t, L2, 'Mehltau', neueIds(), J, Z), J, Z);
    expect(pflanzenVerlauf(n, L2, J, Z)[0]).toMatchObject({
      text: '18.3. Ausfall: Mehltau',
      wiederherstellen: true,
    });
  });

  it('R1.7 ereignisdaten: schossen_handlung mit handlung erlaubt, unbekannte Handlung abgelehnt; kultur_entscheid tage ganzzahlig > 0', () => {
    for (const handlung of ['auskneifen', 'ernten_beenden', 'bluete_nutzen'])
      expect(ereignisDatenPruefen('schossen_handlung', { handlung }), handlung).toEqual([]);
    expect(ereignisDatenPruefen('schossen_handlung', { handlung: 'giessen' })).not.toEqual([]);
    expect(ereignisDatenPruefen('schossen_handlung', { handlung: 3 })).not.toEqual([]);
    expect(ereignisDatenPruefen('kultur_entscheid', { entscheid: 'verlaengern', tage: 14 })).toEqual([]);
    expect(ereignisDatenPruefen('kultur_entscheid', { entscheid: 'beenden' })).toEqual([]);
    for (const tage of [0, -14, 1.5, '14', null])
      expect(
        ereignisDatenPruefen('kultur_entscheid', { entscheid: 'verlaengern', tage }),
        String(tage),
      ).not.toEqual([]);
  });
});
