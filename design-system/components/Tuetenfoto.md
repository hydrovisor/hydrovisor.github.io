# Tuetenfoto

Zeigt das Foto der Saattüte im Detail einer Sorte (Säen und Saatgut; Entscheid 0023, Paket Tütenfotos #207, Saatgut-Manager #211). Die Aufnahme bleibt `PhotoField` am Schreibtisch.

- Props: `bild` (Vorderseite, URL), `rueckseite` (URL), `hinweis` (`'offline'` oder `'laedt'`), `leerText` (zweite Zeile des Platzhalters), `alt`, `onFehler(seite)`.
- Fläche in voller Breite, Seitenverhältnis 3 : 2, Radius `radius-lg`, Grund `surface-sunken`; das Foto füllt sie mit `object-fit: contain` (`hv-tuetenfoto`). Alternativtext «Tütenfoto Vorderseite» bzw. «Tütenfoto Rückseite».
- Ohne Foto (`hv-tuetenfoto-leer`): gestrichelter Rand `line-control`, Kamerasymbol 40 px, «Noch kein Tütenfoto» (Stil `body`, `ink`) und darunter `leerText`, Vorgabe «Das Foto ergänzt du am Schreibtisch unter Saatgut.» (Stil `small`, `ink-muted`); `role="img"` mit «Noch kein Tütenfoto» als Name.
- Foto vorhanden, aber nicht ladbar (`hinweis="offline"`, ohne Verbindung oder Link abgelaufen): derselbe Platzhalter mit «Foto nur mit Verbindung» und «Das Foto lädt, sobald du wieder online bist.»; `role="img"` mit «Foto nur mit Verbindung».
- Link wird geholt (`hinweis="laedt"`): Fläche wie der Platzhalter mit dem Text «Foto wird geladen» (Stil `small`, `ink-muted`), `role="img"` mit «Tütenfoto wird geladen» und `aria-busy`. Die Maske holt den Link mit Frist (8 s); danach gilt «offline».
- Lädt ein Bild nicht (`onFehler(seite)`, z. B. Link abgelaufen), signiert die Maske einmal neu und zeigt danach «Foto nur mit Verbindung».
- Nur eine Seite vorhanden: diese Seite ohne Wahl. Sind beide Seiten vorhanden, wechselt darunter eine Einzelauswahl `Choice` (`einzeln`, `zeile`, Gruppe «Seite der Tüte») zwischen «Vorderseite» und «Rückseite»; Start mit der Vorderseite.
- Fotos kommen über signierte Links mit 60 s Gültigkeit aus dem privaten Bucket `saattueten`; den Link holt die Maske, der Baustein zeigt nur URLs.
