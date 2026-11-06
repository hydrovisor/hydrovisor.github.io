// Neuansatz, Zielwahl, Stationen und Herstellerstadium (Plan 28 Testliste; UC7-AK1, AK2, AK6, AK7, AK13; RF1, RF2,
// RF3, RF7, RF8; R4.1 bis R4.5, R4.11). Rahmen nach R4.12: ECWasser 0.50, k 0.300 je Komponente, Teil-Dosis 100 %.
// Erwartungen aus Konzept 7.3, UC7 und 06_tests.md Abschnitt 4, nicht aus dem Code. Uhr injiziert, Europe/Zurich.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 28 offen ist):
// - Einheiten wie Plan «Einheiten und Signaturen»; ein `Bruch` trägt die Einheit der zugehörigen Ganzzahl
//   (EC in Hundertsteln, k in Tausendsteln) und wird mit `bruch()` gebaut, mit `alsZahl()` gelesen.
// - `hinweise` ist eine Liste `{ code, text }`; geprüft werden die Codes aus Plan 28, Texte nur, wo das Konzept
//   sie wörtlich nennt.
// - `neuansatz(...).mengen` und `.mengenTeil` in Zehnteln ml je Komponente; bei Stationen ist `mengenTeil` gleich
//   `mengen` und `teilDosis` 100.
// - Station: `zielbereich` wird mitgegeben (Kontrollband), entscheidend ist `istStation`.
import { describe, expect, it } from 'vitest';
import {
  ecWasser,
  HERSTELLERDOSIS,
  herstellerstadium,
  inneresBand,
  kontrollband,
  kWirksam,
  neuansatz,
  stationsDosis,
  zielEc,
} from '../../src/domain/rechner.ts';
import { alsZahl, bruch, ecText } from '../../src/domain/rechner-zahlen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';

const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;

type Eingabe = Parameters<typeof neuansatz>[0];

function eingabe(extra: Partial<Eingabe> = {}): Eingabe {
  return {
    volumen: 900,
    stadium: 'wachstum',
    zielbereich: { min: 100, max: 140 },
    ecWasser: 50,
    k: K,
    teilDosis: 100,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
    ...extra,
  } as Eingabe;
}

function ergebnis(e: Eingabe) {
  const r = neuansatz(e);
  if (r.art !== 'ergebnis') throw new Error(`erwartet Ergebnis, erhalten ${r.art}`);
  return r;
}

const codes = (h: readonly { code: string }[]) => h.map((x) => x.code);
const g = (grow: number, micro: number, bloom: number) => ({ grow, micro_hard_water: micro, bloom });

describe('Herstellerdosis und k_wirksam (R4.1, R4.3)', () => {
  it('UC7-AK1 Herstellerdosis je Stadium nach R4.3 in Hundertsteln ml/L, ohne «reife»', () => {
    expect(HERSTELLERDOSIS).toEqual({
      wurzeln_keimung: g(50, 50, 50),
      echte_blaetter: g(100, 100, 100),
      wachstum: g(180, 120, 60),
      vorbluete: g(200, 200, 150),
      bluete_frucht: g(80, 160, 240),
    });
  });

  it('UC7-AK1 k_wirksam mit den Anteilen des Stadiums: 0.300 bei gleichem k, 0.333 bei 0.4 / 0.3 / 0.2 in Wachstum', () => {
    expect(alsZahl(kWirksam(K, HERSTELLERDOSIS.wachstum))).toBeCloseTo(300, 6);
    expect(alsZahl(kWirksam(g(400, 300, 200), HERSTELLERDOSIS.wachstum))).toBeCloseTo(1000 / 3, 6);
    // Blüte / Frucht 0.8 : 1.6 : 2.4 → (0.4 · 0.8 + 0.3 · 1.6 + 0.2 · 2.4) / 4.8 = 0.2667
    expect(alsZahl(kWirksam(g(400, 300, 200), HERSTELLERDOSIS.bluete_frucht))).toBeCloseTo(800 / 3, 6);
  });
});

