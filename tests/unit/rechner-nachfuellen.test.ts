// Nachfüllen, Verdünnen, Kratky belüftet und Messung für den Rechner (Plan 28 Testliste; UC7-AK4, AK5, AK8, AK10,
// AK13; RF4, RF5, RF6; R4.4, R4.5, R4.9, R4.10, R10.3). Rahmen nach R4.12: ECWasser 0.50, k 0.300 je Komponente.
// Erwartungen aus Konzept 7.3, UC7 und 06_tests.md Abschnitt 4, nicht aus dem Code. Uhr injiziert, Europe/Zurich.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 28 offen ist):
// - Einheiten wie Plan «Einheiten und Signaturen»: Volumen in Hundertsteln l, `dMlL` und `dAnsatz` in Hundertsteln
//   ml/L, Mengen in Zehnteln ml, Liter der Ergebnisse (`noetig`, `liter`, `hoechstensLiter`) in Zehnteln l.
// - `kannenLiter(ganze, kanne, teilkanne)`: Kanne und Teilkanne in Hundertsteln l.
// - `nachfuellen(...)` liefert wie `neuansatz` `kontrolleFolgetag` (UC7-AK13 «je Liter Nachfüllwasser»); der Hinweis
//   `ziel_nicht_erreichbar` nennt die erwartete EC mit zwei Dezimalen.
// - `messungFuerRechner`: Messungen haben die Form von `istVeraltet` (`id`, `platz_id`, `gilt_ab`, `ansatz_id`).
import { describe, expect, it } from 'vitest';
import type { AnsatzZeile } from '../../src/domain/bewertung/verlauf.ts';
import { HERSTELLERDOSIS, stationsDosis } from '../../src/domain/rechner.ts';
import {
  kannenLiter,
  kratkyNachfuellen,
  messungFuerRechner,
  nachfuellen,
  verduennen,
} from '../../src/domain/rechner-nachfuellen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';

const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;
const g = (grow: number, micro: number, bloom: number) => ({ grow, micro_hard_water: micro, bloom });
const codes = (h: readonly { code: string }[]) => h.map((x) => x.code);

type NachfuellEingabe = Parameters<typeof nachfuellen>[0];

// UC7-AK4: 2.3, V 9 l, eine 2-l-Kanne, EC1 1.15, Zielbereich 1.0 bis 1.4 (Ziel 1.20), D_Ansatz 2.33
function nf(extra: Partial<NachfuellEingabe> = {}): NachfuellEingabe {
  return {
    volumen: 900,
    nachgefuellt: 200,
    ec1: 115,
    ecWasser: 50,
    zielbereich: { min: 100, max: 140 },
    k: K,
    dosis: HERSTELLERDOSIS.wachstum,
    dAnsatz: 233,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
    ...extra,
  } as NachfuellEingabe;
}

