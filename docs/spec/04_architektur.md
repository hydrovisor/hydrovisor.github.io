# 04 Architektur, Plattform und Betrieb

Stand 1.11.2026 · Auftrag 2 «Spezifikation» · Grundlage: Konzept v1.2 Kapitel 11 und 12, Entscheide in `00_rueckfragen.md`. (A) = Annahme dieser Spezifikation.

## 1 Bausteine und Verzeichnisse

| Baustein | Festlegung |
|---|---|
| Frontend | React, TypeScript (strict), Vite, Node 22 LTS, npm, ESLint mit Prettier, vite-plugin-pwa im Modus `prompt` mit `injectManifest` (eigener Service Worker für Push) |
| Gestaltung | `design-system/tokens.css`, `components/bundle.css`, Schrift Manrope aus `design-system/fonts/`; keine Farben, Grössen oder Abstände ausserhalb der Tokens (Konzept 10) |
| Daten | supabase-js mit Publishable Key; Lesen über Tabellen und Sichten mit RLS; Schreiben nur über `schreiben()` |
| Fachlogik | `src/domain/` (R1 bis R12, `01_fachregeln.md`), reines TypeScript ohne Browser-, Node- oder Deno-APIs; Importe mit Endung `.ts` und nur relativ innerhalb `src/domain/`, damit Vite und Deno dieselben Dateien laden (A) |
| Serverfunktionen | Supabase Edge Functions (Deno): `push-taeglich`, `push-quittung`, `ki-tuete` (Abschnitt 5, 6) |
| Zeitsteuerung | pg_cron und pg_net in Supabase; Geheimnis aus Supabase Vault |
| Hosting | GitHub Pages als Organisationsseite `https://hydrovisor.github.io/`, Root-Scope, Hash-Routing; Vorschau je Pull Request auf Cloudflare Pages |

```
src/
  domain/        Fachlogik R1–R12 (+ zeit.ts); keine Abhängigkeiten
  daten/         schreiben(), Lesezugriffe, Offline-Bündel (IndexedDB)
  ablauf/        laufende Abläufe (Rundgang, Abhakliste, Gefässprüfung, Timer) mit Schrittstand
  ui/            Masken und Bausteine (Klassen aus design-system), Router
  sw/            Service Worker (Precache, Push, Klick)
  konstanten.ts  BASIS_URL, SCOPE, START_URL, APP_VERSION
supabase/
  migrations/    additive Migrationen (Abschnitt 8)
  functions/     push-taeglich, push-quittung, ki-tuete; importieren src/domain/ relativ (../../../src/domain/…), ohne Import-Map (Plan 14)
  tests/         pgTAP
scripts/         seed.ts, w0-pruefen.ts, ak-abdeckung.ts, typen-pruefen.ts
tests/           unit/ (Vitest), e2e/ (Playwright), golden/ (Referenzdateien), fixtures/ (Demo-Szenarien S1–S9)
data/            wissensbasis/, stammdaten/, wissen/, eval/
design-system/   Quelle des Design Systems (E6)
```

**Risikotest I0:** Die Edge Function bündelt `src/domain/` über relative Importe (seit Plan 14 ohne Import-Map). Scheitert das Bündeln, kopiert `scripts/domain-kopieren.ts` die Dateien nach `supabase/functions/_shared/domain/`, und der Prüftor-Job vergleicht Kopie und Quelle byteweise (A).

## 2 Konstanten und Version

- `BASIS_URL = 'https://hydrovisor.github.io/'`, `SCOPE = BASIS_URL`, `START_URL = BASIS_URL + '#/heute'`; Etiketten-Link `BASIS_URL + '#/e/' + code` (R9.1). Eine eigene Domain ändert nur diese Konstanten.
- `APP_VERSION = <package.json version> + '+' + <Git-Kurzhash>`, beim Build eingesetzt; jede Erfassung speichert sie (8.1 Regel 3). Die Info-Seite zeigt sie (Abnahme 2).
- `public/version.json` mit `{ version, commit }` für den Rauchtest.

## 3 Routing (Hash)

Der Router wertet beim Erstaufruf und bei jedem `hashchange` dieselbe Funktion aus (Konzept 11.4). Vor dem Rendern prüft er, ob ein Ablauf offen ist (IndexedDB `ablaeufe`), und setzt ihn fort, wenn das Ziel dazu passt.

