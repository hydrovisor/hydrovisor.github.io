// Erntekalender (Issue #232, Plan 232 «Datenform» und «Testliste»; Konzept v1.8 6.1 UC15, E16; R1.1, R1.2, R1.5, R1.7,
// R8.1, R11.1, G1, G2). Reines Modul src/domain/phasen/kalender.ts: erntekalender(teile, jetzt, zeitzone) und
// kalenderFenster(jetzt, zeitzone). Uhr als Parameter (ERNTE_JETZT = Do 18.3.2027 09:00 Zürich), Zeitzone
// Europe/Zurich, Kalendertage als 'JJJJ-MM-TT'.
//
// Keine zweite Terminrechnung: Die erwarteten Werte rechnet der Test entweder aus den Fixture-Werten mit tagPlus() nach
// (Kopf von tests/fixtures/ernte.ts und tests/fixtures/phasen.ts) oder vergleicht gegen die Fachfunktionen phasenStand(),
// phaseAm(), ernteStand(), voraussichtlichesEnde() und pflanzungVonSatz(), wie Plan 232 «Datenfluss je Satz» es
// verlangt. Ergänzungen zur Fixture (Teilernte, Abernten, Storno, Satz ab Mittwoch, W0-Lücken) über die Helfer aus
// tests/fixtures/ernte.ts und tests/fixtures/keimung.ts; ohne Personendaten.
import { describe, expect, it } from 'vitest';
import {
  erntekalender,
  FENSTER_TAGE,
  kalenderFenster,
  PHASE_BUCHSTABE,
  type Erntefenster,
  type Erntekalender,
  type ErnteTermin,
  type KalenderZeile,
} from '../../src/domain/phasen/kalender.ts';
import { ernteAufgaben, ernteStand } from '../../src/domain/phasen/ernte.ts';
import { phasenStand, pflanzungVonSatz } from '../../src/domain/phasen/fragen.ts';
import { phaseAm } from '../../src/domain/phasen/prognose.ts';
import { KULTURFORM_NAME } from '../../src/domain/pflanzung/saeen.ts';
import { ersteErnteAb, umsetzTag, voraussichtlichesEnde } from '../../src/domain/pflanzung/belegung.ts';
import { tagKurz, tagPlus, tageZwischen, ZEITZONE } from '../../src/domain/zeit.ts';
import {
  BASILIKUM,
  BASILIKUM_DIREKT,
  BASILIKUM_SCHNITT,
  EICHBLATT,
  EISSALAT,
  ernteDazu,
  ernteSichtenNachrechnen,
  ernteTeile,
  ERNTE_JETZT,
  kulturformSetzen,
  LOLLO,
  PAKCHOI,
  PETERSILIE,
  phaseDazu,
  platzId,
  SATZ,
  SATZ_VOR,
  SORTE,
  SORTE_E,
  um,
  umsetzenDazu,
} from '../fixtures/ernte.ts';
import { pflanzungId, satzAnlegen } from '../fixtures/keimung.ts';
import {
  buendelTeile,
  BUENDEL_JETZT,
  dauerSetzen,
  satzId,
  welle1Teile,
  WELLE1_JETZT,
} from '../fixtures/phasen.ts';
import { uid, type Teile } from '../fixtures/regal.ts';

type Zeile = Record<string, unknown>;
const J = ERNTE_JETZT;
const Z = ZEITZONE;

/** Satz 98: Lollo Rossa Kopf in A2, gesät Mittwoch 17.3.2027 (laufende Woche ab Montag 15.3.), ohne Reservierung */
const SATZ_MITTWOCH = uid('27', 98);
const P_MITTWOCH = pflanzungId(98, 1);
function mitSatzAmMittwoch(t: Teile): Teile {
  satzAnlegen(t, {
    nr: 98,
    sorteId: SORTE.lollo,
    saatgutId: null,
    kulturform: 'kopf',
    box: 'A2',
    schwaemme: 1,
    samen: 1,
    saatdatum: '2027-03-17',
  });
  return ernteSichtenNachrechnen(t);
}

const zeileVon = (k: Erntekalender, id: string): KalenderZeile => {
  const z = k.zeilen.find((x) => x.satzId === id);
  if (!z) throw new Error(`keine Zeile für ${id}`);
  return z;
};
const satzZeile = (t: Teile, id: string): Zeile => {
  const s = (t['satz'] ?? []).find((x) => x['id'] === id);
  if (!s) throw new Error(`kein Satz ${id}`);
  return s;
};
const tage = (von: string, bis: string): string[] => {
  const l: string[] = [];
  for (let d = von; d <= bis; d = tagPlus(d, 1)) l.push(d);
  return l;
};

/** Erntefenster nach Plan 232 «Datenfluss je Satz» Punkte 4 bis 6, nur aus ernteStand() und voraussichtlichesEnde() */
function erwartetesErntefenster(
  t: Teile,
  id: string,
  jetzt: Date,
): { pflanzung: string; ernte: Erntefenster } {
  const aktive = (t['v_pflanzung_zustand'] ?? [])
    .filter((z) => z['satz_id'] === id && z['status'] === 'aktiv')
    .map((z) => String(z['pflanzung_id']))
    .sort();
  const staende = aktive
    .map((p) => ({ p, s: ernteStand(t, p, jetzt, Z) }))
    .sort((a, b) => {
      const ma = a.s?.moeglichAb;
      const mb = b.s?.moeglichAb;
      if (ma !== undefined && mb !== undefined) return ma.localeCompare(mb) || a.p.localeCompare(b.p);
      if (ma !== undefined) return -1;
      if (mb !== undefined) return 1;
      return a.p.localeCompare(b.p);
    });
  const erste = staende[0];
  if (!erste) throw new Error(`Satz ${id} ohne aktive Pflanzung`);
  const { p, s } = erste;
  const res = (t['v_reservierung_aktiv'] ?? []).find((r) => r['pflanzung_id'] === p);
  const text = (w: unknown) => (typeof w === 'string' ? w : undefined);
  const bezug =
    umsetzTag(t, p, Z) ?? text(res?.['umsetzen_geplant_am']) ?? text(res?.['umsetzen_vorgabe_am']);
  const ende = voraussichtlichesEnde(t, p, bezug);
  const ernteart = s?.ernteart ?? ende.ernteart;
  const ernte: Erntefenster = { teilernten: s?.teilernten ?? 0 };
  if (ernteart) ernte.ernteart = ernteart;
  if (ernteart === 'einmalig') {
    const ab = s?.moeglichAb ?? ende.endeAm;
    if (ab) ernte.ernteAb = ab;
    if (ende.endeAm) ernte.endeAm = ende.endeAm;
  } else if (ernteart === 'mehrfach') {
    if ((s?.teilernten ?? 0) > 0) {
      if (s?.moeglichAb) ernte.naechsterSchnitt = s.moeglichAb;
    } else if (s?.moeglichAb) ernte.ernteAb = s.moeglichAb;
    if (ende.endeAm) ernte.endeAm = ende.endeAm;
  }
  return { pflanzung: p, ernte };
}

/** Termine aus dem Erntefenster (Plan 232 Punkt 7): einmalig nur ernte_ab */
function termine(e: Erntefenster): ErnteTermin[] {
  const l: ErnteTermin[] = [];
  if (e.ernteAb) l.push({ art: 'ernte_ab', tag: e.ernteAb });
  if (e.ernteart !== 'einmalig') {
    if (e.naechsterSchnitt) l.push({ art: 'schnitt', tag: e.naechsterSchnitt });
    if (e.endeAm) l.push({ art: 'ende', tag: e.endeAm });
  }
  return l;
}

