// Anlage, Regalbild, Kürzel, Gruppierung und Maske «Gefäss» (Plan 20 Testliste; UC1). Injizierte Uhr, Teile des
// Bündels in der Form von PostgREST aus tests/fixtures/regal.ts.
import { describe, expect, it } from 'vitest';
import {
  anlagePruefen,
  anlageVorgang,
  STANDARD_BEREICHE,
  type AnlageEingabe,
} from '../../src/domain/anlage/anlegen.ts';
import { gefaessAnsicht } from '../../src/domain/anlage/gefaess.ts';
import { heuteGruppiert, nachAnlage } from '../../src/domain/anlage/gruppen.ts';
import { kuerzelAenderbar } from '../../src/domain/anlage/kuerzel.ts';
import { fuellText, regalbild } from '../../src/domain/anlage/uebersicht.ts';
import { messbareOrte } from '../../src/domain/ort.ts';
import { ANLAGE_R, platzId, regalTeile, vereinen, weitereAnlage } from '../fixtures/regal.ts';

const JETZT = new Date('2026-12-10T08:00:00Z');
const Z = 'Europe/Zurich';

describe('Regalbild', () => {
  const bild = regalbild(regalTeile(JETZT), ANLAGE_R, JETZT, Z);

  it('UC1-AK1 Zeilen von oben nach unten: Ebene 4 in drei Gruppen, dann Ebenen 3 bis 1', () => {
    expect(bild.map((z) => z.titel)).toEqual([
      'Keimung',
      'Jungpflanzen',
      'Halbbox',
      'Ebene 3',
      'Ebene 2',
      'Ebene 1',
    ]);
    expect(bild.map((z) => z.orte.map((o) => o.kennung))).toEqual([
      ['A1', 'A2', 'A3', 'A4'],
      ['4.2', '4.3', '4.4', '4.5'],
      ['4.1', 'W'],
      ['3.1', '3.2', '3.3'],
      ['2.1', '2.2', '2.3'],
      ['1.1', '1.2'],
    ]);
  });

  it('UC1-AK1 13 Gefässe, 4 Anzuchtboxen und W; höchstens 4 Kacheln je Zeile', () => {
    const orte = bild.flatMap((z) => z.orte);
    expect(orte.filter((o) => o.rolle === 'gefaess')).toHaveLength(13);
    expect(orte.filter((o) => o.rolle === 'anzuchtort')).toHaveLength(4);
    expect(orte.filter((o) => o.rolle === 'messstelle').map((o) => o.code)).toEqual(['R-W']);
    expect(Math.max(...bild.map((z) => z.orte.length))).toBeLessThanOrEqual(4);
  });

  it('UC1-AK4 Kacheltexte und Badges mit Wort: Füllzustand, nicht geprüft, ruht', () => {
    const ort = (k: string) => bild.flatMap((z) => z.orte).find((o) => o.kennung === k);
    expect(ort('2.3')?.zeilen).toEqual(['Lösung 12/14 Tage']);
    expect(ort('2.1')?.zeilen).toEqual(['leer · bereit']);
    expect(ort('3.3')?.badge).toBe('nicht geprüft');
    expect(ort('1.2')?.badge).toBe('ruht');
    expect(ort('2.3')?.badge).toBeUndefined();
    expect(ort('A3')?.zeilen).toEqual(['Anzucht dunkel']);
    expect(ort('W')?.ziel).toBe('messen');
    expect(ort('2.3')?.ziel).toBe('gefaess');
  });

  it('Füllzustand: Kratky ohne Wechselintervall zeigt nur das Alter, leer «leer · bereit»', () => {
    const fuell = { fuellzustand: 'loesung', letzter_ansatz: '2026-12-09T08:00:00Z' };
    expect(fuellText(fuell, null, JETZT, Z)).toBe('Lösung 1 Tag');
    expect(fuellText(fuell, 14, JETZT, Z)).toBe('Lösung 1/14 Tage');
    expect(fuellText(undefined, 14, JETZT, Z)).toBe('leer · bereit');
  });

  it('eine Anlage ohne Bereiche zeigt ihre Orte in der Zeile «ohne Ebene»', () => {
    const t = weitereAnlage('T', 'echt');
    const id = (t['anlage']?.[0] as { id: string }).id;
    expect(regalbild(t, id, JETZT, Z).map((z) => [z.titel, z.orte.map((o) => o.code)])).toEqual([
      ['ohne Ebene', ['T-2.3', 'T-W']],
    ]);
  });
});

