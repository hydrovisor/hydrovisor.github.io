// Restdosis, kIst, k-Vorschlag, Teilwechsel, «möglicherweise doppelt dosiert», Stabilität und Teil-Dosis-Stand
// (Plan 28 Testliste; UC7-AK3, AK11, AK14, AK15, Loesungswechsel-AK6; RF9, RF10, RF12; R4.1, R4.7, R4.8, E-F4-9).
// Rahmen nach R4.12: ECWasser 0.50, k 0.300 je Komponente, u_EC 0.10. Erwartungen aus Konzept 7.3, UC7, Ablauf
// Lösungswechsel und 06_tests.md Abschnitt 4, nicht aus dem Code.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 28 offen ist):
// - Einheiten wie Plan «Einheiten und Signaturen»; `bruch()` baut exakte Werte in der Einheit der Ganzzahl
//   (EC in Hundertsteln, Dosis in Hundertsteln ml/L), `alsZahl()` liest sie.
// - `restdosis(...).mengen` in Zehnteln ml, `.abweichung` in Hundertsteln, `.kIst` in Tausendsteln.
// - `teilwechsel` und `doppeltDosiert.teilwechsel` erhalten EC in Hundertsteln; `liter` in Zehnteln l.
// - `kStabil`: `begonnenAm` als Date; die Reihenfolge der Eingabe ist beliebig, «jüngste» nach `begonnenAm`.
import { describe, expect, it } from 'vitest';
import {
  doppeltDosiert,
  ecSollIst,
  kStabil,
  kVorschlag,
  restdosis,
  teilDosis,
  teilwechsel,
} from '../../src/domain/rechner-korrektur.ts';
import { HERSTELLERDOSIS } from '../../src/domain/rechner.ts';
import { alsZahl, bruch } from '../../src/domain/rechner-zahlen.ts';

const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;
const W = HERSTELLERDOSIS.wachstum;
const g = (grow: number, micro: number, bloom: number) => ({ grow, micro_hard_water: micro, bloom });
const codes = (h: readonly { code: string }[]) => h.map((x) => x.code);

// RF10: Ist 18.0 ml auf 9 l im Verhältnis Wachstum = 9.0 / 6.0 / 3.0 ml
const IST_RF10 = g(90, 60, 30);
// RF12: Teil-Dosis 75 % im Beispiel 2.3 = 8.0 / 5.5 / 2.6 ml
const IST_RF12 = g(80, 55, 26);

describe('ecSollIst (R4.7, E-F4-9)', () => {
  it('UC7-AK3 RF10 Ist 18.0 ml auf 9 l: Ist-Dosis 2.0 ml/L, ECSoll_ist 1.10', () => {
    const r = ecSollIst({ ist: IST_RF10, volumen: 900, k: K, ecWasser: 50 });
    expect(alsZahl(r.istDosis)).toBeCloseTo(200, 9);
    expect(alsZahl(r.exakt)).toBeCloseTo(110, 9);
    expect(r.gerundet).toBe(110);
  });

  it('UC7-AK12 RF12 ECSoll_ist 1.04 aus 16.1 ml auf 9 l (1.79 ml/L, ungerundet 1.037)', () => {
    const r = ecSollIst({ ist: IST_RF12, volumen: 900, k: K, ecWasser: 50 });
    expect(alsZahl(r.istDosis)).toBeCloseTo(1610 / 9, 6);
    expect(alsZahl(r.exakt)).toBeCloseTo(50 + 0.3 * (1610 / 9), 6);
    expect(r.gerundet).toBe(104);
  });
});

