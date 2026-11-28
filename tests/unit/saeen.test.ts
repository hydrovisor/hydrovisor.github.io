// Säen: Auswahl, Zieltöpfe, Box, Prüfung, Vorgang und Rückgängig (Plan 23 Testliste; Anzucht-AK2, R1.2, R6.1, R8.1,
// R8.2, R12.1, UC5, TO2). Injizierte Uhr 2027-01-07T08:00:00Z, Zeitzone Europe/Zurich; Regal R und Wissen aus
// tests/fixtures/saeen.ts (2.3 Loch 1 bis 3 belegt durch den Satz Lollo Rossa, gesät vor 30 Tagen).
//
// Vertrag (Plan 23 «Domänenfunktionen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   sortenAuswahl(teile): { sorteId; name; … }[]  – erste Zeile die Sorte des jüngsten nicht stornierten Satzes
//   kulturformen(art, kulturtyp): { erlaubt: Kulturform[] (Reihenfolge der Art); vorgabe }
//   zielgefaesse(teile, anlageId): { platzId; kennung; code; direktsaat; reihen; hinweis? }[] nach Kennung
//   zieltoepfe(teile, platzId, ausgewaehlt: Map<netztopfId, Ziffer der Sorte>)
//     : { lochNr; netztopfId; kennung; groesseMm; zustand; marke? }[]
//   boxFuer(teile, anlageId, keimart, vorgewaehlt?: platzId der Box): { platzId; kennung; typ; hinweis? }
//   saatVorschlag(teile, eingabe, jetzt, zeitzone): { saetze; vorschau; hinweise: string[] }
//   saatEingabePruefen(teile, eingabe, jetzt, zeitzone): Verstoss[]   (leer = gültig)
//   saatVorgang(teile, eingabe, ids, jetzt, zeitzone): Vorgang        (bei Verstössen [])
//   saatRueckgaengig(vorgang): Vorgang                                  (Storno, Grund rueckgaengig, umgekehrt)
//   Jede neue Zeile: felder.id === felder.client_id === ids().
import { describe, expect, it } from 'vitest';
import { gefaessAnsicht } from '../../src/domain/anlage/gefaess.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  boxFuer,
  kulturformen,
  saatEingabePruefen,
  saatRueckgaengig,
  saatVorgang,
  saatVorschlag,
  sortenAuswahl,
  UMSETZ_FENSTER_OHNE_BIS,
  umsetzFenster,
  umsetzFensterSorte,
  zielgefaesse,
  zieltoepfe,
  type SaatEingabe,
} from '../../src/domain/pflanzung/saeen.ts';
import { ereignisDatenPruefen } from '../../src/domain/datenpfad/ereignisdaten.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { netztopfId, platzId, uid, type Teile } from '../fixtures/regal.ts';
import { ANLAGE_R, PACKUNG, reservierung, saatTeile, SORTE } from '../fixtures/saeen.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');
const Z = ZEITZONE;
const BEGONNEN = new Date('2027-01-07T07:58:30Z');

function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5a', n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang, tabelle?: string) =>
  v
    .filter((s): s is Neu => s.art === 'neu' && (tabelle === undefined || s.tabelle === tabelle))
    .map((s) => s.felder);

const toepfe = (...kennungen: string[]) => kennungen.map((k) => netztopfId(k));

/** zwei Sätze Salat in A1 mit je 3 Zieltöpfen in 2.1 */
function eingabe(e: Partial<SaatEingabe> = {}): SaatEingabe {
  return {
    anlageId: ANLAGE_R,
    einstieg: 'scan',
    begonnenAm: BEGONNEN,
    saatdatum: '2027-01-07',
    zielPlatzId: platzId('2.1'),
    saetze: [
      {
        sorteId: SORTE.lollo,
        kulturform: 'kopf',
        boxPlatzId: platzId('A1'),
        zieltopfIds: toepfe('2.1.1', '2.1.2', '2.1.3'),
      },
      {
        sorteId: SORTE.eichblatt,
        kulturform: 'kopf',
        boxPlatzId: platzId('A1'),
        zieltopfIds: toepfe('2.1.4', '2.1.5', '2.1.6'),
      },
    ],
    ...e,
  } as SaatEingabe;
}

const vorgang = (t: Teile, e: SaatEingabe) => saatVorgang(t, e, neueIds(), JETZT, Z);
const pruefen = (t: Teile, e: SaatEingabe) => saatEingabePruefen(t, e, JETZT, Z);

/** Regal mit einer aktiven Reservierung auf 2.1.1 (Pflanzung des Satzes in 2.3) */
function mitReservierung(): Teile {
  const t = saatTeile(JETZT);
  reservierung(t, {
    nr: 1,
    pflanzungId: uid('28', 1),
    netztopfId: netztopfId('2.1.1'),
    vorgabe: '2027-01-20',
  });
  return t;
}

describe('Anzucht-AK2 Reservierte Zieltöpfe (R8.2)', () => {
  it('Anzucht-AK2 reservierter Zieltopf ist «reserviert» und nicht wählbar', () => {
    const t = mitReservierung();
    const zustand = (ausgewaehlt: Map<string, number>) =>
      Object.fromEntries(zieltoepfe(t, platzId('2.1'), ausgewaehlt).map((z) => [z.lochNr, z.zustand]));
    expect(zustand(new Map())).toEqual({
      1: 'reserviert',
      2: 'frei',
      3: 'frei',
      4: 'frei',
      5: 'frei',
      6: 'frei',
    });
    // auch als gewählt übergeben bleibt er reserviert
    expect(zustand(new Map([[netztopfId('2.1.1'), 1]]))[1]).toBe('reserviert');
    // belegte Löcher in 2.3 (aktive Pflanzungen auf Loch 1 bis 3), gewählte mit Marke
    const in23 = zieltoepfe(t, platzId('2.3'), new Map([[netztopfId('2.3.4'), 2]]));
    expect(in23.map((z) => [z.lochNr, z.zustand])).toEqual([
      [1, 'belegt'],
      [2, 'belegt'],
      [3, 'belegt'],
      [4, 'gewaehlt'],
      [5, 'frei'],
      [6, 'frei'],
    ]);
    expect(in23.find((z) => z.lochNr === 4)).toMatchObject({
      netztopfId: netztopfId('2.3.4'),
      kennung: '2.3.4',
      groesseMm: 80,
      marke: 2,
    });
  });

  it('Anzucht-AK2 Vorgang mit schon reserviertem Zieltopf wird abgelehnt, ohne Schritte', () => {
    const t = mitReservierung();
    expect(pruefen(t, eingabe()).length).toBeGreaterThan(0);
    expect(vorgang(t, eingabe())).toEqual([]);
    // ein belegter Topf ebenso
    const belegt = eingabe({
      zielPlatzId: platzId('2.3'),
      saetze: [
        { sorteId: SORTE.lollo, kulturform: 'kopf', boxPlatzId: platzId('A1'), zieltopfIds: toepfe('2.3.1') },
      ],
    });
    expect(pruefen(t, belegt).length).toBeGreaterThan(0);
    expect(vorgang(t, belegt)).toEqual([]);
  });

  it('Anzucht-AK2 derselbe Zieltopf für zwei Sorten im selben Vorgang wird abgelehnt', () => {
    const t = saatTeile(JETZT);
    const doppelt = eingabe({
      saetze: [
        {
          sorteId: SORTE.lollo,
          kulturform: 'kopf',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.1.1', '2.1.2'),
        },
        {
          sorteId: SORTE.eichblatt,
          kulturform: 'kopf',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.1.2', '2.1.3'),
        },
      ],
    } as Partial<SaatEingabe>);
    expect(pruefen(t, doppelt).length).toBeGreaterThan(0);
    expect(vorgang(t, doppelt)).toEqual([]);
    expect(pruefen(t, eingabe())).toEqual([]);
  });

  it('Anzucht-AK2 nach Umsetzen oder «keimt nicht» der alten Pflanzung ist der Topf wieder frei', () => {
    const t = mitReservierung();
    // Ende der Reservierung: die Zeile fällt aus v_reservierung_aktiv
    t['v_reservierung_aktiv'] = [];
    expect(zieltoepfe(t, platzId('2.1'), new Map()).find((z) => z.lochNr === 1)?.zustand).toBe('frei');
    expect(pruefen(t, eingabe())).toEqual([]);
    expect(vorgang(t, eingabe()).length).toBeGreaterThan(0);
  });
});

