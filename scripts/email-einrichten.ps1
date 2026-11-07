# E-Mail-Rückfall einrichten (I1b-06, Plan 31 «Handgriffe für Tim» 1 und 2): Tim startet dieses Skript einmal in seiner
# eigenen PowerShell, nachdem er bei Resend (Gratisstufe) einen API Key mit «Sending access» erzeugt hat (Präfix re_,
# Resend-Dashboard › API Keys). Es setzt die Supabase-Secrets RESEND_API_KEY und EMAIL_EMPFAENGER (optional
# EMAIL_ABSENDER) NUR in der Produktion. Ohne eigenen Absender gilt «Hydrovisor <onboarding@resend.dev>»; dieser stellt
# nur an die Adresse des Resend-Kontos zu, darum ist EMAIL_EMPFAENGER die Adresse des Resend-Kontos (Plan 31 A6).
# Es zeigt keinen geheimen Wert auf der Konsole und schreibt keine Datei ausser einer temporären Secrets-Datei für
# «secrets set», die es sofort löscht. Die Adresse steht nie im Repository (CLAUDE.md Regel 6).
# Es bricht bei umgeleiteter Eingabe ab (z. B. aus einem Agenten oder mit «echo ja |»).
# Danach in der App: Einstellungen › Erinnerung › «E-Mail, wenn Push fehlt: Ein».
# Aufruf im Ordner des Repositorys: powershell -ExecutionPolicy Bypass -File scripts\email-einrichten.ps1
$ErrorActionPreference = 'Stop'

function Pruefen([string]$was) {
  if ($LASTEXITCODE -ne 0) { throw "$was fehlgeschlagen (Exit $LASTEXITCODE)" }
}

function Verdeckt([string]$frage) {
  $eingabe = Read-Host $frage -AsSecureString
  $zeiger = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($eingabe)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($zeiger).Trim() }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($zeiger) }
}

if ([Console]::IsInputRedirected) { Write-Host 'Abbruch: Das Skript läuft nur in einer eigenen Konsole.'; exit 1 }
$antwort = Read-Host 'E-Mail-Rückfall für die Produktion einrichten? Zum Bestätigen «ja» eingeben'
if ($antwort -ne 'ja') { Write-Host 'Abgebrochen.'; exit 1 }

$prod = (gh variable get SUPABASE_PROJECT_REF_PROD).Trim()
Pruefen 'gh variable get SUPABASE_PROJECT_REF_PROD'
if (-not $prod) { throw 'Repository-Variable SUPABASE_PROJECT_REF_PROD fehlt' }

$schluessel = Verdeckt 'Resend API Key (beginnt mit re_) einfügen, Eingabe bleibt verdeckt, dann Enter'
if ($schluessel -notmatch '^re_[A-Za-z0-9_]{10,}$') {
  Write-Host 'Abbruch: Der Schlüssel hat nicht die Form re_… . Nichts wurde gesetzt.'
  exit 1
}
$empfaenger = Verdeckt 'Empfänger-Adresse (Adresse des Resend-Kontos) eingeben, dann Enter'
if ($empfaenger -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
  Write-Host 'Abbruch: Das ist keine E-Mail-Adresse. Nichts wurde gesetzt.'
  exit 1
}
$absender = Read-Host 'Eigener Absender mit verifizierter Domain (leer lassen für den Test-Absender von Resend)'

$zeilen = @("RESEND_API_KEY=$schluessel", "EMAIL_EMPFAENGER=$empfaenger")
if ($absender.Trim()) { $zeilen += "EMAIL_ABSENDER=$($absender.Trim())" }
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

$json = npx --yes supabase@3.0.0 secrets list --project-ref $prod --output json
Pruefen 'supabase secrets list'
$namen = @(($json | Out-String | ConvertFrom-Json) | ForEach-Object { $_.name })
$fehlend = @('RESEND_API_KEY', 'EMAIL_EMPFAENGER') | Where-Object { $namen -notcontains $_ }
if ($fehlend) { throw "Secrets fehlen nach dem Setzen: $($fehlend -join ', ')" }
Write-Host 'E-Mail-Rückfall eingerichtet. Jetzt in der App «E-Mail, wenn Push fehlt: Ein» wählen.'