| Route | Maske | Kontext |
|---|---|---|
| `#/anmelden` | Anmeldung | Schreibtisch |
| `#/heute` | Heute (Start, Einrichtungs-Checkliste, Karten, Rundgang starten) | Regal |
| `#/rundgang` | Rundgang (Ort für Ort) | Regal |
| `#/e/:code` | Etikett-Auflösung nach R9.2 → leitet weiter, schreibt `etikett_aufruf` | – |
| `#/gefaess/:code` | Maske «Gefäss» (auch Stationen) | Regal |
| `#/messen/:code` | Messmaske (auch `R-W`, pH-Kontrolle `#/messen/geraet`) | Regal |
| `#/kalibrieren` | Messgerät kalibrieren mit Gegenprobe; `?datenart=demo` oder `test` für Demo- und Testanlagen (Plan 12, Ergänzung I0-07) | Regal |
| `#/ansatz/:code` | Rechner und Abhakliste (Neuansatz, Nachfüllen, Teilwechsel, pH-Korrektur) | Regal |
| `#/saeen` (`?box=R-A1`, `?ziel=R-2.3`) | Säen | Regal |
| `#/keimung/:satz` | Keimung prüfen | Regal |
| `#/umsetzen/:satz` | Umsetzen | Regal |
| `#/pflanze/:pflanzung` | Pflanzenansicht (Satz oder Topf) | Regal |
| `#/pruefen/:code` | Gefäss prüfen, Schritte 1 bis 3 | Regal |
| `#/anlage`, `#/vorlagen`, `#/gefaess-neu`, `#/sorten`, `#/etiketten`, `#/einstellungen`, `#/info`, `#/druck/:art` | Schreibtisch-Masken und Druckansichten (Etikettenbogen, Notfallblatt, Vertretungsblatt) | Schreibtisch |

Codes statt UUIDs in der Adresse (`R-2.3`), damit Etikett, Kopfzeile und Adresse gleich lesbar sind. Unbekannte Route → Heute.

## 4 Datenpfad

### 4.1 Schreiben

```ts
schreiben<T>(tabelle: Erfassungstabelle, datensatz: T & { client_id: string }): Promise<Ergebnis>
```

- Jede Erfassung erhält im Client eine UUID (`client_id`) und wird als Upsert mit `onConflict: 'client_id'` geschrieben; Wiederholungen sind idempotent (TO2). Ein Vorgang mit mehreren Zeilen (Ansatz mit Positionen und Schritten, Säen mit Satz, Pflanzungen, Reservierungen, Ereignis) wird in der Reihenfolge der Fremdschlüssel geschrieben; jede Zeile ist einzeln idempotent.
- `app_version`, `client_zeit` (Gerätezeit) und `gilt_ab` setzt `schreiben()`; `erfasst_am` setzt die Datenbank.
- Fehler bleiben sichtbar: «Kein Netz, nicht gespeichert, erneut senden»; die Eingaben bleiben (TO8). Ein endgültig abgelehnter Eintrag wird nie verworfen, sondern bleibt in Heute mit «Als Text kopieren» (11.4).
- Storno statt Löschen: «Rückgängig» und «löschen» setzen `storniert_am` und `storno_grund`.
- **Warteschlange (Q14):** Ab dem Ausbau speichert `schreiben()` zuerst in IndexedDB (`warteschlange`, Zustände wartet, gesendet, fehlgeschlagen) und sendet bei Netz; Aufrufer ändern sich nicht. Heute zeigt die Zahl wartender Einträge und warnt ab 24 h (TO5). Die Warteschlange sendet erst nach einem Update der App.

### 4.2 Lesen und Offline-Bündel

- Beim Start und nach jedem erfolgreichen Schreiben lädt der Client ein Bündel in IndexedDB (`buendel`): Anlage mit Bereichen, Plätzen und aktiven Gefässen, Deckeltypen, gültige Sorten mit `v_sollwert`, `art_kulturform`, Saatempfehlungen, Duengerschema, aktive Sätze, Pflanzungen und Reservierungen mit Zustand, letzte Messungen je Ort (14 Tage), letzter Ansatz je Ort, Kalibrierung und `v_kalibrierung_faellig`, Aufschübe, Einstellungen, Wissenseinträge.
- Ohne Netz zeigen Heute, Gefäss und Pflanze das Bündel mit «Stand: hh:mm» (TO6).
- Aufgaben rechnet `faelligeAufgaben()` im Client aus dem Bündel (R5.1).

