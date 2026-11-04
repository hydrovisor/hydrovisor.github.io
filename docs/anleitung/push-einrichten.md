# Push einrichten (I0-08)

Anleitung für Tim, Plan 13. Die Schlüssel erzeugst nur du. Der Lead sieht sie nie und erzeugt sie nie neu (CLAUDE.md Regeln 2 und 3).

## 1 Schlüssel und Secrets (einmal, rund 10 Minuten)

In PowerShell im Ordner `C:\dev\hydrovisor`:

```powershell
npx supabase login
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts\push-einrichten.ps1
```

Das Skript erledigt Folgendes:
- Es erzeugt das VAPID-Schlüsselpaar, den Quittungs-Schlüssel und das Cron-Geheimnis.
- Es setzt die Supabase-Secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` und `PUSH_QUITTUNG_SCHLUESSEL`, in der Produktion und in `hydrovisor-dev`.
- Es setzt die GitHub-Variable `VITE_VAPID_PUBLIC_KEY`. Der öffentliche Schlüssel ist kein Geheimnis.
- Es schreibt eine Sicherung nach `Dokumente\hydrovisor-push-schluessel.txt`. Übertrage sie in den Passwortmanager und lösch die Datei danach.
- Es legt die Vault-Anweisungen für die Produktion in die Zwischenablage.

Besteht `VITE_VAPID_PUBLIC_KEY` schon, bricht das Skript ab, weil ein neuer Schlüssel alle Abos ungültig machen würde.

## 2 Vault in der Produktion (rund 2 Minuten)

Der Lead öffnet dir den SQL-Editor der Produktion. Du fügst die Zwischenablage ein und führst sie aus. Damit kennt der Cron-Job die Adresse und das Geheimnis. Ohne diese Einträge ruft er nichts auf.

## 3 Nach dem Merge

- In GitHub die Freigabe von `deploy.yml` in der Umgebung `production` erteilen. Das liefert Migration und Edge Functions aus.
- Auf dem Honor die installierte App öffnen und `#/push` aufrufen.
- Auf «Push einrichten» tippen und die Benachrichtigungen erlauben.
- Auf «Test-Push senden» tippen.
- In den Einstellungen von Android die Akku-Optimierung für Chrome ausschalten: Apps › Chrome › Akku › Nicht eingeschränkt.

## 4 Nachweis M0 (bis 15.12.)

An 5 Tagen in Folge kommt um 07:00 die Erinnerung bei gesperrtem Gerät. `#/push` zeigt je Tag «angezeigt». Ein Bildschirmfoto davon gehört als Kommentar ins Issue #13 (UC8-AK8).

Notfall: Im SQL-Editor stoppt `select cron.unschedule('push-taeglich');` die tägliche Push sofort.
