# Push einrichten (I0-08, Plan 13 «Tims Handgriffe» 2 bis 4 und 7): Tim startet dieses Skript einmal in seiner
# eigenen PowerShell. Es erzeugt das VAPID-Schlüsselpaar und zwei Zufallswerte, setzt die Supabase-Secrets NUR in der
# Produktion (nie in hydrovisor-dev, wo der Agent Functions ausliefern kann; Prüfer Sicherheit 1), setzt die
# GitHub-Variable VITE_VAPID_PUBLIC_KEY und gibt jeden geheimen Wert einzeln über die Zwischenablage an den
# Passwortmanager weiter. Es schreibt keine Datei und zeigt keinen Wert auf der Konsole.
# CLAUDE.md Regel 3: VAPID-Schlüssel nie neu erzeugen. Das Skript bricht ab, wenn schon ein Schlüssel besteht.
# Es fragt vor jedem Schritt nach und bricht bei umgeleiteter Eingabe ab (z. B. aus einem Agenten oder mit «echo ja |»).
# Aufruf im Ordner des Repositorys: powershell -ExecutionPolicy Bypass -File scripts\push-einrichten.ps1
$ErrorActionPreference = 'Stop'
$BETREFF = 'https://hydrovisor.github.io/'

function Zufall {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Pruefen([string]$was) {
  if ($LASTEXITCODE -ne 0) { throw "$was fehlgeschlagen (Exit $LASTEXITCODE)" }
}

function Weitergeben([string]$name, [string]$wert) {
  Set-Clipboard -Value $wert
  Read-Host "$name liegt in der Zwischenablage. Im Passwortmanager speichern, dann Enter" | Out-Null
}

if ([Console]::IsInputRedirected) { Write-Host 'Abbruch: Das Skript läuft nur in einer eigenen Konsole.'; exit 1 }
$antwort = Read-Host 'Push für die Produktion einrichten? Zum Bestätigen «ja» eingeben'
if ($antwort -ne 'ja') { Write-Host 'Abgebrochen.'; exit 1 }

Write-Host 'Prüfe, ob schon ein VAPID-Schlüssel besteht ...'
$variablen = gh variable list --json name | ConvertFrom-Json
Pruefen 'gh variable list'
if ($variablen | Where-Object { $_.name -eq 'VITE_VAPID_PUBLIC_KEY' }) {
  Write-Host 'Abbruch: VITE_VAPID_PUBLIC_KEY ist schon gesetzt. VAPID-Schlüssel nie neu erzeugen (CLAUDE.md Regel 3).'
  exit 1
}
$prod = (gh variable get SUPABASE_PROJECT_REF_PROD).Trim()
Pruefen 'gh variable get SUPABASE_PROJECT_REF_PROD'
if (-not $prod) { throw 'Repository-Variable SUPABASE_PROJECT_REF_PROD fehlt' }
$secrets = npx --yes supabase@3.0.0 secrets list --project-ref $prod
Pruefen 'supabase secrets list (vorher: npx supabase login)'
if ($secrets -match 'VAPID_PUBLIC_KEY') {
  Write-Host 'Abbruch: In der Produktion besteht schon ein VAPID-Schlüssel (CLAUDE.md Regel 3).'
  exit 1
}

Write-Host 'Erzeuge VAPID-Schlüsselpaar und zwei Zufallswerte ...'
$vapid = (npx --yes web-push@3.6.7 generate-vapid-keys --json) | ConvertFrom-Json
Pruefen 'web-push generate-vapid-keys'
if (-not $vapid.publicKey -or -not $vapid.privateKey) { throw 'VAPID-Schlüssel leer' }
$quittung = Zufall
$cron = Zufall

try {

Weitergeben 'VAPID_PUBLIC_KEY' $vapid.publicKey
Weitergeben 'VAPID_PRIVATE_KEY' $vapid.privateKey
Weitergeben 'PUSH_QUITTUNG_SCHLUESSEL' $quittung
Weitergeben 'cron_geheimnis' $cron

Write-Host 'Setze die Supabase-Secrets der Produktion ...'
$datei = New-TemporaryFile
try {
  @(
    "VAPID_PUBLIC_KEY=$($vapid.publicKey)",
    "VAPID_PRIVATE_KEY=$($vapid.privateKey)",
    "VAPID_SUBJECT=$BETREFF",
    "PUSH_QUITTUNG_SCHLUESSEL=$quittung"
  ) | Set-Content -Path $datei -Encoding ASCII
  npx --yes supabase@3.0.0 secrets set --project-ref $prod --env-file $datei.FullName | Out-Null
  Pruefen 'supabase secrets set'
} finally {
  Remove-Item $datei -Force
}

Write-Host 'Setze die GitHub-Variable VITE_VAPID_PUBLIC_KEY (öffentlich) ...'
gh variable set VITE_VAPID_PUBLIC_KEY --body $vapid.publicKey | Out-Null
Pruefen 'gh variable set'

# Vault der Produktion: im SQL-Editor einfügen und ausführen (vor oder nach dem Deploy)
Set-Clipboard -Value "select vault.create_secret('$cron', 'cron_geheimnis');`nselect vault.create_secret('https://$prod.supabase.co', 'projekt_url');"
Read-Host 'Die Vault-Anweisungen liegen in der Zwischenablage. Im SQL-Editor der Produktion einfügen und ausführen, dann Enter' | Out-Null
} finally {
  # Zwischenablage auch bei einem Abbruch leeren (Prüfer Sicherheit, Runde 1)
  Set-Clipboard -Value ' '
}

Write-Host 'Fertig. Die Zwischenablage ist geleert.'
