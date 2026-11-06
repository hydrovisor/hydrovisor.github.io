// Eingaben des Düngerrechners für den Neuansatz aus den Bündelteilen (Plan 29 A11, A12; Loesungswechsel-AK3,
// UC7-AK1; Konzept R4.1 bis R4.7). Injizierte Uhr (12.1.2027 18:00 Zürich), Zeitzone Europe/Zurich.
// Prüferbefunde Runde 1 (Befund 3): kStabil vergleicht die Kontrollmessung mit ECSoll_ist der TEIL-Dosis, nicht mit
// ec_erwartet_final (R4.7).
//
// Vertrag (Plan 29 «Signaturen», vom Testentwickler präzisiert):
//   src/domain/abhakliste/rechnung.ts
//     rechnungEingaben(teile, platzId, jetzt, zeitzone, e?) → { eingabe: NeuansatzEingabe; gerechnetFuer; … }
//     rechnen(r) → NeuansatzErgebnis | undefined
//   ECSoll_ist(Teil) je abgeschlossenem Neuansatz = ec_wasser des Kopfs + Σ_c k_c · ist_ml_c / volumen_l, mit
//   ist_ml_c aus der ERSTEN gültigen ansatz_position je Komponente des Ansatzes (Reihenfolge im Bündel; spätere
//   Positionen sind die Restdosis) und k_c aus schnappschuss.k des Kopfs. Laufende Neuansätze zählen nicht.
import { describe, expect, it } from 'vitest';
import { rechnen, rechnungEingaben } from '../../src/domain/abhakliste/rechnung.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { JETZT, ansatzTeile } from '../fixtures/ansatz.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';

type Zeile = Record<string, unknown>;
const P23 = platzId('2.3');

/** die drei stabilen Neuansätze der Fixture (1.1, 2.1, 2.2) */
const stabileIds = (t: Teile) =>
  (t['naehrloesungsansatz'] ?? [])
    .filter((a) => a['typ'] === 'neuansatz' && a['status'] === 'abgeschlossen' && a['kontrollmessung_id'])
    .map((a) => a['id'] as string);

/**
 * Teil-Dosis-Mengen 9.0 / 6.0 / 3.0 ml auf 9 l (k 0.3, Wasser 0.5 → ECSoll_ist(Teil) 1.10), ec_erwartet_final 1.22
 * und die Kontrolle `kontrolle` in allen drei Neuansätzen. Kopiert die Teile der Fixture und passt sie an.
 */
function mitTeilDosis(kontrolle: number): Teile {
  const t = ansatzTeile();
  const ids = new Set(stabileIds(t));
  const menge: Record<string, number> = { grow: 9.0, micro_hard_water: 6.0, bloom: 3.0 };
  t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) =>
    ids.has(a['id'] as string)
      ? { ...a, teil_dosis: 0.85, ec_erwartet_teildosis: 1.1, ec_erwartet_final: 1.22 }
      : a,
  );
  t['ansatz_position'] = (t['ansatz_position'] ?? []).map((p) =>
    ids.has(p['ansatz_id'] as string)
      ? { ...p, soll_ml: menge[p['produkt_id'] as string], ist_ml: menge[p['produkt_id'] as string] }
      : p,
  );
  const kontrollIds = new Set(
    (t['naehrloesungsansatz'] ?? [])
      .filter((a) => ids.has(a['id'] as string))
      .map((a) => a['kontrollmessung_id']),
  );
  t['messung'] = (t['messung'] ?? []).map((m) => (kontrollIds.has(m['id']) ? { ...m, ec: kontrolle } : m));
  return t;
}

/** Restdosis als zweite Position je Komponente nach der Teil-Dosis (zählt nicht für ECSoll_ist(Teil)) */
function mitRestdosis(t: Teile): Teile {
  const rest: Zeile[] = stabileIds(t).flatMap((ansatzId, i) =>
    ['grow', 'micro_hard_water', 'bloom'].map((produkt, j) => ({
      id: uid('22', 200 + i * 10 + j),
      client_id: uid('22', 200 + i * 10 + j),
      ansatz_id: ansatzId,
      produkt_id: produkt,
      soll_ml: 1.5,
      ist_ml: 1.5,
      bezugsvolumen_l: 9,
      storniert_am: null,
    })),
  );
  (t['ansatz_position'] ??= []).push(...rest);
  return t;
}

