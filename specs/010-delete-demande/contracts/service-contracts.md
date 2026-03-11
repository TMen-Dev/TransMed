# Service Contracts: Suppression de demande (010)

## IDemandeService — nouvelle méthode `delete`

```typescript
/**
 * Supprime une demande et toutes ses données associées.
 * Supprime : fichier ordonnance (Storage), messages, propositions, ordonnances, demande.
 * @param id - identifiant de la demande
 * @throws si la demande n'appartient pas au patient connecté
 * @throws si la suppression SQL ou Storage échoue (sauf Storage orphelin — warning seulement)
 */
delete(id: string): Promise<void>
```

**Préconditions** :
- L'utilisateur est authentifié
- La demande appartient au patient connecté (vérification RLS + UI)
- La demande est dans un état annulable (vérification UI — la RLS ne bloque pas sur le statut)

**Postconditions** :
- La demande n'existe plus dans `demandes`
- Les messages associés n'existent plus dans `messages`
- Les propositions associées n'existent plus dans `propositions`
- L'entrée ordonnance n'existe plus dans `ordonnances`
- Le fichier ordonnance est supprimé du bucket Storage (best-effort)

**Erreurs possibles** :
- `"Demande introuvable ou non autorisée"` — si RLS rejette la suppression
- `"Erreur suppression demande : {message}"` — erreur SQL générique

---

## demandes.store — nouvelle action `supprimerDemande`

```typescript
/**
 * Supprime une demande : appelle le service, retire du store local.
 * @param id - identifiant de la demande à supprimer
 * @throws propagé depuis le service
 */
supprimerDemande(id: string): Promise<void>
```

**Effet local** : retire la demande du tableau `demandes` dans le store après succès.

---

## DetailDemandeView — comportement bouton Supprimer

| Condition | Comportement |
|-----------|-------------|
| `isPatient && STATUTS_ANNULABLES.includes(demande.statut)` | Bouton rouge "Supprimer" visible et actif |
| `isPatient && !STATUTS_ANNULABLES.includes(demande.statut)` | Bouton absent (v-if false) |
| `isAidant` | Bouton absent |
| Clic sur "Supprimer" | `alertController` avec confirmation irréversible |
| Confirmation → succès | `router.replace('/app/demandes')` |
| Confirmation → erreur | Toast d'erreur, demande conservée |
