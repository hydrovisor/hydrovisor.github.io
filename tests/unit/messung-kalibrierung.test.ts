// Kalibrier-Fälligkeit und «unsicher» (Plan 12 Testliste; R5.2, R10.3, R4.7, G2, G5; 06_tests.md 5 TZ1 bis TZ4).
// Die Fälle spiegeln supabase/tests/database/03_zustaende.test.sql (v_kalibrierung_faellig, v_messung_unsicher) mit
// denselben Daten und Tagesgrenzen. Injizierte Uhr: Zeitpunkte als UTC-ISO, Zeitzone Europe/Zurich als Parameter.
// Winterzeit UTC+1 bis 28.3.2027 02:00, danach Sommerzeit UTC+2.
import { describe, expect, it } from 'vitest';
import {
  istUnsicher,
  kalibrierStand,
  kalibrierText,
  type Datenart,
  type GeraeteEreignis,
  type Kalibrierdaten,
  type KalibrierZeile,
} from '../../src/domain/kalibrierung/stand.ts';

const ZUERICH = 'Europe/Zurich';
const GERAET = '0c0c0c0c-0000-4000-8000-000000000201';
const ANDERES_GERAET = '0c0c0c0c-0000-4000-8000-000000000202';
/** feste Kalibriertermine wie in der Fixture von 03_zustaende.test.sql */
const TERMINE = ['2027-01-01', '2027-01-31', '2027-02-24', '2027-03-24'] as const;

let nummer = 0;
function kal(
  giltAb: string,
  weiter: { datenart?: Datenart; messgeraetId?: string; storniert?: boolean; id?: string } = {},
): KalibrierZeile {
  nummer += 1;
  return {
    id: weiter.id ?? `0c0c0c0c-0000-4000-8000-${String(600 + nummer).padStart(12, '0')}`,
    messgeraet_id: weiter.messgeraetId ?? GERAET,
    datenart: weiter.datenart ?? 'echt',
    gilt_ab: giltAb,
    storniert_am: weiter.storniert ? '2027-01-02T08:00:00.000Z' : null,
  };
}

function sondeGereinigt(giltAb: string, datenart: Datenart = 'echt', storniert = false): GeraeteEreignis {
  return {
    typ: 'sonde_gereinigt',
    messgeraet_id: GERAET,
    gilt_ab: giltAb,
    storniert_am: storniert ? '2027-01-11T08:00:00.000Z' : null,
    daten: { datenart },
  };
}

function daten(
  kalibrierungen: KalibrierZeile[],
  weiter: { ereignisse?: GeraeteEreignis[]; termine?: readonly string[] } = {},
): Kalibrierdaten {
  return { kalibrierungen, ereignisse: weiter.ereignisse ?? [], festeTermine: weiter.termine ?? [] };
}

const stand = (d: Kalibrierdaten, stichtag: string, datenart: Datenart = 'echt', geraet = GERAET) =>
  kalibrierStand(d, { messgeraetId: geraet, datenart }, new Date(stichtag), ZUERICH);

const unsicher = (d: Kalibrierdaten, giltAb: string, datenart: Datenart = 'echt', geraet = GERAET) =>
  istUnsicher({ messgeraetId: geraet, datenart, giltAb: new Date(giltAb) }, d, ZUERICH);

// 1.1.2027 09:00 Zürich
const KAL_1_1 = '2027-01-01T08:00:00.000Z';

const VARIANTEN = [
  ['mit festen Terminen', TERMINE],
  ['ohne feste Termine', []],
] as const;

