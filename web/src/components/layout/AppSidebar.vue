<template>
  <a-layout-sider
    :collapsed="collapsed"
    :width="240"
    :collapsed-width="64"
    class="app-sidebar"
    collapsible
    @collapse="handleCollapse"
  >
    <a-menu
      :default-selected-keys="[currentRoute]"
      :style="{ marginTop: '20px' }"
      @menu-item-click="handleMenuClick"
    >
      <a-menu-item key="home">
        <template #icon>
          <icon-home />
        </template>
        首页
      </a-menu-item>

      <a-menu-item key="dashboard">
        <template #icon>
          <icon-dashboard />
        </template>
        数据仪表板
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

      <a-menu-item key="profile">
        <template #icon>
          <icon-user />
        </template>
        个人中心
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconHome, IconDashboard, IconUser } from '@arco-design/web-vue/es/icon'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:collapsed'])

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
}

const handleCollapse = (collapsed) => {
  emit('update:collapsed', collapsed)
}
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  left: 0;
  top: var(--header-height);
  bottom: 0;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  z-index: var(--z-sticky);
}

@media (max-width: 767px) {
  .app-sidebar {
    transform: translateX(-100%);
  }

  .app-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}
</style>
