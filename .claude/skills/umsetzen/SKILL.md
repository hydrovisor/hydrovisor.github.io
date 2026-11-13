---
name: umsetzen
description: Paketablauf nach Konzept 12.3 für ein Issue aus docs/plaene/pakete.md – Zweig, Plan, Planfreigabe, rote Tests, Umsetzung, Prüfer, Pull Request, Abnahme und Merge durch den Lead (Entscheid 0008). Aufruf /umsetzen <issue>; setzt nach einem Unterbruch am letzten Stand fort.
argument-hint: <issue-nummer>
---

# /umsetzen <issue>

Zustand nur in Git und im Issue. Beim Aufruf zuerst den Stand bestimmen, dann am passenden Schritt weitermachen.

## 0 Stand bestimmen

1. `gh issue view $ARGUMENTS --json number,title,labels,body,comments` lesen: Paketklasse (Routine, Fachlogik, Kern), Migration ja/nein, AK-Liste, Labels (`plan-wartet`, `plan-frei`, `runde-1`, `runde-2`, `abnahme-wartet`, `db-lock`).
2. Zweig `paket/<issue>-<kurz>` (höchstens 28 Zeichen) vorhanden? Plandatei `docs/plaene/<issue>.md` vorhanden? Letzter Statuskommentar im Issue?
3. Halbfertiger Zweig ohne passenden Statuskommentar: zuerst einen Sicherungszweig `sicherung/<issue>-<datum>` vom aktuellen Stand pushen. Dann die Commits nach dem letzten Statuskommentar zurücknehmen: noch nicht gepusht mit `git reset`, schon gepusht mit `git revert --no-edit <status>..HEAD` und normalem Push, nie mit Force-Push. Das geschieht ohne Rückfrage (Entscheid 0010). Danach die lokale Datenbank mit `supabase db reset` neu aufbauen.
4. Kern-Paket: starten, solange höchstens 95 % des Wochenkontingents verbraucht sind (Entscheid 0011); ist das 5-Stunden-Fenster voll, bis zu seinem Ende warten; über 95 % kein neues Paket, laufendes sauber anhalten und Tim melden.
5. I1b- oder I2-Paket: `gh issue list --label offen-regal --state open --json number --jq length` zählen; bei mehr als 20 offenen Einträgen kein neues Paket starten, Tim melden und anhalten (Konzept 12.4, E5).

## 1 Zweig und Plan

1. `git switch -c paket/<issue>-<kurz> origin/main`. Routine-Pakete ohne Migration dürfen in einem eigenen Worktree laufen, höchstens 2 gleichzeitig.
2. Plan nach `docs/plaene/vorlage.md` in `docs/plaene/<issue>.md`:
   - Routine: der Lead schreibt einen Kurzplan selbst.
   - Fachlogik: Subagent `planer`.
   - Kern: Subagent `planer_kern`. Vergleichspakete I0-03 und I0-04 (Konzept 12.7 a): `planer_kern` und `planer` schreiben je einen Plan in `docs/plaene/<issue>-plan-a.md` und `-plan-b.md` (Zuordnung ausgelost, nur im Issue-Kommentar «Zuordnung (erst nach der Bewertung öffnen)»); nach Tims verdeckter Bewertung wird der gewählte Plan als `docs/plaene/<issue>.md` freigegeben.
3. Plan committen (`Plan: <issue> <kurz>`), pushen und als Kommentar ins Issue (`gh issue comment`).
4. Planfreigabe durch Tim nur bei Kern-Paketen und bei Fehlern gegen eine Referenzdatei (Konzept 12.5): Label `plan-wartet` setzen, Statuskommentar schreiben, Tim im Chat um «Plan freigegeben» bitten und **anhalten**. Nach seinem Satz setzt der Lead `plan-frei` und zitiert ihn mit Commit im Issue (Entscheid 0014). Fachlogik mit Migration: Der Lead setzt `plan-frei` selbst und nennt im Statuskommentar die Migration und die Annahmen (Entscheid 0010). Sonst weiter ohne Halt.

## 2 Freigabe prüfen

Beim Fortsetzen eines Kern-Pakets: `gh issue view` zeigt Label `plan-frei` und Tims Satz «Plan freigegeben» mit Commit-Kürzel (als Kommentar von Tim oder vom Lead zitiert, Entscheid 0014). Ohne Label kein Code. Weicht der Plan inzwischen vom freigegebenen Kürzel ab, erneut Freigabe holen. Bei Fachlogik mit Migration genügt die Freigabe des Leads (Entscheid 0010).

## 3 Tests, Migration, Code

