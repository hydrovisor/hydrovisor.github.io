// Baustein Zeitwahl (design-system/components/Zeitwahl.md, Pläne 142 und 147): Uhrzeit mit zwei Drehrädern (Stunde,
// Minute) wählen statt eintippen. Die Räder drehen durch; 24:00 ist mit max={24} wählbar (Ende des Tages, Licht bis),
// Stunde 24 nur mit Minute 00. Nur für Schreibtisch-Masken: Regal-Masken haben keine Wischgesten.
import { useId } from 'react';
import { Rad } from './Drehrad.tsx';
import { werteListe, zeitText, zeitZerlegen, zweistellig } from './drehrad-wert.ts';

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
  /** erste und letzte Stunde; 24 erlaubt 24:00 */
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
      className={['hv-zeitwahl', error && 'hv-drehrad-error'].filter(Boolean).join(' ')}
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={meldung ? `${id}-msg` : undefined}
    >
      <span id={`${id}-label`} className="hv-field-label">
        {label}
      </span>
      <div className="hv-drehrad-rahmen hv-zeitwahl-raeder">
        <Rad
          name={`${label} Stunde`}
          werte={stunden}
          wert={stunde}
          anzeige={zweistellig}
          onWahl={(s) => onWert(zeitText({ stunde: s, minute }))}
        />
        <span className="hv-zeitwahl-trenner" aria-hidden="true">
          :
        </span>
        <Rad
          name={`${label} Minute`}
          werte={minuten}
          // Stunde 24 gibt es nur mit 00: das Minutenrad dreht dorthin zurück
          wert={stunde === 24 ? 0 : minute}
          anzeige={zweistellig}
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
