# Research: Améliorations UX Chat & Confiance (009)

**Generated**: 2026-03-10
**Feature**: 009-chat-confiance

---

## Decision 1 — Suivi des messages non-lus

**Decision**: Ajouter un champ `is_read boolean DEFAULT false` sur la table `messages` existante, avec une colonne `read_at timestamp` optionnelle.

**Rationale**: L'approche la plus simple compatible avec la table existante. Pas de table séparée "lecture". Supabase Realtime peut filtrer sur `is_read=false` pour compter les non-lus. La mise à jour en masse (mark-as-read) se fait via `UPDATE messages SET is_read=true WHERE demande_id=X AND auteur_id!=me`.

**Alternatives considérées**:
- Table séparée `message_reads(message_id, user_id, read_at)` → surdimensionné pour une app avec peu d'utilisateurs simultanés, complexifie les requêtes.
- Compteur dénormalisé sur `demandes.unread_count` → risque de désynchronisation, complexifie les transactions.

---

## Decision 2 — Indicateur de dernière connexion (`last_seen_at`)

**Decision**: Mettre à jour `profiles.last_seen_at = now()` dans `authStore.initSession()` (déjà appelé au démarrage de l'app dans `App.vue`). Un composable `useLastSeen(userId)` calcule le label affichable.

**Rationale**: Le hook d'init de session est l'endroit idéal — il s'exécute à chaque démarrage ou réveil de l'app. Pas de ping périodique nécessaire côté client. Pour les aidants qui voient la valeur du patient, une simple query sur `profiles` suffit (RLS en lecture publique sur `last_seen_at`).

**Alternatives considérées**:
- Polling toutes les 30 secondes → batterie + réseau inutiles.
- Supabase Presence (WebSocket) → adapté pour le "en ligne en temps réel" mais complexity réseau élevée pour EMUI. Rejeté pour compatibilité Huawei.

---

## Decision 3 — Badge "aidants intéressés" (déduplication propositions + pré-chats)

**Decision**: Vue SQL ou requête client qui fait l'union de `SELECT DISTINCT aidant_id FROM propositions WHERE demande_id=X` et `SELECT DISTINCT auteur_id FROM messages WHERE demande_id=X AND auteur_role='aidant'`. Retourne un count dédupliqué.

**Rationale**: Pas besoin de table dédiée. La requête est légère (index sur demande_id déjà en place). Le count se rafraîchit via Supabase Realtime sur `propositions` et `messages` INSERT.

**Alternatives considérées**:
- Colonne dénormalisée `demandes.nb_interesses` → désynchronisation possible, trigger SQL requis.
- Edge Function pour calculer → overkill pour une somme de deux counts.

---

## Decision 4 — Charte des aidants (one-time modal)

**Decision**: Stocker `charte_accepted_at timestamp nullable` dans `profiles`. Vérification côté client dans `useCharteAidant()` : si null → afficher modal avant toute action aidant. Mettre à jour via `SupabaseUserService.acceptCharte()`.

**Rationale**: Simple, cohérent avec la structure existante des profils. Aucune nouvelle table. La vérification offline est possible (on lit `currentUser.charteAcceptedAt` depuis le store).

**Alternatives considérées**:
- RLS Supabase pour bloquer les inserts sans charte acceptée → trop brutal, mauvaise UX (erreur silencieuse vs modal explicatif).
- Cookie/localStorage → non persisté cross-device.

---

## Decision 5 — Onglet Messages dans la tab bar

**Decision**: Ajouter un 4e onglet "Messages" dans `TabsView.vue` avec route `/app/messages`. La `MessagesView` liste toutes les conversations actives de l'utilisateur (toutes demandes avec au moins un message). Le badge non-lus est alimenté par un store global `useChatStore` étendu avec `unreadCount`.

**Rationale**: Cohérent avec le pattern Ionic existant (tab bar + ion-tabs). Le store Pinia centralise le count pour que le badge soit visible depuis toutes les pages. Supabase Realtime sur `messages WHERE auteur_id!=me` maintient le count à jour.

**Alternatives considérées**:
- Badge flottant (FAB) → visuellement moins clair, anti-pattern mobile.
- Notification dans le header → doublon inutile avec la tab bar.

---

## Decision 6 — Messages rapides (suggestions)

**Decision**: Tableau statique TypeScript dans `src/constants/messageSuggestions.ts`, indexé par rôle. Composant `QuickReplies.vue` qui s'affiche seulement si `messages.length === 0`. Se cache après le premier envoi.

**Rationale**: Aucune persistance nécessaire — les suggestions sont identiques pour tous les utilisateurs du même rôle. Zéro requête Supabase.

**Alternatives considérées**:
- Suggestions dynamiques générées par l'IA → hors scope, nécessite API Claude.
- Persistées en DB → surdimensionné.

---

## Decision 7 — Badges de confiance

**Decision**: Ajouter `telephone varchar(20) nullable` dans `profiles`. Le badge "Email vérifié" se lit depuis `supabase.auth.getUser().user_metadata` ou `email_confirmed_at`. Le compteur de livraisons réussies est calculé via `SELECT count(*) FROM demandes WHERE aidant_actif_id=X AND statut='traitee'`.

**Rationale**: `email_confirmed_at` est disponible dans les métadonnées Supabase Auth sans requête supplémentaire. Le champ `telephone` étend naturellement `profiles` déjà utilisé. Le compteur est une agrégation simple.

**Alternatives considérées**:
- Stocker le compteur dénormalisé → désynchronisation à chaque mise à jour de statut.
- Vérification téléphone par SMS OTP → hors scope feature 009.

---

## Migrations SQL requises

```sql
-- Migration 009_a: Champs profils
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS charte_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS telephone varchar(20);

-- Migration 009_b: Messages non-lus
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Index pour les requêtes de non-lus
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(demande_id, is_read) WHERE is_read = false;
```

---

## Compatibilité EMUI (Huawei)

- Supabase Realtime : déjà validé sur EMUI (feature 008 ✅). Pas de changement de pattern.
- Pas de Supabase Presence (WebSocket intensif) → décision 2 confirme l'absence de ce pattern.
- Modal IonModal : déjà utilisé dans le projet via `actionSheetController` → privilégier `modalController` programmatique (même pattern que fix 007).
