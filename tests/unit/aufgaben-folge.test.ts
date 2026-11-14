// «Nächste Aufgabe» als reine Domänenfunktion (Issue #224, Plan 224 Entscheide 5 und 6, Testliste; UX2-AK1; R5.1,
// R5.2, R5.3, G1, G2). Injizierte Uhr Di 12.1.2027 09:00 Zürich (bzw. die Uhr des jeweiligen Datenstands), Zeitzone
// Europe/Zurich; keine Systemzeit. Datenstände:
// - rundgangTeile() (tests/fixtures/rundgang.ts): Laufweg 1.1, 2.1, 3.1; Heute-Folge «Messen und nachfüllen» R-1.1,
//   Kurzprüfung R-1.1, «Messen und nachfüllen» R-2.1, Kurzprüfung R-2.1, Reinigen R-2.2 und R-2.3, «Messen» R-3.1,
//   Kurzprüfung R-3.1, «Gefäss prüfen» R-3.3.
// - grundstand() (tests/unit/aufgaben-fixture.ts): alle Aufgabentypen der Aufgaben-Rechnung, pH-Kontrolle ohne Ort,
//   zwei Umsetzaufgaben (Satz 2 ohne Zieltopf, Satz 1 mit freiem Zieltopf).
// - umsetzTeile() am 28.1.2027 (tests/fixtures/umsetzen.ts): Umsetzen Rucola (ohne Ziel), Lollo Rossa und Ochsenherz
//   (beide wie geplant) nach den Ortskarten.
// Keine Personendaten.
//
// Vertrag (Plan 224 Entscheid 5): heuteFolge() ist die Reihenfolge von Heute (ohne Ort, Ortskarten aus heuteKarten(),
// dann umsetzAufgaben(); ohne Kalibrieren und Umsetzen der Aufgaben-Rechnung). folgeAufgabe() nimmt nur Einträge mit
// eigener Maske und ohne dasselbe Ziel wie der Bezug; Position nach der ersten Stelle des Bezugs in `vorher`, sonst
// Umlauf an den Anfang (A7); ohne Bezug der erste Eintrag mit Maske; ohne Kandidat undefined.
import { describe, expect, it } from 'vitest';
import { aufgabeZiel, folgeAufgabe, heuteFolge, type AufgabenZiel } from '../../src/domain/aufgaben-folge.ts';
import { einstellungenAus, type Aufgabe, type AufgabenArt } from '../../src/domain/aufgaben.ts';
import { TYPEN } from '../../src/domain/aufgaben-aufschub.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { umsetzAufgaben } from '../../src/domain/anzucht/umsetzen.ts';
import { heuteKarten } from '../../src/domain/rundgang/heute.ts';
import type { Teile } from '../../src/domain/anlage/teile.ts';
import {
  JETZT as RUNDGANG_JETZT,
  rundgangMessungDazu,
  rundgangTeile,
  MESSUNG_ALT,
} from '../fixtures/rundgang.ts';
import { sichtenNachrechnen } from '../fixtures/sichten.ts';
import { SATZ, UMSETZ_FAELLIG, umsetzTeile } from '../fixtures/umsetzen.ts';
import { aufschubDazu, grundstand, JETZT as GRUND_JETZT, satzId } from './aufgaben-fixture.ts';
import { aufgabe } from './rundgang-fixture.ts';

const Z = 'Europe/Zurich';

const faellig = (t: Teile, jetzt: Date): Aufgabe[] => verteilteAufgaben(t, einstellungenAus(t), jetzt, Z);
const folge = (t: Teile, jetzt: Date) => heuteFolge(t, faellig(t, jetzt), jetzt, Z);
/** Schlüsselfolge von Heute beim Öffnen der Maske */
const vorherVon = (t: Teile, jetzt: Date): string[] => folge(t, jetzt).map((e) => e.schluessel);
const messen = (code: string): AufgabenZiel => ({ name: 'messen', code }) as AufgabenZiel;
const pruefen = (code: string): AufgabenZiel => ({ name: 'pruefen', code }) as AufgabenZiel;
const umsetzen = (satz: string): AufgabenZiel => ({ name: 'umsetzen', satz }) as AufgabenZiel;