describe('TZ1 bis TZ4 (Kalibrierung 1.1. 09:00 Zürich)', () => {
  for (const [variante, termine] of VARIANTEN) {
    it(`TZ1 Kalibrierung 1.1., heute 30.1.: keine Aufgabe, Messung nicht unsicher (${variante})`, () => {
      const d = daten([kal(KAL_1_1)], { termine });
      const s = stand(d, '2027-01-30T09:00:00.000Z');
      expect(s).toMatchObject({ art: 'gueltig', faelligAm: '2027-01-31' });
      expect(unsicher(d, '2027-01-30T09:00:00.000Z')).toBe(false);
    });

    it(`TZ2 heute 31.1.: Messgerät kalibrieren, Messung nicht unsicher (${variante})`, () => {
      const d = daten([kal(KAL_1_1)], { termine });
      const s = stand(d, '2027-01-31T09:00:00.000Z');
      expect(s).toMatchObject({ art: 'faellig', faelligAm: '2027-01-31' });
      expect(kalibrierText(s)).toBe('Messgerät kalibrieren');
      expect(unsicher(d, '2027-01-31T09:00:00.000Z')).toBe(false);
    });

    it(`TZ3 heute 1.2.: seit 1 Tag überfällig, Messung unsicher (${variante})`, () => {
      const d = daten([kal(KAL_1_1)], { termine });
      const s = stand(d, '2027-02-01T09:00:00.000Z');
      expect(s).toMatchObject({ art: 'ueberfaellig', faelligAm: '2027-01-31', tageUeberfaellig: 1 });
      expect(kalibrierText(s)).toBe('seit 1 Tag überfällig');
      expect(unsicher(d, '2027-02-01T09:00:00.000Z')).toBe(true);
    });

    it(`TZ4 nie kalibriert: Erstkalibrierung, Messung unsicher (${variante})`, () => {
      const d = daten([], { termine });
      const s = stand(d, '2027-01-10T09:00:00.000Z');
      expect(s).toEqual({ art: 'erstkalibrierung' });
      expect(kalibrierText(s)).toBe('Erstkalibrierung');
      expect(unsicher(d, '2027-01-10T09:00:00.000Z')).toBe(true);
    });
  }

  it('TZ2 Messung 31.1. 23:30 nicht unsicher (Tagesgrenze Zürich, nicht UTC)', () => {
    // 31.1. 23:30 Zürich = 31.1. 22:30Z
    expect(unsicher(daten([kal(KAL_1_1)]), '2027-01-31T22:30:00.000Z')).toBe(false);
    expect(unsicher(daten([kal(KAL_1_1)], { termine: TERMINE }), '2027-01-31T22:30:00.000Z')).toBe(false);
  });

  it('TZ3 Messung 1.2. 00:30 unsicher (Tagesgrenze Zürich, nicht UTC)', () => {
    // 1.2. 00:30 Zürich = 31.1. 23:30Z: in UTC noch der 31.1., in Zürich Tag 31
    expect(unsicher(daten([kal(KAL_1_1)]), '2027-01-31T23:30:00.000Z')).toBe(true);
    expect(unsicher(daten([kal(KAL_1_1)], { termine: TERMINE }), '2027-01-31T23:30:00.000Z')).toBe(true);
    const s = stand(daten([kal(KAL_1_1)]), '2027-01-31T23:30:00.000Z');
    expect(s).toMatchObject({ art: 'ueberfaellig', tageUeberfaellig: 1 });
  });
});

describe('UC9-AK6 gespeicherte Messung «unsicher»', () => {
  it('UC9-AK6 Kalibrierung vor 31 Tagen: gespeicherte Messung unsicher', () => {
    // Kalibrierung 1.1. 09:00, Messung 1.2. 10:00 Zürich (Tag 31), ohne feste Termine: nur die 30-Tage-Regel
    expect(unsicher(daten([kal(KAL_1_1)]), '2027-02-01T09:00:00.000Z')).toBe(true);
  });

  it('UC9-AK6 nie kalibriert: Messung unsicher', () => {
    expect(unsicher(daten([]), '2027-01-10T09:00:00.000Z')).toBe(true);
  });

  it('UC9-AK6 Kalibrierung vor 30 Tagen: nicht unsicher', () => {
    // Messung 31.1. 10:00 Zürich (Tag 30)
    expect(unsicher(daten([kal(KAL_1_1)]), '2027-01-31T09:00:00.000Z')).toBe(false);
  });
});

