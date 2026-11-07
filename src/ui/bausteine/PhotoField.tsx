// Baustein PhotoField (design-system/components/PhotoField.md): Foto aus Kamera oder Galerie, Vorschau, «Foto ersetzen»
import { useId } from 'react';

interface PhotoFieldProps {
  label: string;
  vorschau?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  onWahl: (datei: File) => void;
}

export function PhotoField({ label, vorschau, hint, error, onWahl }: PhotoFieldProps) {
  const id = useId();
  const meldung = error ?? (vorschau ? 'Foto gewählt' : hint);
  return (
    <div className={['hv-field', 'hv-photo', error && 'hv-field-error'].filter(Boolean).join(' ')}>
      <span className="hv-field-label">{label}</span>
      <div className="hv-photo-zeile">
        <input
          id={id}
          className="hv-photo-input"
          type="file"
          accept="image/*"
          aria-label={label}
          onChange={(ev) => {
            const datei = ev.target.files?.[0];
            if (datei) onWahl(datei);
            ev.target.value = '';
          }}
        />
        <label htmlFor={id} className="hv-btn hv-btn-secondary">
          {vorschau ? 'Foto ersetzen' : 'Foto wählen'}
        </label>
        {vorschau ? <img className="hv-photo-preview" src={vorschau} alt={`Foto ${label}`} /> : null}
      </div>
      {meldung ? (
        <p className={error ? 'hv-field-msg hv-field-msg-error' : 'hv-field-msg'}>{meldung}</p>
      ) : null}
    </div>
  );
}
