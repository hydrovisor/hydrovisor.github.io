// Anlagen-Übersicht mit Belegung je Ebene und Anzuchtbox (Issue #216, Plan 216; Entscheid 0025). Teile des Bündels in
// der Form von PostgREST aus tests/fixtures/saeen.ts (Regal R: 13 Gefässe in 4 Ebenen, Boxen A1 bis A4, W; Satz
// Lollo Rossa mit drei Pflanzungen auf 2.3 Loch 1 bis 3).
//
// Vertrag (Plan 216): anlagenBelegung(teile, anlageId) aus src/domain/anlage/belegung.ts liefert
// { belegt, reserviert, frei, ebenen: [{ titel, ebene?, belegt, reserviert, frei, gefaesse: [...] }],
//   boxen: [{ code, kennung, typ, belegt, platzzahl, sorten }], messstellen: [{ code, kennung }] }.
import { describe, expect, it } from 'vitest';
import { anlagenBelegung } from '../../src/domain/anlage/belegung.ts';
import { ANLAGE_R, netztopfId, platzId, uid, vereinen, weitereAnlage } from '../fixtures/regal.ts';
import { inDerBox, reservierung, saatTeile, SORTE } from '../fixtures/saeen.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');
type Zeile = Record<string, unknown>;

const teile = () => saatTeile(JETZT);
const gefaess = (b: ReturnType<typeof anlagenBelegung>, kennung: string) => {
  const g = b.ebenen.flatMap((e) => e.gefaesse).find((x) => x.kennung === kennung);
  if (!g) throw new Error(`Gefäss ${kennung} fehlt`);
  return g;
};

