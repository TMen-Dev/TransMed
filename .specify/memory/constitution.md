# TransMed Constitution

## Core Principles

### I. Stack Mobile-First
Framework: Ionic 7+ avec Vue 3 (Composition API) et Capacitor 5+; Toujours cibler iOS et Android via un seul codebase; Les composants Ionic UI natifs sont privilégiés aux composants web custom; Aucune dépendance incompatible avec Capacitor n'est autorisée.

### II. Composition API Obligatoire
Tous les composants Vue utilisent `<script setup>` et la Composition API; Pas d'Options API; La logique réutilisable est extraite dans des composables (`use*.ts`); Les stores Pinia sont la seule source de vérité pour l'état global.

### III. Typage Strict (NON-NÉGOCIABLE)
TypeScript strict mode activé dans tout le projet; Pas de `any` explicite; Toutes les interfaces/types sont définis dans `src/types/`; Les réponses API sont typées avec des interfaces dédiées.

### IV. Accès Natif via Capacitor Plugins
Tout accès aux fonctionnalités natives (caméra, GPS, notifications, stockage) passe par les plugins Capacitor officiels; Les fallbacks web sont obligatoires pour le développement; La détection de plateforme utilise `Capacitor.isNativePlatform()`.

### V. Simplicité et YAGNI
Aucune abstraction prématurée; Un composant = une responsabilité; Les routes sont définies de façon déclarative dans `src/router/`; La navigation utilise exclusivement `useRouter` / `useRoute`.

## Stack Technique

- **Framework UI** : Ionic 7+ (composants natifs iOS/Android)
- **Framework JS** : Vue 3 + Vite
- **Runtime natif** : Capacitor 5+
- **État global** : Pinia
- **Routing** : Vue Router 4
- **Langage** : TypeScript (strict)
- **Tests** : Vitest (unitaires) + Cypress (E2E web)
- **Linter/Format** : ESLint + Prettier

## Workflow de Développement

- Développement web d'abord (`ionic serve`), puis validation sur device/émulateur
- Chaque feature est développée dans une branche dédiée (`feature/nom-feature`)
- Les plugins Capacitor sont synchronisés après chaque ajout (`npx cap sync`)
- Les builds natifs passent par `ionic build` avant `npx cap open ios|android`
- Pas de code natif custom sans justification documentée

## Gouvernance

Cette constitution prévaut sur toute autre décision de conception; Tout écart doit être documenté et approuvé; Les dépendances nouvelles doivent être compatibles Capacitor/Ionic avant ajout.

**Version**: 1.0.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-18
