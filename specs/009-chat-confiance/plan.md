# Implementation Plan: Améliorations UX Chat & Confiance

**Branch**: `009-chat-confiance` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-chat-confiance/spec.md`

---

## Summary

Ajout de 7 améliorations UX inspirées de Cocolis.fr pour renforcer la confiance entre patients et aidants dans TransMed. Les améliorations s'organisent autour de 4 axes : pré-chat (discuter avant de proposer), transparence (badges de confiance, dernière connexion), engagement (charte aidants), et navigation (onglet Messages avec badge non-lus). Aucun refactoring du workflow 8 états existant — ajouts purs uniquement.

---

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Ionic 7+, Vue 3.4+, Pinia 2+, Vue Router 4, `@supabase/supabase-js` v2, Capacitor 5+
**Storage**: Supabase PostgreSQL — migrations additives sur `profiles` et `messages`
**Testing**: Vitest (unitaires composables) + test manuel sur device Huawei EMUI
**Target Platform**: Android (Huawei EMUI) + Web (localhost:5173)
**Project Type**: Mobile (Ionic/Capacitor)
**Performance Goals**: Badge non-lus mis à jour en < 5s via Realtime, indicateur last_seen précis à ±2 min
**Constraints**: Compatible EMUI — pas de Supabase Presence, pas de polling intensif, `modalController` programmatique
**Scale/Scope**: ~5 nouvelles vues/composants, ~5 nouveaux composables, 2 migrations SQL, ~8 fichiers modifiés

---

## Constitution Check

| Principe | Statut | Vérification |
|----------|--------|--------------|
| I. Stack Mobile-First (Ionic 7 + Vue 3 + Capacitor 5) | ✅ PASS | Tous les nouveaux composants utilisent IonModal, IonBadge, IonChip Ionic |
| II. Composition API Obligatoire (`<script setup>`) | ✅ PASS | Tous les nouveaux composables et composants utilisent `<script setup>` |
| III. Typage Strict (no `any`, interfaces dans `src/types/`) | ✅ PASS | Nouveaux types dans `confiance.types.ts`, extensions de `message.types.ts` et `user.types.ts` |
| IV. Accès Natif via Capacitor | ✅ PASS | Aucun accès natif nouveau requis pour cette feature |
| V. Simplicité et YAGNI | ✅ PASS | Suggestions statiques (pas d'IA), compteurs calculés en requête (pas de dénormalisation), Realtime pattern existant réutilisé |

**Résultat** : 0 violation. Pas de complexité justifiée requise.

---

## Project Structure

### Documentation (cette feature)

```text
specs/009-chat-confiance/
├── plan.md              ← ce fichier
├── spec.md              ← spécification fonctionnelle
├── research.md          ← décisions techniques
├── data-model.md        ← schéma SQL + entités
├── quickstart.md        ← guide de démarrage
├── contracts/
│   └── service-contracts.md  ← interfaces composables/services
├── tasks.md             ← généré par /speckit.tasks
└── checklists/
    └── requirements.md  ← validation spec ✅
```

### Source Code

```text
src/
├── types/
│   ├── message.types.ts        [MODIFIÉ]
│   ├── user.types.ts           [MODIFIÉ]
│   └── confiance.types.ts      [NOUVEAU]
├── constants/
│   └── messageSuggestions.ts   [NOUVEAU]
├── composables/
│   ├── useCharteAidant.ts      [NOUVEAU]
│   ├── useLastSeen.ts          [NOUVEAU]
│   ├── useUnreadMessages.ts    [NOUVEAU]
│   ├── useAidantsInteresses.ts [NOUVEAU]
│   └── useConfiance.ts         [NOUVEAU]
├── stores/
│   └── chat.store.ts           [MODIFIÉ]
├── services/supabase/
│   ├── SupabaseMessageService.ts [MODIFIÉ]
│   └── SupabaseUserService.ts    [MODIFIÉ]
├── components/
│   ├── CharteModal.vue         [NOUVEAU]
│   ├── QuickReplies.vue        [NOUVEAU]
│   ├── LastSeenBadge.vue       [NOUVEAU]
│   ├── ConfianceBadges.vue     [NOUVEAU]
│   └── DemandeCard.vue         [MODIFIÉ]
├── views/
│   ├── TabsView.vue            [MODIFIÉ]
│   ├── MessagesView.vue        [NOUVEAU]
│   ├── DetailDemandeView.vue   [MODIFIÉ]
│   ├── ChatView.vue            [MODIFIÉ]
│   └── ProfilView.vue          [MODIFIÉ]
└── router/index.ts             [MODIFIÉ]
```

**Structure Decision** : Single mobile project (Option 3 mobile — structure src/ existante préservée, extension additive uniquement).

---

## Phases d'implémentation

### Phase A — Fondations SQL & Types (prérequis bloquant)

1. Migrations SQL (009_a, 009_b, 009_c) dans Supabase
2. Mise à jour `supabase.types.ts`
3. Extension `message.types.ts` (+isRead, +readAt)
4. Extension `user.types.ts` (+lastSeenAt, +charteAcceptedAt, +telephone)
5. Création `confiance.types.ts`

### Phase B — Services & Composables (logique métier)

6. `SupabaseMessageService` : +marquerCommeLus, +countNonLus, +countAidantsInteresses
7. `SupabaseUserService` : +accepterCharte, +mettreAJourLastSeen, +getBadgesConfiance
8. `chat.store.ts` : +unreadCount, +hasUrgent, +markAsRead, +fetchUnreadCount
9. `useCharteAidant.ts` : vérification + modal flow
10. `useLastSeen.ts` : calcul du label
11. `useUnreadMessages.ts` : Realtime + markAsRead
12. `useAidantsInteresses.ts` : count dédupliqué
13. `useConfiance.ts` : badges confiance
14. `messageSuggestions.ts` : constantes par rôle
15. `authStore.initSession()` : appel `mettreAJourLastSeen`

### Phase C — Composants UI (atomes)

16. `CharteModal.vue` : modal one-time acceptation
17. `QuickReplies.vue` : suggestions premier message
18. `LastSeenBadge.vue` : indicateur connexion
19. `ConfianceBadges.vue` : badges email/téléphone/livraisons

### Phase D — Intégration dans les vues existantes

20. `DetailDemandeView.vue` : bouton "Poser une question" + `LastSeenBadge` + `useCharteAidant`
21. `ChatView.vue` : `QuickReplies` + `LastSeenBadge` header + `markAsRead` on mount
22. `DemandeCard.vue` : badge "N aidants intéressés" via `useAidantsInteresses`
23. `ProfilView.vue` : `ConfianceBadges` + champ téléphone

### Phase E — Onglet Messages (navigation globale)

24. `MessagesView.vue` : liste des conversations
25. `TabsView.vue` : +onglet Messages avec badge Realtime
26. `router/index.ts` : +route /app/messages

---

## Dépendances entre phases

```
Phase A → Phase B → Phase C → Phase D
                           → Phase E
```

Phase A est bloquante pour tout le reste (types SQL manquants = erreurs TypeScript).
Phase B est bloquante pour C et D.
Phase C est bloquante pour D uniquement.
Phase E peut démarrer dès Phase B terminée.
