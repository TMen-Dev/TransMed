# Research: TransMed v1.1 — Corrections UX et nouvelles fonctionnalités

**Feature**: `002-ux-fixes`
**Date**: 2026-02-28
**Phase**: 0 — Analyse du code existant

---

## Code Audit Summary

### US-1 — Authentification email/mot de passe

**Décision**: Créer une liste séparée `MOCK_CREDENTIALS` dans `users.mock.ts` avec `{ email, password, userId }`, sans modifier le type `Utilisateur` (séparation données utilisateur / credentials).

**Constat actuel** (`InscriptionView.vue`):
- La section "Connexion rapide" utilise des boutons directs `@click="seConnecter(u)"` sans email/mot de passe
- Pas de champ email/mot de passe dans le formulaire

**Plan**:
1. Ajouter `MOCK_CREDENTIALS` dans `users.mock.ts`
2. Remplacer la section "Connexion rapide" dans `InscriptionView.vue` par un formulaire email + mot de passe
3. Garder la section "Créer un compte" mais déplacer le bouton "Créer un compte" en lien secondaire sous le formulaire principal
4. Implémenter `seConnecter()` avec lookup par email+password dans `MOCK_CREDENTIALS`

**Credentials mock choisis**:
- alice@transmed.fr / test1234 (patient)
- karim@transmed.fr / test1234 (patient)
- benjamin@transmed.fr / test1234 (aidant)
- leila@transmed.fr / test1234 (aidant)

---

### US-2 — Footer navigation

**Décision**: Ajouter les styles CSS manquants pour `ion-tab-bar` dans `App.vue`.

**Constat** (`TabsView.vue`):
- L'`ion-tab-bar` EST présent dans le code avec 2 onglets (Demandes, À propos)
- Aucun style CSS global pour `ion-tab-bar` — Ionic applique son thème par défaut
- Le footer peut être invisible si le thème Ionic n'est pas correctement configuré
- Solution: Ajouter `ion-tab-bar { --background: #FFFFFF; --border: 1px solid #E8E1D9; }` dans les styles globaux d'`App.vue`
- Les routes `/app/demandes` et `/app/apropos` sont bien des enfants de `/app/` (TabsView) ✓

---

### US-3 — Bouton retour uniformisé

**Décision**: Aucune modification nécessaire — déjà correct.

**Constat**:
- `DetailDemandeView.vue` L5: `<ion-buttons slot="start"><ion-back-button default-href="/app/demandes" /></ion-buttons>` ✓
- `ChatView.vue` L5: `<ion-buttons slot="start"><ion-back-button :default-href="..." /></ion-buttons>` ✓
- `CreationDemandeView.vue`: c'est une modal, pas un écran de stack — le bouton "Annuler" est à droite (normal pour une modal)
- `AProposView.vue`: onglet tab, pas de retour possible ✓

---

### US-4 — Label "Propositions actives"

**Décision**: Modifier 1 ligne dans `ListeDemandesView.vue`.

**Constat** (`ListeDemandesView.vue` L5):
```vue
{{ isPatient ? 'Mes demandes' : 'Demandes actives' }}
```
→ Changer `'Demandes actives'` en `'Propositions actives'`

---

### US-5 — Validation statut "Financé"

**Décision**: Modifier `StatutTimeline.vue` pour accepter une prop `cagnotte` optionnelle et recalculer l'état "Financé" sur la base du montant réel.

**Constat** (`StatutTimeline.vue`):
- L'étape `fonds_atteints` est marquée `is-done` si `statutIndex('fonds_atteints') < statutIndex(statut)`
- **Bug**: `demande-001` a `statut: 'transporteur_disponible'` (index 2) mais `cagnotte.montantCollecte = 45 / cagnotte.montantCible = 120`. L'étape "Financé" (index 1) est marquée `is-done` car `1 < 2` — même si la cagnotte n'est pas pleine.

