# 0016 Usability-Befragung nur im Claude-Chat

Datum: 11.11.2026 · Entschieden von Tim (im Chat der Lead-Sitzung, Entscheid A zum Vorschlag `docs/entwurf/usability_pruefung.md`) · Issue #159 · Konzept v1.6, Erratum E11

## Ausgangslage

Tim hat am 11.11.2026 verlangt, die Usability über die Regelprüfung mit Playwright hinaus zu prüfen («visuelle Darstellungen, Haptik, Ansprechung der Buttons […] Menüführungspunkte, Prozessvereinfachungen»). Der Lead hat vier Ebenen vorgeschlagen: U1 automatisch (Honor-Simulation), U2 Expertenprüfung, U3 Aufgabentest am Honor mit der Single Ease Question (SEQ) und U4 die System Usability Scale (SUS). U3 und U4 brauchen Antworten von Tim auf Fragebögen.

## Entscheid

Tim: «Ich bin mit einem Veränderungen einverstanden. Ich möchte einzig keinen manuellen Fragebogen ausfüllen. Du kannst mir die Fragen jeweils hier direkt stellen. Und ich gebe dir dann die Antworten. Heisst, ich möchte, wenn dann, eine digitale Befragung hier im Chat sicherstellen.»

- U1 bis U4 stehen im Konzept v1.6 (6.3, 12.5, 12.6, 14.5, Erratum E11).
- **SEQ und SUS fragt der Lead im Claude-Chat ab.** Er stellt jede Frage einzeln: SEQ nach jeder Kernaufgabe («Wie leicht oder schwer war die Aufgabe?», 1 sehr schwer bis 7 sehr leicht), SUS mit den zehn Aussagen in deutscher Fassung (je 1 trifft gar nicht zu bis 5 trifft voll zu). Tim antwortet mit der Zahl, auf Wunsch mit einem Satz dazu.
- Der Lead rechnet aus (SUS: bei ungeraden Aussagen Antwort − 1, bei geraden 5 − Antwort, Summe × 2.5) und hält Antworten, Ergebnis und Datum im zugehörigen Issue und in `docs/entwurf/usability_befunde.md` fest.
- **Kein Formular, kein Papier, keine Maske in der App.** Es gibt dafür weder eine Tabelle noch eine Seite in Hydrovisor.
- Termine (Konzept 13.1): U3 vom 2. bis 7.1.2027 und um den 21.1.2027, U4 am 31.1. (M2) und 31.3. (Datenschluss). Der Lead erinnert Tim zum Termin und beginnt die Befragung selbst.
- Die Bildschirmaufnahme des Aufgabentests (mit Tims Stimme) bleibt bei Tim; ins Issue und ins Repository kommen nur Zeiten, Fehler, Berührungen, SEQ und Stolpersteine (CLAUDE.md Regel 6).

## Abwägung

- **Befragung im Chat** (gewählt): kein Aufwand für Formulare; die Antworten landen direkt beim Lead, der sie auswertet und ablegt; Tim antwortet am Gerät oder am PC.
- **Formular in der App oder online** (verworfen): Tim will keinen Fragebogen ausfüllen; eine Maske bräuchte Tabelle, RLS und Tests für vier Befragungen.
- **Papier** (verworfen): Übertragen von Hand, fehleranfällig.
- Grenze: Die Befragung durch den Lead ist nicht anonym, und Tim ist zugleich Auftraggeber und einziger Nutzer; die Arbeit nennt das als Grenze (Konzept 14.5, Einzelfall).
