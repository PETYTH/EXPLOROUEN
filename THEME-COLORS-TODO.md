# Migration des Couleurs vers le ThemeContext

## ✅ Modifications Effectuées

### ThemeContext.tsx
- ✅ Ajout de `buttonPrimary`: `#6366F1` (dark) / `#1E40AF` (light)
- ✅ Ajout de `link`: `#6366F1` (dark) / `#1E40AF` (light)
- ✅ Ajout de `accent`: `#F59E0B` (doré pour les deux modes)

### app/(tabs)/index.tsx (Page d'accueil)
- ✅ Boutons du header (theme toggle, notifications) → `colors.buttonPrimary`
- ✅ Liens "Voir tout" → `colors.link`
- ✅ Cercles de progression actifs → `colors.buttonPrimary`
- ✅ ActivityIndicator → `colors.buttonPrimary`

## 📋 À Faire (TODO)

### Pages Prioritaires

#### app/(tabs)/activities.tsx
- [ ] Remplacer tous les `#1E40AF` par `colors.primary` (déjà fait normalement)
- [ ] Vérifier les boutons et liens

#### app/(tabs)/profile.tsx
- [ ] ActivityIndicator → `colors.buttonPrimary`
- [ ] Icônes `#6366F1` → `colors.buttonPrimary`
- [ ] Étoiles de notation → `colors.buttonPrimary`
- [ ] LinearGradient → utiliser `colors.buttonPrimary`
- [ ] Bouton déconnexion → `colors.buttonPrimary`

#### app/(tabs)/map.tsx
- [ ] Vérifier les couleurs des marqueurs et boutons

#### app/(tabs)/messages.tsx
- [ ] Vérifier les couleurs des bulles de chat

### Pages Secondaires

#### app/monument/[id].tsx
- [ ] ActivityIndicator → `colors.buttonPrimary`
- [ ] Boutons d'action → `colors.buttonPrimary`
- [ ] Badges → `colors.buttonPrimary`

#### app/activity/[id].tsx
- [ ] ActivityIndicator → `colors.buttonPrimary`
- [ ] Boutons d'inscription → `colors.buttonPrimary`

#### app/create-monument.tsx
- [ ] Bordures d'erreur `#6366F1` → `colors.buttonPrimary`
- [ ] Icônes → `colors.buttonPrimary`
- [ ] Bouton submit → `colors.buttonPrimary`

#### app/create-activity.tsx
- [ ] Bordures d'erreur `#6366F1` → `colors.buttonPrimary`
- [ ] Icônes → `colors.buttonPrimary`
- [ ] Bouton submit → `colors.buttonPrimary`

#### app/notifications.tsx
- [ ] Icônes de notification → `colors.buttonPrimary`
- [ ] Badge → `colors.buttonPrimary`
- [ ] Bordure de notification non lue → `colors.buttonPrimary`

#### app/splash.tsx
- [ ] LinearGradient → utiliser `colors.buttonPrimary`
- [ ] ActivityIndicator → `colors.buttonPrimary`
- [ ] Boutons → `colors.buttonPrimary`

#### app/get-started.tsx
- [ ] LinearGradient → utiliser `colors.buttonPrimary`
- [ ] Boutons → `colors.buttonPrimary`

### Autres Pages
- [ ] app/all-monuments.tsx
- [ ] app/contact.tsx
- [ ] app/legal.tsx
- [ ] app/(auth)/auth.tsx
- [ ] app/(auth)/forgot-password.tsx
- [ ] app/chat/[id].tsx

## 🎨 Palette de Couleurs Rouen

### Mode Dark
- **Primary (Bleu Seine)**: `#1E40AF`
- **Button/Link (Indigo)**: `#6366F1`
- **Accent (Doré)**: `#F59E0B`
- **Sport (Rouge)**: `#DC2626`
- **Background**: `#1A1A1A`
- **Surface**: `#2D2D2D`
- **Text**: `#FFFFFF`

### Mode Light
- **Primary (Bleu Seine)**: `#1E40AF`
- **Button/Link (Bleu Seine)**: `#1E40AF`
- **Accent (Doré)**: `#F59E0B`
- **Sport (Rouge)**: `#DC2626`
- **Background**: `#FAFAFA`
- **Surface**: `#FFFFFF`
- **Text**: `#1F2937`

## 🔍 Commande de Recherche

Pour trouver toutes les occurrences restantes :
```powershell
# Rechercher #6366F1 (indigo)
Get-ChildItem -Recurse -Include *.tsx,*.ts -Path "ExploRouen_Frontend/app" | Select-String "#6366F1"

# Rechercher #1E40AF (bleu Seine)
Get-ChildItem -Recurse -Include *.tsx,*.ts -Path "ExploRouen_Frontend/app" | Select-String "#1E40AF"
```

## 📝 Notes
- Toutes les couleurs doivent maintenant passer par `colors.buttonPrimary`, `colors.link`, `colors.primary` ou `colors.accent`
- Les couleurs spécifiques (rouge sport `#DC2626`, doré `#F59E0B`) peuvent rester en dur car elles ne changent pas entre les modes
- Privilégier l'utilisation de `useTheme()` pour accéder aux couleurs dans tous les composants
