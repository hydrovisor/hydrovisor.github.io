// Topf und Deckelbelegung (Plan 33 Testliste; UC6-AK3, R8.3, R1-2 aus #90, R2.2, R6.2). Injizierte Uhr
// 2027-01-19T08:00:00Z, Zeitzone Europe/Zurich; Teile aus tests/fixtures/umsetzen.ts.
//
// Vertrag (Plan 33 «Signaturen und Datenfluss», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/pflanzung/topf.ts
//     topfOrt(teile, netztopfId): { netztopfId; kennung; groesseMm; platzId; lochNr; heimPlatzId; heimLochNr;
//       ausserHeim } | undefined
//     pflanzungenImTopf(teile, netztopfId): pflanzungId[] der aktiven Pflanzungen im Topf (netztopf_id, Platz und Loch
//       des Topfs, Direktsaat über ihre aktive Reservierung)
//     lochGroesse(teile, platzId): 50 | 80 | undefined (Topfdurchmesser des Deckels)
//     deckelBelegung(teile, platzId): DeckelLoch[] je Loch in Lochfolge
//       { lochNr; netztopfId?; kennung? (Topf, der dort steht); zustand: frei | belegt | reserviert; sorte?; satzId?;
//         pflanzungId?; fremd? «2.3.4 auf 2.3.1» (Topf ausser Heimplatz: Kennung auf Gefäss.Loch);
//         abwesend? «2.1.2 auf 4.2.1» (Heimloch, dessen Topf anderswo steht); ziel? «→ 2.1» (8-cm-Topf auf Station) }
//   src/domain/pflanzung/saeen.ts: zieltoepfe() listet einen abwesenden Heimtopf an seinem Heimloch, nicht frei und nicht
//     gewählt, mit abwesend «… auf 4.2.1».
//   src/domain/anlage/gefaess.ts: Gefaessansicht erhält
//     deckel: DeckelLoch[] (= deckelBelegung), zielbereichPflanzen?: string
//       «Zielbereich aus Pflanzen: pH 5.8–6.3 · EC 1.0–1.4 · 2 Pflanzen» aus v_zielbereich (eine Nachkommastelle),
//     pflanzen[].umsetzen?: true je Satzzeile auf einer Station,
//     verlauf[].marker mit «Tausch 2.3.1 ↔ 2.3.4», «Umgesetzt aus 4.4: 5», «Verschoben 2.3.1 auf 2.1.5».
import { describe, expect, it } from 'vitest';
import { gefaessAnsicht } from '../../src/domain/anlage/gefaess.ts';
import { zieltoepfe } from '../../src/domain/pflanzung/saeen.ts';
import { deckelBelegung, lochGroesse, pflanzungenImTopf, topfOrt } from '../../src/domain/pflanzung/topf.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { netztopfId, platzId, type Teile } from '../fixtures/regal.ts';
import { umsetzSichtenNachrechnen } from '../fixtures/sichten.ts';
import {
  DIREKT,
  EICHBLATT_23,
  ereignis,
  L,
  LOLLO_ALT,
  SATZ,
  TOMATE,
  UMSETZ_JETZT,
  umgesetzt,
  umsetzTeile,
} from '../fixtures/umsetzen.ts';

const J = UMSETZ_JETZT;
const Z = ZEITZONE;
const loch = (t: Teile, kennung: string, nr: number) =>
  deckelBelegung(t, platzId(kennung)).find((l) => l.lochNr === nr);

/** Tausch 2.3.1 ↔ 2.3.4 als zwei Ereignisse tausch (wie verschiebVorgang) */
function getauscht(t: Teile): Teile {
  const vorgang = '5e000000-0000-4000-8000-000000000001';
  for (const [topf, pflanzung, von, nach] of [
    ['2.3.1', EICHBLATT_23, 1, 4],
    ['2.3.4', LOLLO_ALT, 4, 1],
  ] as const)
    ereignis(t, {
      typ: 'tausch',
      netztopfId: netztopfId(topf),
      pflanzungId: pflanzung,
      giltAb: '2027-01-19T07:00:00.000Z',
      daten: {
        von_platz_id: platzId('2.3'),
        von_loch_nr: von,
        nach_platz_id: platzId('2.3'),
        nach_loch_nr: nach,
        vorgang_id: vorgang,
      },
    });
  return umsetzSichtenNachrechnen(t);
}

const marker = (t: Teile, code: string) =>
  (gefaessAnsicht(t, code, J, Z)?.verlauf ?? []).flatMap((v) => v.marker);

