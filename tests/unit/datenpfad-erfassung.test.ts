// Zeile vorbereiten und Vorgang prüfen (Plan 11 Testliste und Datenfluss Schritt 1 und 2; Konzept 8.1 Regel 3, 11.4).
// Feste Uhr über den Zeitkontext, nie die Systemzeit.
import { describe, expect, it } from 'vitest';
import {
  MIT_ZEITACHSE,
  vorgangPruefen,
  zeileVorbereiten,
  type Erfassungstabelle,
  type Schritt,
  type Zeitkontext,
} from '../../src/domain/datenpfad/erfassung.ts';

const KONTEXT: Zeitkontext = { jetzt: new Date('2026-11-25T07:07:00.000Z'), zeitzone: 'Europe/Zurich' };
const VERSION = '0.1.0+abc1234';
const ID = '6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f';
const MESSGERAET = '11111111-2222-4333-8444-555555555555';

type Neu = Extract<Schritt, { art: 'neu' }>;

const phKontrolle = (felder: Record<string, unknown> = {}): Neu => ({
  art: 'neu',
  tabelle: 'messung',
  felder: {
    client_id: ID,
    messgeraet_id: MESSGERAET,
    messart: 'ph_kontrolle',
    platz_id: null,
    datenart: 'test',
    ph: 7.02,
    ...felder,
  },
});

const zeitpunkt = (wert: unknown) => new Date(wert as string).getTime();

describe('zeileVorbereiten', () => {
  it('client_id bleibt unverändert, app_version wird gesetzt, Fachfelder bleiben', () => {
    const zeile = zeileVorbereiten(phKontrolle(), KONTEXT, VERSION);
    expect(zeile['client_id']).toBe(ID);
    expect(zeile['app_version']).toBe(VERSION);
    expect(zeile['ph']).toBe(7.02);
    expect(zeile['messart']).toBe('ph_kontrolle');
    expect(zeile['messgeraet_id']).toBe(MESSGERAET);
  });

  it('client_zeit und gilt_ab sind jetzt für eine Tabelle mit Zeitachse', () => {
    const zeile = zeileVorbereiten(phKontrolle(), KONTEXT, VERSION);
    expect(zeitpunkt(zeile['client_zeit'])).toBe(KONTEXT.jetzt.getTime());
    expect(zeitpunkt(zeile['gilt_ab'])).toBe(KONTEXT.jetzt.getTime());
  });

  it('ein mitgegebenes gilt_ab (Nacherfassung) bleibt, client_zeit ist trotzdem jetzt', () => {
    const nacherfassung = '2026-11-24T18:00:00.000Z';
    const zeile = zeileVorbereiten(phKontrolle({ gilt_ab: nacherfassung }), KONTEXT, VERSION);
    expect(zeitpunkt(zeile['gilt_ab'])).toBe(new Date(nacherfassung).getTime());
    expect(zeitpunkt(zeile['client_zeit'])).toBe(KONTEXT.jetzt.getTime());
  });

  it('ohne Zeitachse (anlage, saatgut, ansatz_position) kein client_zeit und kein gilt_ab, aber app_version', () => {
    for (const tabelle of ['anlage', 'saatgut', 'ansatz_position'] as const) {
      const zeile = zeileVorbereiten(
        { art: 'neu', tabelle, felder: { client_id: ID, name: 'Testanlage Y' } },
        KONTEXT,
        VERSION,
      );
      expect(zeile, tabelle).not.toHaveProperty('client_zeit');
      expect(zeile, tabelle).not.toHaveProperty('gilt_ab');
      expect(zeile['app_version'], tabelle).toBe(VERSION);
      expect(zeile['client_id'], tabelle).toBe(ID);
    }
  });

  it('erfasst_am, nacherfasst und storniert_am werden nie gesendet', () => {
    const zeile = zeileVorbereiten(
      phKontrolle({
        erfasst_am: '2026-11-25T07:00:00.000Z',
        nacherfasst: false,
        storniert_am: '2026-11-25T07:01:00.000Z',
      }),
      KONTEXT,
      VERSION,
    );
    expect(zeile).not.toHaveProperty('erfasst_am');
    expect(zeile).not.toHaveProperty('nacherfasst');
    expect(zeile).not.toHaveProperty('storniert_am');
    expect(zeile['client_id']).toBe(ID);
  });
});

describe('MIT_ZEITACHSE', () => {
  it('enthält die Tabellen mit gilt_ab und client_zeit (8.1 Regel 3)', () => {
    const mit: Erfassungstabelle[] = [
      'messung',
      'kalibrierung',
      'naehrloesungsansatz',
      'ereignis',
      'satz',
      'pflanzung',
      'reservierung',
      'aufschub',
    ];
    for (const tabelle of mit) expect(MIT_ZEITACHSE.has(tabelle), tabelle).toBe(true);
  });

  it('enthält keine Tabelle ohne gilt_ab', () => {
    const ohne: Erfassungstabelle[] = [
      'anlage',
      'bereich',
      'platz',
      'etikett',
      'gefaessmodell',
      'deckeltyp',
      'gefaess',
      'anzuchtort',
      'netztopf',
      'saatgut',
      'pflanzvorgang',
      'ansatz_position',
      'ansatz_schritt',
      'etikett_aufruf',
      'ki_feldprotokoll',
      'eigene_aufgabe',
    ];
    for (const tabelle of ohne) expect(MIT_ZEITACHSE.has(tabelle), tabelle).toBe(false);
  });
});

describe('vorgangPruefen', () => {
  it('ein gültiger Vorgang ohne Verstoss', () => {
    expect(vorgangPruefen([phKontrolle()])).toEqual([]);
  });

  it('eine leere client_id ist ein Verstoss', () => {
    expect(vorgangPruefen([phKontrolle({ client_id: '' })]).length).toBeGreaterThan(0);
  });

  it('eine fehlende client_id ist ein Verstoss', () => {
    const ohne = phKontrolle();
    const { client_id: _weg, ...felder } = ohne.felder;
    void _weg;
    const schritt = { ...ohne, felder } as unknown as Schritt;
    expect(vorgangPruefen([schritt]).length).toBeGreaterThan(0);
  });

  it('ein Storno ohne clientId ist ein Verstoss', () => {
    expect(
      vorgangPruefen([{ art: 'storno', tabelle: 'messung', clientId: '', grund: 'fehleingabe' }]).length,
    ).toBeGreaterThan(0);
  });

  it('falsche Ereignisdaten sind ein Verstoss, gültige nicht', () => {
    const ereignis = (daten: Record<string, unknown>): Schritt => ({
      art: 'neu',
      tabelle: 'ereignis',
      felder: { client_id: ID, typ: 'beobachtung', satz_id: MESSGERAET, daten },
    });
    expect(vorgangPruefen([ereignis({ kategorie: 'mehltau', text: 'Weisser Belag' })])).toEqual([]);
    expect(vorgangPruefen([ereignis({ kategorie: 'mehltau', farbe: 'weiss' })]).length).toBeGreaterThan(0);
  });

  it('ein Verstoss in einem späteren Schritt wird gefunden', () => {
    const vorgang: Schritt[] = [phKontrolle(), phKontrolle({ client_id: '' })];
    expect(vorgangPruefen(vorgang).length).toBeGreaterThan(0);
  });
});
