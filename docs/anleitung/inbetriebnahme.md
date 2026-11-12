# Anleitung «Inbetriebnahme Anlage R»

Für die erste Einrichtung des Indoor-Regals in der installierten App am Honor, ab dem heutigen Produktionsstand: keine Anlage, keine Einstellungen, kein Wissen. Die App führt in Heute mit der Checkliste «Einrichtung · n von 9 erledigt» durch die Punkte 1 bis 9; jeder Punkt hakt sich selbst ab, sobald seine Daten gespeichert sind, und der aktive Punkt hat einen Knopf, der den passenden Ablauf öffnet. Nach Punkt 9 verschwindet die Checkliste.

Alle Schritte sind im E2E-Durchlauf `tests/e2e/inbetriebnahme.spec.ts` nachgespielt (Issue #166): IB-AK1 für den leeren Stand, IB-AK2 für die Punkte 1 bis 9 mit Gefäss 2.3, Anzuchtbox A1 und Messstelle W. Die Werte stammen aus Konzept 5.1 bis 5.8; der E2E-Durchlauf nutzt stellvertretend die Fixture `tests/fixtures/regal.ts`.

## Vorher

- **App installiert und angemeldet**, Push eingerichtet: Anleitung [«Gerät neu»](geraet-neu.md) Schritte 1 bis 8 und [«Push einrichten»](push-einrichten.md).
- **Material bereit:** Messstift Aquamaster P160 Pro2 mit Kalibrierlösungen pH 7.00, pH 4.01 und EC 1413 (Öffnungsdatum notieren), Giesskanne, Meter für die Innenmasse der Boxen, Etikettenbogen 70 × 42.3 mm (3 × 7 Felder), Klarsicht-Taschen, Schaumstoffwürfel für die Anzuchtboxen.
- **Zeit:** Punkt 2 (Einweichen) dauert 12 Stunden. Am besten am Vorabend einweichen und die übrigen Punkte am nächsten Tag erledigen.

## Schritt 0: Wissen laden (Seed scharf) · Tims Handgriff

Ohne Seed fehlen Einstellungen, Messgerät, Arten, Sorten und Packungen. Heute zeigt dann zwar die Checkliste «0 von 9», aber Einstellungen meldet «Keine Einstellungen gefunden … Die Einstellungen entstehen beim ersten Laden des Wissens (Seed).» (IB-AK1).

Der Seed lädt zwei Dinge, die unabhängig voneinander bereitstehen (Stand 12.11.2026):

| Teil | Quelle | Stand | wofür |
|---|---|---|---|
| Seed-Konstanten: Messgerät, Einstellungen (Kalibriertermine, Stationsgrenze), Dünger-Produkte und k-Startwerte, feste Regeln (Pflichtgrössen, Profilende, Auswertungsfenster) | im Repository | **in Produktion geladen** am 12.11.2026 (Lauf 43219285436) | Punkte 1 bis 8 |
| Wissen aus W0: Arten, Kulturformen, Sollwerte, Saatempfehlungen; Sortenstamm mit 22 Sorten und Packungen aus `data/stammdaten/sorten.csv` | `data/wissensbasis/freigegeben/` (W0, Freigabe durch Tim) | noch nicht geliefert; der Sortenstamm wartet auf `art.csv` | Punkt 9 (Aussaat) |

Scharf lädt der Seed nur ein Lauf von `deploy.yml` mit `seed_scharf=true` (Entscheid 0017, weicht von 0007 ab); jeder Push bleibt beim Trockenlauf. Die Freigabe in der Umgebung `production` gibt Tim, weil der Seed die Produktionsdatenbank verändert (Entscheid 0010).

Ein scharfer Seed nur mit den Konstanten genügt für die Punkte 1 bis 8; das zeigt IB-AK4. «Säen» meldet dann «Noch keine Sorten» mit dem Knopf «Sorte erfassen». Tim hat am 12.11.2026 entschieden, die Konstanten schon vor W0 scharf zu laden (Entscheid 0017): Der Lead startet `deploy.yml` mit `seed_scharf=true`, Tim gibt den Lauf in der Umgebung `production` frei. Der erste Lauf ist am 12.11.2026 gelaufen; die Einrichtung kann mit Punkt 1 beginnen. Nach der W0-Teilfreigabe lädt ein weiterer solcher Lauf das Wissen.

Danach in der App prüfen:

1. Einstellungen öffnen: Die Maske zeigt Push-Zeit, Kanne und Thema statt des Hinweises.
2. Säen öffnen: Mit W0 stehen die Sorten der ersten Runde (Konzept 5.5) zur Wahl, ohne W0 steht dort «Noch keine Sorten».

## Punkt 1: Anlage anlegen

Heute › Checkliste › «Anlage anlegen».

| Feld | Wert (Konzept 5.1, 5.2) |
|---|---|
| Name | Indoor-Regal |
| Kürzel | R |
| Standort | indoor |
| Licht ab, Licht bis | 06:00, 21:00 |
| Lüfter-Einstellung | Zeitplan der AC10 (Intake und Exhaust in der Lichtzeit, Umluft 15/15 am Tag, 5/25 in der Nacht) |
| Anzahl Ebenen | 4 (Drehrad) |
| Lichtleisten je Ebene | 4, 2, 2, 2 |
| Lichtstunden je Ebene | 15 |
| Nutzbare Höhe über dem Deckel | rund 45, 20, 15, 15 cm (Startwerte; in der Messwoche 1. bis 7.1. nachmessen und ändern) |

«Anlage speichern». Die App öffnet die Anlage R; die Checkliste zeigt «1 von 9».

## Punkt 2: Messstift 12 h einweichen

Messstift ohne Kappe in Leitungswasser stellen (Trockenelektrode, Konzept 5.6). In der Checkliste «Einweichen starten»: Der Timer zählt 12:00:00 herunter und läuft auch nach dem Schliessen der App weiter. Nach Ablauf hakt sich der Punkt ab, und «Kalibrieren» wird aktiv. Liegt der Stift schon länger im Wasser, tippe «Einweichen überspringen»: Der Punkt hakt sich sofort ab, auch während der Timer läuft.

## Punkt 3: Messgerät kalibrieren mit Gegenprobe

1. Am Messstift nach seiner Anleitung pH zweipunktig (7.00 und 4.01) und EC mit 1413 µS/cm kalibrieren.
2. Eine frische Portion 1413 messen (Gegenprobe).
3. In der Checkliste «Kalibrieren»: die angezeigte Gegenprobe über den Ziffernblock tippen, zum Beispiel 1 4 1 für 1.41, dann «Speichern».

Liegt die Gegenprobe ausserhalb 1.41 ± u_EC, bleibt «Speichern» gesperrt und die App verlangt «Sonde spülen und neu kalibrieren». Danach zeigt die Maske «Kalibriert · gültig bis TT.MM.».

## Punkt 4: Leitungswasser-EC messen (W)

1. In der Checkliste «Messstelle W erfassen»: Der Assistent «Gefäss erfassen» öffnet mit der Rolle «Messstelle W». «Weiter», dann «Speichern». Die App öffnet gleich die Messmaske R-W.
2. Giesskanne mit Leitungswasser füllen, EC messen, Kachel «EC» antippen, Wert tippen (zum Beispiel 0.42), «Speichern».

Ab jetzt rechnet die App mit dem gemessenen Wert statt mit der Annahme 0.5 mS/cm.

## Punkt 5: Vorlagen für Box, Deckel und Platte

In der Checkliste «Vorlagen erfassen». Je Vorlage «Box erfassen» bzw. «Deckel erfassen», Felder ausfüllen, «Speichern».

**Boxen** (Konzept 5.3; Innenmasse in mm selbst messen, das Betriebsvolumen darf nicht grösser sein als Länge × Breite × Höhe):

| Box | Form | Betriebsvolumen | für |
|---|---|---|---|
| Rako 40 × 30 × 27 | rechteckig | 20 l | 1.1, 1.2 |
| Rako 40 × 30 × 17 | rechteckig | 9 l | 2.1, 2.3 |
| Rako 30 × 20 × 17 | rechteckig | 4 l | 2.2 |
| Rako 40 × 30 × 12 | rechteckig | 7 l | 3.1, 3.3 |
| Rako 30 × 20 × 12 | rechteckig | 3 l | 3.2, 4.1 |
| Leni Flori 36 | oval | 2.3 l | 4.2 bis 4.5 |

**Deckel und Platten** (Konzept 5.4; «Löcher je Reihe» von vorne nach hinten, die Grafik zeigt die Nummerierung, Service-Öffnung «ja»):

| Name | Topf | Löcher je Reihe | für |
|---|---|---|---|
| D1 | 8 cm | 2, 2 | 1.1, 1.2 |
| D2 | 8 cm | 3, 3 | 2.1, 2.3 |
| D4 | 8 cm | 1, 1 | 2.2 |
| D3 | 5 cm | 4, 4 | 3.1, 3.3 |
| D6 | 5 cm | 2, 2, 2 | 3.2, 4.1 |
| S8 | 8 cm | 1, 1, 1, 1 | 4.2, 4.3 |
| S5 | 5 cm | 1, 2, 1, 2, 1, 2, 1, 2, 1 | 4.4, 4.5 |

Der Punkt hakt sich ab, sobald es mindestens eine Box und einen Deckel gibt; für Punkt 6 braucht es alle.

## Punkt 6: Gefässe, Anzuchtboxen und Messstelle W erfassen

In der Checkliste «Gefässe erfassen». Je Gefäss vier Schritte: Platz (Rolle «Gefäss», Bereich, Position, Betriebsart, Luftpumpe), Box, Deckel oder Platte, Zusammenfassung mit Kennung und Töpfen; dann «Speichern und nächstes erfassen»: Die App meldet zum Beispiel «R-2.3 gespeichert» und beginnt wieder bei Schritt 1; Rolle, Bereich und Luftpumpe bleiben, die Position schlägt sie neu vor. Steht kurz «Stand wird geladen», ist «Weiter» gesperrt, bis der eben gespeicherte Ort geladen ist. Beim letzten Gefäss «Speichern» (öffnet die Maske «Gefäss») oder «Speichern und Etikett drucken».

| Kennung | Bereich, Position | Betriebsart | Luftpumpe | Box | Deckel |
|---|---|---|---|---|---|
| 1.1, 1.2 | Ebene 1, 1 und 2 | DWC | P1 | Rako 40 × 30 × 27 | D1 |
| 2.1, 2.3 | Ebene 2, 1 und 3 | DWC | P2 | Rako 40 × 30 × 17 | D2 |
| 2.2 | Ebene 2, 2 | DWC | P2 | Rako 30 × 20 × 17 | D4 |
| 3.1, 3.3 | Ebene 3, 1 und 3 | Kratky belüftet | P3 | Rako 40 × 30 × 12 | D3 |
| 3.2 | Ebene 3, 2 | Kratky belüftet | P3 | Rako 30 × 20 × 12 | D6 |
| 4.1 | Ebene 4, 1 | Konstantpegel, «Feste Dosis (Station)» | P4 | Rako 30 × 20 × 12 | D6 |
| 4.2, 4.3 | Ebene 4, 2 und 3 | Konstantpegel, «Feste Dosis (Station)» | P4 | Leni Flori 36 | S8 |
| 4.4 | Ebene 4, 4 | Konstantpegel, «Feste Dosis (Station)» | P4 | Leni Flori 36 | S5 |
| 4.5 | Ebene 4, 5 | Konstantpegel, «Feste Dosis (Station)» | P3 | Leni Flori 36 | S5 |

Fehlt für ein Gefäss noch die passende Box oder der Deckel, erfasst du sie direkt im Assistenten: In Schritt 2 «Neue Box erfassen» bzw. in Schritt 3 «Neuen Deckel erfassen» (ohne Vorlage ist das Formular gleich offen), «Speichern»; ist es die erste Vorlage, ist sie danach gewählt; sonst die neue Vorlage in der Liste antippen, dann «Weiter». Die Intervalle (Messen, Nachfüllen, Wechseln) schlägt die App nach der Betriebsart vor; sie stehen in der Zusammenfassung und lassen sich dort ändern.

**Anzuchtboxen:** Rolle «Anzuchtbox», «Weiter», «Speichern und nächstes erfassen», viermal. Die App schlägt Kennung, Typ und Lage vor: A1 vorne und A2 hinten als Lichtkeimer (weiss), A3 vorne und A4 hinten als Dunkelkeimer (schwarz), je 25 Würfel (Konzept 5.8). Vorschlag in der Zusammenfassung prüfen.

Die Messstelle W ist seit Punkt 4 erfasst. Der Punkt hakt sich ab, sobald mindestens ein Gefäss, eine Anzuchtbox und W da sind.

## Punkt 7: Etiketten drucken und anbringen

In der Checkliste «Etiketten drucken». Die Liste zeigt alle Orte der Anlage R.

1. Zuerst «Testbogen auf Normalpapier» ankreuzen, «Druckansicht öffnen», auf Normalpapier drucken und auf den Etikettenbogen legen; bei Versatz «Druckversatz X» und «Druckversatz Y» in mm eintragen.
2. Etiketten wählen, «Startfeld» setzen (bei einem angebrauchten Bogen das erste freie Feld), «Druckansicht öffnen», drucken (Honor: WLAN-Druck über Mopria oder als PDF).
3. «Als gedruckt bestätigen».
4. Etiketten in die Klarsicht-Taschen stecken: Rako-Boxen vorne mittig unter dem Stapelrand, Stationen um die Stirnseite, Anzuchtboxen zugeschnitten auf 55 × 25 mm, W an die Giesskanne (Konzept 5.4).

Der Punkt hakt sich ab, wenn alle erfassten Orte ein gedrucktes Etikett haben.

## Punkt 8: Gefässe prüfen, Schritte 1 bis 3

In der Checkliste «Gefässe prüfen» (oder in Heute die Aufgabe «Gefäss prüfen» je Gefäss). Am Regal, je Gefäss:

1. Kennung über den Ziffernblock tippen (zum Beispiel 2 · 3), «weiter»: «Richtiges Gefäss: 2.3».
2. Deckel mit der Grafik vergleichen: «Stimmt».
3. Topfgrösse prüfen («Netztopf 8 cm sitzt im Loch»): «Stimmt».

Danach steht das Gefäss auf «in Betrieb (Volumen offen)». Schritt 4 (Volumen mit der Kanne zählen) folgt beim ersten Ansatz in der Abhakliste. Der Punkt hakt sich ab, wenn alle erfassten Gefässe die Schritte 1 bis 3 bestanden haben.

## Punkt 9: Erste Aussaat

In der Checkliste «Aussaat erfassen» (oder ein Etikett einer Anzuchtbox scannen). Drei Schritte: Sorten wählen, Zielgefäss und Töpfe (Reihe oder einzelne Löcher, oder «Ziel später»), «Säen speichern». Termine und Sorten der ersten Runde nach dem Belegungsplan (Konzept 14.1).

Danach verschwindet die Checkliste aus Heute; ein später erfasstes Gefäss bringt sie nicht zurück.

## Danach

- Messwoche 1. bis 7.1.2027: nutzbare Höhe je Ebene nachmessen und in der Anlage ändern; Wassertemperatur je Gefäss am Ende der Lichtphase und am Morgen messen (Konzept 5.2).
- Becherversuch k (F-01) und Messunsicherheit u_EC (F-02) in den Einstellungen erfassen, sobald gemacht (Konzept 5.6).
- Probe aus [«Gerät neu»](geraet-neu.md) Schritt 9 mit einem echten Etikett: scannen öffnet die Maske «Gefäss».
