Param(
    [string]$PythonExe = "",
    [string]$TaskName = "BPB-PLM-LocalHelper",
    [switch]$SkipTask
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$helperPy = Join-Path $scriptDir 'plm_local_helper.py'

if (-not (Test-Path $helperPy)) {
    throw "No se encontro $helperPy"
}

if ([string]::IsNullOrWhiteSpace($PythonExe)) {
    $PythonExe = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
    if (-not $PythonExe) {
        $PythonExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
    }
    if (-not $PythonExe) {
        $PythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
    }
}

if (-not $PythonExe) {
    throw 'No se encontro python/pythonw en PATH.'
}

$localDir = Join-Path $env:LOCALAPPDATA 'BPB\PLMHelper'
New-Item -Path $localDir -ItemType Directory -Force | Out-Null

$localHelper = Join-Path $localDir 'plm_local_helper.py'
Copy-Item -Path $helperPy -Destination $localHelper -Force

$launcherVbs = Join-Path $localDir 'run_plm_local_helper.vbs'
$pythonEsc = $PythonExe.Replace('"', '""')
$helperEsc = $localHelper.Replace('"', '""')
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run """" & "$pythonEsc" & """ """ & "$helperEsc" & """", 0, False
"@
Set-Content -Path $launcherVbs -Value $vbsContent -Encoding ASCII -Force


function Test-HelperRunning {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:51377/health" -Method Post -ContentType "application/json" -Body "{}" -TimeoutSec 2
        return ($resp.status -eq 'success')
    } catch {
        return $false
    }
}


function Ensure-StartupShortcut {
    param(
        [string]$ShortcutPath,
        [string]$LauncherPath
    )

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = 'wscript.exe'
    $shortcut.Arguments = '"' + $LauncherPath + '"'
    $shortcut.WorkingDirectory = Split-Path -Parent $LauncherPath
    $shortcut.WindowStyle = 7
    $shortcut.Description = 'BPB PLM Local Helper'
    $shortcut.Save()
}

$taskCreated = $false
if (-not $SkipTask) {
    try {
        $taskRun = 'wscript.exe "' + $launcherVbs + '"'
        schtasks /Create /TN "$TaskName" /TR "$taskRun" /SC ONLOGON /F /RL LIMITED | Out-Null
        schtasks /Run /TN "$TaskName" | Out-Null
        $taskCreated = $true
        Write-Host "Task '$TaskName' instalada y ejecutada."
    } catch {
        Write-Warning "No se pudo crear tarea programada. Se usara Inicio de Windows. Detalle: $($_.Exception.Message)"
    }
}

if (-not $taskCreated) {
    $startupDir = [Environment]::GetFolderPath('Startup')
    $shortcutPath = Join-Path $startupDir 'BPB PLM Local Helper.lnk'
    Ensure-StartupShortcut -ShortcutPath $shortcutPath -LauncherPath $launcherVbs
    Write-Host "Autoarranque configurado en Inicio: $shortcutPath"
}

if (-not (Test-HelperRunning)) {
    Start-Process -FilePath 'wscript.exe' -ArgumentList ('"' + $launcherVbs + '"') -WindowStyle Hidden
    Start-Sleep -Milliseconds 900
}

if (Test-HelperRunning) {
    Write-Host "Helper activo en segundo plano."
} else {
    Write-Warning "No se pudo verificar helper activo en localhost:51377."
}

Write-Host "Ruta local helper: $localHelper"
