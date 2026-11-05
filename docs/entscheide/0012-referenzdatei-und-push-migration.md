# 0012 Referenzdatei Rechner und Push-Migration durch den Lead (Ausnahme)

Datum 5.11.2026 · Entscheid von Tim · Ausnahme zu CLAUDE.md Regeln 2 und 7 und Entscheid 0010, Punkte 2 und 3

**Tims Wortlaut im Chat (5.11.2026, vor dem Nachtlauf):** «Die Referenzdatei für den Rechner, hier gebe ich dir sämtliche Berechtigungen. Das kannst du entsprechend eigenständig umsetzen. Und den I1B-06-Push gebe ich dir ebenfalls die Berechtigung. Merke dir das und trage dies ein. Du kannst in diesem Ausnahmefall die entsprechende Freigabe für mich umsetzen. Wenn du dies selbst umsetzt, gib mir morgen grundsätzlich ein Briefing.»

**Entscheid.**

1. **Referenzdatei Rechner** (`tests/golden/duengerrechner_referenz.csv`):
   - Der Lead darf die Datei anlegen und dazu die Repository-Variable `REFERENZ_HASH_RECHNER` setzen.
   - Grundlage sind die durchgerechneten Beispiele des Konzepts (R4.x), nicht der Code des Rechners. So bleibt die Datei ein unabhängiges Orakel.
   - Die Sperre in `.claude/settings.json` verbietet dem Agenten weiterhin, in `tests/golden/` zu schreiben, und `.claude/settings.json` ändert nur Tim (Regel 7, Entscheid 0010 Punkt 7). Der Lead umgeht diese Sperre nicht. Er legt die fertige Datei als Entwurf unter `docs/entwurf/` ab und nennt Tim den einen Befehl zum Kopieren, oder Tim hebt die Sperre für diesen Pfad selbst auf.
   - `data/eval/tueten_referenz.csv` bleibt bei Tim.
2. **Paket I1b-06 Push mit Migration:**
   - Der Lead darf ausnahmsweise den Lauf von `deploy.yml` in `production` freigeben, der die Migration dieses Pakets einspielt.
   - Bedingungen: Die Migration ist additiv, sie ist in `hydrovisor-dev` erprobt, das Prüftor ist grün, und `backup.yml` lief vorher erfolgreich.
   - Im Freigabekommentar nennt der Lead diesen Entscheid.
   - Für alle anderen Migrationen gibt weiterhin Tim frei.
3. **Briefing:** Setzt der Lead einen der beiden Punkte selbst um, erhält Tim am Morgen ein kurzes Briefing für den Product Owner: höchstens eine A4-Seite, nicht technisch, mit Ergebnissen sowie kritischen und offenen Punkten.

**Unverändert:** Schlüssel, Secrets und VAPID bleiben bei Tim und sind technisch gesperrt. Ebenso der direkte Zugriff auf das Produktionsprojekt und die Sperren.

**Widerruf.** Ein Satz von Tim im Chat genügt.