describe('R5.2 feste Termine und 30-Tage-Regel', () => {
  it('R5.2 Kalibrierung 2.2.: fällig am festen Termin 24.2.; Messung 24.2. 23:30 nicht, 25.2. 00:30 unsicher', () => {
    // Kalibrierung 2.2. 09:00 Zürich; 2.2. + 30 wäre der 4.3., der feste Termin 24.2. kommt vorher
    const d = daten([kal('2027-02-02T08:00:00.000Z')], { termine: TERMINE });
    expect(stand(d, '2027-02-10T09:00:00.000Z')).toMatchObject({ art: 'gueltig', faelligAm: '2027-02-24' });
    expect(stand(d, '2027-02-24T09:00:00.000Z')).toMatchObject({ art: 'faellig', faelligAm: '2027-02-24' });
    // 24.2. 23:30 Zürich = 24.2. 22:30Z; 25.2. 00:30 Zürich = 24.2. 23:30Z
    expect(unsicher(d, '2027-02-24T22:30:00.000Z')).toBe(false);
    expect(unsicher(d, '2027-02-24T23:30:00.000Z')).toBe(true);
  });

  it('R5.2 G2 Kalibrierung 25.3.2027 über die Sommerzeit: fällig 24.4.; Messung 24.4. 23:30 nicht, 25.4. 00:30 unsicher', () => {
    // Kalibrierung 25.3. 09:00 MEZ = 08:00Z; kein fester Termin nach dem 25.3. → 25.3. + 30 = 24.4.
    const d = daten([kal('2027-03-25T08:00:00.000Z')], { termine: TERMINE });
    expect(stand(d, '2027-04-10T10:00:00.000Z')).toMatchObject({ art: 'gueltig', faelligAm: '2027-04-24' });
    expect(stand(d, '2027-04-24T10:00:00.000Z')).toMatchObject({ art: 'faellig', faelligAm: '2027-04-24' });
    expect(stand(d, '2027-04-25T10:00:00.000Z')).toMatchObject({
      art: 'ueberfaellig',
      faelligAm: '2027-04-24',
      tageUeberfaellig: 1,
    });
    // 24.4. 23:30 MESZ = 24.4. 21:30Z; 25.4. 00:30 MESZ = 24.4. 22:30Z
    expect(unsicher(d, '2027-04-24T21:30:00.000Z')).toBe(false);
    expect(unsicher(d, '2027-04-24T22:30:00.000Z')).toBe(true);
  });
});

describe('R5.2 und R10.3 «Sonde gereinigt»', () => {
  // Reinigung 10.1. 15:00 Zürich = 14:00Z
  const REINIGUNG = '2027-01-10T14:00:00.000Z';

  it('R5.2 Sonde gereinigt: fällig am Tag der Reinigung', () => {
    const d = daten([kal(KAL_1_1)], { ereignisse: [sondeGereinigt(REINIGUNG)], termine: TERMINE });
    expect(stand(d, '2027-01-10T15:00:00.000Z')).toMatchObject({ art: 'faellig', faelligAm: '2027-01-10' });
    expect(stand(d, '2027-01-11T09:00:00.000Z')).toMatchObject({
      art: 'ueberfaellig',
      faelligAm: '2027-01-10',
      tageUeberfaellig: 1,
    });
  });

  it('R10.3 Messung nach «Sonde gereinigt» unsicher, davor nicht', () => {
    const d = daten([kal(KAL_1_1)], { ereignisse: [sondeGereinigt(REINIGUNG)] });
    expect(unsicher(d, '2027-01-10T11:00:00.000Z')).toBe(false);
    expect(unsicher(d, '2027-01-10T15:00:00.000Z')).toBe(true);
  });

  it('R10.3 Reinigung vor der letzten Kalibrierung zählt nicht', () => {
    // Kalibrierung 1.1., Reinigung 5.1., neue Kalibrierung 6.1. 09:00 Zürich
    const d = daten([kal(KAL_1_1), kal('2027-01-06T08:00:00.000Z')], {
      ereignisse: [sondeGereinigt('2027-01-05T09:00:00.000Z')],
    });
    expect(unsicher(d, '2027-01-10T09:00:00.000Z')).toBe(false);
    // ohne feste Termine: 6.1. + 30 = 5.2., nicht der Tag der Reinigung
    expect(stand(d, '2027-01-10T09:00:00.000Z')).toMatchObject({ art: 'gueltig', faelligAm: '2027-02-05' });
  });

  it('R10.3 stornierte Reinigung zählt nicht', () => {
    const d = daten([kal(KAL_1_1)], { ereignisse: [sondeGereinigt(REINIGUNG, 'echt', true)] });
    expect(unsicher(d, '2027-01-10T15:00:00.000Z')).toBe(false);
    expect(stand(d, '2027-01-10T15:00:00.000Z')).toMatchObject({ art: 'gueltig', faelligAm: '2027-01-31' });
  });
});

