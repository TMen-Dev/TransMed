# Research: Mise en relation patients-aidants pour médicaments

**Feature**: `001-medication-relay` | **Date**: 2026-02-18 (mis à jour)
**Stack**: Ionic 7+ / Vue 3 / Capacitor 5+ / TypeScript strict / Pinia / Supabase (future)

---

## Décision 1 — Couche de données mockée → Supabase (FR-015)

**Decision**: Pattern Repository par entité avec injection via une factory `src/services/index.ts`. Les stores Pinia dépendent uniquement de l'interface TypeScript, jamais de l'implémentation concrète.

**Rationale**: Satisfait directement FR-015. Le point d'injection unique (`src/services/index.ts`) est le seul fichier à modifier lors de la migration vers Supabase. TypeScript strict garantit à la compilation que les deux implémentations respectent le même contrat.

**Alternatives considérées**:
- Appels Supabase directs dans les stores → rejeté (couplage fort, viole FR-015)
- Composables sans interface explicite → rejeté (aucune garantie compile-time)

---

## Décision 2 — Supabase + Capacitor 5

**Decision**: `@supabase/supabase-js` v2 sans polyfill sur iOS 14.5+/Android 9+. Deux ajustements obligatoires pour la migration : (1) `@capacitor/preferences` pour la persistance de session, (2) `detectSessionInUrl: false`.

**Rationale**: `localStorage` est peu fiable dans le WebView Capacitor. `@capacitor/preferences` mappe vers `NSUserDefaults` / `SharedPreferences`. `detectSessionInUrl: false` est critique car les URL natives Capacitor ne sont pas des URLs HTTP.

**Alternatives considérées**: `@ionic/storage` → dépendance inutile ; `localStorage` avec fallback → vidé par iOS sous pression mémoire.

---

## Décision 3 — Chat UI dans Ionic/Vue 3

**Decision**: Conteneur `<div>` avec `overflow-y: auto` et `flex-direction: column`, `IonFooter` + `IonToolbar` + `IonInput` épinglés en bas. Scroll via `scrollTop = scrollHeight` après chaque message.

**Rationale**: `IonList` applique des animations de navigation inadaptées au chat. `IonVirtualScroll` est déprécié dans Ionic 7. Pour le volume MVP, un `v-for` dans un `div` scrollable est la solution la plus simple.

**Alternatives considérées**: `IonList` → rejeté ; `vue-advanced-chat` → rejeté (YAGNI).

---

## Décision 4 — Structure des stores Pinia

**Decision**: Stores par **entité** (`useAuthStore`, `useDemandeStore`, `useMessageStore`, `usePropositionsStore`, `useCagnotteStore`). Le filtrage par rôle se fait via des `computed` dans `useDemandeStore`.

**Rationale**: Patient et Aidant opèrent sur les mêmes objets `Demande`. Un store par entité = source de vérité unique. Les getters role-aware évitent la duplication.

**Alternatives considérées**: Un store par rôle → double source de vérité ; un mega-store → non testable.

---

## Décision 5 — Navigation Ionic (Tabs + Stack)

**Decision**: 2 tabs (`/app/demandes`, `/app/apropos`) + stack navigation pour Détail et Chat. Inscription en page standalone. Création de demande via `IonModal`.

**Rationale**: Seuls 2 points d'entrée primaires justifient un tab. `IonModal` pour les formulaires transitoires : préserve la position de scroll de la liste parente.

**Structure finale**:
```
/inscription → standalone
/app/demandes → tab 1 (stack: Détail → Chat)
/app/apropos → tab 2
IonModal → CreationDemandeView (depuis tab 1)
```

---

## Décision 6 — Upload ordonnance (MVP mock)

**Decision**: `@capacitor/camera` avec `CameraResultType.DataUrl` pour images (JPG/PNG) + `<input type="file">` natif pour PDF. Fichier stocké en base64 (dataUri) dans l'objet `Demande` en mémoire. Affichage via `<img>` (images) ou `<iframe>` (PDF). `IonActionSheet` pour le choix de source.

**Rationale**: `@capacitor/camera` retourne un dataUri prêt à l'emploi sans gestion de chemin de fichier. Le fallback `<input type="file">` est la seule approche fiable pour les PDFs sans plugin community. `<iframe>` utilise le renderer PDF natif de WKWebView (iOS) et WebView (Android) sans dépendance externe. Zéro infrastructure pour le MVP.

**Composable clé** (`src/composables/useOrdonnancePicker.ts`) :
- `pickFromCameraOrGallery(source: CameraSource)` → `@capacitor/camera`
- `pickFromFiles()` → `<input type="file">` + `FileReader.readAsDataURL()`

