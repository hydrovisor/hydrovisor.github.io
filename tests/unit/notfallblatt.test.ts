// Notfall- und Vertretungsblatt (Plan 32; Konzept 11.7; Notfallblatt.md). Routine: Tests vom Lead.
// Regal R aus tests/fixtures/regal.ts am 10.12.2026 09:00 Zürich: 2.3 mit Neuansatz vom 28.11. (Grow 21, Micro 14,
// Bloom 7 ml auf 9 l), Wechselintervall 14 Tage; Kratky ohne Wechselintervall.
import { describe, expect, it } from 'vitest';
import {
  notfallblatt,
  vertretungKontakt,
  VERTRETUNG_REGELN,
} from '../../src/domain/einstellungen/notfallblatt.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { gefaessId, regalTeile, weitereAnlage, vereinen } from '../fixtures/regal.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');

describe('Notfallblatt «Stand je Gefäss» (Konzept 11.7)', () => {
  it('eine Zeile je aktivem Gefäss der Anlage in Code-Reihenfolge, ohne Anzuchtboxen und W', () => {
    const b = notfallblatt(regalTeile(JETZT), 'R', JETZT, ZEITZONE);
    expect(b.anlage).toBe('R');
    expect(b.stand).toBe('Stand 10.12.2026, 09:00');
    expect(b.zeilen.map((z) => z.kennung)).toEqual([
      '1.1',
      '1.2',
      '2.1',
      '2.2',
      '2.3',
      '3.1',
      '3.2',
      '3.3',
      '4.1',
      '4.2',
      '4.3',
      '4.4',
      '4.5',
    ]);
  });

  it('2.3: Zielbereich, Dosis je Kanne 10 l aus dem letzten Neuansatz auf 0.5 ml, letzte Messung, nächster Wechsel', () => {
    const z = notfallblatt(regalTeile(JETZT), 'R', JETZT, ZEITZONE).zeilen.find((x) => x.kennung === '2.3');
    expect(z).toEqual({
      kennung: '2.3',
      betriebsart: 'DWC',
      zielbereich: 'pH 5.8–6.3 · EC 1.0–1.4',
      // 14 / 9 · 10 = 15.56 → 15.5; 21 / 9 · 10 = 23.33 → 23.5; 7 / 9 · 10 = 7.78 → 8.0
      dosisJeKanne: 'Micro 15.5 ml · Grow 23.5 ml · Bloom 8.0 ml',
      letzteMessung: 'Do 10.12. 09:00 · pH 6.40 · EC 1.45 · 20.5 °C',
      naechsterWechsel: '12.12.',
    });
  });

  it('Kanne aus den Einstellungen; Kratky ohne Wechselintervall «–»; festes Wechseldatum hat Vorrang', () => {
    const t = regalTeile(JETZT);
    t['einstellung'] = [{ id: 'e', kannengroesse_l: '5.0' }];
    const g = (t['gefaess'] ?? []).find((x) => x['id'] === gefaessId('2.3'));
    if (!g) throw new Error('Gefäss 2.3 fehlt');
    g['naechster_wechsel_am'] = '2026-12-15';
    const b = notfallblatt(t, 'R', JETZT, ZEITZONE);
    const z23 = b.zeilen.find((x) => x.kennung === '2.3');
    expect(b.kanne).toBe(5);
    // 14 / 9 · 5 = 7.78 → 8.0; 21 / 9 · 5 = 11.67 → 11.5; 7 / 9 · 5 = 3.89 → 4.0
    expect(z23?.dosisJeKanne).toBe('Micro 8.0 ml · Grow 11.5 ml · Bloom 4.0 ml');
    expect(z23?.naechsterWechsel).toBe('15.12.');
    expect(b.zeilen.find((x) => x.kennung === '3.1')?.naechsterWechsel).toBe('–');
    expect(b.zeilen.find((x) => x.kennung === '3.1')?.zielbereich).toBe('–');
  });

  it('nur Gefässe der gewählten Anlage', () => {
    const t = vereinen(regalTeile(JETZT), weitereAnlage('T', 'echt'));
    const r = notfallblatt(t, 'R', JETZT, ZEITZONE);
    expect(r.zeilen).toHaveLength(13);
    expect(notfallblatt(t, 'X', JETZT, ZEITZONE).zeilen).toEqual([]);
  });
});

describe('Vertretungsblatt (Konzept 11.7, Annahme 12)', () => {
  it('feste Regeln, «Keinen Dünger geben»; Kontakt nur aus der Datenbank', () => {
    expect(VERTRETUNG_REGELN).toEqual([
      'Nur Leitungswasser bis zur Marke nachfüllen.',
      'Pumpen und Licht prüfen.',
      'Keinen Dünger geben.',
    ]);
    expect(vertretungKontakt(null)).toBe('Telefonnummer in den Einstellungen eintragen.');
    expect(vertretungKontakt('  ')).toBe('Telefonnummer in den Einstellungen eintragen.');
    expect(vertretungKontakt('Platzhalter')).toBe('Bei Fragen: Platzhalter');
  });
});

describe('Notfallblatt Runde 1 (Befunde 5 bis 7)', () => {
  it('Reihenfolge Micro, Grow, Bloom auch mit den echten Produktnamen; nicht dosierte Komponente entfällt; kleine Dosis nie 0', () => {
    const t = regalTeile(JETZT);
    t['produkt'] = [
      { produkt_id: 'grow', name: 'TriPart Grow' },
      { produkt_id: 'micro_hard_water', name: 'TriPart Micro' },
      { produkt_id: 'bloom', name: 'TriPart Bloom' },
    ];
    for (const p of t['ansatz_position'] ?? []) {
      if (p['produkt_id'] === 'bloom') p['ist_ml'] = 0;
      if (p['produkt_id'] === 'micro_hard_water') p['ist_ml'] = 0.18; // 0.02 ml/L · 10 l = 0.2 ml
    }
    const z = notfallblatt(t, 'R', JETZT, ZEITZONE).zeilen.find((x) => x.kennung === '2.3');
    expect(z?.dosisJeKanne).toBe('TriPart Micro 0.5 ml · TriPart Grow 23.5 ml');
  });

  it('Laufweg der Anlage bestimmt die Reihenfolge, übrige Gefässe danach nach Code', () => {
    const t = regalTeile(JETZT);
    const anlage = (t['anlage'] ?? [])[0];
    if (!anlage) throw new Error('Anlage fehlt');
    anlage['laufweg'] = ['4.5', '2.3', '1.1'];
    const kennungen = notfallblatt(t, 'R', JETZT, ZEITZONE).zeilen.map((x) => x.kennung);
    expect(kennungen.slice(0, 4)).toEqual(['4.5', '2.3', '1.1', '1.2']);
    expect(kennungen).toHaveLength(13);
  });
});

describe('Notfallblatt Runde 2 (Befund 5)', () => {
  it('nächster Wechsel ab dem letzten Neuansatz, auch wenn danach ein Teilwechsel lief', () => {
    const t = regalTeile(JETZT);
    (t['naehrloesungsansatz'] ??= []).push({
      id: '21000000-0000-4000-8000-000000000099',
      platz_id: (t['naehrloesungsansatz'] ?? [])[0]?.['platz_id'],
      typ: 'teilwechsel',
      status: 'abgeschlossen',
      begonnen_am: '2026-12-05T08:00:00.000Z',
      storniert_am: null,
    });
    expect(
      notfallblatt(t, 'R', JETZT, ZEITZONE).zeilen.find((x) => x.kennung === '2.3')?.naechsterWechsel,
    ).toBe('12.12.');
  });
});