describe('Inneres Band und Zielwahl (R4.2)', () => {
  it('UC7-AK12 RF2 inneres Band 1.575 bis 1.725 exakt, Grenzen eingeschlossen', () => {
    const band = inneresBand({ min: 150, max: 180 });
    expect(alsZahl(band.unten)).toBe(157.5);
    expect(alsZahl(band.oben)).toBe(172.5);
    const zb = { min: 150, max: 180 };
    expect(zielEc({ zielbereich: zb, ecSoll: bruch(315, 2), ecWasser: 50 }).skalieren).toBe(false);
    expect(zielEc({ zielbereich: zb, ecSoll: bruch(345, 2), ecWasser: 50 }).skalieren).toBe(false);
    expect(zielEc({ zielbereich: zb, ecSoll: bruch(157), ecWasser: 50 }).skalieren).toBe(true);
    expect(zielEc({ zielbereich: zb, ecSoll: bruch(173), ecWasser: 50 }).skalieren).toBe(true);
  });

  it('UC7-AK2 ECSoll auf den Grenzen des inneren Bands 1.10 und 1.30 bleibt, 1.09 und 1.31 werden auf 1.20 gesetzt', () => {
    const zb = { min: 100, max: 140 };
    for (const soll of [110, 130]) {
      const z = zielEc({ zielbereich: zb, ecSoll: bruch(soll), ecWasser: 50 });
      expect(z.skalieren).toBe(false);
      expect(alsZahl(z.ecZiel)).toBe(soll);
    }
    for (const soll of [109, 131, 158]) {
      const z = zielEc({ zielbereich: zb, ecSoll: bruch(soll), ecWasser: 50 });
      expect(z.skalieren).toBe(true);
      expect(alsZahl(z.ecZiel)).toBe(120);
    }
  });

  it('UC7-AK6 Zielbereich 0.6 bis 0.8 bei Wasser 0.5: Ziel 0.80 mit Hinweis Untergrenze', () => {
    const z = zielEc({ zielbereich: { min: 60, max: 80 }, ecSoll: bruch(158), ecWasser: 50 });
    expect(alsZahl(z.ecZiel)).toBe(80);
    expect(z.skalieren).toBe(true);
    expect(codes(z.hinweise)).toContain('untergrenze_wasser');
    expect(codes(z.hinweise)).not.toContain('wasser_zu_hoch_fuer_gefaess');
  });

  it('UC7-AK6 Bandmitte genau ECWasser + 0.30 ohne Hinweis Untergrenze, ein Hundertstel darunter mit', () => {
    // Zielbereich 0.6 bis 1.0: Mitte 0.80 = 0.50 + 0.30
    const genau = zielEc({ zielbereich: { min: 60, max: 100 }, ecSoll: bruch(158), ecWasser: 50 });
    expect(alsZahl(genau.ecZiel)).toBe(80);
    expect(codes(genau.hinweise)).not.toContain('untergrenze_wasser');
    // Wasser 0.51: Mitte 0.80 liegt unter 0.81
    const darunter = zielEc({ zielbereich: { min: 60, max: 100 }, ecSoll: bruch(159), ecWasser: 51 });
    expect(alsZahl(darunter.ecZiel)).toBe(81);
    expect(codes(darunter.hinweise)).toContain('untergrenze_wasser');
  });

  it('UC7-AK6 RF3 Zielbereich 0.8 bis 1.2 bei Wasser 0.95: Ziel 1.20, Leitungswasser zu hoch, nichts über dem Zielbereich', () => {
    const z = zielEc({ zielbereich: { min: 80, max: 120 }, ecSoll: bruch(203), ecWasser: 95 });
    expect(alsZahl(z.ecZiel)).toBe(120);
    expect(z.skalieren).toBe(true);
    const h = z.hinweise.find((x) => x.code === 'wasser_zu_hoch_fuer_gefaess');
    expect(h?.text).toContain('Leitungswasser zu hoch für dieses Gefäss');
  });

  it('UC7-AK12 RF3 Grenze ECWasser = obere Grenze − 0.30: 0.90 ohne, 0.91 mit «Leitungswasser zu hoch»', () => {
    const zb = { min: 80, max: 120 };
    const auf = zielEc({ zielbereich: zb, ecSoll: bruch(198), ecWasser: 90 });
    expect(codes(auf.hinweise)).not.toContain('wasser_zu_hoch_fuer_gefaess');
    // Mitte 1.00 angehoben auf 0.90 + 0.30 = 1.20, höchstens die obere Grenze
    expect(alsZahl(auf.ecZiel)).toBe(120);
    const ueber = zielEc({ zielbereich: zb, ecSoll: bruch(199), ecWasser: 91 });
    expect(codes(ueber.hinweise)).toContain('wasser_zu_hoch_fuer_gefaess');
    expect(alsZahl(ueber.ecZiel)).toBe(120);
  });
});