describe('restdosis (R4.7)', () => {
  const eingabe = (ecIst: number, extra: Record<string, unknown> = {}) =>
    ({
      ecZiel: bruch(120),
      ecIst,
      ecWasser: 50,
      ist: IST_RF10,
      volumen: 900,
      k: K,
      dosis: W,
      ...extra,
    }) as Parameters<typeof restdosis>[0];

  it('UC7-AK3 RF10 Kontrolle 1.05 bei Ist 18.0 ml auf 9 l: ECSoll_ist 1.10, kIst 0.275, kein k-Vorschlag, Restdosis 2.3 / 1.5 / 0.8 ml', () => {
    const r = restdosis(eingabe(105));
    expect(r.mengen).toEqual(g(23, 15, 8));
    expect(r.abweichung).toBe(5);
    expect(r.kIst).toBe(275);
    expect(codes(r.hinweise)).not.toContain('restdosis_null');
    const v = kVorschlag({
      kontrolle: 105,
      ecSollIstKontrolle: 110,
      istDosis: bruch(200),
      endmessung: 120,
      ecSollIstGesamt: 125,
      ecWasser: 50,
      k: K,
      dosis: W,
      uEc: 10,
      unsicher: false,
      datenart: 'echt',
    });
    expect(v).toEqual({ art: 'kein', grund: 'abweichung_klein' });
  });

  it('UC7-AK12 RF10 Restdosis mit k 0.3: 0.5 ml/L = 4.5 ml, Grow 2.3, Micro 1.5, Bloom 0.8 ml', () => {
    const r = restdosis(eingabe(105));
    expect(r.mengen.grow + r.mengen.micro_hard_water + r.mengen.bloom).toBe(46);
    expect(r.mengen).toEqual(g(23, 15, 8));
  });

  it('UC7-AK12 RF9 Kontrollmessung 1.25 bei Ziel 1.20: Restdosis 0 / 0 / 0 mit Hinweis, keine negative Menge', () => {
    const r = restdosis(eingabe(125));
    expect(r.mengen).toEqual(g(0, 0, 0));
    expect(codes(r.hinweise)).toContain('restdosis_null');
  });

  it('UC7-AK12 RF9 Grenze: 1.20 bei Ziel 1.20 → 0 ohne Hinweis, 1.21 → 0 mit Hinweis, 1.19 → kleinste Mengen', () => {
    const gleich = restdosis(eingabe(120));
    expect(gleich.mengen).toEqual(g(0, 0, 0));
    expect(codes(gleich.hinweise)).not.toContain('restdosis_null');
    const knapp = restdosis(eingabe(121));
    expect(knapp.mengen).toEqual(g(0, 0, 0));
    expect(codes(knapp.hinweise)).toContain('restdosis_null');
    // ΔD = 0.01 / 0.3 ml/L · 9 l = 0.3 ml → 0.15 / 0.1 / 0.05 ml → 0.2 / 0.1 / 0.1 ml
    expect(restdosis(eingabe(119)).mengen).toEqual(g(2, 1, 1));
  });

  it('UC7-AK3 Restdosis mit k_wirksam der Einstellung, nicht mit kIst: k 0.4 / 0.3 / 0.2 ergibt ΔD 0.45 ml/L', () => {
    // k_wirksam (Wachstum) = 1/3; ΔD = 0.15 / (1/3) = 0.45 ml/L · 9 = 4.05 ml → 2.025 / 1.35 / 0.675 ml
    const r = restdosis(eingabe(105, { k: g(400, 300, 200) }));
    expect(r.mengen).toEqual(g(20, 14, 7));
  });

  it('UC7-AK13 Restdosis höchstens bis zur Grenze R4.4: Ist 4.2 ml/L plus Rest höchstens 4.32 ml/L (A12)', () => {
    // 10 l, Ist 21.0 / 14.0 / 7.0 ml = 4.2 ml/L; ΔD ungekappt 1.333 ml/L, gekappt 0.12 ml/L = 1.2 ml
    const r = restdosis(eingabe(140, { ist: g(210, 140, 70), volumen: 1000, ecZiel: bruch(180) }));
    expect(r.mengen).toEqual(g(6, 4, 2));
  });
});

