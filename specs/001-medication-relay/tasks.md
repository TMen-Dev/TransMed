# Tasks: TransMed — Mise en relation patients-aidants pour médicaments

**Input**: Design documents from `/specs/001-medication-relay/`
**Branch**: `001-medication-relay` | **Date**: 2026-02-18
**Prerequisites**: plan.md ✓ spec.md ✓ data-model.md ✓ contracts/ ✓ research.md ✓ quickstart.md ✓

**Tests**: Non demandés — aucune tâche de test générée (TDD optionnel à ajouter ultérieurement).

**Organisation**: Tâches groupées par user story pour permettre une implémentation et une validation indépendantes.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Peut s'exécuter en parallèle (fichiers différents, aucune dépendance incomplète)
- **[Story]**: User story à laquelle la tâche appartient (US1, US2, US3, US4)
- Les chemins de fichiers sont absolus depuis la racine du dépôt

---

## Phase 1: Setup — Infrastructure partagée (T001–T004)

**But**: Initialisation du projet et configuration de base

- [x] T001 Initialiser le projet Ionic/Vue/Capacitor et installer les dépendances (`npm install pinia @pinia/plugin-persistedstate @capacitor/camera @capacitor/preferences vitest @vue/test-utils cypress`) dans `package.json`
- [x] T002 [P] Activer TypeScript strict dans `tsconfig.json` (`strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`)
- [x] T003 [P] Configurer ESLint + Prettier dans `.eslintrc.cjs` et `.prettierrc`
- [x] T004 [P] Créer la structure de dossiers : `src/types/`, `src/services/interfaces/`, `src/services/mock/data/`, `src/stores/`, `src/composables/`, `src/views/`, `src/components/`, `src/router/`

---

## Phase 2: Fondations — Prérequis bloquants (T005–T022)

**But**: Types TypeScript, interfaces de services et infrastructure applicative partagée par toutes les user stories

**⚠️ CRITIQUE** : Aucune user story ne peut démarrer avant la fin de cette phase

### Types TypeScript

- [x] T005 [P] Créer `src/types/user.types.ts` : `RoleUtilisateur`, `Utilisateur`, `CreateUtilisateurDto`
- [x] T006 [P] Créer `src/types/demande.types.ts` : `StatutDemande` (union 8 valeurs), `TypeEvenement`, `Demande`, `CreateDemandeDto`
- [x] T007 [P] Créer `src/types/medicament.types.ts` : `Medicament` (nom, quantite)
- [x] T008 [P] Créer `src/types/proposition.types.ts` : `TypeProposition`, `Proposition`, `CreatePropositionDto`
- [x] T009 [P] Créer `src/types/cagnotte.types.ts` : `StatutCagnotte`, `Cagnotte`, `Contribution`, `DefinirMontantCibleDto`, `AjouterContributionDto`
- [x] T010 [P] Créer `src/types/ordonance.types.ts` : `MimeTypeOrdonance`, `Ordonance`
- [x] T011 [P] Créer `src/types/message.types.ts` : `Message`, `SendMessageDto`

### Interfaces de services (copier depuis `specs/001-medication-relay/contracts/`)

- [x] T012 [P] Créer `src/services/interfaces/IUserService.ts` (getAll, getById, create)
- [x] T013 [P] Créer `src/services/interfaces/IDemandeService.ts` (getAll, getById, getByPatientId, getActiveForAidant, create, updateStatut, confirmerParPatient, marquerLivree)
- [x] T014 [P] Créer `src/services/interfaces/IPropositionService.ts` (getByDemandeId, create)
- [x] T015 [P] Créer `src/services/interfaces/IOrdonanceService.ts` (upload, getByDemandeId)
- [x] T016 [P] Créer `src/services/interfaces/ICagnotteService.ts` (createForDemande, getByDemandeId, definirMontantCible, ajouterContribution, getContributions)
- [x] T017 [P] Créer `src/services/interfaces/IMessageService.ts` (getByDemandeId, send)

### Infrastructure applicative

