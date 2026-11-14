# Meldezeile

Meldet, was eben gespeichert wurde, und bietet «Rückgängig machen» an (Konzept 6.3, U4). Für Aktionen, die eine Zeile
aus der Liste nehmen oder deren Ergebnis sonst ausserhalb des Bildschirms läge: «Erledigt», «Morgen», «Überspringen»,
«Pegel ok», «Deckel geöffnet» und die Phasenkarten in Heute.

- **Aufbau** (`div.hv-meldezeile`, `role="status"`, `aria-live="polite"`): fest am unteren Rand über die ganze Breite,
  Fläche `surface-raised`, oben eine Linie `line`, Schatten `shadow-sm`; der Inhalt ist bei breiten Bildschirmen auf
  `size-content` zentriert. Links der Text (`hv-meldezeile-text`, Schrift `text-small` fett 600, höchstens drei Zeilen), rechts die Aktion
  (`hv-meldezeile-aktion`): ein Button `secondary`, 68 dp hoch (`data-density="regal"` an der Zeile), höchstens 136 dp
  breit und zweizeilig («Rückgängig» über «machen»), damit auf 360 dp der Text mit Aufgabe und Ort lesbar bleibt.
- **Lage**: immer über der Hauptaktion. Die Zeile steht über der Leiste (`--hv-leiste-hoehe`) und über einem festen Fuss
  der Seite (`--hv-fuss-hoehe`, etwa «Rundgang starten»); ohne beides am unteren Rand mit dem Sicherheitsabstand
  `env(safe-area-inset-bottom)`. Solange sie steht, gibt der Rahmen (`[data-meldung="sichtbar"]`) der Seite unten ihre
  Höhe (`--hv-meldung-hoehe`) als Abstand dazu, damit nichts verdeckt bleibt; hat die Seite einen festen Fuss, liegt
  dieser Abstand über dem Fuss, sodass der Fuss auch am Seitenende unter der Meldezeile frei bleibt.
- **Text**: sagt, was gespeichert wurde, mit Aufgabe und Ort: «Erledigt: Würfel feucht R-A1», «Auf morgen verschoben:
  Messen R-3.1», «Gespeichert: Salat · 4.4 · gesät 7.1.». Nach dem Zurücknehmen «Rückgängig gemacht» ohne Aktion. Ein
  Fehler beim Zurücknehmen steht als Text in der Zeile, die Aktion bleibt. Der Zustand steht im Text, nie nur in einer
  Farbe.
- **Aktion** «Rückgängig machen»: storniert, was die Meldung nennt. Nach dem Erscheinen 400 ms gesperrt, damit ein
  Doppeltipper sie nicht trifft.
- **Dauer**: kein Zeitablauf. Die Meldung bleibt beim Scrollen und beim Nachladen der Daten stehen und endet mit der
  nächsten Meldung oder beim Wechsel der Maske. Es gibt immer nur eine Meldung, kein Wischen zum Schliessen.
- Im Druck ausgeblendet.
- Nachbau in `src/ui/bausteine/Meldezeile.tsx`: `Meldezeile` mit `text`, optional `aktion` (`text`, `onClick`,
  `gesperrt`); den Zustand hält `MeldungAnbieter` in `src/ui/meldung.tsx` (`useMeldung().melden({ text, rueckgaengig })`).