describe('kVorschlag (R4.7, R4.1, G5)', () => {
  const basis = {
    ecSollIstKontrolle: 110,
    istDosis: bruch(200),
    endmessung: 120,
    ecSollIstGesamt: 120,
    ecWasser: 50,
    k: K,
    dosis: W,
    uEc: 10,
    unsicher: false,
    datenart: 'echt' as const,
  };

  it('UC7-AK3 k-Vorschlag bei Abweichung genau u_EC nicht, bei u_EC + 0.01 ja', () => {
    expect(kVorschlag({ ...basis, kontrolle: 100 })).toEqual({ art: 'kein', grund: 'abweichung_klein' });
    expect(kVorschlag({ ...basis, kontrolle: 120 })).toEqual({ art: 'kein', grund: 'abweichung_klein' });
    const v = kVorschlag({ ...basis, kontrolle: 99 });
    expect(v.art).toBe('vorschlag');
    if (v.art !== 'vorschlag') return;
    // kIst = (0.99 − 0.50) / 2.0 = 0.245
    expect(v.kIst).toBe(245);
    expect(v.kNeu).toEqual(g(245, 245, 245));
    expect(v.uebernehmbar).toBe(true);
    expect(v.rueckfrage).toBe(false);
    expect(kVorschlag({ ...basis, kontrolle: 121 }).art).toBe('vorschlag');
  });

  it('UC7-AK3 k-Vorschlag skaliert alle drei k_i im Verhältnis kIst / k_wirksam', () => {
    // k 0.4 / 0.3 / 0.2, Wachstum: k_wirksam 1/3; Kontrolle 1.00 bei 2.0 ml/L → kIst 0.25; Faktor 0.75
    const v = kVorschlag({ ...basis, k: g(400, 300, 200), ecSollIstKontrolle: 117, kontrolle: 100 });
    expect(v.art).toBe('vorschlag');
    if (v.art !== 'vorschlag') return;
    expect(v.kIst).toBe(250);
    expect(v.kNeu).toEqual(g(300, 225, 150));
  });

  it('UC7-AK3 aus «unsicher» und aus Demo nie ein k-Vorschlag', () => {
    expect(kVorschlag({ ...basis, kontrolle: 90, unsicher: true })).toEqual({
      art: 'kein',
      grund: 'unsicher',
    });
    expect(kVorschlag({ ...basis, kontrolle: 90, datenart: 'demo' })).toEqual({
      art: 'kein',
      grund: 'nicht_echt',
    });
    expect(kVorschlag({ ...basis, kontrolle: 90, datenart: 'test' })).toEqual({
      art: 'kein',
      grund: 'nicht_echt',
    });
  });

  it('UC7-AK3 ohne Endmessung kein k-Vorschlag', () => {
    expect(kVorschlag({ ...basis, kontrolle: 90, endmessung: undefined })).toEqual({
      art: 'kein',
      grund: 'endmessung_fehlt',
    });
  });

  it('UC7-AK3 uebernehmbar an 0.20 und 0.45: 0.195 und 0.455 nicht übernehmbar', () => {
    const lies = (kontrolle: number) => {
      const v = kVorschlag({ ...basis, kontrolle });
      if (v.art !== 'vorschlag') throw new Error(`kein Vorschlag bei ${kontrolle}`);
      return v;
    };
    expect(lies(90)).toMatchObject({ kIst: 200, uebernehmbar: true });
    expect(lies(89)).toMatchObject({ kIst: 195, uebernehmbar: false });
    expect(lies(140)).toMatchObject({ kIst: 450, uebernehmbar: true });
    expect(lies(141)).toMatchObject({ kIst: 455, uebernehmbar: false });
  });

  it('UC7-AK3 rueckfrage an 20 %: genau 20 % ohne, darüber mit Rückfrage', () => {
    const lies = (kontrolle: number) => {
      const v = kVorschlag({ ...basis, kontrolle });
      if (v.art !== 'vorschlag') throw new Error(`kein Vorschlag bei ${kontrolle}`);
      return v;
    };
    expect(lies(98)).toMatchObject({ kIst: 240, rueckfrage: false });
    expect(lies(97)).toMatchObject({ kIst: 235, rueckfrage: true });
    expect(lies(122)).toMatchObject({ kIst: 360, rueckfrage: false });
    expect(lies(123)).toMatchObject({ kIst: 365, rueckfrage: true });
  });

  it('UC7-AK15 Endmessung 0.31 über ECSoll_ist: Banner, kein k-Vorschlag', () => {
    expect(kVorschlag({ ...basis, kontrolle: 99, endmessung: 151 })).toEqual({ art: 'banner' });
  });

  it('UC7-AK15 Endmessung genau 0.30 über ECSoll_ist: kein Banner, k-Vorschlag bleibt möglich', () => {
    expect(kVorschlag({ ...basis, kontrolle: 99, endmessung: 150 }).art).toBe('vorschlag');
    expect(kVorschlag({ ...basis, kontrolle: 105, endmessung: 150 })).toEqual({
      art: 'kein',
      grund: 'abweichung_klein',
    });
  });
});

