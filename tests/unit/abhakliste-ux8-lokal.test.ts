// UX8 (Issue #230), Prüfer Fachlogik Runde 1 Befund 1: Wechselblock und «Wechsel läuft» in Heute lesen den lokalen
// Stand ohne defsUebernehmen(). Ein alter Stand mit den Spülzeilen 6 und 8 darf dort keine Zeile nennen, die es nicht
// mehr gibt.
import { describe, expect, it } from 'vitest';
import { gliedAusStand } from '../../src/domain/abhakliste/block.ts';
import {
  aktiveZeileAnzeige as aktiveZeile,
  ohneEntfallene,
  standNeu,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import type { SchrittTyp, ZeileDef } from '../../src/domain/abhakliste/zeilen.ts';

const T0 = new Date('2027-01-12T17:30:00.000Z');
const SCHRITTE: readonly SchrittTyp[] = [
  'kalibrierung_pruefen',
  'absaugen',
  'frischwasser',
  'frischwasser_messen',
  'gerechnet_fuer',
  'micro',
  'spuelen',
  'grow',
  'spuelen',
  'bloom',
  'umruehren',
  'timer',
  'ph_einstellen',
  'timer',
  'kontrollmessung',
  'restdosis',
  'timer',
  'endmessung',
];

/** Stand, wie ihn die App vor UX8 gespeichert hat: 18 Zeilen, die ersten `n` abgehakt */
function alterStand(n: number): AblaufStand {
  const defs: ZeileDef[] = SCHRITTE.map((schritt, nr) => ({ nr, schritt, titel: schritt, aufzuege: 1 }));
  const s = standNeu(
    { platzId: '20000000-0000-4000-8000-000000000023', code: 'R-2.3', ansatzId: 'a', defs },
    T0,
  );
  return {
    ...s,
    zeilen: s.zeilen.map((z) =>
      z.nr < n
        ? { ...z, erledigtAm: new Date(T0.getTime() + z.nr * 60_000).toISOString(), aufzuegeErledigt: 1 }
        : z,
    ),
  };
}

const ORT = { code: 'R-2.3', kennung: '2.3' };

describe('UX8-AK2 alter lokaler Stand ohne defsUebernehmen', () => {
  it('UX8-AK2 offene Zeile 6: aktiv ist 7, der Wechselblock nennt Grow', () => {
    const s = alterStand(6);
    expect(aktiveZeile(s)).toBe(7);
    const g = gliedAusStand(ohneEntfallene(s), ORT);
    expect(g?.zeile).toBe(7);
    expect(g?.zeilenText).toBe('Grow');
  });

  it('UX8-AK2 abgehakte Zeile 6: aktiv ist 7', () => {
    expect(aktiveZeile(alterStand(7))).toBe(7);
  });

  it('UX8-AK2 offene Zeile 8 nach Grow: aktiv ist 9, der Wechselblock nennt Bloom', () => {
    const s = alterStand(8);
    expect(aktiveZeile(s)).toBe(9);
    expect(gliedAusStand(ohneEntfallene(s), ORT)?.zeilenText).toBe('Bloom');
  });

  it('UX8-AK2 alles abgehakt: keine aktive Zeile', () => {
    expect(aktiveZeile(alterStand(18))).toBeUndefined();
  });
});
