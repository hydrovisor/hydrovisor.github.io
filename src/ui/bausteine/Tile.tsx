// Baustein Tile (design-system/components/Tile.md): Kachel für Messwert und Ort
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import { EINSTUFUNG_NAME, type Einstufung } from '../../domain/passung/passung.ts';
import { StatusIcon } from './StatusIcon.tsx';
import { Stufe } from './Stufe.tsx';

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

/** Variante «Gemüse» (Tile.md, Plan 205): Name, Zahl der Sorten, «n gewählt», beste Stufe; Name als ein Satz */
export function GemueseKachel({
  name,
  sorten,
  sortenGesamt,
  gewaehlt,
  stufe,
  onClick,
}: {
  name: string;
  sorten: number;
  /** alle Sorten des Gemüses, auch eingeklappte «Nicht empfohlen» (Runde 1 Befund 8) */
  sortenGesamt?: number;
  gewaehlt: number;
  stufe?: Einstufung;
  onClick: () => void;
}) {
  const anzahl =
    sortenGesamt !== undefined && sortenGesamt > sorten
      ? `${String(sorten)} von ${String(sortenGesamt)} Sorten`
      : sorten === 1
        ? '1 Sorte'
        : `${String(sorten)} Sorten`;
  const teile = [
    name,
    anzahl,
    gewaehlt > 0 ? `${String(gewaehlt)} gewählt` : '',
    stufe ? EINSTUFUNG_NAME[stufe] : '',
  ];
  return (
    <button
      type="button"
      className={gewaehlt > 0 ? 'hv-tile hv-tile-gemuese hv-tile-aktiv' : 'hv-tile hv-tile-gemuese'}
      aria-label={teile.filter(Boolean).join(', ')}
      onClick={onClick}
    >
      <span className="hv-tile-gemuese-name">{name}</span>
      <span className="hv-tile-zeile">{anzahl}</span>
      {gewaehlt > 0 || stufe ? (
        <span className="hv-tile-gemuese-badges">
          {gewaehlt > 0 ? (
            <span className="hv-badge hv-badge-info">
              <svg
                className="hv-status-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {`${String(gewaehlt)} gewählt`}
            </span>
          ) : null}
          {stufe ? <Stufe einstufung={stufe} /> : null}
        </span>
      ) : null}
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
  aktion,
}: {
  zeilen: { ton: Bewertung; wert: string }[];
  hinweise: ErgebnisHinweis[];
  ohneBewertung?: boolean;
  /** Plan 29: Knopf im Hinweis, dessen Massnahme passt (pH-Minus gegeben) */
  aktion?: { bei: (h: ErgebnisHinweis) => boolean; knopf: ReactNode };
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
      {/* Plan 29: eigene Zeile unter den Hinweisen, damit der gekürzte Hinweistext den Knopf nicht verdeckt */}
      {aktion && hinweise.slice(0, 2).some((h) => aktion.bei(h)) ? (
        <div className="hv-ergebnis-aktion">{aktion.knopf}</div>
      ) : null}
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