describe('nachfuellen (R4.9, R4.4, R4.5)', () => {
  it('UC7-AK4 Nachfüllen 2.3 mit 2-l-Kanne: d 2.92 ml/L unter 3.50, 2.9 / 1.9 / 1.0 ml', () => {
    const r = nachfuellen(nf());
    expect(r.dMlL).toBe(292);
    expect(r.mengen).toEqual(g(29, 19, 10));
    expect(r.nurWasser).toBe(false);
    expect(codes(r.hinweise)).not.toContain('ziel_nicht_erreichbar');
    expect(r.messmittel.grow.spritzeMl).toBe(5);
    expect(r.kontrolleFolgetag).toBe(false);
  });

  it('UC7-AK4 Grenzfall genau 1.5 · D_Ansatz bleibt, darüber «Ziel nicht ganz erreichbar»', () => {
    // EC1 1.14: d = (10.8 − 7.98 − 1.0) / 0.6 = 3.033 → 3.03 ml/L
    const genau = nachfuellen(nf({ ec1: 114, dAnsatz: 202 })); // 2 · 3.03 = 3 · 2.02
    expect(genau.dMlL).toBe(303);
    expect(codes(genau.hinweise)).not.toContain('ziel_nicht_erreichbar');
    const darueber = nachfuellen(nf({ ec1: 114, dAnsatz: 200 })); // Grenze 3.00 ml/L
    expect(darueber.dMlL).toBe(300);
    expect(darueber.mengen).toEqual(g(30, 20, 10));
    const h = darueber.hinweise.find((x) => x.code === 'ziel_nicht_erreichbar');
    // erwartete EC (1.14 · 7 + (0.5 + 0.3 · 3.0) · 2) / 9 = 1.198 → 1.20
    expect(h?.text).toContain('Ziel nicht ganz erreichbar');
    expect(h?.text).toContain('1.20');
  });

  it('UC7-AK4 d ≤ 0 → «nur Wasser»: EC1 1.40 ergibt d = 0, EC1 1.50 negativ, EC1 1.39 eine kleine Dosis', () => {
    for (const ec1 of [140, 150]) {
      const r = nachfuellen(nf({ ec1 }));
      expect(r.nurWasser).toBe(true);
      expect(r.dMlL).toBe(0);
      expect(r.mengen).toEqual(g(0, 0, 0));
      expect(codes(r.hinweise)).toContain('nur_wasser');
    }
    // d = (9.8 − 9.73) / 0.6 = 0.117 ml/L auf 2 l = 0.233 ml → keine Komponente auf 0
    const klein = nachfuellen(nf({ ec1: 139 }));
    expect(klein.nurWasser).toBe(false);
    expect(klein.dMlL).toBe(12);
    expect(klein.mengen).toEqual(g(1, 1, 1));
  });

  it('UC7-AK4 Station füllt mit fester Dosis je Liter nach (R4.5)', () => {
    const e = nf({ istStation: true, dosis: stationsDosis('wurzeln_keimung'), dAnsatz: 150, volumen: 300 });
    const ein = nachfuellen({ ...e, nachgefuellt: 100, ec1: 90 });
    expect(ein.dMlL).toBe(150);
    expect(ein.mengen).toEqual(g(5, 5, 5));
    // auch bei hoher EC1 keine Formel: feste Dosis je Liter
    const zwei = nachfuellen({ ...e, nachgefuellt: 200, ec1: 110 });
    expect(zwei.mengen).toEqual(g(10, 10, 10));
  });

  it('UC7-AK13 Dosis über 5.5 ml/L oder 1.2 · D nur mit Bestätigung und mit Kontrollmessung am Folgetag (Nachfüllen)', () => {
    // EC1 0.80: d = (9.8 − 5.6) / 0.6 = 7.0 ml/L; Grenzen 1.5 · 4.00 = 6.00 und R4.4 min(5.5, 1.2 · 3.6) = 4.32
    const ohne = nachfuellen(nf({ ec1: 80, dAnsatz: 400 }));
    expect(ohne.dMlL).toBe(432);
    expect(codes(ohne.hinweise)).toContain('ziel_nicht_erreichbar');
    expect(ohne.kontrolleFolgetag).toBe(false);
    // Bestätigung hebt R4.4 auf, aber nicht 1.5 · D_Ansatz (A16)
    const mit = nachfuellen(nf({ ec1: 80, dAnsatz: 400, ueberHerstellerdosisBestaetigt: true }));
    expect(mit.dMlL).toBe(600);
    expect(codes(mit.hinweise)).toContain('ueber_herstellerdosis');
    expect(codes(mit.hinweise)).toContain('ziel_nicht_erreichbar');
    expect(mit.kontrolleFolgetag).toBe(true);
  });

  it('UC7-AK13 Nachfüllen genau auf der Grenze R4.4 ohne Bestätigung möglich, ein Hundertstel EC1 tiefer gekappt', () => {
    // Dosis 2.5 ml/L: Grenze 1.2 · D = 3.00 ml/L. 10 l, 2-l-Kanne, Ziel 1.20:
    // EC1 1.15 → d = (12.0 − 9.2 − 1.0) / 0.6 = 3.00 genau; EC1 1.14 → 3.13 → gekappt auf 3.00
    const dosis = g(125, 83, 42);
    const auf = nachfuellen(nf({ dosis, volumen: 1000, ec1: 115, dAnsatz: 400 }));
    expect(auf.dMlL).toBe(300);
    expect(codes(auf.hinweise)).not.toContain('ziel_nicht_erreichbar');
    const darueber = nachfuellen(nf({ dosis, volumen: 1000, ec1: 114, dAnsatz: 400 }));
    expect(darueber.dMlL).toBe(300);
    expect(codes(darueber.hinweise)).toContain('ziel_nicht_erreichbar');
    expect(darueber.kontrolleFolgetag).toBe(false);
  });

  it('UC7-AK4 kannenLiter: ganze Kannen plus Teilkanne', () => {
    expect(kannenLiter(1, 200, 0)).toBe(200);
    expect(kannenLiter(2, 200, 50)).toBe(450);
    expect(kannenLiter(0, 1000, 75)).toBe(75);
  });
});

