// Rückfrage bei ungewöhnlichem Sprung (Plan 26 Testliste; UC9-AK3 Sprungteil, UC9-AK12; R10.3; A16, A17).
// Injizierte Uhr jetzt = 12.1.2027 18:00 Zürich, Teile aus tests/fixtures/messen.ts.
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `sprungPruefen(e, jetzt)` mit e.ansaetze = Ansätze am Platz; e.hierWaechst = Namen der Kulturgruppen
//   («Salate», «Kräuter und Salate») oder '' ohne Pflanzungen.
// - Gefäss-Rückfrage: { art: 'gefaess', groesse: 'ec', text: 'Richtiges Gefäss? Hier wächst: Salate' }, ohne
//   Pflanzungen text = 'Richtiges Gefäss? Hier wächst nichts'.
// - Wert-Rückfrage: { art: 'wert', groesse, text: 'Ungewöhnlicher Sprung: pH 6.1 → 7.4. Stimmt der Wert?' }
//   (pH eine, EC zwei Dezimalen).
// - `messkontext(...).hierWaechst` = dieselben Namen ohne Doppel, alphabetisch, mit « und » verbunden; '' ohne
//   aktive Pflanzungen; `messergebnis(...).sprung` = Ergebnis von sprungPruefen für den Kontext.
import { describe, expect, it } from 'vitest';
import { sprungPruefen, type AnsatzZeile } from '../../src/domain/bewertung/verlauf.ts';
import type { Groesse } from '../../src/domain/messung/eingabe.ts';
import { messergebnis } from '../../src/domain/messung/ergebnis.ts';
import { messkontext } from '../../src/domain/messung/messkontext.ts';
import { ortAufloesen } from '../../src/domain/ort.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { JETZT, messTeile, pflanzungenHinzu, SORTE } from '../fixtures/messen.ts';
import { platzId, uid, type Teile } from '../fixtures/regal.ts';

const LETZTE = '2027-01-10T17:00:00.000Z';
type Vorher = Partial<Record<Groesse, { wert: number; giltAb: string }>>;

let n = 0;
function ansatz(typ: AnsatzZeile['typ'], begonnenAm: string, extra: Partial<AnsatzZeile> = {}): AnsatzZeile {
  n += 1;
  return {
    id: uid('21', 100 + n),
    platz_id: platzId('2.3'),
    typ,
    status: 'abgeschlossen',
    begonnen_am: begonnenAm,
    kontrollmessung_id: null,
    endmessung_id: null,
    storniert_am: null,
    ...extra,
  };
}

function pruefe(
  werte: Partial<Record<Groesse, number>>,
  vorher: Vorher,
  ansaetze: AnsatzZeile[] = [],
  hierWaechst = 'Salate',
) {
  return sprungPruefen({ werte, vorher, ansaetze, hierWaechst }, JETZT);
}

function kontext(kennung: string, teile: Teile = messTeile()) {
  const ort = ortAufloesen(`R-${kennung}`, teile);
  if (!ort) throw new Error(`Ort R-${kennung} fehlt`);
  return messkontext(teile, ort, JETZT, ZEITZONE);
}

const PH_61: Vorher = { ph: { wert: 610, giltAb: LETZTE } };
const EC_120: Vorher = { ec: { wert: 120, giltAb: LETZTE } };

