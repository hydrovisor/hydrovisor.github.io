# Button

Löst eine Aktion aus; `primary` höchstens einmal pro Screen, für das, wofür der Screen da ist.

- Props: `variant` = `primary` (Standard), `secondary`, `ghost`, `danger`; `size` = `default` (48px hoch) oder `compact` (40px); `block` für volle Breite; `icon` (ein Lucide-Symbol, 24px); alle Attribute von `<button>`.
- Beschriftung beginnt mit dem Verb: «Messwert speichern». Keine Ausrufezeichen.
- `danger` nur für Aktionen, die etwas entfernen; vorher bestätigen lassen.
- Am Handy steht der Hauptbutton unten im Daumenbereich, mit `block`.
- Zweizeilig (`hv-btn-zweizeilig`, Plan 30): Verb oben, Unterzeile in `<small>` («Speichern» · «Pegel auf der Marke»); im Regal 72 dp hoch. Zwei solche Buttons nebeneinander ersetzen den einen Speicherknopf.
- Gedrückt (U-01): jede Taste reagiert beim Tippen sofort (dunkler, 1 px eingedrückt, ohne Übergang); in Regal-Masken dazu beim Auslösen (click) eine kurze Vibration von 10 ms (`src/ui/haptik.ts`), wo das Gerät es kann; gesperrte Tasten vibrieren nicht. Gilt ebenso für Kacheln, Auswahl, Löcher, Stepper und Haken.
- In Listenzeilen (Aufgaben in Heute): die Aktion der Zeile steht zuerst und ist `secondary`, Nebenwege wie «Öffnen», «Morgen» oder «Überspringen» folgen als `ghost`. `primary` bleibt der einen Hauptaktion des Screens vorbehalten.

## Weiterführung nach dem Speichern

Nach dem Speichern einer Erfassung (Messen, Keimung, Umsetzen, Säen) führt die Bestätigung weiter, ohne Umweg über Heute.

- `div.hv-weiter`: links die Hauptaktion `primary` «Nächste Aufgabe: <Titel> <Ort>» («Nächste Aufgabe:» als kleine Zeile oben in `<small>`, darunter Titel und Ort, die
  umbrechen dürfen),
  rechts daneben `secondary` «Zu Heute». Gibt es keine weitere Aufgabe mit eigener Maske, steht nur «Zu Heute» als
  `primary` über die ganze Breite. Es bleibt bei einer `primary` je Maske.
- Die nächste Aufgabe ist die folgende in der Reihenfolge von Heute (Laufweg), nicht die dringendste.
- Beide Tasten sind nach dem Erscheinen 400 ms gesperrt (`aria-disabled="true"`, ohne Wirkung), weil sie dort
  erscheinen, wo eben «Speichern» getippt wurde.
- Nachbau in `src/ui/NachSpeichern.tsx`.
- In der Aufgabenliste von Heute sind nach einer Aktion («Erledigt», «Morgen», «Überspringen», «Pegel ok», Deckel) alle
  Tasten und Links der Liste 400 ms gesperrt (Links mit `aria-disabled="true"`, Aussehen wie gesperrte Tasten), damit ein
  Doppeltipper nicht die nachgerückte Zeile trifft (U13).
