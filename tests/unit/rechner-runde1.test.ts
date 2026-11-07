// Zusatzfälle zu den Prüferbefunden Runde 1 von Plan 28 (#28). Erwartungen aus Konzept 7.3 (R4.2, R4.4, R4.7, R4.9,
// R4.11) und Plan 28 A15, nicht aus dem Code. Rahmen nach R4.12: ECWasser 0.50, k 0.300 je Komponente.
// Vertrag wie in den übrigen rechner-*.test.ts (Einheiten nach Plan 28, `bruch()` und `alsZahl()`).
import { describe, expect, it } from 'vitest';
import { kVorschlag } from '../../src/domain/rechner-korrektur.ts';
import { nachfuellen } from '../../src/domain/rechner-nachfuellen.ts';
import { HERSTELLERDOSIS, neuansatz, zielEc } from '../../src/domain/rechner.ts';
import { alsZahl, bruch, ecText, messmittel, runde } from '../../src/domain/rechner-zahlen.ts';

const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;
const W = HERSTELLERDOSIS.wachstum;
const g = (grow: number, micro: number, bloom: number) => ({ grow, micro_hard_water: micro, bloom });
const codes = (h: readonly { code: string }[]) => h.map((x) => x.code);

type NachfuellEingabe = Parameters<typeof nachfuellen>[0];
function nf(extra: Partial<NachfuellEingabe> = {}): NachfuellEingabe {
  return {
    volumen: 900,
    nachgefuellt: 200,
    ec1: 115,
    ecWasser: 50,
    zielbereich: { min: 100, max: 140 },
    k: K,
    dosis: W,
    dAnsatz: 233,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
    ...extra,
  } as NachfuellEingabe;
}

describe('Befund 1: keine negative Menge bei Wasser über dem Zielbereich (R4.2, R4.4)', () => {
  it('UC7-AK6 RF3 Zielbereich 0.6 bis 0.9 bei Wasser 0.95: ECZiel 0.95, alle Mengen 0, Leitungswasser zu hoch', () => {
    const r = neuansatz({
      volumen: 900,
      stadium: 'wachstum',
      zielbereich: { min: 60, max: 90 },
      ecWasser: 95,
      k: K,
      teilDosis: 100,
      istStation: false,
      ueberHerstellerdosisBestaetigt: false,
    });
    expect(r.art).toBe('ergebnis');
    if (r.art !== 'ergebnis') return;
    expect(r.ecZiel).toBe(95);
    expect(r.mengen).toEqual(g(0, 0, 0));
    expect(r.mengenTeil).toEqual(g(0, 0, 0));
    for (const c of ['grow', 'micro_hard_water', 'bloom'] as const) {
      expect(r.dosisVerwendet[c]).toBeGreaterThanOrEqual(0);
    }
    expect(codes(r.hinweise)).toContain('wasser_zu_hoch_fuer_gefaess');
  });

  it('UC7-AK12 RF3 Wasser genau auf der oberen Grenze 0.90, Zielbereich 0.6 bis 0.9: ECZiel 0.90', () => {
    const z = zielEc({ zielbereich: { min: 60, max: 90 }, ecSoll: bruch(198), ecWasser: 90 });
    expect(alsZahl(z.ecZiel)).toBe(90);
    expect(codes(z.hinweise)).toContain('wasser_zu_hoch_fuer_gefaess');
  });
});

describe('Befund 2: Grenze 1.5 · D_Ansatz in Hundertsteln (R4.9)', () => {
  it('UC7-AK4 EC1 1.10 ergibt d genau 3.50 = Grenze 1.5 · 2.33 in Hundertsteln: nicht gekappt', () => {
    // d = (10.8 − 7.7 − 1.0) / 0.6 = 3.50 ml/L
    const r = nachfuellen(nf({ ec1: 110 }));
    expect(r.dMlL).toBe(350);
    expect(codes(r.hinweise)).not.toContain('ziel_nicht_erreichbar');
    // 7.0 ml auf 2 l im Verhältnis 1.8 : 1.2 : 0.6
    expect(r.mengen).toEqual(g(35, 23, 12));
  });

  it('UC7-AK4 EC1 1.09 ergibt d 3.62 über 3.50: gekappt auf 3.50 mit «Ziel nicht ganz erreichbar»', () => {
    const r = nachfuellen(nf({ ec1: 109 }));
    expect(r.dMlL).toBe(350);
    expect(codes(r.hinweise)).toContain('ziel_nicht_erreichbar');
  });
});

