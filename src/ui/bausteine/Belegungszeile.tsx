// Baustein Belegungszeile (design-system/components/Belegungszeile.md, Plan 216): Ort mit Belegung als Wort,
// Topfpunkten je Loch und Sorten; Prüfstatus als neutraler Badge, nie nur Farbe
import { Fragment } from 'react';
import type { Topfpunkt } from '../../domain/anlage/belegung.ts';
import { PfeilSymbol } from './Sortenzeile.tsx';
import { StatusBadge } from './StatusBadge.tsx';

export function Belegungszeile({
  kennung,
  zeile,
  zusatz,
  punkte,
  badge,
  href,
}: {
  kennung: string;
  zeile: string;
  zusatz?: string;
  punkte?: readonly Topfpunkt[];
  badge?: string;
  href: string;
}) {
  const name = [kennung, zeile, zusatz, badge].filter(Boolean).join(', ');
  return (
    <a className="hv-belegung" href={href} aria-label={name}>
      <span className="hv-belegung-kennung">{kennung}</span>
      <span className="hv-belegung-text">
        <span className="hv-belegung-zeile">
          {/* Umbruch nur an den Trennpunkten, nie mitten in «5 von 25» */}
          <span className="hv-belegung-wort">
            {zeile.split(' · ').map((teil, i) => (
              <Fragment key={i}>
                {i > 0 ? ' · ' : ''}
                <span className="hv-belegung-teil">{teil}</span>
              </Fragment>
            ))}
          </span>
          {badge ? <StatusBadge tone="neutral">{badge}</StatusBadge> : null}
        </span>
        {punkte && punkte.length > 0 ? (
          <span className="hv-belegung-punkte" aria-hidden="true">
            {punkte.map((p, i) => (
              <span key={i} className={`hv-topfpunkt hv-topfpunkt-${p}`} />
            ))}
          </span>
        ) : null}
        {zusatz ? <span className="hv-belegung-zusatz">{zusatz}</span> : null}
      </span>
      <PfeilSymbol richtung="rechts" className="hv-belegung-pfeil" />
    </a>
  );
}
