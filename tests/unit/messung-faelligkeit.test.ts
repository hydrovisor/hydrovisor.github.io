// Messfälligkeit je Ort (Plan 12 Testliste; R5.2 Zeilen «Messen und nachfüllen» und «Messen», R5.4, G2;
// 06_tests.md 6 Testmatrix). faelligAm = Kalendertag der letzten Messung am Platz + intervall_messen_d.
// Injizierte Uhr: Zeitpunkte als UTC-ISO, Zeitzone Europe/Zurich als Parameter.
import { describe, expect, it } from 'vitest';
import { messFaelligkeit } from '../../src/domain/messung/faelligkeit.ts';

const ZUERICH = 'Europe/Zurich';
const PLATZ = '0d0d0d0d-0000-4000-8000-000000000311';
const ANDERER_PLATZ = '0d0d0d0d-0000-4000-8000-000000000312';

const ort = (
  intervallMessenD: number | null,
  weiter: { fuellzustand?: 'leer' | 'loesung'; status?: string } = {},
) => ({
  platzId: PLATZ,
  intervallMessenD,
  fuellzustand: weiter.fuellzustand ?? ('loesung' as const),
  status: weiter.status ?? 'in_betrieb',
});

const messung = (giltAb: string, weiter: { platzId?: string; storniert?: boolean } = {}) => ({
  platz_id: weiter.platzId ?? PLATZ,
  gilt_ab: giltAb,
  storniert_am: weiter.storniert ? '2027-01-19T12:00:00.000Z' : null,
});

const faelligkeit = (o: ReturnType<typeof ort>, messungen: ReturnType<typeof messung>[], stichtag: string) =>
  messFaelligkeit(o, messungen, new Date(stichtag), ZUERICH);

describe('R5.2 letzte Messung + Intervall', () => {
  it('R5.2 letzte Messung 10.1. 18:00, Intervall 2: am 11.1. nicht fällig, am 12.1. fällig, am 14.1. seit 2 Tagen', () => {
    // 10.1. 18:00 Zürich = 17:00Z
    const messungen = [messung('2027-01-10T17:00:00.000Z')];
    expect(faelligkeit(ort(2), messungen, '2027-01-11T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-12',
      faellig: false,
      tageUeberfaellig: 0,
    });
    expect(faelligkeit(ort(2), messungen, '2027-01-12T07:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-12',
      faellig: true,
      tageUeberfaellig: 0,
    });
    expect(faelligkeit(ort(2), messungen, '2027-01-14T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-12',
      faellig: true,
      tageUeberfaellig: 2,
    });
  });

  it('R5.2 Kratky Intervall 7: Messung vor 6 Tagen nicht fällig, vor 7 Tagen fällig', () => {
    // heute 20.1. 12:00 Zürich
    const heute = '2027-01-20T11:00:00.000Z';
    expect(faelligkeit(ort(7), [messung('2027-01-14T09:00:00.000Z')], heute)).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-21',
      faellig: false,
    });
    expect(faelligkeit(ort(7), [messung('2027-01-13T09:00:00.000Z')], heute)).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-20',
      faellig: true,
      tageUeberfaellig: 0,
    });
  });

  it('R5.2 ohne Messung fällig heute', () => {
    expect(faelligkeit(ort(2), [], '2027-01-20T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-20',
      faellig: true,
      tageUeberfaellig: 0,
    });
  });

  it('R5.2 stornierte Messung zählt nicht', () => {
    const messungen = [
      messung('2027-01-15T09:00:00.000Z'),
      messung('2027-01-19T09:00:00.000Z', { storniert: true }),
    ];
    expect(faelligkeit(ort(2), messungen, '2027-01-20T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-17',
      faellig: true,
      tageUeberfaellig: 3,
    });
  });

  it('R5.2 Messung eines anderen Orts zählt nicht', () => {
    const messungen = [
      messung('2027-01-15T09:00:00.000Z'),
      messung('2027-01-19T09:00:00.000Z', { platzId: ANDERER_PLATZ }),
    ];
    expect(faelligkeit(ort(2), messungen, '2027-01-20T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-17',
      tageUeberfaellig: 3,
    });
  });

  it('R5.2 die jüngste Messung zählt, unabhängig von der Reihenfolge', () => {
    const messungen = [messung('2027-01-19T09:00:00.000Z'), messung('2027-01-15T09:00:00.000Z')];
    expect(faelligkeit(ort(2), messungen, '2027-01-20T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-21',
      faellig: false,
    });
  });
});

describe('R5.4 keine Messfälligkeit', () => {
  const messungen = [messung('2027-01-10T09:00:00.000Z')];

  it('R5.4 Füllzustand leer: keine Messfälligkeit', () => {
    expect(faelligkeit(ort(2, { fuellzustand: 'leer' }), messungen, '2027-01-20T11:00:00.000Z')).toEqual({
      art: 'keine',
      grund: 'leer',
    });
  });

  it('R5.4 Gefäss ruht: keine Messfälligkeit', () => {
    expect(faelligkeit(ort(2, { status: 'ruht' }), messungen, '2027-01-20T11:00:00.000Z')).toEqual({
      art: 'keine',
      grund: 'ruht',
    });
  });

  it('R5.4 ohne aktives Gefäss (kein Intervall): keine Messfälligkeit', () => {
    expect(faelligkeit(ort(null), messungen, '2027-01-20T11:00:00.000Z')).toEqual({
      art: 'keine',
      grund: 'kein_gefaess',
    });
  });
});

describe('G2 Kalendertage in Zürich', () => {
  it('G2 Messung 27.3.2027 23:30, Intervall 2: fällig 29.3.', () => {
    // 27.3. 23:30 MEZ = 22:30Z; in der Nacht auf den 28.3. beginnt die Sommerzeit
    const messungen = [messung('2027-03-27T22:30:00.000Z')];
    expect(faelligkeit(ort(2), messungen, '2027-03-28T20:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-03-29',
      faellig: false,
    });
    // 29.3. 12:00 MESZ = 10:00Z
    expect(faelligkeit(ort(2), messungen, '2027-03-29T10:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-03-29',
      faellig: true,
      tageUeberfaellig: 0,
    });
  });

  it('G2 Messung 00:30 Zürich zählt zum Zürcher Tag', () => {
    // 11.1. 00:30 Zürich = 10.1. 23:30Z: zählt zum 11.1., also fällig am 13.1. und nicht am 12.1.
    const messungen = [messung('2027-01-10T23:30:00.000Z')];
    expect(faelligkeit(ort(2), messungen, '2027-01-12T11:00:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-13',
      faellig: false,
    });
  });

  it('G2 Stichtag 00:30 Zürich zählt zum Zürcher Tag', () => {
    // Stichtag 12.1. 00:30 Zürich = 11.1. 23:30Z: in Zürich schon der 12.1., also fällig
    const messungen = [messung('2027-01-10T17:00:00.000Z')];
    expect(faelligkeit(ort(2), messungen, '2027-01-11T23:30:00.000Z')).toMatchObject({
      art: 'offen',
      faelligAm: '2027-01-12',
      faellig: true,
    });
  });
});