/** alle Eigenschaften von AK2 und AK3 über alle Zeilen eines Kalenders */
function eigenschaftenPruefen(t: Teile, jetzt: Date): Erntekalender {
  const k = erntekalender(t, jetzt, Z);
  const { von, bis, heute } = k.fenster;
  for (const z of k.zeilen) {
    const satz = satzZeile(t, z.satzId);
    const stand = phasenStand(t, z.satzId, jetzt, Z);
    if (!stand) throw new Error(`kein Phasenstand für ${z.satzId}`);
    const saat = String(satz['saatdatum']);
    const bezug = {
      satzId: z.satzId,
      sorteId: String(satz['sorte_id']),
      kulturform: String(satz['kulturform']),
      saatdatum: saat,
      direktsaat: Boolean(satz['direktsaat_platz_id']),
    };
    // AK2: Abschnitte lückenlos ab max(von, Saat) bis bis, ohne Überlappung, je Tag Phase wie phaseAm()
    const start = saat > von ? saat : von;
    const flach = z.abschnitte.flatMap((a) =>
      tage(a.von, a.bis).map((tag) => ({ tag, phase: a.phase, art: a.art, buchstabe: a.buchstabe })),
    );
    expect(
      flach.map((x) => x.tag),
      `${z.sorte}: Tage im Fenster`,
    ).toEqual(start <= bis ? tage(start, bis) : []);
    for (const x of flach) {
      const phase = phaseAm(t, bezug, x.tag, jetzt, Z);
      expect(x.phase, `${z.sorte} ${x.tag}`).toBe(phase);
      expect(x.buchstabe, `${z.sorte} ${x.tag}`).toBe(PHASE_BUCHSTABE[phase]);
      expect(x.art, `${z.sorte} ${x.tag}`).toBe(
        x.tag < heute && phase === stand.phase ? 'bestaetigt' : 'prognose',
      );
    }
    for (let i = 1; i < z.abschnitte.length; i += 1) {
      const a = z.abschnitte[i - 1];
      const b = z.abschnitte[i];
      if (!a || !b) continue;
      expect(tagPlus(a.bis, 1), `${z.sorte}: Anschluss`).toBe(b.von);
      expect(a.phase !== b.phase || a.art !== b.art, `${z.sorte}: Nachbarn verschieden`).toBe(true);
    }
    // AK3: Erntefenster nur aus ernteStand() und voraussichtlichesEnde() der massgebenden Pflanzung
    const erwartet = erwartetesErntefenster(t, z.satzId, jetzt);
    expect(z.ernte, `${z.sorte}: Erntefenster`).toEqual(erwartet.ernte);
    const alle = termine(erwartet.ernte);
    expect(z.marken, `${z.sorte}: Marken`).toEqual(
      alle.filter((m) => m.tag >= von && m.tag <= bis).sort((a, b) => a.tag.localeCompare(b.tag)),
    );
    expect(z.spaeter, `${z.sorte}: später`).toEqual(
      alle.filter((m) => m.tag > bis).sort((a, b) => a.tag.localeCompare(b.tag))[0],
    );
  }
  return k;
}

describe('UC15 Erntekalender: Konstanten', () => {
  it('UC15-AK2 FENSTER_TAGE ist 56 (8 Wochen), PHASE_BUCHSTABE K, A, W, B, F', () => {
    expect(FENSTER_TAGE).toBe(56);
    expect(PHASE_BUCHSTABE).toEqual({
      keimung: 'K',
      anzucht: 'A',
      wachstum: 'W',
      bluete: 'B',
      fruchtbildung_reife: 'F',
    });
  });
});

describe('UC15-AK1 je aktivem Satz genau eine Zeile', () => {
  it('UC15-AK1 Sätze 90 bis 96 erscheinen je einmal mit Sorte, Art, Kulturform, Ort, Saatdatum und Phase wie phasenStand()', () => {
    const t = ernteTeile();
    const k = erntekalender(t, J, Z);
    const ids = k.zeilen.map((z) => z.satzId);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(
      [
        SATZ.lollo,
        SATZ.eissalat,
        SATZ.basilikum,
        SATZ.pakchoi,
        SATZ.schnittlauch,
        SATZ.tomate,
        SATZ.eichblatt,
      ].sort(),
    );
    const sorten = t['sorte'] ?? [];
    const arten = t['art'] ?? [];
    for (const z of k.zeilen) {
      const satz = satzZeile(t, z.satzId);
      const stand = phasenStand(t, z.satzId, J, Z);
      const sorte = sorten.find((s) => s['sorte_id'] === satz['sorte_id'] && s['gueltig_bis'] === null);
      const art = arten.find((a) => a['art_id'] === sorte?.['art_id'] && a['gueltig_bis'] === null);
      expect(z.sorte).toBe(sorte?.['name']);
      expect(z.art).toBe(art?.['name_de']);
      expect(z.kulturform).toBe(satz['kulturform']);
      expect(z.kulturformName).toBe(KULTURFORM_NAME[String(satz['kulturform'])]);
      expect(z.saatdatum).toBe(satz['saatdatum']);
      expect(z.phase).toBe(stand?.phase);
      expect(z.phasenText).toBe(stand?.text);
      expect(z.tagSeitSaat).toBe(stand?.tagSeitSaat);
      expect(z.letztePhase).toBe(stand?.naechste === undefined);
      expect(z.pflanzungId).toBe(pflanzungVonSatz(t, z.satzId));
    }
  });

  it('UC15-AK1 Lollo Rossa (Nr. 90): Ort R-2.3 (zwei Pflanzungen auf 2.3 gegen eine auf 4.4), Schnitt, Wachstum Tag 49 von 20–40, letzte Phase', () => {
    const z = zeileVon(erntekalender(ernteTeile(), J, Z), SATZ.lollo);
    expect(z).toMatchObject({
      sorte: 'Lollo Rossa',
      art: 'Salat',
      kulturform: 'schnitt',
      kulturformName: 'Schnitt',
      ort: 'R-2.3',
      saatdatum: '2027-01-07',
      tagSeitSaat: 70,
      phase: 'wachstum',
      phasenText: 'Tag 49 von 20–40',
      letztePhase: true,
      pflanzungId: LOLLO[1],
    });
    expect(z.naechsterWechsel).toBeUndefined();
  });

  it('UC15-AK1 Basilikum Genoveser (Nr. 92) und Eissalat (Nr. 91) mit Art, Sorte und Kulturform', () => {
    const k = erntekalender(ernteTeile(), J, Z);
    expect(zeileVon(k, SATZ.basilikum)).toMatchObject({
      sorte: 'Genoveser',
      art: 'Basilikum',
      kulturformName: 'Dauerkultur Blatt',
      ort: 'R-2.3',
    });
    expect(zeileVon(k, SATZ.eissalat)).toMatchObject({
      sorte: 'Eissalat',
      art: 'Salat',
      kulturformName: 'Kopf',
      ort: 'R-2.3',
    });
    expect(zeileVon(k, SATZ.tomate).ort).toBe('R-2.2');
    expect(zeileVon(k, SATZ.pakchoi).ort).toBe('R-2.1');
  });

  it('UC15-AK1 Satz in Keimung (Eichblatt Nr. 96, nur Schwämme in der Box A2) hat eine Zeile mit Ort R-A2 und nächstem Wechsel', () => {
    const z = zeileVon(erntekalender(ernteTeile(), J, Z), SATZ.eichblatt);
    expect(z).toMatchObject({
      sorte: 'Eichblatt',
      ort: 'R-A2',
      saatdatum: '2027-03-10',
      tagSeitSaat: 8,
      phase: 'keimung',
      phasenText: 'Tag 8 von 2–7',
      letztePhase: false,
      pflanzungId: EICHBLATT[1],
    });
    // Keimung 2/4/7 ab Saat 10.3.
    expect(z.naechsterWechsel).toEqual({
      phase: 'anzucht',
      fruehestens: tagPlus('2027-03-10', 2),
      typisch: tagPlus('2027-03-10', 4),
      spaetestens: tagPlus('2027-03-10', 7),
    });
  });

  it('UC15-AK1 alle Anlagen: Direktsaat Lollo Rossa der Testanlage Y (Nr. 97) mit Ort Y-2.3', () => {
    const t = ernteTeile({ mitY: true });
    const z = zeileVon(erntekalender(t, J, Z), SATZ.lolloY);
    expect(z.ort).toBe('Y-2.3');
    expect(z.phasenText).toBe(phasenStand(t, SATZ.lolloY, J, Z)?.text);
  });

  it('UC15-AK1 Pak Choi nach Abernten (ernte {art: ab}) fehlt', () => {
    const t = ernteTeile();
    ernteDazu(t, PAKCHOI, 'ab', '2027-03-15');
    ernteSichtenNachrechnen(t);
    const ids = erntekalender(t, J, Z).zeilen.map((z) => z.satzId);
    expect(ids).not.toContain(SATZ.pakchoi);
    expect(ids).toHaveLength(6);
  });

  it('UC15-AK1 Satz mit Abschluss «ausfall» aller Pflanzungen (Satz 65 aus buendelTeile()) fehlt, Sätze 61 bis 64 sind da', () => {
    const t = buendelTeile();
    const ids = erntekalender(t, BUENDEL_JETZT, Z).zeilen.map((z) => z.satzId);
    expect([...ids].sort()).toEqual([satzId(61), satzId(62), satzId(63), satzId(64)].sort());
    expect(ids).not.toContain(satzId(65));
  });

  it('UC15-AK1 stornierter Satz fehlt, auch wenn seine Pflanzungen in v_pflanzung_zustand noch aktiv stehen', () => {
    const t = ernteTeile();
    satzZeile(t, SATZ.schnittlauch)['storniert_am'] = '2027-03-16T08:00:00.000Z';
    const ids = erntekalender(t, J, Z).zeilen.map((z) => z.satzId);
    expect(ids).not.toContain(SATZ.schnittlauch);
    expect(ids).toHaveLength(6);
  });

  it('UC15-AK1 Welle 1 (13 Sätze, alle in Keimung) ergibt 13 Zeilen', () => {
    const k = erntekalender(welle1Teile(), WELLE1_JETZT, Z);
    expect(k.zeilen).toHaveLength(13);
    expect(new Set(k.zeilen.map((z) => z.satzId)).size).toBe(13);
  });
});

