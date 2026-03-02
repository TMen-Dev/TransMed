# Tasks: Intégration backend persistant (Supabase)

**Input**: Design documents from `/specs/005-supabase-backend/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tâches groupées par User Story. US1 (auth) et US2 (persistence) sont P1 et bloquent les autres.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, sans dépendances non terminées)
- **[Story]**: User story associée (US1–US5)
- Chemins absolus depuis la racine du projet

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Installation des dépendances, initialisation du client Supabase, génération des types

- [X] T001 Installer `@supabase/supabase-js` via `npm install @supabase/supabase-js` et ajouter `"db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase.types.ts"` dans `package.json`
- [X] T002 Créer `.env.local` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (ne pas committer — vérifier `.gitignore`)
- [X] T003 Créer `src/lib/supabase.ts` — client Supabase singleton avec adapter `@capacitor/preferences` pour la persistance de session native (voir quickstart.md §7)
- [X] T004 Créer le projet Supabase (cloud ou `npx supabase start` en local) et récupérer URL + anon key pour `.env.local`

**Checkpoint**: `npm run dev` fonctionne, import `{ supabase }` depuis `src/lib/supabase.ts` ne génère pas d'erreur TypeScript.

---

## Phase 2: Fondation (Prérequis bloquants)

**Purpose**: Schéma DB, RLS, Storage bucket, types générés — DOIT être complet avant toute User Story

⚠️ **CRITIQUE**: Aucune User Story ne peut commencer avant cette phase.

- [X] T005 Appliquer les migrations SQL — tables `profiles`, `demandes`, `medicaments`, `cagnottes`, `contributions`, `propositions`, `messages`, `ordonnances` (voir data-model.md § "Schéma PostgreSQL")
- [X] T006 Configurer le trigger `handle_new_user()` sur `auth.users` pour auto-créer un profil vide lors de l'inscription (data-model.md § "Table profiles")
- [X] T007 Activer Row Level Security sur les 8 tables et appliquer toutes les politiques RLS (data-model.md § "Row Level Security")
- [X] T008 Créer la fonction PostgreSQL `update_demande_statut(p_demande_id, p_expected_statut, p_new_statut)` pour les transitions atomiques (data-model.md § "Fonction atomique")
- [X] T009 Créer le bucket Storage privé `ordonnances` (taille max 10 Mo, types: image/jpeg, image/png, application/pdf) et configurer ses politiques d'accès Storage RLS
- [X] T010 Activer Realtime sur les tables `messages` ET `demandes` : `ALTER PUBLICATION supabase_realtime ADD TABLE messages; ALTER PUBLICATION supabase_realtime ADD TABLE demandes;` — requis pour US2 (statut mis à jour sans relancer l'app) et US4 (chat temps réel)
- [X] T010b [P] Créer `src/composables/useDemandeRealtime.ts` — subscription `supabase.channel('demandes')` filtré par `id` pour pousser les mises à jour de statut dans le store `demandes` en temps réel; unsubscribe dans `onUnmounted()` (même pattern que useChat.ts); appeler ce composable depuis `src/views/DetailDemandeView.vue`
- [X] T011 Générer les types TypeScript via `npm run db:types` → `src/types/supabase.types.ts`

**Checkpoint**: `src/types/supabase.types.ts` existe, `supabase.from('demandes').select('*')` est typé, bucket `ordonnances` apparaît dans le dashboard Storage.

---

## Phase 3: User Story 1 — Inscription et connexion réelle (Priority: P1) 🎯 MVP Auth

**Goal**: Utilisateur peut créer un compte, se connecter, et retrouver sa session après fermeture de l'application.

**Independent Test**: Créer un compte → fermer l'appli → rouvrir → être encore connecté sans ressaisir les identifiants.

### Implémentation US1

- [X] T012 [US1] Mettre à jour `src/types/user.types.ts` — ajouter `email: string` comme champ requis dans l'interface `Utilisateur`, mettre à jour `CreateUtilisateurDto` pour inclure `email` et `password`
- [X] T013 [US1] Créer `src/services/supabase/SupabaseUserService.ts` implémentant `IUserService` — méthodes: `create()` (signUp + insert profil), `authenticate()` (signInWithPassword), `getById()` (select profiles), `getAll()` (non requis en prod, retourner [])
- [X] T014 [US1] Mettre à jour `src/stores/auth.store.ts` — ajouter `initSession()` (getSession + onAuthStateChange), `login()`, `register()` utilisant `userService`; la session doit persister via le Capacitor storage adapter de `src/lib/supabase.ts`
- [X] T015 [US1] Mettre à jour `src/views/InscriptionView.vue` pour appeler `authStore.register()` (email + password + prenom + role) au lieu du mock — adapter uniquement l'appel de service, ne pas modifier le design
- [X] T016 [US1] Appeler `authStore.initSession()` dans `src/App.vue` `onMounted()` pour restaurer la session au démarrage

**Checkpoint**: Inscription → connexion → fermer app → rouvrir → session restaurée automatiquement. Profil visible dans Supabase Dashboard > Table Editor > profiles.

---

## Phase 4: User Story 2 — Persistance des demandes (Priority: P1) 🎯 MVP Data

**Goal**: Demandes créées sur un appareil sont visibles sur un second appareil. Les mises à jour de statut persistent.

**Independent Test**: Créer une demande sur appareil A → ouvrir l'app sur appareil B → voir la demande dans la liste.

### Implémentation US2

- [X] T017 [US2] Créer `src/services/supabase/SupabaseDemandeService.ts` implémentant `IDemandeService` — méthodes: `getAll()`, `getById()`, `getByPatientId()`, `getActiveForAidant()`, `create()` (insert demande + médicaments + cagnotte en séquence), `updateStatut()` via RPC `update_demande_statut`, `confirmerParPatient()`, `updateTransporteur()`, `marquerLivree()`, `marquerTraitee()`, `markEmailNotifSent()`
- [X] T018 [P] [US2] Créer `src/services/supabase/SupabaseCagnotteService.ts` implémentant `ICagnotteService` — méthodes: `createForDemande()`, `getByDemandeId()` (avec contributions), `definirMontantCible()`, `ajouterContribution()` (recalcul montant + statut), `getContributions()`
- [X] T019 [P] [US2] Créer `src/services/supabase/SupabasePropositionService.ts` implémentant `IPropositionService` — méthodes: `getByDemandeId()`, `create()` (avec guard contrainte UNIQUE pour Prop2 → erreur "23505")
- [X] T020 [US2] Mettre à jour `src/services/index.ts` — remplacer les 6 imports Mock par les imports Supabase (voir quickstart.md §8)
- [X] T021 [US2] Ajouter un helper `mapRowToDemande()` dans `src/services/supabase/SupabaseDemandeService.ts` pour convertir les colonnes snake_case PostgreSQL vers les champs camelCase des types TypeScript existants (ex: `patient_id` → `patientId`, `created_at` → `createdAt`)
- [X] T021b [P] [US2] Ajouter un helper `mapRowToCagnotte()` dans `src/services/supabase/SupabaseCagnotteService.ts` incluant le chargement et la conversion des contributions depuis la table séparée `contributions` (colonnes `cagnotte_id`, `aidant_id`, `aidant_prenom`, `montant`, `created_at` → interface `Contribution` avec champs camelCase)

**Checkpoint**: Créer une demande → recharger la page → demande toujours présente. Proposition d'aidant → statut mis à jour et visible pour le patient.

---

## Phase 5: User Story 3 — Ordonnances sécurisées (Priority: P2)

**Goal**: Upload d'ordonnance dans Storage privé. Signed URLs pour les aidants autorisés. Accès refusé sans proposition.

**Independent Test**: Patient upload une ordonnance. Aidant sans proposition tente d'y accéder → refusé. Aidant avec Prop3 l'ouvre → visible.

### Implémentation US3

- [X] T022 [US3] Mettre à jour `src/types/ordonance.types.ts` — remplacer `base64Data: string` par `storagePath: string` et `signedUrl?: string` dans l'interface `Ordonance`; conserver le type pour le DTO d'upload (`base64Data` + `mimeType` toujours requis en entrée)
- [X] T023 [US3] Créer `src/services/supabase/SupabaseOrdonanceService.ts` implémentant `IOrdonanceService` — `upload()` (base64 → Blob → Storage.upload + insert table ordonnances), `getByDemandeId()` (select table + createSignedUrl expiry 3600s); si RLS refuse → propager une erreur "Accès non autorisé"
- [X] T024 [US3] Adapter `src/composables/useOrdonance.ts` et `src/components/OrdonanceModal.vue` pour utiliser `signedUrl` au lieu de `base64Data` lors de l'affichage (condition: `ordonance.signedUrl || ordonance.base64Data` pour compatibilité transitoire)

**Checkpoint**: Upload ordonnance sur Chrome → visible dans Supabase Storage. Aidant avec Prop3 voit l'ordonnance. Aidant sans proposition reçoit un message "Accès non autorisé".

---

## Phase 6: User Story 4 — Chat temps réel (Priority: P2)

**Goal**: Messages persistés. Nouveau message apparu côté destinataire en < 2s sans recharger.

**Independent Test**: Patient envoie un message. Aidant ouvert sur le même chat voit le message apparaître instantanément.

### Implémentation US4

- [X] T025 [US4] Créer `src/services/supabase/SupabaseMessageService.ts` implémentant `IMessageService` — `getByDemandeId()` (select + order by created_at), `send()` (insert message)
- [X] T026 [US4] Mettre à jour `src/composables/useChat.ts` — ajouter un `supabase.channel()` subscription sur `messages` filtré par `demande_id` pour diffusion temps réel; unsubscribe dans `onUnmounted()` (voir research.md §2)

**Checkpoint**: Deux onglets Chrome ouverts sur le même chat. Message envoyé dans un onglet → apparaît dans l'autre en < 2 secondes.

---

## Phase 7: User Story 5 — Isolation des données (Priority: P2)

**Goal**: Vérification que RLS isole correctement les données. Aucun accès croisé entre patients.

**Independent Test**: Alice ne voit que ses demandes. Manipulation directe d'ID de demande de Bob → accès refusé.

### Implémentation US5

*Note: La majorité de US5 est couverte par les politiques RLS appliquées en Phase 2. Cette phase valide et complète.*

- [X] T027 [US5] Vérifier manuellement dans Supabase Dashboard (Table Editor > RLS preview) que le patient A ne voit pas les demandes du patient B — documenter le résultat
- [X] T028 [P] [US5] Vérifier que la vue `src/views/ListeDemandesView.vue` (aidant) et `src/views/DetailDemandeView.vue` affichent un message d'erreur neutre en cas d'erreur RLS (code `42501`) plutôt qu'un écran vide
- [X] T029 [P] [US5] Vérifier que `src/stores/auth.store.ts` gère l'expiration de token JWT (`onAuthStateChange` event `SIGNED_OUT` ou `TOKEN_REFRESHED`) — rediriger vers `InscriptionView` en cas de session invalide

**Checkpoint**: Accès à une demande inexistante → message "Demande introuvable". Token expiré → redirection vers connexion.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: Gestion d'erreurs réseau, indicateurs de chargement, nettoyage

- [X] T030 [P] Vérifier que tous les stores affichent un `loading` indicator pendant les opérations Supabase (les stores existants ont déjà `loading.value = true/false` — vérifier que c'est bien déclenché)
- [X] T031 [P] Ajouter dans `src/services/supabase/` un helper partagé `handleSupabaseError(error)` qui mappe les codes d'erreur Supabase (`23505`, `PGRST116`, `42501`) vers des messages en français utilisables dans les stores
- [X] T032 Supprimer les imports des services Mock de `src/services/index.ts` une fois le swap Supabase validé (les fichiers mock peuvent être conservés pour les tests unitaires)
- [X] T033 Valider le cycle complet bout-en-bout selon quickstart.md §10 : inscription → création demande → proposition aidant → confirmation patient → livraison → clôture

---

## Dépendances & Ordre d'exécution

### Dépendances de phases

- **Phase 1 (Setup)**: Aucune dépendance — démarrage immédiat
- **Phase 2 (Foundation)**: Dépend de Phase 1 — **BLOQUE toutes les User Stories**
- **Phase 3 (US1 Auth)**: Dépend de Phase 2 — **BLOQUE Phase 4 (US2)** (swap index.ts requiert auth fonctionnelle)
- **Phase 4 (US2 Data)**: Dépend de Phase 3 (auth en place pour RLS)
- **Phases 5, 6, 7**: Dépendent de Phase 4 — peuvent s'exécuter en parallèle entre elles
- **Phase 8 (Polish)**: Dépend de toutes les User Stories

### Dépendances intra-phase

- T017 (SupabaseDemandeService) → T020 (swap index.ts)
- T018 et T019 peuvent être parallèles à T017 (fichiers différents)
- T022 (type update) → T023 (SupabaseOrdonanceService) → T024 (composant)
- T025 (SupabaseMessageService) → T026 (realtime dans useChat)

---

## Exemples de parallélisme

```bash
# Phase 2 — toutes les migrations peuvent se faire en séquence dans le SQL editor
T005 → T006 → T007 → T008 → T009 → T010+T010b → T011

