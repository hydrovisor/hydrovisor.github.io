// Ernte, Kulturende, Schossen, Ausfall, Endzustand und Wiederherstellen (Plan 38 Testliste; UC6-AK5, R1.7, R2.2, R5.1,
// U4, TO2). Injizierte Uhr ERNTE_JETZT 2027-03-18T08:00:00Z (Zürich 18.3. 09:00 = Saat + 70), Zeitzone
// Europe/Zurich; Teile aus tests/fixtures/ernte.ts, Datenbank-Spiegel ernteVorgangAnwenden() (sichten.ts).
//
// Vertrag (Plan 38 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/phasen/ernte.ts
//     VERLAENGERN_TAGE = 14; type AusfallUrsache = 'Wurzeln' | 'Mehltau' | 'Tipburn' | 'Schädlinge' | 'Sonstiges'.
//     ernteStand(teile, pflanzungId, jetzt, zeitzone, neu?): ErnteStand | undefined (undefined: Pflanzung unbekannt
//       oder nicht aktiv). moeglichAb = erster Termin (Umsetztag bzw. Saat + ernte_ab_d) oder letzte Teilernte +
//       ernteintervall_d; er bleibt stehen, bis geerntet wird (auch in der Vergangenheit). teilernten = Zahl der
//       gültigen ernte {art: teil}. kulturEndeAm = Saat + kulturdauer_max_d + Summe der Verlängerungstage.
//       kulturFrageAm = früherer Tag von kulturEndeAm und dem Tag, an dem eine aktive Pflanzung des Satzes
//       schnitte_max Teilernten erreicht; nach dem letzten kultur_entscheid {verlaengern} dessen Tag + tage.
//       teilernteErlaubt = ernteart mehrfach. schossenHandlung nur bei Art mit Handlung und Kulturform ohne Blüte.
//     ernteVorgang(teile, { pflanzungIds, art }, ids, jetzt, zeitzone): je Pflanzung in der gegebenen Folge ein Schritt
//       tabelle ereignis { id = client_id = ids(), typ: 'ernte', pflanzung_id, gilt_ab: jetzt, daten: { art } };
//       leer, wenn eine Pflanzung nicht aktiv ist oder bei Teilernte ohne ernteart mehrfach.
//     kulturEntscheidVorgang(teile, satzId, entscheid, ids, jetzt, zeitzone): zuerst kultur_entscheid am Satz
//       { satz_id, pflanzung_id fehlt oder null, daten { entscheid: 'beenden' } bzw. { entscheid: 'verlaengern',
//       tage: 14 } }, bei fälliger Frage (kulturFrageAm ≤ heute) mit war_faellig_am und aufgabe_schluessel
//       'kultur_entscheid|<satz_id>|<fällig am>'; bei beenden danach ernte {art: ab} je aktive Pflanzung nach id.
//       Kein abschluss. Satz ohne aktive Pflanzung → [].
//     schossenVorgang(teile, pflanzungId, ids, jetzt, zeitzone): beobachtung { kategorie: 'schossen' }, dann
//       schossen_handlung { handlung }, bei ernten_beenden zuletzt ernte {art: ab}; ohne Handlung → [].
//     ausfallVorgang(teile, pflanzungId, ursache?, ids, jetzt, zeitzone): abschluss { grund: 'ausfall', text: ursache }
//       (ohne Ursache ohne text); nicht aktiv → [].
//     ernteAufgaben(teile, jetzt, zeitzone): { typ; satzId; pflanzungId; text; ort; faelligAm; schluessel }[] mit
//       faelligAm ≤ heute, nach faelligAm, dann ort. text «Ernte möglich · <Sorte>» bzw. «Kultur beenden oder
//       verlängern? · <Sorte>»; ort = «<Kürzel>-<Kennung>» des Platzes mit den meisten aktiven Pflanzungen des Satzes
//       (Direktsaat ohne Ort: Direktsaat-Platz); pflanzungId bei ernte_moeglich die Pflanzung mit dem frühesten Termin
//       (dann nach id), bei kultur_entscheid die erste aktive nach id; schluessel '<typ>|<satz_id>|<faelligAm>'.
//   src/domain/phasen/ende.ts
//     endzustand(teile, pflanzungId, jetzt, zeitzone): { grund; ereignisId; tag; wiederherstellbar; gesperrt? } |
//       undefined (aktiv). gesperrt = «Loch <Platz>.<Loch> inzwischen belegt, zuerst verschieben».
//     endeWiederherstellenVorgang(teile, pflanzungId, ids, jetzt, zeitzone): { vorgang; hinweis? }; Reihenfolge wie
//       keimung.ts: Storno korrektur der vergebenen Reservierung, dann wiederherstellen { ereignis_id }; gesperrt →
//       vorgang [] mit hinweis = Sperrtext; nach der Frist → vorgang []. keimt_nicht → wiederherstellenVorgang().
//     endeRueckgaengig(vorgang): Storno der neuen Zeilen in umgekehrter Reihenfolge (Grund rueckgaengig); enthält der
//       Vorgang einen Storno → [] (A15).
//     teileNach(teile, vorgang, jetzt, zeitzone): neue Teile (Eingabe unverändert); Upsert je client_id (zweimal
//       derselbe Vorgang = einmal).
//     zielbereichZeile(teile, platzId): Zeile wie v_zielbereich (Zahlen in Einheiten der Sicht) | undefined.
//   src/domain/pflanzung/keimung.ts: reservierungVergeben(teile, pflanzungId, netztopfId): boolean.
//   src/domain/pflanzung/belegung.ts: umsetzTag(teile, pflanzungId, zeitzone) exportiert; voraussichtlichesEnde()
//     zählt bei mehrfach die Verlängerungstage dazu.
//   Bündel: kultur_entscheid kommt im Bündelteil ereignis_pflanzung (siehe tests/fixtures/ernte.ts, Kopf).
import { describe, expect, it } from 'vitest';
import { umsetzAufgaben } from '../../src/domain/anzucht/umsetzen.ts';
import { bewertungsband } from '../../src/domain/bewertung/sollband.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { topfPrognose, umsetzTag, voraussichtlichesEnde } from '../../src/domain/pflanzung/belegung.ts';
import {
  keimAufgaben,
  reservierungVergeben,
  wiederherstellenVorgang,
} from '../../src/domain/pflanzung/keimung.ts';
import {
  ausfallVorgang,
  ernteAufgaben,
  ernteStand,
  ernteVorgang,
  kulturEntscheidVorgang,
  schossenVorgang,
  VERLAENGERN_TAGE,
} from '../../src/domain/phasen/ernte.ts';
import {
  endeRueckgaengig,
  endeWiederherstellenVorgang,
  endzustand,
  teileNach,
  zielbereichZeile,
} from '../../src/domain/phasen/ende.ts';
import { phasenKarten, PHASENLOGIK_AB } from '../../src/domain/phasen/fragen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  abschlussDazu,
  BASILIKUM,
  EICHBLATT,
  eichblattReservierung,
  EISSALAT,
  ereignisDazu,
  ernteDazu,
  ernteSichtenNachrechnen,
  ernteTeile,
  ernteVorgangAnwenden,
  ERNTE_JETZT,
  kulturEntscheidDazu,
  kulturformSetzen,
  LOLLO,
  LOLLO_Y,
  netztopfId,
  PAKCHOI,
  platzId,
  SATZ,
  SCHNITTLAUCH,
  TOMATE,
  um,
  umsetzenDazu,
} from '../fixtures/ernte.ts';
import { uid, type Teile } from '../fixtures/regal.ts';