describe('NV4 Belegung je Ebene', () => {
  it('NV4-AK1 Ebenen von oben nach unten mit ihren Gefässen nach Kennung', () => {
    const b = anlagenBelegung(teile(), ANLAGE_R);
    expect(b.ebenen.map((e) => e.titel)).toEqual(['Ebene 4', 'Ebene 3', 'Ebene 2', 'Ebene 1']);
    expect(b.ebenen.map((e) => e.ebene)).toEqual([4, 3, 2, 1]);
    expect(b.ebenen[0]?.gefaesse.map((g) => g.kennung)).toEqual(['4.1', '4.2', '4.3', '4.4', '4.5']);
    expect(b.ebenen[2]?.gefaesse.map((g) => g.code)).toEqual(['R-2.1', 'R-2.2', 'R-2.3']);
    // Boxen und W stehen nicht in den Ebenen
    const alle = b.ebenen.flatMap((e) => e.gefaesse.map((g) => g.kennung));
    expect(alle).not.toContain('A1');
    expect(alle).not.toContain('W');
  });

  it('NV4-AK1 Töpfe je Gefäss nach dem Deckel: 2.3 mit drei Lollo Rossa, drei frei', () => {
    const g = gefaess(anlagenBelegung(teile(), ANLAGE_R), '2.3');
    expect(g).toMatchObject({
      loecher: 6,
      belegt: 3,
      reserviert: 0,
      frei: 3,
      pflanzen: 3,
      ohneGefaess: false,
    });
    expect(g.sorten).toEqual([{ sorte: 'Lollo Rossa', anzahl: 3 }]);
    expect(g.punkte).toEqual(['belegt', 'belegt', 'belegt', 'frei', 'frei', 'frei']);
    const leer = gefaess(anlagenBelegung(teile(), ANLAGE_R), '2.2');
    expect(leer).toMatchObject({ loecher: 2, belegt: 0, reserviert: 0, frei: 2, sorten: [] });
  });

  it('NV4-AK1 reservierter Topf zählt als reserviert, nicht als frei', () => {
    const t = teile();
    const [p] = inDerBox(t, { satzNr: 7, sorteId: SORTE.rucola, saatdatum: '2027-01-05', schwaemme: 1 });
    reservierung(t, {
      nr: 1,
      pflanzungId: p as string,
      netztopfId: netztopfId('2.1.1'),
      vorgabe: '2027-01-19',
    });
    const g = gefaess(anlagenBelegung(t, ANLAGE_R), '2.1');
    expect(g).toMatchObject({ loecher: 6, belegt: 0, reserviert: 1, frei: 5 });
    expect(g.punkte[0]).toBe('reserviert');
  });

  it('NV4-AK1 Summen je Ebene und Anlage stimmen mit den Gefässen überein', () => {
    const b = anlagenBelegung(teile(), ANLAGE_R);
    for (const e of b.ebenen) {
      expect(e.belegt).toBe(e.gefaesse.reduce((s, g) => s + g.belegt, 0));
      expect(e.reserviert).toBe(e.gefaesse.reduce((s, g) => s + g.reserviert, 0));
      expect(e.frei).toBe(e.gefaesse.reduce((s, g) => s + g.frei, 0));
    }
    // 84 Löcher in R (D1 2 × 4, D2 2 × 6, D4 2, D3 2 × 8, D6 2 × 6, S8 2 × 4, S5 2 × 13)
    expect(b).toMatchObject({ belegt: 3, reserviert: 0, frei: 81 });
    expect(b.ebenen[2]).toMatchObject({ titel: 'Ebene 2', belegt: 3, frei: 11 });
  });

  it('NV4-AK1 Gefäss ohne Bereich steht unter «ohne Ebene» am Schluss', () => {
    const t = teile();
    const p = (t['platz'] ?? []).find((z) => z['id'] === platzId('1.1')) as Zeile;
    p['bereich_id'] = null;
    const b = anlagenBelegung(t, ANLAGE_R);
    expect(b.ebenen.at(-1)?.titel).toBe('ohne Ebene');
    expect(b.ebenen.at(-1)?.ebene).toBeUndefined();
    expect(b.ebenen.at(-1)?.gefaesse.map((g) => g.kennung)).toEqual(['1.1']);
    expect(b.ebenen.find((e) => e.titel === 'Ebene 1')?.gefaesse.map((g) => g.kennung)).toEqual(['1.2']);
  });

  it('NV4-AK1 Sorten nach Anzahl absteigend, dann nach Name', () => {
    const t = teile();
    // zwei Rucola auf 2.3 Loch 4 und 5 dazu, eine Eichblatt auf Loch 6
    const neu = (n: number, satz: string, loch: number) => {
      const id = uid('28', 900 + n);
      (t['pflanzung'] ??= []).push({
        id,
        satz_id: satz,
        gilt_ab: '2027-01-01T08:00:00Z',
        storniert_am: null,
      });
      (t['v_pflanzung_zustand'] ??= []).push({
        pflanzung_id: id,
        satz_id: satz,
        phase: 'wachstum',
        status: 'aktiv',
        netztopf_id: null,
        platz_id: platzId('2.3'),
        loch_nr: loch,
      });
    };
    for (const [nr, sorte] of [
      [81, SORTE.rucola],
      [82, SORTE.eichblatt],
    ] as const)
      (t['satz'] ??= []).push({
        id: uid('27', nr),
        sorte_id: sorte,
        kulturform: 'kopf',
        anzuchtort_platz_id: platzId('A2'),
        direktsaat_platz_id: null,
        saatdatum: '2026-12-01',
        storniert_am: null,
      });
    neu(1, uid('27', 81), 4);
    neu(2, uid('27', 81), 5);
    neu(3, uid('27', 82), 6);
    const g = gefaess(anlagenBelegung(t, ANLAGE_R), '2.3');
    expect(g.sorten).toEqual([
      { sorte: 'Lollo Rossa', anzahl: 3 },
      { sorte: 'Rucola', anzahl: 2 },
      { sorte: 'Eichblatt', anzahl: 1 },
    ]);
    expect(g).toMatchObject({ belegt: 6, frei: 0 });
  });
});

describe('NV4 Anzuchtboxen und Messstelle', () => {
  it('NV4-AK2 Boxen hell vor dunkel und nach Kennung, leer mit 0 von 25', () => {
    const b = anlagenBelegung(teile(), ANLAGE_R);
    expect(b.boxen.map((x) => [x.kennung, x.typ])).toEqual([
      ['A1', 'hell'],
      ['A2', 'hell'],
      ['A3', 'dunkel'],
      ['A4', 'dunkel'],
    ]);
    expect(b.boxen[0]).toMatchObject({ code: 'R-A1', belegt: 0, platzzahl: 25, sorten: [] });
  });

  it('NV4-AK2 Inhalt der Box: aktive Pflanzungen ohne Platz aus Sätzen dieser Box je Sorte', () => {
    const t = teile();
    inDerBox(t, { satzNr: 5, sorteId: SORTE.rucola, saatdatum: '2027-01-05', schwaemme: 5, box: 'A3' });
    inDerBox(t, { satzNr: 6, sorteId: SORTE.cayenne, saatdatum: '2027-01-04', schwaemme: 2, box: 'A3' });
    const a3 = anlagenBelegung(t, ANLAGE_R).boxen.find((x) => x.kennung === 'A3');
    expect(a3).toMatchObject({ belegt: 7, platzzahl: 25 });
    expect(a3?.sorten).toEqual([
      { sorte: 'Rucola', anzahl: 5 },
      { sorte: 'Cayenne', anzahl: 2 },
    ]);
    // der Satz Lollo Rossa aus A1 steht schon auf 2.3 und zählt nicht mehr in der Box
    expect(anlagenBelegung(t, ANLAGE_R).boxen[0]).toMatchObject({ kennung: 'A1', belegt: 0 });
  });

  it('NV4-AK2 Messstelle W als eigener Eintrag', () => {
    const b = anlagenBelegung(teile(), ANLAGE_R);
    expect(b.messstellen).toEqual([{ code: 'R-W', kennung: 'W' }]);
  });
});

