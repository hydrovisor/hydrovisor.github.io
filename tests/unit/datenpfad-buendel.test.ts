// Format und Anzeige des Offline-Bündels (Plan 11 Testliste, Abschnitt «Speicherort und Format»; 04_architektur.md 4.2;
// Konzept 11.4 TO6). Feste Uhr, Zeitzone Europe/Zurich als Parameter.
import { describe, expect, it } from 'vitest';
import {
  BUENDEL_FORMAT,
  buendelPruefen,
  fensterBeginn,
  letzterJeOrt,
  standAnzeige,
  type Buendel,
} from '../../src/domain/datenpfad/buendel.ts';

const ZUERICH = 'Europe/Zurich';
const NUTZER = '00000000-0000-4000-8000-0000000000e2';

const buendel = (stand: string, teile: Buendel['teile'] = { messgeraet: [{ id: 'g1' }] }): Buendel => ({
  id: 'aktuell',
  format: 1,
  stand,
  appVersion: '0.1.0+abc1234',
  nutzerId: NUTZER,
  teile,
});

describe('buendelPruefen', () => {
  it('nimmt ein gültiges Bündel des Nutzers an', () => {
    expect(BUENDEL_FORMAT).toBe(1);
    const b = buendel('2026-11-25T07:07:00.000Z');
    expect(buendelPruefen(structuredClone(b), NUTZER)).toEqual(b);
  });

  it('verwirft Format 2', () => {
    expect(buendelPruefen({ ...buendel('2026-11-25T07:07:00.000Z'), format: 2 }, NUTZER)).toBeUndefined();
  });

  it('verwirft eine fremde nutzerId', () => {
    expect(
      buendelPruefen(buendel('2026-11-25T07:07:00.000Z'), '00000000-0000-4000-8000-0000000000ff'),
    ).toBeUndefined();
  });

  it('verwirft einen Wert ohne teile', () => {
    const { teile: _weg, ...ohne } = buendel('2026-11-25T07:07:00.000Z');
    void _weg;
    expect(buendelPruefen(ohne, NUTZER)).toBeUndefined();
  });

  it('verwirft undefined, null und Text', () => {
    expect(buendelPruefen(undefined, NUTZER)).toBeUndefined();
    expect(buendelPruefen(null, NUTZER)).toBeUndefined();
    expect(buendelPruefen('aktuell', NUTZER)).toBeUndefined();
  });
});

describe('standAnzeige', () => {
  // 25.11.2026 11:00 in Zürich (Winterzeit, UTC+1)
  const JETZT = new Date('2026-11-25T10:00:00.000Z');

  it('frisch geladen: kein Stand', () => {
    const anzeige = standAnzeige(
      { buendel: buendel('2026-11-25T09:59:00.000Z'), frisch: true },
      JETZT,
      ZUERICH,
    );
    expect(anzeige.stand).toBeUndefined();
    expect(anzeige.hinweis).toBeUndefined();
  });

  it('TO6 nicht frisch am selben Kalendertag: «Stand: 08:07»', () => {
    const anzeige = standAnzeige(
      { buendel: buendel('2026-11-25T07:07:00.000Z'), frisch: false },
      JETZT,
      ZUERICH,
    );
    expect(anzeige.stand).toBe('Stand: 08:07');
    expect(anzeige.hinweis).toBeUndefined();
  });

  it('TO6 Stand kurz nach Mitternacht Zürich zählt zum selben Kalendertag (23:30Z des Vortags)', () => {
    const anzeige = standAnzeige(
      { buendel: buendel('2026-11-24T23:30:00.000Z'), frisch: false },
      JETZT,
      ZUERICH,
    );
    expect(anzeige.stand).toBe('Stand: 00:30');
  });

  it('TO6 nicht frisch vom Vortag: «Stand: 24.11. 08:07» (A2)', () => {
    const anzeige = standAnzeige(
      { buendel: buendel('2026-11-24T07:07:00.000Z'), frisch: false },
      JETZT,
      ZUERICH,
    );
    expect(anzeige.stand).toBe('Stand: 24.11. 08:07');
  });

  it('ohne Bündel: Hinweis «Noch keine Daten auf dem Gerät», kein Stand', () => {
    const anzeige = standAnzeige({ frisch: false }, JETZT, ZUERICH);
    expect(anzeige.stand).toBeUndefined();
    expect(anzeige.hinweis).toBe('Noch keine Daten auf dem Gerät');
  });
});

