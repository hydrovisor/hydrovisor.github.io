---
name: umsetzen
description: Paketablauf nach Konzept 12.3 für ein Issue aus docs/plaene/pakete.md – Zweig, Plan, Planfreigabe, rote Tests, Umsetzung, Prüfer, Pull Request, Abnahme und Merge nach Tims Bestätigung. Aufruf /umsetzen <issue>; setzt nach einem Unterbruch am letzten Stand fort.
argument-hint: <issue-nummer>
---

# /umsetzen <issue>

Zustand nur in Git und im Issue. Beim Aufruf zuerst den Stand bestimmen, dann am passenden Schritt weitermachen.

## 0 Stand bestimmen

1. `gh issue view $ARGUMENTS --json number,title,labels,body,comments` lesen: Paketklasse (Routine, Fachlogik, Kern), Migration ja/nein, AK-Liste, Labels (`plan-wartet`, `plan-frei`, `runde-1`, `runde-2`, `abnahme-wartet`, `db-lock`).
2. Zweig `paket/<issue>-<kurz>` (höchstens 28 Zeichen) vorhanden? Plandatei `docs/plaene/<issue>.md` vorhanden? Letzter Statuskommentar im Issue?
3. Halbfertiger Zweig ohne passenden Statuskommentar: auf den Commit des letzten Statuskommentars zurücksetzen (Tim fragen, bevor Arbeit verloren geht) und die lokale Datenbank mit `supabase db reset` neu aufbauen.
4. Kern-Paket: nur starten, wenn mindestens 50 % des Wochenkontingents frei sind und ein 5-Stunden-Fenster beginnt; sonst Tim melden und anhalten.

## 1 Zweig und Plan

1. `git switch -c paket/<issue>-<kurz> origin/main`. Routine-Pakete ohne Migration dürfen in einem eigenen Worktree laufen, höchstens 2 gleichzeitig.
2. Plan nach `docs/plaene/vorlage.md` in `docs/plaene/<issue>.md`:
   - Routine: der Lead schreibt einen Kurzplan selbst.
   - Fachlogik: Subagent `planer`.
   - Kern: Subagent `planer_kern`; für die Vergleichspakete (Konzept 12.7 a) zusätzlich `planer` in `docs/plaene/<issue>-opus.md`.
3. Plan committen (`Plan: <issue> <kurz>`), pushen und als Kommentar ins Issue (`gh issue comment`).
4. Planfreigabe nötig (Kern immer, Fachlogik nur mit Migration)? Dann Label `plan-wartet` setzen, Statuskommentar schreiben und **anhalten**. Sonst weiter ohne Halt.

## 2 Freigabe prüfen

Beim Fortsetzen: `gh issue view` zeigt Label `plan-frei` und Tims Kommentar «Plan freigegeben» mit Commit-Kürzel. Ohne Label kein Code, wenn eine Freigabe nötig ist. Weicht der Plan inzwischen vom freigegebenen Kürzel ab, erneut Freigabe holen.

## 3 Tests, Migration, Code

1. Fachlogik und Kern: Subagent `testentwickler` schreibt rote Tests im eigenen Commit `Tests: <issue> <kurz>`. Routine: der Lead schreibt die Tests selbst.
2. Migration: Subagent `datenbank`; Label `db-lock` setzen (höchstens ein offener Pull Request mit `supabase/migrations`).
3. Der Lead programmiert, bis das Prüftor lokal grün ist: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npm run build`, bei Datenbank `supabase db reset && supabase test db`, bei Edge Functions `deno test supabase/functions`, bei Kern `npm run test:mutation`.
4. Testdateien des Testentwicklers nur mit Begründung im Commit ändern; der Prüfer gibt sie frei (Label `tests-freigegeben`).

## 4 Prüfer

1. Routine: `pruefer`. Fachlogik: `pruefer_fachlogik`. Kern: `pruefer_fachlogik` und `pruefer_sicherheit` parallel als Agent Team.
2. Auftrag an den Prüfer: Issue, Plan, Zweig; Urteil mit Befundliste und Plan-Code-Abgleich.
3. «nachbessern»: Label `runde-1` bzw. `runde-2`, Befunde beheben, erneut prüfen. Nach zwei Runden ohne «bestanden» anhalten und Tim fragen (Eskalation, Konzept 12.2).

## 5 Pull Request und Abnahme

1. `git push -u origin paket/<issue>-<kurz>`; Pull Request mit `.github/pull_request_template.md`, alle Pflichtfelder ausgefüllt (Paketklasse, Schätzung, Tims Minuten, Runden, Prüferbefunde, Modell und Denkstufe, Verbrauch `/usage`); Label `abnahme-wartet`; `Closes #<issue>`.
2. Prüftor in GitHub abwarten (Job `pruefstor`).
3. Abnahme 1: Tim prüft in der Vorschau `<zweig>.hydrovisor-vorschau.pages.dev`; [Gerät]-AK am Regal bekommen `offen-regal` (höchstens 20 offen).
4. **Kurzzusammenfassung, was der Merge auslöst** (Dateien, Workflows, Migration mit Freigabe, Supabase, Vorschau, Folgen für andere Zweige) und **anhalten**.
5. Erst nach Tims ausdrücklichem «Ja» im Chat: `gh pr merge <nr> --squash`. Danach Abnahme 2 in der installierten App (Info-Seite zeigt den Commit).

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
