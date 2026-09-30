# Windows host runner for AD-011. Uses docker.exe (not wsl.exe).
# wsl.exe on this machine hangs after the child exits and stacked migrate/pest.
param(
    [int]$TimeoutSec = 600,
    [switch]$ClearStale,
    [switch]$Status,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$SailArgs
)

$ErrorActionPreference = "Stop"
$repoWin = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$apiWin = Join-Path $repoWin "api"
$lockWin = Join-Path $apiWin ".sail-gate.lock"
$statusWin = Join-Path $repoWin ".specs\.sail-gate-status.json"

function Write-GateStatus([hashtable]$Payload) {
    $dir = Split-Path $statusWin -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    $Payload.updated_at = (Get-Date).ToString("s")
    ($Payload | ConvertTo-Json -Depth 6) | Set-Content -Path $statusWin -Encoding utf8
}

function Get-Lock {
    if (-not (Test-Path $lockWin)) { return $null }
    try { return Get-Content $lockWin -Raw | ConvertFrom-Json } catch { return $null }
}

if ($Status) {
    $lock = Get-Lock
    Write-GateStatus @{ state = "done"; command = "--status"; exit = 0; lock = $lock }
    @{ lock = $lock } | ConvertTo-Json -Depth 6
    if ($lock) { exit 3 }
    exit 0
}

$existing = Get-Lock
if ($existing) {
    $pidExisting = [int]$existing.pid
    $alive = $false
    try { $alive = (Get-Process -Id $pidExisting -ErrorAction Stop) -ne $null } catch { $alive = $false }
    if ($alive) {
        Write-Error "Sail gate locked by pid $pidExisting ($($existing.command))"
        exit 3
    }
    Remove-Item $lockWin -Force -ErrorAction SilentlyContinue
}

function Get-GatePids {
    # docker top on Docker Desktop reports VM PIDs; docker exec kill those IDs
    # as "No such process". Detect leftovers inside the container PID namespace.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $out = docker exec api-laravel.test-1 sh -c "ps -eo pid=,args= | grep -E 'artisan migrate|vendor/bin/pest|vendor/bin/pint|vendor/bin/phpstan' | grep -vE 'grep|pkill' || true"
    $ErrorActionPreference = $prev
    if (-not $out) { return @() }
    return @($out -split "\s+" | Where-Object { $_ -match '^\d+$' })
}

function Invoke-StaleClear {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    docker exec api-laravel.test-1 sh -c "pkill -9 -f 'vendor/bin/pest' || true; pkill -9 -f 'vendor/bin/pint' || true; pkill -9 -f 'vendor/bin/phpstan' || true; pkill -9 -f 'artisan migrate' || true" | Out-Null
    $ErrorActionPreference = $prev
    Start-Sleep -Seconds 5
}

function Assert-NoStackedGates {
    $pids = Get-GatePids
    if ($pids.Count -gt 0) {
        Write-Error "Refuse: leftover gate PIDs in laravel.test: $($pids -join ', '). Re-run with -ClearStale."
        exit 3
    }
}

Push-Location $apiWin
try {
    if ($ClearStale -and ($null -eq $SailArgs -or $SailArgs.Count -eq 0)) {
        Invoke-StaleClear
        Write-GateStatus @{ state = "cleared"; command = "--clear-stale"; exit = 0 }
        exit 0
    }

    # PowerShell treats a bare "--" as an ambiguous parameter. Callers pass args directly.
    if (-not $SailArgs -or $SailArgs.Count -eq 0) {
        Write-Error "pass a sail command after --"
        exit 2
    }

    $command = "sail " + ($SailArgs -join " ")
    @{ pid = $PID; started_at = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(); command = $command } |
        ConvertTo-Json | Set-Content $lockWin -Encoding utf8
    Write-GateStatus @{ state = "running"; command = $command; pid = $PID }

    Invoke-StaleClear
    if ($SailArgs[0] -ne "up") {
        Assert-NoStackedGates
    }

    $exe = @()
    if ($SailArgs[0] -eq "up") {
        $exe = @("docker", "compose") + $SailArgs
    } elseif ($SailArgs[0] -eq "ps") {
        $exe = @("docker", "compose", "ps")
    } elseif ($SailArgs[0] -eq "exec") {
        $svc = $SailArgs[1]
        $rest = $SailArgs[2..($SailArgs.Length - 1)]
        $exe = @("docker", "compose", "exec", "-T", $svc) + $rest
    } elseif ($SailArgs[0] -eq "artisan") {
        $exe = @("docker", "compose", "exec", "-T", "laravel.test", "php") + $SailArgs
    } elseif ($SailArgs[0] -eq "pest") {
        $rest = @()
        if ($SailArgs.Length -gt 1) { $rest = $SailArgs[1..($SailArgs.Length - 1)] }
        $exe = @("docker", "compose", "exec", "-T", "laravel.test", "php", "vendor/bin/pest") + $rest
    } elseif ($SailArgs[0] -eq "php") {
        $exe = @("docker", "compose", "exec", "-T", "laravel.test") + $SailArgs
    } else {
        $exe = @("docker", "compose", "exec", "-T", "laravel.test") + $SailArgs
    }

    $outWin = Join-Path $repoWin ".specs\.sail-gate-stdout.txt"
    $errWin = Join-Path $repoWin ".specs\.sail-gate-stderr.txt"
    $bin = $exe[0]
    $arg = $exe[1..($exe.Length - 1)]
    $p = Start-Process -FilePath $bin -ArgumentList $arg -WorkingDirectory $apiWin -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput $outWin -RedirectStandardError $errWin
    $code = $p.ExitCode
    if (Test-Path $outWin) { Get-Content $outWin }
    if (Test-Path $errWin) { Get-Content $errWin }
    Write-GateStatus @{ state = "done"; command = $command; exit = $code }
    exit $code
}
finally {
    $lockNow = Get-Lock
    if ($lockNow -and [int]$lockNow.pid -eq $PID) {
        Remove-Item $lockWin -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
}