describe('R8.1 und R8.2 Vorgang', () => {
  it('R8.1 Vorgang in Reihenfolge pflanzvorgang, satz, pflanzung, reservierung mit id = client_id', () => {
    const v = vorgang(saatTeile(JETZT), eingabe());
    expect(vorgangPruefen(v)).toEqual([]);
    const tabellen = v.map((s) => s.tabelle);
    expect(tabellen.filter((t, i) => t !== tabellen[i - 1])).toEqual([
      'pflanzvorgang',
      'satz',
      'pflanzung',
      'reservierung',
      'satz',
      'pflanzung',
      'reservierung',
    ]);
    const gesehen = new Set<unknown>();
    for (const s of v) {
      expect(s.art).toBe('neu');
      const f = (s as Neu).felder;
      expect(f['id']).toBe(f.client_id);
      // Fremdschlüssel zeigen nur auf frühere Schritte
      if (s.tabelle === 'pflanzung') {
        expect(gesehen.has(f['satz_id'])).toBe(true);
        expect(gesehen.has(f['pflanzvorgang_id'])).toBe(true);
      }
      if (s.tabelle === 'reservierung') expect(gesehen.has(f['pflanzung_id'])).toBe(true);
      gesehen.add(f['id']);
    }
  });

  it('R8.1 zwei Sorten ergeben zwei Sätze, ein Pflanzvorgang mit Summe der Schwämme', () => {
    const v = vorgang(saatTeile(JETZT), eingabe());
    const [pv, ...mehr] = neue(v, 'pflanzvorgang');
    expect(mehr).toEqual([]);
    const saetze = neue(v, 'satz');
    expect(saetze).toHaveLength(2);
    // Lollo Rossa: p 0.9 der jüngsten Packung → 1 Samen, ⌈3 / 0.9⌉ = 4 Schwämme; Eichblatt: p 0.7 → 2 Samen, 4
    expect(saetze[0]).toMatchObject({
      sorte_id: SORTE.lollo,
      saatgut_id: PACKUNG.lollo,
      kulturform: 'kopf',
      anzuchtort_platz_id: platzId('A1'),
      samen_je_schwamm: 1,
      anzahl_schwaemme: 4,
      saatdatum: '2027-01-07',
    });
    expect(saetze[0]?.['direktsaat_platz_id'] ?? null).toBeNull();
    expect(saetze[1]).toMatchObject({
      sorte_id: SORTE.eichblatt,
      saatgut_id: PACKUNG.eichblatt,
      samen_je_schwamm: 2,
      anzahl_schwaemme: 4,
    });
    const pflanzungen = neue(v, 'pflanzung');
    expect(pflanzungen).toHaveLength(8);
    expect(pv?.['anzahl_pflanzungen']).toBe(8);
    for (const s of saetze)
      expect(pflanzungen.filter((p) => p['satz_id'] === s['id'])).toHaveLength(Number(s['anzahl_schwaemme']));
    for (const p of pflanzungen) expect(p['pflanzvorgang_id']).toBe(pv?.['id']);
    expect(Date.parse(String(pv?.['begonnen_am']))).toBe(BEGONNEN.getTime());
    expect(Date.parse(String(pv?.['gespeichert_am']))).toBe(JETZT.getTime());
  });

  it('R8.2 Reservierung an den ersten Z Pflanzungen, umsetzen_vorgabe_am = Saat + umsetzen_ab_d', () => {
    const v = vorgang(saatTeile(JETZT), eingabe());
    const [lollo] = neue(v, 'satz');
    const pflanzungen = neue(v, 'pflanzung')
      .filter((p) => p['satz_id'] === lollo?.['id'])
      .map((p) => p['id']);
    const res = neue(v, 'reservierung').filter((r) => pflanzungen.includes(r['pflanzung_id']));
    expect(res.map((r) => r['pflanzung_id'])).toEqual(pflanzungen.slice(0, 3));
    expect(res.map((r) => r['netztopf_id'])).toEqual(toepfe('2.1.1', '2.1.2', '2.1.3'));
    // Salat: Umsetzen ab 21 Tagen → 28.1.; geplant = Vorgabe
    for (const r of res)
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-28', umsetzen_geplant_am: '2027-01-28' });
    // die vierte Pflanzung bleibt Reserve ohne Reservierung
    expect(neue(v, 'reservierung')).toHaveLength(6);
  });

  it('R8.2 ohne umsetzen_ab_d keine Zieltöpfe (Ziel später)', () => {
    const t = saatTeile(JETZT);
    const mitZiel = eingabe({
      zielPlatzId: platzId('2.2'),
      saetze: [
        {
          sorteId: SORTE.mooskrause,
          kulturform: 'schnitt',
          boxPlatzId: platzId('A3'),
          zieltopfIds: toepfe('2.2.1'),
        },
      ],
    });
    expect(pruefen(t, mitZiel).length).toBeGreaterThan(0);
    expect(vorgang(t, mitZiel)).toEqual([]);
    expect(saatVorschlag(t, mitZiel, JETZT, Z).hinweise).toContain(
      'Umsetzdatum fehlt in der Wissensbasis, Ziel später',
    );
    const spaeter = eingabe({
      saetze: [
        {
          sorteId: SORTE.mooskrause,
          kulturform: 'schnitt',
          boxPlatzId: platzId('A3'),
          zieltopfIds: [],
          pflanzenOhneZiel: 1,
        },
      ],
    } as Partial<SaatEingabe>);
    delete (spaeter as { zielPlatzId?: string }).zielPlatzId;
    expect(pruefen(t, spaeter)).toEqual([]);
    const v = vorgang(t, spaeter);
    expect(neue(v, 'reservierung')).toEqual([]);
    // Petersilie: Empfehlung 15 Samen (10 Pflanzen stehen lassen) → 1 Schwamm
    expect(neue(v, 'satz')[0]).toMatchObject({ samen_je_schwamm: 15, anzahl_schwaemme: 1 });
  });

  it('R12.1 Übersteuerung: Vorschlag und Wahl getrennt gespeichert', () => {
    const t = saatTeile(JETZT);
    const e = eingabe();
    const [eins, zwei] = e.saetze;
    const geaendert = { ...e, saetze: [{ ...eins, samenJeSchwamm: 2, schwaemme: 6 }, zwei] } as SaatEingabe;
    const v = vorgang(t, geaendert);
    const [lollo, eichblatt] = neue(v, 'satz');
    expect(lollo).toMatchObject({
      samen_je_schwamm: 2,
      anzahl_schwaemme: 6,
      samen_vorschlag: 1,
      schwaemme_vorschlag: 4,
    });
    expect(neue(v, 'pflanzung').filter((p) => p['satz_id'] === lollo?.['id'])).toHaveLength(6);
    expect(eichblatt).toMatchObject({
      samen_je_schwamm: 2,
      anzahl_schwaemme: 4,
      samen_vorschlag: 2,
      schwaemme_vorschlag: 4,
    });
  });
});

