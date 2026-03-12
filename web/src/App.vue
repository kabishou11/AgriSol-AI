<template>
  <AppLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <GlobalAiAssistant />
  </AppLayout>
</template>

<script setup>
import AppLayout from './components/layout/AppLayout.vue'
import GlobalAiAssistant from './components/GlobalAiAssistant.vue'
</script>

<style>
@import './styles/variables.css';
@import './styles/global.css';
@import './styles/animations.css';
@import './styles/responsive.css';
</style>
