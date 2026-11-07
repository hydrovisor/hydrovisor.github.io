# Zeitwahl

Uhrzeit wählen statt eintippen: zwei senkrechte Drehregler für Stunde und Minute (Licht ab und bis in «Anlage anlegen», Push-Zeit in den Einstellungen; Plan 142).

- Aufbau: Beschriftung oben sichtbar wie bei TextField (`hv-field-label`), darunter ein Rahmen mit zwei Rädern und «:» dazwischen. Jedes Rad zeigt drei Zeilen zu `size-touch` (48 dp); die mittlere Zeile ist gewählt und mit Linien oben und unten, Fläche `surface-sunken` und fetter Schrift markiert, nie nur über Farbe. Hilfetext und Fehler darunter wie bei TextField (`hv-field-msg`); ein Fehler färbt den Rahmen `status-danger`.
- Bedienung: Drehen (senkrecht wischen oder scrollen) rastet mit `scroll-snap` auf eine Zeile ein; nach dem Einrasten ist der Wert in der Mitte gewählt. Antippen eines Werts wählt ihn und dreht ihn in die Mitte. Tastatur: Pfeil auf/ab einen Schritt, Pos1/Ende erster/letzter Wert; an den Grenzen bleibt der Wert stehen (kein Umlauf).
- Werte: Stunden von `min` bis `max` (Standard 0 bis 23), Minuten im Schritt `minutenSchritt` (Standard 5). Ein gespeicherter Wert ausserhalb des Rasters (z. B. 07:03) wird einsortiert und bleibt gewählt, damit das Öffnen nichts ändert. Ein ungültiger Wert zeigt die erste Stunde und 00, ohne `onWert` aufzurufen. Grenzen innerhalb einer Stunde (z. B. Push-Zeit bis 22:00) prüft die Maske beim Speichern.
- Zugänglichkeit: Die Zeitwahl ist eine Gruppe mit der Beschriftung als Namen; jedes Rad ist eine `listbox` mit dem Namen «‹Beschriftung› Stunde» bzw. «‹Beschriftung› Minute» (z. B. «Licht ab Stunde»), die Werte sind `option` mit `aria-selected`; der Fokus liegt auf der Listbox (`aria-activedescendant`).
- Breite: Die Räder teilen sich die Breite (`minmax(0, 1fr)`); zwei Zeitwahlen passen nebeneinander in eine Zeile auf 360 dp (`.hv-anlage-zweispaltig`).
- Nur Schreibtisch-Masken (Standarddichte 48 dp). In Regal-Masken gibt es keine Wischgesten (Konzept 6.3); dort bleibt das NumPad.
- Props: `label`, `wert` («HH:MM»), `onWert(neu)` («HH:MM»), `min?`, `max?`, `minutenSchritt?`, `hint?`, `error?`.
- Klassen: `hv-zeitwahl`, `hv-zeitwahl-raeder`, `hv-zeitwahl-rad`, `hv-zeitwahl-wert`, `hv-zeitwahl-trenner`, `hv-zeitwahl-error`.
