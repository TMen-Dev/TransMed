# Research: Suppression de demande (010)

## Décision 1 — Suppression Storage Supabase

**Decision**: `supabase.storage.from('ordonnances').remove([path])` — suppression directe du fichier avant DELETE SQL

**Rationale**: Le path est stocké dans `ordonnances.storage_path` (ex: `{demande_id}/ordonnance.jpg`). On lit ce path avant de DELETE la table ordonnances, puis on supprime le fichier. Si Storage échoue, on log et on continue — fichier orphelin sans impact utilisateur.

**Alternatives considered**: ON DELETE CASCADE Supabase trigger pour Storage → non supporté nativement par Supabase Storage

## Décision 2 — alertController programmatique (EMUI)

**Decision**: `alertController.create()` d'`@ionic/vue` — API programmatique impérative

**Rationale**: Même fix que pour ActionSheet (feature 007) et CharteModal (feature 009). Sur Huawei EMUI, les composants déclaratifs Ionic (`<IonAlert>`) créent/détruisent le PopupWindow immédiatement. L'API `alertController` crée le dialog en dehors du cycle Vue, contournant ce bug.

**Alternatives considered**: `<IonAlert>` déclaratif → bug EMUI confirmé ; `window.confirm()` → non stylé, non accessible

## Décision 3 — Ordre de suppression et atomicité

**Decision**: Séquence client-side : Storage → ordonnances → messages → propositions → demandes

**Rationale**: Supabase ne fournit pas de transactions multi-tables client-side. On supprime dans l'ordre des dépendances. Les tables `messages`, `ordonnances`, `propositions` ont des FK vers `demandes` avec ON DELETE CASCADE en Supabase — la suppression de `demandes` suffit pour SQL, mais on supprime le fichier Storage explicitement avant.

**Alternatives considered**: Edge Function pour transaction atomique → surcoût inutile pour une feature simple

## Décision 4 — RLS pour la propriété

**Decision**: `DELETE FROM demandes WHERE id = X AND patient_id = auth.uid()` via RLS policy

**Rationale**: La RLS Supabase garantit que seul le propriétaire (patient_id = auth.uid()) peut DELETE sa demande. Côté client, on vérifie aussi `currentUser.id === demande.patientId` pour ne pas afficher le bouton aux aidants.

## Décision 5 — Swipe-to-delete : IonItemSliding

**Decision**: `<ion-item-sliding>` + `<ion-item-options>` Ionic natif

**Rationale**: Composant Ionic standard, compatible EMUI, pas de librairie externe. Geste natif attendu sur mobile pour les listes.
