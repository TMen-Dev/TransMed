# Data Model: Améliorations UX Chat & Confiance (009)

**Generated**: 2026-03-10

---

## Entités modifiées

### `profiles` (table existante — extensions)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `last_seen_at` | `timestamptz` | YES | null | Dernière connexion active de l'utilisateur |
| `charte_accepted_at` | `timestamptz` | YES | null | Date d'acceptation de la Charte TransMed (null = pas encore acceptée) |
| `telephone` | `varchar(20)` | YES | null | Numéro de téléphone renseigné manuellement |

**Règles** :
- `last_seen_at` est mis à jour à chaque `initSession()` côté client.
- `charte_accepted_at` ne peut être mis à jour que par l'aidant propriétaire du profil (RLS).
- `telephone` : format libre, validation côté client uniquement.

---

### `messages` (table existante — extensions)

| Colonne | Type | Nullable | Défaut | Description |
|---------|------|----------|--------|-------------|
| `is_read` | `boolean` | NO | `false` | Le destinataire a lu ce message |
| `read_at` | `timestamptz` | YES | null | Horodatage de la lecture |

**Règles** :
- `is_read` passe à `true` quand le destinataire ouvre le chat correspondant.
- `read_at` est enregistré en même temps que `is_read = true`.
- Un message est "non-lu" pour un utilisateur si `auteur_id != userId AND is_read = false`.

---

## Entités statiques (client-side uniquement)

### `MessageSuggestion` (constante TypeScript, non persistée)

```
MessageSuggestion {
  role: 'aidant' | 'patient'
  texte: string
}
```

**Contenu** :
- Aidant : "Quels médicaments exactement ?", "Je suis disponible demain matin", "Quelle pharmacie préférez-vous ?"
- Patient : "C'est urgent, merci", "Êtes-vous disponible ce soir ?", "Merci pour votre réactivité !"

---

## Vues logiques (non-SQL, calculées côté client)

### `AidantsInteresses(demandeId)` — badge aidants intéressés

Union déduplicatée de :
1. `SELECT DISTINCT aidant_id FROM propositions WHERE demande_id = :id`
2. `SELECT DISTINCT auteur_id FROM messages WHERE demande_id = :id AND auteur_role = 'aidant'`

Retourne : `count(UNION(set1, set2))`

### `BadgeNonLus(userId)` — badge tab bar

```
SELECT COUNT(*) FROM messages
WHERE demande_id IN (
  SELECT id FROM demandes
  WHERE patient_id = :userId OR acheteur_id = :userId OR transporteur_id = :userId
)
AND auteur_id != :userId
AND is_read = false
```

Avec indicateur `hasUrgent` :
```
SELECT EXISTS (
  SELECT 1 FROM messages m
  JOIN demandes d ON d.id = m.demande_id
  WHERE m.auteur_id != :userId AND m.is_read = false AND d.urgente = true
)
```

### `BadgeConfiance(userId)` — badges profil

| Badge | Source | Condition |
|-------|--------|-----------|
| Email vérifié | `auth.user.email_confirmed_at` | non null |
| Téléphone renseigné | `profiles.telephone` | non null et non vide |
| N livraisons réussies | `COUNT(demandes WHERE statut='traitee' AND aidant actif = userId)` | count > 0 |

---

## Transitions d'état liées à cette feature

### Pré-chat → Proposition (continuité du thread)

```
État A : messages exist pour (demande_id, aidant_id) SANS proposition
           ↓  l'aidant clique "Se proposer"
État B : messages exist + proposition créée (même demande_id)
         → le thread de chat est INCHANGÉ (même demande_id = même fil)
```

Pas de migration de données nécessaire — le fil est naturellement continu via `demande_id`.

### is_read transition

```
is_read = false (défaut à la création)
         ↓  l'utilisateur destinataire ouvre le ChatView
is_read = true + read_at = now()
```

---

## Index SQL recommandés

```sql
-- Requêtes fréquentes sur les messages non-lus
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(demande_id, is_read)
WHERE is_read = false;

-- Calcul badge aidants intéressés
CREATE INDEX IF NOT EXISTS idx_messages_demande_role ON messages(demande_id, auteur_role);
```

---

## RLS (Row Level Security) — nouvelles règles requises

```sql
-- Permettre UPDATE is_read sur ses propres messages reçus
-- (auteur_id != me, mais la demande appartient à me)
CREATE POLICY "Destinataire peut marquer lu" ON messages
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

-- Permettre lecture de last_seen_at pour tous les utilisateurs authentifiés
CREATE POLICY "last_seen lisible par tous" ON profiles
FOR SELECT TO authenticated
USING (true);

-- Charte : UPDATE charte_accepted_at uniquement par le propriétaire
CREATE POLICY "Aidant accepte sa propre charte" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```
