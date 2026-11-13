# 0023 Sortenwahl beim Säen nach Gemüse (Variante B)

Datum: 13.11.2026 · Entscheid von Tim im Chat («Variante B») nach dem klickbaren Mockup
<https://claude.ai/artifact/W4PZHniEHBDcRYqriLXQ1q> und dem Vorschlag `docs/plaene/vorschlag-sortenwahl.md` · Klasse Routine,
keine Migration

## Ausgangslage

Schritt 1 der Maske «Säen» zeigte nur Sortennamen wie «Balconi Red» mit «Dunkelkeimer» oder «Lichtkeimer» darunter. Tim konnte
die Sorten nicht zuordnen. Er will zuerst das Gemüse wählen (Salat, Tomate, Basilikum), dann die Sorte, und beim Antippen
Tütenfoto und Kurzinfo sehen. Fachbegriffe dürfen bleiben, aber nie als einzige Angabe. Auf die Frage, warum er bei Butterfly
die Kulturform wählen soll, kam der Wunsch, die Vorgabe mit ihrer Wirkung zu zeigen statt einer gleichwertigen Wahl.

## Entscheid

1. **Kacheln je Gemüse:** Schritt 1 beginnt mit einer Kachel je Gemüse (`art.name_de`), zwei nebeneinander, mit Zahl der
   Sorten oder «n gewählt» mit Haken. Hat ein Gemüse nur eine Sorte, öffnet die Kachel direkt die Sorte.
2. **Sorten des Gemüses:** Zurück-Knopf «Alle Gemüse», Name des Gemüses, die gemeinsamen Angaben («Für alle 5 Sorten:
   Dunkelkeimer · 23–25 °C · keimt in 6–10 Tagen») und je Sorte eine Zeile mit Tütenbild oder Platzhalter.
3. **Detail der Sorte:** Tütenfoto oder Platzhalter, Gemüse und Kulturtyp, Sortenname, botanischer Name, Block «Kulturform»,
   Faktenliste (Keimung mit Erklärung, Keimtemperatur, Keimdauer, Saatmenge zur Kulturform, Umsetzen, Packung, Bezug, Wissen),
   unten «Sorte wählen». Nach der Wahl zurück zu den Kacheln.
4. **Kulturform als Vorgabe:** Der Block zeigt die Vorgabe der Art mit «Vorgabe» oder «geändert», was die Form heisst, und die
   Erntewerte aus `art_kulturform`. Nur bei mehreren erlaubten Formen gibt es «Kulturform ändern», das die Einzelauswahl mit
   einer Erntezeile je Form öffnet.
5. **Mehrfachwahl bleibt:** Die Leiste «Gewählt» über den Kacheln zeigt alle gewählten Sorten, ein Tipp entfernt eine;
   «Weiter mit n Sorten» führt zu Schritt 2. «Wie letztes Mal», Passung und «Satz duplizieren» bleiben.
6. **Tütenfotos als Folgepaket (A):** Tim hat dazu nichts gesagt; der Lead folgt dem Vorschlag. Das Paket zeigt den
   Platzhalter «Noch kein Tütenfoto». Anzeige, Tabelle `tuetenfoto` und «Tütenfoto ergänzen» folgen als eigenes Paket.

## Verworfen

- **A, Gruppen zum Aufklappen:** eine offene Tomate schiebt die übrigen Gemüse aus dem Bild.
- **C, eine Liste mit Überschriften:** rund 2’000 dp Liste, das Gemüse ist nicht anwählbar, eine Sprungleiste bräuchte Wischen.

## Folgen

- Neue Bausteine in `design-system/`: Tile-Variante «Gemüse», `Sortenzeile`, `Tuetenfoto` (Anzeige), `Faktenliste`,
  `Kulturform`.
- Die E2E-Tests zu Schritt 1 wählen Sorten heute direkt per Name und werden über den Testentwickler angepasst.
- Konzept 6.1 (UC5) und `use_cases_f4.md` UC5 bei der nächsten Fassung nachführen (Anhang B.2); bis dahin gilt dieser Entscheid.
