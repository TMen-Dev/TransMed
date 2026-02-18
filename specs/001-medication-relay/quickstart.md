# Quickstart: TransMed — Mise en relation patients-aidants

**Feature**: `001-medication-relay` | **Date**: 2026-02-18 (mis à jour)

## Prérequis

- Node.js 20+
- npm ou yarn
- Ionic CLI : `npm install -g @ionic/cli`
- (Optionnel) Android Studio ou Xcode pour les builds natifs

## 1. Initialisation du projet

```bash
# Créer le projet Ionic avec Vue + Capacitor
ionic start transmed blank --type=vue --capacitor

cd transmed

# Installer les dépendances principales
npm install pinia @pinia/plugin-persistedstate
npm install @ionic/vue @ionic/vue-router ionicons
npm install @capacitor/core @capacitor/cli
npm install @capacitor/camera @capacitor/preferences
npm install -D vitest @vue/test-utils cypress
```

## 2. Configuration TypeScript stricte

`tsconfig.json` — activer strict mode :

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true
  }
}
```

## 3. Structure des dossiers

Créer la structure définie dans `plan.md` :

```bash
mkdir -p src/types
mkdir -p src/services/interfaces
mkdir -p src/services/mock/data
mkdir -p src/services/demandeStateMachine
mkdir -p src/composables
mkdir -p src/stores
mkdir -p src/views
mkdir -p src/components
```

## 4. Couche de données (mock)

L'injection de tous les services se fait via `src/services/index.ts` :

```typescript
// src/services/index.ts
import { MockUserService }        from './mock/MockUserService'
import { MockDemandeService }     from './mock/MockDemandeService'
import { MockPropositionService } from './mock/MockPropositionService'
import { MockOrdonanceService }   from './mock/MockOrdonanceService'
import { MockCagnotteService }    from './mock/MockCagnotteService'
import { MockMessageService }     from './mock/MockMessageService'

// Pour migrer vers Supabase : remplacer uniquement ces imports
export const userService        = new MockUserService()
export const demandeService     = new MockDemandeService()
export const propositionService = new MockPropositionService()
export const ordonanceService   = new MockOrdonanceService()
export const cagnotteService    = new MockCagnotteService()
export const messageService     = new MockMessageService()
```

Les stores Pinia importent depuis `src/services/index.ts` et **jamais** depuis les implémentations directement.

## 5. Machine d'états

La machine d'états est une pure fonction TypeScript dans `src/services/demandeStateMachine.ts` :

```typescript
// Usage dans useDemandeStore
import { applyTransition, canTransition } from '@/services/demandeStateMachine'

// Vérifier si une transition est possible (guards UI)
if (canTransition(demande.statut, 'PROP2_TRANSPORT')) { /* afficher bouton */ }

// Appliquer une transition (throws si illégale)
const nextStatut = applyTransition(demande.statut, 'PROP2_TRANSPORT')
```

## 6. Upload d'ordonnance (MVP)

Le composable `src/composables/useOrdonnancePicker.ts` expose :

```typescript
const { pickFromCameraOrGallery, pickFromFiles } = useOrdonnancePicker()

// Images (JPG/PNG) via @capacitor/camera
const ordonance = await pickFromCameraOrGallery(CameraSource.Camera)

// PDF via <input type="file"> natif
const ordonance = await pickFromFiles()
```

Le résultat est un `dataUri` (base64) passé à `ordonanceService.upload()` lors de la création de la demande.

## 7. Lancer le serveur de développement

```bash
ionic serve
# → http://localhost:8100
```

## 8. Lancer les tests

```bash
npx vitest run           # Tests unitaires (machine d'états, services mock)
npx cypress open         # Tests E2E web
```

## 9. Build et synchronisation Capacitor

```bash
ionic build
npx cap sync

# iOS
npx cap open ios

# Android
npx cap open android
```

## 10. Migration vers Supabase (future)

1. Installer le client : `npm install @supabase/supabase-js`
2. Configurer `@capacitor/preferences` pour la persistance de session (remplace `localStorage`)
3. Ajouter `detectSessionInUrl: false` dans la config Supabase (URLs natives Capacitor incompatibles)
4. Créer `src/services/supabase/` avec 6 implémentations concrètes des interfaces
5. Pour les ordonnances : créer le bucket privé `ordonnances` dans Supabase Storage + politique RLS
6. Dans `src/services/index.ts`, remplacer les imports Mock par les imports Supabase
7. Configurer les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
8. Aucune modification de vues, composables ou stores nécessaire

## Flux applicatif

```
Démarrage
    │
    ▼
/inscription ──► Saisie prénom + choix rôle (patient | aidant)
    │
    ▼
/app/demandes (tabs actifs)
    ├── Patient : voit SES demandes + bouton "Créer"
    └── Aidant  : voit les demandes EN ATTENTE (statuts 1-5)

Création de demande (IonModal, patient uniquement) :
    ├── Saisie médicaments
    ├── Upload ordonnance (@capacitor/camera ou <input file> PDF)
    └── → statut 1 (attente_fonds_et_transporteur)

Depuis une demande (tap) :
    │
    ▼
/app/demandes/:id ──► Détail
    ├── Aidant acheteur  : définit montant cible cagnotte → ouvre Prop1
    ├── Aidant           : soumet Prop1 (cagnotte) / Prop2 (transport) / Prop3 (achat+transport)
    ├── Patient (statut 6) : confirme → statut 7 (en_cours_livraison)
    ├── CagnotteProgress : barre de progression montantCollecte / montantCible
    ├── StatutTimeline   : historique des transitions
    └── Bouton Chat ──► /app/demandes/:id/chat

Transitions automatiques :
    Prop1 + cagnotte atteinte → statut 4 (ou 6 si transporteur déjà présent)
    Prop2                     → statut 5 (ou 6 si fonds déjà atteints)
    Prop3                     → statut 6 directement
    Patient confirme (statut 6) → statut 7
    Aidant livre (statut 7)     → statut 8 (traitee)

/app/apropos ──► Explication du fonctionnement de l'application
```
