// Baustein Choice (design-system/components/Choice.md): Wahlliste mit aria-pressed und Häkchen, ohne Systemtastatur
// (Säen, Plan 23); Stufe als Badge mit Symbol und Wort (Passung, Plan 36)
import { StatusIcon } from './StatusIcon.tsx';

export interface Option {
  wert: string;
  titel: string;
  zusatz?: string;
  deaktiviert?: boolean;
  /** Stufe nach dem Titel, Wort und Symbol (nie Farbe allein), z. B. «Empfohlen» */
  stufe?: { ton: 'ok' | 'warn' | 'danger'; wort: string };
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
}: {
  optionen: readonly Option[];
  gewaehlt: readonly string[];
  onWahl: (wert: string) => void;
  /** Name der Gruppe */
  label: string;
  /** Optionen nebeneinander mit Umbruch */
  zeile?: boolean;
}) {
  return (
    <div className={zeile ? 'hv-choice hv-choice-zeile' : 'hv-choice'} role="group" aria-label={label}>
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
            <span className="hv-choice-check">{an ? <Haken /> : null}</span>
            <span className="hv-choice-text">
              <span className="hv-choice-titel">{o.titel}</span>{' '}
              {o.stufe ? (
                <>
                  <span className={`hv-badge hv-badge-${o.stufe.ton}`}>
                    <StatusIcon ton={o.stufe.ton} />
                    {o.stufe.wort}
                  </span>{' '}
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
