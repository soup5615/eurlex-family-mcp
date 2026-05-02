# eurlex-family — installeur en une commande pour Windows.
#
# Usage (à coller dans PowerShell) :
#   iwr -useb https://raw.githubusercontent.com/soup5615/eurlex-family-mcp/claude/succession-law-software-0YUMr/install.ps1 | iex
#
# Ce script télécharge l'application, la dépose sur votre Bureau, et
# la lance automatiquement si Docker ou Node.js sont installés.

$ErrorActionPreference = "Stop"

$Repo = "soup5615/eurlex-family-mcp"
$Branch = "claude/succession-law-software-0YUMr"
$ArchiveUrl = "https://github.com/$Repo/archive/refs/heads/$([uri]::EscapeDataString($Branch)).tar.gz"

$Desktop = [Environment]::GetFolderPath("Desktop")
$Dest = if ($env:INSTALL_DIR) { $env:INSTALL_DIR } else { Join-Path $Desktop "eurlex-family" }

Write-Host ""
Write-Host "─── eurlex-family — installation sur le Bureau ───" -ForegroundColor White
Write-Host ""

if (Test-Path $Dest) {
    Write-Host "Le dossier existe déjà : $Dest" -ForegroundColor Yellow
    $r = Read-Host "Le supprimer et réinstaller ? [o/N]"
    if ($r -match "^[oOyY]") {
        Remove-Item -Recurse -Force $Dest
    } else {
        Write-Host "Installation annulée."
        exit 0
    }
}

New-Item -ItemType Directory -Path $Dest | Out-Null

$tmp = [System.IO.Path]::GetTempFileName() + ".tar.gz"
Write-Host "Téléchargement de l'application (~5 Mo)..."
try {
    Invoke-WebRequest -Uri $ArchiveUrl -OutFile $tmp -UseBasicParsing
} catch {
    Write-Host "Erreur de téléchargement." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# tar est inclus dans Windows 10+ (1803+).
& tar -xzf $tmp -C $Dest --strip-components=1
Remove-Item $tmp

Write-Host "✓ Application installée dans : $Dest" -ForegroundColor Green
Write-Host ""

# Détection runtime + lancement
$launched = $false

if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker détecté → lancement automatique." -ForegroundColor Green
        Push-Location $Dest
        & cmd /c start-docker.bat
        Pop-Location
        $launched = $true
    }
}

if (-not $launched -and (Get-Command node -ErrorAction SilentlyContinue)) {
    $nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]") 2>$null)
    if ($nodeMajor -ge 20) {
        Write-Host "Node.js $nodeMajor détecté → lancement automatique." -ForegroundColor Green
        Push-Location $Dest
        & cmd /c start.bat
        Pop-Location
        $launched = $true
    }
}

if (-not $launched) {
    Write-Host ""
    Write-Host "Pour utiliser l'application, installez UNE des deux options :" -ForegroundColor White
    Write-Host ""
    Write-Host "  Docker Desktop (recommandé) :" -ForegroundColor Cyan
    Write-Host "    https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    Write-Host "  Node.js 20+ (alternative) :" -ForegroundColor Cyan
    Write-Host "    https://nodejs.org/fr/"
    Write-Host ""
    Write-Host "Puis ouvrez le dossier '$Dest' et double-cliquez sur :"
    Write-Host "  - start-docker.bat (si vous avez choisi Docker)"
    Write-Host "  - start.bat        (si vous avez choisi Node.js)"
    Write-Host ""
    Write-Host "Guide complet : $Dest\INSTALLATION.md"
}
