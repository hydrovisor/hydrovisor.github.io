# Vorschlag: Sortenwahl in Schritt 1 der Maske «Säen»

Stand 13.11.2026, Entwurf des Leads zum Entscheid durch Tim. Noch kein Code, kein Paket, kein Issue.
Klickbares Mockup im Honor-Format (360 dp, Regal-Dichte, Bausteine und Tokens aus `design-system/`):
<https://claude.ai/artifact/W4PZHniEHBDcRYqriLXQ1q> (privat, nur Tim).

## Anlass

Tims Rückmeldung am Honor (Einrichtung 8 von 9, offen «Erste Aussaat»): Schritt 1 zeigt nur Sortennamen wie
«Balconi Red» und darunter «Dunkelkeimer» oder «Lichtkeimer». So kann er die Sorte nicht zuordnen. Gewünscht:

1. zuerst das Gemüse (Salat, Tomate, Basilikum, Petersilie), gut anwählbar;
2. dann die Sorten dieses Gemüses mit Details;
3. ein Tipp auf die Sorte zeigt das Tütenfoto und eine Kurzinfo mit allen vorhandenen Angaben;
4. «Sorte wählen», dann weiter im Ablauf.

Fachbegriffe dürfen bleiben, aber nie als einzige Angabe.

## Heutige Umsetzung

`src/ui/masken/Saeen.tsx` (Plan 23, Passung Plan 36): Schritt 1 ist eine einzige `Choice`-Liste aller Sorten, alphabetisch,
«Wie letztes Mal» zuerst, Mehrfachwahl. Die Zusatzzeile enthält Passung, «Wie letztes Mal» und Keimart. Die Kulturform
erscheint unter einer gewählten Sorte. `sortenAuswahl()` in `src/domain/pflanzung/saeen.ts` liefert schon `artName`
(`art.name_de`), `keimdauer` und `keimtemp`; die Maske zeigt sie nicht.

## Varianten

Die Detailansicht der Sorte ist in allen drei Varianten gleich: Zurück-Knopf, Tütenfoto (Vorder- und Rückseite), Gemüse
und Kulturtyp, Sortenname, botanischer Name, der Block Kulturform (siehe unten), dann eine Faktenliste mit Keimung
(Fachbegriff plus Erklärung, zum Beispiel «Dunkelkeimer: keimt ohne Licht, kommt in die Box für Dunkelkeimer»),
Keimtemperatur, Keimdauer, Saatmenge zur gewählten Kulturform, Umsetzen, Packung, Bezug und Vollständigkeit des Wissens.
Unten «Sorte wählen», bei gewählter Sorte «Sorte abwählen» und «Zurück zur Auswahl». Eine Leiste «Gewählt» über der Liste
zeigt alle gewählten Sorten (Mehrfachwahl bleibt), ein Tipp entfernt eine; «Weiter mit 2 Sorten» führt zu Schritt 2.

| | A: Gruppen zum Aufklappen | B: Kacheln je Gemüse | C: Liste mit Überschriften |
|---|---|---|---|
| Einstieg | 11 Gemüse als Zeilen (68 dp), eine Gruppe offen | 11 Kacheln, zwei nebeneinander, ohne Scrollen | 22 Sorten unter 11 Überschriften, Überschrift bleibt stehen |
| Weg zur Sorte | Gemüse aufklappen, Sorte antippen | Kachel, dann Sorte; bei 6 Gemüsen mit nur einer Sorte öffnet die Kachel direkt die Sorte | Sorte antippen (nach Scrollen) |
| Stärken | eine Maske, nah am heutigen Code | Tims Reihenfolge, grösste Tippflächen, alles auf einen Blick | kein Zwischenschritt, einfachste Umsetzung |
| Schwächen | offene Tomate schiebt den Rest nach unten | ein Schritt zurück je weiteres Gemüse; ab etwa 14 Gemüsen scrollt das Raster | rund 2’000 dp Liste; Sprungleiste ginge nur mit Wischen, am Regal ausgeschlossen |

### Kulturform in der Detailansicht (Tims Rückmeldung vom 13.11.2026)

Tim fragte, warum er bei Butterfly zwischen Babyleaf, Kopf und Schnitt wählen soll und was das bewirkt. Die Kulturform legt
fest, wie geerntet wird (einmal oder mehrfach), und steuert damit Saatmenge (R12.3), Erntetermine und Kulturende (R1.2),
die Belegung der Töpfe für «Satz duplizieren» (R11.1), die Leitkultur und damit das Stadium der Nährlösung (R2.3) sowie die
Passung (Licht- und Höhenregel nehmen Babyleaf aus, R3). Sie ist mit der Vorgabe der Art schon gewählt, eine Wahl gibt es nur
bei Basilikum, Salat, Schnittlauch und Spinat (8 von 22 Sorten).

Darum zeigt die Detailansicht neu:

