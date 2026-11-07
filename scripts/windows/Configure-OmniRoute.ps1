[CmdletBinding()]
param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
$envPath = Join-Path $ProjectRoot ".env"
$examplePath = Join-Path $ProjectRoot ".env.example"

if (-not (Test-Path $examplePath)) {
    throw "Cannot find .env.example under $ProjectRoot. Run this script from the ArchOS checkout."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is required to verify that .env is ignored."
}

& git -C $ProjectRoot check-ignore -q ".env"
if ($LASTEXITCODE -ne 0) {
    throw ".env is not ignored by Git in this checkout. Refusing to write an API key until .env is safely ignored."
}

if (-not (Test-Path $envPath)) {
    Copy-Item $examplePath $envPath
}

$secureKey = Read-Host "Paste the OmniRoute API key (input is hidden)" -AsSecureString
if ($secureKey.Length -lt 8) {
    throw "The API key appears too short; no configuration was changed."
}

$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$settings = [ordered]@{
    "OMNIROUTE_ENABLED" = "true"
    "OMNIROUTE_BASE_URL" = "http://127.0.0.1:20128/v1"
    "OMNIROUTE_API_KEY" = $apiKey
    "OMNIROUTE_MODEL" = "auto"
    "OMNIROUTE_TIMEOUT_SECONDS" = "60"
    "OMNIROUTE_FALLBACK_TO_ANTHROPIC" = "true"
}

$lines = @()
if (Test-Path $envPath) {
    $lines = @(Get-Content -Path $envPath)
}

foreach ($name in $settings.Keys) {
    $pattern = "^" + [Regex]::Escape($name) + "="
    $lines = @($lines | Where-Object { $_ -notmatch $pattern })
    $lines += ($name + "=" + '"' + $settings[$name].Replace('"', '\"') + '"')
}

[System.IO.File]::WriteAllLines(
    $envPath,
    $lines,
    [System.Text.UTF8Encoding]::new($false)
)

$apiKey = $null
$secureKey.Dispose()

Write-Host ""
Write-Host "OmniRoute configuration saved to the local .env file." -ForegroundColor Green
Write-Host "The API key was not displayed. Restart ArchOS to load the new settings."
Write-Host "Verify the gateway configuration at GET /api/claude/status."
