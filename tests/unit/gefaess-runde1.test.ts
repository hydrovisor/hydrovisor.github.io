// Prüfer Runde 1 zu Paket 21 (Lead): Intervallprüfung im Assistenten (Befund 2) und Töpfe dieses Platzes mit einer
// aktiven Pflanzung anderswo (Befund 7). Injizierte Uhr, Teile aus tests/fixtures/regal.ts.
import { describe, expect, it } from 'vitest';
import { entfernenPruefen } from '../../src/domain/anlage/entfernen.ts';
import {
  erfassenPruefen,
  intervallePruefen,
  type ErfassenEingabe,
} from '../../src/domain/anlage/erfassen.ts';
import { deckeltauschPruefen } from '../../src/domain/anlage/aendern.ts';
import {
  ANLAGE_R,
  deckelId,
  leeresRegal,
  modellId,
  netztopfId,
  platzId,
  regalTeile,
  uid,
} from '../fixtures/regal.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');

const eingabe = (
  intervalle: { messenD: number; nachfuellenD: number | null; wechselnD: number | null },
  betriebsart: 'dwc' | 'kratky_belueftet' = 'dwc',
): ErfassenEingabe => ({
  rolle: 'gefaess',
  anlageId: ANLAGE_R,
  bereichId: uid('2e', 2),
  position: 3,
  betriebsart,
  festeDosis: false,
  luftpumpe: 'P2',
  gefaessmodellId: modellId('rako'),
  betriebsvolumenL: 9,
  deckeltypId: deckelId('D2'),
  intervalle,
});

describe('Runde 1: Intervalle im Assistenten', () => {
  it('UC3-AK2 Intervalle ganze Tage 1 bis 60, Wechselintervall Pflicht ausser Kratky', () => {
    const teile = leeresRegal();
    expect(erfassenPruefen(teile, eingabe({ messenD: 2, nachfuellenD: 2, wechselnD: 14 }))).toEqual([]);
    expect(
      erfassenPruefen(teile, eingabe({ messenD: 0, nachfuellenD: 2, wechselnD: 14 })).map((v) => v.feld),
    ).toEqual(['intervall_messen_d']);
    expect(
      erfassenPruefen(teile, eingabe({ messenD: 2, nachfuellenD: 2, wechselnD: null })).map((v) => v.feld),
    ).toEqual(['intervall_wechseln_d']);
    expect(
      erfassenPruefen(teile, eingabe({ messenD: 2, nachfuellenD: 61, wechselnD: 14 })).map((v) => v.feld),
    ).toEqual(['intervall_nachfuellen_d']);
    expect(
      erfassenPruefen(
        teile,
        eingabe({ messenD: 7, nachfuellenD: null, wechselnD: null }, 'kratky_belueftet'),
      ),
    ).toEqual([]);
    expect(
      intervallePruefen('dwc', { messenD: 2.5, nachfuellenD: 2, wechselnD: 14 }).map((v) => v.feld),
    ).toEqual(['intervall_messen_d']);
  });
});

describe('Runde 1: Topf dieses Platzes steht mit Pflanzung anderswo', () => {
  it('UC3-AK3 und UC3-AK6 sperren Entfernen und Deckeltausch', () => {
    const teile = regalTeile(JETZT);
    // Pflanzung im Topf 2.1.1, verschoben nach 2.3 (Ortsereignis), ohne Reservierung
    teile['v_pflanzung_zustand']?.push({
      pflanzung_id: uid('28', 30),
      satz_id: uid('27', 1),
      phase: 'wachstum',
      status: 'aktiv',
      netztopf_id: netztopfId('2.1.1'),
      platz_id: platzId('2.3'),
      loch_nr: 4,
    });
    expect(entfernenPruefen(teile, platzId('2.1'))).toEqual([
      { satzId: uid('27', 1), sorte: 'Lollo Rossa', art: 'pflanzung' },
    ]);
    expect(deckeltauschPruefen(teile, platzId('2.1'), deckelId('D4')).map((v) => v.feld)).toEqual(['deckel']);
  });
});
