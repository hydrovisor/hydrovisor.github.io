// Nachfüllen im Rundgang (Plan 30 Testliste; Rundgang-AK1c, R4.9, R4.10, R4.11; A13): Kannenwahl, Dosis aus
// nachfuellen() mit der Rundgang-Messung als EC1, Sperre ohne Messung desselben Tages, Kratky unter einem Drittel,
// Vorgang «Ansatz nachfüllen» mit Positionen. Regal R aus tests/fixtures/rundgang.ts (2.1 DWC 30 l, Zielbereich
// EC 1.0–1.4, ECWasser 0.50, k 0.300; 3.1 Kratky belüftet EC 0.8–1.2, Innenmass 365 × 265 mm).
// Uhr Di 12.1.2027 09:00 Zürich.
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import { messmittelJe } from '../../src/domain/rechner.ts';
import { kratkyNachfuellen, type NachfuellErgebnis } from '../../src/domain/rechner-nachfuellen.ts';
import {
  kannenWahl,
  kratkySchritt,
  nachfuellSchritt,
  nachfuellVorgang,
} from '../../src/domain/rundgang/nachfuellen.ts';
import { platzId, uid } from '../fixtures/regal.ts';
import { JETZT, rundgangMessungDazu, rundgangTeile, VOLUMEN_21_L } from '../fixtures/rundgang.ts';

const ZONE = 'Europe/Zurich';
const P21 = platzId('2.1');
const P31 = platzId('3.1');

type Messzeile = Parameters<typeof nachfuellSchritt>[2];
const ergebnis = (r: ReturnType<typeof nachfuellSchritt>): NachfuellErgebnis => {
  if ('art' in r && r.art === 'neue_messung_noetig') throw new Error('neue Messung nötig');
  return r as NachfuellErgebnis;
};

function mit21(ec: number, giltAb?: string) {
  const t = rundgangTeile({ orte: ['2.1', '3.1'] });
  const m = rundgangMessungDazu(t, { kennung: '2.1', ec, ...(giltAb ? { giltAb } : {}) });
  return { t, m: m as unknown as Messzeile };
}

