// Baustein Tuetenfoto (design-system/components/Tuetenfoto.md, Plan 205): Anzeige des Tütenfotos; bis zum Paket
// Tütenfotos nur der Platzhalter (Entscheid 0023 Punkt 6)
import { KameraSymbol } from './Sortenzeile.tsx';

export function Tuetenfoto({ bild, alt }: { bild?: string; alt?: string }) {
  if (bild)
    return (
      <div className="hv-tuetenfoto">
        <img src={bild} alt={alt ?? 'Tütenfoto'} />
      </div>
    );
  return (
    <div className="hv-tuetenfoto hv-tuetenfoto-leer" role="img" aria-label="Noch kein Tütenfoto">
      <KameraSymbol />
      <strong>Noch kein Tütenfoto</strong>
      <span>Das Foto ergänzt du am Schreibtisch unter Sorten.</span>
    </div>
  );
}