describe('UC6-AK3 Deckelgrafik nach dem Tausch', () => {
  it('UC6-AK3 deckelBelegung zeigt nach dem Tausch 2.3.4 in Loch 1 und 2.3.1 in Loch 4, je «ausser Heimplatz»', () => {
    const vorher = umsetzTeile({
      bestand23: true,
      zieltoepfe: ['2.3.6', '1.1.1', '1.1.2', '1.1.3', '1.1.4'],
    });
    expect(loch(vorher, '2.3', 1)).toMatchObject({
      netztopfId: netztopfId('2.3.1'),
      kennung: '2.3.1',
      zustand: 'belegt',
      sorte: 'Eichblatt',
      pflanzungId: EICHBLATT_23,
    });
    expect(loch(vorher, '2.3', 1)?.fremd).toBeUndefined();

    const t = getauscht(vorher);
    const d = deckelBelegung(t, platzId('2.3'));
    expect(d.map((l) => l.lochNr)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(loch(t, '2.3', 1)).toMatchObject({
      kennung: '2.3.4',
      zustand: 'belegt',
      sorte: 'Lollo Rossa',
      pflanzungId: LOLLO_ALT,
      fremd: '2.3.4 auf 2.3.1',
    });
    expect(loch(t, '2.3', 4)).toMatchObject({
      kennung: '2.3.1',
      zustand: 'belegt',
      sorte: 'Eichblatt',
      fremd: '2.3.1 auf 2.3.4',
    });
    expect(loch(t, '2.3', 2)).toMatchObject({ kennung: '2.3.2', zustand: 'frei' });
    expect(loch(t, '2.3', 2)?.fremd).toBeUndefined();
    expect(loch(t, '2.3', 6)).toMatchObject({ kennung: '2.3.6', zustand: 'reserviert' });
  });
});

describe('R8.3 R1-2 Topf auf der Station', () => {
  it('R8.3 R1-2 8-cm-Zieltopf auf der Station: 4.2 Loch 1 zeigt «2.1.2 → 2.1», 2.1 Loch 2 «abwesend, auf 4.2.1»', () => {
    const t = umsetzTeile();
    expect(topfOrt(t, netztopfId('2.1.2'))).toEqual({
      netztopfId: netztopfId('2.1.2'),
      kennung: '2.1.2',
      groesseMm: 80,
      platzId: platzId('4.2'),
      lochNr: 1,
      heimPlatzId: platzId('2.1'),
      heimLochNr: 2,
      ausserHeim: true,
    });
    expect(loch(t, '4.2', 1)).toMatchObject({
      netztopfId: netztopfId('2.1.2'),
      kennung: '2.1.2',
      zustand: 'belegt',
      sorte: 'Ochsenherz',
      satzId: SATZ.tomate,
      pflanzungId: TOMATE,
      ziel: '→ 2.1',
    });
    expect(loch(t, '4.2', 2)).toMatchObject({ zustand: 'frei' });
    expect(loch(t, '4.2', 2)?.kennung).toBeUndefined();
    expect(loch(t, '2.1', 2)).toMatchObject({ netztopfId: netztopfId('2.1.2'), abwesend: '2.1.2 auf 4.2.1' });
    // 5-cm-Station: Sämlinge ohne Netztopf
    const station = deckelBelegung(t, platzId('4.4'));
    expect(station).toHaveLength(13);
    expect(loch(t, '4.4', 1)).toMatchObject({ zustand: 'belegt', sorte: 'Lollo Rossa', pflanzungId: L[1] });
    expect(loch(t, '4.4', 1)?.kennung).toBeUndefined();
    expect(loch(t, '4.4', 12)).toMatchObject({ zustand: 'frei' });
    // Hilfen
    expect(lochGroesse(t, platzId('4.4'))).toBe(50);
    expect(lochGroesse(t, platzId('3.2'))).toBe(50);
    expect(lochGroesse(t, platzId('2.3'))).toBe(80);
    expect(lochGroesse(t, platzId('A1'))).toBeUndefined();
    expect(pflanzungenImTopf(t, netztopfId('2.1.2'))).toEqual([TOMATE]);
    expect(pflanzungenImTopf(t, netztopfId('2.3.2'))).toEqual([]);
    const b = umsetzTeile({ bestand23: true });
    expect(pflanzungenImTopf(b, netztopfId('2.3.1'))).toEqual([EICHBLATT_23]);
    // Direktsaat steht über ihre Reservierung im Topf
    expect(pflanzungenImTopf(b, netztopfId('3.1.1'))).toEqual([DIREKT]);
  });

  it('R8.3 R1-2 zieltoepfe() in Säen: abwesender Heimtopf erscheint nicht wählbar statt zu fehlen', () => {
    const t = umsetzTeile();
    for (const umsetzenAm of [undefined, '2027-02-20']) {
      const z = zieltoepfe(t, platzId('2.1'), new Map(), umsetzenAm);
      expect(
        z.map((x) => x.lochNr),
        String(umsetzenAm),
      ).toEqual([1, 2, 3, 4, 5, 6]);
      const zwei = z.find((x) => x.lochNr === 2) as (typeof z)[number] & { abwesend?: string };
      expect(zwei.netztopfId).toBe(netztopfId('2.1.2'));
      expect(['frei', 'gewaehlt']).not.toContain(zwei.zustand);
      expect(zwei.abwesend).toContain('auf 4.2.1');
      expect(z.find((x) => x.lochNr === 1)?.zustand).toBe('frei');
    }
  });
});

describe('R2.2 und R6.2 Maske «Gefäss»', () => {
  it('R2.2 gefaessAnsicht zeigt «Zielbereich aus Pflanzen» aus v_zielbereich', () => {
    const t = umsetzTeile({ bestand23: true });
    const a = gefaessAnsicht(t, 'R-2.3', J, Z);
    expect(a?.zielbereichPflanzen).toBe('Zielbereich aus Pflanzen: pH 5.8–6.3 · EC 1.0–1.4 · 2 Pflanzen');
    expect(gefaessAnsicht(t, 'R-4.4', J, Z)?.zielbereichPflanzen).toBe(
      'Zielbereich aus Pflanzen: pH 6.0–6.2 · EC 0.8–1.2 · 11 Pflanzen',
    );
    // ohne Pflanzen keine Zeile; der Schnappschuss (R2.5) bleibt daneben
    expect(gefaessAnsicht(t, 'R-1.1', J, Z)?.zielbereichPflanzen).toBeUndefined();
    // Deckel der Maske = deckelBelegung
    expect(a?.deckel).toEqual(deckelBelegung(t, platzId('2.3')));
  });

  it('UC6-AK3 gefaessAnsicht Verlauf: «Tausch 2.3.1 ↔ 2.3.4», «Umgesetzt aus 4.4: 5», «Verschoben 2.3.1 auf 2.1.5»', () => {
    const tausch = getauscht(
      umsetzTeile({ bestand23: true, zieltoepfe: ['2.3.6', '1.1.1', '1.1.2', '1.1.3', '1.1.4'] }),
    );
    expect(marker(tausch, 'R-2.3')).toContain('Tausch 2.3.1 ↔ 2.3.4');

    const um = umsetzTeile();
    for (let k = 1; k <= 5; k += 1)
      umgesetzt(um, L[k] as string, `2.3.${k}`, '2027-01-19T07:30:00.000Z', ['4.4', k]);
    umsetzSichtenNachrechnen(um);
    expect(marker(um, 'R-2.3')).toContain('Umgesetzt aus 4.4: 5');

    const v = umsetzTeile({ bestand23: true, zieltoepfe: ['2.3.6', '1.1.1', '1.1.2', '1.1.3', '1.1.4'] });
    ereignis(v, {
      typ: 'verschieben',
      netztopfId: netztopfId('2.3.1'),
      pflanzungId: EICHBLATT_23,
      giltAb: '2027-01-19T07:00:00.000Z',
      daten: { von_platz_id: platzId('2.3'), von_loch_nr: 1, nach_platz_id: platzId('2.1'), nach_loch_nr: 5 },
    });
    ereignis(v, {
      typ: 'verschieben',
      netztopfId: netztopfId('2.1.5'),
      giltAb: '2027-01-19T07:00:00.000Z',
      daten: { von_platz_id: platzId('2.1'), von_loch_nr: 5, nach_platz_id: platzId('2.3'), nach_loch_nr: 1 },
    });
    umsetzSichtenNachrechnen(v);
    expect(marker(v, 'R-2.3')).toContain('Verschoben 2.3.1 auf 2.1.5');
  });

  it('R6.2 gefaessAnsicht: Satzzeile auf einer Station mit umsetzen', () => {
    const t = umsetzTeile({ bestand23: true });
    const station = gefaessAnsicht(t, 'R-4.4', J, Z);
    expect(station?.pflanzen.find((p) => p.satzId === SATZ.lollo)).toMatchObject({
      anzahl: 6,
      umsetzen: true,
    });
    expect(station?.pflanzen.find((p) => p.satzId === SATZ.rucola)).toMatchObject({
      anzahl: 5,
      umsetzen: true,
    });
    expect(gefaessAnsicht(t, 'R-4.2', J, Z)?.pflanzen.find((p) => p.satzId === SATZ.tomate)?.umsetzen).toBe(
      true,
    );
    // im Zielgefäss kein Knopf «Umsetzen»
    for (const p of gefaessAnsicht(t, 'R-2.3', J, Z)?.pflanzen ?? []) expect(p.umsetzen).toBeUndefined();
  });
});
