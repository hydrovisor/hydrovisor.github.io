// Mehr (Entscheid 0025, Plan 212): Hauptseite der Leiste unten für selten gebrauchte Masken, als Navigationsliste
// (design-system/components/Tabbar.md); Einträge als Substantive wie im Mockup (Plan A5).
import { hashZu, type Route } from '../router.ts';

const EINTRAEGE: readonly { titel: string; route: Route }[] = [
  { titel: 'Einstellungen', route: { name: 'einstellungen' } },
  { titel: 'Etiketten', route: { name: 'etiketten' } },
  { titel: 'Vorlagen', route: { name: 'vorlagen' } },
  { titel: 'Push-Erinnerungen', route: { name: 'push' } },
  { titel: 'Notfallblatt', route: { name: 'notfallblatt' } },
  { titel: 'Info und Version', route: { name: 'info' } },
];

export function Mehr() {
  return (
    <main className="hv-seite hv-mehr">
      <h1 className="hv-seite-titel">Mehr</h1>
      <ul className="hv-navliste" aria-label="Mehr">
        {EINTRAEGE.map((e) => (
          <li key={e.titel}>
            <a className="hv-navliste-zeile" href={hashZu(e.route)}>
              <span className="hv-navliste-titel">{e.titel}</span>
              <span className="hv-navliste-pfeil" aria-hidden="true">
                ›
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
