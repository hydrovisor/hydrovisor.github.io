// Leiste unten (Entscheid 0025, Plan 212): Ziele und Sichtbarkeitsregel. Die Leiste steht nur auf den fünf Hauptseiten;
// in Abläufen und auf Unterseiten fehlt sie (Plan A1, A2), ohne Sitzung ebenso.
import type { Sitzungszustand } from '../anmeldung/sitzung.ts';
import type { Route } from './router.ts';

export type LeisteZiel = 'heute' | 'anlagen' | 'saeen' | 'saatgut' | 'mehr';

export const LEISTE: readonly { ziel: LeisteZiel; text: string; route: Route }[] = [
  { ziel: 'heute', text: 'Heute', route: { name: 'heute' } },
  { ziel: 'anlagen', text: 'Anlagen', route: { name: 'anlagen' } },
  { ziel: 'saeen', text: 'Säen', route: { name: 'saeen' } },
  { ziel: 'saatgut', text: 'Saatgut', route: { name: 'sorten' } },
  { ziel: 'mehr', text: 'Mehr', route: { name: 'mehr' } },
];

/**
 * Aktives Ziel der Leiste oder undefined, wenn keine Leiste erscheint. `imAblauf` meldet eine Maske, die innerhalb ihrer
 * Route in einen Ablauf wechselt (Säen ab Schritt 2).
 */
export function leisteZiel(route: Route, sitzung: Sitzungszustand, imAblauf = false): LeisteZiel | undefined {
  if (sitzung !== 'angemeldet') return undefined;
  switch (route.name) {
    case 'heute':
      return 'heute';
    case 'anlagen':
      return 'anlagen';
    case 'saeen':
      return imAblauf ? undefined : 'saeen';
    case 'sorten':
      return 'saatgut';
    case 'mehr':
      return 'mehr';
    default:
      return undefined;
  }
}
