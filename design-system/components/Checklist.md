# Checklist

Abhakliste mit Zeilennummer, Soll-Menge und Messmittel, für den Neuansatz (R4.6, Zeilen 0 bis 17), das Nachfüllen und die Einrichtung (UC0, UC7).

- Feste Reihenfolge: Nur die nächste offene Zeile ist abhakbar (`hv-check-aktiv`); spätere Zeilen zeigen den Haken gestrichelt und gesperrt. Jede Zeile ist ein Tipp auf den Haken (`hv-check-haken`, `size-touch-regal` 68 dp).
- Ein Haken übernimmt die Soll- als Ist-Menge. Er ist abwählbar, solange der nächste Schritt nicht begonnen ist; danach nur über «Menge ändern» (öffnet den `NumPad`).
- Zeile: Nummer (`hv-check-nr`), Titel (`hv-check-titel`, Stil `text-regal`), darunter Menge und Messmittel («7.0 ml · 20-ml-Spritze», `hv-check-menge`). Erledigte Zeilen sind durchgestrichen und tragen den gefüllten Haken (`hv-check-erledigt`), nie nur eine Farbe.
- **Timer-Zeile:** Countdown in `value-regal` (`hv-check-timer`, «14:32», ab einer Stunde «11:59:30»), gerechnet gegen die absolute Endzeit; er überlebt Neustart und Gerätewechsel. Nach Ablauf wird die Zeile abhakbar.
- Haken werden nach jedem Tipp lokal gespeichert (Konzept 11.4). Nach mehr als 2 Minuten Pause fragt die Maske mit Zeitstempel nach («Zuletzt bestätigt: Micro 7.0 ml um 18:42»); das ist Sache der Maske, nicht des Bausteins.
- Props: `zeilen` (`{ nr, titel, menge?, timerEnde?, zustand: 'offen' | 'aktiv' | 'erledigt' }`), `onHaken(nr)`, `jetzt` (für den Countdown), `variante` (`'haken'` Standard oder `'selbst'`), `label` (Name der Liste), je Zeile `aktion?` (nur Variante «selbst»).
- Der Haken hat einen zugänglichen Namen («Zeile 5 abhaken», «Zeile 5 abwählen»); die Liste ist ein `ol`.
- **Variante «selbst»** (`variante="selbst"`, Einrichtungs-Checkliste UC0): Die Zeilen haken sich durch die Erfassung selbst ab, Tim tippt keinen Haken. Statt des Haken-Knopfs zeigt jede Zeile ein rundes Status-Symbol (`hv-check-status`, 68 dp): erledigt gefüllt mit Haken, als Nächstes leer mit durchgezogenem Rand, offen leer und gestrichelt; der zugängliche Name ist «erledigt», «als Nächstes» oder «offen». Die aktive Zeile trägt unter dem Titel ihren Knopf (`aktion`, `hv-check-aktion`, Verb vorne, z. B. «Kalibrieren»). Die Liste trägt einen Namen (`label`).
