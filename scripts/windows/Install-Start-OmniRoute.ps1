[CmdletBinding()]
param(
    [int]$Port = 20128,
    [int]$StartupTimeoutSeconds = 60,
    [string]$OmniRouteVersion = "3.8.54"
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

if (-not (Get-Command omniroute -ErrorAction SilentlyContinue)) {
    $npmVersionText = (& npm --version).Trim()
    try { $npmMajor = ([version]$npmVersionText).Major } catch { throw "Could not parse npm version: $npmVersionText" }

    Write-Host "Installing official OmniRoute package v$OmniRouteVersion..." -ForegroundColor Yellow
    if ($npmMajor -ge 11) {
        Write-Host "npm 11+ detected; allowing the upstream-documented install scripts." -ForegroundColor DarkGray
        & npm install --global "--allow-scripts=omniroute,keytar,onnxruntime-node,@parcel/watcher,@swc/core,protobufjs,esbuild" "omniroute@$OmniRouteVersion"
    }
    else {
        & npm install --global "omniroute@$OmniRouteVersion"
    }
    if ($LASTEXITCODE -ne 0) {
        throw "OmniRoute installation failed (npm exit code $LASTEXITCODE). If npm reports a different lifecycle-script allowlist, use the exact package names in that warning and rerun."
    }
}

$omniCommand = Get-Command omniroute -ErrorAction SilentlyContinue
if (-not $omniCommand) {
    throw "OmniRoute is installed, but 'omniroute' is not on PATH. Open a new PowerShell window and rerun."
}

if (Test-LocalTcpPort -HostName "127.0.0.1" -PortNumber $Port) {
    Write-Host "OmniRoute is already listening on 127.0.0.1:$Port." -ForegroundColor Green
}
else {
    Write-Host "Starting OmniRoute..." -ForegroundColor Yellow
    Start-Process -FilePath $omniCommand.Source -ArgumentList @("--no-open") -WindowStyle Hidden

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
