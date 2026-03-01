# Research: TransMed v1.2 — Workflow complet de livraison

**Date**: 2026-03-01 | **Branch**: `002-ux-fixes` (impl) / `003-delivery-workflow` (spec)

---

## Decision 1 — Migration `en_cours_livraison` → `livraison_confirmee` + `livree`

**Decision**: Remplacer le statut unique `en_cours_livraison` par deux statuts distincts `livraison_confirmee` et `livree`, et supprimer `en_cours_livraison` du type TypeScript.

**Rationale**: Le statut `en_cours_livraison` était ambigu — il mélangeait "patient a confirmé" et "livraison en cours". La spec v1.2 distingue clairement deux moments : (1) le patient accepte la livraison (`livraison_confirmee`) et (2) le transporteur a physiquement livré (`livree`). Cette séparation est sémantiquement correcte et permet les boutons conditionnels distincts.

**Impact**: Aucune mock data existante n'utilise `en_cours_livraison` → migration sans perte de données. Les composants `StatutTimeline`, `StatutBadge`, `demandeStateMachine` et `MockDemandeService` contiennent des références à `en_cours_livraison` qui seront toutes migrées.

**Alternatives considérées**: Conserver `en_cours_livraison` et ajouter seulement `livree` → rejeté car `en_cours_livraison` deviendrait un synonyme exact de `livraison_confirmee`, créant de la confusion dans la machine d'états.

---

## Decision 2 — Redirection post-login : où et comment ?

**Decision**: La redirection post-login vers une demande `pret_acceptation_patient` se fait dans le **router guard** (`router.beforeEach`), après authentification, en interrogeant le store des demandes.

**Rationale**: Le router guard est le seul endroit qui s'exécute systématiquement après chaque navigation, y compris la navigation initiale post-login. Une redirection dans `InscriptionView.vue` serait fragile (dépend de la vue) ; dans le store Pinia serait un anti-pattern (les stores ne doivent pas connaître le router).

**Pattern**:
```
router.beforeEach:
  if (vient de /inscription + user is patient):
    load demandes patient
    find demande.statut === 'pret_acceptation_patient' && emailNotifEnvoyee === true
    if found → redirect to /app/demandes/{id}
    else → continue to /app/demandes
```

**Alternatives considérées**:
- Redirection dans `onMounted` de `ListeDemandesView` → rejeté, car la vue ne se charge que si on arrive sur `/app/demandes`.
- Redirection dans l'action `login` du auth store → possible mais couple le store au router.

---

## Decision 3 — Nom de la demande : extraction de la ville

**Decision**: Extraire la ville avec `adresse.split(',')[1]?.trim()` (2ème segment séparé par virgule).

**Rationale**: Le format d'adresse utilisé dans le projet est consistant : "rue, ville, pays" (ex: "5 rue des Lilas, Alger, Algérie"). L'index 1 donne toujours la ville dans ce format.

**Fallback**: Si `split(',')[1]` est `undefined` ou vide → nom suggéré = `"${prenom} — Médicaments"`.

**Alternatives considérées**: Regex de détection de ville → plus complexe, inutile pour un mock avec adresses contrôlées.

---

## Decision 4 — Popup "Médicaments récupérés" : IonAlert vs modal personnalisée

**Decision**: Utiliser `IonAlert` (programmatique via `alertController`) avec un `input` de type `textarea`.

**Rationale**: `IonAlert` est natif Ionic, s'affiche nativement sur iOS/Android, et supporte les inputs inline. Pas besoin d'une vue dédiée pour un seul champ optionnel.

**Pattern**:
```ts
const alert = await alertController.create({
  header: 'Médicaments récupérés',
  inputs: [{ type: 'textarea', placeholder: 'Message de remerciement (optionnel)' }],
  buttons: [{ text: 'Annuler', role: 'cancel' }, { text: 'Confirmer', handler: (data) => ... }]
})
```

**Alternatives considérées**: Modal Vue personnalisée → plus de code, même résultat UX.

---

## Decision 5 — Bouton "Confirmer la livraison" : garde d'affichage

**Decision**: Le bouton est conditionné par `isPatientProprietaire && demande.statut === 'pret_acceptation_patient'`.

**Rationale**: Double condition stricte pour éviter tout affichage non désiré. La propriété est vérifiée via `demande.patientId === currentUser?.id`.

---

## Decision 6 — Bouton "Ordonnance livrée" : garde d'affichage

**Decision**: Le bouton est conditionné par `demande.transporteurId === currentUser?.id && demande.statut === 'livraison_confirmee'`.

**Rationale**: Le transporteur assigné est identifié par son ID stocké dans `demande.transporteurId`. Pas besoin de rôle aidant supplémentaire puisque seuls les aidants peuvent être transporteurs.

---

## Decision 7 — Mock data : patients couvrant tous les statuts

**Decision**: Affecter les demandes manquantes au patient Alice (déjà dans le mock) et Karim pour diversifier. Les aidants Benjamin et Leila seront assignés comme transporteurs selon les statuts.

| Statut | Patient | Aidant/transporteur |
|--------|---------|---------------------|
| `attente_fonds_et_transporteur` | Karim | — |
| `fonds_atteints` | Alice | — (cagnotte 120/120€) |
| `transporteur_disponible` | Alice | Leila (transporteur) |
| `pret_acceptation_patient` | Alice | Benjamin (Prop3) + emailNotifEnvoyee=true |
| `livraison_confirmee` | Alice | Benjamin (transporteur) |
| `livree` | Alice | Benjamin (transporteur) |
| `traitee` | Alice | — (messageRemerciement fourni) |

---

## Fichiers impactés (inventaire complet)

| Fichier | Type de modification |
|---------|---------------------|
| `src/types/demande.types.ts` | + 2 statuts, + 3 événements, + champs `nom`/`urgente`/`messageRemerciement`, `en_cours_livraison` supprimé |
| `src/services/demandeStateMachine.ts` | Transitions mises à jour, `en_cours_livraison` remplacé |
| `src/services/interfaces/IDemandeService.ts` | + `marquerTraitee()`, mise à jour des méthodes existantes |
| `src/services/mock/MockDemandeService.ts` | Mise à jour des méthodes + `marquerTraitee()` |
| `src/services/mock/data/demandes.mock.ts` | + 5 nouvelles demandes mock |
| `src/services/mock/data/cagnottes.mock.ts` | + 5 nouvelles cagnottes associées |
| `src/stores/demandes.store.ts` | + `confirmerLivraison()`, + `livrerOrdonnance()`, + `recevoirMedicaments()` |
| `src/components/StatutBadge.vue` | + 2 nouveaux statuts, `en_cours_livraison` remplacé |
| `src/components/StatutTimeline.vue` | 6 étapes avec nouveaux statuts |
| `src/components/DemandeCard.vue` | Affichage `nom` + badge urgence |
| `src/views/CreationDemandeView.vue` | + champ `nom` auto-suggéré + toggle urgente |
| `src/views/DetailDemandeView.vue` | + 3 boutons conditionnels (confirmation/livraison/réception) |
| `src/router/index.ts` | Logique redirection post-login patient |
