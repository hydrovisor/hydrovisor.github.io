// Push-Inhalt und Tagesliste aus der nach R5.6 verteilten Liste (Plan 118 Testliste «Vitest»; R5.1, R5.5, R5.6, EK5;
// R5.6-AK8, R5.6-AK10). Injizierte Uhr, Zeitzone Europe/Zurich; Fixture tests/unit/verteilung-fixture.ts (vier Wechsel
// am Do 14.1.2027) und synthetische Aufgaben aus tests/unit/rundgang-fixture.ts (aufgabe() plus hinweis).
// Vorausgesetzt (Plan 118 Lösungsweg 3, A1, A2, A5):
// - Zeilen ab der zweiten «Titel Code · Hinweis», ohne Hinweis «Titel Code», ohne Ort «Titel · Hinweis».
// - Hinweis wie in Heute (Aufgabenliste.tsx): «mitmarkiert» → «Pumpe mitmarkiert», jeder andere wörtlich.
// - Titel und erste Zeile ohne Hinweis; der Grund («fällig Do») kommt nicht in die Push.
import { describe, expect, it } from 'vitest';
import { einstellungenAus, nurEcht, type Aufgabe, type Gewicht } from '../../src/domain/aufgaben.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { sammelInhalt, tageslisteZeilen } from '../../src/domain/push/inhalt.ts';
import { MESSGERAET, ZONE, platzId, schluessel } from './aufgaben-fixture.ts';
import { aufgabe } from './rundgang-fixture.ts';
import { DO, MI, MI_SIEBEN, vierWechsel } from './verteilung-fixture.ts';

/** Aufgabe am Ort mit Titel, Gewicht und optional Hinweis */
function mit(
  typ: Parameters<typeof aufgabe>[0],
  code: string,
  titel: string,
  hinweis?: string,
  gewicht: Gewicht = 'routine',
): Aufgabe {
  return { ...aufgabe(typ, code), titel, gewicht, ...(hinweis ? { hinweis } : {}) };
}

/** Aufgabe am Messgerät (ohne Ort) mit Hinweis */
function geraet(titel: string, hinweis: string): Aufgabe {
  const a: Partial<Aufgabe> = { ...mit('kalibrieren', 'R-1.1', titel, hinweis) };
  delete a.ort;
  return {
    ...(a as Aufgabe),
    bezug: MESSGERAET,
    bezugArt: 'messgeraet',
    schluessel: `kalibrieren|${MESSGERAET}|2027-01-12`,
  };
}

const zeilen = (text: string) => text.split('\n');

describe('R5.6-AK10 Tagesliste aus der verteilten Liste', () => {
  it('R5.6-AK10 tageslisteZeilen behält die ursprüngliche Fälligkeit des vorgezogenen Wechsels', () => {
    const t = vierWechsel();
    const liste = nurEcht(verteilteAufgaben(t, einstellungenAus(t), MI_SIEBEN, ZONE));
    const vorgezogen = liste.filter((a) => a.typ === 'loesung_wechseln' && a.hinweis === 'vorgezogen');
    expect(vorgezogen).toHaveLength(1);
    const v = vorgezogen[0] as Aufgabe;

    const z = tageslisteZeilen(liste, MI);
    expect(z).toHaveLength(liste.length);
    expect(z.find((x) => x.aufgabe_schluessel === v.schluessel)).toEqual({
      tag: MI,
      aufgabe_schluessel: schluessel('loesung_wechseln', v.bezug, DO),
      typ: 'loesung_wechseln',
      platz_id: v.bezug,
      faellig_am: DO,
    });
    expect(['R-1.1', 'R-1.2', 'R-2.1', 'R-2.2'].map(platzId)).toContain(v.bezug);
    liste.forEach((a, i) => {
      expect(z[i]?.aufgabe_schluessel).toBe(a.schluessel);
      expect(z[i]?.faellig_am).toBe(a.faelligAm);
      expect(z[i]?.tag).toBe(MI);
    });
  });
});

