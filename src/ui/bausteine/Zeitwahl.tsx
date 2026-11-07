// Baustein Zeitwahl (design-system/components/Zeitwahl.md, Plan 142): Uhrzeit mit zwei senkrechten Drehreglern
// (Stunde, Minute) wählen statt eintippen. Der Wert in der Mitte ist gewählt; Antippen und Pfeil auf/ab wählen auch.
// Nur für Schreibtisch-Masken: Regal-Masken haben keine Wischgesten.
import { useId, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { indexAusScroll, nachbar, werteListe, zeitText, zeitZerlegen, zweistellig } from './zeitwahl-wert.ts';

/** Browser ohne `scrollend` (vor Chrome 114) übernehmen den Wert nach einer Ruhe von 120 ms */
const HAT_SCROLLEND = typeof window !== 'undefined' && 'onscrollend' in window;
const RUHE_MS = 120;

function Rad({
  name,
  werte,
  wert,
  onWahl,
}: {
  name: string;
  werte: number[];
  wert: number;
  onWahl: (neu: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const erstes = useRef(true);
  const id = useId();
  const index = Math.max(0, werte.indexOf(wert));

  const zeilenhoehe = (el: HTMLElement) =>
    el.querySelector<HTMLElement>('[role="option"]')?.offsetHeight ?? 0;

  // gewählten Wert in die Mitte drehen: beim ersten Zeichnen sofort, danach weich
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ziel = index * zeilenhoehe(el);
    const sofort = erstes.current;
    erstes.current = false;
    if (Math.abs(el.scrollTop - ziel) < 1) return;
    el.scrollTo({ top: ziel, behavior: sofort ? 'instant' : 'smooth' });
  }, [index]);

  // nach dem Einrasten: der Wert in der Mitte ist gewählt
  function eingerastet() {
    const el = ref.current;
    if (!el) return;
    const neu = werte[indexAusScroll(el.scrollTop, zeilenhoehe(el), werte.length)];
    if (neu !== undefined && neu !== wert) onWahl(neu);
  }

  function taste(ev: KeyboardEvent<HTMLDivElement>) {
    const ziel =
      ev.key === 'ArrowUp'
        ? nachbar(werte, wert, -1)
        : ev.key === 'ArrowDown'
          ? nachbar(werte, wert, 1)
          : ev.key === 'Home'
            ? werte[0]
            : ev.key === 'End'
              ? werte[werte.length - 1]
              : undefined;
    if (ziel === undefined) return;
    ev.preventDefault();
    if (ziel !== wert) onWahl(ziel);
  }

  return (
    <div
      ref={ref}
      className="hv-zeitwahl-rad"
      role="listbox"
      aria-label={name}
      tabIndex={0}
      aria-activedescendant={`${id}-${wert}`}
      onKeyDown={taste}
      {...(HAT_SCROLLEND
        ? { onScrollEnd: eingerastet }
        : {
            onScroll: () => {
              clearTimeout(timer.current);
              timer.current = setTimeout(eingerastet, RUHE_MS);
            },
          })}
    >
      {werte.map((w) => (
        <div
          key={w}
          id={`${id}-${w}`}
          role="option"
          aria-selected={w === wert}
          className="hv-zeitwahl-wert"
          onClick={() => {
            if (w !== wert) onWahl(w);
          }}
        >
          {zweistellig(w)}
        </div>
      ))}
    </div>
  );
}

export function Zeitwahl({
  label,
  wert,
  onWert,
  min = 0,
  max = 23,
  minutenSchritt = 5,
  hint,
  error,
}: {
  label: string;
  /** «HH:MM» (auch «HH:MM:SS»); ungültig zeigt die erste Stunde und 00, ohne onWert (Plan 142 A3) */
  wert: string;
  onWert: (neu: string) => void;
  /** erste und letzte Stunde */
  min?: number;
  max?: number;
  /** Minutenschritt, Standard 5 (Plan 142 A1) */
  minutenSchritt?: number;
  hint?: string;
  error?: string | undefined;
}) {
  const id = useId();
  const z = zeitZerlegen(wert);
  const stunden = werteListe(min, max, 1, z?.stunde);
  const minuten = werteListe(0, 59, minutenSchritt, z?.minute);
  const stunde = z?.stunde ?? stunden[0] ?? min;
  const minute = z?.minute ?? 0;
  const meldung = error ?? hint;
  return (
    <div
      className={['hv-zeitwahl', error && 'hv-zeitwahl-error'].filter(Boolean).join(' ')}
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={meldung ? `${id}-msg` : undefined}
    >
      <span id={`${id}-label`} className="hv-field-label">
        {label}
      </span>
      <div className="hv-zeitwahl-raeder">
        <Rad
          name={`${label} Stunde`}
          werte={stunden}
          wert={stunde}
          onWahl={(s) => onWert(zeitText({ stunde: s, minute }))}
        />
        <span className="hv-zeitwahl-trenner" aria-hidden="true">
          :
        </span>
        <Rad
          name={`${label} Minute`}
          werte={minuten}
          wert={minute}
          onWahl={(m) => onWert(zeitText({ stunde, minute: m }))}
        />
      </div>
      {meldung ? (
        <p id={`${id}-msg`} className={error ? 'hv-field-msg hv-field-msg-error' : 'hv-field-msg'}>
          {meldung}
        </p>
      ) : null}
    </div>
  );
}
