// Zielbereich nach Zweck (Plan 34 Testliste zielbereich.test.ts; Konzept R2.1, R2.2, R2.5, R10.1; Fachregeln G1, G2).
// Injizierte Uhr ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone Europe/Zurich; Teile aus tests/fixtures/zielbereich.ts.
//
// Vertrag (Plan 34 «Schnittstellen und Datenfluss», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/zielbereich.ts
//     type Zweck = 'bewertung' | 'umsetzen' | 'direktsaat' | 'ohne'
//     interface ZaehlendePflanzung { pflanzungId; satzId; sorteId; artId; kulturform; phase: Phase;
//                                    rolle: 'stehend' | 'einziehend' | 'gesaet'; netztopfId?; umsetzenAm? }
//     ansatzZweck(teile, platzId, jetzt, zeitzone): Zweck
//     zaehlendePflanzungen(teile, platzId, zweck, jetzt, zeitzone): ZaehlendePflanzung[]
//     schnittmenge(teile, platzId, zaehlende):
//       { art: 'ok'; ph: Band; ec: Band; temperatur: Band;
//         begrenzt: { phMin?; phMax?; ecMin?; ecMax? } (je Grenze die pflanzungId der begrenzenden Pflanzung) }
//       | { art: 'leer'; … } | { art: 'ohne_band' }      (Bänder in Hundertsteln, R10.1)
//     gerechnetFuerText(teile, zaehlende): string   ohne den Vorsatz «Gerechnet für: » (den setzt zeilen.ts, Zeile 4)
//     wechselAmUmsetztag(teile, platzId, umsetztag, jetzt, zeitzone):
//       { art: 'erster_ansatz' } | { art: 'wechsel_vorschlagen'; alterTage } | { art: 'loesung_bleibt'; alterTage }
import { describe, expect, it } from 'vitest';
import { bewerteEc } from '../../src/domain/bewertung/bewertung.ts';
import { bewertungsband, TEMPERATUR_STANDARD } from '../../src/domain/bewertung/sollband.ts';
import { zielbereichZeile } from '../../src/domain/phasen/ende.ts';
import type { Phase } from '../../src/domain/phasen/profil.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  ansatzZweck,
  gerechnetFuerText,
  schnittmenge,
  wechselAmUmsetztag,
  zaehlendePflanzungen,
  type ZaehlendePflanzung,
} from '../../src/domain/zielbereich.ts';
import { uid, type Teile } from '../fixtures/regal.ts';
import {
  ansatzDazu,
  artVon,
  geleertDazu,
  netztopfId,
  pflanzungId,
  platzId,
  PLUS_3,
  RESERVIERT_23,
  satzDazu,
  STEHEND_23,
  ZB_JETZT,
  ZB_SORTE,
  zielbereichTeile,
  type SorteName,
} from '../fixtures/zielbereich.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const P23 = platzId('2.3');
const P21 = platzId('2.1');
const P32 = platzId('3.2');
const sortiert = (l: readonly string[]) => [...l].sort();
const ids = (z: readonly ZaehlendePflanzung[]) => sortiert(z.map((p) => p.pflanzungId));

const KULTURFORM: Readonly<Record<SorteName, string>> = {
  lollo: 'kopf',
  eichblatt: 'kopf',
  ochsenherz: 'dauerkultur_frucht',
  genoveser: 'dauerkultur_blatt',
  rucola: 'babyleaf',
  matador: 'babyleaf',
};

let n = 0;
/** n zählende Pflanzungen einer Sorte, direkt gebaut (ohne Bündel-Zustand) */
function zp(
  sorte: SorteName,
  phase: Phase,
  anzahl = 1,
  rolle: ZaehlendePflanzung['rolle'] = 'stehend',
): ZaehlendePflanzung[] {
  return Array.from({ length: anzahl }, () => {
    n += 1;
    return {
      pflanzungId: uid('5a', n),
      satzId: uid('5b', Object.keys(ZB_SORTE).indexOf(sorte) + 1),
      sorteId: ZB_SORTE[sorte],
      artId: artVon(sorte),
      kulturform: KULTURFORM[sorte],
      phase,
      rolle,
    } as ZaehlendePflanzung;
  });
}