### 4.3 Laufende Abläufe

Rundgang, Abhakliste, Gefässprüfung und Timer speichern nach jedem Tipp ihren Schrittstand in IndexedDB (`ablaeufe`) und erst danach in der Datenbank. Nach Neuladen, Hash-Wechsel oder Scan setzen sie fort (AP-03). Pause über 2 Minuten → Rückfrage mit Zeitstempel (R4.6). Timer rechnen gegen `timer_ende` (absolute Zeit), auch nach Neustart oder Gerätewechsel.

### 4.4 Bildschirm, Thema, Dichte

- Wake Lock in Rundgang, Rechner, Abhakliste, Gefässprüfung und Timer; bei `visibilitychange` zu sichtbar neu anfordern; beim Timer bis Ende plus 2 Minuten (A, E-F4-6).
- `data-theme` auf `<html>` aus `einstellung.thema` (Standard `hell`; `system` folgt `prefers-color-scheme`); vor der Anmeldung `hell` (E6).
- `data-density="regal"` auf den Masken des Kontexts Regal (Konzept 6.3), Standarddichte auf den Schreibtisch-Masken.

## 5 Push-Kette

| Teil | Festlegung |
|---|---|
| Abo | Client abonniert mit dem VAPID-Public-Key, speichert in `push_abo` (Upsert auf `endpoint`); bei jedem Start Vergleich `pushManager.getSubscription()` mit gespeichertem Abo, bei Abweichung neu speichern. Test-Push aus den Einstellungen (`art = test`). |
| Auslösung | pg_cron `*/5 * * * *` ruft per pg_net `push-taeglich` mit Header `x-cron-geheimnis` (Wert aus Vault, nie Literal in einer Migration). Zusätzlich `* * * * *` mit `?nur=timer` für Timer-Push (Annahme 9 in `00_rueckfragen.md`). |
| Sammel-Push | Die Function rechnet `jetzt` in Europe/Zurich; wenn `jetzt ≥ push_zeit` und für (Abo, Tag, `sammel`) keine Zeile in `push_versand` besteht: Aufgaben mit `faelligeAufgaben()` aus den Daten der Datenart echt, Titel nach Gewicht (R5.5), Tagesliste nach `aufgabe_tagesliste`, Versand mit TTL 14400 s, Urgency high, Notification-Tag `heute`, `renotify: false`. Die Zeile in `push_versand` wird vor dem Senden angelegt (Unique-Index), damit ein paralleler Lauf nicht doppelt sendet (TP1). |
| Kurzprüfung 20:00 | Um 20:00 eine Push `kurzpruefung_20`, wenn für heute kein Kurzprüfung-Ereignis an einem Platz einer echten Anlage besteht. |
| Timer | Je laufendem Ansatz mit `timer_ende ≤ jetzt` eine Push `timer`, sofern für (Abo, Ansatz, `timer_ende`) noch keine Zeile in `push_versand` besteht (Teil-Unique-Index); jeder neue Timer der Abhakliste setzt ein neues `timer_ende` und erhält damit seine eigene Push (TP5). |
| Fehler | Antwort 404 oder 410 → `push_abo.aktiv = false`, Versandstatus `abgemeldet` (TP2); Heute zeigt «Push nicht eingerichtet». |
| E-Mail | Nur ohne aktives Abo oder nach 404/410, höchstens eine Sammel-Mail je Tag, über Resend; Schlüssel und Empfängeradresse als Supabase-Secrets (E6). |
| Quittung | Die Push-Nutzlast enthält `versand_id` und eine HMAC-Signatur. Der Service Worker meldet «angezeigt» beim Anzeigen, der Klick-Handler «geöffnet» an die Function `push-quittung`, die die Signatur prüft und `angezeigt_am` bzw. `geoeffnet_am` setzt (A: der Service Worker hat keinen Zugriff auf die Sitzung). |
| Anzeige in Heute | «Letzte Erinnerung: heute 07:00 zugestellt» aus `push_versand.angezeigt_am`; nach 48 h ohne Zustellung Warnung mit Link zu den Akku-Einstellungen von Chrome. |
| Tests | TP1 bis TP4 in `06_tests.md`; einmal `show cron.timezone` (Erwartung UTC). VAPID-Schlüssel werden nie neu erzeugt. |

