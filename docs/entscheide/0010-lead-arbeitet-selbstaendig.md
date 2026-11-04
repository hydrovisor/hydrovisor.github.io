# 0010 Der Lead arbeitet selbständig durch

Datum 4.11.2026 · Entscheid von Tim · ergänzt die Entscheide 0001, 0004, 0005, 0006, 0007 und 0008

**Tims Wortlaut im Chat (4.11.2026):** «Du kannst grundsätzlich immer selbst mergen und committen. Diese Erlaubnis habe ich dir schon gegeben. Zusätzlich darfst du grundsätzlich Änderungen im Terminal umsetzen. Prüfe dies bitte in den Regeln, passe diese an. Ich gebe dir nochmals den klaren Auftrag. Du bist Projektleader. Ich will nur noch ganz wichtige und absolut notwendige Sachen bestätigen.» Zuvor: «Du darfst Computer und Browser-Use für sämtliche Schritte entsprechend anwenden.» und «Du hast die Erlaubnis wiederkehrend im Terminal zu arbeiten.» Auf die Frage, ob der Lead Deploys ohne Produktions-Migration selbst in `production` freigeben darf: «Ja, ohne Migration».

**Entscheid.** Der Lead führt das Projekt selbständig und fragt Tim nicht nach Zwischenschritten. Ohne Rückfrage erledigt er:
- **Code und Zweige:** committen, auf Zweige pushen, Pull Requests eröffnen und mergen (Bedingungen aus Entscheid 0008).
- **Workflows:** starten (Entscheid 0005) und Läufe von `dev-migration.yml` freigeben (Entscheid 0006).
- **Freigabe in `production` ohne Migration:** Der Lead gibt einen wartenden Lauf von `deploy.yml` selbst frei, wenn der Deploy die Produktionsdatenbank nicht verändert. Dafür müssen zwei Bedingungen gelten. Erstens ist `git diff --name-only letzte-migration <sha> -- supabase/migrations` leer; das ist dieselbe Basis, die `deploy.yml` verwendet. Zweitens läuft der Produktions-Seed in `deploy.yml` noch mit `--trocken`. Die Freigabe des Leads umfasst auch die Edge Functions. Im Kommentar der Freigabe nennt der Lead den Grund. Fehlt das Tag `letzte-migration`, gibt Tim frei. Nach dem Scharfschalten des Seeds (Entscheid 0007) gibt Tim auch Deploys frei, die `data/`, `scripts/seed*` oder `src/domain/w0/` ändern.
- **Terminal:** Befehle im Terminal-Panel und in eigenen Shells ausführen, auch Installationen und Skripte. Davon ausgenommen sind die Sperren.
- **Browser und Desktop:** Masken ausfüllen, Dashboards lesen und Einstellungen in `hydrovisor-dev`, GitHub und Cloudflare prüfen. Nie im Produktionsprojekt und nie mit Schlüsseln.
- **Planfreigabe für Fachlogik mit Migration:** Der Lead setzt `plan-frei` selbst, nachdem der Planer fertig ist. Er nennt im Statuskommentar die Migration und die Annahmen.
- **Abnahme 1 in der Vorschau:** Der Lead prüft im eingebauten Browser mit 360 × 640, bei Paketen ohne Maske über Tests und Trockenlauf. Er schreibt den Kommentar nach `.github/abnahme_vorlage.md` mit «Prüfer: Lead». [Gerät]-AK setzt er nie auf «ok». AK am Regal stehen auf «offen-regal» mit Label `offen-regal` (Konzept 12.5), die übrigen [Gerät]-AK auf «offen-abnahme-2», ohne Label. Tim belegt sie alle mit Abnahme 2 am Honor. Damit erfüllt auch der Kommentar des Leads die Merge-Bedingung «Abnahme 1 kommentiert» aus Entscheid 0008.
- **Eskalation nach zwei Prüfrunden:** Der Lead entscheidet selbst, ob er eine dritte Runde fährt, den Plan ändert oder das Paket teilt. Den Entscheid hält er im Issue fest. Die Hebung auf Fable oder auf eine höhere Denkstufe bleibt bei Tim (Konzept 12.2, Fable-Grenze).
- **Technische Details, die das Repository offenlässt:** Der Lead entscheidet und kennzeichnet sie mit (A).
- **Wiederaufnahme eines halbfertigen Zweigs:** Der Lead sichert die Arbeit zuerst auf einem Sicherungszweig. Schon gepushte Commits nimmt er mit `git revert` zurück, ohne Force-Push. Tim muss er dafür nicht fragen.

