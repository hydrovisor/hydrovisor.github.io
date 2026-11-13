# Tuetenfoto

Zeigt das Foto der Saattüte im Detail einer Sorte (Säen; Entscheid 0023). Die Aufnahme bleibt `PhotoField` am Schreibtisch.

- Fläche in voller Breite, Seitenverhältnis 3 : 2, Radius `radius-lg`, Grund `surface-sunken`; das Foto füllt sie mit `object-fit: contain` (`hv-tuetenfoto`).
- Ohne Foto (`hv-tuetenfoto-leer`): gestrichelter Rand `line-control`, Kamerasymbol 40 px, «Noch kein Tütenfoto» (Stil `body`, `ink`) und «Das Foto ergänzt du am Schreibtisch unter Sorten.» (Stil `small`, `ink-muted`); `role="img"` mit «Noch kein Tütenfoto» als Name.
- Sind beide Seiten vorhanden, wechselt eine Einzelauswahl `Choice` (`einzeln`, `zeile`) zwischen «Vorderseite» und «Rückseite».
- Das Anzeigen gespeicherter Fotos folgt mit dem Paket Tütenfotos; bis dahin zeigt der Baustein nur den Platzhalter.
