// Baustein Meldezeile (design-system/components/Meldezeile.md): fest über Leiste und festem Fuss, Text und Aktion
import { Button } from './Button.tsx';

interface MeldezeileProps {
  text: string;
  aktion?: { text: string; onClick: () => void; gesperrt?: boolean };
}

export function Meldezeile({ text, aktion }: MeldezeileProps) {
  return (
    <div className="hv-meldezeile" role="status" aria-live="polite" data-density="regal">
      <span className="hv-meldezeile-text">{text}</span>
      {aktion ? (
        <span className="hv-meldezeile-aktion">
          <Button variant="secondary" disabled={aktion.gesperrt === true} onClick={aktion.onClick}>
            {aktion.text}
          </Button>
        </span>
      ) : null}
    </div>
  );
}
