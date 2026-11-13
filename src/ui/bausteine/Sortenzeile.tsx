// Baustein Sortenzeile (design-system/components/Sortenzeile.md, Plan 205): Sorte mit Tütenbild, Zusatzzeile und Pfeil;
// «gewählt» mit Haken und Wort, nie nur Farbe
import type { Einstufung } from '../../domain/passung/passung.ts';
import { Stufe } from './Stufe.tsx';

export function KameraSymbol() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
      <circle cx={12} cy={13} r={3.5} />
    </svg>
  );
}

export function HakenSymbol() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PfeilSymbol({ richtung, className }: { richtung: 'rechts' | 'links'; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={richtung === 'rechts' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
    </svg>
  );
}

export function Sortenzeile({
  titel,
  zusatz,
  gewaehlt,
  stufe,
  onClick,
}: {
  titel: string;
  zusatz?: string;
  gewaehlt?: boolean;
  stufe?: Einstufung;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={gewaehlt ? 'hv-sortenzeile hv-sortenzeile-gewaehlt' : 'hv-sortenzeile'}
      onClick={onClick}
    >
      <span className="hv-sortenzeile-bild" aria-hidden="true">
        <KameraSymbol />
      </span>
      <span className="hv-sortenzeile-text">
        <span className="hv-sortenzeile-titel">
          {titel}
          {stufe ? (
            <>
              {' '}
              <Stufe einstufung={stufe} />
            </>
          ) : null}
        </span>
        {zusatz ? (
          <span className="hv-sortenzeile-zusatz">
            {gewaehlt ? <HakenSymbol /> : null} {zusatz}
          </span>
        ) : null}
      </span>
      <PfeilSymbol richtung="rechts" className="hv-sortenzeile-pfeil" />
    </button>
  );
}
