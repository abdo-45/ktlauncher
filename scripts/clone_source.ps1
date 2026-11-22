param(
    [string]$SourcePath = "$PSScriptRoot/..",
    [string]$TargetPath = "$env:USERPROFILE/Desktop/KTLauncher-Source-Code-v1.0.2"
)

$SourcePath = [System.IO.Path]::GetFullPath($SourcePath)
$TargetPath = [System.IO.Path]::GetFullPath($TargetPath)

Write-Host "Cloning from $SourcePath to $TargetPath..."

if (Test-Path $TargetPath) {
    Write-Host "Target path already exists, removing..."
    Remove-Item -Recurse -Force $TargetPath
}

New-Item -ItemType Directory -Path $TargetPath | Out-Null

# Directories and files to exclude from source distribution
$excludeDirs = @("out", "dist", "node_modules", ".git", ".idea", ".vscode", "build", "bin", "keys")
$excludeExts = @(".log", ".tmp", ".key", ".pem")

Get-ChildItem -Path $SourcePath -Recurse | ForEach-Object {
    $item = $_
    $relative = $item.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
    if ([string]::IsNullOrWhiteSpace($relative)) { return }
    
    $segments = $relative -split '[\\/]'
    foreach ($seg in $segments) {
        if ($excludeDirs -contains $seg) { return }
    }

    if ($item.PSIsContainer) {
        $dest = Join-Path $TargetPath $relative
        if (-not (Test-Path $dest)) {
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
        }
    } else {
        if ($excludeExts -contains $item.Extension.ToLower()) { return }
        $dest = Join-Path $TargetPath $relative
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $item.FullName -Destination $dest -Force
    }
}

Write-Host "Source package prepared cleanly at: $TargetPath"
