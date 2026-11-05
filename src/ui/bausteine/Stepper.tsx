// Baustein Stepper (design-system/components/Stepper.md): − Wert + ohne Systemtastatur; an der Grenze ist der Knopf
// deaktiviert (Säen, Plan 23)

export function Stepper({
  label,
  wert,
  min,
  max,
  onWert,
  anzeige,
  hinweis,
}: {
  label: string;
  wert: number;
  min: number;
  max: number;
  onWert: (neu: number) => void;
  anzeige?: (wert: number) => string;
  hinweis?: string;
}) {
  return (
    <div className="hv-stepper" role="group" aria-label={label}>
      <span className="hv-stepper-label">{label}</span>
      <button
        type="button"
        className="hv-stepper-knopf"
        aria-label={`${label} weniger`}
        disabled={wert <= min}
        onClick={() => onWert(Math.max(min, wert - 1))}
      >
        −
      </button>
      <span className="hv-stepper-wert" aria-live="polite">
        {anzeige ? anzeige(wert) : wert}
      </span>
      <button
        type="button"
        className="hv-stepper-knopf"
        aria-label={`${label} mehr`}
        disabled={wert >= max}
        onClick={() => onWert(Math.min(max, wert + 1))}
      >
        +
      </button>
      {hinweis ? <span className="hv-stepper-hinweis">{hinweis}</span> : null}
    </div>
  );
}
