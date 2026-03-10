# Tasks: Améliorations UX Chat & Confiance (009)

**Input**: Design documents from `specs/009-chat-confiance/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Organization**: Tâches groupées par user story pour une implémentation et un test indépendants.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, sans dépendances)
- **[Story]**: User story concernée (US1–US7)
- Tous les chemins sont relatifs à la racine du projet

---

## Phase 1: Setup (Fondations SQL & Types)

**Purpose**: Migrations Supabase et extensions de types TypeScript — prérequis bloquant pour toutes les phases

**⚠️ CRITIQUE**: Aucun travail sur les user stories tant que cette phase n'est pas terminée

- [X] T001 Exécuter migration SQL 009_a dans Supabase : ALTER TABLE profiles ADD COLUMN last_seen_at, charte_accepted_at, telephone (voir quickstart.md)
- [X] T002 Exécuter migration SQL 009_b dans Supabase : ALTER TABLE messages ADD COLUMN is_read, read_at + CREATE INDEX idx_messages_is_read, idx_messages_demande_role (voir quickstart.md)
- [X] T003 Exécuter migration SQL 009_c dans Supabase : CREATE POLICY destinataire_mark_read, profiles_select_authenticated, aidant_charte_update (voir quickstart.md)
- [X] T004 [P] Mettre à jour `src/types/supabase.types.ts` : ajouter last_seen_at, charte_accepted_at, telephone dans profiles.Row/Insert/Update ; ajouter is_read, read_at dans messages.Row/Insert/Update
- [X] T005 [P] Étendre `src/types/message.types.ts` : ajouter `isRead: boolean` et `readAt: string | null` à l'interface Message ; ajouter isRead/readAt dans mapRowToMessage
- [X] T006 [P] Étendre `src/types/user.types.ts` : ajouter `lastSeenAt: string | null`, `charteAcceptedAt: string | null`, `telephone: string | null` à l'interface Profil
- [X] T007 Créer `src/types/confiance.types.ts` : interface BadgeConfiance avec emailVerifie, telephoneRenseigne, nbLivraisonsReussies

**Checkpoint**: Migrations appliquées, types TypeScript à jour — démarrer les phases US

---

## Phase 2: Foundational (Services & Composables de base)

**Purpose**: Logique métier partagée entre plusieurs user stories

**⚠️ CRITIQUE**: Bloque les phases US1, US2, US3, US4, US5, US6, US7

- [X] T008 Étendre `src/services/supabase/SupabaseMessageService.ts` : ajouter méthode `marquerCommeLus(demandeId, userId)` qui UPDATE messages SET is_read=true, read_at=now() WHERE demande_id=X AND auteur_id!=userId AND is_read=false
- [X] T009 Étendre `src/services/supabase/SupabaseMessageService.ts` : ajouter méthode `countNonLus(userId)` qui retourne `{ count: number, hasUrgent: boolean }` via requête avec JOIN sur demandes WHERE patient_id=userId OR acheteur_id=userId OR transporteur_id=userId, filtre auteur_id!=userId AND is_read=false
- [X] T010 Étendre `src/services/supabase/SupabaseMessageService.ts` : ajouter méthode `countAidantsInteresses(demandeId)` qui calcule UNION de propositions.aidant_id + messages.auteur_id(role=aidant) et retourne count dédupliqué
- [X] T011 Étendre `src/services/supabase/SupabaseUserService.ts` : ajouter méthodes `accepterCharte(userId)`, `mettreAJourLastSeen(userId)`, `mettreAJourTelephone(userId, telephone)`, `getLastSeen(userId)`, `getBadgesConfiance(userId)`
- [X] T012 Mettre à jour `src/stores/auth.store.ts` dans `initSession()` : appeler `userService.mettreAJourLastSeen(userId)` après récupération de session pour mettre à jour last_seen_at à chaque démarrage de l'app
- [X] T013 Créer `src/constants/messageSuggestions.ts` : tableau statique `MESSAGE_SUGGESTIONS` avec suggestions pour rôle 'aidant' (3 items) et 'patient' (3 items)

**Checkpoint**: Services et données de base disponibles — toutes les phases US peuvent démarrer

---

## Phase 3: User Story 1 — Pré-chat (Priority: P1) 🎯 MVP

**Goal**: L'aidant peut initier une conversation avec le patient avant de se proposer formellement

**Independent Test**: En tant qu'aidant, cliquer "Poser une question" sur une demande `nouvelle_demande` → chat s'ouvre → envoyer message → côté patient la demande ne montre aucune proposition

### Implémentation US1

- [X] T014 [US1] Étendre `src/stores/chat.store.ts` : ajouter `markAsRead(demandeId, userId)` qui appelle `messageService.marquerCommeLus()` et met à jour l'état local
- [X] T015 [P] [US1] Créer `src/composables/useCharteAidant.ts` : `charteAcceptee: ComputedRef<boolean>`, `showCharteModal: Ref<boolean>`, `verifierEtProceder(action)`, `accepterCharte()` — vérification depuis `authStore.currentUser.charteAcceptedAt`
- [X] T016 [P] [US1] Créer `src/components/CharteModal.vue` : IonModal programmatique (`modalController.create()`) affiché via `useCharteAidant`, contenu de la charte TransMed (confidentialité médicale, délais, signalement imprévu), boutons "J'accepte et je continue" et "Annuler", style cohérent avec le design system TransMed
- [X] T017 [US1] Modifier `src/views/DetailDemandeView.vue` : afficher bouton "Poser une question" uniquement si `currentUser.role === 'aidant'` ET `demande.statut === 'nouvelle_demande'`, appeler `verifierEtProceder()` du composable charte, puis naviguer vers `/app/demandes/:id/chat`
- [X] T018 [US1] Modifier `src/views/ChatView.vue` : appeler `chatStore.markAsRead(demandeId, currentUser.id)` dans `onMounted()` pour marquer les messages comme lus à l'ouverture

**Checkpoint**: US1 — L'aidant peut poser une question avant de se proposer (charte + pré-chat fonctionnel)

---

## Phase 4: User Story 2 — Charte des aidants one-time (Priority: P2)

**Goal**: Modal Charte TransMed affiché exactement une fois avant toute action aidant

**Independent Test**: Aidant sans charte acceptée → premier clic "Se proposer" → modal charte → accepter → proposition créée ; second clic → pas de modal

### Implémentation US2

- [X] T019 [US2] Modifier `src/views/DetailDemandeView.vue` : wrapper le bouton "Se proposer" existant avec `verifierEtProceder()` de `useCharteAidant` (même pattern que bouton "Poser une question" de US1)
- [X] T020 [US2] Modifier `src/components/PropositionPanel.vue` (si boutons de proposition y sont définis) : wrapper tout déclencheur de proposition avec `verifierEtProceder()`
- [X] T021 [US2] Vérifier que `CharteModal.vue` est inclus dans `App.vue` ou via `modalController` partout où `verifierEtProceder()` est appelé (pas de dépendance à une page précise)

**Checkpoint**: US2 — Charte affichée une seule fois pour tout aidant avant proposition ou pré-chat

---

## Phase 5: User Story 3 — Badge non-lus tab bar (Priority: P2)

**Goal**: Onglet Messages dans la tab bar avec badge non-lus coloré selon urgence, visible depuis toutes les pages

**Independent Test**: Recevoir un message non-lu → naviguer sur l'onglet Demandes → badge orange/rouge visible sur onglet Messages ; lire le message → badge disparaît

### Implémentation US3

- [X] T022 [US3] Étendre `src/stores/chat.store.ts` : ajouter `unreadCount: Ref<number>`, `hasUrgent: Ref<boolean>`, `fetchUnreadCount(userId)` (appelle `messageService.countNonLus`), `markAsRead(demandeId, userId)` — le store est la source de vérité de l'état, sans Realtime propre
- [X] T023 [P] [US3] Créer `src/composables/useUnreadMessages.ts` : wrapper du store exposant `unreadCount`, `hasUrgent`, `badgeColor: ComputedRef<'danger'|'warning'>`, `markAsRead(demandeId)`; gère la souscription Supabase Realtime sur INSERT messages (filtrée par demandes de l'utilisateur) et appelle `chatStore.fetchUnreadCount()` à chaque événement — le composable gère Realtime, le store gère l'état
- [X] T024 [P] [US3] Créer `src/views/MessagesView.vue` : liste de toutes les conversations de l'utilisateur (demandes avec au moins un message), triée par `MAX(messages.created_at)` décroissant (calculé côté requête Supabase), avec IonList/IonItem Ionic, indicateur non-lus par conversation, navigation vers `/app/demandes/:id/chat`
- [X] T025 [US3] Modifier `src/views/TabsView.vue` : ajouter onglet `messages` avec icône chat SVG, `IonBadge` dynamique depuis `useUnreadMessages`, couleur `color="danger"` si `hasUrgent` sinon `color="warning"`, badge masqué si count = 0
- [X] T026 [US3] Modifier `src/router/index.ts` : ajouter route `{ path: 'messages', component: () => import('../views/MessagesView.vue') }` comme enfant de `/app/`
- [X] T027 [US3] Intégrer `useUnreadMessages` dans `App.vue` (ou store global) via `onMounted` pour initialiser le count dès le démarrage de session et maintenir la souscription Realtime active sur toutes les pages

**Checkpoint**: US3 — Badge non-lus visible depuis toutes les pages ; onglet Messages fonctionnel

---

## Phase 6: User Story 4 — Badge "N aidants intéressés" (Priority: P3)

**Goal**: La DemandeCard du patient affiche le nombre d'aidants uniques ayant proposé ou pré-chaté

**Independent Test**: Patient crée demande → aidant envoie pré-chat → badge "1 aidant intéressé" visible sur la DemandeCard dans les 5 secondes

### Implémentation US4

- [X] T028 [P] [US4] Créer `src/composables/useAidantsInteresses.ts` : `count: Ref<number>`, `refresh()` qui appelle `messageService.countAidantsInteresses(demandeId)`, souscription Realtime sur INSERT propositions et INSERT messages pour auto-refresh
- [X] T029 [US4] Modifier `src/components/DemandeCard.vue` : pour les demandes du patient (`isOwner = currentUser.id === demande.patientId`), afficher badge "N aidant(s) intéressé(s)" via `useAidantsInteresses(demande.id)`, masqué si count = 0, style inline discret (couleur `--tm-green-light`)

**Checkpoint**: US4 — Badge aidants intéressés en temps réel sur les cartes demandes patient

---

## Phase 7: User Story 5 — Indicateur dernière connexion (Priority: P3)

**Goal**: L'aidant voit la dernière connexion du patient dans DetailDemandeView et dans le header du chat

**Independent Test**: Se connecter patient → attendre → consulter depuis aidant → indicateur "En ligne" ou "Vu il y a Xh" correct

### Implémentation US5

- [X] T030 [P] [US5] Créer `src/composables/useLastSeen.ts` : `label: ComputedRef<string>` avec seuils (< 30min → "En ligne" vert, < 24h → "Vu il y a Xh" neutre, ≥ 24h → "Inactif depuis X jours" orange, null → "Connexion inconnue"), `rawDate: Ref<string|null>`, `refresh()` appelant `userService.getLastSeen(userId)`
- [X] T031 [P] [US5] Créer `src/components/LastSeenBadge.vue` : composant réutilisable affichant le label de `useLastSeen(userId)`, point coloré animé si "En ligne", props `userId: string` et `size?: 'sm'|'md'` (défaut 'sm')
- [X] T032 [US5] Modifier `src/views/DetailDemandeView.vue` : afficher `LastSeenBadge` avec `userId=demande.patientId` visible uniquement pour l'aidant (rôle aidant), positionné près du titre ou des infos patient
- [X] T033 [US5] Modifier `src/views/ChatView.vue` : afficher `LastSeenBadge` dans le header IonToolbar (sous le titre "Chat") avec `userId` de l'interlocuteur (patient si aidant, aidant si patient)

**Checkpoint**: US5 — Indicateur dernière connexion visible dans la vue détail et le chat

---

## Phase 8: User Story 6 — Suggestions de messages rapides (Priority: P4)

**Goal**: Suggestions contextuelles apparaissent dans un chat vide, disparaissent après le premier envoi

**Independent Test**: Ouvrir un chat vide en tant qu'aidant → 3 suggestions aidant visibles → cliquer une → texte dans le champ → envoyer → suggestions disparaissent

### Implémentation US6

- [X] T034 [P] [US6] Créer `src/components/QuickReplies.vue` : props `role: 'aidant'|'patient'` et `visible: boolean`, lit `MESSAGE_SUGGESTIONS` depuis `messageSuggestions.ts`, affiche chips/bulles horizontales scrollables, emit `select(texte: string)` au clic, style discret avec IonChip Ionic
- [X] T035 [US6] Modifier `src/views/ChatView.vue` : importer `QuickReplies`, calculer `showSuggestions = messages.length === 0 AND !hasSentMessage`, afficher `<QuickReplies :role="currentUser.role" :visible="showSuggestions" @select="onSuggestionSelected">`, handler `onSuggestionSelected(texte)` qui pré-remplit `contenu.value = texte`, mettre `hasSentMessage = true` après premier envoi

**Checkpoint**: US6 — Suggestions de messages contextuels fonctionnelles

---

## Phase 9: User Story 7 — Badges de confiance (Priority: P4)

**Goal**: Email vérifié, téléphone renseigné et compteur de livraisons visibles dans le profil et les propositions

**Independent Test**: Renseigner un téléphone dans le profil → badge "✅ Téléphone renseigné" visible dans ProfilView et dans la liste des propositions reçues d'un patient

### Implémentation US7

- [X] T036 [P] [US7] Créer `src/composables/useConfiance.ts` : `badges: Ref<BadgeConfiance>`, `fetch()` appelant `userService.getBadgesConfiance(userId)` (email_confirmed_at depuis auth metadata, telephone depuis profiles, count demandes traitées)
- [X] T037 [P] [US7] Créer `src/components/ConfianceBadges.vue` : props `userId: string` et `compact?: boolean`, utilise `useConfiance(userId)`, affiche "✅ Email vérifié", "✅ Téléphone renseigné", "N livraisons réussies" selon les valeurs, style cohérent avec le design system (IonChip ou badges CSS custom)
- [X] T038 [US7] Modifier `src/views/ProfilView.vue` : afficher `ConfianceBadges` avec `userId=currentUser.id` et `:compact="false"`, ajouter champ input téléphone avec `IonInput` editable, bouton "Enregistrer" qui appelle `userService.mettreAJourTelephone()`
- [X] T039 [US7] Modifier `src/components/PropositionPanel.vue` ou la vue des propositions reçues : afficher `ConfianceBadges :userId="proposition.aidantId" :compact="true"` pour chaque proposition dans la liste

**Checkpoint**: US7 — Badges de confiance visibles dans le profil et les propositions

---

## Phase Finale: Polish & Vérifications transversales

- [X] T040 [P] Vérifier que les nouveaux composants (`CharteModal`, `QuickReplies`, `LastSeenBadge`, `ConfianceBadges`) respectent les animations du design system (`tmFadeUp`, `tmPulseRing` dans App.vue)
- [X] T041 [P] Vérifier que le badge tab bar disparaît correctement lors de la lecture des messages (test complet du cycle non-lu → lu)
- [X] T042 [P] Vérifier la compatibilité EMUI : `CharteModal` via `v-if` programmatique (pattern fix 007 — éviter IonModal déclaratif)
- [X] T043 Mettre à jour `src/types/supabase.types.ts` si des champs ont été ajoutés après les tests (recalibration types)
- [X] T044 Vérifier la non-régression feature 008 : tester les 3 scénarios workflow (Sc1, Sc2, Sc3 du MEMORY.md) en entier avec les nouvelles modifications
- [X] T045 [P] Mettre à jour `CLAUDE.md` avec les nouvelles technologies/patterns si nécessaire

---

## Dépendances & Ordre d'exécution

### Dépendances entre phases

- **Phase 1 (Setup SQL & Types)**: Aucune dépendance — commence immédiatement
- **Phase 2 (Foundational)**: Dépend de Phase 1 — **BLOQUE toutes les phases US**
- **Phase 3 (US1)**: Dépend de Phase 2
- **Phase 4 (US2)**: Dépend de Phase 3 (réutilise `CharteModal` et `useCharteAidant`)
- **Phase 5 (US3)**: Dépend de Phase 2 — indépendante de US1/US2
- **Phase 6 (US4)**: Dépend de Phase 2 — indépendante de US1/US2/US3
- **Phase 7 (US5)**: Dépend de Phase 2 — indépendante des autres
- **Phase 8 (US6)**: Dépend de Phase 2 et Phase 3 (modifie ChatView.vue)
- **Phase 9 (US7)**: Dépend de Phase 2 — indépendante des autres
- **Phase Finale**: Dépend de toutes les phases US

### Dépendances entre user stories

```
Phase 1 (SQL) → Phase 2 (Services)
                        ↓
          ┌─────────────┼──────────────────────┐
          ↓             ↓                      ↓
       US1 (P1)      US3 (P2)              US4/US5/US7 (P3/P4)
          ↓
       US2 (P2) [réutilise CharteModal de US1]
          ↓
       US6 (P4) [modifie ChatView créé/modifié en US1]
