// Prüfer Runde 1 zu Plan 38 (Lead): Herkunft je Wert im Sollbereich (Befund 1) und Wiederherstellen eines Ausfalls nach
// dem Umsetzen ohne Storno der verbrauchten Reservierung (Befund 3). Uhr ERNTE_JETZT, Zeitzone Europe/Zurich.
import { describe, expect, it } from 'vitest';
import type { Schritt } from '../../src/domain/datenpfad/erfassung.ts';
import { pflanzenAnsicht } from '../../src/domain/phasen/ansicht.ts';
import { endeWiederherstellenVorgang } from '../../src/domain/phasen/ende.ts';
import { ausfallVorgang } from '../../src/domain/phasen/ernte.ts';
import { herkunftText, sollbereich, sollText } from '../../src/domain/phasen/sollbereich.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  EICHBLATT,
  ernteSichtenNachrechnen,
  ernteTeile,
  ernteVorgangAnwenden,
  ERNTE_JETZT,
  LOLLO,
  netztopfId,
  platzId,
  sollwertSetzen,
  SORTE,
  SORTE_W1,
  umsetzenDazu,
} from '../fixtures/ernte.ts';
import { uid } from '../fixtures/regal.ts';

const J = ERNTE_JETZT;
const Z = ZEITZONE;
const E1 = EICHBLATT[1] as string;
const L3 = LOLLO[3] as string;

function neueIds(praefix = '6a'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

describe('Plan 38 Prüfer Runde 1', () => {
  it('R1.3 Herkunft je Wert in der Pflanzenansicht: «Herkunft: pH Art · EC Art · °C Art», Kulturgruppe und Leitkultur sichtbar', () => {
    const t = ernteTeile();
    expect(pflanzenAnsicht(t, LOLLO[1] as string, J, Z)?.soll.herkunftText).toBe(
      'Herkunft: pH Art · EC Art · °C Art',
    );
    sollwertSetzen(t, SORTE_W1.eissalat, 'ph', { herkunft_ebene: 'kulturgruppe', evidenzklasse: 'D' });
    sollwertSetzen(t, SORTE_W1.eissalat, 'ec', { vermerk: 'leitkultur' });
    expect(herkunftText(sollbereich(t, SORTE_W1.eissalat, 'wachstum', platzId('2.3')))).toBe(
      'Herkunft: pH Kulturgruppe · EC Art (Leitkultur) · °C Art',
    );
    sollwertSetzen(t, SORTE.lollo, 'ph', null);
    sollwertSetzen(t, SORTE.lollo, 'ec', null);
    sollwertSetzen(t, SORTE.lollo, 'wassertemp', null);
    expect(herkunftText(sollbereich(t, SORTE.lollo, 'wachstum', platzId('2.3')))).toBeUndefined();
  });

  it('R1.3 Wassertemperatur mit Nachkommastelle bleibt sichtbar (18.5–22 °C)', () => {
    expect(sollText({ temp: { min: 1850, max: 2200 }, ecBasisUnklar: false })).toContain('18.5–22 °C');
  });

  it('R1.7 Wiederherstellen eines Ausfalls nach dem Umsetzen storniert die verbrauchte Reservierung nicht', () => {
    const t = ernteTeile();
    // Eichblatt 1 am 15.3. aus der Box A2 in seinen Zieltopf 2.1.3 umgesetzt, dann Ausfall
    umsetzenDazu(t, E1, '2.1.3', '2027-03-15', ['A2', 1]);
    ernteSichtenNachrechnen(t);
    const db = ernteVorgangAnwenden(t, ausfallVorgang(t, E1, 'Wurzeln', neueIds('6b'), J, Z), J);
    // ein Folgesatz reserviert 2.1.3
    const res = uid('30', 9991);
    (db['reservierung'] ??= []).push({
      id: res,
      client_id: res,
      pflanzung_id: L3,
      netztopf_id: netztopfId('2.1.3'),
      umsetzen_vorgabe_am: '2027-03-25',
      umsetzen_geplant_am: '2027-03-25',
      gilt_ab: '2027-03-18T09:00:00.000Z',
      storniert_am: null,
    });
    ernteSichtenNachrechnen(db);
    const w = endeWiederherstellenVorgang(db, E1, neueIds(), J, Z);
    expect(w.hinweis).toBeUndefined();
    expect(w.vorgang.map((s: Schritt) => s.art)).toEqual(['neu']);
  });
});