const J = ERNTE_JETZT;
const Z = ZEITZONE;
const L1 = LOLLO[1] as string;
const L2 = LOLLO[2] as string;
const L3 = LOLLO[3] as string;
const E1 = EICHBLATT[1] as string;
const E2 = EICHBLATT[2] as string;

function neueIds(praefix = '5f'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;
type Zeile = Record<string, unknown>;
const teil = (t: unknown, name: string) => ((t as Record<string, Zeile[]>)[name] ?? []) as Zeile[];
const zustand = (t: unknown, p: string) =>
  teil(t, 'v_pflanzung_zustand').find((z) => z['pflanzung_id'] === p);
const aktivRes = (t: unknown) => teil(t, 'v_reservierung_aktiv').map((r) => r['pflanzung_id']);

function zbGleich(ist: Zeile | undefined, soll: Zeile | undefined): void {
  expect(ist).toBeDefined();
  expect(soll).toBeDefined();
  for (const k of ['ph_min', 'ph_max', 'ec_min', 'ec_max', 'temp_min', 'temp_max']) {
    const a = ist?.[k];
    const b = soll?.[k];
    if (b === null || b === undefined) expect(a ?? null, k).toBeNull();
    else expect(Number(a), k).toBeCloseTo(Number(b), 6);
  }
  expect(Number(ist?.['zaehlende_pflanzungen'])).toBe(Number(soll?.['zaehlende_pflanzungen']));
}

describe('UC6-AK5 Kultur beenden', () => {
  it('UC6-AK5 Nach dem Beenden der Lollo Rossa in 2.3 ist keine Aufgabe ihrer Pflanzungen mehr fällig, und der Zielbereich von 2.3 ist ohne neues Bündel neu berechnet', () => {
    const t = ernteTeile();
    const lolloIds = new Set<string>([L1, L2, L3]);
    const vonLollo = (x: { satzId?: string; pflanzungId?: string }) =>
      x.satzId === SATZ.lollo || (x.pflanzungId !== undefined && lolloIds.has(x.pflanzungId));

    // vorher (Saat + 70): Kulturfrage und «Ernte möglich» fällig, Stationsrest 4.4 Loch 3 wartet aufs Umsetzen
    const vorher = ernteAufgaben(t, J, Z).filter(vonLollo);
    expect(vorher.map((a) => [a.typ, a.faelligAm])).toEqual(
      expect.arrayContaining([
        ['ernte_moeglich', '2027-02-18'],
        ['kultur_entscheid', '2027-03-18'],
      ]),
    );
    expect(umsetzAufgaben(t, J, Z).some((a) => a.satzId === SATZ.lollo)).toBe(true);
    const zb23 = zielbereichZeile(t, platzId('2.3'));
    expect(zb23).toMatchObject({ ph_min: 6.0, ph_max: 6.5, zaehlende_pflanzungen: 4 });
    expect(bewertungsband(t, platzId('2.3'), J)?.ph).toEqual({ min: 600, max: 650 });

    const v = kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z);
    expect(v.length).toBeGreaterThan(0);
    const n = teileNach(t, v, J, Z);

    // keine Aufgabe des Satzes und seiner Pflanzungen mehr
    expect(ernteAufgaben(n, J, Z).filter(vonLollo)).toEqual([]);
    expect(umsetzAufgaben(n, J, Z).filter((a) => a.satzId === SATZ.lollo)).toEqual([]);
    expect(keimAufgaben(n, J, Z).filter((a) => a.satzId === SATZ.lollo)).toEqual([]);
    const karten = phasenKarten(n, J, Z, PHASENLOGIK_AB);
    expect(karten.fragen.flatMap((k) => k.zeilen).filter((z) => z.satzId === SATZ.lollo)).toEqual([]);
    expect((karten.nachfuehren?.zeilen ?? []).filter((z) => z.satzId === SATZ.lollo)).toEqual([]);
    for (const p of lolloIds) {
      expect(zustand(n, p)?.['status'], p).toBe('geerntet');
      expect(ernteStand(n, p, J, Z), p).toBeUndefined();
    }

    // Zielbereich 2.3 ohne neues Bündel: Eissalat und Basilikum zählen
    expect(zielbereichZeile(n, platzId('2.3'))).toMatchObject({
      ph_min: 5.8,
      ph_max: 6.5,
      zaehlende_pflanzungen: 2,
    });
    expect(teil(n, 'v_zielbereich').find((z) => z['platz_id'] === platzId('2.3'))).toMatchObject({
      ph_min: 5.8,
      ph_max: 6.5,
      zaehlende_pflanzungen: 2,
    });
    const band = bewertungsband(n, platzId('2.3'), J);
    expect(band?.ph).toEqual({ min: 580, max: 650 });
    expect(band?.ec).toEqual({ min: 100, max: 140 });
    expect(band?.herkunft).toBe('pflanzungen');
    // Station 4.4 ohne Pflanzung: keine Zeile mehr
    expect(zielbereichZeile(n, platzId('4.4'))).toBeUndefined();
    // gleich wie die Sicht nach dem Speichern (Datenbank-Spiegel der Fixture)
    const db = ernteVorgangAnwenden(t, v, J);
    zbGleich(
      zielbereichZeile(n, platzId('2.3')) as unknown as Zeile,
      teil(db, 'v_zielbereich').find((z) => z['platz_id'] === platzId('2.3')),
    );
    // die Eingabe bleibt unverändert
    expect(zielbereichZeile(t, platzId('2.3'))).toMatchObject({ zaehlende_pflanzungen: 4 });
  });
});

