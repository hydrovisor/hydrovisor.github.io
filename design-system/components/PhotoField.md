# PhotoField

Fotofeld für Schreibtisch-Masken (Plan 37, Maske «Neue Sorte»): Tim wählt ein Foto aus der Kamera oder der Galerie. Die Maske verkleinert es danach im Browser.

- Props: `label` (sichtbar, z. B. «Vorderseite»), `vorschau` (Objekt-URL oder leer), `onWahl(datei)`, `hint`, `error`.
- Aufbau: Beschriftung (`hv-field-label`), darunter ein Knopf in Standarddichte (`hv-btn hv-btn-secondary`, Höhe `size-touch`) mit dem Text «Foto wählen», nach der Wahl «Foto ersetzen». Daneben eine Vorschau 64 × 64 px (`hv-photo-preview`, `object-fit: cover`, Radius `radius-md`) mit Alternativtext «Foto <label>».
- Technisch ein `input type="file" accept="image/*"` ohne `capture`, damit Android Kamera und Galerie anbietet. Das Feld ist sichtbar versteckt (`hv-photo-input`) und über das `label` erreichbar.
- Nicht in Regal-Masken verwenden (Konzept 6.3: dort keine Systemdialoge).
- Status nie nur über Farbe: Nach der Wahl steht «Foto gewählt» als Text.