describe('UC15-AK2 Fenster und Phasenabschnitte', () => {
  it('UC15-AK2 kalenderFenster(18.3.2027): Montag 15.3. bis 9.5., heute 18.3., 8 Montage', () => {
    const f = kalenderFenster(J, Z);
    expect(f).toEqual({
      von: '2027-03-15',
      bis: '2027-05-09',
      heute: '2027-03-18',
      wochen: [0, 7, 14, 21, 28, 35, 42, 49].map((n) => tagPlus('2027-03-15', n)),
    });
    expect(tageZwischen(f.von, f.bis) + 1).toBe(FENSTER_TAGE);
    expect(erntekalender(ernteTeile(), J, Z).fenster).toEqual(f);
  });

  it('UC15-AK2 TZ Sonntag 23:30 Zürich gehört zur laufenden Woche, Montag 00:30 Zürich beginnt ein neues Fenster', () => {
    // So 21.3.2027 23:30 MEZ = 22:30 UTC; Mo 22.3. 00:30 MEZ = So 23:30 UTC
    const sonntag = kalenderFenster(new Date('2027-03-21T22:30:00Z'), Z);
    expect(sonntag.von).toBe('2027-03-15');
    expect(sonntag.heute).toBe('2027-03-21');
    const montag = kalenderFenster(new Date('2027-03-21T23:30:00Z'), Z);
    expect(montag.von).toBe('2027-03-22');
    expect(montag.heute).toBe('2027-03-22');
    expect(montag.bis).toBe('2027-05-16');
  });

  it('UC15-AK2 TZ Sommerzeit: das Fenster über den 28.3.2027 zählt 56 Kalendertage, alle Wochenmarken sind Montage (G2)', () => {
    // So 28.3.2027 03:30 MESZ = 01:30 UTC (Umstellung um 02:00)
    const f = kalenderFenster(new Date('2027-03-28T01:30:00Z'), Z);
    expect(f.von).toBe('2027-03-22');
    expect(f.heute).toBe('2027-03-28');
    expect(f.bis).toBe('2027-05-16');
    expect(tageZwischen(f.von, f.bis) + 1).toBe(56);
    expect(f.wochen).toHaveLength(8);
    for (const w of f.wochen) expect(new Date(`${w}T12:00:00Z`).getUTCDay(), w).toBe(1);
    // Mo 29.3. 00:30 MESZ = So 28.3. 22:30 UTC: neues Fenster
    expect(kalenderFenster(new Date('2027-03-28T22:30:00Z'), Z).von).toBe('2027-03-29');
  });

  it('UC15-AK2 für jeden Satz und jeden Tag im Fenster ab Saat: Phase wie phaseAm(), Abschnitte lückenlos, ohne Überlappung, Nachbarn verschieden', () => {
    eigenschaftenPruefen(ernteTeile({ mitY: true }), J);
    eigenschaftenPruefen(mitSatzAmMittwoch(ernteTeile()), J);
    eigenschaftenPruefen(welle1Teile(), WELLE1_JETZT);
    eigenschaftenPruefen(buendelTeile(), BUENDEL_JETZT);
  });

  it('UC15-AK2 TZ Fenster über die Sommerzeit (Do 25.3.2027): Eigenschaften gelten weiter', () => {
    const jetzt = um('2027-03-25');
    const k = eigenschaftenPruefen(ernteTeile({ jetzt }), jetzt);
    expect(k.fenster.von).toBe('2027-03-22');
    expect(k.zeilen.length).toBeGreaterThan(0);
  });

  it('UC15-AK2 Eichblatt (Keimung 2/4/7, typisch 14.3. vorbei, keine Antwort): 15.3. bis 25.3. Anzucht Prognose, ab 26.3. Wachstum Prognose', () => {
    const z = zeileVon(erntekalender(ernteTeile(), J, Z), SATZ.eichblatt);
    // Saat 10.3. + Keimung typisch 4 = 14.3. (Anzucht), + Anzucht typisch 12 = 26.3. (Wachstum)
    const anzucht = tagPlus('2027-03-10', 4);
    const wachstum = tagPlus(anzucht, 12);
    expect(wachstum).toBe('2027-03-26');
    expect(z.abschnitte).toEqual([
      { phase: 'anzucht', buchstabe: 'A', von: '2027-03-15', bis: tagPlus(wachstum, -1), art: 'prognose' },
      { phase: 'wachstum', buchstabe: 'W', von: wachstum, bis: '2027-05-09', art: 'prognose' },
    ]);
  });

  it('UC15-AK2 Lollo Rossa mit bestätigtem Wachstum seit 28.1.: 15.3. bis 17.3. bestätigt, ab 18.3. (heute) Prognose', () => {
    const z = zeileVon(erntekalender(ernteTeile(), J, Z), SATZ.lollo);
    expect(z.abschnitte).toEqual([
      { phase: 'wachstum', buchstabe: 'W', von: '2027-03-15', bis: '2027-03-17', art: 'bestaetigt' },
      { phase: 'wachstum', buchstabe: 'W', von: '2027-03-18', bis: '2027-05-09', art: 'prognose' },
    ]);
  });

  it('UC15-AK2 Satz gesät am Mittwoch 17.3.: Montag und Dienstag ohne Abschnitt, Keimung am Saattag bestätigt (A3)', () => {
    const z = zeileVon(erntekalender(mitSatzAmMittwoch(ernteTeile()), J, Z), SATZ_MITTWOCH);
    // Keimung 2/4/7 → Anzucht ab 21.3., Anzucht 10/12/14 → Wachstum ab 2.4.
    const anzucht = tagPlus('2027-03-17', 4);
    const wachstum = tagPlus(anzucht, 12);
    expect(z.abschnitte).toEqual([
      { phase: 'keimung', buchstabe: 'K', von: '2027-03-17', bis: '2027-03-17', art: 'bestaetigt' },
      { phase: 'keimung', buchstabe: 'K', von: '2027-03-18', bis: tagPlus(anzucht, -1), art: 'prognose' },
      { phase: 'anzucht', buchstabe: 'A', von: anzucht, bis: tagPlus(wachstum, -1), art: 'prognose' },
      { phase: 'wachstum', buchstabe: 'W', von: wachstum, bis: '2027-05-09', art: 'prognose' },
    ]);
    expect(z.abschnitte.some((a) => a.von < '2027-03-17')).toBe(false);
  });
});