- [x] T018 Créer `src/router/index.ts` : routes `/inscription`, `/app/demandes`, `/app/demandes/:id`, `/app/demandes/:id/chat`, `/app/apropos` avec structure Tabs + stack
- [x] T019 Configurer `src/main.ts` : createApp + `@ionic/vue` + Pinia (avec `@pinia/plugin-persistedstate`) + router
- [x] T020 Créer `src/stores/auth.store.ts` (`useAuthStore`) : state `currentUser: Utilisateur | null`, actions `setUser`, `logout`
- [x] T021 Créer `src/composables/useCurrentUser.ts` : expose `currentUser`, `isPatient`, `isAidant` en lecture depuis `useAuthStore`
- [x] T022 Créer `src/views/InscriptionView.vue` : champ prénom + sélection rôle (patient/aidant) + bouton valider → `useAuthStore.setUser()` → redirect `/app/demandes`

**Checkpoint** : La structure compile sans erreur. `ionic serve` affiche l'écran d'inscription. Prêt pour les user stories.

---

## Phase 3: User Story 1 — Patient crée une demande (Priority: P1) 🎯 MVP

**But**: Le patient peut créer une demande (médicaments + adresse + ordonnance obligatoire) et la consulter dans son historique.

**Test indépendant**: Créer une demande via l'UI → vérifier qu'elle apparaît dans la liste du patient avec statut `attente_fonds_et_transporteur`.

### Données et services mock

- [x] T023 [P] [US1] Créer `src/services/mock/data/users.mock.ts` : 2 patients (`alice`, `karim`) + 2 aidants (`ben`, `leila`) avec IDs stables
- [x] T024 [P] [US1] Créer `src/services/mock/data/demandes.mock.ts` : 2 demandes (statuts 1 et 5) liées à `alice`, avec `ordonanceId` et `cagnotteId` référencés
- [x] T025 [P] [US1] Créer `src/services/mock/data/cagnottes.mock.ts` : une cagnotte par demande mock (`en_attente_evaluation` et `ouverte`)
- [x] T026 [US1] Créer `src/services/mock/MockUserService.ts` : implémente `IUserService`, retourne données de `users.mock.ts`
- [x] T027 [US1] Créer `src/services/mock/MockOrdonanceService.ts` : implémente `IOrdonanceService` — stockage `Map<demandeId, Ordonance>` en mémoire avec `base64Data`
- [x] T028 [US1] Créer `src/services/mock/MockCagnotteService.ts` : implémente `createForDemande` et `getByDemandeId` (méthodes minimales pour US1 — complété en US2)
- [x] T029 [US1] Créer `src/services/mock/MockDemandeService.ts` : implémente `getAll`, `getByPatientId`, `getActiveForAidant` (retourne `[]` pour US1), `create` (appelle `ordonanceService.upload()` + `cagnotteService.createForDemande()` + ajoute en tableau local)
- [x] T030 [US1] Créer `src/services/index.ts` : exporter `userService`, `demandeService`, `ordonanceService`, `cagnotteService` (instances Mock)

### Stores

- [x] T031 [US1] Créer `src/stores/demandes.store.ts` (`useDemandeStore`) : state `demandes: Demande[]`, actions `fetchForPatient(patientId)`, `createDemande(dto)` — utilise `demandeService` depuis `index.ts`
- [x] T032 [US1] Créer `src/stores/cagnotte.store.ts` (`useCagnotteStore`) : state `cagnottesParDemande: Map<string, Cagnotte>`, action `fetchForDemande(demandeId)` — utilisé dans DetailDemandeView (US2+)

### Composable caméra/fichier

- [x] T033 [US1] Créer `src/composables/useOrdonance.ts` : expose `ordonnance: Ref<Ordonance | null>`, `pickError`, `pickFromCameraOrGallery(source: CameraSource)` via `@capacitor/camera` (CameraResultType.DataUrl), `pickFromFiles()` via `<input type="file">` + FileReader (PDF + image, limite 10 Mo)

### Composants

- [x] T034 [P] [US1] Créer `src/components/StatutBadge.vue` : badge `IonBadge` coloré par `StatutDemande` (prop `statut: StatutDemande`), libellé lisible (ex. "En attente de fonds et transporteur")
- [x] T035 [P] [US1] Créer `src/components/MedicamentItem.vue` : affiche `Medicament.nom` + quantité (prop `medicament: Medicament`)
- [x] T036 [US1] Créer `src/components/OrdonanceUploader.vue` : bouton → `IonActionSheet` (Caméra / Galerie / Fichier PDF) → appelle `useOrdonance` → aperçu `<img>` ou `<iframe>` selon mimeType — émet `update:modelValue` avec l'`Ordonance`
- [x] T037 [US1] Créer `src/components/DemandeCard.vue` : `IonCard` affichant médicaments (via `MedicamentItem`), adresse, `StatutBadge`, date — prop `demande: Demande`

