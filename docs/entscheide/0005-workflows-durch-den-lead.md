# 0005 Workflows startet der Lead

Datum 1.11.2026 · Entscheid von Tim im Chat («Du kannst zukünftig die Workflows auch selbst starten. Ich bestätige dir aber die Abnahme am Schluss weiterhin.») · ersetzt in `CLAUDE.md` Regel 4 das Verbot von `gh workflow run`

**Lage.** Bis hier durfte nur Tim einen Workflow von Hand starten (`CLAUDE.md` Regel 4, Deny-Regel in `.claude/settings.json`, Sperr-Hook `.claude/hooks/sperre.mjs`). Im Paket I0-02 musste Tim die Rückfall-Probe deshalb zweimal selbst über «Run workflow» auslösen, obwohl der Lauf nichts tut, was nicht ohnehin durch einen Merge geschieht.

**Entscheid.**
- Der Lead startet Workflows des Repositorys selbst mit `gh workflow run` (z. B. `deploy.yml` mit `rueckfall_probe`, `backup.yml` für einen Probelauf) und verfolgt sie mit `gh run watch`.
- Unverändert bleiben die Schutzmechanismen in GitHub: Migration, Seed und Edge Functions laufen nur nach Tims Freigabe in der Umgebung `production`; die Umgebungen `production`, `github-pages` und `backup` erlauben nur `main`; `deploy.yml` läuft nur auf `main`.
- Unverändert bleiben Regel 1 (Merge nur nach Tims «Ja» zu einer Kurzzusammenfassung) und die Abnahme: Tim bestätigt Abnahme 1 und 2 am Schluss; der Lead trägt sie nach Tims Wort als Kommentar ein.
- Unverändert bleiben die übrigen Sperren (Push auf `main`, Force-Push, `supabase db push`, `supabase link`, `--linked`, fremde Projekt-Referenzen).

**Umsetzung.** `CLAUDE.md` Regel 4 und Abschnitt «Sperren» (Lead). Deny-Regeln `gh workflow run` in `.claude/settings.json`, Abfrage in `.claude/hooks/sperre.mjs` und der Fall im Hook-Test `.claude/hooks/sperre.test.mjs` entfernt Tim selbst, weil der Agent diese Dateien nicht schreiben darf (Patch vom Lead, im Pull Request angewendet).

**Nachtrag 4.11.2026.** Abgelöst durch Entscheid 0008 (Merge durch den Lead) und Entscheid 0010 (Abnahme 1 durch den Lead, selbständiges Arbeiten), bis Tim widerruft. Nach einem Widerruf gilt wieder dieser Entscheid.
