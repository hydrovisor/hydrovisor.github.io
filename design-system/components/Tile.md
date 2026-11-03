# Tile

Kachel für einen Messwert in der Messmaske oder für einen Ort in der Anlagenübersicht und in Heute (UC1, UC9).

- **Messwert** (`hv-tile`): Bezeichnung («pH», «EC mS/cm», «°C», Stil `label`), Statussymbol `icon-status-regal` (32 dp) rechts neben der Bezeichnung (`hv-tile-kopf`), darunter der Wert in `value-regal` (40 sp), die Trendzeile («vorher 6.4 ↗», Stil `small`, `ink-muted`) und das Sollband als Spur (`hv-tile-spur`: Band = Sollbereich in `gauge-target`, Strich = vorheriger Wert, Punkt = neuer Wert). So passen drei Kacheln nebeneinander auf 360 dp. Die aktive Kachel trägt `hv-tile-aktiv`.
- Während der Eingabe zeigt die Kachel nur Symbol und Wert. Das Statuswort steht in voller Breite in der Ergebniszone (`hv-ergebnis` mit `-ok`, `-warn`, `-danger`, Stil `status-regal`), damit die Kachel nicht umbricht. Status nie nur über Farbe: Symbol (Kreis, Dreieck, Quadrat) und Wort wie bei `StatusBadge`.
- Ein leeres Feld zeigt «–» in `ink-muted` (`hv-tile-value-leer`) und wird nicht gespeichert.
- **Ort** (`hv-tile`, als `button`): mindestens `size-tile-min-width` × `size-tile-min-height` (72 × 80 dp), Kennung in `status-regal` (28 sp, `hv-tile-kennung`), darunter Belegung und Füllzustand («leer · bereit», «Lösung 12/14 Tage», `hv-tile-zeile`) und ein `StatusBadge` für Status oder Prüfstatus. Die Kennung ist gleich geschrieben wie im Kopf der Maske «Gefäss» und auf dem Etikett.
- Props: `art` = `messwert` oder `ort`; Messwert: `bezeichnung`, `wert` (Text oder leer), `ton` (`ok`, `warn`, `danger` oder leer), `trend`, `spur` (`{ von, bis, vorher?, neu? }` in Prozent der Spurbreite), `aktiv`; Ort: `kennung`, `zeilen` (ein bis zwei), `badge`.
- Bei Systemschrift 130 % wachsen nur die Schriften; Kachelhöhe bleibt, Texte kürzen mit Ellipse.
