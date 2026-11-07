[CmdletBinding()]
param(
    [int]$Port = 20128,
    [int]$StartupTimeoutSeconds = 60
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

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is not available. Install Node.js LTS first, then rerun this script."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not available. Install Node.js LTS first, then rerun this script."
}

if (-not (Get-Command omniroute -ErrorAction SilentlyContinue)) {
    Write-Host "Installing OmniRoute from npm..." -ForegroundColor Yellow
    & npm install --global omniroute
    if ($LASTEXITCODE -ne 0) {
        throw "OmniRoute installation failed (npm exit code $LASTEXITCODE)."
    }
}

$omniCommand = Get-Command omniroute -ErrorAction SilentlyContinue
if (-not $omniCommand) {
    throw "OmniRoute was installed, but 'omniroute' is not on PATH. Open a new PowerShell window and rerun."
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
Write-Host "1. Open the dashboard and connect your provider account(s)."
Write-Host "2. Create/copy an API key from Dashboard > Endpoints."
Write-Host "3. Add the OMNIROUTE_* settings from docs/OMNIROUTE_INTEGRATION.md to ArchOS's local .env."
Write-Host "4. Restart ArchOS and verify GET /api/claude/status."
Write-Host ""
Write-Host "No provider credentials were written or displayed by this script." -ForegroundColor DarkGray

Start-Process "http://127.0.0.1:$Port"
