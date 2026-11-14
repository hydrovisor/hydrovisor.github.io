// Ergänzung zu aufgaben-folge.test.ts nach Prüferbefund 5 der Runde 1 (Issue #224, Plan 224 Entscheid 5; UX2-AK1):
// Bezug Keimung über den Schlüssel, seither neu hinzugekommener Eintrag, Titel und Ort der Umsetz-Einträge.
// Injizierte Uhr der Datenstände, Zeitzone Europe/Zurich. Keine Personendaten.
import { describe, expect, it } from 'vitest';
import { folgeAufgabe, heuteFolge } from '../../src/domain/aufgaben-folge.ts';
import { einstellungenAus } from '../../src/domain/aufgaben.ts';
import { verteilteAufgaben } from '../../src/domain/aufgaben-verteilung.ts';
import { umsetzAufgaben } from '../../src/domain/anzucht/umsetzen.ts';
import type { Teile } from '../../src/domain/anlage/teile.ts';
import { KEIM_JETZT, KEIM_SATZ, KEIM_SATZ_2, keimTeile } from '../fixtures/keimung.ts';
import { JETZT as RUNDGANG_JETZT, rundgangMessungDazu, rundgangTeile } from '../fixtures/rundgang.ts';
import { pflanzSichtenNachrechnen, sichtenNachrechnen } from '../fixtures/sichten.ts';
import { SATZ, UMSETZ_FAELLIG, umsetzTeile } from '../fixtures/umsetzen.ts';

const Z = 'Europe/Zurich';
const folge = (t: Teile, jetzt: Date) =>
  heuteFolge(t, verteilteAufgaben(t, einstellungenAus(t), jetzt, Z), jetzt, Z);

