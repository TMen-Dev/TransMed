# Quickstart: TransMed v1.1 — Corrections UX

**Feature**: `002-ux-fixes`

---

## Environnement

```bash
cd /mnt/c/Training/Ionic/TransMed
npm run dev   # Vite devserver → http://localhost:5173
```

## Test manuel des 9 user stories

### US-1 — Authentification

1. Ouvrir `http://localhost:5173` → redirection `/inscription`
2. Saisir `alice@transmed.fr` / `test1234` → cliquer "Se connecter" → accès à la liste
3. Tester identifiants incorrects → message d'erreur visible
4. Cliquer "Créer un compte" → formulaire d'inscription s'affiche
5. Se déconnecter → retour à l'écran de connexion

### US-2 — Footer navigation

1. Se connecter → vérifier la barre d'onglets en bas de l'écran
2. Naviguer entre "Demandes" et "À propos" via les onglets
3. Ouvrir un détail de demande → onglets non visibles (comportement normal)

### US-3 — Bouton retour

1. Naviguer vers un détail → flèche retour en haut à gauche
2. Ouvrir le chat → flèche retour en haut à gauche
3. Style identique sur tous les écrans

### US-4 — "Propositions actives"

1. Se connecter comme Benjamin (aidant) → titre "Propositions actives"
2. Se connecter comme Alice (patient) → titre "Mes demandes"

### US-5 — Validation "Financé"

1. Se connecter comme Alice → ouvrir "demande-001" (Doliprane + Amoxicilline)
2. Vérifier la timeline → étape "Financé" grisée (cagnotte à 45/120€)

### US-6 — Voir ordonnance

1. Se connecter comme Benjamin (aidant avec Prop1 sur demande-001)
2. Ouvrir le détail de la demande d'Alice → section "Ordonnance" visible
3. Cliquer "Voir l'ordonnance" → modal avec image s'affiche

### US-7 — Upload ordonnance obligatoire

1. Se connecter comme Alice → créer une demande
2. Remplir médicaments + adresse SANS ordonnance → bouton "Publier" désactivé
3. Joindre une ordonnance → bouton "Publier" s'active

### US-8 — Télécharger ordonnance

1. Benjamin sur demande-001 → bouton "Télécharger ordonnance" visible → cliquer → toast confirmation
2. Leila (transporteur sur demande-001) → bouton visible
3. Karim (sans proposition) → pas de bouton visible

### US-9 — Notification email mockée

1. Utiliser la demande-001 (déjà avec transporteur Leila)
2. Faire une contribution pour atteindre 120€ → toast "Email envoyé au patient" + log console
3. Vérifier que le toast ne réapparaît pas en rechargant
