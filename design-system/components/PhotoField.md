# PhotoField

Fotofeld für Schreibtisch-Masken (Plan 37, Maske «Neue Sorte»; Plan kamera): Tim nimmt ein Foto mit der Kamera auf oder wählt es aus der Galerie oder aus Dateien und Cloud-Ablagen. Die Maske verkleinert es danach im Browser.

- Props: `label` (sichtbar, z. B. «Vorderseite»), `vorschau` (Objekt-URL oder leer), `onWahl(datei)`, `hint`, `error`, `knopf` (Text des Kamera-Knopfs statt «Foto aufnehmen» und «Foto ersetzen», z. B. «Tütenfoto ergänzen» im Detail einer Sorte, Paket #207), `deaktiviert` (während des Hochladens: alle drei Dateifelder gesperrt, Knöpfe mit `aria-disabled` im Stil von `hv-btn:disabled`).
- Aufbau: Beschriftung (`hv-field-label`), darunter der Kamera-Knopf in Standarddichte (`hv-btn hv-btn-secondary`, Höhe `size-touch`) mit dem Text «Foto aufnehmen», nach der Wahl «Foto ersetzen». Daneben eine Vorschau 64 × 64 px (`hv-photo-preview`, `object-fit: cover`, Radius `radius-md`) mit Alternativtext «Foto <label>». Darunter zwei kompakte Knöpfe (`hv-photo-quellen`, `hv-btn-ghost hv-btn-compact`): «Aus Galerie wählen» und «Aus Dateien wählen».
- Technisch drei `input type="file"`, sichtbar versteckt (`hv-photo-input`) und über ihr `label` erreichbar:
  - Kamera: `accept="image/*" capture="environment"`, öffnet die Rückkamera direkt; `aria-label` «<label> mit der Kamera».
  - Galerie: `accept="image/*"` ohne `capture`; Chrome ab Android 14 zeigt dafür den Fotoauswähler (Galerie, Google Fotos); `aria-label` «<label>».
  - Dateien: ohne `accept`; Android zeigt die Dateiauswahl mit Drive und anderen Cloud-Ablagen. Was kein Bild ist, meldet die Maske als «nicht lesbar»; `aria-label` «<label> aus Dateien».
- Vorder- und Rückseite in einem Zug nimmt der Baustein `Kamera` auf; PhotoField bleibt der Weg für eine einzelne Seite und für Fotos, die schon auf dem Handy liegen.
- Nicht in Regal-Masken verwenden (Konzept 6.3: dort keine Systemdialoge).
- Status nie nur über Farbe: Nach der Wahl steht «Foto gewählt» als Text.