### Vues

- [x] T038 [US1] Créer `src/views/CreationDemandeView.vue` (IonModal) : formulaire avec ajout dynamique de `Medicament` (nom + quantité), champ adresse, `OrdonanceUploader` (obligatoire), bouton "Publier" → `useDemandeStore.createDemande()` → ferme la modal
- [x] T039 [US1] Créer `src/views/ListeDemandesView.vue` (tab 1) : Patient → `useDemandeStore.fetchForPatient()` + liste `DemandeCard` + bouton FAB "Créer" ouvre `CreationDemandeView` en `IonModal`; tap sur une carte → navigate `/app/demandes/:id`

**Checkpoint US1** : Patient peut créer une demande avec ordonnance et la voir dans sa liste. Aucun aidant requis.

---

## Phase 4: User Story 2 — Aidant propose son aide (Priority: P2)

**But**: L'aidant voit les demandes actives (statuts 1–5), consulte le détail, soumet une Prop1/2/3. Le statut de la demande se met à jour selon la machine d'états (FR-007). L'acheteur fixe le montant cible de la cagnotte.

**Test indépendant**: Soumettre Prop3 sur une demande statut 1 → statut passe à `pret_acceptation_patient` (6).

### Machine d'états

- [x] T040 [US2] Créer `src/services/demandeStateMachine.ts` : objet `TRANSITIONS: Record<StatutDemande, Partial<Record<TypeEvenement, StatutDemande>>>` (8 entrées, toutes les cellules de FR-007), fonctions pures `applyTransition(statut, evenement)` (throws si transition illégale) et `canTransition(statut, evenement): boolean`

### Données et services mock

- [x] T041 [P] [US2] Créer `src/services/mock/data/propositions.mock.ts` : 2+ propositions sur les demandes mock (Prop1 sur demande 1, Prop2 sur demande 2)
- [x] T042 [US2] Créer `src/services/mock/MockPropositionService.ts` : implémente `IPropositionService` — `create()` valide les pré-conditions (Prop1 bloquée si cagnotte `en_attente_evaluation`, Prop2 refusée si transporteurId déjà assigné FR-024, Prop3 prévaut)
- [x] T043 [US2] Mettre à jour `src/services/mock/MockCagnotteService.ts` : ajouter `definirMontantCible()` (statut → `ouverte`), `ajouterContribution()` (recalcule `montantCollecte`, passe à `atteinte` si objectif atteint), `getContributions()`
- [x] T044 [US2] Mettre à jour `src/services/index.ts` : ajouter export `propositionService = new MockPropositionService()`

### Stores

- [x] T045 [US2] Créer `src/stores/propositions.store.ts` (`usePropositionsStore`) : state `propositionsParDemande: Map<string, Proposition[]>`, action `fetchForDemande(demandeId)`, action `createProposition(dto)` → appelle `propositionService.create()` puis détermine l'événement TypeEvenement et appelle `useDemandeStore.triggerTransition()`
- [x] T046 [US2] Mettre à jour `src/stores/demandes.store.ts` : ajouter getter `demandesActivesAidant` (statuts 1–5), action `triggerTransition(demandeId, evenement)` → `applyTransition()` + `demandeService.updateStatut()`, action `fetchAll()`
- [x] T047 [US2] Mettre à jour `src/stores/cagnotte.store.ts` : ajouter actions `definirMontantCible(dto)` et `ajouterContribution(dto)` — si `objectifAtteint` → appelle `useDemandeStore.triggerTransition(demandeId, 'prop1_cagnotte_atteinte')`

### Composants