describe('R1.2 und R6.1 Auswahl', () => {
  it('R1.2 Kulturform Vorgabe aus der Art, nur innerhalb erlaubt und Kulturtyp', () => {
    const art = {
      kulturformen_erlaubt: ['keimling', 'babyleaf', 'kopf', 'dauerkultur_frucht'],
      kulturform_vorgabe: 'kopf',
    };
    expect(kulturformen(art, 'blatt')).toEqual({
      erlaubt: ['keimling', 'babyleaf', 'kopf'],
      vorgabe: 'kopf',
    });
    expect(kulturformen(art, 'frucht')).toEqual({
      erlaubt: ['dauerkultur_frucht'],
      vorgabe: 'dauerkultur_frucht',
    });
    // Vorgabe ausserhalb des Kulturtyps oder leer: die erste erlaubte
    expect(kulturformen({ ...art, kulturform_vorgabe: 'keimling' }, 'knolle')).toEqual({
      erlaubt: ['babyleaf', 'kopf'],
      vorgabe: 'babyleaf',
    });
    expect(kulturformen({ ...art, kulturform_vorgabe: null }, 'blatt').vorgabe).toBe('keimling');
    // die Eingabe mit einer nicht erlaubten Kulturform wird abgelehnt
    const falsch = eingabe({
      saetze: [
        {
          sorteId: SORTE.lollo,
          kulturform: 'dauerkultur_frucht',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.1.1'),
        },
      ],
    } as Partial<SaatEingabe>);
    expect(pruefen(saatTeile(JETZT), falsch).length).toBeGreaterThan(0);
  });

  it('R6.1 Box nach Keimart: licht und indifferent A1, dunkel A3; gescannte Box mit Hinweis', () => {
    const t = saatTeile(JETZT);
    expect(boxFuer(t, ANLAGE_R, 'licht')).toMatchObject({
      platzId: platzId('A1'),
      kennung: 'A1',
      typ: 'box_licht',
    });
    expect(boxFuer(t, ANLAGE_R, 'licht').hinweis).toBeUndefined();
    expect(boxFuer(t, ANLAGE_R, 'indifferent')).toMatchObject({ kennung: 'A1', typ: 'box_licht' });
    expect(boxFuer(t, ANLAGE_R, 'dunkel')).toMatchObject({
      platzId: platzId('A3'),
      kennung: 'A3',
      typ: 'box_dunkel',
    });
    // gescannte Box gilt (A4), passt die Keimart nicht: Hinweis ohne Sperre
    expect(boxFuer(t, ANLAGE_R, 'dunkel', platzId('A1'))).toMatchObject({
      kennung: 'A1',
      hinweis: 'Dunkelkeimer: Box A3 empfohlen',
    });
    expect(boxFuer(t, ANLAGE_R, 'licht', platzId('A2'))).toMatchObject({ kennung: 'A2' });
    expect(boxFuer(t, ANLAGE_R, 'licht', platzId('A2')).hinweis).toBeUndefined();
  });

  it('UC5 Wie letztes Mal zuerst', () => {
    const t = saatTeile(JETZT);
    // älterer Satz Ochsenherz, jüngerer, aber stornierter Satz Cayenne
    const satz = (n: number, sorte: string, tag: string, storniert: string | null) => ({
      id: uid('27', n),
      client_id: uid('27', n),
      sorte_id: sorte,
      kulturform: 'dauerkultur_frucht',
      anzuchtort_platz_id: platzId('A1'),
      direktsaat_platz_id: null,
      anzahl_schwaemme: 2,
      samen_je_schwamm: 1,
      saatdatum: tag,
      gilt_ab: `${tag}T11:00:00.000Z`,
      storniert_am: storniert,
    });
    t['satz'] = [
      ...(t['satz'] ?? []),
      satz(60, SORTE.ochsenherz, '2026-11-28', null),
      satz(61, SORTE.cayenne, '2027-01-06', '2027-01-06T12:00:00.000Z'),
    ];
    const auswahl = sortenAuswahl(t);
    expect(auswahl[0]?.sorteId).toBe(SORTE.lollo);
    const rest = auswahl.slice(1).map((s) => s.name);
    expect(rest.filter((n) => n !== 'Lollo Rossa')).toEqual([
      'Cayenne',
      'Eichblatt',
      'Mooskrause',
      'Ochsenherz',
      'Rucola',
    ]);
    // ohne Satz: nur nach Name
    expect(sortenAuswahl(saatTeile(JETZT, { ohneSatzIn23: true })).map((s) => s.name)).toEqual([
      'Cayenne',
      'Eichblatt',
      'Lollo Rossa',
      'Mooskrause',
      'Ochsenherz',
      'Rucola',
    ]);
  });
});

