# 0024 Produktions-Migration gibt der Lead frei

Datum 13.11.2026 · Entscheid von Tim im Chat · ändert Entscheid 0010 (Punkt 2 der Liste «Bleibt bei Tim») und CLAUDE.md Regeln 1, 2 und 4

**Tims Wortlaut im Chat (13.11.2026).** Zum wartenden Deploy-Lauf 43469076407 mit der Migration `20261113120000_tuetenfoto.sql` (#207): «Du hast die Berechtigungen Review, Deploy, dann Production, Approve und Deploy. Kannst du direkt selbst umsetzen, wenn du es nicht kannst, direkt via GitHub, nutze Browser Use.» Auf die Frage des Leads, ob er die Freigabe von `production` mit Migration als Entscheid festhalten soll: «ja, halte es als entscheid fest».

## Entscheid

Der Lead gibt einen wartenden Lauf von `deploy.yml` in der Umgebung `production` auch dann selbst frei, wenn er eine Migration in die Produktion einspielt. Dafür müssen vier Bedingungen gelten:

1. Der Pull Request ist nach Regel 1 gemergt: Das Prüftor ist grün, das schliesst pgTAP gegen die neue Migration ein. Der Prüfer hat «bestanden» geurteilt, bei RLS, Rechten oder `security definer` auch der Prüfer Sicherheit. Abnahme 1 ist kommentiert.
2. Dieselbe Migration ist zuvor mit `dev-migration.yml` fehlerfrei auf `hydrovisor-dev` gelaufen.
3. Die Migration ist additiv (Konzept 11.5): neue Tabellen, Spalten nullable, Sichten mit `create or replace`. Sie löscht oder ändert keine bestehenden Daten. Nach dem 1.3.2027 gelten weiter nur Fehlerbehebungen mit `create or replace view` bis zum 17.3.
4. Der Lauf startet ohne `seed_scharf`, der Produktions-Seed bleibt also trocken.

Im Kommentar der Freigabe nennt der Lead die Migration und diesen Entscheid. Danach prüft er Rauchtest, `version.json` und die Tags `letzte-migration` und `letzter-guter-stand`, hält das Ergebnis im Issue fest und meldet es Tim.

## Bleibt bei Tim

- Der Lauf mit `seed_scharf=true` (Entscheid 0017) sowie, nach dem Scharfschalten des Seeds, Deploys mit Änderungen in `data/`, `scripts/seed*` oder `src/domain/w0/` (Entscheid 0010).
- Jede Migration, die nicht additiv ist, also Daten löscht, Spalten entfernt oder umbenennt oder Pflichtspalten ohne Vorgabe einführt.
- Secrets, VAPID-Schlüssel, Anmeldungen und der Zugriff auf das Produktionsprojekt (CLAUDE.md Regeln 2 und 3). Der Agent liest weiter keine Schlüssel und hat keinen Zugang zur Produktionsdatenbank. Er gibt nur den Workflow frei, der die Migration einspielt.
- Endgültiges Löschen und Force-Push.

## Widerruf

Ein Satz von Tim im Chat genügt. Danach gibt wieder nur Tim Deploys mit Migration in `production` frei (Entscheid 0010 in der Fassung vor diesem Entscheid).

## Folgen

- `CLAUDE.md`: Einleitung, Regeln 1, 2 und 4 sowie die Liste der Entscheide angepasst.
- `.claude/skills/umsetzen/SKILL.md` Schritt 5.5 angepasst.
- Der erste Lauf nach dieser Regel ist 43469076407 (#207): Migration, Pages und Rauchtest grün, die Produktion zeigt `0.1.0+78dd023`.
