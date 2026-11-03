# Plan 9: I0-03 Datenmodell mit Zugriffsregeln

Stand 3.11.2026 · Paket I0-03 · Klasse Kern · Plan B im Vergleich nach Konzept 12.7 a (Verfasser verdeckt) · Planfreigabe nötig (Label `plan-frei`)

## Ziel

Nach dem Paket besteht die Datenbank aus `docs/spec/02_datenmodell.sql` als erste Migration in lokal, `hydrovisor-dev` und (nach Tims Freigabe) in der Produktion: 49 Tabellen, 30 Sichten, Trigger, Funktionen, RLS über `ist_tim()` auf jeder Tabelle, privater Bucket `saattueten`. pgTAP beweist im Prüftor Zugriff, Eindeutigkeit, Checks, Sichten, Caches und Auswertung; `src/daten/datenbank.types.ts` liefert den Typvertrag für `schreiben()` (I0-04) und alle folgenden Pakete. Am Gerät ändert sich nichts Sichtbares; die App meldet sich weiterhin an.

## Ausgangslage

- Es gibt noch kein `supabase/`; `pr.yml` schaltet die Jobs `db` (supabase start, db reset, `supabase test db | tee reports/pgtap.txt`, Typen-Abgleich, Seed-Platzhalter) und die Datenbankteile von `e2e` ein, sobald `supabase/config.toml` existiert. `deploy.yml` führt nach dem Merge `supabase db push --db-url` in der Umgebung `production` mit Tims Freigabe aus und zieht den Tag `letzte-migration` nach.
- `scripts/ak-abdeckung.ts` liest TAP-Zeilen `ok N - <Name>` / `not ok N - <Name>` aus `reports/*.txt`; der Name muss die AK-Nummer als eigenes Wort enthalten.
- Die E2E aus I0-06 bilden Auth mit `page.route` gegen `http://127.0.0.1:54321` nach (Nutzer `tim@example.test`, feste UUID); sie brauchen keine Zeile in der Datenbank.
- Der Entwurf `02_datenmodell.sql` ist zweimal gegen PostgreSQL 17 mit Stubs geprüft (`docs/spec/pruefung/`): alle Smoke-Fälle grün. Er enthält die Annahmen A1 bis A11, die Befunde C1 bis C13 und D1 bis D5 sind eingearbeitet.

## Entscheide (mit verworfener Alternative)

| Nr. | Entscheid | Verworfene Alternative |
|---|---|---|
| E1 | **Zwei Migrationsdateien:** `…_datenmodell.sql` (Abschnitte 0 bis 8 des Entwurfs, unverändert bis auf die unten genannten Ergänzungen) und `…_storage_saattueten.sql` (Bucket und Storage-Policies). | Eine Datei für alles: ein Fehler beim Bucket (Rechte auf `storage.objects` in der Produktion, A5) würde die 49 Tabellen mit zurückrollen; drei Dateien je Bereich bringen beim ersten Stand keinen Nutzen. |
| E2 | **Entwurf wörtlich übernehmen**, Abweichungen nur als Liste in diesem Plan (Abschnitt «Abweichungen»); keine stillen Verbesserungen durch den Datenbank-Agenten. | Entwurf beim Übertragen «aufräumen»: hebt die zweimalige Prüfung von Auftrag 2 auf und macht den Plan-Code-Abgleich unmöglich. |
| E3 | **`ist_tim()` über die Tabelle `zugang`**, deren einzige Zeile ausserhalb des Repositories entsteht: lokal durch `supabase/seed.sql` (Testkonto mit fester UUID und Platzhalter-Adresse `tim@example.test`, wie die E2E), in `hydrovisor-dev` durch den Lead über den MCP-Server (`insert … select id from auth.users`, Bedingung genau ein Konto; die Adresse wird nie gelesen oder geschrieben), in der Produktion durch Tim im SQL-Editor (Handgriff H3). | Trigger «erstes Konto in `auth.users` wird Tim»: macht ein versehentlich angelegtes Konto zum Eigentümer; Konzept 11.6 verlangt die Zeile von Hand. Prüfung über die E-Mail-Adresse in der Funktion: Personendatum im Repository (Annahme 12). |
| E4 | **pgTAP-Dateien selbständig**: jede Datei `begin; create extension if not exists pgtap with schema extensions; select plan(n); … select * from finish(); rollback;` mit eigenen Fixtures und eigenen Testkonten (`…000a` Tim, `…000b` fremd) in `auth.users`; keine Hilfsdatei, keine Abhängigkeit vom Seed. | Gemeinsame Fixture-Datei per `\ir`: der Einbindepfad im pg_prove-Container der CLI ist nicht garantiert; Fixtures in einer Migration würden in die Produktion gelangen. |
| E5 | **Bericht für die AK-Abdeckung:** `supabase test db` bleibt das Tor (pg_prove prüft Plan und Ergebnis); zusätzlich schreibt `scripts/pgtap-bericht.sh` dieselben Dateien mit `psql -qtAX -v ON_ERROR_STOP=1` nach `reports/pgtap.txt`, damit die TAP-Zeilen mit Testnamen sicher im Bericht stehen (A1: zeigt `supabase test db` die Zeilen bereits, entfällt das Skript). | Nur auf die Ausgabe von `supabase test db` vertrauen: pg_prove druckt ohne `--verbose` nur eine Zeile je Datei, die CLI reicht keine Flags durch; dann fände das Skript kein [SQL]-AK. |
| E6 | **Supabase-CLI-Version anheften** (`supabase/setup-cli` mit fester Version in `pr.yml` und `deploy.yml`, lokal `npx supabase@<Version>`), weil die erzeugten Typen byteweise verglichen werden. | `version: latest` beibehalten: ein CLI-Update ändert das Typformat und bricht den Typen-Abgleich ohne Codeänderung. |
| E7 | **Generierte Typdatei von Prettier und ESLint ausnehmen** (`.prettierignore`, `eslint.config.js` `ignores`), weil sie byteweise der CLI-Ausgabe entsprechen muss. | Datei nach dem Erzeugen formatieren: der Abgleich im Job `db` scheitert dann immer. |
| E8 | **`security definer` ohne eigene Prüfung:** `EXECUTE` entzogen für `public`, `anon`, `authenticated` (und bei `backup_status_melden` auch `service_role`), wie im Entwurf; `ist_tim()` und `wissen_app_schreiben()` bleiben für `authenticated` ausführbar (Policies bzw. eigene Prüfung), `wissen_app_schreiben()` zusätzlich für `anon` entzogen; Trigger-Funktionen sind nicht direkt aufrufbar und brauchen keinen Entzug. Ein generischer pgTAP-Test über `pg_proc` erzwingt die Regel für jede künftige Funktion. | Entzug für alle `security definer`-Funktionen einschliesslich `ist_tim()`: die Policies laufen als `authenticated` und könnten `ist_tim()` nicht mehr auswerten. |
| E9 | **Trigger `etikett_code_fest`** ergänzen (`before update on etikett`, Fehler bei geändertem `code`), weil `06_tests.md` Abschnitt 9 «Etikett-Code unveränderlich» verlangt und der Entwurf es nur im Kommentar nennt (Abweichung Ab-7). | Nur per RLS verhindern: Tim darf Etiketten ändern (`gedruckt_am`), ein Spaltenverbot geht nur mit Trigger. |
| E10 | **Migration nach `hydrovisor-dev`** durch den Lead über den MCP-Server (`apply_migration` mit dem Inhalt der beiden Dateien) nach dem Prüferurteil und vor Abnahme 1. | Supabase-Branching je Pull Request: nicht eingerichtet, kostet; `supabase db push` ist für den Agenten gesperrt. |
| E11 | **Rückweg** als eigene Migration `…_rueckbau_datenmodell.sql` (Drop aller Objekte in umgekehrter Reihenfolge, Policies und Bucket), nur solange keine Daten bestehen (bis I0-05); jede Migrationsdatei läuft bei `supabase db push` in einer Transaktion, einen Teilzustand gibt es nicht. | Rückweg per `drop schema public cascade` von Hand: nicht in der Migrationshistorie, nicht wiederholbar. |
| E12 | **`supabase/seed.sql` minimal** (zwei lokale Testkonten ohne Passwort, Zeile in `zugang`); Startdaten (Messgerät, Konstanten, Fenster) bleiben I0-05, Demo-Daten I0-10. | Startdaten schon hier: vermischt Paketgrenzen, die Validator-Logik fehlt noch. Konto mit Passwort: ein Passwort im Repository, auch lokal, löst den Sicherheitsprüfer aus; die lokale Anmeldung braucht erst I0-04 (TO2). |
| E13 | **Storage-Policy `saattueten_tim for all`** wie im Entwurf (lesen, hochladen, ersetzen, entfernen nur für Tim im Bucket). | Nur `select` und `insert`: ein abgebrochener Upload liesse sich nicht ersetzen; Fotos tragen keine fachliche Historie, «die App löscht nie» gilt für Tabellen. |
| E14 | **Abnahme 1 ohne Maske:** pgTAP-Bericht im Pull Request, Prüferurteile, Tabellen und Policies im Dashboard von `hydrovisor-dev`, Anmeldung in der Vorschau weiterhin möglich. | Eine Hilfsmaske «Datenbankstand» bauen: Oberfläche ausserhalb des Pakets, Design System noch ohne Baustein dafür. |

