// Deckelwahl mit Lochbild und nach Box gefiltert (Entscheid 0021). Lead-Test.
import { describe, expect, it } from 'vitest';
import {
  boxGrundflaeche,
  deckelAuswahl,
  deckelBeschreibung,
  deckelGrundflaeche,
  deckelTyp,
  deckelVorwahl,
} from '../../src/domain/vorlagen/deckelpassung.ts';

const deckel = (name: string, topf: number, reihen: number[]) => ({
  id: `id-${name}`,
  name,
  topfdurchmesser_mm: topf,
  loecher_je_reihe: reihen,
});

// Reihenfolge wie im Bildschirmfoto von Tim (Anlage IHD, 13.11.2026)
const ALLE = [
  deckel('D3', 50, [4, 4]),
  deckel('S8', 80, [1, 1, 1, 1]),
  deckel('D2', 80, [3, 3]),
  deckel('D6', 50, [2, 2, 2]),
  deckel('S5', 50, [1, 2, 1, 2, 1, 2, 1, 2, 1]),
  deckel('D4', 80, [1, 1]),
  deckel('D1', 80, [2, 2]),
];

const RAKO_40 = { name: 'Rako 40 × 30 × 17', form: 'rechteckig', innen_l_mm: 365, innen_b_mm: 265 };
const RAKO_30 = { name: 'Rako 30 × 20 × 12', form: 'rechteckig', innen_l_mm: 270, innen_b_mm: 180 };
const LENI = { name: 'Leni Flori 36', form: 'oval', innen_l_mm: 365, innen_b_mm: 135 };

const namen = (liste: { deckel: { name: string } }[]) => liste.map((o) => o.deckel.name);

