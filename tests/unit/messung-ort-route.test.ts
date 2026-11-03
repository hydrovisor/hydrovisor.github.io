// Ort aus dem Code R-2.3 und Routen der Messmaske (Plan 12 Testliste, Regel «Code»; R9.1, R9.2 Teil;
// 04_architektur.md 3). Teile des Bündels in der Form von PostgREST (snake_case).
import { describe, expect, it } from 'vitest';
import { messbareOrte, ortAufloesen } from '../../src/domain/ort.ts';
import { hashZu, maskeFuer, routeAusHash, type Route } from '../../src/ui/router.ts';

const A_R = '0f0f0f0f-0000-4000-8000-0000000000a1';
const A_Y = '0f0f0f0f-0000-4000-8000-0000000000a2';
const A_Q = '0f0f0f0f-0000-4000-8000-0000000000a3';
const A_S = '0f0f0f0f-0000-4000-8000-0000000000a4';

const anlage = (id: string, kuerzel: string, datenart: string, weiter: Record<string, unknown> = {}) => ({
  id,
  kuerzel,
  name: `Anlage ${kuerzel}`,
  datenart,
  aktiv: true,
  storniert_am: null,
  ...weiter,
});

const platz = (id: string, anlageId: string, kennung: string, rolle: string, aktiv = true) => ({
  id,
  anlage_id: anlageId,
  bereich_id: null,
  kennung,
  rolle,
  aktiv,
  storniert_am: null,
});

const gefaess = (
  id: string,
  platzId: string,
  betriebsart: string,
  intervall: number,
  gueltigBis: string | null = null,
) => ({
  id,
  platz_id: platzId,
  betriebsart,
  intervall_messen_d: intervall,
  gueltig_von: '2027-01-05T08:00:00.000Z',
  gueltig_bis: gueltigBis,
  storniert_am: null,
});

const TEILE: Record<string, readonly unknown[]> = {
  anlage: [
    anlage(A_R, 'R', 'echt'),
    anlage(A_Y, 'Y', 'test'),
    anlage(A_Q, 'Q', 'echt', { storniert_am: '2027-01-02T08:00:00.000Z' }),
    anlage(A_S, 'S', 'echt', { aktiv: false }),
  ],
  platz: [
    platz('p-r-23-alt', A_R, '2.3', 'gefaess', false),
    platz('p-r-23', A_R, '2.3', 'gefaess'),
    platz('p-r-24', A_R, '2.4', 'gefaess', false),
    platz('p-r-31', A_R, '3.1', 'gefaess'),
    platz('p-r-w', A_R, 'W', 'messstelle'),
    platz('p-r-a1', A_R, 'A1', 'anzuchtort'),
    platz('p-r-l', A_R, 'L1', 'lager'),
    platz('p-y-23', A_Y, '2.3', 'gefaess'),
    platz('p-q-23', A_Q, '2.3', 'gefaess'),
    platz('p-s-23', A_S, '2.3', 'gefaess'),
  ],
  gefaess: [
    gefaess('g-r-23-alt', 'p-r-23-alt', 'kratky', 7, '2027-01-04T08:00:00.000Z'),
    gefaess('g-r-23', 'p-r-23', 'dwc', 2),
    gefaess('g-r-24', 'p-r-24', 'dwc', 2),
    // 3.1 ohne aktive Belegung: die einzige Zeile ist geschlossen
    gefaess('g-r-31', 'p-r-31', 'dwc', 2, '2027-01-10T08:00:00.000Z'),
    gefaess('g-y-23', 'p-y-23', 'kratky_belueftet', 7),
    gefaess('g-q-23', 'p-q-23', 'dwc', 2),
    gefaess('g-s-23', 'p-s-23', 'dwc', 2),
  ],
  anzuchtort: [{ id: 'z-r-a1', platz_id: 'p-r-a1', typ: 'box_licht', storniert_am: null }],
  v_gefaess_status: [
    { gefaess_id: 'g-r-23', status: 'in_betrieb' },
    { gefaess_id: 'g-y-23', status: 'in_betrieb' },
  ],
  v_fuellzustand: [
    { platz_id: 'p-r-23', fuellzustand: 'loesung' },
    { platz_id: 'p-y-23', fuellzustand: 'loesung' },
  ],
};

