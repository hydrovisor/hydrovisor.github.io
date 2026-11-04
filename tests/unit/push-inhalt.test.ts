// Inhalt der Sammel-Push (Plan 13 Schnittstellen `src/domain/push/inhalt.ts`; R5.5 Titel, R5.1 gleiche Liste,
// R5.4, G5): Übergangsliste aus Kalibrierstand und Messfälligkeit, nur Datenart echt.
// Vorausgesetzt:
// - tagesliste() ordnet «kalibrieren» zuerst, dann «messen» nach Code; Messen-Einträge tragen bezug = platz_id
//   und ort = Code, der Kalibrier-Eintrag bezug = messgeraet.id.
// - Kalibrieren zählt bei Stand «faellig», «ueberfaellig» und «erstkalibrierung», nicht bei «gueltig».
// - pushText: titel «Hydrovisor heute: n Routine» bzw. «Hydrovisor heute: nichts fällig»; die erste Zeile von text
//   «Kalibrieren · Messen R-2.3, R-3.1» (Plan 13 Schnittstellen).
import { describe, expect, it } from 'vitest';
import type { Buendel } from '../../src/domain/datenpfad/buendel.ts';
import { kalibrierStand } from '../../src/domain/kalibrierung/stand.ts';
import { messFaelligkeit } from '../../src/domain/messung/faelligkeit.ts';
import { messbareOrte } from '../../src/domain/ort.ts';
import { pushText, tagesliste } from '../../src/domain/push/inhalt.ts';
import { kalibrierdaten, messgeraet, messungenIm, zustandVon } from '../../src/ui/bundeldaten.ts';
import { MESSGERAET_ID, STICHTAG, TEILE_DREI_ROUTINE, ZONE, platzId, teileFuer } from './push-fixture.ts';

const kurz = (eintraege: readonly { typ: string; ort?: string }[]) =>
  eintraege.map((e) => (e.typ === 'messen' ? `messen ${e.ort ?? '?'}` : e.typ));

describe('tagesliste und pushText', () => {
  it('R5.5 Kalibrierung fällig und zwei Orte fällig: «Hydrovisor heute: 3 Routine»', () => {
    const liste = tagesliste(TEILE_DREI_ROUTINE, STICHTAG, ZONE);
    expect(kurz(liste)).toEqual(['kalibrieren', 'messen R-2.3', 'messen R-3.1']);
    expect(liste[0]?.bezug).toBe(MESSGERAET_ID);
    expect(liste[1]?.bezug).toBe(platzId('R-2.3'));
    expect(liste[2]?.faelligAm).toBe('2027-01-20');
    const text = pushText(liste);
    expect(text.titel).toBe('Hydrovisor heute: 3 Routine');
    expect(text.anzahl).toBe(3);
    expect(text.text.split('\n')[0]).toBe('Kalibrieren · Messen R-2.3, R-3.1');
  });

  it('R5.5 nichts fällig: «Hydrovisor heute: nichts fällig»', () => {
    const teile = teileFuer({
      echtKalibriert: '2027-01-10T10:00:00.000Z',
      orte: [{ anlage: 'R', kennung: '2.3', letzteMessung: '2027-01-19T08:00:00.000Z' }],
    });
    const liste = tagesliste(teile, STICHTAG, ZONE);
    expect(liste).toEqual([]);
    const text = pushText(liste);
    expect(text.titel).toBe('Hydrovisor heute: nichts fällig');
    expect(text.anzahl).toBe(0);
  });

  it('R5.5 Erstkalibrierung zählt als Kalibrieren', () => {
    const teile = teileFuer({ echtKalibriert: null, orte: [] });
    const liste = tagesliste(teile, STICHTAG, ZONE);
    expect(kurz(liste)).toEqual(['kalibrieren']);
    expect(pushText(liste).titel).toBe('Hydrovisor heute: 1 Routine');
  });

  it('R5.5 ohne Messgerät kein Kalibrier-Eintrag', () => {
    const teile = teileFuer({
      echtKalibriert: null,
      ohneMessgeraet: true,
      orte: [{ anlage: 'R', kennung: '2.3' }],
    });
    expect(kurz(tagesliste(teile, STICHTAG, ZONE))).toEqual(['messen R-2.3']);
  });

  it('G5 Demo-Kalibrierung und Demo-Ort zählen nicht', () => {
    const teile = teileFuer({
      // echt gültig bis 9.2.; die alte Demo-Kalibrierung wäre überfällig
      echtKalibriert: '2027-01-10T10:00:00.000Z',
      demoKalibriert: '2026-11-01T10:00:00.000Z',
      orte: [
        { anlage: 'D', kennung: '2.3', letzteMessung: '2027-01-10T08:00:00.000Z' },
        { anlage: 'D', kennung: '3.1' },
      ],
    });
    const liste = tagesliste(teile, STICHTAG, ZONE);
    expect(liste).toEqual([]);
    expect(pushText(liste).titel).toBe('Hydrovisor heute: nichts fällig');
  });

  it('R5.4 leeres Gefäss zählt nicht', () => {
    const teile = teileFuer({
      echtKalibriert: '2027-01-10T10:00:00.000Z',
      orte: [
        { anlage: 'R', kennung: '2.3', leer: true, letzteMessung: '2027-01-01T08:00:00.000Z' },
        { anlage: 'R', kennung: '3.1', letzteMessung: '2027-01-17T08:00:00.000Z' },
        { anlage: 'R', kennung: 'W', messstelle: true },
      ],
    });
    expect(kurz(tagesliste(teile, STICHTAG, ZONE))).toEqual(['messen R-3.1']);
  });

  it('R5.1 tagesliste stimmt mit Kalibrierzeile und Ortsliste in Heute überein (gleiches Bündel, gleicher Stichtag)', () => {
    const buendel: Buendel = {
      id: 'aktuell',
      format: 1,
      stand: '2027-01-20T05:30:00.000Z',
      appVersion: '0.0.0+test',
      nutzerId: '00000000-0000-4000-8000-0000000000e2',
      teile: TEILE_DREI_ROUTINE,
    };
    for (const stichtag of [
      STICHTAG,
      new Date('2027-01-21T06:00:00.000Z'),
      new Date('2027-02-25T06:00:00.000Z'),
    ]) {
      // wie Heute (Uebersicht): Kalibrierstand des ersten Messgeräts mit Datenart echt …
      const geraet = messgeraet(buendel);
      const erwartet: string[] = [];
      if (geraet) {
        const stand = kalibrierStand(
          kalibrierdaten(buendel),
          { messgeraetId: geraet.id, datenart: 'echt' },
          stichtag,
          ZONE,
        );
        if (stand.art !== 'gueltig') erwartet.push('kalibrieren');
      }
      // … und die Orte mit Messfälligkeit, beschränkt auf echte Anlagen (G5)
      for (const o of messbareOrte(buendel.teile)) {
        if (o.datenart !== 'echt') continue;
        const f = messFaelligkeit(
          {
            platzId: o.platzId,
            intervallMessenD: o.intervallMessenD ?? null,
            ...zustandVon(buendel, o.platzId),
          },
          messungenIm(buendel),
          stichtag,
          ZONE,
        );
        if (f.art === 'offen' && f.faellig) erwartet.push(`messen ${o.code}`);
      }
      expect(kurz(tagesliste(buendel.teile, stichtag, ZONE)), stichtag.toISOString()).toEqual(erwartet);
    }
  });
});