describe('ECWasser (R4.1, R4.6 Zeile 3, UC7 Varianten)', () => {
  it('UC7-AK1 Frischwasser gilt, sonst letzter W-Wert, sonst Annahme 0.50', () => {
    expect(ecWasser({ frischwasser: 48, letzteW: 50 })).toMatchObject({ wert: 48, quelle: 'frischwasser' });
    expect(ecWasser({ letzteW: 55 })).toMatchObject({ wert: 55, quelle: 'w' });
    expect(ecWasser({})).toMatchObject({ wert: 50, quelle: 'annahme' });
  });

  it('UC7-AK1 Frischwasser 0.19 und 1.01 ausserhalb der Plausibilität: letzter W-Wert mit «Messgerät oder Wasser prüfen»', () => {
    for (const fw of [19, 101]) {
      const r = ecWasser({ frischwasser: fw, letzteW: 50 });
      expect(r).toMatchObject({ wert: 50, quelle: 'w' });
      expect(codes(r.hinweise)).toContain('messgeraet_oder_wasser_pruefen');
    }
    for (const fw of [20, 100]) {
      const r = ecWasser({ frischwasser: fw, letzteW: fw });
      expect(r).toMatchObject({ wert: fw, quelle: 'frischwasser' });
      expect(codes(r.hinweise)).not.toContain('messgeraet_oder_wasser_pruefen');
    }
  });

  it('UC7-AK1 Abweichung 0.15 zum letzten W-Wert ohne, 0.16 mit «Kalibrierung prüfen»', () => {
    expect(codes(ecWasser({ frischwasser: 65, letzteW: 50 }).hinweise)).not.toContain('kalibrierung_pruefen');
    expect(codes(ecWasser({ frischwasser: 35, letzteW: 50 }).hinweise)).not.toContain('kalibrierung_pruefen');
    expect(codes(ecWasser({ frischwasser: 66, letzteW: 50 }).hinweise)).toContain('kalibrierung_pruefen');
    expect(codes(ecWasser({ frischwasser: 34, letzteW: 50 }).hinweise)).toContain('kalibrierung_pruefen');
  });

  it('UC7-AK1 ECWasser ab 1.00 mit Warnung, 0.99 ohne', () => {
    expect(codes(ecWasser({ frischwasser: 100 }).hinweise)).toContain('wasser_hoch');
    expect(codes(ecWasser({ frischwasser: 99 }).hinweise)).not.toContain('wasser_hoch');
  });
});