describe('UC15-AK3 Erntefenster aus ernteStand() und voraussichtlichesEnde()', () => {
  it('UC15-AK3 Eissalat (einmalig, umgesetzt 28.1.): Ernte ab = ernteStand().moeglichAb = 4.3., vor dem Fenster keine Marke, Kurzzeile «Ernte möglich seit 4.3.»', () => {
    const t = ernteTeile();
    const z = zeileVon(erntekalender(t, J, Z), SATZ.eissalat);
    expect(ernteStand(t, EISSALAT, J, Z)?.moeglichAb).toBe(tagPlus('2027-01-28', 35));
    expect(z.ernte).toEqual({
      ernteart: 'einmalig',
      ernteAb: '2027-03-04',
      endeAm: '2027-03-04',
      teilernten: 0,
    });
    expect(z.marken).toEqual([]);
    expect(z.spaeter).toBeUndefined();
    expect(z.kurz).toBe('Ernte möglich seit 4.3.');
  });

  it('UC15-AK3 Eichblatt (einmalig, vor dem Umsetzen, geplant 31.3.): Ernte ab = voraussichtlichesEnde().endeAm = 5.5., Marke im Fenster', () => {
    const t = ernteTeile();
    const z = zeileVon(erntekalender(t, J, Z), SATZ.eichblatt);
    const ende = voraussichtlichesEnde(t, EICHBLATT[1] as string, '2027-03-31').endeAm;
    expect(ende).toBe(tagPlus('2027-03-31', 35));
    expect(ernteStand(t, EICHBLATT[1] as string, J, Z)?.moeglichAb).toBeUndefined();
    expect(z.ernte).toEqual({ ernteart: 'einmalig', ernteAb: ende, endeAm: ende, teilernten: 0 });
    expect(z.marken).toEqual([{ art: 'ernte_ab', tag: '2027-05-05' }]);
    expect(z.spaeter).toBeUndefined();
  });

  it('UC15-AK3 Eichblatt: Bezug ist der geplante Umsetztag der Reservierung (v_reservierung_aktiv), verschoben auf 7.4. → Ernte ab 12.5. nach dem Fenster', () => {
    const t = ernteTeile();
    for (const r of t['v_reservierung_aktiv'] ?? [])
      if (r['pflanzung_id'] === EICHBLATT[1] || r['pflanzung_id'] === EICHBLATT[2])
        r['umsetzen_geplant_am'] = '2027-04-07';
    const z = zeileVon(erntekalender(t, J, Z), SATZ.eichblatt);
    expect(z.ernte.ernteAb).toBe(tagPlus('2027-04-07', 35));
    expect(z.ernte.ernteAb).toBe(voraussichtlichesEnde(t, EICHBLATT[1] as string, '2027-04-07').endeAm);
    // Fenster 15.3. bis 9.5.: der Termin steht am rechten Rand («später»), nicht als Marke
    expect(z.marken).toEqual([]);
    expect(z.spaeter).toEqual({ art: 'ernte_ab', tag: '2027-05-12' });
  });

  it('UC15-AK3 Basilikum (mehrfach) ohne Teilernte: Ernte ab aus ernteStand(), Ende = Saat + 150 = 6.6. nach dem Fenster → «später»', () => {
    const t = ernteTeile();
    const z = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      ernteAb: ernteStand(t, BASILIKUM, J, Z)?.moeglichAb,
      endeAm: tagPlus('2027-01-07', 150),
      teilernten: 0,
    });
    expect(z.ernte.ernteAb).toBe(tagPlus('2027-02-04', 28));
    expect(z.ernte.naechsterSchnitt).toBeUndefined();
    expect(z.marken).toEqual([]);
    expect(z.spaeter).toEqual({ art: 'ende', tag: '2027-06-06' });
  });

  it('UC15-AK3 Basilikum nach Teilernte 11.3.: nächster Schnitt = letzte Teilernte + 14 = 25.3. als Marke, Ernte ab fehlt, Kurzzeile «nächster Schnitt ab 25.3.»', () => {
    const t = ernteTeile();
    ernteDazu(t, BASILIKUM, 'teil', '2027-03-11');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      naechsterSchnitt: tagPlus('2027-03-11', 14),
      endeAm: '2027-06-06',
      teilernten: 1,
    });
    expect(z.ernte.ernteAb).toBeUndefined();
    expect(z.ernte.naechsterSchnitt).toBe(ernteStand(t, BASILIKUM, J, Z)?.moeglichAb);
    expect(z.marken).toEqual([{ art: 'schnitt', tag: '2027-03-25' }]);
    expect(z.spaeter).toEqual({ art: 'ende', tag: '2027-06-06' });
    expect(z.kurz).toBe('nächster Schnitt ab 25.3.');
  });

  it('UC15-AK3 Basilikum nach Teilernte 1.3.: nächster Schnitt 15.3. liegt vor heute, Kurzzeile «nächster Schnitt möglich seit 15.3.» (Prüfer Runde 1)', () => {
    const t = ernteTeile();
    ernteDazu(t, BASILIKUM, 'teil', '2027-03-01');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(z.ernte.naechsterSchnitt).toBe(tagPlus('2027-03-01', 14));
    expect(z.ernte.naechsterSchnitt).toBe(ernteStand(t, BASILIKUM, J, Z)?.moeglichAb);
    expect(z.kurz).toBe('nächster Schnitt möglich seit 15.3.');
    expect(z.kennzeichen).toEqual([]);
  });

  it('UC15-AK3 massgebend ist die Pflanzung mit dem frühesten «Ernte möglich» (wie ernteAufgaben()): nach Teilernte an Lollo 1 zählt Lollo 2', () => {
    const t = ernteTeile();
    ernteDazu(t, LOLLO[1] as string, 'teil', '2027-03-15');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.lollo);
    // Lollo 1: 15.3. + 7 = 22.3.; Lollo 2 ohne Teilernte: 28.1. + 21 = 18.2.; Lollo 3 (Stationsrest) ohne Umsetzen: offen
    expect(ernteStand(t, LOLLO[1] as string, J, Z)?.moeglichAb).toBe('2027-03-22');
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      ernteAb: tagPlus('2027-01-28', 21),
      endeAm: tagPlus('2027-01-07', 70),
      teilernten: 0,
    });
    // «Pflanze öffnen» bleibt bei pflanzungVonSatz()
    expect(z.pflanzungId).toBe(LOLLO[1]);
    expect(z.marken).toEqual([{ art: 'ende', tag: '2027-03-18' }]);
  });

  it('UC15-AK3 W0-Lücke: ohne Ernteintervall und Kulturdauer max. nach Teilernte sind nächster Schnitt und Ende undefined', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'ocimum_basilicum', 'dauerkultur_blatt', {
      ernteintervall_d: null,
      kulturdauer_max_d: null,
    });
    ernteDazu(t, BASILIKUM, 'teil', '2027-03-11');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(z.ernte.ernteart).toBe('mehrfach');
    expect(z.ernte.teilernten).toBe(1);
    expect(z.ernte.naechsterSchnitt).toBeUndefined();
    expect(z.ernte.endeAm).toBeUndefined();
    expect(z.ernte.ernteAb).toBeUndefined();
    expect(z.marken).toEqual([]);
    expect(z.spaeter).toBeUndefined();
  });

  it('UC15-AK3 W0-Lücke: Salat als Schnitt ohne «Ernte ab» (ernte_ab_d fehlt) → Ernte ab undefined, Ende bleibt', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'schnitt', { ernte_ab_d: null });
    const z = zeileVon(erntekalender(t, J, Z), SATZ.lollo);
    expect(z.ernte.ernteAb).toBeUndefined();
    expect(z.ernte.endeAm).toBe('2027-03-18');
  });

  it('UC15-AK3 jede Datumsangabe im Erntefenster stimmt mit ernteStand() bzw. voraussichtlichesEnde() derselben Pflanzung überein (alle Zeilen)', () => {
    eigenschaftenPruefen(ernteTeile(), J);
    const t = ernteTeile({ mitY: true });
    ernteDazu(t, BASILIKUM, 'teil', '2027-03-11');
    ernteDazu(t, LOLLO[2] as string, 'teil', '2027-03-12');
    ernteSichtenNachrechnen(t);
    eigenschaftenPruefen(mitSatzAmMittwoch(t), J);
    const spaet = um('2027-04-15');
    eigenschaftenPruefen(ernteTeile({ jetzt: spaet }), spaet);
  });
});