describe('Deckelwahl (Entscheid 0021)', () => {
  it('DK1-AK1 Beschreibung nennt Lochzahl, Topfgrösse und Reihen', () => {
    expect(deckelBeschreibung(deckel('D2', 80, [3, 3]))).toBe('6 Löcher · 8 cm · Reihen 3, 3');
    expect(deckelBeschreibung(deckel('S5', 50, [1, 2, 1, 2, 1, 2, 1, 2, 1]))).toBe(
      '13 Löcher · 5 cm · Reihen 1, 2, 1, 2, 1, 2, 1, 2, 1',
    );
    expect(deckelBeschreibung(deckel('X', 80, [1]))).toBe('1 Loch · 8 cm · Reihen 1');
    // numeric als Text aus PostgREST
    expect(deckelBeschreibung({ topfdurchmesser_mm: '50', loecher_je_reihe: ['2', '2', '2'] })).toBe(
      '6 Löcher · 5 cm · Reihen 2, 2, 2',
    );
  });

  it('DK1-AK1 jede Option trägt Beschreibung und Grundfläche', () => {
    const { sichtbar } = deckelAuswahl(ALLE, undefined, undefined);
    const d2 = sichtbar.find((o) => o.deckel.name === 'D2');
    expect(d2).toMatchObject({
      beschreibung: '6 Löcher · 8 cm · Reihen 3, 3',
      fuer: 'Rako 40\u00a0×\u00a030',
    });
  });

  it('DK1-AK2 Typ nach Lochbild und Topfgrösse, nicht nach Name', () => {
    expect(deckelTyp(deckel('Demo D1', 80, [2, 2]))?.name).toBe('D1');
    expect(deckelTyp(deckel('D1', 50, [2, 2]))).toBeUndefined();
    expect(ALLE.map((d) => deckelGrundflaeche(d))).toEqual([
      'rako_40_30',
      'leni_flori_36',
      'rako_40_30',
      'rako_30_20',
      'leni_flori_36',
      'rako_30_20',
      'rako_40_30',
    ]);
  });

  it('DK1-AK2 Box nach Form und Grundfläche, innen oder aussen gemessen, Seiten vertauscht', () => {
    expect(boxGrundflaeche(RAKO_40)).toBe('rako_40_30');
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 400, innen_b_mm: 300 })).toBe('rako_40_30');
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 265, innen_b_mm: 365 })).toBe('rako_40_30');
    expect(boxGrundflaeche(RAKO_30)).toBe('rako_30_20');
    expect(boxGrundflaeche(LENI)).toBe('leni_flori_36');
    // gleiche Masse, andere Form
    expect(boxGrundflaeche({ ...LENI, form: 'rechteckig' })).toBeUndefined();
    // Demo RAKO 60 × 40: keine bekannte Grundfläche
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 570, innen_b_mm: 370 })).toBeUndefined();
    // in beiden Toleranzen: die nähere gilt
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 345, innen_b_mm: 245 })).toBe('rako_30_20');
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 355, innen_b_mm: 255 })).toBe('rako_40_30');
    // gleicher Abstand zu beiden: keine Grundfläche, Rückfallweg (Prüfer Runde 1, Befund 3)
    expect(boxGrundflaeche({ form: 'rechteckig', innen_l_mm: 350, innen_b_mm: 250 })).toBeUndefined();
  });

  it('DK1-AK2 nach der Box nur passende Deckel, die übrigen ausgeblendet', () => {
    const a = deckelAuswahl(ALLE, RAKO_40, undefined);
    expect(namen(a.sichtbar)).toEqual(['D1', 'D2', 'D3']);
    expect(namen(a.ausgeblendet)).toEqual(['D4', 'D6', 'S5', 'S8']);
    expect(a.hinweis).toBeUndefined();
    expect(namen(deckelAuswahl(ALLE, RAKO_30, undefined).sichtbar)).toEqual(['D4', 'D6']);
    expect(namen(deckelAuswahl(ALLE, LENI, undefined).sichtbar)).toEqual(['S5', 'S8']);
  });

  it('DK1-AK2 Deckel mit unbekanntem Lochbild bleiben sichtbar', () => {
    const eigen = deckel('Eigenbau', 80, [5]);
    const a = deckelAuswahl([...ALLE, eigen], RAKO_30, undefined);
    expect(namen(a.sichtbar)).toEqual(['D4', 'D6', 'Eigenbau']);
    expect(a.sichtbar.find((o) => o.deckel.name === 'Eigenbau')).toMatchObject({
      passung: 'unbekannt',
      fuer: undefined,
    });
  });

  it('DK1-AK2 ohne Box alle; Box ohne Grundfläche oder ohne passenden Deckel: alle mit Hinweis', () => {
    expect(deckelAuswahl(ALLE, undefined, undefined)).toMatchObject({ ausgeblendet: [] });
    expect(deckelAuswahl(ALLE, undefined, undefined).hinweis).toBeUndefined();
    const fremd = deckelAuswahl(ALLE, { form: 'rechteckig', innen_l_mm: 570, innen_b_mm: 370 }, undefined);
    expect([fremd.sichtbar.length, fremd.ausgeblendet.length, fremd.hinweis]).toEqual([
      7,
      0,
      'box_unbekannt',
    ]);
    const nurLeni = deckelAuswahl([deckel('S8', 80, [1, 1, 1, 1])], RAKO_40, undefined);
    expect([nurLeni.sichtbar.length, nurLeni.hinweis]).toEqual([1, 'keiner_passt']);
  });

  it('DK1-AK4 vorgesehener Deckel für die Kennung zuoberst und vorgewählt', () => {
    const a = deckelAuswahl(ALLE, RAKO_40, '2.1');
    expect(namen(a.sichtbar)).toEqual(['D2', 'D1', 'D3']);
    expect(a.sichtbar.map((o) => o.vorgesehen)).toEqual([true, false, false]);
    expect(deckelVorwahl(a)).toBe('id-D2');
    // 2.2 sieht D4 vor, D4 passt nicht auf Rako 40 × 30: keine Vorwahl
    expect(deckelVorwahl(deckelAuswahl(ALLE, RAKO_40, '2.2'))).toBeUndefined();
    expect(deckelVorwahl(deckelAuswahl(ALLE, RAKO_30, '2.2'))).toBe('id-D4');
  });

  it('DK1-AK4 Vorwahl: einziger sichtbarer oder einziger passender Deckel', () => {
    expect(deckelVorwahl(deckelAuswahl([deckel('D2', 80, [3, 3])], undefined, undefined))).toBe('id-D2');
    expect(
      deckelVorwahl(deckelAuswahl([deckel('D4', 80, [1, 1]), deckel('D2', 80, [3, 3])], RAKO_40, undefined)),
    ).toBe('id-D2');
    expect(deckelVorwahl(deckelAuswahl(ALLE, RAKO_30, '9.9'))).toBeUndefined();
  });

  it('DK1-AK4 keine Vorwahl, wenn der einzige Deckel nicht zur Box passt (keiner_passt)', () => {
    const a = deckelAuswahl([deckel('S8', 80, [1, 1, 1, 1])], RAKO_40, '4.2');
    expect(a.hinweis).toBe('keiner_passt');
    expect(deckelVorwahl(a)).toBeUndefined();
    // Passung unbekannt (Box ohne Grundfläche): die einzige Vorlage bleibt gewählt (#185)
    const fremd = { form: 'rechteckig', innen_l_mm: 570, innen_b_mm: 370 };
    expect(deckelVorwahl(deckelAuswahl([deckel('S8', 80, [1, 1, 1, 1])], fremd, undefined))).toBe('id-S8');
  });
});
