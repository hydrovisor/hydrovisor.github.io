# Backup und Wiederherstellungsprobe (I0-11)

Anleitung für Tim, Plan 16. Jede Nacht um 03:00 UTC sichert `backup.yml` die Produktion. Der Stand umfasst Schema und Daten aus `public`, eine Zählung je Tabelle, die Migrationsliste und die Fotos im Bucket `saattueten`. Er wird mit `age` verschlüsselt und im privaten Repository `hydrovisor/hydrovisor-backup` abgelegt. Es bleiben 30 Stände. Schlüssel und Passwörter siehst nur du; der Lead sieht sie nie (CLAUDE.md Regel 2).

## 1 Einrichten (einmal, rund 10 Minuten)

Voraussetzung: Der Deploy mit der Migration `20261104150000_backup_rollen.sql` ist in der Produktion durch. Der Lead meldet ihn dir.

In deiner eigenen PowerShell im Ordner, den dir der Lead nennt:

```powershell
node scripts/backup-einrichten.mjs
```

Das Skript fragt zuerst nach «ja». Danach kommen drei Schritte:

1. **Passwort für `backup_leser`:** Das Skript erzeugt ein Zufallspasswort und legt eine SQL-Zeile mit dessen SCRAM-Hash in die Zwischenablage. Öffne im Supabase-Dashboard das **Produktionsprojekt** › SQL Editor, füge die Zeile ein und führe sie aus. Erwartet wird «Success. No rows returned». Dann drückst du Enter.
2. **Session-Pooler-Host:** Klick im Dashboard der Produktion oben auf «Connect» › «Session pooler». Kopiere den Host, der auf `.pooler.supabase.com` endet, oder die ganze Verbindungszeile, und füge ihn ein. Das Skript meldet sich als `backup_leser` an, nennt den Modus (BYPASSRLS oder Zeilensicherheit) und setzt das Secret `SUPABASE_DB_URL_BACKUP`.
3. **Storage-Token:** Öffne im Dashboard Project Settings › JWT Keys › Reiter «Legacy JWT Secret» › «Reveal» und kopiere das Geheimnis. Füge es ein; die Eingabe bleibt verdeckt. Das Skript signiert einen Token, der nur die Tütenfotos lesen darf und am 30.6.2027 abläuft. Es prüft ihn gegen den Storage und setzt `SUPABASE_STORAGE_TOKEN_BACKUP`. Gibt es kein Legacy JWT Secret, drückst du nur Enter. Dann sichert das Backup vorerst keine Fotos.

Beide Werte musst du nicht im Passwortmanager ablegen. Bei einem Verdacht auf ein Leck startest du das Skript einfach noch einmal.

Danach startet der Lead `backup.yml` von Hand und meldet dir den ersten Stand.

## 2 Wiederherstellungsprobe (bis 30.11., Wiederholung am 1.3.2027, rund 10 Minuten)

Die Probe spielt einen Stand probehalber in `hydrovisor-dev` ein und vergleicht die Zeilenzahl jeder Tabelle mit der Zählung im Stand. Sie läuft in einer einzigen Transaktion, die immer zurückgerollt wird. `hydrovisor-dev` bleibt dadurch unverändert.

```powershell
node scripts/wiederherstellungsprobe.mjs
```

- Ohne Angabe nimmt das Skript den jüngsten Stand. Einen bestimmten wählst du mit `--stand backup-2026-11-20`.
- Es fragt verdeckt nach deinem privaten `age`-Schlüssel (`AGE-SECRET-KEY-…`) und dem Access-Token für `hydrovisor-dev` (`sbp_…`). Beide liegen im Passwortmanager.
- Das Archiv wird nur im Speicher entschlüsselt. Unverschlüsselt landet nichts auf der Platte.
- Am Ende zeigt es den Bericht und legt ihn unter `reports/wiederherstellungsprobe-<stand>.md` ab. Bestanden heisst: «n von n Tabellen gleich», das Storage-Manifest ist vollständig, und im Migrationsstand fehlt in dev nichts.

Schick dem Lead die Zeilen der Tabelle «Prüfung | Ergebnis» aus dem Bericht. Sie enthalten nur Namen und Zahlen. Er trägt sie als Abnahme 2 ins Issue #16 ein.

Meldet das Skript «Im Ziel fehlen Migrationen des Stands», startet der Lead zuerst `dev-migration.yml` mit `main`. Danach wiederholst du die Probe.

## 3 Ernstfall (nur beschrieben, nicht geprobt)

1. Stand wählen: `gh release list --repo hydrovisor/hydrovisor-backup`.
2. Herunterladen und entschlüsseln, zum Beispiel unter Linux oder WSL:

   ```bash
   gh release download backup-JJJJ-MM-TT --repo hydrovisor/hydrovisor-backup
   age -d -i <deine-identitaet> backup-JJJJ-MM-TT.tar.gz.age | tar -xz
   ```

3. Neues Supabase-Projekt oder leeres `public`: zuerst die Migrationen aus dem Repository einspielen (`deploy.yml`), dann `sicherung/daten.sql` mit `psql` und `set session_replication_role = replica` laden.
4. Fotos aus `sicherung/storage/saattueten/` in den Bucket `saattueten` hochladen. Die Pfade bleiben gleich.
5. Neu anmelden: Die Zeile in `zugang` entsteht nach Konzept 11.6. Die Konten aus `auth` sind nicht gesichert.
6. Push neu einrichten (`docs/anleitung/push-einrichten.md`, mit dem bestehenden VAPID-Schlüssel) und `scripts/backup-einrichten.mjs` erneut ausführen.