describe('neuansatz (R4.2, R4.4, R4.7 Teil-Dosis, R4.11)', () => {
  it('UC7-AK1 2.3 Wachstum 9 l skaliert auf 1.20: 10.5 / 7.0 / 3.5 ml', () => {
    const r = ergebnis(eingabe());
    expect(r.mengen).toEqual(g(105, 70, 35));
    expect(r.mengenTeil).toEqual(g(105, 70, 35));
    expect(r.ecZiel).toBe(120);
    expect(r.skaliert).toBe(true);
    expect(r.gekappt).toBe(false);
    expect(r.kontrolleFolgetag).toBe(false);
    expect(r.stadium).toBe('wachstum');
    expect(r.dosisHersteller).toEqual(HERSTELLERDOSIS.wachstum);
    expect(r.messmittel.grow.text).toBe('10.5 ml, 20-ml-Spritze');
    expect(r.messmittel.bloom.spritzeMl).toBe(5);
    expect(codes(r.hinweise)).not.toContain('ziel_nicht_erreichbar');
  });

  it('UC7-AK1 Teil-Dosis 75 %: 8.0 / 5.5 / 2.6 ml', () => {
    const r = ergebnis(eingabe({ teilDosis: 75 }));
    expect(r.teilDosis).toBe(75);
    expect(r.mengenTeil).toEqual(g(80, 55, 26));
    expect(r.mengen).toEqual(g(105, 70, 35));
  });

  it('UC7-AK1 Teil-Dosis 85 %: 9.0 / 6.0 / 3.0 ml', () => {
    const r = ergebnis(eingabe({ teilDosis: 85 }));
    expect(r.teilDosis).toBe(85);
    expect(r.mengenTeil).toEqual(g(90, 60, 30));
  });

  it('UC7-AK2 D 2.0 ml/L: ECSoll 1.10 auf der Grenze des inneren Bands, keine Skalierung, ECZiel 1.10', () => {
    const r = ergebnis(eingabe({ dosis: g(100, 67, 33) }));
    expect(r.skaliert).toBe(false);
    expect(r.ecZiel).toBe(110);
    // 1.0 · 9 = 9.0; 0.67 · 9 = 6.03 → 6.0; 0.33 · 9 = 2.97 → 3.0
    expect(r.mengen).toEqual(g(90, 60, 30));
  });

  it('UC7-AK2 Gegenprobe D 1.96 ml/L: ECSoll 1.088 unter dem Band wird auf 1.20 skaliert', () => {
    const r = ergebnis(eingabe({ dosis: g(98, 65, 33) }));
    expect(r.skaliert).toBe(true);
    expect(r.ecZiel).toBe(120);
  });

  it('UC7-AK12 RF1 3.1 7 l Wachstum 1.0 bis 1.4: D 2.333, 8.0 / 5.5 / 2.7 ml, −0.13 ml, «−0.01 mS/cm»', () => {
    const r = ergebnis(eingabe({ volumen: 700 }));
    expect(r.mengen).toEqual(g(80, 55, 27));
    expect(r.ecZiel).toBe(120);
    expect(r.skaliert).toBe(true);
    // roh 49/6 + 49/9 + 49/18 = 16.333 ml, gerundet 16.2 ml: −0.13 ml
    const summe = r.mengen.grow + r.mengen.micro_hard_water + r.mengen.bloom;
    expect((summe - 490 / 3) / 10).toBeCloseTo(-0.133, 3);
    expect(r.rundungsabweichungEc).toBe(-1);
    expect(ecText(r.rundungsabweichungEc, { vorzeichen: true })).toBe('−0.01 mS/cm');
  });

  it('UC7-AK12 RF2 3.2 3 l Kratky belüftet Direktsaat: ECSoll 1.58 im inneren Band 1.575 bis 1.725, 5.5 / 3.6 / 1.8 ml', () => {
    const r = ergebnis(eingabe({ volumen: 300, zielbereich: { min: 150, max: 180 } }));
    expect(r.skaliert).toBe(false);
    expect(r.ecZiel).toBe(158);
    expect(r.mengen).toEqual(g(55, 36, 18));
  });

  it('UC7-AK12 RF3 Neuansatz bei Wasser 0.95 und Zielbereich 0.8 bis 1.2: ECZiel 1.20, nie darüber', () => {
    const r = ergebnis(eingabe({ ecWasser: 95, zielbereich: { min: 80, max: 120 } }));
    expect(r.ecZiel).toBe(120);
    expect(codes(r.hinweise)).toContain('wasser_zu_hoch_fuer_gefaess');
    // D_neu = 3.6 · 0.25 / 1.08 = 0.8333 ml/L → 3.75 / 2.5 / 1.25 ml
    expect(r.mengen).toEqual(g(38, 25, 13));
  });

  it('UC7-AK12 RF7 leeres Gefäss: Rechner verlangt Ziel-EC und Stadium, Vorschlag wachstum, keine Rechnung', () => {
    const r = neuansatz(eingabe({ stadium: undefined, zielbereich: undefined }));
    expect(r.art).toBe('eingabe_noetig');
    if (r.art !== 'eingabe_noetig') return;
    expect([...r.felder].sort()).toEqual(['stadium', 'ziel_ec']);
    expect(r.vorschlagStadium).toBe('wachstum');
    expect(r).not.toHaveProperty('mengen');
  });

  it('UC7-AK12 RF7 nur Stadium oder nur Zielbereich genügt nicht', () => {
    expect(neuansatz(eingabe({ zielbereich: undefined })).art).toBe('eingabe_noetig');
    expect(neuansatz(eingabe({ stadium: undefined })).art).toBe('eingabe_noetig');
  });

  it('UC7-AK12 RF7 mit Ziel-EC von Hand und Stadium rechnet er: 1.20 in Wachstum auf 9 l ergibt 10.5 / 7.0 / 3.5 ml (A9)', () => {
    const r = ergebnis(eingabe({ zielbereich: undefined, zielEcGewaehlt: 120 }));
    expect(r.ecZiel).toBe(120);
    expect(r.mengen).toEqual(g(105, 70, 35));
    expect(r.skaliert).toBe(true);
  });

  it('UC7-AK6 Ziel-EC von Hand unter ECWasser + 0.30 wird angehoben: 0.70 bei Wasser 0.50 → 0.80 (A9)', () => {
    const r = ergebnis(eingabe({ zielbereich: undefined, zielEcGewaehlt: 70 }));
    expect(r.ecZiel).toBe(80);
    expect(codes(r.hinweise)).toContain('untergrenze_wasser');
  });
});