describe('UC9-AK3 Sprung pH (R10.3)', () => {
  it('UC9-AK3 pH 6.1 → 7.4 ohne Lösungswechsel ergibt Rückfrage «Ungewöhnlicher Sprung»', () => {
    expect(pruefe({ ph: 740 }, PH_61)).toEqual({
      art: 'wert',
      groesse: 'ph',
      text: 'Ungewöhnlicher Sprung: pH 6.1 → 7.4. Stimmt der Wert?',
    });
    // über die Fixture: 2.3 mit pH 6.1 vom 10.1.
    const k = kontext('2.3');
    expect(messergebnis({ ph: 740 }, k, JETZT, ZEITZONE).sprung).toMatchObject({
      art: 'wert',
      groesse: 'ph',
    });
  });

  it('UC9-AK3 pH 6.1 → 7.4 nach Neuansatz ohne Rückfrage', () => {
    expect(pruefe({ ph: 740 }, PH_61, [ansatz('neuansatz', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
    expect(pruefe({ ph: 740 }, PH_61, [ansatz('teilwechsel', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
    // Nachfüllen ist kein Wechsel
    expect(pruefe({ ph: 740 }, PH_61, [ansatz('nachfuellen', '2027-01-11T10:00:00.000Z')])).toMatchObject({
      art: 'wert',
    });
  });

  it('UC9-AK3 pH-Sprung genau 1.0 ohne Rückfrage', () => {
    expect(pruefe({ ph: 710 }, PH_61)).toBeUndefined();
    expect(pruefe({ ph: 510 }, PH_61)).toBeUndefined();
    expect(pruefe({ ph: 509 }, PH_61)).toMatchObject({ art: 'wert', groesse: 'ph' });
  });
});

describe('UC9-AK12 Gefäss-Rückfrage (R10.3)', () => {
  it('UC9-AK12 EC 1.20 → 1.55 ohne Nachfüllen oder Wechsel: «Richtiges Gefäss? Hier wächst: Salate»', () => {
    expect(pruefe({ ec: 155 }, EC_120)).toEqual({
      art: 'gefaess',
      groesse: 'ec',
      text: 'Richtiges Gefäss? Hier wächst: Salate',
    });
    // über die Fixture: 2.3 mit EC 1.20 vom 10.1., Salate in 2.3
    const k = kontext('2.3');
    expect(k.hierWaechst).toBe('Salate');
    expect(messergebnis({ ph: 620, ec: 155, temperatur: 2050 }, k, JETZT, ZEITZONE).sprung).toEqual({
      art: 'gefaess',
      groesse: 'ec',
      text: 'Richtiges Gefäss? Hier wächst: Salate',
    });
    // auch nach unten
    expect(pruefe({ ec: 85 }, EC_120)).toMatchObject({ art: 'gefaess' });
  });

  it('UC9-AK12 nach Nachfüllen seit der letzten Messung keine Gefäss-Rückfrage', () => {
    expect(pruefe({ ec: 155 }, EC_120, [ansatz('nachfuellen', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
    expect(pruefe({ ec: 155 }, EC_120, [ansatz('teilwechsel', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
    expect(pruefe({ ec: 155 }, EC_120, [ansatz('neuansatz', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
  });

  it('UC9-AK12 Sprung genau 0.30 ohne Rückfrage', () => {
    expect(pruefe({ ec: 150 }, EC_120)).toBeUndefined();
    expect(pruefe({ ec: 90 }, EC_120)).toBeUndefined();
    expect(pruefe({ ec: 151 }, EC_120)).toMatchObject({ art: 'gefaess' });
  });
});

describe('R10.3 Rückfrage: Abgrenzungen', () => {
  it('R10.3 EC 1.20 → 2.10 nach Nachfüllen ohne Wechsel: Rückfrage «Ungewöhnlicher Sprung»', () => {
    const r = pruefe({ ec: 210 }, EC_120, [ansatz('nachfuellen', '2027-01-11T10:00:00.000Z')]);
    expect(r).toEqual({
      art: 'wert',
      groesse: 'ec',
      text: 'Ungewöhnlicher Sprung: EC 1.20 → 2.10. Stimmt der Wert?',
    });
    // genau 0.80 nach Nachfüllen: keine Rückfrage
    expect(pruefe({ ec: 200 }, EC_120, [ansatz('nachfuellen', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
    // nach einem Wechsel keine Rückfrage
    expect(pruefe({ ec: 210 }, EC_120, [ansatz('teilwechsel', '2027-01-11T10:00:00.000Z')])).toBeUndefined();
  });

  it('R10.3 Ansatz vor der letzten Messung zählt nicht als «seit»', () => {
    expect(pruefe({ ec: 155 }, EC_120, [ansatz('nachfuellen', '2027-01-09T10:00:00.000Z')])).toMatchObject({
      art: 'gefaess',
    });
    expect(pruefe({ ph: 740 }, PH_61, [ansatz('neuansatz', '2027-01-09T10:00:00.000Z')])).toMatchObject({
      art: 'wert',
    });
  });

  it('R10.3 stornierter Nachfüll-Ansatz zählt nicht', () => {
    const storniert = ansatz('nachfuellen', '2027-01-11T10:00:00.000Z', {
      storniert_am: '2027-01-11T10:05:00.000Z',
    });
    expect(pruefe({ ec: 155 }, EC_120, [storniert])).toMatchObject({ art: 'gefaess' });
  });

  it('R10.3 ohne vorherige Messung keine Rückfrage', () => {
    expect(pruefe({ ph: 740, ec: 300 }, {})).toBeUndefined();
  });

  it('R10.3 Hier wächst: zwei Kulturgruppen mit «und», ohne Pflanzungen «Hier wächst nichts»', () => {
    const teile = messTeile();
    pflanzungenHinzu(teile, { satzNr: 7, sorteId: SORTE.basilikum, anzahl: 1, kennung: '2.3' });
    pflanzungenHinzu(teile, { satzNr: 8, sorteId: SORTE.eichblatt, anzahl: 1, kennung: '2.3' });
    expect(kontext('2.3', teile).hierWaechst).toBe('Kräuter und Salate');
    expect(kontext('2.1').hierWaechst).toBe('');
    expect(pruefe({ ec: 155 }, EC_120, [], '')).toEqual({
      art: 'gefaess',
      groesse: 'ec',
      text: 'Richtiges Gefäss? Hier wächst nichts',
    });
    expect(pruefe({ ec: 155 }, EC_120, [], 'Kräuter und Salate')?.text).toBe(
      'Richtiges Gefäss? Hier wächst: Kräuter und Salate',
    );
  });

  it('R10.3 Direktsaat-Pflanzung zählt am Direktsaat-Platz', () => {
    const teile = messTeile();
    pflanzungenHinzu(teile, { satzNr: 9, sorteId: SORTE.spinat, anzahl: 2, direktsaat: '2.1' });
    expect(kontext('2.1', teile).hierWaechst).toBe('Blattgemüse');
    // abgeschlossene Pflanzungen zählen nicht
    const ohne = messTeile();
    for (const z of ohne['v_pflanzung_zustand'] ?? [])
      if (z['platz_id'] === platzId('2.3')) z['status'] = 'geerntet';
    expect(kontext('2.3', ohne).hierWaechst).toBe('');
  });
});
