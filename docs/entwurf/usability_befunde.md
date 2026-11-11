# Usability-Befunde Runde 1 (Expertenprüfung U2)

Stand 11.11.2026 · Lead · B11 bis B14 aus der automatischen Prüfung U1 (Honor-Simulation mit axe-core, #156) · Methode: heuristische Evaluation (Nielsen, 10 Heuristiken; ISO 9241-110) an den Bildschirmfotos der Honor-Simulation (360 × 780 dp, Pixeldichte 3.5, Fixtures der E2E, Stand `d83e072`), ergänzt um Code-Durchsicht. Schweregrad nach Nielsen: 0 kein Problem, 1 kosmetisch, 2 klein, 3 gross (vor dem Testbetrieb beheben), 4 Katastrophe (sofort). Rahmen: `docs/entwurf/usability_pruefung.md`.

| Nr. | Maske | Befund | Heuristik | Schwere | Vorschlag | Weg |
|---|---|---|---|---|---|---|
| B1 | Rundgang (alle Schritte) | Titel «Rundgang · 0 von 2» und «Rundgang beenden» überlappen; die Taste ragt über den rechten Rand. Ursache: `src/ui/messen.css` setzt `.hv-messen-kopf .hv-messen-titel { flex: none }` für alle Masken | Ästhetik, Fehlervermeidung | 4 | Kopf darf umbrechen, Titel schrumpft; Taste rutscht bei Platzmangel in die zweite Zeile | #153 |
| B2 | alle Masken | Tasten (`.hv-btn`) haben keinen gedrückten Zustand; nur der Ziffernblock reagiert (`:active`). Am Touchscreen gibt es kein Hover, also keine Rückmeldung zwischen Tipp und Wirkung. Keine Haptik | Sichtbarkeit des Systemzustands | 3 | Gedrückter Zustand im Design System für alle Tasten, Kacheln und Haken (dunkler, 1 dp eingedrückt, sofort ohne Übergang); kurze Vibration (10 ms) bei Tasten in Regal-Masken | #153 |
| B3 | Messmaske, Ergebniszone | Hinweisbanner sind auf feste Höhe abgeschnitten, der Satz bricht mitten in der Zeile ab («… pH-Minus zuerst 2.4 ml» halb sichtbar); darunter bleiben auf 780 dp rund 170 dp leer | Sichtbarkeit, Erkennen statt Erinnern | 3 | «Speichern» in beiden Zuständen am unteren Rand, die Ergebniszone nutzt den Platz dazwischen; auf 640 dp unverändert (dort bleibt das Abschneiden, Folgevorschlag: ganzer Text per Tipp) | #153 (Platzbudget 6.3 bleibt) |
| B4 | Heute, Kopf | Vier Links («Anlage öffnen», «Säen», «Info öffnen», «Einstellungen öffnen») belegen untereinander rund 290 dp, bevor «Heute» beginnt; die Arbeit des Tages liegt unter dem ersten Bildschirm | Effizienz, minimalistisches Design | 3 | Kopfnavigation als Raster mit zwei Spalten (zwei Zeilen à 68 dp, Regal-Regel), sichtbar als Tasten | #153 |
| B5 | Heute, Rundgang | «Rundgang starten» erst nach Scrollen (3745 dp) | Effizienz | 3 | fest im Daumenbereich | erledigt in #151 |
| B6 | Heute, Einrichtung | Erledigte Punkte bleiben als volle Karten mit durchgestrichenem Text stehen (6 erledigte = rund 540 dp) | minimalistisches Design | 2 | Erledigte Punkte zu einer Zeile «1 bis 6 erledigt» zusammenfassen, aufklappbar | Vorschlag an Tim (ändert UC0-AK1-Darstellung) |
| B7 | Abhakliste (Stadium), Keimung (Ja/Nein) | Einzelauswahl sieht aus wie Mehrfachauswahl (eckige Häkchen); Breiten nach Textlänge, ungleich | Konsistenz, Standards | 2 | Einzelauswahl als Segmente gleicher Breite mit rundem Punkt | Vorschlag an Tim (Design-System-Baustein) |
| B8 | Rundgang, Kurzprüfung | «Licht an ✓», «Lüfter läuft ✓», «1.1 Pumpe sprudelt ✓ ok»: kleines ✓ und grosse Schrift; unklar, ob das ein Zustand ist oder eine Taste, die eine Abweichung meldet | Übereinstimmung mit der realen Welt | 2 | Beschriftung als Frage mit Zustand («Licht an? ja», Tipp meldet «nein»), Symbol 32 dp | Vorschlag an Tim |
| B9 | Gefäss | Nebentasten («Lösung wechseln», «Ändern», «Leeren») ungleich breit, Zeilen ausgefranst | Ästhetik | 1 | gleich breite Raster-Tasten | #153 |
| B10 | Heute, Einrichtung (aktiver Punkt) | Die Taste «Leitungswasser messen» ragt aus der Textspalte und überlappt den Statuskreis (`white-space: nowrap`) | Ästhetik, Fehlervermeidung | 3 | Taste bleibt in der Spalte und bricht um | #153 |

| B11 | Säen (Schritt 2, Duplizieren) | «Ziel später» braucht 104 dp, die Taste hat 102 dp (Text stösst an den Rand) | Ästhetik | 1 | Taste breiter oder Text umbrechen | U-03 |
| B12 | Messmaske bei Systemschrift 130 % | Ziffernblock «leeren» (89 statt 74 dp) und «weiter» (88 statt 74 dp) sowie Kacheltexte («EC mS/cm 1.25 vorher 1.20», 116 statt 102 dp) passen nicht; betrifft #94 am Honor | Sichtbarkeit, Erkennen | 3 | Funktionstasten mit Symbol oder kürzerem Text, Kachelzeilen umbrechen oder kürzen | U-03 |
| B13 | Umsetzen, Bestätigung | «Umsetzen bestätigen» braucht 187 dp, die Taste hat 158 dp, schon bei normaler Schrift | Ästhetik, Fehlervermeidung | 3 | Taste über die ganze Breite oder Text umbrechen | U-03 |
| B14 | Zeitwahl (Drehrad) | WCAG «scrollable-region-focusable»: das Rad ist per Tastatur nicht erreichbar | Zugänglichkeit | 1 | `tabindex="0"` am Rad; am Handy ohne Wirkung | U-03 |

## Nicht geprüft (bleibt am Honor, U3)

Blendung unter den LED-Leisten, nasse Finger, Halterung und Winkel, echte Bediendauer, Lesbarkeit aus 80 cm.
