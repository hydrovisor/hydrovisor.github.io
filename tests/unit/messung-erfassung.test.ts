// Vorgang für schreiben() aus Messung und Kalibrierung (Plan 12 Testliste, Datenfluss «Speichern»; Plan 11 Ü1,
// Befund 6 Fachlogik; UC9; R4.10, R5.2, R10.3; Konzept 5.6 Gegenprobe; Konzept 8.1 Regel 3, 11.4).
// Injizierte Uhr: jetzt als Parameter, Zeitpunkte als UTC-ISO.
import { describe, expect, it, vi } from 'vitest';
import { vorgangPruefen, type Schritt } from '../../src/domain/datenpfad/erfassung.ts';
import { gegenprobeOk, kalibrierungVorgang } from '../../src/domain/kalibrierung/erfassung.ts';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  type Groesse,
  type Messeingabe,
  type Taste,
} from '../../src/domain/messung/eingabe.ts';
import {
  erfassungBinden,
  messungVorgang,
  type Erfassungsbindung,
} from '../../src/domain/messung/erfassung.ts';

const PLATZ = '0e0e0e0e-0000-4000-8000-000000000311';
const MESSSTELLE = '0e0e0e0e-0000-4000-8000-000000000319';
const MESSGERAET = '0e0e0e0e-0000-4000-8000-000000000201';
const ID_1 = '0e0e0e0e-0000-4000-8000-000000000a01';
const ID_2 = '0e0e0e0e-0000-4000-8000-000000000a02';
// 20.1.2027 10:00 und 10:00:07 Zürich
const JETZT = new Date('2027-01-20T09:00:00.000Z');
const SPAETER = new Date('2027-01-20T09:00:07.000Z');
const ALLE: readonly Groesse[] = ['ph', 'ec', 'temperatur'];

type Neu = Extract<Schritt, { art: 'neu' }>;

function tippen(e: Messeingabe, ...tasten: Taste[]): Messeingabe {
  return tasten.reduce((stand, taste) => eingabeTippen(stand, taste), e);
}

/** Schritt «neu» oder sichtbarer Abbruch */
function neu(schritt: Schritt): Neu {
  if (schritt.art !== 'neu') throw new Error(`Schritt neu erwartet, erhalten ${schritt.art}`);
  return schritt;
}

const bindung: Erfassungsbindung = { schluessel: 'ec=1.25', clientId: ID_1, giltAb: JETZT.toISOString() };

const kontextGefaess = {
  platzId: PLATZ,
  messgeraetId: MESSGERAET,
  messart: 'aufgabe' as const,
  betriebsart: 'dwc' as const,
  uEc: 0.1,
  uPh: 0.1,
};

describe('TO2 Bindung an den Eingabe-Schnappschuss', () => {
  it('TO2 gleiche Eingabe behält client_id und gilt_ab des ersten Speicherns', () => {
    const neueId = vi.fn(() => ID_1);
    const erste = erfassungBinden(undefined, 'ec=1.25', neueId, JETZT);
    expect(erste).toEqual({ schluessel: 'ec=1.25', clientId: ID_1, giltAb: JETZT.toISOString() });
    expect(neueId).toHaveBeenCalledTimes(1);

    const andereId = vi.fn(() => ID_2);
    const zweite = erfassungBinden(erste, 'ec=1.25', andereId, SPAETER);
    expect(zweite.clientId).toBe(ID_1);
    expect(new Date(zweite.giltAb).getTime()).toBe(JETZT.getTime());
    expect(andereId).not.toHaveBeenCalled();
  });

  it('TO2 geänderte Eingabe erhält neue client_id und neues gilt_ab', () => {
    const erste = erfassungBinden(undefined, 'ec=1.25', () => ID_1, JETZT);
    const zweite = erfassungBinden(erste, 'ec=1.35', () => ID_2, SPAETER);
    expect(zweite.schluessel).toBe('ec=1.35');
    expect(zweite.clientId).toBe(ID_2);
    expect(new Date(zweite.giltAb).getTime()).toBe(SPAETER.getTime());
  });
});

