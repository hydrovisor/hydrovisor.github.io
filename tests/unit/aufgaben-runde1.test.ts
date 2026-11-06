// Nachbesserung Runde 1 der Aufgaben-Rechnung (Plan 27; Prüfer Fachlogik Befunde 1, 2, 6, 10; E2E einrichtung).
// Ergänzung des Leads zu den Tests des Testentwicklers. Uhr Di 12.1.2027 09:00 Zürich, Fixture aufgaben-fixture.ts.
import { describe, expect, it } from 'vitest';
import { alleAufgaben, einstellungenAus, faelligeAufgaben } from '../../src/domain/aufgaben.ts';
import { letzterJeOrt, nachfuellenSeitNeuansatz } from '../../src/domain/datenpfad/buendel.ts';
import {
  JETZT,
  ZONE,
  ansatzDazu,
  boxDazu,
  fertig,
  gefaessDazu,
  jetztAm,
  kurzpruefungDazu,
  leer,
  messungDazu,
  platzEreignisDazu,
  platzId,
  satzDazu,
  schluessel,
  von,
  zh,
  type Teile,
} from './aufgaben-fixture.ts';

const faellig = (t: Teile, jetzt = JETZT) => faelligeAufgaben(t, einstellungenAus(t), jetzt, ZONE);
const alle = (t: Teile, jetzt = JETZT) => alleAufgaben(t, einstellungenAus(t), jetzt, ZONE);

/** 1.1 DWC 9 l, Neuansatz 2.1., Nachfüllen 5.1. (5 l) und 8.1. (4 l): Summe erreicht 9 l am 8.1. */
function vollAm8(): Teile {
  const t = leer();
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', volumenL: 9 });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-05'), typ: 'nachfuellen', nachgefuelltL: 5 });
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-08'), typ: 'nachfuellen', nachgefuelltL: 4 });
  return fertig(t);
}

describe('R5.2 Lösung wechseln nach Nachfüllsumme (Befund 1)', () => {
  it('R5.3 Lösung wechseln nach Nachfüllsumme: Schlüssel bleibt, «Morgen» höchstens 3 Tage nach dem Erreichen', () => {
    const t = vollAm8();
    const wechsel = (tag: string) => von(faellig(t, jetztAm(tag)), 'loesung_wechseln')[0];
    const s = schluessel('loesung_wechseln', platzId('R-1.1'), '2027-01-08');
    for (const tag of ['2027-01-08', '2027-01-10', '2027-01-11', '2027-01-12'])
      expect(wechsel(tag)?.schluessel).toBe(s);
    expect(wechsel('2027-01-10')?.morgen.erlaubt).toBe(true);
    expect(wechsel('2027-01-11')?.morgen.erlaubt).toBe(false);
    expect(wechsel('2027-01-12')?.grund).toBe('seit 4 Tagen überfällig');
  });

  it('R5.2 Lösung wechseln nach Nachfüllsumme: ohne Nachfüll-Zeilen im Bündel zählt heute; der Tag des Erreichens gilt auch vor dem Stichtag', () => {
    const t = vollAm8();
    t['naehrloesungsansatz'] = (t['naehrloesungsansatz'] ?? []).filter((a) => a['typ'] === 'neuansatz');
    expect(von(faellig(t), 'loesung_wechseln').map((a) => a.faelligAm)).toEqual(['2027-01-12']);
    // regulärer Termin vor dem Erreichen: der reguläre gilt
    const frueh = vollAm8();
    expect(von(alle(frueh, jetztAm('2027-01-07')), 'loesung_wechseln').map((a) => a.faelligAm)).toEqual([
      '2027-01-08',
    ]);
  });

  it('R5.2 Lösung wechseln nicht bei Kratky, auch mit Wechselintervall (Befund 10)', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-3.3', betriebsart: 'kratky', intervallWechselnD: 14 });
    ansatzDazu(t, 'R-3.3', { begonnen: zh('2026-12-01') });
    fertig(t);
    expect(von(alle(t), 'loesung_wechseln')).toEqual([]);
  });
});

