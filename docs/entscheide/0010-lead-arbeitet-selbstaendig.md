# 0010 Der Lead arbeitet selbständig durch

Datum 4.11.2026 · Entscheid von Tim · ergänzt `0005-workflows-durch-den-lead.md` und `0008-merge-ohne-einzelbestaetigung.md`

**Tims Wortlaut im Chat (4.11.2026):** «Du kannst grundsätzlich immer selbst mergen und committen. Diese Erlaubnis habe ich dir schon gegeben. Zusätzlich darfst du grundsätzlich Änderungen im Terminal umsetzen. Prüfe dies bitte in den Regeln, passe diese an. Ich gebe dir nochmals den klaren Auftrag. Du bist Projektleader. Ich will nur noch ganz wichtige und absolut notwendige Sachen bestätigen.» Zuvor: «Du darfst Computer und Browser-Use für sämtliche Schritte entsprechend anwenden.» und «Du hast die Erlaubnis wiederkehrend im Terminal zu arbeiten.»

**Entscheid.** Der Lead führt das Projekt selbständig und fragt Tim nicht nach Zwischenschritten. Ohne Rückfrage erledigt er:
- **Code und Zweige:** committen, auf Zweige pushen, Pull Requests eröffnen und mergen (Bedingungen aus Entscheid 0008).
- **Workflows:** starten und Läufe von `dev-migration.yml` freigeben (Entscheid 0005).
- **Terminal:** Befehle im Terminal-Panel und in eigenen Shells ausführen, auch Installationen und Skripte. Davon ausgenommen sind die Sperren.
- **Browser und Desktop:** Masken ausfüllen, Dashboards lesen und Einstellungen in `hydrovisor-dev`, GitHub und Cloudflare prüfen. Nie im Produktionsprojekt und nie mit Schlüsseln.
- **Planfreigabe für Fachlogik mit Migration:** Der Lead setzt `plan-frei` selbst, nachdem der Planer fertig ist. Er nennt im Statuskommentar die Migration und die Annahmen.
- **Eskalation nach zwei Prüfrunden:** Der Lead entscheidet selbst, ob er eine dritte Runde fährt, den Plan ändert oder das Paket teilt. Den Entscheid hält er im Issue fest.
- **Technische Details, die das Repository offenlässt:** Der Lead entscheidet und kennzeichnet sie mit (A).
- **Wiederaufnahme eines halbfertigen Zweigs:** Der Lead sichert die Arbeit zuerst auf einem Sicherungszweig. Tim muss er dafür nicht fragen.

Tims Handgriffe bündelt der Lead in **einer** Nachricht oder in **einem** Skript, das alle Schlüsselabfragen nacheinander stellt. Ergebnisse prüft der Lead selbst über Protokolle, Releases, Listen und Berichtsdateien. Er bittet Tim nicht um eine Rückmeldung.

**Bleibt bei Tim (ganz wichtig oder nicht übertragbar):**
1. **Schlüssel und Anmeldungen.** Dazu gehören Secrets, API-Schlüssel, Tokens, der `age`-Schlüssel, VAPID, der Supabase-Login und Passwörter. Der Agent darf sie technisch nicht lesen und nicht eingeben, auch nicht mit Erlaubnis (CLAUDE.md Regeln 2 und 3).
2. **Produktion.** Darunter fallen der Zugriff auf das Produktionsprojekt (Sperr-Hook), die Freigabe von `deploy.yml` in der Umgebung `production` und die Produktions-Migration.
3. **Planfreigabe der Kern-Pakete.** Das sind die Aufgaben-Rechnung (I1b) und die Passungs-Empfehlung (I2-4).
4. **Abnahme 2 am Honor.** Sie braucht das Gerät.
5. **Endgültiges Löschen und Force-Push.**
6. **Fachliche Fakten und Inhalte des Konzepts,** die nicht im Repository stehen. Neue Konzeptfassungen gehören dazu.
7. **Änderungen an den Sperren:** `.claude/settings.json`, `.claude/hooks/` und `.mcp.json`.

**Widerruf.** Ein Satz von Tim im Chat genügt.

**Folgen.** Angepasst sind `CLAUDE.md` (Einleitung, Paketablauf, Arbeitsweise und Liste der Entscheide) und der Skill `/umsetzen` (Schritte Wiederaufnahme, Planfreigabe und Eskalation). Die Sperren bleiben unverändert.