describe('messungVorgang', () => {
  it('UC9-AK2 Vorgang ohne leere Felder als Werte, leere als null', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const schritt = neu(messungVorgang(e, kontextGefaess, bindung));
    expect(schritt.tabelle).toBe('messung');
    expect(schritt.felder).toMatchObject({
      client_id: ID_1,
      platz_id: PLATZ,
      messgeraet_id: MESSGERAET,
      ph: null,
      ec: 1.25,
      ec_eingabe: '1.25',
      ec_dezimalen: 2,
      temperatur: null,
    });
    expect(new Date(schritt.felder['gilt_ab'] as string).getTime()).toBe(JETZT.getTime());
  });

  it('UC9-AK2 alle drei Werte: ph, ec, temperatur gesetzt', () => {
    const e = tippen(eingabeStart(ALLE), '6', '1', '1', '4', '5', '2', '0', '5');
    const felder = neu(messungVorgang(e, kontextGefaess, bindung)).felder;
    expect(felder).toMatchObject({ ph: 6.1, ec: 1.45, ec_eingabe: '1.45', temperatur: 20.5 });
  });

  it('R4.10 Kratky ohne Füllstand nicht speicherbar; mit Füllstand: fuellstand und schnappschuss.betriebsart gesetzt', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const kratky = { ...kontextGefaess, betriebsart: 'kratky_belueftet' as const };
    expect(() => messungVorgang(e, kratky, bindung)).toThrow();
    const mit = neu(messungVorgang(e, { ...kratky, fuellstand: 'unter_drittel' }, bindung));
    expect(mit.felder['fuellstand']).toBe('unter_drittel');
    expect(mit.felder['schnappschuss']).toEqual({ betriebsart: 'kratky_belueftet', u_ec: 0.1, u_ph: 0.1 });
    expect(() => messungVorgang(e, { ...kontextGefaess, betriebsart: 'kratky' }, bindung)).toThrow();
  });

  it('R4.10 DWC ohne Füllstand: fuellstand null, schnappschuss ohne zielbereich', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const felder = neu(messungVorgang(e, kontextGefaess, bindung)).felder;
    expect(felder['fuellstand'] ?? null).toBeNull();
    expect(felder['schnappschuss']).toEqual({ betriebsart: 'dwc', u_ec: 0.1, u_ph: 0.1 });
    expect(felder['schnappschuss']).not.toHaveProperty('zielbereich');
  });

  it('UC9 Messart aufgabe am Gefäss, w an der Messstelle; datenart null', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const gefaess = neu(messungVorgang(e, kontextGefaess, bindung)).felder;
    expect(gefaess['messart']).toBe('aufgabe');
    expect(gefaess['datenart'] ?? null).toBeNull();

    const w = tippen(eingabeStart(['ec', 'temperatur']), '0', '4', '5');
    const { betriebsart: _ohne, ...ohneBetriebsart } = kontextGefaess;
    void _ohne;
    const messstelle = neu(
      messungVorgang(w, { ...ohneBetriebsart, platzId: MESSSTELLE, messart: 'w' }, bindung),
    ).felder;
    expect(messstelle).toMatchObject({ messart: 'w', platz_id: MESSSTELLE, ph: null, ec: 0.45 });
    expect(messstelle['datenart'] ?? null).toBeNull();
    expect(messstelle['fuellstand'] ?? null).toBeNull();
  });

  it('R5.2 war_faellig_am nur bei fälliger Messung', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const faellig = neu(messungVorgang(e, { ...kontextGefaess, warFaelligAm: '2027-01-19' }, bindung)).felder;
    expect(faellig['war_faellig_am']).toBe('2027-01-19');
    const nicht = neu(messungVorgang(e, kontextGefaess, bindung)).felder;
    expect(nicht['war_faellig_am'] ?? null).toBeNull();
  });

  it('A6 erfassungsdauer_s aus dem Kontext', () => {
    const e = tippen(feldWaehlen(eingabeStart(ALLE), 'ec'), '1', '2', '5');
    const felder = neu(messungVorgang(e, { ...kontextGefaess, erfassungsdauerS: 7 }, bindung)).felder;
    expect(felder['erfassungsdauer_s']).toBe(7);
  });
});