describe('UC5 Säen', () => {
  it('UC5 Direktsaat in 3.1: direktsaat_platz_id, Vorgabe Saattag, keine Box', () => {
    const e = eingabe({
      zielPlatzId: platzId('3.1'),
      saetze: [
        { sorteId: SORTE.rucola, kulturform: 'babyleaf', zieltopfIds: toepfe('3.1.1', '3.1.2', '3.1.3') },
      ],
    } as Partial<SaatEingabe>);
    const t = saatTeile(JETZT);
    expect(pruefen(t, e)).toEqual([]);
    const v = vorgang(t, e);
    const [satz] = neue(v, 'satz');
    expect(satz).toMatchObject({ direktsaat_platz_id: platzId('3.1'), anzahl_schwaemme: 3 });
    expect(satz?.['anzuchtort_platz_id'] ?? null).toBeNull();
    expect(neue(v, 'pflanzung')).toHaveLength(3);
    const res = neue(v, 'reservierung');
    expect(res.map((r) => r['netztopf_id'])).toEqual(toepfe('3.1.1', '3.1.2', '3.1.3'));
    for (const r of res) expect(r['umsetzen_vorgabe_am']).toBe('2027-01-07');
  });

  it('UC5 Zielgefässe ohne Stationen und Boxen, Anzucht nur 80-mm-Töpfe', () => {
    const t = saatTeile(JETZT);
    const ziele = zielgefaesse(t, ANLAGE_R);
    expect(ziele.map((z) => z.kennung)).toEqual(['1.1', '1.2', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3']);
    expect(ziele.filter((z) => z.direktsaat).map((z) => z.kennung)).toEqual(['3.1', '3.2', '3.3']);
    const z21 = ziele.find((z) => z.kennung === '2.1');
    expect(z21).toMatchObject({ platzId: platzId('2.1'), code: 'R-2.1', reihen: [3, 3] }); // D2 «3, 3» (#136)
    expect(z21?.hinweis).toBeUndefined();
    // ruht und in Prüfung: mit Hinweis, trotzdem wählbar
    expect(ziele.find((z) => z.kennung === '1.2')?.hinweis).toBeTruthy();
    expect(ziele.find((z) => z.kennung === '3.3')?.hinweis).toBeTruthy();
    // Anzucht in der Box mit 5-cm-Topf (Kratky 3.1) oder Stationstopf: abgelehnt
    for (const kennung of ['3.1.1', '4.1.1']) {
      const e = eingabe({
        saetze: [
          {
            sorteId: SORTE.lollo,
            kulturform: 'kopf',
            boxPlatzId: platzId('A1'),
            zieltopfIds: toepfe(kennung),
          },
        ],
      });
      expect(pruefen(t, e).length, kennung).toBeGreaterThan(0);
    }
  });

  it('UC5 Einstieg scan, gefaess, heute; früheres Saatdatum ergibt nacherfassung mit gilt_ab 12:00 Zürich', () => {
    const t = saatTeile(JETZT);
    for (const einstieg of ['scan', 'gefaess', 'heute'] as const) {
      const v = vorgang(t, eingabe({ einstieg }));
      expect(neue(v, 'pflanzvorgang')[0]?.['einstieg']).toBe(einstieg);
      expect(Date.parse(String(neue(v, 'satz')[0]?.['gilt_ab']))).toBe(JETZT.getTime());
    }
    const v = vorgang(t, eingabe({ saatdatum: '2027-01-05' }));
    expect(neue(v, 'pflanzvorgang')[0]?.['einstieg']).toBe('nacherfassung');
    for (const s of neue(v, 'satz')) {
      expect(s['saatdatum']).toBe('2027-01-05');
      // 5.1. 12:00 Zürich (Winterzeit) = 11:00 UTC
      expect(Date.parse(String(s['gilt_ab']))).toBe(Date.parse('2027-01-05T11:00:00Z'));
    }
    for (const r of neue(v, 'reservierung')) expect(r['umsetzen_vorgabe_am']).toBe('2027-01-26');
  });

  it('UC5 Saatdatum in der Zukunft oder vor 30 Tagen abgelehnt', () => {
    const t = saatTeile(JETZT);
    for (const saatdatum of ['2027-01-08', '2026-12-07']) {
      expect(pruefen(t, eingabe({ saatdatum })).length, saatdatum).toBeGreaterThan(0);
      expect(vorgang(t, eingabe({ saatdatum })), saatdatum).toEqual([]);
    }
    expect(pruefen(t, eingabe({ saatdatum: '2026-12-08' }))).toEqual([]);
    expect(pruefen(t, eingabe({ saatdatum: '2027-01-07' }))).toEqual([]);
  });

  it('UC5 Rückgängig storniert alle Zeilen in umgekehrter Reihenfolge', () => {
    const v = vorgang(saatTeile(JETZT), eingabe());
    const r = saatRueckgaengig(v);
    expect(r).toHaveLength(v.length);
    expect(r.map((s) => s.art)).toEqual(v.map(() => 'storno'));
    expect(r.map((s) => (s.art === 'storno' ? s.grund : undefined))).toEqual(v.map(() => 'rueckgaengig'));
    expect(r.map((s) => s.tabelle)).toEqual([...v.map((s) => s.tabelle)].reverse());
    expect(r.map((s) => (s.art === 'storno' ? s.clientId : undefined))).toEqual(
      neue(v)
        .map((f) => f.client_id)
        .reverse(),
    );
  });

  it('TO2 gleiche Eingabe und IDs ergeben gleiche Schritte', () => {
    const t = saatTeile(JETZT);
    const eins = vorgang(t, eingabe());
    const zwei = vorgang(t, eingabe());
    expect(eins.length).toBeGreaterThan(0);
    expect(zwei).toEqual(eins);
    // alle client_id verschieden
    const ids = neue(eins).map((f) => f.client_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('UC5 Nebenknopf «Säen» in der Maske Gefäss für Anzuchtboxen und Gefässe ohne feste Dosis', () => {
    const t = saatTeile(JETZT);
    const knoepfe = (code: string) =>
      (gefaessAnsicht(t, code, JETZT, Z) as { nebenknoepfe?: { art: string; text: string }[] } | undefined)
        ?.nebenknoepfe ?? [];
    expect(knoepfe('R-A1')).toContainEqual({ art: 'saeen', text: 'Säen' });
    expect(knoepfe('R-2.1')).toContainEqual({ art: 'saeen', text: 'Säen' });
    expect(knoepfe('R-4.4').map((k) => k.art)).not.toContain('saeen');
  });
});

describe('R12.2 Rückfall der Keimrate (Prüfer Runde 1)', () => {
  /** Eichblatt allein, 3 Zieltöpfe in 2.1, ohne Packung */
  function ohnePackung(): { t: Teile; e: SaatEingabe } {
    const t = saatTeile(JETZT);
    t['saatgut'] = (t['saatgut'] ?? []).filter((z) => z['id'] !== PACKUNG.eichblatt);
    t['v_keimrate'] = (t['v_keimrate'] ?? []).filter((z) => z['saatgut_id'] !== PACKUNG.eichblatt);
    const e = eingabe({
      saetze: [
        {
          sorteId: SORTE.eichblatt,
          kulturform: 'kopf',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.1.1', '2.1.2', '2.1.3'),
        },
      ],
    });
    return { t, e };
  }

  it('R12.2 ohne Packung gilt die Keimfähigkeit der Art', () => {
    const { t, e } = ohnePackung();
    const [satz] = saatVorschlag(t, e, JETZT, Z).saetze;
    // Salat standard_keimfaehigkeit 0.8 (begrenzt 0.3 bis 0.98)
    expect(satz?.keimrate).toEqual({ p: 0.8, herkunft: 'art' });
    // s = ⌈ln 0.1 / ln 0.2⌉ = ⌈1.43⌉ = 2, q = 0.96, m = ⌈3 / 0.96⌉ = 4
    expect(satz?.vorschlag.samenJeSchwamm).toBe(2);
    expect(satz?.vorschlag.schwammKeimrate).toBeCloseTo(0.96, 6);
    expect(satz?.vorschlag.schwaemme).toBe(4);
    const [zeile] = neue(vorgang(t, e), 'satz');
    expect(zeile).toMatchObject({ sorte_id: SORTE.eichblatt, samen_je_schwamm: 2, anzahl_schwaemme: 4 });
    expect(zeile?.['saatgut_id'] ?? null).toBeNull();
  });

  it('R12.2 ohne Packung und ohne Keimfähigkeit der Art: Keimrate unbekannt', () => {
    const { t, e } = ohnePackung();
    t['art'] = (t['art'] ?? []).map((a) =>
      a['art_id'] === 'lactuca_sativa' ? { ...a, standard_keimfaehigkeit: null } : a,
    );
    const v = saatVorschlag(t, e, JETZT, Z);
    expect(v.saetze[0]?.keimrate).toBeUndefined();
    expect(v.hinweise).toContain('Eichblatt: Keimrate unbekannt');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Issue #278, Plan 278: Umsetzdatum beim Säen wählen (R5.3, R6.1, R6.2, R8.2, R11.2, G2, TO2). Vertrag laut Plan 278
// «Schnittstellen»:
//   umsetzFenster(saatdatum, umsetzenAbD?, umsetzenBisD?): { vorschlag; letzter; grenze? } | undefined
//     mit bis: grenze = Saat + bis + 7, letzter = max(vorschlag, grenze − 1); ohne bis: letzter = vorschlag + 14
//   umsetzFensterSorte(teile, sorteId, saatdatum): Fenster aus der gültigen Art der Sorte
//   UMSETZ_FENSTER_OHNE_BIS = 14
//   SatzEingabe.umsetzenGeplantAm?; SatzVorschlag.umsetzen?: Fenster & { gewaehlt }; umsetzenAm = geplanter Tag
//   saatEingabePruefen: Feld 'umsetzen', «<Sorte>: Umsetzdatum hier nicht wählbar» bzw.
//     «<Sorte>: Umsetzen am T.M. liegt ausserhalb T.M. bis T.M.»
//   saatVorgang: je Satz satz, (bei Wahl ungleich Vorschlag) ereignis umsetzdatum_geaendert am Satz
//     { von: Vorschlag, nach: Wahl, grund: 'saeen' } mit gilt_ab des Satzes, pflanzung × m, reservierung × Z mit
//     umsetzen_vorgabe_am = Vorschlag und umsetzen_geplant_am = Wahl.
// Fixture-Werte (tests/fixtures/saeen.ts): Salat umsetzen_ab_d 21, umsetzen_bis_d 28 → Saat 7.1.: Vorschlag 28.1.,
// letzter Tag 10.2., Grenze 11.2.; Petersilie ohne umsetzen_ab_d. Die W0-Beispiele aus dem Issue über Zahlen.

/** ein Satz Lollo Rossa in A1 mit Zieltöpfen in 2.3 (Loch 4 bis 6 frei), optional mit gewähltem Umsetztag */
function lolloIn23(umsetzenGeplantAm?: string, e: Partial<SaatEingabe> = {}): SaatEingabe {
  return eingabe({
    zielPlatzId: platzId('2.3'),
    saetze: [
      {
        sorteId: SORTE.lollo,
        kulturform: 'kopf',
        boxPlatzId: platzId('A1'),
        zieltopfIds: toepfe('2.3.4', '2.3.5', '2.3.6'),
        ...(umsetzenGeplantAm !== undefined ? { umsetzenGeplantAm } : {}),
      },
    ],
    ...e,
  } as Partial<SaatEingabe>);
}

/** Satz «Ziel später» ohne Zielgefäss */
function ohneZiel(satz: Record<string, unknown>): SaatEingabe {
  const e = eingabe({
    saetze: [{ zieltopfIds: [], pflanzenOhneZiel: 1, ...satz }],
  } as unknown as Partial<SaatEingabe>);
  delete (e as { zielPlatzId?: string }).zielPlatzId;
  return e;
}

const tabellenFolge = (v: Vorgang) => {
  const t = v.map((s) => s.tabelle);
  return t.filter((x, i) => x !== t[i - 1]);
};

describe('UC5-AK17 Umsetzfenster beim Säen (R6.2, R8.2)', () => {
  it('UC5-AK17 Fenster Tomate 7.1.: Vorschlag 17.1., letzter 29.1., Grenze 30.1.', () => {
    // W0: Tomate umsetzen_ab_d 10, umsetzen_bis_d 16 → Grenze 7.1. + 16 + 7 = 30.1., letzter Tag 29.1.
    expect(umsetzFenster('2027-01-07', 10, 16)).toEqual({
      vorschlag: '2027-01-17',
      letzter: '2027-01-29',
      grenze: '2027-01-30',
    });
  });

  it('UC5-AK17 Fenster Petersilie 7.1.: 28.1. bis 17.2.', () => {
    // Abweichung B: Petersilie ab 21, bis 35 → Grenze 18.2., spätestens 17.2.
    expect(umsetzFenster('2027-01-07', 21, 35)).toEqual({
      vorschlag: '2027-01-28',
      letzter: '2027-02-17',
      grenze: '2027-02-18',
    });
  });

  it('UC5-AK17 ohne umsetzen_bis_d: Vorschlag + 14, keine Grenze', () => {
    expect(UMSETZ_FENSTER_OHNE_BIS).toBe(14);
    // Basilikum 4.2. + 14 = 18.2.; letzter 18.2. + 14 = 4.3. (A4)
    const f = umsetzFenster('2027-02-04', 14, undefined);
    expect(f).toEqual({ vorschlag: '2027-02-18', letzter: '2027-03-04' });
    expect(f !== undefined && 'grenze' in f).toBe(false);
    // ohne umsetzen_ab_d kein Fenster
    expect(umsetzFenster('2027-01-07', undefined, 35)).toBeUndefined();
    expect(umsetzFenster('2027-01-07', undefined, undefined)).toBeUndefined();
    // A3: bis kleiner als ab ergibt ein Fenster aus einem Tag
    expect(umsetzFenster('2027-01-07', 21, 10)).toMatchObject({
      vorschlag: '2027-01-28',
      letzter: '2027-01-28',
    });
  });

  it('UC5-AK17 TZ Fenster über die Sommerzeit (28.3.2027) zählt ganze Kalendertage', () => {
    expect(umsetzFenster('2027-03-18', 12, 18)).toEqual({
      vorschlag: '2027-03-30',
      letzter: '2027-04-11',
      grenze: '2027-04-12',
    });
  });

  it('UC5-AK17 umsetzFensterSorte liest umsetzen_ab_d und umsetzen_bis_d der Art der Sorte', () => {
    const t = saatTeile(JETZT);
    expect(umsetzFensterSorte(t, SORTE.lollo, '2027-01-07')).toEqual({
      vorschlag: '2027-01-28',
      letzter: '2027-02-10',
      grenze: '2027-02-11',
    });
    expect(umsetzFensterSorte(t, SORTE.mooskrause, '2027-01-07')).toBeUndefined();
  });

  it('UC5-AK17 Satzvorschlag nennt Vorschlag, letzten und gewählten Tag, ohne Wahl gewählt = Vorschlag', () => {
    const t = saatTeile(JETZT);
    const [ohne] = saatVorschlag(t, lolloIn23(), JETZT, Z).saetze;
    expect(ohne?.umsetzen).toEqual({
      vorschlag: '2027-01-28',
      letzter: '2027-02-10',
      grenze: '2027-02-11',
      gewaehlt: '2027-01-28',
    });
    expect(ohne?.umsetzenAm).toBe('2027-01-28');
    const [mit] = saatVorschlag(t, lolloIn23('2027-02-03'), JETZT, Z).saetze;
    expect(mit?.umsetzen).toEqual({
      vorschlag: '2027-01-28',
      letzter: '2027-02-10',
      grenze: '2027-02-11',
      gewaehlt: '2027-02-03',
    });
    expect(mit?.umsetzenAm).toBe('2027-02-03');
  });

  it('UC5-AK17 keine Wahl bei Direktsaat, Ziel später und ohne umsetzen_ab_d', () => {
    const t = saatTeile(JETZT);
    // Direktsaat Rucola in 3.1: umsetzenAm = Saattag, kein Fenster
    const direkt = eingabe({
      zielPlatzId: platzId('3.1'),
      saetze: [{ sorteId: SORTE.rucola, kulturform: 'babyleaf', zieltopfIds: toepfe('3.1.1') }],
    } as Partial<SaatEingabe>);
    const [d] = saatVorschlag(t, direkt, JETZT, Z).saetze;
    expect(d?.direktsaat).toBe(true);
    expect(d?.umsetzen).toBeUndefined();
    expect(d?.umsetzenAm).toBe('2027-01-07');
    // Ziel später (keine Zieltöpfe): kein Fenster, umsetzenAm bleibt der Vorschlag für die Zeile «Umsetzen ab»
    const spaeter = ohneZiel({ sorteId: SORTE.lollo, kulturform: 'kopf', boxPlatzId: platzId('A1') });
    const [s] = saatVorschlag(t, spaeter, JETZT, Z).saetze;
    expect(s?.umsetzen).toBeUndefined();
    expect(s?.umsetzenAm).toBe('2027-01-28');
    // Petersilie ohne umsetzen_ab_d
    const peter = ohneZiel({ sorteId: SORTE.mooskrause, kulturform: 'schnitt', boxPlatzId: platzId('A3') });
    const [p] = saatVorschlag(t, peter, JETZT, Z).saetze;
    expect(p?.umsetzen).toBeUndefined();
    expect(p?.umsetzenAm).toBeUndefined();
  });
});

describe('UC5-AK17 ungültige Wahl (Plan 278 Runde 1 Befund 4)', () => {
  it('UC5-AK17 ungültige Wahl: umsetzen.gewaehlt = Vorschlag', () => {
    const t = saatTeile(JETZT);
    for (const tag of ['2027-01-27', '2027-02-11', '3.2.2027']) {
      const [s] = saatVorschlag(t, lolloIn23(tag), JETZT, Z).saetze;
      expect(s?.umsetzen, tag).toEqual({
        vorschlag: '2027-01-28',
        letzter: '2027-02-10',
        grenze: '2027-02-11',
        gewaehlt: '2027-01-28',
      });
      expect(s?.umsetzenAm, tag).toBe('2027-01-28');
    }
  });
});

describe('UC5-AK18 Gewählter Umsetztag in Prüfung und Vorgang (R5.3, R6.1, R8.2, R11.2)', () => {
  it('UC5-AK18 Wahl vor dem Vorschlag, nach dem letzten Tag oder ohne Wahlmöglichkeit abgelehnt', () => {
    const t = saatTeile(JETZT);
    const umsetzen = (e: SaatEingabe) => pruefen(t, e).filter((v) => v.feld === 'umsetzen');
    expect(umsetzen(lolloIn23('2027-01-27'))).toEqual([
      { feld: 'umsetzen', grund: 'Lollo Rossa: Umsetzen am 27.1. liegt ausserhalb 28.1. bis 10.2.' },
    ]);
    expect(umsetzen(lolloIn23('2027-02-11'))).toEqual([
      { feld: 'umsetzen', grund: 'Lollo Rossa: Umsetzen am 11.2. liegt ausserhalb 28.1. bis 10.2.' },
    ]);
    expect(umsetzen(lolloIn23('3.2.2027'))).toHaveLength(1);
    for (const tag of ['2027-01-27', '2027-02-11', '3.2.2027'])
      expect(vorgang(t, lolloIn23(tag)), tag).toEqual([]);
    // die Ränder des Fensters sind gültig
    expect(pruefen(t, lolloIn23('2027-01-28'))).toEqual([]);
    expect(pruefen(t, lolloIn23('2027-02-10'))).toEqual([]);

    // Direktsaat: keine Wahl
    const direkt = eingabe({
      zielPlatzId: platzId('3.1'),
      saetze: [
        {
          sorteId: SORTE.rucola,
          kulturform: 'babyleaf',
          zieltopfIds: toepfe('3.1.1'),
          umsetzenGeplantAm: '2027-01-10',
        },
      ],
    } as Partial<SaatEingabe>);
    expect(umsetzen(direkt)).toEqual([{ feld: 'umsetzen', grund: 'Rucola: Umsetzdatum hier nicht wählbar' }]);
    expect(vorgang(t, direkt)).toEqual([]);
    // Ziel später: keine Wahl
    const spaeter = ohneZiel({
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      boxPlatzId: platzId('A1'),
      umsetzenGeplantAm: '2027-02-01',
    });
    expect(umsetzen(spaeter)).toEqual([
      { feld: 'umsetzen', grund: 'Lollo Rossa: Umsetzdatum hier nicht wählbar' },
    ]);
    expect(vorgang(t, spaeter)).toEqual([]);
    // Art ohne umsetzen_ab_d (Petersilie, Ziel später): keine Wahl
    const peter = ohneZiel({
      sorteId: SORTE.mooskrause,
      kulturform: 'schnitt',
      boxPlatzId: platzId('A3'),
      umsetzenGeplantAm: '2027-02-01',
    });
    expect(umsetzen(peter)).toEqual([
      { feld: 'umsetzen', grund: 'Mooskrause: Umsetzdatum hier nicht wählbar' },
    ]);
  });

  it('UC5-AK18 Vorgang mit Wahl: Vorgabe = Vorschlag, Ereignis am Satz {von, nach, grund: saeen} nach dem Satz und vor den Reservierungen', () => {
    const t = saatTeile(JETZT);
    const e = lolloIn23('2027-02-03');
    expect(pruefen(t, e)).toEqual([]);
    const v = vorgang(t, e);
    expect(tabellenFolge(v)).toEqual(['pflanzvorgang', 'satz', 'ereignis', 'pflanzung', 'reservierung']);
    const [satz] = neue(v, 'satz');
    const ereignisse = neue(v, 'ereignis');
    expect(ereignisse).toHaveLength(1);
    const [ev] = ereignisse;
    expect(ev).toMatchObject({
      typ: 'umsetzdatum_geaendert',
      satz_id: satz?.['id'],
      gilt_ab: satz?.['gilt_ab'],
    });
    expect(ev?.['id']).toBe(ev?.client_id);
    expect(ev?.['pflanzung_id'] ?? null).toBeNull();
    expect(ev?.['daten']).toEqual({ von: '2027-01-28', nach: '2027-02-03', grund: 'saeen' });
    // Position: direkt nach dem Satz, vor der ersten Pflanzung und Reservierung (Risiko 1)
    const index = (tabelle: string) => v.findIndex((s) => s.tabelle === tabelle);
    expect(index('ereignis')).toBe(index('satz') + 1);
    expect(index('ereignis')).toBeLessThan(index('reservierung'));
    const res = neue(v, 'reservierung');
    expect(res).toHaveLength(3);
    for (const r of res)
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-28', umsetzen_geplant_am: '2027-02-03' });
  });

  it('UC5-AK18 zwei Sorten, nur eine mit Wahl: Ereignis nur am Satz mit Wahl', () => {
    const t = saatTeile(JETZT);
    const e = eingabe({
      zielPlatzId: platzId('2.3'),
      saetze: [
        {
          sorteId: SORTE.lollo,
          kulturform: 'kopf',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.3.4', '2.3.5'),
          umsetzenGeplantAm: '2027-02-01',
        },
        {
          sorteId: SORTE.eichblatt,
          kulturform: 'kopf',
          boxPlatzId: platzId('A1'),
          zieltopfIds: toepfe('2.3.6'),
        },
      ],
    } as Partial<SaatEingabe>);
    const v = vorgang(t, e);
    expect(tabellenFolge(v)).toEqual([
      'pflanzvorgang',
      'satz',
      'ereignis',
      'pflanzung',
      'reservierung',
      'satz',
      'pflanzung',
      'reservierung',
    ]);
    const [lollo, eichblatt] = neue(v, 'satz');
    expect(neue(v, 'ereignis').map((x) => x['satz_id'])).toEqual([lollo?.['id']]);
    const resVon = (satz: Record<string, unknown> | undefined) => {
      const p = neue(v, 'pflanzung')
        .filter((x) => x['satz_id'] === satz?.['id'])
        .map((x) => x['id']);
      return neue(v, 'reservierung').filter((r) => p.includes(r['pflanzung_id']));
    };
    expect(resVon(lollo)).toHaveLength(2);
    for (const r of resVon(lollo))
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-28', umsetzen_geplant_am: '2027-02-01' });
    expect(resVon(eichblatt)).toHaveLength(1);
    for (const r of resVon(eichblatt))
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-28', umsetzen_geplant_am: '2027-01-28' });
  });

  it('UC5-AK18 Ereignis besteht vorgangPruefen() und ereignisDatenPruefen() nimmt grund saeen an', () => {
    const v = vorgang(saatTeile(JETZT), lolloIn23('2027-02-03'));
    expect(neue(v, 'ereignis')).toHaveLength(1);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(
      ereignisDatenPruefen('umsetzdatum_geaendert', {
        von: '2027-01-28',
        nach: '2027-02-03',
        grund: 'saeen',
      }),
    ).toEqual([]);
    // die übrigen Gründe bleiben, ein unbekannter ist weiterhin ein Verstoss
    for (const grund of ['morgen', 'in_station_lassen', 'ziel_spaeter'])
      expect(
        ereignisDatenPruefen('umsetzdatum_geaendert', { von: '2027-01-28', nach: '2027-01-29', grund }),
        grund,
      ).toEqual([]);
    expect(
      ereignisDatenPruefen('umsetzdatum_geaendert', { von: '2027-01-28', nach: '2027-02-03', grund: 'xyz' })
        .length,
    ).toBeGreaterThan(0);
  });

  it('UC5-AK18 ohne Wahl und mit Wahl = Vorschlag kein Ereignis (Vorgang wie bisher)', () => {
    const t = saatTeile(JETZT);
    const ohne = vorgang(t, lolloIn23());
    const gleich = vorgang(t, lolloIn23('2027-01-28'));
    expect(ohne.length).toBeGreaterThan(0);
    expect(neue(ohne, 'ereignis')).toEqual([]);
    expect(gleich).toEqual(ohne);
    expect(tabellenFolge(ohne)).toEqual(['pflanzvorgang', 'satz', 'pflanzung', 'reservierung']);
    for (const r of neue(gleich, 'reservierung'))
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-28', umsetzen_geplant_am: '2027-01-28' });
  });

  it('UC5-AK18 Rückgängig storniert auch das Ereignis', () => {
    const v = vorgang(saatTeile(JETZT), lolloIn23('2027-02-03'));
    const [ev] = neue(v, 'ereignis');
    expect(ev).toBeDefined();
    const r = saatRueckgaengig(v);
    expect(r).toHaveLength(v.length);
    expect(r.map((s) => s.tabelle)).toEqual([...v.map((s) => s.tabelle)].reverse());
    const i = r.findIndex((s) => s.tabelle === 'ereignis');
    expect(r[i]).toEqual({
      art: 'storno',
      tabelle: 'ereignis',
      clientId: ev?.client_id,
      grund: 'rueckgaengig',
    });
    // nach den Reservierungen und Pflanzungen, direkt vor dem Satz
    expect(r.slice(0, i).map((s) => s.tabelle)).not.toContain('satz');
    expect(r[i + 1]?.tabelle).toBe('satz');
  });

  it('UC5-AK18 Zieltöpfe am gewählten Tag (Nachfolge-Topf frei)', () => {
    // Satz in 2.3 (Lollo Rossa kopf, gesät 8.12.2026, Loch 1 bis 3) mit einmaliger Ernte 33 Tage nach dem Umsetzen
    // (lokale Zeile art_kulturform): 8.12. + 21 = 29.12., + 33 = 31.1. → am Vorschlag 28.1. belegt, an der Wahl 3.2.
    // frei als Nachfolge (R11.2)
    const t = saatTeile(JETZT);
    t['art_kulturform'] = [
      {
        id: uid('37', 1),
        art_id: 'lactuca_sativa',
        kulturform: 'kopf',
        ernteart: 'einmalig',
        ernte_ab_d: 33,
        kulturdauer_max_d: null,
        kulturdauer_typisch_d: null,
        gueltig_bis: null,
      },
    ];
    expect(zieltoepfe(t, platzId('2.3'), new Map(), '2027-02-03').find((z) => z.lochNr === 1)).toMatchObject({
      zustand: 'frei',
      belegtBis: '2027-01-31',
    });
    const mitTopf = (tag?: string) =>
      eingabe({
        zielPlatzId: platzId('2.3'),
        saetze: [
          {
            sorteId: SORTE.eichblatt,
            kulturform: 'kopf',
            boxPlatzId: platzId('A1'),
            zieltopfIds: toepfe('2.3.1'),
            ...(tag ? { umsetzenGeplantAm: tag } : {}),
          },
        ],
      } as Partial<SaatEingabe>);
    expect(pruefen(t, mitTopf())).toContainEqual({ feld: 'ziel', grund: 'Topf 2.3.1 ist belegt' });
    expect(vorgang(t, mitTopf())).toEqual([]);
    expect(pruefen(t, mitTopf('2027-02-03'))).toEqual([]);
    const v = vorgang(t, mitTopf('2027-02-03'));
    expect(neue(v, 'reservierung').map((r) => r['netztopf_id'])).toEqual(toepfe('2.3.1'));
  });

  it('UC5-AK18 Stationsvorschau bis zum gewählten Tag', () => {
    // Lollo Rossa (keimt 11.1., 4 Schwämme, 3 Zieltöpfe → 4 Plätze 5 cm) mit Mooskrause (keimt 7.1. + 21 = 28.1.,
    // Ziel später): am 28.1. belegt Lollo Rossa die Station nur, wenn der gewählte Tag nach dem 28.1. liegt
    const t = saatTeile(JETZT);
    const mit = (tag?: string) => {
      const e = lolloIn23(tag);
      return {
        ...e,
        saetze: [
          ...e.saetze,
          {
            sorteId: SORTE.mooskrause,
            kulturform: 'schnitt',
            boxPlatzId: platzId('A3'),
            zieltopfIds: [],
            pflanzenOhneZiel: 1,
          },
        ],
      } as SaatEingabe;
    };
    const frei = (e: SaatEingabe, tag: string) =>
      saatVorschlag(t, e, JETZT, Z).vorschau.zeilen.find((z) => z.tag === tag)?.frei50;
    const ohne = frei(mit(), '2027-01-28');
    const gewaehlt = frei(mit('2027-02-03'), '2027-01-28');
    expect(ohne).toBeDefined();
    expect(gewaehlt).toBeDefined();
    expect((ohne ?? 0) - (gewaehlt ?? 0)).toBe(4);
    // am Keimtag 11.1. gleich (Lollo Rossa belegt dort in beiden Fällen)
    expect(frei(mit('2027-02-03'), '2027-01-11')).toBe(frei(mit(), '2027-01-11'));
  });

  it('UC5-AK18 TO2 gleiche Eingabe mit Wahl und gleiche IDs ergeben gleiche Schritte', () => {
    const t = saatTeile(JETZT);
    const eins = vorgang(t, lolloIn23('2027-02-03'));
    const zwei = vorgang(t, lolloIn23('2027-02-03'));
    expect(neue(eins, 'ereignis')).toHaveLength(1);
    expect(zwei).toEqual(eins);
    const ids = neue(eins).map((f) => f.client_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('UC5-AK18 Nacherfassung: Ereignis mit gilt_ab 12:00 Zürich am Saattag wie der Satz (R1.6)', () => {
    // Saat 20.12.2026: Vorschlag 20.12. + 21 = 10.1., letzter Tag 20.12. + 28 + 6 = 23.1.; Wahl 15.1.
    const t = saatTeile(JETZT);
    const e = lolloIn23('2027-01-15', { saatdatum: '2026-12-20' });
    expect(pruefen(t, e)).toEqual([]);
    const v = vorgang(t, e);
    const [satz] = neue(v, 'satz');
    const [ev] = neue(v, 'ereignis');
    expect(Date.parse(String(satz?.['gilt_ab']))).toBe(Date.parse('2026-12-20T11:00:00Z'));
    expect(ev?.['gilt_ab']).toBe(satz?.['gilt_ab']);
    expect(ev?.['daten']).toEqual({ von: '2027-01-10', nach: '2027-01-15', grund: 'saeen' });
    for (const r of neue(v, 'reservierung'))
      expect(r).toMatchObject({ umsetzen_vorgabe_am: '2027-01-10', umsetzen_geplant_am: '2027-01-15' });
  });
});
