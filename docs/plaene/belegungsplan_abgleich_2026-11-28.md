# Belegungsplan Runde 1 gegen die W0-Werte (Abgleich vom 28.11.2026)

Stand 28.11.2026 · Lead · Grundlage Konzept v1.11 Kapitel 14.1 (Belegungsplan, Tims Bestätigung im Dezember, 13.2) und `data/wissensbasis/freigegeben/art.csv` nach den W0-Runden 11 bis 14 (main 0082a9f). Tim am 28.11.2026: «Ja, alle drei» (Abgleich vorziehen).

Der Abgleich ändert nichts. Den Belegungsplan im Konzept bestätigt Tim (Anhang B.2). Diese Datei zeigt, wo die App andere Termine zeigen wird als der Plan, damit Tim bei der Bestätigung entscheiden kann.

## Rechenregeln der App

1. **Geplanter Umsetztag:** Beim Säen setzt die App `umsetzen_geplant_am` auf Saat + `umsetzen_ab_d` (`src/domain/pflanzung/saeen.ts`, `umsetzenAm`); bei Direktsaat auf den Saattag. Einen Plantag kann man beim Säen nicht wählen. Die Aufgabe «Umsetzen» erscheint an diesem Tag; mit «Morgen» verschiebt Tim sie bis zur Grenze.
2. **Grenze und «überfällig»:** Saat + `umsetzen_bis_d` + 7 Tage (`src/domain/aufgaben-regeln.ts`, R6.2). Fehlt `umsetzen_bis_d` (Klasse D), gibt es keine Grenze.
3. **Ernte ab bei Mehrfachernte:** Umsetztag + `ernte_ab_d`. Vor dem Umsetzen rechnet die App mit dem geplanten Umsetztag aus Regel 1, danach mit dem erfassten Tag; bei Direktsaat gilt Saat + `ernte_ab_d` (`ersteErnteAb()` in `src/domain/pflanzung/belegung.ts`, Regel D7).
4. **Ernte bei einmaliger Ernte:** gleicher Bezug wie Regel 3 + `ernte_ab_d` (`voraussichtlichesEnde()`).
5. **Ende der Kultur:** Saat + `kulturdauer_max_d` (`03_import_w0.md` 4.3.3, `kulturFrage()` in `src/domain/phasen/ernte.ts`).

Saattage: W1 7.1., W2 21.1., W3 4.2., W4 18.2., W5 4.3., W6 18.3.2027, Zusatztermin 14.3. Kulturformen nach der Startbelegung im Konzept (Basilikum: Dauerkultur Blatt).

## Abweichungen, die Tim entscheiden sollte