describe('teilwechsel und doppeltDosiert (R4.8)', () => {
  it('UC7-AK14 Teilwechsel 9 l, Ist 1.5, Ziel 1.2, Wasser 0.5: 2.7 l absaugen', () => {
    const r = teilwechsel({ volumen: 900, ecIst: 150, ecZiel: 120, ecWasser: 50 });
    expect(r.art).toBe('absaugen');
    if (r.art !== 'absaugen') return;
    expect(r.liter).toBe(27);
    expect(r.text).toContain('2.7 l absaugen und mit Wasser ersetzen');
  });

  it('UC7-AK14 Ist gleich Ziel: kein Teilwechsel nötig, ein Hundertstel darüber 0.1 l', () => {
    expect(teilwechsel({ volumen: 900, ecIst: 120, ecZiel: 120, ecWasser: 50 })).toEqual({
      art: 'nicht_noetig',
    });
    expect(teilwechsel({ volumen: 900, ecIst: 50, ecZiel: 120, ecWasser: 50 })).toEqual({
      art: 'nicht_noetig',
    });
    const knapp = teilwechsel({ volumen: 900, ecIst: 121, ecZiel: 120, ecWasser: 50 });
    expect(knapp).toMatchObject({ art: 'absaugen', liter: 1 });
  });

  it('Loesungswechsel-AK6 RF12 erwartete Teil-EC 1.04: Kontrolle 1.30 Hinweis doppelt dosiert mit Teilwechsel, 1.29 und 1.28 kein Hinweis', () => {
    const soll = ecSollIst({ ist: IST_RF12, volumen: 900, k: K, ecWasser: 50 }).gerundet;
    expect(soll).toBe(104);
    const tw = { volumen: 900, ecIst: 130, ecZiel: 120, ecWasser: 50 };
    const ja = doppeltDosiert({ kontrolle: 130, ecSollIstTeil: soll, teilwechsel: tw });
    expect(ja.hinweis).toBe(true);
    // 9 · (1.30 − 1.20) / (1.30 − 0.50) = 1.125 → 1.1 l
    expect(ja.angebot).toMatchObject({ art: 'absaugen', liter: 11 });
    for (const kontrolle of [129, 128]) {
      const nein = doppeltDosiert({
        kontrolle,
        ecSollIstTeil: soll,
        teilwechsel: { ...tw, ecIst: kontrolle },
      });
      expect(nein.hinweis).toBe(false);
      expect(nein.angebot).toBeUndefined();
    }
  });

  it('UC7-AK12 RF12 Grenze mit der gerundeten Teil-EC (E-F4-9): 1.04 + 0.25 = 1.29 ohne, 1.30 mit Hinweis', () => {
    const tw = { volumen: 900, ecIst: 130, ecZiel: 120, ecWasser: 50 };
    expect(doppeltDosiert({ kontrolle: 129, ecSollIstTeil: 104, teilwechsel: tw }).hinweis).toBe(false);
    expect(doppeltDosiert({ kontrolle: 130, ecSollIstTeil: 104, teilwechsel: tw }).hinweis).toBe(true);
  });
});

