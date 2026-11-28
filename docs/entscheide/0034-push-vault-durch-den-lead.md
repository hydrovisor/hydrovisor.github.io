# 0034 Vault-Einträge des Push-Cron durch den Lead über deploy.yml (Ausnahme)

Datum 28.11.2026 · Entscheid von Tim · Ausnahme zu CLAUDE.md Regel 2 («Secrets … sind Tims Handgriffe») und Plan 13 Handgriff 7

**Tims Wortlaut im Chat (28.11.2026):** «Setzte es selbst um und prüfe es selbst.» Gemeint waren die Vault-Einträge `projekt_url` und `cron_geheimnis` in der Produktion, ohne die der Cron-Job `push-taeglich` nichts aufruft.

**Lage.** Tims Bildschirmfoto von `#/push` (28.11.) zeigt seit dem 7.11. nur Test-Pushes und keine einzige Sammel-Push; «Zustellung der letzten 14 Tage» ist leer. M0-Bedingung 1 (Push an 5 Tagen in Folge, Konzept 13.5) ist damit offen (Kommentar in #116). Wahrscheinliche Ursache: Die Vault-Einträge fehlen in der Produktion (`push_cron_ausloesen()` ruft ohne sie nichts auf).

**Entscheid.**

1. `deploy.yml` erhält den Job `push-cron`, der nur mit `gh workflow run deploy.yml --ref main -f push_cron=true` startet und in der Umgebung `production` die Freigabe braucht. Er führt die Vault-Anweisungen aus `scripts/push-einrichten.ps1` aus: `cron_geheimnis` entsteht in der Datenbank (`gen_random_bytes`) und verlässt Vault nie, `projekt_url` entsteht wie im Skript aus der Repository-Variable `SUPABASE_PROJECT_REF_PROD` (streng geprüft und gleich `VITE_SUPABASE_URL`). Ein Lauf mit `push_cron` startet weder Migration noch Seed noch Pages, damit seine Freigabe nichts anderes mitfreigibt. Bestehende Einträge bleiben unverändert.
2. Der Job prüft die Kette selbst: Vault-Namen, Cron-Job, nach 6 Minuten die letzten Cron-Läufe, die HTTP-Status von `pg_net` und die Sammel-Push der letzten 14 Tage aus `v_push_zustellung`. Er gibt nur Namen, Zeitpunkte, Ja/Nein und Status aus, nie Werte (öffentliches Repository).
3. Der Lead gibt den Lauf in `production` frei und darf ihn zur Kontrolle wiederholen (der Job ist idempotent). Der Lead sieht keinen Schlüssel, liest keine Secrets und erhält keinen eigenen Zugang zur Produktion; die Sperren in `.claude/` bleiben unverändert.

**Grenzen.** Gilt nur für diese zwei Vault-Einträge. VAPID-Schlüssel (Regel 3), Supabase-Secrets und der scharfe Seed bleiben Tims Handgriffe.

**Widerruf.** Ein Satz von Tim im Chat genügt; dann wird der Job entfernt.
