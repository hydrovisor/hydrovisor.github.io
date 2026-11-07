// Maske «Sorten» (UC4; Schreibtisch, Standarddichte; Plan 37): je Sorte Vollständigkeit als Wort, Prüfaufträge, Bestand.
import { sortenListe } from '../../domain/sorten/liste.ts';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../sorten.css';

export function Sorten() {
  const { buendel, liest } = useBuendel();
  const liste = buendel ? sortenListe(buendel.teile) : [];
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Sorten</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'einstellungen' })}>
          Zu den Einstellungen
        </a>
      </header>
      <a className="hv-btn hv-btn-primary hv-btn-block" href={hashZu({ name: 'sorte-neu' })}>
        Neue Sorte erfassen
      </a>
      {liest && !buendel ? <p>Sorten werden geladen.</p> : null}
      {buendel && liste.length === 0 ? <p>Noch keine Sorte erfasst.</p> : null}
      <ul className="hv-sorten-liste">
        {liste.map((s) => (
          <li key={s.sorteId}>
            <a className="hv-sorten-zeile" href={hashZu({ name: 'sorte', sorte: s.sorteId })}>
              <span className="hv-sorten-name">
                {s.name} · {s.artName}
              </span>
              <span className="hv-sorten-info">
                <StatusBadge tone={s.vollstaendig ? 'info' : 'neutral'}>
                  {s.vollstaendig ? 'vollständig' : 'unvollständig'}
                </StatusBadge>
                <span>
                  {s.pruefauftraege} {s.pruefauftraege === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}
                </span>
                <span>Bestand {s.bestandKorn} Korn</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