Tims Handgriffe bündelt der Lead in **einer** Nachricht oder in **einem** Skript, das alle Schlüsselabfragen nacheinander stellt. Ergebnisse prüft der Lead selbst über Protokolle, Releases, Listen und Berichtsdateien. Er bittet Tim nicht um eine Rückmeldung.

**Bleibt bei Tim (ganz wichtig oder nicht übertragbar):**
1. **Schlüssel und Anmeldungen.** Dazu gehören Secrets, API-Schlüssel, Tokens, der `age`-Schlüssel, VAPID, der Supabase-Login und Passwörter. Der Agent darf sie technisch nicht lesen und nicht eingeben, auch nicht mit Erlaubnis (CLAUDE.md Regeln 2 und 3).
2. **Produktion.** Darunter fallen der Zugriff auf das Produktionsprojekt (Sperr-Hook) und jede Freigabe von `deploy.yml` in `production`, die die Produktionsdatenbank verändert: eine Migration oder, nach dem Scharfschalten, ein Seed.
3. **Planfreigabe der Kern-Pakete und der Fehler gegen eine Referenzdatei.** Darunter fallen alle Pakete der Klasse K in `docs/plaene/pakete.md` (derzeit I1b-02 und I2-04) und die Kern-Pool-Posten nach Konzept 13.4. Ebenso jedes Fachlogik-Fehler-Issue aus einer Abweichung von `tests/golden/duengerrechner_referenz.csv` oder `data/eval/tueten_referenz.csv` (Konzept 12.5).
4. **Abnahme 2 am Honor und die [Gerät]-AK.** Dafür braucht es das Gerät.
5. **Endgültiges Löschen und Force-Push.**
6. **Fachliche Fakten und Inhalte des Konzepts,** die nicht im Repository stehen. Neue Konzeptfassungen gehören dazu.
7. **Änderungen an den Sperren:** `.claude/settings.json`, `.claude/hooks/` und `.mcp.json`.

**Abweichung vom Konzept v1.3.** Mit diesem Entscheid überträgt Tim als Product Owner drei Kontrollpunkte auf den Lead, die das Konzept ihm zuweist:
- die Planfreigabe für Fachlogik mit Migration (12.2, 12.3);
- Abnahme 1 (12.1, 12.3, 12.5);
- die Frage nach zwei Prüfrunden (12.2, 12.3).

Die Abweichung gilt ab sofort. Bis zur nächsten Konzeptfassung geht dieser Entscheid den genannten Stellen vor; dort wird sie als Eintrag in Anhang B.2 nachgeführt. Wie im Konzept bleiben Abnahme 2 und die Planfreigabe der Kern-Pakete.

**Widerruf.** Ein Satz von Tim im Chat genügt. Danach gelten wieder die Konzeptstellen zu Planfreigabe, Abnahme 1 und Eskalation, und jede Freigabe in `production` liegt wieder bei Tim. Entscheid 0008 bleibt bis zu seinem eigenen Widerruf in Kraft.

**Folgen.**
- `CLAUDE.md`: Einleitung, Regeln 1 und 4 (Merge und Deploy), Paketablauf und Liste der Entscheide angepasst.
- Entscheide 0004, 0007 und 0008: Nachtrag zur Freigabe in `production`.
- Skill `/umsetzen`: Schritte 0.3, 1.4, 2, 4.3, 5.3 und 5.5 angepasst.
- `.github/abnahme_vorlage.md`: Feld «Prüfer» ergänzt.
- Die Entscheide 0001, 0005 und 0006 haben einen Nachtrag.
- Die Sperren bleiben unverändert.
