// pH-Ziel und pH-Korrektur (Plan 29 Testliste rechner-ph; UC9-AK7, UC9 Ablauf 6; Konzept R4.14, R4.11, R10.2, R10.4).
// Rechenbeispiel aus Konzept R4.14 und UC9-AK7: 9 l, pH 6.9, Ziel 6.25, w 0.1 → Vorschlag 5.85 ml, Anzeige «zuerst
// 2.9 ml, erwartet 6.6, nach 15 min nachmessen». Rein, ohne Uhr.
//
// Vertrag (Plan 29 «Signaturen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/rechner-ph.ts
//     phZielErsteinstellung(e: { art: Messart; phBand?: Band }): Hundertstel
//       dwc, konstantpegel → Bandmitte; kratky, kratky_belueftet → unterer Rand; station → 600 ohne Band.
//     phWirkung(sicht: number | null): Bruch  (ml pH-Minus je l je 0.1 pH; null → 0.1)
//     phKorrekturVorschlag(e: { volumen: Hundertstel l; phIst: Hundertstel; phZiel: Hundertstel; w: Bruch;
//                               mengeMl?: Zehntel ml (geänderte Menge «zuerst») })
//       → { art: 'kein' } | { art: 'vorschlag'; vorschlagMl: Bruch (Zehntel ml, exakt); zuerstMl: Zehntel ml;
//                             erwartet: Hundertstel; text }
//       Vorschlag = w · V · (pHIst − pHZiel) / 0.1; zuerst = rundeMenge(Vorschlag / 2) (R4.11) oder mengeMl;
//       erwartet = pHIst − zuerst / (w · V) · 0.1, auf Hundertstel; text «zuerst 2.9 ml, erwartet 6.6, nach 15 min
//       nachmessen» (pH auf eine Dezimale, A3). pHIst ≤ pHZiel → kein Vorschlag.
//     phKorrekturAngebot(hinweise: readonly Hinweis[]): boolean (nur mit «pH schrittweise senken», A2)
import { describe, expect, it } from 'vitest';
import type { Hinweis } from '../../src/domain/bewertung/hinweise.ts';
import {
  phKorrekturAngebot,
  phKorrekturVorschlag,
  phWirkung,
  phZielErsteinstellung,
} from '../../src/domain/rechner-ph.ts';
import { alsZahl } from '../../src/domain/rechner-zahlen.ts';

const BAND = { min: 600, max: 650 };

function vorschlag(e: Parameters<typeof phKorrekturVorschlag>[0]) {
  const r = phKorrekturVorschlag(e);
  if (r.art !== 'vorschlag') throw new Error(`erwartet Vorschlag, erhalten ${r.art}`);
  return r;
}

const hinweis = (ausloeser: Hinweis['ausloeser'], massnahme: string): Hinweis => ({
  ausloeser,
  text: 'Text',
  folge: 'Folge',
  massnahme,
  ton: 'warn',
});
const SENKEN = 'pH schrittweise senken, nach 15 min nachmessen';

