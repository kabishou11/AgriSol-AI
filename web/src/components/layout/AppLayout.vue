<template>
  <a-layout class="app-layout">
    <AppHeader
      :collapsed="collapsed"
      @toggle-sidebar="toggleSidebar"
    />
    <a-layout>
      <AppSidebar
        :collapsed="collapsed"
        @update:collapsed="collapsed = $event"
      />
      <a-layout-content class="main-content">
        <AppBreadcrumb />
        <div class="content-wrapper">
          <slot />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppBreadcrumb from './AppBreadcrumb.vue'

const collapsed = ref(false)

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.main-content {
  background: var(--bg-secondary);
  min-height: calc(100vh - var(--header-height));
  margin-top: var(--header-height);
}

.content-wrapper {
  padding: var(--spacing-lg);
  max-width: var(--container-max-width);
  margin: 0 auto;
}

@media (max-width: 767px) {
  .content-wrapper {
    padding: var(--spacing-md);
  }
}
</style>
