# 0026 Erntekalender als Ziel der Leiste, Säen in Saatgut

Datum: 14.11.2026 · Entscheid von Tim im Chat nach dem klickbaren Mockup
<https://claude.ai/artifact/QhiaQY3iYjcmMdmWxPSy2P> (Variante A «Zeitachse» und Variante B «Liste nach nächstem
Ereignis») · Paket UC15, Issue #232 · Konzept v1.8, Erratum E16

## Ausgangslage

Tim wollte in einer Übersicht sehen, in welcher Phase jeder Satz steht, wann der nächste Phasenwechsel voraussichtlich
kommt und ab wann bzw. bis wann geerntet werden kann. Der Lead zeigte zwei Varianten mit denselben Demo-Sätzen und
empfahl Variante B. Die Leiste unten führte seit Entscheid 0025 zu Heute, Anlagen, Säen, Saatgut und Mehr.

## Tims Wortlaut (Chat, 14.11.2026)

«Variante A gefällt mir besser, setze Variante A um. Ich möchte zusätzlich, dass du unten in der untersten Leiste
entsprechend Erntekalender, Ernteübersicht oder einen sonstig geeigneten Begriff wählst, diesen beim Icon Säen mit
einem passenden Icon ersetzt. Den Punkt Säen kannst du bei Saatgut integrieren. Das heißt, wenn ich Saatgut anwähle,
sollte dann zuoberst ein Button mit Säen sein, dass ich das Säen dann über diese entsprechende Funktion ausführen kann.
Setze dies entsprechend so um, wie ich es gesagt habe, deploye, entwickle und produziere eine fixfertige Lösung.»

Der Lead liest den Satz als Abnahme des Mockups (Variante A mit den genannten Änderungen) und als Auftrag für die
Konzeptänderung v1.8; die Halte nach Schritt 1 und 2 des ursprünglichen Auftrags entfallen damit (A).

## Entscheid

1. **Erntekalender** nach Variante A als neue Hauptseite `#/ernte` (Regal-Maske, nur lesen): Phasenbalken je Satz über
   acht Wochen ab Montag der laufenden Woche, Linie «heute», Wochenmarken, Ernte-Marken; Antippen zeigt ein Feld mit
   allen Terminen und «Pflanze öffnen»; aus der Pflanze führt «Zurück» in den Kalender mit derselben Auswahl. Neuer Use
   Case UC15 (Soll).
2. **Leiste unten:** Heute, Anlagen, **Ernte**, Saatgut, Mehr. Das Ziel «Ernte» ersetzt «Säen» an derselben Stelle,
   Symbol Weizenähre (Lucide `wheat`), Seitentitel «Erntekalender» (A: «Ernte» passt als einziges der genannten Wörter
   ungekürzt in eine Spalte von 72 dp).
3. **Säen in Saatgut:** Die Seite «Saatgut» zeigt «Säen» als oberste Taste (Hauptaktion, volle Breite) vor der Liste.
   Säen Schritt 1 behält die Leiste, mit «Saatgut» als aktivem Ziel. Die Route `#/saeen` und alle übrigen Wege zu Säen
   (Einrichtung «Erste Aussaat», Gefäss, Anzuchtbox, Scan) bleiben.
4. **Nur lesen:** keine neuen Ereignisse, keine Migration; die Termine kommen aus den bestehenden Fachfunktionen
   (`phasenStand`, `phaseAm`, `ernteStand`, `voraussichtlichesEnde`). Neuer Baustein `Phasenbalken` mit Tokens `phase-*`
   im Design System.

## Abweichung vom Konzept und von Entscheid 0025

- Ersetzt in Entscheid 0025 Punkt 1 das Ziel «Säen» durch «Ernte» und in Punkt 2 die Hauptseite `#/saeen` durch
  `#/ernte`; Säen Schritt 1 bleibt eine Seite mit Leiste.
- Konzept v1.7 6.1, 6.3, 10 und 19 nachgeführt in v1.8 (Erratum E16, Anhang B.2).

## Folgen

- In W0 fehlen für alle Arten Ernteintervall, Anzahl Schnitte max. und Kulturdauer max. Mehrfachernten zeigen deshalb
  «Termine noch offen» für den nächsten Schnitt und das Ende, bis W0 diese Werte liefert (Posten in `pakete.md` I3).
- Abnahme 2 am Honor prüft, dass «Ernte» in der Leiste mit nassen Händen trifft (UC15-AK9, «offen-abnahme-2»).
- UX6 (#228, Säen) und UX2 (#224, App-Rahmen) ändern dieselben Dateien; wer später merged, mischt `origin/main` ein.
