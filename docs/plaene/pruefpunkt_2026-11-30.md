# Prüfpunkt 30.11.2026: Zwischenprognose

Stand 22.11.2026 (vorgezogene Zwischenprognose, #268) · Lead · Grundlage Konzept v1.11 Kapitel 13.5 (sechs Bedingungen) und RR13 in `risiken.md`. Tim am 22.11.2026 im Chat: «wenn alle Bedingungen erfüllt sind kannst du auch den Prüfpunkt vom 30.11 bereits vorziehen». Erste Fassung vom 8.11.2026 (#150) im Git-Verlauf.

**Ergebnis 22.11.: nicht vorgezogen.** Drei Bedingungen sind erfüllt, Bedingung 3 hält bisher, die Bedingungen 4 und 6 sind offen. Bedingung 6 hängt an Tims Handgriff: Fehlt `data/eval/tueten_referenz.csv` am 30.11., gilt ab 1.12. die Rückfallebene Z2 (13.1). Am 30.11. trägt der Lead die Endwerte ein und hält das Ergebnis als Protokollzeile in `risiken.md` fest.

## Bedingungen

| Nr. | Bedingung (13.5) | Stand 22.11. | Quelle | Offen bis 30.11. |
|---|---|---|---|---|
| 1 | Spezifikation am 11.11. und Plan am 13.11. abgenommen (höchstens drei Tage Verzug) | erfüllt: Spezifikation am 1.11.2026 abgenommen, Plan am 13.11. eingefroren | `CLAUDE.md`, `pakete.md` Kopf | nichts |
| 2 | I0 zu mindestens zwei Dritteln zusammengeführt (rund 5.5 von 8 PT), Durchsatz hochgerechnet mindestens 3.6 PT je Woche netto | erfüllt: alle Pakete I0 bis I2 (ohne I2-07) und beide Pool-Pakete vor M2 zusammengeführt (rund 38.25 PT, siehe unten) | gemergte Pull Requests bis #264 | nichts |
| 3 | Kontingent in den Kalenderwochen 47 und 48 höchstens 80 % ohne Ausweichen auf Sonnet | hält bisher: Wochenfenster 17.11. bis 24.11. (11:00) am 22.11. um 9 Uhr bei 65 % (alle Modelle), Fable 80 %; kein Ausweichen auf Sonnet | `get_usage` | Endwert des Fensters bis 24.11. und Fenster 24.11. bis 1.12. (KW 48) messen; bis dahin nur kleine Pakete (W0-Runde 14, Prüftor) |
| 4 | Tims Ist-Zeit im November höchstens 115 % des Plans (48 h, 13.3) | offen | Tims Zeiterfassung | Tim meldet seine Novemberstunden am 30.11. |
| 5 | im Mittel höchstens 1.5 Nachbesserungsrunden je Paket | erfüllt: 49 Runden auf 104 umgesetzte Pakete = 0.47 (A) | Labels `runde-1` und `runde-2` auf geschlossenen Issues der Klassen `routine`, `fachlogik`, `kern` (Abschluss «completed») | Zählung am 30.11. wiederholen |
| 6 | Referenzdatei Düngerrechner und `tueten_referenz.csv` liegen vor | **nicht erfüllt:** `tests/golden/duengerrechner_referenz.csv` liegt vor (Hash `REFERENZ_HASH_RECHNER` gesetzt); `data/eval/tueten_referenz.csv` fehlt im Repository, `REFERENZ_HASH_TUETEN` ist nicht gesetzt | `git ls-files`, `gh variable list` | Tim legt `data/eval/tueten_referenz.csv` an und setzt `REFERENZ_HASH_TUETEN` (CLAUDE.md Regel 7) |

(A) Zählweise Bedingung 5: `runde-1` zählt eine Runde, `runde-2` zwei, auch ohne `runde-1`. Pull Requests mit denselben Labels sind nicht zusätzlich gezählt; nicht umgesetzte Issues (I2-07 #39) und offene Issues zählen nicht.

## Durchsatz (Bedingung 2)

| Block | PT netto laut `pakete.md` | zusammengeführt bis |
|---|---|---|
| I0 und DS-01 | 9.25 | 4.11. |
| I1a | 7.5 | 5.11. |
| I1b inkl. Folgepakete I1b-08 und I1b-09 | 9.75 | 7.11. |
| I2 ohne I2-07 (geschlossen, Entscheid 0014) | 10.75 | 7.11. |
| Pool Wechselblock (#139) | 0.5 | 8.11. |
| Pool eigene wiederkehrende Aufgaben (#249, Entscheid 0030) | 0.5 | 22.11. |
| **Summe** | **38.25** | |

Seit dem 14.11. kamen Pakete ausserhalb der Summen dazu (Navigation N1 bis N4, Usability UX1 bis UX8, Erntekalender UC15, W0-Runden 11 bis 13, Konzept v1.7 bis v1.11, Prüftor #251).

Das Fenster der Messung in `pakete.md` (14.11. bis 30.11.) liegt nach der tatsächlichen Arbeit; der Durchsatz ab 1.11. liegt mit rund 37.75 PT in gut einer Woche ein Vielfaches über 3.6 PT je Woche (A).

## Folgerung für November und Dezember (Stand 8.11.2026)

- Die Entwicklung bis M2 ist abgeschlossen. Bis zum Testbetrieb (7.1.2027) bleiben Abnahmen am Honor (#144), Fehlerbehebungen und die Inbetriebnahme der Anlage R.
- Bedingung 3 ist die einzige, die der Lead selbst gefährden kann. Darum in den Wochen 47 und 48 (16. bis 29.11.) nur Fehlerbehebungen und kleine Routine-Pakete, Ziel höchstens 60 % je Wochenfenster; der Verbrauch kommt in jeden Statuskommentar.
- M0 (15.12.) verlangt dasselbe für die Wochen 47 bis 50 (bis 13.12.) und zusätzlich: Push an 5 Tagen in Folge, KI 3 von 3 Tüten (Entscheid 0009 erfüllt), Backup mit Wiederherstellungsprobe (I0-11), W0-Teilfreigabe der ersten Runde (Tim).
- Push an 5 Tagen (#116) steht in #144 unter «ab Testbetrieb», M0 verlangt ihn aber bis 15.12. Die Sammel-Push geht nach `supabase/functions/push-taeglich/kern.ts` auch mit leerer Aufgabenliste hinaus, braucht aber eine Zeile `einstellung` (Push-Zeit), die unabhängig von einer Anlage ist (A, aus dem Code gelesen). Der Lead spielt die Schritte gegen den Datenstand der Produktion durch und schickt sie Tim, damit die 5 Tage vor dem 15.12. liegen.
