[CmdletBinding()]
param(
    [int]$Port = 20128,
    [int]$StartupTimeoutSeconds = 60,
    [string]$OmniRouteVersion = "latest"
)

$ErrorActionPreference = "Stop"

function Test-LocalTcpPort {
    param([string]$HostName, [int]$PortNumber)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $task = $client.BeginConnect($HostName, $PortNumber, $null, $null)
        if (-not $task.AsyncWaitHandle.WaitOne(700)) { return $false }
        $client.EndConnect($task)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

Write-Host ""
Write-Host "=== ARCHOS / JARVIS - OMNIROUTE SETUP ===" -ForegroundColor Cyan

$npm = Get-Command npm -ErrorAction SilentlyContinue
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $npm) { throw "npm is not available. Install a supported Node.js release first." }
if (-not $node) { throw "Node.js is not available. Install a supported Node.js release first." }

$nodeVersionText = (& node -p "process.versions.node").Trim()
try { $nodeVersion = [version]$nodeVersionText } catch { throw "Could not parse Node.js version: $nodeVersionText" }
$nodeSupported = (($nodeVersion.Major -eq 22) -and ($nodeVersion -ge [version]"22.22.2")) -or (($nodeVersion.Major -ge 24) -and ($nodeVersion.Major -lt 27))
if (-not $nodeSupported) {
    throw "OmniRoute $OmniRouteVersion requires Node >=22.22.2 <23 or >=24 <27. Detected Node $nodeVersionText."
}
Write-Host "Node.js: $nodeVersionText" -ForegroundColor DarkGray

# Resolve the requested release against the public npm registry before installation.
# GitHub release tags can appear before the corresponding npm package is published.
$registry = "https://registry.npmjs.org/"
$versionSelector = if ([string]::IsNullOrWhiteSpace($OmniRouteVersion) -or $OmniRouteVersion -eq "latest") { "omniroute@latest" } else { "omniroute@$OmniRouteVersion" }
Write-Host "Resolving $versionSelector from the public npm registry..." -ForegroundColor DarkGray
$resolvedVersion = (& npm view $versionSelector version --registry=$registry 2>&1 | Select-Object -Last 1)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace([string]$resolvedVersion)) {
    throw "Could not resolve $versionSelector from $registry. npm returned: $resolvedVersion"
}
$OmniRouteVersion = ([string]$resolvedVersion).Trim() -replace "^v", ""
Write-Host "Published npm version: $OmniRouteVersion" -ForegroundColor Green

$omniCommand = Get-Command omniroute -ErrorAction SilentlyContinue
$installedVersion = $null
if ($omniCommand) {
    $versionOutput = (& omniroute --version 2>$null | Select-Object -Last 1)
    if ($LASTEXITCODE -eq 0 -and $versionOutput) {
        $installedVersion = ([string]$versionOutput).Trim() -replace "^v", ""
    }
}

if (-not $omniCommand -or $installedVersion -ne $OmniRouteVersion) {
    $npmVersionText = (& npm --version).Trim()
    try { $npmMajor = ([version]$npmVersionText).Major } catch { throw "Could not parse npm version: $npmVersionText" }

    Write-Host "Installing official OmniRoute package v$OmniRouteVersion..." -ForegroundColor Yellow
    if ($npmMajor -ge 11) {
        Write-Host "npm 11+ detected; allowing the upstream-documented install scripts." -ForegroundColor DarkGray
        & npm install --global "--allow-scripts=omniroute,keytar,onnxruntime-node,@parcel/watcher,@swc/core,protobufjs,esbuild" "omniroute@$OmniRouteVersion" "--registry=$registry"
    }
    else {
        & npm install --global "omniroute@$OmniRouteVersion" "--registry=$registry"
    }
    if ($LASTEXITCODE -ne 0) {
        throw "OmniRoute installation failed (npm exit code $LASTEXITCODE). If npm reports a different lifecycle-script allowlist, use the exact package names in that warning and rerun."
    }
}

$omniCommand = Get-Command omniroute -ErrorAction SilentlyContinue
if (-not $omniCommand) {
    throw "OmniRoute is installed, but 'omniroute' is not on PATH. Open a new PowerShell window and rerun."
}
$verifiedVersion = (& omniroute --version 2>$null | Select-Object -Last 1)
$normalizedVersion = ([string]$verifiedVersion).Trim() -replace "^v", ""
if ($LASTEXITCODE -ne 0 -or $normalizedVersion -ne $OmniRouteVersion) {
    throw "OmniRoute version verification failed. Expected $OmniRouteVersion; received '$verifiedVersion'."
}
Write-Host "OmniRoute version verified: $OmniRouteVersion" -ForegroundColor Green

if (Test-LocalTcpPort -HostName "127.0.0.1" -PortNumber $Port) {
    Write-Host "OmniRoute is already listening on 127.0.0.1:$Port." -ForegroundColor Green
}
else {
    Write-Host "Starting OmniRoute..." -ForegroundColor Yellow
    Start-Process -FilePath $env:ComSpec -ArgumentList @("/c", "omniroute --no-open") -WindowStyle Hidden

    $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    do {
        Start-Sleep -Seconds 2
        if (Test-LocalTcpPort -HostName "127.0.0.1" -PortNumber $Port) { break }
    } while ((Get-Date) -lt $deadline)

    if (-not (Test-LocalTcpPort -HostName "127.0.0.1" -PortNumber $Port)) {
        throw "OmniRoute did not open TCP port $Port within $StartupTimeoutSeconds seconds. Run 'omniroute doctor' and inspect its logs."
    }
}

Write-Host ""
Write-Host "OmniRoute is listening." -ForegroundColor Green
Write-Host "Dashboard : http://127.0.0.1:$Port"
Write-Host "API       : http://127.0.0.1:$Port/v1"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open the dashboard and connect at least one eligible provider."
Write-Host "2. Create/copy an API key from Dashboard > Endpoints."
Write-Host "3. Add the OMNIROUTE_* settings from docs/OMNIROUTE_INTEGRATION.md to ArchOS's local .env."
Write-Host "4. Verify GET /v1/models with the OmniRoute Bearer key, then restart ArchOS."
Write-Host "5. Verify GET /api/claude/status."
Write-Host ""
Write-Host "No provider credentials were written or displayed by this script." -ForegroundColor DarkGray

Start-Process "http://127.0.0.1:$Port"
