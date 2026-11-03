// AK «Umrechnung» [Unit] (Issue #10, Plan 10 Testliste; 03_import_w0.md Abschnitte 6, 10; Konzept 9.3).
//
// Vorausgesetzt:
//   src/domain/w0/umrechnung.ts
//     type EcEinheit = 'mS/cm' | 'µS/cm' | 'ppm500' | 'ppm700' | 'cf'   (Werte wie Enum ec_einheit)
//     ecInMsCm(wert: number, einheit: EcEinheit): number   in ganzen Tausendsteln, halb aufwärts auf drei Dezimalen
//   src/domain/w0/auswahl.ts    artAuswahl(dateien: W0Dateien, pflichtgroessen: Pflichtgroesse[]): Auswahl
//   src/domain/w0/konstanten.ts seedKonstanten: SeedKonstanten (mit pflichtgroessen)
//   src/domain/w0/abbildung.ts  ladeplan(dateien, auswahl, konstanten): Ladeplan
//     Ladeplan.tabellen: Record<Zieltabelle, Record<string, unknown>[]>, Zielzeilen mit den Spaltennamen der
//     Datenbank (snake_case); Zahlen als number oder Zahltext, Verweise auf Sorten über sorte_key.
import { describe, expect, it } from 'vitest';
import { ecInMsCm } from '../../src/domain/w0/umrechnung.ts';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { wissen } from './w0-fixture.ts';
import { muss, type Dateien } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof artAuswahl>[0];

describe('W0-Umrechnung EC', () => {
  it('Umrechnung 1400 µS/cm ergibt 1.400 mS/cm', () => {
    expect(ecInMsCm(1400, 'µS/cm')).toBe(1.4);
  });

  it('Umrechnung 700 ppm500 ergibt 1.400 mS/cm', () => {
    expect(ecInMsCm(700, 'ppm500')).toBe(1.4);
  });

  it('Umrechnung 980 ppm700 ergibt 1.400 mS/cm', () => {
    expect(ecInMsCm(980, 'ppm700')).toBe(1.4);
  });

  it('Umrechnung CF 14 ergibt 1.400 mS/cm', () => {
    expect(ecInMsCm(14, 'cf')).toBe(1.4);
  });

  it('Umrechnung mS/cm bleibt unverändert', () => {
    expect(ecInMsCm(1.4, 'mS/cm')).toBe(1.4);
    expect(ecInMsCm(2.345, 'mS/cm')).toBe(2.345);
    expect(ecInMsCm(0.4, 'mS/cm')).toBe(0.4);
  });

  it('Umrechnung rundet halb aufwärts auf drei Dezimalen', () => {
    expect(ecInMsCm(1000, 'ppm700')).toBe(1.429);
    // 1.2345 ist in Gleitkomma 1.23449…; toFixed(3) ergäbe 1.234
    expect(ecInMsCm(1234.5, 'µS/cm')).toBe(1.235);
    expect(ecInMsCm(1001, 'ppm700')).toBe(1.43);
    expect(ecInMsCm(1.5, 'ppm700')).toBe(0.002);
  });

  it('Umrechnung behält Rohwert, Einheit und Basis in der Zielzeile', () => {
    const d: Dateien = wissen();
    const dateien = d as unknown as W0Dateien;
    const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
    const tabellen = plan.tabellen as unknown as Record<string, Record<string, unknown>[] | undefined>;
    const zeilen = muss(tabellen['profilwert'], 'profilwert im Ladeplan');
    // Fixture: pw.test_art_b.wachstum.ec = 1200 bis 1600 µS/cm, Basis zuwachs
    const z = muss(
      zeilen.find((x) => x['zeile_id'] === 'pw.test_art_b.wachstum.ec'),
      'pw.test_art_b.wachstum.ec',
    );
    expect(Number(z['ec_min_quelle'])).toBe(1200);
    expect(Number(z['ec_max_quelle'])).toBe(1600);
    expect(z['ec_einheit_quelle']).toBe('µS/cm');
    expect(z['ec_basis_quelle']).toBe('zuwachs');
    expect(Number(z['wert_min'])).toBe(1.2);
    expect(Number(z['wert_max'])).toBe(1.6);
  });
});