describe('R1.7 Kulturfrage', () => {
  it('R1.7 Beenden schreibt kultur_entscheid beenden am Satz und ernte ab je aktive Pflanzung, kein abschluss', () => {
    const t = ernteTeile();
    const v = kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    const f = neue(v);
    expect(f).toHaveLength(4);
    expect(f[0]).toMatchObject({ typ: 'kultur_entscheid', satz_id: SATZ.lollo, gilt_ab: J.toISOString() });
    expect(f[0]?.['pflanzung_id'] ?? null).toBeNull();
    expect(daten(f[0])).toEqual({ entscheid: 'beenden' });
    expect(f.slice(1).map((x) => [x['typ'], x['pflanzung_id'], daten(x)['art']])).toEqual([
      ['ernte', L1, 'ab'],
      ['ernte', L2, 'ab'],
      ['ernte', L3, 'ab'],
    ]);
    expect(f.some((x) => x['typ'] === 'abschluss')).toBe(false);
    for (const x of f) expect(x['id']).toBe(x['client_id']);
    // Satz ohne aktive Pflanzung: nichts zu beenden
    const n = ernteVorgangAnwenden(t, v, J);
    expect(kulturEntscheidVorgang(n, SATZ.lollo, 'beenden', neueIds(), J, Z)).toEqual([]);
  });

  it('R1.7 Verlängern schreibt kultur_entscheid verlaengern tage 14; Frage erst wieder am Entscheidtag + 14, auch nach dem vierten Schnitt', () => {
    expect(VERLAENGERN_TAGE).toBe(14);
    const t = ernteTeile();
    const v = kulturEntscheidVorgang(t, SATZ.lollo, 'verlaengern', neueIds(), J, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    const f = neue(v);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ typ: 'kultur_entscheid', satz_id: SATZ.lollo });
    expect(daten(f[0])).toEqual({ entscheid: 'verlaengern', tage: 14 });

    const n = teileNach(t, v, J, Z);
    expect(zustand(n, L1)?.['status']).toBe('aktiv');
    expect(ernteStand(n, L1, J, Z)).toMatchObject({
      kulturFrageAm: '2027-04-01',
      kulturEndeAm: '2027-04-01',
    });
    expect(
      ernteAufgaben(n, J, Z).filter((a) => a.typ === 'kultur_entscheid' && a.satzId === SATZ.lollo),
    ).toEqual([]);

    // vierter Schnitt nach dem Verlängern: die Frage bleibt beim 1.4.
    const db = ernteVorgangAnwenden(t, v, J);
    for (const tag of ['2027-02-18', '2027-02-25', '2027-03-04', '2027-03-20'])
      ernteDazu(db, L1, 'teil', tag);
    ernteSichtenNachrechnen(db);
    const nach = um('2027-03-21');
    expect(ernteStand(db, L1, nach, Z)).toMatchObject({ teilernten: 4, kulturFrageAm: '2027-04-01' });
    const frage = (t2: unknown, jetzt: Date) =>
      ernteAufgaben(t2 as Teile, jetzt, Z).filter(
        (a) => a.typ === 'kultur_entscheid' && a.satzId === SATZ.lollo,
      );
    expect(frage(db, nach)).toEqual([]);
    expect(frage(db, um('2027-04-01')).map((a) => a.faelligAm)).toEqual(['2027-04-01']);
  });

  it('R1.7 Kulturfrage beim vierten Teilschnitt vor Kulturdauer max.', () => {
    const t = ernteTeile();
    for (const tag of ['2027-02-18', '2027-02-25', '2027-03-04']) ernteDazu(t, L1, 'teil', tag);
    ernteSichtenNachrechnen(t);
    expect(ernteStand(t, L1, um('2027-03-10'), Z)).toMatchObject({
      teilernten: 3,
      schnitteMax: 4,
      kulturEndeAm: '2027-03-18',
      kulturFrageAm: '2027-03-18',
    });
    ernteDazu(t, L1, 'teil', '2027-03-11');
    ernteSichtenNachrechnen(t);
    const elfter = um('2027-03-11');
    expect(ernteStand(t, L1, elfter, Z)).toMatchObject({ teilernten: 4, kulturFrageAm: '2027-03-11' });
    // die Frage gilt für den Satz, also auch für die zweite Pflanzung
    expect(ernteStand(t, L2, elfter, Z)?.kulturFrageAm).toBe('2027-03-11');
    const frage = ernteAufgaben(t, elfter, Z).filter(
      (a) => a.typ === 'kultur_entscheid' && a.satzId === SATZ.lollo,
    );
    expect(frage.map((a) => [a.faelligAm, a.schluessel])).toEqual([
      ['2027-03-11', `kultur_entscheid|${SATZ.lollo}|2027-03-11`],
    ]);
  });

  it('R1.7 Kulturfrage beantwortet aus Heute setzt war_faellig_am und aufgabe_schluessel', () => {
    const t = ernteTeile();
    const aufgabe = ernteAufgaben(t, J, Z).find(
      (a) => a.typ === 'kultur_entscheid' && a.satzId === SATZ.lollo,
    );
    expect(aufgabe?.schluessel).toBe(`kultur_entscheid|${SATZ.lollo}|2027-03-18`);
    for (const entscheid of ['beenden', 'verlaengern'] as const) {
      const [k] = neue(kulturEntscheidVorgang(t, SATZ.lollo, entscheid, neueIds(), J, Z));
      expect(k, entscheid).toMatchObject({
        typ: 'kultur_entscheid',
        war_faellig_am: '2027-03-18',
        aufgabe_schluessel: aufgabe?.schluessel,
      });
    }
    // vor der Fälligkeit (freiwillig verlängert) ohne Bezug auf eine Aufgabe
    const [frueh] = neue(
      kulturEntscheidVorgang(t, SATZ.lollo, 'verlaengern', neueIds(), um('2027-03-17'), Z),
    );
    expect(frueh?.['typ']).toBe('kultur_entscheid');
    expect(frueh?.['war_faellig_am'] ?? null).toBeNull();
    expect(frueh?.['aufgabe_schluessel'] ?? null).toBeNull();
    // die Ernten des Beendens tragen keinen Aufgabenbezug
    for (const e of neue(kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z)).slice(1))
      expect(e['aufgabe_schluessel'] ?? null).toBeNull();
  });
});

