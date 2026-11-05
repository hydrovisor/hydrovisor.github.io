// Nachbesserung Runde 1 zu Plan 24 (Prüferbefunde 1, 2 und 5), vom Lead: reiner Stationsschritt für gekeimte Schwämme in
// der Box, Stationseintritt der 8-cm-Arten mit ihrem Zieltopf (Konzept 8.1 Regel 10), ausgefallene Schwämme zählen
// nicht als «auf der Station». Uhr 2027-01-11T08:00:00Z, Zeitzone Europe/Zurich, Teile aus tests/fixtures/keimung.ts.
import { describe, expect, it } from 'vitest';
import type { Schritt, Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  keimAnsicht,
  keimEingabePruefen,
  keimungOffen,
  keimVorgang,
  type KeimEingabe,
} from '../../src/domain/pflanzung/keimung.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  ereignisDazu,
  KEIM_JETZT,
  KEIM_SATZ,
  keimTeile,
  P,
  pflanzungId,
  satzAnlegen,
} from '../fixtures/keimung.ts';
import { netztopfId, platzId, uid } from '../fixtures/regal.ts';
import { SORTE } from '../fixtures/saeen.ts';
import { pflanzSichtenNachrechnen, pflanzVorgangAnwenden } from '../fixtures/sichten.ts';

const Z = ZEITZONE;
function neueIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid('5f', n);
  };
}
type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);

describe('R6.1 Runde 1: Stationsschritt und Zieltopf', () => {
  it('R6.1 gekeimte Schwämme in der Box lassen sich ohne neue Werte auf die Station stellen', () => {
    const t0 = keimTeile();
    const alle: KeimEingabe = {
      satzId: KEIM_SATZ,
      keimtempEingehalten: true,
      werte: P.slice(1, 7).map((p) => ({ pflanzungId: p, gekeimt: 2 })),
      station: [],
    };
    const t = pflanzVorgangAnwenden(t0, keimVorgang(t0, alle, neueIds(), KEIM_JETZT, Z), KEIM_JETZT);
    expect(keimungOffen(t, KEIM_SATZ, KEIM_JETZT, Z)).toBe(true);
    const nurStation: KeimEingabe = {
      satzId: KEIM_SATZ,
      keimtempEingehalten: undefined,
      werte: [],
      station: P.slice(1, 7).map((p, i) => ({ pflanzungId: p, platzId: platzId('4.4'), lochNr: i + 1 })),
    };
    expect(keimEingabePruefen(t, nurStation, KEIM_JETZT, Z)).toEqual([]);
    const v = keimVorgang(t, nurStation, neueIds(), KEIM_JETZT, Z);
    expect(neue(v).map((f) => f['typ'])).toEqual(Array(6).fill('verschieben'));
    const nach = pflanzVorgangAnwenden(t, v, KEIM_JETZT);
    expect(keimungOffen(nach, KEIM_SATZ, KEIM_JETZT, Z)).toBe(false);
    // ohne Werte und ohne Station weiterhin abgelehnt
    expect(keimEingabePruefen(t, { ...nurStation, station: [] }, KEIM_JETZT, Z).length).toBeGreaterThan(0);
  });

  it('R6.1 Tomate (8 cm) geht mit ihrem Zieltopf auf die Station, Salat ohne Netztopf', () => {
    const t = keimTeile();
    satzAnlegen(t, {
      nr: 82,
      sorteId: SORTE.ochsenherz,
      box: 'A1',
      schwaemme: 3,
      samen: 1,
      zieltoepfe: ['2.3.6'],
    });
    pflanzSichtenNachrechnen(t);
    const satz = uid('27', 82);
    const e: KeimEingabe = {
      satzId: satz,
      keimtempEingehalten: true,
      werte: [1, 2, 3].map((i) => ({ pflanzungId: pflanzungId(82, i), gekeimt: 1 })),
      station: [{ pflanzungId: pflanzungId(82, 1), platzId: platzId('4.2'), lochNr: 1 }],
    };
    expect(keimEingabePruefen(t, e, KEIM_JETZT, Z)).toEqual([]);
    const v = neue(keimVorgang(t, e, neueIds(), KEIM_JETZT, Z)).filter((f) => f['typ'] === 'verschieben');
    expect(v).toHaveLength(1);
    expect(v[0]?.['netztopf_id']).toBe(netztopfId('2.3.6'));
    // Salat: Stationseintritt ohne Netztopf
    const salat: KeimEingabe = {
      satzId: KEIM_SATZ,
      keimtempEingehalten: true,
      werte: [{ pflanzungId: P[1] as string, gekeimt: 2 }],
      station: [{ pflanzungId: P[1] as string, platzId: platzId('4.4'), lochNr: 1 }],
    };
    const s = neue(keimVorgang(t, salat, neueIds(), KEIM_JETZT, Z)).filter((f) => f['typ'] === 'verschieben');
    expect(s[0]?.['netztopf_id'] ?? null).toBeNull();
  });

  it('R6.1 ein ausgefallener Schwamm auf der Station zählt nicht als gestellt', () => {
    const t = keimTeile();
    ereignisDazu(t, {
      typ: 'verschieben',
      pflanzungId: P[1] as string,
      daten: { von_platz_id: platzId('A1'), nach_platz_id: platzId('4.4'), nach_loch_nr: 1 },
      giltAb: '2027-01-10T08:00:00.000Z',
    });
    ereignisDazu(t, {
      typ: 'abschluss',
      pflanzungId: P[1] as string,
      daten: { grund: 'ausfall' },
      giltAb: '2027-01-10T09:00:00.000Z',
    });
    pflanzSichtenNachrechnen(t);
    const s1 = keimAnsicht(t, KEIM_SATZ, KEIM_JETZT, Z)?.schwaemme.find((s) => s.pflanzungId === P[1]);
    expect(s1?.zustand).toBe('erledigt');
    expect(s1?.station).toBeUndefined();
  });
});