| Nr. | Thema | Plan 14.1 | App (Rechenweg) | Folge in der App | Vorschlag |
|---|---|---|---|---|---|
| A | Geplanter Umsetztag aller umgesetzten Sätze | Plantage 28.1. (Tomate, Chili), 21.1. (Lollo, Eissalat), 18.2. (Petersilie), 4.2. (Eichblatt, Schnittlauch), 24.2. (Basilikum), 18.2. (Pak Choi), 4.3. und 18.3. (Folgesätze) | Saat + `umsetzen_ab_d` (Regel 1): Tomate und Chili 7.1. + 10 = 17.1., Lollo und Eissalat 7.1. + 12 = 19.1., Petersilie 7.1. + 21 = 28.1., Schnittlauch 7.1. + 28 = 4.2., Eichblatt 21.1. + 12 = 2.2., Basilikum und Pak Choi 4.2. + 14 = 18.2., Folgesatz Lollo/Eissalat 18.2. + 12 = 2.3., Folgesatz Eichblatt 4.3. + 12 = 16.3. | Die Aufgabe «Umsetzen» erscheint 2 bis 21 Tage vor dem Plantag und wird bis dahin mit «Morgen» verschoben; «Ernte ab» vor dem Umsetzen liegt um dieselbe Spanne früher | (1) Plan so lassen und täglich «Morgen» tippen, oder (2) Plantage an die App angleichen, oder (3) vor M2 (31.1.) ein Fachlogik-Paket «Umsetzdatum beim Säen wählen» (rund 0.5 PT aus dem Pool) |
| B | Petersilie glatt (W1) → 2.2 | Umsetzen 11.2. bis 25.2., geplant 18.2. (Keimung 2 bis 4 Wochen) | Fenster 7.1. + 21 = 28.1. bis 7.1. + 35 = 11.2.; Grenze 7.1. + 35 + 7 = 18.2. | Am geplanten Tag zeigt die App «Umsetzen überfällig» und die Aufgabe «Reservierung prüfen» | geplant spätestens 17.2., z. B. 11.2. |
| C | Lollo Rossa, Eissalat (W1), Eichblatt (W2), Folgesätze (W4), Kulturform Schnitt → 2.3 | Standzeit 42 Tage ab Umsetzen, Löcher frei ab 4.3. bzw. 18.3. | Ende Saat + 42 (Regel 5): 7.1. + 42 = 18.2., 21.1. + 42 = 4.3., 18.2. + 42 = 1.4. | Der Erntekalender und die Kulturfrage melden das Ende zwei Wochen früher, als der Plan die Löcher freigibt | Tim entscheidet die Zählweise. «Ab Saat» (W0): Folgesätze um zwei Wochen vorziehen. «Ab Umsetzen» (Plan): W0-Korrektur als neue Zeile, 42 + 12 = 54 Tage ab Saat |
| D | Babyleaf-Mischung (W2) → 3.3, Direktsaat | Ernte um 25.2. | Ernte 21.1. + 21 = 11.2. (Regel 4), Ende 21.1. + 30 = 20.2. (Regel 5) | Der Plan erntet fünf Tage nach dem Ende laut W0 | Ernte um 18.2. planen |
| E | Folgesatz Babyleaf (W5) → 3.3, Direktsaat | «Ernte nach 31.3.» | Ernte 4.3. + 21 = 25.3., Ende 4.3. + 30 = 3.4. | Die App zeigt eine Ernte vor dem Datenschluss, die der Plan nicht zählt | Ernte um 25.3. bis 31.3. in den Plan aufnehmen (mehr Daten bis 31.3.) |
| F | Nüsslisalat (W1) → 3.1 und Zusatztermin 14.3., Direktsaat | Ernte 26.2. bis 8.3. (50 bis 60 Tage) | Ernte 7.1. + 29 = 5.2. bzw. 14.3. + 29 = 12.4. (Regel 4); Ende 7.1. + 66 = 14.3. | Die App zeigt die Ernte drei Wochen vor dem Plan: Die Quelle zählt die 29 Tage ab Umsetzen (nach 22 Tagen), die App bei Direktsaat ab Saat | W0-Korrektur durch den Lead als neue Zeile (29 + 22 = 51 Tage, wie Regel D7 umgekehrt); dann 7.1. + 51 = 27.2., passt zum Plan |
| G | Tomate (W1), Ernte ab | «keine Ernte» bis 31.3. | vor dem Umsetzen 17.1. + 71 = 29.3. (Regel 3 mit dem App-Plantag); nach dem Umsetzen am 28.1. 28.1. + 71 = 9.4. | Bis zum Umsetzen zeigt der Erntekalender «Ernte ab 29.3.» | nichts; erledigt sich mit A |

## Ohne Handlungsbedarf