describe('R1.7 Ernte', () => {
  it('R1.7 Teilernte lässt Phase und Status, nächste Ernte möglich = Erntetag + 7', () => {
    const t = ernteTeile();
    const tag = um('2027-02-18');
    expect(ernteStand(t, L1, tag, Z)).toMatchObject({
      ernteart: 'mehrfach',
      moeglichAb: '2027-02-18',
      teilernten: 0,
      schnitteMax: 4,
      teilernteErlaubt: true,
    });
    const v = ernteVorgang(t, { pflanzungIds: [L1], art: 'teil' }, neueIds(), tag, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v)).toEqual([
      expect.objectContaining({
        typ: 'ernte',
        pflanzung_id: L1,
        gilt_ab: tag.toISOString(),
        daten: { art: 'teil' },
      }),
    ]);
    // noch nicht gespeichert (neu) und überlagert rechnen gleich
    expect(ernteStand(t, L1, tag, Z, v)).toMatchObject({ moeglichAb: '2027-02-25', teilernten: 1 });
    const n = teileNach(t, v, tag, Z);
    expect(ernteStand(n, L1, tag, Z)).toMatchObject({ moeglichAb: '2027-02-25', teilernten: 1 });
    expect(zustand(n, L1)).toMatchObject({ status: 'aktiv', phase: 'wachstum' });
    expect(zielbereichZeile(n, platzId('2.3'))).toMatchObject({ zaehlende_pflanzungen: 4 });
    // die andere Pflanzung des Satzes bleibt beim ersten Termin
    expect(ernteStand(n, L2, tag, Z)).toMatchObject({ moeglichAb: '2027-02-18', teilernten: 0 });
  });

  it('R1.7 Ernte möglich ab Umsetztag + ernte_ab_d, bei Direktsaat ab Saat', () => {
    const t = ernteTeile({ mitY: true });
    expect(umsetzTag(t, L1, Z)).toBe('2027-01-28');
    expect(umsetzTag(t, BASILIKUM, Z)).toBe('2027-02-04');
    expect(ernteStand(t, L1, J, Z)?.moeglichAb).toBe('2027-02-18');
    expect(ernteStand(t, EISSALAT, J, Z)?.moeglichAb).toBe('2027-03-04');
    expect(ernteStand(t, BASILIKUM, J, Z)?.moeglichAb).toBe('2027-03-04');
    expect(ernteStand(t, PAKCHOI, J, Z)?.moeglichAb).toBe('2027-02-27');
    // Direktsaat in Y-2.3, gesät 1.2.: Saat + 21
    expect(ernteStand(t, LOLLO_Y, J, Z)?.moeglichAb).toBe('2027-02-22');
    // Stationsrest ohne Umsetzen: kein Termin (A4)
    const rest = ernteStand(t, L3, J, Z);
    expect(rest?.ernteart).toBe('mehrfach');
    expect(rest?.moeglichAb).toBeUndefined();
  });

  it('R1.7 Abernten einer Einmalernte: Status geerntet ohne abschluss, Loch frei, Teilernte abgelehnt', () => {
    const t = ernteTeile();
    expect(ernteStand(t, EISSALAT, J, Z)).toMatchObject({ ernteart: 'einmalig', teilernteErlaubt: false });
    expect(ernteVorgang(t, { pflanzungIds: [EISSALAT], art: 'teil' }, neueIds(), J, Z)).toEqual([]);
    expect(topfPrognose(t, netztopfId('2.3.3'), '2027-03-19', false, Z)?.grund).toBe('nachfolge');

    const v = ernteVorgang(t, { pflanzungIds: [EISSALAT], art: 'ab' }, neueIds(), J, Z);
    expect(neue(v).map((x) => [x['typ'], x['pflanzung_id'], daten(x)['art']])).toEqual([
      ['ernte', EISSALAT, 'ab'],
    ]);
    const n = teileNach(t, v, J, Z);
    expect(zustand(n, EISSALAT)?.['status']).toBe('geerntet');
    expect(ernteStand(n, EISSALAT, J, Z)).toBeUndefined();
    expect(zielbereichZeile(n, platzId('2.3'))).toMatchObject({ zaehlende_pflanzungen: 3 });
    expect(topfPrognose(n, netztopfId('2.3.3'), '2027-03-19', false, Z)).toMatchObject({
      grund: 'leer',
      frei: true,
    });
    // zweimal abernten geht nicht
    expect(ernteVorgang(n, { pflanzungIds: [EISSALAT], art: 'ab' }, neueIds(), J, Z)).toEqual([]);
  });

  it('R1.7 ohne ernteintervall_d kein neuer Termin nach Teilernte; ohne art_kulturform nur Abernten', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { ernteintervall_d: null });
    const tag = um('2027-02-18');
    const n = teileNach(t, ernteVorgang(t, { pflanzungIds: [L1], art: 'teil' }, neueIds(), tag, Z), tag, Z);
    const nach = ernteStand(n, L1, tag, Z);
    expect(nach?.teilernten).toBe(1);
    expect(nach?.moeglichAb).toBeUndefined();

    kulturformSetzen(t, 'ocimum_basilicum', 'dauerkultur_blatt', null);
    const b = ernteStand(t, BASILIKUM, J, Z);
    expect(b).toBeDefined();
    expect(b?.ernteart).toBeUndefined();
    expect(b?.moeglichAb).toBeUndefined();
    expect(b?.kulturFrageAm).toBeUndefined();
    expect(b?.teilernteErlaubt).toBe(false);
    expect(ernteVorgang(t, { pflanzungIds: [BASILIKUM], art: 'teil' }, neueIds(), J, Z)).toEqual([]);
    expect(
      neue(ernteVorgang(t, { pflanzungIds: [BASILIKUM], art: 'ab' }, neueIds(), J, Z)).map(
        (x) => daten(x)['art'],
      ),
    ).toEqual(['ab']);
    expect(ernteAufgaben(t, J, Z).filter((a) => a.satzId === SATZ.basilikum)).toEqual([]);
  });

  it('R1.7 Umfang «Alle 2 im Satz» schreibt je Pflanzung ein Ereignis', () => {
    const t = ernteTeile();
    const tag = um('2027-02-18');
    const v = ernteVorgang(t, { pflanzungIds: [L1, L2], art: 'teil' }, neueIds(), tag, Z);
    const f = neue(v);
    expect(f.map((x) => [x['typ'], x['pflanzung_id'], daten(x)['art']])).toEqual([
      ['ernte', L1, 'teil'],
      ['ernte', L2, 'teil'],
    ]);
    expect(new Set(f.map((x) => x['client_id'])).size).toBe(2);
    const n = teileNach(t, v, tag, Z);
    for (const p of [L1, L2])
      expect(ernteStand(n, p, tag, Z)).toMatchObject({ teilernten: 1, moeglichAb: '2027-02-25' });
    // eine nicht aktive Pflanzung im Umfang: kein halber Vorgang
    const ohneL2 = ernteVorgangAnwenden(
      t,
      ernteVorgang(t, { pflanzungIds: [L2], art: 'ab' }, neueIds('5e'), tag, Z),
      tag,
    );
    expect(ernteVorgang(ohneL2, { pflanzungIds: [L1, L2], art: 'teil' }, neueIds(), tag, Z)).toEqual([]);
  });
});

