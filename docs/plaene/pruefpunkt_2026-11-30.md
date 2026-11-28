# Prüfpunkt 30.11.2026: Zwischenprognose

Stand 28.11.2026 (vorgezogen abgeschlossen, #275; Zwischenprognose 22.11., #268) · Lead · Grundlage Konzept v1.11 Kapitel 13.5 (sechs Bedingungen) und RR13 in `risiken.md`. Tim am 22.11.2026 im Chat: «wenn alle Bedingungen erfüllt sind kannst du auch den Prüfpunkt vom 30.11 bereits vorziehen». Erste Fassung vom 8.11.2026 (#150) im Git-Verlauf.

**Ergebnis 28.11.2026 (vorgezogen): Z3 bleibt.** Alle sechs Bedingungen sind erfüllt. Für Bedingung 3 gilt die Annahme (A), die Tim am 28.11. bestätigt hat («Ja, alle drei»): Massgebend ist das Wochenkontingent aller Modelle, nicht die Fable-Teilgrenze. KW 47 lag zuletzt bei 68 %, KW 48 am 28.11. bei 2 %; das Fenster bis 1.12. kann die Grenze von 80 % nicht mehr erreichen, ohne dass der Lead neue grosse Pakete startet. Am 22.11. war der Prüfpunkt noch nicht vorgezogen (Bedingung 4 offen, 6 nicht erfüllt). Die Rückfallebene Z2 entfällt; nächster Prüfstein ist M0 am 15.12. (`m0_2026-12-15.md`).

## Bedingungen

| Nr. | Bedingung (13.5) | Stand 28.11. | Quelle | Offen |
|---|---|---|---|---|
| 1 | Spezifikation am 11.11. und Plan am 13.11. abgenommen (höchstens drei Tage Verzug) | erfüllt: Spezifikation und Plan am 1.11.2026 abgenommen (`pakete.md` Kopf: eingefroren mit Tims Abnahme von Auftrag 3, Frist 13.11.) | `CLAUDE.md`, `pakete.md` Kopf | nichts |
| 2 | I0 zu mindestens zwei Dritteln zusammengeführt (rund 5.5 von 8 PT) und der gemessene Durchsatz hochgerechnet mindestens 3.6 PT je Woche netto (4.5 mit Zuschlag, 13.4) | erfüllt: alle Pakete I0 bis I2 (ohne I2-07) und beide Pool-Pakete vor M2 zusammengeführt (rund 38.25 PT, siehe unten) | gemergte Pull Requests bis #264 | nichts |
| 3 | Kontingent in den Kalenderwochen 47 und 48 höchstens 80 % ohne Ausweichen auf Sonnet | erfüllt (A, von Tim am 28.11. bestätigt): Fenster 17.11. bis 24.11. zuletzt gemessen am 22.11. um 10 Uhr bei 68 % (alle Modelle; Fable allein 84 %, ohne Projektrolle auf Fable); Fenster 24.11. bis 1.12. (KW 48) am 28.11. bei 2 %; kein Ausweichen auf Sonnet. (A) Massgebend ist das Wochenkontingent aller Modelle; die Fable-Grenze ist eine Teilgrenze eines Modells | `get_usage` | nichts; KW 48 zählt für M0 weiter |
| 4 | Tims Ist-Zeit im November höchstens 115 % des Plans (13.3; Plan rund 48 h) | **erfüllt (Stand 28.11.):** Tim meldet 50 h, das sind 104 % von 48 h | Tim im Chat 28.11.2026 | nichts |
| 5 | im Mittel höchstens 1.5 Nachbesserungsrunden je Paket | erfüllt: 49 Runden auf 104 umgesetzte Pakete = 0.47 (A) | Labels `runde-1` und `runde-2` auf geschlossenen Issues der Klassen `routine`, `fachlogik`, `kern` (Abschluss «completed») | nichts; Zählung für M0 am 15.12. |
| 6 | Referenzdatei Düngerrechner und `tueten_referenz.csv` liegen vor | **erfüllt (Stand 28.11., #273):** `tests/golden/duengerrechner_referenz.csv` mit `REFERENZ_HASH_RECHNER`; `data/eval/tueten_referenz.csv` (Tims Datei vom 4.11., 3 Tüten) mit `REFERENZ_HASH_TUETEN` (Entscheid 0031) | `git ls-files`, `gh variable list`, Job `referenz-hash` | nichts |

(A) Zählweise Bedingung 5: `runde-1` zählt eine Runde, `runde-2` zwei, auch ohne `runde-1`. Pull Requests mit denselben Labels sind nicht zusätzlich gezählt; nicht umgesetzte Issues (I2-07 #39) und offene Issues zählen nicht.

## Durchsatz (Bedingung 2)

| Block | PT netto laut `pakete.md` | zusammengeführt bis |
|---|---|---|
| I0 und DS-01 | 9.25 | 4.11. |
| I1a | 7.5 | 5.11. |
| I1b inkl. Folgepakete I1b-08 und I1b-09 | 9.75 | 7.11. |
| I2 ohne I2-07 (geschlossen, Entscheid 0014) | 10.75 | 7.11. |
| Pool Wechselblock (#139) | 0.5 | 8.11. |
| Pool eigene wiederkehrende Aufgaben (#249, Entscheid 0030) | 0.5 | 21.11. |
| **Summe** | **38.25** | |

Seit dem 14.11. kamen Pakete ausserhalb der Summen dazu (Navigation N1 bis N4, Usability UX1 bis UX8, Erntekalender UC15, W0-Runden 11 bis 13, Konzept v1.7 bis v1.11, Prüftor #251).

Das Fenster der Messung in `pakete.md` (14.11. bis 30.11.) liegt nach der tatsächlichen Arbeit; der Durchsatz ab 1.11. liegt mit rund 38.25 PT in gut einer Woche ein Vielfaches über 3.6 PT je Woche (A).

## Folgerung für November und Dezember (Stand 8.11.2026)

- Die Entwicklung bis M2 ist abgeschlossen. Bis zum Testbetrieb (7.1.2027) bleiben Abnahmen am Honor (#144), Fehlerbehebungen und die Inbetriebnahme der Anlage R.
- Bedingung 3 ist die einzige, die der Lead selbst gefährden kann. Darum in den Wochen 47 und 48 (16. bis 29.11.) nur Fehlerbehebungen und kleine Routine-Pakete, Ziel höchstens 60 % je Wochenfenster; der Verbrauch kommt in jeden Statuskommentar.
- M0 (15.12.) verlangt dasselbe für die Wochen 47 bis 50 (bis 13.12.) und zusätzlich: Push an 5 Tagen in Folge, KI 3 von 3 Tüten (Entscheid 0009 erfüllt), Backup mit Wiederherstellungsprobe (I0-11), W0-Teilfreigabe der ersten Runde (Tim).
- Push an 5 Tagen (#116) steht in #144 unter «ab Testbetrieb», M0 verlangt ihn aber bis 15.12. Die Sammel-Push geht nach `supabase/functions/push-taeglich/kern.ts` auch mit leerer Aufgabenliste hinaus, braucht aber eine Zeile `einstellung` (Push-Zeit), die unabhängig von einer Anlage ist (A, aus dem Code gelesen). Der Lead spielt die Schritte gegen den Datenstand der Produktion durch und schickt sie Tim, damit die 5 Tage vor dem 15.12. liegen.
