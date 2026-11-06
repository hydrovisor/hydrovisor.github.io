// Termine einer Phase und Phasenstand eines Satzes (Plan 35 Testliste; R1.5, UC6-AK1, TZ5 bis TZ7, A4, A9).
// Injizierte Uhr, Zeitzone Europe/Zurich; Fixture tests/fixtures/phasen.ts.
//
// Verträge (Plan 35 «Domänenfunktionen», vom Testentwickler ergänzt, wo der Plan offen ist):
//   src/domain/phasen/termine.ts
//     phasenTermine(beginn, dauer: { min?; typ?; max? })
//       : { fruehestens?: b + min; typisch?: b + typ; spaetestens?: b + max; pruefenAb?: b + max + 1 } (ISO-Tage)
//     phasenText(tagInPhase, dauer): «Tag y von min–max» (Halbgeviertstrich), bei min = max «Tag y von n», ohne
//       min und max «Tag y»
//     fragetag({ typisch?, letzteAufschiebung? }): typischer Tag, nach «Noch nicht»/«Problem» am Tag a frühestens
//       a + 2 (der spätere der beiden); ohne typisch undefined
//   src/domain/phasen/fragen.ts
//     phasenStand(teile, satzId, jetzt, zeitzone, neu?: Vorgang): PhasenStand | undefined mit
//       { satzId, phase, beginn, tagSeitSaat, tagInPhase, text, naechste?: { phase, fruehestens?, typisch?,
//         spaetestens? }, wechselAb?, wechselMoeglich, frageAm?, pruefen, wechselmerkmal?, problemAm?,
//         dauerFehlt: boolean }
//       dauerFehlt (Ergänzung zum Plan, A9): true, wenn die laufende Phase einen Wechsel hat, aber keine typische Dauer.
//       problemAm: Tag der jüngsten Antwort «Problem» für den laufenden Übergang.
//     phasenKarten(teile, jetzt, zeitzone, phasenlogikAb) (Form siehe phasen-fragen.test.ts)
//     antwortVorgang(teile, antworten, ids, jetzt, zeitzone, phasenlogikAb): Vorgang
//   src/domain/zeit.ts: mittag(tag, zeitzone): Date (12:00 des Kalendertags in der Zeitzone)
// Die Domäne filtert typ und Storno der Ereignisse selbst (wie keimung.ts), auch wenn der Bündelteil das schon tut.
import { describe, expect, it } from 'vitest';
import type { Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { antwortVorgang, phasenKarten, phasenStand } from '../../src/domain/phasen/fragen.ts';
import { fragetag, phasenTermine, phasenText } from '../../src/domain/phasen/termine.ts';
import { mittag, ZEITZONE } from '../../src/domain/zeit.ts';
import {
  antwortDazu,
  dauerSetzen,
  phasenNachrechnen,
  phasenSatz,
  phasenTeile,
  satzId,
  SORTE,
} from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';
import { phasenVorgangAnwenden } from '../fixtures/sichten.ts';

const AB = '2026-12-01';
/** 09:00 Zürich im Winter */
const um = (tag: string) => new Date(`${tag}T08:00:00Z`);
const zaehler = () => {
  let n = 0;
  return () => `3a000000-0000-4000-8000-${String((n += 1)).padStart(12, '0')}`;
};

/** TZ5: Lollo Rossa (Kopf), gesät und erfasst 1.1.2027 in A1, Keimung 4/6/8 */
function tz5(jetzt: Date, saat = '2027-01-01'): Teile {
  const t = phasenTeile(jetzt);
  dauerSetzen(t, SORTE.lollo, 'keimung', [4, 6, 8]);
  phasenSatz(t, { nr: 72, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: saat });
  return phasenNachrechnen(t);
}
const S72 = satzId(72);

/** Zeilen der fälligen Phasenfragen für einen Satz */
const fragezeilen = (t: Teile, jetzt: Date, satz: string) =>
  phasenKarten(t, jetzt, ZEITZONE, AB)
    .fragen.flatMap((k) => k.zeilen)
    .filter((z) => z.satzId === satz);

describe('R1.5 Termine einer Phase', () => {
  it('TZ5 Keimung 4/6/8 ab 1.1.: 4.1. kein Wechsel, 5.1. möglich, 7.1. Frage, 9.1. kein Hinweis, 10.1. «prüfen»', () => {
    expect(phasenTermine('2027-01-01', { min: 4, typ: 6, max: 8 })).toEqual({
      fruehestens: '2027-01-05',
      typisch: '2027-01-07',
      spaetestens: '2027-01-09',
      pruefenAb: '2027-01-10',
    });
    const stand = (tag: string) => phasenStand(tz5(um(tag)), S72, um(tag), ZEITZONE);
    expect(stand('2027-01-04')).toMatchObject({
      phase: 'keimung',
      wechselMoeglich: false,
      wechselAb: '2027-01-05',
    });
    expect(stand('2027-01-05')).toMatchObject({ wechselMoeglich: true, pruefen: false });
    expect(stand('2027-01-07')).toMatchObject({ frageAm: '2027-01-07', pruefen: false });
    expect(stand('2027-01-09')?.pruefen).toBe(false);
    expect(stand('2027-01-10')?.pruefen).toBe(true);
    // Frage in Heute erst ab dem typischen Tag
    expect(fragezeilen(tz5(um('2027-01-06')), um('2027-01-06'), S72)).toEqual([]);
    expect(fragezeilen(tz5(um('2027-01-07')), um('2027-01-07'), S72)).toHaveLength(1);
  });

  it('UC6-AK1 Saat 1.1., Keimung 4–8 typ 6: am 6.1. «Tag 5 von 4–8», am 7.1. Frage, am 10.1. ohne Bestätigung «prüfen»', () => {
    const am6 = phasenStand(tz5(um('2027-01-06')), S72, um('2027-01-06'), ZEITZONE);
    expect(am6).toMatchObject({
      satzId: S72,
      phase: 'keimung',
      beginn: '2027-01-01',
      tagSeitSaat: 5,
      tagInPhase: 5,
      text: 'Tag 5 von 4–8',
      pruefen: false,
      naechste: {
        phase: 'anzucht',
        fruehestens: '2027-01-05',
        typisch: '2027-01-07',
        spaetestens: '2027-01-09',
      },
    });
    const [frage] = fragezeilen(tz5(um('2027-01-07')), um('2027-01-07'), S72);
    expect(frage).toMatchObject({
      satzId: S72,
      text: 'Tag 6 von 4–8',
      pruefen: false,
      faelligAm: '2027-01-07',
    });
    const am10 = tz5(um('2027-01-10'));
    expect(phasenStand(am10, S72, um('2027-01-10'), ZEITZONE)).toMatchObject({
      phase: 'keimung',
      text: 'Tag 9 von 4–8',
      pruefen: true,
    });
    expect(fragezeilen(am10, um('2027-01-10'), S72)[0]?.pruefen).toBe(true);
  });

  it('TZ6 «Noch nicht» am 7.1. → Frage am 9.1., nicht am 8.1.', () => {
    expect(fragetag({ typisch: '2027-01-07', letzteAufschiebung: '2027-01-07' })).toBe('2027-01-09');
    expect(fragetag({ typisch: '2027-01-07' })).toBe('2027-01-07');
    expect(fragetag({})).toBeUndefined();

    const jetzt = new Date('2027-01-07T15:00:00Z');
    const t = tz5(jetzt);
    const vorgang = antwortVorgang(
      t,
      [{ satzId: S72, antwort: 'noch_nicht' }],
      zaehler(),
      jetzt,
      ZEITZONE,
      AB,
    );
    expect(vorgang).toHaveLength(1);
    // A8: der eben geschriebene Vorgang zählt sofort, auch ohne neues Bündel
    expect(phasenStand(t, S72, um('2027-01-08'), ZEITZONE, vorgang)).toMatchObject({
      phase: 'keimung',
      frageAm: '2027-01-09',
    });
    const danach = phasenVorgangAnwenden(t, vorgang, jetzt);
    expect(phasenStand(danach, S72, um('2027-01-08'), ZEITZONE)?.frageAm).toBe('2027-01-09');
    expect(fragezeilen(danach, um('2027-01-08'), S72)).toEqual([]);
    expect(fragezeilen(danach, um('2027-01-09'), S72)).toHaveLength(1);
  });

  it('TZ7 Anzucht 21/25/28 ab 7.1.: frühestens 28.1., Frage 1.2., Hinweis ab 5.2.', () => {
    expect(phasenTermine('2027-01-07', { min: 21, typ: 25, max: 28 })).toEqual({
      fruehestens: '2027-01-28',
      typisch: '2027-02-01',
      spaetestens: '2027-02-04',
      pruefenAb: '2027-02-05',
    });
    // Ochsenherz (Anzucht 21/25/28), Anzucht bestätigt am 7.1.
    const teile = (jetzt: Date) => {
      const t = phasenTeile(jetzt);
      phasenSatz(t, {
        nr: 73,
        sorteId: SORTE.ochsenherz,
        kulturform: 'dauerkultur_frucht',
        saatdatum: '2026-12-30',
      });
      antwortDazu(t, { nr: 73, phase: 'anzucht', tag: '2027-01-07', erwartetAm: '2027-01-06' });
      return phasenNachrechnen(t);
    };
    const stand = (tag: string) => phasenStand(teile(um(tag)), satzId(73), um(tag), ZEITZONE);
    expect(stand('2027-01-27')).toMatchObject({
      phase: 'anzucht',
      beginn: '2027-01-07',
      wechselMoeglich: false,
    });
    expect(stand('2027-01-28')).toMatchObject({
      wechselMoeglich: true,
      frageAm: '2027-02-01',
      naechste: {
        phase: 'wachstum',
        fruehestens: '2027-01-28',
        typisch: '2027-02-01',
        spaetestens: '2027-02-04',
      },
    });
    expect(stand('2027-02-04')?.pruefen).toBe(false);
    expect(stand('2027-02-05')?.pruefen).toBe(true);
  });

  it('TZ5 Sommerzeit: Phase über den 28.3.2027 ohne verschobenen Fragetag', () => {
    const t = (jetzt: Date) => tz5(jetzt, '2027-03-25');
    // 31.3. 08:00 Sommerzeit: Tag 6, Frage am 31.3.
    const morgen = new Date('2027-03-31T06:00:00Z');
    expect(phasenStand(t(morgen), S72, morgen, ZEITZONE)).toMatchObject({
      tagInPhase: 6,
      text: 'Tag 6 von 4–8',
      frageAm: '2027-03-31',
    });
    // 31.3. 00:30 Zürich ist schon der 31.3., 30.3. 23:30 Zürich noch der 30.3.
    const frueh = new Date('2027-03-30T22:30:00Z');
    expect(phasenStand(t(frueh), S72, frueh, ZEITZONE)?.tagInPhase).toBe(6);
    expect(fragezeilen(t(frueh), frueh, S72)).toHaveLength(1);
    const spaet = new Date('2027-03-30T21:30:00Z');
    expect(phasenStand(t(spaet), S72, spaet, ZEITZONE)?.tagInPhase).toBe(5);
    expect(fragezeilen(t(spaet), spaet, S72)).toEqual([]);
  });

  it('R1.5 Text bei min = max «Tag 3 von 4», ohne Dauer «Tag 3»', () => {
    expect(phasenText(3, { min: 4, typ: 4, max: 4 })).toBe('Tag 3 von 4');
    expect(phasenText(3, {})).toBe('Tag 3');
    expect(phasenText(12, { min: 10, typ: 12, max: 14 })).toBe('Tag 12 von 10–14');
  });

  it('R1.5 ohne typische Dauer keine Frage, Phase wechseln ab min möglich, «Dauer fehlt»', () => {
    const teile = (jetzt: Date) => {
      const t = phasenTeile(jetzt);
      dauerSetzen(t, SORTE.lollo, 'keimung', [4, null, 8]);
      phasenSatz(t, { nr: 74, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-01' });
      return phasenNachrechnen(t);
    };
    const am4 = phasenStand(teile(um('2027-01-04')), satzId(74), um('2027-01-04'), ZEITZONE);
    expect(am4).toMatchObject({ wechselMoeglich: false, wechselAb: '2027-01-05', dauerFehlt: true });
    expect(am4?.frageAm).toBeUndefined();
    const am7 = teile(um('2027-01-07'));
    expect(phasenStand(am7, satzId(74), um('2027-01-07'), ZEITZONE)).toMatchObject({
      wechselMoeglich: true,
      dauerFehlt: true,
    });
    expect(phasenStand(am7, satzId(74), um('2027-01-07'), ZEITZONE)?.frageAm).toBeUndefined();
    expect(fragezeilen(am7, um('2027-01-07'), satzId(74))).toEqual([]);

    // ohne jede Dauer: sofort möglich, Text «Tag y»
    const ohne = phasenTeile(um('2027-01-03'));
    dauerSetzen(ohne, SORTE.lollo, 'keimung', [null, null, null]);
    phasenSatz(ohne, { nr: 75, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-01' });
    expect(phasenStand(phasenNachrechnen(ohne), satzId(75), um('2027-01-03'), ZEITZONE)).toMatchObject({
      text: 'Tag 2',
      wechselMoeglich: true,
      dauerFehlt: true,
    });
    // mit Dauer: dauerFehlt false
    expect(phasenStand(tz5(um('2027-01-03')), S72, um('2027-01-03'), ZEITZONE)?.dauerFehlt).toBe(false);
  });

  it('R1.5 «Problem» am 7.1. → Frage am 9.1. mit Hinweis «Problem gemeldet am 7.1.»', () => {
    const jetzt = new Date('2027-01-07T15:00:00Z');
    const t = tz5(jetzt);
    const vorgang: Vorgang = antwortVorgang(
      t,
      [{ satzId: S72, antwort: 'problem' }],
      zaehler(),
      jetzt,
      ZEITZONE,
      AB,
    );
    expect(vorgang).toHaveLength(1);
    const danach = phasenVorgangAnwenden(t, vorgang, jetzt);
    expect(phasenStand(danach, S72, um('2027-01-08'), ZEITZONE)).toMatchObject({
      phase: 'keimung',
      frageAm: '2027-01-09',
      problemAm: '2027-01-07',
    });
    expect(fragezeilen(danach, um('2027-01-08'), S72)).toEqual([]);
    expect(fragezeilen(danach, um('2027-01-09'), S72)).toHaveLength(1);
    // ohne Problem kein Hinweis
    expect(phasenStand(tz5(um('2027-01-08')), S72, um('2027-01-08'), ZEITZONE)?.problemAm).toBeUndefined();
  });

  it('R1.5 «prüfen» bleibt nach «Noch nicht» über der Höchstdauer stehen', () => {
    const jetzt = new Date('2027-01-10T15:00:00Z');
    const t = tz5(jetzt);
    const vorgang = antwortVorgang(
      t,
      [{ satzId: S72, antwort: 'noch_nicht' }],
      zaehler(),
      jetzt,
      ZEITZONE,
      AB,
    );
    const danach = phasenVorgangAnwenden(t, vorgang, jetzt);
    expect(phasenStand(danach, S72, um('2027-01-11'), ZEITZONE)).toMatchObject({
      phase: 'keimung',
      pruefen: true,
      frageAm: '2027-01-12',
    });
  });

  it('R1.6 mittag(): 12:00 Zürich im Winter und im Sommer', () => {
    expect(mittag('2027-01-07', ZEITZONE).toISOString()).toBe('2027-01-07T11:00:00.000Z');
    expect(mittag('2027-04-01', ZEITZONE).toISOString()).toBe('2027-04-01T10:00:00.000Z');
  });
});
