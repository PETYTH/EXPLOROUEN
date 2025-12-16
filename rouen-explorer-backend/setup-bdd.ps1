# Script de configuration automatique de la nouvelle base Supabase
# Exécutez ce script APRÈS avoir mis à jour le mot de passe dans .env

Write-Host "🚀 Configuration de la nouvelle base de données Supabase..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que le mot de passe a été mis à jour
$envContent = Get-Content .env -Raw
if ($envContent -match '\[VOTRE_MOT_DE_PASSE\]') {
    Write-Host "❌ ERREUR: Vous devez d'abord mettre à jour le mot de passe dans le fichier .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Allez sur https://supabase.com/dashboard" -ForegroundColor Yellow
    Write-Host "2. Sélectionnez votre projet hxdkddyylupenfnkxafn" -ForegroundColor Yellow
    Write-Host "3. Settings > Database > Révélez le mot de passe" -ForegroundColor Yellow
    Write-Host "4. Remplacez [VOTRE_MOT_DE_PASSE] dans .env par le vrai mot de passe" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Mot de passe trouvé dans .env" -ForegroundColor Green
Write-Host ""

# Étape 1 : Pousser le schéma
Write-Host "📊 Étape 1/5 : Création des tables dans PostgreSQL..." -ForegroundColor Cyan
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la création des tables" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tables créées avec succès" -ForegroundColor Green
Write-Host ""

# Étape 2 : Générer le client Prisma
Write-Host "🔧 Étape 2/5 : Génération du client Prisma..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Client Prisma généré" -ForegroundColor Green
Write-Host ""

# Étape 3 : Insérer les données
Write-Host "🌱 Étape 3/5 : Insertion des données de test..." -ForegroundColor Cyan
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Erreur lors du seed, tentative avec le seed simple..." -ForegroundColor Yellow
    npx tsx prisma/seed-simple.ts
}
Write-Host "✅ Données insérées avec succès" -ForegroundColor Green
Write-Host ""

# Étape 4 : Arrêter les anciens processus Node
Write-Host "🧹 Étape 4/5 : Nettoyage des anciens processus..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
Write-Host ""

# Étape 5 : Lancer le backend
Write-Host "🚀 Étape 5/5 : Démarrage du backend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Le backend va démarrer. Pour lancer aussi le frontend, ouvrez un nouveau terminal et exécutez :" -ForegroundColor Yellow
Write-Host "  cd ..\ExploRouen_Frontend" -ForegroundColor Cyan
Write-Host "  npx expo start --port 8082" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le backend" -ForegroundColor Yellow
Write-Host ""

npm run dev
