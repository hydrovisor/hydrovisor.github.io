// Nachbesserung Runde 1 (Prüferbefunde 1 und 3, Issue #10): optionale Spalten nach 03_import_w0.md 4.1, 4.3, 4.8
// und Hinweis A12. Vom Lead ergänzt, nicht vom Testentwickler. Namen ohne die Wörter der [SQL]-AK.
import { describe, expect, it } from 'vitest';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { pruefen } from '../../src/domain/w0/validator.ts';
import { wissen } from './w0-fixture.ts';
import { PFAD, spalteEntfernen, type Dateien } from './w0-hilfen.ts';

type W0Dateien = Parameters<typeof pruefen>[0];

describe('W0-Validator optionale Spalten', () => {
  it('Validator je Regel V1 geht durch ohne die optionalen Spalten autoren, jahr, kulturform und phase', () => {
    const d = wissen();
    spalteEntfernen(d, PFAD.quelle, 'autoren');
    spalteEntfernen(d, PFAD.quelle, 'jahr');
    spalteEntfernen(d, PFAD.wissenseintrag, 'phase');
    // art.csv ohne Spalte kulturform: nur Artmerkmale, deshalb Kulturform-Zeilen vorher entfernen
    const art = d[PFAD.art];
    if (!art) throw new Error('art.csv fehlt in der Fixture');
    art.zeilen = art.zeilen.filter((z) => z['kulturform'] === null);
    spalteEntfernen(d, PFAD.art, 'kulturform');
    expect(pruefen(d as unknown as W0Dateien, { modus: 'freigegeben' }).verstoesse).toEqual([]);
  });
});

describe('W0-Bericht Hinweise', () => {
  it('W0-Abbildung meldet Kulturgruppen ohne Mindestzeilen, wenn profilwert.csv fehlt (A12)', () => {
    const d: Dateien = wissen();
    const { [PFAD.profilwert]: _weg, ...ohne } = d;
    void _weg;
    const dateien = ohne as unknown as W0Dateien;
    const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
    expect(plan.hinweise.join(' ')).toMatch(/Kulturgruppen ohne Mindestzeilen/);
  });
});