describe('UC15-AK4 Kennzeichen', () => {
  it('UC15-AK4 «Phase unbestätigt» bei Eichblatt (typisch 14.3. vor heute 18.3.) und Tomate (Blüte typisch 6.3.), nicht bei bestätigten Sätzen', () => {
    const k = erntekalender(ernteTeile(), J, Z);
    expect(zeileVon(k, SATZ.eichblatt).kennzeichen).toEqual(['Phase unbestätigt']);
    expect(zeileVon(k, SATZ.tomate).kennzeichen).toEqual(['Phase unbestätigt']);
    for (const id of [SATZ.lollo, SATZ.eissalat, SATZ.basilikum, SATZ.pakchoi, SATZ.schnittlauch])
      expect(zeileVon(k, id).kennzeichen, id).toEqual([]);
  });

  it('UC15-AK4 Grenzfall: am typischen Tag selbst (14.3.) kein «Phase unbestätigt», am Tag danach schon', () => {
    const am14 = um('2027-03-14');
    expect(
      zeileVon(erntekalender(ernteTeile({ jetzt: am14 }), am14, Z), SATZ.eichblatt).kennzeichen,
    ).not.toContain('Phase unbestätigt');
    const am15 = um('2027-03-15');
    expect(
      zeileVon(erntekalender(ernteTeile({ jetzt: am15 }), am15, Z), SATZ.eichblatt).kennzeichen,
    ).toContain('Phase unbestätigt');
  });

  it('UC15-AK4 nach phase_antwort {anzucht, ja} am 15.3. ist «Phase unbestätigt» bei Eichblatt weg', () => {
    const t = ernteTeile();
    phaseDazu(t, SATZ.eichblatt, 'anzucht', '2027-03-15');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.eichblatt);
    expect(z.kennzeichen).toEqual([]);
    expect(z.phase).toBe('anzucht');
  });

  it('UC15-AK4 «Termine noch offen» für einen Satz in letzter Phase ohne Erntewerte; nicht, sobald ein Ende bekannt ist', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'ocimum_basilicum', 'dauerkultur_blatt', {
      ernte_ab_d: null,
      kulturdauer_max_d: null,
    });
    const z = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(z.letztePhase).toBe(true);
    expect(z.ernte.ernteAb).toBeUndefined();
    expect(z.ernte.naechsterSchnitt).toBeUndefined();
    expect(z.ernte.endeAm).toBeUndefined();
    expect(z.kennzeichen).toEqual(['Termine noch offen']);
    expect(z.kurz).toBe('Ernte und Ende ohne Termin');
    expect(z.naechstes).toBeUndefined();

    kulturformSetzen(t, 'ocimum_basilicum', 'dauerkultur_blatt', { kulturdauer_max_d: 150 });
    const mitEnde = zeileVon(erntekalender(t, J, Z), SATZ.basilikum);
    expect(mitEnde.ernte.endeAm).toBe('2027-06-06');
    expect(mitEnde.kennzeichen).toEqual([]);
  });

  it('UC15-AK4 ohne Zeile in art_kulturform: Eissalat (letzte Phase) «Termine noch offen», Eichblatt mit berechenbarem Wechsel nicht', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'kopf', null);
    const k = erntekalender(t, J, Z);
    const eissalat = zeileVon(k, SATZ.eissalat);
    expect(eissalat.ernte.ernteart).toBeUndefined();
    expect(eissalat.kennzeichen).toEqual(['Termine noch offen']);
    expect(eissalat.kurz).toBe('Ernte und Ende ohne Termin');
    expect(zeileVon(k, SATZ.eichblatt).kennzeichen).not.toContain('Termine noch offen');
  });
});

describe('UC15-AK5 nächstes Ereignis und Reihenfolge', () => {
  it('UC15-AK5 Reihenfolge: unbestätigte zuerst (nach Tag), dann nach Datum des nächsten Ereignisses, bei gleichem Tag nach Ort, dann Sorte', () => {
    const k = erntekalender(ernteTeile(), J, Z);
    expect(k.zeilen.map((z) => z.satzId)).toEqual([
      SATZ.tomate, // unbestätigt, Blüte fällig seit 6.3.
      SATZ.eichblatt, // unbestätigt, Anzucht fällig seit 14.3.
      SATZ.lollo, // Ernte ab 18.2.
      SATZ.pakchoi, // Ernte ab 27.2.
      SATZ.eissalat, // Ernte ab 4.3., R-2.3, «Eissalat»
      SATZ.basilikum, // Ernte ab 4.3., R-2.3, «Genoveser»
      SATZ.schnittlauch, // Ernte ab 6.3.
    ]);
  });

  it('UC15-AK5 nächstes Ereignis: unbestätigter Wechsel mit typischem Tag, sonst frühester Erntetermin', () => {
    const k = erntekalender(ernteTeile(), J, Z);
    expect(zeileVon(k, SATZ.tomate).naechstes).toEqual({
      art: 'wechsel',
      tag: '2027-03-06',
      phase: 'bluete',
      unbestaetigt: true,
    });
    expect(zeileVon(k, SATZ.eichblatt).naechstes).toEqual({
      art: 'wechsel',
      tag: '2027-03-14',
      phase: 'anzucht',
      unbestaetigt: true,
    });
    expect(zeileVon(k, SATZ.lollo).naechstes).toEqual({
      art: 'ernte_ab',
      tag: '2027-02-18',
      unbestaetigt: false,
    });
    expect(zeileVon(k, SATZ.pakchoi).naechstes).toEqual({
      art: 'ernte_ab',
      tag: '2027-02-27',
      unbestaetigt: false,
    });
  });

  it('UC15-AK5 Wechsel und Ernte am selben Tag → Wechsel', () => {
    const t = ernteTeile();
    // Blüte bestätigt 6.3. → Fruchtbildung typisch 6.3. + 14 = 20.3.; Ernte ab 4.2. + 44 = 20.3.
    phaseDazu(t, SATZ.tomate, 'bluete', '2027-03-06');
    kulturformSetzen(t, 'solanum_lycopersicum', 'dauerkultur_frucht', { ernte_ab_d: 44 });
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.tomate);
    expect(z.ernte.ernteAb).toBe('2027-03-20');
    expect(z.naechstes).toEqual({
      art: 'wechsel',
      tag: '2027-03-20',
      phase: 'fruchtbildung_reife',
      unbestaetigt: false,
    });
    expect(z.kennzeichen).toEqual([]);
    expect(z.kurz).toBe('Fruchtbildung und Reife ab 20.3. · Ernte ab 20.3.');
  });

  it('UC15-AK5 Ernte vor Wechsel → Ernte', () => {
    const t = ernteTeile();
    phaseDazu(t, SATZ.tomate, 'bluete', '2027-03-06');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.tomate);
    expect(z.naechstes).toEqual({ art: 'ernte_ab', tag: '2027-03-06', unbestaetigt: false });
    expect(z.kurz).toBe('Fruchtbildung und Reife ab 20.3. · Ernte möglich seit 6.3.');
  });

  it('UC15-AK5 gleicher Tag → nach Ort numerisch: «R-2.2» vor «R-10.1»', () => {
    const t = ernteTeile();
    // Tomate (R-2.2) mit bestätigter Blüte: nächstes Ereignis Ernte ab 6.3. wie Schnittlauch; Gefäss 2.1 heisst 10.1
    phaseDazu(t, SATZ.tomate, 'bluete', '2027-03-06');
    ernteSichtenNachrechnen(t);
    for (const p of t['platz'] ?? []) if (p['id'] === platzId('2.1')) p['kennung'] = '10.1';
    const k = erntekalender(t, J, Z);
    const tomate = zeileVon(k, SATZ.tomate);
    const schnittlauch = zeileVon(k, SATZ.schnittlauch);
    expect(tomate.ort).toBe('R-2.2');
    expect(schnittlauch.ort).toBe('R-10.1');
    expect(tomate.naechstes?.tag).toBe('2027-03-06');
    expect(schnittlauch.naechstes?.tag).toBe('2027-03-06');
    const ids = k.zeilen.map((z) => z.satzId);
    expect(ids.indexOf(SATZ.tomate)).toBe(ids.indexOf(SATZ.schnittlauch) - 1);
  });

  it('UC15-AK5 Sätze ohne Termin stehen zuletzt', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'ocimum_basilicum', 'dauerkultur_blatt', {
      ernte_ab_d: null,
      kulturdauer_max_d: null,
    });
    const k = erntekalender(t, J, Z);
    expect(k.zeilen.at(-1)?.satzId).toBe(SATZ.basilikum);
    expect(k.zeilen.at(-1)?.naechstes).toBeUndefined();
  });

  it('UC15-AK5 Kurzzeile: Wechsel «ab <T.M.>», «ab heute» und unbestätigt «fällig seit», mit Ernteteil verbunden durch « · »', () => {
    const t = mitSatzAmMittwoch(ernteTeile());
    const ende = voraussichtlichesEnde(t, P_MITTWOCH).endeAm;
    if (!ende) throw new Error('Fixture: Satz 98 ohne voraussichtliches Ende');
    expect(zeileVon(erntekalender(t, J, Z), SATZ_MITTWOCH).kurz).toBe(
      `Anzucht ab 21.3. · Ernte ab ${tagKurz(ende)}`,
    );
    const am21 = um('2027-03-21');
    expect(zeileVon(erntekalender(t, am21, Z), SATZ_MITTWOCH).kurz).toBe(
      `Anzucht ab heute · Ernte ab ${tagKurz(ende)}`,
    );
    const k = erntekalender(ernteTeile(), J, Z);
    expect(zeileVon(k, SATZ.eichblatt).kurz).toBe('Anzucht fällig seit 14.3. · Ernte ab 5.5.');
    expect(zeileVon(k, SATZ.tomate).kurz).toBe('Blüte fällig seit 6.3. · Ernte möglich seit 6.3.');
    expect(zeileVon(k, SATZ.lollo).kurz).toBe('Ernte möglich seit 18.2.');
  });

  it('UC15-AK5 Kurzzeile «Ernte offen» ohne Erntetermin, wenn der nächste Wechsel bekannt ist', () => {
    const t = ernteTeile();
    kulturformSetzen(t, 'lactuca_sativa', 'kopf', null);
    const z = zeileVon(erntekalender(t, J, Z), SATZ.eichblatt);
    expect(z.kurz).toBe('Anzucht fällig seit 14.3. · Ernte offen');
    expect(z.naechstes).toEqual({ art: 'wechsel', tag: '2027-03-14', phase: 'anzucht', unbestaetigt: true });
  });
});

