# Drehrad

Zahl mit einem senkrechten Rad wählen statt eintippen (Wheel-Picker; Anlage anlegen: Anzahl Ebenen, Lichtleisten, Lichtstunden, nutzbare Höhe; Plan 147). Zwei Räder für Stunde und Minute bilden die [Zeitwahl](Zeitwahl.md).

- Aufbau: Beschriftung oben sichtbar wie bei TextField (`hv-field-label`), darunter ein Rahmen mit dem Rad und rechts der Einheit (z. B. «cm», «h»). Das Rad zeigt drei Zeilen zu `size-touch` (48 dp); die mittlere ist gewählt und mit Linien oben und unten, Fläche `surface-sunken` und fetter Schrift markiert, nie nur über Farbe. Hilfetext und Fehler darunter wie bei TextField; ein Fehler färbt den Rahmen `status-danger`.
- Breite: höchstens 160 dp (3 × `size-touch` + `space-4`), damit neben dem Rad Platz bleibt, um die Seite mit dem Finger zu scrollen; zwei Räder passen nebeneinander auf 360 dp (`.hv-anlage-zweispaltig`).
- Bedienung: Drehen (senkrecht wischen oder scrollen) rastet mit `scroll-snap` auf eine Zeile ein; nach dem Einrasten ist der Wert in der Mitte gewählt. Antippen eines Werts wählt ihn. Tastatur: Pfeil auf/ab einen Schritt, Pos1/Ende erster/letzter Wert.
- **Durchdrehen** (zyklisch, auf Android «wrap selector wheel»): Nach dem letzten Wert folgt der erste und umgekehrt, beim Drehen wie mit den Pfeiltasten. Dazu stehen die Werte mehrfach untereinander (5 Kopien, ab 50 Werten 3); nach dem Einrasten springt das Rad unsichtbar in die mittlere Kopie zurück. Für Screenreader zählt nur die mittlere Kopie.
- Werte: `min` bis `max` im `schritt` (auch 0.5). Ein gespeicherter Wert ausserhalb des Rasters wird einsortiert und bleibt gewählt. Übernimmt die Maske eine Wahl nicht, dreht das Rad auf den gültigen Wert zurück.
- Zugänglichkeit: Das Rad ist eine `listbox` mit der Beschriftung als Namen (`aria-labelledby`), die Werte sind `option` mit `aria-selected`; der Fokus liegt auf der Listbox (`aria-activedescendant`).
- Nur Schreibtisch-Masken (Standarddichte 48 dp). In Regal-Masken gibt es keine Wischgesten (Konzept 6.3); dort bleiben NumPad und Stepper.
- Props: `label`, `wert`, `onWert(neu)`, `min`, `max`, `schritt?` (Standard 1), `einheit?`, `anzeige?(wert)`, `hint?`, `error?`. Der Kern `Rad` (ohne Beschriftung) ist auch exportiert.
- Klassen: `hv-drehrad`, `hv-drehrad-rahmen`, `hv-drehrad-einzeln`, `hv-drehrad-rad`, `hv-drehrad-wert`, `hv-drehrad-einheit`, `hv-drehrad-error`.
