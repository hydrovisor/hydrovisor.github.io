// Rundgang-Plan (Plan 30 Testliste; UC8 Ablauf 2, Ablauf Rundgang 1 bis 3; R5.1, R5.2, R5.4, G5; A1 bis A3): Ebenen
// und Orte nach dem Laufweg, Kurzprüfungs-Punkte, Mess-Schritte. Der Plan liest nur faelligeAufgaben() (R5.1, keine
// zweite Fälligkeitsrechnung). Uhr Di 12.1.2027 09:00 Zürich; Fixture tests/unit/rundgang-fixture.ts.
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben, type Aufgabe } from '../../src/domain/aufgaben.ts';
import { kurzpruefungPunkte } from '../../src/domain/rundgang/kurzpruefung.ts';
import {
  laufwegRang,
  rundgangAnlage,
  rundgangPlan,
  type RundgangPlan,
} from '../../src/domain/rundgang/plan.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  ZONE,
  aufgabe,
  bereichId,
  platzId,
  regal,
  schluessel,
  zh,
  type Teile,
  type Zeile,
} from './rundgang-fixture.ts';
import { fertig, messungDazu, platzEreignisDazu } from './aufgaben-fixture.ts';

const faellig = (t: Teile) => faelligeAufgaben(t, einstellungenAus(t), JETZT, ZONE);
const planR = (t: Teile) => rundgangPlan(t, faellig(t), ANLAGE.R, JETZT, ZONE);
const orteJeEbene = (p: RundgangPlan) => p.ebenen.map((e) => e.orte.map((o) => o.code));
const ort = (p: RundgangPlan, code: string) => p.ebenen.flatMap((e) => e.orte).find((o) => o.code === code);

/** Rundgang-Aufgaben nach Plan 30 A2 */
const RUNDGANG_TYPEN = new Set([
  'kurzpruefung',
  'wurzeln_pruefen',
  'wuerfel_feucht',
  'belueftung_pruefen',
  'messen_nachfuellen',
  'messen',
  'kontrolle_folgetag',
  'waerme_pruefen',
  'strom_wassertemperatur',
  'strom_messen',
  'nachfuellen_kratky',
]);

