// Zielliste in Säen Schritt 2: Urteil der Passung je Zielgefäss, freie Löcher, Ordnung und Vorwahl (Plan 228 Testliste;
// UX6-AK1; Konzept R3.1, R3.2, R11.2, 5.8; G1, G2). Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone
// Europe/Zurich; Teile aus tests/fixtures/passung.ts (Anlage R, 2.3 mit 3 Lollo Rossa stehend und 3 Eichblatt
// reserviert, übrige Gefässe leer und in Betrieb).
//
// Vertrag (Plan 228 «Zielliste»):
//   interface ZielUrteil { ziel: Zielgefaess; einstufung?: Einstufung; wort: string; freieLoecher: number;
//                          freiText: string; sorten: SortePassung[] }
//   zielliste(teile, ziele, sorten (mit kulturform), saatdatum, jetzt, zeitzone): ZielUrteil[]
//     je Ziel sortenPassung(teile, sorten, ziel.platzId, saatdatum, jetzt, zeitzone); Urteil = schlechtestes der
//     Sorten (A2); ohne Sorte keine einstufung, wort «ohne Urteil» (A3); geordnet empfohlen, moeglich,
//     nicht_empfohlen, ohne Urteil, bei Gleichstand stabil in der Reihenfolge von zielgefaesse() (A4); freie Löcher wie
//     «Alle freien wählen» am Umsetzdatum der ersten Sorte (Anzucht nur 8 cm, Direktsaat jede Grösse, Nachfolge frei;
//     A5).
//   zielVorwahl(liste): platzId des ersten empfohlenen Ziels ohne Hinweis und mit freiem Loch, sonst undefined (A6).
//
// Werte aus dem Fixture (am 18.1.2027 gerechnet, Saatdatum 18.1.): Lollo Rossa (Kopf) überall Empfohlen ausser 2.3
// (Nicht empfohlen, P2 P3); Ochsenherz überall Nicht empfohlen (P1 bzw. P5). Mit Genoveser stehend in 2.1.3: Matador in
// 2.1 Möglich (P7), Lollo Rossa in 2.1 Nicht empfohlen (P2), Genoveser in 2.1 Empfohlen. Freie Löcher bei Anzucht:
// 1.1 und 1.2 je 4, 2.1 6, 2.2 2, 2.3 0; Kratky 3.1 8, 3.2 6, 3.3 8 (Direktsaat, 5 cm).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sortenPassung, type SortePassung } from '../../src/domain/passung/kontext.ts';
import { EINSTUFUNG_NAME } from '../../src/domain/passung/passung.ts';
import {
  sortenAuswahl,
  zielgefaesse,
  type Kulturform,
  type SorteWahl,
} from '../../src/domain/pflanzung/saeen.ts';
import { zielliste, zielVorwahl, type ZielUrteil } from '../../src/domain/pflanzung/zielliste.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ANLAGE_R, gefaessId, type Teile } from '../fixtures/regal.ts';
import {
  ART,
  messungDazu,
  passungTeile,
  platzId,
  satzDazu,
  SORTE,
  stammSetzen,
  ZB_JETZT,
  type PassungSorte,
} from '../fixtures/passung.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const HEUTE = '2027-01-18';

type Wahl = SorteWahl & { kulturform: Kulturform };

/** gewählte Sorten in ihrer Vorgabe-Kulturform (wie Säen Schritt 1) */
function wahl(t: Teile, ...namen: PassungSorte[]): Wahl[] {
  const alle = sortenAuswahl(t);
  return namen.map((n) => {
    const s = alle.find((x) => x.sorteId === SORTE[n]);
    if (!s) throw new Error(`Sorte ${n} fehlt`);
    return { ...s, kulturform: s.vorgabe };
  });
}

function liste(t: Teile, sorten: Wahl[], saatdatum = HEUTE, jetzt = J): ZielUrteil[] {
  return zielliste(t, zielgefaesse(t, ANLAGE_R), sorten, saatdatum, jetzt, Z);
}

const kennungen = (l: readonly ZielUrteil[]) => l.map((z) => z.ziel.kennung);
const urteil = (l: readonly ZielUrteil[], kennung: string) => {
  const z = l.find((x) => x.ziel.kennung === kennung);
  if (!z) throw new Error(`Ziel ${kennung} fehlt`);
  return z;
};