## Betroffene Dateien

| Datei | neu / geändert | Inhalt | Rolle |
|---|---|---|---|
| `supabase/config.toml` | neu | aus `supabase init`; `project_id = "hydrovisor-lokal"`, `[db] major_version = 17`, `[auth] enable_signup = false` (wie dev und Produktion), `[db.seed] sql_paths = ["./seed.sql"]`, Storage an, Analytics aus | Lead |
| `supabase/migrations/20261117100000_datenmodell.sql` | neu | Abschnitte 0 bis 8 des Entwurfs (Hilfsfunktionen, Aufzählungen, `zugang` und `ist_tim()`, Anlage, Wissen, Betrieb, Trigger und Funktionen, Sichten mit `security_invoker`, RLS-Schleife), dazu Trigger `etikett_code_fest`, `revoke execute on function wissen_app_schreiben(text, jsonb) from anon`, Kopfkommentar mit Entwurfsstand; kein `create extension pgtap` | Datenbank |
| `supabase/migrations/20261117100100_storage_saattueten.sql` | neu | `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('saattueten', 'saattueten', false, 5242880, '{image/jpeg}') on conflict (id) do nothing`; Policy `saattueten_tim on storage.objects for all to authenticated using (bucket_id = 'saattueten' and public.ist_tim()) with check (…)` (A5, A6) | Datenbank |
| `supabase/seed.sql` | neu | zwei Konten in `auth.users` (`00000000-0000-4000-8000-000000000001` `tim@example.test`, `…0002` `gast@example.test`, `instance_id`, `aud`, `role`, `email_confirmed_at`, Meta-JSON, ohne Passwort) `on conflict do nothing`; `insert into public.zugang (user_id) values ('…0001') on conflict do nothing` (A4) | Datenbank |
| `supabase/tests/01_zugriff.sql` … `07_demo_loeschen_push.sql` | neu | pgTAP nach Testliste; Namen beginnen mit AK-Nummer oder Smoke-Kennung | Testentwickler |
| `tests/testentwickler.txt` | neu / geändert | die sieben pgTAP-Dateien | Testentwickler |
| `scripts/pgtap-bericht.sh` | neu | führt `supabase/tests/*.sql` mit `psql` gegen `DB_URL` aus `supabase status -o env` aus, schreibt TAP nach stdout, Exit 1 bei `not ok` oder SQL-Fehler; `PSQL` überschreibbar (lokal `docker exec`) | Lead |
| `.github/workflows/pr.yml` | geändert | Job `db`: CLI-Version fest (E6); nach `supabase test db` der Schritt `bash scripts/pgtap-bericht.sh > reports/pgtap.txt` (E5); Job `e2e`: dieselbe CLI-Version | Lead |
| `.github/workflows/deploy.yml` | geändert | CLI-Version fest (E6); sonst unverändert | Lead |
| `src/daten/datenbank.types.ts` | neu | `supabase gen types typescript --local`, unverändert eingecheckt | Lead |
| `src/daten/supabase.ts` | geändert | `createClient<Database>(…)` mit `import type { Database } from './datenbank.types.ts'` | Lead |
| `.prettierignore`, `eslint.config.js` | geändert | `src/daten/datenbank.types.ts` ausgenommen (E7) | Lead |
| `docs/betrieb/handgriffe.md` | neu | Tims Handgriffe H1 bis H5 mit den SQL-Zeilen (ohne Adresse), Rückfall Bucket von Hand | Lead |
| `docs/plaene/9.md` | neu | der gewählte Plan nach Tims Bewertung | Lead |

