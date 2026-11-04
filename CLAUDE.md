# Hydrovisor – Arbeitsanweisung für Claude Code

Private PWA mit Supabase für Tims Hydroponikregal; einziger Nutzer Tim, bedient mit dem Honor Magic5 Pro in Chrome am Regal. Testbetrieb ab 7.1.2027, Datenschluss 31.3.2027. Rollen: Tim ist Product Owner, die Hauptsitzung ist Lead-Entwickler (Konzept 12.1, 12.2).

## Wo steht was

| Was | Wo |
|---|---|
| Fachkonzept (massgebend) | `docs/input/konzept_v1.3.md`; Änderungen nur als neue Fassung mit Eintrag in Anhang B.2 |
| Rangfolge bei Widerspruch | Konzept vor `docs/input/use_cases_f4.md` vor `docs/input/duengeplan_v1.6.md` vor W0 |
| Spezifikation (abgenommen 1.11.2026) | `docs/spec/` (Fachregeln, Datenmodell, Import W0, Architektur, Masken, Tests, Glossar) |
| Entscheide | `docs/spec/00_rueckfragen.md` (Auftrag 1) und `docs/entscheide/` (je Entscheid eine Datei) |
| Paketplan, Risiken, Pläne | `docs/plaene/pakete.md`, `docs/plaene/risiken.md`, `docs/plaene/<issue>.md`, Vorlage `docs/plaene/vorlage.md` |
| Design System (Quelle) | `design-system/` (`tokens.json` → `tokens.css`, `components/*.md`, `bundle.css`) |
| Namen im Code | `docs/spec/glossar.md` |
| Rollen der Subagents | `.claude/agents/` (Modell und Denkstufe fest in der Datei) |
| Paketablauf | Skill `/umsetzen <issue>` in `.claude/skills/umsetzen/SKILL.md` |

Fakten nur aus dem Repository. Was nicht im Repository steht, fragst du Tim, statt es anzunehmen.

## Regeln, die nie gebrochen werden

1. **Merge durch den Lead ohne Einzelbestätigung, bis Tim widerruft** (`docs/entscheide/0008-merge-ohne-einzelbestaetigung.md`). Der Lead führt zusammen (`gh pr merge --squash`), sobald drei Bedingungen erfüllt sind: das Prüftor ist grün, der Prüfer hat «bestanden» geurteilt, Abnahme 1 ist kommentiert. Die Kurzzusammenfassung, was der Merge auslöst, steht weiterhin im Pull Request. Sie nennt Dateien und Bereiche, ausgelöste Workflows (Deploy, Migration mit Freigabe, Backup), die Wirkung auf Supabase und die Vorschau sowie Folgen für andere Zweige. Nach dem Merge meldet der Lead Tim das Endprodukt. Die Freigabe in `production` bleibt Tims Handgriff (Regel 2). Nach einem Widerruf gilt wieder `0001-merge-nach-bestaetigung.md`: kein Merge ohne ausdrückliches «Ja» im Chat.
2. **Produktions-Migration, Secrets und VAPID-Schlüssel sind Tims Handgriffe.** Der Agent liest keine Schlüssel, setzt keine Secrets und hat keinen Zugang zum Produktionsprojekt.
3. **VAPID-Schlüssel nie neu erzeugen** (sonst sind alle Push-Abos ungültig).
4. **Supabase nur `hydrovisor-dev`** (Projekt-Referenz `jalvmzgvxvidgmoxuglp`, fest im MCP-Server `supabase` aus `.mcp.json`) oder lokal mit `supabase start`. Einen kontoweiten Supabase-Connector nicht verwenden. Nie `supabase link`, `--linked` oder `supabase db push`; die Produktion migriert nur `deploy.yml` mit Tims Freigabe in der Umgebung `production`, `hydrovisor-dev` nur `dev-migration.yml` und `dev-seed.yml` (Entscheide 0006, 0007; der MCP-Server lehnt schreibende Anweisungen ab). Workflows startet der Lead selbst mit `gh workflow run` (`docs/entscheide/0005-workflows-durch-den-lead.md`); Läufe von `dev-migration.yml` gibt der Lead selbst frei, Merge und `deploy.yml` nur, wo Tim sie im Chat für den bestimmten Pull Request ausdrücklich überlässt.
5. **Nie direkt auf `main`**: jede Änderung auf einem Zweig (höchstens 28 Zeichen, Pakete `paket/<issue>-<kurz>`) mit Pull Request; Ruleset `main-schutz` verlangt Squash. Force-Push und endgültiges Löschen führt Tim selbst aus.
6. **Keine Personendaten im öffentlichen Repository**: keine Nachnamen, Adressen, Telefonnummern, E-Mail-Adressen, auch nicht in Fixtures oder Testdaten (`00_rueckfragen.md` Annahme 12).
7. **Referenzdateien sind Orakel**: `tests/golden/duengerrechner_referenz.csv` und `data/eval/tueten_referenz.csv` legt Tim an; Agenten ändern sie nie (Hash im Prüftor).