describe('Befund 3: Zahlen und Texte (R4.11, A3)', () => {
  it('UC7-AK9 bruch wirft bei Nenner 0, Nicht-Ganzzahl und unsicherer Ganzzahl', () => {
    expect(() => bruch(1, 0)).toThrow();
    expect(() => bruch(1.5)).toThrow();
    expect(() => bruch(3, 0.5)).toThrow();
    expect(() => bruch(2 ** 53)).toThrow();
    expect(() => bruch(1, 2 ** 53)).toThrow();
    expect(() => bruch(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it('UC7-AK9 negativer Nenner wird normalisiert und gekürzt', () => {
    expect(alsZahl(bruch(1, -2))).toBe(-0.5);
    expect(alsZahl(bruch(-3, -6))).toBe(0.5);
    expect(alsZahl(bruch(4, 2))).toBe(2);
    expect(bruch(2, -4)).toEqual(bruch(-1, 2));
  });

  it('UC7-AK9 runde kaufmännisch nach Betrag: −1.5 → −2, −1.4 → −1, 1.5 → 2, 2.5 → 3', () => {
    expect(runde(bruch(-3, 2))).toBe(-2);
    expect(runde(bruch(-7, 5))).toBe(-1);
    expect(runde(bruch(3, 2))).toBe(2);
    expect(runde(bruch(5, 2))).toBe(3);
    expect(runde(bruch(7, 5))).toBe(1);
    expect(runde(bruch(0))).toBe(0);
  });

  it('UC7-AK9 messmittel mit unsortierter eigener Liste und mit leerer Liste', () => {
    expect(messmittel(105, [60, 1, 20, 5]).spritzeMl).toBe(20);
    expect(messmittel(8, [60, 5, 1]).spritzeMl).toBe(1);
    expect(messmittel(1500, [60, 5, 20, 1])).toMatchObject({ spritzeMl: 60, aufzuege: 3 });
    const leer = messmittel(105, []);
    expect(leer.spritzeMl).toBeNull();
    expect(leer.text).toContain('Messbecher');
  });

  it('UC7-AK9 ecText: 0 mit Vorzeichen ohne Zeichen, −1.20 mit Minuszeichen U+2212', () => {
    expect(ecText(0, { vorzeichen: true })).toBe('0.00 mS/cm');
    expect(ecText(-120)).toBe('−1.20 mS/cm');
    expect(ecText(5)).toBe('0.05 mS/cm');
  });
});

describe('Befund 4: Banner vor Datenart und «unsicher» (R4.7)', () => {
  const basis = {
    kontrolle: 99,
    ecSollIstKontrolle: 110,
    istDosis: bruch(200),
    endmessung: 151,
    ecSollIstGesamt: 120,
    ecWasser: 50,
    k: K,
    dosis: W,
    uEc: 10,
    unsicher: false,
    datenart: 'echt' as const,
  };

  it('UC7-AK15 Endmessung 1.51 bei ECSoll_ist 1.20 in Demo: Banner', () => {
    expect(kVorschlag({ ...basis, datenart: 'demo' })).toEqual({ art: 'banner' });
  });

  it('UC7-AK15 Endmessung 1.51 bei ECSoll_ist 1.20 mit «unsicher»: Banner', () => {
    expect(kVorschlag({ ...basis, unsicher: true })).toEqual({ art: 'banner' });
  });
});

describe('Befund 6: Nachfüllen ohne Liter und Zielwahl A15 (R4.9)', () => {
  it('UC7-AK4 nachgefuellt 0: keine Division, d 0, Mengen 0, Eingabe nötig', () => {
    const r = nachfuellen(nf({ nachgefuellt: 0 }));
    expect(r.dMlL).toBe(0);
    expect(r.mengen).toEqual(g(0, 0, 0));
    expect(codes(r.hinweise)).toContain('eingabe_noetig');
  });

  it('UC7-AK4 Wasser 1.15 über o − 0.30 bei Zielbereich 1.0 bis 1.4: Ziel 1.40 (A15)', () => {
    // d = (1.40 · 9 − 1.20 · 7 − 1.15 · 2) / (0.3 · 2) = (12.6 − 8.4 − 2.3) / 0.6 = 3.17 ml/L
    const r = nachfuellen(nf({ ec1: 120, ecWasser: 115 }));
    expect(r.dMlL).toBe(317);
    expect(codes(r.hinweise)).not.toContain('ziel_nicht_erreichbar');
    // 6.33 ml auf 2 l: 3.17 / 2.11 / 1.06 ml
    expect(r.mengen).toEqual(g(32, 21, 11));
  });

  it('UC7-AK4 Bandmitte 0.80 unter Wasser 0.55 + 0.30 wird auf 0.85 angehoben (A15)', () => {
    // Zielbereich 0.6 bis 1.0; d = (0.85 · 9 − 0.80 · 7 − 0.55 · 2) / 0.6 = (7.65 − 5.6 − 1.1) / 0.6 = 1.58 ml/L
    const r = nachfuellen(nf({ zielbereich: { min: 60, max: 100 }, ecWasser: 55, ec1: 80 }));
    expect(r.dMlL).toBe(158);
    // 3.17 ml auf 2 l: 1.58 / 1.06 / 0.53 ml
    expect(r.mengen).toEqual(g(16, 11, 5));
  });
});