Nicht berührt: `src/domain/` (kein Fachcode in diesem Paket), `.claude/`, `.mcp.json`, Referenzdateien.

## Migration

**Ja**, erste Migration des Projekts, Label `db-lock` am Pull Request (kein anderer offener Pull Request mit `supabase/migrations`; DS-01 und I0-05 haben keine Migration und dürfen parallel laufen).

**Reihenfolge und Inhalt.** `…_datenmodell.sql` in der Reihenfolge des Entwurfs: Hilfsfunktion `kalendertag` → 63 Aufzählungen → `zugang`, `ist_tim()` → Bereich Anlage (12 Tabellen) → Bereich Wissen (16) → Bereich Betrieb (21) → Trigger (`wissen_nur_schliessen` auf 8 Wissenstabellen, `anlage_kuerzel_fest`, `etikett_code_fest`, `ereignis_cache`, `satz_cache_geschuetzt`, `reservierung_cache_geschuetzt`, `reservierung_vorbelegen`, `pflanzung_geloescht`) → Funktionen (`topf_neu_beschriften`, `cache_aus_ereignis`, `datenart_loeschen`, `backup_status_melden`, `ec_gesamt`, `wissen_app_schreiben`) mit `revoke`/`grant` → 30 Sichten (`security_invoker = true`) → RLS-Schleife über `pg_tables` (Wissen und Protokolle nur `select`; `messgeraet` `select` und `update`; übrige `select`, `insert`, `update`; nie `delete`). Danach `…_storage_saattueten.sql`.

**Additiv.** Es gibt keinen Vorzustand; alles ist neu, nichts wird umbenannt oder gelöscht. Spätere Änderungen folgen den Regeln aus `04_architektur.md` Abschnitt 8 (neue Spalten nullable, zwei Schritte beim Umbenennen).

**Rückweg.** E11; lokal `supabase db reset`; in `hydrovisor-dev` über MCP mit dem Rückbau-Skript; in der Produktion nur durch Tim, und nur bis Daten bestehen.

**Wirkung in der Produktion über `deploy.yml`.** Der Merge löst den Job `migration` aus (Umgebung `production`, Tims Freigabe): `supabase db push` legt beide Dateien an, `npm run seed` ist noch Platzhalter, Tag `letzte-migration` wird gesetzt; danach `pages` und Rauchtest. Bis Tim die Zeile in `zugang` anlegt (H3), liefert jede Tabelle für Tims Konto 0 Zeilen; die App liest in diesem Stand noch nichts, deshalb ohne Folge. Die Vorschau arbeitet gegen `hydrovisor-dev`, wo die Migration vorher über MCP liegt (E10).

**Zeitstempel.** Die Dateinamen tragen den Erstellungszeitpunkt; die Zahlen oben sind Platzhalter des Plans.

## Zugriff und Sicherheit

**`ist_tim()` je Umgebung.** Lokal: Seed-Konto `…0001` (ohne Passwort, Anmeldung lokal erst mit I0-04 nötig); pgTAP setzt `set local role authenticated` und `select set_config('request.jwt.claim.sub', '<uuid>', true)` (Supabase löst `auth.uid()` zuerst über `request.jwt.claim.sub`, dann über `request.jwt.claims`; A3). `hydrovisor-dev`: Lead über MCP nach dem Anlegen der Tabellen (H2). Produktion: Tim (H3). Kein Geheimnis und keine Adresse im Repository; die UUID der Produktion steht nirgends im Code.

**RLS-Folgen für spätere Pakete.**
- `schreiben()` (I0-04) schreibt als `authenticated` per Upsert auf `client_id`: braucht `insert` und `update` auf den Betriebstabellen und `select` für `returning`; alle drei bestehen. `einstellung` wird nur geändert (`update`), `push_abo` per Upsert auf `endpoint` (I0-08), beides gedeckt.
- Wissen, `zugang`, `backup_status`, `aufgabe_tagesliste`, `ki_aufruf`, `auswertung_fenster` für Tim nur lesbar; Seed (I0-05) und Edge Functions schreiben mit `service_role` (umgeht RLS), UC4 nur über `wissen_app_schreiben()`.
- Sichten mit `security_invoker`: `anon` und das fremde Konto sehen 0 Zeilen, auch über die Sichten; `v_*` werden im Bündel (I0-04) ohne eigene Policies gelesen.
- `datenart_loeschen()` nur `service_role` (`npm run demo -- --loeschen`, I0-10); `backup_status_melden()` nur `backup_leser` (Grant ist Tims Handgriff in I0-11).
- Edge Functions mit Benutzer-Token laufen als `authenticated`; `ist_tim()` wirkt dort gleich.

**Default-Privileges.** Supabase vergibt `EXECUTE` auf neue Funktionen an `anon`, `authenticated`, `service_role` und Tabellenrechte an dieselben Rollen (lokal wie gehostet, weil Migrationen als `postgres` laufen; A2). Darum: Entzug je Funktion wie E8; RLS trägt den Zugriff auf Tabellen. Ein pgTAP-Test prüft `has_function_privilege()` für jede `security definer`-Funktion in `public` ausser `ist_tim()` und `wissen_app_schreiben()` und dass jede `security definer`-Funktion `search_path` setzt.

**Storage.** Bucket privat (`public = false`), Policies mit `bucket_id` und `ist_tim()`; `anon` ohne Policy. Signierte Links (60 s) und EXIF-Entfernung sind Client-Sache (I2-05).

**Datenart echt.** Die Sichten `v_keimrate`, `v_saeurebedarf`, `v_ph_wirkung`, `v_kalibrierung_faellig` (je Datenart), `v_messung_unsicher` (je Datenart) und alle Auswertungssichten filtern `echt` bzw. trennen die Datenarten; pgTAP belegt es (C1, C4-AK3).

**Ereignisse führen.** Keine Zustandsspalten ausser den zwei Caches `satz.saatdatum` und `reservierung.umsetzen_geplant_am`, die nur `cache_aus_ereignis()` bzw. `reservierung_vorbelegen()` schreiben (Trigger `cache_geschuetzt`). Hinweise ohne Änderung: `naehrloesungsansatz.status` ist Attribut des Ansatzes nach Konzept 8.2 (Abhakliste, I1b-04); `eigene_aufgabe.letzte_erledigung` ist eine leere Hülle aus dem Pool und wird beim Ausbau durch das Ereignis `aufgabe_erledigt` ersetzt (additiv, später).