- [x] T048 [P] [US2] Créer `src/components/CagnotteProgress.vue` : `IonProgressBar` + montant collecté / montant cible (ou "En attente d'évaluation") — props `cagnotte: Cagnotte`
- [x] T049 [P] [US2] Créer `src/components/StatutTimeline.vue` : progression visuelle 8 étapes (icônes + libellés), statut courant mis en évidence — prop `statut: StatutDemande`
- [x] T050 [US2] Créer `src/components/ContributionForm.vue` : input montant (nombre > 0) + bouton "Contribuer" — émet `submit` avec le montant; affiché uniquement si cagnotte `ouverte`
- [x] T051 [US2] Créer `src/components/PropositionPanel.vue` : panel aidant — boutons Prop1/Prop2/Prop3 affichés selon `canTransition()`; Prop1 déclenche `ContributionForm`; Prop2/Prop3 soumettent directement; bouton "Définir montant cible" si cagnotte `en_attente_evaluation` (aidant acheteur uniquement)

### Vues

- [x] T052 [US2] Créer `src/views/DetailDemandeView.vue` : affiche `Demande` complète — liste médicaments (`MedicamentItem`), adresse, `StatutBadge`, `StatutTimeline`, `CagnotteProgress`, liste propositions reçues (FR-010 : prénom aidant + type + montant Prop1), `PropositionPanel` (aidant uniquement), bouton "Voir ordonnance" (acheteur/Prop3 uniquement → ouvre `IonModal` avec `<img>` ou `<iframe>`)
- [x] T053 [US2] Mettre à jour `src/views/ListeDemandesView.vue` : Aidant → `useDemandeStore.fetchAll()` + afficher `demandesActivesAidant` (statuts 1–5); navigation vers `DetailDemandeView` au tap

**Checkpoint US2** : L'aidant peut soumettre Prop1/2/3, le statut se met à jour, la cagnotte progresse. L'acheteur peut fixer le montant cible.

---

## Phase 5: User Story 3 — Patient confirme et suit sa demande (Priority: P3)

**But**: Le patient voit le statut courant (libellé lisible), confirme au statut 6 pour lancer la livraison (→ statut 7).

**Test indépendant**: Avec une demande en statut 6, le patient voit le bouton "Confirmer" → tap → statut passe à 7 et le bouton disparaît.

- [x] T054 [US3] Mettre à jour `src/stores/demandes.store.ts` : ajouter action `confirmerParPatient(demandeId)` → `demandeService.confirmerParPatient()` + met à jour le statut en local
- [x] T055 [US3] Mettre à jour `src/views/DetailDemandeView.vue` (section patient) : afficher bouton "Confirmer la livraison" uniquement si `demande.statut === 'pret_acceptation_patient'` ET `isPatient`; tap → `useDemandeStore.confirmerParPatient()` → bouton disparaît, statut rafraîchi
- [x] T056 [US3] Mettre à jour `src/views/DetailDemandeView.vue` : afficher infos aidant assigné (prénom, type Prop3/Prop2) à partir de `propositions` quand statut ≥ 6
- [x] T057 [US3] Mettre à jour `src/views/ListeDemandesView.vue` (Patient) : trier demandes par `createdAt` desc, afficher `StatutBadge` avec libellé lisible pour tous les statuts 1–8

**Checkpoint US3** : Le patient voit sa demande progresser, confirme au bon moment. Historique complet visible.

---

## Phase 6: User Story 4 — Aidant marque la livraison effectuée (Priority: P4)

**But**: L'aidant Prop3 marque les médicaments comme livrés depuis le statut 7 → statut 8 (`traitee`).

**Test indépendant**: Avec une demande en statut 7, l'aidant Prop3 voit "Médicaments livrés" → tap → statut passe à 8 et la demande disparaît de la liste aidant.

- [x] T058 [US4] Mettre à jour `src/stores/demandes.store.ts` : ajouter action `marquerLivree(demandeId)` → `demandeService.marquerLivree()` + met à jour statut + `deliveredAt` en local
- [x] T059 [US4] Mettre à jour `src/views/DetailDemandeView.vue` : afficher bouton "Médicaments livrés" uniquement si `demande.statut === 'en_cours_livraison'` ET `isAidant` ET l'aidant courant est le transporteurId assigné; tap → `useDemandeStore.marquerLivree()` → statut → `traitee`

**Checkpoint US4** : Le cycle complet est fonctionnel — Statut 1 → 8 possible de bout en bout.

---

## Phase 7: Chat — Fonctionnalité transversale (FR-013/FR-014)

**But**: Chaque demande dispose d'un chat accessible dès sa création (statut 1), permettant aux aidants d'échanger avec le patient.

