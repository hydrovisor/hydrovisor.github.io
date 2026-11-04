# Push einrichten (I0-08, Plan 13 «Tims Handgriffe» 2 bis 4 und 7): Tim startet dieses Skript einmal in seiner
# eigenen PowerShell. Es setzt die Supabase-Secrets NUR in der Produktion (nie in hydrovisor-dev, wo der Agent
# Functions ausliefern kann; Prüfer Sicherheit 1) und legt die Vault-Anweisungen für die Produktion bereit.
# Zwei Wege:
# - Neu: Fehlt die GitHub-Variable VITE_VAPID_PUBLIC_KEY, erzeugt es das VAPID-Schlüsselpaar, setzt die Variable und
#   gibt jeden geheimen Wert einzeln über die Zwischenablage an den Passwortmanager weiter.
# - Übernehmen: Ist VITE_VAPID_PUBLIC_KEY schon gesetzt (Tim am 1.11.2026), erzeugt es KEINEN Schlüssel. Tim gibt den
#   bestehenden privaten Schlüssel verdeckt ein; das Skript prüft, dass er zum öffentlichen Schlüssel der Variable
#   gehört, und bricht sonst ab. Ein schon gesetzter PUSH_QUITTUNG_SCHLUESSEL bleibt unverändert.
# Es schreibt keine Datei ausser einer temporären Secrets-Datei für «secrets set», die es sofort löscht, und zeigt keinen geheimen Wert auf der Konsole.
# CLAUDE.md Regel 3: VAPID-Schlüssel nie neu erzeugen, wenn schon einer besteht.
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

# Öffentlicher Schlüssel (base64url, 65 Byte) zum privaten (base64url, 32 Byte) auf P-256. Der private Schlüssel geht
# über die Standardeingabe an Node, nie als Argument oder Umgebungsvariable.
function OeffentlichZu([string]$privat) {
  $code = 'const c=require(''crypto'');const d=Buffer.from(require(''fs'').readFileSync(0,''utf8'').trim(),''base64url'');if(d.length!==32)process.exit(2);const e=c.createECDH(''prime256v1'');e.setPrivateKey(d);process.stdout.write(e.getPublicKey().toString(''base64url''))'
  $oeffentlich = $privat | node -e $code
  if ($LASTEXITCODE -ne 0) { return '' }
  return "$oeffentlich".Trim()
}

if ([Console]::IsInputRedirected) { Write-Host 'Abbruch: Das Skript läuft nur in einer eigenen Konsole.'; exit 1 }
$antwort = Read-Host 'Push für die Produktion einrichten? Zum Bestätigen «ja» eingeben'
if ($antwort -ne 'ja') { Write-Host 'Abgebrochen.'; exit 1 }

Write-Host 'Prüfe, ob schon ein VAPID-Schlüssel besteht ...'
$variablen = gh variable list --json name | ConvertFrom-Json
Pruefen 'gh variable list'
$uebernehmen = [bool]($variablen | Where-Object { $_.name -eq 'VITE_VAPID_PUBLIC_KEY' })
$prod = (gh variable get SUPABASE_PROJECT_REF_PROD).Trim()
Pruefen 'gh variable get SUPABASE_PROJECT_REF_PROD'
if (-not $prod) { throw 'Repository-Variable SUPABASE_PROJECT_REF_PROD fehlt' }
# Namen der Secrets als JSON statt als Text: «-match» auf der Textausgabe war bei Tims Lauf unzuverlässig (#68)
function SecretNamen {
  $json = npx --yes supabase@3.0.0 secrets list --project-ref $prod --output json
  Pruefen 'supabase secrets list (vorher: npx supabase login)'
  $liste = $json | Out-String | ConvertFrom-Json
  # Leere Ausgabe ergäbe unter PowerShell 5.1 $null und damit «kein Secret»: dann lieber abbrechen (Regel 3)
  if ($null -eq $liste) { throw 'supabase secrets list lieferte kein JSON' }
  return @($liste | ForEach-Object { $_.name })
}
$secrets = SecretNamen
$quittungBesteht = $secrets -contains 'PUSH_QUITTUNG_SCHLUESSEL'

