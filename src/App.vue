<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
</script>

<style>
/* ═══════════════════════════════════════════════════════════════
   TransMed — Design System Global
   Application médicale solidaire — Afrique
   Palette : vert médical × terre chaude × sable
   ═══════════════════════════════════════════════════════════════ */

/* ── Tokens de marque ── */
:root {
  --tm-green:         #1B8C5A;
  --tm-green-light:   #E8F7F0;
  --tm-green-dark:    #146B45;
  --tm-green-xlight:  #F2FAF6;

  --tm-terra:         #C8521A;
  --tm-terra-light:   #FDF0E8;
  --tm-terra-dark:    #A94517;

  --tm-blue:          #2B7CC1;
  --tm-blue-light:    #EAF3FB;

  --tm-gold:          #C9820A;
  --tm-gold-light:    #FEF9EC;
  --tm-gold-bright:   #F5C518;

  --tm-bg:            #F7F3ED;
  --tm-surface:       #FFFFFF;
  --tm-text:          #1A1510;
  --tm-text-2:        #4A3F38;
  --tm-muted:         #7A6E65;
  --tm-border:        #E8E1D9;
  --tm-border-dark:   #D5C9BE;

  --tm-danger:        #C0392B;
  --tm-danger-light:  #FDEDEC;
  --tm-warning:       #D68910;
  --tm-warning-light: #FEF9EC;

  --tm-shadow:        0 2px 12px rgba(26, 21, 16, 0.07);
  --tm-shadow-md:     0 4px 20px rgba(26, 21, 16, 0.10);
  --tm-shadow-lg:     0 8px 32px rgba(26, 21, 16, 0.16);

  --tm-r-xs: 6px;
  --tm-r-sm: 8px;
  --tm-r-md: 12px;
  --tm-r-lg: 16px;
  --tm-r-xl: 20px;

  /* ── Override thème Ionic ── */
  --ion-color-primary:              #1B8C5A;
  --ion-color-primary-rgb:          27, 140, 90;
  --ion-color-primary-contrast:     #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade:        #146B45;
  --ion-color-primary-tint:         #E8F7F0;

  --ion-color-secondary:            #2B7CC1;
  --ion-color-secondary-rgb:        43, 124, 193;
  --ion-color-secondary-contrast:   #ffffff;
  --ion-color-secondary-shade:      #2166A3;
  --ion-color-secondary-tint:       #EAF3FB;

  --ion-color-tertiary:             #C8521A;
  --ion-color-tertiary-rgb:         200, 82, 26;
  --ion-color-tertiary-contrast:    #ffffff;
  --ion-color-tertiary-shade:       #A94517;
  --ion-color-tertiary-tint:        #FDF0E8;

  --ion-color-success:              #1B8C5A;
  --ion-color-success-rgb:          27, 140, 90;
  --ion-color-success-contrast:     #ffffff;
  --ion-color-success-shade:        #146B45;
  --ion-color-success-tint:         #E8F7F0;

  --ion-color-warning:              #D68910;
  --ion-color-warning-rgb:          214, 137, 16;
  --ion-color-warning-contrast:     #ffffff;
  --ion-color-warning-shade:        #B57410;
  --ion-color-warning-tint:         #FEF9EC;

  --ion-color-danger:               #C0392B;
  --ion-color-danger-rgb:           192, 57, 43;
  --ion-color-danger-contrast:      #ffffff;
  --ion-color-danger-shade:         #A03020;
  --ion-color-danger-tint:          #FDEDEC;

  --ion-color-medium:               #7A6E65;
  --ion-color-medium-rgb:           122, 110, 101;
  --ion-color-medium-contrast:      #ffffff;
  --ion-color-medium-shade:         #665E56;
  --ion-color-medium-tint:          #8C8078;

  --ion-color-light:                #F7F3ED;
  --ion-color-light-rgb:            247, 243, 237;
  --ion-color-light-contrast:       #1A1510;
  --ion-color-light-shade:          #ECE8E0;
  --ion-color-light-tint:           #FAF7F3;

  --ion-background-color:           #F7F3ED;
  --ion-background-color-rgb:       247, 243, 237;
  --ion-text-color:                 #1A1510;
  --ion-text-color-rgb:             26, 21, 16;

  --ion-toolbar-background:         #FFFFFF;
  --ion-toolbar-border-color:       #E8E1D9;
  --ion-toolbar-color:              #1A1510;

  --ion-tab-bar-background:         #FFFFFF;
  --ion-tab-bar-border-color:       #E8E1D9;
  --ion-tab-bar-color:              #7A6E65;
  --ion-tab-bar-color-selected:     #1B8C5A;

  --ion-card-background:            #FFFFFF;
  --ion-card-color:                 #1A1510;

  --ion-item-background:            #FFFFFF;
  --ion-item-color:                 #1A1510;
  --ion-item-border-color:          #E8E1D9;
}

