// Push-Stand, Nachbesserung Runde 1 (Plan 13 «Regeln im Einzelnen», Zeile «Anzeige»; R5.5, 11.3).
// Feste Uhr, Zeitzone als Parameter.
// Vorausgesetzt:
// - Abos tragen optional `id` und `erfasst_am` (Signatur von pushStand bleibt).
// - Liegt kein angezeigt_am vor, misst die 48-h-Warnung ab erfasst_am des eigenen aktiven echten Abos
//   (≥ 48 h warnt, 47 h nicht); letzteZustellung fehlt dann.
// - Tragen die Abos eine id, zählen nur Versände, deren abo_id zu einem eigenen echten Abo (gleicher Endpoint
//   wie das Gerät) gehört; Versände fremder Abos ändern weder letzteZustellung noch die Warnung.
import { describe, expect, it } from 'vitest';
import { pushStand } from '../../src/domain/push/stand.ts';
import { ZONE } from './push-fixture.ts';

const ENDPOINT = 'https://push.example.invalid/geraet-1';
const FREMDER_ENDPOINT = 'https://push.example.invalid/geraet-2';
const EIGENE_ID = '00000000-0000-4000-8000-0000000b0001';
const FREMDE_ID = '00000000-0000-4000-8000-0000000b0002';
const DEMO_ID = '00000000-0000-4000-8000-0000000b0003';
const JETZT = new Date('2027-01-20T09:00:00.000Z');

const geraet = { unterstuetzt: true, berechtigung: 'granted' as const, endpoint: ENDPOINT };

const abo = (id: string, endpoint: string, erfasstAm: string, datenart: 'echt' | 'demo' = 'echt') => {
  const ergebnis = { id, endpoint, aktiv: true, datenart, erfasst_am: erfasstAm };
  return ergebnis;
};

const versand = (aboId: string, angezeigt: string | null) => ({
  abo_id: aboId,
  art: 'sammel',
  angezeigt_am: angezeigt,
  gesendet_am: angezeigt ?? '2027-01-20T06:00:00.000Z',
});

describe('pushStand Runde 1', () => {
  it('R5.5 ohne angezeigt_am warnt der Stand 48 h nach erfasst_am des eigenen Abos, nicht nach 47 h', () => {
    const vor48 = abo(EIGENE_ID, ENDPOINT, '2027-01-18T09:00:00.000Z');
    expect(pushStand(geraet, [vor48], [], JETZT, ZONE)).toEqual({ art: 'eingerichtet', warnung48h: true });

    const vor47 = abo(EIGENE_ID, ENDPOINT, '2027-01-18T10:00:00.000Z');
    expect(pushStand(geraet, [vor47], [], JETZT, ZONE)).toEqual({ art: 'eingerichtet', warnung48h: false });

    // gesendet, aber nie angezeigt: weiterhin ab erfasst_am gemessen
    expect(pushStand(geraet, [vor48], [versand(EIGENE_ID, null)], JETZT, ZONE)).toEqual({
      art: 'eingerichtet',
      warnung48h: true,
    });
  });

  it('R5.5 nur Versände eigener echter Abos zählen; jüngeres angezeigt_am eines fremden Abos ändert nichts', () => {
    const eigenes = abo(EIGENE_ID, ENDPOINT, '2027-01-10T09:00:00.000Z');
    const fremdes = abo(FREMDE_ID, FREMDER_ENDPOINT, '2027-01-10T09:00:00.000Z');
    const stand = pushStand(
      geraet,
      [eigenes, fremdes],
      [versand(EIGENE_ID, '2027-01-18T09:00:00.000Z'), versand(FREMDE_ID, '2027-01-20T06:00:30.000Z')],
      JETZT,
      ZONE,
    );
    expect(stand).toEqual({ art: 'eingerichtet', letzteZustellung: '18.1. 10:00', warnung48h: true });
  });

  it('R5.5 nur fremde Versände angezeigt: keine letzte Zustellung, Warnung ab erfasst_am', () => {
    const eigenes = abo(EIGENE_ID, ENDPOINT, '2027-01-18T09:00:00.000Z');
    const fremdes = abo(FREMDE_ID, FREMDER_ENDPOINT, '2027-01-10T09:00:00.000Z');
    const stand = pushStand(
      geraet,
      [eigenes, fremdes],
      [versand(FREMDE_ID, '2027-01-20T06:00:30.000Z')],
      JETZT,
      ZONE,
    );
    expect(stand).toEqual({ art: 'eingerichtet', warnung48h: true });
  });

  it('R5.5 Versand eines Demo-Abos zum selben Endpoint zählt nicht als Zustellung', () => {
    const eigenes = abo(EIGENE_ID, ENDPOINT, '2027-01-10T09:00:00.000Z');
    const demo = abo(DEMO_ID, ENDPOINT, '2027-01-10T09:00:00.000Z', 'demo');
    const stand = pushStand(
      geraet,
      [eigenes, demo],
      [versand(EIGENE_ID, '2027-01-18T09:00:00.000Z'), versand(DEMO_ID, '2027-01-20T06:00:30.000Z')],
      JETZT,
      ZONE,
    );
    expect(stand).toEqual({ art: 'eingerichtet', letzteZustellung: '18.1. 10:00', warnung48h: true });
  });
});
