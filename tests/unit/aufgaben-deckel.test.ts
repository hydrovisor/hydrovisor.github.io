// «Deckel geöffnet» und «Abdeckung entfernt» aus der Aufgabe (Plan 27 A9, 8.1 Regel 2): eigener Ereignistyp statt
// aufgabe_erledigt. Ergänzung des Leads zu den Tests des Testentwicklers (Knopf in Heute).
import { describe, expect, it } from 'vitest';
import { einstellungenAus, faelligeAufgaben } from '../../src/domain/aufgaben.ts';
import { deckelVorgang } from '../../src/domain/aufgaben-aufschub.ts';
import {
  JETZT,
  ZONE,
  boxDazu,
  fertig,
  gefaessDazu,
  leer,
  platzId,
  satzDazu,
  satzId,
  schluessel,
  von,
} from './aufgaben-fixture.ts';

const ID = 'f0000000-0000-4000-8000-000000000301';

describe('R5.2 Deckel öffnen und Abdeckung entfernen als eigenes Ereignis', () => {
  it('R5.2 deckelVorgang schreibt deckel_geoeffnet am Platz der Box, abdeckung_entfernt am Satz', () => {
    const t = leer();
    boxDazu(t, 'R-A3', 'box_dunkel');
    satzDazu(t, { nr: 40, sorte: 'koriander', box: 'R-A3', saat: '2027-01-09' });
    gefaessDazu(t, { code: 'R-2.3', betriebsart: 'dwc' });
    satzDazu(t, { nr: 41, sorte: 'koriander', direktsaat: 'R-2.3', saat: '2027-01-09' });
    fertig(t);
    const liste = faelligeAufgaben(t, einstellungenAus(t), JETZT, ZONE);
    const deckel = von(liste, 'deckel_oeffnen')[0];
    const abdeckung = von(liste, 'abdeckung_entfernen')[0];
    if (!deckel || !abdeckung) throw new Error('Aufgaben fehlen');
    expect(deckelVorgang(deckel, ID, JETZT)).toEqual([
      {
        art: 'neu',
        tabelle: 'ereignis',
        felder: {
          id: ID,
          client_id: ID,
          typ: 'deckel_geoeffnet',
          platz_id: platzId('R-A3'),
          daten: {},
          war_faellig_am: '2027-01-12',
          aufgabe_schluessel: schluessel('deckel_oeffnen', platzId('R-A3'), '2027-01-12'),
          gilt_ab: JETZT.toISOString(),
        },
      },
    ]);
    expect(deckelVorgang(abdeckung, ID, JETZT)).toEqual([
      {
        art: 'neu',
        tabelle: 'ereignis',
        felder: {
          id: ID,
          client_id: ID,
          typ: 'abdeckung_entfernt',
          satz_id: satzId(41),
          daten: {},
          war_faellig_am: '2027-01-12',
          aufgabe_schluessel: schluessel('abdeckung_entfernen', satzId(41), '2027-01-12'),
          gilt_ab: JETZT.toISOString(),
        },
      },
    ]);
    for (const a of liste.filter((x) => x.typ !== 'deckel_oeffnen' && x.typ !== 'abdeckung_entfernen'))
      expect(deckelVorgang(a, ID, JETZT)).toEqual([]);
  });
});
