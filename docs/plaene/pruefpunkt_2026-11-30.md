# Prüfpunkt 30.11.2026: Vorbereitung der Zwischenprognose

Stand 8.11.2026 · Lead · Grundlage Konzept v1.5 Kapitel 13.5 (sechs Bedingungen) und RR13 in `risiken.md`. Diese Datei sammelt die Messwerte, die schon vorliegen, und nennt, was bis zum 30.11. noch fehlt. Am 30.11. trägt der Lead die Endwerte ein und hält das Ergebnis (Z3 bleibt oder Rückfall auf Z2) als Protokollzeile in `risiken.md` und als Kommentar im Sammel-Issue fest.

## Bedingungen

| Nr. | Bedingung (13.5) | Stand 8.11. | Quelle | Offen bis 30.11. |
|---|---|---|---|---|
| 1 | Spezifikation am 11.11. und Plan am 13.11. abgenommen (höchstens drei Tage Verzug) | erfüllt: beide am 1.11.2026 abgenommen | `pakete.md` Kopf, `docs/spec/` (abgenommen 1.11.) | nichts |
| 2 | I0 zu mindestens zwei Dritteln zusammengeführt (rund 5.5 von 8 PT), Durchsatz hochgerechnet mindestens 3.6 PT je Woche netto | erfüllt: I0 und DS-01 (9.25 PT) bis 4.11. zusammengeführt; bis 8.11. alle Pakete bis M2 (rund 37.75 PT, siehe unten) | gemergte Pull Requests #42 bis #149 | nichts |
| 3 | Kontingent in den Kalenderwochen 47 und 48 höchstens 80 % ohne Ausweichen auf Sonnet | offen; Woche bis 10.11. bei 94 % (RR2 eingetreten) | `get_usage` | Verbrauch in den Fenstern ab 17.11. und 24.11. messen und hier eintragen |
| 4 | Tims Ist-Zeit im November höchstens 115 % des Plans (48 h, 13.3) | offen | Tims Zeiterfassung | Tim meldet seine Novemberstunden am 30.11. |
| 5 | im Mittel höchstens 1.5 Nachbesserungsrunden je Paket | erfüllt: 35 Runden auf 53 Pakete = 0.66 (A) | Labels `runde-1` (24) und `runde-2` (11) auf Issues der Klassen `routine` (22), `fachlogik` (26), `kern` (5) | Zählung am 30.11. wiederholen |
| 6 | Referenzdatei Düngerrechner und `tueten_referenz.csv` liegen vor | teilweise: `tests/golden/duengerrechner_referenz.csv` liegt vor (Hash `REFERENZ_HASH_RECHNER` gesetzt); `data/eval/tueten_referenz.csv` fehlt im Repository | `git ls-files`, Repository-Variablen | Tim legt `data/eval/tueten_referenz.csv` an und setzt `REFERENZ_HASH_TUETEN` (CLAUDE.md Regel 7) |

(A) Zählweise Bedingung 5: Issues mit `runde-1` plus Issues mit `runde-2`, also eine obere Schätzung; Pull Requests mit denselben Labels sind nicht zusätzlich gezählt.

## Durchsatz (Bedingung 2)

| Block | PT netto laut `pakete.md` | zusammengeführt bis |
|---|---|---|
| I0 und DS-01 | 9.25 | 4.11. |
| I1a | 7.5 | 5.11. |
| I1b inkl. Folgepakete I1b-08 und I1b-09 | 9.75 | 7.11. |
| I2 ohne I2-07 (geschlossen, Entscheid 0014) | 10.75 | 7.11. |
| Pool Wechselblock (#139) | 0.5 | 8.11. |
| **Summe** | **37.75** | |

Das Fenster der Messung in `pakete.md` (14.11. bis 30.11.) liegt nach der tatsächlichen Arbeit; der Durchsatz ab 1.11. liegt mit rund 37.75 PT in gut einer Woche ein Vielfaches über 3.6 PT je Woche (A).

## Folgerung für November und Dezember

- Die Entwicklung bis M2 ist abgeschlossen. Bis zum Testbetrieb (7.1.2027) bleiben Abnahmen am Honor (#144), Fehlerbehebungen und die Inbetriebnahme der Anlage R.
- Bedingung 3 ist die einzige, die der Lead selbst gefährden kann. Darum in den Wochen 47 und 48 (16. bis 29.11.) nur Fehlerbehebungen und kleine Routine-Pakete, Ziel höchstens 60 % je Wochenfenster; der Verbrauch kommt in jeden Statuskommentar.
- M0 (15.12.) verlangt dasselbe für die Wochen 47 bis 50 (bis 13.12.) und zusätzlich: Push an 5 Tagen in Folge, KI 3 von 3 Tüten (Entscheid 0009 erfüllt), Backup mit Wiederherstellungsprobe (I0-11), W0-Teilfreigabe der ersten Runde (Tim).
- Push an 5 Tagen (#116) steht in #144 unter «ab Testbetrieb», M0 verlangt ihn aber bis 15.12. Die Sammel-Push geht nach `supabase/functions/push-taeglich/kern.ts` auch mit leerer Aufgabenliste hinaus, braucht aber eine Zeile `einstellung` (Push-Zeit), die unabhängig von einer Anlage ist (A, aus dem Code gelesen). Der Lead spielt die Schritte gegen den Datenstand der Produktion durch und schickt sie Tim, damit die 5 Tage vor dem 15.12. liegen.
