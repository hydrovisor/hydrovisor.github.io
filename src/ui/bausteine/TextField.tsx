// Baustein TextField (design-system/components/TextField.md): Beschriftung immer sichtbar, Fehler ersetzt den Hilfetext
import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  unit?: string;
  hint?: string;
  error?: string | undefined;
}

export function TextField({ label, unit, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId();
  const meldung = error ?? hint;
  return (
    <div className={['hv-field', error && 'hv-field-error', className].filter(Boolean).join(' ')}>
      <label className="hv-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="hv-field-box">
        <input
          id={id}
          className="hv-field-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={meldung ? `${id}-msg` : undefined}
          {...rest}
        />
        {unit ? <span className="hv-field-unit">{unit}</span> : null}
      </div>
      {meldung ? (
        <p id={`${id}-msg`} className={error ? 'hv-field-msg hv-field-msg-error' : 'hv-field-msg'}>
          {meldung}
        </p>
      ) : null}
    </div>
  );
}