describe('NV4 was nicht zählt', () => {
  it('NV4-AK3 stornierte und inaktive Plätze fehlen', () => {
    const t = teile();
    const platz = (k: string) => (t['platz'] ?? []).find((z) => z['id'] === platzId(k)) as Zeile;
    platz('2.2')['storniert_am'] = '2027-01-01T08:00:00Z';
    platz('A4')['aktiv'] = false;
    const b = anlagenBelegung(t, ANLAGE_R);
    expect(b.ebenen.flatMap((e) => e.gefaesse.map((g) => g.kennung))).not.toContain('2.2');
    expect(b.boxen.map((x) => x.kennung)).toEqual(['A1', 'A2', 'A3']);
  });

  it('NV4-AK3 beendete Pflanzungen belegen keinen Topf', () => {
    const t = teile();
    const z = (t['v_pflanzung_zustand'] ?? [])[0] as Zeile;
    z['status'] = 'abgeschlossen';
    const g = gefaess(anlagenBelegung(t, ANLAGE_R), '2.3');
    expect(g).toMatchObject({ belegt: 2, frei: 4, pflanzen: 2 });
    expect(g.sorten).toEqual([{ sorte: 'Lollo Rossa', anzahl: 2 }]);
  });

  it('NV4-AK3 andere Anlagen zählen nicht', () => {
    const t = vereinen(teile(), weitereAnlage('T', 'demo'));
    const b = anlagenBelegung(t, ANLAGE_R);
    expect(b.ebenen.flatMap((e) => e.gefaesse).length).toBe(13);
    expect(b.messstellen).toEqual([{ code: 'R-W', kennung: 'W' }]);
    const tb = anlagenBelegung(t, uid('3a', 'T'.charCodeAt(0)));
    expect(tb.ebenen.map((e) => e.titel)).toEqual(['ohne Ebene']);
    expect(tb.ebenen[0]?.gefaesse[0]).toMatchObject({ code: 'T-2.3', loecher: 6, belegt: 0, frei: 6 });
    expect(tb.messstellen).toEqual([{ code: 'T-W', kennung: 'W' }]);
  });

  it('NV4-AK3 Gefässplatz ohne Gefäss heisst «kein Gefäss» und zählt keine Töpfe', () => {
    const t = teile();
    t['gefaess'] = (t['gefaess'] ?? []).filter((g) => g['platz_id'] !== platzId('3.2'));
    const g = gefaess(anlagenBelegung(t, ANLAGE_R), '3.2');
    expect(g).toMatchObject({ ohneGefaess: true, loecher: 0, belegt: 0, reserviert: 0, frei: 0, punkte: [] });
  });

  it('NV4-AK3 Gefäss ohne Löcher zählt nur die Pflanzen', () => {
    const t = teile();
    const g23 = (t['gefaess'] ?? []).find((g) => g['platz_id'] === platzId('2.3')) as Zeile;
    g23['deckeltyp_id'] = uid('2f', 99);
    const g = gefaess(anlagenBelegung(t, ANLAGE_R), '2.3');
    expect(g).toMatchObject({ ohneGefaess: false, loecher: 0, pflanzen: 3, belegt: 0, frei: 0, punkte: [] });
    expect(g.sorten).toEqual([{ sorte: 'Lollo Rossa', anzahl: 3 }]);
  });

  it('NV4-AK3 Prüfstatus als Wort: 1.2 ruht, 3.3 nicht geprüft, sonst kein Badge', () => {
    const b = anlagenBelegung(teile(), ANLAGE_R);
    expect(gefaess(b, '1.2').badge).toBe('ruht');
    expect(gefaess(b, '3.3').badge).toBe('nicht geprüft');
    expect(gefaess(b, '2.3').badge).toBeUndefined();
  });

  it('NV4-AK3 unbekannte Anlage ergibt eine leere Belegung', () => {
    const b = anlagenBelegung(teile(), uid('3a', 1));
    expect(b).toEqual({ belegt: 0, reserviert: 0, frei: 0, ebenen: [], boxen: [], messstellen: [] });
  });
});