## 6 KI-Aufruf (UC4)

- Function `ki-tuete` mit dem Benutzer-Token; prüft Token und `ist_tim()`; schreibt danach mit der Service-Rolle (`ki_aufruf` ist für Tim nur lesbar) vor jedem API-Request eine Zeile `ki_aufruf` und lehnt ab, wenn heute schon 30 Zeilen bestehen (11.1); Bildgrösse höchstens 2 × 1568 px lange Kante.
- Client: beide Seiten im Canvas auf 1568 px lange Kante, JPEG 0.8, damit EXIF entfernt; Upload nach `saattueten/{sorte_id}/{uuid}.jpg` (privat), Anzeige über signierte Links (60 s). Für eine neue Sorte erzeugt der Client die `sorte_id` vor dem Upload; `wissen_app_schreiben('sorte_neu')` übernimmt sie als `sorte_schluessel.id` mit `sorte_key` = `zeile_id` = `app-<sorte_id>` und ist bei gleicher `sorte_id` idempotent (Warteschlange).
- Modell `claude-sonnet-5-5`, Denkstufe low, Structured Outputs mit JSON-Schema (Name, Art, Keimart, Keimtemperatur min und max, Keimdauer, Kulturdauer, Aussaatfenster, Hersteller; je Feld `null` statt «nicht gefunden»; kein pH, EC, Phase), keine Sampling-Parameter, `max_tokens` 2000. Bei 429, 5xx oder nach 20 s ein Versuch mit `claude-haiku-5-5`; nach höchstens 30 s «von Hand», Eingaben bleiben. Antwort wird gegen das Schema geprüft; Felder ausserhalb des Schemas werden verworfen (TK1 bis TK3). Modell-IDs und Parameter werden vor dem I0-Eval an der aktuellen API-Dokumentation geprüft.
- Die Claude API wird im Prüftor nie aufgerufen; Tests nutzen aufgezeichnete Antworten.
- Umsetzung I0-09 (Plan 14): Kern `tueteLesen()` in `supabase/functions/ki-tuete/kern.ts` mit eingespritztem Datenzugriff, Rufer und Uhr; eine Zeile `ki_aufruf` je API-Request (ein Ausweichen belegt zwei der 30), die Grenze wird vor jedem Request am Zürcher Kalendertag geprüft. Antwort `200` mit `KiErgebnis` auch bei «von Hand»; `400` bei ungültigem Körper oder Bild über 1568 px; `401`, `403`, `405`. Ohne Secret `ANTHROPIC_API_KEY` antwortet sie «von Hand» (nicht eingerichtet) ohne Zeile. Parameter am 4.11.2026 geprüft: `output_config` mit `effort: low` und `format: json_schema`, `thinking` weggelassen (adaptiv), Header `anthropic-version: 2023-06-01`, ohne Beta-Header.
- Eval am PC (12.6): `npm run eval:tueten` ruft je Tüte beide Modelle ohne Ausweichen mit demselben `anfrageBauen()`, verkleinert die Fotos wie der Client (Canvas in Playwright-Chromium) und schreibt `reports/ki-eval.md`; `--trocken` läuft mit aufgezeichneten Antworten.

## 7 Service Worker «Hinweis statt Automatik»

- vite-plugin-pwa `registerType: 'prompt'`, `injectManifest`; Precache der App-Shell, keine Laufzeit-Caches für API-Aufrufe (Daten kommen aus dem Bündel).
- Eine neue Version wird nur in Heute und nur ohne laufenden Ablauf angeboten: «Neue Version, neu laden». Nie Umschalten während eines Ablaufs (TO7).
- Manifest: `name` und `short_name` «Hydrovisor», `start_url` und `scope` aus den Konstanten, `display: standalone`, `orientation: portrait`, `theme_color #0F3D4C`, `background_color #F2F5F4`, Icons 192, 512 und maskable aus dem Design System (folgen mit dem Manifest-Paket), höchstens drei `shortcuts`: Heute, Rundgang, Säen. Sichere Bereiche über `env(safe-area-inset-*)`.
- Dauerhafter Speicher: `navigator.storage.persist()` in der Einrichtung (UC0).
- Service-Worker-Tests laufen gegen `vite build` und `vite preview`.

## 8 Migrationen und Datenbank