describe('UX2-AK1 folgeAufgabe() im Rundgang-Stand (Laufweg 1.1, 2.1, 3.1)', () => {
  it('UX2-AK1 nach der Messung in R-1.1 ist «Messen und nachfüllen» R-2.1 die nächste Aufgabe, Route messen R-2.1 (Laufweg)', () => {
    const t = rundgangTeile();
    const vorher = vorherVon(t, RUNDGANG_JETZT);
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: messen('R-1.1'), vorher });
    expect(f).toBeDefined();
    expect(f?.titel).toBe('Messen und nachfüllen');
    expect(f?.ort).toMatch(/2\.1$/);
    expect(f?.ziel).toEqual(messen('R-2.1'));
    expect(f?.schluessel).toBe(
      faellig(t, RUNDGANG_JETZT).find((a) => a.typ === 'messen_nachfuellen' && a.ort?.code === 'R-2.1')
        ?.schluessel,
    );
  });

  it('UX2-AK1 ist die Messung schon im Bündel (Aufgabe weg), entscheidet die Folge beim Öffnen: weiter R-3.1, nicht der Anfang', () => {
    const start = rundgangTeile();
    const vorher = vorherVon(start, RUNDGANG_JETZT);
    // Messung in R-2.1 gespeichert und das Bündel nachgeladen: «Messen und nachfüllen» R-2.1 ist weg
    const t = rundgangTeile();
    rundgangMessungDazu(t, { kennung: '2.1', ec: 1.2 });
    sichtenNachrechnen(t);
    expect(
      faellig(t, RUNDGANG_JETZT).some((a) => a.typ === 'messen_nachfuellen' && a.ort?.code === 'R-2.1'),
      'Vorbedingung: Aufgabe R-2.1 erledigt',
    ).toBe(false);
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: messen('R-2.1'), vorher });
    expect(f?.ziel).toEqual(messen('R-3.1'));
    expect(f?.titel).toBe('Messen');
  });

  it('UX2-AK1 eine weitere Aufgabe mit derselben Maske am selben Ort wird übersprungen (Wärme prüfen in R-1.1)', () => {
    const t = rundgangTeile();
    for (const m of t['messung'] ?? []) if (m['id'] === MESSUNG_ALT['1.1']) m['temperatur'] = 24.5;
    sichtenNachrechnen(t);
    const r11 = faellig(t, RUNDGANG_JETZT).filter((a) => a.ort?.code === 'R-1.1');
    expect(
      r11.map((a) => a.typ),
      'Vorbedingung: Messen und Wärme prüfen in R-1.1',
    ).toEqual(expect.arrayContaining(['messen_nachfuellen', 'waerme_pruefen']));
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, {
      ziel: messen('R-1.1'),
      vorher: vorherVon(t, RUNDGANG_JETZT),
    });
    expect(f?.ziel).toEqual(messen('R-2.1'));
    expect(f?.titel).toBe('Messen und nachfüllen');
  });

  it('UX2-AK1 nach der letzten Aufgabe Umlauf an den Anfang; ohne weitere Aufgabe mit Maske undefined', () => {
    const start = rundgangTeile();
    const vorher = vorherVon(start, RUNDGANG_JETZT);
    // «Gefäss prüfen» R-3.3 ist die letzte Aufgabe mit Maske: Umlauf zu R-1.1
    const umlauf = folgeAufgabe(start, RUNDGANG_JETZT, Z, { ziel: pruefen('R-3.3'), vorher });
    expect(umlauf?.ziel).toEqual(messen('R-1.1'));
    expect(umlauf?.titel).toBe('Messen und nachfüllen');

    // alle Messungen gespeichert: übrig sind Kurzprüfungen und Reinigen (ohne eigene Maske) und R-3.3 selbst
    const t = rundgangTeile();
    rundgangMessungDazu(t, { kennung: '1.1', ec: 1.2 });
    rundgangMessungDazu(t, { kennung: '2.1', ec: 1.2 });
    rundgangMessungDazu(t, { kennung: '3.1', ec: 1.0, fuellstand: 'ueber_drittel' });
    sichtenNachrechnen(t);
    expect(
      faellig(t, RUNDGANG_JETZT).some((a) => a.typ === 'messen_nachfuellen' || a.typ === 'messen'),
      'Vorbedingung: keine Messung mehr fällig',
    ).toBe(false);
    expect(folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: pruefen('R-3.3'), vorher })).toBeUndefined();
  });

  it('UX2-AK1 ohne Bezug (Säen) die erste Aufgabe mit Maske', () => {
    const f = folgeAufgabe(rundgangTeile(), RUNDGANG_JETZT, Z);
    expect(f?.ziel).toEqual(messen('R-1.1'));
    expect(f?.titel).toBe('Messen und nachfüllen');
  });

  it('UX2-AK1 ohne Schlüsselfolge beim Öffnen (Bündel noch nicht geladen) beginnt die Folge vorne, ohne den Bezug', () => {
    const f = folgeAufgabe(rundgangTeile(), RUNDGANG_JETZT, Z, { ziel: messen('R-2.1'), vorher: [] });
    expect(f?.ziel).toEqual(messen('R-1.1'));
    const ohneErste = folgeAufgabe(rundgangTeile(), RUNDGANG_JETZT, Z, { ziel: messen('R-1.1'), vorher: [] });
    expect(ohneErste?.ziel).toEqual(messen('R-2.1'));
  });

  it('UX2-AK1 «Morgen» gesetzt: die verschobene Aufgabe ist keine Folgeaufgabe, nach Storno des Aufschubs wieder', () => {
    const start = rundgangTeile();
    const vorher = vorherVon(start, RUNDGANG_JETZT);
    const messen31 = faellig(start, RUNDGANG_JETZT).find(
      (a) => a.typ === 'messen' && a.ort?.code === 'R-3.1',
    );
    expect(messen31?.morgen.erlaubt, 'Vorbedingung: Morgen erlaubt').toBe(true);

    const verschoben = rundgangTeile();
    aufschubDazu(verschoben, {
      schluessel: messen31?.schluessel ?? '',
      art: 'morgen',
      gesetztAm: '2027-01-12',
    });
    const f = folgeAufgabe(verschoben, RUNDGANG_JETZT, Z, { ziel: messen('R-2.1'), vorher });
    expect(f?.ziel).toEqual(pruefen('R-3.3'));

    const storniert = rundgangTeile();
    aufschubDazu(storniert, {
      schluessel: messen31?.schluessel ?? '',
      art: 'morgen',
      gesetztAm: '2027-01-12',
      storniert: true,
    });
    const g = folgeAufgabe(storniert, RUNDGANG_JETZT, Z, { ziel: messen('R-2.1'), vorher });
    expect(g?.ziel).toEqual(messen('R-3.1'));
  });

  it('UX2-AK1 TZ Kalendertag: um 23:59 und 00:01 Zürich (jetzt injiziert) wechselt die Fälligkeit, nicht die Reihenfolge', () => {
    const t = rundgangTeile();
    const vor = new Date('2027-01-12T22:59:00.000Z'); // Di 12.1. 23:59 Zürich
    const nach = new Date('2027-01-12T23:01:00.000Z'); // Mi 13.1. 00:01 Zürich
    const a = folge(t, vor);
    const b = folge(t, nach);
    // Fälligkeit wechselt: die Schlüssel der Kurzprüfungen tragen den neuen Tag
    expect(a.map((e) => e.schluessel)).not.toEqual(b.map((e) => e.schluessel));
    expect(b.some((e) => e.schluessel.endsWith('|2027-01-13'))).toBe(true);
    expect(a.some((e) => e.schluessel.endsWith('|2027-01-13'))).toBe(false);
    // Reihenfolge bleibt: gleiche Titel, Orte und Ziele in gleicher Folge
    const form = (l: typeof a) => l.map((e) => [e.titel, e.ort, e.ziel]);
    expect(form(b)).toEqual(form(a));
    // die Folgeaufgabe nach R-1.1 bleibt R-2.1, auch mit der Schlüsselfolge vom Vortag
    const vorher = a.map((e) => e.schluessel);
    expect(folgeAufgabe(t, vor, Z, { ziel: messen('R-1.1'), vorher })?.ziel).toEqual(messen('R-2.1'));
    expect(folgeAufgabe(t, nach, Z, { ziel: messen('R-1.1'), vorher })?.ziel).toEqual(messen('R-2.1'));
  });
});

