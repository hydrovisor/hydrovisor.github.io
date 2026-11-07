// Inhalt der Pushes (Plan 31 Schnittstellen `src/domain/push/inhalt.ts` und Testliste «Vitest»; R5.5 Titel nach Gewicht,
// R5.1 gleiche Liste, R5.4, G5; Annahmen A1 bis A3, A10). Seit I1b-06 ersetzen sammelInhalt(), kurzpruefungOffen(),
// kurzpruefungInhalt(), timerInhalt() und tageslisteZeilen() die Übergangsliste tagesliste()/pushText() aus Plan 13
// (Plan 31 «Anpassung geschützter Tests»: push-inhalt.test.ts neu auf sammelInhalt()).
// Vorausgesetzt (Plan 31 Schnittstellen):
// - sammelInhalt(aufgaben) erwartet die schon gefilterte echte Liste; Titel «Hydrovisor heute: 1 Ausserhalb · 2 Wechsel
//   · 9 Routine» (Gruppen mit 0 entfallen, A1), bei 0 Aufgaben «Hydrovisor heute: nichts fällig» (A2).
// - Erste Zeile von text: Aufgaben nach Gewicht (Ausserhalb, Wechsel, Routine), innerhalb in der gegebenen Reihenfolge,
//   gleicher Titel zusammengefasst («Messen R-2.3, R-3.1»), Teile mit « · » getrennt, höchstens 120 Zeichen, Rest
//   «+ n weitere» (A3). Weitere Zeilen: je Aufgabe «Titel Code» (ohne Ort nur der Titel).
// - kurzpruefungOffen(aufgaben, heute): Aufgaben kurzpruefung mit faelligAm = heute; kurzpruefungInhalt(offen) mit
//   Titel «Hydrovisor: Kurzprüfung offen» und Text «Noch offen: R-1.1, R-1.2».
// - timerInhalt({ typ, code }): «Timer abgelaufen · R-2.3», Text «Weiter mit der Abhakliste» bzw. «Jetzt nachmessen»,
//   url #/ansatz/R-2.3 bzw. #/heute (A10).
// - tageslisteZeilen(aufgaben, tag): { tag, aufgabe_schluessel, typ, platz_id (nur bei bezugArt platz), faellig_am }.
import { describe, expect, it } from 'vitest';
import {
  einstellungenAus,
  faelligeAufgaben,
  nurEcht,
  type Aufgabe,
  type Gewicht,
} from '../../src/domain/aufgaben.ts';
import {
  kurzpruefungInhalt,
  kurzpruefungOffen,
  sammelInhalt,
  tageslisteZeilen,
  timerInhalt,
} from '../../src/domain/push/inhalt.ts';
import { MESSGERAET, grundstand, jetztAm } from './aufgaben-fixture.ts';
import { STICHTAG, TEILE_DREI_ROUTINE, ZONE } from './push-fixture.ts';
import { aufgabe } from './rundgang-fixture.ts';

/** Aufgabe am Ort mit Gewicht und Titel */
function mit(
  typ: Parameters<typeof aufgabe>[0],
  code: string,
  gewicht: Gewicht = 'routine',
  titel?: string,
  faelligAm = '2027-01-12',
): Aufgabe {
  const a = aufgabe(typ, code, faelligAm);
  return { ...a, gewicht, ...(titel ? { titel } : {}) };
}

/** Aufgabe am Messgerät (ohne Ort) */
function geraet(typ: 'kalibrieren' | 'ph_kontrolle', titel: string): Aufgabe {
  const a: Partial<Aufgabe> = { ...mit(typ, 'R-1.1', 'routine', titel) };
  delete a.ort;
  return {
    ...(a as Aufgabe),
    bezug: MESSGERAET,
    bezugArt: 'messgeraet',
    schluessel: `${typ}|${MESSGERAET}|2027-01-12`,
  };
}

const ersteZeile = (text: string) => text.split('\n')[0] ?? '';

