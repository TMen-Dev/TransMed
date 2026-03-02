# Contrats — Patterns d'appel Supabase Client

**Feature**: 005-supabase-backend | **Date**: 2026-03-01

> Supabase expose son propre PostgREST + Realtime + Storage. Ce document remplace un contrat OpenAPI traditionnel par les patterns d'appel du client `@supabase/supabase-js` typé.

---

## Auth — `SupabaseUserService`

### Inscription

```typescript
// Input: CreateUtilisateurDto + credentials
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { prenom, role } }  // stocké dans auth.users.raw_user_meta_data
})
// → Session créée, profil auto-inséré via trigger
```

### Connexion

```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
// → data.session.user.id = UUID utilisateur
// → data.session stockée automatiquement via Capacitor storage adapter
```

### Session courante

```typescript
const { data: { session } } = await supabase.auth.getSession()
// → session null si non connecté ou expiré
```

### Écouter les changements d'état

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') { /* mettre à jour auth.store */ }
  if (event === 'SIGNED_OUT') { /* vider auth.store, rediriger */ }
  if (event === 'TOKEN_REFRESHED') { /* transparent */ }
})
```

### Déconnexion

```typescript
await supabase.auth.signOut()
// → session supprimée du stockage Capacitor
```

### Récupérer le profil utilisateur

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('id, prenom, role, adresse_defaut, created_at')
  .eq('id', userId)
  .single()
```

---

## Demandes — `SupabaseDemandeService`

### Toutes les demandes (aidant) — RLS filtre auto

```typescript
const { data } = await supabase
  .from('demandes')
  .select(`
    *,
    medicaments(*),
    cagnottes(*),
    propositions(*)
  `)
  .order('created_at', { ascending: false })
```

### Demandes d'un patient (historique) — RLS filtre auto

```typescript
const { data } = await supabase
  .from('demandes')
  .select('*, medicaments(*), cagnottes(*)')
  .eq('patient_id', patientId)
  .order('created_at', { ascending: false })
```

### Créer une demande + médicaments

```typescript
// Transaction via deux inserts séquentiels
const { data: demande } = await supabase
  .from('demandes')
  .insert({ patient_id, patient_prenom, nom, urgente, adresse_livraison })
  .select()
  .single()

await supabase.from('medicaments').insert(
  medicaments.map(m => ({ demande_id: demande.id, nom: m.nom, quantite: m.quantite }))
)

await supabase.from('cagnottes').insert({ demande_id: demande.id })
```

### Mettre à jour le statut (atomique)

```typescript
const { data } = await supabase.rpc('update_demande_statut', {
  p_demande_id: demandeId,
  p_expected_statut: currentStatut,
  p_new_statut: nextStatut,
})
// → STATUT_MISMATCH si concurrent modification
```

---

## Cagnottes — `SupabaseCagnotteService`

### Définir montant cible

```typescript
const { data } = await supabase
  .from('cagnottes')
  .update({ montant_cible: montant, statut: 'ouverte' })
  .eq('id', cagnotteId)
  .eq('statut', 'en_attente_evaluation')  // guard statut
  .select()
  .single()
```

### Ajouter une contribution

```typescript
// 1. Insert contribution
await supabase.from('contributions').insert({
  cagnotte_id, aidant_id, aidant_prenom, montant
})

// 2. Recalcul montant_collecte (trigger PostgreSQL recommandé, sinon RPC)
const { data: cagnotte } = await supabase
  .from('cagnottes')
  .select('montant_collecte, montant_cible')
  .eq('id', cagnotteId)
  .single()

const objectifAtteint = cagnotte.montant_collecte >= cagnotte.montant_cible

if (objectifAtteint) {
  await supabase.from('cagnottes')
    .update({ statut: 'atteinte' })
    .eq('id', cagnotteId)
}
```

---

## Messages — `SupabaseMessageService`

### Récupérer les messages historiques

```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('demande_id', demandeId)
  .order('created_at', { ascending: true })
```

### Envoyer un message

```typescript
const { data } = await supabase
  .from('messages')
  .insert({ demande_id, auteur_id, auteur_prenom, auteur_role, contenu })
  .select()
  .single()
```

### Subscription temps réel (à gérer dans le composant ou composable)

```typescript
const channel = supabase
  .channel(`chat-${demandeId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `demande_id=eq.${demandeId}`,
  }, (payload) => {
    newMessage.value = mapRowToMessage(payload.new)
  })
  .subscribe()

// Cleanup Vue
onUnmounted(() => supabase.removeChannel(channel))
```

---

## Ordonnances — `SupabaseOrdonanceService`

### Upload

```typescript
// 1. Upload fichier dans Storage
const path = `${demandeId}/ordonnance.${ext}`
const { error: uploadError } = await supabase.storage
  .from('ordonnances')
  .upload(path, blob, { contentType: mimeType, upsert: false })

// 2. Enregistrer métadonnées
const { data } = await supabase.from('ordonnances').insert({
  demande_id: demandeId,
  storage_path: path,
  mime_type: mimeType,
  taille_octets: blob.size,
}).select().single()
```

### Consultation (signed URL)

```typescript
// RLS vérifie l'accès sur la table ordonnances avant de retourner la ligne
const { data: meta } = await supabase
  .from('ordonnances')
  .select('storage_path, mime_type')
  .eq('demande_id', demandeId)
  .single()

// Signed URL 60 minutes
const { data: urlData } = await supabase.storage
  .from('ordonnances')
  .createSignedUrl(meta.storage_path, 3600)

return { ...mapMeta(meta), signedUrl: urlData.signedUrl }
```

---

## Propositions — `SupabasePropositionService`

### Lister propositions d'une demande

```typescript
const { data } = await supabase
  .from('propositions')
  .select('*')
  .eq('demande_id', demandeId)
  .order('created_at', { ascending: true })
```

### Créer une proposition

```typescript
// Guard Prop2 : un seul transporteur (contrainte UNIQUE sur la table)
const { data, error } = await supabase
  .from('propositions')
  .insert({ demande_id, aidant_id, aidant_prenom, type, montant_contribue })
  .select()
  .single()

if (error?.code === '23505') {
  throw new Error('Un transporteur est déjà assigné à cette demande')
}
```

---

## Codes d'erreur Supabase courants

| Code | Signification | Gestion recommandée |
|------|---------------|---------------------|
| `23505` | Violation contrainte UNIQUE | Message "déjà assigné" |
| `PGRST116` | 0 résultats pour `.single()` | Afficher état vide |
| `42501` | Violation RLS (accès refusé) | Rediriger ou message neutre |
| `STATUT_MISMATCH` | RPC updateStatut concurrent | Recharger la demande |
| `JWT expired` | Session expirée | Rediriger vers connexion |