describe('UX2-AK1 folgeAufgabe() und heuteFolge() im Grundstand', () => {
  it('UX2-AK1 Aufgaben ohne eigene Maske (Würfel feucht, Deckel öffnen, Kurzprüfung, pH-Kontrolle, Kalibrieren) werden übersprungen', () => {
    const t = grundstand();
    // Heute beginnt mit pH-Kontrolle (ohne Ort), Würfel feucht R-A1, Würfel feucht und Deckel öffnen R-A3, Station
    // R-4.4: keine davon hat eine eigene Maske; erste Aufgabe mit Maske ist «Messen» R-3.1
    const ohneBezug = folgeAufgabe(t, GRUND_JETZT, Z);
    expect(ohneBezug?.ziel).toEqual(messen('R-3.1'));
    expect(ohneBezug?.titel).toBe('Messen');

    // nach «Messen und nachfüllen» R-1.1 folgt nicht die Kurzprüfung R-1.1, sondern «Ansatz für Umsetzen» R-1.2
    const vorher = vorherVon(t, GRUND_JETZT);
    const f = folgeAufgabe(t, GRUND_JETZT, Z, { ziel: messen('R-1.1'), vorher });
    expect(f?.ziel).toEqual({ name: 'ansatz', code: 'R-1.2' });
    expect(f?.titel).toBe('Ansatz für Umsetzen');

    // Kalibrieren steht nie in der Folge (Kopf «Messgerät»)
    const u = umsetzTeile({ jetzt: UMSETZ_FAELLIG });
    expect(
      faellig(u, UMSETZ_FAELLIG).some((a) => a.typ === 'kalibrieren'),
      'Vorbedingung',
    ).toBe(true);
    const fu = folge(u, UMSETZ_FAELLIG);
    expect(fu.some((e) => e.schluessel.startsWith('kalibrieren|'))).toBe(false);
    expect(fu.some((e) => e.ziel?.name === 'kalibrieren')).toBe(false);
    const erste = folgeAufgabe(u, UMSETZ_FAELLIG, Z);
    expect(erste?.ziel.name).not.toBe('kalibrieren');
  });

  it('UX2-AK1 Reihenfolge wie Heute: ohne Ort, Ortskarten aus heuteKarten(), dann Umsetzen; heuteFolge() gleich der Folge der Aufgabenliste', () => {
    const t = grundstand();
    const f = faellig(t, GRUND_JETZT);
    const liste = f.filter((a) => a.typ !== 'umsetzen' && a.typ !== 'kalibrieren');
    const erwartet = [...liste.filter((a) => !a.ort), ...heuteKarten(t, liste).flatMap((k) => k.aufgaben)];
    const umsetz = umsetzAufgaben(t, GRUND_JETZT, Z);
    expect(umsetz.length, 'Vorbedingung: zwei Umsetzaufgaben').toBe(2);

    const ist = heuteFolge(t, f, GRUND_JETZT, Z);
    expect(ist).toHaveLength(erwartet.length + umsetz.length);
    expect(ist.slice(0, erwartet.length).map((e) => e.schluessel)).toEqual(erwartet.map((a) => a.schluessel));
    expect(ist.slice(0, erwartet.length).map((e) => e.titel)).toEqual(erwartet.map((a) => a.titel));
    for (const [i, a] of erwartet.entries()) expect(ist[i]?.ziel, a.schluessel).toEqual(aufgabeZiel(a));
    // erste Einträge: pH-Kontrolle ohne Ort, dann die erste Ortskarte R-A1
    expect(ist[0]?.schluessel.startsWith('ph_kontrolle|')).toBe(true);
    expect(ist[1]?.schluessel.startsWith('wuerfel_feucht|')).toBe(true);
    // Umsetzen am Schluss in der Reihenfolge von umsetzAufgaben(); die Aufgabe «umsetzen» der Aufgaben-Rechnung fehlt
    expect(ist.slice(erwartet.length).map((e) => e.ziel?.name)).toEqual(['umsetzen', 'umsetzen']);
    expect(ist.slice(erwartet.length).map((e) => (e.ziel as { satz?: string } | undefined)?.satz)).toEqual(
      umsetz.map((u) => u.satzId),
    );
    expect(ist.filter((e) => e.schluessel.startsWith('umsetzen|')).length).toBeLessThanOrEqual(umsetz.length);
  });

  it('UX2-AK1 Umsetzen mit freiem Zieltopf führt nach umsetzen mit wie=geplant, ohne Zieltopf ohne wie', () => {
    // Grundstand: Satz 2 auf 4.4 ohne Zieltopf, Satz 1 in A1 mit freien Töpfen 1.2.1 und 1.2.2
    const t = grundstand();
    const ist = heuteFolge(t, faellig(t, GRUND_JETZT), GRUND_JETZT, Z);
    const ziel = (satz: string) =>
      ist.find((e) => e.ziel?.name === 'umsetzen' && (e.ziel as { satz?: string }).satz === satz)?.ziel;
    expect(ziel(satzId(1))).toEqual({ name: 'umsetzen', satz: satzId(1), wie: 'geplant' });
    expect(ziel(satzId(2))).toEqual({ name: 'umsetzen', satz: satzId(2) });
    expect((ziel(satzId(2)) as { wie?: string } | undefined)?.wie).toBeUndefined();

    // Umsetzen am 28.1.: nach Rucola (ohne Ziel) folgt Lollo Rossa, danach Ochsenherz, beide wie geplant; danach
    // Umlauf an den Anfang zu «Gefäss prüfen» R-3.3
    const u = umsetzTeile({ jetzt: UMSETZ_FAELLIG });
    const vorher = vorherVon(u, UMSETZ_FAELLIG);
    const nachRucola = folgeAufgabe(u, UMSETZ_FAELLIG, Z, { ziel: umsetzen(SATZ.rucola), vorher });
    expect(nachRucola?.ziel).toEqual({ name: 'umsetzen', satz: SATZ.lollo, wie: 'geplant' });
    const nachLollo = folgeAufgabe(u, UMSETZ_FAELLIG, Z, { ziel: umsetzen(SATZ.lollo), vorher });
    expect(nachLollo?.ziel).toEqual({ name: 'umsetzen', satz: SATZ.tomate, wie: 'geplant' });
    const nachTomate = folgeAufgabe(u, UMSETZ_FAELLIG, Z, { ziel: umsetzen(SATZ.tomate), vorher });
    expect(nachTomate?.ziel).toEqual(pruefen('R-3.3'));
  });
});