describe('pH-Korrektur im Betrieb (R4.14)', () => {
  it('UC9-AK7 9 l, pH 6.9, Ziel 6.25, Wirkung 0.1: Vorschlag 5.85 ml, Anzeige «zuerst 2.9 ml, erwartet 6.6, nach 15 min nachmessen»', () => {
    const r = vorschlag({ volumen: 900, phIst: 690, phZiel: 625, w: phWirkung(null) });
    expect(alsZahl(r.vorschlagMl)).toBe(58.5);
    expect(r.zuerstMl).toBe(29);
    // 6.9 − 2.9 / (0.1 · 9) · 0.1 = 6.578 → 6.58 (A3)
    expect(r.erwartet).toBe(658);
    expect(r.text).toBe('zuerst 2.9 ml, erwartet 6.6, nach 15 min nachmessen');
  });

  it('UC9-AK7 das Ziel der Ersteinstellung ist bei DWC die Bandmitte 6.25 und speist den Vorschlag', () => {
    const ziel = phZielErsteinstellung({ art: 'dwc', phBand: BAND });
    expect(ziel).toBe(625);
    expect(vorschlag({ volumen: 900, phIst: 690, phZiel: ziel, w: phWirkung(null) }).zuerstMl).toBe(29);
  });

  it('UC9-AK7 pH gleich dem Ziel oder darunter ergibt keinen Vorschlag, ein Hundertstel darüber einen (keine Komponente auf 0)', () => {
    const w = phWirkung(null);
    expect(phKorrekturVorschlag({ volumen: 900, phIst: 625, phZiel: 625, w })).toEqual({ art: 'kein' });
    expect(phKorrekturVorschlag({ volumen: 900, phIst: 610, phZiel: 625, w })).toEqual({ art: 'kein' });
    const knapp = vorschlag({ volumen: 900, phIst: 626, phZiel: 625, w });
    // 0.1 · 9 · 0.01 / 0.1 = 0.09 ml; die Hälfte 0.045 ml wird nicht 0, sondern 0.1 ml (R4.11, R4.4)
    expect(alsZahl(knapp.vorschlagMl)).toBe(0.9);
    expect(knapp.zuerstMl).toBe(1);
  });

  it('UC9-AK7 «zuerst» unter 5 ml auf 0.1 ml, ab 5 ml auf 0.5 ml (R4.11)', () => {
    // 9 l, pH 7.5, Ziel 6.25: Vorschlag 11.25 ml, die Hälfte 5.625 ml → 5.5 ml; erwartet 7.5 − 5.5 / 0.9 · 0.1 = 6.889
    const gross = vorschlag({ volumen: 900, phIst: 750, phZiel: 625, w: phWirkung(null) });
    expect(alsZahl(gross.vorschlagMl)).toBe(112.5);
    expect(gross.zuerstMl).toBe(55);
    expect(gross.erwartet).toBe(689);
    expect(gross.text).toBe('zuerst 5.5 ml, erwartet 6.9, nach 15 min nachmessen');
    // 9 l, pH 6.8, Ziel 6.25: Vorschlag 4.95 ml, die Hälfte 2.475 ml → 2.5 ml
    expect(vorschlag({ volumen: 900, phIst: 680, phZiel: 625, w: phWirkung(null) }).zuerstMl).toBe(25);
  });

  it('UC9-AK7 mit geänderter Menge rechnet der erwartete Wert neu', () => {
    // 4.0 ml statt 2.9 ml: 6.9 − 4.0 / 0.9 · 0.1 = 6.456 → 6.46
    const r = vorschlag({ volumen: 900, phIst: 690, phZiel: 625, w: phWirkung(null), mengeMl: 40 });
    expect(alsZahl(r.vorschlagMl)).toBe(58.5);
    expect(r.zuerstMl).toBe(40);
    expect(r.erwartet).toBe(646);
    expect(r.text).toBe('zuerst 4.0 ml, erwartet 6.5, nach 15 min nachmessen');
  });

  it('UC9-AK7 Wirkung aus v_ph_wirkung: ohne Wert 0.1, sonst der Mittelwert der Sicht', () => {
    expect(alsZahl(phWirkung(null))).toBe(0.1);
    expect(alsZahl(phWirkung(0.12))).toBe(0.12);
    // w 0.12: Vorschlag 0.12 · 9 · 6.5 = 7.02 ml, zuerst 3.51 → 3.5 ml; erwartet 6.9 − 3.5 / 1.08 · 0.1 = 6.576
    const r = vorschlag({ volumen: 900, phIst: 690, phZiel: 625, w: phWirkung(0.12) });
    expect(alsZahl(r.vorschlagMl)).toBe(70.2);
    expect(r.zuerstMl).toBe(35);
    expect(r.erwartet).toBe(658);
  });
});

describe('pH-Ziel der Ersteinstellung je Betriebsart (R4.14, R4.10, R10.4)', () => {
  it('UC9-AK7 DWC und Konstantpegel Bandmitte, Kratky und Kratky belüftet unterer Rand, Station 6.00', () => {
    expect(phZielErsteinstellung({ art: 'dwc', phBand: BAND })).toBe(625);
    expect(phZielErsteinstellung({ art: 'konstantpegel', phBand: BAND })).toBe(625);
    expect(phZielErsteinstellung({ art: 'kratky_belueftet', phBand: BAND })).toBe(600);
    expect(phZielErsteinstellung({ art: 'kratky', phBand: BAND })).toBe(600);
    expect(phZielErsteinstellung({ art: 'station' })).toBe(600);
  });
});

describe('Angebot pH-Minus in der Ergebniszone (UC9 Ablauf 6, A2)', () => {
  it('UC9-AK7 Vorschlag mit «pH schrittweise senken» (ph_hoch, eisen), nicht ohne pH-Hinweis und nicht bei ph_tief', () => {
    expect(phKorrekturAngebot([hinweis('ph_hoch', SENKEN)])).toBe(true);
    expect(phKorrekturAngebot([hinweis('ec_hoch', 'Teilwechsel'), hinweis('eisen', SENKEN)])).toBe(true);
    expect(phKorrekturAngebot([])).toBe(false);
    expect(phKorrekturAngebot([hinweis('ec_tief', 'Restdosis geben')])).toBe(false);
    expect(phKorrekturAngebot([hinweis('ph_tief', 'pH vorsichtig anheben')])).toBe(false);
  });
});