describe('verduennen (R4.9)', () => {
  it('UC7-AK5 RF6 Verdünnen 6 l mit 1.5: 2.6 l nötig, gekappt auf 2.0 l, erwartet 1.25', () => {
    expect(verduennen({ v1: 600, ec1: 150, ecZiel: 120, ecWasser: 50, betriebsvolumen: 800 })).toEqual({
      art: 'wasser',
      noetig: 26,
      liter: 20,
      gekappt: true,
      ecErwartet: 125,
    });
  });

  it('UC7-AK12 RF6 ohne Kappung bei freiem Volumen 4 l: 2.6 l, erwartet 1.20', () => {
    expect(verduennen({ v1: 600, ec1: 150, ecZiel: 120, ecWasser: 50, betriebsvolumen: 1000 })).toMatchObject(
      {
        art: 'wasser',
        noetig: 26,
        liter: 26,
        gekappt: false,
        ecErwartet: 120,
      },
    );
  });

  it('UC7-AK5 RF4 Ziel 0.5 = Wasser und Ziel 0.4: nicht erreichbar ohne Division', () => {
    expect(verduennen({ v1: 600, ec1: 150, ecZiel: 50, ecWasser: 50, betriebsvolumen: 800 })).toEqual({
      art: 'nicht_erreichbar',
    });
    expect(verduennen({ v1: 600, ec1: 150, ecZiel: 40, ecWasser: 50, betriebsvolumen: 800 })).toEqual({
      art: 'nicht_erreichbar',
    });
  });

  it('UC7-AK12 RF4 Ziel ein Hundertstel über dem Wasser ist erreichbar', () => {
    const r = verduennen({ v1: 600, ec1: 150, ecZiel: 51, ecWasser: 50, betriebsvolumen: 100000 });
    expect(r.art).toBe('wasser');
  });

  it('UC7-AK5 RF5 EC1 = Ziel 1.2: kein Verdünnen nötig, 0 l', () => {
    expect(verduennen({ v1: 600, ec1: 120, ecZiel: 120, ecWasser: 50, betriebsvolumen: 800 })).toEqual({
      art: 'kein_verduennen_noetig',
      liter: 0,
    });
  });

  it('UC7-AK12 RF5 Reihenfolge: EC1 ≤ ECZiel zuerst, auch wenn das Ziel unter dem Wasser liegt; EC1 1.21 verdünnt', () => {
    expect(verduennen({ v1: 600, ec1: 40, ecZiel: 40, ecWasser: 50, betriebsvolumen: 800 })).toEqual({
      art: 'kein_verduennen_noetig',
      liter: 0,
    });
    // 6 · 0.01 / 0.70 = 0.086 l → 0.1 l
    expect(verduennen({ v1: 600, ec1: 121, ecZiel: 120, ecWasser: 50, betriebsvolumen: 800 })).toMatchObject({
      art: 'wasser',
      noetig: 1,
      liter: 1,
      gekappt: false,
      ecErwartet: 120,
    });
  });
});

describe('kratkyNachfuellen (R4.10)', () => {
  const basis = {
    fuellstand: 'unter_drittel' as const,
    ecIst: 120,
    zielbereich: { min: 100, max: 140 },
    dAnsatz: 360,
    innenLMm: 400,
    innenBMm: 300,
  };

  it('UC7-AK8 Kratky belüftet über dem Band: nur Wasser, höchstens 2.5 cm (40 × 30 cm 3.0 l)', () => {
    expect(kratkyNachfuellen({ ...basis, ecIst: 141 })).toEqual({ art: 'nur_wasser', hoechstensLiter: 30 });
  });

  it('UC7-AK8 Füllstand über einem Drittel: keine Aufgabe Nachfüllen Kratky', () => {
    expect(kratkyNachfuellen({ ...basis, fuellstand: 'ueber_drittel' })).toEqual({ art: 'keine_aufgabe' });
    expect(kratkyNachfuellen({ ...basis, fuellstand: 'ueber_drittel', ecIst: 141 })).toEqual({
      art: 'keine_aufgabe',
    });
  });

  it('UC7-AK8 im und unter dem Band halbe Konzentration der Satzdosis; obere Grenze 1.40 zählt zum Band', () => {
    expect(kratkyNachfuellen({ ...basis, ecIst: 140 })).toEqual({
      art: 'halbe_konzentration',
      dMlL: 180,
      hoechstensLiter: 30,
    });
    expect(kratkyNachfuellen({ ...basis, ecIst: 90 })).toMatchObject({
      art: 'halbe_konzentration',
      dMlL: 180,
    });
  });

  it('UC7-AK8 höchstens 2.5 cm aus den Innenmassen: 30 × 20 cm 1.5 l, 38 × 28 cm 2.66 l → 2.7 l', () => {
    expect(kratkyNachfuellen({ ...basis, ecIst: 141, innenLMm: 300, innenBMm: 200 })).toEqual({
      art: 'nur_wasser',
      hoechstensLiter: 15,
    });
    expect(kratkyNachfuellen({ ...basis, ecIst: 141, innenLMm: 380, innenBMm: 280 })).toEqual({
      art: 'nur_wasser',
      hoechstensLiter: 27,
    });
  });
});