describe('R1.7 Schossen und Ausfall', () => {
  it('R1.7 Schossen Basilikum: beobachtung schossen plus schossen_handlung auskneifen, Pflanze bleibt aktiv', () => {
    const t = ernteTeile();
    expect(ernteStand(t, BASILIKUM, J, Z)?.schossenHandlung).toBe('auskneifen');
    const v = schossenVorgang(t, BASILIKUM, neueIds(), J, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v).map((x) => [x['typ'], x['pflanzung_id'], daten(x)])).toEqual([
      ['beobachtung', BASILIKUM, { kategorie: 'schossen' }],
      ['schossen_handlung', BASILIKUM, { handlung: 'auskneifen' }],
    ]);
    const n = teileNach(t, v, J, Z);
    expect(zustand(n, BASILIKUM)?.['status']).toBe('aktiv');
    expect(zielbereichZeile(n, platzId('2.3'))).toMatchObject({ zaehlende_pflanzungen: 4 });
    // Schnittlauch: Blüte nutzen, weiter
    expect(neue(schossenVorgang(t, SCHNITTLAUCH, neueIds(), J, Z)).map((x) => daten(x))).toEqual([
      { kategorie: 'schossen' },
      { handlung: 'bluete_nutzen' },
    ]);
  });

  it('R1.7 Schossen Pak Choi: zusätzlich ernte ab, Status geerntet', () => {
    const t = ernteTeile();
    expect(ernteStand(t, PAKCHOI, J, Z)?.schossenHandlung).toBe('ernten_beenden');
    const v = schossenVorgang(t, PAKCHOI, neueIds(), J, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v).map((x) => [x['typ'], daten(x)])).toEqual([
      ['beobachtung', { kategorie: 'schossen' }],
      ['schossen_handlung', { handlung: 'ernten_beenden' }],
      ['ernte', { art: 'ab' }],
    ]);
    const n = teileNach(t, v, J, Z);
    expect(zustand(n, PAKCHOI)?.['status']).toBe('geerntet');
    expect(endzustand(n, PAKCHOI, J, Z)).toMatchObject({ grund: 'geerntet', tag: '2027-03-18' });
  });

  it('R1.7 Schossen ohne Handlung der Art und bei Fruchtgemüse: kein Knopf', () => {
    const t = ernteTeile();
    // Salat hat in der Fixture keine Handlung
    expect(ernteStand(t, L1, J, Z)?.schossenHandlung).toBeUndefined();
    expect(schossenVorgang(t, L1, neueIds(), J, Z)).toEqual([]);
    // Fruchtgemüse: auch mit Handlung an der Art kein Schossen (Phasenfrage nach R1.5)
    for (const a of teil(t, 'art'))
      if (a['art_id'] === 'solanum_lycopersicum') a['schossen_handlung'] = 'auskneifen';
    expect(ernteStand(t, TOMATE, J, Z)?.schossenHandlung).toBeUndefined();
    expect(schossenVorgang(t, TOMATE, neueIds(), J, Z)).toEqual([]);
  });

  it('R1.7 Ausfall mit Ursache: abschluss ausfall mit text, aktive Reservierung frei', () => {
    const t = ernteTeile();
    expect(aktivRes(t)).toContain(E1);
    const v = ausfallVorgang(t, E1, 'Mehltau', neueIds(), J, Z);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v)).toEqual([
      expect.objectContaining({
        typ: 'abschluss',
        pflanzung_id: E1,
        gilt_ab: J.toISOString(),
        daten: { grund: 'ausfall', text: 'Mehltau' },
      }),
    ]);
    const n = teileNach(t, v, J, Z);
    expect(zustand(n, E1)?.['status']).toBe('ausfall');
    expect(aktivRes(n)).not.toContain(E1);
    expect(aktivRes(n)).toContain(E2);
    expect(aktivRes(ernteVorgangAnwenden(t, v, J))).not.toContain(E1);
    // ohne Wahl kein text
    expect(daten(neue(ausfallVorgang(t, E1, undefined, neueIds(), J, Z))[0])).toEqual({ grund: 'ausfall' });
    // schon beendet: kein zweiter Abschluss
    expect(ausfallVorgang(n, E1, 'Wurzeln', neueIds(), J, Z)).toEqual([]);
  });
});

