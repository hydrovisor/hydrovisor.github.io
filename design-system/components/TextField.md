# TextField

Eingabefeld mit Beschriftung, optionaler Einheit, Hilfetext und Fehlermeldung, vor allem für Messwerte.

- Props: `label`, `unit` (rechts im Feld), `hint`, `error` (ersetzt den Hilfetext); alle Attribute von `<input>`. Für Messwerte `inputMode="decimal"` setzen.
- Hilfetext nennt den Sollwert: «Sollwert 5.5–6.5». Fehler sagen, was gilt: «Bitte einen Wert zwischen 0 und 5 eingeben.»
- Schrift 16px, Höhe `size-touch`; Beschriftung immer sichtbar, nicht nur als Platzhalter.
