# Zeitwahl

Uhrzeit wählen statt eintippen: zwei [Drehräder](Drehrad.md) für Stunde und Minute (Licht ab und bis in «Anlage anlegen», Push-Zeit in den Einstellungen; Pläne 142, 147).

- Aufbau: Beschriftung oben sichtbar wie bei TextField (`hv-field-label`), darunter ein Rahmen (`hv-drehrad-rahmen`, höchstens 160 dp breit) mit zwei Rädern und «:» dazwischen. Markierung der Mitte, Hilfetext und Fehler wie beim Drehrad.
- Bedienung wie beim Drehrad: Drehen rastet ein, Antippen wählt, Pfeil auf/ab, Pos1/Ende. Beide Räder **drehen durch** (nach 23 folgt 00, nach 55 folgt 00); die Stunde ändert sich dabei nicht mit.
- Werte: Stunden von `min` bis `max` (Standard 0 bis 23), Minuten im Schritt `minutenSchritt` (Standard 5). Mit `max={24}` ist **24:00** wählbar (Ende des Tages, z. B. «Licht bis»); Stunde 24 gibt es nur mit Minute 00, das Minutenrad dreht dort auf 00 zurück. Ein gespeicherter Wert ausserhalb des Rasters (z. B. 07:03) bleibt gewählt; ein ungültiger zeigt die erste Stunde und 00, ohne `onWert` aufzurufen. Grenzen innerhalb einer Stunde (z. B. Push-Zeit bis 22:00) prüft die Maske beim Speichern.
- Zugänglichkeit: Die Zeitwahl ist eine Gruppe mit der Beschriftung als Namen; jedes Rad ist eine `listbox` mit dem Namen «‹Beschriftung› Stunde» bzw. «‹Beschriftung› Minute» (z. B. «Licht ab Stunde»), die Werte sind `option` mit `aria-selected`.
- Nur Schreibtisch-Masken (Standarddichte 48 dp). In Regal-Masken gibt es keine Wischgesten (Konzept 6.3); dort bleibt das NumPad.
- Props: `label`, `wert` («HH:MM»), `onWert(neu)` («HH:MM»), `min?`, `max?`, `minutenSchritt?`, `hint?`, `error?`.
- Klassen: `hv-zeitwahl`, `hv-zeitwahl-raeder`, `hv-zeitwahl-trenner` und die Klassen des Drehrads.
