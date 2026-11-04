# 0007 Seed: Ladeskript, Ziele und [SQL]-Tests

Datum 3.11.2026 · Entscheid des Lead im Paket I0-05 (#10, Plan `docs/plaene/10.md`) · ergänzt Entscheid 0006 und `03_import_w0.md` Abschnitt 8

**Lage.** Der Seed muss in einer Transaktion je Lauf laden, versionieren und zählen (8.1 Regel 4, 8.2, 8.6), ohne dass dieses Paket eine Migration anlegen darf. `hydrovisor-dev` ist von GitHub-Runnern nur über die Management-API erreichbar (Entscheid 0006, Nachtrag), lokal hat der Agent kein Passwort für dev, und der MCP-Server liest nur. Die Produktion lädt nur `deploy.yml` nach Tims Freigabe (Annahme 6).

**Entscheid.**
- Reine Logik (CSV, Validator V1 bis V13 mit Gegenprobe, Umrechnung, Teilfreigabe, Abbildung, Seed-Konstanten) liegt in `src/domain/w0/`. `scripts/seed/ladeskript.ts` erzeugt daraus **einen SQL-Text**: Daten als JSON-Literal im Dollar-Quoting mit geprüftem Tag, Vergleich, Schliessen (`gueltig_bis`), Einfügen, Ereignisse `sollwert_geaendert` und Zähltest mengenbasiert in SQL. Keine Datenbankfunktion, kein Update fachlicher Spalten, kein Löschen.
- Der Seed schreibt als `postgres` (Eigentümer der Tabellen, RLS greift nicht); das ersetzt die «Service-Rolle» aus 8.1 mit gleicher Wirkung.
- Ziele: `lokal` über `DB_URL` aus `supabase status -o env`, nur `127.0.0.1` oder `localhost`; `dev` nur im Workflow `.github/workflows/dev-seed.yml` (Umgebung `dev`, nur `main`, Ziel fest, aus einem Paketzweig nur `data/`), den der Lead startet (Entscheid 0005); `produktion` nur in `deploy.yml`.
- In der Produktion läuft der Seed bis zum Scharfschalten nur als **Trockenlauf** (`--trocken`: Ausführung mit Rollback, Bericht in der Job-Zusammenfassung). Scharf schaltet ein eigenes Paket nach dem ersten grünen Trockenlauf und der W0-Teilfreigabe; der Merge dieses Pakets löst deshalb nur die Freigabe in `production` mit Trockenlauf aus, keine Schreibwirkung.
- Fehlt eine W0-Datei ganz, entfällt ihr Schritt (Bericht, Exit 0); erst `--gesamtfreigabe` bricht ab. Ohne `art.csv` lädt der Seed keine Sorten.
- Die [SQL]-AK des Seeds (Zähltest, Idempotenz, Versionierung, Teilfreigabe, Abbruch) prüft **Vitest gegen die lokale Datenbank** (`tests/seed/`, `npm run test:seed`, Bericht `reports/vitest-seed.json` im Artefakt `bericht-db`), weil der Lader in TypeScript läuft und keine Datenbankfunktion für pgTAP besteht. Geprüft wird nur über SQL-Abfragen auf Tabellen und Sichten. Abweichung von `06_tests.md` Abschnitt 1 («SQL = pgTAP») für dieses Paket.

**Verworfen.** Datenbankfunktion `seed_laden(jsonb)` (bräuchte eine Migration und Rechte-Entzug, Paket ohne Migration); Seed über den MCP-Server (schreibt nicht); eigenes dev-Datenbankpasswort als Secret (Tims Handgriff); `psql` als Client (unter Windows nicht sicher vorhanden).

**Folgen.** Neue devDependency `postgres` (postgres.js, exakt angeheftet). Ändert W0 eine `quelle` oder `kulturgruppe`, bricht der Lauf ab (keine Versionsspalten); dann neue `quelle_id` oder eigenes Paket mit Migration.

**Nachtrag 4.11.2026.** Die Freigabe in `production` gibt nach Entscheid 0010 der Lead, wenn der Deploy die Produktionsdatenbank nicht verändert (keine Migration, Seed noch trocken). Mit Migration oder scharfem Seed bleibt sie bei Tim.