describe('R10.3 und R4.7 Bezug der Kalibrierung', () => {
  it('R10.3 Kalibrierung nach der Messung zählt für diese Messung nicht', () => {
    // Kalibrierung 1.1. und 20.2.; Messung 10.2. (Tag 40 nach der ersten, vor der zweiten)
    const d = daten([kal(KAL_1_1), kal('2027-02-20T08:00:00.000Z')]);
    expect(unsicher(d, '2027-02-10T09:00:00.000Z')).toBe(true);
    expect(unsicher(d, '2027-02-21T09:00:00.000Z')).toBe(false);
  });

  it('R4.7 als unsicher markiert: Messung zwischen Kalibrierung X und nächster Kalibrierung unsicher, danach nicht', () => {
    // wie smoke2 in 03_zustaende.test.sql: X am 1.1. 09:00, neue Kalibrierung 15.1. 09:00, Markierung 15.1. 09:05
    const X = '0c0c0c0c-0000-4000-8000-000000000601';
    const kalibrierungen = [kal(KAL_1_1, { id: X }), kal('2027-01-15T08:00:00.000Z')];
    const markierung: GeraeteEreignis = {
      typ: 'als_unsicher_markiert',
      messgeraet_id: GERAET,
      gilt_ab: '2027-01-15T08:05:00.000Z',
      storniert_am: null,
      daten: { datenart: 'echt', seit_kalibrierung_id: X },
    };
    const ohne = daten(kalibrierungen);
    const mit = daten(kalibrierungen, { ereignisse: [markierung] });
    // ohne Markierung ist die Messung vom 10.1. sicher
    expect(unsicher(ohne, '2027-01-10T09:00:00.000Z')).toBe(false);
    expect(unsicher(mit, '2027-01-10T09:00:00.000Z')).toBe(true);
    expect(unsicher(mit, '2027-01-20T09:00:00.000Z')).toBe(false);
    // die Markierung setzt die Fälligkeit nicht (nur «Sonde gereinigt» tut das)
    expect(stand(mit, '2027-01-20T09:00:00.000Z')).toMatchObject({ art: 'gueltig' });
  });

  it('R4.7 Markierung einer anderen Datenart wirkt nicht', () => {
    const X = '0c0c0c0c-0000-4000-8000-000000000701';
    const markierung: GeraeteEreignis = {
      typ: 'als_unsicher_markiert',
      messgeraet_id: GERAET,
      gilt_ab: '2027-01-12T08:00:00.000Z',
      storniert_am: null,
      daten: { datenart: 'demo', seit_kalibrierung_id: X },
    };
    const d = daten([kal(KAL_1_1, { id: X })], { ereignisse: [markierung] });
    expect(unsicher(d, '2027-01-10T09:00:00.000Z')).toBe(false);
  });
});

