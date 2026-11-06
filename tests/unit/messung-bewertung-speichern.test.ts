// Messung mit Bewertung speichern (Plan 26 Testliste; R2.5, R10.3, TO2; A3, A18). Injizierte Uhr, keine Datenbank:
// geprüft wird der Vorgang für schreiben().
//
// Vertrag (vom Testentwickler festgelegt, wo Plan 26 offen ist):
// - `messungVorgang(eingabe, { …, bewertung: { sollband, bewertungen, sprungBestaetigt? } }, bindung)` setzt
//   `bewertung_ph`, `bewertung_ec` und `bewertung_temp` immer als Schlüssel (null für leere Felder) und
//   `schnappschuss` = { betriebsart, u_ec, u_ph, zielbereich: alsSchnappschuss(sollband) } plus
//   `sprung_bestaetigt: true` nur bei bestätigter Rückfrage (sonst fehlt der Schlüssel).
// - Ohne `bewertung` bleibt der Vorgang wie in I0-07: keine Schlüssel bewertung_*, schnappschuss ohne zielbereich.
import { describe, expect, it } from 'vitest';
import { bewerten } from '../../src/domain/bewertung/bewertung.ts';
import type { Sollband } from '../../src/domain/bewertung/sollband.ts';
import type { Schritt } from '../../src/domain/datenpfad/erfassung.ts';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  messwerteHundertstel,
  type Groesse,
  type Messeingabe,
  type Taste,
} from '../../src/domain/messung/eingabe.ts';
import { messungVorgang, type Erfassungsbindung } from '../../src/domain/messung/erfassung.ts';
import { platzId, uid } from '../fixtures/regal.ts';

const ALLE: readonly Groesse[] = ['ph', 'ec', 'temperatur'];
const JETZT = new Date('2027-01-12T17:00:00.000Z');
const bindung: Erfassungsbindung = {
  schluessel: 'ph=6.7;ec=1.25;t=20.5',
  clientId: uid('43', 1),
  giltAb: JETZT.toISOString(),
};
const SOLLBAND: Sollband = {
  ph: { min: 600, max: 650 },
  ec: { min: 100, max: 140 },
  temperatur: { min: 1800, max: 2200 },
  herkunft: 'pflanzungen',
};
const ZIELBEREICH = { ph_min: 6, ph_max: 6.5, ec_min: 1, ec_max: 1.4, temp_min: 18, temp_max: 22 };
const GERAET = { uEc: 10, uPh: 10 };

type Neu = Extract<Schritt, { art: 'neu' }>;
function neu(schritt: Schritt): Neu {
  if (schritt.art !== 'neu') throw new Error(`Schritt neu erwartet, erhalten ${schritt.art}`);
  return schritt;
}
const tippen = (e: Messeingabe, ...t: Taste[]) => t.reduce((s, x) => eingabeTippen(s, x), e);

const kontext = {
  platzId: platzId('2.3'),
  messgeraetId: uid('23', 1),
  messart: 'aufgabe' as const,
  betriebsart: 'dwc' as const,
  uEc: 0.1,
  uPh: 0.1,
};

function vorgang(e: Messeingabe, sprungBestaetigt?: boolean) {
  const bewertungen = bewerten(messwerteHundertstel(e), SOLLBAND, GERAET);
  return messungVorgang(
    e,
    {
      ...kontext,
      bewertung: { sollband: SOLLBAND, bewertungen, ...(sprungBestaetigt ? { sprungBestaetigt } : {}) },
    },
    bindung,
  );
}

describe('R2.5 Messung mit Zielbereich und Bewertung', () => {
  it('R2.5 Vorgang mit Bewertung: bewertung_ph, bewertung_ec, bewertung_temp und schnappschuss.zielbereich', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7', '1', '2', '5', '2', '0', '5');
    const felder = neu(vorgang(e)).felder;
    expect(felder).toMatchObject({
      ph: 6.7,
      ec: 1.25,
      temperatur: 20.5,
      bewertung_ph: 'knapp',
      bewertung_ec: 'gruen',
      bewertung_temp: 'gruen',
    });
    expect(felder['schnappschuss']).toEqual({
      betriebsart: 'dwc',
      u_ec: 0.1,
      u_ph: 0.1,
      zielbereich: ZIELBEREICH,
    });
  });

  it('R2.5 leeres Feld ohne Bewertung (null)', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '5', '2');
    const felder = neu(vorgang(e)).felder;
    expect(felder['ph']).toBeNull();
    expect(felder['bewertung_ph']).toBeNull();
    expect(felder['bewertung_temp']).toBeNull();
    expect(felder['bewertung_ec']).toBe('ausserhalb');
    expect((felder['schnappschuss'] as Record<string, unknown>)['zielbereich']).toEqual(ZIELBEREICH);
  });

  it('R2.5 ohne Sollband Vorgang wie in I0-07 (schnappschuss ohne zielbereich)', () => {
    const e = tippen(eingabeStart(ALLE), '6', '7', '1', '2', '5', '2', '0', '5');
    const felder = neu(messungVorgang(e, kontext, bindung)).felder;
    expect(felder).not.toHaveProperty('bewertung_ph');
    expect(felder).not.toHaveProperty('bewertung_ec');
    expect(felder).not.toHaveProperty('bewertung_temp');
    expect(felder['schnappschuss']).toEqual({ betriebsart: 'dwc', u_ec: 0.1, u_ph: 0.1 });
  });
});

describe('R10.3 bestätigte Rückfrage', () => {
  it('R10.3 bestätigte Rückfrage setzt schnappschuss.sprung_bestaetigt', () => {
    const e = tippen(eingabeStart(ALLE), '6', '2', '1', '5', '5', '2', '0', '5');
    const mit = neu(vorgang(e, true)).felder['schnappschuss'] as Record<string, unknown>;
    expect(mit['sprung_bestaetigt']).toBe(true);
    expect(mit['zielbereich']).toEqual(ZIELBEREICH);
    const ohne = neu(vorgang(e)).felder['schnappschuss'] as Record<string, unknown>;
    expect(ohne).not.toHaveProperty('sprung_bestaetigt');
    expect(ohne['zielbereich']).toEqual(ZIELBEREICH);
  });
});

describe('TO2 Bindung mit Bewertung', () => {
  it('TO2 gleiche Werte ergeben gleichen Vorgang mit gleicher Bewertung', () => {
    const e = tippen(eingabeStart(ALLE), '6', '8', '1', '4', '1', '2', '0', '5');
    const erster = vorgang(e);
    const zweiter = vorgang(tippen(eingabeStart(ALLE), '6', '8', '1', '4', '1', '2', '0', '5'));
    expect(zweiter).toEqual(erster);
    const felder = neu(erster).felder;
    expect(felder['client_id']).toBe(bindung.clientId);
    expect(felder['gilt_ab']).toBe(bindung.giltAb);
    expect(felder).toMatchObject({
      bewertung_ph: 'ausserhalb',
      bewertung_ec: 'knapp',
      bewertung_temp: 'gruen',
    });
  });
});