**Alternatives considérées**:
- `@capacitor/filesystem` + chemin de fichier → gestion de sandbox complexe, inutile pour le mock
- `@capawesome-team/capacitor-file-picker` → dépendance community inutile pour le MVP
- `pdfjs-dist` pour rendu PDF → ~3 MB, `<iframe>` suffit

**Migration Supabase** : le `dataUri` devient un upload vers Supabase Storage (voir Décision 7). L'interface `IOrdonnanceService` ne change pas.

---

## Décision 7 — Supabase Storage pour les ordonnances (migration future)

**Decision**: Bucket privé `ordonnances` (`public: false`) avec limite 10 MB et types MIME restreints (JPG/PNG/PDF). Métadonnées dans une table `ordonnances` avec RLS basée sur les `propositions`. Accès via **signed URLs TTL 300 secondes** générées par `SupabaseOrdonnanceService`.

**Rationale**: Documents médicaux sensibles — accès public inacceptable. Le bucket privé + RLS sur la table métadonnées (join sur `propositions`) est le pattern Supabase recommandé pour les règles métier complexes. Les signed URLs à courte durée de vie empêchent le partage de liens.

**Politique RLS clé** :
```sql
-- Seul l'aidant ayant soumis une Prop3 peut lire l'ordonnance
create policy "acheteur_can_read_ordonnance" on ordonnances for select
using (
  exists (select 1 from propositions
    where propositions.demande_id = ordonnances.demande_id
      and propositions.aidant_id = auth.uid()
      and propositions.type = 'prop3_achat_transport')
);
```

**Alternatives considérées**:
- Bucket public + UUID long → inacceptable pour données médicales
- RLS directement sur `storage.objects` → DSL moins expressif que SQL pour les jointures
- Stocker PDF en `bytea` en base de données → surcharge DB, contraire aux bonnes pratiques

---

## Décision 8 — Machine d'états dans TypeScript/Pinia

**Decision**: **Table de transition typée** (objet littéral TypeScript pur) dans `src/services/demandeStateMachine.ts`, exposant deux fonctions : `applyTransition(statut, event)` et `canTransition(statut, event)`. Pas de XState.

**Structure** :
```typescript
const TRANSITIONS: Record<StatutDemande, Partial<Record<TransitionEvent, StatutDemande>>> = {
  attente_fonds_et_transporteur: {
    PROP1_CAGNOTTE_ATTEINTE: 'fonds_atteints',
    PROP2_TRANSPORT:         'transporteur_disponible',
    PROP3_ACHAT_TRANSPORT:   'pret_acceptation_patient',
  },
  // ... (toutes les transitions de FR-007)
  traitee: {},  // état terminal
}
```

**Rationale** :
- Chaque cellule de la table correspond à une règle de FR-007 — lisible directement contre la spec
- Fonction pure sans effets de bord → testable avec Vitest sans monter de composant Vue
- `canTransition()` utilisé dans les composants : `v-if="canTransition(demande.statut, 'PROP2_TRANSPORT')"` — une seule source de vérité pour les gardes UI et les transitions
- TypeScript garantit à la compilation que toutes les valeurs de `StatutDemande` ont une entrée dans la table

**Intégration Pinia** :
```typescript
// dans useDemandeStore
async function triggerTransition(demandeId: string, event: TransitionEvent) {
  const demande = demandes.value.find(d => d.id === demandeId)!
  const nextStatut = applyTransition(demande.statut, event)  // throws si illégal
  demande.statut = nextStatut
  await demandeService.updateStatut(demandeId, nextStatut)
}
```

**Alternatives considérées**:
- `switch/case` dans le store → logique éparpillée, pas directement lisible contre la spec
- XState v5 → ~50 kB, paradigme acteur/service inutile pour 8 états et 5 événements (YAGNI)
- Enum numérique (1–8) → moins lisible dans les logs et la DB Supabase

---

## Tableau récapitulatif

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Couche données | Repository interfaces + factory `src/services/index.ts` |
| 2 | Supabase + Capacitor | `@capacitor/preferences` + `detectSessionInUrl: false` |
| 3 | Chat UI | `div` flex + `IonFooter` + scroll manuel |
| 4 | Pinia stores | Par entité ; filtrage rôle via getters |
| 5 | Navigation | 2 tabs + stack ; `IonModal` pour création |
| 6 | Upload ordonnance (MVP) | `@capacitor/camera` DataUrl + `<input file>` PDF ; base64 en mémoire |
| 7 | Supabase Storage | Bucket privé + RLS métadonnées + signed URLs 300 s |
| 8 | Machine d'états | Table de transition typée + `applyTransition()` pure function |