## Fachliche Grundregeln im Code

- **Ereignisse führen** (Konzept 8.1 Regel 2): Zustände (Phase, Status, Platz, Füllzustand, unsicher, Saatdatum, Ende einer Reservierung) sind Sichten oder ein Cache, den genau eine Datenbankfunktion aus Ereignissen nachrechnet. Die App schreibt nie direkt in ein Zustandsfeld; Korrektur = Storno plus neue Zeile.
- **«jetzt» als Parameter**: Jede Fachfunktion in `src/domain/` erhält `jetzt` und die Zeitzone (`Europe/Zurich`); `Date.now()` nur in der Oberfläche. Fälligkeiten sind Kalendertage in Zürich (`kalendertag()`).
- **`src/domain/` ist reines TypeScript** ohne Browser- oder Node-Abhängigkeit; Client (Vite) und Edge Functions (Deno) importieren dieselben Module (R5.1: gleiche Aufgabenliste).
- **Ein Schreibweg**: alle Erfassungen über `schreiben()` mit Client-UUID und Upsert (idempotent, Konzept 11.4).
- **Additive Migrationen** im Testbetrieb: neue Spalten nullable, Umbenennen in zwei Schritten über zwei Releases; nach dem 1.3.2027 nur `create or replace view` als Fehlerbehebung bis 17.3. Höchstens ein offener Pull Request mit `supabase/migrations` (Label `db-lock`).
- **RLS auf jeder Tabelle** über `ist_tim()`; `security definer`-Funktionen ohne eigene Prüfung entziehen `EXECUTE` ausdrücklich `anon` und `authenticated` (Default-Privileges von Supabase).
- **Datenart**: Push, Kalibrier-Fälligkeit, Auswertungen, Keimrate, k-Vorschlag und Säurebedarf nur mit `echt` (8.1 Regel 7).
- **Zahlen**: EC in Hundertsteln als Ganzzahl rechnen (R10.1); Mengen auf 0.5 ml; keine Komponente auf 0 runden.

## Oberfläche

- **Honor-Viewport 360 × 780 dp** bis zum Gerätetest (Konzept 17), E2E mit 360 × 640 dp; Messmaske ohne Scrollen.
- Regal-Masken mit `data-density="regal"`, Tasten 68 dp (`size-touch-regal`), keine Systemtastatur, keine Wischgesten; Schreibtisch-Masken Standarddichte 48 dp.
- Gestaltung nur mit dem Design System; fehlt ein Baustein, zuerst in `design-system/` ergänzen (Konzept 10, Entscheid R11).
- Thema für die ganze App nach `einstellung.thema`, Standard «Hell». Status nie nur über Farbe.
- Hash-Routing (`#/e/R-2.3`), Basis-URL `https://hydrovisor.github.io/` als Konstante.
- Texte deutsch, Du-Form, Doppel-s (Schweizer Rechtschreibung), Buttons beginnen mit dem Verb, keine Ausrufezeichen.

## Namen und Sprache

- Fachliche Namen deutsch ohne Umlaute (ae, oe, ue, ss): SQL `snake_case`, TypeScript `camelCase`, Typen `PascalCase`; technische Namen englisch (Konzept 11.2, Glossar).
- Commits, Pull Requests, Kommentare und Pläne deutsch mit Doppel-s. Commit-Betreff im Imperativ oder als Ergebnis, Bezug auf Issue (`#12`).
- Testnamen beginnen mit der AK-Nummer: `it('UC7-AK1 …')`, `-- UC0-AK2 …`; Randfälle zusätzlich `RF10`, `TZ5`, `TO2`, `TP1`, `TK1` (`06_tests.md` Abschnitt 2).

