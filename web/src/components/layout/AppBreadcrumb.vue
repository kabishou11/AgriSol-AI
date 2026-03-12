<template>
  <a-breadcrumb class="app-breadcrumb" v-if="breadcrumbs.length > 0">
    <a-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
      <router-link v-if="item.path && index < breadcrumbs.length - 1" :to="item.path">
        {{ item.label }}
      </router-link>
      <span v-else>{{ item.label }}</span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const routeMap = {
  '/': { label: '首页', path: '/' },
  '/crop': { label: '作物分析', path: '/crop' },
  '/energy': { label: '能源监测', path: '/energy' },
  '/carbon': { label: '碳排放', path: '/carbon' },
  '/wisdom': { label: '农事记录', path: '/wisdom' }
}

const breadcrumbs = computed(() => {
  const path = route.path
  const items = [{ label: '首页', path: '/' }]

  if (path !== '/' && routeMap[path]) {
    items.push(routeMap[path])
  }

  return items
})
</script>

<style scoped>
.app-breadcrumb {
  padding: var(--spacing-md) 0;
  background: transparent;
}
</style>