describe('Anlage anlegen', () => {
  const eingabe: AnlageEingabe = {
    name: 'Zweites Regal',
    kuerzel: 'T',
    standort: 'indoor',
    lichtVon: '06:00',
    lichtBis: '21:00',
    luefter: '',
    bereiche: [...STANDARD_BEREICHE],
  };

  it('UC1-AK5 Kürzel eindeutig unter den nicht stornierten Anlagen, Muster 1 bis 3 Grossbuchstaben', () => {
    const teile = regalTeile(JETZT);
    expect(anlagePruefen(eingabe, teile)).toEqual([]);
    expect(anlagePruefen({ ...eingabe, kuerzel: 'R' }, teile).map((f) => f.feld)).toEqual(['kuerzel']);
    expect(anlagePruefen({ ...eingabe, kuerzel: 'r2' }, teile).map((f) => f.feld)).toEqual(['kuerzel']);
    expect(anlagePruefen({ ...eingabe, kuerzel: 'ABCD' }, teile).map((f) => f.feld)).toEqual(['kuerzel']);
    expect(anlagePruefen({ ...eingabe, name: ' ' }, teile).map((f) => f.feld)).toEqual(['name']);
    expect(anlagePruefen({ ...eingabe, lichtVon: '6 Uhr' }, teile).map((f) => f.feld)).toEqual(['licht']);
    expect(anlagePruefen({ ...eingabe, bereiche: [] }, teile).map((f) => f.feld)).toEqual(['bereiche']);
  });

  it('UC1-AK5 Vorgang: zuerst die Anlage (echt, eigene id), dann die Bereiche mit Standardwerten', () => {
    let n = 0;
    const schritte = anlageVorgang(eingabe, () => `id-${++n}`);
    expect(schritte.map((s) => s.tabelle)).toEqual(['anlage', 'bereich', 'bereich', 'bereich', 'bereich']);
    const anlage = schritte[0];
    expect(anlage?.art === 'neu' && anlage.felder).toMatchObject({
      id: 'id-1',
      kuerzel: 'T',
      datenart: 'echt',
    });
    const bereiche = schritte
      .slice(1)
      .map((s) => (s.art === 'neu' ? s.felder : ({} as Record<string, unknown>)));
    expect(bereiche.map((b) => b['anlage_id'])).toEqual(['id-1', 'id-1', 'id-1', 'id-1']);
    expect(bereiche.map((b) => b['standard_betriebsart'])).toEqual([
      'dwc',
      'dwc',
      'kratky_belueftet',
      'konstantpegel',
    ]);
    expect(bereiche.map((b) => b['nutzbare_hoehe_mm'])).toEqual([450, 200, 150, 150]);
    expect(new Set(schritte.map((s) => (s.art === 'neu' ? s.felder.client_id : ''))).size).toBe(5);
  });
});

describe('Kürzel', () => {
  it('UC1-AK6 Kürzel nach dem ersten Etikettendruck nicht mehr änderbar', () => {
    const teile = regalTeile(JETZT);
    expect(kuerzelAenderbar(teile, ANLAGE_R)).toBe(true);
    teile['etikett'] = [{ platz_id: platzId('2.3'), code: 'R-2.3', gedruckt_am: null, storniert_am: null }];
    expect(kuerzelAenderbar(teile, ANLAGE_R)).toBe(true);
    teile['etikett'] = [
      { platz_id: platzId('2.3'), code: 'R-2.3', gedruckt_am: '2026-12-01T10:00:00Z', storniert_am: null },
    ];
    expect(kuerzelAenderbar(teile, ANLAGE_R)).toBe(false);
  });

  it('UC1-AK6 ein storniertes gedrucktes Etikett zählt nicht; Etiketten anderer Anlagen zählen nicht', () => {
    const teile = vereinen(regalTeile(JETZT), weitereAnlage('T', 'echt'));
    const tId = (teile['anlage']?.[1] as { id: string }).id;
    teile['etikett'] = [
      { platz_id: platzId('2.3'), gedruckt_am: '2026-12-01T10:00:00Z', storniert_am: '2026-12-02T10:00:00Z' },
    ];
    expect(kuerzelAenderbar(teile, ANLAGE_R)).toBe(true);
    teile['etikett'] = [
      { platz_id: platzId('2.3'), gedruckt_am: '2026-12-01T10:00:00Z', storniert_am: null },
    ];
    expect(kuerzelAenderbar(teile, tId)).toBe(true);
    expect(kuerzelAenderbar(teile, ANLAGE_R)).toBe(false);
  });
});

describe('Gruppierung in Heute', () => {
  it('UC1-AK5 eine echte Anlage mit Demo X und Test Y: keine Gruppierung', () => {
    const teile = vereinen(regalTeile(JETZT), weitereAnlage('X', 'demo'), weitereAnlage('Y', 'test'));
    expect(heuteGruppiert(teile)).toBe(false);
  });

  it('UC1-AK5 zwei echte Anlagen: Gruppen je Anlage, echte zuerst nach Kürzel, dann Demo', () => {
    const teile = vereinen(weitereAnlage('X', 'demo'), weitereAnlage('T', 'echt'), regalTeile(JETZT));
    expect(heuteGruppiert(teile)).toBe(true);
    const gruppen = nachAnlage(teile, messbareOrte(teile));
    expect(gruppen.map((g) => g.anlage.kuerzel)).toEqual(['R', 'T', 'X']);
    expect(gruppen[1]?.orte.map((o) => o.code)).toEqual(['T-2.3', 'T-W']);
  });
});

