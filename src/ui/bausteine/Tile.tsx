// Baustein Tile (design-system/components/Tile.md): Kachel für Messwert und Ort
import type { ReactNode } from 'react';
import { StatusIcon } from './StatusIcon.tsx';

type Bewertung = 'ok' | 'warn' | 'danger';

interface MesswertProps {
  bezeichnung: string;
  wert?: string;
  ton?: Bewertung;
  trend?: string;
  /** Lage auf der Spur in Prozent der Breite */
  spur?: { von: number; bis: number; vorher?: number; neu?: number };
  aktiv?: boolean;
  onClick?: () => void;
}

export function MesswertKachel({ bezeichnung, wert, ton, trend, spur, aktiv, onClick }: MesswertProps) {
  const klassen = ['hv-tile', ton && `hv-tile-${ton}`, aktiv && 'hv-tile-aktiv'].filter(Boolean).join(' ');
  const inhalt = (
    <>
      <span className="hv-tile-kopf">
        <span className="hv-tile-label">{bezeichnung}</span>
        {ton ? <StatusIcon ton={ton} /> : null}
      </span>
      <span className={wert ? 'hv-tile-value' : 'hv-tile-value hv-tile-value-leer'}>{wert || '–'}</span>
      {trend ? <span className="hv-tile-trend">{trend}</span> : null}
      {spur ? (
        <span className="hv-tile-spur" aria-hidden="true">
          <span
            className="hv-tile-spur-band"
            style={{ left: `${spur.von}%`, width: `${spur.bis - spur.von}%` }}
          />
          {spur.vorher !== undefined ? (
            <span className="hv-tile-spur-vorher" style={{ left: `${spur.vorher}%` }} />
          ) : null}
          {spur.neu !== undefined ? (
            <span className="hv-tile-spur-neu" style={{ left: `${spur.neu}%` }} />
          ) : null}
        </span>
      ) : null}
    </>
  );
  return onClick ? (
    <button type="button" className={klassen} aria-pressed={aktiv} onClick={onClick}>
      {inhalt}
    </button>
  ) : (
    <div className={klassen}>{inhalt}</div>
  );
}

interface OrtProps {
  kennung: string;
  zeilen: string[];
  badge?: ReactNode;
  onClick?: () => void;
}

export function OrtKachel({ kennung, zeilen, badge, onClick }: OrtProps) {
  return (
    <button type="button" className="hv-tile" onClick={onClick}>
      <span className="hv-tile-kennung">{kennung}</span>
      {zeilen.map((z) => (
        <span key={z} className="hv-tile-zeile">
          {z}
        </span>
      ))}
      {badge}
    </button>
  );
}

const STATUSWORT: Record<Bewertung, string> = {
  ok: 'Im grünen Bereich',
  warn: 'Knapp daneben',
  danger: 'Ausserhalb',
};

/** Ergebniszone der Messmaske: Statuswort in voller Breite */
export function Ergebnis({ ton, children }: { ton: Bewertung; children?: ReactNode }) {
  return (
    <div className={`hv-ergebnis hv-ergebnis-${ton}`} role="status">
      <StatusIcon ton={ton} />
      <span>{STATUSWORT[ton]}</span>
      {children}
    </div>
  );
}
