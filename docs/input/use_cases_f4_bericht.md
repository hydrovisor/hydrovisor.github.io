# Bericht zur Nachführung: Vorschläge Use Cases, Fassung 4

Stand 31.10.2026, nach der Korrekturrunde. Grundlage: `docs/input/use_cases_f3.md` (573 Zeilen), `docs/input/konzept_v1.0.md` (1591 Zeilen; heute `konzept_v1.1.md` mit denselben Zeilen), README «Bekannte Abweichungen» Punkt 1, Prüfbefunde W1 bis W14 und die geringen Befunde der unabhängigen Prüfung. Ausgabe: `use_cases_f4.md` (928 Zeilen) im Scratchpad. Im Repository wurde nichts geändert.

## 1 Umfang der Änderungen

- **285 Zeilen** in der Tabelle «Änderungen gegenüber Fassung 3»: 247 aus der ersten Nachführung, 38 aus der Korrekturrunde (Nr. 248 bis 285). Eine Zeile kann mehrere Einzeländerungen an derselben Stelle bündeln. Dazu eine Liste von sieben Korrekturen, die den Wortlaut von Fassung 3 wiederherstellen und deshalb gegenüber Fassung 3 keine Änderung sind.
- **Neuer UC0** «Einrichtung und Einstellungen» mit 8 AK (Konzept 6.1, 11.3, 11.6, 11.7, E-4).
- **Neue AK aus den Regeln des Konzepts**, angehängt hinter die Nummern von Fassung 3: UC3 1, UC4 2, UC5 3, UC6 4, UC7 4, UC8 4, UC9 4, UC14 1, Rundgang 1 (AK1 geteilt in 1a bis 1c), Lösungswechsel 2; zusammen 26, mit UC0 34. Dazu C4-AK1 bis AK3 für die Auswertungssichten (zwei davon aus UC10 von Fassung 3 verschoben).
- **Entfallene AK mit erhaltener Nummer:** UC1-AK8 (nach UC0-AK1), UC5-AK12 (Gegenrichtung im Pool).
- **UC10, UC11, UC13** als kurze Einträge «entfällt, Folge-CAS KI», ohne AK.
- **Gestrichen:** der Nachtrag vom 28.10.2026 als eigener Abschnitt; alle eigenen Zeiträume und Termine (nur Verweise auf Konzept Kapitel 13).

## 2 Korrekturrunde: Status der Befunde

| Befund | Status | Bemerkung |
| :---- | :---- | :---- |
| W1 U3 EC-Abweichung | umgesetzt | Wortlaut wie vorgeschlagen (R10.1, R10.2) |
| W2 «vierteljährlich» | umgesetzt | UC1 und F12; Wert aus «Frischwasser messen», keine eigene Aufgabe |
| W3 P2 bis P5 | umgesetzt | A5 Einleitung, A5 I3, C2 I3 |
| W4 Kurzbefund | umgesetzt | E12 und C3 |
| W5 Pumpe oder Bereich | umgesetzt | Rundgang Schritt 2 und AK5; Entscheid E-F4-8 |
| W6 Knapp-Zone pH | umgesetzt | Glossar |
| W7 UC1-AK1 | umgesetzt | kein Verweis auf den Bericht; Werte (A); Kontext «Schreibtisch»; Entscheid E-F4-1 |
| W8 UC1 in I1a | umgesetzt | UC1 Herkunft und A5-Tabelle |
| W9 Grenze 1.29 | umgesetzt | Testwerte 1.30 und 1.28; Entscheid E-F4-9 |
| W10 C5 historisch | umgesetzt | K1 bis K31 Spalten «Stelle» und «Inhalt» wörtlich aus Fassung 3 (per Abgleich mit F3 Z. 475 bis 505), Neues nur in «Stand»; K33 nach B.1 |
| W11 UC10-AK nach C4 | umgesetzt | C4-AK1 bis AK3; Entscheid E-F4-10 |
| W12 F11 Becher | umgesetzt | wiederhergestellt |
| W13 UC4-AK6 | umgesetzt | [SQL] Bucket, [E2E] EXIF |
| W14 Rundgang-AK1a | umgesetzt | «inklusive Kurzprüfung» gestrichen, Quelle an 1a bis 1c |

**Geringe Befunde:** 24 von 24 umgesetzt, einer davon teilweise: TP1 bis TP3 tragen jetzt [Unit] (Deno test); der Protokollteil von UC8-AK7 bleibt aber [SQL], weil das Konzept dies ausdrücklich festlegt (TE-05, Z. 1417: «UC8 AK 7 als [SQL] mit injizierter Uhr»). «Saisonfenster» wurde nicht wiederhergestellt, weil das Konzept den Begriff «Aussaatfenster für draussen» verwendet (R7.1, Z. 615; 8.2, Z. 663); die Änderung steht jetzt in der Tabelle (Nr. 274). Kein Befund wurde abgelehnt.

## 3 Unsicherheiten und Widersprüche im Konzept selbst (14)

