# Implementation Plan: TransMed v1.2 — Workflow complet de livraison

**Branch**: `002-ux-fixes` (impl) | **Date**: 2026-03-01 | **Spec**: [spec.md](spec.md)

---

## Summary

Extension du workflow de livraison en 3 nouvelles étapes (confirmation patient → livraison transporteur → réception patient), avec 2 nouveaux statuts TypeScript, données mock complètes couvrant les 7 statuts, champ `nom` auto-suggéré et flag `urgente` sur les demandes.

---

## Technical Context

**Language/Version**: TypeScript 5+ (strict)
**Primary Dependencies**: Ionic 7, Vue 3.4 (Composition API), Pinia 2, Vue Router 4, Vite 5
**Storage**: In-memory mock (TypeScript arrays) — pas de persistance
**Testing**: ESLint + `npm run lint` (validation TypeScript stricte)
**Target Platform**: Mobile-first (iOS/Android via Capacitor) + web dev
**Project Type**: Mobile (Ionic/Capacitor)
**Constraints**: TypeScript strict — pas de `any`; composants Vue avec `<script setup>`; stores Pinia source de vérité unique

---

## Constitution Check

| Principe | Statut | Note |
|----------|--------|------|
| I. Stack Mobile-First | ✅ | Ionic 7 + Vue 3 + Capacitor — aucune dépendance nouvelle |
| II. Composition API | ✅ | Tous les composants utilisent `<script setup>` |
| III. Typage Strict | ✅ | Types mis à jour dans `src/types/` — pas de `any` |
| IV. Capacitor Plugins | ✅ N/A | Pas d'accès natif dans cette feature |
| V. Simplicité YAGNI | ✅ | `IonAlert` pour popup remerciement, pas de modale custom |

**Résultat**: Tous les gates passent — aucune violation.

---

## Project Structure

### Documentation (cette feature)

```text
specs/003-delivery-workflow/
├── plan.md              # Ce fichier
├── spec.md              # Spécification
├── research.md          # Décisions de conception
├── data-model.md        # Modèle de données mis à jour
├── quickstart.md        # Guide de test
├── checklists/
│   └── requirements.md
├── contracts/
│   └── service-interfaces.md
└── tasks.md             # Généré par /speckit.tasks
```

### Source Code (fichiers impactés)

```text
src/
├── types/
│   └── demande.types.ts              # StatutDemande + TypeEvenement + Demande + DTO
├── services/
│   ├── demandeStateMachine.ts        # Transitions mises à jour
│   ├── interfaces/
│   │   └── IDemandeService.ts        # + marquerTraitee()
│   └── mock/
│       ├── MockDemandeService.ts     # Méthodes mises à jour + marquerTraitee()
│       └── data/
│           ├── demandes.mock.ts      # + 6 nouvelles demandes
│           └── cagnottes.mock.ts     # + 6 nouvelles cagnottes
├── stores/
│   └── demandes.store.ts             # + confirmerLivraison() + livrerOrdonnance() + recevoirMedicaments()
├── components/
│   ├── StatutBadge.vue               # + 2 nouveaux statuts, -en_cours_livraison
│   ├── StatutTimeline.vue            # 6 étapes avec nouveaux statuts
│   └── DemandeCard.vue               # + nom + badge urgence
├── views/
│   ├── CreationDemandeView.vue       # + champ nom + toggle urgente
│   └── DetailDemandeView.vue         # + 3 boutons conditionnels
└── router/
    └── index.ts                      # Logique redirection post-login patient
```

---

## Phase-by-Phase Design

### Phase 1 — Types et machine d'états (fondation bloquante)

**Objectif**: Mettre à jour les types TypeScript et la machine d'états. Tout le reste dépend de cette phase.

**Fichiers**: `demande.types.ts`, `demandeStateMachine.ts`

**Changements clés**:
- `StatutDemande`: retirer `en_cours_livraison`, ajouter `livraison_confirmee` et `livree`
- `TypeEvenement`: retirer `patient_confirme` et `aidant_livre`, ajouter `patient_confirme_livraison`, `transporteur_livre`, `patient_recoit_medicaments`
- `Demande`: ajouter `nom: string`, `urgente: boolean`, `messageRemerciement?: string`
- `CreateDemandeDto`: ajouter `nom: string`, `urgente: boolean`
- Machine d'états: mettre à jour TRANSITIONS pour les nouvelles séquences

### Phase 2 — Interface service et MockDemandeService

**Objectif**: Mettre à jour l'interface et son implémentation mock.

**Fichiers**: `IDemandeService.ts`, `MockDemandeService.ts`

**Changements clés**:
- `confirmerParPatient()`: transition vers `livraison_confirmee` (au lieu de `en_cours_livraison`)
- `marquerLivree()`: attend `livraison_confirmee` (au lieu de `en_cours_livraison`), passe à `livree`
- `marquerTraitee(id, messageRemerciement?)`: nouveau — `livree` → `traitee` + stocke message
- `create()`: utilise `nom` et `urgente` du DTO

### Phase 3 — Mock data (couverture des 7 statuts)

**Objectif**: Ajouter 6 nouvelles demandes mock + leurs cagnottes associées.

**Fichiers**: `demandes.mock.ts`, `cagnottes.mock.ts`

**Nouvelles demandes**: demande-003 à demande-008 (voir data-model.md pour le détail)