describe('sammelInhalt (R5.5)', () => {
  it('R5.5 Titel nach Gewicht «Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 9 Routine»', () => {
    const liste = [
      mit('messen_nachfuellen', 'R-2.3', 'ausserhalb', 'Messen und nachfüllen'),
      mit('loesung_wechseln', 'R-1.1', 'wechsel', 'Lösung wechseln'),
      mit('ansatz', 'R-1.2', 'wechsel', 'Ansatz für Umsetzen'),
      ...['R-1.1', 'R-1.2', 'R-2.1', 'R-2.3', 'R-3.1', 'R-3.2', 'R-3.3', 'R-4.4', 'R-4.5'].map((c) =>
        mit('kurzpruefung', c, 'routine', 'Kurzprüfung'),
      ),
    ];
    const inhalt = sammelInhalt(liste);
    expect(inhalt.titel).toBe('Hydrovisor heute: 1 Ausserhalb · 2 Wechsel · 9 Routine');
    expect(inhalt.anzahl).toBe(12);
    expect(inhalt.gewicht).toEqual({ ausserhalb: 1, wechsel: 2, routine: 9 });
  });

  it('R5.5 Gruppen mit 0 entfallen (A1)', () => {
    expect(sammelInhalt([mit('kurzpruefung', 'R-1.1'), mit('kurzpruefung', 'R-1.2')]).titel).toBe(
      'Hydrovisor heute: 2 Routine',
    );
    expect(sammelInhalt([mit('loesung_wechseln', 'R-1.1', 'wechsel', 'Lösung wechseln')]).titel).toBe(
      'Hydrovisor heute: 1 Wechsel',
    );
    expect(
      sammelInhalt([
        mit('waerme_pruefen', 'R-2.1', 'ausserhalb', 'Wärme prüfen'),
        mit('kurzpruefung', 'R-1.1'),
      ]).titel,
    ).toBe('Hydrovisor heute: 1 Ausserhalb · 1 Routine');
  });

  it('R5.5 0 Aufgaben: «Hydrovisor heute: nichts fällig» (A2)', () => {
    const inhalt = sammelInhalt([]);
    expect(inhalt.titel).toBe('Hydrovisor heute: nichts fällig');
    expect(inhalt.anzahl).toBe(0);
    expect(inhalt.gewicht).toEqual({ ausserhalb: 0, wechsel: 0, routine: 0 });
  });

  it('R5.5 erste Zeile: Ausserhalb vor Wechsel vor Routine, gleicher Titel zusammengefasst', () => {
    // Reihenfolge der Eingabe wie faelligeAufgaben() (nach Ort), das Gewicht ordnet die erste Zeile
    const liste = [
      mit('messen', 'R-2.3', 'routine', 'Messen'),
      mit('kurzpruefung', 'R-2.3', 'routine', 'Kurzprüfung'),
      mit('messen', 'R-3.1', 'routine', 'Messen'),
      mit('loesung_wechseln', 'R-3.1', 'wechsel', 'Lösung wechseln'),
      mit('waerme_pruefen', 'R-3.2', 'ausserhalb', 'Wärme prüfen'),
    ];
    expect(ersteZeile(sammelInhalt(liste).text)).toBe(
      'Wärme prüfen R-3.2 · Lösung wechseln R-3.1 · Messen R-2.3, R-3.1 · Kurzprüfung R-2.3',
    );
  });

  it('R5.5 Aufgabe ohne Ort nur mit Titel; weitere Zeilen je Aufgabe «Titel Code»', () => {
    const liste = [
      geraet('kalibrieren', 'Messgerät kalibrieren'),
      mit('messen', 'R-2.3', 'routine', 'Messen'),
    ];
    const { text } = sammelInhalt(liste);
    expect(text.split('\n')).toEqual([
      'Messgerät kalibrieren · Messen R-2.3',
      'Messgerät kalibrieren',
      'Messen R-2.3',
    ]);
  });

  it('R5.5 erste Zeile höchstens 120 Zeichen mit «+ n weitere» (A3); Nutzlast unter 4 KB bei 60 Aufgaben', () => {
    const titel = [
      'Messen und nachfüllen',
      'Kurzprüfung',
      'Wurzeln prüfen',
      'Würfel feucht',
      'Gefäss prüfen',
    ];
    const liste: Aufgabe[] = [];
    for (let i = 1; i <= 60; i += 1)
      liste.push(mit('kurzpruefung', `R-${1 + (i % 4)}.${i}`, 'routine', `${titel[i % 5]} ${i % 7}`));
    const inhalt = sammelInhalt(liste);
    const erste = ersteZeile(inhalt.text);
    expect(erste.length).toBeLessThanOrEqual(120);
    expect(erste).toMatch(/ \+ \d+ weitere$/);
    expect(inhalt.text.split('\n')).toHaveLength(61);
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

  it('R5.5 erste Zeile unter 120 Zeichen bleibt ohne «+ n weitere»', () => {
    // sechs Teile «Aufgabe A R-1.1» (je 15 Zeichen) mit « · » ergeben 105 Zeichen
    const liste = ['A', 'B', 'C', 'D', 'E', 'F'].map((b, i) =>
      mit('messen', `R-1.${i + 1}`, 'routine', `Aufgabe ${b}`),
    );
    const erste = ersteZeile(sammelInhalt(liste).text);
    expect(erste).toBe(liste.map((a) => `${a.titel} ${a.ort?.code}`).join(' · '));
    expect(erste).not.toMatch(/weitere/);
  });

  it('R5.1 G5 Liste aus nurEcht(faelligeAufgaben()) der Push-Fixture: «Hydrovisor heute: 7 Routine»', () => {
    const liste = nurEcht(
      faelligeAufgaben(TEILE_DREI_ROUTINE, einstellungenAus(TEILE_DREI_ROUTINE), STICHTAG, ZONE),
    );
    const inhalt = sammelInhalt(liste);
    expect(inhalt.titel).toBe('Hydrovisor heute: 7 Routine');
    expect(ersteZeile(inhalt.text)).toBe(
      'Messgerät kalibrieren · pH-Kontrolle · Messen und nachfüllen R-2.3, R-3.1 · Kurzprüfung R-2.3, R-3.1, R-4.1',
    );
    expect(inhalt.text).not.toContain('D-');
  });
});

describe('Kurzprüfung offen (R5.5, R5.4)', () => {
  it('R5.5 kurzpruefungOffen: nur Kurzprüfungen mit faelligAm = heute', () => {
    const liste = [
      mit('kurzpruefung', 'R-1.1'),
      mit('messen', 'R-1.1', 'routine', 'Messen'),
      mit('kurzpruefung', 'R-1.2'),
      mit('kurzpruefung', 'R-2.1', 'routine', 'Kurzprüfung', '2027-01-11'),
    ];
    expect(kurzpruefungOffen(liste, '2027-01-12').map((a) => a.ort?.code)).toEqual(['R-1.1', 'R-1.2']);
    expect(kurzpruefungOffen([], '2027-01-12')).toEqual([]);
  });

  it('R5.5 kurzpruefungInhalt: «Hydrovisor: Kurzprüfung offen», «Noch offen: R-1.1, R-1.2»', () => {
    const offen = kurzpruefungOffen(
      [mit('kurzpruefung', 'R-1.1'), mit('kurzpruefung', 'R-1.2')],
      '2027-01-12',
    );
    expect(kurzpruefungInhalt(offen)).toEqual({
      titel: 'Hydrovisor: Kurzprüfung offen',
      text: 'Noch offen: R-1.1, R-1.2',
    });
  });

  it('TP7 Grundstand 12.1. 20:00: offen sind die echten Orte R-1.1 und R-3.3', () => {
    const t = grundstand();
    const jetzt = jetztAm('2027-01-12', '20:00');
    const offen = kurzpruefungOffen(
      nurEcht(faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE)),
      '2027-01-12',
    );
    expect(kurzpruefungInhalt(offen).text).toBe('Noch offen: R-1.1, R-3.3');
  });
});

describe('timerInhalt (R5.5, A10)', () => {
  it('TP5 Neuansatz: «Timer abgelaufen · R-2.3», Abhakliste, url #/ansatz/R-2.3', () => {
    expect(timerInhalt({ typ: 'neuansatz', code: 'R-2.3' })).toEqual({
      titel: 'Timer abgelaufen · R-2.3',
      text: 'Weiter mit der Abhakliste',
      url: '#/ansatz/R-2.3',
    });
  });

  it('TP5 pH-Korrektur: «Jetzt nachmessen», url #/heute', () => {
    expect(timerInhalt({ typ: 'ph_korrektur', code: 'R-3.1' })).toEqual({
      titel: 'Timer abgelaufen · R-3.1',
      text: 'Jetzt nachmessen',
      url: '#/heute',
    });
  });
});

describe('tageslisteZeilen (EK5)', () => {
  it('EK5 je Aufgabe eine Zeile; platz_id nur bei bezugArt platz', () => {
    const liste = [
      geraet('ph_kontrolle', 'pH-Kontrolle'),
      mit('gefaess_pruefen', 'R-2.2', 'routine', 'Gefäss prüfen', '2027-01-08'),
    ];
    const [ph, gefaess] = liste;
    expect(tageslisteZeilen(liste, '2027-01-12')).toEqual([
      {
        tag: '2027-01-12',
        aufgabe_schluessel: ph?.schluessel,
        typ: 'ph_kontrolle',
        platz_id: null,
        faellig_am: '2027-01-12',
      },
      {
        tag: '2027-01-12',
        aufgabe_schluessel: gefaess?.schluessel,
        typ: 'gefaess_pruefen',
        platz_id: gefaess?.bezug,
        faellig_am: '2027-01-08',
      },
    ]);
  });

  it('EK5 Satz-Aufgabe: platz_id null, Schlüssel aus der Aufgabe', () => {
    const satz: Aufgabe = {
      ...mit('umsetzen', 'R-A1'),
      bezugArt: 'satz',
      bezug: 'd0000000-0000-4000-8000-000000000001',
    };
    expect(tageslisteZeilen([satz], '2027-01-12')[0]?.platz_id).toBeNull();
  });
});
