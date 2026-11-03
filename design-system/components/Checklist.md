# Checklist

Abhakliste mit Zeilennummer, Soll-Menge und Messmittel, für den Neuansatz (R4.6, Zeilen 0 bis 17), das Nachfüllen und die Einrichtung (UC0, UC7).

- Feste Reihenfolge: Nur die nächste offene Zeile ist abhakbar (`hv-check-aktiv`); spätere Zeilen zeigen den Haken gestrichelt und gesperrt. Jede Zeile ist ein Tipp auf den Haken (`hv-check-haken`, `size-touch-regal` 68 dp).
- Ein Haken übernimmt die Soll- als Ist-Menge. Er ist abwählbar, solange der nächste Schritt nicht begonnen ist; danach nur über «Menge ändern» (öffnet den `NumPad`).
- Zeile: Nummer (`hv-check-nr`), Titel (`hv-check-titel`, Stil `text-regal`), darunter Menge und Messmittel («7.0 ml · 20-ml-Spritze», `hv-check-menge`). Erledigte Zeilen sind durchgestrichen und tragen den gefüllten Haken (`hv-check-erledigt`), nie nur eine Farbe.
- **Timer-Zeile:** Countdown in `value-regal` (`hv-check-timer`, «14:32»), gerechnet gegen die absolute Endzeit; er überlebt Neustart und Gerätewechsel. Nach Ablauf wird die Zeile abhakbar.
- Haken werden nach jedem Tipp lokal gespeichert (Konzept 11.4). Nach mehr als 2 Minuten Pause fragt die Maske mit Zeitstempel nach («Zuletzt bestätigt: Micro 7.0 ml um 18:42»); das ist Sache der Maske, nicht des Bausteins.
- Props: `zeilen` (`{ nr, titel, menge?, timerEnde?, zustand: 'offen' | 'aktiv' | 'erledigt' }`), `onHaken(nr)`, `jetzt` (für den Countdown).
- Der Haken hat einen zugänglichen Namen («Zeile 5 abhaken», «Zeile 5 abwählen»); die Liste ist ein `ol`.