describe('G5 Datenart, Messgerät und Storno', () => {
  it('G5 Demo-Kalibrierung setzt die echte Fälligkeit nicht zurück', () => {
    // ohne feste Termine: echt 1.1. + 30 = 31.1., Demo 25.1. + 30 = 24.2.
    const d = daten([kal(KAL_1_1), kal('2027-01-25T08:00:00.000Z', { datenart: 'demo' })]);
    expect(stand(d, '2027-02-01T09:00:00.000Z')).toMatchObject({
      art: 'ueberfaellig',
      faelligAm: '2027-01-31',
      tageUeberfaellig: 1,
    });
    expect(stand(d, '2027-02-01T09:00:00.000Z', 'demo')).toMatchObject({ art: 'gueltig' });
  });

  it('R10.3 Demo-Messung zählt nur Demo-Kalibrierungen', () => {
    const nurEcht = daten([kal(KAL_1_1)]);
    expect(unsicher(nurEcht, '2027-01-10T09:00:00.000Z', 'demo')).toBe(true);
    expect(stand(nurEcht, '2027-01-10T09:00:00.000Z', 'demo')).toEqual({ art: 'erstkalibrierung' });
    const mitDemo = daten([kal(KAL_1_1), kal(KAL_1_1, { datenart: 'demo' })]);
    expect(unsicher(mitDemo, '2027-01-10T09:00:00.000Z', 'demo')).toBe(false);
  });

  it('R10.3 Kalibrierung eines anderen Messgeräts zählt nicht', () => {
    const d = daten([kal(KAL_1_1, { messgeraetId: ANDERES_GERAET })]);
    expect(unsicher(d, '2027-01-10T09:00:00.000Z')).toBe(true);
    expect(stand(d, '2027-01-10T09:00:00.000Z')).toEqual({ art: 'erstkalibrierung' });
    expect(unsicher(d, '2027-01-10T09:00:00.000Z', 'echt', ANDERES_GERAET)).toBe(false);
  });

  it('R10.3 stornierte Kalibrierung zählt nicht', () => {
    const d = daten([kal(KAL_1_1, { storniert: true })]);
    expect(unsicher(d, '2027-01-10T09:00:00.000Z')).toBe(true);
    expect(stand(d, '2027-01-10T09:00:00.000Z')).toEqual({ art: 'erstkalibrierung' });
  });

  it('R10.3 Demo-Ereignis «Sonde gereinigt» wirkt nicht auf echt', () => {
    // wie smoke3 C1: echte und Demo-Kalibrierung 1.1., Demo-Reinigung 5.1., Messungen 10.1.
    const d = daten([kal(KAL_1_1), kal(KAL_1_1, { datenart: 'demo' })], {
      ereignisse: [sondeGereinigt('2027-01-05T08:00:00.000Z', 'demo')],
      termine: TERMINE,
    });
    expect(unsicher(d, '2027-01-10T09:00:00.000Z', 'echt')).toBe(false);
    expect(unsicher(d, '2027-01-10T09:00:00.000Z', 'demo')).toBe(true);
    expect(stand(d, '2027-01-10T09:00:00.000Z', 'echt')).toMatchObject({
      art: 'gueltig',
      faelligAm: '2027-01-31',
    });
    expect(stand(d, '2027-01-10T09:00:00.000Z', 'demo')).toMatchObject({
      art: 'ueberfaellig',
      faelligAm: '2027-01-05',
    });
  });
});

describe('R5.2 Texte', () => {
  it('R5.2 Text: «seit 1 Tag überfällig», «seit 3 Tagen überfällig», «Kalibrierung gültig bis 31.1.»', () => {
    expect(
      kalibrierText({ art: 'ueberfaellig', letzte: KAL_1_1, faelligAm: '2027-01-31', tageUeberfaellig: 1 }),
    ).toBe('seit 1 Tag überfällig');
    expect(
      kalibrierText({ art: 'ueberfaellig', letzte: KAL_1_1, faelligAm: '2027-01-31', tageUeberfaellig: 3 }),
    ).toBe('seit 3 Tagen überfällig');
    expect(kalibrierText({ art: 'gueltig', letzte: KAL_1_1, faelligAm: '2027-01-31' })).toBe(
      'Kalibrierung gültig bis 31.1.',
    );
    expect(kalibrierText({ art: 'faellig', letzte: KAL_1_1, faelligAm: '2027-01-31' })).toBe(
      'Messgerät kalibrieren',
    );
    expect(kalibrierText({ art: 'erstkalibrierung' })).toBe('Erstkalibrierung');
  });

  it('R5.2 Text aus dem Stand: TZ3 zwei Tage später «seit 3 Tagen überfällig»', () => {
    const s = stand(daten([kal(KAL_1_1)]), '2027-02-03T09:00:00.000Z');
    expect(s).toMatchObject({ art: 'ueberfaellig', tageUeberfaellig: 3 });
    expect(kalibrierText(s)).toBe('seit 3 Tagen überfällig');
  });
});