/** Genoveser stehend in 2.1.3: macht 2.1 für Matador Möglich und für Lollo Rossa Nicht empfohlen */
function mitGenoveserIn21(): Teile {
  const t = passungTeile();
  satzDazu(t, {
    nr: 40,
    sorte: 'genoveser',
    kulturform: 'dauerkultur_blatt',
    saatdatum: '2027-01-05',
    phase: 'anzucht',
    anzahl: 1,
    stehend: { toepfe: ['2.1.3'] },
  });
  return t;
}

function topfGroesse(t: Teile, kennungen: string[], mm: number): Teile {
  for (const n of t['netztopf'] ?? []) if (kennungen.includes(String(n['kennung']))) n['groesse_mm'] = mm;
  return t;
}

function gefaessRuht(t: Teile, kennung: string): Teile {
  for (const g of t['v_gefaess_status'] ?? [])
    if (g['gefaess_id'] === gefaessId(kennung)) g['status'] = 'ruht';
  return t;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('UX6-AK1 Zielliste', () => {
  it('UX6-AK1 ordnet die Ziele Empfohlen vor Möglich vor Nicht empfohlen', () => {
    const t = mitGenoveserIn21();
    const l = liste(t, wahl(t, 'matador'));
    expect(kennungen(l)).toEqual(['1.1', '1.2', '2.2', '3.1', '3.2', '3.3', '2.1', '2.3']);
    expect(l.map((z) => z.einstufung)).toEqual([
      'empfohlen',
      'empfohlen',
      'empfohlen',
      'empfohlen',
      'empfohlen',
      'empfohlen',
      'moeglich',
      'nicht_empfohlen',
    ]);
    // Lollo Rossa: 2.1 und 2.3 Nicht empfohlen stehen hinten, untereinander nach Kennung
    expect(kennungen(liste(t, wahl(t, 'lollo'))).slice(-2)).toEqual(['2.1', '2.3']);
  });

  it('UX6-AK1 Urteil je Ziel gleich der Einstufung aus sortenPassung für dasselbe Ziel (Passung unverändert)', () => {
    const t = mitGenoveserIn21();
    for (const namen of [
      ['lollo'],
      ['matador'],
      ['ochsenherz'],
      ['genoveser', 'matador'],
    ] as PassungSorte[][]) {
      const sorten = wahl(t, ...namen);
      const l = liste(t, sorten);
      expect(l).toHaveLength(zielgefaesse(t, ANLAGE_R).length);
      for (const z of l) {
        const direkt = sortenPassung(t, sorten, z.ziel.platzId, HEUTE, J, Z);
        // jede Sorte trägt dieselbe Passung wie beim direkten Aufruf
        expect(
          z.sorten.map((s: SortePassung) => [s.sorteId, s.passung.einstufung, s.passung.gruende]).sort(),
        ).toEqual(direkt.map((s) => [s.sorteId, s.passung.einstufung, s.passung.gruende]).sort());
        if (namen.length === 1) expect(z.einstufung).toBe(direkt[0]?.passung.einstufung);
      }
    }
    // Stichproben der Rechnung R3.2 (Fixture)
    const lollo = liste(t, wahl(t, 'lollo'));
    expect(urteil(lollo, '2.3').sorten[0]?.passung.gruende).toEqual(['P2', 'P3']);
    expect(urteil(lollo, '2.1').sorten[0]?.passung.gruende).toEqual(['P2']);
    expect(urteil(liste(t, wahl(t, 'matador')), '2.1').sorten[0]?.passung.gruende).toEqual(['P7']);
  });

  it('UX6-AK1 bei gleichem Urteil bleibt die Reihenfolge von zielgefaesse (stabil nach Kennung)', () => {
    const t = passungTeile();
    const l = liste(t, wahl(t, 'lollo'));
    expect(kennungen(l)).toEqual(['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '3.3', '2.3']);
    // Ochsenherz: alle Nicht empfohlen, Reihenfolge wie zielgefaesse()
    expect(kennungen(liste(t, wahl(t, 'ochsenherz')))).toEqual(
      zielgefaesse(t, ANLAGE_R).map((z) => z.kennung),
    );
    // die Ziele selbst bleiben unverändert
    expect(urteil(l, '3.1').ziel).toEqual(zielgefaesse(t, ANLAGE_R).find((z) => z.kennung === '3.1'));
  });

  it('UX6-AK1 zwei Sorten: das Ziel trägt das schlechteste Urteil', () => {
    const t = mitGenoveserIn21();
    // Lollo Rossa und Ochsenherz: überall Nicht empfohlen, weil Ochsenherz nirgends passt
    const lo = liste(t, wahl(t, 'lollo', 'ochsenherz'));
    expect(lo.every((z) => z.einstufung === 'nicht_empfohlen')).toBe(true);
    expect(
      urteil(lo, '1.1')
        .sorten.map((s: SortePassung) => s.passung.einstufung)
        .sort(),
    ).toEqual(['empfohlen', 'nicht_empfohlen']);
    // Genoveser (Empfohlen) und Matador (Möglich) in 2.1: Möglich
    expect(urteil(liste(t, wahl(t, 'genoveser', 'matador')), '2.1').einstufung).toBe('moeglich');
    // Lollo Rossa (Nicht empfohlen) und Matador (Möglich) in 2.1: Nicht empfohlen
    expect(urteil(liste(t, wahl(t, 'lollo', 'matador')), '2.1').einstufung).toBe('nicht_empfohlen');
    // beide Empfohlen: Empfohlen
    expect(urteil(liste(t, wahl(t, 'genoveser', 'matador')), '1.1').einstufung).toBe('empfohlen');
  });

  it('UX6-AK1 Wort aus EINSTUFUNG_NAME, ohne Sorte «ohne Urteil» und Reihenfolge unverändert', () => {
    const t = mitGenoveserIn21();
    for (const z of liste(t, wahl(t, 'matador'))) {
      expect(z.einstufung).toBeDefined();
      expect(z.wort).toBe(EINSTUFUNG_NAME[z.einstufung as keyof typeof EINSTUFUNG_NAME]);
    }
    expect(urteil(liste(t, wahl(t, 'matador')), '2.1').wort).toBe('Möglich');
    expect(urteil(liste(t, wahl(t, 'matador')), '2.3').wort).toBe('Nicht empfohlen');
    expect(urteil(liste(t, wahl(t, 'matador')), '1.1').wort).toBe('Empfohlen');
    const ohne = liste(t, []);
    expect(kennungen(ohne)).toEqual(zielgefaesse(t, ANLAGE_R).map((z) => z.kennung));
    for (const z of ohne) {
      expect(z.einstufung).toBeUndefined();
      expect(z.wort).toBe('ohne Urteil');
      expect(z.sorten).toEqual([]);
    }
    expect(zielVorwahl(ohne)).toBeUndefined();
  });

  it('UX6-AK1 freie Löcher: Anzucht zählt nur freie 8-cm-Töpfe, Direktsaat jede Grösse; belegt und reserviert zählen nicht', () => {
    const t = passungTeile();
    const l = liste(t, wahl(t, 'lollo'));
    expect(Object.fromEntries(l.map((z) => [z.ziel.kennung, z.freieLoecher]))).toEqual({
      '1.1': 4,
      '1.2': 4,
      '2.1': 6,
      '2.2': 2,
      // 2.3.1 bis 2.3.3 belegt (Lollo Rossa bis über das Umsetzdatum), 2.3.4 bis 2.3.6 reserviert (Eichblatt)
      '2.3': 0,
      // Kratky ist Direktsaat: 5-cm-Töpfe zählen
      '3.1': 8,
      '3.2': 6,
      '3.3': 8,
    });
    // zwei 5-cm-Töpfe in 2.1 (Anzucht) zählen nicht, ein 8-cm-Topf in 3.1 (Direktsaat) zählt weiter
    topfGroesse(t, ['2.1.1', '2.1.2'], 50);
    topfGroesse(t, ['3.1.1'], 80);
    const m = liste(t, wahl(t, 'lollo'));
    expect(urteil(m, '2.1').freieLoecher).toBe(4);
    expect(urteil(m, '3.1').freieLoecher).toBe(8);
    // ein belegter Topf in 2.1 zählt nicht
    const u = mitGenoveserIn21();
    expect(urteil(liste(u, wahl(u, 'matador')), '2.1').freieLoecher).toBe(5);
  });

  it('UX6-AK1 freie Löcher am Umsetzdatum: Nachfolge-Topf (belegt bis vor dem Umsetzdatum) zählt als frei', () => {
    // Lollo Rossa in 2.3 erntet einmalig ab 40 Tagen nach dem Umsetzen (28.12.2026): Ende 6.2.2027
    const t = stammSetzen(
      passungTeile(),
      'art_kulturform',
      (z) => z['art_id'] === ART.salat && z['kulturform'] === 'kopf',
      { ernte_ab_d: 40 },
    );
    // gesät 18.1., umgesetzt 8.2. (Umsetzen ab 21): 2.3.1 bis 2.3.3 sind dann frei, 2.3.4 bis 2.3.6 bleiben reserviert
    expect(urteil(liste(t, wahl(t, 'lollo')), '2.3').freieLoecher).toBe(3);
    // gesät 16.1., umgesetzt 6.2.: Ende am Umsetztag, einmalig verlangt E < U, also kein freies Loch
    expect(urteil(liste(t, wahl(t, 'lollo'), '2027-01-16'), '2.3').freieLoecher).toBe(0);
  });

  it('UX6-AK1 freiText «1 freies Loch», «4 freie Löcher», «kein freies Loch»', () => {
    const t = topfGroesse(passungTeile(), ['2.2.2'], 50);
    const l = liste(t, wahl(t, 'lollo'));
    expect(urteil(l, '1.1').freiText).toBe('4 freie Löcher');
    expect(urteil(l, '2.2').freieLoecher).toBe(1);
    expect(urteil(l, '2.2').freiText).toBe('1 freies Loch');
    expect(urteil(l, '2.3').freiText).toBe('kein freies Loch');
    expect(urteil(l, '3.1').freiText).toBe('8 freie Löcher');
  });

  it('UX6-AK1 Vorwahl: erstes empfohlenes Ziel; keine Vorwahl, wenn kein Ziel empfohlen ist', () => {
    const t = mitGenoveserIn21();
    expect(zielVorwahl(liste(t, wahl(t, 'matador')))).toBe(platzId('1.1'));
    expect(zielVorwahl(liste(t, wahl(t, 'ochsenherz')))).toBeUndefined();
    expect(zielVorwahl(liste(t, wahl(t, 'lollo', 'ochsenherz')))).toBeUndefined();
    // nur Möglich und Nicht empfohlen: keine Vorwahl
    const nurMoeglich = liste(t, wahl(t, 'matador')).filter((z) => z.einstufung !== 'empfohlen');
    expect(nurMoeglich.map((z) => z.ziel.kennung)).toEqual(['2.1', '2.3']);
    expect(zielVorwahl(nurMoeglich)).toBeUndefined();
    expect(zielVorwahl([])).toBeUndefined();
  });

  it('UX6-AK1 Vorwahl überspringt ein empfohlenes Ziel, das ruht oder kein freies Loch hat', () => {
    // 1.1 nur 5-cm-Töpfe (kein freies Loch für die Anzucht), 1.2 ruht: Vorwahl 2.1
    const t = gefaessRuht(topfGroesse(passungTeile(), ['1.1.1', '1.1.2', '1.1.3', '1.1.4'], 50), '1.2');
    const l = liste(t, wahl(t, 'lollo'));
    expect(urteil(l, '1.1').einstufung).toBe('empfohlen');
    expect(urteil(l, '1.1').freieLoecher).toBe(0);
    expect(urteil(l, '1.2').einstufung).toBe('empfohlen');
    expect(urteil(l, '1.2').ziel.hinweis).toBe('Gefäss 1.2 ruht');
    expect(zielVorwahl(l)).toBe(platzId('2.1'));
    // in Prüfung zählt wie ruht
    for (const g of t['v_gefaess_status'] ?? [])
      if (g['gefaess_id'] === gefaessId('2.1')) g['status'] = 'in_pruefung';
    expect(zielVorwahl(liste(t, wahl(t, 'lollo')))).toBe(platzId('2.2'));
  });

  it('UX6-AK1 TZ rechnet mit dem übergebenen jetzt und Saatdatum, nicht mit der Systemzeit', () => {
    // 30 °C Wasser in 3.1 am 15.1.: innerhalb der 7 Kalendertage vor dem 18.1. P6 (Wasser zu warm), am 1.2. nicht mehr
    const t = passungTeile();
    messungDazu(t, { platzId: platzId('3.1'), giltAb: '2027-01-15T08:00:00.000Z', temperatur: 30 });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-06-01T12:00:00Z'));
    const jetzt = liste(t, wahl(t, 'lollo'), HEUTE, J);
    expect(urteil(jetzt, '3.1').einstufung).toBe('nicht_empfohlen');
    expect(urteil(jetzt, '3.1').sorten[0]?.passung.gruende).toEqual(['P6']);
    const spaeter = liste(t, wahl(t, 'lollo'), HEUTE, new Date('2027-02-01T08:00:00Z'));
    expect(urteil(spaeter, '3.1').einstufung).toBe('empfohlen');
    // Systemzeit weit weg ändert nichts: gleiches Ergebnis wie ohne gefälschte Uhr
    vi.useRealTimers();
    expect(liste(t, wahl(t, 'lollo'), HEUTE, J).map((z) => [z.ziel.kennung, z.einstufung])).toEqual(
      jetzt.map((z) => [z.ziel.kennung, z.einstufung]),
    );
  });
});