describe('messungFuerRechner (R4.9, R10.3)', () => {
  const PLATZ = '00000000-0000-4000-8000-000000000023';
  const ANDERER = '00000000-0000-4000-8000-000000000021';
  // jetzt = 12.1.2027 18:00 Zürich
  const JETZT = new Date('2027-01-12T17:00:00Z');
  const messung = (id: string, giltAb: string, platz = PLATZ) => ({
    id,
    platz_id: platz,
    gilt_ab: giltAb,
    ansatz_id: null,
  });
  const ansatz = (typ: AnsatzZeile['typ'], begonnenAm: string): AnsatzZeile => ({
    id: '00000000-0000-4000-8000-0000000000a1',
    platz_id: PLATZ,
    typ,
    status: 'abgeschlossen',
    begonnen_am: begonnenAm,
    kontrollmessung_id: null,
    endmessung_id: null,
    storniert_am: null,
  });

  it('UC7-AK10 nach gespeichertem Nachfüllen ist die Messung davor veraltet und der Rechner verlangt eine neue', () => {
    const m = messung('00000000-0000-4000-8000-0000000000b0', '2027-01-12T07:00:00Z');
    const frisch = messungFuerRechner({ platzId: PLATZ, messungen: [m], ansaetze: [] }, JETZT, ZEITZONE);
    expect(frisch).toMatchObject({ art: 'messung', messung: { id: m.id } });
    const nach = messungFuerRechner(
      { platzId: PLATZ, messungen: [m], ansaetze: [ansatz('nachfuellen', '2027-01-12T08:00:00Z')] },
      JETZT,
      ZEITZONE,
    );
    expect(nach).toEqual({ art: 'neue_messung_noetig', grund: 'veraltet' });
  });

  it('UC7-AK10 nach dem Nachfüllen gilt die neue Messung desselben Tages', () => {
    const alt = messung('00000000-0000-4000-8000-0000000000b1', '2027-01-12T07:00:00Z');
    const neu = messung('00000000-0000-4000-8000-0000000000b2', '2027-01-12T08:30:00Z');
    const r = messungFuerRechner(
      { platzId: PLATZ, messungen: [neu, alt], ansaetze: [ansatz('nachfuellen', '2027-01-12T08:00:00Z')] },
      JETZT,
      ZEITZONE,
    );
    expect(r).toMatchObject({ art: 'messung', messung: { id: neu.id } });
  });

  it('UC7-AK10 Messung vom Vortag in Zürich → nicht_heute, Messung kurz nach Mitternacht Zürich gilt', () => {
    // 11.1. 23:30 Zürich = 22:30 UTC
    const vortag = messung('00000000-0000-4000-8000-0000000000b3', '2027-01-11T22:30:00Z');
    expect(
      messungFuerRechner({ platzId: PLATZ, messungen: [vortag], ansaetze: [] }, JETZT, ZEITZONE),
    ).toEqual({
      art: 'neue_messung_noetig',
      grund: 'nicht_heute',
    });
    // 12.1. 00:15 Zürich = 11.1. 23:15 UTC
    const heute = messung('00000000-0000-4000-8000-0000000000b4', '2027-01-11T23:15:00Z');
    expect(
      messungFuerRechner({ platzId: PLATZ, messungen: [heute], ansaetze: [] }, JETZT, ZEITZONE),
    ).toMatchObject({
      art: 'messung',
      messung: { id: heute.id },
    });
  });

  it('UC7-AK10 ohne Messung des Platzes: keine; Messung eines anderen Platzes zählt nicht', () => {
    expect(messungFuerRechner({ platzId: PLATZ, messungen: [], ansaetze: [] }, JETZT, ZEITZONE)).toEqual({
      art: 'neue_messung_noetig',
      grund: 'keine',
    });
    const fremd = messung('00000000-0000-4000-8000-0000000000b5', '2027-01-12T07:00:00Z', ANDERER);
    expect(messungFuerRechner({ platzId: PLATZ, messungen: [fremd], ansaetze: [] }, JETZT, ZEITZONE)).toEqual(
      {
        art: 'neue_messung_noetig',
        grund: 'keine',
      },
    );
  });

  it('UC7-AK10 Teilwechsel macht die Messung nicht veraltet (R10.3, A14 aus Plan 26)', () => {
    const m = messung('00000000-0000-4000-8000-0000000000b6', '2027-01-12T07:00:00Z');
    const r = messungFuerRechner(
      { platzId: PLATZ, messungen: [m], ansaetze: [ansatz('teilwechsel', '2027-01-12T08:00:00Z')] },
      JETZT,
      ZEITZONE,
    );
    expect(r.art).toBe('messung');
  });
});