**«jetzt» als Parameter.** Keine Sicht ruft `now()`; Fälligkeiten gegen «heute» rechnet `src/domain/` mit `jetzt` und `Europe/Zurich` (I0-07, I1b-02). `now()` erscheint nur als `default` von `erfasst_am`/`gueltig_ab` und in `wissen_app_schreiben()` als Erfassungszeit (`gueltig_bis`, `bestaetigt_am` über `kalendertag(now())`).

## Schnittstellen und Datenfluss

- **Kein Modul in `src/domain/`** entsteht in diesem Paket. Vertrag für die Folgepakete: SQL `public.kalendertag(ts timestamptz) returns date` entspricht `kalendertag(zeitpunkt: Date, zeitzone: 'Europe/Zurich'): string` (ISO-Datum) in `src/domain/zeit.ts` (I0-07); beide müssen für dieselben Zeitpunkte denselben Tag liefern (Test in I0-07 mit den Werten aus TZ1 bis TZ4).
- **Typen:** `Database` aus `src/daten/datenbank.types.ts`; I0-04 definiert darauf `Erfassungstabelle = keyof Database['public']['Tables']` eingeschränkt auf Tabellen mit `client_id`, und `schreiben<T extends Erfassungstabelle>(tabelle: T, datensatz: Database['public']['Tables'][T]['Insert'] & { client_id: string }): Promise<Ergebnis>`.
- **Datenfluss:** Client (Publishable Key + Tims JWT) → PostgREST → RLS `ist_tim()` → Tabellen und Sichten (`security_invoker`) · Edge Functions und Seed → `service_role` → ohne RLS · Backup (I0-11) → `backup_leser` → nur `select`, `backup_status_melden()` · Fotos → Storage-Policies auf `storage.objects` mit `bucket_id` und `ist_tim()`.
- **Mutationstest:** entfällt (keine Module `rechner`, `zielbereich`, `aufgaben`); `npm run test:mutation` endet mit Warnung, das Label `kern` schaltet den Job trotzdem ein.

## Abweichungen zwischen `02_datenmodell.sql`, Konzept und Spezifikation

Nicht still übernommen, sondern hier benannt; Entscheid je Zeile. Fehler der Spezifikation gehen nach Tims Freigabe als Hinweis in `docs/spec/00_rueckfragen.md` bzw. als Nachführung von `02_datenmodell.sql` in einem eigenen Routine-Commit (nicht in diesem Paket).

| Nr. | Stelle | Abweichung | Entscheid |
|---|---|---|---|
| Ab-1 | Konzept 8.2 `gefaess.status`, `messung.unsicher` als Cache; Entwurf A7 ohne diese Spalten | 8.1 Regel 2 erlaubt «Sicht oder Cache»; bei einem Nutzer genügt die Sicht | Entwurf übernehmen; bleibt A7 |
| Ab-2 | Konzept 8.2 `netztopf` → `heim_gefaess`; Entwurf A2 `heim_platz_id` | `gefaess` wechselt bei Volumenänderung die Zeile, der Platz nicht | Entwurf übernehmen |
| Ab-3 | Konzept 8.2 `herkunft.vermerk` ohne `leitkultur`; Entwurf A11 ergänzt den Wert | nötig für «Prüfauftrag» aus `art_neu` (R1.3) | Entwurf übernehmen |
| Ab-4 | Konzept 8.3 `v_zielbereich(gefaess_id, zweck, datum)`, `v_leitkultur(gefaess_id)`; Entwurf A5, A6 nur «Bewertung heute» je Platz und `v_leitkultur_gewaehlt` | übrige Zwecke und die Leitkultur rechnet `src/domain/` mit `jetzt` (Konzept 7, I2-02, I2-04) | Entwurf übernehmen |
| Ab-5 | Konzept 11.6 Punkt 2 «Policy `for all`»; Entwurf getrennt `select`, `insert`, `update`, kein `delete` | `04_architektur.md` 11 und 8.1 Regel 3 «die App löscht nie» | Entwurf übernehmen |
| Ab-6 | Konzept 8.2 `kulturgruppe` ohne `ec_obergrenze_validator`; Entwurf ergänzt es (Validator 9.4) | Seed-Konstante für I0-05 | Entwurf übernehmen |
| Ab-7 | `06_tests.md` 9 «Etikett-Code unveränderlich»; Entwurf nur Kommentar an `etikett` | nicht erzwungen | Trigger `etikett_code_fest` ergänzen (E9); `02_datenmodell.sql` nachführen |
| Ab-8 | Entwurf Abschnitt 9 Storage nur als Kommentar («nur in Supabase») | Konzept 11.6 Punkt 3 verlangt Bucket und Policies | eigene Migrationsdatei (E1) |
| Ab-9 | Entwurf Kopf: «kein lauffähiger Migrationsstand»; `02` Zeile 1283 entzieht `datenart_loeschen` nicht ausdrücklich `service_role`-fremden Rollen des Storage | in Supabase ausreichend (D1 geprüft) | keine Änderung; generischer Test E8 |
| Ab-10 | `02` `wissen_app_schreiben()` behält `EXECUTE` für `anon` (Default-Privileges) | eigene Prüfung `ist_tim()` vorhanden, Aufruf als `anon` liefert «nicht erlaubt» | zusätzlich `revoke … from anon` (E8), kein Fachfehler |
| Ab-11 | Konzept 8.5 «Löschen = `delete from anlage where datenart = 'demo'`»; Entwurf A10 `datenart_loeschen()` mit Kalibrierungen, Abos, Ereignissen, Scans, pH-Kontrollen, Aufschüben | Konzept 8.5 nennt Kalibrierungen und Abos selbst als Zusatz; D4 ergänzt den Rest | Entwurf übernehmen |
| Ab-12 | `06_tests.md` 9 Zustände «Tausch setzt beide Töpfe um» und «messgeraet änderbar, nicht einfügbar» als «noch nicht geprüft» markiert | Fälle fehlen in den Smoke-Skripten | pgTAP ergänzt sie (Testliste 04 und 01) |
| Ab-13 | Issue-Zeile «Fälle aus `docs/spec/pruefung/smoke*.sql` als pgTAP» ohne Prüfart | `ak-abdeckung.ts` stuft sie als «ohne» ein (nur Warnung) | Beleg von Hand: Zuordnungstabelle Smoke-Fall → pgTAP-Name im Pull Request; Prüfer gleicht ab |