describe('Kappung R4.4 (UC7-AK13)', () => {
  it('UC7-AK13 Kappung auf 1.2 · D: gleich → keine Kappung, ein Hundertstel darüber → Kappung', () => {
    // D 2.5 ml/L, ECSoll 1.25; Grenze 1.2 · 2.5 = 3.0 ml/L ↔ ECZiel 0.50 + 0.9 = 1.40
    const dosis = g(125, 83, 42);
    const gleich = ergebnis(eingabe({ dosis, zielbereich: { min: 120, max: 160 } }));
    expect(gleich.ecZiel).toBe(140);
    expect(gleich.gekappt).toBe(false);
    expect(codes(gleich.hinweise)).not.toContain('ziel_nicht_erreichbar');
    const darueber = ergebnis(eingabe({ dosis, zielbereich: { min: 121, max: 161 } }));
    expect(darueber.gekappt).toBe(true);
    expect(darueber.ecZiel).toBe(140);
    expect(codes(darueber.hinweise)).toContain('ziel_nicht_erreichbar');
    expect(darueber.kontrolleFolgetag).toBe(false);
  });

  it('UC7-AK13 Kappung auf 5.5 ml/L: gleich → keine Kappung, ein Hundertstel darüber → Kappung', () => {
    // D 5.0 ml/L (1.2 · D = 6.0 über 5.5), ECSoll 2.00; 5.5 ml/L ↔ ECZiel 0.50 + 1.65 = 2.15
    const dosis = g(200, 200, 100);
    const gleich = ergebnis(eingabe({ dosis, zielbereich: { min: 205, max: 225 } }));
    expect(gleich.ecZiel).toBe(215);
    expect(gleich.gekappt).toBe(false);
    const darueber = ergebnis(eingabe({ dosis, zielbereich: { min: 206, max: 226 } }));
    expect(darueber.gekappt).toBe(true);
    expect(darueber.ecZiel).toBe(215);
  });

  it('UC7-AK13 gekappte Mengen aus der Grenze: Wachstum 20 l Ziel 1.80 → 4.32 ml/L, Grow 43.0 statt 43.5 ml', () => {
    const r = ergebnis(eingabe({ volumen: 2000, zielbereich: { min: 160, max: 200 } }));
    expect(r.gekappt).toBe(true);
    expect(r.mengen).toEqual(g(430, 290, 145));
    expect(r.ecZiel).toBe(180);
  });

  it('UC7-AK13 Dosis über 5.5 ml/L oder 1.2 · D nur mit Bestätigung und mit Kontrollmessung am Folgetag (Neuansatz)', () => {
    // Vorblüte 20 l, Zielbereich 2.1 bis 2.7: Mitte 2.40 → D_neu 6.333 über 5.5
    const ohne = ergebnis(
      eingabe({ stadium: 'vorbluete', volumen: 2000, zielbereich: { min: 210, max: 270 } }),
    );
    expect(ohne.gekappt).toBe(true);
    expect(ohne.ecZiel).toBe(215);
    expect(ohne.mengen).toEqual(g(400, 400, 300));
    expect(ohne.kontrolleFolgetag).toBe(false);
    const mit = ergebnis(
      eingabe({
        stadium: 'vorbluete',
        volumen: 2000,
        zielbereich: { min: 210, max: 270 },
        ueberHerstellerdosisBestaetigt: true,
      }),
    );
    expect(mit.gekappt).toBe(false);
    expect(mit.ecZiel).toBe(240);
    expect(mit.mengen).toEqual(g(460, 460, 345));
    expect(mit.kontrolleFolgetag).toBe(true);
    expect(codes(mit.hinweise)).toContain('ueber_herstellerdosis');
  });
});

