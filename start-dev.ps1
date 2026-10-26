<#
.SYNOPSIS
  One-command local development launcher for LoomWeaver V2.
  Starts:
    1. SSH Database Tunnel (MySQL 'loomweaver' on 127.0.0.1:3307 & Neo4j 'loomweaver' on 127.0.0.1:7687)
    2. LoomWeaver V2 .NET 10 Backend API (http://localhost:5000)
    3. LoomWeaver V2 Angular Frontend Dev Server (http://localhost:4200 -> proxies /api & /hubs to :5000)
#>

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  LoomWeaver V2 — Unified Local Development Launcher" -ForegroundColor Green
Write-Host "  Backend (.NET 10): http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend (Angular): http://localhost:4200" -ForegroundColor Cyan
Write-Host "  Database: MySQL 'loomweaver' + Neo4j 'loomweaver'" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

# 1. Start SSH Tunnel for MySQL (3307->3306) & Neo4j (7687->7687) if not already listening
$tunnelOpen = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 3307)
    $tcp.Close()
    $tunnelOpen = $true
    Write-Host "[1/3] SSH Database Tunnel already active on 127.0.0.1:3307." -ForegroundColor DarkGreen
} catch {
    $tunnelOpen = $false
}

$sshProc = $null
if (-not $tunnelOpen) {
    $sshExe = "C:\Program Files\Git\usr\bin\ssh.exe"
    if (-not (Test-Path $sshExe)) { $sshExe = "ssh" }
    Write-Host "[1/3] Starting background SSH Tunnel to 209.46.127.226 (MySQL:3307, Neo4j:7687)..." -ForegroundColor Yellow
    try {
        $sshProc = Start-Process -FilePath $sshExe `
            -ArgumentList "-N -L 3307:127.0.0.1:3306 -L 7687:127.0.0.1:7687 -L 7474:127.0.0.1:7474 -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 mythweaver-ubuntu" `
            -WindowStyle Hidden -PassThru
    } catch {
        Write-Host "      (SSH tunnel optional locally; backend will use built-in fallback if offline)" -ForegroundColor DarkGray
    }
}

# 2. Start .NET 10 Backend in a dedicated background process / window
Write-Host "[2/3] Launching LoomWeaver V2 .NET 10 Backend on http://localhost:5000 ..." -ForegroundColor Yellow
$backendProc = Start-Process -FilePath "dotnet" `
    -ArgumentList "run --project `"$BackendDir\src\LoomWeaver.Api\LoomWeaver.Api.csproj`" --urls http://localhost:5000" `
    -WorkingDirectory $BackendDir `
    -NoNewWindow -PassThru

# 3. Start Angular Frontend Dev Server on http://localhost:4200
Write-Host "[3/3] Launching LoomWeaver V2 Angular Frontend on http://localhost:4200 ..." -ForegroundColor Yellow
Write-Host "      Press Ctrl+C at any time to stop both Frontend and Backend." -ForegroundColor Gray

try {
    Set-Location $FrontendDir
    npm start
} finally {
    Write-Host "`nStopping LoomWeaver V2 .NET 10 Backend..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($sshProc -and -not $sshProc.HasExited) {
        Stop-Process -Id $sshProc.Id -Force -ErrorAction SilentlyContinue
    }
    Set-Location $RepoRoot
}
