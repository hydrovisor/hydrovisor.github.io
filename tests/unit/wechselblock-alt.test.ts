// Nachbesserung Runde 1 (#139, Prüferbefund 1; Plan 139 A4): ein lokaler Stand älter als 24 h belegt seinen Platz.
// Er bleibt in Heute mit «Abbrechen» und wird weder aus der Aufgabe noch aus dem Bündel Glied eines Blocks.
import { describe, expect, it } from 'vitest';
import { buendelZeile, wechselblock } from '../../src/domain/abhakliste/block.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzTeile } from '../fixtures/ansatz.ts';
import { platzId } from '../fixtures/regal.ts';
import { aufgabe, standBis, takt, um } from '../fixtures/wechselblock.ts';

describe('WB-AK3 alter Stand belegt den Platz', () => {
  const jetzt = um('18:50');
  const alt = standBis('2.1', takt(new Date(jetzt.getTime() - 25 * 3_600_000), 3, 1));

  it('WB-AK3 alter Stand 2.1 und fällige Aufgabe 2.1: 2.1 ist kein Glied', () => {
    const b = wechselblock(
      {
        teile: ansatzTeile(),
        aufgaben: [aufgabe({ kennung: '1.1' }), aufgabe({ kennung: '2.1' }), aufgabe({ kennung: '2.2' })],
        lokal: [alt],
      },
      jetzt,
      ZEITZONE,
    );
    expect(b[0]?.glieder.map((g) => g.kennung)).toEqual(['1.1', '2.2']);
    expect(b[0]?.glieder.some((g) => g.platzId === platzId('2.1'))).toBe(false);
  });

  it('WB-AK3 alter Stand 2.1 mit nur einer weiteren Aufgabe: kein Block', () => {
    expect(
      wechselblock(
        {
          teile: ansatzTeile(),
          aufgaben: [aufgabe({ kennung: '1.1' }), aufgabe({ kennung: '2.1' })],
          lokal: [alt],
        },
        jetzt,
        ZEITZONE,
      ),
    ).toEqual([]);
  });
});

describe('WB-AK3 Zeile aus dem Bündel', () => {
  const s = (nr: number, am: string | null, storniert: string | null = null) => ({
    nr,
    schritt: 'x',
    erledigt_am: am,
    storniert_am: storniert,
  });

  it('WB-AK3 Timer nur bei aktiver Timerzeile, sonst aus Haken + 15 min', () => {
    const zehn = Array.from({ length: 11 }, (_, i) => s(i, um('18:47').toISOString()));
    expect(buendelZeile(zehn, um('19:02').toISOString())).toEqual({
      zeile: 11,
      timerEnde: um('19:02').toISOString(),
    });
    expect(buendelZeile(zehn, null)).toEqual({ zeile: 11, timerEnde: um('19:02').toISOString() });
    const elf = [...zehn, s(11, um('19:03').toISOString())];
    expect(buendelZeile(elf, um('19:02').toISOString())).toEqual({ zeile: 12 });
    // stornierter Schritt zählt nicht
    expect(
      buendelZeile([...zehn, s(11, um('19:03').toISOString(), um('19:04').toISOString())], null).zeile,
    ).toBe(11);
  });
});
