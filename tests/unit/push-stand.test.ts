// Push-Stand in Heute (Plan 13 Schnittstellen `src/domain/push/stand.ts`; UC0-AK5, R5.5, 11.3, G5):
// «Letzte Erinnerung: heute 07:00 zugestellt» oder «Push nicht eingerichtet». Feste Uhr, Zeitzone als Parameter.
// Vorausgesetzt:
// - «eingerichtet» heisst: Push unterstützt, Berechtigung granted, Browser-Endpoint vorhanden und in den Abos ein
//   aktives Abo mit Datenart echt zu genau diesem Endpoint. Ein inaktives Abo zu diesem Endpoint ergibt
//   grund 'abgemeldet' (UC0-AK5), kein Abo oder kein Endpoint 'kein_abo', Berechtigung denied 'verweigert'
//   (vor allen anderen Gründen).
// - letzteZustellung ist das jüngste angezeigt_am aller Versände in Zürcher Zeit: «heute hh:mm», «gestern hh:mm»,
//   sonst «T.M. hh:mm».
// - warnung48h gilt ab genau 48 h ohne angezeigt_am (≥ 48 h).
import { describe, expect, it } from 'vitest';
import { pushStand } from '../../src/domain/push/stand.ts';
import { ZONE } from './push-fixture.ts';

const ENDPOINT = 'https://push.example.invalid/geraet-1';
const ABO_ID = '00000000-0000-4000-8000-0000000a0001';
const JETZT = new Date('2027-01-20T09:00:00.000Z');

const geraet = (
  teil: Partial<{
    unterstuetzt: boolean;
    berechtigung: 'granted' | 'denied' | 'default';
    endpoint: string | null;
  }> = {},
) => ({ unterstuetzt: true, berechtigung: 'granted' as const, endpoint: ENDPOINT, ...teil });

const aktivesAbo = { endpoint: ENDPOINT, aktiv: true, datenart: 'echt' as const };

const versand = (angezeigt: string | null, gesendet: string | null = angezeigt) => ({
  abo_id: ABO_ID,
  art: 'sammel',
  angezeigt_am: angezeigt,
  gesendet_am: gesendet,
});

describe('pushStand', () => {
  it('UC0-AK5 abgemeldetes Abo: Heute zeigt «Push nicht eingerichtet»', () => {
    const stand = pushStand(
      geraet(),
      [{ endpoint: ENDPOINT, aktiv: false, datenart: 'echt' }],
      [versand('2027-01-19T06:00:30.000Z')],
      JETZT,
      ZONE,
    );
    expect(stand).toEqual({ art: 'nicht_eingerichtet', grund: 'abgemeldet' });
  });

  it('UC0-AK5 ohne Abo und ohne Endpoint: nicht eingerichtet (kein_abo)', () => {
    expect(pushStand(geraet({ endpoint: null }), [], [], JETZT, ZONE)).toEqual({
      art: 'nicht_eingerichtet',
      grund: 'kein_abo',
    });
    // Abo eines anderen Geräts macht dieses Gerät nicht eingerichtet
    expect(
      pushStand(
        geraet(),
        [{ endpoint: 'https://push.example.invalid/anderes', aktiv: true, datenart: 'echt' }],
        [],
        JETZT,
        ZONE,
      ),
    ).toEqual({ art: 'nicht_eingerichtet', grund: 'kein_abo' });
  });

  it('R5.5 Letzte Erinnerung «heute 07:00», «gestern 07:05»', () => {
    const heute = pushStand(
      geraet(),
      [aktivesAbo],
      [versand('2027-01-19T06:05:10.000Z'), versand('2027-01-20T06:00:30.000Z'), versand(null)],
      JETZT,
      ZONE,
    );
    expect(heute).toEqual({ art: 'eingerichtet', letzteZustellung: 'heute 07:00', warnung48h: false });

    const gestern = pushStand(geraet(), [aktivesAbo], [versand('2027-01-19T06:05:10.000Z')], JETZT, ZONE);
    expect(gestern).toEqual({ art: 'eingerichtet', letzteZustellung: 'gestern 07:05', warnung48h: false });

    const frueher = pushStand(
      geraet(),
      [aktivesAbo],
      [versand('2026-12-02T06:00:00.000Z')],
      new Date('2026-12-03T23:30:00.000Z'),
      ZONE,
    );
    // 3.12. 23:30Z ist in Zürich schon der 4.12.: der 2.12. ist vorgestern
    expect(frueher).toMatchObject({ art: 'eingerichtet', letzteZustellung: '2.12. 07:00' });
  });

  it('R5.5 Letzte Erinnerung in der Sommerzeit nach Ortszeit: 28.3.2027 05:00Z ist «heute 07:00»', () => {
    const stand = pushStand(
      geraet(),
      [aktivesAbo],
      [versand('2027-03-28T05:00:00.000Z')],
      new Date('2027-03-28T10:00:00.000Z'),
      ZONE,
    );
    expect(stand).toMatchObject({ art: 'eingerichtet', letzteZustellung: 'heute 07:00' });
  });

  it('R5.5 Warnung nach 48 h ohne angezeigt_am, nicht nach 47 h', () => {
    const nach48 = pushStand(geraet(), [aktivesAbo], [versand('2027-01-18T09:00:00.000Z')], JETZT, ZONE);
    expect(nach48).toEqual({ art: 'eingerichtet', letzteZustellung: '18.1. 10:00', warnung48h: true });
    const nach47 = pushStand(geraet(), [aktivesAbo], [versand('2027-01-18T10:00:00.000Z')], JETZT, ZONE);
    expect(nach47).toMatchObject({ art: 'eingerichtet', warnung48h: false });
    // gesendet, aber nie angezeigt, zählt nicht als Zustellung
    const nurGesendet = pushStand(
      geraet(),
      [aktivesAbo],
      [versand('2027-01-18T09:00:00.000Z'), versand(null, '2027-01-20T06:00:00.000Z')],
      JETZT,
      ZONE,
    );
    expect(nurGesendet).toMatchObject({ art: 'eingerichtet', warnung48h: true });
  });

  it('R5.5 Demo-Abo zählt nicht als eingerichtet', () => {
    const stand = pushStand(
      geraet(),
      [{ endpoint: ENDPOINT, aktiv: true, datenart: 'demo' }],
      [versand('2027-01-20T06:00:30.000Z')],
      JETZT,
      ZONE,
    );
    expect(stand.art).toBe('nicht_eingerichtet');
  });

  it('11.3 Berechtigung verweigert: nicht eingerichtet (verweigert)', () => {
    expect(pushStand(geraet({ berechtigung: 'denied' }), [aktivesAbo], [], JETZT, ZONE)).toEqual({
      art: 'nicht_eingerichtet',
      grund: 'verweigert',
    });
  });

  it('11.3 ohne Push-Unterstützung: nicht unterstützt', () => {
    expect(pushStand(geraet({ unterstuetzt: false, endpoint: null }), [], [], JETZT, ZONE)).toEqual({
      art: 'nicht_unterstuetzt',
    });
  });
});
