# 0001 Merge auf main nach Tims Bestätigung

Datum 1.11.2026 · Entscheid von Tim · Quelle: `docs/spec/00_rueckfragen.md` W1, Konzept v1.2 (Erratum E6) 12.1 bis 12.5

**Entscheid.** In den Hauptzweig wird erst zusammengeführt, wenn Tim die Kurzzusammenfassung des Leads bestätigt hat, was der Merge auslöst. Danach führt der Lead-Entwickler zusammen (`gh pr merge --squash`). `gh pr merge` steht deshalb in `permissions.allow` von `.claude/settings.json` statt in `permissions.deny`.

**Kurzzusammenfassung enthält:** geänderte Dateien und Bereiche; ausgelöste Workflows (`deploy.yml` mit Migration und Freigabe in `production`, Pages, Rauchtest; `backup.yml`); Wirkung auf Supabase (Dev, Produktion) und die Vorschau; Folgen für andere Zweige.

**Bleibt gesperrt:** Push auf `main`, Force-Push, `supabase db push`, `supabase link`, jede Projekt-Referenz ausser `hydrovisor-dev` (Deny-Regeln und Hook `.claude/hooks/sperre.mjs`). Produktions-Migration, Secrets und VAPID-Schlüssel bleiben Tims Handgriffe.

**Nachtrag 4.11.2026.** Abgelöst durch Entscheid 0008 (Merge durch den Lead), bis Tim 0008 widerruft. Danach gilt wieder dieser Entscheid.