describe('Stationen (R4.5)', () => {
  const station = (
    stadium: 'wurzeln_keimung' | 'echte_blaetter',
    volumen: number,
    teilDosis: 75 | 85 | 100 = 100,
  ) => eingabe({ stadium, volumen, teilDosis, istStation: true, zielbereich: { min: 80, max: 110 } });

  it('UC7-AK7 Station 4.1 mit 3 l: je 1.5 ml', () => {
    const r = ergebnis(station('wurzeln_keimung', 300));
    expect(r.mengen).toEqual(g(15, 15, 15));
    expect(r.mengenTeil).toEqual(g(15, 15, 15));
    expect(r.skaliert).toBe(false);
    expect(r.ecZiel).toBe(95);
    expect(r.kontrollband).toEqual({ min: 80, max: 110 });
  });

  it('UC7-AK7 RF8 Station 4.4 bei nicht stabilem k: 100 % der festen Dosis', () => {
    const r = ergebnis(station('wurzeln_keimung', 230, 75));
    expect(r.teilDosis).toBe(100);
    expect(r.mengen).toEqual(g(12, 12, 12));
    expect(r.mengenTeil).toEqual(g(12, 12, 12));
    expect(r.ecZiel).toBe(95);
  });

  it('UC7-AK12 RF8 Station 4.4 mit 2.3 l und Teil-Dosis 85 %: feste Dosis 1.15 → 1.2 ml je Teil, keine Skalierung', () => {
    const r = ergebnis(station('wurzeln_keimung', 230, 85));
    expect(r.mengenTeil).toEqual(g(12, 12, 12));
    expect(r.skaliert).toBe(false);
  });

  it('UC7-AK7 keine Komponente auf 0 gerundet: Station mit 0.05 l → je 0.1 ml', () => {
    const r = ergebnis(station('wurzeln_keimung', 5));
    expect(r.mengen).toEqual(g(1, 1, 1));
  });

  it('UC7-AK7 zweite feste Dosis «1. echte Blätter»: 1 ml/L je Teil, Kontrollband 1.30 bis 1.70', () => {
    const r = ergebnis(station('echte_blaetter', 300));
    expect(r.mengen).toEqual(g(30, 30, 30));
    expect(r.ecZiel).toBe(140);
    expect(r.kontrollband).toEqual({ min: 130, max: 170 });
  });

  it('UC7-AK7 stationsDosis und kontrollband: + 0.30 bis + 0.60 und + 0.80 bis + 1.20 über ECWasser', () => {
    expect(stationsDosis('wurzeln_keimung')).toEqual(g(50, 50, 50));
    expect(stationsDosis('echte_blaetter')).toEqual(g(100, 100, 100));
    expect(kontrollband('wurzeln_keimung', 50)).toEqual({ min: 80, max: 110 });
    expect(kontrollband('echte_blaetter', 50)).toEqual({ min: 130, max: 170 });
    expect(kontrollband('wurzeln_keimung', 60)).toEqual({ min: 90, max: 120 });
  });
});

