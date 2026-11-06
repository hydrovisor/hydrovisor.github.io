// Einstellungen (Plan 32; UC0-AK3, UC0-AK4; R4.1, R4.4, R5.5). Routine: Tests vom Lead.
import { describe, expect, it } from 'vitest';
import {
  aufHalbe,
  kannenBeispiel,
  kannePruefen,
  kAus,
  kHerkunftAus,
  kSatzPruefen,
  kVorgang,
  kWirksam,
  messgeraetPruefen,
  messmittelPruefen,
  pflegebudgetPruefen,
  pushZeitPruefen,
  ruheVorgang,
  vorlaufPruefen,
} from '../../src/domain/einstellungen/einstellungen.ts';

const K03 = { grow: 0.3, micro_hard_water: 0.3, bloom: 0.3 };
const text = (g: number, m: number, b: number) => ({
  grow: String(g),
  micro_hard_water: String(m),
  bloom: String(b),
});

describe('UC0-AK3 Push-Zeit und Kanne (R5.5, R4.4)', () => {
  it('UC0-AK3 Push-Zeit 05:00 und 22:00 gültig, 04:59 und 22:01 abgelehnt', () => {
    expect(pushZeitPruefen('05:00')).toEqual({ ok: true, wert: '05:00' });
    expect(pushZeitPruefen('22:00')).toEqual({ ok: true, wert: '22:00' });
    expect(pushZeitPruefen('7:30')).toEqual({ ok: true, wert: '07:30' });
    for (const falsch of ['04:59', '22:01', '23:00', '07:60', '7', '', 'abc'])
      expect(pushZeitPruefen(falsch)).toEqual({ ok: false, fehler: 'Push-Zeit nur 05:00 bis 22:00' });
  });

  it('UC0-AK3 Kanne 1 und 12 l gültig, 0.9 und 12.1 abgelehnt', () => {
    expect(kannePruefen('1')).toEqual({ ok: true, wert: 1 });
    expect(kannePruefen('12')).toEqual({ ok: true, wert: 12 });
    expect(kannePruefen('8,5')).toEqual({ ok: true, wert: 8.5 });
    expect(kannePruefen('0.9')).toMatchObject({ ok: false });
    expect(kannePruefen('12.1')).toMatchObject({ ok: false });
    expect(kannePruefen('8.25')).toMatchObject({ ok: false });
    expect(kannePruefen('')).toMatchObject({ ok: false });
  });

  it('UC0-AK3 Kanne 10 → 8 l: Rechenbeispiel «vorher 18.0 ml, neu 14.5 ml»', () => {
    expect(kannenBeispiel(10, 8)).toBe('2.3 halbe Dosis je Kanne: vorher 18.0 ml, neu 14.5 ml');
    expect(kannenBeispiel(10, 12)).toBe('2.3 halbe Dosis je Kanne: vorher 18.0 ml, neu 21.5 ml');
  });

  it('R4.4 Mengen auf 0.5 ml', () => {
    expect(aufHalbe(14.4)).toBe(14.5);
    expect(aufHalbe(21.6)).toBe(21.5);
    expect(aufHalbe(7.25)).toBe(7.5);
    expect(aufHalbe(1.7999999999)).toBe(2);
  });

  it('Vorlauf 0 bis 14 Tage', () => {
    expect(vorlaufPruefen('0')).toEqual({ ok: true, wert: 0 });
    expect(vorlaufPruefen('14')).toEqual({ ok: true, wert: 14 });
    expect(vorlaufPruefen('15')).toMatchObject({ ok: false });
    expect(vorlaufPruefen('1.5')).toMatchObject({ ok: false });
  });
});

