// Baustein NumPad (design-system/components/NumPad.md): Raster nach Entscheid R3, Prellfilter 80 ms
import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { prellfilter, type Prellzustand } from './prellfilter.ts';

export type Taste =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | 'weiter'
  | 'leeren'
  | 'minus'
  | 'plus'
  | 'zurueck';

interface NumPadProps {
  onTaste: (taste: Taste) => void;
  /** Wiederholung der zuletzt getippten Eingabe, gross über dem Raster */
  echo?: string;
  schritt?: number;
  /** Variante B des Regaltests: ohne ± */
  ohnePlusMinus?: boolean;
  /** Button «Speichern» unter dem Raster, mit 16 dp Abstand (hv-numpad-save) */
  speichern?: ReactNode;
}

function Ruecktaste() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" strokeLinejoin="round" />
      <path d="M17 9l-6 6M11 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

export function NumPad({ onTaste, echo, schritt = 0.1, ohnePlusMinus, speichern }: NumPadProps) {
  const letzter = useRef<Prellzustand | null>(null);
  const s = schritt.toFixed(1);
  // Zeilen links nach rechts; rechte Spalte von oben «leeren», «−0.1», «+0.1», Rücktaste (R3)
  const tasten: { taste: Taste; text: ReactNode; name: string; aktion?: boolean }[] = [
    { taste: '7', text: '7', name: 'Ziffer 7' },
    { taste: '8', text: '8', name: 'Ziffer 8' },
    { taste: '9', text: '9', name: 'Ziffer 9' },
    { taste: 'leeren', text: 'leeren', name: 'leeren', aktion: true },
    { taste: '4', text: '4', name: 'Ziffer 4' },
    { taste: '5', text: '5', name: 'Ziffer 5' },
    { taste: '6', text: '6', name: 'Ziffer 6' },
    { taste: 'minus', text: `−${s}`, name: `minus ${s}`, aktion: true },
    { taste: '1', text: '1', name: 'Ziffer 1' },
    { taste: '2', text: '2', name: 'Ziffer 2' },
    { taste: '3', text: '3', name: 'Ziffer 3' },
    { taste: 'plus', text: `+${s}`, name: `plus ${s}`, aktion: true },
    { taste: '.', text: '.', name: 'Punkt' },
    { taste: '0', text: '0', name: 'Ziffer 0' },
    { taste: 'weiter', text: 'weiter', name: 'weiter', aktion: true },
    { taste: 'zurueck', text: <Ruecktaste />, name: 'Rücktaste', aktion: true },
  ];

  function tippen(taste: Taste, e: PointerEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) {
    const { zaehlt, zustand } = prellfilter(letzter.current, taste, e.timeStamp);
    letzter.current = zustand;
    if (zaehlt) onTaste(taste);
  }

  return (
    <div className="hv-numpad">
      <output className="hv-numpad-echo" aria-live="polite">
        {echo}
      </output>
      <div className="hv-numpad-grid" role="group" aria-label="Ziffernblock">
        {tasten.map((t) => {
          const aus = ohnePlusMinus && (t.taste === 'minus' || t.taste === 'plus');
          return (
            <button
              key={t.taste}
              type="button"
              className={t.aktion ? 'hv-numpad-key hv-numpad-key-aktion' : 'hv-numpad-key'}
              aria-label={t.name}
              data-taste={t.taste}
              disabled={aus}
              style={aus ? { visibility: 'hidden' } : undefined}
              onPointerDown={(e) => tippen(t.taste, e)}
              // Tastatur (Enter, Leertaste) löst nur click aus, ohne pointerdown
              onClick={(e) => {
                if (e.detail === 0) tippen(t.taste, e);
              }}
            >
              {t.text}
            </button>
          );
        })}
      </div>
      {speichern ? <div className="hv-numpad-save">{speichern}</div> : null}
    </div>
  );
}