describe('R1.7 Endzustand und Wiederherstellen', () => {
  it('R1.7 Wiederherstellen geerntet am 7. Kalendertag möglich, am 8. nicht', () => {
    const t = ernteTeile();
    const v = ernteVorgang(t, { pflanzungIds: [EISSALAT], art: 'ab' }, neueIds(), J, Z);
    const abId = neue(v)[0]?.['id'];
    const n = teileNach(t, v, J, Z);
    expect(endzustand(t, EISSALAT, J, Z)).toBeUndefined();
    expect(endzustand(n, EISSALAT, J, Z)).toMatchObject({
      grund: 'geerntet',
      ereignisId: abId,
      tag: '2027-03-18',
      wiederherstellbar: true,
    });
    const siebter = um('2027-03-25');
    expect(endzustand(n, EISSALAT, siebter, Z)?.wiederherstellbar).toBe(true);
    const w = endeWiederherstellenVorgang(n, EISSALAT, neueIds('5e'), siebter, Z);
    expect(w.hinweis).toBeUndefined();
    expect(vorgangPruefen(w.vorgang)).toEqual([]);
    expect(neue(w.vorgang)).toEqual([
      expect.objectContaining({
        typ: 'wiederherstellen',
        pflanzung_id: EISSALAT,
        gilt_ab: siebter.toISOString(),
        daten: { ereignis_id: abId },
      }),
    ]);
    const zurueck = teileNach(n, w.vorgang, siebter, Z);
    expect(zustand(zurueck, EISSALAT)?.['status']).toBe('aktiv');
    expect(endzustand(zurueck, EISSALAT, siebter, Z)).toBeUndefined();
    expect(zielbereichZeile(zurueck, platzId('2.3'))).toMatchObject({ zaehlende_pflanzungen: 4 });

    const achter = um('2027-03-26');
    expect(endzustand(n, EISSALAT, achter, Z)?.wiederherstellbar).toBe(false);
    expect(endeWiederherstellenVorgang(n, EISSALAT, neueIds('5e'), achter, Z).vorgang).toEqual([]);
  });

  it('R1.7 Wiederherstellen Ausfall öffnet die Reservierung wieder; Zieltopf vergeben → Storno korrektur und Hinweis', () => {
    const t = ernteTeile();
    const v = ausfallVorgang(t, E1, 'Wurzeln', neueIds(), J, Z);
    const n = teileNach(t, v, J, Z);
    expect(endzustand(n, E1, J, Z)).toMatchObject({ grund: 'ausfall', wiederherstellbar: true });
    const w = endeWiederherstellenVorgang(n, E1, neueIds('5e'), J, Z);
    expect(w.hinweis).toBeUndefined();
    expect(w.vorgang.map((s) => s.art)).toEqual(['neu']);
    const zurueck = teileNach(n, w.vorgang, J, Z);
    expect(zustand(zurueck, E1)?.['status']).toBe('aktiv');
    expect(aktivRes(zurueck)).toContain(E1);

    // inzwischen ist 2.1.3 an den Stationsrest der Lollo Rossa vergeben
    const db = ernteVorgangAnwenden(t, v, J);
    expect(reservierungVergeben(db, E1, netztopfId('2.1.3'))).toBe(false);
    const neueRes = uid('30', 9990);
    teil(db, 'reservierung').push({
      id: neueRes,
      client_id: neueRes,
      pflanzung_id: L3,
      netztopf_id: netztopfId('2.1.3'),
      umsetzen_vorgabe_am: '2027-03-25',
      umsetzen_geplant_am: '2027-03-25',
      gilt_ab: '2027-03-18T09:00:00.000Z',
      storniert_am: null,
    });
    ernteSichtenNachrechnen(db);
    expect(reservierungVergeben(db, E1, netztopfId('2.1.3'))).toBe(true);
    expect(reservierungVergeben(t, E1, netztopfId('2.1.3'))).toBe(false);
    const w2 = endeWiederherstellenVorgang(db, E1, neueIds('5e'), J, Z);
    expect(w2.vorgang[0]).toEqual({
      art: 'storno',
      tabelle: 'reservierung',
      clientId: eichblattReservierung(1),
      grund: 'korrektur',
    });
    expect(neue(w2.vorgang).map((x) => x['typ'])).toEqual(['wiederherstellen']);
    expect(w2.hinweis).toMatch(/2\.1\.3/);
    expect(w2.hinweis).toMatch(/inzwischen vergeben/);
    const nachDb = ernteVorgangAnwenden(db, w2.vorgang, J);
    expect(zustand(nachDb, E1)?.['status']).toBe('aktiv');
    expect(
      teil(nachDb, 'v_reservierung_aktiv').filter((r) => r['netztopf_id'] === netztopfId('2.1.3')),
    ).toHaveLength(1);
  });

  it('R1.7 Wiederherstellen gesperrt, wenn eine andere aktive Pflanzung im Loch steht', () => {
    const t = ernteTeile();
    const v = ernteVorgang(t, { pflanzungIds: [EISSALAT, L2], art: 'ab' }, neueIds(), J, Z);
    const db = ernteVorgangAnwenden(t, v, J);
    // der Stationsrest kommt am 19.3. ins frei gewordene Loch 2.3.3
    umsetzenDazu(db, L3, '2.3.3', '2027-03-19', ['4.4', 3]);
    ernteSichtenNachrechnen(db);
    const tag = um('2027-03-20');
    const sperre = 'Loch 2.3.3 inzwischen belegt, zuerst verschieben';
    expect(endzustand(db, EISSALAT, tag, Z)).toMatchObject({ grund: 'geerntet', gesperrt: sperre });
    expect(endeWiederherstellenVorgang(db, EISSALAT, neueIds('5e'), tag, Z)).toEqual({
      vorgang: [],
      hinweis: sperre,
    });
    // das Loch von Pflanzung 2 ist frei: nicht gesperrt
    const l2 = endzustand(db, L2, tag, Z);
    expect(l2?.wiederherstellbar).toBe(true);
    expect(l2?.gesperrt).toBeUndefined();
    expect(neue(endeWiederherstellenVorgang(db, L2, neueIds('5e'), tag, Z).vorgang)).toHaveLength(1);
  });

  it('R1.7 Wiederherstellen keimt nicht ruft wiederherstellenVorgang aus keimung.ts (gleicher Vorgang)', () => {
    const t = ernteTeile();
    ereignisDazu(t, {
      typ: 'keimung',
      pflanzungId: E2,
      giltAb: '2027-03-14T08:00:00.000Z',
      daten: { samen_gesaet: 1, samen_gekeimt: 0, keimtemp_eingehalten: true },
    });
    abschlussDazu(t, E2, 'keimt_nicht', '2027-03-14');
    ernteSichtenNachrechnen(t);
    expect(endzustand(t, E2, J, Z)).toMatchObject({
      grund: 'keimt_nicht',
      tag: '2027-03-14',
      wiederherstellbar: true,
    });
    const eigen = endeWiederherstellenVorgang(t, E2, neueIds('5d'), J, Z);
    const keim = wiederherstellenVorgang(t, E2, neueIds('5d'), J, Z);
    expect(keim.vorgang.length).toBeGreaterThan(0);
    expect(eigen).toEqual(keim);
  });

  it('R1.7 Endzustand über die Sommerzeit: geerntet 22.3.2027, wiederherstellbar bis und mit 29.3.2027', () => {
    const t = ernteTeile();
    // 22.3. 23:30 Zürich (Winterzeit)
    const spaet = new Date('2027-03-22T22:30:00Z');
    const n = teileNach(
      t,
      ernteVorgang(t, { pflanzungIds: [EISSALAT], art: 'ab' }, neueIds(), spaet, Z),
      spaet,
      Z,
    );
    expect(endzustand(n, EISSALAT, spaet, Z)?.tag).toBe('2027-03-22');
    // 29.3. 23:30 Zürich (Sommerzeit, 21:30 UTC): noch möglich
    expect(endzustand(n, EISSALAT, new Date('2027-03-29T21:30:00Z'), Z)?.wiederherstellbar).toBe(true);
    // 30.3. 00:30 Zürich (29.3. 22:30 UTC): vorbei
    expect(endzustand(n, EISSALAT, new Date('2027-03-29T22:30:00Z'), Z)?.wiederherstellbar).toBe(false);
  });
});