Geprüft und ohne Abweichung: Grundregeln 8.1 (Schlüssel, Zeitachsen mit `client_id`, `gilt_ab`, `nacherfasst` generiert, Versionierung mit `gueltig_bis`, Einheiten, Topfgrösse 50/80, Datenart an `anlage`, `kalibrierung`, `push_abo`, `aufschub`, `messung` bei `ph_kontrolle`), Tabellenliste 8.2 (49 Tabellen), Sichtenliste 8.3 (30 Sichten einschliesslich der elf Auswertungssichten), Annahme 12 (`telefon_vertretung` nur in `einstellung`).

## AK

| AK | Prüfart | Fundstelle | Test (Name beginnt mit der AK-Nummer) |
|---|---|---|---|
| UC0-AK2 | [SQL] | Use Cases F4 UC0 (2); Konzept 11.6 Punkt 5; `06_tests.md` 9 «Zugriff» | `01_zugriff.sql`: «UC0-AK2 RLS aktiv auf <tabelle>» (Schleife), «UC0-AK2 keine Policy mit using (true) oder für anon», «UC0-AK2 anon: 0 Zeilen oder verweigert in <tabelle/sicht>», «UC0-AK2 anon: Insert in messung/ereignis/anlage scheitert», «UC0-AK2 fremdes Konto: 0 Zeilen in <tabelle>», «UC0-AK2 fremdes Konto: Insert scheitert», «UC0-AK2 Tim sieht seine Zeile, fremdes Konto nicht», «UC0-AK2 Wissen für Tim nur lesbar (profilwert, art, sorte)», «UC0-AK2 Tim löscht nichts (0 Zeilen betroffen)» |
| UC1-AK7 | [SQL] | Use Cases F4 UC1 (7); Konzept 8.1 Regel 1 | `02_eindeutigkeit_checks.sql`: «UC1-AK7 zweite aktive Kennung 2.3 in derselben Anlage scheitert», «UC1-AK7 dieselbe Kennung in einer anderen Anlage ist erlaubt», «UC1-AK7 nach Storno ist die Kennung wieder frei», «UC1-AK7 nach aktiv = false ist die Kennung wieder frei» |
| UC4-AK6 | [SQL] | Use Cases F4 Nr. 258; Konzept 11.6 Punkt 3 | `01_zugriff.sql`: «UC4-AK6 Bucket saattueten besteht und ist privat», «UC4-AK6 Storage-Policy nur mit bucket_id und ist_tim()», «UC4-AK6 anon und fremdes Konto sehen keine Objekte und laden nichts hoch» (der [E2E]-Teil «ohne EXIF» gehört zu I2-05) |
| C4-AK1 | [SQL] | Use Cases F4 Z. 518; Konzept 8.3, 14.5 | `06_auswertung.sql`: je Auswertungssicht «C4-AK1 <sicht> beantwortet <Frage aus 14.5>» mit `has_view`, Spalten und einer Beispielzeile (Zuordnung unten) |
| C4-AK3 | [SQL] | Use Cases F4 Z. 518; Konzept 8.6 | `06_auswertung.sql`: je Auswertungssicht «C4-AK3 <sicht> zählt Demo nicht» und «C4-AK3 <sicht> zählt 31.3. 23:59, nicht 1.4. 00:00»; «C4-AK3 Termintreue ohne den Tag 1.4.» |
| Smoke-Fälle | – (Beleg von Hand) | `docs/spec/pruefung/smoke.sql`, `smoke2.sql`, `smoke3.sql`; `06_tests.md` 9 | Namen mit Smoke-Kennung (`TZ1` … `TZ4`, `C1` … `C13`, `D1` … `D5`, `S2-…` für smoke2); Zuordnungstabelle im Pull Request |

Zuordnung C4-AK1 (Sicht → Frage 14.5): `v_termintreue` → Termintreue; `v_ek6_messdauer` → EK6; `v_sollbereichsquote` → Sollbereichsquote; `v_rechnerguete` → Rechnergüte; `v_phasenprognose` und `v_keimdauer` → Phasenprognose; `v_ki_guete` → KI-Güte; `v_uebersteuerungen` → Übersteuerungen; `v_etikett_scans` → Etiketten; `v_klima` → Klima; `v_pflegezeit` → Pflegezeit. Je Sicht genau eine Frage; `v_auswertung_platz` ist Hilfssicht.

## Testliste

Alle Tests [SQL] pgTAP, je Datei selbständig (E4), Fixtures nach dem Muster der Smoke-Skripte (Anlage R echt und X demo, Platz 2.3, A1, Messgerät, Sorte Lollo, Einstellung), keine Personendaten, Zeitwerte fest (Januar bis April 2027), kein `now()` in Erwartungen ausser bei `nacherfasst` (Erwartung relativ zu `erfasst_am`).

**01_zugriff.sql** (UC0-AK2, UC4-AK6, D1, C11-Regeln)
- Zählung: 49 Tabellen, 30 Sichten in `public`; jede Sicht `security_invoker` (`reloptions`).
- Schleife `pg_tables`: `rowsecurity`; `pg_policies`: kein `qual`/`with_check` = `true`, keine Policy für `anon`/`public`, jede Policy nennt `ist_tim()`; Wissen und Protokolle ohne `insert`/`update`, keine Tabelle mit `delete`.
- `anon`: je Tabelle und Sicht 0 Zeilen oder `42501` (A2); Insert `messung`, `ereignis`, `anlage` → `42501`.
- Fremdes Konto `…000b`: 0 Zeilen je Tabelle; Insert `anlage` → `42501`; `wissen_app_schreiben('sorte_neu', …)` → «nicht erlaubt».
- Tim `…000a`: Insert `anlage`, sieht 1 Zeile; `profilwert` Insert/Update → `42501`; `messgeraet` Update ok, Insert → `42501`; `delete from messung` → 0 Zeilen, Zeile bleibt.
- D1: Schleife `pg_proc` (`prosecdef`, nicht Trigger, nicht Allowlist): `has_function_privilege('anon'|'authenticated', …, 'execute') = false`; jede `prosecdef`-Funktion mit `search_path` in `proconfig`; als `anon`/`authenticated`: `datenart_loeschen('demo')`, `backup_status_melden(1)` → `42501`.
- UC4-AK6: `storage.buckets` `saattueten` `public = false`; Policies auf `storage.objects` mit `bucket_id = 'saattueten'` und `ist_tim()`; `anon` 0 Objekte; fremdes Konto Insert in `storage.objects` → `42501`.