describe('R5.6-AK8 Hinweise in der Sammel-Push', () => {
  it('R5.6-AK8 Zeile mit Hinweis «Titel Code · Hinweis», erste Zeile und Titel ohne Hinweis', () => {
    const liste = [
      mit('loesung_wechseln', 'R-1.1', 'Lösung wechseln', 'vorgezogen', 'wechsel'),
      mit('loesung_wechseln', 'R-1.2', 'Lösung wechseln', '4 Ansätze heute', 'wechsel'),
      mit('loesung_wechseln', 'R-4.4', 'Lösung wechseln', 'mit 1. echte Blätter · vorgezogen', 'wechsel'),
      mit('messen', 'R-2.3', 'Messen'),
    ];
    const inhalt = sammelInhalt(liste);
    expect(zeilen(inhalt.text).slice(1)).toEqual([
      'Lösung wechseln R-1.1 · vorgezogen',
      'Lösung wechseln R-1.2 · 4 Ansätze heute',
      'Lösung wechseln R-4.4 · mit 1. echte Blätter · vorgezogen',
      'Messen R-2.3',
    ]);
    expect(zeilen(inhalt.text)[0]).toBe('Lösung wechseln R-1.1, R-1.2, R-4.4 · Messen R-2.3');
    expect(inhalt.titel).toBe('Hydrovisor heute: 3 Wechsel · 1 Routine');
  });

  it('R5.6-AK8 mitmarkiert als «Pumpe mitmarkiert»', () => {
    const liste = [
      mit('kurzpruefung', 'R-1.1', 'Kurzprüfung', 'mitmarkiert'),
      mit('kurzpruefung', 'R-1.2', 'Kurzprüfung'),
    ];
    const { text } = sammelInhalt(liste);
    expect(zeilen(text).slice(1)).toEqual(['Kurzprüfung R-1.1 · Pumpe mitmarkiert', 'Kurzprüfung R-1.2']);
    expect(zeilen(text)[0]).toBe('Kurzprüfung R-1.1, R-1.2');
  });

  it('R5.6-AK8 Hinweis ohne Ort «Titel · Hinweis»', () => {
    const liste = [geraet('Messgerät kalibrieren', 'vorgezogen'), mit('messen', 'R-2.3', 'Messen')];
    expect(zeilen(sammelInhalt(liste).text)).toEqual([
      'Messgerät kalibrieren · Messen R-2.3',
      'Messgerät kalibrieren · vorgezogen',
      'Messen R-2.3',
    ]);
  });

  it('R5.6-AK8 ohne Hinweis bleibt die Zeile «Titel Code» wie bisher', () => {
    const liste = [mit('messen', 'R-2.3', 'Messen'), mit('kurzpruefung', 'R-3.1', 'Kurzprüfung')];
    expect(zeilen(sammelInhalt(liste).text).slice(1)).toEqual(['Messen R-2.3', 'Kurzprüfung R-3.1']);
  });

  it('R5.5 Nutzlast unter 4 KB auch mit Hinweisen', () => {
    const liste: Aufgabe[] = [];
    for (let i = 1; i <= 60; i += 1)
      liste.push(mit('kurzpruefung', `R-${1 + (i % 4)}.${i}`, 'Messen und nachfüllen', 'mitmarkiert'));
    const inhalt = sammelInhalt(liste);
    const weitere = zeilen(inhalt.text).slice(1);
    expect(weitere).toHaveLength(60);
    for (const z of weitere) expect(z).toMatch(/^Messen und nachfüllen R-\d\.\d+ · Pumpe mitmarkiert$/);
    expect(zeilen(inhalt.text)[0]?.length).toBeLessThanOrEqual(120);
    const nutzlast = JSON.stringify({
      titel: inhalt.titel,
      text: inhalt.text,
      versand_id: '00000000-0000-4000-8000-000000000001',
      signatur: 'x'.repeat(43),
      tag: 'heute',
      url: '#/heute',
    });
    expect(new TextEncoder().encode(nutzlast).length).toBeLessThan(4096);
  });
});
