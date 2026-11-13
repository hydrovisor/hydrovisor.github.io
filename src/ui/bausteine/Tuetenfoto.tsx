// Baustein Tuetenfoto (design-system/components/Tuetenfoto.md, Plan 205 und 207): Anzeige des Tütenfotos mit Wechsel
// zwischen Vorder- und Rückseite; Platzhalter ohne Foto oder ohne Verbindung. Die URLs (signierte Links) holt die Maske.
import { useState } from 'react';
import { Choice } from './Choice.tsx';
import { KameraSymbol } from './Sortenzeile.tsx';

type Seite = 'vorne' | 'hinten';

const SEITE_NAME: Record<Seite, string> = { vorne: 'Vorderseite', hinten: 'Rückseite' };
const SEITEN_OPTIONEN = [
  { wert: 'vorne', titel: 'Vorderseite' },
  { wert: 'hinten', titel: 'Rückseite' },
] as const;

function Platzhalter({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="hv-tuetenfoto hv-tuetenfoto-leer" role="img" aria-label={titel}>
      <KameraSymbol />
      <strong>{titel}</strong>
      <span>{text}</span>
    </div>
  );
}

export function Tuetenfoto({
  bild,
  rueckseite,
  hinweis,
  leerText,
  alt,
  onFehler,
}: {
  /** Vorderseite (URL) */
  bild?: string | undefined;
  /** Rückseite (URL) */
  rueckseite?: string | undefined;
  /** ein Foto ist vorhanden, aber nicht ladbar (ohne Verbindung, Link abgelaufen) oder der Link wird noch geholt */
  hinweis?: 'offline' | 'laedt' | undefined;
  /** zweite Zeile des Platzhalters ohne Foto */
  leerText?: string | undefined;
  /** Alternativtext statt «Tütenfoto Vorderseite» */
  alt?: string | undefined;
  /** das Bild einer Seite lädt nicht (z. B. Link abgelaufen); die Maske signiert neu oder zeigt «offline» */
  onFehler?: ((seite: Seite) => void) | undefined;
}) {
  const [gewaehlt, setGewaehlt] = useState<Seite>('vorne');
  if (hinweis === 'offline')
    return (
      <Platzhalter titel="Foto nur mit Verbindung" text="Das Foto lädt, sobald du wieder online bist." />
    );
  if (hinweis === 'laedt')
    return (
      <div
        className="hv-tuetenfoto hv-tuetenfoto-leer"
        role="img"
        aria-label="Tütenfoto wird geladen"
        aria-busy="true"
      >
        <span>Foto wird geladen</span>
      </div>
    );
  const urls: Partial<Record<Seite, string>> = {};
  if (bild) urls.vorne = bild;
  if (rueckseite) urls.hinten = rueckseite;
  const beide = urls.vorne !== undefined && urls.hinten !== undefined;
  // nur eine Seite: diese Seite ohne Wahl (Plan 207 A9)
  const seite: Seite | undefined = beide
    ? gewaehlt
    : urls.vorne
      ? 'vorne'
      : urls.hinten
        ? 'hinten'
        : undefined;
  if (!seite)
    return (
      <Platzhalter
        titel="Noch kein Tütenfoto"
        text={leerText ?? 'Das Foto ergänzt du am Schreibtisch unter Sorten.'}
      />
    );
  return (
    <div className="hv-tuetenfoto-block">
      <div className="hv-tuetenfoto">
        <img
          key={seite}
          src={urls[seite]}
          alt={alt ?? `Tütenfoto ${SEITE_NAME[seite]}`}
          onError={() => onFehler?.(seite)}
        />
      </div>
      {beide ? (
        <Choice
          label="Seite der Tüte"
          optionen={SEITEN_OPTIONEN}
          gewaehlt={[seite]}
          onWahl={(w) => setGewaehlt(w as Seite)}
          zeile
          einzeln
        />
      ) : null}
    </div>
  );
}
