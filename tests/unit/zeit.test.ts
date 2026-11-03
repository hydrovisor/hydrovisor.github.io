// Zeit in Europe/Zurich mit Zeitzone als Parameter (Plan 11 Testliste; 01_fachregeln.md G1, G2).
// Feste Zeitpunkte, nie die Systemzeit; die Gerätezone zählt nicht.
import { describe, expect, it } from 'vitest';
import { kalendertag, uhrzeit } from '../../src/domain/zeit.ts';

const ZUERICH = 'Europe/Zurich';

describe('uhrzeit', () => {
  it('Winterzeit: 2027-03-28T00:30Z ergibt 01:30 in Zürich', () => {
    expect(uhrzeit(new Date('2027-03-28T00:30:00Z'), ZUERICH)).toBe('01:30');
  });

  it('Sommerzeit: 2027-03-28T01:30Z ergibt 03:30 in Zürich (Umstellung in derselben Nacht)', () => {
    expect(uhrzeit(new Date('2027-03-28T01:30:00Z'), ZUERICH)).toBe('03:30');
  });

  it('hh:mm zweistellig und im 24-Stunden-Format, Mitternacht als 00 statt 24', () => {
    expect(uhrzeit(new Date('2026-11-25T07:07:00Z'), ZUERICH)).toBe('08:07');
    expect(uhrzeit(new Date('2026-11-24T23:05:00Z'), ZUERICH)).toBe('00:05');
    expect(uhrzeit(new Date('2026-11-25T12:45:00Z'), ZUERICH)).toBe('13:45');
  });

  it('die Zeitzone ist ein Parameter: America/New_York ergibt eine andere Uhrzeit', () => {
    const zeitpunkt = new Date('2027-03-28T00:30:00Z');
    expect(uhrzeit(zeitpunkt, 'America/New_York')).toBe('20:30');
    expect(uhrzeit(zeitpunkt, 'America/New_York')).not.toBe(uhrzeit(zeitpunkt, ZUERICH));
  });
});

describe('kalendertag', () => {
  it('2026-11-24T23:30Z ist in Zürich schon der 2026-11-25 (G2)', () => {
    expect(kalendertag(new Date('2026-11-24T23:30:00Z'), ZUERICH)).toBe('2026-11-25');
  });

  it('kurz vor Mitternacht Zürich bleibt der Tag; in New York ist es noch der Vortag', () => {
    expect(kalendertag(new Date('2026-11-24T22:59:00Z'), ZUERICH)).toBe('2026-11-24');
    expect(kalendertag(new Date('2026-11-24T23:30:00Z'), 'America/New_York')).toBe('2026-11-24');
  });

  it('Sommerzeit: 2027-07-01T22:30Z ist in Zürich der 2027-07-02', () => {
    expect(kalendertag(new Date('2027-07-01T22:30:00Z'), ZUERICH)).toBe('2027-07-02');
  });
});