**Note sur demande-001**: Reste `transporteur_disponible` mais avec `nom` et `urgente` ajoutés.
**Note sur demande-002**: Reste `attente_fonds_et_transporteur` mais avec `nom` et `urgente` ajoutés.

### Phase 4 — Store Pinia

**Objectif**: Exposer les 3 nouvelles actions aux composants.

**Fichier**: `demandes.store.ts`

**Nouvelles actions**:
- `confirmerLivraison(demandeId)` → appelle `demandeService.confirmerParPatient()`
- `livrerOrdonnance(demandeId)` → appelle `demandeService.marquerLivree()`
- `recevoirMedicaments(demandeId, message?)` → appelle `demandeService.marquerTraitee()`

### Phase 5 — Composants (StatutBadge, StatutTimeline, DemandeCard)

**Objectif**: Mettre à jour les composants partagés.

**StatutBadge.vue**:
- Retirer `en_cours_livraison`
- Ajouter `livraison_confirmee` (label "Livraison confirmée", couleur bleue #2B7CC1)
- Ajouter `livree` (label "Livrée", couleur or #C9820A)

**StatutTimeline.vue**:
- Remplacer `en_cours_livraison` par `livraison_confirmee` à l'étape 5 (label "Confirmé")
- Ajouter `livree` à l'étape 6 (label "Livré")
- Ajouter `traitee` à l'étape 7 (label "Traité") → timeline passe de 6 à 7 étapes
- Mettre à jour ORDRE[]

**DemandeCard.vue**:
- Afficher `demande.nom` en sous-titre (ou remplace le titre actuel)
- Ajouter badge rouge "URGENT" si `demande.urgente === true`

### Phase 6 — Vue Création (nom + urgente)

**Objectif**: Ajouter champ nom auto-suggéré et toggle urgente au formulaire.

**Fichier**: `CreationDemandeView.vue`

**Logique**:
```typescript
// Suggestion du nom
watch(adresseLivraison, (addr) => {
  const ville = addr.split(',')[1]?.trim() ?? ''
  nomSuggere.value = ville ? `${currentUser.prenom} — ${ville}` : `${currentUser.prenom} — Médicaments`
  if (!nomModifie.value) nom.value = nomSuggere.value
})
```

**UI**: champ texte editable sous l'adresse + toggle "Demande urgente" avec icône

### Phase 7 — Vue Détail (3 boutons conditionnels)

**Objectif**: Ajouter les 3 boutons d'action selon rôle et statut.

**Fichier**: `DetailDemandeView.vue`

**Bouton A — "Confirmer la livraison"** (patient, statut `pret_acceptation_patient`):
```html
<button v-if="peutConfirmerLivraison" @click="confirmerLivraison">Confirmer la livraison</button>
```
```typescript
const peutConfirmerLivraison = computed(() =>
  demande.value?.patientId === currentUser?.id &&
  demande.value?.statut === 'pret_acceptation_patient'
)
```

**Bouton B — "Ordonnance livrée"** (transporteur assigné, statut `livraison_confirmee`):
```typescript
const peutMarquerLivree = computed(() =>
  demande.value?.transporteurId === currentUser?.id &&
  demande.value?.statut === 'livraison_confirmee'
)
```

**Bouton C — "Médicaments récupérés"** (patient, statut `livree`) + IonAlert:
```typescript
async function ouvrirPopupReception() {
  const alert = await alertController.create({
    header: 'Médicaments récupérés',
    message: 'Vous pouvez laisser un message de remerciement.',
    inputs: [{ type: 'textarea', name: 'message', placeholder: 'Message optionnel...' }],
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Confirmer', handler: (data) => recevoirMedicaments(data.message) }
    ]
  })
  await alert.present()
}
```

### Phase 8 — Router (redirection post-login)

**Objectif**: Rediriger automatiquement un patient vers sa demande en attente de confirmation.

**Fichier**: `router/index.ts`

**Logique**:
```typescript
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.currentUser) { ... }

  // Redirection post-login pour patients
  if (to.path === '/app/demandes' && authStore.currentUser.role === 'patient') {
    const demandeStore = useDemandeStore()
    // Charger les demandes si besoin
    if (!demandeStore.demandes.length) {
      await demandeStore.fetchForPatient(authStore.currentUser.id)
    }
    const demandeEnAttente = demandeStore.demandes
      .filter(d =>
        d.patientId === authStore.currentUser!.id &&
        d.statut === 'pret_acceptation_patient' &&
        d.emailNotifEnvoyee === true
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

    if (demandeEnAttente) {
      return `/app/demandes/${demandeEnAttente.id}`
    }
  }
})
```

**Attention**: La redirection ne doit s'activer qu'une seule fois par session (pas en boucle). Utiliser un flag `dejaRedirige` en session pour éviter la boucle.

---

## Risques et mitigations

| Risque | Mitigation |
|--------|-----------|
| Suppression de `en_cours_livraison` casse des composants existants | Inventaire complet dans research.md — migration synchronisée en Phase 1+5 |
| Boucle infinie dans le router guard | Flag session `redirectionConfirmDone` dans auth store ou variable module-level |
| TypeScript strict rejette les nouveaux champs optionnels | Utiliser `nom?: string` en migration puis rendre obligatoire après mock data |
| `IonAlert` sur web vs natif | Ionic gère les deux nativement — aucun fallback requis |