describe('R5.4 Belüftung prüfen bei leer (Befund 6)', () => {
  it('R5.4 Belüftung prüfen markiert ein leeres Gefäss derselben Pumpe nicht mit', () => {
    const t = leer();
    for (const code of ['R-3.1', 'R-3.2'])
      gefaessDazu(t, { code, betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
    ansatzDazu(t, 'R-3.1', { begonnen: zh('2027-01-02') });
    kurzpruefungDazu(t, 'R-3.1', zh('2027-01-12', '08:00'), 'pumpe', false);
    fertig(t);
    expect(von(faellig(t), 'belueftung_pruefen').map((a) => a.ort?.kennung)).toEqual(['3.1']);
  });
});

describe('R5.1 Rechnung wirft nie (E2E einrichtung)', () => {
  it('R5.1 Satz ohne gilt_ab, client_zeit und erfasst_am: Saattag zählt, kein Fehler', () => {
    const t = leer();
    boxDazu(t, 'R-A3', 'box_dunkel');
    satzDazu(t, { nr: 50, sorte: 'koriander', box: 'R-A3', saat: '2027-01-09' });
    for (const s of t['satz'] ?? []) {
      delete s['gilt_ab'];
      delete s['client_zeit'];
      delete s['erfasst_am'];
    }
    fertig(t);
    expect(von(faellig(t), 'deckel_oeffnen').map((a) => a.faelligAm)).toEqual(['2027-01-12']);
  });
});

describe('R5.2 Nachfüllen im Bündel (Befund 2)', () => {
  const zeile = (id: string, platz: string, typ: string, tag: string, status = 'abgeschlossen') => ({
    id,
    platz_id: platz,
    typ,
    status,
    begonnen_am: zh(tag),
  });

  it('R5.2 nachfuellenSeitNeuansatz behält nur Nachfüllen nach dem letzten gültigen Neuansatz je Ort', () => {
    const zeilen = [
      zeile('n1', 'p1', 'neuansatz', '2027-01-01'),
      zeile('f1', 'p1', 'nachfuellen', '2026-12-30'),
      zeile('f2', 'p1', 'nachfuellen', '2027-01-03'),
      zeile('x', 'p1', 'neuansatz', '2027-01-05', 'abgebrochen'),
      zeile('f3', 'p1', 'nachfuellen', '2027-01-06'),
      zeile('ph', 'p1', 'ph_korrektur', '2027-01-07'),
      zeile('f4', 'p2', 'nachfuellen', '2027-01-03'),
    ];
    expect(nachfuellenSeitNeuansatz(zeilen).map((z) => z.id)).toEqual(['f2', 'f3']);
  });

  it('R5.2 Nachfüllen Kratky bleibt erledigt, wenn nach dem Nachfüllen eine pH-Korrektur folgt (gekürztes Bündel)', () => {
    const t = leer();
    gefaessDazu(t, { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
    ansatzDazu(t, 'R-3.1', { begonnen: zh('2026-12-28') });
    messungDazu(t, 'R-3.1', { gilt: zh('2027-01-12', '07:00'), fuellstand: 'unter_drittel' });
    ansatzDazu(t, 'R-3.1', { begonnen: zh('2027-01-12', '07:30'), typ: 'nachfuellen', nachgefuelltL: 3 });
    ansatzDazu(t, 'R-3.1', { begonnen: zh('2027-01-12', '08:00'), typ: 'ph_korrektur' });
    platzEreignisDazu(t, 'R-3.1', 'kurzpruefung', zh('2027-01-12', '08:10'), { punkt: 'licht', ok: true });
    fertig(t);
    // wie src/daten/buendel.ts: letzter Ansatz, letzter Neuansatz und Nachfüllen seit dem Neuansatz
    const roh = (t['naehrloesungsansatz'] ?? []) as unknown as Parameters<typeof letzterJeOrt>[0];
    const neu = roh.filter((a) => a['typ' as never] === 'neuansatz');
    t['naehrloesungsansatz'] = [
      ...new Set([...letzterJeOrt(roh), ...letzterJeOrt(neu), ...nachfuellenSeitNeuansatz(roh)]),
    ] as unknown as Teile[string];
    expect(von(alle(t, jetztAm('2027-01-12', '09:00')), 'nachfuellen_kratky')).toEqual([]);
  });
});