describe('R1.7 Aufgaben, Zielbereich, Prognose', () => {
  it('R1.7 ernteAufgaben: Satz ohne aktive Pflanzung keine Aufgabe; alle Anlagen mit Kürzel; Schlüssel ernte_moeglich|satz|tag und kultur_entscheid|satz|tag', () => {
    const t = ernteTeile({ mitY: true });
    const alle = ernteAufgaben(t, J, Z);
    expect(alle).toEqual(
      expect.arrayContaining([
        {
          typ: 'ernte_moeglich',
          satzId: SATZ.lollo,
          pflanzungId: L1,
          text: 'Ernte möglich · Lollo Rossa',
          ort: 'R-2.3',
          faelligAm: '2027-02-18',
          schluessel: `ernte_moeglich|${SATZ.lollo}|2027-02-18`,
        },
        {
          typ: 'kultur_entscheid',
          satzId: SATZ.lollo,
          pflanzungId: L1,
          text: 'Kultur beenden oder verlängern? · Lollo Rossa',
          ort: 'R-2.3',
          faelligAm: '2027-03-18',
          schluessel: `kultur_entscheid|${SATZ.lollo}|2027-03-18`,
        },
        expect.objectContaining({
          typ: 'ernte_moeglich',
          satzId: SATZ.lolloY,
          pflanzungId: LOLLO_Y,
          ort: 'Y-2.3',
          faelligAm: '2027-02-22',
        }),
        expect.objectContaining({ typ: 'ernte_moeglich', satzId: SATZ.pakchoi, faelligAm: '2027-02-27' }),
      ]),
    );
    // nach Fälligkeit, dann Ort
    const sortiert = [...alle].sort(
      (a, b) => a.faelligAm.localeCompare(b.faelligAm) || a.ort.localeCompare(b.ort),
    );
    expect(alle.map((a) => [a.faelligAm, a.ort])).toEqual(sortiert.map((a) => [a.faelligAm, a.ort]));
    // nur fällig bis heute
    for (const a of alle) expect(a.faelligAm <= '2027-03-18').toBe(true);
    expect(ernteAufgaben(t, um('2027-02-17'), Z).filter((a) => a.satzId === SATZ.lollo)).toEqual([]);
    // Pak Choi abgeerntet: Satz ohne aktive Pflanzung, keine Aufgabe
    const n = teileNach(t, ernteVorgang(t, { pflanzungIds: [PAKCHOI], art: 'ab' }, neueIds(), J, Z), J, Z);
    expect(ernteAufgaben(n, J, Z).filter((a) => a.satzId === SATZ.pakchoi)).toEqual([]);
    // Lollo Rossa: nach Teilernte beider Töpfe ist «Ernte möglich» wieder ab 25.3. fällig
    const geerntet = teileNach(
      t,
      ernteVorgang(t, { pflanzungIds: [L1, L2], art: 'teil' }, neueIds('5e'), J, Z),
      J,
      Z,
    );
    expect(
      ernteAufgaben(geerntet, J, Z).filter((a) => a.typ === 'ernte_moeglich' && a.satzId === SATZ.lollo),
    ).toEqual([]);
    expect(
      ernteAufgaben(geerntet, um('2027-03-25'), Z)
        .filter((a) => a.typ === 'ernte_moeglich' && a.satzId === SATZ.lollo)
        .map((a) => a.schluessel),
    ).toEqual([`ernte_moeglich|${SATZ.lollo}|2027-03-25`]);
  });

  it('R2.2 zielbereichZeile stimmt mit v_zielbereich der Fixture sichten.ts überein (EC-Basis zuwachs plus ECWasser)', () => {
    const t = ernteTeile({ mitY: true });
    const sicht = teil(t, 'v_zielbereich');
    expect(sicht.length).toBeGreaterThanOrEqual(5);
    for (const z of sicht) zbGleich(zielbereichZeile(t, String(z['platz_id'])) as unknown as Zeile, z);
    // Lollo Rossa EC 0.8–1.2 Zuwachs + ECWasser 0.4 = 1.2–1.6; mit Eissalat und Basilikum 1.2–1.4
    const zb = zielbereichZeile(t, platzId('2.3'));
    expect(Number(zb?.ec_min)).toBeCloseTo(1.2, 6);
    expect(Number(zb?.ec_max)).toBeCloseTo(1.4, 6);
    // Station 4.4 nur mit dem Stationsrest: EC 1.2–1.6
    expect(Number(zielbereichZeile(t, platzId('4.4'))?.ec_max)).toBeCloseTo(1.6, 6);
    // Y ohne v_ec_wasser: Standard 0.5 → 1.3–1.7
    const y = teil(t, 'v_zielbereich').find((z) => String(z['platz_id']).startsWith('3b'));
    expect(Number(zielbereichZeile(t, String(y?.['platz_id']))?.ec_min)).toBeCloseTo(1.3, 6);
    // Gefäss ohne aktive Pflanzung und Anzuchtbox: keine Zeile
    expect(zielbereichZeile(t, platzId('1.2'))).toBeUndefined();
    expect(zielbereichZeile(t, platzId('A2'))).toBeUndefined();
  });

  it('R1.7 voraussichtlichesEnde zählt Verlängerungen dazu', () => {
    const t = ernteTeile();
    expect(voraussichtlichesEnde(t, L1)).toEqual({ ernteart: 'mehrfach', endeAm: '2027-03-18' });
    const eis = voraussichtlichesEnde(t, EISSALAT);
    kulturEntscheidDazu(t, SATZ.lollo, 'verlaengern', '2027-03-18');
    ernteSichtenNachrechnen(t);
    expect(voraussichtlichesEnde(t, L1)).toEqual({ ernteart: 'mehrfach', endeAm: '2027-04-01' });
    kulturEntscheidDazu(t, SATZ.lollo, 'verlaengern', '2027-04-01');
    ernteSichtenNachrechnen(t);
    expect(voraussichtlichesEnde(t, L2)).toEqual({ ernteart: 'mehrfach', endeAm: '2027-04-15' });
    expect(ernteStand(t, L1, um('2027-04-01'), Z)?.kulturEndeAm).toBe('2027-04-15');
    // andere Sätze unverändert
    expect(voraussichtlichesEnde(t, EISSALAT)).toEqual(eis);
  });
});