**Fix**:
- Ajouter une prop optionnelle `cagnotte?: { montantCollecte: number; montantCible?: number }` à `StatutTimeline`
- Pour l'étape `fonds_atteints`, `is-done` = `(statutIndex < courant) && (cagnotte n'est pas fournie || montantCollecte >= montantCible)`
- `DetailDemandeView.vue` passe la cagnotte à `<StatutTimeline :statut="..." :cagnotte="cagnotte" />`

---

### US-6 — Visualisation ordonnance

**Décision**:
1. Corriger `voirOrdonnance()` pour utiliser `modalController` au lieu de `:is-open`
2. Étendre `peutVoirOrdonnance` à prop2_transport

**Constat** (`DetailDemandeView.vue`):
- L152: `<ion-modal :is-open="ordonanceModalOpen">` — pattern bugué (comme CreationDemandeView avant fix)
- L229-235: `peutVoirOrdonnance` vérifie seulement `prop3_achat_transport || prop1_cagnotte` — exclut `prop2_transport`
- `MockOrdonanceService` a des données mock pour demande-001 et demande-002 ✓
- Pour les nouvelles demandes, `create()` dans MockDemandeService appelle `ordonanceService.upload()` ✓

---

### US-7 — Upload ordonnance obligatoire

**Décision**: Désactiver le bouton "Publier" quand aucune ordonnance n'est jointe.

**Constat** (`CreationDemandeView.vue`):
- L122: `:disabled="loading"` — le bouton n'est désactivé que pendant le chargement, pas si ordonnance manquante
- La validation en `soumettre()` L164 vérifie `if (!ordonance.value)` mais tarde à afficher l'erreur
- Fix: `:disabled="loading || !ordonance"` + ajouter un message visible sous l'upload quand ordonnance manquante

---

### US-8 — Téléchargement ordonnance

**Décision**: Ajouter un bouton "Télécharger" avec mock toast dans `DetailDemandeView.vue`.

**Constat**:
- `peutVoirOrdonnance` actuel permet déjà aux aidants avec prop1/prop3 de voir l'ordonnance
- Besoin d'ajouter: bouton de téléchargement visible pour aidant avec prop1/2/3 OU pour le transporteur assigné
- Mock: afficher un toast "Téléchargement simulé — ordonnance.jpg"

**Computed à créer**: `peutTelechargerOrdonnance` :
```ts
// aidant avec n'importe quelle proposition OU transporteur assigné
(isAidant && demande.propositions.some(p => p.aidantId === currentUser.id))
|| estTransporteur
```

---

### US-9 — Notification email mockée

**Décision**: Ajouter un champ `emailNotifEnvoyee` sur le type `Demande` et déclencher le toast/log depuis `propositions.store` et `cagnotte.store`.

**Constat**:
- Type `Demande` (src/types/demande.types.ts): pas de champ `emailNotifEnvoyee`
- `propositions.store.ts`: appelle déjà `demandeStore.setTransporteur()` → point d'injection
- `cagnotte.store.ts`: `ajouterContribution()` retourne `objectifAtteint` → point d'injection
- Logic trigger: après chaque update de demande, vérifier `(statut === 'transporteur_disponible' || statut === 'fonds_atteints' || statut === 'pret_acceptation_patient') && transporteurId && cagnotte.montantCollecte >= cagnotte.montantCible && !emailNotifEnvoyee`

**Implémentation**:
1. Ajouter `emailNotifEnvoyee?: boolean` à `Demande` type
2. Ajouter `addEmailNotifEnvoyee(demandeId: string)` à `IDemandeService` et `MockDemandeService`
3. Créer un composable `useNotification()` avec `triggerEmailNotif(demande, cagnotte)` → toast + console.log
4. Appeler depuis `propositions.store` après `setTransporteur` et depuis `cagnotte.store` après `objectifAtteint`

---

## Files à modifier

| Fichier | Changements |
|---------|-------------|
| `src/types/demande.types.ts` | + `emailNotifEnvoyee?: boolean` |
| `src/services/mock/data/users.mock.ts` | + `MOCK_CREDENTIALS` array |
| `src/services/interfaces/IDemandeService.ts` | + `markEmailNotifSent(id)` |
| `src/services/mock/MockDemandeService.ts` | Implémenter `markEmailNotifSent` |
| `src/stores/demandes.store.ts` | + `markEmailNotifSent()` action |
| `src/views/InscriptionView.vue` | Remplacer login rapide par formulaire email/pwd |
| `src/views/ListeDemandesView.vue` | 'Demandes actives' → 'Propositions actives' |
| `src/views/DetailDemandeView.vue` | Fix modal ordonnance + peutVoirOrdonnance + download + notification |
| `src/components/StatutTimeline.vue` | + prop cagnotte optionnelle + fix logique Financé |
| `src/views/CreationDemandeView.vue` | Désactiver submit si !ordonance + message |
| `src/App.vue` | Styles globaux ion-tab-bar |
| `src/stores/propositions.store.ts` | Appel notification après setTransporteur |
| `src/stores/cagnotte.store.ts` | Appel notification après objectifAtteint |

## Fichiers à créer

| Fichier | Raison |
|---------|--------|
| `src/composables/useNotification.ts` | Toast notification email mock |
