# 0013 Tütenfotos über die S3-Schnittstelle sichern

Datum: 6.11.2026 · Entschieden vom Lead (Entscheid 0010, technisches Detail) · Issue #69

## Ausgangslage

`backup.yml` sichert die Datenbank, aber nicht den Bucket `saattueten`. Dem Produktionsprojekt fehlt das Legacy JWT Secret, deshalb kann `scripts/backup-einrichten.mjs` keinen Storage-Token der Rolle `backup_speicher_leser` signieren. Seit I2-05 (#37, PR #104) lädt die Maske «Neue Sorte» Tütenfotos hoch, daher braucht es jetzt eine Sicherung.

## Entscheid

Weg 1 aus #69: `scripts/backup-storage.mjs` liest den Bucket über die S3-Schnittstelle des Storage (`<SUPABASE_URL>/storage/v1/s3`). Es ruft nur `ListObjectsV2` und `GetObject` auf und signiert mit AWS SigV4 aus `scripts/backup-regeln.mjs`. Dafür braucht es keine npm-Abhängigkeit, weil `backup.yml` kein `npm ci` ausführt. Der Weg über den Token bleibt als Rückfall erhalten.

- Secrets in der GitHub-Umgebung `backup`: `SUPABASE_S3_ZUGANG_ID_BACKUP` und `SUPABASE_S3_GEHEIMNIS_BACKUP`. Dazu kommt die Variable `SUPABASE_S3_REGION` mit der Region des Produktionsprojekts.
- Den Schlüssel legt Tim an: Supabase Dashboard › Projekt «hydrovisor» › Storage › S3 Connection › «New access key» mit der Beschreibung «backup»; die Werte trägt er selbst als Secrets ein (CLAUDE.md Regel 2).
- Ohne diese Secrets bleibt das bisherige Verhalten: Warnung im Lauf und die Datei `storage-nicht-gesichert.txt` in der Sicherung.

## Abwägung

- **S3-Schlüssel** (gewählt): eigener, widerrufbarer Schlüssel, wenig Code, kein neuer Dienst. Nachteil: Ein S3-Zugangsschlüssel des Storage gilt für **alle Buckets und alle S3-Operationen, auch Löschen, und umgeht die Storage-Policies (RLS)**. Einen reinen Leseschlüssel bietet Supabase nicht. Er liegt deshalb nur als Secret in der Umgebung `backup`, die eine Zweigregel auf `main` beschränkt (Prüfer Sicherheit hat das am 6.11. geprüft); es gibt keine Repository-Secrets. Das Skript sendet nur GET-Anfragen (ListObjectsV2, GetObject) (A). Bei Verdacht widerruft Tim den Schlüssel im Dashboard und gleicht den Bucket mit der letzten Sicherung ab (Manifest mit SHA-256).
- **Eigene Edge Function** (verworfen): mehr Code und eine öffentlich erreichbare Angriffsfläche mit einem weiteren Geheimnis.
- **Nicht sichern** (verworfen): Seit I2-05 entstehen echte Fotos, sie gehören nach Konzept 11.7 ins Backup.

Weitere Schutzmassnahmen (Prüfer Sicherheit): höchstens 100 Listenseiten, Abbruch bei wiederholter oder leerer Fortsetzung, `timeout-minutes: 30` im Job. Gesendet wird genau die kodierte Adresse, die auch signiert wird (`s3Url`). Numerische XML-Entities werden nicht dekodiert; ein solcher Schlüssel endet mit 404 und Exit 1 (fail-closed).

## Prüfung

- Unit: `tests/unit/backup-s3.test.ts` mit den AWS-Testvektoren `get-vanilla` und `get-vanilla-query-order-key-case` sowie dem GetObject-Beispiel aus der S3-Dokumentation. Dazu das Lesen der Liste mit Fortsetzung und die Ablehnung unsicherer Schlüssel.
- Lokal gegen `supabase start` (S3 der lokalen Instanz): Upload, `backup-storage.mjs` über S3, 1 von 1 Dateien gesichert, Manifest mit SHA-256.