describe('Maske «Gefäss»', () => {
  const a = gefaessAnsicht(regalTeile(JETZT), 'R-2.3', JETZT, Z);

  it('UC1-AK2 Kopf und Zustand: Kennung wie auf dem Etikett, Betriebsart, Volumen, Lösung, Zielbereich', () => {
    expect(a?.kennung).toBe('2.3');
    expect(a?.kuerzel).toBe('R');
    expect(a?.merkmale).toBe('DWC · 9 l');
    expect(a?.loesung).toBe('Lösung 12/14 Tage');
    expect(a?.zielbereich).toEqual({ ph: '5.8–6.3', ec: '1.0–1.4', temp: '18–22', quelle: 'Ansatz' });
  });

  it('UC1-AK2 letzte Messung mit Bewertung und Trend, Pflanzdauer und Phase, Dosis je Komponente', () => {
    expect(a?.letzteMessung).toMatchObject({
      werte: 'pH 6.40 · EC 1.45 · 20.5 °C',
      ton: 'warn',
      unsicher: false,
      trend: 'vorher pH 6.20 · EC 1.32',
    });
    expect(a?.pflanzen).toEqual([{ sorte: 'Lollo Rossa', anzahl: 3, phase: 'Wachstum', seitTagen: 30 }]);
    expect(a?.dosis).toEqual([
      { komponente: 'Grow', mlProL: '2.33' },
      { komponente: 'Micro', mlProL: '1.56' },
      { komponente: 'Bloom', mlProL: '0.78' },
    ]);
  });

  it('UC1-AK2 Hauptknopf nach der Messfälligkeit (A4); Verlauf neueste zuerst mit Marker «Ansatz»', () => {
    expect(a?.hauptknopf).toEqual({ text: 'Messen', code: 'R-2.3' });
    const spaeter = new Date('2026-12-12T08:00:00Z');
    expect(gefaessAnsicht(regalTeile(JETZT), 'R-2.3', spaeter, Z)?.hauptknopf?.text).toBe('Jetzt: Messen');
    expect(a?.verlauf.map((v) => [v.ph, v.marker])).toEqual([
      ['6.40', []],
      ['6.20', []],
      ['6.00', []],
      ['–', ['Ansatz']],
    ]);
  });

  it('UC1-AK4 Kennzeichen «unsicher» an Messung und Verlauf; Prüfstatus als Wort', () => {
    const teile = regalTeile(JETZT);
    const letzte = (teile['messung'] as { id: string }[])[2];
    teile['v_messung_unsicher'] = [{ messung_id: letzte?.id }];
    const u = gefaessAnsicht(teile, 'R-2.3', JETZT, Z);
    expect(u?.letzteMessung?.unsicher).toBe(true);
    expect(u?.verlauf[0]?.marker).toEqual(['unsicher']);
    expect(gefaessAnsicht(teile, 'R-3.3', JETZT, Z)?.pruefstatus).toBe('nicht geprüft');
  });

  it('ohne Ansatz: Zielbereich aus der letzten Messung, sonst keiner; ohne Dosis', () => {
    const teile = regalTeile(JETZT);
    teile['naehrloesungsansatz'] = [];
    expect(gefaessAnsicht(teile, 'R-2.3', JETZT, Z)?.zielbereich).toBeUndefined();
    const erste = (teile['messung'] as Record<string, unknown>[])[0] ?? {};
    erste['schnappschuss'] = {
      zielbereich: { ph_min: 6, ph_max: 6.5, ec_min: 0.8, ec_max: 1.2, temp_min: 18, temp_max: 24 },
    };
    const m = gefaessAnsicht(teile, 'R-2.3', JETZT, Z);
    expect(m?.zielbereich).toEqual({ ph: '6.0–6.5', ec: '0.8–1.2', temp: '18–24', quelle: 'Messung' });
    expect(m?.dosis).toEqual([]);
  });

  it('Anzuchtbox ohne Messen-Knopf (A6), W mit Messen, unbekannter Code undefined', () => {
    expect(gefaessAnsicht(regalTeile(JETZT), 'R-A1', JETZT, Z)?.hauptknopf).toBeUndefined();
    expect(gefaessAnsicht(regalTeile(JETZT), 'R-W', JETZT, Z)?.hauptknopf).toEqual({
      text: 'Messen',
      code: 'R-W',
    });
    expect(gefaessAnsicht(regalTeile(JETZT), 'R-9.9', JETZT, Z)).toBeUndefined();
  });
});
