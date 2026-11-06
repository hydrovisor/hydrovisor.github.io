// Grenzfälle aus Runde 1 und 2 der Prüfung von I2-03 (#35): Korrekturfenster, Korrektur am Tag des vorigen Ja ohne
// Rückfall, Rückgängig nach einer Korrektur, strenge Kette beim Nachführen, Gleichstand im gilt_ab (A8), fällige und
// nicht fällige Antworten (A10), Wissenskarte (A15), Ort nach Mehrheit und Anlagen-Kürzel (A12), mittag() an den
// Umstelltagen (TZ5), Verlauf mit noch nicht im Bündel enthaltenen Zeilen. Injizierte Uhr, Zeitzone Europe/Zurich;
// Fixtures aus tests/fixtures/phasen.ts, regal.ts und sichten.ts. Ohne Personendaten.
import { describe, expect, it } from 'vitest';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  antwortVorgang,
  korrekturGrenze,
  korrekturVorgang,
  nachfuehrVorgang,
  phasenKarten,
  phasenRueckgaengig,
  phasenStand,
  phasenVerlauf,
  wissenFuer,
} from '../../src/domain/phasen/fragen.ts';
import { kalendertag, mittag, ZEITZONE } from '../../src/domain/zeit.ts';
import {
  antwortDazu,
  BUENDEL_JETZT,
  buendelTeile,
  phasenNachrechnen,
  phasenSatz,
  phasenTeile,
  pflanzungVon,
  rueckdatiertTeile,
  satzId,
  SORTE,
} from '../fixtures/phasen.ts';
import { platzId, uid, weitereAnlage, type Teile } from '../fixtures/regal.ts';
import { phasenVorgangAnwenden } from '../fixtures/sichten.ts';

const AB_FRUEH = '2026-12-01';
const zaehler = () => {
  let n = 0;
  return () => `3a000000-0000-4000-8000-${String((n += 1)).padStart(12, '0')}`;
};
type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu');
const daten = (s: Neu | undefined) => (s?.felder['daten'] ?? {}) as Record<string, unknown>;

