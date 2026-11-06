[CmdletBinding()]
param(
    [string]$WorkspaceRoot = (Join-Path $HOME 'Downloads')
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not installed or is not available on PATH.'
}

function Normalize-Remote {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
    return ($Value.Trim().ToLowerInvariant() -replace '^git@github\.com:', 'https://github.com/' -replace '\.git$', '').TrimEnd('/')
}

function Test-LocalRepository {
    param(
        [string]$Name,
        [string[]]$Candidates,
        [string]$ExpectedRemote
    )

    $path = $Candidates | Where-Object { (Test-Path -LiteralPath (Join-Path $_ '.git')) } | Select-Object -First 1
    if (-not $path) {
        return [pscustomobject]@{
            Repository = $Name
            State = 'NOT FOUND'
            Path = ($Candidates -join ' | ')
            Remote = ''
            RemoteMatch = $false
            WorkingTree = ''
        }
    }

    $remote = (& git -C $path remote get-url origin 2>$null)
    if ($LASTEXITCODE -ne 0) { $remote = '' }
    $match = (Normalize-Remote $remote) -eq (Normalize-Remote $ExpectedRemote)
    $status = (& git -C $path status --short 2>$null)
    if ($LASTEXITCODE -ne 0) { $status = 'git status failed' }
    $workingTree = if ([string]::IsNullOrWhiteSpace(($status -join ''))) { 'clean' } else { 'changes present' }

    return [pscustomobject]@{
        Repository = $Name
        State = 'FOUND'
        Path = $path
        Remote = $remote
        RemoteMatch = $match
        WorkingTree = $workingTree
    }
}

function Test-HttpEndpoint {
    param([string]$Name, [string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 3
        return [pscustomobject]@{ Service = $Name; Url = $Url; Status = [int]$response.StatusCode }
    }
    catch {
        $code = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        return [pscustomobject]@{ Service = $Name; Url = $Url; Status = $(if ($code) { $code } else { 'OFFLINE / NO RESPONSE' }) }
    }
}

Write-Host ([Environment]::NewLine + '=== ARCHOS UNIVERSAL INTEGRATION CHECK ===') -ForegroundColor Cyan
Write-Host "Workspace: $WorkspaceRoot"
Write-Host 'Mode: read-only diagnostics; no files, services, or Git refs are modified.' -ForegroundColor DarkGray

$repositories = @(
    [pscustomobject]@{
        Name = 'NetworkLab'
        Remote = 'https://github.com/Daniel550-pixel/NetworkLab'
        Candidates = @((Join-Path $WorkspaceRoot 'NetworkLab'))
    },
    [pscustomobject]@{
        Name = 'AirPods Automation Framework'
        Remote = 'https://github.com/Daniel550-pixel/Airpods-4-Coding-Space'
        Candidates = @((Join-Path $WorkspaceRoot 'Airpods-4-Coding-Space'))
    },
    [pscustomobject]@{
        Name = 'Universal SaaS Solutions'
        Remote = 'https://github.com/Daniel550-pixel/Universal-SaaS-Solutions'
        Candidates = @((Join-Path $WorkspaceRoot 'Universal-SaaS-Solutions-Local'), (Join-Path $WorkspaceRoot 'Universal-SaaS-Solutions'))
    },
    [pscustomobject]@{
        Name = 'School Files Vault'
        Remote = 'https://github.com/Daniel550-pixel/School-Files-Vault'
        Candidates = @((Join-Path $WorkspaceRoot 'School-Files-Vault'))
    },
    [pscustomobject]@{
        Name = 'Project Fortress'
        Remote = 'https://github.com/Daniel550-pixel/Project-Fortress'
        Candidates = @((Join-Path $HOME 'Project-Fortress-Local'), (Join-Path $WorkspaceRoot 'Project-Fortress'))
    }
)

$repoResults = foreach ($repo in $repositories) {
    Test-LocalRepository -Name $repo.Name -Candidates $repo.Candidates -ExpectedRemote $repo.Remote
}
$repoResults | Format-Table Repository, State, RemoteMatch, WorkingTree, Path -AutoSize

Write-Host ([Environment]::NewLine + '=== KNOWN LOCAL SERVICE ENDPOINTS ===') -ForegroundColor Cyan
$endpoints = @(
    @{ Name = 'NetworkLab Client'; Url = 'http://127.0.0.1:8510/' },
    @{ Name = 'NetworkLab Management'; Url = 'http://127.0.0.1:8511/' },
    @{ Name = 'NetworkLab Infrastructure API'; Url = 'http://127.0.0.1:8512/' },
    @{ Name = 'AAF local API'; Url = 'http://127.0.0.1:8765/health' },
    @{ Name = 'Universal SaaS API'; Url = 'http://127.0.0.1:4173/api/health' },
    @{ Name = 'School Files Vault'; Url = 'http://127.0.0.1:8513/' }
)
$endpointResults = foreach ($endpoint in $endpoints) {
    Test-HttpEndpoint -Name $endpoint.Name -Url $endpoint.Url
}
$endpointResults | Format-Table Service, Status, Url -AutoSize

Write-Host ([Environment]::NewLine + '=== SUMMARY ===') -ForegroundColor Cyan
$found = @($repoResults | Where-Object State -eq 'FOUND').Count
$matched = @($repoResults | Where-Object { $_.State -eq 'FOUND' -and $_.RemoteMatch }).Count
$online = @($endpointResults | Where-Object { $_.Status -eq 200 }).Count
Write-Host "Repositories found: $found / $($repositories.Count)"
Write-Host "Git remotes matched: $matched / $($repositories.Count)"
Write-Host "HTTP endpoints returning 200: $online / $($endpoints.Count)"
Write-Host 'A missing local checkout or offline endpoint is reported, not treated as an installation failure.' -ForegroundColor DarkGray

