// Baustein Checklist (design-system/components/Checklist.md): feste Reihenfolge, Timer gegen absolute Endzeit
export interface Zeile {
  nr: number;
  titel: string;
  menge?: string;
  /** absolute Endzeit des Timers in ms */
  timerEnde?: number;
  zustand: 'offen' | 'aktiv' | 'erledigt';
}

/** «14:32» aus der Restzeit; nie negativ */
export function restzeit(ende: number, jetzt: number): string {
  const s = Math.max(0, Math.ceil((ende - jetzt) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Haken() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Checklist({
  zeilen,
  onHaken,
  jetzt,
}: {
  zeilen: Zeile[];
  onHaken?: (nr: number) => void;
  jetzt: number;
}) {
  return (
    <ol className="hv-checklist">
      {zeilen.map((z) => {
        const timerLaeuft = z.timerEnde !== undefined && z.timerEnde > jetzt;
        const gesperrt = z.zustand === 'offen' || (z.zustand === 'aktiv' && timerLaeuft);
        return (
          <li key={z.nr} className={`hv-check-row hv-check-${z.zustand}`}>
            <span className="hv-check-nr">{z.nr}</span>
            <span className="hv-check-text">
              <span className="hv-check-titel">{z.titel}</span>
              {z.menge ? <span className="hv-check-menge">{z.menge}</span> : null}
              {z.timerEnde !== undefined && z.zustand !== 'erledigt' ? (
                <span className="hv-check-timer" role="timer">
                  {restzeit(z.timerEnde, jetzt)}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="hv-check-haken"
              disabled={gesperrt}
              aria-label={z.zustand === 'erledigt' ? `Zeile ${z.nr} abwählen` : `Zeile ${z.nr} abhaken`}
              onClick={() => onHaken?.(z.nr)}
            >
              {z.zustand === 'erledigt' ? <Haken /> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
