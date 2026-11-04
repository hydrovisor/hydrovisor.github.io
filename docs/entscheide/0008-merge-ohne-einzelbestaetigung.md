# 0008 Merge ohne Einzelbestätigung (bis auf Widerruf)

Datum 4.11.2026 · Entscheid von Tim · ersetzt die Bestätigung je Pull Request aus `0001-merge-nach-bestaetigung.md`

**Tims Wortlaut im Chat (4.11.2026):** «Bis auf meinen Wiederruf darfst sämtliche Merge ohne mein zusätzliches Ja umsetzen. Die Qualität der vorherigen hat mir so überzeugt, dass dies nicht mehr nötig ist passe dies an.»

**Entscheid.** Der Lead führt einen Pull Request ohne Tims Ja zusammen (`gh pr merge --squash`). Vorher müssen drei Bedingungen erfüllt sein:
- Das Prüftor (`pruefstor`) ist grün.
- Der Prüfer der Rolle hat «bestanden» geurteilt.
- Abnahme 1 ist im Pull Request kommentiert.

Die Kurzzusammenfassung, was der Merge auslöst, schreibt der Lead weiterhin in den Pull Request. Nach dem Merge meldet er Tim das Endprodukt kurz im Chat.

**Unverändert bei Tim:**
- **Produktion:** die Freigabe von `deploy.yml` in der Umgebung `production`. Daran hängen die Produktions-Migration und die Edge Functions.
- **Secrets und Schlüssel:** Secrets, VAPID-Schlüssel und Vault-Einträge (CLAUDE.md Regeln 2 und 3).
- **Anmeldungen.**
- **Endgültiges Löschen und Force-Push.**
- **Abnahme 2** am Gerät.

**Widerruf.** Ein Satz von Tim im Chat genügt. Danach gilt wieder `0001-merge-nach-bestaetigung.md`.

**Folgen.** Angepasst sind CLAUDE.md Regel 1, der Paketablauf in CLAUDE.md, der Skill `/umsetzen` Schritt 7.5 und die Pull-Request-Vorlage. Die Sperren bleiben unverändert: kein Push auf `main`, kein Force-Push, kein `supabase db push` und kein `supabase link`.