| Nr. | Stelle im Konzept | Befund | Behandlung in Fassung 4 |
| :---- | :---- | :---- | :---- |
| 1 | Z. 234 gegen Z. 646 und Z. 607 | 5.4 sagt, der Etikett-Code «gehört zum Gefäss»; im selben Absatz, in 8.2 (etikett → platz) und in R9.1 ist die Kennung an den Platz gebunden. | «Kennung am Platz, Etikett physisch am Gefäss»; Erratum-Kandidat (E-F4-7). |
| 2 | Z. 646 gegen Z. 16, 607, 829 | Enum des Etikettformats heisst `'70x42'`, das Etikett misst 70 × 42.3 mm; Taschen 70 × 42 mm (Z. 304). | In C1.2 vermerkt; Erratum-Kandidat (E-F4-7). |
| 3 | Z. 188, 643, 644 gegen Z. 192, 1348 | Lichtstunden am Bereich, Lichtzeitplan an der Anlage; Licht nicht je Ebene schaltbar. Doppelte Erfassung. | Beides wie im Konzept geführt (UC1). |
| 4 | Z. 1321 gegen Z. 964, 1417 | Das Glossar kennt fünf Prüfarten, die Teststrategie zusätzlich «Edge Function» (Deno test); TE-05 setzt UC8-AK7 auf [SQL]. | TP1 bis TP3 und TK1 bis TK3 als [Unit] (Deno test); UC8-AK7 Protokollteil [SQL] (E-F4-3). |
| 5 | Z. 1418 | TE-06: «UC9 AK 1 geteilt», ohne Angabe wie. | Geteilt in [E2E] (Viewports) und [Gerät] (130 %). |
| 6 | Z. 328 gegen Z. 410 | UC5 beginnt mit der Sorte, die Passung gibt es nur in Richtung «Gefäss gewählt → Sorten». | Bedienregel «Sorte zuerst, dann Plätze» aus Fassung 3 wiederhergestellt; Zusammenspiel offen (E-F4-2). |
| 7 | Z. 213, 215, 324, 349 | UC1-AK1 verlangt alle Orte ohne Scrollen mit Kacheln ≥ 72 × 80 dp (Fassung 3); Ebene 4 hat 9 Orte; die Maske «Anlage» gehört zum Kontext «Schreibtisch». | AK mit neuen Zahlen, Werte als (A), Darstellung offen (E-F4-1). |
| 8 | Z. 585 gegen Z. 326 | R8.3: Deckeltausch auf anderes Lochbild «nur bei leerem Gefäss»; UC3: «ohne Pflanzen». «Leer» kann auch Füllzustand «leer» heissen. | Wortlaut von Fassung 3 behalten; gemeint ist ohne Pflanzen. |
| 9 | Z. 275, 276 gegen Z. 512 | Kurzprüfung je Gefäss (5.7) und Sammel-Tipp je Bereich (R5.2). | Zusammengeführt: Sammel-Tipp je Ebene mit Ausnahmen je Gefäss. |
| 10 | Z. 206 gegen Z. 513, 573 | Eine Abweichung markiert «die Gefässe derselben Pumpe» (5.3), in R5.2 und R10.5 «den Bereich»; Pumpe P3 versorgt 3.1 bis 3.3 und 4.5, also nicht deckungsgleich mit einer Ebene. | Pumpe nach 5.3 übernommen; Entscheid und Erratum-Kandidat (E-F4-8). |
| 11 | Z. 465 gegen Z. 488 | R4.8 vergleicht mit der erwarteten Teil-EC aus den gerundeten Ist-Mengen; RF12 nennt 1.04 (ungerundet 1.037). Grenze 1.29 oder 1.287 ist nicht festgelegt. | Testwerte abseits der Grenze; Rundung offen (E-F4-9). |
| 12 | Z. 992 | UC0 ist auf zwei Inkremente verteilt (I1a «UC0 Einrichtung», I1b «Einstellungen»). | So übernommen. |
| 13 | Z. 1567, 1568, 1570 | Das Prüfprotokoll B.3 nennt noch Hygrometer, Messstellen L, Anzuchtplatz ausserhalb des Zelts, Luftpumpe P5 für die Zusatzbox; durch Errata E1 und E2 überholt, nur Protokoll. | Nicht übernommen. |
| 14 | Z. 196, 1062 | DLI-Werte stehen weiter als Schätzung; nach Erratum E1 zulässig, weil kein Sollwert. | Fassung 4 nennt DLI nicht; Lichtstunden (licht_h) bleiben. |

## 4 Entscheide für Tim

Jede Stelle, die in Fassung 4 als «Entscheid Tim offen» markiert ist, trägt eine dieser Nummern; jede Nummer kommt im Text vor.

