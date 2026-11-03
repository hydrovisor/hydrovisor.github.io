# NumPad

Eigener Ziffernblock der Regal-Masken für Messwerte, Mengen und Kannen, ohne Systemtastatur (Konzept 6.3, UC9).

- Raster 4 × 4 (Entscheid R3): links `7 8 9`, `4 5 6`, `1 2 3`, `. 0 weiter`; rechte Spalte von oben «leeren», «−0.1», «+0.1», Rücktaste. «leeren» liegt oben rechts, weg von «Speichern», und lässt sich rückgängig machen.
- Tasten `size-touch-regal` (68 dp) hoch, Abstand `space-2` (8 dp) zwischen den Tasten und `space-4` (16 dp) über «Speichern» (Prop `speichern`, im Wrapper `hv-numpad-save`, Button `primary` `block`).
- Prellfilter: Ein zweiter Tipp auf **dieselbe** Taste innert 80 ms gilt als Prellen und wird verworfen; danach zählt jeder Tipp. Keine Sperre für dieselbe Taste und keine Sperre für ±; «1, 1, 2 innert 0.6 s» ergibt 112, «+0.1 zweimal innert 0.5 s» ergibt +0.2. Die Sperre von 400 ms gilt nur für Aktionsknöpfe (Speichern, Ja, Erledigt, Morgen).
- Jede getippte Ziffer wird über dem Raster gross wiederholt (`hv-numpad-echo`, Stil `value-regal`), damit ein Fehltipp sofort auffällt.
- Props: `onTaste(taste)` mit `taste` = `'0'` bis `'9'`, `'.'`, `'weiter'`, `'leeren'`, `'minus'`, `'plus'`, `'zurueck'`; `echo` (Text der Wiederholung); `schritt` (Standard 0.1, Beschriftung der ±-Tasten); `ohnePlusMinus` (Variante B des Regaltests, ± ausgeblendet). Den Wert führt die Maske, nicht der Ziffernblock; den Dezimalpunkt setzt die Maske je Feld automatisch.
- Klassen: `hv-numpad`, `hv-numpad-echo`, `hv-numpad-grid`, `hv-numpad-key`, `hv-numpad-key-aktion` (rechte Spalte und «weiter»), `hv-numpad-save`. Jede Taste hat einen zugänglichen Namen («Ziffer 7», «leeren», «minus 0.1», «plus 0.1», «Rücktaste», «weiter»).
- Keine Wischgesten, kein Halten für Wiederholen.