describe('Kalibrierung', () => {
  it('Konzept 5.6 Gegenprobe u_EC 0.10: 1.31 und 1.51 ok, 1.30 und 1.52 nicht', () => {
    expect(gegenprobeOk(1.41, 0.1)).toBe(true);
    // in Gleitkomma wäre 1.51 − 1.41 = 0.10000000000000009 > 0.1
    expect(gegenprobeOk(1.31, 0.1)).toBe(true);
    expect(gegenprobeOk(1.51, 0.1)).toBe(true);
    expect(gegenprobeOk(1.3, 0.1)).toBe(false);
    expect(gegenprobeOk(1.52, 0.1)).toBe(false);
    expect(gegenprobeOk(1.55, 0.1)).toBe(false);
  });

  it('R10.3 Kalibrierung trägt die Datenart der gewählten Anlage', () => {
    const k = { messgeraetId: MESSGERAET, gegenprobeEc: 1.43, nachReinigung: false };
    const echt = neu(kalibrierungVorgang({ ...k, datenart: 'echt' }, bindung));
    expect(echt.tabelle).toBe('kalibrierung');
    expect(echt.felder).toMatchObject({
      client_id: ID_1,
      messgeraet_id: MESSGERAET,
      datenart: 'echt',
      gegenprobe_ec: 1.43,
      nach_reinigung: false,
    });
    expect(new Date(echt.felder['gilt_ab'] as string).getTime()).toBe(JETZT.getTime());
    const test = neu(kalibrierungVorgang({ ...k, datenart: 'test', nachReinigung: true }, bindung));
    expect(test.felder).toMatchObject({ datenart: 'test', nach_reinigung: true });
    const demo = neu(kalibrierungVorgang({ ...k, datenart: 'demo' }, bindung));
    expect(demo.felder['datenart']).toBe('demo');
  });

  it('R5.2 Kalibrierung: war_faellig_am und dauer_s nur, wenn gegeben', () => {
    const k = {
      messgeraetId: MESSGERAET,
      datenart: 'echt' as const,
      gegenprobeEc: 1.41,
      nachReinigung: false,
    };
    const faellig = neu(
      kalibrierungVorgang({ ...k, warFaelligAm: '2027-01-31', dauerS: 95 }, bindung),
    ).felder;
    expect(faellig).toMatchObject({ war_faellig_am: '2027-01-31', dauer_s: 95 });
    const nicht = neu(kalibrierungVorgang(k, bindung)).felder;
    expect(nicht['war_faellig_am'] ?? null).toBeNull();
  });
});

describe('Plan 11 Prüfung vor dem Senden', () => {
  it('Plan 11 vorgangPruefen() ohne Verstoss für Messung und Kalibrierung', () => {
    const e = tippen(eingabeStart(ALLE), '6', '1', '1', '4', '5');
    const messung = messungVorgang(e, kontextGefaess, bindung);
    const kratky = messungVorgang(
      e,
      { ...kontextGefaess, betriebsart: 'kratky', fuellstand: 'ueber_drittel' },
      { ...bindung, clientId: ID_2 },
    );
    const kalibrierung = kalibrierungVorgang(
      { messgeraetId: MESSGERAET, datenart: 'echt', gegenprobeEc: 1.41, nachReinigung: false },
      bindung,
    );
    expect(vorgangPruefen([messung])).toEqual([]);
    expect(vorgangPruefen([kratky])).toEqual([]);
    expect(vorgangPruefen([kalibrierung])).toEqual([]);
  });
});