describe('UC0-AK4 k-Satz (R4.1)', () => {
  it('UC0-AK4 k_wirksam ist die mit den Anteilen gewichtete Summe (Wachstum 1.8 : 1.2 : 0.6)', () => {
    expect(kWirksam(K03)).toBeCloseTo(0.3, 10);
    // 0.36 · 0.5 + 0.3 · 1/3 + 0.24 · 1/6 = 0.18 + 0.1 + 0.04 = 0.32
    expect(kWirksam({ grow: 0.36, micro_hard_water: 0.3, bloom: 0.24 })).toBeCloseTo(0.32, 10);
  });

  it('UC0-AK4 k-Satz mit k_wirksam 0.19 oder 0.46 nicht übernehmbar, 0.2 und 0.45 übernehmbar', () => {
    const bisher = { grow: 0.25, micro_hard_water: 0.25, bloom: 0.25 };
    expect(
      kSatzPruefen(text(0.19, 0.19, 0.19), { ...bisher, grow: 0.2, micro_hard_water: 0.2, bloom: 0.2 }),
    ).toMatchObject({
      art: 'abgelehnt',
      fehler: 'k wirksam nur 0.20 bis 0.45: nicht übernehmbar',
    });
    expect(
      kSatzPruefen(text(0.46, 0.46, 0.46), { grow: 0.45, micro_hard_water: 0.45, bloom: 0.45 }),
    ).toMatchObject({
      art: 'abgelehnt',
    });
    expect(kSatzPruefen(text(0.2, 0.2, 0.2), { grow: 0.21, micro_hard_water: 0.21, bloom: 0.21 }).art).toBe(
      'ok',
    );
    expect(
      kSatzPruefen(text(0.45, 0.45, 0.45), { grow: 0.44, micro_hard_water: 0.44, bloom: 0.44 }).art,
    ).toBe('ok');
    // einzelne Komponente ausserhalb, k_wirksam aber im Bereich: übernehmbar
    expect(kSatzPruefen(text(0.24, 0.5, 0.3), K03).art).not.toBe('abgelehnt');
    // k je Komponente nur zwischen 0 und 1
    expect(kSatzPruefen(text(0, 0.3, 0.3), K03)).toMatchObject({ art: 'abgelehnt' });
    expect(kSatzPruefen(text(1, 0.3, 0.3), K03)).toMatchObject({ art: 'abgelehnt' });
    expect(kSatzPruefen({ ...text(0.3, 0.3, 0.3), grow: 'x' }, K03)).toMatchObject({ art: 'abgelehnt' });
  });

  it('UC0-AK4 Änderung über 20 % braucht Rückfrage, genau 20 % nicht', () => {
    // 0.3 → 0.36 = +20 %: ohne Rückfrage
    expect(kSatzPruefen(text(0.36, 0.36, 0.36), K03).art).toBe('ok');
    // 0.3 → 0.24 = −20 %: ohne Rückfrage
    expect(kSatzPruefen(text(0.24, 0.24, 0.24), K03).art).toBe('ok');
    // 0.3 → 0.37 = +23.3 %: Rückfrage
    const r = kSatzPruefen(text(0.37, 0.37, 0.37), K03);
    expect(r).toMatchObject({ art: 'rueckfrage', prozent: 23.3 });
    expect(r.art === 'rueckfrage' ? r.text : '').toBe('k ändert sich um 23.3 % gegen bisher. Übernehmen?');
    expect(kSatzPruefen(text(0.23, 0.23, 0.23), K03).art).toBe('rueckfrage');
  });

  it('k aus dem Bündel: jüngste gültige Zeile je Komponente, sonst Startwert 0.3', () => {
    expect(kAus(undefined)).toEqual(K03);
    const teile = {
      k_faktor: [
        { produkt_id: 'grow', wert: '0.320', gilt_ab: '2026-12-01T10:00:00Z', storniert_am: null },
        { produkt_id: 'grow', wert: '0.340', gilt_ab: '2026-12-05T10:00:00Z', storniert_am: null },
        {
          produkt_id: 'grow',
          wert: '0.390',
          gilt_ab: '2026-12-06T10:00:00Z',
          storniert_am: '2026-12-06T10:01:00Z',
        },
        { produkt_id: 'bloom', wert: 0.28, gilt_ab: '2026-12-01T10:00:00Z', storniert_am: null },
      ],
    };
    expect(kAus(teile)).toEqual({ grow: 0.34, micro_hard_water: 0.3, bloom: 0.28 });
  });

  it('k-Vorgang: neue Zeile nur je geänderter Komponente, Quelle Becherversuch', () => {
    let n = 0;
    const ids = () => `00000000-0000-4000-8000-00000000000${String((n += 1))}`;
    const jetzt = new Date('2027-01-12T17:00:00Z');
    const v = kVorgang({ grow: 0.32, micro_hard_water: 0.3, bloom: 0.25 }, K03, ids, jetzt);
    expect(v).toHaveLength(2);
    expect(v.map((s) => (s.art === 'neu' ? s.felder['produkt_id'] : ''))).toEqual(['grow', 'bloom']);
    expect(v[0]).toMatchObject({
      art: 'neu',
      tabelle: 'k_faktor',
      felder: { wert: 0.32, quelle: 'becherversuch', gilt_ab: jetzt.toISOString() },
    });
  });
});

