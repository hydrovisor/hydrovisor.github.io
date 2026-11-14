// Tasten je Aufgabe für Heute und die Maske Gefäss (Plan 225 Entscheid 5; UX3-AK4; R5.1, R5.3, UX1-AK3): eine reine
// Tabelle. Die erste Taste ist die einzige betonte; «Öffnen» (Maske Gefäss) gibt es nur in Heute bei Zeilen mit Ort,
// deren Haupttaste schreibt (A7); «Morgen», «Überspringen» und «Pegel ok» folgen den Flags der Aufgabe.
import { aufgabeZiel, type AufgabenZiel } from './aufgaben-folge.ts';
import type { Aufgabe } from './aufgaben.ts';

export type Aktion =
  'erledigt' | 'deckel' | 'morgen' | 'ueberspringen' | 'pegel_ok' | 'pruefung_ok' | 'pruefung_auffaellig';

export type AufgabenTaste =
  | { art: 'schreiben'; aktion: Aktion; text: string; betont: boolean }
  | { art: 'link'; ziel: AufgabenZiel; text: string; betont: boolean };

type Roh =
  { art: 'schreiben'; aktion: Aktion; text: string } | { art: 'link'; ziel: AufgabenZiel; text: string };

/** Wort der Taste je Maske */
const WORT: Readonly<Record<AufgabenZiel['name'], string>> = {
  messen: 'Messen',
  pruefen: 'Prüfen',
  keimung: 'Prüfen',
  kurzpruefung: 'Prüfen',
  ansatz: 'Ansetzen',
  nachfuellen: 'Nachfüllen',
  umsetzen: 'Umsetzen',
  kalibrieren: 'Öffnen',
  gefaess: 'Öffnen',
};

const schreiben = (aktion: Aktion, text: string): Roh => ({ art: 'schreiben', aktion, text });

/** aus der Maske Gefäss führen Kurzprüfung und Nachfüllen dorthin zurück */
function mitHerkunft(ziel: AufgabenZiel, wo: 'heute' | 'gefaess'): AufgabenZiel {
  return wo === 'gefaess' && (ziel.name === 'kurzpruefung' || ziel.name === 'nachfuellen')
    ? { ...ziel, von: 'gefaess' }
    : ziel;
}

/** Haupttaste und allfällige Zweittaste der Aufgabe (Tabelle in Plan 225 Entscheid 5) */
function eigene(a: Aufgabe, wo: 'heute' | 'gefaess'): Roh[] {
  if (a.typ === 'deckel_oeffnen') return [schreiben('deckel', 'Deckel geöffnet')];
  if (a.typ === 'abdeckung_entfernen') return [schreiben('deckel', 'Abdeckung entfernt')];
  if (a.typ === 'kurzpruefung')
    return [
      schreiben('pruefung_ok', 'Alles ok'),
      ...(a.ort
        ? [
            {
              art: 'link' as const,
              ziel: mitHerkunft({ name: 'kurzpruefung', code: a.ort.code }, wo),
              text: 'Etwas stimmt nicht',
            },
          ]
        : []),
    ];
  if (a.typ === 'wurzeln_pruefen')
    return [schreiben('pruefung_ok', 'Wurzeln ok'), schreiben('pruefung_auffaellig', 'Auffällig')];
  if (a.erledigtKnopf) return [schreiben('erledigt', 'Erledigt')];
  const ziel = aufgabeZiel(a);
  // ein Link auf die Maske Gefäss ist «Öffnen» und kommt unten, nur in Heute
  return ziel && ziel.name !== 'gefaess'
    ? [{ art: 'link', ziel: mitHerkunft(ziel, wo), text: WORT[ziel.name] }]
    : [];
}

export function aufgabenTasten(a: Aufgabe, wo: 'heute' | 'gefaess', pegelGesetzt: boolean): AufgabenTaste[] {
  const tasten = eigene(a, wo);
  const hauptFuehrt = tasten[0]?.art === 'link';
  if (a.morgen.erlaubt) tasten.push(schreiben('morgen', 'Morgen'));
  if (a.ueberspringen) tasten.push(schreiben('ueberspringen', 'Überspringen'));
  if (a.pegelOk && !pegelGesetzt) tasten.push(schreiben('pegel_ok', 'Pegel ok'));
  if (wo === 'heute' && a.ort && !hauptFuehrt)
    tasten.push({ art: 'link', ziel: { name: 'gefaess', code: a.ort.code }, text: 'Öffnen' });
  return tasten.map((t, i) => ({ ...t, betont: i === 0 }));
}
