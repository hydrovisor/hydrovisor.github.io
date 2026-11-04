// Baustein Checklist (design-system/components/Checklist.md): feste Reihenfolge, Timer gegen absolute Endzeit.
// Variante «selbst» (Einrichtung UC0, Plan 18): Zeilen haken sich durch die Erfassung selbst ab.
import type { ReactNode } from 'react';

export interface Zeile {
  nr: number;
  titel: string;
  menge?: string;
  /** absolute Endzeit des Timers in ms */
  timerEnde?: number;
  zustand: 'offen' | 'aktiv' | 'erledigt';
  /** Variante «selbst»: Knopf oder Hinweis unter dem Titel */
  aktion?: ReactNode;
}

/** «14:32» aus der Restzeit, ab einer Stunde «11:59:30»; nie negativ */
export function restzeit(ende: number, jetzt: number): string {
  const s = Math.max(0, Math.ceil((ende - jetzt) / 1000));
  const sek = String(s % 60).padStart(2, '0');
  if (s < 3600) return `${Math.floor(s / 60)}:${sek}`;
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${sek}`;
}

function Haken() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUSTEXT = { offen: 'offen', aktiv: 'als Nächstes', erledigt: 'erledigt' } as const;

export function Checklist({
  zeilen,
  onHaken,
  jetzt,
  variante = 'haken',
  label,
}: {
  zeilen: Zeile[];
  onHaken?: (nr: number) => void;
  jetzt: number;
  /** «haken»: Tim hakt ab (R4.6); «selbst»: die Erfassung hakt ab (UC0) */
  variante?: 'haken' | 'selbst';
  label?: string;
}) {
  return (
    <ol className="hv-checklist" aria-label={label}>
      {zeilen.map((z) => {
        const timerLaeuft = z.timerEnde !== undefined && z.timerEnde > jetzt;
        const gesperrt = z.zustand === 'offen' || (z.zustand === 'aktiv' && timerLaeuft);
        return (
          <li key={z.nr} className={`hv-check-row hv-check-${z.zustand}`} data-zustand={z.zustand}>
            <span className="hv-check-nr">{z.nr}</span>
            <span className="hv-check-text">
              <span className="hv-check-titel">{z.titel}</span>
              {z.menge ? <span className="hv-check-menge">{z.menge}</span> : null}
              {z.timerEnde !== undefined && z.zustand !== 'erledigt' ? (
                <span className="hv-check-timer" role="timer">
                  {restzeit(z.timerEnde, jetzt)}
                </span>
              ) : null}
              {z.aktion ? <span className="hv-check-aktion">{z.aktion}</span> : null}
            </span>
            {variante === 'selbst' ? (
              <span className="hv-check-status" role="img" aria-label={STATUSTEXT[z.zustand]}>
                {z.zustand === 'erledigt' ? <Haken /> : null}
              </span>
            ) : (
              <button
                type="button"
                className="hv-check-haken"
                disabled={gesperrt}
                aria-label={z.zustand === 'erledigt' ? `Zeile ${z.nr} abwählen` : `Zeile ${z.nr} abhaken`}
                onClick={() => onHaken?.(z.nr)}
              >
                {z.zustand === 'erledigt' ? <Haken /> : null}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
