// Baustein Tile (design-system/components/Tile.md): Kachel für Messwert und Ort
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import { StatusIcon } from './StatusIcon.tsx';

type Bewertung = 'ok' | 'warn' | 'danger';

interface MesswertProps {
  bezeichnung: string;
  wert?: string;
  ton?: Bewertung;
  trend?: string;
  /** Trendzeile mit Kennzeichen «veraltet» (Tile.md, R10.3) */
  veraltet?: boolean;
  /** Lage auf der Spur in Prozent der Breite */
  spur?: { von: number; bis: number; vorher?: number; neu?: number };
  aktiv?: boolean;
  /** ohne reservierten Platz für das Statussymbol (Tile.md) */
  kompakt?: boolean;
  onClick?: () => void;
}

export function MesswertKachel({
  bezeichnung,
  wert,
  ton,
  trend,
  veraltet,
  spur,
  aktiv,
  kompakt,
  onClick,
}: MesswertProps) {
  const klassen = ['hv-tile', ton && `hv-tile-${ton}`, aktiv && 'hv-tile-aktiv', kompakt && 'hv-tile-kompakt']
    .filter(Boolean)
    .join(' ');
  const inhalt = (
    <>
      <span className="hv-tile-kopf">
        <span className="hv-tile-label">{bezeichnung}</span>
        {ton ? <StatusIcon ton={ton} /> : null}
      </span>
      <span className={wert ? 'hv-tile-value' : 'hv-tile-value hv-tile-value-leer'}>{wert || '–'}</span>
      {trend ? (
        <span className="hv-tile-trend">
          {veraltet ? (
            // kurz «Uhr veraltet», damit das Kennzeichen in 88 dp passt; der Vorwert bleibt im Namen (Runde 1 Befund 2)
            <span className="hv-tile-trend-veraltet" title={trend}>
              <Uhr />
              veraltet
              <span className="hv-visually-hidden">{` (${trend.replace(/ · veraltet$/, '')})`}</span>
            </span>
          ) : (
            trend
          )}
        </span>
      ) : null}
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
  /** Regalbild: Messstelle W gestrichelt (Tile.md «Regalbild») */
  messstelle?: boolean;
}

export function OrtKachel({ kennung, zeilen, badge, onClick, messstelle }: OrtProps) {
  return (
    <button type="button" className={messstelle ? 'hv-tile hv-regal-w' : 'hv-tile'} onClick={onClick}>
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

function Uhr() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

/** Zeile der Ergebniszone: Statuswort in voller Breite, Wert rechts */
export function Ergebnis({ ton, wert, children }: { ton: Bewertung; wert?: string; children?: ReactNode }) {
  return (
    <div className={`hv-ergebnis hv-ergebnis-${ton}`} role="status">
      <StatusIcon ton={ton} />
      <span>{STATUSWORT[ton]}</span>
      {wert ? <span className="hv-ergebnis-wert">{wert}</span> : null}
      {children}
    </div>
  );
}

export interface ErgebnisHinweis {
  folge: string;
  massnahme: string;
  text?: string;
  sollwert?: string;
  ton: 'info' | 'warn' | 'danger';
}

/** Ergebniszone (Tile.md): ersetzt den Ziffernblock in dessen Höhe */
export function Ergebniszone({
  zeilen,
  hinweise,
  ohneBewertung,
  zusatz,
}: {
  zeilen: { ton: Bewertung; wert: string }[];
  hinweise: ErgebnisHinweis[];
  ohneBewertung?: boolean;
  /** Plan 29: Vorschlag pH-Minus mit Knopf unter den Hinweisen */
  zusatz?: ReactNode;
}) {
  return (
    <section className="hv-ergebniszone" aria-label="Ergebnis">
      {ohneBewertung ? (
        <p className="hv-ergebnis-leer">Kein Zielbereich: Werte werden ohne Bewertung gespeichert</p>
      ) : (
        zeilen.map((z) => <Ergebnis key={z.wert} ton={z.ton} wert={z.wert} />)
      )}
      {hinweise.slice(0, 2).map((h) => (
        <p
          key={`${h.folge}${h.massnahme}`}
          className={
            h.ton === 'info' ? 'hv-ergebnis-hinweis' : `hv-ergebnis-hinweis hv-ergebnis-hinweis-${h.ton}`
          }
        >
          <strong>{h.folge}.</strong>
          {/* der Messwert steht schon in der Zeile darüber; hier nur der Sollwert (05_masken.md 5) */}
          {h.sollwert ? ` ${h.sollwert}` : h.text ? ` ${h.text}` : ''} {h.massnahme}.
        </p>
      ))}
      {zusatz}
    </section>
  );
}

/** Rückfrage vor dem Speichern (Tile.md, R10.3): Sperre 400 ms am Ja-Knopf (U13) */
export function Rueckfrage({
  frage,
  nein,
  ja,
  onNein,
  onJa,
}: {
  frage: string;
  nein: string;
  ja: string;
  onNein: () => void;
  onJa: () => void;
}) {
  const [gesperrt, setGesperrt] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGesperrt(false), 400);
    return () => clearTimeout(t);
  }, [frage]);
  return (
    <section className="hv-rueckfrage" role="alertdialog" aria-label="Rückfrage">
      <p className="hv-rueckfrage-frage">{frage}</p>
      <div className="hv-rueckfrage-knoepfe">
        <Button variant="secondary" onClick={onNein}>
          {nein}
        </Button>
        <Button disabled={gesperrt} onClick={onJa}>
          {ja}
        </Button>
      </div>
    </section>
  );
}
