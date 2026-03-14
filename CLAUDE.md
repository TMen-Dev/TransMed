# TransMed Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-10

## Active Technologies
- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Capacitor 5+, Pinia 2+, Vue Router 4, Vite 5, `@capacitor/camera`, `@capacitor/filesystem` (001-medication-relay)
- MVP — mock data TypeScript/JSON + base64 locale (ordonnances) ; Future — Supabase (PostgreSQL) + Supabase Storage (ordonnances, bucket privé + signed URLs) (001-medication-relay)
- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Pinia 2+, Vue Router 4, Vite 5 (002-ux-fixes)
- Mock TypeScript (in-memory, base64 pour ordonnances) (002-ux-fixes)
- TypeScript 5+ (strict mode) + `@supabase/supabase-js` v2, `@capacitor/preferences` (session storage natif), Ionic 7+, Vue 3.4+, Pinia 2+, Capacitor 5+ (005-supabase-backend)
- Supabase PostgreSQL (entités) + Supabase Storage bucket `ordonnances` (fichiers) (005-supabase-backend)
- TypeScript (Deno runtime pour les Edge Functions) + TypeScript 5+ (client Ionic) + Supabase Edge Functions (Deno), Resend API (email), `@supabase/supabase-js` (admin client dans Edge Function), Vue 3.4+ / Pinia (client) (006-patient-notifications)
- PostgreSQL — nouvelle table `notification_emails` (extension du schema 005) (006-patient-notifications)
- Supabase Realtime (postgres_changes INSERT on messages) + Pinia store pattern (chat.store.ts) + composable pattern (useUnreadMessages.ts, useLastSeen.ts, useAidantsInteresses.ts) (009-chat-confiance)
- Supabase profiles: last_seen_at, charte_accepted_at, telephone ; messages: is_read, read_at (009-chat-confiance)

- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Capacitor 5+, Pinia 2+, Vue Router 4, Vite 5 (001-medication-relay)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5+ (strict mode): Follow standard conventions

## Recent Changes
- 009-chat-confiance: Supabase Realtime badge non-lus, pré-chat, CharteModal (v-if EMUI), QuickReplies, LastSeenBadge, ConfianceBadges, MessagesView, useUnreadMessages/useLastSeen/useAidantsInteresses/useConfiance/useCharteAidant composables
- 006-patient-notifications: Added TypeScript (Deno runtime pour les Edge Functions) + TypeScript 5+ (client Ionic) + Supabase Edge Functions (Deno), Resend API (email), `@supabase/supabase-js` (admin client dans Edge Function), Vue 3.4+ / Pinia (client)
- 005-supabase-backend: Added TypeScript 5+ (strict mode) + `@supabase/supabase-js` v2, `@capacitor/preferences` (session storage natif), Ionic 7+, Vue 3.4+, Pinia 2+, Capacitor 5+
- 002-ux-fixes: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
## Architecture Patterns (feature 009+)

### Realtime unread badge
- Store (`chat.store.ts`): source de vérité pour `unreadCount` + `hasUrgent` — pas de Realtime directement
- Composable (`useUnreadMessages.ts`): gère la souscription Realtime, appelle `chatStore.fetchUnreadCount()` sur chaque INSERT
- Tab bar (`TabsView.vue`): utilise `useUnreadMessages()` pour afficher le badge sur l'onglet Messages

### CharteModal (EMUI compatibility)
- Utiliser `v-if="showCharteModal"` dans le parent (jamais `IonModal` déclaratif, jamais `v-show`)
- Pattern `useCharteAidant` : `pendingAction` closure → modal → `accepterCharte()` → exécution de l'action

### Supabase colums réels (demandes)
- `acheteur_id` et `transporteur_id` (PAS `aidant_acheteur_id`/`aidant_transporteur_id`)

### Suppression demande (feature 010)
- `alertController.create()` programmatique pour confirmation (EMUI — jamais `<IonAlert>` déclaratif)
- Ordre cascade : Storage.remove → ordonnances → messages → propositions → demandes
- `STATUTS_ANNULABLES` : `nouvelle_demande`, `medicaments_achetes_attente_transporteur`, `transporteur_disponible_attente_acheteur`
- `router.replace('/app/demandes')` après succès (pas `push` pour éviter back vers demande supprimée)

### Visibilité aidant & lecture seule (feature 011)
- `STATUTS_LECTURE_SEULE` : `en_cours_livraison_transporteur`, `rdv_a_fixer`, `en_cours_livraison_patient`, `traitee` (E/F/G/H) — dans `src/types/demande.types.ts`
- `estLectureSeule` computed dans `DetailDemandeView.vue` : `isAidant && STATUTS_LECTURE_SEULE.includes(demande.statut)` → masque `peutProposer` + affiche `.lecture-seule-banner`
- Banner mobile-first : `min-height: 44px` (touch target), fond `#F0EDE8`, icône œil barré SVG — pas de `ion-note` (style custom cohérent avec les autres banners)
- RLS migration 010 : fonction `aidant_a_propose_sur(demande_id)` SECURITY DEFINER — aidant avec proposition voit sa demande jusqu'au statut H
- ⚠️ PIÈGE RLS : `EXISTS (SELECT FROM propositions)` dans `demandes_select` → récursion infinie car `propositions_select` fait `EXISTS (SELECT FROM demandes)`. Toujours utiliser une fonction SECURITY DEFINER pour briser la boucle entre tables avec des politiques croisées
<!-- MANUAL ADDITIONS END -->
