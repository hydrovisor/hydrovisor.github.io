// Erster Ansatz im Gefäss (Plan 29, Zeile 2 «Kannen zählen»; Loesungswechsel-AK1; Konzept R4.4, R4.6; Plan 21 A2).
// Rein, ohne Uhr. Prüferbefund Runde 1: ersterAnsatz kommt aus dem Bündel statt fest false.
//
// Vertrag (vom Testentwickler präzisiert):
//   src/domain/abhakliste/rechnung.ts
//     erstAnsatzAm(teile, platzId): boolean
//       true genau dann, wenn das gültige Gefäss am Platz in v_gefaess_status (Spalte status je gefaess_id) den
//       Status in_betrieb_volumen_offen hat; sonst false (auch ohne Gefäss oder ohne Statuszeile).
import { describe, expect, it } from 'vitest';
import { erstAnsatzAm } from '../../src/domain/abhakliste/rechnung.ts';
import { ansatzTeile } from '../fixtures/ansatz.ts';
import { gefaessId, platzId, type Teile } from '../fixtures/regal.ts';

function mitStatus(kennung: string, status: string | null): Teile {
  const t = ansatzTeile();
  const id = gefaessId(kennung);
  const rest = (t['v_gefaess_status'] ?? []).filter((s) => s['gefaess_id'] !== id);
  t['v_gefaess_status'] = status === null ? rest : [...rest, { gefaess_id: id, status }];
  return t;
}

describe('Erster Ansatz: Kannen zählen (R4.4)', () => {
  it('Loesungswechsel-AK1 Gefäss mit Status in_betrieb_volumen_offen: erster Ansatz', () => {
    expect(erstAnsatzAm(mitStatus('2.3', 'in_betrieb_volumen_offen'), platzId('2.3'))).toBe(true);
  });

  it('Loesungswechsel-AK1 in_betrieb, in_pruefung, ruht oder entfernt: kein erster Ansatz', () => {
    for (const status of ['in_betrieb', 'in_pruefung', 'ruht', 'entfernt'])
      expect(erstAnsatzAm(mitStatus('2.3', status), platzId('2.3'))).toBe(false);
  });

  it('Loesungswechsel-AK1 ohne Statuszeile oder ohne Gefäss am Platz: kein erster Ansatz', () => {
    expect(erstAnsatzAm(mitStatus('2.3', null), platzId('2.3'))).toBe(false);
    const ohne = mitStatus('2.3', 'in_betrieb_volumen_offen');
    ohne['gefaess'] = (ohne['gefaess'] ?? []).filter((g) => g['platz_id'] !== platzId('2.3'));
    expect(erstAnsatzAm(ohne, platzId('2.3'))).toBe(false);
  });

  it('Loesungswechsel-AK1 der Status eines anderen Gefässes zählt nicht', () => {
    const t = mitStatus('2.2', 'in_betrieb_volumen_offen');
    expect(erstAnsatzAm(t, platzId('2.2'))).toBe(true);
    expect(erstAnsatzAm(t, platzId('2.3'))).toBe(false);
  });

  it('Loesungswechsel-AK1 ein beendetes Gefäss (gueltig_bis gesetzt) am Platz zählt nicht', () => {
    const t = mitStatus('2.3', 'in_betrieb_volumen_offen');
    t['gefaess'] = (t['gefaess'] ?? []).map((g) =>
      g['platz_id'] === platzId('2.3') ? { ...g, gueltig_bis: '2027-01-01T00:00:00.000Z' } : g,
    );
    expect(erstAnsatzAm(t, platzId('2.3'))).toBe(false);
  });
});
