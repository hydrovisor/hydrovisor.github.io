// Nachbesserung Runde 1 zu Plan 25 (Prüferbefund 1), vom Lead: ein Direktsaat-Duplikat lässt sich mit mehr gemalten
// Töpfen speichern, als das Original Schwämme hatte (A10: bei Direktsaat Schwämme = Zieltöpfe wie in Säen).
import { describe, expect, it } from 'vitest';
import { satzDuplizieren } from '../../src/domain/pflanzung/duplizieren.ts';
import { saatEingabePruefen, type SaatEingabe } from '../../src/domain/pflanzung/saeen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  duplizierTeile,
  JETZT_W4,
  kulturformSetzen,
  pflanzungAnlegen,
  reservieren,
  satzAnlegen,
  satzId,
} from '../fixtures/duplizieren.ts';
import { netztopfId } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';

describe('UC5 Runde 1: Direktsaat-Duplikat', () => {
  it('UC5 Direktsaat-Duplikat mit drei gemalten Töpfen bei zwei Schwämmen im Original wird angenommen', () => {
    const t = duplizierTeile();
    kulturformSetzen(t, 'eruca_vesicaria', 'babyleaf', { ernte_ab_d: 20 });
    satzAnlegen(t, {
      nr: 70,
      sorteId: SORTE.rucola,
      kulturform: 'babyleaf',
      saatdatum: '2027-01-21',
      direktsaat: '3.1',
      samen: 3,
      schwaemme: 2,
    });
    const a = pflanzungAnlegen(t, 70, 1, { topf: '3.1.1' });
    const b = pflanzungAnlegen(t, 70, 2, { topf: '3.1.2' });
    reservieren(t, 1, a, '3.1.1', '2027-01-21');
    reservieren(t, 2, b, '3.1.2', '2027-01-21');
    const v = satzDuplizieren(t, satzId(70), JETZT_W4, JETZT_W4, ZEITZONE);
    const s = v?.eingabe.saetze[0];
    expect(s?.schwaemme).toBeUndefined();
    const gemalt: SaatEingabe = {
      ...(v?.eingabe as SaatEingabe),
      saetze: [
        {
          ...(s as SaatEingabe['saetze'][number]),
          zieltopfIds: ['3.1.3', '3.1.4', '3.1.5'].map((k) => netztopfId(k)),
        },
      ],
    };
    expect(saatEingabePruefen(t, gemalt, JETZT_W4, ZEITZONE)).toEqual([]);
  });
});
