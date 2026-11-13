// Plan 205 (Entscheid 0023): Gruppen je Gemüse und Detail der Sorte für Säen, Schritt 1
import { describe, expect, it } from 'vitest';
import {
  gemueseGruppen,
  sorteDetail,
  sortenAuswahl,
  type SorteWahl,
} from '../../src/domain/pflanzung/saeen.ts';
import { PACKUNG, saatTeile, SORTE } from '../fixtures/saeen.ts';

const JETZT = new Date('2027-01-07T08:00:00Z');

function teileMit(extra: Record<string, unknown[]> = {}) {
  const t = saatTeile(JETZT, { ohneSatzIn23: true });
  for (const [k, v] of Object.entries(extra)) t[k] = v as never;
  return t;
}

const namen = (g: { name: string; sorten: SorteWahl[] }[]) =>
  g.map((x) => `${x.name}:${x.sorten.map((s) => s.name).join('+')}`);

describe('gemueseGruppen', () => {
  it('SW1-AK1 Gruppen je Art mit deutschem Namen, alphabetisch, «Wie letztes Mal» zuerst, Zählung gewählt und beste Stufe', () => {
    const sorten = sortenAuswahl(teileMit());
    expect(namen(gemueseGruppen(sorten, []))).toEqual([
      'Chili:Cayenne',
      'Petersilie:Mooskrause',
      'Rucola:Rucola',
      'Salat:Eichblatt+Lollo Rossa',
      'Tomate:Ochsenherz',
    ]);

    // «Wie letztes Mal» zieht sein Gemüse nach vorn, die Sorten behalten ihre Reihenfolge
    const mitLetztem = sorten.map((s) =>
      s.sorteId === SORTE.ochsenherz ? { ...s, wieLetztesMal: s.vorgabe } : s,
    );
    expect(gemueseGruppen(mitLetztem, [])[0]?.name).toBe('Tomate');

    // Zählung der gewählten Sorten je Gemüse
    const gewaehlt = gemueseGruppen(sorten, [SORTE.lollo, SORTE.eichblatt, SORTE.cayenne]);
    expect(gewaehlt.map((g) => [g.name, g.gewaehlt])).toEqual([
      ['Chili', 1],
      ['Petersilie', 0],
      ['Rucola', 0],
      ['Salat', 2],
      ['Tomate', 0],
    ]);

    // mit Passung: beste Stufe je Gemüse, Reihenfolge nach bester Rangzahl
    const passungen = [
      { sorteId: SORTE.ochsenherz, rang: 5, passung: { einstufung: 'nicht_empfohlen' as const } },
      { sorteId: SORTE.lollo, rang: 2, passung: { einstufung: 'moeglich' as const } },
      { sorteId: SORTE.eichblatt, rang: 1, passung: { einstufung: 'empfohlen' as const } },
      { sorteId: SORTE.cayenne, rang: 3, passung: { einstufung: 'moeglich' as const } },
    ];
    const mitPassung = gemueseGruppen(sorten, [], passungen);
    expect(mitPassung.map((g) => [g.name, g.stufe])).toEqual([
      ['Salat', 'empfohlen'],
      ['Chili', 'moeglich'],
      ['Tomate', 'nicht_empfohlen'],
      ['Petersilie', undefined],
      ['Rucola', undefined],
    ]);

    // Art ohne deutschen Namen: art_id als Name (A2)
    const ohneName = sorten.map((s) => {
      if (s.sorteId !== SORTE.rucola) return s;
      const ohne: SorteWahl = { ...s };
      delete ohne.artName;
      return ohne;
    });
    expect(gemueseGruppen(ohneName, []).some((g) => g.name === 'eruca_vesicaria')).toBe(true);
  });
});

describe('sorteDetail', () => {
  it('SW1-AK4 Detail liefert Saatempfehlung und Erntewerte je Kulturform', () => {
    const t = teileMit({
      art_kulturform: [
        {
          art_id: 'lactuca_sativa',
          kulturform: 'kopf',
          ernteart: 'einmalig',
          ernte_ab_d: 24,
          kulturdauer_typisch_d: 35,
          gueltig_bis: null,
        },
        {
          art_id: 'lactuca_sativa',
          kulturform: 'schnitt',
          ernteart: 'mehrfach',
          ernte_ab_d: null,
          kulturdauer_typisch_d: null,
          gueltig_bis: null,
        },
        // abgelöste Version zählt nicht
        {
          art_id: 'lactuca_sativa',
          kulturform: 'babyleaf',
          ernteart: 'mehrfach',
          ernte_ab_d: 9,
          kulturdauer_typisch_d: 9,
          gueltig_bis: '2026-11-01T00:00:00Z',
        },
      ],
      v_vollstaendigkeit: [{ sorte_id: SORTE.lollo, vollstaendig: false, fehlende_groessen: 3 }],
    });
    const d = sorteDetail(t, SORTE.lollo);
    expect(d?.saat).toEqual({
      kopf: { samenJeSchwamm: 1, obergrenzeSamen: 3, pflanzenStehenLassen: 1 },
      babyleaf: { samenJeSchwamm: 3, obergrenzeSamen: 4, pflanzenStehenLassen: 3 },
      schnitt: { samenJeSchwamm: 3, obergrenzeSamen: 4, pflanzenStehenLassen: 3 },
    });
    expect(d?.ernte).toEqual({
      kopf: { einmalig: true, abD: 24, typischD: 35 },
      schnitt: { einmalig: false },
    });
    expect(d?.umsetzenAbD).toBe(21);
    // jüngste Packung (A6): gekauft 20.11.2026, Bestand 100
    expect(d?.packung).toEqual({ kaufdatum: '2026-11-20', bestandKorn: 100 });
    expect(d?.vollstaendig).toBe(false);
    expect(d?.fehlend).toBe(3);
    expect(d?.bezug).toBeUndefined();

    // Shop-Link: nur der Host ohne «www.»
    const mitLink = teileMit();
    for (const s of mitLink['sorte'] ?? [])
      if (s['sorte_id'] === SORTE.ochsenherz) s['shop_link'] = 'https://www.saemereien.ch/tomate';
    expect(sorteDetail(mitLink, SORTE.ochsenherz)?.bezug).toBe('saemereien.ch');
    // ohne v_vollstaendigkeit und art_kulturform: unbekannt statt falsch
    const ohne = sorteDetail(mitLink, SORTE.ochsenherz);
    expect(ohne?.vollstaendig).toBeUndefined();
    expect(ohne?.ernte).toEqual({});
    expect(PACKUNG.ochsenherz).toBeTruthy();
    expect(sorteDetail(mitLink, 'unbekannt')).toBeUndefined();
  });
});