// ---------------------------------------------------------------------
// Issue #254, Plan 254: «Ernte ab» bei Mehrfachernte vor dem Umsetzen (ersteErnteAb() neben voraussichtlichesEnde())
// Fixture ernteTeile({ vorUmsetzen: true }): Sätze 99 (Petersilie dauerkultur_blatt, ohne Reservierung), 100 (Basilikum
// schnitt, Zieltopf 2.3.5, geplant 19.3., Vorgabe 24.3.) und 101 (Basilikum schnitt, Direktsaat 3.1).
// ---------------------------------------------------------------------

const vor = (e: { jetzt?: Date } = {}) => ernteTeile({ vorUmsetzen: true, ...e });

/** SatzBezug für phaseAm() aus der Satzzeile */
const bezugVon = (t: Teile, id: string) => {
  const s = satzZeile(t, id);
  return {
    satzId: id,
    sorteId: String(s['sorte_id']),
    kulturform: String(s['kulturform']),
    saatdatum: String(s['saatdatum']),
    direktsaat: Boolean(s['direktsaat_platz_id']),
  };
};

/** Feld umsetzen_ab_d einer Art setzen */
const umsetzenAbSetzen = (t: Teile, artId: string, tage: number | null) => {
  for (const a of t['art'] ?? []) if (a['art_id'] === artId) a['umsetzen_ab_d'] = tage;
};

/** Reservierung von Satz 100 entfernen und Sichten nachrechnen */
const ohneReservierung = (t: Teile): Teile => {
  t['reservierung'] = (t['reservierung'] ?? []).filter((r) => r['pflanzung_id'] !== BASILIKUM_SCHNITT);
  return ernteSichtenNachrechnen(t);
};

/** phase_antwort eines Satzes entfernen (wie nie erfasst) und Sichten nachrechnen */
const ohnePhasenantwort = (t: Teile, id: string): Teile => {
  t['ereignis'] = (t['ereignis'] ?? []).filter((e) => !(e['typ'] === 'phase_antwort' && e['satz_id'] === id));
  return ernteSichtenNachrechnen(t);
};

describe('UC15-AK10 Mehrfachernte vor dem Umsetzen mit Reservierung oder als Direktsaat', () => {
  it('UC15-AK10 TZ Basilikum Schnitt (Satz 100) vor dem Umsetzen, geplant 19.3.: ernteAb = 19.3. + 50 = 8.5., Marke im Fenster, Ende 22.6. «später»', () => {
    const t = vor();
    // Fixture: kein Umsetzen, keine Teilernte, Bezug laut ernteStand() offen
    expect(umsetzTag(t, BASILIKUM_SCHNITT, Z)).toBeUndefined();
    expect(ernteStand(t, BASILIKUM_SCHNITT, J, Z)?.moeglichAb).toBeUndefined();
    // Rechnung über den 28.3. (Sommerzeit) zählt Kalendertage (G2)
    const ab = tagPlus('2027-03-19', 50);
    expect(ab).toBe('2027-05-08');
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, '2027-03-19', J, Z)).toBe(ab);
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumSchnitt);
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      ernteAb: '2027-05-08',
      endeAm: tagPlus('2027-02-22', 120),
      teilernten: 0,
    });
    expect(z.ernte.endeAm).toBe('2027-06-22');
    expect(z.marken).toEqual([{ art: 'ernte_ab', tag: '2027-05-08' }]);
    expect(z.spaeter).toEqual({ art: 'ende', tag: '2027-06-22' });
  });

  it('UC15-AK10 Basilikum Schnitt: ohne geplantes Datum gilt die Vorgabe 24.3. → ernteAb 13.5. nach dem Fenster («später» ernte_ab)', () => {
    const t = vor();
    for (const r of t['v_reservierung_aktiv'] ?? [])
      if (r['pflanzung_id'] === BASILIKUM_SCHNITT) r['umsetzen_geplant_am'] = null;
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumSchnitt);
    expect(z.ernte.ernteAb).toBe(tagPlus('2027-03-24', 50));
    expect(z.ernte.ernteAb).toBe('2027-05-13');
    expect(z.marken).toEqual([]);
    expect(z.spaeter).toEqual({ art: 'ernte_ab', tag: '2027-05-13' });
  });

  it('UC15-AK10 Basilikum Schnitt: Kurzzeile «Wachstum ab 20.3. · Ernte ab 8.5.», kein Kennzeichen', () => {
    const z = zeileVon(erntekalender(vor(), J, Z), SATZ_VOR.basilikumSchnitt);
    expect(z.kurz).toBe('Wachstum ab 20.3. · Ernte ab 8.5.');
    expect(z.kennzeichen).toEqual([]);
    expect(z.naechstes).toEqual({
      art: 'wechsel',
      tag: '2027-03-20',
      phase: 'wachstum',
      unbestaetigt: false,
    });
  });

  it('UC15-AK10 Direktsaat Basilikum Schnitt (Satz 101): ernteAb = Saat + 50 = 13.4. = ernteStand().moeglichAb = ersteErnteAb()', () => {
    const t = vor();
    const ab = tagPlus('2027-02-22', 50);
    expect(ab).toBe('2027-04-13');
    expect(ernteStand(t, BASILIKUM_DIREKT, J, Z)?.moeglichAb).toBe(ab);
    expect(ersteErnteAb(t, BASILIKUM_DIREKT, undefined, J, Z)).toBe(ab);
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumDirekt);
    expect(z.ernte.ernteAb).toBe(ab);
    expect(z.marken).toContainEqual({ art: 'ernte_ab', tag: ab });
  });
});

