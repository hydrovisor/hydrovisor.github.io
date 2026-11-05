# 0011 Kern-Pakete bis 95 % Kontingent

Datum 5.11.2026 · Entscheid von Tim · ändert Konzept 12.4 (Kern-Start) und ergänzt Entscheid 0010

**Tims Wortlaut im Chat (5.11.2026, vor dem Nachtlauf):** «Du kannst die Regel mit 50% des Wochenkontingents ignorieren, respektive du kannst diese problemlos auf 95% anpassen für alle weiteren Schritte. Diese Regel ist grundsätzlich falsch und ich gebe dir die Erlaubnis, dies auf 95% anzupassen. Ich möchte, dass du die ganze Nacht entsprechend durcharbeitest.»

**Entscheid.** Bisher durfte ein Kern-Paket nur starten, wenn mindestens 50 % des Wochenkontingents frei waren und ein 5-Stunden-Fenster begann. Das gilt nicht mehr. Ab jetzt gilt:

- Ein Kern-Paket und jeder weitere Schritt darin starten, solange **höchstens 95 %** des Wochenkontingents verbraucht sind.
- Der Beginn eines 5-Stunden-Fensters ist keine Bedingung mehr (A: Tims Auftrag «die ganze Nacht durcharbeiten»).
- Ist das 5-Stunden-Fenster voll, wartet der Lead bis zu seinem Ende und arbeitet dann weiter.
- Sind mehr als 95 % des Wochenkontingents verbraucht, beginnt der Lead kein neues Paket. Ein laufendes bringt er an einen sauberen Zwischenstand: Commit, Statuskommentar und Übergabenotiz.
- Den Verbrauch liest der Lead mit dem Werkzeug `get_usage` der Desktop-App oder mit `/usage` und schreibt ihn wie bisher ins Issue.

Unverändert gelten die Planfreigabe der Kern-Pakete durch Tim (Entscheid 0010, Punkt 3), die zwei parallelen Prüfer, der Mutationstest und die Grenze von höchstens 4 Fable-Plänen.

**Folgen.** `CLAUDE.md` (Paketablauf), `.claude/skills/umsetzen/SKILL.md` (Schritt 0.4) und `docs/plaene/pakete.md` (Regeln) verweisen auf diesen Entscheid. In der nächsten Konzeptfassung wird die Änderung in Anhang B.2 nachgetragen.

**Widerruf.** Ein Satz von Tim im Chat genügt.
