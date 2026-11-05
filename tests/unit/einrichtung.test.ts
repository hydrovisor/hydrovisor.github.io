// Einrichtungs-Checkliste und Thema (Plan 18 Testliste; UC0, K29, B-04, W7). Injizierte Uhr, Teile des Bündels
// in der Form von PostgREST.
import { describe, expect, it } from 'vitest';
import {
  checklisteZeigen,
  einrichtungsStand,
  EINWEICHEN_MS,
} from '../../src/domain/einrichtung/checkliste.ts';
import { themaAttribut, themaAus } from '../../src/domain/einrichtung/thema.ts';
import { restzeit } from '../../src/ui/bausteine/Checklist.tsx';
import { einrichtungsTeile, ID } from '../fixtures/einrichtung.ts';

const JETZT = new Date('2026-12-05T08:00:00Z');
const erledigte = (teile: Record<string, readonly unknown[]> | undefined, ende?: number) =>
  einrichtungsStand(teile, JETZT, ende)
    .punkte.filter((p) => p.erledigt)
    .map((p) => p.nr);

describe('Einrichtungs-Checkliste', () => {
  it('UC0-AK1 neun Punkte in fester Reihenfolge, ohne Daten alle offen und Punkt 1 aktiv', () => {
    const stand = einrichtungsStand(undefined, JETZT);
    expect(stand.punkte.map((p) => p.titel)).toEqual([
      'Anlage anlegen',
      'Messstift 12 h einweichen',
      'Messgerät kalibrieren mit Gegenprobe',
      'Leitungswasser-EC messen (W)',
      'Vorlagen für Box, Deckel und Platte',
      'Gefässe, Anzuchtboxen und Messstelle W erfassen',
      'Etiketten drucken und anbringen',
      'Gefässe prüfen, Schritte 1 bis 3',
      'Erste Aussaat',
    ]);
    expect(stand.punkte.map((p) => p.zustand)).toEqual(['aktiv', ...Array(8).fill('offen')]);
    expect(stand.vollstaendig).toBe(false);
    expect(checklisteZeigen(stand, false)).toBe(true);
  });

  it.each([1, 3, 4, 5, 6, 7, 8, 9])('UC0-AK1 nach Punkt %i sind genau die Punkte bis dort erledigt', (n) => {
    const erwartet = Array.from({ length: n }, (_, i) => i + 1);
    expect(erledigte(einrichtungsTeile(n))).toEqual(erwartet);
  });

  it('UC0-AK1 nach allen neun Punkten ist die Liste vollständig und verschwindet', () => {
    const stand = einrichtungsStand(einrichtungsTeile(9), JETZT);
    expect(stand.vollstaendig).toBe(true);
    expect(checklisteZeigen(stand, false)).toBe(false);
  });

  it('UC0-AK1 Demo- und Testdaten haken nichts ab (A1)', () => {
    expect(erledigte(einrichtungsTeile(9, 'demo'))).toEqual([5]);
    expect(erledigte(einrichtungsTeile(9, 'test'))).toEqual([5]);
  });

  it('UC0-AK1 stornierte Zeilen zählen nicht', () => {
    const teile = einrichtungsTeile(3);
    teile['anlage'] = (teile['anlage'] as object[]).map((a) => ({
      ...a,
      storniert_am: '2026-12-02T00:00:00Z',
    }));
    teile['kalibrierung'] = (teile['kalibrierung'] as object[]).map((k) => ({
      ...k,
      storniert_am: '2026-12-02T00:00:00Z',
    }));
    expect(erledigte(teile)).toEqual([]);
  });

  it('UC0-AK1 Kalibrierung ohne Gegenprobe hakt Punkt 3 nicht ab', () => {
    const teile = einrichtungsTeile(3);
    teile['kalibrierung'] = (teile['kalibrierung'] as object[]).map((k) => ({ ...k, gegenprobe_ec: null }));
    expect(erledigte(teile)).toEqual([1]);
  });

  it('UC0-AK1 Einweichen: läuft mit Restzeit, nach 12 Stunden erledigt (injizierte Uhr)', () => {
    const teile = einrichtungsTeile(1);
    const ende = JETZT.getTime() + EINWEICHEN_MS;
    const laufend = einrichtungsStand(teile, JETZT, ende).punkte[1];
    expect(laufend?.erledigt).toBe(false);
    expect(laufend?.zustand).toBe('aktiv');
    expect(laufend?.timerEnde).toBe(ende);
    const spaeter = new Date(ende);
    expect(einrichtungsStand(teile, spaeter, ende).punkte[1]?.erledigt).toBe(true);
    expect(einrichtungsStand(teile, spaeter, ende).punkte[2]?.zustand).toBe('aktiv');
  });

  it('UC0-AK1 Punkt 4 öffnet die Messstelle W, sobald sie erfasst ist', () => {
    const teile = einrichtungsTeile(3);
    expect(einrichtungsStand(teile, JETZT).punkte[3]?.ziel).toEqual({
      art: 'gefaess-neu',
      rolle: 'messstelle',
    });
    teile['platz'] = [
      {
        id: ID.platzW,
        anlage_id: ID.anlage,
        kennung: 'W',
        rolle: 'messstelle',
        aktiv: true,
        storniert_am: null,
      },
    ];
    expect(einrichtungsStand(teile, JETZT).punkte[3]?.ziel).toEqual({ art: 'messen', code: 'R-W' });
  });

  it('UC0-AK1 Punkte 7 und 8 verlangen alle Orte bzw. alle Gefässe der echten Anlage', () => {
    const teile = einrichtungsTeile(8);
    teile['etikett'] = (teile['etikett'] as { platz_id: string }[]).filter((e) => e.platz_id !== ID.platzW);
    expect(erledigte(teile)).toEqual([1, 2, 3, 4, 5, 6, 8]);
    const ohneStatus = einrichtungsTeile(8);
    ohneStatus['v_gefaess_status'] = [];
    expect(erledigte(ohneStatus)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('UC0-AK1 Punkt 8: ruhende Gefässe zählen nicht, ein ruhendes allein reicht nicht', () => {
    const ruht = einrichtungsTeile(8);
    ruht['v_gefaess_status'] = [{ gefaess_id: ID.gefaess, status: 'ruht' }];
    expect(erledigte(ruht)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const betrieb = einrichtungsTeile(8);
    betrieb['v_gefaess_status'] = [{ gefaess_id: ID.gefaess, status: 'in_betrieb' }];
    expect(erledigte(betrieb)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('UC0-AK1 aktiv ist der erste offene Punkt, auch wenn spätere schon erfüllt sind', () => {
    const teile = einrichtungsTeile(5);
    delete teile['kalibrierung'];
    const stand = einrichtungsStand(teile, JETZT);
    expect(stand.punkte.filter((p) => p.zustand === 'aktiv').map((p) => p.nr)).toEqual([2]);
    expect(stand.punkte[4]?.zustand).toBe('erledigt');
  });

  it('UC0-AK1 ein gemerkter Abschluss hält die Liste weg (A4)', () => {
    expect(checklisteZeigen(einrichtungsStand(einrichtungsTeile(6), JETZT), true)).toBe(false);
  });
});

describe('Thema (W7)', () => {
  it('UC0-AK6 ohne Einstellung hell, auch bei dunklem Systemmodus', () => {
    expect(themaAttribut(undefined, true)).toBe('light');
    expect(themaAttribut('hell', true)).toBe('light');
    expect(themaAttribut('unbekannt', true)).toBe('light');
  });

  it('UC0-AK6 dunkel und wie System', () => {
    expect(themaAttribut('dunkel', false)).toBe('dark');
    expect(themaAttribut('system', true)).toBe('dark');
    expect(themaAttribut('system', false)).toBe('light');
    expect(themaAus({ einstellung: [{ thema: 'dunkel' }] })).toBe('dunkel');
    expect(themaAus(undefined)).toBeUndefined();
  });
});

describe('Restzeit der Checkliste', () => {
  it('UC0-AK1 Restzeit ab einer Stunde mit Stunden', () => {
    expect(restzeit(EINWEICHEN_MS, 0)).toBe('12:00:00');
    expect(restzeit(3_600_000, 1_000)).toBe('59:59');
    expect(restzeit(3_661_000, 0)).toBe('1:01:01');
  });
});
