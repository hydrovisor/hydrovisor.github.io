# Push einrichten (I0-08, Plan 13 «Tims Handgriffe» 2 bis 4 und 7): Tim startet dieses Skript einmal in seiner
# eigenen PowerShell. Es erzeugt das VAPID-Schlüsselpaar und zwei Zufallswerte, setzt die Supabase-Secrets in der
# Produktion und in hydrovisor-dev, setzt die GitHub-Variable VITE_VAPID_PUBLIC_KEY und legt die Vault-Anweisungen
# für die Produktion in die Zwischenablage. Kein Wert erscheint auf der Konsole; der Agent sieht keinen davon.
# CLAUDE.md Regel 3: VAPID-Schlüssel nie neu erzeugen. Das Skript bricht ab, wenn die Variable schon gesetzt ist.
# Aufruf im Ordner des Repositorys: powershell -ExecutionPolicy Bypass -File scripts\push-einrichten.ps1
$ErrorActionPreference = 'Stop'
$DEV = 'jalvmzgvxvidgmoxuglp'   # hydrovisor-dev, fest wie in .mcp.json
$BETREFF = 'https://hydrovisor.github.io/'

function Zufall {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

Write-Host 'Push einrichten: Prüfe, ob schon ein VAPID-Schlüssel besteht ...'
$vorhanden = (gh variable list --json name | ConvertFrom-Json) | Where-Object { $_.name -eq 'VITE_VAPID_PUBLIC_KEY' }
if ($vorhanden) {
  Write-Host 'Abbruch: VITE_VAPID_PUBLIC_KEY ist schon gesetzt. VAPID-Schlüssel nie neu erzeugen (CLAUDE.md Regel 3).'
  exit 1
}
$prod = (gh variable get SUPABASE_PROJECT_REF_PROD).Trim()
if (-not $prod) { throw 'Repository-Variable SUPABASE_PROJECT_REF_PROD fehlt' }

Write-Host 'Erzeuge VAPID-Schlüsselpaar und zwei Zufallswerte ...'
$vapid = (npx --yes web-push@3.6.7 generate-vapid-keys --json) | ConvertFrom-Json
$quittung = Zufall
$cron = Zufall

# Sicherung für den Passwortmanager; nach dem Übertragen löschen
$sicherung = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'hydrovisor-push-schluessel.txt'
@(
  "Hydrovisor Push, erzeugt $(Get-Date -Format 'd.M.yyyy HH:mm')",
  "VAPID_PUBLIC_KEY=$($vapid.publicKey)",
  "VAPID_PRIVATE_KEY=$($vapid.privateKey)",
  "VAPID_SUBJECT=$BETREFF",
  "PUSH_QUITTUNG_SCHLUESSEL=$quittung",
  "cron_geheimnis=$cron"
) | Set-Content -Path $sicherung -Encoding UTF8

Write-Host 'Setze die Supabase-Secrets (Produktion und hydrovisor-dev) ...'
$datei = New-TemporaryFile
try {
  @(
    "VAPID_PUBLIC_KEY=$($vapid.publicKey)",
    "VAPID_PRIVATE_KEY=$($vapid.privateKey)",
    "VAPID_SUBJECT=$BETREFF",
    "PUSH_QUITTUNG_SCHLUESSEL=$quittung"
  ) | Set-Content -Path $datei -Encoding ASCII
  foreach ($ref in @($prod, $DEV)) {
    npx --yes supabase@3.0.0 secrets set --project-ref $ref --env-file $datei.FullName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Secrets für $ref nicht gesetzt (vorher: npx supabase login)" }
  }
} finally {
  Remove-Item $datei -Force
}

Write-Host 'Setze die GitHub-Variable VITE_VAPID_PUBLIC_KEY (öffentlich) ...'
gh variable set VITE_VAPID_PUBLIC_KEY --body $vapid.publicKey | Out-Null

# Vault der Produktion: im SQL-Editor einfügen und ausführen (nach dem Deploy oder vorher, beides geht)
$sql = "select vault.create_secret('$cron', 'cron_geheimnis');`nselect vault.create_secret('https://$prod.supabase.co', 'projekt_url');"
Set-Clipboard -Value $sql

Write-Host ''
Write-Host 'Fertig.'
Write-Host "- Sicherung für den Passwortmanager: $sicherung (nach dem Übertragen löschen)"
Write-Host '- Die Vault-Anweisungen für die Produktion liegen in der Zwischenablage: im SQL-Editor einfügen und ausführen.'
