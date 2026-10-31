# Gauge

Messanzeige im Stil der Bildmarke: Skala mit grünem Sollbereich und dem Tropfen-Blatt-Zeiger auf dem Messwert.

- Props: `label` («pH», «EC», «Wassertemperatur»), `value` (Zahl oder leer für «Noch nicht gemessen»), `unit`, `min`, `max`, `target` (`[von, bis]` aus den Sollwerten der Anlage), `tolerance` (Breite von «Knapp daneben» beidseits, Standard ein Viertel des Sollbereichs), `decimals` (Standard 1).
- Status: im Sollbereich `ok`, innerhalb der Toleranz `warn`, sonst `danger`. Die Funktion `Hydrovisor.gaugeStatus(wert, von, bis, toleranz)` liefert dieselbe Regel für Listen und Warnhinweise.
- `min` und `max` so wählen, dass der Sollbereich mindestens ein Fünftel der Skala einnimmt (pH 4–8, EC 0–3 mS/cm, Wassertemperatur 10–30 °C).
- Breite 160 bis 280px. Höchstens drei Anzeigen nebeneinander.
- Für Screenreader ist die Anzeige ein Bild mit vollständiger Beschriftung (Wert, Sollbereich, Status).
