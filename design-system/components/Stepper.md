# Stepper

Ganzzahl oder Datum in Schritten ändern ohne Systemtastatur (Säen: Samen je Schwamm, Schwämme, Pflanzen, «Früher gesät»; Konzept 6.1, UC5).

- Aufbau: Beschriftung oben über die ganze Breite, darunter Knopf «−», Wert (mittig) und Knopf «+»; so passt die Zeile auch in eine Karte auf 360 dp. Die Knöpfe sind `size-touch` (48 dp), in Regal-Masken `size-touch-regal` (68 dp) gross; der Wert steht in `value-regal` bzw. `value`.
- Grenzen `min` und `max`: an der Grenze ist der Knopf deaktiviert (nicht ausgeblendet), damit die Zeile nicht springt.
- Zugängliche Namen «Schwämme weniger» und «Schwämme mehr»; der Wert ist mit `aria-live="polite"` angesagt. `anzeige` formatiert den Wert (z. B. Datum «Heute, 7.1.»).
- Kein Halten für Wiederholen, keine Wischgesten; jeder Tipp ein Schritt.
- Props: `label`, `wert`, `min`, `max`, `onWert(neu)`, `anzeige?(wert)`, `hinweis?` (Zusatzzeile, z. B. «Vorschlag 5»).
- Klassen: `hv-stepper`, `hv-stepper-label`, `hv-stepper-knopf`, `hv-stepper-wert`, `hv-stepper-hinweis`.