- [x] T060 [P] Créer `src/services/mock/data/messages.mock.ts` : 3+ messages sur la demande mock #1 (auteurs patient + aidant, horodatages variés)
- [x] T061 Créer `src/services/mock/MockMessageService.ts` : implémente `IMessageService` — `getByDemandeId()` filtre `messages.mock.ts`, `send()` ajoute au tableau local avec horodatage courant
- [x] T062 Mettre à jour `src/services/index.ts` : ajouter export `messageService = new MockMessageService()`
- [x] T063 Créer `src/stores/chat.store.ts` (`useChatStore`) : state `messagesParDemande: Map<string, Message[]>`, actions `fetchMessages(demandeId)`, `sendMessage(dto)` — utilise `messageService` depuis `index.ts`
- [x] T064 Créer `src/composables/useChat.ts` : wraps `useChatStore`, expose `messages`, `sendMessage`, `scrollToBottom(containerRef)` (affecte `scrollTop = scrollHeight`)
- [x] T065 [P] Créer `src/components/MessageBubble.vue` : bulle de chat — alignée à droite si `auteurId === currentUser.id`, sinon gauche; affiche `auteurPrenom`, `contenu`, `createdAt` formaté — prop `message: Message`
- [x] T066 Créer `src/views/ChatView.vue` : `div` flex + `overflow-y: auto` + `v-for` de `MessageBubble` + `IonFooter` avec `IonInput` + bouton "Envoyer" → `useChat.sendMessage()` + scroll auto; état vide avec texte d'invitation
- [x] T067 Mettre à jour `src/views/DetailDemandeView.vue` : ajouter bouton "Accéder au Chat" (visible pour tous les rôles, tous statuts) → navigate `/app/demandes/:id/chat`

---

## Phase 8: Polish & Préoccupations transversales (T068–T075)

**But**: Finalisation des vues manquantes, états vides, cas limites et validation du projet

- [x] T068 [P] Créer `src/views/AProposView.vue` (tab 2) : explication du fonctionnement de l'application TransMed (texte statique + `IonCard` par étape : Création → Propositions → Cagnotte → Confirmation → Livraison)
- [x] T069 Ajouter gestion ordonnance access-control dans `src/services/mock/MockOrdonanceService.ts` : `getByDemandeId()` vérifie que l'appelant a soumis une Prop3 sur la demande (FR-017) — lève une erreur sinon
- [x] T070 Ajouter état vide dans `src/views/ListeDemandesView.vue` : message "Aucune demande" avec icône et call-to-action adapté au rôle
- [x] T071 Ajouter état vide dans `src/views/ChatView.vue` : texte "Aucun message — posez votre première question !" si `messages.length === 0`
- [x] T072 [P] Mettre à jour `src/services/mock/MockDemandeService.ts` : `updateStatut()` vérifie que le nouveau statut est différent de l'actuel (throws sinon), `marquerLivree()` vérifie `statut === 'en_cours_livraison'` (FR-010b), `confirmerParPatient()` vérifie `statut === 'pret_acceptation_patient'` (FR-008)
- [x] T073 [P] Mettre à jour `src/views/CreationDemandeView.vue` : afficher message d'erreur si médicaments vides OU ordonnance manquante au moment de la soumission (FR-001, FR-016)
- [x] T074 Vérifier la configuration `capacitor.config.ts` : `appId`, `appName`, plugins Camera avec `iosScheme: 'ionic'`; vérifier que `Info.plist` contient `NSCameraUsageDescription` et `NSPhotoLibraryUsageDescription` pour iOS
- [x] T075 Valider le projet : lancer `ionic serve` → dérouler le flux complet (inscription → création demande → proposition aidant → confirmation patient → livraison) conformément à `specs/001-medication-relay/quickstart.md`

---

## Dépendances & ordre d'exécution

### Dépendances entre phases

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Fondations — BLOQUE tout)
    │
    ├──► Phase 3 (US1 — P1) 🎯 MVP
    │         │
    │         ▼
    │    Phase 4 (US2 — P2)  ← dépend de US1 (services index, stores)
    │         │
    │         ▼
    │    Phase 5 (US3 — P3)  ← dépend de US2 (DetailDemandeView)
    │         │
    │         ▼
    │    Phase 6 (US4 — P4)  ← dépend de US3 (stores demandes)
    │
    ├──► Phase 7 (Chat)       ← peut démarrer après US1 (services index prêt)
    │
    └──► Phase 8 (Polish)     ← dépend de toutes les user stories
