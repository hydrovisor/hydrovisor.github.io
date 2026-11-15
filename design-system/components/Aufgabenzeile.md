# Aufgabenzeile

Eine fällige Aufgabe mit ihren Tasten. Derselbe Baustein steht in Heute (in den Ortskarten und in der Liste «Aufgaben»)
und in der Maske Gefäss unter «Offene Aufgaben»; keine Aufgabe steht ohne Taste.

- **Aufbau** (`li.hv-aufgabe.hv-aufgabe-umbruch` in `ul.hv-aufgaben`): Fläche `surface-raised`, Rand `line`, Radius
  `radius-lg`. Links der Text (`hv-aufgabe-text`): Titel der Aufgabe, darunter klein der Grund («heute fällig», «seit
  2 Tagen überfällig») mit allfälligem Hinweis. Rechts bzw. darunter die Tastenreihe (`hv-aufgabe-knoepfe`); sie
  bricht unter den Text um, nichts ragt über 360 dp hinaus. Der Ort steht nicht in der Zeile, sondern im Kopf der
  Ortskarte bzw. der Maske.
- **Tasten**: Die erste Taste ist die Aktion der Aufgabe und als einzige betont (`secondary`); alle weiteren sind
  `ghost`. `primary` bleibt der einen Hauptaktion des Screens vorbehalten. In Regal-Masken 68 dp hoch. Reihenfolge:
  Aktion, Zweitaktion, «Morgen», «Überspringen», «Pegel ok», zuletzt «Öffnen».
  - Aufgaben mit Erfassungsmaske: ein Link mit dem Verb der Maske («Messen», «Prüfen», «Ansetzen», «Nachfüllen»,
    «Umsetzen»).
  - Aufgaben, die ein Tipp erledigt: «Erledigt», «Deckel geöffnet», «Abdeckung entfernt»; Kurzprüfung «Alles ok» mit
    der Zweitaktion «Etwas stimmt nicht» (führt in die Kurzprüfung des Orts); Wurzeln «Wurzeln ok» mit «Auffällig».
  - «Öffnen» (Maske Gefäss) nur in Heute und nur bei Zeilen, deren Aktion schreibt; in der Maske Gefäss nie.
- **Kurzprüfung**: Statt des Grunds stehen unter dem Titel die Fragen, die «Alles ok» bestätigt: «Pumpe sprudelt? ·
  Licht an? · Lüfter läuft?». Licht und Lüfter erscheinen nur, solange sie an der Ebene heute noch offen sind.
- **Sammelzeile «Keimung prüfen · n Sätze»** (Plan 227): Ab zwei fälligen Keimprüfungen in derselben Anzuchtbox steht
  in Heute eine Zeile statt einer je Satz, an der Stelle der ersten. Unter dem Titel stehen die Sorten mit Anzahl und
  die älteste Fälligkeit («Lollo Rossa × 2, Eichblatt × 1 · heute fällig»). Tasten: «Prüfen» (`secondary`, Link in
  die Maske Keimung je Box) und «Morgen» (`ghost`, nur wenn jeder Satz es erlaubt; verschiebt alle Sätze der Zeile).
  Kein «Öffnen». Nachbau `KeimBoxZeile`, die Gruppierung liefert `heuteZeilen()` in
  `src/domain/pflanzung/keimbox.ts`.
- **Nach dem Tipp**: Die Zeile verschwindet, die Meldezeile nennt, was gespeichert wurde, mit «Rückgängig machen»
  (Meldezeile.md). Während des Sendens und 400 ms danach sind alle Tasten und Links der Liste gesperrt (Links mit
  `aria-disabled="true"`, Aussehen wie gesperrte Tasten), damit ein Doppeltipper nicht die nachgerückte Zeile trifft.
- **Gewicht**: `data-gewicht` an der Zeile; «Ausserhalb» steht als Wort mit Symbol (`StatusBadge`) im Kopf der
  Ortskarte, nie nur als Farbe.
- Nachbau in `src/ui/Aufgabenzeilen.tsx`: `Aufgabenzeile` mit `a`, `wo` (`heute` oder `gefaess`) und `aktionen` aus
  `useAufgabenAktionen()`; die Tasten je Aufgabentyp liefert die reine Tabelle `aufgabenTasten()` in
  `src/domain/aufgaben-tasten.ts`.
