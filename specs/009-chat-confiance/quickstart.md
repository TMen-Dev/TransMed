# Quickstart: Améliorations UX Chat & Confiance (009)

**Generated**: 2026-03-10

---

## Prérequis

- Feature 008 implémentée et fonctionnelle ✅
- Accès Supabase SQL Editor (migrations)
- Dev server : `npm run dev` (localhost:5173)

---

## Étape 1 — Migrations SQL (Supabase)

Dans le SQL Editor de Supabase, exécuter dans l'ordre :

### Migration 009_a — Extensions profils

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS charte_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS telephone varchar(20);
```

### Migration 009_b — Messages non-lus

```sql
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(demande_id, is_read)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_messages_demande_role ON messages(demande_id, auteur_role);
```

### Migration 009_c — RLS

```sql
-- Marquer messages comme lus (destinataire uniquement)
CREATE POLICY "destinataire_mark_read" ON messages
FOR UPDATE TO authenticated
USING (
  auteur_id != auth.uid()
  AND demande_id IN (
    SELECT id FROM demandes
    WHERE patient_id = auth.uid()
       OR acheteur_id = auth.uid()
       OR transporteur_id = auth.uid()
  )
)
WITH CHECK (is_read = true);

-- last_seen lisible par tous les users authentifiés
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles
FOR SELECT TO authenticated USING (true);

-- Charte : update par le propriétaire du profil seulement
CREATE POLICY "aidant_charte_update" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

---

## Étape 2 — Mettre à jour `supabase.types.ts`

Après les migrations, régénérer les types ou les mettre à jour manuellement dans `src/types/supabase.types.ts` pour ajouter les nouveaux champs aux types `profiles.Row` et `messages.Row`.

---

## Étape 3 — Vérification dev

```bash
npm run dev
```

Test rapide :
1. Se connecter en tant qu'aidant (`testaidant@yopmail.com`)
2. Ouvrir une demande en état `nouvelle_demande`
3. Le bouton "Poser une question" doit apparaître
4. Premier clic → modal Charte TransMed doit s'afficher
5. Accepter → le chat s'ouvre
6. Depuis le compte patient → la DemandeCard doit afficher "1 aidant intéressé"

---

## Architecture des fichiers modifiés/créés

```
src/
├── types/
│   ├── message.types.ts        [MODIFIÉ — +isRead, +readAt]
│   ├── user.types.ts           [MODIFIÉ — +lastSeenAt, +charteAcceptedAt, +telephone]
│   └── confiance.types.ts      [NOUVEAU]
├── constants/
│   └── messageSuggestions.ts   [NOUVEAU — suggestions par rôle]
├── composables/
│   ├── useCharteAidant.ts      [NOUVEAU]
│   ├── useLastSeen.ts          [NOUVEAU]
│   ├── useUnreadMessages.ts    [NOUVEAU]
│   ├── useAidantsInteresses.ts [NOUVEAU]
│   └── useConfiance.ts         [NOUVEAU]
├── stores/
│   └── chat.store.ts           [MODIFIÉ — +unreadCount, +hasUrgent, +markAsRead]
├── services/supabase/
│   ├── SupabaseMessageService.ts [MODIFIÉ — +marquerCommeLus, +countNonLus, +countAidantsInteresses]
│   └── SupabaseUserService.ts    [MODIFIÉ — +accepterCharte, +mettreAJourLastSeen, etc.]
├── components/
│   ├── CharteModal.vue         [NOUVEAU]
│   ├── QuickReplies.vue        [NOUVEAU]
│   ├── LastSeenBadge.vue       [NOUVEAU]
│   ├── ConfianceBadges.vue     [NOUVEAU]
│   └── DemandeCard.vue         [MODIFIÉ — +badge aidants intéressés]
├── views/
│   ├── TabsView.vue            [MODIFIÉ — +onglet Messages avec badge]
│   ├── MessagesView.vue        [NOUVEAU — liste des conversations]
│   ├── DetailDemandeView.vue   [MODIFIÉ — +bouton pré-chat, +LastSeenBadge]
│   ├── ChatView.vue            [MODIFIÉ — +QuickReplies, +LastSeenBadge header]
│   └── ProfilView.vue          [MODIFIÉ — +ConfianceBadges, +champ téléphone]
└── router/index.ts             [MODIFIÉ — +route /app/messages]
```