- einen Block «Kulturform» mit der gewählten Form, dem Wort «Vorgabe» oder «geändert» und einer Zeile, was die Form heisst
  («junge Blätter, die Pflanze wird einmal geerntet»), darunter die Erntewerte aus `art_kulturform` («einmal ernten, erste
  Ernte ab etwa Tag 14, fertig nach etwa 16 Tagen»);
- nur bei mehreren erlaubten Formen den Knopf «Kulturform ändern»; erst er öffnet die Einzelauswahl, jede Option mit ihrer
  Erntezeile. Ein Tipp wählt und schliesst die Auswahl.

Datenlücke dazu: In `art_kulturform` fehlen bei Schnitt (Salat, Spinat, Mangold, Randen), Babyleaf-Salat und den
Dauerkulturen Ernte ab und Kulturdauer; dort steht «Termine noch offen». Tomate, Nüsslisalat und Schnittlauch haben noch keine
Zeile (W0 Runde 10). Prüfpunkt für W0 (A): Spinat Babyleaf hat «Ernte ab 14» und «Kulturdauer typisch 16»; zählt «Ernte ab»
ab dem Umsetzen (Konzept R1.2), passt das mit «Umsetzen ab Tag 9» nicht zusammen. Die Oberfläche schreibt deshalb neutral «ab
etwa Tag 14».

Zusätzlicher Baustein: `Kulturform` (Block mit Vorgabe, Wirkung und «Kulturform ändern»), in `design-system/components/`.

## Empfehlung

**Variante B.** Sie bildet Tims Ablauf am direktesten ab: Das Gemüse ist das erste, grosse Tippziel, die Sorte folgt mit den
gemeinsamen Angaben des Gemüses oben («Für alle 5 Sorten: Dunkelkeimer · 23–25 °C · keimt in 6–10 Tagen»). Alle 11 Gemüse
passen auf 360 × 780 dp ohne Scrollen, die Kacheln sind etwa 160 × 80 dp gross. Gewählte Gemüse tragen Haken und «1 gewählt»
(Zustand nicht nur über Farbe). Nach «Sorte wählen» kehrt B zur Kachelseite zurück, damit das nächste Gemüse folgen kann.

Was gleich bleibt: Mehrfachwahl, «Wie letztes Mal» (als erste Kachel bzw. erste Sorte), «Satz duplizieren» unter dem Raster,
Passung («Empfohlen», «Möglich», «Nicht empfohlen») an jeder Sorte, wenn Säen vom Gefäss aus startet; die Kachel zählt dann
die empfohlenen Sorten (A). Neu wird die Kulturform in der Detailansicht gewählt, die Saatmenge folgt der Wahl.

## Datenlage auf `hydrovisor-dev` (13.11.2026, gelesen über MCP)