describe('UX2-AK1 folgeAufgabe(): Ergänzungen der Runde 1', () => {
  it('UX2-AK1 nach «Keimung prüfen» eines Satzes folgt die Keimung des nächsten Satzes, nicht dieselbe', () => {
    const t = pflanzSichtenNachrechnen(sichtenNachrechnen(keimTeile({ zweiterSatz: true })));
    const vorher = folge(t, KEIM_JETZT).map((e) => e.schluessel);
    expect(
      vorher.filter((s) => s.startsWith('keimung_pruefen|')),
      'Vorbedingung: zwei Keimprüfungen',
    ).toHaveLength(2);
    const f = folgeAufgabe(t, KEIM_JETZT, Z, { ziel: { name: 'keimung', satz: KEIM_SATZ }, vorher });
    expect(f?.ziel).toEqual({ name: 'keimung', satz: KEIM_SATZ_2 });
    // vom zweiten Satz aus geht es in der Folge weiter, nie zum zweiten Satz selbst
    const g = folgeAufgabe(t, KEIM_JETZT, Z, { ziel: { name: 'keimung', satz: KEIM_SATZ_2 }, vorher });
    expect(g).toBeDefined();
    expect(g?.ziel).not.toEqual({ name: 'keimung', satz: KEIM_SATZ_2 });
    // ohne Folge vom Öffnen beginnt die Suche vorne, ohne den Bezug: die Keimung des ersten Satzes
    const h = folgeAufgabe(t, KEIM_JETZT, Z, { ziel: { name: 'keimung', satz: KEIM_SATZ_2 }, vorher: [] });
    expect(h?.ziel).toEqual({ name: 'keimung', satz: KEIM_SATZ });
  });

  it('UX2-AK1 steht nach dem Bezug nichts mehr in der Folge vom Öffnen, folgt ein seither neuer Eintrag in Heute-Reihenfolge', () => {
    const t = rundgangTeile();
    const alle = folge(t, RUNDGANG_JETZT);
    const messen11 = alle.find((e) => e.ziel?.name === 'messen' && e.ort === 'R-1.1');
    expect(messen11, 'Vorbedingung: Messen R-1.1').toBeDefined();
    // beim Öffnen stand nur die Messung R-1.1 in Heute; alles andere ist seither dazugekommen
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, {
      ziel: { name: 'messen', code: 'R-1.1' },
      vorher: [messen11?.schluessel ?? ''],
    });
    expect(f?.ziel).toEqual({ name: 'messen', code: 'R-2.1' });
  });

  it('UX2-AK1 Umsetz-Einträge heissen «Umsetzen <Sorte>» und tragen den Ort der Station', () => {
    const t = umsetzTeile({ jetzt: UMSETZ_FAELLIG });
    const aufgabe = umsetzAufgaben(t, UMSETZ_FAELLIG, Z).find((u) => u.satzId === SATZ.lollo);
    expect(aufgabe?.sorte).toBe('Lollo Rossa');
    const eintrag = folge(t, UMSETZ_FAELLIG).find(
      (e) => e.ziel?.name === 'umsetzen' && e.ziel.satz === SATZ.lollo,
    );
    expect(eintrag?.titel).toBe('Umsetzen Lollo Rossa');
    expect(eintrag?.ort).toBe(aufgabe?.ort);
    expect(eintrag?.ort).toBeTruthy();
    expect(eintrag?.schluessel).toBe(`umsetzen|${SATZ.lollo}|${aufgabe?.faelligAm ?? ''}`);
  });

  // Ergänzung nach Prüferbefund 3 der Runde 1 zu #225 (Plan 225 Entscheid 7): Vorrang nur für eine neue Aufgabe am Ort
  it('UX3-AK5 eine seit dem Öffnen an einem anderen Ort entstandene Aufgabe geht nicht vor', () => {
    const vorher = folge(rundgangTeile(), RUNDGANG_JETZT).map((e) => e.schluessel);
    // inzwischen Kratky-Messung «unter ⅓» in 3.1: «Nachfüllen Kratky» R-3.1 ist neu
    const t = rundgangTeile();
    rundgangMessungDazu(t, { kennung: '3.1', ec: 1.0, fuellstand: 'unter_drittel', nr: 81 });
    sichtenNachrechnen(t);
    expect(
      folge(t, RUNDGANG_JETZT).some((e) => e.ziel?.name === 'nachfuellen' && e.ort === 'R-3.1'),
      'Vorbedingung: Nachfüllen R-3.1 fällig',
    ).toBe(true);
    // nach der Messung in R-1.1 folgt R-2.1 im Laufweg, nicht das neue Nachfüllen in R-3.1
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: { name: 'messen', code: 'R-1.1' }, vorher });
    expect(f?.ziel).toEqual({ name: 'messen', code: 'R-2.1' });
    // nach der Messung in R-3.1 selbst geht das neue Nachfüllen am selben Ort vor
    const g = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: { name: 'messen', code: 'R-3.1' }, vorher });
    expect(g?.ziel).toEqual({ name: 'nachfuellen', code: 'R-3.1' });
  });

  it('UX3-AK5 eine Aufgabe am selben Ort, die schon beim Öffnen fällig war, geht nicht vor', () => {
    const t = rundgangTeile();
    rundgangMessungDazu(t, { kennung: '3.1', ec: 1.0, fuellstand: 'unter_drittel', nr: 82 });
    sichtenNachrechnen(t);
    // die Maske wurde geöffnet, als das Nachfüllen R-3.1 schon in Heute stand
    const vorher = folge(t, RUNDGANG_JETZT).map((e) => e.schluessel);
    expect(vorher.some((s) => s.startsWith('nachfuellen_kratky|'))).toBe(true);
    const f = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: { name: 'pruefen', code: 'R-3.3' }, vorher });
    // nach «Gefäss prüfen» R-3.3 (letzte Karte) beginnt die Suche oben: Messen R-1.1, nicht das ältere Nachfüllen
    expect(f?.ziel).toEqual({ name: 'messen', code: 'R-1.1' });
    // und nach der Messung in R-2.1 folgt das Nachfüllen R-3.1 an seiner Stelle im Laufweg
    const g = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: { name: 'messen', code: 'R-2.1' }, vorher });
    expect(g?.ziel).toEqual({ name: 'nachfuellen', code: 'R-3.1' });
    // am Ort selbst (Kurzprüfung R-3.1 gespeichert): das ältere Nachfüllen geht nicht vor, es folgt R-3.3 im Laufweg
    const h = folgeAufgabe(t, RUNDGANG_JETZT, Z, { ziel: { name: 'kurzpruefung', code: 'R-3.1' }, vorher });
    expect(h?.ziel).toEqual({ name: 'pruefen', code: 'R-3.3' });
  });
});
