// Leiste unten (Entscheid 0025, Plan 212; Entscheid 0026, Plan 232): Ziele und Sichtbarkeitsregel. Die Leiste steht nur
// auf den fünf Hauptseiten und in Säen Schritt 1;
// in Abläufen und auf Unterseiten fehlt sie (Plan A1, A2), ohne Sitzung ebenso.
import type { Sitzungszustand } from '../anmeldung/sitzung.ts';
import type { Route } from './router.ts';

export type LeisteZiel = 'heute' | 'anlagen' | 'ernte' | 'saatgut' | 'mehr';

export const LEISTE: readonly { ziel: LeisteZiel; text: string; route: Route }[] = [
  { ziel: 'heute', text: 'Heute', route: { name: 'heute' } },
  { ziel: 'anlagen', text: 'Anlagen', route: { name: 'anlagen' } },
  { ziel: 'ernte', text: 'Ernte', route: { name: 'ernte' } },
  { ziel: 'saatgut', text: 'Saatgut', route: { name: 'sorten' } },
  { ziel: 'mehr', text: 'Mehr', route: { name: 'mehr' } },
];

/**
 * Aktives Ziel der Leiste oder undefined, wenn keine Leiste erscheint. `imAblauf` meldet eine Maske, die innerhalb ihrer
 * Route in einen Ablauf wechselt (Säen ab Schritt 2; Saatgut: Tüte erfassen, Fotos nachtragen).
 */
export function leisteZiel(route: Route, sitzung: Sitzungszustand, imAblauf = false): LeisteZiel | undefined {
  if (sitzung !== 'angemeldet') return undefined;
  switch (route.name) {
    case 'heute':
      return 'heute';
    case 'anlagen':
      return 'anlagen';
    case 'ernte':
      return 'ernte';
    case 'saeen':
      // Säen liegt seit Entscheid 0026 in Saatgut: Schritt 1 zeigt «Saatgut» als aktives Ziel
      return imAblauf ? undefined : 'saatgut';
    case 'sorten':
      // Tüte erfassen und Fotos nachtragen sind Abläufe innerhalb der Saatgut-Maske (Plan 211 A1)
      return imAblauf ? undefined : 'saatgut';
    case 'mehr':
      return 'mehr';
    default:
      return undefined;
  }
}
