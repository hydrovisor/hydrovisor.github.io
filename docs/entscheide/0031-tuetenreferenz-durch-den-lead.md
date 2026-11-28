# 0031 Referenzdatei Tüten ins Repository durch den Lead (Ausnahme)

Datum 28.11.2026 · Entscheid von Tim · Ausnahme zu CLAUDE.md Regel 7 und Entscheid 0012 Punkt 1 («`data/eval/tueten_referenz.csv` bleibt bei Tim»)

**Tims Wortlaut im Chat (28.11.2026):** «Erledige Punkt 1. eigenständig.» Punkt 1 war: `data/eval/tueten_referenz.csv` anlegen und die Repository-Variable `REFERENZ_HASH_TUETEN` setzen (Bedingung 6 des Prüfpunkts 30.11., Konzept 13.5).

**Lage.** Tim hat die Referenz am 4.11.2026 selbst angelegt (3 Tüten: Chili Sibirischer Hauspaprika, Petersilie glatt, Tomate Balconi Red; 8 Felder je Tüte; Grundlage des Evals in Entscheid 0009). Sie lag nur auf seinem PC (OneDrive, Ordner der Tütenfotos), nicht im Repository.

**Entscheid.**

1. Die Datei kommt **unverändert** ins Repository: byte-gleich mit Tims Datei, SHA-256 `7baadb7258427c51d08204b74e7d6eeceba7be4f6a6437909548d6c6ba7330bf`. Der Lead schreibt, ergänzt oder korrigiert keinen Wert; die Datei bleibt Tims Orakel.
2. Die Sperre in `.claude/settings.json` (kein Schreiben nach `data/eval/`) bleibt bestehen, und der Lead umgeht sie nicht (wie Entscheid 0012). Tim kopiert die Datei mit einem Befehl in den Paketzweig; der Lead prüft den Hash, committet die Datei und setzt `REFERENZ_HASH_TUETEN`.
3. Die Fotos der drei Tüten bleiben bei Tim (`data/eval/fotos/` ist in `.gitignore`).

**Grenzen.** Spätere Änderungen an der Datei (z. B. mehr Tüten für den Eval mit 22 Tüten) legt wieder Tim an. Die Ausnahme gilt nur für diesen einen Stand.

**Widerruf.** Ein Satz von Tim im Chat genügt.
