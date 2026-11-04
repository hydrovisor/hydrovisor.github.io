# TextField

Eingabefeld mit Beschriftung, optionaler Einheit, Hilfetext und Fehlermeldung, vor allem für Messwerte.

- Props: `label`, `unit` (rechts im Feld), `hint`, `error` (ersetzt den Hilfetext); alle Attribute von `<input>`. Für Messwerte `inputMode="decimal"` setzen.
- Hilfetext nennt den Sollwert: «Sollwert 5.5–6.5». Fehler sagen, was gilt: «Bitte einen Wert zwischen 0 und 5 eingeben.»
- Schrift 16px, Höhe `size-touch`; Beschriftung immer sichtbar, nicht nur als Platzhalter.
- **Auswahl und Wahlgruppe** (Schreibtisch, Plan 20): Eine Auswahl aus wenigen festen Werten (z. B. Betriebsart) ist ein `select` mit der Klasse `hv-field-input` unter derselben sichtbaren Beschriftung (`hv-field-label`). Zwei bis drei sich ausschliessende Werte (z. B. Standort Indoor oder Outdoor) stehen als Radio-Knöpfe in einem `fieldset` mit `legend` (`hv-anlage-feldgruppe`); jeder Wert hat ein sichtbares Wort, nie nur ein Symbol. In Regal-Masken gibt es beides nicht (keine Systemtastatur, Konzept 6.3).
