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

Das Skript fragt zuerst nach «ja». Fehlt die Variable `VITE_VAPID_PUBLIC_KEY`, erledigt es Folgendes:
- Es erzeugt das VAPID-Schlüsselpaar und den Quittungs-Schlüssel.
- Jeden Wert legt es einzeln in die Zwischenablage. Du speicherst ihn im Passwortmanager und drückst Enter. Es schreibt nur eine temporäre Datei für `secrets set` und löscht sie sofort.
- Es setzt die Supabase-Secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` und `PUSH_QUITTUNG_SCHLUESSEL`, nur in der Produktion. `hydrovisor-dev` bekommt keine Push-Secrets, weil der Agent dort Functions ausliefern kann.
- Es setzt die GitHub-Variable `VITE_VAPID_PUBLIC_KEY`. Der öffentliche Schlüssel ist kein Geheimnis.
- Zum Schluss legt es die Vault-Anweisungen für die Produktion in die Zwischenablage und leert sie danach wieder.

Ist die GitHub-Variable `VITE_VAPID_PUBLIC_KEY` schon gesetzt (bei dir seit dem 1.11.2026), erzeugt das Skript **keinen** Schlüssel, denn ein neuer würde alle Abos ungültig machen (CLAUDE.md Regel 3). Stattdessen übernimmt es den bestehenden:
- Du fügst den privaten VAPID-Schlüssel aus dem Passwortmanager ein. Er hat 43 Zeichen, und die Eingabe bleibt verdeckt.
- Das Skript prüft, ob er zum öffentlichen Schlüssel der Variable passt. Passt er nicht, bricht es ab, ohne etwas zu setzen.
- Danach setzt es die drei VAPID-Secrets in der Produktion. Ein schon vorhandenes VAPID-Secret überschreibt es mit dem geprüften Paar, denn die App abonniert mit dem öffentlichen Schlüssel der Variable. Ein schon gesetzter `PUSH_QUITTUNG_SCHLUESSEL` bleibt, sonst erzeugt es ihn neu und gibt ihn dir weiter.
- Die Variable bleibt unverändert. Die App enthält den öffentlichen Schlüssel schon, ein neuer Deploy ist nicht nötig.

Besteht ein VAPID-Secret in der Produktion, aber die Variable fehlt, bricht das Skript ab.

## 2 Vault in der Produktion (im Skript, rund 2 Minuten)

Öffne den SQL-Editor der Produktion, wenn das Skript dich dazu auffordert. Füge die Zwischenablage ein und führe sie aus. Damit kennt der Cron-Job die Adresse und das Geheimnis. Ohne diese Einträge ruft er nichts auf. Bestehende Einträge bleiben unverändert. Das Ergebnis zeigt zwei Zeilen, `cron_geheimnis` und `projekt_url`. Das Cron-Geheimnis erzeugt die Datenbank selbst. Es verlässt Vault nie, und du musst es nicht speichern.

## 3 Nach dem Merge

- In GitHub die Freigabe von `deploy.yml` in der Umgebung `production` erteilen. Das liefert Migration und Edge Functions aus.
- Auf dem Honor die installierte App öffnen und `#/push` aufrufen.
- Auf «Push einrichten» tippen und die Benachrichtigungen erlauben.
- Auf «Test-Push senden» tippen.
- In den Einstellungen von Android die Akku-Optimierung für Chrome ausschalten: Apps › Chrome › Akku › Nicht eingeschränkt.

## 4 Nachweis M0 (bis 15.12.)

An 5 Tagen in Folge kommt um 07:00 die Erinnerung bei gesperrtem Gerät. `#/push` zeigt je Tag «angezeigt». Ein Bildschirmfoto davon gehört als Kommentar ins Issue #13 (UC8-AK8).

Notfall: Im SQL-Editor stoppt `select cron.unschedule('push-taeglich');` die tägliche Push sofort.