1. **E-F4-1 UC1-AK1, Ebene 4 – entschieden 31.10.2026: drei Gruppen «Keimung» (A1/A2 weiss | A3/A4 schwarz), «Jungpflanzen» (4.2/4.3 8 cm | 4.4/4.5 5 cm), «Halbbox» (4.1); kein Wischen.** Frage war: neun Orte in einer Zeile (kleinere Kacheln für die Anzuchtboxen), zwei Zeilen oder Scrollen erlauben; Kachelmasse 72 × 80 dp und 28 sp aus Fassung 3 bestätigen oder an die Standarddichte (48 dp) anpassen.
2. **E-F4-2 UC5 Reihenfolge – entschieden 31.10.2026: Sorte zuerst; Passung beim Umsetzen (Konzept 6.1).** Frage war: «Sorte zuerst, dann Plätze» (Fassung 3) gegen die Passungsrichtung «Gefäss → Sorten»; was «Säen» ohne Zielgefäss anzeigt.
3. **E-F4-3 Prüfart der Edge-Function-Tests:** [Unit] mit Zusatz «Deno test» wie in Fassung 4 oder eine eigene Prüfart; betrifft das AK-Abdeckungsskript.
4. **E-F4-4 AK-Nummern:** die 34 neuen AK, C4-AK1 bis AK3 und die Teilung der Rundgang-AK in 1a bis 1c bestätigen, bevor die Spezifikation sie in Testnamen übernimmt.
5. **E-F4-5 Skizze A3:** «leeren» oben rechts (Konzept 6.3), die Rücktaste dafür unten rechts.
6. **E-F4-6 Reste aus Fassung 3 ohne Beleg im Konzept:** einzeln behalten (als A) oder streichen: rund 70 Apps (A1); Auswahlregel und rund 0.35 PT des Regaltests (A3); Aufteilung der 75 Minuten je Paket (A5); Papierfach 50 bis 80 g/m² (A6); Bildschirm bis Timerende plus 2 min (U7); Hauptknopf 72 dp, Ladezeit 1 s (UC1); Frage «Erreicht die Lösung den Netztopfboden?» (UC5); Ladezeit Heute 2 s (UC8-AK9); Wechseldauer 60 bis 75 bzw. 45 min (Lösungswechsel). Diese Nummer fasst auch Punkt (d) des Korrekturauftrags.
7. **E-F4-7 Erratum-Kandidaten im Konzept:** Wortwahl «gehört zum Gefäss» (Z. 234) und Enum `'70x42'` (Z. 646).
8. **E-F4-8 Pumpe oder Bereich – entschieden 31.10.2026: dieselbe Pumpe; Erratum-Kandidat für R5.2 und R10.5.** Frage war: markiert eine Abweichung «Pumpe sprudelt nicht» oder «keine Luftzone» die Gefässe derselben Luftpumpe (Konzept 5.3) oder den Bereich (R5.2, R10.5)? Danach Erratum für die unterlegene Stelle.
9. **E-F4-9 Rundung der Teil-EC:** rechnet die Grenze «mehr als 0.25 über der erwarteten Teil-EC» mit 1.04 (gerundet) oder 1.037 (ungerundet)?
10. **E-F4-10 Auswertungs-AK:** die AK der Auswertungssichten in C4 statt in UC10 bestätigen.

## 5 Inhalte aus Fassung 3 ohne Beleg im Konzept

Alle sind im Text als (A) mit «Entscheid Tim offen, E-F4-6» markiert (Liste unter E-F4-6). Die vierteljährliche Messung an «W» ist mit W2 gestrichen. Zur Zahl «rund 70 Apps»: Das Konzept nennt für den Marktvergleich vom 21.10. rund 90 Apps (Z. 109); vermutlich sind das zwei verschiedene Recherchen.

## 6 Selbstprüfung

| Suchbegriff | Treffer | Begründung |
| :---- | :---- | :---- |
| «v0.3» | 2 im Text, Rest in der Änderungstabelle | Text: A5 «Kern Konzept v0.3 (Stand Fassung 3)» als Ausgangswert aus Konzept 13.4 (Z. 1023); A6 Titel des historischen Entscheids «E12 Konzept v0.3 (23.10.2026)». Der Satz über den Vorrang von v0.3 kommt nicht vor. |
| «11 Gefäss», «3 Anzuchtorte» | nur Änderungstabelle | Spalte «alt». |
| «Anzuchtbox A» | im Text nur als «Anzuchtbox A1» | «Anzuchtbox A und B» nur in Spalte «alt» (Nr. 86). |
| «R-Z», «62-mm», «42 mm» ohne .3 | nur Änderungstabelle | Spalte «alt». Im Text heisst es «Etikettenband entfällt». |
| «<konto>», «DLI», «siehe Bericht» | 0 | – |
| «Z2» | 1 im Text, Rest in der Tabelle | Text: Testfall «TZ2» (UC8-AK6). Tabelle: Deckeltyp «Z2» der alten Hardware in Spalte «alt». |
| «zuerst 85», «Dezember», «22 Tabellen», «vierteljährlich» | nur Änderungstabelle | Spalte «alt». |
| Eszett, gerade Anführungszeichen | 0 | – |
| Nachname, Wohnort, E-Mail, Wasserversorger | 0 | nur «Tim». |