describe('kStabil und teilDosis (R4.7, Konzept 9.4)', () => {
  const K_AENDERUNG = new Date('2027-01-05T11:00:00Z');
  // fortlaufende Beginnzeiten ab 6.1.2027 18:00 Zürich, je Aufruf eine Stunde später (Reihenfolge = Erzeugung)
  let n = 0;
  const zeile = (abweichung: number | null, extra: Record<string, unknown> = {}) => ({
    begonnenAm: new Date(Date.UTC(2027, 0, 6, 17) + 3_600_000 * n++),
    kontrolle: abweichung === null ? undefined : 110 + abweichung,
    ecSollIst: 110,
    unsicher: false,
    datenart: 'echt' as const,
    istStation: false,
    storniert: false,
    abgebrochen: false,
    ...extra,
  });
  const folge = (...z: ReturnType<typeof zeile>[]) => z;
  const reihe = (...abw: (number | null)[]) => abw.map((a) => zeile(a));

  it('UC7-AK11 drei stabile Neuansätze in Folge: 100 %', () => {
    const z = reihe(5, -10, 10);
    expect(kStabil(z, 10, K_AENDERUNG)).toBe(true);
    expect(
      teilDosis({ kQuellen: ['becherversuch'], kStabil: true, istStation: false, zielbereichKlasseD: false }),
    ).toBe(100);
  });

  it('UC7-AK11 zwei stabile genügen nicht', () => {
    expect(kStabil(reihe(0, 0), 10, K_AENDERUNG)).toBe(false);
    expect(kStabil([], 10, K_AENDERUNG)).toBe(false);
  });

  it('UC7-AK11 ein instabiler dazwischen → 85 %', () => {
    expect(kStabil(reihe(0, 11, 0, 0), 10, K_AENDERUNG)).toBe(false);
    expect(kStabil(reihe(11, 0, 0, 0), 10, K_AENDERUNG)).toBe(true);
    expect(
      teilDosis({
        kQuellen: ['becherversuch'],
        kStabil: false,
        istStation: false,
        zielbereichKlasseD: false,
      }),
    ).toBe(85);
  });

  it('UC7-AK11 Grenze max(0.10, u_EC): u_EC 0.10 → 0.10 stabil, 0.11 nicht; u_EC 0.15 → 0.15 stabil, 0.16 nicht', () => {
    expect(kStabil(reihe(10, -10, 10), 10, K_AENDERUNG)).toBe(true);
    expect(kStabil(reihe(10, -11, 10), 10, K_AENDERUNG)).toBe(false);
    expect(kStabil(reihe(15, -15, 15), 15, K_AENDERUNG)).toBe(true);
    expect(kStabil(reihe(15, -16, 15), 15, K_AENDERUNG)).toBe(false);
    // u_EC unter 0.10 zählt als 0.10
    expect(kStabil(reihe(10, 10, 10), 5, K_AENDERUNG)).toBe(true);
  });

  it('UC7-AK11 Stationen, stornierte, abgebrochene und Demo-Ansätze zählen nicht', () => {
    const z = folge(
      zeile(0),
      zeile(0),
      zeile(50, { istStation: true }),
      zeile(50, { storniert: true }),
      zeile(50, { abgebrochen: true }),
      zeile(50, { datenart: 'demo' }),
      zeile(0),
    );
    expect(kStabil(z, 10, K_AENDERUNG)).toBe(true);
    const nurStationen = folge(
      zeile(0, { istStation: true }),
      zeile(0, { istStation: true }),
      zeile(0),
      zeile(0),
    );
    expect(kStabil(nurStationen, 10, K_AENDERUNG)).toBe(false);
  });

  it('UC7-AK11 Ansatz vor der k-Änderung zählt nicht', () => {
    const vorher = { ...zeile(0), begonnenAm: new Date('2027-01-04T17:00:00Z') };
    expect(kStabil([vorher, ...reihe(0, 0)], 10, K_AENDERUNG)).toBe(false);
  });

  it('UC7-AK11 ohne Kontrollmessung oder mit «unsicher» bricht die Folge (A13)', () => {
    expect(kStabil(reihe(0, null, 0, 0), 10, K_AENDERUNG)).toBe(false);
    const unsicher = folge(zeile(0), zeile(0, { unsicher: true }), zeile(0), zeile(0));
    expect(kStabil(unsicher, 10, K_AENDERUNG)).toBe(false);
  });

  it('UC7-AK11 jüngste nach Beginn, nicht nach Reihenfolge der Eingabe', () => {
    const erste = reihe(11, 0, 0, 0);
    expect(
      kStabil(
        [3, 1, 0, 2].map((i) => erste[i] ?? zeile(99)),
        10,
        K_AENDERUNG,
      ),
    ).toBe(true);
    const zweite = reihe(0, 0, 0, 11);
    expect(
      kStabil(
        [3, 0, 1, 2].map((i) => zweite[i] ?? zeile(99)),
        10,
        K_AENDERUNG,
      ),
    ).toBe(false);
  });

  it('UC7-AK11 vor dem Becherversuch 75 %, danach 85 %', () => {
    const basis = { kStabil: false, istStation: false, zielbereichKlasseD: false };
    expect(teilDosis({ ...basis, kQuellen: ['startwert', 'startwert', 'startwert'] })).toBe(75);
    expect(teilDosis({ ...basis, kQuellen: ['becherversuch', 'startwert', 'becherversuch'] })).toBe(75);
    expect(teilDosis({ ...basis, kQuellen: ['startwert', 'startwert', 'startwert'], kStabil: true })).toBe(
      75,
    );
    expect(teilDosis({ ...basis, kQuellen: ['becherversuch', 'becherversuch', 'becherversuch'] })).toBe(85);
  });

  it('UC7-AK11 Station 100 %, Klasse D höchstens 85 %, nach «zurueckgesetzt» wieder 85 %', () => {
    expect(
      teilDosis({ kQuellen: ['startwert'], kStabil: false, istStation: true, zielbereichKlasseD: true }),
    ).toBe(100);
    expect(
      teilDosis({ kQuellen: ['becherversuch'], kStabil: true, istStation: false, zielbereichKlasseD: true }),
    ).toBe(85);
    expect(
      teilDosis({
        kQuellen: ['zurueckgesetzt'],
        kStabil: false,
        istStation: false,
        zielbereichKlasseD: false,
      }),
    ).toBe(85);
    expect(
      teilDosis({
        kQuellen: ['vorschlag_uebernommen'],
        kStabil: true,
        istStation: false,
        zielbereichKlasseD: false,
      }),
    ).toBe(100);
  });
});
