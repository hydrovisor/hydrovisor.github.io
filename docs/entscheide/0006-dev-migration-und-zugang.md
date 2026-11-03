# 0006 Migrationen nach hydrovisor-dev und Zugang ohne Handgriff

Datum 3.11.2026 · Entscheid des Lead im Auftrag von Tim (Chat: «Löse das Problem ohne mein Eingreifen und setze die weiteren Schritte um.»; zuvor «Du kannst den merge und die freigabe direkt selbst bestätigen. Ich erlaub dies.») · ergänzt `CLAUDE.md` Regel 4 und Entscheid 0005

**Lage.** Im Paket I0-03 liess sich das Datenmodell nicht nach `hydrovisor-dev` bringen: Der MCP-Server `supabase` liest, aber jede schreibende Anweisung (`apply_migration`, `execute_sql` mit DDL) kam als «declined» zurück, weil die App die Bestätigungsrückfrage des Servers ablehnt. Ein lokaler `db push` ist gesperrt (Regel 4). Zusätzlich hätte Tim seine Zeile in `public.zugang` der Produktion von Hand im SQL-Editor anlegen müssen (Konzept 11.6).

**Entscheid.**
- `hydrovisor-dev` migriert der Workflow `.github/workflows/dev-migration.yml`: nur `workflow_dispatch`, nur von `main`, Ziel fest `jalvmzgvxvidgmoxuglp`, Eingabe `zweig` (nur `main` oder `paket/<issue>-<kurz>` dieses Repositorys; daraus nur `supabase/migrations`, Konfiguration immer aus `main`) und `trockenlauf` (Standard ja). Er nutzt das Access-Token der Umgebung `production`; jede Ausführung braucht deshalb die Freigabe dieser Umgebung. Der Lead startet ihn (Entscheid 0005) und gibt Läufe von `dev-migration.yml` selbst frei; vorher prüft er im Lauf, dass es `dev-migration` ist.
- Die Produktion migriert weiterhin nur `deploy.yml`. Der Agent führt `supabase db push`, `link` und `--linked` nie selbst aus; der Sperr-Hook bleibt unverändert.
- Tims Zugang entsteht durch die Migration `20261103160000_zugang_einziges_konto.sql`: Sie legt die Zeile nur an, wenn in `auth.users` genau ein Konto besteht (Registrierung in dev und Produktion gesperrt). Bei keinem oder mehreren Konten wirkt sie nicht, dann bleibt der Handgriff aus Konzept 11.6. Keine Adresse, keine Nutzer-ID im Repository.
- Merge (Regel 1) und Freigabe von `deploy.yml` in `production` (Regel 2) bleiben Tims Handgriffe. Überlässt Tim sie im Chat ausdrücklich für einen bestimmten Pull Request, setzt der Lead genau diesen Merge und den zugehörigen Deploy-Lauf mit Vermerk im Pull Request um; die Erlaubnis gilt nicht weiter (Befund Sicherheit 3: Pflicht-Reviewer von `production` ist das Konto des Agenten).
- Die Zugangs-Migration zählt nur nicht-anonyme Konten und wirkt nur, solange `zugang` leer ist.
- Später, wenn Tim ein Token nur für dev anlegt: eigene Umgebung `dev` mit Branch-Regel `main` für `dev-migration.yml` (trennt dev- und Produktions-Freigaben).

**Nachtrag 3.11.2026.** Der erste Lauf scheiterte: `supabase db push --remote=<ref>` verbindet direkt über IPv6, das GitHub-Runner nicht haben, und verlangt sonst die Pooler-Adresse mit Passwort. Der Workflow spielt deshalb über die Management-API ein (`scripts/dev-migration.mjs`, `POST /v1/projects/{ref}/database/query`, je Datei eine Transaktion mit dem Eintrag in `supabase_migrations.schema_migrations`); Skript und Ziel kommen aus `main`.

**Nachtrag 2.** Das Token der Umgebung `production` hat keine Rechte für `hydrovisor-dev` (Management-API 403, Lauf 41655308167). Der Workflow nutzt deshalb die eigene Umgebung `dev` (nur `main`, ohne Pflicht-Reviewer) mit dem Secret `SUPABASE_ACCESS_TOKEN` für dev, das Tim einmal anlegt; Freigaben für dev und Produktion sind damit getrennt.

**Verworfen.** Kontoweiter Supabase-Connector (erreicht die Produktion, Regel 4); eigenes Secret für die dev-Datenbank (Tims Handgriff, den er vermeiden will); Trigger «erstes Konto wird Tim» (dauerhafte Regel, ein versehentliches Konto würde Eigentümer).

**Umsetzung.** Pull Request zu #9 mit Workflow, Migration, pgTAP `08_zugang_migration.test.sql` und Nachführung von `CLAUDE.md`.