/* ── Transition de page ── */
ion-page {
  animation: tmPageEnter 0.28s cubic-bezier(0.22, 0.68, 0, 1.1) both;
}

@keyframes tmPageEnter {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Toolbar ── */
ion-toolbar {
  --border-color: #E8E1D9;
  --border-width: 0 0 1px 0;
}

ion-title {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  color: #1A1510;
}

/* ── Back button ── */
ion-back-button {
  --color: #1B8C5A;
}

/* ── Card ── */
ion-card {
  --background: #FFFFFF;
  border-radius: 14px !important;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.07) !important;
  border: 1px solid #E8E1D9;
  margin: 0 0 12px 0;
}

ion-card-title {
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  color: #1A1510;
}

ion-card-header {
  padding-bottom: 8px;
}

/* ── Boutons ── */
ion-button {
  --border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  font-size: 0.92rem;
}

ion-button[expand="block"] {
  height: 50px;
}

ion-button::part(native) {
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

ion-button:active::part(native) {
  transform: scale(0.97);
}

/* ── FAB ── */
ion-fab-button {
  --background: #1B8C5A;
  --background-hover: #146B45;
  --background-activated: #146B45;
  --color: #ffffff;
  --box-shadow: 0 4px 18px rgba(27, 140, 90, 0.42);
  animation: tmFabPulse 3s ease-in-out 1.5s infinite;
}

@keyframes tmFabPulse {
  0%, 100% { box-shadow: 0 4px 18px rgba(27, 140, 90, 0.42); }
  50%       { box-shadow: 0 4px 28px rgba(27, 140, 90, 0.62), 0 0 0 6px rgba(27, 140, 90, 0.12); }
}

/* ── Tab bar ── */
ion-tab-bar {
  box-shadow: 0 -2px 14px rgba(26, 21, 16, 0.07);
  height: 62px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

ion-tab-button {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: color 0.2s;
}

/* ── Progress bar ── */
ion-progress-bar {
  --progress-background: #1B8C5A;
  --buffer-background: #E8F7F0;
  border-radius: 100px;
  overflow: hidden;
}

/* ── Badge ── */
ion-badge {
  border-radius: 100px;
  padding: 3px 10px;
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.01em;
}

/* ── Spinner ── */
ion-spinner {
  color: #1B8C5A;
}

/* ── Content ── */
ion-content {
  --background: #F7F3ED;
}

/* ── Items ── */
ion-item {
  --inner-border-width: 0;
}

/* ── Input ── */
ion-input {
  --highlight-color-focused: #1B8C5A;
  --highlight-color-valid: #1B8C5A;
}

/* ── Note ── */
ion-note[color="danger"] { color: #C0392B; }
ion-note[color="success"] { color: #1B8C5A; }

/* ── Modal ── */
ion-modal::part(content) {
  border-radius: 20px 20px 0 0;
}

/* ══════════════════════════════════════════
   Keyframes réutilisables dans toute l'app
   ══════════════════════════════════════════ */

@keyframes tmFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes tmFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes tmPop {
  0%   { transform: scale(0.8); opacity: 0; }
  65%  { transform: scale(1.07); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes tmSlideRight {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes tmFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

@keyframes tmPulseRing {
  0%   { box-shadow: 0 0 0 0 rgba(27, 140, 90, 0.45); }
  70%  { box-shadow: 0 0 0 9px rgba(27, 140, 90, 0); }
  100% { box-shadow: 0 0 0 0 rgba(27, 140, 90, 0); }
}

@keyframes tmGoldPulseRing {
  0%   { box-shadow: 0 0 0 0 rgba(201, 130, 10, 0.5); }
  70%  { box-shadow: 0 0 0 10px rgba(201, 130, 10, 0); }
  100% { box-shadow: 0 0 0 0 rgba(201, 130, 10, 0); }
}

@keyframes tmCelebrate {
  0%   { transform: scale(1); }
  15%  { transform: scale(1.22) rotate(-5deg); }
  30%  { transform: scale(1.14) rotate(5deg); }
  45%  { transform: scale(1.08) rotate(-3deg); }
  60%  { transform: scale(1.04) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes tmShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}

@keyframes tmShake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-9px); }
  40%       { transform: translateX(9px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
}

@keyframes tmBounceIn {
  0%   { transform: scale(0); opacity: 0; }
  55%  { transform: scale(1.18); opacity: 1; }
  75%  { transform: scale(0.93); }
  100% { transform: scale(1); }
}

@keyframes tmMessageIn {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes tmStarBurst {
  0%   { transform: scale(0) rotate(0deg); opacity: 1; }
  80%  { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(180deg); opacity: 0.8; }
}
</style>