describe('Übrige Einstellungen', () => {
  it('Messgerät u_EC bis drei, u_pH bis zwei Dezimalen, je 0 bis 1', () => {
    expect(messgeraetPruefen('0.10', '0.10')).toEqual({ ok: true, wert: { u_ec: 0.1, u_ph: 0.1 } });
    expect(messgeraetPruefen('0.125', '0.05')).toEqual({ ok: true, wert: { u_ec: 0.125, u_ph: 0.05 } });
    expect(messgeraetPruefen('0.1255', '0.1')).toMatchObject({ ok: false });
    expect(messgeraetPruefen('0.1', '0.125')).toMatchObject({ ok: false });
    expect(messgeraetPruefen('1.5', '0.1')).toMatchObject({ ok: false });
  });

  it('Pflegebudget und Messmittel', () => {
    expect(pflegebudgetPruefen('20', '4')).toEqual({
      ok: true,
      wert: { pflegebudget_min_werktag: 20, pflegebudget_h_woche: 4 },
    });
    expect(pflegebudgetPruefen('20.5', '4')).toMatchObject({ ok: false });
    expect(messmittelPruefen('1 5 20 60')).toEqual({ ok: true, wert: [1, 5, 20, 60] });
    expect(messmittelPruefen('60, 20, 5, 1, 5')).toEqual({ ok: true, wert: [1, 5, 20, 60] });
    expect(messmittelPruefen('')).toMatchObject({ ok: false });
    expect(messmittelPruefen('1 x')).toMatchObject({ ok: false });
  });

  it('Ruhe je Gefäss als Ereignis ruhe {gesetzt}', () => {
    const jetzt = new Date('2027-01-12T17:00:00Z');
    expect(ruheVorgang('p-1', true, 'e-1', jetzt)).toEqual({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: 'e-1',
        id: 'e-1',
        typ: 'ruhe',
        platz_id: 'p-1',
        gilt_ab: jetzt.toISOString(),
        daten: { gesetzt: true },
      },
    });
  });
});

describe('Einstellungen Runde 1 (Befunde 4, 8, 9)', () => {
  it('UC0-AK4 genau 20 % ohne, knapp darüber mit Rückfrage; Grenze 0.45 exakt; höchstens drei Dezimalen', () => {
    // bisher 0.3 / 0.3 / 0.305 → k_wirksam 0.300833…; neu dreimal 0.361 → genau +20 %
    const bisher = { grow: 0.3, micro_hard_water: 0.3, bloom: 0.305 };
    expect(kSatzPruefen({ grow: '0.361', micro_hard_water: '0.361', bloom: '0.361' }, bisher).art).toBe('ok');
    expect(kSatzPruefen({ grow: '0.362', micro_hard_water: '0.361', bloom: '0.361' }, bisher).art).toBe(
      'rueckfrage',
    );
    // 0.45 / 0.45 / 0.451 → k_wirksam 0.450167: über der Grenze
    expect(
      kSatzPruefen(
        { grow: '0.45', micro_hard_water: '0.45', bloom: '0.451' },
        { grow: 0.44, micro_hard_water: 0.44, bloom: 0.44 },
      ),
    ).toMatchObject({ art: 'abgelehnt' });
    expect(kSatzPruefen({ grow: '0.3605', micro_hard_water: '0.36', bloom: '0.36' }, K03)).toEqual({
      art: 'abgelehnt',
      fehler: 'k mit höchstens drei Dezimalen',
    });
  });

  it('Messmittel mit höchstens einer Dezimale', () => {
    expect(messmittelPruefen('2.5 20')).toEqual({ ok: true, wert: [2.5, 20] });
    expect(messmittelPruefen('2.25 20')).toMatchObject({ ok: false });
  });

  it('k je Komponente mit «gültig ab» und Quelle', () => {
    const teile = {
      k_faktor: [
        {
          produkt_id: 'grow',
          wert: 0.32,
          gilt_ab: '2026-12-01T10:00:00Z',
          quelle: 'becherversuch',
          storniert_am: null,
        },
      ],
    };
    expect(kHerkunftAus(teile, 'Europe/Zurich')).toEqual({
      grow: 'gültig ab 1.12.2026 · Becherversuch',
      micro_hard_water: 'Startwert',
      bloom: 'Startwert',
    });
  });
});
