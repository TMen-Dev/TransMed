# Quickstart — Feature 011

## Prérequis
- Supabase project `vhealjcvmvvpxgaycfli` accessible
- `.env.local` configuré (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- Comptes de test : testpatient@yopmail.com (Amina) + testaidant@yopmail.com (Ben)

## Ordre d'exécution

```bash
# 1. Appliquer la migration RLS (via MCP Supabase)
#    → 010_fix_demandes_aidant_proposition_visibility.sql

# 2. Modifier src/types/demande.types.ts (STATUTS_LECTURE_SEULE)

# 3. Modifier src/views/DetailDemandeView.vue (estLectureSeule + badge)

# 4. Valider ListeDemandesView (filtre déjà en place)

# 5. Lancer l'app
pnpm run dev
```

## Scénarios de test manuels

### T1 — Filtre liste aidant
1. Connecter Ben (aidant)
2. Vérifier la barre de filtres : Toutes · Nouvelles · En cours · Mes engagements · Traitées
3. Sélectionner "Nouvelles" → seule "Amina — 1455" doit apparaître
4. Sélectionner "Traitées" → les 4 demandes traitées de Ben doivent apparaître
5. Pull-to-refresh → filtre conservé ✓

### T2 — Visibilité aidant avec proposition (après migration RLS)
1. Ben fait une proposition sur "Amina — 1455"
2. Amina accepte → statut passe en B ou D
3. Vérifier que Ben voit toujours la demande dans sa liste même si statut E ou plus

### T3 — Badge lecture seule
1. Ben ouvre "Amina — tebessa" (statut en_cours_livraison_patient)
2. Un banner "Lecture seule" doit s'afficher
3. Aucun bouton de proposition ne doit être visible

### T4 — Restriction propositions statut B
1. Créer une demande et la passer en statut B (acheteur engagé)
2. Connecter avec un autre aidant
3. Ouvrir la demande → seule l'option "Transport" doit être visible dans PropositionPanel
