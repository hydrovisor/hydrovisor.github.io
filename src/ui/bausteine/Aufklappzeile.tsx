// Baustein Aufklappzeile (design-system/components/Aufklappzeile.md): eine Zeile, die einen Abschnitt zeigt oder
// einklappt. Name «<Titel> anzeigen» bzw. «<Titel> einklappen», Gegenstand und Verb wie in der Checklist.
export function Aufklappzeile({
  titel,
  offen,
  onWechsel,
}: {
  titel: string;
  offen: boolean;
  onWechsel: (offen: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="hv-aufklapp-knopf"
      aria-expanded={offen}
      onClick={() => onWechsel(!offen)}
    >
      <span>{titel}</span> <span className="hv-aufklapp-aktion">{offen ? 'einklappen' : 'anzeigen'}</span>
    </button>
  );
}
