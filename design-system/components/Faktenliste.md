# Faktenliste

Kurzinfo als Liste aus Begriff und Wert (Detail einer Sorte in Säen; Entscheid 0023).

- `dl.hv-fakten` mit Zeilen `hv-fakten-zeile` (Raster: Begriff 7 rem, Wert Rest; Linie `line` unten), Begriff `dt` im Stil `small` fett in `ink-muted`, Wert `dd` im Stil `body`.
- Eine Erklärzeile unter dem Wert (`dd small`, Stil `small`, `ink-muted`) erklärt Fachbegriffe, zum Beispiel «Dunkelkeimer» mit «keimt ohne Licht, kommt in die Box für Dunkelkeimer». Ein Fachbegriff steht nie allein.
- Fehlt ein Wert, steht «noch offen» (`hv-fakten-offen`, kursiv, `ink-muted`), nie ein leeres Feld oder «–».
- Zahlen nach de-CH, Bereiche mit Halbgeviertstrich (20–25 °C).
- Props: `zeilen` (`{ begriff, wert?, erklaerung? }`); ohne `wert` erscheint «noch offen».