# Phase 4 — 3 services en parallèle puis swap
T017 || T018+T021b || T019  →  T020 (swap index.ts) → T021

# Phases 5/6/7 — parallèles entre elles une fois Phase 4 terminée
T022-T024 (ordonnances) || T025-T026 (chat) || T027-T029 (RLS validation)
```

---

## Stratégie d'implémentation

### MVP Auth+Data (US1 + US2 seulement)

1. Compléter Phase 1 + Phase 2 (setup + DB)
2. Compléter Phase 3 (auth réelle)
3. Compléter Phase 4 (persistence demandes)
4. **STOP et VALIDER** : créer une demande depuis le web, la retrouver après rechargement
5. Démontrable : cycle inscription → demande → liste demandes

### Livraison complète

1. MVP Auth+Data validé
2. Ajouter Phase 5 (ordonnances) → tester accès sécurisé
3. Ajouter Phase 6 (chat realtime) → tester 2 onglets
4. Ajouter Phase 7 (isolation RLS) → validation sécurité
5. Phase 8 (polish) → tests bout-en-bout

---

## Notes

- [P] = fichiers différents, pas de dépendances non terminées
- [USx] = traçabilité vers la User Story du spec.md
- Committer après chaque phase validée
- Conserver les services Mock dans `src/services/mock/` — utiles pour les tests unitaires offline
- La clé `service_role` Supabase ne doit **jamais** apparaître dans le code client