/** v_sollwert einer Sorte, Phase und Grösse ersetzen (Testdaten) */
function sollwertSetzen(
  t: Teile,
  sorte: SorteName,
  phase: string,
  groesse: string,
  min: number,
  max: number,
) {
  t['v_sollwert'] = (t['v_sollwert'] ?? []).map((s) =>
    s['sorte_id'] === ZB_SORTE[sorte] && s['phase'] === phase && s['groesse'] === groesse
      ? { ...s, wert_min: min, wert_max: max }
      : s,
  );
}

const zustand = (t: Teile, pflanzung: string) =>
  (t['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === pflanzung) as Record<string, unknown>;

describe('Konzept R2.2-AK: Bewertung in 2.3 ohne die reservierten Töpfe', () => {
  it('Konzept R2.2-AK (2.3: 3 Salate, 3 reservierte → EC 1.3 grün) Bewertung zählt nur die 3 Salate in Wachstum, Zielbereich 1.0 bis 1.4, EC 1.30 grün', () => {
    const t = zielbereichTeile();
    // über zaehlendePflanzungen und schnittmenge
    const z = zaehlendePflanzungen(t, P23, 'bewertung', J, Z);
    expect(ids(z)).toEqual(sortiert(STEHEND_23));
    expect(z.every((p) => p.phase === 'wachstum' && p.rolle === 'stehend')).toBe(true);
    const s = schnittmenge(t, P23, z);
    expect(s.art).toBe('ok');
    if (s.art !== 'ok') return;
    expect(s.ec).toEqual({ min: 100, max: 140 });
    expect(s.ph).toEqual({ min: 580, max: 650 });
    expect(bewerteEc(130, s.ec, 10)).toBe('gruen');
    // dieselbe Fixture über v_zielbereich (Spiegel zielbereichZeile) und bewertungsband()
    const zeile = zielbereichZeile(t, P23);
    expect(zeile?.zaehlende_pflanzungen).toBe(3);
    t['v_zielbereich'] = zeile ? [{ ...zeile }] : [];
    const band = bewertungsband(t, P23, J);
    expect(band?.herkunft).toBe('pflanzungen');
    expect(band?.ec).toEqual({ min: 100, max: 140 });
    expect(bewerteEc(130, band?.ec ?? { min: 0, max: 0 }, 10)).toBe('gruen');
  });

  it('Konzept R2.2-AK Zweck umsetzen (Reservierungen heute + 3) zählt 6 Pflanzungen, die einziehenden in Anzucht, Schnittmenge 1.0 bis 1.2', () => {
    const t = zielbereichTeile();
    const z = zaehlendePflanzungen(t, P23, 'umsetzen', J, Z);
    expect(ids(z)).toEqual(sortiert([...STEHEND_23, ...RESERVIERT_23]));
    const einziehend = z.filter((p) => p.rolle === 'einziehend');
    expect(ids(einziehend)).toEqual(sortiert(RESERVIERT_23));
    expect(einziehend.every((p) => p.phase === 'anzucht' && p.umsetzenAm === PLUS_3)).toBe(true);
    expect(sortiert(einziehend.map((p) => p.netztopfId ?? ''))).toEqual(
      sortiert(['2.3.4', '2.3.5', '2.3.6'].map(netztopfId)),
    );
    const stehend = z.filter((p) => p.rolle === 'stehend');
    expect(stehend.every((p) => p.phase === 'wachstum')).toBe(true);
    const s = schnittmenge(t, P23, z);
    expect(s.art).toBe('ok');
    if (s.art !== 'ok') return;
    expect(s.ec).toEqual({ min: 100, max: 120 });
    expect(s.ph).toEqual({ min: 580, max: 650 });
    // Untergrenze durch die stehenden Lollo Rossa, Obergrenze durch die einziehenden Eichblatt (R2.5)
    expect(STEHEND_23).toContain(s.begrenzt.ecMin);
    expect(RESERVIERT_23).toContain(s.begrenzt.ecMax);
  });
});

describe('R2.2 Ansatz für Umsetzen: wer einzieht', () => {
  it('R2.2 Umsetzdatum heute + 3 zählt, heute + 4 nicht', () => {
    const plus3 = zielbereichTeile({ umsetzenAm: '2027-01-21' });
    expect(ansatzZweck(plus3, P23, J, Z)).toBe('umsetzen');
    expect(zaehlendePflanzungen(plus3, P23, 'umsetzen', J, Z)).toHaveLength(6);
    const plus4 = zielbereichTeile({ umsetzenAm: '2027-01-22' });
    expect(ansatzZweck(plus4, P23, J, Z)).toBe('bewertung');
    expect(ids(zaehlendePflanzungen(plus4, P23, 'umsetzen', J, Z))).toEqual(sortiert(STEHEND_23));
  });

  it('R2.2 überfälliges Umsetzdatum (gestern) und heute zählen', () => {
    for (const am of ['2027-01-17', '2027-01-18', '2027-01-10']) {
      const t = zielbereichTeile({ umsetzenAm: am });
      expect(ansatzZweck(t, P23, J, Z)).toBe('umsetzen');
      expect(zaehlendePflanzungen(t, P23, 'umsetzen', J, Z)).toHaveLength(6);
    }
  });

  it('R2.2 TZ heute + 3 nach dem Kalendertag in Zürich, nicht in UTC', () => {
    const t = zielbereichTeile({ umsetzenAm: '2027-01-22' });
    // 18.1. 23:30 UTC = 19.1. 00:30 Zürich: heute + 3 = 22.1.
    const nachMitternacht = new Date('2027-01-18T23:30:00Z');
    expect(ansatzZweck(t, P23, nachMitternacht, Z)).toBe('umsetzen');
    expect(zaehlendePflanzungen(t, P23, 'umsetzen', nachMitternacht, Z)).toHaveLength(6);
    // 18.1. 22:30 UTC = 18.1. 23:30 Zürich: heute + 3 = 21.1.
    const vorMitternacht = new Date('2027-01-18T22:30:00Z');
    expect(ansatzZweck(t, P23, vorMitternacht, Z)).toBe('bewertung');
  });

  it('R2.2 Reservierung storniert, umgesetzt, keimt nicht oder Ausfall zählt nicht', () => {
    const t = zielbereichTeile();
    const [r1, r2, r3] = RESERVIERT_23 as [string, string, string];
    // storniert: die Zeile steht noch im Bündel, aber mit storniert_am
    for (const name of ['reservierung', 'v_reservierung_aktiv'])
      t[name] = (t[name] ?? []).map((r) =>
        r['pflanzung_id'] === r1 ? { ...r, storniert_am: '2027-01-17T10:00:00.000Z' } : r,
      );
    // keimt nicht und Ausfall: Status der Pflanzung, Reservierung noch im Bündel
    zustand(t, r2)['status'] = 'keimt_nicht';
    zustand(t, r3)['status'] = 'ausfall';
    expect(ids(zaehlendePflanzungen(t, P23, 'umsetzen', J, Z))).toEqual(sortiert(STEHEND_23));
    expect(ansatzZweck(t, P23, J, Z)).toBe('bewertung');

    // umgesetzt: v_reservierung_aktiv ohne die Zeile, die Pflanzung steht jetzt in 2.3.4
    const u = zielbereichTeile();
    u['v_reservierung_aktiv'] = (u['v_reservierung_aktiv'] ?? []).filter((r) => r['pflanzung_id'] !== r1);
    Object.assign(zustand(u, r1), {
      platz_id: P23,
      netztopf_id: netztopfId('2.3.4'),
      loch_nr: 4,
      phase: 'anzucht',
    });
    const z = zaehlendePflanzungen(u, P23, 'umsetzen', J, Z);
    expect(z).toHaveLength(6);
    expect(ids(z.filter((p) => p.rolle === 'einziehend'))).toEqual(sortiert([r2, r3]));
    expect(ids(z.filter((p) => p.rolle === 'stehend'))).toEqual(sortiert([...STEHEND_23, r1]));
  });

  it('R2.2 Zieltopf mit Heimplatz im Gefäss zählt, auch wenn er auf einer Station steht; ein Zieltopf anderswo nicht (A3)', () => {
    const t = zielbereichTeile();
    t['v_netztopf_platz'] = [
      {
        netztopf_id: netztopfId('2.3.6'),
        kennung: '2.3.6',
        platz_id: platzId('4.4'),
        loch_nr: 3,
        ausser_heim: true,
      },
    ];
    expect(zaehlendePflanzungen(t, P23, 'umsetzen', J, Z)).toHaveLength(6);
    // Reservierung 3 auf 2.1.1 statt 2.3.6
    for (const name of ['reservierung', 'v_reservierung_aktiv'])
      t[name] = (t[name] ?? []).map((r) =>
        r['pflanzung_id'] === RESERVIERT_23[2] ? { ...r, netztopf_id: netztopfId('2.1.1') } : r,
      );
    expect(zaehlendePflanzungen(t, P23, 'umsetzen', J, Z)).toHaveLength(5);
    expect(ansatzZweck(t, P21, J, Z)).toBe('umsetzen');
    expect(ids(zaehlendePflanzungen(t, P21, 'umsetzen', J, Z))).toEqual([RESERVIERT_23[2]]);
  });

  it('R2.2 einziehende zählen in der späteren von bestätigter Phase und Anzucht', () => {
    const t = zielbereichTeile();
    zustand(t, RESERVIERT_23[0] as string)['phase'] = 'wachstum';
    zustand(t, RESERVIERT_23[1] as string)['phase'] = 'anzucht';
    const phase = new Map(
      zaehlendePflanzungen(t, P23, 'umsetzen', J, Z).map((p) => [p.pflanzungId, p.phase] as const),
    );
    expect(phase.get(RESERVIERT_23[0] as string)).toBe('wachstum');
    expect(phase.get(RESERVIERT_23[1] as string)).toBe('anzucht');
    expect(phase.get(RESERVIERT_23[2] as string)).toBe('anzucht');
  });

  it('R2.2 reservierte zählen nie in der Bewertung, beendete stehende auch nicht', () => {
    const t = zielbereichTeile();
    zustand(t, STEHEND_23[0] as string)['status'] = 'geerntet';
    expect(ids(zaehlendePflanzungen(t, P23, 'bewertung', J, Z))).toEqual(
      sortiert([STEHEND_23[1] as string, STEHEND_23[2] as string]),
    );
  });
});

describe('R2.2 Zweck und Direktsaat', () => {
  /** Direktsaat Rucola in 3.2, gesät `saat`, zwei Pflanzungen in Keimung */
  function direktsaat(saat = '2027-01-18', t = zielbereichTeile()): Teile {
    satzDazu(t, {
      nr: 40,
      sorte: 'rucola',
      kulturform: 'babyleaf',
      saatdatum: saat,
      phase: 'keimung',
      anzahl: 2,
      direktsaat: '3.2',
    });
    return t;
  }
  const GESAET = [pflanzungId(40, 1), pflanzungId(40, 2)];

  it('R2.2 ansatzZweck: umsetzen vor direktsaat vor bewertung vor ohne', () => {
    expect(ansatzZweck(zielbereichTeile(), P23, J, Z)).toBe('umsetzen');
    expect(ansatzZweck(zielbereichTeile({ umsetzenAm: '2027-01-25' }), P23, J, Z)).toBe('bewertung');
    expect(ansatzZweck(zielbereichTeile(), P21, J, Z)).toBe('ohne');
    const t = direktsaat();
    expect(ansatzZweck(t, P32, J, Z)).toBe('direktsaat');
    // stehende Pflanzung in 3.2: Direktsaat geht der Bewertung vor
    satzDazu(t, {
      nr: 41,
      sorte: 'matador',
      kulturform: 'babyleaf',
      saatdatum: '2026-12-20',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['3.2.6'], umgesetztAm: '2027-01-05T08:00:00.000Z' },
    });
    expect(ansatzZweck(t, P32, J, Z)).toBe('direktsaat');
    // einziehende Pflanzung in 3.2 innert 3 Tagen: Umsetzen geht der Direktsaat vor (A4)
    satzDazu(t, {
      nr: 42,
      sorte: 'lollo',
      saatdatum: '2026-12-28',
      phase: 'anzucht',
      anzahl: 1,
      reserviert: { toepfe: ['3.2.5'], umsetzenAm: '2027-01-19' },
    });
    expect(ansatzZweck(t, P32, J, Z)).toBe('umsetzen');
  });

  it('R2.2 Direktsaat zählt die gesäten in Phase wachstum, auch wenn die bestätigte Phase keimung ist', () => {
    const t = direktsaat();
    const z = zaehlendePflanzungen(t, P32, 'direktsaat', J, Z);
    expect(ids(z)).toEqual(sortiert(GESAET));
    expect(z.every((p) => p.phase === 'wachstum' && p.rolle === 'gesaet')).toBe(true);
    const s = schnittmenge(t, P32, z);
    expect(s.art).toBe('ok');
    if (s.art === 'ok') {
      // Rucola Wachstum 0.5–0.9 Zuwachs + ECWasser 0.5
      expect(s.ec).toEqual({ min: 100, max: 140 });
      expect(s.ph).toEqual({ min: 600, max: 650 });
    }
    // eine nicht gekeimte zählt nicht
    zustand(t, GESAET[1] as string)['status'] = 'keimt_nicht';
    expect(ids(zaehlendePflanzungen(t, P32, 'direktsaat', J, Z))).toEqual([GESAET[0]]);
  });

  it('R2.2 Direktsaat nur bis zum ersten Neuansatz seit dem Saattag, danach Zweck bewertung (A5)', () => {
    const vorher = direktsaat('2027-01-10');
    ansatzDazu(vorher, { kennung: '3.2', begonnenAm: '2027-01-09T17:00:00.000Z' });
    expect(ansatzZweck(vorher, P32, J, Z)).toBe('direktsaat');

    const nachfuellen = direktsaat('2027-01-10');
    ansatzDazu(nachfuellen, { kennung: '3.2', typ: 'nachfuellen', begonnenAm: '2027-01-12T17:00:00.000Z' });
    expect(ansatzZweck(nachfuellen, P32, J, Z)).toBe('direktsaat');

    const storniert = direktsaat('2027-01-10');
    ansatzDazu(storniert, {
      kennung: '3.2',
      begonnenAm: '2027-01-12T17:00:00.000Z',
      storniertAm: '2027-01-12T18:00:00.000Z',
    });
    expect(ansatzZweck(storniert, P32, J, Z)).toBe('direktsaat');

    const nachher = direktsaat('2027-01-10');
    ansatzDazu(nachher, { kennung: '3.2', begonnenAm: '2027-01-12T17:00:00.000Z' });
    expect(ansatzZweck(nachher, P32, J, Z)).toBe('bewertung');
    // Bewertung: die gesäten über den Direktsaat-Platz, in ihrer bestätigten Phase
    const z = zaehlendePflanzungen(nachher, P32, 'bewertung', J, Z);
    expect(ids(z)).toEqual(sortiert(GESAET));
    expect(z.every((p) => p.phase === 'keimung')).toBe(true);
  });

  it('R2.2 Direktsaat: der laufende eigene Neuansatz beendet den Zweck nicht, erst der abgeschlossene', () => {
    const t = direktsaat('2027-01-10');
    // der Neuansatz, den Tim gerade mit der Abhakliste ansetzt (heute 08:30 Zürich, nach dem Saattag)
    ansatzDazu(t, { kennung: '3.2', status: 'laufend', begonnenAm: '2027-01-18T07:30:00.000Z' });
    expect(ansatzZweck(t, P32, J, Z)).toBe('direktsaat');
    const z = zaehlendePflanzungen(t, P32, 'direktsaat', J, Z);
    expect(ids(z)).toEqual(sortiert(GESAET));
    expect(z.every((p) => p.phase === 'wachstum' && p.rolle === 'gesaet')).toBe(true);
    // abgeschlossen: Direktsaat vorbei, Bewertung
    for (const a of t['naehrloesungsansatz'] ?? []) if (a['platz_id'] === P32) a['status'] = 'abgeschlossen';
    expect(ansatzZweck(t, P32, J, Z)).toBe('bewertung');
  });

  it('R2.2 ohne zählende und ohne Umsetzung innert 3 Tagen: niemand, Rechner verlangt Ziel-EC und Stadium (RF7)', () => {
    const t = zielbereichTeile();
    satzDazu(t, {
      nr: 43,
      sorte: 'lollo',
      saatdatum: '2026-12-28',
      phase: 'anzucht',
      anzahl: 1,
      reserviert: { toepfe: ['2.1.1'], umsetzenAm: '2027-01-22' },
    });
    expect(ansatzZweck(t, P21, J, Z)).toBe('ohne');
    const z = zaehlendePflanzungen(t, P21, 'ohne', J, Z);
    expect(z).toEqual([]);
    expect(schnittmenge(t, P21, z).art).toBe('ohne_band');
    expect(gerechnetFuerText(t, z)).toBe('niemand, Ziel-EC und Stadium von Hand');
  });
});

describe('R2.1 Schnittmenge der zählenden', () => {
  it('R2.1 Schnittmenge 0.8–1.2 ∩ 0.9–1.6 = 0.9–1.2', () => {
    const t = zielbereichTeile();
    const s = schnittmenge(t, platzId('1.1'), [...zp('lollo', 'anzucht', 2), ...zp('genoveser', 'anzucht')]);
    expect(s.art).toBe('ok');
    if (s.art !== 'ok') return;
    expect(s.ec).toEqual({ min: 90, max: 120 });
    expect(s.ec.max - s.ec.min).toBe(30);
    expect(s.ph).toEqual({ min: 580, max: 650 });
  });

  it('R2.1 leer bei 1.0–1.4 ∩ 1.5–1.8; leer auch bei disjunktem pH; Berührung an einer Grenze ist nicht leer', () => {
    const t = zielbereichTeile();
    const P11 = platzId('1.1');
    expect(schnittmenge(t, P11, [...zp('lollo', 'wachstum'), ...zp('ochsenherz', 'wachstum')]).art).toBe(
      'leer',
    );
    // pH disjunkt (5.0–5.5 gegen 5.8–6.5), EC überlappend
    const ph = zielbereichTeile();
    sollwertSetzen(ph, 'ochsenherz', 'wachstum', 'ph', 5.0, 5.5);
    sollwertSetzen(ph, 'ochsenherz', 'wachstum', 'ec', 1.0, 1.4);
    expect(schnittmenge(ph, P11, [...zp('lollo', 'wachstum'), ...zp('ochsenherz', 'wachstum')]).art).toBe(
      'leer',
    );
    // EC 1.0–1.4 ∩ 1.4–1.8 = 1.4–1.4
    const grenze = zielbereichTeile();
    sollwertSetzen(grenze, 'ochsenherz', 'wachstum', 'ec', 1.4, 1.8);
    const s = schnittmenge(grenze, P11, [...zp('lollo', 'wachstum'), ...zp('ochsenherz', 'wachstum')]);
    expect(s.art).toBe('ok');
    if (s.art === 'ok') {
      expect(s.ec).toEqual({ min: 140, max: 140 });
      expect(s.ph).toEqual({ min: 580, max: 630 });
    }
  });

  it('R2.1 eine Pflanzung ohne EC-Band grenzt nicht ein; ohne Band bei allen ohne_band (A7)', () => {
    const t = zielbereichTeile();
    const P11 = platzId('1.1');
    // Spinat in Keimung hat keine Sollwerte
    const s = schnittmenge(t, P11, [...zp('lollo', 'wachstum', 2), ...zp('matador', 'keimung')]);
    expect(s.art).toBe('ok');
    if (s.art === 'ok') {
      expect(s.ec).toEqual({ min: 100, max: 140 });
      expect(s.ph).toEqual({ min: 580, max: 650 });
    }
    expect(schnittmenge(t, P11, zp('matador', 'keimung', 2)).art).toBe('ohne_band');
    expect(schnittmenge(t, P11, []).art).toBe('ohne_band');
  });

  it('R2.1 EC mit Basis zuwachs plus ECWasser der Anlage', () => {
    const t = zielbereichTeile();
    const P11 = platzId('1.1');
    const nurRucola = schnittmenge(t, P11, zp('rucola', 'wachstum'));
    expect(nurRucola.art === 'ok' && nurRucola.ec).toEqual({ min: 100, max: 140 });
    t['v_ec_wasser'] = (t['v_ec_wasser'] ?? []).map((w) => ({ ...w, ec: 0.4 }));
    const s = schnittmenge(t, P11, [...zp('rucola', 'wachstum'), ...zp('lollo', 'anzucht')]);
    expect(s.art).toBe('ok');
    // Rucola 0.5–0.9 + 0.4 = 0.9–1.3; Salat Anzucht 0.8–1.2 gesamt
    if (s.art === 'ok') expect(s.ec).toEqual({ min: 90, max: 120 });
  });

  it('R2.1 Wassertemperatur ohne Band: Standard 18–22 °C; mit Band die Schnittmenge', () => {
    const t = zielbereichTeile();
    const P11 = platzId('1.1');
    const ohne = schnittmenge(t, P11, zp('lollo', 'anzucht'));
    expect(ohne.art === 'ok' && ohne.temperatur).toEqual(TEMPERATUR_STANDARD);
    const mit = schnittmenge(t, P11, [...zp('lollo', 'wachstum'), ...zp('genoveser', 'wachstum')]);
    expect(mit.art === 'ok' && mit.temperatur).toEqual({ min: 1800, max: 2400 });
  });

  it('R2.1 begrenzt nennt die begrenzende Pflanzung (R2.5: EC-Obergrenze 1.2 durch Lollo Rossa)', () => {
    const t = zielbereichTeile();
    const lollo = zp('lollo', 'anzucht');
    const tomate = zp('ochsenherz', 'anzucht');
    const s = schnittmenge(t, platzId('1.1'), [...zp('genoveser', 'anzucht'), ...tomate, ...lollo]);
    expect(s.art).toBe('ok');
    if (s.art !== 'ok') return;
    // Lollo 0.8–1.2, Ochsenherz 1.0–1.6 (pH bis 6.3), Genoveser 0.9–1.6
    expect(s.ec).toEqual({ min: 100, max: 120 });
    expect(s.begrenzt.ecMax).toBe(lollo[0]?.pflanzungId);
    expect(s.begrenzt.ecMin).toBe(tomate[0]?.pflanzungId);
    expect(s.begrenzt.phMax).toBe(tomate[0]?.pflanzungId);
  });
});

describe('R2.2 Gerechnet für', () => {
  it('R2.2 Gerechnet für: 3 × Salat Wachstum, 3 reserviert Salat Anzucht', () => {
    const t = zielbereichTeile();
    const z = zaehlendePflanzungen(t, P23, 'umsetzen', J, Z);
    expect(gerechnetFuerText(t, z)).toBe('3 × Salat Wachstum, 3 reserviert Salat Anzucht');
    expect(gerechnetFuerText(t, zaehlendePflanzungen(t, P23, 'bewertung', J, Z))).toBe('3 × Salat Wachstum');
  });

  it('R2.2 Konzeptbeispiel «4 × Tomate Blüte, 2 reserviert Basilikum Anzucht», die stehenden zuerst', () => {
    const t = zielbereichTeile();
    const tomaten = zp('ochsenherz', 'bluete', 4);
    const basilikum = zp('genoveser', 'anzucht', 2, 'einziehend');
    expect(gerechnetFuerText(t, [...tomaten, ...basilikum])).toBe(
      '4 × Tomate Blüte, 2 reserviert Basilikum Anzucht',
    );
    expect(gerechnetFuerText(t, [...basilikum, ...tomaten])).toBe(
      '4 × Tomate Blüte, 2 reserviert Basilikum Anzucht',
    );
  });

  it('R2.2 Gerechnet für: Gruppen nach Art und Phase, gesäte wie stehende', () => {
    const t = zielbereichTeile();
    // zwei Sorten derselben Art in derselben Phase bilden eine Gruppe
    expect(
      gerechnetFuerText(t, [
        ...zp('lollo', 'wachstum', 2),
        ...zp('eichblatt', 'wachstum'),
        ...zp('lollo', 'anzucht'),
      ]),
    ).toBe('3 × Salat Wachstum, 1 × Salat Anzucht');
    expect(gerechnetFuerText(t, zp('rucola', 'wachstum', 2, 'gesaet'))).toBe('2 × Rucola Wachstum');
    expect(gerechnetFuerText(t, zp('ochsenherz', 'fruchtbildung_reife'))).toBe(
      '1 × Tomate Fruchtbildung und Reife',
    );
    expect(gerechnetFuerText(t, [])).toBe('niemand, Ziel-EC und Stadium von Hand');
  });
});

describe('R2.2 Wechsel am Umsetztag', () => {
  const FEB = new Date('2027-02-20T08:00:00Z');

  it('R2.2 Wechsel am Umsetztag: Lösung 7 Tage alt → vorschlagen, 6 Tage → Lösung bleibt (Beispiel 2.1 am 24.2., Neuansatz 18.2.)', () => {
    const t = zielbereichTeile();
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-18T17:00:00.000Z' });
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'loesung_bleibt', alterTage: 6 });
    expect(wechselAmUmsetztag(t, P21, '2027-02-25', FEB, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 7,
    });
    expect(wechselAmUmsetztag(t, P21, '2027-03-04', FEB, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 14,
    });
    expect(wechselAmUmsetztag(t, P21, '2027-02-18', FEB, Z)).toEqual({ art: 'loesung_bleibt', alterTage: 0 });
  });

  it('R2.2 TZ Wechsel am Umsetztag: Alter in Kalendertagen in Zürich', () => {
    const t = zielbereichTeile();
    // 17.2. 23:30 UTC = 18.2. 00:30 Zürich
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-17T23:30:00.000Z' });
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'loesung_bleibt', alterTage: 6 });
  });

  it('R2.2 Wechsel am Umsetztag ohne Ansatz oder nach «geleert»: erster Ansatz', () => {
    const t = zielbereichTeile();
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'erster_ansatz' });
    expect(wechselAmUmsetztag(t, P23, PLUS_3, J, Z)).toEqual({ art: 'erster_ansatz' });
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-01T17:00:00.000Z' });
    geleertDazu(t, '2.1', '2027-02-15T17:00:00.000Z');
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'erster_ansatz' });
    // geleert storniert: die Lösung vom 1.2. gilt wieder
    const s = zielbereichTeile();
    ansatzDazu(s, { kennung: '2.1', begonnenAm: '2027-02-01T17:00:00.000Z' });
    geleertDazu(s, '2.1', '2027-02-15T17:00:00.000Z', '2027-02-15T17:05:00.000Z');
    expect(wechselAmUmsetztag(s, P21, '2027-02-24', FEB, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 23,
    });
  });

  it('R2.2 Wechsel am Umsetztag: abgebrochener oder stornierter Ansatz zählt nicht, Nachfüllen auch nicht', () => {
    const t = zielbereichTeile();
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-10T17:00:00.000Z' });
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-20T07:00:00.000Z', status: 'abgebrochen' });
    ansatzDazu(t, {
      kennung: '2.1',
      begonnenAm: '2027-02-19T17:00:00.000Z',
      storniertAm: '2027-02-19T18:00:00.000Z',
    });
    ansatzDazu(t, { kennung: '2.1', typ: 'nachfuellen', begonnenAm: '2027-02-19T09:00:00.000Z' });
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 14,
    });
    // ein laufender Neuansatz ist die Lösung
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-02-20T07:30:00.000Z', status: 'laufend' });
    expect(wechselAmUmsetztag(t, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'loesung_bleibt', alterTage: 4 });
    // nur ein abgebrochener: erster Ansatz
    const nurAbgebrochen = zielbereichTeile();
    ansatzDazu(nurAbgebrochen, {
      kennung: '2.1',
      begonnenAm: '2027-02-10T17:00:00.000Z',
      status: 'abgebrochen',
    });
    expect(wechselAmUmsetztag(nurAbgebrochen, P21, '2027-02-24', FEB, Z)).toEqual({ art: 'erster_ansatz' });
    // ein Ansatz in einem anderen Gefäss zählt nicht
    expect(wechselAmUmsetztag(t, P23, '2027-02-24', FEB, Z)).toEqual({ art: 'erster_ansatz' });
  });

  it('R2.2 TZ Wechsel am Umsetztag über die Umstellung am 28.3.2027 in ganzen Tagen (G2)', () => {
    const t = zielbereichTeile();
    const maerz = new Date('2027-03-26T08:00:00Z');
    // 24.3. 19:00 Zürich (Winterzeit)
    ansatzDazu(t, { kennung: '2.1', begonnenAm: '2027-03-24T18:00:00.000Z' });
    expect(wechselAmUmsetztag(t, P21, '2027-03-30', maerz, Z)).toEqual({
      art: 'loesung_bleibt',
      alterTage: 6,
    });
    expect(wechselAmUmsetztag(t, P21, '2027-03-31', maerz, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 7,
    });
    // 27.3. 23:30 UTC = 28.3. 00:30 Zürich
    const u = zielbereichTeile();
    ansatzDazu(u, { kennung: '2.1', begonnenAm: '2027-03-27T23:30:00.000Z' });
    expect(wechselAmUmsetztag(u, P21, '2027-04-04', maerz, Z)).toEqual({
      art: 'wechsel_vorschlagen',
      alterTage: 7,
    });
    expect(wechselAmUmsetztag(u, P21, '2027-04-03', maerz, Z)).toEqual({
      art: 'loesung_bleibt',
      alterTage: 6,
    });
  });
});