describe('U4 und TO2', () => {
  it('U4 Rückgängig storniert die neuen Zeilen in umgekehrter Reihenfolge; Wiederherstellen mit Reservierungs-Storno ohne Rückgängig', () => {
    const t = ernteTeile();
    const v = kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z);
    const ids = neue(v).map((f) => f['client_id']);
    const r = endeRueckgaengig(v);
    expect(r).toEqual(
      [...ids]
        .reverse()
        .map((clientId) => ({ art: 'storno', tabelle: 'ereignis', clientId, grund: 'rueckgaengig' })),
    );
    const zurueck = ernteVorgangAnwenden(ernteVorgangAnwenden(t, v, J), r, J);
    for (const p of [L1, L2, L3]) expect(zustand(zurueck, p)?.['status'], p).toBe('aktiv');
    expect(
      teil(zurueck, 'v_zielbereich').find((z) => z['platz_id'] === platzId('2.3'))?.['zaehlende_pflanzungen'],
    ).toBe(4);
    // Schossen und Ausfall ebenso
    const s = schossenVorgang(t, PAKCHOI, neueIds('5e'), J, Z);
    expect(endeRueckgaengig(s).map((x) => (x.art === 'storno' ? x.clientId : ''))).toEqual(
      neue(s)
        .map((f) => f['client_id'])
        .reverse(),
    );
    // Wiederherstellen mit Storno der vergebenen Reservierung: kein Rückgängig (A15)
    const mitStorno: Vorgang = [
      { art: 'storno', tabelle: 'reservierung', clientId: eichblattReservierung(1), grund: 'korrektur' },
      {
        art: 'neu',
        tabelle: 'ereignis',
        felder: { client_id: uid('5f', 99), id: uid('5f', 99), typ: 'wiederherstellen', pflanzung_id: E1 },
      },
    ];
    expect(endeRueckgaengig(mitStorno)).toEqual([]);
  });

  it('TO2 gleicher Vorgang bei Wiederholung (gleiche client_id)', () => {
    const t = ernteTeile();
    const a = kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z);
    const b = kulturEntscheidVorgang(t, SATZ.lollo, 'beenden', neueIds(), J, Z);
    expect(b).toEqual(a);
    for (const f of neue(a)) expect(f['id']).toBe(f['client_id']);
    // erneut senden (Upsert je client_id): einmal gezählt
    const einmal = teileNach(t, a, J, Z);
    const zweimal = teileNach(einmal, a, J, Z);
    expect(teil(zweimal, 'ereignis_pflanzung')).toHaveLength(teil(einmal, 'ereignis_pflanzung').length);
    expect(zielbereichZeile(zweimal, platzId('2.3'))).toEqual(zielbereichZeile(einmal, platzId('2.3')));
    const tag = um('2027-02-18');
    const e = ernteVorgang(t, { pflanzungIds: [L1], art: 'teil' }, neueIds('5e'), tag, Z);
    const zweiTeil = teileNach(teileNach(t, e, tag, Z), e, tag, Z);
    expect(ernteStand(zweiTeil, L1, tag, Z)?.teilernten).toBe(1);
  });
});