**02_eindeutigkeit_checks.sql** (UC1-AK7, UC1-AK6, UC3-AK2, smoke1-Checks, D4, D5)
- UC1-AK7 (4 Fälle); `gefaess_aktiv_je_platz` (zweites aktives Gefäss scheitert, nach `gueltig_bis` erlaubt); `netztopf_kennung_aktiv` und «R8.3 `topf_neu_beschriften` tauscht zwei Kennungen in einer Transaktion»; «UC1-AK6 Kürzel nach dem ersten Druck fest» (vor Druck änderbar); «Etikett-Code unveränderlich» (E9).
- Checks: Topfgrösse 50/80; «UC3-AK2 Betriebsvolumen < L × B × H»; Standardprofil nur pH, Wassertemperatur, Lichtstunden (smoke1); pH-Band und EC-Band (Validator 9.4); «Überschreiben einer Wissenszeile scheitert, `gueltig_bis` setzen erlaubt»; «Cache direkt ändern scheitert» (`satz.saatdatum`, `reservierung.umsetzen_geplant_am`); «C6 `umsetzen_vorgabe_am` unveränderlich»; «D5 Phasenantwort an der Pflanzung scheitert»; «sonde_gereinigt und als_unsicher_markiert ohne daten.datenart scheitern»; «D4 pH-Kontrolle ohne Datenart scheitert, mit Platz scheitert»; `einstellung` einzeilig; `push_zeit` ausserhalb 05:00 bis 22:00 scheitert; `nacherfasst` generiert (gilt_ab 3 h vor erfasst_am → true).

**03_wissen_sichten.sql** (smoke1, UC4-AK4-Vorstufe, C5, C9, C10)
- `v_sollwert`: Vererbung Art vor Standard, Klasse D für Kulturgruppe und Standard, nur gültige Versionen.
- `v_vollstaendigkeit`: fehlende Pflichtgrösse → `vollstaendig = false`; Prüfaufträge zählen Klasse D; mit bestätigter Saatempfehlung `true`.
- Schreibweg: «C5 art_neu übernimmt Merkmale und Kulturformen der Leitkultur mit Vermerk leitkultur»; «C9 sorte_neu: Schlüssel = Client-ID, sorte_key = zeile_id, zweiter Aufruf ändert nichts»; «C10 zweiter Tütenwert schliesst die erste Fassung»; «C5 saatempfehlung_neu nur C (Tüte, nur Sorte) oder D; neue Fassung schliesst die alte; saatempfehlung_bestaetigen setzt bestaetigt_am»; Aufruf als Tim (RLS aktiv, `security definer`).

**04_zustaende.sql** (smoke2, C2, C3, C6, D2, D3, UC3-AK5, UC3-AK9, UC6-AK9, Ereignisreihenfolge)
- `v_gefaess_status`: neu «in_pruefung»; Schritte 1 bis 3 «in_betrieb_volumen_offen»; Schritt 4 «in_betrieb»; Volumenkorrektur (neue Belegung) bleibt; «C2 ohne gefaess_erfasst Rückfall gueltig_von»; «C2 nach entfernt zählen alte Prüfschritte nicht»; «ruhe» → «ruht»; Box-Deckel-Tausch setzt zurück.
- `v_fuellzustand`: «D3 neues Gefäss nach entfernt ohne Ereignis leer»; «D3 nach Neuansatz Lösung»; «geleert → leer»; `v_nachfuellsumme` seit dem letzten Neuansatz.
- `v_pflanzung_zustand`: Phase aus Satz-Antwort; «C3 Fruchtgemüse-Antwort am Satz gilt für beide Pflanzungen»; «ernte {art: ab} setzt geerntet»; Wiederherstellen öffnet den Status.
- Caches: «C6 Saatdatum aus Ereignis», «C6 Storno des einzigen aussaat: Kalendertag von gilt_ab»; «C6 ohne Ereignis gilt die Vorgabe», «C6 Morgen am Satz gilt für alle aktiven Reservierungen», «C6 Ausnahme an der Pflanzung», «C6 Storno der Ausnahme», «C6 Storno des Satz-Ereignisses: Vorgabe», «C6 beendete Reservierung bleibt»; «D2 Korrektur nach Morgen behält das Datum, Client-Wert wird überschrieben».
- `v_reservierung_aktiv`: «UC6-AK9 keimt nicht beendet, Wiederherstellen öffnet»; Umsetzen beendet; Ausfall beendet.
- `v_netztopf_platz`: Heimplatz ohne Ereignis; Verschieben; «Tausch setzt beide Töpfe um (zwei Ereignisse, gemeinsame vorgang_id)».
- «8.1 Regel 2 Ereignisreihenfolge»: dieselben Ereignisse (gefaess_erfasst, gefaesspruefung 1 bis 4, aussaat, phase_antwort, verschieben, umsetzdatum_geaendert) in Reihenfolge A, Sichten in Temp-Tabelle; `rollback to savepoint`; Reihenfolge B; `results_eq` für Status, Füllzustand, Phase, Platz, `satz.saatdatum`, `umsetzen_geplant_am`.
- `pflanzung_geloescht` entfernt verwaiste Pflanzvorgänge, nicht die mit Pflanzung.

**05_messung_unsicher.sql** (TZ1 bis TZ4, C1, R4.7, 8.1 Regel 7)
- «TZ1 Tag 29 nicht unsicher, keine Fälligkeit», «TZ2 Tag 30 fällig, nicht unsicher», «TZ3 Tag 31 unsicher», «TZ4 nie kalibriert: unsicher, faellig_am null» gegen `v_messung_unsicher` und `v_kalibrierung_faellig`; fester Termin vor Tag 30; «Sonde gereinigt: sofort fällig, Messung danach unsicher».
- «C1 Demo-Sonde gereinigt: echte Messung sicher, Demo-Messung unsicher», «C1 Markierung anderes Gerät wirkt nicht», «C1 Demo-Markierung auf echte Kalibrierung wirkt nicht», «C1 echte Markierung: echte Messung unsicher»; «R4.7 Messung nach der neuen Kalibrierung trotz Markierung nicht unsicher»; «Demo-Messung zählt nur Demo-Kalibrierungen».

