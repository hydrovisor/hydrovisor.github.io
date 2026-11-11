# Choice

Wahlliste für eine oder mehrere Optionen ohne Systemtastatur (Säen: Sorten, Kulturform, Zielgefäss, Box; Konzept 6.1, UC5).

- Jede Option ist ein Knopf (`hv-choice-item`) mit `aria-pressed`; gewählt zeigt ein Häkchen-Symbol und die Fläche `brand-soft` mit Rand `brand`. Zustand nie nur über Farbe: das Häkchen und `aria-pressed` tragen ihn.
- Höhe mindestens `size-touch` (48 dp), in Regal-Masken `size-touch-regal` (68 dp); Abstand `space-2` zwischen den Optionen.
- Einfach- oder Mehrfachwahl entscheidet die Maske in `onWahl` (Mehrfach: Tipp schaltet um; einfach: Tipp ersetzt die Wahl). `zeile` legt die Optionen nebeneinander und bricht um (Kulturformen, Sortenleiste).
- Jede Option hat einen Titel und optional eine Zusatzzeile in `ink-muted` («Wie letztes Mal», «Lichtkeimer»). Der zugängliche Name enthält Titel und Zusatzzeile.
- Optional trägt eine Option eine Stufe (`stufe`: `empfohlen`, `moeglich`, `nicht_empfohlen`) als Baustein `Stufe` (siehe `Stufe.md`) direkt nach dem Titel («Empfohlen», «Möglich», «Nicht empfohlen»; Passung, Plan 36). Das Wort steht im zugänglichen Namen; der Zustand hängt nie an der Farbe allein.
- **Einzelauswahl** (`einzeln`, U-04, B7, Tims Entscheid C vom 11.11.2026): Gilt genau eine Option, zeigt jede Option einen runden Rahmen wie ein Radioknopf, die gewählte einen vollen Punkt in `brand` (kein Häkchen). Mehrfachauswahl behält das eckige Häkchen, so sind beide Arten auf einen Blick unterscheidbar. Mit `zeile` und höchstens drei Optionen stehen sie als gleich breite Segmente in einer Zeile (`hv-choice-segmente`), solange jede Option ganz Platz hat; sonst bricht die Zeile um, nie ein Wort. Mit mehr Optionen brechen sie um wie bisher.
- Props: `optionen` (`{ wert, titel, zusatz?, deaktiviert?, stufe? }`), `gewaehlt` (Liste der Werte), `onWahl(wert)`, `zeile`, `einzeln`, `label` (Name der Gruppe).
- Klassen: `hv-choice` (Gruppe, `role="group"`), `hv-choice-zeile`, `hv-choice-einzeln`, `hv-choice-segmente`, `hv-choice-item`, `hv-choice-check`, `hv-choice-text`, `hv-choice-titel`, `hv-choice-zusatz`.