describe('UX2-AK1 aufgabeZiel()', () => {
  const MESSEN: readonly AufgabenArt[] = [
    'messen_nachfuellen',
    'messen',
    'kontrolle_folgetag',
    'waerme_pruefen',
  ];
  const ANSATZ: readonly AufgabenArt[] = ['loesung_wechseln', 'ansatz'];
  const OEFFNEN: readonly AufgabenArt[] = [
    'kurzpruefung',
    'belueftung_pruefen',
    'wurzeln_pruefen',
    'nachfuellen_kratky',
    'station_echte_blaetter',
    'reservierung_pruefen',
  ];
  const NUR_TASTE: readonly AufgabenArt[] = [
    'wuerfel_feucht',
    'reinigen',
    'deckel_oeffnen',
    'abdeckung_entfernen',
    'strom_pumpen',
    'strom_ac10_licht',
    'strom_wassertemperatur',
    'strom_wurzeln',
    'strom_messen',
  ];
  const SATZ_A1 = satzId(1);

  /** Aufgabe des Typs am Ort R-2.1 (Anzuchtort R-A1 für Keimung, ohne Ort für pH-Kontrolle und Kalibrieren) */
  function von(typ: AufgabenArt): Aufgabe {
    const a = aufgabe(typ as Parameters<typeof aufgabe>[0], typ === 'keimung_pruefen' ? 'R-A1' : 'R-2.1');
    if (typ === 'keimung_pruefen') return { ...a, bezug: SATZ_A1, bezugArt: 'satz' };
    if (typ === 'ph_kontrolle' || typ === 'kalibrieren') {
      const ohneOrt: Aufgabe = { ...a };
      delete ohneOrt.ort;
      return { ...ohneOrt, bezugArt: 'messgeraet' };
    }
    return a;
  }

  /** Route je Typ nach der Tabelle in Plan 224 Entscheid 6 */
  function erwartet(typ: AufgabenArt): AufgabenZiel | undefined {
    if (MESSEN.includes(typ)) return messen('R-2.1');
    if (typ === 'gefaess_pruefen') return pruefen('R-2.1');
    if (ANSATZ.includes(typ)) return { name: 'ansatz', code: 'R-2.1' } as AufgabenZiel;
    if (typ === 'keimung_pruefen') return { name: 'keimung', satz: SATZ_A1 } as AufgabenZiel;
    if (typ === 'ph_kontrolle') return { name: 'kalibrieren' } as AufgabenZiel;
    if (OEFFNEN.includes(typ)) return { name: 'gefaess', code: 'R-2.1' } as AufgabenZiel;
    return undefined;
  }

  it('UX2-AK1 aufgabeZiel() je Typ nach der Tabelle des Plans', () => {
    // Umsetzen der Aufgaben-Rechnung steht nicht in Heute (eigene Liste aus umsetzAufgaben(), siehe heuteFolge())
    const typen = TYPEN.filter((t) => t !== 'umsetzen');
    const abgedeckt = new Set([...MESSEN, ...ANSATZ, ...OEFFNEN, ...NUR_TASTE]);
    for (const t of ['gefaess_pruefen', 'keimung_pruefen', 'ph_kontrolle', 'kalibrieren'] as const)
      abgedeckt.add(t);
    expect(
      typen.filter((t) => !abgedeckt.has(t)),
      'jeder Typ in der Tabelle',
    ).toEqual([]);
    for (const typ of typen) {
      const ziel = aufgabeZiel(von(typ));
      if (erwartet(typ) === undefined) expect(ziel, typ).toBeUndefined();
      else expect(ziel, typ).toEqual(erwartet(typ));
    }
  });

  it('UX2-AK1 aufgabeZiel(): Kalibrieren und reine Tasten ohne Route, pH-Kontrolle ohne Ort öffnet Kalibrieren', () => {
    expect(aufgabeZiel(von('kalibrieren'))).toBeUndefined();
    expect(aufgabeZiel(von('wuerfel_feucht'))).toBeUndefined();
    expect(aufgabeZiel(von('deckel_oeffnen'))).toBeUndefined();
    expect(aufgabeZiel(von('ph_kontrolle'))).toEqual({ name: 'kalibrieren' });
    // ohne Ort keine Route mit Code
    const ohneOrt: Aufgabe = { ...von('messen') };
    delete ohneOrt.ort;
    expect(aufgabeZiel(ohneOrt)).toBeUndefined();
  });
});
