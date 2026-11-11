# Button

Löst eine Aktion aus; `primary` höchstens einmal pro Screen, für das, wofür der Screen da ist.

- Props: `variant` = `primary` (Standard), `secondary`, `ghost`, `danger`; `size` = `default` (48px hoch) oder `compact` (40px); `block` für volle Breite; `icon` (ein Lucide-Symbol, 24px); alle Attribute von `<button>`.
- Beschriftung beginnt mit dem Verb: «Messwert speichern». Keine Ausrufezeichen.
- `danger` nur für Aktionen, die etwas entfernen; vorher bestätigen lassen.
- Am Handy steht der Hauptbutton unten im Daumenbereich, mit `block`.
- Zweizeilig (`hv-btn-zweizeilig`, Plan 30): Verb oben, Unterzeile in `<small>` («Speichern» · «Pegel auf der Marke»); im Regal 72 dp hoch. Zwei solche Buttons nebeneinander ersetzen den einen Speicherknopf.
- Gedrückt (U-01): jede Taste reagiert beim Tippen sofort (dunkler, 1 px eingedrückt, ohne Übergang); in Regal-Masken dazu beim Auslösen (click) eine kurze Vibration von 10 ms (`src/ui/haptik.ts`), wo das Gerät es kann; gesperrte Tasten vibrieren nicht. Gilt ebenso für Kacheln, Auswahl, Löcher, Stepper und Haken.
