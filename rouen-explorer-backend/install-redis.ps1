# Installation de Redis via Chocolatey
Write-Host "📦 Installation de Redis..." -ForegroundColor Cyan

# Vérifier si Chocolatey est installé
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if (-not $chocoInstalled) {
    Write-Host "⚠️  Chocolatey n'est pas installé." -ForegroundColor Yellow
    Write-Host "Voulez-vous installer Chocolatey? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "Installation de Chocolatey..." -ForegroundColor Cyan
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Recharger l'environnement
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "❌ Installation annulée. Vous pouvez:" -ForegroundColor Red
        Write-Host "  1. Installer Chocolatey manuellement: https://chocolatey.org/install" -ForegroundColor Yellow
        Write-Host "  2. Utiliser Docker: docker-compose up redis" -ForegroundColor Yellow
        Write-Host "  3. Télécharger Redis: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Chocolatey est installé" -ForegroundColor Green

# Installer Redis
Write-Host "Installation de Redis..." -ForegroundColor Cyan
choco install redis-64 -y

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis installé avec succès!" -ForegroundColor Green
    
    # Démarrer le service Redis
    Write-Host "Démarrage du service Redis..." -ForegroundColor Cyan
    Start-Service Redis
    
    # Vérifier que Redis fonctionne
    Write-Host "Vérification de Redis..." -ForegroundColor Cyan
    $pingResult = redis-cli ping 2>&1
    
    if ($pingResult -match "PONG") {
        Write-Host "✅ Redis est opérationnel!" -ForegroundColor Green
        Write-Host "🔗 URL de connexion: redis://localhost:6379" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Redis est installé mais ne répond pas" -ForegroundColor Yellow
        Write-Host "Essayez de le démarrer manuellement: Start-Service Redis" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Erreur lors de l'installation de Redis" -ForegroundColor Red
    Write-Host "Alternatives:" -ForegroundColor Yellow
    Write-Host "  - Docker: docker-compose up redis" -ForegroundColor Cyan
    Write-Host "  - Téléchargement manuel: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Cyan
}

Write-Host "`nPour utiliser Redis avec le projet:" -ForegroundColor Cyan
Write-Host "1. Ajoutez REDIS_URL=redis://localhost:6379 dans votre fichier .env" -ForegroundColor White
Write-Host "2. Redémarrez le serveur backend" -ForegroundColor White

Read-Host "Appuyez sur Entrée pour continuer..."