**06_auswertung.sql** (C4-AK1, C4-AK3, C12, C13)
- Je Sicht `has_view`, Spalten, eine Beispielzeile mit erwarteter Kennzahl (C4-AK1).
- Je Sicht Demo-Zeile nicht gezählt; Zeile am 31.3.2027 23:59 Europe/Zurich gezählt, 1.4.2027 00:00 nicht (C4-AK3); «C13 Termintreue: Tage ohne 1.4.», «C12/C13 Pflegezeit löst die Anlage über Satz, Pflanzung, Netztopf und daten.datenart auf»; `v_klima` nur 18:00 bis 21:30, letzte Messung je Tag; `v_keimrate` nur echt und nur eingehaltene Keimtemperatur, Glättung ab 10 Samen; `v_saeurebedarf` und `v_ph_wirkung` nur echt.

**07_demo_loeschen_push.sql** (C7, D4, TP1/TP5 als [SQL], backup_status)
- «C7 nach datenart_loeschen('demo') als service_role: Anlagen, Kalibrierungen, Abos, Versand, Pflanzvorgänge, Demo-Ereignisse, Scans, pH-Kontrollen, Aufschübe» (Zählung wie smoke3); «C7 echt scheitert»; «C7 als authenticated scheitert».
- «TP1-SQL Sammel-Push je Abo, Tag und Art einmal», «TP5-SQL Timer-Push je Abo, Ansatz und timer_ende einmal, neuer Timer erhält eigene», «E-Mail-Sammel je Tag einmal»; `ki_aufruf` zählt jeden Aufruf (Insert als service_role, Tim nur lesen).
- «backup_status_melden schreibt eine Zeile» (als `postgres`), Aufruf als `anon`/`authenticated`/`service_role` → `42501`.

Grenzfälle RF, TO, TP, TK: keine [Unit]/[E2E]/[Deno] in diesem Paket; TZ1 bis TZ4 als [SQL] oben; TP1 und TP5 als Unique-Index-Fälle [SQL] (die Deno-Fälle folgen in I0-08).

**Berichtsweg.** `pr.yml` Job `db`: `supabase test db` (Tor) → `scripts/pgtap-bericht.sh > reports/pgtap.txt` (TAP mit Namen) → Artefakt `bericht-db` → Job `ak-abdeckung` liest `reports/pgtap.txt` mit `tapTests()` (A1).

## Ablauf und Rollen

1. **Planfreigabe** durch Tim (Label `plan-frei`, Kommentar mit Commit-Kürzel); vorher Vergleich Plan A gegen Plan B mit der Rubrik.
2. **Lead:** `supabase/config.toml` (E6-Version festlegen), `scripts/pgtap-bericht.sh`, Anpassungen `pr.yml`/`deploy.yml`, `.prettierignore`, `eslint.config.js`; `supabase start` lokal (`npx supabase@<Version>`, Docker Desktop; A7).
3. **Testentwickler:** sieben pgTAP-Dateien nach Testliste, `tests/testentwickler.txt`; Fixtures gegen eine lokale Datenbank mit dem **unveränderten Entwurf** als vorläufiger, nicht committeter Migration prüfen (so sind die Tests fachlich richtig und rot nur wegen der fehlenden Migration: Dateien scheitern an «relation does not exist»; die Fälle E9 Etikett-Code und UC4-AK6 bleiben auch gegen den Entwurf rot). Commit `Tests: 9 pgTAP Datenmodell`.
4. **Datenbank:** beide Migrationen und `seed.sql` nach diesem Plan; `supabase db reset`, `supabase test db` grün; Meldung an den Lead. Abweichungen vom Entwurf nur Ab-7, Ab-8, Ab-10.
5. **Lead:** Typen erzeugen und committen, `supabase.ts` generisch, Prüftor grün (lint, typecheck, unit, mutation-Warnung, db mit Bericht, e2e mit lokaler Datenbank, build, AK-Abdeckung: fünf [SQL]-AK gedeckt, Smoke-Zeile Warnung mit Beleg im Pull Request). Änderungen an Testdateien des Testentwicklers nur mit Begründung und Label `tests-freigegeben`.
6. **Prüfer parallel als Team:** `pruefer_fachlogik` (Plan-Code-Abgleich Entwurf ↔ Migration Zeile für Zeile, Testliste ↔ Dateien, Zuordnung Smoke → pgTAP) und `pruefer_sicherheit` (RLS-Schleife, Funktionen, Storage, keine Personendaten, Workflow-Änderungen nur Version und Berichtsschritt). Höchstens zwei Runden.
7. **Lead:** Migration über MCP nach `hydrovisor-dev` (E10), Handgriff H2; Pull Request mit Vorlage, Labels `db-lock`, `abnahme-wartet`, Zuordnungstabelle Smoke → pgTAP, pgTAP-Bericht als Auszug.
8. **Abnahme 1 (Tim, rund 15 min):** Dashboard `hydrovisor-dev`: Tabellen mit RLS-Kennzeichen, Policies `tim_*`, Bucket `saattueten` privat; Vorschau meldet weiterhin an; Prüftor grün. Kommentar `# Abnahme` mit Tabelle.
9. **Kurzzusammenfassung und Merge** nach Tims «Ja»; `deploy.yml`: Tim gibt `production` frei (H3 danach); Rauchtest.
10. **Abnahme 2:** Dashboard Produktion wie in 8; `select ist_tim()` ist dort nicht aussagekräftig (SQL-Editor läuft ohne JWT); Beleg ist die Zeile in `zugang` und der Rauchtest. Issue: Ist-Felder, `/usage`.

## Tims Handgriffe