- Migrationen in `supabase/migrations/`, im Testbetrieb nur additiv: neue Spalten nullable, Umbenennen in zwei Schritten über zwei Releases; nach dem 1.3.2027 nur `create or replace view` als Fehlerbehebung bis 17.3. (Konzept 13.4).
- `einstellung.min_client_version`: Die App prüft beim Start und vor dem Senden der Warteschlange und zeigt «Aktualisieren». `schreiben()` akzeptiert das Format der Vorversion.
- Höchstens ein offener Pull Request mit Änderungen in `supabase/migrations` (Label `db-lock`).
- **Typen (E6):** Der Job `db` baut die Datenbank lokal mit `supabase start` und `supabase db reset` auf, erzeugt die Typen und vergleicht sie mit der eingecheckten Datei `src/daten/datenbank.types.ts`; eine Abweichung bricht das Prüftor. Der Lead committet die neu erzeugte Datei im Zweig; kein CI-Commit auf `main`.

## 9 Umgebungen, Vorschau, Workflows

| Umgebung | Daten | Zugriff | Ausgelöst |
|---|---|---|---|
| Lokal / CI (`supabase start`) | Demo-Szenarien S1 bis S9 | Agent | Prüftor `pr.yml` |
| `hydrovisor-dev` (Pro-Organisation, Frankfurt) | Demo-Szenarien, Testanlage Y | Agent über MCP mit fester Projekt-Referenz (Auftrag 3), Tim | von Hand, Vorschau |
| `hydrovisor` (Produktion) | Anlage R echt, Demo X nur auf Abruf | nur Tim; Migration per `deploy.yml` mit Freigabe | Merge auf `main` |