describe('R9.1 Code auflösen', () => {
  it('R9.1 R-2.3 löst den aktiven Platz 2.3 der Anlage R auf; inaktiver Platz und stornierte Anlage nicht', () => {
    expect(ortAufloesen('R-2.3', TEILE)).toMatchObject({
      code: 'R-2.3',
      platzId: 'p-r-23',
      kennung: '2.3',
      rolle: 'gefaess',
      anlageId: A_R,
      datenart: 'echt',
      betriebsart: 'dwc',
      intervallMessenD: 2,
    });
    expect(ortAufloesen('R-2.4', TEILE)).toBeUndefined();
    expect(ortAufloesen('Q-2.3', TEILE)).toBeUndefined();
    expect(ortAufloesen('S-2.3', TEILE)).toBeUndefined();
    expect(ortAufloesen('R-9.9', TEILE)).toBeUndefined();
    expect(ortAufloesen('', TEILE)).toBeUndefined();
  });

  it('R9.1 Y-2.3 trägt Datenart test', () => {
    expect(ortAufloesen('Y-2.3', TEILE)).toMatchObject({
      code: 'Y-2.3',
      platzId: 'p-y-23',
      anlageId: A_Y,
      datenart: 'test',
      betriebsart: 'kratky_belueftet',
      intervallMessenD: 7,
    });
  });

  it('R9.1 Messstelle und Anzuchtort werden aufgelöst und tragen ihre Rolle', () => {
    expect(ortAufloesen('R-W', TEILE)).toMatchObject({ code: 'R-W', platzId: 'p-r-w', rolle: 'messstelle' });
    expect(ortAufloesen('R-A1', TEILE)).toMatchObject({ code: 'R-A1', rolle: 'anzuchtort' });
  });

  it('R9.1 ohne Teile kein Ort', () => {
    expect(ortAufloesen('R-2.3', {})).toBeUndefined();
  });
});

describe('R9.1 messbare Orte', () => {
  it('R9.1 messbareOrte: Gefässe mit aktiver Belegung und Messstelle W, keine Anzuchtorte', () => {
    const orte = messbareOrte(TEILE);
    const codes = orte.map((o) => o.code).sort();
    expect(codes).toEqual(['R-2.3', 'R-W', 'Y-2.3']);
    const y = orte.find((o) => o.code === 'Y-2.3');
    expect(y).toMatchObject({ datenart: 'test', rolle: 'gefaess' });
  });

  it('R9.1 messbareOrte ohne Teile: leere Liste', () => {
    expect(messbareOrte({})).toEqual([]);
  });
});

describe('Routen messen und kalibrieren', () => {
  it('Router #/messen/R-2.3 → messen mit code; #/kalibrieren?datenart=demo → kalibrieren demo; ohne Sitzung → Anmeldung', () => {
    expect(routeAusHash('#/messen/R-2.3')).toEqual({ name: 'messen', code: 'R-2.3' });
    expect(routeAusHash('#/messen/Y-W')).toEqual({ name: 'messen', code: 'Y-W' });
    expect(routeAusHash('#/kalibrieren')).toEqual({ name: 'kalibrieren' });
    expect(routeAusHash('#/kalibrieren?datenart=demo')).toEqual({ name: 'kalibrieren', datenart: 'demo' });
    expect(routeAusHash('#/kalibrieren?datenart=test')).toEqual({ name: 'kalibrieren', datenart: 'test' });

    const messen: Route = { name: 'messen', code: 'R-2.3' };
    const kalibrieren: Route = { name: 'kalibrieren', datenart: 'demo' };
    expect(maskeFuer(messen, 'abgemeldet')).toEqual({ name: 'anmelden' });
    expect(maskeFuer(kalibrieren, 'abgemeldet')).toEqual({ name: 'anmelden' });
    expect(maskeFuer(messen, 'angemeldet')).toEqual(messen);
    expect(maskeFuer(kalibrieren, 'angemeldet')).toEqual(kalibrieren);
  });

  it('Router Hash und Route passen hin und zurück', () => {
    for (const route of [
      { name: 'messen', code: 'R-2.3' },
      { name: 'kalibrieren' },
      { name: 'kalibrieren', datenart: 'test' },
    ] as Route[])
      expect(routeAusHash(hashZu(route))).toEqual(route);
    expect(hashZu({ name: 'messen', code: 'R-2.3' })).toBe('#/messen/R-2.3');
  });
});
