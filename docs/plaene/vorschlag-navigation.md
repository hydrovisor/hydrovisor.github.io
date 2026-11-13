# Vorschlag: Navigation unten und Saatgut-Manager

Stand 13.11.2026 · Lead · Auftrag von Tim im Chat (Bildschirmfoto Heute am Honor) · klickbares Mockup: <https://claude.ai/artifact/E8p4gav7Ed3CAmDF5sN8i5>

## Tims Idee

Heute zeigt oben vier grosse Knöpfe (Anlage öffnen, Säen, Info öffnen, Einstellungen öffnen) und darunter viel Text. Mit weiteren Anlagen wird das umständlich. Tim wünscht eine feste Leiste unten wie in üblichen Apps: Anlagen (Indoor und Outdoor, was angepflanzt ist), Einstellungen, Säen und einen eigenen Saatgut-Manager. Dort erfasst er jede neue Tüte mit Fotos, danach startet die Recherche von selbst. Bestand in Korn braucht es nicht, aber Sorten ohne Samen soll er entfernen können; «Säen» bietet nur Sorten aus dem Saatgut-Manager an.

## Einschätzung

Die Idee passt und löst ein echtes Problem. Heute ist zugleich Startseite und Menü. Eine Leiste mit fünf festen Zielen verträgt sich mit Konzept 6.3: nur Tippen, keine Wischgesten, Tippflächen 68 dp, und jeder Ablauf beginnt weiter ab Heute. Den Saatgut-Manager gibt es zum grossen Teil schon: Die Maske «Sorten» liest die Tüte mit der KI und startet die Recherche (Plan 37), seit #207 speichert sie Tütenfotos. Sie ist nur versteckt (`#/sorten`) und für die Erfassung am Handy zu umständlich.

## Leiste unten

| Ziel | Inhalt | bisher |
|---|---|---|
| Heute | Aufgaben, Einrichtung, Warnungen; Startseite | wie bisher, ohne die vier Knöpfe |
| Anlagen | Wahl Indoor oder Outdoor; je Anlage Ebenen mit Belegung, Anzuchtboxen, Messstelle W | «Anlage öffnen» |
| Säen | Kacheln je Gemüse (Entscheid 0023), nur Saatgut mit Vorrat | Knopf «Säen» |
| Saatgut | Saatgut-Manager | versteckt unter `#/sorten` |
| Mehr | Einstellungen, Etiketten, Vorlagen, Push, Notfallblatt, Info | einzelne Knöpfe |

- «Mehr» ergänzt Tims Liste: Einstellungen allein wäre ein Ziel für selten gebrauchte Masken.
- «Messen» bekommt kein Ziel: Gemessen wird immer an einem Gefäss, also über Heute, Anlagen oder das Etikett.
- Die Leiste steht auf den fünf Hauptseiten, Höhe 68 dp, Symbol und Wort, aktives Ziel mit Balken und fetter Schrift (nicht nur Farbe). In Abläufen (Messen, Ansatz, Säen ab Schritt 2, Tüte erfassen) verschwindet sie, damit die Messmaske weiter ohne Scrollen auf 360 × 640 passt (Konzept 17); «Zurück» oben führt heraus.
- Hash-Routen (A): `#/anlagen`, `#/saatgut` (bisher `#/sorten`, alte Adresse leitet weiter), `#/mehr`; Heute bleibt `#/`.

## Saatgut-Manager

- **Tüte erfassen** mit der Kamera in drei Schritten: Vorderseite, Rückseite, «Tüte lesen». Die KI erkennt eine vorhandene Sorte («Packung zu Lollo Rossa Loka hinzufügen») oder legt eine neue an. Nach dem Speichern startet die Recherche wie heute. Die Fotos landen in `tuetenfoto` (#207).
- **Fotos nachtragen:** Ein Ablauf führt durch alle Sorten ohne Foto («3 von 22: Genoveser»), mit «Überspringen». Für die 22 Startsorten muss Tim nichts suchen.
- **Liste** nach Gemüse gruppiert, mit Tütenbild, Status als Wort (vollständig, Recherche offen, ohne Foto) und Filter «Vorrätig», «Ohne Foto», «Aufgebraucht».
- **Kein Saatgut mehr** im Detail: Die Sorte verschwindet aus «Säen», bleibt aber mit Verlauf und Keimrate erhalten und lässt sich mit «Wieder vorrätig» zurückholen. Endgültiges Löschen gibt es nicht (Konzept 8.1 Regel 3, die App löscht nie). Technisch ein Ereignis je Packung (A: neue Tabelle oder Ereignistyp «aufgebraucht», additiv), «vorrätig» ist eine Sicht.
- Kein Bestand in Korn (Tims Wunsch); die Felder bleiben im Datenmodell, die Maske fragt sie nicht mehr ab.

## Anlagen

Das Datenmodell kennt den Standort schon (`anlage.standort`, Konzept 8.2). Heute gibt es nur das Regal R; die Dachterrasse folgt als Anlage T ab Sommer 2027 (Konzept R7.1, Outdoor-Anbau ist in Etappe A ausserhalb des Umfangs, Kapitel 3). Bis dahin zeigt «Outdoor» einen leeren Zustand mit «Anlage anlegen». Je Anlage zeigt die Übersicht die Ebenen mit belegten und freien Töpfen und die Anzuchtboxen mit Inhalt; ein Tipp öffnet Gefäss oder Box.

## Pakete

| Paket | Klasse | Inhalt | Schätzung |
|---|---|---|---|
| N1 Leiste unten | Routine | Baustein `Tabbar` im Design System, Routen, Heute ohne Kopfknöpfe, E2E für alle Wege | 1 PT |
| N2 Saatgut-Manager | Fachlogik | «Sorten» wird «Saatgut»: Kamera-zuerst-Erfassung, Fotos nachtragen, Filter, Liste mit Tütenbild | 1.5 PT |
| N3 Kein Saatgut mehr | Fachlogik mit Migration | Ereignis «aufgebraucht» je Packung, Sicht «vorrätig», Filter in Säen; additiv (Entscheid 0024) | 1 PT |
| N4 Anlagen-Übersicht | Routine | Indoor und Outdoor, Belegung je Ebene und Box aus vorhandenen Sichten | 1 PT |

Reihenfolge N1, N2, N3, N4, zusammen rund 4.5 PT. Die Leiste ändert die Navigation gegenüber Konzept 6.3 und 10: Entscheid nach Tims Wahl, Nachführung in der nächsten Konzeptfassung (Anhang B.2). Abnahme 2 am Honor prüft, dass die Leiste mit nassen Händen sicher trifft.

## Offene Entscheide für Tim

1. Fünf Ziele Heute, Anlagen, Säen, Saatgut, Mehr, oder fehlt ein Ziel?
2. «Kein Saatgut mehr» blendet die Sorte aus und lässt sie zurückholen. Einverstanden?
3. Mit N1 und N2 beginnen?
