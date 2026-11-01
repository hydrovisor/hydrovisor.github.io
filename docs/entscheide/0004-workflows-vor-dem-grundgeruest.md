# 0004 Workflows vor dem Grundgerüst

Datum 1.11.2026 · Entscheid des Leads in Auftrag 3 (A), von Tim mit dem Pull Request abzunehmen · Quelle: Konzept v1.2 12.6, 16.3

**Lage.** Auftrag 3 legt `pr.yml`, `deploy.yml` und `backup.yml` an, bevor es App-Code (`package.json`), eine Datenbank (`supabase/config.toml`) oder Edge Functions gibt; diese entstehen erst in I0-01 und I0-03.

**Entscheid.**
- `pr.yml` bestimmt im Job `vorhanden`, was es gibt, und überspringt die übrigen Jobs, bis die Dateien existieren. Die Regeln ohne Code (test.only, Schnappschüsse, Testdatei-Wächter, Referenzdatei-Hash, db-lock) laufen immer. Der Job `pruefstor` fasst alles zusammen und ist der einzige Pflichtcheck im Ruleset; übersprungene Jobs zählen als bestanden, gescheiterte oder abgebrochene nicht.
- `deploy.yml` baut und veröffentlicht die Pages erst, wenn `package.json` existiert; Migration, Seed und Edge Functions laufen nur bei Änderungen unter `supabase/`, `data/` oder `scripts/seed*` und nur nach Tims Freigabe in der Umgebung `production`. Die Produktions-Referenz steht nur in der Repository-Variable `SUPABASE_PROJECT_REF_PROD`, nie im Repository.
- `backup.yml` endet mit einer Warnung, solange die Umgebung `backup` keine Secrets hat. Die Storage-Kopie und der Risikotest BYPASSRLS werden mit I0-11 scharf; die Variable `BACKUP_MIT_RLS = true` schaltet auf den Rückfall mit Lese-Policies (Erratum E7).
- Die Skripte, auf die die Workflows verweisen (`scripts/ak-abdeckung.mjs`, `playwright.rauchtest.config.ts`, `npm run seed`, `scripts/backup-storage.mjs`), liefern I0-01, I0-02, I0-05 und I0-11. Bis dahin sind die zugehörigen Schritte übersprungen oder melden eine Warnung.

**Tims Handgriffe danach:** im Ruleset `main-schutz` den Statuscheck `pruefstor` als Pflicht setzen; Repository-Variablen `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`, `SUPABASE_PROJECT_REF_PROD` und später `REFERENZ_HASH_RECHNER`, `REFERENZ_HASH_TUETEN`; Umgebung `backup` mit den vier Secrets.