| Satz | Plan | App (Rechenweg) | Bemerkung |
|---|---|---|---|
| Tomate (W1) → 1.1, Umsetzen | geplant 28.1. | Fenster 17.1. bis 7.1. + 16 = 23.1., Grenze 7.1. + 16 + 7 = 30.1. | Plantag zwei Tage vor der Grenze (nur A betrifft ihn) |
| Chili (W1) → 1.2, Umsetzen und Ernte | geplant 28.1.; keine Ernte | Fenster 17.1. bis 7.1. + 20 = 27.1., Grenze 7.1. + 27 = 3.2.; Ernte 28.1. + 102 = 10.5. | Plantag einen Tag nach dem Fenster, vor der Grenze |
| Lollo Rossa, Eissalat (W1), Umsetzen und Ernte | geplant 21.1.; Schnitte ab Mitte Februar | Fenster 19.1. bis 7.1. + 18 = 25.1., Grenze 1.2.; Ernte 21.1. + 23 = 13.2. | stimmt (Ende siehe C) |
| Schnittlauch Twiggy (W1) → 2.2 | geplant 4.2.; Ernte ab April | Fenster 4.2. bis 7.1. + 42 = 18.2., Grenze 25.2.; Ernte 4.2. + 28 = 4.3. | App zeigt die Ernte früher (Plan vorsichtig) |
| Petersilie glatt (W1), Ernte | ab April | vor dem Umsetzen 28.1. + 28 = 25.2.; nach dem Umsetzen am 11.2. 11.2. + 28 = 11.3. | App früher (Plan vorsichtig); Umsetzen siehe B |
| Eichblatt (W2) → 2.3 | geplant 4.2.; Schnitte ab Anfang März | Fenster 2.2. bis 21.1. + 18 = 8.2., Grenze 15.2.; Ernte 4.2. + 23 = 27.2. | stimmt (Ende siehe C) |
| Spinat Babyleaf (W2) → 3.2, Direktsaat | Ernte um 18.2. | Ernte 21.1. + 14 = 4.2., Ende 21.1. + 46 = 8.3. | Plan im Fenster |
| Basilikum Genoveser (W3) → 2.1, Dauerkultur Blatt | geplant 24.2.; erster Schnitt um 12.3. | Umsetzen ab 4.2. + 14 = 18.2. (bis: Klasse D, keine Grenze); Ernte 24.2. + 18 = 14.3. | zwei Tage Unterschied. Nur zur Kenntnis: In der Schnittform wären es 24.2. + 50 = 15.4.; der Lead prüft den Wert 50 in einer W0-Nachkontrolle (freigegeben vor Regel D7) |
| Pak Choi Misome (W3) → 2.1 | geplant 18.2.; Ernte um 13.3. | Fenster 18.2. bis 4.2. + 16 = 20.2., Grenze 27.2.; Ernte 18.2. + 21 = 11.3. | stimmt |
| Folgesatz Lollo/Eissalat (W4) → 2.3 | geplant 4.3.; Schnitt um 25.3. | Fenster 2.3. bis 18.2. + 18 = 8.3., Grenze 15.3.; Ernte 4.3. + 23 = 27.3. | stimmt (Ende siehe C) |
| Folgesatz Spinat Babyleaf (W4) → 3.2 | Ernte um 18.3. | Ernte 18.2. + 14 = 4.3., Ende 18.2. + 46 = 5.4. | Plan im Fenster |
| Folgesatz Eichblatt (W5) → 2.3 | geplant 18.3.; Ernten nach 31.3. | Fenster 16.3. bis 4.3. + 18 = 22.3., Grenze 29.3.; Ernte 18.3. + 23 = 10.4. | stimmt |
| Folgesatz Pak Choi (W6) → 2.1 | geplant nach 31.3. | Fenster 18.3. + 14 = 1.4. bis 18.3. + 16 = 3.4. | ausserhalb des Messzeitraums |
| Folgesatz Spinat (W6) → 3.2, Direktsaat | Phasen | Ernte 18.3. + 14 = 1.4. | ausserhalb des Messzeitraums |

## Folgerung

Für Tims Bestätigung im Dezember gibt es drei Entscheide: A (Umsetztag: Plan, tägliches «Morgen» oder Paket vor M2), B (Petersilie früher) und C (Zählweise der Kulturdauer). Dazu kommen zwei kleine Planänderungen (D, E). F und die Basilikum-Nachkontrolle sind W0-Arbeit des Lead (Entscheid 0018); er macht sie nach Tims Entscheid zu A bis C in einer gemeinsamen W0-Runde. Ändert Tim den Plan, folgt eine Konzeptfassung 1.12 mit Eintrag in Anhang B.2.