```

### Dépendances entre tâches dans les phases

- **Types (T005–T011)** : Parallélisables entre eux
- **Interfaces (T012–T017)** : Parallélisables, dépendent des types (T005–T011)
- **Infrastructure (T018–T022)** : Séquentiel (router → main → stores → vues)
- **Par user story** : données mock → services mock → `index.ts` → stores → composants → vues

### Opportunités de parallélisme

| Groupe | Tâches parallélisables |
|--------|------------------------|
| Phase 2 — Types | T005, T006, T007, T008, T009, T010, T011 |
| Phase 2 — Interfaces | T012, T013, T014, T015, T016, T017 |
| Phase 3 — Mock data | T023, T024, T025 |
| Phase 3 — Composants | T034, T035 (puis T036, T037 dépendent de T033/T034) |
| Phase 4 — Mock data | T041 |
| Phase 4 — Composants | T048, T049 (puis T050, T051 séquentiels) |
| Phase 7 — Data + composant | T060, T065 |
| Phase 8 — Tâches isolées | T068, T069, T073, T074 |

---

## Stratégie d'implémentation

### MVP First — User Story 1 uniquement

1. Compléter Phase 1 (Setup)
2. Compléter Phase 2 (Fondations — CRITIQUE)
3. Compléter Phase 3 (US1)
4. **ARRÊTER et VALIDER** : Patient peut créer une demande avec ordonnance, la voir dans sa liste
5. Démonstration / revue possible dès cette étape

### Livraison incrémentale

```
Phase 1+2 → US1 (MVP!)     → US2 (+propositions, machine d'états, cagnotte)
         → US3 (+confirmation patient)    → US4 (+livraison finale)
         → Chat (+échanges)   → Polish (+finition)
```

Chaque phase ajoute de la valeur sans casser les phases précédentes.

### Stratégie en parallèle (2 développeurs)

- **Dev A** : Phase 1 → Phase 2 (Types + Interfaces) → US1 → US3
- **Dev B** : Phase 2 (Infrastructure) → US2 (Machine d'états + Propositions + Cagnotte) → US4 → Chat

---

## Résumé

| Phase | User Story | Tâches | Fichiers clés |
|-------|-----------|--------|---------------|
| 1 — Setup | — | T001–T004 | `package.json`, `tsconfig.json` |
| 2 — Fondations | — | T005–T022 | `src/types/`, `src/services/interfaces/`, `router/`, `main.ts`, `auth.store` |
| 3 — US1 (P1) 🎯 | Patient crée demande | T023–T039 | `MockDemandeService`, `useOrdonance`, `CreationDemandeView`, `ListeDemandesView` |
| 4 — US2 (P2) | Aidant propose aide | T040–T053 | `demandeStateMachine`, `MockPropositionService`, `DetailDemandeView`, `PropositionPanel` |
| 5 — US3 (P3) | Patient confirme | T054–T057 | `DetailDemandeView` (bouton confirmation), `ListeDemandesView` (historique) |
| 6 — US4 (P4) | Aidant livre | T058–T059 | `DetailDemandeView` (bouton livraison) |
| 7 — Chat | FR-013/FR-014 | T060–T067 | `MockMessageService`, `chat.store`, `ChatView` |
| 8 — Polish | — | T068–T075 | `AProposView`, états vides, validations, smoke test |

**Total** : **75 tâches** | **Opportunités parallèles** : 8 groupes identifiés

---

## Notes

- `[P]` = fichiers différents, aucune dépendance sur une tâche incomplète de la même phase
- Chaque user story est indépendamment testable avant de passer à la suivante
- Les services mockés (`MockXxxService`) ne dépendent que des interfaces TypeScript — aucune modification requise lors de la migration Supabase
- Un seul fichier à modifier pour la migration vers Supabase : `src/services/index.ts`
- Committer après chaque tâche ou groupe logique cohérent
- S'arrêter aux checkpoints pour valider indépendamment chaque user story
- Interdire : `any`, Options API, import direct des Mock (toujours via `src/services/index.ts`)