## Befehle

Die Skripte stehen seit Paket I0-01 (Grundgerüst) in `package.json`; ihre Namen sind der Vertrag für `pr.yml`. `test:mutation` endet mit Warnung, solange die Kernmodule fehlen.

| Zweck | Befehl |
|---|---|
| Abhängigkeiten | `npm ci` (Node 22 LTS) |
| Entwicklung | `npm run dev` |
| Lint und Format | `npm run lint` (ESLint mit Prettier) |
| Typen | `npm run typecheck` |
| Unit | `npm run test:unit` (Vitest, Bericht `reports/vitest.json`) |
| Mutation (Kern) | `npm run test:mutation` (StrykerJS, Module `rechner`, `zielbereich`, `aufgaben`, Mindestwert 80 %) |
| E2E | `npm run test:e2e` (Playwright, Chromium, 360 × 640, gegen `vite build` + `vite preview`) |
| Build | `npm run build` (schreibt `dist/version.json` mit Commit) |
| Datenbank lokal | `supabase start`, `supabase db reset`, `supabase test db` (pgTAP) |
| Typen erzeugen | `supabase gen types typescript --local > src/daten/datenbank.types.ts` |
| Edge Functions | `deno test supabase/functions` |
| W0-Validator | `npm run w0:pruefen` (V1 bis V13 ohne Datenbank, `-- --kandidaten` für `kandidaten/`) |
| Seed | `npm run seed -- --ziel lokal [--trocken]`; dev nur `gh workflow run dev-seed.yml -f zweig=<main\|paket/…> -f trockenlauf=true` (Entscheid 0007); Produktion nur `deploy.yml`, bis zum Scharfschalten `--trocken` |
| Seed-Tests [SQL] | `npm run test:seed` (Vitest gegen die lokale Datenbank nach `supabase db reset`, Bericht `reports/vitest-seed.json`) |
| Demo-Daten | `npm run demo -- --laden` / `--loeschen` (lokal; dev nur über `gh workflow run dev-seed.yml -f demo=laden -f trockenlauf=false`; ersetzt alle Demo- und Testdaten, lädt bei leerem Wissen zuerst `tests/fixtures/wissen`) |
| AK-Abdeckung | `node scripts/ak-abdeckung.ts --issue <nr> [--pr <nr>] --berichte reports` (ohne `--pr` warnen [Gerät] und [Eval] nur) |
| Rauchtest | `BASIS_URL=<adresse> ERWARTETER_COMMIT=<sha> npx playwright test -c playwright.rauchtest.config.ts` (in `deploy.yml` nach jedem Deploy; Rückfall-Probe: `deploy.yml` auf `main` mit `rueckfall_probe=true`, nur wenn `letzter-guter-stand` auf `main` zeigt) |
| Entwurf Datenmodell prüfen | `bash docs/spec/pruefung/lauf.sh` (Docker, PostgreSQL 17) |
| Sperr-Hook testen | `node --test .claude/hooks/sperre.test.mjs` |
| Wiederherstellungsprobe | `node scripts/wiederherstellungsprobe.mjs` (Ziel `dev`, nur Tim in der eigenen Konsole); Lead nur `--ziel lokal --identitaet <testschluessel> --archiv <datei.age>` |

## Paketablauf (Kurzfassung, vollständig im Skill)

1. `/umsetzen <issue>` legt `paket/<issue>-<kurz>` an und schreibt den Plan nach `docs/plaene/vorlage.md` in `docs/plaene/<issue>.md`.
2. Planfreigabe: Kern immer, Fachlogik nur mit Migration, Routine nie. Freigabe = Label `plan-frei` von Tim; ohne Label kein Code.
3. Testentwickler schreibt rote Tests im eigenen Commit (`Tests: …`); Lead programmiert, bis das Prüftor grün ist; Prüfer urteilt mit Plan-Code-Abgleich; höchstens zwei Runden (`runde-1`, `runde-2`), dann Frage an Tim.
4. Pull Request mit Vorlage, Label `abnahme-wartet`; Abnahme 1 in der Vorschau; Kurzzusammenfassung; Merge durch den Lead (Entscheid 0008); Abnahme 2 in der installierten App.
5. Statuskommentar im Issue nach jedem Planschritt und am Sitzungsende; Entscheide als Datei in `docs/entscheide/`.