```

### Opportunités de parallélisation

- T004, T005, T006, T007 — tous parallèles (Phase 1)
- T008, T009, T010, T011 — parallèles entre eux dans Phase 2 (fichiers différents)
- Phase 5 (US3) peut démarrer dès Phase 2 terminée, en parallèle de Phase 3/4
- Phase 6 (US4), Phase 7 (US5), Phase 9 (US7) peuvent démarrer en parallèle dès Phase 2
- T028, T030, T034, T036, T037 — tous parallèles (fichiers différents)

---

## Exemple parallèle — Phase 2

```
[Parallèle] T008 → SupabaseMessageService.marquerCommeLus
[Parallèle] T009 → SupabaseMessageService.countNonLus
[Parallèle] T010 → SupabaseMessageService.countAidantsInteresses
[Parallèle] T011 → SupabaseUserService nouvelles méthodes
[Parallèle] T013 → messageSuggestions.ts constantes
[Séquentiel] T012 → authStore.initSession (dépend de T011)
```

---

## Stratégie d'implémentation

### MVP (Phase 1 + Phase 2 + Phase 3 uniquement)

1. Migrations SQL (Phase 1) — ~20 min
2. Services de base (Phase 2) — ~1h
3. US1 pré-chat + charte (Phase 3) — ~2h
4. **STOP et VALIDATION** : tester le pré-chat de bout en bout
5. Déploiement MVP si validé

### Livraison incrémentale

1. Phase 1 + 2 → fondations prêtes
2. Phase 3 (US1) → pré-chat ✅ → valider
3. Phase 4 (US2) → charte renforcée ✅ → valider
4. Phase 5 (US3) → onglet Messages ✅ → valider
5. Phase 6+7 (US4+US5) → badges dynamiques ✅ → valider
6. Phase 8+9 (US6+US7) → suggestions + confiance ✅ → valider
7. Phase Finale → polish + non-régression

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Total tâches | 45 |
| Phase Setup (SQL+Types) | 7 tâches |
| Phase Foundational | 6 tâches |
| US1 Pré-chat (P1) | 5 tâches |
| US2 Charte (P2) | 3 tâches |
| US3 Tab Messages (P2) | 6 tâches |
| US4 Badge intéressés (P3) | 2 tâches |
| US5 Dernière connexion (P3) | 4 tâches |
| US6 Suggestions chat (P4) | 2 tâches |
| US7 Badges confiance (P4) | 4 tâches |
| Phase Finale | 6 tâches |
| Tâches parallélisables [P] | 22 tâches |
| Nouveaux fichiers créés | 11 |
| Fichiers modifiés | 10 |
