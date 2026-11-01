# Prüfbericht Auftrag 3 (Arbeitsweise und Plan)

Prüfer-Subagent mit frischem Kontext, nur lesen. Massstab: Konzept v1.2 Kapitel 11, 12, 13, 16.3, Spezifikation `docs/spec/`, Use Cases F4; Tims Zusatzauftrag vom 1.11.2026 (Merge-Regel und `gh pr merge` erlaubt, `.mcp.json` fest auf `hydrovisor-dev`, Design-System-Paket vor I1a).

## Durchgang 1 (Stand d566af6): nachbessern, 1 hoch, 11 mittel, 12 gering

Ohne Befund: Vollständigkeit gegen 16.3 und den Zusatzauftrag, sieben Rollen mit Modell und Denkstufe nach 12.2, Summen und Termine in `pakete.md`, Zuordnung aller AK aus UC0 bis UC14, den Abläufen und C4, keine Personendaten und Schlüssel, Verhalten beim Merge (nichts wird ausgelöst ausser dem täglichen Backup-Lauf mit Warnung).

Alle Befunde behoben im Commit nach `d566af6` (Zweig `auftrag-3-arbeitsweise`):

| ID | Schwere | Befund | Behebung |
|---|---|---|---|
| E1 | hoch | `supabase test db \| tee` ohne `pipefail`: rote pgTAP-Tests wären grün | `defaults: run: shell: bash` (pipefail) in allen Workflows; `grep -q` in Pipes ersetzt (SIGPIPE) |
| E2 | mittel | Hook-Umgehungen: `git.exe`, Anführungszeichen, globale Optionen, `bash -c`, `--all`, `HEAD`/`@` vom Zweig main | Wortzerlegung mit Anführungszeichen, `git(.exe)` mit globalen Optionen, verschachtelte Shell-Aufrufe, `--all`; 25 neue Testfälle |
| E3 | mittel | Projekt-Referenz in Anführungszeichen, `--linked` | Regex mit Anführungszeichen; `--linked`, `supabase --debug db push`, `supabase@latest link` gesperrt |
| E4 | mittel | `deploy.yml` per `workflow_dispatch` auf jedem Zweig | Jobs nur bei `refs/heads/main`; `gh workflow run` in Hook und Deny; Deployment-Branches der Umgebungen als Tims Handgriff (Entscheid 0004) |
| E5 | mittel | Migration nur am letzten Push gemessen | Vergleich gegen Tag `letzte-migration`, nachgezogen nach erfolgreicher Migration |
| E6 | mittel | E2E ohne lokale Datenbank und Demo-Szenarien | e2e-Job baut die Datenbank, lädt Seed und Demo, setzt `VITE_SUPABASE_*` |
| E7 | mittel | Labels `kern` und `db-lock` nie am PR; Mutation nie ausgelöst | Skill setzt Labels am PR; Mutation auch bei Änderungen an `rechner`, `zielbereich`, `aufgaben` |
| E8 | mittel | Testdatei-Wächter nur innerhalb eines PR | Manifest `tests/testentwickler.txt` auf main plus `Tests:`-Commits des PR |
| E9 | mittel | Sperre «mehr als 20 offen-regal» fehlte | Skill Schritt 0 und CLAUDE.md |
| E10 | mittel | Durchsatz-Bedingung des Prüfpunkts (3.6 PT/Woche) verfehlt | I0-10, I0-11 und DS-01 bis 30.11.: 9.25 PT / 2.43 Wochen = 3.8; Messweise festgelegt, Risiko RR13 genannt |
| E11 | mittel | Paketminuten gegen Budget 13.3 unklar | Unterschied erklärt; Massstab für 13.5 bleibt 13.3 |
| E12 | mittel | DS-01 nach der ersten Regal-Maske I0-07 | DS-01 am 22.11., vor I0-07 |
| E13 | gering | Parallel-Beispiel mit Migrationspaket | Beispiel ersetzt |
| E14 | gering | Ablageort und Benennung der Vergleichspläne widersprüchlich | neutrale Namen `-plan-a`/`-plan-b`, Zuordnung im Issue-Kommentar, Schreibrechte der Planer angepasst |
| E15 | gering | I0-11 als Routine mit möglicher Migration | Klasse F, 75 Minuten |
| E16 | gering | Deny-Regeln nur für Bash, keine Schreibsperren | PowerShell-Regeln, Edit/Write-Sperren für Sperrdateien und Referenzdateien im Entwurf von `.claude/settings.json` |
| E17 | gering | gelöschte Referenzdatei unbemerkt | Fehler, wenn die Variable gesetzt ist und die Datei fehlt |
| E18 | gering | Muster zu eng, AK-Skript dauerhaft optional, Namen uneinheitlich | `skipIf`, `todo`, `fixme`, `x`/`f`-Varianten, Inline-Schnappschüsse; Fehler, wenn das Skript auf main schon existierte; `scripts/ak-abdeckung.ts` wie `06_tests.md`; `npm run demo` |
| E19 | gering | Neuer Prüftor-Lauf nach dem Abnahmekommentar offen; Label durch schreibunfähigen Prüfer | Lead entfernt `abnahme-wartet` nach dem Kommentar; Lead setzt `tests-freigegeben` nach der Begründung des Prüfers |
| E20 | gering | Datenbank-Agent erzeugt Typen ausserhalb `supabase/` | Typen erzeugt der Lead |
| E21 | gering | C4-AK2 am Paket I0-03 | eigener Posten «Einfrieren 1.4.2027» |
| E22 | gering | Fehlalarme (Commit-Text, grep), Zeilentrennung wirkungslos | erst Zeilen, dann Teilbefehle; Supabase nur als Befehl; Testfälle |
| E23 | gering | kontoweiter Supabase-Connector neben `.mcp.json` | Regel in CLAUDE.md; Abschalten als Tims Handgriff (Entscheid 0004) |
| E24 | gering | Secrets job-weit, Aktionen nur per Tag | Secrets je Schritt; alle Aktionen per Commit auf die aktuelle Version angeheftet |

**Stand:** keine offenen Befunde. Die Behebungen sind lokal geprüft (Hook-Tests 57 von 57, YAML gültig); `pr.yml` läuft im Pull Request selbst. Ein zweiter Prüferdurchgang fand nicht statt.

## Offen bei Tim

`.claude/settings.json` hat der Agent nicht anlegen dürfen (Sicherheitsprüfung des Auto-Modus gegen Selbständerung); Tim legt die Datei aus dem vorbereiteten Entwurf an.
