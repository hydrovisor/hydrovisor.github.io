// Baustein PhotoField (design-system/components/PhotoField.md): Foto mit der Kamera aufnehmen, aus der Galerie oder aus
// Dateien und Cloud-Ablagen wählen; Vorschau, «Foto ersetzen» (Plan kamera: Chrome ab Android 14 zeigt für
// accept="image/*" ohne capture nur den Fotoauswähler ohne Kamera)
import { useId, type ChangeEvent } from 'react';

interface PhotoFieldProps {
  label: string;
  vorschau?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  onWahl: (datei: File) => void;
  /** Text des Kamera-Knopfs statt «Foto aufnehmen» und «Foto ersetzen» (Plan 207) */
  knopf?: string | undefined;
  /** gesperrt, z. B. während des Hochladens */
  deaktiviert?: boolean | undefined;
}

export function PhotoField({ label, vorschau, hint, error, onWahl, knopf, deaktiviert }: PhotoFieldProps) {
  const id = useId();
  const meldung = error ?? (vorschau ? 'Foto gewählt' : hint);
  const gewaehlt = (ev: ChangeEvent<HTMLInputElement>) => {
    const datei = ev.target.files?.[0];
    if (datei) onWahl(datei);
    ev.target.value = '';
  };
  const gesperrt = deaktiviert ? true : undefined;
  return (
    <div className={['hv-field', 'hv-photo', error && 'hv-field-error'].filter(Boolean).join(' ')}>
      <span className="hv-field-label">{label}</span>
      <div className="hv-photo-zeile">
        {/* Kamera direkt (capture), ohne Umweg über den Fotoauswähler */}
        <input
          id={`${id}-kamera`}
          className="hv-photo-input"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label={`${label} mit der Kamera`}
          disabled={deaktiviert}
          onChange={gewaehlt}
        />
        <label htmlFor={`${id}-kamera`} className="hv-btn hv-btn-secondary" aria-disabled={gesperrt}>
          {knopf ?? (vorschau ? 'Foto ersetzen' : 'Foto aufnehmen')}
        </label>
        {vorschau ? <img className="hv-photo-preview" src={vorschau} alt={`Foto ${label}`} /> : null}
      </div>
      <div className="hv-photo-quellen">
        {/* Fotoauswähler von Android (Galerie, Google Fotos) */}
        <input
          id={`${id}-galerie`}
          className="hv-photo-input"
          type="file"
          accept="image/*"
          aria-label={label}
          disabled={deaktiviert}
          onChange={gewaehlt}
        />
        <label
          htmlFor={`${id}-galerie`}
          className="hv-btn hv-btn-ghost hv-btn-compact"
          aria-disabled={gesperrt}
        >
          Aus Galerie wählen
        </label>
        {/* ohne accept: Android zeigt die Dateiauswahl mit Drive und anderen Cloud-Ablagen (Plan kamera A1) */}
        <input
          id={`${id}-dateien`}
          className="hv-photo-input"
          type="file"
          aria-label={`${label} aus Dateien`}
          disabled={deaktiviert}
          onChange={gewaehlt}
        />
        <label
          htmlFor={`${id}-dateien`}
          className="hv-btn hv-btn-ghost hv-btn-compact"
          aria-disabled={gesperrt}
        >
          Aus Dateien wählen
        </label>
      </div>
      {meldung ? (
        <p className={error ? 'hv-field-msg hv-field-msg-error' : 'hv-field-msg'}>{meldung}</p>
      ) : null}
    </div>
  );
}