| Nr. | Wann | Was |
|---|---|---|
| H1 | vor Schritt 2 | Planfreigabe; Rubrik-Bewertung der zwei Pläne (12.7 a) |
| H2 | vor Abnahme 1 | OK, dass der Lead in `hydrovisor-dev` über MCP die Zeile in `zugang` anlegt (`insert into public.zugang (user_id) select id from auth.users` mit Abbruch, wenn nicht genau ein Konto besteht) |
| H3 | nach dem Deploy | Produktion, SQL-Editor: `insert into public.zugang (user_id) select id from auth.users where email = '<deine Adresse>';` (Adresse nur dort eingetippt, Vorlage in `docs/betrieb/handgriffe.md`) |
| H4 | beim Merge | Freigabe des Jobs `migration` in der Umgebung `production` |
| H5 | nur bei A5 | Falls die Storage-Migration in der Produktion an Rechten scheitert: Bucket und Policy im Dashboard anlegen (Vorlage in `docs/betrieb/handgriffe.md`), Migrationshistorie mit `supabase migration repair` nachführen (Tims Gerät, nie der Agent) |

Geplant 75 Minuten (Plan 30, Abnahmen 30, Rückfragen 15).

## Risiken

| Risiko | Folge | Gegenmassnahme |
|---|---|---|
| `supabase test db` druckt keine TAP-Zeilen je Test (A1) | AK-Abdeckung findet kein [SQL]-AK, Prüftor rot | E5: `scripts/pgtap-bericht.sh` schreibt den Bericht; Lead prüft lokal vor dem ersten Push |
| CLI-Version ändert das Typformat | Typen-Abgleich scheitert ohne Codeänderung | E6: Version festgenagelt; Wechsel nur bewusst mit neu erzeugter Datei |
| Policies auf `storage.objects` scheitern in der Produktion an Besitzrechten (A5) | Migration bricht nach dem Datenmodell ab | E1 eigene Datei; H5 Rückfall von Hand; lokal und dev zeigen vorher, ob es trägt |
| `auth.users`-Inserts in Seed oder Tests passen nicht zur gehosteten Spaltenliste (A4) | `db reset` oder Tests scheitern lokal | minimale Spaltenliste; Datenbank-Agent prüft gegen `supabase start`; Tests legen Konten nur in der eigenen Transaktion an |
| `postgres` ohne BYPASSRLS oder ohne Default-Privileges lokal (A2) | Tests als Tim sehen 0 Zeilen, oder `anon` erhält `42501` statt 0 Zeilen | Tests akzeptieren «0 Zeilen oder 42501» für `anon`; Fixtures als `postgres` vor `set local role` |
| Fehler in den Fixtures des Testentwicklers | Änderungen lösen den Testdatei-Wächter aus | Schritt 3: Tests vorab gegen den Entwurf laufen lassen; Änderungen nur mit Begründung und Label |
| Entwurf enthält trotz Prüflauf einen Fehler, der erst in Supabase auffällt (reservierte Namen, Rollen) | Migration scheitert lokal | `db reset` beim Datenbank-Agenten; Abweichung in den Plan-Code-Abgleich, `02_datenmodell.sql` nachführen |
| `e2e`-Job startet jetzt Supabase in CI (rund 2 min mehr) | längeres Prüftor | hinnehmen; Playwright bleibt mit `page.route` unabhängig von der Datenbank |
| Kern-Paket braucht 50 % freies Wochenkontingent und ein frisches 5-Stunden-Fenster | Verzug gegen 21.11. | Schritte 2 bis 5 in einer Sitzung; Prüfer in der folgenden |
| Zwei Pläne, ein Paket | Mischung beider Pläne im Code | der gewählte Plan wird unverändert `docs/plaene/9.md`; der andere bleibt als Beleg liegen |

## Nicht-Ziele

- Keine Startdaten, kein Seed-Skript mit Validator (I0-05), keine Demo-Szenarien (I0-10), keine Testanlage Y.
- Keine `backup_leser`-Rolle, keine `backup_lesen`-Policies, kein BYPASSRLS-Risikotest (I0-11).
- Keine Erweiterungen `pg_cron`, `pg_net`, kein Vault-Geheimnis, keine Edge Functions (I0-08, I0-09).
- Kein `schreiben()`, kein Offline-Bündel, keine lokale Anmeldung mit Passwort (I0-04).
- Keine Masken, keine Änderung an der Anmeldung, keine Design-System-Arbeit.
- Keine Nachführung von `02_datenmodell.sql` in diesem Pull Request (Ab-7 als eigener Routine-Commit danach), keine Konzeptänderung.
- Kein Produktionszugriff des Agenten; keine Änderung an `.claude/`, `.mcp.json`, Sperren.

## Annahmen (A)

1. **(A1)** `supabase test db` gibt ohne Zusatzflags nur eine Zeile je Datei aus; darum das Berichtsskript (E5). Zeigt die angeheftete CLI-Version die TAP-Zeilen, entfällt das Skript, und der Schritt bleibt `supabase test db | tee reports/pgtap.txt`. Prüfung durch den Lead in Schritt 2.
2. **(A2)** Lokal wie gehostet laufen Migrationen als `postgres`; Supabase vergibt über Default-Privileges Tabellen- und Funktionsrechte an `anon`, `authenticated`, `service_role`; `postgres` umgeht RLS. Grundlage: `docs/spec/pruefung/rechte.sql` und Befund D1; die Tests sind gegen beide Varianten tolerant.
3. **(A3)** `auth.uid()` liest `request.jwt.claim.sub` vor `request.jwt.claims`; Fallback in den Tests: beide setzen.
4. **(A4)** `insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)` genügt lokal; Platzhalter-Domain `example.test` wie in `tests/e2e/hilfen.ts`.
5. **(A5)** `create policy on storage.objects` und `insert into storage.buckets` funktionieren in einer Migration als `postgres` (gängige Praxis in Supabase-Projekten); sonst H5.
6. **(A6)** Bucket-Grenzen 5 MB je Datei und nur `image/jpeg` (Client liefert JPEG 1568 px, Qualität 0.8; Konzept 11.3).
7. **(A7)** Die Supabase-CLI ist lokal nicht installiert; `npx supabase@<Version>` mit Docker Desktop reicht für `start`, `db reset`, `test db`, `gen types`. Tim installiert nichts.
8. **(A8)** Die Zuordnungstabelle Smoke → pgTAP im Pull Request gilt als Beleg für die Issue-Zeile ohne Prüfart (Ab-13).
9. **(A9)** Die Migration zur Produktion läuft ohne Daten; der Rückweg E11 ist bis I0-05 gefahrlos.
10. **(A10)** `eigene_aufgabe.letzte_erledigung` und `naehrloesungsansatz.status` gelten nicht als Zustandsfelder im Sinn von 8.1 Regel 2 (Konzept 8.2 definiert sie als Attribute); Nachführung beim Pool-Posten.
