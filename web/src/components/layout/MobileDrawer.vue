<template>
  <a-drawer
    :visible="visible"
    :width="280"
    placement="left"
    :closable="false"
    @cancel="$emit('update:visible', false)"
  >
    <template #title>
      <div class="drawer-header">
        <span class="logo-icon">🌱</span>
        <span class="logo-text">AgriSol-AI</span>
      </div>
    </template>

    <a-menu
      :default-selected-keys="[currentRoute]"
      @menu-item-click="handleMenuClick"
    >
      <a-menu-item key="home">
        <template #icon>
          <icon-home />
        </template>
        首页
      </a-menu-item>

      <a-menu-item key="crop">
        <template #icon>
          <span style="font-size: 18px;">🌾</span>
        </template>
        作物分析
      </a-menu-item>

      <a-menu-item key="energy">
        <template #icon>
          <span style="font-size: 18px;">⚡</span>
        </template>
        能源监测
      </a-menu-item>

      <a-menu-item key="carbon">
        <template #icon>
          <span style="font-size: 18px;">🌍</span>
        </template>
        碳排放
      </a-menu-item>

      <a-menu-item key="wisdom">
        <template #icon>
          <span style="font-size: 18px;">📝</span>
        </template>
        农事记录
      </a-menu-item>
    </a-menu>
  </a-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconHome } from '@arco-design/web-vue/es/icon'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  return path.slice(1)
})

const handleMenuClick = (key) => {
  const path = key === 'home' ? '/' : `/${key}`
  router.push(path)
  emit('update:visible', false)
}
</script>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