describe('herstellerstadium (R4.3, G2)', () => {
  // Zürich-Zeit als UTC: Winter +1 h, Sommer ab 28.3.2027 +2 h
  const zh = (iso: string) => new Date(iso);

  it('UC7-AK7 Anzuchtbox: nur Anfeuchten, kein Stadium', () => {
    expect(herstellerstadium({ ort: 'anzuchtbox' }, zh('2027-01-12T17:00:00Z'), ZEITZONE)).toBe('anfeuchten');
  });

  it('UC7-AK7 Station Tag 14 «1. Wurzeln / Keimung», Tag 15 «1. echte Blätter» in Kalendertagen Zürich', () => {
    // Eintritt 10.1.2027 23:30 Zürich (22:30 UTC)
    const eintritt = zh('2027-01-10T22:30:00Z');
    const e = { ort: 'station' as const, aeltesterEintrittAm: eintritt };
    // 24.1. 00:30 Zürich = 23.1. 23:30 UTC: Tag 14
    expect(herstellerstadium(e, zh('2027-01-23T23:30:00Z'), ZEITZONE)).toBe('wurzeln_keimung');
    // 25.1. 00:30 Zürich = 24.1. 23:30 UTC: Tag 15 (in UTC erst Tag 14)
    expect(herstellerstadium(e, zh('2027-01-24T23:30:00Z'), ZEITZONE)).toBe('echte_blaetter');
    expect(herstellerstadium(e, zh('2027-01-10T23:00:00Z'), ZEITZONE)).toBe('wurzeln_keimung');
  });

  it('UC7-AK7 Direktsaat: Wachstum ab dem Saattag', () => {
    const e = { ort: 'zielgefaess' as const, direktsaat: true, phaseLeitkultur: 'keimung' as const };
    expect(herstellerstadium(e, zh('2027-01-12T17:00:00Z'), ZEITZONE)).toBe('wachstum');
  });

  it('UC7-AK7 Einwurzeln Tag 0 bis 7 «1. echte Blätter» unabhängig von der Phase, Tag 8 nach Phase', () => {
    const umgesetztAm = zh('2027-01-10T11:00:00Z'); // 10.1. 12:00 Zürich
    const tag7 = zh('2027-01-17T22:00:00Z'); // 17.1. 23:00 Zürich
    const tag8 = zh('2027-01-17T23:30:00Z'); // 18.1. 00:30 Zürich
    const ziel = (phaseLeitkultur: 'anzucht' | 'wachstum' | 'bluete' | 'fruchtbildung_reife') => ({
      ort: 'zielgefaess' as const,
      direktsaat: false,
      phaseLeitkultur,
      umgesetztAm,
    });
    expect(herstellerstadium(ziel('wachstum'), umgesetztAm, ZEITZONE)).toBe('echte_blaetter');
    expect(herstellerstadium(ziel('wachstum'), tag7, ZEITZONE)).toBe('echte_blaetter');
    expect(herstellerstadium(ziel('bluete'), tag7, ZEITZONE)).toBe('echte_blaetter');
    expect(herstellerstadium(ziel('wachstum'), tag8, ZEITZONE)).toBe('wachstum');
    expect(herstellerstadium(ziel('anzucht'), tag8, ZEITZONE)).toBe('echte_blaetter');
    expect(herstellerstadium(ziel('bluete'), tag8, ZEITZONE)).toBe('vorbluete');
    expect(herstellerstadium(ziel('fruchtbildung_reife'), tag8, ZEITZONE)).toBe('bluete_frucht');
  });

  it('UC7-AK7 Zielgefäss ohne Umsetzdatum folgt der Phase der Leitkultur', () => {
    const e = { ort: 'zielgefaess' as const, direktsaat: false, phaseLeitkultur: 'bluete' as const };
    expect(herstellerstadium(e, zh('2027-02-12T17:00:00Z'), ZEITZONE)).toBe('vorbluete');
  });

  it('UC7-AK7 über die Sommerzeit am 28.3.2027 zählen ganze Kalendertage (G2)', () => {
    const umgesetztAm = zh('2027-03-25T11:00:00Z'); // 25.3. 12:00 MEZ
    const e = {
      ort: 'zielgefaess' as const,
      direktsaat: false,
      phaseLeitkultur: 'wachstum' as const,
      umgesetztAm,
    };
    // 1.4. 23:30 MESZ = 21:30 UTC: Tag 7
    expect(herstellerstadium(e, zh('2027-04-01T21:30:00Z'), ZEITZONE)).toBe('echte_blaetter');
    // 2.4. 00:30 MESZ = 1.4. 22:30 UTC: Tag 8 (nach Millisekunden erst 7 Tage 11.5 h)
    expect(herstellerstadium(e, zh('2027-04-01T22:30:00Z'), ZEITZONE)).toBe('wachstum');
  });
});