Paketklassen, Rollen und Modelle: Konzept 12.2. Kern-Pakete: Datenmodell mit Zugriffsregeln (I0), Datenpfad mit Offline-Bündel (I0), Aufgaben-Rechnung (I1b), Passungs-Empfehlung (I2-4). Kern nur starten, wenn mindestens 50 % des Wochenkontingents frei sind; Verbrauch (`/usage`) ins Issue. Kein neues I1b- oder I2-Paket, solange mehr als 20 `offen-regal`-Einträge offen sind.

## Sperren (Konzept 12.4)

- `.claude/settings.json`: Deny-Regeln für Push auf `main`, Force-Push, `supabase db push`, `supabase link` (Bash und PowerShell), Lesen von `.env*`, Schreiben in `.claude/settings.json`, `.claude/hooks/`, `.mcp.json` und die Referenzdateien; `gh pr merge` erlaubt, aber nur nach Regel 1.
- `.claude/hooks/sperre.mjs` (PreToolUse für Bash, PowerShell und MCP): lehnt Push-Ziel `main`, Force-Push, `--all`, `supabase db push`/`link`/`--linked` und jede Supabase-Projekt-Referenz ausser `hydrovisor-dev` ab, auch in Anführungszeichen und in `bash -c`/`pwsh -Command`. Den Hook nicht umgehen; scheitert er fälschlich, Tim fragen.
- Prüftor `pr.yml`, Job `pruefstor` als Pflichtcheck; `test.only`, `test.skip`, neue Schnappschüsse und Änderungen an Testdateien des Testentwicklers ohne Freigabe lassen es scheitern.

## Umgebungen

| Umgebung | Daten | Zugriff des Agenten |
|---|---|---|
| lokal (`supabase start`) | Demo-Szenarien S1 bis S9 | voll |
| `hydrovisor-dev` | Demo-Szenarien, Testanlage Y | lesen über MCP mit fester Referenz, Migration über `dev-migration.yml` |
| `hydrovisor` (Produktion) | Anlage R echt | keiner |

Vorschau: Cloudflare Pages `hydrovisor-vorschau` baut jeden Zweig (`<zweig>.hydrovisor-vorschau.pages.dev`) mit dem Dev-Projekt. Produktion: GitHub Pages aus `main` über `deploy.yml`.

## Entscheide

- [0001 Merge nach Tims Bestätigung](docs/entscheide/0001-merge-nach-bestaetigung.md)
- [0002 Design System im Repository](docs/entscheide/0002-design-system-im-repository.md)
- [0003 Typen im Pull Request erzeugt](docs/entscheide/0003-typen-im-pull-request.md)
- [0004 Workflows vor dem Grundgerüst](docs/entscheide/0004-workflows-vor-dem-grundgeruest.md)
- [0005 Workflows startet der Lead](docs/entscheide/0005-workflows-durch-den-lead.md)
- [0009 Default-Modell für das Lesen der Saattüten](docs/entscheide/0009-ki-default-modell.md)
- [0008 Merge ohne Einzelbestätigung (bis auf Widerruf)](docs/entscheide/0008-merge-ohne-einzelbestaetigung.md)
- [0006 Migrationen nach hydrovisor-dev und Zugang ohne Handgriff](docs/entscheide/0006-dev-migration-und-zugang.md)
- [0007 Seed: Ladeskript, Ziele und [SQL]-Tests](docs/entscheide/0007-seed-ziele.md)
- Übrige Entscheide vom 1.11.2026: `docs/spec/00_rueckfragen.md` (R1 bis R13, W1 bis W14, Annahmen 1 bis 16)

## Arbeitsweise in der Sitzung

- Eine Sitzung, eine Aufgabe. Projektwissen in Dateien, nicht im Chat.
- Vor Änderungen am Datenmodell `docs/spec/02_datenmodell.sql` und `01_fachregeln.md` lesen; Abweichungen vom Konzept sind Fehler der Spezifikation.
- Annahmen im Code oder Plan mit (A) kennzeichnen und im Issue nennen.
- Keine Subagents ausserhalb der Rollen in `.claude/agents/`; Agent Teams nur für die zwei parallelen Prüfer in Kern-Paketen und das Vergleichspaket (Konzept 12.1).