describe('Nachfüllen im Rundgang', () => {
  it('R4.9 Rundgang 2.1 mit 2 Kannen à 10 l: nachgefuellt_l 20, Mengen gleich nachfuellen() mit EC1 aus der Rundgang-Messung', () => {
    const { t, m } = mit21(1.1);
    const r = ergebnis(nachfuellSchritt(t, P21, m, 20, JETZT, ZONE));
    expect(r.nurWasser).toBe(false);
    expect(r.dMlL).toBeGreaterThan(0);
    for (const c of ['grow', 'micro_hard_water', 'bloom'] as const) expect(r.mengen[c], c).toBeGreaterThan(0);

    // EC1 kommt aus der übergebenen Rundgang-Messung: höhere EC → kleinere Dosis, weit darüber nur Wasser
    const hoeher = mit21(1.3);
    const rHoch = ergebnis(nachfuellSchritt(hoeher.t, P21, hoeher.m, 20, JETZT, ZONE));
    expect(rHoch.dMlL).toBeLessThan(r.dMlL);
    const sehrHoch = mit21(2.7);
    const rWasser = ergebnis(nachfuellSchritt(sehrHoch.t, P21, sehrHoch.m, 20, JETZT, ZONE));
    expect(rWasser.nurWasser).toBe(true);
    expect(rWasser.hinweise.map((h) => h.code)).toContain('nur_wasser');

    // mehr nachgefüllt → mehr Mengen bei gleicher Messung
    const r10 = ergebnis(nachfuellSchritt(t, P21, m, 10, JETZT, ZONE));
    expect(r10.mengen.grow).toBeLessThan(r.mengen.grow);

    // Vorgang mit 2 Kannen à 10 l
    const aufgabe = faelligeAufgaben(t, einstellungenAus(t), JETZT, ZONE).find(
      (a) => a.typ === 'messen_nachfuellen' && a.ort?.platzId === P21,
    ) as Aufgabe;
    let n = 0;
    const v = nachfuellVorgang(
      { platzId: P21, liter: 20, ergebnis: r, aufgabe, volumenL: VOLUMEN_21_L },
      () => uid('55', (n += 1)),
      JETZT,
    );
    const kopf = v.find((s) => s.art === 'neu' && s.tabelle === 'naehrloesungsansatz');
    expect(kopf).toMatchObject({ felder: { typ: 'nachfuellen', platz_id: P21, nachgefuellt_l: 20 } });
  });

  it('R4.9 Rundgang ohne Messung desselben Tages: neue_messung_noetig', () => {
    // Messung vom 11.1. 18:00 Zürich: nicht von heute
    const { t, m } = mit21(1.1, '2027-01-11T17:00:00.000Z');
    expect(nachfuellSchritt(t, P21, m, 20, JETZT, ZONE)).toMatchObject({ art: 'neue_messung_noetig' });
    // Gegenprobe: dieselbe Messung um 00:05 Zürich am 12.1. gilt
    const heute = mit21(1.1, '2027-01-11T23:05:00.000Z');
    expect(ergebnis(nachfuellSchritt(heute.t, P21, heute.m, 20, JETZT, ZONE)).dMlL).toBeGreaterThan(0);
  });

  it('R4.9 kannenWahl 9 l bei Kanne 10 l → [1]; 30 l bei 10 l → [1, 2, 3]', () => {
    expect(kannenWahl(9, 10)).toEqual([1]);
    expect(kannenWahl(30, 10)).toEqual([1, 2, 3]);
    expect(kannenWahl(20, 10)).toEqual([1, 2]);
    expect(kannenWahl(20.5, 10)).toEqual([1, 2, 3]);
    expect(kannenWahl(10, 10)).toEqual([1]);
    expect(kannenWahl(2.3, 10)).toEqual([1]);
  });

  it('R4.10 Rundgang Kratky unter einem Drittel und EC über Band: «nur Wasser», höchstens 2.5 cm', () => {
    const t = rundgangTeile({ orte: ['3.1'] });
    const ueber = rundgangMessungDazu(t, { kennung: '3.1', ec: 1.3, fuellstand: 'unter_drittel', nr: 91 });
    // 365 × 265 mm × 25 mm = 2.42 l → 2.4 l (Zehntel l)
    const erwartet = kratkyNachfuellen({
      fuellstand: 'unter_drittel',
      ecIst: 130,
      zielbereich: { min: 80, max: 120 },
      dAnsatz: 0,
      innenLMm: 365,
      innenBMm: 265,
    });
    expect(erwartet).toEqual({ art: 'nur_wasser', hoechstensLiter: 24 });
    expect(kratkySchritt(t, P31, ueber as unknown as Messzeile)).toEqual(erwartet);

    const im = rundgangMessungDazu(t, { kennung: '3.1', ec: 1.0, fuellstand: 'unter_drittel', nr: 92 });
    const halb = kratkySchritt(t, P31, im as unknown as Messzeile);
    expect(halb.art).toBe('halbe_konzentration');
    expect('hoechstensLiter' in halb ? halb.hoechstensLiter : undefined).toBe(24);

    const voll = rundgangMessungDazu(t, { kennung: '3.1', ec: 1.0, fuellstand: 'ueber_drittel', nr: 93 });
    expect(kratkySchritt(t, P31, voll as unknown as Messzeile)).toEqual({ art: 'keine_aufgabe' });
  });

  it('R4.9 nachfuellVorgang: Ansatz nachfuellen mit war_faellig_am und aufgabe_schluessel, Positionen mit bezugsvolumen_l', () => {
    const t = rundgangTeile({ orte: ['2.1'] });
    const aufgabe = faelligeAufgaben(t, einstellungenAus(t), JETZT, ZONE).find(
      (a) => a.typ === 'messen_nachfuellen' && a.ort?.platzId === P21,
    ) as Aufgabe;
    expect(aufgabe).toBeDefined();
    const mengen = { grow: 120, micro_hard_water: 80, bloom: 40 };
    const r: NachfuellErgebnis = {
      dMlL: 120,
      mengen,
      messmittel: messmittelJe(mengen),
      nurWasser: false,
      kontrolleFolgetag: false,
      hinweise: [],
    };
    const ids: string[] = [];
    const v = nachfuellVorgang(
      { platzId: P21, liter: 20, ergebnis: r, aufgabe, volumenL: VOLUMEN_21_L },
      () => {
        const id = uid('56', ids.length + 1);
        ids.push(id);
        return id;
      },
      JETZT,
    );
    expect(vorgangPruefen(v)).toEqual([]);
    const neu = v.filter((s) => s.art === 'neu') as { tabelle: string; felder: Record<string, unknown> }[];
    const kopf = neu.filter((s) => s.tabelle === 'naehrloesungsansatz');
    expect(kopf).toHaveLength(1);
    const k = kopf[0]?.felder ?? {};
    expect(k).toMatchObject({
      platz_id: P21,
      typ: 'nachfuellen',
      nachgefuellt_l: 20,
      volumen_l: VOLUMEN_21_L,
      war_faellig_am: aufgabe.faelligAm,
      aufgabe_schluessel: aufgabe.schluessel,
    });
    expect(ids).toContain(k['client_id']);
    expect(Date.parse(String(k['begonnen_am'] ?? k['gilt_ab']))).toBe(JETZT.getTime());

    const positionen = neu.filter((s) => s.tabelle === 'ansatz_position').map((s) => s.felder);
    expect(positionen.map((p) => p['produkt_id']).sort()).toEqual(['bloom', 'grow', 'micro_hard_water']);
    const ml = Object.fromEntries(positionen.map((p) => [p['produkt_id'], Number(p['soll_ml'])]));
    expect(ml).toEqual({ grow: 12, micro_hard_water: 8, bloom: 4 });
    for (const p of positionen) {
      expect(p['ansatz_id']).toBe(k['id'] ?? k['client_id']);
      expect(p['bezugsvolumen_l']).toBe(20);
      expect(ids).toContain(p['client_id']);
    }

    // nur Wasser: Ansatz ohne Positionen
    const wasser = nachfuellVorgang(
      {
        platzId: P21,
        liter: 10,
        ergebnis: { ...r, nurWasser: true, dMlL: 0, mengen: { grow: 0, micro_hard_water: 0, bloom: 0 } },
        aufgabe,
        volumenL: VOLUMEN_21_L,
      },
      () => uid('57', 1),
      JETZT,
    );
    expect(wasser.filter((s) => s.art === 'neu' && s.tabelle === 'ansatz_position')).toEqual([]);
    expect(wasser.find((s) => s.art === 'neu' && s.tabelle === 'naehrloesungsansatz')).toMatchObject({
      felder: { typ: 'nachfuellen', nachgefuellt_l: 10 },
    });
  });
});