if ($uebernehmen) {
  Write-Host 'VITE_VAPID_PUBLIC_KEY ist schon gesetzt. Das Skript übernimmt den bestehenden Schlüssel und erzeugt keinen neuen.'
  $oeffentlich = (gh variable get VITE_VAPID_PUBLIC_KEY).Trim()
  Pruefen 'gh variable get VITE_VAPID_PUBLIC_KEY'
  if (-not $oeffentlich) { throw 'VITE_VAPID_PUBLIC_KEY ist leer' }
  $eingabe = Read-Host 'Bestehenden privaten VAPID-Schlüssel einfügen (Eingabe bleibt verdeckt), dann Enter' -AsSecureString
  $zeiger = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($eingabe)
  try { $privat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($zeiger).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($zeiger) }
  if ($privat -notmatch '^[A-Za-z0-9_-]{43}$') {
    Write-Host 'Abbruch: Der private VAPID-Schlüssel hat nicht die Form von 43 Zeichen base64url. Nichts wurde gesetzt.'
    exit 1
  }
  $abgeleitet = OeffentlichZu $privat
  if (-not $abgeleitet -or $abgeleitet -ne $oeffentlich) {
    Write-Host 'Abbruch: Der private Schlüssel passt nicht zu VITE_VAPID_PUBLIC_KEY. Nichts wurde gesetzt.'
    Write-Host 'Prüfe, ob du den privaten Schlüssel vom 1.11. vollständig kopiert hast (43 Zeichen, ohne Leerzeichen).'
    exit 1
  }
  Write-Host 'Der private Schlüssel passt zum öffentlichen.'
  $vapid = [pscustomobject]@{ publicKey = $oeffentlich; privateKey = $privat }
  if (($secrets -contains 'VAPID_PUBLIC_KEY') -or ($secrets -contains 'VAPID_PRIVATE_KEY')) {
    Write-Host 'In der Produktion besteht schon ein VAPID-Secret. Es wird mit dem geprüften Paar überschrieben.'
  }
} else {
  if (($secrets -contains 'VAPID_PUBLIC_KEY') -or ($secrets -contains 'VAPID_PRIVATE_KEY')) {
    Write-Host 'Abbruch: In der Produktion besteht schon ein VAPID-Schlüssel, aber VITE_VAPID_PUBLIC_KEY fehlt (CLAUDE.md Regel 3).'
    exit 1
  }
  Write-Host 'Erzeuge VAPID-Schlüsselpaar ...'
  $vapid = (npx --yes web-push@3.6.7 generate-vapid-keys --json) | ConvertFrom-Json
  Pruefen 'web-push generate-vapid-keys'
  if (-not $vapid.publicKey -or -not $vapid.privateKey) { throw 'VAPID-Schlüssel leer' }
}
$quittung = Zufall

try {

if (-not $uebernehmen) {
  Weitergeben 'VAPID_PUBLIC_KEY' $vapid.publicKey
  Weitergeben 'VAPID_PRIVATE_KEY' $vapid.privateKey
}
if (-not $quittungBesteht) { Weitergeben 'PUSH_QUITTUNG_SCHLUESSEL' $quittung }

Write-Host 'Setze die Supabase-Secrets der Produktion ...'
$zeilen = @(
  "VAPID_PUBLIC_KEY=$($vapid.publicKey)",
  "VAPID_PRIVATE_KEY=$($vapid.privateKey)",
  "VAPID_SUBJECT=$BETREFF"
)
if (-not $quittungBesteht) { $zeilen += "PUSH_QUITTUNG_SCHLUESSEL=$quittung" }
$datei = New-TemporaryFile
try {
  $zeilen | Set-Content -Path $datei -Encoding ASCII
  # Unter PowerShell 5.1 mit ErrorActionPreference Stop bricht jede Zeile auf stderr ab, auch bei Exit 0 (Prüfer #74)
  $alt = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $ausgabe = npx --yes supabase@3.0.0 secrets set --project-ref $prod --env-file $datei.FullName 2>&1 |
      ForEach-Object { "$_" } | Out-String
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $alt
  }
  if ($code -ne 0) { Write-Host $ausgabe; throw "supabase secrets set fehlgeschlagen (Exit $code)" }
} finally {
  Remove-Item $datei -Force
}

# Abgleich danach: Alle vier Namen müssen in der Produktion stehen, sonst laut abbrechen (#68)
$nachher = SecretNamen
$fehlend = @('VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'PUSH_QUITTUNG_SCHLUESSEL') | Where-Object { $nachher -notcontains $_ }
if ($fehlend) { throw "Nach «secrets set» fehlen in der Produktion: $($fehlend -join ', ')" }
Write-Host 'Geprüft: Alle vier Secrets stehen in der Produktion.'

if (-not $uebernehmen) {
  Write-Host 'Setze die GitHub-Variable VITE_VAPID_PUBLIC_KEY (öffentlich) ...'
  gh variable set VITE_VAPID_PUBLIC_KEY --body $vapid.publicKey | Out-Null
  Pruefen 'gh variable set'
}

# Vault der Produktion: im SQL-Editor einfügen und ausführen (vor oder nach dem Deploy). Bestehende Einträge bleiben.
# cron_geheimnis entsteht in der Datenbank (pgcrypto) und verlässt Vault nie (Prüfer Sicherheit, PR #63).
Set-Clipboard -Value ("select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_geheimnis') where not exists (select 1 from vault.secrets where name = 'cron_geheimnis');`n" +
  "select vault.create_secret('https://$prod.supabase.co', 'projekt_url') where not exists (select 1 from vault.secrets where name = 'projekt_url');`n" +
  "select name, created_at from vault.secrets where name in ('cron_geheimnis', 'projekt_url');")
Read-Host 'Die Vault-Anweisungen liegen in der Zwischenablage. Im SQL-Editor der Produktion einfügen und ausführen, dann Enter' | Out-Null
} finally {
  # Zwischenablage auch bei einem Abbruch leeren (Prüfer Sicherheit, Runde 1)
  Set-Clipboard -Value ' '
  $privat = $null
}

Write-Host 'Fertig. Die Zwischenablage ist geleert. Im SQL-Editor müssen zwei Zeilen stehen: cron_geheimnis und projekt_url.'