describe('fensterBeginn', () => {
  const ms = (iso: string) => new Date(iso).getTime();

  it('14 Tage über den Beginn der Sommerzeit: Mitternacht Zürich des Kalendertags vor 14 Tagen (MEZ)', () => {
    // 5.4.2027 12:00 Sommerzeit; 14 Kalendertage zurück ist der 22.3.2027, 00:00 MEZ = 21.3. 23:00Z
    expect(ms(fensterBeginn(new Date('2027-04-05T10:00:00.000Z'), 14, ZUERICH))).toBe(
      ms('2027-03-21T23:00:00.000Z'),
    );
  });

  it('14 Tage über das Ende der Sommerzeit: Mitternacht Zürich in MESZ', () => {
    // 5.11.2027 12:00 Winterzeit; 14 Kalendertage zurück ist der 22.10.2027, 00:00 MESZ = 21.10. 22:00Z
    expect(ms(fensterBeginn(new Date('2027-11-05T11:00:00.000Z'), 14, ZUERICH))).toBe(
      ms('2027-10-21T22:00:00.000Z'),
    );
  });

  it('der Kalendertag gilt in Zürich, nicht in UTC (23:30Z ist schon der Folgetag)', () => {
    // 24.11.2026 23:30Z = 25.11. 00:30 Zürich; 14 Tage zurück ist der 11.11.2026, 00:00 MEZ = 10.11. 23:00Z
    expect(ms(fensterBeginn(new Date('2026-11-24T23:30:00.000Z'), 14, ZUERICH))).toBe(
      ms('2026-11-10T23:00:00.000Z'),
    );
  });
});

describe('letzterJeOrt', () => {
  const zeile = (id: string, platz_id: string | null, begonnen_am: string) => ({ id, platz_id, begonnen_am });

  it('zwei Orte: je Ort nur der zuletzt begonnene Ansatz', () => {
    const zeilen = [
      zeile('a1', 'platz-a', '2027-01-05T08:00:00+00:00'),
      zeile('b1', 'platz-b', '2027-01-07T08:00:00+00:00'),
      zeile('a2', 'platz-a', '2027-01-12T08:00:00+00:00'),
      zeile('b0', 'platz-b', '2027-01-01T08:00:00+00:00'),
    ];
    const ergebnis = letzterJeOrt(zeilen)
      .map((z) => z.id)
      .sort();
    expect(ergebnis).toEqual(['a2', 'b1']);
  });

  it('Gleichstand: genau ein Ansatz je Ort, einer der beiden gleichzeitigen', () => {
    const zeilen = [
      zeile('a1', 'platz-a', '2027-01-12T08:00:00+00:00'),
      zeile('a2', 'platz-a', '2027-01-12T08:00:00+00:00'),
      zeile('b1', 'platz-b', '2027-01-03T08:00:00+00:00'),
    ];
    const ergebnis = letzterJeOrt(zeilen);
    expect(ergebnis).toHaveLength(2);
    expect(ergebnis.filter((z) => z.platz_id === 'platz-a')).toHaveLength(1);
    expect(['a1', 'a2']).toContain(ergebnis.find((z) => z.platz_id === 'platz-a')?.id);
    expect(ergebnis.find((z) => z.platz_id === 'platz-b')?.id).toBe('b1');
  });

  it('leere Liste ergibt leere Liste', () => {
    expect(letzterJeOrt([])).toEqual([]);
  });
});