/** jüngerer laufender Neuansatz in 1.1 ohne Kontrollmessung */
function mitLaufendem(t: Teile): Teile {
  const vorlage = (t['naehrloesungsansatz'] ?? []).find((a) =>
    stabileIds(t).includes(a['id'] as string),
  ) as Zeile;
  (t['naehrloesungsansatz'] ??= []).push({
    ...vorlage,
    id: uid('29', 30),
    client_id: uid('29', 30),
    status: 'laufend',
    begonnen_am: '2027-01-12T08:00:00.000Z',
    gilt_ab: '2027-01-12T08:00:00.000Z',
    kontrollmessung_id: null,
    ec_erwartet_final: null,
  });
  return t;
}

const teilDosis = (t: Teile) => rechnungEingaben(t, P23, JETZT, ZEITZONE).eingabe.teilDosis;

describe('Rechnungseingaben für den Neuansatz in 2.3 (UC7-AK1, A11)', () => {
  it('Loesungswechsel-AK3 UC7-AK1 2.3: Volumen 900, «3 × Salat Wachstum», Stadium wachstum, Teil-Dosis 100, ECWasser 50, Mengen 10.5 / 7.0 / 3.5 ml', () => {
    const r = rechnungEingaben(ansatzTeile(), P23, JETZT, ZEITZONE);
    expect(r.volumen).toBe(900);
    expect(r.eingabe.volumen).toBe(900);
    // Plan 34 A8: «Gerechnet für» nennt die Art (name_de) und die Phase (Konzept R2.2)
    expect(r.gerechnetFuer).toBe('3 × Salat Wachstum');
    expect(r.stadiumVorschlag).toBe('wachstum');
    expect(r.eingabe.stadium).toBe('wachstum');
    expect(r.eingabe.teilDosis).toBe(100);
    expect(r.eingabe.ecWasser).toBe(50);
    const x = rechnen(r);
    expect(x).toBeDefined();
    expect(x?.mengen).toEqual({ grow: 105, micro_hard_water: 70, bloom: 35 });
  });
});

describe('Prüferbefund 3: kStabil gegen ECSoll_ist der Teil-Dosis (R4.7)', () => {
  it('Loesungswechsel-AK3 Teil-Dosis 9.0 / 6.0 / 3.0 ml auf 9 l (ECSoll_ist 1.10), Kontrolle 1.08, ec_erwartet_final 1.22: stabil, Teil-Dosis 100', () => {
    expect(teilDosis(mitTeilDosis(1.08))).toBe(100);
  });

  it('Loesungswechsel-AK3 Kontrolle 1.25 liegt 0.15 neben ECSoll_ist 1.10 (aber nahe an ec_erwartet_final 1.22): nicht stabil, Teil-Dosis 85', () => {
    expect(teilDosis(mitTeilDosis(1.25))).toBe(85);
  });

  it('Loesungswechsel-AK3 nur die erste Position je Komponente zählt (die Restdosis nicht)', () => {
    // mit Restdosis 1.5 ml je Komponente wäre ECSoll_ist 1.25; die Teil-Dosis allein 1.10
    expect(teilDosis(mitRestdosis(mitTeilDosis(1.08)))).toBe(100);
    expect(teilDosis(mitRestdosis(mitTeilDosis(1.25)))).toBe(85);
  });

  it('Loesungswechsel-AK3 k aus schnappschuss.k des Kopfs: k 0.4 ergibt ECSoll_ist 1.30, Kontrolle 1.08 nicht stabil', () => {
    const t = mitTeilDosis(1.08);
    const ids = new Set(stabileIds(t));
    t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) =>
      ids.has(a['id'] as string)
        ? {
            ...a,
            schnappschuss: {
              ...(a['schnappschuss'] as Zeile),
              k: { grow: 0.4, micro_hard_water: 0.4, bloom: 0.4 },
            },
          }
        : a,
    );
    expect(teilDosis(t)).toBe(85);
  });

  it('Loesungswechsel-AK3 ECWasser aus ec_wasser des Kopfs: Wasser 0.3 ergibt ECSoll_ist 0.90, Kontrolle 1.08 nicht stabil', () => {
    const t = mitTeilDosis(1.08);
    const ids = new Set(stabileIds(t));
    t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).map((a) =>
      ids.has(a['id'] as string) ? { ...a, ec_wasser: 0.3 } : a,
    );
    expect(teilDosis(t)).toBe(85);
  });

  it('Loesungswechsel-AK3 ein jüngerer laufender Neuansatz ohne Kontrolle zählt nicht', () => {
    expect(teilDosis(mitLaufendem(mitTeilDosis(1.08)))).toBe(100);
    expect(teilDosis(mitLaufendem(mitTeilDosis(1.25)))).toBe(85);
  });
});
