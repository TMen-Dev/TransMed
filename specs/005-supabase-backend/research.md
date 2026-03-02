# Research: Intégration backend persistant (Supabase)

**Feature**: 005-supabase-backend | **Date**: 2026-03-01

---

## 1. Session persistence avec Capacitor

**Decision**: Adapter `@capacitor/preferences` pour le stockage de session Supabase

**Rationale**: Sur iOS/Android, `localStorage` n'est pas fiable (peut être vidé par l'OS). `@capacitor/preferences` utilise le stockage natif (Keychain iOS / SharedPreferences Android), persistent et sécurisé. Supabase v2 accepte un adapteur de stockage custom via l'option `auth.storage`.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import type { Database } from '../types/supabase.types'

const storage = {
  getItem: (key: string) => Preferences.get({ key }).then(r => r.value),
  setItem: (key: string, value: string) => Preferences.set({ key, value }).then(() => {}),
  removeItem: (key: string) => Preferences.remove({ key }).then(() => {}),
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Capacitor n'utilise pas les URL OAuth redirects
    },
  }
)
```

**Alternatives considerées**:
- `localStorage` — insuffisant pour mobile natif (vidé par l'OS)
- `@supabase/auth-helpers-capacitor` — package tiers peu maintenu, mieux d'écrire l'adapter directement

---

## 2. Realtime chat — subscriptions Supabase v2

**Decision**: `supabase.channel()` avec `postgres_changes` filtré par `demande_id`

**Rationale**: L'API `channel()` de Supabase v2 remplace l'ancienne API `subscribe()`. Elle permet de filtrer les événements côté serveur (réduction de la bande passante). Unsubscribe impératif dans `onUnmounted()` Vue pour éviter les fuites mémoire.

```typescript
// Exemple dans useChat.ts ou SupabaseMessageService
const channel = supabase
  .channel(`chat-${demandeId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `demande_id=eq.${demandeId}`,
  }, (payload) => {
    // payload.new = nouveau message
    messages.value.push(mapToMessage(payload.new))
  })
  .subscribe()

// Vue component teardown
onUnmounted(() => supabase.removeChannel(channel))
```

**Note** : Prérequis côté Supabase : activer la réplication Realtime sur la table `messages` dans le dashboard ou via migration SQL (`ALTER PUBLICATION supabase_realtime ADD TABLE messages;`).

---

## 3. Ordonnances — Supabase Storage signed URLs

**Decision**: `createSignedUrl()` avec expiry 3600 secondes (1 heure), bucket privé

**Rationale**: Le bucket `ordonnances` doit être privé (pas d'accès public). Les URLs signées permettent un accès temporaire sans exposer les fichiers. 1h est suffisant pour consultation; la durée max supportée par Supabase est 1 semaine mais la spec impose 60min max.

```typescript
// SupabaseOrdonanceService.ts
async getByDemandeId(demandeId: string): Promise<Ordonance> {
  // 1. Récupérer métadonnées
  const { data: meta } = await supabase
    .from('ordonnances')
    .select('*')
    .eq('demande_id', demandeId)
    .single()

  // 2. Générer signed URL
  const { data: urlData, error } = await supabase.storage
    .from('ordonnances')
    .createSignedUrl(meta.storage_path, 3600)

  if (error) throw new Error('Accès non autorisé à cette ordonnance')

  return { ...meta, signedUrl: urlData.signedUrl }
}
```

**Upload pattern**:
```typescript
async upload(demandeId: string, base64Data: string, mimeType: MimeTypeOrdonance): Promise<Ordonance> {
  const blob = base64ToBlob(base64Data, mimeType)
  const path = `${demandeId}/ordonnance.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`

  const { error } = await supabase.storage
    .from('ordonnances')
    .upload(path, blob, { contentType: mimeType, upsert: false })

  if (error) throw error

  // Enregistrer référence en base
  const { data } = await supabase.from('ordonnances').insert({
    demande_id: demandeId,
    storage_path: path,
    mime_type: mimeType,
  }).select().single()

  return mapToOrdonance(data)
}
```

---

## 4. Row Level Security (RLS) — patterns multi-tenant

**Decision**: RLS activé sur toutes les tables, politiques basées sur `auth.uid()`

**Rationale**: La sécurité côté serveur est non-négociable — elle ne peut pas être contournée par manipulation du client. Les politiques RLS sont évaluées par PostgreSQL avant tout retour de données.

**Politique patient (demandes)**:
```sql
-- Patient voit uniquement ses propres demandes
CREATE POLICY "patient_select_own_demandes" ON demandes
  FOR SELECT USING (patient_id = auth.uid());

-- Aidant voit les demandes actives (statuts en attente d'aide)
CREATE POLICY "aidant_select_active_demandes" ON demandes
  FOR SELECT USING (
    statut IN (
      'attente_fonds_et_transporteur',
      'fonds_atteints',
      'transporteur_disponible'
    )
  );
```

**Note importante** : PostgreSQL évalue toutes les politiques FOR SELECT avec un OR. Pour distinguer patient vs aidant, utiliser une fonction helper :

```sql
-- Fonction helper : rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Politique combinée
CREATE POLICY "demande_select" ON demandes
  FOR SELECT USING (
    (current_user_role() = 'patient' AND patient_id = auth.uid())
    OR
    (current_user_role() = 'aidant' AND statut IN (
      'attente_fonds_et_transporteur', 'fonds_atteints', 'transporteur_disponible'
    ))
  );
```

**Politique ordonnances** :
```sql
CREATE POLICY "ordonnance_select" ON ordonnances
  FOR SELECT USING (
    -- Le patient propriétaire de la demande
    EXISTS (
      SELECT 1 FROM demandes
      WHERE demandes.id = ordonnances.demande_id
      AND demandes.patient_id = auth.uid()
    )
    OR
    -- Aidant avec proposition active (prop1 ou prop3 = acheteur)
    EXISTS (
      SELECT 1 FROM propositions
      WHERE propositions.demande_id = ordonnances.demande_id
      AND propositions.aidant_id = auth.uid()
      AND propositions.type IN ('prop1_cagnotte', 'prop3_achat_transport')
    )
  );
```

**Storage RLS** : Supabase Storage utilise aussi des politiques, configurées séparément pour le bucket `ordonnances` — voir data-model.md.

---

## 5. TypeScript codegen

**Decision**: `supabase gen types typescript` → `src/types/supabase.types.ts`

**Rationale**: Les types générés correspondent exactement au schéma de la base. Utilisés pour typer les appels `supabase.from()` et éviter les `any`.

```bash
# Installation CLI
npm install --save-dev supabase

# Génération (après chaque migration)
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID \
  > src/types/supabase.types.ts
```

Ajouter dans `package.json` :
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase.types.ts"
  }
}
```

---

## 6. Version et import @supabase/supabase-js

**Decision**: `@supabase/supabase-js@^2.x` — version stable, API `createClient` typée

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.types'

export const supabase = createClient<Database>(url, anonKey, options)
```

**Alternatives considerées**:
- `@supabase/auth-helpers-vue` — existe mais peu maintenu, overkill pour notre usage
- Solution custom sans package Supabase — non viable (sécurité, maintenance)

---

## 7. Concurrence optimiste pour les transitions de statut

**Decision**: Utiliser des transactions PostgreSQL avec contrainte de statut actuel

**Rationale**: Le cas où deux aidants soumettent une Prop2 simultanément doit être géré côté serveur. La solution : une fonction PostgreSQL qui vérifie le statut actuel dans la même transaction que la mise à jour.

```sql
-- Fonction pour update atomique du statut
CREATE OR REPLACE FUNCTION update_demande_statut(
  p_demande_id UUID,
  p_expected_statut TEXT,
  p_new_statut TEXT
) RETURNS demandes AS $$
DECLARE result demandes;
BEGIN
  UPDATE demandes
  SET statut = p_new_statut, updated_at = NOW()
  WHERE id = p_demande_id AND statut = p_expected_statut
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STATUT_MISMATCH: statut actuel différent de %', p_expected_statut;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Appelée depuis `SupabaseDemandeService.updateStatut()` via `supabase.rpc('update_demande_statut', {...})`.
