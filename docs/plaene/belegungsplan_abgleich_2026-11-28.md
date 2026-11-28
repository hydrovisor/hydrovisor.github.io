# Belegungsplan Runde 1 gegen die W0-Werte (Abgleich vom 28.11.2026)

Stand 28.11.2026 · Lead · Grundlage Konzept v1.11 Kapitel 14.1 (Belegungsplan, Tims Bestätigung im Dezember, 13.2) und `data/wissensbasis/freigegeben/art.csv` nach den W0-Runden 11 bis 14 (main 0082a9f). Tim am 28.11.2026: «Ja, alle drei» (Abgleich vorziehen).

Der Abgleich ändert nichts. Der Belegungsplan steht im Konzept, und Änderungen daran bestätigt Tim (Anhang B.2). Diese Datei nennt, wo die App andere Termine zeigen wird als der Plan, damit Tim bei der Bestätigung entscheiden kann.

## Rechenregeln der App (aus dem Code und den W0-Regeln)

- Das Umsetzfenster reicht von Saat + `umsetzen_ab_d` bis Saat + `umsetzen_bis_d` (Art).
- «Ernte ab» bei Mehrfachernte ist Umsetzen + `ernte_ab_d`; bei Direktsaat gilt Saat + `ernte_ab_d` (Regel D7, `ersteErnteAb()` in `src/domain/pflanzung/belegung.ts`).
- `kulturdauer_typisch_d` und `kulturdauer_max_d` zählen ab Saat (`auftrag_runde-11.md`, `03_import_w0.md` 4.3.3).
- (A) Daten sind Kalendertage ab dem Saattag der Welle (W1 7.1., W2 21.1., W3 4.2., W4 18.2., W5 4.3., W6 18.3.2027).

## Abweichungen, die Tim entscheiden sollte

| Nr. | Satz (Welle) | Plan 14.1 | App nach W0 | Folge in der App | Vorschlag |
|---|---|---|---|---|---|
| 1 | Tomate (W1) → 1.1 | Umsetzen 28.1. bis 11.2., geplant 28.1. | Umsetzen 17.1. bis 23.1. (10 bis 16 Tage, «Days to Transplant» der Flex Farm, Klasse B2) | Die Aufgabe «Umsetzen» kommt ab 17.1. und ist ab 24.1. überfällig, also vier Tage vor dem geplanten Tag | Plan auf 21.1. vorziehen (am selben Tag wie Lollo und Eissalat) oder den W0-Wert als Klasse B2 überstimmen; die Station 4.2 im 8-cm-Topf entspricht eher dem «Transplant» der Quelle |
| 2 | Chili (W1) → 1.2 | Umsetzen 28.1. bis 11.2., geplant 28.1. | Umsetzen 17.1. bis 27.1. (10 bis 20 Tage, Flex Farm, B2) | ab 28.1. einen Tag überfällig | wie Nr. 1, geplant 21.1. oder 27.1. |
| 3 | Petersilie glatt (W1) → 2.2 | Umsetzen 11.2. bis 25.2., geplant 18.2. (Keimung 2 bis 4 Wochen) | Umsetzen 28.1. bis 11.2. (21 bis 35 Tage, Runde 13) | ab 12.2. überfällig, am geplanten Tag eine Woche | geplant 11.2.; keimt sie spät, bleibt die Aufgabe offen, bis die Keimung erfasst ist |
| 4 | Lollo Rossa, Eissalat (W1) und Eichblatt (W2), Kulturform Schnitt → 2.3 | Standzeit 42 Tage ab Umsetzen, Löcher frei ab 4.3. bzw. 18.3. | `kulturdauer_max_d` 42 Tage **ab Saat**: Ende 18.2. bzw. 4.3. | Der Erntekalender zeigt das Ende der Schnitte zwei Wochen früher, als der Plan die Löcher freigibt | (A) Plan behalten; Tim entscheidet, ob die 42 Tage ab Saat (W0) oder ab Umsetzen (Plan) gelten sollen; bei «ab Umsetzen» braucht W0 eine Korrektur als neue Zeile (56 Tage ab Saat) |
| 5 | Babyleaf-Mischung (W2) → 3.3, Direktsaat | Ernte um 25.2. (35 Tage) | Ernte ab 11.2., Kultur endet spätestens 20.2. (`kulturdauer_max_d` 30) | Der Plan erntet fünf Tage nach dem Ende laut W0 | Ernte um 18.2. planen; der Folgesatz ab 4.3. bleibt |
| 6 | Basilikum Genoveser (W3) → 2.1 | erster Schnitt um 12.3. | Kulturform **Schnitt**: Ernte ab 15.4. (24.2. + 50 Tage); Kulturform **Dauerkultur Blatt**: Ernte ab 14.3. (24.2. + 18 Tage) | Wird Basilikum als Schnitt gesät, liegt der erste Schnitt im Kalender fünf Wochen nach dem Plan | beim Säen «Dauerkultur Blatt» wählen; zusätzlich prüft der Lead in einer W0-Nachkontrolle, ob die 50 Tage der Schnittform ab Saat gezählt sind (Quelle Adv. Hort. Sci. 27(4), vor Regel D7 freigegeben) |

## Abweichungen ohne Handlungsbedarf

| Satz | Plan | App | Bemerkung |
|---|---|---|---|
| Schnittlauch Twiggy (W1) → 2.2 | Umsetzen 4.2. bis 11.2.; Ernte ab April | Umsetzen 4.2. bis 18.2.; Ernte ab 4.3. (Umsetzen + 28) | Plan liegt im Fenster; die App zeigt die Ernte früher (Plan vorsichtig) |
| Petersilie glatt (W1) | Ernte ab April | Ernte ab 11.3. bzw. 18.3. (Umsetzen + 28) | wie oben |
| Nüsslisalat (W1) → 3.1 | Ernte 26.2. bis 8.3. | Ernte ab 5.2., typisch 27.2., spätestens 14.3. | Plan im Fenster |
| Spinat Babyleaf (W2, W4) → 3.2 | Ernte um 18.2. bzw. 18.3. | ab 4.2. bzw. 4.3., spätestens 8.3. bzw. 5.4. | Plan im Fenster |
| Lollo Rossa, Eissalat (W1), Folgesätze (W4) | Umsetzen geplant 21.1. bzw. 4.3., Schnitte ab Mitte Februar bzw. 25.3. | Fenster 19.1. bis 25.1. bzw. 2.3. bis 8.3.; Ernte ab 13.2. bzw. 27.3. | stimmt |
| Eichblatt (W2, W5) | geplant 4.2. bzw. 18.3. | Fenster 2.2. bis 8.2. bzw. 16.3. bis 22.3.; Ernte ab 27.2. | stimmt |
| Pak Choi (W3, W6) | geplant 18.2. bzw. nach 31.3.; Ernte um 13.3. | Fenster 18.2. bis 20.2.; einmalige Ernte, typisch 8.3., spätestens 5.4. | stimmt |
| Basilikum (W3) | Umsetzen 18.2. bis 25.2. | ab 18.2. (bis: Klasse D) | stimmt |

## Folgerung

Fünf Punkte (1 bis 3, 5, 6) brauchen bei Tims Bestätigung des Belegungsplans im Dezember eine Wahl: Plan an W0 angleichen oder W0 überstimmen. Punkt 4 ist eine Frage der Zählweise. Ändert Tim den Plan, folgt eine Konzeptfassung 1.12 mit Eintrag in Anhang B.2; ändert er einen W0-Wert, eine W0-Korrektur als neue Zeile.
