# Kamera

Sucher in der App für Tütenfotos am Schreibtisch (Plan kamera): Tim nimmt Vorder- und Rückseite einer Tüte nacheinander auf, ohne die App zu verlassen und ohne zwischen den Fotos einen Dialog zu bestätigen. Im Ablauf «Fotos nachtragen» bleibt die Kamera über alle Sorten offen.

- Props: `titel` (z. B. «3 von 22: Genoveser»), `untertitel` (z. B. Gemüse), `schritt` («Vorderseite» oder «Rückseite»), `hinweis`, `vorschau` (Objekt-URL des letzten Fotos) mit `vorschauText` (z. B. «Vorderseite aufgenommen»), `status` (z. B. «Fotos werden gespeichert»; sperrt Auslöser und Aktionen), `aktionen` (Text und Handler, z. B. «Ohne Rückseite weiter», «Sorte überspringen»), `onFoto(datei)`, `onSchliessen()`.
- Die Maske führt die Reihe: Sie wertet jedes `onFoto` aus und setzt `schritt` neu. Der Baustein bleibt dabei eingehängt, damit die Kamera nicht für jedes Foto neu startet.
- Aufbau (`hv-kamera`, fest über die ganze Fläche, `surface-brand` mit `ink-on-brand`): Kopf mit Titel (17 px, 700) und Untertitel (`ink-on-brand-muted`), rechts «Beenden» (`hv-btn-secondary`, kompakt). Darunter der Sucher (`hv-kamera-sucher`, Rest der Höhe, Radius `radius-lg`, Video mit `object-fit: cover`) mit gestricheltem Rahmen als Zielhilfe (`hv-kamera-rahmen`, 8 % Einzug). Darunter der Schritt als Wort (22 px, 700, `aria-live`) und der Hinweis oder der Status (`role="status"`). Darunter die Aktionen (kompakt, zentriert). Fuss in drei Spalten: Vorschau 56 × 56 px mit Text, Auslöser, frei.
- Auslöser (`hv-kamera-ausloeser`): runde Fläche `size-touch-regal` (68 px) in `ink-on-brand` mit Ring, darunter sichtbar «Foto aufnehmen» (zugleich Name des Knopfs). Gesperrt, bis das Video läuft, während der Aufnahme und solange `status` gesetzt ist; gesperrt in `ink-on-brand-muted`.
- Technik: `getUserMedia` mit `facingMode: environment`, ideal 1920 × 1080; das Foto ist ein Standbild des Videos in voller Auflösung als JPEG (Qualität 0.92). Die Maske verkleinert es danach wie jedes Tütenfoto auf `BILD_KANTE_MAX` (1568 px) ohne EXIF. Beim Schliessen stoppt der Baustein alle Spuren der Kamera.
- Scheitert ein Standbild, steht unter dem Schritt «Foto nicht aufgenommen. Versuch es noch einmal.» (`role="alert"`); der Auslöser bleibt frei.
- Schliesst die Maske die Kamera, bevor sie läuft (Freigabe offen), stoppt der Baustein die Spuren, sobald sie ankommen.
- Ohne Freigabe oder ohne Kamera erscheint im Sucher eine Meldung (`role="alert"`) mit dem Weg über `PhotoField` («tipp auf «Beenden» und nimm die Fotos einzeln auf» bzw. «… wähle die Fotos aus der Galerie»).
- Nur in Schreibtisch-Masken (Saatgut, Detail der Sorte); nicht in Regal-Masken.
- Status nie nur über Farbe: Schritt, «Vorderseite aufgenommen» und «Fotos werden gespeichert» stehen als Text.