const JETZT = new Date('2027-01-22T09:00:00Z');
/** Satz 67 Lollo Rossa auf 4.4, gesät 7.1.: Anzucht Ja 11.1. (nachgeführt), Wachstum «Noch nicht» 19.1., Ja 21.1. */
function verlaufTeile(felder: Record<string, unknown> = {}): { t: Teile; anzucht: string; ja: string } {
  const t = phasenTeile(JETZT);
  phasenSatz(t, { nr: 67, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-07', platz: '4.4' });
  const anzucht = antwortDazu(t, {
    nr: 67,
    phase: 'anzucht',
    tag: '2027-01-11',
    erwartetAm: '2027-01-11',
    nachgefuehrt: true,
  });
  antwortDazu(t, {
    nr: 67,
    phase: 'wachstum',
    antwort: 'noch_nicht',
    tag: '2027-01-19',
    erwartetAm: '2027-01-23',
  });
  const ja = antwortDazu(t, { nr: 67, phase: 'wachstum', tag: '2027-01-21', erwartetAm: '2027-01-23' });
  const zeile = (t['ereignis'] ?? []).find((e) => e['id'] === ja);
  if (zeile) Object.assign(zeile, felder);
  return { t: phasenNachrechnen(t), anzucht, ja };
}

/** Satz 67 nur gesät (keine Antwort) bzw. mit einem einzigen Ja (Anzucht 11.1.) */
function einfachTeile(mitJa: boolean): Teile {
  const t = phasenTeile(JETZT);
  phasenSatz(t, { nr: 67, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-07', platz: '4.4' });
  if (mitJa) antwortDazu(t, { nr: 67, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
  return phasenNachrechnen(t);
}

describe('R1.5 Korrekturfenster korrekturGrenze()', () => {
  it('R1.5 ohne Ja kein Fenster (undefined), auch nicht für einen unbekannten Satz', () => {
    expect(korrekturGrenze(einfachTeile(false), satzId(67), JETZT, ZEITZONE)).toBeUndefined();
    expect(korrekturGrenze(einfachTeile(true), satzId(99), JETZT, ZEITZONE)).toBeUndefined();
    // ein «Noch nicht» allein ist kein Wechsel
    const t = phasenTeile(JETZT);
    phasenSatz(t, { nr: 67, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-07' });
    antwortDazu(t, { nr: 67, phase: 'anzucht', antwort: 'noch_nicht', tag: '2027-01-11' });
    expect(korrekturGrenze(phasenNachrechnen(t), satzId(67), JETZT, ZEITZONE)).toBeUndefined();
  });

  it('R1.5 ein Ja: von = Saatdatum, bis = heute, tag = Tag des Ja', () => {
    expect(korrekturGrenze(einfachTeile(true), satzId(67), JETZT, ZEITZONE)).toEqual({
      von: '2027-01-07',
      bis: '2027-01-22',
      tag: '2027-01-11',
    });
  });

  it('R1.5 zwei Ja: von = Tag des vorigen Ja, tag = Tag des letzten Ja; bis = heute in Zürich (TZ)', () => {
    const { t } = verlaufTeile();
    expect(korrekturGrenze(t, satzId(67), JETZT, ZEITZONE)).toEqual({
      von: '2027-01-11',
      bis: '2027-01-22',
      tag: '2027-01-21',
    });
    // 22.1. 23:30 UTC ist in Zürich schon der 23.1.
    expect(korrekturGrenze(t, satzId(67), new Date('2027-01-22T23:30:00Z'), ZEITZONE)?.bis).toBe(
      '2027-01-23',
    );
  });

  it('R1.5 Grenzwerte: von und bis sind erlaubt, ein Tag davor bzw. danach nicht', () => {
    const { t } = verlaufTeile();
    const k = (tag: string) => korrekturVorgang(t, satzId(67), tag, zaehler(), JETZT, ZEITZONE);
    expect(k('2027-01-11')).toHaveLength(2);
    expect(k('2027-01-10')).toEqual([]);
    expect(k('2027-01-22')).toHaveLength(2);
    expect(k('2027-01-23')).toEqual([]);
    // ein Ja: das Saatdatum ist die untere Grenze
    const e = einfachTeile(true);
    expect(korrekturVorgang(e, satzId(67), '2027-01-07', zaehler(), JETZT, ZEITZONE)).toHaveLength(2);
    expect(korrekturVorgang(e, satzId(67), '2027-01-06', zaehler(), JETZT, ZEITZONE)).toEqual([]);
    // ohne Ja keine Korrektur
    expect(
      korrekturVorgang(einfachTeile(false), satzId(67), '2027-01-10', zaehler(), JETZT, ZEITZONE),
    ).toEqual([]);
  });
});

describe('R1.5 Korrektur ohne Rückfall', () => {
  it('R1.5 Korrektur auf den Tag des vorigen Ja: gilt_ab mindestens 1 s danach, Phase bleibt die korrigierte', () => {
    const { t, anzucht } = verlaufTeile();
    const vorigesJa = (t['ereignis_satz'] ?? []).find((e) => e['id'] === anzucht);
    const v = korrekturVorgang(t, satzId(67), '2027-01-11', zaehler(), JETZT, ZEITZONE);
    expect(vorgangPruefen(v)).toEqual([]);
    const neu = neue(v)[0];
    const gilt = String(neu?.felder['gilt_ab']);
    expect(Date.parse(gilt) - Date.parse(String(vorigesJa?.['gilt_ab']))).toBeGreaterThanOrEqual(1000);
    // bleibt am gewählten Kalendertag
    expect(kalendertag(new Date(gilt), ZEITZONE)).toBe('2027-01-11');
    const danach = phasenVorgangAnwenden(t, v, JETZT);
    expect(phasenStand(danach, satzId(67), JETZT, ZEITZONE)).toMatchObject({
      phase: 'wachstum',
      beginn: '2027-01-11',
    });
    expect(
      (danach['v_pflanzung_zustand'] ?? []).find((z) => z['pflanzung_id'] === pflanzungVon(67))?.['phase'],
    ).toBe('wachstum');
  });

  it('R1.5 Korrektur auf einen späteren Tag: gilt_ab 12:00 Zürich ohne Verschiebung', () => {
    const { t } = verlaufTeile();
    const v = korrekturVorgang(t, satzId(67), '2027-01-12', zaehler(), JETZT, ZEITZONE);
    expect(neue(v)[0]?.felder['gilt_ab']).toBe('2027-01-12T11:00:00.000Z');
  });

  it('R1.5 Korrektur übernimmt war_faellig_am und aufgabe_schluessel der alten Zeile', () => {
    const schluessel = `phase_bestaetigen|${satzId(67)}|2027-01-21`;
    const { t } = verlaufTeile({ war_faellig_am: '2027-01-21', aufgabe_schluessel: schluessel });
    const neu = neue(korrekturVorgang(t, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE))[0];
    expect(neu?.felder['war_faellig_am']).toBe('2027-01-21');
    expect(neu?.felder['aufgabe_schluessel']).toBe(schluessel);
    // ohne diese Felder in der alten Zeile fehlen sie auch in der neuen
    const { t: ohne } = verlaufTeile();
    const neuOhne = neue(korrekturVorgang(ohne, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE))[0];
    expect(neuOhne?.felder).not.toHaveProperty('war_faellig_am');
    expect(neuOhne?.felder).not.toHaveProperty('aufgabe_schluessel');
  });
});

describe('U4 Rückgängig nach einer Korrektur', () => {
  it('U4 ohne die alte Zeile im Teile-Stand kein halbes Rückgängig: leerer Vorgang', () => {
    const { t } = verlaufTeile();
    const k = korrekturVorgang(t, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE);
    expect(k).toHaveLength(2);
    expect(phasenRueckgaengig(k, phasenTeile(JETZT))).toEqual([]);
    expect(phasenRueckgaengig(k, {})).toEqual([]);
  });

  it('U4 stellt die alte Zeile mit gilt_ab, daten, ersetzt_id, war_faellig_am, aufgabe_schluessel und neuer id her', () => {
    const vorher = uid('3e', 1);
    const schluessel = `phase_bestaetigen|${satzId(67)}|2027-01-21`;
    const { t, ja } = verlaufTeile({
      ersetzt_id: vorher,
      war_faellig_am: '2027-01-21',
      aufgabe_schluessel: schluessel,
    });
    const alt = (t['ereignis'] ?? []).find((e) => e['id'] === ja);
    const k = korrekturVorgang(t, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE);
    const nachK = phasenVorgangAnwenden(t, k, JETZT);
    const neuId = uid('3e', 99);
    const r = phasenRueckgaengig(k, nachK, () => neuId);
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({
      art: 'storno',
      tabelle: 'ereignis',
      clientId: neue(k)[0]?.felder.client_id,
      grund: 'rueckgaengig',
    });
    const [wieder] = neue(r);
    expect(wieder?.tabelle).toBe('ereignis');
    expect(wieder?.felder).toMatchObject({
      id: neuId,
      client_id: neuId,
      typ: 'phase_antwort',
      satz_id: satzId(67),
      gilt_ab: alt?.['gilt_ab'],
      ersetzt_id: vorher,
      war_faellig_am: '2027-01-21',
      aufgabe_schluessel: schluessel,
    });
    expect(daten(wieder)).toEqual(alt?.['daten']);
    expect(vorgangPruefen(r)).toEqual([]);
    const zurueck = phasenVorgangAnwenden(nachK, r, JETZT);
    expect(phasenStand(zurueck, satzId(67), JETZT, ZEITZONE)?.beginn).toBe('2027-01-21');
  });
});

describe('R1.6 strenge Kette beim Nachführen', () => {
  const jetzt = new Date('2027-01-20T08:00:00Z');
  const nach70 = (wechsel: { phase: 'anzucht' | 'wachstum'; am: string }[]) =>
    nachfuehrVorgang(
      rueckdatiertTeile(jetzt),
      [{ satzId: satzId(70), wechsel }],
      zaehler(),
      jetzt,
      ZEITZONE,
      AB_FRUEH,
    );

  it('R1.6 zwei Wechsel am selben Tag: leerer Vorgang', () => {
    expect(
      nach70([
        { phase: 'anzucht', am: '2027-01-05' },
        { phase: 'wachstum', am: '2027-01-05' },
      ]),
    ).toEqual([]);
  });

  it('R1.6 Wechsel 2 am Tag nach Wechsel 1 ist gültig', () => {
    const v = nach70([
      { phase: 'anzucht', am: '2027-01-05' },
      { phase: 'wachstum', am: '2027-01-06' },
    ]);
    expect(v).toHaveLength(2);
    expect(vorgangPruefen(v)).toEqual([]);
    expect(neue(v).map((s) => [daten(s)['phase'], s.felder['gilt_ab']])).toEqual([
      ['anzucht', '2027-01-05T11:00:00.000Z'],
      ['wachstum', '2027-01-06T11:00:00.000Z'],
    ]);
  });

  it('R1.6 ab Saatdatum (Phase keimung): erster Wechsel am Saatdatum erlaubt, davor nicht', () => {
    const v = nach70([{ phase: 'anzucht', am: '2027-01-01' }]);
    expect(v).toHaveLength(1);
    expect(neue(v)[0]?.felder['gilt_ab']).toBe('2027-01-01T11:00:00.000Z');
    expect(nach70([{ phase: 'anzucht', am: '2026-12-31' }])).toEqual([]);
  });

  it('R1.6 erster Wechsel am Tag eines bestehenden Ja: leerer Vorgang, am Folgetag gültig', () => {
    // Satz 61 Lollo Rossa in Anzucht seit 11.1. (Ja)
    const t = buendelTeile();
    const nach = (am: string) =>
      nachfuehrVorgang(
        t,
        [{ satzId: satzId(61), wechsel: [{ phase: 'wachstum', am }] }],
        zaehler(),
        BUENDEL_JETZT,
        ZEITZONE,
        AB_FRUEH,
      );
    expect(nach('2027-01-11')).toEqual([]);
    expect(nach('2027-01-10')).toEqual([]);
    expect(nach('2027-01-12')).toHaveLength(1);
  });
});

describe('R1.5 Gleichstand im gilt_ab (A8)', () => {
  const GILT = '2027-01-11T11:00:00.000Z';
  /** zwei Ja mit gleichem gilt_ab: Anzucht und Wachstum mit den gegebenen Feldern */
  function gleichstand(anzucht: Record<string, unknown>, wachstum: Record<string, unknown>): Teile {
    const t = phasenTeile(JETZT);
    phasenSatz(t, { nr: 67, sorteId: SORTE.lollo, kulturform: 'kopf', saatdatum: '2027-01-07' });
    const a = antwortDazu(t, { nr: 67, phase: 'anzucht', tag: '2027-01-11', id: String(anzucht['id']) });
    const w = antwortDazu(t, { nr: 67, phase: 'wachstum', tag: '2027-01-11', id: String(wachstum['id']) });
    for (const [id, felder] of [
      [a, anzucht],
      [w, wachstum],
    ] as const) {
      const zeile = (t['ereignis'] ?? []).find((e) => e['id'] === id);
      if (zeile) Object.assign(zeile, { gilt_ab: GILT }, felder);
    }
    // umgekehrte Reihenfolge im Bündel, damit die Domäne selbst sortieren muss
    const n = phasenNachrechnen(t);
    n['ereignis_satz'] = [...(n['ereignis_satz'] ?? [])].reverse();
    return n;
  }
  const phase = (t: Teile) => phasenStand(t, satzId(67), JETZT, ZEITZONE)?.phase;

  it('R1.5 A8 gleiches gilt_ab: das später erfasste Ja gilt (client_zeit)', () => {
    expect(
      phase(
        gleichstand(
          { id: uid('3e', 2), client_zeit: '2027-01-11T11:00:00.000Z' },
          { id: uid('3e', 1), client_zeit: '2027-01-11T11:05:00.000Z' },
        ),
      ),
    ).toBe('wachstum');
    expect(
      phase(
        gleichstand(
          { id: uid('3e', 1), client_zeit: '2027-01-11T11:05:00.000Z' },
          { id: uid('3e', 2), client_zeit: '2027-01-11T11:00:00.000Z' },
        ),
      ),
    ).toBe('anzucht');
  });

  it('R1.5 A8 gleiches gilt_ab ohne client_zeit: erfasst_am entscheidet', () => {
    expect(
      phase(
        gleichstand(
          { id: uid('3e', 2), client_zeit: null, erfasst_am: '2027-01-11T11:00:00.000Z' },
          { id: uid('3e', 1), client_zeit: null, erfasst_am: '2027-01-11T12:00:00.000Z' },
        ),
      ),
    ).toBe('wachstum');
    expect(
      phase(
        gleichstand(
          { id: uid('3e', 1), client_zeit: null, erfasst_am: '2027-01-11T12:00:00.000Z' },
          { id: uid('3e', 2), client_zeit: null, erfasst_am: '2027-01-11T11:00:00.000Z' },
        ),
      ),
    ).toBe('anzucht');
  });

  it('R1.5 A8 gleiches gilt_ab und gleiche Erfassung: die grössere id gilt', () => {
    const gleich = { client_zeit: GILT, erfasst_am: GILT };
    expect(phase(gleichstand({ ...gleich, id: uid('3e', 1) }, { ...gleich, id: uid('3e', 2) }))).toBe(
      'wachstum',
    );
    expect(phase(gleichstand({ ...gleich, id: uid('3e', 2) }, { ...gleich, id: uid('3e', 1) }))).toBe(
      'anzucht',
    );
  });
});

describe('R1.5 war_faellig_am nur bei fälliger Frage (A10)', () => {
  const ja = (t: Teile, jetzt: Date) =>
    neue(antwortVorgang(t, [{ satzId: satzId(61), antwort: 'ja' }], zaehler(), jetzt, ZEITZONE, AB_FRUEH))[0];

  it('R1.5 Frage noch nicht fällig (frageAm nach heute): war_faellig_am und aufgabe_schluessel fehlen', () => {
    const jetzt = new Date('2027-01-20T08:00:00Z');
    const t = buendelTeile(jetzt, { ohneSpaete: true });
    expect(phasenStand(t, satzId(61), jetzt, ZEITZONE)?.frageAm).toBe('2027-01-23');
    const s = ja(t, jetzt);
    expect(s).toBeDefined();
    expect(s?.felder).not.toHaveProperty('war_faellig_am');
    expect(s?.felder).not.toHaveProperty('aufgabe_schluessel');
    expect(daten(s)).toMatchObject({ phase: 'wachstum', antwort: 'ja' });
    // 22.1. 22:59 UTC ist in Zürich noch der 22.1.
    const spaet = new Date('2027-01-22T22:59:00Z');
    expect(ja(buendelTeile(spaet, { ohneSpaete: true }), spaet)?.felder).not.toHaveProperty('war_faellig_am');
  });

  it('R1.5 am Fälligkeitstag gesetzt, auch kurz nach Mitternacht Zürich (TZ)', () => {
    for (const jetzt of [new Date('2027-01-23T08:00:00Z'), new Date('2027-01-22T23:30:00Z')]) {
      const s = ja(buendelTeile(jetzt, { ohneSpaete: true }), jetzt);
      expect(s?.felder['war_faellig_am'], jetzt.toISOString()).toBe('2027-01-23');
      expect(s?.felder['aufgabe_schluessel']).toBe(`phase_bestaetigen|${satzId(61)}|2027-01-23`);
    }
  });
});

describe('R7.2 Wissenskarte wissenFuer() (A15)', () => {
  function wissenTeile(eintraege: Record<string, unknown>[]): Teile {
    const t = phasenTeile(JETZT);
    for (const a of t['art'] ?? []) if (a['art_id'] === 'lactuca_sativa') a['kulturgruppe_id'] = 'blattsalat';
    t['wissenseintrag'] = eintraege;
    return t;
  }
  const gruppe = {
    art_id: null,
    kulturgruppe_id: 'blattsalat',
    phase: 'anzucht',
    text: 'Hinweis der Kulturgruppe',
    gueltig_bis: null,
  };
  const art = {
    art_id: 'lactuca_sativa',
    kulturgruppe_id: null,
    phase: 'anzucht',
    text: 'Hinweis der Art',
    gueltig_bis: null,
  };

  it('R7.2 Eintrag der Ebene Art vor dem der Kulturgruppe', () => {
    expect(wissenFuer(wissenTeile([gruppe, art]), SORTE.lollo, 'anzucht')).toBe('Hinweis der Art');
    expect(wissenFuer(wissenTeile([gruppe]), SORTE.lollo, 'anzucht')).toBe('Hinweis der Kulturgruppe');
  });

  it('R7.2 Einträge mit gueltig_bis zählen nicht', () => {
    const abgelaufen = { gueltig_bis: '2027-01-01T00:00:00Z' };
    expect(wissenFuer(wissenTeile([gruppe, { ...art, ...abgelaufen }]), SORTE.lollo, 'anzucht')).toBe(
      'Hinweis der Kulturgruppe',
    );
    expect(
      wissenFuer(
        wissenTeile([
          { ...gruppe, ...abgelaufen },
          { ...art, ...abgelaufen },
        ]),
        SORTE.lollo,
        'anzucht',
      ),
    ).toBeUndefined();
  });

  it('R7.2 andere Phase oder unbekannte Sorte: undefined', () => {
    const t = wissenTeile([gruppe, art]);
    expect(wissenFuer(t, SORTE.lollo, 'wachstum')).toBeUndefined();
    expect(wissenFuer(t, uid('26', 99), 'anzucht')).toBeUndefined();
    // Tomate gehört nicht zur Kulturgruppe blattsalat
    expect(wissenFuer(t, SORTE.ochsenherz, 'anzucht')).toBeUndefined();
  });
});

describe('R1.5 Fragekarte: Ort nach Mehrheit und Anlagen-Kürzel (A12)', () => {
  /** Satz 80 Lollo Rossa gesät 7.1., Anzucht seit 11.1., drei Pflanzungen: eine auf 4.4, zwei auf 4.5 */
  function ortTeile(): Teile {
    const t = phasenTeile(BUENDEL_JETZT);
    phasenSatz(t, {
      nr: 80,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: '2027-01-07',
      platz: '4.4',
      pflanzungen: 3,
    });
    antwortDazu(t, { nr: 80, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
    const n = phasenNachrechnen(t);
    for (const z of n['v_pflanzung_zustand'] ?? [])
      if (z['pflanzung_id'] === pflanzungVon(80, 2) || z['pflanzung_id'] === pflanzungVon(80, 3))
        z['platz_id'] = platzId('4.5');
    return n;
  }
  const karte = (t: Teile) => phasenKarten(t, BUENDEL_JETZT, ZEITZONE, AB_FRUEH).fragen[0];

  it('R1.5 A12 Ort ist der Platz mit den meisten aktiven Pflanzungen des Satzes', () => {
    expect(karte(ortTeile())).toMatchObject({ ort: '4.5', titel: 'Salat · 4.5 · gesät 7.1.' });
  });

  it('R1.5 A12 ausgefallene Pflanzungen zählen nicht; Gleichstand nach Kennung', () => {
    const t = ortTeile();
    for (const z of t['v_pflanzung_zustand'] ?? [])
      if (z['pflanzung_id'] === pflanzungVon(80, 3)) z['status'] = 'ausfall';
    expect(karte(t)?.ort).toBe('4.4');
    for (const z of t['v_pflanzung_zustand'] ?? [])
      if (z['pflanzung_id'] === pflanzungVon(80, 1)) z['status'] = 'ausfall';
    expect(karte(t)?.ort).toBe('4.5');
  });

  it('R1.5 A12 Titel nennt das Anlagen-Kürzel nur bei mehreren aktiven Anlagen', () => {
    const t = ortTeile();
    const zweite = weitereAnlage('T', 'echt');
    t['anlage'] = [...(t['anlage'] ?? []), ...(zweite['anlage'] ?? [])];
    t['platz'] = [...(t['platz'] ?? []), ...(zweite['platz'] ?? [])];
    expect(karte(t)).toMatchObject({ ort: '4.5', titel: 'Salat · R-4.5 · gesät 7.1.' });
    // die zweite Anlage inaktiv: wieder ohne Kürzel
    for (const a of t['anlage'] ?? []) if (a['kuerzel'] === 'T') a['aktiv'] = false;
    expect(karte(t)?.titel).toBe('Salat · 4.5 · gesät 7.1.');
  });
});

describe('TZ5 mittag() an den Umstelltagen', () => {
  it('TZ5 12:00 Zürich: 15.1. 11:00Z, 28.3.2027 (Sommerzeit ab 2:00) 10:00Z, 31.10.2027 (Winterzeit ab 3:00) 11:00Z', () => {
    expect(mittag('2027-01-15', ZEITZONE).toISOString()).toBe('2027-01-15T11:00:00.000Z');
    expect(mittag('2027-03-28', ZEITZONE).toISOString()).toBe('2027-03-28T10:00:00.000Z');
    expect(mittag('2027-10-31', ZEITZONE).toISOString()).toBe('2027-10-31T11:00:00.000Z');
    // Tag davor bzw. danach zum Vergleich
    expect(mittag('2027-03-27', ZEITZONE).toISOString()).toBe('2027-03-27T11:00:00.000Z');
    expect(mittag('2027-10-30', ZEITZONE).toISOString()).toBe('2027-10-30T10:00:00.000Z');
    for (const tag of ['2027-03-28', '2027-10-31'])
      expect(kalendertag(mittag(tag, ZEITZONE), ZEITZONE)).toBe(tag);
  });
});

describe('R1.5 Verlauf mit gespeicherten, noch nicht gebündelten Zeilen', () => {
  it('R1.5 phasenVerlauf mit neu: die neue Antwort erscheint, obwohl das Bündel noch alt ist', () => {
    const t = buendelTeile();
    const v = antwortVorgang(
      t,
      [{ satzId: satzId(61), antwort: 'ja' }],
      zaehler(),
      BUENDEL_JETZT,
      ZEITZONE,
      AB_FRUEH,
    );
    expect(phasenVerlauf(t, satzId(61), ZEITZONE).map((z) => z.text)).not.toContain('10.2. Wachstum: Ja');
    const verlauf = phasenVerlauf(t, satzId(61), ZEITZONE, v);
    expect(verlauf[0]).toEqual({
      tag: '2027-02-10',
      text: '10.2. Wachstum: Ja',
      korrektur: false,
      nachgefuehrt: false,
    });
    expect(verlauf).toHaveLength(2);
    // phasenStand mit neu: ebenso
    expect(phasenStand(t, satzId(61), BUENDEL_JETZT, ZEITZONE, v)?.phase).toBe('wachstum');
  });

  it('R1.5 phasenVerlauf mit einem Storno in neu: die alte Zeile verschwindet', () => {
    const { t, ja } = verlaufTeile();
    expect(phasenVerlauf(t, satzId(67), ZEITZONE)).toHaveLength(3);
    const storno: Vorgang = [{ art: 'storno', tabelle: 'ereignis', clientId: ja, grund: 'rueckgaengig' }];
    const ohne = phasenVerlauf(t, satzId(67), ZEITZONE, storno);
    expect(ohne.map((z) => z.text)).toEqual([
      '19.1. Wachstum: Noch nicht',
      '11.1. Anzucht: Ja (nachgeführt)',
    ]);
    // Korrektur in neu: alte Zeile weg, Korrekturzeile da
    const k = korrekturVorgang(t, satzId(67), '2027-01-20', zaehler(), JETZT, ZEITZONE);
    const mitK = phasenVerlauf(t, satzId(67), ZEITZONE, k);
    expect(mitK.map((z) => z.text)).not.toContain('21.1. Wachstum: Ja');
    expect(mitK.filter((z) => z.korrektur)).toHaveLength(1);
    expect(mitK).toHaveLength(3);
  });
});