describe('UC15-AK11 Mehrfachernte vor dem Umsetzen ohne Reservierung', () => {
  it('UC15-AK11 Basilikum Schnitt ohne Reservierung: Bezug Saat + umsetzen_ab_d 28 = 22.3. → ernteAb 11.5.', () => {
    const t = ohneReservierung(vor());
    expect((t['v_reservierung_aktiv'] ?? []).some((r) => r['pflanzung_id'] === BASILIKUM_SCHNITT)).toBe(
      false,
    );
    const bezug = tagPlus('2027-02-22', 28);
    expect(bezug).toBe('2027-03-22');
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumSchnitt);
    expect(z.ernte.ernteAb).toBe(tagPlus(bezug, 50));
    expect(z.ernte.ernteAb).toBe('2027-05-11');
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, undefined, J, Z)).toBe('2027-05-11');
    expect(z.spaeter).toEqual({ art: 'ernte_ab', tag: '2027-05-11' });
  });

  it('UC15-AK11 Basilikum Schnitt ohne Reservierung und ohne umsetzen_ab_d: Bezug erster Wachstumstag aus phaseAm() = 20.3. → ernteAb 9.5. als Marke am rechten Rand', () => {
    const t = ohneReservierung(vor());
    umsetzenAbSetzen(t, 'ocimum_basilicum', null);
    const b = bezugVon(t, SATZ_VOR.basilikumSchnitt);
    // Anzucht bestätigt 27.2. + typ 21 = 20.3.
    expect(phaseAm(t, b, '2027-03-19', J, Z)).toBe('anzucht');
    expect(phaseAm(t, b, '2027-03-20', J, Z)).toBe('wachstum');
    expect(tagPlus('2027-02-27', 21)).toBe('2027-03-20');
    const ab = tagPlus('2027-03-20', 50);
    expect(ab).toBe('2027-05-09');
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, undefined, J, Z)).toBe(ab);
    const k = erntekalender(t, J, Z);
    const z = zeileVon(k, SATZ_VOR.basilikumSchnitt);
    expect(k.fenster.bis).toBe(ab);
    expect(z.ernte.ernteAb).toBe(ab);
    expect(z.marken).toEqual([{ art: 'ernte_ab', tag: '2027-05-09' }]);
    expect(z.spaeter).toEqual({ art: 'ende', tag: '2027-06-22' });
  });

  it('UC15-AK11 Petersilie Dauerkultur (Satz 99) in der Anzucht ohne Reservierung: ernteAb = 29.3. + 28 = 26.4., Kurzzeile «Wachstum ab 29.3. · Ernte ab 26.4.», Kennzeichen leer', () => {
    const t = vor();
    expect((t['v_reservierung_aktiv'] ?? []).some((r) => r['pflanzung_id'] === PETERSILIE)).toBe(false);
    const b = bezugVon(t, SATZ_VOR.petersilie);
    // Anzucht bestätigt 1.3. + typ 28 = 29.3.
    expect(phaseAm(t, b, '2027-03-28', J, Z)).toBe('anzucht');
    expect(phaseAm(t, b, '2027-03-29', J, Z)).toBe('wachstum');
    const ab = tagPlus('2027-03-29', 28);
    expect(ab).toBe('2027-04-26');
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBe(ab);
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie);
    expect(z.phase).toBe('anzucht');
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      ernteAb: ab,
      endeAm: tagPlus('2027-02-15', 180),
      teilernten: 0,
    });
    expect(z.ernte.endeAm).toBe('2027-08-14');
    expect(z.kurz).toBe('Wachstum ab 29.3. · Ernte ab 26.4.');
    expect(z.kennzeichen).toEqual([]);
    expect(z.marken).toEqual([{ art: 'ernte_ab', tag: '2027-04-26' }]);
  });

  it('UC15-AK11 Petersilie mit umsetzen_ab_d 35 an der Art: Bezug 15.2. + 35 = 22.3. vor phaseAm() → ernteAb 19.4.', () => {
    const t = vor();
    umsetzenAbSetzen(t, 'petroselinum_crispum', 35);
    const bezug = tagPlus('2027-02-15', 35);
    expect(bezug).toBe('2027-03-22');
    const ab = tagPlus(bezug, 28);
    expect(ab).toBe('2027-04-19');
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBe(ab);
    expect(zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie).ernte.ernteAb).toBe(ab);
  });

  it('UC15-AK11 Petersilie ohne bestätigte Anzucht (phase_antwort entfernt): Wachstum aus Keimung typ 14 und Anzucht typ 28 = 15.2. + 42 = 29.3. → ernteAb 26.4.', () => {
    const t = ohnePhasenantwort(vor(), SATZ_VOR.petersilie);
    const b = bezugVon(t, SATZ_VOR.petersilie);
    expect(phaseAm(t, b, '2027-03-18', J, Z)).toBe('anzucht');
    expect(phaseAm(t, b, '2027-03-28', J, Z)).toBe('anzucht');
    expect(tagPlus('2027-02-15', 42)).toBe('2027-03-29');
    expect(phaseAm(t, b, '2027-03-29', J, Z)).toBe('wachstum');
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBe('2027-04-26');
    expect(zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie).ernte.ernteAb).toBe('2027-04-26');
  });

  it('UC15-AK11 TZ phase_antwort Anzucht am 26.2. 23:30 UTC (= 27.2. 00:30 Zürich) zählt als 27.2.: Basilikum ohne Reservierung und umsetzen_ab_d → 9.5.', () => {
    const t = vor();
    const id = uid('4e', 900);
    t['ereignis'] = (t['ereignis'] ?? []).filter(
      (e) => !(e['typ'] === 'phase_antwort' && e['satz_id'] === SATZ_VOR.basilikumSchnitt),
    );
    t['ereignis'].push({
      id,
      client_id: id,
      typ: 'phase_antwort',
      pflanzung_id: null,
      satz_id: SATZ_VOR.basilikumSchnitt,
      netztopf_id: null,
      platz_id: null,
      daten: { phase: 'anzucht', antwort: 'ja', nachgefuehrt: false },
      gilt_ab: '2027-02-26T23:30:00.000Z',
      client_zeit: '2027-02-26T23:30:00.000Z',
      erfasst_am: '2027-02-26T23:30:00.000Z',
      ersetzt_id: null,
      storniert_am: null,
    });
    ohneReservierung(t);
    umsetzenAbSetzen(t, 'ocimum_basilicum', null);
    // nach UTC wäre es der 26.2. → Wachstum 19.3. → 8.5.; in Zürich 27.2. → Wachstum 20.3. → 9.5.
    const b = bezugVon(t, SATZ_VOR.basilikumSchnitt);
    expect(phaseAm(t, b, '2027-03-19', J, Z)).toBe('anzucht');
    expect(phaseAm(t, b, '2027-03-20', J, Z)).toBe('wachstum');
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, undefined, J, Z)).toBe('2027-05-09');
    expect(zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumSchnitt).ernte.ernteAb).toBe('2027-05-09');
  });

  it('UC15-AK11 ohne ernte_ab_d (Petersilie dauerkultur_blatt ernte_ab_d leer): ernteAb undefined, Kurzzeile «Wachstum ab 29.3. · Ernte offen», ersteErnteAb() undefined', () => {
    const t = vor();
    kulturformSetzen(t, 'petroselinum_crispum', 'dauerkultur_blatt', { ernte_ab_d: null });
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBeUndefined();
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie);
    expect(z.ernte.ernteAb).toBeUndefined();
    expect(z.ernte.endeAm).toBe('2027-08-14');
    expect(z.kurz).toBe('Wachstum ab 29.3. · Ernte offen');
  });

  it('UC15-AK11 ohne Anzuchtdauer (dauerSetzen Petersilie anzucht leer): phaseAm() erreicht Wachstum nie → ernteAb undefined', () => {
    const t = vor();
    dauerSetzen(t, SORTE.mooskrause, 'anzucht', [null, null, null]);
    const b = bezugVon(t, SATZ_VOR.petersilie);
    expect(phaseAm(t, b, tagPlus('2027-02-15', 365), J, Z)).toBe('anzucht');
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBeUndefined();
    expect(zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie).ernte.ernteAb).toBeUndefined();
  });

  it('UC15-AK11 Wachstum schon bestätigt ohne Umsetzen (phase_antwort Wachstum am Satz 99): ersteErnteAb() undefined, ernteAb bleibt offen', () => {
    const t = vor();
    phaseDazu(t, SATZ_VOR.petersilie, 'wachstum', '2027-03-10');
    ernteSichtenNachrechnen(t);
    expect(phaseAm(t, bezugVon(t, SATZ_VOR.petersilie), '2027-02-15', J, Z)).toBe('wachstum');
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBeUndefined();
    expect(zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie).ernte.ernteAb).toBeUndefined();
  });
});