- **Vorschau:** Cloudflare Pages `hydrovisor-vorschau` baut jeden Zweig über die GitHub-Integration (`npm ci && npm run build`, Ausgabe `dist`) unter `<zweig>.hydrovisor-vorschau.pages.dev` mit den Umgebungsvariablen des Dev-Projekts (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY`), gesetzt im Cloudflare-Projekt. In `hydrovisor-dev` stehen die Vorschau-Adressen in der Auth-Redirect-Liste. Kein Job in `pr.yml`.
- **`pr.yml`** (Pflichtcheck): lint, typecheck, unit, mutation (nur Kern-Pakete), db (supabase start, db reset, pgTAP, Typen-Abgleich, Seed-Zähltest mit Demo-Daten), edge (Deno test), e2e (Playwright gegen `vite preview`), build, AK-Abdeckung, Testdatei-Wächter, Referenzdatei-Hash, db-lock.
- **`deploy.yml`** (nur `main`, Umgebung `production` mit Tims Freigabe): Migration (`supabase db push` über `SUPABASE_DB_URL_POOLER`), Seed, Edge Functions (`SUPABASE_ACCESS_TOKEN`), Build mit den Produktions-Variablen (Repository-Variablen, keine Secrets, weil der Publishable Key öffentlich ist), Pages-Deploy, Rauchtest. Rauchtest: Playwright in mobiler Chrome-Emulation lädt `https://hydrovisor.github.io/`, prüft `version.json` gegen den Commit und dass die Anmeldung oder Heute erscheint (A: ohne Zugangsdaten im Workflow). Scheitert er, baut der Job den Stand des Tags `letzter-guter-stand` und stellt ihn wieder bereit; bei Erfolg wird der Tag nachgezogen.
- **`backup.yml`** (täglich 03:00 UTC, Umgebung `backup` ohne Freigabe): `supabase db dump` (Schema und Daten getrennt) über `SUPABASE_DB_URL_BACKUP` mit der Rolle `backup_leser` (nur SELECT, mit BYPASSRLS, weil der Dump sonst an der RLS scheitert), Bucket `saattueten` mit `SUPABASE_STORAGE_TOKEN_BACKUP`, Verschlüsselung mit `age` gegen `BACKUP_AGE_PUBLIC_KEY`, Ablage als Release-Asset in `hydrovisor/hydrovisor-backup` mit `BACKUP_REPO_TOKEN` (30 Stände); Datum und Grösse über `select backup_status_melden(<bytes>)`, die einzige Schreibberechtigung der Rolle (A8 in `02_datenmodell.sql`). **Risikotest I0:** Lässt Supabase BYPASSRLS für eine eigene Rolle nicht zu, bleibt `backup_leser` eine nur lesende Rolle (11.7): Eine Migration legt je Tabelle die Policy `backup_lesen ... for select to backup_leser using (true)` an (Muster in `02_datenmodell.sql` bei A8), der Dump läuft mit `pg_dump --enable-row-security` (PostgreSQL 17, statt `supabase db dump`), und der Prüftor-Test (Abschnitt 11) lässt genau diese Policies als benannte Ausnahme zu. Geprüft in Docker (`docs/spec/pruefung/smoke3.sql`, C11): alle 49 Tabellen im Dump, kein Schreibrecht. `backup_status_melden` bleibt der einzige Schreibweg. Die Wiederherstellungsprobe (M0, 1.3.) spielt den Dump in `hydrovisor-dev` ein und vergleicht die Zeilen je Tabelle.

## 10 Secrets und Variablen

| Ort | Name | Zweck |
|---|---|---|
| GitHub-Umgebung `production` | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL_POOLER` | Migration, Seed, Functions (gesetzt) |
| GitHub-Umgebung `backup` | `SUPABASE_DB_URL_BACKUP`, `SUPABASE_STORAGE_TOKEN_BACKUP`, `BACKUP_AGE_PUBLIC_KEY`, `BACKUP_REPO_TOKEN` | Backup (Tim, I0) |
| GitHub-Repository-Variablen | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_VAPID_PUBLIC_KEY` | Produktions-Build (öffentlich) |
| GitHub-Repository-Variable | `SUPABASE_PROJECT_REF_PROD` | Produktions-Referenz für `deploy.yml`, nie im Repository (Entscheid 0004) |
| Cloudflare-Projekt | dieselben drei Variablen für `hydrovisor-dev` | Vorschau |
| Supabase-Secrets (je Projekt) | `ANTHROPIC_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `RESEND_API_KEY`, `EMAIL_EMPFAENGER`, `PUSH_QUITTUNG_SCHLUESSEL` | Functions (Tim) |
| Supabase Vault | `cron_geheimnis` | pg_cron → Function |

Das VAPID-Paar ist in `hydrovisor-dev` und in der Produktion dasselbe (nie neu erzeugen); der öffentliche Teil steht zusätzlich als `VITE_VAPID_PUBLIC_KEY` in GitHub und Cloudflare. Der Anthropic-Schlüssel stammt aus dem Arbeitsbereich «hydrovisor» der Claude Console (Ausgabenlimit RR8); in `hydrovisor-dev` ist es der Schlüssel «hydrovisor-dev-2», die Produktion erhält ihren eigenen Schlüssel vor I2-05.

Keine Repository-Secrets (damit `pr.yml` keine erreicht), keine Schlüssel im Code, im Repository oder in Testdaten. Tim setzt alle Secrets selbst; der Agent bereitet die Namen vor.

## 11 Sicherheit (Konzept 11.6)

- Registrierung gesperrt, Tims Konto von Hand; Sitzung ohne Zeitbegrenzung; kein Magic Link (gesetzt).
- RLS auf jeder Tabelle über `ist_tim()`; Wissenstabellen nur lesbar; die App löscht nie (keine Delete-Policy); Prüftor-Test über `information_schema` und `pg_policies` meldet jede Tabelle ohne RLS oder mit `using (true)`; einzige benannte Ausnahme sind die Policies `backup_lesen` (nur `select`, nur `to backup_leser`), falls der Rückfall aus Abschnitt 9 gilt. Demo- und Testdaten löscht `datenart_loeschen()` nur mit der Service-Rolle. Weil Supabase über Default-Privileges `EXECUTE` auf neue Funktionen an `anon`, `authenticated` und `service_role` vergibt, entzieht jede Migration diese Rechte bei `security definer`-Funktionen ohne eigene Prüfung ausdrücklich (`datenart_loeschen`, `backup_status_melden`); der Prüftor-Test ruft jede solche Funktion als `anon` auf und erwartet einen Fehler.
- Bucket `saattueten` privat, Policies mit `bucket_id` und `ist_tim()`; EXIF-frei (AK liest zurück).
- Edge Functions prüfen Token und Nutzer, begrenzen Grösse und Aufrufe; `push-taeglich` nur mit Cron-Geheimnis; `push-quittung` nur mit gültiger Signatur.
- Geräteverlust: Sitzungen im Dashboard widerrufen (Betriebshandbuch).
