# StatusBadge

Zeigt den Zustand eines Messwerts mit Symbol und festem Wort, nie mit Farbe allein.

- Props: `tone` = `ok` («Im grünen Bereich»), `warn` («Knapp daneben»), `danger` («Ausserhalb»), `info`, `neutral`, `stale` («veraltet»), `uncertain` («unsicher»); `children` ersetzt das Wort (nur bei `info` und `neutral`, z. B. «Erinnerung», «Keimphase»).
- Die drei Statuswörter und die zwei Kennzeichen nicht umformulieren, damit sie überall gleich lauten.
- **Kennzeichen** sagen nicht, wie gut ein Wert ist, sondern ob man ihm noch trauen kann. Sie stehen neben oder unter der Bewertung, nie an ihrer Stelle, und sind deshalb neutral gestaltet (Grund `surface-raised`, Text `ink-muted`, gestrichelter Rand `line-control`), nie in einer Statusfarbe.
  - `stale` «veraltet» (Symbol Uhr): Seit der letzten Messung wurde nachgefüllt oder die Lösung gewechselt. Die Messmaske zeigt «veraltet, neu messen»; der Düngerrechner nutzt den Wert nicht mehr.
  - `uncertain` «unsicher» (Symbol Fragezeichen): Die Messung fiel in eine überfällige oder fehlende Kalibrierung, oder ein Ereignis «als unsicher markiert (seit Kalibrierung X)» deckt sie (R10.3, R4.7). Dazu gehört ein Hinweisbanner in der Messmaske. Messungen mit «unsicher» liefern keinen k-Vorschlag.
- In Regal-Masken steht das Statuswort in voller Breite in der Ergebniszone (`Tile`, `hv-ergebnis`); der Badge bleibt für Listen, Karten und Ortskacheln.