1. Fachlogik und Kern: Subagent `testentwickler` schreibt rote Tests im eigenen Commit `Tests: <issue> <kurz>` und trägt die Dateien in `tests/testentwickler.txt` ein (Grundlage des Testdatei-Wächters). Routine: der Lead schreibt die Tests selbst.
2. Migration: Subagent `datenbank` (nur `supabase/`); danach erzeugt der Lead die Typen neu (`supabase gen types typescript --local > src/daten/datenbank.types.ts`). Vorher prüfen, dass kein anderer offener Pull Request das Label `db-lock` trägt.
3. Der Lead programmiert, bis das Prüftor lokal grün ist: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npm run build`, bei Datenbank `supabase db reset && supabase test db`, bei Edge Functions `deno test supabase/functions`, bei Kern `npm run test:mutation`.
4. Testdateien des Testentwicklers nur mit Begründung im Commit ändern; der Prüfer begründet die Freigabe schriftlich in seinem Urteil, danach setzt der Lead das Label `tests-freigegeben` (der Prüfer hat keine Schreibrechte).

## 4 Prüfer

1. Routine: `pruefer`. Fachlogik: `pruefer_fachlogik`. Kern: `pruefer_fachlogik` und `pruefer_sicherheit` parallel als Agent Team.
2. Auftrag an den Prüfer: Issue, Plan, Zweig; Urteil mit Befundliste und Plan-Code-Abgleich.
3. «nachbessern»: Label `runde-1` bzw. `runde-2`, Befunde beheben, erneut prüfen. Nach zwei Runden ohne «bestanden» entscheidet der Lead: dritte Runde, Plan ändern oder Paket teilen. Den Entscheid hält er im Issue fest (Entscheid 0010). Die Hebung auf Fable oder auf eine höhere Denkstufe bleibt bei Tim. Tim fragt er nur, wenn eine fachliche Frage offen ist, die das Repository nicht beantwortet.

## 5 Pull Request und Abnahme

1. `git push -u origin paket/<issue>-<kurz>`; Pull Request mit `.github/pull_request_template.md`, alle Pflichtfelder ausgefüllt (Paketklasse, Schätzung, Tims Minuten, Runden, Prüferbefunde, Modell und Denkstufe, Verbrauch `/usage`); `Closes #<issue>`; Labels am Pull Request: Klasse (`routine`, `fachlogik` oder `kern`; `kern` löst den Mutationstest aus), `db-lock` bei Änderungen in `supabase/migrations`, `abnahme-wartet`.
2. Prüftor in GitHub abwarten (Job `pruefstor`).
3. Abnahme 1: Der Lead prüft selbst in der Vorschau `<zweig>.hydrovisor-vorschau.pages.dev` im eingebauten Browser mit 360 × 640 und schreibt den Abnahmekommentar nach `.github/abnahme_vorlage.md` mit «Prüfer: Lead» (Entscheid 0010; ohne Maske über Tests und Trockenlauf). [Gerät]-AK setzt er nie auf «ok»: AK am Regal auf «offen-regal» mit Label `offen-regal` (höchstens 20 offen), die übrigen [Gerät]-AK auf «offen-abnahme-2» ohne Label. Danach entfernt der Lead das Label `abnahme-wartet`; das löst das Prüftor neu aus, und die AK-Abdeckung liest die [Gerät]-Nummern aus dem Kommentar.
4. **Kurzzusammenfassung, was der Merge auslöst** (Dateien, Workflows, Migration mit Freigabe, Supabase, Vorschau, Folgen für andere Zweige) in den Pull Request.
5. Merge durch den Lead ohne Einzelbestätigung (Entscheid 0008, bis Tim widerruft): Prüftor grün, Prüfer «bestanden», Abnahme 1 kommentiert, dann `gh pr merge <nr> --squash` und Tim das Endprodukt melden. Danach den wartenden Lauf von `deploy.yml` in `production`: Der Lead gibt ihn selbst frei, wenn der Produktions-Seed noch mit `--trocken` läuft und `git diff --name-only letzte-migration <sha> -- supabase/migrations` leer ist (Entscheid 0010) oder nur additive Migrationen enthält, die vorher mit `dev-migration.yml` auf `hydrovisor-dev` liefen (Entscheid 0024); im Kommentar der Freigabe Migration und Entscheid nennen, danach Rauchtest, `version.json` und Tags prüfen. Bei `seed_scharf`, einer nicht additiven Migration oder fehlendem Tag `letzte-migration` anhalten für Tims Freigabe; nach dem Scharfschalten des Seeds gilt das auch bei Änderungen in `data/`, `scripts/seed*` oder `src/domain/w0/`. Danach Abnahme 2 in der installierten App (Info-Seite zeigt den Commit): Tim belegt alle [Gerät]-AK, die in Abnahme 1 offen waren. Nach einem Widerruf: erst nach Tims ausdrücklichem «Ja» im Chat.

## 6 Statuskommentar (nach jedem Schritt und am Sitzungsende)

```
Stand <Datum> · Schritt <n> · Commit <kürzel>
Erledigt: …
Offen: …
Nächster Befehl: /umsetzen <issue>
Annahmen: … (A)
Verbrauch: <x> % des Wochenkontingents · Modell und Denkstufe: …
```

Entscheide, die über das Paket hinaus gelten, als Datei in `docs/entscheide/` und in `CLAUDE.md` verlinken.
