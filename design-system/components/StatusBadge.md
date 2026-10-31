# StatusBadge

Zeigt den Zustand eines Messwerts mit Symbol und festem Wort, nie mit Farbe allein.

- Props: `tone` = `ok` («Im grünen Bereich»), `warn` («Knapp daneben»), `danger` («Ausserhalb»), `info`, `neutral`, `stale` («veraltet»), `uncertain` («unsicher»); `children` ersetzt das Wort (nur bei `info` und `neutral`, z. B. «Erinnerung», «Keimphase»).
- Die drei Statuswörter und die zwei Kennzeichen nicht umformulieren, damit sie überall gleich lauten.
- **Kennzeichen** sagen nicht, wie gut ein Wert ist, sondern ob man ihm noch trauen kann. Sie stehen neben oder unter der Bewertung, nie an ihrer Stelle, und sind deshalb neutral gestaltet (Grund `surface-raised`, Text `ink-muted`, gestrichelter Rand `line-control`), nie in einer Statusfarbe.
  - `stale` «veraltet» (Symbol Uhr): Seit der letzten Messung wurde nachgefüllt oder die Lösung gewechselt. Die Messmaske zeigt «veraltet, neu messen»; der Düngerrechner nutzt den Wert nicht mehr.
  - `uncertain` «unsicher» (Symbol Fragezeichen): Die Messung wurde mit überfälliger Kalibrierung erfasst. Dazu gehört ein Hinweisbanner in der Messmaske.
