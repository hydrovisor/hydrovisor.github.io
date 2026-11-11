// Baustein Choice (design-system/components/Choice.md): Wahlliste mit aria-pressed und Häkchen, ohne Systemtastatur
// (Säen, Plan 23); Stufe als Badge mit Symbol und Wort (Passung, Plan 36); Einzelauswahl mit rundem Punkt und in einer
// Zeile als gleich breite Segmente (U-04, B7)
import type { Einstufung } from '../../domain/passung/passung.ts';
import { Stufe } from './Stufe.tsx';

export interface Option {
  wert: string;
  titel: string;
  zusatz?: string;
  deaktiviert?: boolean;
  /** Einstufung der Passung nach dem Titel als Baustein Stufe (Wort und Symbol, nie Farbe allein) */
  stufe?: Einstufung;
}

function Haken() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Choice({
  optionen,
  gewaehlt,
  onWahl,
  label,
  zeile,
  einzeln,
}: {
  optionen: readonly Option[];
  gewaehlt: readonly string[];
  onWahl: (wert: string) => void;
  /** Name der Gruppe */
  label: string;
  /** Optionen nebeneinander mit Umbruch */
  zeile?: boolean;
  /** genau eine Option gilt: runder Punkt statt Häkchen, in einer Zeile gleich breite Segmente (U-04, B7) */
  einzeln?: boolean;
}) {
  // bis drei Optionen in einer Zeile: gleich breite Segmente; mehr Optionen brechen um wie bisher
  const segmente = einzeln === true && zeile === true && optionen.length <= 3;
  const klasse = [
    'hv-choice',
    zeile && 'hv-choice-zeile',
    einzeln && 'hv-choice-einzeln',
    segmente && 'hv-choice-segmente',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={klasse} role="group" aria-label={label}>
      {optionen.map((o) => {
        const an = gewaehlt.includes(o.wert);
        return (
          <button
            key={o.wert}
            type="button"
            className="hv-choice-item"
            aria-pressed={an}
            disabled={o.deaktiviert}
            onClick={() => onWahl(o.wert)}
          >
            <span className="hv-choice-check">{an && !einzeln ? <Haken /> : null}</span>
            <span className="hv-choice-text">
              <span className="hv-choice-titel">{o.titel}</span>{' '}
              {o.stufe ? (
                <>
                  <Stufe einstufung={o.stufe} />{' '}
                </>
              ) : null}
              {o.zusatz ? <span className="hv-choice-zusatz">{o.zusatz}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
