// Übernahme des KI-Ergebnisses ins Formular und Feldstatus (Issue #14, Plan 14 Testliste; UC4-AK2, Varianten;
// Konzept 8.2 ki_feldprotokoll, 11.3). Reine Funktionen.
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   src/domain/ki/uebernahme.ts
//     KiErgebnis, VonHandGrund, hinweisVonHand(grund), kiUebernehmen(eingaben, ergebnis), feldStatus(wertKi, wertFinal)
//   kiUebernehmen verändert das übergebene Objekt nicht. Eine Eingabe gilt als leer, wenn sie fehlt oder nur aus
//   Leerraum besteht; nur dafür entsteht ein Vorschlag (Text aus feldTexte), und nur, wenn die KI einen Wert hat.
//   Jeder Hinweis bei «von Hand» enthält die Worte «von Hand».
import { describe, expect, it } from 'vitest';
import {
  feldStatus,
  hinweisVonHand,
  kiUebernehmen,
  type KiErgebnis,
} from '../../src/domain/ki/uebernahme.ts';
import type { TuetenFelder } from '../../src/domain/ki/schema.ts';

const FELDER: TuetenFelder = {
  name: 'Rote Probe',
  art: 'Lactuca sativa',
  keimart: 'licht',
  keimtemperatur_min_c: 15,
  keimtemperatur_max_c: 20,
  keimdauer_min_d: 7,
  keimdauer_max_d: 14,
  kulturdauer_min_d: null,
  kulturdauer_max_d: null,
  aussaat_von_monat: 3,
  aussaat_bis_monat: 8,
  hersteller: null,
};

const ok = (felder: TuetenFelder): KiErgebnis => ({
  ergebnis: 'ok',
  modell: 'claude-sonnet-5-5',
  felder,
  verworfen: [],
  dauerMs: 4200,
  ausweichmodell: false,
});

const GRUENDE = ['grenze', 'zeit', 'fehler', 'ungueltig', 'nicht_eingerichtet'] as const;

describe('UC4-AK2 Eingaben bleiben', () => {
  it('UC4-AK2 bei «von Hand» bleiben alle Eingaben unverändert, Hinweis gesetzt', () => {
    for (const grund of GRUENDE) {
      const eingaben = Object.freeze({ name: 'Meine Probe', art: 'Salat', keimdauer: '7-10' });
      const ergebnis: KiErgebnis = {
        ergebnis: 'von_hand',
        grund,
        hinweis: hinweisVonHand(grund),
        dauerMs: 30_000,
      };
      const r = kiUebernehmen(eingaben, ergebnis);
      expect(r.eingaben).toEqual({ name: 'Meine Probe', art: 'Salat', keimdauer: '7-10' });
      expect(r.vorschlag).toEqual({});
      expect(r.hinweis).toBe(hinweisVonHand(grund));
      expect(eingaben).toEqual({ name: 'Meine Probe', art: 'Salat', keimdauer: '7-10' });
    }
  });

  it('UC4-AK2 KI-Wert überschreibt keine getippte Eingabe', () => {
    const eingaben = Object.freeze({ name: 'Meine Probe', keimart: 'dunkel', keimtemperatur: '18-22' });
    const r = kiUebernehmen(eingaben, ok(FELDER));
    expect(r.eingaben).toEqual({ name: 'Meine Probe', keimart: 'dunkel', keimtemperatur: '18-22' });
    expect(r.vorschlag).not.toHaveProperty('name');
    expect(r.vorschlag).not.toHaveProperty('keimart');
    expect(r.vorschlag).not.toHaveProperty('keimtemperatur');
    expect(r.hinweis).toBeUndefined();
  });

  it('UC4-AK2 ok mit leerem Feld: Vorschlag nur für leere Eingaben', () => {
    const eingaben = Object.freeze({ name: 'Meine Probe', art: '', keimdauer: '   ' });
    const r = kiUebernehmen(eingaben, ok(FELDER));
    expect(r.eingaben).toEqual({ name: 'Meine Probe', art: '', keimdauer: '   ' });
    expect(r.vorschlag).toEqual({
      art: 'Lactuca sativa',
      keimart: 'licht',
      keimtemperatur: '15-20',
      keimdauer: '7-14',
      aussaatfenster: '3-8',
    });
  });
});

describe('8.2 Feldstatus für ki_feldprotokoll', () => {
  it('8.2 feldStatus: null → leer; gleich (Gross/Klein, Leerraum) → uebernommen; anders → geaendert', () => {
    expect(feldStatus(null, null)).toBe('leer');
    expect(feldStatus(null, 'Rote Probe')).toBe('leer');
    expect(feldStatus('Rote Probe', 'Rote Probe')).toBe('uebernommen');
    expect(feldStatus('Rote Probe', ' rote probe ')).toBe('uebernommen');
    expect(feldStatus('LICHT', 'licht')).toBe('uebernommen');
    expect(feldStatus('18-22', '18-24')).toBe('geaendert');
    expect(feldStatus('Rote Probe', 'Rote Perle')).toBe('geaendert');
    expect(feldStatus('Rote Probe', null)).toBe('geaendert');
  });
});

describe('11.3 Hinweistexte', () => {
  it('11.3 Hinweise in Du-Form ohne Ausrufezeichen: grenze, zeit, fehler, ungueltig, nicht_eingerichtet', () => {
    const texte = GRUENDE.map((g) => hinweisVonHand(g));
    for (const t of texte) {
      expect(t.trim().length).toBeGreaterThan(0);
      expect(t).not.toContain('!');
      expect(t).not.toMatch(/\b(Sie|Ihre?|Ihnen)\b/);
      expect(t).not.toContain('ß');
      expect(t).toContain('von Hand');
    }
    expect(new Set(texte).size).toBe(GRUENDE.length);
  });
});