describe('UC15-AK12 nach dem Umsetzen, mit Teilernte und bei Einmalernte unverändert', () => {
  it('UC15-AK12 nach dem Umsetzen am 16.3. (Satz 100, geplant 19.3.): ernteAb = ernteStand().moeglichAb = 16.3. + 50 = 5.5., nicht 8.5.', () => {
    const t = vor();
    umsetzenDazu(t, BASILIKUM_SCHNITT, '2.3.5', '2027-03-16', ['A3', 1]);
    ernteSichtenNachrechnen(t);
    expect(umsetzTag(t, BASILIKUM_SCHNITT, Z)).toBe('2027-03-16');
    const ab = tagPlus('2027-03-16', 50);
    expect(ab).toBe('2027-05-05');
    expect(ernteStand(t, BASILIKUM_SCHNITT, J, Z)?.moeglichAb).toBe(ab);
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, '2027-03-16', J, Z)).toBe(ab);
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.basilikumSchnitt);
    expect(z.ernte.ernteAb).toBe(ab);
    expect(z.ernte.ernteAb).not.toBe('2027-05-08');
  });

  it('UC15-AK12 mit Teilernte vor dem Umsetzen (Satz 99, Teilernte 10.3.): naechsterSchnitt = 10.3. + 14 = 24.3., ernteAb undefined; ohne Intervall beide undefined', () => {
    const t = vor();
    ernteDazu(t, PETERSILIE, 'teil', '2027-03-10');
    ernteSichtenNachrechnen(t);
    const z = zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie);
    expect(z.ernte).toEqual({
      ernteart: 'mehrfach',
      naechsterSchnitt: tagPlus('2027-03-10', 14),
      endeAm: '2027-08-14',
      teilernten: 1,
    });
    expect(z.ernte.naechsterSchnitt).toBe('2027-03-24');
    expect(z.ernte.ernteAb).toBeUndefined();

    kulturformSetzen(t, 'petroselinum_crispum', 'dauerkultur_blatt', { ernteintervall_d: null });
    const ohne = zeileVon(erntekalender(t, J, Z), SATZ_VOR.petersilie);
    expect(ohne.ernte.teilernten).toBe(1);
    expect(ohne.ernte.naechsterSchnitt).toBeUndefined();
    expect(ohne.ernte.ernteAb).toBeUndefined();
  });

  it('UC15-AK12 voraussichtlichesEnde() für Satz 99 und 100 unverändert (Saat + Kulturdauer max.: 14.8., 22.6.); endeAm im Erntefenster gleich', () => {
    const t = vor();
    expect(voraussichtlichesEnde(t, PETERSILIE)).toEqual({ ernteart: 'mehrfach', endeAm: '2027-08-14' });
    expect(voraussichtlichesEnde(t, BASILIKUM_SCHNITT, '2027-03-19')).toEqual({
      ernteart: 'mehrfach',
      endeAm: '2027-06-22',
    });
    const k = erntekalender(t, J, Z);
    expect(zeileVon(k, SATZ_VOR.petersilie).ernte.endeAm).toBe('2027-08-14');
    expect(zeileVon(k, SATZ_VOR.basilikumSchnitt).ernte.endeAm).toBe('2027-06-22');
    // Gegenprobe: der neue Termin kommt aus ersteErnteAb(), nicht aus voraussichtlichesEnde()
    expect(ersteErnteAb(t, PETERSILIE, undefined, J, Z)).toBe('2027-04-26');
  });

  it('UC15-AK12 ernteAufgaben() am 10.5. enthält für Satz 99 und 100 keine Aufgabe «Ernte möglich»; ernteStand().moeglichAb bleibt undefined', () => {
    const jetzt = um('2027-05-10');
    const t = vor({ jetzt });
    // Prognosen liegen am 10.5. in der Vergangenheit (26.4., 8.5.)
    expect(ersteErnteAb(t, PETERSILIE, undefined, jetzt, Z)).toBe('2027-04-26');
    expect(ersteErnteAb(t, BASILIKUM_SCHNITT, '2027-03-19', jetzt, Z)).toBe('2027-05-08');
    const aufgaben = ernteAufgaben(t, jetzt, Z).filter((a) => a.typ === 'ernte_moeglich');
    for (const id of [SATZ_VOR.petersilie, SATZ_VOR.basilikumSchnitt])
      expect(
        aufgaben.some((a) => a.satzId === id),
        id,
      ).toBe(false);
    expect(ernteStand(t, PETERSILIE, jetzt, Z)?.moeglichAb).toBeUndefined();
    expect(ernteStand(t, BASILIKUM_SCHNITT, jetzt, Z)?.moeglichAb).toBeUndefined();
  });

  it('UC15-AK12 Einmalernte unverändert: Eichblatt (Satz 96) ernteAb 5.5. aus voraussichtlichesEnde(); ersteErnteAb() für Eichblatt undefined', () => {
    const t = vor();
    const eichblatt = EICHBLATT[1] as string;
    expect(voraussichtlichesEnde(t, eichblatt, '2027-03-31').endeAm).toBe('2027-05-05');
    expect(zeileVon(erntekalender(t, J, Z), SATZ.eichblatt).ernte.ernteAb).toBe('2027-05-05');
    expect(ersteErnteAb(t, eichblatt, '2027-03-31', J, Z)).toBeUndefined();
  });

  it('UC15-AK12 bestehende Sätze 90 bis 96 mit vorUmsetzen: Erntefenster gleich wie ohne Option', () => {
    const ohne = erntekalender(ernteTeile(), J, Z);
    const mit = erntekalender(vor(), J, Z);
    expect(mit.zeilen).toHaveLength(ohne.zeilen.length + 3);
    for (const z of ohne.zeilen) {
      const m = zeileVon(mit, z.satzId);
      expect(m.ernte, z.sorte).toEqual(z.ernte);
      expect(m.marken, z.sorte).toEqual(z.marken);
      expect(m.spaeter, z.sorte).toEqual(z.spaeter);
      expect(m.kurz, z.sorte).toBe(z.kurz);
      expect(m.kennzeichen, z.sorte).toEqual(z.kennzeichen);
    }
    // Basilikum Nr. 92 (dauerkultur_blatt, umgesetzt) bleibt bei ernteStand(); die neue Zeile schnitt wirkt nicht
    expect(zeileVon(mit, SATZ.basilikum).ernte.ernteAb).toBe(tagPlus('2027-02-04', 28));
    expect(satzZeile(vor(), SATZ_VOR.basilikumSchnitt)['sorte_id']).toBe(SORTE_E.basilikum);
  });
});