describe('Rundgang-Plan', () => {
  it('R5.1 Rundgang folgt dem Laufweg: Ebene 4 (A1, 4.4, 4.5), dann 3, 2, 1', () => {
    const p = planR(regal());
    expect(p.anlageId).toBe(ANLAGE.R);
    expect(p.tag).toBe(HEUTE);
    expect(p.ebenen.map((e) => e.name)).toEqual(['Ebene 4', 'Ebene 3', 'Ebene 2', 'Ebene 1']);
    expect(p.ebenen.map((e) => e.bereichId)).toEqual([4, 3, 2, 1].map(bereichId));
    expect(orteJeEbene(p)).toEqual([
      ['R-A1', 'R-4.4', 'R-4.5'],
      ['R-3.1', 'R-3.2', 'R-3.3'],
      ['R-2.1'],
      ['R-1.1'],
    ]);
    expect(p.ebenen.flatMap((e) => e.orte.map((o) => o.platzId))).toEqual(
      ['R-A1', 'R-4.4', 'R-4.5', 'R-3.1', 'R-3.2', 'R-3.3', 'R-2.1', 'R-1.1'].map((c) => platzId(c)),
    );

    // eigener Laufweg: Ebenen nach ihrem ersten Ort, 3.2 fehlt im Laufweg und folgt am Ende seiner Ebene
    const eigen = planR(regal({ laufweg: ['A1', '4.5', '4.4', '3.3', '3.1', '1.1', '2.1'] }));
    expect(eigen.ebenen.map((e) => e.name)).toEqual(['Ebene 4', 'Ebene 3', 'Ebene 1', 'Ebene 2']);
    expect(orteJeEbene(eigen)).toEqual([
      ['R-A1', 'R-4.5', 'R-4.4'],
      ['R-3.3', 'R-3.1', 'R-3.2'],
      ['R-1.1'],
      ['R-2.1'],
    ]);
  });

  it('R5.1 laufwegRang: genannte Orte nach dem Laufweg, fehlende danach (Anzuchtorte vor Gefässen, nach Kennung)', () => {
    const b4 = bereichId(4);
    const orte = [
      { kennung: '4.5', rolle: 'gefaess', bereichId: b4 },
      { kennung: '4.10', rolle: 'gefaess', bereichId: b4 },
      { kennung: '4.4', rolle: 'gefaess', bereichId: b4 },
      { kennung: 'A2', rolle: 'anzuchtort', bereichId: b4 },
      { kennung: 'A1', rolle: 'anzuchtort', bereichId: b4 },
    ];
    const rang = laufwegRang(['4.4', 'A1'], orte);
    const reihe = [...orte].sort((a, b) => (rang.get(a.kennung) ?? 99) - (rang.get(b.kennung) ?? 99));
    expect(reihe.map((o) => o.kennung)).toEqual(['4.4', 'A1', 'A2', '4.5', '4.10']);
    const ohne = laufwegRang([], orte);
    const reiheOhne = [...orte].sort((a, b) => (ohne.get(a.kennung) ?? 99) - (ohne.get(b.kennung) ?? 99));
    expect(reiheOhne.map((o) => o.kennung)).toEqual(['A1', 'A2', '4.4', '4.5', '4.10']);
  });

  it('R5.1 Rundgang ohne Laufweg: Ebene der Anzuchtorte zuerst, dann 3, 2, 1; innerhalb Anzuchtorte vor Gefässen', () => {
    const p = planR(regal({ laufweg: null }));
    expect(p.ebenen.map((e) => e.name)).toEqual(['Ebene 4', 'Ebene 3', 'Ebene 2', 'Ebene 1']);
    expect(orteJeEbene(p)).toEqual([
      ['R-A1', 'R-4.4', 'R-4.5'],
      ['R-3.1', 'R-3.2', 'R-3.3'],
      ['R-2.1'],
      ['R-1.1'],
    ]);
  });

  it('R5.1 Rundgang zählt n Orte mit Rundgang-Aufgabe; Orte mit Füllzustand leer fehlen (R5.4)', () => {
    const t = regal();
    const l = faellig(t);
    const p = rundgangPlan(t, l, ANLAGE.R, JETZT, ZONE);
    expect(p.orteZahl).toBe(8);
    // 2.2 ist leer: kein Ort im Plan
    expect(ort(p, 'R-2.2')).toBeUndefined();
    // der Plan nimmt genau die fälligen Rundgang-Aufgaben der Anlage aus faelligeAufgaben()
    const imPlan = p.ebenen.flatMap((e) => e.orte.flatMap((o) => o.aufgaben.map((a) => a.schluessel)));
    const erwartet = l
      .filter((a) => a.anlageId === ANLAGE.R && RUNDGANG_TYPEN.has(a.typ))
      .map((a) => a.schluessel);
    expect([...imPlan].sort()).toEqual([...erwartet].sort());
    // Satz-, Geräte- und Umsetzaufgaben bleiben auf Heute (A2)
    const typen = new Set(p.ebenen.flatMap((e) => e.orte.flatMap((o) => o.aufgaben.map((a) => a.typ))));
    for (const typ of ['keimung_pruefen', 'umsetzen', 'ph_kontrolle'])
      expect(typen.has(typ as never), typ).toBe(false);

    // 1.1 geleert: Kurzprüfung und Messung entfallen, Ebene 1 fällt weg
    const leer = regal();
    platzEreignisDazu(leer, 'R-1.1', 'geleert', zh('2027-01-11', '18:00'));
    fertig(leer);
    const pl = planR(leer);
    expect(pl.orteZahl).toBe(7);
    expect(ort(pl, 'R-1.1')).toBeUndefined();
    expect(pl.ebenen.map((e) => e.name)).toEqual(['Ebene 4', 'Ebene 3', 'Ebene 2']);
  });

  it('R5.2 Kurzprüfung-Punkte: DWC, Konstantpegel, Station «Pumpe sprudelt»; Kratky «Luftzone vorhanden»; Direktsaat unter 14 Tagen «Lösung berührt Topfboden», ab 14 Tagen Luftzone', () => {
    const punkte = (lage: Parameters<typeof kurzpruefungPunkte>[0], a: readonly Aufgabe[] = []) =>
      [...kurzpruefungPunkte(lage, a)].sort();
    expect(punkte({ betriebsart: 'dwc', anzuchtort: false })).toEqual(['pumpe']);
    expect(punkte({ betriebsart: 'konstantpegel', anzuchtort: false })).toEqual(['pumpe']);
    expect(punkte({ betriebsart: 'kratky_belueftet', anzuchtort: false })).toEqual(['luftzone']);
    expect(punkte({ betriebsart: 'kratky', anzuchtort: false })).toEqual(['luftzone']);
    // Direktsaat bei Kratky: bis Satzalter 13 Tage Topfboden, ab 14 Tagen Luftzone
    expect(punkte({ betriebsart: 'kratky_belueftet', anzuchtort: false, direktsaatAlterTage: 0 })).toEqual([
      'loesung_topfboden',
    ]);
    expect(punkte({ betriebsart: 'kratky', anzuchtort: false, direktsaatAlterTage: 13 })).toEqual([
      'loesung_topfboden',
    ]);
    expect(punkte({ betriebsart: 'kratky', anzuchtort: false, direktsaatAlterTage: 14 })).toEqual([
      'luftzone',
    ]);
    // DWC mit Direktsaat bleibt bei der Pumpe
    expect(punkte({ betriebsart: 'dwc', anzuchtort: false, direktsaatAlterTage: 5 })).toEqual(['pumpe']);

    // im Plan: Station 4.4 und Konstantpegel 4.5 Pumpe, Ebene 3 Luftzone, Texte wie die Karte
    const p = planR(regal());
    const zeilen = (name: string) =>
      (p.ebenen.find((e) => e.name === name)?.kurzpruefung ?? []).map((z) => `${z.code} ${z.punkt}`);
    expect(zeilen('Ebene 4')).toEqual(
      expect.arrayContaining(['R-A1 wuerfel_feucht', 'R-4.4 pumpe', 'R-4.5 pumpe', 'R-4.5 wurzeln']),
    );
    expect(zeilen('Ebene 4')).toHaveLength(4);
    expect(zeilen('Ebene 3')).toEqual(['R-3.1 luftzone', 'R-3.2 luftzone', 'R-3.3 luftzone']);
    expect(zeilen('Ebene 2')).toEqual(['R-2.1 pumpe']);
    expect(zeilen('Ebene 1')).toEqual(['R-1.1 pumpe']);
    const text = new Map(p.ebenen.flatMap((e) => e.kurzpruefung.map((z) => [z.punkt, z.text] as const)));
    expect(text.get('pumpe')).toBe('Pumpe sprudelt');
    expect(text.get('luftzone')).toBe('Luftzone vorhanden');
    expect(text.get('wurzeln')).toBe('Wurzeln weiss?');
    expect(text.get('wuerfel_feucht')).toBe('Würfel feucht');
    expect(p.ebenen.every((e) => e.mitLichtLuefter)).toBe(true);
    // jede Zeile trägt die Aufgabe, die sie erledigt
    const z45 = p.ebenen[0]?.kurzpruefung.find((z) => z.punkt === 'wurzeln');
    expect(z45?.aufgabe.schluessel).toBe(schluessel('wurzeln_pruefen', platzId('R-4.5'), HEUTE));
    const z44 = p.ebenen[0]?.kurzpruefung.find((z) => z.code === 'R-4.4');
    expect(z44?.aufgabe.schluessel).toBe(schluessel('kurzpruefung', platzId('R-4.4'), HEUTE));
  });

  it('R5.2 «Wurzeln weiss?» nur bei fälligem wurzeln_pruefen; «Würfel feucht» nur bei Box mit Satz', () => {
    const dwc = { betriebsart: 'dwc', anzuchtort: false };
    expect([...kurzpruefungPunkte(dwc, [aufgabe('wurzeln_pruefen', 'R-1.1')])].sort()).toEqual([
      'pumpe',
      'wurzeln',
    ]);
    expect(kurzpruefungPunkte(dwc, [aufgabe('kurzpruefung', 'R-1.1')])).not.toContain('wurzeln');
    const box = { anzuchtort: true };
    expect(kurzpruefungPunkte(box, [aufgabe('wuerfel_feucht', 'R-A1')])).toEqual(['wuerfel_feucht']);
    expect(kurzpruefungPunkte(box, [])).toEqual([]);

    // im Plan: Wurzeln nur in 4.5 (fällig 12.1.), Würfel feucht nur in A1; A3 ohne Satz fehlt ganz
    const p = planR(regal());
    const alle = p.ebenen.flatMap((e) => e.kurzpruefung);
    expect(alle.filter((z) => z.punkt === 'wurzeln').map((z) => z.code)).toEqual(['R-4.5']);
    expect(alle.filter((z) => z.punkt === 'wuerfel_feucht').map((z) => z.code)).toEqual(['R-A1']);
    expect(ort(p, 'R-A3')).toBeUndefined();
  });

  it('R5.2 Mess-Schritt nimmt war_faellig_am und aufgabe_schluessel der fälligen Mess-Aufgabe; Station und DWC mit Nachfüllen-Angebot, Kratky ohne', () => {
    const p = planR(regal());
    for (const code of ['R-4.4', 'R-2.1', 'R-1.1']) {
      const o = ort(p, code);
      expect(o?.messAufgabe, code).toMatchObject({
        typ: 'messen_nachfuellen',
        faelligAm: HEUTE,
        schluessel: schluessel('messen_nachfuellen', platzId(code), HEUTE),
      });
      expect(o?.nachfuellen, code).toBe(true);
    }
    expect(ort(p, 'R-3.1')?.messAufgabe).toMatchObject({
      typ: 'messen',
      schluessel: schluessel('messen', platzId('R-3.1'), HEUTE),
    });
    expect(ort(p, 'R-3.1')?.nachfuellen).toBe(false);
    expect(ort(p, 'R-3.1')?.betriebsart).toBe('kratky_belueftet');
    // ohne fällige Messung kein Mess-Schritt: 3.2 (Messen 13.1.), 4.5, A1
    for (const code of ['R-3.2', 'R-4.5', 'R-A1']) {
      expect(ort(p, code)?.messAufgabe, code).toBeUndefined();
      expect(ort(p, code)?.nachfuellen, code).toBe(false);
    }

    // Wärme prüfen fällig (24.5 °C am 11.1.), Messen erst 13.1.: Mess-Schritt mit Wärme prüfen, kein Nachfüllen
    const warm = regal();
    messungDazu(warm, 'R-1.1', { gilt: zh('2027-01-11'), temperatur: 24.5 });
    const w = ort(planR(fertig(warm)), 'R-1.1');
    expect(w?.messAufgabe).toMatchObject({ typ: 'waerme_pruefen', faelligAm: HEUTE });
    expect(w?.nachfuellen).toBe(false);
    // beide fällig (24.5 °C am 10.1.): erste nach Tabellenreihenfolge ist Messen und nachfüllen
    const beide = regal();
    const m = (beide['messung'] ?? []).find((z: Zeile) => z['platz_id'] === platzId('R-1.1')) as Zeile;
    m['temperatur'] = 24.5;
    const b = ort(planR(fertig(beide)), 'R-1.1');
    expect(b?.messAufgabe?.typ).toBe('messen_nachfuellen');
    expect(b?.aufgaben.map((a) => a.typ)).toEqual(
      expect.arrayContaining(['messen_nachfuellen', 'waerme_pruefen']),
    );
    expect(b?.nachfuellen).toBe(true);
  });

  it('G5 Rundgang der echten Anlage enthält keine Demo-Orte; ohne echte Anlage die erste Demo-Anlage', () => {
    const t = regal();
    expect(rundgangAnlage(t)?.id).toBe(ANLAGE.R);
    const p = planR(t);
    const codes = p.ebenen.flatMap((e) => e.orte.map((o) => o.code));
    expect(codes.some((c) => c.startsWith('X-'))).toBe(false);
    expect(
      p.ebenen.flatMap((e) => e.orte.flatMap((o) => o.aufgaben)).every((a) => a.anlageId === ANLAGE.R),
    ).toBe(true);

    // R als Testanlage: echt fehlt, demo vor test
    const ohneEcht = regal();
    const r = (ohneEcht['anlage'] ?? []).find((a: Zeile) => a['id'] === ANLAGE.R) as Zeile;
    r['datenart'] = 'test';
    expect(rundgangAnlage(ohneEcht)?.id).toBe(ANLAGE.X);
    const px = rundgangPlan(ohneEcht, faellig(ohneEcht), ANLAGE.X, JETZT, ZONE);
    expect(px.anlageId).toBe(ANLAGE.X);
    expect(px.ebenen.flatMap((e) => e.orte.map((o) => o.code))).toEqual(['X-1.1']);
    expect(px.orteZahl).toBe(1);
  });
});