| Angabe | Stand |
|---|---|
| Gemüse (`art.name_de`) | alle 22 Sorten, 11 Gemüse: Basilikum 2, Chili 4, Mangold 1, Nüsslisalat 1, Pak Choi 1, Petersilie 1, Randen 1, Salat 4, Schnittlauch 1, Spinat 1, Tomate 5 |
| Keimart, Keimtemperatur | 21 von 22 (Nüsslisalat ohne Keimart); alle Werte auf Ebene Art, keine Tütenwerte je Sorte |
| Keimdauer, Saatempfehlung | 16 von 22; Tomate (5), Schnittlauch, Nüsslisalat offen, `v_vollstaendigkeit` 12, 7 und 8 fehlende Grössen. Folgt mit W0 Runde 10 (#202) |
| Kulturformen | alle 22 |
| Tütenfoto | **0 von 22**, Bucket `saattueten` leer |
| Packung | je Sorte eine, Kaufdatum 17.10.2026, `bestand_korn` und `keimfaehigkeit_packung` leer |
| Katalog (`wuchshoehe_max_mm`, `wuchsform`, `fruehzeitigkeit_relativ_d`) | leer bei allen; die Sorten eines Gemüses unterscheiden sich heute nur im Namen |
| Shop-Link | 21 von 22 (saemereien.ch), Schnittlauch Twiggy ohne |

Folge: Ohne Tütenfotos zeigt die Detailansicht einen leeren Fotoplatz mit Hinweis. Die Unterscheidung zwischen Sorten
(zum Beispiel Kirsch-, Balkon- oder Ampeltomate) trägt vorerst nur das Foto.

## Tütenfotos: was fehlt

- **Anzeige:** Gespeicherte Fotos werden heute nirgends angezeigt (Plan 37, «nicht im Paket»: signierte Links, 60 s).
- **Zuordnung:** Der Pfad steht nur in `ki_feldprotokoll.fotopfad` (erstes Foto, nur bei KI-Lauf); das Feldprotokoll ist nicht
  im Bündel. Beim Weg «Packung zu … erfassen» liegen die Fotos unter einer fremden `sorte_id` (Plan 37 A16), ein Suchen nach
  Präfix im Bucket findet sie also nicht.
- **Aufnahme für die 22 Startsorten:** am Schreibtisch über «Sorten» → «Neue Sorte erfassen» → «Packung zu … erfassen»
  (bestehend) oder neu «Tütenfoto ergänzen» im Detail einer Sorte. In der Regal-Maske keine Kamera (Konzept 6.3).
- **Offline:** Fotos kommen über signierte Links und brauchen Verbindung; offline bleibt der Platzhalter mit
  «Foto nur mit Verbindung» (A). Zwischenspeichern im Service Worker wäre ein eigenes Thema.

## Migration

Für die Varianten selbst keine: Gemüse, Keim-, Saat-, Packungs- und Vollständigkeitswerte liegen schon im Bündel.
Für die Tütenfotos zwei Wege:

1. **Ohne Migration:** Foto über `ki_feldprotokoll.fotopfad` (nur erstes Foto, nur nach KI-Lauf), Feldprotokoll ins Bündel.
   Deckt die Rückseite und Erfassungen ohne KI nicht ab.
2. **Mit additiver Migration (empfohlen, A):** neue Tabelle `tuetenfoto` (`id`, `client_id`, `sorte_id`, `saatgut_id`,
   `pfad`, `seite` vorne/hinten, `erfasst_am`, `app_version`, `storniert_am`) mit RLS über `ist_tim()`, ins Bündel; Schreibweg
   über `schreiben()`. Ein Foto ersetzen = Storno plus neue Zeile. Label `db-lock`, Freigabe der Dev-Migration durch den Lead,
   Produktions-Migration durch Tim.

## Betroffene Dateien (Variante B)

| Datei | Änderung |
|---|---|
| `design-system/components/Tile.md`, `bundle.css` | Variante «Gemüse» (`hv-tile-gemuese`) |
| `design-system/components/Sortenzeile.md` (neu) | Zeile mit Tütenbild, Titel, Zusatz, Pfeil, Zustand «gewählt» mit Haken und Wort |
| `design-system/components/Tuetenfoto.md` (neu) | Anzeige des Fotos, Platzhalter, Wechsel Vorder- und Rückseite (Aufnahme bleibt `PhotoField`) |
| `design-system/components/Faktenliste.md` (neu) | Begriff und Wert mit Erklärzeile, Zustand «noch offen» |
| `src/ui/bausteine/` | `Sortenzeile.tsx`, `Tuetenfoto.tsx`, `Faktenliste.tsx`, `Tile.tsx` (Variante) |
| `design-system/components/Kulturform.md` (neu) | Block mit Vorgabe, Wirkung, Erntezeile und «Kulturform ändern» |
| `src/domain/pflanzung/saeen.ts` | `gemueseGruppen()` (nach `artName`, Zählung gewählt und empfohlen), `sorteDetail()` (Saatmenge und Erntewerte je Kulturform aus `art_kulturform`, Umsetzen, Packung, Vollständigkeit, Bezug) |
| `src/ui/masken/Saeen.tsx`, `src/ui/app.css` | Schritt 1 in drei Ansichten (Kacheln, Sorten des Gemüses, Detail), Leiste «Gewählt», Kulturform im Detail; Sortenleiste in Schritt 2 mit Gemüse vor dem Namen |
| `src/daten/` | signierter Link für das Foto (nur mit Weg 2 bzw. 1) |
| `supabase/migrations/` | nur mit Weg 2: `tuetenfoto` |
| `src/ui/masken/Sorten*.tsx` | «Tütenfoto ergänzen» im Detail (Schreibtisch) |
| `tests/unit/`, `tests/e2e/saeen*.spec.ts` | neue Tests für Gruppierung und Detail; die bestehenden E2E-Tests zu Schritt 1 (`saeen.spec.ts`, `saeen-passung.spec.ts`, `saeen-duplizieren.spec.ts`) wählen heute Sorten direkt per Name und müssen über den Testentwickler angepasst werden |

## Aufwand (Schätzung des Leads)

| Teil | PT |
|---|---|
| Design System: vier Bausteine und Tile-Variante | 0.35 |
| Domäne: Gruppierung und Detailwerte mit Unit-Tests | 0.3 |
| Maske Säen Schritt 1 (B) und Schritt 2 Sortenleiste | 0.5 |
| E2E-Tests anpassen | 0.3 |
| Tütenfoto: Tabelle, Anzeige, «Tütenfoto ergänzen» | 0.5 |
| **Summe** | **2.0** (ohne Tütenfoto 1.5) |

Variante A kostet etwa 0.1 PT weniger, C etwa 0.3 PT weniger. Vorschlag: Tütenfoto als eigenes, kleines Folgepaket, damit
die neue Sortenwahl schon mit Platzhalter am Regal ist, bevor die 22 Tüten fotografiert sind.

## Offene Punkte für Tim

1. Variante A, B oder C (Empfehlung B), gern mit Änderungen.
2. Tütenfoto im selben Paket oder als Folgepaket (Empfehlung Folgepaket, Weg 2 mit Tabelle `tuetenfoto`).
3. Die 22 Tüten fotografieren (Vorder- und Rückseite), sobald «Tütenfoto ergänzen» da ist; dieselben Fotos dienen dem Eval
   UC4-AK3.
